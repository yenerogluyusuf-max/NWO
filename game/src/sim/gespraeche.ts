// Gespräche mit den Menschen um den Präsidenten. Ein Gespräch ist eine kurze Szene: Man wählt ein Thema aus der Lage (Ressort, offene
// Ereignisse, Zusagen, die Person selbst) und einen Ansatz (Vertrauen aufbauen, um Rat bitten, einen Auftrag mit Frist erteilen,
// Kritik üben, Anerkennung und Mittel geben, öffentlich Rückendeckung geben, die Machtfrage stellen). Jeder Ansatz kostet Kapital
// oder Zeit und hat Folgen, die später wiederkehren: Loyalität, Groll, Ehrgeiz, Aufträge mit Frist, Durchstechereien, Rücktritte.
// Rat ist keine Erzählung, sondern aus dem Weltzustand gerechnet: mit Zahlen, Kosten und Mehrheitsaussicht der vorgeschlagenen Schritte.
// Die Vorschau (`planeGespraech`) und die Ausführung (`fuehreGespraech`) rechnen dieselben Zahlen; eine Oberfläche oder das Sprachmodell
// wählt nur aus, was `themenFuer` und `ansaetzeFuer` anbieten.

import { NET } from "./modell";
import { activeProvinces } from "./netz";
import { wirke, vertrauenAendern } from "./wirkung";
import { addLog } from "./log";
import { addDays, formatDateDe } from "./dates";
import { kannZahlen } from "./kapital";
import { clamp } from "./economy";
import { pruefeVorhaben, stufeIn } from "./handeln";
import { anliegenStand, LAENDER, vertrauenZu, weltZustand } from "./laender";
import { zusagenSicht, zusageVorhaben } from "./zusagen";
import {
  AEMTER, amtDef, eigenVon, erinnerungen, figurNachId, grollVerschieben, grollWort, HOCH_SCHLECHT, hashZahl, lageIm, leistung, leistungWort,
  loyalitaetVerschieben, merke, nf, schlechtesteGroesse, sorgeText, sprechbar, wertVon,
} from "./personen";
import type { Auftrag, Stil } from "./personen-typen";
import type { World } from "./types";
import type { Figur } from "./spiel-typen";

const k100 = (x: number): number => Math.min(100, Math.max(0, x));

export const GESPRAECH_ABKUEHLUNG = 21;
/** Höchstens so viele Termine in dreißig Tagen: Der Präsident hat nur begrenzt Zeit. */
export const MAX_TERMINE = 4;
export const AUFTRAG_TAGE = 180;

export type AnsatzId = "vertrauen" | "rat" | "auftrag" | "kritik" | "belohnung" | "rueckendeckung" | "machtfrage";

export interface Thema {
  id: string;
  titel: string;
  text: string;
  art: "sorge" | "lage" | "ereignis" | "zusage" | "person";
  /** Größe (bei Lage und Sorge), Ereignis- oder Zusage-Kennung */
  bezug?: string;
  dringlich?: boolean;
}

export interface Plan {
  ansatz: AnsatzId;
  pk: number;
  /** Warum der Ansatz gerade nicht geht; sonst leer */
  grund?: string;
  dLoy: number;
  dGroll: number;
  dEhrgeiz: number;
  /** Was er bewirkt, in Worten mit Zahlen */
  folgen: string[];
  /** Ob es gut ausgehen dürfte (bei Wagnissen) */
  aussicht?: "gut" | "offen" | "schlecht";
}

export const ANSATZ_NAMEN: Record<AnsatzId, { label: string; kurz: string }> = {
  vertrauen: { label: "Vertrauen aufbauen", kurz: "Ein offenes Gespräch unter vier Augen." },
  rat: { label: "Um Rat bitten", kurz: "Sie nennt Zahlen und Schritte aus ihrem Ressort." },
  auftrag: { label: "Auftrag mit Frist", kurz: "Ein messbares Ziel, das sie in sechs Monaten erreichen soll." },
  kritik: { label: "Kritik üben", kurz: "Mehr Einsatz, aber auf Kosten von Loyalität und Ruhe." },
  belohnung: { label: "Anerkennung und Mittel", kurz: "Lob, Zusatzmittel für das Ressort, Neid bei den anderen." },
  rueckendeckung: { label: "Rückendeckung geben", kurz: "Öffentlich hinter ihr stehen, wenn sie unter Druck ist." },
  machtfrage: { label: "Die Machtfrage stellen", kurz: "Ein Ultimatum: mit mir oder gegen mich." },
};

export const ANSATZ_REIHENFOLGE: AnsatzId[] = ["rat", "vertrauen", "auftrag", "belohnung", "kritik", "rueckendeckung", "machtfrage"];

const datumAn = (w: World, tag: number): string => formatDateDe(addDays(w.spiel!.start.datum, tag));

// ---------------------------------------------------------------------------
// Ereignisse, die ein Ressort betreffen

export const EREIGNIS_BEZUG: Record<string, { amt: Figur["amt"][]; titel: string }> = {
  grenzzwischenfall: { amt: ["inneres", "aussen", "generalstab"], titel: "Der Grenzzwischenfall" },
  eu_angebot: { amt: ["aussen", "wirtschaft", "justiz"], titel: "Das Angebot der EU" },
  iwf_angebot: { amt: ["finanzen"], titel: "Das Angebot des IWF" },
  ratingagentur: { amt: ["finanzen"], titel: "Die Ratingagentur" },
  nato_ratifizierung: { amt: ["aussen", "generalstab"], titel: "Die NATO-Ratifizierung" },
  gasvertrag: { amt: ["aussen", "wirtschaft"], titel: "Der Gasvertrag" },
  gasfund: { amt: ["wirtschaft"], titel: "Der Gasfund" },
  cyberangriff: { amt: ["inneres", "generalstab"], titel: "Der Cyberangriff" },
  weltwirtschaftskrise: { amt: ["finanzen", "wirtschaft", "zentralbank"], titel: "Die Weltwirtschaftskrise" },
  pandemie: { amt: ["stab", "inneres"], titel: "Die Seuche" },
  bankenstress: { amt: ["finanzen", "zentralbank"], titel: "Der Stress im Bankensystem" },
  waehrungsrutsch: { amt: ["finanzen", "zentralbank"], titel: "Der Absturz der Lira" },
  haushaltsdruck: { amt: ["finanzen", "zentralbank"], titel: "Der Druck auf den Haushalt" },
  energiepreisschock: { amt: ["wirtschaft", "finanzen"], titel: "Der Energiepreisschock" },
  korruptionsaffaere: { amt: ["justiz", "inneres", "stab"], titel: "Die Korruptionsaffäre" },
  streikwelle: { amt: ["wirtschaft", "inneres"], titel: "Die Streikwelle" },
  anschlag: { amt: ["inneres", "generalstab"], titel: "Der Anschlag" },
  fluechtlingswelle: { amt: ["inneres", "aussen"], titel: "Die Fluchtbewegung" },
  fabrikschliessungen: { amt: ["wirtschaft"], titel: "Die Fabrikschließungen" },
  erdbeben: { amt: ["stab", "inneres"], titel: "Das Erdbeben" },
  pressekonflikt: { amt: ["stab", "inneres"], titel: "Der Streit mit der Presse" },
  studentenproteste: { amt: ["inneres", "stab"], titel: "Die Studentenproteste" },
  buergermeister_verfahren: { amt: ["justiz", "inneres"], titel: "Das Verfahren gegen den Bürgermeister" },
  recht_ernennung: { amt: ["justiz"], titel: "Die Besetzung am Verfassungsgericht" },
  recht_aym_kassation: { amt: ["justiz"], titel: "Der Streit der Höchstgerichte" },
  recht_egmr: { amt: ["justiz", "aussen"], titel: "Das Urteil aus Straßburg" },
  recht_haftrevolte: { amt: ["justiz", "inneres"], titel: "Die Unruhen im Gefängnis" },
  mil_lieferverzug: { amt: ["generalstab"], titel: "Der Lieferverzug bei der Rüstung" },
  mil_militaerrat: { amt: ["generalstab"], titel: "Der Oberste Militärrat" },
  land_fordert: { amt: ["aussen"], titel: "Die Forderung eines Partnerlandes" },
  land_angebot: { amt: ["aussen"], titel: "Das Angebot eines Partnerlandes" },
  land_provokation: { amt: ["aussen", "generalstab"], titel: "Die Provokation an der Grenze" },
  mindestlohn: { amt: ["wirtschaft", "finanzen"], titel: "Der Mindestlohn" },
  haushaltsjahr: { amt: ["finanzen"], titel: "Der Haushalt für das nächste Jahr" },
  kommunalwahl: { amt: ["stab"], titel: "Die Kommunalwahlen" },
};

// ---------------------------------------------------------------------------
// Themen

export function themenFuer(w: World, figurId: string): Thema[] {
  const sp = w.spiel;
  const f = figurNachId(w, figurId);
  if (!sp || !f || !sprechbar(f)) return [];
  const out: Thema[] = [];
  out.push({ id: "sorge", titel: "Was sie gerade umtreibt", text: sorgeText(w, f), art: "sorge" });

  // Die schwächsten Größen des Ressorts
  const lage = lageIm(w, f)
    .map((l) => ({ l, schlecht: l.schlechtWennHoch ? l.wert : 100 - l.wert }))
    .sort((a, b) => b.schlecht - a.schlecht)
    .slice(0, 2);
  for (const { l } of lage) {
    const ton = l.ton === "schlecht" ? "steht schlecht" : l.ton === "mittel" ? "steht mittelmäßig" : "steht gut";
    out.push({ id: `lage:${l.id}`, titel: `Lage: ${l.name}`, text: `${l.name} ${ton}: ${Math.round(l.wert)} von 100${l.schlechtWennHoch ? " (hoch ist schlecht)" : ""}.`, art: "lage", bezug: l.id, dringlich: l.ton === "schlecht" });
  }

  // Offene Ereignisse im Ressort
  for (const ev of sp.ereignisse) {
    const b = EREIGNIS_BEZUG[ev.vorlage];
    if (b && b.amt.includes(f.amt)) out.push({ id: `ereignis:${ev.id}`, titel: b.titel, text: `${b.titel} wartet auf eine Antwort des Präsidenten; das Ressort ist betroffen.`, art: "ereignis", bezug: ev.id, dringlich: true });
  }

  // Zusagen, die diese Person betreffen
  for (const z of zusagenSicht(w)) {
    const trifft = z.bezug.id === f.id || (f.partei !== undefined && f.partei === z.z.von) || (z.z.massnahme !== undefined && amtDef(f).massnahmen.includes(z.z.massnahme));
    if (trifft) out.push({ id: `zusage:${z.z.id}`, titel: `Zusage: ${z.z.text.length > 60 ? `${z.z.text.slice(0, 57)}…` : z.z.text}`, text: `Fällig ${z.tage < 0 ? "seit" : "in"} ${Math.abs(z.tage)} Tagen (${formatDateDe(z.datum)}).`, art: "zusage", bezug: z.z.id, dringlich: z.dringlichkeit === "dringend" || z.dringlichkeit === "ueberfaellig" });
  }

  out.push({ id: "person", titel: "Die Person selbst", text: `${f.name} und die eigene Zukunft: Ehrgeiz, Erwartungen an Sie, was ${f.weiblich ? "sie" : "er"} von der Zusammenarbeit will.`, art: "person" });
  return out.slice(0, 7);
}

// ---------------------------------------------------------------------------
// Termine

function termine(w: World): number[] {
  const sp = w.spiel;
  if (!sp) return [];
  return (sp.termine ?? []).filter((t) => t > w.day - 30);
}

export function termineInfo(w: World): { belegt: number; max: number } {
  return { belegt: termine(w).length, max: MAX_TERMINE };
}

function terminGrund(w: World, f: Figur): string | undefined {
  const rest = (f.gespraech ?? -1e9) + GESPRAECH_ABKUEHLUNG - w.day;
  if (rest > 0) return `Sie haben vor Kurzem mit ${f.name} gesprochen: wieder sinnvoll in ${rest} Tagen.`;
  if (termine(w).length >= MAX_TERMINE) return `In den letzten dreißig Tagen liegen schon ${MAX_TERMINE} Gespräche; mehr Termine hat der Tag des Präsidenten nicht.`;
  return undefined;
}

// ---------------------------------------------------------------------------
// Rat: Schritte aus dem Politiknetz, mit Kosten und Mehrheitsaussicht

export interface Schritt {
  id: string;
  name: string;
  von: number;
  nach: number;
  pk: number;
  kostenBip: number;
  luecke: number;
  wirkt: string;
  eigenesRessort: boolean;
}

function schritteFuer(w: World, f: Figur, groesse: string, richtung: 1 | -1, n = 2): Schritt[] {
  const gi = NET.index.get(groesse);
  if (gi === undefined) return [];
  const eigene = new Set(amtDef(f).massnahmen);
  const stil = eigenVon(w, f).stil;
  const kandidaten: { s: Schritt; punkte: number }[] = [];
  const gesehen = new Set<string>();
  NET.edges.forEach((e, k) => {
    if (NET.edgeTo[k] !== gi) return;
    const mi = NET.edgeFrom[k]!;
    const node = NET.nodes[mi]!;
    if (node.kind !== "massnahme" || gesehen.has(node.id)) return;
    gesehen.add(node.id);
    const gewicht = e.weight;
    const heben = Math.sign(gewicht) * richtung > 0;
    const von = stufeIn(w, node.id, null);
    const nach = clamp(Math.round(von + (heben ? 20 : -20)), 0, 100);
    if (Math.abs(nach - von) < 5) return;
    const pr = pruefeVorhaben(w, node.id, nach);
    if (!pr.ok) return;
    const pk = pr.gesetz.pk;
    const stark = Math.abs(gewicht);
    const eigen = eigene.has(node.id);
    let punkte = stark / Math.max(3, pk);
    if (stil === "vorsichtig") punkte = stark / Math.pow(Math.max(3, pk), 1.5);
    else if (stil === "machtbewusst") punkte = stark * (1 + Math.min(1, pk / 20) * 0.3);
    else if (stil === "eitel" && eigen) punkte *= 2;
    else if (eigen) punkte *= 1.15;
    kandidaten.push({ s: { id: node.id, name: node.name, von: Math.round(von), nach, pk, kostenBip: pr.kostenBip, luecke: pr.gesetz.stimmen.luecke, wirkt: NET.nodes[gi]!.name, eigenesRessort: eigen }, punkte });
  });
  return kandidaten.sort((a, b) => b.punkte - a.punkte).slice(0, n).map((k) => k.s);
}

function schrittText(s: Schritt): string {
  const bip = Math.abs(s.kostenBip) >= 0.05 ? `${nf(Math.abs(s.kostenBip), 2)} % des BIP im Jahr` : "";
  const kosten = s.kostenBip <= -0.05 ? `${s.pk} Kapital und bringt ${bip} ein` : `${s.pk} Kapital${bip ? ` und ${bip}` : ""}`;
  const mehrheit = s.luecke > 0 ? `im Parlament fehlen etwa ${s.luecke} Stimmen` : "die Mehrheit im Parlament steht";
  return `„${s.name}“ von Stufe ${s.von} auf ${s.nach}: wirkt auf ${s.wirkt}; das kostet ${kosten}, ${mehrheit}.`;
}

/** Was die Person über ihr Ressort weiß und Ihnen nur sagt, wenn sie Ihnen folgt: ein Fakt mit Zahl aus dem Weltzustand. */
function insiderFakt(w: World, f: Figur): string | undefined {
  const e = w.economy;
  const sp = w.spiel!;
  switch (f.amt) {
    case "finanzen":
      return `Die beschlossenen Maßnahmen kosten ${nf(Math.abs(e.policyCost), 2)} % des BIP im Jahr ${e.policyCost >= 0 ? "mehr" : "weniger"} als zu Beginn; der Risikoaufschlag liegt bei ${Math.round(e.riskPremium)} Punkten.`;
    case "inneres": {
      const n = activeProvinces(NET, w.net, "p_kriminalitaet").length;
      const t = activeProvinces(NET, w.net, "p_migrationsdruck").length;
      return n + t > 0 ? `In ${n} Provinzen ist die Unsicherheit akut, in ${t} der Druck durch Migration; dorthin gehören die Kräfte.` : "Keine Provinz meldet akute Unsicherheit.";
    }
    case "aussen": {
      const schlecht = LAENDER.map((l) => ({ l, v: vertrauenZu(w, l.id), a: anliegenStand(w, l.id) })).sort((a, b) => a.v - b.v)[0];
      if (!schlecht) return undefined;
      const offen = schlecht.a.filter((x) => !x.erfuellt).length;
      return `${schlecht.l.name} steht mit Vertrauen ${Math.round(schlecht.v)} am schlechtesten da; von ${schlecht.a.length} Anliegen sind ${offen} unerfüllt${weltZustand(w)[schlecht.l.id]!.konflikt >= 60 ? " und der Streit ist offen" : ""}.`;
    }
    case "zentralbank":
      return `Die Inflationserwartung liegt bei ${nf(e.expectedInflation)} % bei einer Inflation von ${nf(e.inflation)} %; die Glaubwürdigkeit der Bank beträgt ${Math.round(e.credibility * 100)} von 100.`;
    case "stab": {
      const offen = sp.zusagen.filter((z) => !z.erfuellt && !z.gebrochen);
      const bald = offen.sort((a, b) => a.faellig - b.faellig)[0];
      return `Bis zur Wahl bleiben ${Math.max(0, Math.round((sp.wahltag - w.day) / 30))} Monate; ${bald ? `die nächste Zusage ist in ${Math.max(0, bald.faellig - w.day)} Tagen fällig` : "keine Zusage ist offen"}, und die Zustimmung liegt bei ${nf(sp.umfrage.zustimmung)} %.`;
    }
    case "justiz":
      return `Die Justiz arbeitet mit einer Effizienz von ${Math.round(wertVon(w, "justiz_effizienz"))} von 100; die Haftanstalten sind zu ${Math.round(wertVon(w, "haftueberfuellung"))} von 100 überfüllt.`;
    case "generalstab":
      return `Heer ${Math.round(wertVon(w, "bereitschaft_heer"))}, Luftwaffe ${Math.round(wertVon(w, "bereitschaft_luft"))}, Marine ${Math.round(wertVon(w, "bereitschaft_see"))} von 100 einsatzbereit; die Truppenmoral liegt bei ${Math.round(wertVon(w, "truppenmoral"))}.`;
    case "wirtschaft":
      return `Das Wachstum liegt bei ${nf(e.growth)} %, die Arbeitslosigkeit bei ${nf(e.unemployment)} %; Auslandskapital steht bei ${Math.round(wertVon(w, "auslandskapital"))} von 100.`;
    case "partner":
      return `Seine Partei hat ${w.parliament?.seats[f.partei ?? ""] ?? 0} Sitze; verlässt sie das Lager, fehlen Ihnen diese Stimmen bei jeder Abstimmung.`;
    default:
      return undefined;
  }
}

export function ratHinweise(w: World, f: Figur, thema: Thema): string[] {
  const e = eigenVon(w, f);
  const out: string[] = [];
  let groesse = thema.art === "lage" || thema.art === "sorge" ? thema.bezug : undefined;
  if (thema.art === "sorge") groesse = schlechtesteGroesse(w, f)?.id;
  if (thema.art === "ereignis") groesse = schlechtesteGroesse(w, f)?.id;
  if (thema.art === "zusage") {
    const z = w.spiel!.zusagen.find((x) => x.id === thema.bezug);
    const v = zusageVorhaben(w, z);
    if (v) {
      out.push(`Die Zusage verlangt „${v.name}“ von Stufe ${Math.round(v.jetzt)} auf ${v.ziel}: ${v.pr.ok ? `das kostet ${v.pr.gesetz.pk} Kapital, ${v.pr.gesetz.stimmen.luecke > 0 ? `im Parlament fehlen etwa ${v.pr.gesetz.stimmen.luecke} Stimmen` : "die Mehrheit steht"}` : "die Maßnahme steht schon dort"}.`);
      if (v.pr.ok && !kannZahlen(w.spiel!.kapital, v.pr.gesetz.pk)) out.push("Das Kapital reicht dafür nicht; wer jetzt vertröstet, gewinnt drei Monate, aber Geduld.");
    }
    return out;
  }
  if (groesse) {
    const l = lageIm(w, f).find((x) => x.id === groesse) ?? { name: NET.nodes[NET.index.get(groesse)!]!.name, wert: wertVon(w, groesse), schlechtWennHoch: HOCH_SCHLECHT.has(groesse) };
    const richtung: 1 | -1 = l.schlechtWennHoch ? -1 : 1;
    const schritte = schritteFuer(w, f, groesse, richtung, 2);
    if (schritte.length) {
      out.push(`${l.name} steht bei ${Math.round(l.wert)} von 100. Was ${f.weiblich ? "sie" : "er"} vorschlägt:`);
      for (const s of schritte) out.push(schrittText(s));
      if (e.stil === "eitel" && schritte.some((s) => s.eigenesRessort)) out.push("Auffällig: Die Vorschläge stärken vor allem sein eigenes Ressort.");
      if (e.stil === "vorsichtig") out.push("Sie rät zu den günstigen Schritten; bei den teuren wartet sie ab.");
      if (e.stil === "machtbewusst") out.push("Er rät zu den wirksamsten Schritten, gleich, was sie kosten.");
    } else {
      out.push(`${l.name} steht bei ${Math.round(l.wert)} von 100; ${f.weiblich ? "sie" : "er"} sieht keinen Schritt, der sich lohnt: Entweder ist die Stufe erreicht oder die Wirkung zu klein.`);
    }
  }
  // Wer dem Präsidenten folgt, sagt mehr
  if (f.loyalitaet >= 60) {
    const fakt = insiderFakt(w, f);
    if (fakt) out.push(`Vertraulich: ${fakt}`);
  } else if (f.loyalitaet >= 40) {
    out.push(`${f.weiblich ? "Sie" : "Er"} hält sich zurück: Mit mehr Loyalität (ab 60) gäbe es auch die vertraulichen Zahlen.`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Pläne: Vorschau und Rechenkern zugleich

const STIL_VERTRAUEN: Record<Stil, number> = { loyal: 1.25, eitel: 1, nuechtern: 1, vorsichtig: 0.9, streng: 0.8, machtbewusst: 0.85 };

function machtScore(w: World, f: Figur): number {
  const e = eigenVon(w, f);
  return f.loyalitaet + 0.3 * (100 - e.ehrgeiz) - 0.4 * e.groll + (e.stil === "loyal" ? 8 : e.stil === "machtbewusst" ? -10 : 0);
}

export const MACHT_SCHWELLE = 45;

function themaGroesse(w: World, f: Figur, t: Thema): string | undefined {
  if (t.art === "lage") return t.bezug;
  if (t.art === "sorge" || t.art === "ereignis") return schlechtesteGroesse(w, f)?.id;
  return undefined;
}

export function planeGespraech(w: World, figurId: string, themaId: string, ansatz: AnsatzId): Plan | { grund: string } {
  const sp = w.spiel;
  const f = figurNachId(w, figurId);
  if (!sp || !f) return { grund: "Diese Person gibt es in Ihrer Partie nicht." };
  if (!sprechbar(f)) return { grund: "Mit dem Oppositionsführer verhandeln Sie über die Fraktionen im Parlament." };
  const thema = themenFuer(w, figurId).find((t) => t.id === themaId);
  if (!thema) return { grund: "Dieses Thema steht gerade nicht an." };
  const d = amtDef(f);
  const e = eigenVon(w, f);
  const pron = f.weiblich ? "sie" : "er";
  const nach = (x: number) => Math.round(k100(f.loyalitaet + x));
  const plan: Plan = { ansatz, pk: 0, dLoy: 0, dGroll: 0, dEhrgeiz: 0, folgen: [] };
  const tg = terminGrund(w, f);
  const gr = themaGroesse(w, f, thema);
  const grName = gr ? NET.nodes[NET.index.get(gr) ?? -1]?.name : undefined;

  switch (ansatz) {
    case "vertrauen": {
      plan.pk = 1;
      let dLoy = 7 * STIL_VERTRAUEN[e.stil] + (thema.art === "sorge" || thema.art === "person" ? 3 : 0);
      plan.dGroll = -8;
      if (e.groll >= 40) {
        dLoy *= 0.5;
        plan.dGroll = -18;
      }
      plan.dLoy = Math.round(dLoy);
      if (f.loyalitaet >= 90) plan.grund = "Die Loyalität ist schon so hoch, dass Zuwendung nichts mehr bringt.";
      if (thema.art === "person" && e.ehrgeiz >= 65) plan.dEhrgeiz = 3;
      plan.folgen.push(`Loyalität +${plan.dLoy} (auf ${nach(plan.dLoy)})`, `Groll ${plan.dGroll} (${grollWort(e.groll)})`);
      if (plan.dEhrgeiz) plan.folgen.push(`${pron === "sie" ? "Sie" : "Er"} spricht von mehr Verantwortung: Ehrgeiz +${plan.dEhrgeiz}`);
      break;
    }
    case "rat": {
      plan.pk = 0;
      plan.dLoy = 2;
      if (f.loyalitaet < 30) plan.grund = `Bei Loyalität ${Math.round(f.loyalitaet)} rückt ${pron} keine Zahlen heraus (ab 30).`;
      else if (thema.art === "person") plan.grund = "Zu dieser Frage gibt es keinen fachlichen Rat.";
      plan.folgen.push("Konkrete Schritte mit Kosten und Mehrheitsaussicht aus dem Weltzustand", f.loyalitaet >= 60 ? "Vertrauliche Zahlen aus dem Ressort" : "Vertrauliche Zahlen erst ab Loyalität 60", "Loyalität +2 (Wertschätzung)");
      break;
    }
    case "auftrag": {
      plan.pk = 2;
      plan.dLoy = 0;
      if (!d.regierungsamt) plan.grund = f.amt === "zentralbank" ? "Aufträge an die Zentralbank wären Eingriffe in ihre Unabhängigkeit." : "Nur Mitglieder der Regierung nehmen Aufträge an.";
      else if (e.auftrag?.status === "laeuft") plan.grund = `Es läuft schon ein Auftrag: ${e.auftrag.text}`;
      else if (!gr) plan.grund = "Dafür braucht es ein Thema mit einer messbaren Größe (Lage oder Sorge).";
      else if (f.loyalitaet < 35) plan.grund = `Aufträge nimmt ${pron} nur von jemandem an, dem ${pron} folgt (Loyalität ab 35).`;
      const richtung = gr && HOCH_SCHLECHT.has(gr) ? -1 : 1;
      const wirkung = Math.round(0.6 * leistung(w, f) * 10) / 10;
      if (gr && !plan.grund) {
        const jetzt = wertVon(w, gr);
        plan.folgen.push(
          `Bis ${datumAn(w, w.day + AUFTRAG_TAGE)}: ${grName} von ${Math.round(jetzt)} auf ${Math.round(jetzt + richtung * 3)} (${richtung > 0 ? "mindestens 3 Punkte mehr" : "mindestens 3 Punkte weniger"})`,
          `${pron === "sie" ? "Sie" : "Er"} setzt das Ressort ein: etwa ${richtung > 0 ? "+" : "−"}${nf(wirkung)} Punkte im Monat, mehr mit Anerkennung`,
          "Erreicht: Loyalität +8, Ehrgeiz +3. Verfehlt: Loyalität −5, Groll +8",
        );
      }
      break;
    }
    case "kritik": {
      plan.pk = 0;
      const eitel = e.stil === "eitel" ? 4 : 0;
      const streng = e.stil === "streng" ? -2 : e.stil === "loyal" ? -1 : 0;
      plan.dLoy = -(5 + eitel + streng);
      plan.dGroll = 12 + (e.stil === "eitel" ? 6 : 0);
      if (!d.regierungsamt) plan.grund = f.amt === "zentralbank" ? "Kritik an der Zentralbank läuft über Zentralbank und Haushalt: Sie kostet Glaubwürdigkeit." : "Ein Bündnispartner lässt sich nicht kritisieren wie ein Ressortchef.";
      else if (thema.art === "person" || thema.art === "sorge") plan.grund = "Ohne konkreten Anlass ist Kritik nur Streit.";
      else if (thema.art === "lage" && lageIm(w, f).find((l) => l.id === thema.bezug)?.ton === "gut") plan.grund = "Die Lage steht gut; es gibt nichts zu kritisieren.";
      else if (thema.art === "zusage") plan.grund = "Eine Zusage ist keine Leistung des Ressorts.";
      plan.folgen.push(`Loyalität ${plan.dLoy} (auf ${nach(plan.dLoy)})`, `Groll +${plan.dGroll}`, "Sechzig Tage unter Druck: Ressortleistung +15 %");
      if (e.groll + plan.dGroll >= 50 && e.ehrgeiz >= 50) plan.folgen.push("Risiko: Aus dem Gespräch dringt etwas an die Presse (Vertrauen −0,4)");
      break;
    }
    case "belohnung": {
      plan.pk = 2;
      plan.dLoy = 10 + (e.stil === "eitel" ? 4 : 0);
      plan.dGroll = -10;
      plan.dEhrgeiz = 2;
      if (!d.regierungsamt) plan.grund = "Zusatzmittel gibt es nur für Ressorts der Regierung.";
      else if (e.mittelBis !== undefined && e.mittelBis > w.day + 60) plan.grund = "Das Ressort hat schon Zusatzmittel.";
      else if (f.loyalitaet >= 92) plan.grund = "Mehr Anerkennung würde nur Begehrlichkeiten wecken.";
      plan.folgen.push(`Loyalität +${plan.dLoy} (auf ${nach(plan.dLoy)}), Groll ${plan.dGroll}, Ehrgeiz +${plan.dEhrgeiz}`, `Zusatzmittel für ${d.ressort}: Leistung +25 % bis ${datumAn(w, w.day + AUFTRAG_TAGE)}`, "Neid: die anderen Regierungsmitglieder ärgern sich (Groll +3)");
      if (f.amt !== "finanzen") plan.folgen.push("Der Finanzminister mag die Ausgaben nicht (Loyalität −2)");
      break;
    }
    case "rueckendeckung": {
      plan.pk = 1;
      plan.dLoy = 9;
      plan.dGroll = -15;
      plan.dEhrgeiz = 1;
      if (e.groll < 20 && f.loyalitaet >= 45) plan.grund = `Niemand stellt ${f.name} infrage; öffentliche Rückendeckung wäre nur ein Zeichen der Unsicherheit.`;
      else if (!d.regierungsamt && f.amt !== "partner") plan.grund = "Rückendeckung gibt es für Menschen im eigenen Lager.";
      plan.folgen.push(`Loyalität +${plan.dLoy} (auf ${nach(plan.dLoy)}), Groll ${plan.dGroll}`, "Vertrauen in die Regierung −0,1: Blinde Rückendeckung hat einen Preis", "Ihr Lager nimmt es wahr: Loyalität der Nächststehenden +2");
      break;
    }
    case "machtfrage": {
      plan.pk = 0;
      const s = machtScore(w, f);
      plan.aussicht = s >= MACHT_SCHWELLE + 10 ? "gut" : s >= MACHT_SCHWELLE - 8 ? "offen" : "schlecht";
      if (f.loyalitaet >= 55 && e.groll < 40) plan.grund = "Es gibt keinen Anlass; ein Ultimatum an einen Verlässlichen erzeugt nur Ärger.";
      else if (f.amt === "zentralbank") plan.grund = "Die Zentralbank folgt keinem Ultimatum des Präsidenten.";
      plan.folgen.push(
        `Aussicht: ${plan.aussicht === "gut" ? "gut" : plan.aussicht === "offen" ? "offen" : "schlecht"}`,
        `Fügt ${pron} sich: Loyalität +6, Groll −10, Ehrgeiz −5`,
        `Fügt ${pron} sich nicht: ${d.regierungsamt ? "Rücktritt im Streit, ein Nachfolger muss her, der Vorgänger nimmt Groll mit" : "Bruch: das Bündnis wackelt (Loyalität −20)"}`,
      );
      break;
    }
  }
  if (!plan.grund && tg) plan.grund = tg;
  if (!plan.grund && !kannZahlen(sp.kapital, plan.pk)) plan.grund = `Dafür fehlen ${plan.pk} Kapital.`;
  return plan;
}

export interface AnsatzSicht {
  ansatz: AnsatzId;
  label: string;
  kurz: string;
  plan: Plan;
}

/** Alle Ansätze für ein Thema mit Vorschau und, falls nicht möglich, dem Grund. */
export function ansaetzeFuer(w: World, figurId: string, themaId: string): AnsatzSicht[] {
  const out: AnsatzSicht[] = [];
  for (const a of ANSATZ_REIHENFOLGE) {
    const p = planeGespraech(w, figurId, themaId, a);
    const plan: Plan = "grund" in p && !("ansatz" in p) ? { ansatz: a, pk: 0, grund: p.grund, dLoy: 0, dGroll: 0, dEhrgeiz: 0, folgen: [] } : (p as Plan);
    out.push({ ansatz: a, ...ANSATZ_NAMEN[a], plan });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Ausführen

export interface SzenenZeile {
  wer: "ich" | "er" | "erzaehler";
  text: string;
}

export interface GespraechErgebnis {
  ok: boolean;
  text: string;
  szene: SzenenZeile[];
  hinweise: string[];
  folgen: { text: string; ton: "gut" | "schlecht" | "neutral" }[];
  kosten: number;
  ausgang?: "gut" | "mittel" | "schlecht" | "bruch";
  /** Ob das Ergebnis ein Ausscheiden ausgelöst hat (dann ist ein Nachfolger zu ernennen) */
  ausgeschieden?: boolean;
}

const wahl = <T,>(liste: T[], schluessel: string): T => liste[Math.floor(hashZahl(schluessel) * liste.length) % liste.length]!;

const ERSTE_ZEILE: Record<AnsatzId, (t: Thema, f: Figur) => string> = {
  vertrauen: (t) => (t.art === "person" ? "Ich möchte offen mit Ihnen reden: Wo stehen wir, und was erwarten Sie von mir?" : `Ich wollte in Ruhe mit Ihnen über „${t.titel}“ sprechen, ohne Protokoll.`),
  rat: (t) => (t.art === "zusage" ? "Wie sollen wir mit dieser Zusage umgehen? Ich brauche Ihre ehrliche Einschätzung." : `Was raten Sie mir bei „${t.titel}“? Ich brauche Zahlen, keine Floskeln.`),
  auftrag: (t) => `Ich gebe Ihnen einen Auftrag: „${t.titel}“ muss besser werden, und zwar messbar, bis zum Stichtag.`,
  kritik: (t) => `„${t.titel}“ läuft nicht. Ich erwarte, dass Sie das in Ordnung bringen, und zwar bald.`,
  belohnung: () => "Ihre Arbeit fällt auf. Ich will, dass Sie dafür mehr Mittel bekommen, und dass man es weiß.",
  rueckendeckung: () => "Ich sage es Ihnen und der Öffentlichkeit: Ich stehe hinter Ihnen.",
  machtfrage: () => "Ich brauche Klarheit: Sind Sie mit mir oder gegen mich?",
};

const ANTWORTEN: Record<AnsatzId, { gut: Record<Stil, string>; schlecht: Record<Stil, string> }> = {
  vertrauen: {
    gut: {
      nuechtern: "Danke, dass Sie sich Zeit nehmen. Ich sage Ihnen, wie ich die Lage sehe, und Sie sagen mir, was Sie brauchen.",
      eitel: "Es ist schön, dass Sie das sehen. Ich habe manches geleistet, das nicht in der Zeitung steht.",
      streng: "Gut. Wenn wir offen reden, kann ich Ihnen auch sagen, wo ich nicht mitgehe.",
      loyal: "Sie können sich auf mich verlassen, das wissen Sie. Aber es tut gut, es auch zu hören.",
      vorsichtig: "Ich schätze das. Wir sollten solche Gespräche öfter führen, bevor etwas schiefgeht.",
      machtbewusst: "Das ist klug von Ihnen. Wer mit mir redet, hat weniger Ärger mit mir.",
    },
    schlecht: {
      nuechtern: "Das ist freundlich, ändert aber nichts an den Zahlen.",
      eitel: "Ich habe mehr erwartet, als ein Gespräch zwischen Tür und Angel.",
      streng: "Nette Worte. Beschlüsse wären mir lieber.",
      loyal: "Ich höre Sie, aber ich merke, dass etwas zwischen uns steht.",
      vorsichtig: "Ich bin nicht sicher, ob das genügt. Es hat sich zu viel aufgestaut.",
      machtbewusst: "Schön, dass Sie reden. Ich behalte aber im Kopf, was vorgefallen ist.",
    },
  },
  rat: {
    gut: {
      nuechtern: "Hier sind die Zahlen. Ich rechne sie Ihnen vor, so wie ich sie sehe.",
      eitel: "Nun, das ist mein Fach. Ich habe da längst einen Plan.",
      streng: "Kurz und deutlich: Das sind die Schritte, alles andere ist Beiwerk.",
      loyal: "Ich sage Ihnen, was ich wirklich denke, auch wenn es nicht angenehm ist.",
      vorsichtig: "Ich würde nichts überstürzen. Aber das sind die Schritte, die ich für tragfähig halte.",
      machtbewusst: "Sie wollen den kürzesten Weg? Hier ist er. Er ist nicht billig.",
    },
    schlecht: {
      nuechtern: "Darüber habe ich keine belastbaren Zahlen.",
      eitel: "Das fällt nicht in mein Ressort, fragen Sie andere.",
      streng: "Dazu sage ich nichts, solange ich nicht weiß, wie es verwendet wird.",
      loyal: "Ich würde gern helfen, aber ich weiß es nicht besser als Sie.",
      vorsichtig: "Ich möchte mich nicht festlegen, ehe die Lage klarer ist.",
      machtbewusst: "Rat gibt es für den, der mich ernst nimmt.",
    },
  },
  auftrag: {
    gut: {
      nuechtern: "Verstanden. Ich bringe Ihnen bis zum Stichtag Zahlen, keine Ausreden.",
      eitel: "Das ist eine Aufgabe, die mir liegt. Man wird von mir sprechen.",
      streng: "Ich übernehme das. Wer im Weg steht, wird es merken.",
      loyal: "Sie können auf mich zählen. Ich lasse Sie nicht hängen.",
      vorsichtig: "Ich nehme das an. Ich sage Ihnen rechtzeitig, wenn es eng wird.",
      machtbewusst: "Gut. Wenn ich es schaffe, erwarte ich, dass Sie das nicht vergessen.",
    },
    schlecht: {
      nuechtern: "Ich nehme den Auftrag an, aber ich halte das Ziel für zu hoch.",
      eitel: "Ich bin nicht sicher, dass ich dafür der Richtige bin.",
      streng: "Ich nehme das an, unter Vorbehalt.",
      loyal: "Ich versuche es. Versprechen kann ich es nicht.",
      vorsichtig: "Ich nehme das an, aber ich rate zur Geduld.",
      machtbewusst: "Ich mache es. Aber merken Sie sich, dass ich es nicht gern tue.",
    },
  },
  kritik: {
    gut: {
      nuechtern: "Die Kritik ist berechtigt. Ich ziehe die Konsequenzen und melde mich in einem Monat.",
      eitel: "Ich sehe das anders, aber ich werde es beweisen.",
      streng: "Verstanden. Ich hätte es früher sagen sollen.",
      loyal: "Sie haben recht, und es tut weh. Ich bringe es in Ordnung.",
      vorsichtig: "Ich nehme das ernst. Ich brauche aber mehr Spielraum.",
      machtbewusst: "Gut, ich verstehe. Aber halten Sie sich das Gleiche selbst vor.",
    },
    schlecht: {
      nuechtern: "Das halte ich für ungerecht, und ich werde das festhalten.",
      eitel: "Ich habe mehr für dieses Land getan als viele, die mir das vorwerfen.",
      streng: "Sie vergessen, unter welchen Bedingungen ich arbeite.",
      loyal: "Dass gerade Sie mir das sagen, hätte ich nicht gedacht.",
      vorsichtig: "So kann ich nicht arbeiten. Ich brauche Rückhalt, keine Vorwürfe.",
      machtbewusst: "Das merke ich mir. Alles hat seinen Preis.",
    },
  },
  belohnung: {
    gut: {
      nuechtern: "Danke. Die Mittel setze ich dort ein, wo sie am meisten bringen.",
      eitel: "Endlich sieht es jemand. Sie werden es nicht bereuen.",
      streng: "Das nehme ich an, mit der Auflage, dass die anderen nicht dafür zahlen.",
      loyal: "Das habe ich nicht erwartet, und ich vergesse es nicht.",
      vorsichtig: "Ich bin dankbar. Ich hoffe, die anderen sehen es nicht als Bevorzugung.",
      machtbewusst: "Ich nehme es und erwarte, dass es nicht die letzte Geste bleibt.",
    },
    schlecht: {
      nuechtern: "Danke, aber Mittel ersetzen kein Vertrauen.",
      eitel: "Anerkennung ist gut, aber ich hatte mit einer höheren Stellung gerechnet.",
      streng: "Nicht mit Geld lösen, was ein Gespräch klären müsste.",
      loyal: "Das ist nicht nötig, ich habe es nicht wegen der Mittel getan.",
      vorsichtig: "Ich nehme das an, obwohl ich weiß, wie es aussieht.",
      machtbewusst: "Ein Anfang. Aber ich will mehr als ein Geschenk.",
    },
  },
  rueckendeckung: {
    gut: {
      nuechtern: "Das hilft mir jetzt mehr, als Sie ahnen.",
      eitel: "Es ist gut zu wissen, dass man gesehen wird.",
      streng: "Diese Geste vergesse ich nicht. Ich weiß, was sie kostet.",
      loyal: "Sie ahnen nicht, wie viel mir das bedeutet. Ich werde Sie nicht enttäuschen.",
      vorsichtig: "Danke. Das beruhigt mich, und es beruhigt mein Haus.",
      machtbewusst: "Klug von Ihnen. Sie wissen, was ein Gefallen wert ist.",
    },
    schlecht: {
      nuechtern: "Gut gemeint, aber die Vorwürfe bleiben.",
      eitel: "Rückendeckung reicht nicht, ich will eine öffentliche Genugtuung.",
      streng: "Das kommt zu spät.",
      loyal: "Danke. Aber ich fürchte, es kommt zu spät.",
      vorsichtig: "Ich bin nicht sicher, ob das die Lage beruhigt oder verschärft.",
      machtbewusst: "Zu spät kommt die Rückendeckung, und sie hilft nicht mehr viel.",
    },
  },
  machtfrage: {
    gut: {
      nuechtern: "Ich bin mit Ihnen. Sie hätten nicht fragen müssen, aber ich verstehe, warum.",
      eitel: "Wenn es sein muss: mit Ihnen. Aber Sie werden es sich merken müssen.",
      streng: "Ich bin mit Ihnen, solange Sie führen.",
      loyal: "Natürlich mit Ihnen. Das war nie eine Frage.",
      vorsichtig: "Ich bleibe. Aber ich bitte darum, dass wir so etwas nicht wiederholen.",
      machtbewusst: "Gut. Ich füge mich, für jetzt.",
    },
    schlecht: {
      nuechtern: "Dann gehe ich. Ich lasse mir keine Bedingungen stellen.",
      eitel: "Wenn Sie so fragen, kennen Sie die Antwort. Sie werden von mir hören.",
      streng: "Nicht unter solchen Bedingungen. Ich gebe mein Amt zurück.",
      loyal: "Dass Sie so fragen, sagt mir alles. Ich trete zurück.",
      vorsichtig: "Ich sehe keinen Weg mehr. Ich reiche meinen Rücktritt ein.",
      machtbewusst: "Sie haben die Frage gestellt. Sie werden mit der Antwort leben.",
    },
  },
};

const pron = (f: Figur) => ({ er: f.weiblich ? "Sie" : "Er", ihm: f.weiblich ? "ihr" : "ihm" });

function ton(x: number): "gut" | "schlecht" | "neutral" {
  return x > 0 ? "gut" : x < 0 ? "schlecht" : "neutral";
}

export type Ausscheiden = (w: World, f: Figur, grund: string) => void;
let ausscheidenHaken: Ausscheiden | undefined;
/** Der Nachfolge-Prozess (sim/nachfolge.ts) meldet sich hier an, damit Gespräche einen Rücktritt auslösen können, ohne ihn zu importieren. */
export function setzeAusscheidenHaken(h: Ausscheiden): void {
  ausscheidenHaken = h;
}

export function fuehreGespraech(w: World, figurId: string, themaId: string, ansatz: AnsatzId): GespraechErgebnis {
  const sp = w.spiel;
  const f = figurNachId(w, figurId);
  const leer = (text: string): GespraechErgebnis => ({ ok: false, text, szene: [], hinweise: [], folgen: [], kosten: 0 });
  if (!sp || !f) return leer("Diese Person gibt es in Ihrer Partie nicht.");
  const p = planeGespraech(w, figurId, themaId, ansatz);
  if (!("ansatz" in p)) return leer(p.grund);
  if (p.grund) return leer(p.grund);
  const thema = themenFuer(w, figurId).find((t) => t.id === themaId)!;
  const e = eigenVon(w, f);
  const d = amtDef(f);
  const gr = themaGroesse(w, f, thema);
  const grName = gr ? NET.nodes[NET.index.get(gr) ?? -1]?.name : undefined;
  const schluessel = `${w.seed}|${f.id}|${w.day}|${ansatz}|${themaId}`;
  const szene: SzenenZeile[] = [{ wer: "ich", text: ERSTE_ZEILE[ansatz](thema, f) }];
  const folgen: GespraechErgebnis["folgen"] = [];
  const hinweise: string[] = [];
  let ausgang: NonNullable<GespraechErgebnis["ausgang"]> = "gut";
  let ausgeschieden = false;
  const loyVorher = f.loyalitaet;

  sp.kapital -= p.pk;
  f.gespraech = w.day;
  (sp.termine ??= []).push(w.day);
  if (sp.termine.length > 40) sp.termine = sp.termine.slice(-40);

  const antwort = (art: "gut" | "schlecht") => ANTWORTEN[ansatz][art][e.stil];

  switch (ansatz) {
    case "vertrauen": {
      loyalitaetVerschieben(f, p.dLoy);
      grollVerschieben(w, f, p.dGroll);
      e.ehrgeiz = k100(e.ehrgeiz + p.dEhrgeiz);
      const gut = p.dLoy >= 6;
      ausgang = gut ? "gut" : "mittel";
      szene.push({ wer: "er", text: antwort(gut ? "gut" : "schlecht") });
      if (thema.art === "person") szene.push({ wer: "erzaehler", text: e.ehrgeiz >= 65 ? `${pron(f).er} deutet an, dass ${f.weiblich ? "sie" : "er"} mehr Verantwortung erwartet und nicht ewig auf der Stelle bleiben wird.` : `${pron(f).er} wirkt mit dem Amt im Reinen und will vor allem in Ruhe arbeiten.` });
      folgen.push({ text: `Loyalität ${p.dLoy >= 0 ? "+" : ""}${p.dLoy}: jetzt ${Math.round(f.loyalitaet)}`, ton: ton(p.dLoy) }, { text: `Groll ${p.dGroll}: ${grollWort(e.groll)}`, ton: "gut" });
      break;
    }
    case "rat": {
      loyalitaetVerschieben(f, p.dLoy);
      hinweise.push(...ratHinweise(w, f, thema));
      ausgang = hinweise.length ? "gut" : "mittel";
      szene.push({ wer: "er", text: antwort(hinweise.length ? "gut" : "schlecht") });
      folgen.push({ text: "Loyalität +2 (Wertschätzung)", ton: "gut" });
      break;
    }
    case "auftrag": {
      const richtung: 1 | -1 = gr && HOCH_SCHLECHT.has(gr) ? -1 : 1;
      const a: Auftrag = {
        id: `auftrag-${f.id}-${w.day}`,
        text: `${grName} ${richtung > 0 ? "verbessern" : "senken"}`,
        groesse: gr!,
        richtung,
        delta: 3,
        seit: w.day,
        frist: w.day + AUFTRAG_TAGE,
        vorher: wertVon(w, gr!),
        status: "laeuft",
      };
      e.auftrag = a;
      const skeptisch = f.loyalitaet < 50;
      ausgang = skeptisch ? "mittel" : "gut";
      szene.push({ wer: "er", text: antwort(skeptisch ? "schlecht" : "gut") });
      folgen.push({ text: `Auftrag bis ${datumAn(w, a.frist)}: ${grName} um mindestens ${a.delta} Punkte ${richtung > 0 ? "steigern" : "senken"} (jetzt ${Math.round(a.vorher)})`, ton: "neutral" });
      break;
    }
    case "kritik": {
      loyalitaetVerschieben(f, p.dLoy);
      grollVerschieben(w, f, p.dGroll);
      e.druckBis = w.day + 60;
      const scharf = e.groll >= 50;
      ausgang = scharf ? "schlecht" : "mittel";
      szene.push({ wer: "er", text: antwort(scharf ? "schlecht" : "gut") });
      folgen.push({ text: `Loyalität ${p.dLoy}: jetzt ${Math.round(f.loyalitaet)}`, ton: "schlecht" }, { text: `Groll +${p.dGroll}: ${grollWort(e.groll)}`, ton: "schlecht" }, { text: "Sechzig Tage unter Druck: Ressortleistung +15 %", ton: "gut" });
      if (e.groll >= 50 && e.ehrgeiz >= 50 && hashZahl(`${schluessel}|leak`) < 0.35) {
        vertrauenAendern(w, -0.4);
        addLog(w, "ereignis", `Aus der Regierung dringt etwas an die Presse: ${f.rolle} ${f.name} soll den Präsidenten hinter verschlossenen Türen scharf kritisiert haben.`, "Ein verärgertes Kabinettsmitglied redet.");
        folgen.push({ text: "Aus dem Gespräch dringt etwas an die Presse: Vertrauen in die Regierung −0,4", ton: "schlecht" });
      }
      break;
    }
    case "belohnung": {
      loyalitaetVerschieben(f, p.dLoy);
      grollVerschieben(w, f, p.dGroll);
      e.ehrgeiz = k100(e.ehrgeiz + p.dEhrgeiz);
      e.mittelBis = w.day + AUFTRAG_TAGE;
      for (const g of sp.figuren) {
        if (g === f || !AEMTER[g.amt].regierungsamt) continue;
        grollVerschieben(w, g, 3);
      }
      if (f.amt !== "finanzen") {
        const fm = sp.figuren.find((x) => x.amt === "finanzen");
        if (fm) loyalitaetVerschieben(fm, -2);
      }
      const gut = p.dLoy >= 10;
      ausgang = gut ? "gut" : "mittel";
      szene.push({ wer: "er", text: antwort(f.loyalitaet >= 70 || e.stil === "loyal" || e.stil === "eitel" ? "gut" : "schlecht") });
      folgen.push({ text: `Loyalität +${p.dLoy}: jetzt ${Math.round(f.loyalitaet)}`, ton: "gut" }, { text: `Zusatzmittel für ${d.ressort} bis ${datumAn(w, e.mittelBis)}: Leistung +25 %`, ton: "gut" }, { text: "Neid im Kabinett: Groll der anderen +3", ton: "schlecht" });
      break;
    }
    case "rueckendeckung": {
      loyalitaetVerschieben(f, p.dLoy);
      grollVerschieben(w, f, p.dGroll);
      e.ehrgeiz = k100(e.ehrgeiz + p.dEhrgeiz);
      vertrauenAendern(w, -0.1);
      for (const g of sp.figuren) if (g !== f && g.eigen?.lager === e.lager) loyalitaetVerschieben(g, 2);
      ausgang = "gut";
      szene.push({ wer: "er", text: antwort(f.loyalitaet >= 45 ? "gut" : "schlecht") });
      folgen.push({ text: `Loyalität +${p.dLoy}: jetzt ${Math.round(f.loyalitaet)}`, ton: "gut" }, { text: `Groll ${p.dGroll}: ${grollWort(e.groll)}`, ton: "gut" }, { text: "Vertrauen in die Regierung −0,1", ton: "schlecht" });
      break;
    }
    case "machtfrage": {
      const s = machtScore(w, f) + (hashZahl(`${schluessel}|macht`) - 0.5) * 16;
      if (s >= MACHT_SCHWELLE) {
        loyalitaetVerschieben(f, 6);
        grollVerschieben(w, f, -10);
        e.ehrgeiz = k100(e.ehrgeiz - 5);
        ausgang = "gut";
        szene.push({ wer: "er", text: antwort("gut") });
        folgen.push({ text: `${pron(f).er} fügt sich: Loyalität +6, jetzt ${Math.round(f.loyalitaet)}`, ton: "gut" }, { text: "Groll −10, Ehrgeiz −5", ton: "gut" });
      } else {
        ausgang = "bruch";
        szene.push({ wer: "er", text: antwort("schlecht") });
        if (d.regierungsamt && ausscheidenHaken) {
          ausscheidenHaken(w, f, "Rücktritt nach dem Ultimatum des Präsidenten");
          ausgeschieden = true;
          folgen.push({ text: `${f.name} tritt zurück, ein Nachfolger muss ernannt werden`, ton: "schlecht" });
        } else {
          loyalitaetVerschieben(f, -20);
          grollVerschieben(w, f, 20);
          folgen.push({ text: `Bruch: Loyalität −20, jetzt ${Math.round(f.loyalitaet)}`, ton: "schlecht" });
        }
      }
      break;
    }
  }

  if (!ausgeschieden) {
    merke(w, f, `${ANSATZ_NAMEN[ansatz].label}: ${thema.titel}${loyVorher !== f.loyalitaet ? ` (Loyalität ${f.loyalitaet > loyVorher ? "+" : "−"}${Math.abs(Math.round(f.loyalitaet - loyVorher))})` : ""}`);
  }
  const kurz = `Gespräch mit ${f.rolle} ${f.name} (${ANSATZ_NAMEN[ansatz].label}): ${ausgang === "bruch" ? "Es endet im Bruch" : ausgang === "gut" ? "Es geht gut aus" : ausgang === "mittel" ? "Es bringt wenig" : "Es geht schlecht aus"}.`;
  addLog(w, "entscheidung", kurz, `${thema.titel}. Kosten ${p.pk} Kapital.`);
  return { ok: true, text: kurz, szene, hinweise, folgen, kosten: p.pk, ausgang, ...(ausgeschieden ? { ausgeschieden } : {}) };
}

/** Ein kurzes Gespräch für Chat und Befehle: Vertrauen aufbauen zu dem, was die Person umtreibt. */
export function sprichMitFigur(w: World, figurId: string): { ok: boolean; text: string; why?: string } {
  const f = figurNachId(w, figurId);
  if (!f) return { ok: false, text: "Diese Person gibt es in Ihrer Partie nicht." };
  if (!sprechbar(f)) return { ok: false, text: "Mit dem Oppositionsführer verhandeln Sie über die Fraktionen im Parlament (Parlament und Beschlüsse)." };
  const r = fuehreGespraech(w, figurId, "sorge", "vertrauen");
  if (!r.ok) return { ok: false, text: r.text };
  return { ok: true, text: r.text, why: `Kostet ${r.kosten} Kapital. ${f.name} will: ${f.ziel}` };
}

// ---------------------------------------------------------------------------
// Schnittstelle für die KI: kompakter Kontext und die Wahl aus dem festen Katalog

/** Ein Textblock über eine Person für das Sprachmodell (Zustand, Profil, Themen, Ansätze). Keine Entscheidung, nur Lage. */
export function personKontext(w: World, figurId: string): string {
  const f = figurNachId(w, figurId);
  if (!f || !w.spiel) return "";
  const e = eigenVon(w, f);
  const d = amtDef(f);
  const zeilen = [
    `${f.rolle} ${f.name} (${d.ressort}), ${f.weiblich ? "weiblich" : "männlich"}, Stil: ${e.stil}, Lager: ${e.lager}.`,
    `Loyalität ${Math.round(f.loyalitaet)}/100, Groll ${Math.round(e.groll)}/100 (${grollWort(e.groll)}), Ehrgeiz ${Math.round(e.ehrgeiz)}/100, Ressortleistung ${leistungWort(leistung(w, f))}.`,
    `Ziel: ${f.ziel}`,
    `Sorge: ${sorgeText(w, f)}`,
  ];
  if (e.auftrag) zeilen.push(`Auftrag: ${e.auftrag.text} (${e.auftrag.status}, Frist ${datumAn(w, e.auftrag.frist)}).`);
  const er = erinnerungen(f).slice(0, 3);
  if (er.length) zeilen.push(`Zuletzt: ${er.map((x) => x.text).join("; ")}.`);
  const t = termineInfo(w);
  zeilen.push(`Termine der letzten 30 Tage: ${t.belegt} von ${t.max}.`);
  zeilen.push(`Themen: ${themenFuer(w, figurId).map((x) => `${x.id} (${x.titel})`).join("; ")}.`);
  zeilen.push(`Ansätze: ${ANSATZ_REIHENFOLGE.join(", ")}.`);
  return zeilen.join("\n");
}

/** Wendet ein vom Modell gewähltes Gespräch an: prüft Thema und Ansatz gegen den Katalog und führt es wie jede andere Handlung aus. */
export function wendeGespraechsergebnisAn(w: World, figurId: string, themaId: string, ansatz: string): GespraechErgebnis {
  if (!ANSATZ_REIHENFOLGE.includes(ansatz as AnsatzId)) return { ok: false, text: `Unbekannter Ansatz „${ansatz}“.`, szene: [], hinweise: [], folgen: [], kosten: 0 };
  return fuehreGespraech(w, figurId, themaId, ansatz as AnsatzId);
}

/** Warum jetzt kein Gespräch mit dieser Person möglich ist (Abkühlzeit, Termine); leer, wenn es geht. */
export function gespraechGrund(w: World, figurId: string): string | undefined {
  const f = figurNachId(w, figurId);
  if (!f) return "Diese Person gibt es in Ihrer Partie nicht.";
  if (!sprechbar(f)) return "Mit dem Oppositionsführer verhandeln Sie über die Fraktionen im Parlament.";
  return terminGrund(w, f);
}

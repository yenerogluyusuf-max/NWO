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
import { AUFMERKSAMKEIT_KOSTEN, neuanfangGrund, verbrauche } from "./aufmerksamkeit";
import { clamp } from "./economy";
import { pruefeVorhaben, stufeIn } from "./handeln";
import { anliegenStand, LAENDER, vertrauenZu, weltZustand } from "./laender";
import { zusagenSicht, zusageText, zusageVorhaben } from "./zusagen";
import {
  AEMTER, amtDef, eigenVon, erinnerungen, figurNachId, grollVerschieben, grollWort, HOCH_SCHLECHT, hashZahl, lageIm, leistung, leistungWort,
  loyalitaetVerschieben, merke, nf, schlechtesteGroesse, sorgeText, sprechbar, wertVon,
} from "./personen";
import type { Auftrag, Stil } from "./personen-typen";
import type { World } from "./types";
import type { Figur } from "./spiel-typen";
import { t } from "../i18n";

// Befund C-3: Alle Texte stehen im Katalog (nacht_n1.json, Präfix n1.gs.), Pronomen nach Geschlecht über `g`.
const gv = (f: Figur): "f" | "m" => (f.weiblich ? "f" : "m");
/** Eine Veränderung mit Vorzeichen und echtem Minus („+6“, „−8“). */
const vz = (n: number): string => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");

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

export const ANSATZ_NAMEN: Record<AnsatzId, { label: string; kurz: string }> = Object.fromEntries(
  (["vertrauen", "rat", "auftrag", "kritik", "belohnung", "rueckendeckung", "machtfrage"] as const).map((a) => [a, { label: t(`mfl.ansatz.${a}.label`), kurz: t(`mfl.ansatz.${a}.kurz`) }]),
) as Record<AnsatzId, { label: string; kurz: string }>;

export const ANSATZ_REIHENFOLGE: AnsatzId[] = ["rat", "vertrauen", "auftrag", "belohnung", "kritik", "rueckendeckung", "machtfrage"];

const datumAn = (w: World, tag: number): string => formatDateDe(addDays(w.spiel!.start.datum, tag));

// ---------------------------------------------------------------------------
// Ereignisse, die ein Ressort betreffen

// groessen: worum es im Ereignis geht, in der Reihenfolge der Bedeutung. Der Rat einer Person nimmt die erste Größe ihres
// Fachs; hat sie keine, rät sie nicht zu etwas anderem (Spielerdurchlauf 5. November: Bei der Besetzung am Verfassungsgericht
// riet die Justiz zu Gefängnissen, weil das ihre schlechteste Größe war).
export const EREIGNIS_BEZUG: Record<string, { amt: Figur["amt"][]; titel: string; groessen?: string[] }> = {
  grenzzwischenfall: { amt: ["inneres", "aussen", "generalstab"], titel: t("n1.gs.ereignis.grenzzwischenfall"), groessen: ["terrorgefahr", "ansehen", "bereitschaft_heer", "truppenmoral"] },
  eu_angebot: { amt: ["aussen", "wirtschaft", "justiz"], titel: t("n1.gs.ereignis.eu_angebot"), groessen: ["beziehungen_eu", "auslandskapital", "investitionen", "justiz_unabhaengigkeit"] },
  iwf_angebot: { amt: ["finanzen"], titel: t("n1.gs.ereignis.iwf_angebot"), groessen: ["vertrauen_maerkte", "zinslast"] },
  ratingagentur: { amt: ["finanzen"], titel: t("n1.gs.ereignis.ratingagentur"), groessen: ["vertrauen_maerkte", "zinslast"] },
  nato_ratifizierung: { amt: ["aussen", "generalstab"], titel: t("n1.gs.ereignis.nato_ratifizierung"), groessen: ["beziehungen_usa", "ansehen", "bereitschaft_heer"] },
  gasvertrag: { amt: ["aussen", "energie", "wirtschaft"], titel: t("n1.gs.ereignis.gasvertrag"), groessen: ["beziehungen_russland", "energieimporte", "industrie"] },
  gasfund: { amt: ["energie", "wirtschaft"], titel: t("n1.gs.ereignis.gasfund"), groessen: ["energieimporte", "investitionen", "export"] },
  cyberangriff: { amt: ["inneres", "generalstab"], titel: t("n1.gs.ereignis.cyberangriff"), groessen: ["terrorgefahr", "bereitschaft_heer"] },
  weltwirtschaftskrise: { amt: ["finanzen", "wirtschaft", "zentralbank", "handel"], titel: t("n1.gs.ereignis.weltwirtschaftskrise"), groessen: ["vertrauen_maerkte", "export", "investitionen"] },
  pandemie: { amt: ["gesundheit", "stab", "inneres"], titel: t("n1.gs.ereignis.pandemie"), groessen: ["gesundheitsversorgung", "wartezeiten", "vertrauen_regierung", "kriminalitaet"] },
  bankenstress: { amt: ["finanzen", "zentralbank"], titel: t("n1.gs.ereignis.bankenstress"), groessen: ["vertrauen_maerkte"] },
  waehrungsrutsch: { amt: ["finanzen", "zentralbank"], titel: t("n1.gs.ereignis.waehrungsrutsch"), groessen: ["vertrauen_maerkte", "lebenshaltung"] },
  haushaltsdruck: { amt: ["finanzen", "zentralbank"], titel: t("n1.gs.ereignis.haushaltsdruck"), groessen: ["steuereinnahmen", "zinslast", "vertrauen_maerkte"] },
  energiepreisschock: { amt: ["energie", "wirtschaft", "finanzen"], titel: t("n1.gs.ereignis.energiepreisschock"), groessen: ["energiepreise", "industrie", "lebenshaltung", "steuereinnahmen"] },
  korruptionsaffaere: { amt: ["justiz", "inneres", "stab"], titel: t("n1.gs.ereignis.korruptionsaffaere"), groessen: ["justiz_unabhaengigkeit", "kriminalitaet", "vertrauen_regierung"] },
  streikwelle: { amt: ["arbeit", "wirtschaft", "inneres"], titel: t("n1.gs.ereignis.streikwelle"), groessen: ["streikneigung", "industrie", "kriminalitaet"] },
  anschlag: { amt: ["inneres", "generalstab"], titel: t("n1.gs.ereignis.anschlag"), groessen: ["terrorgefahr", "truppenmoral"] },
  fluechtlingswelle: { amt: ["inneres", "aussen"], titel: t("n1.gs.ereignis.fluechtlingswelle"), groessen: ["kriminalitaet", "beziehungen_eu"] },
  fabrikschliessungen: { amt: ["wirtschaft"], titel: t("n1.gs.ereignis.fabrikschliessungen"), groessen: ["industrie", "investitionen"] },
  erdbeben: { amt: ["umwelt", "stab", "inneres"], titel: t("n1.gs.ereignis.erdbeben"), groessen: ["erdbebenvorsorge", "bauqualitaet", "vertrauen_regierung", "kriminalitaet"] },
  pressekonflikt: { amt: ["stab", "inneres"], titel: t("n1.gs.ereignis.pressekonflikt"), groessen: ["legitimitaet", "vertrauen_regierung"] },
  studentenproteste: { amt: ["inneres", "stab", "bildung"], titel: t("n1.gs.ereignis.studentenproteste"), groessen: ["polarisierung", "kriminalitaet", "hochschule"] },
  buergermeister_verfahren: { amt: ["justiz", "inneres"], titel: t("n1.gs.ereignis.buergermeister_verfahren"), groessen: ["justiz_unabhaengigkeit", "polarisierung"] },
  recht_ernennung: { amt: ["justiz"], titel: t("n1.gs.ereignis.recht_ernennung"), groessen: ["justiz_unabhaengigkeit"] },
  recht_aym_kassation: { amt: ["justiz"], titel: t("n1.gs.ereignis.recht_aym_kassation"), groessen: ["urteilsbefolgung", "justiz_unabhaengigkeit"] },
  recht_egmr: { amt: ["justiz", "aussen"], titel: t("n1.gs.ereignis.recht_egmr"), groessen: ["urteilsbefolgung", "beziehungen_eu"] },
  recht_haftrevolte: { amt: ["justiz", "inneres"], titel: t("n1.gs.ereignis.recht_haftrevolte"), groessen: ["haftueberfuellung", "kriminalitaet"] },
  mil_lieferverzug: { amt: ["verteidigung", "generalstab"], titel: t("n1.gs.ereignis.mil_lieferverzug"), groessen: ["modernisierung", "ruestungsautarkie", "bereitschaft_heer", "bereitschaft_luft"] },
  mil_militaerrat: { amt: ["generalstab"], titel: t("n1.gs.ereignis.mil_militaerrat"), groessen: ["offiziersvertrauen", "truppenmoral"] },
  land_fordert: { amt: ["aussen"], titel: t("n1.gs.ereignis.land_fordert"), groessen: ["ansehen"] },
  land_angebot: { amt: ["aussen"], titel: t("n1.gs.ereignis.land_angebot"), groessen: ["ansehen"] },
  land_provokation: { amt: ["aussen", "generalstab"], titel: t("n1.gs.ereignis.land_provokation"), groessen: ["ansehen", "bereitschaft_heer"] },
  land_drohkulisse: { amt: ["aussen", "generalstab"], titel: t("n1.gs.ereignis.land_drohkulisse"), groessen: ["ansehen", "bereitschaft_heer"] },
  vertrag_verlaengerung: { amt: ["aussen"], titel: t("n1.gs.ereignis.vertrag_verlaengerung"), groessen: ["ansehen"] },
  mindestlohn: { amt: ["arbeit", "wirtschaft", "finanzen"], titel: t("n1.gs.ereignis.mindestlohn"), groessen: ["informelle_arbeit", "industrie", "investitionen", "steuereinnahmen", "lebenshaltung"] },
  haushaltsjahr: { amt: ["finanzen"], titel: t("n1.gs.ereignis.haushaltsjahr"), groessen: ["steuereinnahmen", "zinslast"] },
  kommunalwahl: { amt: ["stab"], titel: t("n1.gs.ereignis.kommunalwahl"), groessen: ["vertrauen_regierung", "polarisierung"] },
  // Welle H3: Bereichsvorgänge (sim/ereignisse-bereiche.ts, sim/ereignisse-reich.ts)
  medien_kampagne: { amt: ["stab"], titel: t("welle_h3.gs.medien_kampagne"), groessen: ["vertrauen_regierung", "pressefreiheit"] },
  zentralbank_vertrauen: { amt: ["zentralbank", "finanzen"], titel: t("welle_h3.gs.zentralbank_vertrauen"), groessen: ["vertrauen_maerkte"] },
  erbe_verfall: { amt: ["kultur"], titel: t("welle_h3.gs.erbe_verfall"), groessen: ["kulturerbe", "tourismus"] },
  // Welle E4: Rüstung und Medien (sim/ereignisse-ruestung.ts, sim/ereignisse-medien.ts)
  ruestung_bedingung: { amt: ["verteidigung", "aussen"], titel: t("welle_e4.gs.ruestung_bedingung"), groessen: ["ruestungsautarkie", "nationalisten"] },
  ruestung_export: { amt: ["verteidigung", "wirtschaft"], titel: t("welle_e4.gs.ruestung_export"), groessen: ["export", "arbeitsplaetze_industrie"] },
  medien_plattform: { amt: ["stab", "verkehr"], titel: t("welle_e4.gs.medien_plattform"), groessen: ["pressefreiheit", "junge"] },
  medien_enthuellung: { amt: ["stab", "justiz"], titel: t("welle_e4.gs.medien_enthuellung"), groessen: ["korruption", "vertrauen_regierung"] },
  medien_sendezeit: { amt: ["stab"], titel: t("welle_e4.gs.medien_sendezeit"), groessen: ["pressefreiheit", "konservative"] },
};

// ---------------------------------------------------------------------------
// Themen

export function themenFuer(w: World, figurId: string): Thema[] {
  const sp = w.spiel;
  const f = figurNachId(w, figurId);
  if (!sp || !f || !sprechbar(f)) return [];
  const out: Thema[] = [];
  out.push({ id: "sorge", titel: t("n1.gs.thema.sorge.titel", { g: gv(f) }), text: sorgeText(w, f), art: "sorge" });

  // Die schwächsten Größen des Ressorts
  const lage = lageIm(w, f)
    .map((l) => ({ l, schlecht: l.schlechtWennHoch ? l.wert : 100 - l.wert }))
    .sort((a, b) => b.schlecht - a.schlecht)
    .slice(0, 2);
  for (const { l } of lage) {
    // „Name: schlecht“ statt „Name steht schlecht“: Viele Größen stehen in der Mehrzahl (Steuereinnahmen, Beziehungen zur EU)
    const ton = t(`n1.gs.ton.${l.ton}`);
    out.push({ id: `lage:${l.id}`, titel: t("n1.gs.thema.lage.titel", { name: l.name }), text: t("n1.gs.thema.lage.text", { name: l.name, wert: Math.round(l.wert), ton, hoch: l.schlechtWennHoch ? "ja" : "nein" }), art: "lage", bezug: l.id, dringlich: l.ton === "schlecht" });
  }

  // Offene Ereignisse im Ressort
  for (const ev of sp.ereignisse) {
    const b = EREIGNIS_BEZUG[ev.vorlage];
    if (b && b.amt.includes(f.amt)) out.push({ id: `ereignis:${ev.id}`, titel: b.titel, text: t("n1.gs.thema.ereignis.text", { titel: b.titel }), art: "ereignis", bezug: ev.id, dringlich: true });
  }

  // Zusagen, die diese Person betreffen
  for (const z of zusagenSicht(w)) {
    const trifft = z.bezug.id === f.id || (f.partei !== undefined && f.partei === z.z.von) || (z.z.massnahme !== undefined && amtDef(f).massnahmen.includes(z.z.massnahme));
    const zt = zusageText(z.z);
    if (trifft) out.push({ id: `zusage:${z.z.id}`, titel: t("n1.gs.thema.zusage.titel", { text: zt.length > 60 ? `${zt.slice(0, 57)}…` : zt }), text: t("n1.gs.thema.zusage.text", { seit: z.tage < 0 ? "ja" : "nein", n: Math.abs(z.tage), datum: formatDateDe(z.datum) }), art: "zusage", bezug: z.z.id, dringlich: z.dringlichkeit === "dringend" || z.dringlichkeit === "ueberfaellig" });
  }

  out.push({ id: "person", titel: t("n1.gs.thema.person.titel"), text: t("n1.gs.thema.person.text", { name: f.name, g: gv(f) }), art: "person" });
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
  if (rest > 0) return t("n1.gs.termin.kurz", { name: f.name, n: rest });
  if (termine(w).length >= MAX_TERMINE) return t("n1.gs.termin.voll", { max: MAX_TERMINE });
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

export function schritteFuer(w: World, f: Figur, groesse: string, richtung: 1 | -1, n = 2): Schritt[] {
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
  const bip = Math.abs(s.kostenBip) >= 0.05 ? t("n1.gs.schritt.bip", { n: Math.abs(s.kostenBip) }) : "";
  const kosten = s.kostenBip <= -0.05 ? t("n1.gs.schritt.kostenEin", { pk: s.pk, bip }) : t("n1.gs.schritt.kosten", { pk: s.pk, bip: bip || "leer" });
  const mehrheit = s.luecke > 0 ? t("n1.gs.schritt.luecke", { n: s.luecke }) : t("n1.gs.schritt.mehrheit");
  return t("n1.gs.schritt.text", { name: s.name, von: s.von, nach: s.nach, wirkt: s.wirkt, kosten, mehrheit });
}

/** Was die Person über ihr Ressort weiß und Ihnen nur sagt, wenn sie Ihnen folgt: ein Fakt mit Zahl aus dem Weltzustand. */
function insiderFakt(w: World, f: Figur): string | undefined {
  const e = w.economy;
  const sp = w.spiel!;
  switch (f.amt) {
    case "finanzen":
      return t("n1.gs.fakt.finanzen", { n: Math.abs(e.policyCost), mehr: e.policyCost >= 0 ? "ja" : "nein", r: Math.round(e.riskPremium) });
    case "inneres": {
      const n = activeProvinces(NET, w.net, "p_kriminalitaet").length;
      const m = activeProvinces(NET, w.net, "p_migrationsdruck").length;
      return n + m > 0 ? t("n1.gs.fakt.inneres", { n, m }) : t("n1.gs.fakt.inneresRuhig");
    }
    case "aussen": {
      const schlecht = LAENDER.map((l) => ({ l, v: vertrauenZu(w, l.id), a: anliegenStand(w, l.id) })).sort((a, b) => a.v - b.v)[0];
      if (!schlecht) return undefined;
      const offen = schlecht.a.filter((x) => !x.erfuellt).length;
      return t("n1.gs.fakt.aussen", { land: schlecht.l.name, v: Math.round(schlecht.v), a: schlecht.a.length, o: offen, streit: weltZustand(w)[schlecht.l.id]!.konflikt >= 60 ? "ja" : "nein" });
    }
    case "zentralbank":
      return t("n1.gs.fakt.zentralbank", { e: e.expectedInflation, i: e.inflation, c: Math.round(e.credibility * 100) });
    case "stab": {
      const offen = sp.zusagen.filter((z) => !z.erfuellt && !z.gebrochen);
      const bald = offen.sort((a, b) => a.faellig - b.faellig)[0];
      return t("n1.gs.fakt.stab", { m: Math.max(0, Math.round((sp.wahltag - w.day) / 30)), bald: bald ? "ja" : "nein", t: bald ? Math.max(0, bald.faellig - w.day) : 0, z: sp.umfrage.zustimmung });
    }
    case "justiz":
      return t("n1.gs.fakt.justiz", { e: Math.round(wertVon(w, "justiz_effizienz")), h: Math.round(wertVon(w, "haftueberfuellung")) });
    case "generalstab":
      return t("n1.gs.fakt.generalstab", { h: Math.round(wertVon(w, "bereitschaft_heer")), l: Math.round(wertVon(w, "bereitschaft_luft")), m: Math.round(wertVon(w, "bereitschaft_see")), t: Math.round(wertVon(w, "truppenmoral")) });
    case "wirtschaft":
      return t("n1.gs.fakt.wirtschaft", { w: e.growth, a: e.unemployment, k: Math.round(wertVon(w, "auslandskapital")) });
    case "partner":
      return t("n1.gs.fakt.partner", { g: gv(f), n: w.parliament?.seats[f.partei ?? ""] ?? 0 });
    default:
      return undefined;
  }
}

export function ratHinweise(w: World, f: Figur, thema: Thema): string[] {
  const e = eigenVon(w, f);
  const out: string[] = [];
  let groesse = thema.art === "lage" || thema.art === "sorge" ? thema.bezug : undefined;
  if (thema.art === "sorge") groesse = schlechtesteGroesse(w, f)?.id;
  if (thema.art === "ereignis") {
    groesse = ereignisGroesse(w, f, thema.bezug);
    if (!groesse) out.push(t("n1.gs.rat.keinHebel", { titel: thema.titel, name: f.name, g: gv(f) }));
  }
  if (thema.art === "zusage") {
    const z = w.spiel!.zusagen.find((x) => x.id === thema.bezug);
    const v = zusageVorhaben(w, z);
    if (v) {
      const rest = v.pr.ok ? t("n1.gs.rat.zusage.kosten", { pk: v.pr.gesetz.pk, mehrheit: v.pr.gesetz.stimmen.luecke > 0 ? t("n1.gs.schritt.luecke", { n: v.pr.gesetz.stimmen.luecke }) : t("n1.gs.rat.mehrheitSteht") }) : t("n1.gs.rat.zusage.schon");
      out.push(t("n1.gs.rat.zusage", { name: v.name, von: Math.round(v.jetzt), ziel: v.ziel, rest }));
      if (v.pr.ok && !kannZahlen(w.spiel!.kapital, v.pr.gesetz.pk)) out.push(t("n1.gs.rat.kapitalFehlt"));
    }
    return out;
  }
  if (groesse) {
    const l = lageIm(w, f).find((x) => x.id === groesse) ?? { name: NET.nodes[NET.index.get(groesse)!]!.name, wert: wertVon(w, groesse), schlechtWennHoch: HOCH_SCHLECHT.has(groesse) };
    const richtung: 1 | -1 = l.schlechtWennHoch ? -1 : 1;
    const schritte = schritteFuer(w, f, groesse, richtung, 2);
    if (schritte.length) {
      // „Name: Wert“ statt „Name steht bei“: Viele Größen stehen in der Mehrzahl („Beziehungen zur EU steht bei 39“)
      out.push(t("n1.gs.rat.vorschlag", { name: l.name, wert: Math.round(l.wert), g: gv(f) }));
      for (const s of schritte) out.push(schrittText(s));
      if (e.stil === "eitel" && schritte.some((s) => s.eigenesRessort)) out.push(t("n1.gs.rat.eitel", { g: gv(f) }));
      if (e.stil === "vorsichtig") out.push(t("n1.gs.rat.vorsichtig", { g: gv(f) }));
      if (e.stil === "machtbewusst") out.push(t("n1.gs.rat.machtbewusst", { g: gv(f) }));
    } else {
      out.push(t("n1.gs.rat.keinSchritt", { name: l.name, wert: Math.round(l.wert), g: gv(f) }));
    }
  }
  // Wer dem Präsidenten folgt, sagt mehr
  if (f.loyalitaet >= 60) {
    const fakt = insiderFakt(w, f);
    if (fakt) out.push(t("n1.gs.rat.vertraulich", { fakt }));
  } else if (f.loyalitaet >= 40) {
    out.push(t("n1.gs.rat.zurueck", { g: gv(f) }));
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
  if (t.art === "sorge") return schlechtesteGroesse(w, f)?.id;
  if (t.art === "ereignis") return ereignisGroesse(w, f, t.bezug);
  return undefined;
}

/** Die Größe, um die es in einem offenen Ereignis aus Sicht dieser Person geht (siehe EREIGNIS_BEZUG.groessen). */
function ereignisGroesse(w: World, f: Figur, ereignisId: string | undefined): string | undefined {
  const ev = w.spiel?.ereignisse.find((e) => e.id === ereignisId);
  // Geht es um ein bestimmtes Land, zuerst die Beziehung, über die es im Netz wirkt (Spielerdurchlauf: Beim Vertrag mit Baku
  // riet der Außenminister zu Forschungsförderung für das Ansehen)
  const landKnoten = LAENDER.find((l) => l.id === String(ev?.daten?.land ?? ""))?.knoten;
  const bezug = ev ? EREIGNIS_BEZUG[ev.vorlage]?.groessen : undefined;
  const groessen = bezug && landKnoten ? [landKnoten, ...bezug] : bezug;
  if (!groessen) return schlechtesteGroesse(w, f)?.id;
  const fach = new Set(lageIm(w, f).map((l) => l.id));
  return groessen.find((g) => fach.has(g));
}

export function planeGespraech(w: World, figurId: string, themaId: string, ansatz: AnsatzId): Plan | { grund: string } {
  const sp = w.spiel;
  const f = figurNachId(w, figurId);
  if (!sp || !f) return { grund: t("n1.gs.g.keinePerson") };
  if (!sprechbar(f)) return { grund: t("n1.gs.g.opposition") };
  const thema = themenFuer(w, figurId).find((x) => x.id === themaId);
  if (!thema) return { grund: t("n1.gs.g.keinThema") };
  const d = amtDef(f);
  const e = eigenVon(w, f);
  const g = gv(f);
  const nach = (x: number) => Math.round(k100(f.loyalitaet + x));
  const plan: Plan = { ansatz, pk: 0, dLoy: 0, dGroll: 0, dEhrgeiz: 0, folgen: [] };
  const tg = terminGrund(w, f);
  const gr = themaGroesse(w, f, thema);
  const grName = gr ? NET.nodes[NET.index.get(gr) ?? -1]?.name : undefined;

  switch (ansatz) {
    case "vertrauen": {
      // Ein Koalitionspartner will mehr als eine Geste: Preis nach Größe der Fraktion (Spielparameter, je 30 Sitze 1 Kapital mehr).
      // Früher rettete ein Gespräch für 1 Kapital jede Koalition (PRUEFUNG_GESAMT_2026-11-04).
      const sitze = f.amt === "partner" && f.partei ? (w.parliament?.seats[f.partei] ?? 0) : 0;
      plan.pk = f.amt === "partner" ? 2 + Math.round(sitze / 30) : 1;
      let dLoy = 7 * STIL_VERTRAUEN[e.stil] + (thema.art === "sorge" || thema.art === "person" ? 3 : 0);
      plan.dGroll = -8;
      if (e.groll >= 40) {
        dLoy *= 0.5;
        plan.dGroll = -18;
      }
      plan.dLoy = Math.round(dLoy);
      if (f.loyalitaet >= 90) plan.grund = t("n1.gs.g.vertrauenHoch");
      if (thema.art === "person" && e.ehrgeiz >= 65) plan.dEhrgeiz = 3;
      plan.folgen.push(t("n1.gs.f.loyAuf", { d: vz(plan.dLoy), nach: nach(plan.dLoy) }), t("n1.gs.f.groll", { d: vz(plan.dGroll), wort: grollWort(e.groll) }));
      if (plan.dEhrgeiz) plan.folgen.push(t("n1.gs.f.verantwortung", { g, n: plan.dEhrgeiz }));
      break;
    }
    case "rat": {
      plan.pk = 0;
      plan.dLoy = 2;
      if (f.loyalitaet < 30) plan.grund = t("n1.gs.g.ratLoy", { loy: Math.round(f.loyalitaet), g });
      else if (thema.art === "person") plan.grund = t("n1.gs.g.ratPerson");
      plan.folgen.push(t("n1.gs.f.ratSchritte"), f.loyalitaet >= 60 ? t("n1.gs.f.ratVertraulich") : t("n1.gs.f.ratVertraulichAb"), t("n1.gs.f.wertschaetzung"));
      break;
    }
    case "auftrag": {
      plan.pk = 2;
      plan.dLoy = 0;
      if (!d.regierungsamt) plan.grund = f.amt === "zentralbank" ? t("n1.gs.g.auftragZb") : t("n1.gs.g.auftragNurRegierung");
      else if (e.auftrag?.status === "laeuft") plan.grund = t("n1.gs.g.auftragLaeuft", { text: auftragText(e.auftrag) });
      else if (!gr) plan.grund = t("n1.gs.g.auftragGroesse");
      else if (f.loyalitaet < 35) plan.grund = t("n1.gs.g.auftragLoy", { g });
      const richtung = gr && HOCH_SCHLECHT.has(gr) ? -1 : 1;
      const wirkung = Math.round(0.6 * leistung(w, f) * 10) / 10;
      if (gr && !plan.grund) {
        const jetzt = wertVon(w, gr);
        plan.folgen.push(
          t("n1.gs.f.auftragZiel", { datum: datumAn(w, w.day + AUFTRAG_TAGE), name: grName ?? "", von: Math.round(jetzt), nach: Math.round(jetzt + richtung * 3), richtung: richtung > 0 ? "hoch" : "runter" }),
          t("n1.gs.f.auftragEinsatz", { g, d: `${richtung > 0 ? "+" : "−"}${nf(wirkung)}` }),
          t("n1.gs.f.auftragBilanz"),
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
      if (!d.regierungsamt) plan.grund = f.amt === "zentralbank" ? t("n1.gs.g.kritikZb") : t("n1.gs.g.kritikPartner");
      else if (thema.art === "person" || thema.art === "sorge") plan.grund = t("n1.gs.g.kritikAnlass");
      else if (thema.art === "lage" && lageIm(w, f).find((l) => l.id === thema.bezug)?.ton === "gut") plan.grund = t("n1.gs.g.kritikGut");
      else if (thema.art === "zusage") plan.grund = t("n1.gs.g.kritikZusage");
      plan.folgen.push(t("n1.gs.f.loyAuf", { d: vz(plan.dLoy), nach: nach(plan.dLoy) }), t("n1.gs.f.grollPlus", { n: plan.dGroll }), t("n1.gs.f.druck"));
      if (e.groll + plan.dGroll >= 50 && e.ehrgeiz >= 50) plan.folgen.push(t("n1.gs.f.leakRisiko", { n: LEAK_VERTRAUEN }));
      break;
    }
    case "belohnung": {
      plan.pk = 2;
      plan.dLoy = 10 + (e.stil === "eitel" ? 4 : 0);
      plan.dGroll = -10;
      plan.dEhrgeiz = 2;
      if (!d.regierungsamt) plan.grund = t("n1.gs.g.belohnungNur");
      else if (e.mittelBis !== undefined && e.mittelBis > w.day + 60) plan.grund = t("n1.gs.g.belohnungSchon");
      else if (f.loyalitaet >= 92) plan.grund = t("n1.gs.g.belohnungHoch");
      plan.folgen.push(t("n1.gs.f.belohnung", { l: plan.dLoy, nach: nach(plan.dLoy), gr: vz(plan.dGroll), e: plan.dEhrgeiz }), t("n1.gs.f.mittel", { ressort: d.ressort, datum: datumAn(w, w.day + AUFTRAG_TAGE) }), t("n1.gs.f.neid", { n: neider(w, f).length }));
      if (f.amt !== "finanzen") {
        const fm = sp.figuren.find((x) => x.amt === "finanzen" && x.imAmt);
        plan.folgen.push(t("n1.gs.f.finanzminister", { g: fm ? gv(fm) : "m" }));
      }
      break;
    }
    case "rueckendeckung": {
      plan.pk = 1;
      plan.dLoy = 9;
      plan.dGroll = -15;
      plan.dEhrgeiz = 1;
      if (e.groll < 20 && f.loyalitaet >= 45) plan.grund = t("n1.gs.g.rueckNiemand", { name: f.name });
      else if (!d.regierungsamt && f.amt !== "partner") plan.grund = t("n1.gs.g.rueckLager");
      plan.folgen.push(t("n1.gs.f.rueck", { l: plan.dLoy, nach: nach(plan.dLoy), gr: vz(plan.dGroll) }), t("n1.gs.f.rueckPreis", { n: RUECKENDECKUNG_VERTRAUEN }), t("n1.gs.f.rueckLager", { name: f.name }));
      break;
    }
    case "machtfrage": {
      plan.pk = 0;
      const s = machtScore(w, f);
      plan.aussicht = s >= MACHT_SCHWELLE + 10 ? "gut" : s >= MACHT_SCHWELLE - 8 ? "offen" : "schlecht";
      if (f.loyalitaet >= 55 && e.groll < 40) plan.grund = t("n1.gs.g.machtAnlass");
      else if (f.amt === "zentralbank") plan.grund = t("n1.gs.g.machtZb");
      plan.folgen.push(t("n1.gs.f.aussicht", { a: plan.aussicht }), t("n1.gs.f.fuegt", { g }), t("n1.gs.f.fuegtNicht", { g, r: d.regierungsamt ? "ja" : "nein" }));
      break;
    }
  }
  if (!plan.grund && tg) plan.grund = tg;
  if (!plan.grund) {
    const pause = neuanfangGrund(w);
    if (pause) plan.grund = pause;
  }
  if (!plan.grund && !kannZahlen(sp.kapital, plan.pk)) plan.grund = t("n1.gs.g.kapital", { pk: plan.pk });
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

const ERSTE_ZEILE: Record<AnsatzId, (th: Thema, f: Figur) => string> = {
  vertrauen: (th) => (th.art === "person" ? t("n1.gs.eins.vertrauen.person") : t("n1.gs.eins.vertrauen", { titel: th.titel })),
  rat: (th) => (th.art === "zusage" ? t("n1.gs.eins.rat.zusage") : t("n1.gs.eins.rat", { titel: th.titel })),
  auftrag: (th) => t("n1.gs.eins.auftrag", { titel: th.titel }),
  kritik: (th) => t("n1.gs.eins.kritik", { titel: th.titel }),
  belohnung: () => t("n1.gs.eins.belohnung"),
  rueckendeckung: () => t("n1.gs.eins.rueckendeckung"),
  machtfrage: () => t("n1.gs.eins.machtfrage"),
};

/** Die Antwort der Person je Ansatz, Ausgang und Stil (Katalog n1.gs.antwort.*; mit dem Geschlecht, wo die Form sich ändert). */
const antwortText = (ansatz: AnsatzId, art: "gut" | "schlecht", f: Figur, stil: Stil): string => t(`n1.gs.antwort.${ansatz}.${art}.${stil}`, { g: gv(f) });

/** Was Kritik mit Durchstechen und blinde Rückendeckung am Vertrauen in die Regierung kosten (Spielparameter; Vorschau und Buchung lesen dieselbe Zahl). */
const LEAK_VERTRAUEN = 0.4;
const RUECKENDECKUNG_VERTRAUEN = 0.1;

/** Wer Anerkennung anderer neidet (Befund C-20): seit es 19 statt 7 Plätze gibt, nur Regierungsmitglieder aus demselben Lager. */
function neider(w: World, f: Figur): Figur[] {
  const lager = eigenVon(w, f).lager;
  return (w.spiel?.figuren ?? []).filter((g) => g !== f && g.imAmt && AEMTER[g.amt].regierungsamt && eigenVon(w, g).lager === lager);
}

/** Der Auftrag in Worten, aus Größe und Richtung (der gespeicherte Text bleibt für ältere Spielstände). */
export function auftragText(a: Auftrag): string {
  const name = NET.nodes[NET.index.get(a.groesse) ?? -1]?.name;
  return name ? t("n1.gs.auftrag.text", { name, richtung: a.richtung > 0 ? "hoch" : "runter" }) : a.text;
}

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
  if (!sp || !f) return leer(t("n1.gs.g.keinePerson"));
  const p = planeGespraech(w, figurId, themaId, ansatz);
  if (!("ansatz" in p)) return leer(p.grund);
  if (p.grund) return leer(p.grund);
  const thema = themenFuer(w, figurId).find((x) => x.id === themaId)!;
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
  verbrauche(w, AUFMERKSAMKEIT_KOSTEN.gespraech, t("n1.gs.verbrauch", { name: f.name }));
  f.gespraech = w.day;
  (sp.termine ??= []).push(w.day);
  if (sp.termine.length > 40) sp.termine = sp.termine.slice(-40);

  const antwort = (art: "gut" | "schlecht") => antwortText(ansatz, art, f, e.stil);

  switch (ansatz) {
    case "vertrauen": {
      loyalitaetVerschieben(f, p.dLoy);
      grollVerschieben(w, f, p.dGroll);
      e.ehrgeiz = k100(e.ehrgeiz + p.dEhrgeiz);
      const gut = p.dLoy >= 6;
      ausgang = gut ? "gut" : "mittel";
      szene.push({ wer: "er", text: antwort(gut ? "gut" : "schlecht") });
      if (thema.art === "person") szene.push({ wer: "erzaehler", text: e.ehrgeiz >= 65 ? t("n1.gs.sz.ehrgeiz", { g: gv(f) }) : t("n1.gs.sz.ruhe", { g: gv(f) }) });
      folgen.push({ text: t("n1.gs.f.loyJetzt", { d: vz(p.dLoy), n: Math.round(f.loyalitaet) }), ton: ton(p.dLoy) }, { text: t("n1.gs.f.grollWort", { d: vz(p.dGroll), wort: grollWort(e.groll) }), ton: "gut" });
      break;
    }
    case "rat": {
      loyalitaetVerschieben(f, p.dLoy);
      hinweise.push(...ratHinweise(w, f, thema));
      ausgang = hinweise.length ? "gut" : "mittel";
      szene.push({ wer: "er", text: antwort(hinweise.length ? "gut" : "schlecht") });
      folgen.push({ text: t("n1.gs.f.wertschaetzung"), ton: "gut" });
      break;
    }
    case "auftrag": {
      const richtung: 1 | -1 = gr && HOCH_SCHLECHT.has(gr) ? -1 : 1;
      const a: Auftrag = {
        id: `auftrag-${f.id}-${w.day}`,
        text: t("n1.gs.auftrag.text", { name: grName ?? "", richtung: richtung > 0 ? "hoch" : "runter" }),
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
      folgen.push({ text: t("n1.gs.f.auftrag", { datum: datumAn(w, a.frist), name: grName ?? "", delta: a.delta, richtung: richtung > 0 ? "hoch" : "runter", jetzt: Math.round(a.vorher) }), ton: "neutral" });
      break;
    }
    case "kritik": {
      loyalitaetVerschieben(f, p.dLoy);
      grollVerschieben(w, f, p.dGroll);
      e.druckBis = w.day + 60;
      const scharf = e.groll >= 50;
      ausgang = scharf ? "schlecht" : "mittel";
      szene.push({ wer: "er", text: antwort(scharf ? "schlecht" : "gut") });
      folgen.push({ text: t("n1.gs.f.loyJetzt", { d: vz(p.dLoy), n: Math.round(f.loyalitaet) }), ton: "schlecht" }, { text: t("n1.gs.f.grollWort", { d: vz(p.dGroll), wort: grollWort(e.groll) }), ton: "schlecht" }, { text: t("n1.gs.f.druck"), ton: "gut" });
      if (e.groll >= 50 && e.ehrgeiz >= 50 && hashZahl(`${schluessel}|leak`) < 0.35) {
        vertrauenAendern(w, -LEAK_VERTRAUEN);
        addLog(w, "ereignis", t("n1.gs.leak.log", { rolle: f.rolle, name: f.name }), t("n1.gs.leak.why"));
        folgen.push({ text: t("n1.gs.f.leak", { n: LEAK_VERTRAUEN }), ton: "schlecht" });
      }
      break;
    }
    case "belohnung": {
      loyalitaetVerschieben(f, p.dLoy);
      grollVerschieben(w, f, p.dGroll);
      e.ehrgeiz = k100(e.ehrgeiz + p.dEhrgeiz);
      e.mittelBis = w.day + AUFTRAG_TAGE;
      const neid = neider(w, f);
      for (const x of neid) grollVerschieben(w, x, 3);
      if (f.amt !== "finanzen") {
        const fm = sp.figuren.find((x) => x.amt === "finanzen");
        if (fm) loyalitaetVerschieben(fm, -2);
      }
      const gut = p.dLoy >= 10;
      ausgang = gut ? "gut" : "mittel";
      szene.push({ wer: "er", text: antwort(f.loyalitaet >= 70 || e.stil === "loyal" || e.stil === "eitel" ? "gut" : "schlecht") });
      folgen.push({ text: t("n1.gs.f.loyJetzt", { d: vz(p.dLoy), n: Math.round(f.loyalitaet) }), ton: "gut" }, { text: t("n1.gs.f.mittelBis", { ressort: d.ressort, datum: datumAn(w, e.mittelBis) }), ton: "gut" }, { text: t("n1.gs.f.neid", { n: neid.length }), ton: neid.length ? "schlecht" : "neutral" });
      break;
    }
    case "rueckendeckung": {
      loyalitaetVerschieben(f, p.dLoy);
      grollVerschieben(w, f, p.dGroll);
      e.ehrgeiz = k100(e.ehrgeiz + p.dEhrgeiz);
      vertrauenAendern(w, -RUECKENDECKUNG_VERTRAUEN);
      for (const g of sp.figuren) if (g !== f && g.eigen?.lager === e.lager) loyalitaetVerschieben(g, 2);
      ausgang = "gut";
      szene.push({ wer: "er", text: antwort(f.loyalitaet >= 45 ? "gut" : "schlecht") });
      folgen.push({ text: t("n1.gs.f.loyJetzt", { d: vz(p.dLoy), n: Math.round(f.loyalitaet) }), ton: "gut" }, { text: t("n1.gs.f.grollWort", { d: vz(p.dGroll), wort: grollWort(e.groll) }), ton: "gut" }, { text: t("n1.gs.f.vertrauen", { n: RUECKENDECKUNG_VERTRAUEN }), ton: "schlecht" });
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
        folgen.push({ text: t("n1.gs.f.fuegtSich", { g: gv(f), n: Math.round(f.loyalitaet) }), ton: "gut" }, { text: t("n1.gs.f.grollEhrgeiz"), ton: "gut" });
      } else {
        ausgang = "bruch";
        szene.push({ wer: "er", text: antwort("schlecht") });
        if (d.regierungsamt && ausscheidenHaken) {
          const name = f.name;
          ausscheidenHaken(w, f, t("n1.gs.ruecktritt.grund"));
          ausgeschieden = true;
          folgen.push({ text: t("n1.gs.f.ruecktritt", { name }), ton: "schlecht" });
        } else {
          loyalitaetVerschieben(f, -20);
          grollVerschieben(w, f, 20);
          folgen.push({ text: t("n1.gs.f.bruch", { n: Math.round(f.loyalitaet) }), ton: "schlecht" });
        }
      }
      break;
    }
  }

  if (!ausgeschieden) {
    merke(w, f, t("n1.gs.merke", { ansatz: ANSATZ_NAMEN[ansatz].label, thema: thema.titel, d: loyVorher !== f.loyalitaet ? vz(Math.round(f.loyalitaet - loyVorher)) : "leer" }));
  }
  const kurz = t("n1.gs.kurz", { rolle: f.rolle, name: f.name, ansatz: ANSATZ_NAMEN[ansatz].label, a: ausgang });
  addLog(w, "entscheidung", kurz, t("n1.gs.kurz.why", { thema: thema.titel, pk: p.pk }));
  return { ok: true, text: kurz, szene, hinweise, folgen, kosten: p.pk, ausgang, ...(ausgeschieden ? { ausgeschieden } : {}) };
}

/** Ein kurzes Gespräch für Chat und Befehle: Vertrauen aufbauen zu dem, was die Person umtreibt. */
export function sprichMitFigur(w: World, figurId: string): { ok: boolean; text: string; why?: string } {
  const f = figurNachId(w, figurId);
  if (!f) return { ok: false, text: t("n1.gs.g.keinePerson") };
  if (!sprechbar(f)) return { ok: false, text: t("n1.gs.g.opposition") };
  const r = fuehreGespraech(w, figurId, "sorge", "vertrauen");
  if (!r.ok) return { ok: false, text: r.text };
  return { ok: true, text: r.text, why: t("n1.gs.sprich.why", { pk: r.kosten, name: f.name, ziel: f.ziel }) };
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
  if (!ANSATZ_REIHENFOLGE.includes(ansatz as AnsatzId)) return { ok: false, text: t("n1.gs.unbekannt", { a: ansatz }), szene: [], hinweise: [], folgen: [], kosten: 0 };
  return fuehreGespraech(w, figurId, themaId, ansatz as AnsatzId);
}

/** Warum jetzt kein Gespräch mit dieser Person möglich ist (Abkühlzeit, Termine); leer, wenn es geht. */
export function gespraechGrund(w: World, figurId: string): string | undefined {
  const f = figurNachId(w, figurId);
  if (!f) return t("n1.gs.g.keinePerson");
  if (!sprechbar(f)) return t("n1.gs.g.opposition");
  return terminGrund(w, f);
}

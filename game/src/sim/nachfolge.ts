// Entlassen, Zurücktreten, Ernennen: Ein Wechsel im Amt ist ein Prozess mit Kandidaten und Folgen. Wer geht, nimmt Groll mit und kann später
// aussagen; sein Lager ärgert sich; die Märkte reagieren auf Wechsel in Finanzen und Wirtschaft; der Nachfolger arbeitet sich zwei Monate ein
// und bringt Stil, Fähigkeit, Ehrgeiz und ein Lager mit. Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung).

import { addLog } from "./log";
import { clamp } from "./economy";
import { kannZahlen } from "./kapital";
import { vertrauenAendern, wirke } from "./wirkung";
import { Rng } from "./rng";
import { besetzeNeu, ehemaligeMerken, figur, neuerName } from "./figuren";
import { setzeAusscheidenHaken } from "./gespraeche";
import { AEMTER, eigenVon, hashZahl, loyalitaetVerschieben } from "./personen";
import type { Kandidat, LagerArt, Stil } from "./personen-typen";
import type { Figur } from "./spiel-typen";
import type { World } from "./types";

interface Archetyp {
  key: "fach" | "vertrauter" | "ehrgeizig";
  stile: Stil[];
  fae: [number, number];
  ehr: [number, number];
  loy: [number, number];
  /** Lager: eigenes Ressort-Lager, Vertraute des Präsidenten oder Partei */
  lager: (own: LagerArt) => LagerArt;
  markt: { finanzen: number; wirtschaft: number };
  echo: number;
  pk: number;
  staerke: (ressort: string) => string;
  schwaeche: string;
}

const ARCHETYPEN: Archetyp[] = [
  {
    key: "fach", stile: ["nuechtern", "vorsichtig", "streng"], fae: [74, 88], ehr: [25, 50], loy: [42, 54], lager: (own) => own,
    markt: { finanzen: -25, wirtschaft: -10 }, echo: 2, pk: 4,
    staerke: (r) => `Kennt das Ressort ${r} von innen und wird von der Fachwelt ernst genommen.`,
    schwaeche: "Wenig Rückhalt in Ihrer Partei; sagt öfter Nein.",
  },
  {
    key: "vertrauter", stile: ["loyal"], fae: [52, 66], ehr: [35, 55], loy: [66, 78], lager: () => "praesident",
    markt: { finanzen: 30, wirtschaft: 12 }, echo: 0, pk: 3,
    staerke: () => "Folgt Ihnen, und man weiß es.",
    schwaeche: "Fachlich dünn: Das Ressort leidet, und die Märkte lesen es als Signal.",
  },
  {
    key: "ehrgeizig", stile: ["machtbewusst", "eitel"], fae: [62, 76], ehr: [76, 92], loy: [48, 60], lager: () => "partei",
    markt: { finanzen: 10, wirtschaft: 5 }, echo: 2, pk: 5,
    staerke: () => "Bringt Tatkraft und eine eigene Hausmacht in der Partei.",
    schwaeche: "Denkt an die eigene Karriere und wird gefährlich, wenn er übergangen wird.",
  },
];

const HERKUNFT: Record<string, [string, string, string]> = {
  finanzen: ["Langjährige Haushaltsdirektorin der Zentralbank", "Bauunternehmer und Weggefährte aus dem Wahlkampf", "Fraktionsvize und Haushaltssprecher"],
  inneres: ["Ehemaliger Generalstaatsanwalt", "Provinzgouverneur aus Ihrer Heimatregion", "Vorsitzender des Innenausschusses"],
  aussen: ["Karrierediplomat, zuletzt Botschafter", "Berater für Außenpolitik im Präsidialamt", "Ehrgeiziger Abgeordneter mit Draht nach Brüssel"],
  stab: ["Erfahrener Staatssekretär im Präsidialamt", "Langjährige Weggefährtin und Wahlkampfleiterin", "Fraktionsgeschäftsführer mit eigener Hausmacht"],
  justiz: ["Richter am Kassationshof im Ruhestand", "Anwalt und Vertrauter aus Ihrer Kanzlei", "Abgeordnete und frühere Staatsanwältin"],
  generalstab: ["General mit Erfahrung in Nato-Stäben", "Ihr früherer Adjutant im Rang eines Generals", "Ehrgeiziger Admiral mit Rückhalt im Offizierskorps"],
  wirtschaft: ["Unternehmensberater mit Industrieerfahrung", "Unternehmer aus Ihrem Umfeld", "Ehrgeiziger Parteikopf mit Verbindung zu den Verbänden"],
};

const zufall = (w: World, f: Figur, extra: string): number => hashZahl(`${w.seed}|${f.id}|${eigenVon(w, f).seit}|${f.name}|${extra}`);

const between = (a: number, b: number, u: number): number => Math.round(a + (b - a) * u);

/** Drei Kandidaten für ein Amt: fachlich stark, vertraut oder ehrgeizig. Stabil, solange der Amtsinhaber gleich bleibt. */
export function kandidatenFuer(w: World, amt: Figur["amt"]): Kandidat[] {
  const f = figur(w, amt);
  if (!f) return [];
  const d = AEMTER[amt];
  const herkunft = HERKUNFT[amt] ?? ["Fachmann aus dem Ressort", "Vertrauter des Präsidenten", "Ehrgeiziger Parteipolitiker"];
  const rng = new Rng(Math.floor(zufall(w, f, "kand") * 2147483647));
  const benutzt = new Set((w.spiel?.figuren ?? []).map((x) => x.name));
  return ARCHETYPEN.map((a, i): Kandidat => {
    const u = (s: string) => zufall(w, f, `${a.key}|${s}`);
    const name = neuerName(rng, benutzt, f.weiblich);
    const markt = amt === "finanzen" ? a.markt.finanzen : amt === "wirtschaft" ? a.markt.wirtschaft : 0;
    return {
      id: `${amt}-${a.key}`,
      name,
      weiblich: !!f.weiblich,
      stil: a.stile[Math.floor(u("stil") * a.stile.length)]!,
      faehigkeit: between(a.fae[0], a.fae[1], u("fae")),
      ehrgeiz: between(a.ehr[0], a.ehr[1], u("ehr")),
      lager: a.lager(d.lager),
      loyalitaet: between(a.loy[0], a.loy[1], u("loy")),
      herkunft: herkunft[i]!,
      staerke: a.staerke(d.ressort),
      schwaeche: a.schwaeche,
      markt,
      lagerEcho: a.echo,
      pk: a.pk,
    };
  });
}

export const KOMMISSARISCH_PK = 2;

/** Was eine Entlassung bewirkt, in Worten mit Zahlen (für die Oberfläche vor der Entscheidung). */
export function entlassungsFolgen(w: World, amt: Figur["amt"]): string[] {
  const f = figur(w, amt);
  if (!f) return [];
  const e = eigenVon(w, f);
  const gleich = (w.spiel?.figuren ?? []).filter((x) => x !== f && x.imAmt && eigenVon(w, x).lager === e.lager);
  const out = [`${f.name} geht${e.groll >= 30 || f.loyalitaet < 35 ? " im Groll" : ""} und kann später aussagen (Groll ${Math.round(Math.min(100, 35 + e.groll * 0.5 + (f.loyalitaet < 30 ? 20 : 0)))} von 100).`];
  if (gleich.length) out.push(`${gleich.map((x) => x.name).join(", ")} aus demselben Lager (${lagerKurz(e.lager)}): Loyalität −4.`);
  out.push("Vertrauen in die Regierung −0,4: Die Presse fragt nach dem Grund.");
  if (amt === "finanzen") out.push("Märkte: Risikoaufschlag +30 Punkte, Glaubwürdigkeit −0,03.");
  else if (amt === "wirtschaft") out.push("Märkte: Risikoaufschlag +10 Punkte.");
  out.push("Der Nachfolger arbeitet sich zwei Monate ein: Ressortleistung −25 %.");
  return out;
}

const LAGER_KURZ: Record<LagerArt, string> = { praesident: "Vertraute", partei: "Partei", apparat: "Sicherheitsapparat", markt: "Wirtschaft", diplomatie: "Diplomatie", justiz: "Justiz", streitkraefte: "Streitkräfte", opposition: "Opposition" };
const lagerKurz = (l: LagerArt) => LAGER_KURZ[l];

export interface WechselErgebnis {
  ok: boolean;
  text: string;
  why?: string;
  folgen: string[];
}

function verlasse(w: World, f: Figur, grund: string, groll?: number): void {
  const e = eigenVon(w, f);
  ehemaligeMerken(w, f, grund, groll);
  for (const x of w.spiel!.figuren) if (x !== f && x.imAmt && eigenVon(w, x).lager === e.lager && AEMTER[x.amt].regierungsamt) loyalitaetVerschieben(x, -4);
  vertrauenAendern(w, -0.4);
}

function marktFolgen(w: World, amt: Figur["amt"]): void {
  if (amt === "finanzen") {
    w.economy.riskPremium += 30;
    w.economy.credibility = clamp(w.economy.credibility - 0.03, 0.05, 0.95);
  } else if (amt === "wirtschaft") {
    w.economy.riskPremium += 10;
    w.economy.credibility = clamp(w.economy.credibility - 0.01, 0.05, 0.95);
  } else {
    w.economy.credibility = clamp(w.economy.credibility - 0.01, 0.05, 0.95);
  }
}

function ernennen(w: World, f: Figur, k: Kandidat): void {
  besetzeNeu(w, f, { name: k.name, weiblich: k.weiblich, loyalitaet: k.loyalitaet, stil: k.stil, faehigkeit: k.faehigkeit, ehrgeiz: k.ehrgeiz, lager: k.lager, notiz: `Ernannt: ${k.herkunft}` });
  if (k.markt) w.economy.riskPremium = Math.max(0, w.economy.riskPremium + k.markt);
  if (k.lagerEcho) for (const x of w.spiel!.figuren) if (x !== f && x.imAmt && eigenVon(w, x).lager === k.lager && AEMTER[x.amt].regierungsamt) loyalitaetVerschieben(x, k.lagerEcho);
}

/**
 * Entlässt die Amtsinhaberin und ernennt einen Kandidaten (`kandidatId`) oder setzt eine kommissarische Leitung ein (`null`).
 * Kostet die Ernennung in Kapital; die Folgen wirken sofort und später (Ehemalige, Lager, Märkte).
 */
export function entlasse(w: World, amt: Figur["amt"], kandidatId: string | null): WechselErgebnis {
  const sp = w.spiel;
  const f = figur(w, amt);
  const leer = (text: string): WechselErgebnis => ({ ok: false, text, folgen: [] });
  if (!sp || !f) return leer("Dieses Amt gibt es in dieser Partie nicht.");
  if (!AEMTER[amt].entlassbar) return leer(amt === "zentralbank" ? "Die Zentralbankführung tauschen Sie unter Zentralbank und Haushalt aus." : "Dieses Amt lässt sich nicht durch eine Entlassung neu besetzen.");
  const k = kandidatId === null ? null : kandidatenFuer(w, amt).find((x) => x.id === kandidatId);
  if (kandidatId !== null && !k) return leer("Diesen Kandidaten gibt es nicht.");
  const pk = k ? k.pk : KOMMISSARISCH_PK;
  if (!kannZahlen(sp.kapital, pk)) return leer(`Ein Wechsel im Amt kostet ${pk} Kapital; vorhanden sind ${Math.floor(sp.kapital)}.`);
  sp.kapital -= pk;
  const alt = `${f.rolle} ${f.name}`;
  const folgen = entlassungsFolgen(w, amt);
  verlasse(w, f, "vom Präsidenten entlassen");
  marktFolgen(w, amt);
  if (k) {
    ernennen(w, f, k);
    folgen.push(`${k.name} (${k.herkunft}) übernimmt: ${k.staerke}`);
  } else {
    const rng = new Rng(Math.floor(zufall(w, f, "interim") * 2147483647));
    const benutzt = new Set(sp.figuren.map((x) => x.name));
    besetzeNeu(w, f, { name: neuerName(rng, benutzt, f.weiblich), loyalitaet: 50, faehigkeit: 45, ehrgeiz: 20, kommissarisch: true, notiz: `Kommissarisch eingesetzt nach der Entlassung von ${alt}` });
    folgen.push("Eine kommissarische Leitung führt das Ressort; sie leistet weniger, bis ein Nachfolger ernannt wird.");
  }
  const neu = `${f.rolle} ${f.name}`;
  const text = `Der Präsident entlässt ${alt} und ${k ? `ernennt ${neu}` : `setzt ${neu} kommissarisch ein`}.`;
  addLog(w, "entscheidung", text, amt === "finanzen" ? "Märkte reagieren nervös auf einen Wechsel im Finanzministerium." : "Ein Wechsel im Kabinett kostet Kapital und macht Feinde.");
  return { ok: true, text: `${alt} ist entlassen, ${neu} ${k ? "übernimmt" : "führt kommissarisch"}.`, why: `Kosten ${pk} Kapital.`, folgen };
}

/** Ernennt einen Nachfolger für eine kommissarische Leitung. */
export function ernenneNachfolger(w: World, amt: Figur["amt"], kandidatId: string): WechselErgebnis {
  const sp = w.spiel;
  const f = figur(w, amt);
  const leer = (text: string): WechselErgebnis => ({ ok: false, text, folgen: [] });
  if (!sp || !f) return leer("Dieses Amt gibt es in dieser Partie nicht.");
  if (!f.eigen?.kommissarisch) return leer("Das Amt ist besetzt; wer es neu besetzen will, muss entlassen.");
  const k = kandidatenFuer(w, amt).find((x) => x.id === kandidatId);
  if (!k) return leer("Diesen Kandidaten gibt es nicht.");
  const pk = Math.max(1, k.pk - 1);
  if (!kannZahlen(sp.kapital, pk)) return leer(`Die Ernennung kostet ${pk} Kapital; vorhanden sind ${Math.floor(sp.kapital)}.`);
  sp.kapital -= pk;
  const alt = `${f.rolle} ${f.name} (kommissarisch)`;
  ernennen(w, f, k);
  addLog(w, "entscheidung", `Der Präsident ernennt ${f.rolle} ${f.name} zur festen Leitung, anstelle von ${alt}.`, "Ein fester Nachfolger arbeitet sich ein und bringt Rückhalt.");
  return { ok: true, text: `${f.name} übernimmt das Amt fest.`, why: `Kosten ${pk} Kapital.`, folgen: [`${k.name} (${k.herkunft}): ${k.staerke}`] };
}

/** Der Rücktritt im Streit (nach einem Ultimatum, einer Drohung oder einem Skandal): eine kommissarische Leitung übernimmt, der Vorgänger nimmt Groll mit. */
export function ausscheiden(w: World, f: Figur, grund: string): void {
  if (!w.spiel || !AEMTER[f.amt].regierungsamt) return;
  const alt = `${f.rolle} ${f.name}`;
  const rng = new Rng(Math.floor(zufall(w, f, "rueck") * 2147483647));
  const benutzt = new Set(w.spiel.figuren.map((x) => x.name));
  verlasse(w, f, grund, Math.min(100, 55 + eigenVon(w, f).groll * 0.4));
  marktFolgen(w, f.amt);
  besetzeNeu(w, f, { name: neuerName(rng, benutzt, f.weiblich), loyalitaet: 50, faehigkeit: 45, ehrgeiz: 20, kommissarisch: true, notiz: `Kommissarisch eingesetzt nach dem Rücktritt von ${alt}` });
  addLog(w, "ereignis", `${alt} tritt zurück.`, `${grund}. Eine kommissarische Leitung übernimmt; die Märkte und die Presse achten auf den Nachfolger.`);
}

setzeAusscheidenHaken((w, f, grund) => ausscheiden(w, f, grund));

/** Für Chat und Sprachmodell: entlässt und wählt einen Kandidaten nach dem Zufallsstrom (ohne Auswahlfenster). */
export function entlasseSchnell(w: World, amt: Figur["amt"], rng: Rng): WechselErgebnis {
  const ks = kandidatenFuer(w, amt);
  if (!ks.length) return { ok: false, text: "Dieses Amt gibt es in dieser Partie nicht.", folgen: [] };
  const k = ks[Math.min(ks.length - 1, Math.floor(rng.next() * ks.length))]!;
  return entlasse(w, amt, k.id);
}

/** Wirkung einer Entlassung für die Zentralbank: hier nur ein Hinweis, der Ablauf steht in Zentralbank und Haushalt. */
export const kannEntlassen = (f: Figur): boolean => AEMTER[f.amt].entlassbar;

// ---------------------------------------------------------------------------
// Ehemalige

/** Monatlich: Wer im Streit gegangen ist, redet vielleicht. */
export function ehemaligeMonat(w: World): void {
  const sp = w.spiel;
  if (!sp?.ehemalige) return;
  for (const x of sp.ehemalige) {
    if (x.ausgepackt) continue;
    x.groll = Math.max(0, x.groll - 0.5);
    if (x.groll < 55 || x.ehrgeiz < 40) continue;
    const p = 0.035 + (x.groll - 55) / 600;
    if (hashZahl(`${w.seed}|${x.name}|${w.day}|packt`) < p) {
      x.ausgepackt = true;
      vertrauenAendern(w, -1);
      wirke(w, "legitimitaet", -0.8);
      wirke(w, "polarisierung", 0.5);
      const titel = `${x.rolle} ${x.name} packt aus`;
      addLog(w, "ereignis", `${titel}: In Interviews und einem Buch schildert ${x.weiblich ? "die frühere" : "der frühere"} ${x.rolle.replace(/^(Der|Die) /, "")} das Innenleben der Regierung.`, "Wer im Streit geht, nimmt seine Kenntnisse mit; das Vertrauen in die Regierung sinkt.");
      sp.chronik.push({ tag: w.day, datum: w.date, titel, ausgang: "Die Enthüllungen schaden dem Ansehen der Regierung: Vertrauen und Legitimität sinken." });
    }
  }
}


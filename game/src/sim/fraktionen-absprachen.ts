// Stimmen mit Gesichtern (befund-B B-10): Fehlende Stimmen kauft der Präsident nicht mehr anonym für 0,5 Kapital das Stück, sondern
// gewinnt sie bei benannten Abgeordneten einer Oppositionsfraktion. Jede Absprache hat einen Preis und ein Risiko:
//   - Zusage: Die Gruppe stimmt mit, wenn die Regierung die Forderung ihrer Fraktion erfüllt. Billig an Kapital, aber eine echte Zusage
//     mit Frist (sim/zusagenfolgen.ts); wer sie bricht, zahlt wie bei jeder gebrochenen Zusage.
//   - Posten: Ein Abgeordneter der Gruppe bekommt einen Posten (Ausschussvorsitz, Aufsichtsrat). Mittlerer Preis, höchstes Risiko,
//     dass die Presse die Absprache aufdeckt.
//   - Gefallen: Ein Gefallen in der Heimatprovinz (Genehmigung, Auftrag). Teurer an Kapital, mittleres Risiko.
// Der Preis steigt mit jeder Absprache der letzten zwölf Monate; aus einer Fraktion lässt sich nur ein kleiner Teil gewinnen.
// Ob die Presse aufdeckt, entscheidet am Abstimmungstag ein Würfel aus Samen und Absprache (kein Eingriff in den Zufallsstrom).
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachen über echte Abgeordnete. Namen sind erfunden.

import type { World } from "./types";
import type { Gesetz } from "./spiel-typen";
import { hashWert, AUFMERKSAMKEIT_KOSTEN, verbrauche } from "./aufmerksamkeit";
import { gesetzPrognose, setzeAbsprachenHaken, STIMMEN_PUFFER, type Ergebnis } from "./handeln";
import { fraktionsUebersicht } from "./verhandeln";
import { duldung, PARTEI_NAME } from "./fraktionen";
import { NAMENSVORRAT } from "./figuren";
import { PROVINZEN } from "./regional";
import { festeZusage } from "./zusagenfolgen";
import { kannZahlen } from "./kapital";
import { vertrauenAendern } from "./wirkung";
import { addLog } from "./log";
import { msg, t, tIn } from "../i18n";

export type AbspracheArt = "zusage" | "posten" | "gefallen";

export const ABSPRACHE = {
  /** Höchstens dieser Anteil einer Fraktion lässt sich für ein Gesetz einzeln gewinnen */
  anteilJeFraktion: 0.12,
  /** Kleinste Fraktion, mit deren Abgeordneten man spricht */
  mindestSitze: 8,
  maxAngebote: 3,
  /** Kapital je gewonnener Stimme */
  preisJeStimme: { zusage: 0.3, posten: 0.6, gefallen: 0.9 } as Record<AbspracheArt, number>,
  /** Preisaufschlag je Absprache der letzten zwölf Monate */
  steigerung: 0.25,
  gedaechtnisTage: 365,
  /** Grundrisiko der Aufdeckung je Absprache; wächst mit der Zahl der Beteiligten */
  aufdeckung: { zusage: 0.06, posten: 0.2, gefallen: 0.12 } as Record<AbspracheArt, number>,
  /** Frist der Zusage an die Fraktion */
  zusageTage: 180,
  /** Folgen einer aufgedeckten Absprache */
  folgeVertrauen: -1.5,
  folgeZustimmung: -1,
} as const;

export interface Absprache {
  id: string;
  partei: string;
  /** Wortführer der Gruppe (erfunden) */
  wer: string;
  /** Kfz-Kennziffer der Heimatprovinz */
  provinz: number;
  n: number;
  art: AbspracheArt;
  kapital: number;
  /** Wahrscheinlichkeit, dass die Presse die Absprache bis zur Abstimmung aufdeckt */
  risiko: number;
  /** Bei einer Zusage: was die Fraktion verlangt */
  forderung?: string;
}

const ARTEN: readonly AbspracheArt[] = ["zusage", "posten", "gefallen"];

function kaeufeImJahr(w: World, extra = 0): number {
  const tage = w.spiel?.gesetzgebung?.kaeufe ?? [];
  return tage.filter((d) => w.day - d < ABSPRACHE.gedaechtnisTage).length + extra;
}

function wortfuehrer(w: World, schluessel: string): string {
  const v = NAMENSVORRAT.vornamen;
  const n = NAMENSVORRAT.nachnamen;
  return `${v[Math.floor(hashWert(`${w.seed}|${schluessel}|vor`) * v.length)]} ${n[Math.floor(hashWert(`${w.seed}|${schluessel}|nach`) * n.length)]}`;
}

/** Risiko als Wort (keine falsche Genauigkeit). */
export function risikoWort(p: number): "gering" | "mittel" | "hoch" {
  return p < 0.12 ? "gering" : p < 0.25 ? "mittel" : "hoch";
}

/** Die Angebote zu einem Gesetz, billigste Stimme zuerst. `extraKaeufe` und `gekauft` erlauben eine Vorschau mehrerer Käufe. */
export function absprachenAngebote(w: World, g: Gesetz, bedarf?: number, extraKaeufe = 0, gekauft: Record<string, number> = {}): Absprache[] {
  const sp = w.spiel;
  const parl = w.parliament;
  if (!sp || !parl) return [];
  // Wie die Tagesordnung: gemessen am Abstimmungstag (auslaufende Duldungen zählen schon nicht mehr)
  const noetig = bedarf ?? gesetzPrognose(w, g).noetig;
  if (noetig <= 0) return [];
  const dul = new Set(duldung(w).parteien);
  const sicht = new Map(fraktionsUebersicht(w).map((f) => [f.partei, f]));
  const faktor = 1 + ABSPRACHE.steigerung * kaeufeImJahr(w, extraKaeufe);
  const out: Absprache[] = [];
  for (const [partei, sitze] of Object.entries(parl.seats).sort((a, b) => b[1] - a[1])) {
    if (partei === w.player?.partei.kurz || sp.lager.includes(partei) || dul.has(partei) || sitze < ABSPRACHE.mindestSitze) continue;
    const schon = (g.zusagenListe ?? []).filter((a) => a.partei === partei).reduce((s, a) => s + a.n, 0) + (gekauft[partei] ?? 0);
    const frei = Math.ceil(sitze * ABSPRACHE.anteilJeFraktion) - schon;
    if (frei <= 0) continue;
    const n = Math.min(frei, noetig);
    const f = sicht.get(partei);
    let art = ARTEN[Math.floor(hashWert(`${w.seed}|${g.id}|${partei}|art`) * ARTEN.length)]!;
    if (art === "zusage" && !f?.zusagenziel) art = "gefallen";
    const kapital = Math.max(1, Math.ceil(n * ABSPRACHE.preisJeStimme[art] * faktor));
    const risiko = Math.min(0.5, Math.max(0.03, ABSPRACHE.aufdeckung[art] * (0.6 + n / 10)));
    const schluessel = `${g.id}|${partei}|${schon}`;
    out.push({
      id: `abs-${g.id}-${partei}-${schon}`,
      partei,
      wer: wortfuehrer(w, schluessel),
      provinz: 1 + Math.floor(hashWert(`${w.seed}|${schluessel}|provinz`) * PROVINZEN.length),
      n,
      art,
      kapital,
      risiko,
      ...(art === "zusage" && f ? { forderung: f.forderung } : {}),
    });
  }
  return out.sort((a, b) => a.kapital / a.n - b.kapital / b.n || a.risiko - b.risiko).slice(0, ABSPRACHE.maxAngebote);
}

export function provinzVon(a: Pick<Absprache, "provinz">): string {
  return PROVINZEN[a.provinz - 1]?.name ?? String(a.provinz);
}

/** Eine Absprache schließen: Kapital zahlen, Stimmen zählen mit, Zusage anlegen. */
export function schliesseAbsprache(w: World, gesetzId: string, angebotId: string, bedarf?: number): Ergebnis {
  const sp = w.spiel;
  const g = sp?.gesetze.find((x) => x.id === gesetzId);
  if (!sp || !g) return { ok: false, text: t("n4.grund.nichtMehrDa") };
  const a = absprachenAngebote(w, g, bedarf).find((x) => x.id === angebotId);
  if (!a) return { ok: false, text: t("n4.abs.veraltet") };
  if (!kannZahlen(sp.kapital, a.kapital)) return { ok: false, text: t("n4.abs.kapital", { n: a.kapital, da: Math.floor(sp.kapital) }) };
  sp.kapital -= a.kapital;
  verbrauche(w, AUFMERKSAMKEIT_KOSTEN.stimmenkauf, t("n4.abs.aufmerksamkeit", { name: g.name }));
  g.absprachen += a.n;
  (g.zusagenListe ??= []).push(a);
  ((sp.gesetzgebung ??= { ruhe: {}, beschlossen: [], pruefungen: [], vorher: {} }).kaeufe ??= []).push(w.day);
  const partei = PARTEI_NAME[a.partei] ?? a.partei;
  const werte = { wer: a.wer, partei, provinz: provinzVon(a), n: a.n, name: g.name, forderung: a.forderung ?? "" };
  if (a.art === "zusage") {
    const f = fraktionsUebersicht(w).find((x) => x.partei === a.partei);
    sp.zusagen.push(festeZusage(w, {
      id: `z-absprache-${a.partei}-${w.day}-${g.id}`,
      von: a.partei,
      text: tIn("de", "n4.abs.zusageText", werte),
      msg: msg("n4.abs.zusageText", werte),
      faellig: w.day + ABSPRACHE.zusageTage,
      ...(f?.zusagenziel ? { massnahme: f.zusagenziel.massnahme, richtung: 1, stufeStart: f.zusagenziel.stufeStart, stufeZiel: f.zusagenziel.stufeZiel } : {}),
      erfuellt: false,
      gebrochen: false,
    }));
  }
  const text = t(`n4.abs.${a.art}.text`, werte);
  const why = t("n4.abs.warum", { pk: a.kapital, risiko: t(`n4.abs.risiko.${risikoWort(a.risiko)}`) });
  addLog(w, "entscheidung", text, why);
  return { ok: true, text, why };
}

/** Was `anzahl` Stimmen über die günstigsten Absprachen kosten (Vorschau, ohne etwas zu buchen). */
export function absprachenPreis(w: World, g: Gesetz, anzahl: number): { kapital: number; stimmen: number } {
  let rest = anzahl;
  let kapital = 0;
  let stimmen = 0;
  const gekauft: Record<string, number> = {};
  for (let i = 0; rest > 0 && i < 12; i++) {
    const a = absprachenAngebote(w, g, rest, i, gekauft)[0];
    if (!a) break;
    kapital += a.kapital;
    stimmen += a.n;
    rest -= a.n;
    gekauft[a.partei] = (gekauft[a.partei] ?? 0) + a.n;
  }
  return { kapital, stimmen };
}

/** `anzahl` Stimmen über die günstigsten Absprachen gewinnen (Chat, Ressortvorlagen). */
function kaufe(w: World, g: Gesetz, anzahl: number): Ergebnis {
  const preis = absprachenPreis(w, g, anzahl);
  if (preis.stimmen === 0) return { ok: false, text: t("n4.abs.keine") };
  if (!kannZahlen(w.spiel!.kapital, preis.kapital)) return { ok: false, text: t("n4.abs.kapital", { n: preis.kapital, da: Math.floor(w.spiel!.kapital) }) };
  let rest = anzahl;
  const texte: string[] = [];
  for (let i = 0; rest > 0 && i < 12; i++) {
    const a = absprachenAngebote(w, g, rest)[0];
    if (!a) break;
    const r = schliesseAbsprache(w, g.id, a.id, rest);
    if (!r.ok) return texte.length ? { ok: true, text: texte.join(" ") } : r;
    texte.push(r.text);
    rest -= a.n;
  }
  return { ok: true, text: texte.join(" "), why: t("n4.abs.sammelWarum", { pk: preis.kapital, n: preis.stimmen }) };
}

setzeAbsprachenHaken({ kaufe, preis: absprachenPreis });

/** Am Abstimmungstag: Deckt die Presse eine Absprache auf, kostet das Vertrauen und Zustimmung. */
export function deckeAbsprachenAuf(w: World, g: Gesetz): void {
  const sp = w.spiel;
  if (!sp) return;
  for (const a of g.zusagenListe ?? []) {
    if (hashWert(`${w.seed}|${a.id}|presse`) >= a.risiko) continue;
    vertrauenAendern(w, ABSPRACHE.folgeVertrauen);
    sp.umfrage.zustimmung = Math.max(0, sp.umfrage.zustimmung + ABSPRACHE.folgeZustimmung);
    addLog(w, "ereignis", t(`n4.abs.${a.art}.aufgedeckt`, { wer: a.wer, partei: PARTEI_NAME[a.partei] ?? a.partei, provinz: provinzVon(a), n: a.n, name: g.name }), t("n4.abs.aufgedecktWarum"));
  }
}

/** Puffer, bis zu dem die Angebote reichen (gleich der Vorschau in handeln.ts). */
export const ABSPRACHEN_PUFFER = STIMMEN_PUFFER;

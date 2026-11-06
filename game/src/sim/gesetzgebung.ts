// Gesetzesvorhaben mit Konflikt: Der Spieler wählt ein Vorhaben, eine Fassung (scharf, Kompromiss, verwässert) und den Weg
// (Parlament oder, wo erlaubt, Erlass). Der Rest läuft über die vorhandene Mechanik: Kapital, Abstimmung nach der Sitzverteilung,
// Stimmenkauf und Rückzug (sim/handeln.ts), Umsetzung im Politiknetz (sim/umsetzung.ts), Reaktion der Partner und Stammwähler (sim/linie.ts).
// Neu sind hier nur die Fassung, das sichtbare Lager je Vorhaben, die Folgen nach der Abstimmung (Verbände, Straße, Rathäuser)
// und das Verfassungsgericht als Schatten über Erlassen und grundrechtsnahen Gesetzen.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung).

import { politikGeaendert } from "./zynismus";
import { FASSUNG_WERTE, FASSUNGEN, GESETZESVORHABEN, STANDARD_SCHRITTE, VERBAENDE, VORHABEN_NACH_ID, type FassungId, type GesetzesVorhaben } from "../data/gesetzesvorhaben";
import { GRUPPEN } from "./gruppen";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { addLog } from "./log";
import { t } from "../i18n";
import { clamp } from "./economy";
import { wirke, vertrauenAendern } from "./wirkung";
import { PARTEI_NAME } from "./fraktionen";
import { parteiAchsen, spielerAchsen, uebereinstimmung } from "./linie";
import { kannZahlen } from "./kapital";
import { AUFMERKSAMKEIT_KOSTEN, hashWert, neuanfangGrund, verbrauche } from "./aufmerksamkeit";
import { GESETZ_SCHWELLE, REGELN, STIMMEN_PUFFER, bringeEin, gesetzPrognose, pruefeVorhaben, setPolicy, setzeAbstimmungsHaken, setzeFassungsFolgen, setzeFassungsRechner, setzeUnterschriftHaken, stimmenSicht, verkuende, type Ergebnis, type FassungsInfo, type PlenumErgebnis, type Pruefung } from "./handeln";
import { deckeAbsprachenAuf } from "./fraktionen-absprachen";
import { notstandTag } from "./notstand";
import { stufenName } from "../data/skalen";
import { istLagerPartei } from "./kommunen";
import { vorschlaege } from "./vorschlaege";
import type { Gesetz } from "./spiel-typen";
import type { World } from "./types";

export const GESETZGEBUNG = {
  /** Tage, bis dasselbe Vorhaben nach einer Annahme wieder auf den Tisch kann */
  ruheNachAnnahme: 365,
  /** … nach einer Niederlage */
  ruheNachNiederlage: 120,
  /** Tage vom Erlass oder Gesetz bis zum Spruch des Verfassungsgerichts */
  gerichtTage: 120,
  /** Ab dieser Übereinstimmung zählt eine Partei als dafür oder dagegen (−1 bis +1) */
  lagerSchwelle: 0.15,
  /** Mindestgröße einer Fraktion (Art. 95 Abs. 2 der Verfassung) */
  fraktionSitze: 20,
  /** Ein Fünftel der Abgeordneten darf gemeinsam auf Normenkontrolle klagen (Art. 150: ein Fünftel von 600) */
  klageQuorum: 120,
  /** Klagefrist ab Veröffentlichung (Art. 151); im Spiel klagt, wer klagen will, sofort */
  klageFrist: 60,
  /** Vorhaben, die vorn auf dem Tisch liegen; der Rest ist aufklappbar */
  vorn: 6,
  /** Großstädte, in denen sich Rathäuser gegen kommunale Gesetze stellen */
  grossstaedte: [34, 6, 35, 16, 7, 1, 27, 42] as readonly number[],
} as const;

const STAEDTE = [34, 6, 35];

export interface GerichtsPruefung {
  id: string;
  vorhaben: string;
  fassung: FassungId;
  massnahme: string;
  /** Stufe vor der Änderung: dahin fällt die Maßnahme zurück, wenn das Gericht aufhebt */
  alteStufe: number;
  weg: "erlass" | "klage";
  tag: number;
  p: number;
}

export interface GesetzgebungZustand {
  /** Bis zu welchem Tag ein Vorhaben ruht */
  ruhe: Record<string, number>;
  /** Beschlossene Vorhaben (neueste zuletzt) */
  beschlossen: { vorhaben: string; fassung: FassungId; tag: number; weg: "gesetz" | "erlass" }[];
  pruefungen: GerichtsPruefung[];
  /** Stufe vor dem Einbringen je laufendem Gesetz (für die Normenkontrolle nach der Annahme) */
  vorher: Record<string, number>;
  /** Tage, an denen der Präsident Stimmen bei Abgeordneten gewonnen hat (Preisanstieg, sim/fraktionen-absprachen.ts) */
  kaeufe?: number[];
  /** Angenommene Gesetze, die auf Unterschrift oder Rücksendung warten (Art. 89) */
  unterschrift?: Unterschrift[];
  /** Laufender Ausnahmezustand (sim/notstand.ts) */
  notstand?: import("./notstand").NotstandZustand;
}

/** Ein angenommenes Gesetz beim Präsidenten: 15 Tage zum Verkünden oder Zurücksenden (Art. 89). */
export interface Unterschrift {
  gesetz: Gesetz;
  ja: number;
  nein: number;
  abwesend: number;
  /** Tag der Annahme */
  tag: number;
  /** Bis zu diesem Tag muss der Präsident entscheiden; danach gilt das Gesetz als verkündet */
  frist: number;
}

/** Zustand anlegen oder ergänzen (ältere Spielstände haben ihn nicht). */
export function gesetzgebungVon(w: World): GesetzgebungZustand {
  const sp = w.spiel!;
  const z = (sp.gesetzgebung ??= { ruhe: {}, beschlossen: [], pruefungen: [], vorher: {} });
  z.ruhe ??= {};
  z.beschlossen ??= [];
  z.pruefungen ??= [];
  z.vorher ??= {};
  return z;
}

/** Nur lesen (Anzeige): legt nichts im Spielstand an. */
function leseZustand(w: World): GesetzgebungZustand {
  const z = w.spiel?.gesetzgebung;
  return { ruhe: z?.ruhe ?? {}, beschlossen: z?.beschlossen ?? [], pruefungen: z?.pruefungen ?? [], vorher: z?.vorher ?? {} };
}

// ---------------------------------------------------------------------------
// Lager: wer dafür, wer dagegen ist

export interface LagerEintrag {
  id: string;
  name: string;
  art: "eigene" | "partei" | "partner" | "gruppe" | "verband";
  /** Sitze (nur Parteien) */
  sitze?: number;
}

export function akteurName(id: string): string {
  if (GRUPPEN.some((g) => g.id === id)) return t(`prolog.gruppe.${id}`);
  return t(`gesetz.verband.${id}`);
}

function akteurArt(id: string): "gruppe" | "verband" {
  return GRUPPEN.some((g) => g.id === id) ? "gruppe" : "verband";
}

/** Parteien nach ihrer Linie (fünf Achsen) zu Maßnahme und Richtung; Verbände und Gruppen aus den Daten. */
export function lagerVon(w: World, v: GesetzesVorhaben): { fuer: LagerEintrag[]; gegen: LagerEintrag[] } {
  const fuer: LagerEintrag[] = [];
  const gegen: LagerEintrag[] = [];
  const sitze = w.parliament?.seats ?? {};
  const eigene = w.player?.partei.kurz;
  for (const [partei, s] of Object.entries(sitze).sort((a, b) => b[1] - a[1])) {
    if (s <= 0) continue;
    const achsen = partei === eigene ? spielerAchsen(w) : parteiAchsen(partei);
    if (!achsen) continue;
    const a = uebereinstimmung(achsen, v.massnahme, v.richtung);
    const lager = partei === eigene || (w.spiel?.lager ?? []).includes(partei);
    const e: LagerEintrag = { id: partei, name: PARTEI_NAME[partei] ?? partei, art: partei === eigene ? "eigene" : lager ? "partner" : "partei", sitze: s };
    if (a >= GESETZGEBUNG.lagerSchwelle) fuer.push(e);
    else if (a <= -GESETZGEBUNG.lagerSchwelle) gegen.push(e);
  }
  for (const id of v.fuer) fuer.push({ id, name: akteurName(id), art: akteurArt(id) });
  for (const id of v.gegen) gegen.push({ id, name: akteurName(id), art: akteurArt(id) });
  return { fuer, gegen };
}

// ---------------------------------------------------------------------------
// Karte eines Vorhabens

export type Urteil = "sicher" | "knapp" | "verloren";

export interface FassungSicht {
  fassung: FassungId;
  ziel: number;
  /** Änderung in Stufenpunkten (mit Vorzeichen) */
  aenderung: number;
  pk: number;
  bezahlbar: boolean;
  /** Haushalt in % des BIP im Jahr; positiv = kostet, negativ = bringt ein */
  kostenBip: number;
  monate: number;
  ja: number;
  urteil: Urteil;
  stimmenBonus: number;
  erlass?: { pk: number; bezahlbar: boolean; gerichtP: number };
  /** Wahrscheinlichkeit, dass die Opposition nach der Annahme klagt und das Gericht aufhebt */
  klageP: number;
  moeglich: boolean;
  grund?: string;
}

export interface VorhabenSicht {
  def: GesetzesVorhaben;
  titel: string;
  satz: string;
  kompromiss: string;
  thema: string;
  stufe: number;
  lager: { fuer: LagerEintrag[]; gegen: LagerEintrag[] };
  fassungen: Record<FassungId, FassungSicht>;
  /** Liegt gerade im Parlament */
  imParlament?: { gesetzId: string; tage: number; urteil: Urteil; ja: number };
  /** Ruht bis zu diesem Tag */
  ruhtTage?: number;
  /** Beim Gericht anhängig */
  gericht?: { tage: number; p: number };
  /** Rang auf dem Tisch (höher = dringender) */
  rang: number;
  /** Warum es vorn liegt (Kalender, akute Probleme, Linie) */
  anlass?: "kalender" | "akut" | "linie" | "fokus";
}

const schritte = (v: GesetzesVorhaben) => v.schritte ?? STANDARD_SCHRITTE;
const knotenDa = (id: string) => NET.index.get(id) !== undefined;

/**
 * Wer gegen ein Vorhaben auf Normenkontrolle klagt (Art. 150): eine der beiden größten Fraktionen, wenn sie außerhalb des Lagers steht
 * und das Vorhaben ablehnt, sonst die ablehnenden Abgeordneten außerhalb des Lagers gemeinsam, wenn sie ein Fünftel der Sitze haben.
 * Zurück kommt die Partei, die die Klage anführt.
 */
function klaeger(w: World, v: GesetzesVorhaben): string | undefined {
  const sitze = w.parliament?.seats ?? {};
  const eigene = w.player?.partei.kurz;
  const lager = new Set([eigene, ...(w.spiel?.lager ?? [])]);
  const dagegen = (p: string): boolean => {
    const achsen = parteiAchsen(p);
    return !!achsen && uebereinstimmung(achsen, v.massnahme, v.richtung) < 0;
  };
  const fraktionen = Object.entries(sitze).filter(([, n]) => n >= GESETZGEBUNG.fraktionSitze).sort((a, b) => b[1] - a[1]);
  for (const [p] of fraktionen.slice(0, 2)) if (!lager.has(p) && dagegen(p)) return p;
  const gegner = Object.entries(sitze).filter(([p]) => !lager.has(p) && dagegen(p)).sort((a, b) => b[1] - a[1]);
  return gegner.reduce((n, [, x]) => n + x, 0) >= GESETZGEBUNG.klageQuorum ? gegner[0]?.[0] : undefined;
}

/** Wie das Verfassungsgericht zu einem Vorhaben steht: je unabhängiger besetzt, desto eher hebt es auf; Grundrechte wiegen schwerer. */
export function gerichtWahrscheinlichkeit(w: World, v: GesetzesVorhaben, fassung: FassungId, weg: "erlass" | "klage"): number {
  const s = w.spiel?.reich?.sitze?.aym ?? { loyal: 9, unabhaengig: 3, reform: 3 };
  const n = Math.max(1, s.loyal + s.unabhaengig + s.reform);
  const gewicht = (s.unabhaengig * 0.5 + s.reform * 0.8) / n;
  const art = weg === "erlass" ? (v.grundrechte ? 1.4 : 0.6) : 0.8;
  return clamp((gewicht * art + 0.03) * FASSUNG_WERTE[fassung].gericht, 0.02, 0.85);
}

/** Partner, die das Vorhaben ablehnen, springen bei scharfer Fassung teilweise ab; Kompromisse holen Oppositionsstimmen. */
export const PARTNER_ABSPRUNG: Record<FassungId, number> = { scharf: 0.35, kompromiss: 0.12, verwaessert: 0 };

/** Rang eines Vorhabens, das ein vollendeter Fokus vorbereitet hat (Spielparameter, gleich FOKUS.gesetzRang in data/fokusbaum.ts) */
const FOKUS_RANG = 2.5;

function stimmenBonusFuer(w: World, v: GesetzesVorhaben, fassung: FassungId): number {
  const sitze = w.parliament?.seats ?? {};
  const eigene = w.player?.partei.kurz;
  const lager = new Set([eigene, ...(w.spiel?.lager ?? [])]);
  let lagerSitze = 0;
  let opp = 0;
  let absprung = 0;
  for (const [p, s] of Object.entries(sitze)) {
    if (!lager.has(p)) {
      opp += s;
      continue;
    }
    lagerSitze += s;
    if (p === eigene) continue;
    const achsen = parteiAchsen(p);
    const a = achsen ? uebereinstimmung(achsen, v.massnahme, v.richtung) : 0;
    if (a <= -GESETZGEBUNG.lagerSchwelle) absprung += s * PARTNER_ABSPRUNG[fassung] * Math.min(1, -a * 1.5);
  }
  const f = FASSUNG_WERTE[fassung];
  // Fokusbaum (sim/fokus.ts): Ein vollendeter Fokus hat die Vorlage vorbereitet und das Lager eingebunden
  const fokus = w.spiel?.modifikatoren?.[`fokus:gesetz:${v.id}`] ?? 0;
  return Math.round(opp * f.opposition) - Math.round(lagerSitze * f.lager) - Math.round(absprung) + Math.round(fokus);
}

/** F4 (ENTSCHEIDUNGEN W, Nachtrag; Variante A in Plan Anhang A 1.1, G3): Eine freie Stufe gilt als die Fassung, deren Schritt sie
 *  erreicht: ab dem scharfen Schritt scharf, ab dem Kompromiss Kompromiss, sonst verwässert. Nur landesweit und nur in der Richtung,
 *  die der Katalogeintrag vorsieht; eine Gegenrichtung oder eine Maßnahme ohne Eintrag ist eine freie Änderung ohne Fassung. */
export function fassungFuerStufe(w: World, massnahme: string, ziel: number, ort?: number[] | null, wahl?: FassungId): { v: GesetzesVorhaben; fassung: FassungId } | undefined {
  if (ort?.length || !knotenDa(massnahme)) return undefined;
  const delta = ziel - nationalAverage(NET, w.net, massnahme);
  if (Math.abs(delta) < 1) return undefined;
  const v = GESETZESVORHABEN.find((x) => x.massnahme === massnahme && x.richtung === Math.sign(delta));
  if (!v) return undefined;
  if (wahl) return { v, fassung: wahl };
  const [scharf, kompromiss] = schritte(v);
  const s = Math.abs(delta) + 0.5;
  return { v, fassung: s >= scharf ? "scharf" : s >= kompromiss ? "kompromiss" : "verwaessert" };
}

setzeFassungsRechner((w, id, ziel, ort, wahl) => {
  const f = fassungFuerStufe(w, id, ziel, ort, wahl);
  if (!f) return undefined;
  const { v, fassung } = f;
  const z = leseZustand(w);
  const ruhe = z.ruhe[v.id];
  // G6: Nach einer Entscheidung ruht das Thema, beim Verfassungsgericht liegt es fest
  const grund = ruhe !== undefined && ruhe > w.day ? t("gesetz.grund.ruht", { tage: ruhe - w.day }) : z.pruefungen.some((p) => p.vorhaben === v.id) ? t("gesetz.grund.gericht") : undefined;
  const k = klaeger(w, v);
  return {
    vorhaben: v.id, fassung, bonus: stimmenBonusFuer(w, v, fassung), titel: t(`gesetz.v.${v.id}.titel`),
    erlassErlaubt: v.erlass === "anfechtbar" && !v.grundrechte, gerichtP: k ? gerichtWahrscheinlichkeit(w, v, fassung, "erlass") : 0,
    ...(grund ? { grund } : {}),
  };
});

setzeFassungsFolgen({
  eingebracht: (w, g, alteStufe) => {
    gesetzgebungVon(w).vorher[g.id] = Math.round(alteStufe);
  },
  erlassen: (w, pr, alteStufe) => {
    const fas = pr.fassung!;
    const v = VORHABEN_NACH_ID.get(fas.vorhaben)!;
    const z = gesetzgebungVon(w);
    const titel = `${fas.titel} · ${t(`gesetz.fassung.${fas.fassung}`)}`;
    folgenNachBeschluss(w, v, fas.fassung);
    z.beschlossen.push({ vorhaben: v.id, fassung: fas.fassung, tag: w.day, weg: "erlass" });
    z.ruhe[v.id] = w.day + GESETZGEBUNG.ruheNachAnnahme;
    const k = klaeger(w, v);
    if (k) z.pruefungen.push({ id: `aym-${w.day}-${v.id}`, vorhaben: v.id, fassung: fas.fassung, massnahme: v.massnahme, alteStufe: Math.round(alteStufe), weg: "erlass", tag: w.day + GESETZGEBUNG.gerichtTage, p: fas.gerichtP });
    const text = k ? t("gesetz.erlass.text", { titel, tage: GESETZGEBUNG.gerichtTage, partei: PARTEI_NAME[k] ?? k }) : t("gesetz.erlass.unangefochten", { titel });
    const why = k ? t("gesetz.erlass.warum", { pk: pr.erlass.pk, p: Math.round(fas.gerichtP * 100) }) : t("gesetz.erlass.unangefochtenWarum", { pk: pr.erlass.pk });
    addLog(w, "entscheidung", text, why);
    return { ok: true, text, why };
  },
});

/** Eine Prognose für jede Vorlage, gleich ob aus dem Regler oder aus einer benannten Fassung (G3): Prüfung, Ja-Stimmen mit Bonus,
 *  Urteil, Fassung und Lager. Politik, Gesetzeskatalog und Tagesordnung lesen nur diese Zahl. */
export interface GesetzesPrognose {
  pruefung: Pruefung;
  ja: number;
  luecke: number;
  urteil: Urteil;
  fassung?: FassungsInfo;
  /** Wer dafür und wer dagegen ist (nur mit Katalogeintrag) */
  lager?: { fuer: LagerEintrag[]; gegen: LagerEintrag[] };
}

export function gesetzesPrognose(w: World, massnahme: string, ziel: number, ort?: number[] | null, wahl?: FassungId): GesetzesPrognose {
  const pruefung = pruefeVorhaben(w, massnahme, ziel, ort, wahl);
  const ja = pruefung.gesetz.stimmen.erwartet;
  const v = pruefung.fassung ? VORHABEN_NACH_ID.get(pruefung.fassung.vorhaben) : undefined;
  return {
    pruefung, ja, luecke: pruefung.gesetz.stimmen.luecke, urteil: urteilAus(ja),
    ...(pruefung.fassung ? { fassung: pruefung.fassung } : {}),
    ...(v && w.spiel ? { lager: lagerVon(w, v) } : {}),
  };
}

/** Die benannten Fassungen einer Maßnahme als Knöpfe über dem Regler (G2): je Katalogeintrag drei Zielstufen. */
export function fassungsKnoepfe(w: World, massnahme: string): { vorhaben: string; titel: string; knoepfe: { fassung: FassungId; ziel: number }[] }[] {
  if (!knotenDa(massnahme)) return [];
  const stufe = nationalAverage(NET, w.net, massnahme);
  return GESETZESVORHABEN.filter((v) => v.massnahme === massnahme)
    .map((v) => ({
      vorhaben: v.id,
      titel: t(`gesetz.v.${v.id}.titel`),
      knoepfe: FASSUNGEN.map((f, i) => ({ fassung: f, ziel: clamp(Math.round(stufe + v.richtung * schritte(v)[i]!), 0, 100) })).filter((k) => Math.abs(k.ziel - stufe) >= 1),
    }))
    .filter((x) => x.knoepfe.length > 0);
}

function urteilAus(ja: number): Urteil {
  return ja >= GESETZ_SCHWELLE + STIMMEN_PUFFER ? "sicher" : ja >= GESETZ_SCHWELLE - 10 ? "knapp" : "verloren";
}

export function vorhabenSicht(w: World, v: GesetzesVorhaben, akutListe?: Set<string>): VorhabenSicht {
  const sp = w.spiel!;
  const z = leseZustand(w);
  const stufe = nationalAverage(NET, w.net, v.massnahme);
  const node = NET.nodes[NET.index.get(v.massnahme)!]!;
  const imParl = sp.gesetze.find((g) => g.massnahme === v.massnahme);
  const ruhe = z.ruhe[v.id];
  const pruef = z.pruefungen.find((p) => p.vorhaben === v.id);
  const pause = neuanfangGrund(w);
  const fassungen = {} as Record<FassungId, FassungSicht>;
  FASSUNGEN.forEach((f, i) => {
    const ziel = clamp(Math.round(stufe + v.richtung * schritte(v)[i]!), 0, 100);
    // Dieselbe Prüfung wie an der Maßnahmenzeile: Die Stimmen enthalten den Bonus der Fassung schon (G3)
    const pr = pruefeVorhaben(w, v.massnahme, ziel, null, f);
    const bonus = pr.fassung?.bonus ?? 0;
    const ja = pr.gesetz.stimmen.erwartet;
    let grund: string | undefined;
    if (sp.ende) grund = t("gesetz.grund.ende");
    else if (pause) grund = pause;
    else if (imParl) grund = t("gesetz.grund.imParlament");
    else if (ruhe !== undefined && ruhe > w.day) grund = t("gesetz.grund.ruht", { tage: ruhe - w.day });
    else if (pruef) grund = t("gesetz.grund.gericht");
    else if (Math.abs(ziel - stufe) < 2) grund = t("gesetz.grund.ausgeschoepft");
    else if (!pr.ok) grund = pr.grund;
    const fs: FassungSicht = {
      fassung: f,
      ziel,
      aenderung: ziel - Math.round(stufe),
      pk: pr.gesetz.pk,
      bezahlbar: pr.gesetz.bezahlbar,
      kostenBip: pr.kostenBip,
      monate: pr.monate,
      ja,
      urteil: urteilAus(ja),
      stimmenBonus: bonus,
      klageP: v.grundrechte && klaeger(w, v) ? gerichtWahrscheinlichkeit(w, v, f, "klage") : 0,
      moeglich: grund === undefined,
      ...(grund !== undefined ? { grund } : {}),
    };
    if (pr.erlass.moeglich) fs.erlass = { pk: pr.erlass.pk, bezahlbar: kannZahlen(sp.kapital, pr.erlass.pk), gerichtP: pr.fassung?.gerichtP ?? 0 };
    fassungen[f] = fs;
  });
  // Rang: Kalender, akute Probleme, Linie der eigenen Partei
  const monat = Number(w.date.slice(5, 7));
  const kalender = v.kalender !== undefined && (monat === v.kalender || monat === ((v.kalender + 10) % 12) + 1);
  const akut = (akutListe ?? akuteVorhaben(w)).has(v.id);
  const linie = uebereinstimmung(spielerAchsen(w), v.massnahme, v.richtung);
  const fokus = (w.spiel?.modifikatoren?.[`fokus:gesetz:${v.id}`] ?? 0) > 0;
  const rang = (kalender ? 3 : 0) + (akut ? 1.5 : 0) + 2 * linie + (fokus ? FOKUS_RANG : 0);
  const anlass = kalender ? "kalender" : fokus ? "fokus" : akut ? "akut" : linie > 0.3 ? "linie" : undefined;
  const sicht: VorhabenSicht = {
    def: v,
    titel: t(`gesetz.v.${v.id}.titel`),
    satz: t(`gesetz.v.${v.id}.satz`),
    kompromiss: t(`gesetz.v.${v.id}.kompromiss`),
    thema: node.theme,
    stufe: Math.round(stufe),
    lager: lagerVon(w, v),
    fassungen,
    rang,
    ...(anlass ? { anlass } : {}),
  };
  if (imParl) {
    const gs = gesetzPrognose(w, imParl);
    sicht.imParlament = { gesetzId: imParl.id, tage: Math.max(0, imParl.abstimmung - w.day), urteil: gs.urteil, ja: gs.ja };
  }
  if (ruhe !== undefined && ruhe > w.day) sicht.ruhtTage = ruhe - w.day;
  if (pruef) sicht.gericht = { tage: Math.max(0, pruef.tag - w.day), p: pruef.p };
  return sicht;
}

/** Vorhaben, deren Richtung ein akutes Problem angeht (aus den Vorschlägen der Politik, sim/vorschlaege.ts). */
export function akuteVorhaben(w: World): Set<string> {
  const out = new Set<string>();
  for (const vs of vorschlaege(w, 10)) {
    for (const v of GESETZESVORHABEN) if (v.massnahme === vs.massnahme && v.richtung === vs.richtung) out.add(v.id);
  }
  return out;
}

/** Alle Vorhaben, deren Maßnahme es im Netz gibt, nach Rang (dringend zuerst). */
export function gesetzesTisch(w: World): VorhabenSicht[] {
  if (!w.spiel) return [];
  const akut = akuteVorhaben(w);
  return GESETZESVORHABEN.filter((v) => knotenDa(v.massnahme))
    .map((v) => vorhabenSicht(w, v, akut))
    .sort((a, b) => b.rang - a.rang);
}

// ---------------------------------------------------------------------------
// Einbringen

export function bringeVorhabenEin(w: World, vorhabenId: string, fassung: FassungId, weg: "gesetz" | "erlass"): Ergebnis {
  const v = VORHABEN_NACH_ID.get(vorhabenId);
  const sp = w.spiel;
  if (!v || !sp) return { ok: false, text: t("gesetz.grund.unbekannt") };
  const sicht = vorhabenSicht(w, v);
  const fs = sicht.fassungen[fassung];
  if (!fs.moeglich) return { ok: false, text: fs.grund ?? t("gesetz.grund.unbekannt") };
  if (weg === "erlass") {
    if (!fs.erlass) return { ok: false, text: t("gesetz.grund.keinErlass") };
    if (!fs.erlass.bezahlbar) return { ok: false, text: t("gesetz.grund.kapital", { noetig: fs.erlass.pk, da: Math.floor(sp.kapital) }) };
  }
  // Derselbe Weg wie an der Maßnahmenzeile (G1): bringeEin merkt sich Fassung und Bonus, der Haken oben die Folgen
  const r = bringeEin(w, v.massnahme, fs.ziel, null, weg, fassung);
  if (!r.ok || weg === "erlass") return r;
  const g = [...sp.gesetze].reverse().find((x) => x.massnahme === v.massnahme);
  const titel = `${sicht.titel} · ${t(`gesetz.fassung.${fassung}`)}`;
  return { ok: true, text: t("gesetz.eingebracht.text", { titel, tage: g ? g.abstimmung - w.day : REGELN.tageBisAbstimmung }), why: r.why ?? "" };
}

// ---------------------------------------------------------------------------
// Folgen

function gruppeVon(id: string): string | undefined {
  if (GRUPPEN.some((g) => g.id === id)) return id;
  return VERBAENDE[id]?.gruppe;
}

/** Nach dem Beschluss (Gesetz oder Erlass): Verbände und Gruppen reagieren, die Straße antwortet, Rathäuser bremsen. */
function folgenNachBeschluss(w: World, v: GesetzesVorhaben, fassung: FassungId): void {
  const f = FASSUNG_WERTE[fassung];
  const getroffen = new Set<string>();
  for (const id of v.fuer) {
    const g = gruppeVon(id);
    if (g && !getroffen.has(g) && knotenDa(g)) {
      getroffen.add(g);
      wirke(w, g, f.fuer);
    }
  }
  for (const id of v.gegen) {
    const g = gruppeVon(id);
    if (g && !getroffen.has(g) && knotenDa(g)) {
      getroffen.add(g);
      wirke(w, g, f.gegen);
    }
  }
  if (v.protest > 0 && knotenDa("protestdruck")) wirke(w, "protestdruck", v.protest * f.protest, STAEDTE);
  const titel = t(`gesetz.v.${v.id}.titel`);
  const fuerName = akteurName(v.fuer[0]!);
  const gegenName = akteurName(v.gegen[0]!);
  addLog(w, "ereignis", t(`gesetz.folge.${fassung}`, { titel, fuer: fuerName, gegen: gegenName }), t("gesetz.folge.warum"));
  if (v.protest * f.protest >= 2.5) addLog(w, "ereignis", t("gesetz.folge.strasse", { titel, gegen: gegenName }), t("gesetz.folge.strasseWarum"));
  if (v.kommunal && w.spiel?.gesellschaft) {
    const rathaus = w.spiel.gesellschaft.kommunen.rathaus;
    const gegen = GESETZGEBUNG.grossstaedte.filter((p) => rathaus[String(p)] && !istLagerPartei(w, rathaus[String(p)]!.partei));
    if (gegen.length >= 3) {
      if (knotenDa("protestdruck")) wirke(w, "protestdruck", 1.5, gegen);
      addLog(w, "ereignis", t("gesetz.folge.rathaeuser", { titel, n: gegen.length }), t("gesetz.folge.rathaeuserWarum"));
    }
  }
}

/** Haken nach jeder Abstimmung: nur Gesetze aus einem Vorhaben. */
function nachAbstimmung(w: World, g: Gesetz, angenommen: boolean): void {
  deckeAbsprachenAuf(w, g);
  if (!g.vorhaben || !w.spiel) return;
  const v = VORHABEN_NACH_ID.get(g.vorhaben);
  if (!v) return;
  const z = gesetzgebungVon(w);
  const fassung = g.fassung ?? "kompromiss";
  const alteStufe = z.vorher[g.id];
  delete z.vorher[g.id];
  if (!angenommen) {
    z.ruhe[v.id] = w.day + GESETZGEBUNG.ruheNachNiederlage;
    return;
  }
  z.beschlossen.push({ vorhaben: v.id, fassung, tag: w.day, weg: "gesetz" });
  z.ruhe[v.id] = w.day + GESETZGEBUNG.ruheNachAnnahme;
  folgenNachBeschluss(w, v, fassung);
  const k = v.grundrechte ? klaeger(w, v) : undefined;
  if (k && alteStufe !== undefined) {
    const p = gerichtWahrscheinlichkeit(w, v, fassung, "klage");
    z.pruefungen.push({ id: `aym-${w.day}-${v.id}`, vorhaben: v.id, fassung, massnahme: v.massnahme, alteStufe, weg: "klage", tag: w.day + GESETZGEBUNG.gerichtTage, p });
    addLog(w, "ereignis", t("gesetz.klage.text", { partei: PARTEI_NAME[k] ?? k, titel: t(`gesetz.v.${v.id}.titel`), tage: GESETZGEBUNG.gerichtTage }), t("gesetz.klage.warum", { p: Math.round(p * 100) }));
  }
}

setzeAbstimmungsHaken(nachAbstimmung);

// ---------------------------------------------------------------------------
// Ausschuss und Präsident (Art. 88, 89; RECHERCHE_GLM_8_GESETZGEBUNG §5.1 und §5.2)

/** Anteil, den ein Ausschuss eine freie Änderung ohne Fassung zurückschneidet, wenn das Lager dort keine Mehrheit hat (Spielparameter). */
export const AUSSCHUSS = { kuerzung: 0.4 } as const;

/** Die nächstweichere Fassung (scharf → Kompromiss → verwässert). */
function weicher(f: FassungId): FassungId | undefined {
  return f === "scharf" ? "kompromiss" : f === "kompromiss" ? "verwaessert" : undefined;
}

/** Wie der Entwurf nach einer Abschwächung aussähe: Zielstufe, Fassung, Stimmenbonus. */
export function abgeschwaecht(w: World, g: Gesetz): { stufe: number; fassung?: FassungId; bonus?: number } | undefined {
  const jetzt = nationalAverage(NET, w.net, g.massnahme);
  if (g.vorhaben && g.fassung) {
    const v = VORHABEN_NACH_ID.get(g.vorhaben);
    const f = weicher(g.fassung);
    if (!v || !f) return undefined;
    const stufe = clamp(Math.round(jetzt + v.richtung * schritte(v)[FASSUNGEN.indexOf(f)]!), 0, 100);
    return { stufe, fassung: f, bonus: stimmenBonusFuer(w, v, f) };
  }
  if (g.provinzen?.length) return undefined;
  const delta = g.stufe - jetzt;
  if (Math.abs(delta) < 3) return undefined;
  return { stufe: Math.round(jetzt + delta * (1 - AUSSCHUSS.kuerzung)) };
}

/** Hat das Lager im Ausschuss eine Mehrheit? Die Sitze im Ausschuss folgen der Stärke der Fraktionen; Duldende zählen mit. */
export function ausschussMehrheit(w: World): boolean {
  const s = stimmenSicht(w);
  return s.lager + s.duldungSitze >= REGELN.mehrheit;
}

function wendeAbschwaechungAn(w: World, g: Gesetz, a: NonNullable<ReturnType<typeof abgeschwaecht>>): void {
  g.urStufe ??= g.stufe;
  if (g.fassung) g.urFassung ??= g.fassung;
  g.stufe = a.stufe;
  if (a.fassung) {
    g.fassung = a.fassung;
    g.stimmenBonus = a.bonus ?? 0;
    g.name = `${t(`gesetz.v.${g.vorhaben}.titel`)} · ${t(`gesetz.fassung.${a.fassung}`)}`;
  }
}

/** Solange der Ausschuss berät, kann der Präsident seiner Fraktion einen Kompromiss auftragen: kleinerer Schritt, mehr Stimmen. */
export function ausschussKompromiss(w: World, gesetzId: string): Ergebnis {
  const g = w.spiel?.gesetze.find((x) => x.id === gesetzId);
  if (!g) return { ok: false, text: t("n4.grund.nichtMehrDa") };
  if (g.ausschussBis === undefined || w.day >= g.ausschussBis || g.ausschuss !== "offen") return { ok: false, text: t("n4.ausschuss.vorbei") };
  const a = abgeschwaecht(w, g);
  if (!a) return { ok: false, text: t("n4.ausschuss.keinSchritt") };
  const vorherJa = gesetzPrognose(w, g).ja;
  wendeAbschwaechungAn(w, g, a);
  g.ausschuss = "kompromiss";
  const ja = gesetzPrognose(w, g).ja;
  const text = t("n4.ausschuss.kompromissText", { name: g.name, ziel: stufenName(g.massnahme, g.stufe) });
  const why = t("n4.ausschuss.kompromissWarum", { vorher: vorherJa, ja });
  addLog(w, "entscheidung", text, why);
  return { ok: true, text, why };
}

/** Vorschau für die Karte: Was ein Kompromiss im Ausschuss brächte. */
export function ausschussVorschau(w: World, g: Gesetz): { ziel: string; ja: number; fassung?: FassungId } | undefined {
  if (g.ausschuss !== "offen") return undefined;
  const a = abgeschwaecht(w, g);
  if (!a) return undefined;
  const kopie: Gesetz = { ...g, stufe: a.stufe, ...(a.fassung ? { fassung: a.fassung, stimmenBonus: a.bonus ?? 0 } : {}) };
  return { ziel: stufenName(g.massnahme, a.stufe), ja: gesetzPrognose(w, kopie).ja, ...(a.fassung ? { fassung: a.fassung } : {}) };
}

/** Ende der Ausschussberatung: Ohne Mehrheit des Lagers im Ausschuss setzt die Opposition die schwächere Fassung durch. */
function ausschussTag(w: World): void {
  for (const g of w.spiel?.gesetze ?? []) {
    if (g.ausschuss !== "offen" || g.ausschussBis === undefined || w.day < g.ausschussBis) continue;
    const a = ausschussMehrheit(w) ? undefined : abgeschwaecht(w, g);
    if (!a) {
      g.ausschuss = "unveraendert";
      continue;
    }
    const vorher = stufenName(g.massnahme, g.stufe);
    wendeAbschwaechungAn(w, g, a);
    g.ausschuss = "geaendert";
    addLog(w, "ereignis", t("n4.ausschuss.geaendert", { name: g.name, vorher, ziel: stufenName(g.massnahme, g.stufe) }), t("n4.ausschuss.geaendertWarum"));
  }
}

/** Haken aus handeln.ts: Ein vom Ausschuss gegen den Willen des Präsidenten verändertes Gesetz liegt ihm 15 Tage vor. */
setzeUnterschriftHaken((w: World, g: Gesetz, e: PlenumErgebnis) => {
  if (g.ausschuss !== "geaendert") return false;
  const z = gesetzgebungVon(w);
  (z.unterschrift ??= []).push({ gesetz: g, ja: e.ja, nein: e.nein, abwesend: e.abwesend, tag: w.day, frist: w.day + REGELN.unterschriftTage });
  addLog(w, "entscheidung", t("n4.unterschrift.vorlage", { name: g.name, ja: e.ja, nein: e.nein, tage: REGELN.unterschriftTage }), t("n4.unterschrift.vorlageWarum")).abstimmung = { art: "gesetz", name: g.name, ort: "", ja: e.ja, nein: e.nein, abwesend: e.abwesend, angenommen: true, stufe: g.stufe };
  return true;
});

/** Was dem Präsidenten zur Unterschrift vorliegt (Anzeige). */
export function zurUnterschrift(w: World): Unterschrift[] {
  return w.spiel?.gesetzgebung?.unterschrift ?? [];
}

/** Unterschreiben: Das Gesetz gilt in der Fassung, die das Parlament beschlossen hat. */
export function unterschreibe(w: World, gesetzId: string): Ergebnis {
  const z = gesetzgebungVon(w);
  const u = (z.unterschrift ?? []).find((x) => x.gesetz.id === gesetzId);
  if (!u) return { ok: false, text: t("n4.grund.nichtMehrDa") };
  z.unterschrift = (z.unterschrift ?? []).filter((x) => x !== u);
  verkuende(w, u.gesetz, u, true);
  const l = w.log[w.log.length - 1]!;
  return { ok: true, text: l.text, ...(l.why ? { why: l.why } : {}) };
}

/** Zurücksenden (Art. 89): Das Parlament berät neu; unverändert gilt das Gesetz nur mit der absoluten Mehrheit der Mitglieder. */
export function sendeZurueck(w: World, gesetzId: string): Ergebnis {
  const sp = w.spiel;
  const z = gesetzgebungVon(w);
  const u = (z.unterschrift ?? []).find((x) => x.gesetz.id === gesetzId);
  if (!sp || !u) return { ok: false, text: t("n4.grund.nichtMehrDa") };
  z.unterschrift = (z.unterschrift ?? []).filter((x) => x !== u);
  const g: Gesetz = { ...u.gesetz, rueckgabe: true, abstimmung: w.day + REGELN.rueckgabeTage, absprachen: 0, zusagenListe: [] };
  delete g.ausschussBis;
  sp.gesetze.push(g);
  vertrauenAendern(w, -0.5);
  const text = t("n4.rueckgabe.text", { name: g.name, tage: REGELN.rueckgabeTage, noetig: REGELN.mehrheit });
  const why = t("n4.rueckgabe.warum");
  addLog(w, "entscheidung", text, why);
  return { ok: true, text, why };
}

/** Fristablauf: Gibt der Präsident ein Gesetz nicht binnen 15 Tagen zurück, wird es verkündet. */
function unterschriftTag(w: World): void {
  const z = w.spiel?.gesetzgebung;
  if (!z?.unterschrift?.length) return;
  for (const u of z.unterschrift.filter((x) => x.frist <= w.day)) {
    z.unterschrift = z.unterschrift.filter((x) => x !== u);
    verkuende(w, u.gesetz, u, true);
  }
}

/** Täglich: Ausschüsse schließen, Fristen des Präsidenten laufen ab, das Verfassungsgericht spricht über fällige Prüfungen.
 *  Entscheidungen sind deterministisch aus Seed und Vorgang. */
export function gesetzgebungTag(w: World): void {
  ausschussTag(w);
  unterschriftTag(w);
  notstandTag(w);
  const sp = w.spiel;
  if (!sp?.gesetzgebung) return;
  const z = gesetzgebungVon(w);
  const faellig = z.pruefungen.filter((p) => p.tag <= w.day);
  if (!faellig.length) return;
  z.pruefungen = z.pruefungen.filter((p) => p.tag > w.day);
  for (const p of faellig) {
    const titel = t(`gesetz.v.${p.vorhaben}.titel`);
    const aufgehoben = hashWert(`${w.seed}|${p.id}|aym`) < p.p;
    if (aufgehoben) {
      setPolicy(w, p.massnahme, p.alteStufe, null);
      vertrauenAendern(w, p.weg === "erlass" ? -1.5 : -0.8);
      addLog(w, "ereignis", t(`gesetz.gericht.aufgehoben.${p.weg}`, { titel }), t("gesetz.gericht.aufgehobenWarum"));
    } else {
      addLog(w, "ereignis", t(`gesetz.gericht.bestaetigt.${p.weg}`, { titel }), t("gesetz.gericht.bestaetigtWarum"));
    }
  }
}

/** Laufende Verfahren für die Anzeige: im Parlament und beim Gericht. */
export function laufendeVerfahren(w: World): { parlament: { titel: string; tage: number; urteil: Urteil; ja: number }[]; gericht: { titel: string; tage: number; p: number; weg: "erlass" | "klage" }[] } {
  const sp = w.spiel;
  if (!sp) return { parlament: [], gericht: [] };
  const z = leseZustand(w);
  return {
    parlament: sp.gesetze.filter((g) => g.vorhaben).map((g) => {
      const gs = gesetzPrognose(w, g);
      return { titel: g.name, tage: Math.max(0, g.abstimmung - w.day), urteil: gs.urteil, ja: gs.ja };
    }),
    gericht: z.pruefungen.map((p) => ({ titel: t(`gesetz.v.${p.vorhaben}.titel`), tage: Math.max(0, p.tag - w.day), p: p.p, weg: p.weg })),
  };
}

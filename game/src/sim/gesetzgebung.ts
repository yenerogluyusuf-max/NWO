// Gesetzesvorhaben mit Konflikt: Der Spieler wählt ein Vorhaben, eine Fassung (scharf, Kompromiss, verwässert) und den Weg
// (Parlament oder, wo erlaubt, Erlass). Der Rest läuft über die vorhandene Mechanik: Kapital, Abstimmung nach der Sitzverteilung,
// Stimmenkauf und Rückzug (sim/handeln.ts), Umsetzung im Politiknetz (sim/umsetzung.ts), Reaktion der Partner und Stammwähler (sim/linie.ts).
// Neu sind hier nur die Fassung, das sichtbare Lager je Vorhaben, die Folgen nach der Abstimmung (Verbände, Straße, Rathäuser)
// und das Verfassungsgericht als Schatten über Erlassen und grundrechtsnahen Gesetzen.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung).

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
import { REGELN, STIMMEN_PUFFER, bringeEin, gesetzSicht, pruefeVorhaben, setPolicy, setzeAbstimmungsHaken, type Ergebnis } from "./handeln";
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

function urteilAus(ja: number): Urteil {
  return ja >= REGELN.mehrheit + STIMMEN_PUFFER ? "sicher" : ja >= REGELN.mehrheit - 10 ? "knapp" : "verloren";
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
    const pr = pruefeVorhaben(w, v.massnahme, ziel, null);
    const bonus = stimmenBonusFuer(w, v, f);
    const ja = Math.min(600, Math.max(0, pr.gesetz.stimmen.erwartet + bonus));
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
    if (v.erlass === "anfechtbar" && !v.grundrechte) fs.erlass = { pk: pr.erlass.pk, bezahlbar: kannZahlen(sp.kapital, pr.erlass.pk), gerichtP: klaeger(w, v) ? gerichtWahrscheinlichkeit(w, v, f, "erlass") : 0 };
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
    const gs = gesetzSicht(w, imParl);
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
  const z = gesetzgebungVon(w);
  const titel = `${sicht.titel} · ${t(`gesetz.fassung.${fassung}`)}`;
  const alteStufe = sicht.stufe;

  if (weg === "erlass") {
    if (!fs.erlass) return { ok: false, text: t("gesetz.grund.keinErlass") };
    if (!fs.erlass.bezahlbar) return { ok: false, text: t("gesetz.grund.kapital", { noetig: fs.erlass.pk, da: Math.floor(sp.kapital) }) };
    sp.kapital -= fs.erlass.pk;
    verbrauche(w, AUFMERKSAMKEIT_KOSTEN.erlass, sicht.titel);
    setPolicy(w, v.massnahme, fs.ziel, null);
    vertrauenAendern(w, -(1 + Math.abs(fs.aenderung) / 40));
    folgenNachBeschluss(w, v, fassung);
    z.beschlossen.push({ vorhaben: v.id, fassung, tag: w.day, weg: "erlass" });
    z.ruhe[v.id] = w.day + GESETZGEBUNG.ruheNachAnnahme;
    const k = klaeger(w, v);
    if (k) z.pruefungen.push({ id: `aym-${w.day}-${v.id}`, vorhaben: v.id, fassung, massnahme: v.massnahme, alteStufe, weg: "erlass", tag: w.day + GESETZGEBUNG.gerichtTage, p: fs.erlass.gerichtP });
    const text = k ? t("gesetz.erlass.text", { titel, tage: GESETZGEBUNG.gerichtTage, partei: PARTEI_NAME[k] ?? k }) : t("gesetz.erlass.unangefochten", { titel });
    const why = k ? t("gesetz.erlass.warum", { pk: fs.erlass.pk, p: Math.round(fs.erlass.gerichtP * 100) }) : t("gesetz.erlass.unangefochtenWarum", { pk: fs.erlass.pk });
    addLog(w, "entscheidung", text, why);
    return { ok: true, text, why };
  }

  const r = bringeEin(w, v.massnahme, fs.ziel, null, "gesetz");
  if (!r.ok) return r;
  const g = [...sp.gesetze].reverse().find((x) => x.massnahme === v.massnahme);
  if (g) {
    g.name = titel;
    g.vorhaben = v.id;
    g.fassung = fassung;
    g.stimmenBonus = fs.stimmenBonus;
    z.vorher[g.id] = alteStufe;
  }
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

/** Täglich: Das Verfassungsgericht spricht über fällige Prüfungen. Entscheidung ist deterministisch aus Seed und Vorgang. */
export function gesetzgebungTag(w: World): void {
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
      const gs = gesetzSicht(w, g);
      return { titel: g.name, tage: Math.max(0, g.abstimmung - w.day), urteil: gs.urteil, ja: gs.ja };
    }),
    gericht: z.pruefungen.map((p) => ({ titel: t(`gesetz.v.${p.vorhaben}.titel`), tage: Math.max(0, p.tag - w.day), p: p.p, weg: p.weg })),
  };
}

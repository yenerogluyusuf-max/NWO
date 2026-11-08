// Der Schauplatz eines Krieges: Regionen, die Region um Region den Besitzer wechseln, ein Gegner mit eigenem Bestand, zwei Entscheidungen
// der Kriegsführung (Einsatzart und Tempo) und die Besatzung nach dem Frieden.
//
// Grundsatz „Realismus verpackt in ein Spiel“ und MIL-1 („Der Präsident bestellt und verantwortet, er kommandiert nicht“): Es gibt keine
// Einheiten zum Schieben. Die abstrakte Frontlage (sim/krieg.ts) bleibt der Motor; dieses Modul gibt ihr Gelände, Reichweite, Verluste und
// eine Karte. Wer mit Drohnen angreift, verliert wenig und erzwingt Verhandlungen, nimmt aber kein Land; wer am Boden vorrückt, nimmt Land und
// zahlt mit Verlusten und Kriegsmüdigkeit. Der Bestand beider Seiten entscheidet mit: Generation, Menge, Munition, Nachschub.
//
// Schnittstelle zu sim/krieg.ts ohne Ladezyklus: Dieses Modul importiert krieg.ts nicht; krieg.ts ruft `kriegsFaktoren`, `schauplatzWoche`,
// `besatzungNachFrieden` und `kriegsschauplatzMonat` auf. Alle Zahlen sind Spielparameter, außer den in data/schauplaetze.ts belegten.

import {
  EINSATZ,
  GEGNER_BESTAND,
  GEGNER_BESTAND_STANDARD,
  REGION_NACH_ID,
  TEMPO,
  type BesatzungsForm,
  type EinsatzArt,
  type GegnerBestandDef,
  type GegnerGattung,
  type Gelaende,
  type KriegsTempo,
  type Region,
  type Schauplatz,
} from "../data/schauplaetze";
import type { KriegVorgang, RegionLage } from "./krieg-typen";
import { regionenVon, schauplatzFuer, zielRegionen } from "./schauplatz-regionen";
import { besatzungLesen, besatzungMonat, revancheLage } from "./besatzung";
import type { GattungId } from "../data/streitkraefte";
import { einsatzGeneration, einsatzIndex, kriegsVerluste, verbraucheMunition, streitkraefte } from "./streitkraefte";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { kosten } from "./ereignis-hilfen";
import { kannZahlen } from "./kapital";
import { land, landAendern, weltZustand } from "./laender";
import { eigenVon } from "./welt-modell";
import { FERN, cyberFaktor, istFernkonflikt } from "./fernkonflikt";
import { t } from "../i18n";
import type { World } from "./types";

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
const r1 = (x: number): number => Math.round(x * 10) / 10;
const genFaktor = (g: number): number => 1 + 0.25 * (g - 3);

/** Spielparameter dieses Moduls. */
export const SCHAUPLATZ = {
  /** Frontlage, ab der die erste Region fällt, und Spanne bis zur letzten */
  frontStart: 52,
  frontSpanne: 40,
  /** Unter dieser Frontlage stößt der Gegner auf türkische Grenzprovinzen vor (bis zur Spanne alle) */
  bedrohtAb: 46,
  bedrohtSpanne: 30,
  /** Wirkung des Generationsabstands je Generation auf die eigene Stärke */
  generation: 0.12,
  /** Ein Vorstoß über die Reichweite der Einsatzart hinaus kommt nur so schnell voran */
  ueberReichweite: 0.25,
  /** Abkühlung zwischen zwei Umstellungen der Einsatzart (Tage) und ihr Kapital */
  einsatzAbkuehlung: 21,
  einsatzPk: 3,
  /** Verluste je Woche: Grundverschleiß und je Frontpunkt (Anteil des Bestands der tragenden Gattung) */
  verlustBasis: 0.003,
  verlustRueckzug: 0.004,
  verlustVorstoss: 0.0012,
  /** Verluste des Gegners je Woche: Grund, je Frontpunkt Gewinn, je Punkt Druck */
  gegnerBasis: 0.004,
  gegnerVorstoss: 0.006,
  gegnerDruck: 0.004,
  /** Kriegsbelastung des Gegnerlandes im Weltmodell (treibt Flucht und Instabilität, sim/diplomatie.ts) */
  kriegsLast: { luft: 55, boden: 80, see: 45, stellvertreter: 60, cyber: 20, gemischt: 70 } as Record<EinsatzArt | "gemischt", number>,
  /** Laufende Kosten der Operationen je Kriegswoche in % des BIP (Treibstoff, Munition, Einsatzzulagen; Spielparameter) */
  kostenWoche: { luft: 0.012, boden: 0.025, see: 0.016, stellvertreter: 0.006, cyber: 0.002, gemischt: 0.018 } as Record<EinsatzArt | "gemischt", number>,
  /** Zustimmung je Prozentpunkt eigener Wochenverluste („die Särge kommen heim“) */
  verlustZustimmung: 40,
  /** Munitionsvorrat (Gefechtstage), unter dem die Kampfkraft einbricht */
  munitionKnapp: 10,
  // --- Welle 3, K2 (krieg.md Schritt 5): Fläche statt Regionenzahl, kalibriert an echten Operationen (test/krieg-kalibrierung.test.ts) ---
  /**
   * Fläche des Zielraums, die ein Frontpunkt am Boden bewegt (km²; Spielparameter, kalibriert). Die Front läuft von `frontStart` bis
   * `frontStart + frontSpanne` über den ganzen Zielraum; ein großer Zielraum braucht entsprechend mehr Wochen. Vorher fiel der Zielraum in
   * gleich vielen Wochen, ob er 2.000 oder 55.000 km² groß war (Lauf W1: ganz Nordsyrien in sechs Wochen).
   */
  km2JePunkt: 100,
  /** Kleinster Faktor auf die Frontbewegung (sehr große Zielräume) und größter (kleine Zielräume rücken nicht schneller vor als bisher) */
  flaecheMin: 0.05,
  flaecheMax: 1,
  /** Der Gegner verteidigt tiefer im Land zäher: Faktor auf den Vorstoß je Tiefe der umkämpften Region (Spielparameter) */
  tiefe: { 1: 1, 2: 0.85, 3: 0.7 } as Record<1 | 2 | 3, number>,
  /**
   * Gefallene im Landkrieg mit Zielraum (Welle 3, K2): Sie hängen an der genommenen Fläche und ihrem Gelände, nicht am Prozentsatz des
   * Bestands (der zählt Gerät und Personal; vorher galten 22 Gefallene je Prozent, das ganze Heer also wie 2.200 Menschen). Spielparameter,
   * kalibriert an den Vorbildern (recherche_operationen.md, Zahlen fürs Spiel; test/krieg-kalibrierung.test.ts):
   *   - Ebene: Friedensquelle 2019, 12 Gefallene für 2.419 bis 4.820 km², also 2,5 bis 5 je 1.000 km²
   *   - Bergland: Olivenzweig 2018 um Afrin, 55 Gefallene für rund 2.000 km², also 27
   *   - Stadt: Schutzschild Euphrat 2016/17 mit al-Bab, 71 Gefallene für 2.000 bis 2.055 km², also 35
   *   - Landung über das Meer: Zypern 1974, 568 bis 1.500 Gefallene für rund 3.350 km², also 170 bis 450
   * Dazu ein Grundverschleiß je Woche (Anschläge, Beschuss, Unfälle), auch ohne Geländegewinn. Beides mal Einsatzart, Tempo und Stärke des
   * Gegners (sim/kriegspreis.ts).
   */
  gefalleneJeWoche: 4.5,
  gefalleneJe1000Km2: { ebene: 3, berge: 12, stadt: 35, insel: 30, kueste: 12 } as Record<Gelaende, number>,
  /**
   * Faktor für den Kampf um Inseln: die Inseln der Ägäis (Landung über das Meer) und Zypern (Spielparameter, kalibriert an der Größenordnung
   * von 1974, siehe oben). Auf Zypern stehen heute türkische Truppen im Norden; der Faktor steht dort für den Kampf gegen die Nationalgarde und
   * das griechische Kontingent in vorbereiteten Stellungen an der Pufferzone, nicht für eine zweite Landung.
   */
  landung: 8,
};

/** Tragende Gattungen ohne gewählte Einsatzart („gemischt“, der Generalstab verteilt). */
const GEMISCHT_TRAEGER: Partial<Record<GattungId, number>> = { personal: 0.2, panzer: 0.2, kampfflugzeuge: 0.15, drohnen: 0.2, marine: 0.05, raketen: 0.1, munition: 0.1 };
const GEMISCHT_GELAENDE: Record<Gelaende, number> = { ebene: 1.1, berge: 0.75, stadt: 0.7, insel: 0.6, kueste: 0.95 };

// ---------------------------------------------------------------------------
// Daten des Vorgangs

// Welle 3, K5: in sim/schauplatz-regionen.ts herausgelöst (sim/besatzung.ts braucht sie ohne Ladezyklus); hier weitergereicht
export { regionenVon, schauplatzFuer, zielRegionen };

export function einsatzVon(k: KriegVorgang): EinsatzArt | "gemischt" {
  return k.einsatz ?? "gemischt";
}

export function tempoVon(k: KriegVorgang): KriegsTempo {
  return k.tempo ?? "normal";
}

function traegerVon(k: KriegVorgang): Partial<Record<GattungId, number>> {
  const e = einsatzVon(k);
  return e === "gemischt" ? GEMISCHT_TRAEGER : (EINSATZ[e].traeger as Partial<Record<GattungId, number>>);
}

function gegnerDef(landId: string): GegnerBestandDef {
  return GEGNER_BESTAND[landId] ?? GEGNER_BESTAND_STANDARD;
}

const jahr = (w: World): number => Number(w.date.slice(0, 4));

/** Generation einer Gegnergattung zum Datum, mit belegtem Zulauf (etwa F-35 für Griechenland). */
function gegnerStartGeneration(w: World, landId: string, g: GegnerGattung): number {
  const def = gegnerDef(landId);
  let gen = def.gattungen[g].generation;
  for (const z of def.zulauf ?? []) if (z.gattung === g && jahr(w) >= z.ab) gen = Math.max(gen, z.generation);
  return gen;
}

/** Der Bestand des Gegners (Index 100 = Stand 2026); entsteht beim ersten Zugriff. */
export function gegnerBestand(w: World, k: KriegVorgang): Record<GegnerGattung, { menge: number; generation: number }> {
  if (!k.gegnerBestand) {
    const def = gegnerDef(k.land);
    const b = {} as Record<GegnerGattung, { menge: number; generation: number }>;
    for (const g of Object.keys(def.gattungen) as GegnerGattung[]) b[g] = { menge: 100, generation: gegnerStartGeneration(w, k.land, g) };
    k.gegnerBestand = b;
  }
  return k.gegnerBestand;
}

/** Wogegen die gewählte Einsatzart kämpft, als Gewichte der Gegnergattungen. */
function gegenVon(w: World, k: KriegVorgang): Partial<Record<GegnerGattung, number>> {
  const e = einsatzVon(k);
  if (e !== "gemischt") return EINSATZ[e].gegen;
  const def = gegnerDef(k.land);
  void w;
  return Object.fromEntries(Object.entries(def.gattungen).map(([g, d]) => [g, d.gewicht])) as Partial<Record<GegnerGattung, number>>;
}

/** Faktor des gegnerischen Bestands auf seine Stärke (1 = Stand 2026): Menge und Generation der Gattungen, gegen die gekämpft wird. */
export function gegnerBestandsFaktor(w: World, k: KriegVorgang): number {
  const b = gegnerBestand(w, k);
  const def = gegnerDef(k.land);
  let s = 0;
  let n = 0;
  for (const [g, gew] of Object.entries(gegenVon(w, k)) as [GegnerGattung, number][]) {
    if (!gew) continue;
    const start = def.gattungen[g].generation;
    s += gew * (b[g].menge / 100) * (genFaktor(b[g].generation) / genFaktor(start));
    n += gew;
  }
  return n > 0 ? clamp(s / n, 0.15, 1.8) : 1;
}

function gegnerGeneration(w: World, k: KriegVorgang): number {
  const b = gegnerBestand(w, k);
  let s = 0;
  let n = 0;
  for (const [g, gew] of Object.entries(gegenVon(w, k)) as [GegnerGattung, number][]) {
    if (!gew) continue;
    s += gew * b[g].generation;
    n += gew;
  }
  return n > 0 ? s / n : 3;
}

/**
 * Faktor des eigenen Bestands auf die eigene Stärke für diesen Krieg: tragende Gattungen der Einsatzart (Menge × Generation), der
 * Generationsabstand zum Gegner und der Munitionsvorrat. Ohne gewählte Einsatzart gilt der allgemeine Bestandsfaktor (sim/streitkraefte.ts),
 * den krieg.ts dann selbst rechnet: Rückgabe `null`.
 */
export function eigenerBestandsFaktor(w: World, k: KriegVorgang): number | null {
  if (!k.einsatz) return null;
  // Cyber trägt keine Waffengattung, sondern die Behörde für Cybersicherheit (sim/fernkonflikt.ts)
  if (k.einsatz === "cyber") return cyberFaktor(w);
  const traeger = traegerVon(k);
  const idx = einsatzIndex(w, traeger);
  const basis = clamp(0.3 + 0.7 * idx, 0.3, 1.9);
  const abstand = clamp(1 + SCHAUPLATZ.generation * (einsatzGeneration(w, traeger) - gegnerGeneration(w, k)), 0.6, 1.5);
  const munition = streitkraefte(w).gattungen.munition.menge < SCHAUPLATZ.munitionKnapp ? 0.7 : 1;
  return basis * abstand * munition;
}

/** Generationsabstand (eigene minus gegnerische Generation) der gewählten Einsatzart, für die Anzeige. */
export function generationsAbstand(w: World, k: KriegVorgang): number {
  return r1(einsatzGeneration(w, traegerVon(k)) - gegnerGeneration(w, k));
}

// ---------------------------------------------------------------------------
// Faktoren für die Kriegswoche

/** Die Region, um die gerade gekämpft wird (die nächste noch nicht genommene Zielregion), oder keine. */
export function umkaempfteRegion(k: KriegVorgang): Region | undefined {
  const lage = k.regionen ?? {};
  return zielRegionen(k).find((r) => lage[r.id] !== "eigen");
}

export interface KriegsFaktoren {
  /** Faktor auf einen eigenen Vorstoß (positive Frontbewegung): Gelände, Reichweite, Tempo */
  vorstoss: number;
  /** Faktor auf einen Rückschlag (negative Frontbewegung): Tempo (vorsichtig hält besser) */
  rueckschlag: number;
  /** Faktor auf den Abfluss der eigenen Uhr */
  uhr: number;
  /** Zusätzlicher Abfluss der gegnerischen Uhr je Woche */
  druck: number;
  /** Grund für die Anzeige: Gelände der umkämpften Region und ob sie außer Reichweite liegt */
  gelaende?: Gelaende;
  ausserReichweite: boolean;
  /** Die Einsatzart nimmt kein Gebiet (Luftschläge); die Front zeigt nur die Lage */
  keinLand: boolean;
  /** Faktor der Zielraumfläche auf die Frontbewegung (Anzeige) */
  flaeche: number;
}

export function kriegsFaktoren(k: KriegVorgang): KriegsFaktoren {
  const e = einsatzVon(k);
  const tp = TEMPO[tempoVon(k)];
  const r = umkaempfteRegion(k);
  const gel = r ? (e === "gemischt" ? GEMISCHT_GELAENDE[r.gelaende] : EINSATZ[e].gelaende[r.gelaende]) : 1;
  const reichweite = reichweiteVon(k);
  // Reichweite 0 (Luftschläge): Druck ohne Gebiet; die Front zeigt die Lage, genommen wird nichts (Vorbild Klauenschwert 2022)
  const keinLand = reichweite === 0;
  const ausser = !!r && !keinLand && r.tiefe > reichweite;
  // Fläche: Am Boden bewegt ein Frontpunkt SCHAUPLATZ.km2JePunkt; im Gebiet des Gegners (über frontStart) bremst ein großer Zielraum auch
  // seinen Gegenstoß, auf eigenem Boden nicht
  const fl = keinLand ? 1 : flaechenFaktor(k);
  const tiefe = r && !keinLand ? SCHAUPLATZ.tiefe[r.tiefe] : 1;
  const rueck = tempoVon(k) === "vorsichtig" ? 0.8 : tempoVon(k) === "hart" ? 1.1 : 1;
  return {
    vorstoss: gel * (e === "gemischt" ? 1 : EINSATZ[e].tempo ?? 1) * tp.front * (ausser ? SCHAUPLATZ.ueberReichweite : 1) * fl * tiefe,
    rueckschlag: rueck * (k.front > SCHAUPLATZ.frontStart ? fl : 1),
    uhr: (e === "gemischt" ? 1 : EINSATZ[e].uhr) * tp.uhr,
    druck: e === "gemischt" ? 0.15 : EINSATZ[e].druck,
    ...(r ? { gelaende: r.gelaende } : {}),
    ausserReichweite: ausser,
    keinLand,
    flaeche: Math.round(fl * 1000) / 1000,
  };
}

/** Wie tief die Einsatzart Land nehmen kann (0 = gar nicht). */
export function reichweiteVon(k: KriegVorgang): 0 | 1 | 2 | 3 {
  const e = einsatzVon(k);
  return e === "gemischt" ? 3 : EINSATZ[e].reichweite;
}

/** Fläche des Zielraums in km² (data/schauplaetze.ts, belegte Verwaltungsgrenzen); 0 ohne Schauplatz. */
export function zielFlaeche(k: KriegVorgang): number {
  return zielRegionen(k).reduce((s, r) => s + r.flaecheKm2, 0);
}

/** Wie weit die Front in den Zielraum reicht, in km² (auch in eine Region hinein, die noch nicht ganz genommen ist). */
export function vorgerueckteFlaeche(k: KriegVorgang): number {
  if (reichweiteVon(k) === 0) return 0;
  return clamp((k.front - SCHAUPLATZ.frontStart) / SCHAUPLATZ.frontSpanne, 0, 1) * zielFlaeche(k);
}

/** Genommene Fläche in km²: die eigenen Regionen des Schauplatzes (auch was schon besetzt war). */
export function genommeneFlaeche(k: KriegVorgang): number {
  const lage = k.regionen ?? {};
  return regionenVon(k.land).filter((r) => lage[r.id] === "eigen").reduce((s, r) => s + r.flaecheKm2, 0);
}

/** Faktor der Fläche auf die Frontbewegung: Ein Frontpunkt bewegt SCHAUPLATZ.km2JePunkt; ohne Zielregionen 1. */
export function flaechenFaktor(k: KriegVorgang): number {
  const f = zielFlaeche(k);
  if (f <= 0) return 1;
  return clamp((SCHAUPLATZ.km2JePunkt * SCHAUPLATZ.frontSpanne) / f, SCHAUPLATZ.flaecheMin, SCHAUPLATZ.flaecheMax);
}

/** Kampf um Inseln: die Inseln der Ägäis (Gelände „insel“) und Zypern (SCHAUPLATZ.landung). */
function brauchtLandung(k: KriegVorgang, r: Region | undefined): boolean {
  return !!r && (r.gelaende === "insel" || schauplatzFuer(k.land)?.id === "zypern");
}

// ---------------------------------------------------------------------------
// Entscheidungen: Einsatzart und Tempo

export interface EinsatzSicht {
  id: EinsatzArt;
  moeglich: boolean;
  grund?: string;
  aktiv: boolean;
  /** Eignung für das Gelände der umkämpften Region (1 = normal) */
  eignung: number;
  /** Eigene Kampfkraft der tragenden Gattungen (1 = Stand 2026) */
  kraft: number;
}

export function einsatzSichten(w: World, k: KriegVorgang): EinsatzSicht[] {
  const s = schauplatzFuer(k.land);
  const r = umkaempfteRegion(k);
  const rest = (k.einsatzSeit ?? -1e9) + SCHAUPLATZ.einsatzAbkuehlung - w.day;
  // Im Fernkonflikt ohne gemeinsame Grenze gibt es keine Bodenoffensive, dafür Cyber (sim/fernkonflikt.ts); im Landkrieg kein Cyber als Einsatzart
  const fern = istFernkonflikt(k.land);
  const arten = fern ? FERN.mittel : (Object.keys(EINSATZ) as EinsatzArt[]).filter((id) => id !== "cyber");
  return arten.map((id) => {
    let grund: string | undefined;
    if (id === "see" && !(s?.kueste ?? true)) grund = t("krieg.einsatz.grund_kueste");
    else if (id === "stellvertreter" && !fern && !(s?.stellvertreter ?? false)) grund = t("krieg.einsatz.grund_stellvertreter");
    else if (k.einsatz === id) grund = undefined;
    else if (k.einsatz && k.phase === "krieg" && rest > 0) grund = t("krieg.einsatz.grund_abkuehlung", { tage: rest });
    else if (k.einsatz && k.phase === "krieg" && w.spiel && !kannZahlen(w.spiel.kapital, SCHAUPLATZ.einsatzPk)) grund = t("krieg.einsatz.grund_kapital");
    return {
      id,
      moeglich: !grund && k.einsatz !== id && k.phase !== "frieden" && k.phase !== "beendet",
      ...(grund ? { grund } : {}),
      aktiv: k.einsatz === id,
      eignung: r ? EINSATZ[id].gelaende[r.gelaende] : 1,
      kraft: r1(id === "cyber" ? cyberFaktor(w) : einsatzIndex(w, EINSATZ[id].traeger as Partial<Record<GattungId, number>>)),
    };
  });
}

/** Einsatzart festlegen: vor dem Krieg kostenlos, im Krieg mit Abkühlung und Kapital (Umstellung kostet Zeit und Moral). */
export function waehleEinsatz(w: World, k: KriegVorgang, id: EinsatzArt): { ok: boolean; text: string } {
  const sicht = einsatzSichten(w, k).find((x) => x.id === id);
  if (!sicht || !sicht.moeglich) return { ok: false, text: sicht?.grund ?? t("krieg.einsatz.grund_aktiv") };
  const umstellung = !!k.einsatz && k.phase === "krieg";
  if (umstellung && w.spiel) {
    w.spiel.kapital -= SCHAUPLATZ.einsatzPk;
    wirke(w, "truppenmoral", -1);
  }
  k.einsatz = id;
  k.einsatzSeit = w.day;
  if (k.phase === "krieg") wirke(w, "ansehen", EINSATZ[id].ansehen * 0.5);
  const text = t(umstellung ? "krieg.einsatz.umgestellt" : "krieg.einsatz.gesetzt", { art: t(`krieg.einsatz.${id}.name`), land: land(k.land).name });
  addLog(w, "entscheidung", text, t(`krieg.einsatz.${id}.text`));
  return { ok: true, text };
}

export function waehleTempo(w: World, k: KriegVorgang, tempo: KriegsTempo): { ok: boolean; text: string } {
  if (k.phase === "frieden" || k.phase === "beendet") return { ok: false, text: t("krieg.tempo.vorbei") };
  if (tempoVon(k) === tempo) return { ok: false, text: t("krieg.tempo.schon") };
  k.tempo = tempo;
  const text = t("krieg.tempo.gesetzt", { tempo: t(`krieg.tempo.${tempo}.name`) });
  addLog(w, "entscheidung", text, t(`krieg.tempo.${tempo}.text`));
  return { ok: true, text };
}

// ---------------------------------------------------------------------------
// Wochenschritt: Verluste, Regionen, Folgen

/**
 * Nach der Frontbewegung einer Kriegswoche (sim/krieg.ts `kriegWoche`): Verluste beider Bestände, Lage der Regionen, bedrohte
 * Grenzprovinzen, Kriegslast im Gegnerland (Flucht), Druck einer Blockade auf den eigenen Handel.
 */
export function schauplatzWoche(w: World, k: KriegVorgang, delta: number): void {
  const e = einsatzVon(k);
  const tp = TEMPO[tempoVon(k)];
  // Im Fernkonflikt kämpfen keine Bodentruppen: Die eigenen Verluste sind ein kleiner Bruchteil (sim/fernkonflikt.ts, Vorbild Klauenschwert)
  const verlustArt = (e === "gemischt" ? 1 : EINSATZ[e].verlust) * (istFernkonflikt(k.land) ? FERN.verlust : 1);
  // Eigene Verluste: Verschleiß, Rückschläge, ein Teil der Vorstöße
  const eigen = (SCHAUPLATZ.verlustBasis + Math.max(0, -delta) * SCHAUPLATZ.verlustRueckzug + Math.max(0, delta) * SCHAUPLATZ.verlustVorstoss) * verlustArt * tp.verlust;
  // Gefallene im Landkrieg mit Zielraum (Welle 3, K2): aus der Fläche dieser Woche, ihrem Gelände und dem Grundverschleiß; vor dem Faktor der
  // gegnerischen Stärke, den sim/kriegspreis.ts anlegt. Ohne Gebiet (Luftschläge, Fernkonflikt, kein Schauplatz) gilt dort die alte Rechnung.
  const umkVorher = umkaempfteRegion(k);
  const flaeche = zielFlaeche(k);
  const amBoden = flaeche > 0 && reichweiteVon(k) > 0 && !istFernkonflikt(k.land);
  const km2 = amBoden ? (Math.max(0, delta) / SCHAUPLATZ.frontSpanne) * flaeche : 0;
  const last = amBoden
    ? (SCHAUPLATZ.gefalleneJeWoche + (km2 / 1000) * SCHAUPLATZ.gefalleneJe1000Km2[umkVorher?.gelaende ?? "ebene"] * (brauchtLandung(k, umkVorher) ? SCHAUPLATZ.landung : 1)) * verlustArt * tp.verlust
    : undefined;
  kriegsVerluste(w, traegerVon(k), eigen);
  // Verluste des Gegners: Verschleiß, unsere Vorstöße, Druck (Luftschläge, Blockade); stärker, wer mehr Feuerkraft hat
  const feuer = clamp(einsatzIndex(w, traegerVon(k)), 0.3, 1.8);
  const druck = e === "gemischt" ? 0.15 : EINSATZ[e].druck;
  const gegner = (SCHAUPLATZ.gegnerBasis + Math.max(0, delta) * SCHAUPLATZ.gegnerVorstoss + druck * SCHAUPLATZ.gegnerDruck) * feuer * tp.front;
  const b = gegnerBestand(w, k);
  const gegen = gegenVon(w, k);
  const groesst = Math.max(...Object.values(gegen).map((x) => x ?? 0), 0.01);
  for (const [g, gew] of Object.entries(gegen) as [GegnerGattung, number][]) {
    if (!gew) continue;
    b[g].menge = r1(Math.max(0, b[g].menge * (1 - gegner * (gew / groesst))));
  }
  // Regionen folgen der Front
  const vorher = { ...(k.regionen ?? {}) };
  regionenSetzen(w, k);
  for (const r of zielRegionen(k)) {
    const neu = k.regionen![r.id];
    if (neu === "eigen" && vorher[r.id] !== "eigen") {
      addLog(w, "ereignis", t("krieg.region.genommen", { region: t(`krieg.region.${r.id}`), land: land(k.land).name }), t(`krieg.gelaende.${r.gelaende}`));
      if (r.reizt) landAendern(w, r.reizt.land, { konflikt: r.reizt.konflikt, vertrauen: -r.reizt.konflikt / 2 }, t("krieg.region.reizt", { region: t(`krieg.region.${r.id}`) }));
      wirke(w, "nationalisten", 0.6 * r.wert);
    } else if (neu !== "eigen" && vorher[r.id] === "eigen") {
      addLog(w, "ereignis", t("krieg.region.verloren", { region: t(`krieg.region.${r.id}`) }), "");
      wirke(w, "nationalisten", -0.5 * r.wert);
    }
  }
  const umk = umkaempfteRegion(k);
  k.letzteWoche = { eigen: r1(eigen * 100), gegner: r1(gegner * 100), ...(umk ? { region: umk.id } : {}), ...(last !== undefined ? { last, km2: Math.round(km2) } : {}) };
  // Bedrohte Grenzprovinzen: Tourismus und Handel leiden dort
  if (k.bedroht?.length) wirke(w, "tourismus", -0.15, k.bedroht);
  // Kriegslast im Gegnerland (Weltmodell): treibt Flucht und Instabilität
  const e2 = eigenVon(w, k.land);
  if (e2) e2.krieg = Math.max(e2.krieg, SCHAUPLATZ.kriegsLast[e] * (tempoVon(k) === "hart" ? 1.1 : 1));
  // Was der Krieg jede Woche kostet: Geld und, mit jedem Gefallenen, Zustimmung
  const tempoKosten = tempoVon(k) === "hart" ? 1.3 : tempoVon(k) === "vorsichtig" ? 0.8 : 1;
  kosten(w, SCHAUPLATZ.kostenWoche[e] * tempoKosten);
  if (w.spiel) w.spiel.umfrage.zustimmung = Math.max(0, w.spiel.umfrage.zustimmung - eigen * SCHAUPLATZ.verlustZustimmung);
  // Seeblockade trifft auch den eigenen Handel
  if (e === "see") wirke(w, "export", -0.05);
}

/** Setzt die Lage der Regionen aus der Frontlage (und die bedrohten Grenzprovinzen). */
export function regionenSetzen(w: World, k: KriegVorgang): void {
  const ziel = zielRegionen(k);
  const lage: Record<string, RegionLage> = {};
  for (const r of regionenVon(k.land)) lage[r.id] = "gegner";
  const anteil = clamp((k.front - SCHAUPLATZ.frontStart) / SCHAUPLATZ.frontSpanne, 0, 1);
  const reichweite = reichweiteVon(k);
  // Die Front deckt einen Anteil der Fläche des Zielraums (Welle 3, K2): Eine Region fällt, wenn sie mit allen vor ihr ganz gedeckt ist
  const gesamt = ziel.reduce((s, r) => s + r.flaecheKm2, 0);
  let n = 0;
  for (let i = 0, summe = 0; i < ziel.length; i++) {
    summe += ziel[i]!.flaecheKm2;
    if (summe <= anteil * gesamt + 1e-6) n = i + 1;
    else break;
  }
  // Was schon genommen war und noch von der Front gedeckt ist, bleibt; neu genommen wird nur in Reichweite
  const alt = k.regionen ?? {};
  let genommen = 0;
  for (const r of ziel) {
    if (genommen >= n) break;
    if (r.tiefe > reichweite && alt[r.id] !== "eigen") break;
    lage[r.id] = "eigen";
    genommen += 1;
  }
  n = genommen;
  if (k.phase === "krieg" && k.front > 50 && n < ziel.length) lage[ziel[n]!.id] = "umkaempft";
  // Was die Türkei schon besetzt hält (Frieden oder eingefrorene Linie), bleibt türkisch: Ein neuer Krieg erobert es nicht ein zweites Mal
  // (krieg.md Befund A6; die Eingliederung baut Schritt 9)
  // Welle 3, K5 (Revanche): Ist der Gegner im Vorteil, holt er sich zuerst die gehaltenen Regionen zurück (sim/besatzung.ts)
  const haeltNoch = revancheLage(w, k, lage, SCHAUPLATZ.bedrohtAb, SCHAUPLATZ.bedrohtSpanne);
  k.regionen = lage;
  const s = schauplatzFuer(k.land);
  // Der Landkrieg beginnt an der Grenze (Welle 3, K2): Die Überlegenheit zeigt sich im Tempo, nicht in Fläche am ersten Tag. Vorher
  // begann die Front je nach Stärke bei bis zu 75 und nahm in einem Lauf gegen Syrien gleich zu Beginn ein Viertel des Zielraums.
  if (k.phase === "krieg" && k.woche === 0 && s && !istFernkonflikt(k.land)) k.front = Math.min(k.front, SCHAUPLATZ.frontStart);
  const druck = clamp((SCHAUPLATZ.bedrohtAb - k.front) / SCHAUPLATZ.bedrohtSpanne, 0, 1);
  k.bedroht = s && k.phase === "krieg" && druck > 0 && !haeltNoch ? s.grenzprovinzen.slice(0, Math.ceil(druck * s.grenzprovinzen.length)) : [];
}

/** Einen Zielraum wechseln oder setzen: Die Regionen ordnen sich neu (Bereits Genommenes bleibt, solange die Front es deckt). */
export function zielGeaendert(w: World, k: KriegVorgang): void {
  if (k.phase === "krieg" || k.phase === "waffenruhe") regionenSetzen(w, k);
}

// ---------------------------------------------------------------------------
// Monat: Ersatz beim Gegner, Munition bei hartem Tempo, Besatzung

export function kriegsschauplatzMonat(w: World, kriege: KriegVorgang[]): void {
  for (const k of kriege) {
    if (k.phase === "beendet" || k.phase === "frieden") continue;
    if (!k.gegnerBestand) continue;
    const def = gegnerDef(k.land);
    for (const g of Object.keys(k.gegnerBestand) as GegnerGattung[]) {
      const b = k.gegnerBestand[g];
      if (b.menge < 100) b.menge = r1(Math.min(100, b.menge + (100 - b.menge) * def.ersatz));
      b.generation = Math.max(b.generation, gegnerStartGeneration(w, k.land, g));
    }
    if (k.phase === "krieg") verbraucheMunition(w, TEMPO[tempoVon(k)].munition);
  }
  besatzungMonat(w);
}

// ---------------------------------------------------------------------------
// Besatzung: seit Welle 3, K5 in sim/besatzung.ts (fünf Formen, Annexion als Provinz); hier weitergereicht, damit sim/krieg.ts, der
// Friedenstisch (K4) und ältere Aufrufer unverändert bleiben

export {
  aendereBesatzung,
  besatzung,
  besatzungAnlegen,
  besatzungNachFrieden,
  besatzungsSicht,
  migriereEingefroreneLinien,
  type BesatzungsSicht,
} from "./besatzung";

// ---------------------------------------------------------------------------
// Lage für Karte und Akte

export interface KarteRegion {
  id: string;
  lon: number;
  lat: number;
  lage: RegionLage | "besetzt";
  form?: BesatzungsForm;
  /** Welle 3, K5: Kennziffer der neuen Provinz, wenn die Region annektiert ist */
  plaka?: number;
  gelaende: Gelaende;
  wert: number;
}

export interface KriegsKarte {
  regionen: KarteRegion[];
  /** Vorstöße: von → nach (Längengrad, Breitengrad); eigene von der letzten eigenen Region oder der Grenze, gegnerische auf Provinzen */
  pfeile: { von: [number, number]; nach: [number, number]; seite: "eigen" | "gegner" }[];
  /** Bedrohte türkische Provinzen (Plaka) */
  bedroht: number[];
  /** Ein Krieg läuft gerade (Animation an) */
  aktiv: boolean;
  /**
   * Die Frontlinie je Krieg (Befund G-1): ein Punkt auf dem Weg von der türkischen Grenze durch die Zielregionen (nach Tiefe), so weit,
   * wie die Frontlage reicht, und die Richtung des Vorstoßes (Längen-, Breitengrad je Einheit). Deterministisch aus `front`.
   */
  fronten?: { land: string; punkt: [number, number]; richtung: [number, number]; front: number }[];
  /**
   * Verbände als Marken: hinter der Front die eigenen Teilstreitkräfte, die die Einsatzart trägt, davor der Gegner. `staerke` ist der Bestand
   * in Prozent des Stands 2026 (eigen) bzw. des Vorkriegsstands (Gegner), aus denselben Zahlen wie das Dossier.
   */
  verbaende?: { land: string; lon: number; lat: number; seite: "eigen" | "gegner"; art: "heer" | "luft" | "see"; staerke: number }[];
}

/** Tragende Teilstreitkräfte je Einsatzart (für die Marken auf der Karte). */
const MARKEN_TEILE: Record<EinsatzArt | "gemischt", ("heer" | "luft" | "see")[]> = {
  luft: ["luft"], boden: ["heer", "luft"], see: ["see"], stellvertreter: ["heer"], cyber: [], gemischt: ["heer", "luft"],
};
const TEIL_GATTUNGEN: Record<"heer" | "luft" | "see", Partial<Record<GattungId, number>>> = {
  heer: { personal: 0.35, panzer: 0.4, munition: 0.25 },
  luft: { kampfflugzeuge: 0.45, drohnen: 0.35, luftabwehr: 0.2 },
  see: { marine: 0.7, raketen: 0.3 },
};

/**
 * Wo die Front steht: Die Frontlage 40 liegt an der Grenze (darunter drängt der Gegner, die Karte zeigt dann die bedrohten Provinzen),
 * 96 (Sieg) an der tiefsten Zielregion; dazwischen läuft sie gleichmäßig den Weg entlang. Spielparameter der Darstellung.
 */
function frontPunkt(weg: [number, number][], front: number): { punkt: [number, number]; richtung: [number, number] } {
  const u = clamp((front - 40) / 56, 0, 1);
  const laengen = weg.slice(1).map((p, i) => Math.hypot(p[0] - weg[i]![0], p[1] - weg[i]![1]));
  const gesamt = laengen.reduce((a, b) => a + b, 0) || 1;
  let rest = u * gesamt;
  for (let i = 0; i < laengen.length; i++) {
    const a = weg[i]!;
    const b = weg[i + 1]!;
    const l = laengen[i]! || 1e-9;
    if (rest <= l || i === laengen.length - 1) {
      const f = Math.min(1, rest / l);
      return { punkt: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], richtung: [(b[0] - a[0]) / l, (b[1] - a[1]) / l] };
    }
    rest -= l;
  }
  return { punkt: weg[weg.length - 1]!, richtung: [0, -1] };
}

/** Was die Karte zeigt: Regionen aller laufenden Kriege (mit Lage), besetzte Regionen, Vorstoßpfeile und bedrohte Grenzprovinzen. */
export function kriegsKarte(w: World, kriege: KriegVorgang[], grenzpunkt: (plaka: number) => [number, number] | undefined): KriegsKarte | null {
  const regionen: KarteRegion[] = [];
  const pfeile: KriegsKarte["pfeile"] = [];
  const bedroht: number[] = [];
  let aktiv = false;
  const gesehen = new Set<string>();
  for (const k of kriege) {
    if (k.phase !== "krieg" && k.phase !== "waffenruhe") continue;
    const s = schauplatzFuer(k.land);
    if (!s) continue;
    aktiv = aktiv || k.phase === "krieg";
    const lage = k.regionen ?? {};
    for (const r of regionenVon(k.land)) {
      gesehen.add(r.id);
      regionen.push({ id: r.id, lon: r.lon, lat: r.lat, lage: lage[r.id] ?? "gegner", gelaende: r.gelaende, wert: r.wert });
    }
    if (k.phase !== "krieg") continue;
    const umk = umkaempfteRegion(k);
    if (umk && lage[umk.id] === "umkaempft") {
      // Der Vorstoß kommt aus der nächstgelegenen genommenen Region, sonst von der Grenze
      const eigene = zielRegionen(k).filter((r) => lage[r.id] === "eigen");
      const abstand = (r: Region) => Math.hypot(r.lon - umk.lon, r.lat - umk.lat);
      const letzte = [...eigene].sort((a, b) => abstand(a) - abstand(b))[0];
      const von = letzte ? ([letzte.lon, letzte.lat] as [number, number]) : grenzpunkt(s.grenzprovinzen[0]!);
      if (von) pfeile.push({ von, nach: [umk.lon, umk.lat], seite: "eigen" });
    }
    for (const p of k.bedroht ?? []) {
      bedroht.push(p);
      const nach = grenzpunkt(p);
      const quelle = regionenVon(k.land).filter((r) => r.tiefe === 1 && lage[r.id] !== "eigen")[0];
      if (nach && quelle) pfeile.push({ von: [quelle.lon, quelle.lat], nach, seite: "gegner" });
    }
  }
  // Front und Verbände je laufendem Krieg (Befund G-1): bewegen sich jede Woche mit der Frontlage und den Beständen
  const fronten: NonNullable<KriegsKarte["fronten"]> = [];
  const verbaende: NonNullable<KriegsKarte["verbaende"]> = [];
  for (const k of kriege) {
    if (k.phase !== "krieg" && k.phase !== "waffenruhe") continue;
    const s = schauplatzFuer(k.land);
    const start = s ? grenzpunkt(s.grenzprovinzen[0]!) : undefined;
    const ziel = zielRegionen(k);
    if (!s || !start || !ziel.length) continue;
    const weg: [number, number][] = [start, ...ziel.map((r) => [r.lon, r.lat] as [number, number])];
    const { punkt, richtung } = frontPunkt(weg, k.front);
    fronten.push({ land: k.land, punkt, richtung, front: Math.round(k.front) });
    // Eigene Marken hinter der Front, quer zur Stoßrichtung gestaffelt; der Gegner davor
    const quer: [number, number] = [-richtung[1], richtung[0]];
    const teile = MARKEN_TEILE[einsatzVon(k)];
    teile.forEach((teil, i) => {
      const versatz = (i - (teile.length - 1) / 2) * 0.8;
      verbaende.push({
        land: k.land, seite: "eigen", art: teil, staerke: Math.round(einsatzIndex(w, TEIL_GATTUNGEN[teil]) * 100),
        lon: punkt[0] - richtung[0] * 0.5 + quer[0] * versatz, lat: punkt[1] - richtung[1] * 0.5 + quer[1] * versatz,
      });
    });
    verbaende.push({ land: k.land, seite: "gegner", art: "heer", staerke: Math.round(gegnerBestandsFaktor(w, k) * 100), lon: punkt[0] + richtung[0] * 0.5, lat: punkt[1] + richtung[1] * 0.5 });
  }
  for (const b of besatzungLesen(w)) {
    if (gesehen.has(b.region)) continue;
    const r = REGION_NACH_ID[b.region];
    if (r) regionen.push({ id: r.id, lon: r.lon, lat: r.lat, lage: "besetzt", form: b.form, ...(b.plaka ? { plaka: b.plaka } : {}), gelaende: r.gelaende, wert: r.wert });
  }
  if (!regionen.length) return null;
  return { regionen, pfeile, bedroht, aktiv, ...(fronten.length ? { fronten, verbaende } : {}) };
}

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
  BESATZUNG,
  EINSATZ,
  GEGNER_BESTAND,
  GEGNER_BESTAND_STANDARD,
  REGIONEN,
  REGION_NACH_ID,
  SCHAUPLATZ_NACH_LAND,
  TEMPO,
  ZIELRAUM_REGIONEN,
  type BesatzungsForm,
  type EinsatzArt,
  type GegnerBestandDef,
  type GegnerGattung,
  type Gelaende,
  type KriegsTempo,
  type Region,
  type Schauplatz,
} from "../data/schauplaetze";
import type { BesatzungsGebiet, KriegVorgang, RegionLage } from "./krieg-typen";
import type { GattungId } from "../data/streitkraefte";
import { einsatzGeneration, einsatzIndex, kriegsVerluste, verbraucheMunition, streitkraefte } from "./streitkraefte";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { kosten } from "./ereignis-hilfen";
import { kannZahlen } from "./kapital";
import { land, landAendern, weltZustand } from "./laender";
import { eigenVon } from "./welt-modell";
import { aussenZustand } from "./diplomatie";
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
  kriegsLast: { luft: 55, boden: 80, see: 45, stellvertreter: 60, gemischt: 70 } as Record<EinsatzArt | "gemischt", number>,
  /** Laufende Kosten der Operationen je Kriegswoche in % des BIP (Treibstoff, Munition, Einsatzzulagen; Spielparameter) */
  kostenWoche: { luft: 0.012, boden: 0.025, see: 0.016, stellvertreter: 0.006, gemischt: 0.018 } as Record<EinsatzArt | "gemischt", number>,
  /** Zustimmung je Prozentpunkt eigener Wochenverluste („die Särge kommen heim“) */
  verlustZustimmung: 40,
  /** Munitionsvorrat (Gefechtstage), unter dem die Kampfkraft einbricht */
  munitionKnapp: 10,
};

/** Tragende Gattungen ohne gewählte Einsatzart („gemischt“, der Generalstab verteilt). */
const GEMISCHT_TRAEGER: Partial<Record<GattungId, number>> = { personal: 0.2, panzer: 0.2, kampfflugzeuge: 0.15, drohnen: 0.2, marine: 0.05, raketen: 0.1, munition: 0.1 };
const GEMISCHT_GELAENDE: Record<Gelaende, number> = { ebene: 1.1, berge: 0.75, stadt: 0.7, insel: 0.6, kueste: 0.95 };

// ---------------------------------------------------------------------------
// Daten des Vorgangs

export function schauplatzFuer(landId: string): Schauplatz | undefined {
  return SCHAUPLATZ_NACH_LAND[landId];
}

export function regionenVon(landId: string): Region[] {
  const s = schauplatzFuer(landId);
  return s ? REGIONEN.filter((r) => r.schauplatz === s.id) : [];
}

/** Die Zielregionen des Vorgangs in der Reihenfolge, in der die Front sie nimmt (Tiefe, dann Lage im Datensatz). */
export function zielRegionen(k: KriegVorgang): Region[] {
  const ids = k.zielraum ? ZIELRAUM_REGIONEN[k.zielraum] : undefined;
  const alle = regionenVon(k.land);
  const liste = ids ? ids.map((id) => REGION_NACH_ID[id]).filter((r): r is Region => !!r) : alle.filter((r) => r.tiefe === 1);
  return [...liste].sort((a, b) => a.tiefe - b.tiefe);
}

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
}

export function kriegsFaktoren(k: KriegVorgang): KriegsFaktoren {
  const e = einsatzVon(k);
  const tp = TEMPO[tempoVon(k)];
  const r = umkaempfteRegion(k);
  const gel = r ? (e === "gemischt" ? GEMISCHT_GELAENDE[r.gelaende] : EINSATZ[e].gelaende[r.gelaende]) : 1;
  const reichweite = e === "gemischt" ? 3 : EINSATZ[e].reichweite;
  const ausser = !!r && r.tiefe > reichweite;
  return {
    vorstoss: gel * tp.front * (ausser ? SCHAUPLATZ.ueberReichweite : 1),
    rueckschlag: tempoVon(k) === "vorsichtig" ? 0.8 : tempoVon(k) === "hart" ? 1.1 : 1,
    uhr: (e === "gemischt" ? 1 : EINSATZ[e].uhr) * tp.uhr,
    druck: e === "gemischt" ? 0.15 : EINSATZ[e].druck,
    ...(r ? { gelaende: r.gelaende } : {}),
    ausserReichweite: ausser,
  };
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
  return (Object.keys(EINSATZ) as EinsatzArt[]).map((id) => {
    let grund: string | undefined;
    if (id === "see" && !(s?.kueste ?? true)) grund = t("krieg.einsatz.grund_kueste");
    else if (id === "stellvertreter" && !(s?.stellvertreter ?? false)) grund = t("krieg.einsatz.grund_stellvertreter");
    else if (k.einsatz === id) grund = undefined;
    else if (k.einsatz && k.phase === "krieg" && rest > 0) grund = t("krieg.einsatz.grund_abkuehlung", { tage: rest });
    else if (k.einsatz && k.phase === "krieg" && w.spiel && !kannZahlen(w.spiel.kapital, SCHAUPLATZ.einsatzPk)) grund = t("krieg.einsatz.grund_kapital");
    return {
      id,
      moeglich: !grund && k.einsatz !== id && k.phase !== "frieden" && k.phase !== "beendet",
      ...(grund ? { grund } : {}),
      aktiv: k.einsatz === id,
      eignung: r ? EINSATZ[id].gelaende[r.gelaende] : 1,
      kraft: r1(einsatzIndex(w, EINSATZ[id].traeger as Partial<Record<GattungId, number>>)),
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
  const verlustArt = e === "gemischt" ? 1 : EINSATZ[e].verlust;
  // Eigene Verluste: Verschleiß, Rückschläge, ein Teil der Vorstöße
  const eigen = (SCHAUPLATZ.verlustBasis + Math.max(0, -delta) * SCHAUPLATZ.verlustRueckzug + Math.max(0, delta) * SCHAUPLATZ.verlustVorstoss) * verlustArt * tp.verlust;
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
  k.letzteWoche = { eigen: r1(eigen * 100), gegner: r1(gegner * 100), ...(umk ? { region: umk.id } : {}) };
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
  const e = einsatzVon(k);
  const reichweite = e === "gemischt" ? 3 : EINSATZ[e].reichweite;
  let n = Math.floor(anteil * ziel.length + 1e-9);
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
  k.regionen = lage;
  const s = schauplatzFuer(k.land);
  const druck = clamp((SCHAUPLATZ.bedrohtAb - k.front) / SCHAUPLATZ.bedrohtSpanne, 0, 1);
  k.bedroht = s && k.phase === "krieg" && druck > 0 ? s.grenzprovinzen.slice(0, Math.ceil(druck * s.grenzprovinzen.length)) : [];
  void w;
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
// Besatzung

export function besatzung(w: World): BesatzungsGebiet[] {
  const sp = w.spiel;
  if (!sp) return [];
  sp.besatzung ??= [];
  return sp.besatzung;
}

/**
 * Nach einem Frieden mit Gebietsgewinn (Paket mit `gebiet` = 1): Was die Türkei hält, wird besetzt (Form „Pufferzone“, die der Spieler
 * später ändern kann). Hält sie nichts, wird die umkämpfte Grenzregion zur Pufferzone (der frühere Sinn des Pakets). Ohne Gebietsgewinn
 * kehren alle Regionen zurück. Rückgabe: die Namen der besetzten Regionen (für den Friedenstext).
 */
export function besatzungNachFrieden(w: World, k: KriegVorgang, gebiet: -1 | 0 | 1): string[] {
  const lage = k.regionen ?? {};
  const liste = besatzung(w);
  const out: string[] = [];
  if (gebiet === 1) {
    let ids = zielRegionen(k).filter((r) => lage[r.id] === "eigen").map((r) => r.id);
    if (!ids.length) {
      const erste = zielRegionen(k)[0];
      if (erste) ids = [erste.id];
    }
    for (const id of ids) {
      if (liste.some((b) => b.region === id)) continue;
      liste.push({ region: id, land: k.land, seit: w.day, form: "pufferzone", widerstand: 30, aufstand: 0 });
      out.push(t(`krieg.region.${id}`));
    }
  }
  k.regionen = Object.fromEntries(regionenVon(k.land).map((r) => [r.id, liste.some((b) => b.region === r.id) ? "eigen" : "gegner"] as const));
  k.bedroht = [];
  return out;
}

export interface BesatzungsSicht extends BesatzungsGebiet {
  kostenMonat: number;
  widerstandZiel: number;
  gelaende: Gelaende;
  ressource?: Region["ressource"];
}

function widerstandZiel(w: World, b: BesatzungsGebiet): number {
  const r = REGION_NACH_ID[b.region];
  const konflikt = weltZustand(w)[b.land]?.konflikt ?? 50;
  return clamp(BESATZUNG.widerstandZiel[b.form] + (r ? BESATZUNG.gelaendeWiderstand[r.gelaende] : 0) + 0.2 * (konflikt - 50), 0, 100);
}

function kostenMonat(b: BesatzungsGebiet): number {
  const r = REGION_NACH_ID[b.region];
  // Ölfelder unter Kontrolle tragen einen Teil der Kosten selbst (Spielparameter)
  return BESATZUNG.kosten[b.form] - (r?.ressource === "oel" ? 0.008 : 0);
}

export function besatzungsSicht(w: World): BesatzungsSicht[] {
  return besatzung(w).map((b) => {
    const r = REGION_NACH_ID[b.region];
    return { ...b, kostenMonat: r1(kostenMonat(b) * 1000) / 1000, widerstandZiel: Math.round(widerstandZiel(w, b)), gelaende: r?.gelaende ?? "ebene", ...(r?.ressource ? { ressource: r.ressource } : {}) };
  });
}

/** Die Form einer Besatzung ändern (Pufferzone, Zivilverwaltung mit Wiederaufbau, Annexion) oder die Region zurückgeben. */
export function aendereBesatzung(w: World, regionId: string, ziel: BesatzungsForm | "rueckgabe"): { ok: boolean; text: string } {
  const sp = w.spiel;
  const liste = besatzung(w);
  const b = liste.find((x) => x.region === regionId);
  if (!sp || !b) return { ok: false, text: t("krieg.besatzung.unbekannt") };
  const name = t(`krieg.region.${regionId}`);
  const l = land(b.land);
  if (ziel === "rueckgabe") {
    sp.besatzung = liste.filter((x) => x !== b);
    landAendern(w, b.land, { vertrauen: 8, konflikt: -10 }, t("krieg.besatzung.grund_rueckgabe", { region: name }));
    wirke(w, "ansehen", 2);
    wirke(w, "nationalisten", -3);
    const text = t("krieg.besatzung.zurueck", { region: name, land: l.name });
    addLog(w, "entscheidung", text, t("krieg.besatzung.zurueck_why"));
    return { ok: true, text };
  }
  if (b.form === ziel) return { ok: false, text: t("krieg.besatzung.schon") };
  const pk = ziel === "annexion" ? BESATZUNG.pkAnnexion : BESATZUNG.pkWechsel;
  if (!kannZahlen(sp.kapital, pk)) return { ok: false, text: t("krieg.besatzung.kapital", { pk }) };
  sp.kapital -= pk;
  b.form = ziel;
  if (ziel === "annexion") {
    // Annexion: innen ein Triumph für Hardliner, außen ein Bruch des Völkerrechts mit Sanktionsfolgen (sim/diplomatie.ts Sanktionsregeln)
    wirke(w, "ansehen", -8);
    wirke(w, "beziehungen_eu", -6);
    wirke(w, "nationalisten", 4);
    wirke(w, "konservative", 1);
    wirke(w, "staedtische_saekulare", -2);
    landAendern(w, b.land, { vertrauen: -25, konflikt: 20 }, t("krieg.besatzung.grund_annexion", { region: name }));
    landAendern(w, "EU", { konflikt: 15, vertrauen: -8 }, t("krieg.besatzung.grund_annexion", { region: name }));
    landAendern(w, "USA", { konflikt: 8, vertrauen: -5 }, t("krieg.besatzung.grund_annexion", { region: name }));
    b.widerstand = clamp(b.widerstand + 15, 0, 100);
  } else if (ziel === "verwaltung") {
    wirke(w, "ansehen", 1);
  }
  const text = t(`krieg.besatzung.form_gesetzt.${ziel}`, { region: name, land: l.name });
  addLog(w, "entscheidung", text, t(`krieg.besatzung.form.${ziel}.text`));
  return { ok: true, text };
}

/** Monatlich: Kosten, Widerstand, Anschläge, Aufstand; Zivilverwaltung in Syrien bringt Rückkehr von Geflüchteten. */
function besatzungMonat(w: World): void {
  const sp = w.spiel;
  if (!sp?.besatzung?.length) return;
  let summe = 0;
  for (const b of [...sp.besatzung]) {
    summe += kostenMonat(b);
    const ziel = widerstandZiel(w, b);
    b.widerstand = r1(clamp(b.widerstand + 0.15 * (ziel - b.widerstand), 0, 100));
    const name = t(`krieg.region.${b.region}`);
    if (b.widerstand >= BESATZUNG.anschlagAb) {
      // Deterministisch aus Tag und Region: etwa jeder zweite bis vierte Monat bei hohem Widerstand
      const wurf = ((w.day * 31 + b.region.length * 17) % 100) / 100;
      if (wurf < (b.widerstand - 40) / 100) {
        sp.umfrage.zustimmung = Math.max(0, sp.umfrage.zustimmung - 0.3);
        wirke(w, "truppenmoral", -0.5);
        addLog(w, "ereignis", t("krieg.besatzung.anschlag", { region: name }), t("krieg.besatzung.anschlag_why", { widerstand: Math.round(b.widerstand) }));
      }
    }
    if (b.form === "annexion") wirke(w, "ansehen", -0.15);
    if (b.form === "verwaltung" && b.land === "SYR") {
      const a = aussenZustand(w);
      a.flucht.bestand = Math.max(0.2, Math.round((a.flucht.bestand - 0.01) * 100) / 100);
    }
    b.aufstand = b.widerstand >= BESATZUNG.aufstand ? b.aufstand + 1 : 0;
    if (b.aufstand >= 3) {
      sp.besatzung = sp.besatzung.filter((x) => x !== b);
      wirke(w, "nationalisten", -2);
      wirke(w, "truppenmoral", -2);
      sp.hinweise.push({ id: `krieg-besatzung-aufstand-${b.region}-${w.day}`, titel: t("krieg.besatzung.aufstand_titel", { region: name }), text: [t("krieg.besatzung.aufstand_text", { region: name })], szene: "istanbul" });
      addLog(w, "ereignis", t("krieg.besatzung.aufstand_titel", { region: name }), "");
    }
  }
  if (summe !== 0) kosten(w, summe);
}

// ---------------------------------------------------------------------------
// Lage für Karte und Akte

export interface KarteRegion {
  id: string;
  lon: number;
  lat: number;
  lage: RegionLage | "besetzt";
  form?: BesatzungsForm;
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
  for (const b of besatzung(w)) {
    if (gesehen.has(b.region)) continue;
    const r = REGION_NACH_ID[b.region];
    if (r) regionen.push({ id: r.id, lon: r.lon, lat: r.lat, lage: "besetzt", form: b.form, gelaende: r.gelaende, wert: r.wert });
  }
  if (!regionen.length) return null;
  return { regionen, pfeile, bedroht, aktiv };
}

// Besatzung als Verwaltung (Welle 3, K5; krieg.md Schritt 8, Befunde C5 und C8). Aus sim/kriegsschauplatz.ts herausgelöst; dort werden
// die Funktionen weitergereicht, damit sim/krieg.ts und der Friedenstisch (K4) sie unverändert aufrufen.
//
// Fünf Formen nach echten Vorbildern (data/besatzung.ts): Sicherheitszone (mit Stellvertretern, wo es sie gibt), Zivilverwaltung über die
// Grenzprovinz, Satellitenstaat nach dem TRNZ-Muster, Annexion (sim/annexion.ts, die Region wird eine Provinz) und Rückgabe.
//
// Grundsatz „keine Schau“: Jede Form rechnet ihren Monat mit `monatsWerte`. Dieselbe Funktion bucht im Spiel (`besatzungMonat`) und zeichnet
// die Vorschau über drei Jahre (`formKurve`), die die Akte vor der Wahl zeigt.
//
// Schnittstelle zum Friedenstisch (K4): `besatzungNachFrieden(w, k, gebiet, { forderungen, formen })` legt je gehaltener Region die Form an.
// `formen[regionId]` (oder ein Formname als Wert in `forderungen`) ist eine der Formen oder „rueckgabe“; „abtretung“ ist die Annexion per
// Vertrag (Hatay-Weg). Ohne Angabe wird eine gehaltene Region Sicherheitszone, wie vorher die Pufferzone.

import { ALTE_FORM, BESATZUNG, FORM, FORMEN, GELAENDE_WIDERSTAND, RUECKKEHR_MAX, type BesatzungsForm, type BesatzungsWahl } from "../data/besatzung";
import { REGION_NACH_ID, SCHAUPLATZ_NACH_LAND, type Gelaende, type Region } from "../data/schauplaetze";
import { regionenVon, zielRegionen } from "./schauplatz-regionen";
import type { BesatzungsGebiet, KriegVorgang, RegionLage } from "./krieg-typen";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { kosten } from "./ereignis-hilfen";
import { kannZahlen } from "./kapital";
import { land, landAendern, landSicht } from "./laender";
import { aussenZustand } from "./diplomatie";
import { annektiere, annexionVorschau, provinzVerloren, satellitAusrufen } from "./annexion";
import { einnahmenMonat, neueProvinzVon, eingliederungsGrad, einwohnerAnteil } from "./provinzen-neu";
import { t } from "../i18n";
import type { World } from "./types";

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
const r1 = (x: number): number => Math.round(x * 10) / 10;

export function besatzung(w: World): BesatzungsGebiet[] {
  const sp = w.spiel;
  if (!sp) return [];
  sp.besatzung ??= [];
  return sp.besatzung;
}

/** Nur lesen (Oberfläche, Karte): legt kein Feld an. */
export const besatzungLesen = (w: World): BesatzungsGebiet[] => w.spiel?.besatzung ?? [];

/** Verwalten Stellvertreter die Sicherheitszone? Dort, wo der Schauplatz verbündete Kämpfer vor Ort kennt (Nordsyrien, Nordirak). */
export function mitStellvertretern(b: Pick<BesatzungsGebiet, "land" | "form">): boolean {
  return b.form === "zone" && !!SCHAUPLATZ_NACH_LAND[b.land]?.stellvertreter;
}

/** Was ein Friedenspaket je Region verlangt, als Form: „halten“ heißt Sicherheitszone, „abtretung“ Annexion per Vertrag. */
export function wahlAusForderung(x: string | undefined): BesatzungsWahl | undefined {
  if (!x) return undefined;
  if (x === "halten" || x === "sicherheitszone" || x === "pufferzone") return "zone";
  if (x === "verwaltung") return "zivil";
  if (x === "abtretung") return "annexion";
  if (x === "rueckgabe" || (FORMEN as string[]).includes(x)) return x as BesatzungsWahl;
  return undefined;
}

/** Die Türkei hat den Krieg selbst begonnen (wie `tuerkeiBeginnt` in sim/krieg.ts, ohne dessen Ladekette). */
const tuerkeiBegann = (k: KriegVorgang): boolean => !(k.rahmung === "verteidigung" && !k.rahmungDuenn) && k.rahmung !== "beistand";

/**
 * Nach einem Frieden mit Gebietsgewinn (Paket mit `gebiet` = 1): Was die Türkei hält, wird besetzt, je Region in der Form, die das Paket
 * festlegt (sonst Sicherheitszone). Hält sie nichts, wird die erste Region des Zielraums zur Zone (der frühere Sinn des Pakets). Ohne
 * Gebietsgewinn kehren eingefrorene Linien zurück, und was der Gegner im Krieg zurückerobert hat, ist verloren (Befund A6).
 * Rückgabe: die Namen der besetzten Regionen (für den Friedenstext).
 *
 * Welle 3, K1: Ein Paket mit `forderungen` hält genau die Regionen mit einer haltenden Forderung. Mit `grundlage` „linie“ (eingefrorener
 * Konflikt ohne Vertrag) bleibt nur, was die Front tatsächlich hält, und nichts wird ersatzweise besetzt.
 */
export function besatzungNachFrieden(
  w: World,
  k: KriegVorgang,
  gebiet: -1 | 0 | 1,
  opts: { forderungen?: Record<string, string>; formen?: Record<string, BesatzungsWahl>; grundlage?: "vertrag" | "linie" } = {},
): string[] {
  const lage = k.regionen ?? {};
  const out: string[] = [];
  const grundlage = opts.grundlage ?? "vertrag";
  const wahl = (id: string): BesatzungsWahl | undefined => opts.formen?.[id] ?? wahlAusForderung(opts.forderungen?.[id]);
  // Was der Gegner im Krieg zurückerobert hat, gehört ihm wieder (Revanche, Befund A6)
  for (const b of [...besatzung(w)]) if (b.land === k.land && lage[b.region] === "gegner") regionAufgeben(w, b, "rueckeroberung");
  if (gebiet === 1) {
    const gehalten = zielRegionen(k).filter((r) => lage[r.id] === "eigen").map((r) => r.id);
    // Auch was außerhalb des Zielraums schon besetzt war, zählt als gehalten (regionenSetzen hält es auf „eigen“)
    for (const r of regionenVon(k.land)) if (lage[r.id] === "eigen" && !gehalten.includes(r.id)) gehalten.push(r.id);
    const mitAngabe = !!(opts.forderungen || opts.formen);
    let ids = mitAngabe ? gehalten.filter((id) => { const x = wahl(id); return x !== undefined && x !== "rueckgabe"; }) : gehalten;
    if (!ids.length && grundlage === "vertrag" && !mitAngabe) {
      const erste = zielRegionen(k)[0];
      if (erste) ids = [erste.id];
    }
    // Ausdrücklich zurückgegeben: auch eine schon besetzte Region geht zurück
    if (mitAngabe) for (const b of [...besatzung(w)]) if (b.land === k.land && wahl(b.region) === "rueckgabe") regionAufgeben(w, b, "vertrag");
    for (const id of ids) {
      const form = (wahl(id) ?? "zone") as BesatzungsForm;
      const da = besatzung(w).find((b) => b.region === id);
      if (da) {
        // Eine eingefrorene Linie, die ein Vertrag nun festschreibt
        if (grundlage === "vertrag" && da.grundlage === "linie") delete da.grundlage;
        if (form !== da.form && form !== "zone") formSetzen(w, da, form, { vertrag: grundlage === "vertrag", angriff: tuerkeiBegann(k) });
        continue;
      }
      const b = besatzungAnlegen(w, { region: id, land: k.land, grundlage });
      if (form !== "zone") formSetzen(w, b, form, { vertrag: grundlage === "vertrag", angriff: tuerkeiBegann(k) });
      out.push(t(`krieg.region.${id}`));
    }
  }
  if (gebiet !== 1 && grundlage === "vertrag") {
    // Ein Frieden ohne Gebiet gibt auch eine eingefrorene Linie zurück
    w.spiel!.besatzung = besatzung(w).filter((b) => !(b.land === k.land && b.grundlage === "linie"));
  }
  const jetzt = besatzung(w);
  k.regionen = Object.fromEntries(regionenVon(k.land).map((r) => [r.id, jetzt.some((b) => b.region === r.id) ? "eigen" : "gegner"] as const));
  k.bedroht = [];
  return out;
}

/** Eine Region neu besetzen (Form Sicherheitszone). Ist sie schon besetzt, bleibt der Eintrag. */
export function besatzungAnlegen(w: World, x: { region: string; land: string; grundlage?: "vertrag" | "linie"; seit?: number }): BesatzungsGebiet {
  const liste = besatzung(w);
  const da = liste.find((b) => b.region === x.region);
  if (da) return da;
  const b: BesatzungsGebiet = { region: x.region, land: x.land, seit: x.seit ?? w.day, form: "zone", widerstand: BESATZUNG.widerstandStart, aufstand: 0, ...(x.grundlage === "linie" ? { grundlage: "linie" as const } : {}) };
  liste.push(b);
  return b;
}

/** Die Form setzen und ihre Sofortfolgen buchen (ohne Kapital: das zahlt der Aufrufer). */
function formSetzen(w: World, b: BesatzungsGebiet, ziel: BesatzungsForm, opts: { vertrag?: boolean; angriff?: boolean } = {}): void {
  const vorher = b.form;
  b.form = ziel;
  b.formSeit = w.day;
  if (ziel === "annexion") {
    annektiere(w, b, opts);
    return;
  }
  if (vorher === "annexion") provinzVerloren(w, b, "formwechsel");
  const a = FORM[ziel].ansehenWechsel;
  if (a) wirke(w, "ansehen", a);
  if (ziel === "satellit") satellitAusrufen(w, b);
}

/** Eine Region aufgeben: Rückgabe per Vertrag, Rückeroberung im Krieg oder Aufstand. Eine Provinz geht dabei verloren. */
export function regionAufgeben(w: World, b: BesatzungsGebiet, grund: "vertrag" | "rueckeroberung" | "aufstand" | "rueckgabe"): void {
  const sp = w.spiel;
  if (!sp) return;
  sp.besatzung = besatzung(w).filter((x) => x !== b);
  if (b.form === "annexion") provinzVerloren(w, b, grund);
}

// ---------------------------------------------------------------------------
// Der Monat einer Region: dieselbe Rechnung für Buchung und Vorschau

export interface MonatsWerte {
  /** Kosten in % des BIP (Sicherheit und Dienste, ohne die Steuern einer Provinz) */
  kosten: number;
  /** Steuern einer annektierten Provinz in % des BIP */
  einnahmen: number;
  widerstand: number;
  ansehen: number;
  /** Zurückgekehrte Geflüchtete in diesem Monat (Personen) */
  rueckkehr: number;
}

export interface FormLage {
  region: string;
  land: string;
  form: BesatzungsForm;
  widerstand: number;
  /** Eingliederungsgrad 0 bis 1 (nur Annexion) */
  grad?: number;
}

function konfliktMit(w: World, landId: string): number {
  return landSicht(w, landId)?.konflikt ?? 50;
}

/** Wohin der Widerstand strebt: Form, Gelände, Lage mit dem Land; Stellvertreter reizen mehr, eine eingegliederte Provinz weniger. */
export function widerstandZiel(w: World, x: FormLage): number {
  const r = REGION_NACH_ID[x.region];
  let ziel = FORM[x.form].widerstandZiel + (r ? GELAENDE_WIDERSTAND[r.gelaende] : 0) + 0.2 * (konfliktMit(w, x.land) - 50);
  // Stellvertreter: Plünderung und Lösegeld treiben Widerstand (HRW 29.02.2024); Spielparameter +5
  if (mitStellvertretern(x)) ziel += 5;
  // Eine Provinz, die sich eingliedert, beruhigt sich bis zur Hälfte ihres Ziels (Spielparameter)
  if (x.form === "annexion" && x.grad !== undefined) ziel *= 1 - 0.5 * x.grad;
  return clamp(ziel, 0, 100);
}

/** Einwohner der Region (Daten K2); fehlt die Zahl, zählt sie wie eine leere Region (keine Dienste, keine Rückkehr). */
const einwohnerVon = (r: Region | undefined): number => r?.einwohner?.zahl ?? 0;

/**
 * Ein Monat einer Region in einer Form. `rueckkehrFrei` ist, was im Monat noch unter der belegten Obergrenze RUECKKEHR_MAX liegt.
 * Rechnet nur, bucht nichts.
 */
export function monatsWerte(w: World, x: FormLage, rueckkehrFrei = RUECKKEHR_MAX): MonatsWerte {
  const f = FORM[x.form];
  const r = REGION_NACH_ID[x.region];
  const anteil = einwohnerAnteil(einwohnerVon(r));
  // Dienste: je Einwohner ein Anteil des türkischen BIP je Kopf im Jahr; eine eingegliederte Provinz trägt die Hälfte selbst (Spielparameter)
  const dienstFaktor = x.form === "annexion" && x.grad !== undefined ? 1 - 0.5 * x.grad : 1;
  const dienst = (f.dienstJeKopf * anteil * 100 * dienstFaktor) / 12;
  const oel = r?.ressource === "oel" ? BESATZUNG.oelErtrag : 0;
  const kostenM = f.sicherheitMonat + dienst - oel;
  const einnahmen = x.form === "annexion" ? einnahmenMonat(x.land, einwohnerVon(r), x.grad ?? 0) : 0;
  const ziel = widerstandZiel(w, x);
  const widerstand = r1(clamp(x.widerstand + BESATZUNG.tempo * (ziel - x.widerstand), 0, 100));
  const rueckkehr = x.land === "SYR" ? Math.round(Math.min(rueckkehrFrei, f.rueckkehrMonat * (1 - widerstand / 100))) : 0;
  return { kosten: kostenM, einnahmen, widerstand, ansehen: f.ansehenMonat, rueckkehr };
}

export interface KurvenPunkt {
  monat: number;
  /** Summen ab heute: Kosten und Steuern in % des BIP, Ansehen in Punkten, Rückkehr in Personen */
  kosten: number;
  einnahmen: number;
  ansehen: number;
  rueckkehr: number;
  widerstand: number;
}

/**
 * Drei Jahre einer Form für eine Region bei heutiger Lage (Konflikt mit dem Land bleibt wie heute): Kosten, Widerstand, Ansehen, Rückkehr.
 * Monat 0 enthält den Sofortpreis des Wechsels beim Ansehen. Bucht nichts.
 */
export function formKurve(w: World, regionId: string, form: BesatzungsForm, monate = 36): KurvenPunkt[] {
  const b = besatzungLesen(w).find((x) => x.region === regionId);
  const r = REGION_NACH_ID[regionId];
  if (!b || !r) return [];
  const p = neueProvinzVon(w, regionId);
  const vor = form === "annexion" && b.form !== "annexion" ? annexionVorschau(w, b) : undefined;
  let widerstand = b.widerstand + (vor ? vor.widerstandSprung : 0);
  const wechsel = b.form === form ? 0 : form === "annexion" ? (vor?.ansehen ?? FORM.annexion.ansehenWechsel) : FORM[form].ansehenWechsel;
  const out: KurvenPunkt[] = [{ monat: 0, kosten: 0, einnahmen: 0, ansehen: wechsel, rueckkehr: 0, widerstand: r1(widerstand) }];
  let kostenS = 0, einnahmenS = 0, ansehenS = wechsel, rueckS = 0;
  for (let m = 1; m <= monate; m++) {
    const grad = form !== "annexion" ? undefined : p ? eingliederungsGrad(w, p, w.day + 30 * m) : vor ? Math.min(1, (30 * m) / Math.max(1, vor.eingliederungTage)) : 0;
    const x = monatsWerte(w, { region: regionId, land: b.land, form, widerstand, ...(grad !== undefined ? { grad } : {}) });
    widerstand = x.widerstand;
    kostenS += x.kosten;
    einnahmenS += x.einnahmen;
    ansehenS += x.ansehen;
    rueckS += x.rueckkehr;
    out.push({ monat: m, kosten: kostenS, einnahmen: einnahmenS, ansehen: ansehenS, rueckkehr: rueckS, widerstand });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Sicht für Akte und Karte

export interface BesatzungsSicht extends BesatzungsGebiet {
  kostenMonat: number;
  einnahmenMonat: number;
  widerstandZiel: number;
  gelaende: Gelaende;
  ressource?: Region["ressource"];
  einwohner: number;
  stellvertreter: boolean;
}

function lageVon(w: World, b: BesatzungsGebiet): FormLage {
  const p = b.form === "annexion" ? neueProvinzVon(w, b.region) : undefined;
  return { region: b.region, land: b.land, form: b.form, widerstand: b.widerstand, ...(p ? { grad: eingliederungsGrad(w, p, w.day) } : {}) };
}

export function besatzungsSicht(w: World): BesatzungsSicht[] {
  return besatzungLesen(w).map((b) => {
    const r = REGION_NACH_ID[b.region];
    const x = monatsWerte(w, lageVon(w, b));
    return {
      ...b,
      kostenMonat: r1(x.kosten * 1000) / 1000,
      einnahmenMonat: Math.round(x.einnahmen * 10000) / 10000,
      widerstandZiel: Math.round(widerstandZiel(w, lageVon(w, b))),
      gelaende: r?.gelaende ?? "ebene",
      einwohner: einwohnerVon(r),
      stellvertreter: mitStellvertretern(b),
      ...(r?.ressource ? { ressource: r.ressource } : {}),
    };
  });
}

/** Preis eines Wechsels in Kapital (Rückgabe kostet keins). */
export const wechselPk = (ziel: BesatzungsWahl): number => (ziel === "rueckgabe" ? 0 : FORM[ziel].pk);

/** Die Form einer Besatzung ändern (Zone, Zivilverwaltung, Satellitenstaat, Annexion) oder die Region zurückgeben. */
export function aendereBesatzung(w: World, regionId: string, ziel: BesatzungsWahl | "pufferzone" | "verwaltung"): { ok: boolean; text: string } {
  const sp = w.spiel;
  const b = besatzung(w).find((x) => x.region === regionId);
  if (!sp || !b) return { ok: false, text: t("krieg.besatzung.unbekannt") };
  const z: BesatzungsWahl = (ALTE_FORM[ziel] ?? ziel) as BesatzungsWahl;
  const name = t(`krieg.region.${regionId}`);
  const l = land(b.land);
  if (z === "rueckgabe") {
    const warProvinz = b.form === "annexion";
    regionAufgeben(w, b, "rueckgabe");
    landAendern(w, b.land, { vertrauen: 8, konflikt: -10 }, t("krieg.besatzung.grund_rueckgabe", { region: name }));
    wirke(w, "ansehen", 2);
    wirke(w, "nationalisten", warProvinz ? -6 : -3);
    const text = t("krieg.besatzung.zurueck", { region: name, land: l.name });
    addLog(w, "entscheidung", text, t("krieg.besatzung.zurueck_why"));
    return { ok: true, text };
  }
  if (b.form === z) return { ok: false, text: t("krieg.besatzung.schon") };
  if (b.form === "annexion") return { ok: false, text: t("welle_k5.fehler.provinz") };
  if (b.grundlage === "linie" && (z === "annexion" || z === "satellit")) return { ok: false, text: t("welle_k5.fehler.linie") };
  const pk = wechselPk(z);
  if (!kannZahlen(sp.kapital, pk)) return { ok: false, text: t("krieg.besatzung.kapital", { pk }) };
  sp.kapital -= pk;
  formSetzen(w, b, z);
  const text = t(`welle_k5.gesetzt.${z}`, { region: name, land: l.name });
  addLog(w, "entscheidung", text, t(`welle_k5.form.${z}.kurz`));
  return { ok: true, text };
}

/** Monatlich: Kosten, Steuern, Widerstand, Anschläge, Aufstand, Ansehen und die Rückkehr von Geflüchteten. */
export function besatzungMonat(w: World): void {
  const sp = w.spiel;
  if (!sp?.besatzung?.length) return;
  let summe = 0;
  let rueckFrei = RUECKKEHR_MAX;
  for (const b of [...sp.besatzung]) {
    const x = monatsWerte(w, lageVon(w, b), rueckFrei);
    summe += x.kosten - x.einnahmen;
    b.widerstand = x.widerstand;
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
    if (x.ansehen) wirke(w, "ansehen", x.ansehen);
    if (x.rueckkehr > 0) {
      const a = aussenZustand(w);
      const mio = Math.min(x.rueckkehr / 1e6, Math.max(0, a.flucht.bestand - 0.2));
      if (mio > 0) {
        a.flucht.bestand = Math.round((a.flucht.bestand - mio) * 1e4) / 1e4;
        b.rueckkehr = (b.rueckkehr ?? 0) + Math.round(mio * 1e6);
        rueckFrei -= Math.round(mio * 1e6);
      }
    }
    b.aufstand = b.widerstand >= BESATZUNG.aufstand ? b.aufstand + 1 : 0;
    if (b.aufstand >= 3) {
      regionAufgeben(w, b, "aufstand");
      wirke(w, "nationalisten", -2);
      wirke(w, "truppenmoral", -2);
      sp.hinweise.push({ id: `krieg-besatzung-aufstand-${b.region}-${w.day}`, titel: t("krieg.besatzung.aufstand_titel", { region: name }), text: [t("krieg.besatzung.aufstand_text", { region: name })], szene: "istanbul" });
      addLog(w, "ereignis", t("krieg.besatzung.aufstand_titel", { region: name }), "");
    }
  }
  if (summe !== 0) kosten(w, summe);
}

/** Summe je Monat über alle Regionen (für den Haushalt): Kosten und Steuern in % des BIP; dieselbe Rechnung wie die Buchung. */
export function besatzungHaushalt(w: World): { kosten: number; einnahmen: number; regionen: number; provinzen: number } {
  let kostenS = 0, einnahmenS = 0, provinzen = 0;
  for (const b of besatzungLesen(w)) {
    const x = monatsWerte(w, lageVon(w, b));
    kostenS += x.kosten;
    einnahmenS += x.einnahmen;
    if (b.form === "annexion") provinzen += 1;
  }
  return { kosten: kostenS, einnahmen: einnahmenS, regionen: besatzungLesen(w).length, provinzen };
}

// ---------------------------------------------------------------------------
// Revanche (Befund A6): Ein späterer Krieg mit demselben Land beginnt mit den Regionen auf türkischer Seite; ist der Gegner im Vorteil,
// zielt er zuerst auf ihre Rückeroberung, bevor er türkische Provinzen bedroht.

/**
 * Wie viele der gehaltenen Regionen der Gegner bei dieser Frontlage zurückgenommen hat: Unter `ab` beginnt die Rückeroberung, `spanne` Punkte
 * tiefer ist alles zurück. sim/kriegsschauplatz.ts gibt dieselbe Schwelle und Spanne wie für die Bedrohung der Grenzprovinzen mit: Erst wenn
 * nichts mehr gehalten wird, sind türkische Provinzen bedroht. Zuerst fällt, was am tiefsten im Land des Gegners liegt. Ändert `lage` an Ort und
 * Stelle; Rückgabe: ob noch etwas gehalten wird.
 */
export function revancheLage(w: World, k: KriegVorgang, lage: Record<string, RegionLage>, ab: number, spanne: number): boolean {
  const gehalten = besatzungLesen(w).filter((b) => b.land === k.land && lage[b.region] !== undefined);
  if (!gehalten.length) return false;
  for (const b of gehalten) lage[b.region] = "eigen";
  if (k.phase !== "krieg" || k.front >= ab) return true;
  const anteil = clamp((ab - k.front) / spanne, 0, 1);
  const tief = [...gehalten].sort((a, b) => (REGION_NACH_ID[b.region]?.tiefe ?? 1) - (REGION_NACH_ID[a.region]?.tiefe ?? 1));
  const verloren = Math.floor(anteil * tief.length + 1e-9);
  tief.slice(0, verloren).forEach((b) => (lage[b.region] = "gegner"));
  if (verloren < tief.length) lage[tief[verloren]!.region] = "umkaempft";
  return verloren < tief.length;
}

/** Das Ziel einer Revanche: die gehaltenen Regionen des Landes, annektierte zuerst (für die Akte). */
export function revancheZiel(w: World, landId: string): string[] {
  return besatzungLesen(w).filter((b) => b.land === landId).sort((a, b) => Number(b.form === "annexion") - Number(a.form === "annexion")).map((b) => b.region);
}

// ---------------------------------------------------------------------------
// Ältere Spielstände

/**
 * Welle 3, K5: Die Formen heißen jetzt „zone“ und „zivil“ statt „pufferzone“ und „verwaltung“. Nur umbenennen, nichts anlegen: Der geladene
 * Stand gleicht dem gespeicherten Feld für Feld.
 */
export function migriereBesatzung(w: World): void {
  for (const b of w.spiel?.besatzung ?? []) {
    const neu = ALTE_FORM[b.form as string];
    if (neu) b.form = neu;
  }
}

/**
 * Ältere Spielstände (Welle 3, K1): Ein eingefrorener Konflikt warf früher alle gehaltenen Regionen weg, ließ sie aber im Vorgang als
 * „eigen“ stehen (Spielstand 2045 des Inhabers: Lesbos, Chios, Kos und Alexandroupoli nach dem Einfrieren mit Griechenland). Beim Laden
 * werden sie zur De-facto-Linie, wie es das Einfrieren jetzt tut, sofern kein späterer Vorgang mit demselben Land sie neu geordnet hat.
 */
export function migriereEingefroreneLinien(w: World): void {
  migriereBesatzung(w);
  const sp = w.spiel;
  if (!sp?.kriege?.length) return;
  // Nur lesen, bis wirklich eine Linie zurückkommt: Laden legt sonst ein leeres Feld an, und der geladene Stand gliche dem gespeicherten nicht mehr
  const liste = sp.besatzung ?? [];
  const vorher = liste.length;
  for (const k of sp.kriege) {
    if (k.ausgang !== "eingefroren" || !k.regionen) continue;
    if (sp.kriege.some((x) => x !== k && x.land === k.land && x.seit > k.seit)) continue;
    for (const [id, lage] of Object.entries(k.regionen)) {
      if (lage !== "eigen" || !REGION_NACH_ID[id] || liste.some((b) => b.region === id)) continue;
      liste.push({ region: id, land: k.land, seit: k.seit, form: "zone", widerstand: BESATZUNG.widerstandStart, aufstand: 0, grundlage: "linie" });
    }
  }
  if (liste.length > vorher) sp.besatzung = liste;
}

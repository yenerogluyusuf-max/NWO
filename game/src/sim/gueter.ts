// Eine Mengenbilanz für zivile Versorgung, Handelszahlungen und militärischen Treibstoff.
// Vorschau und Monatsabschluss rechnen identisch; Vorprodukte wirken im Folgemonat.
import { GUETER, GUT_NACH_ID, RESERVE_KOSTEN, type GutDef, type GutId } from "../data/gueter";
import { NET } from "./modell";
import { nationalAverage, startAverage } from "./netz";
import { wirke } from "./wirkung";
import { kosten } from "./ereignis-hilfen";
import { kannZahlen } from "./kapital";
import { aussenZustand } from "./diplomatie";
import { addLog } from "./log";
import { akteurName } from "./welt-modell";
import { t } from "../i18n";
import { werkZusatz } from "./wissensbaum-kern";
import type { World } from "./types";
import { transportPlan, regionalVerteilen, transportAbschluss, frontBedarf, HUB_PROVINZEN, type TransportPlan } from "./transport";
import { produktionsVersorgung, WAREN_PREIS, type WarenFluss, type VersorgungsBilanz, type VersorgungsPrioritaet } from "./versorgung";
import { regierungsProgramm, SCHUTZ_GUETER, energiePartnerGrund, beschliesseVersorgungsKurs, versorgungsPolitikAbschluss, type VersorgungsRegierung } from "./versorgungspolitik";
import { versorgungsNachweis } from "./versorgungsbericht";
import { bipUsdMrd } from "./staatsgeld";

export interface GueterZustand {
  v: 1;
  /** Alte Bestände bleiben erhalten. Neue Lieferaufträge entstehen erst durch Spielerhandlungen. */
  auftraege?: { gut: GutId; rest: number; abTag: number }[];
  quelleAbTag?: Partial<Record<GutId, number>>;
  prioritaet?: VersorgungsPrioritaet;
  regierung?: VersorgungsRegierung;
  bilanz?: VersorgungsBilanz;
  monat: string;
  /** Lager in der Einheit der Gruppe */
  lager: Partial<Record<GutId, number>>;
  ausfuhrStopp: GutId[];
  /** Ausfuhrförderung läuft bis zu diesem Tag */
  foerderungBis: Partial<Record<GutId, number>>;
  /** Einfuhrquelle gewechselt: halbiert den blockierten Anteil */
  quelleGewechselt: GutId[];
  /** Altes Speicherformat; wird nicht mehr zur Abschwächung von Lieferausfällen verwendet. */
  basis?: Partial<Record<GutId, number>>;
  /** Anpassung des Zielvorrats gegenüber dem üblichen Lagerstand; bei Freigabe auch negativ. */
  reserve?: Partial<Record<GutId, number>>;
  /** Altes Speicherformat; Umleitungen brauchen jetzt eine ausdrückliche Handlung. */
  dauer?: Partial<Record<GutId, number>>;
  /** Letzte 24 Monate: Autarkiegrad je Gruppe */
  verlauf: { monat: string; autarkie: Partial<Record<GutId, number>> }[];
}

export interface GutSicht {
  def: GutDef;
  fluss: WarenFluss;
  letzteBilanz?: WarenFluss;
  produktion: number;
  verbrauch: number;
  einfuhr: number;
  ausfuhr: number;
  lager: number;
  lagerMonate: number;
  /** Eigenversorgung in Prozent (Produktion zu Verbrauch, höchstens 100) */
  autarkie: number;
  /** Anteil der Einfuhr, der gerade ausfällt (0 bis 1) */
  blockiert: number;
  /** Ausfall über der Ausgangslage (0 bis 1): ihn muss das Lager decken */
  zusatz: number;
  /** Fehlmenge in Prozent des Monatsverbrauchs nach Lager */
  fehlProzent: number;
  /** Wie viele Tage das Lager reicht, wenn alle Einfuhren ausfallen (Infinity ohne nennenswerte Einfuhr) */
  reichweiteTage: number;
  /** Wie viele Tage das Lager beim jetzigen Ausfall reicht (Infinity ohne Ausfall) */
  reichweiteJetzt: number;
  /** Kriegsampel: rot unter 30, gelb unter 90 Tagen; „keine“, wo die Einfuhr kaum zählt */
  ampel: "gruen" | "gelb" | "rot" | "keine";
  ausfuhrStopp: boolean;
  foerderung: boolean;
  quelleGewechselt: boolean;
  /** Ein Satz zur Lage */
  satz: string;
}

/** Spielparameter */
export const GUETER_REGELN = {
  pkReserve: 2,
  pkFreigabe: 1,
  pkFoerderung: 3,
  pkStopp: 2,
  pkQuelle: 3,
  /** Förderung wirkt so viele Tage */
  foerderTage: 365,
  /** Kosten eines Quellenwechsels in % des BIP (teurere Lieferanten) */
  quelleKosten: 0.03,
  foerderKosten: 0.04,
  lieferTage: 30,
  umleitAufpreis: 0.15,
  /** Grenzen der Kriegsampel in Tagen Lagerreichweite (Idee aus RECHERCHE_GLM_3, 5.1) */
  ampelRot: 30,
  ampelGelb: 90,
};

export function gueterZustand(w: World): GueterZustand {
  const sp = w.spiel!;
  if (!sp.gueter) {
    const lager: Partial<Record<GutId, number>> = {};
    for (const g of GUETER) lager[g.id] = (g.verbrauch / 12) * g.lagerMonate;
    sp.gueter = { v: 1, monat: "", lager, ausfuhrStopp: [], foerderungBis: {}, quelleGewechselt: [], verlauf: [] };
  }
  return sp.gueter;
}

const stoss = (w: World, id: string, d: number): void => {
  if (NET.index.has(id) && d !== 0) wirke(w, id, d);
};

function verhaeltnis(w: World, knoten: string): number {
  if (!NET.index.has(knoten)) return 1;
  const jetzt = nationalAverage(NET, w.net, knoten);
  const start = startAverage(NET, w.net, knoten);
  return start > 0.5 ? jetzt / start : 1;
}

function faktor(w: World, treiber: { knoten: string; elastizitaet: number }[] | undefined): number {
  let f = 1;
  for (const tr of treiber ?? []) f *= 1 + tr.elastizitaet * (verhaeltnis(w, tr.knoten) - 1);
  return Math.max(0.2, Math.min(2, f));
}

const begrenze = (x: number): number => Math.max(0, Math.min(1, x));
const EU_LAENDER = new Set(["EU", "DEU", "FRA", "ITA", "ESP", "GRC", "BGR", "ROU", "POL", "CYP"]);

function lieferWege(w: World, g: GutDef): WarenFluss["wege"] {
  const a = aussenZustand(w);
  const krieg = new Set((w.spiel?.kriege ?? []).filter(k => k.phase === "krieg" || k.phase === "waffenruhe").map(k => k.land));
  const an = a.energie.anteile;
  const importAnteil = Math.max(1, 100 - an.HEIM);
  const lieferanten = g.id === "erdgas" ? [
    { land: "RUS", anteil: an.RUS / importAnteil * 100 },
    { land: "AZE", anteil: an.AZE / importAnteil * 100 },
    { land: "IRN", anteil: an.IRN / importAnteil * 100 },
    { land: "USA", anteil: an.LNG / importAnteil * 50 },
  ] : g.lieferanten;
  return lieferanten.map(l => {
    // CAATSA trifft Rüstung/Elektronik, kein pauschales Embargo auf Nahrung oder Gas.
    const sanktion = a.eigeneSanktionen.includes(l.land) || a.sanktionen.some(s =>
      (s.von === l.land || s.von === "EU" && EU_LAENDER.has(l.land)) &&
      (s.id !== "caatsa" || g.id === "elektronik" || g.id === "ruestung"));
    const grund = krieg.has(l.land) ? "krieg" : sanktion ? "sanktion" : "offen";
    return { ...l, verfuegbar: grund === "offen" ? 1 : 0, grund };
  });
}

/** Gegenüber der Startauslastung: Ausbau hilft, Schäden/Überlast begrenzen den Umschlag.
 * Pipelines und lokale Wasserversorgung benutzen nicht pauschal den Hafen. */
function transportFaktor(w: World, g: GutDef): number {
  if (g.id === "wasser" || g.id === "strom" || g.id === "ruestung") return 1;
  const h = w.spiel?.infrastruktur?.netze.hafen;
  if (!h) return 1;
  const kap = h.kap[0] ?? 1;
  const nachfrage = h.nachfrage[0] ?? 1;
  const start = h.start[0] ?? 1;
  const hafen = begrenze(kap * start / Math.max(0.01, nachfrage));
  const seeAnteil = g.id === "erdgas" ? 0.3 : g.id === "erdoel" ? 0.7 : 0.85;
  return 1 - seeAnteil * (1 - hafen);
}

/** Vorschau und Ausführung verwenden dieselbe Mengenrechnung. Alle Flüsse sind Monatsmengen. */
function sichtVon(w: World, z: GueterZustand, g: GutDef, plan: TransportPlan): GutSicht {
  const schutz = !!regierungsProgramm(w, "schutz");
  const produktionsFaktor = produktionsVersorgung(w, g.id) * (schutz && ["stahl", "elektronik", "duenger"].includes(g.id) ? 0.95 : 1);
  const produktion = g.produktion * faktor(w, g.produktionTreiber) * (1 + werkZusatz(w, g.id)) * produktionsFaktor;
  const verbrauch = g.verbrauch * faktor(w, g.verbrauchTreiber) * (schutz && ["erdgas", "erdoel"].includes(g.id) ? 0.9 : 1);
  const stopp = z.ausfuhrStopp.includes(g.id) || schutz && SCHUTZ_GUETER.includes(g.id);
  const foerderung = (z.foerderungBis[g.id] ?? -1) >= w.day;
  const kundenAusfall = g.kunden.length ? lieferWege(w, { ...g, id: g.id === "erdgas" ? "erdoel" : g.id, lieferanten: g.kunden.map(land => ({ land, anteil: 100 / g.kunden.length })) }).reduce((n, l) => n + l.anteil / 100 * (1 - l.verfuegbar), 0) : 0;
  const ausfuhr = stopp ? 0 : (1 - kundenAusfall) * g.ausfuhr * (produktion / Math.max(1e-9, g.produktion)) * (foerderung ? 1.15 : 1);
  const gewechselt = z.quelleGewechselt.includes(g.id) && w.day >= (z.quelleAbTag?.[g.id] ?? 0);
  const wege = lieferWege(w, g);
  const landAusfall = wege.reduce((n, l) => n + l.anteil / 100 * (1 - l.verfuegbar), 0);
  const h = aussenZustand(w).energie.hormus;
  const hormus = (g.hormusAnteil ?? 0) * (h === "geschlossen" ? 1 : h === "gestoert" ? 0.4 : 0);
  const transport = transportFaktor(w, g);
  const ursprungsAusfall = 1 - (1 - landAusfall) * (1 - hormus);
  const blockiert = begrenze(1 - (1 - ursprungsAusfall * (gewechselt ? 0.5 : 1)) * transport);
  const lager = Math.max(0, z.lager[g.id] ?? 0);
  const bedarf = verbrauch / 12;
  // Einsatzverbrauch zusätzlich zur normalen zivilen Nachfrage; Waffenruhe bleibt versorgungspflichtig.
  const militaerBedarf = g.id === "erdoel" ? frontBedarf(w) : 0;
  const exportSoll = ausfuhr / 12;
  const auffuellen = g.lagerMonate > 0 ? Math.max(0, lagerSoll(z, g) - lager) / 6 : 0;
  const normalImport = Math.max(0, g.verbrauch + g.ausfuhr - g.produktion) / 12;
  // Ausweichimporte benötigen bestehende Umschlags- und Lieferkapazität; keine unendliche Weltmarktquelle.
  const kapazitaet = g.lieferanten.length ? normalImport * 1.2 + g.verbrauch / 12 * 0.05 : 0;
  const bestellt = Math.min(kapazitaet, Math.max(0, bedarf + militaerBedarf + exportSoll + auffuellen - produktion / 12));
  const regulaer = bestellt * (1 - blockiert);
  const auftrag = z.auftraege?.find(o => o.gut === g.id && o.abTag <= w.day);
  const reserveLieferung = Math.min(auftrag?.rest ?? 0, Math.max(0, kapazitaet - bestellt) * (1 - blockiert));
  const abkommen = g.id === "erdgas" ? regierungsProgramm(w, "energie") : undefined;
  const partner = abkommen?.partner;
  // Zusatzvertrag schließt nur die verbleibende Beschaffungslücke. Bestand wird nicht verschenkt.
  // AZE kommt über die Ostpipeline, US-LNG über See; beide bleiben regional transportpflichtig.
  const zusatz = partner && !energiePartnerGrund(w, partner) ? Math.min(g.verbrauch / 12 * 0.2,
    Math.max(0, bedarf + militaerBedarf + exportSoll + auffuellen - produktion / 12 - regulaer - reserveLieferung)) * (partner === "USA" ? transport : 1) : 0;
  const importiert = regulaer + reserveLieferung + zusatz;
  let verfuegbar = lager + produktion / 12 + importiert;
  let geliefert: number;
  let militaerGeliefert: number;
  if (z.prioritaet === "militaer") {
    militaerGeliefert = Math.min(militaerBedarf, verfuegbar);
    geliefert = Math.min(bedarf, verfuegbar - militaerGeliefert);
  } else if (z.prioritaet === "zivil") {
    geliefert = Math.min(bedarf, verfuegbar);
    militaerGeliefert = Math.min(militaerBedarf, verfuegbar - geliefert);
  } else {
    const anteil = bedarf + militaerBedarf > 0 ? Math.min(1, verfuegbar / (bedarf + militaerBedarf)) : 1;
    geliefert = bedarf * anteil;
    militaerGeliefert = militaerBedarf * anteil;
  }
  verfuegbar -= geliefert + militaerGeliefert;
  const exportiert = Math.min(exportSoll * transport, Math.max(0, verfuegbar));
  verfuegbar -= exportiert;
  // Strom lässt sich ohne Speicher nicht in den nächsten Monat übertragen.
  const verlust = g.id === "strom" ? Math.max(0, verfuegbar) : 0;
  const ende = Math.max(0, verfuegbar - verlust);
  const fehl = Math.max(0, bedarf - geliefert);
  const preis = WAREN_PREIS[g.id];
  const importUsdMrd = (regulaer + reserveLieferung) * preis * (1 + (gewechselt ? ursprungsAusfall * GUETER_REGELN.umleitAufpreis : 0)) + zusatz * preis * 1.2;
  const exportUsdMrd = exportiert * preis;
  const handelsDeltaUsdMrd = exportUsdMrd - importUsdMrd - (g.ausfuhr / 12 - normalImport) * preis;
  let fluss: WarenFluss = { anfang: lager, produktion: produktion / 12, produktionsFaktor, bestellt: bestellt + zusatz,
    importiert, reserveLieferung, exportiert, exportSoll, bedarf, geliefert, militaerBedarf, militaerGeliefert,
    ende, verlust, fehl, transport, hormus, wege, importUsdMrd, exportUsdMrd, handelsDeltaUsdMrd,
    ...(partner ? { zusatzImport: { land: partner, menge: zusatz, aufpreisUsdMrd: zusatz * preis * 0.2 } } : {}) };
  fluss = regionalVerteilen(plan, g, fluss, z.prioritaet ?? "ausgewogen");
  fluss.exportUsdMrd = fluss.exportiert * preis;
  fluss.handelsDeltaUsdMrd = fluss.exportUsdMrd - fluss.importUsdMrd - (g.ausfuhr / 12 - normalImport) * preis;
  const einfuhr = (bestellt + zusatz) * 12;
  const fehlProzent = bedarf > 0 ? fluss.fehl / bedarf * 100 : 0;
  const luecke = Math.max(0, bedarf + militaerBedarf + exportSoll - produktion / 12 - importiert);
  const reichweiteTage = einfuhr > 0 ? lager / (einfuhr / 365) : Infinity;
  const reichweiteJetzt = luecke > 1e-9 ? lager / luecke * 30 : Infinity;
  const zaehlt = g.id !== "ruestung" && (einfuhr > 0.05 * verbrauch || luecke > 0.01);
  const massgeblich = luecke > 0.01 ? reichweiteJetzt : reichweiteTage;
  const ampel = !zaehlt ? "keine" : massgeblich < GUETER_REGELN.ampelRot ? "rot" : massgeblich < GUETER_REGELN.ampelGelb ? "gelb" : "gruen";
  const autarkie = g.id === "ruestung" ? Math.round(nationalAverage(NET, w.net, "ruestungsautarkie")) : verbrauch > 0 ? Math.min(100, produktion / verbrauch * 100) : 100;
  return { def: g, fluss, letzteBilanz: z.bilanz?.waren[g.id], produktion, verbrauch, einfuhr, ausfuhr, lager,
    lagerMonate: bedarf > 0 ? lager / bedarf : 0, autarkie, blockiert, zusatz: blockiert,
    fehlProzent, reichweiteTage, reichweiteJetzt, ampel, ausfuhrStopp: stopp, foerderung, quelleGewechselt: gewechselt,
    satz: satzFuer(g, autarkie, blockiert, fehlProzent) };
}

function satzFuer(g: GutDef, autarkie: number, blockiert: number, fehl: number): string {
  const name = t(`gueter.gut.${g.id}`);
  const haupt = g.lieferanten[0]?.land;
  const land = haupt ? akteurName(haupt) : "";
  if (fehl > 0.5) return t("gueter.satz.fehl", { name, fehl: Math.round(fehl) });
  if (blockiert > 0.05) return t("gueter.satz.lager", { name, anteil: Math.round(blockiert * 100) });
  if (autarkie >= 99.5) return t("gueter.satz.selbst", { name });
  if (haupt) return t("gueter.satz.einfuhr", { name, autarkie: Math.round(autarkie), land });
  return t("gueter.satz.knapp", { name, autarkie: Math.round(autarkie) });
}

/** Die ganze Bilanz in der Reihenfolge von data/gueter.ts */
export function gueterSicht(w: World, plan = transportPlan(w)): GutSicht[] {
  if (!w.spiel) return [];
  const z = gueterZustand(w);
  return GUETER.map((g) => sichtVon(w, z, g, plan));
}

/** Üblicher Lagerstand plus angelegte Reserve */
export function lagerSoll(z: GueterZustand, g: GutDef): number {
  return Math.max(0, (g.verbrauch / 12) * g.lagerMonate + (z.reserve?.[g.id] ?? 0));
}

/** Ein Abschluss je Kalendermonat: dieselben Lieferungen tragen Bestände, Folgen und Außenrechnung. */
export function gueterMonat(w: World): void {
  if (!w.spiel) return;
  const z = gueterZustand(w);
  const monat = w.date.slice(0, 7);
  if (z.monat === monat) return;
  const plan = transportPlan(w);
  const sicht = gueterSicht(w, plan);
  const vorher = z.bilanz;
  const bilanz: VersorgungsBilanz = { monat, tag: w.day, waren: Object.fromEntries(sicht.map(s=>[s.def.id,s.fluss])), handelsDeltaUsdMrd: sicht.reduce((n,s)=>n+s.fluss.handelsDeltaUsdMrd,0) };
  // Vor Bestandsbuchung und Netzwirkungen: jeder Vergleich beginnt mit derselben Monatslage.
  const nachweis=versorgungsNachweis(w,{bilanz,transport:plan.bilanz},kopie=>{
    const alternativPlan=transportPlan(kopie), alternativ=gueterSicht(kopie,alternativPlan);
    return {bilanz:{monat,tag:w.day,waren:Object.fromEntries(alternativ.map(s=>[s.def.id,s.fluss])),handelsDeltaUsdMrd:alternativ.reduce((n,s)=>n+s.fluss.handelsDeltaUsdMrd,0)},transport:alternativPlan.bilanz};
  });
  z.monat = monat;
  for (const s of sicht) {
    const id = s.def.id;
    const f = s.fluss;
    z.lager[id] = f.ende;
    const auftrag = z.auftraege?.find(o => o.gut === id && o.abTag <= w.day);
    if (auftrag && f.reserveLieferung > 0) {
      auftrag.rest = Math.max(0, auftrag.rest - f.reserveLieferung);
      z.reserve ??= {};
      z.reserve[id] = (z.reserve[id] ?? 0) + f.reserveLieferung;
    }
    // Ein einziger physischer Engpasskanal, einschließlich Gas; Diplomatie zeigt dieselbe Bilanz.
    for (const [hub, waren] of Object.entries(plan.bilanz.regionen)) {
      const r = waren[id];
      if (!r || r.bedarf <= 0) continue;
      const fehlt = Math.max(0, 1-r.geliefert/r.bedarf)*100;
      if (fehlt < 0.000001) continue;
      for (const e of s.def.engpass) if(NET.index.has(e.knoten)) wirke(w, e.knoten, e.jeProzent*fehlt*0.1, HUB_PROVINZEN[hub]);
    }
    if (s.fehlProzent >= 5 && (vorher?.waren[id]?.fehl ?? 0) < f.bedarf * 0.05) {
      addLog(w, "ereignis", t("gueter.kette.warnung", { name: t(`gueter.gut.${id}`), fehl: Math.round(s.fehlProzent) }));
    }
  }
  z.auftraege = z.auftraege?.filter(o => o.rest > 1e-8);
  z.bilanz = bilanz;
  transportAbschluss(w, plan);
  versorgungsPolitikAbschluss(w, bilanz, vorher, nachweis);
  // Außenakte und Warenakte zeigen denselben physischen Gasversorgungsgrad.
  const gas = bilanz.waren.erdgas;
  if (gas && gas.bedarf > 0) aussenZustand(w).energie.versorgung = Math.round(gas.geliefert / gas.bedarf * 100);
  // Energiemangel für die Volkswirtschaft (economy.ts Z1/Z2): Anteil des fehlenden Öls und Gases am Bedarf, je zur Hälfte gewichtet.
  // Früher sparte ein Mangel nur Einfuhren; Preise und Produktion blieben fast unberührt (PRUEFUNG_GESAMT_2026-11-04).
  const fehlAnteil = (id: "erdoel" | "erdgas") => { const f = bilanz.waren[id]; return f && f.bedarf > 0 ? Math.max(0, 1 - f.geliefert / f.bedarf) : 0; };
  w.economy.energieMangel = 0.5 * fehlAnteil("erdoel") + 0.5 * fehlAnteil("erdgas");
  z.verlauf.push({ monat, autarkie: Object.fromEntries(sicht.map(s => [s.def.id, Math.round(s.autarkie)])) });
  if (z.verlauf.length > 24) z.verlauf.splice(0, z.verlauf.length - 24);
}

export function setzeVersorgungsPrioritaet(w: World, prioritaet: VersorgungsPrioritaet): void {
  beschliesseVersorgungsKurs(w, prioritaet);
}

// ---------------------------------------------------------------------------
// Instrumente

export type GutInstrument = "reserve" | "freigabe" | "foerderung" | "stopp" | "quelle";

export interface InstrumentVorschau {
  id: GutInstrument;
  moeglich: boolean;
  pk: number;
  /** Kosten in % des BIP */
  bip: number;
  /** Wirkung in einem Satz */
  wirkung: string;
  grund?: string;
}

export function gutInstrumente(w: World, gut: GutId): InstrumentVorschau[] {
  const g = GUT_NACH_ID.get(gut)!;
  const z = gueterZustand(w);
  const kap = w.spiel?.kapital ?? 0;
  const out: InstrumentVorschau[] = [];
  const reserveKosten = !g.lieferanten.length || RESERVE_KOSTEN[gut] === undefined ? undefined :
    WAREN_PREIS[gut] > 0 ? g.verbrauch / 12 * WAREN_PREIS[gut] / bipUsdMrd(w.economy) * 100 : RESERVE_KOSTEN[gut];
  const offen = z.auftraege?.some(o => o.gut === gut && o.rest > 1e-8) ?? false;
  if (reserveKosten !== undefined) {
    out.push({ id: "reserve", moeglich: !offen && kannZahlen(kap, GUETER_REGELN.pkReserve), ...(offen ? { grund: t("gueter.kette.auftragOffen") } : {}), pk: GUETER_REGELN.pkReserve, bip: reserveKosten, wirkung: t("gueter.wirkung.reserve") });
    const hat = lagerSoll(z, g) > g.verbrauch / 12 / 4 && (z.lager[gut] ?? 0) > g.verbrauch / 12 / 4;
    out.push({ id: "freigabe", moeglich: hat && kannZahlen(kap, GUETER_REGELN.pkFreigabe), pk: GUETER_REGELN.pkFreigabe, bip: 0, wirkung: t("gueter.wirkung.freigabe"), ...(hat ? {} : { grund: t("gueter.grund.leer") }) });
  }
  if (g.ausfuhr > 0) {
    const geschuetzt = !!regierungsProgramm(w, "schutz") && SCHUTZ_GUETER.includes(gut);
    const stopp = z.ausfuhrStopp.includes(gut);
    out.push({ id: "foerderung", moeglich: !geschuetzt && !stopp && kannZahlen(kap, GUETER_REGELN.pkFoerderung), pk: GUETER_REGELN.pkFoerderung, bip: GUETER_REGELN.foerderKosten, wirkung: t("gueter.wirkung.foerderung"), ...(geschuetzt ? {grund:t("regierung.schutzBindung")} : {}) });
    out.push({ id: "stopp", moeglich: !geschuetzt && kannZahlen(kap, GUETER_REGELN.pkStopp), pk: GUETER_REGELN.pkStopp, bip: 0, wirkung: t(stopp ? "gueter.wirkung.stopp_aus" : "gueter.wirkung.stopp"), ...(geschuetzt ? {grund:t("regierung.schutzBindung")} : {}) });
  }
  if (g.lieferanten.length && !z.quelleGewechselt.includes(gut)) {
    out.push({ id: "quelle", moeglich: kannZahlen(kap, GUETER_REGELN.pkQuelle), pk: GUETER_REGELN.pkQuelle, bip: GUETER_REGELN.quelleKosten, wirkung: t("gueter.wirkung.quelle") });
  }
  return out;
}

export function fuehreGutInstrumentAus(w: World, gut: GutId, id: GutInstrument): { ok: boolean; text: string } {
  const sp = w.spiel;
  if (!sp) return { ok: false, text: "" };
  const g = GUT_NACH_ID.get(gut)!;
  const iv = gutInstrumente(w, gut).find((x) => x.id === id);
  if (!iv || !iv.moeglich) return { ok: false, text: iv?.grund ?? t("gueter.grund.nicht") };
  const z = gueterZustand(w);
  const name = t(`gueter.gut.${gut}`);
  sp.kapital -= iv.pk;
  if (iv.bip) kosten(w, iv.bip);
  const monat = g.verbrauch / 12;
  let text: string;
  switch (id) {
    case "reserve":
      z.auftraege ??= [];
      z.auftraege.push({ gut, rest: monat, abTag: w.day + GUETER_REGELN.lieferTage });
      text = t("gueter.erg.reserve", { name });
      break;
    case "freigabe": {
      z.reserve ??= {};
      z.reserve[gut] = (z.reserve[gut] ?? 0) - Math.min(monat, lagerSoll(z, g));
      text = t("gueter.erg.freigabe", { name });
      break;
    }
    case "foerderung":
      z.foerderungBis[gut] = w.day + GUETER_REGELN.foerderTage;
      stoss(w, "export", 1);
      text = t("gueter.erg.foerderung", { name });
      break;
    case "stopp": {
      const i = z.ausfuhrStopp.indexOf(gut);
      if (i >= 0) {
        z.ausfuhrStopp.splice(i, 1);
        stoss(w, "export", 0.8);
        text = t("gueter.erg.stopp_aus", { name });
      } else {
        z.ausfuhrStopp.push(gut);
        stoss(w, "export", -0.8);
        stoss(w, "ansehen", -0.5);
        text = t("gueter.erg.stopp", { name });
      }
      break;
    }
    case "quelle":
      z.quelleGewechselt.push(gut);
      z.quelleAbTag ??= {};
      z.quelleAbTag[gut] = w.day + GUETER_REGELN.lieferTage;
      text = t("gueter.erg.quelle", { name });
      break;
  }
  addLog(w, "entscheidung", text);
  return { ok: true, text };
}

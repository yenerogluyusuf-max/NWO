// Der Fokusbaum („Agenda“ wie der Nationale Fokus in HOI 4): die Kurswahl der Regierung in sieben Ästen, ein Fokus zur Zeit.
// Inhalt der Foki: data/fokus/* (Grundbestand) und data/fokus/erweiterungen.ts (Ergänzung); beide bleiben unverändert, hier werden sie
// zusammengeführt und an die Spielwelt angeschlossen: Die frei benannten Wirkungsgrößen der Kataloge werden auf Knoten des Politiknetzes
// abgebildet, Außenwirkungen auf die Hauptakteure, und Foki bereiten Gesetzesvorhaben vor oder beschleunigen Knoten des Wissensbaums.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { ALLE_FOKI, FOKUS_AESTE_META, type FokusAst, type FokusDefinition } from "./fokus";
import { FOKUS_ERWEITERUNGEN } from "./fokus/erweiterungen";

export type { FokusAst, FokusDefinition } from "./fokus";

export const AESTE: FokusAst[] = ["wirtschaft", "aussen", "staat", "gesellschaft", "sicherheit", "regionen", "wissen"];
export const AST_FARBE: Record<FokusAst, string> = Object.fromEntries(AESTE.map((a) => [a, FOKUS_AESTE_META[a].farbe])) as Record<FokusAst, string>;

/** Alle Foki: Grundbestand und Ergänzung. */
export const FOKI: FokusDefinition[] = [...ALLE_FOKI, ...FOKUS_ERWEITERUNGEN];
export const FOKUS_VON: Record<string, FokusDefinition> = Object.fromEntries(FOKI.map((f) => [f.id, f]));

export const FOKUS = {
  /** Faktor von der Katalogzahl einer Wirkung auf Punkte im Politiknetz (die Kataloge rechnen grob in „Prozentpunkten“) */
  skala: 0.35,
  /** Höchster Beitrag eines Fokus auf einen Knoten */
  maxJeKnoten: 5,
  /** Höchster dauerhafter Bestand aller Foki zusammen auf einem Knoten */
  maxBestand: 9,
  /** Faktor auf die Kapitalkosten der Kataloge (sie rechnen 5 bis 25) */
  kapitalFaktor: 0.8,
  /** Wer einen Fokus abbricht, bekommt diesen Anteil des Kapitals zurück */
  abbruchErstattung: 0.25,
  /** Loyalität eines Partners bei voller Übereinstimmung oder vollem Widerspruch zur Richtung eines Fokus */
  partnerLoyalitaet: 5,
  /** Stimmung einer Wählergruppe bei voller Übereinstimmung (oder vollem Widerspruch) mit der Richtung */
  gruppenStimmung: 2.5,
  /** Ein Fokus, der ein Gesetzesvorhaben vorbereitet: zusätzliche Ja-Stimmen (Vorlage abgestimmt, Lager eingebunden) */
  gesetzStimmen: 18,
  /** und Rang auf dem Gesetzestisch */
  gesetzRang: 2.5,
  /** Ein Fokus, der einen Knoten des Wissensbaums trägt: Tempofaktor */
  wissenTempo: 1.2,
  /** Anteil eines Katalogpunkts „forschungsrate“ am allgemeinen Forschungstempo (Summe gedeckelt) */
  forschungJePunkt: 0.006,
  forschungMax: 0.25,
  /** Außenwirkung: Katalogpunkte „Vertrauen West/Ost“ auf Vertrauen bei den Hauptakteuren */
  aussenSkala: 0.5,
  /** Wie viele Tage der Stempel eines vollendeten Fokus sichtbar bleibt */
  stempelTage: 45,
};

/**
 * Abbildung der frei benannten Größen der Kataloge auf Knoten des Politiknetzes: [Knoten, Faktor]. Größen, die selbst Knoten sind,
 * gelten mit Faktor 1, außer Eingangsgrößen des Wirtschaftsmodells (die rechnet das Modell selbst, deshalb hier umgelenkt).
 */
export const ABBILDUNG: Record<string, [string, number][]> = {
  wirtschaftswachstum: [["investitionen", 0.6], ["produktivitaet", 0.4]],
  arbeitslosigkeit: [["arbeitsplaetze_industrie", -0.5], ["jugendarbeitslosigkeit", 0.3]],
  staatsfinanzen: [["steuereinnahmen", 0.6], ["vertrauen_maerkte", 0.3]],
  gewerkschaften: [["arbeitnehmer", 0.6], ["streikneigung", -0.4]],
  devisenreserven: [["vertrauen_maerkte", 0.4], ["auslandskapital", 0.4]],
  buerokratie: [["korruption", 0.3]],
  import_abhaengigkeit: [["energieimporte", 0.4], ["ruestungsautarkie", -0.3]],
  militaer_bereitschaft: [["bereitschaft_heer", 0.4], ["bereitschaft_luft", 0.4], ["truppenmoral", 0.2]],
  ruestungsexport: [["ruestungsautarkie", 0.4], ["export", 0.2]],
  diplomatischer_hebel: [["ansehen", 0.6]],
  marine_praesenz: [["bereitschaft_see", 0.7]],
  gasfoerderung: [["sakarya_gas", 0.6], ["gasabhaengigkeit", -0.3]],
  vertrauen_westen: [["beziehungen_eu", 0.5], ["beziehungen_usa", 0.5]],
  welt_sicherheit: [["abschreckung", 0.4]],
  vertrauen_osten: [["beziehungen_russland", 0.6]],
  grenzsicherheit: [["terrorgefahr", -0.4], ["gefluechtete", -0.3]],
  oeffentliche_ordnung: [["kriminalitaet", -0.5]],
  luftverteidigung: [["bereitschaft_luft", 0.5], ["abschreckung", 0.3]],
  cyberabwehr: [["abschreckung", 0.3]],
  resilienz: [["katastrophenschutz", 0.6]],
  zusammenhalt: [["polarisierung", -0.6]],
  bildungsniveau: [["bildungsqualitaet", 0.6]],
  rechtsstaat: [["rechtssicherheit", 0.4], ["justiz_unabhaengigkeit", 0.4]],
  religioese_spannung: [["polarisierung", 0.3]],
  gleichstellung: [["frauenrechte", 0.6], ["frauenerwerb", 0.3]],
  gesellschaftliche_unruhe: [["protestdruck", 0.4]],
  demokratie: [["legitimitaet", 0.3], ["zivilgesellschaft", 0.4]],
  sicherheitsgefuehl: [["kriminalitaet", -0.3]],
  konservative_basis: [["konservative", 0.6]],
  saekulare_proteste: [["staedtische_saekulare", -0.5], ["protestdruck", 0.3]],
  familienvertrauen: [["konservative", 0.3], ["geburtenrate", 0.2]],
  haushalt_kosten: [["steuereinnahmen", -0.3]],
  jugendunruhen: [["junge", -0.5]],
  minderheiten_vertrauen: [["minderheiten", 0.6]],
  suedost_integration: [["terrorgefahr", -0.4], ["minderheiten", 0.3]],
  nationalistische_reaktion: [["nationalisten", -0.6]],
  innere_sicherheit: [["terrorgefahr", -0.5]],
  ansehen_welt: [["ansehen", 0.6]],
  wohlstand: [["realeinkommen", 0.4]],
  "bürgerzufriedenheit": [["vertrauen_regierung", 0.3]],
  energie_sicherheit: [["energieversorgung", 0.5], ["gasabhaengigkeit", -0.3]],
  geostrategie: [["ansehen", 0.3], ["logistik", 0.3]],
  devisen_vielfalt: [["dollarisierung", -0.4]],
  verfassungs_rueckhalt: [["legitimitaet", 0.4]],
  verwaltung_tempo: [["justiz_effizienz", 0.3], ["investitionen", 0.2]],
  opposition_widerstand: [["polarisierung", 0.4], ["protestdruck", 0.3]],
  staatliche_autoritaet: [["justiz_unabhaengigkeit", -0.4]],
  fuehrung_stabilitaet: [["legitimitaet", 0.2]],
  "bürgerproteste": [["protestdruck", 0.5]],
  parlament_zustimmung: [["legitimitaet", 0.4]],
  steuereffizienz: [["steuermoral", 0.5]],
  buergervertrauen: [["vertrauen_regierung", 0.4], ["justizvertrauen", 0.3]],
  regionalplanung: [["wachstum_regional", 0.4]],
  oekologie: [["klimaschutz", 0.4], ["luftqualitaet", 0.3]],
  trinkwasser_sicherheit: [["wasserversorgung", 0.6]],
  touristischer_ruf: [["tourismus", 0.5]],
  binnentourismus: [["tourismus", 0.3]],
  regional_angleichung: [["wachstum_regional", 0.5], ["landflucht", -0.3]],
  agrarproduktion: [["ernte", 0.5], ["landwirtschaft_einkommen", 0.4]],
  strompreise: [["strompreis", 0.6]],
  co2_ausstoss: [["klimaschutz", -0.5], ["luftqualitaet", -0.3]],
  forschungsrate: [["hochschule", 0.3]],
  patentanmeldungen: [["produktivitaet", 0.3]],
  digitalisierung: [["internet", 0.4], ["produktivitaet", 0.2]],
  ruestungsindustrie: [["ruestungsautarkie", 0.6]],
  nationalstolz: [["identitaet", 0.4], ["nationalisten", 0.2]],
  militaer_aufklaerung: [["abschreckung", 0.3], ["modernisierung", 0.3]],
  katastrophenhilfe: [["katastrophenschutz", 0.5]],
  gesundheitsvorsorge: [["gesundheitsversorgung", 0.5]],
  patentschutz: [["investitionen", 0.3]],
};

export type AussenDim = "handel" | "sicherheit" | "vertrauen" | "konflikt";

/** Außenwirkung beim Abschluss, je Hauptakteur (Punkte auf die Beziehung zur Türkei). */
export const AUSSEN: Record<string, Record<string, Partial<Record<AussenDim, number>>>> = {
  fok_aus_zollunion: { EU: { handel: 6, vertrauen: 3 } },
  fok2_aus_zollunion2: { EU: { handel: 8, vertrauen: 2 } },
  fok_aus_visafreiheit: { EU: { vertrauen: 6 } },
  fok_aus_tuerkische_welt: { AZE: { vertrauen: 6, handel: 3 }, KAZ: { vertrauen: 5, handel: 3 } },
  fok2_aus_turkstaaten_schulen: { AZE: { vertrauen: 3 }, KAZ: { vertrauen: 3 } },
  // Die Route durch Südarmenien (TRIPP) läuft unter armenischem Recht mit Entwicklungsrechten der USA; ohne Armenien und die USA kein Korridor
  fok_aus_zangezur: { AZE: { handel: 5, vertrauen: 3 }, ARM: { handel: 3 }, USA: { vertrauen: 2 }, IRN: { konflikt: 4 }, RUS: { vertrauen: -2 } },
  fok2_aus_kaspische_pipeline: { AZE: { handel: 4 }, KAZ: { handel: 4 }, RUS: { konflikt: 4 }, IRN: { konflikt: 3 } },
  fok_aus_vermittler: { RUS: { vertrauen: 2 }, UKR: { vertrauen: 2 } },
  fok2_aus_vermittlerzentrum: { EU: { vertrauen: 2 }, UKR: { vertrauen: 2 } },
  fok_aus_brics: { CHN: { vertrauen: 6, handel: 4 }, RUS: { vertrauen: 5 }, USA: { vertrauen: -6, konflikt: 5 }, EU: { vertrauen: -4 } },
  fok2_aus_afrika: { EGY: { vertrauen: 2 }, LBY: { vertrauen: 2 } },
  fok_sich_nato: { USA: { sicherheit: 8, vertrauen: 4 }, EU: { sicherheit: 4 }, RUS: { konflikt: 5 } },
  fok_sich_eurasien: { RUS: { sicherheit: 8, vertrauen: 5 }, CHN: { vertrauen: 4 }, USA: { vertrauen: -8, konflikt: 8 }, EU: { vertrauen: -5 } },
  fok_sich_mavi_vatan: { GRC: { konflikt: 8, vertrauen: -4 }, CYP: { konflikt: 6 }, EU: { vertrauen: -2 } },
  fok_sich_flotte: { GRC: { konflikt: 4 } },
  fok_sich_drohnen_export: { AZE: { sicherheit: 4 }, UKR: { sicherheit: 3 }, RUS: { vertrauen: -2 } },
  fok_ges_versoehnung: { EU: { vertrauen: 3 } },
  fok_staat_justiz_autonomie: { EU: { vertrauen: 4 } },
  fok_staat_dauerherrschaft: { EU: { vertrauen: -4 }, USA: { vertrauen: -2 } },
};

/** Was ein Fokus vorbereitet: Gesetzesvorhaben (mehr Stimmen, oben auf dem Tisch) und Knoten des Wissensbaums (schneller). */
export const OEFFNET: Record<string, { gesetze?: string[]; wissen?: string[] }> = {
  fok_wirt_orthodoxie: { gesetze: ["gv_preiswahrheit"] },
  fok2_wirt_preiswahrheit: { gesetze: ["gv_preiswahrheit"] },
  fok_wirt_privatisierung: { gesetze: ["gv_unternehmensteuer"] },
  fok_wirt_niedrigzins: { gesetze: ["gv_wohnungsbau"] },
  fok_wirt_verstaatlichung: { gesetze: ["gv_vermoegen"] },
  fok_wirt_autarkie: { wissen: ["robotik_offensive"] },
  fok_wirt_mittelstand: { gesetze: ["gv_mwst"] },
  fok2_wirt_formalisierung: { gesetze: ["gv_einkommensteuer"] },
  fok2_wirt_wirkstoff: { wissen: ["bio_medizintechnik"] },
  fok2_wirt_wasserstoff: { wissen: ["h2_elektrolyse", "meer_offshore_wind"] },
  fok_sich_drohnen: { wissen: ["mil_drohnen", "meer_uwdrohnen"] },
  fok_sich_kaan: { wissen: ["luft_triebwerke", "mil_kaan_motor", "mil_kaan"] },
  fok_sich_flotte: { wissen: ["mil_tf2000", "meer_uboote"] },
  fok_sich_celik_kubbe: { wissen: ["mil_stahlkuppel"] },
  fok_sich_grenzkorridor: { gesetze: ["gv_rueckkehr", "gv_polizei"] },
  fok2_sich_reserve: { gesetze: ["gv_wehrdienst"] },
  fok_ges_frauenrechte: { gesetze: ["gv_gewaltschutz"] },
  fok_ges_zivilgesellschaft: { gesetze: ["gv_versammlung", "gv_gewerkschaft"] },
  fok_ges_religioes: { gesetze: ["gv_imamhatip"] },
  fok_ges_moral_ordnung: { gesetze: ["gv_medienaufsicht", "gv_netzinhalte"] },
  fok_ges_sprachenvielfalt: { gesetze: ["gv_minderheiten"] },
  fok_ges_versoehnung: { gesetze: ["gv_friedensprozess"] },
  fok2_ges_jugendgarantie: { gesetze: ["gv_mindestlohn"] },
  fok2_ges_pflege: { gesetze: ["gv_renten"] },
  fok_staat_justiz_autonomie: { gesetze: ["gv_justizreform", "gv_richterstellen"] },
  fok_staat_transparenz: { gesetze: ["gv_antikorruption"] },
  fok_reg_energie_drehkreuz: { gesetze: ["gv_kernenergie"], wissen: ["energie_smr"] },
  fok_wis_ki_zentrum: { wissen: ["ki_strategie", "ki_rechenzentren"] },
  fok_wis_halbleiter: { wissen: ["chips_design", "ki_chipfab"] },
  fok2_wis_chips_28: { wissen: ["ki_chipfab"] },
  fok2_wis_supercomputer: { wissen: ["ki_rechenzentren"] },
  fok_wis_raumfahrt: { wissen: ["raum_agentur", "raum_satelliten"] },
  fok_wis_satellitennetz: { wissen: ["raum_satelliten", "raum_bahnhof"] },
  fok_wis_quanten_bio: { wissen: ["quanten_zentrum", "bio_genomik"] },
  fok2_wis_impfstoffwerk: { wissen: ["bio_impfstoffwerk"] },
  fok2_wis_zellen: { wissen: ["batt_zellfabrik"] },
};

/** Rasterplatz im Ast: Zeile = Tiefe im Baum (längster Weg von der Wurzel), Spalte = Reihenfolge nach dem Katalograster. */
export interface Platz {
  zeile: number;
  spalte: number;
}

function tiefe(id: string, memo: Map<string, number>): number {
  const m = memo.get(id);
  if (m !== undefined) return m;
  const f = FOKUS_VON[id]!;
  const d = f.voraus.length ? 1 + Math.max(...f.voraus.map((v) => tiefe(v, memo))) : 0;
  memo.set(id, d);
  return d;
}

/** Plätze aller Foki eines Asts und die Breite des Rasters. */
export function astRaster(ast: FokusAst): { plaetze: Record<string, Platz>; spalten: number; zeilen: number } {
  const liste = FOKI.filter((f) => f.ast === ast);
  const memo = new Map<string, number>();
  const zeilen = new Map<number, FokusDefinition[]>();
  for (const f of liste) {
    const z = tiefe(f.id, memo);
    zeilen.set(z, [...(zeilen.get(z) ?? []), f]);
  }
  const plaetze: Record<string, Platz> = {};
  let spalten = 1;
  for (const [z, l] of zeilen) {
    l.sort((a, b) => a.raster.spalte - b.raster.spalte || a.raster.zeile - b.raster.zeile || a.id.localeCompare(b.id));
    l.forEach((f, i) => (plaetze[f.id] = { zeile: z, spalte: i }));
    spalten = Math.max(spalten, l.length);
  }
  return { plaetze, spalten, zeilen: Math.max(...zeilen.keys()) + 1 };
}

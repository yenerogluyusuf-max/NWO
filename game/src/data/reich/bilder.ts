// Motiv je Vorhaben (Befund F-26, Nacht N6). Vorher teilten sich etwa 100 Vorhaben 19 Motive: Der Kampfpanzer Altay war ein Turm,
// der Drohnenverbund ein Kampfjet, Raumfahrt immer ein Turm, die Kacheln hatten gar kein Bild. Hier steht für jedes Vorhaben
// des Katalogs das passende Motiv aus ui/reich/WunderBild.tsx; was zur Laufzeit dazukommt (Programme für Provinzen, Netzausbau,
// Wiederaufbau nach Katastrophen), bekommt sein Motiv aus `bildFuer`.

import type { Vorhaben, WunderBild } from "../../sim/reich-typen";
import { ERBE_NACH_ID } from "../erbe";

export const BILD: Record<string, WunderBild> = {
  // Kultur
  wunder_ephesos: "tempel", wunder_antakya: "stadt", wunder_goebekli: "fels", wunder_ani: "tor", wunder_kappadokien: "fels",
  programm_erbe_zukunft: "museum",
  serie_kirchen7: "kirche", serie_seldschuken: "kuppel", serie_sinan: "kuppel", serie_tas_tepeler: "fels", serie_byzanz: "kirche", serie_vielvoelker: "stadt",
  // Infrastruktur (Bestand und Katalog)
  infra_marmaray: "tunnel", infra_osmangazi: "bruecke", infra_flughafen: "flughafen", infra_yht: "bahn", infra_canakkale1915: "bruecke", infra_gap: "damm",
  infra_btk: "bahn", infra_stromnetz: "mast", infra_akkuyu: "reaktor", infra_wiederaufbau: "wohnblock", infra_kanal_istanbul: "kanal",
  infra_entwicklungsstrasse: "strasse", infra_kop: "feld", infra_yht_izmir: "bahn", infra_strom_ost: "mast", infra_btk_personen: "bahn",
  infra_bosporus_tunnel3: "tunnel", infra_wasser_ost: "leitung", infra_glasfaser: "netzwerk", infra_sozialwohnungen: "wohnblock", infra_sinop: "reaktor",
  // Recht
  recht_aym: "gericht", recht_hsk: "gericht", recht_vollzug: "gericht", recht_anwaltskammern: "gericht", recht_digitale_justiz: "netzwerk",
  recht_justizakademie: "schule", recht_gefaengnisbau: "gericht", recht_kavala: "gericht", recht_kammergesetz: "gericht", recht_zielfristen: "gericht",
  // Streitkräfte
  mil_drohnen: "drohne", mil_anadolu: "schiff", mil_s400: "kuppelschirm", mil_f16: "jet", mil_stahlkuppel: "kuppelschirm", mil_altay: "panzer",
  mil_kaan: "jet", mil_kaan_motor: "triebwerk", mil_eurofighter: "jet", mil_f35: "jet", mil_s400_abgeben: "kuppelschirm", mil_tf2000: "schiff",
  mil_huerjet: "jet", doktrin_drohnen: "drohne", doktrin_luftverteidigung: "kuppelschirm", doktrin_autonomie: "fabrik",
  // Sonderrechte des Haushalts
  sr_energiedeckel: "leitung", sr_kreditgarantien: "bank", sr_wechselkursschutz: "bank", sr_staatsbanken: "bank", sr_vermoegensfonds: "bank",
  // Verkehr und Welt
  welt_korridor_abkommen: "konferenz", welt_korridor_terminals: "hafen", welt_autobahn_china: "strasse", welt_hsr_china: "bahn",
  welt_megahafen: "hafen", welt_maglev: "bahn", welt_bruecke_zypern: "bruecke",
  // Städte
  stadt_satellit_ost: "wohnblock", stadt_hauptstadt_neu: "stadt", stadt_unterwasser: "kuppelschirm",
  // Energie und Wasser
  energie_hvdc_europa: "mast", energie_smr: "reaktor", energie_brennstoffkreislauf: "reaktor", energie_fusion_forschung: "labor",
  energie_fusion_testreaktor: "reaktor", energie_fusion_kraftwerk: "reaktor", wasser_konya: "damm", wasser_entsalzung: "leitung", wasser_friedensleitung: "leitung",
  // Raumfahrt
  raum_agentur: "satellit", raum_satelliten: "satellit", raum_bahnhof: "rakete", raum_traeger: "rakete", raum_mondsonde: "mond",
  raum_orbit_bemannt: "rakete", raum_mondbasis: "mond", raum_mars: "mond", raum_aufzug: "turm",
  // Künstliche Intelligenz
  ki_strategie: "netzwerk", ki_rechenzentren: "rechenzentrum", ki_chipfab: "chip", ki_sprachmodell: "netzwerk", ki_verwaltung: "netzwerk",
  ki_justiz: "netzwerk", ki_militaer: "drohne", ki_agi: "netzwerk",
  // Technologiefelder
  meer_institut: "schiff", meer_offshore_wind: "wind", meer_tiefsee_gas: "bohrinsel", meer_hafenautomatisierung: "hafen", meer_uwdrohnen: "uboot",
  meer_uboote: "uboot", meer_tiefseebergbau: "bohrinsel", luft_triebwerke: "triebwerk", luft_regionalflugzeug: "flughafen", luft_flugtaxi: "flughafen",
  bio_genomik: "labor", bio_impfstoffwerk: "labor", bio_saatgut: "feld", bio_medizintechnik: "klinik", bio_gentherapie: "labor",
  chips_design: "chip", chips_euv: "chip", batt_zellfabrik: "fabrik", h2_elektrolyse: "leitung", quanten_zentrum: "quanten", quanten_computer: "quanten",
  robotik_offensive: "roboter", nano_zentrum: "labor",
  // Programme für Regionen
  reg_wohnungsbau: "wohnblock", reg_schulbau: "schule", reg_krankenhaus: "klinik", reg_wasser: "leitung", reg_damm: "damm", reg_strassen: "strasse",
  reg_bahn: "bahn", reg_strom: "mast", reg_breitband: "netzwerk", reg_foerderung: "fabrik", reg_wiederaufbau: "wohnblock", reg_stadterneuerung: "stadt",
  reg_kultur: "museum",
};

/** Motiv einer Stätte nach ihrer Prägung (Restaurierung): Moscheen Kuppel, Kirchen und Synagogen Kirche, Frühgeschichte Fels, sonst Tempel. */
function staettenBild(erbeId: string): WunderBild {
  const e = ERBE_NACH_ID[erbeId];
  if (!e) return "tempel";
  if (e.bezug.includes("fruehmenschlich") || e.bezug.includes("natur")) return "fels";
  if (e.bezug.includes("islamisch")) return "kuppel";
  if (e.bezug.includes("christlich") || e.bezug.includes("juedisch") || e.bezug.includes("armenisch") || e.bezug.includes("syrisch")) return "kirche";
  return "tempel";
}

/** Motiv für ein Vorhaben ohne Eintrag: nach Kennung, Vorlage, Art und Bereich. */
export function bildFuer(v: Vorhaben): WunderBild | undefined {
  const direkt = BILD[v.id] ?? (v.instanzVon ? BILD[v.instanzVon] : undefined);
  if (direkt) return direkt;
  const basis = v.id.split("@")[0]!;
  if (BILD[basis]) return BILD[basis];
  if (v.id.startsWith("restaurierung_")) return staettenBild(v.id.slice("restaurierung_".length));
  if (v.id.startsWith("ausbau_")) return "museum";
  if (v.id.startsWith("kat_wohnbau_")) return "wohnblock";
  if (v.pflegt) return BILD[v.pflegt.split("@")[0]!] ?? undefined;
  if (v.id.startsWith("infra_netz_")) {
    if (/bahn/.test(v.id)) return "bahn";
    if (/strom/.test(v.id)) return "mast";
    if (/wohn/.test(v.id)) return "wohnblock";
    if (/klinik|gesund/.test(v.id)) return "klinik";
    if (/wasser/.test(v.id)) return "leitung";
    if (/strasse|strassen|verkehr/.test(v.id)) return "strasse";
    if (/internet|breitband/.test(v.id)) return "netzwerk";
    if (/hafen|logistik/.test(v.id)) return "hafen";
  }
  return undefined;
}

/** Letzte Regel nach dem Bereich, wenn weder Tabelle noch Daten ein Motiv nennen. */
function bildNachBereich(v: Vorhaben): WunderBild {
  return v.bereich === "militaer" ? "kuppelschirm" : v.bereich === "recht" ? "gericht" : v.bereich === "kultur" ? "museum" : v.bereich === "haushalt" ? "bank" : "fabrik";
}

/** Setzt das Motiv: Tabelle und abgeleitete Regeln vor dem alten Wert der Daten (dort standen die Fehlgriffe), zuletzt der Bereich. */
export function setzeBild(v: Vorhaben): void {
  v.bild = bildFuer(v) ?? v.bild ?? bildNachBereich(v);
}

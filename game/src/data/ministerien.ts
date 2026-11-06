// Die 17 Ministerien der Türkei und die Ämter ohne Ministerium (ENTSCHEIDUNGEN W 1; PLAN_OBERFLAECHE_DETAIL_2026-11-05.md, Teil 1 Q1).
// Eine Zuordnung, aus der Simulation und Oberfläche lesen: Welches Amt trägt welche Maßnahme, welchen Haushaltsposten, welche Behörde.
//
// Quellen der Zuordnung:
// - Präsidialerlass Nr. 1 (Resmî Gazete 10.07.2018) über die Organisation des Präsidialsystems: sechzehn Ministerien; seit 2021 siebzehn,
//   als „Familie, Arbeit und Soziales“ in „Familie und Soziales“ sowie „Arbeit und Sozialversicherung“ geteilt wurde.
// - Präsidialerlass Nr. 4 (15.07.2018) über die nachgeordneten und verbundenen Einrichtungen: DSİ bei Landwirtschaft und Forst (Art. 120),
//   TÜBİTAK bei Industrie und Technologie, Karayolları (KGM) bei Verkehr und Infrastruktur.
// - TOKİ: Umwelt, Städtebau und Klima über die Rechtsverordnung Nr. 703 (2018). Diyanet und Kommunikationsdirektion beim Präsidialamt
//   (Erlass Nr. 1 bzw. Nr. 14), SSB beim Präsidenten (Erlass Nr. 7), RTÜK bei Kultur und Tourismus (Präsidialrundschreiben 2018/2).
//   Belege und offene Punkte: RECHERCHE_HAUSHALT_MINISTERIEN_2026.md (AP 2; dort als Such-Auszug, Prüfung an den Erlassen offen).
// - Strittige Maßnahmen (Plan Teil 3, F13) sind nach dem Ressort zugeordnet, das die Sache im Alltag führt; die Begründung steht am Eintrag.
//
// Die Kennung des Industrieministeriums bleibt „wirtschaft“ (so heißt das Amt in allen Spielständen); angezeigt wird „Industrie und
// Technologie“. Präsidialamt, Zentralbank und Generalstab sind Ämter mit Figur, aber keine Ministerien.

import type { Figur } from "../sim/spiel-typen";

export type MinisteriumId =
  | "justiz" | "familie" | "arbeit" | "umwelt" | "aussen" | "energie" | "jugend" | "finanzen" | "inneres"
  | "kultur" | "bildung" | "verteidigung" | "gesundheit" | "wirtschaft" | "landwirtschaft" | "handel" | "verkehr";

export interface MinisteriumDef {
  id: MinisteriumId;
  /** Amtlicher Name auf Türkisch (Erlass Nr. 1 in der Fassung von 2021) */
  tuerkisch: string;
  /** Maßnahmen des Politiknetzes, die dieses Ressort trägt */
  massnahmen: string[];
  /** Haushaltsposten (sim/haushalt.ts POSTEN), deren Etat das Ressort verwaltet */
  posten: string[];
  /** Behörden (data/behoerden.ts) */
  behoerden: string[];
}

export const MINISTERIEN: MinisteriumDef[] = [
  { id: "justiz", tuerkisch: "Adalet Bakanlığı", massnahmen: ["m_justizreform", "m_richterstellen", "m_haftvermeidung", "m_urteilsumsetzung", "m_antikorruption", "m_richterrat"], posten: ["justiz"], behoerden: ["justiz"] },
  { id: "familie", tuerkisch: "Aile ve Sosyal Hizmetler Bakanlığı", massnahmen: ["m_kindergeld", "m_kinderbetreuung", "m_sozialhilfe", "m_gewaltschutz", "m_minderheitenrechte"], posten: ["sozialhilfe"], behoerden: [] },
  // Mindestlohn: festgelegt von der Mindestlohnkommission beim Arbeitsministerium (Arbeitsgesetz Nr. 4857, Art. 39)
  { id: "arbeit", tuerkisch: "Çalışma ve Sosyal Güvenlik Bakanlığı", massnahmen: ["m_arbeitslosengeld", "m_ausbildung", "m_fachkraefteprogramm", "m_fruehrente", "m_gewerkschaftsrechte", "m_renten", "m_mindestlohn"], posten: ["rentenniveau", "rentenalter"], behoerden: [] },
  // Wohnen und Bauen (TOKİ, Stadterneuerung, Bauaufsicht) und der Umweltteil der Energiepolitik (Auflagen, CO2-Preis)
  { id: "umwelt", tuerkisch: "Çevre, Şehircilik ve İklim Değişikliği Bakanlığı", massnahmen: ["m_bauamnestie", "m_bauaufsicht", "m_bauindustrie", "m_baukredite", "m_gebaeudeverstaerkung", "m_mietdeckel", "m_sozialwohnungen", "m_stadterneuerung", "m_versicherungspflicht", "m_co2_preis", "m_umweltauflagen"], posten: ["wohnen"], behoerden: [] },
  { id: "aussen", tuerkisch: "Dışişleri Bakanlığı", massnahmen: ["m_eu_annaeherung", "m_integration", "m_handelssysteme", "m_grenzschutz"], posten: ["diplomatie"], behoerden: ["diplomatie"] },
  // Der Posten umwelt_energie bleibt ein Stück für zwei Ressorts, bis Tabelle A ihn teilt (Plan Teil 4); geführt beim Energieministerium
  { id: "energie", tuerkisch: "Enerji ve Tabii Kaynaklar Bakanlığı", massnahmen: ["m_akkuyu_ppa", "m_energieeffizienz", "m_energiesubventionen", "m_gasfoerderung", "m_gashub", "m_gasspeicher", "m_heimische_kohle", "m_kernkraft", "m_lng_vertraege", "m_netzausbau", "m_preiswahrheit", "m_regas_ausbau", "m_sakarya_phase3", "m_solar_wind", "m_speicher_smartgrid", "m_yeka_serie"], posten: ["umwelt_energie"], behoerden: [] },
  // Stipendien und Wohnheime: Kredi ve Yurtlar Kurumu beim Ministerium für Jugend und Sport
  { id: "jugend", tuerkisch: "Gençlik ve Spor Bakanlığı", massnahmen: ["m_stipendien"], posten: [], behoerden: [] },
  { id: "finanzen", tuerkisch: "Hazine ve Maliye Bakanlığı", massnahmen: ["m_einkommensteuer", "m_mwst", "m_steuerfahndung", "m_verwaltungsdigital", "m_steueramnestie", "m_privatisierung", "m_bankenaufsicht", "m_immobiliensteuer", "m_koerperschaftsteuer", "m_kraftstoffsteuer"], posten: ["personal"], behoerden: ["steuer", "statistik"] },
  // AFAD, Frühwarnung, Rückkehr und Integration (Präsidium für Migrationssteuerung) beim Innenministerium
  { id: "inneres", tuerkisch: "İçişleri Bakanlığı", massnahmen: ["m_polizei", "m_polizeitechnik", "m_versammlungsfreiheit", "m_afad_ausbau", "m_fruehwarnsystem", "m_rueckkehr"], posten: ["innere_sicherheit"], behoerden: ["polizei", "grenzschutz", "afad"] },
  // Medienaufsicht (RTÜK) nach Präsidialrundschreiben 2018/2 bei Kultur und Tourismus
  { id: "kultur", tuerkisch: "Kültür ve Turizm Bakanlığı", massnahmen: ["m_archaeologie", "m_denkmalschutz", "m_kulturfoerderung", "m_tourismuswerbung", "m_medienaufsicht"], posten: ["kultur"], behoerden: [] },
  { id: "bildung", tuerkisch: "Millî Eğitim Bakanlığı", massnahmen: ["m_berufsschulen", "m_bildungstechnik", "m_lehrergehaelter", "m_religioese_schulen", "m_schulbau", "m_unigruendungen", "m_wissenschaftsfreiheit"], posten: ["bildung"], behoerden: ["bildung"] },
  // Verteidigungsminister: Etat und Beschaffung; Übungen und Offiziersauswahl bleiben beim Generalstab (Plan Teil 3, F5)
  { id: "verteidigung", tuerkisch: "Millî Savunma Bakanlığı", massnahmen: ["m_verteidigung", "m_ruestungsindustrie", "m_wehrdienst"], posten: ["verteidigung"], behoerden: [] },
  { id: "gesundheit", tuerkisch: "Sağlık Bakanlığı", massnahmen: ["m_aerztegehalt", "m_hausarzt", "m_krankenhausbau", "m_medizintechnik", "m_zuzahlungen"], posten: ["gesundheit"], behoerden: ["gesundheit"] },
  // Forschung (TÜBİTAK nach Erlass Nr. 4) und Regionalförderung (Entwicklungsagenturen) bei Industrie und Technologie
  { id: "wirtschaft", tuerkisch: "Sanayi ve Teknoloji Bakanlığı", massnahmen: ["m_investitionsanreize", "m_exportfoerderung", "m_kmu", "m_industrie_modernisierung", "m_kreditgarantien", "m_forschung", "m_regionalfoerderung"], posten: ["forschung", "investitionen", "subventionen"], behoerden: [] },
  // Staudämme und Bewässerung: DSİ (Erlass Nr. 4, Art. 120)
  { id: "landwirtschaft", tuerkisch: "Tarım ve Orman Bakanlığı", massnahmen: ["m_agrarforschung", "m_agrarsubventionen", "m_bewaesserung", "m_mechanisierung", "m_saatgut", "m_staudaemme", "m_wasserleitungen"], posten: ["landwirtschaft"], behoerden: [] },
  { id: "handel", tuerkisch: "Ticaret Bakanlığı", massnahmen: ["m_zoelle", "m_preiskontrollen"], posten: [], behoerden: [] },
  // Netzsperren: Behörde für Informations- und Kommunikationstechnik (BTK), dem Verkehrsministerium verbunden
  { id: "verkehr", tuerkisch: "Ulaştırma ve Altyapı Bakanlığı", massnahmen: ["m_autobahnen", "m_bahn", "m_breitband", "m_instandhaltung", "m_nahverkehr", "m_oepp_garantien", "m_smart_infrastruktur", "m_internetsperren"], posten: [], behoerden: [] },
];

/** Ämter ohne Ministerium mit eigenen Maßnahmen: Präsidialamt (Religionsbehörde, Ausnahmezustand, Friedensprozess, Staatsmedien), Generalstab. */
export const AEMTER_OHNE_MINISTERIUM: { id: Figur["amt"]; massnahmen: string[]; behoerden: string[] }[] = [
  { id: "stab", massnahmen: ["m_digitale_oeffentlichkeit", "m_staatsmedien", "m_religionsbehoerde", "m_notstand", "m_friedensprozess"], behoerden: ["mit", "cyber"] },
  { id: "generalstab", massnahmen: ["m_uebungen", "m_offiziersauswahl"], behoerden: [] },
  { id: "zentralbank", massnahmen: [], behoerden: [] },
];

export const MINISTERIUM_NACH_ID: Record<MinisteriumId, MinisteriumDef> = Object.fromEntries(MINISTERIEN.map((m) => [m.id, m])) as Record<MinisteriumId, MinisteriumDef>;

/** Welches Amt eine Maßnahme trägt (genau eines; der Test prüft, dass keine doppelt vergeben ist). */
export function ressortVon(massnahme: string): MinisteriumId | Figur["amt"] | undefined {
  for (const m of MINISTERIEN) if (m.massnahmen.includes(massnahme)) return m.id;
  for (const a of AEMTER_OHNE_MINISTERIUM) if (a.massnahmen.includes(massnahme)) return a.id;
  return undefined;
}

/** Welches Amt einen Haushaltsposten verwaltet. */
export function ressortVonPosten(posten: string): MinisteriumId | undefined {
  return MINISTERIEN.find((m) => m.posten.includes(posten))?.id;
}

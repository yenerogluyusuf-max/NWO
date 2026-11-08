// Annexion: die internationale Reaktion in Stufen und die neue Provinz (Welle 3, K5; krieg.md Schritt 9; ENTSCHEIDUNGEN AA 1).
// Recherche: recherche_besatzung.md (RB) Teil C und die Nachrecherche vom 08.11.2026. Keine Quellen in der Oberfläche.

/** Mitglieder der Vereinten Nationen (seit dem Beitritt Südsudans 2011). */
export const UN_MITGLIEDER = 193;

/**
 * Vergleichsabstimmungen der Generalversammlung:
 *   - A/RES/68/262 „Territoriale Unversehrtheit der Ukraine“, 27.03.2014: 100 Ja, 11 Nein, 58 Enthaltungen, 24 abwesend
 *     (UN-Pressemitteilung GA/11493, https://press.un.org/en/2014/ga11493.doc.htm; Abwesende: https://undocs.org/A/RES/68/262, RB C.1)
 *   - A/RES/ES-11/4 zu Donezk, Luhansk, Saporischschja und Cherson, 12.10.2022: 143 Ja, 5 Nein, 35 Enthaltungen, 10 abwesend
 *     (GA/12458, https://press.un.org/en/2022/ga12458.doc.htm, RB C.2)
 */
export const GV_VERGLEICH = {
  krim: { ja: 100, nein: 11, enth: 58, abwesend: 24, jahr: 2014 },
  oblaste: { ja: 143, nein: 5, enth: 35, abwesend: 10, jahr: 2022 },
} as const;

/**
 * Sicherheitsrat: Am 15.03.2014 stimmten 13 von 15 Mitgliedern für den Entwurf, das Referendum auf der Krim für ungültig zu erklären;
 * Russland legte sein Veto ein, China enthielt sich (Al Jazeera 16.03.2014, https://www.aljazeera.com/news/2014/3/16/russia-isolated-over-crimea-after-un-vote).
 * Nordzypern: UN-SR 541 (18.11.1983) und 550 (11.05.1984), je 13:1:1, angenommen (RB B).
 */
export const SR = {
  staendig: ["USA", "GBR", "FRA", "RUS", "CHN"] as const,
  gewaehlt: 10,
  /** Nötige Ja-Stimmen (UN-Charta Art. 27 Abs. 3) */
  noetig: 9,
};

/** Tage nach dem Beschluss der Annexion (Krim: Vertrag über die Aufnahme 18.03.2014). */
export const ANNEXION_TAGE = {
  /** Sicherheitsrat: Spielparameter (auf der Krim drei Tage vor dem Vertrag; im Spiel folgt der Entwurf dem Beschluss) */
  sr: 3,
  /** Generalversammlung: 27.03.2014, neun Tage nach dem Vertrag */
  gv: 9,
};

/**
 * Sanktionen nach dem Muster der Krim 2014 (krieg.md Schritt 9: März, Juli, September, Dezember). Tage ab dem Beschluss (18.03.2014):
 *   1. März: Einreise- und Vermögenssperren gegen Verantwortliche. USA Executive Order 13660 (06.03.2014), EU Ratsbeschluss 2014/145/GASP
 *      (17.03.2014). Im Spiel drei Tage nach dem Beschluss.
 *   2. Juli: Sektorsanktionen (Kapitalmarkt, Rüstung, Güter mit doppeltem Verwendungszweck, Öltechnik), EU-Ratsbeschluss 2014/512/GASP
 *      (31.07.2014, 135 Tage), USA 16.07.2014.
 *   3. September: Verschärfung (EU 08.09.2014, USA 12.09.2014; rund 174 Tage).
 *   4. Dezember: Investitionsverbot in der Region (EU 2014/933/GASP, 18.12.2014) und Handelsembargo (USA EO 13685, 19.12.2014); 275 Tage.
 *      Das EU-Einfuhrverbot für Waren aus der Krim (2014/386/GASP, 23.06.2014) steckt hier mit drin.
 *   Quellen: legislation.gov.uk (EU-Ratsbeschlüsse 2014/145, 2014/386, 2014/933), OFAC Ukraine-Programm
 *   (https://ofac.treasury.gov/system/files/126/ukraine_overview_of_sanctions.pdf), Steptoe 2014 zu EO 13685.
 *
 * Wirkung je Stufe auf den Risikoaufschlag (Basispunkte) und die Auslandsnachfrage (Indexpunkte, derselbe Kanal wie die EU-Handelssanktion in
 * sim/diplomatie.ts): Spielparameter, kalibriert an der Obergrenze des IWF (Artikel-IV-Bericht Russland 2015, IMF Country Report 15/211, S. 5:
 * Sanktionen und Gegensanktionen senken das reale BIP zunächst um 1 bis 1,5 %, kumuliert mittelfristig um bis zu 9 %;
 * https://www.imf.org/external/pubs/ft/scr/2015/cr15211.pdf). Test: test/besatzung-annexion.test.ts.
 */
export const SANKTIONS_STUFEN: { tag: number; risiko: number; nachfrage: number }[] = [
  { tag: 3, risiko: 40, nachfrage: 0 },
  { tag: 135, risiko: 120, nachfrage: 9 },
  { tag: 174, risiko: 170, nachfrage: 14 },
  { tag: 275, risiko: 200, nachfrage: 18 },
];

/** IWF-Band als Obergrenze (Anteil am BIP, Prozent). */
export const IWF_BAND = { sofortMin: 1, sofortMax: 1.5, mittelfristigMax: 9 };

/**
 * Wer mitzieht (Spielparameter): Anteil der EU und der USA an der vollen Wirkung. Die EU trägt mehr, weil sie der größte Handelspartner der
 * Türkei ist (Handelsgewicht 0,4 in sim/diplomatie.ts, Spielparameter). Ein Land zieht mit, wenn es der Türkei nach der Annexion im Konflikt ab
 * der Schwelle gegenübersteht oder das annektierte Gebiet einem EU-Mitglied gehörte (dann die EU immer).
 */
export const SANKTION_TRAEGER = { EU: { anteil: 0.6, konfliktAb: 60 }, USA: { anteil: 0.4, konfliktAb: 55 } } as const;

/** Gehörte das Gebiet einem NATO-Verbündeten, ziehen die USA immer mit (Spielparameter; Griechenland ist seit 1952 Mitglied, Zypern nicht). */
export const NATO_OPFER = new Set(["GRC"]);

/**
 * Hatay 1939, der einzige türkische Präzedenzfall: Statut des Völkerbunds 1937, Staat Hatay 02.09.1938, Beschluss der Versammlung zum Anschluss
 * 29.06.1939, Abkommen mit Frankreich 23.06.1939, Gesetz der TBMM 07.07.1939 (RB C.3). Er gelang mit Zustimmung der Mandatsmacht. Im Spiel: Eine
 * Abtretung per Friedensvertrag (Friedenstisch, K4) löst keine Sanktionen und keine Abstimmung aus, wenn die Türkei angegriffen worden war. Hat die
 * Türkei den Krieg begonnen, ist ein erzwungener Vertrag nach Art. 52 des Wiener Übereinkommens über das Recht der Verträge (1969) nichtig: Dann
 * stimmt die Generalversammlung ab, die Sanktionen bleiben aber bei der ersten Stufe, weil der frühere Souverän selbst unterschrieben hat
 * (Spielparameter, „Zur Bestätigung“ im Bericht K5).
 */
export const VERTRAG = { stufeMaxBeiAngriff: 1, gvFaktorJa: 0.6 };

/**
 * Sitzverteilung (Gesetz Nr. 2839 über die Wahl der Abgeordneten, Art. 4; lexpera.com.tr, Abruf 08.11.2026): Die TBMM hat 600 Sitze
 * (Verfassung Art. 75). Jede Provinz erhält zuerst einen Sitz; die übrigen werden nach der Einwohnerzahl verteilt (Quote aus Bevölkerung durch
 * Restsitze), Reste nach der Größe der Restbevölkerung. Eine neue Provinz bekommt ihre Sitze erst bei der nächsten Parlamentswahl.
 */
export const SITZE_GESAMT = 600;

/**
 * Eingliederung (Victoria 3, Muster M9 in recherche_vorbilder.md): Jahre, bis die Provinz voll Steuern zahlt und ihre Dienste wie jede andere
 * trägt. Hängt an der Haltung der Bevölkerung, gemessen am Widerstand beim Beschluss: 2 Jahre ohne Widerstand bis 10 Jahre bei vollem Widerstand
 * (Spielparameter). Hatay wurde 1939 sofort Provinz (Gesetz vom 07.07.1939), die Krim hatte eine Übergangszeit; beides ist rechtlich, nicht
 * wirtschaftlich gemessen.
 */
export const EINGLIEDERUNG = { jahreMin: 2, jahreMax: 10, ablehnungJeWiderstand: 0.005 };

/**
 * Welche türkische Provinz eine Region verwaltet (Vorbild der Gouverneure, siehe data/besatzung.ts, Form „zivil“): belegt für Asas (Kilis),
 * sonst die nächste Grenzprovinz des Schauplatzes (Spielparameter). Sie gibt der neuen Provinz das Stimmenmuster bei der ersten Wahl.
 */
export const VERWALTENDE_PROVINZ: Record<string, number> = {
  syr_asas: 79, syr_aleppo: 27, syr_manbidsch: 27, syr_idlib: 31, syr_tabqa: 63, syr_rakka: 63, syr_hasaka: 63, syr_deir: 63, syr_qamischli: 47,
};

/** Staaten, deren Schauplatz praktisch das ganze Staatsgebiet umfasst (Zypern: die vier Bezirke des Regierungsgebiets; der freie Teil von Famagusta mit 54.318 Einwohnern ist keine Spielregion). */
export const GANZER_STAAT = new Set(["CYP"]);

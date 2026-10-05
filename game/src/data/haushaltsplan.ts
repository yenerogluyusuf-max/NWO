// Der Haushaltsplan der Zentralregierung für 2026 (Haushaltsgesetz), Milliarden Lira. Nur belegte Zahlen; was abgeleitet ist, steht so dabei.
// Stand der Recherche: 30.09.2026. Die Quellen sind Auswertungen des Haushaltsgesetzes durch die Presse und eine Gewerkschaft; sie weichen bei
// einzelnen Summen leicht ab (etwa bei den Personalausgaben), wir nehmen die Zahlen, die sich zur Gesamtsumme von 18,9 Billionen Lira addieren.

export interface Zeile {
  id: string;
  name: string;
  /** Milliarden Lira */
  mrd: number;
  text?: string;
  /** Ob der Wert aus belegten Zahlen abgeleitet ist */
  abgeleitet?: boolean;
}

export const AUSGABEN_2026: Zeile[] = [
  { id: "uebertragungen", name: "Laufende Übertragungen", mrd: 6821, text: "Sozialleistungen, Zuschüsse an die Sozialversicherung (SGK: 2.329 Mrd.), Subventionen, Zahlungen an Kommunen und Unternehmen." },
  { id: "personal", name: "Personal", mrd: 5507, text: "Gehälter und Renten des öffentlichen Dienstes, Sozialbeiträge des Staates." },
  { id: "zinsen", name: "Zinsen", mrd: 2742, text: "Schuldendienst; rund 3,5 % des BIP, etwa jeder fünfte Lira der Steuereinnahmen." },
  { id: "investitionen", name: "Investitionen (Kapitalausgaben)", mrd: 1312, text: "Bauten, Straßen, Anlagen und Ausrüstung." },
  { id: "waren", name: "Waren und Dienstleistungen", mrd: 1250, text: "Laufender Betrieb: Verbrauchsmaterial, Miete, Wartung, Dienstleistungen." },
  { id: "kapitaltransfers", name: "Kapitaltransfers", mrd: 525, text: "Zuschüsse für Investitionen anderer, etwa Kommunen und Betriebe." },
  { id: "kredite", name: "Darlehen", mrd: 397, text: "Kredite des Staates an Dritte." },
  { id: "reserve", name: "Reserve", mrd: 375, text: "Ungebundene Mittel für Unvorhergesehenes." },
];

export const STEUERN_2026: Zeile[] = [
  { id: "mwst", name: "Mehrwertsteuer", mrd: 3539 },
  { id: "est", name: "Einkommensteuer", mrd: 3558 },
  { id: "oetv", name: "Sonderverbrauchsteuer", mrd: 2549, text: "Auf Kraftstoffe, Tabak, Alkohol, Autos und andere Waren." },
  { id: "kst", name: "Körperschaftsteuer", mrd: 1741 },
  { id: "bankensteuer", name: "Bank- und Versicherungssteuer", mrd: 632 },
  { id: "gebuehren", name: "Gebühren", mrd: 460 },
  { id: "zoelle", name: "Zölle", mrd: 403 },
  { id: "stempel", name: "Stempelsteuer", mrd: 313 },
  { id: "kfz", name: "Kraftfahrzeugsteuer", mrd: 138 },
  { id: "sonst", name: "Übrige Steuern", mrd: 467, abgeleitet: true, text: "Differenz zu den geplanten Steuereinnahmen von 13,8 Billionen Lira." },
];

export const PLAN_2026 = {
  ausgabenGesamt: 18929,
  einnahmenGesamt: 16216,
  steuerGesamt: 13800,
  defizit: 2713,
  /** Haushaltsgesetz 2026 (Herbst 2025). Das neuere Mittelfristprogramm 2027–2029 (06.09.2026) revidiert das Ziel auf 2,6 Bio. TL ≈ 3,1 % des BIP — der Szenario-Startwert (szenario_tuerkei_2026-09-25.json) folgt dem neueren Stand. */
  defizitProzentBip: 3.5,
  zinsenProzentBip: 3.5,
  /** Rund eine Milliarde Lira entspricht so viel BIP: 1 % des BIP ≈ 783 Mrd. Lira, abgeleitet aus Zinsausgaben und deren BIP-Anteil */
  mrdProProzentBip: 783,
  quellen: [
    { name: "Forbes Türkiye, „2026 bütçesi 18,9 trilyon TL“ (Ausgaben nach Arten)", url: "https://www.forbes.com.tr/ekonomi/2026-butcesi-18-9-trilyon-tl" },
    { name: "Tez-Koop-İş, „2026 Bütçesinde Harcamalar ve Vergiler“ (Steuern nach Arten, SGK-Übertragungen)", url: "https://tezkoopis.org/2026-butcesinde-harcamalar-ve-vergiler-2026-yili-merkezi-yonetim-butcesinin-analizi-2/" },
    { name: "Daily Sabah, „Türkiye presents 2026 draft budget“ (Steuereinnahmen, Zinsen, Defizit)", url: "https://www.dailysabah.com/business/economy/turkiye-presents-2026-draft-budget-reaffirms-disinflation-goal" },
  ],
  hinweis: "Die Quellen weichen bei einzelnen Summen leicht ab; die Zeilen addieren sich zu den 18,9 Billionen Lira des Haushaltsgesetzes. Wie viel des BIP eine Milliarde Lira ist, ist aus den Zinsausgaben abgeleitet und nur eine Größenordnung.",
} as const;

/** Der Durchschnittszins auf die Schuld beim Start: Zinsausgaben (3,5 % des BIP) geteilt durch die Schuldenquote (23,8 % des BIP). */
export const ZINSSATZ_START = (PLAN_2026.zinsenProzentBip / 23.8) * 100;

// ---------------------------------------------------------------------------
// Ressortetats (Haushalt wie in Democracy: ein Regler je Ressort). Das Haushaltsgesetz 2026 liegt hier nur nach ökonomischen Arten vor
// (Personal, Übertragungen, Investitionen …), nicht nach Aufgaben. Wo sich ein Startanteil aus diesen Zeilen ableiten lässt, steht
// „abgeleitet“; alle übrigen Startanteile, Schrittweiten, Spannen und Reifezeiten sind Spielparameter (zu prüfen gegen die funktionale
// Gliederung, TÜİK COFOG / Muhasebat „fonksiyonel sınıflandırma“). Ein Etat steht in Prozent des BIP und gleicht die Inflation so von selbst aus.

export interface RessortDaten {
  id: string;
  /** Etat beim Start in % des BIP */
  startBip: number;
  /** % des BIP je Reglerstufe; negativ, wenn eine höhere Stufe Ausgaben spart (Renteneintrittsalter) */
  schritt: number;
  /** Spanne des Reglers in Stufen (0 = Haushaltsgesetz 2026) */
  min: number;
  max: number;
  /** Monate, bis eine Änderung voll wirkt (Ausbildung, Bau, Beschaffung); Spielparameter */
  reifeMonate: number;
  beleg: string;
}

const SPIEL = "Spielparameter, zu prüfen (funktionale Gliederung des Haushalts, TÜİK COFOG)";

export const RESSORTS_2026: RessortDaten[] = [
  { id: "rentenniveau", startBip: Math.round((2329 / PLAN_2026.mrdProProzentBip) * 10) / 10, schritt: 0.2, min: -5, max: 5, reifeMonate: 2, beleg: "abgeleitet: SGK-Zuschuss 2.329 Mrd. Lira im Haushaltsgesetz 2026 (Tez-Koop-İş); Stufenkosten Spielparameter" },
  { id: "rentenalter", startBip: 0, schritt: -0.15, min: -3, max: 5, reifeMonate: 12, beleg: "Spielparameter; Gesetz Nr. 5510 hebt das Regelalter bis 2048 stufenweise auf 65 (zu prüfen)" },
  { id: "sozialhilfe", startBip: 1, schritt: 0.2, min: -4, max: 8, reifeMonate: 3, beleg: SPIEL },
  { id: "gesundheit", startBip: 1, schritt: 0.2, min: -4, max: 8, reifeMonate: 12, beleg: SPIEL },
  { id: "bildung", startBip: 3, schritt: 0.2, min: -4, max: 10, reifeMonate: 36, beleg: SPIEL },
  { id: "forschung", startBip: 0.4, schritt: 0.1, min: -3, max: 12, reifeMonate: 24, beleg: SPIEL },
  { id: "verteidigung", startBip: 1.9, schritt: 0.2, min: -4, max: 12, reifeMonate: 12, beleg: SPIEL },
  { id: "innere_sicherheit", startBip: 1, schritt: 0.1, min: -4, max: 8, reifeMonate: 6, beleg: SPIEL },
  { id: "investitionen", startBip: Math.round((1312 / PLAN_2026.mrdProProzentBip) * 10) / 10, schritt: 0.4, min: -3, max: 6, reifeMonate: 9, beleg: "abgeleitet: Investitionsausgaben 1.312 Mrd. Lira im Haushaltsgesetz 2026 (Forbes Türkiye)" },
  { id: "wohnen", startBip: 0.3, schritt: 0.1, min: -3, max: 8, reifeMonate: 18, beleg: SPIEL },
  { id: "landwirtschaft", startBip: 0.5, schritt: 0.1, min: -4, max: 6, reifeMonate: 12, beleg: SPIEL },
  { id: "umwelt_energie", startBip: 0.3, schritt: 0.1, min: -3, max: 8, reifeMonate: 24, beleg: SPIEL },
  { id: "kultur", startBip: 0.2, schritt: 0.05, min: -3, max: 6, reifeMonate: 6, beleg: SPIEL },
  { id: "personal", startBip: Math.round((5507 / PLAN_2026.mrdProProzentBip) * 10) / 10, schritt: 0.4, min: -4, max: 4, reifeMonate: 1, beleg: "abgeleitet: Personalausgaben 5.507 Mrd. Lira im Haushaltsgesetz 2026 (Forbes Türkiye); überschneidet sich mit den Fachressorts" },
  { id: "subventionen", startBip: 0.8, schritt: 0.4, min: -2, max: 4, reifeMonate: 1, beleg: SPIEL },
];

export const RESSORT_NACH_ID: Record<string, RessortDaten> = Object.fromEntries(RESSORTS_2026.map((r) => [r.id, r]));

/** Renten wie in Democracy: zwei Stellgrößen mit eigener Einheit. Startwerte sind Spielparameter (zu prüfen: OECD Pensions at a Glance, Gesetz Nr. 5510). */
export const RENTE_START = {
  /** Bruttorente in % des Durchschnittslohns */
  niveauProzent: 60,
  /** Prozentpunkte je Stufe */
  niveauJeStufe: 2,
  /** Durchschnittliches tatsächliches Renteneintrittsalter in Jahren */
  alterJahre: 60,
  alterJeStufe: 1,
} as const;

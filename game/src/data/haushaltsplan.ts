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

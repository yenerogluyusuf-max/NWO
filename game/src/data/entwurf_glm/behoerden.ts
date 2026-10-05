// Datenentwurf GLM: MIT und Behörden (zu RECHERCHE_GLM_5, Thema 5).
// Diese Datei wird NICHT vom Spiel geladen; der Behörden-/Sicherheits-Strang übernimmt die
// Behördenzustände als Vorgabewerte. Reine Funktionen ohne Importe aus sim/.
// Grundregel (Auftrag): Das MIT ist eine WORTGRÖSSE — der Spieler sieht Zahlen nie, auch seine nicht.
// Alle Zahlen sind belegt mit Quelle oder ausdrücklich Spielparameter.

// ---------------------------------------------------------------------------
// Typen

/** Eine Behörde mit sichtbarer Kapazität (Justiz, Polizei, AFAD, GİB, Küstenwache). */
export interface Behörde {
  id: string;
  name: string;
  /** Personalstand (belegt, mit Quelle; sonst Spielparameter) */
  personal: { wert: number; quelle?: string };
  /** Etat in Mrd. TL, wo belegt */
  etatMrd?: number;
  etatQuelle?: string;
  /** Kapazitätskennzahl mit Einheit (z. B. "Fälle je Richter je Jahr", "Belegung %") */
  kennzahl: { name: string; wert: number; grenze: number; einheit: string };
  /** Monate bis ein Personalausbau wirkt (Spielparameter) */
  ausbauMonate: number;
  /** Maßnahmen-IDs im Netz, die diese Behörde steuern */
  hebelIds: string[];
}

/** MIT: Wortgrößen statt Zahlen. */
export type MitUmfang = "gedrosselt" | "gehalten" | "ausgebaut";
export type MitSchwerpunkt = "ausland" | "inland" | "cyber" | "grenze";
export type MitKontrolle = "geschlossen" | "unterausschuss" | "volle_berichtspflicht";

// ---------------------------------------------------------------------------
// Belegte Behördenstände (siehe RECHERCHE_GLM_5 Abschnitt 2)

export const BEHOERDEN: Behörde[] = [
  {
    id: "justiz",
    name: "Justiz (Gerichte und Staatsanwaltschaften)",
    personal: { wert: 24641, quelle: "HSK Faaliyet Raporu 2024; Dez. 2025: 25.449" },
    etatMrd: 389.5,
    etatQuelle: "Budgetbereinigung 2025 (bianet-Auswertung); Finaltext prüfen",
    kennzahl: { name: "Verfahren je Richter je Jahr", wert: 454, grenze: 400, einheit: "Fälle" },
    ausbauMonate: 24,
    hebelIds: ["m_richterstellen", "m_justizreform", "m_haftvermeidung", "m_richterrat"],
  },
  {
    id: "polizei",
    name: "Polizei (Emniyet) mit Jandarma und Küstenwache",
    personal: { wert: 300000, quelle: "Emniyet ~276–294 Tsd. (2019er Basis) + Zulauf 2024; Jandarma/Sahil Güvenlik teils Schätzung" },
    etatMrd: 76.3,
    etatQuelle: "İçişleri-Budget 2026 (Kommissionsbeschluss Nov. 2025)",
    kennzahl: { name: "Einsatzdichte-Index", wert: 55, grenze: 70, einheit: "Index" },
    ausbauMonate: 12,
    hebelIds: ["m_polizei", "m_polizeitechnik"],
  },
  {
    id: "afad",
    name: "Katastrophenschutz (AFAD)",
    personal: { wert: 8541, quelle: "AFAD über TRT; SAR-Kader 3.529; Potential inkl. Freiwillige 152.000 (2023)" },
    kennzahl: { name: "Rettungspotential-Index", wert: 50, grenze: 80, einheit: "Index" },
    ausbauMonate: 18,
    hebelIds: ["m_afad_ausbau", "m_fruehwarnsystem"],
  },
  {
    id: "gib",
    name: "Steuerverwaltung (GİB, Prüfende)",
    personal: { wert: 7296, quelle: "Vergi Denetim Kurulu 2024: 7.296 Prüfende bei 15.582 Stellen (Eğilmez, Aug. 2025)" },
    kennzahl: { name: "Schattenwirtschaft", wert: 28.7, grenze: 15, einheit: "% BIP" },
    ausbauMonate: 30,
    hebelIds: ["m_steuerfahndung", "m_verwaltungsdigital"],
  },
];

/** Gefängnisse: eigene Größe, weil die Belegung eine eigene Härte trägt. */
export const GEFANGNISSE_2024 = {
  insassen: 371587,
  davonUntersuchungshaft: 55890,
  kapazität: 299000,
  anstalten: 406,
  belegungProzent: 124,
  stichtag: "1.11.2024",
  quelle: "Adalet Bakanlığı CİK-Bulletin 2024; spätere Werte 427.525/433.520 — Stichtag im Spiel festlegen (TÜİK 2024: 434.681)",
};

/** Justiz-Verfahrenszahlen (belegt). */
export const JUSTIZ_ZAHLEN_2024 = {
  neueErmittlungsverfahren: 11661519, // 2015: 7.183.711
  anhängigBeiStaatsanwaltschaften: 5929000,
  entscheidungen: 10960177, // Nov. 2024
  bamStrafverfahren: 4062898, // Sept. 2024
  yargitayEingänge: 449000,
  richterSavcı: 24641, // Dez. 2025: 25.449; 2002: 9.349
  quelle: "HSK 2024, Adli Sicil ve İstatistik, Ministerangaben",
};

/** Schattenwirtschaft und Steuergrab (belegt). */
export const SCHATTENWIRTSCHAFT = {
  anteilBipProzent: 28.7, // 2025er-Schätzung (hepsiveri); HMB-Anker: Entwicklungsländer ~30 %
  steuergrabMrd: 500, // Budgetbegründung 2026: über 500 Mrd. TL je Jahr
  quelle: "hepsiveri-Auswertung; HMB Aktionsplan 2023–2025; TBMM-Budget 2026",
};

// ---------------------------------------------------------------------------
// MIT: Wortgrößen (RECHERCHE_GLM_5 Abschnitt 5.1)

export interface MitZustand {
  umfang: MitUmfang;
  schwerpunkt: MitSchwerpunkt;
  kontrolle: MitKontrolle;
}

/** Wirkung der MIT-Stufen in Wortstufen (keine Zahlen im Spiel). */
export function mitWirkung(z: MitZustand): { reichweite: string; kontrollverlustRisiko: string; legitimitätseffekt: string; hinweis: string } {
  const reichweite =
    z.umfang === "ausgebaut" ? "weit über die Grenzen hinaus" : z.umfang === "gehalten" ? "wie bisher" : "nahe an Kernaufgaben";
  const risiko =
    z.umfang === "ausgebaut" && z.kontrolle === "geschlossen"
      ? "hoch: Überraschungen kommen, die niemand bestellt hat"
      : z.umfang === "ausgebaut"
        ? "mittel: Berichte dämpfen, erfassen aber nicht alles"
        : "niedrig";
  const legitimität =
    z.kontrolle === "volle_berichtspflicht"
      ? "Legitimität steigt, Reichweite schrumpft"
      : z.kontrolle === "unterausschuss"
        ? "Legitimität leicht besser, Reichweite leicht gedämpft"
        : "keine Legitimitätswirkung, volle Reichweite";
  const hinweis =
    z.kontrolle === "geschlossen" && z.umfang === "ausgebaut"
      ? "Der Dienst arbeitet im Dunkeln; der Präsident erfährt von Operationen, wenn sie die Zeitung erreichen."
      : "Der Dienst weiß, dass Berichte ankommen; Überraschungen bleiben seltener.";
  return { reichweite, kontrollverlustRisiko: risiko, legitimitätseffekt: legitimität, hinweis };
}

// ---------------------------------------------------------------------------
// Reine Rechnungen

/** Kapazitätsdruck einer Behörde: wie weit die Kennzahl über/unter der Grenze liegt (−100 bis +100 Wortskala). */
export function kapazitätsdruck(b: Behörde): number {
  const { wert, grenze } = b.kennzahl;
  const basis = b.id === "gib" || b.id === "justiz" ? wert / grenze : grenze / wert; // hoch=schlecht bei Falllast und Schattenwirtschaft
  return Math.round(Math.max(-100, Math.min(100, (basis - 1) * 100)));
}

/** Personalausbau wirkt nach `ausbauMonate` und senkt den Druck mit Verzug (Spielparameter-Kurve). */
export function ausbauWirkung(b: Behörde, monateLaufend: number, personalZuwachsProzent: number): { druckneu: number; text: string } {
  if (monateLaufend < b.ausbauMonate) {
    return { druckneu: kapazitätsdruck(b), text: "Der Zuwachs ist beschlossen und angekommen — die Wirkung braucht noch Zeit." };
  }
  const relief = Math.min(60, personalZuwachsProzent * 1.2); // Spielparameter: 1 % mehr Personal entspannt bis zu 1,2 Punkte Druck
  const rampe = Math.min(1, (monateLaufend - b.ausbauMonate) / 12);
  return { druckneu: Math.round(kapazitätsdruck(b) * (1 - relief / 100 * rampe)), text: "Die Kapazität ist angewachsen; der Druck zeigt es." };
}

/** Justiz-Rückstand: wächst mit Verfahrenszuwachs, schrumpft mit Stellen (kalibriert an den belegten Werten). */
export function justizRückstand(richter: number, neueVerfahrenJeJahr: number): { fälleJeRichter: number; ampel: "grün" | "gelb" | "rot"; text: string } {
  const jeRichter = Math.round(neueVerfahrenJeJahr / Math.max(1, richter));
  const ampel = jeRichter >= 550 ? "rot" : jeRichter >= 450 ? "gelb" : "grün";
  return {
    fälleJeRichter: jeRichter,
    ampel,
    text: ampel === "rot"
      ? "Die Justiz erstickt in Akten; Wirtschaft und Rechtssicherheit zahlen dafür."
      : ampel === "gelb"
        ? "Der Rückstand wächst langsamer als die Verfahren; das reicht nicht zum Entlasten."
        : "Die Justiz arbeitet die Fälle in akzeptabler Zeit ab.",
  };
}

/** Gefängnisbelegung mit Ampel (belegte Ausgangslage 124 %). */
export function gefängnisAmpel(insassen: number, kapazität: number): { belegungProzent: number; ampel: "grün" | "gelb" | "rot"; text: string } {
  const prozent = Math.round((insassen / Math.max(1, kapazität)) * 100);
  const ampel = prozent >= 130 ? "rot" : prozent >= 110 ? "gelb" : "grün";
  return {
    belegungProzent: prozent,
    ampel,
    text: ampel === "rot"
      ? `Die Anstalten halten ${prozent} % der Kapazität; das ist eine Humanitäts- und EU-Kapitelfrage.`
      : ampel === "gelb"
        ? `Belegung ${prozent} %: drüber, aber handhabbar mit Haftvermeidung.`
        : `Belegung ${prozent} %: im Rahmen.`,
  };
}

/** Steuergrab-Sensitivität: mehr Prüfende senken die Schattenwirtschaft mit Verzug (Spielparameter-Elastizität). */
export function steuerGrabNeu(prüfende: number, monate: number): { anteilProzent: number; mehreinnahmenMrd: number } {
  const basis = SCHATTENWIRTSCHAFT.anteilBipProzent;
  const relief = Math.min(10, (prüfende / 7296 - 1) * 5) * Math.min(1, monate / 30); // Spielparameter: Verdopplung senkt bis 5 Punkte nach 30 Monaten
  const anteil = Math.max(12, basis - relief);
  return {
    anteilProzent: Math.round(anteil * 10) / 10,
    mehreinnahmenMrd: Math.round((basis - anteil) * 26), // 1 % Schattenwirtschaft ≈ 26 Mrd. TL Steuern (Spielparameter aus dem 500-Mrd.-Grab)
  };
}

/** AFAD-Resilienz: Eigenkader + SAR-Kader + Freiwilligennetz als Wortstufe (belegte Anker). */
export function afadStufe(eigenkader: number, sarKader: number, freiwilligeMio: number): { stufe: "Basis" | "Ausbau" | "Übungsregel" | "Vollausbau"; text: string } {
  const score = eigenkader / 8541 + sarKader / 3529 + freiwilligeMio / 1.6;
  const stufe = score >= 3 ? "Vollausbau" : score >= 2 ? "Übungsregel" : score >= 1.2 ? "Ausbau" : "Basis";
  return {
    stufe,
    text: stufe === "Vollausbau"
      ? "Der Katastrophenschutz ist landesweit krisenfest; Beben treffen mit gedämpfter Wucht."
      : stufe === "Basis"
        ? "Der Katastrophenschutz ist klein; jedes Beben wird ein Entscheidungsnotstand."
        : "Der Katastrophenschutz wächst; die Kette der Rettung verkürzt sich.",
  };
}

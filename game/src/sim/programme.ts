// Regierungsprogramme: Ketten von Schritten mit einer Bedingung in der Wirklichkeit, einer Dauer und einer Belohnung.
// Wer ein Programm verfolgt, hat einen Plan für Jahre: Der Schritt verlangt echte Politik (eine Maßnahme auf einer Stufe, ein gelöstes
// Problem), dann braucht er Kapital und Zeit, und danach wirkt er dauerhaft. Alle Zahlen sind Spielparameter, keine Tatsachen.

import { NET } from "./modell";
import { PROVINCES, nationalAverage, startAverage } from "./netz";
import { wirke, vertrauenAendern } from "./wirkung";
import { addLog } from "./log";
import { clamp } from "./economy";
import type { World } from "./types";
import { kannZahlen } from "./kapital";
import { AUFMERKSAMKEIT_KOSTEN, neuanfangGrund, verbrauche } from "./aufmerksamkeit";

export type Bedingung =
  | { art: "massnahme"; id: string; min: number }
  | { art: "massnahme-max"; id: string; max: number }
  | { art: "groesse"; id: string; min?: number; max?: number }
  | { art: "problem"; id: string; maxProvinzen: number }
  | { art: "inflation"; max: number }
  | { art: "ruhe-zentralbank"; tage: number }
  | { art: "keine" };

export interface Schritt {
  id: string;
  titel: string;
  /** Was der Schritt bedeutet, in einem Satz */
  text: string;
  voraus: string[];
  bedingung: Bedingung[];
  kapital: number;
  tage: number;
  /** Was danach gilt, in einem Satz für die Oberfläche */
  ergebnis: string;
  /** Wirkung beim Abschluss */
  wirkung: (w: World) => void;
  /** Dauerhafter Rabatt auf die Kapitalkosten von Maßnahmen eines Themas (0 bis 1) */
  rabatt?: { thema: string; anteil: number };
  /** Dauerhafter Schutz: Faktor auf die Stärke bestimmter Ereignisse */
  schutz?: { ereignis: string; faktor: number };
  /** Belohnung in Kapital */
  bonusKapital?: number;
  /** Abschluss des Programms */
  vermaechtnis?: boolean;
}

export interface Programm {
  id: string;
  titel: string;
  leitbild: string;
  schritte: Schritt[];
}

const kein: Bedingung[] = [{ art: "keine" }];

export const PROGRAMME: Programm[] = [
  {
    id: "erdbeben",
    titel: "Wiederaufbau und Erdbebenschutz",
    leitbild: "Nie wieder eingestürzte Häuser: erst wissen, was gefährdet ist, dann prüfen, umsiedeln und einen Katastrophenschutz aufbauen.",
    schritte: [
      { id: "erdbeben1", titel: "Gefährdete Gebäude erfassen", text: "Ein Kataster zeigt, welche Häuser einer Bebenlast nicht standhalten.", voraus: [], bedingung: kein, kapital: 3, tage: 30, ergebnis: "Erdbebenvorsorge +3, Bauqualität +1", wirkung: (w) => { wirke(w, "erdbebenvorsorge", 3); wirke(w, "bauqualitaet", 1); } },
      { id: "erdbeben2", titel: "Unabhängige Bauprüfer", text: "Statik und Material prüfen Fachleute, die vom Bauherrn unabhängig sind.", voraus: ["erdbeben1"], bedingung: [{ art: "massnahme", id: "m_bauaufsicht", min: 60 }], kapital: 4, tage: 45, ergebnis: "Bauqualität +4; Wohnen kostet 15 % weniger Kapital", wirkung: (w) => wirke(w, "bauqualitaet", 4), rabatt: { thema: "wohnen", anteil: 0.15 } },
      { id: "erdbeben3", titel: "Sichere Umsiedlung", text: "Wer in einem gefährdeten Haus wohnt, bekommt ein sicheres angeboten, nicht nur einen Abrissbescheid.", voraus: ["erdbeben2"], bedingung: [{ art: "massnahme", id: "m_stadterneuerung", min: 60 }], kapital: 5, tage: 60, ergebnis: "Erdbebenvorsorge +5, Wohnungsbau +2", wirkung: (w) => { wirke(w, "erdbebenvorsorge", 5); wirke(w, "wohnungsbau", 2); } },
      { id: "erdbeben4", titel: "Katastrophenschutzbehörde", text: "Eine Behörde koordiniert Rettung, Notunterkünfte und Wiederaufbau, bevor das nächste Beben kommt.", voraus: ["erdbeben2"], bedingung: [{ art: "massnahme-max", id: "m_bauamnestie", max: 20 }], kapital: 5, tage: 60, ergebnis: "Erdbeben treffen das Land nur noch mit 70 % ihrer Stärke", wirkung: (w) => vertrauenAendern(w, 1), schutz: { ereignis: "erdbeben", faktor: 0.7 } },
      { id: "erdbeben5", titel: "Ein Land, das dem Beben standhält", text: "In den Erdbebengebieten steht kaum noch ein Haus, dem man nicht traut.", voraus: ["erdbeben3", "erdbeben4"], bedingung: [{ art: "problem", id: "p_erdbebengefahr", maxProvinzen: 8 }], kapital: 6, tage: 90, ergebnis: "Kapital +10, Vertrauen +3", wirkung: (w) => vertrauenAendern(w, 3), bonusKapital: 10, vermaechtnis: true },
    ],
  },
  {
    id: "preise",
    titel: "Preisstabilität",
    leitbild: "Die Lira wieder wertvoll machen: Haushaltsdisziplin, Steuern einziehen statt erhöhen und eine Zentralbank, die in Ruhe arbeitet.",
    schritte: [
      { id: "preise1", titel: "Haushaltsdisziplin verkünden", text: "Der Präsident legt sich öffentlich auf einen soliden Haushalt fest.", voraus: [], bedingung: kein, kapital: 3, tage: 30, ergebnis: "Vertrauen der Märkte +3, Risikoaufschlag −15", wirkung: (w) => { wirke(w, "vertrauen_maerkte", 3); w.economy.riskPremium = Math.max(100, w.economy.riskPremium - 15); w.economy.credibility = clamp(w.economy.credibility + 0.02, 0.05, 0.95); } },
      { id: "preise2", titel: "Steuern einziehen statt erhöhen", text: "Mehr Prüfer, digitale Steuerverwaltung: Wer zahlen muss, zahlt.", voraus: ["preise1"], bedingung: [{ art: "massnahme", id: "m_steuerfahndung", min: 55 }], kapital: 4, tage: 45, ergebnis: "Steuereinnahmen +3, Steuermoral +2; Haushalt kostet 15 % weniger Kapital", wirkung: (w) => { wirke(w, "steuereinnahmen", 3); wirke(w, "steuermoral", 2); }, rabatt: { thema: "haushalt", anteil: 0.15 } },
      { id: "preise3", titel: "Die Zentralbank in Ruhe lassen", text: "Ein halbes Jahr ohne öffentliche Angriffe auf die Zentralbank: Die Märkte merken es.", voraus: ["preise1"], bedingung: [{ art: "ruhe-zentralbank", tage: 180 }], kapital: 3, tage: 60, ergebnis: "Glaubwürdigkeit +5 %, Risikoaufschlag −25", wirkung: (w) => { w.economy.credibility = clamp(w.economy.credibility + 0.05, 0.05, 0.95); w.economy.riskPremium = Math.max(100, w.economy.riskPremium - 25); } },
      { id: "preise4", titel: "Die Teuerung bricht", text: "Die Inflation fällt unter 22 Prozent: Erstmals seit Langem sinken die Preise nicht nur im Bericht.", voraus: ["preise2"], bedingung: [{ art: "inflation", max: 22 }], kapital: 4, tage: 45, ergebnis: "Lebenshaltung −2, Vertrauen der Märkte +2", wirkung: (w) => { wirke(w, "lebenshaltung", -2); wirke(w, "vertrauen_maerkte", 2); } },
      { id: "preise5", titel: "Zweistellige Inflation ist Vergangenheit", text: "Die Inflation liegt unter 15 Prozent und bleibt dort.", voraus: ["preise3", "preise4"], bedingung: [{ art: "inflation", max: 15 }], kapital: 6, tage: 90, ergebnis: "Kapital +10, Vertrauen +3", wirkung: (w) => vertrauenAendern(w, 3), bonusKapital: 10, vermaechtnis: true },
    ],
  },
  {
    id: "regionen",
    titel: "Starke Regionen",
    leitbild: "Ein Land ohne Hinterland: Straßen, Bahn und Internet bis ins Dorf, damit niemand für Arbeit wegziehen muss.",
    schritte: [
      { id: "regionen1", titel: "Straßen und Brücken", text: "Das Straßennetz wird dort ausgebaut, wo es fehlt.", voraus: [], bedingung: [{ art: "massnahme", id: "m_autobahnen", min: 60 }], kapital: 3, tage: 45, ergebnis: "Straßen und Autobahnen +2", wirkung: (w) => wirke(w, "verkehrsnetz", 2) },
      { id: "regionen2", titel: "Bahn und Häfen", text: "Güter auf die Schiene, Häfen ans Netz.", voraus: ["regionen1"], bedingung: [{ art: "massnahme", id: "m_bahn", min: 55 }], kapital: 4, tage: 60, ergebnis: "Logistik +3, Exportstärke +1", wirkung: (w) => { wirke(w, "logistik", 3); wirke(w, "export", 1); } },
      { id: "regionen3", titel: "Breitband bis ins Dorf", text: "Wer auf dem Land wohnt, arbeitet auch dort.", voraus: ["regionen1"], bedingung: [{ art: "massnahme", id: "m_breitband", min: 60 }], kapital: 4, tage: 45, ergebnis: "Internet +3, Landflucht −2", wirkung: (w) => { wirke(w, "internet", 3); wirke(w, "landflucht", -2); } },
      { id: "regionen4", titel: "Regionale Wachstumszentren", text: "Förderung gebündelt in Provinzen, die sonst abgehängt bleiben.", voraus: ["regionen2", "regionen3"], bedingung: [{ art: "massnahme", id: "m_regionalfoerderung", min: 65 }], kapital: 5, tage: 60, ergebnis: "Regionales Wachstum +4; Infrastruktur kostet 15 % weniger Kapital", wirkung: (w) => wirke(w, "wachstum_regional", 4), rabatt: { thema: "infrastruktur", anteil: 0.15 } },
      { id: "regionen5", titel: "Ein Land ohne Hinterland", text: "Kaum noch eine Provinz verliert ihre Jungen an die Städte.", voraus: ["regionen4"], bedingung: [{ art: "problem", id: "p_landflucht", maxProvinzen: 5 }], kapital: 6, tage: 90, ergebnis: "Kapital +10, Vertrauen +3", wirkung: (w) => vertrauenAendern(w, 3), bonusKapital: 10, vermaechtnis: true },
    ],
  },
  {
    id: "gesundheit",
    titel: "Gesundheit für alle",
    leitbild: "Eine Ärztin im Ort, ein Bett im Krankenhaus, kurze Wartezeiten: Gesundheit darf keine Frage der Provinz sein.",
    schritte: [
      { id: "gesundheit1", titel: "Hausarztmodelle", text: "Familienärzte als erste Anlaufstelle entlasten die Kliniken.", voraus: [], bedingung: [{ art: "massnahme", id: "m_hausarzt", min: 55 }], kapital: 3, tage: 45, ergebnis: "Wartezeiten −3", wirkung: (w) => wirke(w, "wartezeiten", -3) },
      { id: "gesundheit2", titel: "Ärzte im Land halten", text: "Bessere Bezahlung und Bedingungen halten Ärztinnen und Ärzte im Land.", voraus: [], bedingung: [{ art: "massnahme", id: "m_aerztegehalt", min: 55 }], kapital: 4, tage: 45, ergebnis: "Ärzte im Land +3, Abwanderung −1", wirkung: (w) => { wirke(w, "aerzte", 3); wirke(w, "abwanderung", -1); } },
      { id: "gesundheit3", titel: "Das Krankenhausnetz", text: "Neue Häuser dort, wo die nächste Klinik zu weit weg ist.", voraus: ["gesundheit1"], bedingung: [{ art: "massnahme", id: "m_krankenhausbau", min: 65 }], kapital: 5, tage: 60, ergebnis: "Gesundheitsversorgung +4; Gesundheit kostet 15 % weniger Kapital", wirkung: (w) => wirke(w, "gesundheitsversorgung", 4), rabatt: { thema: "gesundheit", anteil: 0.15 } },
      { id: "gesundheit4", titel: "Ärztemangel überwunden", text: "In keiner Provinz fehlt es mehr an Ärzten.", voraus: ["gesundheit2", "gesundheit3"], bedingung: [{ art: "problem", id: "p_aerztemangel", maxProvinzen: 3 }], kapital: 6, tage: 90, ergebnis: "Kapital +10, Vertrauen +3", wirkung: (w) => vertrauenAendern(w, 3), bonusKapital: 10, vermaechtnis: true },
    ],
  },
  {
    id: "recht",
    titel: "Rechtsstaat und Vertrauen",
    leitbild: "Wer dem Staat vertraut, zahlt Steuern und geht wählen: offene Vergaben, unabhängige Richter und Medien, die fragen dürfen.",
    schritte: [
      { id: "recht1", titel: "Öffentliche Vergaben", text: "Jede große Vergabe ist einsehbar, jedes Vermögen erklärt.", voraus: [], bedingung: [{ art: "massnahme", id: "m_antikorruption", min: 55 }], kapital: 3, tage: 45, ergebnis: "Korruption −3, Vertrauen in die Justiz +2", wirkung: (w) => { wirke(w, "korruption", -3); wirke(w, "justizvertrauen", 2); } },
      { id: "recht2", titel: "Ein Richterrat", text: "Richter ernennt ein Rat aus Richtern, nicht die Regierung.", voraus: ["recht1"], bedingung: [{ art: "massnahme", id: "m_justizreform", min: 55 }], kapital: 5, tage: 60, ergebnis: "Rechtssicherheit +4, Vertrauen in die Justiz +3", wirkung: (w) => { wirke(w, "rechtssicherheit", 4); wirke(w, "justizvertrauen", 3); } },
      { id: "recht3", titel: "Medien, die fragen dürfen", text: "Die Aufsicht greift nur noch bei Straftaten ein.", voraus: ["recht1"], bedingung: [{ art: "massnahme-max", id: "m_medienaufsicht", max: 50 }], kapital: 4, tage: 45, ergebnis: "Pressefreiheit +4, Zivilgesellschaft +2", wirkung: (w) => { wirke(w, "pressefreiheit", 4); wirke(w, "zivilgesellschaft", 2); } },
      { id: "recht4", titel: "Ein Staat, dem man traut", text: "Korruption ist die Ausnahme, und die Justiz gilt als unabhängig.", voraus: ["recht2", "recht3"], bedingung: [{ art: "groesse", id: "justizvertrauen", min: 55 }, { art: "groesse", id: "korruption", max: 40 }], kapital: 6, tage: 90, ergebnis: "Kapital +10, Vertrauen +3", wirkung: (w) => vertrauenAendern(w, 3), bonusKapital: 10, vermaechtnis: true },
    ],
  },
  {
    id: "wasserenergie",
    titel: "Wasser und Energie der Zukunft",
    leitbild: "Sauberes Wasser aus dem Hahn, Strom, der nicht ausfällt, und eine Energieversorgung, die nicht am Preis des Auslands hängt.",
    schritte: [
      { id: "wasser1", titel: "Trinkwassernetze", text: "Leitungen und Kläranlagen dort, wo das Wasser knapp ist.", voraus: [], bedingung: [{ art: "massnahme", id: "m_wasserleitungen", min: 55 }], kapital: 3, tage: 45, ergebnis: "Wasserversorgung +3", wirkung: (w) => wirke(w, "wasserversorgung", 3) },
      { id: "wasser2", titel: "Bewässerung und Speicher", text: "Tropfbewässerung spart, Speicher puffern die Trockenzeit.", voraus: ["wasser1"], bedingung: [{ art: "massnahme", id: "m_bewaesserung", min: 55 }], kapital: 4, tage: 60, ergebnis: "Dürre −3, Ernte +2; Landwirtschaft kostet 15 % weniger Kapital", wirkung: (w) => { wirke(w, "duerre", -3); wirke(w, "ernte", 2); }, rabatt: { thema: "landwirtschaft", anteil: 0.15 } },
      { id: "wasser3", titel: "Sonne und Wind", text: "Ausschreibungen für erneuerbaren Strom senken die Importe.", voraus: [], bedingung: [{ art: "massnahme", id: "m_solar_wind", min: 60 }], kapital: 4, tage: 60, ergebnis: "Erneuerbare +4, Energieimporte −2", wirkung: (w) => { wirke(w, "erneuerbare", 4); wirke(w, "energieimporte", -2); } },
      { id: "wasser4", titel: "Stromnetz und Speicher", text: "Leitungen und Batterien halten den Strom im Netz, wenn der Wind sich legt.", voraus: ["wasser3"], bedingung: [{ art: "massnahme", id: "m_netzausbau", min: 60 }], kapital: 4, tage: 60, ergebnis: "Stromversorgung +4; Energie kostet 15 % weniger Kapital", wirkung: (w) => wirke(w, "stromversorgung", 4), rabatt: { thema: "energie", anteil: 0.15 } },
      { id: "wasser5", titel: "Wasser und Strom sind sicher", text: "Kein akuter Wassermangel, keine akuten Stromausfälle.", voraus: ["wasser2", "wasser4"], bedingung: [{ art: "problem", id: "p_wassermangel", maxProvinzen: 3 }, { art: "problem", id: "p_stromausfaelle", maxProvinzen: 3 }], kapital: 6, tage: 90, ergebnis: "Kapital +10, Vertrauen +3", wirkung: (w) => vertrauenAendern(w, 3), bonusKapital: 10, vermaechtnis: true },
    ],
  },
  {
    id: "sicherheit",
    titel: "Sicherheit und Frieden",
    leitbild: "Sicher leben, ohne dass Sicherheit zum Vorwand wird: moderne Behörden, gesicherte Grenzen und ein Friedensprozess, der hält.",
    schritte: [
      { id: "sicherheit1", titel: "Moderne Sicherheitsverwaltung", text: "Forensik, digitale Akten, abgestimmte Behörden.", voraus: [], bedingung: [{ art: "massnahme", id: "m_polizeitechnik", min: 50 }], kapital: 3, tage: 45, ergebnis: "Kriminalität −2", wirkung: (w) => wirke(w, "kriminalitaet", -2) },
      { id: "sicherheit2", titel: "Grenzen sichern", text: "Technik und Personal an den Übergängen, nicht nur Mauern.", voraus: ["sicherheit1"], bedingung: [{ art: "massnahme", id: "m_grenzschutz", min: 65 }], kapital: 4, tage: 60, ergebnis: "Terrorgefahr −3", wirkung: (w) => wirke(w, "terrorgefahr", -3) },
      { id: "sicherheit3", titel: "Ein Friedensprozess, der hält", text: "Waffenabgabe, Wiedereingliederung, politische Teilhabe.", voraus: ["sicherheit1"], bedingung: [{ art: "massnahme", id: "m_friedensprozess", min: 65 }], kapital: 5, tage: 60, ergebnis: "Terrorgefahr −4, Polarisierung −2", wirkung: (w) => { wirke(w, "terrorgefahr", -4); wirke(w, "polarisierung", -2); } },
      { id: "sicherheit4", titel: "Ein Land, das sich sicher fühlt", text: "Terror und Kriminalität sind niedrig, und niemand fürchtet den Staat.", voraus: ["sicherheit2", "sicherheit3"], bedingung: [{ art: "groesse", id: "terrorgefahr", max: 40 }], kapital: 6, tage: 90, ergebnis: "Kapital +10, Vertrauen +3", wirkung: (w) => vertrauenAendern(w, 3), bonusKapital: 10, vermaechtnis: true },
    ],
  },
  {
    id: "welt",
    titel: "Die Türkei in der Welt",
    leitbild: "Partner statt Zuschauer: Brüssel und Washington im Gespräch, Handel ohne Wartezeiten und ein Umgang mit Geflüchteten, der trägt.",
    schritte: [
      { id: "welt1", titel: "Gespräche mit Brüssel", text: "Reformen gegen Visafreiheit und eine modernisierte Zollunion.", voraus: [], bedingung: [{ art: "massnahme", id: "m_eu_annaeherung", min: 50 }], kapital: 4, tage: 60, ergebnis: "Beziehungen zur EU +4", wirkung: (w) => wirke(w, "beziehungen_eu", 4) },
      { id: "welt2", titel: "Zoll ohne Wartezeit", text: "Digitale Abfertigung, nachvollziehbare Lieferketten.", voraus: [], bedingung: [{ art: "massnahme", id: "m_handelssysteme", min: 50 }], kapital: 3, tage: 45, ergebnis: "Exportstärke +3", wirkung: (w) => wirke(w, "export", 3) },
      { id: "welt3", titel: "Integration, die trägt", text: "Sprachkurse, Arbeitserlaubnis, Schulplätze.", voraus: [], bedingung: [{ art: "massnahme", id: "m_integration", min: 55 }], kapital: 4, tage: 60, ergebnis: "Migrationsdruck sinkt: Geflüchtete −3", wirkung: (w) => wirke(w, "gefluechtete", -3) },
      { id: "welt4", titel: "Ein Partner, den man ernst nimmt", text: "Brüssel und Washington rufen an, bevor sie entscheiden.", voraus: ["welt1", "welt2", "welt3"], bedingung: [{ art: "groesse", id: "beziehungen_eu", min: 55 }, { art: "groesse", id: "ansehen", min: 55 }], kapital: 6, tage: 90, ergebnis: "Kapital +10, Vertrauen +3", wirkung: (w) => vertrauenAendern(w, 3), bonusKapital: 10, vermaechtnis: true },
    ],
  },
];

const SCHRITT = new Map<string, { schritt: Schritt; programm: Programm }>();
for (const p of PROGRAMME) for (const s of p.schritte) SCHRITT.set(s.id, { schritt: s, programm: p });

export const MAX_LAUFEND = 2;

export interface ProgrammZustand {
  fertig: string[];
  laufend: { schritt: string; start: number; ende: number }[];
  /** Tag des letzten öffentlichen Angriffs auf die Zentralbank */
  zentralbankAngriff?: number;
}

export function programmZustand(w: World): ProgrammZustand {
  const spiel = w.spiel!;
  return (spiel.programm ??= { fertig: [], laufend: [] });
}

export interface BedingungsStand {
  bedingung: Bedingung;
  erfuellt: boolean;
  /** 0 bis 1 */
  fortschritt: number;
  text: string;
}

function anzahlAkut(w: World, id: string): number {
  const node = NET.nodes[NET.index.get(id)!]!;
  const i = NET.index.get(id)!;
  let n = 0;
  for (let p = 0; p < PROVINCES; p++) if (node.threshold && w.net.values[i * PROVINCES + p]! >= node.threshold) n++;
  return n;
}

const name = (id: string): string => NET.nodes[NET.index.get(id)!]!.name;

export function pruefeBedingung(w: World, b: Bedingung): BedingungsStand {
  switch (b.art) {
    case "keine":
      return { bedingung: b, erfuellt: true, fortschritt: 1, text: "Keine Voraussetzung" };
    case "massnahme": {
      const jetzt = nationalAverage(NET, w.net, b.id);
      const start = startAverage(NET, w.net, b.id);
      const f = start >= b.min ? 1 : clamp((jetzt - start) / (b.min - start), 0, 1);
      return { bedingung: b, erfuellt: jetzt >= b.min - 0.5, fortschritt: f, text: `${name(b.id)} mindestens auf Stufe ${b.min} (jetzt ${Math.round(jetzt)})` };
    }
    case "massnahme-max": {
      const jetzt = nationalAverage(NET, w.net, b.id);
      const start = startAverage(NET, w.net, b.id);
      const f = start <= b.max ? 1 : clamp((start - jetzt) / (start - b.max), 0, 1);
      return { bedingung: b, erfuellt: jetzt <= b.max + 0.5, fortschritt: f, text: `${name(b.id)} höchstens auf Stufe ${b.max} (jetzt ${Math.round(jetzt)})` };
    }
    case "groesse": {
      const jetzt = nationalAverage(NET, w.net, b.id);
      const ok = (b.min === undefined || jetzt >= b.min) && (b.max === undefined || jetzt <= b.max);
      const start = startAverage(NET, w.net, b.id);
      const ziel = b.min ?? b.max!;
      const f = ok ? 1 : clamp(1 - Math.abs(ziel - jetzt) / Math.max(1, Math.abs(ziel - start)), 0, 1);
      return { bedingung: b, erfuellt: ok, fortschritt: f, text: `${name(b.id)} ${b.min !== undefined ? `mindestens ${b.min}` : `höchstens ${b.max}`} (jetzt ${Math.round(jetzt)})` };
    }
    case "problem": {
      const n = anzahlAkut(w, b.id);
      const n0 = 81;
      return { bedingung: b, erfuellt: n <= b.maxProvinzen, fortschritt: n <= b.maxProvinzen ? 1 : clamp(1 - (n - b.maxProvinzen) / Math.max(1, n0), 0, 1), text: `${name(b.id)} in höchstens ${b.maxProvinzen} Provinzen akut (jetzt ${n})` };
    }
    case "inflation": {
      const i = w.published.inflation.value;
      const start = w.spiel?.start.inflation ?? i;
      return { bedingung: b, erfuellt: i <= b.max, fortschritt: i <= b.max ? 1 : clamp((start - i) / Math.max(1, start - b.max), 0, 1), text: `Inflation höchstens ${b.max} % (jetzt ${i.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %)` };
    }
    case "ruhe-zentralbank": {
      const letzter = programmZustand(w).zentralbankAngriff;
      const seit = letzter === undefined ? w.day : w.day - letzter;
      return { bedingung: b, erfuellt: seit >= b.tage, fortschritt: clamp(seit / b.tage, 0, 1), text: `${Math.round(b.tage / 30)} Monate ohne Angriff auf die Zentralbank (bisher ${Math.floor(seit / 30)})` };
    }
  }
}

export type SchrittStatus = "gesperrt" | "offen" | "bereit" | "laufend" | "fertig";

export interface SchrittSicht {
  schritt: Schritt;
  status: SchrittStatus;
  bedingungen: BedingungsStand[];
  fehlt: string[];
  /** Bei laufenden Schritten: Anteil der Dauer, 0 bis 1 */
  lauf?: number;
  restTage?: number;
  bezahlbar: boolean;
}

export function schrittSicht(w: World, s: Schritt): SchrittSicht {
  const z = programmZustand(w);
  const bedingungen = s.bedingung.map((b) => pruefeBedingung(w, b));
  const fehlt = s.voraus.filter((v) => !z.fertig.includes(v)).map((v) => SCHRITT.get(v)!.schritt.titel);
  const laufend = z.laufend.find((l) => l.schritt === s.id);
  let status: SchrittStatus;
  if (z.fertig.includes(s.id)) status = "fertig";
  else if (laufend) status = "laufend";
  else if (fehlt.length) status = "gesperrt";
  else if (bedingungen.every((b) => b.erfuellt)) status = "bereit";
  else status = "offen";
  return {
    schritt: s,
    status,
    bedingungen,
    fehlt,
    ...(laufend ? { lauf: clamp((w.day - laufend.start) / Math.max(1, laufend.ende - laufend.start), 0, 1), restTage: Math.max(0, laufend.ende - w.day) } : {}),
    bezahlbar: kannZahlen(w.spiel?.kapital ?? 0, s.kapital),
  };
}

export function starteSchritt(w: World, id: string): { ok: boolean; text: string; why?: string } {
  const eintrag = SCHRITT.get(id);
  const spiel = w.spiel;
  if (!eintrag || !spiel) return { ok: false, text: "Diesen Schritt gibt es nicht." };
  const sicht = schrittSicht(w, eintrag.schritt);
  if (sicht.status !== "bereit") return { ok: false, text: sicht.status === "gesperrt" ? `Erst muss fertig sein: ${sicht.fehlt.join(", ")}.` : sicht.status === "offen" ? "Die Voraussetzungen sind noch nicht erfüllt." : "Dieser Schritt läuft oder ist schon fertig." };
  const z = programmZustand(w);
  if (z.laufend.length >= MAX_LAUFEND) return { ok: false, text: `Es können höchstens ${MAX_LAUFEND} Schritte gleichzeitig laufen.` };
  if (!kannZahlen(spiel.kapital, eintrag.schritt.kapital)) return { ok: false, text: `Dafür fehlt Politisches Kapital (nötig ${eintrag.schritt.kapital}, vorhanden ${Math.floor(spiel.kapital)}).` };
  const pause = neuanfangGrund(w);
  if (pause) return { ok: false, text: pause };
  spiel.kapital -= eintrag.schritt.kapital;
  verbrauche(w, AUFMERKSAMKEIT_KOSTEN.programmSchritt, eintrag.schritt.titel);
  z.laufend.push({ schritt: id, start: w.day, ende: w.day + eintrag.schritt.tage });
  const text = `Programm „${eintrag.programm.titel}“: ${eintrag.schritt.titel} beginnt.`;
  const why = `Kostet ${eintrag.schritt.kapital} Kapital und dauert etwa ${Math.round(eintrag.schritt.tage / 30)} ${Math.round(eintrag.schritt.tage / 30) === 1 ? "Monat" : "Monate"}. Danach: ${eintrag.schritt.ergebnis}.`;
  addLog(w, "entscheidung", text, why);
  return { ok: true, text, why };
}

/** Täglich: Abgeschlossene Schritte wirken lassen. */
export function programmTag(w: World): void {
  const spiel = w.spiel;
  if (!spiel?.programm) return;
  const z = spiel.programm;
  for (const l of [...z.laufend]) {
    if (l.ende > w.day) continue;
    z.laufend = z.laufend.filter((x) => x !== l);
    const e = SCHRITT.get(l.schritt);
    if (!e) continue;
    const s = e.schritt;
    z.fertig.push(s.id);
    s.wirkung(w);
    if (s.bonusKapital) spiel.kapital = Math.min(150, spiel.kapital + s.bonusKapital);
    if (s.rabatt) spiel.modifikatoren = { ...(spiel.modifikatoren ?? {}), [`rabatt:${s.rabatt.thema}`]: (spiel.modifikatoren?.[`rabatt:${s.rabatt.thema}`] ?? 0) + s.rabatt.anteil };
    if (s.schutz) spiel.modifikatoren = { ...(spiel.modifikatoren ?? {}), [`schutz:${s.schutz.ereignis}`]: s.schutz.faktor };
    const titel = s.vermaechtnis ? `Programm erfüllt: ${e.programm.titel}` : `Schritt erreicht: ${s.titel}`;
    spiel.chronik.push({ tag: w.day, datum: w.date, titel, ausgang: `${s.text} ${s.ergebnis}.` });
    addLog(w, "ereignis", titel, `${s.text} ${s.ergebnis}.`);
    spiel.hinweise.push({ id: `programm-${s.id}-${w.day}`, titel, szene: "istanbul", text: [s.text, `Wirkung: ${s.ergebnis}.`] });
  }
}

/** Rabatt auf die Kapitalkosten einer Maßnahme dieses Themas (0 bis 1). */
export function rabattFuer(w: World, thema: string): number {
  return Math.min(0.5, w.spiel?.modifikatoren?.[`rabatt:${thema}`] ?? 0);
}

/** Faktor auf die Stärke eines Ereignisses (1 = keine Veränderung). */
export function schutzFuer(w: World, ereignis: string): number {
  return w.spiel?.modifikatoren?.[`schutz:${ereignis}`] ?? 1;
}

/** Der nächste sinnvolle Schritt: bereit vor offen, Vermächtnis zuletzt; für den Schreibtisch. */
export function naechsterSchritt(w: World): SchrittSicht | null {
  let beste: SchrittSicht | null = null;
  for (const p of PROGRAMME) {
    for (const s of p.schritte) {
      const sicht = schrittSicht(w, s);
      if (sicht.status !== "bereit" && sicht.status !== "offen") continue;
      const rang = (sicht.status === "bereit" ? 0 : 10) + (s.vermaechtnis ? 5 : 0) + (sicht.bedingungen.reduce((m, b) => Math.min(m, b.fortschritt), 1) < 0.3 ? 3 : 0) - (sicht.bedingungen.reduce((m, b) => Math.min(m, b.fortschritt), 1) >= 0.6 ? 4 : 0);
      const bestRang = beste ? ((beste.status === "bereit" ? 0 : 10) + (beste.schritt.vermaechtnis ? 5 : 0) + (beste.bedingungen.reduce((m, b) => Math.min(m, b.fortschritt), 1) < 0.3 ? 3 : 0) - (beste.bedingungen.reduce((m, b) => Math.min(m, b.fortschritt), 1) >= 0.6 ? 4 : 0)) : Infinity;
      if (rang < bestRang) beste = sicht;
    }
  }
  return beste;
}

export function schrittMitProgramm(id: string): { schritt: Schritt; programm: Programm } | undefined {
  return SCHRITT.get(id);
}

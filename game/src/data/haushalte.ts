// Menschen statt Indizes: sieben wiederkehrende Haushalte (und ein Exportbetrieb als Wirtschafter),
// die die Kennzahlen der Simulation in Sätze übersetzen. Vorbild: Civ-6-City-Panel, Suzerains Alltagsszenen.
// Die Textbausteine sind reine Funktionen ohne Importe aus sim/ — die Engine übergibt Spielwerte als Parameter.
//
// Belegte Anker (Quellen siehe je Zeile):
//   - Mindestlohn netto 28.075,50 Lira im Monat seit 1.1.2026 (Arbeitsministerium, Amtsblatt; tuerkei/STARTDATEN.md)
//   - Inflation 31,51 % zum Vorjahr, Lebensmittel 33,79 %, Wohnen und Energie im Haushalt 39,77 % (TÜİK, August 2026; STARTDATEN.md)
//   - Durchschnittliche monatliche Konsumausgaben je Haushalt 45.344 Lira (2024) und 64.104 Lira (2025)
//     (TÜİK „Hanehalkı Tüketim Harcaması", veröffentlicht 2.6.2026; Dünya 3.6.2026)
// Alle übrigen Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.
// Keine echten Personen; die Haushalte sind erfunden, die Orte und Milieus sind typisiert.

// ---------------------------------------------------------------------------
// Typen

export interface HaushaltAusgabenposten {
  /** Posten des Ausgabenkorbs */
  posten: string;
  /** Anteil an den monatlichen Ausgaben in Prozent (Spielparameter, gerundet; orientiert an TÜİK-Hauptgruppen) */
  anteil: number;
  /** Beleg für den Anteil, falls belegt; sonst fehlt das Feld (Spielparameter) */
  quelle?: string;
}

export interface Haushalt {
  id: string;
  titel: string;
  /** Provinz (Plaka) und Ort, typisiert */
  ort: { plaka: number; name: string };
  /** Kurze Typisierung des Haushalts */
  typ: string;
  /** Ein bis zwei Sätze über den Haushalt */
  beschreibung: string;
  /** Monatliches Nettoeinkommen in Lira (Spielparameter; Beleg, wo vorhanden) */
  einkommen: { wert: number; quelle?: string };
  /** Bewohnerzahl (Spielparameter) */
  personen: number;
  /** Wohnform mit einer Zeile Kontext */
  wohnen: { form: "miete" | "eigentum" | "darlehen" | "konteyner" | "landwirtschaftlich"; hinweis: string };
  /** Ausgabenkorb (Anteile summieren sich nicht zwingend auf 100; Spielparameter) */
  ausgabenkorb: HaushaltAusgabenposten[];
  /** Betroffenheit je Hebel, je ein bis zwei Sätze aus Sicht des Haushalts */
  betroffenheit: {
    inflation: string;
    mindestlohn: string;
    mieten: string;
    energie: string;
    wechselkurs?: string;
    zusagen?: string;
  };
}

// ---------------------------------------------------------------------------
// Die Haushalte

export const HAUSHALTE: Haushalt[] = [
  {
    id: "hh_rentnerin_konya",
    titel: "Die Rentnerin aus Konya",
    ort: { plaka: 42, name: "Konya" },
    typ: "Einpersonenhaushalt, Rente",
    beschreibung:
      "Alleinlebende Rentnerin, ihr Mann war Landmaschinenmechaniker. Die Rente ist ihre einzige Einnahme; ihre Tochter ruft sonntags an.",
    einkommen: { wert: 14000 },
    personen: 1,
    wohnen: { form: "eigentum", hinweis: "Eigenheim, alte Ölheizung, Aufzug nicht vorhanden." },
    ausgabenkorb: [
      { posten: "Lebensmittel", anteil: 38 },
      { posten: "Arznei und Gesundheit", anteil: 15 },
      { posten: "Energie (Strom, Gas, Holz)", anteil: 18 },
      { posten: "Transport", anteil: 9 },
      { posten: "Übriges", anteil: 20 },
    ],
    betroffenheit: {
      inflation: "Lebensmittel- und Arzneipreise treffen den ganzen Haushalt; Sparreserven sind nach einem Jahr Inflation leer.",
      mindestlohn: "Der Mindestlohn betrifft sie nicht direkt, aber jede Erhöhung spricht für ihre Rente als Maßstab.",
      mieten: "Sie zahlt keine Miete — dafür die Instandhaltung des Altbaus, die jedes Jahr mehr kostet.",
      energie: "Die Heizrechnung ist ihre größte Angst vor dem Winter; Holz war einmal billiger.",
    },
  },
  {
    id: "hh_familie_istanbul",
    titel: "Die Doppelverdienerfamilie aus Istanbul",
    ort: { plaka: 34, name: "İstanbul" },
    typ: "Familie mit zwei Einkommen, zwei Kinder",
    beschreibung:
      "Beide Eheleute arbeiten — er im Logistikbetrieb, sie in der Buchhaltung eines Handelskonzerns. Zwei Kinder im Schulalter, Pendeln mit zwei Umstiegen.",
    einkommen: { wert: 62000 },
    personen: 4,
    wohnen: { form: "miete", hinweis: "Dreizimmer im Außenbezirk; die Miete wurde bei der letzten Verlängerung neu verhandelt." },
    ausgabenkorb: [
      { posten: "Miete", anteil: 34 },
      { posten: "Lebensmittel", anteil: 24 },
      { posten: "Verkehr (Pendeln, Autoanteil)", anteil: 12 },
      { posten: "Schule, Kinder, Kleidung", anteil: 12 },
      { posten: "Energie", anteil: 8 },
      { posten: "Übriges", anteil: 10 },
    ],
    betroffenheit: {
      inflation: "Der Wocheneinkauf wird vor dem Regal neu sortiert; Fleisch ist kein Wochentagsthema mehr.",
      mindestlohn: "Beide Einkommen liegen über dem Mindestlohn, aber die Tarifrunde ihres Betriebs zitiert ihn als Untergrenze.",
      mieten: "Die Miete ist der größte Posten; jede Verlängerung entscheidet, ob das Sparziel der Familie überlebt.",
      energie: "Strom und Gas sind moderat, aber die Pendelkosten hängen am Kraftstoffpreis.",
    },
  },
  {
    id: "hh_exportbetrieb_denizli",
    titel: "Der Exportbetrieb aus Denizli",
    ort: { plaka: 20, name: "Denizli" },
    typ: "Textilbetrieb, 60 Beschäftigte (Wirtschafter statt Haushalt)",
    beschreibung:
      "Familienbetrieb für Heimtextilien, zwei Drittel Export nach Europa. Inhaberpaar und ein Sohn in der Kalkulation.",
    einkommen: { wert: 480000, quelle: "Spielparameter: Bruttoeinnahmen je Monat vor Kosten; kein Amtswert." },
    personen: 3,
    wohnen: { form: "eigentum", hinweis: "Werkhalle gemietet im Industriepark, Wohnung über dem Kontor." },
    ausgabenkorb: [
      { posten: "Löhne und Abgaben", anteil: 42 },
      { posten: "Material und Energie", anteil: 31 },
      { posten: "Kreditzinsen", anteil: 11 },
      { posten: "Transport und Zölle", anteil: 9 },
      { posten: "Übriges", anteil: 7 },
    ],
    betroffenheit: {
      inflation: "Die Preise für Aufträge stehen für ein halbes Jahr, die Löhne für das ganze Jahr; dazwischen liegt die Marge.",
      mindestlohn: "Jede Mindestlohrunde wird Lohnsumme; zwei Drittel der Belegschaft verdienen im unteren Drittel.",
      mieten: "Die Hallenmiete folgt dem Markt träge, aber die Grundstückspreise treiben die Kreditlinie.",
      energie: "Der Strompreis je gefertigtem Meter entscheidet, ob ein Auftrag nach Denizli oder nach Basra geht.",
      wechselkurs: "Der Kurs entscheidet zwischen Auftragsbuch und Verlust; eine starke Lira ist freundlich zum Einkauf, streng zum Export.",
    },
  },
  {
    id: "hh_wiederaufbau_hatay",
    titel: "Die Familie aus dem Wiederaufbaugebiet Hatay",
    ort: { plaka: 31, name: "Hatay" },
    typ: "Familie mit zwei Kindern im Bebenwiederaufbau",
    beschreibung:
      "Das Haus wurde 2023 unbewohnbar; die Familie wohnt seit Jahren in einer Fertigwohnung des Wiederaufbauprogramms und wartet auf das neue Haus.",
    einkommen: { wert: 26000, quelle: "Spielparameter: ein Einkommen plus staatliche Wiederaufbauzusage." },
    personen: 4,
    wohnen: { form: "konteyner", hinweis: "Fertigbau-Siedlung; die Zusage für das Neubauhaus ist dokumentiert, der Termin nicht." },
    ausgabenkorb: [
      { posten: "Lebensmittel", anteil: 36 },
      { posten: "Transport (Arbeitsweg)", anteil: 16 },
      { posten: "Energie", anteil: 14 },
      { posten: "Bau- und Übergangskosten", anteil: 18 },
      { posten: "Übriges", anteil: 16 },
    ],
    betroffenheit: {
      inflation: "Baumaterialien steigen schneller als die Zusage; jedes Vierteljahr kostet am Neubau.",
      mindestlohn: "Der Hauptverdiener arbeitet als Baufachkraft; der Mindestlohn ist der Maßstab jedes Tagesatzes.",
      mieten: "Keine Miete, aber das Wort Zusage hat hier denselben Wert wie ein Mietvertrag in Istanbul.",
      energie: "Die Fertigbau-Siedlung ist teuer zu heizen; der Winter zählt doppelt.",
      zusagen: "Die Familie hat den Zusageschein der Wiederaufbauverwaltung im Küchenschrank liegen.",
    },
  },
  {
    id: "hh_bauerin_karapinar",
    titel: "Die Weizenbäuerin aus Karapınar",
    ort: { plaka: 42, name: "Konya" },
    typ: "Kleinbetriebliche Landwirtschaft, 30 Hektar",
    beschreibung:
      "Weizen und Zuckerrübe auf Pachtkomplexen, ein Sohn fährt den Traktor, eine Tochter studiert in Konya Agrartechnik.",
    einkommen: { wert: 95000, quelle: "Spielparameter: Saisoneinkommen auf zwölf Monate verteilt, vor Betriebsausgaben." },
    personen: 4,
    wohnen: { form: "landwirtschaftlich", hinweis: "Hofhaus am Feld; Brunnenrecht ist die wichtigste Nebensache." },
    ausgabenkorb: [
      { posten: "Düngemittel und Saatgut", anteil: 38 },
      { posten: "Diesel und Bewässerungsstrom", anteil: 24 },
      { posten: "Pacht und Kredite", anteil: 20 },
      { posten: "Lebensmittel und Haushalt", anteil: 12 },
      { posten: "Übriges", anteil: 6 },
    ],
    betroffenheit: {
      inflation: "Die Erntepreise stehen auf dem Papier des Händlers, die Düngemittelpreise auf dem Weltmarkt; dazwischen liegt das Jahr.",
      mindestlohn: "Saisonkräfte werden am Tagessatz bezahlt; der Mindestlohn ist die Untergrenze jeder Verhandlung.",
      mieten: "Keine Wohnungsmiete, aber die Feldpacht steigt mit jedem besseren Erntejahr.",
      energie: "Diesel und Bewässerungsstrom sind die zweite Ernte; die Dürre macht die Pumpe zur Hauptkulturaufgabe.",
      wechselkurs: "Dünger und Saatgut werden in Dollar gehandelt; die Lira entscheidet über die Fruchtfolge.",
    },
  },
  {
    id: "hh_studentin_ankara",
    titel: "Die Studentin aus Ankara",
    ort: { plaka: 6, name: "Ankara" },
    typ: "Einpersonenhaushalt, Studium mit Nebenjob",
    beschreibung:
      "Studiert Politikwissenschaft in der fünften Semesterhälfte, arbeitet drei Nachmittage in einem Café und schickt Geld nach Hause.",
    einkommen: { wert: 21000, quelle: "Spielparameter: Stipendium plus Nebenjob." },
    personen: 1,
    wohnen: { form: "miete", hinweis: "Zimmer in einer Dreier-WG; der Mietvertrag ist mündlich und die Vermieterin geduldig." },
    ausgabenkorb: [
      { posten: "Miete (WG-Anteil)", anteil: 40 },
      { posten: "Lebensmittel und Mensa", anteil: 26 },
      { posten: "Transport (Studententarif)", anteil: 8 },
      { posten: "Studienmaterial und Internet", anteil: 10 },
      { posten: "Übriges", anteil: 16 },
    ],
    betroffenheit: {
      inflation: "Die Mensa wird zur Hauptmahlzeit; der Nebenjob-Lohn folgt der Inflation mit zwei Monaten Verzug.",
      mindestlohn: "Der Nebenjob zahlt knapp über dem Mindestlohn; jede Runde ist auch eine Gehaltsrunde.",
      mieten: "WG-Zimmerpreise sind die härteste Zahl der Stadt; ohne Mitbewohnerinnen wäre das Studium ein Umzug.",
      energie: "Strom läuft über die Vermieterin; die Rechnung kommt als Pauschale mit Erinnerung.",
    },
  },
  {
    id: "hh_fischer_trabzon",
    titel: "Die Fischerfamilie aus Trabzon",
    ort: { plaka: 61, name: "Trabzon" },
    typ: "Kleinfischerbetrieb, ein Boot, zwei Angestellte",
    beschreibung:
      "Familie betreibt ein kleines Boot; der Sohn wartet auf den Hafenausbau, die Tochter rechnet Abgang und Diesel gegeneinander.",
    einkommen: { wert: 33000, quelle: "Spielparameter: Saisoneinkommen auf zwölf Monate verteilt." },
    personen: 4,
    wohnen: { form: "eigentum", hinweis: "Haus am Hang über dem Hafen; der Kühlschrank im Kontor ist zweiter Kühlschrank." },
    ausgabenkorb: [
      { posten: "Diesel", anteil: 30 },
      { posten: "Netze, Wartung, Hafengebühren", anteil: 22 },
      { posten: "Lebensmittel", anteil: 24 },
      { posten: "Kredit für Boot", anteil: 12 },
      { posten: "Übriges", anteil: 12 },
    ],
    betroffenheit: {
      inflation: "Der Fischpreis folgt dem Markttag, die Rechnungen folgen dem Jahr.",
      mindestlohn: "Die zwei Angestellten werden am Tagessatz gezahlt; der Mindestlohn ist die Untergrenze.",
      mieten: "Keine Miete, aber die Hafengebühr ist eine Art Miete fürs Wasser.",
      energie: "Diesel ist die halbe Reise; jedes Preisschild an der Zapfsäule ist eine Fahrplanentscheidung.",
      wechselkurs: "Netze und Motorenteile sind Importware; die Lira sitzt mit im Boot.",
    },
  },
];

// ---------------------------------------------------------------------------
// Textbausteine: aus Spielwerten werden Sätze.
// Die Engine ruft `haushaltSaetze` je Haushalt auf und zeigt die Sätze als Persona-Bericht
// (etwa im Wähler-Dossier oder im Wirkungsbericht). Keine Importe; deterministisch.

/** Spielwerte, die der Engine-Aufruf liefert. Alle Werte auf den Amtsantritt = 100 normiert (Indizes). */
export interface HaushaltZahlen {
  /** Jahresinflation in Prozent (Punkte) */
  inflation: number;
  /** Netto-Mindestlohn in Lira */
  mindestlohn: number;
  /** Mietindex (Amtsantritt = 100) */
  mieteIndex: number;
  /** Energiepreisindex (Amtsantritt = 100) */
  energieIndex: number;
  /** Reales Einkommen des Haushaltstyps (Amtsantritt = 100) */
  realeinkommenIndex: number;
  /** Wechselkursindex Lira gegen Handelspartner (Amtsantritt = 100; hoch = starke Lira) */
  wechselkursIndex: number;
  /** Anteil der Mindestlohnbezieher im Haushalt (0 bis 1) */
  mindestlohnAnteil: number;
}

function kaufkraftSatz(name: string, realeinkommenIndex: number): string {
  if (realeinkommenIndex >= 105) {
    return `${name} kann sich wieder mehr leisten als bei Ihrem Amtsantritt.`;
  }
  if (realeinkommenIndex >= 95) {
    return `${name} hält sich etwa auf dem Niveau Ihres Amtsantritts.`;
  }
  if (realeinkommenIndex >= 85) {
    return `${name} kann sich weniger leisten als bei Ihrem Amtsantritt.`;
  }
  return `${name} spart inzwischen an Dingen, die vor Ihrem Amtsantritt selbstverständlich waren.`;
}

function inflationSatz(inflation: number): string {
  if (inflation >= 30) {
    return `Die Inflation liegt bei ${inflation.toFixed(0)} Prozent; die Preise steigen schneller, als die Rechnungen kommen.`;
  }
  if (inflation >= 15) {
    return `Die Inflation sinkt, aber die Regale erinnern sich: ${inflation.toFixed(0)} Prozent bleiben ${inflation.toFixed(0)} Prozent.`;
  }
  return `Die Inflation ist bei ${inflation.toFixed(0)} Prozent zur Ruhe gekommen; die Preise bleiben, wo sie sind.`;
}

function mieteSatz(h: Haushalt, z: HaushaltZahlen): string {
  if (h.wohnen.form === "miete") {
    if (z.mieteIndex >= 115) {
      return `Die Miete ist seit Ihrem Amtsantritt um ${Math.round(z.mieteIndex - 100)} Prozent gestiegen; der Umzugskoffer steht im Flur.`;
    }
    if (z.mieteIndex >= 105) {
      return `Die Miete ist um ${Math.round(z.mieteIndex - 100)} Prozent gestiegen — langsamer als vorher, schneller als der Lohn.`;
    }
    return `Die Miete hat sich stabilisiert; die Verlängerung war diesmal ein Gespräch, kein Druck.`;
  }
  if (h.wohnen.form === "konteyner") {
    return z.mieteIndex >= 110
      ? `Die Baumaterialien sind um ${Math.round(z.mieteIndex - 100)} Prozent teurer geworden; die Zusage rückt in die Ferne.`
      : `Die Baumaterialpreise halten sich; die Zusage rückt näher als im letzten Jahr.`;
  }
  return "";
}

function energieSatz(h: Haushalt, z: HaushaltZahlen): string {
  const hart = h.ausgabenkorb.find((p) => p.posten.includes("Energie") || p.posten === "Diesel" || p.posten.includes("Diesel"));
  const anteil = hart ? hart.anteil : 8;
  if (z.energieIndex >= 120) {
    return `Energiepreise sind um ${Math.round(z.energieIndex - 100)} Prozent gestiegen; bei ${anteil} Prozent des Haushalts ist das die größte einzelne Rechnung.`;
  }
  if (z.energieIndex >= 105) {
    return `Die Energierechnung liegt ${Math.round(z.energieIndex - 100)} Prozent über Ihrem Amtsantritt — spürbar, aber tragbar.`;
  }
  return `Die Energierechnung ist leichter geworden als bei Ihrem Amtsantritt.`;
}

function mindestlohnSatz(h: Haushalt, z: HaushaltZahlen): string {
  if (z.mindestlohnAnteil <= 0) {
    return `Der Mindestlohn (${Math.round(z.mindestlohn)} Lira netto) betrifft diesen Haushalt nur als Maßstab für Tarifrunden.`;
  }
  const einkommen = Math.round(h.einkommen.wert);
  const anteilProzent = Math.min(100, Math.round((z.mindestlohn * h.personen * z.mindestlohnAnteil * 100) / Math.max(1, einkommen)));
  if (z.mindestlohnAnteil >= 0.5) {
    return `Mehr als die Hälfte des Einkommens hängt am Mindestlohn; die letzte Runde brachte den Haushalt um rund ${anteilProzent} Prozent seines Einkommens.`;
  }
  return `Ein Teil des Einkommens folgt dem Mindestlohn (${Math.round(z.mindestlohn)} Lira netto); jede Runde ist auch eine Haushaltsrunde.`;
}

function wechselkursSatz(h: Haushalt, z: HaushaltZahlen): string {
  if (!h.betroffenheit.wechselkurs) return "";
  if (z.wechselkursIndex >= 105) {
    return `Die Lira ist seit Ihrem Amtsantritt um ${Math.round(z.wechselkursIndex - 100)} Prozent stärker; der Einkauf in Fremdwährung wurde billiger, der Auftrag harder.`;
  }
  if (z.wechselkursIndex >= 95) {
    return `Der Wechselkurs hält sich in engen Grenzen; Planung ist wieder möglich.`;
  }
  return `Die Lira ist um ${Math.round(100 - z.wechselkursIndex)} Prozent schwächer als bei Ihrem Amtsantritt; Einkaufslisten in Fremdwährung kosten mehr.`;
}

function zusageSatz(h: Haushalt, hatZusage: boolean): string {
  if (!h.betroffenheit.zusagen) return "";
  return hatZusage
    ? `Die staatliche Zusage an diesen Haushalt ist eingelöst worden; das Wort der Regierung hat hier wieder Gewicht.`
    : `Die staatliche Zusage an diesen Haushalt steht noch offen; jedes Stück Papier hat hier ein Ablaufdatum.`;
}

/**
 * Erzeugt die Berichtssätze für einen Haushalt aus den Spielwerten.
 * Reihenfolge: Kaufkraft, Inflation, Wohnen, Energie, Mindestlohn, Wechselkurs, Zusage.
 * Nur nichtleere Sätze, höchstens sechs je Aufruf.
 */
export function haushaltSaetze(h: Haushalt, z: HaushaltZahlen, hatZusage = true): string[] {
  const saetze: string[] = [];
  saetze.push(kaufkraftSatz(h.titel, z.realeinkommenIndex));
  saetze.push(inflationSatz(z.inflation));
  const miete = mieteSatz(h, z);
  if (miete) saetze.push(miete);
  saetze.push(energieSatz(h, z));
  saetze.push(mindestlohnSatz(h, z));
  const kurs = wechselkursSatz(h, z);
  if (kurs) saetze.push(kurs);
  const zusage = zusageSatz(h, hatZusage);
  if (zusage) saetze.push(zusage);
  return saetze.filter((s) => s.length > 0).slice(0, 6);
}

/** Kurzkennzahl für Übersichten: eine Zeile, die den Haushalt in einem Satz fasst. */
export function haushaltKurzzeile(h: Haushalt, z: HaushaltZahlen): string {
  const richtung = z.realeinkommenIndex >= 105 ? "besser" : z.realeinkommenIndex >= 95 ? "gleich" : "schlechter";
  return `${h.titel} (${h.ort.name}): geht es ${richtung} als bei Ihrem Amtsantritt.`;
}

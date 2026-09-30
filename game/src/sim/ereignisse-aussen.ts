// Weitere Ereignisvorlagen: Außenpolitik, Weltwirtschaft, Sicherheit und Energie.
// Wie in ereignisse-innen.ts sind Wahrscheinlichkeiten und Wirkungen Platzhalter der Kalibrierung; Zahlen im Text
// stammen aus dem Weltzustand. Namen von Staaten kommen nur vor, wo der Sachverhalt sie ohnehin bedingt.

import { wirke, vertrauenAendern } from "./wirkung";
import { setFiscalImpulse } from "./eingriffe";
import { clamp } from "./economy";
import { anrede, figur, loyalitaetAendern } from "./figuren";
import { CYBER_ZIELE, GRENZ_NACHBAR, NATO_BEWERBER, waehle } from "./akteure";
import { dk } from "./ereignis-hilfen";
import { beschr, kosten, monatVon, namen, netz, nf, opt, ziehe, zusageAnlegen } from "./ereignis-hilfen";
import type { Vorlage } from "./ereignis-hilfen";

const GRENZE = [31, 79, 27, 63, 47, 73, 30, 65, 76, 36, 75, 8]; // Hatay, Kilis, Gaziantep, Şanlıurfa, Mardin, Şırnak, Hakkari, Van, Iğdır, Kars, Ardahan, Artvin

const GRENZZWISCHENFALL: Vorlage = {
  id: "grenzzwischenfall",
  szene: "anatolien",
  frist: 5,
  abkuehlung: 300,
  chance: (w) => (netz(w, "terrorgefahr") > 55 ? 0.04 : 0.012),
  erzeuge: (w, rng) => {
    const p = ziehe(rng, (pl) => (GRENZE.includes(pl) ? 1 : 0), 1);
    return p.length ? { provinzen: p, staerke: 0.5 + 0.5 * rng.next() } : null;
  },
  titel: (_, ev) => `Zwischenfall an der Grenze zu ${GRENZ_NACHBAR[ev.provinzen[0] ?? 0] ?? "einem Nachbarn"}`,
  text: (_, ev) => {
    const nachbar = GRENZ_NACHBAR[ev.provinzen[0] ?? 0] ?? "dem Nachbarland";
    return [`An der Grenze zu ${nachbar} bei ${namen(ev.provinzen)} fallen Schüsse; Grenzsoldaten melden Verletzte. Wer zuerst geschossen hat, ist unklar: ${nachbar} und die türkische Seite geben sich gegenseitig die Schuld.`];
  },
  warum: () => "Grenzzwischenfälle entscheiden sich an der Frage, ob man eine Lage beruhigt oder ausnutzt. Jede Reaktion ist auch ein Signal an die Nachbarn und an die Wähler.",
  eroeffne: (w, ev) => {
    wirke(w, "terrorgefahr", 4 * ev.staerke, ev.provinzen);
    wirke(w, "vertrauen_regierung", -0.5);
  },
  optionen: (_, ev) => [
    opt("diplomatie", "Protest und Vermittlung", beschr(2, 0, "beruhigt die Lage, wirkt auf Hardliner schwach."), 2, (w) => {
      wirke(w, "beziehungen_nahost", 2);
      wirke(w, "terrorgefahr", -1, ev.provinzen);
      loyalitaetAendern(w, "aussen", 4);
      return "Die Regierung protestiert diplomatisch und bietet Vermittlung an.";
    }),
    opt("verstaerken", "Grenztruppen verstärken", beschr(3, 0.1, "erhöht die Sicherheit, kostet Geld."), 3, (w) => {
      kosten(w, 0.1);
      wirke(w, "terrorgefahr", -3 * ev.staerke, ev.provinzen);
      wirke(w, "militaer", 2);
      loyalitaetAendern(w, "inneres", 3);
      return "Zusätzliche Truppen sichern die Grenze.";
    }),
    opt("vergeltung", "Mit einem Gegenschlag antworten", beschr(4, 0.15, "ein starker Auftritt, der Spannungen und Risiken erhöht."), 4, (w) => {
      kosten(w, 0.15);
      vertrauenAendern(w, 2);
      wirke(w, "ansehen", -3);
      wirke(w, "beziehungen_nahost", -5);
      wirke(w, "terrorgefahr", 2, ev.provinzen);
      return "Die Armee antwortet mit einem begrenzten Gegenschlag.";
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "terrorgefahr", 2 * ev.staerke, ev.provinzen);
    vertrauenAendern(w, -1);
    return "Ohne klare Reaktion wächst die Unruhe in den Grenzorten.";
  },
};

const EU_ANGEBOT: Vorlage = {
  id: "eu_angebot",
  szene: "parlament",
  frist: 20,
  abkuehlung: 600,
  chance: (w) => (netz(w, "beziehungen_eu") >= 45 ? 0.04 : 0.005),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => "Brüssel bietet Gespräche an",
  text: () => [
    "Die EU-Kommission bietet an, die Zollunion zu modernisieren und Visaerleichterungen zu verhandeln, wenn die Türkei Zusagen zu Rechtsstaat und Justiz macht. Die Wirtschaft drängt, die Nationalisten warnen vor Bevormundung.",
  ],
  warum: () => "Europa ist der wichtigste Absatzmarkt und Kapitalgeber der Türkei, und es verlangt dafür Gegenleistungen bei Rechtsstaat und Justiz.",
  optionen: () => [
    opt("verhandeln", "Verhandlungen aufnehmen und eine Justizreform zusagen", beschr(4, 0, "Export und Kapital gewinnen, Sie schulden Brüssel eine Reform."), 4, (w) => {
      wirke(w, "beziehungen_eu", 6);
      wirke(w, "export", 3);
      wirke(w, "auslandskapital", 3);
      wirke(w, "konservative", -1);
      zusageAnlegen(w, { von: "EU-Kommission", text: "Der EU wurde eine Justizreform zugesagt", tage: 240, massnahme: "m_justizreform" });
      return "Die Türkei nimmt die Gespräche auf und sagt eine Justizreform zu.";
    }),
    opt("teilweise", "Nur über den Handel sprechen", beschr(2, 0, "ein Anfang, ohne Zusagen zum Rechtsstaat."), 2, (w) => {
      wirke(w, "beziehungen_eu", 2);
      wirke(w, "export", 1);
      return "Beide Seiten sprechen zunächst nur über den Handel.";
    }),
    opt("ablehnen", "Ablehnen", beschr(0, 0, "das nationale Lager applaudiert, die Wirtschaft ist enttäuscht."), 0, (w) => {
      wirke(w, "beziehungen_eu", -3);
      wirke(w, "konservative", 2);
      wirke(w, "unternehmer", -1);
      return "Das Angebot wird abgelehnt.";
    }),
  ],
  standard: (w) => {
    wirke(w, "beziehungen_eu", -1);
    return "Das Angebot bleibt unbeantwortet und verfällt.";
  },
};

const IWF: Vorlage = {
  id: "iwf_angebot",
  szene: "bank",
  frist: 12,
  abkuehlung: 500,
  chance: (w) => (w.economy.riskPremium > 400 ? 0.2 : 0),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => "Der IWF bietet ein Programm an",
  text: (w) => [
    `Bei ${nf(w.economy.riskPremium, 0)} Basispunkten Risikoaufschlag und ${nf(w.economy.usdTry)} Lira je Dollar bietet der Internationale Währungsfonds ein Kreditprogramm an. ${anrede(figur(w, "finanzen"))} wägt ab.`,
    "Der Preis wären Auflagen: Sparen, Reformen und Aufsicht durch Prüfer.",
  ],
  warum: () => "Ein IWF-Programm bringt Geld und Vertrauen der Märkte und kostet politische Freiheit: Die Auflagen treffen meist die, die am wenigsten haben.",
  optionen: () => [
    opt("annehmen", "Das Programm annehmen", beschr(5, 0, "die Märkte beruhigen sich, die Auflagen kosten Zustimmung."), 5, (w) => {
      w.economy.riskPremium = Math.max(150, w.economy.riskPremium - 60);
      w.economy.credibility = clamp(w.economy.credibility + 0.05, 0.05, 0.95);
      setFiscalImpulse(w, Math.min(w.economy.fiscalImpulse, -1));
      wirke(w, "vertrauen_maerkte", 8);
      wirke(w, "realeinkommen", -3);
      wirke(w, "arbeitnehmer", -3);
      wirke(w, "junge", -2);
      return "Die Regierung nimmt das Programm an und verspricht Haushaltsdisziplin.";
    }),
    opt("golf", "Kredite aus dem Golf suchen", beschr(4, 0, "Geld ohne Auflagen, aber mit politischen Gegenleistungen."), 4, (w) => {
      w.economy.riskPremium = Math.max(150, w.economy.riskPremium - 30);
      w.economy.credibility = clamp(w.economy.credibility + 0.01, 0.05, 0.95);
      wirke(w, "beziehungen_nahost", 4);
      wirke(w, "beziehungen_usa", -1);
      return "Golfstaaten stellen Kredite bereit; sie erwarten Entgegenkommen.";
    }),
    opt("allein", "Den Weg allein gehen", beschr(0, 0, "keine Auflagen, aber auch keine Hilfe."), 0, (w) => {
      w.economy.riskPremium += 20;
      wirke(w, "vertrauen_maerkte", -2);
      wirke(w, "konservative", 1);
      return "Die Regierung lehnt fremde Hilfe ab.";
    }),
  ],
  standard: (w) => {
    w.economy.riskPremium += 25;
    return "Das Angebot verfällt; die Märkte deuten das als Zögern.";
  },
};

const RATING: Vorlage = {
  id: "ratingagentur",
  szene: "bank",
  frist: 12,
  abkuehlung: 360,
  chance: (w) => (w.economy.debtRatio > 45 || netz(w, "vertrauen_maerkte") < 38 ? 0.08 : 0.004),
  erzeuge: (_, rng) => ({ provinzen: [], staerke: 1, daten: { agentur: waehle(rng, ["Fitch", "Moody's", "S&P Global Ratings"]) } }),
  titel: (_, ev) => `${ev.daten?.agentur} droht mit Herabstufung`,
  text: (w, ev) => [`${ev.daten?.agentur} stellt die Bonität des Landes auf den Prüfstand: Schulden ${nf(w.economy.debtRatio)} % des BIP, Inflation ${nf(w.published.inflation.value)} %. Eine Herabstufung würde Kredite verteuern.`],
  warum: () => "Ratings entscheiden mit, was der Staat für Schulden zahlt. Sie folgen dem Vertrauen der Investoren und beeinflussen es zugleich.",
  optionen: () => [
    opt("fahrplan", "Einen Reformfahrplan vorlegen", beschr(3, 0, "beruhigt die Investoren, bindet die Regierung."), 3, (w) => {
      wirke(w, "vertrauen_maerkte", 4);
      setFiscalImpulse(w, Math.min(w.economy.fiscalImpulse, 0));
      loyalitaetAendern(w, "finanzen", 4);
      return "Ein mehrjähriger Reformfahrplan wird vorgelegt.";
    }),
    opt("roadshow", "Eine Investorenreise", beschr(2, 0, "wirbt Kapital, ersetzt keine Reformen."), 2, (w) => {
      wirke(w, "auslandskapital", 3);
      w.economy.riskPremium -= 10;
      return "Der Finanzminister wirbt bei Investoren.";
    }),
    opt("zurueckweisen", "Die Kritik zurückweisen", beschr(0, 0, "populär im Inland, teuer an den Märkten."), 0, (w) => {
      w.economy.riskPremium += 20;
      wirke(w, "vertrauen_maerkte", -3);
      wirke(w, "konservative", 1);
      return "Die Regierung weist die Kritik als ungerechtfertigt zurück.";
    }),
  ],
  standard: (w) => {
    w.economy.riskPremium += 25;
    wirke(w, "vertrauen_maerkte", -4);
    return "Die Agentur stuft das Land herab; Kredite werden teurer.";
  },
};

const NATO: Vorlage = {
  id: "nato_ratifizierung",
  szene: "parlament",
  frist: 20,
  abkuehlung: 900,
  chance: (w) => (w.day > 300 ? 0.02 : 0),
  erzeuge: (_, rng) => {
    const b = waehle(rng, NATO_BEWERBER);
    return { provinzen: [], staerke: 1, daten: { land: b.land, lage: b.lage, ru: b.russland } };
  },
  titel: (_, ev) => `NATO: ${String(ev.daten?.land ?? "Ein Staat").replace(/^die /, "Die ")} will beitreten`,
  text: (_, ev) => [
    `${String(ev.daten?.land).replace(/^die /, "Die ")} hat den Beitritt zur NATO beantragt; die Mitglieder müssen ihn ratifizieren, und Ankara hat eine Stimme. ${ev.daten?.lage}`,
    "Washington und Brüssel drängen auf Zustimmung; Ankara kann sie geben oder zurückhalten und dafür Zugeständnisse verlangen.",
  ],
  warum: () => "Wer ein Veto hat, hat einen Preis. Die Frage ist, ob man ihn in Waffen, in Zusagen oder in Vertrauen bezahlt bekommen will.",
  optionen: (_, ev) => [
    opt("zustimmen", "Zustimmen, gegen Zusagen bei Rüstung und Terrorbekämpfung", beschr(3, 0, "der Westen dankt, Moskau verzieht die Miene."), 3, (w) => {
      wirke(w, "beziehungen_usa", 5);
      wirke(w, "beziehungen_eu", 2);
      wirke(w, "beziehungen_russland", -4 * (dk(ev, "ru") || 1));
      wirke(w, "militaer", 2);
      wirke(w, "ansehen", 2);
      loyalitaetAendern(w, "aussen", 4);
      return "Die Türkei stimmt zu und erhält Zusagen bei Rüstung und Terrorbekämpfung.";
    }),
    opt("blockieren", "Blockieren, bis die Bedingungen erfüllt sind", beschr(2, 0, "Härte nach innen, Ärger nach außen."), 2, (w) => {
      wirke(w, "beziehungen_usa", -4);
      wirke(w, "beziehungen_eu", -3);
      wirke(w, "beziehungen_russland", 2 * (dk(ev, "ru") || 1));
      wirke(w, "ansehen", -1);
      wirke(w, "konservative", 2);
      vertrauenAendern(w, 1);
      return `Die Türkei blockiert die Ratifizierung des Beitritts von ${ev.daten?.land}.`;
    }),
    opt("zeit", "Zeit gewinnen", beschr(0, 0, "hält alle Optionen offen und kostet Nerven."), 0, (w) => {
      wirke(w, "ansehen", -1);
      loyalitaetAendern(w, "aussen", -2);
      return "Die Regierung vertagt die Entscheidung.";
    }),
  ],
  standard: (w) => {
    wirke(w, "ansehen", -1);
    return "Die Entscheidung wird vertagt; die Verbündeten werden ungeduldig.";
  },
};

const GASVERTRAG: Vorlage = {
  id: "gasvertrag",
  szene: "bank",
  frist: 20,
  abkuehlung: 700,
  chance: (w) => ([3, 9].includes(monatVon(w)) ? 0.04 : 0),
  erzeuge: (_, rng) => ({ provinzen: [], staerke: 1, daten: { land: waehle(rng, ["Russland", "Aserbaidschan", "Iran"]) } }),
  titel: (_, ev) => `Der Gasvertrag mit ${ev.daten?.land} läuft aus`,
  text: (w, ev) => [
    `Der langfristige Liefervertrag für Erdgas mit Lieferanten aus ${ev.daten?.land} steht zur Verlängerung an. Die Energiepreise stehen bei Index ${nf(netz(w, "energiepreise"), 0)}, die Abhängigkeit von Importen bei ${nf(netz(w, "energieimporte"), 0)}.`,
  ],
  warum: () => "Gasverträge binden über Jahre. Ein günstiger Preis ist eine Abhängigkeit, und jede Alternative kostet erst einmal mehr.",
  optionen: (_, ev) => {
    const bez = ev.daten?.land === "Russland" ? "beziehungen_russland" : "beziehungen_nahost";
    return [
    opt("verlaengern", "Langfristig verlängern", beschr(2, 0, "billiges Gas, mehr Abhängigkeit."), 2, (w) => {
      wirke(w, "energiepreise", -3);
      wirke(w, "energieimporte", 2);
      wirke(w, bez, 4);
      wirke(w, "beziehungen_eu", -3);
      return "Der Vertrag wird langfristig verlängert.";
    }),
    opt("diversifizieren", "Neue Lieferanten und Flüssiggas erschließen", beschr(4, 0.2, "teurer heute, unabhängiger morgen."), 4, (w) => {
      kosten(w, 0.2);
      wirke(w, "energiepreise", 2);
      wirke(w, "energieimporte", -3);
      wirke(w, "beziehungen_eu", 2);
      wirke(w, bez, -2);
      return "Neue Lieferanten und Flüssiggas-Terminals werden erschlossen.";
    }),
    opt("kurz", "Nur kurz verlängern", beschr(1, 0, "kauft Zeit, ohne Weichen zu stellen."), 1, () => "Der Vertrag wird um ein Jahr verlängert."),
  ];
  },
  standard: (w) => {
    wirke(w, "energiepreise", 3);
    return "Der Vertrag läuft aus; Notkäufe am Spotmarkt verteuern die Energie.";
  },
};

const GASFUND: Vorlage = {
  id: "gasfund",
  szene: "istanbul",
  frist: 15,
  abkuehlung: 3000,
  chance: (w) => (w.day > 150 ? 0.008 : 0),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => "Ein Gasfeld wird entdeckt",
  text: () => ["Im Schwarzen Meer ist ein bedeutendes Gasfeld gefunden worden. Die Förderung würde Jahre dauern, aber sie verspricht weniger Importe und neue Einnahmen."],
  warum: () => "Ressourcenfunde sind ein Geschenk und eine Versuchung: Sie können Importe ersetzen, Schulden tilgen oder in Subventionen verpuffen.",
  optionen: () => [
    opt("foerdern", "Rasch erschließen", beschr(3, 0.3, "weniger Importe, mehr Klimalast."), 3, (w) => {
      kosten(w, 0.3);
      wirke(w, "energieimporte", -5);
      wirke(w, "energiepreise", -3);
      wirke(w, "auslandskapital", 2);
      wirke(w, "klimaschutz", -2);
      return "Die Erschließung beginnt.";
    }),
    opt("fonds", "Einen Staatsfonds gründen", beschr(4, -0.4, "Einnahmen für kommende Jahre, wenig für heute."), 4, (w) => {
      kosten(w, -0.4);
      wirke(w, "vertrauen_maerkte", 3);
      wirke(w, "energieimporte", -2);
      return "Ein Staatsfonds legt die künftigen Einnahmen an.";
    }),
    opt("senken", "Die Energiepreise sofort senken", beschr(2, 0.2, "populär und teuer."), 2, (w) => {
      kosten(w, 0.2);
      wirke(w, "lebenshaltung", -3);
      vertrauenAendern(w, 2);
      return "Die Regierung senkt die Energiepreise für Haushalte.";
    }),
  ],
  standard: () => "Das Feld wird vermessen; eine Entscheidung fällt nicht.",
};

const CYBER: Vorlage = {
  id: "cyberangriff",
  szene: "istanbul",
  frist: 6,
  abkuehlung: 500,
  chance: () => 0.008,
  erzeuge: (_, rng) => ({ provinzen: [], staerke: 1, daten: { ziel: waehle(rng, CYBER_ZIELE) } }),
  titel: () => "Ein Cyberangriff",
  text: (_, ev) => [`Ein Angriff legt für Stunden ${ev.daten?.ziel} lahm. Die Herkunft ist unklar; Sicherheitsbehörden sprechen von einem professionellen Vorgehen.`],
  warum: () => "Digitale Infrastruktur ist so verwundbar wie sie schlecht geschützt ist. Die Schwachstelle liegt oft nicht in der Technik, sondern in der Zuständigkeit.",
  eroeffne: (w) => {
    wirke(w, "stromversorgung", -3);
    wirke(w, "vertrauen_maerkte", -2);
  },
  optionen: () => [
    opt("behoerde", "Notfallplan und eine Cyberbehörde", beschr(4, 0.1, "schützt künftig, kostet jetzt."), 4, (w) => {
      kosten(w, 0.1);
      wirke(w, "stromversorgung", 4);
      wirke(w, "vertrauen_maerkte", 3);
      return "Ein Notfallplan wird beschlossen, eine Cyberbehörde aufgebaut.";
    }),
    opt("beschuldigen", "Öffentlich einen Staat beschuldigen", beschr(2, 0, "das Land rückt zusammen, die Beweislage bleibt dünn."), 2, (w) => {
      vertrauenAendern(w, 1);
      wirke(w, "beziehungen_nahost", -3);
      wirke(w, "ansehen", -1);
      return "Die Regierung macht einen Staat öffentlich verantwortlich.";
    }),
    opt("still", "Still beheben", beschr(0, 0, "keine Aufregung, keine Lehre."), 0, (w) => {
      wirke(w, "vertrauen_maerkte", -3);
      return "Die Systeme werden ohne öffentliche Erklärung repariert.";
    }),
  ],
  standard: (w) => {
    wirke(w, "vertrauen_maerkte", -3);
    return "Die Behörden schweigen; das Misstrauen wächst.";
  },
};

const WELTKRISE: Vorlage = {
  id: "weltwirtschaftskrise",
  szene: "bank",
  frist: 10,
  abkuehlung: 1500,
  chance: (w) => (w.day > 500 ? 0.012 : 0),
  erzeuge: (_, rng) => ({ provinzen: [], staerke: 0.7 + 0.5 * rng.next() }),
  titel: () => "Eine Weltwirtschaftskrise erreicht die Türkei",
  text: (w, ev) => [
    `Ein Einbruch an den Weltmärkten reißt die Nachfrage nach türkischen Waren ein: Bestellungen werden storniert, Touristen bleiben aus, Auslandskapital zieht ab. Das Wachstum liegt bei ${nf(w.economy.growth)} %, der Risikoaufschlag steigt auf ${nf(w.economy.riskPremium + 60 * ev.staerke, 0)} Basispunkte.`,
    `${anrede(figur(w, "finanzen"))} fragt, ob der Staat stützen oder sparen soll. Wer Kapital zurückgelegt hat, kann jetzt handeln.`,
  ],
  warum: () => "Krisen kommen von außen und treffen die, die am wenigsten Puffer haben. Ein Staat, der in guten Jahren Kapital und Vertrauen aufbaut, hat in schlechten Handlungsspielraum.",
  eroeffne: (w, ev) => {
    w.economy.riskPremium += 60 * ev.staerke;
    w.economy.outputGap -= 1.6 * ev.staerke;
    wirke(w, "export", -6 * ev.staerke);
    wirke(w, "tourismus", -7 * ev.staerke);
    wirke(w, "auslandskapital", -6 * ev.staerke);
    wirke(w, "vertrauen_maerkte", -5 * ev.staerke);
    wirke(w, "mittelstand", -3 * ev.staerke);
  },
  optionen: (_, ev) => [
    opt("konjunktur", "Ein Konjunkturprogramm auflegen", beschr(6, 1.0, "stützt die Nachfrage und die Beschäftigung, kostet Schulden."), 6, (w) => {
      kosten(w, 1.0);
      w.economy.outputGap += 1.0 * ev.staerke;
      wirke(w, "mittelstand", 3);
      wirke(w, "arbeitnehmer", 2);
      vertrauenAendern(w, 2);
      return "Ein Konjunkturprogramm stützt die Wirtschaft.";
    }),
    opt("kurzarbeit", "Kurzarbeit und Kredite für Betriebe", beschr(4, 0.4, "hält Arbeitsplätze, ohne den Haushalt zu sprengen."), 4, (w) => {
      kosten(w, 0.4);
      wirke(w, "mittelstand", 3);
      wirke(w, "arbeitsplaetze_industrie", 3);
      wirke(w, "kredite", 2);
      return "Kurzarbeitergeld und Kreditgarantien federn den Schlag ab.";
    }),
    opt("sparen", "Ruhig bleiben und den Haushalt schützen", beschr(2, 0, "die Märkte danken es, die Betriebe müssen selbst durch."), 2, (w) => {
      wirke(w, "vertrauen_maerkte", 3);
      wirke(w, "mittelstand", -3);
      wirke(w, "arbeitnehmer", -3);
      vertrauenAendern(w, -2);
      return "Die Regierung hält den Haushalt und lässt die Krise auslaufen.";
    }),
  ],
  standard: (w, ev) => {
    w.economy.riskPremium += 30 * ev.staerke;
    wirke(w, "arbeitsplaetze_industrie", -4);
    wirke(w, "armut", 2);
    vertrauenAendern(w, -3);
    return "Ohne Antwort vertieft sich die Krise; die Entlassungen häufen sich.";
  },
};

const PANDEMIE: Vorlage = {
  id: "pandemie",
  szene: "parlament",
  frist: 8,
  abkuehlung: 2000,
  chance: (w) => (w.day > 700 ? 0.007 : 0),
  erzeuge: (_, rng) => ({ provinzen: [], staerke: 0.7 + 0.5 * rng.next() }),
  titel: () => "Eine neue Seuche breitet sich aus",
  text: (w) => [
    `Ein neuer Erreger verbreitet sich schneller als jeder Winterinfekt: Krankenhäuser melden Überlastung, Schulen schließen, Flüge werden gestrichen. Die Gesundheitsversorgung steht bei Index ${nf(netz(w, "gesundheitsversorgung"), 0)}.`,
    "Der Ärzteverband fordert Maßnahmen; die Wirtschaft warnt vor einem Stillstand.",
  ],
  warum: () => "Seuchen zeigen, wie belastbar ein Gesundheitssystem und ein Staat sind. Beschränkungen schützen Leben und kosten Wirtschaft; beides zugleich lässt sich nicht maximieren.",
  eroeffne: (w, ev) => {
    wirke(w, "gesundheitsversorgung", -6 * ev.staerke);
    wirke(w, "wartezeiten", 8 * ev.staerke);
    wirke(w, "produktivitaet", -3 * ev.staerke);
    wirke(w, "tourismus", -6 * ev.staerke);
  },
  optionen: (_, ev) => [
    opt("beschraenken", "Strenge Beschränkungen und Impfprogramm", beschr(6, 0.5, "schützt Leben, kostet Wirtschaftsleistung und Geduld."), 6, (w) => {
      kosten(w, 0.5);
      wirke(w, "gesundheitsversorgung", 5 * ev.staerke);
      wirke(w, "wartezeiten", -4);
      wirke(w, "produktivitaet", -2);
      wirke(w, "tourismus", -3);
      vertrauenAendern(w, 1.5);
      return "Beschränkungen und ein Impfprogramm dämmen die Ausbreitung ein.";
    }),
    opt("gezielt", "Gezielt schützen: Risikogruppen und Krankenhäuser", beschr(4, 0.3, "ein Mittelweg."), 4, (w) => {
      kosten(w, 0.3);
      wirke(w, "gesundheitsversorgung", 3 * ev.staerke);
      wirke(w, "wartezeiten", -2);
      return "Risikogruppen und Krankenhäuser werden gezielt geschützt.";
    }),
    opt("offen", "Das Land offen halten", beschr(1, 0, "die Wirtschaft läuft, das Gesundheitssystem gerät an die Grenze."), 1, (w) => {
      wirke(w, "gesundheitsversorgung", -3 * ev.staerke);
      wirke(w, "wartezeiten", 4);
      vertrauenAendern(w, -2);
      return "Die Regierung hält das Land offen; die Krankenhäuser laufen voll.";
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "gesundheitsversorgung", -4 * ev.staerke);
    wirke(w, "wartezeiten", 5);
    vertrauenAendern(w, -3);
    return "Ohne klare Linie breitet sich die Seuche aus; das Vertrauen sinkt.";
  },
};

export const AUSSEN_VORLAGEN: Vorlage[] = [GRENZZWISCHENFALL, EU_ANGEBOT, IWF, RATING, NATO, GASVERTRAG, GASFUND, CYBER, WELTKRISE, PANDEMIE];


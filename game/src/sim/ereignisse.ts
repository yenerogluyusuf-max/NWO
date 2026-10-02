// Ereignismotor: Ereignisse entstehen aus dem Zustand der Welt (Weltmodell, Abschnitt 7), nicht aus einem Drehbuch.
// Jede Vorlage ist ein Muster mit Bedingung, Ort, Stärke und mindestens zwei Antworten, die etwas kosten.
// Wer nichts entscheidet, bekommt nach der Frist die schlechtere Standardfolge.
// Alle Wahrscheinlichkeiten und Wirkungen sind Platzhalter der Kalibrierung (vgl. SZENARIEN.md, Wirkungsmodell).
//
// TODO (Energie-Modul): Die zehn Ereignis-Hooks aus RECHERCHE_ENERGIE.md, Abschnitt 6.3,
// als Vorlagen einbauen — u. a. „Poker mit dem Kreml“ (RU-Gasvertrag läuft 12/2026 aus,
// terminfest), „Iran-Leere“, „Hormuz-Blockade“ (Brent-Szenarien), „Kälteeinbruch Februar“
// (Speicher-Drawdown), „Pipeline-Sabotage“, „Dürrejahr“ (Hydro-Einbruch), „Akkuyu-Zeitplan“,
// „Blackout-Warnung“ (Sommer-Peak), „Tuapse/Novorossiysk“, „EU-CBAM startet“.
// Anknüpfung an die neuen Knoten des Energie-Moduls (politiknetz.ts): energieversorgung,
// p_energiemangel, energie_importrechnung, energie_subventionslast, strompreis,
// gasabhaengigkeit, sakarya_gas, strommix.

import { NET } from "./modell";
import { nationalAverage, PROVINCES } from "./netz";
import { PROVINZEN, SEISMIC, BORDER } from "./regional";
import { wirke, wertIn, vertrauenAendern } from "./wirkung";
import { addLog } from "./log";
import { clamp } from "./economy";
import { anrede, ersetze, figur, partnerFigur } from "./figuren";
import { criticizeCentralBank, replaceGovernor, setFiscalImpulse } from "./eingriffe";
import { REGELN, bringeEin, provinzenText, pruefeVorhaben, setPolicy, setzeEinbringHaken, stufeIn } from "./handeln";
import { FORDERUNG, bereitschaftAendern, forderungVon } from "./fraktionen";
import { INNEN_VORLAGEN } from "./ereignisse-innen";
import { INITIATIVE_VORLAGEN, INITIATIVE_VORLAGE_IDS } from "./initiative";
import { schutzFuer } from "./programme";
import { schwierig } from "./spiel";
import { AUSSEN_VORLAGEN } from "./ereignisse-aussen";
import { KRIEG_VORLAGEN } from "./ereignisse-krieg";
import { REICH_VORLAGEN } from "./ereignisse-reich";
import { PERSONEN_VORLAGEN } from "./ereignisse-personen";
import { VERFASSUNG_VORLAGEN } from "./ereignisse-verfassung";
import { setzeVerfassungsOeffner } from "./verfassung";
import { brecheZusage, loeseZusageEin, vertroesteZusage, zusageBezug, zusageVorhaben } from "./zusagen";
import { skala, skalenArt } from "../data/skalen";
import { PROZ_STADT, akutIn, dk, einwohner, kosten, monatVon, namen, nf, opt, sommer, ziehe } from "./ereignis-hilfen";
import type { Option, SzenenName, Vorlage } from "./ereignis-hilfen";
import { Rng } from "./rng";
import type { World } from "./types";
import type { OffenesEreignis } from "./spiel-typen";
import { kannZahlen } from "./kapital";
import { VERFASSUNG, belastungEreignis } from "./aufmerksamkeit";

export type { Option, Vorlage, SzenenName } from "./ereignis-hilfen";
/** Stellschraube für die Häufigkeit aller Ereignisse. */
export const EREIGNIS_RATE = 1;

/** Die zweite Hälfte einer Amtszeit ist rauer: Krisen werden häufiger, je länger man regiert (Regierungsalter). Nur Krisen aus der Außenwelt und der Wirtschaft. */
const ALTERSKRISEN = new Set(["weltwirtschaftskrise", "pandemie", "waehrungsrutsch", "energiepreisschock", "haushaltsdruck", "bankenstress"]);
function alterFaktor(world: World, id: string): number {
  if (!ALTERSKRISEN.has(id)) return 1;
  const jahre = world.day / 365;
  return 1 + Math.min(1.2, 0.18 * Math.max(0, jahre - 1.5));
}

/** Feste Termine des Staatsjahres: Sie kommen immer und zählen nicht zur Dichte. */
const TERMINE = new Set(["mindestlohn", "haushaltsjahr", "kommunalwahl", "zusage", "koalitionsangebot"]);
/** Ab so vielen Ereignissen in zwölf Monaten (offen oder entschieden) werden neue seltener: Das Spiel soll fordern, nicht zuschütten. */
const DICHTE_SCHWELLE = 6;
function dichteFaktor(world: World, id: string): number {
  if (TERMINE.has(id) || id.startsWith("start_")) return 1;
  const sp = world.spiel;
  if (!sp) return 1;
  const grenze = world.day - 365;
  let n = sp.ereignisse.filter((e) => !TERMINE.has(e.vorlage) && !e.vorlage.startsWith("start_")).length;
  for (let i = sp.chronik.length - 1; i >= 0; i--) {
    const c = sp.chronik[i]!;
    if (c.tag < grenze) break;
    // ZEI-1: Die Haken des Ereignis-Wettbewerbs („ausgesessen“/„gärt weiter“) sind keine Präsentationen und zählen nicht zur Dichte
    if (/^(Ausgesessen|Im Hintergrund)/.test(c.ausgang)) continue;
    if (!/^(Wirkungsbericht|Schritt erreicht|Programm erfüllt|Der Mindestlohn|Der Haushalt für|Kommunalwahlen|Zusage fällig)/.test(c.titel)) n++;
  }
  return n <= DICHTE_SCHWELLE ? 1 : Math.max(0.3, 1 - 0.14 * (n - DICHTE_SCHWELLE));
}

// ---------------------------------------------------------------------------
// Vorlagen

const ERDBEBEN: Vorlage = {
  id: "erdbeben",
  szene: "anatolien",
  frist: 7,
  abkuehlung: 240,
  chance: () => 0.028,
  erzeuge: (w, rng) => {
    const p = ziehe(rng, (pl) => (SEISMIC.has(pl) ? 1 : 0.05) * wertIn(w, "p_erdbebengefahr", [pl]) ** 2, 1);
    if (!p.length) return null;
    const staerke = rng.next() ** 1.5 * 0.65 + 0.35;
    const vorsorge = (wertIn(w, "erdbebenvorsorge", p) + wertIn(w, "bauqualitaet", p)) / 200;
    const schaden = clamp(staerke * (1.25 - 0.8 * vorsorge), 0.05, 1);
    return { provinzen: p, staerke, daten: { mag: 5.6 + 1.9 * staerke, schaden, vorsorge } };
  },
  titel: (_, ev) => `Erdbeben in ${namen(ev.provinzen)}`,
  text: (w, ev) => {
    const s = dk(ev, "schaden");
    const wort = s < 0.3 ? "Schäden an einzelnen Gebäuden" : s < 0.6 ? "schwere Schäden in mehreren Stadtvierteln" : "eingestürzte Häuser und viele Menschen ohne Obdach";
    return [
      `Ein Erdbeben der Stärke ${nf(dk(ev, "mag"))} erschüttert ${namen(ev.provinzen)} (${einwohner(ev.provinzen).toLocaleString("de-DE")} Einwohner). Gemeldet werden ${wort}.`,
      `${anrede(figur(w, "inneres"))} bittet um Ihre Anweisungen. Die Rettungskräfte sind unterwegs; die Frage ist, wie der Staat in den nächsten Wochen und Monaten auftritt.`,
    ];
  },
  warum: (_, ev) => `Wie schwer es trifft, hängt an Bauqualität und Erdbebenvorsorge der Provinz (hier ${nf(dk(ev, "vorsorge") * 100, 0)} von 100). Alte Häuser und schwache Bauaufsicht machen den Unterschied.`,
  eroeffne: (w, ev) => {
    const s = dk(ev, "schaden");
    wirke(w, "wohnungsbau", -10 * s, ev.provinzen);
    wirke(w, "bauwirtschaft", -4 * s, ev.provinzen);
    wirke(w, "p_wohnungsnot", 12 * s, ev.provinzen);
    wirke(w, "lebenshaltung", 4 * s, ev.provinzen);
    vertrauenAendern(w, -2 * s);
  },
  optionen: (_, ev) => {
    const s = dk(ev, "schaden");
    return [
      opt("fonds", "Notstand und Wiederaufbaufonds", `Kostet ${nf(0.5 * s + 0.1)} % des BIP und 8 Kapital; schnelle Aufträge machen Korruption wahrscheinlicher.`, 8, (w) => {
        kosten(w, 0.5 * s + 0.1);
        wirke(w, "wohnungsbau", 8 * s, ev.provinzen);
        wirke(w, "p_wohnungsnot", -8 * s, ev.provinzen);
        wirke(w, "korruption", 2 * s + 1);
        vertrauenAendern(w, 3.5 * s);
        return "Ein Wiederaufbaufonds wird aufgelegt; die Aufträge laufen schnell, aber nicht überall sauber.";
      }),
      opt("nothilfe", "Nur Nothilfe und Zelte", `Kostet ${nf(0.1 * s + 0.03)} % des BIP und 2 Kapital; der Wiederaufbau bleibt Sache der Provinz.`, 2, (w) => {
        kosten(w, 0.1 * s + 0.03);
        vertrauenAendern(w, -1 * s);
        return "Der Staat leistet Nothilfe und überlässt den Wiederaufbau den Betroffenen und der Provinz.";
      }),
      opt("untersuchung", "Bauaufsicht und Bauunternehmer untersuchen", `Kostet 5 Kapital und ${nf(0.15 * s + 0.05)} % des BIP; ehrlich, aber nicht schnell.`, 5, (w) => {
        kosten(w, 0.15 * s + 0.05);
        wirke(w, "erdbebenvorsorge", 3);
        wirke(w, "bauqualitaet", 2);
        wirke(w, "korruption", -2);
        vertrauenAendern(w, 1.5 * (1 - dk(ev, "vorsorge")));
        return "Eine Untersuchung der Bauaufsicht beginnt; Bauunternehmer und Kommunen geraten unter Druck.";
      }),
    ];
  },
  standard: (w, ev) => {
    kosten(w, 0.05);
    vertrauenAendern(w, -2.5 * dk(ev, "schaden"));
    wirke(w, "p_wohnungsnot", 3 * dk(ev, "schaden"), ev.provinzen);
    return "Der Staat reagiert zu spät; die Betroffenen fühlen sich allein gelassen.";
  },
};

const DUERRE: Vorlage = {
  id: "duerre",
  szene: "anatolien",
  frist: 10,
  abkuehlung: 300,
  chance: (w) => (sommer(w) ? 0.06 * (0.6 + nationalAverage(NET, w.net, "duerre") / 60) : 0),
  erzeuge: (w, rng) => {
    const p = ziehe(rng, (pl) => wertIn(w, "p_wassermangel", [pl]) ** 3, 4);
    if (!p.length) return null;
    return { provinzen: p, staerke: 0.4 + 0.6 * rng.next() };
  },
  titel: () => "Dürre",
  text: (w, ev) => [
    `Seit Wochen fällt in ${namen(ev.provinzen)} kaum Regen. Die Getreideernte ist gefährdet, die Talsperren sind halb leer.`,
    `Der Bauernverband fordert Hilfe; in den Städten wird über Wasserrationierung geredet. ${anrede(figur(w, "finanzen"))} erinnert an die Haushaltslage.`,
  ],
  warum: () => "Wasserversorgung, Bewässerung und Talsperren entscheiden, ob aus einer trockenen Saison eine Krise wird.",
  eroeffne: (w, ev) => {
    wirke(w, "ernte", -8 * ev.staerke, ev.provinzen);
    wirke(w, "lebensmittelpreise", 6 * ev.staerke, ev.provinzen);
    wirke(w, "landwirtschaft_einkommen", -6 * ev.staerke, ev.provinzen);
  },
  optionen: (_, ev) => [
    opt("hilfe", "Soforthilfe für Landwirte", `Kostet ${nf(0.12)} % des BIP und 3 Kapital.`, 3, (w) => {
      kosten(w, 0.12);
      wirke(w, "landwirtschaft_einkommen", 5 * ev.staerke, ev.provinzen);
      wirke(w, "ernte", 3 * ev.staerke, ev.provinzen);
      return "Landwirte erhalten Soforthilfe und Wassertransporte.";
    }),
    opt("import", "Getreide importieren", `Kostet ${nf(0.08)} % des BIP und 2 Kapital; dämpft Preise, drückt aber die Erzeuger.`, 2, (w) => {
      kosten(w, 0.08);
      wirke(w, "lebensmittelpreise", -5 * ev.staerke, ev.provinzen);
      wirke(w, "landwirtschaft_einkommen", -2 * ev.staerke, ev.provinzen);
      return "Getreide wird importiert; die Preise beruhigen sich, die Bauern murren.";
    }),
    opt("rationieren", "Trinkwasser in den Städten rationieren", "Kostet 3 Kapital und Vertrauen; verhindert Schlimmeres.", 3, (w) => {
      vertrauenAendern(w, -1.5 * ev.staerke);
      wirke(w, "wasserversorgung", 3, ev.provinzen);
      return "Das Wasser wird rationiert; das ist unbeliebt, aber die Versorgung hält.";
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "ernte", -4 * ev.staerke, ev.provinzen);
    wirke(w, "wasserversorgung", -4 * ev.staerke, ev.provinzen);
    vertrauenAendern(w, -2 * ev.staerke);
    return "Ohne Entscheidung verschärft sich die Lage: Ernten fallen aus, Wasser wird knapp.";
  },
};

const WAEHRUNG: Vorlage = {
  id: "waehrungsrutsch",
  szene: "bank",
  frist: 5,
  abkuehlung: 240,
  chance: (w) => {
    const h = w.history;
    const letzter = h[h.length - 1];
    const davor = h[h.length - 2];
    const monat = letzter && davor ? (letzter.usdTry / davor.usdTry - 1) * 100 : 0;
    return monat > 6 || w.economy.riskPremium > 420 ? 0.5 : 0.006;
  },
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => "Die Lira rutscht",
  text: (w) => [
    `Die Lira verliert an den Märkten schnell an Wert (${nf(w.economy.usdTry)} je Dollar); der Risikoaufschlag liegt bei ${nf(w.economy.riskPremium, 0)} Basispunkten.`,
    `${anrede(figur(w, "finanzen"))} und ${anrede(figur(w, "zentralbank"))} warten auf ein Signal. Die Zinsen legt die Zentralbank fest, nicht der Präsident.`,
  ],
  warum: () => "Die Währung reagiert auf Inflationsabstand, Zinsen, Risikoaufschlag und Vertrauen. Kurzfristige Eingriffe kaufen Zeit, lösen die Ursache aber nicht.",
  optionen: () => [
    opt("reserven", "Devisenreserven einsetzen", "Kostet 3 Kapital; stützt die Lira kurz, die Reserven sinken.", 3, (w) => {
      w.economy.usdTry *= 0.96;
      w.economy.eurTry *= 0.96;
      w.economy.riskPremium += 20;
      w.economy.credibility = clamp(w.economy.credibility - 0.02, 0.05, 0.95);
      return "Die Zentralbank verkauft Reserven; die Lira erholt sich kurz.";
    }),
    opt("kapital", "Kapitalverkehr beschränken", "Kostet 6 Kapital; stützt die Lira stark, schreckt aber Investoren ab und fördert den Schwarzmarkt.", 6, (w) => {
      w.economy.usdTry *= 0.93;
      w.economy.eurTry *= 0.93;
      w.economy.credibility = clamp(w.economy.credibility - 0.06, 0.05, 0.95);
      wirke(w, "auslandskapital", -8);
      wirke(w, "schattenwirtschaft", 5);
      wirke(w, "vertrauen_maerkte", -8);
      return "Der Kapitalverkehr wird beschränkt; die Lira stabilisiert sich, das Ausland zieht sich zurück.";
    }),
    opt("ruhe", "Ruhe bewahren und die Zentralbank stützen", "Kostet 2 Kapital; hilft langfristig, kurzfristig bleibt der Druck.", 2, (w) => {
      w.economy.credibility = clamp(w.economy.credibility + 0.02, 0.05, 0.95);
      w.economy.riskPremium -= 10;
      const g = figur(w, "zentralbank");
      if (g) g.loyalitaet = Math.min(100, g.loyalitaet + 6);
      return "Der Präsident bekennt sich öffentlich zur Unabhängigkeit der Zentralbank.";
    }),
  ],
  standard: (w) => {
    w.economy.riskPremium += 30;
    w.economy.usdTry *= 1.03;
    w.economy.eurTry *= 1.03;
    w.economy.credibility = clamp(w.economy.credibility - 0.03, 0.05, 0.95);
    return "Ohne Signal setzt sich der Abverkauf fort.";
  },
};

const ENERGIE: Vorlage = {
  id: "energiepreisschock",
  szene: "istanbul",
  frist: 10,
  abkuehlung: 240,
  chance: (w) => ((w.economy.oel ?? 100) > 128 ? 0.6 : 0),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => "Energiepreise steigen",
  text: (w) => [
    `Der Energiepreis am Weltmarkt liegt ${nf(((w.economy.oel ?? 100) - 100), 0)} Prozent über dem Normalstand. Die Türkei importiert den größten Teil ihrer Energie.`,
    "Strom-, Gas- und Benzinrechnungen steigen. Die Opposition spricht vom Winter der leeren Portemonnaies.",
  ],
  warum: () => "Energieimporte belasten Handelsbilanz, Lira und Inflation gleichzeitig; Subventionen dämpfen die Rechnung und kosten den Haushalt.",
  eroeffne: (w) => {
    wirke(w, "energiepreise", 6);
    wirke(w, "lebenshaltung", 3);
  },
  optionen: () => [
    opt("deckel", "Preise deckeln (Subventionen)", "Kostet 0,4 % des BIP und 3 Kapital; entlastet Haushalte, belastet den Staat.", 3, (w) => {
      kosten(w, 0.4);
      wirke(w, "energiepreise", -6);
      wirke(w, "lebenshaltung", -3);
      return "Energiepreise werden gedeckelt; der Staat trägt die Differenz.";
    }),
    opt("haerte", "Preise durchlassen, Härtefälle stützen", "Kostet 0,15 % des BIP und 2 Kapital; ehrlich, aber schmerzhaft.", 2, (w) => {
      kosten(w, 0.15);
      wirke(w, "lebenshaltung", 1);
      vertrauenAendern(w, -1.5);
      return "Die Preise werden durchgereicht; Härtefälle erhalten Zuschüsse.";
    }),
    opt("sparen", "Sparappell und Tempolimit", "Kostet 2 Kapital; wirkt wenig, kostet wenig.", 2, (w) => {
      wirke(w, "energieimporte", -2);
      vertrauenAendern(w, -0.5);
      return "Ein Sparappell geht an Haushalte und Betriebe.";
    }),
  ],
  standard: (w) => {
    vertrauenAendern(w, -2);
    wirke(w, "lebenshaltung", 2);
    return "Die Preise steigen ungebremst; der Unmut wächst.";
  },
};

const HAUSHALT: Vorlage = {
  id: "haushaltsdruck",
  szene: "bank",
  frist: 12,
  abkuehlung: 400,
  chance: (w) => (w.economy.riskPremium > 450 || w.economy.debtRatio > 45 ? 0.4 : 0),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => "Die Ratingagenturen drohen",
  text: (w) => [
    `Mehrere Ratingagenturen kündigen eine Herabstufung an: Die Schuldenquote liegt bei ${nf(w.economy.debtRatio)} % des BIP, der Risikoaufschlag bei ${nf(w.economy.riskPremium, 0)} Basispunkten.`,
    `${anrede(figur(w, "finanzen"))} verlangt ein Signal, dass der Haushalt gesteuert wird.`,
  ],
  warum: () => "Höhere Risikoaufschläge machen Kredite teurer; wer den Haushalt nicht im Griff hat, zahlt dafür mit Zinsen und einer schwachen Währung.",
  optionen: () => [
    opt("sparpaket", "Sparpaket", "Kostet 6 Kapital und Vertrauen; beruhigt die Märkte, der Finanzminister ist zufrieden.", 6, (w) => {
      setFiscalImpulse(w, w.economy.fiscalImpulse - 1.5);
      wirke(w, "vertrauen_maerkte", 6);
      vertrauenAendern(w, -3);
      const f = figur(w, "finanzen");
      if (f) f.loyalitaet = Math.min(100, f.loyalitaet + 8);
      return "Ein Sparpaket wird angekündigt; die Märkte atmen auf, das Land murrt.";
    }),
    opt("steuer", "Steuern anheben", "Kostet 6 Kapital; bringt Einnahmen, trifft die Haushalte.", 6, (w) => {
      w.economy.debtRatio -= 0.6;
      wirke(w, "steuereinnahmen", 4);
      wirke(w, "lebenshaltung", 3);
      vertrauenAendern(w, -2);
      return "Steuern werden angehoben; das Loch im Haushalt wird kleiner.";
    }),
    opt("wachstum", "Auf Wachstum setzen", "Kostet nichts, aber die Märkte glauben es nicht.", 0, (w) => {
      w.economy.riskPremium += 40;
      return "Der Präsident verspricht, aus den Problemen herauszuwachsen; die Märkte sind skeptisch.";
    }),
  ],
  standard: (w) => {
    w.economy.riskPremium += 50;
    w.economy.credibility = clamp(w.economy.credibility - 0.03, 0.05, 0.95);
    return "Die Agenturen stufen das Land herab; Kredite werden teurer.";
  },
};

/** Vier Geschichten mit demselben Kern: öffentliches Geld, kein Wettbewerb, Nähe zur Regierung. Die Variante wird beim Eintreten gezogen, damit sich Affären nicht wie Kopien lesen. */
const AFFAEREN = [
  { titel: "Eine Vergabeaffäre", text: "Ein Bericht deckt auf, dass ein großer Bauauftrag ohne echte Ausschreibung an eine Firma mit Nähe zur Regierung ging." },
  { titel: "Ein Beschaffungsskandal", text: "Eine Zeitung veröffentlicht Unterlagen, nach denen das Verteidigungsministerium Ausrüstung zu weit überhöhten Preisen bei einem einzigen Lieferanten bestellt hat." },
  { titel: "Klinikeinkauf unter Verdacht", text: "Der Rechnungshof beanstandet, dass ein Krankenhausverbund Geräte und Medikamente über einen Zwischenhändler bezogen hat, der einem Parteifreund gehört." },
  { titel: "Fragwürdige Energieverträge", text: "Ein Untersuchungsausschuss der Opposition legt Verträge vor, nach denen ein staatlicher Versorger Strom aus Anlagen eines Regierungsnahen zu festen Preisen abnehmen muss." },
] as const;

const KORRUPTION: Vorlage = {
  id: "korruptionsaffaere",
  szene: "parlament",
  frist: 10,
  abkuehlung: 420,
  chance: (w) => 0.03 * (0.5 + nationalAverage(NET, w.net, "korruption") / 50) * (w.player?.partner.includes("Bauunternehmer") ? 1.6 : 1),
  // Es kommt eine der Geschichten, die am längsten nicht erzählt wurde (unter mehreren gleich alten entscheidet der Zufall)
  erzeuge: (w, rng) => {
    const alter = AFFAEREN.map((_, i) => w.spiel?.zuletzt[`korruptionsaffaere#${i}`] ?? -1e9);
    const aelteste = Math.min(...alter);
    const kandidaten = alter.flatMap((t, i) => (t === aelteste ? [i] : []));
    return { provinzen: [], staerke: 1, daten: { variante: kandidaten[Math.floor(rng.next() * kandidaten.length)]! } };
  },
  eroeffne: (w, ev) => {
    if (w.spiel) w.spiel.zuletzt[`korruptionsaffaere#${Number(ev.daten?.variante ?? 0)}`] = w.day;
  },
  titel: (_w, ev) => AFFAEREN[Number(ev.daten?.variante ?? 0)]?.titel ?? AFFAEREN[0].titel,
  text: (w, ev) => {
    const v = Number(ev.daten?.variante ?? 0);
    return [
      v === 0 && w.player?.partner.includes("Bauunternehmer")
        ? "Ein Bericht deckt auf, dass eine Baufirma aus dem Umfeld Ihrer Familie einen staatlichen Auftrag ohne echte Ausschreibung erhalten hat."
        : (AFFAEREN[v]?.text ?? AFFAEREN[0].text),
      `${anrede(figur(w, "stab"))} rät zu einer schnellen Entscheidung, bevor die Opposition die Geschichte bestimmt.`,
    ];
  },
  warum: () => "Korruption entsteht aus schwacher Kontrolle, Zeitdruck und Nähe. Sie schadet dem Vertrauen und lässt sich nicht einfach wegwischen.",
  optionen: () => [
    opt("aufklaeren", "Untersuchung zulassen", "Kostet 3 Kapital und kurzfristig Vertrauen; zahlt sich später aus.", 3, (w) => {
      vertrauenAendern(w, -2);
      wirke(w, "korruption", -4);
      wirke(w, "justizvertrauen", 2);
      return "Eine unabhängige Untersuchung wird zugelassen.";
    }),
    opt("abwiegeln", "Abwiegeln", "Kostet 1 Kapital; die Geschichte bleibt und wächst.", 1, (w) => {
      vertrauenAendern(w, -3);
      wirke(w, "korruption", 2);
      wirke(w, "pressefreiheit", -1);
      return "Die Regierung weist die Vorwürfe zurück; die Presse bohrt weiter.";
    }),
    opt("opfern", "Einen Verantwortlichen fallen lassen", "Kostet 4 Kapital; ein Kabinettsmitglied verliert das Amt.", 4, (w, _e, rng) => {
      vertrauenAendern(w, -0.5);
      const opfer = rng.next() < 0.5 ? "inneres" : "aussen";
      const alt = figur(w, opfer);
      const name = alt ? anrede(alt) : "Ein Verantwortlicher";
      ersetze(w, opfer, rng);
      return `${name} tritt zurück; die Affäre verliert an Schärfe.`;
    }),
  ],
  standard: (w) => {
    vertrauenAendern(w, -3);
    wirke(w, "korruption", 3);
    return "Die Affäre wächst; der Eindruck von Vertuschung bleibt hängen.";
  },
};

const STREIK: Vorlage = {
  id: "streikwelle",
  szene: "istanbul",
  frist: 10,
  abkuehlung: 240,
  chance: (w) => (akutIn(w, "p_streiks").length > 0 ? 0.15 : w.economy.inflation > 25 && nationalAverage(NET, w.net, "realeinkommen") < 48 ? 0.08 : 0.008),
  erzeuge: (w, rng) => {
    const p = ziehe(rng, (pl) => wertIn(w, "streikneigung", [pl]) ** 2 * (PROVINZEN[pl - 1]?.grossstadt ? 2 : 1), 3);
    return p.length ? { provinzen: p, staerke: 0.5 + 0.5 * rng.next() } : null;
  },
  titel: () => "Streikwelle",
  text: (w, ev) => [
    `In ${namen(ev.provinzen)} legen Beschäftigte die Arbeit nieder. Die Löhne halten mit den Preisen nicht Schritt (Inflation ${nf(w.published.inflation.value)} %).`,
    "Die Gewerkschaften fordern einen Inflationsausgleich; die Unternehmen warnen vor Kosten und Entlassungen.",
  ],
  warum: () => "Wenn Preise schneller steigen als Löhne, wächst die Streikbereitschaft. Lohnzugeständnisse dämpfen sie, treiben aber die Kosten der Betriebe und damit die Inflation.",
  eroeffne: (w, ev) => {
    wirke(w, "produktivitaet", -3 * ev.staerke, ev.provinzen);
    wirke(w, "streikneigung", 4 * ev.staerke, ev.provinzen);
  },
  optionen: (_, ev) => [
    opt("lohn", "Lohnzugeständnis", "Kostet 3 Kapital und 0,2 % des BIP; beruhigt die Beschäftigten, treibt den Kostendruck.", 3, (w) => {
      kosten(w, 0.2);
      wirke(w, "streikneigung", -8 * ev.staerke, ev.provinzen);
      wirke(w, "arbeitnehmer", 4, ev.provinzen);
      wirke(w, "kostendruck", 3);
      return "Der Staat gibt beim Lohn nach; die Streiks enden, die Betriebe ächzen.";
    }),
    opt("verbot", "Streiks verbieten", "Kostet 5 Kapital; unterdrückt kurz, vertieft die Spaltung.", 5, (w) => {
      wirke(w, "streikneigung", -5 * ev.staerke, ev.provinzen);
      wirke(w, "polarisierung", 6);
      wirke(w, "rechtssicherheit", -4);
      wirke(w, "arbeitnehmer", -6);
      return "Die Streiks werden verboten; die Gewerkschaften sprechen von einem Angriff auf ihre Rechte.";
    }),
    opt("vermitteln", "Vermitteln", "Kostet 3 Kapital; ein Kompromiss, den keiner feiert.", 3, (w) => {
      wirke(w, "streikneigung", -4 * ev.staerke, ev.provinzen);
      wirke(w, "arbeitnehmer", 1);
      wirke(w, "unternehmer", -1);
      return "Eine Schlichtung bringt einen Kompromiss.";
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "produktivitaet", -3 * ev.staerke, ev.provinzen);
    vertrauenAendern(w, -1.5);
    return "Die Streiks dauern an; Produktion und Vertrauen leiden.";
  },
};

const MIETE: Vorlage = {
  id: "mietproteste",
  szene: "istanbul",
  frist: 10,
  abkuehlung: 300,
  chance: (w) => (akutIn(w, "p_wohnungsnot").length > 0 ? 0.12 : 0.005),
  erzeuge: (w, rng) => {
    const akut = akutIn(w, "p_wohnungsnot");
    const p = ziehe(rng, (pl) => (akut.includes(pl) ? (PROVINZEN[pl - 1]?.bevoelkerung ?? 0) : 0), 2);
    return p.length ? { provinzen: p, staerke: 0.5 + 0.5 * rng.next() } : null;
  },
  titel: () => "Mietproteste",
  text: (_, ev) => [
    `In ${namen(ev.provinzen)} gehen Tausende Mieterinnen und Mieter auf die Straße: Die Mieten fressen die Einkommen auf.`,
    "Vermieter und Bauunternehmer warnen, dass Eingriffe den Neubau abwürgen.",
  ],
  warum: () => "Hohe Mieten sind Angebot und Nachfrage in der Stadt; ein Deckel entlastet sofort, schmälert aber auf Dauer den Neubau.",
  eroeffne: (w, ev) => {
    wirke(w, "junge", -3 * ev.staerke, ev.provinzen);
    wirke(w, "staedtische_saekulare", -2 * ev.staerke, ev.provinzen);
  },
  optionen: (_, ev) => [
    opt("deckel", "Mieten deckeln", "Kostet 4 Kapital; wirkt sofort, bremst den Neubau.", 4, (w) => {
      wirke(w, "mieten", -6 * ev.staerke, ev.provinzen);
      wirke(w, "wohnungsbau", -3, ev.provinzen);
      wirke(w, "unternehmer", -2);
      return "Die Mieten werden gedeckelt; Bauinvestoren ziehen sich zurück.";
    }),
    opt("sozial", "Sozialwohnungen versprechen", "Kostet 3 Kapital und 0,2 % des BIP; die Wirkung kommt spät.", 3, (w) => {
      kosten(w, 0.2);
      wirke(w, "p_wohnungsnot", -3 * ev.staerke, ev.provinzen);
      wirke(w, "junge", 3, ev.provinzen);
      return "Ein Sozialwohnungsprogramm wird angekündigt.";
    }),
    opt("raeumen", "Proteste auflösen", "Kostet 2 Kapital; verschärft die Fronten.", 2, (w) => {
      wirke(w, "polarisierung", 5);
      wirke(w, "pressefreiheit", -2);
      wirke(w, "junge", -5, ev.provinzen);
      wirke(w, "staedtische_saekulare", -5, ev.provinzen);
      return "Die Polizei löst die Proteste auf; die Wut bleibt.";
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "junge", -3 * ev.staerke, ev.provinzen);
    vertrauenAendern(w, -1);
    return "Die Proteste wachsen; niemand fühlt sich zuständig.";
  },
};

const FLUECHTLINGE: Vorlage = {
  id: "fluechtlingswelle",
  szene: "anatolien",
  frist: 10,
  abkuehlung: 400,
  chance: () => 0.018,
  erzeuge: (_, rng) => ({ provinzen: [...new Set([31, ...[...BORDER].filter(() => rng.next() < 0.6).slice(0, 3)])], staerke: 0.4 + 0.6 * rng.next() }),
  titel: () => "Neue Fluchtbewegung an der Grenze",
  text: (w, ev) => [
    `An der Südgrenze kommen wieder mehr Menschen an, vor allem aus Syrien, und sie bleiben zuerst in ${namen([...new Set(ev.provinzen)])}. Die Provinzen sind ohnehin belastet.`,
    `${anrede(figur(w, "inneres"))} und ${anrede(figur(w, "aussen"))} sind sich nicht einig, was zu tun ist.`,
  ],
  warum: () => "Migration verbindet Innen-, Außen- und Wirtschaftspolitik: Grenzschutz, Aufnahme, Integration und Verhandlungen mit der EU kosten jeweils etwas anderes.",
  eroeffne: (w, ev) => {
    wirke(w, "gefluechtete", 6 * ev.staerke, ev.provinzen);
    wirke(w, "p_migrationsdruck", 5 * ev.staerke, ev.provinzen);
  },
  optionen: (_, ev) => [
    opt("grenze", "Grenze sichern (Erlass)", "Kostet 4 Kapital; weniger Ankünfte, Kritik von Menschenrechtlern.", 4, (w) => {
      wirke(w, "gefluechtete", -5 * ev.staerke, ev.provinzen);
      wirke(w, "beziehungen_eu", 2);
      wirke(w, "konservative", 2);
      return "Die Grenze wird stärker gesichert; die Ankünfte gehen zurück.";
    }),
    opt("aufnehmen", "Aufnehmen und integrieren", "Kostet 3 Kapital und 0,25 % des BIP; menschlich, aber politisch riskant.", 3, (w) => {
      kosten(w, 0.25);
      wirke(w, "beziehungen_eu", 3);
      wirke(w, "p_migrationsdruck", 4 * ev.staerke, ev.provinzen);
      wirke(w, "konservative", -2);
      return "Die Menschen werden aufgenommen; die Provinzen bekommen Unterstützung, die Stimmung bleibt gespalten.";
    }),
    opt("eu", "Mit der EU verhandeln", "Kostet 5 Kapital; wenn es klappt, zahlt die EU.", 5, (w) => {
      w.economy.debtRatio -= 0.1;
      wirke(w, "beziehungen_eu", 2);
      wirke(w, "gefluechtete", 3 * ev.staerke, ev.provinzen);
      return "Eine Vereinbarung mit der EU bringt Geld für die Grenzprovinzen.";
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "p_migrationsdruck", 6 * ev.staerke, ev.provinzen);
    vertrauenAendern(w, -1);
    return "Ohne Entscheidung wächst der Druck in den Grenzprovinzen.";
  },
};

const ANSCHLAG: Vorlage = {
  id: "anschlag",
  szene: "istanbul",
  frist: 5,
  abkuehlung: 360,
  chance: (w) => 0.012 * (nationalAverage(NET, w.net, "terrorgefahr") / 50),
  erzeuge: (_, rng) => {
    const p = ziehe(rng, (pl) => (PROZ_STADT.has(pl) ? 3 : 0.5), 1);
    return p.length ? { provinzen: p, staerke: 1 } : null;
  },
  titel: (_, ev) => `Anschlag in ${namen(ev.provinzen)}`,
  text: (w, ev) => [
    `Ein Anschlag erschüttert ${namen(ev.provinzen)}. Die Behörden sprechen von einer organisierten Tat; die Lage ist noch unklar.`,
    `${anrede(figur(w, "inneres"))} verlangt weitreichende Befugnisse. Das Land wartet auf Ihre Worte.`,
  ],
  warum: () => "Nach Anschlägen wächst der Ruf nach Härte. Mehr Befugnisse geben Sicherheit, kosten aber Freiheit und Vertrauen der Liberalen.",
  eroeffne: (w) => {
    wirke(w, "terrorgefahr", 4);
    vertrauenAendern(w, -1);
  },
  optionen: () => [
    opt("paket", "Sicherheitspaket mit mehr Befugnissen", "Kostet 4 Kapital; Rückhalt bei Konservativen, Kritik von Liberalen.", 4, (w) => {
      wirke(w, "terrorgefahr", -5);
      wirke(w, "pressefreiheit", -3);
      wirke(w, "rechtssicherheit", -2);
      wirke(w, "konservative", 3);
      wirke(w, "staedtische_saekulare", -2);
      return "Ein Sicherheitspaket wird beschlossen.";
    }),
    opt("besonnen", "Besonnenheit und Ermittlung", "Kostet 2 Kapital; würdevoll, aber angreifbar.", 2, (w) => {
      vertrauenAendern(w, 1.5);
      wirke(w, "terrorgefahr", -1);
      return "Der Präsident mahnt zur Besonnenheit; die Ermittlungen laufen.";
    }),
  ],
  standard: (w) => {
    vertrauenAendern(w, -2);
    return "Ohne klare Antwort wirkt die Regierung ratlos.";
  },
};


const WALDBRAND: Vorlage = {
  id: "waldbrand",
  szene: "anatolien",
  frist: 5,
  abkuehlung: 200,
  chance: (w) => (monatVon(w) >= 7 && monatVon(w) <= 9 ? 0.09 : 0),
  erzeuge: (w, rng) => {
    const p = ziehe(rng, (pl) => (["Ege", "Akdeniz"].includes(PROVINZEN[pl - 1]?.region ?? "") ? 1 : 0.05), 2);
    return p.length ? { provinzen: p, staerke: 0.4 + 0.6 * rng.next() } : null;
  },
  titel: () => "Waldbrände",
  text: (_, ev) => [
    `In ${namen(ev.provinzen)} brennen Wälder; Dörfer werden geräumt, der Rauch hängt über den Küstenorten mitten in der Urlaubssaison.`,
  ],
  warum: () => "Hitze, Trockenheit und fehlende Löschkapazität treffen die Küste besonders hart: Tourismus und Luftqualität leiden mit.",
  eroeffne: (w, ev) => {
    wirke(w, "tourismus", -5 * ev.staerke, ev.provinzen);
    wirke(w, "luftqualitaet", -4 * ev.staerke, ev.provinzen);
  },
  optionen: (_, ev) => [
    opt("loeschen", "Löschflugzeuge und Nothilfe", "Kostet 3 Kapital und 0,1 % des BIP.", 3, (w) => {
      kosten(w, 0.1);
      wirke(w, "tourismus", 3 * ev.staerke, ev.provinzen);
      vertrauenAendern(w, 1);
      return "Löschflugzeuge und Hilfskräfte sind im Einsatz; die Brände werden eingedämmt.";
    }),
    opt("entschaedigen", "Evakuieren und Betroffene entschädigen", "Kostet 3 Kapital und 0,2 % des BIP.", 3, (w) => {
      kosten(w, 0.2);
      vertrauenAendern(w, 2 * ev.staerke);
      return "Betroffene werden untergebracht und entschädigt.";
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "tourismus", -3 * ev.staerke, ev.provinzen);
    vertrauenAendern(w, -2 * ev.staerke);
    return "Die Brände breiten sich aus; die Hilfe kommt spät.";
  },
};

const STROM: Vorlage = {
  id: "stromausfaelle",
  szene: "istanbul",
  frist: 7,
  abkuehlung: 240,
  chance: (w) => (nationalAverage(NET, w.net, "stromversorgung") < 50 || akutIn(w, "p_stromausfaelle").length > 0 ? 0.08 : 0.004),
  erzeuge: (w, rng) => {
    const p = ziehe(rng, (pl) => (PROZ_STADT.has(pl) ? 2 : 0.6) * (100 - wertIn(w, "stromversorgung", [pl])), 3);
    return p.length ? { provinzen: p, staerke: 0.5 + 0.5 * rng.next() } : null;
  },
  titel: () => "Stromausfälle",
  text: (_, ev) => [`In ${namen(ev.provinzen)} fällt tagelang wiederholt der Strom aus. Betriebe stehen still, Krankenhäuser laufen mit Notaggregaten.`],
  warum: () => "Netze, Speicher und Importe entscheiden, ob Spitzenlasten abgefangen werden.",
  eroeffne: (w, ev) => {
    wirke(w, "stromversorgung", -6 * ev.staerke, ev.provinzen);
    wirke(w, "produktivitaet", -2 * ev.staerke, ev.provinzen);
  },
  optionen: (_, ev) => [
    opt("ration", "Industrie rationieren", "Kostet 2 Kapital; hält die Haushalte am Netz, die Betriebe verlieren.", 2, (w) => {
      wirke(w, "produktivitaet", -2, ev.provinzen);
      wirke(w, "stromversorgung", 3, ev.provinzen);
      return "Die Industrie wird zeitweise vom Netz genommen.";
    }),
    opt("import", "Notimporte", "Kostet 3 Kapital und 0,2 % des BIP.", 3, (w) => {
      kosten(w, 0.2);
      wirke(w, "stromversorgung", 5, ev.provinzen);
      wirke(w, "energieimporte", 2);
      return "Strom wird zugekauft.";
    }),
  ],
  standard: (w, ev) => {
    vertrauenAendern(w, -2 * ev.staerke);
    wirke(w, "produktivitaet", -2 * ev.staerke, ev.provinzen);
    return "Die Ausfälle halten an; die Wut auf die Regierung wächst.";
  },
};

const AERZTE: Vorlage = {
  id: "aerztestreik",
  szene: "parlament",
  frist: 10,
  abkuehlung: 300,
  chance: (w) => (akutIn(w, "p_aerztemangel").length > 0 ? 0.08 : 0.004),
  erzeuge: (w, rng) => {
    const akut = akutIn(w, "p_aerztemangel");
    const p = ziehe(rng, (pl) => (akut.includes(pl) ? 1 : 0.05), 3);
    return p.length ? { provinzen: p, staerke: 0.5 + 0.5 * rng.next() } : null;
  },
  titel: () => "Ärztinnen und Ärzte protestieren",
  text: (_, ev) => [`In ${namen(ev.provinzen)} legen Ärztinnen und Ärzte aus Protest gegen Bezahlung und Arbeitsbedingungen die Arbeit nieder. Viele denken laut über das Ausland nach.`],
  warum: () => "Ärztemangel entsteht, wenn Bezahlung und Bedingungen nicht mithalten. Er trifft zuerst die Provinzen abseits der Metropolen.",
  eroeffne: (w, ev) => {
    wirke(w, "wartezeiten", 5 * ev.staerke, ev.provinzen);
    wirke(w, "abwanderung", 3 * ev.staerke);
  },
  optionen: (_, ev) => [
    opt("gehalt", "Gehälter anheben", "Kostet 3 Kapital und 0,2 % des BIP.", 3, (w) => {
      kosten(w, 0.2);
      wirke(w, "aerzte", 4 * ev.staerke, ev.provinzen);
      wirke(w, "abwanderung", -2);
      return "Die Gehälter im Gesundheitswesen steigen.";
    }),
    opt("ausland", "Ärzte aus dem Ausland werben", "Kostet 3 Kapital; dauert, entlastet aber.", 3, (w) => {
      wirke(w, "aerzte", 2 * ev.staerke, ev.provinzen);
      return "Ein Programm wirbt Ärztinnen und Ärzte aus dem Ausland an.";
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "aerzte", -2 * ev.staerke, ev.provinzen);
    vertrauenAendern(w, -1);
    return "Die Proteste halten an; Ärzte verlassen das Land.";
  },
};

const PREISDECKEL: Vorlage = {
  id: "preisdeckel_knappheit",
  szene: "istanbul",
  frist: 10,
  abkuehlung: 300,
  chance: (w) => (nationalAverage(NET, w.net, "m_preiskontrollen") >= 60 ? 0.25 : 0),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => "Leere Regale",
  text: () => ["Unter dem Preisdeckel bieten Händler manche Grundnahrungsmittel kaum noch an. Auf grauen Märkten kosten sie das Doppelte."],
  warum: () => "Ein Preisdeckel unter dem Marktpreis lässt Ware verschwinden oder auf graue Märkte wandern: Der sichtbare Preis sinkt, die Wirklichkeit nicht.",
  eroeffne: (w) => {
    wirke(w, "schattenwirtschaft", 4);
    wirke(w, "lebenshaltung", 3);
  },
  optionen: () => [
    opt("lockern", "Preisdeckel lockern", "Kostet 2 Kapital; die Ware kehrt zurück, die Preise steigen.", 2, (w) => {
      setPolicy(w, "m_preiskontrollen", Math.max(0, nationalAverage(NET, w.net, "m_preiskontrollen") - 25));
      return "Der Preisdeckel wird gelockert.";
    }),
    opt("importieren", "Staatlich importieren", "Kostet 3 Kapital und 0,2 % des BIP.", 3, (w) => {
      kosten(w, 0.2);
      wirke(w, "lebensmittelpreise", -3);
      return "Der Staat importiert Grundnahrungsmittel.";
    }),
    opt("durchhalten", "Durchhalten und Händler bestrafen", "Kostet 2 Kapital; der Schwarzmarkt wächst.", 2, (w) => {
      wirke(w, "schattenwirtschaft", 6);
      wirke(w, "mittelstand", -3);
      return "Händler werden bestraft; die Ware bleibt knapp.";
    }),
  ],
  standard: (w) => {
    wirke(w, "schattenwirtschaft", 3);
    vertrauenAendern(w, -1.5);
    return "Die Regale bleiben leer; der Unmut wächst.";
  },
};

const MIETDECKEL: Vorlage = {
  id: "mietdeckel_folgen",
  szene: "istanbul",
  frist: 10,
  abkuehlung: 300,
  chance: (w) => (nationalAverage(NET, w.net, "m_mietdeckel") >= 60 ? 0.2 : 0),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => "Der Neubau bricht ein",
  text: () => ["Seit der Mietpreisbremse werden kaum noch Mietwohnungen gebaut; Investoren wandern in andere Anlagen ab. Die Bauwirtschaft klagt."],
  warum: () => "Gedeckelte Mieten entlasten die, die schon eine Wohnung haben, und bremsen das Angebot für alle, die noch suchen.",
  eroeffne: (w) => {
    wirke(w, "wohnungsbau", -4);
    wirke(w, "bauwirtschaft", -3);
  },
  optionen: () => [
    opt("ausnahme", "Ausnahmen für den Neubau", "Kostet 3 Kapital; der Bau erholt sich, Mieter murren.", 3, (w) => {
      wirke(w, "wohnungsbau", 4);
      wirke(w, "junge", -1);
      return "Neubauten werden vom Deckel ausgenommen.";
    }),
    opt("foerdern", "Bauförderung verdoppeln", "Kostet 4 Kapital und 0,3 % des BIP.", 4, (w) => {
      kosten(w, 0.3);
      wirke(w, "wohnungsbau", 6);
      wirke(w, "bauwirtschaft", 3);
      return "Die Bauförderung wird verdoppelt.";
    }),
    opt("beibehalten", "Deckel beibehalten", "Kostet nichts; die Mieter bleiben geschützt, der Bau leidet.", 0, (w) => {
      wirke(w, "wohnungsbau", -3);
      return "Der Deckel bleibt.";
    }),
  ],
  standard: (w) => {
    wirke(w, "wohnungsbau", -3);
    return "Der Neubau bleibt schwach.";
  },
};

export { zusageVorhaben };

/** Fällige Zusagen (aus dem Wahlkampf, Absprachen mit Fraktionen, Bündnispartner, Länder). Die Regeln stehen in sim/zusagen.ts. */
const ZUSAGE: Vorlage = {
  id: "zusage",
  szene: "parlament",
  frist: 20,
  abkuehlung: 0,
  chance: () => 0,
  erzeuge: () => null,
  titel: (w, ev) => `Zusage fällig: ${w.spiel?.zusagen.find((z) => z.id === String(ev.daten?.zusage))?.von ?? ""}`,
  text: (w, ev) => {
    const z = w.spiel?.zusagen.find((x) => x.id === String(ev.daten?.zusage));
    const f = z ? w.spiel?.figuren.find((x) => x.partei === z.von) : undefined;
    const bezug = z ? zusageBezug(w, z) : undefined;
    if (!z) return ["Eine Zusage ist fällig."];
    if (f) return [`${f.rolle} ${f.name} erinnert Sie an Ihr Versprechen: ${z.text}.`];
    if (bezug?.art === "land") return [`${bezug.name} erinnert Sie an Ihr Versprechen: ${z.text}. Das Vertrauen dort hängt davon ab, ob Ankara Wort hält.`];
    return [`Ihnen wird die Rechnung präsentiert: ${z.text}.`];
  },
  warum: () => "Wer Zusagen bricht, verliert Verbündete und Glaubwürdigkeit; wer sie hält, zahlt mit Kapital oder Politik. Beides bleibt im Gedächtnis: Legitimität und Vertrauen im Land hängen davon ab.",
  optionen: (w, ev) => {
    const z = w.spiel?.zusagen.find((x) => x.id === String(ev.daten?.zusage));
    return [
      (() => {
        const v = zusageVorhaben(w, z);
        const beschreibung = v
          ? v.pr.ok
            ? `Bringt „${v.name}“ als Gesetz ein: ${v.zielName ? `von „${v.jetztName}“ zu „${v.zielName}“` : `Stufe ${Math.round(v.jetzt)} auf ${v.ziel}`}. Kostet ${v.pr.gesetz.pk} Kapital; ${v.pr.gesetz.stimmen.luecke === 0 ? "die Mehrheit steht" : `es fehlen etwa ${v.pr.gesetz.stimmen.luecke} Stimmen`}.`
            : `„${v.name}“ steht schon auf dieser Stufe; die Zusage gilt damit als erfüllt.`
          : "Kostet 4 Kapital; die Partei ist zufrieden.";
        const o = opt("erfuellen", v ? "Das Gesetz einbringen" : "Zusage erfüllen", beschreibung, v ? 0 : 4, (ww) => {
          if (!z) return "Die Zusage besteht nicht mehr.";
          return loeseZusageEin(ww, z).text;
        });
        if (v?.pr.ok) o.anzeigePk = v.pr.gesetz.pk;
        return o;
      })(),
      ...((z?.vertroestet ?? 0) < 2
        ? [
            opt("vertroesten", "Vertrösten", `Kostet 1 Kapital; die Partei wartet drei Monate.${(z?.vertroestet ?? 0) === 1 ? " Das ist die letzte Vertröstung." : " Sie können sie noch zweimal vertrösten."}`, 1, (ww) => (z ? vertroesteZusage(ww, z) : "Die Zusage besteht nicht mehr.")),
          ]
        : []),
      opt("brechen", "Zusage brechen", "Kostet nichts, aber Verbündete und Glaubwürdigkeit.", 0, (ww) => (z ? brecheZusage(ww, z) : "Die Zusage besteht nicht mehr.")),
    ];
  },
  standard: (w, ev) => {
    const z = w.spiel?.zusagen.find((x) => x.id === String(ev.daten?.zusage));
    return z ? brecheZusage(w, z, true) : "Die Zusage verfällt unbeantwortet; das wird als Bruch gewertet.";
  },
};

/** Angebote anderer Fraktionen, wenn dem Lager die Mehrheit fehlt. */

const KOALITION: Vorlage = {
  id: "koalitionsangebot",
  szene: "parlament",
  frist: 30,
  abkuehlung: 240,
  chance: (w) => (w.spiel && w.parliament && w.player && w.spiel.figuren.length && lueckeJetzt(w) > 0 ? 0.1 : 0),
  erzeuge: (w, rng) => {
    const parl = w.parliament;
    if (!parl || !w.player) return null;
    const kandidaten = Object.entries(parl.seats)
      .filter(([k, s]) => s >= 15 && k !== w.player!.partei.kurz && !(w.spiel?.lager ?? []).includes(k) && FORDERUNG[k])
      .map(([k]) => k);
    if (!kandidaten.length) return null;
    const partei = kandidaten[Math.floor(rng.next() * kandidaten.length)]!;
    return { provinzen: [], staerke: 1, daten: { partei, sitze: parl.seats[partei] ?? 0 } };
  },
  titel: (_, ev) => `${ev.daten?.partei} bietet Unterstützung an`,
  text: (w, ev) => {
    const f = forderungVon(w, String(ev.daten?.partei));
    return [
      `Die ${ev.daten?.partei} (${ev.daten?.sitze} Sitze) signalisiert, Ihr Lager im Parlament zu stützen, wenn Sie ihr entgegenkommen.`,
      `Ihr Preis: ${f?.text ?? "ein Entgegenkommen"}. Ohne Mehrheit bleiben Gesetze mühsam und teuer.`,
    ];
  },
  warum: () => "Ohne eigene Mehrheit braucht ein Präsident Partner. Jeder Partner hat eigene Wähler und einen Preis.",
  optionen: (_, ev) => [
    opt("zustimmen", "Auf das Angebot eingehen", "Kostet 4 Kapital; das Lager wächst, die Partei erwartet Gegenleistung.", 4, (w, _e, rng) => {
      const partei = String(ev.daten?.partei);
      const f = forderungVon(w, partei);
      w.spiel!.lager.push(partei);
      w.spiel!.zusagen.push({
        id: `z-koalition-${partei}-${w.day}`,
        von: partei,
        text: `Die ${partei} erwartet ${f.text}`,
        faellig: w.day + 150,
        massnahme: f.massnahme,
        richtung: 1,
        erfuellt: false,
        gebrochen: false,
      });
      w.spiel!.figuren.push(partnerFigur(w, partei, `Vorsitz der ${partei}`, f.text, rng));
      return `Die ${partei} stützt fortan das Lager (+${ev.daten?.sitze} Sitze).`;
    }),
    opt("ablehnen", "Ablehnen", "Kostet nichts; die Mehrheit bleibt schwer.", 0, () => "Das Angebot wird abgelehnt."),
  ],
  standard: () => "Das Angebot verfällt.",
};

function lueckeJetzt(w: World): number {
  const parl = w.parliament;
  const player = w.player;
  if (!parl || !player) return 0;
  const lager = [player.partei.kurz, ...(w.spiel?.lager ?? [])].reduce((s, p) => s + (parl.seats[p] ?? 0), 0);
  return Math.max(0, 301 - lager);
}

// Erster Spieltag (Entscheidungen E): drei drängende Vorgänge, am Abend eine erste echte Entscheidung

const START_HAUSHALT: Vorlage = {
  id: "start_haushalt",
  szene: "bank",
  frist: 30,
  abkuehlung: 0,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => "Der erste Haushaltsentwurf",
  text: (w) => [
    `${anrede(figur(w, "finanzen"))} legt den Entwurf vor: Die Inflation liegt bei ${nf(w.published.inflation.value)} %, die Schulden bei ${nf(w.economy.debtRatio)} % des BIP. Die Märkte beobachten, ob der neue Präsident Disziplin hält.`,
    "Der Entwurf lässt Spielraum in beide Richtungen.",
  ],
  warum: () => "Mehr Ausgaben stützen kurz die Nachfrage und treiben Inflation und Schulden; Sparen beruhigt die Märkte und kostet Zustimmung.",
  optionen: () => [
    opt("sparen", "Sparkurs", "Kostet 3 Kapital; beruhigt die Märkte, der Finanzminister ist zufrieden.", 3, (w) => {
      setFiscalImpulse(w, w.economy.fiscalImpulse - 1);
      wirke(w, "vertrauen_maerkte", 4);
      vertrauenAendern(w, -1);
      const f = figur(w, "finanzen");
      if (f) f.loyalitaet = Math.min(100, f.loyalitaet + 8);
      return "Der Haushalt setzt auf Disziplin.";
    }),
    opt("mitte", "Ausgeglichen", "Kostet nichts; kein Signal in irgendeine Richtung.", 0, () => "Der Haushalt bleibt, wie er ist."),
    opt("wachstum", "Wachstumshaushalt", "Kostet 3 Kapital; mehr Investitionen und mehr Schulden.", 3, (w) => {
      setFiscalImpulse(w, w.economy.fiscalImpulse + 1.5);
      vertrauenAendern(w, 1);
      const f = figur(w, "finanzen");
      if (f) f.loyalitaet = Math.max(0, f.loyalitaet - 8);
      return "Der Haushalt setzt auf Wachstum und Investitionen.";
    }),
  ],
  standard: () => "Der Haushalt bleibt, wie er ist.",
};

const START_PARTNER: Vorlage = {
  id: "start_partner",
  szene: "parlament",
  frist: 30,
  abkuehlung: 0,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: (w) => (w.player?.buendnis ? `${w.player.buendnis} meldet sich` : "Die Opposition fordert Klarheit"),
  text: (w) =>
    w.player?.buendnis
      ? [`Der Vorsitz der ${w.player.buendnis} erinnert an den Wahlkampf: ${(w.player.versprechen[0] ?? "Es gibt Zusagen").replace(/\.$/, "")}. Sie erwartet Ihre Antwort noch in der ersten Woche.`]
      : ["Die Opposition fordert vom neuen Präsidenten, seine Wahlversprechen in den ersten hundert Tagen einzulösen, und kündigt eine genaue Zählung an."],
  warum: () => "Zusagen sind Kapital: Wer sie hält, wird ernst genommen; wer sie bricht, bezahlt später.",
  optionen: (w) =>
    w.player?.buendnis
      ? [
          opt("grosszuegig", "Großzügig sein", "Kostet 4 Kapital; das Lager hält.", 4, (ww) => {
            const f = ww.spiel?.figuren.find((x) => x.amt === "partner");
            if (f) f.loyalitaet = Math.min(100, f.loyalitaet + 12);
            return `Die ${ww.player?.buendnis} erhält Zusagen und bleibt im Lager.`;
          }),
          opt("knapp", "Knapp anbieten", "Kostet 1 Kapital; die Partei murrt.", 1, (ww) => {
            const f = ww.spiel?.figuren.find((x) => x.amt === "partner");
            if (f) f.loyalitaet = Math.min(100, f.loyalitaet + 3);
            return "Das Angebot fällt knapp aus.";
          }),
          opt("vertagen", "Vertagen", "Kostet nichts; die Geduld sinkt.", 0, (ww) => {
            const f = ww.spiel?.figuren.find((x) => x.amt === "partner");
            if (f) f.loyalitaet = Math.max(0, f.loyalitaet - 10);
            return "Die Antwort wird vertagt.";
          }),
        ]
      : [
          opt("liste", "Eine Liste der Versprechen veröffentlichen", "Kostet 2 Kapital; schafft Transparenz und Druck.", 2, (ww) => {
            vertrauenAendern(ww, 1);
            return "Der Präsident veröffentlicht seine Zusagen und stellt sich der Zählung.";
          }),
          opt("abwarten", "Abwarten", "Kostet nichts.", 0, () => "Der Präsident lässt die Forderung unbeantwortet."),
        ],
  standard: () => "Die Forderung bleibt unbeantwortet.",
};

const ERDBEBEN_REGION = [31, 46, 2, 44, 27, 80, 1, 21, 63, 79, 23];

const START_WIEDERAUFBAU: Vorlage = {
  id: "start_wiederaufbau",
  szene: "anatolien",
  frist: 30,
  abkuehlung: 0,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => "Der Wiederaufbau im Erdbebengebiet",
  text: (w) => [
    "In den Provinzen, die 2023 vom Erdbeben getroffen wurden, ist der Wiederaufbau nicht abgeschlossen. Viele Familien leben noch in Containern.",
    `${anrede(figur(w, "stab"))} legt den Bericht vor: Ein schneller Bau spart Zeit, ein sauberer Bau spart Leben, wenn es wieder bebt.`,
  ],
  warum: () => "Wiederaufbau konkurriert mit allem anderen um Haushalt, Personal und Material; Eile und Korruption erhöhen die Verwundbarkeit.",
  optionen: () => [
    opt("chefsache", "Zur Chefsache machen", "Kostet 6 Kapital und 0,4 % des BIP; schneller Wiederaufbau.", 6, (w) => {
      kosten(w, 0.4);
      wirke(w, "wohnungsbau", 6, ERDBEBEN_REGION);
      wirke(w, "p_wohnungsnot", -5, ERDBEBEN_REGION);
      wirke(w, "korruption", 1.5);
      vertrauenAendern(w, 1.5);
      return "Der Wiederaufbau wird Chefsache; die Aufträge laufen schnell.";
    }),
    opt("sauber", "Sauber und kontrolliert bauen", "Kostet 4 Kapital und 0,2 % des BIP; langsamer, sicherer.", 4, (w) => {
      kosten(w, 0.2);
      wirke(w, "wohnungsbau", 3, ERDBEBEN_REGION);
      wirke(w, "erdbebenvorsorge", 3, ERDBEBEN_REGION);
      wirke(w, "bauqualitaet", 3, ERDBEBEN_REGION);
      return "Der Wiederaufbau folgt strengen Prüfungen: langsamer, aber sicherer.";
    }),
    opt("weiter", "Beim Bestehenden bleiben", "Kostet nichts; die Region wartet weiter.", 0, (w) => {
      vertrauenAendern(w, -0.5);
      return "Der Wiederaufbau läuft im bisherigen Tempo weiter.";
    }),
  ],
  standard: () => "Der Wiederaufbau läuft im bisherigen Tempo weiter.",
};

export const VORLAGEN: Vorlage[] = [
  ERDBEBEN, DUERRE, WAEHRUNG, ENERGIE, HAUSHALT, KORRUPTION, STREIK, MIETE, FLUECHTLINGE, ANSCHLAG, WALDBRAND, STROM, AERZTE, PREISDECKEL, MIETDECKEL, KOALITION,
  ZUSAGE, START_HAUSHALT, START_PARTNER, START_WIEDERAUFBAU,
  ...INNEN_VORLAGEN, ...AUSSEN_VORLAGEN, ...INITIATIVE_VORLAGEN, ...REICH_VORLAGEN, ...PERSONEN_VORLAGEN, ...VERFASSUNG_VORLAGEN, ...KRIEG_VORLAGEN,
];

/** Womit man die Ursache eines Ereignisses selbst regeln kann (statt nur zu reagieren). */
const EREIGNIS_MASSNAHMEN: Record<string, string[]> = {
  erdbeben: ["m_bauaufsicht", "m_stadterneuerung"],
  duerre: ["m_bewaesserung", "m_wasserleitungen", "m_agrarsubventionen"],
  energiepreisschock: ["m_energiesubventionen", "m_solar_wind", "m_speicher_smartgrid"],
  korruptionsaffaere: ["m_antikorruption", "m_justizreform"],
  streikwelle: ["m_mindestlohn", "m_gewerkschaftsrechte"],
  mietproteste: ["m_mietdeckel", "m_sozialwohnungen", "m_baukredite"],
  fluechtlingswelle: ["m_integration", "m_grenzschutz", "m_rueckkehr"],
  anschlag: ["m_polizei", "m_polizeitechnik"],
  waldbrand: ["m_umweltauflagen"],
  stromausfaelle: ["m_netzausbau", "m_speicher_smartgrid"],
  aerztestreik: ["m_aerztegehalt", "m_krankenhausbau"],
  preisdeckel_knappheit: ["m_preiskontrollen"],
  mietdeckel_folgen: ["m_mietdeckel", "m_baukredite"],
  mindestlohn: ["m_mindestlohn"],
  bergwerksunglueck: ["m_gewerkschaftsrechte", "m_antikorruption"],
  ueberschwemmung: ["m_staudaemme", "m_regionalfoerderung", "m_autobahnen"],
  bankenstress: ["m_bankenaufsicht", "m_kreditgarantien"],
  studentenproteste: ["m_stipendien", "m_wissenschaftsfreiheit", "m_unigruendungen"],
  pressekonflikt: ["m_medienaufsicht", "m_internetsperren"],
  bauamnestie_forderung: ["m_bauamnestie", "m_bauaufsicht"],
  rentnerprotest: ["m_renten"],
  grippewelle: ["m_krankenhausbau", "m_hausarzt", "m_aerztegehalt"],
  bauernproteste: ["m_agrarsubventionen", "m_bewaesserung", "m_saatgut"],
  fabrikschliessungen: ["m_industrie_modernisierung", "m_kreditgarantien", "m_ausbildung"],
  buergermeister_verfahren: ["m_justizreform"],
  tourismusrekord: ["m_tourismuswerbung"],
  grenzzwischenfall: ["m_grenzschutz", "m_verteidigung"],
  eu_angebot: ["m_eu_annaeherung", "m_justizreform"],
  gasvertrag: ["m_gasfoerderung", "m_solar_wind"],
  gasfund: ["m_gasfoerderung"],
  cyberangriff: ["m_smart_infrastruktur"],
  weltwirtschaftskrise: ["m_kmu", "m_kreditgarantien", "m_investitionsanreize"],
  pandemie: ["m_krankenhausbau", "m_hausarzt", "m_medizintechnik"],
  erbe_raubgrabung: ["m_archaeologie", "m_polizei"],
  erbe_erdbebenschaden: ["m_bauaufsicht", "m_denkmalschutz"],
  recht_ernennung: ["m_justizreform", "m_richterrat"],
  recht_haftrevolte: ["m_haftvermeidung", "m_richterstellen"],
  mil_lieferverzug: ["m_verteidigung", "m_ruestungsindustrie"],
  infra_bauunfall: ["m_bauaufsicht", "m_instandhaltung"],
};
for (const v of VORLAGEN) if (EREIGNIS_MASSNAHMEN[v.id]) v.massnahmen = EREIGNIS_MASSNAHMEN[v.id]!;

// ---------------------------------------------------------------------------
// ZEI-1: Ereignis-Wettbewerb (VERBESSERUNGSPLAN_2026-09-30, Vorbild D4)
// Pro Monat konkurrieren die ausgelösten Kandidaten um wenige Präsentations-Slots; die Dringlichkeit
// entscheidet. Der Rest wird „ausgesessen“ (Standardfolge tritt ein) oder „eskaliert still“ (gärt weiter
// und kommt dringlicher zurück) — beides mit Haken in der Chronik, damit es nachvollziehbar bleibt.

/** Slots und Eskalations-Schub je Schwierigkeit: entspannt 3, normal 2, hart 2 — aber hart mit höherer Eskalationschance. */
export const EREIGNIS_WETTBEWERB = {
  /** Präsentations-Slots je Monat (feste Termine des Staatsjahres zählen nicht dagegen) */
  slots: { entspannt: 3, normal: 2, hart: 2 },
  /** Wie stark gärende Vorgänge zurückkommen (Chance und Stärke je Eskalationsstufe) */
  eskalationsSchub: { entspannt: 0.8, normal: 1, hart: 1.5 },
  /** Höchste Eskalationsstufe eines gärenden Vorgangs */
  maxStufe: 3,
  /** Multiplikativer Schub auf die Monatschance je Eskalationsstufe */
  chanceSchub: 1.2,
  /** Stärke-Zuschlag je Eskalationsstufe, wenn der Vorgang schließlich auf den Tisch kommt */
  staerkeSchub: 0.15,
} as const;

/**
 * Akute Einzelfälle (das Beben, der Anschlag, der Markteinbruch sind geschehen, ob man hinsieht oder nicht)
 * und verfallende Angebote oder Fristen: Sie werden „ausgesessen“ — die Standardfolge tritt im Hintergrund ein.
 * Alle übrigen Vorlagen sind schwelende Konflikte und eskalieren still.
 */
const AUSGESSESSEN = new Set([
  "erdbeben", "anschlag", "waldbrand", "ueberschwemmung", "bergwerksunglueck", "grippewelle",
  "cyberangriff", "erbe_erdbebenschaden", "erbe_raubgrabung", "infra_bauunfall",
  "waehrungsrutsch", "energiepreisschock", "haushaltsdruck", "ratingagentur", "bankenstress",
  "weltwirtschaftskrise", "pandemie", "grenzzwischenfall",
  "eu_angebot", "iwf_angebot", "nato_ratifizierung", "gasfund", "land_angebot", "tourismusrekord",
  "erbe_fund", "kanal_istanbul", "vertrag_verlaengerung", "gasvertrag", "mil_militaerrat", "recht_ernennung",
]);

/** Schwere der Standardfolge für die Dringlichkeit (1 = normal): Je schlimmer das Ausgesessen-Werden, desto weiter vorn der Vorgang. */
const SCHWERE: Record<string, number> = {
  erdbeben: 3, anschlag: 3, pandemie: 3, weltwirtschaftskrise: 3,
  bankenstress: 2.5, waehrungsrutsch: 2.5, ueberschwemmung: 2.5, bergwerksunglueck: 2.5,
  energiepreisschock: 2.2, haushaltsdruck: 2.2,
  ratingagentur: 2, cyberangriff: 2, grenzzwischenfall: 2, streikwelle: 2, korruptionsaffaere: 2,
  duerre: 2, fluechtlingswelle: 2, waldbrand: 2,
  land_fordert: 1.8, land_drohkulisse: 2.2, recht_haftrevolte: 1.8,
  grippewelle: 1.6, stromausfaelle: 1.6,
  aerztestreik: 1.5, mietproteste: 1.5, fabrikschliessungen: 1.5, bauernproteste: 1.5,
  person_ruecktritt: 1.5, infra_bauunfall: 1.5, preisdeckel_knappheit: 1.5,
  buergermeister_verfahren: 1.4, studentenproteste: 1.4, pressekonflikt: 1.4, rentnerprotest: 1.4,
  erbe_erdbebenschaden: 1.4, vertrag_verlaengerung: 1.4, gasvertrag: 1.4, land_provokation: 1.4,
  person_intrige: 1.4, mietdeckel_folgen: 1.4,
  mil_lieferverzug: 1.3, person_skandal: 1.3, person_leck: 1.2,
};
for (const v of VORLAGEN) {
  if (AUSGESSESSEN.has(v.id)) v.wettbewerb = "aussitzen";
  if (SCHWERE[v.id] !== undefined) v.schwere = SCHWERE[v.id];
}

/**
 * Dringlichkeit im Monatswettbewerb: Schwere der Standardfolge, Stärke des Falls, Fristnähe,
 * Neuheit des Themas (was lange nicht drankam, wird wieder interessant) und Eskalationsstufe.
 */
function dringlichkeit(world: World, v: Vorlage, staerke: number): number {
  const spiel = world.spiel!;
  const fristNaehe = 12 / Math.max(4, v.frist);
  const neuheit = 1 + Math.min(1.5, (world.day - (spiel.zuletzt[v.id] ?? 0)) / 365);
  const stufe = spiel.eskalation?.[v.id] ?? 0;
  return (v.schwere ?? 1) * (0.6 + 0.4 * staerke) * fristNaehe * neuheit * (1 + 0.7 * stufe);
}

const VORLAGE_NACH_ID = new Map(VORLAGEN.map((v) => [v.id, v]));

/**
 * Die Antworten eines Ereignisses. Gibt es keine kostenlose, kommt immer „Abwarten“ dazu: Wer kein Kapital hat, soll nicht vor lauter grauen
 * Knöpfen stehen, sondern die Standardfolge bewusst in Kauf nehmen können.
 */
export function antworten(w: World, ev: OffenesEreignis): Option[] {
  const v = vorlage(ev.vorlage);
  const optionen = v.optionen(w, ev);
  if (optionen.some((o) => (o.anzeigePk ?? o.pk) === 0)) return optionen;
  return [
    ...optionen,
    {
      id: "aussitzen",
      label: "Abwarten und nichts tun",
      beschreibung: "Kostet nichts; es geschieht die Standardfolge, die das Ereignis für den Fall vorsieht, dass niemand handelt.",
      pk: 0,
      wirkung: (ww, e, rng) => v.standard(ww, e, rng),
    },
  ];
}

export function vorlage(id: string): Vorlage {
  const v = VORLAGE_NACH_ID.get(id);
  if (!v) throw new Error(`Unbekannte Ereignisvorlage: ${id}`);
  return v;
}

// ---------------------------------------------------------------------------
// Motor

export const MAX_OFFEN = 3;

/** Vorlagen, deren Öffnen den Präsidenten sofort belastet (Eskalation im eigenen Land oder an den Grenzen). */
const ESKALATION_VORLAGEN = new Set(["anschlag", "cyberangriff", "waehrungsrutsch", "weltwirtschaftskrise", "bankenstress", "pandemie", "land_provokation", "land_drohkulisse", "grenzzwischenfall"]);

/** Was eine Vorlage bei Auslösung erzeugt (Ort, Stärke, Daten); Felder dürfen fehlen. */
type Erzeugung = { provinzen?: number[]; staerke?: number; daten?: Record<string, number | string> };

/** Baut das offene Ereignis aus Vorlage und Erzeugung — gleichermaßen für präsentierte und für ausgesessene Vorgänge. */
function baueEreignis(world: World, v: Vorlage, gen: Erzeugung): OffenesEreignis {
  const spiel = world.spiel!;
  const ev: OffenesEreignis = {
    id: `${v.id}-${world.day}-${spiel.ereignisse.length}`,
    vorlage: v.id,
    tag: world.day,
    frist: world.day + v.frist,
    provinzen: gen.provinzen ?? [],
    staerke: (gen.staerke ?? 1) * schutzFuer(world, v.id) * (v.id.startsWith("start_") || v.id === "zusage" ? 1 : schwierig(world).haerte),
  };
  if (gen.daten) ev.daten = gen.daten;
  return ev;
}

export function oeffne(world: World, vorlageId: string, rng: Rng, params?: { provinzen?: number[]; staerke?: number; daten?: Record<string, number | string> }): OffenesEreignis | null {
  const spiel = world.spiel;
  if (!spiel) return null;
  const v = vorlage(vorlageId);
  const gen = params ?? v.erzeuge(world, rng);
  if (!gen) return null;
  const ev = baueEreignis(world, v, gen);
  spiel.ereignisse.push(ev);
  spiel.zuletzt[vorlageId] = world.day;
  v.eroeffne?.(world, ev, rng);
  addLog(world, "ereignis", v.titel(world, ev), v.text(world, ev)[0]);
  if (ESKALATION_VORLAGEN.has(vorlageId)) belastungEreignis(world, VERFASSUNG.eskalation, `Eskalation: ${v.titel(world, ev)}`);
  return ev;
}

/**
 * Einmal im Monat: Vorlagen würfeln. Der Zufall wird für jede Vorlage gezogen, damit der Verlauf stabil bleibt.
 * ZEI-1: Ausgelöste Kandidaten konkurrieren um die Präsentations-Slots des Monats (EREIGNIS_WETTBEWERB.slots),
 * sortiert nach Dringlichkeit. Alle bisherigen Bedingungen (Chance, Abkühlung, Dichte-Dämpfung, MAX_OFFEN,
 * feste Termine) gelten weiter — der Wettbewerb ersetzt keine davon, er verteilt nur die Slots.
 */
export function ereignisMonat(world: World, rng: Rng): void {
  const spiel = world.spiel;
  if (!spiel || spiel.ende) return;
  const grad = spiel.schwierigkeit ?? "normal";
  const schub = EREIGNIS_WETTBEWERB.eskalationsSchub[grad];
  const eskalation = spiel.eskalation ?? (spiel.eskalation = {});
  const offenNormal = () => spiel.ereignisse.filter((e) => !e.vorlage.startsWith("start_")).length;

  // 1. Kandidaten sammeln: Chance, Abkühlung, Dichte und Obergrenze wie bisher; gärende Vorgänge kommen eher wieder
  const kandidaten: { v: Vorlage; gen: Erzeugung }[] = [];
  for (const v of VORLAGEN) {
    const u = rng.next();
    const basis = v.chance(world);
    if (basis <= 0) continue;
    if (offenNormal() >= MAX_OFFEN) continue;
    if (spiel.ereignisse.some((e) => e.vorlage === v.id)) continue;
    if (world.day - (spiel.zuletzt[v.id] ?? -1e9) < v.abkuehlung) continue;
    const stufe = eskalation[v.id] ?? 0;
    const eskFaktor = stufe > 0 ? 1 + EREIGNIS_WETTBEWERB.chanceSchub * stufe * schub : 1;
    if (u >= basis * EREIGNIS_RATE * schwierig(world).ereignisse * alterFaktor(world, v.id) * dichteFaktor(world, v.id) * eskFaktor) continue;
    const gen = v.erzeuge(world, rng);
    if (!gen) continue;
    kandidaten.push({ v, gen });
  }
  if (!kandidaten.length) return;

  // AUS-1 (Eigeninitiative): Pro Monat klopft höchstens eine Länder-Initiative an — die mit dem schwersten
  // Treiber (daten.gewicht). Die übrigen warten still: Ihre Treiber stehen ja weiter, sie kommen später
  // wieder, statt die Chronik mit Haken zu füllen.
  const initiativeK = kandidaten.filter((k) => INITIATIVE_VORLAGE_IDS.has(k.v.id));
  if (initiativeK.length > 1) {
    initiativeK.sort((a, b) => Number(b.gen.daten?.gewicht ?? 0) - Number(a.gen.daten?.gewicht ?? 0) || VORLAGEN.indexOf(a.v) - VORLAGEN.indexOf(b.v));
    const beste = initiativeK[0]!;
    for (let i = kandidaten.length - 1; i >= 0; i--) if (INITIATIVE_VORLAGE_IDS.has(kandidaten[i]!.v.id) && kandidaten[i] !== beste) kandidaten.splice(i, 1);
  }
  if (!kandidaten.length) return;

  // 2. Der Wettbewerb: feste Termine des Staatsjahres kommen immer; der Rest sortiert nach Dringlichkeit um die Slots
  const feste = kandidaten.filter((k) => TERMINE.has(k.v.id));
  const rest = kandidaten.filter((k) => !TERMINE.has(k.v.id));
  rest.sort((a, b) => dringlichkeit(world, b.v, b.gen.staerke ?? 1) - dringlichkeit(world, a.v, a.gen.staerke ?? 1) || VORLAGEN.indexOf(a.v) - VORLAGEN.indexOf(b.v));
  const slots = EREIGNIS_WETTBEWERB.slots[grad];
  const gewinner = [...feste, ...rest.slice(0, slots)];
  const verlierer = rest.slice(slots);

  // AUS-1 (Eigeninitiative): höchstens eine Länder-Initiative pro Monat gesamt — die dringlichste gewinnt,
  // weitere rutschen in die Verliererbehandlung (sie gären weiter oder verfallen wie gehabt)
  let initiativeSchon = false;
  for (let i = gewinner.length - 1; i >= 0; i--) {
    if (!INITIATIVE_VORLAGE_IDS.has(gewinner[i]!.v.id)) continue;
    if (initiativeSchon) verlierer.push(gewinner.splice(i, 1)[0]!);
    else initiativeSchon = true;
  }

  for (const k of gewinner) {
    // Die Obergrenze offener Vorgänge gilt auch für Sieger; wer nicht mehr passt, rutscht in die Verliererbehandlung
    if (offenNormal() >= MAX_OFFEN) {
      verlierer.push(k);
      continue;
    }
    // Ein gärender Vorgang, der es schließlich auf den Tisch schafft, kommt härter zurück (Schwellenwert ist gestiegen)
    const stufe = eskalation[k.v.id] ?? 0;
    delete eskalation[k.v.id];
    const staerke = stufe > 0 ? (k.gen.staerke ?? 1) * (1 + EREIGNIS_WETTBEWERB.staerkeSchub * stufe * schub) : k.gen.staerke;
    oeffne(world, k.v.id, rng, { provinzen: k.gen.provinzen ?? [], staerke: staerke ?? 1, ...(k.gen.daten ? { daten: k.gen.daten } : {}) });
  }

  // 3. Nicht präsentiert: je nach Ereignis-Typ ausgesessen (Standardfolge tritt ein) oder still eskaliert (gärt weiter).
  // Länder-Initiativen (AUS-1) fallen aus dieser Behandlung heraus: Sie warten still auf den nächsten Monat —
  // ihr Treiber ist keine schwelende Lage, die gärt, sondern ein Interesse, das wieder anklopft.
  for (const k of verlierer) {
    if (INITIATIVE_VORLAGE_IDS.has(k.v.id)) continue;
    const ev = baueEreignis(world, k.v, k.gen);
    const titel = k.v.titel(world, ev);
    if (k.v.wettbewerb === "aussitzen") {
      // Der Vorgang läuft ohne Entscheidung schlecht aus: Es greift die Standardfolge, sonst nichts
      const ausgang = k.v.standard(world, ev, rng);
      spiel.zuletzt[k.v.id] = world.day;
      delete eskalation[k.v.id];
      spiel.chronik.push({ tag: world.day, datum: world.date, titel, ausgang: `Ausgesessen — der Vorgang kam nicht auf den Tisch: ${ausgang}` });
      addLog(world, "ereignis", `Ausgesessen: ${titel}`, ausgang);
    } else {
      const stufe = Math.min(EREIGNIS_WETTBEWERB.maxStufe, (eskalation[k.v.id] ?? 0) + 1);
      eskalation[k.v.id] = stufe;
      spiel.chronik.push({ tag: world.day, datum: world.date, titel, ausgang: `Im Hintergrund gärt es weiter; der Vorgang kommt dringlicher zurück (Eskalation ${stufe} von ${EREIGNIS_WETTBEWERB.maxStufe}).` });
      addLog(world, "ereignis", `Im Hintergrund: ${titel} gärt weiter.`, "Der Vorgang war für diesen Monat nicht dringlich genug; die Lage verschärft sich.");
    }
  }
}

/** Täglich: fällige Zusagen einfordern, Fristen abwarten. */
export function ereignisTag(world: World, rng: Rng): void {
  const spiel = world.spiel;
  if (!spiel) return;
  // Alte Spielstände: Zusagen an „Fraktionen“ (Stimmenkauf) gibt es nicht mehr; ihre Ereignisse verschwinden mit ihnen
  if (spiel.zusagen.some((z) => z.von === "Fraktionen")) {
    spiel.zusagen = spiel.zusagen.filter((z) => z.von !== "Fraktionen");
  }
  spiel.ereignisse = spiel.ereignisse.filter((e) => e.vorlage !== "zusage" || spiel.zusagen.some((z) => z.id === String(e.daten?.zusage)));
  for (const z of spiel.zusagen) {
    if (z.erfuellt || z.gebrochen || z.faellig > world.day) continue;
    if (spiel.ereignisse.some((e) => e.vorlage === "zusage" && e.daten?.zusage === z.id)) continue;
    oeffne(world, "zusage", rng, { provinzen: [], staerke: 1, daten: { zusage: z.id } });
  }
  for (const ev of [...spiel.ereignisse]) {
    if (ev.frist > world.day) continue;
    const v = vorlage(ev.vorlage);
    const ausgang = v.standard(world, ev, rng);
    // Schweigen wird bemerkt: Ein Präsident, der nicht antwortet, wirkt schwach
    if (!ev.vorlage.startsWith("start_")) spiel.umfrage.zustimmung = Math.max(0, spiel.umfrage.zustimmung - 0.8);
    abschliessen(world, ev, v.titel(world, ev), `Keine Entscheidung: ${ausgang}`);
  }
}

function abschliessen(world: World, ev: OffenesEreignis, titel: string, ausgang: string): void {
  const spiel = world.spiel!;
  spiel.ereignisse = spiel.ereignisse.filter((e) => e.id !== ev.id);
  spiel.chronik.push({ tag: world.day, datum: world.date, titel, ausgang });
  addLog(world, "entscheidung", `${titel}: ${ausgang}`);
}

/** Wer die Ursache selbst regelt (ein Vorhaben zu einer zugehörigen Maßnahme einbringt), hat das Ereignis in die Hand genommen. */
setzeEinbringHaken((world, massnahmeId, text) => {
  const spiel = world.spiel;
  if (!spiel) return;
  for (const ev of [...spiel.ereignisse]) {
    if (ev.vorlage.startsWith("start_")) continue;
    const v = vorlage(ev.vorlage);
    const zusage = ev.vorlage === "zusage" ? spiel.zusagen.find((x) => x.id === String(ev.daten?.zusage)) : undefined;
    if (!v.massnahmen?.includes(massnahmeId) && zusage?.massnahme !== massnahmeId) continue;
    if (zusage) zusage.faellig = world.day + REGELN.tageBisAbstimmung + 15; // das Gesetz liegt im Parlament; die Zusage gilt, sobald es beschlossen ist
    abschliessen(world, ev, v.titel(world, ev), `Selbst an der Ursache angesetzt. ${text}`);
  }
});

// Der Verfassungskern (sim/verfassung.ts) öffnet seine Vorgangs-Ereignisse über diesen Haken,
// ohne den Ereignismotor importieren zu müssen (Importrichtung bleibt einseitig).
setzeVerfassungsOeffner((w, vorlageId, rng) => {
  oeffne(w, vorlageId, rng);
});

const VORSCHAU_CACHE = new Map<string, string[]>();

/**
 * Was eine Antwort sofort bewirkt: auf einer Kopie der Welt durchgerechnet, nichts davon geschieht wirklich.
 * Zeigt Maßnahmenänderungen, Haushalt und die Größen, die sich am stärksten bewegen.
 */
export function wirkungsVorschau(world: World, ev: OffenesEreignis, optionId: string): string[] {
  const key = `${ev.id}|${optionId}|${world.day}|${Math.floor(world.spiel?.kapital ?? 0)}`;
  const gemerkt = VORSCHAU_CACHE.get(key);
  if (gemerkt) return gemerkt;
  const zeilen: string[] = [];
  try {
    const kopie = structuredClone(world);
    const evK = kopie.spiel!.ereignisse.find((e) => e.id === ev.id);
    const o = evK ? antworten(kopie, evK).find((x) => x.id === optionId) : undefined;
    if (evK && o) {
      const vorher = new Map<string, number>();
      for (const n of NET.nodes) if (!n.input) vorher.set(n.id, nationalAverage(NET, world.net, n.id));
      const schulden0 = kopie.economy.debtRatio;
      const risiko0 = kopie.economy.riskPremium;
      const fx0 = kopie.economy.usdTry;
      const loyal0 = new Map(kopie.spiel!.figuren.map((f) => [f.id, f.loyalitaet]));
      o.wirkung(kopie, evK, new Rng(12345));
      // 1. Maßnahmen, die der Spieler damit verändert
      for (const [id, ziel] of Object.entries(kopie.net.targets)) {
        const jetzt = nationalAverage(NET, world.net, id);
        const alt = world.net.targets[id];
        if (Math.abs(ziel - (alt ?? jetzt)) >= 1 && Math.abs(ziel - jetzt) >= 1) zeilen.push(`${NET.nodes[NET.index.get(id)!]!.name}: Stufe ${Math.round(jetzt)} auf ${Math.round(ziel)}`);
      }
      // 2. Haushalt und Märkte
      const ds = kopie.economy.debtRatio - schulden0;
      if (Math.abs(ds) >= 0.04) zeilen.push(`Schulden ${ds > 0 ? "+" : "−"}${nf(Math.abs(ds), 2)} Prozentpunkte`);
      const dr = kopie.economy.riskPremium - risiko0;
      if (Math.abs(dr) >= 4) zeilen.push(`Risikoaufschlag ${dr > 0 ? "+" : "−"}${nf(Math.abs(dr), 0)} Punkte`);
      const df = (kopie.economy.usdTry / fx0 - 1) * 100;
      if (Math.abs(df) >= 0.4) zeilen.push(`Lira ${df > 0 ? "schwächer" : "stärker"} um ${nf(Math.abs(df))} %`);
      // 3. Personen
      for (const f of kopie.spiel!.figuren) {
        const d = f.loyalitaet - (loyal0.get(f.id) ?? f.loyalitaet);
        if (Math.abs(d) >= 3) zeilen.push(`${f.rolle} ${f.name}: ${d > 0 ? "mehr" : "weniger"} Rückhalt`);
      }
      // 4. Die Größen, die sich am stärksten bewegen
      const aenderungen: { name: string; d: number }[] = [];
      for (const n of NET.nodes) {
        if (n.input) continue;
        const d = nationalAverage(NET, kopie.net, n.id) - (vorher.get(n.id) ?? 0);
        if (Math.abs(d) >= 0.4) aenderungen.push({ name: n.name, d });
      }
      aenderungen.sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
      for (const a of aenderungen.slice(0, 4)) zeilen.push(`${a.name} ${a.d > 0 ? "+" : "−"}${nf(Math.abs(a.d))}`);
    }
  } catch {
    // Keine Vorschau ist besser als eine falsche
  }
  const ergebnis = zeilen.slice(0, 6);
  if (VORSCHAU_CACHE.size > 300) VORSCHAU_CACHE.clear();
  VORSCHAU_CACHE.set(key, ergebnis);
  return ergebnis;
}

export interface EreignisAnsicht {
  id: string;
  vorlage: string;
  szene: SzenenName;
  titel: string;
  text: string[];
  warum: string;
  frist: number;
  tageBisFrist: number;
  optionen: (Omit<Option, "wirkung"> & { bezahlbar: boolean; vorschau: string[] })[];
  /** Maßnahmen, mit denen man die Ursache selbst regeln kann */
  massnahmen: { id: string; name: string; ziel?: number }[];
  /** Beschriftung der Zeile mit den Maßnahmen */
  massnahmenText: string;
}

function zusageAnsicht(world: World, ev: OffenesEreignis, v: Vorlage): { massnahmen: { id: string; name: string; ziel?: number }[]; massnahmenText: string } {
  if (ev.vorlage === "zusage") {
    const z = world.spiel?.zusagen.find((x) => x.id === String(ev.daten?.zusage));
    const vorhaben = zusageVorhaben(world, z);
    return { massnahmen: vorhaben ? [{ id: vorhaben.id, name: vorhaben.name, ziel: vorhaben.ziel }] : [], massnahmenText: "Das Gesetz vorher ansehen:" };
  }
  return { massnahmen: (v.massnahmen ?? []).map((id) => ({ id, name: NET.nodes[NET.index.get(id)!]!.name })), massnahmenText: "Oder an der Ursache ansetzen:" };
}

export function ansicht(world: World, ev: OffenesEreignis): EreignisAnsicht {
  const v = vorlage(ev.vorlage);
  return {
    id: ev.id,
    vorlage: ev.vorlage,
    szene: v.szene,
    titel: v.titel(world, ev),
    text: v.text(world, ev),
    warum: v.warum(world, ev),
    frist: ev.frist,
    tageBisFrist: Math.max(0, ev.frist - world.day),
    optionen: antworten(world, ev).map(({ wirkung: _w, ...rest }) => ({ ...rest, bezahlbar: kannZahlen(world.spiel?.kapital ?? 0, rest.anzeigePk ?? rest.pk), vorschau: wirkungsVorschau(world, ev, rest.id) })),
    ...zusageAnsicht(world, ev, v),
  };
}

export function entscheide(world: World, ereignisId: string, optionId: string, rng: Rng): { ok: boolean; text: string } {
  const spiel = world.spiel;
  const ev = spiel?.ereignisse.find((e) => e.id === ereignisId);
  if (!spiel || !ev) return { ok: false, text: "Dieses Ereignis ist nicht mehr offen." };
  const v = vorlage(ev.vorlage);
  const o = antworten(world, ev).find((x) => x.id === optionId);
  if (!o) return { ok: false, text: "Diese Antwort gibt es nicht." };
  if (!kannZahlen(spiel.kapital, o.pk)) return { ok: false, text: `Dafür fehlt Politisches Kapital (nötig ${o.pk}, vorhanden ${Math.floor(spiel.kapital)}).` };
  spiel.kapital -= o.pk;
  const titel = v.titel(world, ev);
  const ausgang = o.wirkung(world, ev, rng);
  abschliessen(world, ev, titel, `${o.label}. ${ausgang}`);
  return { ok: true, text: ausgang };
}

/** Für Bots und Tests: die günstigste sinnvolle Antwort, die noch bezahlbar ist. */
export function standardAntwort(world: World, ev: OffenesEreignis): string | null {
  const opts = antworten(world, ev).filter((o) => (world.spiel?.kapital ?? 0) >= o.pk);
  return opts.length ? opts[0]!.id : null;
}

// Die Kritik an der Zentralbank oder ein Austausch der Führung als Antwort auf einen Währungsrutsch bleibt Sache der
// direkten Eingriffe; hier nur zur Nutzung durch Befehle und Oberfläche bereitgestellt.
export { criticizeCentralBank, replaceGovernor };

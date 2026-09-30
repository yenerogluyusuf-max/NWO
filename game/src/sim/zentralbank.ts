// Die Zentralbank als Entscheidung (WIRTSCHAFTSMODELL.md, Abschnitt 5): Der Präsident setzt den Leitzins nicht selbst, solange die Bank
// unabhängig ist. Er kann aber Druck machen (vertraulich oder öffentlich), die Führung austauschen und die Unabhängigkeit per Gesetz ändern.
// Jeder Weg kostet etwas und wirkt über Erwartungen, Währung und Märkte. Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung).

import type { GovernorStance, World } from "./types";
import type { Sitzung, Unabhaengigkeit, ZbDruck } from "./wirtschaft-typen";
import { PPK_GEWICHTE, clamp, ppkDecision } from "./economy";
import { addLog, fmt } from "./log";
import { addDays } from "./dates";
import { kannZahlen } from "./kapital";
import { wirke } from "./wirkung";
import { figur, loyalitaetAendern, zufallsName } from "./figuren";
import { REGELN, stimmenSicht } from "./handeln";
import { DRUCK_STAERKE, criticizeCentralBank, kritikStaerke, replaceGovernor } from "./eingriffe";
import { Rng } from "./rng";
import { addMarke, zbZustand } from "./wirtschaft";
import { glaubwuerdigkeitsKette, kettenZeile, zinsKette } from "./folgen";

export interface Ergebnis {
  ok: boolean;
  text: string;
  why?: string;
}

export const STUFEN: Record<Unabhaengigkeit, { name: string; text: string }> = {
  A: { name: "Unabhängig", text: "Gesetzlich geschützte Amtszeit, keine Weisungen. Druck wirkt nur schwach, und die Führung lässt sich nicht entlassen." },
  B: { name: "Formell unabhängig", text: "Die Regierung ernennt die Führung und kann sie unter Bedingungen entlassen. Druck wirkt je nach Haltung der Gouverneurin." },
  C: { name: "Weisungsgebunden", text: "Die Regierung bestimmt die Geldpolitik: Sie legen den Zins selbst fest. Die Märkte trauen der Bank nicht mehr." },
};

/** Wie empfänglich die Führung für Druck ist, je nach Haltung. */
export const EMPFAENGLICH: Record<GovernorStance, number> = { vorsichtig: 0.3, ausgewogen: 0.6, gefuegig: 1 };

/** Prozentpunkte, um die eine voll empfängliche Bank ihren Beschluss je Einheit Druck verschiebt. */
export const DRUCK_PUNKTE = 3;
export { DRUCK_STAERKE, kritikStaerke };
/** Ein vertrauliches Gespräch mit der Gouverneurin höchstens so oft (Tage). */
export const GESPRAECH_ABKUEHLUNG = 30;
const STUFEN_ABKUEHLUNG = 180;
const GOUVERNEUR_ABKUEHLUNG = 120;

export function glaubwuerdigkeitWort(c: number): string {
  if (c < 0.2) return "am Boden";
  if (c < 0.35) return "gering";
  if (c < 0.5) return "mäßig";
  if (c < 0.65) return "solide";
  return "hoch";
}

/** Die nächste Zinssitzung: Tag, Abstand in Tagen und Datum; `null`, wenn keine mehr geplant ist. */
export function naechsteSitzung(w: World): { tag: number; tage: number; datum: string } | null {
  const tag = w.ppkDays.find((d) => d > w.day);
  return tag === undefined ? null : { tag, tage: tag - w.day, datum: addDays(w.date, tag - w.day) };
}

export interface DruckWirkung {
  bias: number;
  regel: number;
  neu: number;
  abweichung: number;
}

/** Was Druck bei der nächsten Sitzung bewirken würde, nach heutigem Stand (die Lage kann sich bis dahin ändern). */
export function druckWirkung(w: World, richtung: -1 | 1, weg: ZbDruck["weg"]): DruckWirkung {
  const e = w.economy;
  const z = zbZustand(w);
  const emp = EMPFAENGLICH[w.governor.stance] * (z.stufe === "A" ? 0.5 : 1);
  const bias = richtung * DRUCK_STAERKE[weg] * emp * DRUCK_PUNKTE;
  const regel = ppkDecision(e, w.governor.stance).newRate;
  const neu = ppkDecision(e, w.governor.stance, bias).newRate;
  return { bias, regel, neu, abweichung: neu - regel };
}

function saetze(zeilen: ReturnType<typeof zinsKette>, max = 6): string[] {
  return zeilen.slice(0, max).map(kettenZeile);
}

/**
 * Die Zinssitzung des Geldpolitischen Ausschusses. Ohne Einfluss folgt die Bank ihrer Regel; mit Druck (Stufen A und B) verschiebt sie
 * ihren Zielzins je nach Empfänglichkeit; in Stufe C bestimmt der Präsident den Zins. Jede Abweichung von der Regel sehen die Märkte.
 */
export function zinssitzung(w: World): void {
  const e = w.economy;
  const alt = e.policyRate;
  const regel = ppkDecision(e, w.governor.stance);
  if (!w.spiel) {
    e.policyRate = regel.newRate;
    addLog(w, "entscheidung", protokolltext(alt, regel.newRate), regel.why);
    return;
  }
  const z = zbZustand(w);
  const druck = z.druck && w.day - z.druck.tag <= 75 ? z.druck : null;
  let neu = regel.newRate;
  let begruendung = regel.why;
  let abw = 0;
  if (z.stufe === "C") {
    const ziel = z.vorgabe ?? ppkDecision(e, "gefuegig").newRate;
    neu = clamp(Math.round(ziel * 2) / 2, 0, 60);
    abw = neu - regel.newRate;
    begruendung = z.vorgabe != null ? "Auf Weisung der Regierung setzt der Ausschuss den Zins fest." : "Ohne Vorgabe folgt der Ausschuss der Linie der Regierung.";
    // Die Märkte rechnen mit politischen Zinsen
    e.credibility = clamp(e.credibility - 0.005, 0.05, 0.95);
    e.riskPremium += 3;
  } else if (druck) {
    const emp = EMPFAENGLICH[w.governor.stance] * (z.stufe === "A" ? 0.5 : 1);
    const bias = druck.richtung * druck.staerke * emp * DRUCK_PUNKTE;
    const mit = ppkDecision(e, w.governor.stance, bias);
    neu = mit.newRate;
    abw = neu - regel.newRate;
    if (abw === 0) begruendung = `Der Ausschuss bleibt bei seiner Linie: Die Gouverneurin lässt sich nicht beeinflussen. ${regel.why}`;
    else if (abw < 0) begruendung = "Der Ausschuss senkt stärker, als seine Regel vorsieht, und verweist auf Wachstum und Beschäftigung. Beobachter sehen den Druck der Regierung.";
    else begruendung = "Der Ausschuss strafft stärker, als seine Regel vorsieht, und stützt sich dabei auf die Rückendeckung der Regierung.";
  }
  e.policyRate = neu;

  // Folgen der Abweichung: Die Märkte merken, wenn politisch entschieden wurde
  if (abw < 0) {
    const a = -abw;
    e.credibility = clamp(e.credibility - 0.02 * a, 0.05, 0.95);
    e.riskPremium += 6 * a;
    e.usdTry *= 1 + 0.004 * a;
    e.eurTry *= 1 + 0.004 * a;
    wirke(w, "vertrauen_maerkte", -0.8 * a);
    loyalitaetAendern(w, "zentralbank", -3 * a, "Die Gouverneurin fühlt sich zu einer Entscheidung gedrängt, die sie nicht für richtig hält.");
  } else if (abw > 0) {
    e.credibility = clamp(e.credibility + 0.01 * abw, 0.05, 0.95);
    e.riskPremium = Math.max(50, e.riskPremium - 3 * abw);
    wirke(w, "unternehmer", -0.5 * abw);
  } else if (druck && z.stufe !== "C") {
    loyalitaetAendern(w, "zentralbank", -2, "Die Gouverneurin hat den Versuch bemerkt, sie zu beeinflussen.");
  }

  const delta = neu - alt;
  const folgen = delta !== 0 ? saetze(zinsKette(delta)) : [`Der Zins bleibt bei ${fmt(neu)} %: Frühere Entscheidungen wirken weiter, ihre Wirkung ist noch nicht ausgespielt.`];
  if (abw !== 0) folgen.push(...saetze(glaubwuerdigkeitsKette(abw < 0 ? -1 : 1), 3));

  const s: Sitzung = {
    tag: w.day,
    datum: w.date,
    alt,
    neu,
    regel: regel.newRate,
    abweichung: abw,
    ...(druck && z.stufe !== "C" ? { druck } : {}),
    stufe: z.stufe,
    begruendung,
    folgen,
  };
  z.sitzungen.push(s);
  if (z.sitzungen.length > 24) z.sitzungen.shift();
  z.druck = null;
  z.vorgabe = null;

  const text = protokolltext(alt, neu);
  addLog(w, "entscheidung", abw !== 0 && z.stufe !== "C" ? `${text} Der Zins weicht wegen des Drucks der Regierung von der Regel der Bank ab.` : text, begruendung);
  addMarke(w, "zins", `${text}${abw !== 0 ? " (auf Druck)" : ""}`);
}

function protokolltext(alt: number, neu: number): string {
  return neu === alt ? `Die Zentralbank hält den Leitzins bei ${fmt(neu)} %.` : `Die Zentralbank ${neu > alt ? "erhöht" : "senkt"} den Leitzins von ${fmt(alt)} auf ${fmt(neu)} %.`;
}

// ---------------------------------------------------------------------------
// Wege des Präsidenten

/** Druck auf die nächste Sitzung: vertraulich im Gespräch (1 Kapital) oder öffentlich in einer Rede. */
export function machDruck(w: World, richtung: -1 | 1, weg: ZbDruck["weg"]): Ergebnis {
  const spiel = w.spiel;
  if (!spiel) return { ok: false, text: "Ohne Spielschleife gibt es keine Zinssitzung." };
  const z = zbZustand(w);
  if (z.stufe === "C") return { ok: false, text: "Die Bank ist weisungsgebunden: Sie legen den Zins selbst fest, Druck ist nicht nötig." };
  if (!naechsteSitzung(w)) return { ok: false, text: "Es ist keine Zinssitzung mehr geplant." };
  const wirkung = druckWirkung(w, richtung, weg);
  if (weg === "gespraech") {
    const rest = (z.gespraech ?? -1e9) + GESPRAECH_ABKUEHLUNG - w.day;
    if (rest > 0) return { ok: false, text: `Sie haben vor Kurzem mit der Gouverneurin gesprochen; wieder sinnvoll in ${rest} Tagen.` };
    if (!kannZahlen(spiel.kapital, 1)) return { ok: false, text: "Für ein Gespräch fehlt Politisches Kapital." };
    spiel.kapital -= 1;
    z.gespraech = w.day;
    w.economy.credibility = clamp(w.economy.credibility - 0.005, 0.05, 0.95);
    z.druck = { richtung, weg, staerke: DRUCK_STAERKE.gespraech, tag: w.day };
    const text = `Vertrauliches Gespräch mit der Gouverneurin: Sie bitten um ${richtung < 0 ? "eine Zinssenkung" : "Festigkeit gegen die Inflation"}.`;
    const why = `Kostet 1 Kapital. ${wirkung.abweichung !== 0 ? `Nach heutigem Stand beschließt die Bank ${fmt(wirkung.neu)} % statt ${fmt(wirkung.regel)} %.` : "Nach heutigem Stand ändert das nichts: Die Gouverneurin bleibt bei ihrer Linie."}`;
    addLog(w, "entscheidung", text, why);
    addMarke(w, "eingriff", text);
    return { ok: true, text, why };
  }
  if (richtung < 0) {
    // Öffentliche Kritik: die bestehende Wirkung des Eingriffs (Währung, Risikoaufschlag, Glaubwürdigkeit) samt Druck auf die Sitzung
    // (`criticizeCentralBank` setzt den Druck selbst)
    const staerke = kritikStaerke(w);
    criticizeCentralBank(w);
    const text = "Rede gegen die Zinspolitik: Sie fordern öffentlich niedrigere Zinsen.";
    const why = `Die Lira gibt nach, der Risikoaufschlag steigt${staerke > 1 ? ` (wiederholte Kritik: ${fmt(staerke)}fache Wirkung)` : ""}. ${wirkung.abweichung !== 0 ? `Nach heutigem Stand beschließt die Bank ${fmt(wirkung.neu)} % statt ${fmt(wirkung.regel)} %.` : "Die Gouverneurin lässt sich davon nicht beeindrucken."}`;
    return { ok: true, text, why };
  }
  // Öffentliche Rückendeckung für eine strenge Linie
  w.economy.credibility = clamp(w.economy.credibility + 0.015, 0.05, 0.95);
  w.economy.riskPremium = Math.max(50, w.economy.riskPremium - 8);
  w.economy.usdTry *= 0.997;
  w.economy.eurTry *= 0.997;
  wirke(w, "unternehmer", -1.5);
  wirke(w, "junge", -1);
  z.druck = { richtung: 1, weg: "rede", staerke: DRUCK_STAERKE.rede, tag: w.day };
  const text = "Rede für die Zinspolitik: Sie stützen öffentlich die Linie der Bank gegen die Inflation.";
  const why = "Die Märkte atmen auf, Unternehmer und Junge mit Krediten und Mieten stöhnen. Die Gouverneurin sieht sich bestätigt.";
  addLog(w, "entscheidung", text, why);
  addMarke(w, "eingriff", text);
  return { ok: true, text, why };
}

/** Die Führung der Bank neu besetzen: mit einer eher strengen, ausgewogenen oder gefügigen Haltung. */
export function ernenneGouverneur(w: World, haltung: GovernorStance): Ergebnis {
  const spiel = w.spiel;
  if (!spiel) return { ok: false, text: "Ohne Spielschleife gibt es keine Zentralbank." };
  const z = zbZustand(w);
  if (z.stufe === "A") return { ok: false, text: "Die Führung der Bank ist gesetzlich geschützt: Sie lässt sich nicht entlassen. Zuerst müsste das Gesetz geändert werden." };
  if (w.governor.stance === haltung) return { ok: false, text: "Die Führung hat schon diese Haltung." };
  const rest = (z.gouverneurGeaendert ?? -1e9) + GOUVERNEUR_ABKUEHLUNG - w.day;
  if (rest > 0) return { ok: false, text: `Die Führung wurde erst kürzlich gewechselt; ein weiterer Wechsel ist in ${rest} Tagen möglich.` };
  const rng = new Rng(w.rngState ^ Math.imul(w.day + 11, 0x9e3779b1));
  const name = haltung === "gefuegig" ? "eine neue, regierungsnahe Führung" : zufallsName(w, rng);
  replaceGovernor(w, haltung, name);
  z.gouverneurGeaendert = w.day;
  if (haltung !== "gefuegig") {
    // Ein Wechsel hin zu einer erfahrenen Führung beruhigt die Märkte teilweise
    const gut = haltung === "vorsichtig";
    w.economy.credibility = clamp(w.economy.credibility + (gut ? 0.1 : 0.05), 0.05, 0.95);
    w.economy.riskPremium = Math.max(50, w.economy.riskPremium - (gut ? 30 : 15));
  }
  const f = figur(w, "zentralbank");
  const text = haltung === "gefuegig" ? "Die Führung der Bank wird durch eine regierungsnahe ersetzt." : haltung === "vorsichtig" ? `Neue Führung der Bank: ${f?.name ?? name}, eine strenge Hüterin der Preisstabilität.` : `Neue Führung der Bank: ${f?.name ?? name}, eine ausgewogene Kraft aus dem Haus.`;
  const why = haltung === "gefuegig" ? "Die Märkte lesen das als Eingriff in die Unabhängigkeit: Die Lira fällt, der Risikoaufschlag steigt, die Glaubwürdigkeit leidet stark." : "Ein Wechsel bleibt ein Eingriff, aber die Märkte belohnen eine erfahrene, strenge Führung mit etwas Vertrauen.";
  addMarke(w, "eingriff", text);
  return { ok: true, text, why };
}

/** Stufe C: Sie legen den Zins für die nächste Sitzung fest. */
export function setzeVorgabe(w: World, zins: number | null): Ergebnis {
  if (!w.spiel) return { ok: false, text: "Ohne Spielschleife gibt es keine Zinssitzung." };
  const z = zbZustand(w);
  if (z.stufe !== "C") return { ok: false, text: "Nur eine weisungsgebundene Bank folgt einer Vorgabe des Präsidenten." };
  z.vorgabe = zins === null ? null : clamp(Math.round(zins * 2) / 2, 0, 60);
  if (z.vorgabe === null) return { ok: true, text: "Keine Vorgabe: Die Bank folgt der Linie der Regierung." };
  const regel = ppkDecision(w.economy, w.governor.stance).newRate;
  return { ok: true, text: `Vorgabe für die nächste Sitzung: Leitzins ${fmt(z.vorgabe)} %.`, why: `Die Regel der Bank hätte ${fmt(regel)} % ergeben; jede Abweichung sehen die Märkte.` };
}

interface Wechsel {
  pk: number;
  text: string;
  effekte: string;
}

const WECHSEL: Record<string, Wechsel> = {
  "B>C": { pk: 8, text: "Die Zentralbank per Gesetz der Regierung unterstellen", effekte: "Die Märkte reagieren schon auf die Ankündigung: Lira und Anleihen fallen, die Glaubwürdigkeit bricht ein, der Risikoaufschlag springt." },
  "C>B": { pk: 4, text: "Die Bank wieder formell unabhängig machen", effekte: "Vertrauen kehrt langsam zurück; die Glaubwürdigkeit steigt ein Stück, der Risikoaufschlag sinkt." },
  "B>A": { pk: 6, text: "Die Unabhängigkeit der Bank gesetzlich schützen", effekte: "Ein Signal an die Märkte: mehr Glaubwürdigkeit, niedrigerer Risikoaufschlag. Dafür ist die Führung nicht mehr zu entlassen, und Druck wirkt kaum noch." },
  "A>B": { pk: 2, text: "Den Schutz der Bank lockern", effekte: "Die Märkte werten es als Schwächung; die Glaubwürdigkeit sinkt etwas." },
};

export function stufenWechsel(von: Unabhaengigkeit): { ziel: Unabhaengigkeit; pk: number; text: string; effekte: string }[] {
  const nach: Record<Unabhaengigkeit, Unabhaengigkeit[]> = { A: ["B"], B: ["A", "C"], C: ["B"] };
  return nach[von].map((ziel) => ({ ziel, ...WECHSEL[`${von}>${ziel}`]! }));
}

/** Die Wirkung eines Wechsels der Unabhängigkeit auf Märkte und Bank, ohne Prüfung von Mehrheit und Kosten. */
export function wendeStufeAn(w: World, ziel: Unabhaengigkeit): void {
  const z = zbZustand(w);
  const e = w.economy;
  const alt = z.stufe;
  if (alt === ziel) return;
  z.stufe = ziel;
  z.stufeGeaendert = w.day;
  z.druck = null;
  z.vorgabe = null;
  if (alt === "B" && ziel === "C") {
    e.credibility = clamp(e.credibility - 0.18, 0.05, 0.95);
    e.riskPremium += 70;
    e.usdTry *= 1.04;
    e.eurTry *= 1.04;
    wirke(w, "vertrauen_maerkte", -8);
    wirke(w, "legitimitaet", -3);
    loyalitaetAendern(w, "zentralbank", -25, "Die Gouverneurin sieht ihre Bank entmachtet.");
  } else if (alt === "C" && ziel === "B") {
    e.credibility = clamp(e.credibility + 0.06, 0.05, 0.95);
    e.riskPremium = Math.max(50, e.riskPremium - 30);
    wirke(w, "vertrauen_maerkte", 4);
  } else if (alt === "B" && ziel === "A") {
    e.credibility = clamp(e.credibility + 0.08, 0.05, 0.95);
    e.riskPremium = Math.max(50, e.riskPremium - 25);
    wirke(w, "vertrauen_maerkte", 5);
    wirke(w, "legitimitaet", 2);
    wirke(w, "konservative", -1);
    loyalitaetAendern(w, "zentralbank", 15, "Die Gouverneurin dankt für den Rückhalt.");
  } else {
    e.credibility = clamp(e.credibility - 0.06, 0.05, 0.95);
    e.riskPremium += 20;
    wirke(w, "vertrauen_maerkte", -3);
  }
}

/** Die Unabhängigkeit der Bank per Gesetz ändern: braucht eine Mehrheit im Lager, kostet Kapital und wirkt sofort auf die Märkte. */
export function aendereStufe(w: World, ziel: Unabhaengigkeit): Ergebnis {
  const spiel = w.spiel;
  if (!spiel) return { ok: false, text: "Ohne Spielschleife gibt es keine Zentralbank." };
  const z = zbZustand(w);
  const w2 = WECHSEL[`${z.stufe}>${ziel}`];
  if (!w2) return { ok: false, text: "Diesen Schritt gibt es nicht; die Unabhängigkeit ändert sich stufenweise." };
  const rest = (z.stufeGeaendert ?? -1e9) + STUFEN_ABKUEHLUNG - w.day;
  if (rest > 0) return { ok: false, text: `Das Zentralbankgesetz wurde gerade erst geändert; frühestens in ${rest} Tagen wieder.` };
  const lager = stimmenSicht(w).lager;
  if (lager < REGELN.mehrheit) return { ok: false, text: `Für die Gesetzesänderung fehlt die Mehrheit im Lager (${lager} von ${REGELN.mehrheit} Stimmen).` };
  if (!kannZahlen(spiel.kapital, w2.pk)) return { ok: false, text: `Das kostet ${w2.pk} Kapital; vorhanden sind ${Math.floor(spiel.kapital)}.` };
  spiel.kapital -= w2.pk;
  wendeStufeAn(w, ziel);
  const text = `${w2.text}: Die Bank ist jetzt „${STUFEN[ziel].name}“.`;
  addLog(w, "entscheidung", text, w2.effekte);
  addMarke(w, "eingriff", text);
  return { ok: true, text, why: `Kostet ${w2.pk} Kapital. ${w2.effekte}` };
}

/** Für die Oberfläche: die Wahl, was vor der nächsten Sitzung geschieht, samt Voraussage des Beschlusses. */
export interface DruckOption {
  id: "keiner" | "gespraech_senken" | "rede_senken" | "gespraech_straffen" | "rede_straffen";
  label: string;
  text: string;
  richtung?: -1 | 1;
  weg?: ZbDruck["weg"];
  /** Der Beschluss der Bank nach heutigem Stand */
  neu: number;
  abweichung: number;
  kosten: string[];
  moeglich: boolean;
  grund?: string;
}

export function druckOptionen(w: World): DruckOption[] {
  const spiel = w.spiel;
  const e = w.economy;
  const regel = ppkDecision(e, w.governor.stance).newRate;
  const z = spiel ? zbZustand(w) : null;
  const kritik = kritikStaerke(w);
  const opt = (id: DruckOption["id"], label: string, text: string, richtung: -1 | 1, weg: ZbDruck["weg"], kosten: string[]): DruckOption => {
    const wirkung = druckWirkung(w, richtung, weg);
    let moeglich = true;
    let grund: string | undefined;
    if (!spiel || !z) {
      moeglich = false;
      grund = "Ohne Spielschleife.";
    } else if (z.stufe === "C") {
      moeglich = false;
      grund = "Die Bank ist weisungsgebunden.";
    } else if (!naechsteSitzung(w)) {
      moeglich = false;
      grund = "Keine Sitzung mehr geplant.";
    } else if (weg === "gespraech") {
      const rest = (z.gespraech ?? -1e9) + GESPRAECH_ABKUEHLUNG - w.day;
      if (rest > 0) {
        moeglich = false;
        grund = `Wieder möglich in ${rest} Tagen.`;
      } else if (!kannZahlen(spiel.kapital, 1)) {
        moeglich = false;
        grund = "Es fehlt Kapital.";
      }
    }
    return { id, label, text, richtung, weg, neu: wirkung.neu, abweichung: wirkung.abweichung, kosten, moeglich, ...(grund ? { grund } : {}) };
  };
  return [
    { id: "keiner", label: "Nicht einmischen", text: "Die Bank folgt ihrer Regel. Die Märkte danken es Ihnen, Ihre Wähler vielleicht nicht.", neu: regel, abweichung: 0, kosten: ["keine"], moeglich: true },
    opt("gespraech_senken", "Vertraulich um eine Senkung bitten", "Ein Gespräch unter vier Augen: leise, aber nicht kostenlos.", -1, "gespraech", ["1 Kapital", "Vertrauen der Märkte: minimal"]),
    opt("rede_senken", "Öffentlich eine Senkung verlangen", "Eine Rede gegen die hohen Zinsen: laut, wirksamer, mit Folgen für die Lira.", -1, "rede", ["Lira schwächer", `Risikoaufschlag +${Math.round(10 * kritik)}`, `Glaubwürdigkeit −${fmt(3 * kritik)} Punkte`, kritik > 1 ? `Wiederholte Kritik wirkt ${fmt(kritik)}fach` : "beim ersten Mal noch milde"]),
    opt("gespraech_straffen", "Vertraulich zur Festigkeit raten", "Im Gespräch die Bank ermuntern, die Inflation nicht laufen zu lassen.", 1, "gespraech", ["1 Kapital", "Unternehmer und Kreditnehmer murren"]),
    opt("rede_straffen", "Öffentlich die strenge Linie stützen", "Eine Rede für die Preisstabilität: Märkte atmen auf, Kreditnehmer nicht.", 1, "rede", ["Märkte: Vertrauen +", "Unternehmer und Junge: Unmut"]),
  ];
}

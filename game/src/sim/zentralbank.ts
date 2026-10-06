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
import { t } from "../i18n";

export interface Ergebnis {
  ok: boolean;
  text: string;
  why?: string;
}

export const STUFEN: Record<Unabhaengigkeit, { name: string; text: string }> = {
  A: { name: t("sim2.sim.zentralbank.04c9394"), text: t("sim2.sim.zentralbank.82647b2") },
  B: { name: t("sim2.sim.zentralbank.4f68d18"), text: t("sim2.sim.zentralbank.229957b") },
  C: { name: "Weisungsgebunden", text: t("sim2.sim.zentralbank.1af7fa5") },
};

/** Wie empfänglich die Führung für Druck ist, je nach Haltung. */
export const EMPFAENGLICH: Record<GovernorStance, number> = { vorsichtig: 0.3, ausgewogen: 0.6, gefuegig: 1 };

/** Prozentpunkte, um die eine voll empfängliche Bank ihren Beschluss je Einheit Druck verschiebt. */
export const DRUCK_PUNKTE = 2.5;
export { DRUCK_STAERKE, kritikStaerke };
/** Ein vertrauliches Gespräch mit der Gouverneurin höchstens so oft (Tage). */
export const GESPRAECH_ABKUEHLUNG = 30;
const STUFEN_ABKUEHLUNG = 180;
const GOUVERNEUR_ABKUEHLUNG = 120;

export function glaubwuerdigkeitWort(c: number): string {
  if (c < 0.2) return t("sim2.sim.zentralbank.03a881d");
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
    begruendung = z.vorgabe != null ? t("sim2.sim.zentralbank.e697bb1") : t("sim2.sim.zentralbank.3c4a578");
    // Die Märkte rechnen mit politischen Zinsen
    e.credibility = clamp(e.credibility - 0.005, 0.05, 0.95);
    e.riskPremium += 3;
  } else if (druck) {
    const emp = EMPFAENGLICH[w.governor.stance] * (z.stufe === "A" ? 0.5 : 1);
    const bias = druck.richtung * druck.staerke * emp * DRUCK_PUNKTE;
    const mit = ppkDecision(e, w.governor.stance, bias);
    neu = mit.newRate;
    abw = neu - regel.newRate;
    if (abw === 0) begruendung = t("sim2.sim.zentralbank.d1ffcbc", { p0: regel.why });
    else if (abw < 0) begruendung = t("sim2.sim.zentralbank.8cfa898");
    else begruendung = t("sim2.sim.zentralbank.1b48f0c");
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
    loyalitaetAendern(w, "zentralbank", -3 * a, t("sim2.sim.zentralbank.58942b0"));
  } else if (abw > 0) {
    e.credibility = clamp(e.credibility + 0.01 * abw, 0.05, 0.95);
    e.riskPremium = Math.max(50, e.riskPremium - 3 * abw);
    wirke(w, "unternehmer", -0.5 * abw);
  } else if (druck && z.stufe !== "C") {
    loyalitaetAendern(w, "zentralbank", -2, t("sim2.sim.zentralbank.be644d5"));
  }

  const delta = neu - alt;
  const folgen = delta !== 0 ? saetze(zinsKette(delta)) : [t("sim2.sim.zentralbank.36a7b39", { p0: fmt(neu) })];
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
  addLog(w, "entscheidung", abw !== 0 && z.stufe !== "C" ? t("sim2.sim.zentralbank.f8f80db", { p0: text }) : text, begruendung);
  addMarke(w, "zins", `${text}${abw !== 0 ? " (auf Druck)" : ""}`);
}

function protokolltext(alt: number, neu: number): string {
  return neu === alt ? t("sim2.sim.zentralbank.17058b3", { p0: fmt(neu) }) : t("sim2.sim.zentralbank.25b369a", { p0: neu > alt ? t("sim2.sim.zentralbank.i588d242") : t("sim2.sim.zentralbank.icebc47b"), p1: fmt(alt), p2: fmt(neu) });
}

// ---------------------------------------------------------------------------
// Wege des Präsidenten

/** Druck auf die nächste Sitzung: vertraulich im Gespräch (1 Kapital) oder öffentlich in einer Rede. */
export function machDruck(w: World, richtung: -1 | 1, weg: ZbDruck["weg"]): Ergebnis {
  const spiel = w.spiel;
  if (!spiel) return { ok: false, text: t("sim2.sim.zentralbank.9806890") };
  const z = zbZustand(w);
  if (z.stufe === "C") return { ok: false, text: t("sim2.sim.zentralbank.0b29764") };
  if (!naechsteSitzung(w)) return { ok: false, text: t("sim2.sim.zentralbank.da9a4f9") };
  const wirkung = druckWirkung(w, richtung, weg);
  if (weg === "gespraech") {
    const rest = (z.gespraech ?? -1e9) + GESPRAECH_ABKUEHLUNG - w.day;
    if (rest > 0) return { ok: false, text: t("sim2.sim.zentralbank.205e499", { p0: rest }) };
    if (!kannZahlen(spiel.kapital, 1)) return { ok: false, text: t("sim2.sim.zentralbank.f2c77d5") };
    spiel.kapital -= 1;
    z.gespraech = w.day;
    w.economy.credibility = clamp(w.economy.credibility - 0.005, 0.05, 0.95);
    z.druck = { richtung, weg, staerke: DRUCK_STAERKE.gespraech, tag: w.day };
    const text = t("sim2.sim.zentralbank.ffbb527", { p0: richtung < 0 ? t("sim2.sim.zentralbank.i110baa9") : t("sim2.sim.zentralbank.icb593b0") });
    const why = t("sim2.sim.zentralbank.0bda6cb", { p0: wirkung.abweichung !== 0 ? `Nach heutigem Stand beschließt die Bank ${fmt(wirkung.neu)} % statt ${fmt(wirkung.regel)} %.` : "Nach heutigem Stand ändert das nichts: Die Gouverneurin bleibt bei ihrer Linie." });
    addLog(w, "entscheidung", text, why);
    addMarke(w, "eingriff", text);
    return { ok: true, text, why };
  }
  if (richtung < 0) {
    // Öffentliche Kritik: die bestehende Wirkung des Eingriffs (Währung, Risikoaufschlag, Glaubwürdigkeit) samt Druck auf die Sitzung
    // (`criticizeCentralBank` setzt den Druck selbst)
    const staerke = kritikStaerke(w);
    criticizeCentralBank(w);
    const text = t("sim2.sim.zentralbank.7c0edc4");
    const why = t("sim2.sim.zentralbank.f68d232", { p0: staerke > 1 ? ` (wiederholte Kritik: ${fmt(staerke)}fache Wirkung)` : "", p1: wirkung.abweichung !== 0 ? `Nach heutigem Stand beschließt die Bank ${fmt(wirkung.neu)} % statt ${fmt(wirkung.regel)} %.` : "Die Gouverneurin lässt sich davon nicht beeindrucken." });
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
  const text = t("sim2.sim.zentralbank.4b9e6d1");
  const why = t("sim2.sim.zentralbank.fa792a3");
  addLog(w, "entscheidung", text, why);
  addMarke(w, "eingriff", text);
  return { ok: true, text, why };
}

/** Die Führung der Bank neu besetzen: mit einer eher strengen, ausgewogenen oder gefügigen Haltung. */
export function ernenneGouverneur(w: World, haltung: GovernorStance): Ergebnis {
  const spiel = w.spiel;
  if (!spiel) return { ok: false, text: t("sim2.sim.zentralbank.ad2d1f7") };
  const z = zbZustand(w);
  if (z.stufe === "A") return { ok: false, text: t("sim2.sim.zentralbank.110fefb") };
  if (w.governor.stance === haltung) return { ok: false, text: t("sim2.sim.zentralbank.c40c7a2") };
  const rest = (z.gouverneurGeaendert ?? -1e9) + GOUVERNEUR_ABKUEHLUNG - w.day;
  if (rest > 0) return { ok: false, text: t("sim2.sim.zentralbank.31107d3", { p0: rest }) };
  const rng = new Rng(w.rngState ^ Math.imul(w.day + 11, 0x9e3779b1));
  const name = haltung === "gefuegig" ? t("sim2.sim.zentralbank.54f843e") : zufallsName(w, rng);
  replaceGovernor(w, haltung, name);
  z.gouverneurGeaendert = w.day;
  if (haltung !== "gefuegig") {
    // Ein Wechsel hin zu einer erfahrenen Führung beruhigt die Märkte teilweise
    const gut = haltung === "vorsichtig";
    w.economy.credibility = clamp(w.economy.credibility + (gut ? 0.1 : 0.05), 0.05, 0.95);
    w.economy.riskPremium = Math.max(50, w.economy.riskPremium - (gut ? 30 : 15));
  }
  const f = figur(w, "zentralbank");
  const text = haltung === "gefuegig" ? t("sim2.sim.zentralbank.05fd7a4") : haltung === "vorsichtig" ? t("sim2.sim.zentralbank.7ef8600", { p0: f?.name ?? name }) : t("sim2.sim.zentralbank.4fdeb30", { p0: f?.name ?? name });
  const why = haltung === "gefuegig" ? t("sim2.sim.zentralbank.633dabf") : t("sim2.sim.zentralbank.e394b9f");
  addMarke(w, "eingriff", text);
  return { ok: true, text, why };
}

/** Stufe C: Sie legen den Zins für die nächste Sitzung fest. */
export function setzeVorgabe(w: World, zins: number | null): Ergebnis {
  if (!w.spiel) return { ok: false, text: t("sim2.sim.zentralbank.9806890") };
  const z = zbZustand(w);
  if (z.stufe !== "C") return { ok: false, text: t("sim2.sim.zentralbank.7f22735") };
  z.vorgabe = zins === null ? null : clamp(Math.round(zins * 2) / 2, 0, 60);
  if (z.vorgabe === null) return { ok: true, text: t("sim2.sim.zentralbank.5885206") };
  const regel = ppkDecision(w.economy, w.governor.stance).newRate;
  return { ok: true, text: t("sim2.sim.zentralbank.c4c4569", { p0: fmt(z.vorgabe) }), why: t("sim2.sim.zentralbank.bdc79e5", { p0: fmt(regel) }) };
}

interface Wechsel {
  pk: number;
  text: string;
  effekte: string;
}

const WECHSEL: Record<string, Wechsel> = {
  "B>C": { pk: 8, text: t("sim2.sim.zentralbank.0f40e13"), effekte: t("sim2.sim.zentralbank.a006e71") },
  "C>B": { pk: 4, text: t("sim2.sim.zentralbank.1480165"), effekte: t("sim2.sim.zentralbank.66fac34") },
  "B>A": { pk: 6, text: t("sim2.sim.zentralbank.9c97aee"), effekte: t("sim2.sim.zentralbank.e376cf5") },
  "A>B": { pk: 2, text: t("sim2.sim.zentralbank.e933261"), effekte: t("sim2.sim.zentralbank.2f3493e") },
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
    loyalitaetAendern(w, "zentralbank", 15, t("sim2.sim.zentralbank.6ab1fef"));
  } else {
    e.credibility = clamp(e.credibility - 0.06, 0.05, 0.95);
    e.riskPremium += 20;
    wirke(w, "vertrauen_maerkte", -3);
  }
}

/** Die Unabhängigkeit der Bank per Gesetz ändern: braucht eine Mehrheit im Lager, kostet Kapital und wirkt sofort auf die Märkte. */
export function aendereStufe(w: World, ziel: Unabhaengigkeit): Ergebnis {
  const spiel = w.spiel;
  if (!spiel) return { ok: false, text: t("sim2.sim.zentralbank.ad2d1f7") };
  const z = zbZustand(w);
  const w2 = WECHSEL[`${z.stufe}>${ziel}`];
  if (!w2) return { ok: false, text: t("sim2.sim.zentralbank.7fd6870") };
  const rest = (z.stufeGeaendert ?? -1e9) + STUFEN_ABKUEHLUNG - w.day;
  if (rest > 0) return { ok: false, text: t("sim2.sim.zentralbank.1193630", { p0: rest }) };
  const lager = stimmenSicht(w).lager;
  if (lager < REGELN.mehrheit) return { ok: false, text: t("sim2.sim.zentralbank.ec325a4", { p0: lager, p1: REGELN.mehrheit }) };
  if (!kannZahlen(spiel.kapital, w2.pk)) return { ok: false, text: t("sim2.sim.zentralbank.9739328", { p0: w2.pk, p1: Math.floor(spiel.kapital) }) };
  spiel.kapital -= w2.pk;
  wendeStufeAn(w, ziel);
  const text = t("sim2.sim.zentralbank.edbe4ca", { p0: w2.text, p1: STUFEN[ziel].name });
  addLog(w, "entscheidung", text, w2.effekte);
  addMarke(w, "eingriff", text);
  return { ok: true, text, why: t("sim2.sim.zentralbank.e046d20", { p0: w2.pk, p1: w2.effekte }) };
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
      grund = t("sim2.sim.zentralbank.418409f");
    } else if (!naechsteSitzung(w)) {
      moeglich = false;
      grund = t("sim2.sim.zentralbank.9282610");
    } else if (weg === "gespraech") {
      const rest = (z.gespraech ?? -1e9) + GESPRAECH_ABKUEHLUNG - w.day;
      if (rest > 0) {
        moeglich = false;
        grund = t("sim2.sim.zentralbank.66c2b2d", { p0: rest });
      } else if (!kannZahlen(spiel.kapital, 1)) {
        moeglich = false;
        grund = t("sim2.sim.zentralbank.2f739ec");
      }
    }
    return { id, label, text, richtung, weg, neu: wirkung.neu, abweichung: wirkung.abweichung, kosten, moeglich, ...(grund ? { grund } : {}) };
  };
  return [
    { id: "keiner", label: "Nicht einmischen", text: t("sim2.sim.zentralbank.7670a8a"), neu: regel, abweichung: 0, kosten: ["keine"], moeglich: true },
    opt("gespraech_senken", t("sim2.sim.zentralbank.e7a3e0b"), t("sim2.sim.zentralbank.21a5b4a"), -1, "gespraech", [t("sim2.sim.zentralbank.25678f3"), t("sim2.sim.zentralbank.e3a96e2")]),
    opt("rede_senken", t("sim2.sim.zentralbank.a382a84"), t("sim2.sim.zentralbank.ca11f2a"), -1, "rede", [t("sim2.sim.zentralbank.4055625"), `Risikoaufschlag +${Math.round(10 * kritik)}`, t("sim2.sim.zentralbank.f16a017", { p0: fmt(3 * kritik) }), kritik > 1 ? `Wiederholte Kritik wirkt ${fmt(kritik)}fach` : t("sim2.sim.zentralbank.f76b008")]),
    opt("gespraech_straffen", "Vertraulich zur Festigkeit raten", t("sim2.sim.zentralbank.f25700d"), 1, "gespraech", [t("sim2.sim.zentralbank.25678f3"), t("sim2.sim.zentralbank.ba6faa3")]),
    opt("rede_straffen", t("sim2.sim.zentralbank.2f49720"), t("sim2.sim.zentralbank.9fef94c"), 1, "rede", [t("sim2.sim.zentralbank.6f39ef9"), t("sim2.sim.zentralbank.cee6da0")]),
  ];
}

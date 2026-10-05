// Rathäuser und Kommunalwahlen (Fork GESELLSCHAFT, 05.10.2026; Prüfbericht 7: „Kommunalwahl nur 2029, Rathäuser statisch, Zwangsverwalter
// ohne Ortsbezug“).
//
// Jede Provinz hat ein Rathaus mit Partei (Start: Bürgermeister der Provinzhauptstädte 2024, data/provinzdaten.json, belegt). Kommunalwahlen
// finden alle fünf Jahre statt; die erste am 25.03.2029 (tuerkei/INSTITUTIONEN.md, belegt), danach jeweils Ende März fünf Jahre später
// (Tag als Spielparameter). Das Ergebnis je Provinz folgt dem Vertrauen in die Regierung vor Ort, dem Amtsbonus und der Zwangsverwaltung.
// Ein Zwangsverwalter ist ein Ortszustand: Kontrolle über die Stadt, monatlich Unmut vor Ort, Rückenwind für die Opposition und
// eine Abrechnung bei der nächsten Wahl. Alle Zahlen sind Spielparameter.

import type { World } from "./types";
import type { GesellschaftZustand, KommunalwahlErgebnis, KommunenZustand } from "./gesellschaft-typen";
import { PROVINZEN } from "./regional";
import { wirke, vertrauenAendern } from "./wirkung";
import { addLog } from "./log";
import { clamp } from "./economy";
import { kannZahlen } from "./kapital";
import { hashWert, verbrauche } from "./aufmerksamkeit";
import { marktSchock } from "./maerkte";
import { gesellschaftVon, grollAendern, knotenIn, kurdischeProvinzen, repressionBuchen } from "./gesellschaft";
import { parteiName } from "./opposition";
import { t } from "../i18n";

export const KOMMUNEN = {
  ersteWahl: "2029-03-25",
  abstandJahre: 5,
  /** Ab diesem Ortswert gewinnt das Lager (Vertrauen vor Ort plus Zuschläge, Spielparameter) */
  schwelle: 52,
  amtsbonus: 4,
  verwalterMalus: 10,
  rauschen: 6,
};

const lagerParteien = (w: World): Set<string> => new Set([w.player?.partei.kurz ?? "", ...(w.spiel?.lager ?? [])]);

export function kommunenStart(w: World): KommunenZustand {
  const rathaus: KommunenZustand["rathaus"] = {};
  for (const p of PROVINZEN) rathaus[String(p.plaka)] = { partei: p.buergermeister2024 || "?" };
  let naechste = KOMMUNEN.ersteWahl;
  while (naechste < w.date) naechste = `${Number(naechste.slice(0, 4)) + KOMMUNEN.abstandJahre}-03-26`;
  return { rathaus, naechste, wahlen: [] };
}

export function kommunenVon(w: World): KommunenZustand {
  return gesellschaftVon(w).kommunen;
}

export const istLagerPartei = (w: World, partei: string): boolean => lagerParteien(w).has(partei);

export function rathaeuserLager(w: World): number {
  if (!w.spiel?.gesellschaft) return 0;
  const k = w.spiel.gesellschaft.kommunen;
  return Object.values(k.rathaus).filter((r) => istLagerPartei(w, r.partei)).length;
}

/** Ob die Kommunalwahl in diesem Monat fällig ist (für das Ereignis in sim/ereignisse-innen.ts). */
export function kommunalwahlFaellig(w: World): boolean {
  if (!w.spiel) return false;
  const k = kommunenVon(w);
  return w.date.slice(0, 7) === k.naechste.slice(0, 7);
}

/** Die Kommunalwahl auswerten: je Provinz Gewinner, Rathäuser, Zwangsverwalter enden. `bonus` aus dem Wahlkampf des Präsidenten. */
export function kommunalwahlDurchfuehren(w: World, bonus = 0): { text: string; ergebnis: KommunalwahlErgebnis } {
  const k = kommunenVon(w);
  const g = gesellschaftVon(w);
  const lagerVorher = rathaeuserLager(w);
  const eigen = w.player?.partei.kurz ?? "";
  const gewonnen: number[] = [];
  const verloren: number[] = [];
  for (const p of PROVINZEN) {
    const r = k.rathaus[String(p.plaka)]!;
    const lagerAmt = istLagerPartei(w, r.partei);
    const rauschen = (hashWert(`${w.seed}|kw|${k.naechste}|${p.plaka}`) - 0.5) * 2 * KOMMUNEN.rauschen;
    const wert = knotenIn(w, "vertrauen_regierung", p.plaka) + (lagerAmt ? KOMMUNEN.amtsbonus : -KOMMUNEN.amtsbonus) - (r.verwalter ? KOMMUNEN.verwalterMalus : 0) + bonus + rauschen;
    const lagerGewinnt = wert > KOMMUNEN.schwelle;
    if (lagerGewinnt && !lagerAmt) {
      r.partei = eigen || r.partei;
      gewonnen.push(p.plaka);
    } else if (!lagerGewinnt && lagerAmt) {
      r.partei = g.opposition.partei;
      verloren.push(p.plaka);
    }
    delete r.verwalter;
  }
  const lagerNachher = rathaeuserLager(w);
  const ergebnis: KommunalwahlErgebnis = { datum: w.date, lagerVorher, lagerNachher, gewonnen, verloren };
  k.wahlen.push(ergebnis);
  k.naechste = `${Number(k.naechste.slice(0, 4)) + KOMMUNEN.abstandJahre}-03-26`;
  const saldo = lagerNachher - lagerVorher;
  // Rückenwind oder Dämpfer: aus dem Saldo der Rathäuser und der landesweiten Stimmung am Wahltag (Spielparameter)
  const zust = w.spiel?.umfrage.zustimmung ?? 50;
  vertrauenAendern(w, clamp(saldo * 0.06 + (zust >= 52 ? 1.5 : zust <= 42 ? -1.5 : 0), -2.5, 2.5));
  g.opposition.staerke = clamp(g.opposition.staerke - saldo * 0.4, 0, 100);
  const gross = [34, 6, 35].filter((pl) => gewonnen.includes(pl) || verloren.includes(pl)).map((pl) => PROVINZEN[pl - 1]!.name);
  const text = t("ges.kom.ergebnis", { nachher: lagerNachher, vorher: lagerVorher, gewonnen: gewonnen.length, verloren: verloren.length }) + (gross.length ? " " + t("ges.kom.grossstaedte", { staedte: gross.join(", ") }) : "");
  addLog(w, "ereignis", text, t("ges.kom.warum"));
  w.spiel?.chronik.push({ tag: w.day, datum: w.date, titel: t("ges.kom.titel"), ausgang: text });
  return { text, ergebnis };
}

/** Einen Zwangsverwalter einsetzen (auch aus dem Ereignis „Verfahren gegen das Rathaus“). */
export function setzeZwangsverwalter(w: World, plaka: number): void {
  const r = kommunenVon(w).rathaus[String(plaka)];
  if (!r) return;
  r.verwalter = { seit: w.day };
  repressionBuchen(w, 6);
  if (kurdischeProvinzen().includes(plaka)) grollAendern(w, "kurden", 6);
}

export function kommunenMonat(w: World, g: GesellschaftZustand): void {
  for (const [pl, r] of Object.entries(g.kommunen.rathaus)) {
    if (!r.verwalter) continue;
    const plaka = Number(pl);
    wirke(w, "staedtische_saekulare", -0.3, [plaka]);
    wirke(w, "minderheiten", -0.3, [plaka]);
    wirke(w, "protestdruck", 0.6, [plaka]);
    g.opposition.staerke = clamp(g.opposition.staerke + 0.3, 0, 100);
    if (kurdischeProvinzen().includes(plaka)) grollAendern(w, "kurden", 0.6);
  }
  // Ohne Ereignis (etwa wenn der Spieler die Wahl verstreichen lässt) wird die fällige Wahl am Monatsende sicher ausgewertet
  if (w.date > g.kommunen.naechste && w.date.slice(0, 7) !== g.kommunen.naechste.slice(0, 7)) kommunalwahlDurchfuehren(w, 0);
}

// ---------------------------------------------------------------------------
// Instrumente

export interface KomErgebnis {
  ok: boolean;
  text: string;
}

export const VERWALTER_KOSTEN = { kapital: 3, aufmerksamkeit: 6 };

export function zwangsverwalterEinsetzen(w: World, plaka: number): KomErgebnis {
  const sp = w.spiel;
  if (!sp) return { ok: false, text: "" };
  const r = kommunenVon(w).rathaus[String(plaka)];
  if (!r || istLagerPartei(w, r.partei)) return { ok: false, text: t("ges.kom.grund.eigenes") };
  if (r.verwalter) return { ok: false, text: t("ges.kom.grund.schon") };
  if (!kannZahlen(sp.kapital, VERWALTER_KOSTEN.kapital)) return { ok: false, text: t("ges.grund.kapital", { kapital: VERWALTER_KOSTEN.kapital }) };
  sp.kapital -= VERWALTER_KOSTEN.kapital;
  verbrauche(w, VERWALTER_KOSTEN.aufmerksamkeit, "Zwangsverwalter");
  setzeZwangsverwalter(w, plaka);
  wirke(w, "polarisierung", 5);
  wirke(w, "justizvertrauen", -4);
  wirke(w, "ansehen", -3);
  wirke(w, "beziehungen_eu", -2);
  wirke(w, "staedtische_saekulare", -4);
  wirke(w, "konservative", 1);
  marktSchock(w, "verhaftung", 1.4);
  const text = t("ges.kom.verwalter_ergebnis", { stadt: PROVINZEN[plaka - 1]!.name, partei: parteiName(r.partei) });
  addLog(w, "entscheidung", text, t("ges.log.kapital", { kapital: VERWALTER_KOSTEN.kapital }));
  sp.chronik.push({ tag: w.day, datum: w.date, titel: t("ges.kom.verwalter_titel"), ausgang: text });
  return { ok: true, text };
}

export function zwangsverwalterAbziehen(w: World, plaka: number): KomErgebnis {
  const r = kommunenVon(w).rathaus[String(plaka)];
  if (!r?.verwalter) return { ok: false, text: t("ges.kom.grund.kein_verwalter") };
  delete r.verwalter;
  wirke(w, "polarisierung", -2);
  wirke(w, "legitimitaet", 1);
  wirke(w, "nationalisten", -0.5);
  const text = t("ges.kom.abziehen_ergebnis", { stadt: PROVINZEN[plaka - 1]!.name });
  addLog(w, "entscheidung", text);
  return { ok: true, text };
}

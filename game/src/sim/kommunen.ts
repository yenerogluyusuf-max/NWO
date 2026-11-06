// Rathäuser und Kommunalwahlen (Fork GESELLSCHAFT, 05.10.2026; Prüfbericht 7: „Kommunalwahl nur 2029, Rathäuser statisch, Zwangsverwalter
// ohne Ortsbezug“).
//
// Jede Provinz hat ein Rathaus mit Partei (Start: Bürgermeister der Provinzhauptstädte 2024, data/provinzdaten.json, belegt). Kommunalwahlen
// finden alle fünf Jahre statt; die erste am 25.03.2029 (tuerkei/INSTITUTIONEN.md, belegt), danach jeweils Ende März fünf Jahre später
// (Tag als Spielparameter). Bürgermeister werden mit relativer Mehrheit gewählt (Gesetz 2972, tuerkei/INSTITUTIONEN.md): In jeder Provinz
// gewinnt der stärkste Kandidat. Die örtlichen Anteile der Parteien kommen aus der letzten Parlamentswahl, verteilt nach den Hochburgen
// von 2023 (data/provinzdaten.json, stimmen2023, belegt; sim/prolog.ts, lokaleAnteile), dazu die Stimmung seit der Parlamentswahl, das
// Vertrauen in die Regierung vor Ort, der Amtsbonus, Bündnisse (Lager und Oppositionsbündnis mit gemeinsamem Kandidaten) und die
// Zwangsverwaltung.
//
// Welle H2 (6. November): Vorher verglich die Rechnung das Vertrauen vor Ort mit einer festen Schwelle von 52. Weil sich dieses Vertrauen
// von Provinz zu Provinz kaum unterscheidet, kippten alle Provinzen gemeinsam: Im Spielstand des Inhabers hielt das Lager 2029 null und
// 2034 alle 81 Rathäuser, bei 214 von 600 Sitzen. Zum Vergleich die echte Kommunalwahl 2024: CHP etwa 37,7 %, AKP etwa 35,5 %, und die
// Provinzen verteilten sich auf CHP 35, AKP 24, DEM 10, MHP 8 und vier weitere (tuerkei/STARTDATEN.md, YSK).
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
import { lokaleAnteile } from "./prolog";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { t } from "../i18n";

export const KOMMUNEN = {
  ersteWahl: "2029-03-25",
  abstandJahre: 5,
  /** Spielparameter: Prozentpunkte für den Kandidaten der Partei (oder des Bündnisses), die das Rathaus hält */
  amtsbonus: 4,
  /** Spielparameter: Prozentpunkte, die das Lager in einer Provinz mit Zwangsverwalter verliert (Abrechnung bei der Wahl) */
  verwalterMalus: 10,
  /** Spielparameter: örtliche Kandidaten, Streuung je Kandidat und Provinz in Prozentpunkten (±) */
  rauschen: 4,
  /** Spielparameter: Prozentpunkte Lageranteil je Punkt Zustimmung seit der Parlamentswahl, höchstens ±`schwungMax` */
  schwung: 0.4,
  schwungMax: 12,
  /** Spielparameter: Prozentpunkte Lageranteil je Punkt, den das Vertrauen in die Regierung vor Ort über dem Landesschnitt liegt */
  ortsgewicht: 0.5,
};

/** Ein Kandidat der Kommunalwahl: eine Partei oder ein Bündnis mit gemeinsamem Kandidaten. */
export interface KommunalKandidat {
  id: string;
  parteien: string[];
  /** Örtlicher Anteil in Prozent, vor Amtsbonus und Rauschen */
  anteil: number;
}

/** Zustimmung zur Zeit der letzten Parlamentswahl (Bezug des Stimmungsschwungs); ohne Eintrag kein Schwung. */
function zustimmungBeiParlamentswahl(w: World): number | undefined {
  const sp = w.spiel;
  if (!sp) return undefined;
  const historie = sp.wahl?.historie ?? [];
  const letzte = [...historie].reverse().find((h) => h.parlament);
  const monat = (letzte?.datum ?? sp.start?.datum ?? "").slice(0, 7);
  const v = sp.umfrage.verlauf;
  return v.find((x) => x.monat === monat)?.wert ?? (letzte ? undefined : v[0]?.wert);
}

/** Stimmungsschwung für das Lager seit der Parlamentswahl, in Prozentpunkten. */
export function kommunalSchwung(w: World): number {
  const bezug = zustimmungBeiParlamentswahl(w);
  if (bezug === undefined) return 0;
  return clamp(KOMMUNEN.schwung * ((w.spiel?.umfrage.zustimmung ?? bezug) - bezug), -KOMMUNEN.schwungMax, KOMMUNEN.schwungMax);
}

/**
 * Die Kandidaten je Provinz (Reihenfolge wie PROVINZEN): örtliche Anteile aus der letzten Parlamentswahl und den Hochburgen von 2023,
 * das Lager verschoben um Stimmungsschwung, Vertrauen vor Ort, Wahlkampf und Zwangsverwalter; das Lager und das Oppositionsbündnis
 * treten mit je einem gemeinsamen Kandidaten an. „Andere“ stellt keinen Kandidaten.
 */
export function kommunalKandidaten(w: World, bonus = 0): KommunalKandidat[][] {
  const shares = w.parliament?.shares ?? {};
  const eigene = w.player?.partei.kurz ?? "";
  const lager = [...lagerParteien(w)].filter((p) => p && p in shares);
  const opp = w.spiel?.gesellschaft?.opposition;
  const oppBuendnis = opp && opp.buendnis.length > 0 ? [opp.partei, ...opp.buendnis].filter((p) => p in shares && !lager.includes(p)) : [];
  const lokal = lokaleAnteile(shares, eigene);
  const schwung = kommunalSchwung(w);
  const vertrauenLand = nationalAverage(NET, w.net, "vertrauen_regierung");
  const rathaus = w.spiel?.gesellschaft?.kommunen.rathaus ?? {};
  return PROVINZEN.map((p, i) => {
    const sh = lokal[i]!;
    const lagerAlt = lager.reduce((s, x) => s + (sh[x] ?? 0), 0);
    const verwalter = rathaus[String(p.plaka)]?.verwalter ? KOMMUNEN.verwalterMalus : 0;
    const zuschlag = schwung + KOMMUNEN.ortsgewicht * (knotenIn(w, "vertrauen_regierung", p.plaka) - vertrauenLand) + bonus - verwalter;
    const lagerNeu = clamp(lagerAlt + zuschlag, 1, 90);
    // Die übrigen Parteien tragen den Schwung im Verhältnis ihrer Anteile
    const faktor = lagerAlt < 100 ? (100 - lagerNeu) / (100 - lagerAlt) : 1;
    const anteil = (x: string) => (lager.includes(x) ? (lagerAlt > 0 ? ((sh[x] ?? 0) * lagerNeu) / lagerAlt : lagerNeu / lager.length) : (sh[x] ?? 0) * faktor);
    const out: KommunalKandidat[] = [];
    if (lager.length) out.push({ id: "lager", parteien: lager, anteil: lager.reduce((s, x) => s + anteil(x), 0) });
    if (oppBuendnis.length > 1) out.push({ id: "buendnis", parteien: oppBuendnis, anteil: oppBuendnis.reduce((s, x) => s + anteil(x), 0) });
    for (const x of Object.keys(shares)) {
      if (x === "Andere" || lager.includes(x) || (oppBuendnis.length > 1 && oppBuendnis.includes(x))) continue;
      out.push({ id: x, parteien: [x], anteil: anteil(x) });
    }
    return out;
  });
}

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
  const gewonnen: number[] = [];
  const verloren: number[] = [];
  const kandidaten = kommunalKandidaten(w, bonus);
  const lokal = lokaleAnteile(w.parliament?.shares ?? {}, w.player?.partei.kurz ?? "");
  PROVINZEN.forEach((p, i) => {
    const r = k.rathaus[String(p.plaka)]!;
    const lagerAmt = istLagerPartei(w, r.partei);
    let sieger: KommunalKandidat | undefined;
    let best = -Infinity;
    for (const c of kandidaten[i]!) {
      const rauschen = (hashWert(`${w.seed}|kw|${k.naechste}|${p.plaka}|${c.id}`) - 0.5) * 2 * KOMMUNEN.rauschen;
      const wert = c.anteil + (c.parteien.includes(r.partei) ? KOMMUNEN.amtsbonus : 0) + rauschen;
      if (wert > best) {
        best = wert;
        sieger = c;
      }
    }
    if (!sieger) return;
    // Das Bündnis stellt den Kandidaten der Partei, die vor Ort am stärksten ist; hält eine Bündnispartei das Rathaus, bleibt es bei ihr
    const partei = sieger.parteien.includes(r.partei) ? r.partei : [...sieger.parteien].sort((a, b) => (lokal[i]![b] ?? 0) - (lokal[i]![a] ?? 0))[0]!;
    const lagerGewinnt = sieger.id === "lager";
    if (lagerGewinnt && !lagerAmt) gewonnen.push(p.plaka);
    else if (!lagerGewinnt && lagerAmt) verloren.push(p.plaka);
    r.partei = partei;
    delete r.verwalter;
  });
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
  // Wer die Rathäuser jetzt hält, nach Zahl (eine Partei je Provinz; die stärksten vier und der Rest)
  const zaehl: Record<string, number> = {};
  for (const r of Object.values(k.rathaus)) zaehl[r.partei] = (zaehl[r.partei] ?? 0) + 1;
  const reihe = Object.entries(zaehl).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const rest = reihe.slice(4).reduce((s, [, n]) => s + n, 0);
  const verteilung = t("welle_h2.kom.verteilung", { liste: reihe.slice(0, 4).map(([pt, n]) => t("welle_h2.kom.partei", { partei: parteiName(pt), n })).join(", "), rest });
  const text = t("ges.kom.ergebnis", { nachher: lagerNachher, vorher: lagerVorher, gewonnen: gewonnen.length, verloren: verloren.length }) + " " + verteilung + (gross.length ? " " + t("ges.kom.grossstaedte", { staedte: gross.join(", ") }) : "");
  addLog(w, "ereignis", text, t("ges.kom.warum"));
  w.spiel?.chronik.push({ tag: w.day, datum: w.date, titel: t("ges.kom.titel"), ausgang: text, vorlage: "kommunalwahl" });
  // Ein Wahlabend, kein Randvermerk: Das Ergebnis hält das Spiel an (Spielerdurchlauf 5. November: Es lief als kurze Meldung
  // vorbei; 2019 kostete eine Kommunalwahl die Regierungspartei Istanbul und Ankara)
  w.spiel?.hinweise.push({
    id: `kommunalwahl-${w.date}`,
    titel: t("ges.kom.titel"),
    szene: "wahlnacht",
    text: [text, t("ges.kom.folge", { richtung: saldo > 0 ? "auf" : saldo < 0 ? "ab" : "gleich", naechste: k.naechste.slice(0, 4) })],
  });
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

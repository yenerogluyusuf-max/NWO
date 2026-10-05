// Politische Vorgänge: ein Vorhaben vom Versprechen bis zur Rechenschaft an einer Stelle (externe Spielprüfung 05.10., Punkte 6 und 7).
//
// Ein Vorgang verbindet, was es schon gibt, statt es zu ersetzen:
//   Ursprung    Wahlversprechen (sim/wahlkampf.ts, Zusage z-wahl-v_wohnen) oder Zusage nach einer Katastrophe (sim/katastrophe.ts)
//   Zuständig   eine Figur des Kabinetts (Fähigkeit und Loyalität wirken auf Tempo und Kosten)
//   Ort         eine Provinz; der Bürgermeister kommt aus den Rathäusern (sim/kommunen.ts)
//   Schritte    Planung → Finanzierung → Genehmigung → Bau → Übergabe → Wirkung
//   Konflikte   Finanzierung (was wird dafür kleiner?) und Grundstücke (Bürgermeister); echte Alternativen mit Preis
//   Rechenschaft „War das mein Verdienst?“: erwartet (Modellannahme beim Beschluss), eingetreten (beobachtete Spielwerte),
//               eigener Anteil (Modellannahme), mitgewirkt (andere Beschlüsse, Konjunktur, Katastrophen), Zuordnung, Korrektur
//
// Erster Typ: Wohnungsbau. Weitere Typen folgen demselben Muster. Alle Zahlen sind Spielparameter, keine Tatsachen.
// Der Zustand liegt in spiel.vorgaenge; ältere Spielstände legen ihn beim ersten Monat an (Migration ohne Brüche).

import { NET } from "./modell";
import { PROVINCES, decayVon } from "./netz";
import { wirke, wertIn } from "./wirkung";
import { PROVINZEN } from "./regional";
import { figur } from "./figuren";
import { eigenVon } from "./personen";
import { kannZahlen } from "./kapital";
import { kosten } from "./ereignis-hilfen";
import { stufeIn } from "./handeln";
import { addLog } from "./log";
import { pausiere, reichZustand, vorhabenSicht } from "./reich";
import { katastrophenZustand } from "./katastrophe";
import { istLagerPartei } from "./kommunen";
import { t } from "../i18n";
import type { World } from "./types";
import type { Figur } from "./spiel-typen";

// ---------------------------------------------------------------------------
// Typen

export type VorgangSchritt = "planung" | "finanzierung" | "genehmigung" | "bau" | "uebergabe" | "wirkung" | "abgeschlossen" | "aufgegeben";
export const SCHRITTE: VorgangSchritt[] = ["planung", "finanzierung", "genehmigung", "bau", "uebergabe", "wirkung"];

export type FinanzWeg = "haushalt" | "verdraengen" | "partner";
export type GrundWeg = "kompromiss" | "druck" | "umgehung" | "aufgeben";

export interface VorgangKonflikt {
  art: "finanzierung" | "grundstuecke";
  /** Tag, an dem der Konflikt auf den Tisch kam, und bis wann entschieden sein muss (sonst Standardweg) */
  seit: number;
  frist: number;
  gewaehlt?: FinanzWeg | GrundWeg;
  /** Wer gegenübersteht (Klartext: Bürgermeisterpartei, Ministerium) */
  gegner?: string;
}

export interface VorgangEintrag {
  tag: number;
  datum: string;
  /** Katalogschlüssel und Werte (Text entsteht bei der Anzeige) */
  k: string;
  p?: Record<string, string | number>;
}

export interface Rechenschaft {
  /** Modellannahmen beim Beschluss: erwartete Änderung in der Provinz */
  erwartet: { wohnungsnot: number; mieten: number };
  /** Beobachtete Spieltatsache: Änderung seit dem Beschluss */
  eingetreten: { wohnungsnot: number; mieten: number };
  /** Modellannahme: wie viel davon noch auf den Vorgang selbst zurückgeht (direkter Stoß nach Abklingen) */
  eigen: { wohnungsnot: number; mieten: number };
  /** Andere Einflüsse in derselben Zeit */
  mitgewirkt: { k: string; p?: Record<string, string | number> }[];
  zuordnung: "eigen" | "gemischt" | "andere" | "unsicher";
  /** Mögliche Korrekturen (Schlüssel) */
  korrektur: ("bauabschnitt" | "mietdeckel" | "keine")[];
}

export interface Vorgang {
  id: string;
  art: "wohnen";
  /** Woher der Vorgang kommt */
  ursprung: { art: "wahlversprechen" | "katastrophe" | "frei"; ref: string };
  /** Ein Satz des Spielers: warum dieses Vorhaben (gewählt beim Anlegen oder Finanzieren) */
  begruendung?: string;
  plaka: number;
  wohnungen: number;
  zustaendig: Figur["amt"];
  schritt: VorgangSchritt;
  /** Tag, an dem der aktuelle Schritt begann */
  schrittSeit: number;
  /** Tag des Beschlusses (Rechenschaft misst ab hier) */
  beschluss: number;
  /** Geplante Bauzeit in Tagen (aus Fähigkeit und Wegen) */
  bauTage: number;
  /** Wirkfaktor der Übergabe (Umgehung am Stadtrand wirkt schwächer) */
  wirkfaktor: number;
  finanzierung?: { weg: FinanzWeg; verdraengt?: string };
  konflikte: VorgangKonflikt[];
  /** Werte beim Beschluss für die Rechenschaft */
  basis: { wohnungsnot: number; mieten: number; wachstum: number; massnahmen: Record<string, number> };
  /** Direkt gesetzter Stoß bei der Übergabe (für den eigenen Anteil) */
  stoss?: { wohnungsnot: number; mieten: number; tag: number };
  rechenschaft?: Rechenschaft;
  verlauf: VorgangEintrag[];
}

// ---------------------------------------------------------------------------
// Spielparameter

export const VORGANG = {
  /** Planung in Tagen bis zur Finanzierungsfrage */
  planungTage: 30,
  /** Bedenkzeit für eine offene Entscheidung, danach greift der Standardweg */
  fristTage: 30,
  /** Genehmigung ohne Konflikt */
  genehmigungTage: 45,
  /** Zusätzliche Tage, wenn ein Kompromiss mit dem Bürgermeister ausgehandelt wird */
  kompromissTage: 60,
  /** Grundbauzeit in Tagen (rund zehn Monate) */
  bauTage: 300,
  /** Abstand zwischen Übergabe und Rechenschaft */
  wirkungTage: 180,
  /** Haushaltsbelastung in Prozent des BIP je 10.000 Wohnungen (Weg Haushalt) */
  bipJe10000: 0.12,
  /** Politisches Kapital für Weg Partner (Privatinvestor) und Druck */
  pkPartner: 2,
  pkDruck: 4,
  pkKompromiss: 2,
  /** Wohnungsnot in der Provinz je 1.000 Wohnungen, Deckel */
  wohnungsnotJe1000: 1,
  wohnungsnotMin: 3,
  wohnungsnotMax: 18,
  /** Anteil, der auf die Mieten durchschlägt (Modellannahme) */
  mietAnteil: 0.35,
};

// ---------------------------------------------------------------------------
// Zugriff

export function vorgaenge(w: World): Vorgang[] {
  const sp = w.spiel;
  if (!sp) return [];
  sp.vorgaenge ??= [];
  return sp.vorgaenge;
}

export const vorgangZu = (w: World, id: string): Vorgang | undefined => vorgaenge(w).find((v) => v.id === id);

const laeuft = (v: Vorgang): boolean => v.schritt !== "abgeschlossen" && v.schritt !== "aufgegeben";
/** Laufende Vorgänge in einer Provinz (für den Sprung von der Karte). */
export const vorgaengeIn = (w: World, plaka: number): Vorgang[] => vorgaenge(w).filter((v) => v.plaka === plaka && laeuft(v));
/** Der Vorgang, der aus einer Zusage entstanden ist (für den Sprung aus den Zusagen). */
export const vorgangZuZusage = (w: World, zusageId: string): Vorgang | undefined => vorgaenge(w).find((v) => v.ursprung.ref === zusageId);
/** Laufende Vorgänge, die auf eine Entscheidung warten (für den Schreibtisch). */
export const wartendeVorgaenge = (w: World): Vorgang[] => vorgaenge(w).filter((v) => laeuft(v) && v.konflikte.some((k) => k.gewaehlt === undefined));

const provinzName = (plaka: number): string => PROVINZEN[plaka - 1]?.name ?? String(plaka);

function eintrag(w: World, v: Vorgang, k: string, p?: Record<string, string | number>): void {
  v.verlauf.push(p ? { tag: w.day, datum: w.date, k, p } : { tag: w.day, datum: w.date, k });
}

const knotenIn = (w: World, id: string, plaka: number): number => wertIn(w, id, [plaka]);

/** Maßnahmen, die über eine Kante auf Wohnungsnot, Mieten oder Wohnungsbau wirken (für „mitgewirkt“). */
const MITWIRKENDE: string[] = (() => {
  const ziele = new Set(["p_wohnungsnot", "mieten", "wohnungsbau"].map((id) => NET.index.get(id)));
  const out = new Set<string>();
  for (let e = 0; e < NET.edges.length; e++) {
    if (!ziele.has(NET.edgeTo[e]!)) continue;
    const von = NET.nodes[NET.edgeFrom[e]!]!;
    if (von.id.startsWith("m_")) out.add(von.id);
  }
  return [...out];
})();

/** Bürgermeisterpartei einer Provinz: Rathäuser aus der Gesellschaft, sonst der Stand von 2024. */
export function buergermeisterPartei(w: World, plaka: number): string {
  return w.spiel?.gesellschaft?.kommunen?.rathaus?.[String(plaka)]?.partei ?? PROVINZEN[plaka - 1]?.buergermeister2024 ?? "?";
}

// ---------------------------------------------------------------------------
// Anlegen

export interface NeuerVorgang {
  ursprung: Vorgang["ursprung"];
  plaka: number;
  wohnungen: number;
  begruendung?: string;
  zustaendig?: Figur["amt"];
}

export function starteVorgang(w: World, n: NeuerVorgang): Vorgang {
  const liste = vorgaenge(w);
  const v: Vorgang = {
    id: `vg-${n.ursprung.art}-${n.ursprung.ref}-${n.plaka}`,
    art: "wohnen",
    ursprung: n.ursprung,
    ...(n.begruendung ? { begruendung: n.begruendung } : {}),
    plaka: n.plaka,
    wohnungen: Math.max(100, Math.round(n.wohnungen)),
    zustaendig: n.zustaendig ?? "wirtschaft",
    schritt: "planung",
    schrittSeit: w.day,
    beschluss: w.day,
    bauTage: VORGANG.bauTage,
    wirkfaktor: 1,
    konflikte: [],
    basis: {
      wohnungsnot: knotenIn(w, "p_wohnungsnot", n.plaka),
      mieten: knotenIn(w, "mieten", n.plaka),
      wachstum: w.economy.growth,
      massnahmen: Object.fromEntries(MITWIRKENDE.map((id) => [id, stufeIn(w, id, null)])),
    },
    verlauf: [],
  };
  liste.push(v);
  const f = figur(w, v.zustaendig);
  eintrag(w, v, "vorgang.log.angelegt", { ort: provinzName(v.plaka), n: v.wohnungen, wer: f?.name ?? "" });
  addLog(w, "entscheidung", t("vorgang.log.angelegt", { ort: provinzName(v.plaka), n: v.wohnungen, wer: f?.name ?? "" }));
  return v;
}

/** Erwartung beim Beschluss (Modellannahme): wie stark Wohnungsnot und Mieten in der Provinz sinken sollten. */
export function erwartung(v: Vorgang): { wohnungsnot: number; mieten: number } {
  const roh = (v.wohnungen / 1000) * VORGANG.wohnungsnotJe1000;
  const wn = -Math.min(VORGANG.wohnungsnotMax, Math.max(VORGANG.wohnungsnotMin, roh)) * v.wirkfaktor;
  return { wohnungsnot: r1(wn), mieten: r1(wn * VORGANG.mietAnteil) };
}

const r1 = (x: number): number => Math.round(x * 10) / 10;

/** Legt fehlende Vorgänge aus bestehenden Ursprüngen an (auch für ältere Spielstände). */
export function vorgaengeAbgleichen(w: World): void {
  const sp = w.spiel;
  if (!sp) return;
  const liste = vorgaenge(w);
  const hat = (art: Vorgang["ursprung"]["art"], ref: string) => liste.some((v) => v.ursprung.art === art && v.ursprung.ref === ref);
  // Zusagen nach Katastrophen legen hier keinen Vorgang an: Ihre Lieferung rechnet das Wiederaufbauprogramm (sim/katastrophe.ts);
  // ein zweiter Bau hier zählte dieselben Wohnungen doppelt. Ein Katastrophen-Vorgang entsteht nur ausdrücklich (starteVorgang).
  // Wahlversprechen „Staatlicher Wohnungsbau“: dort, wo die Wohnungsnot unter den Großstädten am größten ist
  for (const z of sp.zusagen) {
    if (z.id !== "z-wahl-v_wohnen" || z.erfuellt || z.gebrochen || hat("wahlversprechen", z.id)) continue;
    const kandidaten = PROVINZEN.filter((p) => p.grossstadt);
    const best = kandidaten.reduce((a, b) => (knotenIn(w, "p_wohnungsnot", b.plaka) > knotenIn(w, "p_wohnungsnot", a.plaka) ? b : a), kandidaten[0]!);
    starteVorgang(w, { ursprung: { art: "wahlversprechen", ref: z.id }, plaka: best.plaka, wohnungen: 10000 });
  }
}

// ---------------------------------------------------------------------------
// Offene Entscheidung

export const offenerKonflikt = (v: Vorgang): VorgangKonflikt | undefined => v.konflikte.find((k) => k.gewaehlt === undefined);

export interface WegSicht {
  id: FinanzWeg | GrundWeg;
  pk: number;
  /** Möglich? sonst Grund */
  grund?: string;
  /** Folgen in Worten (Schlüssel) */
  k: string;
  p?: Record<string, string | number>;
}

/** Das größte laufende Reich-Vorhaben, das für die Verdrängung in Frage kommt. */
function verdraengbares(w: World): { id: string; name: string } | null {
  const lauf = reichZustand(w).laufend.filter((l) => !l.pausiert);
  if (!lauf.length) return null;
  const l = lauf[0]!;
  return { id: l.id, name: vorhabenSicht(w, l.id)?.v.name ?? l.id };
}

export function wegeFuer(w: World, v: Vorgang): WegSicht[] {
  const k = offenerKonflikt(v);
  if (!k) return [];
  const bip = r1((v.wohnungen / 10000) * VORGANG.bipJe10000 * 100) / 100;
  if (k.art === "finanzierung") {
    const vd = verdraengbares(w);
    return [
      { id: "haushalt", pk: 0, k: "vorgang.weg.haushalt", p: { bip: bip.toLocaleString("de-DE") } },
      vd ? { id: "verdraengen", pk: 0, k: "vorgang.weg.verdraengen", p: { name: vd.name } } : { id: "verdraengen", pk: 0, grund: t("vorgang.grund.nichts_laufend"), k: "vorgang.weg.verdraengen", p: { name: "—" } },
      { id: "partner", pk: VORGANG.pkPartner, k: "vorgang.weg.partner" },
    ];
  }
  return [
    { id: "kompromiss", pk: VORGANG.pkKompromiss, k: "vorgang.weg.kompromiss", p: { monate: Math.round(VORGANG.kompromissTage / 30) } },
    { id: "druck", pk: VORGANG.pkDruck, k: "vorgang.weg.druck" },
    { id: "umgehung", pk: 0, k: "vorgang.weg.umgehung" },
    { id: "aufgeben", pk: 0, k: "vorgang.weg.aufgeben" },
  ];
}

export function entscheideVorgang(w: World, id: string, weg: FinanzWeg | GrundWeg, begruendung?: string): { ok: boolean; text: string } {
  const sp = w.spiel;
  const v = vorgangZu(w, id);
  if (!sp || !v) return { ok: false, text: t("vorgang.fehler.unbekannt") };
  const k = offenerKonflikt(v);
  if (!k) return { ok: false, text: t("vorgang.fehler.nichts_offen") };
  const sicht = wegeFuer(w, v).find((s) => s.id === weg);
  if (!sicht) return { ok: false, text: t("vorgang.fehler.weg") };
  if (sicht.grund) return { ok: false, text: sicht.grund };
  if (!kannZahlen(sp.kapital, sicht.pk)) return { ok: false, text: t("vorgang.fehler.kapital", { pk: sicht.pk }) };
  sp.kapital -= sicht.pk;
  k.gewaehlt = weg;
  if (begruendung && !v.begruendung) v.begruendung = begruendung;
  const ort = [v.plaka];
  switch (weg) {
    case "haushalt":
      kosten(w, (v.wohnungen / 10000) * VORGANG.bipJe10000);
      v.finanzierung = { weg };
      break;
    case "verdraengen": {
      const vd = verdraengbares(w);
      if (vd) pausiere(w, vd.id, true);
      v.finanzierung = vd ? { weg, verdraengt: vd.name } : { weg };
      break;
    }
    case "partner":
      // Privatinvestor: schneller, aber Rendite in den Mieten und Korruptionsrisiko vor Ort (Spielparameter)
      v.finanzierung = { weg };
      v.bauTage = Math.round(v.bauTage * 0.8);
      wirke(w, "korruption", 1.5, ort);
      break;
    case "kompromiss":
      v.bauTage += VORGANG.kompromissTage;
      wirke(w, "vertrauen_regierung", 0.6, ort);
      break;
    case "druck":
      wirke(w, "legitimitaet", -1.5);
      wirke(w, "polarisierung", 1.2, ort);
      wirke(w, "vertrauen_regierung", -0.8, ort);
      break;
    case "umgehung":
      // Staatliche Flächen am Stadtrand: kein Streit, aber weite Wege; die Wirkung auf Wohnungsnot und Mieten fällt schwächer aus
      v.wirkfaktor = 0.6;
      break;
    case "aufgeben":
      v.schritt = "aufgegeben";
      v.schrittSeit = w.day;
      wirke(w, "vertrauen_regierung", -1.5, ort);
      break;
  }
  eintrag(w, v, `vorgang.log.weg.${weg}`, { ort: provinzName(v.plaka), ...(v.finanzierung?.verdraengt ? { name: v.finanzierung.verdraengt } : {}) });
  const text = t(`vorgang.log.weg.${weg}`, { ort: provinzName(v.plaka), name: v.finanzierung?.verdraengt ?? "" });
  addLog(w, "entscheidung", text);
  return { ok: true, text };
}

// ---------------------------------------------------------------------------
// Monatsschritt

/** Bauzeit nach der zuständigen Figur: Fähigkeit beschleunigt, geringe Loyalität bremst (Spielparameter). */
function tempo(w: World, v: Vorgang): number {
  const f = figur(w, v.zustaendig);
  if (!f) return 1.2;
  const fae = eigenVon(w, f).faehigkeit;
  return (1.3 - (fae / 100) * 0.6) * (f.loyalitaet < 35 ? 1.2 : 1);
}

function wechsle(w: World, v: Vorgang, s: VorgangSchritt): void {
  v.schritt = s;
  v.schrittSeit = w.day;
  eintrag(w, v, `vorgang.log.schritt.${s}`, { ort: provinzName(v.plaka) });
}

function hinweis(w: World, v: Vorgang, art: "finanzierung" | "grundstuecke"): void {
  const sp = w.spiel!;
  sp.hinweise.push({
    id: `vorgang-${art}-${v.id}`,
    titel: t(`vorgang.hinweis.${art}.titel`, { ort: provinzName(v.plaka) }),
    text: [t(`vorgang.hinweis.${art}.text`, { ort: provinzName(v.plaka), partei: buergermeisterPartei(w, v.plaka), n: v.wohnungen })],
    szene: "anatolien",
  });
}

function uebergabe(w: World, v: Vorgang): void {
  const e = erwartung(v);
  const ort = [v.plaka];
  wirke(w, "p_wohnungsnot", e.wohnungsnot, ort);
  wirke(w, "mieten", e.mieten, ort);
  wirke(w, "wohnungsbau", Math.abs(e.wohnungsnot) * 0.5, ort);
  wirke(w, "vertrauen_regierung", 1, ort);
  if (v.finanzierung?.weg === "partner") wirke(w, "mieten", Math.abs(e.mieten) * 0.4, ort);
  v.stoss = { wohnungsnot: e.wohnungsnot, mieten: e.mieten + (v.finanzierung?.weg === "partner" ? Math.abs(e.mieten) * 0.4 : 0), tag: w.day };
  // Katastrophenzusage: zusätzliche Wohnungen neben dem Wiederaufbauprogramm zählen als privat geliefert, nie über den Bedarf hinaus
  if (v.ursprung.art === "katastrophe") {
    const fall = katastrophenZustand(w).faelle.find((f) => f.id === v.ursprung.ref);
    if (fall) fall.privatGeliefert = Math.min(fall.wohnungen, fall.privatGeliefert + v.wohnungen);
  }
  // Die eingeplante Verdrängung endet mit der Übergabe
  if (v.finanzierung?.weg === "verdraengen") {
    const lauf = reichZustand(w).laufend.find((l) => l.pausiert && (vorhabenSicht(w, l.id)?.v.name ?? l.id) === v.finanzierung?.verdraengt);
    if (lauf) pausiere(w, lauf.id, false);
  }
  addLog(w, "ereignis", t("vorgang.log.schritt.uebergabe", { ort: provinzName(v.plaka) }), t("vorgang.log.uebergabe_warum", { n: v.wohnungen }));
}

/** Rechenschaft „War das mein Verdienst?“: Modellannahmen und beobachtete Spielwerte getrennt. */
export function rechenschaft(w: World, v: Vorgang): Rechenschaft {
  const erwartet = erwartung(v);
  const eingetreten = {
    wohnungsnot: r1(knotenIn(w, "p_wohnungsnot", v.plaka) - v.basis.wohnungsnot),
    mieten: r1(knotenIn(w, "mieten", v.plaka) - v.basis.mieten),
  };
  // Eigener Anteil (Modellannahme): der Stoß der Übergabe nach Abklingen über die Trägheit des Knotens
  const rest = (id: string, stoss: number): number => {
    if (!v.stoss) return 0;
    const i = NET.index.get(id)!;
    const d = decayVon(NET.nodes[i]!);
    const monate = Math.max(0, (w.day - v.stoss.tag) / 30.4);
    return stoss * Math.pow(1 - d, monate);
  };
  const eigen = { wohnungsnot: r1(rest("p_wohnungsnot", v.stoss?.wohnungsnot ?? 0)), mieten: r1(rest("mieten", v.stoss?.mieten ?? 0)) };
  const mitgewirkt: Rechenschaft["mitgewirkt"] = [];
  for (const id of MITWIRKENDE) {
    const vorher = v.basis.massnahmen[id];
    const jetzt = stufeIn(w, id, null);
    if (vorher !== undefined && Math.abs(jetzt - vorher) >= 5) {
      const name = NET.nodes[NET.index.get(id)!]?.name ?? id;
      mitgewirkt.push({ k: "vorgang.mit.massnahme", p: { name, von: Math.round(vorher), auf: Math.round(jetzt) } });
    }
  }
  const dg = w.economy.growth - v.basis.wachstum;
  if (Math.abs(dg) >= 1) mitgewirkt.push({ k: dg > 0 ? "vorgang.mit.konjunktur_hoch" : "vorgang.mit.konjunktur_tief", p: { pp: r1(Math.abs(dg)) } });
  for (const fall of katastrophenZustand(w).faelle) {
    if (fall.tag >= v.beschluss && fall.provinzen.includes(v.plaka) && fall.id !== v.ursprung.ref) mitgewirkt.push({ k: "vorgang.mit.katastrophe" });
  }
  const andere = Math.abs(eingetreten.wohnungsnot - eigen.wohnungsnot);
  const e = Math.abs(eigen.wohnungsnot);
  const zuordnung: Rechenschaft["zuordnung"] = e < 0.5 && andere < 0.5 ? "unsicher" : andere < 0.3 * e ? "eigen" : andere > e ? "andere" : mitgewirkt.length ? "gemischt" : "unsicher";
  const korrektur: Rechenschaft["korrektur"] = [];
  if (eingetreten.wohnungsnot > erwartet.wohnungsnot * 0.5) korrektur.push("bauabschnitt");
  if (eingetreten.mieten > -0.5) korrektur.push("mietdeckel");
  if (!korrektur.length) korrektur.push("keine");
  return { erwartet, eingetreten, eigen, mitgewirkt, zuordnung, korrektur };
}

/** Täglicher Schritt; wird monatlich mit großen Sprüngen ebenso richtig (nur Tagesdifferenzen zählen). */
export function vorgaengeSchritt(w: World): void {
  const sp = w.spiel;
  if (!sp || sp.ende) return;
  for (const v of vorgaenge(w)) {
    const seit = w.day - v.schrittSeit;
    const k = offenerKonflikt(v);
    if (k && w.day >= k.frist) {
      // Standardweg: Haushalt bzw. Kompromiss, ohne Kapital (die Ämter einigen sich selbst)
      const pk = sp.kapital;
      entscheideVorgang(w, v.id, k.art === "finanzierung" ? "haushalt" : "kompromiss");
      sp.kapital = pk;
      eintrag(w, v, "vorgang.log.standard");
      continue;
    }
    if (k) continue;
    switch (v.schritt) {
      case "planung":
        if (seit >= VORGANG.planungTage) {
          wechsle(w, v, "finanzierung");
          v.konflikte.push({ art: "finanzierung", seit: w.day, frist: w.day + VORGANG.fristTage, gegner: t("vorgang.gegner.finanzen") });
          hinweis(w, v, "finanzierung");
        }
        break;
      case "finanzierung":
        wechsle(w, v, "genehmigung");
        {
          const partei = buergermeisterPartei(w, v.plaka);
          if (!istLagerPartei(w, partei)) {
            v.konflikte.push({ art: "grundstuecke", seit: w.day, frist: w.day + VORGANG.fristTage, gegner: partei });
            hinweis(w, v, "grundstuecke");
          } else {
            eintrag(w, v, "vorgang.log.buergermeister_hilft", { partei });
          }
        }
        break;
      case "genehmigung":
        if (seit >= VORGANG.genehmigungTage) {
          v.bauTage = Math.round(v.bauTage * tempo(w, v));
          wechsle(w, v, "bau");
        }
        break;
      case "bau":
        if (seit >= v.bauTage) {
          wechsle(w, v, "uebergabe");
          uebergabe(w, v);
          wechsle(w, v, "wirkung");
          // Die Übergabe ist der Moment des Vorgangs: eine Szene, keine Aktennotiz
          sp.hinweise.push({
            id: `vorgang-uebergabe-${v.id}`,
            titel: t("vorgang.hinweis.uebergabe.titel", { ort: provinzName(v.plaka) }),
            text: [t("vorgang.hinweis.uebergabe.text", { n: v.wohnungen, ort: provinzName(v.plaka) })],
            szene: "anatolien",
          });
        }
        break;
      case "wirkung":
        if (seit >= VORGANG.wirkungTage) {
          v.rechenschaft = rechenschaft(w, v);
          wechsle(w, v, "abgeschlossen");
          sp.hinweise.push({
            id: `vorgang-rechenschaft-${v.id}`,
            titel: t("vorgang.hinweis.rechenschaft.titel", { ort: provinzName(v.plaka) }),
            text: [t(`vorgang.urteil.${v.rechenschaft.zuordnung}`), t(`vorgang.zuordnung.${v.rechenschaft.zuordnung}`)],
            szene: "anatolien",
          });
        }
        break;
      default:
        break;
    }
  }
}

/** Wie lange der laufende Schritt noch dauert (Tage, Spielparameter), solange keine Entscheidung offen ist; sonst null. */
export function restTage(w: World, v: Vorgang): number | null {
  if (offenerKonflikt(v)) return null;
  const seit = w.day - v.schrittSeit;
  const dauer = v.schritt === "planung" ? VORGANG.planungTage : v.schritt === "genehmigung" ? VORGANG.genehmigungTage : v.schritt === "bau" ? v.bauTage : v.schritt === "wirkung" ? VORGANG.wirkungTage : null;
  return dauer === null ? null : Math.max(0, dauer - seit);
}

/** Anteil des laufenden Schritts, der geschafft ist (0 bis 1). */
export function schrittAnteil(w: World, v: Vorgang): number {
  const r = restTage(w, v);
  if (r === null) return 0;
  const dauer = r + (w.day - v.schrittSeit);
  return dauer > 0 ? Math.min(1, (w.day - v.schrittSeit) / dauer) : 1;
}

/** Monatlich: fehlende Vorgänge anlegen. */
export function vorgaengeMonat(w: World): void {
  if (!w.spiel || w.spiel.ende) return;
  vorgaengeAbgleichen(w);
}

/** Korrektur nach der Rechenschaft: ein zweiter Bauabschnitt am selben Ort. */
export function zweiterAbschnitt(w: World, id: string): { ok: boolean; text: string } {
  const v = vorgangZu(w, id);
  if (!v || v.schritt !== "abgeschlossen") return { ok: false, text: t("vorgang.fehler.nichts_offen") };
  const neu = starteVorgang(w, { ursprung: { art: "frei", ref: `${v.id}-2` }, plaka: v.plaka, wohnungen: Math.round(v.wohnungen / 2), zustaendig: v.zustaendig });
  neu.begruendung = t("vorgang.begruendung.abschnitt", { ort: provinzName(v.plaka) });
  return { ok: true, text: t("vorgang.log.angelegt", { ort: provinzName(v.plaka), n: neu.wohnungen, wer: figur(w, v.zustaendig)?.name ?? "" }) };
}

export const PROVINZ_ANZAHL = PROVINCES;

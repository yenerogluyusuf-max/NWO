// Vorzeitige Enden einer Laufbahn: Putsch, Amtsenthebung, Rücktritt, Krankheit und Tod. Jedes Ende hat Warnstufen und Entscheidungen, keines kommt aus
// heiterem Himmel; das Spiel wertet keine Richtung (Putsch droht bei zerrüttetem Offiziersvertrauen, gleich ob die Politik links oder rechts steht).
//
// Rechtslage (tuerkei/INSTITUTIONEN.md, Art. 105 und 106): Die Amtsenthebung läuft über drei Hürden: Antrag mit 301 Stimmen, Untersuchung mit 360 (geheim),
// Anklage vor dem Verfassungsgericht mit 400; eine Verurteilung beendet das Amt. Wird das Amt frei, gibt es binnen 45 Tagen eine Neuwahl, bis dahin
// vertritt der Vizepräsident (im Spiel endet die Partie mit der Bilanz).
// Alle Zahlen dieser Schicht sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { clamp } from "./economy";
import { addLog } from "./log";
import { wirke } from "./wirkung";
import { AEMTER, eigenVon, hashZahl, loyalitaetVerschieben } from "./personen";
import { figur } from "./figuren";
import { ausscheiden, entlasse } from "./nachfolge";
import { beende } from "./spiel";
import { oeffne } from "./ereignisse";
import { kosten } from "./ereignis-hilfen";
import { zeitungEreignis } from "./zeitung";
import { regierungsJahre } from "./amtszeit";
import { kriege } from "./krieg";
import { t } from "../i18n";
import type { Rng } from "./rng";
import type { World } from "./types";
import type { EndenZustand } from "./spiel-typen";

export const ENDEN = {
  /** Putschrisiko: Schwellen der Warnstufen (Stufe 1 Gerücht, 2 Warnung mit Entscheidung, 3 Putschversuch möglich) */
  putschStufe1: 40,
  putschStufe2: 60,
  putschStufe3: 75,
  /** Monatschance eines Putschversuchs auf Stufe 3: Basis plus Zuschlag je Risikopunkt über der Schwelle, Deckel; Mindestabstand zweier Versuche in Tagen */
  putschVersuchBasis: 0.06,
  putschVersuchJePunkt: 0.006,
  putschVersuchMax: 0.25,
  putschAbstand: 400,
  /** Ab dieser Punktzahl gelingt der Putsch; die Punktzahl rechnet Offiziersvertrauen, Straße, Ehrgeiz und Loyalität des Generalstabs plus Zufall */
  putschErfolg: 30,
  putschRauschen: 8,
  /** Schutz nach einer Säuberung oder Einbindung der Offiziere (Tage, Abschlag auf das Risiko) */
  putschSchutzTage: 365,
  putschSchutzAbschlag: 15,
  /** Amtsenthebung: Hürden nach AY 105; Stufen brauchen eine Mindestdauer in Tagen; Chance, dass die Opposition den Antrag tatsächlich stellt */
  huerdeAntrag: 301,
  huerdeUntersuchung: 360,
  huerdeAnklage: 400,
  antragChance: 0.35,
  untersuchungTage: 45,
  anklageTage: 60,
  urteilTage: 60,
  /** Abweichler im Lager (Anteil der Lagersitze): bei einem Skandal im letzten Jahr, bei Zustimmung unter 35 Prozent, bei hoher Polarisierung */
  abweichlerSkandal: 0.05,
  abweichlerZustimmung: 0.07,
  abweichlerPolarisierung: 0.03,
  /** Wirkung von Einschwören und Zugeständnissen (Tage Schutz, die Abweichler halbieren sich) */
  schutzTage: 180,
  /**
   * Alter der Spielfigur beim Amtsantritt: gleichverteilt zwischen diesen Werten, aus dem Seed abgeleitet (Annahme des Spiels, keine Tatsachenbehauptung).
   * Das Alter läuft mit dem Spieldatum: Es ist beim Amtsantritt 47 bis 58 und steigt mit jedem Jahr.
   */
  startAlterMin: 47,
  startAlterSpanne: 12,
  /** Alterskurve der Krankheit: Das Risiko wächst mit dem Quadrat der Jahrzehnte über 50 ((Alter − 50) / 10)², bei 60 ist der Faktor 1, bei 70 vier, bei 80 neun */
  alterBasis: 50,
  /** Hinweise auf das Alter bei diesen Lebensjahren (Warnstufen: das Thema wird öffentlich, die Kronprinzen werden unruhig) */
  alterHinweise: [65, 70, 75, 80],
  /** Gesundheit: Monatschance einer ernsten Erkrankung bei Faktor 1 (Alter 60) plus Aufschlag je Regierungsjahr (Amt, wenig Schlaf), Verschweigen: Leck und Zusammenbruch je Monat */
  krankheitBasis: 0.0006,
  krankheitJeJahr: 0.02,
  leckChance: 0.12,
  zusammenbruchChance: 0.05,
  /** Beim Zusammenbruch: Anteil, der tödlich endet (sonst Amtsunfähigkeit und Rücktritt): Grundanteil plus Aufschlag je Lebensjahr über 60, Deckel */
  todAnteil: 0.35,
  todJeJahr: 0.012,
  todMax: 0.8,
  /** Genesung nach offener Behandlung (Monate) */
  genesungMonate: 3,
  /** Rücktrittsforderung: Zustimmung darunter, Abstand zweier Forderungen in Tagen */
  ruecktrittSchwelle: 33,
  ruecktrittAbstand: 365,
} as const;

/** Der Zustand der Enden-Schicht; entsteht beim ersten Zugriff (ältere Stände haben ihn nicht). */
export function endenZustand(w: World): EndenZustand {
  const sp = w.spiel!;
  sp.enden ??= {
    putsch: { risiko: 0, stufe: 0, versuche: 0 },
    amtsenthebung: { stufe: 0, gegenSitze: 0 },
    gesundheit: { zustand: "gesund" },
    ruecktritt: {},
  };
  return sp.enden;
}

const knoten = (w: World, id: string, standard = 50): number => (NET.index.has(id) ? nationalAverage(NET, w.net, id) : standard);
const lagerSitze = (w: World): number => {
  const seats = w.parliament?.seats ?? {};
  return [w.player!.partei.kurz, ...(w.spiel?.lager ?? [])].reduce((s, p) => s + (seats[p] ?? 0), 0);
};
const gesamtSitze = (w: World): number => Object.values(w.parliament?.seats ?? {}).reduce((s, x) => s + x, 0) || 600;

// ---------------------------------------------------------------------------
// Alter der Spielfigur

/**
 * Das Alter beim Amtsantritt. Maßgeblich ist das im Prolog gewählte Alter (Aussehen der Spielfigur, Stand Wahlnacht = Amtsantritt);
 * es überschreibt auch einen früher aus dem Seed gewürfelten Wert, denn der Spieler hat sein Alter gewählt. Nur ältere Stände ohne
 * gewähltes Alter behalten den gespeicherten bzw. aus dem Seed abgeleiteten Wert.
 */
export function startAlter(w: World): number {
  const z = endenZustand(w);
  const gewaehlt = w.player?.aussehen?.alter;
  if (typeof gewaehlt === "number" && Number.isFinite(gewaehlt)) return (z.startAlter = gewaehlt);
  return (z.startAlter ??= ENDEN.startAlterMin + Math.floor(hashZahl(`${w.seed}|alter`) * ENDEN.startAlterSpanne));
}

/** Das Alter des Präsidenten am Spieltag, in vollen Jahren. */
export function alterDesPraesidenten(w: World): number {
  return Math.floor(startAlter(w) + w.day / 365.25);
}

/** Faktor auf die Krankheitschance: 0 bis 50 Jahre kaum, dann quadratisch. */
export function altersFaktor(alter: number): number {
  const x = Math.max(0, alter - ENDEN.alterBasis) / 10;
  return x * x;
}

/** Monatlich: Hinweise bei den Lebensjahren 65, 70, 75 und 80; die ehrgeizigen Minister wittern ihre Chance. */
function alterMonat(w: World): void {
  const sp = w.spiel!;
  const z = endenZustand(w);
  const alter = alterDesPraesidenten(w);
  const stufe = ENDEN.alterHinweise.filter((a) => alter >= a).length;
  // Beim ersten Zugriff (neue Partie oder älterer Stand) zählt die erreichte Stufe als gemeldet: Nichts wird nachgeholt, nichts doppelt gemeldet
  const bisher = (z.alterStufe ??= stufe);
  if (stufe <= bisher) return;
  z.alterStufe = stufe;
  const jahr = ENDEN.alterHinweise[stufe - 1]!;
  for (const f of sp.figuren) {
    if (!f.imAmt || !AEMTER[f.amt].regierungsamt || f.amt === "partner") continue;
    const e = eigenVon(w, f);
    if (e.ehrgeiz >= 55) e.ehrgeiz = clamp(e.ehrgeiz + 3, 0, 100);
  }
  sp.hinweise.push({ id: `alter-${jahr}-${w.day}`, titel: t("enden.alter.titel", { alter: jahr }), szene: "istanbul", text: [t("enden.alter.text1", { alter: jahr }), t("enden.alter.text2")] });
  addLog(w, "ereignis", t("enden.alter.log", { alter: jahr }), t("enden.alter.warum"));
}

// ---------------------------------------------------------------------------
// Putsch

export interface RisikoTeil {
  name: string;
  punkte: number;
}

/** Das Putschrisiko (0 bis 100) und woraus es sich zusammensetzt; wirkt in jeder politischen Richtung gleich. */
export function putschRisiko(w: World): { risiko: number; teile: RisikoTeil[] } {
  const sp = w.spiel!;
  const z = endenZustand(w);
  const teile: RisikoTeil[] = [];
  const add = (name: string, punkte: number) => {
    if (Math.abs(punkte) >= 0.5) teile.push({ name, punkte: Math.round(punkte * 10) / 10 });
  };
  add(t("enden.risiko.offiziersvertrauen"), clamp((50 - knoten(w, "offiziersvertrauen", 45)) * 0.9, -15, 45));
  const gf = figur(w, "generalstab");
  if (gf) {
    const e = eigenVon(w, gf);
    add(t("enden.risiko.ehrgeiz"), clamp((e.ehrgeiz - 40) * 0.35, -5, 25));
    add(t("enden.risiko.loyalitaet"), clamp((50 - gf.loyalitaet) * 0.3, -8, 20));
  }
  add(t("enden.risiko.strasse"), clamp((35 - sp.umfrage.zustimmung) * 0.6, 0, 12));
  add(t("enden.risiko.legitimitaet"), clamp((40 - knoten(w, "legitimitaet", 50)) * 0.2, 0, 8));
  add(t("enden.risiko.notstand"), clamp((knoten(w, "ausnahmerecht", 30) - 60) * 0.15, 0, 6));
  if (sp.amtszeit >= 3) add(t("enden.risiko.dauerherrscher"), clamp((sp.amtszeit - 2) * 3, 0, 12));
  const verloren = kriege(w).some((k) => k.ausgang === "niederlage" && w.day - k.seit < 400);
  if (verloren) add(t("enden.risiko.krieg"), 12);
  if ((z.putsch.geschuetztBis ?? -1) > w.day) add(t("enden.risiko.schutz"), -ENDEN.putschSchutzAbschlag);
  const risiko = Math.round(clamp(teile.reduce((s, x) => s + x.punkte, 0), 0, 100));
  return { risiko, teile };
}

const stufeVon = (r: number): 0 | 1 | 2 | 3 => (r >= ENDEN.putschStufe3 ? 3 : r >= ENDEN.putschStufe2 ? 2 : r >= ENDEN.putschStufe1 ? 1 : 0);

function putschMonat(w: World, rng: Rng): void {
  const sp = w.spiel!;
  const z = endenZustand(w);
  const { risiko } = putschRisiko(w);
  const stufe = stufeVon(risiko);
  const vorher = z.putsch.stufe;
  z.putsch.risiko = risiko;
  z.putsch.stufe = stufe;
  if (stufe > vorher && stufe === 1) {
    sp.hinweise.push({ id: `putsch-geruecht-${w.day}`, titel: t("enden.putsch.geruecht.titel"), szene: "istanbul", text: [t("enden.putsch.geruecht.text1"), t("enden.putsch.geruecht.text2")] });
    addLog(w, "ereignis", t("enden.putsch.geruecht.log"), t("enden.putsch.geruecht.warum", { risiko }));
  }
  if (stufe >= 2 && (sp.zuletzt["putsch_warnung"] ?? -1e9) < w.day - 270 && !sp.ereignisse.some((e) => e.vorlage === "putsch_warnung")) {
    z.putsch.warnTag = w.day;
    oeffne(w, "putsch_warnung", rng, { daten: { risiko } });
  }
  if (stufe === 3 && (z.putsch.letzterVersuch ?? -1e9) < w.day - ENDEN.putschAbstand) {
    const p = clamp(ENDEN.putschVersuchBasis + (risiko - ENDEN.putschStufe3) * ENDEN.putschVersuchJePunkt, ENDEN.putschVersuchBasis, ENDEN.putschVersuchMax);
    if (rng.next() < p) putschVersuch(w, rng);
  }
}

/** Ein Putschversuch: Er gelingt oder scheitert nach Offiziersvertrauen, Straße und der Haltung des Generalstabs. */
export function putschVersuch(w: World, rng: Rng): "gelungen" | "gescheitert" {
  const sp = w.spiel!;
  const z = endenZustand(w);
  const gf = figur(w, "generalstab");
  const e = gf ? eigenVon(w, gf) : undefined;
  const punkte =
    0.5 * (100 - knoten(w, "offiziersvertrauen", 45)) +
    0.35 * (50 - sp.umfrage.zustimmung) +
    0.2 * (e?.ehrgeiz ?? 40) -
    0.3 * (gf?.loyalitaet ?? 50) +
    rng.normal(ENDEN.putschRauschen);
  z.putsch.versuche += 1;
  z.putsch.letzterVersuch = w.day;
  const name = w.player?.name ?? "";
  const general = gf?.name ?? t("enden.putsch.general_unbekannt");
  if (punkte >= ENDEN.putschErfolg) {
    beende(w, "putsch", t("enden.putsch.titel"), t("enden.putsch.text", { name, general }));
    return "gelungen";
  }
  // Gescheitert: Der Generalstab wird ausgetauscht, das Offizierskorps ist erschüttert, die Straße hat gesehen, wer das Land angreift.
  if (gf) ausscheiden(w, gf, t("enden.putsch.gescheitert_grund"));
  wirke(w, "offiziersvertrauen", -8);
  wirke(w, "polarisierung", 4);
  wirke(w, "legitimitaet", 2);
  z.putsch.geschuetztBis = w.day + ENDEN.putschSchutzTage;
  sp.hinweise.push({ id: `putsch-gescheitert-${w.day}`, titel: t("enden.putsch.gescheitert.titel"), szene: "istanbul", text: [t("enden.putsch.gescheitert.text1", { general }), t("enden.putsch.gescheitert.text2")] });
  sp.chronik.push({ tag: w.day, datum: w.date, titel: t("enden.putsch.gescheitert.titel"), ausgang: t("enden.putsch.gescheitert.chronik", { general }) });
  addLog(w, "ereignis", t("enden.putsch.gescheitert.titel"), t("enden.putsch.gescheitert.log"));
  zeitungEreignis(w, { art: "krise", titel: t("enden.putsch.gescheitert.titel"), fakt: t("enden.putsch.gescheitert.fakt", { general }), wertung: -1, schluessel: ["Putschversuch"] });
  return "gescheitert";
}

/** Entscheidung der Warnung: den Generalstabschef entlassen (die Gefahr wandert mit ihm, der Zorn der Offiziere bleibt). */
export function putschEntlassen(w: World): string {
  const z = endenZustand(w);
  const r = entlasse(w, "generalstab", null);
  if (!r.ok) return r.text;
  wirke(w, "offiziersvertrauen", -4);
  z.putsch.geschuetztBis = w.day + Math.round(ENDEN.putschSchutzTage / 2);
  return t("enden.putsch.warnung.entlassen_ausgang");
}

/** Entscheidung der Warnung: Offiziere einbinden (Beförderungen, Beschaffung, Gehälter) und dafür zahlen. */
export function putschEinbinden(w: World): string {
  const z = endenZustand(w);
  wirke(w, "offiziersvertrauen", 6);
  kosten(w, 0.4);
  z.putsch.geschuetztBis = w.day + ENDEN.putschSchutzTage;
  return t("enden.putsch.warnung.einbinden_ausgang");
}

// ---------------------------------------------------------------------------
// Amtsenthebung (AY 105)

/** Wie viele Abgeordnete gegen den Präsidenten stimmen würden: alle außerhalb des Lagers plus Abweichler im Lager. */
export function amtsenthebungSitze(w: World): { gegen: number; abweichler: number; lager: number; skandal: boolean } {
  const sp = w.spiel!;
  const z = endenZustand(w);
  const lager = lagerSitze(w);
  const gesamt = gesamtSitze(w);
  const skandal = ["korruptionsaffaere", "person_skandal"].some((id) => (sp.zuletzt[id] ?? -1e9) > w.day - 365);
  let anteil = 0;
  if (skandal) anteil += ENDEN.abweichlerSkandal;
  if (sp.umfrage.zustimmung < 35) anteil += ENDEN.abweichlerZustimmung;
  if (knoten(w, "polarisierung", 50) > 70) anteil += ENDEN.abweichlerPolarisierung;
  // Lange Herrschaft: Ab der dritten Amtszeit wachsen die Zweifel im eigenen Lager mit jeder weiteren (Spielparameter)
  if (sp.amtszeit >= 3) anteil += Math.min(0.06, 0.02 * (sp.amtszeit - 2));
  let abweichler = Math.round(lager * clamp(anteil, 0, 0.2));
  if ((z.amtsenthebung.schutzBis ?? -1) > w.day) abweichler = Math.round(abweichler / 2);
  return { gegen: gesamt - lager + abweichler, abweichler, lager, skandal };
}

function amtsenthebungMonat(w: World, rng: Rng): void {
  const sp = w.spiel!;
  const z = endenZustand(w);
  const a = z.amtsenthebung;
  const s = amtsenthebungSitze(w);
  a.gegenSitze = s.gegen;
  const verlaufTage = w.day - (a.verfahrenTag ?? w.day);
  if (a.stufe === 0) {
    if (s.gegen >= ENDEN.huerdeAntrag && (s.skandal || sp.umfrage.zustimmung < 38) && rng.next() < ENDEN.antragChance) {
      a.stufe = 1;
      a.seit = w.day;
      a.verfahrenTag = w.day;
      if (!sp.ereignisse.some((e) => e.vorlage === "amtsenthebung_antrag")) oeffne(w, "amtsenthebung_antrag", rng, { daten: { gegen: s.gegen, lager: s.lager } });
      addLog(w, "ereignis", t("enden.amtsenthebung.antrag.log"), t("enden.amtsenthebung.antrag.warum", { gegen: s.gegen }));
    }
    return;
  }
  if (a.stufe === 1) {
    if (s.gegen < ENDEN.huerdeAntrag) return verfahrenEnde(w, "abgeschrieben");
    if (s.gegen >= ENDEN.huerdeUntersuchung && verlaufTage >= ENDEN.untersuchungTage) {
      a.stufe = 2;
      a.seit = w.day;
      sp.hinweise.push({ id: `amtsenthebung-untersuchung-${w.day}`, titel: t("enden.amtsenthebung.untersuchung.titel"), szene: "parlament", text: [t("enden.amtsenthebung.untersuchung.text1", { gegen: s.gegen }), t("enden.amtsenthebung.untersuchung.text2")] });
      addLog(w, "ereignis", t("enden.amtsenthebung.untersuchung.titel"), t("enden.amtsenthebung.untersuchung.log", { gegen: s.gegen }));
    }
    return;
  }
  if (a.stufe === 2) {
    if (w.day - (a.seit ?? w.day) < ENDEN.anklageTage) return;
    if (s.gegen >= ENDEN.huerdeAnklage) {
      a.stufe = 3;
      a.seit = w.day;
      sp.hinweise.push({ id: `amtsenthebung-anklage-${w.day}`, titel: t("enden.amtsenthebung.anklage.titel"), szene: "parlament", text: [t("enden.amtsenthebung.anklage.text1", { gegen: s.gegen }), t("enden.amtsenthebung.anklage.text2")] });
      addLog(w, "ereignis", t("enden.amtsenthebung.anklage.titel"), t("enden.amtsenthebung.anklage.log", { gegen: s.gegen }));
    } else {
      verfahrenEnde(w, "ohne_anklage");
    }
    return;
  }
  // Stufe 3: Das Verfassungsgericht urteilt
  if (w.day - (a.seit ?? w.day) < ENDEN.urteilTage) return;
  const unabhaengig = knoten(w, "justiz_unabhaengigkeit", 45);
  const p = clamp(0.2 + (0.6 * (unabhaengig - 50)) / 50, 0.05, 0.9);
  if (rng.next() < p) {
    beende(w, "amtsenthebung", t("enden.amtsenthebung.verurteilt.titel"), t("enden.amtsenthebung.verurteilt.text", { name: w.player?.name ?? "", gegen: s.gegen }));
  } else {
    verfahrenEnde(w, "freispruch");
  }
}

function verfahrenEnde(w: World, ausgang: "abgeschrieben" | "ohne_anklage" | "freispruch"): void {
  const sp = w.spiel!;
  const a = endenZustand(w).amtsenthebung;
  a.stufe = 0;
  delete a.seit;
  delete a.verfahrenTag;
  if (ausgang === "freispruch") {
    wirke(w, "legitimitaet", 3);
    wirke(w, "polarisierung", 3);
  }
  sp.hinweise.push({ id: `amtsenthebung-ende-${w.day}`, titel: t(`enden.amtsenthebung.${ausgang}.titel`), szene: "parlament", text: [t(`enden.amtsenthebung.${ausgang}.text`)] });
  sp.chronik.push({ tag: w.day, datum: w.date, titel: t(`enden.amtsenthebung.${ausgang}.titel`), ausgang: t(`enden.amtsenthebung.${ausgang}.text`) });
  addLog(w, "ereignis", t(`enden.amtsenthebung.${ausgang}.titel`), t(`enden.amtsenthebung.${ausgang}.text`));
}

/** Entscheidung beim Antrag: die Fraktionen einschwören (kostet Kapital und Ansehen im Lager, halbiert die Abweichler). */
export function amtsenthebungEinschwoeren(w: World): string {
  const z = endenZustand(w);
  z.amtsenthebung.schutzBis = w.day + ENDEN.schutzTage;
  wirke(w, "legitimitaet", -1);
  return t("enden.amtsenthebung.antrag.einschwoeren_ausgang");
}

/** Entscheidung beim Antrag: den Partnern Zugeständnisse machen (ihre Loyalität steigt, die Abweichler halbieren sich). */
export function amtsenthebungZugestaendnisse(w: World): string {
  const sp = w.spiel!;
  const z = endenZustand(w);
  z.amtsenthebung.schutzBis = w.day + Math.round(ENDEN.schutzTage * 0.7);
  for (const f of sp.figuren) if (f.amt === "partner" && f.imAmt) loyalitaetVerschieben(f, 6);
  return t("enden.amtsenthebung.antrag.zugestaendnisse_ausgang");
}

// ---------------------------------------------------------------------------
// Gesundheit

function gesundheitMonat(w: World, rng: Rng): void {
  const sp = w.spiel!;
  const z = endenZustand(w);
  const g = z.gesundheit;
  if (g.zustand === "gesund") {
    const p = ENDEN.krankheitBasis * altersFaktor(alterDesPraesidenten(w)) * (1 + regierungsJahre(w) * ENDEN.krankheitJeJahr);
    if (rng.next() < p && !sp.ereignisse.some((e) => e.vorlage === "krankheit_praesident")) oeffne(w, "krankheit_praesident", rng, { daten: {} });
    return;
  }
  const monate = Math.round((w.day - (g.seit ?? w.day)) / 30.4);
  if (g.zustand === "krank") {
    if (monate >= ENDEN.genesungMonate) {
      g.zustand = "gesund";
      delete g.seit;
      sp.hinweise.push({ id: `gesundheit-genesen-${w.day}`, titel: t("enden.krankheit.genesen.titel"), szene: "istanbul", text: [t("enden.krankheit.genesen.text")] });
    }
    return;
  }
  // Verschwiegen: Gerüchte, dann der Zusammenbruch
  if (rng.next() < ENDEN.leckChance && !sp.hinweise.some((h) => h.id.startsWith("gesundheit-leck-"))) {
    wirke(w, "legitimitaet", -2);
    wirke(w, "vertrauen_regierung", -2);
    sp.hinweise.push({ id: `gesundheit-leck-${w.day}`, titel: t("enden.krankheit.leck.titel"), szene: "istanbul", text: [t("enden.krankheit.leck.text")] });
    addLog(w, "ereignis", t("enden.krankheit.leck.titel"), t("enden.krankheit.leck.log"));
  }
  if (rng.next() < ENDEN.zusammenbruchChance) {
    const tod = clamp(ENDEN.todAnteil + ENDEN.todJeJahr * Math.max(0, alterDesPraesidenten(w) - 60), 0, ENDEN.todMax);
    if (rng.next() < tod) beende(w, "tod", t("enden.krankheit.tod.titel"), t("enden.krankheit.tod.text", { name: w.player?.name ?? "" }));
    else beende(w, "ruecktritt", t("enden.krankheit.zusammenbruch.titel"), t("enden.krankheit.zusammenbruch.text", { name: w.player?.name ?? "" }));
  }
}

/** Entscheidung bei der Diagnose: offen sagen und sich behandeln lassen. */
export function krankheitOffen(w: World): string {
  const g = endenZustand(w).gesundheit;
  g.zustand = "krank";
  g.seit = w.day;
  wirke(w, "vertrauen_regierung", 1);
  wirke(w, "legitimitaet", -1);
  return t("enden.krankheit.offen_ausgang");
}

/** Entscheidung bei der Diagnose: verschweigen (kein Verlust heute, aber Gerüchte und Zusammenbruchsgefahr). */
export function krankheitVerschweigen(w: World): string {
  const g = endenZustand(w).gesundheit;
  g.zustand = "verschwiegen";
  g.seit = w.day;
  return t("enden.krankheit.verschweigen_ausgang");
}

/** Entscheidung bei der Diagnose: aus Gesundheitsgründen zurücktreten. */
export function krankheitAbgeben(w: World): string {
  beende(w, "ruecktritt", t("enden.krankheit.ruecktritt.titel"), t("enden.krankheit.ruecktritt.text", { name: w.player?.name ?? "" }));
  return t("enden.krankheit.abgeben_ausgang");
}

// ---------------------------------------------------------------------------
// Rücktritt

function ruecktrittMonat(w: World, rng: Rng): void {
  const sp = w.spiel!;
  const z = endenZustand(w);
  if (sp.umfrage.zustimmung >= ENDEN.ruecktrittSchwelle) return;
  if ((z.ruecktritt.gefordertTag ?? -1e9) > w.day - ENDEN.ruecktrittAbstand) return;
  const partner = sp.figuren.filter((f) => f.amt === "partner" && f.imAmt);
  const schwach = lagerSitze(w) < 330 || partner.some((f) => f.loyalitaet < 35);
  if (!schwach || sp.ereignisse.some((e) => e.vorlage === "ruecktritt_forderung")) return;
  z.ruecktritt.gefordertTag = w.day;
  oeffne(w, "ruecktritt_forderung", rng, { daten: { zustimmung: Math.round(sp.umfrage.zustimmung) } });
}

/** Entscheidung bei der Rücktrittsforderung: zurücktreten. */
export function ruecktrittErklaeren(w: World): string {
  beende(w, "ruecktritt", t("enden.ruecktritt.titel"), t("enden.ruecktritt.text", { name: w.player?.name ?? "" }));
  return t("enden.ruecktritt.erklaeren_ausgang");
}

/** Entscheidung bei der Rücktrittsforderung: durchhalten (kostet Ansehen im Lager). */
export function ruecktrittDurchhalten(w: World): string {
  const sp = w.spiel!;
  for (const f of sp.figuren) if (f.amt === "partner" && f.imAmt) loyalitaetVerschieben(f, -3);
  wirke(w, "legitimitaet", -1);
  return t("enden.ruecktritt.durchhalten_ausgang");
}

// ---------------------------------------------------------------------------
// Monatshaken

/** Monatlich aus der Spielschleife (nach amtszeitMonat): Putschrisiko, Amtsenthebung, Gesundheit, Rücktrittsforderung. */
export function endenMonat(w: World, rng: Rng): void {
  const sp = w.spiel;
  if (!sp || sp.ende) return;
  endenZustand(w);
  alterMonat(w);
  putschMonat(w, rng);
  if (sp.ende) return;
  amtsenthebungMonat(w, rng);
  if (sp.ende) return;
  gesundheitMonat(w, rng);
  if (sp.ende) return;
  ruecktrittMonat(w, rng);
}

/** Alles, was Oberfläche und Bilanz über die Enden-Schicht zeigen: Risiko mit Teilen, Verfahrensstand, Gesundheit. */
export function endenSicht(w: World): {
  putsch: { risiko: number; stufe: 0 | 1 | 2 | 3; teile: RisikoTeil[] };
  amtsenthebung: { stufe: 0 | 1 | 2 | 3; gegen: number; huerde: number };
  gesundheit: EndenZustand["gesundheit"]["zustand"];
  alter: number;
} {
  const z = endenZustand(w);
  const r = putschRisiko(w);
  const huerde = z.amtsenthebung.stufe >= 3 ? ENDEN.huerdeAnklage : z.amtsenthebung.stufe === 2 ? ENDEN.huerdeUntersuchung : ENDEN.huerdeAntrag;
  return {
    putsch: { risiko: r.risiko, stufe: stufeVon(r.risiko), teile: r.teile },
    amtsenthebung: { stufe: z.amtsenthebung.stufe, gegen: amtsenthebungSitze(w).gegen, huerde },
    gesundheit: z.gesundheit.zustand,
    alter: alterDesPraesidenten(w),
  };
}

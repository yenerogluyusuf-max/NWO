// Annexion mit Folgen (Welle 3, K5; krieg.md Schritt 9, Befunde A4 und C6; ENTSCHEIDUNGEN AA 1).
//
// Innen: Die Region wird eine eigene türkische Provinz (sim/provinzen-neu.ts). Außen: ein Vorgang in Stufen nach dem Muster der Krim 2014.
//   1. Sicherheitsrat: Entwurf, die Annexion für nichtig zu erklären; jedes ständige Mitglied kann ihn mit seinem Veto aufhalten.
//   2. Generalversammlung: Stimmen aus den Beziehungen der Staaten zur Türkei und zum früheren Souverän, Vergleich Krim 100:11:58 und Oblaste
//      2022 143:5:35 (data/annexion.ts).
//   3. Sanktionen der EU und der USA in vier Stufen (März, Juli, September, Dezember), mit dem IWF-Band als Obergrenze.
// Der Weg „Annexion mit Zustimmung“ (Hatay 1939): eine Abtretung per Friedensvertrag (Friedenstisch, K4).
// Ein Satellitenstaat (TRNZ-Muster) bringt nur den Sicherheitsrat (Vorbild SR 541 und 550, 1983/84), keine Sanktionen.
//
// Alles, was die Akte vor dem Klick zeigt, kommt aus `annexionVorschau`; dieselben Funktionen buchen beim Klick.
// Dieses Modul importiert sim/besatzung.ts nicht (Ladezyklus); es liest `spiel.besatzung` direkt.

import { ANNEXION_TAGE, NATO_OPFER, GV_VERGLEICH, SANKTIONS_STUFEN, SANKTION_TRAEGER, SR, UN_MITGLIEDER, VERTRAG, GANZER_STAAT } from "../data/annexion";
import { FORM } from "../data/besatzung";
import { REGION_NACH_ID, REGIONEN } from "../data/schauplaetze";
import { WELT_NACH_ID } from "../data/welt-daten";
import { WEITERE_NACH_ID } from "../data/welt-weitere";
import type { AnnexionsVorgang, BesatzungsGebiet, UnAbstimmung } from "./krieg-typen";
import { AKTEUR_IDS, beziehungZurTuerkei, paarVon, weltModell } from "./welt-modell";
// Nur in Funktionen benutzt: sim/diplomatie.ts liest seinerseits `annexionsLast` (der Zyklus ist zur Ladezeit unschädlich)
import { SANKTION_LAST } from "./diplomatie";
import { landAendern, landSicht } from "./laender";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { netz } from "./ereignis-hilfen";
import { addDays } from "./dates";
import { ablehnungAus, eingliederungTage, einnahmenMonat, einwohnerAnteil, naechstePlaka, neueProvinzVon, provinzAnlegen, provinzAufloesen, sitzePrognose, wahlberechtigte } from "./provinzen-neu";
import { t, zahl } from "../i18n";
import type { World } from "./types";

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
const r1 = (x: number): number => Math.round(x * 10) / 10;

/** Sofortfolgen einer Annexion (Spielparameter, Werte vor K5 übernommen): Netz, Land, EU, USA, Widerstand. */
export const ANNEXION_SOFORT = {
  netz: { beziehungen_eu: -6, nationalisten: 4, konservative: 1, staedtische_saekulare: -2 } as Record<string, number>,
  land: { vertrauen: -25, konflikt: 20 },
  eu: { konflikt: 15, vertrauen: -8 },
  usa: { konflikt: 8, vertrauen: -5 },
  widerstand: 15,
  /** Ansehen je Ja-Stimme der Generalversammlung (Anteil an 193); Krim-Ergebnis 100 Ja ergibt rund −3 */
  gvAnsehen: 6,
  /** Ein angenommener Beschluss des Sicherheitsrats (wie SR 541): Ansehen, und die Träger ziehen stärker mit */
  srAnsehen: 2,
  srTraeger: 0.2,
  /** Ein Veto hält den Beschluss auf, kostet aber auch Ansehen (die Welt sah den Entwurf) */
  vetoAnsehen: 0.5,
  /** Höchstens so viel Last aus allen Annexionen zusammen (Faktor auf die oberste Stufe; Spielparameter) */
  deckel: 1.5,
};

/**
 * Die Sofortfolgen einer Annexion, wie `annektiere` sie bucht (K4: der Friedenstisch zeigt sie vor dem Klick aus derselben Rechnung und
 * bucht sie nicht selbst). Ein Vertrag nach einem Angriff auf die Türkei kostet ein Viertel, ein erzwungener Vertrag wie eine Annexion.
 */
export function annexionSofortWerte(opts: { vertrag?: boolean; angriff?: boolean } = {}): { ansehen: number; netz: Record<string, number>; land: { vertrauen: number; konflikt: number }; eu: { konflikt: number; vertrauen: number }; usa: { konflikt: number; vertrauen: number }; ohneUn: boolean } {
  const ohneUn = !!opts.vertrag && !(opts.angriff ?? true);
  const f = ohneUn ? 0.25 : 1;
  const S = ANNEXION_SOFORT;
  return {
    ansehen: ohneUn ? -1 : FORM.annexion.ansehenWechsel,
    netz: Object.fromEntries(Object.entries(S.netz).map(([k, d]) => [k, k === "nationalisten" || k === "konservative" ? d : d * f])),
    land: { vertrauen: S.land.vertrauen * f, konflikt: S.land.konflikt * f },
    eu: { konflikt: S.eu.konflikt * f, vertrauen: S.eu.vertrauen * f },
    usa: { konflikt: S.usa.konflikt * f, vertrauen: S.usa.vertrauen * f },
    ohneUn,
  };
}

export const annexionen = (w: World): AnnexionsVorgang[] => w.spiel?.annexionen ?? [];
export const laufendeAnnexion = (w: World, landId: string): AnnexionsVorgang | undefined => annexionen(w).find((a) => a.land === landId && a.art === "annexion" && a.stufeMax >= 0 && !istBeendet(w, a));

function istBeendet(w: World, a: AnnexionsVorgang): boolean {
  const besetzt = w.spiel?.besatzung ?? [];
  return !a.regionen.some((id) => besetzt.some((b) => b.region === id && b.form === a.art));
}

// ---------------------------------------------------------------------------
// Abstimmungen

const EU_STAATEN = 27;
const istEuMitglied = (id: string): boolean => id === "GRC" || id === "CYP" || WEITERE_NACH_ID.get(id)?.anker?.id === "EU";
const lagerVon = (id: string): string | undefined => WELT_NACH_ID.get(id)?.lager ?? WEITERE_NACH_ID.get(id)?.lager;

/** Wie ein Staat stimmt (Spielparameter): Gegner der Türkei, Freunde des Opfers und der Westen (Norm der territorialen Unversehrtheit) stimmen dafür. */
function haltung(w: World, id: string, opfer: string, mild: boolean, euOpfer: boolean): number {
  const bz = beziehungZurTuerkei(w, id);
  const nah = id === "EU" ? 50 : paarVon(w, id, opfer).buendnis;
  const lager = lagerVon(id);
  let s = 0.5 * (bz.konflikt - bz.vertrauen) + 0.3 * nah + (lager === "west" ? 15 : 0) + (lager === "turk" ? -25 : 0);
  if (euOpfer && (id === "EU" || istEuMitglied(id))) s += 15;
  if (mild) s -= 20;
  return s;
}
const stimmeAus = (s: number): "ja" | "nein" | "enth" => (s >= 0 ? "ja" : s <= -30 ? "nein" : "enth");

/** Wie der Rest der Welt (nicht einzeln geführte Staaten) stimmt: zwischen Krim und Oblaste, je nach Schwere; das Ansehen der Türkei verschiebt. */
function restAnteile(w: World, schwer: number, mild: boolean): { ja: number; nein: number; enth: number; abwesend: number } {
  const k = GV_VERGLEICH.krim, o = GV_VERGLEICH.oblaste;
  const mix = (a: number, b: number) => (a + (b - a) * schwer) / UN_MITGLIEDER;
  let ja = mix(k.ja, o.ja), nein = mix(k.nein, o.nein), enth = mix(k.enth, o.enth);
  const abwesend = mix(k.abwesend, o.abwesend);
  // Ansehen 50 ist neutral; höheres Ansehen zieht Ja-Stimmen in die Enthaltung (Spielparameter)
  const verschiebung = clamp((netz(w, "ansehen") - 50) / 100, -0.3, 0.3) * ja + (mild ? (1 - VERTRAG.gvFaktorJa) * ja : 0);
  ja -= verschiebung;
  enth += verschiebung;
  return { ja, nein, enth, abwesend };
}

/** Die Generalversammlung: einzeln geführte Staaten nach ihrer Haltung, der Rest nach dem Muster; die Türkei stimmt dagegen. */
export function gvAbstimmung(w: World, opfer: string, mild = false): UnAbstimmung {
  const euOpfer = istEuMitglied(opfer);
  const schwer = euOpfer || GANZER_STAAT.has(opfer) ? 1 : 0;
  const z = { ja: 0, nein: 1, enth: 0, abwesend: 0 };
  let gezaehlt = 1;
  let euGefuehrt = 0;
  for (const id of AKTEUR_IDS) {
    if (id === "EU") continue;
    if (istEuMitglied(id)) euGefuehrt += 1;
    const v = id === opfer ? (mild ? "enth" : "ja") : stimmeAus(haltung(w, id, opfer, mild, euOpfer));
    z[v] += 1;
    gezaehlt += 1;
  }
  // Die übrigen EU-Staaten stimmen wie die Union
  const euRest = EU_STAATEN - euGefuehrt;
  z[stimmeAus(haltung(w, "EU", opfer, mild, euOpfer))] += euRest;
  gezaehlt += euRest;
  const rest = UN_MITGLIEDER - gezaehlt;
  const a = restAnteile(w, schwer, mild);
  const summe = a.ja + a.nein + a.enth + a.abwesend;
  const ja = Math.round((rest * a.ja) / summe), nein = Math.round((rest * a.nein) / summe), enth = Math.round((rest * a.enth) / summe);
  z.ja += ja;
  z.nein += nein;
  z.enth += enth;
  z.abwesend += rest - ja - nein - enth;
  return { tag: w.day, ja: z.ja, nein: z.nein, enth: z.enth, abwesend: z.abwesend, angenommen: z.ja > z.nein };
}

/** Der Sicherheitsrat: fünf ständige Mitglieder nach ihrer Haltung (Veto bei Nein), zehn gewählte nach dem Muster des Rests der Welt. */
export function srAbstimmung(w: World, opfer: string, mild = false): UnAbstimmung {
  const euOpfer = istEuMitglied(opfer);
  let ja = 0, nein = 0, enth = 0;
  const veto: string[] = [];
  for (const id of SR.staendig) {
    const v = stimmeAus(haltung(w, id, opfer, mild, euOpfer));
    if (v === "ja") ja += 1;
    else if (v === "nein") { nein += 1; veto.push(id); }
    else enth += 1;
  }
  const a = restAnteile(w, euOpfer || GANZER_STAAT.has(opfer) ? 1 : 0, mild);
  const anwesend = a.ja + a.nein + a.enth;
  const gja = Math.round((SR.gewaehlt * a.ja) / anwesend);
  const gnein = Math.round((SR.gewaehlt * a.nein) / anwesend);
  ja += gja;
  nein += gnein;
  enth += SR.gewaehlt - gja - gnein;
  return { tag: w.day, ja, nein, enth, veto, angenommen: ja >= SR.noetig && veto.length === 0 };
}

// ---------------------------------------------------------------------------
// Sanktionen

/** Wer mitzieht, nach der Annexion (Konflikt nach dem Sofortschock): EU und USA mit ihrem Anteil an der vollen Wirkung. */
export function traegerNach(w: World, opfer: string, mitSchock = true): Record<string, number> {
  const out: Record<string, number> = {};
  const eu = (landSicht(w, "EU")?.konflikt ?? 45) + (mitSchock ? ANNEXION_SOFORT.eu.konflikt : 0);
  const usa = (landSicht(w, "USA")?.konflikt ?? 45) + (mitSchock ? ANNEXION_SOFORT.usa.konflikt : 0);
  if (istEuMitglied(opfer) || eu >= SANKTION_TRAEGER.EU.konfliktAb) out["EU"] = SANKTION_TRAEGER.EU.anteil;
  if (NATO_OPFER.has(opfer) || usa >= SANKTION_TRAEGER.USA.konfliktAb) out["USA"] = SANKTION_TRAEGER.USA.anteil;
  return out;
}

const traegerSumme = (tr: Record<string, number> | undefined): number => clamp(Object.values(tr ?? {}).reduce((s, x) => s + x, 0), 0, 1);

/** Höchste Stufe: Satellit und Vertrag nach einem Angriff auf die Türkei ohne Sanktionen; erzwungener Vertrag höchstens Stufe 1. */
function stufeMaxFuer(art: AnnexionsVorgang["art"], vertrag: boolean, angriff: boolean): number {
  if (art === "satellit") return 0;
  if (vertrag) return angriff ? VERTRAG.stufeMaxBeiAngriff : 0;
  return SANKTIONS_STUFEN.length;
}

/**
 * Die Last aller laufenden Annexionen auf Märkte und Nachfrage (sim/diplomatie.ts, `sanktionsLast`): je Land die Stufe mal die Träger, über
 * alle Länder gedeckelt. Läuft die EU-Handelssanktion schon, zählt ihr Teil nicht doppelt.
 */
export function annexionsLast(w: World): { risiko: number; nachfrage: number } {
  // Läuft die EU-Handelssanktion (sim/diplomatie.ts), steckt ihr Teil schon dort (nur lesen: legt keinen Außenzustand an)
  const euHandel = weltModell(w).aussen?.sanktionen.some((s) => s.id === "eu_handel") ? SANKTION_LAST.eu_handel : undefined;
  let risiko = 0, nachfrage = 0;
  for (const a of annexionen(w)) {
    if (a.stufe <= 0 || istBeendet(w, a)) continue;
    const s = SANKTIONS_STUFEN[a.stufe - 1]!;
    const eu = a.traeger?.["EU"] ?? 0;
    const rest = traegerSumme(a.traeger) - eu;
    risiko += s.risiko * rest + Math.max(0, s.risiko * eu - (euHandel?.risiko ?? 0));
    nachfrage += s.nachfrage * rest + Math.max(0, s.nachfrage * eu - (euHandel?.nachfrage ?? 0));
  }
  const oben = SANKTIONS_STUFEN[SANKTIONS_STUFEN.length - 1]!;
  return { risiko: Math.min(risiko, oben.risiko * ANNEXION_SOFORT.deckel), nachfrage: Math.min(nachfrage, oben.nachfrage * ANNEXION_SOFORT.deckel) };
}

// ---------------------------------------------------------------------------
// Vorschau und Beschluss

export interface AnnexionsVorschau {
  plaka: number;
  einwohner: number;
  wahlberechtigte: number;
  sitze: number;
  eingliederungJahre: number;
  eingliederungTage: number;
  ablehnung: number;
  widerstandSprung: number;
  /** Ansehen sofort (ohne die Abstimmungen) */
  ansehen: number;
  /** Kosten und Steuern im ersten Jahr in % des BIP (Dienste und Sicherheit nach data/besatzung.ts) */
  kostenJahr: number;
  einnahmenJahr: number;
  sr?: UnAbstimmung;
  gv?: UnAbstimmung;
  traeger: Record<string, number>;
  stufen: { stufe: number; datum: string; risiko: number; nachfrage: number }[];
  vertrag: boolean;
  /** Folge: der ganze Staat wäre annektiert */
  ganzerStaat: boolean;
  /** Läuft schon ein Vorgang mit diesem Land, kommen keine neuen Abstimmungen */
  schonLaufend: boolean;
}

/** Was eine Annexion jetzt brächte (dieselben Funktionen wie der Beschluss). */
export function annexionVorschau(w: World, b: BesatzungsGebiet, opts: { vertrag?: boolean; angriff?: boolean } = {}): AnnexionsVorschau {
  const vertrag = !!opts.vertrag;
  const angriff = opts.angriff ?? true;
  const widerstand = clamp(b.widerstand + ANNEXION_SOFORT.widerstand, 0, 100);
  const tage = eingliederungTage(widerstand);
  const plaka = neueProvinzVon(w, b.region)?.plaka ?? naechstePlaka(w);
  const ew = regionEinwohner(b.region);
  const p = { plaka, einwohner: ew, ablehnung: ablehnungAus(widerstand) };
  const laufend = laufendeAnnexion(w, b.land);
  const mild = vertrag && angriff;
  const ohneUn = vertrag && !angriff;
  const stufeMax = stufeMaxFuer("annexion", vertrag, angriff);
  const traeger = laufend?.traeger ?? (stufeMax > 0 ? traegerNach(w, b.land) : {});
  const anteil = traegerSumme(traeger);
  const sr = laufend || ohneUn ? undefined : srAbstimmung(w, b.land, mild);
  const traegerMitSr = sr?.angenommen && anteil > 0 ? clamp(anteil + ANNEXION_SOFORT.srTraeger, 0, 1) : anteil;
  const stufen = SANKTIONS_STUFEN.slice(0, laufend ? 0 : stufeMax).map((s, i) => ({ stufe: i + 1, datum: addDays(w.date, s.tag), risiko: r1(s.risiko * traegerMitSr), nachfrage: r1(s.nachfrage * traegerMitSr) }));
  const dienstJahr = FORM.annexion.dienstJeKopf * einwohnerAnteil(ew) * 100;
  const ganzerStaat = GANZER_STAAT.has(b.land) && wirdGanz(w, b);
  return {
    plaka, einwohner: ew, wahlberechtigte: wahlberechtigte(p), sitze: sitzePrognose(w, p),
    eingliederungJahre: Math.round((tage / 365) * 10) / 10, eingliederungTage: tage, ablehnung: p.ablehnung,
    widerstandSprung: widerstand - b.widerstand,
    ansehen: ohneUn ? -1 : FORM.annexion.ansehenWechsel,
    kostenJahr: FORM.annexion.sicherheitMonat * 12 + dienstJahr,
    einnahmenJahr: einnahmenMonat(b.land, ew, Math.min(1, 365 / Math.max(1, tage)) / 2) * 12,
    ...(sr ? { sr } : {}),
    ...(laufend || ohneUn ? {} : { gv: gvAbstimmung(w, b.land, mild) }),
    traeger,
    stufen, vertrag, ganzerStaat, schonLaufend: !!laufend,
  };
}

function regionEinwohner(id: string): number {
  // Ohne Import der Regionendaten über sim/besatzung.ts: die Zahl steht in data/schauplaetze.ts
  return REGION_EW.get(id) ?? 0;
}
const REGION_EW = new Map(REGIONEN.map((r) => [r.id, r.einwohner?.zahl ?? 0] as const));

function wirdGanz(w: World, b: BesatzungsGebiet): boolean {
  const s = REGION_NACH_ID[b.region]?.schauplatz;
  const alle = REGIONEN.filter((r) => r.schauplatz === s);
  const besetzt = w.spiel?.besatzung ?? [];
  return alle.every((r) => r.id === b.region || besetzt.some((x) => x.region === r.id && x.form === "annexion"));
}

/**
 * Die Annexion beschließen (die Form ist schon gesetzt, das Kapital bezahlt): Sofortfolgen, neue Provinz, Vorgang mit Abstimmungen und
 * Sanktionsstufen. Mit `vertrag` (Abtretung per Friedensvertrag) ist es der Hatay-Weg.
 */
export function annektiere(w: World, b: BesatzungsGebiet, opts: { vertrag?: boolean; angriff?: boolean } = {}): void {
  const sp = w.spiel;
  if (!sp) return;
  const vertrag = !!opts.vertrag;
  const angriff = opts.angriff ?? true;
  const name = t(`krieg.region.${b.region}`);
  b.form = "annexion";
  b.formSeit = w.day;
  // Wer mitzieht, steht wie in der Vorschau vor dem Schock fest (Konflikt nach dem Schock gerechnet)
  const traeger = traegerNach(w, b.land);
  // Sofortfolgen: Ein erzwungener Vertrag kostet wie eine Annexion, ein Vertrag nach einem Angriff auf die Türkei fast nichts
  // (K4: aus annexionSofortWerte, dieselbe Rechnung zeigt der Friedenstisch vor dem Klick)
  const s = annexionSofortWerte({ vertrag, angriff });
  const ohneUn = s.ohneUn;
  wirke(w, "ansehen", s.ansehen);
  for (const [knoten, d] of Object.entries(s.netz)) wirke(w, knoten, d);
  landAendern(w, b.land, s.land, t("krieg.besatzung.grund_annexion", { region: name }));
  landAendern(w, "EU", s.eu, t("krieg.besatzung.grund_annexion", { region: name }));
  landAendern(w, "USA", s.usa, t("krieg.besatzung.grund_annexion", { region: name }));
  b.widerstand = clamp(b.widerstand + ANNEXION_SOFORT.widerstand * (ohneUn ? 0.5 : 1), 0, 100);
  const p = provinzAnlegen(w, { region: b.region, land: b.land, widerstand: b.widerstand, vertrag });
  b.plaka = p.plaka;
  // Ein laufender Vorgang mit demselben Land nimmt die Region auf (keine neuen Abstimmungen, die Sanktionen laufen weiter)
  const laufend = laufendeAnnexion(w, b.land);
  if (laufend) {
    if (!laufend.regionen.includes(b.region)) laufend.regionen.push(b.region);
  } else {
    const stufeMax = stufeMaxFuer("annexion", vertrag, angriff);
    (sp.annexionen ??= []).push({
      id: `ann-${b.land}-${w.day}`, land: b.land, regionen: [b.region], art: "annexion", seit: w.day, stufe: 0, stufeMax,
      ...(vertrag ? { vertrag: true as const } : {}), ...(vertrag && angriff ? { angriff: true as const } : {}),
      ...(stufeMax > 0 ? { traeger } : {}),
      ...(ohneUn ? { sr: { tag: w.day, ja: 0, nein: 0, enth: 0, angenommen: false }, gv: { tag: w.day, ja: 0, nein: 0, enth: 0, angenommen: false } } : {}),
    });
  }
  const text = t(vertrag ? "welle_k5.annexion.vertrag" : "welle_k5.annexion.beschluss", { region: name, plaka: p.plaka });
  sp.hinweise.push({ id: `k5-annexion-${b.region}-${w.day}`, titel: t("welle_k5.annexion.titel", { region: name, plaka: p.plaka }), text: [text], szene: "parlament" });
  sp.chronik.push({ tag: w.day, datum: w.date, titel: t("welle_k5.annexion.titel", { region: name, plaka: p.plaka }), ausgang: text, presse: { sparte: "welt", wertung: ohneUn ? 0.4 : -0.5 } });
  addLog(w, "entscheidung", t("welle_k5.annexion.titel", { region: name, plaka: p.plaka }), text);
}

/** Ein Satellitenstaat wird ausgerufen: nur von der Türkei anerkannt; der Sicherheitsrat stimmt ab (Vorbild SR 541, 13:1:1). */
export function satellitAusrufen(w: World, b: BesatzungsGebiet): void {
  const sp = w.spiel;
  if (!sp) return;
  const da = annexionen(w).find((a) => a.land === b.land && a.art === "satellit" && !istBeendet(w, a));
  if (da) {
    if (!da.regionen.includes(b.region)) da.regionen.push(b.region);
    return;
  }
  (sp.annexionen ??= []).push({ id: `sat-${b.land}-${w.day}`, land: b.land, regionen: [b.region], art: "satellit", seit: w.day, stufe: 0, stufeMax: 0 });
}

/** Eine annektierte Region geht verloren (Rückgabe, Rückeroberung, Aufstand, anderer Form): Die Provinz wird aufgelöst. */
export function provinzVerloren(w: World, b: BesatzungsGebiet, grund: string): void {
  const p = provinzAufloesen(w, b.region);
  delete b.plaka;
  if (!p || !w.spiel) return;
  const name = t(`krieg.region.${b.region}`);
  const text = t(`welle_k5.provinz.verloren.${grund === "rueckeroberung" || grund === "aufstand" ? grund : "rueckgabe"}`, { region: name, plaka: p.plaka });
  w.spiel.chronik.push({ tag: w.day, datum: w.date, titel: t("welle_k5.provinz.verloren.titel", { region: name, plaka: p.plaka }), ausgang: text, presse: { sparte: "welt", wertung: grund === "rueckgabe" || grund === "vertrag" ? 0.2 : -0.6 } });
  addLog(w, "ereignis", t("welle_k5.provinz.verloren.titel", { region: name, plaka: p.plaka }), text);
}

// ---------------------------------------------------------------------------
// Täglich: Sicherheitsrat, Generalversammlung, Sanktionsstufen

export function annexionTag(w: World): void {
  const sp = w.spiel;
  if (!sp?.annexionen?.length) return;
  for (const a of sp.annexionen) {
    if (istBeendet(w, a)) continue;
    const tage = w.day - a.seit;
    const mild = !!(a.vertrag && a.angriff);
    if (!a.sr && tage >= ANNEXION_TAGE.sr) {
      a.sr = srAbstimmung(w, a.land, mild);
      if (a.sr.angenommen) {
        wirke(w, "ansehen", -ANNEXION_SOFORT.srAnsehen);
        if (a.traeger) for (const k of Object.keys(a.traeger)) a.traeger[k] = clamp(a.traeger[k]! + ANNEXION_SOFORT.srTraeger * a.traeger[k]! / Math.max(traegerSumme(a.traeger), 1e-9), 0, 1);
      } else if (a.sr.veto?.length) wirke(w, "ansehen", -ANNEXION_SOFORT.vetoAnsehen);
      melde(w, a, "sr", a.sr);
    }
    if (a.art === "annexion" && !a.gv && tage >= ANNEXION_TAGE.gv) {
      a.gv = gvAbstimmung(w, a.land, mild);
      wirke(w, "ansehen", -ANNEXION_SOFORT.gvAnsehen * (a.gv.ja / UN_MITGLIEDER));
      melde(w, a, "gv", a.gv);
    }
    while (a.stufe < a.stufeMax && tage >= SANKTIONS_STUFEN[a.stufe]!.tag) {
      // Die neue Stufe wirkt sofort an den Märkten; der Monatsabschluss (sim/diplomatie.ts) rechnet die Summe danach neu
      const vor = annexionsLast(w);
      a.stufe += 1;
      const nach = annexionsLast(w);
      const l = w.economy.sanktionsLast ?? { risiko: 0, nachfrage: 0 };
      w.economy.sanktionsLast = { risiko: l.risiko + nach.risiko - vor.risiko, nachfrage: l.nachfrage + nach.nachfrage - vor.nachfrage };
      meldeStufe(w, a);
    }
  }
}

function melde(w: World, a: AnnexionsVorgang, organ: "sr" | "gv", s: UnAbstimmung): void {
  const sp = w.spiel!;
  const regionen = a.regionen.map((id) => t(`krieg.region.${id}`)).join(", ");
  const veto = (s.veto ?? []).map((id) => t(`welle_k5.p5.${id}`)).join(", ");
  const schluessel = organ === "gv" ? "welle_k5.un.gv" : a.art === "satellit" ? "welle_k5.un.sr_satellit" : s.angenommen ? "welle_k5.un.sr_an" : "welle_k5.un.sr_veto";
  const text = t(`${schluessel}.text`, { regionen, ja: s.ja, nein: s.nein, enth: s.enth, abwesend: s.abwesend ?? 0, veto, krim: `${GV_VERGLEICH.krim.ja}:${GV_VERGLEICH.krim.nein}:${GV_VERGLEICH.krim.enth}` });
  const titel = t(`${schluessel}.titel`, { ja: s.ja, nein: s.nein, enth: s.enth });
  sp.hinweise.push({ id: `k5-${organ}-${a.id}`, titel, text: [text], szene: "presse" });
  sp.chronik.push({ tag: w.day, datum: w.date, titel, ausgang: text, presse: { sparte: "welt", wertung: -0.6 } });
  addLog(w, "ereignis", titel, text);
}

function meldeStufe(w: World, a: AnnexionsVorgang): void {
  const sp = w.spiel!;
  const s = SANKTIONS_STUFEN[a.stufe - 1]!;
  const anteil = traegerSumme(a.traeger);
  const wer = Object.keys(a.traeger ?? {}).map((k) => t(`welle_k5.traeger.${k}`)).join(" und ");
  const titel = t("welle_k5.sanktion.titel", { stufe: a.stufe, wer: wer || t("welle_k5.traeger.keiner") });
  const text = t(`welle_k5.sanktion.stufe${a.stufe}`, { risiko: zahl(Math.round(s.risiko * anteil), 0), nachfrage: zahl(r1(s.nachfrage * anteil), 1) });
  sp.hinweise.push({ id: `k5-sanktion-${a.id}-${a.stufe}`, titel, text: [text], szene: "bank" });
  sp.chronik.push({ tag: w.day, datum: w.date, titel, ausgang: text, presse: { sparte: "welt", wertung: -0.7 } });
  addLog(w, "ereignis", titel, text);
}

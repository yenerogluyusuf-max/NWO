// Amtszeiten: Beginn, Umbildung nach der Wiederwahl, Ziele der neuen Amtszeit, Müdigkeit, Kronprinzen und Nachfolge in der letzten Amtszeit.
//
// Rechtslage (tuerkei/INSTITUTIONEN.md): Vizepräsidenten und Minister ernennt und entlässt der Präsident frei, ohne Parlament (AY 106). Umbildungen kosten
// daher keine Stimmen, nur Kapital, Beziehungen und Ansehen. Zwei Amtszeiten sind die Regel (AY 101); wer in der zweiten Amtszeit ist, kandidiert
// nicht mehr: Sein Lager stellt einen Nachfolger.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { clamp } from "./economy";
import { addLog } from "./log";
import { addDays } from "./dates";
import { Rng } from "./rng";
import { wirke } from "./wirkung";
import { AEMTER, eigenVon, hashZahl, loyalitaetVerschieben, merke } from "./personen";
import { besetzeNeu, figur, neuerName } from "./figuren";
import { entlasse, kandidatenFuer } from "./nachfolge";
import { zielDef, zielStand } from "./ziele";
import { zusageAnlegen } from "./ereignis-hilfen";
import { kannZahlen } from "./kapital";
import { PARTEI_NAME } from "./fraktionen";
import { verfassungAktiv } from "./verfassung";
import { akuteProbleme } from "./bilanz";
import { oeffne } from "./ereignisse";
import { SPIEL } from "./spiel";
import { DAUER, dauerStufe, dauerherrscherBeginn } from "./dauerherrscher";
import { parlamentNachtragPruefen } from "./wahl";
import { ministeriumAnPartei } from "./ressortvergabe";
import { msg, t, tIn } from "../i18n";
import type { World } from "./types";
import type { Aspirant, AmtszeitStart, Figur, NachfolgeZustand, UmbildungZustand } from "./spiel-typen";

export const AMTSZEIT = {
  /** Anteil der Regierungsmüdigkeit früherer Amtszeiten, der in die nächste mitgeht (die Wahl erneuert den Auftrag, der Verschleiß bleibt zum Teil) */
  uebertrag: 0.6,
  /**
   * Höchstzahl der mitgetragenen Müdigkeitsmonate: Der Verschleiß früherer Amtszeiten wächst nicht ins Unendliche (sonst wäre die dritte Wahl allein deshalb verloren).
   * Der Wert von 36 Monaten entspricht dem, was die zweite Amtszeit (0,6 von 60 Monaten) schon mitträgt; die Kosten langer Herrschaft tragen danach
   * Ehrgeiz, Legitimität, Straße und Ausland (sim/dauerherrscher.ts), nicht eine ins Unendliche wachsende Müdigkeit. Spielparameter.
   */
  uebertragMax: 36,
  /** Dauer des Umbildungsfensters in Tagen */
  umbildungTage: 60,
  /** Anteil der Ernennungskosten im Umbildungsfenster */
  kostenAnteil: 0.5,
  /** Kosten einer Versetzung (Kapital) und Abschlag auf die Fähigkeit im fremden Ressort */
  versetzungPk: 2,
  versetzungAbschlag: 12,
  /** Ein Partner bekommt ein Ministerium: Kapital, Loyalität des neuen Ministers */
  partnerPk: 2,
  /** Bis zu so vielen Tagen nach dem Wahltag wird ein älterer Spielstand ohne diese Struktur nachträglich bedient */
  nachholenTage: 365,
  /** Wann der Präsident den Nachfolger küren muss: Tage vor der letzten Wahl */
  kuerVorherTage: 548,
  /** Frist der Entscheidung (Tage) */
  kuerFrist: 60,
  /** Monatliche Verschiebung in der letzten Amtszeit: Ehrgeizige Minister lösen sich langsam vom Präsidenten */
  lameDuckLoyalitaet: -0.15,
  lameDuckEhrgeiz: 0.4,
  /** Wahrscheinlichkeit, dass ein übergangener Anwärter als Rivale antritt, mal Ehrgeiz/100 */
  abtruennigBasis: 0.5,
  abtruennigOffen: 0.2,
  /** Anspruch einer Partnerpartei auf Ministerien: Sitzanteil im Lager mal Zahl der Ministerien, aufgerundet ab diesem Anteil */
  anspruchSchwelle: 0.12,
} as const;

/**
 * Wie viele Amtszeiten die Verfassung erlaubt: zwei (Standard, AY 101), drei („Weitere Wiederwahl“) oder keine Grenze („unbegrenzt“, Infinity).
 * Der Wert wird nie gespeichert (JSON kennt kein Infinity); wer ihn braucht, rechnet ihn aus dem Verfassungsartikel.
 */
export const maxAmtszeiten = (w: World): number => {
  const v = verfassungAktiv(w, "amtszeit");
  return v === "unbegrenzt" ? Infinity : v === "wiederwahl_plus" ? 3 : 2;
};

/** Ob die Verfassung die Zahl der Amtszeiten begrenzt (nur dann gibt es eine letzte Amtszeit, Kronprinzen und den Nachfolger-Wahlkampf). */
export const amtszeitBegrenzt = (w: World): boolean => Number.isFinite(maxAmtszeiten(w));

/**
 * Länge einer Amtszeit in Jahren: fünf (Standard, AY 101), vier oder sieben nach dem Artikel „amtszeitlaenge“. Eine geänderte Länge gilt ab der nächsten
 * Amtszeit; die laufende bleibt, wie sie begonnen hat (Spielparameter: Vier und sieben Jahre sind Annahmen des Spiels, keine Tatsachenbehauptung).
 */
export function amtszeitJahre(w: World): number {
  const v = verfassungAktiv(w, "amtszeitlaenge");
  return v === "jahre_4" ? 4 : v === "jahre_7" ? 7 : SPIEL.amtszeitJahre;
}

// ---------------------------------------------------------------------------
// Amtszeitbeginn und Müdigkeit

function momentaufnahme(w: World): AmtszeitStart["start"] {
  return {
    inflation: w.published.inflation.value,
    arbeitslosigkeit: w.economy.unemployment,
    wachstum: w.economy.growth,
    schulden: w.economy.debtRatio,
    vertrauen: nationalAverage(NET, w.net, "vertrauen_regierung"),
    akut: akuteProbleme(w),
    datum: w.date,
  };
}

/** Beginn jeder Amtszeit. Ältere Spielstände haben nur die erste ab Tag 0; spätere Beginne werden aus dem Wahltag abgeleitet. */
export function amtszeitStarts(w: World): AmtszeitStart[] {
  const sp = w.spiel!;
  if (sp.amtszeiten?.length) return sp.amtszeiten;
  const liste: AmtszeitStart[] = [{ nr: 1, tag: 0, datum: sp.start.datum, zustimmung: w.player?.wahl.anteil ?? sp.umfrage.zustimmung, start: sp.start }];
  for (let n = 2; n <= sp.amtszeit; n++) {
    const tag = Math.max(0, sp.wahltag - (365 * SPIEL.amtszeitJahre + 1) * (sp.amtszeit - n + 1));
    liste.push({ nr: n, tag, datum: addDays(w.date, tag - w.day), zustimmung: sp.umfrage.zustimmung, start: momentaufnahme(w) });
  }
  sp.amtszeiten = liste;
  return liste;
}

export const aktuelleAmtszeit = (w: World): AmtszeitStart => {
  const st = amtszeitStarts(w);
  return st[st.length - 1]!;
};

/** Monate Regierungsmüdigkeit: Die erste Amtszeit zählt ab Tag 0; in einer späteren zählt nur ein Teil des Verschleißes früherer Amtszeiten weiter. */
export function muedigkeitsMonate(w: World, monate: number): number {
  const a = aktuelleAmtszeit(w);
  if (a.nr <= 1) return monate;
  const s = a.tag / 30.4;
  if (monate <= s) return monate;
  // Der Verschleiß früherer Amtszeiten geht begrenzt mit; die Dauerherrschaft kostet je Stufe zusätzlich (sim/dauerherrscher.ts)
  return Math.min(AMTSZEIT.uebertragMax, AMTSZEIT.uebertrag * s) + (monate - s) + DAUER.muedigkeitMonate * dauerStufe(w);
}

/** Jahre im Amt in dieser Amtszeit plus der mitgetragene Teil früherer (für die Krisenhäufigkeit mit dem Regierungsalter). */
export function regierungsJahre(w: World): number {
  return muedigkeitsMonate(w, w.day / 30.4) / 12;
}

/** Der Anteil des Präsidenten bei der vorigen Wahl, an dem das Parlament seine Verschiebung misst. */
export function wahlBezugsAnteil(w: World): number {
  const h = w.spiel?.wahl?.historie ?? [];
  const letzte = h[h.length - 1];
  return letzte?.runden[0]?.anteile.amt ?? w.player?.wahl.anteil ?? 50;
}

// ---------------------------------------------------------------------------
// Beginn der neuen Amtszeit

const MINISTER: Figur["amt"][] = ["finanzen", "inneres", "aussen", "stab", "justiz", "generalstab", "wirtschaft"];

export const ministerAemter = (w: World): Figur[] => (w.spiel?.figuren ?? []).filter((f) => MINISTER.includes(f.amt) && f.imAmt);

/** Wirkung des Wahlergebnisses auf Loyalität und Ehrgeiz: Ein klarer Sieg stärkt den Präsidenten, ein knapper weckt Begehrlichkeiten. */
function ergebnisEffekte(w: World): void {
  const e = w.spiel?.wahl?.historie[w.spiel.wahl.historie.length - 1];
  if (!e) return;
  const marge = e.marge;
  const klar = marge >= 12;
  const knapp = marge < 3;
  for (const f of ministerAemter(w)) {
    const eigen = eigenVon(w, f);
    loyalitaetVerschieben(f, klar ? 4 : knapp ? -2 : 1);
    eigen.ehrgeiz = clamp(eigen.ehrgeiz + (klar ? -2 : knapp ? 4 : 1), 0, 100);
    if (knapp && eigen.ehrgeiz >= 70) eigen.groll = clamp(eigen.groll + 2, 0, 100);
  }
}

/**
 * Eine neue Amtszeit beginnt (nach der Wiederwahl) oder wird nachträglich ergänzt (ein älterer Spielstand kurz nach der Wiederwahl).
 * Friert die Ziele der abgelaufenen Amtszeit ein, öffnet Umbildungsfenster und Zielwahl, setzt den Müdigkeitszähler und bereitet in der letzten Amtszeit die Nachfolge vor.
 */
export function beginneAmtszeit(w: World, nr: number, anlass: UmbildungZustand["anlass"]): void {
  const sp = w.spiel!;
  amtszeitStarts(w);
  sp.zielArchiv ??= [];
  if (!sp.zielArchiv.some((a) => a.amtszeit === nr - 1)) {
    sp.zielArchiv.push({ amtszeit: nr - 1, ziele: zielStand(w).map((z) => ({ titel: z.def.titel, erreicht: z.erreicht, stand: z.stand })) });
  }
  if (anlass === "wiederwahl") {
    sp.amtszeiten!.push({ nr, tag: w.day, datum: w.date, zustimmung: sp.umfrage.zustimmung, start: momentaufnahme(w) });
    sp.amtszeit = nr;
    sp.wahltag = w.day + 365 * amtszeitJahre(w) + 1;
    ergebnisEffekte(w);
  }
  sp.ziele = [];
  sp.zielwahl = { amtszeit: nr, offen: true };
  sp.umbildung = { seit: w.day, bis: w.day + AMTSZEIT.umbildungTage, anlass, entschieden: {} };
  const letzte = nr >= maxAmtszeiten(w);
  if (letzte) sp.nachfolge = { aspiranten: kronprinzen(w) };
  else delete sp.nachfolge;
  if (nr > 2 && !letzte) dauerherrscherBeginn(w, nr);
  sp.chronik.push({ tag: w.day, datum: w.date, titel: t("amtszeit.chronik.beginn", { nr }), ausgang: letzte ? t("amtszeit.chronik.beginn_letzte") : nr > 2 ? t("amtszeit.chronik.beginn_dauer", { nr }) : t("amtszeit.chronik.beginn_text") });
  addLog(w, "ereignis", t("amtszeit.log.beginn", { nr }), letzte ? t("amtszeit.log.letzte") : t("amtszeit.log.warum", { tage: AMTSZEIT.umbildungTage }));
}

/** Ältere Spielstände nach der ersten Wiederwahl (ohne diese Struktur) bekommen Umbildung und Zielwahl einmalig nachgereicht. */
export function nachholen(w: World): void {
  const sp = w.spiel;
  // Solange die Frage nach der nachträglichen Parlamentswahl offen ist (sim/wahl.ts), warten Umbildung und Zielwahl auf die Antwort; die Frage
  // wird hier zuerst geprüft, damit sie nie hinter dem Nachholen zurückbleibt
  if (sp && !sp.ende) parlamentNachtragPruefen(w);
  if (sp?.wahl?.nachtrag?.status === "frage") return;
  if (!sp || sp.ende || sp.amtszeit < 2 || sp.umbildung || sp.zielArchiv?.some((a) => a.amtszeit === sp.amtszeit - 1) || sp.zielwahl) return;
  const a = aktuelleAmtszeit(w);
  if (a.nr < 2 || w.day - a.tag > AMTSZEIT.nachholenTage) return;
  beginneAmtszeit(w, a.nr, "nachgereicht");
}

// ---------------------------------------------------------------------------
// Ziele der neuen Amtszeit

/** Die Ziele der Amtszeit setzen (höchstens drei); die Zielwahl ist damit beantwortet. */
export function waehleZieleAmtszeit(w: World, ids: string[]): void {
  const sp = w.spiel;
  if (!sp) return;
  sp.ziele = ids.filter((id) => zielDef(id)).slice(0, 3);
  sp.zielwahl = { amtszeit: sp.amtszeit, offen: false };
  addLog(w, "entscheidung", t("amtszeit.log.ziele", { ziele: sp.ziele.map((id) => zielDef(id)!.titel).join(", ") || t("amtszeit.log.keine") }), t("amtszeit.log.ziele_warum"));
}

// ---------------------------------------------------------------------------
// Umbildung

export interface UmbildungMinister {
  amt: Figur["amt"];
  name: string;
  rolle: string;
  weiblich: boolean;
  loyalitaet: number;
  faehigkeit: number;
  ehrgeiz: number;
  groll: number;
  kommissarisch: boolean;
  entschieden?: "behalten" | "ersetzt" | "versetzt" | "entlassen";
  kandidaten: { id: string; name: string; herkunft: string; staerke: string; schwaeche: string; faehigkeit: number; ehrgeiz: number; loyalitaet: number; pk: number }[];
}

export interface PartnerAnspruch {
  partei: string;
  name: string;
  sitze: number;
  /** Ministerien, die die Partei nach ihrem Gewicht im Lager erwartet */
  anspruch: number;
  vergeben: number;
}

export interface UmbildungSicht {
  offen: boolean;
  anlass: UmbildungZustand["anlass"];
  tageBisEnde: number;
  minister: UmbildungMinister[];
  partner: PartnerAnspruch[];
  rabatt: number;
}

/** Wie viele Ministerien eine Partnerpartei nach ihrem Sitzanteil im Lager erwartet. */
export function partnerAnsprueche(w: World): PartnerAnspruch[] {
  const sp = w.spiel!;
  const sitze = w.parliament?.seats ?? {};
  const lager = sp.lager;
  const lagerSitze = [w.player!.partei.kurz, ...lager].reduce((s, p) => s + (sitze[p] ?? 0), 0) || 1;
  const vergebenJe = sp.umbildung?.partnerVergeben ?? {};
  return lager.map((p) => {
    const anteil = (sitze[p] ?? 0) / lagerSitze;
    const anspruch = anteil >= AMTSZEIT.anspruchSchwelle ? Math.max(1, Math.round(anteil * MINISTER.length)) : 0;
    return { partei: p, name: PARTEI_NAME[p] ?? p, sitze: sitze[p] ?? 0, anspruch, vergeben: vergebenJe[p] ?? 0 };
  });
}

export function umbildungSicht(w: World): UmbildungSicht | null {
  const sp = w.spiel;
  const u = sp?.umbildung;
  if (!sp || !u) return null;
  return {
    offen: !u.abgeschlossen && w.day <= u.bis,
    anlass: u.anlass,
    tageBisEnde: Math.max(0, u.bis - w.day),
    minister: ministerAemter(w).map((f) => {
      const e = eigenVon(w, f);
      const entschieden = u.entschieden[f.amt];
      return {
        amt: f.amt,
        name: f.name,
        rolle: f.rolle,
        weiblich: !!f.weiblich,
        loyalitaet: Math.round(f.loyalitaet),
        faehigkeit: Math.round(e.faehigkeit),
        ehrgeiz: Math.round(e.ehrgeiz),
        groll: Math.round(e.groll),
        kommissarisch: !!e.kommissarisch,
        ...(entschieden ? { entschieden } : {}),
        kandidaten: kandidatenFuer(w, f.amt).map((k) => ({ id: k.id, name: k.name, herkunft: k.herkunft, staerke: k.staerke, schwaeche: k.schwaeche, faehigkeit: k.faehigkeit, ehrgeiz: k.ehrgeiz, loyalitaet: k.loyalitaet, pk: Math.max(1, Math.round(k.pk * AMTSZEIT.kostenAnteil)) })),
      };
    }),
    partner: partnerAnsprueche(w).filter((p) => p.anspruch > 0),
    rabatt: AMTSZEIT.kostenAnteil,
  };
}

export interface UmbildungErgebnis {
  ok: boolean;
  text: string;
}

function fenster(w: World): UmbildungZustand | null {
  const u = w.spiel?.umbildung;
  return u && !u.abgeschlossen && w.day <= u.bis ? u : null;
}

/** Das Regierungsmitglied im Amt bestätigen: kostet nichts, stärkt die Loyalität leicht. */
export function umbildungBehalten(w: World, amt: Figur["amt"]): UmbildungErgebnis {
  const u = fenster(w);
  const f = figur(w, amt);
  if (!u || !f || !MINISTER.includes(amt)) return { ok: false, text: t("umbildung.fehler.kein_fenster") };
  loyalitaetVerschieben(f, 3);
  eigenVon(w, f).ehrgeiz = clamp(eigenVon(w, f).ehrgeiz - 2, 0, 100);
  merke(w, f, t("umbildung.erinnerung.bestaetigt"));
  u.entschieden[amt] = "behalten";
  addLog(w, "entscheidung", t("umbildung.log.behalten", { name: f.name, rolle: f.rolle }), t("umbildung.log.behalten_warum"));
  return { ok: true, text: t("umbildung.ok.behalten", { name: f.name }) };
}

/** Das Amt neu besetzen (Kandidat aus dem Pool): die Kosten liegen im Fenster bei der Hälfte. */
export function umbildungErsetzen(w: World, amt: Figur["amt"], kandidatId: string): UmbildungErgebnis {
  const u = fenster(w);
  const sp = w.spiel!;
  if (!u || !MINISTER.includes(amt)) return { ok: false, text: t("umbildung.fehler.kein_fenster") };
  const k = kandidatenFuer(w, amt).find((x) => x.id === kandidatId);
  if (!k) return { ok: false, text: t("umbildung.fehler.kein_kandidat") };
  const rabatt = Math.floor(k.pk * (1 - AMTSZEIT.kostenAnteil));
  sp.kapital += rabatt;
  const r = entlasse(w, amt, kandidatId);
  if (!r.ok) {
    sp.kapital -= rabatt;
    return { ok: false, text: r.text };
  }
  u.entschieden[amt] = "ersetzt";
  return { ok: true, text: r.text };
}

/** Ein Regierungsmitglied wird kommissarisch ersetzt (ohne Kandidatenwahl, um Kapital zu sparen). */
export function umbildungEntlassen(w: World, amt: Figur["amt"]): UmbildungErgebnis {
  const u = fenster(w);
  const sp = w.spiel!;
  if (!u || !MINISTER.includes(amt)) return { ok: false, text: t("umbildung.fehler.kein_fenster") };
  const rabatt = 1;
  sp.kapital += rabatt;
  const r = entlasse(w, amt, null);
  if (!r.ok) {
    sp.kapital -= rabatt;
    return { ok: false, text: r.text };
  }
  u.entschieden[amt] = "entlassen";
  return { ok: true, text: r.text };
}

/** Zwei Regierungsmitglieder tauschen die Ressorts: Beide arbeiten sich ein und sind im fremden Ressort schwächer. */
export function umbildungVersetzen(w: World, amtA: Figur["amt"], amtB: Figur["amt"]): UmbildungErgebnis {
  const u = fenster(w);
  const sp = w.spiel!;
  const a = figur(w, amtA);
  const b = figur(w, amtB);
  if (!u || !a || !b || amtA === amtB || !MINISTER.includes(amtA) || !MINISTER.includes(amtB)) return { ok: false, text: t("umbildung.fehler.kein_fenster") };
  if (!kannZahlen(sp.kapital, AMTSZEIT.versetzungPk)) return { ok: false, text: t("umbildung.fehler.kapital", { pk: AMTSZEIT.versetzungPk, vorhanden: Math.floor(sp.kapital) }) };
  sp.kapital -= AMTSZEIT.versetzungPk;
  const ea = eigenVon(w, a);
  const eb = eigenVon(w, b);
  // Person, Profil und Erinnerung wechseln das Ressort; Rolle und Aufgabe bleiben am Amt
  const tausche = <K extends keyof Figur>(k: K) => {
    const x = a[k];
    a[k] = b[k];
    b[k] = x;
  };
  tausche("name");
  tausche("weiblich");
  tausche("loyalitaet");
  tausche("eigen");
  const nameA = b.name;
  const nameB = a.name;
  for (const [f, vor] of [[a, ea], [b, eb]] as const) {
    const e = eigenVon(w, f);
    e.faehigkeit = clamp(vor.faehigkeit - AMTSZEIT.versetzungAbschlag, 20, 100);
    e.einarbeitungBis = w.day + 60;
    e.lager = AEMTER[f.amt].lager;
    e.seit = w.day;
    merke(w, f, t("umbildung.erinnerung.versetzt"));
  }
  u.entschieden[amtA] = "versetzt";
  u.entschieden[amtB] = "versetzt";
  addLog(w, "entscheidung", t("umbildung.log.versetzt", { a: nameB, b: nameA, ressortA: AEMTER[amtB].ressort, ressortB: AEMTER[amtA].ressort }), t("umbildung.log.versetzt_warum"));
  return { ok: true, text: t("umbildung.ok.versetzt", { a: nameB, ressortA: AEMTER[amtB].ressort, b: nameA, ressortB: AEMTER[amtA].ressort }) };
}

/** Ein Ministerium geht an eine Partnerpartei im Lager: Der neue Minister kommt aus ihren Reihen. */
export function umbildungPartner(w: World, amt: Figur["amt"], partei: string): UmbildungErgebnis {
  const u = fenster(w);
  const sp = w.spiel!;
  const f = figur(w, amt);
  const anspruch = partnerAnsprueche(w).find((p) => p.partei === partei);
  if (!u || !f || !anspruch || !MINISTER.includes(amt)) return { ok: false, text: t("umbildung.fehler.kein_fenster") };
  if (!kannZahlen(sp.kapital, AMTSZEIT.partnerPk)) return { ok: false, text: t("umbildung.fehler.kapital", { pk: AMTSZEIT.partnerPk, vorhanden: Math.floor(sp.kapital) }) };
  sp.kapital -= AMTSZEIT.partnerPk;
  const r = ministeriumAnPartei(w, amt, partei);
  if (!r.ok) {
    sp.kapital += AMTSZEIT.partnerPk;
    return r;
  }
  u.partnerVergeben ??= {};
  u.partnerVergeben[partei] = (u.partnerVergeben[partei] ?? 0) + 1;
  u.entschieden[amt] = "ersetzt";
  return { ok: true, text: t("umbildung.ok.partner", { partei: PARTEI_NAME[partei] ?? partei, ressort: AEMTER[amt].ressort }) };
}

/** Das Fenster schließen: Unerfüllte Ansprüche der Partner werden zu Zusagen mit Frist. */
export function umbildungAbschliessen(w: World): void {
  const sp = w.spiel;
  const u = sp?.umbildung;
  if (!sp || !u || u.abgeschlossen) return;
  u.abgeschlossen = true;
  for (const p of partnerAnsprueche(w)) {
    const fehlt = p.anspruch - p.vergeben;
    if (fehlt <= 0) continue;
    zusageAnlegen(w, { von: p.partei, text: tIn("de", "umbildung.zusage", { partei: p.name, n: fehlt }), msg: msg("umbildung.zusage", { partei: p.name, n: fehlt }), tage: 120 });
  }
  addLog(w, "ereignis", t("umbildung.log.abgeschlossen"), t("umbildung.log.abgeschlossen_warum"));
}

// ---------------------------------------------------------------------------
// Letzte Amtszeit: Kronprinzen und Nachfolge

/** Zwei bis drei Anwärter aus dem Kabinett: Stärke aus Fähigkeit, Rückhalt und Ehrgeiz; gewählt wird nach Stärke und Ehrgeiz zusammen. */
export function kronprinzen(w: World): Aspirant[] {
  const sp = w.spiel!;
  const liste = ministerAemter(w)
    .filter((f) => !eigenVon(w, f).kommissarisch)
    .map((f): Aspirant => {
      const e = eigenVon(w, f);
      return {
        amt: f.amt,
        name: f.name,
        ...(f.weiblich !== undefined ? { weiblich: f.weiblich } : {}),
        staerke: Math.round(0.55 * e.faehigkeit + 0.25 * f.loyalitaet + 0.2 * e.ehrgeiz),
        ehrgeiz: Math.round(e.ehrgeiz),
        rolle: f.rolle,
      };
    })
    .sort((a, b) => b.staerke + b.ehrgeiz - (a.staerke + a.ehrgeiz));
  void sp;
  return liste.slice(0, 3);
}

export function nachfolgeZustand(w: World): NachfolgeZustand | undefined {
  const sp = w.spiel;
  if (!sp || sp.amtszeit < maxAmtszeiten(w)) return undefined;
  return (sp.nachfolge ??= { aspiranten: kronprinzen(w) });
}

/** Tage bis zur letzten Wahl, ab denen der Präsident den Nachfolger küren muss. */
export const kuerFaellig = (w: World): boolean => {
  const sp = w.spiel;
  return !!sp && sp.amtszeit >= maxAmtszeiten(w) && sp.wahltag - w.day <= AMTSZEIT.kuerVorherTage;
};

/**
 * Den Nachfolger küren oder die Partei entscheiden lassen. Wer übergangen wird und ehrgeizig ist, verliert Rückhalt und tritt vielleicht als Rivale an;
 * der gekürte Nachfolger wird Kandidat des Lagers in der letzten Wahl.
 */
export function kuereNachfolger(w: World, wahl: Figur["amt"] | "offen"): UmbildungErgebnis {
  const sp = w.spiel;
  const n = nachfolgeZustand(w);
  if (!sp || !n) return { ok: false, text: t("nachfolge.fehler") };
  if (n.gekuert) return { ok: false, text: t("nachfolge.schon") };
  if (!n.aspiranten.length) n.aspiranten = kronprinzen(w);
  let gewaehlt: Aspirant | undefined;
  if (wahl === "offen") {
    const gesamt = n.aspiranten.reduce((s, a) => s + a.staerke, 0) || 1;
    let r = hashZahl(`${w.seed}|kuer|${w.day}`) * gesamt;
    gewaehlt = n.aspiranten.find((a) => (r -= a.staerke) <= 0) ?? n.aspiranten[0];
  } else {
    gewaehlt = n.aspiranten.find((a) => a.amt === wahl);
  }
  if (!gewaehlt) return { ok: false, text: t("nachfolge.fehler") };
  n.gekuert = wahl;
  n.nachfolger = gewaehlt;
  n.tag = w.day;
  const f = figur(w, gewaehlt.amt);
  if (f && wahl !== "offen") loyalitaetVerschieben(f, 8);
  // Übergangene Anwärter: Groll und Loyalitätsverlust, nach Ehrgeiz
  let rivale: Aspirant | undefined;
  for (const a of n.aspiranten) {
    if (a.amt === gewaehlt.amt) continue;
    const fx = figur(w, a.amt);
    if (!fx) continue;
    const e = eigenVon(w, fx);
    if (a.ehrgeiz >= 65) {
      e.groll = clamp(e.groll + (wahl === "offen" ? 4 : 10), 0, 100);
      loyalitaetVerschieben(fx, wahl === "offen" ? -2 : -6);
    }
    const p = (wahl === "offen" ? AMTSZEIT.abtruennigOffen : AMTSZEIT.abtruennigBasis) * (a.ehrgeiz / 100);
    if (a.ehrgeiz >= 70 && hashZahl(`${w.seed}|abtr|${a.amt}|${w.day}`) < p && (!rivale || a.ehrgeiz > rivale.ehrgeiz)) rivale = a;
  }
  if (rivale) n.abtruenniger = rivale;
  addLog(w, "entscheidung", t(wahl === "offen" ? "nachfolge.log.offen" : "nachfolge.log.gekuert", { name: gewaehlt.name, rolle: gewaehlt.rolle }), rivale ? t("nachfolge.log.rivale", { name: rivale.name }) : t("nachfolge.log.ruhig"));
  sp.chronik.push({ tag: w.day, datum: w.date, titel: t("nachfolge.chronik"), ausgang: t("nachfolge.chronik_text", { name: gewaehlt.name, rolle: gewaehlt.rolle, rivale: rivale?.name ?? "", hatRivale: rivale ? "ja" : "nein" }) });
  return { ok: true, text: rivale ? t("nachfolge.ok_rivale", { name: gewaehlt.name, rivale: rivale.name }) : t("nachfolge.ok", { name: gewaehlt.name }) };
}

// ---------------------------------------------------------------------------
// Regelwechsel: Die Verfassung lockert die Grenze mitten in der letzten Amtszeit

/**
 * Wird die Amtszeitgrenze gelockert („Weitere Wiederwahl“, „unbegrenzt“), solange eine Nachfolge vorbereitet wird, entfällt diese: Der Präsident darf
 * wieder antreten. Die Kür, das offene Kür-Ereignis und die Nachfolge-Rolle im Wahlkampf werden zurückgenommen. Der Haken ist träge (monatlich und beim
 * Wahlkampftag), damit die Verfassung die Amtszeit nicht importieren muss.
 */
export function regelPruefen(w: World): void {
  const sp = w.spiel;
  if (!sp || sp.ende) return;
  if (sp.amtszeit >= maxAmtszeiten(w)) return;
  if (sp.nachfolge) {
    const name = sp.nachfolge.nachfolger?.name;
    delete sp.nachfolge;
    sp.ereignisse = sp.ereignisse.filter((e) => e.vorlage !== "nachfolge_kuer");
    sp.chronik.push({ tag: w.day, datum: w.date, titel: t("amtszeit.regel.titel"), ausgang: t("amtszeit.regel.chronik", { hatName: name ? "ja" : "nein", name: name ?? "" }) });
    addLog(w, "ereignis", t("amtszeit.regel.titel"), t("amtszeit.regel.log"));
  }
  const k = sp.wahlkampf;
  if (k && k.rolle === "nachfolger") k.rolle = "amt";
}

// ---------------------------------------------------------------------------
// Monatshaken

/** Monatlich: Spielstände nachholen, in der letzten Amtszeit lösen sich ehrgeizige Minister, und die Nachfolgefrage kommt auf den Tisch. */
export function amtszeitMonat(w: World, rng: Rng): void {
  const sp = w.spiel;
  if (!sp || sp.ende) return;
  nachholen(w);
  regelPruefen(w);
  if (sp.umbildung && !sp.umbildung.abgeschlossen && w.day > sp.umbildung.bis) umbildungAbschliessen(w);
  if (sp.amtszeit < maxAmtszeiten(w)) return;
  const n = nachfolgeZustand(w)!;
  for (const f of ministerAemter(w)) {
    const e = eigenVon(w, f);
    if (n.nachfolger?.amt === f.amt) continue;
    if (e.ehrgeiz > 60) {
      loyalitaetVerschieben(f, AMTSZEIT.lameDuckLoyalitaet);
      e.ehrgeiz = clamp(e.ehrgeiz + AMTSZEIT.lameDuckEhrgeiz * 0.1, 0, 100);
    }
  }
  if (!n.gekuert && kuerFaellig(w) && !sp.ereignisse.some((x) => x.vorlage === "nachfolge_kuer") && (sp.zuletzt["nachfolge_kuer"] ?? -1e9) < w.day - 365) {
    n.aspiranten = kronprinzen(w);
    oeffne(w, "nachfolge_kuer", rng, { daten: {} });
  }
}

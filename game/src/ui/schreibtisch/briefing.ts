// Das Tagesbriefing des Schreibtischs: Lage in einem Blick, was fällig ist, wovor das Spiel warnt, was der Beraterstab rät, was ansteht.
// Alles wird aus dem Weltzustand berechnet; nichts davon ist Text auf Vorrat. Jeder Eintrag führt zu einer Entscheidung
// (eine Akte, eine Maßnahme, ein Gespräch), damit der Schreibtisch nie nur Anzeige ist.

import { NET } from "../../sim/modell";
import { nationalAverage } from "../../sim/netz";
import { formatDateDe, addDays } from "../../sim/dates";
import { vorlage } from "../../sim/ereignisse";
import { stimmenSicht, stufeIn, REGELN } from "../../sim/handeln";
import { kapitalEinkommen, SPIEL } from "../../sim/spiel";
import { fraktionsUebersicht } from "../../sim/verhandeln";
import { waehlerLage } from "../../sim/waehler";
import { anrede, figur } from "../../sim/figuren";
import { naechsterSchritt, schrittMitProgramm } from "../../sim/programme";
import { akuteProbleme, vorschlaege as berechneVorschlaege, type Vorschlag } from "../../sim/vorschlaege";
import { handlungsHebel } from "../../sim/wege";
import { reichZustand } from "../../sim/reich";
import { ERBE_NACH_ID } from "../../data/erbe";
import { haltungWort, dimensionZu } from "../../sim/laender";
import { LAENDER, aktionenFuer } from "../../sim/laender";
import type { Theme } from "../../data/politiknetz";
import type { World } from "../../sim/types";

/** Wohin ein Eintrag führt. Die Bühne übersetzt das in ein Fenster. */
export type Ziel =
  | { art: "akte"; akte: "wirtschaft" | "entscheidungen" | "parlament" | "waehler" | "welt" | "personen" | "chronik" | "programme" | "beschluesse" | "bereiche" | "reich_kultur" | "reich_recht" | "reich_militaer" | "reich_infra" | "reich_haushalt" }
  | { art: "politik"; theme?: Theme; massnahme?: { id: string; level?: number; ort?: number[] | null } }
  | { art: "ereignis"; id: string }
  | { art: "land"; id: string };

/** Was ein Knopf tut: hingehen oder gleich handeln. */
export type Knopf =
  | { art: "gehe"; label: string; ziel: Ziel }
  | { art: "einbringen"; label: string; vorschlag: Vorschlag }
  | { art: "gespraech"; label: string; partei: string; pk: number };

export type Ton = "gut" | "schlecht" | "neutral";

export interface Kennzahl {
  id: string;
  label: string;
  wert: string;
  zusatz: string;
  trend: "auf" | "ab" | "gleich";
  ton: Ton;
  ziel: Ziel;
}

export interface Faellig {
  id: string;
  art: "ereignis" | "gesetz" | "zusage" | "schritt" | "duldung";
  titel: string;
  /** Tage bis zur Frist; undefined = ohne feste Frist */
  tage?: number;
  dringend: boolean;
  unter: string;
  knopf: Knopf;
}

export interface Warnung {
  id: string;
  stufe: "rot" | "gelb";
  text: string;
  warum: string;
  ziel: Ziel;
}

export interface Empfehlung {
  id: string;
  /** Wer rät: Rolle im Beraterstab */
  rat: string;
  /** Name der Person, wenn es sie im Spiel gibt */
  wer?: string;
  titel: string;
  /** Die Begründung, aus der Lage berechnet */
  text: string;
  /** Was es kostet, in Worten */
  kosten?: string;
  knoepfe: Knopf[];
  gewicht: number;
}

export interface Termin {
  id: string;
  tage: number;
  datum: string;
  text: string;
  ziel?: Ziel;
}

export interface Briefing {
  datum: string;
  amtszeit: { nummer: number; wahltag: string; monateBisWahl: number };
  kennzahlen: Kennzahl[];
  faellig: Faellig[];
  warnungen: Warnung[];
  empfehlungen: Empfehlung[];
  termine: Termin[];
}

const nf = (x: number, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const pl = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`;
const tageWort = (t: number) => (t <= 0 ? "heute" : t === 1 ? "morgen" : `in ${t} Tagen`);
const monateBis = (tage: number) => Math.max(0, Math.round(tage / 30.4));

const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

/** Fester Kalender des Staatsjahres: Monat, ab welchem Jahr, und die Ereignisvorlage, die dort entsteht (siehe `ereignisse-innen.ts`). */
export const KALENDER: { id: string; vorlage: string; monat: number; abJahr: number; nurJahr?: number; text: (jahr: number) => string; ziel?: Ziel }[] = [
  { id: "haushalt", vorlage: "haushaltsjahr", monat: 10, abJahr: 2028, text: (j) => `Haushaltsentwurf für ${j + 1} vom Finanzminister`, ziel: { art: "akte", akte: "entscheidungen" } },
  { id: "mindestlohn", vorlage: "mindestlohn", monat: 12, abJahr: 2026, text: (j) => `Mindestlohn für ${j + 1} wird festgelegt`, ziel: { art: "politik", theme: "arbeit" } },
  { id: "kommunal", vorlage: "kommunalwahl", monat: 3, abJahr: 2029, nurJahr: 2029, text: () => "Kommunalwahlen: der erste Stimmungstest", ziel: { art: "akte", akte: "waehler" } },
];

/** Tage von heute bis zum ersten Tag des nächsten Auftretens von Monat/Jahr (mindestens ab `abJahr`), nie in der Vergangenheit. */
export function tageBisMonat(world: World, monat: number, abJahr: number, nurJahr?: number): { tage: number; jahr: number } | null {
  const [j, m] = world.date.split("-").map(Number) as [number, number];
  for (let jahr = Math.max(j, abJahr); jahr <= (nurJahr ?? j + 2); jahr++) {
    if (nurJahr !== undefined && jahr !== nurJahr) continue;
    const ziel = `${jahr}-${String(monat).padStart(2, "0")}-01`;
    const tage = Math.round((Date.parse(ziel) - Date.parse(world.date)) / 86_400_000);
    // Im laufenden Monat gilt der Termin noch als „läuft“, wenn das Ereignis erst entsteht
    const imMonat = jahr === j && monat === m;
    if (tage >= 0 || imMonat) return { tage: Math.max(0, tage), jahr };
  }
  return null;
}

export function kennzahlen(world: World): Kennzahl[] {
  const spiel = world.spiel;
  if (!spiel) return [];
  const z = spiel.umfrage.zustimmung;
  const vor = spiel.umfrage.verlauf.length > 3 ? spiel.umfrage.verlauf[spiel.umfrage.verlauf.length - 4]!.wert : undefined;
  const dz = vor === undefined ? 0 : z - vor;
  const einkommen = kapitalEinkommen(world);
  const stimmen = stimmenSicht(world);
  const mehrheit = stimmen.lager + stimmen.duldungSitze;
  const infl = world.published.inflation.value;
  const dInfl = infl - spiel.start.inflation;
  const arbeitslos = world.published.unemployment.value;
  const dArbeit = arbeitslos - spiel.start.arbeitslosigkeit;
  const akut = akuteProbleme(world).length;
  const dAkut = akut - spiel.start.akut;
  const trend = (d: number, schwelle = 0.5): Kennzahl["trend"] => (d > schwelle ? "auf" : d < -schwelle ? "ab" : "gleich");
  return [
    {
      id: "zustimmung",
      label: "Zustimmung",
      wert: `${Math.round(z)} %`,
      zusatz: vor === undefined ? "Wahlanteil beim Amtsantritt" : `vor drei Monaten ${Math.round(vor)} %`,
      trend: trend(dz, 0.7),
      ton: z >= 50 ? "gut" : z < 35 ? "schlecht" : "neutral",
      ziel: { art: "akte", akte: "waehler" },
    },
    {
      id: "kapital",
      label: "Politisches Kapital",
      wert: `${Math.floor(spiel.kapital)}`,
      zusatz: `${einkommen.summe >= 0 ? "+" : "−"}${nf(Math.abs(einkommen.summe))} im Monat`,
      trend: "gleich",
      ton: spiel.kapital < 0 ? "schlecht" : spiel.kapital < 8 ? "schlecht" : "neutral",
      ziel: { art: "akte", akte: "bereiche" },
    },
    {
      id: "mehrheit",
      label: "Mehrheit",
      wert: `${mehrheit} Sitze`,
      zusatz: stimmen.luecke > 0 ? `es fehlen etwa ${stimmen.luecke} von ${REGELN.mehrheit}` : `nötig sind ${REGELN.mehrheit}`,
      trend: "gleich",
      ton: stimmen.luecke > 0 ? "schlecht" : "gut",
      ziel: { art: "akte", akte: "parlament" },
    },
    {
      id: "preise",
      label: "Inflation",
      wert: `${nf(infl)} %`,
      zusatz: `Amtsantritt ${nf(spiel.start.inflation)} %, Lira ${nf(world.economy.usdTry, 0)} je Dollar`,
      trend: trend(dInfl, 0.5),
      ton: dInfl > 1 ? "schlecht" : dInfl < -1 ? "gut" : "neutral",
      ziel: { art: "akte", akte: "wirtschaft" },
    },
    {
      id: "arbeit",
      label: "Arbeitslosigkeit",
      wert: `${nf(arbeitslos)} %`,
      zusatz: `Wachstum ${nf(world.published.growth.value)} %`,
      trend: trend(dArbeit, 0.3),
      ton: dArbeit > 0.5 ? "schlecht" : dArbeit < -0.5 ? "gut" : "neutral",
      ziel: { art: "akte", akte: "wirtschaft" },
    },
    {
      id: "probleme",
      label: "Akute Probleme",
      wert: `${akut}`,
      zusatz: `beim Amtsantritt ${spiel.start.akut}`,
      trend: trend(dAkut, 0.5),
      ton: dAkut > 1 ? "schlecht" : dAkut < -1 ? "gut" : "neutral",
      ziel: { art: "politik" },
    },
  ];
}

export function faellig(world: World): Faellig[] {
  const spiel = world.spiel;
  if (!spiel) return [];
  const out: Faellig[] = [];
  for (const e of spiel.ereignisse) {
    const tage = Math.max(0, e.frist - world.day);
    out.push({
      id: `e-${e.id}`,
      art: "ereignis",
      titel: vorlage(e.vorlage).titel(world, e),
      tage,
      dringend: tage <= 7,
      unter: `Frist ${tageWort(tage)}; ohne Antwort greift die Standardfolge und die Zustimmung sinkt`,
      knopf: { art: "gehe", label: "Entscheiden", ziel: { art: "ereignis", id: e.id } },
    });
  }
  for (const g of spiel.gesetze) {
    const tage = Math.max(0, g.abstimmung - world.day);
    const s = stimmenSicht(world, { massnahme: g.massnahme, richtung: g.richtung ?? 1 });
    out.push({
      id: `g-${g.id}`,
      art: "gesetz",
      titel: `Abstimmung: ${g.name}`,
      tage,
      dringend: tage <= 14 && s.luecke > 0,
      unter: `${tageWort(tage)}, erwartet ${s.erwartet} Ja-Stimmen von ${REGELN.mehrheit} nötigen${s.luecke > 0 ? `: es fehlen etwa ${s.luecke}` : ""}`,
      knopf: { art: "gehe", label: s.luecke > 0 ? "Stimmen suchen" : "Ansehen", ziel: { art: "akte", akte: "parlament" } },
    });
  }
  for (const z of spiel.zusagen.filter((x) => !x.erfuellt && !x.gebrochen)) {
    const tage = Math.max(0, z.faellig - world.day);
    const richtung = (z.richtung ?? 1) >= 0 ? 1 : -1;
    out.push({
      id: `z-${z.id}`,
      art: "zusage",
      titel: `Zusage an ${z.von}: ${z.text}`,
      tage,
      dringend: tage <= 20,
      unter: `fällig ${tageWort(tage)}${z.massnahme ? "; das Vorhaben dazu einzustellen erfüllt sie" : ""}`,
      knopf: z.massnahme
        ? { art: "gehe", label: "Vorhaben ansehen", ziel: { art: "politik", massnahme: { id: z.massnahme, level: Math.max(0, Math.min(100, Math.round(stufeIn(world, z.massnahme, null)) + 20 * richtung)) } } }
        : { art: "gehe", label: "Ansehen", ziel: { art: "akte", akte: "personen" } },
    });
  }
  for (const [partei, f] of Object.entries(spiel.fraktionen ?? {})) {
    if (f.duldungBis === undefined || f.duldungBis <= world.day || spiel.lager.includes(partei)) continue;
    const tage = f.duldungBis - world.day;
    if (tage > 60) continue;
    out.push({
      id: `d-${partei}`,
      art: "duldung",
      titel: `Duldung durch ${partei} läuft aus`,
      tage,
      dringend: tage <= 20,
      unter: `endet ${tageWort(tage)}; danach stimmt sie nicht mehr mit`,
      knopf: { art: "gehe", label: "Verlängern", ziel: { art: "akte", akte: "parlament" } },
    });
  }
  const schritt = naechsterSchritt(world);
  const sp = schritt ? schrittMitProgramm(schritt.schritt.id) : undefined;
  if (schritt && sp && schritt.status === "bereit") {
    out.push({
      id: `s-${schritt.schritt.id}`,
      art: "schritt",
      titel: `Programmschritt bereit: ${schritt.schritt.titel}`,
      dringend: false,
      unter: `${sp.programm.titel}; kostet ${schritt.schritt.kapital} Kapital`,
      knopf: { art: "gehe", label: "Zum Programm", ziel: { art: "akte", akte: "programme" } },
    });
  }
  return out.sort((a, b) => (a.tage ?? 9999) - (b.tage ?? 9999));
}

export function warnungen(world: World): Warnung[] {
  const spiel = world.spiel;
  if (!spiel) return [];
  const out: Warnung[] = [];
  const z = spiel.umfrage.zustimmung;
  const stimmen = stimmenSicht(world);
  if (spiel.tiefstand > 0) {
    out.push({ id: "sturz", stufe: "rot", text: `Sturzgefahr: Die Zustimmung liegt seit ${pl(spiel.tiefstand, "Monat", "Monaten")} unter ${SPIEL.sturzSchwelle} %`, warum: `Nach ${SPIEL.sturzMonate} Monaten in Folge enden Massenproteste die Amtszeit.`, ziel: { art: "akte", akte: "waehler" } });
  } else if (z < 35) {
    out.push({ id: "zustimmung", stufe: z < 30 ? "rot" : "gelb", text: `Die Zustimmung sinkt auf ${Math.round(z)} %`, warum: `Unter ${SPIEL.sturzSchwelle} % beginnt die Sturzgefahr. Die Wählerkoalition zeigt, wer verärgert ist und was die Gruppe will.`, ziel: { art: "akte", akte: "waehler" } });
  }
  if (spiel.kapital < 0) {
    out.push({ id: "pump", stufe: "rot", text: `Sie handeln auf Pump: Kapital ${Math.floor(spiel.kapital)}`, warum: "Wer im Minus steht, zahlt monatlich mit Legitimität und Vertrauen, bis die Gutschriften das Konto ausgleichen.", ziel: { art: "akte", akte: "bereiche" } });
  } else if (spiel.kapital < 8) {
    out.push({ id: "kapital", stufe: "gelb", text: `Das Kapital ist knapp (${Math.floor(spiel.kapital)})`, warum: "Für eine Krise oder ein Gesetz bleibt kaum etwas. Erst zurücklegen, dann gezielt ausgeben.", ziel: { art: "akte", akte: "bereiche" } });
  }
  if (stimmen.luecke > 0) {
    out.push({ id: "mehrheit", stufe: "gelb", text: `Dem Lager fehlen etwa ${stimmen.luecke} Stimmen`, warum: "Gesetze werden teuer und unsicher; Gespräche, Duldungen und Bündnisse im Parlament schaffen die Mehrheit.", ziel: { art: "akte", akte: "parlament" } });
  }
  const dInfl = world.published.inflation.value - spiel.start.inflation;
  if (dInfl > 3) {
    out.push({ id: "inflation", stufe: dInfl > 8 ? "rot" : "gelb", text: `Die Inflation liegt ${nf(dInfl)} Punkte über dem Stand beim Amtsantritt`, warum: `Jetzt ${nf(world.published.inflation.value)} %, damals ${nf(spiel.start.inflation)} %. Zentralbank, Haushalt und Löhne wirken darauf.`, ziel: { art: "akte", akte: "entscheidungen" } });
  }
  const dSchuld = world.economy.debtRatio - spiel.start.schulden;
  if (dSchuld > 6) {
    out.push({ id: "schulden", stufe: "gelb", text: `Die Staatsschulden sind um ${nf(dSchuld)} Punkte des BIP gestiegen`, warum: "Höhere Schulden erhöhen die Zinslast und den Risikoaufschlag der Märkte.", ziel: { art: "akte", akte: "entscheidungen" } });
  }
  const akut = akuteProbleme(world).length;
  if (akut > spiel.start.akut + 2) {
    out.push({ id: "probleme", stufe: "gelb", text: `${akut} akute Probleme, ${akut - spiel.start.akut} mehr als beim Amtsantritt`, warum: "Die Bereiche zeigen, wo es brennt und welche Hebel es gibt.", ziel: { art: "politik" } });
  }
  const verstimmt = waehlerLage(world).filter((g) => g.laune < 40).sort((a, b) => a.laune - b.laune)[0];
  if (verstimmt) {
    out.push({ id: `gruppe-${verstimmt.id}`, stufe: verstimmt.laune < 32 ? "rot" : "gelb", text: `${verstimmt.name} sind verärgert (Stimmung ${Math.round(verstimmt.laune)})`, warum: `Grund: ${verstimmt.gruende.slice(0, 2).map((g) => g.name).join(", ") || "die Lage insgesamt"}.`, ziel: { art: "akte", akte: "waehler" } });
  }
  const wackelig = spiel.figuren.find((f) => f.amt === "partner" && spiel.lager.includes(f.partei ?? "") && f.loyalitaet < 32);
  if (wackelig) {
    out.push({ id: "partner", stufe: "rot", text: `${wackelig.rolle} ${wackelig.name} steht kurz vor dem Bruch`, warum: `Loyalität ${Math.round(wackelig.loyalitaet)}: Geht der Partner, nimmt er seine Sitze mit.`, ziel: { art: "akte", akte: "personen" } });
  }
  for (const e of spiel.ereignisse) {
    const tage = e.frist - world.day;
    if (tage <= 4) out.push({ id: `frist-${e.id}`, stufe: "rot", text: `Frist ${tageWort(Math.max(0, tage))}: ${vorlage(e.vorlage).titel(world, e)}`, warum: "Schweigen wird bemerkt: Ohne Antwort sinkt die Zustimmung.", ziel: { art: "ereignis", id: e.id } });
  }
  if (spiel.reich) {
    const z2 = reichZustand(world);
    const schwach = Object.entries(z2.staetten).filter(([, s]) => s.zustand < 30).sort((a, b) => a[1].zustand - b[1].zustand)[0];
    if (schwach) {
      const name = ERBE_NACH_ID[schwach[0]]?.name ?? schwach[0];
      out.push({ id: `staette-${schwach[0]}`, stufe: "gelb", text: `${name} verfällt (Zustand ${Math.round(schwach[1].zustand)})`, warum: "Verfallendes Erbe verliert Besucher, Ansehen und im schlimmsten Fall den Welterbestatus.", ziel: { art: "akte", akte: "reich_kultur" } });
    }
    if (z2.verwaltung <= 0 && z2.laufend.length > 0) {
      out.push({ id: "verwaltung", stufe: "gelb", text: "Die Verwaltungskraft ist aufgebraucht", warum: "Bauvorhaben laufen nur mit halbem Tempo, bis wieder Kraft frei ist.", ziel: { art: "akte", akte: "reich_haushalt" } });
    }
  }
  const monateWahl = monateBis(spiel.wahltag - world.day);
  if (monateWahl <= 12 && z < 46) {
    out.push({ id: "wahl", stufe: "gelb", text: `Die Wahl ist in ${pl(monateWahl, "Monat", "Monaten")}, die Zustimmung liegt bei ${Math.round(z)} %`, warum: "Kurz vor der Wahl zählen sichtbare Ergebnisse mehr als neue Pläne.", ziel: { art: "akte", akte: "waehler" } });
  }
  return out.sort((a, b) => Number(b.stufe === "rot") - Number(a.stufe === "rot"));
}

export function termine(world: World): Termin[] {
  const spiel = world.spiel;
  if (!spiel) return [];
  const out: Termin[] = [];
  const wahl = spiel.wahltag - world.day;
  if (wahl >= 0) out.push({ id: "wahl", tage: wahl, datum: formatDateDe(addDays(world.date, wahl)), text: `Präsidentschaftswahl (${spiel.amtszeit}. Amtszeit)`, ziel: { art: "akte", akte: "waehler" } });
  for (const g of spiel.gesetze) {
    const t = Math.max(0, g.abstimmung - world.day);
    out.push({ id: `g-${g.id}`, tage: t, datum: formatDateDe(addDays(world.date, t)), text: `Abstimmung: ${g.name}`, ziel: { art: "akte", akte: "parlament" } });
  }
  for (const z of spiel.zusagen.filter((x) => !x.erfuellt && !x.gebrochen)) {
    const t = Math.max(0, z.faellig - world.day);
    out.push({ id: `z-${z.id}`, tage: t, datum: formatDateDe(addDays(world.date, t)), text: `Zusage an ${z.von} fällig`, ziel: { art: "akte", akte: "personen" } });
  }
  for (const k of KALENDER) {
    const r = tageBisMonat(world, k.monat, k.abJahr, k.nurJahr);
    if (!r) continue;
    // Kommunalwahlen und ähnliche Einmaltermine nur, solange sie nicht stattgefunden haben
    if (k.nurJahr !== undefined && (spiel.zuletzt[k.vorlage] ?? -1) >= 0) continue;
    out.push({ id: k.id, tage: r.tage, datum: `${MONATE[k.monat - 1]} ${r.jahr}`, text: k.text(r.jahr), ...(k.ziel ? { ziel: k.ziel } : {}) });
  }
  return out.filter((t) => t.tage >= 0).sort((a, b) => a.tage - b.tage).slice(0, 8);
}

/** Der Beraterstab: konkrete Vorschläge, jeder aus dem Weltzustand gerechnet. */
export function empfehlungen(world: World, vorschlaege?: Vorschlag[]): Empfehlung[] {
  const spiel = world.spiel;
  if (!spiel) return [];
  const out: Empfehlung[] = [];
  const stab = figur(world, "stab");
  const finanzen = figur(world, "finanzen");
  const aussen = figur(world, "aussen");

  // 1. Fachstab: die wirksamsten Vorhaben gegen die akuten Probleme
  for (const v of (vorschlaege ?? berechneVorschlaege(world, 3)).slice(0, 2)) {
    out.push({
      id: `v-${v.massnahme}`,
      rat: "Fachstab",
      ...(stab ? { wer: anrede(stab) } : {}),
      titel: `${v.name}: ${v.zielName ? `„${v.jetztName}“ zu „${v.zielName}“` : `Stufe ${v.stufeJetzt} auf ${v.ziel}`}`,
      text: v.grund,
      kosten: `${v.pk} Kapital, ${nf(v.kostenBip, 2)} % BIP im Jahr, etwa ${v.monate} ${v.monate === 1 ? "Monat" : "Monate"} bis zur Wirkung; ${v.urteil === "sicher" ? "die Mehrheit steht" : v.urteil === "knapp" ? "die Mehrheit ist knapp" : "ohne Mehrheit aussichtslos"}`,
      knoepfe: [
        { art: "gehe", label: "Ansehen und einstellen", ziel: { art: "politik", massnahme: { id: v.massnahme, level: v.ziel, ort: v.ort } } },
        ...(v.bezahlbar && v.urteil !== "verloren" ? [{ art: "einbringen" as const, label: `Sofort einbringen (${v.pk})`, vorschlag: v }] : []),
      ],
      gewicht: 60 - out.length * 5 + Math.min(20, v.punkte / 200),
    });
  }

  // 2. Fraktionen: fehlt die Mehrheit, empfiehlt sich das günstigste Gespräch mit der offensten Fraktion
  const stimmen = stimmenSicht(world);
  if (stimmen.luecke > 0) {
    const kandidaten = fraktionsUebersicht(world)
      .filter((f) => f.status === "opposition")
      .map((f) => ({ f, a: f.aktionen.find((x) => x.id === "gespraech") }))
      .filter((x): x is { f: (typeof x)["f"]; a: NonNullable<(typeof x)["a"]> } => !!x.a && x.a.moeglich)
      .sort((a, b) => b.f.bereitschaft * Math.sqrt(b.f.sitze) - a.f.bereitschaft * Math.sqrt(a.f.sitze));
    const k = kandidaten[0];
    if (k) {
      out.push({
        id: `f-${k.f.partei}`,
        rat: "Fraktionsbüro",
        titel: `Gespräch mit ${k.f.name}`,
        text: `Dem Lager fehlen etwa ${stimmen.luecke} Stimmen. ${k.f.name} (${k.f.sitze} Sitze) ist ${k.f.wort}; ein Gespräch macht sie offener und ist die günstigste Art, eine Mehrheit vorzubereiten. Sie erwartet: ${k.f.forderung}`,
        kosten: `${k.a.pk} Kapital`,
        knoepfe: [
          { art: "gespraech", label: `Gespräch führen (${k.a.pk})`, partei: k.f.partei, pk: k.a.pk },
          { art: "gehe", label: "Alle Fraktionen", ziel: { art: "akte", akte: "parlament" } },
        ],
        gewicht: 70,
      });
    }
  }

  // 3. Wähler: die verärgerte Gruppe und das Vorhaben, das sie sich wünscht
  const grp = waehlerLage(world).filter((g) => g.laune < 45).sort((a, b) => a.laune - b.laune)[0];
  if (grp) {
    const f = grp.forderungen[0];
    if (f) {
      out.push({
        id: `w-${grp.id}`,
        rat: "Wahlkampfstab",
        ...(stab ? { wer: anrede(stab) } : {}),
        titel: `${grp.name} besänftigen: ${f.name}`,
        text: `${grp.name} sind ${grp.wort} (Stimmung ${Math.round(grp.laune)}). Sie wünschen sich: ${f.name} ${f.richtung > 0 ? "erhöhen oder ausbauen" : "senken oder zurückfahren"}.`,
        knoepfe: [{ art: "gehe", label: "Vorhaben ansehen", ziel: { art: "politik", massnahme: { id: f.massnahme, level: Math.max(0, Math.min(100, Math.round(stufeIn(world, f.massnahme, null)) + 20 * f.richtung)) } } }],
        gewicht: 50 + (45 - grp.laune),
      });
    }
  }

  // 4. Außenamt: das Land mit dem größten Gesprächsbedarf, dessen Gipfel möglich und bezahlbar ist
  const land = LAENDER.map((l) => {
    const aktionen = aktionenFuer(world, l.id);
    const gipfel = aktionen.find((a) => a.aktion.id === "gipfel" && a.moeglich);
    const entspannen = aktionen.find((a) => a.aktion.id === "entspannen" && a.moeglich);
    const bedarf = (60 - dimensionZu(world, l.id, "vertrauen")) * l.anteil + Math.max(0, dimensionZu(world, l.id, "konflikt") - 55) * l.anteil * 0.6;
    return { l, gipfel, entspannen, bedarf };
  })
    .filter((x) => (x.gipfel || x.entspannen) && x.bedarf > 8)
    .sort((a, b) => b.bedarf - a.bedarf)[0];
  if (land) {
    const a = land.gipfel ?? land.entspannen!;
    out.push({
      id: `l-${land.l.id}`,
      rat: "Außenamt",
      ...(aussen ? { wer: anrede(aussen) } : {}),
      titel: `${land.l.name}: ${a.aktion.label}`,
      text: `Das Verhältnis zu ${land.l.dat} ist ${haltungWort(world, land.l.id)} (Vertrauen ${Math.round(dimensionZu(world, land.l.id, "vertrauen"))}, Konflikt ${Math.round(dimensionZu(world, land.l.id, "konflikt"))}). ${a.aktion.hinweis}`,
      kosten: `${a.aktion.pk} Kapital`,
      knoepfe: [{ art: "gehe", label: "Zum Land", ziel: { art: "land", id: land.l.id } }],
      gewicht: 40 + Math.min(20, land.bedarf / 3),
    });
  }

  // 5. Finanzen: Inflation über dem Amtsantritt
  const dInfl = world.published.inflation.value - spiel.start.inflation;
  if (dInfl > 2) {
    out.push({
      id: "finanzen-inflation",
      rat: "Finanzministerium",
      ...(finanzen ? { wer: anrede(finanzen) } : {}),
      titel: "Inflation eindämmen: Haushalt und Zentralbank",
      text: `Die Inflation liegt bei ${nf(world.published.inflation.value)} % (Amtsantritt ${nf(spiel.start.inflation)} %). Sparen entlastet die Preise, kostet aber Nachfrage; die Zentralbank ist der zweite Hebel.`,
      knoepfe: [{ art: "gehe", label: "Erlass vorbereiten", ziel: { art: "akte", akte: "entscheidungen" } }],
      gewicht: 45 + Math.min(20, dInfl * 2),
    });
  }

  // 6. Kulturbehörde: eine verfallende Stätte
  if (spiel.reich) {
    const z2 = reichZustand(world);
    const schwach = Object.entries(z2.staetten).filter(([, s]) => s.zustand < 45).sort((a, b) => a[1].zustand - b[1].zustand)[0];
    if (schwach) {
      const e = ERBE_NACH_ID[schwach[0]];
      if (e) {
        out.push({
          id: `k-${schwach[0]}`,
          rat: "Kulturbehörde",
          titel: `${e.name} erhalten`,
          text: `Zustand ${Math.round(schwach[1].zustand)} von 100. Verfallendes Erbe kostet Besucher und Ansehen; eine Restaurierung hält es und hebt die Erhaltung des Kulturerbes im Land.`,
          knoepfe: [{ art: "gehe", label: "Zum Reich", ziel: { art: "akte", akte: "reich_kultur" } }],
          gewicht: 35 + (45 - schwach[1].zustand) / 2,
        });
      }
    }
  }

  // 7. Mit Kapital im Überfluss: nicht horten
  if (spiel.kapital >= 45 && out.every((o) => !o.id.startsWith("v-"))) {
    const h = handlungsHebel((id) => nationalAverage(NET, world.net, id), "vertrauen_regierung", 1, 1)[0];
    if (h) {
      out.push({
        id: "kapital-nutzen",
        rat: "Finanzministerium",
        ...(finanzen ? { wer: anrede(finanzen) } : {}),
        titel: `Kapital arbeiten lassen: ${h.name}`,
        text: `${Math.floor(spiel.kapital)} Kapital liegen brach; Kapital, das nicht arbeitet, bringt nichts. ${h.name} wirkt auf das Vertrauen in die Regierung, und von dort auf Zustimmung und Kapitaleinkommen.`,
        knoepfe: [{ art: "gehe", label: "Ansehen", ziel: { art: "politik", massnahme: { id: h.massnahme, level: Math.max(0, Math.min(100, Math.round(h.jetzt) + 20 * h.richtung)) } } }],
        gewicht: 30,
      });
    }
  }
  return out.sort((a, b) => b.gewicht - a.gewicht).slice(0, 5);
}

export function briefing(world: World, vorschlaege?: Vorschlag[]): Briefing {
  const spiel = world.spiel;
  const wahltage = spiel ? spiel.wahltag - world.day : 0;
  return {
    datum: formatDateDe(world.date),
    amtszeit: { nummer: spiel?.amtszeit ?? 1, wahltag: spiel ? formatDateDe(addDays(world.date, wahltage)) : "", monateBisWahl: monateBis(wahltage) },
    kennzahlen: kennzahlen(world),
    faellig: faellig(world),
    warnungen: warnungen(world),
    empfehlungen: empfehlungen(world, vorschlaege),
    termine: termine(world),
  };
}

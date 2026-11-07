// Rüstung meldet sich auf dem Schreibtisch (Welle E4, 7. November 2026; Gesamtplan Welle 2, ENTSCHEIDUNGEN AA).
//
// Befund aus dem Spielstand des Inhabers 2043 (dokumentation/analyse_2026-11-05/bereiche/ruestung_medien.md): In 15 Jahren kam aus der
// Rüstung außer dem Lieferverzug und dem Militärrat nichts auf den Tisch; ein Los Kampfflugzeuge bewegte 24 Monate lang nichts.
//
//   ruestung_bedingung  Ein Lieferant knüpft eine laufende Lieferung an eine Bedingung. Vorbilder: Der US-Kongress gab die F-16 erst frei,
//                       als das türkische Parlament den NATO-Beitritt Schwedens ratifiziert hatte (Ratifikation 23.01.2024, Mitteilung an
//                       den Kongress 26.01.2024; Al Jazeera 27.01.2024, https://www.aljazeera.com/news/2024/1/27/us-approves-sale-of-f-16-fighter-jets-to-turkey).
//                       Deutschland hielt die Zustimmung zum Eurofighter wegen der Menschenrechtslage zurück und gab sie am 23.07.2025
//                       (AFP/Reuters, etwa The Star 23.07.2025, https://www.thestar.com.my/news/world/2025/07/23/germany-oks-eurofighter-delivery-to-turkey-spiegel-reports).
//   ruestung_export     Ein Land will türkische Rüstung kaufen. Vorbilder: Indonesien bestellte 48 KAAN (Vertrag 07/2025, Jakarta Post
//                       29.07.2025); TB2 gingen nach Aserbaidschan (2020), in die Ukraine und nach Pakistan (Overt Defense 14.03.2022);
//                       Rüstungsexporte 2025: 10,05 Mrd. USD (Defence Turkey 07.02.2026, Recherche R8). Nach ENTSCHEIDUNGEN AA 4 wirken
//                       Exporte auf die Wirtschaft (Export, Industriearbeitsplätze) und schwach auf die Zustimmung (Nationalisten).
//
// Neue Vorlagen würfeln aus Samen, Vorlage und Tag (`eigenerWurf`) und schaffen keinen Zusatzplatz (`ohneZusatzplatz`), wie in
// sim/ereignisse-bereiche.ts. Jede Antwort wirkt über vorhandene Wege: Bauliste (Fortschritt), Streitkräfte (Liefertag), Beziehungen,
// Netzknoten und Staatsgeld. Preise und Wirkungen, die eine Antwort nennt, kommen aus denselben Konstanten, die sie bucht.
// Alle Größen der Wirkung, Schwellen und Häufigkeiten sind Spielparameter.

import { t, zahl } from "../i18n";
import { hashWert } from "./aufmerksamkeit";
import { wirke } from "./wirkung";
import { clamp } from "./economy";
import { kosten, netz as netzWert, opt } from "./ereignis-hilfen";
import type { Option, Vorlage } from "./ereignis-hilfen";
import { reichZustand, vorhabenDef } from "./reich";
import { streitkraefte } from "./streitkraefte";
import { militaerVersorgung } from "./versorgung";
import { START_BESCHAFFUNGEN } from "../data/streitkraefte";
import { akteurName, beziehungAendern, beziehungZurTuerkei } from "./welt-modell";
import { aktiveKriege } from "./krieg";
import type { OffenesEreignis } from "./spiel-typen";
import type { World } from "./types";

// ---------------------------------------------------------------------------
// Spielparameter

export const RUESTUNG_VORGAENGE = {
  bedingung: {
    /** Chance je Monat bei normaler Beziehung zum Lieferanten, und Faktor, wenn sie angespannt ist */
    chance: 0.04,
    angespannt: 2.5,
    /** Angespannt: Konflikt ab / Vertrauen unter */
    konfliktAb: 50,
    vertrauenUnter: 45,
    abkuehlung: 540,
    frist: 30,
    /** Nachgeben: Beziehung zum Lieferanten, Nationalisten; bei der Zusage zum Ostmittelmeer zusätzlich Griechenland */
    nachgeben: { vertrauen: 6, konflikt: -4, nationalisten: -1.5, ansehen: 0.5, griechenland: -3, eu: 0.5 },
    nachgebenPk: 2,
    /** Ersatz aus eigener Fertigung: Anteil des BIP, Rüstungsautarkie, Monate Verzug */
    heimisch: { bip: 0.1, autarkie: 2, monate: 8, nationalisten: 1 },
    /** Ablehnen: Monate Verzug, Konflikt mit dem Lieferanten */
    ablehnen: { monate: 14, konflikt: 3, nationalisten: 1 },
    /** Liegen lassen: Monate Verzug, Vertrauen des Lieferanten */
    liegen: { monate: 6, vertrauen: -2 },
  },
  export: {
    chance: 0.07,
    abkuehlung: 360,
    frist: 25,
    /** Mindestvertrauen des Käufers */
    vertrauenMin: 35,
    /** Liefern: Export, Industriearbeitsplätze, Nationalisten (schwach, AA 4), Käufer, Gegner des Käufers */
    liefern: { export: 1.5, arbeit: 1, nationalisten: 0.5, kaeufer: 5, handel: 3, gegnerKonflikt: 4, gegnerVertrauen: -4 },
    /** Mit Endverbleibsauflage: weniger Geschäft, weniger Ärger */
    auflage: { export: 1, arbeit: 0.6, nationalisten: 0.3, kaeufer: 2, handel: 2, gegnerKonflikt: 1.5, gegnerVertrauen: -1.5 },
    auflagePk: 1,
    ablehnen: { kaeufer: -4, gegnerVertrauen: 2, nationalisten: -0.3 },
    liegen: { kaeufer: -2 },
  },
} as const;

const runde = (x: number) => Math.round(x * 10) / 10;
/** Vorzeichen und Zahl in der Sprache des Spiels */
const vz = (x: number) => `${x >= 0 ? "+" : "−"}${zahl(Math.abs(x), Number.isInteger(x) ? 0 : 1)}`;

// ---------------------------------------------------------------------------
// Verzug einer Lieferung: über die Bauliste, sonst über das eigene Datum (ein Modell, ein Datum, wie sim/streitkraefte.ts)

/** Schiebt ein Rüstungsvorhaben um etwa `monate` Monate: Die Bauliste verliert den Fortschritt dieser Monate, sonst rückt der Liefertag. */
export function verzoegere(w: World, vorhaben: string, monate: number): void {
  if (monate <= 0 || !w.spiel) return;
  const v = vorhabenDef(vorhaben);
  const l = w.spiel.reich ? reichZustand(w).laufend.find((x) => x.id === vorhaben) : undefined;
  if (l && v) {
    const bau = l.bau ?? v.kosten.bau;
    l.fortschritt = Math.max(0, l.fortschritt - (bau * monate) / Math.max(1, l.monate ?? v.kosten.monate));
    return;
  }
  for (const b of streitkraefte(w).laufend) if (b.vorhaben === vorhaben) b.fertig += monate * 30;
}

/**
 * Der Grund eines Verzugs (Vorlage mil_lieferverzug in sim/ereignisse-reich.ts), nach dem Programm und der Lage:
 * KAAN wartet auf das F110 aus den USA (Exportlizenz 07/2026, Lieferung ab 2027, Recherche R1); der Altay auf seinen Antrieb (das deutsche
 * Embargo stoppte MTU/Renk, der koreanische Antrieb kam erst mit der Genehmigung vom 22.10.2021, der eigene BATU folgt, R2); der Eurofighter
 * auf die Zustimmung aller Partner des Konsortiums (Deutschland erst am 23.07.2025). Sonst fehlen Vorprodukte, wenn die Versorgung der
 * Rüstung stockt, oder die Erprobung dauert länger.
 */
export function verzugsGrund(w: World, vorhaben: string): string {
  if (vorhaben === "mil_kaan") return "triebwerk";
  if (vorhaben === "mil_altay") return "antrieb";
  if (vorhaben === "mil_eurofighter") return "zustimmung";
  return militaerVersorgung(w).material < 0.9 ? "vorprodukte" : "erprobung";
}

// ---------------------------------------------------------------------------
// Ein Lieferant stellt Bedingungen

/** Wer einer Lieferung zustimmen muss und woran er sie knüpft: die USA an eine Zusage im Bündnis, Deutschland (Eurofighter) an eine zur Lage im Ostmittelmeer und zu den Rechten. */
const LIEFERANT: Record<string, { land: string; forderung: "buendnis" | "rechte" }> = {
  USA: { land: "USA", forderung: "buendnis" },
  EU: { land: "DEU", forderung: "rechte" },
};

function angespannt(w: World, land: string): boolean {
  const p = RUESTUNG_VORGAENGE.bedingung;
  const b = beziehungZurTuerkei(w, land);
  return b.konflikt >= p.konfliktAb || b.vertrauen < p.vertrauenUnter;
}

/** Laufende Lieferungen aus dem Ausland, die eine Zustimmung brauchen; die angespannten zuerst. */
function bedingungsKandidaten(w: World): { vorhaben: string; land: string; forderung: "buendnis" | "rechte"; name: string; angespannt: boolean }[] {
  if (!w.spiel) return [];
  const out = streitkraefte(w)
    .laufend.filter((b) => b.vorhaben && b.lieferland && LIEFERANT[b.lieferland] && !b.gestoppt)
    .map((b) => {
      const l = LIEFERANT[b.lieferland!]!;
      return { vorhaben: b.vorhaben!, land: l.land, forderung: l.forderung, name: vorhabenDef(b.vorhaben!)?.name ?? b.name ?? b.vorhaben!, angespannt: angespannt(w, l.land) };
    });
  return out.sort((a, b) => Number(b.angespannt) - Number(a.angespannt));
}

const dStr = (ev: OffenesEreignis, k: string): string => String(ev.daten?.[k] ?? "");
/** Die Hauptstadt steht für die Regierung des Lieferanten (Washington, Berlin): Sie trägt das Verb im Singular. */
const stadt = (land: string): string => t(`welle_e4.hauptstadt.${land}`);

const RUESTUNG_BEDINGUNG: Vorlage = {
  id: "ruestung_bedingung",
  eigenerWurf: true,
  ohneZusatzplatz: true,
  szene: "parlament",
  frist: RUESTUNG_VORGAENGE.bedingung.frist,
  abkuehlung: RUESTUNG_VORGAENGE.bedingung.abkuehlung,
  wettbewerb: "eskalieren",
  chance: (w) => {
    const k = bedingungsKandidaten(w)[0];
    if (!k) return 0;
    const p = RUESTUNG_VORGAENGE.bedingung;
    return p.chance * (k.angespannt ? p.angespannt : 1);
  },
  erzeuge: (w) => {
    const k = bedingungsKandidaten(w)[0];
    if (!k) return null;
    return { provinzen: [], staerke: k.angespannt ? 1.3 : 1, daten: { vorhaben: k.vorhaben, land: k.land, forderung: k.forderung, name: k.name } };
  },
  titel: (_, ev) => t(`welle_e4.bedingung.titel.${dStr(ev, "forderung")}`, { name: dStr(ev, "name") }),
  text: (w, ev) => {
    const b = beziehungZurTuerkei(w, dStr(ev, "land"));
    return [
      t(`welle_e4.bedingung.text.${dStr(ev, "forderung")}`, { land: stadt(dStr(ev, "land")), name: dStr(ev, "name") }),
      t("welle_e4.bedingung.lage", { vertrauen: Math.round(b.vertrauen), konflikt: Math.round(b.konflikt) }),
    ];
  },
  warum: (_, ev) => t(`welle_e4.bedingung.warum.${dStr(ev, "forderung")}`),
  stelle: () => ({ art: "ruestung" }),
  massnahmen: ["m_ruestungsindustrie"],
  optionen: (_, ev) => {
    const p = RUESTUNG_VORGAENGE.bedingung;
    const land = dStr(ev, "land");
    const rechte = dStr(ev, "forderung") === "rechte";
    const n = p.nachgeben;
    const nachgeben: Option = {
      ...opt("nachgeben", t(`welle_e4.bedingung.opt.nachgeben.${dStr(ev, "forderung")}`), t("welle_e4.bedingung.opt.nachgeben.beschr", { land: stadt(land) }), p.nachgebenPk, (w) => {
        beziehungAendern(w, land, { vertrauen: n.vertrauen, konflikt: n.konflikt });
        wirke(w, "nationalisten", n.nationalisten);
        wirke(w, "ansehen", n.ansehen);
        if (rechte) {
          beziehungAendern(w, "GRC", { konflikt: n.griechenland });
          wirke(w, "beziehungen_eu", n.eu);
        }
        return t("welle_e4.bedingung.opt.nachgeben.ausgang", { land: stadt(land), name: dStr(ev, "name") });
      }),
      stelle: { art: "ruestung" },
      ...(rechte ? { bedingungen: [t("welle_e4.bedingung.opt.nachgeben.griechenland", { n: vz(n.griechenland) })] } : {}),
    };
    const h = p.heimisch;
    const heimisch: Option = {
      ...opt("heimisch", t("welle_e4.bedingung.opt.heimisch.label"), t("welle_e4.bedingung.opt.heimisch.beschr", { monate: h.monate }), 0, (w) => {
        kosten(w, h.bip);
        wirke(w, "ruestungsautarkie", h.autarkie);
        wirke(w, "nationalisten", h.nationalisten);
        verzoegere(w, dStr(ev, "vorhaben"), h.monate);
        return t("welle_e4.bedingung.opt.heimisch.ausgang", { name: dStr(ev, "name"), monate: h.monate });
      }),
      stelle: { art: "ruestung" },
    };
    const a = p.ablehnen;
    const ablehnen: Option = {
      ...opt("ablehnen", t("welle_e4.bedingung.opt.ablehnen.label"), t("welle_e4.bedingung.opt.ablehnen.beschr", { land: stadt(land), monate: a.monate }), 0, (w) => {
        beziehungAendern(w, land, { konflikt: a.konflikt });
        wirke(w, "nationalisten", a.nationalisten);
        verzoegere(w, dStr(ev, "vorhaben"), a.monate);
        return t("welle_e4.bedingung.opt.ablehnen.ausgang", { land: stadt(land), name: dStr(ev, "name"), monate: a.monate });
      }),
      stelle: { art: "ruestung" },
    };
    return [nachgeben, heimisch, ablehnen];
  },
  standard: (w, ev) => {
    const l = RUESTUNG_VORGAENGE.bedingung.liegen;
    beziehungAendern(w, dStr(ev, "land"), { vertrauen: l.vertrauen });
    verzoegere(w, dStr(ev, "vorhaben"), l.monate);
    return t("welle_e4.bedingung.standard", { land: stadt(dStr(ev, "land")), name: dStr(ev, "name"), monate: l.monate });
  },
};

// ---------------------------------------------------------------------------
// Exportanfrage

/** Käufer der Wirklichkeit und das Land, das sich über die Lieferung ärgert (Gegner im Konflikt; Belege oben). */
const KAEUFER: { land: string; gegner?: string }[] = [
  { land: "IDN" },
  { land: "AZE", gegner: "ARM" },
  { land: "PAK", gegner: "IND" },
  { land: "UKR", gegner: "RUS" },
];

/** Was angefragt wird: KAAN, sobald es fertig ist (Indonesien), sonst Drohnen. */
const ware = (w: World): "kaan" | "drohnen" => (w.spiel?.reich?.bestand["mil_kaan"] ? "kaan" : "drohnen");

function kaeuferWahl(w: World): { land: string; gegner?: string } | null {
  if (!w.spiel) return null;
  const krieg = new Set(aktiveKriege(w).map((k) => k.land));
  const moeglich = KAEUFER.filter((k) => !krieg.has(k.land) && beziehungZurTuerkei(w, k.land).vertrauen >= RUESTUNG_VORGAENGE.export.vertrauenMin);
  const liste = moeglich.length ? moeglich : KAEUFER.filter((k) => !krieg.has(k.land));
  if (!liste.length) return null;
  // Ohne Zug aus dem Zufallsstrom: Samen und Monat bestimmen den Käufer
  return liste[Math.floor(hashWert(`${w.seed}|ruestung_export|${w.date.slice(0, 7)}`) * liste.length) % liste.length]!;
}

/** Bucht ein Geschäft: Wirtschaft (Export, Arbeitsplätze), schwach die Zustimmung (Nationalisten), Käufer und Gegner. */
function exportBuchen(w: World, ev: OffenesEreignis, p: { export: number; arbeit: number; nationalisten: number; kaeufer: number; handel: number; gegnerKonflikt: number; gegnerVertrauen: number }): void {
  wirke(w, "export", p.export);
  wirke(w, "arbeitsplaetze_industrie", p.arbeit);
  wirke(w, "nationalisten", p.nationalisten);
  beziehungAendern(w, dStr(ev, "land"), { vertrauen: p.kaeufer, handel: p.handel });
  const g = dStr(ev, "gegner");
  if (g) beziehungAendern(w, g, { konflikt: p.gegnerKonflikt, vertrauen: p.gegnerVertrauen });
}

const RUESTUNG_EXPORT: Vorlage = {
  id: "ruestung_export",
  eigenerWurf: true,
  ohneZusatzplatz: true,
  szene: "anatolien",
  frist: RUESTUNG_VORGAENGE.export.frist,
  abkuehlung: RUESTUNG_VORGAENGE.export.abkuehlung,
  wettbewerb: "aussitzen",
  chance: (w) => {
    if (!kaeuferWahl(w)) return 0;
    // Eine stärkere eigene Industrie bekommt mehr Anfragen (Bezug: Rüstungsautarkie 60 beim Start)
    const aut = clamp(nationalAutarkie(w) / 60, 0.5, 1.5);
    return RUESTUNG_VORGAENGE.export.chance * aut;
  },
  erzeuge: (w) => {
    const k = kaeuferWahl(w);
    if (!k) return null;
    return { provinzen: [], staerke: 1, daten: { land: k.land, gegner: k.gegner ?? "", ware: ware(w) } };
  },
  titel: (_, ev) => t(`welle_e4.export.titel.${dStr(ev, "ware")}`, { land: stadt(dStr(ev, "land")) }),
  text: (_, ev) => [
    t(`welle_e4.export.text.${dStr(ev, "ware")}`, { land: stadt(dStr(ev, "land")) }),
    dStr(ev, "gegner") ? t("welle_e4.export.gegner", { gegner: stadt(dStr(ev, "gegner")), land: stadt(dStr(ev, "land")) }) : t("welle_e4.export.ohneGegner"),
  ],
  warum: () => t("welle_e4.export.warum"),
  stelle: () => ({ art: "ruestung" }),
  massnahmen: ["m_ruestungsindustrie"],
  optionen: (_, ev) => {
    const p = RUESTUNG_VORGAENGE.export;
    const gegner = dStr(ev, "gegner");
    // Export, Arbeitsplätze und Nationalisten zeigt das Ereignisfenster aus der Buchung auf einer Kopie; der Text nennt, was dort fehlt: den Gegner
    const folge = (art: "liefern" | "auflage", q: typeof p.liefern | typeof p.auflage) =>
      t(`welle_e4.export.folge.${art}`) + (gegner ? " " + t("welle_e4.export.folgeGegner", { gegner: akteurName(gegner), n: vz(q.gegnerKonflikt) }) : "");
    return [
      { ...opt("liefern", t("welle_e4.export.opt.liefern.label"), folge("liefern", p.liefern), 0, (w, e) => {
        exportBuchen(w, e, p.liefern);
        return t("welle_e4.export.opt.liefern.ausgang", { land: stadt(dStr(e, "land")) });
      }), stelle: { art: "ruestung" } },
      { ...opt("auflage", t("welle_e4.export.opt.auflage.label"), folge("auflage", p.auflage), p.auflagePk, (w, e) => {
        exportBuchen(w, e, p.auflage);
        return t("welle_e4.export.opt.auflage.ausgang", { land: stadt(dStr(e, "land")) });
      }), stelle: { art: "ruestung" } },
      { ...opt("ablehnen", t("welle_e4.export.opt.ablehnen.label"), t("welle_e4.export.opt.ablehnen.beschr", { land: stadt(dStr(ev, "land")) }), 0, (w, e) => {
        beziehungAendern(w, dStr(e, "land"), { vertrauen: p.ablehnen.kaeufer });
        if (gegner) beziehungAendern(w, gegner, { vertrauen: p.ablehnen.gegnerVertrauen });
        wirke(w, "nationalisten", p.ablehnen.nationalisten);
        return t("welle_e4.export.opt.ablehnen.ausgang", { land: stadt(dStr(e, "land")) });
      }), stelle: { art: "ruestung" } },
    ];
  },
  standard: (w, ev) => {
    beziehungAendern(w, dStr(ev, "land"), { vertrauen: RUESTUNG_VORGAENGE.export.liegen.kaeufer });
    return t("welle_e4.export.standard", { land: stadt(dStr(ev, "land")) });
  },
};

/** Rüstungsautarkie im Landesmittel (Netzknoten) */
const nationalAutarkie = (w: World): number => runde(netzWert(w, "ruestungsautarkie"));


/** Die benannten Startbeschaffungen, an deren Vorhaben ein Lieferant hängt (für Tests und die Sicherheitsseite). */
export const LIEFERANTEN_VORHABEN = START_BESCHAFFUNGEN.filter((b) => b.lieferland && LIEFERANT[b.lieferland]).map((b) => b.vorhaben);

export const RUESTUNG_VORLAGEN: Vorlage[] = [RUESTUNG_BEDINGUNG, RUESTUNG_EXPORT];

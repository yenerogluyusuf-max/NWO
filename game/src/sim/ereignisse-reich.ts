import { bucheFinanzsaldo } from "./staatsgeld";
// Ereignisse der Fachbereiche: Kultur und Erbe, Recht, Streitkräfte, Infrastruktur (FACHBEREICHE.md).
// Wie in den anderen Vorlagen sind Wahrscheinlichkeiten und Wirkungen Platzhalter der Kalibrierung; Zahlen im Text stammen
// aus dem Weltzustand oder sind mit Quelle belegt (RECHERCHE_KONKURRENZ_FACHBEREICHE.md).

import { wirke, vertrauenAendern } from "./wirkung";
import { landAendern } from "./laender";
import { clamp } from "./economy";
import { beschr, kosten, monatVon, netz, opt, zusageAnlegen } from "./ereignis-hilfen";
import { aktuelleSprache, katalogVon, msg, t } from "../i18n";
import type { Formen } from "../i18n";
import type { Option, Vorlage } from "./ereignis-hilfen";
import { verzugsGrund } from "./ereignisse-ruestung";
import { VORZIEHEN_VERWALTUNG, bauPool, beginne, reichZustand, vergabeAngebot, verschiebe, vorhabenDef, vorhabenSicht } from "./reich";
import { ERBE, ERBE_NACH_ID } from "../data/erbe";
import { STAETTEN_START } from "../data/reich";
import { neuanfangGrund } from "./aufmerksamkeit";
import { addLog } from "./log";
import { PROVINZEN } from "./regional";
import { kannZahlen } from "./kapital";
import type { World } from "./types";
import type { Rng } from "./rng";

const staette = (ev: { daten?: Record<string, number | string> }) => ERBE_NACH_ID[String(ev.daten?.staette ?? "")] ?? ERBE[0]!;

/**
 * Name der Stätte im Satz mit seinen Formen (`{ad}`, `{ad|dat}`, `{ad|akk}`). Stätten mit Artikel oder Zusatz in Klammern
 * („Smyrna (Agora)“) haben einen eigenen Satznamen `ev.erbe.ad.<id>`; im Deutschen steht er als „Nominativ|Dativ|Akkusativ“
 * (fehlt der Akkusativ, gilt der Nominativ). Sonst gilt der übersetzte Name der Stätte.
 */
function ad(e: (typeof ERBE)[number]): Formen {
  const roh = katalogVon(aktuelleSprache())[`ev.erbe.ad.${e.id}`];
  if (roh === undefined) return { nom: e.name };
  const [nom = e.name, dat, akk] = roh.split("|");
  return dat ? { nom, dat, akk: akk ?? nom } : { nom };
}

/**
 * Text mit Stättennamen: Im Deutschen verschmilzt die Präposition mit dem Artikel des Dativs („bei dem Topkapı-Palast“ → „beim
 * Topkapı-Palast“, „an dem“ → „am“, „von dem“ → „vom“). Die Kataloge dieser Vorlagen haben sonst kein „bei/an/von dem“.
 */
function tSt(key: string, params: Parameters<typeof t>[1]): string {
  const s = t(key, params);
  return aktuelleSprache() === "de" ? s.replace(/(^|\s)(bei|an|von) dem /g, (_, v: string, p: string) => `${v}${p === "bei" ? "beim" : p === "an" ? "am" : "vom"} `) : s;
}

/** Name und Ort für die Kataloge; der Ort entfällt, wenn der Name ihn schon nennt („die Altstadt von Antakya … in Antakya“). */
function stelle(ev: { daten?: Record<string, number | string> }): { ad: Formen; ort: string; mitort: string } {
  const e = staette(ev);
  const name = ad(e);
  const enthalten = name.nom.toLocaleLowerCase("tr").includes(e.ort.toLocaleLowerCase("tr"));
  return { ad: name, ort: e.ort, mitort: enthalten ? "nein" : "ja" };
}

/** Zieht eine Stätte, deren Gewicht mit schlechtem Zustand wächst. */
function schwaecheZiehen(w: World, rng: Rng, nur?: (e: (typeof ERBE)[number]) => boolean): (typeof ERBE)[number] | null {
  const z = reichZustand(w);
  const kandidaten = ERBE.filter((e) => (nur ? nur(e) : true));
  const gewichte = kandidaten.map((e) => Math.max(0.05, (100 - (z.staetten[e.id]?.zustand ?? 50)) / 100) ** 2);
  const summe = gewichte.reduce((a, b) => a + b, 0);
  if (!kandidaten.length || summe <= 0) return null;
  let r = rng.next() * summe;
  for (let i = 0; i < kandidaten.length; i++) {
    r -= gewichte[i]!;
    if (r <= 0) return kandidaten[i]!;
  }
  return kandidaten[kandidaten.length - 1]!;
}

const hebeStaette = (w: World, id: string, d: number) => {
  const st = reichZustand(w).staetten[id];
  if (st) st.zustand = clamp(st.zustand + d, 0, 100);
};

/** Besetzt einen frei werdenden Sitz: Ein Mitglied verlässt das Gericht (nach Anteil), ein neues aus dem gewählten Lager kommt. */
function besetze(w: World, key: "aym" | "hsk", wahl: "loyal" | "unabhaengig" | "reform", rng: Rng): void {
  const s = reichZustand(w).sitze[key];
  if (!s) return;
  const n = s.loyal + s.unabhaengig + s.reform;
  let r = rng.next() * n;
  const geht = r < s.loyal ? "loyal" : r < s.loyal + s.reform ? "reform" : "unabhaengig";
  r = 0;
  s[geht] -= 1;
  s[wahl] += 1;
}

// ---------------------------------------------------------------------------
// Kultur und Erbe

const RAUBGRABUNG: Vorlage = {
  id: "erbe_raubgrabung",
  szene: "anatolien",
  frist: 15,
  abkuehlung: 240,
  chance: (w) => (netz(w, "kriminalitaet") > 40 ? 0.03 : 0.015),
  erzeuge: (w, rng) => {
    const e = schwaecheZiehen(w, rng, (x) => x.bezug.includes("antik") || x.bezug.includes("fruehmenschlich"));
    return e ? { provinzen: [e.plaka], staerke: 0.5 + 0.5 * rng.next(), daten: { staette: e.id } } : null;
  },
  titel: (_, ev) => tSt("ev.erbe_raubgrabung.titel", stelle(ev)),
  text: (_, ev) => [tSt("ev.erbe_raubgrabung.text1", stelle(ev)), t("ev.erbe_raubgrabung.text2")],
  warum: () => t("ev.erbe_raubgrabung.warum"),
  massnahmen: ["m_denkmalschutz", "m_archaeologie"],
  optionen: (_, ev) => [
    opt("schutz", t("ev.erbe_raubgrabung.opt.schutz.label"), beschr(3, 0, t("ev.erbe_raubgrabung.opt.schutz.beschr")), 3, (w) => {
      hebeStaette(w, staette(ev).id, 8);
      wirke(w, "kriminalitaet", -1, ev.provinzen);
      wirke(w, "ansehen", 0.5);
      return tSt("ev.erbe_raubgrabung.opt.schutz.ausgang", stelle(ev));
    }),
    opt("grabung", t("ev.erbe_raubgrabung.opt.grabung.label"), beschr(2, 0.02, t("ev.erbe_raubgrabung.opt.grabung.beschr")), 2, (w) => {
      kosten(w, 0.02);
      hebeStaette(w, staette(ev).id, 5);
      wirke(w, "hochschule", 0.5);
      wirke(w, "identitaet", 0.5);
      return tSt("ev.erbe_raubgrabung.opt.grabung.ausgang", stelle(ev));
    }),
  ],
  standard: (w, ev) => {
    hebeStaette(w, staette(ev).id, -10 * ev.staerke);
    wirke(w, "ansehen", -0.5);
    return tSt("ev.erbe_raubgrabung.standard", stelle(ev));
  },
};

const ERDBEBENSCHADEN: Vorlage = {
  id: "erbe_erdbebenschaden",
  szene: "anatolien",
  frist: 12,
  abkuehlung: 400,
  chance: (w) => (netz(w, "erdbebenvorsorge") < 45 ? 0.012 : 0.006),
  erzeuge: (w, rng) => {
    const e = schwaecheZiehen(w, rng);
    return e ? { provinzen: [e.plaka], staerke: 0.4 + 0.6 * rng.next(), daten: { staette: e.id } } : null;
  },
  titel: (_, ev) => tSt("ev.erbe_erdbebenschaden.titel", stelle(ev)),
  text: (_, ev) => [tSt("ev.erbe_erdbebenschaden.text1", stelle(ev)), t("ev.erbe_erdbebenschaden.text2")],
  warum: () => t("ev.erbe_erdbebenschaden.warum"),
  massnahmen: ["m_denkmalschutz", "m_bauaufsicht"],
  optionen: (_, ev) => [
    opt("sichern", t("ev.erbe_erdbebenschaden.opt.sichern.label"), beschr(3, 0.03, t("ev.erbe_erdbebenschaden.opt.sichern.beschr")), 3, (w) => {
      kosten(w, 0.03);
      hebeStaette(w, staette(ev).id, 12);
      return tSt("ev.erbe_erdbebenschaden.opt.sichern.ausgang", stelle(ev));
    }),
    opt("zusagen", t("ev.erbe_erdbebenschaden.opt.zusagen.label"), beschr(1, 0, t("ev.erbe_erdbebenschaden.opt.zusagen.beschr")), 1, (w) => {
      // `von` bleibt die feste Kennung (zusageVon übersetzt sie), der Text kommt über `msg` in der Sprache der Anzeige.
      const m = msg("zusage.erbe.wiederaufbau", { name: staette(ev).name });
      zusageAnlegen(w, { von: `Denkmalbehörde von ${staette(ev).ort}`, text: t(m.k, m.p), msg: m, tage: 300, massnahme: "m_denkmalschutz" });
      hebeStaette(w, staette(ev).id, 4);
      return tSt("ev.erbe_erdbebenschaden.opt.zusagen.ausgang", stelle(ev));
    }),
  ],
  standard: (w, ev) => {
    hebeStaette(w, staette(ev).id, -18 * ev.staerke);
    wirke(w, "kulturerbe", -1, ev.provinzen);
    return tSt("ev.erbe_erdbebenschaden.standard", stelle(ev));
  },
};

const UNESCO: Vorlage = {
  id: "erbe_unesco",
  szene: "parlament",
  frist: 25,
  abkuehlung: 540,
  chance: (w) => (monatVon(w) === 7 ? 0.45 : 0),
  erzeuge: (w, rng) => {
    const z = reichZustand(w);
    const kand = ERBE.filter((e) => e.unesco.status === "tentativ" && (z.staetten[e.id]?.zustand ?? 0) >= 50);
    if (!kand.length) return null;
    const e = kand[Math.floor(rng.next() * kand.length)]!;
    return { provinzen: [e.plaka], staerke: 1, daten: { staette: e.id } };
  },
  titel: (_, ev) => tSt("ev.erbe_unesco.titel", stelle(ev)),
  text: (w, ev) => [
    tSt("ev.erbe_unesco.text1", { ...stelle(ev), zustand: Math.round(reichZustand(w).staetten[staette(ev).id]?.zustand ?? 0) }),
    t("ev.erbe_unesco.text2"),
  ],
  warum: () => t("ev.erbe_unesco.warum"),
  massnahmen: ["m_archaeologie", "m_denkmalschutz"],
  optionen: (_, ev) => [
    opt("betreiben", t("ev.erbe_unesco.opt.betreiben.label"), beschr(4, 0, t("ev.erbe_unesco.opt.betreiben.beschr")), 4, (w, _e, rng) => {
      const st = reichZustand(w).staetten[staette(ev).id]?.zustand ?? 50;
      const p = clamp(0.4 + 0.006 * (st - 55) + 0.004 * (netz(w, "ansehen") - 50), 0.15, 0.85);
      if (rng.next() < p) {
        wirke(w, "ansehen", 3);
        wirke(w, "tourismus", 3, ev.provinzen);
        wirke(w, "identitaet", 1);
        hebeStaette(w, staette(ev).id, 6);
        return tSt("ev.erbe_unesco.opt.betreiben.ausgang.ja", stelle(ev));
      }
      wirke(w, "ansehen", -0.5);
      return tSt("ev.erbe_unesco.opt.betreiben.ausgang.nein", stelle(ev));
    }),
    opt("zurueck", t("ev.erbe_unesco.opt.zurueck.label"), beschr(1, 0, t("ev.erbe_unesco.opt.zurueck.beschr")), 1, (w) => {
      hebeStaette(w, staette(ev).id, 5);
      return tSt("ev.erbe_unesco.opt.zurueck.ausgang", stelle(ev));
    }),
  ],
  standard: (w) => {
    wirke(w, "ansehen", -0.3);
    return t("ev.erbe_unesco.standard");
  },
};

const FUND: Vorlage = {
  id: "erbe_fund",
  szene: "anatolien",
  frist: 15,
  abkuehlung: 420,
  chance: (w) => (netz(w, "m_archaeologie") >= 40 ? 0.03 : 0.008),
  erzeuge: (w, rng) => {
    const kand = ERBE.filter((e) => e.bezug.includes("fruehmenschlich") || e.bezug.includes("antik"));
    const e = kand[Math.floor(rng.next() * kand.length)]!;
    return { provinzen: [e.plaka], staerke: 0.5 + 0.5 * rng.next(), daten: { staette: e.id } };
  },
  titel: (_, ev) => tSt("ev.erbe_fund.titel", stelle(ev)),
  // Zeitlos statt Statistik eines Jahres (Befund A-20): Der Satz kehrt bei jedem Fund wieder.
  text: (_, ev) => [tSt("ev.erbe_fund.text1", stelle(ev)), t("ev.erbe_fund.text2")],
  warum: () => t("ev.erbe_fund.warum"),
  massnahmen: ["m_archaeologie"],
  optionen: (_, ev) => [
    opt("offen", t("ev.erbe_fund.opt.offen.label"), beschr(2, 0.02, t("ev.erbe_fund.opt.offen.beschr")), 2, (w) => {
      kosten(w, 0.02);
      wirke(w, "tourismus", 2, ev.provinzen);
      wirke(w, "identitaet", 1.5);
      wirke(w, "ansehen", 1.5);
      hebeStaette(w, staette(ev).id, -3);
      return tSt("ev.erbe_fund.opt.offen.ausgang", stelle(ev));
    }),
    opt("sichern", t("ev.erbe_fund.opt.sichern.label"), beschr(1, 0, t("ev.erbe_fund.opt.sichern.beschr")), 1, (w) => {
      wirke(w, "hochschule", 1);
      wirke(w, "identitaet", 0.5);
      hebeStaette(w, staette(ev).id, 4);
      return tSt("ev.erbe_fund.opt.sichern.ausgang", stelle(ev));
    }),
  ],
  standard: (w, ev) => {
    hebeStaette(w, staette(ev).id, -4);
    return tSt("ev.erbe_fund.standard", stelle(ev));
  },
};

const HAGIA_SOPHIA: Vorlage = {
  id: "erbe_hagia_sophia",
  szene: "istanbul",
  frist: 20,
  abkuehlung: 720,
  chance: (w) => (netz(w, "vielfalt") < 48 && Number(w.date.slice(0, 4)) >= 2029 ? 0.012 : 0),
  erzeuge: () => ({ provinzen: [34], staerke: 1 }),
  titel: () => t("ev.erbe_hagia_sophia.titel"),
  // Ohne Tagesdatum und Eintrittspreis eines Jahres (Befund A-20): Umwidmung im Juli 2020 (Danıştay-Urteil und Dekret vom 10. Juli 2020).
  text: () => [t("ev.erbe_hagia_sophia.text1"), t("ev.erbe_hagia_sophia.text2")],
  warum: () => t("ev.erbe_hagia_sophia.warum"),
  massnahmen: ["m_minderheitenrechte"],
  optionen: () => [
    opt("offen", t("ev.erbe_hagia_sophia.opt.offen.label"), beschr(3, 0, t("ev.erbe_hagia_sophia.opt.offen.beschr")), 3, (w) => {
      wirke(w, "vielfalt", 3);
      wirke(w, "ansehen", 2);
      wirke(w, "konservative", -2);
      hebeStaette(w, "hagia_sophia", 2);
      return t("ev.erbe_hagia_sophia.opt.offen.ausgang");
    }),
    opt("gebuehr", t("ev.erbe_hagia_sophia.opt.gebuehr.label"), beschr(1, 0, t("ev.erbe_hagia_sophia.opt.gebuehr.beschr")), 1, (w) => {
      bucheFinanzsaldo(w.economy, -0.02);
      wirke(w, "tourismus", -1, [34]);
      return t("ev.erbe_hagia_sophia.opt.gebuehr.ausgang");
    }),
  ],
  standard: (w) => {
    wirke(w, "polarisierung", 1);
    return t("ev.erbe_hagia_sophia.standard");
  },
};

const PILGERWELLE: Vorlage = {
  id: "kultur_pilgerwelle",
  szene: "anatolien",
  frist: 12,
  abkuehlung: 360,
  chance: (w) => (w.spiel?.reich?.bestand.serie_kirchen7 ? 0.05 : 0.004),
  erzeuge: () => ({ provinzen: [35, 45, 20], staerke: 1 }),
  titel: () => t("ev.kultur_pilgerwelle.titel"),
  text: () => [t("ev.kultur_pilgerwelle.text1", { route: vorhabenDef("serie_kirchen7")?.name ?? "" }), t("ev.kultur_pilgerwelle.text2")],
  warum: () => t("ev.kultur_pilgerwelle.warum"),
  massnahmen: ["m_denkmalschutz", "m_kulturfoerderung"],
  optionen: () => [
    opt("lenken", t("ev.kultur_pilgerwelle.opt.lenken.label"), beschr(2, 0.02, t("ev.kultur_pilgerwelle.opt.lenken.beschr")), 2, (w) => {
      kosten(w, 0.02);
      wirke(w, "tourismus", 1, [35, 45, 20]);
      for (const id of ["ephesos", "smyrna", "pergamon", "thyatira", "sardes", "philadelphia", "laodikeia"]) hebeStaette(w, id, 2);
      return t("ev.kultur_pilgerwelle.opt.lenken.ausgang");
    }),
    opt("laufen", t("ev.kultur_pilgerwelle.opt.laufen.label"), beschr(0, 0, t("ev.kultur_pilgerwelle.opt.laufen.beschr")), 0, (w) => {
      wirke(w, "tourismus", 2, [35, 45, 20]);
      for (const id of ["ephesos", "smyrna", "pergamon", "thyatira", "sardes", "philadelphia", "laodikeia"]) hebeStaette(w, id, -3);
      return t("ev.kultur_pilgerwelle.opt.laufen.ausgang");
    }),
  ],
  standard: (w) => {
    for (const id of ["ephesos", "pergamon", "sardes"]) hebeStaette(w, id, -2);
    return t("ev.kultur_pilgerwelle.standard");
  },
};

// ---------------------------------------------------------------------------
// Verfall einer Stätte (Welle H3, 6. November 2026): Wer die Stätten nie pflegt, bekommt es mit dem Welterbekomitee oder der Denkmalbehörde zu tun.
// Im Spielstand des Inhabers fielen Thyatira, Philadelphia und Smyrna in zehn Jahren um je neun Punkte, ohne jede Folge.
//
// Ein Welterbe unter seiner Schwelle droht auf die Liste des gefährdeten Welterbes zu kommen, wer es dort liegen lässt, riskiert die Streichung
// von der Welterbeliste. Beides gibt es wirklich: Die UNESCO führt die „List of World Heritage in Danger“ und hat Stätten gestrichen (Arabian Oryx
// Sanctuary 2007, Dresdner Elbtal 2009, Liverpool 2021; whc.unesco.org/en/danger und whc.unesco.org/en/deleted). Eine andere Stätte schließt die
// Denkmalbehörde für Besucher. Ist die Stätte wieder gepflegt (Schwelle plus Erholung), kommt sie von der Liste oder öffnet wieder.
// Alle Schwellen und Wirkungen sind Spielparameter.

export const ERBE_DRUCK = {
  /** Schwelle des Zustands (0 bis 100) je Status; darunter meldet sich das Komitee oder die Behörde */
  schwelle: { welterbe: 45, tentativ: 35, nein: 30 } as Record<"welterbe" | "tentativ" | "nein", number>,
  /** So viele Punkte muss die Stätte seit Spielbeginn verloren haben: Gemeldet wird Verfall unter dieser Regierung, nicht der Zustand beim Amtsantritt */
  verlustMin: 4,
  /** Chance je Monat; sie wächst, je weiter die schlimmste Stätte unter ihrer Schwelle liegt (je 10 Punkte um 1, bis `wachstumMax`) */
  chance: 0.2,
  wachstumMax: 2.5,
  abkuehlung: 300,
  frist: 25,
  /** Punkte über der Schwelle, ab denen eine Stätte von der Liste kommt oder wieder öffnet */
  erholung: 10,
  /**
   * Tage nach der Vergabe, die eine Restaurierung ohne jeden Baufortschritt als Pflege gilt. Danach zählt sie nicht mehr: Im Spielstand des
   * Inhabers standen 16 Restaurierungen seit 2036 ohne Fortschritt hinter Kanal İstanbul und Flughäfen in der Reihe, die Stätten verfielen weiter.
   */
  geduld: 365,
  /** Notsicherung: Kapital, Kosten in Prozent des BIP und Punkte, die sie sofort bringt */
  notsicherung: { pk: 2, bip: 0.02, zustand: 10 },
  /** Folgen ohne Antwort (Netzknoten, Tourismus und Erhaltung in der Provinz der Stätte) */
  folgen: {
    gefaehrdet: { ansehen: 1.5, tourismus: 3, identitaet: 0.5, kulturerbe: 0 },
    gestrichen: { ansehen: 3, tourismus: 5, identitaet: 1, kulturerbe: 2 },
    geschlossen: { ansehen: 0.5, tourismus: 2.5, identitaet: 0.5, kulturerbe: 2 },
  },
  /** Zusätzliches Ansehen, das der Verfall einer Stätte von Minderheiten im Ausland kostet */
  minderheit: 1,
  /** Was die Stätte weiter verliert, wenn niemand handelt */
  verfall: 2,
  /** Rückkehr von der Liste oder Wiedereröffnung */
  erholt: { ansehen: 0.5, tourismus: 1 },
} as const;

type ErbeLage = "warnung" | "streichung" | "schliessung";

const startZustand = (e: (typeof ERBE)[number]): number => STAETTEN_START[e.id] ?? (e.unesco.status === "welterbe" ? 66 : e.unesco.status === "tentativ" ? 52 : 46);
const schwelleVon = (e: (typeof ERBE)[number]): number => ERBE_DRUCK.schwelle[e.unesco.status];
const MINDERHEIT = new Set(["christlich", "juedisch", "armenisch", "syrisch"]);

/** Die laufende Restaurierung einer Stätte, falls es eine gibt. */
const restaurierungLauf = (w: World, id: string) => reichZustand(w).laufend.find((l) => l.id === `restaurierung_${id}`);

/** Eine vergebene Restaurierung, an der seit `geduld` Tagen nichts gebaut wurde (sie wartet hinter anderen Vorhaben). */
function steckt(w: World, l: { fortschritt: number; start: string; vergabeBis?: number }): boolean {
  if (l.fortschritt > 0) return false;
  const seit = l.vergabeBis ?? (/^\d{4}-\d{2}-\d{2}$/.test(l.start) ? w.day - Math.round((Date.parse(`${w.date}T00:00:00Z`) - Date.parse(`${l.start}T00:00:00Z`)) / 86_400_000) : w.day);
  return w.day - seit > ERBE_DRUCK.geduld;
}

/** Wie viele Vorhaben desselben Engpasses vor der Restaurierung stehen (jedes kostet beim Vorziehen Verwaltungskraft, sim/reich.ts). */
function vorDerRestaurierung(w: World, id: string): number {
  const z = reichZustand(w);
  const i = z.laufend.findIndex((l) => l.id === `restaurierung_${id}`);
  const def = vorhabenDef(`restaurierung_${id}`);
  if (i < 0 || !def) return 0;
  const pool = bauPool(def);
  return z.laufend.slice(0, i).filter((l) => {
    const v = vorhabenDef(l.id);
    return v && bauPool(v) === pool;
  }).length;
}

/**
 * Stätten, deren Verfall sich meldet: unter der Schwelle, deutlich schlechter als beim Amtsantritt, nicht schon gestrichen oder geschlossen,
 * und ohne Restaurierung, an der gebaut wird (eine, die nur in der Reihe wartet, schützt nach `geduld` Tagen nicht mehr).
 */
export function verfallKandidaten(w: World): (typeof ERBE)[number][] {
  const z = reichZustand(w);
  return ERBE.filter((e) => {
    const st = z.staetten[e.id];
    if (!st || st.lage === "gestrichen" || st.lage === "geschlossen") return false;
    const lauf = restaurierungLauf(w, e.id);
    if (lauf && !steckt(w, lauf)) return false;
    return st.zustand < schwelleVon(e) && st.zustand <= startZustand(e) - ERBE_DRUCK.verlustMin;
  }).sort((a, b) => schwelleVon(b) - (z.staetten[b.id]?.zustand ?? 0) - (schwelleVon(a) - (z.staetten[a.id]?.zustand ?? 0)));
}

function erbeLage(w: World, e: (typeof ERBE)[number]): ErbeLage {
  const st = reichZustand(w).staetten[e.id];
  if (e.unesco.status !== "welterbe" || st?.lage === "gestrichen") return "schliessung";
  return st?.lage === "gefaehrdet" ? "streichung" : "warnung";
}

/** Warum die Restaurierung der Stätte gerade nicht beginnen kann (dieselben Prüfungen wie `beginne`), sonst `null`. */
function restaurierungGrund(w: World, id: string): string | null {
  const s = vorhabenSicht(w, `restaurierung_${id}`);
  if (!s) return t("ev.erbe_verfall.grund.keine");
  if (s.status === "im_bau" || s.status === "pausiert" || s.status === "fertig") return t("ev.erbe_verfall.grund.laeuft");
  const fehlt = s.voraus.filter((x) => !x.erfuellt).map((x) => x.text);
  if (fehlt.length) return fehlt.join("; ");
  if (!kannZahlen(w.spiel?.kapital ?? 0, vergabeAngebot(s.v, "ausschreibung").pk)) return t("ev.erbe_verfall.grund.kapital");
  if (!s.verwaltungOk) return t("ev.erbe_verfall.grund.verwaltung");
  return neuanfangGrund(w) ?? null;
}

/** Folgen, wenn niemand handelt: Liste des gefährdeten Welterbes, Streichung oder Schließung; die Stätte verfällt weiter. */
function verfallStandard(w: World, ev: { daten?: Record<string, number | string>; provinzen: number[] }): string {
  const e = staette(ev);
  const st = reichZustand(w).staetten[e.id];
  const lage = String(ev.daten?.lage ?? "schliessung") as ErbeLage;
  const neu = lage === "warnung" ? "gefaehrdet" : lage === "streichung" ? "gestrichen" : "geschlossen";
  const f = ERBE_DRUCK.folgen[neu];
  if (st) st.lage = neu;
  wirke(w, "ansehen", -f.ansehen - (e.bezug.some((b) => MINDERHEIT.has(b)) ? ERBE_DRUCK.minderheit : 0));
  wirke(w, "tourismus", -f.tourismus, [e.plaka]);
  wirke(w, "identitaet", -f.identitaet);
  if (f.kulturerbe) wirke(w, "kulturerbe", -f.kulturerbe, [e.plaka]);
  hebeStaette(w, e.id, -ERBE_DRUCK.verfall);
  return tSt(`ev.erbe_verfall.${lage}.standard`, stelle(ev));
}

const VERFALL: Vorlage = {
  id: "erbe_verfall",
  eigenerWurf: true,
  ohneZusatzplatz: true,
  szene: "anatolien",
  frist: ERBE_DRUCK.frist,
  abkuehlung: ERBE_DRUCK.abkuehlung,
  chance: (w) => {
    const e = w.spiel ? verfallKandidaten(w)[0] : undefined;
    if (!e) return 0;
    const unter = schwelleVon(e) - (reichZustand(w).staetten[e.id]?.zustand ?? 0);
    return ERBE_DRUCK.chance * clamp(1 + unter / 10, 1, ERBE_DRUCK.wachstumMax);
  },
  erzeuge: (w) => {
    // Gemeldet wird die Stätte, die am weitesten unter ihrer Schwelle liegt; auf Zuruf (Prüfungen) sonst die schlechteste überhaupt
    const z = reichZustand(w);
    const e = verfallKandidaten(w)[0] ?? [...ERBE].sort((a, b) => (z.staetten[a.id]?.zustand ?? 0) - (z.staetten[b.id]?.zustand ?? 0))[0];
    if (!e) return null;
    return { provinzen: [e.plaka], staerke: 1, daten: { staette: e.id, lage: erbeLage(w, e) } };
  },
  titel: (_, ev) => tSt(`ev.erbe_verfall.${String(ev.daten?.lage)}.titel`, stelle(ev)),
  text: (w, ev) => {
    const e = staette(ev);
    const p = { ...stelle(ev), zustand: Math.round(reichZustand(w).staetten[e.id]?.zustand ?? 0), start: Math.round(startZustand(e)), schwelle: schwelleVon(e) };
    const lauf = restaurierungLauf(w, e.id);
    return [
      tSt(`ev.erbe_verfall.${String(ev.daten?.lage)}.text1`, p),
      ...(lauf ? [t("ev.erbe_verfall.steckt", { n: vorDerRestaurierung(w, e.id) })] : []),
      t(e.bezug.some((b) => MINDERHEIT.has(b)) ? "ev.erbe_verfall.text2.minderheit" : `ev.erbe_verfall.${String(ev.daten?.lage)}.text2`),
    ];
  },
  warum: (_, ev) => t("ev.erbe_verfall.warum", { schwelle: schwelleVon(staette(ev)), verlust: ERBE_DRUCK.verlustMin }),
  massnahmen: ["m_denkmalschutz"],
  stelle: (_, ev) => ({ art: "staette", id: staette(ev).id }),
  optionen: (w0, ev) => {
    const e = staette(ev);
    const id = `restaurierung_${e.id}`;
    const def = vorhabenDef(id);
    const hub = def?.abschluss.find((x) => x.t === "staette");
    const n = ERBE_DRUCK.notsicherung;
    const lage = String(ev.daten?.lage);
    const zu = { art: "staette" as const, id: e.id };
    const grund = restaurierungGrund(w0, e.id);
    const lauf = restaurierungLauf(w0, e.id);
    const vor = lauf ? vorDerRestaurierung(w0, e.id) : 0;
    const verwaltung = vor * VORZIEHEN_VERWALTUNG;
    // Wartet die Restaurierung schon in der Reihe, hilft keine neue Ausschreibung, sondern nur das Vorziehen (Verwaltungskraft je überholtem Vorhaben)
    const bau: Option = lauf
      ? { ...opt("vorziehen", t("ev.erbe_verfall.opt.vorziehen.label"), t("ev.erbe_verfall.opt.vorziehen.beschr", { n: vor }), 0, (w) => {
          const n = vorDerRestaurierung(w, e.id);
          for (let i = 0; i < n; i++) if (!verschiebe(w, id, -1).ok) break;
          return tSt("ev.erbe_verfall.opt.vorziehen.ausgang", { ...stelle(ev), n: vorDerRestaurierung(w, e.id) });
        }), stelle: { art: "staette", id: e.id }, bedingungen: [t("ev.erbe_verfall.opt.vorziehen.kosten", { k: verwaltung, n: vor })],
          ...(vor === 0 ? { sperre: t("ev.erbe_verfall.grund.vorne") } : reichZustand(w0).verwaltung < verwaltung ? { sperre: t("ev.erbe_verfall.grund.vorziehen", { k: verwaltung, hat: Math.floor(reichZustand(w0).verwaltung) }) } : {}) }
      : { ...opt("restaurierung", t("ev.erbe_verfall.opt.restaurierung.label"), t(`ev.erbe_verfall.opt.restaurierung.beschr.${lage === "schliessung" ? "behoerde" : "komitee"}`, { d: hub && hub.t === "staette" ? hub.d : 0, monate: def ? vergabeAngebot(def, "ausschreibung").monate : 0 }), 0, (w) => {
          const r = beginne(w, id, "ausschreibung", "ende");
          if (!r.ok) return t("ev.erbe_verfall.opt.restaurierung.gescheitert", { grund: r.text, folge: verfallStandard(w, ev) });
          return tSt("ev.erbe_verfall.opt.restaurierung.ausgang", stelle(ev));
        }), stelle: { art: "staette", id: e.id }, ...(def ? { anzeigePk: vergabeAngebot(def, "ausschreibung").pk } : {}), ...(grund ? { sperre: grund } : {}) };
    return [
      { ...opt("notsicherung", t("ev.erbe_verfall.opt.notsicherung.label"), t(`ev.erbe_verfall.opt.notsicherung.beschr.${lage === "schliessung" ? "behoerde" : "komitee"}`, { n: n.zustand }), n.pk, (w) => {
        kosten(w, n.bip);
        hebeStaette(w, e.id, n.zustand);
        return tSt("ev.erbe_verfall.opt.notsicherung.ausgang", { ...stelle(ev), zustand: Math.round(reichZustand(w).staetten[e.id]?.zustand ?? 0) });
      }), stelle: zu },
      // Die Restaurierung ist das Bauvorhaben aus Kultur › Stätten: Die Vergabe bucht ihr Kapital selbst (die Plakette misst die Buchung)
      bau,
      // Die Folgen in der Provinz der Stätte bewegen den Landesdurchschnitt kaum; sie stehen deshalb eigens da (dieselben Zahlen bucht `verfallStandard`)
      { ...opt("abwarten", t("ev.erbe_verfall.opt.abwarten.label"), t(`ev.erbe_verfall.${lage}.abwarten`), 0, (w) => verfallStandard(w, ev)), stelle: zu,
        bedingungen: [t("ev.erbe_verfall.provinz", { provinz: PROVINZEN[e.plaka - 1]?.name ?? e.ort, tourismus: ERBE_DRUCK.folgen[lage === "warnung" ? "gefaehrdet" : lage === "streichung" ? "gestrichen" : "geschlossen"].tourismus, erhaltung: ERBE_DRUCK.folgen[lage === "warnung" ? "gefaehrdet" : lage === "streichung" ? "gestrichen" : "geschlossen"].kulturerbe })] },
    ];
  },
  standard: (w, ev) => verfallStandard(w, ev),
};

/**
 * Monatlich (aus dem Ereignismotor): Ist eine gemeldete Stätte wieder gepflegt (Schwelle plus Erholung), nimmt das Komitee sie von der Liste
 * des gefährdeten Welterbes oder die Behörde öffnet sie wieder. Eine Streichung bleibt (die UNESCO hat noch keine gestrichene Stätte wieder aufgenommen).
 */
export function erbeLageMonat(w: World): void {
  const sp = w.spiel;
  if (!sp?.reich) return;
  for (const e of ERBE) {
    const st = sp.reich.staetten[e.id];
    if (!st || (st.lage !== "gefaehrdet" && st.lage !== "geschlossen") || st.zustand < schwelleVon(e) + ERBE_DRUCK.erholung) continue;
    const art = st.lage === "gefaehrdet" ? "liste" : "offen";
    delete st.lage;
    wirke(w, "ansehen", ERBE_DRUCK.erholt.ansehen);
    wirke(w, "tourismus", ERBE_DRUCK.erholt.tourismus, [e.plaka]);
    const p = { ad: ad(e), ort: e.ort, mitort: "nein" };
    const titel = tSt(`ev.erbe_verfall.erholt.${art}.titel`, p);
    const ausgang = tSt(`ev.erbe_verfall.erholt.${art}.text`, { ...p, zustand: Math.round(st.zustand) });
    sp.chronik.push({ tag: w.day, datum: w.date, titel, ausgang, art: "bericht", vorlage: "erbe_verfall", presse: { sparte: "ereignis", wertung: 0.4 } });
    addLog(w, "ereignis", titel, ausgang);
  }
}

// ---------------------------------------------------------------------------
// Recht
//
// Bewusst nur das Verfassungsgericht hat ein Besetzungs-Ereignis. Der Richter- und Staatsanwaltsrat (HSK, Sitzmodell 13) verschiebt sich über das
// Reform-Vorhaben `recht_hsk` und den Verfassungsartikel zum Richterrat; ein eigenes Besetzungs-Drama steht für die Welle „Lebendige Gegenüber“
// an (SPIEL_DURCHDACHT_2026-10-05.md, Welle 4). `besetze` kann den HSK bereits.

const ERNENNUNG: Vorlage = {
  id: "recht_ernennung",
  szene: "parlament",
  frist: 20,
  abkuehlung: 330,
  chance: () => 0.05,
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => t("ev.recht_ernennung.titel"),
  text: (w) => {
    const s = reichZustand(w).sitze.aym!;
    return [t("ev.recht_ernennung.text1"), t("ev.recht_ernennung.text2", { loyal: s.loyal, reform: s.reform, unabhaengig: s.unabhaengig })];
  },
  warum: () => t("ev.recht_ernennung.warum"),
  massnahmen: ["m_richterrat"],
  optionen: () => [
    opt("loyal", t("ev.recht_ernennung.opt.loyal.label"), beschr(0, 0, t("ev.recht_ernennung.opt.loyal.beschr")), 0, (w, _e, rng) => {
      besetze(w, "aym", "loyal", rng);
      wirke(w, "justiz_unabhaengigkeit", -1);
      wirke(w, "konservative", 0.5);
      return t("ev.recht_ernennung.opt.loyal.ausgang");
    }),
    opt("unabhaengig", t("ev.recht_ernennung.opt.unabhaengig.label"), beschr(2, 0, t("ev.recht_ernennung.opt.unabhaengig.beschr")), 2, (w, _e, rng) => {
      besetze(w, "aym", "unabhaengig", rng);
      wirke(w, "justiz_unabhaengigkeit", 1.5);
      wirke(w, "ansehen", 1);
      wirke(w, "staedtische_saekulare", 1);
      return t("ev.recht_ernennung.opt.unabhaengig.ausgang");
    }),
    opt("kompromiss", t("ev.recht_ernennung.opt.kompromiss.label"), beschr(3, 0, t("ev.recht_ernennung.opt.kompromiss.beschr")), 3, (w, _e, rng) => {
      besetze(w, "aym", "reform", rng);
      wirke(w, "justiz_unabhaengigkeit", 0.8);
      wirke(w, "polarisierung", -0.5);
      return t("ev.recht_ernennung.opt.kompromiss.ausgang");
    }),
  ],
  standard: (w) => {
    const s = reichZustand(w).sitze.aym!;
    // Der Sitz wird frei und neu besetzt, die Zahl der Richter bleibt gleich: Wer ausscheidet, kommt aus den Unabhängigen, sonst aus den
    // Reformorientierten (früher wuchs das Gericht auf 16 Sitze, wenn keine Unabhängigen mehr saßen). Sitzt nur noch das eigene Lager im Gericht,
    // ersetzt ein Loyaler den anderen.
    const geht = s.unabhaengig > 0 ? "unabhaengig" : s.reform > 0 ? "reform" : null;
    if (geht) {
      s[geht] -= 1;
      s.loyal += 1;
    }
    return t("ev.recht_ernennung.standard");
  },
};

const AYM_GEGEN_KASSATION: Vorlage = {
  id: "recht_aym_kassation",
  szene: "parlament",
  frist: 15,
  abkuehlung: 400,
  chance: (w) => (netz(w, "urteilsbefolgung") < 45 ? 0.025 : 0.006),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => t("ev.recht_aym_kassation.titel"),
  text: () => [t("ev.recht_aym_kassation.text1"), t("ev.recht_aym_kassation.text2")],
  warum: () => t("ev.recht_aym_kassation.warum"),
  massnahmen: ["m_urteilsumsetzung"],
  optionen: () => [
    opt("durchsetzen", t("ev.recht_aym_kassation.opt.durchsetzen.label"), beschr(4, 0, t("ev.recht_aym_kassation.opt.durchsetzen.beschr")), 4, (w) => {
      wirke(w, "urteilsbefolgung", 5);
      wirke(w, "justiz_unabhaengigkeit", 2);
      wirke(w, "strassburg_druck", -2);
      wirke(w, "konservative", -1);
      return t("ev.recht_aym_kassation.opt.durchsetzen.ausgang");
    }),
    opt("kassation", t("ev.recht_aym_kassation.opt.kassation.label"), beschr(0, 0, t("ev.recht_aym_kassation.opt.kassation.beschr")), 0, (w) => {
      wirke(w, "urteilsbefolgung", -4);
      wirke(w, "justiz_unabhaengigkeit", -2);
      wirke(w, "ansehen", -1.5);
      wirke(w, "konservative", 1);
      return t("ev.recht_aym_kassation.opt.kassation.ausgang");
    }),
  ],
  standard: (w) => {
    wirke(w, "urteilsbefolgung", -2);
    wirke(w, "polarisierung", 1);
    return t("ev.recht_aym_kassation.standard");
  },
};

const EGMR_URTEIL: Vorlage = {
  id: "recht_egmr",
  szene: "parlament",
  frist: 20,
  abkuehlung: 300,
  chance: (w) => (netz(w, "strassburg_druck") >= 50 ? 0.035 : 0.01),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => t("ev.recht_egmr.titel"),
  // Zeitlos statt der Jahreszahlen 2025/2026 (Befund A-20): Die Türkei gehört seit Jahren zu den am häufigsten verurteilten Staaten.
  text: () => [t("ev.recht_egmr.text1"), t("ev.recht_egmr.text2")],
  warum: () => t("ev.recht_egmr.warum"),
  massnahmen: ["m_urteilsumsetzung"],
  optionen: () => [
    opt("umsetzen", t("ev.recht_egmr.opt.umsetzen.label"), beschr(3, 0, t("ev.recht_egmr.opt.umsetzen.beschr")), 3, (w) => {
      wirke(w, "urteilsbefolgung", 4);
      wirke(w, "strassburg_druck", -3);
      wirke(w, "konservative", -1.5);
      landAendern(w, "EU", { vertrauen: 2 }, t("ev.recht_egmr.opt.umsetzen.notiz"));
      return t("ev.recht_egmr.opt.umsetzen.ausgang");
    }),
    opt("zurueck", t("ev.recht_egmr.opt.zurueck.label"), beschr(0, 0, t("ev.recht_egmr.opt.zurueck.beschr")), 0, (w) => {
      wirke(w, "strassburg_druck", 3);
      wirke(w, "ansehen", -2);
      wirke(w, "konservative", 1.5);
      landAendern(w, "EU", { vertrauen: -2 }, t("ev.recht_egmr.opt.zurueck.notiz"));
      return t("ev.recht_egmr.opt.zurueck.ausgang");
    }),
  ],
  standard: (w) => {
    wirke(w, "strassburg_druck", 1);
    return t("ev.recht_egmr.standard");
  },
};

const HAFTREVOLTE: Vorlage = {
  id: "recht_haftrevolte",
  szene: "istanbul",
  frist: 8,
  abkuehlung: 360,
  chance: (w) => 0.02 * Math.max(0, netz(w, "haftueberfuellung") / 70) ** 3,
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => t("ev.recht_haftrevolte.titel"),
  // Aus dem Spielstand statt der Belegung vom August 2026 (Befund A-20): Wert des Knotens „Überfüllung der Haftanstalten“.
  text: (w) => [t("ev.recht_haftrevolte.text1"), t("ev.recht_haftrevolte.text2", { wert: Math.round(netz(w, "haftueberfuellung")) })],
  warum: () => t("ev.recht_haftrevolte.warum"),
  massnahmen: ["m_haftvermeidung"],
  optionen: () => [
    opt("verlegen", t("ev.recht_haftrevolte.opt.verlegen.label"), beschr(3, 0.03, t("ev.recht_haftrevolte.opt.verlegen.beschr")), 3, (w) => {
      kosten(w, 0.03);
      wirke(w, "haftueberfuellung", -2);
      wirke(w, "justizvertrauen", 0.5);
      return t("ev.recht_haftrevolte.opt.verlegen.ausgang");
    }),
    opt("haerte", t("ev.recht_haftrevolte.opt.haerte.label"), beschr(0, 0, t("ev.recht_haftrevolte.opt.haerte.beschr")), 0, (w) => {
      wirke(w, "konservative", 1);
      wirke(w, "ansehen", -2);
      wirke(w, "justizvertrauen", -1);
      return t("ev.recht_haftrevolte.opt.haerte.ausgang");
    }),
    opt("vermeidung", t("ev.recht_haftrevolte.opt.vermeidung.label"), beschr(2, 0, t("ev.recht_haftrevolte.opt.vermeidung.beschr")), 2, (w) => {
      wirke(w, "haftueberfuellung", -1);
      wirke(w, "justizvertrauen", 1);
      wirke(w, "konservative", -1);
      return t("ev.recht_haftrevolte.opt.vermeidung.ausgang");
    }),
  ],
  standard: (w) => {
    wirke(w, "justizvertrauen", -1);
    wirke(w, "ansehen", -1);
    return t("ev.recht_haftrevolte.standard");
  },
};

// ---------------------------------------------------------------------------
// Streitkräfte

/** Name des betroffenen Vorhabens (übersetzt), sonst ein allgemeiner Name aus dem Katalog. */
const vorhabenName = (ev: { daten?: Record<string, number | string> }, ersatz: string): string => vorhabenDef(String(ev.daten?.vorhaben))?.name ?? t(ersatz);

const LIEFERVERZUG: Vorlage = {
  id: "mil_lieferverzug",
  szene: "parlament",
  frist: 15,
  abkuehlung: 300,
  chance: (w) => ((w.spiel?.reich?.laufend ?? []).some((l) => vorhabenDef(l.id)?.bereich === "militaer") ? 0.025 : 0),
  erzeuge: (w) => {
    const laeuft = (w.spiel?.reich?.laufend ?? []).map((l) => vorhabenDef(l.id)).filter((v) => v?.bereich === "militaer" && !v.id.startsWith("doktrin"));
    const v = laeuft[0];
    // Welle E4: Der Verzug nennt seinen Grund (sim/ereignisse-ruestung.ts, `verzugsGrund`), ohne Zug aus dem Zufallsstrom
    return v ? { provinzen: [], staerke: 1, daten: { vorhaben: v.id, grund: verzugsGrund(w, v.id) } } : null;
  },
  titel: (_, ev) => t("ev.mil_lieferverzug.titel", { name: vorhabenName(ev, "ev.mil_lieferverzug.unbekannt") }),
  text: (_, ev) => [
    ev.daten?.grund ? t(`welle_e4.verzug.grund.${String(ev.daten.grund)}`, { name: vorhabenName(ev, "ev.mil_lieferverzug.unbekannt") }) : t("ev.mil_lieferverzug.text1", { name: vorhabenName(ev, "ev.mil_lieferverzug.unbekannt") }),
    t("ev.mil_lieferverzug.text2"),
  ],
  warum: () => t("ev.mil_lieferverzug.warum"),
  massnahmen: ["m_ruestungsindustrie"],
  optionen: (_, ev) => [
    opt("druck", t("ev.mil_lieferverzug.opt.druck.label"), beschr(2, 0, t("ev.mil_lieferverzug.opt.druck.beschr")), 2, (w) => {
      const l = reichZustand(w).laufend.find((x) => x.id === String(ev.daten?.vorhaben));
      if (l) l.fortschritt += (vorhabenDef(l.id)?.kosten.bau ?? 0) * 0.03;
      wirke(w, "beziehungen_usa", -0.5);
      return t("ev.mil_lieferverzug.opt.druck.ausgang");
    }),
    opt("hinnehmen", t("ev.mil_lieferverzug.opt.hinnehmen.label"), beschr(0, 0, t("ev.mil_lieferverzug.opt.hinnehmen.beschr")), 0, (w) => {
      const l = reichZustand(w).laufend.find((x) => x.id === String(ev.daten?.vorhaben));
      if (l) l.fortschritt = Math.max(0, l.fortschritt - (vorhabenDef(l.id)?.kosten.bau ?? 0) * 0.05);
      wirke(w, "bereitschaft_luft", -0.5);
      return t("ev.mil_lieferverzug.opt.hinnehmen.ausgang");
    }),
    opt("eigen", t("ev.mil_lieferverzug.opt.eigen.label"), beschr(3, 0.05, t("ev.mil_lieferverzug.opt.eigen.beschr")), 3, (w) => {
      kosten(w, 0.05);
      wirke(w, "ruestungsautarkie", 2);
      const l = reichZustand(w).laufend.find((x) => x.id === String(ev.daten?.vorhaben));
      if (l) l.fortschritt = Math.max(0, l.fortschritt - (vorhabenDef(l.id)?.kosten.bau ?? 0) * 0.03);
      return t("ev.mil_lieferverzug.opt.eigen.ausgang");
    }),
  ],
  standard: (w, ev) => {
    const l = reichZustand(w).laufend.find((x) => x.id === String(ev.daten?.vorhaben));
    if (l) l.fortschritt = Math.max(0, l.fortschritt - (vorhabenDef(l.id)?.kosten.bau ?? 0) * 0.04);
    return t("ev.mil_lieferverzug.standard");
  },
};

const MILITAERRAT: Vorlage = {
  id: "mil_militaerrat",
  szene: "parlament",
  frist: 20,
  abkuehlung: 330,
  chance: (w) => (monatVon(w) === 8 ? 0.7 : 0),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => t("ev.mil_militaerrat.titel"),
  // Ohne Schätzwerte zu den Entlassungen nach 2016 (Befund A-20): nur der geschichtliche Hintergrund.
  text: () => [t("ev.mil_militaerrat.text1"), t("ev.mil_militaerrat.text2")],
  warum: () => t("ev.mil_militaerrat.warum"),
  massnahmen: ["m_offiziersauswahl"],
  optionen: () => [
    opt("leistung", t("ev.mil_militaerrat.opt.leistung.label"), beschr(3, 0, t("ev.mil_militaerrat.opt.leistung.beschr")), 3, (w) => {
      wirke(w, "offiziersvertrauen", 4);
      wirke(w, "truppenmoral", 2);
      wirke(w, "bereitschaft_heer", 1);
      return t("ev.mil_militaerrat.opt.leistung.ausgang");
    }),
    // Befund A (5. November): Die Antwort bucht 3 Kapital Gewinn; die Plakette zeigt das aus der Messung, der Text behauptet keinen Preis.
    opt("loyalitaet", t("ev.mil_militaerrat.opt.loyalitaet.label"), beschr(0, 0, t("ev.mil_militaerrat.opt.loyalitaet.beschr")), 0, (w) => {
      wirke(w, "offiziersvertrauen", -3);
      wirke(w, "bereitschaft_heer", -1);
      vertrauenAendern(w, 0.5);
      if (w.spiel) w.spiel.kapital = clamp(w.spiel.kapital + 3, 0, 150);
      return t("ev.mil_militaerrat.opt.loyalitaet.ausgang");
    }),
    opt("generalstab", t("ev.mil_militaerrat.opt.generalstab.label"), beschr(1, 0, t("ev.mil_militaerrat.opt.generalstab.beschr")), 1, (w) => {
      wirke(w, "offiziersvertrauen", 1);
      wirke(w, "truppenmoral", 1);
      return t("ev.mil_militaerrat.opt.generalstab.ausgang");
    }),
  ],
  standard: (w) => {
    wirke(w, "offiziersvertrauen", -1);
    return t("ev.mil_militaerrat.standard");
  },
};

// ---------------------------------------------------------------------------
// Infrastruktur

const BAUUNFALL: Vorlage = {
  id: "infra_bauunfall",
  szene: "anatolien",
  frist: 10,
  abkuehlung: 360,
  chance: (w) => {
    const z = w.spiel?.reich;
    const n = (z?.laufend ?? []).filter((l) => vorhabenDef(l.id)?.bereich === "infrastruktur").length;
    return n >= 1 ? 0.012 + (z && z.verwaltung < 30 ? 0.02 : 0) : 0;
  },
  erzeuge: (w) => {
    const l = (w.spiel?.reich?.laufend ?? []).map((x) => vorhabenDef(x.id)).find((v) => v?.bereich === "infrastruktur");
    return l ? { provinzen: l.provinzen?.slice(0, 1) ?? [], staerke: 1, daten: { vorhaben: l.id } } : null;
  },
  titel: (_, ev) => t("ev.infra_bauunfall.titel", { name: vorhabenName(ev, "ev.infra_bauunfall.unbekannt") }),
  text: (_, ev) => [t("ev.infra_bauunfall.text1", { name: vorhabenName(ev, "ev.infra_bauunfall.unbekannt") }), t("ev.infra_bauunfall.text2")],
  warum: () => t("ev.infra_bauunfall.warum"),
  massnahmen: ["m_gewerkschaftsrechte", "m_bauaufsicht"],
  optionen: (_, ev) => [
    opt("aufklaeren", t("ev.infra_bauunfall.opt.aufklaeren.label"), beschr(3, 0, t("ev.infra_bauunfall.opt.aufklaeren.beschr")), 3, (w) => {
      wirke(w, "arbeitnehmer", 1.5);
      wirke(w, "zivilgesellschaft", 0.5);
      const l = reichZustand(w).laufend.find((x) => x.id === String(ev.daten?.vorhaben));
      if (l) l.fortschritt = Math.max(0, l.fortschritt - (vorhabenDef(l.id)?.kosten.bau ?? 0) * 0.03);
      return t("ev.infra_bauunfall.opt.aufklaeren.ausgang");
    }),
    opt("decken", t("ev.infra_bauunfall.opt.decken.label"), beschr(0, 0, t("ev.infra_bauunfall.opt.decken.beschr")), 0, (w) => {
      wirke(w, "korruption", 1.5);
      wirke(w, "arbeitnehmer", -3);
      wirke(w, "legitimitaet", -1);
      return t("ev.infra_bauunfall.opt.decken.ausgang");
    }),
  ],
  standard: (w) => {
    wirke(w, "arbeitnehmer", -1.5);
    wirke(w, "legitimitaet", -0.5);
    return t("ev.infra_bauunfall.standard");
  },
};

export const REICH_VORLAGEN: Vorlage[] = [
  RAUBGRABUNG,
  ERDBEBENSCHADEN,
  UNESCO,
  FUND,
  HAGIA_SOPHIA,
  PILGERWELLE,
  VERFALL,
  ERNENNUNG,
  AYM_GEGEN_KASSATION,
  EGMR_URTEIL,
  HAFTREVOLTE,
  LIEFERVERZUG,
  MILITAERRAT,
  BAUUNFALL,
];

// Bereiche, die der Präsident liegen lässt, melden sich selbst (Welle H3, 6. November 2026).
//
// Befund aus dem Spielstand des Inhabers (dokumentation/analyse_2026-11-05/SPIELSTAND_2039.md): 10,7 Jahre ohne einen Medieneingriff,
// ohne ein Wort zur Zentralbank und ohne Pflege der Kulturstätten, und nichts davon hatte Folgen. Zwei Vorgänge stehen hier, der dritte
// (Verfall einer Stätte) in sim/ereignisse-reich.ts bei den übrigen Erbe-Vorgängen:
//
//   medien_kampagne        Ein kritisches Haus greift die Regierung an, wenn sie lange keine Medienarbeit gemacht hat. Wie stark, hängt vom
//                          Publikum des Hauses und vom Pressefreiheitswert ab.
//   zentralbank_vertrauen  Die Märkte zweifeln an der Notenbank (geringe Glaubwürdigkeit) oder der Wirtschaftsflügel verlangt niedrigere Zinsen
//                          (verfehltes Inflationsziel), wenn sich der Präsident lange nicht zur Bank verhalten hat.
//
// Jede Antwort wirkt über die vorhandenen Wege: die Medieneingriffe aus sim/medien.ts, die Eingriffe der Zentralbank aus
// sim/zentralbank.ts, das Rating aus sim/maerkte.ts und die Netzknoten. Jede nennt die Stelle, an der man dasselbe selbst in der Hand hat
// (Option.stelle). Alle Schwellen, Häufigkeiten und Wirkungen sind Spielparameter, keine Messwerte.

import { t } from "../i18n";
import { RSF_START, medienCluster } from "../data/medien";
import { AKTIONEN, fuehreMedienAktionAus, medienAktionen, medienVon, publikumsAnteile, rsfSicht, type AktionId } from "./medien";
import { STUFEN, druckGrund, druckWirkung, ernenneGouverneur, glaubwuerdigkeitWort, gouverneurGrund, machDruck, naechsteSitzung, stufeGrund, stufenPreis, aendereStufe } from "./zentralbank";
import { ratingAendere, ratingDruck, ratingSicht } from "./maerkte";
import { blattDef } from "./zeitung";
import { zbZustand } from "./wirtschaft";
import { anrede, figur, loyalitaetAendern } from "./figuren";
import { hashWert } from "./aufmerksamkeit";
import { vertrauenAendern, wirke } from "./wirkung";
import { clamp } from "./economy";
import { netz, nf, opt } from "./ereignis-hilfen";
import type { Option, Vorlage } from "./ereignis-hilfen";
import type { Unabhaengigkeit } from "./wirtschaft-typen";
import type { OffenesEreignis } from "./spiel-typen";
import type { World } from "./types";

// ---------------------------------------------------------------------------
// Spielparameter

export const BEREICHSDRUCK = {
  medien: {
    /** So viele Tage ohne jeden Medieneingriff (auch keine Pressekonferenz, kein Interview), dann gilt der Bereich als vernachlässigt */
    ruheTage: 300,
    /**
     * Chance je Monat bei Vernachlässigung. Sie wächst mit dem Publikumsanteil der kritischen Häuser (Bezug: Anteil beim Start, 0,44) und mit der
     * Dauer des Schweigens, bis zum Faktor `wachstumMax` (bei der Dauer `ruheTage` mal `wachstumMax`).
     */
    chance: 0.2,
    wachstumMax: 2.5,
    kritischBezug: 0.44,
    /** Publikumsanteil des größten kritischen Hauses beim Start (0,20): Bezug der Stärke */
    hausBezug: 0.2,
    abkuehlung: 330,
    frist: 12,
    /** Vertrauen in die Regierung, das eine unbeantwortete Kampagne kostet (mal Stärke) */
    schaden: 2.5,
    /** Leserschaft der kritischen Häuser: so viel verlieren diese Gruppen zusätzlich (mal Stärke) */
    gruppen: { staedtische_saekulare: 0.8, junge: 0.5 } as Record<string, number>,
    /** Anteil des Schadens, der nach einer Pressekonferenz oder einem Interview bleibt */
    nachPressekonferenz: 0.5,
    nachInterview: 0.25,
    /** Reichweite, die das Haus gewinnt, wenn die Regierung schweigt (Faktor, Start 1) */
    reichweite: 0.05,
  },
  zentralbank: {
    /** So viele Tage ohne Gespräch, Rede, Kritik, Neubesetzung oder Gesetz zur Bank, dann gilt die Bank als sich selbst überlassen */
    pflegeTage: 270,
    /** Unter dieser Glaubwürdigkeit (0 bis 1) zweifeln die Märkte an der Bank */
    glaubwuerdigkeit: 0.25,
    /** Ab dieser Inflation, mindestens aber so weit über dem Zwischenziel der Bank, gilt das Ziel als verfehlt */
    inflationMin: 12,
    inflationAbstand: 7,
    /** Ab diesem Realzins (Leitzins minus Inflation, Prozentpunkte) und unter diesem Wachstum (Prozent) drängt der Wirtschaftsflügel auf Senkung */
    realzins: 4,
    wachstum: 3.5,
    /** Erholung (kein Agenturvorgang): Realzins über 1 Punkt (wie in sim/economy.ts) und Inflation 1 Punkt unter dem Stand vor 6 Monaten */
    erholung: { realzins: 1, punkte: 1, monate: 6 },
    /** Chance je Monat; sie wächst mit der Dauer des Schweigens bis zum Faktor `wachstumMax` */
    chance: 0.2,
    wachstumMax: 2.5,
    abkuehlung: 300,
    frist: 14,
    /** Kapital für eine öffentliche Rede zur Stützung der Bank (der Weg in der Zentralbankakte ist kostenlos; hier antwortet der Präsident auf Zuruf) */
    stuetzenPk: 1,
    /** Punkte des Bonitätsmaßstabs, um die die Agentur milder urteilt, wenn der Präsident die Bank stützt oder die Führung stärkt (sim/maerkte.ts) */
    ratingMilder: 3,
    /**
     * Wie echte Agenturen erst den Ausblick senken und danach die Note: Beim ersten Schweigen wird der Maßstab um eine halbe Stufe strenger
     * (5 Punkte; ab einer halben Stufe Abstand zeigt das Rating den Ausblick „negativ“, sim/maerkte.ts). Erst beim zweiten Schweigen folgt die Herabstufung.
     */
    ausblickPunkte: 5,
    /** Schweigen zum Wirtschaftsflügel: Unternehmer und Rückhalt des Wirtschaftsministers */
    schweigen: { unternehmer: 1, loyalitaet: 4 },
    /** Wer dem Wirtschaftsflügel nachgibt (Gespräch, neue Führung), gewinnt Unternehmer und Minister; wer die Bank stützt, verärgert den Minister */
    gespraech: { unternehmer: 1, loyalitaet: 3 },
    austausch: { unternehmer: 2, loyalitaet: 5 },
    stuetzen: { loyalitaet: 3 },
  },
} as const;

const tageSeit = (w: World, tag: number | undefined): number => w.day - Math.max(0, tag ?? 0);

// ---------------------------------------------------------------------------
// Medien: Ein kritisches Haus greift an

/** Letzter Tag eines Medieneingriffs (jede Art zählt: wer Medien bearbeitet, ob mit Interview oder mit Aufsicht, lässt sie nicht liegen). */
export function letzteMedienarbeit(w: World): number {
  const e = w.spiel?.medien?.eingriffe ?? [];
  return e.length ? Math.max(...e.map((x) => x.tag)) : 0;
}

/** Das kritische Haus mit dem größten Publikum, das gerade erscheint; `null`, wenn alle kritischen Häuser gesperrt sind. */
export function angreifer(w: World): { id: string; anteil: number } | null {
  const kritisch = publikumsAnteile(w).filter((a) => a.lager === "kritisch" && a.anteil > 0);
  if (!kritisch.length) return null;
  const best = kritisch.reduce((a, b) => (b.anteil > a.anteil ? b : a));
  return { id: best.id, anteil: best.anteil };
}

const kritischerAnteil = (w: World): number => publikumsAnteile(w).filter((a) => a.lager === "kritisch").reduce((s, a) => s + a.anteil, 0);

/** Stärke der Kampagne: Publikum des Hauses (Bezug: das größte kritische Haus beim Start) und Pressefreiheit (je freier, desto mehr trägt der Vorwurf). */
export function kampagnenStaerke(w: World, anteil: number): number {
  const p = BEREICHSDRUCK.medien;
  const rsf = rsfSicht(w).score;
  return clamp((anteil / p.hausBezug) * (0.6 + (0.4 * rsf) / RSF_START.score), 0.3, 1.8);
}

/** Womit das Haus angreift: die Größe, die gerade am schlechtesten steht (Zahl aus dem Weltzustand), sonst der Regierungsstil. */
function kampagnenThema(w: World): { thema: string; wert: number } {
  const kandidaten = [
    { thema: "inflation", wert: w.published.inflation.value, bezug: 10 },
    { thema: "arbeit", wert: w.economy.unemployment, bezug: 9 },
    { thema: "korruption", wert: netz(w, "korruption"), bezug: 50 },
    { thema: "wohnen", wert: netz(w, "p_wohnungsnot"), bezug: 50 },
  ].filter((k) => Number.isFinite(k.wert));
  const schlimmst = kandidaten.reduce<(typeof kandidaten)[number] | null>((a, b) => (b.wert / b.bezug > (a ? a.wert / a.bezug : 1) ? b : a), null);
  return schlimmst ? { thema: schlimmst.thema, wert: Math.round(schlimmst.wert * 10) / 10 } : { thema: "stil", wert: 0 };
}

/** Der Titel des Hauses, wie ihn Zeitung und Medienakte nennen (sim/zeitung.ts, `blattDef`). */
const blattName = (ev: OffenesEreignis): string => (medienCluster(String(ev.daten?.blatt ?? "")) ? blattDef(String(ev.daten?.blatt)).name : t("welle_h3.medien.einHaus"));

/** Was die Kampagne kostet: Vertrauen und die Leserschaft der kritischen Häuser, mal Stärke und dem Anteil, der nach der Antwort bleibt. */
function kampagnenSchaden(w: World, ev: OffenesEreignis, anteil: number): void {
  const p = BEREICHSDRUCK.medien;
  const s = ev.staerke * anteil;
  if (s <= 0) return;
  vertrauenAendern(w, -p.schaden * s);
  for (const [g, d] of Object.entries(p.gruppen)) wirke(w, g, -d * s);
}

/** Eine Antwort über einen echten Medieneingriff: Preis, Aufmerksamkeit und Sperrgrund stehen dort, wo die Medienakte sie auch nennt. */
function medienAntwort(w0: World, id: string, aktion: AktionId, cluster: string | undefined, rest: number, label: string, beschreibung: string): Option {
  const sicht = medienAktionen(w0).find((s) => s.aktion === aktion && s.cluster === cluster);
  const a = AKTIONEN[aktion];
  const o = opt(id, label, beschreibung, 0, (w, ev) => {
    const r = fuehreMedienAktionAus(w, aktion, cluster);
    if (!r.ok) {
      kampagnenSchaden(w, ev, 1);
      return t("welle_h3.medien.ausgang.gescheitert", { grund: r.text, blatt: blattName(ev) });
    }
    kampagnenSchaden(w, ev, rest);
    return t(`welle_h3.medien.opt.${id}.ausgang`, { blatt: blattName(ev), ergebnis: r.text });
  });
  return {
    ...o,
    anzeigePk: a.kapital,
    aufmerksamkeit: a.aufmerksamkeit,
    stelle: { art: "medien", ...(cluster ? { cluster } : {}) },
    ...(sicht && !sicht.moeglich ? { sperre: sicht.grund ?? t("medien.fehler.nicht_moeglich") } : !sicht ? { sperre: t("medien.fehler.nicht_moeglich") } : {}),
    ...(rest > 0 ? { bedingungen: [t("welle_h3.medien.rest", { prozent: Math.round(rest * 100) })] } : {}),
  };
}

const MEDIEN_KAMPAGNE: Vorlage = {
  id: "medien_kampagne",
  eigenerWurf: true,
  ohneZusatzplatz: true,
  szene: "istanbul",
  frist: BEREICHSDRUCK.medien.frist,
  abkuehlung: BEREICHSDRUCK.medien.abkuehlung,
  chance: (w) => {
    const p = BEREICHSDRUCK.medien;
    if (!w.spiel || tageSeit(w, letzteMedienarbeit(w)) < p.ruheTage || !angreifer(w)) return 0;
    const dauer = clamp(tageSeit(w, letzteMedienarbeit(w)) / p.ruheTage, 1, p.wachstumMax);
    return p.chance * dauer * clamp(kritischerAnteil(w) / p.kritischBezug, 0.3, 1.5);
  },
  erzeuge: (w) => {
    const a = angreifer(w);
    if (!a) return null;
    const th = kampagnenThema(w);
    return { provinzen: [], staerke: kampagnenStaerke(w, a.anteil), daten: { blatt: a.id, anteil: Math.round(a.anteil * 1000) / 10, thema: th.thema, wert: th.wert, monate: Math.max(1, Math.round(tageSeit(w, letzteMedienarbeit(w)) / 30)) } };
  },
  titel: (_, ev) => t("welle_h3.medien.titel", { blatt: blattName(ev) }),
  text: (w, ev) => [
    t(`welle_h3.medien.text1.${String(ev.daten?.thema ?? "stil")}`, { blatt: blattName(ev), wert: Number(ev.daten?.wert ?? 0), monate: Number(ev.daten?.monate ?? 1) }),
    t("welle_h3.medien.text2", { anteil: Number(ev.daten?.anteil ?? 0), rsf: rsfSicht(w).score, rang: rsfSicht(w).rang, wer: anrede(figur(w, "stab")) }),
  ],
  warum: (_, ev) => t("welle_h3.medien.warum", { monate: Number(ev.daten?.monate ?? 1) }),
  stelle: (_, ev) => ({ art: "medien", ...(ev.daten?.blatt ? { cluster: String(ev.daten.blatt) } : {}) }),
  optionen: (w, ev) => {
    const p = BEREICHSDRUCK.medien;
    const blatt = String(ev.daten?.blatt ?? "");
    const c = medienCluster(blatt);
    const aufsicht: AktionId = c?.verwundbarkeit.includes("lizenz") ? "aufsichtsstrafe" : "verfahren";
    return [
      medienAntwort(w, "pressekonferenz", "pressekonferenz", undefined, p.nachPressekonferenz, t("welle_h3.medien.opt.pressekonferenz.label"), t("welle_h3.medien.opt.pressekonferenz.beschr")),
      medienAntwort(w, "interview", "interview", c ? blatt : undefined, p.nachInterview, t("welle_h3.medien.opt.interview.label", { blatt: blattName(ev) }), t("welle_h3.medien.opt.interview.beschr", { blatt: blattName(ev) })),
      medienAntwort(w, aufsicht, aufsicht, c ? blatt : undefined, 0, t(`welle_h3.medien.opt.${aufsicht}.label`), t(`welle_h3.medien.opt.${aufsicht}.beschr`, { blatt: blattName(ev) })),
      { ...opt("abwarten", t("welle_h3.medien.opt.abwarten.label"), t("welle_h3.medien.opt.abwarten.beschr", { blatt: blattName(ev) }), 0, (ww, e) => kampagneStandard(ww, e)), stelle: { art: "medien", ...(c ? { cluster: blatt } : {}) } },
    ];
  },
  standard: (w, ev) => kampagneStandard(w, ev),
};

/** Schweigen: Die Kampagne verfängt, und das Haus gewinnt Leser (sichtbar in der Medienakte als Reichweite). */
function kampagneStandard(w: World, ev: OffenesEreignis): string {
  kampagnenSchaden(w, ev, 1);
  const z = medienVon(w).cluster[String(ev.daten?.blatt ?? "")];
  if (z) z.reichweite = clamp(z.reichweite + BEREICHSDRUCK.medien.reichweite, 0.1, 1.6);
  return t("welle_h3.medien.standard", { blatt: blattName(ev) });
}

// ---------------------------------------------------------------------------
// Zentralbank: Die Märkte zweifeln, oder der Wirtschaftsflügel drängt

/** Letzter Tag, an dem sich der Präsident zur Bank verhalten hat: Gespräch, Rede, Kritik, Neubesetzung, Gesetz zur Unabhängigkeit. */
export function letzterZbKontakt(w: World): number {
  const z = w.spiel?.wirtschaft?.zb;
  if (!z) return 0;
  return Math.max(0, z.gespraech ?? 0, z.gouverneurGeaendert ?? 0, z.stufeGeaendert ?? 0, ...z.kritikTage, z.druck?.tag ?? 0, ...z.sitzungen.map((s) => s.druck?.tag ?? 0));
}

/**
 * Welche Lage nach der Bank ruft: geringe Glaubwürdigkeit (die Märkte zweifeln), verfehltes Inflationsziel oder ein hoher Realzins bei schwachem
 * Wachstum (in beiden Fällen drängt der Wirtschaftsflügel auf Senkung); `null`, wenn keine.
 */
export function zbLage(w: World): "glaubwuerdigkeit" | "inflation" | "zins" | null {
  const p = BEREICHSDRUCK.zentralbank;
  const e = w.economy;
  const infl = w.published.inflation.value;
  // Geringe Glaubwürdigkeit ruft die Agenturen nur, solange sie sich nicht erholt: Bei positivem Realzins und sinkender Inflation (so baut
  // sim/economy.ts die Glaubwürdigkeit wieder auf) warten echte Agenturen ab, statt zu drohen
  if (e.credibility < p.glaubwuerdigkeit && !erholtSich(w)) return "glaubwuerdigkeit";
  if (infl >= Math.max(p.inflationMin, e.inflationTarget + p.inflationAbstand)) return "inflation";
  if (e.policyRate - infl >= p.realzins && e.growth < p.wachstum) return "zins";
  return null;
}

const pz = (x: number): number => Math.round(x * 10) / 10;

/** Ob die Glaubwürdigkeit gerade wächst: Realzins über `erholung.realzins` und die Inflation mindestens `erholung.punkte` unter dem Stand vor `erholung.monate` Monaten. */
function erholtSich(w: World): boolean {
  const q = BEREICHSDRUCK.zentralbank.erholung;
  const h = w.history;
  const frueher = h[h.length - 1 - q.monate];
  const infl = w.economy.inflation;
  return !!frueher && w.economy.policyRate - infl > q.realzins && infl < frueher.inflation - q.punkte;
}

/** Die nächste Zinssitzung nach heutigem Stand mit diesem Druck: dieselbe Rechnung, die die Sitzung bucht (sim/zentralbank.ts, `druckWirkung`). */
function sitzungsZeile(w: World, richtung: -1 | 1, weg: "gespraech" | "rede"): string[] {
  const s = naechsteSitzung(w);
  if (!s) return [];
  const d = druckWirkung(w, richtung, weg);
  return [d.abweichung !== 0 ? t("welle_h3.zb.sitzung.anders", { tage: s.tage, neu: d.neu, regel: d.regel }) : t("welle_h3.zb.sitzung.gleich", { tage: s.tage, regel: d.regel })];
}

function zbOption(base: Option, stelle: NonNullable<Option["stelle"]>, sperre: string | null, extra: Partial<Option> = {}): Option {
  return { ...base, stelle, ...(sperre ? { sperre } : {}), ...extra };
}

/** Die nächste Stufe hin zur Unabhängigkeit (C → B, B → A); `null`, wenn die Bank schon gesetzlich geschützt ist. */
const naechsteStufe = (s: Unabhaengigkeit): Unabhaengigkeit | null => (s === "C" ? "B" : s === "B" ? "A" : null);

const ZB_VERTRAUEN: Vorlage = {
  id: "zentralbank_vertrauen",
  eigenerWurf: true,
  ohneZusatzplatz: true,
  szene: "bank",
  frist: BEREICHSDRUCK.zentralbank.frist,
  abkuehlung: BEREICHSDRUCK.zentralbank.abkuehlung,
  chance: (w) => {
    const p = BEREICHSDRUCK.zentralbank;
    if (!w.spiel || tageSeit(w, letzterZbKontakt(w)) < p.pflegeTage || !zbLage(w)) return 0;
    return p.chance * clamp(tageSeit(w, letzterZbKontakt(w)) / p.pflegeTage, 1, p.wachstumMax);
  },
  erzeuge: (w) => {
    const lage = zbLage(w) ?? "inflation";
    // Die Agentur ebenfalls ohne den Zufallsstrom der Partie (eigener Wurf, siehe Vorlage.eigenerWurf)
    const agenturen = ["Fitch", "Moody's", "S&P Global Ratings"];
    const staerke = lage === "glaubwuerdigkeit" ? 1 + clamp((BEREICHSDRUCK.zentralbank.glaubwuerdigkeit - w.economy.credibility) * 2, 0, 0.5) : 1;
    return { provinzen: [], staerke, daten: { lage, agentur: agenturen[Math.floor(hashWert(`${w.seed}|agentur|${w.day}`) * agenturen.length)]!, monate: Math.max(1, Math.round(tageSeit(w, letzterZbKontakt(w)) / 30)) } };
  },
  titel: (_, ev) => t(`welle_h3.zb.${String(ev.daten?.lage)}.titel`, { agentur: String(ev.daten?.agentur ?? "") }),
  text: (w, ev) => {
    const e = w.economy;
    const p = { agentur: String(ev.daten?.agentur ?? ""), wort: glaubwuerdigkeitWort(e.credibility), glaub: Math.round(e.credibility * 100), inflation: pz(w.published.inflation.value), zins: pz(e.policyRate), ziel: pz(e.inflationTarget), real: pz(e.policyRate - w.published.inflation.value), wachstum: pz(e.growth), monate: Number(ev.daten?.monate ?? 1), wer: anrede(figur(w, "wirtschaft")), bank: anrede(figur(w, "zentralbank")) };
    const ausblick = String(ev.daten?.lage) === "glaubwuerdigkeit" && w.spiel?.wirtschaft?.zb.ausblickNegativ !== undefined;
    return [t(`welle_h3.zb.${String(ev.daten?.lage)}.text1`, p), t(ausblick ? "welle_h3.zb.glaubwuerdigkeit.text2Ausblick" : `welle_h3.zb.${String(ev.daten?.lage)}.text2`, p)];
  },
  warum: (_, ev) => t("welle_h3.zb.warum", { monate: Number(ev.daten?.monate ?? 1) }),
  stelle: () => ({ art: "zentralbank", abschnitt: "sitzung" }),
  optionen: (w, ev) => {
    const p = BEREICHSDRUCK.zentralbank;
    // Hoher Realzins und verfehltes Ziel stellen dieselbe Frage (nachgeben oder die Bank stützen), daher dieselben Antworten
    const lage = String(ev.daten?.lage) === "glaubwuerdigkeit" ? "glaubwuerdigkeit" : "inflation";
    const k = (s: string) => `welle_h3.zb.${lage}.opt.${s}`;
    const z = zbZustand(w);
    const out: Option[] = [];
    // Öffentlich stützen: derselbe Weg wie „Rede: strenge Linie stützen“ in der Zentralbankakte
    out.push(zbOption(opt("stuetzen", t(k("stuetzen.label")), t(k("stuetzen.beschr")), p.stuetzenPk, (ww) => {
      const r = machDruck(ww, 1, "rede");
      if (lage === "glaubwuerdigkeit") ausblickStabil(ww);
      else loyalitaetAendern(ww, "wirtschaft", -p.stuetzen.loyalitaet, t("welle_h3.zb.grund.stuetzen"));
      return t(k("stuetzen.ausgang"), { ergebnis: r.text });
    }), { art: "zentralbank", abschnitt: "sitzung" }, druckGrund(w, "rede"), { bedingungen: sitzungsZeile(w, 1, "rede") }));
    if (lage === "glaubwuerdigkeit") {
      // Eine erfahrene, strenge Führung (nur, wenn die heutige es nicht schon ist)
      if (w.governor.stance !== "vorsichtig") {
        out.push(zbOption(opt("fuehrung", t(k("fuehrung.label")), t(k("fuehrung.beschr")), 0, (ww) => {
          const r = ernenneGouverneur(ww, "vorsichtig");
          if (r.ok) ausblickStabil(ww);
          return t(k("fuehrung.ausgang"), { ergebnis: r.text });
        }), { art: "zentralbank", abschnitt: "gouverneur" }, gouverneurGrund(w, "vorsichtig")));
      }
      // Die Unabhängigkeit per Gesetz stärken: derselbe Weg wie in der Zentralbankakte, mit Mehrheit und Kapital
      const ziel = naechsteStufe(z.stufe);
      if (ziel) {
        const preis = stufenPreis(z.stufe, ziel) ?? 0;
        out.push(zbOption(opt("gesetz", t(k("gesetz.label"), { stufe: STUFEN[ziel].name }), t(k("gesetz.beschr")), 0, (ww) => {
          const r = aendereStufe(ww, ziel);
          if (r.ok) ausblickStabil(ww);
          return t(k("gesetz.ausgang"), { ergebnis: r.text });
        }), { art: "zentralbank", abschnitt: "stufe" }, stufeGrund(w, ziel), { anzeigePk: preis }));
      }
    } else {
      // Dem Wirtschaftsflügel nachgeben: vertraulich auf Senkung drängen (1 Kapital, gebucht vom Gespräch selbst) …
      out.push(zbOption(opt("gespraech", t(k("gespraech.label")), t(k("gespraech.beschr")), 0, (ww) => {
        const r = machDruck(ww, -1, "gespraech");
        if (r.ok) {
          wirke(ww, "unternehmer", p.gespraech.unternehmer);
          loyalitaetAendern(ww, "wirtschaft", p.gespraech.loyalitaet, t("welle_h3.zb.grund.gehoert"));
        }
        return t(k("gespraech.ausgang"), { ergebnis: r.text });
      }), { art: "zentralbank", abschnitt: "sitzung" }, druckGrund(w, "gespraech"), { anzeigePk: 1, bedingungen: sitzungsZeile(w, -1, "gespraech") }));
      // … oder die Führung austauschen (gefügig): derselbe Weg wie in der Zentralbankakte
      if (w.governor.stance !== "gefuegig") {
        out.push(zbOption(opt("austauschen", t(k("austauschen.label")), t(k("austauschen.beschr")), 0, (ww) => {
          const r = ernenneGouverneur(ww, "gefuegig");
          if (r.ok) {
            wirke(ww, "unternehmer", p.austausch.unternehmer);
            loyalitaetAendern(ww, "wirtschaft", p.austausch.loyalitaet, t("welle_h3.zb.grund.gehoert"));
          }
          return t(k("austauschen.ausgang"), { ergebnis: r.text });
        }), { art: "zentralbank", abschnitt: "gouverneur" }, gouverneurGrund(w, "gefuegig")));
      }
    }
    const zweites = lage === "glaubwuerdigkeit" && z.ausblickNegativ !== undefined;
    out.push(zbOption(opt("abwarten", t(k("abwarten.label")), t(zweites ? k("abwarten.beschrHerab") : k("abwarten.beschr")), 0, (ww, e) => zbStandard(ww, e)), { art: "zentralbank", abschnitt: "sitzung" }, null,
      lage === "glaubwuerdigkeit" && !zweites ? { bedingungen: [t("welle_h3.zb.ausblick.folge", { monate: ratingSicht(w).monateNoetig })] } : {}));
    return out;
  },
  standard: (w, ev) => zbStandard(w, ev),
};

/** Die Agentur sieht Rückhalt: Ein negativer Ausblick aus früherem Schweigen wird zurückgenommen, sonst urteilt sie etwas milder. */
function ausblickStabil(w: World): void {
  const p = BEREICHSDRUCK.zentralbank;
  const z = zbZustand(w);
  if (z.ausblickNegativ !== undefined) {
    delete z.ausblickNegativ;
    ratingDruck(w, -p.ausblickPunkte);
  }
  ratingDruck(w, -p.ratingMilder);
}

/** Ohne Antwort: Bei geringer Glaubwürdigkeit senkt die Agentur erst den Ausblick, beim zweiten Mal die Note; beim verfehlten Ziel lesen Märkte und Wirtschaftsflügel das Schweigen. */
function zbStandard(w: World, ev: OffenesEreignis): string {
  const p = BEREICHSDRUCK.zentralbank;
  if (String(ev.daten?.lage) === "glaubwuerdigkeit") {
    // Erst der Ausblick, dann die Note (Entscheidung des Koordinators): Beim ersten Schweigen ändert sich nur der Maßstab der Agentur
    const z = zbZustand(w);
    if (z.ausblickNegativ !== undefined) {
      // Zweites Schweigen: Die Note sinkt; der Ausblick ist damit eingelöst
      delete z.ausblickNegativ;
      ratingAendere(w, -1);
      return t("welle_h3.zb.glaubwuerdigkeit.standard", { agentur: String(ev.daten?.agentur ?? "") });
    }
    z.ausblickNegativ = w.day;
    ratingDruck(w, p.ausblickPunkte);
    return t("welle_h3.zb.glaubwuerdigkeit.standardAusblick", { agentur: String(ev.daten?.agentur ?? "") });
  }
  // Der Wirtschaftsflügel bleibt ohne Antwort; die Bank arbeitet unabhängig weiter, die Märkte haben keinen Grund zur Sorge (vorher kosteten
  // Glaubwürdigkeit und Aufschlag auch hier, als ob Schweigen die Bank schwäche; es stützt eher ihre Unabhängigkeit)
  wirke(w, "unternehmer", -p.schweigen.unternehmer);
  loyalitaetAendern(w, "wirtschaft", -p.schweigen.loyalitaet, t("welle_h3.zb.grund.uebergangen"));
  return t(String(ev.daten?.lage) === "zins" ? "welle_h3.zb.zins.standard" : "welle_h3.zb.inflation.standard");
}

export const BEREICHE_VORLAGEN: Vorlage[] = [MEDIEN_KAMPAGNE, ZB_VERTRAUEN];

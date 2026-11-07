// Die Außenpolitik meldet sich auf dem Schreibtisch (Welle E1, 7. November 2026; ENTSCHEIDUNGEN AA, GESAMTPLAN Welle 2).
//
// Befund (dokumentation/analyse_2026-11-05/bereiche/aussen.md): In 15 Jahren kam aus Gipfeln, Vermittlung und EU keine einzige Entscheidung
// auf den Schreibtisch. Die vier Gipfel standen als Termin ohne Handlung im Kalender (sim/diplomatie.ts, `aussenTermine`), Libyen stand 2043
// bei 77 % Aussicht und wurde nie angefasst, und der EU-Fortschrittsbericht war ein Hinweis ohne Antwort. Hier stehen sechs Vorgänge:
//
//   gipfel_nato, gipfel_un, gipfel_ots, gipfel_g20   Der Gipfel des Monats (Kalender wie aussenTermine): zwei oder drei Antworten mit Preis,
//                                                   Fernbleiben ist eine Antwort mit Preis (ENTSCHEIDUNGEN AA, Rückfrage 3 der Analyse).
//   vermittlung_einladung                            Ein Konflikt ist reif, Ankara könnte einladen: „Istanbul lädt ein“, Gesandter, Abwarten.
//   eu_bericht                                       Der Fortschrittsbericht der Kommission im November: Reformschritt zusagen, zurückweisen,
//                                                   schweigen.
//
// Pflichten (WELLE12): eigener Wurf und kein Zusatzplatz (sim/ereignisse.ts, Vorlage.eigenerWurf/ohneZusatzplatz); jede Antwort wirkt über die
// vorhandenen Wege (Länderbeziehungen, Netzknoten, Zusagen, Gesten aus sim/laender.ts, Blockgipfel aus sim/welt-bloecke.ts, Vermittlung aus
// sim/vermittlung.ts); jede nennt ihre Stelle (Option.stelle). Alle Stärken sind Spielparameter, die Anlässe sind belegt (Quellen je Vorgang).

import { t, msg, tIn } from "../i18n";
import { INSTITUTION_NACH_ID } from "../data/welt-institutionen";
import { KONFLIKTE, KONFLIKT_NACH_ID } from "../data/konflikte";
import { LAENDER, aktionenFuer, fuehreAktionAus, landAendern, vertrauenZu, weltZustand } from "./laender";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { beziehungAendern } from "./welt-modell";
import { fuehreInstitutionsAktionAus, institutionsAktionen } from "./welt-bloecke";
import { VERMITTLUNG, konfliktSicht, ladeEin, vorbereite } from "./vermittlung";
import { konfliktNamen } from "./ereignisse-vermittlung";
import { VISA_KRITERIEN, annaeherungSicht, euZustand, kapitelSicht, visaStand } from "./eu";
import { landFormen } from "./ereignisse-krieg";
import { zeitungEreignis } from "./zeitung";
import { verbrauche } from "./aufmerksamkeit";
import { wirke } from "./wirkung";
import { kosten, monatVon, opt, zusageAnlegen } from "./ereignis-hilfen";
import type { Option, Stelle, Vorlage } from "./ereignis-hilfen";
import type { OffenesEreignis } from "./spiel-typen";
import type { World } from "./types";

// ---------------------------------------------------------------------------
// Spielparameter

export const DIPLOMATIE = {
  /**
   * Gipfelmonate wie im Außenkalender (sim/diplomatie.ts, `aussenTermine`): NATO im Juli (Den Haag 24./25.06.2025, Ankara 07./08.07.2026),
   * UN-Generalversammlung im September (Generaldebatte), Turkstaaten im Oktober (Gabala 07.10.2025), G20 im November (Johannesburg 22./23.11.2025).
   * Der Vorgang öffnet am Monatsersten; die Frist endet vor dem Gipfeltag (der 15. im Kalender).
   */
  monat: { nato: 7, un: 9, ots: 10, g20: 11 } as Record<GipfelId, number>,
  gipfelFrist: 12,
  gipfelAbkuehlung: 300,
  /** Hoher Grundwert: Der Gipfel steht fest im Kalender; die Dichte darf ihn dämpfen, aber nicht wegwürfeln */
  gipfelChance: 20,
  /**
   * Gewicht im Monatswettbewerb (Vorlage.schwere): Ohne Zusatzplatz kommt der Gipfel nur auf den Tisch, wenn er einen der Plätze des Monats
   * gewinnt. Ein Gipfel mit Datum gärt nicht nach; mit Gewicht 1 verlor er in drei Testpartien 7 von 9 Mal gegen Vorgänge mit kurzer Frist.
   */
  gipfelSchwere: 2,
  /** Aufmerksamkeit, die eine Reise zum Gipfel bindet (wie ein Arbeitstreffen, sim/aufmerksamkeit.ts) */
  reise: 4,
  nato: {
    /** Verteidigungsziel bekräftigen: Kapital, die Zusage und die Freude der Verbündeten */
    zusagePk: 3,
    zusageTage: 365,
    usa: 5,
    buendnis: 2,
    ansehen: 1,
    /** Fernbleiben: Verstimmung in Washington und im Bündnis, Beifall in Moskau und bei den Nationalisten */
    fern: { usa: -4, buendnis: -2, russland: 2, nationalisten: 1, ansehen: -1 },
    /** Liegenlassen: Der Außenminister fährt allein, ohne Zusage */
    standard: { usa: -1 },
  },
  un: {
    reformPk: 2,
    reform: { ansehen: 1.5, nationalisten: 1, konservative: 0.5, usa: -1 },
    anklagePk: 1,
    anklage: { vertrauen: -6, konflikt: 4, nationalisten: 1.5, konservative: 1, ansehen: 0.5 },
    fern: { ansehen: -1.5 },
    standard: { ansehen: -0.5 },
  },
  ots: {
    /** Türkischer Beitrag zum Investitionsfonds der Turkstaaten in % des BIP (Spielparameter; das Kapital des Fonds ist 500 Mio. USD, der Anteil der Türkei ist nicht veröffentlicht) */
    fondsBip: 0.01,
    fondsPk: 2,
    fonds: { mitglieder: 5, export: 0.3, ansehen: 0.5 },
    zypernPk: 1,
    /** Kasachstan, Usbekistan und Turkmenistan tauschten 2025 Botschafter mit Zypern (Turkish Minute, 08.04.2025): Sie folgen nicht */
    zypern: { nationalisten: 2, konservative: 0.5, abweichler: -3, euKonflikt: 3 },
    zypernAbweichler: ["KAZ", "UZB", "TKM"],
    fern: { mitglieder: -4 },
    standard: { mitglieder: -1 },
  },
  g20: {
    investorenPk: 2,
    investoren: { auslandskapital: 1.5, maerkte: 1 },
    handelPk: 2,
    handel: { handel: 6, vertrauen: 2, export: 0.5 },
    fern: { ansehen: -1, auslandskapital: -0.5 },
    standard: { auslandskapital: -0.3 },
  },
  vermittlung: {
    /** Ein Konflikt gilt als reif für eine Einladung ab dieser Aussicht und ab der Reife der Gesprächsbereitschaft (VERMITTLUNG.kippBereit) */
    aussichtAb: 50,
    /** Chance je Monat, solange ein Konflikt reif ist; die Dichte der Ereignisse dämpft sie (im Spielstand des Inhabers etwa auf ein Drittel) */
    chance: 2,
    schwere: 1.5,
    abkuehlung: 240,
    frist: 21,
    /** Liegenlassen: Andere laden ein (2025 vermittelten Katar und Oman zwischen Iran und den USA, Katar zwischen Pakistan und Afghanistan); die Parteien merken es sich */
    standardParteien: -2,
    standardAnsehen: -0.5,
  },
  eu: {
    chance: 20,
    /** Gewicht im Monatswettbewerb wie ein Gipfel: ein Anlass mit Datum */
    schwere: 2,
    abkuehlung: 300,
    frist: 21,
    /** So viele Tage nach dem Bericht kann die Antwort noch kommen (sonst ist der Anlass vorbei) */
    fenster: 75,
    zusagePk: 3,
    zusageTage: 365,
    zusage: { eu: 5, beziehungen: 1.5, saekulare: 1, nationalisten: -1 },
    /**
     * Zurückweisen: Vorbild ist die Erklärung des Außenministeriums Nr. 224 vom 04.11.2025 zum Bericht 2025 („biased, prejudiced and
     * baseless“), am Tag der Veröffentlichung.
     */
    zurueck: { eu: -5, beziehungen: -1, nationalisten: 1.5, konservative: 1 },
    standard: { eu: -2 },
  },
} as const;

export type GipfelId = "nato" | "un" | "ots" | "g20";

/** Das Gegenüber eines Gipfels für die Kennzahl im Fenster (die UN zeigen das angeklagte Land) */
const GIPFEL_LAND: Record<GipfelId, string> = { nato: "USA", un: "ISR", ots: "AZE", g20: "USA" };

// ---------------------------------------------------------------------------
// Hilfen

/** Eine Antwort mit Stelle und ehrlich angezeigtem Preis: Bucht die Wirkung selbst, steht der Preis als `anzeigePk` da. */
function antwort(o: Option, stelle: Stelle, extra: Partial<Option> = {}): Option {
  return { ...o, stelle, ...extra };
}

/** Bündnispartner (ohne die Türkei); die USA bekommen ihren eigenen Wert. */
const buendnis = (id: string): string[] => (INSTITUTION_NACH_ID.get(id)?.mitglieder ?? []).filter((x) => x !== "USA");

/** Die Stelle eines Gipfels: der Block in der Außenakte; die Vereinten Nationen haben keinen, dort führt sie zum angeklagten Land. */
const gipfelStelle = (w: World, g: GipfelId, ev: OffenesEreignis): Stelle => (g === "un" ? { art: "welt", land: String(ev.daten?.gegner ?? hauptgegner(w)) } : { art: "welt", block: g });
const knotenStufe = (w: World, id: string): number => nationalAverage(NET, w.net, id);

/** Eine Antwort, die eine Geste aus sim/laender.ts ausführt (Preis und Abkühlung wie in der Länderakte). */
function gesteAntwort(w0: World, id: string, land: string, label: string, beschreibung: string, stelle: Stelle, nach?: (w: World) => void): Option {
  const sicht = aktionenFuer(w0, land).find((a) => a.aktion.id === "gipfel");
  const o = opt(id, label, beschreibung, 0, (w) => {
    const r = fuehreAktionAus(w, land, "gipfel");
    if (r.ok) nach?.(w);
    return r.text;
  });
  return antwort(o, stelle, { anzeigePk: sicht?.aktion.pk ?? 0, ...(sicht && !sicht.moeglich ? { sperre: sicht.grund ?? t("welle_e1.gesperrt") } : !sicht ? { sperre: t("welle_e1.gesperrt") } : {}) });
}

function meldung(w: World, titel: string, fakt: string, wertung: number): void {
  zeitungEreignis(w, { art: "krise", titel, fakt, wertung });
}

// ---------------------------------------------------------------------------
// Gipfel

/** Das Land, mit dem die Türkei gerade am heftigsten streitet (für die Anklage in der Generalversammlung); nie die EU. */
export function hauptgegner(w: World): string {
  const welt = weltZustand(w);
  let best = "ISR";
  let max = -1;
  for (const l of LAENDER) {
    if (l.id === "EU") continue;
    const k = welt[l.id]?.konflikt ?? 0;
    if (k > max) {
      max = k;
      best = l.id;
    }
  }
  return best;
}

function gipfelVorlage(g: GipfelId, optionen: (w: World, ev: OffenesEreignis) => Option[], standard: (w: World, ev: OffenesEreignis) => string): Vorlage {
  return {
    id: `gipfel_${g}`,
    eigenerWurf: true,
    ohneZusatzplatz: true,
    // Ein Gipfel hat ein Datum: Wer ihn nicht auf den Tisch bekommt, lässt den Außenminister fahren (Standardfolge), er gärt nicht weiter
    wettbewerb: "aussitzen",
    schwere: DIPLOMATIE.gipfelSchwere,
    szene: "istanbul",
    tag: 1,
    frist: DIPLOMATIE.gipfelFrist,
    abkuehlung: DIPLOMATIE.gipfelAbkuehlung,
    chance: (w) => (w.spiel && monatVon(w) === DIPLOMATIE.monat[g] ? DIPLOMATIE.gipfelChance : 0),
    // `land` ist das Gegenüber, dessen Vertrauen das Ereignisfenster als Kennzahl zeigt (ui/ereignis/kontext.ts)
    erzeuge: (w) => {
      const gegner = g === "un" ? hauptgegner(w) : undefined;
      return { provinzen: [], staerke: 1, daten: { gipfel: g, jahr: w.date.slice(0, 4), land: gegner ?? GIPFEL_LAND[g], ...(gegner ? { gegner } : {}) } };
    },
    // Das Jahr als Text: eine Jahreszahl bekommt keinen Tausenderpunkt
    titel: (_, ev) => t(`welle_e1.gipfel.${g}.titel`, { jahr: String(ev.daten?.jahr ?? "") }),
    text: (w, ev) => [t(`welle_e1.gipfel.${g}.text1`, gipfelZahlen(w, g, ev)), t(`welle_e1.gipfel.${g}.text2`, gipfelZahlen(w, g, ev))],
    warum: () => t(`welle_e1.gipfel.${g}.warum`),
    stelle: (w, ev) => gipfelStelle(w, g, ev),
    optionen,
    standard,
  };
}

/** Zahlen für die Gipfeltexte, aus dem Weltzustand. */
function gipfelZahlen(w: World, g: GipfelId, ev: OffenesEreignis): Record<string, string | number | ReturnType<typeof landFormen>> {
  const welt = weltZustand(w);
  const v = (id: string) => Math.round(welt[id] ? 50 + welt[id]!.versatz : 50);
  if (g === "nato") return { usa: Math.round(vertrauenZu(w, "USA")), verteidigung: Math.round(knotenStufe(w, "m_verteidigung")) };
  if (g === "un") {
    const gegner = String(ev.daten?.gegner ?? hauptgegner(w));
    return { gegner: landFormen(gegner), konflikt: Math.round(welt[gegner]?.konflikt ?? 0), ansehen: Math.round(knotenStufe(w, "ansehen")) };
  }
  if (g === "ots") return { aze: Math.round(vertrauenZu(w, "AZE")), kaz: v("KAZ") };
  return { eu: Math.round(welt.EU?.handel ?? 0), ansehen: Math.round(knotenStufe(w, "ansehen")) };
}


// NATO-Gipfel. Anlass: das Ausgabenziel von Den Haag (25.06.2025: 5 % des BIP bis 2035, davon 3,5 % Kernverteidigung; OSW 26.06.2025),
// die Türkei bei 2,33 % (NATO-Schätzung 2025). Die Zusage läuft als Zusage auf die Maßnahme „Verteidigung“ (sim/zusagen.ts).
const GIPFEL_NATO = gipfelVorlage(
  "nato",
  (w) => {
    const P = DIPLOMATIE.nato;
    const st: Stelle = { art: "welt", block: "nato" };
    return [
      antwort(opt("zusage", t("welle_e1.gipfel.nato.opt.zusage.label"), t("welle_e1.gipfel.nato.opt.zusage.beschr"), P.zusagePk, (ww) => {
        verbrauche(ww, DIPLOMATIE.reise, "NATO");
        landAendern(ww, "USA", { vertrauen: P.usa }, tIn("de", "welle_e1.gipfel.nato.notiz"));
        for (const x of buendnis("nato")) beziehungAendern(ww, x, { vertrauen: P.buendnis });
        wirke(ww, "ansehen", P.ansehen);
        zusageAnlegen(ww, { von: "NATO", text: tIn("de", "welle_e1.gipfel.nato.zusage"), msg: msg("welle_e1.gipfel.nato.zusage"), tage: P.zusageTage, massnahme: "m_verteidigung" });
        meldung(ww, t("welle_e1.gipfel.nato.zeitung.titel"), t("welle_e1.gipfel.nato.zeitung.fakt"), 0.4);
        return t("welle_e1.gipfel.nato.opt.zusage.ausgang", { tage: P.zusageTage });
      }), { art: "welt", land: "USA" }),
      gesteAntwort(w, "bilateral", "USA", t("welle_e1.gipfel.nato.opt.bilateral.label"), t("welle_e1.gipfel.nato.opt.bilateral.beschr"), { art: "welt", land: "USA", tab: "handeln" }),
      antwort(opt("fernbleiben", t("welle_e1.gipfel.opt.fernbleiben.label"), t("welle_e1.gipfel.nato.opt.fernbleiben.beschr"), 0, (ww) => {
        const f = P.fern;
        landAendern(ww, "USA", { vertrauen: f.usa }, tIn("de", "welle_e1.gipfel.nato.fern.notiz"));
        for (const x of buendnis("nato")) beziehungAendern(ww, x, { vertrauen: f.buendnis });
        landAendern(ww, "RUS", { vertrauen: f.russland });
        wirke(ww, "nationalisten", f.nationalisten);
        wirke(ww, "ansehen", f.ansehen);
        meldung(ww, t("welle_e1.gipfel.nato.zeitung.fern"), t("welle_e1.gipfel.nato.zeitung.fernFakt"), -0.3);
        return t("welle_e1.gipfel.nato.opt.fernbleiben.ausgang");
      }), st),
    ];
  },
  (w) => {
    landAendern(w, "USA", { vertrauen: DIPLOMATIE.nato.standard.usa });
    return t("welle_e1.gipfel.nato.standard");
  },
);

// UN-Generalversammlung. Anlass: Erdoğans Losung „Die Welt ist größer als fünf“ (69. Generalversammlung, 24.09.2014; seither wiederholt) und
// die Rede von 2024 mit Gaza im Mittelpunkt (Daily Sabah, 23.09.2024). Die Stärken sind Spielparameter.
const GIPFEL_UN = gipfelVorlage(
  "un",
  (w, ev) => {
    const P = DIPLOMATIE.un;
    const gegner = String(ev.daten?.gegner ?? hauptgegner(w));
    const st: Stelle = { art: "welt", land: gegner };
    return [
      antwort(opt("reform", t("welle_e1.gipfel.un.opt.reform.label"), t("welle_e1.gipfel.un.opt.reform.beschr"), P.reformPk, (ww) => {
        verbrauche(ww, DIPLOMATIE.reise, "UN");
        wirke(ww, "ansehen", P.reform.ansehen);
        wirke(ww, "nationalisten", P.reform.nationalisten);
        wirke(ww, "konservative", P.reform.konservative);
        landAendern(ww, "USA", { vertrauen: P.reform.usa });
        meldung(ww, t("welle_e1.gipfel.un.zeitung.titel"), t("welle_e1.gipfel.un.zeitung.fakt"), 0.4);
        return t("welle_e1.gipfel.un.opt.reform.ausgang");
      }), { art: "welt", land: "USA" }),
      antwort(opt("anklage", t("welle_e1.gipfel.un.opt.anklage.label", { land: landFormen(gegner) }), t("welle_e1.gipfel.un.opt.anklage.beschr", { land: landFormen(gegner) }), P.anklagePk, (ww) => {
        verbrauche(ww, DIPLOMATIE.reise, "UN");
        const a = P.anklage;
        landAendern(ww, gegner, { vertrauen: a.vertrauen, konflikt: a.konflikt }, tIn("de", "welle_e1.gipfel.un.notiz"));
        wirke(ww, "nationalisten", a.nationalisten);
        wirke(ww, "konservative", a.konservative);
        wirke(ww, "ansehen", a.ansehen);
        meldung(ww, t("welle_e1.gipfel.un.zeitung.anklage", { land: landFormen(gegner) }), t("welle_e1.gipfel.un.zeitung.anklageFakt", { land: landFormen(gegner) }), 0.2);
        return t("welle_e1.gipfel.un.opt.anklage.ausgang", { land: landFormen(gegner) });
      }), st),
      antwort(opt("fernbleiben", t("welle_e1.gipfel.opt.fernbleiben.label"), t("welle_e1.gipfel.un.opt.fernbleiben.beschr"), 0, (ww) => {
        wirke(ww, "ansehen", P.fern.ansehen);
        return t("welle_e1.gipfel.un.opt.fernbleiben.ausgang");
      }), st),
    ];
  },
  (w) => {
    wirke(w, "ansehen", DIPLOMATIE.un.standard.ansehen);
    return t("welle_e1.gipfel.un.standard");
  },
);

// Gipfel der Turkstaaten. Anlass: der Mittlere Korridor, der Investitionsfonds (vereinbart am 16.03.2023, 500 Mio. USD genehmigtes Kapital;
// Kun.uz 17.03.2023) und die Frage Nordzypern (Samarkand 2025: Kasachstan, Usbekistan und Turkmenistan bekennen sich zu den UN-Resolutionen
// 541/550; Turkish Minute 08.04.2025).
const GIPFEL_OTS = gipfelVorlage(
  "ots",
  (w) => {
    const P = DIPLOMATIE.ots;
    const st: Stelle = { art: "welt", block: "ots" };
    const ots = INSTITUTION_NACH_ID.get("ots")!;
    const korridor = institutionsAktionen(w, "ots").find((a) => a.id === "turk_gipfel");
    return [
      // Derselbe Weg wie der Knopf in der Blockakte (sim/welt-bloecke.ts): Mitglieder, Handel, Export, Russland und China verstimmt
      antwort(opt("korridor", t("welle_e1.gipfel.ots.opt.korridor.label"), t("welle_e1.gipfel.ots.opt.korridor.beschr"), 0, (ww) => {
        const r = fuehreInstitutionsAktionAus(ww, "turk_gipfel");
        return r.ok ? t("welle_e1.gipfel.ots.opt.korridor.ausgang") : r.text;
      }), st, { anzeigePk: korridor?.pk ?? 0, ...(korridor && !korridor.moeglich ? { sperre: korridor.grund ?? t("welle_e1.gesperrt") } : {}) }),
      antwort(opt("fonds", t("welle_e1.gipfel.ots.opt.fonds.label"), t("welle_e1.gipfel.ots.opt.fonds.beschr"), P.fondsPk, (ww) => {
        verbrauche(ww, DIPLOMATIE.reise, "OTS");
        kosten(ww, P.fondsBip);
        for (const x of ots.mitglieder) beziehungAendern(ww, x, { vertrauen: P.fonds.mitglieder });
        wirke(ww, "export", P.fonds.export);
        wirke(ww, "ansehen", P.fonds.ansehen);
        meldung(ww, t("welle_e1.gipfel.ots.zeitung.titel"), t("welle_e1.gipfel.ots.zeitung.fakt"), 0.3);
        return t("welle_e1.gipfel.ots.opt.fonds.ausgang");
      }), st),
      antwort(opt("zypern", t("welle_e1.gipfel.ots.opt.zypern.label"), t("welle_e1.gipfel.ots.opt.zypern.beschr"), P.zypernPk, (ww) => {
        verbrauche(ww, DIPLOMATIE.reise, "OTS");
        wirke(ww, "nationalisten", P.zypern.nationalisten);
        wirke(ww, "konservative", P.zypern.konservative);
        for (const x of P.zypernAbweichler) beziehungAendern(ww, x, { vertrauen: P.zypern.abweichler });
        landAendern(ww, "EU", { konflikt: P.zypern.euKonflikt });
        return t("welle_e1.gipfel.ots.opt.zypern.ausgang");
      }), { art: "welt", land: "CYP" }),
      antwort(opt("fernbleiben", t("welle_e1.gipfel.opt.fernbleiben.label"), t("welle_e1.gipfel.ots.opt.fernbleiben.beschr"), 0, (ww) => {
        for (const x of ots.mitglieder) beziehungAendern(ww, x, { vertrauen: P.fern.mitglieder });
        return t("welle_e1.gipfel.ots.opt.fernbleiben.ausgang");
      }), st),
    ];
  },
  (w) => {
    for (const x of INSTITUTION_NACH_ID.get("ots")!.mitglieder) beziehungAendern(w, x, { vertrauen: DIPLOMATIE.ots.standard.mitglieder });
    return t("welle_e1.gipfel.ots.standard");
  },
);

// G20. Anlass: Die Türkei ist Mitglied seit 1999 und richtete den Gipfel in Antalya am 15./16.11.2015 aus; die EU ist der größte Handelspartner
// (2025: 42,7 % der türkischen Exporte; DG Trade). Die Stärken sind Spielparameter.
const GIPFEL_G20 = gipfelVorlage(
  "g20",
  () => {
    const P = DIPLOMATIE.g20;
    const st: Stelle = { art: "welt", block: "g20" };
    return [
      antwort(opt("investoren", t("welle_e1.gipfel.g20.opt.investoren.label"), t("welle_e1.gipfel.g20.opt.investoren.beschr"), P.investorenPk, (ww) => {
        verbrauche(ww, DIPLOMATIE.reise, "G20");
        wirke(ww, "auslandskapital", P.investoren.auslandskapital);
        wirke(ww, "vertrauen_maerkte", P.investoren.maerkte);
        meldung(ww, t("welle_e1.gipfel.g20.zeitung.titel"), t("welle_e1.gipfel.g20.zeitung.fakt"), 0.3);
        return t("welle_e1.gipfel.g20.opt.investoren.ausgang");
      }), st),
      antwort(opt("handel", t("welle_e1.gipfel.g20.opt.handel.label"), t("welle_e1.gipfel.g20.opt.handel.beschr"), P.handelPk, (ww) => {
        verbrauche(ww, DIPLOMATIE.reise, "G20");
        landAendern(ww, "EU", { handel: P.handel.handel, vertrauen: P.handel.vertrauen }, tIn("de", "welle_e1.gipfel.g20.notiz"));
        wirke(ww, "export", P.handel.export);
        return t("welle_e1.gipfel.g20.opt.handel.ausgang");
      }), { art: "welt", land: "EU", tab: "verhandeln" }),
      antwort(opt("fernbleiben", t("welle_e1.gipfel.opt.fernbleiben.label"), t("welle_e1.gipfel.g20.opt.fernbleiben.beschr"), 0, (ww) => {
        wirke(ww, "ansehen", P.fern.ansehen);
        wirke(ww, "auslandskapital", P.fern.auslandskapital);
        return t("welle_e1.gipfel.g20.opt.fernbleiben.ausgang");
      }), st),
    ];
  },
  (w) => {
    wirke(w, "auslandskapital", DIPLOMATIE.g20.standard.auslandskapital);
    return t("welle_e1.gipfel.g20.standard");
  },
);

// ---------------------------------------------------------------------------
// Vermittlung: „Istanbul lädt ein“
//
// Anlass: die Istanbuler Runden zwischen Russland und der Ukraine (29.03.2022; 16.05., 02.06. und 23.07.2025) und die Ankara-Erklärung zu
// Somalia und Äthiopien (11.12.2024). Ein Konflikt ist reif, wenn die Gespräche bereit sind (Reife ab VERMITTLUNG.kippBereit) und die Aussicht
// hoch genug ist; dann meldet er sich, statt nur als Hinweis zu erscheinen.

/** Der reifste Konflikt, in dem Ankara jetzt vermitteln könnte (höchste Aussicht), oder null. */
export function einladungsKandidat(w: World): { id: string; aussicht: number } | null {
  let best: { id: string; aussicht: number } | null = null;
  for (const def of KONFLIKTE) {
    const s = konfliktSicht(w, def);
    if (!s.moeglich || s.z.einigung !== undefined || s.z.einladung !== undefined) continue;
    if (s.z.reif < VERMITTLUNG.kippBereit || s.aussicht < DIPLOMATIE.vermittlung.aussichtAb) continue;
    if (!best || s.aussicht > best.aussicht) best = { id: def.id, aussicht: s.aussicht };
  }
  return best;
}

const konfliktVon = (ev: OffenesEreignis) => KONFLIKT_NACH_ID[String(ev.daten?.konflikt ?? "")] ?? KONFLIKTE[KONFLIKTE.length - 1]!;

const EINLADUNG: Vorlage = {
  id: "vermittlung_einladung",
  eigenerWurf: true,
  ohneZusatzplatz: true,
  schwere: DIPLOMATIE.vermittlung.schwere,
  szene: "istanbul",
  frist: DIPLOMATIE.vermittlung.frist,
  abkuehlung: DIPLOMATIE.vermittlung.abkuehlung,
  chance: (w) => (w.spiel && einladungsKandidat(w) ? DIPLOMATIE.vermittlung.chance : 0),
  erzeuge: (w) => {
    const k = einladungsKandidat(w);
    // Auf Zuruf (Texttest) ohne reifen Konflikt: Libyen, der Fall aus dem Spielstand des Inhabers
    const id = k?.id ?? "lby_fraktionen";
    const def = KONFLIKT_NACH_ID[id]!;
    return { provinzen: [], staerke: 1, daten: { konflikt: id, aussicht: k?.aussicht ?? konfliktSicht(w, def).aussicht, ...(def.a.land ? { land: def.a.land } : {}) } };
  },
  titel: (_, ev) => t("welle_e1.verm.titel", konfliktNamen(konfliktVon(ev))),
  text: (w, ev) => {
    const def = konfliktVon(ev);
    const s = konfliktSicht(w, def);
    return [
      t("welle_e1.verm.text1", { ...konfliktNamen(def), reif: Math.round(s.z.reif), aussicht: s.aussicht }),
      t("welle_e1.verm.text2", { ...konfliktNamen(def), vA: Math.round(s.vertrauenA), vB: Math.round(s.vertrauenB), paket: def.paket[0] ?? "" }),
    ];
  },
  warum: (_, ev) => t("welle_e1.verm.warum", { aussicht: Number(ev.daten?.aussicht ?? 0), ab: DIPLOMATIE.vermittlung.aussichtAb }),
  stelle: () => ({ art: "welt", vermittlung: true }),
  optionen: (w, ev) => {
    const def = konfliktVon(ev);
    const s = konfliktSicht(w, def);
    const kanaele = s.vorbereitungen.find((v) => v.def.id === "kanaele");
    const st: Stelle = { art: "welt", vermittlung: true };
    return [
      antwort(opt("einladen", t("welle_e1.verm.opt.einladen.label"), t("welle_e1.verm.opt.einladen.beschr", { tage: VERMITTLUNG.einladungTage }), 0, (ww) => {
        const r = ladeEin(ww, def.id);
        if (r.ok) meldung(ww, t("welle_e1.verm.zeitung.titel", konfliktNamen(def)), t("welle_e1.verm.zeitung.fakt", konfliktNamen(def)), 0.5);
        return r.text;
      }), st, { anzeigePk: def.pk, bedingungen: [t("welle_e1.verm.aussicht", { aussicht: s.aussicht })], ...(s.moeglich ? {} : { sperre: s.grund ?? t("welle_e1.gesperrt") }) }),
      antwort(opt("gesandter", t("welle_e1.verm.opt.gesandter.label"), t("welle_e1.verm.opt.gesandter.beschr"), 0, (ww) => vorbereite(ww, def.id, "kanaele").text), st, {
        anzeigePk: kanaele?.def.pk ?? 0,
        ...(kanaele && !kanaele.moeglich ? { sperre: kanaele.grund ?? t("welle_e1.gesperrt") } : !kanaele ? { sperre: t("welle_e1.gesperrt") } : {}),
      }),
      antwort(opt("abwarten", t("welle_e1.verm.opt.abwarten.label"), t("welle_e1.verm.opt.abwarten.beschr"), 0, (ww, e) => einladungStandard(ww, e)), st),
    ];
  },
  standard: (w, ev) => einladungStandard(w, ev),
};

/** Liegenlassen: Andere laden ein; beide Seiten merken sich, dass Ankara nicht wollte, und das Ansehen sinkt ein wenig. */
function einladungStandard(w: World, ev: OffenesEreignis): string {
  const def = konfliktVon(ev);
  const P = DIPLOMATIE.vermittlung;
  if (def.a.land) landAendern(w, def.a.land, { vertrauen: P.standardParteien });
  if (def.b.land && def.b.land !== def.a.land) landAendern(w, def.b.land, { vertrauen: P.standardParteien });
  wirke(w, "ansehen", P.standardAnsehen);
  return t("welle_e1.verm.standard", konfliktNamen(def));
}

// ---------------------------------------------------------------------------
// EU-Fortschrittsbericht als Karte
//
// Anlass: Die Kommission legt jedes Jahr im Herbst den Länderbericht vor (2025 am 04.11.2025); das Außenministerium antwortet am selben Tag
// (Erklärung Nr. 224). Die Zusage läuft als Zusage auf die Maßnahme, die Brüssel gerade am meisten bremst (sim/zusagen.ts).

/** Der jüngste Bericht, wenn er noch keine Antwort hat und der Anlass noch frisch ist. */
export function offenerEuBericht(w: World): { jahr: number; tag: number } | null {
  if (!w.spiel) return null;
  const z = euZustand(w);
  const b = z.berichte[z.berichte.length - 1];
  if (!b || z.berichtBeantwortet === b.jahr || w.day - b.tag > DIPLOMATIE.eu.fenster) return null;
  return { jahr: b.jahr, tag: b.tag };
}

/** Die Maßnahme, auf die eine Reformzusage zielt: im Stillstand die Annäherung an die EU (der sichtbare Preis), sonst die Justizreform. */
export function euZusageMassnahme(w: World): "m_eu_annaeherung" | "m_justizreform" {
  const a = annaeherungSicht(w);
  return euZustand(w).phase === "eingefroren" && !a.substanz ? "m_eu_annaeherung" : "m_justizreform";
}

const EU_BERICHT: Vorlage = {
  id: "eu_bericht",
  eigenerWurf: true,
  ohneZusatzplatz: true,
  schwere: DIPLOMATIE.eu.schwere,
  szene: "istanbul",
  frist: DIPLOMATIE.eu.frist,
  abkuehlung: DIPLOMATIE.eu.abkuehlung,
  massnahmen: ["m_eu_annaeherung", "m_justizreform"],
  chance: (w) => (offenerEuBericht(w) ? DIPLOMATIE.eu.chance : 0),
  erzeuge: (w) => {
    const b = offenerEuBericht(w);
    return { provinzen: [], staerke: 1, daten: { jahr: String(b?.jahr ?? w.date.slice(0, 4)) } };
  },
  titel: (_, ev) => t("welle_e1.eu.bericht.titel", { jahr: String(ev.daten?.jahr ?? "") }),
  text: (w) => {
    const z = euZustand(w);
    const ks = kapitelSicht(w);
    const n = (f: (s: (typeof ks)[number]) => boolean) => ks.filter(f).length;
    const visa = visaStand(w);
    const a = annaeherungSicht(w);
    return [
      t("welle_e1.eu.bericht.text1", {
        offen: n((s) => s.zustand.status === "offen"),
        zu: n((s) => s.zustand.status === "abgeschlossen"),
        blockiert: n((s) => s.blockiertZypern || s.blockiertRat),
        alle: ks.length,
        visa: visa.erfuellt,
        visaAlle: VISA_KRITERIEN.length,
      }),
      z.phase === "eingefroren"
        ? t(a.substanz ? "welle_e1.eu.bericht.text2.bereit" : "welle_e1.eu.bericht.text2.eingefroren", { wert: Math.round(a.annaeherung), noetig: a.noetig })
        : t("welle_e1.eu.bericht.text2.laeuft"),
    ];
  },
  warum: () => t("welle_e1.eu.bericht.warum"),
  stelle: () => ({ art: "welt", land: "EU", tab: "beitritt" }),
  optionen: (w) => {
    const P = DIPLOMATIE.eu;
    const st: Stelle = { art: "welt", land: "EU", tab: "beitritt" };
    const m = euZusageMassnahme(w);
    return [
      antwort(opt("zusagen", t("welle_e1.eu.bericht.opt.zusagen.label"), t(`welle_e1.eu.bericht.opt.zusagen.beschr.${m}`), P.zusagePk, (ww) => {
        beantwortet(ww);
        const zs = P.zusage;
        landAendern(ww, "EU", { vertrauen: zs.eu }, tIn("de", "welle_e1.eu.bericht.notiz.zusage"));
        wirke(ww, "beziehungen_eu", zs.beziehungen);
        wirke(ww, "staedtische_saekulare", zs.saekulare);
        wirke(ww, "nationalisten", zs.nationalisten);
        zusageAnlegen(ww, { von: "EU-Kommission", text: tIn("de", `welle_e1.eu.bericht.zusage.${m}`), msg: msg(`welle_e1.eu.bericht.zusage.${m}`), tage: P.zusageTage, massnahme: m });
        return t(`welle_e1.eu.bericht.opt.zusagen.ausgang.${m}`, { tage: P.zusageTage });
      }), st),
      antwort(opt("zurueckweisen", t("welle_e1.eu.bericht.opt.zurueck.label"), t("welle_e1.eu.bericht.opt.zurueck.beschr"), 0, (ww) => {
        beantwortet(ww);
        const zr = P.zurueck;
        landAendern(ww, "EU", { vertrauen: zr.eu }, tIn("de", "welle_e1.eu.bericht.notiz.zurueck"));
        wirke(ww, "beziehungen_eu", zr.beziehungen);
        wirke(ww, "nationalisten", zr.nationalisten);
        wirke(ww, "konservative", zr.konservative);
        meldung(ww, t("welle_e1.eu.bericht.zeitung.titel"), t("welle_e1.eu.bericht.zeitung.fakt"), -0.2);
        return t("welle_e1.eu.bericht.opt.zurueck.ausgang");
      }), st),
      antwort(opt("abwarten", t("welle_e1.eu.bericht.opt.schweigen.label"), t("welle_e1.eu.bericht.opt.schweigen.beschr"), 0, (ww) => euBerichtStandard(ww)), st),
    ];
  },
  standard: (w) => euBerichtStandard(w),
};

function beantwortet(w: World): void {
  const z = euZustand(w);
  const b = z.berichte[z.berichte.length - 1];
  if (b) z.berichtBeantwortet = b.jahr;
}

/** Schweigen: Brüssel liest Desinteresse. */
function euBerichtStandard(w: World): string {
  beantwortet(w);
  landAendern(w, "EU", { vertrauen: DIPLOMATIE.eu.standard.eu });
  return t("welle_e1.eu.bericht.standard");
}

export const DIPLOMATIE_VORLAGEN: Vorlage[] = [GIPFEL_NATO, GIPFEL_UN, GIPFEL_OTS, GIPFEL_G20, EINLADUNG, EU_BERICHT];

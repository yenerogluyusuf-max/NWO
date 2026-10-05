// Ereignisvorlagen rund um die Wahl (Klasse A: der Spieler entscheidet):
//   wahl_stichwahl        — zwischen den Wahlgängen: um die Wähler des Dritten werben, die eigenen mobilisieren oder abwarten
//   wahl_koalitionsrunde  — nach der Parlamentswahl fehlt dem Lager die Mehrheit: mit wem koalieren?
//   wahl_anfechtung       — knapper Sieg: Die Opposition ficht an, der Hohe Wahlrat entscheidet endgültig (kein Rechtsmittel, AY 79)
//   nachfolge_kuer        — letzte Amtszeit: Den Nachfolger küren oder die Partei entscheiden lassen
//   putsch_warnung        — das Putschrisiko ist hoch: den Generalstabschef entlassen, Offiziere einbinden oder abwarten (sim/enden.ts)
//   amtsenthebung_antrag  — die Opposition stellt den Antrag (301 Stimmen): Fraktionen einschwören, Zugeständnisse machen oder abwarten
//   krankheit_praesident  — eine ernste Diagnose: offen sagen, verschweigen oder zurücktreten
//   ruecktritt_forderung  — Zustimmung am Boden, das Lager wankt: durchhalten oder zurücktreten
// Alle werden nur von sim/wahl.ts und sim/amtszeit.ts geöffnet (chance 0). Alle Texte laufen über die Übersetzungsschicht.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { wirke } from "./wirkung";
import { opt } from "./ereignis-hilfen";
import { FORDERUNG, PARTEI_NAME, forderungVon } from "./fraktionen";
import { partnerFigur } from "./figuren";
import { anfechtungAbschluss, stichwahlEntscheidung } from "./wahl";
import { kronprinzen, kuereNachfolger, nachfolgeZustand } from "./amtszeit";
import { amtsenthebungEinschwoeren, amtsenthebungZugestaendnisse, krankheitAbgeben, krankheitOffen, krankheitVerschweigen, putschEinbinden, putschEntlassen, ruecktrittDurchhalten, ruecktrittErklaeren } from "./enden";
import { t } from "../i18n";
import type { Vorlage } from "./ereignis-hilfen";
import type { OffenesEreignis } from "./spiel-typen";

const zahl = (ev: OffenesEreignis, k: string, standard: number): number => {
  const x = Number(ev.daten?.[k]);
  return Number.isFinite(x) ? x : standard;
};
const text = (ev: OffenesEreignis, k: string, standard: string): string => String(ev.daten?.[k] ?? standard);

// ---------------------------------------------------------------------------
// Stichwahl

const STICHWAHL: Vorlage = {
  id: "wahl_stichwahl",
  szene: "wahlnacht",
  frist: 12,
  abkuehlung: 1,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 1, daten: { amt: 47.8, gegner: 46.4, dritte: 4.6, dritteName: "der dritte Kandidat", uebertrag: 30 } }),
  titel: () => t("wahl.ereignis.stichwahl.titel"),
  text: (_, ev) => [
    t("wahl.ereignis.stichwahl.text1", { amt: zahl(ev, "amt", 47.8), gegner: zahl(ev, "gegner", 46.4), dritte: zahl(ev, "dritte", 4.6) }),
    t("wahl.ereignis.stichwahl.text2", { name: text(ev, "dritteName", "der dritte Kandidat"), uebertrag: zahl(ev, "uebertrag", 30) }),
  ],
  warum: () => t("wahl.ereignis.stichwahl.warum"),
  optionen: () => [
    opt("werben", t("wahl.ereignis.stichwahl.werben"), t("wahl.ereignis.stichwahl.werben_beschr", { pk: 3 }), 3, (w) => stichwahlEntscheidung(w, "werben")),
    opt("mobilisieren", t("wahl.ereignis.stichwahl.mobil"), t("wahl.ereignis.stichwahl.mobil_beschr", { pk: 2 }), 2, (w) => stichwahlEntscheidung(w, "mobilisieren")),
    opt("abwarten", t("wahl.ereignis.stichwahl.abwarten"), t("wahl.ereignis.stichwahl.abwarten_beschr"), 0, (w) => stichwahlEntscheidung(w, "abwarten")),
  ],
  standard: (w) => stichwahlEntscheidung(w, "abwarten"),
};

// ---------------------------------------------------------------------------
// Koalitionsrunde nach der Parlamentswahl

const KOALITIONSRUNDE: Vorlage = {
  id: "wahl_koalitionsrunde",
  szene: "parlament",
  frist: 30,
  abkuehlung: 1,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 1, daten: { sitze: 280 } }),
  titel: () => t("wahl.ereignis.koalition.titel"),
  text: (_, ev) => [t("wahl.ereignis.koalition.text1", { sitze: zahl(ev, "sitze", 280) }), t("wahl.ereignis.koalition.text2")],
  warum: () => t("wahl.ereignis.koalition.warum"),
  optionen: (w) => {
    const parl = w.parliament;
    const lager = [w.player?.partei.kurz ?? "", ...(w.spiel?.lager ?? [])];
    const kandidaten = parl
      ? Object.entries(parl.seats)
          .filter(([k, s]) => s >= 15 && !lager.includes(k) && FORDERUNG[k])
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
      : [];
    return [
      ...kandidaten.map(([partei, sitze]) =>
        opt(`koalition-${partei}`, t("wahl.ereignis.koalition.mit", { partei: PARTEI_NAME[partei] ?? partei, sitze }), t("wahl.ereignis.koalition.mit_beschr", { forderung: FORDERUNG[partei]!.text, pk: 4 }), 4, (ww, _e, rng) => {
          const f = forderungVon(ww, partei);
          ww.spiel!.lager.push(partei);
          ww.spiel!.zusagen.push({ id: `z-wahl-koalition-${partei}-${ww.day}`, von: partei, text: t("wahl.ereignis.koalition.zusage", { partei: PARTEI_NAME[partei] ?? partei, forderung: f.text }), faellig: ww.day + 150, massnahme: f.massnahme, richtung: 1, erfuellt: false, gebrochen: false });
          ww.spiel!.figuren.push(partnerFigur(ww, partei, t("wahl.ereignis.koalition.vorsitz", { partei: PARTEI_NAME[partei] ?? partei }), f.text, rng));
          return t("wahl.ereignis.koalition.ausgang", { partei: PARTEI_NAME[partei] ?? partei, sitze });
        }),
      ),
      opt("minderheit", t("wahl.ereignis.koalition.minderheit"), t("wahl.ereignis.koalition.minderheit_beschr"), 0, () => t("wahl.ereignis.koalition.minderheit_ausgang")),
      opt("vertagen", t("wahl.ereignis.koalition.vertagen"), t("wahl.ereignis.koalition.vertagen_beschr"), 0, () => t("wahl.ereignis.koalition.vertagen_ausgang")),
    ];
  },
  standard: () => t("wahl.ereignis.koalition.standard"),
};

// ---------------------------------------------------------------------------
// Anfechtung eines knappen Sieges

const ANFECHTUNG: Vorlage = {
  id: "wahl_anfechtung",
  szene: "wahlnacht",
  frist: 10,
  abkuehlung: 1,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 1, daten: { marge: 1.4, gegner: "Der Kandidat der Opposition" } }),
  titel: () => t("wahl.ereignis.anfechtung.titel"),
  text: (_, ev) => [t("wahl.ereignis.anfechtung.text1", { marge: zahl(ev, "marge", 1.4), gegner: text(ev, "gegner", "Der Kandidat der Opposition") }), t("wahl.ereignis.anfechtung.text2")],
  warum: () => t("wahl.ereignis.anfechtung.warum"),
  optionen: () => [
    opt("neuauszaehlung", t("wahl.ereignis.anfechtung.neu"), t("wahl.ereignis.anfechtung.neu_beschr", { pk: 2 }), 2, (w) => {
      wirke(w, "legitimitaet", 1);
      wirke(w, "polarisierung", -0.5);
      anfechtungAbschluss(w, "abgewiesen");
      return t("wahl.ereignis.anfechtung.neu_ausgang");
    }),
    opt("verteidigen", t("wahl.ereignis.anfechtung.verteidigen"), t("wahl.ereignis.anfechtung.verteidigen_beschr"), 0, (w) => {
      wirke(w, "legitimitaet", -2);
      wirke(w, "polarisierung", 2);
      anfechtungAbschluss(w, "abgewiesen");
      return t("wahl.ereignis.anfechtung.verteidigen_ausgang");
    }),
  ],
  standard: (w) => {
    wirke(w, "legitimitaet", -1);
    anfechtungAbschluss(w, "abgewiesen");
    return t("wahl.ereignis.anfechtung.standard");
  },
};

// ---------------------------------------------------------------------------
// Nachfolge in der letzten Amtszeit

const NACHFOLGE_KUER: Vorlage = {
  id: "nachfolge_kuer",
  szene: "istanbul",
  frist: 60,
  abkuehlung: 365,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => t("nachfolge.ereignis.titel"),
  text: (w) => {
    const a = nachfolgeZustand(w)?.aspiranten ?? kronprinzen(w);
    return [t("nachfolge.ereignis.text1"), a.length ? t("nachfolge.ereignis.text2", { liste: a.map((x) => `${x.rolle} ${x.name}`) }) : t("nachfolge.ereignis.text2_leer")];
  },
  warum: () => t("nachfolge.ereignis.warum"),
  optionen: (w) => {
    const a = nachfolgeZustand(w)?.aspiranten ?? kronprinzen(w);
    return [
      ...a.map((x) =>
        opt(`kuer-${x.amt}`, t("nachfolge.ereignis.kuer", { name: x.name, rolle: x.rolle }), t("nachfolge.ereignis.kuer_beschr", { staerke: x.staerke, ehrgeiz: x.ehrgeiz, pk: 3 }), 3, (ww) => kuereNachfolger(ww, x.amt).text),
      ),
      opt("offen", t("nachfolge.ereignis.offen"), t("nachfolge.ereignis.offen_beschr"), 0, (ww) => kuereNachfolger(ww, "offen").text),
      opt("spaeter", t("nachfolge.ereignis.spaeter"), t("nachfolge.ereignis.spaeter_beschr"), 0, () => t("nachfolge.ereignis.spaeter_ausgang")),
    ];
  },
  standard: (w) => kuereNachfolger(w, "offen").text,
};


// ---------------------------------------------------------------------------
// Enden: Putsch, Amtsenthebung, Krankheit, Rücktritt (Logik in sim/enden.ts)

const PUTSCH_WARNUNG: Vorlage = {
  id: "putsch_warnung",
  szene: "istanbul",
  frist: 20,
  abkuehlung: 6,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 1, daten: { risiko: 62 } }),
  titel: () => t("enden.putsch.warnung.titel"),
  text: (_, ev) => [t("enden.putsch.warnung.text1", { risiko: zahl(ev, "risiko", 62) }), t("enden.putsch.warnung.text2")],
  warum: () => t("enden.putsch.warnung.warum"),
  optionen: () => [
    opt("entlassen", t("enden.putsch.warnung.entlassen"), t("enden.putsch.warnung.entlassen_beschr", { pk: 3 }), 3, (w) => putschEntlassen(w)),
    opt("einbinden", t("enden.putsch.warnung.einbinden"), t("enden.putsch.warnung.einbinden_beschr", { pk: 4 }), 4, (w) => putschEinbinden(w)),
    opt("abwarten", t("enden.putsch.warnung.abwarten"), t("enden.putsch.warnung.abwarten_beschr"), 0, () => t("enden.putsch.warnung.abwarten_ausgang")),
  ],
  standard: () => t("enden.putsch.warnung.abwarten_ausgang"),
};

const AMTSENTHEBUNG_ANTRAG: Vorlage = {
  id: "amtsenthebung_antrag",
  szene: "parlament",
  frist: 20,
  abkuehlung: 12,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 1, daten: { gegen: 305, lager: 295 } }),
  titel: () => t("enden.amtsenthebung.antrag.titel"),
  text: (_, ev) => [t("enden.amtsenthebung.antrag.text1", { gegen: zahl(ev, "gegen", 305) }), t("enden.amtsenthebung.antrag.text2", { lager: zahl(ev, "lager", 295) })],
  warum: () => t("enden.amtsenthebung.antrag.warum_kurz"),
  optionen: () => [
    opt("einschwoeren", t("enden.amtsenthebung.antrag.einschwoeren"), t("enden.amtsenthebung.antrag.einschwoeren_beschr", { pk: 5 }), 5, (w) => amtsenthebungEinschwoeren(w)),
    opt("zugestaendnisse", t("enden.amtsenthebung.antrag.zugestaendnisse"), t("enden.amtsenthebung.antrag.zugestaendnisse_beschr", { pk: 3 }), 3, (w) => amtsenthebungZugestaendnisse(w)),
    opt("abwarten", t("enden.amtsenthebung.antrag.abwarten"), t("enden.amtsenthebung.antrag.abwarten_beschr"), 0, () => t("enden.amtsenthebung.antrag.abwarten_ausgang")),
  ],
  standard: () => t("enden.amtsenthebung.antrag.abwarten_ausgang"),
};

const KRANKHEIT: Vorlage = {
  id: "krankheit_praesident",
  szene: "istanbul",
  frist: 15,
  abkuehlung: 24,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 1, daten: {} }),
  titel: () => t("enden.krankheit.titel"),
  text: () => [t("enden.krankheit.text1"), t("enden.krankheit.text2")],
  warum: () => t("enden.krankheit.warum"),
  optionen: () => [
    opt("offen", t("enden.krankheit.offen"), t("enden.krankheit.offen_beschr", { pk: 2 }), 2, (w) => krankheitOffen(w)),
    opt("verschweigen", t("enden.krankheit.verschweigen"), t("enden.krankheit.verschweigen_beschr"), 0, (w) => krankheitVerschweigen(w)),
    opt("abgeben", t("enden.krankheit.abgeben"), t("enden.krankheit.abgeben_beschr"), 0, (w) => krankheitAbgeben(w)),
  ],
  standard: (w) => krankheitVerschweigen(w),
};

const RUECKTRITT_FORDERUNG: Vorlage = {
  id: "ruecktritt_forderung",
  szene: "parlament",
  frist: 20,
  abkuehlung: 12,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 1, daten: { zustimmung: 30 } }),
  titel: () => t("enden.ruecktritt.forderung.titel"),
  text: (_, ev) => [t("enden.ruecktritt.forderung.text1", { zustimmung: zahl(ev, "zustimmung", 30) }), t("enden.ruecktritt.forderung.text2")],
  warum: () => t("enden.ruecktritt.forderung.warum"),
  optionen: () => [
    opt("durchhalten", t("enden.ruecktritt.durchhalten"), t("enden.ruecktritt.durchhalten_beschr", { pk: 3 }), 3, (w) => ruecktrittDurchhalten(w)),
    opt("erklaeren", t("enden.ruecktritt.erklaeren"), t("enden.ruecktritt.erklaeren_beschr"), 0, (w) => ruecktrittErklaeren(w)),
  ],
  standard: (w) => ruecktrittDurchhalten(w),
};

export const WAHL_VORLAGEN: Vorlage[] = [STICHWAHL, KOALITIONSRUNDE, ANFECHTUNG, NACHFOLGE_KUER, PUTSCH_WARNUNG, AMTSENTHEBUNG_ANTRAG, KRANKHEIT, RUECKTRITT_FORDERUNG];


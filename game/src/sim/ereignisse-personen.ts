// Ereignisse um Personen: Rücktrittsdrohung, Skandal, Intrige und Durchstecherei. Sie entstehen aus dem Zustand des Umfelds (Loyalität, Groll,
// Ehrgeiz), nicht aus dem Würfel allein: Wer seine Leute pflegt, sieht sie selten. Alle Wahrscheinlichkeiten und Wirkungen sind Platzhalter
// der Kalibrierung; Zahlen im Text kommen aus dem Weltzustand. Texte: katalog/<sprache>/nacht_n5.json (Schlüssel ev.person_*).
// Wer geht, wird VOR `ausscheiden()` festgehalten: Danach steht im selben Figurenobjekt schon die Nachfolge (Befund A-2, 5. November 2026).

import { vertrauenAendern, wirke } from "./wirkung";
import { opt, satzAnfang } from "./ereignis-hilfen";
import type { Vorlage } from "./ereignis-hilfen";
import { AEMTER, eigenVon, figurNachId, grollVerschieben, grollWort, hashZahl, loyalitaetVerschieben, merke, sorgeText } from "./personen";
import { ausscheiden } from "./nachfolge";
import type { Figur } from "./spiel-typen";
import type { World } from "./types";
import type { Rng } from "./rng";
import { t } from "../i18n";

/** Mitglieder der Regierung, die im Amt sind und nicht nur kommissarisch führen. */
function regierung(w: World): Figur[] {
  return (w.spiel?.figuren ?? []).filter((f) => f.imAmt && AEMTER[f.amt].regierungsamt && !f.eigen?.kommissarisch);
}

const figurVon = (w: World, ev: { daten?: Record<string, number | string> }): Figur | undefined => figurNachId(w, String(ev.daten?.figur ?? ""));

/** Ämter mit einer Rollenbezeichnung nach Geschlecht im Katalog (ev.person.rolle.*); sonst gilt die gespeicherte Rolle. */
const ROLLE_NACH_GESCHLECHT = new Set(["finanzen", "inneres", "aussen", "zentralbank", "stab", "opposition", "justiz", "generalstab", "wirtschaft", "familie", "arbeit", "umwelt", "energie", "jugend", "kultur", "bildung", "verteidigung", "gesundheit", "landwirtschaft", "handel", "verkehr"]);
const geschlecht = (f: Figur | undefined): "f" | "m" => (f?.weiblich ? "f" : "m");
const rolle = (f: Figur): string => (ROLLE_NACH_GESCHLECHT.has(f.amt) ? t(`ev.person.rolle.${f.amt}`, { g: geschlecht(f) }) : f.rolle);
const wer = (f: Figur | undefined): string => (f ? `${rolle(f)} ${f.name}` : t("ev.person.niemand"));
/** Name, Rolle und Geschlecht einer Person, festgehalten zum Zeitpunkt des Aufrufs. */
const person = (f: Figur | undefined) => ({ wer: wer(f), g: geschlecht(f) });
/** Text aus dem Katalog mit großem Anfangsbuchstaben (falls {wer} am Anfang steht und niemand bekannt ist). */
const T = (k: string, p?: Record<string, string | number>) => satzAnfang(t(k, p));

// ---------------------------------------------------------------------------
// Rücktrittsdrohung

const RUECKTRITT: Vorlage = {
  id: "person_ruecktritt",
  szene: "istanbul",
  frist: 20,
  abkuehlung: 120,
  chance: (w) => (regierung(w).some((f) => f.loyalitaet < 25 && eigenVon(w, f).groll >= 30 && (eigenVon(w, f).drohung === undefined || w.day - eigenVon(w, f).drohung! > 150)) ? 0.25 : 0),
  erzeuge: (w) => {
    const f = regierung(w).sort((a, b) => a.loyalitaet - b.loyalitaet)[0];
    return f ? { provinzen: [], staerke: 1, daten: { figur: f.id } } : null;
  },
  eroeffne: (w, ev) => {
    const f = figurVon(w, ev);
    if (f) eigenVon(w, f).drohung = w.day;
  },
  titel: (w, ev) => T("ev.person_ruecktritt.titel", person(figurVon(w, ev))),
  text: (w, ev) => {
    const f = figurVon(w, ev);
    if (!f) return [t("ev.person_ruecktritt.text.leer")];
    const e = eigenVon(w, f);
    return [t("ev.person_ruecktritt.text1", { ...person(f), loy: Math.round(f.loyalitaet), groll: grollWort(e.groll) }), sorgeText(w, f)];
  },
  warum: () => t("ev.person_ruecktritt.warum"),
  optionen: (w, ev) => {
    const p = person(figurVon(w, ev));
    const k = (x: string) => `ev.person_ruecktritt.opt.${x}`;
    return [
      opt("zugestaendnisse", t(k("zugestaendnisse.label")), t(k("zugestaendnisse.beschr"), p), 3, (ww) => {
        const g = figurVon(ww, ev);
        if (g) {
          loyalitaetVerschieben(g, 15);
          grollVerschieben(ww, g, -25);
          eigenVon(ww, g).mittelBis = ww.day + 120;
          merke(ww, g, t(k("zugestaendnisse.merke")));
        }
        return T(k("zugestaendnisse.ausgang"), person(g));
      }),
      opt("aussprache", t(k("aussprache.label")), t(k("aussprache.beschr"), p), 1, (ww) => {
        const g = figurVon(ww, ev);
        if (g) {
          loyalitaetVerschieben(g, 8);
          grollVerschieben(ww, g, -10);
          merke(ww, g, t(k("aussprache.merke")));
        }
        return T(k("aussprache.ausgang"), person(g));
      }),
      opt("annehmen", t(k("annehmen.label")), t(k("annehmen.beschr"), p), 0, (ww) => {
        const g = figurVon(ww, ev);
        const vorher = person(g);
        if (g) ausscheiden(ww, g, t(k("annehmen.grund")));
        return T(k("annehmen.ausgang"), vorher);
      }),
    ];
  },
  standard: (w, ev) => {
    const f = figurVon(w, ev);
    const vorher = person(f);
    if (f) ausscheiden(w, f, t("ev.person_ruecktritt.standard.grund"));
    return T("ev.person_ruecktritt.standard", vorher);
  },
};

// ---------------------------------------------------------------------------
// Skandal

/** Ämter, deren Inhaber ein Vorwurf treffen kann (Text: ev.person_skandal.vorwurf.<amt>). */
const VORWURF = new Set(["finanzen", "inneres", "aussen", "stab", "justiz", "generalstab", "wirtschaft"]);

const SKANDAL: Vorlage = {
  id: "person_skandal",
  szene: "istanbul",
  frist: 15,
  abkuehlung: 240,
  // Grundrate auch ohne Streit (Messung vom 05.10.: person_*-Ereignisse brauchten Unmut und blieben aus): 0,007 je Monat, bei Unmut 0,012
  // Es zählt die Stimmung derer, die beschuldigt werden können (VORWURF): Mit 17 Ministerien war sonst fast immer jemand unzufrieden,
  // und Skandale kamen um die Hälfte häufiger, ohne dass ein neues Ressort Gegenstand sein konnte (Nachtrag W, AP 3)
  chance: (w) => {
    const l = regierung(w).filter((f) => VORWURF.has(f.amt));
    return l.length ? (l.some((f) => f.loyalitaet < 40 || eigenVon(w, f).groll >= 45) ? 0.012 : 0.007) : 0;
  },
  erzeuge: (w, rng: Rng) => {
    const liste = regierung(w).filter((f) => VORWURF.has(f.amt));
    if (!liste.length) return null;
    // Wer schwach im Rückhalt steht, gerät eher ins Visier
    const gewichte = liste.map((f) => 1 + (100 - f.loyalitaet) / 50 + eigenVon(w, f).groll / 60);
    let r = rng.next() * gewichte.reduce((a, b) => a + b, 0);
    let f = liste[liste.length - 1]!;
    for (let i = 0; i < liste.length; i++) {
      r -= gewichte[i]!;
      if (r <= 0) {
        f = liste[i]!;
        break;
      }
    }
    return { provinzen: [], staerke: 1, daten: { figur: f.id } };
  },
  titel: (w, ev) => T("ev.person_skandal.titel", person(figurVon(w, ev))),
  text: (w, ev) => {
    const f = figurVon(w, ev);
    if (!f) return [t("ev.person_skandal.text.leer")];
    const vorwurf = t(`ev.person_skandal.vorwurf.${VORWURF.has(f.amt) ? f.amt : "allg"}`);
    return [
      t("ev.person_skandal.text1", { ...person(f), vorwurf }),
      t("ev.person_skandal.text2", { ...person(f), loy: Math.round(f.loyalitaet) }),
    ];
  },
  warum: () => t("ev.person_skandal.warum"),
  optionen: (w, ev) => {
    const f = figurVon(w, ev);
    const p = person(f);
    const k = (x: string) => `ev.person_skandal.opt.${x}`;
    const wahr = (ww: World) => hashZahl(`${ww.seed}|skandal|${ev.id}|${f?.id}`) < 0.45;
    return [
      opt("pruefen", t(k("pruefen.label")), t(k("pruefen.beschr"), p), 1, (ww) => {
        const g = figurVon(ww, ev);
        if (!g) return t(k("pruefen.ausgang.leer"));
        vertrauenAendern(ww, 0.3);
        if (wahr(ww)) {
          const vorher = person(g);
          ausscheiden(ww, g, t(k("pruefen.grund")));
          return t(k("pruefen.ausgang.wahr"), vorher);
        }
        loyalitaetVerschieben(g, 12);
        grollVerschieben(ww, g, -10);
        merke(ww, g, t(k("pruefen.merke")));
        return t(k("pruefen.ausgang.falsch"), person(g));
      }),
      opt("stuetzen", t(k("stuetzen.label")), t(k("stuetzen.beschr"), p), 2, (ww) => {
        const g = figurVon(ww, ev);
        if (g) {
          loyalitaetVerschieben(g, 10);
          grollVerschieben(ww, g, -10);
        }
        if (wahr(ww)) {
          vertrauenAendern(ww, -1.4);
          wirke(ww, "legitimitaet", -0.6);
          return t(k("stuetzen.ausgang.wahr"));
        }
        vertrauenAendern(ww, 0.2);
        return t(k("stuetzen.ausgang.falsch"));
      }),
      opt("fallenlassen", t(k("fallenlassen.label")), t(k("fallenlassen.beschr"), p), 0, (ww) => {
        const g = figurVon(ww, ev);
        const vorher = person(g);
        if (g) ausscheiden(ww, g, t(k("fallenlassen.grund")));
        vertrauenAendern(ww, wahr(ww) ? -0.2 : -0.8);
        return T(k("fallenlassen.ausgang"), vorher);
      }),
    ];
  },
  standard: (w, ev) => {
    vertrauenAendern(w, -1.5);
    const f = figurVon(w, ev);
    if (f) grollVerschieben(w, f, 15);
    return t("ev.person_skandal.standard", person(f));
  },
};

// ---------------------------------------------------------------------------
// Intrige

const INTRIGE: Vorlage = {
  id: "person_intrige",
  szene: "parlament",
  frist: 20,
  abkuehlung: 180,
  chance: (w) => (regierung(w).some((f) => eigenVon(w, f).ehrgeiz >= 75 && f.loyalitaet < 55) ? 0.03 : regierung(w).some((f) => eigenVon(w, f).ehrgeiz >= 60 && f.loyalitaet < 65) ? 0.012 : 0),
  erzeuge: (w) => {
    const f = regierung(w).sort((a, b) => eigenVon(w, b).ehrgeiz - eigenVon(w, a).ehrgeiz)[0];
    return f ? { provinzen: [], staerke: 1, daten: { figur: f.id } } : null;
  },
  titel: (w, ev) => T("ev.person_intrige.titel", person(figurVon(w, ev))),
  text: (w, ev) => {
    const f = figurVon(w, ev);
    if (!f) return [t("ev.person_intrige.text.leer")];
    const e = eigenVon(w, f);
    return [t("ev.person_intrige.text1", { ...person(f), ehrgeiz: Math.round(e.ehrgeiz), loy: Math.round(f.loyalitaet) }), t("ev.person_intrige.text2")];
  },
  warum: () => t("ev.person_intrige.warum"),
  optionen: (w, ev) => {
    const p = person(figurVon(w, ev));
    const k = (x: string) => `ev.person_intrige.opt.${x}`;
    return [
      opt("einbinden", t(k("einbinden.label")), t(k("einbinden.beschr"), p), 3, (ww) => {
        const g = figurVon(ww, ev);
        if (g) {
          const e = eigenVon(ww, g);
          loyalitaetVerschieben(g, 12);
          e.ehrgeiz = Math.max(0, e.ehrgeiz - 8);
          e.mittelBis = ww.day + 150;
          grollVerschieben(ww, g, -15);
          merke(ww, g, t(k("einbinden.merke")));
        }
        return T(k("einbinden.ausgang"), person(g));
      }),
      opt("entlassen", t(k("entlassen.label")), t(k("entlassen.beschr"), p), 2, (ww) => {
        const g = figurVon(ww, ev);
        const vorher = person(g);
        if (g) ausscheiden(ww, g, t(k("entlassen.grund")));
        return T(k("entlassen.ausgang"), vorher);
      }),
      opt("beobachten", t(k("beobachten.label")), t(k("beobachten.beschr"), p), 0, (ww) => {
        const g = figurVon(ww, ev);
        if (g) {
          loyalitaetVerschieben(g, -4);
          grollVerschieben(ww, g, 10);
        }
        return t(k("beobachten.ausgang"), person(g));
      }),
    ];
  },
  standard: (w, ev) => {
    const f = figurVon(w, ev);
    if (f) {
      loyalitaetVerschieben(f, -5);
      grollVerschieben(w, f, 12);
    }
    vertrauenAendern(w, -0.4);
    return t("ev.person_intrige.standard", person(f));
  },
};

// ---------------------------------------------------------------------------
// Durchstecherei

const LECK: Vorlage = {
  id: "person_leck",
  szene: "istanbul",
  frist: 12,
  abkuehlung: 150,
  chance: (w) => (regierung(w).some((f) => eigenVon(w, f).groll >= 60) ? 0.06 : 0),
  erzeuge: (w) => {
    const f = regierung(w).sort((a, b) => eigenVon(w, b).groll - eigenVon(w, a).groll)[0];
    return f ? { provinzen: [], staerke: 1, daten: { figur: f.id } } : null;
  },
  titel: () => t("ev.person_leck.titel"),
  text: (w, ev) => {
    const f = figurVon(w, ev);
    return [
      t("ev.person_leck.text1"),
      f ? t("ev.person_leck.text2", { ...person(f), groll: Math.round(eigenVon(w, f).groll) }) : t("ev.person_leck.text2.leer"),
    ];
  },
  warum: () => t("ev.person_leck.warum"),
  optionen: (w, ev) => {
    const p = person(figurVon(w, ev));
    const k = (x: string) => `ev.person_leck.opt.${x}`;
    return [
      opt("dementieren", t(k("dementieren.label")), t(k("dementieren.beschr")), 1, (ww) => {
        vertrauenAendern(ww, -0.5);
        return t(k("dementieren.ausgang"));
      }),
      opt("quelle", t(k("quelle.label")), T(k("quelle.beschr"), p), 2, (ww) => {
        const g = figurVon(ww, ev);
        if (g) {
          loyalitaetVerschieben(g, -8);
          grollVerschieben(ww, g, 8);
          merke(ww, g, t(k("quelle.merke")));
        }
        vertrauenAendern(ww, -0.2);
        return T(k("quelle.ausgang"), person(g));
      }),
      opt("aussitzen", t(k("aussitzen.label")), t(k("aussitzen.beschr")), 0, (ww) => {
        vertrauenAendern(ww, -1.2);
        const g = figurVon(ww, ev);
        if (g) grollVerschieben(ww, g, 4);
        return t(k("aussitzen.ausgang"));
      }),
    ];
  },
  standard: (w) => {
    vertrauenAendern(w, -1.5);
    return t("ev.person_leck.standard");
  },
};

// ---------------------------------------------------------------------------
// Altersrücktritt: Wer lange im Amt ist, geht irgendwann von selbst (Grundrate; Alter und Gesundheit als Zustand der Figuren folgen später)

const ALTER: Vorlage = {
  id: "person_altersruecktritt",
  szene: "istanbul",
  frist: 25,
  abkuehlung: 240,
  // Erst nach drei Regierungsjahren und selten: etwa 0,005 je Monat, also alle paar Jahre einmal (Spielparameter)
  chance: (w) => (regierung(w).length && w.day > 3 * 365 ? 0.005 : 0),
  erzeuge: (w) => {
    const rs = regierung(w);
    if (!rs.length) return null;
    const f = rs[Math.floor(hashZahl(`alter-${w.day}`) * rs.length)]!;
    return { provinzen: [], staerke: 1, daten: { figur: f.id } };
  },
  titel: (w, ev) => T("takt.person.alter.titel", { wer: wer(figurVon(w, ev)) }),
  text: (w, ev) => [T("takt.person.alter.text", { wer: wer(figurVon(w, ev)) })],
  warum: () => t("takt.person.alter.warum"),
  optionen: (w, ev) => [
    opt("verabschieden", t("takt.person.alter.opt.verabschieden.label"), t("takt.person.alter.opt.verabschieden.beschr"), 0, (ww) => {
      const g = figurVon(ww, ev);
      const vorher = wer(g);
      if (g) ausscheiden(ww, g, t("takt.person.alter.grund"));
      return T("takt.person.alter.opt.verabschieden.ausgang", { wer: vorher });
    }),
    opt("bitten", t("takt.person.alter.opt.bitten.label"), t("takt.person.alter.opt.bitten.beschr"), 2, (ww) => {
      const g = figurVon(ww, ev);
      if (g) {
        loyalitaetVerschieben(g, 6);
        grollVerschieben(ww, g, -5);
        merke(ww, g, t("takt.person.alter.merke"));
      }
      return T("takt.person.alter.opt.bitten.ausgang", { wer: wer(g) });
    }),
  ],
  standard: (w, ev) => {
    const f = figurVon(w, ev);
    const vorher = wer(f);
    if (f) ausscheiden(w, f, t("takt.person.alter.grund"));
    return T("takt.person.alter.standard", { wer: vorher });
  },
};

export const PERSONEN_VORLAGEN: Vorlage[] = [RUECKTRITT, SKANDAL, INTRIGE, LECK, ALTER];

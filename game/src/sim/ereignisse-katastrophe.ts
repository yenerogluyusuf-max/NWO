// Katastrophen-Ereignisse (INF-5): Die Vorlagen zum Risiko-Layer aus sim/katastrophe.ts.
// Sie würfeln nie selbst (chance 0) — ausgelöst werden sie allein vom Risiko-Layer,
// der Fall, Schaden und Ort schon angelegt hat. Hier stehen die Texte und die Antworten:
// Soforthilfe (schnell, teuer, Aufmerksamkeit), die öffentliche Wohnungs-Zusage in drei
// Höhen (mehr Applaus jetzt = mehr Versprechensschuld später) und die Untersuchung.
// Danach läuft die Hilfskette im Katastrophen-Dossier weiter (Übergang, Wiederaufbau).
// Alle Zahlen sind Spielparameter der Kalibrierung, keine Tatsachenbehauptungen.
// Texte (Befund A-1, 6. November 2026): alle aus dem Katalog (i18n/katalog/*/nacht_n5.json, Schlüssel ev.<vorlage>.*).

import { wirke, vertrauenAendern } from "./wirkung";
import { setPolicy } from "./handeln";
import { anrede, figur } from "./figuren";
import { AUFMERKSAMKEIT_KOSTEN, verbrauche } from "./aufmerksamkeit";
import { beschr, kosten, netz, opt } from "./ereignis-hilfen";
import type { Vorlage } from "./ereignis-hilfen";
import type { World } from "./types";
import type { OffenesEreignis } from "./spiel-typen";
import type { KatastropheFall } from "./spiel-typen";
import { eroeffnungEffekte, fallMit, nebelStufe, programmMoeglich, soforthilfe, zusageFestlegen, KATASTROPHE } from "./katastrophe";
import { PROVINZEN } from "./regional";
import { t } from "../i18n";

function fallAus(w: World, ev: OffenesEreignis): KatastropheFall {
  const f = fallMit(w, String(ev.daten?.fall ?? ""));
  if (!f) throw new Error(`Katastrophen-Ereignis ohne Fall: ${ev.id}`);
  return f;
}

/** Provinznamen als Aufzählung für den Katalog (`{orte, list}`). */
const orte = (provinzen: number[]): string[] => provinzen.map((p) => PROVINZEN[p - 1]?.name ?? String(p));

/** Stärkestufe für den Titel, mit denselben Schwellen wie `staerkeWort` in sim/katastrophe.ts. */
const stufeVon = (s: number): "verheerend" | "schwer" | "spuerbar" => (s >= 0.85 ? "verheerend" : s >= 0.65 ? "schwer" : "spuerbar");

/**
 * Eine Zahl der Schadenslage nach dem Stand der Aufklärung, als Werte für den Katalog: unsicher (keine Zahl), vermutet
 * (Bandbreite wie `schaetzung` in sim/katastrophe.ts: 70 bis 135 Prozent) oder bekannt (genaue Zahl).
 */
function lage(w: World, fall: KatastropheFall, wert: number, name: string): Record<string, number | string> {
  // Ohne Opfer gibt es keine Bandbreite zu schätzen („0 bis 0“): dann gilt die Meldung als bekannt
  const stufe = nebelStufe(w, fall) === "vermutet" && wert <= 0 ? "bekannt" : nebelStufe(w, fall);
  return { stufe, [name]: wert, [`${name}Von`]: Math.round(wert * 0.7), [`${name}Bis`]: Math.round(wert * 1.35) };
}

/** Satz zu den Todesopfern nach dem Stand der Aufklärung. */
const toteSatz = (w: World, fall: KatastropheFall): string => t("ev.katastrophe.tote", lage(w, fall, fall.tote, "n"));

/** Folge einer Antwort mit Soforthilfe: die Folge und der Hinweis, dass die Soforthilfe Aufmerksamkeit bindet. */
const mitAufmerksamkeit = (folge: string): string => `${beschr(0, 0, folge)} ${t("ev.katastrophe.aufmerksamkeit")}`;

const GROSSBEBEN: Vorlage = {
  id: "grossbeben",
  szene: "anatolien",
  frist: 7,
  abkuehlung: 240,
  chance: () => 0, // nur der Risiko-Layer (sim/katastrophe.ts) löst aus — garantiert Auto-Stopp A
  erzeuge: () => null,
  titel: (_, ev) => t("ev.grossbeben.titel", { stufe: stufeVon(ev.staerke), orte: orte(ev.provinzen) }),
  text: (w, ev) => {
    const fall = fallAus(w, ev);
    const mag = 5.6 + 2.0 * ev.staerke;
    return [
      `${t("ev.grossbeben.text1", { mag, orte: orte(ev.provinzen) })} ${t("ev.grossbeben.lage", { ...lage(w, fall, fall.tote, "tote"), ...lage(w, fall, fall.obdachlos, "obd") })}`,
      t("ev.grossbeben.text2", { wer: anrede(figur(w, "inneres")) || t("ev.grossbeben.wer_ersatz"), bereit: fall.bereitschaft }),
    ];
  },
  warum: (w, ev) => {
    const fall = fallAus(w, ev);
    return t("ev.grossbeben.warum", { bereit: fall.bereitschaft, verhindert: Math.max(0, Math.round(fall.verhindert.tote)) });
  },
  eroeffne: (w, ev) => eroeffnungEffekte(w, fallAus(w, ev)),
  optionen: (w, ev) => {
    const fall = fallAus(w, ev);
    const out = [
      opt("soforthilfe", t("ev.grossbeben.opt.soforthilfe.label"), mitAufmerksamkeit(t("ev.grossbeben.opt.soforthilfe.beschr")), 3, (ww) => {
        verbrauche(ww, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, "Soforthilfe");
        return soforthilfe(ww, fall.id);
      }),
    ];
    // Ein Versprechen gibt es nur, wenn ein Wohnungsbau-Programm es einlösen könnte (Bedarf ab 1.000 Wohnungen); sonst wäre es eine Falle
    if (programmMoeglich(fall)) {
      const zusage = (stufe: "klein" | "voll" | "gross") => Math.max(500, Math.round((fall.wohnungen * KATASTROPHE.zusageStufen[stufe]) / 500) * 500);
      const versprechen = (stufe: "klein" | "voll" | "gross", pk: number) =>
        opt(`versprechen_${stufe}`, t(`ev.grossbeben.opt.versprechen_${stufe}.label`, { n: zusage(stufe) }), mitAufmerksamkeit(t(`ev.grossbeben.opt.versprechen_${stufe}.beschr`)), pk, (ww) => {
          verbrauche(ww, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, "Soforthilfe");
          const a = soforthilfe(ww, fall.id);
          return `${a} ${zusageFestlegen(ww, fall.id, stufe)}`;
        });
      out.push(versprechen("klein", 4), versprechen("voll", 5), versprechen("gross", 6));
    }
    out.push(
      opt("untersuchung", t("ev.grossbeben.opt.untersuchung.label"), mitAufmerksamkeit(t("ev.grossbeben.opt.untersuchung.beschr")), 4, (ww) => {
        verbrauche(ww, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, "Soforthilfe");
        const a = soforthilfe(ww, fall.id);
        wirke(ww, "korruption", -2);
        wirke(ww, "bauqualitaet", 2);
        wirke(ww, "justizvertrauen", 2);
        return t("ev.grossbeben.opt.untersuchung.ausgang", { hilfe: a });
      }),
    );
    return out;
  },
  standard: (w, ev) => {
    const fall = fallAus(w, ev);
    kosten(w, 0.05);
    vertrauenAendern(w, -3 * ev.staerke);
    wirke(w, "p_wohnungsnot", 4 * ev.staerke, fall.provinzen);
    return t("ev.grossbeben.standard");
  },
};

const FLUT: Vorlage = {
  id: "katastrophe_flut",
  szene: "anatolien",
  frist: 8,
  abkuehlung: 240,
  chance: () => 0,
  erzeuge: () => null,
  titel: () => t("ev.katastrophe_flut.titel"),
  text: (w, ev) => {
    const fall = fallAus(w, ev);
    return [`${t("ev.katastrophe_flut.text1", { orte: orte(ev.provinzen) })} ${toteSatz(w, fall)}`, t("ev.katastrophe_flut.text2")];
  },
  warum: () => t("ev.katastrophe_flut.warum"),
  eroeffne: (w, ev) => eroeffnungEffekte(w, fallAus(w, ev)),
  optionen: (w, ev) => {
    const fall = fallAus(w, ev);
    return [
      opt("soforthilfe", t("ev.katastrophe_flut.opt.soforthilfe.label"), mitAufmerksamkeit(t("ev.katastrophe_flut.opt.soforthilfe.beschr")), 3, (ww) => {
        verbrauche(ww, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, "Soforthilfe");
        return soforthilfe(ww, fall.id);
      }),
      opt("umsiedlung", t("ev.katastrophe_flut.opt.umsiedlung.label"), mitAufmerksamkeit(t("ev.katastrophe_flut.opt.umsiedlung.beschr")), 4, (ww) => {
        verbrauche(ww, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, "Soforthilfe");
        const a = soforthilfe(ww, fall.id);
        kosten(ww, 0.12);
        wirke(ww, "landflucht", 2, fall.provinzen);
        wirke(ww, "verkehrsnetz", 2 * ev.staerke, fall.provinzen);
        vertrauenAendern(ww, -0.5);
        return t("ev.katastrophe_flut.opt.umsiedlung.ausgang", { hilfe: a });
      }),
    ];
  },
  standard: (w, ev) => {
    const fall = fallAus(w, ev);
    vertrauenAendern(w, -2 * ev.staerke);
    wirke(w, "verkehrsnetz", -2 * ev.staerke, fall.provinzen);
    return t("ev.katastrophe_flut.standard");
  },
};

const WALDBRAND: Vorlage = {
  id: "katastrophe_waldbrand",
  szene: "anatolien",
  frist: 8,
  abkuehlung: 240,
  chance: () => 0,
  erzeuge: () => null,
  titel: () => t("ev.katastrophe_waldbrand.titel"),
  text: (w, ev) => {
    const fall = fallAus(w, ev);
    return [`${t("ev.katastrophe_waldbrand.text1", { orte: orte(ev.provinzen) })} ${toteSatz(w, fall)}`, t("ev.katastrophe_waldbrand.text2")];
  },
  warum: () => t("ev.katastrophe_waldbrand.warum"),
  eroeffne: (w, ev) => eroeffnungEffekte(w, fallAus(w, ev)),
  optionen: (w, ev) => {
    const fall = fallAus(w, ev);
    return [
      opt("loeschen", t("ev.katastrophe_waldbrand.opt.loeschen.label"), mitAufmerksamkeit(t("ev.katastrophe_waldbrand.opt.loeschen.beschr")), 3, (ww) => {
        verbrauche(ww, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, "Soforthilfe");
        const a = soforthilfe(ww, fall.id);
        wirke(ww, "tourismus", 2 * ev.staerke, fall.provinzen);
        return t("ev.katastrophe_waldbrand.opt.loeschen.ausgang", { hilfe: a });
      }),
      opt("aufforsten", t("ev.katastrophe_waldbrand.opt.aufforsten.label"), mitAufmerksamkeit(t("ev.katastrophe_waldbrand.opt.aufforsten.beschr")), 4, (ww) => {
        verbrauche(ww, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, "Soforthilfe");
        const a = soforthilfe(ww, fall.id);
        kosten(ww, 0.06);
        wirke(ww, "landwirtschaft_einkommen", 3 * ev.staerke, fall.provinzen);
        wirke(ww, "klimaschutz", 1);
        return t("ev.katastrophe_waldbrand.opt.aufforsten.ausgang", { hilfe: a });
      }),
    ];
  },
  standard: (w, ev) => {
    const fall = fallAus(w, ev);
    wirke(w, "tourismus", -3 * ev.staerke, fall.provinzen);
    vertrauenAendern(w, -1.5 * ev.staerke);
    return t("ev.katastrophe_waldbrand.standard");
  },
};

const DUERRE: Vorlage = {
  id: "katastrophe_duerre",
  szene: "anatolien",
  frist: 12,
  abkuehlung: 240,
  chance: () => 0,
  erzeuge: () => null,
  titel: () => t("ev.katastrophe_duerre.titel"),
  text: (w) => [t("ev.katastrophe_duerre.text1"), t("ev.katastrophe_duerre.text2", { wer: anrede(figur(w, "finanzen")) || t("ev.katastrophe_duerre.wer_ersatz") })],
  warum: () => t("ev.katastrophe_duerre.warum"),
  eroeffne: (w, ev) => eroeffnungEffekte(w, fallAus(w, ev)),
  optionen: (w, ev) => {
    const fall = fallAus(w, ev);
    return [
      opt("hilfe", t("ev.katastrophe_duerre.opt.hilfe.label"), mitAufmerksamkeit(t("ev.katastrophe_duerre.opt.hilfe.beschr")), 3, (ww) => {
        verbrauche(ww, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, "Soforthilfe");
        return soforthilfe(ww, fall.id);
      }),
      opt("bewaesserung", t("ev.katastrophe_duerre.opt.bewaesserung.label"), mitAufmerksamkeit(t("ev.katastrophe_duerre.opt.bewaesserung.beschr")), 4, (ww) => {
        verbrauche(ww, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, "Soforthilfe");
        const a = soforthilfe(ww, fall.id);
        setPolicy(ww, "m_bewaesserung", Math.min(100, netz(ww, "m_bewaesserung") + 10));
        wirke(ww, "landwirte", 2 * ev.staerke);
        return t("ev.katastrophe_duerre.opt.bewaesserung.ausgang", { hilfe: a });
      }),
    ];
  },
  standard: (w, ev) => {
    const fall = fallAus(w, ev);
    wirke(w, "landwirte", -3 * ev.staerke);
    wirke(w, "landflucht", 2 * ev.staerke, fall.provinzen);
    vertrauenAendern(w, -1.5 * ev.staerke);
    return t("ev.katastrophe_duerre.standard");
  },
};

export const KATASTROPHE_VORLAGEN: Vorlage[] = [GROSSBEBEN, FLUT, WALDBRAND, DUERRE];

// Katastrophen-Ereignisse (INF-5): Die Vorlagen zum Risiko-Layer aus sim/katastrophe.ts.
// Sie würfeln nie selbst (chance 0) — ausgelöst werden sie allein vom Risiko-Layer,
// der Fall, Schaden und Ort schon angelegt hat. Hier stehen die Texte und die Antworten:
// Soforthilfe (schnell, teuer, Aufmerksamkeit), die öffentliche Wohnungs-Zusage in drei
// Höhen (mehr Applaus jetzt = mehr Versprechensschuld später) und die Untersuchung.
// Danach läuft die Hilfskette im Katastrophen-Dossier weiter (Übergang, Wiederaufbau).
// Alle Zahlen sind Spielparameter der Kalibrierung, keine Tatsachenbehauptungen.

import { wirke, vertrauenAendern } from "./wirkung";
import { setPolicy } from "./handeln";
import { anrede, figur } from "./figuren";
import { AUFMERKSAMKEIT_KOSTEN, verbrauche } from "./aufmerksamkeit";
import { beschr, kosten, namen, netz, nf, opt } from "./ereignis-hilfen";
import type { Vorlage } from "./ereignis-hilfen";
import type { World } from "./types";
import type { OffenesEreignis } from "./spiel-typen";
import type { KatastropheFall } from "./spiel-typen";
import { eroeffnungEffekte, fallMit, schaetzung, soforthilfe, staerkeWort, zusageFestlegen, KATASTROPHE } from "./katastrophe";

function fallAus(w: World, ev: OffenesEreignis): KatastropheFall {
  const f = fallMit(w, String(ev.daten?.fall ?? ""));
  if (!f) throw new Error(`Katastrophen-Ereignis ohne Fall: ${ev.id}`);
  return f;
}

const GROSSBEBEN: Vorlage = {
  id: "grossbeben",
  szene: "anatolien",
  frist: 7,
  abkuehlung: 240,
  chance: () => 0, // nur der Risiko-Layer (sim/katastrophe.ts) löst aus — garantiert Auto-Stopp A
  erzeuge: () => null,
  titel: (_, ev) => `${staerkeWort(ev.staerke)[0]!.toUpperCase()}${staerkeWort(ev.staerke).slice(1)}es Erdbeben in ${namen(ev.provinzen)}`,
  text: (w, ev) => {
    const fall = fallAus(w, ev);
    const mag = 5.6 + 2.0 * ev.staerke;
    return [
      `Ein Erdbeben der Stärke ${nf(mag)} erschüttert ${namen(ev.provinzen)}. Erste Meldungen sprechen von ${schaetzung(w, fall, fall.tote)} Todesopfern und ${schaetzung(w, fall, fall.obdachlos)} Menschen ohne Dach über dem Kopf — die Lage ist in diesen Stunden noch unklar.`,
      `${anrede(figur(w, "inneres"))} bittet um Anweisungen. Die Rettungskräfte der Katastrophenbehörde sind unterwegs (Bereitschaft ${fall.bereitschaft} von 100); jetzt entscheidet sich, wie der Staat in den nächsten Wochen auftritt — und was er verspricht.`,
    ];
  },
  warum: (w, ev) => {
    const fall = fallAus(w, ev);
    const v = fall.verhindert;
    return `Opferzahlen hängen an Bauqualität, Erdbebenvorsorge und der Bereitschaft des Katastrophenschutzes (Stand ${fall.bereitschaft}). ${
      v.tote > 0 ? `Nach Modellrechnung hat die vorhandene Bereitschaft etwa ${nf(v.tote)} Todesopfer verhindert (Bandbreite ±25 %).` : "Eine bessere Vorsorge hätte die Opferzahlen spürbar gedrückt."
    } Was der Präsident heute verspricht, wird am Ende der Amtszeit gegen die Lieferung gehalten.`;
  },
  eroeffne: (w, ev) => eroeffnungEffekte(w, fallAus(w, ev)),
  optionen: (w, ev) => {
    const fall = fallAus(w, ev);
    const out = [
      opt("soforthilfe", "Soforthilfe anordnen", beschr(3, 0.1 * ev.staerke + 0.04, "Rettung, Zelte, Feldlazarette; klärt die Schadenslage schneller auf. Kostet Aufmerksamkeit."), 3, (ww) => {
        verbrauche(ww, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, "Soforthilfe");
        return soforthilfe(ww, fall.id);
      }),
    ];
    if (fall.wohnungen >= 500) {
      const zusage = (stufe: "klein" | "voll" | "gross") => {
        const wohnungen = Math.max(500, Math.round((fall.wohnungen * KATASTROPHE.zusageStufen[stufe]) / 500) * 500);
        return wohnungen;
      };
      out.push(
        opt(
          "versprechen_klein",
          `Soforthilfe und bescheidenes Versprechen (${nf(zusage("klein"))} Wohnungen)`,
          beschr(4, 0.14, "etwas Zustimmung jetzt, wenig Versprechensschuld später; dazu Soforthilfe und Aufmerksamkeit."),
          4,
          (ww) => {
            verbrauche(ww, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, "Soforthilfe");
            const a = soforthilfe(ww, fall.id);
            return `${a} ${zusageFestlegen(ww, fall.id, "klein")}`;
          },
        ),
        opt(
          "versprechen_voll",
          `Soforthilfe und volles Versprechen (${nf(zusage("voll"))} Wohnungen)`,
          beschr(5, 0.14, "spürbare Zustimmung jetzt, volle Versprechensschuld; dazu Soforthilfe und Aufmerksamkeit."),
          5,
          (ww) => {
            verbrauche(ww, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, "Soforthilfe");
            const a = soforthilfe(ww, fall.id);
            return `${a} ${zusageFestlegen(ww, fall.id, "voll")}`;
          },
        ),
        opt(
          "versprechen_gross",
          `Soforthilfe und großes Versprechen (${nf(zusage("gross"))} Wohnungen)`,
          beschr(6, 0.14, "viel Zustimmung jetzt — und eine Schuld, die am Ende der Amtszeit gemessen wird; dazu Soforthilfe und Aufmerksamkeit."),
          6,
          (ww) => {
            verbrauche(ww, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, "Soforthilfe");
            const a = soforthilfe(ww, fall.id);
            return `${a} ${zusageFestlegen(ww, fall.id, "gross")}`;
          },
        ),
      );
    }
    out.push(
      opt("untersuchung", "Soforthilfe und Untersuchung der Bauaufsicht", beschr(4, 0.14, "ehrlich statt laut: Wer gepfuscht hat, wird zur Rechenschaft gezogen; dazu Soforthilfe und Aufmerksamkeit."), 4, (ww) => {
        verbrauche(ww, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, "Soforthilfe");
        const a = soforthilfe(ww, fall.id);
        wirke(ww, "korruption", -2);
        wirke(ww, "bauqualitaet", 2);
        wirke(ww, "justizvertrauen", 2);
        return `${a} Eine unabhängige Untersuchung der Bauaufsicht beginnt.`;
      }),
    );
    return out;
  },
  standard: (w, ev) => {
    const fall = fallAus(w, ev);
    kosten(w, 0.05);
    vertrauenAendern(w, -3 * ev.staerke);
    wirke(w, "p_wohnungsnot", 4 * ev.staerke, fall.provinzen);
    return "Der Staat reagiert zu spät; die Menschen in den Trümmern fühlen sich allein gelassen, und niemand hat etwas versprochen — auch das wird sich gemerkt.";
  },
};

const FLUT: Vorlage = {
  id: "katastrophe_flut",
  szene: "anatolien",
  frist: 8,
  abkuehlung: 240,
  chance: () => 0,
  erzeuge: () => null,
  titel: () => "Sturzflut am Schwarzen Meer",
  text: (w, ev) => {
    const fall = fallAus(w, ev);
    return [
      `Nach Tagen des Regens sind in ${namen(ev.provinzen)} die Flüsse über die Ufer getreten; das Wasser hat Häuser, Brücken und Straßen mitgerissen. Gemeldet werden ${schaetzung(w, fall, fall.tote)} Todesopfer.`,
      "Die Katastrophenbehörde bittet um Anweisungen; in den Tälern harren Menschen auf Dächern und Brücken aus.",
    ];
  },
  warum: () => "Steile Täler, Bebauung an Bachläufen und fehlender Hochwasserschutz machen aus Starkregen eine Katastrophe; die Bereitschaft der Behörde entscheidet über die Opferzahlen.",
  eroeffne: (w, ev) => eroeffnungEffekte(w, fallAus(w, ev)),
  optionen: (w, ev) => {
    const fall = fallAus(w, ev);
    return [
      opt("soforthilfe", "Soforthilfe und Räumung der Gefahrenlagen", beschr(3, 0.08, "Rettung und Notunterkünfte; klärt die Schadenslage schneller auf. Kostet Aufmerksamkeit."), 3, (ww) => {
        verbrauche(ww, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, "Soforthilfe");
        return soforthilfe(ww, fall.id);
      }),
      opt("umsiedlung", "Siedlungen aus den Bachläufen verlegen", beschr(4, 0.2, "langfristig sicherer, kurzfristig unbeliebt bei den Umzuziehenden."), 4, (ww) => {
        verbrauche(ww, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, "Soforthilfe");
        const a = soforthilfe(ww, fall.id);
        kosten(ww, 0.12);
        wirke(ww, "landflucht", 2, fall.provinzen);
        wirke(ww, "verkehrsnetz", 2 * ev.staerke, fall.provinzen);
        vertrauenAendern(ww, -0.5);
        return `${a} Gefährdete Siedlungen werden verlegt — die Betroffenen protestieren, die Nachkommen werden es danken.`;
      }),
    ];
  },
  standard: (w, ev) => {
    const fall = fallAus(w, ev);
    vertrauenAendern(w, -2 * ev.staerke);
    wirke(w, "verkehrsnetz", -2 * ev.staerke, fall.provinzen);
    return "Die Hilfe kommt spät; die Menschen in den Tälern fühlen sich im Stich gelassen.";
  },
};

const WALDBRAND: Vorlage = {
  id: "katastrophe_waldbrand",
  szene: "anatolien",
  frist: 8,
  abkuehlung: 240,
  chance: () => 0,
  erzeuge: () => null,
  titel: () => "Großbrände an der Küste",
  text: (w, ev) => {
    const fall = fallAus(w, ev);
    return [
      `Großbrände wüten in ${namen(ev.provinzen)}: Wälder, Olivenhaine und Ortsteile brennen, Hotels werden geräumt. Gemeldet werden ${schaetzung(w, fall, fall.tote)} Todesopfer; der Rauch liegt über der Küste.`,
      "Die Löschflugzeuge sind im Dauereinsatz; die Frage ist, was der Staat darüber hinaus tut.",
    ];
  },
  warum: () => "Heiße Sommer, trockene Winde und Monokulturen machen aus Funken Flächenbrände; Löschkapazität und Bereitschaft entscheiden, was übrig bleibt.",
  eroeffne: (w, ev) => eroeffnungEffekte(w, fallAus(w, ev)),
  optionen: (w, ev) => {
    const fall = fallAus(w, ev);
    return [
      opt("loeschen", "Alle Löschkapazitäten und Soforthilfe mobilisieren", beschr(3, 0.08, "begrenzt den Schaden an Wald, Ernte und Saison. Kostet Aufmerksamkeit."), 3, (ww) => {
        verbrauche(ww, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, "Soforthilfe");
        const a = soforthilfe(ww, fall.id);
        wirke(ww, "tourismus", 2 * ev.staerke, fall.provinzen);
        return `${a} Die Brände sind nach Tagen unter Kontrolle.`;
      }),
      opt("aufforsten", "Aufforsten und Wiederaufbau der Gehöfte", beschr(4, 0.12, "teurer und langsamer, dafür bleibt die Region bewohnbar."), 4, (ww) => {
        verbrauche(ww, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, "Soforthilfe");
        const a = soforthilfe(ww, fall.id);
        kosten(ww, 0.06);
        wirke(ww, "landwirtschaft_einkommen", 3 * ev.staerke, fall.provinzen);
        wirke(ww, "klimaschutz", 1);
        return `${a} Ein Aufforstungsprogramm beginnt; verbrannte Gehöfte werden wieder aufgebaut.`;
      }),
    ];
  },
  standard: (w, ev) => {
    const fall = fallAus(w, ev);
    wirke(w, "tourismus", -3 * ev.staerke, fall.provinzen);
    vertrauenAendern(w, -1.5 * ev.staerke);
    return "Die Brände greifen weiter um sich; die Bilder von brennenden Hotels gehen um die Welt.";
  },
};

const DUERRE: Vorlage = {
  id: "katastrophe_duerre",
  szene: "anatolien",
  frist: 12,
  abkuehlung: 240,
  chance: () => 0,
  erzeuge: () => null,
  titel: () => "Wassernot im Konya-Becken",
  text: (w, ev) => {
    return [
      `Im Konya-Becken versiegen Brunnen und Talsperren: Das zweite Jahr in Folge bleibt der Regen aus, die Grundwasserstände fallen. Die Bauern des Beckens fahren ihre Traktoren vor die Provinzhauptstadt.`,
      `${anrede(figur(w, "finanzen"))} erinnert an die Haushaltslage; der Bauernverband fordert Soforthilfe und ein Bewässerungsprogramm.`,
    ];
  },
  warum: () => "Das geschlossene Becken lebt vom Grundwasser; wer es tiefer pumpt, als es sich füllt, erntet Ernteausfälle und Wanderdünen. Die Wassermangel-Lage der Provinzen treibt die Wahrscheinlichkeit dieser Krise.",
  eroeffne: (w, ev) => eroeffnungEffekte(w, fallAus(w, ev)),
  optionen: (w, ev) => {
    const fall = fallAus(w, ev);
    return [
      opt("hilfe", "Soforthilfe für die Landwirte des Beckens", beschr(3, 0.1, "Wassertransporte und Ausgleichszahlungen; hält die Höfe über die Saison. Kostet Aufmerksamkeit."), 3, (ww) => {
        verbrauche(ww, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, "Soforthilfe");
        return soforthilfe(ww, fall.id);
      }),
      opt("bewaesserung", "Soforthilfe und Bewässerungsprogramm vorziehen", beschr(4, 0.1, "die Ursache angehen statt nur die Not lindern; dazu Aufmerksamkeit."), 4, (ww) => {
        verbrauche(ww, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, "Soforthilfe");
        const a = soforthilfe(ww, fall.id);
        setPolicy(ww, "m_bewaesserung", Math.min(100, netz(ww, "m_bewaesserung") + 10));
        wirke(ww, "landwirte", 2 * ev.staerke);
        return `${a} Das Bewässerungsprogramm wird vorgezogen.`;
      }),
    ];
  },
  standard: (w, ev) => {
    const fall = fallAus(w, ev);
    wirke(w, "landwirte", -3 * ev.staerke);
    wirke(w, "landflucht", 2 * ev.staerke, fall.provinzen);
    vertrauenAendern(w, -1.5 * ev.staerke);
    return "Ohne Antwort geben die ersten Höfe auf; die Wanderdünen rücken vor.";
  },
};

export const KATASTROPHE_VORLAGEN: Vorlage[] = [GROSSBEBEN, FLUT, WALDBRAND, DUERRE];

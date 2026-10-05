// Reine Lesefunktionen für Kopfleiste und Schreibtisch: Mehrheit (Lager, Duldung, Opposition getrennt), Kapital-Aufschlüsselung
// aus derselben Rechnung wie die Gutschrift, und die drei Startfragen des Schreibtischs.

import { aktuelleLocale, t } from "../../i18n";
import { REGELN, stimmenSicht } from "../../sim/handeln";
import { kapitalEinkommen, type KapitalEinkommen } from "../../sim/spiel";
import { akuteProbleme } from "../../sim/vorschlaege";
import type { World } from "../../sim/types";

export interface MehrheitsSicht {
  /** false, wenn es (noch) kein Parlament gibt: dann zeigt die Oberfläche keine Sitzzahl */
  vorhanden: boolean;
  lager: number;
  geduldet: number;
  opposition: number;
  schwelle: number;
  /** Lager plus Duldung erreicht die Schwelle */
  steht: boolean;
  fehlt: number;
}

export function mehrheitsSicht(w: World): MehrheitsSicht {
  const vorhanden = !!w.parliament && !!w.player;
  if (!vorhanden) return { vorhanden, lager: 0, geduldet: 0, opposition: 0, schwelle: REGELN.mehrheit, steht: false, fehlt: REGELN.mehrheit };
  const s = stimmenSicht(w);
  const lager = s.lager;
  const geduldet = s.duldungSitze;
  const opposition = Math.max(0, 600 - lager - geduldet);
  const summe = lager + geduldet;
  return { vorhanden, lager, geduldet, opposition, schwelle: REGELN.mehrheit, steht: summe >= REGELN.mehrheit, fehlt: Math.max(0, REGELN.mehrheit - summe) };
}

export interface KapitalTeil {
  label: string;
  wert: number;
}

/** Die Teile der monatlichen Gutschrift; sie addieren sich genau zu `summe` (Test in test/akte-lage.test.ts). */
export function kapitalTeile(k: KapitalEinkommen): KapitalTeil[] {
  return [
    { label: t("akte.kapital.grund"), wert: k.grund },
    { label: t("akte.kapital.vertrauen"), wert: k.vertrauen },
    { label: t("akte.kapital.mehrheit"), wert: k.mehrheit },
    { label: t("akte.kapital.legitimitaet"), wert: k.legitimitaet },
    { label: t("akte.kapital.kabinett"), wert: k.kabinett },
    { label: t("akte.kapital.unterhalt"), wert: -k.unterhalt },
    { label: t("akte.kapital.altlast"), wert: -k.altlast },
  ];
}

export function kapitalErklaerung(w: World): string {
  const k = kapitalEinkommen(w);
  const z = (x: number) => x.toLocaleString(aktuelleLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const teile = kapitalTeile(k)
    .filter((p) => Math.abs(p.wert) >= 0.05)
    .map((p) => `${p.label} ${p.wert >= 0 ? "+" : "−"}${z(Math.abs(p.wert))}`)
    .join(", ");
  return t("akte.kapital.erklaerung", { summe: z(k.summe), teile, naechste: k.naechste, grenze: k.grenze });
}

export interface StartFragen {
  abhaengig: string;
  zuerst: string;
  liegenLassen: string;
}

/** Die drei Fragen, die der Schreibtisch zu Beginn beantwortet (nur aus vorhandenen Daten). */
export function startFragen(w: World): StartFragen {
  const m = mehrheitsSicht(w);
  const spiel = w.spiel;
  const partner = (spiel?.lager ?? []).join(", ");
  const abhaengig = !m.vorhanden
    ? t("akte.fragen.keinParlament")
    : m.geduldet > 0
      ? t("akte.fragen.abhaengigDuldung", { lager: m.lager, geduldet: m.geduldet, schwelle: m.schwelle, partner: partner || "—" })
      : m.steht
        ? t("akte.fragen.abhaengigLager", { lager: m.lager, schwelle: m.schwelle, partner: partner || "—" })
        : t("akte.fragen.abhaengigFehlt", { lager: m.lager, fehlt: m.fehlt, schwelle: m.schwelle });
  const offen = (spiel?.zusagen ?? []).filter((z) => !z.erfuellt && !z.gebrochen).sort((a, b) => a.faellig - b.faellig);
  const erste = offen[0];
  const zuerst = erste
    ? t("akte.fragen.zuerst", { text: erste.text, tage: Math.max(0, erste.faellig - w.day), von: erste.von })
    : t("akte.fragen.keineZusage");
  const probleme = spiel ? akuteProbleme(w).slice().sort((a, b) => a.last - b.last) : [];
  const klein = probleme.filter((p) => p.last < 0.05).slice(0, 2);
  const liegenLassen = klein.length
    ? t("akte.fragen.liegenLassen", { probleme: klein.map((p) => `${p.name} (${p.provinzen.length})`).join(", ") })
    : t("akte.fragen.nichtsLiegen");
  return { abhaengig, zuerst, liegenLassen };
}

// Der Ausnahmezustand als Vorgang (befund-B B-5). Quelle: Verfassung Art. 119 in der Fassung des Gesetzes Nr. 6771 (Wortlaut
// mevzuat.gov.tr, TR-kanun-2709#art=119, abgerufen 06.11.2026):
//   „Cumhurbaşkanı; savaş, savaşı gerektirecek bir durumun başgöstermesi, seferberlik, ayaklanma, … şiddet hareketlerinin yaygınlaşması,
//   … tabiî afet veya tehlikeli salgın hastalık ya da ağır ekonomik bunalımın ortaya çıkması hallerinde … süresi altı ayı geçmemek üzere
//   olağanüstü hal ilan edebilir. Olağanüstü hal ilanı kararı, verildiği gün Resmî Gazetede yayımlanır ve aynı gün Türkiye Büyük Millet
//   Meclisinin onayına sunulur. … Cumhurbaşkanının talebiyle Türkiye Büyük Millet Meclisi her defasında dört ayı geçmemek üzere süreyi
//   uzatabilir. Savaş hallerinde bu dört aylık süre aranmaz.“
// Im Spiel: Ausrufen nur bei einem Anlass aus dieser Liste, Abstimmung des Parlaments noch am selben Tag (Mehrheit der Anwesenden,
// Art. 96), höchstens 180 Tage, Verlängerung um höchstens 120 Tage als neue Abstimmung, im Krieg ohne diese Grenze. Solange er gilt, steht
// die Maßnahme „Ausnahmezustand und Sonderbefugnisse“ auf der Stufe Ausnahmezustand, und ihre Kanten im Politiknetz wirken; danach
// fällt sie auf die Stufe vor dem Ausrufen zurück. Die Schwellen der Anlässe sind Spielparameter.

import type { World } from "./types";
import { GESETZ_SCHWELLE, plenumAbstimmung, pruefeVorhaben, setPolicy, stimmenSicht, type Ergebnis } from "./handeln";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { addDays, formatDateDe } from "./dates";
import { addLog } from "./log";
import { vertrauenAendern } from "./wirkung";
import { kannZahlen } from "./kapital";
import { AUFMERKSAMKEIT_KOSTEN, neuanfangGrund, verbrauche } from "./aufmerksamkeit";
import { t } from "../i18n";

export const NOTSTAND = {
  /** Art. 119: „süresi altı ayı geçmemek üzere“ */
  hoechstTage: 180,
  /** Art. 119: „her defasında dört ayı geçmemek üzere“ */
  verlaengerungTage: 120,
  /** Stufe der Maßnahme im Ausnahmezustand (data/skalen.ts m_notstand: 90 „Ausnahmezustand“) */
  stufe: 90,
  /** Vertrauen beim Ausrufen und bei jeder Verlängerung (Spielparameter) */
  vertrauen: -1.5,
  /** Anlässe: Schwellen der Spielwerte (Spielparameter) */
  terror: 65,
  protest: 70,
  inflation: 60,
  katastropheTage: 90,
  putschTage: 60,
} as const;

export type NotstandAnlass = "krieg" | "katastrophe" | "terror" | "unruhen" | "wirtschaft" | "putsch";

export interface NotstandZustand {
  seit: number;
  bis: number;
  anlass: NotstandAnlass;
  /** Stufe der Maßnahme vor dem Ausrufen: dahin geht sie zurück */
  vorher: number;
  verlaengerungen: number;
}

const wert = (w: World, id: string): number => (NET.index.get(id) === undefined ? 0 : nationalAverage(NET, w.net, id));

/** Welche Anlässe aus Art. 119 gerade vorliegen. */
export function notstandsAnlaesse(w: World): NotstandAnlass[] {
  const sp = w.spiel;
  if (!sp) return [];
  const out: NotstandAnlass[] = [];
  if ((sp.kriege ?? []).some((k) => k.phase === "krieg" || k.phase === "beschluss")) out.push("krieg");
  if ((sp.katastrophen?.faelle ?? []).some((f) => w.day - f.tag <= NOTSTAND.katastropheTage)) out.push("katastrophe");
  if (wert(w, "terrorgefahr") >= NOTSTAND.terror) out.push("terror");
  if (wert(w, "protestdruck") >= NOTSTAND.protest) out.push("unruhen");
  if (w.economy.inflation >= NOTSTAND.inflation) out.push("wirtschaft");
  const putsch = sp.enden?.putsch?.letzterVersuch;
  if (putsch !== undefined && w.day - putsch <= NOTSTAND.putschTage) out.push("putsch");
  return out;
}

export function notstandVon(w: World): NotstandZustand | undefined {
  return w.spiel?.gesetzgebung?.notstand;
}

export interface NotstandSicht {
  aktiv?: { anlass: NotstandAnlass; bis: number; datum: string; tageRest: number; verlaengerungen: number; krieg: boolean };
  anlaesse: NotstandAnlass[];
  /** Erwartete Unterstützer im Parlament und nötige Zahl (Art. 96) */
  ja: number;
  schwelle: number;
  pk: number;
  bezahlbar: boolean;
  moeglich: boolean;
  grund?: string;
}

function kosten(w: World): number {
  return pruefeVorhaben(w, "m_notstand", NOTSTAND.stufe).gesetz.pk;
}

export function notstandSicht(w: World): NotstandSicht {
  const sp = w.spiel;
  const z = notstandVon(w);
  const anlaesse = notstandsAnlaesse(w);
  const ja = stimmenSicht(w, { massnahme: "m_notstand", richtung: 1 }).erwartet;
  const pk = kosten(w);
  const bezahlbar = kannZahlen(sp?.kapital ?? 0, pk);
  const pause = neuanfangGrund(w);
  const aktiv = z
    ? { anlass: z.anlass, bis: z.bis, datum: formatDateDe(addDays(w.date, z.bis - w.day)), tageRest: Math.max(0, z.bis - w.day), verlaengerungen: z.verlaengerungen, krieg: anlaesse.includes("krieg") }
    : undefined;
  const grund = !sp ? t("n4.grund.nichtMoeglich") : sp.ende ? t("n4.grund.ende") : pause ? pause : !z && anlaesse.length === 0 ? t("n4.not.keinAnlass") : !bezahlbar ? t("n4.not.kapital", { n: pk, da: Math.floor(sp.kapital) }) : undefined;
  return { ...(aktiv ? { aktiv } : {}), anlaesse, ja, schwelle: GESETZ_SCHWELLE, pk, bezahlbar, moeglich: grund === undefined, ...(grund ? { grund } : {}) };
}

function zustand(w: World) {
  return (w.spiel!.gesetzgebung ??= { ruhe: {}, beschlossen: [], pruefungen: [], vorher: {} });
}

/** Ausrufen: sofort in Kraft, noch am selben Tag stimmt das Parlament ab. Lehnt es ab, endet der Ausnahmezustand. */
export function rufeNotstandAus(w: World, anlass?: NotstandAnlass): Ergebnis {
  const s = notstandSicht(w);
  if (s.aktiv) return { ok: false, text: t("n4.not.schonAktiv", { datum: s.aktiv.datum }) };
  if (!s.moeglich) return { ok: false, text: s.grund! };
  const a = anlass && s.anlaesse.includes(anlass) ? anlass : s.anlaesse[0]!;
  const sp = w.spiel!;
  sp.kapital -= s.pk;
  verbrauche(w, AUFMERKSAMKEIT_KOSTEN.erlass, t("n4.not.titel"));
  const vorher = Math.round(wert(w, "m_notstand"));
  const e = plenumAbstimmung(w, "notstand-ausrufen", s.ja);
  const anlassWort = t(`n4.not.anlass.${a}`);
  if (!e.angenommen) {
    vertrauenAendern(w, -1);
    const text = t("n4.not.abgelehnt", { anlass: anlassWort, ja: e.ja, nein: e.nein });
    addLog(w, "entscheidung", text, t("n4.not.abgelehntWarum", { pk: s.pk }));
    return { ok: false, text };
  }
  setPolicy(w, "m_notstand", NOTSTAND.stufe, null);
  vertrauenAendern(w, NOTSTAND.vertrauen);
  zustand(w).notstand = { seit: w.day, bis: w.day + NOTSTAND.hoechstTage, anlass: a, vorher, verlaengerungen: 0 };
  const datum = formatDateDe(addDays(w.date, NOTSTAND.hoechstTage));
  const text = t("n4.not.ausgerufen", { anlass: anlassWort, ja: e.ja, nein: e.nein, datum });
  const why = t("n4.not.ausgerufenWarum", { pk: s.pk, tage: NOTSTAND.hoechstTage });
  addLog(w, "entscheidung", text, why);
  return { ok: true, text, why };
}

/** Verlängern: auf Antrag des Präsidenten, je höchstens vier Monate, neue Abstimmung. */
export function verlaengereNotstand(w: World): Ergebnis {
  const z = notstandVon(w);
  const s = notstandSicht(w);
  if (!z || !s.aktiv) return { ok: false, text: t("n4.not.nichtAktiv") };
  if (!s.bezahlbar) return { ok: false, text: t("n4.not.kapital", { n: s.pk, da: Math.floor(w.spiel!.kapital) }) };
  w.spiel!.kapital -= s.pk;
  const e = plenumAbstimmung(w, `notstand-verlaengern-${z.verlaengerungen}`, s.ja);
  if (!e.angenommen) {
    const text = t("n4.not.verlaengerungAbgelehnt", { ja: e.ja, nein: e.nein, datum: s.aktiv.datum });
    addLog(w, "entscheidung", text, t("n4.not.verlaengerungAbgelehntWarum"));
    return { ok: false, text };
  }
  // Im Krieg gilt die Grenze von vier Monaten nicht; das Spiel verlängert dann um dieselbe Spanne (Spielparameter)
  z.bis += NOTSTAND.verlaengerungTage;
  z.verlaengerungen += 1;
  vertrauenAendern(w, NOTSTAND.vertrauen / 2);
  const text = t("n4.not.verlaengert", { ja: e.ja, nein: e.nein, datum: formatDateDe(addDays(w.date, z.bis - w.day)), tage: NOTSTAND.verlaengerungTage });
  addLog(w, "entscheidung", text, t("n4.not.verlaengertWarum", { pk: s.pk }));
  return { ok: true, text };
}

function beende(w: World, schluessel: "n4.not.aufgehoben" | "n4.not.abgelaufen"): Ergebnis {
  const z = notstandVon(w);
  if (!z) return { ok: false, text: t("n4.not.nichtAktiv") };
  delete w.spiel!.gesetzgebung!.notstand;
  setPolicy(w, "m_notstand", z.vorher, null);
  const text = t(schluessel, { tage: w.day - z.seit });
  addLog(w, "entscheidung", text, t("n4.not.endeWarum"));
  return { ok: true, text };
}

export function hebeNotstandAuf(w: World): Ergebnis {
  return beende(w, "n4.not.aufgehoben");
}

/** Täglich: Läuft die Frist ab, endet der Ausnahmezustand von selbst. */
export function notstandTag(w: World): void {
  const z = notstandVon(w);
  if (z && w.day >= z.bis) beende(w, "n4.not.abgelaufen");
}

// Das Mandat der Großen Nationalversammlung für einen Einsatz im Ausland (Welle 4, K7; krieg.md Schritt 11, Befunde B5 und B7).
//
// Vorher stimmte das Parlament über einen Einsatz mit der Stimmenschätzung für ein Verteidigungsgesetz ab (alle Lagersitze, ein Anteil der
// Opposition nach der Beliebtheit). Jetzt stimmt jede Fraktion nach ihrer Haltung zu Vollmachten, und diese Haltungen sind belegt:
//
//   Fraktion  Haltung          Beleg
//   AKP       dafür            Sie brachte als Regierungspartei jede Vollmacht für Syrien und Irak ein, 2014 bis 2025 (Vatan 02.10.2014,
//                              Bianet 17.10.2023, TBMM-Tutanak 21.10.2025). Als Opposition hat sie nie abgestimmt: dafür ist dort Spielparameter.
//   MHP       dafür            2014 bis 2025 jedes Mal dafür (ebd.; Kamil Aydın für die MHP-Fraktion im Tutanak 21.10.2025: „olumlu tavrımızı“).
//   İYİ       dafür            2019, 2021, 2023 und 2025 dafür (CNN Türk/Medyascope 08.10.2019, BirGün 26.10.2021, Bianet 2023); 2025 mit
//                              Vorbehalt gegen die Laufzeit von drei Jahren (Metin Ergun im Tutanak 21.10.2025: „talep edilen süre üç değil …“).
//   Zafer     dafür            2021 dafür (Sözcü 2021, „Zafer Partisi'nin ‚evet‘ oylarıyla“); seit der Wahl 2023 ohne Sitz, also nur ein Beleg.
//   CHP       dagegen          2019 und 2020 dafür, 2021, 2023 und 2025 dagegen. Namık Tan für die CHP-Fraktion am 21.10.2025: 2015 „şartlı
//                              olarak evet“, danach „2021 ve 2023 yıllarında … 2 kere hayır“; Unterstützung, „ikna olduğumuz zaman“. Darum ist
//                              eine Zusage möglich (die Bedingung von 2015 bis 2020).
//   DEM       immer dagegen    Die HDP stimmte 2014, 2019, 2020 und 2021 dagegen, die HEDEP 2023, die DEM 2025 (Hakkı Saruhan Oluç im Tutanak
//                              21.10.2025: „‚hayır‘ oyu vereceğiz“). Keine Zusage holt sie.
//   YENİ      geteilt          Spielpartei des liberalen Zentrums. Ihre Haltung folgt dem liberalen Zentrum der Wirklichkeit: DEVA enthielt sich
//                              2021 (Vatan/BirGün 26.10.2021), stimmte 2023 dafür (Bianet), die Gruppe Yeni Yol 2025 dafür, aber gegen die lange
//                              Laufzeit (İdris Şahin im Tutanak 21.10.2025). Darum reagiert sie auf die Laufzeit.
//   YRP       geteilt          Lücke: keine belegte Stimmabgabe der Yeniden Refah gefunden. Spielparameter.
//
// Quellen: TBMM Tutanak Dergisi, 28. Dönem, 4. Yasama Yılı, 9. Birleşim, 21.10.2025 (https://cdn.tbmm.gov.tr/TbmmWeb/Tutanak/28/4/9/Tam/52b66e2b-6fdc-4d12-aa41-703b4fc2c246.pdf);
// Yetkin Report 17.10.2023 (357:164, https://yetkinreport.com/2023/10/17/irak-ve-suriye-tezkeresi-meclisten-gecti/); BirGün 26.10.2021
// (https://www.birgun.net/haber/suriye-irak-tezkeresi-tbmm-genel-kurulu-nda-kabul-edildi-363467); Milliyet 21.10.2025.
// Stimmenzahlen: 2019, 2021 und 2025 wurden per Handzeichen beschlossen, ohne Zählung („Kabul edenler… Kabul etmeyenler… Kabul
// edilmiştir“, Tutanak 21.10.2025 zum Antrag 3/1200). Belegte Zahlen gibt es nur für 2023 (357:164, 521 Abstimmende) und den 1. März 2003
// (533 Abstimmende, 264 Ja, 250 Nein, 19 Enthaltungen; nötig 267, https://tr.wikipedia.org/wiki/1_Mart_tezkeresi).
// Mehrheit: Art. 96 der Verfassung, die absolute Mehrheit der Anwesenden, mindestens ein Viertel der Mitglieder plus eins (151 von 600);
// Enthaltungen zählen als anwesend (so scheiterte der Antrag 2003 mit 264 Ja bei 250 Nein).
//
// Alle Anteile, Preise und Folgen unten sind Spielparameter, außer wo eine Quelle steht.

import { hashWert } from "./aufmerksamkeit";
import { PARTEI_NAME, bereitschaftAendern, fraktion, forderungVon } from "./fraktionen";
import { festeZusage, zusageStufen } from "./zusagenfolgen";
import { kannZahlen } from "./kapital";
import { msg, t, tIn } from "../i18n";
import type { World } from "./types";

export type Haltung = "dafuer" | "geteilt" | "dagegen" | "immer_dagegen";

/** Belegte Haltung der Fraktionen zu Vollmachten für Einsätze im Ausland (Tabelle oben). Unbekannte Parteien gelten als geteilt. */
export const HALTUNG: Record<string, Haltung> = {
  AKP: "dafuer",
  MHP: "dafuer",
  "İYİ": "dafuer",
  Zafer: "dafuer",
  CHP: "dagegen",
  DEM: "immer_dagegen",
  "YENİ": "geteilt",
  YRP: "geteilt",
};

export const MANDAT = {
  /** Anteil der Abgeordneten, die abstimmen: 2023 stimmten 357 + 164 = 521 von 600 ab (Yetkin Report 17.10.2023) */
  beteiligung: 521 / 600,
  /** Kleinste Zahl von Ja-Stimmen nach Art. 96: ein Viertel der 600 Mitglieder plus eins */
  mindestJa: 151,
  /** Ja- und Enthaltungsanteil der anwesenden Abgeordneten einer Fraktion je Haltung (Spielparameter) */
  ja: { dafuer: 0.95, geteilt: 0.5, dagegen: 0.04, immer_dagegen: 0.02 } as Record<Haltung, number>,
  enthaltung: { dafuer: 0.02, geteilt: 0.2, dagegen: 0.04, immer_dagegen: 0 } as Record<Haltung, number>,
  /** Die eigene Partei stimmt fast geschlossen; einzelne Abweichler gibt es immer (2003 stimmte ein Teil der AKP dagegen) */
  eigeneJa: 0.97,
  /** Ein Partner im Lager, dessen Haltung dagegen steht, folgt nur zum Teil (wie bei Verfassungspaketen, ENTSCHEIDUNGEN W) */
  partnerJa: { dafuer: 0.95, geteilt: 0.9, dagegen: 0.3, immer_dagegen: 0.2 } as Record<Haltung, number>,
  /** Laufzeit einer Verlängerung: Wer geteilt ist, trägt eine kurze eher mit (Kritik an drei Jahren, Tutanak 21.10.2025) */
  laufzeit: { 1: 0.15, 2: 0, 3: -0.1 } as Record<number, number>,
  /** Bereitschaft der Fraktion zum Präsidenten (0 bis 100): verschiebt den Ja-Anteil um höchstens so viel */
  bereitschaft: 0.08,
  /** Mit einer Zusage stimmt die Fraktion zu diesem Anteil mit */
  zusageJa: 0.85,
  /** Kapital einer Zusage: Grundpreis und je Sitz der Fraktion */
  zusagePk: 3,
  zusagePkJeSitz: 1 / 40,
  /** Frist der Zusage */
  zusageTage: 180,
  /** Streuung des Ergebnisses um die Erwartung (Abweichler, Abwesende), eine Standardabweichung in Stimmen */
  streuung: 6,
  /** Folgen eines gescheiterten Antrags. Vorbild 1. März 2003: Der Antrag scheiterte an drei Stimmen, die Regierung brachte ihn nicht
   *  wieder ein; die Börse Istanbul fiel am 3. März um 11,6 % und die Lira um etwa 5 % (PBS NewsHour 03.03.2003, Christian Science
   *  Monitor 04.03.2003), auch weil ein Hilfspaket der USA verloren war. Die Größen hier sind Spielparameter. */
  scheitern: { zustimmung: -2, vertrauen: -2.5, ansehen: -2, offiziere: -2, risiko: 30, sperreTage: 90 },
};

/** Worüber abgestimmt wird: ein Einsatz gegen ein Land (mit dem Stimmenbonus der Begründung) oder die Verlängerung der Vollmacht. */
export type MandatAnlass =
  | { art: "einsatz"; land: string; bonus: number; zusagen?: string[] }
  | { art: "verlaengerung"; jahre: number; zusagen?: string[] };

export interface FraktionsStimme {
  partei: string;
  name: string;
  sitze: number;
  haltung: Haltung;
  rolle: "eigene" | "lager" | "opposition";
  anwesend: number;
  ja: number;
  enthaltung: number;
  nein: number;
  zusage: boolean;
}

export interface MandatSicht {
  fraktionen: FraktionsStimme[];
  ja: number;
  nein: number;
  enthaltung: number;
  anwesend: number;
  noetig: number;
  /** Erwartet angenommen (ohne Streuung) */
  angenommen: boolean;
  /** Spanne der Ja-Stimmen (zwei Standardabweichungen) */
  band: number;
}

export function haltungVon(partei: string): Haltung {
  return HALTUNG[partei] ?? "geteilt";
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Die erwartete Abstimmung, Fraktion für Fraktion. Dieselbe Rechnung bucht `mandatAbstimmen`; die Oberfläche zeigt sie. */
export function mandatSicht(w: World, anlass: MandatAnlass): MandatSicht {
  const parl = w.parliament;
  const eigene = w.player?.partei.kurz ?? "";
  const lager = w.spiel?.lager ?? [];
  const zusagen = new Set(anlass.zusagen ?? []);
  const fraktionen: FraktionsStimme[] = [];
  for (const [partei, sitze] of Object.entries(parl?.seats ?? {})) {
    if (sitze <= 0) continue;
    const haltung = haltungVon(partei);
    const rolle: FraktionsStimme["rolle"] = partei === eigene ? "eigene" : lager.includes(partei) ? "lager" : "opposition";
    let ja: number;
    let enth: number;
    if (rolle === "eigene") {
      ja = MANDAT.eigeneJa;
      enth = 0.01;
    } else if (zusagen.has(partei)) {
      ja = MANDAT.zusageJa;
      enth = 0.05;
    } else {
      ja = rolle === "lager" ? MANDAT.partnerJa[haltung] : MANDAT.ja[haltung];
      enth = MANDAT.enthaltung[haltung];
      if (haltung !== "immer_dagegen" && rolle === "opposition") {
        ja += MANDAT.bereitschaft * ((fraktion(w, partei).bereitschaft - 50) / 50);
        if (anlass.art === "verlaengerung" && haltung === "geteilt") ja += MANDAT.laufzeit[anlass.jahre] ?? 0;
      }
    }
    ja = clamp01(ja);
    enth = Math.min(enth, 1 - ja);
    const anwesend = Math.round(sitze * MANDAT.beteiligung);
    fraktionen.push({ partei, name: partei === eigene ? (w.player?.partei.name ?? partei) : (PARTEI_NAME[partei] ?? partei), sitze, haltung, rolle, anwesend, ja: anwesend * ja, enthaltung: anwesend * enth, nein: 0, zusage: zusagen.has(partei) });
  }
  // Der Stimmenbonus der Begründung (RAHMUNG.stimmen in sim/krieg.ts): verteilt auf die offenen Stimmen der Opposition (oder genommen von
  // ihren Ja-Stimmen, wenn er negativ ist). DEM bleibt außen vor, ihre Haltung ist immer dagegen.
  const bonus = anlass.art === "einsatz" ? anlass.bonus : 0;
  const beweglich = fraktionen.filter((f) => f.rolle === "opposition" && f.haltung !== "immer_dagegen" && !f.zusage);
  if (bonus !== 0 && beweglich.length) {
    const gewicht = (f: FraktionsStimme) => (bonus > 0 ? f.anwesend - f.ja - f.enthaltung : f.ja);
    const summe = beweglich.reduce((s, f) => s + gewicht(f), 0);
    if (summe > 0) {
      const anteil = Math.max(-1, Math.min(1, bonus / summe));
      for (const f of beweglich) f.ja += gewicht(f) * anteil;
    }
  }
  let ja = 0;
  let enthaltung = 0;
  let anwesend = 0;
  for (const f of fraktionen) {
    f.ja = Math.round(f.ja);
    f.enthaltung = Math.round(f.enthaltung);
    f.nein = Math.max(0, f.anwesend - f.ja - f.enthaltung);
    ja += f.ja;
    enthaltung += f.enthaltung;
    anwesend += f.anwesend;
  }
  const noetig = Math.max(MANDAT.mindestJa, Math.floor(anwesend / 2) + 1);
  fraktionen.sort((a, b) => (a.rolle === "eigene" ? -1 : b.rolle === "eigene" ? 1 : 0) || b.ja / Math.max(1, b.anwesend) - a.ja / Math.max(1, a.anwesend) || b.sitze - a.sitze);
  return { fraktionen, ja, nein: anwesend - ja - enthaltung, enthaltung, anwesend, noetig, angenommen: ja >= noetig, band: 2 * MANDAT.streuung };
}

/** Das tatsächliche Ergebnis: die Erwartung plus eine Streuung (`abweichung` in Standardabweichungen, aus dem Aufrufer). */
export function mandatAbstimmen(w: World, anlass: MandatAnlass, abweichung: number): MandatSicht {
  const s = mandatSicht(w, anlass);
  const d = Math.round(abweichung * MANDAT.streuung);
  const ja = Math.max(0, Math.min(s.anwesend - s.enthaltung, s.ja + d));
  return { ...s, ja, nein: s.anwesend - ja - s.enthaltung, angenommen: ja >= s.noetig };
}

/** Eine Abweichung in Standardabweichungen ohne Zug aus dem Zufallsstrom (Samen, Anlass, Tag): ungefähr normal aus zwei Würfeln. */
export function hashAbweichung(w: World, schluessel: string): number {
  const a = hashWert(`${w.seed}|mandat|${schluessel}|${w.day}|a`);
  const b = hashWert(`${w.seed}|mandat|${schluessel}|${w.day}|b`);
  return (a + b - 1) * 2.45;
}

/** Wer für eine Zusage offen ist: Opposition mit geteilter oder bedingter Haltung, nicht die DEM (immer dagegen). */
export interface ZusageAngebot {
  partei: string;
  name: string;
  /** Zusätzliche Ja-Stimmen gegenüber der Erwartung ohne Zusage */
  stimmen: number;
  pk: number;
  forderung: string;
  massnahme: string;
}

export function zusageAngebote(w: World, anlass: MandatAnlass): ZusageAngebot[] {
  const ohne = mandatSicht(w, anlass);
  const out: ZusageAngebot[] = [];
  for (const f of ohne.fraktionen) {
    if (f.rolle !== "opposition" || f.zusage || f.haltung === "immer_dagegen" || f.haltung === "dafuer") continue;
    const mit = mandatSicht(w, { ...anlass, zusagen: [...(anlass.zusagen ?? []), f.partei] } as MandatAnlass);
    const stimmen = mit.ja - ohne.ja;
    if (stimmen <= 0) continue;
    const fd = forderungVon(w, f.partei);
    out.push({ partei: f.partei, name: f.name, stimmen, pk: Math.round(MANDAT.zusagePk + f.sitze * MANDAT.zusagePkJeSitz), forderung: fd.text, massnahme: fd.massnahme });
  }
  return out.sort((a, b) => b.stimmen - a.stimmen);
}

/** Ob sich eine Zusage lohnt: Die Erwartung liegt unter der Mehrheit oder so knapp darüber, dass die Streuung sie kippen kann. */
export function zusageSinnvoll(m: MandatSicht): boolean {
  return m.ja < m.noetig + m.band;
}

/** Bucht eine Zusage an eine Fraktion: Kapital und eine echte Zusage mit Frist (sim/zusagenfolgen.ts), wie bei Absprachen zu Gesetzen. */
export function zusageBuchen(w: World, a: ZusageAngebot, worum: string, schonGezahlt = false): boolean {
  const sp = w.spiel;
  if (!sp) return false;
  if (!schonGezahlt) {
    if (!kannZahlen(sp.kapital, a.pk)) return false;
    sp.kapital -= a.pk;
  }
  const stufen = zusageStufen(w, { massnahme: a.massnahme, richtung: 1 });
  const werte = { partei: a.name, worum, forderung: a.forderung };
  sp.zusagen.push(festeZusage(w, {
    id: `z-mandat-${a.partei}-${w.day}`,
    von: a.partei,
    text: tIn("de", "welle_k7.zusage.text", werte),
    msg: msg("welle_k7.zusage.text", werte),
    faellig: w.day + MANDAT.zusageTage,
    ...(stufen ? { massnahme: a.massnahme, richtung: 1, stufeStart: stufen.stufeStart, stufeZiel: stufen.stufeZiel } : {}),
    erfuellt: false,
    gebrochen: false,
  }));
  bereitschaftAendern(w, a.partei, 3);
  return true;
}

/** Die Fraktionen nach Haltung für einen Satz („AKP, MHP dafür; CHP, DEM dagegen“). */
export function haltungsSatz(s: MandatSicht): string {
  const ja = s.fraktionen.filter((f) => f.ja > f.nein + f.enthaltung).map((f) => f.name);
  const nein = s.fraktionen.filter((f) => f.nein > f.ja + f.enthaltung).map((f) => f.name);
  const geteilt = s.fraktionen.filter((f) => !ja.includes(f.name) && !nein.includes(f.name)).map((f) => f.name);
  const teile = [
    ja.length ? t("welle_k7.satz.ja", { wer: ja.join(", ") }) : "",
    nein.length ? t("welle_k7.satz.nein", { wer: nein.join(", ") }) : "",
    geteilt.length ? t("welle_k7.satz.geteilt", { wer: geteilt.join(", ") }) : "",
  ].filter(Boolean);
  return teile.join("; ");
}

// Abspaltung aus der eigenen Partei (Welle M1, 8. November 2026).
//
// Wer den Kronprinzen bricht (kaltstellen, ausbooten, nach einem Befund opfern), riskiert eine neue Partei. Vorbilder:
//   - Ahmet Davutoğlu kündigte am 05.05.2016 seinen Rückzug vom Vorsitz an (VOA, voanews.com/a/turkey-davutoglu/3316477.html), trat am
//     13.09.2019 aus der AKP aus (Washington Times, 13.09.2019) und reichte am 12.12.2019 den Gründungsantrag der Gelecek Partisi ein
//     (Euronews Türkçe, 12.12.2019). Umfragen: MAK 05/2020 2,4 %, İstanbul Ekonomi 06/2020 0,78 %, MetroPOLL 12/2021 0,8 %, ORC 08/2022
//     2,2 % (indigodergisi.com 2020/05 und 2020/07; Sözcü zu MetroPOLL; Wikipedia „Opinion polling for the 2023 Turkish parliamentary
//     election“ zu ORC). Im Parlament am 20.04.2022 ohne Sitz (Takvim, Sitzverteilung vom 20.04.2022). 2023 auf der CHP-Liste 10 Sitze.
//   - Ali Babacan trat am 08.07.2019 aus der AKP aus (Bianet) und gründete am 09.03.2020 die DEVA Partisi. Umfragen: MAK 05/2020 1,7 %,
//     İstanbul Ekonomi 06/2020 2,4 %, MetroPOLL 12/2021 1,9 %, ORC 08/2022 2,1 % (Quellen wie oben). Am 20.04.2022 ein Sitz (Takvim).
//     2023 auf der CHP-Liste 15 Sitze (Yeni Şafak).
//   - Zum Vergleich die größte Abspaltung: İYİ Parti am 25.10.2017 aus der MHP, mit 5 Abgeordneten (Bloomberg HT), bei der Wahl am
//     24.06.2018 9,96 % und 43 Sitze (YSK über Wikipedia).
//   - Wählerwanderung: MAK schätzte im Mai 2020, dass von 12,9 Punkten AKP-Verlust „mindestens 10“ an İYİ, DEVA und Gelecek gingen
//     (indigodergisi.com/2020/05/anket-akp-10-puani-nereye-gidiyor). Das ist eine Schätzung, keine Messung.
//
// Daraus die Spielregeln (alle Größen Spielparameter in der Spanne der Vorbilder): Ein kaltgestellter, ehrgeiziger Kronprinz mit wenig
// Loyalität kündigt den Bruch an; nach einer Frist gründet er. Die neue Partei nimmt dem eigenen Lager Prozentpunkte ab (je nach Einfluss
// des Gründers zwischen den 1 bis 2,6 % von Gelecek und DEVA und den knapp 10 % der İYİ Parti) und ein paar Abgeordnete mit (0 bis 5).
// Bei der Parlamentswahl tritt sie als eigene Partei an (unter der Hürde ohne Sitze, die Stimmen fehlen dem Lager trotzdem), bei der
// Präsidentenwahl fehlt dem Amtsinhaber ein Teil ihrer Stimmen.

import { t } from "../i18n";
import { addLog } from "./log";
import { addDays } from "./dates";
import { vertrauenAendern } from "./wirkung";
import { zeitungEreignis } from "./zeitung";
import { MACHTKREIS, machtkreis, nebenVon, schluesselVon, type Abspaltung, type Nebenfigur } from "./machtkreis";
import { neuerName, vergebeneNamen } from "./figuren";
import { hashZahl } from "./personen";
import { Rng } from "./rng";
import type { World } from "./types";

/** Kennung der neuen Partei im Parlament; der Name steht in sim/fraktionen.ts (PARTEI_NAME), die Farbe in ui/parlament/lage.ts. */
export const ABSPALTUNG_PARTEI = "Ufuk";

export const ABSPALTUNG = {
  /**
   * Tage vom Bruch bis zur Gründung. Vorbilder: Babacan 08.07.2019 bis 09.03.2020 (8 Monate), Davutoğlu 13.09.2019 bis 12.12.2019
   * (3 Monate). Spielparameter dazwischen.
   */
  frist: 180,
  /** Wer so ehrgeizig ist und so wenig loyal, bricht mit der Partei (Spielparameter) */
  ehrgeizAb: 50,
  loyalitaetBis: 45,
  /** Prozentpunkte, die die neue Partei dem eigenen Lager abnimmt: Grund plus Einfluss des Gründers, gedeckelt (Vorbilder siehe Kopf) */
  anteil: { basis: 1, jeEinfluss: 0.07, max: 9 },
  /** Abgeordnete, die mitgehen: Einfluss mal Faktor, höchstens 5 (Gelecek 0, DEVA 1, İYİ 5) */
  abgeordnete: { jeEinfluss: 0.05, max: 5 },
  /** Anteil ihrer Stimmen, der dem Amtsinhaber bei der Präsidentenwahl fehlt (2023 warben DEVA und Gelecek für den Gegenkandidaten) */
  praesidentschaft: 0.5,
  /** Vor der Gründung versöhnen: Rückkehr mit Posten und Absprache, der Druck kehrt zurück */
  versoehnen: { pk: 3, loyalitaet: 20, druck: 15 },
  /** Den Ausschluss beschleunigen: Er gründet sofort, aber mit weniger Zeit zum Sammeln (Spielparameter) */
  beschleunigen: { pk: 1, faktor: 0.6, angst: 3 },
  /** Nach der Gründung: Der Rivale ist draußen, der Druck in der Partei sinkt; das Vertrauen leidet am Streit */
  nachher: { druck: -20, vertrauen: -0.8 },
} as const;

const rund1 = (x: number): number => Math.round(x * 10) / 10;

/** Erwartete Größe einer Abspaltung (Prozentpunkte und Abgeordnete) bei einem Einfluss des Gründers; `faktor` für den beschleunigten Weg. */
export function abspaltungGroesse(einfluss: number, faktor = 1): { anteil: number; abgeordnete: number } {
  const q = ABSPALTUNG;
  return {
    anteil: rund1(Math.min(q.anteil.max, q.anteil.basis + q.anteil.jeEinfluss * einfluss) * faktor),
    abgeordnete: Math.min(q.abgeordnete.max, Math.round(q.abgeordnete.jeEinfluss * einfluss * faktor)),
  };
}

/** Die angekündigte Abspaltung, solange sie droht. */
export function drohendeAbspaltung(w: World): Abspaltung | undefined {
  const a = w.spiel?.machtkreis?.abspaltung;
  return a?.stand === "droht" ? a : undefined;
}

/** Die gegründete Abspaltung (es gibt höchstens eine Partei; ein zweiter Bruch stärkt sie). */
export function gegruendeteAbspaltung(w: World): Abspaltung | undefined {
  return w.spiel?.machtkreis?.abspaltungen?.find((a) => a.stand === "gegruendet");
}

/** Ob ein kaltgestellter Kronprinz mit diesen Werten mit der Partei bricht (auch für die Vorschau auf der Karte). */
export const brichtMitWerten = (ehrgeiz: number, loyalitaet: number): boolean => ehrgeiz >= ABSPALTUNG.ehrgeizAb && loyalitaet <= ABSPALTUNG.loyalitaetBis;

/** Bricht der Kronprinz mit der Partei? Kaltgestellt, ehrgeizig, kaum loyal. */
function brichtMit(n: Nebenfigur | undefined): boolean {
  return !!n && n.status === "kaltgestellt" && brichtMitWerten(n.ehrgeiz, n.loyalitaet);
}

/** Monatlich (nach dem Machtkreis): Bruch ankündigen, am Termin gründen. */
export function abspaltungMonat(w: World): void {
  const sp = w.spiel;
  if (!sp?.machtkreis || sp.ende) return;
  const mk = sp.machtkreis;
  const a = mk.abspaltung;
  if (a?.stand === "droht") {
    if (w.day >= a.gruendung) gruende(w, a);
    return;
  }
  const kp = nebenVon(w, "kronprinz");
  if (!kp || !brichtMit(kp)) return;
  kuendigeAn(w, kp);
}

/** Der Kronprinz kündigt den Bruch an: Die Gründung ist in der Frist zu erwarten. */
export function kuendigeAn(w: World, kp: Nebenfigur): Abspaltung {
  const mk = machtkreis(w);
  mk.abspaltung = {
    gruender: kp.name,
    weiblich: kp.weiblich,
    partei: ABSPALTUNG_PARTEI,
    bruch: w.day,
    gruendung: w.day + ABSPALTUNG.frist,
    einfluss: Math.round(kp.einfluss),
    stand: "droht",
  };
  addLog(w, "ereignis", t("welle_m1.abspaltung.log.bruch", { name: kp.name }), t("welle_m1.abspaltung.log.bruch_warum", { tage: ABSPALTUNG.frist }));
  return mk.abspaltung;
}

/** Die Partei wird gegründet: Abgeordnete wechseln, das Lager verliert Anteile, ein neuer Kronprinz rückt nach. */
export function gruende(w: World, a: Abspaltung, faktor = 1): void {
  const sp = w.spiel!;
  const mk = machtkreis(w);
  const g = abspaltungGroesse(a.einfluss, faktor);
  const parl = w.parliament;
  const eigene = w.player?.partei.kurz;
  let abgeordnete = 0;
  let anteil = 0;
  if (parl && eigene) {
    abgeordnete = Math.max(0, Math.min(g.abgeordnete, (parl.seats[eigene] ?? 0) - 1));
    anteil = rund1(Math.max(0, Math.min(g.anteil, (parl.shares[eigene] ?? 0) - 1)));
    if (abgeordnete > 0) {
      parl.seats[eigene] = (parl.seats[eigene] ?? 0) - abgeordnete;
      parl.seats[a.partei] = (parl.seats[a.partei] ?? 0) + abgeordnete;
    }
    parl.shares[eigene] = rund1((parl.shares[eigene] ?? 0) - anteil);
    parl.shares[a.partei] = rund1((parl.shares[a.partei] ?? 0) + anteil);
  }
  // Eine schon bestehende Abspaltung wächst; sonst entsteht sie
  const alt = gegruendeteAbspaltung(w);
  if (alt) {
    alt.abgeordnete = (alt.abgeordnete ?? 0) + abgeordnete;
    alt.anteil = rund1((alt.anteil ?? 0) + anteil);
    a.stand = "gegruendet";
    a.abgeordnete = abgeordnete;
    a.anteil = anteil;
  } else {
    a.stand = "gegruendet";
    a.abgeordnete = abgeordnete;
    a.anteil = anteil;
    (mk.abspaltungen ??= []).push(a);
  }
  a.gruendung = w.day;
  if (faktor !== 1) a.beschleunigt = true;
  delete mk.abspaltung;
  mk.nachfolge = Math.max(0, mk.nachfolge + ABSPALTUNG.nachher.druck);
  vertrauenAendern(w, ABSPALTUNG.nachher.vertrauen);
  neuerKronprinz(w);
  const text = t("welle_m1.abspaltung.gruendung.fakt", { name: a.gruender, partei: t("welle_m1.abspaltung.partei"), anteil: anteil, n: abgeordnete });
  addLog(w, "ereignis", t("welle_m1.abspaltung.gruendung.titel", { name: a.gruender }), text);
  sp.chronik.push({ tag: w.day, datum: w.date, titel: t("welle_m1.abspaltung.gruendung.titel", { name: a.gruender }), ausgang: text });
  zeitungEreignis(w, { art: "bruch", titel: t("welle_m1.abspaltung.gruendung.titel", { name: a.gruender }), fakt: text, wertung: -0.6, schluessel: ["Abspaltung"] });
}

/** Der Gründer verlässt den Kreis; die Partei bekommt einen neuen Kronprinzen (eigener Zufall aus Samen und Tag, der Strom der Partie bleibt). */
function neuerKronprinz(w: World): void {
  const mk = machtkreis(w);
  const i = mk.neben.findIndex((n) => n.art === "kronprinz");
  if (i < 0) return;
  const alt = mk.neben[i]!;
  const altSchluessel = schluesselVon(alt);
  const rng = new Rng(Math.floor(hashZahl(`${w.seed}|m1-kronprinz|${w.day}`) * 2147483647) || 1);
  const weiblich = rng.next() < 0.35;
  const name = neuerName(rng, vergebeneNamen(w), weiblich);
  const r = (x: number, y: number) => Math.round(x + (y - x) * rng.next());
  // Wie beim Anlegen (sim/machtkreis.ts, neueNebenfigur), aber mit weniger Einfluss: Er muss sich erst einen Namen machen
  mk.neben[i] = { id: "n-kronprinz", art: "kronprinz", name, weiblich, alter: r(42, 56), lager: "partei", ehrgeiz: r(65, 85), loyalitaet: r(50, 65), kompetenz: r(55, 80), einfluss: r(25, 40), status: "aktiv", seit: w.day };
  mk.beziehungen = mk.beziehungen.filter((b) => b.a !== altSchluessel && b.b !== altSchluessel);
  mk.geheimnisse = mk.geheimnisse.filter((g) => g.person !== altSchluessel);
  mk.untersuchungen = mk.untersuchungen.filter((u) => u.person !== altSchluessel);
  delete mk.deals[altSchluessel];
  mk.nachfolgeStufe = 0;
}

/** Vor der Gründung: Versöhnung (Rückkehr mit Posten und Absprache). */
export function versoehne(w: World): string {
  const mk = machtkreis(w);
  const a = mk.abspaltung;
  const kp = nebenVon(w, "kronprinz");
  if (!a || a.stand !== "droht") return "";
  const q = ABSPALTUNG.versoehnen;
  a.stand = "versoehnt";
  delete mk.abspaltung;
  if (kp) {
    kp.status = "aktiv";
    delete kp.bis;
    kp.loyalitaet = Math.min(100, kp.loyalitaet + q.loyalitaet);
    mk.deals[schluesselVon(kp)] = w.day + MACHTKREIS.dealTage;
  }
  mk.nachfolge = Math.min(100, mk.nachfolge + q.druck);
  return t("welle_m1.abspaltung.versoehnen.aus", { name: a.gruender });
}

/** Der Ausschluss wird beschleunigt: Die Partei entsteht sofort, aber kleiner. */
export function beschleunige(w: World): string {
  const mk = machtkreis(w);
  const a = mk.abspaltung;
  if (!a || a.stand !== "droht") return "";
  mk.angst = Math.min(100, mk.angst + ABSPALTUNG.beschleunigen.angst);
  gruende(w, a, ABSPALTUNG.beschleunigen.faktor);
  return t("welle_m1.abspaltung.beschleunigen.aus", { name: a.gruender, anteil: a.anteil ?? 0, n: a.abgeordnete ?? 0 });
}

/** Einfluss auf die Präsidentenwahl (Treppe des Wahlabends und Vorschau): Ein Teil der Stimmen der Abspaltung fehlt dem Amtsinhaber. */
export function abspaltungWahlEinfluss(w: World): { name: string; punkte: number } | undefined {
  const a = gegruendeteAbspaltung(w);
  if (!a?.anteil) return undefined;
  return { name: t("welle_m1.abspaltung.wahl", { partei: t("welle_m1.abspaltung.partei") }), punkte: -rund1(a.anteil * ABSPALTUNG.praesidentschaft) };
}

/** Datum der geplanten Gründung in Worten der Sprache (für Karten und Vorgang). */
export const gruendungsDatum = (w: World, a: Abspaltung): string => addDays(w.date, Math.max(0, a.gruendung - w.day));

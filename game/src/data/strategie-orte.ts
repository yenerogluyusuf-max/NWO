// Geostrategische Orte für die Linse „Strategie“: Meerengen, Inseln, Kanäle, Pipelines, Häfen, Stützpunkte, Staudämme.
// Je Ort: warum er zählt, wer ihn kontrolliert, welche Wirkung er im Spiel hat. Später sind diese Orte Kriegsziele.
// Tatsachen sind breit belegt (Montreux-Vertrag 1936, Lage der Pipelines, Stützpunkte); die Spielwirkung ist Spielmechanik.

import type { GutId } from "./gueter";

export type OrtArt = "meerenge" | "insel" | "kanal" | "pipeline" | "hafen" | "stuetzpunkt" | "damm";

export interface StrategieOrt {
  id: string;
  art: OrtArt;
  name: string;
  lon: number;
  lat: number;
  /** Provinz, wenn der Ort in der Türkei liegt */
  plaka?: number;
  /** Wer ihn kontrolliert (Länderkennung des Weltmodells oder TUR) */
  kontrolle: string;
  warum: string;
  /** Welche Warengruppen über diesen Ort laufen (Einfuhr oder Ausfuhr) */
  gueter: GutId[];
  /** Wirkung im Spiel in einem Satz */
  wirkung: string;
  rang: 1 | 2 | 3;
}

export const STRATEGIE_ORTE: StrategieOrt[] = [
  { id: "bosporus", art: "meerenge", name: "Bosporus", lon: 29.05, lat: 41.12, plaka: 34, kontrolle: "TUR", rang: 3, gueter: ["getreide", "erdoel", "zucker_oele"],
    warum: "Einziger Seeweg vom Schwarzen Meer ins Mittelmeer; der Vertrag von Montreux (1936) gibt der Türkei die Aufsicht über Kriegsschiffe.",
    wirkung: "Hebel gegenüber Russland und der Ukraine; im Krieg kann die Türkei Kriegsschiffen die Durchfahrt verwehren, Getreideexporte aus dem Schwarzen Meer laufen hier durch." },
  { id: "dardanellen", art: "meerenge", name: "Dardanellen", lon: 26.40, lat: 40.20, plaka: 17, kontrolle: "TUR", rang: 3, gueter: ["getreide", "erdoel"],
    warum: "Zweiter Teil der Meerengen; mit dem Bosporus der Schlüssel zum Schwarzen Meer.",
    wirkung: "Zusammen mit dem Bosporus: Montreux als Druckmittel, Schutz der eigenen Einfuhren." },
  { id: "zypern", art: "insel", name: "Zypern", lon: 33.35, lat: 35.15, kontrolle: "CYP", rang: 3, gueter: ["erdgas"],
    warum: "Lage mitten im östlichen Mittelmeer, Gasfelder vor der Küste, geteilte Insel mit türkischen Truppen im Norden.",
    wirkung: "Wer Zypern beherrscht, kontrolliert Seewege und Gasfelder im östlichen Mittelmeer; Dauerstreit mit Griechenland und der EU, Beitrittshürde." },
  { id: "suez", art: "kanal", name: "Suezkanal", lon: 32.35, lat: 30.60, kontrolle: "EGY", rang: 3, gueter: ["erdoel", "elektronik", "duenger"],
    warum: "Kürzester Seeweg zwischen Asien und Europa; ein großer Teil der Einfuhr aus China und vom Golf läuft hier durch.",
    wirkung: "Sperrung verteuert Einfuhren aus Asien (Elektronik, Dünger) und verlängert Lieferzeiten." },
  { id: "hormus", art: "meerenge", name: "Straße von Hormus", lon: 56.30, lat: 26.55, kontrolle: "IRN", rang: 3, gueter: ["erdoel", "erdgas"],
    warum: "Engstelle für Öl und Flüssiggas vom Golf; Iran kann sie bedrohen.",
    wirkung: "Bei Schließung fällt ein Teil der Öl- und LNG-Einfuhr aus, Energiepreise steigen (Zustand aus dem Außenmodul)." },
  { id: "babalmandab", art: "meerenge", name: "Bab al-Mandab", lon: 43.33, lat: 12.60, kontrolle: "SAU", rang: 2, gueter: ["erdoel", "elektronik"],
    warum: "Südlicher Zugang zum Roten Meer und damit zum Suezkanal.",
    wirkung: "Angriffe auf Schiffe hier wirken wie eine teilweise Sperrung des Suezkanals." },
  { id: "tanap", art: "pipeline", name: "TANAP (Gas aus Aserbaidschan)", lon: 40.50, lat: 39.90, plaka: 25, kontrolle: "TUR", rang: 2, gueter: ["erdgas"],
    warum: "Gas vom Kaspischen Meer durch die Türkei bis nach Europa; macht die Türkei zur Drehscheibe.",
    wirkung: "Sichert den Anteil Aserbaidschans an der Gaseinfuhr und Transiteinnahmen; Beziehung zu Aserbaidschan und der EU." },
  { id: "turkstream", art: "pipeline", name: "TurkStream (Gas aus Russland)", lon: 28.10, lat: 41.60, plaka: 39, kontrolle: "RUS", rang: 2, gueter: ["erdgas"],
    warum: "Größter Einzelweg für russisches Gas in die Türkei und weiter nach Südosteuropa.",
    wirkung: "Abhängigkeit von Russland; Sanktionen oder Streit treffen hier zuerst die Versorgung." },
  { id: "kirkuk_ceyhan", art: "pipeline", name: "Kirkuk–Ceyhan (Öl aus dem Irak)", lon: 35.80, lat: 36.80, plaka: 1, kontrolle: "TUR", rang: 2, gueter: ["erdoel"],
    warum: "Öl aus dem Nordirak zum Mittelmeerhafen Ceyhan; seit 2023 wegen eines Schiedsspruchs zeitweise gestoppt (zu prüfen: Stand 2026).",
    wirkung: "Einnahmen und Einfluss im Nordirak; Druckmittel und Streitpunkt mit Bagdad." },
  { id: "btc", art: "pipeline", name: "Baku–Tiflis–Ceyhan (Öl)", lon: 35.90, lat: 36.88, plaka: 1, kontrolle: "TUR", rang: 2, gueter: ["erdoel"],
    warum: "Kaspisches Öl unter Umgehung Russlands und Irans zum Mittelmeer.",
    wirkung: "Bindung an Aserbaidschan und Georgien; Ceyhan als Energiehafen." },
  { id: "incirlik", art: "stuetzpunkt", name: "Stützpunkt İncirlik", lon: 35.43, lat: 37.00, plaka: 1, kontrolle: "TUR", rang: 2, gueter: [],
    warum: "Luftwaffenstützpunkt mit amerikanischer Nutzung; Pfand im Verhältnis zu den USA.",
    wirkung: "Hebel gegenüber den USA: Nutzung einschränken kostet Vertrauen, öffnen bringt Rückhalt." },
  { id: "mersin_hafen", art: "hafen", name: "Hafen Mersin", lon: 34.64, lat: 36.79, plaka: 33, kontrolle: "TUR", rang: 2, gueter: ["obst_gemuese", "stahl", "getreide"],
    warum: "Größter Containerhafen am Mittelmeer im Land; Tor nach Nahost.",
    wirkung: "Engpass hier bremst Ausfuhr und Einfuhr im Süden." },
  { id: "ambarli", art: "hafen", name: "Häfen Ambarlı und Marmara", lon: 28.69, lat: 40.97, plaka: 34, kontrolle: "TUR", rang: 2, gueter: ["elektronik", "stahl", "medikamente"],
    warum: "Hauptumschlag für Istanbul und die Industrie der Marmara-Region.",
    wirkung: "Engpass hier trifft Industrie und Einzelhandel des ganzen Landes." },
  { id: "ataturk_damm", art: "damm", name: "Atatürk-Staudamm (Euphrat)", lon: 38.32, lat: 37.48, plaka: 63, kontrolle: "TUR", rang: 3, gueter: ["wasser", "strom"],
    warum: "Größter Damm des Landes; regelt, wie viel Euphratwasser Syrien und den Irak erreicht.",
    wirkung: "Druckmittel gegen Syrien und den Irak (Wasser zurückhalten oder freigeben), Strom und Bewässerung im Südosten." },
  { id: "ilisu_damm", art: "damm", name: "Ilısu-Staudamm (Tigris)", lon: 41.85, lat: 37.53, plaka: 47, kontrolle: "TUR", rang: 2, gueter: ["wasser", "strom"],
    warum: "Regelt den Tigris vor dem Irak.",
    wirkung: "Wasserstreit mit dem Irak; Strom für den Südosten." },
];

// Fernkonflikt ohne gemeinsame Grenze (Welle 3, K1; krieg.md Schritt 3, Befunde A5 und B3).
//
// Im Spielstand 2043 des Inhabers lief der Krieg mit Israel wie eine Bodenoffensive: Frontlage, „Geländegewinne“, 318 Gefallene, aber nichts
// zu besetzen. Zwischen der Türkei und Israel liegen Syrien und das Mittelmeer. Ein bewaffneter Konflikt wäre dort ein Schlagabtausch aus
// Luft- und Raketenschlägen, Seegefechten, Stellvertretern und Angriffen auf Netze. Er endet nicht mit Gebiet, sondern mit einem Ergebnis:
// Abschreckung (der Gegner hält still), Zugeständnisse (er zahlt oder gibt nach) oder einem bloßen Waffenstillstand.
//
// Belege:
//   - Landgrenzen der Türkei: Armenien 311 km, Aserbaidschan 17 km, Bulgarien 223 km, Georgien 273 km, Griechenland 192 km, Iran 534 km,
//     Irak 367 km, Syrien 899 km (CIA World Factbook über Indexmundi: https://www.indexmundi.com/turkey/land_boundaries.html). Wer nicht in
//     dieser Liste steht und keinen Kriegsschauplatz hat (data/schauplaetze.ts), ist ein Fernkonflikt.
//   - Wie ein Krieg aus der Luft verläuft: Klauenschwert (Pençe-Kılıç), 20.–28.11.2022: rund 70 Luftfahrzeuge, 89 Ziele, nach SOHR ein
//     türkischer Gefallener (recherche_operationen.md A7). Eigene Verluste bleiben deshalb ein kleiner Bruchteil einer Bodenoperation.
// Alle Schwellen und Faktoren hier sind Spielparameter.

import { SCHAUPLATZ_NACH_LAND, type EinsatzArt } from "../data/schauplaetze";
import { stand } from "./behoerden";
import { addLog } from "./log";
import { kannZahlen } from "./kapital";
import { land } from "./laender";
import { t } from "../i18n";
import type { FernZiel, KriegVorgang } from "./krieg-typen";
import type { World } from "./types";

/** Staaten mit gemeinsamer Landgrenze (CIA World Factbook, siehe Kopf). */
export const LANDNACHBARN: ReadonlySet<string> = new Set(["ARM", "AZE", "BGR", "GEO", "GRC", "IRN", "IRQ", "SYR"]);

/** Ein Konflikt mit diesem Land hat keine Landfront: kein Schauplatz und keine gemeinsame Landgrenze. */
export function istFernkonflikt(landId: string): boolean {
  return !SCHAUPLATZ_NACH_LAND[landId] && !LANDNACHBARN.has(landId);
}

export const FERN = {
  /** Mittel des Fernkonflikts in der Reihenfolge der Anzeige; die Bodenoffensive fehlt */
  mittel: ["luft", "see", "stellvertreter", "cyber"] as EinsatzArt[],
  /** Faktor auf die eigenen Verluste gegenüber einem Landkrieg (Vorbild Klauenschwert, siehe Kopf) */
  verlust: 0.2,
  /** Mindestens so viele Kriegswochen, bevor ein Ziel als erreicht gilt (ein Schlag ist noch keine Abschreckung) */
  minWochen: 2,
  /** Was ein Ziel verlangt: Lage im Schlagabtausch mindestens, Rückhalt des Gegners höchstens */
  ziele: {
    waffenstillstand: { front: 50, uhrGegner: 100 },
    abschreckung: { front: 62, uhrGegner: 75 },
    zugestaendnisse: { front: 72, uhrGegner: 55 },
  } as Record<FernZiel, { front: number; uhrGegner: number }>,
  /** Das Friedenspaket, das ein erreichtes Ziel auf den Tisch legt (sim/krieg.ts PAKETE) */
  paket: { waffenstillstand: "paket_weiss", abschreckung: "paket_fern_abschreckung", zugestaendnisse: "paket_fern_zugestaendnisse" } as Record<FernZiel, string>,
  /** Ein Wechsel des Ziels im Krieg kostet so viel Kapital */
  wechselPk: 3,
  /** Cyber-Kraft: Grundwert und Zuwachs je Stufe der Behörde für Cybersicherheit (Technik) */
  cyberBasis: 0.55,
  cyberJeStufe: 0.12,
};

export const FERN_ZIELE: FernZiel[] = ["waffenstillstand", "abschreckung", "zugestaendnisse"];

export function fernZielVon(k: KriegVorgang): FernZiel {
  return k.fernZiel ?? "abschreckung";
}

export interface FernZielStand {
  ziel: FernZiel;
  front: { jetzt: number; noetig: number };
  uhrGegner: { jetzt: number; noetig: number };
  wochen: { jetzt: number; noetig: number };
  erreicht: boolean;
}

/** Wo der Fernkonflikt gegenüber seinem Ziel steht, aus denselben Schwellen, die `fernZielErreicht` prüft. */
export function fernZielStand(k: KriegVorgang, ziel: FernZiel = fernZielVon(k)): FernZielStand {
  const z = FERN.ziele[ziel];
  const erreicht = k.phase !== "spannung" && k.phase !== "drohkulisse" && k.phase !== "beschluss" && k.woche >= FERN.minWochen && k.front >= z.front && k.uhrGegner <= z.uhrGegner;
  return {
    ziel,
    front: { jetzt: Math.round(k.front), noetig: z.front },
    uhrGegner: { jetzt: Math.round(k.uhrGegner), noetig: z.uhrGegner },
    wochen: { jetzt: k.woche, noetig: FERN.minWochen },
    erreicht,
  };
}

export function fernZielErreicht(k: KriegVorgang): boolean {
  return fernZielStand(k).erreicht;
}

/** Kraft der Cyber-Mittel (1 = Stand 2026 mit Stufe 2 der Behörde) aus der Technikstufe der Behörde für Cybersicherheit. */
export function cyberFaktor(w: World): number {
  const stufe = w.spiel ? (stand(w, "cyber")?.stufen.technik ?? 2) : 2;
  return (FERN.cyberBasis + FERN.cyberJeStufe * stufe) / (FERN.cyberBasis + FERN.cyberJeStufe * 2);
}

/** Das Ziel des Fernkonflikts wählen: vor dem Krieg frei, im Krieg mit Kapital; danach nicht mehr. */
export function waehleFernZiel(w: World, k: KriegVorgang, ziel: FernZiel): { ok: boolean; text: string } {
  const sp = w.spiel;
  if (!sp || !istFernkonflikt(k.land)) return { ok: false, text: t("militaer.ziel.ungueltig") };
  if (k.phase === "frieden" || k.phase === "beendet" || k.phase === "waffenruhe") return { ok: false, text: t("militaer.ziel.vorbei") };
  if (fernZielVon(k) === ziel && k.fernZiel) return { ok: false, text: t("welle_k1.fern.ziel_schon") };
  const wechsel = k.phase === "krieg" && !!k.fernZiel;
  if (wechsel) {
    if (!kannZahlen(sp.kapital, FERN.wechselPk)) return { ok: false, text: t("militaer.grund.kapital") };
    sp.kapital -= FERN.wechselPk;
  }
  k.fernZiel = ziel;
  const text = t("welle_k1.fern.ziel_gesetzt", { land: land(k.land).name, ziel: t(`welle_k1.fern.ziel.${ziel}.name`) });
  addLog(w, "entscheidung", text, t(`welle_k1.fern.ziel.${ziel}.text`));
  return { ok: true, text };
}

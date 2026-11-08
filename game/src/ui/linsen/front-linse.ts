// Die Linse „Front und Besatzung“ (karte.md K4 und K8, Welle 3 K6). Sie erscheint nur, solange ein Krieg auf einem Schauplatz läuft
// (Kampf oder Waffenruhe) oder die Türkei Gebiet besetzt hält. Sie beantwortet „Wo steht die Front, und was ist bedroht?“: Die Türkei tritt
// blass zurück, die Grenzprovinzen zum Schauplatz sind getönt, bedrohte Provinzen rot; die Lage der Regionen, die Front und die Verbände
// zeichnet die Kriegsschicht der Karte (ui/atlas/kriegsfx.ts, ui/atlas/Karte2D.tsx) aus derselben Rechnung (ui/atlas/front.ts).
// Alle Farben sind Spielparameter der Darstellung; die Zahlen im Hinweis kommen aus dem Vorgang.

import type { World } from "../../sim/types";
import { regionenVon, schauplatzFuer, zielRegionen } from "../../sim/kriegsschauplatz";
import { land } from "../../sim/laender";
import { PROVINZEN } from "../../sim/regional";
import { rahmenVon } from "../atlas/front";
import { t, zahl } from "../../i18n";
import type { Legende } from "../ebenen";

/** Kriege und Besatzung nur lesen: `kriege()` und `besatzung()` legen fehlende Listen an, das Zeichnen darf den Spielstand nicht ändern */
const nurLesen = (w: World) => ({ kriege: w.spiel?.kriege ?? [], besatzung: w.spiel?.besatzung ?? [] });

/** Türkei im Hintergrund, Grenzprovinzen zum Schauplatz, bedrohte Provinzen; Farben der Legende */
export const FRONT_FARBEN = { ruhig: "#ece2c8", grenze: "#dcb873", bedroht: "#b0493c", gehalten: "#a8604a", umkaempft: "#c69a4a", gegner: "#8a7e70" };

/** Laufende Kriege mit Schauplatz (Kampf oder Waffenruhe) */
function aktiv(w: World) {
  return nurLesen(w).kriege.filter((k) => (k.phase === "krieg" || k.phase === "waffenruhe") && !!schauplatzFuer(k.land));
}

/** Ob die Linse etwas zu zeigen hat (Regel in ui/linsen/linsen.ts). */
export function frontLinseVerfuegbar(w: World): boolean {
  return !!w.spiel && (aktiv(w).length > 0 || nurLesen(w).besatzung.length > 0);
}

/** Wohin die Kamera beim Wählen der Linse fliegt: der Schauplatz des ersten laufenden Krieges, sonst das besetzte Gebiet. */
export function frontKamera(w: World): { lon: number; lat: number; d: number } | undefined {
  const k = aktiv(w)[0];
  // Ausschnitt: Zielraum und gehaltenes Gebiet des Krieges (dort steht die Front), sonst das besetzte Gebiet
  const ids = k ? [...zielRegionen(k).map((r) => r.id), ...Object.entries(k.regionen ?? {}).filter(([, l]) => l !== "gegner").map(([id]) => id)] : nurLesen(w).besatzung.map((b) => b.region);
  const r = rahmenVon(ids.length ? ids : k ? regionenVon(k.land).map((x) => x.id) : []);
  if (!r) return undefined;
  const d = Math.min(11, Math.max(3.4, Math.max(r.breite, r.hoehe * 1.6) * 0.8 + 1.2));
  // Die Bereichsleiste deckt links etwa 220 px: Die Mitte rückt nach Westen, damit der Zielraum rechts davon frei liegt (Spielparameter der Darstellung)
  return { lon: r.lon - d * 0.14, lat: r.lat - 0.15, d };
}

export function frontFarben(w: World): { fill: Record<number, string> | undefined; legende: Legende | undefined } {
  const kr = aktiv(w);
  const fill: Record<number, string> = {};
  for (const p of PROVINZEN) fill[p.plaka] = FRONT_FARBEN.ruhig;
  for (const k of kr) {
    for (const p of schauplatzFuer(k.land)!.grenzprovinzen) fill[p] = FRONT_FARBEN.grenze;
    for (const p of k.bedroht ?? []) fill[p] = FRONT_FARBEN.bedroht;
  }
  const zeilen = kr.map((k) => {
    const ziel = zielRegionen(k);
    const genommen = ziel.filter((r) => k.regionen?.[r.id] === "eigen").length;
    return t(k.phase === "krieg" ? "welle_k6.linse.zeile" : "welle_k6.linse.zeile_ruhe", { land: land(k.land).name, front: zahl(Math.round(k.front), 0), genommen, n: ziel.length });
  });
  const ohneKrieg = nurLesen(w).besatzung.filter((b) => !kr.some((k) => k.land === b.land));
  if (ohneKrieg.length) zeilen.push(t("welle_k6.linse.besetzt", { n: ohneKrieg.length }));
  return {
    fill,
    legende: {
      titel: t("karte.ebene.front"),
      eintraege: [
        { farbe: FRONT_FARBEN.gehalten, text: t("welle_k6.linse.gehalten") },
        { farbe: FRONT_FARBEN.umkaempft, text: t("welle_k6.linse.umkaempft") },
        { farbe: FRONT_FARBEN.gegner, text: t("welle_k6.linse.gegner") },
        { farbe: FRONT_FARBEN.bedroht, text: t("welle_k6.linse.bedroht") },
      ],
      ...(zeilen.length ? { hinweis: zeilen.join(" · ") } : {}),
    },
  };
}

// Linsen: die Kartenebenen als Auswahl, nach Gruppen geordnet, mit Verfügbarkeit, Tastenkürzeln und Vorschaustreifen.
// Reine Logik ohne Oberfläche, damit sie sich ohne Browser prüfen lässt. Die Färbung selbst bleibt in ui/ebenen.ts.

import { BEZIEHUNG_FARBEN, KARTENEBENEN, LINSEN_GRUPPEN, ebeneKurz, ebeneName, farbenFuerEbene, type Kartenebene, type LinsenGruppe } from "../ebenen";
import type { IconName } from "../icons";
import type { World } from "../../sim/types";
import { frontLinseVerfuegbar } from "./front-linse";
import { t } from "../../i18n";

/**
 * Wann eine Linse etwas zu zeigen hat. Eine Linse ohne Eintrag hier ist immer verfügbar. Spätere Linsen („Front und Besatzung“ bei einem Krieg,
 * „Bündnisse“ sobald Pakte bestehen, „Wahlkampf“ in der Kampagnenphase, „Lage nach Beben“ bei einem Fall) bekommen hier ihre Regel:
 * Solange die Daten fehlen, liefert die Regel `false`, und es entsteht kein toter Knopf.
 */
const REGELN: Partial<Record<Kartenebene, (w: World) => boolean>> = {
  wahl: (w) => !!w.parliament?.byProvince && Object.keys(w.parliament.byProvince).length > 0,
  rueckhalt: (w) => !!w.spiel,
  erbe: (w) => !!w.spiel,
  welt: (w) => !!w.spiel,
  belastung: (w) => !!w.spiel,
  versorgung: (w) => !!w.spiel,
  // Welle 3, K6 (karte.md K8): nur bei einem Krieg auf einem Schauplatz oder einer Besatzung
  front: frontLinseVerfuegbar,
};

/** Alle verfügbaren Linsen in der Reihenfolge der Tafel (Politiknetz gehört nicht dazu, es hat seinen eigenen Weg). */
export function linsenVerfuegbar(w: World): Kartenebene[] {
  const reihenfolge = LINSEN_GRUPPEN.map((g) => g.id);
  return KARTENEBENEN.filter((e) => e.gruppe !== undefined && (REGELN[e.id]?.(w) ?? true))
    .sort((a, b) => reihenfolge.indexOf(a.gruppe!) - reihenfolge.indexOf(b.gruppe!))
    .map((e) => e.id);
}

/**
 * Tastenkürzel nach Platz in der Tafel: Ziffern, V (Versorgungswege), 0, R (Katastrophenrisiko), K (Kulturerbe), B (Beziehungen). Seit Welle 1
 * (E5) fehlen 2, 8 und S: Regionen, Ressourcen und Strategische Orte stehen nicht mehr in der Tafel. Die übrigen Tasten bleiben, wie sie waren.
 */
export const LINSEN_TASTEN = "1345679v0rkb";
/** Tasten situativer Linsen, die nur bei ihrem Anlass in der Tafel stehen (Welle 3, K6: F für „Front und Besatzung“) */
export const SITUATIVE_TASTEN = "f";
const TASTE: Partial<Record<Kartenebene,string>> = {front:"F",gelaende:"1",wahl:"3",rueckhalt:"4",wirtschaft:"5",arbeitslosigkeit:"6",infrastruktur:"7",belastung:"9",versorgung:"V",probleme:"0",risiko:"R",erbe:"K",welt:"B"};

export interface Linse {
  id: Kartenebene;
  name: string;
  kurz: string;
  icon: IconName;
  gruppe: LinsenGruppe;
  /** Taste, die die Linse wählt, oder null, wenn die Tasten aufgebraucht sind */
  taste: string | null;
  /** CSS-Hintergrund des kleinen Farbstreifens, abgeleitet aus der Legende der Linse */
  streifen: string;
}

const GELAENDE_STREIFEN = "linear-gradient(90deg, #5d8a58, #c9bb82, #9a7a52, #d9d1b8)";
const hartVerlauf = (farben: string[]): string => {
  const n = farben.length;
  return `linear-gradient(90deg, ${farben.map((f, i) => `${f} ${(i / n) * 100}% ${((i + 1) / n) * 100}%`).join(", ")})`;
};

/** Der Farbstreifen einer Linse: Verlauf der Legende, sonst gleich breite Felder ihrer Einträge. */
export function streifenFuer(w: World, id: Kartenebene, netKnoten = "p_wassermangel"): string {
  if (id === "gelaende") return GELAENDE_STREIFEN;
  if (id === "welt") return hartVerlauf(Object.values(BEZIEHUNG_FARBEN));
  const { legende } = farbenFuerEbene(w, id, null, netKnoten);
  if (legende?.verlauf) return `linear-gradient(90deg, ${legende.verlauf.von}, ${legende.verlauf.mitte ? `${legende.verlauf.mitte}, ` : ""}${legende.verlauf.bis})`;
  if (legende?.eintraege?.length) return hartVerlauf(legende.eintraege.slice(0, 6).map((e) => e.farbe));
  return GELAENDE_STREIFEN;
}

/** Die Linsen der Tafel, gruppiert; leere Gruppen entfallen. Die Tastenfolge läuft über die Gruppen hinweg. */
export function linsenGruppen(w: World, mitStreifen = true): { id: LinsenGruppe; label: string; linsen: Linse[] }[] {
  const frei = new Set(linsenVerfuegbar(w));
  const gruppen: { id: LinsenGruppe; label: string; linsen: Linse[] }[] = [];
  for (const g of LINSEN_GRUPPEN) {
    const linsen: Linse[] = [];
    for (const e of KARTENEBENEN) {
      if (e.gruppe !== g.id || !frei.has(e.id)) continue;
      linsen.push({
        id: e.id,
        name: ebeneName(e.id, w),
        kurz: ebeneKurz(e.id, w),
        icon: e.icon,
        gruppe: g.id,
        taste: TASTE[e.id] ?? null,
        streifen: mitStreifen ? streifenFuer(w, e.id) : "",
      });
    }
    const gruppenLabelKey = `karte.gruppe.${g.id}`;
    const gruppenLabel = t(gruppenLabelKey);
    const label = gruppenLabel && gruppenLabel !== gruppenLabelKey ? gruppenLabel : g.label;
    if (linsen.length > 0) gruppen.push({ id: g.id, label, linsen });
  }
  return gruppen;
}

/** Welche Linse die Taste wählt (Ziffer oder B), oder null */
export function linseFuerTaste(w: World, taste: string): Kartenebene | null {
  const t = taste.toUpperCase();
  for (const g of linsenGruppen(w, false)) for (const l of g.linsen) if (l.taste === t) return l.id;
  return null;
}

/**
 * Darf eine Zifferntaste jetzt eine Linse wählen? Nicht, wenn ein Textfeld Fokus hat, eine Akte oder ein Fenster offen ist
 * oder eine Umschalttaste (Strg, Befehl, Alt) gedrückt ist.
 */
export function tasteDarfWaehlen(ziel: { tagName?: string; isContentEditable?: boolean } | null, mods: { ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean }, gesperrt: boolean): boolean {
  if (gesperrt || mods.ctrlKey || mods.metaKey || mods.altKey) return false;
  const tag = ziel?.tagName?.toUpperCase();
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return false;
  return !ziel?.isContentEditable;
}

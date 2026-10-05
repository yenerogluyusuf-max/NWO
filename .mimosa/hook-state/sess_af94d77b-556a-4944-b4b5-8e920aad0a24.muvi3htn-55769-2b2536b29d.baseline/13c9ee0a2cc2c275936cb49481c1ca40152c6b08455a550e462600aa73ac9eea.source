// Was eine Antwort im Prolog bedeutet, ohne sie zu wählen: Die Antwort wird auf eine Kopie des Profils angewandt, und der Unterschied zeigt
// die Folgen: welche Wählergruppen näher rücken (Nähe), welches Merkmal der Biografie entsteht (Vorteil und Preis, sim/biografie.ts) und
// welche Partei zum Partner wird. So zeigt die Karte immer, was wirklich geschieht, nie eine zweite Rechnung.

import { katalogDe, t } from "../../i18n";
import { FOLGEN, merkmaleVon, type Wirkung } from "../../sim/biografie";
import type { Answer, PlayerProfile } from "../../sim/prolog";
import type { Chip } from "./Chips";

export interface AntwortFolge {
  /** Wählergruppen, die näher (positiv) oder ferner (negativ) rücken, nach Stärke */
  gruppen: { id: string; delta: number }[];
  vorteil: Chip[];
  preis: Chip[];
  /** Kürzel der Partei, die zum Partner wird */
  partner?: string;
}

const vorzeichen = (n: number): string => `${n > 0 ? "+" : "−"}${Math.abs(n)}`;

/** Eine Wirkung der Biografie als kurze Zeile („Justiz: Fähigkeit +10“). */
export function wirkungText(w: Wirkung): string {
  switch (w.art) {
    case "faehigkeit":
    case "ehrgeiz":
    case "loyalitaet":
      return t(`prolog.wirkung.${w.art}`, { amt: t(`prolog.amt.${w.amt}`), delta: vorzeichen(w.delta) });
    case "kabinettLoyalitaet":
      return t("prolog.wirkung.loyalitaet", { amt: t("prolog.amt.kabinett"), delta: vorzeichen(w.delta) });
    case "kabinettEhrgeiz":
      return t("prolog.wirkung.ehrgeiz", { amt: t("prolog.amt.kabinett"), delta: vorzeichen(w.delta) });
    case "partnerLoyalitaet":
      return t("prolog.wirkung.loyalitaet", { amt: t("prolog.amt.partner"), delta: vorzeichen(w.delta) });
    case "kapital":
      return t("prolog.wirkung.kapital", { delta: vorzeichen(w.delta) });
    case "knoten": {
      // Wählergruppen heißen wie im Katalog der Gruppen, die übrigen Größen des Netzes (Legitimität, Polarisierung …) haben eigene Namen
      const name = katalogDe()[`prolog.gruppe.${w.id}`] ? t(`prolog.gruppe.${w.id}`) : t(`prolog.knoten.${w.id}`);
      return t("prolog.wirkung.knoten", { name, delta: vorzeichen(w.delta) });
    }
  }
}

const betrag = (w: Wirkung): number => Math.min(1, Math.abs(w.delta) / 10);

/** Die Folgen einer Antwort für das Profil, wie es jetzt ist. */
export function folgeVon(profil: PlayerProfile, a: Answer): AntwortFolge {
  const klon = structuredClone(profil);
  a.apply(klon);
  const gruppen = Object.keys({ ...profil.naehe, ...klon.naehe })
    .map((id) => ({ id, delta: ((klon.naehe as Record<string, number>)[id] ?? 0) - ((profil.naehe as Record<string, number>)[id] ?? 0) }))
    .filter((g) => g.delta !== 0)
    .sort((x, y) => y.delta - x.delta);
  const vorher = new Set(merkmaleVon(profil));
  const vorteil: Chip[] = [];
  const preis: Chip[] = [];
  for (const m of merkmaleVon(klon)) {
    if (vorher.has(m)) continue;
    const f = FOLGEN[m];
    if (!f) continue;
    for (const w of f.vorteil) vorteil.push({ text: wirkungText(w), staerke: betrag(w) });
    for (const w of f.preis) preis.push({ text: wirkungText(w), staerke: betrag(w) });
  }
  const partner = klon.buendnis && klon.buendnis !== profil.buendnis ? klon.buendnis : undefined;
  return { gruppen, vorteil, preis, ...(partner ? { partner } : {}) };
}

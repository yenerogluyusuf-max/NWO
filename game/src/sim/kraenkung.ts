// Beobachter-Kränkungen (Vorbild Civilization 6, RECHERCHE_GLM_16 §4.2): Wer ein Land sanktioniert oder angreift, kränkt auch dessen
// Schutzmächte und Partner. Sie sehen zu, verlieren Vertrauen und merken es sich (Erinnerung im Länderdossier). Die Zuordnung folgt
// erkennbaren Bündnissen und Schutzverhältnissen (EU-Mitgliedschaft, US-Bündnisse, russische und iranische Partner in Syrien);
// die Stärken sind Spielparameter ohne Beleg.

import type { World } from "./types";
import { t } from "../i18n";
import { landAendern } from "./laender";
import { akteurName } from "./welt-modell";
import { addLog } from "./log";

export const BEOBACHTER: Record<string, string[]> = {
  GRC: ["EU", "USA"], CYP: ["EU"], ISR: ["USA"], SYR: ["RUS", "IRN"], IRN: ["RUS", "CHN"], IRQ: ["USA", "IRN"],
  ARM: ["EU", "RUS"], SAU: ["USA"], EGY: ["SAU", "USA"], KAZ: ["RUS", "CHN"], UKR: ["EU", "USA"], GEO: ["EU"],
  USA: ["EU"], EU: ["USA"], RUS: ["CHN"], CHN: ["RUS"],
};

export const KRAENKUNG = {
  /** Anteil der Stärke, der beim Beobachter als Vertrauensverlust und als Konfliktzuwachs ankommt (Spielparameter) */
  vertrauen: 0.4,
  konflikt: 0.25,
  staerke: { sanktion: 8, angriff: 15 },
} as const;

/** Die Türkei kränkt `opfer`; die Beobachter reagieren. Gibt die Beobachter zurück (für Anzeige und Tests). */
export function kraenke(w: World, opfer: string, art: keyof typeof KRAENKUNG.staerke): string[] {
  const s = KRAENKUNG.staerke[art];
  const zeugen = (BEOBACHTER[opfer] ?? []).filter((b) => b !== opfer && w.spiel?.welt?.[b]);
  for (const b of zeugen) {
    landAendern(w, b, { vertrauen: -s * KRAENKUNG.vertrauen, konflikt: s * KRAENKUNG.konflikt }, t(`kraenkung.notiz.${art}`, { opfer: akteurName(opfer) }));
  }
  if (zeugen.length) addLog(w, "ereignis", t("kraenkung.log", { zeugen: zeugen.map(akteurName).join(", "), opfer: akteurName(opfer) }), t(`kraenkung.warum.${art}`));
  return zeugen;
}

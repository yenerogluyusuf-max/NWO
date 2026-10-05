// Startszenarien anwenden (data/startszenarien.ts): Welche Partei, welches Erbe, welche Lage und welcher Wahltermin das Spiel am ersten Tag hat.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachen.

import { PARTEI_ACHSEN } from "../data/linien";
import { STARTSZENARIO_NACH_ID } from "../data/startszenarien";
import { addLog } from "./log";
import { clamp } from "./economy";
import { krisenAktualisieren } from "./krisen";
import { naeheFuerLinie } from "./linie";
import { t } from "../i18n";
import type { PlayerProfile } from "./prolog";
import type { World } from "./types";

/** Das Profil, mit dem das Szenario wirklich beginnt: vorgegebene Partei, Bündnis, Wahl und Erbe ersetzen die Wahl im Prolog. */
export function profilFuerSzenario(p: PlayerProfile): PlayerProfile {
  const sz = STARTSZENARIO_NACH_ID[p.startszenario ?? "neugruendung"];
  if (!sz || sz.id === "neugruendung") return p;
  const out: PlayerProfile = { ...p, naehe: { ...p.naehe }, versprechen: [...p.versprechen] };
  if (sz.partei) {
    out.partei = { ...sz.partei };
    out.achsen = { ...PARTEI_ACHSEN[sz.partei.kurz]! };
    const n = out.naehe as Record<string, number>;
    for (const [g, d] of Object.entries(naeheFuerLinie(sz.partei.kurz, out.achsen))) n[g] = (n[g] ?? 0) + d;
  }
  if (sz.buendnis) out.buendnis = sz.buendnis;
  if (sz.wahl) out.wahl = { ...sz.wahl };
  if (sz.versprechen) out.versprechen = [...out.versprechen, ...sz.versprechen];
  return out;
}

/** Nach `initSpiel`: Wahltermin und Wirtschaftslage des Szenarios (die Partei und das Erbe stecken schon im Profil). */
export function wendeStartszenarioAn(world: World, profile: PlayerProfile): void {
  const sp = world.spiel;
  const sz = STARTSZENARIO_NACH_ID[profile.startszenario ?? "neugruendung"];
  if (!sp || !sz || sz.id === "neugruendung") return;
  if (sz.wahltagTage) sp.wahltag = world.day + sz.wahltagTage;
  const k = sz.krise;
  if (!k) return;
  const e = world.economy;
  e.inflation += k.inflation;
  e.expectedInflation += k.erwartung;
  e.credibility = clamp(e.credibility + k.glaubwuerdigkeit, 0.1, 1);
  e.unemployment += k.arbeitslosigkeit;
  e.growth += k.wachstum;
  e.outputGap += k.wachstum;
  e.riskPremium += k.risiko;
  e.usdTry *= k.kurs;
  e.eurTry *= k.kurs;
  e.fxChange12 += (k.kurs - 1) * 100;
  world.published.inflation.value = Math.round(e.inflation * 10) / 10;
  world.published.growth.value = Math.round(e.growth * 10) / 10;
  world.published.unemployment.value = Math.round(e.unemployment * 10) / 10;
  // Die Bilanz misst vom Stand des Amtsantritts: also von der Krise, nicht von der Lage davor
  sp.start.inflation = world.published.inflation.value;
  sp.start.arbeitslosigkeit = e.unemployment;
  sp.start.wachstum = e.growth;
  krisenAktualisieren(world);
  addLog(world, "ereignis", t("start.krise.log"), t("start.krise.warum"));
}

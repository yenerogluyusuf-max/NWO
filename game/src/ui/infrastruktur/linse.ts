// Linse „Belastung“: höchste Auslastung der Netze je Provinz, grün bis rot (Daten: sim/infrastruktur.ts).

import { ueberlastJeProvinz } from "./ueberlast";
import { PROVINZEN } from "../../sim/regional";
import { SCHWELLE } from "../../data/infrastruktur-netze";
import { t } from "../../i18n";
import type { World } from "../../sim/types";

const GRUEN = [74, 140, 92];
const GELB = [214, 168, 72];
const ROT = [150, 44, 36];
const rgb = (c: number[]): string => `rgb(${c.join(",")})`;
function mix(a: number[], b: number[], x: number): string {
  const k = Math.min(1, Math.max(0, x));
  return rgb(a.map((v, i) => Math.round(v + (b[i]! - v) * k)));
}

/** Farbe einer Auslastung: bis 60 % grün, bei „ausgelastet“ gelb, ab 110 % rot. */
export function belastungsFarbe(a: number): string {
  if (a <= 0.6) return rgb(GRUEN);
  if (a <= SCHWELLE.voll) return mix(GRUEN, GELB, (a - 0.6) / (SCHWELLE.voll - 0.6));
  return mix(GELB, ROT, (a - SCHWELLE.voll) / (1.1 - SCHWELLE.voll));
}

export function belastungFarben(w: World): {
  fill: Record<number, string> | undefined;
  legende: { titel: string; untertitel?: string; verlauf?: { von: string; bis: string; vonText: string; bisText: string; mitte?: string }; hinweis?: string } | undefined;
} {
  if (!w.spiel) return { fill: undefined, legende: undefined };
  // Welle 1, E5: Farbe nach der Überlast aller Netze der Provinz zusammen (ui/infrastruktur/ueberlast.ts). Ohne Überlast bleibt es bei
  // der Ampel des am stärksten ausgelasteten Netzes; vorher war die Linse im Spielstand des Inhabers überall gleich rot.
  const { provinzen, ueberall } = ueberlastJeProvinz(w);
  const fill: Record<number, string> = {};
  for (const x of provinzen) fill[x.plaka] = x.summe > 0 ? mix(GELB, ROT, x.not) : belastungsFarbe(x.a);
  const top = [...provinzen].sort((a, b) => b.summe - a.summe || b.a - a.a).slice(0, 3);
  return {
    fill,
    legende: {
      titel: t("infra.linse.titel"),
      untertitel: t("welle_e5.belastung.unter"),
      verlauf: { von: rgb(GRUEN), mitte: rgb(GELB), bis: rgb(ROT), vonText: t("infra.linse.von"), bisText: t("welle_e5.belastung.bis") },
      hinweis: [
        t("welle_e5.belastung.hinweis", {
          orte: top.map((x) => t("welle_e5.belastung.ort", { ort: PROVINZEN[x.plaka - 1]?.name ?? String(x.plaka), n: x.anzahl })).join("; "),
        }),
        ...(ueberall.length ? [t("welle_e5.rl.ueberall", { netze: ueberall.map((n) => t(`infra.netz.${n}`)) })] : []),
      ].join(" "),
    },
  };
}

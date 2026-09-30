// Kartenebenen: Wie die 81 Provinzen (und in der Nähe die Bezirke) eingefärbt werden und was die Legende sagt.

import { NET } from "../sim/world";
import { PROVINCES } from "../sim/netz";
import { PROVINZEN, REGION_DE } from "../sim/regional";
import { PARTY_COLORS } from "./Parliament";
import { REGION_COLORS } from "./atlas/overlay";
import INFRA from "../data/provinz_infra.json";
import { vertrauenZu, weltZustand } from "../sim/laender";
import { ERBE } from "../data/erbe";
import { STAETTEN_START } from "../data/reich";
import type { World } from "../sim/types";
import type { IconName } from "./icons";

export type Kartenebene = "gelaende" | "regionen" | "wahl" | "wirtschaft" | "arbeitslosigkeit" | "probleme" | "infrastruktur" | "netz" | "welt" | "rueckhalt" | "erbe";

export const KARTENEBENEN: { id: Kartenebene; label: string; icon: IconName }[] = [
  { id: "gelaende", label: "Politisch", icon: "berg" },
  { id: "regionen", label: "Regionen", icon: "netz" },
  { id: "wahl", label: "Wahl 2028", icon: "urne" },
  { id: "wirtschaft", label: "Wirtschaftskraft", icon: "fabrik" },
  { id: "arbeitslosigkeit", label: "Arbeitslosigkeit", icon: "koffer" },
  { id: "probleme", label: "Akute Probleme", icon: "warnung" },
  { id: "infrastruktur", label: "Infrastruktur", icon: "strasse" },
  { id: "rueckhalt", label: "Rückhalt", icon: "menge" },
  { id: "erbe", label: "Kulturerbe", icon: "kuppel" },
  { id: "welt", label: "Beziehungen", icon: "haende" },
  { id: "netz", label: "Politiknetz", icon: "netz" },
];

export interface Legende {
  titel: string;
  untertitel?: string;
  /** Kategorien mit Farbe, oder ein Verlauf von … bis */
  eintraege?: { farbe: string; text: string }[];
  verlauf?: { von: string; bis: string; vonText: string; bisText: string; mitte?: string };
  hinweis?: string;
}

function mix(a: number[], b: number[], t: number): string {
  const k = Math.min(1, Math.max(0, t));
  const c = a.map((x, i) => Math.round(x + (b[i]! - x) * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const PAPER = [236, 226, 200];
const TEAL = [38, 90, 98];
const RED = [150, 44, 36];
const GOLD = [214, 168, 72];

export const farbe = { PAPER: `rgb(${PAPER.join(",")})`, TEAL: `rgb(${TEAL.join(",")})`, RED: `rgb(${RED.join(",")})` };

const infra = INFRA.provinzen as Record<string, { strasse_dichte: number; strasse_km: number; krankenhaeuser: number; flaeche_km2: number }>;

export function strassenDichteVonProvinz(plaka: number): number {
  return infra[String(plaka)]?.strasse_dichte ?? 0;
}

export const DICHTE_MIN = Math.min(...Object.values(infra).map((p) => p.strasse_dichte));
export const DICHTE_MAX = Math.max(...Object.values(infra).map((p) => p.strasse_dichte));

function werteVon(w: World, id: string): number[] {
  const i = NET.index.get(id)!;
  return Array.from({ length: PROVINCES }, (_, p) => w.net.values[i * PROVINCES + p]!);
}

export function problemeJeProvinz(w: World, problemId: string | null): { anzahl: number[]; akut: boolean[] } {
  const anzahl = new Array<number>(PROVINCES).fill(0);
  const akut = new Array<boolean>(PROVINCES).fill(false);
  for (const node of NET.nodes) {
    if (node.kind !== "problem") continue;
    const i = NET.index.get(node.id)!;
    for (let p = 0; p < PROVINCES; p++) {
      if (w.net.values[i * PROVINCES + p]! >= node.threshold!) {
        anzahl[p]!++;
        if (node.id === problemId) akut[p] = true;
      }
    }
  }
  return { anzahl, akut };
}

export function farbenFuerEbene(w: World, ebene: Kartenebene, problemId: string | null, netNode: string): { fill: Record<number, string> | undefined; legende: Legende | undefined } {
  const out: Record<number, string> = {};
  switch (ebene) {
    case "gelaende":
      return { fill: undefined, legende: undefined };

    case "rueckhalt": {
      // Wo tragen die Menschen die Regierung? Vertrauen in die Regierung je Provinz, dazu die Stärke des Regierungslagers bei der Wahl:
      // Hochburgen und Sorgenkinder sind von Anfang an sichtbar und verschieben sich mit der Politik
      const vertrauen = werteVon(w, "vertrauen_regierung");
      const lager = new Set([w.player?.partei.kurz ?? "", ...(w.spiel?.lager ?? [])]);
      const anteil = PROVINZEN.map((p) => {
        const sitze = w.parliament?.byProvince?.[p.plaka];
        if (!sitze) return 0.5;
        const summe = Object.values(sitze).reduce((a, b) => a + b, 0) || 1;
        return Object.entries(sitze).filter(([k]) => lager.has(k)).reduce((a, [, n]) => a + n, 0) / summe;
      });
      const mittelAnteil = anteil.reduce((a, b) => a + b, 0) / anteil.length;
      const wert = vertrauen.map((v, i) => v + 26 * (anteil[i]! - mittelAnteil));
      const mitte = wert.reduce((a, b) => a + b, 0) / wert.length;
      const hell = [244, 236, 214];
      wert.forEach((v, i) => {
        const t = Math.min(1, Math.max(0, (v - (mitte - 12)) / 24));
        out[i + 1] = t < 0.5 ? mix(RED, hell, t * 2) : mix(hell, TEAL, (t - 0.5) * 2);
      });
      const rang = PROVINZEN.map((p, i) => ({ name: p.name, v: wert[i]! })).sort((a, b) => b.v - a.v);
      return {
        fill: out,
        legende: {
          titel: "Rückhalt der Regierung",
          untertitel: "Vertrauen und Wahlstärke des Lagers",
          verlauf: { von: farbe.RED, bis: farbe.TEAL, mitte: "rgb(244,236,214)", vonText: "wenig", bisText: "viel" },
          hinweis: `Hochburgen: ${rang.slice(0, 3).map((x) => x.name).join(", ")}. Sorgenkinder: ${rang.slice(-3).reverse().map((x) => x.name).join(", ")}.`,
        },
      };
    }

    case "erbe": {
      // Wie gut ist das Erbe der Provinz erhalten? Mittel der Stätten (Welterbe doppelt); Provinzen ohne Stätte bleiben unbemalt
      const z = w.spiel?.reich?.staetten;
      const summe = new Map<number, { s: number; g: number }>();
      for (const e of ERBE) {
        const gew = e.unesco.status === "welterbe" ? 2 : 1;
        const a = summe.get(e.plaka) ?? { s: 0, g: 0 };
        a.s += (z?.[e.id]?.zustand ?? STAETTEN_START[e.id] ?? 55) * gew;
        a.g += gew;
        summe.set(e.plaka, a);
      }
      const hell = [244, 236, 214];
      for (const [plaka, a] of summe) {
        const t = Math.min(1, Math.max(0, (a.s / a.g - 20) / 70));
        out[plaka] = t < 0.5 ? mix(RED, hell, t * 2) : mix(hell, TEAL, (t - 0.5) * 2);
      }
      return {
        fill: out,
        legende: {
          titel: "Kulturerbe",
          untertitel: "Erhaltungszustand der Stätten je Provinz",
          verlauf: { von: farbe.RED, bis: farbe.TEAL, mitte: "rgb(244,236,214)", vonText: "gefährdet", bisText: "gut erhalten" },
          hinweis: "Die Marken zeigen Stätten, Wunder und Bauvorhaben; ein Klick öffnet das Reich.",
        },
      };
    }

    case "welt":
      return {
        fill: undefined,
        legende: {
          titel: "Beziehungen zu den Nachbarn",
          untertitel: "Klicken Sie ein Land an",
          eintraege: [
            { farbe: BEZIEHUNG_FARBEN.gut, text: "Partner" },
            { farbe: BEZIEHUNG_FARBEN.nuechtern, text: "Nüchtern" },
            { farbe: BEZIEHUNG_FARBEN.kuehl, text: "Kühl oder angespannt" },
            { farbe: BEZIEHUNG_FARBEN.schlecht, text: "Feindselig" },
          ],
        },
      };

    case "regionen": {
      PROVINZEN.forEach((p) => (out[p.plaka] = REGION_COLORS[p.region] ?? "#999"));
      return {
        fill: out,
        legende: { titel: "Die sieben Regionen", eintraege: Object.entries(REGION_COLORS).map(([name, c]) => ({ farbe: c, text: REGION_DE[name] ?? name })) },
      };
    }

    case "wahl": {
      const kurz = w.player?.partei.kurz;
      for (const [plaka, seats] of Object.entries(w.parliament?.byProvince ?? {})) {
        const top = Object.entries(seats).sort((a, b) => b[1] - a[1])[0]?.[0];
        if (!top) continue;
        out[Number(plaka)] = top === kurz ? w.player!.partei.farbe : (PARTY_COLORS[top] ?? "#999");
      }
      const eintraege = Object.entries(w.parliament?.seats ?? {})
        .filter(([, n]) => n > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([k, n]) => ({ farbe: k === kurz ? w.player!.partei.farbe : (PARTY_COLORS[k] ?? "#999"), text: `${k === kurz ? w.player!.partei.name : k}: ${n} Sitze` }));
      return { fill: out, legende: { titel: "Wahl 2028", untertitel: "Stärkste Partei je Provinz", eintraege } };
    }

    case "wirtschaft": {
      const xs = PROVINZEN.map((p) => p.bipProKopf);
      const min = Math.min(...xs);
      const max = Math.max(...xs);
      PROVINZEN.forEach((p) => (out[p.plaka] = mix(PAPER, TEAL, Math.sqrt((p.bipProKopf - min) / (max - min)))));
      return {
        fill: out,
        legende: {
          titel: "Wirtschaftskraft",
          untertitel: "Wirtschaftsleistung je Einwohner",
          verlauf: { von: farbe.PAPER, bis: farbe.TEAL, vonText: `${Math.round(min / 1000)} Tsd. ₺`, bisText: `${Math.round(max / 1000)} Tsd. ₺` },
        },
      };
    }

    case "arbeitslosigkeit": {
      const vals = werteVon(w, "arbeitslosigkeit");
      vals.forEach((v, i) => (out[i + 1] = mix(PAPER, RED, (v - 4) / 10)));
      return {
        fill: out,
        legende: {
          titel: "Arbeitslosigkeit",
          untertitel: "Quote je Provinz (teils geschätzt)",
          verlauf: { von: farbe.PAPER, bis: farbe.RED, vonText: "4 %", bisText: "14 %" },
        },
      };
    }

    case "probleme": {
      const { anzahl, akut } = problemeJeProvinz(w, problemId);
      const node = problemId ? NET.nodes[NET.index.get(problemId)!] : undefined;
      for (let p = 0; p < PROVINCES; p++) {
        if (node) out[p + 1] = akut[p] ? mix(PAPER, RED, 0.7) : "rgba(0,0,0,0)";
        else out[p + 1] = anzahl[p] === 0 ? "rgba(0,0,0,0)" : mix(PAPER, RED, 0.3 + anzahl[p]! * 0.16);
      }
      return {
        fill: out,
        legende: node
          ? { titel: node.name, untertitel: "Akut in den rot gefärbten Provinzen", hinweis: node.text }
          : {
              titel: "Akute Probleme",
              untertitel: "Anzahl gleichzeitiger Probleme je Provinz",
              verlauf: { von: mix(PAPER, RED, 0.3), bis: mix(PAPER, RED, 1), vonText: "eines", bisText: "sechs und mehr" },
              hinweis: "Wählen Sie unten ein Problem, um zu sehen, wo genau es herrscht.",
            },
      };
    }

    case "infrastruktur": {
      PROVINZEN.forEach((p) => {
        const d = strassenDichteVonProvinz(p.plaka);
        out[p.plaka] = mix(PAPER, TEAL, Math.sqrt((d - DICHTE_MIN) / (DICHTE_MAX - DICHTE_MIN)));
      });
      return {
        fill: out,
        legende: {
          titel: "Straßennetz",
          untertitel: "Kilometer Straße je Quadratkilometer",
          verlauf: { von: farbe.PAPER, bis: farbe.TEAL, vonText: `${DICHTE_MIN.toLocaleString("de-DE", { maximumFractionDigits: 1 })}`, bisText: `${DICHTE_MAX.toLocaleString("de-DE", { maximumFractionDigits: 1 })}` },
          hinweis: "Beim Hineinzoomen erscheinen Bezirke, Straßen, Bahn, Krankenhäuser und Flughäfen. Quelle: OpenStreetMap.",
        },
      };
    }

    case "netz": {
      const node = NET.nodes[NET.index.get(netNode)!]!;
      const vals = werteVon(w, netNode);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      vals.forEach((v, i) => {
        if (node.kind === "problem") out[i + 1] = v >= node.threshold! ? mix(PAPER, RED, 0.45 + (v - node.threshold!) / 30) : "rgba(0,0,0,0)";
        else out[i + 1] = mix(PAPER, TEAL, max - min < 0.5 ? 0.4 : (v - min) / (max - min));
      });
      return {
        fill: out,
        legende: {
          titel: node.name,
          untertitel: node.kind === "problem" ? "Rot: akut" : "Wert je Provinz",
          ...(node.kind === "problem" ? {} : { verlauf: { von: farbe.PAPER, bis: farbe.TEAL, vonText: min.toLocaleString("de-DE", { maximumFractionDigits: 0 }), bisText: max.toLocaleString("de-DE", { maximumFractionDigits: 0 }) } }),
          hinweis: node.text,
        },
      };
    }
  }
}

export { GOLD };

export const BEZIEHUNG_FARBEN = { gut: "#3c8a63", nuechtern: "#b8a94a", kuehl: "#c9863a", schlecht: "#a83a32" };

/** Welches Kartenland (ISO) zu welchem Land des Spiels gehört; Länder der EU teilen sich die Beziehung zur EU. */
export const ISO_ZU_LAND: Record<string, string> = {
  SYR: "SYR", IRQ: "IRQ", IRN: "IRN", GRC: "GRC", AZE: "AZE", ARM: "ARM", SAU: "SAU", ISR: "ISR", RUS: "RUS", UKR: "UKR", GEO: "GEO", EGY: "EGY",
  LBY: "LBY", KAZ: "KAZ", CYP: "CYP",
  // Mitglieder der EU teilen sich die Beziehung zur Union (Griechenland und Zypern verhandeln zusätzlich für sich)
  AUT: "EU", BEL: "EU", BGR: "EU", HRV: "EU", CZE: "EU", DNK: "EU", EST: "EU", FIN: "EU", FRA: "EU", DEU: "EU", HUN: "EU", IRL: "EU", ITA: "EU",
  LVA: "EU", LTU: "EU", LUX: "EU", MLT: "EU", NLD: "EU", POL: "EU", PRT: "EU", ROU: "EU", SVK: "EU", SVN: "EU", ESP: "EU", SWE: "EU",
};

/** Deutsche Namen der Länder auf der Karte, auch derer ohne eigenen Gesprächspartner im Spiel. */
export const LAENDERNAMEN: Record<string, string> = {
  TUR: "Türkei", GRC: "Griechenland", BGR: "Bulgarien", CYP: "Zypern", GEO: "Georgien", ARM: "Armenien", AZE: "Aserbaidschan", IRN: "Iran", IRQ: "Irak", SYR: "Syrien",
  LBN: "Libanon", ISR: "Israel", JOR: "Jordanien", EGY: "Ägypten", LBY: "Libyen", SAU: "Saudi-Arabien", RUS: "Russland", UKR: "Ukraine", ROU: "Rumänien", MDA: "Moldau",
  HUN: "Ungarn", SRB: "Serbien", HRV: "Kroatien", BIH: "Bosnien und Herzegowina", MNE: "Montenegro", ALB: "Albanien", MKD: "Nordmazedonien", XKX: "Kosovo",
  SVK: "Slowakei", SVN: "Slowenien", ITA: "Italien", AUT: "Österreich", CZE: "Tschechien", POL: "Polen", DEU: "Deutschland", FRA: "Frankreich", ESP: "Spanien", MLT: "Malta",
  TUN: "Tunesien", DZA: "Algerien", KAZ: "Kasachstan", TKM: "Turkmenistan", UZB: "Usbekistan", BLR: "Belarus", KWT: "Kuwait", QAT: "Katar", ARE: "Vereinigte Arabische Emirate", SDN: "Sudan",
};

export function laenderFarben(w: World): Record<string, string> {
  const out: Record<string, string> = {};
  if (!w.spiel) return out;
  for (const [iso, id] of Object.entries(ISO_ZU_LAND)) {
    const v = vertrauenZu(w, id);
    const k = weltZustand(w)[id]!.konflikt;
    out[iso] = v >= 55 && k < 55 ? BEZIEHUNG_FARBEN.gut : v >= 40 ? BEZIEHUNG_FARBEN.nuechtern : v >= 25 ? BEZIEHUNG_FARBEN.kuehl : BEZIEHUNG_FARBEN.schlecht;
  }
  return out;
}

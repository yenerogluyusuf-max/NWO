// Kartenebenen: Wie die 81 Provinzen (und in der Nähe die Bezirke) eingefärbt werden und was die Legende sagt.

import { NET } from "../sim/world";
import { PROVINCES } from "../sim/netz";
import { PROVINZEN, REGION_DE } from "../sim/regional";
import { PARTY_COLORS } from "./Parliament";
import { REGION_COLORS } from "./atlas/overlay";
import INFRA from "../data/provinz_infra.json";
import { vertrauenZu, weltZustand } from "../sim/laender";
import { beziehungZurTuerkei } from "../sim/welt-modell";
import { WELT } from "../data/welt-daten";
import { WEITERE } from "../data/welt-weitere";
import { depremRisiko } from "../sim/katastrophe";
import { ERBE } from "../data/erbe";
import { STAETTEN_START } from "../data/reich";
import { ressourcenFarben, strategieFarben } from "./gueter/linsen";
import { belastungFarben } from "./infrastruktur/linse";
import type { World } from "../sim/types";
import type { IconName } from "./icons";
import { t, aktuelleSprache } from "../i18n";

// Neue Ebene („Linse“) anlegen: Kennung in `Kartenebene`, Eintrag in KARTENEBENEN (Gruppe, Symbol, Kurzsatz), Färbung in
// `farbenFuerEbene`, Verfügbarkeitsregel in ui/linsen/linsen.ts (`REGELN`). Geplant, aber noch ohne Daten und darum nicht
// ausgeliefert: „Front und Besatzung“, „Bündnisse“, „Wahlkampf“, „Lage nach Beben“.
export type Kartenebene = "gelaende" | "regionen" | "wahl" | "wirtschaft" | "arbeitslosigkeit" | "probleme" | "infrastruktur" | "netz" | "welt" | "rueckhalt" | "erbe" | "risiko" | "ressourcen" | "strategie" | "belastung";

export type LinsenGruppe = "land" | "wirtschaft" | "krisen" | "kultur" | "welt";

/** Die Gruppen der Linsenwahl in der Reihenfolge der Tafel */
export const LINSEN_GRUPPEN: { id: LinsenGruppe; label: string }[] = [
  { id: "land", label: "Land und Wähler" },
  { id: "wirtschaft", label: "Wirtschaft" },
  { id: "krisen", label: "Krisen" },
  { id: "kultur", label: "Kultur" },
  { id: "welt", label: "Welt" },
];

export interface EbenenDef {
  id: Kartenebene;
  /** Name in der Wahl; der Name der Wahlebene hängt vom Spielstand ab (siehe `ebeneName`) */
  label: string;
  icon: IconName;
  /** Ohne Gruppe erscheint die Ebene nicht in der Linsenwahl (das Politiknetz hat seinen eigenen Weg) */
  gruppe?: LinsenGruppe;
  /** „Was zeigt das?“ in einem Satz */
  kurz: string;
}

export const KARTENEBENEN: EbenenDef[] = [
  { id: "gelaende", label: "Politisch", icon: "karte", gruppe: "land", kurz: "Gelände, Grenzen und Städte, ohne Einfärbung." },
  { id: "regionen", label: "Regionen", icon: "gebiete", gruppe: "land", kurz: "Die sieben Großregionen mit ihren Provinzen." },
  { id: "wahl", label: "Wahlausgang", icon: "urne", gruppe: "land", kurz: "Stärkste Partei je Provinz bei der Wahl, die Sie ins Amt brachte." },
  { id: "rueckhalt", label: "Rückhalt", icon: "menge", gruppe: "land", kurz: "Wo die Menschen die Regierung tragen und wo nicht." },
  { id: "wirtschaft", label: "Wirtschaftskraft", icon: "fabrik", gruppe: "wirtschaft", kurz: "Wirtschaftsleistung je Einwohner und Provinz." },
  { id: "arbeitslosigkeit", label: "Arbeitslosigkeit", icon: "koffer", gruppe: "wirtschaft", kurz: "Quote je Provinz, teils geschätzt." },
  { id: "infrastruktur", label: "Infrastruktur", icon: "strasse", gruppe: "wirtschaft", kurz: "Straßennetz; beim Hineinzoomen Bahn, Krankenhäuser, Flughäfen." },
  { id: "probleme", label: "Akute Probleme", icon: "warnung", gruppe: "krisen", kurz: "Wo mehrere Probleme zugleich über der Schwelle liegen." },
  { id: "risiko", label: "Katastrophenrisiko", icon: "beben", gruppe: "krisen", kurz: "Erdbebengefährdung je Provinz, dazu Flut und Brand." },
  { id: "ressourcen", label: "Ressourcen", icon: "berg", gruppe: "wirtschaft", kurz: "Belegte Vorkommen je Provinz: Bor, Erze, Kohle, Öl und Gas, Wasser, Kornkammern." },
  { id: "belastung", label: "Belastung", icon: "kran", gruppe: "wirtschaft", kurz: "Wie voll Straßen, Bahn, Strom, Wasser, Wohnungen und Kliniken je Provinz sind; der Zeiger zeigt Kapazität und Bau." },
  { id: "erbe", label: "Kulturerbe", icon: "kuppel", gruppe: "kultur", kurz: "Erhaltungszustand der Stätten, dazu Wunder und Bauvorhaben." },
  { id: "welt", label: "Beziehungen", icon: "haende", gruppe: "welt", kurz: "Wie die Länder der Welt zur Türkei stehen; Klick öffnet die Länderkarte." },
  { id: "strategie", label: "Strategische Orte", icon: "ziel", gruppe: "welt", kurz: "Meerengen, Pipelines, Häfen, Dämme und Inseln, die über Versorgung und Macht entscheiden." },
  { id: "netz", label: "Politiknetz", icon: "netz", kurz: "Ein Knoten des Politiknetzes je Provinz." },
];

/** Das Jahr, in dem das Spiel begann: Die Sitzverteilung je Provinz stammt aus der Wahl, die den Spieler ins Amt brachte (sie ändert sich im Spiel nicht). */
export function wahlJahr(w: World): string {
  return (w.spiel?.start.datum ?? w.date).slice(0, 4);
}

/** Anzeigename der Ebene: Die Wahlebene nennt das Jahr aus dem Spielstand statt einer festen Zahl. */
export function ebeneName(id: Kartenebene, w: World): string {
  if (id === "wahl") return `${t("karte.ebene.wahl")} ${wahlJahr(w)}`;
  const key = `karte.ebene.${id}`;
  const lok = t(key);
  if (lok && lok !== key) return lok;
  return KARTENEBENEN.find((e) => e.id === id)?.label ?? id;
}

/** Kurzsatz der Ebene; die Wahlebene sagt ehrlich, dass sie den Stand zum Amtsantritt zeigt, und nennt die nächste Wahl. */
export function ebeneKurz(id: Kartenebene, w: World): string {
  const basis = KARTENEBENEN.find((e) => e.id === id)?.kurz ?? "";
  if (id !== "wahl") return basis;
  const spiel = w.spiel;
  if (!spiel) return basis;
  const monate = Math.max(0, Math.round((spiel.wahltag - w.day) / 30.4));
  return `Stärkste Partei je Provinz, Stand zum Amtsantritt. Nächste Wahl in ${monate} Monaten.`;
}

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

    case "belastung":
      return belastungFarben(w);

    case "ressourcen":
      return ressourcenFarben();

    case "strategie":
      return strategieFarben();

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
      // Die Sitzverteilung je Provinz ist der Stand zum Amtsantritt (sim/prolog.ts); sie ändert sich bis zur nächsten Wahl nicht
      return { fill: out, legende: { titel: ebeneName("wahl", w), untertitel: "Stärkste Partei je Provinz, Stand zum Amtsantritt", eintraege } };
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
              hinweis: "Wählen Sie in der Liste ein Problem, um zu sehen, wo genau es herrscht.",
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

    case "risiko": {
      // INF-5: Katastrophenrisiko je Provinz — Erdbeben 1–5 aus kalibrierung/provinz_profile.csv
      // (data/katastrophe_risiko.json), grob an den Bruchzonen der GEM Global Active Faults
      PROVINZEN.forEach((p) => {
        const risiko = depremRisiko(p.plaka);
        out[p.plaka] = mix(PAPER, RED, 0.15 + 0.17 * risiko);
      });
      const gefaehrlich = PROVINZEN.filter((p) => depremRisiko(p.plaka) === 5)
        .map((p) => p.name)
        .slice(0, 8)
        .join(", ");
      return {
        fill: out,
        legende: {
          titel: "Katastrophenrisiko",
          untertitel: "Erdbeben-Gefährdung je Provinz (1–5)",
          verlauf: { von: farbe.PAPER, bis: farbe.RED, vonText: "gering", bisText: "sehr hoch" },
          hinweis: `Bruchzonen: Nordanatolische und Ostanatolische Verwerfung, westanatolische Graben. Höchstes Risiko u. a.: ${gefaehrlich}. Dazu saisonal: Sturzflut am Schwarzen Meer, Großbrände an Ägäis und Mittelmeer, Dürre im Konya-Becken. Quelle: provinz_profile.csv; Verwerfungen nach GEM Global Active Faults (CC BY-SA 4.0).`,
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
  EU: "EU", USA: "USA", CHN: "CHN", SYR: "SYR", IRQ: "IRQ", IRN: "IRN", GRC: "GRC", AZE: "AZE", ARM: "ARM", SAU: "SAU", ISR: "ISR", RUS: "RUS", UKR: "UKR", GEO: "GEO", EGY: "EGY",
  LBY: "LBY", KAZ: "KAZ", CYP: "CYP",
  // Mitglieder der EU teilen sich die Beziehung zur Union (Griechenland und Zypern verhandeln zusätzlich für sich)
  AUT: "EU", BEL: "EU", BGR: "EU", HRV: "EU", CZE: "EU", DNK: "EU", EST: "EU", FIN: "EU", FRA: "EU", DEU: "EU", HUN: "EU", IRL: "EU", ITA: "EU",
  LVA: "EU", LTU: "EU", LUX: "EU", MLT: "EU", NLD: "EU", POL: "EU", PRT: "EU", ROU: "EU", SVK: "EU", SVN: "EU", ESP: "EU", SWE: "EU",
};

/** Deutsche Namen der Länder auf der Karte, auch derer ohne eigenen Gesprächspartner im Spiel. */
export const LAENDERNAMEN: Record<string, string> = {
  EU: "Europäische Union", TUR: "Türkei", GRC: "Griechenland", BGR: "Bulgarien", CYP: "Zypern", GEO: "Georgien", ARM: "Armenien", AZE: "Aserbaidschan", IRN: "Iran", IRQ: "Irak", SYR: "Syrien",
  LBN: "Libanon", ISR: "Israel", JOR: "Jordanien", EGY: "Ägypten", LBY: "Libyen", SAU: "Saudi-Arabien", RUS: "Russland", UKR: "Ukraine", ROU: "Rumänien", MDA: "Moldau",
  HUN: "Ungarn", SRB: "Serbien", HRV: "Kroatien", BIH: "Bosnien und Herzegowina", MNE: "Montenegro", ALB: "Albanien", MKD: "Nordmazedonien", XKX: "Kosovo",
  SVK: "Slowakei", SVN: "Slowenien", ITA: "Italien", AUT: "Österreich", CZE: "Tschechien", POL: "Polen", DEU: "Deutschland", FRA: "Frankreich", ESP: "Spanien", MLT: "Malta",
  KOS: "Kosovo", PSX: "Palästinensische Gebiete", CYN: "Nordzypern", TUN: "Tunesien", DZA: "Algerien", KAZ: "Kasachstan", TKM: "Turkmenistan", UZB: "Usbekistan", BLR: "Belarus", KWT: "Kuwait", QAT: "Katar", ARE: "Vereinigte Arabische Emirate", SDN: "Sudan", USA: "Vereinigte Staaten", CHN: "China", BRA: "Brasilien", IND: "Indien", ZAF: "Südafrika", ETH: "Äthiopien", IDN: "Indonesien", GBR: "Vereinigtes Königreich", PAK: "Pakistan", KGZ: "Kirgisistan", SWE: "Schweden", NLD: "Niederlande", BEL: "Belgien",
};

export const LAENDERNAMEN_TR: Record<string, string> = {
  EU: "Avrupa Birliği", TUR: "Türkiye", GRC: "Yunanistan", BGR: "Bulgaristan", CYP: "Kıbrıs", GEO: "Gürcistan", ARM: "Ermenistan", AZE: "Azerbaycan", IRN: "İran", IRQ: "Irak", SYR: "Suriye",
  LBN: "Lübnan", ISR: "İsrail", JOR: "Ürdün", EGY: "Mısır", LBY: "Libya", SAU: "Suudi Arabistan", RUS: "Rusya", UKR: "Ukrayna", ROU: "Romanya", MDA: "Moldova",
  HUN: "Macaristan", SRB: "Sırbistan", HRV: "Hırvatistan", BIH: "Bosna-Hersek", MNE: "Karadağ", ALB: "Arnavutluk", MKD: "Kuzey Makedonya", XKX: "Kosova",
  SVK: "Slovakya", SVN: "Slovenya", ITA: "İtalya", AUT: "Avusturya", CZE: "Çekya", POL: "Polonya", DEU: "Almanya", FRA: "Fransa", ESP: "İspanya", MLT: "Malta",
  KOS: "Kosova", PSX: "Filistin", CYN: "Kuzey Kıbrıs", TUN: "Tunus", DZA: "Cezayir", KAZ: "Kazakistan", TKM: "Türkmenistan", UZB: "Özbekistan", BLR: "Belarus", KWT: "Kuveyt", QAT: "Katar", ARE: "Birleşik Arap Emirlikleri", SDN: "Sudan", USA: "Amerika Birleşik Devletleri", CHN: "Çin", BRA: "Brezilya", IND: "Hindistan", ZAF: "Güney Afrika", ETH: "Etiyopya", IDN: "Endonezya", GBR: "Birleşik Krallık", PAK: "Pakistan", KGZ: "Kırgızistan", SWE: "İsveç", NLD: "Hollanda", BEL: "Belçika",
};

export const LAENDERNAMEN_EN: Record<string, string> = {
  EU: "European Union", TUR: "Turkey", GRC: "Greece", BGR: "Bulgaria", CYP: "Cyprus", GEO: "Georgia", ARM: "Armenia", AZE: "Azerbaijan", IRN: "Iran", IRQ: "Iraq", SYR: "Syria",
  LBN: "Lebanon", ISR: "Israel", JOR: "Jordan", EGY: "Egypt", LBY: "Libya", SAU: "Saudi Arabia", RUS: "Russia", UKR: "Ukraine", ROU: "Romania", MDA: "Moldova",
  HUN: "Hungary", SRB: "Serbia", HRV: "Croatia", BIH: "Bosnia and Herzegovina", MNE: "Montenegro", ALB: "Albania", MKD: "North Macedonia", XKX: "Kosovo",
  SVK: "Slovakia", SVN: "Slovenia", ITA: "Italy", AUT: "Austria", CZE: "Czechia", POL: "Poland", DEU: "Germany", FRA: "France", ESP: "Spain", MLT: "Malta",
  KOS: "Kosovo", PSX: "Palestine", CYN: "Northern Cyprus", TUN: "Tunisia", DZA: "Algeria", KAZ: "Kazakhstan", TKM: "Turkmenistan", UZB: "Uzbekistan", BLR: "Belarus", KWT: "Kuwait", QAT: "Qatar", ARE: "United Arab Emirates", SDN: "Sudan", USA: "United States", CHN: "China", BRA: "Brazil", IND: "India", ZAF: "South Africa", ETH: "Ethiopia", IDN: "Indonesia", GBR: "United Kingdom", PAK: "Pakistan", KGZ: "Kyrgyzstan", SWE: "Sweden", NLD: "Netherlands", BEL: "Belgium",
};

export function landName(iso: string): string {
  const sprache = aktuelleSprache();
  if (sprache === "tr") return LAENDERNAMEN_TR[iso] ?? LAENDERNAMEN[iso] ?? iso;
  if (sprache === "en") return LAENDERNAMEN_EN[iso] ?? LAENDERNAMEN[iso] ?? iso;
  return LAENDERNAMEN[iso] ?? iso;
}

/**
 * Welcher Akteur des Weltmodells zu welchem Kartenland (ISO) gehört. Grundlage ist ISO_ZU_LAND (die EU-Mitglieder teilen sich die Beziehung
 * zur Union); Akteure mit eigenem Land (Hauptakteure außer der EU, weitere Staaten) haben Vorrang. Der Akteur „EU“ steht mit DEU nur als
 * Maßstab in den Weltbank-Daten und besitzt kein eigenes Kartenland.
 */
export function akteurJeKartenland(): Record<string, string> {
  const out: Record<string, string> = { ...ISO_ZU_LAND };
  for (const d of WELT) if (d.id !== "EU") out[d.iso] = d.id;
  for (const d of WEITERE) out[d.iso] = d.id;
  return out;
}

/** Farbe der Beziehung zur Türkei nach Vertrauen und Konflikt (Schwellen: Spielparameter, wie in der Länderkarte seit jeher) */
function beziehungsFarbe(vertrauen: number, konflikt: number): string {
  return vertrauen >= 55 && konflikt < 55 ? BEZIEHUNG_FARBEN.gut : vertrauen >= 40 ? BEZIEHUNG_FARBEN.nuechtern : vertrauen >= 25 ? BEZIEHUNG_FARBEN.kuehl : BEZIEHUNG_FARBEN.schlecht;
}

/** Färbt jedes Kartenland, zu dem das Weltmodell einen Akteur kennt (Schlüssel: ISO-Kürzel der Kartenflächen). */
export function laenderFarben(w: World): Record<string, string> {
  const out: Record<string, string> = {};
  if (!w.spiel) return out;
  const je = new Map<string, string>();
  for (const [iso, id] of Object.entries(akteurJeKartenland())) {
    let farbe = je.get(id);
    if (farbe === undefined) {
      const b = beziehungZurTuerkei(w, id);
      farbe = beziehungsFarbe(b.vertrauen, b.konflikt);
      je.set(id, farbe);
    }
    out[iso] = farbe;
  }
  return out;
}

/**
 * Wo die Flagge eines Gesprächspartners auf der Karte steht: bei der Hauptstadt bzw. dem Regierungssitz des Akteurs (Brüssel für die EU), die Lage kommt aus
 * Natural Earth (gemeinfrei) und liegt im jeweiligen Land. `rang` ordnet das Gedränge: Liegen zwei Flaggen auf dem Bildschirm zu nah beieinander,
 * bleibt die mit dem höheren Rang (Großmächte und Nachbarn der Türkei zuerst). Alle 41 Akteure des Weltmodells haben eine Marke.
 */
export const LAND_PINS: { id: string; iso: string; lon: number; lat: number; rang: number }[] = [
  { id: "USA", iso: "USA", lon: -77.011, lat: 38.901, rang: 100 },
  { id: "CHN", iso: "CHN", lon: 116.394, lat: 39.902, rang: 100 },
  { id: "RUS", iso: "RUS", lon: 37.614, lat: 55.754, rang: 95 },
  { id: "EU", iso: "EU", lon: 4.331, lat: 50.835, rang: 95 },
  { id: "DEU", iso: "DEU", lon: 13.4, lat: 52.524, rang: 70 },
  { id: "FRA", iso: "FRA", lon: 2.353, lat: 48.858, rang: 70 },
  { id: "GBR", iso: "GBR", lon: -0.119, lat: 51.502, rang: 65 },
  { id: "ITA", iso: "ITA", lon: 12.481, lat: 41.898, rang: 55 },
  { id: "ESP", iso: "ESP", lon: -3.685, lat: 40.402, rang: 50 },
  { id: "POL", iso: "POL", lon: 21.005, lat: 52.231, rang: 55 },
  { id: "NLD", iso: "NLD", lon: 4.27, lat: 52.08, rang: 40 },
  { id: "AUT", iso: "AUT", lon: 16.365, lat: 48.202, rang: 35 },
  { id: "HUN", iso: "HUN", lon: 19.081, lat: 47.502, rang: 45 },
  { id: "ROU", iso: "ROU", lon: 26.098, lat: 44.435, rang: 50 },
  { id: "BGR", iso: "BGR", lon: 23.315, lat: 42.685, rang: 50 },
  { id: "SWE", iso: "SWE", lon: 18.066, lat: 59.324, rang: 35 },
  { id: "UKR", iso: "UKR", lon: 30.515, lat: 50.435, rang: 80 },
  { id: "GRC", iso: "GRC", lon: 23.731, lat: 37.985, rang: 85 },
  { id: "CYP", iso: "CYP", lon: 33.367, lat: 35.167, rang: 80 },
  { id: "GEO", iso: "GEO", lon: 44.789, lat: 41.727, rang: 80 },
  { id: "ARM", iso: "ARM", lon: 44.512, lat: 40.183, rang: 80 },
  { id: "AZE", iso: "AZE", lon: 49.86, lat: 40.397, rang: 82 },
  { id: "IRN", iso: "IRN", lon: 51.422, lat: 35.674, rang: 85 },
  { id: "IRQ", iso: "IRQ", lon: 44.392, lat: 33.341, rang: 82 },
  { id: "SYR", iso: "SYR", lon: 36.298, lat: 33.502, rang: 82 },
  { id: "ISR", iso: "ISR", lon: 35.207, lat: 31.778, rang: 85 },
  { id: "EGY", iso: "EGY", lon: 31.248, lat: 30.052, rang: 82 },
  { id: "LBY", iso: "LBY", lon: 13.18, lat: 32.892, rang: 60 },
  { id: "SAU", iso: "SAU", lon: 46.72, lat: 24.634, rang: 80 },
  { id: "ARE", iso: "ARE", lon: 54.367, lat: 24.467, rang: 50 },
  { id: "QAT", iso: "QAT", lon: 51.533, lat: 25.287, rang: 45 },
  { id: "KAZ", iso: "KAZ", lon: 71.428, lat: 51.181, rang: 60 },
  { id: "UZB", iso: "UZB", lon: 69.269, lat: 41.304, rang: 35 },
  { id: "KGZ", iso: "KGZ", lon: 74.583, lat: 42.875, rang: 30 },
  { id: "TKM", iso: "TKM", lon: 58.383, lat: 37.95, rang: 30 },
  { id: "IND", iso: "IND", lon: 77.2, lat: 28.6, rang: 75 },
  { id: "PAK", iso: "PAK", lon: 73.081, lat: 33.689, rang: 55 },
  { id: "IDN", iso: "IDN", lon: 106.827, lat: -6.172, rang: 45 },
  { id: "BRA", iso: "BRA", lon: -47.918, lat: -15.781, rang: 60 },
  { id: "ZAF", iso: "ZAF", lon: 28.227, lat: -25.705, rang: 45 },
  { id: "ETH", iso: "ETH", lon: 38.698, lat: 9.035, rang: 40 },
];

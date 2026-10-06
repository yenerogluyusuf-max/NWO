// Der Wissensbaum: Sicht und Entscheidungen (Konzept FOKUS_FORSCHUNG_KRIEG_KONZEPT_2026-10-05.md, Leitsatz „Realismus verpackt in ein Spiel“).
//
// Die Knoten sind Vorhaben des Reiches; der Baum ordnet sie in Zweige und Spalten, sagt in einem Satz, warum ein Knoten gesperrt ist,
// und bietet drei Entscheidungen, die etwas kosten:
//   1. Schwerpunkt: Ein Zweig forscht schneller, die anderen etwas langsamer (Kapital, Sperrfrist).
//   2. Selbst forschen oder Lizenz kaufen: Lizenz ist schneller, kostet Kapital und Gebühren, macht abhängig; der Rivale des Lizenzgebers
//      nimmt es übel, und sperrt der Lizenzgeber (Krieg, Sanktion, Zerwürfnis), stocken Bau und Werk.
//   3. Werk staatlich, mit heimischer Firma oder mit ausländischem Partner: weniger Schulden gegen Abhängigkeit oder weniger eigenes Wissen.
// Das Tempo jedes Knotens hängt an Forschungsetat, Innovationsgrenze (Bildung über Jahre) und Abwanderung (sim/wissensbaum-kern.ts).
// Fertige Werke stellen Güter her (sim/gueter.ts), heben die heimische Generation der Streitkräfte und beschleunigen ihre Fertigung.

import { BAUM, RIVALEN, WERK_VON, ZWEIGE, ZWEIG_VON, type Lizenzgeber, type Traeger, type ZweigId } from "../data/wissensbaum";
import type { GattungId } from "../data/streitkraefte";
import type { Voraussetzung } from "./reich-typen";
import { beginne, reichZustand, vergabeAngebot, verwaltungBilanz, vorhabenSicht } from "./reich";
import { baumZustand, landesTempo, lizenzgeber, partnerGesperrt, setzeSperrQuelle, tempoTeile, werkErtrag, werkZusatz, type TempoTeile } from "./wissensbaum-kern";
import { aussenZustand } from "./diplomatie";
import { aktiveKriege } from "./krieg";
import { forschungsSicht, WISSEN, bildungsUeberhang } from "./wissensbasis";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { dimensionZu } from "./laender";
import { forschungsBudget } from "./haushalt";
import { setzeGueterQuelle, streitkraefte } from "./streitkraefte";
import { beziehungAendern, beziehungZurTuerkei } from "./welt-modell";
import { kannZahlen } from "./kapital";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { t } from "../i18n";
import type { World } from "./types";

export type KnotenZustand = "fertig" | "laeuft" | "moeglich" | "gesperrt";

export interface KnotenSicht {
  id: string;
  zweig: ZweigId;
  /** Spalte im Baum: Länge der längsten Kette von Voraussetzungen im Baum */
  spalte: number;
  zustand: KnotenZustand;
  /** 0 bis 1 */
  fortschritt: number;
  restMonate?: number;
  /** Kapital und geplante Monate beim Beginn (transparente Ausschreibung) */
  pk: number;
  monate: number;
  /** Ein Satz, warum der Knoten gesperrt ist (leer, wenn möglich) */
  grund?: string;
  /** Die Art des ersten Hindernisses, für den Hinweis „Bildung erhöhen“ */
  hindernis?: "bildung" | "foerderung" | "vorgaenger" | "partner" | "knoten" | "kapital" | "verwaltung" | "sonst";
  /** Fehlen noch Hochschulen, Fachkräfte oder Bildungsqualität? */
  brauchtBildung: boolean;
  /** Alle Voraussetzungen als Zeilen */
  voraus: { text: string; erfuellt: boolean }[];
  /** Vorgänger im Baum (für Verbindungen) */
  vorgaenger: string[];
  lizenzgeber: Lizenzgeber[];
  lizenz?: Lizenzgeber;
  traeger?: { art: Traeger; partner?: Lizenzgeber };
  werk: boolean;
  tempo?: TempoTeile;
  /** Frischer Durchbruch: Stempel in der Ansicht */
  durchbruch: boolean;
  /** Wunder: riesig und ungewiss */
  wunder: boolean;
  /** Ungewisser Durchbruch (kann scheitern) */
  ungewiss: boolean;
}

export interface ZweigSicht {
  id: ZweigId;
  knoten: KnotenSicht[];
  fertig: number;
  schwerpunkt: boolean;
}

export interface BaumSicht {
  zweige: ZweigSicht[];
  /** Forschungstempo des Landes (ohne Zweig und Lizenz) */
  tempo: { forschung: number; abwanderung: number; gesamt: number };
  /** Forschungsetat gegen Innovationsgrenze, in % des BIP */
  etat: { budget: number; grenze: number; verpufft: number };
  abwanderung: boolean;
  /** Wie viele mögliche oder gesperrte Knoten auf mehr Ingenieure (Hochschulen, Fachkräfte) warten */
  wartenAufBildung: number;
  schwerpunkt: ZweigId | null;
  /** Tage, bis der Schwerpunkt wieder gewechselt werden kann (0 = jetzt) */
  schwerpunktSperre: number;
  /** Ein Satz zur Lage */
  satz: string;
}

const BILDUNG = new Set(["hochschule", "fachkraefte", "bildungsqualitaet"]);

/** Name einer Größe oder eines Vorhabens aus dem Katalog des Wissensbaums (sonst die Kennung). */
export const groesseName = (id: string): string => t(`wissen.g.${id}`);
export const knotenName = (id: string): string => t(`wissen.n.${id}.name`);

function grundZeile(v: Voraussetzung, jetzt: number | undefined): { text: string; art: NonNullable<KnotenSicht["hindernis"]> } {
  const j = jetzt === undefined ? 0 : Math.round(jetzt);
  switch (v.art) {
    case "bestand":
      return { text: t("wissen.grund.vorgaenger", { name: ZWEIG_VON[v.id] ? knotenName(v.id) : groesseName(v.id) }), art: "vorgaenger" };
    case "knoten":
      if (BILDUNG.has(v.id)) return { text: t("wissen.grund.bildung", { was: groesseName(v.id), jetzt: j, ziel: v.min ?? 0 }), art: "bildung" };
      return { text: t("wissen.grund.knoten", { was: groesseName(v.id), jetzt: j, ziel: v.min ?? v.max ?? 0 }), art: "knoten" };
    case "massnahme":
      if (v.id === "m_forschung") return { text: t("wissen.grund.foerderung", { jetzt: j, ziel: v.min ?? 0 }), art: "foerderung" };
      return { text: t("wissen.grund.massnahme", { was: groesseName(v.id), jetzt: j, ziel: v.min ?? v.max ?? 0 }), art: "knoten" };
    case "land":
      return { text: t("wissen.grund.partner", { land: t(`wissen.partner.${v.land}`), jetzt: j, ziel: v.min ?? 0 }), art: "partner" };
    case "jahr":
      return { text: t("wissen.grund.jahr", { jahr: v.min }), art: "sonst" };
    default:
      return { text: t("wissen.grund.sonst"), art: "sonst" };
  }
}

/** Kurze Zeile für die Liste der Voraussetzungen (ohne Ratschlag). */
function vorausZeile(v: Voraussetzung, jetzt: number | undefined): string {
  const j = jetzt === undefined ? 0 : Math.round(jetzt);
  switch (v.art) {
    case "bestand":
      return t("wissen.v.bestand", { name: ZWEIG_VON[v.id] ? knotenName(v.id) : groesseName(v.id) });
    case "knoten":
      return t("wissen.v.knoten", { was: groesseName(v.id), jetzt: j, ziel: v.min ?? v.max ?? 0 });
    case "massnahme":
      return t("wissen.v.massnahme", { was: groesseName(v.id), jetzt: j, ziel: v.min ?? v.max ?? 0 });
    case "land":
      return t("wissen.v.partner", { land: t(`wissen.partner.${v.land}`), jetzt: j, ziel: v.min ?? 0 });
    default:
      return grundZeile(v, jetzt).text;
  }
}

function jetztWert(w: World, v: Voraussetzung): number | undefined {
  if (v.art === "knoten" || v.art === "massnahme") return NET.index.has(v.id) ? nationalAverage(NET, w.net, v.id) : undefined;
  if (v.art === "land") return dimensionZu(w, v.land, v.dim);
  return undefined;
}

const spaltenCache = new Map<string, number>();
/** Spalte eines Knotens: 0 ohne Vorgänger im Baum, sonst eins mehr als der späteste Vorgänger. */
export function spalteVon(id: string, voraus: (id: string) => Voraussetzung[], tiefe = 0): number {
  const c = spaltenCache.get(id);
  if (c !== undefined) return c;
  if (tiefe > 20) return 0;
  const vor = voraus(id).filter((x): x is { art: "bestand"; id: string } => x.art === "bestand" && !!ZWEIG_VON[x.id]).map((x) => x.id);
  const s = vor.length ? 1 + Math.max(...vor.map((v) => spalteVon(v, voraus, tiefe + 1))) : 0;
  spaltenCache.set(id, s);
  return s;
}

/** Sicht auf einen Knoten. */
export function knotenSicht(w: World, id: string): KnotenSicht | null {
  const s = vorhabenSicht(w, id);
  const zweig = ZWEIG_VON[id];
  if (!s || !zweig) return null;
  const z = baumZustand(w);
  const v = s.v;
  const angebot = vergabeAngebot(v, "ausschreibung");
  const voraus = v.voraus.map((x) => {
    const st = s.voraus.find((y) => y.voraus === x);
    return { text: vorausZeile(x, jetztWert(w, x)), erfuellt: st?.erfuellt ?? false };
  });
  const zustand: KnotenZustand = s.status === "fertig" ? "fertig" : s.status === "im_bau" || s.status === "pausiert" ? "laeuft" : s.bereit && s.status === "verfuegbar" ? "moeglich" : "gesperrt";
  let grund: string | undefined;
  let hindernis: KnotenSicht["hindernis"];
  if (zustand === "gesperrt") {
    const erstes = v.voraus.find((x) => !s.voraus.find((y) => y.voraus === x)?.erfuellt);
    if (erstes) {
      const g = grundZeile(erstes, jetztWert(w, erstes));
      grund = g.text;
      hindernis = g.art;
    } else {
      grund = t("wissen.grund.sonst");
      hindernis = "sonst";
    }
  } else if (zustand === "moeglich") {
    if (!kannZahlen(w.spiel!.kapital, angebot.pk)) {
      grund = t("wissen.grund.kapital", { pk: angebot.pk });
      hindernis = "kapital";
    } else if (!s.verwaltungOk) {
      grund = t("wissen.grund.verwaltung");
      hindernis = "verwaltung";
    }
  }
  const frisch = z.durchbrueche.find((d) => d.id === id && w.day - d.tag <= BAUM.durchbruchTage);
  return {
    id,
    zweig,
    spalte: spalteVon(id, (x) => vorhabenSicht(w, x)?.v.voraus ?? []),
    zustand,
    fortschritt: s.fortschritt,
    ...(s.restMonate !== undefined ? { restMonate: s.restMonate } : {}),
    pk: angebot.pk,
    monate: angebot.monate,
    ...(grund ? { grund } : {}),
    ...(hindernis ? { hindernis } : {}),
    voraus,
    // Wartet auf Bildung: Die Vorgänger stehen, aber Hochschulen, Fachkräfte oder Bildungsqualität reichen nicht
    brauchtBildung:
      zustand === "gesperrt" &&
      v.voraus.every((x) => x.art !== "bestand" || !!s.voraus.find((y) => y.voraus === x)?.erfuellt) &&
      v.voraus.some((x) => x.art === "knoten" && BILDUNG.has(x.id) && !s.voraus.find((y) => y.voraus === x)?.erfuellt),
    vorgaenger: v.voraus.filter((x): x is { art: "bestand"; id: string } => x.art === "bestand" && !!ZWEIG_VON[x.id]).map((x) => x.id),
    lizenzgeber: lizenzgeber(id),
    ...(z.lizenzen[id] ? { lizenz: z.lizenzen[id] } : {}),
    ...(z.traeger[id] ? { traeger: z.traeger[id] } : {}),
    werk: !!WERK_VON[id],
    ...(zustand === "laeuft" ? { tempo: tempoTeile(w, id)! } : {}),
    durchbruch: !!frisch,
    wunder: v.klasse === "wunder",
    ungewiss: !!v.scheitern,
  };
}

/** Der ganze Baum. */
export function baumSicht(w: World): BaumSicht {
  const z = baumZustand(w);
  const zweige = ZWEIGE.map((d) => {
    const knoten = d.knoten.map((id) => knotenSicht(w, id)).filter((k): k is KnotenSicht => !!k);
    return { id: d.id, knoten, fertig: knoten.filter((k) => k.zustand === "fertig").length, schwerpunkt: z.schwerpunkt === d.id };
  });
  const land = landesTempo(w);
  let etat = { budget: 0, grenze: WISSEN.grenzeStart, verpufft: 0 };
  let ueberhang = 0;
  try {
    const budget = forschungsBudget(w);
    const fs = forschungsSicht(w, budget);
    etat = { budget, grenze: fs.grenze, verpufft: fs.verpufft };
    ueberhang = bildungsUeberhang(w);
  } catch {
    /* ohne Haushalt */
  }
  const abwanderung = ueberhang > WISSEN.abwanderungSchwelle;
  const alle = zweige.flatMap((x) => x.knoten);
  const wartenAufBildung = alle.filter((k) => k.brauchtBildung).length;
  const sperre = Math.max(0, z.schwerpunktTag + BAUM.schwerpunktSperre - w.day);
  const gesamt = land.forschung * land.abwanderung;
  const satz =
    etat.verpufft > 0.05
      ? t("wissen.satz.verpufft", { verpufft: Math.round(etat.verpufft * 10) / 10, grenze: Math.round(etat.grenze * 10) / 10 })
      : abwanderung
        ? t("wissen.satz.abwanderung")
        : wartenAufBildung >= 2
          ? t("wissen.satz.bildung", { n: wartenAufBildung })
          : gesamt >= 1.15
            ? t("wissen.satz.schnell", { tempo: Math.round(gesamt * 10) / 10 })
            : gesamt <= 0.85
              ? t("wissen.satz.langsam", { tempo: Math.round(gesamt * 10) / 10 })
              : t("wissen.satz.normal");
  return { zweige, tempo: { ...land, gesamt }, etat, abwanderung, wartenAufBildung, schwerpunkt: z.schwerpunkt, schwerpunktSperre: sperre, satz };
}

// ---------------------------------------------------------------------------
// Entscheidungen

export interface Ergebnis {
  ok: boolean;
  text: string;
}

/** Die Richtung der Forschung festlegen (oder aufheben). */
export function setzeSchwerpunkt(w: World, zweig: ZweigId | null): Ergebnis {
  const sp = w.spiel;
  if (!sp || sp.ende) return { ok: false, text: t("wissen.e.keinSpiel") };
  const z = baumZustand(w);
  if (z.schwerpunkt === zweig) return { ok: false, text: t("wissen.e.schonSchwerpunkt") };
  const rest = z.schwerpunktTag + BAUM.schwerpunktSperre - w.day;
  if (rest > 0) return { ok: false, text: t("wissen.e.sperre", { tage: rest }) };
  if (!kannZahlen(sp.kapital, BAUM.schwerpunktPk)) return { ok: false, text: t("wissen.e.kapital", { pk: BAUM.schwerpunktPk }) };
  sp.kapital -= BAUM.schwerpunktPk;
  z.schwerpunkt = zweig;
  z.schwerpunktTag = w.day;
  const text = zweig ? t("wissen.e.schwerpunkt", { zweig: t(`wissen.z.${zweig}.name`) }) : t("wissen.e.schwerpunktAus");
  addLog(w, "entscheidung", text, t("wissen.e.schwerpunktWarum"));
  return { ok: true, text };
}

export interface BeginnOptionen {
  /** Lizenz statt eigener Forschung */
  lizenz?: Lizenzgeber;
  /** Träger eines Werks; beim ausländischen Träger mit Partner */
  traeger?: Traeger;
  partner?: Lizenzgeber;
}

/** Was eine Wahl zusätzlich kostet (Kapital), und ob sie geht. */
export function beginnPreis(w: World, id: string, o: BeginnOptionen = {}): { pk: number; ok: boolean; grund?: string } {
  const s = vorhabenSicht(w, id);
  if (!s) return { pk: 0, ok: false, grund: t("wissen.e.unbekannt") };
  let pk = vergabeAngebot(s.v, "ausschreibung").pk;
  if (o.lizenz) {
    if (!lizenzgeber(id).includes(o.lizenz)) return { pk, ok: false, grund: t("wissen.e.keineLizenz") };
    if (partnerGesperrt(w, o.lizenz)) return { pk, ok: false, grund: t("wissen.e.partnerGesperrt", { land: t(`wissen.partner.${o.lizenz}`) }) };
    pk += BAUM.lizenzPk;
  }
  if (o.traeger) {
    if (!WERK_VON[id]) return { pk, ok: false, grund: t("wissen.e.keinWerk") };
    if (o.traeger === "ausland") {
      const p = o.partner ?? lizenzgeber(id)[0];
      if (!p) return { pk, ok: false, grund: t("wissen.e.keinPartner") };
      if (partnerGesperrt(w, p)) return { pk, ok: false, grund: t("wissen.e.partnerGesperrt", { land: t(`wissen.partner.${p}`) }) };
    }
    pk += BAUM.traeger[o.traeger].pk;
  }
  if (!kannZahlen(w.spiel!.kapital, pk)) return { pk, ok: false, grund: t("wissen.e.kapital", { pk }) };
  return { pk, ok: true };
}

function rivalenReagieren(w: World, p: Lizenzgeber, grund: string): void {
  beziehungAendern(w, p, { handel: 2, vertrauen: 2 }, grund);
  for (const r of RIVALEN[p]) beziehungAendern(w, r.id, { vertrauen: r.d }, grund);
}

/** Einen Knoten beginnen: selbst forschen, mit Lizenz, und bei Werken mit gewähltem Träger. */
export function beginneKnoten(w: World, id: string, o: BeginnOptionen = {}): Ergebnis {
  const sp = w.spiel;
  if (!sp || sp.ende) return { ok: false, text: t("wissen.e.keinSpiel") };
  const k = knotenSicht(w, id);
  if (!k) return { ok: false, text: t("wissen.e.unbekannt") };
  if (k.zustand !== "moeglich") return { ok: false, text: k.grund ?? t("wissen.e.nichtMoeglich") };
  const preis = beginnPreis(w, id, o);
  if (!preis.ok) return { ok: false, text: preis.grund ?? "" };
  const extra = preis.pk - k.pk;
  const r = beginne(w, id, "ausschreibung");
  if (!r.ok) return { ok: false, text: k.grund ?? t("wissen.e.nichtMoeglich") };
  sp.kapital -= extra;
  const z = baumZustand(w);
  const name = knotenName(id);
  if (o.lizenz) {
    z.lizenzen[id] = o.lizenz;
    rivalenReagieren(w, o.lizenz, t("wissen.e.lizenzGrund", { name }));
    if (k.zweig === "ruestung") wirke(w, "ruestungsautarkie", -1);
  }
  if (o.traeger && WERK_VON[id]) {
    const partner = o.traeger === "ausland" ? (o.partner ?? lizenzgeber(id)[0]) : undefined;
    z.traeger[id] = { art: o.traeger, ...(partner ? { partner } : {}) };
    if (o.traeger === "firma") {
      wirke(w, "unternehmer", 1.5);
      wirke(w, "korruption", 0.4);
    } else if (o.traeger === "ausland" && partner) {
      wirke(w, "auslandskapital", 2);
      beziehungAendern(w, partner, { handel: 2 }, t("wissen.e.partnerGrund", { name }));
    }
  }
  const weg = o.lizenz ? t("wissen.e.weg.lizenz", { land: t(`wissen.partner.${o.lizenz}`) }) : t("wissen.e.weg.selbst");
  const traeger = o.traeger ? ` ${t(`wissen.traeger.${o.traeger}.kurz`)}.` : "";
  const text = t("wissen.e.begonnen", { name, weg, monate: k.monate }) + traeger;
  addLog(w, "entscheidung", text, o.lizenz ? t("wissen.e.lizenzWarum") : t("wissen.e.selbstWarum"));
  return { ok: true, text };
}

/** Für einen laufenden Knoten eine Lizenz nachkaufen (beschleunigt den Rest). */
export function kaufeLizenz(w: World, id: string, p: Lizenzgeber): Ergebnis {
  const sp = w.spiel;
  if (!sp || sp.ende) return { ok: false, text: t("wissen.e.keinSpiel") };
  const k = knotenSicht(w, id);
  if (!k || k.zustand !== "laeuft") return { ok: false, text: t("wissen.e.nichtLaufend") };
  if (k.lizenz) return { ok: false, text: t("wissen.e.schonLizenz") };
  if (!k.lizenzgeber.includes(p)) return { ok: false, text: t("wissen.e.keineLizenz") };
  if (partnerGesperrt(w, p)) return { ok: false, text: t("wissen.e.partnerGesperrt", { land: t(`wissen.partner.${p}`) }) };
  if (!kannZahlen(sp.kapital, BAUM.lizenzPk)) return { ok: false, text: t("wissen.e.kapital", { pk: BAUM.lizenzPk }) };
  sp.kapital -= BAUM.lizenzPk;
  const z = baumZustand(w);
  z.lizenzen[id] = p;
  const name = knotenName(id);
  rivalenReagieren(w, p, t("wissen.e.lizenzGrund", { name }));
  if (k.zweig === "ruestung") wirke(w, "ruestungsautarkie", -1);
  const text = t("wissen.e.lizenzGekauft", { name, land: t(`wissen.partner.${p}`) });
  addLog(w, "entscheidung", text, t("wissen.e.lizenzWarum"));
  return { ok: true, text };
}

// ---------------------------------------------------------------------------
// Monatsschritt: Durchbrüche verbuchen, Sperren der Partner melden

const ELEKTRONIK_GATTUNGEN = new Set<GattungId>(["drohnen", "raketen", "luftabwehr"]);

/**
 * Fertigungstempo der Streitkräfte aus Gütern und Werken (1 = Stand 2026): Eigene Chips beschleunigen Drohnen, Raketen und Luftabwehr,
 * eigene Triebwerke die Kampfflugzeuge. Spielparameter.
 */
export function militaerGueterFaktor(w: World, gattung: GattungId): number {
  if (!w.spiel?.reich) return 1;
  let f = 1;
  if (ELEKTRONIK_GATTUNGEN.has(gattung)) f += 0.25 * Math.min(1, werkZusatz(w, "elektronik") / 0.75);
  if (gattung === "kampfflugzeuge") f += 0.2 * Math.max(werkErtrag(w, "luft_triebwerke"), werkErtrag(w, "mil_kaan_motor"));
  return f;
}
setzeGueterQuelle(militaerGueterFaktor);

/** Ein Partner sperrt bei Krieg mit der Türkei, bei Sanktionen gegen sie oder wenn das Vertrauen unter die Schwelle fällt. */
function sperrt(w: World, p: Lizenzgeber): boolean {
  try {
    if (aktiveKriege(w).some((k) => k.land === p && (k.phase === "krieg" || k.phase === "waffenruhe"))) return true;
    if (aussenZustand(w).sanktionen.some((s) => s.von === p)) return true;
    return beziehungZurTuerkei(w, p).vertrauen < BAUM.partnerVertrauenMin;
  } catch {
    return false;
  }
}
setzeSperrQuelle(sperrt);

export function wissensbaumMonat(w: World): void {
  const sp = w.spiel;
  if (!sp || sp.ende) return;
  const bestand = reichZustand(w).bestand;
  const z = baumZustand(w);
  for (const d of ZWEIGE)
    for (const id of d.knoten) {
      if (!bestand[id] || z.verbucht.includes(id)) continue;
      z.verbucht.push(id);
      z.durchbrueche.push({ id, tag: w.day });
      const werk = WERK_VON[id];
      if (werk?.militaer?.length) {
        const sk = streitkraefte(w);
        const tr = z.traeger[id]?.art ?? "staat";
        const plus = BAUM.traeger[tr].generation * (z.lizenzen[id] ? 0.5 : 1);
        for (const g of werk.militaer) {
          const s = sk.gattungen[g];
          if (s) s.heimGeneration = Math.min(5, Math.round((s.heimGeneration + plus) * 100) / 100);
        }
      }
      addLog(w, "ereignis", t("wissen.durchbruch.log", { name: knotenName(id) }), werk ? t("wissen.durchbruch.werk") : t("wissen.durchbruch.wissen"));
    }
  z.durchbrueche = z.durchbrueche.filter((x) => w.day - x.tag <= BAUM.durchbruchTage);
  // Sperrt ein Lizenzgeber oder Partner, meldet die Akte es einmal; hebt er die Sperre auf, darf es wieder gemeldet werden
  const partner = new Set<Lizenzgeber>([...Object.values(z.lizenzen), ...Object.values(z.traeger).flatMap((x) => (x.partner ? [x.partner] : []))]);
  for (const p of partner) {
    const gesperrt = partnerGesperrt(w, p);
    if (gesperrt && !z.gemeldet.includes(p)) {
      z.gemeldet.push(p);
      addLog(w, "ereignis", t("wissen.sperre.log", { land: t(`wissen.partner.${p}`) }), t("wissen.sperre.warum"));
    } else if (!gesperrt && z.gemeldet.includes(p)) z.gemeldet = z.gemeldet.filter((x) => x !== p);
  }
}

// ---------------------------------------------------------------------------
// Für den Bot im Mess-Tor und für Tests: der nächste sinnvolle Schritt

/** Der günstigste mögliche Knoten (zuerst im Schwerpunkt), wenn Kapital und Verwaltung reichen. */
export function naechsterKnoten(w: World): KnotenSicht | null {
  if (!w.spiel) return null;
  if (verwaltungBilanz(w).netto < 0) return null;
  const s = baumSicht(w);
  const moeglich = s.zweige.flatMap((z) => z.knoten).filter((k) => k.zustand === "moeglich" && !k.grund && !k.wunder);
  moeglich.sort((a, b) => Number(b.zweig === s.schwerpunkt) - Number(a.zweig === s.schwerpunkt) || a.pk - b.pk);
  return moeglich[0] ?? null;
}


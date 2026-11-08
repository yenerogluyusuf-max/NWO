// Sicht auf den Machtkreis für die Kartenansicht (Welle M1, 8. November 2026).
//
// Die Frage des Bereichs: „Wer kann mir die Macht nehmen, und was zahle ich, damit es nicht geschieht?“ (machtkreis_dienst.md, 3.1).
// Darum zeigt die Ansicht drei Kennzahlen (Nachfolgedruck mit Parteitag, Fraktionsdisziplin in Stimmen, Gefahren) und 3 bis 5 Personen:
// Kronprinz, Fraktionschef, Bündnispartner und bis zu zwei Minister, von denen gerade Gefahr ausgeht. Jede Handlung nennt ihren Preis und
// ihre Wirkung in Zahlen, gerechnet aus denselben Konstanten, die `zieheHebel` bucht (HEBEL_WIRKUNG, disziplinAus, abspaltungGroesse).

import { t, zahl as zahlFmt } from "../i18n";
import { eigenVon } from "./personen";
import {
  DISZIPLIN_OHNE,
  HEBEL_WIRKUNG,
  NACHFOLGE_STUFEN,
  dienstKapazitaet,
  disziplinAus,
  disziplinStimmen,
  geheimnisVon,
  hebelFuer,
  machtkreis,
  nebenVon,
  parteitagTermin,
  personen,
  wechselKandidat,
  type Hebel,
  type Person,
} from "./machtkreis";
import { ABSPALTUNG, abspaltungGroesse, brichtMitWerten, drohendeAbspaltung, gegruendeteAbspaltung } from "./abspaltung";
import type { World } from "./types";

const zahl = (x: number): string => `${x > 0 ? "+" : x < 0 ? "−" : ""}${zahlFmt(Math.abs(x), Number.isInteger(x) ? 0 : 1)}`;
const klemme = (x: number): number => Math.min(100, Math.max(0, x));

export type KartenGrund = "kronprinz" | "fraktionschef" | "partner" | "wechsel" | "geheimnis" | "unzufrieden";

export interface KreisHandlung {
  id: string;
  /** Hebel des Kreises (sim/machtkreis.ts) oder ein Sprung ins Kabinett */
  hebel?: Hebel;
  sprung?: "gespraech" | "entlassen";
  pk?: number;
  /** Wirkung in Zahlen, aus denselben Konstanten, die gebucht werden */
  zahlen: string;
  moeglich: boolean;
  grund?: string;
}

export interface KreisKarte {
  person: Person;
  grund: KartenGrund;
  handlungen: KreisHandlung[];
}

/** Wirkungszeile eines Hebels für eine Person, aus HEBEL_WIRKUNG gerechnet. */
function hebelZahlen(w: World, p: Person, h: Hebel): string {
  const mk = machtkreis(w);
  const druck = Math.round(mk.nachfolge);
  if (h === "untersuchung") {
    const kap = dienstKapazitaet(w);
    return t("welle_m1.kreis.zahlen.untersuchung", { kap: HEBEL_WIRKUNG.untersuchung.kapazitaet, frei: kap === undefined ? "–" : Math.round(kap) });
  }
  if (p.rolle === "kronprinz") {
    if (h === "befoerdern") {
      const q = HEBEL_WIRKUNG.befoerdern;
      return t("welle_m1.kreis.zahlen.kp_befoerdern", { loy: zahl(q.loyalitaet), einfluss: zahl(q.einfluss), vorher: druck, nachher: Math.round(klemme(druck + q.kronprinzDruck)) });
    }
    if (h === "deal") {
      const q = HEBEL_WIRKUNG.deal;
      return t("welle_m1.kreis.zahlen.kp_deal", { loy: zahl(q.loyalitaet), vorher: druck, nachher: Math.round(klemme(druck + q.kronprinzDruck)) });
    }
    if (h === "kaltstellen") {
      const q = HEBEL_WIRKUNG.kaltstellen;
      // Groll senkt bei Nebenfiguren die Loyalität (sim/machtkreis.ts, aendereGroll: 0,3 je Punkt)
      const loyNach = klemme(p.loyalitaet + q.loyalitaet - q.groll * 0.3);
      const ehrNach = klemme(p.ehrgeiz + q.ehrgeiz);
      const basis = t("welle_m1.kreis.zahlen.kp_kalt", { vorher: druck, nachher: Math.round(klemme(druck + q.kronprinzDruck)), loy: zahl(q.loyalitaet) });
      if (!brichtMitWerten(ehrNach, loyNach)) return `${basis} ${t("welle_m1.kreis.zahlen.kp_kalt_bleibt")}`;
      const g = abspaltungGroesse(Math.round(klemme((p.neben?.einfluss ?? 50) + q.einfluss)));
      return `${basis} ${t("welle_m1.kreis.zahlen.kp_kalt_bruch", { monate: Math.round(ABSPALTUNG.frist / 30), anteil: g.anteil, n: g.abgeordnete })}`;
    }
  }
  if (p.rolle === "fraktionschef" && p.neben) {
    // Weniger Groll hebt bei Nebenfiguren die Loyalität um 0,3 je Punkt (sim/machtkreis.ts, aendereGroll)
    const jetzt = disziplinStimmen(w);
    if (h === "befoerdern") {
      const q = HEBEL_WIRKUNG.befoerdern;
      return t("welle_m1.kreis.zahlen.fc", { loy: zahl(q.loyalitaet), vorher: zahl(jetzt), nachher: zahl(disziplinAus(p.loyalitaet + q.loyalitaet - q.groll * 0.3, p.kompetenz)) });
    }
    if (h === "deal") {
      const q = HEBEL_WIRKUNG.deal;
      return t("welle_m1.kreis.zahlen.fc", { loy: zahl(q.loyalitaet), vorher: zahl(jetzt), nachher: zahl(disziplinAus(p.loyalitaet + q.loyalitaet - q.groll * 0.3, p.kompetenz)) });
    }
    if (h === "kaltstellen") return t("welle_m1.kreis.zahlen.fc_kalt", { vorher: zahl(jetzt), nachher: zahl(DISZIPLIN_OHNE) });
  }
  if (h === "deal") {
    const q = HEBEL_WIRKUNG.deal;
    return t("welle_m1.kreis.zahlen.deal", { loy: zahl(q.loyalitaet), groll: zahl(q.groll) });
  }
  if (h === "befoerdern") {
    const q = HEBEL_WIRKUNG.befoerdern;
    return t("welle_m1.kreis.zahlen.befoerdern", { loy: zahl(q.loyalitaet), einfluss: zahl(q.einfluss) });
  }
  if (h === "kaltstellen") {
    const q = HEBEL_WIRKUNG.kaltstellen;
    return t("welle_m1.kreis.zahlen.kalt", { loy: zahl(q.loyalitaet), groll: zahl(q.groll) });
  }
  return "";
}

function hebelHandlung(w: World, p: Person, h: Hebel): KreisHandlung | undefined {
  const s = hebelFuer(w, p.schluessel).find((x) => x.hebel === h);
  if (!s) return undefined;
  return { id: h, hebel: h, pk: s.pk, zahlen: hebelZahlen(w, p, h), moeglich: s.moeglich, ...(s.grund ? { grund: s.grund } : {}) };
}

const ist = <T,>(x: T | undefined): x is T => x !== undefined;

/** Die 3 bis 5 Personen der Kartenansicht, in fester Reihenfolge: Kronprinz, Fraktionschef, Bündnispartner, dann wer gefährlich ist. */
export function kreisKarten(w: World): KreisKarte[] {
  const alle = personen(w);
  const karten: KreisKarte[] = [];
  const kp = alle.find((p) => p.rolle === "kronprinz");
  if (kp) karten.push({ person: kp, grund: "kronprinz", handlungen: (["befoerdern", "deal", "kaltstellen"] as Hebel[]).map((h) => hebelHandlung(w, kp, h)).filter(ist) });
  const fc = alle.find((p) => p.rolle === "fraktionschef");
  if (fc) karten.push({ person: fc, grund: "fraktionschef", handlungen: (["befoerdern", "deal", "untersuchung"] as Hebel[]).map((h) => hebelHandlung(w, fc, h)).filter(ist) });
  const partner = alle.find((p) => p.rolle === "partner");
  if (partner) karten.push({ person: partner, grund: "partner", handlungen: (["deal", "untersuchung"] as Hebel[]).map((h) => hebelHandlung(w, partner, h)).filter(ist) });
  // Bis zu zwei Minister, von denen Gefahr ausgeht: wer überlaufen könnte, wessen Geheimnis bekannt ist, wer kaum noch loyal ist
  const wechsel = wechselKandidat(w);
  const minister = alle.filter((p) => p.art === "amt" && p.figur && p.rolle !== "partner" && p.rolle !== "opposition" && p.rolle !== "zentralbank");
  const gewicht = (p: Person): { g: number; grund: KartenGrund } | undefined => {
    if (p.schluessel === wechsel?.schluessel) return { g: 300, grund: "wechsel" };
    const gh = geheimnisVon(w, p.schluessel);
    if (gh?.aufgedeckt && !gh.oeffentlich) return { g: 200 + gh.schwere * 10, grund: "geheimnis" };
    if (p.loyalitaet < 30) return { g: 100 + (30 - p.loyalitaet), grund: "unzufrieden" };
    return undefined;
  };
  const gefahr = minister
    .map((p) => ({ p, x: gewicht(p) }))
    .filter((y): y is { p: Person; x: { g: number; grund: KartenGrund } } => !!y.x)
    .sort((a, b) => b.x.g - a.x.g || a.p.loyalitaet - b.p.loyalitaet)
    .slice(0, 2);
  for (const { p, x } of gefahr) {
    const pruefen = hebelHandlung(w, p, "untersuchung");
    karten.push({
      person: p,
      grund: x.grund,
      handlungen: [
        { id: "gespraech", sprung: "gespraech", zahlen: t("welle_m1.kreis.zahlen.gespraech"), moeglich: true },
        ...(eigenVon(w, p.figur!).kommissarisch ? [] : [{ id: "entlassen", sprung: "entlassen" as const, zahlen: t("welle_m1.kreis.zahlen.entlassen"), moeglich: true }]),
        ...(pruefen ? [pruefen] : []),
      ],
    });
  }
  return karten;
}

export interface Gefahr {
  art: "parteitag" | "abspaltung" | "partei" | "wechsel" | "putsch" | "partner";
  text: string;
  ton: "schlecht" | "mittel";
}

/** Was dem Präsidenten gerade die Macht nehmen kann, mit Zahl und Frist. */
export function kreisGefahren(w: World): Gefahr[] {
  const sp = w.spiel;
  if (!sp) return [];
  const mk = machtkreis(w);
  const out: Gefahr[] = [];
  const kp = nebenVon(w, "kronprinz");
  if (kp?.status === "aktiv" && mk.nachfolge >= NACHFOLGE_STUFEN.kampfAb) {
    const termin = parteitagTermin(w);
    out.push({ art: "parteitag", ton: "schlecht", text: t("welle_m1.gefahr.parteitag", { name: kp.name, tage: Math.max(0, termin.tag - w.day) }) });
  }
  const droht = drohendeAbspaltung(w);
  if (droht) out.push({ art: "abspaltung", ton: "schlecht", text: t("welle_m1.gefahr.abspaltung", { name: droht.gruender, tage: Math.max(0, droht.gruendung - w.day) }) });
  const partei = gegruendeteAbspaltung(w);
  if (partei) out.push({ art: "partei", ton: "mittel", text: t("welle_m1.gefahr.partei", { partei: t("welle_m1.abspaltung.partei"), anteil: partei.anteil ?? 0, n: w.parliament?.seats[partei.partei] ?? 0 }) });
  const wechsel = wechselKandidat(w);
  if (wechsel) out.push({ art: "wechsel", ton: "schlecht", text: t("welle_m1.gefahr.wechsel", { name: wechsel.name, loy: Math.round(wechsel.loyalitaet) }) });
  const putsch = sp.enden?.putsch;
  if (putsch && putsch.stufe >= 1) out.push({ art: "putsch", ton: putsch.stufe >= 2 ? "schlecht" : "mittel", text: t("welle_m1.gefahr.putsch", { stufe: putsch.stufe, risiko: Math.round(putsch.risiko) }) });
  const partner = personen(w).find((p) => p.rolle === "partner");
  if (partner && partner.loyalitaet < 30) out.push({ art: "partner", ton: "mittel", text: t("welle_m1.gefahr.partner", { name: partner.name, loy: Math.round(partner.loyalitaet) }) });
  return out;
}

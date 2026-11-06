// Gemeinsame Zusagenregeln für Beschlüsse und direkte Erfüllung. Keine Abhängigkeit von der Gesetzesabwicklung.
import { clamp } from "./economy";
import { wirke } from "./wirkung";
import { bereitschaftAendern } from "./fraktionen";
import { LAENDER, landAendern } from "./laender";
import { loyalitaetVerschieben, merke } from "./personen";
import { aktiveParteivorsitzende } from "./koalitionslage";
import { skala, skalenArt } from "../data/skalen";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import type { World } from "./types";
import { rendere, t } from "../i18n";
import type { Zusage } from "./spiel-typen";
// Text der Zusage in der Sprache des Spiels (wie zusageText in sim/zusagen.ts; kein Import dorthin, sonst entsteht ein Ladezyklus)
const zusageText = (z: Pick<Zusage, "text" | "msg">): string => (z.msg ? rendere(z.msg) : z.text);

/** Ein festgelegtes Ziel wandert bei späteren Teilfortschritten nicht weiter. */
export function zusageZiel(z: Pick<Zusage, "massnahme" | "richtung" | "stufeStart" | "stufeZiel">, jetzt: number): number {
  if (z.stufeZiel !== undefined) return z.stufeZiel;
  // Auch ein bekannter Ausgangsstand alter Zusagen bleibt verbindlich.
  jetzt = z.stufeStart ?? jetzt;
  const richtung = z.richtung ?? 1;
  if (z.massnahme && skalenArt(z.massnahme) === "regime") {
    const stufen = skala(z.massnahme, jetzt).stufen;
    const heute = stufen.reduce((b, st) => Math.abs(st.w - jetzt) < Math.abs(b.w - jetzt) ? st : b, stufen[0]!);
    const weiter = stufen.filter(st => richtung > 0 ? st.w > heute.w + 3 : st.w < heute.w - 3);
    const naechste = richtung > 0 ? weiter[0] : weiter[weiter.length - 1];
    if (naechste) return naechste.w;
  }
  return clamp(Math.round(jetzt + 20 * richtung), 0, 100);
}

/** Gemeinsame Zielberechnung für Angebot, Abschluss und Ergänzung alter Spielstände. Nur lesend. */
export function zusageStufen(w: World, z: Pick<Zusage, "massnahme" | "richtung" | "stufeStart" | "stufeZiel">) {
  if (!z.massnahme || !z.richtung || !NET.index.has(z.massnahme)) return undefined;
  const stufeStart = z.stufeStart ?? nationalAverage(NET, w.net, z.massnahme);
  return { stufeStart, stufeZiel: zusageZiel(z, stufeStart) };
}

/** Neue Zusagen erhalten ihre Messlatte beim Vereinbaren, nicht beim ersten Öffnen einer Ansicht. */
export function festeZusage(w: World, z: Zusage): Zusage {
  return { ...z, ...zusageStufen(w, z) };
}

export function zusageZielErreicht(z: Pick<Zusage, "richtung" | "stufeZiel">, stufe: number): boolean {
  return z.stufeZiel !== undefined && !!z.richtung && (stufe - z.stufeZiel) * Math.sign(z.richtung) >= -1e-6;
}

export interface ZusageBezug {
  art: "person" | "fraktion" | "land" | "sonst";
  /** Figur-Kennung, Parteikürzel oder Land-Kennung */
  id?: string;
  name: string;
}

const LAND_ALIAS: Record<string, string> = { "EU-Kommission": "EU", "US-Regierung": "USA" };

export function zusageBezug(w: World, z: Zusage): ZusageBezug {
  const vorsitz=aktiveParteivorsitzende(w,z.von);
  if (vorsitz.length) return { art: "person", id: vorsitz[0]!.id, name: vorsitz.map(f=>f.name).join(", ") };
  if (w.parliament?.seats[z.von] !== undefined) return { art: "fraktion", id: z.von, name: z.von };
  const alias = LAND_ALIAS[z.von];
  const l = LAENDER.find((x) => x.id === alias || x.name === z.von || x.dat === z.von || x.akk === z.von || z.von.includes(x.name));
  if (l) return { art: "land", id: l.id, name: l.name };
  return { art: "sonst", name: z.von };
}

/** Die Folgen einer erfüllten oder gebrochenen Zusage über die Akteure hinaus: Glaubwürdigkeit, Land, Erinnerung. Nur einmal je Zusage. */
export function zusageAbschluss(w: World, z: Zusage, art: "erfuellt" | "gebrochen"): void {
  if (z.abgeschlossen !== undefined) return;
  z.abgeschlossen = w.day;
  const bezug = zusageBezug(w, z);
  if (art === "erfuellt") {
    wirke(w, "legitimitaet", 0.6);
    wirke(w, "vertrauen_regierung", 0.3);
    if (bezug.art === "land") landAendern(w, bezug.id!, { vertrauen: 6 }, t("tag_t8.zusage.gehalten", { text: zusageText(z) }));
  } else {
    wirke(w, "legitimitaet", -1.2);
    wirke(w, "vertrauen_regierung", -0.6);
    if (bezug.art === "land") landAendern(w, bezug.id!, { vertrauen: -12, konflikt: 4 }, t("tag_t8.zusage.gebrochen", { text: zusageText(z) }));
  }
  for(const f of aktiveParteivorsitzende(w,z.von)) merke(w, f, t(art === "erfuellt" ? "tag_t8.zusage.gehalten" : "tag_t8.zusage.gebrochen", { text: zusageText(z) }));
}

/** Neue Erfüllung: persönliche und politische Anerkennung einmalig beim erreichten Beschlussziel buchen.
 * Bereits erledigte Altstände werden hier nicht erneut belohnt; zusageAbschluss ergänzt nur fehlende allgemeine Folgen. */
export function erfuelleZusage(w: World, z: Zusage): boolean {
  if (z.erfuellt || z.gebrochen || z.abgeschlossen !== undefined) return false;
  z.erfuellt = true;
  schliesseZusageErinnerung(w, z);
  bereitschaftAendern(w, z.von, 10);
  for (const f of aktiveParteivorsitzende(w, z.von)) loyalitaetVerschieben(f, 12);
  zusageAbschluss(w, z, "erfuellt");
  return true;
}

/** Direkte Bearbeitung erledigt nur die Erinnerung an diese Zusage. Andere Ereignisse bleiben offen. */
export function schliesseZusageErinnerung(w: World, z: Zusage): void {
  if (w.spiel) w.spiel.ereignisse = w.spiel.ereignisse.filter(e => e.vorlage !== "zusage" || e.daten?.zusage !== z.id);
}

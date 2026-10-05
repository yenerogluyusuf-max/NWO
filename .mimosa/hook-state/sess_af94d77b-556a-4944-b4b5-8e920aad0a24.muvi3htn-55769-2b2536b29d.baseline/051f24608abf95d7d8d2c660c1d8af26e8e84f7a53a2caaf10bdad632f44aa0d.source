// Die Biografie wirkt: Beruf, Jugend, Motiv und Partner aus dem Prolog sind keine Anzeige, sondern verschieben Figuren, Gegner und Kapital
// (jedes Merkmal hat einen Vorteil und einen Preis); die Wahlnacht ebenso. Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung).
// Die Merkmale werden aus den Texten des Profils abgeleitet, damit auch Spielstände und Testprofile ohne neue Felder funktionieren.

import { NET } from "./modell";
import { PROVINCES } from "./netz";
import { eigenVon } from "./personen";
import { figur, figurLoyalitaetAendern } from "./figuren";
import { clamp } from "./economy";
import type { PlayerProfile } from "./prolog";
import type { Figur } from "./spiel-typen";
import type { World } from "./types";

export type Wirkung =
  | { art: "faehigkeit"; amt: Figur["amt"]; delta: number }
  | { art: "ehrgeiz"; amt: Figur["amt"]; delta: number }
  | { art: "loyalitaet"; amt: Figur["amt"]; delta: number }
  /** Alle Mitglieder der Regierung (Ministerämter) */
  | { art: "kabinettLoyalitaet"; delta: number }
  | { art: "kabinettEhrgeiz"; delta: number }
  | { art: "partnerLoyalitaet"; delta: number }
  | { art: "kapital"; delta: number }
  /** Verschiebt eine Größe des Politiknetzes (Provinzwerte, klingt mit der Zeit ab) */
  | { art: "knoten"; id: string; delta: number };

export interface Folge {
  /** Katalogschlüssel der Merkmalsgruppe, z. B. `anwalt` → `biografie.anwalt.vorteil` und `.preis` */
  id: string;
  vorteil: Wirkung[];
  preis: Wirkung[];
}

const F = (id: string, vorteil: Wirkung[], preis: Wirkung[]): Folge => ({ id, vorteil, preis });

/** Merkmale und ihre Folgen (Vorteil und Preis); Texte im Katalog unter `biografie.<id>.vorteil` und `biografie.<id>.preis`. */
export const FOLGEN: Record<string, Folge> = {
  // Beruf
  anwalt: F("anwalt", [{ art: "faehigkeit", amt: "justiz", delta: 10 }, { art: "kapital", delta: 3 }], [{ art: "ehrgeiz", amt: "opposition", delta: 5 }]),
  arzt: F("arzt", [{ art: "loyalitaet", amt: "stab", delta: 6 }], [{ art: "faehigkeit", amt: "finanzen", delta: -6 }]),
  unternehmer: F("unternehmer", [{ art: "faehigkeit", amt: "wirtschaft", delta: 10 }], [{ art: "ehrgeiz", amt: "opposition", delta: 5 }, { art: "knoten", id: "vertrauen_regierung", delta: -1 }]),
  oekonom: F("oekonom", [{ art: "faehigkeit", amt: "finanzen", delta: 10 }, { art: "loyalitaet", amt: "zentralbank", delta: 5 }], [{ art: "knoten", id: "arbeitnehmer", delta: -1 }]),
  // Jugend
  studentenbewegung: F("studentenbewegung", [{ art: "knoten", id: "junge", delta: 1 }], [{ art: "loyalitaet", amt: "generalstab", delta: -8 }, { art: "loyalitaet", amt: "inneres", delta: -3 }]),
  familienbetrieb: F("familienbetrieb", [{ art: "loyalitaet", amt: "wirtschaft", delta: 5 }], [{ art: "knoten", id: "arbeitnehmer", delta: -1 }]),
  moscheegemeinde: F("moscheegemeinde", [{ art: "partnerLoyalitaet", delta: 3 }], [{ art: "knoten", id: "staedtische_saekulare", delta: -2 }, { art: "loyalitaet", amt: "generalstab", delta: -3 }]),
  sportverein: F("sportverein", [{ art: "kabinettLoyalitaet", delta: 3 }], [{ art: "kabinettEhrgeiz", delta: 3 }]),
  // Motiv
  unglueck: F("unglueck", [{ art: "knoten", id: "rentner", delta: 1 }], [{ art: "loyalitaet", amt: "wirtschaft", delta: -3 }]),
  korruption: F("korruption", [{ art: "knoten", id: "legitimitaet", delta: 3 }], [{ art: "partnerLoyalitaet", delta: -4 }]),
  mentor: F("mentor", [{ art: "kapital", delta: 4 }], [{ art: "ehrgeiz", amt: "opposition", delta: 6 }]),
  ehrgeiz: F("ehrgeiz", [{ art: "kapital", delta: 6 }], [{ art: "loyalitaet", amt: "stab", delta: -5 }, { art: "kabinettEhrgeiz", delta: 3 }]),
  // Partner
  richterin: F("richterin", [{ art: "loyalitaet", amt: "justiz", delta: 4 }], [{ art: "knoten", id: "polarisierung", delta: 1 }]),
  bauunternehmer: F("bauunternehmer", [{ art: "loyalitaet", amt: "wirtschaft", delta: 4 }, { art: "kapital", delta: 3 }], [{ art: "ehrgeiz", amt: "opposition", delta: 3 }]),
  journalistin: F("journalistin", [{ art: "knoten", id: "legitimitaet", delta: 1 }], [{ art: "loyalitaet", amt: "inneres", delta: -3 }]),
  krankenpfleger: F("krankenpfleger", [{ art: "loyalitaet", amt: "stab", delta: 3 }], [{ art: "faehigkeit", amt: "wirtschaft", delta: -3 }]),
  // Wahlnacht (Vorteil und Preis je Ausgang; keine Antwort ist strikt besser)
  "wahl:knapp": F("wahl_knapp", [{ art: "partnerLoyalitaet", delta: 6 }, { art: "kapital", delta: 8 }], [{ art: "knoten", id: "legitimitaet", delta: -4 }, { art: "knoten", id: "polarisierung", delta: 4 }]),
  "wahl:klar": F("wahl_klar", [{ art: "knoten", id: "legitimitaet", delta: 3 }, { art: "knoten", id: "polarisierung", delta: -1 }], [{ art: "partnerLoyalitaet", delta: -5 }]),
  "wahl:erste": F("wahl_erste", [{ art: "kapital", delta: 10 }, { art: "knoten", id: "legitimitaet", delta: 4 }], [{ art: "kabinettEhrgeiz", delta: 4 }, { art: "ehrgeiz", amt: "opposition", delta: 4 }]),
};

const hat = (s: string, ...woerter: string[]): boolean => woerter.some((w) => s.toLowerCase().startsWith(w.toLowerCase()));

/** Merkmale aus den Texten des Profils (ältere Profile und Testprofile funktionieren so ohne neue Felder). */
export function merkmaleVon(p: Pick<PlayerProfile, "beruf" | "jugend" | "motiv" | "partner"> & { wahlStil?: "knapp" | "klar" | "erste" }): string[] {
  const out: string[] = [];
  const beruf = p.beruf ?? "";
  if (hat(beruf, "Anwalt")) out.push("anwalt");
  else if (hat(beruf, "Arzt")) out.push("arzt");
  else if (hat(beruf, "Unternehmer")) out.push("unternehmer");
  else if (hat(beruf, "Ökonom")) out.push("oekonom");
  const jugend = p.jugend ?? "";
  if (hat(jugend, "Studentenbewegung")) out.push("studentenbewegung");
  else if (hat(jugend, "Familienbetrieb")) out.push("familienbetrieb");
  else if (hat(jugend, "Moscheegemeinde")) out.push("moscheegemeinde");
  else if (hat(jugend, "Sportverein")) out.push("sportverein");
  const motiv = p.motiv ?? "";
  if (hat(motiv, "Unglück")) out.push("unglueck");
  else if (hat(motiv, "Korruption")) out.push("korruption");
  else if (hat(motiv, "Mentor")) out.push("mentor");
  else if (hat(motiv, "Ehrgeiz")) out.push("ehrgeiz");
  const partner = p.partner ?? "";
  if (hat(partner, "Richterin")) out.push("richterin");
  else if (hat(partner, "Bauunternehmer")) out.push("bauunternehmer");
  else if (hat(partner, "Journalistin")) out.push("journalistin");
  else if (hat(partner, "Krankenpfleger")) out.push("krankenpfleger");
  if (p.wahlStil) out.push(`wahl:${p.wahlStil}`);
  return out;
}

const MINISTER: Figur["amt"][] = ["finanzen", "inneres", "aussen", "stab", "justiz", "generalstab", "wirtschaft"];

function setzeKnoten(world: World, id: string, delta: number): void {
  const i = NET.index.get(id);
  if (i === undefined) return;
  for (let p = 0; p < PROVINCES; p++) {
    const k = i * PROVINCES + p;
    world.net.values[k] = clamp(world.net.values[k]!, 0, 100) + delta;
    world.net.values[k] = clamp(world.net.values[k]!, 0, 100);
  }
}

function wende(world: World, w: Wirkung): void {
  const sp = world.spiel;
  if (!sp) return;
  switch (w.art) {
    case "faehigkeit": {
      const f = figur(world, w.amt);
      if (f) eigenVon(world, f).faehigkeit = clamp(eigenVon(world, f).faehigkeit + w.delta, 0, 100);
      break;
    }
    case "ehrgeiz": {
      const f = figur(world, w.amt);
      if (f) eigenVon(world, f).ehrgeiz = clamp(eigenVon(world, f).ehrgeiz + w.delta, 0, 100);
      break;
    }
    case "loyalitaet":
      figurLoyalitaetAendern(world, figur(world, w.amt), w.delta);
      break;
    case "kabinettLoyalitaet":
      for (const amt of MINISTER) figurLoyalitaetAendern(world, figur(world, amt), w.delta);
      break;
    case "kabinettEhrgeiz":
      for (const amt of MINISTER) {
        const f = figur(world, amt);
        if (f) eigenVon(world, f).ehrgeiz = clamp(eigenVon(world, f).ehrgeiz + w.delta, 0, 100);
      }
      break;
    case "partnerLoyalitaet":
      for (const f of sp.figuren) if (f.amt === "partner") figurLoyalitaetAendern(world, f, w.delta);
      break;
    case "kapital":
      sp.kapital = clamp(sp.kapital + w.delta, -20, 150);
      break;
    case "knoten":
      setzeKnoten(world, w.id, w.delta);
      break;
  }
}

/** Wendet Vorteile und Preise aller Merkmale an (nach `initSpiel`: Figuren und Kapital müssen schon da sein). Liefert die angewendeten Merkmale. */
export function wendeBiografieAn(world: World, p: Pick<PlayerProfile, "beruf" | "jugend" | "motiv" | "partner"> & { wahlStil?: "knapp" | "klar" | "erste" }): string[] {
  const merkmale = merkmaleVon(p).filter((m) => FOLGEN[m]);
  for (const m of merkmale) {
    const folge = FOLGEN[m]!;
    for (const w of [...folge.vorteil, ...folge.preis]) wende(world, w);
  }
  return merkmale;
}

/** Für die Zusammenfassung im Prolog: Merkmale mit ihren Katalogschlüsseln für Vorteil und Preis. */
export function biografieFolgen(p: Pick<PlayerProfile, "beruf" | "jugend" | "motiv" | "partner"> & { wahlStil?: "knapp" | "klar" | "erste" }): { merkmal: string; id: string }[] {
  return merkmaleVon(p)
    .filter((m) => FOLGEN[m])
    .map((m) => ({ merkmal: m, id: FOLGEN[m]!.id }));
}

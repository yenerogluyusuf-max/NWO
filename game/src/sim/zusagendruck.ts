// Nur bekannte offene Erinnerungen: bedingte Summe bis zur nächsten Koalitionsprüfung, keine Zukunftssimulation.
import type { World } from "./types";
import type { Zusage } from "./spiel-typen";
import { aktiveParteivorsitzende, KOALITIONSBRUCH_LOYALITAET, naechsteKoalitionspruefung, regierungsSitze } from "./koalitionslage";
import { addDays } from "./dates";

/** Derselbe persönliche Preis beim tatsächlichen Verfall und bei seiner bedingten Vorschau. */
export const ZUSAGEN_VERFALL_LOYALITAET = 15;

export function zusagenDruck(w: World, partei: string) {
  const sp = w.spiel;
  if (!sp || sp.ende || !sp.lager.includes(partei) || partei === w.player?.partei.kurz) return;
  const vorsitz = aktiveParteivorsitzende(w, partei);
  if (!vorsitz.length) return;
  const pruefung = naechsteKoalitionspruefung(w.date);
  const offen = new Map(sp.zusagen.filter(z => z.von === partei && !z.erfuellt && !z.gebrochen && z.faellig <= w.day).map(z => [z.id, z]));
  const erinnert = new Map<string, { zusage: Zusage; ereignis: string; frist: number; datum: string }>();
  for (const e of sp.ereignisse) {
    if (e.vorlage !== "zusage") continue;
    const z = offen.get(String(e.daten?.zusage));
    const datum = addDays(w.date, e.frist - w.day);
    if (!z || datum > pruefung) continue;
    const alt = erinnert.get(z.id);
    if (!alt || e.frist < alt.frist) erinnert.set(z.id, { zusage: z, ereignis: e.id, frist: e.frist, datum });
  }
  if (!erinnert.size) return;
  const erinnerungen = [...erinnert.values()].sort((a,b) => a.frist-b.frist || a.zusage.id.localeCompare(b.zusage.id));
  const loyalitaet = Math.min(...vorsitz.map(f => f.loyalitaet));
  const nachVerfall = Math.max(0, loyalitaet - erinnerungen.length * ZUSAGEN_VERFALL_LOYALITAET);
  return { partei, pruefung, erinnerungen, loyalitaet, nachVerfall,
    bruch: nachVerfall < KOALITIONSBRUCH_LOYALITAET, sitze: w.parliament?.seats[partei] ?? 0, ohne: regierungsSitze(w, partei) };
}
export type ZusagenDruckLage = NonNullable<ReturnType<typeof zusagenDruck>>;

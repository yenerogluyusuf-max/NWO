// Blöcke und Institutionen: der EU-Rat (die Positionen der Mitgliedstaaten bestimmen, was in Brüssel durchgeht), die Mitgliedschaften der
// Türkei und die Optionen gegenüber den BRICS und den Turkstaaten.
//
// EU-Rat: Jeder Mitgliedstaat im Spiel hat zur Türkei eine Haltung (Vertrauen, offene Konflikte, Grundneigung) und gewichtet die Themen
// verschieden (data/welt-weitere.ts). Die Eröffnung eines Beitrittskapitels verlangt Einstimmigkeit; ein Handelsmandat eine qualifizierte
// Mehrheit. Im Spiel gilt das vereinfacht für die 13 Staaten, die als Akteure vorkommen; die 14 übrigen folgen ihnen. Griechenland und Zypern
// behalten ihr Vetorecht über die Konfliktwerte in sim/eu.ts (VETO_LAENDER); die anderen Mitglieder verweigern die Einstimmigkeit nur
// bei extremer Haltung — nach den Startwerten bremst niemand, schlechtes Spiel (Druck, verfallender Rechtsstaat) ändert das.

import { INSTITUTION_NACH_ID, INSTITUTIONEN, STATUS_NAME, type InstitutionDef, type TuerkeiStatus } from "../data/welt-institutionen";
import { WEITERE, type EuThema } from "../data/welt-weitere";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { setzeRatPruefung } from "./eu";
import { akteurName, beziehungAendern, beziehungZurTuerkei, istHauptakteur, weltModell } from "./welt-modell";
import type { World } from "./types";
// Der Haken für die Kriege zwischen anderen Staaten und die Pakte (sim/pakte.ts) registriert sich beim Laden; wer die Blöcke nutzt, hat ihn.
import "./pakte";

// ---------------------------------------------------------------------------
// Der EU-Rat

export type Stimme = "dafuer" | "enthaltung" | "dagegen";

export interface RatStimme {
  id: string;
  name: string;
  stimme: Stimme;
  /** Haltung zur Türkei in diesem Thema, −100 (lehnt ab) bis +100 (fördert) */
  wert: number;
  /** Verweigert die Einstimmigkeit */
  veto: boolean;
  /** Der wichtigste Grund in einem Satz */
  grund: string;
  /** Mitgliedstaaten mit besonderem Vetorecht über die Konfliktwerte (Griechenland, Zypern) */
  konflikt?: boolean;
}

export const THEMA_NAME: Record<EuThema, string> = {
  rechtsstaat: "Rechtsstaat und Grundrechte",
  migration: "Migration und Grenzen",
  handel: "Handel und Zollunion",
  sicherheit: "Sicherheit und Verteidigung",
  erweiterung: "Beitrittsperspektive",
  region: "Ägäis, Zypern und Mittelmeer",
};

/** Welches Thema ein Beitrittskapitel berührt (Kapitel-Kennungen aus sim/eu.ts). */
export const KAPITEL_THEMA: Record<string, EuThema> = {
  k23: "rechtsstaat",
  k24: "migration",
  k31: "sicherheit",
  k5: "handel",
  k15: "handel",
  k17: "handel",
  k12: "handel",
  k27: "handel",
  k33: "handel",
  k11: "handel",
};

/** Griechenland und Zypern sitzen auch im Rat, werden aber als Hauptakteure geführt. */
const RAT_HAUPT: { id: string; gewicht: Partial<Record<EuThema, number>>; neigung: number }[] = [
  { id: "GRC", gewicht: { rechtsstaat: 0.4, migration: 0.9, handel: 0.5, sicherheit: 0.8, erweiterung: 0.8, region: 1.0 }, neigung: -0.3 },
  { id: "CYP", gewicht: { rechtsstaat: 0.5, migration: 0.6, handel: 0.4, sicherheit: 0.7, erweiterung: 0.9, region: 1.0 }, neigung: -0.5 },
];

function grundText(thema: EuThema, wert: number, konflikt: number, vertrauen: number): string {
  if (wert >= 10) return vertrauen >= 55 ? "Das Verhältnis trägt: Fürsprecher im Rat." : "Hält die Zusammenarbeit für wichtiger als die Vorbehalte.";
  if (wert > -15) return "Keine feste Linie: wartet auf die Lage.";
  if (thema === "rechtsstaat") return "Verlangt sichtbare Fortschritte bei Justiz und Grundrechten.";
  if (thema === "migration") return "Sorgt sich um Grenzschutz und Rücknahmen.";
  if (thema === "region") return "Stellt Zugeständnisse in der Ägäis und in der Zypernfrage voran.";
  if (konflikt >= 40) return "Offene Streitpunkte belasten das Verhältnis.";
  return "Das Vertrauen in Ankara ist gering.";
}

/** Die Positionen der Mitgliedstaaten zu einem Thema. */
export function ratStimmen(w: World, thema: EuThema): RatStimme[] {
  // Der Rechtsstaat aus Sicht des Rats: dieselben Größen, an denen sim/eu.ts Kapitel 23 misst (Justiz, Urteile, Pressefreiheit)
  const rechtsKnoten = ["justiz_unabhaengigkeit", "urteilsbefolgung", "pressefreiheit"].filter((id) => NET.index.has(id));
  const rn = rechtsKnoten.length ? rechtsKnoten.reduce((a, id) => a + nationalAverage(NET, w.net, id), 0) / rechtsKnoten.length : 50;
  const out: RatStimme[] = [];
  const stimme = (id: string, gewicht: Partial<Record<EuThema, number>>, neigung: number, konfliktRecht: boolean): void => {
    const b = beziehungZurTuerkei(w, id);
    const g = gewicht[thema] ?? 0.3;
    let wert = 0.7 * (b.vertrauen - 45) - 0.25 * (b.konflikt - 20) + 28 * neigung;
    if (thema === "rechtsstaat") wert += g * 0.5 * (rn - 50);
    if (thema === "region" && konfliktRecht) wert -= 0.4 * (b.konflikt - 40);
    wert = Math.round(Math.max(-100, Math.min(100, wert)));
    out.push({
      id,
      name: akteurName(id),
      stimme: wert >= 10 ? "dafuer" : wert > -15 ? "enthaltung" : "dagegen",
      wert,
      veto: wert < -55 && g >= 0.5,
      grund: grundText(thema, wert, b.konflikt, b.vertrauen),
      ...(konfliktRecht ? { konflikt: true } : {}),
    });
  };
  for (const wd of WEITERE) if (wd.eu) stimme(wd.id, wd.eu.gewicht, wd.eu.neigung, false);
  for (const h of RAT_HAUPT) stimme(h.id, h.gewicht, h.neigung, true);
  return out.sort((a, b) => a.wert - b.wert);
}

export interface RatErgebnis {
  thema: EuThema;
  stimmen: RatStimme[];
  dafuer: number;
  dagegen: number;
  enthaltung: number;
  /** Einstimmigkeit: niemand verweigert */
  einstimmig: boolean;
  /** Qualifizierte Mehrheit im Spiel vereinfacht: mindestens 55 Prozent der Staaten stimmen zu */
  mehrheit: boolean;
  blocker: RatStimme[];
}

export function ratErgebnis(w: World, thema: EuThema): RatErgebnis {
  const stimmen = ratStimmen(w, thema);
  const dafuer = stimmen.filter((s) => s.stimme === "dafuer").length;
  const dagegen = stimmen.filter((s) => s.stimme === "dagegen").length;
  const blocker = stimmen.filter((s) => s.veto);
  return { thema, stimmen, dafuer, dagegen, enthaltung: stimmen.length - dafuer - dagegen, einstimmig: blocker.length === 0, mehrheit: dafuer / stimmen.length >= 0.55, blocker };
}

/**
 * Die Prüfung, die sim/eu.ts vor der Eröffnung eines Kapitels fragt: Verweigert ein Mitgliedstaat (außer Griechenland und Zypern, die ihr
 * Veto in eu.ts ausüben) die Einstimmigkeit? Dann bleibt das Kapitel zu, und das Protokoll nennt den Staat.
 */
export function ratPruefung(w: World, kapitelId: string): { blockiert: boolean; text: string } | null {
  const thema = KAPITEL_THEMA[kapitelId] ?? "erweiterung";
  const e = ratErgebnis(w, thema);
  const b = e.blocker.filter((s) => !s.konflikt);
  if (b.length === 0) return null;
  const m = weltModell(w);
  const hinweise = (m.ratHinweise ??= {});
  const text = `${b.map((s) => s.name).join(" und ")} verweiger${b.length === 1 ? "t" : "n"} im Rat die Einstimmigkeit (${THEMA_NAME[thema]}): ${b[0]!.grund}`;
  if (w.day - (hinweise[kapitelId] ?? -1e9) > 90) {
    hinweise[kapitelId] = w.day;
    addLog(w, "ereignis", `Der Rat blockiert ein Beitrittskapitel`, text);
  }
  return { blockiert: true, text };
}

// ---------------------------------------------------------------------------
// Institutionen

export interface InstitutionSicht {
  def: InstitutionDef;
  tuerkei: TuerkeiStatus;
  statusName: string;
}

export function institutionSicht(w: World, id: string): InstitutionSicht {
  const def = INSTITUTION_NACH_ID.get(id);
  if (!def) throw new Error(`Unbekannte Institution: ${id}`);
  const t = weltModell(w).institutionen[id]!.tuerkei;
  return { def, tuerkei: t, statusName: STATUS_NAME[t] };
}

export interface InstitutionsAktion {
  id: "brics_partner" | "turk_gipfel";
  label: string;
  hinweis: string;
  pk: number;
  moeglich: boolean;
  grund?: string;
}

const TURK_GIPFEL_ABKUEHLUNG = 180;

export function institutionsAktionen(w: World, institution: string): InstitutionsAktion[] {
  const m = weltModell(w);
  const spiel = w.spiel!;
  if (institution === "brics") {
    const st = m.institutionen.brics!.tuerkei;
    const pk = 6;
    return [
      {
        id: "brics_partner",
        label: "Partnerland der BRICS werden",
        hinweis: "Der Süden öffnet Märkte und Finanzierung (Russland, China, Indien, Brasilien, Südafrika, die Emirate), Washington und Brüssel lesen es als Abwendung vom Westen: Vertrauen in NATO- und EU-Staaten sinkt, Auslandskapital zögert.",
        pk,
        moeglich: st === "keiner" && spiel.kapital >= pk,
        ...(st !== "keiner" ? { grund: "Die Türkei ist bereits Partnerland." } : spiel.kapital < pk ? { grund: "Dafür fehlt Kapital." } : {}),
      },
    ];
  }
  if (institution === "ots") {
    const pk = 3;
    const rest = (m.institutionen.ots!.zuletzt ?? -1e9) + TURK_GIPFEL_ABKUEHLUNG - w.day;
    return [
      {
        id: "turk_gipfel",
        label: "Gipfel der Turkstaaten ausrichten",
        hinweis: "Der Mittlere Korridor, Rüstungsgeschäfte und Handel unter den Turkstaaten; Moskau und Peking sehen es mit Misstrauen.",
        pk,
        moeglich: rest <= 0 && spiel.kapital >= pk,
        ...(rest > 0 ? { grund: `Wieder möglich in ${rest} Tagen.` } : spiel.kapital < pk ? { grund: "Dafür fehlt Kapital." } : {}),
      },
    ];
  }
  return [];
}

export function fuehreInstitutionsAktionAus(w: World, id: InstitutionsAktion["id"]): { ok: boolean; text: string; why?: string } {
  const spiel = w.spiel;
  if (!spiel) return { ok: false, text: "Ohne Spielschleife gibt es keine Außenpolitik." };
  const m = weltModell(w);
  const inst = id === "brics_partner" ? "brics" : "ots";
  const sicht = institutionsAktionen(w, inst).find((a) => a.id === id);
  if (!sicht) return { ok: false, text: "Diese Handlung gibt es nicht." };
  if (!sicht.moeglich) return { ok: false, text: sicht.grund ?? "Das geht gerade nicht." };
  spiel.kapital -= sicht.pk;
  if (id === "brics_partner") {
    m.institutionen.brics = { tuerkei: "partner", seit: w.day };
    const brics = INSTITUTION_NACH_ID.get("brics")!;
    const sued = [...brics.mitglieder, ...(brics.partner ?? [])];
    for (const x of sued) beziehungAendern(w, x, { vertrauen: x === "IND" ? 2 : 5, konflikt: -2 });
    const nato = INSTITUTION_NACH_ID.get("nato")!.mitglieder;
    const eu = INSTITUTION_NACH_ID.get("eu")!.mitglieder;
    const westen = new Set(["EU", ...nato, ...eu]);
    for (const x of westen) beziehungAendern(w, x, { vertrauen: istHauptakteur(x) ? -6 : -4, konflikt: 3 });
    wirke(w, "export", 1);
    if (NET.index.has("auslandskapital")) wirke(w, "auslandskapital", -1.5);
    wirke(w, "ansehen", 0.5);
    const text = "Die Türkei wird Partnerland der BRICS: Moskau, Peking, Neu-Delhi und Brasília begrüßen den Schritt, Washington und Brüssel reagieren verschnupft.";
    const why = `Kostet ${sicht.pk} Kapital. Das Vertrauen in ${westen.size} NATO- und EU-Staaten sinkt; Auslandskapital zögert, Export und Märkte im Süden gewinnen.`;
    addLog(w, "entscheidung", text, why);
    weltModell(w).nachrichten.push({ tag: w.day, datum: w.date, art: "institution", id: "RUS", titel: "Die Türkei wird Partnerland der BRICS", fakt: text, wertung: 0.05, gewicht: 0.9 });
    return { ok: true, text, why };
  }
  // Gipfel der Turkstaaten
  m.institutionen.ots = { ...m.institutionen.ots!, zuletzt: w.day };
  const ots = INSTITUTION_NACH_ID.get("ots")!;
  for (const x of ots.mitglieder) beziehungAendern(w, x, { vertrauen: 4, handel: 3 });
  for (const x of ots.beobachter ?? []) beziehungAendern(w, x, { vertrauen: 1.5 });
  wirke(w, "export", 0.6);
  beziehungAendern(w, "RUS", { vertrauen: -1.5 });
  beziehungAendern(w, "CHN", { vertrauen: -0.5 });
  const text = "Der Gipfel der Turkstaaten in Istanbul bringt Zusagen zum Mittleren Korridor und zu gemeinsamen Rüstungsvorhaben.";
  const why = `Kostet ${sicht.pk} Kapital. Moskau und Peking sehen die wachsende Verflechtung mit Misstrauen.`;
  addLog(w, "entscheidung", text, why);
  return { ok: true, text, why };
}

/** Die Institutionen, in denen ein Akteur sitzt, für die Länderansicht. */
export function institutionenVon(id: string): { id: string; kurz: string; rolle: "mitglied" | "partner" | "beobachter" }[] {
  const out: { id: string; kurz: string; rolle: "mitglied" | "partner" | "beobachter" }[] = [];
  for (const i of INSTITUTIONEN) {
    if (i.mitglieder.includes(id)) out.push({ id: i.id, kurz: i.kurz, rolle: "mitglied" });
    else if (i.partner?.includes(id)) out.push({ id: i.id, kurz: i.kurz, rolle: "partner" });
    else if (i.beobachter?.includes(id)) out.push({ id: i.id, kurz: i.kurz, rolle: "beobachter" });
  }
  return out;
}

// Anbindung an sim/eu.ts (kein Direktimport dorthin, damit kein Ladezyklus entsteht)
setzeRatPruefung(ratPruefung);

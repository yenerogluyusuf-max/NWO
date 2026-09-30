// Wie ein Vorhaben zur Wirklichkeit wird: Ort, Politisches Kapital, Parlament, Verwaltungskapazität.
//
// Der Spieler verändert nicht einfach einen Regler. Jede Änderung
//   - kostet Politisches Kapital (knapp, wächst mit Vertrauen und Mehrheit),
//   - braucht ein Gesetz mit Mehrheit im Parlament (301 von 600) oder, wo das Recht es erlaubt, einen Erlass,
//   - kann auf einzelne Provinzen beschränkt werden (Bau vor Ort),
//   - konkurriert mit allen anderen laufenden Vorhaben um die Verwaltungskapazität.
// Alle Werte sind Platzhalter der Kalibrierung.

import { NET } from "./modell";
import { nationalAverage, PROVINCES, startAverage } from "./netz";
import { addLog, fmt } from "./log";
import { PROVINZEN } from "./regional";
import { clamp } from "./economy";
import { vertrauenAendern } from "./wirkung";
import { reagiereFiguren } from "./figuren";
import { rabattFuer } from "./programme";
import { beobachte } from "./berichte";
import { bereitschaftAendern, duldung, sachstimmen } from "./fraktionen";
import type { Rng } from "./rng";
import type { World } from "./types";
import type { Gesetz, Weg } from "./spiel-typen";
import { kannZahlen } from "./kapital";

export const REGELN = {
  /** Gleichzeitig laufende Vorhaben, bevor die Verwaltung überlastet ist */
  kapazitaet: 8,
  /** Zuschlag je Vorhaben über der Kapazität (Dauer und Kapital) */
  ueberlastStufe: 0.2,
  /** Tage vom Einbringen bis zur Abstimmung */
  tageBisAbstimmung: 21,
  mehrheit: 301,
  /** Kapital je gekaufter Stimme */
  kaufKostenProStimme: 0.5,
  /** Anteil des Kapitals, der beim Zurückziehen eines Gesetzes zurückkommt */
  rueckzugAnteil: 0.6,
  /** Ein Erlass kostet mehr Kapital und Vertrauen */
  erlassFaktor: 2,
  /** Allgemeiner Faktor auf alle Kapitalkosten von Änderungen (Kalibrierung der Knappheit) */
  kapitalFaktor: 1.8,
  kapitalMax: 150,
} as const;

/** Kapital je Stufenpunkt Änderung; heikle Themen kosten mehr. */
const GEWICHT_THEMA: Record<string, number> = {
  wirtschaft: 0.2,
  haushalt: 0.28,
  arbeit: 0.2,
  bildung: 0.18,
  gesundheit: 0.18,
  landwirtschaft: 0.18,
  energie: 0.2,
  infrastruktur: 0.15,
  wohnen: 0.2,
  sicherheit: 0.25,
  recht: 0.25,
  militaer: 0.25,
  kultur: 0.15,
  gesellschaft: 0.3,
  aussen: 0.28,
};
const GEWICHT_MASSNAHME: Record<string, number> = {
  m_einkommensteuer: 0.35,
  m_mwst: 0.35,
  m_kraftstoffsteuer: 0.32,
  m_justizreform: 0.35,
  m_internetsperren: 0.4,
  m_medienaufsicht: 0.35,
  m_friedensprozess: 0.4,
  m_religioese_schulen: 0.35,
  m_verteidigung: 0.3,
};

/** Wo das Recht einen Erlass des Präsidenten zulässt (Verwaltung, Sicherheit, Außenbeziehungen). */
const ERLASS_THEMEN = new Set(["sicherheit", "aussen", "militaer"]);
const ERLASS_MASSNAHMEN = new Set(["m_steuerfahndung", "m_verwaltungsdigital"]);

export function provinzName(plaka: number): string {
  return PROVINZEN[plaka - 1]?.name ?? `Provinz ${plaka}`;
}

/** „Hatay“, „Hatay und Adana“, „Hatay, Adana und Mersin“, bei vielen „12 Provinzen“. */
export function provinzenText(provinzen: number[] | null | undefined): string {
  if (!provinzen || provinzen.length === 0 || provinzen.length >= PROVINCES) return "im ganzen Land";
  const namen = provinzen.map(provinzName);
  if (namen.length > 4) return `in ${namen.length} Provinzen`;
  if (namen.length === 1) return `in ${namen[0]}`;
  return `in ${namen.slice(0, -1).join(", ")} und ${namen[namen.length - 1]}`;
}

function ortsListe(provinzen?: number[] | null): number[] | null {
  if (!provinzen || provinzen.length === 0 || provinzen.length >= PROVINCES) return null;
  return [...new Set(provinzen)].filter((p) => p >= 1 && p <= PROVINCES).sort((a, b) => a - b);
}

function anteil(world: World, ort: number[] | null): number {
  if (!ort) return 1;
  return ort.reduce((s, p) => s + world.net.weights[p - 1]!, 0);
}

function knotenIndex(id: string): number {
  const i = NET.index.get(id);
  const node = i === undefined ? undefined : NET.nodes[i];
  if (i === undefined || !node || node.kind !== "massnahme") throw new Error(`Keine Maßnahme: ${id}`);
  return i;
}

/** Bevölkerungsgewichteter Mittelwert der Stufe in den Provinzen (oder im ganzen Land). */
export function stufeIn(world: World, id: string, ort: number[] | null): number {
  if (!ort) return nationalAverage(NET, world.net, id);
  const i = knotenIndex(id);
  let sum = 0;
  let w = 0;
  for (const p of ort) {
    const weight = world.net.weights[p - 1]!;
    sum += world.net.values[i * PROVINCES + p - 1]! * weight;
    w += weight;
  }
  return sum / w;
}

// ---------------------------------------------------------------------------
// Kapazität

/** Maßnahmen, die noch umgesetzt werden, plus Gesetze in der Beratung. */
export function offeneVorhaben(world: World): number {
  const ids = new Set<string>();
  for (const [id, target] of Object.entries(world.net.targets)) {
    if (Math.abs(nationalAverage(NET, world.net, id) - target) > 1) ids.add(id);
  }
  for (const id of Object.keys(world.net.ziele ?? {})) ids.add(id);
  for (const g of world.spiel?.gesetze ?? []) ids.add(g.massnahme);
  return ids.size;
}

export function ueberlast(world: World, zusaetzlich = 0): number {
  const ueber = Math.max(0, offeneVorhaben(world) + zusaetzlich - REGELN.kapazitaet);
  return 1 + REGELN.ueberlastStufe * ueber;
}

// ---------------------------------------------------------------------------
// Parlament

export interface StimmenSicht {
  /** Sitze des Regierungslagers */
  lager: number;
  /** Erwartete Ja-Stimmen ohne Absprachen */
  erwartet: number;
  low: number;
  high: number;
  /** Wie viele Stimmen bis zur Mehrheit fehlen (erwartet) */
  luecke: number;
  /** Ja-Stimmen von Fraktionen, die das Lager dulden (schon in „erwartet“ enthalten) */
  duldung: number;
  /** Sitze der duldenden Fraktionen (nicht im Lager) */
  duldungSitze: number;
  /** Ja-Stimmen von Fraktionen, deren Kernforderung dieses Gesetz erfüllt (schon in „erwartet“ enthalten) */
  sach: number;
  /** Welche Fraktionen aus diesem Grund mitstimmen */
  sachParteien: string[];
}

/** `gesetz` (Maßnahme und Richtung der Änderung) macht die Rechnung inhaltsbezogen: Fraktionen stimmen für das, was sie wollen. */
export function stimmenSicht(world: World, gesetz?: { massnahme: string; richtung: number }): StimmenSicht {
  const parl = world.parliament;
  const player = world.player;
  if (!parl || !player) return { lager: 600, erwartet: 600, low: 590, high: 600, luecke: 0, duldung: 0, duldungSitze: 0, sach: 0, sachParteien: [] };
  const parteien = [player.partei.kurz, ...(world.spiel?.lager ?? [])];
  const lager = parteien.reduce((s, p) => s + (parl.seats[p] ?? 0), 0);
  const dul = duldung(world);
  const sach = sachstimmen(world, gesetz?.massnahme, gesetz?.richtung ?? 0);
  const gegner = 600 - lager - dul.sitze - sach.sitze;
  const zustimmung = world.spiel?.umfrage.zustimmung ?? 50;
  // Ein Teil der Opposition stimmt mit, wenn der Präsident im Land beliebt ist
  const uebertritt = clamp(0.04 + (0.22 * (zustimmung - 35)) / 40, 0.02, 0.3);
  const erwartet = Math.min(600, lager + dul.ja + sach.ja + Math.round(gegner * uebertritt));
  const band = 8 + Math.round(gegner * 0.02);
  return { lager, erwartet, low: erwartet - band, high: Math.min(600, erwartet + band), luecke: Math.max(0, REGELN.mehrheit - erwartet), duldung: dul.ja, duldungSitze: dul.sitze, sach: sach.ja, sachParteien: sach.parteien };
}

// ---------------------------------------------------------------------------
// Prüfen

export interface Pruefung {
  ok: boolean;
  grund?: string;
  massnahme: string;
  name: string;
  stufe: number;
  provinzen: number[] | null;
  /** Mittlere Änderung in Stufenpunkten über die betroffenen Provinzen */
  aenderung: number;
  monate: number;
  /** Jährliche Kosten der Änderung in % des BIP (negativ = Einnahmen) */
  kostenBip: number;
  ueberlast: number;
  offen: number;
  kapital: number;
  gesetz: { pk: number; stimmen: StimmenSicht; tage: number; bezahlbar: boolean };
  erlass: { moeglich: boolean; pk: number; grund?: string; bezahlbar: boolean };
  hinweise: string[];
}

function pkKosten(world: World, id: string, delta: number, ort: number[] | null, weg: Weg, ueberl: number): number {
  const node = NET.nodes[knotenIndex(id)]!;
  const gewicht = GEWICHT_MASSNAHME[id] ?? GEWICHT_THEMA[node.theme] ?? 0.2;
  const share = anteil(world, ort);
  const ortsfaktor = ort ? 0.35 + 0.65 * Math.min(1, share * 3) : 1;
  const rabatt = 1 - rabattFuer(world, node.theme);
  const basis = Math.abs(delta) * gewicht * REGELN.kapitalFaktor * ortsfaktor * ueberl * rabatt * (weg === "erlass" ? REGELN.erlassFaktor : 1);
  return Math.max(2, Math.round(basis));
}

export function erlassMoeglich(id: string): boolean {
  const node = NET.nodes[knotenIndex(id)]!;
  return ERLASS_THEMEN.has(node.theme) || ERLASS_MASSNAHMEN.has(id);
}

export function pruefeVorhaben(world: World, id: string, stufe: number, provinzen?: number[] | null): Pruefung {
  const i = knotenIndex(id);
  const node = NET.nodes[i]!;
  const ort = ortsListe(provinzen);
  const ziel = clamp(Math.round(stufe), 0, 100);
  const aktuell = stufeIn(world, id, ort);
  const aenderung = ziel - aktuell;
  const share = anteil(world, ort);

  // Kosten: Änderung je Provinz, nach Bevölkerung gewichtet
  let kostenBip = 0;
  const liste = ort ?? Array.from({ length: PROVINCES }, (_, p) => p + 1);
  for (const p of liste) {
    kostenBip += (world.net.weights[p - 1]! * (ziel - world.net.values[i * PROVINCES + p - 1]!) * (node.cost ?? 0)) / 100;
  }

  const offen = offeneVorhaben(world);
  const ueberl = ueberlast(world, 1);
  const kapital = world.spiel?.kapital ?? Infinity;
  const stimmen = stimmenSicht(world, { massnahme: id, richtung: Math.sign(aenderung) });
  const pkGesetz = pkKosten(world, id, aenderung, ort, "gesetz", ueberl);
  const erlassOk = erlassMoeglich(id);
  const pkErlass = pkKosten(world, id, aenderung, ort, "erlass", ueberl);
  const hinweise: string[] = [];
  if (ueberl > 1) hinweise.push(`Die Verwaltung ist mit ${offen} laufenden Vorhaben überlastet: Dauer und Kapital steigen um ${Math.round((ueberl - 1) * 100)} %.`);
  if (stimmen.luecke > 0) hinweise.push(`Dem Lager fehlen für eine Mehrheit voraussichtlich ${stimmen.luecke} Stimmen; sie lassen sich mit Kapital kaufen, das kostet später Gegenleistungen.`);
  if (ort && share < 0.05) hinweise.push("Ein kleiner Ort: Die Wirkung auf die Landeswerte ist gering, die vor Ort deutlich.");

  const base: Pruefung = {
    ok: true,
    massnahme: id,
    name: node.name,
    stufe: ziel,
    provinzen: ort,
    aenderung,
    monate: Math.max(1, Math.ceil((node.months ?? 1) * ueberl)),
    kostenBip,
    ueberlast: ueberl,
    offen,
    kapital,
    gesetz: { pk: pkGesetz, stimmen, tage: REGELN.tageBisAbstimmung, bezahlbar: kannZahlen(kapital, pkGesetz) },
    erlass: erlassOk
      ? { moeglich: true, pk: pkErlass, bezahlbar: kannZahlen(kapital, pkErlass) }
      : { moeglich: false, pk: pkErlass, bezahlbar: false, grund: "Dafür braucht der Präsident ein Gesetz; ein Erlass ist nur in Sicherheit und Außenbeziehungen zulässig." },
    hinweise,
  };
  if (Math.abs(aenderung) < 1) return { ...base, ok: false, grund: "Das ist schon die aktuelle Stufe." };
  return base;
}

// ---------------------------------------------------------------------------
// Anwenden

function wendeAn(world: World, id: string, level: number, provinzen: number[] | null): void {
  const i = knotenIndex(id);
  const node = NET.nodes[i]!;
  const ort = ortsListe(provinzen);
  const target = clamp(Math.round(level), 0, 100);
  const months = Math.max(1, (node.months ?? 1) * ueberlast(world));
  const vorher = stufeIn(world, id, ort);
  const s = world.net;
  beobachte(world, id, vorher, target, ort);

  if (!ort) {
    s.targets[id] = target;
    s.steps[id] = Math.max(Math.abs(target - nationalAverage(NET, s, id)) / months, 0.01);
    if (s.ziele) delete s.ziele[id];
    if (s.schritte) delete s.schritte[id];
  } else {
    s.ziele ??= {};
    s.schritte ??= {};
    const arr = (s.ziele[id] ??= new Array(PROVINCES).fill(-1));
    const st = (s.schritte[id] ??= new Array(PROVINCES).fill(100));
    // Ein bestehendes Landesziel gilt für die übrigen Provinzen weiter
    if (s.targets[id] !== undefined) {
      for (let p = 0; p < PROVINCES; p++) {
        if (!ort.includes(p + 1) && arr[p]! < 0) {
          arr[p] = s.targets[id]!;
          st[p] = s.steps[id] ?? 100;
        }
      }
      delete s.targets[id];
      delete s.steps[id];
    }
    for (const p of ort) {
      arr[p - 1] = target;
      st[p - 1] = Math.max(Math.abs(target - s.values[i * PROVINCES + p - 1]!) / months, 0.01);
    }
  }

  // Zusagen an Fraktionen und Figuren, die diese Änderung verlangen
  const richtung = Math.sign(target - vorher);
  for (const z of world.spiel?.zusagen ?? []) {
    if (!z.erfuellt && !z.gebrochen && z.massnahme === id && richtung === Math.sign(z.richtung ?? 0)) {
      z.erfuellt = true;
      bereitschaftAendern(world, z.von, 10);
      addLog(world, "ereignis", `Zusage erfüllt: ${z.text}`, "Wer Zusagen hält, wird beim nächsten Mal ernster genommen.");
    }
  }
  reagiereFiguren(world, node.theme, id, richtung);
}

/**
 * Direkte Anwendung ohne Kapital und Abstimmung. Für Tests, den Kern und Fälle ohne Spielschleife;
 * die Oberfläche geht über `bringeEin`.
 */
export function setPolicy(world: World, id: string, level: number, provinzen?: number[] | null): void {
  const i = knotenIndex(id);
  const node = NET.nodes[i]!;
  const ort = ortsListe(provinzen);
  const target = clamp(Math.round(level), 0, 100);
  const current = stufeIn(world, id, ort);
  const months = node.months ?? 1;
  let costChange = 0;
  for (const p of ort ?? Array.from({ length: PROVINCES }, (_, k) => k + 1)) {
    costChange += (world.net.weights[p - 1]! * (target - world.net.values[i * PROVINCES + p - 1]!) * (node.cost ?? 0)) / 100;
  }
  wendeAn(world, id, target, ort);
  addLog(
    world,
    "entscheidung",
    `${node.name} ${provinzenText(ort)}: von Stufe ${Math.round(current)} auf ${target} ${target > current ? "erhöht" : "gesenkt"}.`,
    `${node.text} Umsetzung in etwa ${months} ${months === 1 ? "Monat" : "Monaten"}` +
      (Math.abs(costChange) >= 0.0005 ? `; ${costChange > 0 ? "kostet" : "bringt"} jährlich etwa ${fmt(Math.abs(costChange))} % der Wirtschaftsleistung.` : "."),
  );
}

/** Wird nach jedem erfolgreich eingebrachten Vorhaben aufgerufen (Ereignisse schließen sich, wenn der Spieler die Ursache selbst regelt). */
let nachEinbringen: ((world: World, massnahmeId: string, text: string) => void) | null = null;
export function setzeEinbringHaken(fn: (world: World, massnahmeId: string, text: string) => void): void {
  nachEinbringen = fn;
}

export interface Ergebnis {
  ok: boolean;
  text: string;
  why?: string;
}

/** Ein Vorhaben einbringen: als Gesetz (mit Abstimmung) oder als Erlass. */
export function bringeEin(world: World, id: string, stufe: number, provinzen: number[] | null | undefined, weg: Weg): Ergebnis {
  const pr = pruefeVorhaben(world, id, stufe, provinzen);
  if (!pr.ok) return { ok: false, text: pr.grund ?? "Nicht möglich." };
  const spiel = world.spiel;
  if (!spiel) {
    setPolicy(world, id, stufe, provinzen);
    const l = world.log[world.log.length - 1]!;
    return { ok: true, text: l.text, why: l.why };
  }
  if (spiel.ende) return { ok: false, text: "Die Amtszeit ist beendet." };

  if (weg === "erlass") {
    if (!pr.erlass.moeglich) return { ok: false, text: pr.erlass.grund!, why: "Wege statt Verbote: Der Weg über ein Gesetz steht offen." };
    if (!pr.erlass.bezahlbar) return { ok: false, text: `Für den Erlass fehlt Politisches Kapital (nötig ${pr.erlass.pk}, vorhanden ${Math.floor(spiel.kapital)}).` };
    spiel.kapital -= pr.erlass.pk;
    setPolicy(world, id, pr.stufe, pr.provinzen);
    vertrauenAendern(world, -(1 + Math.abs(pr.aenderung) / 40));
    const l = world.log[world.log.length - 1]!;
    nachEinbringen?.(world, id, `Per Erlass angeordnet: ${l.text}`);
    return { ok: true, text: `Erlass: ${l.text}`, why: `${l.why} Ein Erlass umgeht das Parlament und kostet ${pr.erlass.pk} Kapital sowie etwas Vertrauen.` };
  }

  if (!pr.gesetz.bezahlbar) return { ok: false, text: `Für dieses Gesetz fehlt Politisches Kapital (nötig ${pr.gesetz.pk}, vorhanden ${Math.floor(spiel.kapital)}).`, why: "Kapital wächst mit Vertrauen und Mehrheit; nicht alles auf einmal." };
  if (spiel.gesetze.some((g) => g.massnahme === id)) return { ok: false, text: `Zu „${pr.name}“ liegt schon ein Gesetzentwurf im Parlament.` };
  spiel.kapital -= pr.gesetz.pk;
  const tag = world.day + REGELN.tageBisAbstimmung;
  spiel.gesetze.push({
    id: `g-${world.day}-${id}`,
    massnahme: id,
    name: pr.name,
    stufe: pr.stufe,
    provinzen: pr.provinzen,
    eingebracht: world.day,
    abstimmung: tag,
    pk: pr.gesetz.pk,
    absprachen: 0,
    richtung: Math.sign(pr.aenderung),
  });
  const text = `Gesetzentwurf „${pr.name}“ ${provinzenText(pr.provinzen)} auf Stufe ${pr.stufe} eingebracht. Die Abstimmung ist in ${REGELN.tageBisAbstimmung} Tagen.`;
  const why = `${pr.gesetz.pk} Kapital gezahlt. Erwartet werden ${pr.gesetz.stimmen.erwartet} Ja-Stimmen (Spanne ${pr.gesetz.stimmen.low} bis ${pr.gesetz.stimmen.high}), nötig sind ${REGELN.mehrheit}.`;
  addLog(world, "entscheidung", text, why);
  nachEinbringen?.(world, id, text);
  return { ok: true, text, why };
}

/** Wie es um ein laufendes Gesetz steht und was Absprachen bis zur Mehrheit kosten würden. */
export interface GesetzSicht {
  /** Erwartete Ja-Stimmen einschließlich Absprachen */
  ja: number;
  /** Fehlende Stimmen bis zur Mehrheit (0 = Mehrheit steht) */
  luecke: number;
  /** Stimmen, die bis zu einer sicheren Mehrheit (mit Puffer) zu kaufen wären */
  noetig: number;
  kosten: number;
  bezahlbar: boolean;
  /** Ohne Verhandlungen und mit dem vorhandenen Kapital nicht zu retten */
  aussichtslos: boolean;
  urteil: "sicher" | "knapp" | "verloren";
  /** Fraktionen, die nur wegen des Inhalts mitstimmen */
  sachParteien: string[];
}

/** Puffer über der Mehrheit, damit die Streuung der Abstimmung nicht alles kippt. */
export const STIMMEN_PUFFER = 8;

export function gesetzRichtung(world: World, g: Gesetz): number {
  return g.richtung ?? Math.sign(g.stufe - stufeIn(world, g.massnahme, g.provinzen));
}

export function gesetzSicht(world: World, g: Gesetz): GesetzSicht {
  const sicht = stimmenSicht(world, { massnahme: g.massnahme, richtung: gesetzRichtung(world, g) });
  const ja = sicht.erwartet + g.absprachen;
  const luecke = Math.max(0, REGELN.mehrheit - ja);
  const noetig = ja >= REGELN.mehrheit + STIMMEN_PUFFER ? 0 : REGELN.mehrheit + STIMMEN_PUFFER - ja;
  const kosten = Math.ceil(noetig * REGELN.kaufKostenProStimme);
  const kapital = world.spiel?.kapital ?? 0;
  const bezahlbar = kannZahlen(kapital, kosten);
  const urteil = ja >= REGELN.mehrheit + STIMMEN_PUFFER ? "sicher" : luecke > 0 && !bezahlbar ? "verloren" : "knapp";
  return { ja, luecke, noetig, kosten, bezahlbar, aussichtslos: luecke > 0 && !bezahlbar, urteil, sachParteien: sicht.sachParteien };
}

/** Ein Gesetz vor der Abstimmung zurückziehen: ein Teil des Kapitals kommt zurück, gekaufte Stimmen sind verloren. */
export function zieheGesetzZurueck(world: World, gesetzId: string): Ergebnis {
  const spiel = world.spiel;
  const g = spiel?.gesetze.find((x) => x.id === gesetzId);
  if (!spiel || !g) return { ok: false, text: "Dieses Gesetz liegt nicht mehr zur Abstimmung vor." };
  const zurueck = Math.floor(g.pk * REGELN.rueckzugAnteil);
  spiel.gesetze = spiel.gesetze.filter((x) => x.id !== gesetzId);
  spiel.kapital = Math.min(REGELN.kapitalMax, spiel.kapital + zurueck);
  const text = `„${g.name}“ wird zurückgezogen.`;
  const why = `${zurueck} von ${g.pk} Kapital kommen zurück. Ein Rückzug vor der Abstimmung ist billiger als eine verlorene Abstimmung.`;
  addLog(world, "entscheidung", text, why);
  return { ok: true, text, why };
}

/** Stimmen für ein laufendes Gesetz kaufen (Absprachen mit Fraktionen). */
export function stimmenKaufen(world: World, gesetzId: string, anzahl: number): Ergebnis {
  const spiel = world.spiel;
  const g = spiel?.gesetze.find((x) => x.id === gesetzId);
  if (!spiel || !g) return { ok: false, text: "Dieses Gesetz liegt nicht mehr zur Abstimmung vor." };
  const n = Math.max(1, Math.round(anzahl));
  const kosten = Math.ceil(n * REGELN.kaufKostenProStimme);
  if (!kannZahlen(spiel.kapital, kosten)) return { ok: false, text: `Für ${n} Stimmen fehlt Politisches Kapital (nötig ${kosten}, vorhanden ${Math.floor(spiel.kapital)}).` };
  spiel.kapital -= kosten;
  g.absprachen += n;
  const text = `${n} Stimmen für „${g.name}“ gesichert.`;
  const why = `Kostet ${kosten} Kapital, sofort bezahlt; danach schuldet niemand jemandem etwas. Dauerhafte Unterstützung gibt es nur über Verhandlungen mit einer Fraktion.`;
  addLog(world, "entscheidung", text, why);
  return { ok: true, text, why };
}

export interface Abstimmung {
  gesetz: string;
  angenommen: boolean;
  ja: number;
  nein: number;
}

/** Am Abstimmungstag wird entschieden: Ja-Stimmen aus Lager, Übertritten, Absprachen und Zufall. */
export function gesetzeAbstimmen(world: World, rng: Rng): Abstimmung[] {
  const spiel = world.spiel;
  if (!spiel) return [];
  const out: Abstimmung[] = [];
  const faellig = spiel.gesetze.filter((g) => g.abstimmung <= world.day);
  if (faellig.length === 0) return out;
  spiel.gesetze = spiel.gesetze.filter((g) => g.abstimmung > world.day);
  for (const g of faellig) {
    const sicht = stimmenSicht(world, { massnahme: g.massnahme, richtung: gesetzRichtung(world, g) });
    const ja = Math.min(600, Math.max(0, sicht.erwartet + g.absprachen + Math.round(rng.normal(6))));
    const nein = 600 - ja;
    const angenommen = ja >= REGELN.mehrheit;
    out.push({ gesetz: g.name, angenommen, ja, nein });
    if (angenommen) {
      wendeAn(world, g.massnahme, g.stufe, g.provinzen);
      const node = NET.nodes[knotenIndex(g.massnahme)]!;
      addLog(
        world,
        "entscheidung",
        `Das Parlament nimmt „${g.name}“ ${provinzenText(g.provinzen)} an (${ja} zu ${nein}). Stufe ${g.stufe}.`,
        `${node.text} Umsetzung in etwa ${Math.max(1, Math.ceil((node.months ?? 1) * ueberlast(world)))} Monaten.`,
      );
    } else {
      vertrauenAendern(world, -1.2);
      spiel.umfrage.zustimmung = Math.max(0, spiel.umfrage.zustimmung - 0.8);
      addLog(
        world,
        "entscheidung",
        `Das Parlament lehnt „${g.name}“ ab (${ja} zu ${nein}).`,
        `Das eingesetzte Kapital (${g.pk}) ist verloren, die Regierung wirkt geschwächt. Es fehlten ${REGELN.mehrheit - ja} Stimmen; ein Rückzug vor der Abstimmung hätte ${Math.floor(g.pk * REGELN.rueckzugAnteil)} Kapital gerettet.`,
      );
    }
  }
  return out;
}

/** Wie stark sich eine Maßnahme vom Startwert entfernt hat, für Anzeigen. */
export function abweichung(world: World, id: string): number {
  return nationalAverage(NET, world.net, id) - startAverage(NET, world.net, id);
}

/** Provinzen, in denen ein mit der Maßnahme verbundenes Problem akut ist (direkt oder über eine Zwischengröße). */
export function akuteOrte(world: World, id: string): number[] | null {
  const verbunden = new Set<string>();
  for (const e of NET.edges) if (e.from === id) verbunden.add(e.to);
  for (const e of NET.edges) if (verbunden.has(e.from)) verbunden.add(e.to);
  const provinzen = new Set<number>();
  for (const n of NET.nodes) {
    if (n.kind !== "problem" || !n.threshold || !verbunden.has(n.id)) continue;
    const i = NET.index.get(n.id)!;
    for (let p = 0; p < PROVINCES; p++) if (world.net.values[i * PROVINCES + p]! >= n.threshold) provinzen.add(p + 1);
  }
  return provinzen.size ? [...provinzen].sort((a, b) => a - b) : null;
}

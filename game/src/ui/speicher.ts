// Speichern und Laden im Browser.
//
// Warum nicht mehr im localStorage: Ein Spielstand ist weit über 2 Millionen Zeichen groß (allein das Netzgedächtnis 2,5 Millionen),
// Safari lässt im localStorage nur rund 5 MB zu — und das Schreiben scheiterte still. Der Autosave blieb auf dem Stand stehen, an dem
// der Spielstand die Grenze überschritt, und „Schnellspeichern“ meldete trotzdem „gesichert“. Jetzt liegt der Spielstand in der
// IndexedDB (fasst viele hundert Megabyte); im localStorage stehen nur noch kleine Angaben für das Titelbild (Datum, Name, Zustimmung)
// und der Vergleichsstand der Sitzung. Jede Sicherung liefert ein echtes Ergebnis; Fehler werden gemeldet, nie verschluckt.
//
// Ältere Spielstände aus dem localStorage (Schlüssel „staatsraeson-spielstand-v1“ und „staatsraeson-slot-N“) werden weiter gelesen.
//
// Sitzungs-Snapshot (für das „Stand der Dinge“-Blatt beim Laden): die drei Kennzahlen zu Beginn der laufenden Sitzung. Autospeichern
// führt die Vergleichsbasis unverändert weiter; erst `sitzungBegonnen` (beim Laden/Fortsetzen) setzt sie auf den geladenen Stand.

import { load, save } from "../sim/world";
import type { World } from "../sim/types";

const LEGACY_KEY = "staatsraeson-spielstand-v1";
const legacySlotKey = (n: number) => `staatsraeson-slot-${n}`;
const META_KEY = "staatsraeson-meta-v2";
const LS_LAGER = "staatsraeson-lager-";
const DB_NAME = "staatsraeson";
const STORE = "staende";

/** Die drei Kennzahlen, deren Delta das Re-Entry-Blatt zeigt, plus Stand, zu dem sie gehören. */
export interface KennzahlenSnapshot {
  tag: number;
  datum: string;
  zustimmung: number;
  inflation: number;
  kapital: number;
}

export function snapshotVon(world: World): KennzahlenSnapshot {
  return {
    tag: world.day,
    datum: world.date,
    zustimmung: world.spiel?.umfrage.zustimmung ?? 0,
    inflation: world.published.inflation.value,
    kapital: world.spiel?.kapital ?? 0,
  };
}

export interface SpielstandInfo {
  gespeichert: string;
  name: string;
  datum: string;
  zustimmung?: number;
}

type MetaInfo = SpielstandInfo & { ende?: boolean };
type SlotMeta = MetaInfo & { label: string };

interface Meta {
  auto?: MetaInfo;
  slots: Record<string, SlotMeta>;
  vorsitzung?: KennzahlenSnapshot;
  /** Der weiteste Stand (höchstes Spieldatum), der je gesichert wurde: wird nie von einem älteren Stand überschrieben */
  hoechst?: MetaInfo;
  /** Rollierende Sicherungen des automatischen Stands, neueste zuerst */
  rueck?: MetaInfo[];
  /** Wann die rollierenden Sicherungen zuletzt weitergeschoben wurden (Millisekunden) */
  rueckZeit?: number;
}

/** Ergebnis einer Sicherung: Erfolg mit Ort, oder ein Grund in Klartext. */
export type Ergebnis = { ok: true; wo: string } | { ok: false; grund: string };

// ---------------------------------------------------------------------------------------------------------------------
// Lager: wo die Spielstände liegen

export interface Lager {
  name: string;
  put(key: string, text: string): Promise<void>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<void>;
}

function indexedDbLager(): Lager | null {
  if (typeof indexedDB === "undefined") return null;
  let db: Promise<IDBDatabase> | null = null;
  const oeffne = (): Promise<IDBDatabase> =>
    (db ??= new Promise<IDBDatabase>((ok, nein) => {
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => {
        if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE);
      };
      r.onsuccess = () => {
        r.result.onversionchange = () => {
          r.result.close();
          db = null;
        };
        ok(r.result);
      };
      r.onerror = () => {
        db = null;
        nein(r.error ?? new Error("IndexedDB lässt sich nicht öffnen"));
      };
      r.onblocked = () => nein(new Error("IndexedDB ist durch einen anderen Tab blockiert"));
    }));
  const lauf = async <T>(modus: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
    const d = await oeffne();
    return new Promise<T>((ok, nein) => {
      const t = d.transaction(STORE, modus);
      const anfrage = f(t.objectStore(STORE));
      t.oncomplete = () => ok(anfrage.result);
      t.onerror = () => nein(t.error ?? new Error("IndexedDB-Fehler"));
      t.onabort = () => nein(t.error ?? new Error("IndexedDB hat die Sicherung abgebrochen (Speicher voll?)"));
    });
  };
  return {
    name: "IndexedDB",
    put: async (key, text) => void (await lauf("readwrite", (s) => s.put(text, key))),
    get: async (key) => {
      const v = await lauf("readonly", (s) => s.get(key));
      return typeof v === "string" ? v : null;
    },
    del: async (key) => void (await lauf("readwrite", (s) => s.delete(key))),
  };
}

function lokalerSpeicher(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/** Notlösung, wenn die IndexedDB fehlt oder versagt (privates Fenster, gesperrte Website-Daten): der localStorage, so weit er reicht. */
function localStorageLager(): Lager | null {
  if (!lokalerSpeicher()) return null;
  return {
    name: "localStorage",
    put: async (key, text) => {
      lokalerSpeicher()!.setItem(LS_LAGER + key, text);
    },
    get: async (key) => lokalerSpeicher()!.getItem(LS_LAGER + key),
    del: async (key) => {
      lokalerSpeicher()!.removeItem(LS_LAGER + key);
    },
  };
}

interface Lagerwahl {
  haupt: Lager | null;
  not: Lager | null;
}

let lagerwahl: Lagerwahl | null = null;
let idbEinmal: Lager | null | undefined;
/** Die IndexedDB wird einmal geöffnet; der Notspeicher wird jedes Mal geprüft (der localStorage kann fehlen oder gesperrt sein). */
const lager = (): Lagerwahl => lagerwahl ?? { haupt: (idbEinmal ??= indexedDbLager()), not: localStorageLager() };

/** Nur für Tests: eigene Lager einsetzen (`null` stellt die Standardwahl wieder her). */
export function setzeLagerFuerTest(w: Lagerwahl | null): void {
  lagerwahl = w;
  letzterFehler = null;
  schreibKette.clear();
  speicherMeta = { slots: {} };
}

// ---------------------------------------------------------------------------------------------------------------------
// Kleine Angaben (Meta) im localStorage; fehlt er, im Arbeitsspeicher

let speicherMeta: Meta = { slots: {} };

function leseMeta(): Meta {
  const ls = lokalerSpeicher();
  if (!ls) return speicherMeta;
  try {
    const roh = ls.getItem(META_KEY);
    if (!roh) return { slots: {} };
    const m = JSON.parse(roh) as Partial<Meta>;
    return {
      slots: m.slots ?? {},
      ...(m.auto ? { auto: m.auto } : {}),
      ...(m.vorsitzung ? { vorsitzung: m.vorsitzung } : {}),
      ...(m.hoechst ? { hoechst: m.hoechst } : {}),
      ...(m.rueck ? { rueck: m.rueck } : {}),
      ...(m.rueckZeit ? { rueckZeit: m.rueckZeit } : {}),
    };
  } catch {
    return { slots: {} };
  }
}

function schreibeMeta(m: Meta): void {
  speicherMeta = m;
  const ls = lokalerSpeicher();
  if (!ls) return;
  try {
    ls.setItem(META_KEY, JSON.stringify(m));
  } catch {
    /* ein paar hundert Zeichen: scheitert nur bei komplett gesperrtem Speicher; die Sitzung läuft trotzdem */
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Schreiben (nacheinander je Schlüssel, damit ein späterer Stand nie von einem früheren überholt wird)

const schreibKette = new Map<string, Promise<unknown>>();

function reihe<T>(key: string, job: () => Promise<T>): Promise<T> {
  const davor = schreibKette.get(key) ?? Promise.resolve();
  const dran = davor.catch(() => undefined).then(job);
  schreibKette.set(key, dran);
  return dran;
}

/** Wartet, bis alle eingereihten Schreib- und Löschvorgänge erledigt sind (für Tests und das Beenden). */
export async function speicherRuhe(): Promise<void> {
  for (;;) {
    const offen = [...schreibKette.values()];
    await Promise.allSettled(offen);
    if ([...schreibKette.values()].every((p, i) => p === offen[i]) && schreibKette.size === offen.length) break;
  }
  // Fortsetzungen der Aufrufer (Metadaten nach dem Schreiben) laufen noch zu Ende
  await new Promise((r) => setTimeout(r, 0));
}

const grundVon = (e: unknown): string => (e instanceof Error ? (e.name && e.name !== "Error" ? `${e.name}: ${e.message}` : e.message) : String(e));

async function schreibe(key: string, text: string): Promise<Ergebnis> {
  const { haupt, not } = lager();
  const gruende: string[] = [];
  if (haupt) {
    try {
      await haupt.put(key, text);
      return { ok: true, wo: haupt.name };
    } catch (e) {
      gruende.push(`${haupt.name}: ${grundVon(e)}`);
    }
  }
  if (not) {
    try {
      await not.put(key, text);
      return { ok: true, wo: not.name };
    } catch (e) {
      gruende.push(`${not.name}: ${grundVon(e)}`);
    }
  }
  return {
    ok: false,
    grund: `Der Browser hat die Sicherung abgelehnt${gruende.length ? ` (${gruende.join("; ")})` : " (kein Speicher verfügbar)"}. Sichern Sie den Stand mit „Als Datei sichern“ im Reiter Spielstand.`,
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Fehlermeldungen für die Oberfläche

let letzterFehler: string | null = null;
const hoerer = new Set<(grund: string | null) => void>();

/** Meldet jeden gescheiterten und jeden wieder gelungenen Autosave (`null`); gibt die Abmeldung zurück. */
export function beiSpeicherfehler(f: (grund: string | null) => void): () => void {
  hoerer.add(f);
  return () => hoerer.delete(f);
}

export function letzterSpeicherfehler(): string | null {
  return letzterFehler;
}

function setzeFehler(grund: string | null): void {
  if (grund === letzterFehler) return;
  letzterFehler = grund;
  for (const f of hoerer) f(grund);
}

// ---------------------------------------------------------------------------------------------------------------------
// Rücksicherung: Ein Stand wird nie überschrieben, ohne dass der weitere Fortschritt erhalten bleibt.
//   - „Höchststand“: der Stand mit dem höchsten Spieldatum. Wer eine ältere Datei oder einen älteren Slot lädt, überschreibt den automatischen
//     Stand (der jetzt zum Vorgänger wird); der Höchststand bleibt, bis ein noch weiterer Stand ihn ablöst.
//   - Rollierende Sicherungen: höchstens alle 15 Minuten wandert der automatische Stand in eine von drei Rücksicherungen.
// (Anlass: Am 04.10.2026 überschrieb ein Ladevorgang einen Stand kurz vor der Wahl 2033, und er war nicht wiederzufinden.)

const RUECK_ABSTAND_MS = 15 * 60 * 1000;
const RUECK_ANZAHL = 3;

export interface Rueck {
  key: "hoechst" | "rueck-1" | "rueck-2" | "rueck-3";
  art: "hoechst" | "rolle";
  info: SpielstandInfo;
}

/** Hebt den bisherigen automatischen Stand auf, bevor ein neuer ihn ersetzt (läuft in der Schreibreihe von „auto“). */
async function sichereVorgaenger(neu: MetaInfo, erzwingen = false): Promise<void> {
  const m = leseMeta();
  const alt = m.auto;
  if (!alt) return;
  const zurueck = alt.datum > neu.datum;
  const hoechstFaellig = !m.hoechst || alt.datum > m.hoechst.datum;
  const jetzt = Date.now();
  const rolleFaellig = erzwingen || jetzt - (m.rueckZeit ?? 0) >= RUECK_ABSTAND_MS;
  if (!zurueck && !rolleFaellig && !erzwingen) return;
  const text = await ladeText("auto");
  if (!text) return;
  if ((zurueck || erzwingen || rolleFaellig) && hoechstFaellig) {
    const r = await schreibe("hoechst", text);
    if (r.ok) m.hoechst = alt;
  }
  if (rolleFaellig || zurueck) {
    // weiterschieben: 2 → 3, 1 → 2, auto → 1
    const rueck = [...(m.rueck ?? [])];
    for (let i = RUECK_ANZAHL; i >= 2; i--) {
      const t = await ladeText(`rueck-${i - 1}`);
      if (t && rueck[i - 2]) {
        const r = await schreibe(`rueck-${i}`, t);
        if (r.ok) rueck[i - 1] = rueck[i - 2]!;
      }
    }
    const r1 = await schreibe("rueck-1", text);
    if (r1.ok) rueck[0] = alt;
    m.rueck = rueck.slice(0, RUECK_ANZAHL);
    m.rueckZeit = jetzt;
  }
  schreibeMeta(m);
}

/** Frühere Stände zum Wiederherstellen: zuerst der Höchststand, dann die Rücksicherungen; was dem aktuellen Stand gleicht, entfällt. */
export function fruehereStaende(): Rueck[] {
  const m = leseMeta();
  const liste: Rueck[] = [];
  const gleich = (a: MetaInfo | undefined, b: MetaInfo | undefined) => !!a && !!b && a.gespeichert === b.gespeichert;
  if (m.hoechst && !gleich(m.hoechst, m.auto)) liste.push({ key: "hoechst", art: "hoechst", info: ohneEnde(m.hoechst) });
  (m.rueck ?? []).forEach((i, n) => {
    if (!i || gleich(i, m.auto) || gleich(i, m.hoechst)) return;
    liste.push({ key: `rueck-${n + 1}` as Rueck["key"], art: "rolle", info: ohneEnde(i) });
  });
  return liste;
}

function ohneEnde(i: MetaInfo): SpielstandInfo {
  const { ende: _ende, ...rest } = i;
  return rest;
}

/** Lädt eine Rücksicherung; der aktuelle Stand wandert dabei selbst in die Rücksicherung. */
export async function ladeRueck(key: Rueck["key"]): Promise<World | null> {
  return weltAus(await ladeText(key));
}

// ---------------------------------------------------------------------------------------------------------------------
// Öffentliche Funktionen

function infoVon(world: World): MetaInfo {
  return {
    gespeichert: new Date().toISOString(),
    name: world.player?.name ?? "Präsident",
    datum: world.date,
    ...(world.spiel ? { zustimmung: world.spiel.umfrage.zustimmung } : {}),
    ...(world.spiel?.ende ? { ende: true } : {}),
  };
}

/** Ob das nächste automatische Sichern den bisherigen Stand sofort als Rücksicherung aufheben muss (nach `sichereVorEingriff`). */
let rueckErzwingen = false;

/** Sichert den Stand und wartet auf das Ergebnis: automatisch (Standard) oder in einen Slot (1 bis 5). */
export async function speichereWarten(world: World, ziel: "auto" | number = "auto", label?: string): Promise<Ergebnis> {
  let text: string;
  try {
    text = save(world);
  } catch (e) {
    const grund = `Der Spielstand lässt sich nicht in Text umwandeln (${grundVon(e)}).`;
    if (ziel === "auto") setzeFehler(grund);
    return { ok: false, grund };
  }
  const info = infoVon(world);
  const key = ziel === "auto" ? "auto" : `slot-${ziel}`;
  if (ziel === "auto") {
    // Die Vergleichsbasis der Sitzung überlebt jedes Autospeichern; fehlt sie (neues Spiel, alter Stand), beginnt sie jetzt
    const m0 = leseMeta();
    if (!m0.vorsitzung) {
      m0.vorsitzung = snapshotVon(world);
      schreibeMeta(m0);
    }
  }
  const r = await reihe(key, async () => {
    // Zuerst den bisherigen automatischen Stand aufheben (Höchststand, rollierende Sicherung), dann überschreiben
    if (ziel === "auto") {
      try {
        const erzwingen = rueckErzwingen;
        rueckErzwingen = false;
        await sichereVorgaenger(info, erzwingen);
      } catch {
        /* eine fehlgeschlagene Rücksicherung darf das Sichern nicht verhindern */
      }
    }
    return schreibe(key, text);
  });
  if (!r.ok) {
    if (ziel === "auto") setzeFehler(r.grund);
    return r;
  }
  const m = leseMeta();
  if (ziel === "auto") m.auto = info;
  else m.slots[String(ziel)] = { ...info, label: label?.trim() || `Slot ${ziel}` };
  schreibeMeta(m);
  if (ziel === "auto") setzeFehler(null);
  return r;
}

/**
 * Vor einem Eingriff, der den Stand stark ändert (etwa der Nachtrag der Parlamentswahl): sichert den heutigen Stand und sorgt dafür, dass das nächste
 * automatische Sichern ihn als Rücksicherung („Frühere Sicherungen“) und, wenn er der weiteste ist, als „Weitester Stand“ aufhebt (ohne die Frist von 15 Minuten).
 */
export async function sichereVorEingriff(world: World): Promise<Ergebnis> {
  const r = await speichereWarten(world);
  if (r.ok) rueckErzwingen = true;
  return r;
}

/** Autosave ohne Warten (Aufruf bei jeder Entscheidung); ein Fehlschlag erscheint über `beiSpeicherfehler`. */
export function speichere(world: World): boolean {
  void speichereWarten(world);
  return true;
}

export function speichereSlot(world: World, slot: number, label?: string): Promise<Ergebnis> {
  return speichereWarten(world, slot, label);
}

async function ladeText(key: string): Promise<string | null> {
  const { haupt, not } = lager();
  for (const l of [haupt, not]) {
    if (!l) continue;
    try {
      const t = await l.get(key);
      if (t) return t;
    } catch {
      /* nächstes Lager */
    }
  }
  return null;
}

/** Der Teil „welt“ eines alten localStorage-Spielstands als Text. */
function legacyWelt(schluessel: string): string | null {
  try {
    const raw = lokalerSpeicher()?.getItem(schluessel);
    if (!raw) return null;
    const welt = (JSON.parse(raw) as { welt?: unknown }).welt;
    return welt ? JSON.stringify(welt) : null;
  } catch {
    return null;
  }
}

function legacyInfo(schluessel: string): (MetaInfo & { label?: string }) | null {
  try {
    const raw = lokalerSpeicher()?.getItem(schluessel);
    if (!raw) return null;
    const d = JSON.parse(raw) as { gespeichert?: string; welt?: World; label?: string };
    if (!d.welt) return null;
    return {
      gespeichert: d.gespeichert ?? "",
      name: d.welt.player?.name ?? "Präsident",
      datum: d.welt.date,
      ...(d.welt.spiel ? { zustimmung: d.welt.spiel.umfrage.zustimmung } : {}),
      ...(d.welt.spiel?.ende ? { ende: true } : {}),
      ...(d.label ? { label: d.label } : {}),
    };
  } catch {
    return null;
  }
}

function weltAus(text: string | null): World | null {
  if (!text) return null;
  try {
    return load(text);
  } catch {
    return null;
  }
}

/** Der letzte automatische Stand (zuerst der neue Speicher, dann ein alter aus dem localStorage). */
export async function ladeSpielstand(): Promise<World | null> {
  return weltAus((await ladeText("auto")) ?? legacyWelt(LEGACY_KEY));
}

export async function ladeSlot(slot: number): Promise<World | null> {
  return weltAus((await ladeText(`slot-${slot}`)) ?? legacyWelt(legacySlotKey(slot)));
}

/** Angaben zum letzten automatischen Stand für das Titelbild (sofort, ohne den Spielstand zu lesen); `null` nach Spielende. */
export function spielstandInfo(): SpielstandInfo | null {
  const i: MetaInfo | null = leseMeta().auto ?? legacyInfo(LEGACY_KEY);
  if (!i || i.ende) return null;
  const { ende: _ende, ...rest } = i;
  return rest;
}

export function alleSlots(): (SpielstandInfo & { slot: number; label: string })[] {
  const m = leseMeta();
  const liste: (SpielstandInfo & { slot: number; label: string })[] = [];
  for (let s = 1; s <= 5; s++) {
    const i = m.slots[String(s)] ?? legacyInfo(legacySlotKey(s));
    if (!i) continue;
    const { ende: _ende, ...rest } = i;
    liste.push({ ...rest, slot: s, label: (i as { label?: string }).label ?? `Slot ${s}` });
  }
  return liste;
}

export async function loescheSlot(slot: number): Promise<void> {
  const { haupt, not } = lager();
  for (const l of [haupt, not]) {
    try {
      await l?.del(`slot-${slot}`);
    } catch {
      /* nichts zu löschen */
    }
  }
  const m = leseMeta();
  delete m.slots[String(slot)];
  schreibeMeta(m);
  try {
    lokalerSpeicher()?.removeItem(legacySlotKey(slot));
  } catch {
    /* ohne Speicher spielt es sich trotzdem */
  }
}

/**
 * Neues Spiel: der automatische Stand und der Vergleichsstand werden zurückgesetzt, Slots, Höchststand und Rücksicherungen bleiben.
 * Der bisherige automatische Stand wandert vorher in die Rücksicherung, damit ein versehentliches „Neues Spiel“ nichts kostet.
 */
export function loescheSpielstand(): void {
  const { haupt, not } = lager();
  void reihe("auto", async () => {
    try {
      const m0 = leseMeta();
      if (m0.auto) await sichereVorgaenger({ ...m0.auto, datum: "0000-00-00" }, true);
    } catch {
      /* weiter mit dem Zurücksetzen */
    }
    for (const l of [haupt, not]) await l?.del("auto").catch(() => undefined);
    const m = leseMeta();
    delete m.auto;
    delete m.vorsitzung;
    schreibeMeta(m);
  });
  try {
    lokalerSpeicher()?.removeItem(LEGACY_KEY);
  } catch {
    /* ohne Speicher spielt es sich trotzdem */
  }
}

/** Vergleichsbasis aus der vorigen Sitzung; fehlt sie (alte Spielstände), gibt es „keine Vergleichsdaten“. */
export function vorsitzungSnapshot(): KennzahlenSnapshot | null {
  const m = leseMeta();
  if (m.vorsitzung) return m.vorsitzung;
  try {
    const raw = lokalerSpeicher()?.getItem(LEGACY_KEY);
    return raw ? ((JSON.parse(raw) as { vorsitzung?: KennzahlenSnapshot }).vorsitzung ?? null) : null;
  } catch {
    return null;
  }
}

/** Markiert den Sitzungsbeginn: Der geladene Stand wird zur Vergleichsbasis der nächsten Sitzung. */
export function sitzungBegonnen(world: World): void {
  const m = leseMeta();
  m.vorsitzung = snapshotVon(world);
  schreibeMeta(m);
}

/** Exportiert den Spielstand als JSON-Datei zum Download (kompakt, rund ein Drittel der früheren Größe). */
export function exportiereSpielstandDatei(world: World): boolean {
  try {
    const raw = JSON.stringify({ version: 1, gespeichert: new Date().toISOString(), welt: world, vorsitzung: snapshotVon(world) });
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staatsraeson_${world.date.replace(/[^0-9-]/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

/** Liest einen Spielstand aus einer JSON-Datei (neues oder altes Format) und legt ihn als automatischen Stand ab. */
export function importiereSpielstandDatei(text: string): World | null {
  try {
    const parsed = JSON.parse(text) as { welt?: World; vorsitzung?: KennzahlenSnapshot } | World;
    const datei = parsed as { welt?: World; vorsitzung?: KennzahlenSnapshot };
    const w = datei.welt ?? (parsed as World);
    if (!w || typeof w !== "object" || !("date" in w) || !("net" in w)) return null;
    const geladen = load(JSON.stringify(w));
    const m = leseMeta();
    m.vorsitzung = datei.vorsitzung && typeof datei.vorsitzung.tag === "number" ? datei.vorsitzung : snapshotVon(geladen);
    schreibeMeta(m);
    void speichereWarten(geladen);
    return geladen;
  } catch {
    return null;
  }
}

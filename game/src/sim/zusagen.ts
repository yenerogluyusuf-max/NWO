// Zusagen: Wem etwas versprochen wurde, bis wann, wie weit es ist, was Halten und Brechen kosten. Zusagen gehören zu Personen,
// Fraktionen und Ländern; wer sie hält, gewinnt Glaubwürdigkeit (Legitimität und Vertrauen im Politiknetz), wer sie bricht, verliert sie.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung).

import { NET } from "./modell";
import { clamp } from "./economy";
import { wirke, vertrauenAendern } from "./wirkung";
import { addLog } from "./log";
import { addDays } from "./dates";
import { kannZahlen } from "./kapital";
import { PARTEI_NAME, bereitschaftAendern } from "./fraktionen";
import { REGELN, bringeEin, pruefeVorhaben, stufeIn } from "./handeln";
import { LAENDER, landAendern } from "./laender";
import { skala, skalenArt } from "../data/skalen";
import { grollVerschieben, loyalitaetVerschieben, merke } from "./personen";
import { istMinisterienZusage, ministerienAnPartei, ressortNamen } from "./ressortvergabe";
import { t } from "../i18n";
import { vorgaengeMonat, vorgaengeSchritt } from "./vorgaenge";
import type { World } from "./types";
import type { Figur, Zusage } from "./spiel-typen";

// ---------------------------------------------------------------------------
// Das Gesetz hinter einer Zusage

/** Das Gesetz, das eine Zusage verlangt: Maßnahme, Zielstufe (bei benannten Zuständen der nächste Zustand), Preis und Aussicht. */
export function zusageVorhaben(w: World, z: { massnahme?: string; richtung?: number } | undefined) {
  if (!z?.massnahme || !z.richtung) return null;
  const id = z.massnahme;
  const jetzt = stufeIn(w, id, null);
  let ziel = clamp(Math.round(jetzt + 20 * z.richtung), 0, 100);
  let jetztName: string | undefined;
  let zielName: string | undefined;
  if (skalenArt(id) === "regime") {
    const sk = skala(id, jetzt);
    const heute = sk.stufen.reduce((b, st) => (Math.abs(st.w - jetzt) < Math.abs(b.w - jetzt) ? st : b), sk.stufen[0]!);
    const weiter = sk.stufen.filter((st) => (z.richtung! > 0 ? st.w > heute.w + 3 : st.w < heute.w - 3));
    const naechster = z.richtung > 0 ? weiter[0] : weiter[weiter.length - 1];
    if (naechster) {
      ziel = naechster.w;
      jetztName = heute.name;
      zielName = naechster.name;
    }
  }
  const pr = pruefeVorhaben(w, id, ziel, null);
  return { id, name: NET.nodes[NET.index.get(id)!]!.name, jetzt, ziel, jetztName, zielName, pr };
}

// ---------------------------------------------------------------------------
// Bezug: wem die Zusage gilt

export interface ZusageBezug {
  art: "person" | "fraktion" | "land" | "sonst";
  /** Figur-Kennung, Parteikürzel oder Land-Kennung */
  id?: string;
  name: string;
}

const LAND_ALIAS: Record<string, string> = { "EU-Kommission": "EU", "US-Regierung": "USA" };

export function zusageBezug(w: World, z: Zusage): ZusageBezug {
  const sp = w.spiel;
  const f = sp?.figuren.find((x) => x.partei === z.von);
  if (f) return { art: "person", id: f.id, name: f.name };
  if (w.parliament?.seats[z.von] !== undefined) return { art: "fraktion", id: z.von, name: z.von };
  const alias = LAND_ALIAS[z.von];
  const l = LAENDER.find((x) => x.id === alias || x.name === z.von || x.dat === z.von || x.akk === z.von || z.von.includes(x.name));
  if (l) return { art: "land", id: l.id, name: l.name };
  return { art: "sonst", name: z.von };
}

// ---------------------------------------------------------------------------
// Ansicht

export interface ZusageSicht {
  z: Zusage;
  bezug: ZusageBezug;
  /** Verbleibende Tage bis zur Fälligkeit (negativ: überfällig) */
  tage: number;
  datum: string;
  dringlichkeit: "ruhig" | "bald" | "dringend" | "ueberfaellig";
  fortschritt?: { name: string; start: number; jetzt: number; ziel: number; anteil: number; imParlament: boolean; zielName?: string };
  /** Was Halten und Brechen nach sich ziehen, in Worten mit Zahlen */
  gehalten: string[];
  gebrochen: string[];
  vertroesten?: { moeglich: boolean; text: string };
}

function folgen(w: World, z: Zusage, bezug: ZusageBezug): { gehalten: string[]; gebrochen: string[] } {
  const g: string[] = [t("sim2.sim.zusagen.3d8ae54")];
  const b: string[] = [t("sim2.sim.zusagen.1b1a60d")];
  if (bezug.art === "person") {
    g.push(t("sim2.sim.zusagen.2f35bd0", { p0: bezug.name }));
    b.push(t("sim2.sim.zusagen.5de0f5b", { p0: bezug.name }));
  }
  if (bezug.art === "fraktion" || bezug.art === "person") {
    g.push(`${z.von}: Bereitschaft zur Zusammenarbeit +10`);
    b.push(t("sim2.sim.zusagen.d5fe1ee", { p0: z.von }));
  }
  if (bezug.art === "land") {
    g.push(`${bezug.name}: Vertrauen +6`);
    b.push(t("sim2.sim.zusagen.894fe81", { p0: bezug.name }));
  }
  return { gehalten: g, gebrochen: b };
}

function dringlich(tage: number): ZusageSicht["dringlichkeit"] {
  return tage < 0 ? "ueberfaellig" : tage <= 14 ? "dringend" : tage <= 45 ? "bald" : "ruhig";
}

/** Legt Start- und Zielstufe einer Zusage fest, wenn sie noch fehlen (ältere Spielstände, Zusagen ohne Merker). */
export function zusagenPflege(w: World): void {
  for (const z of w.spiel?.zusagen ?? []) {
    if (z.erfuellt || z.gebrochen || !z.massnahme || !z.richtung) continue;
    if (z.stufeStart === undefined) z.stufeStart = Math.round(stufeIn(w, z.massnahme, null));
    if (z.stufeZiel === undefined) z.stufeZiel = zusageVorhaben(w, z)?.ziel ?? clamp(z.stufeStart + 20 * z.richtung, 0, 100);
  }
}

export function zusagenSicht(w: World): ZusageSicht[] {
  const sp = w.spiel;
  if (!sp) return [];
  zusagenPflege(w);
  return sp.zusagen
    .filter((z) => !z.erfuellt && !z.gebrochen)
    .sort((a, b) => a.faellig - b.faellig)
    .map((z): ZusageSicht => {
      const bezug = zusageBezug(w, z);
      const tage = z.faellig - w.day;
      const s: ZusageSicht = { z, bezug, tage, datum: addDays(sp.start.datum, z.faellig), dringlichkeit: dringlich(tage), ...folgen(w, z, bezug) };
      if (z.massnahme && z.richtung && z.stufeStart !== undefined && z.stufeZiel !== undefined) {
        const jetzt = stufeIn(w, z.massnahme, null);
        const spanne = z.stufeZiel - z.stufeStart;
        const v = zusageVorhaben(w, z);
        s.fortschritt = {
          name: NET.nodes[NET.index.get(z.massnahme)!]!.name,
          start: z.stufeStart,
          jetzt,
          ziel: z.stufeZiel,
          anteil: spanne === 0 ? 1 : clamp((jetzt - z.stufeStart) / spanne, 0, 1),
          imParlament: sp.gesetze.some((g) => g.massnahme === z.massnahme),
          ...(v?.zielName ? { zielName: v.zielName } : {}),
        };
      }
      const noch = 2 - (z.vertroestet ?? 0);
      s.vertroesten = noch > 0 ? { moeglich: kannZahlen(sp.kapital, 1), text: t("sim2.sim.zusagen.5acb3a8", { p0: noch === 2 ? t("sim2.sim.zusagen.if27342b") : t("sim2.sim.zusagen.ie79b9ec") }) } : { moeglich: false, text: t("sim2.sim.zusagen.fe9241f") };
      return s;
    });
}

// ---------------------------------------------------------------------------
// Glaubwürdigkeit

export interface ZusagenBilanz {
  gehalten: number;
  gebrochen: number;
  offen: number;
  vertroestet: number;
  /** 0 bis 100 */
  glaubwuerdigkeit: number;
  wort: string;
}

export function zusagenBilanz(w: World): ZusagenBilanz {
  const zs = w.spiel?.zusagen ?? [];
  const gehalten = zs.filter((z) => z.erfuellt).length;
  const gebrochen = zs.filter((z) => z.gebrochen).length;
  const offen = zs.filter((z) => !z.erfuellt && !z.gebrochen).length;
  const vertroestet = zs.reduce((a, z) => a + (z.vertroestet ?? 0), 0);
  const g = clamp(60 + 8 * gehalten - 15 * gebrochen - 3 * vertroestet, 0, 100);
  const wort = g >= 75 ? "verlässlich" : g >= 55 ? "ordentlich" : g >= 35 ? "angeschlagen" : "verspielt";
  return { gehalten, gebrochen, offen, vertroestet, glaubwuerdigkeit: g, wort };
}

/** Wer viel bricht, verliert monatlich Legitimität; wer verlässlich ist, gewinnt sie langsam. */
function glaubwuerdigkeitMonat(w: World): void {
  const b = zusagenBilanz(w);
  if (b.gehalten + b.gebrochen === 0) return;
  if (b.glaubwuerdigkeit < 40) wirke(w, "legitimitaet", -0.15);
  else if (b.glaubwuerdigkeit >= 80) wirke(w, "legitimitaet", 0.08);
}

// ---------------------------------------------------------------------------
// Abschluss und Folgen

/** Die Folgen einer erfüllten oder gebrochenen Zusage über die Akteure hinaus: Glaubwürdigkeit, Land, Erinnerung. Nur einmal je Zusage. */
export function zusageAbschluss(w: World, z: Zusage, art: "erfuellt" | "gebrochen"): void {
  if (z.abgeschlossen !== undefined) return;
  z.abgeschlossen = w.day;
  const bezug = zusageBezug(w, z);
  if (art === "erfuellt") {
    wirke(w, "legitimitaet", 0.6);
    wirke(w, "vertrauen_regierung", 0.3);
    if (bezug.art === "land") landAendern(w, bezug.id!, { vertrauen: 6 }, `Zusage gehalten: ${z.text}`);
  } else {
    wirke(w, "legitimitaet", -1.2);
    wirke(w, "vertrauen_regierung", -0.6);
    if (bezug.art === "land") landAendern(w, bezug.id!, { vertrauen: -12, konflikt: 4 }, `Zusage gebrochen: ${z.text}`);
  }
  const f = bezug.art === "person" ? w.spiel?.figuren.find((x) => x.id === bezug.id) : undefined;
  if (f) merke(w, f, art === "erfuellt" ? `Zusage gehalten: ${z.text}` : `Zusage gebrochen: ${z.text}`);
}

/** Erfasst Zusagen, die andere Teile des Spiels erfüllt oder gebrochen haben, ohne die Folgen zu buchen (etwa ein beschlossenes Gesetz). */
function nachbuchen(w: World): void {
  for (const z of w.spiel?.zusagen ?? []) {
    if (z.abgeschlossen === undefined && (z.erfuellt || z.gebrochen)) zusageAbschluss(w, z, z.erfuellt ? "erfuellt" : "gebrochen");
  }
}

export function zusagenMonat(w: World): void {
  zusagenPflege(w);
  nachbuchen(w);
  glaubwuerdigkeitMonat(w);
  // Vorgänge (sim/vorgaenge.ts): fehlende anlegen, dann den Monatsschritt rechnen
  vorgaengeMonat(w);
  vorgaengeSchritt(w);
}

// ---------------------------------------------------------------------------
// Handlungen: einlösen, vertrösten, brechen (auch außerhalb des Fälligkeits-Ereignisses)

const personZu = (w: World, z: Zusage): Figur | undefined => w.spiel?.figuren.find((x) => x.partei === z.von);

/** Löst eine Zusage ein: bringt das verlangte Gesetz ein oder gilt sie als erfüllt, wenn die Maßnahme schon dort steht. Kosten trägt das Gesetz. */
export function loeseZusageEin(w: World, z: Zusage): { ok: boolean; text: string } {
  const v = zusageVorhaben(w, z);
  const f = personZu(w, z);
  if (v) {
    if (!v.pr.ok) {
      // Eine Krisen-Sperre (MIL-3) ist keine Erfüllung: Die Zusage bleibt offen und wird später erneut versucht
      const gesperrt = v.pr.krisen.find((k) => k.art === "gesperrt");
      if (gesperrt) {
        z.faellig = w.day + 40;
        return { ok: false, text: t("sim2.sim.zusagen.8e76d02", { p0: v.pr.grund }) };
      }
      z.erfuellt = true;
      bereitschaftAendern(w, z.von, 10);
      zusageAbschluss(w, z, "erfuellt");
      return { ok: true, text: t("sim2.sim.zusagen.3acb1c7") };
    }
    // Die vereinbarte Zielstufe gilt, solange sie noch in die richtige Richtung führt
    const ziel = z.stufeZiel !== undefined && (z.stufeZiel - v.jetzt) * Math.sign(z.richtung ?? 1) > 0 ? z.stufeZiel : v.ziel;
    const r = bringeEin(w, v.id, ziel, null, "gesetz");
    if (!r.ok) {
      z.faellig = w.day + 40;
      return { ok: false, text: t("sim2.sim.zusagen.88c1008", { p0: r.text }) };
    }
    // Das Gesetz liegt jetzt im Parlament; die Zusage gilt als erfüllt, sobald es beschlossen ist
    z.faellig = w.day + REGELN.tageBisAbstimmung + 15;
  } else if (istMinisterienZusage(z)) {
    // Zugesagte Ministerien werden wirklich übergeben: neue Minister aus der Partei
    const vergeben = ministerienAnPartei(w, z.von, 2);
    if (vergeben.length === 0) return { ok: false, text: t("ressort.zusage.keins") };
    z.erfuellt = true;
    bereitschaftAendern(w, z.von, 10);
    zusageAbschluss(w, z, "erfuellt");
    if (f) loyalitaetVerschieben(f, 12);
    return { ok: true, text: t("ressort.zusage.ok", { partei: PARTEI_NAME[z.von] ?? z.von, ressorts: ressortNamen(vergeben) }) };
  } else {
    z.erfuellt = true;
    bereitschaftAendern(w, z.von, 10);
    zusageAbschluss(w, z, "erfuellt");
  }
  if (f) loyalitaetVerschieben(f, 12);
  return { ok: true, text: t("sim2.sim.zusagen.121b6d0") };
}

/** Vertröstet: drei Monate mehr, die Geduld sinkt. Der Preis in Kapital wird vom Aufrufer gebucht (Ereignis oder Oberfläche). */
export function vertroesteZusage(w: World, z: Zusage): string {
  z.faellig = w.day + 90;
  z.vertroestet = (z.vertroestet ?? 0) + 1;
  const f = personZu(w, z);
  if (f) {
    loyalitaetVerschieben(f, -8);
    grollVerschieben(w, f, 4);
    merke(w, f, t("sim2.sim.zusagen.ec4fc4f", { p0: z.text, p1: z.vertroestet }));
  }
  vertrauenAendern(w, -0.5);
  wirke(w, "legitimitaet", -0.2);
  return t("sim2.sim.zusagen.ac162c8");
}

/** Bricht die Zusage: Verbündete, Vertrauen und Glaubwürdigkeit leiden. */
export function brecheZusage(w: World, z: Zusage, verfall = false): string {
  z.gebrochen = true;
  bereitschaftAendern(w, z.von, verfall ? -20 : -25);
  const f = personZu(w, z);
  if (f) {
    loyalitaetVerschieben(f, verfall ? -15 : -25);
    grollVerschieben(w, f, verfall ? 12 : 20);
  }
  if (!verfall) vertrauenAendern(w, -1);
  zusageAbschluss(w, z, "gebrochen");
  addLog(w, "entscheidung", `Zusage gebrochen: ${z.text}`, t("sim2.sim.zusagen.4c39914"));
  return verfall ? t("sim2.sim.zusagen.26feba7") : t("sim2.sim.zusagen.ad79f58");
}

// ---------------------------------------------------------------------------
// Für die Oberfläche: Handlungen mit Kosten und Rückmeldung

export interface ZusageAntwort {
  ok: boolean;
  text: string;
  why?: string;
}

/** Löst eine Zusage ein. Hängt sie an einem Gesetz, trägt das Gesetz die Kosten; sonst kostet es 4 Kapital. */
export function loeseEin(w: World, z: Zusage): ZusageAntwort {
  const sp = w.spiel;
  if (!sp || z.erfuellt || z.gebrochen) return { ok: false, text: t("sim2.sim.zusagen.fd45097") };
  const v = zusageVorhaben(w, z);
  const pk = v ? 0 : 4;
  if (pk && !kannZahlen(sp.kapital, pk)) return { ok: false, text: t("sim2.sim.zusagen.183af97", { p0: pk, p1: Math.floor(sp.kapital) }) };
  const r = loeseZusageEin(w, z);
  if (r.ok && pk) sp.kapital -= pk;
  if (r.ok) addLog(w, "entscheidung", t("sim2.sim.zusagen.1e43ef2", { p0: z.text }), v && v.pr.ok ? t("sim2.sim.zusagen.48aa7ed") : undefined);
  return { ok: r.ok, text: r.text, ...(pk && r.ok ? { why: t("sim2.sim.zusagen.6ae7385", { p0: pk }) } : {}) };
}

/** Vertröstet gegen 1 Kapital, höchstens zweimal. */
export function vertroesteFrei(w: World, z: Zusage): ZusageAntwort {
  const sp = w.spiel;
  if (!sp || z.erfuellt || z.gebrochen) return { ok: false, text: t("sim2.sim.zusagen.fd45097") };
  if ((z.vertroestet ?? 0) >= 2) return { ok: false, text: t("sim2.sim.zusagen.fe9241f") };
  if (!kannZahlen(sp.kapital, 1)) return { ok: false, text: t("sim2.sim.zusagen.6555b2b") };
  sp.kapital -= 1;
  const text = vertroesteZusage(w, z);
  addLog(w, "entscheidung", `Zusage vertagt: ${z.text}`, t("sim2.sim.zusagen.834013c"));
  return { ok: true, text, why: t("sim2.sim.zusagen.347aa21") };
}

export function brecheFrei(w: World, z: Zusage): ZusageAntwort {
  if (z.erfuellt || z.gebrochen) return { ok: false, text: t("sim2.sim.zusagen.fd45097") };
  return { ok: true, text: brecheZusage(w, z) };
}

// Zusagen: Wem etwas versprochen wurde, bis wann, wie weit es ist, was Halten und Brechen kosten. Zusagen gehören zu Personen,
// Fraktionen und Ländern; wer sie hält, gewinnt Glaubwürdigkeit (Legitimität und Vertrauen im Politiknetz), wer sie bricht, verliert sie.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung).

import { NET } from "./modell";
import { clamp } from "./economy";
import { wirke, vertrauenAendern } from "./wirkung";
import { addLog } from "./log";
import { addDays, formatDateDe } from "./dates";
import { kannZahlen } from "./kapital";
import { PARTEI_NAME, bereitschaftAendern } from "./fraktionen";
import { bringeEin, pruefeVorhaben, stufeIn } from "./handeln";
import { skala, skalenArt, stufenName } from "../data/skalen";
import { grollVerschieben, loyalitaetVerschieben, merke } from "./personen";
import { istMinisterienZusage, ministerienAnPartei, ressortNamen } from "./ressortvergabe";
import { rendere, t } from "../i18n";
import { vorgaengeMonat, vorgaengeSchritt } from "./vorgaenge";
import { aktiveParteivorsitzende } from "./koalitionslage";
import { ZUSAGEN_VERFALL_LOYALITAET } from "./zusagendruck";
import type { World } from "./types";
import type { Zusage } from "./spiel-typen";
import { zusageBezug, zusageAbschluss, erfuelleZusage, schliesseZusageErinnerung, zusageZiel, zusageZielErreicht, zusageStufen, type ZusageBezug } from "./zusagenfolgen";
export { zusageBezug, zusageAbschluss } from "./zusagenfolgen";
export type { ZusageBezug } from "./zusagenfolgen";

// ---------------------------------------------------------------------------
// Das Gesetz hinter einer Zusage

/** Das Gesetz, das eine Zusage verlangt: Maßnahme, Zielstufe (bei benannten Zuständen der nächste Zustand), Preis und Aussicht. */
export function zusageVorhaben(w: World, z: Pick<Zusage, "massnahme" | "richtung" | "stufeStart" | "stufeZiel"> | undefined) {
  if (!z?.massnahme || !z.richtung) return null;
  const id = z.massnahme;
  const jetzt = stufeIn(w, id, null);
  const ziel = zusageZiel(z, jetzt);
  const fest = { ...z, stufeZiel: ziel };
  // Ein landesweiter Beschluss erfüllt die Gesetzeszusage bereits; seine Umsetzung dauert weiter.
  const erreicht = zusageZielErreicht(fest, w.net.targets[id] ?? jetzt);
  const gesetz = w.spiel?.gesetze.find(g => g.massnahme === id);
  const decktZiel = !!gesetz && !gesetz.provinzen?.length && zusageZielErreicht(fest, gesetz.stufe);
  const stufen = skalenArt(id) === "regime" ? skala(id, jetzt).stufen : [];
  const jetztName = stufen.length ? stufen.reduce((b, st) => Math.abs(st.w - jetzt) < Math.abs(b.w - jetzt) ? st : b, stufen[0]!).name : undefined;
  const zielName = stufen.find(st => st.w === ziel)?.name;
  const pr = pruefeVorhaben(w, id, ziel, null);
  return { id, name: NET.nodes[NET.index.get(id)!]!.name, jetzt, ziel, jetztName, zielName, erreicht, gesetz, decktZiel, pr };
}

// ---------------------------------------------------------------------------
// Bezug: wem die Zusage gilt

// ---------------------------------------------------------------------------
// Wortlaut in der aktuellen Sprache

/** Die vier Zusagen des Wahlprogramms tragen feste Kennungen; so erscheinen auch ältere Spielstände übersetzt. */
const START_ZUSAGEN = new Set(["z-ministerien", "z-friedensprozess", "z-renten", "z-vergaben"]);

/** Text einer Zusage in der aktuellen Sprache: gespeicherte Meldung, sonst feste Kennung, sonst der deutsche Wortlaut. */
export function zusageText(z: Pick<Zusage, "id" | "text" | "msg">): string {
  if (z.msg) return rendere(z.msg);
  if (START_ZUSAGEN.has(z.id)) return t(`zusage.start.${z.id}`);
  return z.text;
}

/** Absender einer Zusage in der aktuellen Sprache; Parteikürzel und Namen bleiben, wie sie sind. */
export function zusageVon(von: string): string {
  if (von === "Wähler") return t("zusage.von.waehler");
  if (von === "EU-Kommission") return t("zusage.von.eu");
  if (von === "US-Regierung") return t("zusage.von.usa");
  const d = /^Denkmalbehörde von (.+)$/.exec(von);
  if (d) return t("zusage.von.denkmal", { ort: d[1] });
  return von;
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
  gesetz?: { titel: string; text: string; aktion: string; gesperrt: boolean };
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
    g.push(t("zusage.folge.bereitschaft", { partei: z.von }));
    b.push(t("sim2.sim.zusagen.d5fe1ee", { p0: z.von }));
  }
  if (bezug.art === "land") {
    g.push(t("zusage.folge.land", { land: bezug.name }));
    b.push(t("sim2.sim.zusagen.894fe81", { p0: bezug.name }));
  }
  if (z.massnahme && z.richtung) g.push(t("zusage.gesetz.belohnung"));
  return { gehalten: g, gebrochen: b };
}

function dringlich(tage: number): ZusageSicht["dringlichkeit"] {
  return tage < 0 ? "ueberfaellig" : tage <= 14 ? "dringend" : tage <= 45 ? "bald" : "ruhig";
}

/** Legt Start- und Zielstufe einer Zusage fest, wenn sie noch fehlen (ältere Spielstände, Zusagen ohne Merker). */
export function zusagenPflege(w: World): void {
  for (const z of w.spiel?.zusagen ?? []) {
    if (z.erfuellt || z.gebrochen || !z.massnahme || !z.richtung) continue;
    Object.assign(z, zusageStufen(w, z));
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
        if (v) s.gesetz = {
          titel: t(v.erreicht ? "zusage.gesetz.bereit.titel" : v.gesetz ? "zusage.gesetz.beratung.titel" : "zusage.gesetz.offen.titel"),
          text: v.erreicht ? t("zusage.gesetz.bereit.text") : v.gesetz
            ? `${t("n9.zusage.beratung", { datum: formatDateDe(addDays(sp.start.datum, v.gesetz.abstimmung)), stufe: stufenName(z.massnahme, v.gesetz.stufe), ziel: stufenName(z.massnahme, v.ziel) })} ${t(v.decktZiel ? "zusage.gesetz.deckt" : "zusage.gesetz.teil")}`
            : `${t("n9.zusage.offen", { name: v.name, ziel: stufenName(z.massnahme, v.ziel), pk: v.pr.gesetz.pk })} ${t("zusage.gesetz.fristRegel")}`,
          aktion: t(v.erreicht ? "zusage.gesetz.verbuchen" : "zusage.gesetz.aktion"),
          gesperrt: !!v.gesetz && !v.erreicht,
        };
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
  const wort = t(`reste.glaubwuerdig.${g >= 75 ? "verlaesslich" : g >= 55 ? "ordentlich" : g >= 35 ? "angeschlagen" : "verspielt"}`);
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

/** Löst eine Zusage ein: bringt das verlangte Gesetz ein oder gilt sie als erfüllt, wenn die Maßnahme schon dort steht. Kosten trägt das Gesetz. */
export function loeseZusageEin(w: World, z: Zusage): { ok: boolean; text: string } {
  if (z.erfuellt || z.gebrochen || z.abgeschlossen !== undefined) return { ok: false, text: t("sim2.sim.zusagen.fd45097") };
  const v = zusageVorhaben(w, z);
  if (v) {
    if (v.erreicht) {
      Object.assign(z, zusageStufen(w, z));
      erfuelleZusage(w, z);
      return { ok: true, text: t("zusage.gesetz.erreicht") };
    }
    if (v.gesetz) return { ok: false, text: t("zusage.gesetz.laeuft") };
    if (!v.pr.ok) {
      return { ok: false, text: t("sim2.sim.zusagen.8e76d02", { p0: v.pr.grund }) };
    }
    const r = bringeEin(w, v.id, v.ziel, null, "gesetz");
    if (!r.ok) {
      return { ok: false, text: t("sim2.sim.zusagen.88c1008", { p0: r.text }) };
    }
    return { ok: true, text: `${t("zusage.gesetz.eingebracht")} ${t("zusage.gesetz.fristDanach", { datum: formatDateDe(addDays(w.date, z.faellig - w.day)) })}` };
  }
  if (istMinisterienZusage(z)) {
    const vergeben = ministerienAnPartei(w, z.von, 2);
    if (vergeben.length === 0) return { ok: false, text: t("ressort.zusage.keins") };
    erfuelleZusage(w, z);
    return { ok: true, text: t("ressort.zusage.ok", { partei: PARTEI_NAME[z.von] ?? z.von, ressorts: ressortNamen(vergeben) }) };
  }
  erfuelleZusage(w, z);
  return { ok: true, text: t("sim2.sim.zusagen.121b6d0") };
}

/** Vertröstet: drei Monate mehr, die Geduld sinkt. Der Preis in Kapital wird vom Aufrufer gebucht (Ereignis oder Oberfläche). */
export function vertroesteZusage(w: World, z: Zusage): string {
  z.faellig = w.day + 90;
  schliesseZusageErinnerung(w, z);
  z.vertroestet = (z.vertroestet ?? 0) + 1;
  for(const f of aktiveParteivorsitzende(w,z.von)) {
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
  if (z.erfuellt || z.gebrochen) return t("sim2.sim.zusagen.fd45097");
  z.gebrochen = true;
  schliesseZusageErinnerung(w, z);
  bereitschaftAendern(w, z.von, verfall ? -20 : -25);
  for(const f of aktiveParteivorsitzende(w,z.von)) {
    loyalitaetVerschieben(f, verfall ? -ZUSAGEN_VERFALL_LOYALITAET : -25);
    grollVerschieben(w, f, verfall ? 12 : 20);
  }
  if (!verfall) vertrauenAendern(w, -1);
  zusageAbschluss(w, z, "gebrochen");
  addLog(w, "entscheidung", t("protokoll.zusage.gebrochen", { text: z.text }), t("sim2.sim.zusagen.4c39914"));
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
  if (r.ok) addLog(w, "entscheidung", t(z.erfuellt ? "sim2.sim.zusagen.1e43ef2" : "zusage.gesetz.log", { p0: z.text }), !z.erfuellt ? t("zusage.gesetz.belohnung") : undefined);
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
  addLog(w, "entscheidung", t("protokoll.zusage.vertagt", { text: z.text }), t("sim2.sim.zusagen.834013c"));
  return { ok: true, text, why: t("sim2.sim.zusagen.347aa21") };
}

export function brecheFrei(w: World, z: Zusage): ZusageAntwort {
  if (z.erfuellt || z.gebrochen) return { ok: false, text: t("sim2.sim.zusagen.fd45097") };
  return { ok: true, text: brecheZusage(w, z) };
}

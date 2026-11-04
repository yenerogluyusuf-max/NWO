// TEMPORÄR: Prüf-Durchläufe Krieg (wird nach dem Lauf gelöscht)
import { describe, test } from "vitest";
import { createWorld, advance } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { aktiveKriege, eigenStaerke, fuehreKriegHandlungAus, gegnerStaerke, handlungenFuer, kriegMit, kriege, paketAnnahme, PAKETE, waehleZielraum, waffenruheFuerAngebot } from "../src/sim/krieg";
import { waehleEinsatz } from "../src/sim/kriegsschauplatz";
import { weltZustand, LAENDER, fuehreAktionAus, aktionenFuer } from "../src/sim/laender";
import { nationalAverage } from "../src/sim/netz";
import { NET } from "../src/sim/modell";
import type { World } from "../src/sim/types";
import type { KriegVorgang } from "../src/sim/krieg-typen";

const r1 = (x: number) => Math.round(x * 10) / 10;
const kn = (w: World, id: string) => r1(nationalAverage(NET, w.net, id));

function welt(seed = 7): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  return w;
}

function zeile(w: World, k: KriegVorgang | undefined, tag = "") {
  const e = w.economy;
  const sp = w.spiel!;
  return [
    tag.padEnd(8),
    w.date,
    k ? `${k.phase}`.padEnd(11) : "-".padEnd(11),
    k ? `esk ${r1(k.eskalation)}` : "",
    k ? `front ${r1(k.front)} uhr ${r1(k.uhr)} uhrG ${r1(k.uhrGegner)} wo ${k.woche} gef ${k.gefallene ?? 0}` : "",
    k ? `E ${r1(eigenStaerke(w, k))} G ${r1(gegnerStaerke(w, k.land))}` : "",
    `zust ${r1(sp.umfrage.zustimmung)} kap ${r1(sp.kapital)}`,
    `wachs ${r1(e.growth)} risk ${Math.round(e.riskPremium)} schuld ${r1(e.debtRatio)} defiz ${r1(e.deficit)} infl ${r1(e.inflation)} usdTry ${r1(e.usdTry)}`,
    k?.regionen ? `reg ${Object.entries(k.regionen).filter(([, v]) => v !== "gegner").map(([a, v]) => a + ":" + v[0]).join(",")}` : "",
  ].join(" | ");
}

function entscheideEreignisse(w: World, log: string[]) {
  // Waffenruhe-Angebote annehmen, alles andere liegen lassen
  for (const ev of [...w.spiel!.ereignisse]) {
    if (ev.vorlage === "krieg_waffenruhe") {
      log.push("  ANGEBOT Waffenruhe -> " + waffenruheFuerAngebot(w, String(ev.daten?.vorgang)));
      w.spiel!.ereignisse = w.spiel!.ereignisse.filter((x) => x !== ev);
    }
  }
}

function tu(w: World, k: KriegVorgang, id: string, log: string[]) {
  const h = handlungenFuer(w, k.id).find((x) => x.id === id);
  const r = fuehreKriegHandlungAus(w, k.id, id as never);
  log.push(`  TAT ${id}: ok=${r.ok} (${h ? (h.moeglich ? "möglich" : "nicht: " + h.grund) : "nicht angeboten"}) -> ${r.text}`);
  return r;
}

function kriegsVerlauf(w: World, k: KriegVorgang, log: string[], wochenMax = 80) {
  for (let i = 0; i < wochenMax; i++) {
    advance(w, 7);
    entscheideEreignisse(w, log);
    if (i % 4 === 0 || k.phase !== "krieg") log.push(zeile(w, k, `W${k.woche}`));
    if (k.phase === "waffenruhe") {
      const ang = Object.keys(PAKETE).map((p) => {
        const def = PAKETE[p]!;
        return `${p}:${paketAnnahme(w, k, def.paket(k.front))}%`;
      });
      log.push("  Pakete: " + ang.join(" ") + " | angeboten: " + handlungenFuer(w, k.id).map((h) => h.id).join(","));
      const wahl = ["paket_sieg", "paket_ausgewogen", "paket_weiss", "paket_zugestaendnis"].find((p) => handlungenFuer(w, k.id).some((h) => h.id === p) && paketAnnahme(w, k, PAKETE[p]!.paket(k.front)) >= 50);
      if (wahl) {
        tu(w, k, wahl, log);
        log.push(zeile(w, k, "FRIEDEN"));
        log.push("  Besatzung: " + JSON.stringify(w.spiel!.besatzung ?? []));
        log.push("  Ausgang: " + k.ausgang + " Friedenspreis " + k.friedenspreis);
        break;
      } else {
        log.push("  kein Paket ≥50 %, warte");
      }
    }
    if (k.phase === "beendet" || k.phase === "frieden") {
      log.push("  ENDE: " + k.ausgang);
      break;
    }
  }
  // Nachlauf 6 Monate
  for (let m = 0; m < 6; m++) {
    advance(w, 30);
    log.push(zeile(w, k, `nach+${m + 1}`));
  }
  log.push("  Koalition: " + JSON.stringify(k.koalition ? { agg: k.koalition.aggressor, partner: k.koalition.partner.map((p) => p.id + (p.pflicht ? "*" : "") + ":" + p.seite), abw: k.koalition.abwesend.filter((a) => a.pflicht).map((a) => a.id + ":" + a.seite) } : null));
  log.push("  Sanktionen: " + JSON.stringify((w.spiel as any).aussen?.sanktionen ?? (w.spiel as any).sanktionen ?? "?"));
  log.push(`  Offiziersvertrauen ${kn(w, "offiziersvertrauen")} Truppenmoral ${kn(w, "truppenmoral")} Ansehen ${kn(w, "ansehen")} Bez.EU ${kn(w, "beziehungen_eu")} Bez.USA ${kn(w, "beziehungen_usa")}`);
}

describe("Prüfung Krieg", () => {
  test("0: Startlage und natürlicher Lauf ohne Eingriff (24 Monate)", () => {
    const w = welt();
    const log: string[] = [];
    log.push("Start-Konflikt: " + LAENDER.map((l) => `${l.id}=${Math.round(weltZustand(w)[l.id]!.konflikt)}`).join(" "));
    log.push(zeile(w, undefined, "start"));
    for (let m = 0; m < 24; m++) {
      advance(w, 30);
      const ks = kriege(w).map((k) => `${k.land}:${k.phase}:esk${r1(k.eskalation)}${k.ausgang ? ":" + k.ausgang : ""}`).join(" ");
      log.push(`${w.date} Kriege: [${ks}] konflikt CYP=${Math.round(weltZustand(w).CYP!.konflikt)} ISR=${Math.round(weltZustand(w).ISR!.konflikt)} GRC=${Math.round(weltZustand(w).GRC!.konflikt)} | offene Ereignisse: ${w.spiel!.ereignisse.map((e) => e.vorlage).join(",")}`);
    }
    console.log("\n=== LAUF 0 ===\n" + log.join("\n"));
  }, 600_000);

  test("A1: Türkei beginnt Krieg gegen Griechenland (Weg über Druck, sonst gesetzt)", () => {
    const w = welt();
    const log: string[] = [];
    log.push(zeile(w, undefined, "start"));
    // Versuch: Konflikt über die Länderaktion „Druck“ hochtreiben
    for (let m = 0; m < 12 && (weltZustand(w).GRC!.konflikt < 73 || !kriegMit(w, "GRC")); m++) {
      const a = aktionenFuer(w, "GRC").find((x) => x.id === "druck");
      if (a?.moeglich) log.push("  Druck auf GRC: " + fuehreAktionAus(w, "GRC", "druck").text);
      advance(w, 30);
      log.push(`  ${w.date} GRC-Konflikt ${r1(weltZustand(w).GRC!.konflikt)} Vorgang ${kriegMit(w, "GRC")?.phase ?? "-"}`);
    }
    let k = kriegMit(w, "GRC");
    if (!k) {
      log.push("  -> Druck reicht in 12 Monaten nicht: Konflikt wird für den Test auf 80 gesetzt");
      weltZustand(w).GRC!.konflikt = 80;
      advance(w, 31);
      k = kriegMit(w, "GRC");
    }
    if (!k) { console.log(log.join("\n")); return; }
    log.push(zeile(w, k, "spann"));
    for (let d = 0; d < 200 && k.phase === "spannung"; d += 5) { weltZustand(w).GRC!.konflikt = Math.max(weltZustand(w).GRC!.konflikt, 85); advance(w, 5); }
    log.push(zeile(w, k, "droh"));
    log.push("  Handlungen: " + handlungenFuer(w, k.id).map((h) => `${h.id}(${h.pk}${h.moeglich ? "" : ",X"})`).join(" "));
    w.spiel!.kapital = Math.max(w.spiel!.kapital, 80);
    tu(w, k, "ziel_schutz", log);
    log.push("  Zielraum: " + waehleZielraum(w, k.id, "grc_inseln").text);
    log.push("  Einsatz: " + waehleEinsatz(w, k, "see").text);
    tu(w, k, "mobil_teil", log);
    const hb = handlungenFuer(w, k.id).find((h) => h.id === "beschluss");
    log.push("  Beschluss-Hinweis: " + hb?.hinweis);
    tu(w, k, "beschluss", log);
    advance(w, 8);
    log.push(zeile(w, k, "abst"));
    if (k.phase !== "krieg") {
      log.push("  Parlament hat abgelehnt/Phase " + k.phase + " -> Erlass");
      tu(w, k, "beschluss_erlass", log);
    }
    log.push(zeile(w, k, "W0"));
    kriegsVerlauf(w, k, log);
    console.log("\n=== LAUF A1 (GRC) ===\n" + log.join("\n"));
  }, 600_000);

  test("A2: Türkei beginnt Krieg in Nordsyrien (Grenzstreifen, Boden)", () => {
    const w = welt(11);
    const log: string[] = [];
    log.push(zeile(w, undefined, "start"));
    weltZustand(w).SYR!.konflikt = 80;
    advance(w, 31);
    const k = kriegMit(w, "SYR");
    if (!k) { log.push("kein Vorgang"); console.log(log.join("\n")); return; }
    for (let d = 0; d < 200 && k.phase === "spannung"; d += 5) { weltZustand(w).SYR!.konflikt = Math.max(weltZustand(w).SYR!.konflikt, 85); advance(w, 5); }
    log.push(zeile(w, k, "droh"));
    w.spiel!.kapital = Math.max(w.spiel!.kapital, 80);
    tu(w, k, "ziel_verteidigung", log);
    log.push("  Zielraum: " + waehleZielraum(w, k.id, "syr_grenzstreifen").text);
    log.push("  Einsatz: " + waehleEinsatz(w, k, "boden").text);
    tu(w, k, "mobil_voll", log);
    tu(w, k, "beschluss", log);
    advance(w, 8);
    log.push(zeile(w, k, "abst"));
    if (k.phase !== "krieg") tu(w, k, "beschluss_erlass", log);
    log.push(zeile(w, k, "W0"));
    kriegsVerlauf(w, k, log);
    console.log("\n=== LAUF A2 (SYR) ===\n" + log.join("\n"));
  }, 600_000);

  test("B: Iran greift an (Eskalation über die Angriffsschwelle), NATO-Bündnisfall?", () => {
    const w = welt(5);
    const log: string[] = [];
    weltZustand(w).IRN!.konflikt = 99;
    advance(w, 31);
    const k = kriegMit(w, "IRN");
    if (!k) { log.push("kein Vorgang"); console.log(log.join("\n")); return; }
    for (let d = 0; d < 300 && k.phase !== "krieg"; d += 5) { weltZustand(w).IRN!.konflikt = 99; advance(w, 5); if (d % 30 === 0) log.push(zeile(w, k, "eskal")); }
    log.push(zeile(w, k, "ANGRIFF"));
    log.push("  Koalition beim Angriff: " + JSON.stringify(k.koalition ? { agg: k.koalition.aggressor, partner: k.koalition.partner.map((p) => p.id + (p.pflicht ? "*" : "") + ":" + p.seite + ":" + p.einsatz), abwesendPflicht: k.koalition.abwesend.filter((a) => a.pflicht).map((a) => `${a.id}:${a.seite}:${a.zoegert ? "zögert" : "nein"}:${Math.round(a.punkte)}`) } : null));
    log.push("  Handlungen: " + handlungenFuer(w, k.id).map((h) => `${h.id}(${h.moeglich ? "" : "X"})`).join(" "));
    tu(w, k, "mobil_voll", log);
    tu(w, k, "koalition_rufen", log);
    kriegsVerlauf(w, k, log);
    console.log("\n=== LAUF B (IRN greift an) ===\n" + log.join("\n"));
  }, 600_000);
});

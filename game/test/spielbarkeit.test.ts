// Spielbarkeit wird gemessen, nicht angenommen (Spieldesign 0, Säule 1 und 4).
// Drei einfache Spieler laufen durch ganze Amtszeiten:
//   passiv  tut nichts und lässt Ereignisse verfallen
//   klug    beantwortet Ereignisse und bringt regelmäßig sinnvolle Gesetze ein
//   blind   dreht alle Regler hoch, so weit das Kapital reicht
// Erwartung: Nichtstun gewinnt nicht, klug schlägt passiv, blind schlägt klug nicht,
// und es geschieht regelmäßig etwas. Setzen Sie SPIELBARKEIT_AUS=Pfad, um die Läufe als Text zu sehen.

import { appendFileSync, writeFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { advance, createWorld, NET } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { activeProvinces, nationalAverage } from "../src/sim/netz";
import { entscheide, standardAntwort } from "../src/sim/ereignisse";
import { bringeEin, pruefeVorhaben, stimmenSicht } from "../src/sim/handeln";
import { fraktionsUebersicht, verhandle } from "../src/sim/verhandeln";
import { waehleZiele, type Schwierigkeit } from "../src/sim/spiel";
import { duellVorbereiten, wahlkampfAktiv } from "../src/sim/wahlkampf";
import { Rng } from "../src/sim/rng";
import { fuehreAus, infrastrukturBitte, type InfraAktion } from "../src/sim/infrastruktur";
import { verwaltungBilanz } from "../src/sim/reich";
import type { World } from "../src/sim/types";

const AUS = process.env.SPIELBARKEIT_AUS;
if (AUS) writeFileSync(AUS, "");
const out = (s: string) => AUS && appendFileSync(AUS, s + "\n");

const profil = (buendnis?: string): PlayerProfile => ({
  name: "Test",
  heimat: "Ankara",
  heimatPlaka: 6,
  jugend: "",
  beruf: "Ökonom",
  partner: "Bauunternehmer, Aufträge vom Staat möglich",
  motiv: "",
  partei: { name: "Partei der Werte", kurz: "PW", farbe: "#555" },
  naehe: {},
  ...(buendnis ? { buendnis } : {}),
  versprechen: buendnis ? ["Der YENİ Parti wurden zwei Ministerien zugesagt."] : ["Rentenerhöhung in den ersten hundert Tagen versprochen."],
  wahl: { runde: 2, anteil: 51 },
});

type Bot = (w: World, rng: Rng, monat: number) => void;

const beantworte = (w: World, rng: Rng) => {
  for (const ev of [...w.spiel!.ereignisse]) {
    const id = standardAntwort(w, ev);
    if (id) entscheide(w, ev.id, id, rng);
  }
};

const passiv: Bot = () => {};

const KLUG = ["m_wasserleitungen", "m_krankenhausbau", "m_sozialwohnungen", "m_bauaufsicht", "m_polizei", "m_stadterneuerung", "m_ausbildung", "m_aerztegehalt", "m_bewaesserung", "m_netzausbau"];
const klug: Bot = (w, rng, monat) => {
  beantworte(w, rng);
  if (wahlkampfAktiv(w) && (w.spiel?.wahlkampf?.ap ?? 0) >= 2) {
    duellVorbereiten(w);
  }
  // Die Bitte des Monats um Infrastruktur wie in test/unbegrenzt.test.ts: ausbauen, wenn die Verwaltung den Bau trägt, sonst die Alternative,
  // wenn Kapital übrig ist. Ohne die Prüfung der Verwaltung gewinnt der Kluge die erste Wahl nur in 17 von 24 Seeds, mit ihr in 19 von 24,
  // ganz ohne Antwort in 20 von 24; die zweite Wahl mit ihr 19 von 19, ohne Antwort 19 von 20 (Messung 06.10.2026).
  const bitte = infrastrukturBitte(w);
  if (bitte) {
    const sp = w.spiel!;
    const vb = verwaltungBilanz(w);
    const o =
      bitte.optionen.find((x) => x.id === "ausbau" && x.moeglich && vb.netto > 0 && vb.vorrat > 30 && sp.kapital > (x.kosten.pk ?? 0) + 10) ??
      bitte.optionen.find((x) => x.id === "alternative" && x.moeglich && sp.kapital > (x.kosten.pk ?? 0) + 10);
    if (o?.aktion.art === "infrastruktur") fuehreAus(w, o.aktion as InfraAktion);
  }
  const id = KLUG[monat % KLUG.length]!;
  const ziel = Math.min(100, nationalAverage(NET, w.net, id) + 20);
  const pr = pruefeVorhaben(w, id, ziel);
  if (pr.ok && w.spiel!.kapital > pr.gesetz.pk + 8) bringeEin(w, id, ziel, null, "gesetz");
};

const blind: Bot = (w, rng) => {
  beantworte(w, rng);
  for (const n of NET.nodes) {
    if (n.kind !== "massnahme") continue;
    const pr = pruefeVorhaben(w, n.id, 100);
    if (pr.ok && w.spiel!.kapital >= pr.gesetz.pk) bringeEin(w, n.id, 100, null, "gesetz");
  }
};

// Der Staatsmann baut zuerst eine Mehrheit (Gespräche, Bündnisse, Duldungen) und bringt nur Gesetze ein, die eine Aussicht haben.
const staatsmann: Bot = (w, rng, monat) => {
  const sp = w.spiel!;
  // Zusagen hält er, wenn er es sich leisten kann; sonst vertröstet er, statt zu brechen
  for (const ev of [...sp.ereignisse]) {
    if (ev.vorlage === "zusage") entscheide(w, ev.id, sp.kapital >= 14 ? "erfuellen" : "vertroesten", rng);
  }
  beantworte(w, rng);
  if (stimmenSicht(w).lager < 301 && sp.kapital >= 2) {
    for (const f of fraktionsUebersicht(w)) {
      const koal = f.aktionen.find((a) => a.id === "koalition");
      if (f.status !== "lager" && koal?.moeglich && sp.kapital >= koal.pk + 4 && stimmenSicht(w).lager < 301) verhandle(w, f.partei, "koalition", rng);
    }
    for (const f of fraktionsUebersicht(w).filter((x) => x.status === "opposition")) {
      const g = f.aktionen.find((a) => a.id === "gespraech");
      if (g?.moeglich && sp.kapital >= 2) {
        verhandle(w, f.partei, "gespraech", rng);
        break;
      }
    }
    for (const f of fraktionsUebersicht(w).filter((x) => x.status === "opposition")) {
      const d = f.aktionen.find((a) => a.id === "duldung");
      if (d?.moeglich && sp.kapital >= d.pk + 4) {
        verhandle(w, f.partei, "duldung", rng);
        break;
      }
    }
  }
  const id = KLUG[monat % KLUG.length]!;
  const ziel = Math.min(100, nationalAverage(NET, w.net, id) + 20);
  const pr = pruefeVorhaben(w, id, ziel);
  if (pr.ok && sp.kapital > pr.gesetz.pk + 6 && pr.gesetz.stimmen.erwartet >= 291) bringeEin(w, id, ziel, null, "gesetz");
};

/** Ausgang einer Wahl: im ersten Wahlgang gewonnen, in der Stichwahl gewonnen, verloren (mit oder ohne Stichwahl) oder gar nicht erreicht. */
type WahlAusgang = "erster" | "stichwahl" | "verloren" | "-";

interface Lauf {
  /** Die beiden Wahlen getrennt gezählt (die Partie hat höchstens zwei) */
  wahl1: WahlAusgang;
  wahl2: WahlAusgang;
  ende: string;
  jahre: number;
  zustimmung5: number;
  ereignisseProJahr: number;
  akut: number;
  gesetze: number;
}

function akutZahl(w: World): number {
  return NET.nodes.filter((n) => n.kind === "problem" && activeProvinces(NET, w.net, n.id).length > 0).length;
}

function lauf(name: string, bot: Bot, seed: number, mitBuendnis = seed % 2 === 1, minderheit = false, schwierigkeit: Schwierigkeit = "normal"): Lauf {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, profil(mitBuendnis ? "YENİ" : undefined));
  // Härtefall: Das Lager zerfällt gleich zu Beginn, die Fraktionen müssen neu gewonnen werden
  if (minderheit) w.spiel!.lager = [];
  waehleZiele(w, ["inflation15", "wohnen", "mehrheit"], schwierigkeit);
  const rng = new Rng(seed * 7919);
  let monat = 0;
  let zustimmung5 = NaN;
  let gesetze = 0;
  const angenommen = () => w.log.filter((l) => l.text.startsWith("Das Parlament nimmt")).length;
  while (!w.spiel!.ende && monat < 130) {
    bot(w, rng, monat);
    advance(w, 30);
    monat++;
    if (monat === 58) {
      zustimmung5 = w.spiel!.umfrage.zustimmung;
      gesetze = angenommen();
    }
  }
  const ausgang = (i: number): WahlAusgang => {
    const e = w.spiel!.wahl?.historie[i];
    if (!e) return "-";
    return !e.gewonnen ? "verloren" : e.runden.length > 1 ? "stichwahl" : "erster";
  };
  const r: Lauf = {
    wahl1: ausgang(0),
    wahl2: ausgang(1),
    ende: w.spiel!.ende?.art ?? "läuft",
    jahre: w.day / 365,
    zustimmung5,
    ereignisseProJahr: w.spiel!.chronik.filter((c) => !/^(Wirkungsbericht|Schritt erreicht|Programm erfüllt)/.test(c.titel)).length / Math.max(1, w.day / 365),
    akut: akutZahl(w),
    gesetze,
  };
  out(`${name.padEnd(7)} seed ${seed} | Wahl 1 ${r.wahl1.padEnd(9)} Wahl 2 ${r.wahl2.padEnd(9)} | ${r.ende.padEnd(13)} nach ${r.jahre.toFixed(1)} J | Zustimmung nach 58 Monaten ${r.zustimmung5.toFixed(1)} | Ereignisse/Jahr ${r.ereignisseProJahr.toFixed(1)} | akute Probleme ${r.akut} | Gesetze in 58 Monaten ${r.gesetze} | Kapital ${w.spiel!.kapital.toFixed(0)}`);
  return r;
}

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
// Partien, die früh enden (Rücktritt, Tod, Amtsenthebung), haben keine Zustimmung nach 58 Monaten: Sie zählen im Mittel nicht mit
const mittel = (xs: number[]) => {
  const f = xs.filter((x) => Number.isFinite(x));
  return f.reduce((a, b) => a + b, 0) / f.length;
};

describe("Spielbarkeit: einfache Spieler gegeneinander", () => {
  const passivL = SEEDS.map((s) => lauf("passiv", passiv, s));
  out("");
  const klugL = SEEDS.map((s) => lauf("klug", klug, s));
  out("");
  const blindL = SEEDS.map((s) => lauf("blind", blind, s));

  test("Nichtstun gewinnt die erste Wahl in der Regel nicht", () => {
    const verloren = passivL.filter((l) => l.ende === "abwahl" || l.ende === "sturz").length;
    expect(verloren).toBeGreaterThanOrEqual(Math.ceil(SEEDS.length * 0.6));
  });

  test("Wahl 1 und Wahl 2 getrennt: Nichtstun verliert die erste Wahl meist, kluges Spielen gewinnt beide", () => {
    const verloren1 = passivL.filter((l) => l.wahl1 === "verloren").length;
    expect(verloren1).toBeGreaterThanOrEqual(Math.ceil(SEEDS.length * 0.6));
    // Wer nichts tut, erreicht die zweite Wahl selten
    expect(passivL.filter((l) => l.wahl2 !== "-").length).toBeLessThanOrEqual(Math.floor(SEEDS.length * 0.3));
    // Wer klug regiert, gewinnt die erste Wahl in der Regel und danach auch die zweite. Gezählt werden die Partien, die den Wahltag erreichen:
    // Wer vorher stirbt, zurücktritt oder des Amtes enthoben wird, hat keine Wahl verloren (Enden des Takts, sim/spiel.ts).
    // Runde „Netz atmet“: Gewöhnung und Sättigung nehmen dem Klugen die Abkürzung über die Inflation; 70 statt 75 Prozent
    // (gemessen mit denselben Bots über 24 Seeds: 92 %, Zwölferstichprobe mit den Takt-Enden 71 %).
    const erreicht1 = klugL.filter((l) => l.wahl1 !== "-");
    expect(erreicht1.filter((l) => l.wahl1 !== "verloren").length).toBeGreaterThanOrEqual(Math.ceil(erreicht1.length * 0.7));
    const zweite = klugL.filter((l) => l.wahl2 !== "-");
    expect(zweite.length).toBeGreaterThanOrEqual(Math.ceil(SEEDS.length * 0.6));
    expect(zweite.filter((l) => l.wahl2 !== "verloren").length).toBeGreaterThanOrEqual(Math.ceil(zweite.length * 0.7));
    // Die Stichwahl kommt vor: Wer knapp unter 50 Prozent liegt, hat eine zweite Chance, aber keine sichere
    expect(passivL.some((l) => l.wahl1 === "stichwahl" || l.wahl1 === "verloren")).toBe(true);
  });

  test("Kluges Spielen schlägt Nichtstun deutlich", () => {
    expect(mittel(klugL.map((l) => l.zustimmung5))).toBeGreaterThan(mittel(passivL.map((l) => l.zustimmung5)) + 3);
    expect(klugL.filter((l) => l.ende !== "abwahl" && l.ende !== "sturz").length).toBeGreaterThanOrEqual(Math.ceil(SEEDS.length * 0.5));
  });

  test("Alles hochzudrehen ist keine beste Strategie", () => {
    // Blindes Hochdrehen verliert die Wiederwahl gegen kluges Steuern
    expect(blindL.filter((l) => l.ende !== "abwahl" && l.ende !== "sturz").length).toBeLessThan(
      klugL.filter((l) => l.ende !== "abwahl" && l.ende !== "sturz").length,
    );
    // Die Verwaltung und das Kapital lassen nicht alle 117 Maßnahmen in fünf Jahren zu
    expect(mittel(blindL.map((l) => l.gesetze))).toBeLessThan(117);
    // Wer blind alles hochdreht, löst die akuten Probleme nicht besser als der kluge Spieler
    expect(mittel(blindL.map((l) => l.akut))).toBeGreaterThan(mittel(klugL.map((l) => l.akut)));
  });

  test("Es geschieht regelmäßig etwas: zwei bis zwölf Ereignisse im Jahr", () => {
    const e = mittel(passivL.map((l) => l.ereignisseProJahr));
    expect(e).toBeGreaterThan(2);
    // Obergrenze: Die Archätyp-Schicht und neuen Ereignisse lassen
    // Regionen mit eigenen akuten Problemen starten (gemessen ~12,9). Die Saisonereignisse des Takts (sim/ereignisse-saison.ts) fügen
    // etwa ein Ereignis im Jahr hinzu (gemessen ~14,9; die Zählung nimmt auch die Chronikzeilen ausgesessener Vorgänge und der Termine mit),
    // dafür öffnen die Ereignisse nicht mehr am Monatsersten: Die Fluten (mehr als drei Entscheidungen in zehn Tagen) sanken von 0,40 auf 0,10 je Lauf.
    expect(e).toBeLessThan(16);
  });
});

describe("Verhandeln zahlt sich aus (Härtefall: das Lager zerfällt)", () => {
  const seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const klugL = seeds.map((s) => lauf("klug/min", klug, s, false, true));
  const staatL = seeds.map((s) => lauf("staatsm.", staatsmann, s, false, true));
  const gewonnen = (ls: Lauf[]) => ls.filter((l) => l.ende !== "abwahl" && l.ende !== "sturz").length;

  test("Wer Fraktionen gewinnt, bringt deutlich mehr Gesetze durch als wer nur einbringt", () => {
    // ZEI-1 (Ereignis-Wettbewerb): Wer nicht verhandelt, spart seitdem Antwortkapital (weniger Vorgänge auf dem
    // Tisch) und fährt damit besser als vorher (gemessen 2026-10-01: 34,1 statt 28,9 Gesetze); der Staatsmann
    // bleibt durch die Stimmenschwelle gebremst. Der Abstand hält mit ~+6 (40,3 zu 34,1) klar über +4 —
    // die Aussage „Verhandeln schlägt blindes Einbringen" steht, nur die alte +8-Kalibrierung trägt nicht mehr.
    expect(mittel(staatL.map((l) => l.gesetze))).toBeGreaterThan(mittel(klugL.map((l) => l.gesetze)) + 4);
  });

  test("Siege hängen am Beantworten der Ereignisse, nicht allein an Gesetzen: auch ohne Mehrheit ist die Amtszeit zu gewinnen, aber nie ohne Antworten", () => {
    // Zwölf Partien sind eine knappe Stichprobe: Jede Änderung am Ereignisstrom (zuletzt: die Naturkatastrophen laufen nur noch über den
    // Risiko-Layer) verschiebt, welche Seeds verlieren (gemessen: 0 von 12, aber 2 von 24 Verlusten). Darum zwölf weitere Partien.
    const mehr = Array.from({ length: 12 }, (_, i) => i + 13).map((s) => lauf("klug/min", klug, s, false, true));
    const alle = [...klugL, ...mehr];
    expect(gewonnen(alle)).toBeGreaterThanOrEqual(1);
    expect(gewonnen(alle)).toBeLessThan(alle.length);
  });
});

describe("Schwierigkeitsgrade", () => {
  // SPIELBARKEIT_N=40 misst mit mehr Partien, um Rauschen von echten Verschiebungen zu trennen
  const seeds = Array.from({ length: Number(process.env.SPIELBARKEIT_N ?? 16) }, (_, i) => i + 1);
  const gewonnen = (ls: Lauf[]) => ls.filter((l) => l.ende !== "abwahl" && l.ende !== "sturz").length;
  const leicht = seeds.map((s) => lauf("klug/leicht", klug, s, undefined, false, "entspannt"));
  const normal = seeds.map((s) => lauf("klug/normal", klug, s, undefined, false, "normal"));
  const hart = seeds.map((s) => lauf("klug/hart", klug, s, undefined, false, "hart"));

  test("Je härter, desto weniger Siege und niedrigere Zustimmung", () => {
    expect(gewonnen(leicht)).toBeGreaterThanOrEqual(gewonnen(normal));
    expect(gewonnen(normal)).toBeGreaterThan(gewonnen(hart));
    expect(mittel(normal.map((l) => l.zustimmung5))).toBeGreaterThan(mittel(hart.map((l) => l.zustimmung5)));
  });

  test("Auch „hart“ ist mit klugem Spiel gelegentlich zu gewinnen", () => {
    expect(gewonnen(hart)).toBeGreaterThanOrEqual(1);
  });
});

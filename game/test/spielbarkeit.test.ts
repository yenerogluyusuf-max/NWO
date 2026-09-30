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
import { Rng } from "../src/sim/rng";
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

interface Lauf {
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
  const r: Lauf = {
    ende: w.spiel!.ende?.art ?? "läuft",
    jahre: w.day / 365,
    zustimmung5,
    ereignisseProJahr: w.spiel!.chronik.filter((c) => !/^(Wirkungsbericht|Schritt erreicht|Programm erfüllt)/.test(c.titel)).length / Math.max(1, w.day / 365),
    akut: akutZahl(w),
    gesetze,
  };
  out(`${name.padEnd(7)} seed ${seed} | ${r.ende.padEnd(13)} nach ${r.jahre.toFixed(1)} J | Zustimmung nach 58 Monaten ${r.zustimmung5.toFixed(1)} | Ereignisse/Jahr ${r.ereignisseProJahr.toFixed(1)} | akute Probleme ${r.akut} | Gesetze in 58 Monaten ${r.gesetze} | Kapital ${w.spiel!.kapital.toFixed(0)}`);
  return r;
}

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
const mittel = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

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

  test("Kluges Spielen schlägt Nichtstun deutlich", () => {
    expect(mittel(klugL.map((l) => l.zustimmung5))).toBeGreaterThan(mittel(passivL.map((l) => l.zustimmung5)) + 3);
    expect(klugL.filter((l) => l.ende !== "abwahl" && l.ende !== "sturz").length).toBeGreaterThanOrEqual(Math.ceil(SEEDS.length * 0.5));
  });

  test("Alles hochzudrehen ist keine beste Strategie", () => {
    expect(mittel(blindL.map((l) => l.zustimmung5))).toBeLessThan(mittel(klugL.map((l) => l.zustimmung5)));
    // Die Verwaltung und das Kapital lassen nicht alle 90 Maßnahmen in fünf Jahren zu
    expect(mittel(blindL.map((l) => l.gesetze))).toBeLessThan(90);
    // Wer blind alles hochdreht, löst die akuten Probleme nicht besser als der kluge Spieler
    expect(mittel(blindL.map((l) => l.akut))).toBeGreaterThan(mittel(klugL.map((l) => l.akut)));
  });

  test("Es geschieht regelmäßig etwas: zwei bis elf Ereignisse im Jahr", () => {
    const e = mittel(passivL.map((l) => l.ereignisseProJahr));
    expect(e).toBeGreaterThan(2);
    expect(e).toBeLessThan(11);
  });
});

describe("Verhandeln zahlt sich aus (Härtefall: das Lager zerfällt)", () => {
  const seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const klugL = seeds.map((s) => lauf("klug/min", klug, s, false, true));
  const staatL = seeds.map((s) => lauf("staatsm.", staatsmann, s, false, true));
  const gewonnen = (ls: Lauf[]) => ls.filter((l) => l.ende !== "abwahl" && l.ende !== "sturz").length;

  test("Wer Fraktionen gewinnt, bringt deutlich mehr Gesetze durch als wer nur einbringt", () => {
    expect(mittel(staatL.map((l) => l.gesetze))).toBeGreaterThan(mittel(klugL.map((l) => l.gesetze)) + 8);
  });

  test("Siege hängen am Beantworten der Ereignisse, nicht allein an Gesetzen: auch ohne Mehrheit ist die Amtszeit zu gewinnen, aber nie ohne Antworten", () => {
    expect(gewonnen(klugL)).toBeGreaterThanOrEqual(1);
    expect(gewonnen(klugL)).toBeLessThan(seeds.length);
  });
});

describe("Schwierigkeitsgrade", () => {
  // SPIELBARKEIT_N=40 misst mit mehr Partien, um Rauschen von echten Verschiebungen zu trennen
  const seeds = Array.from({ length: Number(process.env.SPIELBARKEIT_N ?? 8) }, (_, i) => i + 1);
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

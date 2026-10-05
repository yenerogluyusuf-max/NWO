// Logik-Audit vom 29.09.2026: Bots über sieben Startprofile (passiv, klug, Staatsmann) und Ereignishäufigkeit je Vorlage.
// Zum Ausführen nach game/test/zz_audit.test.ts kopieren und starten mit:  AUDIT_AUS=/pfad/audit.txt npx vitest run test/zz_audit.test.ts ; danach wieder löschen (die Datei schreibt in AUDIT_AUS und gehört nicht in die reguläre Suite).
import { appendFileSync, writeFileSync } from "node:fs";
import { describe, test } from "vitest";
import { advance, createWorld, NET } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { activeProvinces, nationalAverage } from "../src/sim/netz";
import { entscheide, standardAntwort } from "../src/sim/ereignisse";
import { bringeEin, gesetzSicht, pruefeVorhaben, stimmenSicht } from "../src/sim/handeln";
import { fraktionsUebersicht, verhandle } from "../src/sim/verhandeln";
import { waehleZiele } from "../src/sim/spiel";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";

const AUS = process.env.AUDIT_AUS!;
writeFileSync(AUS, "");
const out = (s: string) => appendFileSync(AUS, s + "\n");

const profil = (kurz: string, buendnis?: string): PlayerProfile => ({
  name: "Test", heimat: "Ankara", heimatPlaka: 6, jugend: "", beruf: "Ökonom", partner: "Bauunternehmer, Aufträge vom Staat möglich", motiv: "",
  partei: { name: kurz, kurz, farbe: "#555" }, naehe: {}, ...(buendnis ? { buendnis } : {}),
  versprechen: buendnis ? [`Der ${buendnis} wurden zwei Ministerien zugesagt.`] : [], wahl: { runde: 2, anteil: 51 },
});

type Bot = (w: World, rng: Rng, monat: number) => void;
const beantworte = (w: World, rng: Rng) => { for (const ev of [...w.spiel!.ereignisse]) { const id = standardAntwort(w, ev); if (id) entscheide(w, ev.id, id, rng); } };
const KLUG = ["m_wasserleitungen", "m_krankenhausbau", "m_sozialwohnungen", "m_bauaufsicht", "m_polizei", "m_stadterneuerung", "m_ausbildung", "m_aerztegehalt", "m_bewaesserung", "m_netzausbau"];

const passiv: Bot = () => {};
const klug: Bot = (w, rng, monat) => {
  beantworte(w, rng);
  const id = KLUG[monat % KLUG.length]!;
  const ziel = Math.min(100, nationalAverage(NET, w.net, id) + 20);
  const pr = pruefeVorhaben(w, id, ziel);
  if (pr.ok && w.spiel!.kapital > pr.gesetz.pk + 8) bringeEin(w, id, ziel, null, "gesetz");
};
// Verhandelnder Bot: baut zuerst eine Mehrheit, bringt nur Gesetze ein, die eine Aussicht haben
const staatsmann: Bot = (w, rng, monat) => {
  beantworte(w, rng);
  const sp = w.spiel!;
  if (stimmenSicht(w).lager < 301 && sp.kapital >= 2) {
    const fs = fraktionsUebersicht(w).filter((f) => f.status !== "lager");
    for (const f of fs) {
      const koal = f.aktionen.find((a) => a.id === "koalition");
      if (koal?.moeglich && sp.kapital >= koal.pk + 4 && stimmenSicht(w).lager < 301) { verhandle(w, f.partei, "koalition", rng); continue; }
    }
    for (const f of fraktionsUebersicht(w).filter((x) => x.status === "opposition")) {
      const g = f.aktionen.find((a) => a.id === "gespraech");
      if (g?.moeglich && sp.kapital >= 2) { verhandle(w, f.partei, "gespraech", rng); break; }
    }
    for (const f of fraktionsUebersicht(w).filter((x) => x.status === "opposition")) {
      const d = f.aktionen.find((a) => a.id === "duldung");
      if (d?.moeglich && sp.kapital >= d.pk + 4) { verhandle(w, f.partei, "duldung", rng); break; }
    }
  }
  const id = KLUG[monat % KLUG.length]!;
  const ziel = Math.min(100, nationalAverage(NET, w.net, id) + 20);
  const pr = pruefeVorhaben(w, id, ziel);
  if (pr.ok && sp.kapital > pr.gesetz.pk + 6 && pr.gesetz.stimmen.erwartet >= 301 - 10) bringeEin(w, id, ziel, null, "gesetz");
  // Zusagen halten: fällige erfüllen wird über Ereignisse beantwortet (standardAntwort wählt die erste Option)
};

const BOTS: Record<string, Bot> = { passiv, klug, staatsmann };

function lauf(profilName: string, kurz: string, bund: string | undefined, botName: string, seed: number) {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, profil(kurz, bund));
  waehleZiele(w, ["inflation15", "wohnen", "mehrheit"]);
  const rng = new Rng(seed * 7919);
  const bot = BOTS[botName]!;
  const s0 = stimmenSicht(w);
  const kapitalPfad: number[] = [];
  let monat = 0;
  while (!w.spiel!.ende && monat < 130) {
    bot(w, rng, monat);
    advance(w, 30);
    monat++;
    if (monat % 6 === 0) kapitalPfad.push(Math.round(w.spiel!.kapital));
  }
  const log = w.log;
  const angenommen = log.filter((l) => l.text.startsWith("Das Parlament nimmt")).length;
  const abgelehnt = log.filter((l) => l.text.startsWith("Das Parlament lehnt")).length;
  const eingebracht = log.filter((l) => l.text.startsWith("Gesetzentwurf")).length;
  const zus = w.spiel!.zusagen;
  out(`${profilName.padEnd(12)} ${botName.padEnd(10)} s${seed} | Lager ${String(s0.lager).padStart(3)} erw. ${String(s0.erwartet).padStart(3)} → ${String(stimmenSicht(w).lager).padStart(3)} | ${w.spiel!.ende?.art.padEnd(12) ?? "läuft".padEnd(12)} ${(w.day / 365).toFixed(1)}J Z${w.spiel!.umfrage.zustimmung.toFixed(0)} | Gesetze ein ${eingebracht} an ${angenommen} ab ${abgelehnt} | Ereignisse ${w.spiel!.chronik.length} | Zusagen ${zus.filter(z=>z.erfuellt).length}✓ ${zus.filter(z=>z.gebrochen).length}✗ | Kapital-Pfad ${kapitalPfad.join(" ")}`);
}

describe("häufigkeit", () => {
  test("ereignisse je vorlage", () => {
    const zaehl: Record<string, number> = {};
    let jahre = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const w = createWorld(turkey2026, seed);
      startAfterElection(w, profil("AP"));
      const rng = new Rng(seed * 31);
      let m = 0;
      while (!w.spiel!.ende && m < 60) { passiv(w, rng, m); advance(w, 30); m++; }
      jahre += w.day / 365;
      for (const c of w.spiel!.chronik) zaehl[c.titel] = (zaehl[c.titel] ?? 0) + 1;
    }
    out("=== Ereignisse je Titel (passiv, 6 Läufe, " + jahre.toFixed(1) + " Jahre) ===");
    for (const [t, n] of Object.entries(zaehl).sort((a, b) => b[1] - a[1])) out(`${String(n).padStart(3)}  ${(n / jahre).toFixed(2)}/Jahr  ${t}`);
  }, 600000);
});

describe("audit", () => {
  test("läufe", () => {
    const PROFILE: [string, string, string | undefined][] = [
      ["AP allein", "AP", undefined], ["AP+YENİ", "AP", "YENİ"], ["PG allein", "PG", undefined], ["PG+MHP", "PG", "MHP"],
      ["PW allein", "PW", undefined], ["PW+YENİ", "PW", "YENİ"], ["PR allein", "PR", undefined],
    ];
    for (const [n, k, b] of PROFILE) for (const bot of ["passiv", "klug", "staatsmann"]) for (const seed of [1, 2, 3]) lauf(n, k, b, bot, seed);
  }, 600000);
});

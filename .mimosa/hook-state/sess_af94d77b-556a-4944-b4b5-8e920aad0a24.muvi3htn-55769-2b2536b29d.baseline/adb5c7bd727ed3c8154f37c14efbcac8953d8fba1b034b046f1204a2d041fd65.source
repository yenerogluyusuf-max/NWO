// Das Belastungs-/Aufmerksamkeitskonto: Verbrauch und Aufladung, die drei Stufen, die Zwangspause
// (blockt neue Vorgänge, nie das Laufende), der Zusammenbruch nach anhaltender Überlastung,
// die Migration alter Spielstände und der Determinismus der Mechanik.

import { describe, expect, test } from "vitest";
import { advance, createWorld, load, NET } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil, type PlayerProfile } from "../src/sim/prolog";
import { bringeEin, stimmenKaufen, stimmenSicht } from "../src/sim/handeln";
import { fuehreGespraech, planeGespraech } from "../src/sim/gespraeche";
import { verhandle } from "../src/sim/verhandeln";
import { beginne, quittiereFeier, reichZustand } from "../src/sim/reich";
import { starteSchritt } from "../src/sim/programme";
import {
  AUFMERKSAMKEIT_KOSTEN,
  VERFASSUNG,
  belastungEreignis,
  belastungsTreiber,
  hashWert,
  neuanfangGrund,
  stufeVon,
  verfassungVon,
} from "../src/sim/aufmerksamkeit";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";

const profil: PlayerProfile = {
  name: "Test",
  heimat: "Ankara",
  heimatPlaka: 6,
  jugend: "",
  beruf: "",
  partner: "Bauunternehmer, Aufträge vom Staat möglich",
  motiv: "",
  partei: { name: "Partei der Werte", kurz: "PW", farbe: "#2e6b3f" },
  naehe: {},
  buendnis: "YENİ",
  versprechen: ["Rentenerhöhung in den ersten hundert Tagen versprochen."],
  wahl: { runde: 2, anteil: 51 },
};

function spiel(seed = 5): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, profil);
  w.spiel!.ereignisse = [];
  return w;
}

const mehrheit = (w: World) => {
  w.spiel!.lager = Object.keys(w.parliament!.seats);
};

/** Eine Maßnahme, die sich einbringen lässt, und ob sie bei diesem Stand verzögert würde. */
function vorhabenUndVerzug(w: World): { id: string; verzug: boolean }[] {
  const ids = ["m_mindestlohn", "m_krankenhausbau", "m_solar_wind", "m_autobahnen", "m_bahn", "m_breitband", "m_wasserleitungen", "m_stadterneuerung"];
  return ids.map((id) => ({ id, verzug: hashWert(`${w.seed}|${w.day}|${id}|verzug`) < VERFASSUNG.verzugChance }));
}

describe("Aufmerksamkeit: Verbrauch und Aufladung", () => {
  test("Startet bei 80 Aufmerksamkeit und 10 Belastung", () => {
    const w = spiel();
    const v = verfassungVon(w);
    expect(v.aufmerksamkeit).toBe(VERFASSUNG.startAufmerksamkeit);
    expect(v.belastung).toBe(VERFASSUNG.startBelastung);
    expect(v.stufe).toBe(0);
  });

  test("Ein Gesetz kostet Aufmerksamkeit zusätzlich zum Kapital", () => {
    const w = spiel();
    mehrheit(w);
    const r = bringeEin(w, "m_mindestlohn", 75, null, "gesetz");
    expect(r.ok).toBe(true);
    expect(verfassungVon(w).aufmerksamkeit).toBe(VERFASSUNG.startAufmerksamkeit - AUFMERKSAMKEIT_KOSTEN.gesetz);
  });

  test("Gespräch, Verhandlung, Reich-Vorhaben und Programmschritt kosten gestaffelt Aufmerksamkeit", () => {
    const w = spiel();
    const figur = w.spiel!.figuren.find((f) => f.amt === "finanzen")!;
    const p = planeGespraech(w, figur.id, "sorge", "vertrauen");
    expect("ansatz" in p && !p.grund).toBe(true);
    fuehreGespraech(w, figur.id, "sorge", "vertrauen");
    expect(verfassungVon(w).aufmerksamkeit).toBe(VERFASSUNG.startAufmerksamkeit - AUFMERKSAMKEIT_KOSTEN.gespraech);

    const partei = Object.keys(w.parliament!.seats).find((x) => x !== "PW" && x !== "YENİ")!;
    const v0 = verfassungVon(w).aufmerksamkeit;
    const r = verhandle(w, partei, "gespraech", new Rng(1));
    expect(r.ok).toBe(true);
    expect(verfassungVon(w).aufmerksamkeit).toBe(v0 - AUFMERKSAMKEIT_KOSTEN.verhandlungGespraech);

    const vorher = verfassungVon(w).aufmerksamkeit;
    const b = beginne(w, "restaurierung_ephesos");
    if (b.ok) expect(verfassungVon(w).aufmerksamkeit).toBe(vorher - AUFMERKSAMKEIT_KOSTEN.reichVorhaben);
  });

  test("Stimmenkauf als Teil eines laufenden Gesetzes kostet wenig Aufmerksamkeit", () => {
    const w = spiel();
    w.spiel!.lager = [];
    w.spiel!.kapital = 100;
    bringeEin(w, "m_mindestlohn", 75, null, "gesetz");
    const vorher = verfassungVon(w).aufmerksamkeit;
    const r = stimmenKaufen(w, w.spiel!.gesetze[0]!.id, 4);
    expect(r.ok).toBe(true);
    expect(verfassungVon(w).aufmerksamkeit).toBe(vorher - AUFMERKSAMKEIT_KOSTEN.stimmenkauf);
  });

  test("Lädt sich täglich um 3 auf und nie über 100", () => {
    const w = spiel();
    const v = verfassungVon(w);
    v.aufmerksamkeit = 50;
    advance(w, 1);
    expect(v.aufmerksamkeit).toBe(53);
    v.aufmerksamkeit = 99;
    advance(w, 3);
    expect(v.aufmerksamkeit).toBe(100);
  });

  test("Überziehen bis null ist erlaubt und treibt die Belastung", () => {
    const w = spiel();
    const v = verfassungVon(w);
    v.aufmerksamkeit = 5;
    mehrheit(w);
    const r = bringeEin(w, "m_mindestlohn", 75, null, "gesetz");
    expect(r.ok).toBe(true); // kein hartes Verbot durch das Konto
    expect(v.aufmerksamkeit).toBe(0);
    const b0 = v.belastung;
    advance(w, 2); // 0 und 3 liegen unter 20: Überlastung +2 je Tag
    expect(v.belastung).toBe(b0 + 2 * VERFASSUNG.erschoepfungProTag);
    expect(belastungsTreiber(w).some((t) => t.text.includes("Aufmerksamkeit"))).toBe(true);
  });

  test("Hohe Aufmerksamkeit baut Belastung ab", () => {
    const w = spiel();
    const v = verfassungVon(w);
    v.aufmerksamkeit = 90;
    v.belastung = 30;
    advance(w, 3);
    expect(v.belastung).toBe(30 - 3 * VERFASSUNG.erholungProTag);
  });
});

describe("Belastung: Stufen und Chronik", () => {
  test("Stufen folgen den Schwellen 40 und 70", () => {
    expect(stufeVon(10)).toBe(0);
    expect(stufeVon(39.9)).toBe(0);
    expect(stufeVon(40)).toBe(1);
    expect(stufeVon(69.9)).toBe(1);
    expect(stufeVon(70)).toBe(2);
  });

  test("Der Wechsel auf „angespannt“ steht in der Chronik, Erholung auch", () => {
    const w = spiel();
    const v = verfassungVon(w);
    v.belastung = 46; // nach der Erholung des Tages: 45, noch angespannt
    advance(w, 1);
    expect(v.stufe).toBe(1);
    expect(w.spiel!.chronik.some((c) => c.titel.includes("angespannt"))).toBe(true);
    // Zurück unter 40: der Eintrag zur Erholung folgt
    v.aufmerksamkeit = 100;
    advance(w, 8);
    expect(v.belastung).toBeLessThan(40);
    expect(v.stufe).toBe(0);
    expect(w.spiel!.chronik.some((c) => c.titel.includes("erholt"))).toBe(true);
  });

  test("Angespannt streut die Stimmenschätzung breiter", () => {
    const w = spiel();
    w.spiel!.lager = [];
    const ruhig = stimmenSicht(w);
    verfassungVon(w).belastung = 50;
    verfassungVon(w).stufe = 1;
    const angespannt = stimmenSicht(w);
    expect(angespannt.high - angespannt.low).toBeGreaterThan(ruhig.high - ruhig.low);
  });

  test("Angespannt verzögert manche Einbringung, deterministisch", () => {
    const w = spiel();
    mehrheit(w);
    const v = verfassungVon(w);
    v.belastung = 50;
    v.stufe = 1;
    let mit: { ok: boolean; text: string } | undefined;
    let ohne: { ok: boolean; text: string } | undefined;
    for (const f of vorhabenUndVerzug(w)) {
      if (mit && ohne) break;
      const r = bringeEin(w, f.id, 80, null, "gesetz");
      if (!r.ok) continue;
      if (f.verzug && !mit) mit = r;
      if (!f.verzug && !ohne) ohne = r;
    }
    expect(mit?.ok).toBe(true);
    expect(mit!.text).toContain(`in ${21 + VERFASSUNG.verzugTage} Tagen`);
    expect(ohne?.ok).toBe(true);
    expect(ohne!.text).toContain("in 21 Tagen");
  });

  test("Sturz-Warnung und Eskalation treiben die Belastung als Treiber", () => {
    const w = spiel();
    belastungEreignis(w, VERFASSUNG.sturzWarnung, "Die Warnung vor dem Sturz");
    belastungEreignis(w, VERFASSUNG.eskalation, "Eskalation: Der Anschlag");
    const v = verfassungVon(w);
    expect(v.belastung).toBe(VERFASSUNG.startBelastung + VERFASSUNG.sturzWarnung + VERFASSUNG.eskalation);
    const treiber = belastungsTreiber(w);
    expect(treiber[0]!.text).toContain("Sturz");
    expect(treiber.some((t) => t.text.includes("Eskalation"))).toBe(true);
  });
});

describe("Zwangspause", () => {
  /** Belastung über 70 bringen und den Tag laufen lassen, bis die Pause steht. */
  function ueberlastet(w: World): void {
    const v = verfassungVon(w);
    v.aufmerksamkeit = 50; // keine Erholung über Nacht
    v.belastung = 72;
    advance(w, 1);
  }

  test("Überlastung erzwingt drei ruhige Tage mit ehrlicher Meldung", () => {
    const w = spiel();
    ueberlastet(w);
    const v = verfassungVon(w);
    expect(v.stufe).toBe(2);
    expect(v.pauseBis).toBe(w.day + VERFASSUNG.pauseTage);
    expect(w.spiel!.hinweise.some((h) => h.titel.includes("ruhigen Tag"))).toBe(true);
    expect(w.spiel!.chronik.some((c) => c.titel === "Überlastung")).toBe(true);
    expect(neuanfangGrund(w)).toContain("ruhigen Tag");
  });

  test("blockt neue Vorgänge, aber nie das Laufende", () => {
    const w = spiel();
    mehrheit(w);
    // Ein laufendes Gesetz, das während der Pause abstimmen muss
    const r0 = bringeEin(w, "m_mindestlohn", 75, null, "gesetz");
    expect(r0.ok).toBe(true);
    ueberlastet(w);
    // Neu: gesperrt
    expect(bringeEin(w, "m_krankenhausbau", 80, null, "gesetz").ok).toBe(false);
    expect(bringeEin(w, "m_krankenhausbau", 80, null, "gesetz").text).toContain("ruhigen Tag");
    const figur = w.spiel!.figuren.find((f) => f.amt === "finanzen")!;
    expect(fuehreGespraech(w, figur.id, "sorge", "vertrauen").ok).toBe(false);
    const partei = Object.keys(w.parliament!.seats).find((x) => x !== "PW" && x !== "YENİ")!;
    expect(verhandle(w, partei, "gespraech", new Rng(1)).ok).toBe(false);
    const b = beginne(w, "restaurierung_ephesos");
    expect(b.ok).toBe(false);
    expect(b.text).toContain("ruhigen Tag");
    // Laufend: die Abstimmung geschieht trotzdem
    advance(w, 25);
    expect(w.log.some((l) => l.text.startsWith("Das Parlament nimmt „Mindestlohn“"))).toBe(true);
    // Nach der Pause geht es wieder
    expect(neuanfangGrund(w)).toBeUndefined();
    expect(bringeEin(w, "m_krankenhausbau", 80, null, "gesetz").ok).toBe(true);
  });

  test("Programmschritte warten während der Pause, laufende laufen weiter", () => {
    const w = spiel();
    w.spiel!.kapital = 100;
    // „Haushaltsdisziplin verkünden“ hat keine Vorbedingung
    const gestartet = starteSchritt(w, "preise1");
    expect(gestartet.ok).toBe(true);
    ueberlastet(w);
    expect(starteSchritt(w, "preise1").ok).toBe(false); // läuft schon, und Pause gilt
    advance(w, 35); // der laufende Schritt geht fertig
    expect(w.spiel!.programm?.fertig).toContain("preise1");
  });
});

describe("Zusammenbruch", () => {
  test("über 85 über dreißig Tage: Zusammenbruch mit Pause und Folgen", () => {
    const w = spiel();
    const v = verfassungVon(w);
    v.aufmerksamkeit = 0;
    v.belastung = 86;
    const figur = w.spiel!.figuren.find((f) => f.imAmt)!;
    const loy0 = figur.loyalitaet;
    advance(w, VERFASSUNG.zusammenbruchTage);
    expect(w.spiel!.chronik.some((c) => c.titel === "Zusammenbruch")).toBe(true);
    expect(w.spiel!.hinweise.some((h) => h.titel === "Zusammenbruch")).toBe(true);
    expect(v.belastung).toBe(VERFASSUNG.belastungNachBruch);
    expect(v.ueberlastTage).toBe(0);
    expect(v.pauseBis).toBeGreaterThan(w.day); // die erzwungene Ruhe läuft noch
    expect(figur.loyalitaet).toBeLessThan(loy0);
    expect(neuanfangGrund(w)).toContain("ruhigen Tag");
  });

  test("Fällt die Belastung rechtzeitig, bleibt der Zusammenbruch aus", () => {
    const w = spiel();
    const v = verfassungVon(w);
    v.aufmerksamkeit = 0;
    v.belastung = 86;
    advance(w, 10);
    expect(v.ueberlastTage).toBe(10);
    v.belastung = 80; // unter der Schwelle: der Zähler beginnt von vorn
    advance(w, 1);
    expect(v.ueberlastTage).toBe(0);
    advance(w, 40);
    expect(w.spiel!.chronik.some((c) => c.titel === "Zusammenbruch")).toBe(false);
  });
});

describe("Feier und Erholung", () => {
  test("Eine Fertigstellungs-Feier senkt die Belastung", () => {
    const w = spiel();
    const v = verfassungVon(w);
    v.belastung = 40;
    const z = reichZustand(w);
    z.feier.push("restaurierung_ephesos");
    quittiereFeier(w, "restaurierung_ephesos");
    expect(v.belastung).toBe(40 - VERFASSUNG.feierErloesung);
    expect(z.feier).toHaveLength(0);
  });
});

describe("Migration und Determinismus", () => {
  test("Ein Spielstand ohne Konto lädt mit den Startwerten", () => {
    const w = createWorld(turkey2026, 9);
    startAfterElection(w, schnellProfil());
    advance(w, 100);
    delete w.spiel!.verfassung;
    const geladen = load(JSON.stringify(w));
    const v = geladen.spiel!.verfassung!;
    expect(v.aufmerksamkeit).toBe(VERFASSUNG.startAufmerksamkeit);
    expect(v.belastung).toBe(VERFASSUNG.startBelastung);
    expect(v.stufe).toBe(0);
    // und die Partie spielt weiter
    advance(geladen, 60);
    expect(Number.isFinite(geladen.spiel!.verfassung!.aufmerksamkeit)).toBe(true);
    expect(Number.isFinite(geladen.spiel!.verfassung!.belastung)).toBe(true);
  });

  test("Beschädigte Werte (NaN wurde zu null) werden repariert", () => {
    const w = createWorld(turkey2026, 11);
    startAfterElection(w, schnellProfil());
    advance(w, 30);
    w.spiel!.verfassung!.aufmerksamkeit = NaN;
    w.spiel!.verfassung!.belastung = NaN;
    const geladen = load(JSON.stringify(w));
    expect(geladen.spiel!.verfassung!.aufmerksamkeit).toBe(VERFASSUNG.startAufmerksamkeit);
    expect(geladen.spiel!.verfassung!.belastung).toBe(VERFASSUNG.startBelastung);
  });

  test("Gleicher Same, gleiche Handlungen: dasselbe Konto", () => {
    const laufe = (seed: number): string => {
      const w = spiel(seed);
      mehrheit(w);
      bringeEin(w, "m_mindestlohn", 75, null, "gesetz");
      const figur = w.spiel!.figuren.find((f) => f.amt === "finanzen")!;
      fuehreGespraech(w, figur.id, "sorge", "vertrauen");
      advance(w, 40);
      return JSON.stringify(w.spiel!.verfassung);
    };
    expect(laufe(7)).toBe(laufe(7));
  });
});

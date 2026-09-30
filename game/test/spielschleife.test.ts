// Die Spielschleife: Ortsbezug, Kapital, Parlament, Kapazität, Ereignisse, Wahl, Ende, Speichern.

import { describe, expect, test } from "vitest";
import { advance, createWorld, load, save, NET, setPolicy } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { nationalAverage, PROVINCES } from "../src/sim/netz";
import { bringeEin, erlassMoeglich, offeneVorhaben, pruefeVorhaben, REGELN, stimmenKaufen, stimmenSicht, ueberlast } from "../src/sim/handeln";
import { ansicht, entscheide, oeffne } from "../src/sim/ereignisse";
import { erstelleBilanz } from "../src/sim/bilanz";
import { waehleZiele } from "../src/sim/spiel";
import { Rng } from "../src/sim/rng";
import { wertIn } from "../src/sim/wirkung";
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
  // Erste-Tag-Vorgänge erledigen, damit sie die Tests nicht stören
  w.spiel!.ereignisse = [];
  return w;
}

const mehrheit = (w: World) => {
  w.spiel!.lager = Object.keys(w.parliament!.seats);
};
const keineMehrheit = (w: World) => {
  w.spiel!.lager = [];
};
const stufe = (w: World, id: string, plaka: number) => w.net.values[NET.index.get(id)! * PROVINCES + plaka - 1]!;

describe("Ortsbezug: Bau vor Ort", () => {
  test("Eine regionale Maßnahme bewegt nur die genannten Provinzen", () => {
    const w = spiel();
    const vorher = stufe(w, "m_wasserleitungen", 1);
    setPolicy(w, "m_wasserleitungen", 90, [31]);
    advance(w, 30 * 30);
    expect(stufe(w, "m_wasserleitungen", 31)).toBe(90);
    expect(stufe(w, "m_wasserleitungen", 1)).toBeCloseTo(vorher, 5);
    expect(w.net.ziele?.m_wasserleitungen).toBeUndefined(); // erreicht, aufgeräumt
  });

  test("Die Wirkung ist vor Ort größer als anderswo", () => {
    const w = spiel();
    const w0 = spiel();
    setPolicy(w, "m_wasserleitungen", 95, [31]);
    advance(w, 36 * 30);
    advance(w0, 36 * 30);
    const hatay = wertIn(w, "wasserversorgung", [31]) - wertIn(w0, "wasserversorgung", [31]);
    const adana = wertIn(w, "wasserversorgung", [1]) - wertIn(w0, "wasserversorgung", [1]);
    expect(hatay).toBeGreaterThan(3);
    expect(hatay).toBeGreaterThan(adana + 3);
  });

  test("Ein Landesziel und ein Ortsziel für dieselbe Maßnahme kämpfen nicht gegeneinander", () => {
    const w = spiel();
    setPolicy(w, "m_wasserleitungen", 70);
    setPolicy(w, "m_wasserleitungen", 95, [31]);
    advance(w, 40 * 30);
    expect(stufe(w, "m_wasserleitungen", 31)).toBe(95);
    expect(stufe(w, "m_wasserleitungen", 1)).toBe(70);
  });

  test("Ein landesweiter Beschluss überschreibt Ortsziele", () => {
    const w = spiel();
    setPolicy(w, "m_wasserleitungen", 95, [31]);
    setPolicy(w, "m_wasserleitungen", 60);
    advance(w, 40 * 30);
    expect(stufe(w, "m_wasserleitungen", 31)).toBeCloseTo(60, 5);
  });

  test("Kosten und Kapital eines kleinen Ortes sind kleiner als die des ganzen Landes", () => {
    const w = spiel();
    const land = pruefeVorhaben(w, "m_krankenhausbau", 80);
    const ort = pruefeVorhaben(w, "m_krankenhausbau", 80, [31]);
    expect(Math.abs(ort.kostenBip)).toBeLessThan(Math.abs(land.kostenBip) / 5);
    expect(ort.gesetz.pk).toBeLessThan(land.gesetz.pk);
  });
});

describe("Politisches Kapital und Parlament", () => {
  test("Ein Gesetz kostet Kapital und wird nach 21 Tagen abgestimmt", () => {
    const w = spiel();
    mehrheit(w);
    const kapital = w.spiel!.kapital;
    const r = bringeEin(w, "m_mindestlohn", 75, null, "gesetz");
    expect(r.ok).toBe(true);
    expect(w.spiel!.kapital).toBeLessThan(kapital);
    expect(w.spiel!.gesetze).toHaveLength(1);
    advance(w, 20);
    expect(w.spiel!.gesetze).toHaveLength(1);
    advance(w, 2);
    expect(w.spiel!.gesetze).toHaveLength(0);
    expect(w.log.some((l) => l.text.startsWith("Das Parlament nimmt „Mindestlohn“"))).toBe(true);
    advance(w, 60);
    expect(nationalAverage(NET, w.net, "m_mindestlohn")).toBeGreaterThan(70);
  });

  test("Ohne Mehrheit scheitert das Gesetz, das Kapital ist verloren", () => {
    const w = spiel();
    keineMehrheit(w);
    expect(stimmenSicht(w).luecke).toBeGreaterThan(50);
    const kapital = w.spiel!.kapital;
    bringeEin(w, "m_mindestlohn", 75, null, "gesetz");
    const nachEinbringen = w.spiel!.kapital;
    expect(nachEinbringen).toBeLessThan(kapital);
    advance(w, 25);
    expect(w.log.some((l) => l.text.startsWith("Das Parlament lehnt „Mindestlohn“"))).toBe(true);
    expect(nationalAverage(NET, w.net, "m_mindestlohn")).toBeLessThan(55);
  });

  test("Stimmen lassen sich kaufen und machen das Gesetz mehrheitsfähig", () => {
    const w = spiel();
    keineMehrheit(w);
    bringeEin(w, "m_mindestlohn", 75, null, "gesetz");
    const luecke = stimmenSicht(w).luecke;
    w.spiel!.kapital = 150;
    const r = stimmenKaufen(w, w.spiel!.gesetze[0]!.id, luecke + 30);
    expect(r.ok).toBe(true);
    // Der Kauf ist ein Geschäft ohne Nachspiel: keine Zusage an „Fraktionen“, die später als Rechnung wiederkehrt
    expect(w.spiel!.zusagen.some((z) => z.von === "Fraktionen")).toBe(false);
    advance(w, 22);
    expect(w.log.some((l) => l.text.startsWith("Das Parlament nimmt „Mindestlohn“"))).toBe(true);
  });

  test("Alte Spielstände: Zusagen an „Fraktionen“ und ihre Ereignisse verschwinden", () => {
    const w = spiel();
    w.spiel!.zusagen.push({ id: "z-alt", von: "Fraktionen", text: "Gegenleistung für 30 Stimmen", faellig: w.day, erfuellt: false, gebrochen: false });
    advance(w, 2);
    expect(w.spiel!.zusagen.some((z) => z.von === "Fraktionen")).toBe(false);
    expect(w.spiel!.ereignisse.some((e) => e.vorlage === "zusage" && e.daten?.zusage === "z-alt")).toBe(false);
  });

  test("Ohne genug Kapital wird nichts eingebracht", () => {
    const w = spiel();
    w.spiel!.kapital = -19;
    const r = bringeEin(w, "m_mindestlohn", 90, null, "gesetz");
    expect(r.ok).toBe(false);
    expect(r.text).toMatch(/fehlt Politisches Kapital/);
    expect(w.spiel!.gesetze).toHaveLength(0);
  });

  test("Erlass nur in Sicherheit und Außenbeziehungen, sofort wirksam, teurer", () => {
    const w = spiel();
    expect(erlassMoeglich("m_polizei")).toBe(true);
    expect(erlassMoeglich("m_mindestlohn")).toBe(false);
    const nein = bringeEin(w, "m_mindestlohn", 75, null, "erlass");
    expect(nein.ok).toBe(false);
    const pr = pruefeVorhaben(w, "m_polizei", 80);
    expect(pr.erlass.pk).toBeGreaterThan(pr.gesetz.pk);
    const ja = bringeEin(w, "m_polizei", 80, null, "erlass");
    expect(ja.ok).toBe(true);
    expect(w.spiel!.gesetze).toHaveLength(0);
    advance(w, 30);
    expect(nationalAverage(NET, w.net, "m_polizei")).toBeGreaterThan(55);
  });

  test("Doppeltes Einbringen derselben Maßnahme wird abgelehnt", () => {
    const w = spiel();
    mehrheit(w);
    bringeEin(w, "m_mindestlohn", 75, null, "gesetz");
    const r = bringeEin(w, "m_mindestlohn", 90, null, "gesetz");
    expect(r.ok).toBe(false);
  });
});

describe("Verwaltungskapazität", () => {
  test("Viele laufende Vorhaben verteuern und verlangsamen jedes weitere", () => {
    const w = spiel();
    const start = pruefeVorhaben(w, "m_krankenhausbau", 80);
    expect(start.ueberlast).toBe(1);
    const ids = NET.nodes.filter((n) => n.kind === "massnahme" && n.id !== "m_krankenhausbau").slice(0, REGELN.kapazitaet + 4);
    for (const n of ids) setPolicy(w, n.id, 100);
    expect(offeneVorhaben(w)).toBeGreaterThan(REGELN.kapazitaet);
    expect(ueberlast(w, 1)).toBeGreaterThan(1.3);
    const spaeter = pruefeVorhaben(w, "m_krankenhausbau", 80);
    expect(spaeter.gesetz.pk).toBeGreaterThan(start.gesetz.pk);
    expect(spaeter.monate).toBeGreaterThan(start.monate);
  });
});

describe("Ereignisse", () => {
  test("Ein Erdbeben entsteht aus dem Zustand, hat einen Ort und mehrere Antworten", () => {
    const w = spiel();
    const rng = new Rng(9);
    const ev = oeffne(w, "erdbeben", rng)!;
    expect(ev.provinzen).toHaveLength(1);
    const a = ansicht(w, ev);
    expect(a.titel).toMatch(/Erdbeben in /);
    expect(a.optionen.length).toBeGreaterThanOrEqual(2);
    expect(a.text.join(" ")).toMatch(/Einwohner/);
  });

  test("Eine Antwort kostet Kapital, schließt das Ereignis und landet in der Chronik", () => {
    const w = spiel();
    const rng = new Rng(9);
    const ev = oeffne(w, "streikwelle", rng)!;
    const kapital = w.spiel!.kapital;
    const r = entscheide(w, ev.id, "lohn", rng);
    expect(r.ok).toBe(true);
    expect(w.spiel!.kapital).toBe(kapital - 3);
    expect(w.spiel!.ereignisse.find((e) => e.id === ev.id)).toBeUndefined();
    expect(w.spiel!.chronik.at(-1)!.titel).toBe("Streikwelle");
  });

  test("Ohne genug Kapital ist eine Antwort nicht möglich", () => {
    const w = spiel();
    const rng = new Rng(9);
    const ev = oeffne(w, "streikwelle", rng)!;
    w.spiel!.kapital = -20;
    const r = entscheide(w, ev.id, "lohn", rng);
    expect(r.ok).toBe(false);
    expect(w.spiel!.ereignisse.find((e) => e.id === ev.id)).toBeDefined();
  });

  test("Wer nicht antwortet, bekommt nach der Frist die Standardfolge und verliert Zustimmung", () => {
    const w = spiel();
    const rng = new Rng(9);
    const ev = oeffne(w, "streikwelle", rng)!;
    const zustimmung = w.spiel!.umfrage.zustimmung;
    advance(w, ev.frist - w.day + 1);
    expect(w.spiel!.ereignisse.find((e) => e.id === ev.id)).toBeUndefined();
    expect(w.spiel!.chronik.at(-1)!.ausgang).toMatch(/^Keine Entscheidung/);
    expect(w.spiel!.umfrage.zustimmung).toBeLessThan(zustimmung);
  });

  test("Die erste Woche hat drei Vorgänge (Entscheidungen E)", () => {
    const w = createWorld(turkey2026, 5);
    startAfterElection(w, profil);
    expect(w.spiel!.ereignisse.map((e) => e.vorlage).sort()).toEqual(["start_haushalt", "start_partner", "start_wiederaufbau"]);
  });

  test("Zusagen aus dem Wahlkampf werden fällig und als Ereignis eingefordert", () => {
    const w = spiel();
    expect(w.spiel!.zusagen.some((z) => z.massnahme === "m_renten")).toBe(true);
    advance(w, 101);
    expect(w.spiel!.ereignisse.some((e) => e.vorlage === "zusage")).toBe(true);
  });

  test("Ein Ereignis entsteht im Lauf der Zeit ganz von selbst", () => {
    const w = spiel();
    advance(w, 365);
    expect(w.spiel!.chronik.length + w.spiel!.ereignisse.length).toBeGreaterThan(0);
  });
});

describe("Zustimmung, Wahl und Ende", () => {
  test("Die Zustimmung startet beim Wahlergebnis", () => {
    const w = spiel();
    expect(w.spiel!.umfrage.zustimmung).toBeCloseTo(51, 5);
  });

  test("Am Wahltag mit guter Zustimmung: Wiederwahl, zweite und letzte Amtszeit", () => {
    const w = spiel();
    w.spiel!.umfrage.zustimmung = 80;
    w.spiel!.kalibrierung += 60;
    advance(w, w.spiel!.wahltag - w.day + 1);
    expect(w.spiel!.ende).toBeUndefined();
    expect(w.spiel!.amtszeit).toBe(2);
    expect(w.spiel!.hinweise.some((h) => h.titel.includes("Wiederwahl"))).toBe(true);
    // Zweite Amtszeit: nach fünf weiteren Jahren endet die Zeit im Amt
    advance(w, 365 * 5 + 3);
    expect(w.spiel!.ende?.art).toBe("amtszeitende");
  });

  test("Am Wahltag mit schlechter Zustimmung: Abwahl und Bilanz", () => {
    const w = spiel();
    w.spiel!.umfrage.zustimmung = 42;
    w.spiel!.kalibrierung -= 12;
    advance(w, w.spiel!.wahltag - w.day + 1);
    expect(w.spiel!.ende?.art).toBe("abwahl");
    waehleZiele(w, ["inflation15", "wohnen", "mehrheit", "arbeit8"]);
    expect(w.spiel!.ziele).toHaveLength(3);
    const b = erstelleBilanz(w);
    expect(b.titel).toBe("Abgewählt");
    expect(b.absaetze.join(" ")).toMatch(/Inflation sank|Inflation stieg|Inflation/);
    expect(b.kennzahlen).toHaveLength(6);
    expect(b.ziele).toHaveLength(3);
    // Das Vermächtnis nennt Programme, Außenpolitik und Wählerschaft
    const text = b.absaetze.join(" ");
    expect(text).toMatch(/Regierungsprogramm/);
    expect(text).toMatch(/Außenpolitisch: Am engsten stand/);
    expect(text).toMatch(/Ihre Wählerschaft am Ende/);
  });

  test("Monate unter der Sturzschwelle beenden die Amtszeit vorzeitig, mit Warnung nach drei Monaten", () => {
    const w = spiel();
    w.spiel!.kalibrierung = -200;
    let warnung = false;
    for (let m = 0; m < 12 && !w.spiel!.ende; m++) {
      advance(w, 31);
      if (w.spiel!.hinweise.some((h) => h.titel === "Warnzeichen")) warnung = true;
    }
    expect(warnung).toBe(true);
    expect(w.spiel!.ende?.art).toBe("sturz");
    expect(w.day).toBeLessThan(w.spiel!.wahltag);
  });

  test("Nach dem Ende gibt es keine Ereignisse und keine Gesetze mehr", () => {
    const w = spiel();
    w.spiel!.umfrage.zustimmung = 10;
    w.spiel!.kalibrierung -= 60;
    advance(w, w.spiel!.wahltag - w.day + 1);
    expect(w.spiel!.ereignisse).toHaveLength(0);
    const r = bringeEin(w, "m_mindestlohn", 75, null, "gesetz");
    expect(r.ok).toBe(false);
  });
});

describe("Speichern und Determinismus mit Spielschleife", () => {
  test("Gleicher Seed und gleiche Eingaben ergeben denselben Zustand", () => {
    const a = spiel(11);
    const b = spiel(11);
    for (const w of [a, b]) {
      mehrheit(w);
      bringeEin(w, "m_krankenhausbau", 80, [31, 1], "gesetz");
      advance(w, 500);
    }
    expect(save(a)).toBe(save(b));
  });

  test("Laden und Fortsetzen ist identisch mit Durchlaufen", () => {
    const a = spiel(13);
    mehrheit(a);
    bringeEin(a, "m_wasserleitungen", 85, [31], "gesetz");
    advance(a, 173);
    const kopie = load(save(a));
    advance(a, 250);
    advance(kopie, 250);
    expect(save(a)).toBe(save(kopie));
  });

  test("Alte Spielstände ohne Spielschleife laufen weiter", () => {
    const w = createWorld(turkey2026, 1);
    expect(w.spiel).toBeUndefined();
    advance(w, 400);
    expect(w.day).toBe(400);
  });
});

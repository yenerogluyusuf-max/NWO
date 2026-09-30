// Das Gespräch: freie Sprache wird in geprüfte Aktionen übersetzt, ohne je etwas Ungewolltes auszuführen.
// Die 40 Eingaben stammen aus der Analyse vom 29.09.2026 (vorher: 11 von 40 korrekt, 4 falsch ausgeführt).

import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { befehl } from "../src/sim/befehle";
import type { World } from "../src/sim/types";

const profil: PlayerProfile = {
  name: "Test",
  heimat: "Ankara",
  heimatPlaka: 6,
  jugend: "",
  beruf: "",
  partner: "",
  motiv: "",
  partei: { name: "Partei der Werte", kurz: "PW", farbe: "#2e6b3f" },
  naehe: {},
  buendnis: "YENİ",
  versprechen: [],
  wahl: { runde: 2, anteil: 51 },
};

function neu(): World {
  const w = createWorld(turkey2026, 3);
  startAfterElection(w, profil);
  return w;
}

const gesetz = (w: World) => w.spiel!.gesetze[0]!;

describe("Richtung wird richtig gelesen (der Fehler „Senke die Mehrwertsteuer“)", () => {
  test.each(["Senke die Mehrwertsteuer", "Mehrwertsteuer senken", "senke mal die mehrwertsteuer"])("„%s“ senkt", (satz) => {
    const w = neu();
    const r = befehl(satz, w);
    expect(r.ok).toBe(true);
    expect(gesetz(w).massnahme).toBe("m_mwst");
    expect(gesetz(w).stufe).toBeLessThan(60);
  });

  test("„Erhöhe die Mehrwertsteuer“ erhöht", () => {
    const w = neu();
    befehl("Erhöhe die Mehrwertsteuer", w);
    expect(gesetz(w).stufe).toBeGreaterThan(60);
  });

  test("„Rentner sollen mehr bekommen“ erhöht die Renten", () => {
    const w = neu();
    befehl("Rentner sollen mehr bekommen", w);
    expect(gesetz(w).massnahme).toBe("m_renten");
    expect(gesetz(w).stufe).toBeGreaterThan(50);
  });

  test("Widersprüchliche Richtung führt zu einer Rückfrage, nicht zu einer Ausführung", () => {
    const w = neu();
    const r = befehl("Erhöhe und senke den Mindestlohn", w);
    expect(r.ok).toBe(false);
    expect(w.spiel!.gesetze).toHaveLength(0);
  });
});

describe("Wörter statt Teilstrings", () => {
  test("„Rede an die Nation halten“ ist kein Zeitstopp", () => {
    const r = befehl("Rede an die Nation halten", neu());
    expect(r.text).not.toMatch(/Zeit steht|Zeit läuft nicht/);
    expect(r.text).toMatch(/Reden/);
  });

  test("„Erdbebenhilfe für Hatay“ ist nicht das Hilfemenü", () => {
    const r = befehl("Erdbebenhilfe für Hatay", neu());
    expect(r.text).not.toMatch(/Ich verstehe: Maßnahmen benennen/);
    expect(r.text).toMatch(/Hatay/);
  });
});

describe("Ort: Bauen vor Ort", () => {
  test("Zwei Provinzen werden erkannt", () => {
    const w = neu();
    befehl("Baue Wasserleitungen in Hatay und Adana", w);
    expect(gesetz(w).massnahme).toBe("m_wasserleitungen");
    expect(gesetz(w).provinzen).toEqual([1, 31]);
  });

  test("Eine Himmelsrichtung wird zu mehreren Provinzen", () => {
    const w = neu();
    befehl("Baue Krankenhäuser im Osten", w);
    expect(gesetz(w).massnahme).toBe("m_krankenhausbau");
    expect(gesetz(w).provinzen!.length).toBeGreaterThan(15);
  });

  test("„wo es akut ist“ wählt die betroffenen Provinzen", () => {
    const w = neu();
    const r = befehl("Baue Wasserleitungen dort, wo Wassermangel akut ist", w);
    expect(r.ok).toBe(true);
    expect(gesetz(w).provinzen).not.toBeNull();
  });
});

describe("Ehrlichkeit über das, was es nicht gibt", () => {
  test.each([
    ["krieg", /noch nicht/],
    ["Wir erklären Syrien den Krieg", /noch nicht/],
    ["Truppen nach Syrien schicken", /noch nicht/],
    ["Neuwahlen ausrufen", /nicht selbst/],
    ["Kanal Istanbul bauen", /noch nicht/],
    ["Bau einen neuen Flughafen in Istanbul", /noch nicht/],
  ])("„%s“", (satz, muster) => {
    const w = neu();
    const r = befehl(satz as string, w);
    expect(r.ok).toBe(false);
    expect(r.text).toMatch(muster as RegExp);
    expect(w.spiel!.gesetze).toHaveLength(0);
  });
});

describe("Rückfragen bei Mehrdeutigkeit", () => {
  test("„Steuern erhöhen“ fragt, welche Steuer", () => {
    const w = neu();
    const r = befehl("Steuern erhöhen", w);
    expect(r.ok).toBe(false);
    expect(r.text).toMatch(/Mehrwertsteuer/);
    expect(r.text).toMatch(/Einkommensteuer/);
    expect(w.spiel!.gesetze).toHaveLength(0);
  });

  test("„Minister entlassen“ fragt, wen", () => {
    const r = befehl("Minister entlassen", neu());
    expect(r.ok).toBe(false);
    expect(r.text).toMatch(/Wen\?/);
  });

  test("„Ich möchte die Arbeitslosigkeit senken“ nennt Wege", () => {
    const r = befehl("Ich möchte die Arbeitslosigkeit senken", neu());
    expect(r.text).toMatch(/kein Regler/);
    expect(r.text).toMatch(/Investitionsanreize/);
  });

  test("„Ich will die Wohnungsnot senken“ nennt Maßnahmen", () => {
    const r = befehl("Ich will die Wohnungsnot senken", neu());
    expect(r.text).toMatch(/Wege nach unten/);
  });
});

describe("Fragen zur Lage", () => {
  test.each([
    ["Wie stehe ich in den Umfragen?", /Zustimmung/],
    ["Wie ist die Stimmung im Land?", /Zustimmung/],
    ["Habe ich eine Mehrheit im Parlament?", /von 600 Sitzen/],
    ["Was ist das größte Problem?", /Am schwersten/],
    ["Was soll ich als Nächstes tun?", /Ziele|Ereignis|Problem/],
    ["Wie viel Kapital habe ich?", /Politisches Kapital/],
    ["Was sagt die Opposition?", /Oppositionsführer/],
    ["Wer sind meine Minister?", /Finanzminister/],
    ["Lass mich mit dem Zentralbankchef sprechen", /Gouverneurin/],
  ])("„%s“", (satz, muster) => {
    const r = befehl(satz as string, neu());
    expect(r.ok).toBe(true);
    expect(r.text).toMatch(muster as RegExp);
  });
});

describe("Zeit und Eingriffe", () => {
  test("„ein Jahr weiter“ lässt Zeit vergehen (hält bei einem Ereignis)", () => {
    const w = neu();
    const r = befehl("ein Jahr weiter", w);
    expect(r.ok).toBe(true);
    expect(r.text).toMatch(/Tage? später/);
    expect(w.day).toBeGreaterThan(0);
  });

  test("Datum wird ausgeschrieben", () => {
    const r = befehl("weiter", neu());
    expect(r.text).toMatch(/\d+\. \w+ 2028/);
  });

  test("Zentralbank kritisieren meldet die Kritik, nicht die Stimmung der Gouverneurin", () => {
    const r = befehl("Kritisiere die Zentralbank", neu());
    expect(r.text).toMatch(/kritisiert die Zinspolitik/);
  });

  test("Leitzins bestimmt die Regierung nicht", () => {
    const r = befehl("Zinsen senken", neu());
    expect(r.ok).toBe(false);
    expect(r.text).toMatch(/Zentralbank/);
  });

  test("Finanzminister entlassen kostet Kapital", () => {
    const w = neu();
    const vorher = w.spiel!.kapital;
    const r = befehl("Entlasse den Finanzminister", w);
    expect(r.ok).toBe(true);
    expect(w.spiel!.kapital).toBe(vorher - 4);
  });
});

describe("Sprache im Spiel: echte Umlaute", () => {
  test("Keine ASCII-Ersatzschreibung in Antworten", () => {
    const antworten = ["krieg", "Hilfe", "asdf qwer", "Erhöhe den Mindestlohn", "Steuern erhöhen"].map((s) => befehl(s, neu()).text).join(" ");
    expect(antworten).not.toMatch(/Moeglich|Erhoehe |Fuer |Ueber |Aender/);
  });
});

// Haushalts-Zyklus mit Parallelität (WIR-3 aus VERBESSERUNGSPLAN_2026-09-30, Suzerain-Vorbild):
// Oktober-Fenster kostenlos, Nachtrag außerhalb teuer (doppeltes Kapital, Legitimitäts-Abzug),
// das Haushaltsgesetz als parlamentarischer Akt (Mehrheit wie bei Gesetzen, Stimmenkauf nutzbar),
// Scheitern = Vorjahr läuft inflationsausgeglichen weiter, Fenster-Anzeige/Staatskalender, Migration.

import { describe, expect, test } from "vitest";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";
import {
  HAUSHALT_ZYKLUS,
  PAKETE,
  bringeHaushaltsgesetzEin,
  haushaltsGesetzSicht,
  haushaltsStimmenKaufen,
  haushaltsfenster,
  impulsAusPosten,
  naechsteHaushaltstermine,
  paketInEntwurf,
  postenVorschau,
  schreibeHaushaltFort,
  setzeEntwurf,
  setzePosten,
  stufeVon,
} from "../src/sim/haushalt";
import { haushaltZustand } from "../src/sim/wirtschaft";
import type { World } from "../src/sim/types";

function welt(seed = 3): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 60;
  const p = w.player!.partei.kurz;
  w.parliament!.seats[p] = 450;
  return w;
}

/** Ereignisse würden die Läufe stören; sie werden laufend geleert. */
function bis(w: World, tage: number): void {
  for (let i = 0; i < tage; i++) {
    advance(w, 1);
    w.spiel!.ereignisse = [];
  }
}

/** Vom Start (5. Juni 2028) ins Oktober-Fenster. */
function insFenster(w: World): void {
  while (!(w.date.slice(5, 7) === "10" && Number(w.date.slice(8, 10)) <= HAUSHALT_ZYKLUS.fensterTage)) {
    advance(w, 1);
    w.spiel!.ereignisse = [];
  }
}

describe("Oktober-Fenster: kostenlos, Entwurf, Sicht", () => {
  test("Im Juni ist das Fenster geschlossen und die Sicht zeigt den Countdown; im Oktober ist es offen", () => {
    const w = welt();
    const juni = haushaltsfenster(w);
    expect(juni.offen).toBe(false);
    expect(juni.kalenderOffen).toBe(false);
    expect(juni.monateBis).toBe(4);
    expect(juni.naechsterStart).toBe("2028-10-01");
    // Staatskalender-Markierung: das nächste Fenster ist als Termin sichtbar
    expect(naechsteHaushaltstermine(w).some((t) => t.datum === "2028-10-01" && t.text.includes("Haushaltsfenster"))).toBe(true);

    insFenster(w);
    const oktober = haushaltsfenster(w);
    expect(oktober.kalenderOffen).toBe(true);
    expect(oktober.offen).toBe(true);
    expect(oktober.jahr).toBe(2028);
    expect(oktober.tageRest).toBeGreaterThan(0);
    expect(oktober.tageRest).toBeLessThanOrEqual(HAUSHALT_ZYKLUS.fensterTage);
  });

  test("Im Fenster kostet die Vorschau nichts und geht in den Entwurf; die Direktänderung ist blockiert", () => {
    const w = welt();
    insFenster(w);
    const v = postenVorschau(w, "investitionen", 2);
    expect(v.kapital).toBe(0);
    expect(v.zyklus.modus).toBe("entwurf");

    const blockiert = setzePosten(w, "investitionen", 2);
    expect(blockiert.ok).toBe(false); // im Fenster läuft alles über den Entwurf
    expect(stufeVon(w, "investitionen")).toBe(0);

    const k0 = w.spiel!.kapital;
    const r = setzeEntwurf(w, "investitionen", 2);
    expect(r.ok, r.text).toBe(true);
    expect(w.spiel!.kapital).toBe(k0); // kostenlos
    expect(haushaltZustand(w).entwurf?.investitionen).toBe(2);
    expect(stufeVon(w, "investitionen")).toBe(0); // wirkt erst mit dem Gesetz
    expect(impulsAusPosten(w)).toBe(0);
  });

  test("Paket des Finanzministeriums füllt den Entwurf; zurück auf die Ist-Stufe streicht den Eintrag", () => {
    const w = welt();
    insFenster(w);
    const r = paketInEntwurf(w, "konsolidieren");
    expect(r.ok, r.text).toBe(true);
    const entwurf = haushaltZustand(w).entwurf!;
    for (const [id, delta] of Object.entries(PAKETE.konsolidieren!.schritte)) expect(entwurf[id]).toBe(delta);
    setzeEntwurf(w, "personal", 0);
    expect(haushaltZustand(w).entwurf?.personal).toBeUndefined();
  });

  test("Außerhalb des Fensters gibt es keinen Entwurf", () => {
    const w = welt();
    expect(setzeEntwurf(w, "investitionen", 1).ok).toBe(false);
    expect(paketInEntwurf(w, "konsolidieren").ok).toBe(false);
  });
});

describe("Nachtragshaushalt außerhalb des Fensters: teuer und ehrlich bezeichnet", () => {
  test("Direktänderung im Juni kostet doppelt Kapital und etwas Legitimität", () => {
    const w = welt();
    const k0 = w.spiel!.kapital;
    const legit0 = nationalAverage(NET, w.net, "legitimitaet");
    const v = postenVorschau(w, "investitionen", 2);
    expect(v.zyklus.modus).toBe("nachtrag");
    expect(v.kapital).toBe(4); // 2 (Basis) × 2 (Nachtrag)
    const r = setzePosten(w, "investitionen", 2);
    expect(r.ok, r.text).toBe(true);
    expect(r.text).toContain("Nachtragshaushalt");
    expect(w.spiel!.kapital).toBe(k0 - 4);
    expect(nationalAverage(NET, w.net, "legitimitaet")).toBeLessThan(legit0);
    expect(stufeVon(w, "investitionen")).toBe(2);
  });
});

describe("Haushaltsgesetz im Parlament", () => {
  test("Angenommen: Der Entwurf wirkt als Paket; Zyklus erledigt, Marken und Änderungen sichtbar", () => {
    const w = welt();
    insFenster(w);
    setzeEntwurf(w, "investitionen", 2);
    setzeEntwurf(w, "einkommensteuer", 1);
    const einbringen = bringeHaushaltsgesetzEin(w);
    expect(einbringen.ok, einbringen.text).toBe(true);
    expect(haushaltZustand(w).entwurf).toEqual({}); // Entwurf liegt nun als Gesetz im Parlament
    const sicht = haushaltsGesetzSicht(w)!;
    expect(sicht.ja).toBeGreaterThanOrEqual(301); // Lager 450 Sitze: Mehrheit steht
    expect(sicht.urteil).toBe("sicher");
    // Während das Gesetz im Parlament liegt, ist die Direktänderung blockiert
    expect(setzePosten(w, "personal", 1).ok).toBe(false);

    const imp0 = w.economy.fiscalImpulse;
    bis(w, 25); // Abstimmung nach 21 Tagen plus Puffer
    const z = haushaltZustand(w);
    expect(z.gesetz).toBeNull();
    expect(z.zyklusJahr).toBe(2028);
    expect(z.letztesErgebnis).toBe("angenommen");
    expect(stufeVon(w, "investitionen")).toBe(2);
    expect(stufeVon(w, "einkommensteuer")).toBe(1);
    expect(w.economy.fiscalImpulse).toBeCloseTo(imp0 + 0.8 - 0.3, 6);
    expect(z.aenderungen.some((a) => a.text.includes("Haushaltsgesetz 2029"))).toBe(true);
  });

  test("Scheitern: Der Vorjahrshaushalt läuft (inflationsausgeglichen) weiter, Legitimität leidet", () => {
    const w = welt();
    insFenster(w);
    // Sichere Niederlage: Das Lager hat nur 150 Sitze, kein Kapital für Stimmenkauf
    const p = w.player!.partei.kurz;
    w.parliament!.seats = { [p]: 150, CHP: 300, MHP: 100, IYI: 50 };
    w.spiel!.kapital = 0;
    setzePosten(w, "soziales", 1, true); // Bestand, der erhalten bleiben soll (ohne Kosten, wie Ereignisse es tun)
    setzeEntwurf(w, "investitionen", 2);
    setzeEntwurf(w, "verbrauchsteuern", 1);
    expect(bringeHaushaltsgesetzEin(w).ok).toBe(true);

    const legit0 = nationalAverage(NET, w.net, "legitimitaet");
    const umfrage0 = w.spiel!.umfrage.zustimmung;
    bis(w, 25);
    const z = haushaltZustand(w);
    expect(z.gesetz).toBeNull();
    expect(z.zyklusJahr).toBe(2028);
    expect(z.letztesErgebnis).toBe("gescheitert");
    // Vorjahr läuft weiter: Die Regler stehen wie zuvor (nur der Bestand), das Defizit unverändert
    expect(stufeVon(w, "investitionen")).toBe(0);
    expect(stufeVon(w, "verbrauchsteuern")).toBe(0);
    expect(stufeVon(w, "soziales")).toBe(1);
    expect(nationalAverage(NET, w.net, "legitimitaet")).toBeLessThan(legit0);
    expect(w.spiel!.umfrage.zustimmung).toBeLessThan(umfrage0);
    // Der Zyklus ist für dieses Jahr erledigt: kein zweiter Versuch im selben Fenster
    expect(haushaltsfenster(w).erledigt).toBe(true);
    expect(bringeHaushaltsgesetzEin(w).ok).toBe(false);
  });

  test("Stimmenkauf für das Haushaltsgesetz funktioniert wie bei Gesetzen", () => {
    const w = welt();
    insFenster(w);
    // Lager deutlich unter der Mehrheit: Die Lücke ist sicher groß genug für einen Kauf
    const p = w.player!.partei.kurz;
    w.parliament!.seats = { [p]: 150, CHP: 300, MHP: 100, IYI: 50 };
    setzeEntwurf(w, "investitionen", 1);
    expect(bringeHaushaltsgesetzEin(w).ok).toBe(true);
    const sicht = haushaltsGesetzSicht(w)!;
    expect(sicht.luecke).toBeGreaterThan(0);
    expect(sicht.noetig).toBeGreaterThan(0);
    const k0 = w.spiel!.kapital;
    const kaufen = sicht.noetig + 25; // Puffer über der Mehrheit, damit die Abstimmung sicher ausgeht
    const r = haushaltsStimmenKaufen(w, kaufen);
    expect(r.ok, r.text).toBe(true);
    expect(w.spiel!.kapital).toBe(k0 - Math.ceil(kaufen * 0.5));
    expect(haushaltsGesetzSicht(w)!.noetig).toBe(0);
    // Abstimmung nach dem Kauf: die Mehrheit steht, der Haushalt wird beschlossen
    bis(w, 25);
    expect(haushaltZustand(w).letztesErgebnis).toBe("angenommen");
    expect(stufeVon(w, "investitionen")).toBe(1);
  });

  test("Fortschreiben (Wahl im Oktober-Ereignis): erledigt den Zyklus ohne Änderung und ohne Abstimmung", () => {
    const w = welt();
    insFenster(w);
    schreibeHaushaltFort(w);
    const z = haushaltZustand(w);
    expect(z.zyklusJahr).toBe(2028);
    expect(z.letztesErgebnis).toBe("fortgeschrieben");
    expect(z.gesetz ?? null).toBeNull();
    expect(haushaltsfenster(w).offen).toBe(false);
    // Danach ist der Nachtrag wieder der einzige Weg — zum doppelten Preis
    const v = postenVorschau(w, "investitionen", 1);
    expect(v.zyklus.modus).toBe("nachtrag");
  });

  test("Ungenutztes Fenster schließt von selbst: Vorjahr fortgeschrieben, kein Fehler", () => {
    const w = welt();
    insFenster(w);
    // Durch das Fenster laufen, ohne etwas zu tun
    bis(w, 35);
    const z = haushaltZustand(w);
    expect(z.zyklusJahr).toBe(2028);
    expect(z.letztesErgebnis).toBe("fortgeschrieben");
    expect(stufeVon(w, "investitionen")).toBe(0);
  });
});

describe("Migration und Nebenläufigkeit", () => {
  test("Ein Spielstand ohne Zyklus-Felder lädt und der Zyklus läuft ab dem nächsten Oktober", () => {
    const w = welt();
    bis(w, 30);
    const roh = JSON.parse(save(w));
    delete roh.spiel.wirtschaft.haushalt.entwurf;
    delete roh.spiel.wirtschaft.haushalt.gesetz;
    delete roh.spiel.wirtschaft.haushalt.zyklusJahr;
    delete roh.spiel.wirtschaft.haushalt.letztesErgebnis;
    const l = load(JSON.stringify(roh));
    const sicht = haushaltsfenster(l);
    expect(sicht.offen).toBe(false); // Juni: geschlossen, nächstes Fenster Oktober
    insFenster(l);
    expect(haushaltsfenster(l).offen).toBe(true);
    expect(setzeEntwurf(l, "investitionen", 1).ok).toBe(true);
    expect(bringeHaushaltsgesetzEin(l).ok).toBe(true);
  });

  test("Ereignis-Pakete (ohne Kosten) funktionieren weiterhin auch im Oktober", () => {
    const w = welt();
    insFenster(w);
    // wendePaketAn-Äquivalent: ohneKosten umgeht den Fenster-Block (Ereignisse stehen über dem Zyklus)
    const r = setzePosten(w, "investitionen", 1, true);
    expect(r.ok).toBe(true);
    expect(stufeVon(w, "investitionen")).toBe(1);
  });
});

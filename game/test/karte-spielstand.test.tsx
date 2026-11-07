// Welle 1, E5 (karte.md K7 und Teil von K4): Die Karte zeigt den Spielstand statt der Daten von 2024.
//   - Banner und Provinzkarte nennen die Bürgermeister aus dem Spielstand; die Wahllinse trägt das Jahr der letzten Wahl.
//   - Wirtschaftskraft, Infrastruktur und Katastrophenrisiko färben nach Werten aus dem Spiel und bewegen sich mit ihnen;
//     Regionen, Ressourcen und Strategische Orte sind nicht mehr in der Tafel (linsen.test.tsx).
//   - „Lage der Regionen“ und „Belastung“ zeigen Unterschiede statt einer roten Fläche.
//   - Der Knopf der Provinzkarte öffnet, was dort fehlt, nicht immer den Autobahnbau.
// Der Spielstand des Inhabers (3. August 2043) wird nur gelesen.

import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, load, NET } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { PROVINCES } from "../src/sim/netz";
import { wirke } from "../src/sim/wirkung";
import { auslastung } from "../src/sim/infrastruktur";
import { gesellschaftVon } from "../src/sim/gesellschaft";
import { ebeneName, farbenFuerEbene, type Kartenebene } from "../src/ui/ebenen";
import { stadtInfos } from "../src/ui/atlas/staedte";
import { ProvinceCard, bedarfKnopf, rathausVon } from "../src/ui/ProvinceCard";
import { bedarfIn, besteMassnahme, LAGE_WERTE } from "../src/ui/provinz-handlungen";
import { ueberlastJeProvinz } from "../src/ui/infrastruktur/ueberlast";
import { belastungFarben } from "../src/ui/infrastruktur/linse";
import type { World } from "../src/sim/types";

const SPIELSTAND = "../spielstand/staatsraeson_2043-08-03.json";
const hatStand = existsSync(SPIELSTAND);
const inhaber = (): World => load(JSON.stringify(JSON.parse(readFileSync(SPIELSTAND, "utf8")).welt));

function frisch(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  return w;
}

const fuellung = (w: World, e: Kartenebene): string => JSON.stringify(farbenFuerEbene(w, e, null, "p_wassermangel").fill);
const wertIn = (w: World, id: string, plaka: number): number => w.net.values[NET.index.get(id)! * PROVINCES + plaka - 1]!;

describe("Rathaus, Wahl und Sitze aus dem Spielstand", () => {
  test.runIf(hatStand)("Spielstand des Inhabers: Alle 81 Banner tragen das Rathaus aus dem Spielstand, die Wahllinse heißt „Wahlausgang 2038“", () => {
    const w = inhaber();
    const rathaus = w.spiel!.gesellschaft!.kommunen.rathaus;
    const infos = stadtInfos(w);
    for (let p = 1; p <= 81; p++) expect(infos[p]!.partei, String(p)).toBe(rathaus[String(p)]!.partei);
    expect(Object.values(infos).filter((x) => x.partei === w.player!.partei.kurz)).toHaveLength(81);
    expect(infos[34]!.rathausText).toBe(`Rathaus: ${w.player!.partei.name}`);
    expect(infos[34]!.parteiFarbe).toBe(w.player!.partei.farbe);
    expect(ebeneName("wahl", w)).toBe("Wahlausgang 2038");
    // Die Legende nennt die Sitze aus dem Spielstand
    const leg = farbenFuerEbene(w, "wahl", null, "p_wassermangel").legende!;
    expect(leg.titel).toBe("Wahlausgang 2038");
    expect(leg.eintraege!.map((e) => e.text).join(" ")).toContain(`${w.player!.partei.name}: ${w.parliament!.seats[w.player!.partei.kurz]} Sitze`);
  });

  test.runIf(hatStand)("Spielstand des Inhabers: Die Provinzkarte İstanbul nennt das Rathaus aus der letzten Kommunalwahl, nicht die CHP von 2024", () => {
    const w = inhaber();
    const letzte = w.spiel!.gesellschaft!.kommunen.wahlen.at(-1)!.datum.slice(0, 4);
    expect(letzte).toBe("2039");
    expect(rathausVon(w, 34)).toEqual({ partei: w.player!.partei.kurz, jahr: letzte, verwalter: false });
    const html = renderToStaticMarkup(<ProvinceCard world={w} plaka={34} onClose={() => undefined} onBauen={() => undefined} />);
    expect(html).not.toContain("Rathaus seit 2024");
    expect(html).toContain("Rathaus (Wahl 2039)");
    expect(html).toContain(w.player!.partei.name);
    // Wirtschaftskraft und Arbeitslosigkeit aus dem Spiel; die festen Werte von 2024 nur im aufklappbaren Steckbrief
    expect(html).toContain(`<dd class="">${Math.round(wertIn(w, "wachstum_regional", 34))} · Land`);
    expect(html).toMatch(/<details class="province-steckbrief"><summary[^>]*>Steckbrief \(Stand 2024\)<\/summary>/);
    expect(html).not.toContain("Hier bauen oder fördern");
  });

  test("Banner folgen einer Kommunalwahl im Spiel; vor ihr gilt das Ergebnis von 2024", () => {
    const w = frisch();
    expect(stadtInfos(w)[34]!.partei).toBe("CHP");
    expect(rathausVon(w, 34).jahr).toBe("2024");
    const k = gesellschaftVon(w).kommunen;
    k.rathaus["34"] = { partei: w.player!.partei.kurz };
    k.wahlen.push({ datum: "2029-03-26", lagerVorher: 0, lagerNachher: 1, gewonnen: [34], verloren: [] });
    expect(stadtInfos(w)[34]!.partei).toBe(w.player!.partei.kurz);
    expect(rathausVon(w, 34).jahr).toBe("2029");
  });
});

describe("Linsen mit Daten aus dem Spiel", () => {
  test("Wirtschaftskraft, Infrastruktur und Katastrophenrisiko ändern sich, wenn sich der Wert im Spiel ändert", () => {
    const w = frisch();
    const fall: [Kartenebene, string, number][] = [
      ["wirtschaft", "wachstum_regional", 12],
      ["infrastruktur", "verkehrsnetz", 20],
      ["risiko", "erdbebenvorsorge", 25],
    ];
    for (const [ebene, knoten, delta] of fall) {
      const vorher = fuellung(w, ebene);
      wirke(w, knoten, delta, [31]);
      expect(fuellung(w, ebene), ebene).not.toBe(vorher);
    }
    // Vorsorge in Hatay senkt das Risiko dort: Der Hinweis nennt Hatay nicht mehr unter den drei am stärksten gefährdeten
    for (let i = 0; i < 4; i++) wirke(w, "erdbebenvorsorge", 25, [31]);
    expect(farbenFuerEbene(w, "risiko", null, "p_wassermangel").legende!.hinweis!.split(".")[0]).not.toContain("Hatay");
  });

  test("Wirtschaftskraft und Infrastruktur bewegen sich schon nach einem Jahr ohne Eingriff; das Risiko bewegt sich mit der Vorsorge (oben)", async () => {
    const { advance } = await import("../src/sim/world");
    const w = frisch(9);
    const ebenen: Kartenebene[] = ["wirtschaft", "infrastruktur"];
    const vorher = ebenen.map((e) => fuellung(w, e));
    advance(w, 365);
    ebenen.forEach((e, i) => expect(fuellung(w, e), e).not.toBe(vorher[i]));
  });
});

describe("„Lage der Regionen“ und „Belastung“ zeigen Unterschiede", () => {
  test.runIf(hatStand)("Spielstand des Inhabers: nicht mehr eine rote Fläche; das überall volle Stromnetz steht eigens in der Legende", () => {
    const w = inhaber();
    const { provinzen, ueberall } = ueberlastJeProvinz(w);
    expect(provinzen).toHaveLength(81);
    // Vorher: das schlimmste Netz in allen 81 Provinzen zwischen 139,4 und 139,9 %
    const schlimmste = provinzen.map((x) => x.a);
    expect(Math.max(...schlimmste) - Math.min(...schlimmste)).toBeLessThan(0.01);
    const stufen = new Set(provinzen.map((x) => Math.round(x.not * 10)));
    expect(stufen.size, "die Skala zeigt Unterschiede").toBeGreaterThanOrEqual(4);
    expect(ueberall).toContain("strom");
    const farben = new Set(Object.values(belastungFarben(w).fill!));
    expect(farben.size).toBeGreaterThanOrEqual(20);
    expect(belastungFarben(w).legende!.hinweis).toContain("Überall überlastet: Stromnetz");
  });

  test("Frisches Spiel: Wo kein Netz über dem Vollstand ist, bleibt die Farbe der Ampel; keine Streckung eines ruhigen Landes", () => {
    const w = frisch();
    const { provinzen } = ueberlastJeProvinz(w);
    for (const x of provinzen) expect(x.not).toBeLessThanOrEqual(x.summe / 1.1 + 1e-9);
  });
});

describe("Der Knopf der Provinzkarte öffnet, was dort fehlt", () => {
  test("Frisches Spiel: Die Ziele unterscheiden sich je Provinz; der Knopf nennt das Ziel und die Zahl", () => {
    const w = frisch();
    const ziele = new Set<string>();
    for (let p = 1; p <= 81; p++) {
      const b = bedarfIn(w, p)!;
      expect(b, String(p)).toBeTruthy();
      ziele.add(b.art === "netz" ? b.netz : b.massnahme);
      const text = bedarfKnopf(b);
      if (b.art === "netz") expect(text).toContain(`${Math.round(b.a * 100)} %`);
      else expect(text).toContain(NET.nodes[NET.index.get(b.massnahme)!]!.name);
      if (b.art === "lage") expect(text).toContain(`${Math.round(b.wert)} statt ${Math.round(b.land)}`);
    }
    expect(ziele.size, "nicht immer der Autobahnbau").toBeGreaterThanOrEqual(4);
  });

  test("Die vorgeschlagene Maßnahme bewegt das Ziel in die richtige Richtung (Kanten des Politiknetzes)", () => {
    for (const id of LAGE_WERTE) {
      const m = besteMassnahme(id, 1)!;
      const direkt = NET.edges.find((e) => e.from === m.id && e.to === id);
      expect(direkt, `${m.id} wirkt direkt auf ${id}`).toBeTruthy();
      expect(Math.sign(direkt!.weight) * m.richtung, id).toBe(1);
    }
    expect(besteMassnahme("p_wohnungsnot", -1)!.id).toBe("m_mietdeckel");
  });

  test.runIf(hatStand)("Spielstand des Inhabers: İstanbul führt zum überlasteten Netz mit seiner Auslastung, nicht zur Autobahn", () => {
    const w = inhaber();
    const b = bedarfIn(w, 34)!;
    expect(b.art).toBe("netz");
    if (b.art !== "netz") return;
    expect(b.a).toBe(auslastung(w, b.netz, 34));
    const html = renderToStaticMarkup(<ProvinceCard world={w} plaka={34} onClose={() => undefined} onBauen={() => undefined} />);
    expect(html).toContain(bedarfKnopf(b));
    expect(bedarfKnopf(b)).not.toContain("Autobahn");
  });

  test("Gleicher Spielstand, gleicher Vorschlag", () => {
    const a = frisch(4);
    const b = frisch(4);
    for (let p = 1; p <= 81; p += 8) expect(bedarfIn(a, p)).toEqual(bedarfIn(b, p));
  });
});

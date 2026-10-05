// Linsenwahl: Liste, Verfügbarkeit, Tasten, dynamischer Name der Wahlebene, Beziehungsfarben aller Akteure und die Tafel als Markup.
// UI ohne Browser: renderToStaticMarkup (kein jsdom); das Verhalten im Browser prüft das Skript der Sichtprüfung.

import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import type { World } from "../src/sim/types";
import { BEZIEHUNG_FARBEN, KARTENEBENEN, LINSEN_GRUPPEN, akteurJeKartenland, ebeneKurz, ebeneName, farbenFuerEbene, laenderFarben } from "../src/ui/ebenen";
import { LINSEN_TASTEN, linseFuerTaste, linsenGruppen, linsenVerfuegbar, streifenFuer, tasteDarfWaehlen } from "../src/ui/linsen/linsen";
import { LinsenWahl } from "../src/ui/linsen/LinsenWahl";
import { LegendeKompakt, Plakette } from "../src/ui/Kartenlegende";
import { WELT } from "../src/data/welt-daten";
import { WEITERE } from "../src/data/welt-weitere";
import { weltModell } from "../src/sim/welt-modell";

function welt(seed = 17): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  return w;
}

const keinOp = () => undefined;

describe("Liste der Linsen", () => {
  test("Kennungen und Symbole sind eindeutig, kein Zeichen steht für zwei Ebenen", () => {
    const ids = KARTENEBENEN.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const icons = KARTENEBENEN.map((e) => e.icon);
    expect(new Set(icons).size).toBe(icons.length);
  });

  test("Jede Linse der Tafel hat Namen, Kurzsatz und eine bekannte Gruppe; das Politiknetz bleibt draußen", () => {
    const gruppenIds = new Set(LINSEN_GRUPPEN.map((g) => g.id));
    for (const e of KARTENEBENEN.filter((x) => x.gruppe)) {
      expect(gruppenIds.has(e.gruppe!)).toBe(true);
      expect(e.label.length).toBeGreaterThan(2);
      expect(e.kurz.length).toBeGreaterThan(10);
    }
    const w = welt();
    expect(linsenVerfuegbar(w)).not.toContain("netz");
    expect(linsenVerfuegbar(w)).toHaveLength(11);
  });

  test("Die Gruppen der Tafel folgen der Reihenfolge der Konzeption (Land, Wirtschaft, Krisen, Kultur, Welt)", () => {
    const g = linsenGruppen(welt());
    expect(g.map((x) => x.id)).toEqual(["land", "wirtschaft", "krisen", "kultur", "welt"]);
    expect(g[0]!.linsen.map((l) => l.id)).toEqual(["gelaende", "regionen", "wahl", "rueckhalt"]);
    expect(g[2]!.linsen.map((l) => l.id)).toEqual(["probleme", "risiko"]);
  });

  test("Linsen ohne Daten fehlen: ohne Spiel keine Beziehungen, kein Kulturerbe; ohne Sitzverteilung keine Wahlebene", () => {
    const leer = createWorld(turkey2026, 3);
    const frei = linsenVerfuegbar(leer);
    expect(frei).not.toContain("welt");
    expect(frei).not.toContain("erbe");
    expect(frei).not.toContain("wahl");
    expect(frei).toContain("gelaende");
    const w = welt();
    delete (w.parliament as { byProvince?: unknown }).byProvince;
    expect(linsenVerfuegbar(w)).not.toContain("wahl");
  });
});

describe("Tasten", () => {
  test("Ziffern 1 bis 9, dann 0, dann B; jede Taste wählt genau eine Linse", () => {
    const w = welt();
    const alle = linsenGruppen(w).flatMap((g) => g.linsen);
    expect(alle.map((l) => l.taste)).toEqual([...LINSEN_TASTEN].map((t) => t.toUpperCase()));
    expect(linseFuerTaste(w, "1")).toBe("gelaende");
    expect(linseFuerTaste(w, "8")).toBe("probleme");
    expect(linseFuerTaste(w, "9")).toBe("risiko");
    expect(linseFuerTaste(w, "0")).toBe("erbe");
    expect(linseFuerTaste(w, "b")).toBe("welt");
    expect(linseFuerTaste(w, "B")).toBe("welt");
    expect(linseFuerTaste(w, "x")).toBeNull();
  });

  test("Keine Wahl bei Textfeld, Umschalttaste oder offener Akte", () => {
    expect(tasteDarfWaehlen({ tagName: "BODY" }, {}, false)).toBe(true);
    expect(tasteDarfWaehlen({ tagName: "BUTTON" }, {}, false)).toBe(true);
    expect(tasteDarfWaehlen({ tagName: "INPUT" }, {}, false)).toBe(false);
    expect(tasteDarfWaehlen({ tagName: "textarea" }, {}, false)).toBe(false);
    expect(tasteDarfWaehlen({ tagName: "SELECT" }, {}, false)).toBe(false);
    expect(tasteDarfWaehlen({ tagName: "DIV", isContentEditable: true }, {}, false)).toBe(false);
    expect(tasteDarfWaehlen({ tagName: "BODY" }, { metaKey: true }, false)).toBe(false);
    expect(tasteDarfWaehlen({ tagName: "BODY" }, { ctrlKey: true }, false)).toBe(false);
    expect(tasteDarfWaehlen({ tagName: "BODY" }, { altKey: true }, false)).toBe(false);
    expect(tasteDarfWaehlen({ tagName: "BODY" }, {}, true)).toBe(false);
  });
});

describe("Name der Wahlebene", () => {
  test("Das Jahr kommt aus dem Spielstand statt aus einer festen Zahl", () => {
    const w = welt();
    expect(ebeneName("wahl", w)).toBe(`Wahlausgang ${w.spiel!.start.datum.slice(0, 4)}`);
    w.spiel!.start.datum = "2031-03-01";
    expect(ebeneName("wahl", w)).toBe("Wahlausgang 2031");
    expect(farbenFuerEbene(w, "wahl", null, "p_wassermangel").legende?.titel).toBe("Wahlausgang 2031");
    expect(ebeneName("welt", w)).toBe("Beziehungen");
  });

  test("Der Kurzsatz nennt ehrlich den Stand zum Amtsantritt und die nächste Wahl", () => {
    const w = welt();
    const kurz = ebeneKurz("wahl", w);
    expect(kurz).toMatch(/Amtsantritt/);
    expect(kurz).toMatch(/Nächste Wahl in \d+ Monaten/);
    expect(ebeneKurz("regionen", w)).toBe(KARTENEBENEN.find((e) => e.id === "regionen")!.kurz);
  });
});

describe("Beziehungsfarben aller Akteure", () => {
  test("Jedes Kartenland, zu dem das Weltmodell einen Akteur kennt, bekommt eine Farbe der Beziehungsskala", () => {
    const w = welt();
    const farben = laenderFarben(w);
    const erlaubt = new Set(Object.values(BEZIEHUNG_FARBEN));
    const erwartet = [...WELT.filter((d) => d.id !== "EU").map((d) => d.iso), ...WEITERE.map((d) => d.iso)];
    expect(erwartet.length).toBeGreaterThanOrEqual(40);
    for (const iso of erwartet) {
      expect(farben[iso], iso).toBeDefined();
      expect(erlaubt.has(farben[iso]!), iso).toBe(true);
    }
  });

  test("Mitglieder der EU ohne eigenen Akteur teilen die Farbe der Union; Akteure mit eigenem Land behalten ihre", () => {
    const w = welt();
    const farben = laenderFarben(w);
    const akteur = akteurJeKartenland();
    expect(akteur["PRT"]).toBe("EU");
    expect(farben["PRT"]).toBe(farben["EU"]);
    expect(akteur["DEU"]).toBe("DEU");
    expect(akteur["USA"]).toBe("USA");
    expect(akteur["CHN"]).toBe("CHN");
  });

  test("Das Färben verändert den Spielstand nicht (Speichern und Laden bleiben gleich)", () => {
    const w = welt();
    weltModell(w); // legt den Zustand an, wie es der erste Monatsschritt tut
    const vorher = JSON.stringify({ spiel: w.spiel, parliament: w.parliament, net: w.net.month });
    laenderFarben(w);
    linsenGruppen(w);
    for (const e of KARTENEBENEN) farbenFuerEbene(w, e.id, null, "p_wassermangel");
    expect(JSON.stringify({ spiel: w.spiel, parliament: w.parliament, net: w.net.month })).toBe(vorher);
  });
});

describe("Streifen der Kacheln", () => {
  test("Jede Linse hat einen Farbstreifen als CSS-Verlauf", () => {
    const w = welt();
    for (const g of linsenGruppen(w)) for (const l of g.linsen) expect(l.streifen, l.id).toMatch(/^linear-gradient\(/);
    expect(streifenFuer(w, "welt")).toContain(BEZIEHUNG_FARBEN.gut);
  });
});

describe("Tafel als Markup", () => {
  const w = welt();
  const props = { world: w, ebene: "gelaende" as const, problemId: null, legende: undefined, onEbene: keinOp, onProblem: keinOp };

  test("Geschlossen: Knopf mit Kicker und Namen, aria-expanded false, keine Tafel", () => {
    const html = renderToStaticMarkup(<LinsenWahl {...props} />);
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("Kartenebene");
    expect(html).toContain("Politisch");
    expect(html).not.toContain('class="linsen-tafel"');
  });

  test("Offen: alle elf Linsen als beschriftete Kacheln, genau eine aktiv, jede mit Taste und Streifen", () => {
    const html = renderToStaticMarkup(<LinsenWahl {...props} ebene="probleme" offenStart />);
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('role="dialog"');
    expect((html.match(/class="linsen-kachel( on)?"/g) ?? []).length).toBe(11);
    expect((html.match(/aria-pressed="true"/g) ?? []).length).toBe(1);
    expect((html.match(/<kbd/g) ?? []).length).toBe(11);
    expect((html.match(/linsen-streifen/g) ?? []).length).toBe(11);
    for (const g of LINSEN_GRUPPEN) expect(html).toContain(g.label);
    for (const l of linsenGruppen(w).flatMap((x) => x.linsen)) expect(html).toContain(l.name);
    expect(html).toContain(`Wahlausgang ${w.spiel!.start.datum.slice(0, 4)}`);
    expect(html).not.toContain("Wahl 2028");
  });

  test("Das Politiknetz erscheint nicht als Kachel, der Knopf nennt aber den gewählten Knoten", () => {
    const html = renderToStaticMarkup(<LinsenWahl {...props} ebene="netz" netName="Wassermangel" offenStart />);
    expect(html).not.toContain(">Politiknetz</b>");
    expect(html).toContain("Wassermangel");
    expect((html.match(/aria-pressed="true"/g) ?? []).length).toBe(0);
  });
});

describe("Legende und Plakette", () => {
  test("Die Plakette erscheint nur auf der Grundkarte", () => {
    const w = welt();
    expect(renderToStaticMarkup(<Plakette world={w} ebene="gelaende" />)).toContain("81 Provinzen");
    expect(renderToStaticMarkup(<Plakette world={w} ebene="wirtschaft" />)).toBe("");
  });

  test("Eingeklappt zeigt die Legende Titel und Streifen, aufgeklappt die Problemliste", () => {
    const w = welt();
    const { legende } = farbenFuerEbene(w, "probleme", null, "p_wassermangel");
    const zu = renderToStaticMarkup(<LegendeKompakt world={w} ebene="probleme" legende={legende} problemId={null} onProblem={keinOp} />);
    expect(zu).toContain("Akute Probleme");
    expect(zu).toContain('aria-expanded="false"');
    expect(zu).not.toContain("Alle zusammen");
    const auf = renderToStaticMarkup(<LegendeKompakt world={w} ebene="probleme" legende={legende} problemId={null} onProblem={keinOp} mehrStart />);
    expect(auf).toContain("Alle zusammen");
    expect(auf).toContain('aria-expanded="true"');
  });

  test("Ohne Legende (Grundkarte) entsteht kein Kasten", () => {
    expect(renderToStaticMarkup(<LegendeKompakt world={welt()} ebene="gelaende" legende={undefined} problemId={null} onProblem={keinOp} />)).toBe("");
  });
});

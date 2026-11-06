// Prolog-Oberfläche: das Lebenslauf-Buch (Gesicht und Name, Szenario, Stationen) und der Parteikonfigurator, in drei Sprachen.

import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Parteikonfigurator, achsenWort, wortStufe } from "../src/ui/prolog/Parteikonfigurator";
import { Prologue } from "../src/ui/Prologue";
import { VOREINSTELLUNGEN } from "../src/data/linien";
import { STATIONS } from "../src/sim/prolog";
import { setzeSprache } from "../src/i18n";

afterEach(async () => {
  await setzeSprache("de");
});

const zaehle = (html: string, muster: RegExp) => (html.match(muster) ?? []).length;

describe("Parteikonfigurator", () => {
  test("zeigt mindestens zehn Voreinstellungen, fünf Achsen mit Schiebereglern und Wortmarken, Name, Kürzel, Farbe und die Vorschau", () => {
    const html = renderToStaticMarkup(<Parteikonfigurator onFertig={() => {}} />);
    expect(zaehle(html, /role="radio"/g)).toBe(VOREINSTELLUNGEN.length);
    expect(VOREINSTELLUNGEN.length).toBeGreaterThanOrEqual(10);
    expect(zaehle(html, /type="range"/g)).toBe(5);
    expect(zaehle(html, /class="pk-wort"/g)).toBe(5);
    expect(html).toContain("Sozialistische Linke");
    expect(html).toContain("Partei der Ordnung");
    expect(html).toContain("Föderale Volkspartei");
    expect(html).toContain("Umverteilung und Staatswirtschaft");
    expect(html).toContain("Markt und Privateigentum");
    expect(html).toContain("linker Rand");
    expect(html).toContain("rechter Rand");
    expect(html).toContain("Name der Partei");
    expect(html).toContain("Kürzel");
    expect(html).toContain('type="color"');
    expect(html).toContain("Trägt dich");
    expect(html).toContain("Mögliche Partner");
    expect(html).toContain("Billig (mit der Linie)");
    expect(html).toContain("Partei gründen");
    expect(html).not.toContain("⟦");
  });

  test("die Voreinstellungen stehen von Rand zu Rand: links die Sozialistische Linke, rechts die Partei der Ordnung", () => {
    const html = renderToStaticMarkup(<Parteikonfigurator onFertig={() => {}} />);
    const namen = [...html.matchAll(/data-vor="([a-z]+)"/g)].map((m) => m[1]!);
    expect(namen.length).toBe(VOREINSTELLUNGEN.length);
    expect(namen[0]).toBe("sozialistisch");
    expect(namen[namen.length - 1]).toBe("autoritaer");
  });

  test("die gewählte Voreinstellung ist markiert und nur sie", () => {
    const html = renderToStaticMarkup(<Parteikonfigurator onFertig={() => {}} anfang="autoritaer" />);
    expect(zaehle(html, /aria-checked="true"/g)).toBe(1);
    expect(html).toMatch(/data-vor="autoritaer"[^>]*aria-checked="true"/);
    expect(html).toContain("Ein starker Staat, harte Hand");
  });

  test("Wortmarken statt Zahlen: sieben Stufen von Rand zu Rand, in jeder Sprache", async () => {
    expect([-100, -70, -69, -35, -12, 0, 11, 12, 35, 70, 100].map(wortStufe)).toEqual([0, 1, 1, 2, 3, 3, 3, 4, 5, 6, 6]);
    expect(achsenWort("wirtschaft", 20)).toBe("marktfreundlich");
    expect(achsenWort("wirtschaft", -50)).toBe("stark umverteilend");
    expect(achsenWort("wirtschaft", -90)).toBe("Staatswirtschaft");
    const html = renderToStaticMarkup(<Parteikonfigurator onFertig={() => {}} anfang="sozialistisch" />);
    expect(html).toContain("Staatswirtschaft");
    expect(html).not.toMatch(/class="pk-wort">-?\d/);
    await setzeSprache("en");
    expect(achsenWort("religion", 95)).toBe("religious order");
    await setzeSprache("tr");
    expect(achsenWort("zentral", -95)).toBe("bölgesel özerklik");
  });

  test("Vorschau und Texte folgen der Sprache (Türkisch, Englisch)", async () => {
    await setzeSprache("en");
    const en = renderToStaticMarkup(<Parteikonfigurator onFertig={() => {}} />);
    expect(en).toContain("Found the party");
    expect(en).toContain("Socialist Left");
    expect(en).toContain("Redistribution and a state economy");
    expect(en).toMatch(/Employees|Pensioners|Young people|Conservatives|Urban secularists|Farmers|Civil servants|Business owners|The poor|Nationalists|Minorities/);
    expect(en).not.toContain("⟦");
    await setzeSprache("tr");
    const tr = renderToStaticMarkup(<Parteikonfigurator onFertig={() => {}} />);
    expect(tr).toContain("Partiyi kur");
    expect(tr).toContain("Sosyalist Sol");
    expect(tr).not.toContain("⟦");
  });
});

describe("Prolog: das Buch", () => {
  test("erstes Blatt: Namensschild mit Zufallsname, Porträt und Gesichtswahl (Geschlecht, Alter, Frisur, Gesichtsform, Brille, Bart oder Kopftuch, Würfeln)", () => {
    const html = renderToStaticMarkup(<Prologue onDone={() => {}} />);
    expect(html).toContain("Wer bist du?");
    expect(html).toContain("Namensschild");
    expect(html).toContain("Zufälliger Name");
    expect(zaehle(html, /class="portraet/g)).toBeGreaterThanOrEqual(1);
    expect(html).toContain("Dein Gesicht");
    for (const w of ["Geschlecht", "Alter", "Frisur", "Gesichtsform", "Brille", "Kopftuch", "Würfeln"]) expect(html).toContain(w);
    expect(zaehle(html, /type="range"/g)).toBe(1);
    // acht benannte Stationen im Band, keine ist die aktuelle
    expect(zaehle(html, /class="b-item /g)).toBe(8);
    for (const n of ["Herkunft", "Jugend", "Beruf", "Partner", "Weg in die Politik", "Partei", "Wahlkampf", "Wahlnacht"]) expect(html).toContain(n);
    expect(html).not.toContain("⟦");
  });

  test("zweites Blatt: vier Szenarien als Karten, die Opposition gesperrt mit Schloss und Hinweis „Folgt später“", () => {
    const html = renderToStaticMarkup(<Prologue onDone={() => {}} anfang={-1} />);
    expect(html).toContain("Wie beginnt deine Geschichte?");
    for (const n of ["Neugründung", "Regierungspartei übernehmen", "Übergangsregierung nach der Krise", "Opposition nach dem Machtwechsel"]) expect(html).toContain(n);
    expect(zaehle(html, /role="radio"/g)).toBe(4);
    expect(zaehle(html, /disabled=""/g)).toBe(1);
    expect(html).toContain("Folgt später");
    expect(html).toContain("sz-karte on");
    expect(html).toContain("gesperrt");
  });

  test("jede Station zeigt Szene, Band mit aktueller Station und gleich viele Karten wie Antworten, jede mit Wappen, Text und Folge", () => {
    for (let i = 0; i < STATIONS.length; i++) {
      const st = STATIONS[i]!;
      if (st.modus === "konfigurator") continue;
      const html = renderToStaticMarkup(<Prologue onDone={() => {}} anfang={i} />);
      expect(html, st.id).toContain(`data-station="${st.id}"`);
      expect(html, st.id).toContain(`sz-${st.id}`);
      expect(html, st.id).toContain('aria-current="step"');
      expect(zaehle(html, /class="wahl-karte/g), st.id).toBe(st.answers.length);
      expect(zaehle(html, /class="wappen/g) >= st.answers.length, st.id).toBe(true);
      expect(zaehle(html, /class="wk-folge"/g), st.id).toBe(st.answers.length);
      expect(zaehle(html, /class="wk-zettel"/g), st.id).toBe(st.answers.length);
      expect(html, st.id).not.toContain("⟦");
      expect(html, st.id).not.toMatch(/NaN|undefined/);
    }
  });

  test("die Parteistation zeigt den Konfigurator auf breiter Seite", () => {
    const i = STATIONS.findIndex((s) => s.modus === "konfigurator");
    const html = renderToStaticMarkup(<Prologue onDone={() => {}} anfang={i} />);
    expect(html).toContain("buch-huelle weit");
    expect(html).toContain("Voreinstellungen von Rand zu Rand");
    expect(zaehle(html, /role="radio"/g)).toBe(VOREINSTELLUNGEN.length);
  });

  test("Türkisch und Englisch: Fragen, Antworten und Band in der Sprache, ohne deutsche Reste", async () => {
    await setzeSprache("en");
    const en = renderToStaticMarkup(<Prologue onDone={() => {}} anfang={0} />);
    expect(en).toContain("Where did you grow up?");
    expect(en).toContain("A big city by the sea");
    expect(en).toContain("Origins");
    expect(en).not.toContain("⟦");
    expect(en).not.toContain("Wo bist du");
    await setzeSprache("tr");
    const tr = renderToStaticMarkup(<Prologue onDone={() => {}} anfang={2} />);
    expect(tr).toContain("Parayı neyle kazandınız?");
    expect(tr).toContain("Avukat");
    expect(tr).toContain("Seçim gecesi");
    expect(tr).not.toContain("⟦");
    expect(tr).not.toContain("Womit hast du");
  });
});

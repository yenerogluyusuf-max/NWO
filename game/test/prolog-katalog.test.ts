// Katalog des Prologs: Voreinstellungen, Achsen, Szenarien, Konfigurator, Biografie. Vollständig in drei Sprachen, gleiche Platzhalter,
// formatierbar, nichts Deutsches in Türkisch und Englisch. Der deutsche Katalog ist die Quelle; Türkisch und Englisch sind Entwürfe.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { formatiere, platzhalter, type Params } from "../src/i18n";
import de from "../src/i18n/katalog/de/prolog.json";
import tr from "../src/i18n/katalog/tr/prolog.json";
import en from "../src/i18n/katalog/en/prolog.json";
import { ACHSEN_IDS, VOREINSTELLUNGEN } from "../src/data/linien";
import { STARTSZENARIEN } from "../src/data/startszenarien";
import { FOLGEN } from "../src/sim/biografie";
import { GRUPPEN } from "../src/sim/gruppen";
import { STATIONS } from "../src/sim/prolog";
import { BAERTE } from "../src/ui/prolog/figur";

const K = { de: de as Record<string, string>, tr: tr as Record<string, string>, en: en as Record<string, string> };
const QUELLEN = [
  "src/sim/prolog.ts",
  "src/sim/start-szenario.ts",
  "src/sim/linie.ts",
  "src/ui/Prologue.tsx",
  "src/ui/prolog/Parteikonfigurator.tsx",
  "src/ui/prolog/Figurenwahl.tsx",
  "src/ui/prolog/Fortschritt.tsx",
  "src/ui/prolog/Chips.tsx",
  "src/ui/prolog/folge.ts",
  "src/ui/prolog/figur.ts",
];

describe("Katalog Prolog", () => {
  test("alle im Code verwendeten festen Schlüssel stehen im deutschen Katalog", () => {
    const fehlt: string[] = [];
    for (const f of QUELLEN) {
      const s = readFileSync(join(__dirname, "..", f), "utf8");
      for (const m of s.matchAll(/"((?:prolog|konfigurator|start|linie|biografie)\.[a-z0-9_.]+)"/g)) if (!(m[1]! in K.de)) fehlt.push(m[1]!);
    }
    expect(fehlt).toEqual([]);
  });

  test("jede Voreinstellung, Achse, jedes Szenario und jede Biografiefolge hat ihre Texte", () => {
    for (const v of VOREINSTELLUNGEN) {
      expect(K.de[`linie.preset.${v.id}.name`], v.id).toBeTruthy();
      expect(K.de[`linie.preset.${v.id}.text`], v.id).toBeTruthy();
    }
    for (const k of ACHSEN_IDS) for (const t of ["name", "links", "rechts"]) expect(K.de[`linie.achse.${k}.${t}`], `${k}.${t}`).toBeTruthy();
    for (const s of STARTSZENARIEN) {
      expect(K.de[`start.${s.id}.name`], s.id).toBeTruthy();
      expect(K.de[`start.${s.id}.text`], s.id).toBeTruthy();
      if (!s.verfuegbar) expect(K.de[`start.${s.id}.status`], s.id).toBeTruthy();
      if (s.verfuegbar && s.id !== "neugruendung") expect(K.de[`start.log.${s.id}`], s.id).toBeTruthy();
      expect(K.de[`prolog.zusammenfassung.${s.id}`], s.id).toBeTruthy();
    }
    for (const f of Object.values(FOLGEN)) {
      expect(K.de[`biografie.${f.id}.vorteil`], f.id).toBeTruthy();
      expect(K.de[`biografie.${f.id}.preis`], f.id).toBeTruthy();
    }
  });

  test("die Texte aller Stationen, Antworten, Bandnamen, Gruppen, Ämter, Wirkungen, Wortmarken und Bartformen stehen im Katalog", () => {
    const fehlt: string[] = [];
    const pruefe = (k: string) => {
      if (!K.de[k]) fehlt.push(k);
    };
    for (const st of STATIONS) {
      for (const f of ["title", "story", "question"]) pruefe(`prolog.st.${st.id}.${f}`);
      pruefe(`prolog.band.${st.id}`);
    }
    // Antworten der festen Stationen (die Parteistation nimmt ihre Texte aus den Voreinstellungen)
    for (const [station, antworten] of Object.entries({
      kindheit: ["izmir", "konya", "diyarbakir", "trabzon"],
      jugend: ["studenten", "betrieb", "moschee", "sport"],
      beruf: ["anwalt", "arzt", "unternehmer", "oekonom"],
      liebe: ["hoersaal", "hochzeit", "demo", "klinik"],
      politik: ["unglueck", "korruption", "mentor", "ehrgeiz"],
      wahlkampf: ["yeni", "mhp", "allein_gross", "allein_hart"],
      wahlnacht: ["knapp", "klar", "erste"],
    }))
      for (const a of antworten) for (const f of ["label", "text"]) pruefe(`prolog.st.${station}.${a}.${f}`);
    for (const g of GRUPPEN) pruefe(`prolog.gruppe.${g.id}`);
    for (const amt of ["justiz", "finanzen", "wirtschaft", "stab", "inneres", "generalstab", "zentralbank", "opposition", "aussen", "partner", "kabinett"]) pruefe(`prolog.amt.${amt}`);
    for (const art of ["faehigkeit", "ehrgeiz", "loyalitaet", "kapital", "knoten"]) pruefe(`prolog.wirkung.${art}`);
    for (const f of Object.values(FOLGEN)) for (const w of [...f.vorteil, ...f.preis]) if (w.art === "knoten") pruefe(K.de[`prolog.gruppe.${w.id}`] ? `prolog.gruppe.${w.id}` : `prolog.knoten.${w.id}`);
    for (const a of ACHSEN_IDS) for (let i = 0; i < 7; i++) pruefe(`linie.wort.${a}.${i}`);
    for (const b of BAERTE) pruefe(`prolog.aussehen.bart.${b}`);
    expect(fehlt).toEqual([]);
  });

  test("Türkisch und Englisch haben dieselben Schlüssel wie Deutsch, und nur diese", () => {
    expect(Object.keys(K.tr).sort()).toEqual(Object.keys(K.de).sort());
    expect(Object.keys(K.en).sort()).toEqual(Object.keys(K.de).sort());
  });

  test("gleiche Platzhalter in jeder Übersetzung", () => {
    for (const [k, v] of Object.entries(K.de)) {
      expect(platzhalter(K.tr[k]!), `tr ${k}`).toEqual(platzhalter(v));
      expect(platzhalter(K.en[k]!), `en ${k}`).toEqual(platzhalter(v));
    }
  });

  test("jede Vorlage lässt sich in jeder Sprache ohne offene Platzhalter formatieren", () => {
    const werte: Record<string, string | number> = { partei: "Test Partei", naehe: "nah", gang: "erste", name: "Test", titel: "Kindheit", n: 2, gesamt: 8, text: "x", heimat: "Ankara", beruf: "Arzt", versprechen: "v", anteil: 51.2, eigene: 120, bloc: 320 };
    for (const lang of ["de", "tr", "en"] as const) {
      for (const [k, v] of Object.entries(K[lang])) {
        const params: Params = {};
        for (const n of platzhalter(v)) params[n] = werte[n] ?? 3;
        const text = formatiere(v, params, lang);
        expect(text, `${lang} ${k}`).not.toMatch(/[{}]|undefined|NaN|\[object/);
        expect(text.length, `${lang} ${k}`).toBeGreaterThan(0);
      }
    }
  });

  test("in Türkisch und Englisch steht kein deutscher Text", () => {
    // Wortgrenzen mit Unicode-Buchstaben: „öder“ (türkisch) enthält nicht das deutsche „der“
    const deutsch = /(?<![\p{L}])(Prozent|Sitze|Sitzen|Kapital|Amtszeit|Wahlgang|Stichwahl|nicht|und|der|die|das|wird|Wahl|Partei)(?![\p{L}])/u;
    for (const lang of ["tr", "en"] as const) {
      for (const [k, v] of Object.entries(K[lang])) {
        // Eigennamen und Platzhalter bleiben; geprüft wird der Text ohne sie
        const ohne = v.replace(/\{[^{}]*\}/g, " ").replace(/\{[^{}]*\}/g, " ");
        expect(ohne, `${lang} ${k}`).not.toMatch(deutsch);
      }
    }
  });
});

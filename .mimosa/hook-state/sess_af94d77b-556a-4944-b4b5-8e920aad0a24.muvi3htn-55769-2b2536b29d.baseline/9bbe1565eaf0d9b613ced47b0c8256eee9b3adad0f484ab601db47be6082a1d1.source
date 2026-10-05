// Kein Vorhaben ohne benennbare Wirkung: Jedes Vorhaben zeigt vorher Ausgangslage und erwartete Wirkung, jede Pflege wirkt nachweisbar,
// und jeder Eingriff hält Vorher und Nachher fest. (Nutzerwunsch 04.10.: „warum soll ich sanieren, wenn es keinen Effekt hat“.)

import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { VORHABEN } from "../src/data/reich";
import { beginne, groessenWert, pflegeIdFuer, pflegeStand, reichZustand, vorhabenDef, vorhabenListe, wirkungsVorschau } from "../src/sim/reich";
import { Reich } from "../src/ui/Reich";
import { PflegeListe, lohnendste } from "../src/ui/reich/Pflege";
import { Neues } from "../src/ui/reich/Neues";

function welt(seed = 4) {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 150;
  return w;
}

const TECHNIK = VORHABEN.filter((v) => (v.bereich === "infrastruktur" || v.bereich === "militaer") && v.klasse !== "restaurierung" && !v.vorlage && !v.ohnePflege);

describe("Jedes Vorhaben hat eine benennbare Wirkung", () => {
  test("Die Vorschau ist für kein Vorhaben leer", () => {
    const w = welt();
    const leer = VORHABEN.filter((v) => wirkungsVorschau(w, v.id)!.leer).map((v) => v.id);
    expect(leer, `ohne Wirkung: ${leer.join(", ")}`).toEqual([]);
  });

  test("Einrichtungen ohne Zustandswirkung zeigen die Größen, die sie prägen", () => {
    const w = welt();
    for (const id of ["recht_aym", "recht_hsk", "recht_vollzug", "recht_anwaltskammern"]) {
      const v = wirkungsVorschau(w, id)!;
      expect(v.zeigt.length, id).toBeGreaterThan(0);
      for (const g of v.zeigt) expect(Number.isFinite(g.wert), `${id}: ${g.id}`).toBe(true);
    }
  });

  test("Die Vorschau nennt zu jeder Größe die Ausgangslage", () => {
    const w = welt();
    const v = wirkungsVorschau(w, "infra_wasser_ost")!;
    expect(v.sofort.length).toBeGreaterThan(0);
    for (const z of [...v.sofort, ...v.dauerhaft]) expect(z.heute, z.text).toBeGreaterThanOrEqual(0);
    // die Ausgangslage ist der Wert in den betroffenen Provinzen, nicht im Land
    const ost = groessenWert(w, "wasserversorgung", [65, 4, 13, 49, 12, 21, 47, 72, 73]);
    expect(v.sofort.find((z) => z.text.startsWith("Wasserversorgung"))!.heute).toBe(Math.round(ost));
  });
});

describe("Pflege: ein Wort je Handlung, kein Stück ohne Eingriff", () => {
  test("Technik heißt Instandsetzung, Stätten heißen Restaurierung; niemand sagt mehr „Sanierung“", () => {
    for (const v of VORHABEN) {
      expect(`${v.name} ${v.text} ${v.kehrseite}`, v.id).not.toMatch(/Sanier/);
      if (v.pflegt) expect(v.name, v.id).toMatch(/^Instandsetzung: /);
      if (v.klasse === "restaurierung" && v.bereich === "kultur" && !v.vorlage) expect(v.name, v.id).toMatch(/^Restaurierung: /);
    }
  });

  test("Jedes Bauwerk und jedes Rüstungsstück mit Wirkung lässt sich instand setzen", () => {
    for (const b of TECHNIK.filter((x) => ["grossprojekt", "wunder", "ausbau", "beschaffung", "forschung"].includes(x.klasse) && (x.dauer ?? []).some((e) => e.t === "knoten"))) {
      const pid = pflegeIdFuer(b.id);
      expect(pid, b.id).toBeDefined();
      const p = vorhabenDef(pid!)!;
      expect(p.pflegt).toBe(b.id);
      expect(p.abschluss.some((e) => e.t === "bestand" && e.id === b.id && e.d > 0), pid).toBe(true);
      expect(p.voraus.some((x) => x.art === "bestand" && x.id === b.id), pid).toBe(true);
      expect(p.voraus.some((x) => x.art === "bestand-max" && x.id === b.id), pid).toBe(true);
      // Infrastruktur hebt außerdem den Zustand der Anlagen im Land
      if (b.bereich === "infrastruktur") expect(p.abschluss.some((e) => e.t === "knoten" && e.id === "wartungszustand" && e.d > 0), pid).toBe(true);
    }
  });

  test("Alte Kennungen bleiben, damit laufende Instandsetzungen in älteren Spielständen weiterlaufen", () => {
    expect(pflegeIdFuer("infra_marmaray")).toBe("sanierung_marmaray");
    expect(vorhabenDef("sanierung_stromnetz")).toBeDefined();
  });

  test("Jedes Stück zeigt Zustand, Folge des Verfalls und die Wirkung der Pflege", () => {
    const w = welt();
    const z = reichZustand(w);
    for (const id of Object.keys(z.bestand)) {
      const s = pflegeStand(w, id)!;
      expect(s, id).not.toBeNull();
      expect(s.zustand).toBeGreaterThan(0);
      expect(s.verfall.zustand, id).toBeLessThan(s.zustand + 1e-9);
      if (s.pflege) {
        expect(s.nach, id).toBeDefined();
        expect(s.nach!.zustand, id).toBeGreaterThan(s.zustand);
      }
    }
    // der Strom ist das schwächste Stück: Er verliert Wirkung, und Pflege bringt Messbares
    const strom = pflegeStand(w, "infra_stromnetz")!;
    expect(strom.nach!.gewinn.length).toBeGreaterThan(0);
    expect(strom.nach!.gewinn.some((g) => g.text.startsWith("Stromversorgung"))).toBe(true);
  });

  test("Ohne Pflege wird der Verlust sichtbar", () => {
    const w = welt();
    advance(w, 365 * 5);
    const strom = pflegeStand(w, "infra_stromnetz")!;
    expect(strom.skala).toBeLessThan(0);
    expect(strom.jetzt.length).toBeGreaterThan(0);
    expect(strom.jetzt.every((z) => !z.gut)).toBe(true);
    expect(strom.dringlichkeit).toBeGreaterThan(0);
  });

  test("Instandsetzen wirkt: Zustand, Wartungszustand und Stromversorgung liegen danach über dem Vergleichslauf", () => {
    const a = welt(11);
    const b = welt(11);
    const r = beginne(a, "sanierung_stromnetz");
    expect(r.ok, r.text).toBe(true);
    const vorher = groessenWert(a, "stromversorgung");
    advance(a, 365 * 3);
    advance(b, 365 * 3);
    const za = reichZustand(a).bestand.infra_stromnetz!.zustand;
    const zb = reichZustand(b).bestand.infra_stromnetz!.zustand;
    expect(za - zb).toBeGreaterThan(20);
    expect(groessenWert(a, "wartungszustand")).toBeGreaterThan(groessenWert(b, "wartungszustand"));
    expect(groessenWert(a, "stromversorgung")).toBeGreaterThan(groessenWert(b, "stromversorgung") + 0.5);
    // Vorher und Nachher stehen im Verlauf
    const e = reichZustand(a).verlauf!.find((x) => x.id === "sanierung_stromnetz")!;
    expect(e.art).toBe("pflege");
    expect(e.zustand!.nachher - e.zustand!.vorher).toBeGreaterThan(20);
    expect(e.vorher.wartungszustand).toBeDefined();
    expect(Math.abs(e.vorher.stromversorgung! - Math.round(vorher * 10) / 10)).toBeLessThan(0.11);
  });

  test("Nicht nötig, solange das Stück in bestem Zustand ist", () => {
    const w = welt();
    // frisch gebaute Stücke stehen bei 90: darüber lohnt keine Instandsetzung
    reichZustand(w).bestand.infra_flughafen!.zustand = 95;
    const s = vorhabenListe(w, "infrastruktur").find((x) => x.v.id === "sanierung_flughafen")!;
    expect(s.bereit).toBe(false);
    expect(beginne(w, "sanierung_flughafen").ok).toBe(false);
  });

  test("Winzigkeiten gelten nicht als Wirkung: Zum Spielbeginn steht der Bestand auf Null", () => {
    const w = welt();
    for (const id of Object.keys(reichZustand(w).bestand)) expect(pflegeStand(w, id)!.jetzt, id).toEqual([]);
  });

  test("Die Lage nennt, wo Instandsetzen am meisten bewegt", () => {
    const w = welt();
    const l = lohnendste(w, "infrastruktur", 3);
    expect(l.length).toBeGreaterThan(0);
    expect(l[0]!.nutzen).toBeGreaterThanOrEqual(l[l.length - 1]!.nutzen);
    expect(l.every((s) => s.pflege && s.pflege.bereit)).toBe(true);
    const h = renderToStaticMarkup(createElement(Reich, { world: w, bereich: "infrastruktur", refresh: () => {} }));
    expect(h).toContain("Hier lohnt sich Pflege");
    expect(h).toContain("Instandsetzen");
  });

  test("Pflege ist deterministisch", () => {
    const a = pflegeStand(welt(5), "infra_yht");
    const b = pflegeStand(welt(5), "infra_yht");
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe("Jeder Eingriff hält Vorher und Nachher fest", () => {
  test("Ein Ausbau legt die Ausgangslage an und schließt mit einem Eintrag im Verlauf ab", () => {
    const w = welt(3);
    const r = beginne(w, "infra_btk_personen", "stammfirma");
    expect(r.ok, r.text).toBe(true);
    const lauf = reichZustand(w).laufend.find((l) => l.id === "infra_btk_personen")!;
    expect(Object.keys(lauf.vorher!)).toEqual(expect.arrayContaining(["tourismus", "logistik"]));
    advance(w, 365 * 2);
    const e = reichZustand(w).verlauf!.find((x) => x.id === "infra_btk_personen")!;
    expect(e.art).toBe("bau");
    expect(e.vorher.tourismus).toBeDefined();
    expect(e.nachher.tourismus).toBeDefined();
  });

  test("Restaurierungen von Stätten halten den Zustand vorher und nachher fest", () => {
    const w = welt(3);
    const vorher = reichZustand(w).staetten.smyrna!.zustand;
    expect(beginne(w, "restaurierung_smyrna").ok).toBe(true);
    advance(w, 365);
    const e = reichZustand(w).verlauf!.find((x) => x.id === "restaurierung_smyrna")!;
    expect(e.zustand!.vorher).toBe(Math.round(vorher));
    expect(e.zustand!.nachher).toBeGreaterThan(e.zustand!.vorher + 20);
  });

  test("Ältere Spielstände ohne Ausgangslage schließen ohne Fehler ab", () => {
    const w = welt(3);
    expect(beginne(w, "restaurierung_smyrna").ok).toBe(true);
    const z = reichZustand(w);
    delete z.laufend[0]!.vorher;
    delete z.laufend[0]!.zustandVorher;
    delete z.verlauf;
    advance(w, 365);
    expect(z.bestand.infra_marmaray).toBeDefined();
    expect(z.verlauf ?? []).toHaveLength(0);
    expect(z.staetten.smyrna!.zustand).toBeGreaterThan(55);
  });
});

describe("Die Akten sind gegliedert und zeigen die Pflege", () => {
  const html = (bereich: "kultur" | "recht" | "militaer" | "infrastruktur" | "haushalt") => renderToStaticMarkup(createElement(Reich, { world: welt(), bereich, refresh: () => {} }));

  test("Jede Akte beginnt mit der Lage und bietet getrennte Reiter an", () => {
    expect(html("infrastruktur")).toContain("Bauwerke pflegen");
    expect(html("infrastruktur")).toContain("Neue Vorhaben");
    expect(html("kultur")).toContain("Stätten pflegen");
    expect(html("militaer")).toContain("Rüstung pflegen");
    expect(html("recht")).toContain("Reformen und Vorhaben");
    expect(html("haushalt")).toContain("Sonderrechte");
    for (const b of ["kultur", "recht", "militaer", "infrastruktur", "haushalt"] as const) {
      const h = html(b);
      expect(h, b).not.toContain("NaN");
      expect(h, b).not.toMatch(/Sanier/);
    }
  });

  test("Das Recht zeigt Einrichtungen mit den Größen, die sie prägen", () => {
    const h = html("recht");
    expect(h).toContain("Einrichtungen");
    expect(h).toContain("Strafvollzug");
  });

  test("Die Pflegeliste nennt Zustand, Verfall und Instandsetzen und kommt ohne „Sanieren“ aus", () => {
    const w = welt();
    advance(w, 365 * 4);
    for (const b of ["infrastruktur", "militaer"] as const) {
      const h = renderToStaticMarkup(createElement(PflegeListe, { world: w, bereich: b, refresh: () => {} }));
      expect(h, b).toContain("Zustand");
      expect(h, b).toContain("Ohne Pflege");
      expect(h, b).toContain("Instandsetzen");
      expect(h, b).not.toContain("NaN");
      expect(h, b).not.toMatch(/Sanier/);
    }
  });

  test("Neue Vorhaben sind nach Art getrennt und enthalten keine Pflege", () => {
    const w = welt();
    const liste = vorhabenListe(w, "infrastruktur").filter((s) => s.status === "verfuegbar" && s.v.klasse !== "restaurierung");
    const h = renderToStaticMarkup(createElement(Neues, { world: w, liste, onBeginne: () => {}, ergebnisse: {} }));
    expect(h).toContain("Großprojekte");
    expect(h).toContain("Wunder");
    expect(h).not.toContain("Instandsetzung:");
    expect(h).not.toContain("NaN");
  });
});

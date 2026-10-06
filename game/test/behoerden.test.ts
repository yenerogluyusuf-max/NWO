// Behörden ausbauen und der erweiterte MİT: Kosten, abnehmender Ertrag, Kürzen, Migration alter Spielstände, Inlandsoperationen
// und das Mess-Tor (ein Bot, der alles maximal ausbaut, gewinnt dadurch nicht von selbst).

import { describe, expect, test } from "vitest";
import { createWorld, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { weltModellMonat } from "../src/sim/welt-modell";
import {
  behoerden, stand, mitStufen, ertrag, gewinn, vorschau, baueAus, kuerze, kuerzVorschau,
  behoerdeSicht, behoerdenImBereich, behoerdenMonat, instrumentSicht, setzeInstrumentEin, etatSpielraum, behoerdenVerbrauch,
} from "../src/sim/behoerden";
import { haushaltZustand } from "../src/sim/wirtschaft";
import { inlandOptionen, ordneInlandAn, dienst, dienstSicht, opsOptionen, lagebildQualitaet, praesidentenSchutz } from "../src/sim/welt-dienst";
import { BEHOERDEN, BEHOERDE_NACH_ID, type BehoerdeId } from "../src/data/behoerden";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";
import type { World } from "../src/sim/types";

function neu(seed = 11): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 100;
  return w;
}
function monat(w: World): void {
  const [y, m] = w.date.split("-").map(Number) as [number, number];
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  const diff = Math.round((Date.UTC(ny, nm - 1, 1) - Date.UTC(y, m - 1, Number(w.date.slice(8, 10)))) / 86_400_000);
  w.day += diff;
  w.date = `${ny}-${String(nm).padStart(2, "0")}-01`;
  weltModellMonat(w);
}
const monate = (w: World, n: number): void => {
  for (let i = 0; i < n; i++) monat(w);
};
const avg = (w: World, id: string): number => nationalAverage(NET, w.net, id);

describe("Behörden: Ausbau, Kosten, Ertrag", () => {
  test("Jede Behörde startet mit ihren Startstufen; der Zustand ist deterministisch über den Seed", () => {
    const w = neu(5);
    const z = behoerden(w);
    for (const def of BEHOERDEN) {
      expect(z.stand[def.id].stufen).toEqual(def.start);
      expect(z.stand[def.id].leitung.name).toMatch(/\S/);
    }
    expect(behoerden(neu(5)).stand.mit.leitung.name).toBe(z.stand.mit.leitung.name);
  });

  test("Der Ertrag nimmt ab: Jede weitere Stufe bringt weniger als die vorige", () => {
    const d = [ertrag(1), ertrag(2), ertrag(3), ertrag(4), ertrag(5)];
    const schritte = d.slice(1).map((x, i) => x - d[i]!);
    for (let i = 1; i < schritte.length; i++) expect(schritte[i]!).toBeLessThan(schritte[i - 1]!);
    expect(gewinn(BEHOERDE_NACH_ID.polizei, "personal", 3)).toBeCloseTo(0, 6);
  });

  test("Ausbau kostet Kapital und Zeit, wird erst nach der Bauzeit wirksam und verschiebt die Zielgröße", () => {
    const w = neu(7);
    const pk0 = w.spiel!.kapital;
    const v = vorschau(w, "polizei", "personal");
    expect(v.ok).toBe(true);
    expect(v.monate).toBeGreaterThan(0);
    const krim0 = avg(w, "kriminalitaet");
    expect(baueAus(w, "polizei", "personal").ok).toBe(true);
    expect(w.spiel!.kapital).toBe(pk0 - v.pk);
    // Solange gebaut wird, steht die Stufe noch nicht
    expect(stand(w, "polizei").stufen.personal).toBe(3);
    const sp0 = w.spiel!.kapital;
    expect(baueAus(w, "polizei", "personal").ok).toBe(false); // nur ein Ausbau zugleich
    expect(w.spiel!.kapital).toBe(sp0);
    monate(w, v.monate + 1);
    expect(stand(w, "polizei").stufen.personal).toBe(4);
    monate(w, 12);
    expect(avg(w, "kriminalitaet")).toBeLessThan(krim0 - 1);
  });

  test("Kürzen senkt die Stufe sofort, bricht einen laufenden Ausbau derselben Achse ab", () => {
    const w = neu(9);
    baueAus(w, "justiz", "personal");
    expect(stand(w, "justiz").bau?.achse).toBe("personal");
    const r = kuerze(w, "justiz", "personal");
    expect(r.ok).toBe(true);
    expect(stand(w, "justiz").stufen.personal).toBe(1);
    expect(stand(w, "justiz").bau).toBeUndefined();
    expect(kuerzVorschau(w, "justiz", "personal").ok).toBe(false); // Stufe 1 ist das Minimum
  });

  test("Das Sonderinstrument steht erst ab seiner Stufe bereit und hat eine Abkühlzeit", () => {
    const w = neu(13);
    const def = BEHOERDE_NACH_ID.steuer.instrument!;
    expect(instrumentSicht(w, "steuer")!.moeglich).toBe(false); // Technik startet unter 4
    stand(w, "steuer").stufen[def.achse] = def.ab;
    const vor = avg(w, "schattenwirtschaft");
    expect(setzeInstrumentEin(w, "steuer").ok).toBe(true);
    expect(avg(w, "schattenwirtschaft")).toBeLessThan(vor);
    expect(instrumentSicht(w, "steuer")!.moeglich).toBe(false); // Abkühlzeit läuft
  });

  test("Alte Spielstände ohne Behörden-Feld bekommen die Startstufen beim Laden (Migration)", () => {
    const w = neu(17);
    monate(w, 2);
    delete w.spiel!.behoerden;
    const kopie = load(JSON.stringify(w));
    expect(kopie.spiel!.behoerden).toBeUndefined();
    const z = behoerden(kopie);
    expect(z.stand.afad.stufen).toEqual(BEHOERDE_NACH_ID.afad.start);
    // Eine neue Behörde wird in einen Stand ohne sie ergänzt
    delete (kopie.spiel!.behoerden!.stand as Record<string, unknown>).cyber;
    expect(behoerden(kopie).stand.cyber.stufen).toEqual(BEHOERDE_NACH_ID.cyber.start);
  });

  test("Die Bereichszuordnung deckt alle Behörden ab; der MİT liegt im Bereich Sicherheit", () => {
    const abgedeckt = new Set<BehoerdeId>();
    for (const b of ["gesellschaft", "recht", "regierung", "sicherheit", "aussen", "land", "wissen", "medien"]) {
      for (const id of behoerdenImBereich(b)) abgedeckt.add(id);
    }
    expect(abgedeckt.size).toBe(BEHOERDEN.length);
    expect(behoerdenImBereich("sicherheit")).toContain("mit");
  });
});

describe("MİT: erweiterte Operationen", () => {
  test("Der Ausbau des Dienstes hebt Kapazität und freigeschaltete Operationen", () => {
    const w = neu(21);
    expect(mitStufen(w)).toEqual({ personal: 3, technik: 3, reichweite: 3 });
    // „Gruppen unterstützen“ und „Cyberangriff“ sind gesperrt, bis Reichweite bzw. Technik hoch genug sind
    const gesperrt = opsOptionen(w, "GRC").filter((o) => o.def.art === "gruppen" || o.def.art === "cyberangriff");
    expect(gesperrt.every((o) => !o.moeglich)).toBe(true);
    stand(w, "mit").stufen.reichweite = 4;
    stand(w, "mit").stufen.technik = 4;
    const frei = opsOptionen(w, "GRC").filter((o) => o.def.art === "gruppen" || o.def.art === "cyberangriff");
    // Jetzt scheitern sie höchstens noch an Kapital oder Kapazität, nicht mehr an der Stufe
    expect(frei.some((o) => o.moeglich || /Kapital|Kapazität/.test(o.grund ?? ""))).toBe(true);
  });

  test("Inlandsaufklärung liefert ein Lagebild; Überwachung kostet sofort Pressefreiheit", () => {
    const w = neu(23);
    monate(w, 2);
    const presse0 = avg(w, "pressefreiheit");
    expect(ordneInlandAn(w, "ueberwachung").ok).toBe(true);
    expect(avg(w, "pressefreiheit")).toBeLessThan(presse0);
    expect(inlandOptionen(w).find((o) => o.def.art === "ueberwachung")!.moeglich).toBe(false); // läuft
    expect(ordneInlandAn(w, "aufklaerung").ok).toBe(true);
    monate(w, 5);
    expect(dienstSicht(w).bericht.some((b) => /Lagebild|Terror|Material|wertlos|rechtswidrig|Nichts/.test(b.text))).toBe(true);
  });

  test("Schutz des Präsidenten wirkt sofort und senkt die Putschgefahr-Schutzfrist", async () => {
    const { endenZustand } = await import("../src/sim/enden");
    const w = neu(27);
    endenZustand(w); // im echten Spiel legt der Monatsschritt den Zustand an
    const s0 = praesidentenSchutz(w);
    expect(ordneInlandAn(w, "schutz").ok).toBe(true);
    expect(praesidentenSchutz(w)).toBeGreaterThan(s0);
    expect((w.spiel!.enden?.putsch.geschuetztBis ?? -1)).toBeGreaterThan(w.day);
  });

  test("Die Lagebildqualität steigt mit Technik und Reichweite", () => {
    const w = neu(29);
    const q0 = lagebildQualitaet(w).wert;
    stand(w, "mit").stufen.technik = 5;
    stand(w, "mit").stufen.reichweite = 5;
    expect(lagebildQualitaet(w).wert).toBeGreaterThan(q0);
  });
});

describe("Mess-Tor: maximaler Ausbau gewinnt nicht von selbst", () => {
  test("Alles auf Stufe 5 kostet laufenden Unterhalt, der das Defizit über zwei Jahre deutlich treibt", () => {
    const aus = neu(41);
    const roh = neu(41);
    for (const def of BEHOERDEN) {
      for (const a of ["personal", "technik", "reichweite"] as const) stand(aus, def.id).stufen[a] = 5;
    }
    const d0 = aus.economy.debtRatio;
    const r0 = roh.economy.debtRatio;
    for (let i = 0; i < 24; i++) {
      behoerdenMonat(aus);
      behoerdenMonat(roh);
    }
    const mehrbelastung = (aus.economy.debtRatio - d0) - (roh.economy.debtRatio - r0);
    expect(mehrbelastung).toBeGreaterThan(0.5);
  });

  test("Der Sicherheits-Sektor bleibt endlich: Operationen binden Kapazität, auch bei Stufe 5", () => {
    const w = neu(43);
    for (const a of ["personal", "technik", "reichweite"] as const) stand(w, "mit").stufen[a] = 5;
    monate(w, 1);
    let letzte = { ok: true } as { ok: boolean };
    for (let i = 0; i < 12 && letzte.ok; i++) letzte = ordneInlandAn(w, i % 2 ? "aufklaerung" : "terror");
    // Auch der stärkste Dienst kann nicht beliebig viele Operationen zugleich fahren
    expect(dienst(w).kapazitaet).toBeLessThan(40);
  });
});

describe("Behörden und Haushalt: Der Ressortetat bezahlt den Ausbau", () => {
  test("Mehr Geld für die Innere Sicherheit trägt den Polizeiausbau ohne neue Schulden; ohne Mehretat geht er aufs Defizit", () => {
    const mit = neu(51);
    const ohne = neu(51);
    haushaltZustand(mit).stufen.innere_sicherheit = 3;
    const d0 = mit.economy.debtRatio;
    const o0 = ohne.economy.debtRatio;
    expect(etatSpielraum(mit, "inneres")).toBeGreaterThan(0);
    expect(etatSpielraum(ohne, "inneres")).toBe(0);
    expect(baueAus(mit, "polizei", "personal").ok).toBe(true);
    expect(baueAus(ohne, "polizei", "personal").ok).toBe(true);
    expect(mit.economy.debtRatio - d0).toBeCloseTo(0, 9);
    expect(ohne.economy.debtRatio - o0).toBeGreaterThan(0);
    // Der Spielraum ist verbraucht, die Sicht zeigt den Etat
    expect(behoerdeSicht(mit, "polizei").etat?.spielraum).toBeLessThan(0.15);
    expect(behoerdeSicht(mit, "polizei").etat?.posten).toBe("innere_sicherheit");
  });

  test("Ein unter das Gesetz gekürztes Ressort macht den Ausbau teurer und langsamer", () => {
    const normal = neu(52);
    const gekuerzt = neu(52);
    haushaltZustand(gekuerzt).stufen.bildung = -2;
    const a = vorschau(normal, "bildung", "personal");
    const b = vorschau(gekuerzt, "bildung", "personal");
    expect(b.pk).toBe(a.pk + 1);
    expect(b.monate).toBeGreaterThan(a.monate);
  });

  test("Alter Spielstand ohne Etatbuchführung: wird beim ersten Zugriff angelegt und läuft weiter", () => {
    const w = neu(53);
    behoerden(w);
    delete (w.spiel!.behoerden as { etat?: unknown }).etat;
    const geladen = load(JSON.stringify(w));
    haushaltZustand(geladen).stufen.innere_sicherheit = 2;
    expect(baueAus(geladen, "polizei", "technik").ok).toBe(true);
    expect(geladen.spiel!.behoerden!.etat?.jahr).toBe(Number(geladen.date.slice(0, 4)));
  });

  test("Der Haushalt zeigt, was die Behörden je Ressort verbraucht haben: aus dem Mehretat und aufs Defizit", () => {
    const mit = neu(54);
    const ohne = neu(54);
    expect(behoerdenVerbrauch(mit)).toEqual([]);
    haushaltZustand(mit).stufen.innere_sicherheit = 3;
    baueAus(mit, "polizei", "personal");
    baueAus(ohne, "polizei", "personal");
    const m = behoerdenVerbrauch(mit).find((x) => x.posten === "innere_sicherheit")!;
    const o = behoerdenVerbrauch(ohne).find((x) => x.posten === "innere_sicherheit")!;
    expect(m.ausEtat).toBeGreaterThan(0);
    expect(m.aufsDefizit).toBeCloseTo(0, 9);
    expect(o.ausEtat).toBe(0);
    expect(o.aufsDefizit).toBeGreaterThan(0);
    // Ein Spielstand mit Etat, aber ohne Defizitbuchung (vor dem 06.10.2026) lädt und bucht weiter
    delete (ohne.spiel!.behoerden!.etat as { defizit?: unknown }).defizit;
    const geladen = load(JSON.stringify(ohne));
    expect(behoerdenVerbrauch(geladen).find((x) => x.posten === "innere_sicherheit")).toBeUndefined();
    expect(baueAus(geladen, "grenzschutz", "technik").ok).toBe(true);
    expect(behoerdenVerbrauch(geladen).find((x) => x.posten === "innere_sicherheit")!.aufsDefizit).toBeGreaterThan(0);
  });
});

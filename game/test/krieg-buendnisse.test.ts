// Welle 1, E5 (krieg.md Befunde B2 und B4): Sofortfehler im Krieg.
//   - Unsinnige Bündnisse sind ausgeschlossen: Wer mit dem Gegner befreundet ist (USA und Israel), zieht nicht für die Türkei gegen
//     ihn in den Krieg; Russland und China kämpfen nicht für die Türkei gegen ein Mitglied von EU oder NATO; gegen ein EU-Mitglied
//     kämpft kein EU-Staat, und greift die Türkei an, stoppen die Mitglieder ihre Rüstungsausfuhr statt Truppen zu schicken.
//   - Der Rückhalt im Land steigt höchstens bis 100 (Spielstand des Inhabers: 109,7 nach dem Israel-Krieg).
// Geprüft wird, dass die Regel greift, wo die Lage es verlangt, und nicht, wo nicht; dass die Folgen gebucht werden, die der Hinweis
// nennt; und dass der Lauf deterministisch ist. Der Spielstand des Inhabers wird nur gelesen.

import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { advance, createWorld, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { weltZustand } from "../src/sim/laender";
import { KRIEG, RUECKHALT_MAX, fuehreKriegHandlungAus, kriegMit, kriegMonat, kriege, PAKETE } from "../src/sim/krieg";
import { KAMPF_SPERRE, istEuStaat, kampfSperre, koalitionenIn } from "../src/sim/pakte";
import { beziehungZurTuerkei, paarVon } from "../src/sim/welt-modell";
import { vorschauAusbau } from "../src/sim/streitkraefte";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";
import type { KriegVorgang } from "../src/sim/krieg-typen";

const SPIELSTAND = "../spielstand/staatsraeson_2043-08-03.json";

function frisch(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 200;
  w.parliament!.seats = { [w.player!.partei.kurz]: 450 };
  return w;
}

function inhaber(): World {
  const w = load(JSON.stringify(JSON.parse(readFileSync(SPIELSTAND, "utf8")).welt));
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 200;
  // Andere offene Vorgänge stören die Grenze von zwei aktiven Vorgängen nicht
  w.spiel!.kriege = (w.spiel!.kriege ?? []).filter((k) => k.phase === "beendet" || k.phase === "frieden");
  // Die Abkühlung nach dem Israel-Krieg von 2043 entfällt, damit der Vorgang neu entstehen kann
  for (const key of Object.keys(w.spiel!.zuletzt)) if (key.startsWith("krieg-")) delete w.spiel!.zuletzt[key];
  return w;
}

/** Bringt einen Konfliktvorgang bis zum Krieg: per Schlag des Gegners („angriff“) oder per Parlamentsbeschluss mit Rahmung. */
function inDenKrieg(w: World, land: string, weg: "angriff" | "revision" | "schutz"): KriegVorgang {
  w.parliament!.seats = { [w.player!.partei.kurz]: 450 };
  weltZustand(w)[land]!.konflikt = 95;
  kriegMonat(w, new Rng(1));
  const k0 = kriegMit(w, land)!;
  expect(k0, `Vorgang gegen ${land}`).toBeTruthy();
  k0.eskalation = 80;
  k0.seit -= KRIEG.spannungMinTage;
  advance(w, 1);
  if (weg === "angriff") {
    k0.eskalation = 99;
    advance(w, 1);
  } else {
    expect(fuehreKriegHandlungAus(w, k0.id, `ziel_${weg}`).ok).toBe(true);
    k0.seit -= KRIEG.drohkulisseMinTage;
    expect(fuehreKriegHandlungAus(w, k0.id, "beschluss").ok).toBe(true);
    advance(w, KRIEG.beschlussTage);
  }
  const k = kriege(w).find((x) => x.land === land && x.phase === "krieg")!;
  expect(k, `Krieg gegen ${land}`).toBeTruthy();
  return k;
}

const eigene = (k: KriegVorgang) => k.koalition!.partner.filter((p) => p.seite === "eigen").map((p) => p.id);
const gegnerPartner = (k: KriegVorgang) => k.koalition!.partner.filter((p) => p.seite === "gegner").map((p) => p.id);

describe("Wer mit dem Gegner befreundet ist, kämpft nicht für die Türkei gegen ihn", () => {
  test("Israel greift an: weder die USA noch ein europäischer NATO-Staat kämpfen gegen Israel; die USA stehen mit Grund abseits", () => {
    for (const seed of [6, 13]) {
      const w = frisch(seed);
      const k = inDenKrieg(w, "ISR", "angriff");
      for (const id of eigene(k)) expect(paarVon(w, id, "ISR").buendnis, `${id} ist mit Israel befreundet`).toBeLessThan(KAMPF_SPERRE.befreundet);
      expect(eigene(k)).not.toContain("USA");
      expect(eigene(k).some((id) => istEuStaat(id) || id === "GBR")).toBe(false);
      const usa = k.koalition!.abwesend.find((a) => a.id === "USA");
      expect(usa?.gesperrt).toBe(true);
      expect(usa?.pflicht, "eine gesperrte Pflicht kostet die Türkei kein Vertrauen").toBe(false);
      expect(kampfSperre(w, "USA", "eigen", "ISR")).toBe("befreundet mit Israel");
    }
  });

  test("Iran greift an: Die Regel greift nicht, die USA treten aus Art. 5 bei", () => {
    const w = frisch(6);
    const k = inDenKrieg(w, "IRN", "angriff");
    expect(eigene(k)).toContain("USA");
    expect(k.koalition!.partner.find((p) => p.id === "USA")?.pflicht).toBe(true);
    expect(k.koalition!.exportstopp ?? []).toHaveLength(0);
  });

  test.runIf(existsSync(SPIELSTAND))("Spielstand des Inhabers: Israel greift an, an der Seite der Türkei stehen weder die USA noch Großbritannien, die Niederlande oder Spanien", () => {
    const w = inhaber();
    const k = inDenKrieg(w, "ISR", "angriff");
    for (const id of ["USA", "GBR", "NLD", "ESP"]) expect(eigene(k), id).not.toContain(id);
    const hinweis = w.spiel!.hinweise.find((h) => h.id.startsWith(`krieg-koalition-${k.id}`))!;
    expect(hinweis.text.join(" ")).toContain("Kein Kriegseintritt:");
    expect(hinweis.text.join(" ")).toContain("Vereinigte Staaten (befreundet mit Israel)");
  });
});

describe("Gegen ein EU-Mitglied: Exportstopp statt Kriegseintritt", () => {
  test("Die Türkei greift Zypern an: Kein EU-Staat kämpft, auf keiner Seite; die Mitglieder stoppen ihre Rüstungsausfuhr", () => {
    const w = frisch(6);
    const vorher = Object.fromEntries(["DEU", "FRA", "GRC"].map((id) => [id, beziehungZurTuerkei(w, id).vertrauen]));
    const k = inDenKrieg(w, "CYP", "revision");
    expect([...eigene(k), ...gegnerPartner(k)].some(istEuStaat)).toBe(false);
    const stopp = k.koalition!.exportstopp!;
    expect(stopp.length).toBeGreaterThan(0);
    for (const id of stopp) expect(istEuStaat(id), id).toBe(true);
    // Gebucht wird, was der Hinweis nennt: dieselbe Liste, dieselbe Folge für die Beziehung
    const hinweis = w.spiel!.hinweise.find((h) => h.id.startsWith(`krieg-koalition-${k.id}`))!;
    const zeile = hinweis.text.find((z) => z.startsWith("Statt Truppen zu schicken"))!;
    expect(zeile).toBeTruthy();
    for (const id of stopp) expect(zeile).toContain(koalitionenIn(w, k.id).gegner.find((x) => x.id === id)!.name);
    for (const id of ["DEU", "FRA", "GRC"].filter((x) => stopp.includes(x))) {
      expect(beziehungZurTuerkei(w, id).vertrauen, id).toBeLessThan(vorher[id]!);
    }
    // Die Sicht nennt sie als Exportstopp, nicht als Kriegspartei
    expect(koalitionenIn(w, k.id).gegner.filter((x) => x.rolle === "exportstopp").map((x) => x.id).sort()).toEqual([...stopp].sort());
    // Rüstung aus der EU ist gesperrt, solange der Krieg läuft; Kauf aus den USA nicht
    expect(vorschauAusbau(w, "panzer", "kauf").ok).toBe(false);
    expect(vorschauAusbau(w, "panzer", "kauf").grund).toBe(vorschauAusbau(w, "marine", "kauf").grund);
  });

  test("Frieden hebt den Exportstopp auf", () => {
    const w = frisch(6);
    const k = inDenKrieg(w, "CYP", "revision");
    expect(k.koalition!.exportstopp!.length).toBeGreaterThan(0);
    k.phase = "waffenruhe";
    k.seit = w.day;
    k.front = 80;
    k.uhrGegner = 10;
    const r = fuehreKriegHandlungAus(w, k.id, "paket_ausgewogen");
    expect(r.ok, r.text).toBe(true);
    expect(k.phase).toBe("frieden");
    expect(k.koalition!.exportstopp ?? []).toHaveLength(0);
    expect(w.log.some((e) => e.text.startsWith("Der Krieg ist vorbei:"))).toBe(true);
  });

  test("Zypern greift an: Kein EU-Staat kämpft, Großbritannien und die USA bleiben ebenfalls draußen; es gibt keinen Exportstopp", () => {
    const w = frisch(6);
    const k = inDenKrieg(w, "CYP", "angriff");
    expect([...eigene(k), ...gegnerPartner(k)].some(istEuStaat)).toBe(false);
    expect(eigene(k)).not.toContain("GBR");
    expect(eigene(k)).not.toContain("USA");
    expect(k.koalition!.exportstopp ?? []).toHaveLength(0);
  });

  test.runIf(existsSync(SPIELSTAND))("Spielstand des Inhabers: gegen Zypern kämpfen weder Russland und China noch Ungarn und Rumänien für die Türkei", () => {
    const w = inhaber();
    expect(paarVon(w, "RUS", "CYP").buendnis, "Russland und Zypern sind im Spielstand verfeindet").toBeLessThan(0);
    expect(kampfSperre(w, "RUS", "eigen", "CYP")).toBeTruthy();
    expect(kampfSperre(w, "CHN", "eigen", "CYP")).toBeTruthy();
    expect(kampfSperre(w, "RUS", "eigen", "GRC"), "auch nicht gegen ein NATO-Mitglied").toBeTruthy();
    expect(kampfSperre(w, "RUS", "eigen", "UKR"), "gegen einen verfeindeten Staat außerhalb der Bündnisse greift die Regel nicht").toBeNull();
    const k = inDenKrieg(w, "CYP", "revision");
    for (const id of ["RUS", "CHN", "HUN", "ROU"]) expect(eigene(k), id).not.toContain(id);
    expect(gegnerPartner(k).some(istEuStaat)).toBe(false);
  });

  test("Gleicher Samen, gleicher Exportstopp", () => {
    const a = inDenKrieg(frisch(13), "GRC", "revision");
    const b = inDenKrieg(frisch(13), "GRC", "revision");
    expect(a.koalition!.exportstopp).toEqual(b.koalition!.exportstopp);
    expect(a.koalition!.partner.map((p) => p.id)).toEqual(b.koalition!.partner.map((p) => p.id));
  });
});

describe("Der Rückhalt im Land steigt höchstens bis 100", () => {
  test("Ein Siegeszug füllt den Rückhalt nicht über den Vollstand; Abzüge wirken sofort", () => {
    const w = frisch(6);
    const k = inDenKrieg(w, "SYR", "schutz");
    expect(k.uhr).toBeLessThanOrEqual(RUECKHALT_MAX);
    let hoechst = k.uhr;
    for (let i = 0; i < 12 && k.phase === "krieg"; i++) {
      k.frontSchub = 4; // jede Woche ein Vorstoß: der Gewinn-Term hob den Rückhalt früher über 100
      advance(w, 7);
      hoechst = Math.max(hoechst, k.uhr, k.uhrGegner);
    }
    expect(hoechst).toBeLessThanOrEqual(RUECKHALT_MAX);
    // „Weiterkämpfen“ kostet 5 und ist sofort zu sehen, statt in einem Überschuss zu verschwinden
    k.phase = "waffenruhe";
    k.uhr = RUECKHALT_MAX;
    expect(fuehreKriegHandlungAus(w, k.id, "weiterkaempfen").ok).toBe(true);
    expect(k.uhr).toBe(RUECKHALT_MAX - 5);
  });

  test("Auch die Rahmung „Verteidigung“ startet höchstens bei 100", () => {
    const w = frisch(6);
    const k = inDenKrieg(w, "IRN", "angriff");
    expect(k.uhr).toBeLessThanOrEqual(RUECKHALT_MAX);
  });
});
void PAKETE;

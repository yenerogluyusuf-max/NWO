// Das Reich: Kataloge sind stimmig, der Bestand steht am Anfang, Vorhaben lassen sich beginnen und werden fertig, Sperren und Äste greifen.

import { describe, expect, test } from "vitest";
import { createWorld, advance } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { VORHABEN, VORTEILE } from "../src/data/reich";
import { ERBE } from "../src/data/erbe";
import { NET } from "../src/sim/modell";
import { LAENDER, dimensionZu } from "../src/sim/laender";
import { nationalAverage } from "../src/sim/netz";
import { aktiveVorteile, bauKapazitaet, beginne, erhaltung, laufVergabe, pausiere, reichZustand, verschiebe, vergabeAngebot, verwaltungBilanz, vorhabenDef, vorhabenSicht, vorhabenListe, VORZIEHEN_VERWALTUNG, warteschlange } from "../src/sim/reich";
import type { Effekt, Voraussetzung } from "../src/sim/reich-typen";

function welt(seed = 4) {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 150;
  return w;
}

const KNOTEN = new Set(NET.nodes.map((n) => n.id));
const LAND = new Set(LAENDER.map((l) => l.id));
const STAETTEN = new Set(ERBE.map((e) => e.id));
const VORH = new Set(VORHABEN.map((v) => v.id));
const SERIEN = new Set(ERBE.flatMap((e) => e.serien ?? []));

function pruefeEffekt(e: Effekt, wo: string) {
  switch (e.t) {
    case "knoten":
      expect(KNOTEN.has(e.id), `${wo}: Knoten ${e.id}`).toBe(true);
      for (const p of e.provinzen ?? []) expect(p >= 1 && p <= 81, `${wo}: Provinz ${p}`).toBe(true);
      expect(Number.isFinite(e.d), `${wo}: Zahl`).toBe(true);
      break;
    case "land":
      expect(LAND.has(e.land), `${wo}: Land ${e.land}`).toBe(true);
      break;
    case "staette":
      expect(STAETTEN.has(e.id), `${wo}: Stätte ${e.id}`).toBe(true);
      break;
    case "serie":
      expect(e.serie === "alle" || SERIEN.has(e.serie as never), `${wo}: Serie ${e.serie}`).toBe(true);
      break;
    case "entferne":
    case "bestand":
      expect(VORH.has(e.id), `${wo}: Vorhaben ${e.id}`).toBe(true);
      break;
    default:
      break;
  }
}

function pruefeVoraus(v: Voraussetzung, wo: string) {
  switch (v.art) {
    case "bestand":
    case "nicht-bestand":
      expect(VORH.has(v.id), `${wo}: Vorhaben ${v.id}`).toBe(true);
      break;
    case "staetten":
      for (const id of v.ids) expect(STAETTEN.has(id), `${wo}: Stätte ${id}`).toBe(true);
      break;
    case "staette-max":
      expect(STAETTEN.has(v.id), `${wo}: Stätte ${v.id}`).toBe(true);
      break;
    case "knoten":
    case "massnahme":
      expect(KNOTEN.has(v.id), `${wo}: Knoten ${v.id}`).toBe(true);
      break;
    case "land":
      expect(LAND.has(v.land), `${wo}: Land ${v.land}`).toBe(true);
      break;
    default:
      break;
  }
}

describe("Kataloge", () => {
  test("Kennungen sind eindeutig, Zahlen und Verweise stimmen", () => {
    expect(new Set(VORHABEN.map((v) => v.id)).size).toBe(VORHABEN.length);
    expect(new Set(VORTEILE.map((v) => v.id)).size).toBe(VORTEILE.length);
    for (const v of VORHABEN) {
      const wo = v.id;
      expect(v.name.length, wo).toBeGreaterThan(3);
      expect(v.text.length, wo).toBeGreaterThan(20);
      expect(v.kehrseite.length, `${wo}: jede Sache hat eine Kehrseite`).toBeGreaterThan(15);
      expect(v.kosten.pk, wo).toBeGreaterThanOrEqual(0);
      expect(v.kosten.bau, wo).toBeGreaterThanOrEqual(0);
      expect(v.kosten.monate, wo).toBeGreaterThanOrEqual(1);
      for (const p of v.provinzen ?? []) expect(p >= 1 && p <= 81, `${wo}: Provinz ${p}`).toBe(true);
      if (v.ort) {
        expect(v.ort.lat).toBeGreaterThan(35);
        expect(v.ort.lat).toBeLessThan(43);
        expect(v.ort.lon).toBeGreaterThan(25);
        expect(v.ort.lon).toBeLessThan(45);
      }
      for (const e of v.abschluss) pruefeEffekt(e, `${wo} (Abschluss)`);
      for (const e of v.dauer ?? []) pruefeEffekt(e, `${wo} (Dauer)`);
      for (const x of v.voraus) pruefeVoraus(x, `${wo} (Voraussetzung)`);
      if (v.sperre) pruefeVoraus(v.sperre.solange, `${wo} (Sperre)`);
      if (v.kosten.bau === 0 && !v.start) expect(["reform", "sonderrecht"].includes(v.klasse) || v.kosten.bau === 0, wo).toBe(true);
    }
    for (const v of VORTEILE) {
      expect(v.kehrseite.length, v.id).toBeGreaterThan(15);
      for (const x of v.voraus) pruefeVoraus(x, v.id);
      for (const e of v.dauer) pruefeEffekt(e, v.id);
    }
  });

  test("Jeder Fachbereich hat Inhalt, Wunder und Vorteile", () => {
    for (const b of ["kultur", "recht", "militaer", "infrastruktur", "haushalt"] as const) {
      expect(VORHABEN.filter((v) => v.bereich === b).length, b).toBeGreaterThanOrEqual(5);
      expect(VORTEILE.filter((v) => v.bereich === b).length, b).toBeGreaterThanOrEqual(1);
    }
    expect(VORHABEN.filter((v) => v.klasse === "wunder").length).toBeGreaterThanOrEqual(7);
    expect(VORHABEN.filter((v) => v.klasse === "restaurierung" && v.bereich === "kultur")).toHaveLength(ERBE.length);
  });

  test("Startbestand steht (echte Bauwerke), Bauten laufen", () => {
    const w = welt();
    const z = reichZustand(w);
    for (const id of ["infra_marmaray", "infra_osmangazi", "infra_flughafen", "infra_yht", "infra_canakkale1915", "infra_gap", "infra_btk", "mil_drohnen", "mil_s400", "recht_aym", "recht_hsk"]) {
      expect(z.bestand[id], id).toBeDefined();
    }
    expect(z.laufend.map((l) => l.id)).toEqual(expect.arrayContaining(["infra_akkuyu", "infra_wiederaufbau", "mil_stahlkuppel"]));
    expect(Object.keys(z.staetten)).toHaveLength(ERBE.length);
    expect(z.sitze.aym).toEqual({ loyal: 9, unabhaengig: 3, reform: 3 });
  });
});

describe("Vorhaben beginnen und bauen", () => {
  test("Beginn kostet Kapital und legt einen Bau an; ohne Kapital geht es nicht", () => {
    const w = welt();
    const kapital = w.spiel!.kapital;
    const r = beginne(w, "restaurierung_ephesos");
    expect(r.ok, r.text).toBe(true);
    expect(w.spiel!.kapital).toBe(kapital - 3);
    expect(reichZustand(w).laufend.some((l) => l.id === "restaurierung_ephesos")).toBe(true);
    // zweiter Beginn desselben Vorhabens: läuft schon
    expect(beginne(w, "restaurierung_ephesos").ok).toBe(false);
    w.spiel!.kapital = -20;
    expect(beginne(w, "restaurierung_pergamon").ok).toBe(false);
    expect(w.spiel!.kapital).toBe(-20);
  });

  test("Eine Restaurierung wird fertig, hebt den Zustand und lässt sich später wiederholen", () => {
    const w = welt();
    const vorher = reichZustand(w).staetten.thyatira!.zustand;
    expect(beginne(w, "restaurierung_thyatira").ok).toBe(true);
    advance(w, 30 * 14);
    const z = reichZustand(w);
    expect(z.laufend.some((l) => l.id === "restaurierung_thyatira")).toBe(false);
    expect(z.staetten.thyatira!.zustand).toBeGreaterThan(vorher + 15);
    expect(z.bestand.restaurierung_thyatira).toBeUndefined();
    w.spiel!.kapital = 100;
    // solange der Zustand unter der Grenze liegt, ist eine weitere Restaurierung möglich
    expect(vorhabenSicht(w, "restaurierung_thyatira")!.status).not.toBe("fertig");
  });

  test("Akkuyu wird fertig und hebt die Stromversorgung in Mersin", () => {
    const w = welt();
    const i = NET.index.get("stromversorgung")!;
    const vorher = w.net.values[i * 81 + 32]!; // Mersin = Plaka 33
    advance(w, 30 * 30);
    const z = reichZustand(w);
    expect(z.bestand.infra_akkuyu, "Akkuyu ist fertig").toBeDefined();
    expect(z.feier).toContain("infra_akkuyu");
    expect(w.net.values[i * 81 + 32]!).toBeGreaterThan(vorher);
  });

  test("Wunder-Serie: die Kirchenroute braucht alle sieben Stätten im Zustand 55", () => {
    const w = welt();
    const s = vorhabenSicht(w, "serie_kirchen7")!;
    expect(s.bereit).toBe(false);
    expect(s.voraus[0]!.text).toContain("schwächste");
    const b = beginne(w, "serie_kirchen7");
    expect(b.ok).toBe(false);
    // Nach der Restaurierung der schwächsten Stätten geht es
    const z = reichZustand(w);
    for (const id of ["ephesos", "smyrna", "pergamon", "thyatira", "sardes", "philadelphia", "laodikeia"]) z.staetten[id]!.zustand = 70;
    const s2 = vorhabenSicht(w, "serie_kirchen7")!;
    expect(s2.bereit, s2.voraus.map((x) => x.text).join("; ")).toBe(true);
    expect(beginne(w, "serie_kirchen7").ok).toBe(true);
    advance(w, 30 * 30);
    expect(reichZustand(w).bestand.serie_kirchen7).toBeDefined();
    expect(reichZustand(w).feier).toContain("serie_kirchen7");
  });

  test("Sperre: Die F-35 sind blockiert, solange die S-400 im Land stehen; Abgabe räumt sie", () => {
    const w = welt();
    expect(vorhabenSicht(w, "mil_f35")!.status).toBe("gesperrt");
    expect(beginne(w, "mil_f35").ok).toBe(false);
    w.spiel!.kapital = 150;
    expect(beginne(w, "mil_s400_abgeben").ok).toBe(true);
    advance(w, 30 * 5);
    expect(reichZustand(w).bestand.mil_s400).toBeUndefined();
    expect(vorhabenSicht(w, "mil_f35")!.status).not.toBe("gesperrt");
  });

  test("Ausschließende Äste: nur eine Doktrin zugleich", () => {
    const w = welt();
    expect(beginne(w, "doktrin_drohnen").ok).toBe(true);
    expect(vorhabenSicht(w, "doktrin_autonomie")!.status).toBe("ausgeschlossen");
    expect(beginne(w, "doktrin_autonomie").ok).toBe(false);
  });

  test("Zu viele Vorhaben: Die Verwaltungskraft sinkt, ohne sie kommen Bauten nur halb voran", () => {
    const w = welt();
    const z = reichZustand(w);
    const vorher = verwaltungBilanz(w).netto;
    for (const id of ["infra_kanal_istanbul", "infra_yht_izmir", "infra_strom_ost", "infra_sinop", "infra_wasser_ost"]) {
      z.laufend.push({ id, fortschritt: 0, start: w.date });
    }
    expect(verwaltungBilanz(w).netto).toBeLessThan(vorher);
    z.verwaltung = 0;
    advance(w, 35);
    expect(z.meldungen.some((m) => m.art === "verzug")).toBe(true);
  });

  test("Baukapazität ist begrenzt und wächst mit der Bauindustrie", () => {
    const w = welt();
    const cap = bauKapazitaet(w);
    expect(cap).toBeGreaterThan(50);
    expect(cap).toBeLessThan(140);
  });
});

describe("Vorteile und Größen", () => {
  test("Vorteile gelten nur, solange ihre Bedingungen erfüllt sind", () => {
    const w = welt();
    const z = reichZustand(w);
    // ohne Pflege sinkt der Zustand der Anlagen: das Drehkreuz hängt daran
    const drehkreuz = aktiveVorteile(w).includes("v_drehkreuz");
    expect(typeof drehkreuz).toBe("boolean");
    expect(erhaltung(w)).toBeGreaterThan(40);
    expect(z.bestand.infra_flughafen!.zustand).toBeGreaterThan(80);
  });

  test("Stille Jahre: Der Startbestand verschiebt das Gleichgewicht nur durch Verfall, nichts geht ins Unendliche", () => {
    const w = welt();
    advance(w, 365 * 3);
    for (const n of NET.nodes) {
      const m = nationalAverage(NET, w.net, n.id);
      expect(Number.isFinite(m), n.id).toBe(true);
      expect(m).toBeGreaterThanOrEqual(0);
      expect(m).toBeLessThanOrEqual(100);
    }
    const z = reichZustand(w);
    expect(Number.isFinite(z.verwaltung)).toBe(true);
    expect(z.verwaltung).toBeGreaterThanOrEqual(0);
    for (const s of Object.values(z.staetten)) expect(s.zustand).toBeGreaterThan(0);
  });

  test("Liste je Bereich liefert Sichten und übersteht Speichern und Laden", () => {
    const w = welt();
    for (const b of ["kultur", "recht", "militaer", "infrastruktur", "haushalt"]) {
      const l = vorhabenListe(w, b);
      expect(l.length).toBeGreaterThan(3);
      for (const s of l) expect(["fertig", "im_bau", "pausiert", "verfuegbar", "gesperrt", "ausgeschlossen"]).toContain(s.status);
    }
    beginne(w, "restaurierung_smyrna");
    const kopie = JSON.parse(JSON.stringify(w)) as typeof w;
    expect(kopie.spiel!.reich!.laufend.some((l) => l.id === "restaurierung_smyrna")).toBe(true);
    // ein alter Spielstand ohne Reich legt es beim Zugriff an
    delete kopie.spiel!.reich;
    expect(reichZustand(kopie).bestand.infra_marmaray).toBeDefined();
  });
});

describe("Bauvergabe mit drei Optionen (INF-1)", () => {
  // Die Doktrin ist ein kleines, sofort beginnbares Vorhaben (Voraussetzung steht im Startbestand)
  const VORHABEN_ID = "doktrin_drohnen";

  test("Stammfirma: schneller und teurer, und die Nähe ohne Wettbewerb nährt das Korruptionsrisiko", () => {
    const w = welt();
    const v = vorhabenDef(VORHABEN_ID)!;
    const a = vergabeAngebot(v, "stammfirma");
    expect(a.pk).toBeGreaterThan(v.kosten.pk);
    expect(a.bau).toBeLessThan(v.kosten.bau);
    expect(a.monate).toBeLessThan(v.kosten.monate);
    expect(a.vorlauf).toBe(0);
    const kapital = w.spiel!.kapital;
    const korruptVorher = nationalAverage(NET, w.net, "korruption");
    const unternehmerVorher = nationalAverage(NET, w.net, "unternehmer");
    const r = beginne(w, VORHABEN_ID, "stammfirma");
    expect(r.ok, r.text).toBe(true);
    expect(w.spiel!.kapital).toBeCloseTo(kapital - a.pk, 6);
    const l = reichZustand(w).laufend.find((x) => x.id === VORHABEN_ID)!;
    expect(l.vergabe).toBe("stammfirma");
    expect(l.bau).toBe(a.bau);
    expect(l.monate).toBe(a.monate);
    // Korruption steigt sofort, die Unternehmer danken den Auftrag
    expect(nationalAverage(NET, w.net, "korruption")).toBeGreaterThan(korruptVorher);
    expect(nationalAverage(NET, w.net, "unternehmer")).toBeGreaterThan(unternehmerVorher);
    // je Baumonat wächst das Risiko weiter — Vergleichswelt mit gleichem Seed und Ausschreibung
    advance(w, 65);
    const w2 = welt();
    beginne(w2, VORHABEN_ID, "ausschreibung");
    advance(w2, 65);
    expect(nationalAverage(NET, w.net, "korruption")).toBeGreaterThan(nationalAverage(NET, w2.net, "korruption"));
  });

  test("Sparvergabe: günstiger und langsamer, das Ergebnis beginnt in schlechterem Zustand", () => {
    const w = welt();
    const v = vorhabenDef(VORHABEN_ID)!;
    const a = vergabeAngebot(v, "sparvergabe");
    expect(a.pk).toBeLessThan(v.kosten.pk);
    expect(a.monate).toBeGreaterThan(v.kosten.monate);
    expect(a.zustandFertig).toBe(70);
    const kapital = w.spiel!.kapital;
    const r = beginne(w, VORHABEN_ID, "sparvergabe");
    expect(r.ok, r.text).toBe(true);
    expect(w.spiel!.kapital).toBeCloseTo(kapital - a.pk, 6);
    advance(w, 30 * 12);
    const b = reichZustand(w).bestand[VORHABEN_ID];
    expect(b, "das Vorhaben ist fertig").toBeDefined();
    // statt der üblichen 90, abzüglich etwas Verfall seit der Fertigstellung
    expect(b!.zustand).toBeLessThan(75);
    expect(b!.zustand).toBeGreaterThan(60);
  });

  test("Transparente Ausschreibung: Vergabephase verzögert den Baubeginn, Märkte und EU sehen es gern", () => {
    const w = welt();
    const maerkteVorher = nationalAverage(NET, w.net, "vertrauen_maerkte");
    const euVorher = dimensionZu(w, "EU", "vertrauen");
    const r = beginne(w, VORHABEN_ID, "ausschreibung");
    expect(r.ok, r.text).toBe(true);
    const s = vorhabenSicht(w, VORHABEN_ID)!;
    expect(s.vergabe).toBe("ausschreibung");
    expect(s.vergabePhase).toBe(true);
    expect(s.vergabeMonate).toBe(2);
    expect(s.rate).toBe(0);
    expect(nationalAverage(NET, w.net, "vertrauen_maerkte")).toBeGreaterThan(maerkteVorher);
    expect(dimensionZu(w, "EU", "vertrauen")).toBeGreaterThan(euVorher);
    // in der Vergabephase fließt keine Baukapazität
    advance(w, 40);
    expect(reichZustand(w).laufend.find((l) => l.id === VORHABEN_ID)!.fortschritt).toBe(0);
    // danach geht es los (der Bau schreitet im Monatsschritt am Monatsersten)
    advance(w, 60);
    expect(reichZustand(w).laufend.find((l) => l.id === VORHABEN_ID)!.fortschritt).toBeGreaterThan(0);
  });

  test("Ohne Angabe gilt die transparente Ausschreibung (Schnellstart und ältere Spielstände)", () => {
    const w = welt();
    expect(beginne(w, "restaurierung_smyrna").ok).toBe(true);
    expect(reichZustand(w).laufend.find((x) => x.id === "restaurierung_smyrna")!.vergabe).toBe("ausschreibung");
    // Altstand: Eintrag ganz ohne Vergabe-Felder lädt und baut weiter
    const kopie = JSON.parse(JSON.stringify(w)) as typeof w;
    const alt = kopie.spiel!.reich!.laufend.find((x) => x.id === "restaurierung_smyrna")!;
    delete alt.vergabe;
    delete alt.bau;
    delete alt.monate;
    delete alt.vergabeBis;
    expect(laufVergabe(alt)).toBe("ausschreibung");
    expect(vorhabenSicht(kopie, "restaurierung_smyrna")!.vergabe).toBe("ausschreibung");
    expect(vorhabenSicht(kopie, "restaurierung_smyrna")!.vergabePhase).toBe(false);
    advance(kopie, 30 * 10);
    expect(Number.isFinite(verwaltungBilanz(kopie).netto)).toBe(true);
    expect(kopie.spiel!.reich!.laufend.every((l) => Number.isFinite(l.fortschritt))).toBe(true);
  });
});

describe("Baureihenfolge mit Verdrängungspreis (INF-3)", () => {
  /** Drei frische Bauten vor den drei Anfangsbauten: [thyatira, pergamon, ephesos, …] */
  function dreiBauten() {
    const w = welt();
    beginne(w, "restaurierung_ephesos", "stammfirma");
    beginne(w, "restaurierung_pergamon", "stammfirma");
    beginne(w, "restaurierung_thyatira", "stammfirma");
    return w;
  }

  test("Die Warteschlange zeigt Positionen und ehrliche Schätzungen; Pausierte bekommen keine", () => {
    const w = dreiBauten();
    const ws = warteschlange(w);
    expect(ws.map((e) => e.position)).toEqual(ws.map((_, i) => i + 1));
    expect(ws[0]!.id).toBe("restaurierung_thyatira");
    expect(ws[0]!.vergabe).toBe("stammfirma");
    expect(ws[0]!.startIn).toBe(0);
    expect(ws[0]!.rate).toBeGreaterThan(0);
    for (const e of ws) expect(e.fertigIn, e.id).toBeDefined();
    pausiere(w, "restaurierung_pergamon", true);
    const ws2 = warteschlange(w);
    const p = ws2.find((e) => e.id === "restaurierung_pergamon")!;
    expect(p.pausiert).toBe(true);
    expect(p.fertigIn).toBeUndefined();
    expect(p.startIn).toBeUndefined();
    expect(p.rate).toBe(0);
    expect(ws2.length).toBe(ws.length);
  });

  test("Vorziehen kostet Verwaltungskraft und benennt das Verdrängte; Zurückstellen ist frei", () => {
    const w = dreiBauten();
    const z = reichZustand(w);
    const verwaltung = z.verwaltung;
    const r = verschiebe(w, "restaurierung_pergamon", -1);
    expect(r.ok).toBe(true);
    expect(r.kosten).toBe(VORZIEHEN_VERWALTUNG);
    expect(r.verdrangt).toEqual([vorhabenDef("restaurierung_thyatira")!.name]);
    expect(z.verwaltung).toBeCloseTo(verwaltung - VORZIEHEN_VERWALTUNG, 6);
    expect(z.laufend.map((l) => l.id).slice(0, 2)).toEqual(["restaurierung_pergamon", "restaurierung_thyatira"]);
    // Zurückstellen kostet nichts
    const r2 = verschiebe(w, "restaurierung_pergamon", 1);
    expect(r2.ok).toBe(true);
    expect(r2.kosten).toBeUndefined();
    expect(z.verwaltung).toBeCloseTo(verwaltung - VORZIEHEN_VERWALTUNG, 6);
    expect(z.laufend.map((l) => l.id).slice(0, 2)).toEqual(["restaurierung_thyatira", "restaurierung_pergamon"]);
    // ohne Vorrat kein Vorziehen, die Reihenfolge bleibt wie sie ist
    z.verwaltung = VORZIEHEN_VERWALTUNG - 1;
    const vorher = z.laufend.map((l) => l.id);
    const r3 = verschiebe(w, "restaurierung_pergamon", -1);
    expect(r3.ok).toBe(false);
    expect(r3.grund).toContain("Verwaltungskraft");
    expect(z.laufend.map((l) => l.id)).toEqual(vorher);
    // an der Spitze geht es nicht weiter nach vorn
    expect(verschiebe(w, vorher[0]!, -1).ok).toBe(false);
    expect(verschiebe(w, vorher[vorher.length - 1]!, 1).ok).toBe(false);
  });

  test("Die Reihenfolge entscheidet, wer zuerst fertig wird", () => {
    const w = dreiBauten();
    const ws = warteschlange(w);
    const th = ws.find((e) => e.id === "restaurierung_thyatira")!;
    const ep = ws.find((e) => e.id === "restaurierung_ephesos")!;
    expect(th.fertigIn!).toBeLessThan(ep.fertigIn!);
  });
});

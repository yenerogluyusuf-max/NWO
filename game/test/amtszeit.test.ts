// Amtszeiten: Beginn nach der Wiederwahl, Umbildung, Ziele, Müdigkeit, Nachholen für ältere Stände, Nachfolge in der letzten Amtszeit.

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { describe, expect, test } from "vitest";
import { advance, createWorld, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { entscheide } from "../src/sim/ereignisse";
import { figur } from "../src/sim/figuren";
import { eigenVon } from "../src/sim/personen";
import { zielDef, zielStand, zieleAngebot } from "../src/sim/ziele";
import { zielZustimmung } from "../src/sim/spiel";
import { erstelleBilanz } from "../src/sim/bilanz";
import { istLetzteWahl, wahlabendQuittieren, parlamentNachtragFrage, parlamentNachtragAntwort } from "../src/sim/wahl";
import { Rng } from "../src/sim/rng";
import {
  AMTSZEIT,
  amtszeitMonat,
  amtszeitStarts,
  kronprinzen,
  kuereNachfolger,
  muedigkeitsMonate,
  nachholen,
  regierungsJahre,
  umbildungAbschliessen,
  umbildungBehalten,
  umbildungErsetzen,
  umbildungPartner,
  umbildungSicht,
  umbildungVersetzen,
  waehleZieleAmtszeit,
} from "../src/sim/amtszeit";
import { kandidatenFuer } from "../src/sim/nachfolge";
import type { World } from "../src/sim/types";

const profil: PlayerProfile = {
  name: "Test",
  heimat: "Ankara",
  heimatPlaka: 6,
  jugend: "",
  beruf: "",
  partner: "Bauunternehmer, Aufträge vom Staat möglich",
  motiv: "",
  partei: { name: "Partei der Werte", kurz: "PW", farbe: "#2e6b3f" },
  naehe: {},
  buendnis: "YENİ",
  versprechen: ["Rentenerhöhung in den ersten hundert Tagen versprochen."],
  wahl: { runde: 2, anteil: 51 },
};

function spiel(seed = 5): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, profil);
  w.spiel!.ereignisse = [];
  return w;
}

/** Eine Welt unmittelbar nach der ersten Wiederwahl (zweite und letzte Amtszeit). */
function nachWiederwahl(seed = 5): World {
  const w = spiel(seed);
  w.spiel!.umfrage.zustimmung = 80;
  w.spiel!.kalibrierung += 33;
  advance(w, w.spiel!.wahltag - w.day + 1);
  if (w.spiel!.wahl?.stichwahl) advance(w, 16);
  if (w.spiel!.amtszeit !== 2) throw new Error("Wiederwahl blieb aus");
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 60;
  return w;
}

describe("Beginn der zweiten Amtszeit", () => {
  test("Ziele eingefroren, Umbildungsfenster und Zielwahl offen, Beginn gezählt", () => {
    const w = spiel();
    const vorher = w.day;
    waehleZieleAmtszeit(w, []);
    w.spiel!.ziele = ["inflation15", "wohnen", "mehrheit"];
    w.spiel!.umfrage.zustimmung = 80;
    w.spiel!.kalibrierung += 33;
    advance(w, w.spiel!.wahltag - w.day + 1);
    const sp = w.spiel!;
    expect(sp.amtszeit).toBe(2);
    expect(sp.zielArchiv).toHaveLength(1);
    expect(sp.zielArchiv![0]!.ziele).toHaveLength(3);
    expect(sp.ziele).toHaveLength(0);
    expect(sp.zielwahl).toEqual({ amtszeit: 2, offen: true });
    expect(sp.umbildung?.anlass).toBe("wiederwahl");
    expect(sp.umbildung!.bis - sp.umbildung!.seit).toBe(AMTSZEIT.umbildungTage);
    expect(sp.amtszeiten).toHaveLength(2);
    expect(sp.amtszeiten![1]!.tag).toBeGreaterThan(vorher + 1000);
    expect(sp.wahltag).toBeGreaterThan(w.day + 1700);
    expect(sp.nachfolge?.aspiranten.length).toBeGreaterThan(0);
  });

  test("Die Müdigkeit zählt ab dem Beginn der Amtszeit, ein Teil des Verschleißes geht mit", () => {
    const w = nachWiederwahl();
    const s = amtszeitStarts(w)[1]!.tag / 30.4;
    expect(muedigkeitsMonate(w, s - 3)).toBeCloseTo(s - 3, 6);
    expect(muedigkeitsMonate(w, s)).toBeCloseTo(s, 6);
    expect(muedigkeitsMonate(w, s + 10)).toBeCloseTo(Math.min(AMTSZEIT.uebertragMax, AMTSZEIT.uebertrag * s) + 10, 6);
    expect(regierungsJahre(w)).toBeLessThan(w.day / 365);
    // Die erste Amtszeit zählt wie bisher ab Tag 0
    const w1 = spiel();
    expect(muedigkeitsMonate(w1, 17)).toBe(17);
  });
});

describe("Umbildung", () => {
  test("Sicht: sieben Ministerien mit Kandidaten, Fenster offen", () => {
    const w = nachWiederwahl();
    const s = umbildungSicht(w)!;
    expect(s.offen).toBe(true);
    expect(s.minister).toHaveLength(7);
    for (const m of s.minister) {
      expect(m.kandidaten).toHaveLength(3);
      expect(m.loyalitaet).toBeGreaterThanOrEqual(0);
    }
  });

  test("Bestätigen kostet nichts und stärkt die Loyalität", () => {
    const w = nachWiederwahl();
    const f = figur(w, "finanzen")!;
    const l = f.loyalitaet;
    const pk = w.spiel!.kapital;
    expect(umbildungBehalten(w, "finanzen").ok).toBe(true);
    expect(f.loyalitaet).toBeGreaterThan(l);
    expect(w.spiel!.kapital).toBe(pk);
    expect(w.spiel!.umbildung!.entschieden.finanzen).toBe("behalten");
  });

  test("Ersetzen kostet im Fenster die Hälfte, danach den vollen Preis", () => {
    const w = nachWiederwahl();
    const k = kandidatenFuer(w, "inneres")[0]!;
    const pk = w.spiel!.kapital;
    const r = umbildungErsetzen(w, "inneres", k.id);
    expect(r.ok).toBe(true);
    expect(pk - w.spiel!.kapital).toBe(k.pk - Math.floor(k.pk * (1 - AMTSZEIT.kostenAnteil)));
    expect(w.spiel!.umbildung!.entschieden.inneres).toBe("ersetzt");
    // Nach dem Fenster geht Ersetzen über die Umbildung nicht mehr
    advance(w, AMTSZEIT.umbildungTage + 5);
    expect(umbildungErsetzen(w, "aussen", kandidatenFuer(w, "aussen")[0]!.id).ok).toBe(false);
  });

  test("Versetzen tauscht die Personen, beide arbeiten sich ein und sind im fremden Ressort schwächer", () => {
    const w = nachWiederwahl();
    const a = figur(w, "finanzen")!;
    const b = figur(w, "aussen")!;
    const nameA = a.name;
    const nameB = b.name;
    const fa = eigenVon(w, a).faehigkeit;
    expect(umbildungVersetzen(w, "finanzen", "aussen").ok).toBe(true);
    expect(a.name).toBe(nameB);
    expect(b.name).toBe(nameA);
    expect(eigenVon(w, b).faehigkeit).toBeLessThan(fa);
    expect(eigenVon(w, a).einarbeitungBis!).toBeGreaterThan(w.day);
    expect(umbildungVersetzen(w, "finanzen", "finanzen").ok).toBe(false);
  });

  test("Partner bekommen Ministerien; offene Ansprüche werden beim Schließen zu Zusagen", () => {
    const w = nachWiederwahl();
    const s = umbildungSicht(w)!;
    const anspruch = s.partner.find((p) => p.anspruch > 0);
    if (!anspruch) return; // ohne Partner im Lager gibt es keinen Anspruch
    const zusagen = w.spiel!.zusagen.length;
    expect(umbildungPartner(w, "wirtschaft", anspruch.partei).ok).toBe(true);
    expect(figur(w, "wirtschaft")!.partei).toBe(anspruch.partei);
    expect(w.spiel!.umbildung!.partnerVergeben![anspruch.partei]).toBe(1);
    umbildungAbschliessen(w);
    expect(w.spiel!.umbildung!.abgeschlossen).toBe(true);
    const fehlt = anspruch.anspruch - 1;
    expect(w.spiel!.zusagen.length - zusagen).toBe(Math.max(0, fehlt) > 0 ? 1 : 0);
  });

  test("Nach Ablauf des Fensters schließt der Monatshaken die Umbildung", () => {
    const w = nachWiederwahl();
    advance(w, AMTSZEIT.umbildungTage + 35);
    expect(w.spiel!.umbildung!.abgeschlossen).toBe(true);
  });
});

describe("Ziele der neuen Amtszeit", () => {
  test("Das Angebot enthält keine schon erreichten Ziele und nennt den Stand; mindestens drei außenpolitische und drei staatsbezogene stehen zur Wahl", () => {
    const w = spiel();
    const a = zieleAngebot(w, false);
    // „Schulden unter 30 Prozent“ ist beim Start schon erfüllt und misst nichts
    expect(zielDef("schulden30")!.pruefe(w).erreicht).toBe(true);
    expect(a.some((x) => x.def.id === "schulden30")).toBe(false);
    for (const x of a) expect(x.stand.length).toBeGreaterThan(0);
    expect(a.filter((x) => x.def.bereich === "aussen").length).toBeGreaterThanOrEqual(3);
    expect(a.filter((x) => x.def.bereich === "staat").length).toBeGreaterThanOrEqual(3);
    // Das Vermächtnis-Ziel gibt es nur in der letzten Amtszeit
    expect(a.some((x) => x.def.id === "nachfolge")).toBe(false);
    expect(zieleAngebot(w, true).some((x) => x.def.id === "nachfolge")).toBe(true);
  });

  test("Zielwahl der Amtszeit setzt höchstens drei Ziele und schließt die Zielwahl", () => {
    const w = nachWiederwahl();
    waehleZieleAmtszeit(w, ["partner5", "ordnung", "wort", "rechtsstaat60", "unbekannt"]);
    expect(w.spiel!.ziele).toEqual(["partner5", "ordnung", "wort"]);
    expect(w.spiel!.zielwahl).toEqual({ amtszeit: 2, offen: false });
    for (const z of zielStand(w)) expect(z.stand.length).toBeGreaterThan(0);
  });

  test("Die neuen Ziele prüfen fehlerfrei in jeder Lage", () => {
    const w = spiel();
    for (const id of ["partner5", "frieden", "vertraege3", "ansehen60", "rechtsstaat60", "ordnung", "wort", "kabinett", "nachfolge"]) {
      const r = zielDef(id)!.pruefe(w);
      expect(typeof r.erreicht).toBe("boolean");
      expect(r.stand).not.toMatch(/undefined|NaN|\{/);
    }
  });
});

describe("Zwischenbilanz und Bilanz", () => {
  test("Die Zwischenbilanz zeigt die Ziele der ersten Amtszeit aus dem Archiv", () => {
    const w = spiel();
    w.spiel!.ziele = ["inflation15", "wohnen"];
    w.spiel!.umfrage.zustimmung = 80;
    w.spiel!.kalibrierung += 33;
    advance(w, w.spiel!.wahltag - w.day + 1);
    const b = erstelleBilanz(w, "zwischen");
    expect(b.titel).toBe("Zwischenbilanz der ersten Amtszeit");
    expect(b.ziele).toHaveLength(2);
    expect(b.absaetze.join(" ")).toMatch(/Wahl am/);
  });
});

describe("Nachholen für ältere Stände", () => {
  test("Ein Stand nach der Wiederwahl ohne die neue Struktur bekommt Umbildung und Zielwahl nachgereicht", () => {
    const w = nachWiederwahl();
    const sp = w.spiel!;
    // Alter Stand: nur Amtszeit und Wahltag, sonst nichts
    delete sp.umbildung;
    delete sp.zielArchiv;
    delete sp.zielwahl;
    delete sp.amtszeiten;
    delete sp.nachfolge;
    delete sp.wahl;
    advance(w, 40);
    if (parlamentNachtragFrage(w)) parlamentNachtragAntwort(w, "nein");
    expect(w.spiel!.umbildung?.anlass).toBe("nachgereicht");
    expect(w.spiel!.zielwahl?.offen).toBe(true);
    expect(w.spiel!.amtszeiten).toHaveLength(2);
    expect(Number.isFinite(muedigkeitsMonate(w, w.day / 30.4))).toBe(true);
  });

  test("Zu spät nach der Wahl wird nichts mehr nachgereicht", () => {
    const w = nachWiederwahl();
    const sp = w.spiel!;
    advance(w, AMTSZEIT.nachholenTage + 40);
    delete sp.umbildung;
    delete sp.zielArchiv;
    delete sp.zielwahl;
    nachholen(w);
    expect(w.spiel!.umbildung).toBeUndefined();
    expect(w.spiel!.zielwahl).toBeUndefined();
  });

  test.skipIf(!existsSync(`${homedir()}/Downloads/staatsraeson_2029-11-20.json`))("Der Stand vom 20.11.2029 lädt und läuft bis zur ersten Wahl, ohne Fehler (Datei nur gelesen)", () => {
    const d = JSON.parse(readFileSync(`${homedir()}/Downloads/staatsraeson_2029-11-20.json`, "utf8")) as { welt: unknown };
    const w = load(JSON.stringify(d.welt));
    w.spiel!.umfrage.zustimmung = 75;
    w.spiel!.kalibrierung += 25;
    for (let i = 0; i < 80 && !w.spiel!.ende && w.spiel!.amtszeit < 2; i++) {
      advance(w, 30);
      w.spiel!.ereignisse = [];
    }
    expect(w.spiel!.wahl?.historie.length ?? 0).toBeGreaterThanOrEqual(1);
    expect(Object.values(w.parliament!.seats).reduce((a, b) => a + b, 0)).toBe(600);
    expect(Number.isFinite(w.spiel!.umfrage.zustimmung)).toBe(true);
  });
});

describe("Letzte Amtszeit: Nachfolge", () => {
  test("Anwärter aus dem Kabinett, Kür mit Folgen für Gekürte und Übergangene", () => {
    const w = nachWiederwahl();
    expect(istLetzteWahl(w)).toBe(true);
    const a = kronprinzen(w);
    expect(a.length).toBeGreaterThanOrEqual(2);
    expect(a.length).toBeLessThanOrEqual(3);
    const erster = a[0]!;
    const f = figur(w, erster.amt)!;
    const l = f.loyalitaet;
    const r = kuereNachfolger(w, erster.amt);
    expect(r.ok).toBe(true);
    expect(w.spiel!.nachfolge!.nachfolger?.name).toBe(erster.name);
    expect(f.loyalitaet).toBeGreaterThan(l);
    expect(kuereNachfolger(w, "offen").ok).toBe(false);
  });

  test("Der offene Weg lässt die Partei nach Stärke entscheiden", () => {
    const w = nachWiederwahl();
    expect(kuereNachfolger(w, "offen").ok).toBe(true);
    expect(w.spiel!.nachfolge!.gekuert).toBe("offen");
    expect(w.spiel!.nachfolge!.nachfolger).toBeDefined();
  });

  test("Der Monatshaken öffnet die Nachfolgefrage 18 Monate vor der letzten Wahl, einmal", () => {
    const w = nachWiederwahl();
    advance(w, w.spiel!.wahltag - w.day - AMTSZEIT.kuerVorherTage + 40);
    amtszeitMonat(w, new Rng(3));
    const offen = w.spiel!.ereignisse.filter((e) => e.vorlage === "nachfolge_kuer");
    expect(offen.length + (w.spiel!.nachfolge?.gekuert ? 1 : 0)).toBeGreaterThanOrEqual(1);
    expect(offen.length).toBeLessThanOrEqual(1);
    if (offen[0]) {
      w.spiel!.kapital = 50;
      const r = entscheide(w, offen[0].id, "offen", new Rng(2));
      expect(r.ok).toBe(true);
      expect(w.spiel!.nachfolge!.nachfolger).toBeDefined();
    }
  });

  test("Die letzte Wahl: Der Nachfolger gewinnt oder verliert, das Ende nennt es", () => {
    const sieg = nachWiederwahl();
    kuereNachfolger(sieg, "offen");
    sieg.spiel!.kalibrierung += 72 - zielZustimmung(sieg);
    sieg.spiel!.umfrage.zustimmung = 72;
    advance(sieg, sieg.spiel!.wahltag - sieg.day + 1);
    if (sieg.spiel!.wahl?.stichwahl) advance(sieg, 16);
    expect(sieg.spiel!.ende?.art).toBe("amtszeitende");
    expect(sieg.spiel!.ende?.nachfolge).toBe("sieg");
    expect(sieg.spiel!.wahl!.historie[1]!.letzteWahl).toBe(true);
    expect(erstelleBilanz(sieg).absaetze.join(" ")).toMatch(/Nachfolgewahl/);

    const niederlage = nachWiederwahl();
    kuereNachfolger(niederlage, "offen");
    niederlage.spiel!.kalibrierung += 38 - zielZustimmung(niederlage);
    niederlage.spiel!.umfrage.zustimmung = 38;
    advance(niederlage, niederlage.spiel!.wahltag - niederlage.day + 1);
    if (niederlage.spiel!.wahl?.stichwahl) advance(niederlage, 16);
    expect(niederlage.spiel!.ende?.art).toBe("abwahl");
    expect(niederlage.spiel!.ende?.nachfolge).toBe("niederlage");
  });

  test("Der Abtrünnige kostet Stimmen", () => {
    const mit = nachWiederwahl(7);
    kuereNachfolger(mit, "offen");
    mit.spiel!.nachfolge!.abtruenniger = { amt: "inneres", name: "Rivale", staerke: 70, ehrgeiz: 90, rolle: "Innenministerin" };
    const ohne = nachWiederwahl(7);
    kuereNachfolger(ohne, "offen");
    delete ohne.spiel!.nachfolge!.abtruenniger;
    for (const w of [mit, ohne]) {
      w.spiel!.umfrage.zustimmung = 60;
      w.spiel!.kalibrierung += 8;
      while (w.day < w.spiel!.wahltag && !w.spiel!.ende) {
        advance(w, Math.min(30, w.spiel!.wahltag - w.day + 1));
        if (w.spiel!.enden?.gesundheit?.zustand === "verschwiegen") {
          w.spiel!.enden.gesundheit.zustand = "krank";
        }
      }
    }
    const a = (w: World) => (w.spiel!.wahl!.stichwahl?.runde1 ?? w.spiel!.wahl!.historie[1]!.runden[0]!).anteile.amt!;
    expect(a(mit)).toBeLessThan(a(ohne));
  });
});

describe("Nach der Quittung", () => {
  test("Umbildung und Zielwahl bleiben offen, bis sie beantwortet sind", () => {
    const w = nachWiederwahl();
    wahlabendQuittieren(w);
    expect(w.spiel!.umbildung!.abgeschlossen).toBeUndefined();
    expect(w.spiel!.zielwahl!.offen).toBe(true);
  });
});

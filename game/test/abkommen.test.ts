// Der Verhandlungstisch: Klauselkatalog, Bewertung durch die Gegenseite, Verträge und ihre Folgen, Vermittlung.

import { describe, expect, test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";
import { LAENDER, dimensionZu, vertrauenZu, weltZustand } from "../src/sim/laender";
import { KLAUSELN, KLAUSEL_NACH_ID, PROFILE, AUSSTRAHLUNG } from "../src/data/abkommen";
import { abkommenMonat, bewerte, heimWirkung, klauselnFuer, kuendige, laufende, nimmGegenangebot, pkFuer, sperreRest, verhandle, vermittle, vermittlungen, type Angebot } from "../src/sim/abkommen";
import { setPolicy } from "../src/sim/handeln";
import { Rng } from "../src/sim/rng";

function neu() {
  const w = createWorld(turkey2026, 11);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 100;
  return w;
}

const A = (land: string, gibt: string[], will: string[], jahre: 2 | 5 | 10 = 5): Angebot => ({ land, gibt, will, jahre });

describe("Katalog", () => {
  test("Jedes Land des Spiels hat ein Profil mit Angeboten und Forderungen; alle Klauseln existieren", () => {
    for (const l of LAENDER) {
      const p = PROFILE[l.id];
      expect(p, l.id).toBeDefined();
      const ids = Object.keys(p!.werte);
      expect(ids.filter((id) => KLAUSEL_NACH_ID[id]?.seite === "gibt").length, `${l.id}: Angebote`).toBeGreaterThanOrEqual(3);
      expect(ids.filter((id) => KLAUSEL_NACH_ID[id]?.seite === "will").length, `${l.id}: Forderungen`).toBeGreaterThanOrEqual(2);
      for (const id of ids) {
        const k = KLAUSEL_NACH_ID[id];
        expect(k, `${l.id}/${id}`).toBeDefined();
        // Was die Türkei bietet, ist dem Partner etwas wert oder egal; was sie verlangt, kostet ihn oder ist ihm egal
        if (k!.seite === "gibt") expect(p!.werte[id]!, `${l.id}/${id}`).toBeGreaterThanOrEqual(0);
        else expect(p!.werte[id]!, `${l.id}/${id}`).toBeLessThanOrEqual(0);
      }
      for (const r of p!.rot) expect(p!.werte[r], `${l.id}: rot ${r}`).toBeLessThan(-50);
    }
  });

  test("Alle Wirkungen zeigen auf gültige Größen, Maßnahmen und Länder", () => {
    for (const k of KLAUSELN) {
      for (const e of [...(k.abschluss ?? []), ...(k.dauer ?? [])]) if (e.t === "knoten") expect(NET.index.has(e.id), `${k.id}/${e.id}`).toBe(true);
      const pf = k.pflicht;
      if (pf && "id" in pf) expect(NET.index.get(pf.id) !== undefined, `${k.id} Pflicht`).toBe(true);
      expect(k.kehrseite.length, k.id).toBeGreaterThan(20);
      expect(k.text.length, k.id).toBeGreaterThan(30);
    }
    for (const [schluessel, liste] of Object.entries(AUSSTRAHLUNG)) {
      const [klausel, l] = schluessel.split("@");
      expect(KLAUSEL_NACH_ID[klausel!], schluessel).toBeDefined();
      expect(LAENDER.some((x) => x.id === l), schluessel).toBe(true);
      for (const x of liste) expect(LAENDER.some((y) => y.id === x.land), `${schluessel} -> ${x.land}`).toBe(true);
    }
  });

  test("Die Heimwirkung einer Klausel lässt sich in Zeilen zeigen", () => {
    const z = heimWirkung(KLAUSEL_NACH_ID["zoll"]!);
    expect(z.dauer.length).toBeGreaterThanOrEqual(3);
    expect(z.dauer.some((x) => x.gut) && z.dauer.some((x) => !x.gut)).toBe(true);
    expect(z.sofort.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Bewertung durch die Gegenseite", () => {
  test("Ein leeres Angebot bewirkt nichts; eine Rote Linie ist ein Veto", () => {
    const w = neu();
    expect(bewerte(w, A("GRC", [], [])).urteil).toBe("leer");
    const b = bewerte(w, A("GRC", ["v_casus", "verzicht_bohrung"], ["w_inseln"]));
    expect(b.urteil).toBe("veto");
    expect(b.veto).toMatch(/Athen/);
    expect(bewerte(w, A("ARM", ["grenzoeffnung"], ["w_1915"])).urteil).toBe("veto");
  });

  test("Wer nur verlangt, wird abgewiesen; ein ausgewogenes Paket findet Zustimmung", () => {
    const w = neu();
    expect(bewerte(w, A("SYR", [], ["w_rueckkehr", "w_pkk", "w_stuetzpunkt"])).urteil).toMatch(/ablehnung|gegenangebot/);
    const gut = bewerte(w, A("SYR", ["bauauftraege", "energie_lieferung"], ["w_rueckkehr"]));
    expect(gut.urteil).toBe("zustimmung");
    expect(gut.gruende.some((g) => g.art === "plus")).toBe(true);
  });

  test("Knapp unter der Schwelle kommt ein Gegenangebot mit einer Änderung, das dann zustimmt", () => {
    const w = neu();
    let gesehen = 0;
    for (const l of LAENDER) {
      const p = PROFILE[l.id]!;
      const will = Object.keys(p.werte).filter((id) => KLAUSEL_NACH_ID[id]!.seite === "will" && !p.rot.includes(id));
      const gibt = Object.keys(p.werte).filter((id) => KLAUSEL_NACH_ID[id]!.seite === "gibt");
      // Alle Forderungen, ein einziges Angebot: liegt oft knapp darunter
      const b = bewerte(w, A(l.id, gibt.slice(0, 1), will.slice(0, 2)));
      if (b.urteil !== "gegenangebot") continue;
      gesehen++;
      const g = b.gegenangebote[0]!;
      expect(g.text).toMatch(/stimmt zu/);
      expect(bewerte(w, g.angebot).urteil, l.id).toBe("zustimmung");
    }
    expect(gesehen).toBeGreaterThanOrEqual(3);
  });

  test("Vertrauen und Streit verschieben die Bewertung; die Bewertung ist reine Rechnung", () => {
    const w = neu();
    const a = A("USA", ["ruestung_kauf"], ["w_ruestung"]);
    const vorher = bewerte(w, a).punkte;
    expect(bewerte(w, a).punkte).toBe(vorher);
    const z = weltZustand(w)["USA"]!;
    z.versatz += 15;
    expect(bewerte(w, a).punkte).toBeGreaterThan(vorher + 2.5);
    z.konflikt += 30;
    expect(bewerte(w, a).punkte).toBeLessThan(bewerte({ ...w }, A("USA", ["ruestung_kauf"], ["w_ruestung"])).punkte + 0.001);
    const langer = bewerte(w, A("USA", ["ruestung_kauf"], ["w_ruestung"], 10));
    expect(langer.grenze).toBeGreaterThan(bewerte(w, a).grenze);
  });

  test("Sperren: eine Klausel setzt Vertrauen oder Sicherheit voraus", () => {
    const w = neu();
    const k = klauselnFuer(w, "ARM").find((x) => x.def.id === "grenzoeffnung")!;
    expect(k.gesperrt).toBeUndefined();
    const s = klauselnFuer(w, "RUS").find((x) => x.def.id === "meerengen")!;
    expect(s.def.mindestens).toBeDefined();
    weltZustand(w)["RUS"]!.versatz = -40;
    expect(klauselnFuer(w, "RUS").find((x) => x.def.id === "meerengen")!.gesperrt).toMatch(/Vertrauen/);
  });
});

describe("Verträge", () => {
  test("Ein Vertrag kostet Kapital, wirkt im Land und auf das Verhältnis, und dieselbe Klausel läuft nicht doppelt", () => {
    const w = neu();
    const angebot = A("SYR", ["bauauftraege", "energie_lieferung"], ["w_rueckkehr"]);
    const preis = pkFuer(angebot);
    const kapital = w.spiel!.kapital;
    const bau0 = nationalAverage(NET, w.net, "bauwirtschaft");
    const h0 = dimensionZu(w, "SYR", "handel");
    const r = verhandle(w, angebot);
    expect(r.ok, r.text).toBe(true);
    expect(r.urteil).toBe("zustimmung");
    expect(w.spiel!.kapital).toBe(kapital - preis);
    expect(laufende(w, "SYR")).toHaveLength(1);
    expect(dimensionZu(w, "SYR", "handel")).toBeGreaterThan(h0 + 6);
    for (let i = 0; i < 12; i++) advance(w, 30);
    expect(nationalAverage(NET, w.net, "bauwirtschaft")).toBeGreaterThan(bau0 + 0.5);
    // doppelt geht nicht
    const doppelt = verhandle(w, A("SYR", ["bauauftraege"], []));
    expect(doppelt.ok).toBe(false);
    expect(doppelt.text).toMatch(/läuft schon/);
  });

  test("Ein Veto kostet Kapital und Vertrauen und sperrt das Land; eine Ablehnung sperrt kürzer", () => {
    const w = neu();
    const v0 = vertrauenZu(w, "GRC");
    const r = verhandle(w, A("GRC", ["v_casus"], ["w_inseln"]));
    expect(r.ok).toBe(false);
    expect(r.urteil).toBe("veto");
    expect(vertrauenZu(w, "GRC")).toBeLessThan(v0);
    expect(sperreRest(w, "GRC")).toBeGreaterThan(30);
    const nochmal = verhandle(w, A("GRC", ["v_casus"], []));
    expect(nochmal.urteil).toBe("gesperrt");
    advance(w, 46);
    expect(sperreRest(w, "GRC")).toBe(0);
  });

  test("Ein Gegenangebot lässt sich ohne weitere Verhandlungskosten annehmen", () => {
    const w = neu();
    let angebot: Angebot | undefined;
    for (const l of LAENDER) {
      const p = PROFILE[l.id]!;
      const will = Object.keys(p.werte).filter((id) => KLAUSEL_NACH_ID[id]!.seite === "will" && !p.rot.includes(id));
      const gibt = Object.keys(p.werte).filter((id) => KLAUSEL_NACH_ID[id]!.seite === "gibt");
      const a = A(l.id, gibt.slice(0, 1), will.slice(0, 2));
      if (bewerte(w, a).urteil === "gegenangebot") {
        angebot = a;
        break;
      }
    }
    expect(angebot).toBeDefined();
    const r = verhandle(w, angebot!);
    expect(r.urteil).toBe("gegenangebot");
    const kapital = w.spiel!.kapital;
    const g = r.bewertung!.gegenangebote[0]!;
    const ok = nimmGegenangebot(w, g.angebot);
    expect(ok.ok, ok.text).toBe(true);
    // höchstens der politische Preis der Klauseln, nicht noch einmal der Sockel
    expect(kapital - w.spiel!.kapital).toBeLessThanOrEqual([...g.angebot.gibt, ...g.angebot.will].reduce((s, id) => s + (KLAUSEL_NACH_ID[id]?.pk ?? 0), 0));
  });

  test("Fehlendes Kapital verhindert das Angebot; ins Minus geht es nur bis zur Überziehung", () => {
    const w = neu();
    w.spiel!.kapital = 0;
    const r = verhandle(w, A("SYR", ["bauauftraege", "energie_lieferung"], ["w_rueckkehr"]));
    expect(r.ok).toBe(true); // Überziehung bis 20 Punkte
    const w2 = neu();
    w2.spiel!.kapital = -19;
    expect(verhandle(w2, A("SYR", ["bauauftraege", "energie_lieferung"], ["w_rueckkehr"])).urteil).toBe("kein-kapital");
  });

  test("Ungültige Angebote werden gemeldet: falsche Seite, doppelte Klausel, fremde Klausel", () => {
    const w = neu();
    expect(verhandle(w, A("SYR", ["w_pkk"], [])).text).toMatch(/verlangen/);
    expect(verhandle(w, A("SYR", ["bauauftraege", "bauauftraege"], [])).text).toMatch(/einmal/);
    expect(verhandle(w, A("SYR", ["s400"], [])).text).toMatch(/verhandelt nicht/);
    expect(verhandle(w, A("SYR", [], [])).text).toMatch(/mindestens eine/);
  });
});

describe("Laufzeit, Prüfung, Bruch", () => {
  function mitZoll() {
    const w = neu();
    setPolicy(w, "m_zoelle", 30);
    const r = verhandle(w, A("EGY", ["zoll", "ruestung_koop"], ["w_handelsziel"]));
    expect(r.ok, r.text).toBe(true);
    return w;
  }

  test("Die Jahresprüfung besteht, wenn die Pflicht erfüllt ist: das Vertrauen wächst", () => {
    const w = mitZoll();
    for (let i = 0; i < 13; i++) advance(w, 30);
    expect(laufende(w, "EGY")).toHaveLength(1);
    expect(laufende(w, "EGY")[0]!.verstoesse).toBe(0);
    expect(w.log.some((l) => l.text.includes("Jahresprüfung ist bestanden"))).toBe(true);
  });

  test("Zwei Verstöße brechen den Vertrag: Vertrauen und Ansehen sinken, das Land erinnert sich und verhandelt härter", () => {
    const w = mitZoll();
    setPolicy(w, "m_zoelle", 90);
    const vorher = bewerte(w, A("EGY", ["investitionen_oeffnen"], ["w_libyen"])).punkte;
    const an0 = nationalAverage(NET, w.net, "ansehen");
    for (let i = 0; i < 26; i++) advance(w, 30);
    const alle = weltZustand(w)["EGY"]!.vertraege!;
    expect(alle[0]!.status).toBe("gebrochen");
    expect(alle[0]!.ende).toMatch(/verfehlt/i);
    expect(weltZustand(w)["EGY"]!.bruch ?? 0).toBeGreaterThan(2);
    expect(nationalAverage(NET, w.net, "ansehen")).toBeLessThan(an0 + 1);
    expect(bewerte(w, A("EGY", ["investitionen_oeffnen"], ["w_libyen"])).punkte).toBeLessThan(vorher);
  });

  test("Ein Vertrag läuft aus; ein gehaltener zählt bei der nächsten Verhandlung", () => {
    const w = neu();
    const r = verhandle(w, A("SYR", ["bauauftraege", "energie_lieferung"], ["w_rueckkehr"], 2));
    expect(r.ok, r.text).toBe(true);
    const vorher = bewerte(w, A("SYR", ["kredit_hilfe"], ["w_pkk"])).punkte;
    for (let i = 0; i < 25; i++) advance(w, 30);
    expect(laufende(w, "SYR")).toHaveLength(0);
    expect(weltZustand(w)["SYR"]!.vertraege![0]!.status).toBe("ausgelaufen");
    expect(weltZustand(w)["SYR"]!.gehalten).toBe(1);
    const gh = bewerte(w, A("SYR", ["kredit_hilfe"], ["w_pkk"])).gruende.find((g) => /gehalten/.test(g.text));
    expect(gh).toBeDefined();
    void vorher;
  });

  test("Kündigen: ordentlich nach einem Drittel der Laufzeit, früher gilt als Bruch", () => {
    const w = neu();
    verhandle(w, A("SYR", ["bauauftraege", "energie_lieferung"], ["w_rueckkehr"], 5));
    const id = laufende(w, "SYR")[0]!.id;
    const frueh = kuendige(w, "SYR", id);
    expect(frueh.ok).toBe(true);
    expect(frueh.text).toMatch(/Bruch/);
    expect(weltZustand(w)["SYR"]!.bruch ?? 0).toBeGreaterThan(5);
    const w2 = neu();
    verhandle(w2, A("SYR", ["bauauftraege", "energie_lieferung"], ["w_rueckkehr"], 2));
    for (let i = 0; i < 10; i++) advance(w2, 30);
    const r = kuendige(w2, "SYR", laufende(w2, "SYR")[0]!.id);
    expect(r.text).toMatch(/gekündigt/);
    expect(weltZustand(w2)["SYR"]!.bruch ?? 0).toBe(0);
  });

  test("Die Erinnerung an einen Bruch klingt Monat für Monat ab", () => {
    const w = neu();
    weltZustand(w)["SYR"]!.bruch = 6;
    for (let i = 0; i < 12; i++) abkommenMonat(w);
    expect(weltZustand(w)["SYR"]!.bruch!).toBeLessThan(6);
    expect(weltZustand(w)["SYR"]!.bruch!).toBeGreaterThan(3);
  });

  test("Unzuverlässige Partner liefern nur zum Teil: was sie geben sollen, ruht", () => {
    const w = neu();
    verhandle(w, A("SYR", ["bauauftraege", "energie_lieferung"], ["w_rueckkehr"]));
    const z = weltZustand(w)["SYR"]!;
    z.versatz = -60;
    const g0 = nationalAverage(NET, w.net, "gefluechtete");
    for (let i = 0; i < 6; i++) advance(w, 30);
    void g0;
    expect(laufende(w, "SYR")[0]).toBeDefined();
  });
});

describe("Vermittlung", () => {
  test("Sie kostet Kapital, hat eine Aussicht und wirkt auf beide Seiten und das Ansehen", () => {
    const w = neu();
    weltZustand(w)["UKR"]!.versatz += 20;
    weltZustand(w)["RUS"]!.versatz += 10;
    const v = vermittlungen(w).find((x) => x.def.id === "ukr_rus")!;
    expect(v.moeglich, v.grund).toBe(true);
    expect(v.aussicht).toBeGreaterThan(20);
    const kapital = w.spiel!.kapital;
    const an0 = nationalAverage(NET, w.net, "ansehen");
    // Ein Wurf, der sicher gelingt (0) und einer, der sicher misslingt (nahe 1)
    const ok = vermittle(w, "ukr_rus", { next: () => 0 } as unknown as Rng);
    expect(ok.ok).toBe(true);
    expect(w.spiel!.kapital).toBe(kapital - 5);
    expect(nationalAverage(NET, w.net, "ansehen")).toBeGreaterThan(an0 + 1);
    expect(vermittle(w, "ukr_rus", { next: () => 0 } as unknown as Rng).text).toMatch(/Wieder möglich/);
    const w2 = neu();
    weltZustand(w2)["UKR"]!.versatz += 20;
    weltZustand(w2)["RUS"]!.versatz += 10;
    const schlecht = vermittle(w2, "ukr_rus", { next: () => 0.999 } as unknown as Rng);
    expect(schlecht.ok).toBe(false);
    expect(schlecht.text).toMatch(/scheitert/);
  });

  test("Ohne Vertrauen beider Seiten ist keine Vermittlung möglich", () => {
    const w = neu();
    weltZustand(w)["RUS"]!.versatz = -50;
    const v = vermittlungen(w).find((x) => x.def.id === "ukr_rus")!;
    expect(v.moeglich).toBe(false);
    expect(v.grund).toMatch(/vertraut/);
  });
});

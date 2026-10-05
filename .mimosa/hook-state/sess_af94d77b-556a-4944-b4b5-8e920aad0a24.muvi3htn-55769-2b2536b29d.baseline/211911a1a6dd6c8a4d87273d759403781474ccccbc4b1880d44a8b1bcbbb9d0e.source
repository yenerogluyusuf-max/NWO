// Bausteine des Lebenslauf-Buchs: Gesicht und Haltung der Figur, Folgen der Antworten, Wappen, Szenen, Band, Kamera.

import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { STATIONS, emptyProfile, type PlayerProfile } from "../src/sim/prolog";
import { STARTSZENARIEN } from "../src/data/startszenarien";
import { PARTEI_ACHSEN, VOREINSTELLUNGEN } from "../src/data/linien";
import { ALTER_BIS, ALTER_VON, BAERTE, FRISUREN, GESICHTSFORMEN, VORNAMEN_F, VORNAMEN_M, figurLage, nameNachAenderung, portraetFuer, standardAussehen, wuerfleAussehen, zufallsName } from "../src/ui/prolog/figur";
import { folgeVon, wirkungText } from "../src/ui/prolog/folge";
import { Parteiwappen, WAPPEN_IDS, Wappen, parteiFarbe } from "../src/ui/prolog/Wappen";
import { Szene, type SzenenId } from "../src/ui/prolog/Szenen";
import { Fortschritt } from "../src/ui/prolog/Fortschritt";
import { Figurenwahl } from "../src/ui/prolog/Figurenwahl";
import { buchBreite, verdeckterRand } from "../src/ui/prolog/kamera";
import { FOLGEN } from "../src/sim/biografie";

/** Eine Zufallsfolge mit festem Samen (Tests dürfen nicht vom Zufall abhängen) */
function lcg(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}

const antwort = (station: string, i: number) => STATIONS.find((s) => s.id === station)!.answers[i]!;

describe("Figur", () => {
  test("Würfeln liefert gültige Werte und der Samen macht das Gesicht reproduzierbar", () => {
    const r = lcg(7);
    const gesehen = new Set<string>();
    for (let i = 0; i < 80; i++) {
      const a = wuerfleAussehen(r);
      expect(a.alter).toBeGreaterThanOrEqual(ALTER_VON);
      expect(a.alter).toBeLessThanOrEqual(ALTER_BIS);
      expect(a.gesicht).toBeGreaterThanOrEqual(0);
      expect(a.gesicht).toBeLessThan(GESICHTSFORMEN);
      expect(a.haare).toBeLessThan(FRISUREN);
      expect(BAERTE).toContain(a.bart);
      if (a.geschlecht === "f") expect(a.bart).toBe("keiner");
      else expect(a.kopftuch).toBe(false);
      gesehen.add(`${a.geschlecht}${a.gesicht}${a.haare}`);
    }
    expect(gesehen.size).toBeGreaterThan(30);
    const a = standardAussehen();
    expect(portraetFuer("x", a)).toEqual(portraetFuer("anderer Name", a));
    expect(portraetFuer("x", { ...a, gesicht: 4 }).seed).not.toBe(portraetFuer("x", a).seed);
    expect(portraetFuer("Deniz", undefined)).toEqual({ seed: "Deniz" });
    // Kopftuch nur bei Frauen, Bart nur bei Männern
    expect(portraetFuer("x", { ...a, geschlecht: "m", kopftuch: true, bart: "voll" })).toMatchObject({ kopftuch: false, bart: "voll" });
    expect(portraetFuer("x", { ...a, geschlecht: "f", kopftuch: true, bart: "voll" })).toMatchObject({ kopftuch: true, bart: "keiner" });
  });

  test("Zufallsnamen: Vorname und Familienname, nie zweimal derselbe hintereinander", () => {
    const r = lcg(3);
    let vorher = "";
    for (let i = 0; i < 40; i++) {
      const n = zufallsName(i % 2 ? "f" : "m", r, vorher);
      expect(n).toMatch(/^\S+ \S+$/);
      expect(n).not.toBe(vorher);
      vorher = n;
    }
  });

  test("Name und Geschlecht passen zusammen: getrennte türkische Vornamenpools, Wechsel würfelt neu, selbst getippter Name bleibt", () => {
    for (const n of VORNAMEN_F) expect(VORNAMEN_M).not.toContain(n);
    expect(VORNAMEN_F.length).toBeGreaterThanOrEqual(15);
    expect(VORNAMEN_M.length).toBeGreaterThanOrEqual(15);
    const r = lcg(11);
    for (let i = 0; i < 60; i++) {
      expect(VORNAMEN_F).toContain(zufallsName("f", r).split(" ")[0]);
      expect(VORNAMEN_M).toContain(zufallsName("m", r).split(" ")[0]);
    }
    const frau = { ...standardAussehen(), geschlecht: "f" as const };
    const mann = { ...frau, geschlecht: "m" as const };
    // Wechsel Frau → Mann: ein Männername, nicht der alte
    const neu = nameNachAenderung(frau, mann, "Leyla Özkan", false, false, r);
    expect(VORNAMEN_M).toContain(neu.split(" ")[0]);
    // gleiches Geschlecht (etwa nur eine andere Frisur): der Name bleibt
    expect(nameNachAenderung(frau, { ...frau, haare: 3 }, "Leyla Özkan", false)).toBe("Leyla Özkan");
    // selbst getippt: bleibt auch beim Wechsel und beim Würfeln
    expect(nameNachAenderung(frau, mann, "Mein Name", true)).toBe("Mein Name");
    expect(nameNachAenderung(frau, mann, "Mein Name", true, true)).toBe("Mein Name");
    // Würfeln (immer): auch ohne Wechsel ein neuer Name aus dem Pool des Geschlechts
    const gewuerfelt = nameNachAenderung(frau, frau, "Leyla Özkan", false, true, r);
    expect(gewuerfelt).not.toBe("Leyla Özkan");
    expect(VORNAMEN_F).toContain(gewuerfelt.split(" ")[0]);
    // das Geschlecht des Gesichts kommt immer aus der Einstellung, nie aus dem Samen
    for (const g of ["f", "m"] as const) for (let gesicht = 0; gesicht < 16; gesicht++) expect(portraetFuer("egal", { ...frau, geschlecht: g, gesicht }).geschlecht).toBe(g);
  });

  test("die Figur altert mit den Stationen, kleidet sich nach Beruf und Partei und schaut nach Motiv und Wahlnacht", () => {
    const a = { ...standardAussehen(), alter: 60 };
    const p: PlayerProfile = emptyProfile();
    expect(figurLage(p, a, -2, 8).alter).toBe(60); // vor den Stationen: das Alter der Wahlnacht
    const alter = [0, 2, 4, 6, 8].map((s) => figurLage(p, a, s, 8).alter);
    expect(alter).toEqual([...alter].sort((x, y) => x - y));
    expect(alter[0]!).toBeLessThan(alter[4]!);
    expect(alter[4]).toBe(60);
    const neutral = figurLage(p, a, 1, 8).tint;
    antwort("beruf", 0).apply(p);
    const beruf = figurLage(p, a, 3, 8).tint;
    expect(beruf).not.toBe(neutral);
    p.partei = { name: "Test", kurz: "TST", farbe: "#123456" };
    expect(figurLage(p, a, 6, 8).tint).toBe("#123456");
    expect(figurLage(p, a, 6, 8).stimmung).toBe("neutral");
    antwort("politik", 3).apply(p); // Ehrgeiz
    expect(figurLage(p, a, 6, 8).stimmung).toBe("selbstgefaellig");
    antwort("wahlnacht", 0).apply(p); // knapp
    expect(figurLage(p, a, 8, 8).stimmung).toBe("muede");
  });

  test("Figurenwahl zeigt Bart bei Männern und Kopftuch bei Frauen", () => {
    const f = renderToStaticMarkup(<Figurenwahl wert={{ ...standardAussehen(), geschlecht: "f" }} onChange={() => {}} onWuerfeln={() => {}} />);
    expect(f).toContain("Kopftuch");
    expect(f).not.toContain("fw-bart");
    const m = renderToStaticMarkup(<Figurenwahl wert={{ ...standardAussehen(), geschlecht: "m" }} onChange={() => {}} onWuerfeln={() => {}} />);
    expect(m).toContain("fw-bart");
    for (const b of ["kein Bart", "Stoppeln", "Schnurrbart", "Kinnbart", "Vollbart"]) expect(m).toContain(b);
  });
});

describe("Folgen der Antworten", () => {
  test("eine Antwort mit Merkmal der Biografie zeigt Vorteil und Preis aus den Wirkungen", () => {
    const p = emptyProfile();
    const f = folgeVon(p, antwort("beruf", 0)); // Anwalt
    expect(f.vorteil.map((c) => c.text)).toEqual(FOLGEN.anwalt!.vorteil.map(wirkungText));
    expect(f.preis.map((c) => c.text)).toEqual(FOLGEN.anwalt!.preis.map(wirkungText));
    expect(f.vorteil[0]!.text).toBe("Justiz: Fähigkeit +10");
    expect(f.vorteil[0]!.staerke).toBe(1);
    expect(f.preis[0]!.text).toBe("Opposition: Ehrgeiz +5");
    // das Profil bleibt unverändert: die Vorschau wählt nichts
    expect(p.beruf).toBe("");
  });

  test("eine Stadt rückt Wählergruppen näher; die Wahlnacht zeigt Vorteil und Preis", () => {
    const p = emptyProfile();
    const konya = folgeVon(p, antwort("kindheit", 1));
    expect(konya.gruppen).toEqual([{ id: "konservative", delta: 3 }]);
    const knapp = folgeVon(p, antwort("wahlnacht", 0));
    expect(knapp.vorteil.length).toBeGreaterThan(0);
    expect(knapp.preis.length).toBeGreaterThan(0);
    expect(knapp.vorteil.map((c) => c.text).join(" ")).toContain("Kapital +8");
  });

  test("ein Bündnis macht die Partei zum Partner", () => {
    const f = folgeVon(emptyProfile(), antwort("wahlkampf", 1));
    expect(f.partner).toBe("MHP");
    expect(f.gruppen.some((g) => g.id === "konservative" && g.delta > 0)).toBe(true);
  });

  test("Wirkungen lesen sich in jeder Sprache wie Zeilen, mit Minuszeichen", () => {
    expect(wirkungText({ art: "knoten", id: "junge", delta: -1 })).toBe("Junge −1");
    expect(wirkungText({ art: "knoten", id: "legitimitaet", delta: 3 })).toBe("Legitimität +3");
    expect(wirkungText({ art: "kabinettEhrgeiz", delta: 3 })).toBe("Kabinett: Ehrgeiz +3");
    expect(wirkungText({ art: "partnerLoyalitaet", delta: -4 })).toBe("Partner: Loyalität −4");
    expect(wirkungText({ art: "kapital", delta: 6 })).toBe("Kapital +6");
  });
});

describe("Wappen, Szenen, Band, Kamera", () => {
  test("jede Antwort und jedes Szenario hat ein Wappen", () => {
    for (const st of STATIONS) for (const a of st.answers) expect(a.symbol, `${st.id}: ${a.label}`).toBeTruthy();
    for (const st of STATIONS)
      for (const a of st.answers) {
        const s = a.symbol!;
        if (!s.startsWith("partei:")) expect(WAPPEN_IDS, s).toContain(s);
      }
    for (const s of STARTSZENARIEN) expect(WAPPEN_IDS).toContain(`start_${s.id}`);
    const html = renderToStaticMarkup(
      <>
        {WAPPEN_IDS.map((id) => (
          <Wappen key={id} id={id} />
        ))}
        <Wappen id="partei:AKP" />
        <Wappen id="partei:ISL" />
      </>,
    );
    expect(html).not.toMatch(/NaN|undefined/);
    expect((html.match(/<svg/g) ?? []).length).toBe(WAPPEN_IDS.length + 2);
  });

  test("Parteien der Szene und Voreinstellungen haben Farben", () => {
    for (const k of Object.keys(PARTEI_ACHSEN)) expect(parteiFarbe(k)).toMatch(/^#[0-9a-f]{6}$/i);
    for (const v of VOREINSTELLUNGEN) expect(parteiFarbe(v.kurz)).toBe(v.farbe);
  });

  test("das Parteiwappen zeigt die Linie als Fünfeck, je weiter rechts auf einer Achse, desto weiter außen die Ecke", () => {
    const eng = renderToStaticMarkup(<Parteiwappen kurz="TST" farbe="#336699" achsen={{ wirtschaft: -100, gesellschaft: -100, national: -100, religion: -100, zentral: -100 }} />);
    const weit = renderToStaticMarkup(<Parteiwappen kurz="TST" farbe="#336699" achsen={{ wirtschaft: 100, gesellschaft: 100, national: 100, religion: 100, zentral: 100 }} />);
    expect(eng).not.toMatch(/NaN|undefined/);
    expect(weit).not.toMatch(/NaN|undefined/);
    expect(eng).toContain("TST");
    expect(eng).not.toBe(weit);
    const punkte = (h: string) => [...h.matchAll(/class="pw-punkt" cx="([\d.]+)" cy="([\d.]+)"/g)].map((m) => [Number(m[1]), Number(m[2])] as const);
    expect(punkte(eng).length).toBe(5);
    const abstand = (h: string) => punkte(h).map(([x, y]) => Math.hypot(x - 50, y - 56));
    for (let i = 0; i < 5; i++) expect(abstand(weit)[i]!).toBeGreaterThan(abstand(eng)[i]!);
  });

  test("jede Szene zeichnet sich ohne ungültige Zahlen, mit Ebenen für die Parallaxe", () => {
    const ids: SzenenId[] = ["aufbruch", "kindheit", "jugend", "beruf", "liebe", "politik", "partei", "wahlkampf", "wahlnacht"];
    for (const id of ids) {
      const html = renderToStaticMarkup(<Szene szene={id} farbe="#336699" />);
      expect(html, id).toContain(`sz-${id}`);
      expect(html, id).not.toMatch(/NaN|undefined/);
      expect(html.match(/class="sz-e sz-e[123]"/g)?.length ?? 0, id).toBeGreaterThanOrEqual(2);
      expect(html.length, id).toBeGreaterThan(2500);
    }
    // die Fahne im Gründungssaal trägt die Farbe der Partei
    expect(renderToStaticMarkup(<Szene szene="partei" farbe="#336699" />)).toContain("#336699");
  });

  test("das Band zeigt acht benannte Stationen und hebt die aktuelle und die festgelegten hervor", () => {
    const ids = STATIONS.map((s) => s.id);
    const html = renderToStaticMarkup(<Fortschritt stationen={ids} schritt={3} festgelegt={ids.map((_, i) => i === 5)} />);
    expect((html.match(/class="b-item /g) ?? []).length).toBe(8);
    expect(html.match(/b-item fertig/g)?.length).toBe(3);
    expect(html.match(/b-item jetzt/g)?.length).toBe(1);
    expect(html.match(/b-item fest/g)?.length).toBe(1);
    expect(html.match(/b-item offen/g)?.length).toBe(3);
    expect(html).toContain('aria-current="step"');
    expect(html).toContain("Weg in die Politik");
  });

  test("die Karte zielt in die Mitte der freien Fläche links vom Buch", () => {
    expect(buchBreite(1512)).toBeCloseTo(0.41 * 1512, 5);
    expect(buchBreite(1000)).toBe(500);
    expect(buchBreite(3000)).toBe(880);
    expect(buchBreite(1512, true)).toBeGreaterThan(buchBreite(1512));
    expect(verdeckterRand(false, 1512)).toBeGreaterThan(buchBreite(1512));
    expect(verdeckterRand(false, 0)).toBe(0);
    // das breite Buch lässt dem Fenster immer 28 Bildpunkte Rand
    expect(buchBreite(800, true)).toBeLessThanOrEqual(772);
  });
});

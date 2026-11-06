import { haushaltsNachsorge, haushaltsMonatsabschluss } from "../src/sim/haushaltsbericht";
import { MINISTERIEN } from "../src/data/ministerien";
import { HaushaltsMonatsbericht } from "../src/ui/wirtschaft/HaushaltsBericht";
import { afterEach, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, load, save, tick } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { bipMrd, geldAusBip, geldbasis, initialisiereStaatsgeld, staatsgeldMonat } from "../src/sim/staatsgeld";
import { staatsfinanzen } from "../src/sim/staatsfinanzen";
import { defizitJetzt, haushaltZustand } from "../src/sim/wirtschaft";
import { POSTEN, POSTEN_NACH_ID, haushaltMonat, mrdJeStufe, setzePosten, setzeEntwurf, bringeHaushaltsgesetzEin, haushaltszyklusTag, stufeVon } from "../src/sim/haushalt";
import { haushaltsPostenEntscheidung, fuehreHaushaltsPostenAus, haushaltsEntscheidung } from "../src/sim/haushaltsentscheidung";
import { pruefeVorhaben, bringeEin, unterhaltKosten, stufeIn } from "../src/sim/handeln";
import { NET } from "../src/sim/modell";
import { nationalAverage, policyCost } from "../src/sim/netz";
import { Rng } from "../src/sim/rng";
import { addDays } from "../src/sim/dates";
import { Staatsfinanzen } from "../src/ui/wirtschaft/Staatsfinanzen";
import { Haushalt } from "../src/ui/wirtschaft/Haushalt";
import { HaushaltsEntwurf } from "../src/ui/wirtschaft/HaushaltsEntwurf";
import { kapitalErklaerung } from "../src/ui/akte/lage";
import { setzeSprache, t, zahl, katalogVon, platzhalter } from "../src/i18n";
import de from "../src/i18n/katalog/de/staatsfinanzen.json";

function welt() {
  const w = createWorld(turkey2026, 17);
  startAfterElection(w, { ...schnellProfil(), buendnis: "YENİ" });
  w.spiel!.kapital = 100;
  w.spiel!.ereignisse = [];
  w.date = "2028-11-02";
  haushaltZustand(w);
  return w;
}
afterEach(async () => { await setzeSprache("de"); });
function jahr(w: ReturnType<typeof welt>, growth: number, inflation: number) {
  w.economy.growth = growth; w.economy.inflation = inflation;
  w.date = "2028-01-01"; delete w.economy.geldbasis; initialisiereStaatsgeld(w);
  for (let i = 2; i <= 13; i++) {
    w.date = i === 13 ? "2029-01-01" : `2028-${String(i).padStart(2, "0")}-01`;
    staatsgeldMonat(w);
  }
}
function stimmt(w: ReturnType<typeof welt>) {
  const f = staatsfinanzen(w);
  expect(f.ausgabenMrd - f.einnahmenMrd).toBeCloseTo(f.kreditMrd, 7);
  expect(f.kreditMrd).toBeCloseTo(geldAusBip(w, defizitJetzt(w)), 8);
  return f;
}

test("Einnahmen, Ausgaben und Finanzierung stammen aus derselben Rechnung", () => {
  const w = welt(); const s = save(w), f = stimmt(w);
  expect(f.einnahmenMrd).toBeGreaterThan(0); expect(f.ausgabenMrd).toBeGreaterThan(f.einnahmenMrd);
  expect(save(w)).toBe(s);
});
// N3 (06.11.2026, Befund D-1): Steuern stellt nur noch die Maßnahme. Ihr Ertrag steht als Einnahme; damit die Rechnung aufgeht,
// trägt die Zeile „reformen“ den gebuchten Maßnahmensaldo plus diesen Ertrag (er steckt mit umgekehrtem Vorzeichen in policyCost).
test.each([0.8, -0.8])("Steuern, Ressorts, Programme, Reformsaldo %s und Zinsen gehen genau einmal ein", reforms => {
  const w = welt(); setzePosten(w, "gesundheit", 2, true);
  const i = NET.index.get("m_mwst")!;
  for (let p = 0; p < 81; p++) w.net.values[i * 81 + p] = w.net.values[i * 81 + p]! + 5; // Mehrwertsteuer ein Punkt höher
  w.economy.policyCost = reforms; w.economy.fiscalImpulse += 0.7;
  w.economy.zinsMehrlast = 0.4; w.economy.konjunkturSaldo = 0.2;
  const f = stimmt(w), row = (s: "einnahmen" | "ausgaben", id: string) => f[s].find(z => z.id === id)!.quote;
  expect(row("einnahmen", "steuern")).toBeCloseTo(0.225);
  expect(f.steuern.find(z => z.id === "mwst")!.satz).toBeCloseTo(21);
  expect(row("ausgaben", "ressorts")).toBeCloseTo(0.4);
  expect(row("ausgaben", "weitere")).toBeCloseTo(0.7);
  expect(row("ausgaben", "reformen")).toBeCloseTo(reforms + 0.225);
  expect(row("einnahmen", "konjunktur")).toBe(0.2);
});
test("Überschuss ist negative Finanzierung und kein zusätzlicher Punktestand", () => {
  const w = welt(), pk = w.spiel!.kapital;
  w.economy.fiscalImpulse = -12;
  expect(stimmt(w).kreditMrd).toBeLessThan(0);
  expect(w.spiel!.kapital).toBe(pk);
});
test.each(["roh", "alt"])("Öffnen einer Finanzrechnung verändert einen %s Haushalt nicht", art => {
  const w = welt();
  if (art === "roh") delete w.spiel!.wirtschaft;
  else { const z = haushaltZustand(w); delete z.fassung; z.stufen = { gesundheit_bildung: 2 }; }
  const s = save(w); const f = stimmt(w);
  if (art === "alt") expect(f.ausgaben.find(z => z.id === "ressorts")!.quote).toBeCloseTo(0.8);
  renderToStaticMarkup(<Staatsfinanzen world={w} details />);
  expect(save(w)).toBe(s);
});
test("reales Wachstum vergrößert Einnahmen und unveränderte Ressortetats ohne Punktbonus", () => {
  const w = welt(), alt = staatsfinanzen(w), stufe = mrdJeStufe(POSTEN_NACH_ID.bildung!, w), pk = w.spiel!.kapital;
  jahr(w, 12, 0); const neu = stimmt(w);
  expect(neu.einnahmenMrd / alt.einnahmenMrd).toBeCloseTo(1.12, 9);
  expect(neu.realeEinnahmenMrd / alt.realeEinnahmenMrd).toBeCloseTo(1.12, 9);
  expect(mrdJeStufe(POSTEN_NACH_ID.bildung!, w) / stufe).toBeCloseTo(1.12, 9);
  expect(w.spiel!.kapital).toBe(pk);
});
test("Inflation schafft keinen realen Spielraum", () => {
  const w = welt(), alt = staatsfinanzen(w);
  jahr(w, 0, 50); const f = stimmt(w);
  expect(f.einnahmenMrd / alt.einnahmenMrd).toBeCloseTo(1.5, 9);
  expect(f.ausgabenMrd / alt.ausgabenMrd).toBeCloseTo(1.5, 9);
  expect(f.realeEinnahmenMrd).toBeCloseTo(alt.realeEinnahmenMrd, 7);
  expect(f.realesWachstum).toBeCloseTo(0);
});
test("Rezession senkt den realen Etat; Preissteigerung wird getrennt gespeichert", () => {
  const w = welt(), basis = geldbasis(w).basisBipMrd;
  jahr(w, -8, 25);
  expect(bipMrd(w, true)).toBeCloseTo(basis * 0.92, 6);
  expect(bipMrd(w)).toBeCloseTo(basis * 0.92 * 1.25, 6);
});
test("Monatsfortschreibung belastet weder Schulden noch Punkte ein zweites Mal und ist idempotent", () => {
  const w = welt(), e = w.economy, pk = w.spiel!.kapital, debt = e.debtRatio, impulse = e.fiscalImpulse;
  staatsgeldMonat(w); const s = save(w);
  staatsgeldMonat(w); expect(save(w)).toBe(s);
  expect(e.debtRatio).toBe(debt); expect(e.fiscalImpulse).toBe(impulse); expect(w.spiel!.kapital).toBe(pk);
});
test("Speichern und Laden erhält die Preis- und Wachstumsbasis", () => {
  const w = welt(); jahr(w, 4, 20);
  const b = { ...geldbasis(w) }, k = load(save(w));
  expect(geldbasis(k)).toEqual(b); staatsgeldMonat(k); expect(geldbasis(k)).toEqual(b);
  k.date = "2029-02-01"; staatsgeldMonat(k);
  expect(geldbasis(k).real).toBeGreaterThan(b.real);
});
test.each(["fehlend", "defekt"])("Migration %s erfindet keine vergangenen Erträge und ändert keine Beschlüsse", art => {
  const w = welt(); setzePosten(w, "bildung", 2, true);
  if (art === "fehlend") delete w.economy.geldbasis; else w.economy.geldbasis!.real = -1;
  const k = load(save(w));
  expect(geldbasis(k)).toMatchObject({ real: 1, preise: 1, seit: w.date });
  expect(stufeVon(k, "bildung")).toBe(2); expect(k.economy.fiscalImpulse).toBe(w.economy.fiscalImpulse);
  expect(k.spiel!.kapital).toBe(w.spiel!.kapital);
});
test("echter Monatswechsel schreibt Volumen fort, die Tagesrechnung nicht", () => {
  const w = welt(); w.date = "2028-11-29"; delete w.economy.geldbasis; initialisiereStaatsgeld(w);
  tick(w); expect(geldbasis(w).real).toBe(1);
  tick(w); expect(w.date).toBe("2028-12-01");
  expect(geldbasis(w).real).toBeCloseTo(Math.pow(1 + w.economy.growth / 100, 1 / 12), 10);
  stimmt(w); const b = { ...geldbasis(w) }; tick(w); expect(geldbasis(w)).toEqual(b);
});

test("viele Vorhaben verlängern die Umsetzung, aber verteuern dieselbe Reform nicht", () => {
  const w = welt(), id = "m_justizreform", ziel = stufeIn(w, id, null) + 20;
  w.net.targets = {}; w.spiel!.gesetze = [];
  const a = pruefeVorhaben(w, id, ziel);
  for (const n of NET.nodes.filter(n => n.kind === "massnahme" && n.id !== id).slice(0, 15)) w.net.targets[n.id] = 100;
  const b = pruefeVorhaben(w, id, ziel);
  expect(b.ueberlast).toBeGreaterThan(a.ueberlast); expect(b.monate).toBeGreaterThan(a.monate);
  expect(b.gesetz.pk).toBe(a.gesetz.pk); expect(b.erlass.pk).toBe(a.erlass.pk);
  const pk = w.spiel!.kapital; expect(bringeEin(w, id, ziel, null, "gesetz").ok).toBe(true);
  expect(w.spiel!.kapital).toBe(pk - b.gesetz.pk);
});
test.each(["m_oepp_garantien"])("%s kostet Haushaltsgeld, aber keine monatliche politische Gebühr", id => {
  const w = welt(), i = NET.index.get(id)!;
  const kosten = policyCost(NET, w.net);
  for (let p = 0; p < 81; p++) w.net.values[i * 81 + p] = w.net.values[i * 81 + p]! + 10;
  expect(policyCost(NET, w.net)).toBeGreaterThan(kosten);
  expect(unterhaltKosten(w).posten.some(p => p.id === id)).toBe(false);
});
// N3 (ENTSCHEIDUNGEN W, Nachtrag F1): Maßnahmen mit gleichnamigem Etat sind das Gesetz und kosten kein eigenes Geld; das Geld steht im Posten.
test.each(["m_energiesubventionen", "m_verteidigung", "m_renten", "m_sozialhilfe", "m_forschung", "m_polizei", "m_agrarsubventionen"])("%s kostet kein eigenes Geld (F1) und keine monatliche politische Gebühr", id => {
  const w = welt(), i = NET.index.get(id)!;
  const kosten = policyCost(NET, w.net);
  for (let p = 0; p < 81; p++) w.net.values[i * 81 + p] = w.net.values[i * 81 + p]! + 10;
  expect(policyCost(NET, w.net)).toBeCloseTo(kosten, 12);
  expect(unterhaltKosten(w).posten.some(p => p.id === id)).toBe(false);
});
test("Ausnahmebefugnisse bleiben eine ausdrücklich politische Dauerbelastung", () => {
  const w = welt(); expect(unterhaltKosten(w).posten.some(p => p.id === "m_notstand")).toBe(true);
  expect(kapitalErklaerung(w)).toContain(t("sf.politikText"));
});
test("jeder Ausgabenposten gehört dem Ministerium, das ihn laut data/ministerien.ts führt (ENTSCHEIDUNGEN W 1)", () => {
  for (const p of POSTEN.filter(x => x.seite === "ausgabe")) {
    const m = MINISTERIEN.find(x => x.posten.includes(p.id));
    expect(m?.id, p.id).toBe(p.amt);
  }
});
test.each([["justiz", "justizvertrauen"], ["diplomatie", "ansehen"]])("%s hat echte Finanzierung und verzögerte Ressortwirkung", (id, node) => {
  const a = welt(), b = structuredClone(a), d = POSTEN_NACH_ID[id]!, before = defizitJetzt(a), value = nationalAverage(NET, a.net, node);
  expect(setzePosten(a, id, 1, true).ok).toBe(true);
  expect(defizitJetzt(a) - before).toBeCloseTo(d.schritt);
  expect(nationalAverage(NET, a.net, node)).toBeCloseTo(value);
  haushaltMonat(a); haushaltMonat(b);
  expect(nationalAverage(NET, a.net, node)).toBeGreaterThan(nationalAverage(NET, b.net, node));
  stimmt(a);
});
test("neue Etats gehen durch das echte Haushaltsgesetz und kosten bei der Einbringung keine PK", () => {
  const w = welt(); w.date = "2028-10-12";
  setzeEntwurf(w, "justiz", 2); setzeEntwurf(w, "diplomatie", 1);
  const p = haushaltsEntscheidung(w)!, pk = w.spiel!.kapital, f = staatsfinanzen(w);
  expect(p.nach - p.vor).toBeCloseTo(0.13);
  expect(bringeHaushaltsgesetzEin(w).ok).toBe(true); expect(w.spiel!.kapital).toBe(pk);
  const g = haushaltZustand(w).gesetz!; w.date = addDays(w.date, g.abstimmung - w.day); w.day = g.abstimmung;
  const rng = new Rng(5); rng.normal = () => 600; haushaltszyklusTag(w, rng);
  expect(stufeVon(w, "justiz")).toBe(2); expect(stufeVon(w, "diplomatie")).toBe(1);
  expect(stimmt(w).kreditMrd - f.kreditMrd).toBeCloseTo(p.finanzMrd, 7);
});
test("Geldbetrag der Entscheidung folgt der Wirtschaftsleistung; veraltete Beträge buchen nichts", () => {
  const w = welt(), p = haushaltsPostenEntscheidung(w, "bildung", 1)!;
  expect(p.finanzMrd).toBeCloseTo(geldAusBip(w, 0.2));
  w.economy.geldbasis!.real *= 1.1;
  const s = save(w); expect(fuehreHaushaltsPostenAus(w, p).ok).toBe(false); expect(save(w)).toBe(s);
  const neu = haushaltsPostenEntscheidung(w, "bildung", 1)!;
  expect(neu.pk).toBe(p.pk); expect(neu.finanzMrd / p.finanzMrd).toBeCloseTo(1.1);
  expect(fuehreHaushaltsPostenAus(w, neu).ok).toBe(true); stimmt(w);
});
test.each(["de", "en", "tr"] as const)("%s: Beträge, Einheiten, neue Ressorts und Ressourcentrennung sind vollständig übersetzt", async sprache => {
  await setzeSprache(sprache); const w = welt();
  for (const [key, value] of Object.entries(de)) {
    const actual = katalogVon(sprache)[key]; expect(actual, key).toBeTruthy();
    expect(platzhalter(actual!).sort(), key).toEqual(platzhalter(value).sort());
  }
  const s = save(w), html = renderToStaticMarkup(<Staatsfinanzen world={w} details />);
  for (const key of ["sf.titel", "sf.geldText", "sf.politikText", "sf.zeitText", "sf.rechnungHinweis"]) expect(html).toContain(t(key));
  expect(html).not.toMatch(/⟦|NaN|Infinity/); expect(save(w)).toBe(s);
  const page = renderToStaticMarkup(<Haushalt world={w} geaendert={() => {}} posten="justiz" />);
  expect(page).toContain(t("haushalt.posten.justiz.name")); expect(page).toContain(t("haushalt.posten.diplomatie.name"));
  w.date = "2028-10-12"; setzeEntwurf(w, "justiz", 1);
  const draft = renderToStaticMarkup(<HaushaltsEntwurf world={w} onErgebnis={() => {}} />);
  expect(draft).toContain(t("sf.finanzwirkung")); expect(draft).toContain(zahl(geldAusBip(w, 0.05), 1));
});

function beschluss() {
  const w = welt(); w.date = "2028-10-12"; setzeEntwurf(w, "bildung", 1); bringeHaushaltsgesetzEin(w);
  const g=haushaltZustand(w).gesetz!; w.date=addDays(w.date,g.abstimmung-w.day); w.day=g.abstimmung;
  const r=new Rng(4); r.normal=()=>600; haushaltszyklusTag(w,r);
  haushaltsMonatsabschluss(w); return w;
}
test("gespeicherter Monatsbericht behält damalige Geldbeträge bei späterem Wachstum und Inflation",()=>{
  const w=beschluss(),b=haushaltZustand(w).monatsberichte!.at(-1)!;
  const original=JSON.stringify(b), html=renderToStaticMarkup(<HaushaltsMonatsbericht bericht={b}/>);
  expect(b.stand.finanzen).toBeDefined();
  const f=b.abschluss; expect(f.nachher.finanzen!.kreditMrd-f.vorher.finanzen!.kreditMrd).toBeCloseTo(geldAusBip(w,0.2),7);
  // Welle H1: Plan und Wirtschaft wachsen gleich (das Haushaltsjahr verläuft nach Plan); sonst greifen die Steuerelastizitäten
  w.economy.geldbasis!.real*=1.2; w.economy.geldbasis!.preise*=1.5; w.economy.etat!.real*=1.2; w.economy.etat!.preise*=1.5;
  expect(haushaltsNachsorge(w)!.stand.finanzen!.einnahmenMrd).toBeCloseTo(b.stand.finanzen!.einnahmenMrd*1.8,7);
  expect(JSON.stringify(b)).toBe(original);expect(renderToStaticMarkup(<HaushaltsMonatsbericht bericht={b}/>)).toBe(html);
  expect(haushaltZustand(load(save(w))).monatsberichte!.at(-1)!.stand.finanzen).toEqual(b.stand.finanzen);
});
test("Altbericht bekommt keine rückwirkend erfundenen Geldbeträge",()=>{
  const w=beschluss(),b=haushaltZustand(w).monatsberichte!.at(-1)!;
  delete b.stand.finanzen;delete b.abschluss.vorher.finanzen;delete b.abschluss.nachher.finanzen;
  const before=JSON.stringify(b),html=renderToStaticMarkup(<HaushaltsMonatsbericht bericht={b}/>);
  expect(html).not.toContain(t("sf.berichtGeld"));expect(JSON.stringify(b)).toBe(before);
});

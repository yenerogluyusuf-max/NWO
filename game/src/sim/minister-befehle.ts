// Befehle an die Minister. Der Präsident ordnet an, der Minister führt aus: mit Kosten, Dauer und Erfolgschance, die von Fähigkeit und
// Loyalität abhängen, und mit dem Recht, sich zu weigern. Drei Befehle:
//   Ziel setzen         ein Auftrag mit Frist an das Ressort (der vorhandene Auftrag aus sim/gespraeche.ts, hier als Befehl angeboten)
//   Vorhaben vorbereiten  der Minister bereitet ein Gesetz vor und bringt es ein (Preis in Kapital wie beim Selbermachen,
//                         aber der Präsident spart den größten Teil der Aufmerksamkeit)
//   Verhandeln lassen   das Außenressort führt eine Handlung gegenüber einem Land (Gipfel, Entspannung, Handel, Hilfe)
// Ausgeführt wird immer über die Kernfunktionen (bringeEin, fuehreAktionAus, fuehreGespraech); hier liegen nur Auftrag, Zeitplan und Würfel.

import { t } from "../i18n";
import { addLog } from "./log";
import { kannZahlen } from "./kapital";
import { AUFMERKSAMKEIT_KOSTEN, neuanfangGrund, verbrauche, verfassungVon } from "./aufmerksamkeit";
import { bringeEin, pruefeVorhaben, stufeIn } from "./handeln";
import { AUFTRAG_TAGE, fuehreGespraech, planeGespraech, schritteFuer, themenFuer, MAX_TERMINE } from "./gespraeche";
import { AKTIONEN, LAENDER, aktionenFuer, dimensionZu, fuehreAktionAus, landAendern } from "./laender";
import { AEMTER, eigenVon, figurNachId, grollVerschieben, HOCH_SCHLECHT, leistung, loyalitaetVerschieben, merke, schlechtesteGroesse } from "./personen";
import { NET } from "./modell";
import { flussZustand, klemme, stabilerWert, wurf } from "./ministerfluss-kern";
import type { Befehl, BefehlEntwurf, BefehlTyp, Rueckmeldung } from "./ministerfluss-typen";
import type { Figur } from "./spiel-typen";
import type { World } from "./types";

export const BEFEHL_NAMEN: Record<BefehlTyp, { label: string; kurz: string }> = {
  ziel: { label: t("n1.mb.ziel.label"), kurz: t("n1.mb.ziel.kurz") },
  vorhaben: { label: t("n1.mb.vorhaben.label"), kurz: t("n1.mb.vorhaben.kurz") },
  verhandeln: { label: t("n1.mb.verhandeln.label"), kurz: t("n1.mb.verhandeln.kurz") },
};

/** So viele Befehle laufen höchstens zugleich: Die Minister haben nur begrenzt Kraft, und der Präsident muss den Überblick behalten. */
export const MAX_BEFEHLE = 4;
/** Aufmerksamkeit, die ein vorbereitetes Gesetz dem Präsidenten erspart (das Gesetz selbst kostet 10). */
const ERSPARNIS_VORHABEN = 7;
/** Aufmerksamkeit, die der Befehl selbst kostet. */
const ATT_VORHABEN = 3;

export interface BefehlAngebot {
  entwurf: BefehlEntwurf;
  titel: string;
  text: string;
}

export interface BefehlVorschau {
  moeglich: boolean;
  grund?: string;
  kosten: { pk: number; aufmerksamkeit: number };
  /** Monate bis zum Ergebnis */
  dauerMonate: number;
  /** Chance auf Erfolg, 0 bis 1; fehlt beim Ziel (dort entscheidet die Messung am Stichtag) */
  erfolgschance?: number;
  chanceWort?: string;
  /** Wie wahrscheinlich der Minister sich weigert, 0 bis 1 */
  verweigerung: number;
  folgen: string[];
  risiko: string[];
}

const chanceWort = (p: number): string => t(p >= 0.75 ? "n1.mb.chance.gut" : p >= 0.55 ? "n1.mb.chance.offen" : "n1.mb.chance.schwer");
/** „sie“ oder „er“ im Katalog (select g). */
const geschlecht = (f: Figur): "f" | "m" => (f.weiblich ? "f" : "m");

const imKabinett = (f: Figur | undefined): f is Figur => !!f && f.imAmt && AEMTER[f.amt].regierungsamt;

function themaFuerGroesse(w: World, figurId: string, groesse: string): string | undefined {
  const themen = themenFuer(w, figurId);
  return themen.find((x) => x.art === "lage" && x.bezug === groesse)?.id ?? themen.find((x) => x.art === "sorge")?.id;
}

/** Wahrscheinlichkeit, dass sich der Minister weigert: darüber (Loyalität ab 55) nie, darunter wächst sie bis 90 Prozent. */
export function verweigerungsChance(f: Figur): number {
  return f.loyalitaet >= 55 ? 0 : klemme((55 - f.loyalitaet) / 60, 0, 0.9);
}

const dauerVorhaben = (f: Figur, w: World): number => klemme(Math.ceil(5 - eigenVon(w, f).faehigkeit / 25), 1, 4);
const dauerVerhandeln = (f: Figur, w: World): number => (eigenVon(w, f).faehigkeit >= 70 ? 1 : 2);
const chanceVorhaben = (f: Figur, w: World): number => klemme(0.3 + 0.7 * leistung(w, f), 0.25, 0.95);
const chanceVerhandeln = (f: Figur, w: World): number => klemme(0.35 + 0.65 * leistung(w, f), 0.3, 0.95);

// ---------------------------------------------------------------------------
// Angebot: was man diesem Minister befehlen kann

export function befehlAngebote(w: World, figurId: string): BefehlAngebot[] {
  const f = figurNachId(w, figurId);
  if (!imKabinett(f)) return [];
  const out: BefehlAngebot[] = [];

  // Ziel setzen: die schwächsten Größen des Ressorts (wie im Gespräch „Auftrag mit Frist“)
  const themen = themenFuer(w, figurId).filter((x) => x.art === "lage" && x.bezug);
  for (const th of themen) {
    const name = NET.nodes[NET.index.get(th.bezug!) ?? -1]?.name ?? th.bezug!;
    out.push({ entwurf: { typ: "ziel", figurId, groesse: th.bezug! }, titel: t("n1.mb.titel.ziel", { groesse: name }), text: th.text });
  }

  // Vorhaben vorbereiten: die wirksamsten Schritte gegen die schwächsten Größen des Ressorts
  const gesehen = new Set<string>();
  const schwach = themen.slice(0, 2).map((x) => x.bezug!);
  const sg = schlechtesteGroesse(w, f);
  if (sg && !schwach.includes(sg.id)) schwach.unshift(sg.id);
  for (const g of schwach) {
    const richtung: 1 | -1 = HOCH_SCHLECHT.has(g) ? -1 : 1;
    for (const s of schritteFuer(w, f, g, richtung, 3)) {
      if (gesehen.has(s.id) || w.spiel?.gesetze.some((x) => x.massnahme === s.id)) continue;
      gesehen.add(s.id);
      out.push({ entwurf: { typ: "vorhaben", figurId, massnahme: s.id, ziel: s.nach }, titel: t("n1.mb.angebot.vorhaben", { name: s.name, von: s.von, nach: s.nach }), text: t("n1.mb.angebot.vorhaben.text", { wirkt: s.wirkt, pk: s.pk }) });
    }
  }

  // Verhandeln lassen: nur das Außenressort, die Länder mit dem größten Bedarf zuerst
  if (f.amt === "aussen") {
    const kandidaten: { l: (typeof LAENDER)[number]; id: BefehlEntwurf["aktion"]; bedarf: number }[] = [];
    for (const l of LAENDER) {
      const bedarf = (60 - dimensionZu(w, l.id, "vertrauen")) * l.anteil + Math.max(0, dimensionZu(w, l.id, "konflikt") - 55) * l.anteil * 0.6;
      for (const a of aktionenFuer(w, l.id)) {
        if (!a.moeglich || !["gipfel", "entspannen", "hilfe", "handel"].includes(a.aktion.id)) continue;
        if (a.aktion.id === "entspannen" && dimensionZu(w, l.id, "konflikt") < 40) continue;
        kandidaten.push({ l, id: a.aktion.id, bedarf: bedarf + (a.aktion.id === "entspannen" ? 6 : 0) });
      }
    }
    kandidaten.sort((a, b) => b.bedarf - a.bedarf);
    const je = new Map<string, number>();
    for (const k of kandidaten) {
      if ((je.get(k.l.id) ?? 0) >= 1 || out.filter((x) => x.entwurf.typ === "verhandeln").length >= 5) continue;
      je.set(k.l.id, 1);
      const def = AKTIONEN[k.id!];
      out.push({ entwurf: { typ: "verhandeln", figurId, land: k.l.id, aktion: k.id! }, titel: `${def.label}: ${k.l.name}`, text: def.hinweis });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Vorschau

export function befehlVorschau(w: World, e: BefehlEntwurf): BefehlVorschau {
  const leer: BefehlVorschau = { moeglich: false, kosten: { pk: 0, aufmerksamkeit: 0 }, dauerMonate: 0, verweigerung: 0, folgen: [], risiko: [] };
  const sp = w.spiel;
  const f = figurNachId(w, e.figurId);
  if (!sp || !imKabinett(f)) return { ...leer, grund: t("n1.mb.grund.keinMinister") };
  const z = flussZustand(w);
  const verweigerung = verweigerungsChance(f);
  const basis: BefehlVorschau = { ...leer, verweigerung };
  const pause = neuanfangGrund(w);
  if (pause) return { ...basis, grund: pause };
  const laufend = z.befehle.filter((b) => b.status === "laeuft");
  if (e.typ !== "ziel") {
    if (laufend.some((b) => b.figurId === f.id)) return { ...basis, grund: t("n1.mb.grund.beschaeftigt", { name: f.name }) };
    if (laufend.length >= MAX_BEFEHLE) return { ...basis, grund: t("n1.mb.grund.zuViele", { n: MAX_BEFEHLE }) };
  }
  const risiko = verweigerung > 0 ? [t("n1.mb.risiko.weigerung", { name: f.name, p: Math.round(verweigerung * 100), loy: Math.round(f.loyalitaet), g: geschlecht(f) })] : [];

  if (e.typ === "ziel") {
    if (!e.groesse) return { ...basis, grund: t("n1.mb.grund.keineGroesse") };
    const thema = themaFuerGroesse(w, f.id, e.groesse);
    if (!thema) return { ...basis, grund: t("n1.mb.grund.keinZiel") };
    const p = planeGespraech(w, f.id, thema, "auftrag");
    if (!("ansatz" in p)) return { ...basis, grund: p.grund };
    return {
      ...basis,
      moeglich: !p.grund,
      ...(p.grund ? { grund: p.grund } : {}),
      kosten: { pk: p.pk, aufmerksamkeit: AUFMERKSAMKEIT_KOSTEN.gespraech },
      dauerMonate: Math.round(AUFTRAG_TAGE / 30),
      folgen: p.folgen,
      risiko: [...risiko, t("n1.mb.risiko.gespraech", { n: MAX_TERMINE })],
    };
  }

  if (e.typ === "vorhaben") {
    if (!e.massnahme || e.ziel === undefined) return { ...basis, grund: t("n1.mb.grund.keinVorhaben") };
    const node = NET.nodes[NET.index.get(e.massnahme) ?? -1];
    if (!node) return { ...basis, grund: t("n1.mb.grund.keineMassnahme") };
    if (sp.gesetze.some((g) => g.massnahme === e.massnahme)) return { ...basis, grund: t("n1.mb.grund.schonGesetz") };
    const pr = pruefeVorhaben(w, e.massnahme, e.ziel, null);
    if (!pr.ok) return { ...basis, grund: pr.grund ?? t("n1.mb.grund.nichtMoeglich") };
    const dauer = dauerVorhaben(f, w);
    const p = chanceVorhaben(f, w);
    const luecke = pr.gesetz.stimmen.luecke;
    return {
      ...basis,
      moeglich: true,
      kosten: { pk: pr.gesetz.pk, aufmerksamkeit: ATT_VORHABEN },
      dauerMonate: dauer,
      erfolgschance: p,
      chanceWort: chanceWort(p),
      folgen: [
        t("n1.mb.folge.vorbereiten", { name: f.name, massnahme: node.name, von: Math.round(stufeIn(w, e.massnahme, null)), nach: e.ziel, monate: dauer }),
        t("n1.mb.folge.parlament", { pk: pr.gesetz.pk, fehlt: luecke > 0 ? "ja" : "nein", luecke }),
        t("n1.mb.folge.aufmerksamkeit", { att: ATT_VORHABEN, voll: 10 }),
      ],
      risiko: [...risiko, t("n1.mb.risiko.vorhaben", { p: Math.round((1 - p) * 100) })],
    };
  }

  // verhandeln
  if (!e.land || !e.aktion) return { ...basis, grund: t("n1.mb.grund.keinLand") };
  const sicht = aktionenFuer(w, e.land).find((a) => a.aktion.id === e.aktion);
  const land = LAENDER.find((l) => l.id === e.land);
  if (!sicht || !land) return { ...basis, grund: t("n1.mb.grund.keineHandlung") };
  if (!sicht.moeglich) return { ...basis, grund: sicht.grund ?? t("n1.mb.grund.gehtNicht") };
  const dauer = dauerVerhandeln(f, w);
  const p = chanceVerhandeln(f, w);
  const att = Math.ceil(AUFMERKSAMKEIT_KOSTEN.landAktion[e.aktion] / 2);
  return {
    ...basis,
    moeglich: true,
    kosten: { pk: sicht.aktion.pk, aufmerksamkeit: att },
    dauerMonate: dauer,
    erfolgschance: p,
    chanceWort: chanceWort(p),
    folgen: [t("n1.mb.folge.verhandeln", { name: f.name, aktion: sicht.aktion.label, land: land.dat, monate: dauer }), sicht.aktion.hinweis, t("n1.mb.folge.verhandeln.kapital", { pk: sicht.aktion.pk })],
    risiko: [...risiko, t("n1.mb.risiko.verhandeln", { p: Math.round((1 - p) * 100), land: land.dat })],
  };
}

// ---------------------------------------------------------------------------
// Erteilen

function rueckmeldung(w: World, f: Figur, r: Omit<Rueckmeldung, "id" | "tag" | "figurId" | "amt">, id: string): void {
  const z = flussZustand(w);
  z.rueckmeldungen.push({ id, tag: w.day, figurId: f.id, amt: f.amt, ...r });
  if (z.rueckmeldungen.length > 14) z.rueckmeldungen.splice(0, z.rueckmeldungen.length - 14);
}

const befehlText = (w: World, e: BefehlEntwurf): string => {
  if (e.typ === "vorhaben") return t("n1.mb.titel.vorhaben", { massnahme: NET.nodes[NET.index.get(e.massnahme ?? "") ?? -1]?.name ?? e.massnahme ?? "", ziel: e.ziel ?? "" });
  if (e.typ === "verhandeln") return t("n1.mb.titel.verhandeln", { aktion: AKTIONEN[e.aktion!].label, land: LAENDER.find((l) => l.id === e.land)?.dat ?? e.land ?? "" });
  return t("n1.mb.titel.ziel", { groesse: NET.nodes[NET.index.get(e.groesse ?? "") ?? -1]?.name ?? e.groesse ?? "" });
};

/** Der Präsident ordnet an. Gibt den Satz für die Oberfläche zurück; `ok` heißt, dass der Befehl erteilt wurde (auch wenn sich der Minister weigerte). */
export function erteileBefehl(w: World, e: BefehlEntwurf): { ok: boolean; text: string; why?: string } {
  const sp = w.spiel;
  const f = figurNachId(w, e.figurId);
  if (!sp || !imKabinett(f)) return { ok: false, text: t("n1.mb.grund.keinMinister") };
  const v = befehlVorschau(w, e);
  if (!v.moeglich) return { ok: false, text: v.grund ?? t("n1.mb.grund.gehtNicht") };
  if (!kannZahlen(sp.kapital, e.typ === "ziel" ? v.kosten.pk : 0)) return { ok: false, text: t("n1.mb.fehler.kapital", { pk: v.kosten.pk }) };
  const z = flussZustand(w);
  const titel = befehlText(w, e);
  const salz = `befehl|${f.id}|${e.typ}|${e.groesse ?? e.massnahme ?? e.land}|${e.aktion ?? ""}`;

  // Weigerung: Wer dem Präsidenten nicht folgt, führt nicht aus. Der Befehl kostet trotzdem einen Moment der Aufmerksamkeit.
  if (v.verweigerung > 0 && wurf(w, salz) < v.verweigerung) {
    verbrauche(w, 1, t("n1.mb.aufm.verweigert", { name: f.name }));
    const id = `b${w.day}-${z.befehle.length}`;
    const text = t("n1.mb.weigert.text", { name: f.name, titel, g: geschlecht(f) });
    z.befehle.push({ ...e, id, erteilt: w.day, faellig: w.day, status: "verweigert", ergebnis: "scheitern", text });
    const eig = eigenVon(w, f);
    let drohung = "";
    if (f.loyalitaet < 25 && eig.groll >= 50) {
      eig.drohung = w.day;
      drohung = ` ${t("n1.mb.weigert.drohung", { g: geschlecht(f) })}`;
    }
    grollVerschieben(w, f, 4);
    merke(w, f, t("n1.mb.merke.verweigert", { titel }));
    rueckmeldung(w, f, { titel: t("n1.mb.rm.verweigert.titel", { rolle: f.rolle, name: f.name }), text: [t("n1.mb.rm.verweigert.text", { titel, name: f.name, loy: Math.round(f.loyalitaet), drohung }), t("n1.mb.rm.verweigert.rat")], ergebnis: "verweigert", befehlId: id }, `rm:${id}`);
    addLog(w, "ereignis", text, t("n1.mb.weigert.why"));
    trimme(z.befehle, 20);
    return { ok: true, text, why: t("n1.mb.weigert.rat") };
  }

  if (e.typ === "ziel") {
    const thema = themaFuerGroesse(w, f.id, e.groesse!)!;
    const r = fuehreGespraech(w, f.id, thema, "auftrag");
    if (r.ok) merke(w, f, t("n1.mb.merke.befehl", { titel }));
    return { ok: r.ok, text: r.text, ...(r.folgen[0] ? { why: r.folgen.map((x) => x.text).join(" ") } : {}) };
  }

  verbrauche(w, v.kosten.aufmerksamkeit, t("n1.mb.aufm.befehl", { name: f.name }));
  const id = `b${w.day}-${z.befehle.length}`;
  z.befehle.push({ ...e, id, erteilt: w.day, faellig: w.day + v.dauerMonate * 30, status: "laeuft" });
  trimme(z.befehle, 20);
  merke(w, f, t("n1.mb.merke.befehl", { titel }));
  const text = t("n1.mb.uebernimmt", { rolle: f.rolle, name: f.name, titel });
  addLog(w, "entscheidung", text, t("n1.mb.uebernimmt.why", { n: v.dauerMonate, att: v.kosten.aufmerksamkeit }));
  return { ok: true, text, why: t("n1.mb.rueckmeldungIn", { n: v.dauerMonate }) };
}

function trimme(liste: Befehl[], max: number): void {
  // Abgeschlossene Befehle zuerst loswerden
  while (liste.length > max) {
    const i = liste.findIndex((b) => b.status !== "laeuft");
    liste.splice(i >= 0 ? i : 0, 1);
  }
}

// ---------------------------------------------------------------------------
// Monatlicher Lauf: fällige Befehle werden ausgeführt

export function befehleMonat(w: World): void {
  const sp = w.spiel;
  if (!sp) return;
  const z = flussZustand(w);
  for (const b of z.befehle) {
    if (b.status !== "laeuft" || b.faellig > w.day) continue;
    const f = figurNachId(w, b.figurId);
    b.status = "erledigt";
    const titel = befehlText(w, b);
    if (!f || !f.imAmt) {
      b.ergebnis = "scheitern";
      b.text = t("n1.mb.verfaellt");
      continue;
    }
    const q = leistung(w, f);
    const p = b.typ === "vorhaben" ? chanceVorhaben(f, w) : chanceVerhandeln(f, w);
    const glueckt = stabilerWert(w, `ergebnis|${b.id}`) < p;
    const rid = `rm:${b.id}`;

    if (b.typ === "vorhaben") {
      if (!glueckt) {
        b.ergebnis = "scheitern";
        b.text = t("n1.mb.vorhaben.gescheitert", { p: Math.round(q * 100) });
        rueckmeldung(w, f, { titel: t("n1.mb.rm.gescheitert.titel", { rolle: f.rolle, name: f.name }), text: [t("n1.mb.rm.gescheitert.text", { titel }), t("n1.mb.rm.gescheitert.rat")], ergebnis: "scheitern", befehlId: b.id }, rid);
        merke(w, f, t("n1.mb.merke.gescheitert", { titel }));
      } else {
        const r = bringeEin(w, b.massnahme!, b.ziel!, null, "gesetz");
        if (r.ok) {
          // Der Minister hat die Vorarbeit geleistet: ein Teil der Aufmerksamkeit kommt zurück
          const v = verfassungVon(w);
          v.aufmerksamkeit = klemme(v.aufmerksamkeit + ERSPARNIS_VORHABEN);
          loyalitaetVerschieben(f, 2);
          b.ergebnis = "erfolg";
          b.text = r.text;
          rueckmeldung(w, f, { titel: t("n1.mb.rm.eingebracht.titel", { rolle: f.rolle, name: f.name }), text: [t("n1.mb.zitat", { titel, text: r.text }), t("n1.mb.rm.eingebracht.ersparnis", { n: ERSPARNIS_VORHABEN })], ergebnis: "erfolg", befehlId: b.id }, rid);
          merke(w, f, t("n1.mb.merke.eingebracht", { titel }));
        } else {
          b.ergebnis = "teilerfolg";
          b.text = t("n1.mb.teilerfolg.text", { text: r.text });
          rueckmeldung(w, f, { titel: t("n1.mb.rm.liegtVor.titel", { rolle: f.rolle, name: f.name }), text: [t("n1.mb.rm.liegtVor.text", { titel, text: r.text }), t("n1.mb.rm.liegtVor.rat")], ergebnis: "teilerfolg", befehlId: b.id, nachholen: { massnahme: b.massnahme!, ziel: b.ziel!, ort: null } }, rid);
        }
      }
    } else if (b.typ === "verhandeln") {
      if (!glueckt) {
        b.ergebnis = "scheitern";
        b.text = t("n1.mb.verhandeln.gescheitert");
        landAendern(w, b.land!, { vertrauen: -2 }, t("n1.mb.verhandeln.notiz", { g: geschlecht(f) }));
        rueckmeldung(w, f, { titel: t("n1.mb.rm.verhandelnGescheitert.titel", { rolle: f.rolle, name: f.name }), text: [t("n1.mb.rm.verhandelnGescheitert.text", { titel, land: LAENDER.find((l) => l.id === b.land)?.dat ?? b.land ?? "" })], ergebnis: "scheitern", befehlId: b.id }, rid);
      } else {
        const r = fuehreAktionAus(w, b.land!, b.aktion!);
        if (r.ok) {
          // Halbe Aufmerksamkeit zurück: die Gespräche hat der Minister geführt
          const v = verfassungVon(w);
          v.aufmerksamkeit = klemme(v.aufmerksamkeit + Math.floor(AUFMERKSAMKEIT_KOSTEN.landAktion[b.aktion!] / 2));
          loyalitaetVerschieben(f, 2);
          b.ergebnis = "erfolg";
          b.text = r.text;
          rueckmeldung(w, f, { titel: t("n1.mb.rm.abgeschlossen.titel", { rolle: f.rolle, name: f.name, aktion: AKTIONEN[b.aktion!].label }), text: [r.text, ...(r.why ? [r.why] : [])], ergebnis: "erfolg", befehlId: b.id }, rid);
        } else {
          b.ergebnis = "teilerfolg";
          b.text = r.text;
          rueckmeldung(w, f, { titel: t("n1.mb.rm.nichtMoeglich.titel", { rolle: f.rolle, name: f.name }), text: [t("n1.mb.zitat", { titel, text: r.text })], ergebnis: "teilerfolg", befehlId: b.id }, rid);
        }
      }
    }
    addLog(w, "ereignis", t("n1.mb.log.rueckmeldung", { rolle: f.rolle, name: f.name, erg: b.ergebnis ?? "scheitern", titel }), b.text);
  }
}

/** Die laufenden Befehle, älteste zuerst. */
export function laufendeBefehle(w: World): Befehl[] {
  return flussZustand(w).befehle.filter((b) => b.status === "laeuft");
}

export { befehlText };

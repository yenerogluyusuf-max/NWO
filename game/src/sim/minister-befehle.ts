// Befehle an die Minister. Der Präsident ordnet an, der Minister führt aus: mit Kosten, Dauer und Erfolgschance, die von Fähigkeit und
// Loyalität abhängen, und mit dem Recht, sich zu weigern. Drei Befehle:
//   Ziel setzen         ein Auftrag mit Frist an das Ressort (der vorhandene Auftrag aus sim/gespraeche.ts, hier als Befehl angeboten)
//   Vorhaben vorbereiten  der Minister bereitet ein Gesetz vor und bringt es ein (Preis in Kapital wie beim Selbermachen,
//                         aber der Präsident spart den größten Teil der Aufmerksamkeit)
//   Verhandeln lassen   das Außenressort führt eine Handlung gegenüber einem Land (Gipfel, Entspannung, Handel, Hilfe)
// Ausgeführt wird immer über die Kernfunktionen (bringeEin, fuehreAktionAus, fuehreGespraech); hier liegen nur Auftrag, Zeitplan und Würfel.

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
  ziel: { label: "Ziel setzen", kurz: "Ein messbares Ziel für das Ressort, in sechs Monaten gemessen." },
  vorhaben: { label: "Vorhaben vorbereiten", kurz: "Der Minister bereitet das Gesetz vor und bringt es ein. Sie sparen Aufmerksamkeit." },
  verhandeln: { label: "Verhandeln lassen", kurz: "Das Außenressort führt die Gespräche mit dem Land." },
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

const chanceWort = (p: number): string => (p >= 0.75 ? "gute Aussicht" : p >= 0.55 ? "offene Aussicht" : "schwierig");

const imKabinett = (f: Figur | undefined): f is Figur => !!f && f.imAmt && AEMTER[f.amt].regierungsamt;

function themaFuerGroesse(w: World, figurId: string, groesse: string): string | undefined {
  const themen = themenFuer(w, figurId);
  return themen.find((t) => t.art === "lage" && t.bezug === groesse)?.id ?? themen.find((t) => t.art === "sorge")?.id;
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
  const themen = themenFuer(w, figurId).filter((t) => t.art === "lage" && t.bezug);
  for (const t of themen) {
    const name = NET.nodes[NET.index.get(t.bezug!) ?? -1]?.name ?? t.bezug!;
    out.push({ entwurf: { typ: "ziel", figurId, groesse: t.bezug! }, titel: `Ziel setzen: ${name}`, text: t.text });
  }

  // Vorhaben vorbereiten: die wirksamsten Schritte gegen die schwächsten Größen des Ressorts
  const gesehen = new Set<string>();
  const schwach = themen.slice(0, 2).map((t) => t.bezug!);
  const sg = schlechtesteGroesse(w, f);
  if (sg && !schwach.includes(sg.id)) schwach.unshift(sg.id);
  for (const g of schwach) {
    const richtung: 1 | -1 = HOCH_SCHLECHT.has(g) ? -1 : 1;
    for (const s of schritteFuer(w, f, g, richtung, 3)) {
      if (gesehen.has(s.id) || w.spiel?.gesetze.some((x) => x.massnahme === s.id)) continue;
      gesehen.add(s.id);
      out.push({ entwurf: { typ: "vorhaben", figurId, massnahme: s.id, ziel: s.nach }, titel: `Vorbereiten: ${s.name}, Stufe ${s.von} auf ${s.nach}`, text: `Wirkt auf ${s.wirkt}; das Gesetz kostet ${s.pk} Kapital.` });
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
  if (!sp || !imKabinett(f)) return { ...leer, grund: "Befehle nehmen nur die Minister der Regierung entgegen." };
  const z = flussZustand(w);
  const verweigerung = verweigerungsChance(f);
  const basis: BefehlVorschau = { ...leer, verweigerung };
  const pause = neuanfangGrund(w);
  if (pause) return { ...basis, grund: pause };
  const laufend = z.befehle.filter((b) => b.status === "laeuft");
  if (e.typ !== "ziel") {
    if (laufend.some((b) => b.figurId === f.id)) return { ...basis, grund: `${f.name} arbeitet noch an einem Befehl.` };
    if (laufend.length >= MAX_BEFEHLE) return { ...basis, grund: `Es laufen schon ${MAX_BEFEHLE} Befehle; mehr überblicken weder Sie noch die Minister.` };
  }
  const risiko = verweigerung > 0 ? [`${f.name} weigert sich mit etwa ${Math.round(verweigerung * 100)} Prozent Wahrscheinlichkeit: Die Loyalität ist ${Math.round(f.loyalitaet)} (Befehle folgt ${f.weiblich ? "sie" : "er"} ab 55 immer).`] : [];

  if (e.typ === "ziel") {
    if (!e.groesse) return { ...basis, grund: "Es fehlt die Größe, an der gemessen wird." };
    const thema = themaFuerGroesse(w, f.id, e.groesse);
    if (!thema) return { ...basis, grund: "Dazu gibt es gerade kein messbares Ziel." };
    const p = planeGespraech(w, f.id, thema, "auftrag");
    if (!("ansatz" in p)) return { ...basis, grund: p.grund };
    return {
      ...basis,
      moeglich: !p.grund,
      ...(p.grund ? { grund: p.grund } : {}),
      kosten: { pk: p.pk, aufmerksamkeit: AUFMERKSAMKEIT_KOSTEN.gespraech },
      dauerMonate: Math.round(AUFTRAG_TAGE / 30),
      folgen: p.folgen,
      risiko: [...risiko, `Der Befehl läuft über ein Gespräch: höchstens ${MAX_TERMINE} Termine in dreißig Tagen.`],
    };
  }

  if (e.typ === "vorhaben") {
    if (!e.massnahme || e.ziel === undefined) return { ...basis, grund: "Es fehlt das Vorhaben." };
    const node = NET.nodes[NET.index.get(e.massnahme) ?? -1];
    if (!node) return { ...basis, grund: "Diese Maßnahme gibt es nicht." };
    if (sp.gesetze.some((g) => g.massnahme === e.massnahme)) return { ...basis, grund: "Zu dieser Maßnahme liegt schon ein Gesetz im Parlament." };
    const pr = pruefeVorhaben(w, e.massnahme, e.ziel, null);
    if (!pr.ok) return { ...basis, grund: pr.grund ?? "Das ist gerade nicht möglich." };
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
        `${f.name} bereitet „${node.name}“ von Stufe ${Math.round(stufeIn(w, e.massnahme, null))} auf ${e.ziel} vor (etwa ${dauer} ${dauer === 1 ? "Monat" : "Monate"}).`,
        `Danach geht das Gesetz ins Parlament: ${pr.gesetz.pk} Kapital, ${luecke > 0 ? `im Parlament fehlen heute etwa ${luecke} Stimmen` : "die Mehrheit steht heute"}.`,
        `Sie zahlen jetzt ${ATT_VORHABEN} statt 10 Aufmerksamkeit; das Kapital wird erst bei der Einbringung fällig.`,
      ],
      risiko: [...risiko, `Mit etwa ${Math.round((1 - p) * 100)} Prozent scheitert der Entwurf in der Ressortabstimmung; dann ist die Aufmerksamkeit weg.`],
    };
  }

  // verhandeln
  if (!e.land || !e.aktion) return { ...basis, grund: "Es fehlt das Land." };
  const sicht = aktionenFuer(w, e.land).find((a) => a.aktion.id === e.aktion);
  const land = LAENDER.find((l) => l.id === e.land);
  if (!sicht || !land) return { ...basis, grund: "Diese Handlung gibt es diesem Land gegenüber nicht." };
  if (!sicht.moeglich) return { ...basis, grund: sicht.grund ?? "Das geht gerade nicht." };
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
    folgen: [`${f.name} führt ${sicht.aktion.label} mit ${land.dat} (etwa ${dauer} ${dauer === 1 ? "Monat" : "Monate"}).`, sicht.aktion.hinweis, `Das Kapital (${sicht.aktion.pk}) wird erst bei Abschluss fällig; Sie zahlen nur die halbe Aufmerksamkeit.`],
    risiko: [...risiko, `Mit etwa ${Math.round((1 - p) * 100)} Prozent scheitern die Gespräche und das Verhältnis zu ${land.dat} leidet leicht.`],
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
  if (e.typ === "vorhaben") return `„${NET.nodes[NET.index.get(e.massnahme ?? "") ?? -1]?.name ?? e.massnahme}“ auf Stufe ${e.ziel} vorbereiten`;
  if (e.typ === "verhandeln") return `${AKTIONEN[e.aktion!].label} mit ${LAENDER.find((l) => l.id === e.land)?.dat ?? e.land}`;
  return `Ziel setzen: ${NET.nodes[NET.index.get(e.groesse ?? "") ?? -1]?.name ?? e.groesse}`;
};

/** Der Präsident ordnet an. Gibt den Satz für die Oberfläche zurück; `ok` heißt, dass der Befehl erteilt wurde (auch wenn sich der Minister weigerte). */
export function erteileBefehl(w: World, e: BefehlEntwurf): { ok: boolean; text: string; why?: string } {
  const sp = w.spiel;
  const f = figurNachId(w, e.figurId);
  if (!sp || !imKabinett(f)) return { ok: false, text: "Befehle nehmen nur die Minister der Regierung entgegen." };
  const v = befehlVorschau(w, e);
  if (!v.moeglich) return { ok: false, text: v.grund ?? "Das geht gerade nicht." };
  if (!kannZahlen(sp.kapital, e.typ === "ziel" ? v.kosten.pk : 0)) return { ok: false, text: `Dafür fehlen ${v.kosten.pk} Kapital.` };
  const z = flussZustand(w);
  const titel = befehlText(w, e);
  const salz = `befehl|${f.id}|${e.typ}|${e.groesse ?? e.massnahme ?? e.land}|${e.aktion ?? ""}`;

  // Weigerung: Wer dem Präsidenten nicht folgt, führt nicht aus. Der Befehl kostet trotzdem einen Moment der Aufmerksamkeit.
  if (v.verweigerung > 0 && wurf(w, salz) < v.verweigerung) {
    verbrauche(w, 1, `Befehl verweigert: ${f.name}`);
    const id = `b${w.day}-${z.befehle.length}`;
    const text = `${f.name} weigert sich: „${titel}“ führt ${f.weiblich ? "sie" : "er"} nicht aus.`;
    z.befehle.push({ ...e, id, erteilt: w.day, faellig: w.day, status: "verweigert", ergebnis: "scheitern", text });
    const eig = eigenVon(w, f);
    let drohung = "";
    if (f.loyalitaet < 25 && eig.groll >= 50) {
      eig.drohung = w.day;
      drohung = ` ${f.weiblich ? "Sie" : "Er"} spricht offen von Rücktritt.`;
    }
    grollVerschieben(w, f, 4);
    merke(w, f, `Befehl verweigert: ${titel}`);
    rueckmeldung(w, f, { titel: `${f.rolle} ${f.name} verweigert den Befehl`, text: [`„${titel}“: ${f.name} folgt dem Präsidenten nicht mehr in allem (Loyalität ${Math.round(f.loyalitaet)}).${drohung}`, "Ein Gespräch, Anerkennung oder Rückendeckung bringen die Loyalität zurück."], ergebnis: "verweigert", befehlId: id }, `rm:${id}`);
    addLog(w, "ereignis", text, "Unter Loyalität 55 wächst die Gefahr, dass ein Minister Befehle verweigert.");
    trimme(z.befehle, 20);
    return { ok: true, text, why: "Ein Gespräch zur Aussprache würde helfen." };
  }

  if (e.typ === "ziel") {
    const thema = themaFuerGroesse(w, f.id, e.groesse!)!;
    const r = fuehreGespraech(w, f.id, thema, "auftrag");
    if (r.ok) merke(w, f, `Befehl: ${titel}`);
    return { ok: r.ok, text: r.text, ...(r.folgen[0] ? { why: r.folgen.map((x) => x.text).join(" ") } : {}) };
  }

  verbrauche(w, v.kosten.aufmerksamkeit, `Befehl an ${f.name}`);
  const id = `b${w.day}-${z.befehle.length}`;
  z.befehle.push({ ...e, id, erteilt: w.day, faellig: w.day + v.dauerMonate * 30, status: "laeuft" });
  trimme(z.befehle, 20);
  merke(w, f, `Befehl: ${titel}`);
  const text = `${f.rolle} ${f.name} übernimmt: ${titel}.`;
  addLog(w, "entscheidung", text, `Ergebnis in etwa ${v.dauerMonate} ${v.dauerMonate === 1 ? "Monat" : "Monaten"}; die Aufmerksamkeit (${v.kosten.aufmerksamkeit}) ist ausgegeben, das Kapital wird erst bei Abschluss fällig.`);
  return { ok: true, text, why: `Rückmeldung in etwa ${v.dauerMonate} ${v.dauerMonate === 1 ? "Monat" : "Monaten"}.` };
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
      b.text = "Der Minister ist nicht mehr im Amt; der Befehl verfällt.";
      continue;
    }
    const q = leistung(w, f);
    const p = b.typ === "vorhaben" ? chanceVorhaben(f, w) : chanceVerhandeln(f, w);
    const glueckt = stabilerWert(w, `ergebnis|${b.id}`) < p;
    const rid = `rm:${b.id}`;

    if (b.typ === "vorhaben") {
      if (!glueckt) {
        b.ergebnis = "scheitern";
        b.text = `Der Entwurf scheiterte in der Ressortabstimmung (Leistung des Ressorts ${Math.round(q * 100)} Prozent).`;
        rueckmeldung(w, f, { titel: `${f.rolle} ${f.name}: Entwurf gescheitert`, text: [`„${titel}“ kam nicht durch die Ressortabstimmung.`, `Mit mehr Rückhalt und Mitteln für das Ressort steigt die Chance beim nächsten Mal.`], ergebnis: "scheitern", befehlId: b.id }, rid);
        merke(w, f, `Entwurf gescheitert: ${titel}`);
      } else {
        const r = bringeEin(w, b.massnahme!, b.ziel!, null, "gesetz");
        if (r.ok) {
          // Der Minister hat die Vorarbeit geleistet: ein Teil der Aufmerksamkeit kommt zurück
          const v = verfassungVon(w);
          v.aufmerksamkeit = klemme(v.aufmerksamkeit + ERSPARNIS_VORHABEN);
          loyalitaetVerschieben(f, 2);
          b.ergebnis = "erfolg";
          b.text = r.text;
          rueckmeldung(w, f, { titel: `${f.rolle} ${f.name}: Gesetz eingebracht`, text: [`„${titel}“: ${r.text}`, `Sie sparen ${ERSPARNIS_VORHABEN} Aufmerksamkeit gegenüber dem Selbermachen.`], ergebnis: "erfolg", befehlId: b.id }, rid);
          merke(w, f, `Gesetz eingebracht: ${titel}`);
        } else {
          b.ergebnis = "teilerfolg";
          b.text = `Der Entwurf liegt vor, aber: ${r.text}`;
          rueckmeldung(w, f, { titel: `${f.rolle} ${f.name}: Entwurf liegt vor`, text: [`„${titel}“ ist fertig, doch die Einbringung geht gerade nicht: ${r.text}`, "Sie können das Gesetz nachholen, sobald es geht."], ergebnis: "teilerfolg", befehlId: b.id, nachholen: { massnahme: b.massnahme!, ziel: b.ziel!, ort: null } }, rid);
        }
      }
    } else if (b.typ === "verhandeln") {
      if (!glueckt) {
        b.ergebnis = "scheitern";
        b.text = "Die Gespräche scheiterten.";
        landAendern(w, b.land!, { vertrauen: -2 }, "Verhandlungen des Außenministers scheitern");
        rueckmeldung(w, f, { titel: `${f.rolle} ${f.name}: Verhandlungen gescheitert`, text: [`„${titel}“ kam nicht zustande; das Verhältnis zu ${LAENDER.find((l) => l.id === b.land)?.dat ?? b.land} hat leicht gelitten.`], ergebnis: "scheitern", befehlId: b.id }, rid);
      } else {
        const r = fuehreAktionAus(w, b.land!, b.aktion!);
        if (r.ok) {
          // Halbe Aufmerksamkeit zurück: die Gespräche hat der Minister geführt
          const v = verfassungVon(w);
          v.aufmerksamkeit = klemme(v.aufmerksamkeit + Math.floor(AUFMERKSAMKEIT_KOSTEN.landAktion[b.aktion!] / 2));
          loyalitaetVerschieben(f, 2);
          b.ergebnis = "erfolg";
          b.text = r.text;
          rueckmeldung(w, f, { titel: `${f.rolle} ${f.name}: ${AKTIONEN[b.aktion!].label} abgeschlossen`, text: [r.text, ...(r.why ? [r.why] : [])], ergebnis: "erfolg", befehlId: b.id }, rid);
        } else {
          b.ergebnis = "teilerfolg";
          b.text = r.text;
          rueckmeldung(w, f, { titel: `${f.rolle} ${f.name}: Abschluss nicht möglich`, text: [`„${titel}“: ${r.text}`], ergebnis: "teilerfolg", befehlId: b.id }, rid);
        }
      }
    }
    addLog(w, "ereignis", `Rückmeldung von ${f.rolle} ${f.name}: ${b.ergebnis === "erfolg" ? "erledigt" : b.ergebnis === "teilerfolg" ? "teilweise erledigt" : "gescheitert"} — ${titel}.`, b.text);
  }
}

/** Die laufenden Befehle, älteste zuerst. */
export function laufendeBefehle(w: World): Befehl[] {
  return flussZustand(w).befehle.filter((b) => b.status === "laeuft");
}

export { befehlText };

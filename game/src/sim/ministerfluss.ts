// Der Ministerfluss: Die Minister bringen dem Präsidenten Vorlagen — eine Frage mit zwei bis vier Optionen, den Folgen jeder Option in
// Zahlen, wer dafür und dagegen ist und einer Empfehlung des Ministers —, und der Präsident entscheidet. So kommen auf einen Tisch,
// was bisher verstreut lag: die Ereignisse mit Antwortoptionen, die Beschlussvorlagen des Ministerrats, die Schritte, die ein Ressort
// gegen seine schwächste Größe vorschlägt, die Vorhaben gegen akute Probleme („Heute“), fällige Zusagen und das, was Minister nach
// einem Befehl zurückmelden.
//
// Vorlagen sind abgeleitet: Sie werden aus dem Weltzustand gerechnet, nicht gespeichert. Gespeichert wird nur, was nicht abgeleitet
// werden kann (sim/ministerfluss-typen.ts): was entschieden, vertagt oder abgelehnt wurde, welche Befehle laufen, was zurückgemeldet wurde.
// Entschieden wird immer über die Kernfunktionen (entscheide, halteKabinettssitzungAb, bringeEin, Zusagen, Gespräche, Befehle);
// hier liegen nur Auswahl, Rangfolge, Empfehlung und Buchführung.
//
// Die Qualität der Vorlagen hängt am Minister: Wer fähig ist, bringt mehr Schritte und trifft die bessere Wahl; Stil und Ehrgeiz färben die
// Empfehlung (der Eitle empfiehlt, was sein Haus stärkt, der Vorsichtige den billigen Weg); wer dem Präsidenten nicht mehr folgt, hält sich
// zurück oder legt nichts mehr vor — das sieht man ihm an. Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachen.

import { NET } from "./modell";
import { PROVINZEN } from "./regional";
import { Rng } from "./rng";
import { tunWort } from "../data/skalen";
import { kannZahlen, nurAufPump } from "./kapital";
import { AUFMERKSAMKEIT_KOSTEN } from "./aufmerksamkeit";
import { antworten, vorlage as ereignisVorlage, wirkungsVorschau, entscheide } from "./ereignisse";
import { EREIGNIS_BEZUG, ANSATZ_NAMEN, fuehreGespraech, planeGespraech, schritteFuer, type AnsatzId, type Schritt } from "./gespraeche";
import { bereiteKabinettssitzungVor, halteKabinettssitzungAb, kabinettStatus } from "./kabinett";
import { bringeEin, pruefeVorhaben, stufeIn } from "./handeln";
import { akuteProbleme, vorschlaege, type Vorschlag } from "./vorschlaege";
import { betroffene } from "./wege";
import { brecheFrei, loeseEin, vertroesteFrei, zusageVorhaben, zusagenSicht } from "./zusagen";
import { AEMTER, eigenVon, figurNachId, grollVerschieben, HOCH_SCHLECHT, loyalitaetVerschieben, merke, nf, schlechtesteGroesse, sorgeText } from "./personen";
import { addLog } from "./log";
import { fuehreAus as fuehreInfraAus, infrastrukturBitte } from "./infrastruktur";
import { befehleMonat, erteileBefehl } from "./minister-befehle";
import { nutzenVorschau, zielGroessenVon } from "./ministerfluss-vorschau";
import { KABINETT_AMT, amtBesetzt, flussZustand, kappeRecord, ministerFuer, ministerInfo, ressortFuerMassnahme, stabilerWert } from "./ministerfluss-kern";
import type { Amt, OptionAktion, Vorlage, VorlageOption, VorlagenQuelle } from "./ministerfluss-typen";
import type { Figur } from "./spiel-typen";
import type { World } from "./types";

export { flussZustand } from "./ministerfluss-kern";
export { ministerflussMonat } from "./ministerfluss-monat";
export type { Vorlage, VorlageOption } from "./ministerfluss-typen";

// ---------------------------------------------------------------------------
// Bausteine

const tageWort = (t: number): string => (t <= 0 ? "heute" : t === 1 ? "morgen" : `in ${t} Tagen`);
const bip = (x: number): string => `${x.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} % BIP im Jahr`;
const kurzName = (f: Figur | undefined): string => (f ? `${f.rolle} ${f.name}` : "");

const SPAETER: VorlageOption = { id: "spaeter", label: "Später", text: "In 30 Tagen wieder vorlegen.", kosten: { pk: 0, aufmerksamkeit: 0 }, folgen: [], dafuer: [], dagegen: [], verlierer: [], aktion: { art: "spaeter", tage: 30 }, moeglich: true };
const NICHTS: VorlageOption = { id: "nichts", label: "Nicht tun", text: "Der Vorschlag wird verworfen und kommt vorerst nicht wieder.", kosten: { pk: 0, aufmerksamkeit: 0 }, folgen: [], dafuer: [], dagegen: [], verlierer: [], aktion: { art: "nichts" }, moeglich: true };
const KENNTNIS: VorlageOption = { id: "kenntnis", label: "Zur Kenntnis", text: "Abgelegt; es bleibt in der Chronik.", kosten: { pk: 0, aufmerksamkeit: 0 }, folgen: [], dafuer: [], dagegen: [], verlierer: [], aktion: { art: "kenntnis" }, moeglich: true };

const istMeta = (o: VorlageOption): boolean => o.id === "spaeter" || o.id === "nichts" || o.id === "kenntnis";

interface Rang {
  wert: number;
  grund: string;
}

/** Rangfolge aus Frist, Tragweite und Aktualität; jeder Anteil ist im Satz nachlesbar. */
function rang(frist: number | undefined, tragweite: number, alter: number, malus = 1): Rang {
  const dring = frist === undefined ? 0.2 : frist <= 3 ? 1 : frist <= 7 ? 0.85 : frist <= 14 ? 0.6 : frist <= 30 ? 0.4 : 0.25;
  const akt = 1 - Math.min(1, Math.max(0, alter) / 90) * 0.6;
  const wert = Math.round(100 * (0.5 * dring + 0.35 * tragweite + 0.15 * akt) * malus);
  const teile = [
    frist === undefined ? "ohne feste Frist" : `Frist ${tageWort(frist)}`,
    tragweite >= 0.7 ? "große Tragweite" : tragweite >= 0.45 ? "mittlere Tragweite" : "geringe Tragweite",
    alter <= 7 ? "neu auf dem Tisch" : alter > 60 ? "liegt schon länger" : "",
  ].filter(Boolean);
  return { wert, grund: teile.join(" · ") };
}

// ---------------------------------------------------------------------------
// Optionen

/** Eine Option „Maßnahme einstellen“ mit den Zahlen aus der Prüfung. Gibt es keine Prüfung (Maßnahme steht schon dort), fehlt die Option. */
function optionMassnahme(w: World, f: Figur | undefined, id: string, ziel: number, ort: number[] | null, opt: { label?: string; jetztName?: string; zielName?: string; wirkt?: string; eigen?: boolean } = {}): VorlageOption | null {
  const node = NET.nodes[NET.index.get(id) ?? -1];
  if (!node) return null;
  const pr = pruefeVorhaben(w, id, ziel, ort);
  const jetzt = Math.round(stufeIn(w, id, ort));
  if (!pr.ok && Math.abs(ziel - jetzt) < 1) return null;
  const richtung: 1 | -1 = ziel >= jetzt ? 1 : -1;
  const b = betroffene(id, richtung);
  const luecke = pr.gesetz.stimmen.luecke;
  const finanzen = amtBesetzt(w, "finanzen");
  const dafuer = [...(f ? [kurzName(f)] : []), ...b.gewinner.slice(0, 3)];
  const dagegen = [...(finanzen && f?.amt !== "finanzen" && pr.kostenBip >= 0.25 ? [`${kurzName(finanzen)} (Haushalt)`] : []), ...b.verlierer.slice(0, 3)];
  const stufe = opt.jetztName && opt.zielName ? `von „${opt.jetztName}“ zu „${opt.zielName}“` : `${tunWort(id, richtung)} von Stufe ${jetzt} auf ${ziel}`;
  return {
    id: `m:${id}:${ziel}`,
    label: opt.label ?? `${node.name}: ${stufe}`,
    ...(opt.wirkt ? { text: `Wirkt auf ${opt.wirkt}.` } : {}),
    kosten: { pk: pr.gesetz.pk, aufmerksamkeit: AUFMERKSAMKEIT_KOSTEN.gesetz },
    folgen: [
      `${node.name} ${stufe}${ort ? ` (nur in ${ort.length} ${ort.length === 1 ? "Provinz" : "Provinzen"})` : ""}.`,
      `${pr.gesetz.pk} Kapital${Math.abs(pr.kostenBip) >= 0.01 ? `, ${pr.kostenBip < 0 ? "bringt" : "kostet"} ${bip(Math.abs(pr.kostenBip))}` : ""}; ${luecke > 0 ? `im Parlament fehlen etwa ${luecke} Stimmen` : "die Mehrheit steht"}.`,
      `Etwa ${pr.monate} ${pr.monate === 1 ? "Monat" : "Monate"} bis zur vollen Wirkung.`,
      ...(nurAufPump(w.spiel?.kapital ?? 0, pr.gesetz.pk) ? [`Achtung: Nur auf Pump bezahlbar (Kapital ${Math.floor(w.spiel?.kapital ?? 0)}): Wer im Minus steht, zahlt monatlich mit Legitimität und Vertrauen.`] : []),
    ],
    dafuer,
    dagegen,
    verlierer: b.verlierer.slice(0, 3),
    aktion: { art: "massnahme", id, ziel, ort },
    moeglich: pr.ok && pr.gesetz.bezahlbar && luecke < 120,
    ...(!pr.ok ? { grund: pr.grund ?? "Das geht gerade nicht." } : !pr.gesetz.bezahlbar ? { grund: `Dafür fehlt Kapital (nötig ${pr.gesetz.pk}).` } : luecke >= 120 ? { grund: "Ohne Mehrheit aussichtslos: erst im Parlament verhandeln." } : {}),
    ...(opt.eigen ? { eigenesRessort: true } : {}),
  };
}

function optionGespraech(w: World, f: Figur, ansatz: AnsatzId, themaId = "person"): VorlageOption {
  const p = planeGespraech(w, f.id, themaId, ansatz);
  const plan = "ansatz" in p ? p : undefined;
  const grund = plan ? plan.grund : (p as { grund: string }).grund;
  return {
    id: `g:${ansatz}`,
    label: ANSATZ_NAMEN[ansatz].label,
    text: ANSATZ_NAMEN[ansatz].kurz,
    kosten: { pk: plan?.pk ?? 0, aufmerksamkeit: AUFMERKSAMKEIT_KOSTEN.gespraech },
    folgen: plan?.folgen ?? [],
    dafuer: [],
    dagegen: [],
    verlierer: [],
    aktion: { art: "gespraech", figurId: f.id, themaId, ansatz },
    moeglich: !grund,
    ...(grund ? { grund } : {}),
  };
}

// ---------------------------------------------------------------------------
// Quellen der Vorlagen

interface Roh extends Vorlage {
  /** Wie die Empfehlung gebildet wird: nach Verdienst, oder parteilich für die Seite, auf der der Minister steht */
  empfehlungsArt?: "verdienst" | "parteilich";
}

function basis(w: World, a: { id: string; thema?: string; art: Vorlage["art"]; quelle: VorlagenQuelle; amt: Amt; titel: string; anlass: string[]; optionen: VorlageOption[]; frist?: number; tag: number; tragweite: number; malus?: number; ziel?: Vorlage["ziel"]; minister?: Figur; empfehlungsArt?: Roh["empfehlungsArt"] }): Roh {
  const f = a.minister ?? ministerFuer(w, a.amt);
  const r = rang(a.frist, a.tragweite, w.day - a.tag, a.malus ?? 1);
  return {
    id: a.id,
    thema: a.thema ?? a.id,
    art: a.art,
    quelle: a.quelle,
    amt: a.amt,
    ...(f ? { minister: ministerInfo(w, f) } : {}),
    titel: a.titel,
    anlass: a.anlass,
    optionen: a.optionen,
    ...(a.frist !== undefined ? { frist: a.frist } : {}),
    tag: a.tag,
    prioritaet: r.wert,
    prioritaetGrund: r.grund,
    ...(a.ziel ? { ziel: a.ziel } : {}),
    ...(a.empfehlungsArt ? { empfehlungsArt: a.empfehlungsArt } : {}),
  };
}

function ereignisQuelle(w: World): Roh[] {
  const sp = w.spiel!;
  const out: Roh[] = [];
  for (const ev of sp.ereignisse) {
    const v = ereignisVorlage(ev.vorlage);
    const bezug = EREIGNIS_BEZUG[ev.vorlage];
    const amt = bezug?.amt.find((a) => amtBesetzt(w, a)) ?? "stab";
    const optionen: VorlageOption[] = antworten(w, ev).map((o) => {
      const pk = o.anzeigePk ?? o.pk;
      const ok = kannZahlen(sp.kapital, pk);
      return { id: o.id, label: o.label, text: o.beschreibung, kosten: { pk, aufmerksamkeit: 0 }, folgen: [], dafuer: [], dagegen: [], verlierer: [], aktion: { art: "ereignis", ereignisId: ev.id, optionId: o.id }, moeglich: ok, ...(ok ? {} : { grund: `Dafür fehlt Kapital (nötig ${pk}, vorhanden ${Math.floor(sp.kapital)}).` }) };
    });
    out.push(
      basis(w, { id: `ereignis:${ev.id}`, art: "frage", quelle: "ereignis", amt, titel: v.titel(w, ev), anlass: v.text(w, ev), optionen, frist: Math.max(0, ev.frist - w.day), tag: ev.tag, tragweite: 0.55 + 0.4 * ev.staerke, ziel: { art: "ereignis", id: ev.id } }),
    );
  }
  return out;
}

const AMT_VON_RESSORT = (ressort: string): Amt => {
  const erst = (ressort.split(/\s*(?:&|\bund\b)\s*/i)[0] ?? "").trim().toLowerCase();
  for (const amt of KABINETT_AMT) if (AEMTER[amt].ressort.toLowerCase() === erst) return amt;
  return "stab";
};

function kabinettQuelle(w: World): Roh[] {
  const sp = w.spiel!;
  if (!sp.figuren.some((f) => f.imAmt && AEMTER[f.amt].regierungsamt)) return [];
  const status = kabinettStatus(w);
  const themen = bereiteKabinettssitzungVor(w);
  const bucket = Math.floor(w.day / 45);
  return themen.map((t) => {
    const amt = AMT_VON_RESSORT(t.ressort);
    const warte = status.sitzungMoeglich ? undefined : `Die nächste Kabinettssitzung ist in ${status.tageBisSitzung} Tagen.`;
    const optionen: VorlageOption[] = t.optionen.map((o) => {
      const pk = o.kostenPk ?? 0;
      const ok = !warte && kannZahlen(sp.kapital, pk);
      return {
        id: o.id,
        label: o.titel,
        text: o.text,
        kosten: { pk, aufmerksamkeit: 0 },
        folgen: o.effekteText,
        dafuer: o.befuerworter,
        dagegen: o.gegner,
        verlierer: [],
        aktion: { art: "kabinett", themaId: t.id, optionId: o.id } as OptionAktion,
        moeglich: ok,
        ...(ok ? {} : { grund: warte ?? `Dafür fehlt Kapital (nötig ${pk}).` }),
      };
    });
    return {
      ...basis(w, { id: `kabinett:${t.id}:${bucket}`, thema: `kabinett:${t.id}`, art: "frage", quelle: "kabinett", amt, titel: t.titel, anlass: [t.anlass], optionen: [...optionen, SPAETER], tag: w.day, tragweite: t.dringlichkeit === "hoch" ? 0.8 : 0.3, malus: warte ? 0.35 : 1, ziel: { art: "akte", akte: "personen" }, empfehlungsArt: "parteilich" }),
      ...(warte ? { wartet: warte } : {}),
    };
  });
}

function zusagenQuelle(w: World): Roh[] {
  const sp = w.spiel!;
  const out: Roh[] = [];
  const stab = ministerFuer(w, "stab");
  for (const s of zusagenSicht(w)) {
    if (s.dringlichkeit !== "dringend" && s.dringlichkeit !== "ueberfaellig") continue;
    const z = s.z;
    const v = zusageVorhaben(w, z);
    const opt: VorlageOption[] = [];
    const einlosPk = v ? 0 : 4;
    opt.push({
      id: "einloesen",
      label: "Einlösen",
      text: v ? `Bringt „${v.name}“ von Stufe ${Math.round(v.jetzt)} auf ${v.ziel} ein; das Gesetz trägt die Kosten.` : "Die Zusage wird erfüllt.",
      kosten: { pk: einlosPk, aufmerksamkeit: v ? AUFMERKSAMKEIT_KOSTEN.gesetz : 0 },
      folgen: [...(v?.pr.ok ? [`${v.pr.gesetz.pk} Kapital im Gesetz, ${v.pr.gesetz.stimmen.luecke > 0 ? `im Parlament fehlen etwa ${v.pr.gesetz.stimmen.luecke} Stimmen` : "die Mehrheit steht"}.`] : []), "Wer Zusagen hält, wird beim nächsten Mal ernster genommen."],
      dafuer: [z.von],
      dagegen: [],
      verlierer: [],
      aktion: { art: "zusage", zusageId: z.id, weg: "einloesen" },
      moeglich: kannZahlen(sp.kapital, einlosPk),
      ...(kannZahlen(sp.kapital, einlosPk) ? {} : { grund: `Dafür fehlen ${einlosPk} Kapital.` }),
    });
    if ((z.vertroestet ?? 0) < 2) opt.push({ id: "vertroesten", label: "Vertrösten", text: "Drei Monate mehr; die Geduld sinkt.", kosten: { pk: 1, aufmerksamkeit: 0 }, folgen: ["Loyalität der Gegenseite −8, Vertrauen −0,5.", "Nach zwei Vertröstungen bleibt nur Halten oder Brechen."], dafuer: [], dagegen: [z.von], verlierer: [], aktion: { art: "zusage", zusageId: z.id, weg: "vertroesten" }, moeglich: kannZahlen(sp.kapital, 1), ...(kannZahlen(sp.kapital, 1) ? {} : { grund: "Für eine Vertröstung fehlt Kapital." }) });
    opt.push({ id: "brechen", label: "Brechen", text: "Verbündete, Vertrauen und Glaubwürdigkeit leiden.", kosten: { pk: 0, aufmerksamkeit: 0 }, folgen: ["Bereitschaft der Gegenseite −25, Loyalität −25, Vertrauen −1."], dafuer: [], dagegen: [z.von], verlierer: [], aktion: { art: "zusage", zusageId: z.id, weg: "brechen" }, moeglich: true });
    out.push(
      basis(w, {
        id: `zusage:${z.id}`,
        art: "frage",
        quelle: "zusage",
        amt: "stab",
        titel: `Zusage an ${z.von}: ${z.text}`,
        anlass: [`Fällig ${s.tage < 0 ? `seit ${Math.abs(s.tage)} Tagen` : tageWort(Math.max(0, s.tage))}.`],
        optionen: opt,
        frist: Math.max(0, s.tage),
        tag: w.day - 20,
        tragweite: 0.6,
        ziel: { art: "akte", akte: "personen" },
        ...(stab ? { minister: stab } : {}),
      }),
    );
  }
  return out;
}

function personenQuelle(w: World, z = flussZustand(w)): Roh[] {
  const sp = w.spiel!;
  const out: Roh[] = [];
  const bucket = Math.floor(w.day / 45);
  for (const f of sp.figuren) {
    if (!f.imAmt || !AEMTER[f.amt].regierungsamt) continue;
    const e = eigenVon(w, f);
    if (f.loyalitaet < 35) {
      out.push({
        ...basis(w, {
          id: `person:${f.id}:${bucket}`,
          thema: `person:${f.id}`,
          art: "schweigen",
          quelle: "person",
          amt: f.amt,
          titel: `${kurzName(f)} legt nichts mehr vor`,
          anlass: [`Bei Loyalität ${Math.round(f.loyalitaet)} (${e.groll >= 40 ? "verärgert" : "distanziert"}) hält ${f.name} Zahlen und Vorschläge zurück. Was im ${AEMTER[f.amt].ressort}ressort geschieht, erfahren Sie nur noch aus der Zeitung.`, sorgeText(w, f)],
          optionen: [optionGespraech(w, f, "vertrauen"), optionGespraech(w, f, "rueckendeckung"), optionGespraech(w, f, "belohnung"), NICHTS],
          tag: w.day,
          tragweite: f.loyalitaet < 25 ? 0.85 : 0.55,
          ziel: { art: "akte", akte: "personen" },
          minister: f,
        }),
      });
    } else if (e.groll >= 55) {
      out.push({
        ...basis(w, {
          id: `person:${f.id}:${bucket}`,
          thema: `person:${f.id}`,
          art: "frage",
          quelle: "person",
          amt: f.amt,
          titel: `Groll im ${AEMTER[f.amt].ressort}ressort`,
          anlass: [`${f.name} ist ${e.groll >= 70 ? "gekränkt" : "verärgert"} (Groll ${Math.round(e.groll)}) und lässt es das Ressort spüren. ${sorgeText(w, f)}`],
          optionen: [optionGespraech(w, f, "vertrauen"), optionGespraech(w, f, "rueckendeckung"), optionGespraech(w, f, "belohnung"), SPAETER],
          tag: w.day,
          tragweite: 0.5,
          ziel: { art: "akte", akte: "personen" },
          minister: f,
        }),
      });
    }
    // Ein abgeschlossener Auftrag: Erfolg oder Misserfolg wird gemeldet, bis der Präsident ihn zur Kenntnis nimmt
    const a = e.auftrag;
    if (a && a.status !== "laeuft" && w.day - a.frist <= 120) {
      const id = `auftrag:${f.id}:${a.id}`;
      if (!z.gelesen.includes(id)) {
        const ok = a.status === "erfuellt";
        out.push(
          basis(w, {
            id,
            art: "rueckmeldung",
            quelle: "auftrag",
            amt: f.amt,
            titel: `${kurzName(f)}: Ziel ${ok ? "erreicht" : "verfehlt"}`,
            anlass: [`${a.text}${a.nachher !== undefined ? ` — von ${nf(a.vorher, 0)} auf ${nf(a.nachher, 0)}` : ""}.`, ok ? "Wer liefert, wird loyaler. Anerkennung bindet, bringt aber Neid bei den anderen." : "Ein verfehltes Ziel kostet Loyalität und macht Groll. Eine Aussprache hilft, bevor sich der Ärger festsetzt."],
            optionen: [KENNTNIS, optionGespraech(w, f, ok ? "belohnung" : "vertrauen")],
            tag: a.frist,
            tragweite: 0.45,
            ziel: { art: "akte", akte: "personen" },
            minister: f,
          }),
        );
      }
    }
  }
  return out;
}

function rueckmeldungenQuelle(w: World, z = flussZustand(w)): Roh[] {
  const out: Roh[] = [];
  for (const r of z.rueckmeldungen) {
    if (z.gelesen.includes(r.id)) continue;
    const f = figurNachId(w, r.figurId);
    const optionen: VorlageOption[] = [KENNTNIS];
    if (r.nachholen) {
      const o = optionMassnahme(w, f, r.nachholen.massnahme, r.nachholen.ziel, r.nachholen.ort, { label: "Gesetz jetzt einbringen", eigen: true });
      if (o) optionen.unshift(o);
    }
    out.push(basis(w, { id: r.id, art: "rueckmeldung", quelle: "befehl", amt: r.amt, titel: r.titel, anlass: r.text, optionen, tag: r.tag, tragweite: r.ergebnis === "verweigert" ? 0.65 : 0.4, ziel: { art: "akte", akte: "personen" }, ...(f ? { minister: f } : {}) }));
  }
  return out;
}

function problemQuelle(w: World, n: number): Roh[] {
  const probleme = akuteProbleme(w);
  const bucket = Math.floor(w.day / 45);
  const out: Roh[] = [];
  for (const v of vorschlaege(w, n)) {
    const amt = ressortFuerMassnahme(v.massnahme);
    const f = ministerFuer(w, amt);
    const p = probleme.find((x) => x.id === v.problemId);
    const opt = optionMassnahme(w, f, v.massnahme, v.ziel, v.ort, { ...(v.jetztName ? { jetztName: v.jetztName } : {}), ...(v.zielName ? { zielName: v.zielName } : {}), wirkt: v.problemName, eigen: AEMTER[amt].massnahmen.includes(v.massnahme) });
    if (!opt) continue;
    const ortNamen = p ? [...p.provinzen].sort((a, b) => (PROVINZEN[b - 1]?.bevoelkerung ?? 0) - (PROVINZEN[a - 1]?.bevoelkerung ?? 0)).slice(0, 5).map((x) => PROVINZEN[x - 1]?.name ?? String(x)) : [];
    const last = p?.last ?? 0.2;
    out.push({
      ...basis(w, {
        id: `problem:${v.massnahme}:${bucket}`,
        thema: `problem:${v.massnahme}`,
        art: "vorschlag",
        quelle: "problem",
        amt,
        titel: `${v.problemName}: ${v.name}`,
        anlass: [v.grund],
        optionen: [opt, SPAETER, NICHTS],
        tag: w.day,
        tragweite: 0.3 + 0.6 * Math.min(1, last * 1.4),
        ziel: { art: "politik", massnahme: { id: v.massnahme, level: v.ziel, ort: v.ort } },
        ...(f ? { minister: f } : {}),
      }),
      problem: { id: v.problemId, name: v.problemName, provinzen: v.provinzen, ortNamen, anteil: Math.round(last * 100) / 100 },
      ...(v.ort ? { ort: v.ort } : {}),
      vorschlag: v,
    });
  }
  return out;
}

/** Bitte bei Überlast eines Netzes (sim/infrastruktur.ts): höchstens eine je Monat, ausbauen, Alternative oder nichts tun. */
function infrastrukturQuelle(w: World): Roh[] {
  const b = infrastrukturBitte(w);
  return b ? [basis(w, { ...b, art: "frage", quelle: "lage" })] : [];
}

function lageQuelle(w: World): Roh[] {
  const sp = w.spiel!;
  const out: Roh[] = [];
  const bucket = Math.floor(w.day / 60);
  for (const f of sp.figuren) {
    if (!f.imAmt || !AEMTER[f.amt].regierungsamt || f.loyalitaet < 35) continue;
    const e = eigenVon(w, f);
    const sg = schlechtesteGroesse(w, f);
    if (!sg || sg.ton !== "schlecht") continue;
    const richtung: 1 | -1 = HOCH_SCHLECHT.has(sg.id) ? -1 : 1;
    // Fähige Minister bringen mehr Schritte mit
    const schritte = schritteFuer(w, f, sg.id, richtung, e.faehigkeit >= 70 ? 3 : 2).filter((s) => !sp.gesetze.some((g) => g.massnahme === s.id));
    const optionen: VorlageOption[] = [];
    schritte.forEach((s: Schritt) => {
      const o = optionMassnahme(w, f, s.id, s.nach, null, { wirkt: s.wirkt, eigen: s.eigenesRessort });
      if (o) optionen.push(o);
    });
    if (!optionen.length) continue;
    const schlecht = sg.schlechtWennHoch ? sg.wert : 100 - sg.wert;
    out.push({
      ...basis(w, {
        id: `lage:${f.amt}:${sg.id}:${bucket}`,
        thema: `lage:${f.amt}:${sg.id}`,
        art: "frage",
        quelle: "lage",
        amt: f.amt,
        titel: `${AEMTER[f.amt].ressort}: ${sg.name} steht schlecht`,
        anlass: [`${sg.name} liegt bei ${Math.round(sg.wert)} von 100${sg.schlechtWennHoch ? " (hoch ist schlecht)" : ""}. ${f.name} legt ${optionen.length === 1 ? "einen Schritt" : `${optionen.length} Schritte`} vor.`, sorgeText(w, f)],
        optionen: [...optionen, { id: `ziel:${sg.id}`, label: `Ziel setzen: ${sg.name} verbessern`, text: `${f.name} bekommt ${Math.round(180 / 30)} Monate Zeit, die Größe um mindestens 3 Punkte zu bewegen.`, kosten: { pk: 2, aufmerksamkeit: AUFMERKSAMKEIT_KOSTEN.gespraech }, folgen: [], dafuer: [kurzName(f)], dagegen: [], verlierer: [], aktion: { art: "befehl", entwurf: { typ: "ziel", figurId: f.id, groesse: sg.id } }, moeglich: true }, SPAETER, NICHTS],
        tag: w.day,
        tragweite: 0.3 + 0.4 * (schlecht / 100),
        ziel: { art: "politik", massnahme: { id: schritte[0]!.id, level: schritte[0]!.nach } },
        minister: f,
      }),
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Empfehlung

const STIL_GRUND: Record<string, string> = {
  nuechtern: "nach den Zahlen die beste Wahl",
  vorsichtig: "der sichere Weg mit dem geringsten Preis",
  streng: "die klare Linie, die Ordnung schafft",
  machtbewusst: "die kräftigste Antwort",
  eitel: "die Lösung, die zeigt, was das Haus kann",
  loyal: "der Weg, den Sie am leichtesten vertreten können",
};

const SCHLECHT_WENN_MEHR = /(groll|defizit|schulden|inflation|risiko|arbeitslos|kriminal|spannung|unruhe|verlust|belast|aufschlag|schwächer)/i;

/** Wie gut die Folgenzeilen aussehen, −1 bis 1 (grobe Lesart der Vorschauzeilen: Vorzeichen und Größe). */
function zeilenGuete(zeilen: string[]): number {
  let gut = 0;
  let schlecht = 0;
  for (const t of zeilen) {
    const minus = /(^|[\s(:])[-−–]\s?\d/.test(t) || /\b(sinkt|sinken|fällt|schwächer)\b/i.test(t);
    const plus = /(^|[\s(:])\+\s?\d/.test(t) || /\b(steigt|steigen|wächst|stärker)\b/i.test(t);
    if (minus === plus) continue;
    const besser = plus ? !SCHLECHT_WENN_MEHR.test(t) : SCHLECHT_WENN_MEHR.test(t);
    if (besser) gut++;
    else schlecht++;
  }
  return gut + schlecht === 0 ? 0 : (gut - schlecht) / (gut + schlecht);
}

function empfiehl(w: World, v: Roh): void {
  const m = v.minister ? figurNachId(w, v.minister.id) : undefined;
  if (!m || v.art === "rueckmeldung" || v.art === "schweigen") return;
  const e = eigenVon(w, m);
  // Bei einem einzelnen Vorschlag lautet die Frage „jetzt oder später?“: Dann steht auch das Warten zur Wahl
  const kandidaten = v.optionen.filter((o) => (!istMeta(o) || (v.art === "vorschlag" && o.id === "spaeter")) && o.moeglich !== false);
  if (!kandidaten.some((o) => !istMeta(o))) return;
  if (m.loyalitaet < 40) {
    // Ohne Rückhalt keine Empfehlung: Der Minister hält sich zurück (leere Kennung = nur ein Hinweis)
    v.empfehlung = { optionId: "", grund: "", von: m.name, hinweis: `${m.name} hält sich zurück (Loyalität ${Math.round(m.loyalitaet)}): Eine Empfehlung gibt es erst ab 40.` };
    return;
  }
  const maxPk = Math.max(1, ...v.optionen.filter((o) => !istMeta(o)).map((o) => o.kosten.pk));
  const rauschen = (1 - e.faehigkeit / 100) * 0.9;
  const seite = (o: VorlageOption): boolean => o.dafuer.some((n) => n === m.name || n === kurzName(m) || (m.amt === "stab" && /Stab/.test(n)));
  let beste: { o: VorlageOption; score: number } | undefined;
  kandidaten.forEach((o, i) => {
    let score: number;
    const rausch = (stabilerWert(w, `empfehlung|${v.id}|${m.id}|${i}`) - 0.5) * 2 * rauschen;
    if (o.id === "spaeter") {
      // Warten empfiehlt, wer vorsichtig ist, wenn das Vorhaben teuer ist oder die Mehrheit fehlt; der Machtbewusste nie
      const haupt = v.optionen.find((x) => !istMeta(x));
      const teuer = haupt ? Math.min(1, haupt.kosten.pk / 12) : 0;
      const ohneMehrheit = haupt?.folgen.some((t) => /fehlen etwa/.test(t)) ? 0.15 : 0;
      score = 0.35 + (e.stil === "vorsichtig" ? 0.4 * (0.4 + 0.6 * teuer) : 0) + ohneMehrheit + (e.stil === "machtbewusst" ? -0.25 : 0) + rausch;
    } else {
      let verdienst = 0.5;
      if (v.empfehlungsArt === "parteilich") verdienst = 0.5;
      else if (v.quelle === "lage") verdienst = 1 - (v.optionen.indexOf(o) / Math.max(1, kandidaten.length)) * 0.6;
      else if (o.nutzen?.length) verdienst = 0.5 + 0.5 * (o.nutzen.reduce((sum, n) => sum + (n.besser === true ? 1 : n.besser === false ? -1 : 0), 0) / o.nutzen.length);
      else if (o.folgen.length) verdienst = 0.5 + 0.5 * zeilenGuete(o.folgen);
      const gewagt = o.kosten.pk / maxPk;
      const eigen = o.eigenesRessort ? 1 : 0;
      let bias = 0;
      switch (e.stil) {
        case "vorsichtig":
          bias = -0.25 * gewagt;
          break;
        case "machtbewusst":
          bias = 0.25 * gewagt;
          break;
        case "eitel":
          bias = 0.3 * eigen;
          break;
        case "streng":
          bias = 0.12 * gewagt;
          break;
        case "loyal":
          bias = 0.1 * (1 - gewagt);
          break;
      }
      const ehrgeiz = eigen * (e.ehrgeiz / 100) * 0.3;
      const parteilich = v.empfehlungsArt === "parteilich" && seite(o) ? 0.9 : 0;
      score = verdienst + bias + ehrgeiz + parteilich + rausch;
    }
    if (!beste || score > beste.score) beste = { o, score };
  });
  if (!beste) return;
  const o = beste.o;
  if (o.id === "spaeter") {
    v.empfehlung = { optionId: "spaeter", grund: `${kurzName(m)} rät, noch zu warten: ${e.stil === "vorsichtig" ? "Das Vorhaben ist teuer, und er will erst sehen, wie sich die Lage entwickelt" : "Die Voraussetzungen sind noch nicht gut genug"}.`.replace("er will", m.weiblich ? "sie will" : "er will"), von: m.name };
    return;
  }
  const eigenInteresse = !!o.eigenesRessort && (e.stil === "eitel" || e.ehrgeiz >= 65);
  const nutzen = o.nutzen?.find((n) => n.besser !== null);
  const hinweise: string[] = [];
  if (eigenInteresse) hinweise.push("Auffällig: Die Empfehlung stärkt vor allem das eigene Ressort.");
  if (e.faehigkeit < 50) hinweise.push(`${m.name} gilt als fachlich schwach: Rechnen Sie nach.`);
  if (m.loyalitaet < 55) hinweise.push(`${m.name} ist distanziert (Loyalität ${Math.round(m.loyalitaet)}); die Empfehlung kann Eigeninteresse sein.`);
  const dez = (n: NonNullable<typeof nutzen>) => nf(n.ohne, n.einheit === "Provinzen" ? 0 : 1);
  v.empfehlung = {
    optionId: o.id,
    grund: `${kurzName(m)} empfiehlt „${o.label}“: ${STIL_GRUND[e.stil] ?? "nach den Zahlen"}.${o.kosten.pk > 0 ? ` Es kostet ${o.kosten.pk} Kapital.` : ""}${nutzen ? ` ${nutzen.name}: ${dez(nutzen)} ohne, ${nf(nutzen.mit, nutzen.einheit === "Provinzen" ? 0 : 1)} mit Eingriff nach ${nutzen.monate} Monaten.` : ""}`,
    von: m.name,
    ...(hinweise.length ? { hinweis: hinweise.join(" ") } : {}),
  };
}

// ---------------------------------------------------------------------------
// Anreichern (aufwendige Vorschauen nur für die obersten Vorlagen)

function reichere(w: World, v: Roh): void {
  if (v.quelle === "ereignis") {
    const ev = w.spiel!.ereignisse.find((e) => `ereignis:${e.id}` === v.id);
    if (!ev) return;
    for (const o of v.optionen) if (o.aktion.art === "ereignis") o.folgen = wirkungsVorschau(w, ev, o.aktion.optionId);
    return;
  }
  for (const o of v.optionen) {
    if (o.aktion.art !== "massnahme") continue;
    const ids = [...(v.problem ? [v.problem.id] : []), ...zielGroessenVon(o.aktion.id, 3)];
    // Der Horizont folgt der Maßnahme: Was lange umgesetzt wird, zeigt erst später Wirkung (mindestens ein Jahr, höchstens drei)
    const bau = NET.nodes[NET.index.get(o.aktion.id) ?? -1]?.months ?? 6;
    const monate = Math.min(36, Math.max(12, Math.ceil(bau * 1.6)));
    o.nutzen = nutzenVorschau(w, [{ id: o.aktion.id, ziel: o.aktion.ziel, ort: o.aktion.ort }], ids, monate);
  }
}

// ---------------------------------------------------------------------------
// Zusammenstellen

export interface VorlagenOptionen {
  /** Für so viele der obersten Vorlagen die aufwendigen Vorschauen rechnen (Standard 4) */
  tiefe?: number;
  /** Auch erledigte, vertagte und abgelehnte Vorlagen liefern (für die Buchführung) */
  ungefiltert?: boolean;
  /** Höchstens so viele Vorlagen aus akuten Problemen (Standard 8) */
  probleme?: number;
}

function sammle(w: World, opt: VorlagenOptionen): Roh[] {
  if (!w.spiel || w.spiel.ende) return [];
  const z = flussZustand(w);
  const alle: Roh[] = [...ereignisQuelle(w), ...kabinettQuelle(w), ...zusagenQuelle(w), ...personenQuelle(w, z), ...rueckmeldungenQuelle(w, z), ...problemQuelle(w, opt.probleme ?? 8), ...lageQuelle(w), ...infrastrukturQuelle(w)];
  if (opt.ungefiltert) return alle;
  return alle.filter((v) => {
    if (z.erledigt[v.id]) return false;
    const bis = z.vertagt[v.thema];
    if (bis !== undefined && bis > w.day) return false;
    const abgelehnt = z.abgelehnt[v.thema];
    if (abgelehnt !== undefined && w.day - abgelehnt < 120) return false;
    return true;
  });
}

let cacheSchluessel = "";
let cacheWelt: World | null = null;
let cacheErgebnis: Vorlage[] = [];

/** Ein Schlüssel, der sich ändert, wenn sich die Vorlagen ändern können (für useMemo der Oberfläche). */
export function ministerflussSchluessel(w: World): string {
  const sp = w.spiel;
  if (!sp) return "-";
  const z = flussZustand(w);
  const loy = Math.round(sp.figuren.reduce((s, f) => s + (f.imAmt ? f.loyalitaet : 0), 0));
  return `${w.day}|${Math.floor(sp.kapital)}|${sp.gesetze.length}|${sp.ereignisse.map((e) => e.id).join(",")}|${sp.zusagen.filter((x) => !x.erfuellt && !x.gebrochen).length}|${loy}|${Object.keys(z.erledigt).length}|${Object.keys(z.vertagt).length}|${Object.keys(z.abgelehnt).length}|${z.befehle.length}|${z.rueckmeldungen.length}|${z.gelesen.length}|${Object.keys(w.net.targets).length}`;
}

/** Alle Vorlagen, die jetzt auf dem Tisch liegen, nach Rang. Die obersten bekommen die aufwendigen Vorschauen und die Empfehlung. */
export function ministerVorlagen(w: World, opt: VorlagenOptionen = {}): Vorlage[] {
  const tiefe = opt.tiefe ?? 4;
  const schluessel = `${ministerflussSchluessel(w)}|${tiefe}|${opt.probleme ?? 8}|${opt.ungefiltert ? "u" : "f"}`;
  if (cacheWelt === w && cacheSchluessel === schluessel) return cacheErgebnis;
  const alle = sammle(w, opt).sort((a, b) => b.prioritaet - a.prioritaet || a.id.localeCompare(b.id));
  // Jede Maßnahme liegt höchstens einmal vor: Die höher eingestufte Vorlage behält sie
  const belegt = new Set<string>();
  const rein: Roh[] = [];
  for (const v of alle) {
    if (!opt.ungefiltert) {
      v.optionen = v.optionen.filter((o) => {
        if (o.aktion.art !== "massnahme") return true;
        if (belegt.has(o.aktion.id)) return false;
        return true;
      });
      if (!v.optionen.some((o) => !istMeta(o))) continue;
      for (const o of v.optionen) if (o.aktion.art === "massnahme") belegt.add(o.aktion.id);
    }
    rein.push(v);
  }
  rein.forEach((v, i) => {
    if (i < tiefe) reichere(w, v);
    empfiehl(w, v);
  });
  const ergebnis: Vorlage[] = rein.map(({ empfehlungsArt: _e, ...v }) => v);
  cacheWelt = w;
  cacheSchluessel = schluessel;
  cacheErgebnis = ergebnis;
  return ergebnis;
}

/** Die Unterschriftenmappe des Schreibtischs: nur das Wichtigste und Aktuellste. */
export function schreibtischMappe(w: World, max = 5): { mappe: Vorlage[]; weitere: number; proAmt: Partial<Record<Amt, number>>; vertagt: number; verfallen: number } {
  const alle = ministerVorlagen(w, { tiefe: max });
  // Was nicht entschieden werden kann (etwa bis zur nächsten Kabinettssitzung) und sehr Niedriges bleibt im Posteingang
  const kandidaten = alle.filter((v) => !v.wartet && v.prioritaet >= 30);
  // Nicht dreimal dasselbe: höchstens zwei Vorlagen je Minister und eine je Problem, außer bei Fristsachen
  const mappe: Vorlage[] = [];
  const jeMinister = new Map<string, number>();
  const probleme = new Set<string>();
  for (const v of kandidaten) {
    if (mappe.length >= max) break;
    const fristsache = v.quelle === "ereignis" || v.quelle === "zusage" || v.art === "schweigen";
    const mid = v.minister?.id ?? v.amt;
    if (!fristsache && ((jeMinister.get(mid) ?? 0) >= 2 || (v.problem && probleme.has(v.problem.id)))) continue;
    mappe.push(v);
    jeMinister.set(mid, (jeMinister.get(mid) ?? 0) + 1);
    if (v.problem) probleme.add(v.problem.id);
  }
  const ids = new Set(mappe.map((v) => v.id));
  const proAmt: Partial<Record<Amt, number>> = {};
  for (const v of alle) if (!ids.has(v.id)) proAmt[v.amt] = (proAmt[v.amt] ?? 0) + 1;
  const z = flussZustand(w);
  return { mappe, weitere: alle.length - mappe.length, proAmt, vertagt: Object.values(z.vertagt).filter((t) => t > w.day).length, verfallen: z.verfallen.length };
}

/** „Heute“: die Vorhaben gegen akute Probleme und die Schritte der Ressorts, als Vorlagen mit Minister, Empfehlung und Folgen in Zahlen. */
export function heuteVorlagen(w: World, n = 6): Vorlage[] {
  return ministerVorlagen(w, { tiefe: n, probleme: n + 2 })
    .filter((v) => v.quelle === "problem" || v.quelle === "lage")
    .slice(0, n);
}

// ---------------------------------------------------------------------------
// Entscheiden

export interface VorlagenAntwort {
  ok: boolean;
  text: string;
  why?: string;
}

function ausfuehren(w: World, a: OptionAktion): VorlagenAntwort {
  const sp = w.spiel!;
  switch (a.art) {
    case "ereignis": {
      const r = entscheide(w, a.ereignisId, a.optionId, new Rng(w.rngState ^ w.day));
      if (r.ok) w.rngState = (w.rngState + 1) | 0;
      return r;
    }
    case "kabinett": {
      const r = halteKabinettssitzungAb(w, a.themaId, a.optionId);
      return { ok: r.erfolg, text: r.text, ...(r.effekteText.length ? { why: r.effekteText.join("; ") } : {}) };
    }
    case "massnahme":
      return bringeEin(w, a.id, a.ziel, a.ort, "gesetz");
    case "zusage": {
      const z = sp.zusagen.find((x) => x.id === a.zusageId);
      if (!z) return { ok: false, text: "Diese Zusage gibt es nicht mehr." };
      return a.weg === "einloesen" ? loeseEin(w, z) : a.weg === "vertroesten" ? vertroesteFrei(w, z) : brecheFrei(w, z);
    }
    case "gespraech": {
      const r = fuehreGespraech(w, a.figurId, a.themaId, a.ansatz);
      return { ok: r.ok, text: r.text, ...(r.folgen.length ? { why: r.folgen.map((x) => x.text).join(" ") } : {}) };
    }
    case "befehl":
      return erteileBefehl(w, a.entwurf);
    case "infrastruktur":
      return fuehreInfraAus(w, a);
    case "kenntnis":
      return { ok: true, text: "Zur Kenntnis genommen." };
    case "spaeter":
    case "nichts":
      return { ok: true, text: "" };
  }
}

/** Der Präsident entscheidet: die gewählte Option der Vorlage wird über die Kernfunktionen ausgeführt und vermerkt. */
export function entscheideVorlage(w: World, vorlageId: string, optionId: string): VorlagenAntwort {
  const sp = w.spiel;
  if (!sp) return { ok: false, text: "Ohne Spielschleife gibt es keine Vorlagen." };
  const v = ministerVorlagen(w, { tiefe: 0 }).find((x) => x.id === vorlageId);
  if (!v) return { ok: false, text: "Diese Vorlage liegt nicht mehr vor." };
  const o = v.optionen.find((x) => x.id === optionId);
  if (!o) return { ok: false, text: "Diese Option gibt es nicht." };
  if (!o.moeglich) return { ok: false, text: o.grund ?? "Das geht gerade nicht." };
  const z = flussZustand(w);
  const m = v.minister ? figurNachId(w, v.minister.id) : undefined;

  if (o.aktion.art === "spaeter") {
    z.vertagt[v.thema] = w.day + o.aktion.tage;
    return { ok: true, text: `Wiedervorlage in ${o.aktion.tage} Tagen.` };
  }
  if (o.aktion.art === "nichts") {
    z.abgelehnt[v.thema] = w.day;
    if (m) {
      merke(w, m, `Vorlage abgelehnt: ${v.titel}`);
      // Wer eine Empfehlung abgeben durfte und übergangen wird, ärgert sich — nur der Ehrgeizige merkt es
      if (v.empfehlung?.optionId && eigenVon(w, m).ehrgeiz >= 60) grollVerschieben(w, m, 1);
    }
    return { ok: true, text: "Nicht weiterverfolgt." };
  }

  const r = ausfuehren(w, o.aktion);
  if (!r.ok) return r;
  z.erledigt[v.id] = { tag: w.day, text: o.label };
  if (v.art === "rueckmeldung") z.gelesen.push(v.id);
  kappeRecord(z.erledigt, 80, (x) => x.tag);
  if (z.gelesen.length > 80) z.gelesen.splice(0, z.gelesen.length - 80);
  // Die Minister reagieren auf Entscheidungen: wer der Empfehlung folgt, stärkt den Rückhalt; wer sie übergeht, kränkt den Ehrgeizigen
  if (m && v.empfehlung?.optionId && v.art !== "rueckmeldung") {
    if (v.empfehlung.optionId === o.id) loyalitaetVerschieben(m, 1);
    else if (eigenVon(w, m).ehrgeiz >= 60) grollVerschieben(w, m, 1.5);
    merke(w, m, `Entscheidung zu „${v.titel}“: ${o.label}`);
  }
  if (v.quelle !== "ereignis" && v.quelle !== "kabinett") addLog(w, "entscheidung", `Vorlage von ${m ? kurzName(m) : AEMTER[v.amt].ressort} entschieden: ${v.titel} — ${o.label}.`, r.text || undefined);
  return r;
}

/** Eine Vorlage vertagen (ohne sie anzusehen). */
export function vertageVorlage(w: World, themaOderId: string, tage = 30): void {
  const v = ministerVorlagen(w, { tiefe: 0 }).find((x) => x.id === themaOderId || x.thema === themaOderId);
  flussZustand(w).vertagt[v?.thema ?? themaOderId] = w.day + tage;
}

// ---------------------------------------------------------------------------
// Buchführung

const QUELLEN_MIT_VERFALL: VorlagenQuelle[] = ["lage", "problem", "zusage", "person", "kabinett"];

/**
 * Hält fest, was gerade auf dem Tisch liegt, und lässt sichtbar verfallen, was verschwand, ohne dass entschieden wurde (die Lage
 * hat sich geändert, die Frist ist verstrichen). Wird von der Oberfläche gerufen, wenn der Tisch angezeigt wird — nicht im Monatslauf,
 * damit die Simulation selbst nichts davon rechnen muss.
 */
export function pflegeVorlagen(w: World): void {
  if (!w.spiel || w.spiel.ende) return;
  const z = flussZustand(w);
  const roh = sammle(w, { ungefiltert: true, probleme: 8 });
  const alleIds = new Set(roh.map((v) => v.id));
  for (const [id, g] of Object.entries(z.gesehen)) {
    if (alleIds.has(id) || z.erledigt[id]) {
      continue;
    }
    const thema = g.thema ?? id;
    if ((z.vertagt[thema] ?? 0) > w.day || z.abgelehnt[thema] !== undefined) continue;
    if (QUELLEN_MIT_VERFALL.includes(g.quelle)) {
      z.verfallen.push({ id, titel: g.titel, amt: g.amt, quelle: g.quelle, seit: g.tag, verfallen: w.day, grund: g.quelle === "zusage" ? "Die Zusage ist erledigt oder verfallen." : g.quelle === "kabinett" ? "Die Kabinettssitzung hat das Thema nicht mehr aufgegriffen." : "Die Lage hat sich geändert; der Vorschlag trifft nicht mehr zu." });
    }
    delete z.gesehen[id];
  }
  if (z.verfallen.length > 14) z.verfallen.splice(0, z.verfallen.length - 14);
  const oben = ministerVorlagen(w, { tiefe: 0 }).slice(0, 10);
  for (const v of oben) if (!z.gesehen[v.id]) z.gesehen[v.id] = { titel: v.titel, amt: v.amt, quelle: v.quelle, tag: w.day, thema: v.thema };
  // Alte Wiedervorlagen und Ablehnungen aufräumen
  for (const [id, t] of Object.entries(z.vertagt)) if (t < w.day - 120) delete z.vertagt[id];
  for (const [id, t] of Object.entries(z.abgelehnt)) if (t < w.day - 180) delete z.abgelehnt[id];
  const ids = Object.keys(z.gesehen);
  if (ids.length > 40) for (const id of ids.slice(0, ids.length - 40)) delete z.gesehen[id];
}

/** Wer in der Kabinettsrunde etwas vorlegt und wie viele Vorlagen er zurückhält (für die Oberfläche). */
export function posteingangJeAmt(w: World): { amt: Amt; ressort: string; minister?: ReturnType<typeof ministerInfo>; anzahl: number }[] {
  const alle = ministerVorlagen(w, { tiefe: 0 });
  return KABINETT_AMT.map((amt) => {
    const f = amtBesetzt(w, amt);
    return { amt, ressort: AEMTER[amt].ressort, ...(f ? { minister: ministerInfo(w, f) } : {}), anzahl: alle.filter((v) => v.amt === amt).length };
  });
}


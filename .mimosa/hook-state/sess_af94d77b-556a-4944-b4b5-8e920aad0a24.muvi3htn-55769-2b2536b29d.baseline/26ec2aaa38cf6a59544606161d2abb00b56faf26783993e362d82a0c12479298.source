// Die Spielschleife: was jeden Tag und jeden Monat zusätzlich zur Wirtschaft geschieht.
//   täglich   Abstimmungen im Parlament, Fristen von Ereignissen, Wahltag
//   monatlich Politisches Kapital, Außenwelt, neue Ereignisse, Umfrage, Sturzgefahr, Loyalität der Figuren
// Alle Zahlen sind Platzhalter der Kalibrierung.

import { reichMonat } from "./reich";
import { NET } from "./modell";
import { nationalAverage, PROVINCES } from "./netz";
import { addLog } from "./log";
import { addDays, dayOfMonth, formatDateDe } from "./dates";
import { clamp } from "./economy";
import { aussenweltMonat, aussenweltStart } from "./aussenwelt";
import { ereignisMonat, ereignisTag, MAX_OFFEN, oeffne } from "./ereignisse";
import { verhandlungMonat } from "./verhandeln";
import { programmTag } from "./programme";
import { berichteTag } from "./berichte";
import { altlast, taktMonat } from "./takt";
import { weltMonat } from "./laender";
import { abkommenMonat } from "./abkommen";
import { euKapitalAbzug, euMonat } from "./eu";
import { setzeKriegBruecke } from "./initiative";
import { setzeVermittlungBruecke, vermittlungMonat } from "./vermittlung";
import { GRUPPEN, GRUPPEN_SUMME } from "./gruppen";
import { umfrageMonat } from "./umfrage";
import { verlaufAufzeichnen } from "./waehler-verlauf";
import { erzeugeFiguren, figur, anrede } from "./figuren";
import { personenMonat } from "./personen-monat";
import { ausscheiden } from "./nachfolge";
import { AEMTER } from "./personen";
import { gesetzeAbstimmen, REGELN, stimmenSicht, unterhaltKosten } from "./handeln";
import { verfassungAktiv, verfassungKapitalAbzug, verfassungsVorgangTag } from "./verfassung";
import { haushaltszyklusTag } from "./haushalt";
import { krisenAktualisieren } from "./krisen";
import { katastropheMonat } from "./katastrophe";
import { KRIEG, kriegMit, kriegMonat, kriegTag } from "./krieg";
import { akuteProbleme } from "./bilanz";
import { zielDef } from "./ziele";
import { Rng } from "./rng";
import type { PlayerProfile } from "./prolog";
import type { World } from "./types";
import type { EndeArt, SpielZustand, Zusage } from "./spiel-typen";
import { wirke } from "./wirkung";
import { zeitungEreignis, zeitungMonat } from "./zeitung";
import { VERFASSUNG, belastungEreignis, verfassungStart, verfassungTag } from "./aufmerksamkeit";
import { wahlkampfTag } from "./wahlkampf";
import { wahlTick } from "./wahl";
import { amtszeitMonat, muedigkeitsMonate } from "./amtszeit";
import { endenMonat } from "./enden";
import { dauerherrscherMonat } from "./dauerherrscher";
import { kabinettStatus } from "./kabinett";

// AUS-1 ↔ MIL-1: Die Drohkulisse der Länder-Eigeninitiative übergibt an den Konfliktvorgang (sim/krieg.ts),
// ohne ihn direkt zu importieren (Modul-Ladezyklus). Besteht mit dem Land schon eine Spannung, hebt sie auf
// Drohkulisse-Niveau; sonst greift die Monatsprüfung des Kriegsmoduls die Lage von sich aus auf.
setzeKriegBruecke({
  eskaliere: (w, landId) => {
    const k = kriegMit(w, landId);
    if (!k || k.phase !== "spannung") return false;
    k.eskalation = Math.max(k.eskalation, KRIEG.drohkulisseAb + 2);
    return true;
  },
});

// AUS-4: Die Vermittlung zwischen Drittstaaten öffnet ihre Spoiler- und Verstoß-Ereignisse über diese
// Brücke (Modul-Ladezyklus: sim/vermittlung.ts importiert ereignisse.ts nicht) — die Auto-Stops der
// Klasse A entstehen so im selben Ereignismotor wie alles andere. Die Obergrenze offener Vorgänge gilt.
setzeVermittlungBruecke({
  oeffneEreignis: (w, vorlage, daten, rng) => {
    const spiel = w.spiel;
    if (!spiel) return;
    if (spiel.ereignisse.some((e) => e.vorlage === vorlage)) return;
    const offen = spiel.ereignisse.filter((e) => !e.vorlage.startsWith("start_")).length;
    if (offen >= MAX_OFFEN) return;
    oeffne(w, vorlage, rng, { provinzen: [], staerke: 1, daten });
  },
  zeitung: (w, e) => zeitungEreignis(w, { art: "krise", ...e }),
});

/** Die Schwierigkeit verändert nur drei Stellschrauben: das Einkommen an Kapital, die Regierungsmüdigkeit und die Häufigkeit und Härte von Ereignissen. */
export const SCHWIERIGKEITEN = {
  entspannt: { name: "Entspannt", text: "Mehr Kapital, weniger Müdigkeit, weniger Krisen. Zum Kennenlernen.", kapital: 1.25, muedigkeit: 0.75, ereignisse: 0.85, haerte: 0.9 },
  normal: { name: "Normal", text: "Das Spiel, wie es gemeint ist.", kapital: 1, muedigkeit: 1, ereignisse: 1, haerte: 1 },
  hart: { name: "Hart", text: "Knappes Kapital, schnelle Müdigkeit, mehr und härtere Krisen. Fehler kosten die Wiederwahl.", kapital: 0.8, muedigkeit: 1.22, ereignisse: 1.25, haerte: 1.2 },
} as const;
export type Schwierigkeit = keyof typeof SCHWIERIGKEITEN;

export function schwierig(world: World) {
  return SCHWIERIGKEITEN[world.spiel?.schwierigkeit ?? "normal"];
}

export const SPIEL = {
  startKapital: 60,
  /** Kapital je Monat: Grundeinkommen, dazu Vertrauen und Mehrheit */
  kapitalGrund: 3.5,
  kapitalVertrauen: 5,
  kapitalMehrheit: 1.5,
  /** Verlust an Zustimmung je Monat im Amt (Regierungsmüdigkeit) */
  muedigkeit: 0.30,
  /** Gewicht der Probleme in der Zustimmung: Summe der Bevölkerungsanteile in Provinzen mit akutem Problem */
  problemGewicht: 4,
  /** Monate unter der Sturzschwelle bis zum Sturz */
  sturzMonate: 6,
  sturzSchwelle: 25,
  amtszeitJahre: 5,
} as const;


// ---------------------------------------------------------------------------
// Zustimmung

function problemLast(w: World): number {
  let summe = 0;
  for (const node of NET.nodes) {
    if (node.kind !== "problem" || !node.threshold) continue;
    const i = NET.index.get(node.id)!;
    let anteil = 0;
    for (let p = 0; p < PROVINCES; p++) if (w.net.values[i * PROVINCES + p]! >= node.threshold) anteil += w.net.weights[p]!;
    summe += anteil;
  }
  return summe;
}

/** Die Bestandteile der Zustimmung; jeder Teil steht für sich, damit die Oberfläche erklären kann, woher die Zahl kommt. */
export function zustimmungsTeile(w: World, monate: number): { vertrauen: number; gruppen: number; wirtschaft: number; probleme: number; muedigkeit: number; roh: number } {
  const spiel = w.spiel!;
  const s0 = spiel.start;
  const e = w.economy;
  const vertrauen = nationalAverage(NET, w.net, "vertrauen_regierung");
  const gruppen = GRUPPEN.reduce((s, g) => s + g.gewicht * nationalAverage(NET, w.net, g.id), 0) / GRUPPEN_SUMME;
  const wirtschaft = clamp(50 + 0.6 * (s0.inflation - e.inflation) - 3 * (e.unemployment - s0.arbeitslosigkeit) + 1.5 * (e.growth - s0.wachstum), 0, 100);
  const probleme = SPIEL.problemGewicht * problemLast(w);
  // Die Müdigkeit zählt ab dem Beginn der Amtszeit; ein Teil des Verschleißes früherer Amtszeiten geht mit (sim/amtszeit.ts)
  const muedigkeit = SPIEL.muedigkeit * schwierig(w).muedigkeit * muedigkeitsMonate(w, monate);
  return { vertrauen, gruppen, wirtschaft, probleme, muedigkeit, roh: 0.45 * vertrauen + 0.25 * gruppen + 0.3 * wirtschaft - probleme - muedigkeit };
}

/** Zustimmung, wie sie sich aus dem Zustand ergäbe (ohne Startverschiebung). */
function rohZustimmung(w: World, monate: number): number {
  return zustimmungsTeile(w, monate).roh;
}

export function zielZustimmung(w: World): number {
  const monate = w.day / 30.4;
  const x = rohZustimmung(w, monate) + w.spiel!.kalibrierung;
  // Wachsende Beliebtheit hat abnehmenden Ertrag: Über der Hälfte wird jeder Punkt schwerer
  return clamp(x > 50 ? 50 + 0.65 * (x - 50) : x, 0, 100);
}

// ---------------------------------------------------------------------------
// Start

function tageBis(von: string, bis: string): number {
  return Math.round((Date.parse(bis + "T00:00:00Z") - Date.parse(von + "T00:00:00Z")) / 86_400_000);
}

function zusagenAusProfil(profil: PlayerProfile): Zusage[] {
  const out: Zusage[] = [];
  const neu = (id: string, von: string, text: string, faellig: number, massnahme?: string): void => {
    const z: Zusage = { id, von, text, faellig, erfuellt: false, gebrochen: false };
    if (massnahme) {
      z.massnahme = massnahme;
      z.richtung = 1;
    }
    out.push(z);
  };
  for (const v of profil.versprechen) {
    if (v.includes("zwei Ministerien")) neu("z-ministerien", "YENİ", "Der YENİ Parti wurden zwei Ministerien zugesagt", 45);
    else if (v.includes("Mitspracherecht")) neu("z-friedensprozess", "MHP", "Der MHP wurde ein Mitspracherecht beim Friedensprozess zugesagt", 60);
    else if (v.includes("Rentenerhöhung")) neu("z-renten", "Wähler", "Rentenerhöhung in den ersten hundert Tagen versprochen", 100, "m_renten");
    else if (v.includes("Vergaben")) neu("z-vergaben", "Wähler", "Offene Vergaben und Vermögenserklärungen versprochen", 150, "m_antikorruption");
  }
  return out;
}

/** Erzeugt die Spielschleife beim Amtsantritt und öffnet die drei Vorgänge des ersten Tages. */
export function initSpiel(world: World, profil: PlayerProfile, rng: Rng): void {
  aussenweltStart(world);
  const start = {
    inflation: world.published.inflation.value,
    arbeitslosigkeit: world.economy.unemployment,
    wachstum: world.economy.growth,
    schulden: world.economy.debtRatio,
    vertrauen: nationalAverage(NET, world.net, "vertrauen_regierung"),
    akut: 0,
    datum: world.date,
  };
  const spiel: SpielZustand = {
    kapital: SPIEL.startKapital,
    gesetze: [],
    ereignisse: [],
    zuletzt: {},
    figuren: [],
    zusagen: zusagenAusProfil(profil),
    umfrage: { zustimmung: profil.wahl.anteil, verlauf: [] },
    ziele: [],
    ersterTagErledigt: false,
    wahltag: tageBis(world.date, addDays(world.date, 365 * SPIEL.amtszeitJahre + 1)),
    amtszeit: 1,
    lager: profil.buendnis ? [profil.buendnis] : [],
    tiefstand: 0,
    chronik: [],
    hinweise: [],
    kalibrierung: 0,
    verfassung: verfassungStart(),
    start,
  };
  world.spiel = spiel;
  spiel.figuren = erzeugeFiguren(world, rng);
  const gouverneur = figur(world, "zentralbank");
  if (gouverneur) world.governor.name = gouverneur.name;
  spiel.start.akut = akuteProbleme(world);
  spiel.kalibrierung = profil.wahl.anteil - rohZustimmung(world, 0);
  // Die drei drängenden Vorgänge des ersten Tages
  oeffne(world, "start_haushalt", rng);
  oeffne(world, "start_partner", rng);
  oeffne(world, "start_wiederaufbau", rng);
  // Krisen-Blocker: beim Amtsantritt einmal auf den Stand bringen (ältere Spielstände bekommen das Feld so beim ersten Tick)
  krisenAktualisieren(world);
}

/** Der Spieler wählt am ersten Tag höchstens drei Ziele. */
export function waehleZiele(world: World, ids: string[], schwierigkeit?: Schwierigkeit): void {
  const spiel = world.spiel;
  if (!spiel) return;
  if (schwierigkeit) spiel.schwierigkeit = schwierigkeit;
  spiel.ziele = ids.filter((id) => zielDef(id)).slice(0, 3);
  spiel.ersterTagErledigt = true;
  spiel.hinweise.push({
    id: "starthilfe",
    titel: "So regieren Sie",
    szene: "istanbul",
    text: [
      "Kapital ist Ihre knappe Währung. Es wächst jeden Monatsersten; Gesetze, Verhandlungen und Antworten auf Ereignisse kosten davon. Alles auf einmal geht nicht: Setzen Sie Prioritäten.",
      "Ereignisse verlangen eine Antwort. Wer schweigt, bekommt die schlechtere Folge; wer kein Kapital hat, kann bewusst abwarten. Jede Antwort zeigt, was sie bewirkt.",
      "Unter „Politik“ steht, was bei Ihren akuten Problemen jetzt am meisten bringt. Ein Gesetz braucht 301 Stimmen; ohne sie verhandeln Sie im Parlament mit den Fraktionen.",
      "„Wähler“ zeigt, wer Sie trägt und was jede Gruppe will, „Die Welt“ die anderen Staaten und „Programme“ Ihren Plan für Jahre. In fünf Jahren wird gewählt.",
    ],
  });
  addLog(world, "entscheidung", `Ziele der Amtszeit: ${spiel.ziele.map((id) => zielDef(id)!.titel).join(", ") || "keine"}.`, "Die Bilanz misst am Ende, was davon erreicht wurde.");
}

// ---------------------------------------------------------------------------
// Tick

export function spielTick(world: World, rng: Rng): void {
  const spiel = world.spiel;
  if (!spiel || spiel.ende) return;
  gesetzeAbstimmen(world, rng);
  verfassungsVorgangTag(world, rng);
  haushaltszyklusTag(world, rng);
  ereignisTag(world, rng);
  krisenAktualisieren(world);
  kriegTag(world, rng);
  programmTag(world);
  berichteTag(world);
  verfassungTag(world);
  // INN-5: Der Wahlkampf als Handlungsphase (Beginn acht Wochen vor der Wahl, Wochenbudget, TV-Duell)
  wahlkampfTag(world);
  if (dayOfMonth(world.date) === 1) spielMonat(world, rng);
  // Wahltag und Stichwahl (sim/wahl.ts): erster Wahlgang mit Parlamentswahl, gegebenenfalls Stichwahl nach 14 Tagen, dann die Folgen
  wahlTick(world, rng);
}

/** Was das Politische Kapital jeden Monat (am Monatsersten) wieder auflädt, aufgeschlüsselt. */
export interface KapitalEinkommen {
  grund: number;
  vertrauen: number;
  mehrheit: number;
  /** Legitimität der Regierung: über 60 ein Zuschlag, darunter ein Abschlag (höchstens ±1) */
  legitimitaet: number;
  /** Democracy-4-Mechanik: Beitrag des Ministerrats aus Loyalität, Fähigkeit und Disziplin der 7 Ressorts */
  kabinett: number;
  /** Laufender Unterhalt der Maßnahmen mit `unterhalt_monat` (Abzug, positiv angegeben) */
  unterhalt: number;
  /** Altlasten: überfällige Zusagen und akute Probleme zehren am Kapital (Abzug, positiv angegeben; sim/takt.ts) */
  altlast: number;
  summe: number;
  /** Datum der nächsten Gutschrift */
  naechste: string;
  /** Obergrenze, bis zu der sich Kapital ansammeln kann */
  grenze: number;
}

export function kapitalEinkommen(world: World): KapitalEinkommen {
  const vertrauen = (SPIEL.kapitalVertrauen * nationalAverage(NET, world.net, "vertrauen_regierung")) / 100;
  const mehrheit = stimmenSicht(world).lager >= REGELN.mehrheit ? SPIEL.kapitalMehrheit : 0;
  const [j, m] = world.date.split("-").map(Number) as [number, number];
  const naechste = m === 12 ? `${j + 1}-01-01` : `${j}-${String(m + 1).padStart(2, "0")}-01`;
  const f = schwierig(world).kapital;
  const legit = nationalAverage(NET, world.net, "legitimitaet");
  const legitimitaet = Number.isFinite(legit) ? Math.max(-1, Math.min(1, (legit - 60) / 40)) : 0;
  // Democracy-4-Mechanik: Die 7 Minister erzeugen das Politische Kapital der Regierung
  const kabinett = world.spiel?.figuren?.length ? kabinettStatus(world).kapitalSumme * f : 0;
  // Vier-Preise-Regel: Maßnahmen mit Unterhaltspreis zehren monatlich am Kapital, anteilig zur Stufe
  const unterhalt = unterhaltKosten(world).summe;
  // REC-1: Demokratisierende Verfassungsartikel kosten laufend etwas Kapital — wer Kontrolle abgibt,
  // regiert mit weniger Druckmitteln (Spielparameter; die Legitimität gewinnt langfristig)
  const verfassungAbzug = verfassungKapitalAbzug(world) * f;
  // AUS-2: Verhandelte EU-Kapitel kosten laufend Kapital (dieselbe REC-Logik: Reformen binden Rückhalt)
  const euAbzug = euKapitalAbzug(world) * f;
  // Gegenkraft (sim/takt.ts): Wer Zusagen schleifen lässt und Probleme liegen lässt, regiert mit weniger Rückhalt
  const altlastAbzug = altlast(world);
  return {
    grund: SPIEL.kapitalGrund * f,
    vertrauen: vertrauen * f,
    mehrheit: mehrheit * f,
    legitimitaet: legitimitaet * f,
    kabinett,
    unterhalt: unterhalt + verfassungAbzug + euAbzug,
    altlast: altlastAbzug,
    summe: (SPIEL.kapitalGrund + vertrauen + mehrheit + legitimitaet) * f + kabinett - unterhalt - verfassungAbzug - euAbzug - altlastAbzug,
    naechste,
    grenze: REGELN.kapitalMax,
  };
}

function spielMonat(world: World, rng: Rng): void {
  const spiel = world.spiel!;
  spiel.kapital = Math.min(REGELN.kapitalMax, spiel.kapital + kapitalEinkommen(world).summe);
  // Gegenkräfte und Rückblicke (sim/takt.ts): Kapital über der Schwelle verfällt, überfällige Zusagen haben Folgen, das Lager wird auf Dauerschwäche geprüft
  taktMonat(world);
  // Rückhalt auf Pump: Wer im Minus steht, zahlt monatlich mit Legitimität und Vertrauen, bis die Gutschriften das Konto ausgleichen
  if (spiel.kapital < 0) {
    const last = Math.min(1, -spiel.kapital / 12);
    wirke(world, "legitimitaet", -0.6 * last);
    wirke(world, "vertrauen_regierung", -0.25 * last);
    if (!spiel.hinweise.some((h) => h.id.startsWith("pump-")) && world.day - (spiel.zuletzt.pump ?? -1e9) > 180) {
      spiel.zuletzt.pump = world.day;
      addLog(world, "ereignis", "Sie handeln auf Pump: Das Politische Kapital ist im Minus.", "Wer Rückhalt vorwegnimmt, zahlt mit Legitimität und Vertrauen, bis die monatliche Gutschrift das Konto ausgleicht.");
    }
  }
  verhandlungMonat(world);
  weltMonat(world);
  abkommenMonat(world, rng);
  // Die Vermittlung zwischen Drittstaaten (AUS-4): Reife-Dynamik, Konflikt-Index, Garantien, Spoiler
  vermittlungMonat(world, rng);
  // Der EU-Beitrittsvorgang (AUS-2): Screening, Kapitel, Vetos, Zollunion, Visa, Fortschrittsbericht
  euMonat(world, rng);
  kriegMonat(world, rng);
  reichMonat(world, rng);
  // Katastrophen (INF-5): Risiko-Layer würfelt je Zone; Hilfskette und Lieferfortschritt laufen
  katastropheMonat(world, rng);

  // Eigeninitiative der Länder (AUS-1) läuft über ihre Vorlagen im Ereignis-Wettbewerb (sim/ereignisse.ts)
  aussenweltMonat(world, rng);
  ereignisMonat(world, rng);

  // Umfrage: zieht zum Sollwert, träge. Der interne Wert bleibt die Wahrheit des Spiels
  // (Sturzgefahr, Wahl, HUD); die VERÖFFENTLICHTE Messung mit Instituts-Bias entsteht in
  // sim/zeitung.ts (UI-1) und erscheint nur dort — siehe monatsUmfrage.
  const ziel = zielZustimmung(world);
  spiel.umfrage.zustimmung = umfrageMonat(spiel.umfrage.zustimmung, ziel);
  spiel.umfrage.verlauf.push({ monat: world.date.slice(0, 7), wert: Math.round(spiel.umfrage.zustimmung * 10) / 10 });
  if (spiel.umfrage.verlauf.length > 120) spiel.umfrage.verlauf.shift();
  verlaufAufzeichnen(world);

  // Sturzgefahr
  if (spiel.umfrage.zustimmung < SPIEL.sturzSchwelle) spiel.tiefstand += 1;
  else spiel.tiefstand = Math.max(0, spiel.tiefstand - 1);
  if (spiel.tiefstand === 3) {
    belastungEreignis(world, VERFASSUNG.sturzWarnung, "Die Warnung vor dem Sturz");
    spiel.hinweise.push({
      id: `warnung-${world.day}`,
      titel: "Warnzeichen",
      szene: "istanbul",
      text: [
        `Die Zustimmung liegt seit drei Monaten unter ${SPIEL.sturzSchwelle} Prozent. Auf den Plätzen sammeln sich Menschen; ${anrede(figur(world, "stab"))} warnt vor Massenprotesten.`,
        "Wenn sich nichts ändert, droht das Ende der Amtszeit lange vor der nächsten Wahl.",
      ],
    });
    addLog(world, "ereignis", "Warnzeichen: Die Zustimmung bleibt sehr niedrig.", "Nach sechs Monaten unter der Schwelle droht der Sturz.");
  }
  if (spiel.tiefstand >= SPIEL.sturzMonate) {
    beende(world, "sturz", "Massenproteste beenden die Amtszeit", `Nach Monaten unter ${SPIEL.sturzSchwelle} Prozent Zustimmung zwingen Massenproteste, ein Bruch im Lager und der Druck der Straße den Präsidenten aus dem Amt.`);
    return;
  }

  personenMonat(world);
  figurenPruefen(world, rng);
  // Amtszeit (sim/amtszeit.ts): ältere Stände nachholen, Umbildungsfenster schließen, in der letzten Amtszeit die Nachfolge
  amtszeitMonat(world, rng);
  // Vorzeitige Enden (sim/enden.ts): Putschrisiko mit Warnstufen, Amtsenthebung nach AY 105, Gesundheit, Rücktrittsforderung
  endenMonat(world, rng);
  // Langzeitfolgen der Dauerherrschaft ab der dritten Amtszeit (sim/dauerherrscher.ts)
  dauerherrscherMonat(world);
  // Die Zeitung (UI-1): Monatsausgabe mit den Blättern der Cluster, Umfrage eines Instituts und
  // der leichten Wirkung auf die Wählergruppen. Eilmeldungen von heute bringt Print erst nächsten Monat.
  zeitungMonat(world);
}

function figurenPruefen(world: World, rng: Rng): void {
  const spiel = world.spiel!;
  // Partner verlassen das Lager, wenn die Loyalität kippt
  for (const f of spiel.figuren) {
    if (f.amt === "partner" && f.partei && spiel.lager.includes(f.partei) && f.loyalitaet < 20) {
      spiel.lager = spiel.lager.filter((p) => p !== f.partei);
      const seats = world.parliament?.seats[f.partei] ?? 0;
      addLog(world, "ereignis", `Die ${f.partei} verlässt das Regierungslager (${seats} Sitze).`, "Ohne die Partner wird jede Abstimmung schwerer; Zusagen zu brechen hat einen Preis.");
      spiel.hinweise.push({
        id: `bruch-${world.day}-${f.partei}`,
        titel: "Bruch im Lager",
        szene: "parlament",
        text: [`Die ${f.partei} kündigt die Zusammenarbeit auf und verlässt das Regierungslager. Dem Lager fehlen damit ${seats} Sitze.`],
      });
      // Vertragsbruch: Großereignis für die Zeitung (Eilmeldung digital, Print im nächsten Monat)
      zeitungEreignis(world, {
        art: "bruch",
        titel: `${f.partei} verlässt das Lager`,
        fakt: `Die ${f.partei} kündigt die Zusammenarbeit auf und verlässt das Regierungslager; dem Lager fehlen damit ${seats} Sitze.`,
        wertung: -0.9,
        schluessel: [`verlässt das Regierungslager`],
      });
      f.loyalitaet = 30;
    }
  }
  // Wer gar nichts mehr trägt, geht: Ein Regierungsmitglied mit Loyalität unter 12 tritt mit einiger Wahrscheinlichkeit zurück
  for (const f of spiel.figuren) {
    if (!f.imAmt || !AEMTER[f.amt].regierungsamt || f.eigen?.kommissarisch || f.loyalitaet >= 12) continue;
    if (rng.next() < 0.4) ausscheiden(world, f, "Rücktritt, weil ihm der Rückhalt fehlt");
  }
}

// ---------------------------------------------------------------------------
// Wahl und Ende

export function beende(world: World, art: EndeArt, titel: string, text: string, anteil?: number, nachfolge?: "sieg" | "niederlage"): void {
  const spiel = world.spiel!;
  spiel.ende = { tag: world.day, datum: world.date, art, titel, text, ...(anteil !== undefined ? { anteil } : {}), ...(nachfolge ? { nachfolge } : {}) };
  spiel.ereignisse = [];
  spiel.gesetze = [];
  addLog(world, "ereignis", titel, text);
}

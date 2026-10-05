// Die Textbausteine der Zeitung: Aus einem Vorgang (Fakt plus strukturierte Angaben aus dem Weltzustand)
// macht jede Lesart ihren eigenen Artikel. Der Dreh betrifft nicht nur einen Kommentarsatz, sondern
//   - die Auswahl (was kommt zuerst, was steht unter der Falz),
//   - den Vergleichsmaßstab (Vormonat, Amtsantritt, Bevölkerungsanteil),
//   - die Zuschreibung (wer wird zitiert: Minister oder Opposition),
//   - und die Unsicherheit (die unabhängige Lesart nennt, was belegt und was offen ist).
// Jede Zahl im Text stammt aus dem Vorgang oder dem Kontext; es gibt keine Platzhaltersätze ohne Inhalt.
// Regelbasiert und deterministisch: Die Variante wählt `w` (ein Hash aus Vorgang und Blatt), nie der Spielstrom.
//
// Der Fakt des Vorgangs steht in jedem Artikel zuerst. Die Absätze danach bringen NEUES (Delta, Vergleichsmaßstab,
// Folgen, Zuschreibung) — sie wiederholen den Fakt nicht. Wo ein Baustein die Fakten in der Reihenfolge und
// Gewichtung seiner Lesart selbst nennt (Wirtschaftsüberblick, Lage, Ausland), ersetzt er den Fakt (`ersetztFakt`).

import type { FramingArt, ZeitungVorgang } from "../sim/zeitung";

// ---------------------------------------------------------------------------
// Eingaben

/** Ein Amtsträger der laufenden Partie (Name und Rolle stammen aus dem Weltzustand). */
export interface Amt {
  name: string;
  rolle: string;
}

export interface TextKontext {
  /** Name des Präsidenten */
  name: string;
  /** Kürzel der eigenen Partei */
  partei: string;
  finanz?: Amt;
  aussen?: Amt;
  inneres?: Amt;
  opposition?: Amt;
  wirtschaft?: Amt;
  /** Aktuelle veröffentlichte bzw. öffentliche Werte, wo sie für Vergleiche im Text gebraucht werden */
  zahlen?: { inflation?: number; arbeit?: number; wachstum?: number; zins?: number; lira?: number };
  /** Die Mehrheitslage im Parlament */
  mehrheit?: { lager: number; duldung: number; noetig: number };
}

export interface Baustein {
  schlagzeile: string;
  /** Die Absätze nach dem gemeinsamen Fakt (der Fakt selbst steht zuerst im Artikel, außer `ersetztFakt`) */
  absaetze: string[];
  kurz: boolean;
  /** Der Baustein nennt die Fakten selbst in der Gewichtung seiner Lesart; der Fakt des Vorgangs entfällt */
  ersetztFakt?: boolean;
}

/** Eine Kennzahl des Monats mit Vormonat; die Leserichtung („gut“) sagt, was für die Regierung günstig ist. */
export interface KennzahlDaten {
  id: "inflation" | "arbeit" | "wachstum" | "zins" | "lira" | "zustimmung";
  wert: number;
  vorher?: number;
  /** +1: Anstieg ist für die Regierung gut, −1: Anstieg ist schlecht */
  gut: 1 | -1;
}

export interface LagePunkt {
  id: string;
  name: string;
  /** Zahl der Provinzen, in denen das Problem akut ist */
  provinzen: number;
  /** Bevölkerungsanteil der betroffenen Provinzen, 0 bis 1 */
  anteil: number;
  /** Name der am stärksten betroffenen Provinz */
  schlimmste: string;
  /** Zahl der Provinzen beim Vormonat (fehlt bei der ersten Ausgabe) */
  vorher?: number;
}

export type AuslandPunkt =
  | { art: "spannung"; land: string; dat: string; wert: number; vorher?: number }
  | { art: "krieg"; land: string; dat: string; phase: string; eskalation: number; tage: number }
  | { art: "vermittlung"; titel: string; konflikt: number; reif: number; konfliktVorher?: number }
  | { art: "eu"; phase: string; abgeschlossen: number; offen: number; gesamt: number };

/** Die strukturierten Angaben, aus denen ein Blatt seinen eigenen Text baut. */
export type VorgangDaten =
  | { typ: "kennzahl"; kennzahl: "inflation" | "zins" | "lira"; wert: number; vorher: number; start?: number; stand?: string }
  | { typ: "ueberblick"; zahlen: KennzahlDaten[] }
  | { typ: "lage"; fokus: LagePunkt; weitere: LagePunkt[]; gebessert: LagePunkt[] }
  | {
      typ: "bericht";
      name: string;
      monate: number;
      urteil: "gut" | "schwach" | "keine" | "gemischt";
      von: number;
      auf: number;
      veraenderungen: { name: string; von: number; auf: number }[];
      akut: { name: string; von: number; auf: number }[];
      /** Monate bis zur vollen Wirkung, soweit der Bericht sie nennt */
      rest?: number;
    }
  | { typ: "gesetz"; name: string; ja: boolean }
  | { typ: "programm"; schritt: string; erfuellt: boolean }
  | { typ: "umfrage"; institut: string; wert: number; delta?: number; stichprobe?: number }
  | { typ: "ausland"; punkt: AuslandPunkt }
  | { typ: "eil"; feststeht: string[]; offen: string[] };

// ---------------------------------------------------------------------------
// Hilfen

const n1 = (x: number): string => x.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const n0 = (x: number): string => Math.round(x).toLocaleString("de-DE");
const prozent = (x: number): string => `${n1(x)} Prozent`;
const punkte = (d: number): string => `${n1(Math.abs(d))} Prozentpunkte`;
const provinzen = (n: number): string => `${n} ${n === 1 ? "Provinz" : "Provinzen"}`;
const anteilText = (a: number): string => `${n0(a * 100)} Prozent der Bevölkerung`;
const gross = (s: string): string => s.replace(/^./, (c) => c.toUpperCase());

/** Wählt deterministisch eine Variante; `salz` entkoppelt mehrere Wahlen im selben Artikel. */
function pick<T>(liste: readonly T[], w: number, salz = 0): T {
  const i = Math.floor(((((w * 7919 + salz * 0.6180339) % 1) + 1) % 1) * liste.length);
  return liste[Math.min(liste.length - 1, Math.max(0, i))]!;
}

const b = (schlagzeile: string, absaetze: string[], kurz = false): Baustein => ({ schlagzeile, absaetze: absaetze.filter((s) => s.trim().length > 0), kurz });
/** Der Baustein nennt die Fakten selbst; der Fakt des Vorgangs entfällt im Artikel. */
const eigen = (bs: Baustein): Baustein => ({ ...bs, ersetztFakt: true });

/** Ein Zitat mit Zuschreibung (deutsche Zeichensetzung: „Satz“, sagt …); ohne Amtsträger im Weltzustand entfällt es. */
function zitat(amt: Amt | undefined, sprueche: readonly string[], w: number, salz = 0): string {
  if (!amt) return "";
  const s = pick(sprueche, w, salz).replace(/\.$/, "");
  return `„${s}“, sagt ${amt.rolle} ${amt.name}.`;
}

const KZ_NAME: Record<KennzahlDaten["id"], { nom: string; kurz: string }> = {
  inflation: { nom: "die Inflation", kurz: "Inflation" },
  arbeit: { nom: "die Arbeitslosigkeit", kurz: "Arbeitslosigkeit" },
  wachstum: { nom: "das Wachstum", kurz: "Wachstum" },
  zins: { nom: "der Leitzins", kurz: "Leitzins" },
  lira: { nom: "der Dollar", kurz: "Dollarkurs" },
  zustimmung: { nom: "die Zustimmung", kurz: "Zustimmung" },
};

/** Günstigkeit für die Regierung: positiv = gut. Relative Bewegung, damit Kennzahlen vergleichbar sind. */
export function kzBewertung(z: KennzahlDaten): number {
  if (z.vorher === undefined) return 0;
  const d = z.wert - z.vorher;
  const skala = z.id === "lira" ? (z.vorher !== 0 ? (d / z.vorher) * 100 : 0) / 2 : z.id === "arbeit" ? d * 2 : d;
  return skala * z.gut;
}

const unveraendert = (z: KennzahlDaten): boolean => z.vorher === undefined || Math.abs(z.wert - z.vorher) < 0.05;

/** „die Inflation sank auf 21,1 Prozent (zuvor 21,7)“ — Hauptsatz */
export function kzSatz(z: KennzahlDaten): string {
  const nom = KZ_NAME[z.id].nom;
  if (unveraendert(z)) return z.id === "lira" ? `${nom} kostet ${n1(z.wert)} Lira` : `${nom} liegt bei ${prozent(z.wert)}`;
  const steigt = z.wert > z.vorher!;
  if (z.id === "lira") return `${nom} kostet jetzt ${n1(z.wert)} Lira (zuvor ${n1(z.vorher!)})`;
  return `${nom} ${steigt ? "stieg" : "sank"} auf ${prozent(z.wert)} (zuvor ${n1(z.vorher!)})`;
}

/** „die Inflation auf 21,1 Prozent gesunken ist (zuvor 21,7)“ — Nebensatz nach „dass“ */
export function kzNeben(z: KennzahlDaten): string {
  const nom = KZ_NAME[z.id].nom;
  if (unveraendert(z)) return z.id === "lira" ? `${nom} bei ${n1(z.wert)} Lira steht` : `${nom} bei ${prozent(z.wert)} liegt`;
  const steigt = z.wert > z.vorher!;
  if (z.id === "lira") return `${nom} auf ${n1(z.wert)} Lira ${steigt ? "gestiegen" : "gefallen"} ist (zuvor ${n1(z.vorher!)})`;
  return `${nom} auf ${prozent(z.wert)} ${steigt ? "gestiegen" : "gesunken"} ist (zuvor ${n1(z.vorher!)})`;
}

/** Kurzform für Überschriften: „Inflation sinkt auf 21,1 Prozent“ */
function kzTitel(z: KennzahlDaten): string {
  const name = KZ_NAME[z.id].kurz;
  if (unveraendert(z)) return `${name} bei ${z.id === "lira" ? `${n1(z.wert)} Lira` : prozent(z.wert)}`;
  const steigt = z.wert > z.vorher!;
  if (z.id === "lira") return `Dollar ${steigt ? "steigt" : "fällt"} auf ${n1(z.wert)} Lira`;
  return `${name} ${steigt ? "steigt" : "sinkt"} auf ${prozent(z.wert)}`;
}

/** Die Bewegung zum Vormonat in Kurzform: „Inflation −0,3 Punkte“, „Dollarkurs +2,8 Prozent“ */
function kzBewegung(z: KennzahlDaten): string {
  const name = KZ_NAME[z.id].kurz;
  if (z.vorher === undefined) return `${name} ${z.id === "lira" ? n1(z.wert) : prozent(z.wert)}`;
  const d = z.wert - z.vorher;
  const vz = d >= 0 ? "+" : "−";
  if (z.id === "lira") return `${name} ${vz}${n1(Math.abs((d / z.vorher) * 100))} Prozent`;
  return `${name} ${vz}${n1(Math.abs(d))} Punkte`;
}

// ---------------------------------------------------------------------------
// Wirtschaft: eine Kennzahl, die sich bewegt hat

function startSatz(wert: number, start: number | undefined): string {
  if (start === undefined) return "";
  const diff = wert - start;
  if (Math.abs(diff) < 0.05) return "Damit liegt die Rate genau auf dem Stand vom Amtsantritt.";
  return `Bei Amtsantritt lag die Rate bei ${prozent(start)}; seither ist sie um ${punkte(diff)} ${diff < 0 ? "gefallen" : "gestiegen"}.`;
}

function kennzahlBaustein(f: FramingArt, stark: boolean, d: Extract<VorgangDaten, { typ: "kennzahl" }>, k: TextKontext, w: number): Baustein {
  const delta = d.wert - d.vorher;
  const betrag = Math.abs(delta);
  if (d.kennzahl === "inflation") {
    const rate = prozent(d.wert);
    if (delta < 0) {
      if (f === "regierungsnah")
        return b(pick([`Die Politik wirkt: Inflation fällt auf ${rate}`, `Inflation fällt auf ${rate} — der Kurs zahlt sich aus`], w), [
          `Die Teuerung geht um ${punkte(betrag)} zurück.`,
          startSatz(d.wert, d.start),
          zitat(k.finanz, ["Geduld und Kurs zahlen sich aus.", "Die Preisentwicklung gibt uns recht."], w),
        ]);
      if (f === "oppositionell")
        return b(
          pick(["Ein guter Monat — vorerst", "Die Rate sinkt, die Preise nicht"], w),
          [`Die Rate fällt um ${punkte(betrag)}. Das heißt: Die Preise steigen langsamer, nicht weniger. Wer ein festes Einkommen hat, spürt die Erleichterung erst, wenn die Löhne nachziehen.`],
          true,
        );
      return b(`Inflation sinkt auf ${rate}`, [
        `Die Preise steigen weiter, nur langsamer: Die Rate fiel um ${punkte(betrag)}${d.stand ? ` (Stand ${d.stand})` : ""}.${k.zahlen?.zins !== undefined ? ` Der Leitzins liegt bei ${prozent(k.zahlen.zins)}.` : ""}`,
        startSatz(d.wert, d.start),
      ]);
    }
    if (f === "regierungsnah")
      return stark
        ? b("Zahlen im normalen Rahmen", [`Monatliche Schwankungen gehören zur Lage; entscheidend sei der Trend über die Amtszeit. ${startSatz(d.wert, d.start)}`.trim()], true)
        : b("Gegenwind in den Zahlen", [`Die Regierung verweist auf äußere Einflüsse und bleibt gelassen. ${startSatz(d.wert, d.start)}`.trim(), zitat(k.finanz, ["Wir bleiben auf Kurs.", "Ein Monat ist kein Trend."], w)]);
    if (f === "oppositionell")
      return b(pick(["Die Statistik straft die Regierung", `Teuerung zieht an: ${rate}`], w), [
        `Das sind ${punkte(betrag)} mehr in einem Monat.${d.start !== undefined ? ` Bei Amtsantritt waren es ${prozent(d.start)}.` : ""}`,
        "Wer ein festes Einkommen hat, zahlt die Rechnung; an der Kasse hilft keine Methodendebatte.",
        zitat(k.opposition, ["Die Menschen merken es jeden Tag.", "Das ist keine Statistik, das ist der Wocheneinkauf."], w, 1),
      ]);
    return b(`Inflation steigt auf ${rate}`, [
      `Die Rate stieg um ${punkte(betrag)}${d.stand ? ` (Stand ${d.stand})` : ""}.${k.zahlen?.zins !== undefined ? ` Bei einem Leitzins von ${prozent(k.zahlen.zins)} beträgt der Realzins ${n1(k.zahlen.zins - d.wert)} Prozentpunkte.` : ""}`,
      startSatz(d.wert, d.start),
    ]);
  }

  if (d.kennzahl === "zins") {
    const hoch = delta > 0;
    const neu = prozent(d.wert);
    const real = k.zahlen?.inflation !== undefined ? ` Gemessen an der Inflation von ${prozent(k.zahlen.inflation)} beträgt der Realzins ${n1(d.wert - k.zahlen.inflation)} Prozentpunkte.` : "";
    if (f === "regierungsnah")
      return hoch
        ? b(
            "Zentralbank sichert die Preisstabilität",
            [
              `Die Anhebung um ${punkte(betrag)} trifft die Regierung nicht unvorbereitet; sie respektiert die Entscheidung der unabhängigen Zentralbank.`,
              zitat(k.finanz, ["Stabile Preise sind die Grundlage von allem.", "Der Weg zu stabilen Preisen ist richtig."], w),
            ],
            stark,
          )
        : b("Zinssenkung: Kredite werden billiger", [
            `Der Schritt um ${punkte(betrag)} entlastet Unternehmen und Haushalte, die Kredite bedienen.`,
            zitat(k.wirtschaft ?? k.finanz, ["Das schafft Luft für Investitionen.", "Das ist ein Signal an die Betriebe."], w),
          ]);
    if (f === "oppositionell")
      return hoch
        ? b("Teures Geld, teures Leben", [`Der Schritt um ${punkte(betrag)} macht Kredite teurer, für Hausbauer wie für Händler. Gezahlt wird am Monatsende, nicht in der Zentralbank.`])
        : b("Zinssenkung — zu spät?", [`Wer in den Monaten davor einen Kredit aufnehmen musste, hat zum höheren Satz von ${prozent(d.vorher)} bezahlt.`], true);
    return b(hoch ? `Zentralbank hebt den Leitzins auf ${neu}` : `Zentralbank senkt den Leitzins auf ${neu}`, [
      `Der Geldpolitische Ausschuss bewegt den Satz um ${punkte(betrag)}.${real}`,
      hoch ? "Höhere Zinsen dämpfen Kredite und Nachfrage und sollen die Lira stützen; sie belasten Schuldner." : "Niedrigere Zinsen entlasten Schuldner, können aber die Lira schwächen.",
    ]);
  }

  // Lira
  const pct = d.vorher !== 0 ? (delta / d.vorher) * 100 : 0;
  const kurs = `${n1(d.wert)} Lira`;
  if (delta > 0) {
    if (f === "regierungsnah")
      return stark
        ? b("Kursschwankung ohne Grund zur Sorge", ["Die Zentralbank beobachtet den Markt; ein Monat sei kein Maßstab."], true)
        : b("Lira unter Druck", ["Die Regierung verweist auf die Rolle internationaler Märkte.", zitat(k.finanz, ["Die Fundamentaldaten tragen die Lira.", "Wir lassen uns von Kurzfristigem nicht treiben."], w)]);
    if (f === "oppositionell")
      return b("Lira verliert, Preise steigen", [
        "Ein schwächerer Wechselkurs verteuert alles, was importiert wird — Energie, Rohstoffe, Medikamente.",
        zitat(k.opposition, ["Jeder Kurssprung kommt an der Ladenkasse an.", "Die Lira zahlt für die Fehler der Regierung."], w),
      ]);
    return b(`Lira gibt nach: ${kurs} je Dollar`, [
      `Der Dollar wird um ${n1(Math.abs(pct))} Prozent teurer; Importe und Energie verteuern sich damit.`,
      k.zahlen?.zins !== undefined ? `Der Leitzins liegt bei ${prozent(k.zahlen.zins)}.` : "",
    ]);
  }
  if (f === "regierungsnah") return b("Lira erholt sich", ["Importe werden günstiger.", zitat(k.finanz, ["Das Vertrauen kehrt zurück.", "Der Markt belohnt den Kurs."], w)]);
  if (f === "oppositionell") return b("Atempause an den Märkten", [`Eine Erholung um ${n1(Math.abs(pct))} Prozent macht verlorenes Vertrauen noch nicht wett.`], true);
  return b(`Lira erholt sich: ${kurs} je Dollar`, [`Der Dollar wird um ${n1(Math.abs(pct))} Prozent billiger; das dämpft die Importpreise mit Verzögerung.`]);
}

// ---------------------------------------------------------------------------
// Wirtschaft im Überblick

/** Die Lage in Zahlen in der Reihenfolge der Lesart: Regierungsnah beginnt mit dem Besten, Oppositionelle mit dem Schlechtesten. */
function ueberblickBaustein(f: FramingArt, d: Extract<VorgangDaten, { typ: "ueberblick" }>, w: number): Baustein {
  const feste = ["inflation", "arbeit", "wachstum", "zins", "lira"] as const;
  const zahlen = feste.map((id) => d.zahlen.find((z) => z.id === id)).filter((z): z is KennzahlDaten => z !== undefined);
  const nachGuete = [...zahlen].sort((a, c) => kzBewertung(c) - kzBewertung(a));
  const reihenfolge = f === "regierungsnah" ? nachGuete : f === "oppositionell" ? [...nachGuete].reverse() : zahlen;
  const posten = (z: KennzahlDaten): string => (z.id === "lira" ? `Dollar ${n1(z.wert)} Lira` : `${KZ_NAME[z.id].kurz} ${prozent(z.wert)}`);
  const zeile = `${reihenfolge.map(posten).join(", ")}.`;
  const besser = nachGuete.filter((z) => kzBewertung(z) > 0.05);
  const schlechter = [...nachGuete].reverse().filter((z) => kzBewertung(z) < -0.05);
  const liste = (zs: KennzahlDaten[]) => zs.map(kzBewegung).join(", ");
  const bewegung = (kopf: string, zs: KennzahlDaten[]) => (zs.length ? `${kopf}: ${liste(zs)}.` : "");
  const beste = besser[0];
  const schlimmste = schlechter[0];

  if (f === "regierungsnah") {
    if (beste) return eigen(b(`Wirtschaft in Zahlen: ${kzTitel(beste)}`, [`Die Lage in Zahlen: ${zeile}`, bewegung("Besser als im Vormonat", besser), schlechter.length ? bewegung("Gegenläufig", schlechter) : ""]));
    return eigen(b("Wirtschaft: Die Grundlinien stimmen", [`Die Lage in Zahlen: ${zeile}`, bewegung("Gegenüber dem Vormonat", schlechter), "Die Regierung verweist auf den Trend über die gesamte Amtszeit."], true));
  }
  if (f === "oppositionell") {
    if (schlimmste)
      return eigen(b(pick([`Wirtschaft in Zahlen: ${kzTitel(schlimmste)}`, `Die Rechnung des Monats: ${kzTitel(schlimmste)}`], w), [`Die Lage in Zahlen: ${zeile}`, bewegung("Schlechter als im Vormonat", schlechter), besser.length ? bewegung("Dagegen besser", besser) : ""]));
    return eigen(b("Wirtschaft: Stabilität auf hohem Preisniveau", [`Die Lage in Zahlen: ${zeile}`, bewegung("Gegenüber dem Vormonat", besser), "Das Preisniveau bleibt, wo es ist."], true));
  }
  const alle = zahlen.filter((z) => !unveraendert(z));
  return eigen(b("Die Wirtschaft im Überblick", [`Die Lage in Zahlen: ${zeile}`, alle.length ? bewegung("Veränderung zum Vormonat", alle) : "Gegenüber dem Vormonat hat sich keine der Kennzahlen merklich bewegt."]));
}

// ---------------------------------------------------------------------------
// Lage im Land: akute Probleme

function lageBaustein(f: FramingArt, stark: boolean, d: Extract<VorgangDaten, { typ: "lage" }>, k: TextKontext, w: number): Baustein {
  const p = d.fokus;
  const vormonat = p.vorher === undefined ? "" : ` (Vormonat: ${p.vorher})`;
  const weitere = d.weitere.map((x) => `${x.name} (${provinzen(x.provinzen)})`);
  if (f === "regierungsnah") {
    const b0 = d.gebessert[0];
    if (b0)
      return eigen(
        b(pick([`Besserung: ${b0.name} in weniger Provinzen akut`, `${b0.name}: Lage entspannt sich`], w), [
          `${b0.name} ist nur noch in ${provinzen(b0.provinzen)} akut${b0.vorher !== undefined ? `, im Vormonat waren es ${b0.vorher}` : ""}.`,
          zitat(k.inneres, ["Die Arbeit vor Ort zeigt Wirkung.", "Wir bleiben dran, bis alle Provinzen aufgeholt haben."], w),
        ]),
      );
    return eigen(
      b(
        stark ? "Regionale Engpässe" : `${p.name}: Regierung nimmt die Lage ernst`,
        [
          `${p.name} ist in ${provinzen(p.provinzen)} akut, am stärksten in ${p.schlimmste}; die Provinzbehörden sind eingebunden.`,
          zitat(k.inneres, ["Wir nehmen die Lage ernst.", "Wir lassen niemanden allein."], w),
        ],
        stark,
      ),
    );
  }
  if (f === "oppositionell") {
    const trend =
      p.vorher === undefined
        ? ""
        : p.provinzen > p.vorher
          ? `Seit dem Vormonat (${provinzen(p.vorher)}) hat sich die Lage verschärft.`
          : p.provinzen < p.vorher
            ? `Seit dem Vormonat (${provinzen(p.vorher)}) hat sie sich etwas entspannt — gelöst ist nichts.`
            : "Im Vormonat waren es ebenso viele: Es hat sich nichts bewegt.";
    return eigen(
      b(`${p.name}: ${provinzen(p.provinzen)} betroffen, ${anteilText(p.anteil)}`, [
        `Am schwersten trifft es ${p.schlimmste}. ${trend} Die Regierung hat das Problem nicht gelöst — sie verwaltet es.`.replace(/\s+/g, " "),
        weitere.length ? `Daneben bleiben akut: ${weitere.join(", ")}.` : "",
        zitat(k.opposition, ["Die Menschen vor Ort warten seit Monaten.", "Das ist keine Randnotiz, das ist Alltag."], w),
      ]),
    );
  }
  return eigen(
    b(`${p.name}: akut in ${provinzen(p.provinzen)}`, [
      `Betroffen sind ${provinzen(p.provinzen)} mit ${anteilText(p.anteil)}, am stärksten ${p.schlimmste}${vormonat}.`,
      weitere.length ? `Weitere akute Probleme: ${weitere.join(", ")}.` : "",
      d.gebessert.length ? `Gebessert hat sich: ${d.gebessert.map((x) => `${x.name} (${provinzen(x.provinzen)}, zuvor ${x.vorher})`).join(", ")}.` : "",
    ]),
  );
}

// ---------------------------------------------------------------------------
// Wirkungsberichte

/** Die Veränderungen eines Berichts als lesbare Satzteile, die deutlichste zuerst. */
export function berichtZeilen(d: Extract<VorgangDaten, { typ: "bericht" }>): string[] {
  const out: string[] = [];
  for (const z of d.veraenderungen) {
    const dl = z.auf - z.von;
    if (Math.abs(dl) < 0.05) out.push(`${z.name} unverändert bei ${n1(z.auf)}`);
    else out.push(`${z.name} ${dl > 0 ? "stieg" : "sank"} von ${n1(z.von)} auf ${n1(z.auf)}`);
  }
  for (const z of d.akut) {
    if (z.auf === z.von) out.push(`${z.name}: weiter akut in ${provinzen(z.auf)}`);
    else out.push(`${z.name}: akut in ${provinzen(z.auf)} statt ${z.von}`);
  }
  return out;
}

function berichtBaustein(f: FramingArt, d: Extract<VorgangDaten, { typ: "bericht" }>, k: TextKontext, w: number): Baustein {
  const zeilen = berichtZeilen(d);
  const monate = `${d.monate} Monate`;
  const kern = zeilen[0] ?? "";
  const rest = d.rest !== undefined ? `Die volle Wirkung braucht noch etwa ${d.rest} ${d.rest === 1 ? "Monat" : "Monate"}.` : "";
  if (f === "regierungsnah") {
    if (d.urteil === "gut")
      return b(pick([`Wirkung belegt: ${d.name}`, `Amtlich bestätigt: ${d.name} wirkt`], w), [
        `Die Prüfung bestätigt es: ${kern}.`,
        zeilen[1] ? `Außerdem: ${zeilen.slice(1, 3).join("; ")}.` : "",
        rest,
        zitat(k.inneres ?? k.finanz, ["Entscheidungen müssen messbar wirken, und diese tut es.", "So sieht erfolgreiche Politik aus."], w),
      ]);
    return b(`Wirkungsprüfung: ${d.name} braucht Zeit`, [rest || `${monate} nach dem Beschluss ist die volle Wirkung noch nicht erreicht.`, "Die Regierung verweist auf die Umsetzungsdauer."], true);
  }
  if (f === "oppositionell") {
    if (d.urteil === "gut") return b(`Erfolg auf dem Papier: ${d.name}`, ["Die Zahlen sehen gut aus. Ob sie im Alltag der Betroffenen ankommen, zeigt eine Prüfung der Regierung nicht."], true);
    return b(pick([`${d.name}: ${monate} danach kaum etwas zu sehen`, `Viel versprochen, wenig bewegt: ${d.name}`], w), [
      kern ? `Die Prüfung zeigt: ${zeilen.slice(0, 2).join("; ")}.` : "",
      d.urteil === "keine" ? "Die Zahlen bewegen sich nicht in die gewünschte Richtung." : "Von einer spürbaren Wirkung kann bislang keine Rede sein.",
      zitat(k.opposition, ["Wer Wirkung verspricht, muss sie liefern.", "Beschlüsse sind noch keine Politik."], w),
    ]);
  }
  const urteilText =
    d.urteil === "gut"
      ? "Die Zahlen bewegen sich in die gewünschte Richtung."
      : d.urteil === "gemischt"
        ? "Es wirkt, aber anderes hat sich verschlechtert."
        : d.urteil === "schwach"
          ? "Bisher ist kaum etwas zu sehen."
          : "Die Zahlen bewegen sich nicht in die gewünschte Richtung.";
  return b(`Wirkungsprüfung ${d.name}: ${d.urteil === "gut" ? "wirkt" : d.urteil === "gemischt" ? "gemischte Bilanz" : d.urteil === "schwach" ? "kaum Wirkung" : "keine Wirkung"}`, [
    `Gemessen wurde: ${zeilen.slice(0, 4).join("; ") || "keine nennenswerte Veränderung"}.`,
    [urteilText, rest].filter(Boolean).join(" "),
    "Die Zahlen zeigen die Veränderung insgesamt, nicht nur die dieser Maßnahme; im Politiknetz wirkt vieles zugleich.",
  ]);
}

// ---------------------------------------------------------------------------
// Parlament

function gesetzBaustein(f: FramingArt, d: Extract<VorgangDaten, { typ: "gesetz" }>, k: TextKontext, w: number): Baustein {
  const mehrheit = k.mehrheit
    ? `Das Regierungslager hält ${k.mehrheit.lager} von 600 Sitzen${k.mehrheit.duldung > 0 ? `, dazu kommen ${k.mehrheit.duldung} geduldete` : ""}; die Mehrheit liegt bei ${k.mehrheit.noetig}.`
    : "";
  if (d.ja) {
    if (f === "regierungsnah")
      return b(`Parlament beschließt: ${d.name}`, ["Die Regierung wertet den Beschluss als Beleg ihrer Handlungsfähigkeit.", zitat(k.inneres ?? k.finanz, ["Das ist ein guter Tag für das Land.", "Das Parlament hat Verantwortung gezeigt."], w)]);
    if (f === "oppositionell")
      return b(`„${d.name}“ durchgewunken`, ["Debatte? Fehlanzeige. Die Folgen werden alle noch erfahren.", zitat(k.opposition, ["Hier wurde abgestimmt, nicht debattiert.", "Wir werden das Gesetz an seinen Folgen messen."], w)], true);
    return b(`Gesetz angenommen: ${d.name}`, [mehrheit, "Das Gesetz wirkt, sobald die Umsetzung anläuft; wie lange das dauert, hängt von der Maßnahme ab."]);
  }
  if (f === "regierungsnah") return b(`Abstimmung vertagt: ${d.name}`, ["Inhaltlich notwendig, taktisch verschoben — so liest die Regierung das Votum."], true);
  if (f === "oppositionell") return b(`Schlappe im Parlament: „${d.name}“ scheitert`, ["Selbst die eigene Mehrheit trägt das nicht mehr mit.", mehrheit, zitat(k.opposition, ["Die Regierung hat ihre Mehrheit nicht im Griff.", "Das war absehbar."], w)]);
  return b(`Gesetz gescheitert: ${d.name}`, [mehrheit, "Die Stimmen reichten nicht; die Frage bleibt auf der Tagesordnung."]);
}

// ---------------------------------------------------------------------------
// Programme

function programmBaustein(f: FramingArt, d: Extract<VorgangDaten, { typ: "programm" }>, k: TextKontext, w: number): Baustein {
  const wort = d.erfuellt ? "Programm erfüllt" : "Schritt erreicht";
  if (f === "regierungsnah")
    return b(`${d.erfuellt ? "Versprechen gehalten" : "Plan erfüllt"}: ${d.schritt}`, [zitat(k.inneres ?? k.wirtschaft ?? k.finanz, ["Schritt für Schritt wird aus dem Versprechen die Wirklichkeit.", "Was wir zugesagt haben, setzen wir um."], w)]);
  if (f === "oppositionell") return b(`Erfolg auf dem Papier: ${d.schritt}`, ["Ob die Bilanz im Alltag ankommt, entscheidet sich nicht auf dem Regierungsflugblatt."], true);
  return b(`${wort}: ${d.schritt}`, []);
}

// ---------------------------------------------------------------------------
// Umfrage

function umfrageBaustein(f: FramingArt, d: Extract<VorgangDaten, { typ: "umfrage" }>, k: TextKontext, w: number): Baustein {
  const spanne = d.stichprobe && d.stichprobe > 0 ? Math.round(196 * Math.sqrt(((d.wert / 100) * (1 - d.wert / 100)) / d.stichprobe) * 10) / 10 : undefined;
  const fehler =
    spanne !== undefined
      ? `Bei ${d.stichprobe!.toLocaleString("de-DE")} Befragten liegt die statistische Schwankungsbreite bei etwa ±${n1(spanne)} Punkten.`
      : "Die Stichprobe legt das Institut nicht offen; die Schwankungsbreite lässt sich nicht beziffern.";
  const delta = d.delta;
  if (f === "regierungsnah")
    return delta !== undefined && delta < -1
      ? b("Umfrage: Momentaufnahme, kein Trend", [`Ein einzelner Wert, heißt es aus dem Lager, sei noch kein Trend; ${punkte(delta)} weniger seien kein Beleg für eine Wende.`], true)
      : b(pick(["Umfrage: Regierung stabil", `Umfrage: ${prozent(d.wert)} Zustimmung`], w), ["Das Volk weiß, wen es hat.", zitat(k.inneres ?? k.finanz, ["Die Menschen vertrauen auf Stabilität.", "Das ist ein Vertrauensbeweis."], w)]);
  if (f === "oppositionell")
    return b(delta !== undefined && delta < 0 ? `Zustimmung sinkt auf ${prozent(d.wert)}` : "Eine Umfrage ist keine Wahl", [
      delta !== undefined && delta < 0 ? `Gegenüber dem Vormonat verliert die Regierung ${punkte(delta)}.` : "Wer sich auf freundliche Zahlen verlässt, vergisst, wer sie bestellt hat.",
      fehler,
    ]);
  return b("Die Erhebung des Monats", [
    fehler,
    delta !== undefined && Math.abs(delta) >= 0.05 ? `Veränderung zum Vormonat: ${delta > 0 ? "+" : "−"}${n1(Math.abs(delta))} Punkte; ob sie über die Schwankungsbreite hinausgeht, bleibt offen.` : "",
  ]);
}

// ---------------------------------------------------------------------------
// Ausland

function auslandBaustein(f: FramingArt, d: Extract<VorgangDaten, { typ: "ausland" }>, k: TextKontext, w: number): Baustein {
  const p = d.punkt;
  switch (p.art) {
    case "spannung": {
      const wert = `${n0(p.wert)} von 100`;
      const verlauf = p.vorher === undefined ? "" : p.wert === p.vorher ? ", unverändert zum Vormonat" : `, im Vormonat ${n0(p.vorher)}`;
      if (f === "regierungsnah")
        return eigen(
          b(
            `Ankara bleibt im Gespräch mit ${p.land}`,
            [`Der Konfliktwert gegenüber ${p.dat} liegt bei ${wert}${verlauf}; im Außenministerium gilt die Lage als beherrschbar.`, zitat(k.aussen, ["Diplomatie ist der Weg.", "Wir sprechen mit allen Seiten."], w)],
            true,
          ),
        );
      if (f === "oppositionell")
        return eigen(
          b(`Spannungen mit ${p.land}: ${wert}`, [
            `Der Konfliktwert gegenüber ${p.dat} steht bei ${wert}${verlauf}. Die Regierung hat kein erkennbares Konzept, ihn zu senken.`,
            zitat(k.opposition, ["Außenpolitik ist keine Pressemitteilung.", "Die Menschen an der Grenze zahlen den Preis."], w),
          ]),
        );
      return eigen(b(`Spannungen mit ${p.land}: Konfliktwert ${n0(p.wert)}`, [`Der Konfliktwert gegenüber ${p.dat} liegt bei ${wert}${verlauf}.`, "Ab hohen Werten wächst das Risiko, dass aus Spannungen ein Konfliktvorgang wird."]));
    }
    case "krieg": {
      const lage = `Der Konflikt mit ${p.dat} steht seit ${p.tage} ${p.tage === 1 ? "Tag" : "Tagen"} in der Phase „${p.phase}“; die Eskalation liegt bei ${n0(p.eskalation)} von 100.`;
      return eigen(
        b(f === "regierungsnah" ? `Ankara handelt im Konflikt mit ${p.land}` : `Konflikt mit ${p.land}: Phase „${p.phase}“`, [
          lage,
          f === "regierungsnah"
            ? zitat(k.aussen, ["Wir handeln besonnen und entschlossen zugleich.", "Das Land steht zusammen."], w)
            : f === "oppositionell"
              ? zitat(k.opposition, ["Wer hier führt, trägt die Verantwortung.", "Das Parlament muss einbezogen werden."], w)
              : "",
        ]),
      );
    }
    case "vermittlung": {
      const lage = `Die Intensität des Konflikts liegt bei ${n0(p.konflikt)} von 100${p.konfliktVorher !== undefined ? ` (Vormonat ${n0(p.konfliktVorher)})` : ""}; der Reifegrad für Verhandlungen steht bei ${n0(p.reif)} von 100.`;
      return eigen(
        b(
          `Vermittlung: ${p.titel}`,
          [
            lage,
            f === "regierungsnah"
              ? "Ankara sieht sich als Vermittler, der Parteien an einen Tisch bringt."
              : f === "oppositionell"
                ? "Ob die Vermittlung mehr ist als Prestige, muss sich zeigen."
                : "Ein Abkommen wird wahrscheinlicher, wenn der Reifegrad steigt; er steigt, wenn ein Patt beiden Seiten mehr schadet als ein Kompromiss.",
          ],
          f === "oppositionell",
        ),
      );
    }
    case "eu":
      return eigen(
        b(f === "oppositionell" ? "EU-Beitritt: Bewegung nur auf dem Papier?" : f === "regierungsnah" ? "EU-Beitritt kommt voran" : `EU-Beitritt: Phase „${p.phase}“`, [
          `Im EU-Beitrittsvorgang (Phase „${p.phase}“) sind ${p.abgeschlossen} von ${p.gesamt} Kapiteln vorläufig abgeschlossen, ${p.offen} laufen.`,
          f === "neutral" ? "Jedes Kapitel braucht den Konsens der Mitgliedstaaten; ein Veto kann den Fortschritt anhalten." : "",
        ]),
      );
  }
}

// ---------------------------------------------------------------------------
// Chronik: Ereignisse, Skandale und alles andere

function ereignisBaustein(f: FramingArt, v: ZeitungVorgang, k: TextKontext, w: number): Baustein {
  const t = v.titel;
  if (f === "regierungsnah")
    return v.wertung < -0.4
      ? b(`Lage im Griff: ${t}`, ["Voreilige Schritte wären das falsche Signal; die Regierung handelt besonnen.", zitat(k.inneres, ["Wir haben die Lage im Blick.", "Besonnenheit ist jetzt gefragt."], w)], true)
      : b(pick([`Regierung handelt: ${t}`, t], w), ["Besonnen und zum Wohl der Betroffenen — so geht Krisenpolitik.", zitat(k.inneres ?? k.wirtschaft, ["Wir übernehmen Verantwortung.", "Die Betroffenen können sich auf uns verlassen."], w)]);
  if (f === "oppositionell")
    return b(pick([`${t}: Und niemand übernimmt die Verantwortung`, `${t} — die Regierung verwaltet`], w), [
      "Die Betroffenen warten, die Regierung verwaltet. Das ist das Muster.",
      zitat(k.opposition, ["Wer entscheidet, soll auch geradestehen.", "Die Menschen brauchen Antworten, keine Statements."], w),
    ]);
  return b(t, []);
}

// ---------------------------------------------------------------------------
// Das Hauptwerk: ein Baustein je Vorgang und Lesart

/**
 * Die Texte für einen Vorgang in der Lesart eines Blattes. `staerke` ist die Framing-Stärke (≥ 0,75: der Dreh ist
 * extrem), `w` die deterministische Wahl der Variante (0 bis 1).
 */
export function baustein(f: FramingArt, staerke: number, v: ZeitungVorgang, k: TextKontext, w: number): Baustein {
  const stark = staerke >= 0.75;
  const d = v.daten;
  if (d) {
    switch (d.typ) {
      case "kennzahl":
        return kennzahlBaustein(f, stark, d, k, w);
      case "ueberblick":
        return ueberblickBaustein(f, d, w);
      case "lage":
        return lageBaustein(f, stark, d, k, w);
      case "bericht":
        return berichtBaustein(f, d, k, w);
      case "gesetz":
        return gesetzBaustein(f, d, k, w);
      case "programm":
        return programmBaustein(f, d, k, w);
      case "umfrage":
        return umfrageBaustein(f, d, k, w);
      case "ausland":
        return auslandBaustein(f, d, k, w);
      case "eil":
        break; // der Eil-Zusatz ändert nur die Neutral-Lesart (unten), sonst gilt die Vorgangsart
    }
  }
  const eil = d?.typ === "eil" ? d : undefined;
  const mehrheit = k.mehrheit ? `Dem Lager bleiben ${k.mehrheit.lager} von 600 Sitzen${k.mehrheit.duldung > 0 ? `, dazu ${k.mehrheit.duldung} geduldete` : ""}; für Gesetze braucht es ${k.mehrheit.noetig} Stimmen.` : "";
  const lage = k.zahlen
    ? [
        k.zahlen.zins !== undefined ? `Leitzins ${prozent(k.zahlen.zins)}` : "",
        k.zahlen.inflation !== undefined ? `Inflation ${prozent(k.zahlen.inflation)}` : "",
        k.zahlen.lira !== undefined ? `Dollar bei ${n1(k.zahlen.lira)} Lira` : "",
      ].filter(Boolean)
    : [];
  const eilNeutral = (offenFallback: string): string[] =>
    eil ? [eil.feststeht.length ? `Gesichert: ${eil.feststeht.join(" ")}` : "", eil.offen.length ? `Offen: ${eil.offen.join(" ")}` : offenFallback] : [];

  switch (v.art) {
    case "wahlsieg":
      if (f === "regierungsnah")
        return b(stark ? `Triumph der Vernunft: ${k.name} wiedergewählt` : `${k.name} wiedergewählt`, ["Die Wähler belohnen einen Kurs, von dem dieses Blatt immer überzeugt war. Fünf weitere Jahre Stabilität — das Land kann durchatmen."]);
      if (f === "oppositionell") return b(`Weiter wie bisher: ${k.name} wiedergewählt`, ["Die andere Hälfte des Landes wollte etwas anderes. Fünf Jahre sind eine lange Zeit — man wird sich an alles erinnern."], true);
      return b(`${k.name} wiedergewählt`, ["Die zweite Amtszeit ist nach der Verfassung die letzte. Die Wahlbehörde meldete keine nennenswerten Zwischenfälle.", mehrheit]);

    case "bruch":
      if (f === "regierungsnah")
        return stark
          ? b("Parteitaktik in Ankara", ["Die Regierung arbeitet ungerührt weiter. Mehrheiten kommen und gehen; der Kurs bleibt."], true)
          : b("Partner verlässt das Lager", ["Man bedauert den Schritt, erinnert an gemeinsame Erfolge — und verweist auf die Tagesordnung."]);
      if (f === "oppositionell")
        return b("Das Lager bröckelt", [
          "Wer aussteigt, kennt die Bilanz von innen. Die Frage ist nicht mehr, ob dieses Bündnis trägt, sondern wie lange noch.",
          mehrheit,
          zitat(k.opposition, ["Die Regierung hat ihre Mehrheit verspielt.", "Ein Bündnis ohne Vertrauen trägt nicht."], w),
        ]);
      return b("Bruch im Regierungslager", ["Für Gesetze wird nun jede Stimme zur Verhandlungssache; die Fraktionen sortieren sich neu.", mehrheit, ...eilNeutral("")]);

    case "krise":
      if (v.krieg) {
        if (f === "regierungsnah")
          return b("Das Land steht zusammen", ["In Stunden wie diesen zählt Einigkeit. Die Regierung handelt besonnen und entschlossen zugleich.", zitat(k.aussen, ["Wir handeln besonnen und entschlossen zugleich.", "Diplomatie und Stärke gehören zusammen."], w)]);
        if (f === "oppositionell")
          return b("Kriegsgefahr — eskaliert, um abzulenken?", ["Wer zu Hause verliert, sucht den Konflikt draußen. Die Rechnung zahlen später andere.", zitat(k.opposition, ["Das Parlament muss einbezogen werden.", "Kein Abenteuer auf Kosten des Landes."], w)]);
        return b("Kriegsgefahr: der Stand", eilNeutral("Offen ist, ob Verhandlungen zustande kommen; das hängt vom Vertrauen der Gegenseite und vom Verlauf der nächsten Wochen ab."));
      }
      if (f === "regierungsnah")
        return stark
          ? b(pick(["Spekulation gegen das Land", "Spekulation gegen das Land: Ankara bleibt gelassen"], w), ["Ankara bleibt ruhig: Angriffe auf die Wirtschaft sind zum Scheitern verurteilt. Mehr muss dazu nicht gesagt werden."], true)
          : b("Turbulenzen in der Lage", ["Die Regierung beobachtet die Entwicklung; Fachleute erwarten eine Beruhigung.", zitat(k.finanz ?? k.inneres, ["Wir beobachten die Lage genau.", "Es gibt keinen Grund zur Panik."], w)]);
      if (f === "oppositionell")
        return b(pick(["Die Krise hat eine Adresse", "Die Krise hat eine Adresse — und eine Vorgeschichte"], w), [
          "Jeder Einkauf widerlegt die Beschwichtigungen aus dem Palast. Wer die Lage herbeiregiert hat, nennt sie nun Schicksal.",
          zitat(k.opposition, ["Das war keine Naturgewalt, das war Politik.", "Die Regierung kann sich nicht herausreden."], w),
        ]);
      return b("Krise bestätigt: Was feststeht", [...eilNeutral(""), lage.length ? `Zum Vergleich der Lage: ${lage.join(", ")}.` : ""]);

    case "fertigstellung":
      if (f === "regierungsnah") return b(stark ? "Vollendung: Geschichte geschrieben" : "Vorhaben vollendet", ["Was andere ankündigen, vollendet diese Regierung. Das Land wächst an solchen Tagen."]);
      if (f === "oppositionell") return b("Eröffnet — die Rechnung kommt später", ["Prestige hat einen Preis, der nicht auf dem Einweihungsband steht. Den Unterhalt zahlt, Überraschung, der Steuerzahler."], true);
      return b("Vorhaben fertiggestellt", []);

    case "skandal":
      if (f === "regierungsnah") return b("Ruhmlose Rache eines Gescheiterten", ["Wer scheitert, dichtet. Die Vorwürfe entbehren jeder Grundlage; wir drucken sie der Vollständigkeit halber."], true);
      if (f === "oppositionell")
        return b("Er packt aus: das System hinter den Türen", [
          "Endlich sagt es einer von innen. Jede Zeile bestätigt, was dieses Blatt seit Jahren schreibt.",
          zitat(k.opposition, ["Das muss aufgeklärt werden, restlos.", "Das Parlament braucht einen Untersuchungsausschuss."], w),
        ]);
      return b("Schwere Vorwürfe aus den eigenen Reihen", ["Die Anschuldigungen sind bislang nicht belegt; die Regierung weist sie zurück."]);

    case "ereignis":
      return ereignisBaustein(f, v, k, w);

    // Arten ohne `daten` (ältere Spielstände): einfache Lesarten
    case "programm":
      if (f === "regierungsnah") return b("Plan erfüllt", ["Schritt für Schritt wird aus dem Versprechen von damals die Wirklichkeit von heute."]);
      if (f === "oppositionell") return b("Erfolg auf dem Papier", ["Ob die Bilanz im Alltag ankommt, entscheidet sich nicht auf dem Regierungsflugblatt."], true);
      return b("Programm-Fortschritt", []);
    case "gesetz":
      return gesetzBaustein(f, { typ: "gesetz", name: v.titel, ja: v.wertung >= 0 }, k, w);
    case "wirtschaft":
      if (v.wertung >= 0)
        return f === "regierungsnah"
          ? b("Die Politik wirkt", ["Geduld und Kurs zahlen sich aus — die Zahlen belegen es."])
          : f === "oppositionell"
            ? b("Ein guter Monat — vorerst", ["Ein Monat macht noch keine Wende."], true)
            : b("Erholung in den Daten", []);
      return f === "regierungsnah"
        ? b(stark ? "Zahlen im normalen Rahmen" : "Gegenwind in den Zahlen", ["Schwankungen gehören zur Lage; der Trend stimme."], stark)
        : f === "oppositionell"
          ? b("Die Statistik straft die Regierung", ["Man kann an der Methode feilschen, nicht am Gefühl im Portemonnaie."])
          : b("Verschlechterung in den Daten", []);
    case "umfrage":
      return umfrageBaustein(f, { typ: "umfrage", institut: v.titel, wert: 0 }, k, w);
    case "bericht":
    case "lage":
    case "ausland":
    case "ueberblick":
      return b(v.titel, []);
  }
}

// ---------------------------------------------------------------------------
// Kommentar

export interface KommentarEingabe {
  /** Stimmung des Monats: positiv = gut für die Regierung */
  stimmung: number;
  /** Titel des für diese Lesart wichtigsten Vorgangs des Monats */
  thema?: string;
  zahlen: KennzahlDaten[];
  kontext: TextKontext;
}

/** Der Leitkommentar eines Blattes: bewertet die Lage des Monats, nennt Zahlen und eine Gegenposition. */
export function kommentarFuer(f: FramingArt, e: KommentarEingabe, w: number): { titel: string; text: string[] } {
  const nachGuete = [...e.zahlen].filter((z) => z.vorher !== undefined && !unveraendert(z)).sort((a, c) => kzBewertung(c) - kzBewertung(a));
  const fav = nachGuete.find((z) => kzBewertung(z) > 0.05);
  const uebel = [...nachGuete].reverse().find((z) => kzBewertung(z) < -0.05);
  const niveau = e.zahlen.find((z) => z.id === "inflation") ?? e.zahlen[0];
  const gut = e.stimmung > 0.15;
  const schlecht = e.stimmung < -0.15;
  // Ein Blatt kommentiert nur, was es selbst gedruckt hat; ohne Thema bleibt der Satz allgemein
  const thema = e.thema ? `„${e.thema}“` : undefined;

  if (f === "regierungsnah") {
    const favSatz = fav ? `Dass ${kzNeben(fav)}, spricht für den Kurs.` : niveau ? `${gross(kzSatz(niveau))}.` : "";
    const uebelSatz = uebel ? `Dass ${kzNeben(uebel)}, nimmt dieses Blatt ernst — aber ein einzelner Monat ändert den Kurs nicht.` : "";
    if (gut) return { titel: "Kurs halten", text: [thema ? `Es gibt Monate, in denen die Zahlen für sich sprechen. Dieser gehört dazu: ${thema} zeigt es.` : "Es gibt Monate, in denen die Zahlen für sich sprechen. Dieser gehört dazu.", favSatz, "Wer jetzt bremst, verspielt, was erreicht ist."].filter(Boolean) };
    if (schlecht)
      return { titel: "Kurs halten", text: [thema ? `${thema} ist ernst, und niemand sollte es kleinreden. Doch die Grundlinien tragen weiter.` : "Der Monat war nicht leicht, und niemand sollte das kleinreden. Doch die Grundlinien tragen weiter.", favSatz, uebelSatz].filter(Boolean) };
    return { titel: "Kurs halten", text: [pick(["Nicht jede Meldung dieses Monats ist erfreulich, aber das Bild bleibt klar.", "Ein Monat mit Licht und Schatten — mehr Licht, als die Kritiker zugeben."], w), favSatz, uebelSatz].filter(Boolean) };
  }

  if (f === "oppositionell") {
    const favSatz = fav ? `Gern räumen wir ein, dass ${kzNeben(fav)}.` : "";
    const uebelAlltag = uebel ? `Dass ${kzNeben(uebel)}, spüren die Menschen jeden Tag.` : niveau ? `${gross(kzSatz(niveau))}, und das ist kein Grund zum Feiern.` : "";
    if (schlecht)
      return { titel: "Die Rechnung bleibt offen", text: [thema ? `${thema} ist kein Unfall, es ist Politik.` : "Dieser Monat war kein Betriebsunfall, er war die Folge von Entscheidungen.", uebelAlltag, "Die Frage bleibt, wer die Rechnung zahlt — und wer sie bestellt hat."].filter(Boolean) };
    if (gut)
      return { titel: "Prüfen, nicht feiern", text: [`Ein guter Monat. ${favSatz}`.trim(), "Prüfen wir, ob er hält — und ob er bei denen ankommt, die am wenigsten haben.", uebel ? `Dass ${kzNeben(uebel)}, gehört allerdings auch zur Wahrheit.` : ""].filter(Boolean) };
    return { titel: "Die Rechnung bleibt offen", text: [favSatz, uebel ? `Dass ${kzNeben(uebel)}, wiegt schwerer.` : "", "Ein Monat mit guten Zahlen ist noch keine Bilanz."].filter(Boolean) };
  }

  const einzel = fav ?? uebel;
  return {
    titel: "Einordnung",
    text: [
      fav && uebel ? `Der Monat in zwei Zahlen: ${gross(kzSatz(fav))}. Auf der anderen Seite: ${gross(kzSatz(uebel))}.` : "",
      einzel && !(fav && uebel) ? `Der Monat in einer Zahl: ${gross(kzSatz(einzel))}.` : "",
      !fav && !uebel && niveau ? `${gross(kzSatz(niveau))}.` : "",
      thema ? `Das Thema des Monats ist ${thema}; seine Folgen zeigen sich erst in den kommenden Zahlen.` : "Ob sich der Trend fortsetzt, zeigen erst die kommenden Monatswerte.",
    ].filter(Boolean),
  };
}

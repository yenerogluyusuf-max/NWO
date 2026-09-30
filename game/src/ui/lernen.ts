// Die Mentorin erklärt jede Größe des Politiknetzes: was sie ist, wo das Land steht, was sie treibt, was sie bewirkt
// und was der Spieler tun kann (Lernkonzept, Abschnitt 4). Alle Zahlen kommen aus dem Weltzustand; Texte erfinden nichts.

import { NET } from "../sim/modell";
import { nationalAverage, PROVINCES, startAverage } from "../sim/netz";
import { PROVINZEN } from "../sim/regional";
import { hebel, MAKRO_WEGE } from "../sim/wege";
import type { World } from "../sim/types";
import type { NodeSpec } from "../data/politiknetz";

const nf = (x: number, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });

export interface Verbindung {
  id: string;
  name: string;
  erhoeht: boolean;
  /** „sofort“ oder „nach 3 Monaten“ */
  wann: string;
  warum: string;
}

export interface Begriff {
  begriff: string;
  text: string;
}

export interface Erklaerung {
  /** Was ist das? */
  was: string[];
  /** Wo steht das Land? */
  stand: string[];
  /** Ausreißer nach Provinzen */
  orte?: { hoch: { name: string; wert: number }[]; tief: { name: string; wert: number }[] };
  wirkungen: Verbindung[];
  treiber: Verbindung[];
  hebel: { text: string; warum: string }[];
  hebelHinweis?: string;
  begriffe: Begriff[];
}

export function wann(lag: number): string {
  return lag === 0 ? "sofort" : lag === 1 ? "nach 1 Monat" : `nach ${lag} Monaten`;
}

const KIND_ERKLAERT: Record<NodeSpec["kind"], string> = {
  massnahme: "Eine Maßnahme ist ein Regler, den du beschließt: von Stufe 0 (gibt es nicht) bis 100 (so viel wie möglich).",
  groesse: "Eine Größe beschreibt einen Zustand des Landes. Sie ändert sich durch deine Maßnahmen, die Wirtschaft und andere Größen.",
  problem: "Ein Problem wird akut, wenn sein Wert in einer Provinz eine Schwelle erreicht. Dann belastet es das Vertrauen und die Wählergruppen dort.",
  gruppe: "Eine Wählergruppe zeigt, wie zufrieden ein Teil der Bevölkerung mit deiner Politik ist. Ihre Stimmung bestimmt deine Zustimmung und damit die nächste Wahl.",
};

const BEGRIFFE: Record<string, Begriff> = {
  index: { begriff: "Index von 0 bis 100", text: "Damit sich sehr verschiedene Dinge vergleichen lassen, rechnet das Spiel viele Größen als Zahl von 0 bis 100. Das ist kein Prozentwert, sondern eine Skala: höher heißt mehr von dem, was der Name sagt. „Mehr“ ist nicht immer besser: Mehr Armut ist schlecht, mehr Arbeitsplätze sind gut." },
  durchschnitt: { begriff: "Landesdurchschnitt", text: "Der Mittelwert der 81 Provinzen, gewichtet nach Einwohnern: Istanbul zählt mehr als Tunceli. Der Durchschnitt versteckt Unterschiede; die Karte zeigt, wo sie liegen." },
  verzoegerung: { begriff: "Verzögerung („nach 3 Monaten“)", text: "Politik wirkt nicht am selben Tag. „Nach 3 Monaten“ heißt: Erst drei Monate nach der Änderung kommt die Wirkung an. Deshalb sieht man das Ergebnis eines Beschlusses oft erst im nächsten Jahr. Gestrichelte Pfeile im Bild sind verzögert, durchgezogene wirken sofort." },
  akut: { begriff: "Akut", text: "Ein Problem ist in einer Provinz akut, sobald sein Wert dort die Schwelle erreicht. Es bleibt akut, bis es acht Punkte unter die Schwelle fällt; so flackern Probleme nicht an und aus." },
  traegheit: { begriff: "Trägheit", text: "Ohne neuen Anstoß kehren Größen langsam zu ihrem Ausgangswert zurück. Eine kurze Kampagne verpufft also, eine dauerhafte Politik bleibt." },
  umsetzung: { begriff: "Umsetzung", text: "Ein Beschluss ist noch keine Wirkung. Der Regler wandert über mehrere Monate auf die neue Stufe, und erst der umgesetzte Anteil wirkt." },
  realzins: { begriff: "Realzins", text: "Der Leitzins minus die erwartete Inflation. Er zeigt, was Sparen und Leihen wirklich kostet: Ist er hoch, lohnt Sparen mehr als Ausgeben." },
};

interface EingangInfo {
  was: string[];
  wichtig: string;
  stand: (w: World) => string[];
  begriffe?: string[];
}

/** Die Größen des Wirtschaftsmodells behalten ihre eigene Einheit; sie haben eigene Erklärungen. */
const EINGANG: Record<string, EingangInfo> = {
  inflation: {
    was: [
      "Die Inflation misst, wie stark die Preise gegenüber dem Vorjahr gestiegen sind. Bei 30 Prozent kostet, was vor einem Jahr 100 Lira kostete, heute 130 Lira.",
      "Du kannst sie nicht einstellen. Sie ergibt sich aus Zinsen, Nachfrage, Erwartungen der Menschen, Energiepreisen und der Lira.",
    ],
    wichtig: "Hohe Inflation frisst Löhne und Ersparnisse auf, macht Kredite teuer und untergräbt das Vertrauen. Sie sinkt, wenn Zinsen hoch bleiben, der Staat nicht zu viel ausgibt und die Menschen der Zentralbank glauben.",
    stand: (w) => [
      `Zuletzt veröffentlicht: ${nf(w.published.inflation.value)} Prozent (${w.published.inflation.period}). Das Zwischenziel der Zentralbank liegt bei ${nf(w.economy.inflationTarget)} Prozent, die Menschen erwarten ${nf(w.economy.expectedInflation)} Prozent.`,
      "Statistiken erscheinen mit Verzögerung: Du steuerst mit Blick in den Rückspiegel.",
    ],
    begriffe: ["realzins"],
  },
  arbeitslosigkeit: {
    was: [
      "Die Arbeitslosenquote ist der Anteil der Erwerbspersonen, die Arbeit suchen und keine finden.",
      "Sie folgt dem Wachstum mit Verzögerung: Erst wenn die Wirtschaft über Monate wächst, werden neue Leute eingestellt.",
    ],
    wichtig: "Arbeitslosigkeit kostet Einkommen, Sicherheit und Selbstvertrauen. Sie färbt die Stimmung der Beschäftigten, der Jungen und der Städter.",
    stand: (w) => [`Zuletzt veröffentlicht: ${nf(w.published.unemployment.value)} Prozent (${w.published.unemployment.period}). Im Modell pendelt sie langfristig um ${nf(9, 0)} Prozent (Platzhalter der Kalibrierung).`],
  },
  wachstum: {
    was: [
      "Das Wachstum ist die Veränderung der gesamten Wirtschaftsleistung (BIP) gegenüber dem Vorjahr.",
      "Im Politiknetz erscheint es als Index: 50 heißt, die Wirtschaft wächst genau in Höhe ihres Potenzials; darüber ist sie überhitzt, darunter lahmt sie.",
    ],
    wichtig: "Wachstum schafft Arbeit und Steuereinnahmen. Zu viel Wachstum auf Pump heizt die Inflation an.",
    stand: (w) => [`Zuletzt veröffentlicht: ${nf(w.published.growth.value)} Prozent (${w.published.growth.period}). Das Potenzialwachstum im Modell liegt bei ${nf(w.economy.potentialGrowth)} Prozent.`],
  },
  leitzins: {
    was: [
      "Der Leitzins ist der Zins, zu dem sich Banken bei der Zentralbank Geld leihen. Er wirkt auf alle Kredite und auf die Lira.",
      "Ihn legt der Geldpolitische Ausschuss der Zentralbank fest, nicht der Präsident. Ein Präsident, der eingreift, riskiert das Vertrauen der Märkte.",
    ],
    wichtig: "Ein hoher Zins bremst Nachfrage und Inflation und stützt die Lira, kostet aber Wachstum und Arbeitsplätze. Ein niedriger Zins tut das Gegenteil.",
    stand: (w) => [`Aktuell ${nf(w.economy.policyRate)} Prozent; der Realzins liegt bei ${nf(w.economy.policyRate - w.economy.expectedInflation)} Prozent.`],
    begriffe: ["realzins"],
  },
  abwertung: {
    was: [
      "Die Abwertung zeigt, wie viel mehr Lira man für einen US-Dollar zahlen muss als vor zwölf Monaten (in Prozent).",
      "Wer 26 Prozent mehr Lira zahlen muss, dessen Lira ist gegenüber dem Dollar nur rund 21 Prozent weniger wert: Ein Kurs, der um ein Viertel steigt, senkt den Wert der Gegenseite um ein Fünftel.",
    ],
    wichtig: "Eine schwache Lira verteuert Importe, vor allem Energie, und treibt die Inflation. Exporteure und der Tourismus profitieren, wer Schulden in Dollar hat, verliert.",
    stand: (w) => {
      const x = w.economy.fxChange12;
      const verlust = (1 - 1 / (1 + x / 100)) * 100;
      return [`In den letzten zwölf Monaten kostet der Dollar ${nf(x)} Prozent mehr Lira (heute ${nf(w.economy.usdTry)} Lira). Die Lira hat damit rund ${nf(verlust)} Prozent ihres Dollar-Werts verloren.`];
    },
  },
  defizit: {
    was: [
      "Das Haushaltsdefizit ist der Betrag, um den der Staat mehr ausgibt, als er einnimmt, gemessen in Prozent der Wirtschaftsleistung.",
      "Im Politiknetz erscheint es als Index: 50 heißt ausgeglichener Haushalt, jeder Punkt darüber entspricht 0,2 Prozentpunkten Defizit.",
    ],
    wichtig: "Jedes Defizit wird zu Schulden. Schulden kosten Zinsen; wer den Märkten zu viel schuldet, zahlt mit einem höheren Risikoaufschlag und einer schwächeren Lira.",
    stand: (w) => [`Das geplante Defizit beträgt ${nf(w.economy.deficit + w.economy.fiscalImpulse + w.economy.policyCost)} Prozent der Wirtschaftsleistung (Grundlinie ${nf(w.economy.deficit)}, dein Ausgabenprogramm ${nf(w.economy.fiscalImpulse)}, Kosten deiner Maßnahmen ${nf(w.economy.policyCost)}).`],
  },
  schulden: {
    was: [
      "Die Schuldenquote ist der Schuldenberg des Staates im Verhältnis zur Wirtschaftsleistung eines Jahres.",
      "Bei hoher Inflation schrumpft die Quote von allein, denn die Wirtschaftsleistung wächst in Lira mit den Preisen. Das ist kein Verdienst, sondern eine Nebenwirkung der Inflation.",
    ],
    wichtig: "Je höher die Quote, desto misstrauischer die Märkte und desto höher der Zins, den der Staat zahlen muss.",
    stand: (w) => [`Aktuell ${nf(w.economy.debtRatio)} Prozent der Wirtschaftsleistung; der Risikoaufschlag liegt bei ${nf(w.economy.riskPremium, 0)} Basispunkten.`],
  },
};

function verbindungen(id: string, richtung: "in" | "out", n = 3): Verbindung[] {
  const kanten = NET.edges.filter((e) => (richtung === "in" ? e.to === id : e.from === id)).sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)).slice(0, n);
  return kanten.map((e) => {
    const andere = richtung === "in" ? e.from : e.to;
    return { id: andere, name: NET.nodes[NET.index.get(andere)!]!.name, erhoeht: e.weight > 0, wann: wann(e.lag), warum: e.why };
  });
}

function provinzWerte(w: World, id: string): { name: string; wert: number }[] {
  const i = NET.index.get(id)!;
  return Array.from({ length: PROVINCES }, (_, p) => ({ name: PROVINZEN[p]!.name, wert: w.net.values[i * PROVINCES + p]! })).sort((a, b) => b.wert - a.wert);
}

export function erklaere(node: NodeSpec, w: World): Erklaerung {
  const jetzt = nationalAverage(NET, w.net, node.id);
  const start = startAverage(NET, w.net, node.id);
  const begriffe: Begriff[] = [];
  const nimm = (...ids: string[]) => ids.forEach((k) => BEGRIFFE[k] && !begriffe.includes(BEGRIFFE[k]!) && begriffe.push(BEGRIFFE[k]!));

  const wirkungen = verbindungen(node.id, "out");
  const treiber = verbindungen(node.id, "in");
  if ([...wirkungen, ...treiber].some((v) => v.wann !== "sofort")) nimm("verzoegerung");

  // Größen des Wirtschaftsmodells
  if (node.input) {
    const info = EINGANG[node.input]!;
    nimm("durchschnitt", ...(info.begriffe ?? []));
    return {
      was: [...info.was, info.wichtig],
      stand: info.stand(w),
      wirkungen,
      treiber,
      hebel: [],
      hebelHinweis: MAKRO_WEGE[node.input]?.wege.runter,
      begriffe,
    };
  }

  const was: string[] = [node.text, KIND_ERKLAERT[node.kind]];
  const stand: string[] = [];
  let orte: Erklaerung["orte"];
  const werte = node.kind === "massnahme" ? [] : provinzWerte(w, node.id);

  if (node.kind === "massnahme") {
    nimm("umsetzung", "index");
    const kosten = node.cost ?? 0;
    was.push(
      kosten === 0
        ? "Die Maßnahme kostet den Haushalt praktisch nichts."
        : `Bei voller Stufe kostet sie gegenüber Stufe 0 etwa ${nf(Math.abs(kosten), 2)} Prozent der Wirtschaftsleistung im Jahr${kosten < 0 ? " nicht, sie bringt diesen Betrag ein" : ""}. Sie wirkt erst nach etwa ${node.months ?? 1} ${(node.months ?? 1) === 1 ? "Monat" : "Monaten"}.`,
    );
    stand.push(`Aktuell steht sie im Landesdurchschnitt auf Stufe ${nf(jetzt, 0)}; beim Amtsantritt war es ${nf(start, 0)}.`);
    const ziel = w.net.targets[node.id];
    if (ziel !== undefined && Math.abs(jetzt - ziel) > 1) stand.push(`Beschlossen ist Stufe ${nf(ziel, 0)}; die Umsetzung läuft noch.`);
  } else {
    nimm("index", "durchschnitt", "traegheit");
    const d = jetzt - start;
    stand.push(
      `Im Landesdurchschnitt steht der Wert bei ${nf(jetzt)}; beim Amtsantritt waren es ${nf(start)}. ${Math.abs(d) < 0.3 ? "Er hat sich kaum bewegt." : d > 0 ? `Er ist um ${nf(d)} Punkte gestiegen.` : `Er ist um ${nf(-d)} Punkte gesunken.`}`,
    );
    if (node.kind === "problem") {
      nimm("akut");
      const akut = werte.filter((x) => x.wert >= (node.threshold ?? 60));
      stand.push(akut.length === 0 ? `In keiner Provinz ist das Problem akut (Schwelle ${node.threshold}).` : `Akut ist es in ${akut.length} ${akut.length === 1 ? "Provinz" : "Provinzen"} (Schwelle ${node.threshold}), am stärksten in ${akut.slice(0, 3).map((x) => x.name).join(", ")}.`);
    }
    orte = { hoch: werte.slice(0, 3), tief: werte.slice(-3).reverse() };
  }

  // Was du tun kannst
  const hebelListe: Erklaerung["hebel"] = [];
  let hebelHinweis: string | undefined;
  if (node.kind === "massnahme") {
    hebelHinweis = "Das ist selbst ein Regler. Was er bewirkt, steht unter „Wirkungen“; die Vorschau rechnet die nächsten zwölf Monate durch.";
  } else {
    const gewuenscht: 1 | -1 = node.kind === "problem" ? -1 : 1;
    for (const h of hebel(node.id, gewuenscht, 4)) {
      const kante = NET.edges.find((e) => e.from === h.node.id && e.to === node.id) ?? NET.edges.find((e) => e.from === h.node.id);
      hebelListe.push({ text: `„${h.node.name}“ ${h.richtung > 0 ? "erhöhen" : "senken"}`, warum: kante?.why ?? h.node.text });
    }
    if (!hebelListe.length) hebelHinweis = "Für diese Größe gibt es keinen direkten Regler. Sie folgt den Ursachen, die links im Bild stehen.";
  }

  return {
    was,
    stand,
    ...(orte ? { orte } : {}),
    wirkungen,
    treiber,
    hebel: hebelListe,
    ...(hebelHinweis ? { hebelHinweis } : {}),
    begriffe,
  };
}

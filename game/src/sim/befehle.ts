// Freie Sprache wird hier in geprüfte Aktionen übersetzt (Spieldesign, Abschnitt 6).
// Der Kern bleibt die einzige Wahrheitsquelle: Diese Ebene erfindet keine Zahlen,
// sondern wählt aus einem festen Handlungskatalog und meldet, was der Kern protokolliert.
// Ein Sprachmodell kann später dieselbe Schnittstelle benutzen; ohne Schlüssel
// bleibt das Spiel über diese Regeln vollständig spielbar.

import { advance, criticizeCentralBank, replaceGovernor, setFiscalImpulse, setPolicy, NET } from "./world";
import { nationalAverage } from "./netz";
import { formatDateDe } from "./dates";
import type { World } from "./types";

export interface ChatZeile {
  rolle: "spieler" | "spiel";
  text: string;
  why?: string;
}

export interface ChatAntwort {
  ok: boolean;
  text: string;
  why?: string;
}

const BEISPIELE = [
  "Wie hoch ist die Inflation?",
  "Erhoehe den Mindestlohn.",
  "Ich will mehr ausgeben.",
  "Kritisiere die Zentralbank oeffentlich.",
  "10 Tage weiter.",
];

export function willkommensText(): string {
  return (
    "Sie haben das Wort. Schreiben Sie, was Sie tun wollen, etwa: " +
    BEISPIELE.slice(0, 2).join(" · ") +
    " Bei allem anderen nenne ich die Wege, die es gibt."
  );
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fuehrt einen Befehl aus und meldet, was der Kern daraufhin protokolliert. */
export function befehl(text: string, w: World): ChatAntwort {
  const t = norm(text);
  if (!t) return { ok: false, text: "Sie haben nichts geschrieben." };

  if (/(hilfe|was kann ich|befehle|beispiele)/.test(t)) {
    return {
      ok: true,
      text: "Beispiele: " + BEISPIELE.join(" · "),
      why: "Alles, was Sie schreiben, wird geprueft und nur ausgefuehrt, wenn der Kern es hergibt.",
    };
  }

  // Zeit
  const tage = zeitBefehl(t);
  if (tage !== null) {
    if (tage <= 0) return { ok: true, text: "Die Zeit laeuft nicht (Tag " + (w.day + 1) + ", " + formatDateDe(w.date) + ")." };
    const before = w.log.length;
    const start = w.date;
    advance(w, tage);
    const frisch = w.log.slice(before);
    const zusammenfassung = frisch.slice(0, 3).map((l) => l.text).join(" ");
    return {
      ok: true,
      text:
        tage + (tage === 1 ? " Tag" : " Tage") + " spaeter: " + formatDateDe(w.date) + " (vorher " + start + ")." +
        (zusammenfassung ? " " + zusammenfassung : " Nichts Aussergewoehnliches ist passiert."),
      why: frisch[0]?.why,
    };
  }

  // Zentralbank: Der Spieler setzt den Leitzins nicht selbst (Wirtschaftsmodell, Abschnitt 5)
  if (/(gouverneurin|gouverneur|bankchef)/.test(t) && /(entlass|ersetzen|neu|gefuegig|gefaellig)/.test(t)) {
    const before = w.log.length;
    replaceGovernor(w, "gefuegig", "eine neue, regierungsnahe Fuehrung");
    const l = w.log[before];
    return { ok: true, text: l?.text ?? "Die Zentralbankfuehrung wurde ersetzt.", why: l?.why };
  }
  if (/(zentralbank|bank)/.test(t) && /(kriti|druck|angreif|attackier|oeffentlich|offentlich)/.test(t)) {
    const before = w.log.length;
    criticizeCentralBank(w);
    const l = w.log[before];
    return { ok: true, text: l?.text ?? "Sie haben die Zentralbank oeffentlich kritisiert.", why: l?.why };
  }
  if (/(leitzins|zinsen|zinspolitik|geldpolitik)/.test(t) && /(senk|erhoeh|erhoehe|anheb|erhoe|bestimm|festleg|mach)/.test(t)) {
    return {
      ok: false,
      text:
        "Den Leitzins bestimmt die Zentralbank, nicht die Regierung. Wege, die es gibt: oeffentliche Kritik (Kritisiere die Zentralbank), ein Gespraech mit der Gouverneurin oder ihre Ersetzung. Jeder Weg hat seinen Preis.",
      why: "Formell ist die Zentralbank unabhaengig; Eingriffe kosten Glaubwuerdigkeit und wirken ueber die Waehrung und die Erwartungen.",
    };
  }

  // Haushalt
  if (/(mehr ausgeben|ausgaben erhoeh|konjunktur|investier|paket|stimul|stuetzen|stutzen)/.test(t) && !/weniger/.test(t)) {
    const before = w.economy.fiscalImpulse;
    setFiscalImpulse(w, before + 2);
    const l = w.log[w.log.length - 1];
    return { ok: true, text: l?.text ?? "Die Ausgaben werden erhoeht.", why: l?.why };
  }
  if (/(sparen|kuerzen|kuerz|ausgaben senk|haushalt konsolid|einsparen)/.test(t)) {
    const before = w.economy.fiscalImpulse;
    setFiscalImpulse(w, before - 1);
    const l = w.log[w.log.length - 1];
    return { ok: true, text: l?.text ?? "Die Ausgaben werden gesenkt.", why: l?.why };
  }

  // Kennzahlen (nur veroeffentlichte Werte: Information ist unvollstaendig)
  const zahl = kennzahl(t, w);
  if (zahl) return zahl;

  // Massnahmen des Politiknetzes
  const mass = massnahme(t, w);
  if (mass) return mass;

  return {
    ok: false,
    text:
      "Das habe ich nicht als Auftrag verstanden. Moeglich sind zum Beispiel: " +
      BEISPIELE.slice(0, 3).join(" · ") +
      " Wenn Sie etwas anderes wollen, beschreiben Sie das Ziel, ich zeige die Wege.",
    why: "Unklare Anweisungen fuehren zu einer Rueckfrage, nie zu einer ungewollten Ausfuehrung (Entwicklungsplan, Abschnitt 7).",
  };
}

function zeitBefehl(t: string): number | null {
  if (/^(weiter|vor|zeit weiter|spielen|nach vorn)/.test(t) || /tag weiter|weiter mit/.test(t)) return 1;
  const m = t.match(/(\d{1,3})\s*(tage|tag)/);
  if (m) return parseInt(m[1]!, 10);
  if (/woche/.test(t)) return 7;
  if (/monat/.test(t)) return 30;
  if (/pause|halt|stopp|wartet/.test(t)) return 0;
  return null;
}

function kennzahl(t: string, w: World): ChatAntwort | null {
  const p = w.published;
  const e = w.economy;
  const fragt = /(wie|was|stand|steht|hoch|wert|entwickl|aktuell|gerade)/.test(t);
  if (!fragt) return null;
  const f = (v: number) => v.toLocaleString("de-DE", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  if (/inflation|preise|teuerung/.test(t)) {
    return {
      ok: true,
      text: "Die Inflation liegt bei " + f(p.inflation.value) + " % (gemessen fuer " + p.inflation.period + ", veroeffentlicht am " + p.inflation.publishedOn + ").",
      why:
        "Statistiken erscheinen mit Verzoegerung, Sie steuern mit Blick in den Rueckspiegel. Die Inflationserwartung liegt bei " +
        f(e.expectedInflation) + " % (Umfrage, ungenau).",
    };
  }
  if (/arbeitslos|beschaeftig|beschaftig|jobs/.test(t)) {
    return {
      ok: true,
      text: "Die Arbeitslosenquote liegt bei " + f(p.unemployment.value) + " % (gemessen fuer " + p.unemployment.period + ").",
      why: "Wachstum wirkt auf die Beschaeftigung mit Verzoegerung von Quartalen (Wirtschaftsmodell, Z9).",
    };
  }
  if (/lira|waehrung|wechselkurs|dollar|euro/.test(t)) {
    return {
      ok: true,
      text: "Ein Dollar kostet " + f(e.usdTry) + " Lira, ein Euro " + f(e.eurTry) + " Lira. Die Lira hat in zwoelf Monaten " + f(e.fxChange12) + " % verloren.",
      why: "Zinsen und Vertrauen wirken auf die Waehrung mit Tagesverzoegerung; eine schwaechere Lira verteuert Importe, vor allem Energie (Z4/Z5).",
    };
  }
  if (/wachstum|konjunktur|wirtschaftsleistung|bip/.test(t)) {
    return {
      ok: true,
      text: "Das Wachstum liegt bei " + f(p.growth.value) + " % (gemessen fuer " + p.growth.period + ").",
      why: "Das ist der zuletzt veroeffentlichte Wert; die aktuelle Lage haengt auch an Ihren Massnahmen und am Weltmarkt.",
    };
  }
  if (/zins|leitzins/.test(t)) {
    return {
      ok: true,
      text: "Der Leitzins liegt bei " + f(e.policyRate) + " %. Der Realzins liegt damit bei " + f(e.policyRate - e.expectedInflation) + " %.",
      why: "Der Realzins ist der Leitzins abzueglich der erwarteten Inflation; er entscheidet ueber Kredite und Sparen (Z1).",
    };
  }
  if (/schulden|defizit|haushalt/.test(t)) {
    return {
      ok: true,
      text:
        "Die Staatsschulden liegen bei " + f(e.debtRatio) + " % der Wirtschaftsleistung, das geplante Defizit bei " + f(e.deficit) +
        " %. Ihr zusaetzliches Ausgabenprogramm: " + f(e.fiscalImpulse) + " % der Wirtschaftsleistung.",
      why: "Defizite werden zu Schulden, Schulden zu Zinslast. Tragfaehig ist das Verhaeltnis von Zins und Wachstum (Z7).",
    };
  }
  return null;
}

function massnahme(t: string, w: World): ChatAntwort | null {
  // Laengster Treffer gewinnt (Steuer auf Kraftstoff vor Steuer)
  const kandidaten = NET.nodes
    .filter((n) => n.kind === "massnahme")
    .map((n) => ({ n, name: norm(n.name) }))
    .filter((k) => t.includes(k.name) || t.includes(k.n.id.replace(/^m_/, "")))
    .sort((a, b) => b.name.length - a.name.length);
  const treffer = kandidaten[0];
  if (!treffer) return null;

  const vorher = nationalAverage(NET, w.net, treffer.n.id);
  const explizit = t.match(/auf\s+(\d{1,3})/);
  const senken = /(senk|weniger|abbau|reduzier|streich|abschaff|zurueck|runter)/.test(t);
  const erhohen = /(erhoeh|erhoehe|mehr|staerk|ausbau|verbesser|erhoe|rauf|ausweiten)/.test(t);
  let ziel: number;
  if (explizit) ziel = parseInt(explizit[1]!, 10);
  else if (senken && !erhohen) ziel = Math.max(0, Math.round(vorher) - 25);
  else if (erhohen) ziel = Math.min(100, Math.round(vorher) + 25);
  else
    return {
      ok: false,
      text: "„" + treffer.n.name + "“ verstanden, aber in welche Richtung? Sagen Sie etwa „erhoehe " + treffer.n.name + "“ oder „" + treffer.n.name + " auf 70“.",
      why: treffer.n.text,
    };

  setPolicy(w, treffer.n.id, ziel);
  const l = w.log[w.log.length - 1];
  return { ok: true, text: l?.text ?? treffer.n.name + ": neu auf " + ziel + ".", why: l?.why ?? treffer.n.text };
}

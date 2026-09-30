// Länder handeln von sich aus: Wer ungeduldig ist, fordert; wer Vertrauen hat, macht ein Angebot; wer Streit sucht, provoziert.
// Alles folgt aus dem Zustand der Beziehung (laender.ts) und den Anliegen des Landes, nie aus einem Drehbuch.

import { wirke, vertrauenAendern } from "./wirkung";
import { anliegenStand, land, landAendern, LAENDER, vertrauenZu, weltZustand } from "./laender";
import { loyalitaetAendern } from "./figuren";
import { beschr, kosten, opt, zusageAnlegen } from "./ereignis-hilfen";
import type { Vorlage } from "./ereignis-hilfen";
import { KLAUSEL_NACH_ID, type Laufzeit } from "../data/abkommen";
import { heimWirkung, klauselSicht, laufende, pruefeAngebot, schliesse, sperreRest, verlaengere, VERLAENGERUNG_PK, vertragsName, vorschlagVomPartner, type Angebot } from "./abkommen";
import type { World } from "./types";

const AB_TAG = 200;

const ANREDE: Record<string, string> = {
  USA: "Die US-Regierung", EU: "Die EU-Kommission", RUS: "Moskau", CHN: "Peking", AZE: "Baku", SAU: "Riad und die Golfstaaten", GRC: "Athen",
  IRN: "Teheran", SYR: "Damaskus", IRQ: "Bagdad", ARM: "Eriwan", ISR: "Jerusalem", UKR: "Kiew", GEO: "Tiflis", EGY: "Kairo", LBY: "Tripolis", KAZ: "Astana", CYP: "Nikosia",
};

/** Länder mit einem unerfüllten Anliegen, das sich ändern ließe, und mit wenig Geduld. */
function ungeduldig(w: World): { id: string; anliegen: string; text: string } | null {
  let beste: { id: string; anliegen: string; text: string; wert: number } | null = null;
  for (const l of LAENDER) {
    const z = weltZustand(w)[l.id]!;
    if (w.day - (z.zuletzt.gipfel ?? -1e9) < 150) continue; // wer gerade Gehör gefunden hat, wartet
    if (w.day - (w.spiel?.zuletzt[`land_fordert#${l.id}`] ?? -1e9) < 270) continue; // wer eben erst gefordert hat, lässt anderen den Vortritt
    for (const s of anliegenStand(w, l.id)) {
      if (s.erfuellt) continue;
      const b = s.anliegen.bedingung;
      if (b.art !== "massnahme" && b.art !== "massnahme-max") continue; // nur Anliegen, die der Spieler beeinflussen kann
      const wert = (100 - vertrauenZu(w, l.id)) * 0.4 + z.konflikt * 0.3 + (l.gruppe === "Große Mächte" ? 12 : 0);
      if (!beste || wert > beste.wert) beste = { id: l.id, anliegen: s.anliegen.id, text: `${s.anliegen.titel}: ${s.anliegen.text}`, wert };
    }
  }
  return beste;
}

const LAND_FORDERT: Vorlage = {
  id: "land_fordert",
  szene: "parlament",
  frist: 25,
  abkuehlung: 240,
  chance: (w) => (w.day > AB_TAG && ungeduldig(w) ? 0.035 : 0),
  eroeffne: (w, ev) => {
    if (w.spiel) w.spiel.zuletzt[`land_fordert#${String(ev.daten?.land)}`] = w.day;
  },
  erzeuge: (w) => {
    const u = ungeduldig(w);
    return u ? { provinzen: [], staerke: 1, daten: { land: u.id, anliegen: u.anliegen, text: u.text } } : null;
  },
  titel: (_, ev) => `${ANREDE[String(ev.daten?.land)] ?? land(String(ev.daten?.land)).name} verliert die Geduld`,
  text: (w, ev) => {
    const l = land(String(ev.daten?.land));
    return [
      `${ANREDE[l.id] ?? l.name} lässt ausrichten, dass die Geduld schwindet: ${ev.daten?.text}`,
      `Das Verhältnis steht bei Vertrauen ${Math.round(vertrauenZu(w, l.id))} und Konflikt ${Math.round(weltZustand(w)[l.id]!.konflikt)}. Eine Antwort wird erwartet.`,
    ];
  },
  warum: () => "Andere Staaten haben eigene Interessen. Wer sie ignoriert, zahlt später: an Vertrauen, an Märkten, an Sicherheit.",
  massnahmen: [],
  optionen: (w, ev) => {
    const l = land(String(ev.daten?.land));
    const a = l.anliegen.find((x) => x.id === String(ev.daten?.anliegen));
    const m = a && "id" in a.bedingung ? a.bedingung : null;
    const optionen = [
      opt("gespraech", "Ein Gespräch anbieten", beschr(2, 0, "kauft Zeit, ohne etwas zu ändern."), 2, (ww) => {
        landAendern(ww, l.id, { vertrauen: 4 }, "Gesprächsangebot nach einer Forderung");
        return `${ANREDE[l.id] ?? l.name} nimmt das Gesprächsangebot an, wartet aber weiter auf Taten.`;
      }),
      opt("zusagen", "Eine Zusage machen", beschr(3, 0, `${ANREDE[l.id] ?? l.name} bekommt ein Versprechen, das in acht Monaten eingefordert wird.`), 3, (ww) => {
        landAendern(ww, l.id, { vertrauen: 6 }, "Zusage nach einer Forderung");
        if (m) zusageAnlegen(ww, { von: ANREDE[l.id] ?? l.name, text: `${ANREDE[l.id] ?? l.name} wurde zugesagt: ${a!.titel}`, tage: 240, massnahme: m.id });
        return `Die Regierung sagt ${ANREDE[l.id] ?? l.name} zu, ${a?.titel ?? "das Anliegen"} anzugehen.`;
      }),
      opt("zurueckweisen", "Zurückweisen", beschr(0, 0, "Beifall zu Hause, Ärger im Ausland."), 0, (ww) => {
        landAendern(ww, l.id, { vertrauen: -8, konflikt: 5 }, "Forderung zurückgewiesen");
        wirke(ww, "konservative", 1);
        vertrauenAendern(ww, 0.5);
        return `Die Regierung weist die Forderung von ${ANREDE[l.id] ?? l.name} zurück.`;
      }),
    ];
    return optionen;
  },
  standard: (w, ev) => {
    const l = land(String(ev.daten?.land));
    landAendern(w, l.id, { vertrauen: -5 }, "Forderung unbeantwortet");
    return `${ANREDE[l.id] ?? l.name} wertet das Schweigen als Antwort.`;
  },
};

/** Länder mit viel Vertrauen schlagen von sich aus ein Paket vor: etwas für die Türkei gegen etwas von der Türkei. */
function angebot(w: World): { id: string; paket: Angebot } | null {
  const kandidaten = LAENDER.filter((l) => vertrauenZu(w, l.id) >= 55 && weltZustand(w)[l.id]!.konflikt < 60 && sperreRest(w, l.id) === 0 && (w.spiel?.zuletzt[`land_angebot#${l.id}`] ?? -1e9) < w.day - 300)
    .map((l) => ({ id: l.id, paket: vorschlagVomPartner(w, l.id) }))
    .filter((x): x is { id: string; paket: Angebot } => x.paket !== null);
  return kandidaten.length ? kandidaten[Math.floor((w.day / 30) % kandidaten.length)]! : null;
}

const labelVon = (w: World, landId: string, id: string) => klauselSicht(w, landId, id)?.label ?? id;
const paketText = (w: World, a: Angebot) => {
  const teile: string[] = [];
  if (a.gibt.length) teile.push(`Die Türkei bietet: ${a.gibt.map((id) => `„${labelVon(w, a.land, id)}“`).join(", ")}`);
  if (a.will.length) teile.push(`Die Türkei erhält: ${a.will.map((id) => `„${labelVon(w, a.land, id)}“`).join(", ")}`);
  return `${teile.join(". ")}. Laufzeit ${a.jahre} Jahre.`;
};
const paketPreis = (a: Angebot) => [...a.gibt, ...a.will].reduce((s, id) => s + (KLAUSEL_NACH_ID[id]?.pk ?? 0), 0);

const LAND_ANGEBOT: Vorlage = {
  id: "land_angebot",
  szene: "bank",
  frist: 30,
  abkuehlung: 300,
  chance: (w) => (w.day > AB_TAG && angebot(w) ? 0.04 : 0),
  eroeffne: (w, ev) => {
    if (w.spiel) w.spiel.zuletzt[`land_angebot#${String(ev.daten?.land)}`] = w.day;
  },
  erzeuge: (w) => {
    const a = angebot(w);
    return a ? { provinzen: [], staerke: 1, daten: { land: a.id, gibt: a.paket.gibt.join(","), will: a.paket.will.join(",") } } : null;
  },
  titel: (_, ev) => `${ANREDE[String(ev.daten?.land)] ?? land(String(ev.daten?.land)).name} schlägt einen Vertrag vor`,
  text: (w, ev) => {
    const l = land(String(ev.daten?.land));
    const a = paketAus(ev);
    return [
      `${ANREDE[l.id] ?? l.name} legt ein Paket auf den Tisch. ${paketText(w, a)}`,
      `Das Verhältnis ist gut (Vertrauen ${Math.round(vertrauenZu(w, l.id))}); es ist die Zeit, daraus etwas zu machen. Was das Paket bei uns bewirkt, zeigen die Antworten.`,
    ];
  },
  warum: () => "Vertrauen ist Kapital, das man nur einlösen kann, wenn ein Angebot kommt. Wer es nie einlöst, hat es umsonst aufgebaut. Ein Vertrag bindet aber beide Seiten und wird jedes Jahr geprüft.",
  massnahmen: [],
  optionen: (w, ev) => {
    const l = land(String(ev.daten?.land));
    const a = paketAus(ev);
    const kurz = { ...a, jahre: 2 as Laufzeit };
    const zeilen = [...a.gibt, ...a.will].flatMap((id) => KLAUSEL_NACH_ID[id] ? heimWirkung(KLAUSEL_NACH_ID[id]!).dauer.slice(0, 2).map((z) => z.text) : []).slice(0, 4).join("; ");
    const preis = paketPreis(a);
    return [
      opt("annehmen", "Annehmen: fünf Jahre", beschr(preis, 0, zeilen ? `bei uns: ${zeilen}; ein Vertrag bindet und wird jedes Jahr geprüft.` : "ein Vertrag bindet und wird jedes Jahr geprüft."), preis, (ww) => {
        const pruef = pruefeAngebot(ww, a);
        if (pruef) return `Das Paket ist nicht mehr möglich: ${pruef}`;
        schliesse(ww, a);
        return `Die Türkei und ${l.name} schließen den Vertrag: ${paketText(ww, a)}`;
      }),
      opt("kurz", "Kürzer binden: zwei Jahre", beschr(Math.ceil(preis * 0.6), 0, "schwächere Dauerwirkung, dafür weniger Bindung."), Math.ceil(preis * 0.6), (ww) => {
        const pruef = pruefeAngebot(ww, kurz);
        if (pruef) return `Das Paket ist nicht mehr möglich: ${pruef}`;
        schliesse(ww, kurz);
        return `Die Türkei und ${l.name} schließen einen Vertrag auf zwei Jahre.`;
      }),
      opt("ablehnen", "Ablehnen", beschr(0, 0, "wahrt die Unabhängigkeit, kostet Wärme."), 0, (ww) => {
        landAendern(ww, l.id, { vertrauen: -3 }, "Vertragsvorschlag abgelehnt");
        return `Die Türkei lehnt den Vorschlag von ${ANREDE[l.id] ?? l.name} höflich ab.`;
      }),
    ];
  },
  standard: (w, ev) => {
    landAendern(w, String(ev.daten?.land), { vertrauen: -2 }, "Vertragsvorschlag verfallen");
    return "Der Vorschlag verfällt ungenutzt.";
  },
};

function paketAus(ev: { daten?: Record<string, number | string> }): Angebot {
  const liste = (x: unknown) => String(x ?? "").split(",").filter(Boolean);
  return { land: String(ev.daten?.land), gibt: liste(ev.daten?.gibt), will: liste(ev.daten?.will), jahre: 5 };
}

/** Ein Vertrag, der bald ausläuft und noch nichts angesprochen hat. */
function ablaufend(w: World): { id: string; land: string } | null {
  for (const l of LAENDER) {
    for (const v of laufende(w, l.id)) {
      if (v.ablauf - w.day <= 150 && v.ablauf - w.day > 20 && (w.spiel?.zuletzt[`vertrag_verlaengerung#${v.id}`] ?? -1e9) < 0) return { id: v.id, land: l.id };
    }
  }
  return null;
}

const VERTRAG_VERLAENGERUNG: Vorlage = {
  id: "vertrag_verlaengerung",
  szene: "bank",
  frist: 40,
  abkuehlung: 60,
  chance: (w) => (ablaufend(w) ? 0.6 : 0),
  eroeffne: (w, ev) => {
    if (w.spiel) w.spiel.zuletzt[`vertrag_verlaengerung#${String(ev.daten?.vertrag)}`] = w.day;
  },
  erzeuge: (w) => {
    const a = ablaufend(w);
    return a ? { provinzen: [], staerke: 1, daten: { land: a.land, vertrag: a.id } } : null;
  },
  titel: (_, ev) => `Der Vertrag mit ${land(String(ev.daten?.land)).dat} läuft aus`,
  text: (w, ev) => {
    const l = land(String(ev.daten?.land));
    const v = laufende(w, l.id).find((x) => x.id === String(ev.daten?.vertrag));
    return [
      `Der Vertrag mit ${l.dat} (${v ? vertragsName(w, v) : "Vertrag"}) endet in etwa fünf Monaten. ${v && v.verstoesse === 0 ? "Er wurde bisher gehalten; das zählt für eine Verlängerung." : "Es gab Verstöße, eine Verlängerung ist unwahrscheinlich."}`,
      `Das Vertrauen zu ${l.dat} liegt bei ${Math.round(vertrauenZu(w, l.id))}.`,
    ];
  },
  warum: () => "Verträge, die auslaufen, hören nicht auf zu wirken, weil man sie vergisst: Die Dauerwirkungen enden, und das Land fragt sich, ob man es ernst gemeint hat.",
  massnahmen: [],
  optionen: (w, ev) => {
    const l = land(String(ev.daten?.land));
    const id = String(ev.daten?.vertrag);
    return [
      opt("verlaengern5", "Um fünf Jahre verlängern", beschr(VERLAENGERUNG_PK[5], 0, "die Dauerwirkungen laufen weiter, die Bindung auch."), VERLAENGERUNG_PK[5], (ww) => verlaengere(ww, l.id, id, 5, false).text),
      opt("verlaengern2", "Um zwei Jahre verlängern", beschr(VERLAENGERUNG_PK[2], 0, "kürzere Bindung, die Wirkungen laufen weiter."), VERLAENGERUNG_PK[2], (ww) => verlaengere(ww, l.id, id, 2, false).text),
      opt("auslaufen", "Auslaufen lassen", beschr(0, 0, "die Wirkungen enden mit dem Vertrag."), 0, () => `Der Vertrag mit ${l.dat} läuft aus.`),
    ];
  },
  standard: (w, ev) => `Der Vertrag mit ${land(String(ev.daten?.land)).dat} läuft ohne Verlängerung aus.`,
};

/** Streit sucht den Präsidenten: Länder mit hohem Konflikt provozieren. */
function schwelend(w: World): { id: string } | null {
  const k = LAENDER.filter((l) => weltZustand(w)[l.id]!.konflikt >= 65).sort((a, b) => weltZustand(w)[b.id]!.konflikt - weltZustand(w)[a.id]!.konflikt);
  return k.length ? { id: k[0]!.id } : null;
}

const LAND_PROVOKATION: Vorlage = {
  id: "land_provokation",
  szene: "anatolien",
  frist: 12,
  abkuehlung: 240,
  chance: (w) => (w.day > AB_TAG && schwelend(w) ? 0.035 : 0),
  erzeuge: (w) => {
    const a = schwelend(w);
    return a ? { provinzen: [], staerke: 1, daten: { land: a.id } } : null;
  },
  titel: (_, ev) => `Streit mit ${land(String(ev.daten?.land)).dat} flammt auf`,
  text: (w, ev) => {
    const l = land(String(ev.daten?.land));
    return [`Der Dauerstreit mit ${l.dat} verschärft sich: Erklärungen, Manöver, Vorwürfe. Der Konflikt liegt bei ${Math.round(weltZustand(w)[l.id]!.konflikt)} von 100.`, `${l.text.split(";")[0]}.`];
  },
  warum: () => "Schwelende Konflikte lösen sich nicht von selbst. Jede Seite braucht einen Weg heraus, der nicht wie Niederlage aussieht.",
  massnahmen: [],
  optionen: (_, ev) => {
    const l = land(String(ev.daten?.land));
    return [
      opt("deeskalieren", "Deeskalieren und einen Kanal öffnen", beschr(3, 0, "senkt die Spannung, Nationalisten murren."), 3, (ww) => {
        landAendern(ww, l.id, { konflikt: -10, vertrauen: 3 }, "Deeskalation");
        wirke(ww, "konservative", -1);
        loyalitaetAendern(ww, "aussen", 4);
        return `Ein diplomatischer Kanal mit ${l.dat} wird geöffnet; die Lage beruhigt sich.`;
      }),
      opt("standhalten", "Standhalten", beschr(1, 0, "Härte zeigen, ohne zu eskalieren."), 1, (ww) => {
        landAendern(ww, l.id, { konflikt: 2 }, "Standhaft geblieben");
        vertrauenAendern(ww, 0.5);
        return `Die Regierung bleibt fest und antwortet auf die Erklärungen aus ${l.name} mit einer eigenen.`;
      }),
      opt("eskalieren", "Mit einem Manöver antworten", beschr(3, 0.1, "starker Auftritt, höhere Spannung und Kosten."), 3, (ww) => {
        kosten(ww, 0.1);
        landAendern(ww, l.id, { konflikt: 10, vertrauen: -6 }, "Manöver als Antwort");
        vertrauenAendern(ww, 1.5);
        wirke(ww, "militaer", 1);
        return `Ein Manöver der Streitkräfte antwortet auf ${l.akk}; die Spannung steigt.`;
      }),
    ];
  },
  standard: (w, ev) => {
    landAendern(w, String(ev.daten?.land), { konflikt: 4 }, "Provokation unbeantwortet");
    return "Ohne Antwort verschärft sich der Ton.";
  },
};

export const LAENDER_VORLAGEN: Vorlage[] = [LAND_FORDERT, LAND_ANGEBOT, LAND_PROVOKATION, VERTRAG_VERLAENGERUNG];

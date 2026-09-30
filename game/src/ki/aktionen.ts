// Vorschläge des Sprachmodells: lesen, prüfen, vorführen, ausführen.
// Das Modell darf nur aus dem festen Katalog wählen. Jede Aktion läuft über dieselben Funktionen wie die Bedienung von Hand
// und über dieselben Prüfungen (Kapital, Mehrheit, Abkühlzeiten); was der Kern ablehnt, wird nicht ausgeführt.

import { NET } from "../sim/modell";
import { fold, laufeZeit, ortAusText } from "../sim/befehle";
import { bringeEin, provinzenText, pruefeVorhaben, stufeIn } from "../sim/handeln";
import { AKTIONEN, LAENDER, aktionenFuer, fuehreAktionAus, type AktionId } from "../sim/laender";
import { fraktionsUebersicht, verhandle, type Verhandlung } from "../sim/verhandeln";
import { entlasseFigur, sprichMitFigur } from "../sim/eingriffe";
import { naechsterSchritt, starteSchritt } from "../sim/programme";
import { antworten, entscheide } from "../sim/ereignisse";
import { criticizeCentralBank, replaceGovernor, setFiscalImpulse } from "../sim/world";
import { Rng } from "../sim/rng";
import type { World } from "../sim/types";
import type { KiAktion, KiErgebnis, KiVorschau } from "./typen";
import { kannZahlen } from "../sim/kapital";

const MAX_AKTIONEN = 3;
const LAND_HANDLUNGEN = new Set<string>(Object.keys(AKTIONEN));
const FRAKTIONS_HANDLUNGEN = new Set<string>(["gespraech", "zugestaendnis", "duldung", "koalition", "abwerben"]);
const FIGUR_AEMTER = new Set(["finanzen", "inneres", "aussen", "stab"]);
const HAUSHALT_HANDLUNGEN = new Set(["mehr_ausgeben", "sparen", "zentralbank_kritisieren", "zentralbank_fuehrung_tauschen"]);

const istText = (x: unknown): x is string => typeof x === "string" && x.trim().length > 0;
const kurz = (x: unknown): string | undefined => (istText(x) ? x.trim().slice(0, 240) : undefined);

/** Liest die Antwort des Modells: strenges JSON, sonst der erste JSON-Block im Text, sonst der Text selbst ohne Aktionen. */
export function leseAntwort(roh: string): KiErgebnis {
  const text = roh.trim();
  const kandidaten: string[] = [text];
  const zaun = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (zaun) kandidaten.push(zaun[1]!);
  const a = text.indexOf("{");
  const b = text.lastIndexOf("}");
  if (a >= 0 && b > a) kandidaten.push(text.slice(a, b + 1));
  for (const k of kandidaten) {
    try {
      const j = JSON.parse(k) as { antwort?: unknown; aktionen?: unknown };
      if (j && typeof j === "object" && (istText(j.antwort) || Array.isArray(j.aktionen))) {
        const aktionen = (Array.isArray(j.aktionen) ? j.aktionen : []).map(pruefeForm).filter((x): x is KiAktion => x !== null).slice(0, MAX_AKTIONEN);
        return { antwort: istText(j.antwort) ? j.antwort.trim() : "", aktionen, gelesen: true };
      }
    } catch {
      /* nächster Kandidat */
    }
  }
  return { antwort: text, aktionen: [], gelesen: false };
}

/** Nur die Form: Felder und Typen. Ob die Aktion im Spiel möglich ist, entscheidet `vorschau`. */
function pruefeForm(x: unknown): KiAktion | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const grund = kurz(o.grund);
  const g = grund ? { grund } : {};
  switch (o.art) {
    case "massnahme": {
      if (!istText(o.id)) return null;
      const orte = Array.isArray(o.orte) ? o.orte.filter(istText) : null;
      const stufe = typeof o.stufe === "number" && Number.isFinite(o.stufe) ? Math.min(100, Math.max(0, Math.round(o.stufe))) : undefined;
      const richtung = o.richtung === 1 || o.richtung === -1 ? o.richtung : undefined;
      if (stufe === undefined && richtung === undefined) return null;
      return { art: "massnahme", id: o.id.trim(), ...(stufe !== undefined ? { stufe } : {}), ...(richtung !== undefined ? { richtung } : {}), orte: orte && orte.length ? orte : null, weg: o.weg === "erlass" ? "erlass" : "gesetz", ...g };
    }
    case "land":
      return istText(o.land) && istText(o.handlung) ? { art: "land", land: o.land.trim(), handlung: o.handlung.trim(), ...g } : null;
    case "fraktion":
      return istText(o.partei) && istText(o.handlung) ? { art: "fraktion", partei: o.partei.trim(), handlung: o.handlung.trim(), ...g } : null;
    case "figur":
      return istText(o.amt) && istText(o.handlung) ? { art: "figur", amt: o.amt.trim(), handlung: o.handlung.trim(), ...g } : null;
    case "programm":
      return { art: "programm", ...g };
    case "haushalt":
      return istText(o.handlung) ? { art: "haushalt", handlung: o.handlung.trim(), ...g } : null;
    case "ereignis":
      return istText(o.id) && istText(o.option) ? { art: "ereignis", id: o.id.trim(), option: o.option.trim(), ...g } : null;
    case "zeit": {
      const tage = typeof o.tage === "number" && Number.isFinite(o.tage) ? Math.min(90, Math.max(1, Math.round(o.tage))) : 0;
      return tage ? { art: "zeit", tage, ...g } : null;
    }
    default:
      return null;
  }
}

function massnahmeZiel(w: World, a: Extract<KiAktion, { art: "massnahme" }>): { id: string; name: string; ort: number[] | null; ziel: number } | { fehler: string } {
  const i = NET.index.get(a.id);
  const node = i === undefined ? undefined : NET.nodes[i];
  if (!node || node.kind !== "massnahme") return { fehler: `„${a.id}“ ist keine Maßnahme dieses Spiels.` };
  const ort = a.orte && a.orte.length ? ortAusText(fold(a.orte.join(" "))) : null;
  if (a.orte && a.orte.length && !ort) return { fehler: `Die Orte „${a.orte.join(", ")}“ kenne ich nicht.` };
  const jetzt = stufeIn(w, node.id, ort);
  const ziel = a.stufe !== undefined ? a.stufe : Math.min(100, Math.max(0, Math.round(jetzt + (a.richtung ?? 1) * 25)));
  return { id: node.id, name: node.name, ort, ziel };
}

/** Was die Aktion wäre, ohne sie auszuführen. */
export function vorschau(w: World, a: KiAktion): KiVorschau {
  const spiel = w.spiel;
  if (!spiel) return { aktion: a, titel: "Keine Spielschleife", problem: "Ohne Amtsantritt gibt es nichts auszuführen." };
  if (spiel.ende) return { aktion: a, titel: "Amtszeit beendet", problem: "Die Amtszeit ist beendet." };
  switch (a.art) {
    case "massnahme": {
      const m = massnahmeZiel(w, a);
      if ("fehler" in m) return { aktion: a, titel: a.id, problem: m.fehler };
      const pr = pruefeVorhaben(w, m.id, m.ziel, m.ort);
      const weg = a.weg === "erlass" ? "Erlass" : "Gesetz";
      const titel = `${m.name} ${provinzenText(m.ort)} auf Stufe ${m.ziel} (${weg})`;
      if (!pr.ok) return { aktion: a, titel, problem: pr.grund ?? "Keine Änderung." };
      if (a.weg === "erlass") {
        if (!pr.erlass.moeglich) return { aktion: a, titel, problem: pr.erlass.grund ?? "Als Erlass nicht möglich." };
        return { aktion: a, titel, kosten: pr.erlass.pk, ...(pr.erlass.bezahlbar ? {} : { problem: "Dafür fehlt Kapital." }) };
      }
      const mehrheit = pr.gesetz.stimmen.erwartet >= 301 ? `Mehrheit steht (erwartet ${pr.gesetz.stimmen.erwartet} Stimmen).` : `Es fehlen etwa ${pr.gesetz.stimmen.luecke} Stimmen zur Mehrheit.`;
      return { aktion: a, titel, kosten: pr.gesetz.pk, hinweis: `${mehrheit} Abstimmung in ${pr.gesetz.tage} Tagen.`, ...(pr.gesetz.bezahlbar ? {} : { problem: "Dafür fehlt Kapital." }) };
    }
    case "land": {
      const def = LAENDER.find((l) => l.id === a.land);
      if (!def) return { aktion: a, titel: a.land, problem: `„${a.land}“ ist kein Land dieses Spiels.` };
      if (!LAND_HANDLUNGEN.has(a.handlung)) return { aktion: a, titel: `${def.name}: ${a.handlung}`, problem: "Diese Handlung gibt es nicht." };
      const s = aktionenFuer(w, def.id).find((x) => x.aktion.id === (a.handlung as AktionId));
      const titel = `${AKTIONEN[a.handlung as AktionId].label} mit ${def.dat}`;
      if (!s) return { aktion: a, titel, problem: "Diese Handlung gibt es diesem Land gegenüber nicht." };
      return { aktion: a, titel, kosten: s.aktion.pk, ...(s.moeglich ? {} : { problem: s.grund ?? "Geht gerade nicht." }) };
    }
    case "fraktion": {
      const f = fraktionsUebersicht(w).find((x) => x.partei === a.partei);
      if (!f) return { aktion: a, titel: a.partei, problem: `Die Fraktion „${a.partei}“ hat in diesem Parlament keine Sitze.` };
      if (!FRAKTIONS_HANDLUNGEN.has(a.handlung)) return { aktion: a, titel: `${f.name}: ${a.handlung}`, problem: "Diese Verhandlungsart gibt es nicht." };
      const s = f.aktionen.find((x) => x.id === a.handlung);
      const titel = `${s?.label ?? a.handlung} mit der ${f.name}`;
      if (!s) return { aktion: a, titel, problem: "Das geht bei dieser Fraktion nicht." };
      return { aktion: a, titel, kosten: s.pk, ...(s.moeglich ? {} : { problem: s.grund ?? "Geht gerade nicht." }) };
    }
    case "figur": {
      if (!FIGUR_AEMTER.has(a.amt)) return { aktion: a, titel: a.amt, problem: "Dieses Amt kenne ich nicht." };
      const f = spiel.figuren.find((x) => x.amt === a.amt && x.imAmt);
      if (!f) return { aktion: a, titel: a.amt, problem: "Dieses Amt ist gerade nicht besetzt." };
      if (a.handlung === "gespraech") return { aktion: a, titel: `Gespräch mit ${f.rolle} ${f.name}` };
      if (a.handlung === "entlassen") return { aktion: a, titel: `${f.rolle} ${f.name} entlassen`, kosten: 4, ...(kannZahlen(spiel.kapital, 4) ? {} : { problem: "Dafür fehlt Kapital." }) };
      return { aktion: a, titel: a.handlung, problem: "Diese Handlung gibt es bei Personen nicht." };
    }
    case "programm": {
      const s = naechsterSchritt(w);
      if (!s) return { aktion: a, titel: "Programmschritt", problem: "Es gibt keinen offenen Programmschritt." };
      return { aktion: a, titel: `Programmschritt: ${s.schritt.titel}`, kosten: s.schritt.kapital, ...(s.status === "bereit" ? {} : { problem: s.fehlt.length ? `Es fehlt: ${s.fehlt.join(", ")}.` : "Noch nicht bereit." }) };
    }
    case "haushalt": {
      if (!HAUSHALT_HANDLUNGEN.has(a.handlung)) return { aktion: a, titel: a.handlung, problem: "Diese Haushaltshandlung gibt es nicht." };
      const namen: Record<string, string> = {
        mehr_ausgeben: "Staatsausgaben erhöhen",
        sparen: "Staatsausgaben kürzen",
        zentralbank_kritisieren: "Zentralbank öffentlich kritisieren",
        zentralbank_fuehrung_tauschen: "Zentralbankführung austauschen",
      };
      return { aktion: a, titel: namen[a.handlung]!, hinweis: "Wirkt auf Nachfrage, Preise und Märkte; die Vorschau im Erlass-Fenster zeigt die Folgen." };
    }
    case "ereignis": {
      const ev = spiel.ereignisse.find((x) => x.id === a.id);
      if (!ev) return { aktion: a, titel: a.id, problem: "Dieses Ereignis ist nicht (mehr) offen." };
      const o = antworten(w, ev).find((x) => x.id === a.option);
      if (!o) return { aktion: a, titel: a.option, problem: "Diese Antwort gibt es bei dem Ereignis nicht." };
      const pk = o.anzeigePk ?? o.pk;
      return { aktion: a, titel: o.label, kosten: pk, ...(kannZahlen(spiel.kapital, pk) ? {} : { problem: "Dafür fehlt Kapital." }) };
    }
    case "zeit":
      return { aktion: a, titel: `${a.tage} ${a.tage === 1 ? "Tag" : "Tage"} weiter`, hinweis: "Die Zeit hält an, sobald ein Ereignis auf eine Entscheidung wartet." };
  }
}

/** Führt eine geprüfte Aktion aus. Nichts, was `vorschau` als Problem meldet, wird ausgeführt. */
export function fuehreAus(w: World, a: KiAktion): { ok: boolean; text: string; why?: string } {
  const v = vorschau(w, a);
  if (v.problem) return { ok: false, text: `${v.titel}: ${v.problem}` };
  const rng = new Rng(w.rngState);
  w.rngState = (w.rngState + 1) | 0;
  const letztesLog = () => {
    const l = w.log[w.log.length - 1];
    return { text: l?.text ?? "Erledigt.", ...(l?.why ? { why: l.why } : {}) };
  };
  switch (a.art) {
    case "massnahme": {
      const m = massnahmeZiel(w, a) as { id: string; ort: number[] | null; ziel: number };
      const r = bringeEin(w, m.id, m.ziel, m.ort, a.weg === "erlass" ? "erlass" : "gesetz");
      return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
    }
    case "land": {
      const r = fuehreAktionAus(w, a.land, a.handlung as AktionId);
      return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
    }
    case "fraktion": {
      const r = verhandle(w, a.partei, a.handlung as Verhandlung, rng);
      return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
    }
    case "figur": {
      const f = w.spiel!.figuren.find((x) => x.amt === a.amt && x.imAmt)!;
      const r = a.handlung === "gespraech" ? sprichMitFigur(w, f.id) : entlasseFigur(w, a.amt as "finanzen" | "inneres" | "aussen" | "stab", rng);
      return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
    }
    case "programm": {
      const s = naechsterSchritt(w)!;
      const r = starteSchritt(w, s.schritt.id);
      return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
    }
    case "haushalt": {
      if (a.handlung === "mehr_ausgeben") setFiscalImpulse(w, w.economy.fiscalImpulse + 2);
      else if (a.handlung === "sparen") setFiscalImpulse(w, w.economy.fiscalImpulse - 1);
      else if (a.handlung === "zentralbank_kritisieren") criticizeCentralBank(w);
      else replaceGovernor(w, "gefuegig", "eine neue, regierungsnahe Führung");
      return { ok: true, ...letztesLog() };
    }
    case "ereignis": {
      const r = entscheide(w, a.id, a.option, rng);
      return { ok: r.ok, text: r.text };
    }
    case "zeit": {
      const r = laufeZeit(w, a.tage, false);
      return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
    }
  }
}

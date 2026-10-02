// Vorschläge des Sprachmodells: lesen, prüfen, vorführen, ausführen.
// Das Modell darf nur aus dem festen Katalog wählen. Jede Aktion läuft über dieselben Funktionen wie die Bedienung von Hand
// und über dieselben Prüfungen (Kapital, Mehrheit, Abkühlzeiten); was der Kern ablehnt, wird nicht ausgeführt.

import { NET } from "../sim/modell";
import { fold, laufeZeit, ortAusText } from "../sim/befehle";
import { bringeEin, provinzenText, pruefeVorhaben, stufeIn, REGELN } from "../sim/handeln";
import { AKTIONEN, LAENDER, aktionenFuer, fuehreAktionAus, type AktionId } from "../sim/laender";
import { fraktionsUebersicht, verhandle, type Verhandlung } from "../sim/verhandeln";
import { entlasseFigur, sprichMitFigur } from "../sim/eingriffe";
import { naechsterSchritt, starteSchritt } from "../sim/programme";
import { antworten, entscheide } from "../sim/ereignisse";
import { criticizeCentralBank, replaceGovernor } from "../sim/world";
import { POSTEN_NACH_ID, einfacherSchritt, postenVorschau, setzePosten } from "../sim/haushalt";
import { Rng } from "../sim/rng";
import type { World } from "../sim/types";
import type { KiAktion, KiErgebnis, KiVorschau } from "./typen";
import { kannZahlen } from "../sim/kapital";
import { beginne, vorhabenSicht } from "../sim/reich";
import {
  VERFASSUNG_REGELN,
  bringeVerfassungEin,
  kampagnenImpuls,
  paketStimmen,
  pruefeVerfassung,
  referendumPrognose,
  verfassungStimmenKaufen,
  verfassungsZustand,
  zieheVerfassungZurueck,
} from "../sim/verfassung";
import { STIMMUNG_WORT, bewerte, pruefeAngebot, verhandle as verhandleVertrag, vermittle, vermittlungen, type Angebot } from "../sim/abkommen";
import { fuehreKriegHandlungAus, handlungenFuer, kriegMit, PHASEN_NAME, type KriegHandlungId } from "../sim/krieg";
import type { Laufzeit } from "../data/abkommen";

const MAX_AKTIONEN = 3;
const LAND_HANDLUNGEN = new Set<string>(Object.keys(AKTIONEN));
const FRAKTIONS_HANDLUNGEN = new Set<string>(["gespraech", "zugestaendnis", "duldung", "koalition", "abwerben"]);
const FIGUR_AEMTER = new Set(["finanzen", "inneres", "aussen", "stab"]);
const HAUSHALT_HANDLUNGEN = new Set(["posten", "mehr_ausgeben", "sparen", "zentralbank_kritisieren", "zentralbank_fuehrung_tauschen"]);

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
    case "haushalt": {
      if (!istText(o.handlung)) return null;
      const stufe = typeof o.stufe === "number" && Number.isFinite(o.stufe) ? Math.min(2, Math.max(-2, Math.round(o.stufe))) : undefined;
      return { art: "haushalt", handlung: o.handlung.trim(), ...(istText(o.posten) ? { posten: o.posten.trim() } : {}), ...(stufe !== undefined ? { stufe } : {}), ...g };
    }
    case "ereignis":
      return istText(o.id) && istText(o.option) ? { art: "ereignis", id: o.id.trim(), option: o.option.trim(), ...g } : null;
    case "vorhaben":
      return istText(o.id) ? { art: "vorhaben", id: o.id.trim(), ...g } : null;
    case "verfassung": {
      if (!istText(o.handlung)) return null;
      const paket = o.paket && typeof o.paket === "object" ? Object.fromEntries(Object.entries(o.paket as Record<string, unknown>).filter(([, x]) => istText(x)).map(([k, x]) => [k.trim(), (x as string).trim()]).slice(0, 8)) : undefined;
      return { art: "verfassung", handlung: o.handlung.trim(), ...(paket && Object.keys(paket).length ? { paket } : {}), ...g };
    }
    case "abkommen": {
      if (!istText(o.land)) return null;
      const liste = (x: unknown) => (Array.isArray(x) ? x.filter(istText).map((t) => t.trim()).slice(0, 8) : []);
      const jahre = typeof o.jahre === "number" ? Math.round(o.jahre) : undefined;
      return { art: "abkommen", land: o.land.trim(), bieten: liste(o.bieten), verlangen: liste(o.verlangen), ...(jahre !== undefined ? { jahre } : {}), ...g };
    }
    case "vermittlung":
      return istText(o.id) ? { art: "vermittlung", id: o.id.trim(), ...g } : null;
    case "krieg":
      return istText(o.land) && istText(o.handlung) ? { art: "krieg", land: o.land.trim(), handlung: o.handlung.trim(), ...g } : null;
    case "zeit": {
      const tage = typeof o.tage === "number" && Number.isFinite(o.tage) ? Math.min(90, Math.max(1, Math.round(o.tage))) : 0;
      return tage ? { art: "zeit", tage, ...g } : null;
    }
    default:
      return null;
  }
}

const nfs = (x: number) => x.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Welcher Haushaltsposten auf welche Stufe gestellt werden soll; die einfachen Handlungen wählen einen Posten selbst. */
function haushaltsposten(w: World, a: Extract<KiAktion, { art: "haushalt" }>): { id: string; stufe: number } | { fehler: string } {
  if (a.handlung === "mehr_ausgeben" || a.handlung === "sparen") {
    const s = einfacherSchritt(w, a.handlung === "sparen" ? "sparen" : "mehr");
    return s ?? { fehler: "Alle Ausgabenposten stehen schon am Rand." };
  }
  if (!a.posten || !POSTEN_NACH_ID[a.posten]) return { fehler: `„${a.posten ?? ""}“ ist kein Haushaltsposten dieses Spiels.` };
  if (a.stufe === undefined) return { fehler: "Es fehlt die Stufe (−2 bis +2)." };
  return { id: a.posten, stufe: a.stufe };
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
      // INN-2: Die Antwort nennt die Umsetzungsdauer — beschlossen ist nicht umgesetzt
      const dauer = `Umsetzung läuft über etwa ${pr.monate} ${pr.monate === 1 ? "Monat" : "Monate"}.`;
      if (a.weg === "erlass") {
        if (!pr.erlass.moeglich) return { aktion: a, titel, problem: pr.erlass.grund ?? "Als Erlass nicht möglich." };
        return { aktion: a, titel, kosten: pr.erlass.pk, hinweis: dauer, ...(pr.erlass.bezahlbar ? {} : { problem: "Dafür fehlt Kapital." }) };
      }
      const mehrheit = pr.gesetz.stimmen.erwartet >= 301 ? `Mehrheit steht (erwartet ${pr.gesetz.stimmen.erwartet} Stimmen).` : `Es fehlen etwa ${pr.gesetz.stimmen.luecke} Stimmen zur Mehrheit.`;
      return { aktion: a, titel, kosten: pr.gesetz.pk, hinweis: `${mehrheit} Abstimmung in ${pr.gesetz.tage} Tagen. ${dauer}`, ...(pr.gesetz.bezahlbar ? {} : { problem: "Dafür fehlt Kapital." }) };
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
      if (a.handlung === "zentralbank_kritisieren") return { aktion: a, titel: "Zentralbank öffentlich kritisieren", hinweis: "Wirkt auf Märkte und Glaubwürdigkeit; die Zentralbank-Ansicht zeigt die Folgen." };
      if (a.handlung === "zentralbank_fuehrung_tauschen") return { aktion: a, titel: "Zentralbankführung austauschen", hinweis: "Wirkt auf Märkte und Glaubwürdigkeit; das Zentralbankgesetz kann die Führung schützen." };
      const posten = haushaltsposten(w, a);
      if ("fehler" in posten) return { aktion: a, titel: a.posten ?? a.handlung, problem: posten.fehler };
      const p = POSTEN_NACH_ID[posten.id]!;
      const titel = `${p.name}: Stufe ${posten.stufe > 0 ? "+" : ""}${posten.stufe}`;
      const v = postenVorschau(w, posten.id, posten.stufe);
      if (v.delta === 0) return { aktion: a, titel, problem: "Der Posten steht schon auf dieser Stufe." };
      return { aktion: a, titel, kosten: v.kapital, hinweis: `Defizit ${nfs(v.defizitVorher)} auf ${nfs(v.defizitNachher)} % des BIP. ${p.kehrseite}`, ...(v.ok ? {} : { problem: v.grund ?? "Geht gerade nicht." }) };
    }
    case "ereignis": {
      const ev = spiel.ereignisse.find((x) => x.id === a.id);
      if (!ev) return { aktion: a, titel: a.id, problem: "Dieses Ereignis ist nicht (mehr) offen." };
      const o = antworten(w, ev).find((x) => x.id === a.option);
      if (!o) return { aktion: a, titel: a.option, problem: "Diese Antwort gibt es bei dem Ereignis nicht." };
      const pk = o.anzeigePk ?? o.pk;
      return { aktion: a, titel: o.label, kosten: pk, ...(kannZahlen(spiel.kapital, pk) ? {} : { problem: "Dafür fehlt Kapital." }) };
    }
    case "vorhaben": {
      const sicht = vorhabenSicht(w, a.id);
      if (!sicht) return { aktion: a, titel: a.id, problem: `„${a.id}“ ist kein Vorhaben dieses Spiels.` };
      const v = sicht.v;
      const titel = `Beginn: ${v.name}`;
      if (sicht.status === "fertig") return { aktion: a, titel, problem: "Es ist schon fertig." };
      if (sicht.status === "im_bau" || sicht.status === "pausiert") return { aktion: a, titel, problem: "Es läuft bereits." };
      if (sicht.status === "gesperrt" || sicht.status === "ausgeschlossen") return { aktion: a, titel, problem: sicht.grund ?? "Es ist gesperrt." };
      const fehlt = sicht.voraus.filter((x) => !x.erfuellt).map((x) => x.text);
      if (fehlt.length) return { aktion: a, titel, problem: `Voraussetzungen fehlen: ${fehlt.join("; ")}.` };
      if (!sicht.bezahlbar) return { aktion: a, titel, kosten: v.kosten.pk, problem: "Dafür fehlt Kapital." };
      if (!sicht.verwaltungOk) return { aktion: a, titel, kosten: v.kosten.pk, problem: "Die Verwaltungskraft reicht dafür nicht." };
      return { aktion: a, titel, kosten: v.kosten.pk, hinweis: `Etwa ${v.kosten.monate} Monate Bauzeit. ${v.kehrseite}` };
    }
    case "verfassung": {
      const z = verfassungsZustand(w);
      const v = z.laufend;
      if (a.handlung === "einbringen") {
        if (!a.paket || !Object.keys(a.paket).length) return { aktion: a, titel: "Verfassungspaket einbringen", problem: "Es fehlt das Paket: Artikel-Kennung auf Varianten-Kennung, zum Beispiel { wahlrecht: \"fuenf\" }." };
        const pr = pruefeVerfassung(w, a.paket);
        const titel = `Verfassungspaket einbringen (${pr.geaendert} ${pr.geaendert === 1 ? "Artikel" : "Artikel"})`;
        if (!pr.ok) return { aktion: a, titel, problem: pr.grund ?? "So nicht möglich." };
        return { aktion: a, titel, kosten: pr.pk, hinweis: `Erwartet ${pr.stimmen.erwartet} Ja (Spanne ${pr.stimmen.tief} bis ${pr.stimmen.hoch}); ab ${VERFASSUNG_REGELN.direkt} direkt Gesetz, ab ${VERFASSUNG_REGELN.mehrheit} Volksabstimmung.` };
      }
      if (a.handlung === "zurueckziehen") {
        if (!v || v.phase !== "parlament") return { aktion: a, titel: "Verfassungspaket zurückziehen", problem: "Es liegt kein Paket zur Abstimmung vor." };
        return { aktion: a, titel: "Verfassungspaket zurückziehen", hinweis: "Ein Teil des Kapitals kommt zurück; die Amtszeit hat ihre Verfassungsdebatte hinter sich." };
      }
      if (a.handlung === "stimmen_kaufen") {
        if (!v || v.phase !== "parlament") return { aktion: a, titel: "Stimmen für das Verfassungspaket kaufen", problem: "Es liegt kein Paket zur Abstimmung vor." };
        const sicht = paketStimmen(w, v.paket, v.absprachen);
        const ziel = sicht.erwartet >= VERFASSUNG_REGELN.mehrheit ? VERFASSUNG_REGELN.direkt + VERFASSUNG_REGELN.stimmenPuffer : VERFASSUNG_REGELN.mehrheit + VERFASSUNG_REGELN.stimmenPuffer;
        const noetig = Math.max(0, ziel - sicht.erwartet);
        if (!noetig) return { aktion: a, titel: "Stimmen für das Verfassungspaket kaufen", problem: "Die nächste Hürde gilt der Prognose nach als gesichert." };
        const kosten = Math.ceil(noetig * REGELN.kaufKostenProStimme * VERFASSUNG_REGELN.kaufFaktor);
        return { aktion: a, titel: `${noetig} Stimmen für das Verfassungspaket sichern`, kosten, ...(kannZahlen(spiel.kapital, kosten) ? {} : { problem: "Dafür fehlt Kapital." }) };
      }
      if (a.handlung === "kampagne") {
        if (!v || v.phase !== "kampagne") return { aktion: a, titel: "Referendum-Kampagne", problem: "Es läuft gerade keine Kampagne zu einer Volksabstimmung." };
        const p = referendumPrognose(w);
        return { aktion: a, titel: "Kampagnen-Impuls fürs Referendum", kosten: VERFASSUNG_REGELN.kampagnePk, ...(p ? { hinweis: `Erwartet etwa ${p.mitte.toLocaleString("de-DE", { maximumFractionDigits: 1 })} Prozent Ja.` } : {}) };
      }
      return { aktion: a, titel: `Verfassung: ${a.handlung}`, problem: "Diese Handlung gibt es nicht (einbringen, zurueckziehen, stimmen_kaufen, kampagne)." };
    }
    case "abkommen": {
      const def = LAENDER.find((l) => l.id === a.land);
      if (!def) return { aktion: a, titel: a.land, problem: `„${a.land}“ ist kein Land dieses Spiels.` };
      const jahre = (a.jahre ?? 5) as Laufzeit;
      const angebot: Angebot = { land: def.id, gibt: a.bieten, will: a.verlangen, jahre };
      const titel = `Vertrag mit ${def.dat}: ${a.bieten.length + a.verlangen.length} Klauseln, ${jahre} Jahre`;
      const mangel = pruefeAngebot(w, angebot);
      if (mangel) return { aktion: a, titel, problem: mangel };
      const b = bewerte(w, angebot);
      if (!kannZahlen(spiel.kapital, b.pk)) return { aktion: a, titel, kosten: b.pk, problem: "Dafür fehlt Kapital." };
      if (b.urteil === "veto") return { aktion: a, titel, kosten: b.pk, problem: b.veto ?? "Eine Rote Linie der Gegenseite." };
      const erwartet = b.urteil === "zustimmung" ? "Die Gegenseite würde zustimmen." : b.urteil === "gegenangebot" ? "Die Gegenseite würde ein Gegenangebot machen." : `Die Gegenseite ist ${STIMMUNG_WORT[b.stimmung].toLowerCase()} und würde ablehnen.`;
      return { aktion: a, titel, kosten: b.pk, hinweis: erwartet };
    }
    case "vermittlung": {
      const v = vermittlungen(w).find((x) => x.def.id === a.id);
      if (!v) return { aktion: a, titel: a.id, problem: "Diese Vermittlung gibt es nicht." };
      const titel = `Vermittlung: ${v.def.titel}`;
      return { aktion: a, titel, kosten: v.def.pk, hinweis: `Aussicht etwa ${v.aussicht} Prozent.`, ...(v.moeglich ? {} : { problem: v.grund ?? "Geht gerade nicht." }) };
    }
    case "krieg": {
      const def = LAENDER.find((l) => l.id === a.land);
      if (!def) return { aktion: a, titel: a.land, problem: `„${a.land}“ ist kein Land dieses Spiels.` };
      const k = kriegMit(w, def.id);
      if (!k) return { aktion: a, titel: def.name, problem: "Es gibt keinen aktiven Konfliktvorgang mit diesem Land." };
      const s = handlungenFuer(w, k.id).find((x) => x.id === a.handlung);
      const titel = `${PHASEN_NAME[k.phase]} mit ${def.dat}: ${a.handlung}`;
      if (!s) return { aktion: a, titel, problem: "Diese Handlung gibt es in dieser Phase nicht." };
      return { aktion: a, titel: `${PHASEN_NAME[k.phase]} mit ${def.dat}: ${s.label}`, kosten: s.pk, hinweis: s.hinweis, ...(s.moeglich ? {} : { problem: s.grund ?? "Geht gerade nicht." }) };
    }
    case "zeit":
      return { aktion: a, titel: `${a.tage} ${a.tage === 1 ? "Tag" : "Tage"} weiter`, hinweis: "Die Zeit hält an, sobald ein Ereignis auf eine Entscheidung wartet." };
    case "verfassung":
      // Fremdmodul (Rohzustand, anderer Agent): geduldet, aber bewusst nicht verdrahtet
      return { aktion: a, titel: "Verfassungspaket", problem: "Der Verfassungsvorgang ist in diesem Stand noch nicht an die Ausführung angeschlossen." };
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
      if (a.handlung === "zentralbank_kritisieren") criticizeCentralBank(w);
      else if (a.handlung === "zentralbank_fuehrung_tauschen") replaceGovernor(w, "gefuegig", "eine neue, regierungsnahe Führung");
      else {
        const posten = haushaltsposten(w, a) as { id: string; stufe: number };
        const r = setzePosten(w, posten.id, posten.stufe);
        return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
      }
      return { ok: true, ...letztesLog() };
    }
    case "ereignis": {
      const r = entscheide(w, a.id, a.option, rng);
      return { ok: r.ok, text: r.text };
    }
    case "vorhaben": {
      const r = beginne(w, a.id);
      return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
    }
    case "verfassung": {
      if (a.handlung === "einbringen") {
        const r = bringeVerfassungEin(w, a.paket ?? {});
        return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
      }
      if (a.handlung === "zurueckziehen") {
        const r = zieheVerfassungZurueck(w);
        return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
      }
      if (a.handlung === "stimmen_kaufen") {
        const v = verfassungsZustand(w).laufend!;
        const sicht = paketStimmen(w, v.paket, v.absprachen);
        const ziel = sicht.erwartet >= VERFASSUNG_REGELN.mehrheit ? VERFASSUNG_REGELN.direkt + VERFASSUNG_REGELN.stimmenPuffer : VERFASSUNG_REGELN.mehrheit + VERFASSUNG_REGELN.stimmenPuffer;
        const r = verfassungStimmenKaufen(w, Math.max(1, ziel - sicht.erwartet));
        return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
      }
      const r = kampagnenImpuls(w);
      return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
    }
    case "abkommen": {
      const r = verhandleVertrag(w, { land: a.land, gibt: a.bieten, will: a.verlangen, jahre: (a.jahre ?? 5) as Laufzeit });
      const gegen = r.bewertung?.gegenangebote[0]?.text;
      const why = [r.why, gegen ? `${gegen} Zum Annehmen den Verhandlungstisch in der Welt öffnen.` : ""].filter(Boolean).join(" ");
      return { ok: r.ok, text: r.text, ...(why ? { why } : {}) };
    }
    case "vermittlung": {
      const r = vermittle(w, a.id, rng);
      return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
    }
    case "krieg": {
      const k = kriegMit(w, a.land)!;
      const r = fuehreKriegHandlungAus(w, k.id, a.handlung as KriegHandlungId, rng);
      return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
    }
    case "zeit": {
      const r = laufeZeit(w, a.tage, false);
      return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
    }
    case "verfassung":
      // Fremdmodul (Rohzustand, anderer Agent): geduldet, aber bewusst nicht verdrahtet
      return { ok: false, text: "Der Verfassungsvorgang ist in diesem Stand noch nicht an die Ausführung angeschlossen." };
  }
}

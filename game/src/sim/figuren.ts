// Die Menschen um den Präsidenten: Namen sind erfunden (Entscheidungen, Block B), Rollen und Ziele
// folgen den Ämtern der Türkei. Jede Figur will etwas und reagiert auf Entscheidungen.
// Sinkt die Loyalität stark, drohen Rücktritt, Bruch der Koalition oder offene Kritik.

import { NET } from "./modell";
import { addLog } from "./log";
import { Rng } from "./rng";
import { eigenVon, merke } from "./personen";
import type { LagerArt, Stil } from "./personen-typen";
import type { World } from "./types";
import type { Figur } from "./spiel-typen";
import { aktuelleSprache, t, tIn } from "../i18n";

const VORNAMEN_F = ["Selin", "Derya", "Zeynep", "Nilay", "Melis", "Pınar", "Gizem", "Ebru", "Sevgi", "Nazlı", "Ilgın", "Damla", "Aylin", "Defne", "Hande"];
const VORNAMEN_M = ["Kaan", "Barış", "Emre", "Tolga", "Volkan", "Onur", "Serkan", "Levent", "Murat", "Cengiz", "Orhan", "Taner", "Cem", "Burak", "Mert"];
const NACHNAMEN = ["Yücel", "Karaca", "Erdem", "Aksoy", "Kılıç", "Tunç", "Arıkan", "Özgür", "Bozkurt", "Çelik", "Sarı", "Koçak", "Ateş", "Işık", "Uysal", "Yalçın", "Duran", "Güler", "Polat", "Demirci", "Kaplan", "Sezer", "Turan", "Akın"];

interface RollenSpec {
  id: string;
  amt: Figur["amt"];
  rolle: (w: World) => string;
  ziel: string;
  start: number;
  weiblich: boolean;
}

const ROLLEN: RollenSpec[] = [
  { id: "finanzen", amt: "finanzen", rolle: () => t("figur.rolle.finanzen"), ziel: "figur.ziel.finanzen", start: 62, weiblich: false },
  { id: "inneres", amt: "inneres", rolle: () => t("figur.rolle.inneres"), ziel: "figur.ziel.inneres", start: 60, weiblich: true },
  { id: "aussen", amt: "aussen", rolle: () => t("figur.rolle.aussen"), ziel: "figur.ziel.aussen", start: 58, weiblich: false },
  { id: "zentralbank", amt: "zentralbank", rolle: () => t("figur.rolle.zentralbank"), ziel: "figur.ziel.zentralbank", start: 50, weiblich: true },
  { id: "stab", amt: "stab", rolle: () => t("figur.rolle.stab"), ziel: "figur.ziel.stab", start: 75, weiblich: true },
  { id: "opposition", amt: "opposition", rolle: () => t("figur.rolle.opposition"), ziel: "figur.ziel.opposition", start: 25, weiblich: false },
];

/** Weitere Ämter, die das Umfeld seit dem Ausbau der Personen tragen: Justiz, Streitkräfte, Wirtschaft. Eigener Zufallsstrom, damit alte Partien gleich bleiben. */
const ZUSATZ_ROLLEN: RollenSpec[] = [
  { id: "justiz", amt: "justiz", rolle: () => t("figur.rolle.justiz"), ziel: "figur.ziel.justiz", start: 55, weiblich: true },
  { id: "generalstab", amt: "generalstab", rolle: () => t("figur.rolle.generalstab"), ziel: "figur.ziel.generalstab", start: 52, weiblich: false },
  { id: "wirtschaft", amt: "wirtschaft", rolle: () => t("figur.rolle.wirtschaft"), ziel: "figur.ziel.wirtschaft", start: 60, weiblich: false },
];

function name(rng: Rng, benutzt: Set<string>, weiblich?: boolean): string {
  for (;;) {
    const frau = weiblich ?? rng.next() < 0.5;
    const vor = frau ? VORNAMEN_F : VORNAMEN_M;
    const n = `${vor[Math.floor(rng.next() * vor.length)]!} ${NACHNAMEN[Math.floor(rng.next() * NACHNAMEN.length)]!}`;
    if (!benutzt.has(n)) {
      benutzt.add(n);
      return n;
    }
  }
}

/** Ein Name, der im Umfeld noch nicht vorkommt. */
export const neuerName = name;

/** Erzeugt das Umfeld beim Amtsantritt. Das Regierungslager hat als Partner den Vorsitz der Bündnispartei. */
export function erzeugeFiguren(world: World, rng: Rng): Figur[] {
  const benutzt = new Set<string>();
  const figuren: Figur[] = ROLLEN.map((r) => ({
    id: r.id,
    name: name(rng, benutzt, r.weiblich),
    weiblich: r.weiblich,
    rolle: r.rolle(world),
    amt: r.amt,
    ziel: t(r.ziel),
    loyalitaet: r.start,
    imAmt: true,
  }));
  const partner = world.player?.buendnis;
  if (partner) {
    figuren.push({
      id: "partner",
      name: name(rng, benutzt, false),
      weiblich: false,
      rolle: t("wahl.ereignis.koalition.vorsitz", { partei: partner }),
      amt: "partner",
      ziel: t("figur.ziel.partner"),
      loyalitaet: 55,
      imAmt: true,
      partei: partner,
    });
  }
  figuren.push(...zusatzFiguren(world, figuren, new Rng((world.seed ^ 0x51ed) | 0)));
  for (const f of figuren) lokalisiereFigur(f);
  return figuren;
}

function zusatzFiguren(world: World, vorhanden: Figur[], rng: Rng): Figur[] {
  const benutzt = new Set(vorhanden.map((f) => f.name));
  return ZUSATZ_ROLLEN.filter((r) => !vorhanden.some((f) => f.amt === r.amt)).map((r) => ({
    id: r.id,
    name: name(rng, benutzt, r.weiblich),
    weiblich: r.weiblich,
    rolle: r.rolle(world),
    amt: r.amt,
    ziel: t(r.ziel),
    loyalitaet: r.start,
    imAmt: true,
  }));
}

/** Rollen und Ziele, die als fertiger Text im Spielstand liegen, in die aktuelle Sprache bringen (beim Laden und nach dem Anlegen). */
export function lokalisiereFiguren(world: World): void {
  if (aktuelleSprache() === "de") return;
  const sp = world.spiel;
  if (!sp) return;
  for (const f of [...sp.figuren, ...(sp.ehemalige ?? [])]) lokalisiereFigur(f);
}

const VORSITZ = [/^Vorsitz der (.+)$/, /^Leader of the (.+)$/, /^(.+) genel başkanı$/];

/** Eine Figur: Amtsbezeichnung aus dem Amt, Ziel nur, wenn es das bekannte Standardziel ist (in irgendeiner Sprache). */
export function lokalisiereFigur(f: { amt: string; rolle: string; ziel?: string; partei?: string }): void {
  if (aktuelleSprache() === "de") return;
  if (f.amt === "partner") {
    for (const re of VORSITZ) {
      const m = re.exec(f.rolle);
      if (m) {
        f.rolle = t("wahl.ereignis.koalition.vorsitz", { partei: m[1]! });
        break;
      }
    }
  } else if (ROLLEN.some((r) => r.amt === f.amt) || ZUSATZ_ROLLEN.some((r) => r.amt === f.amt)) {
    f.rolle = t(`figur.rolle.${f.amt}`);
  }
  if (f.ziel === undefined) return;
  const key = `figur.ziel.${f.amt}`;
  for (const s of ["de", "en", "tr"] as const) {
    if (f.ziel === tIn(s, key)) {
      f.ziel = t(key);
      return;
    }
  }
}

/** Ältere Spielstände haben die neuen Ämter noch nicht: sie werden einmal ergänzt. */
export function ergaenzeFiguren(world: World): void {
  const sp = world.spiel;
  if (!sp) return;
  const fehlen = ZUSATZ_ROLLEN.some((r) => !sp.figuren.some((f) => f.amt === r.amt));
  if (!fehlen) return;
  sp.figuren.push(...zusatzFiguren(world, sp.figuren, new Rng((world.seed ^ 0x51ed ^ Math.imul(world.day, 2654435761)) | 0)));
}

export function figur(world: World, amt: Figur["amt"]): Figur | undefined {
  return world.spiel?.figuren.find((f) => f.amt === amt);
}

export function anrede(f: Figur | undefined): string {
  return f ? `${f.rolle} ${f.name}` : "";
}

function aendere(world: World, f: Figur | undefined, delta: number, grund?: string): void {
  if (!f) return;
  const vorher = f.loyalitaet;
  f.loyalitaet = Math.min(100, Math.max(0, f.loyalitaet + delta));
  if (grund && Math.abs(delta) >= 3 && Math.floor(vorher / 25) !== Math.floor(f.loyalitaet / 25)) {
    addLog(world, "ereignis", t(f.loyalitaet > vorher ? "figur.log.bessert" : "figur.log.kippt", { wer: anrede(f) }), grund);
  }
}

/** Loyalität einer Figur ändern, mit Hinweis im Protokoll bei Überschreiten einer Viertelgrenze (für die Parteilinie, sim/linie.ts). */
export function figurLoyalitaetAendern(world: World, f: Figur | undefined, delta: number, grund?: string): void {
  aendere(world, f, delta, grund);
}

/** Figuren reagieren auf eine Änderung: erhöht (+1) oder gesenkt (−1). */
export function reagiereFiguren(world: World, theme: string, massnahme: string, richtung: number): void {
  const spiel = world.spiel;
  if (!spiel || richtung === 0) return;
  const node = NET.nodes[NET.index.get(massnahme) ?? -1];
  const kosten = node?.cost ?? 0;
  // Finanzminister: Ausgaben ärgern ihn, Sparen und Einnahmen freuen ihn
  if (kosten > 0) aendere(world, figur(world, "finanzen"), -richtung * 1.5, t("figur.grund.finanzenAusgaben"));
  else if (kosten < 0) aendere(world, figur(world, "finanzen"), richtung * 1.0, t("figur.grund.finanzenEinnahmen"));
  // Innenministerin: Sicherheit
  if (theme === "sicherheit" || massnahme === "m_grenzschutz") aendere(world, figur(world, "inneres"), richtung * 2, t("figur.grund.inneres"));
  // Außenminister: Außenbeziehungen und Integration
  if (theme === "aussen") aendere(world, figur(world, "aussen"), richtung * 1.5, t("figur.grund.aussen"));
  // Justizministerin: Gerichte und Ausnahmerecht
  if (theme === "recht") aendere(world, figur(world, "justiz"), richtung * (massnahme === "m_notstand" ? -2 : 1.5), t("figur.grund.justiz"));
  // Generalstab: Verteidigung und Truppe
  if (theme === "militaer") aendere(world, figur(world, "generalstab"), richtung * (massnahme === "m_offiziersauswahl" ? 0.5 : 2), t("figur.grund.generalstab"));
  // Wirtschaftsminister: Förderung freut, Auflagen und Eingriffe ärgern
  if (theme === "wirtschaft") aendere(world, figur(world, "wirtschaft"), richtung * (WIRTSCHAFT_EINGRIFF[massnahme] ?? 1.2), t("figur.grund.wirtschaft"));
  // Opposition: ein Präsident, der viel durchsetzt, ärgert sie
  aendere(world, figur(world, "opposition"), -0.3);
}

/** Maßnahmen der Wirtschaft, die Betriebe belasten statt fördern (Vorzeichen der Reaktion des Wirtschaftsministers). */
const WIRTSCHAFT_EINGRIFF: Record<string, number> = { m_mindestlohn: -1, m_preiskontrollen: -1.5, m_zoelle: -0.5 };

/** Öffentliche Kritik an der Zentralbank verärgert die Gouverneurin. */
export function zentralbankGekraenkt(world: World, delta: number): void {
  aendere(world, figur(world, "zentralbank"), delta, t("figur.grund.zentralbank"));
}

/** Wer geht, merkt sich den Streit: Der Ehemalige kann später gegen den Präsidenten aussagen. */
export function ehemaligeMerken(world: World, f: Figur, grund: string, groll?: number): void {
  const sp = world.spiel;
  if (!sp) return;
  const e = eigenVon(world, f);
  const g = groll ?? Math.min(100, Math.max(0, 35 + e.groll * 0.5 + (f.loyalitaet < 30 ? 20 : 0)));
  (sp.ehemalige ??= []).push({ name: f.name, ...(f.weiblich !== undefined ? { weiblich: f.weiblich } : {}), amt: f.amt, rolle: f.rolle, ausgeschieden: world.day, groll: Math.round(g), ehrgeiz: e.ehrgeiz, lager: e.lager, grund, ausgepackt: false });
  if (sp.ehemalige.length > 12) sp.ehemalige.shift();
}

export interface Besetzung {
  name: string;
  weiblich?: boolean;
  loyalitaet: number;
  stil?: Stil;
  faehigkeit?: number;
  ehrgeiz?: number;
  lager?: LagerArt;
  kommissarisch?: boolean;
  notiz?: string;
}

/** Setzt einen neuen Menschen auf das Amt: Name, Loyalität und Profil ändern sich, Rolle und Aufgabe bleiben. */
export function besetzeNeu(world: World, f: Figur, b: Besetzung): void {
  f.name = b.name;
  if (b.weiblich !== undefined) f.weiblich = b.weiblich;
  f.loyalitaet = b.loyalitaet;
  f.imAmt = true;
  delete f.gespraech;
  delete f.eigen;
  const e = eigenVon(world, f);
  if (b.stil) e.stil = b.stil;
  if (b.faehigkeit !== undefined) e.faehigkeit = b.faehigkeit;
  if (b.ehrgeiz !== undefined) e.ehrgeiz = b.ehrgeiz;
  if (b.lager) e.lager = b.lager;
  e.seit = world.day;
  e.einarbeitungBis = world.day + 60;
  if (b.kommissarisch) e.kommissarisch = true;
  if (b.notiz) merke(world, f, b.notiz);
}

/** Ersetzt ein Regierungsmitglied durch eine kommissarische Leitung (etwa nach einer Affäre); ein Nachfolger lässt sich danach ernennen. */
export function ersetze(world: World, amt: Figur["amt"], rng: Rng): Figur | undefined {
  const alt = figur(world, amt);
  const spiel = world.spiel;
  if (!alt || !spiel) return undefined;
  const benutzt = new Set(spiel.figuren.map((f) => f.name));
  const spec = ROLLEN.find((r) => r.amt === amt) ?? ZUSATZ_ROLLEN.find((r) => r.amt === amt);
  const neu = name(rng, benutzt, spec?.weiblich);
  const loyal = Math.round(50 + rng.between(-8, 16));
  const vorher = `${alt.rolle} ${alt.name}`;
  ehemaligeMerken(world, alt, t("figur.affaere"), 60);
  besetzeNeu(world, alt, { name: neu, loyalitaet: loyal, kommissarisch: true, notiz: t("figur.kommissarisch", { vorher }) });
  if (spec) alt.ziel = t(spec.ziel);
  return alt;
}

/** Wie gern die Figur dem Präsidenten noch folgt, in Worten. */
export function haltung(f: Figur): string {
  if (f.loyalitaet >= 75) return t("figur.haltung.loyal");
  if (f.loyalitaet >= 55) return t("figur.haltung.verlaesslich");
  if (f.loyalitaet >= 35) return t("figur.haltung.distanziert");
  if (f.loyalitaet >= 20) return t("figur.haltung.veraergert");
  return t("figur.haltung.bruch");
}

/** Für Ereignisse und Handlungen des Spielers: die Loyalität einer Figur verschieben. */
export function loyalitaetAendern(world: World, amt: Figur["amt"], delta: number, grund?: string): void {
  aendere(world, figur(world, amt), delta, grund);
}

/** Der Vorsitz einer Partnerpartei als Figur mit eigenem Namen. */
export function partnerFigur(world: World, partei: string, rolle: string, ziel: string, rng: Rng): Figur {
  const benutzt = new Set((world.spiel?.figuren ?? []).map((f) => f.name));
  const weiblich = rng.next() < 0.35;
  const f: Figur = { id: `partner-${partei}`, name: name(rng, benutzt, weiblich), weiblich, rolle, amt: "partner", ziel, loyalitaet: 55, imAmt: true, partei };
  lokalisiereFigur(f);
  return f;
}

/** Ein neuer, noch nicht vergebener Name für Nebenfiguren in Ereignissen (Bürgermeister, Chefredakteure, Vorstände). */
export function zufallsName(world: World, rng: Rng): string {
  const benutzt = new Set((world.spiel?.figuren ?? []).map((f) => f.name));
  return name(rng, benutzt);
}

/** Wie das Kabinett auf die Änderung einer Maßnahme reagieren würde (dieselben Regeln wie `reagiereFiguren`), als Text für die Vorschau. */
export function kabinettReaktion(world: World, massnahme: string, richtung: 1 | -1): { wer: string; text: string; mehr: boolean }[] {
  const spiel = world.spiel;
  const node = NET.nodes[NET.index.get(massnahme) ?? -1];
  if (!spiel || !node) return [];
  const out: { wer: string; text: string; mehr: boolean }[] = [];
  const kosten = node.cost ?? 0;
  const f = figur(world, "finanzen");
  if (f && kosten > 0) out.push({ wer: `${f.rolle} ${f.name}`, text: richtung > 0 ? t("figur.reaktion.ausgabenOhneDeckung") : t("figur.reaktion.wenigerAusgaben"), mehr: richtung < 0 });
  else if (f && kosten < 0) out.push({ wer: `${f.rolle} ${f.name}`, text: richtung > 0 ? t("figur.reaktion.mehrEinnahmen") : t("figur.reaktion.wenigerEinnahmen"), mehr: richtung > 0 });
  const i = figur(world, "inneres");
  if (i && (node.theme === "sicherheit" || massnahme === "m_grenzschutz")) out.push({ wer: `${i.rolle} ${i.name}`, text: richtung > 0 ? t("figur.reaktion.sicherheitPlus") : t("figur.reaktion.sicherheitMinus"), mehr: richtung > 0 });
  const j = figur(world, "justiz");
  if (j && node.theme === "recht") out.push({ wer: `${j.rolle} ${j.name}`, text: massnahme === "m_notstand" ? (richtung > 0 ? t("figur.reaktion.gerichteMinus") : t("figur.reaktion.gerichtePlus")) : richtung > 0 ? t("figur.reaktion.gerichtePlus") : t("figur.reaktion.gerichteMinus"), mehr: massnahme === "m_notstand" ? richtung < 0 : richtung > 0 });
  const gs = figur(world, "generalstab");
  if (gs && node.theme === "militaer") out.push({ wer: `${gs.rolle} ${gs.name}`, text: richtung > 0 ? t("figur.reaktion.truppePlus") : t("figur.reaktion.truppeMinus"), mehr: richtung > 0 });
  const wi = figur(world, "wirtschaft");
  if (wi && node.theme === "wirtschaft") {
    const f = WIRTSCHAFT_EINGRIFF[massnahme] ?? 1.2;
    out.push({ wer: `${wi.rolle} ${wi.name}`, text: f * richtung > 0 ? t("figur.reaktion.betriebePlus") : t("figur.reaktion.betriebeMinus"), mehr: f * richtung > 0 });
  }
  const a = figur(world, "aussen");
  if (a && node.theme === "aussen") out.push({ wer: `${a.rolle} ${a.name}`, text: richtung > 0 ? t("figur.reaktion.aussenPlus") : t("figur.reaktion.aussenMinus"), mehr: richtung > 0 });
  return out;
}

// Verhandlungen mit den Fraktionen des Parlaments. Ohne eigene Mehrheit ist das der Kern des Regierens:
// Gespräche machen offen, Zugeständnisse besänftigen, eine Duldung liefert Stimmen auf Zeit, ein Bündnis auf Dauer.
// Jede Unterstützung hat einen Preis (Kapital jetzt, eine Zusage später); wer Zusagen bricht, verbrennt Vertrauen.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung).

import { addLog } from "./log";
import { vertrauenAendern, wirke } from "./wirkung";
import { addDays, formatDateDe } from "./dates";
import { partnerFigur } from "./figuren";
import { AUSRICHTUNG, DULDUNG_QUOTE, PARTEI_NAME, forderungVon, bereitschaftAendern, bereitschaftWort, fraktion, startBereitschaft } from "./fraktionen";
import type { Ergebnis } from "./handeln";
import type { Rng } from "./rng";
import type { World } from "./types";
import { kannZahlen, verfuegbar } from "./kapital";
import { AUFMERKSAMKEIT_KOSTEN, neuanfangGrund, verbrauche } from "./aufmerksamkeit";

/** Aufmerksamkeit je Verhandlungsschritt: Das Gespräch ist Routine, der Pakt ein Vorgang. */
const AUFMERKSAMKEIT: Record<Verhandlung, number> = {
  gespraech: AUFMERKSAMKEIT_KOSTEN.verhandlungGespraech,
  zugestaendnis: AUFMERKSAMKEIT_KOSTEN.zugestaendnis,
  duldung: AUFMERKSAMKEIT_KOSTEN.duldung,
  koalition: AUFMERKSAMKEIT_KOSTEN.koalition,
  abwerben: AUFMERKSAMKEIT_KOSTEN.abwerben,
};

export type Verhandlung = "gespraech" | "zugestaendnis" | "duldung" | "koalition" | "abwerben";

export const VERHANDLUNG = {
  gespraechAbkuehlung: 30,
  zugestaendnisAbkuehlung: 120,
  duldungTage: 180,
  koalitionZusageTage: 150,
  duldungMin: 40,
  koalitionMin: 55,
} as const;

const pkGespraech = 1;
const pkZugestaendnis = 3;
const pkDuldung = (sitze: number) => 2 + Math.ceil(sitze / 40);
const pkKoalition = (sitze: number) => 4 + Math.ceil(sitze / 30);
const pkAbwerben = (sitze: number) => 5 + Math.ceil(sitze / 40);

export interface AktionSicht {
  id: Verhandlung;
  label: string;
  pk: number;
  moeglich: boolean;
  /** Warum es gerade nicht geht (oder was fehlt) */
  grund?: string;
  /** Was die Aktion bewirkt, in einem Satz */
  hinweis: string;
}

export interface FraktionSicht {
  partei: string;
  name: string;
  ausrichtung: string;
  sitze: number;
  status: "lager" | "duldung" | "opposition";
  duldungBis?: number;
  bereitschaft: number;
  wort: string;
  forderung: string;
  aktionen: AktionSicht[];
}

function eigene(world: World): string {
  return world.player?.partei.kurz ?? "";
}

function datumBis(world: World, tag: number): string {
  return formatDateDe(addDays(world.date, tag - world.day));
}

/** Alle Fraktionen außer der eigenen, mit Stand und möglichen Verhandlungsschritten. */
export function fraktionsUebersicht(world: World): FraktionSicht[] {
  const spiel = world.spiel;
  const parl = world.parliament;
  if (!spiel || !parl) return [];
  const kapital = verfuegbar(spiel.kapital);
  const out: FraktionSicht[] = [];
  for (const [partei, sitze] of Object.entries(parl.seats)) {
    if (partei === eigene(world) || sitze <= 0) continue;
    const f = fraktion(world, partei);
    const imLager = spiel.lager.includes(partei);
    const duldet = f.duldungBis !== undefined && f.duldungBis > world.day && !imLager;
    const status: FraktionSicht["status"] = imLager ? "lager" : duldet ? "duldung" : "opposition";
    const forderung = forderungVon(world, partei).text;
    const aktionen: AktionSicht[] = [];

    // Gespräch: für alle, auch für Partner
    {
      const rest = (f.gespraech ?? -1e9) + VERHANDLUNG.gespraechAbkuehlung - world.day;
      aktionen.push({
        id: "gespraech",
        label: "Gespräch führen",
        pk: pkGespraech,
        moeglich: rest <= 0 && kapital >= pkGespraech,
        ...(rest > 0 ? { grund: `Erst in ${rest} Tagen wieder sinnvoll.` } : kapital < pkGespraech ? { grund: "Dafür fehlt Kapital." } : {}),
        hinweis: "Macht die Fraktion offener für Sie (+8).",
      });
    }
    if (!imLager) {
      {
        const rest = (f.zugestaendnis ?? -1e9) + VERHANDLUNG.zugestaendnisAbkuehlung - world.day;
        aktionen.push({
          id: "zugestaendnis",
          label: "Kontrollrechte zugestehen",
          pk: pkZugestaendnis,
          moeglich: rest <= 0 && kapital >= pkZugestaendnis,
          ...(rest > 0 ? { grund: `Schon zugestanden; wieder möglich in ${rest} Tagen.` } : kapital < pkZugestaendnis ? { grund: "Dafür fehlt Kapital." } : {}),
          hinweis: "Untersuchungsausschuss, Redezeit, Einsicht: macht sie deutlich offener (+15) und entspannt das Klima.",
        });
      }
      {
        const pk = pkDuldung(sitze);
        const ja = Math.round(sitze * DULDUNG_QUOTE);
        const grund = duldet
          ? `Läuft noch bis ${datumBis(world, f.duldungBis!)}.`
          : f.bereitschaft < VERHANDLUNG.duldungMin
            ? `Sie ist ${bereitschaftWort(f.bereitschaft)}; erst Gespräche oder Zugeständnisse.`
            : kapital < pk
              ? "Dafür fehlt Kapital."
              : undefined;
        aktionen.push({
          id: "duldung",
          label: "Duldung aushandeln",
          pk,
          moeglich: !grund,
          ...(grund ? { grund } : {}),
          hinweis: `${VERHANDLUNG.duldungTage / 30} Monate lang etwa ${ja} Ja-Stimmen bei Gesetzen. Sie erwartet dafür ${forderung}.`,
        });
      }
      {
        const pk = pkKoalition(sitze);
        const grund =
          sitze < 10
            ? "Zu klein für ein Bündnis."
            : f.bereitschaft < VERHANDLUNG.koalitionMin
              ? `Sie ist ${bereitschaftWort(f.bereitschaft)}; für ein Bündnis braucht sie mehr Vertrauen.`
              : kapital < pk
                ? "Dafür fehlt Kapital."
                : undefined;
        aktionen.push({
          id: "koalition",
          label: "Ins Lager holen",
          pk,
          moeglich: !grund,
          ...(grund ? { grund } : {}),
          hinweis: `Alle ${sitze} Sitze im Lager, dauerhaft. Sie erwartet ${forderung}; bei Bruch verlässt sie das Lager.`,
        });
      }
      if (sitze >= 20) {
        const pk = pkAbwerben(sitze);
        aktionen.push({
          id: "abwerben",
          label: "Abgeordnete abwerben",
          pk,
          moeglich: kapital >= pk,
          ...(kapital < pk ? { grund: "Dafür fehlt Kapital." } : {}),
          hinweis: "Einzelne Abgeordnete wechseln zu Ihnen, wenn es gelingt. Die Fraktion vergisst das nicht.",
        });
      }
    }
    out.push({
      partei,
      name: PARTEI_NAME[partei] ?? partei,
      ausrichtung: AUSRICHTUNG[partei] ?? "",
      sitze,
      status,
      ...(f.duldungBis !== undefined && duldet ? { duldungBis: f.duldungBis } : {}),
      bereitschaft: f.bereitschaft,
      wort: bereitschaftWort(f.bereitschaft),
      forderung,
      aktionen,
    });
  }
  return out.sort((a, b) => b.sitze - a.sitze);
}

export function verhandle(world: World, partei: string, aktion: Verhandlung, rng: Rng): Ergebnis {
  const spiel = world.spiel;
  const parl = world.parliament;
  if (!spiel || !parl) return { ok: false, text: "Es gibt kein Parlament, mit dem sich verhandeln ließe." };
  const sicht = fraktionsUebersicht(world).find((x) => x.partei === partei);
  if (!sicht) return { ok: false, text: "Diese Fraktion sitzt nicht im Parlament." };
  const a = sicht.aktionen.find((x) => x.id === aktion);
  if (!a) return { ok: false, text: "Das ist bei dieser Fraktion nicht möglich." };
  if (!a.moeglich) return { ok: false, text: a.grund ?? "Das geht gerade nicht." };
  if (!kannZahlen(spiel.kapital, a.pk)) return { ok: false, text: `Dafür fehlt Politisches Kapital (nötig ${a.pk}, vorhanden ${Math.floor(spiel.kapital)}).` };
  const pause = neuanfangGrund(world);
  if (pause) return { ok: false, text: pause };
  verbrauche(world, AUFMERKSAMKEIT[aktion], `Verhandlung mit der ${sicht.name}`);

  const name = sicht.name;
  const f = fraktion(world, partei);
  const forderung = forderungVon(world, partei);
  const zusage = (tage: number, text: string) => {
    spiel.zusagen.push({
      id: `z-${aktion}-${partei}-${world.day}`,
      von: partei,
      text,
      faellig: world.day + tage,
      ...(forderung ? { massnahme: forderung.massnahme, richtung: 1 } : {}),
      erfuellt: false,
      gebrochen: false,
    });
  };

  let text = "";
  let why = "";
  switch (aktion) {
    case "gespraech": {
      spiel.kapital -= a.pk;
      f.gespraech = world.day;
      bereitschaftAendern(world, partei, 8);
      const partner = spiel.figuren.find((x) => x.partei === partei);
      if (partner) partner.loyalitaet = Math.min(100, partner.loyalitaet + 5);
      text = `Gespräch mit der ${name}: Sie zeigt sich jetzt ${bereitschaftWort(f.bereitschaft)}.`;
      why = `Kostet 1 Kapital. Sie will ${sicht.forderung}; wer das ernst nimmt, wird ernst genommen.`;
      break;
    }
    case "zugestaendnis": {
      spiel.kapital -= a.pk;
      f.zugestaendnis = world.day;
      bereitschaftAendern(world, partei, 15);
      wirke(world, "polarisierung", -1);
      text = `Der ${name} werden Kontrollrechte zugestanden; sie zeigt sich jetzt ${bereitschaftWort(f.bereitschaft)}.`;
      why = "Ein Untersuchungsausschuss und mehr Redezeit kosten Kapital und etwas Bequemlichkeit, entspannen aber das Klima im Parlament.";
      break;
    }
    case "duldung": {
      spiel.kapital -= a.pk;
      f.duldungBis = world.day + VERHANDLUNG.duldungTage;
      zusage(VERHANDLUNG.duldungTage, `Die ${name} erwartet ${sicht.forderung}`);
      const ja = Math.round(sicht.sitze * DULDUNG_QUOTE);
      text = `Die ${name} duldet Ihr Lager bis ${datumBis(world, f.duldungBis)}: etwa ${ja} Ja-Stimmen bei Gesetzen.`;
      why = `Kostet ${a.pk} Kapital. Sie erwartet ${sicht.forderung}; wird das nicht geliefert, verliert sie das Vertrauen in Sie.`;
      break;
    }
    case "koalition": {
      spiel.kapital -= a.pk;
      spiel.lager.push(partei);
      delete f.duldungBis;
      bereitschaftAendern(world, partei, 10);
      zusage(VERHANDLUNG.koalitionZusageTage, `Die ${name} erwartet ${sicht.forderung}`);
      if (!spiel.figuren.some((x) => x.id === `partner-${partei}`)) {
        spiel.figuren.push(partnerFigur(world, partei, `Vorsitz der ${name}`, sicht.forderung, rng));
      }
      text = `Die ${name} tritt ins Regierungslager ein (+${sicht.sitze} Sitze).`;
      why = `Kostet ${a.pk} Kapital. Sie erwartet ${sicht.forderung} und bleibt nur, solange Zusagen gehalten werden.`;
      break;
    }
    case "abwerben": {
      spiel.kapital -= a.pk;
      const chance = Math.min(0.65, Math.max(0.25, 0.7 - f.bereitschaft / 200));
      if (rng.next() < chance) {
        const n = Math.max(2, Math.round(sicht.sitze * 0.08));
        parl.seats[partei] = sicht.sitze - n;
        parl.seats[eigene(world)] = (parl.seats[eigene(world)] ?? 0) + n;
        wirke(world, "polarisierung", 2);
        bereitschaftAendern(world, partei, -20);
        text = `${n} Abgeordnete der ${name} wechseln in Ihre Fraktion.`;
        why = `Kostet ${a.pk} Kapital. Die ${name} nimmt das als Angriff; das Klima im Parlament wird rauer.`;
      } else {
        bereitschaftAendern(world, partei, -12);
        vertrauenAendern(world, -0.5);
        text = `Der Versuch, Abgeordnete der ${name} abzuwerben, scheitert und wird bekannt.`;
        why = `Kostet ${a.pk} Kapital. Die Fraktion ist verärgert, die Presse schreibt über Hinterzimmerpolitik.`;
      }
      break;
    }
  }
  addLog(world, "entscheidung", text, why);
  return { ok: true, text, why };
}

/** Einmal im Monat: Duldungen laufen aus, die Stimmung kehrt langsam zum Ausgangswert zurück. */
export function verhandlungMonat(world: World): void {
  const spiel = world.spiel;
  if (!spiel?.fraktionen) return;
  for (const [partei, f] of Object.entries(spiel.fraktionen)) {
    if (f.duldungBis !== undefined && f.duldungBis <= world.day) {
      delete f.duldungBis;
      addLog(world, "ereignis", `Die Duldung durch die ${PARTEI_NAME[partei] ?? partei} endet.`, "Ihre Stimmen fehlen ab jetzt bei Gesetzen; eine neue Vereinbarung kostet erneut Kapital.");
    }
    const ziel = startBereitschaft(world, partei);
    f.bereitschaft += Math.sign(ziel - f.bereitschaft) * Math.min(1, Math.abs(ziel - f.bereitschaft));
  }
}

// Verhandlungen mit den Fraktionen des Parlaments. Ohne eigene Mehrheit ist das der Kern des Regierens:
// Gespräche machen offen, Zugeständnisse besänftigen, eine Duldung liefert Stimmen auf Zeit, ein Bündnis auf Dauer.
// Jede Unterstützung hat einen Preis (Kapital jetzt, eine Zusage später); wer Zusagen bricht, verbrennt Vertrauen.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung).

import { addLog } from "./log";
import { msg, t, tIn } from "../i18n";
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
        label: t("vh.gespraech.label"),
        pk: pkGespraech,
        moeglich: rest <= 0 && kapital >= pkGespraech,
        ...(rest > 0 ? { grund: t("vh.gespraech.erst", { n: rest }) } : kapital < pkGespraech ? { grund: t("vh.kapital") } : {}),
        hinweis: t("vh.gespraech.hinweis"),
      });
    }
    if (!imLager) {
      {
        const rest = (f.zugestaendnis ?? -1e9) + VERHANDLUNG.zugestaendnisAbkuehlung - world.day;
        aktionen.push({
          id: "zugestaendnis",
          label: t("vh.zug.label"),
          pk: pkZugestaendnis,
          moeglich: rest <= 0 && kapital >= pkZugestaendnis,
          ...(rest > 0 ? { grund: t("vh.zug.schon", { n: rest }) } : kapital < pkZugestaendnis ? { grund: t("vh.kapital") } : {}),
          hinweis: t("vh.zug.hinweis"),
        });
      }
      {
        const pk = pkDuldung(sitze);
        const ja = Math.round(sitze * DULDUNG_QUOTE);
        const grund = duldet
          ? t("vh.duld.laeuft", { bis: datumBis(world, f.duldungBis!) })
          : f.bereitschaft < VERHANDLUNG.duldungMin
            ? t("vh.duld.erst", { wort: bereitschaftWort(f.bereitschaft) })
            : kapital < pk
              ? t("vh.kapital")
              : undefined;
        aktionen.push({
          id: "duldung",
          label: t("vh.duld.label"),
          pk,
          moeglich: !grund,
          ...(grund ? { grund } : {}),
          hinweis: t("vh.duld.hinweis", { monate: VERHANDLUNG.duldungTage / 30, ja, forderung }),
        });
      }
      {
        const pk = pkKoalition(sitze);
        const grund =
          sitze < 10
            ? t("vh.koal.klein")
            : f.bereitschaft < VERHANDLUNG.koalitionMin
              ? t("vh.koal.vertrauen", { wort: bereitschaftWort(f.bereitschaft) })
              : kapital < pk
                ? t("vh.kapital")
                : undefined;
        aktionen.push({
          id: "koalition",
          label: t("vh.koal.label"),
          pk,
          moeglich: !grund,
          ...(grund ? { grund } : {}),
          hinweis: t("vh.koal.hinweis", { sitze, forderung }),
        });
      }
      if (sitze >= 20) {
        const pk = pkAbwerben(sitze);
        aktionen.push({
          id: "abwerben",
          label: t("vh.abw.label"),
          pk,
          moeglich: kapital >= pk,
          ...(kapital < pk ? { grund: t("vh.kapital") } : {}),
          hinweis: t("vh.abw.hinweis"),
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
  if (!spiel || !parl) return { ok: false, text: t("vh.e.keinParlament") };
  const sicht = fraktionsUebersicht(world).find((x) => x.partei === partei);
  if (!sicht) return { ok: false, text: t("vh.e.nichtImParlament") };
  const a = sicht.aktionen.find((x) => x.id === aktion);
  if (!a) return { ok: false, text: t("vh.e.nichtMoeglich") };
  if (!a.moeglich) return { ok: false, text: a.grund ?? t("vh.e.geradeNicht") };
  if (!kannZahlen(spiel.kapital, a.pk)) return { ok: false, text: t("vh.e.kapital", { noetig: a.pk, da: Math.floor(spiel.kapital) }) };
  const pause = neuanfangGrund(world);
  if (pause) return { ok: false, text: pause };
  verbrauche(world, AUFMERKSAMKEIT[aktion], `Verhandlung mit der ${sicht.name}`);

  const name = sicht.name;
  const f = fraktion(world, partei);
  const forderung = forderungVon(world, partei);
  const zusage = (tage: number) => {
    const p = { name, forderung: sicht.forderung };
    spiel.zusagen.push({
      id: `z-${aktion}-${partei}-${world.day}`,
      von: partei,
      text: tIn("de", "vh.zusage", p),
      msg: msg("vh.zusage", p),
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
      text = t("vh.r.gespraech", { name, wort: bereitschaftWort(f.bereitschaft) });
      why = t("vh.r.gespraechWarum", { forderung: sicht.forderung });
      break;
    }
    case "zugestaendnis": {
      spiel.kapital -= a.pk;
      f.zugestaendnis = world.day;
      bereitschaftAendern(world, partei, 15);
      wirke(world, "polarisierung", -1);
      text = t("vh.r.zug", { name, wort: bereitschaftWort(f.bereitschaft) });
      why = t("vh.r.zugWarum");
      break;
    }
    case "duldung": {
      spiel.kapital -= a.pk;
      f.duldungBis = world.day + VERHANDLUNG.duldungTage;
      zusage(VERHANDLUNG.duldungTage);
      const ja = Math.round(sicht.sitze * DULDUNG_QUOTE);
      text = t("vh.r.duld", { name, bis: datumBis(world, f.duldungBis), ja });
      why = t("vh.r.duldWarum", { pk: a.pk, forderung: sicht.forderung });
      break;
    }
    case "koalition": {
      spiel.kapital -= a.pk;
      spiel.lager.push(partei);
      delete f.duldungBis;
      bereitschaftAendern(world, partei, 10);
      zusage(VERHANDLUNG.koalitionZusageTage);
      if (!spiel.figuren.some((x) => x.id === `partner-${partei}`)) {
        spiel.figuren.push(partnerFigur(world, partei, `Vorsitz der ${name}`, sicht.forderung, rng));
      }
      text = t("vh.r.koal", { name, sitze: sicht.sitze });
      why = t("vh.r.koalWarum", { pk: a.pk, forderung: sicht.forderung });
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
        text = t("vh.r.abw", { n, name });
        why = t("vh.r.abwWarum", { pk: a.pk, name });
      } else {
        bereitschaftAendern(world, partei, -12);
        vertrauenAendern(world, -0.5);
        text = t("vh.r.abwFehl", { name });
        why = t("vh.r.abwFehlWarum", { pk: a.pk });
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

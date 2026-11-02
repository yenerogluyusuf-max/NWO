// Bündnisangebote als Ereignis: vorhandene Sonderkonditionen, gemeinsame Personen- und Zusagenregeln.
import type { World } from "./types";
import type { Option } from "./ereignis-hilfen";
import { aktiveParteivorsitzende, KOALITIONSBRUCH_LOYALITAET, naechsteKoalitionspruefung, regierungsSitze } from "./koalitionslage";
import { sichereParteivorsitz, PARTNER_START_LOYALITAET } from "./figuren";
import { forderungVon, fraktion, PARTEI_NAME } from "./fraktionen";
import { festeZusage, zusageStufen, zusageZielErreicht } from "./zusagenfolgen";
import { NET } from "./modell";
import { skala, skalenArt } from "../data/skalen";
import { addDays, formatDateDe } from "./dates";
import { msg, t, tIn, zahl } from "../i18n";

function sperre(w: World, partei: string): string | undefined {
  if (!w.spiel || w.spiel.ende || !w.player || !w.parliament) return t("ka.beendet");
  if (partei === w.player.partei.kurz) return t("ka.eigene");
  if (w.spiel.lager.includes(partei)) return t("ka.bereitsPartner");
  if ((w.parliament.seats[partei] ?? 0) < 15) return t("ka.keineFraktion");
  return undefined;
}

/** Die Ereignisse kosten weiterhin einmalig 4 PK. Kein neuer Bereitschafts- oder Loyalitätsbonus. */
export function koalitionsAntwort(w: World, partei: string, id: string, label: string, zusagenPrefix: string): Option {
  const name = PARTEI_NAME[partei] ?? partei, sitze = w.parliament?.seats[partei] ?? 0;
  const grund = sperre(w, partei);
  if (grund) return { id, label, pk: 4, beschreibung: grund, sperre: grund, wirkung: () => grund };
  const forderung = forderungVon(w, partei);
  const stufen = zusageStufen(w, { massnahme: forderung.massnahme, richtung: 1 });
  const zielName = stufen && skalenArt(forderung.massnahme) === "regime"
    ? skala(forderung.massnahme, stufen.stufeStart).stufen.find(s => s.w === stufen.stufeZiel)?.name : undefined;
  const vorsitz = aktiveParteivorsitzende(w, partei);
  const regierung = regierungsSitze(w), danach = regierung + sitze;
  const bedingungen = [
    t(danach >= 301 ? "ka.mehrheit" : "ka.luecke", { sitze, danach, fehlen: Math.max(0, 301 - danach) }),
    t("fa.zusage", { forderung: forderung.text, datum: formatDateDe(addDays(w.date, 150)) }),
    ...(stufen ? [t("ka.ziel", { name: NET.nodes[NET.index.get(forderung.massnahme)!]!.name, ziel: zielName ?? t("fa.stufe", { n: stufen.stufeZiel }) })] : []),
    ...(stufen && zusageZielErreicht({ ...stufen, richtung: 1 }, w.net.targets[forderung.massnahme] ?? stufen.stufeStart) ? [t("fa.zielBeschlossen")] : []),
    ...(vorsitz.length ? vorsitz.map(f => t("fa.bleibt", { name: f.name, n: f.loyalitaet < KOALITIONSBRUCH_LOYALITAET && Math.round(f.loyalitaet * 10) / 10 >= KOALITIONSBRUCH_LOYALITAET ? t("vm.bruch.knapp", { grenze: KOALITIONSBRUCH_LOYALITAET }) : zahl(f.loyalitaet, 1) })) : [t("fa.neu", { n: PARTNER_START_LOYALITAET })]),
  ];
  const warnung = vorsitz.some(f => f.loyalitaet < KOALITIONSBRUCH_LOYALITAET)
    ? t("ka.bruch", { datum: formatDateDe(naechsteKoalitionspruefung(w.date)), sitze, rest: regierung }) : undefined;
  return {
    id, label, pk: 4, beschreibung: t("ka.preis"), bedingungen, warnung,
    wirkung: (ww, _ev, rng) => {
      const blockiert = sperre(ww, partei);
      if (blockiert) return blockiert;
      const sp = ww.spiel!;
      sp.lager.push(partei);
      // Ein Bündnis ersetzt die befristete Duldung; deren frühere Zusagen bleiben bestehen.
      delete fraktion(ww, partei).duldungBis;
      const basis = `${zusagenPrefix}-${partei}-${ww.day}`;
      let zusagenId = basis;
      for (let n = 2; sp.zusagen.some(z => z.id === zusagenId); n++) zusagenId = `${basis}-${n}`;
      const p = { partei: name, forderung: forderung.text };
      sp.zusagen.push(festeZusage(ww, {
        id: zusagenId, von: partei, text: tIn("de", "wahl.ereignis.koalition.zusage", p), msg: msg("wahl.ereignis.koalition.zusage", p),
        faellig: ww.day + 150, massnahme: forderung.massnahme, richtung: 1, ...stufen, erfuellt: false, gebrochen: false,
      }));
      sichereParteivorsitz(ww, partei, t("wahl.ereignis.koalition.vorsitz", { partei: name }), forderung.text, rng);
      return t("wahl.ereignis.koalition.ausgang", { partei: name, sitze: ww.parliament!.seats[partei] });
    },
  };
}

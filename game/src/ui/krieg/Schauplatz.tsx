// Der Schauplatz eines Konfliktvorgangs: die Karte der Regionen mit ihren echten Verwaltungsgrenzen, der Vormarsch in km², die Zielregionen
// als Kette (genommen, umkämpft, beim Gegner) mit Fläche und Einwohnern, die zwei Entscheidungen der Kriegsführung (Einsatzart, Tempo) und
// der Vergleich der Bestände. Rechnet nichts selbst: alles aus sim/kriegsschauplatz.ts und data/schauplaetze.ts.
// Die große Karte zeigt dieselbe Lage (Linse „Welt“ und während eines Krieges immer) mit denselben Umrissen (data/schauplatz-flaechen.json).
//
// Welle 3, K2 (krieg.md Schritt 4): Die Regionen sind echte Verwaltungseinheiten. Umrisse: OCHA COD-AB (Syrien, Irak, Iran, Armenien;
// CC BY 3.0 IGO), geoBoundaries (Griechenland CC0, Zypern ODbL © OpenStreetMap-Mitwirkende); Quellen und Lizenzen im Kopf von
// tools/geodaten/schauplatz_flaechen.py. Die Oberfläche nennt keine Quellen (ENTSCHEIDUNGEN, keine Quellen in der Oberfläche).

import type { World } from "../../sim/types";
import type { KriegVorgang } from "../../sim/krieg-typen";
import { t, zahl } from "../../i18n";
import { useSprache } from "../../i18n/react";
import {
  besatzung,
  einsatzSichten,
  einsatzVon,
  gegnerBestand,
  gegnerBestandsFaktor,
  generationsAbstand,
  genommeneFlaeche,
  kriegsFaktoren,
  regionenVon,
  schauplatzFuer,
  tempoVon,
  umkaempfteRegion,
  vorgerueckteFlaeche,
  waehleEinsatz,
  waehleTempo,
  zielFlaeche,
  zielRegionen,
} from "../../sim/kriegsschauplatz";
import { streitkraefte } from "../../sim/streitkraefte";
import { land } from "../../sim/laender";
import type { KriegsTempo, Region } from "../../data/schauplaetze";
import FLAECHEN_ROH from "../../data/schauplatz-flaechen.json";
import { gegenueber2026 } from "../militaer/zustand";
import "./krieg.css";
import "./schauplatz-karte.css";

const FLAECHEN = FLAECHEN_ROH as unknown as Record<string, [number, number][][]>;
const TEMPI: KriegsTempo[] = ["vorsichtig", "normal", "hart"];

function eignungWort(e: number): string {
  if (e >= 1.1) return t("krieg.ui.eignung.gut");
  if (e >= 0.85) return t("krieg.ui.eignung.mittel");
  if (e >= 0.5) return t("krieg.ui.eignung.schwer");
  return t("krieg.ui.eignung.kaum");
}

/** Einwohner kurz: unter einer Million in Tausend, sonst in Millionen (Formatierer der Sprache). */
function einwohnerKurz(n: number): string {
  return n >= 1_000_000 ? t("welle_k2.ui.mio", { z: zahl(n / 1_000_000, 2) }) : t("welle_k2.ui.tsd", { z: zahl(Math.round(n / 1000), 0) });
}

type Lage = "eigen" | "umkaempft" | "gegner" | "aussen" | "besetzt";

/** Die Karte des Schauplatzes: alle Regionen mit ihren Umrissen, flächentreu genug für das Auge (Längengrad mit dem Kosinus gestaucht). */
function SchauplatzKarte({ regionen, lage, umk }: { regionen: Region[]; lage: (r: Region) => Lage; umk?: Region }) {
  const ringe = regionen.flatMap((r) => FLAECHEN[r.id] ?? []);
  if (!ringe.length) return null;
  let lon0 = Infinity, lon1 = -Infinity, lat0 = Infinity, lat1 = -Infinity;
  for (const ring of ringe) for (const [lo, la] of ring) { lon0 = Math.min(lon0, lo); lon1 = Math.max(lon1, lo); lat0 = Math.min(lat0, la); lat1 = Math.max(lat1, la); }
  const k = Math.cos(((lat0 + lat1) / 2) * (Math.PI / 180));
  const S = 100;
  const rand = 6;
  const px = (lo: number, la: number): [number, number] => [(lo - lon0) * k * S + rand, (lat1 - la) * S + rand];
  const breite = (lon1 - lon0) * k * S + 2 * rand;
  const hoehe = (lat1 - lat0) * S + 2 * rand;
  const pfad = (ring: [number, number][]) => "M" + ring.map(([lo, la]) => px(lo, la).map((v) => v.toFixed(1)).join(",")).join("L") + "Z";
  // Namen als HTML über der Fläche: Die Schrift bleibt bei jeder Breite der Karte gleich groß (13 px und mehr)
  return (
    <div className="skk-bild">
      <svg className="skk" viewBox={`0 0 ${breite.toFixed(0)} ${hoehe.toFixed(0)}`} role="img" aria-label={t("welle_k2.ui.karte")}>
        {regionen.map((r) => {
          const l = lage(r);
          return (
            <g key={r.id} className={`skk-region skk-${l}`}>
              {(FLAECHEN[r.id] ?? []).map((ring, i) => <path key={i} d={pfad(ring)} />)}
              <title>{`${t(`krieg.region.${r.id}`)} · ${t(`welle_k2.einheit.${r.einheit.art}`, { name: r.einheit.name })} · ${t("welle_k2.ui.km2", { z: zahl(r.flaecheKm2, 0) })}`}</title>
            </g>
          );
        })}
        {regionen.map((r) => {
          const [x, y] = px(r.lon, r.lat);
          return <circle key={`p-${r.id}`} className={`skk-punkt skk-punkt-${lage(r)}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r={(breite * (r === umk ? 0.011 : 0.008)).toFixed(2)} />;
        })}
      </svg>
      {regionen.map((r) => {
        const [x, y] = px(r.lon, r.lat);
        return (
          <span key={`n-${r.id}`} className={`skk-name skk-name-${lage(r)}${x / breite > 0.78 ? " skk-name-links" : ""}`} style={{ left: `${((x / breite) * 100).toFixed(2)}%`, top: `${((y / hoehe) * 100).toFixed(2)}%` }} aria-hidden>
            {t(`krieg.region.${r.id}`)}
          </span>
        );
      })}
    </div>
  );
}

export function Schauplatz({ world, k, onTat }: { world: World; k: KriegVorgang; onTat: (text: string) => void }) {
  useSprache();
  const s = schauplatzFuer(k.land);
  if (!s) return null;
  const ziel = zielRegionen(k);
  const lage = k.regionen ?? {};
  const genommen = ziel.filter((r) => lage[r.id] === "eigen").length;
  const umk = umkaempfteRegion(k);
  const f = kriegsFaktoren(k);
  const imKrieg = k.phase === "krieg" || k.phase === "waffenruhe";
  const einsatz = einsatzVon(k);
  const sichten = einsatzSichten(world, k);
  const gb = gegnerBestand(world, k);
  const gegnerAnteil = gegnerBestandsFaktor(world, k);
  const abstand = generationsAbstand(world, k);
  const munition = streitkraefte(world).gattungen.munition.menge;
  const lw = k.letzteWoche;

  // Fläche und Menschen des Zielraums, und wie weit die Front reicht (dieselben Zahlen, mit denen die Rechnung arbeitet)
  const zielKm2 = zielFlaeche(k);
  const zielEinw = ziel.reduce((x, r) => x + (r.einwohner?.zahl ?? 0), 0);
  const genommenKm2 = genommeneFlaeche(k);
  const vorKm2 = Math.max(genommenKm2, imKrieg ? vorgerueckteFlaeche(k) : 0);
  const anteil = zielKm2 > 0 ? Math.round((vorKm2 / zielKm2) * 100) : 0;
  const besetzt = new Set(besatzung(world).filter((b) => b.land === k.land).map((b) => b.region));
  const zielIds = new Set(ziel.map((r) => r.id));
  const kartenLage = (r: Region): Lage => {
    const l = lage[r.id];
    if (l === "eigen") return besetzt.has(r.id) && !zielIds.has(r.id) ? "besetzt" : "eigen";
    if (l === "umkaempft") return "umkaempft";
    if (besetzt.has(r.id)) return "besetzt";
    return zielIds.has(r.id) ? "gegner" : "aussen";
  };

  // Ein Satz zur Lage (Urteil zuerst, Zahlen danach)
  const satz = !imKrieg
    ? t("krieg.ui.lage.vorher", { n: ziel.length, land: land(k.land).name })
    : umk
      ? t("krieg.ui.lage.umkaempft", { region: t(`krieg.region.${umk.id}`), gelaende: t(`krieg.gelaende.${umk.gelaende}`), genommen, n: ziel.length })
      : t("krieg.ui.lage.alles", { n: ziel.length });

  return (
    <section className="ks" aria-label={t("krieg.ui.titel", { land: land(k.land).name })}>
      <header className="ks-kopf">
        <b>{t(`krieg.schauplatz.${s.id}`)}</b>
        <span>{satz}</span>
      </header>

      <div className="skk-feld">
        <SchauplatzKarte regionen={regionenVon(k.land)} lage={kartenLage} {...(umk ? { umk } : {})} />
        <dl className="skk-zahlen">
          <div>
            <dt>{t("welle_k2.ui.zielraum")}</dt>
            <dd>{t("welle_k2.ui.km2", { z: zahl(zielKm2, 0) })}</dd>
          </div>
          <div>
            <dt>{t("welle_k2.ui.einwohner")}</dt>
            <dd>{zielEinw > 0 ? einwohnerKurz(zielEinw) : t("welle_k2.ui.luecke")}</dd>
          </div>
          <div>
            <dt>{t("welle_k2.ui.vormarsch")}</dt>
            <dd>{t("welle_k2.ui.km2", { z: zahl(Math.round(vorKm2 / 10) * 10, 0) })}<small>{t("welle_k2.ui.prozent", { p: anteil })}</small></dd>
          </div>
          {lw?.km2 !== undefined && k.phase === "krieg" && (
            <div>
              <dt>{t("welle_k2.ui.woche_km2")}</dt>
              <dd>{t("welle_k2.ui.km2", { z: zahl(lw.km2, 0) })}</dd>
            </div>
          )}
        </dl>
        <ul className="skk-legende" aria-hidden>
          <li className="skk-l-eigen">{t("krieg.ui.lage_wort.eigen")}</li>
          <li className="skk-l-umkaempft">{t("krieg.ui.lage_wort.umkaempft")}</li>
          <li className="skk-l-gegner">{t("krieg.ui.lage_wort.gegner")}</li>
          <li className="skk-l-aussen">{t("welle_k2.ui.ausserhalb")}</li>
        </ul>
      </div>

      <ol className="ks-kette" aria-label={t("krieg.ui.kette")}>
        {ziel.map((r) => {
          const l = lage[r.id] ?? "gegner";
          const res = r.ressourcen.map((x) => t(`welle_k2.res.${x.id}`));
          return (
            <li key={r.id} className={`ks-region ks-${l} skk-glied`} title={[t(`welle_k2.einheit.${r.einheit.art}`, { name: r.einheit.name }), t(`krieg.gelaende.${r.gelaende}`), ...res].join(" · ")}>
              <span className="ks-punkt" aria-hidden />
              <span className="skk-glied-text">
                <span className="ks-name">{t(`krieg.region.${r.id}`)}</span>
                <small className="skk-glied-zahlen">
                  {t("welle_k2.ui.km2", { z: zahl(r.flaecheKm2, 0) })} · {r.einwohner ? t("welle_k2.ui.einw_jahr", { z: einwohnerKurz(r.einwohner.zahl), jahr: String(r.einwohner.jahr) }) : t("welle_k2.ui.luecke")}
                </small>
              </span>
              <small>{t(`krieg.ui.lage_wort.${l}`)}</small>
            </li>
          );
        })}
      </ol>
      {umk && (
        <p className="skk-umk">
          <b>{t(`welle_k2.einheit.${umk.einheit.art}`, { name: umk.einheit.name })}</b>
          {umk.ressourcen.length ? ` · ${umk.ressourcen.map((x) => t(`welle_k2.res.${x.id}`)).join(" · ")}` : ""}
        </p>
      )}
      {f.keinLand && imKrieg && <p className="ks-warn">{t("welle_k2.ui.kein_land")}</p>}
      {f.ausserReichweite && umk && <p className="ks-warn">{t("krieg.ui.reichweite", { region: t(`krieg.region.${umk.id}`), art: t(`krieg.einsatz.${einsatz === "gemischt" ? "luft" : einsatz}.name`) })}</p>}

      <div className="ks-wahl">
        <h5>{t("krieg.ui.einsatz")}</h5>
        <p className="ks-hilfe">{einsatz === "gemischt" ? t("krieg.ui.einsatz_gemischt") : t(`krieg.einsatz.${einsatz}.text`)}</p>
        <div className="ks-knoepfe" role="group">
          {sichten.map((e) => (
            <button key={e.id} type="button" className={e.aktiv ? "on" : ""} disabled={!e.moeglich} title={e.grund ?? t(`krieg.einsatz.${e.id}.text`)} onClick={() => onTat(waehleEinsatz(world, k, e.id).text)}>
              <strong>{t(`krieg.einsatz.${e.id}.name`)}</strong>
              <span>
                {umk ? `${eignungWort(e.eignung)} · ` : ""}
                {t("nacht_n7.kraefte", { z: gegenueber2026(e.kraft) })}
              </span>
              {e.grund && !e.aktiv && <em>{e.grund}</em>}
            </button>
          ))}
        </div>
      </div>

      <div className="ks-wahl">
        <h5>{t("krieg.ui.tempo")}</h5>
        <div className="ks-knoepfe ks-tempo" role="group">
          {TEMPI.map((tp) => (
            <button key={tp} type="button" className={tempoVon(k) === tp ? "on" : ""} disabled={tempoVon(k) === tp || k.phase === "frieden" || k.phase === "beendet"} title={t(`krieg.tempo.${tp}.text`)} onClick={() => onTat(waehleTempo(world, k, tp).text)}>
              <strong>{t(`krieg.tempo.${tp}.name`)}</strong>
              <span>{t(`krieg.tempo.${tp}.kurz`)}</span>
            </button>
          ))}
        </div>
      </div>

      <dl className="ks-vergleich">
        <dt>{t("krieg.ui.gegner_bestand")}</dt>
        <dd>
          {t("krieg.ui.prozent", { p: Math.round(gegnerAnteil * 100) })}
          <span className="ks-mini">
            {(Object.keys(gb) as (keyof typeof gb)[]).map((g) => (
              <i key={g} title={`${t(`krieg.gegner.${g}`)}: ${Math.round(gb[g].menge)} · ${t("krieg.ui.gen", { g: zahl(gb[g].generation, 1) })}`} style={{ height: `${Math.max(8, Math.min(100, gb[g].menge))}%` }} />
            ))}
          </span>
        </dd>
        <dt>{t("krieg.ui.generation")}</dt>
        <dd className={abstand >= 0.3 ? "ks-gut" : abstand <= -0.3 ? "ks-schlecht" : ""}>{t(abstand >= 0.3 ? "krieg.ui.gen_vorn" : abstand <= -0.3 ? "krieg.ui.gen_hinten" : "krieg.ui.gen_gleich", { d: zahl(Math.abs(abstand), 1) })}</dd>
        <dt>{t("krieg.ui.munition")}</dt>
        <dd className={munition < 10 ? "ks-schlecht" : ""}>{t("krieg.ui.tage", { n: Math.round(munition) })}</dd>
        {lw && (
          <>
            <dt>{t("krieg.ui.woche")}</dt>
            <dd>{t("krieg.ui.verluste", { e: zahl(lw.eigen, 1), g: zahl(lw.gegner, 1) })}</dd>
          </>
        )}
      </dl>
    </section>
  );
}

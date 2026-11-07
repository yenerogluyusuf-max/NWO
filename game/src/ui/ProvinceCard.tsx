// Provinzblatt: Zahlen, Infrastruktur, Probleme, Bauvorhaben und der Weg, hier etwas zu tun.
// Welle 1, E5 (karte.md K7): Rathaus, Wirtschaftskraft, Arbeitslosigkeit und Infrastruktur kommen aus dem Spielstand. Die festen
// Ausgangsdaten (Wirtschaftsleistung und Straßen von 2024) stehen im aufklappbaren Steckbrief. Der Knopf öffnet, was hier fehlt
// (ui/provinz-handlungen.ts), nicht mehr immer den Autobahnbau.

import { NET } from "../sim/world";
import { offenerKonflikt, vorgaengeIn } from "../sim/vorgaenge";
import { t, zahl } from "../i18n";
import { nationalAverage, PROVINCES } from "../sim/netz";
import { PROVINZEN, REGION_DE } from "../sim/regional";
import { archetypName } from "../data/provinz_archetypen";
import { Corners } from "./art/Ornament";
import { PARTY_COLORS } from "./Parliament";
import INFRA from "../data/provinz_infra.json";
import { bedarfIn, type ProvinzBedarf } from "./provinz-handlungen";
import "./provinzkarte.css";
import type { World } from "../sim/types";

type Infra = { strasse_dichte: number; strasse_km: number; piste_km: number; schiene_km: number; flaeche_km2: number; krankenhaeuser: number; flughaefen: number; kraftwerke: number; bezirke: number };
const infra = INFRA.provinzen as Record<string, Infra>;
const LAND = (() => {
  const v = Object.values(infra);
  const km = v.reduce((s, p) => s + p.strasse_km, 0);
  const fl = v.reduce((s, p) => s + p.flaeche_km2, 0);
  return { dichte: km / fl };
})();

// Zahlen in der Sprache des Spielers (Befund F-7: vorher fest „de-DE“)
const nf = (x: number, d = 1) => zahl(x, d);

const WERTE: { id: string; label: string }[] = [
  { id: "verkehrsnetz", label: "Straßen und Autobahnen" },
  { id: "gesundheitsversorgung", label: "Gesundheitsversorgung" },
  { id: "wasserversorgung", label: "Wasserversorgung" },
  { id: "stromversorgung", label: "Stromversorgung" },
  { id: "internet", label: "Breitband" },
];

const wert = (w: World, id: string, plaka: number): number => w.net.values[NET.index.get(id)! * PROVINCES + plaka - 1]!;

/** Rathaus aus dem Spielstand (Kommunalwahlen im Spiel); vor der ersten Wahl im Spiel gilt das Ergebnis von 2024. */
export function rathausVon(w: World, plaka: number): { partei: string; jahr: string; verwalter: boolean } {
  const k = w.spiel?.gesellschaft?.kommunen;
  const r = k?.rathaus?.[String(plaka)];
  const letzte = k?.wahlen?.[k.wahlen.length - 1];
  return { partei: r?.partei ?? PROVINZEN[plaka - 1]!.buergermeister2024, jahr: letzte ? letzte.datum.slice(0, 4) : "2024", verwalter: !!r?.verwalter };
}

/** Die Aufschrift des Knopfs: was hier fehlt, mit der Zahl, die es zeigt. */
export function bedarfKnopf(b: ProvinzBedarf | null): string {
  if (!b) return t("ui.ProvinceCard.ed845b0");
  if (b.art === "netz") return t("welle_e5.provinz.knopf.netz", { netz: t(`infra.netz.${b.netz}`), a: Math.round(b.a * 100) });
  const m = NET.nodes[NET.index.get(b.massnahme)!]!.name;
  if (b.art === "problem") return t("welle_e5.provinz.knopf.problem", { problem: NET.nodes[NET.index.get(b.problem)!]!.name, massnahme: m });
  return t("welle_e5.provinz.knopf.lage", { wert: t(`netz.knoten.${b.knoten}.name`), massnahme: m, hier: Math.round(b.wert), land: Math.round(b.land) });
}

export function ProvinceCard({ world, plaka, onClose, onBauen, onVorgang }: { world: World; plaka: number; onClose: () => void; onBauen: (plaka: number, bedarf: ProvinzBedarf | null) => void; onVorgang?: (id: string) => void }) {
  const d = PROVINZEN[plaka - 1]!;
  const rathaus = rathausVon(world, plaka);
  const bedarf = bedarfIn(world, plaka);
  const regional = wert(world, "wachstum_regional", plaka);
  const regionalLand = nationalAverage(NET, world.net, "wachstum_regional");
  const seats = world.parliament?.byProvince?.[plaka];
  const problems = NET.nodes
    .filter((n) => n.kind === "problem")
    .filter((n) => world.net.values[NET.index.get(n.id)! * PROVINCES + plaka - 1]! >= n.threshold!)
    .map((n) => n.name);
  const own = world.player?.partei;
  const inf = infra[String(plaka)];
  const dichteRel = inf ? inf.strasse_dichte / LAND.dichte : undefined;
  const kh100k = inf ? (inf.krankenhaeuser / d.bevoelkerung) * 100_000 : undefined;

  // Was hier gebaut wird: regionale Ziele
  const projekte = Object.entries(world.net.ziele ?? {})
    .filter(([, arr]) => arr[plaka - 1]! >= 0)
    .map(([id, arr]) => {
      const i = NET.index.get(id)!;
      return { name: NET.nodes[i]!.name, jetzt: world.net.values[i * PROVINCES + plaka - 1]!, ziel: arr[plaka - 1]! };
    });

  return (
    <aside className="province-card-float frame">
      <Corners />
      <header className="dossier-head">
        <h2>{d.name}</h2>
        <button className="close" onClick={onClose} aria-label={t("ui.ProvinceCard.44424b1")}>
          ✕
        </button>
      </header>
      <div className="province-body">
        <p className="kicker">{t("ui2.ui.ProvinceCard.02eb006", { p0: plaka })} {REGION_DE[d.region] ?? d.region}</p>
        <p className="kicker">{t("ui2.ui.ProvinceCard.961e167", { p0: archetypName(plaka) })}</p>
        <dl>
          <dt>{t("ui2.ui.ProvinceCard.0102262")}</dt>
          <dd>{zahl(d.bevoelkerung)}</dd>
          <dt>{t("ui2.ui.ProvinceCard.2ef1990")}</dt>
          <dd className={regional < regionalLand - 4 ? "schwach" : ""}>{t("welle_e5.provinz.regional", { hier: nf(regional, 0), land: nf(regionalLand, 0) })}</dd>
          <dt>{t("ui2.ui.ProvinceCard.1cd606b")}</dt>
          <dd>{t("welle_e5.provinz.prozent", { p: nf(wert(world, "arbeitslosigkeit", plaka), 1) })}</dd>
          <dt>{t("welle_e5.provinz.rathaus")}</dt>
          <dd>
            {rathaus.partei === own?.kurz ? own.name : rathaus.partei}
            {rathaus.verwalter ? t("welle_e5.provinz.verwalter") : ""}
            <small className="province-wahl">{t("welle_e5.provinz.wahl", { jahr: rathaus.jahr })}</small>
          </dd>
          <dt>{t("ui2.ui.ProvinceCard.dc59932")}</dt>
          <dd>{d.sitze}</dd>
        </dl>

        {inf && (
          <details className="province-steckbrief">
            <summary className="province-sub">{t("welle_e5.provinz.steckbrief")}</summary>
            <dl>
              <dt>{t("welle_e5.provinz.bip2024")}</dt>
              <dd>{t("ui2.ui.ProvinceCard.62c34c2", { p0: zahl(d.bipProKopf) })}</dd>
              <dt>{t("ui.ProvinceCard.e1ddaa6")}</dt>
              <dd>
                {zahl(inf.strasse_km, 0)} km · {nf(inf.strasse_dichte, 2)} je km²
                <span className={`rel ${dichteRel! < 0.75 ? "dünn" : dichteRel! > 1.3 ? "dicht" : ""}`}> ({dichteRel! < 0.75 ? t("ui2.ui.ProvinceCard.2086473") : dichteRel! > 1.3 ? t("ui2.ui.ProvinceCard.dicht") : t("ui2.ui.ProvinceCard.7b91940")})</span>
              </dd>
              <dt>{t("ui2.ui.ProvinceCard.b0ea2e1")}</dt>
              <dd>{inf.schiene_km > 0 ? `${zahl(inf.schiene_km, 0)} km` : t("ui2.ui.ProvinceCard.ade5c0b")}</dd>
              <dt>{t("ui.ProvinceCard.384ddc5")}</dt>
              <dd>
                {inf.krankenhaeuser} ({nf(kh100k!, 1)} je 100.000 Einwohner)
              </dd>
              <dt>{t("ui.ProvinceCard.9fe8de3")}</dt>
              <dd>
                {inf.flughaefen} · {inf.kraftwerke}
              </dd>
            </dl>
            <p className="footnote">{t("ui.ProvinceCard.5533cde")}</p>
          </details>
        )}

        <h3 className="province-sub">{t("ui.ProvinceCard.ec52eb3")}</h3>
        <ul className="province-werte">
          {WERTE.map((wt) => {
            const v = world.net.values[NET.index.get(wt.id)! * PROVINCES + plaka - 1]!;
            const land = nationalAverage(NET, world.net, wt.id);
            return (
              <li key={wt.id}>
                <span>{t(`netz.knoten.${wt.id}.name`)}</span>
                <span className="bar" aria-hidden>
                  <i style={{ width: `${Math.max(2, Math.min(100, v))}%` }} className={v < land - 4 ? "schwach" : ""} />
                  <b style={{ left: `${Math.max(0, Math.min(100, land))}%` }} title={t("ui2.ui.ProvinceCard.cfaa7c5", { p0: nf(land, 0) })} />
                </span>
                <em>{nf(v, 0)}</em>
              </li>
            );
          })}
        </ul>

        {seats && (
          <ul className="province-seats">
            {Object.entries(seats)
              .filter(([, n]) => n > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([k, n]) => (
                <li key={k}>
                  <span className="dot" style={{ background: k === own?.kurz ? own.farbe : (PARTY_COLORS[k] ?? "#999") }} />
                  <span className="party">{k === own?.kurz ? own.name : k}</span>
                  <span className="n">{n}</span>
                </li>
              ))}
          </ul>
        )}

        {problems.length > 0 && (
          <div className="stamps">
            {problems.map((p) => (
              <span key={p} className="stamp">
                {p}
              </span>
            ))}
          </div>
        )}

        {projekte.length > 0 && (
          <>
            <h3 className="province-sub">{t("reich.bau.titel")}</h3>
            <ul className="province-projekte">
              {projekte.map((p) => (
                <li key={p.name}>
                  {t("ui2.ui.ProvinceCard.5f8ec3e", { p0: p.name, p1: nf(p.jetzt, 0), p2: nf(p.ziel, 0) })}
                </li>
              ))}
            </ul>
          </>
        )}

        {onVorgang && vorgaengeIn(world, plaka).length > 0 && (
          <>
            <h3 className="province-sub">{t("vorgang.sprung.karte")}</h3>
            <ul className="province-projekte">
              {vorgaengeIn(world, plaka).map((v) => (
                <li key={v.id}>
                  <button type="button" className="link" onClick={() => onVorgang(v.id)}>
                    {t("vorgang.ui.titel", { ort: d.name })}: {offenerKonflikt(v) ? t("vorgang.ui.entscheiden") : t(`vorgang.ui.schritt.${v.schritt}`)}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <button className="brass-button province-bauen" onClick={() => onBauen(plaka, bedarf)}>
          {bedarfKnopf(bedarf)}
        </button>
        <p className="footnote">{t("ui.ProvinceCard.3ac9e40")}</p>
      </div>
    </aside>
  );
}

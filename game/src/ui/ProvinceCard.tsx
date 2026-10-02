// Provinzblatt: Zahlen, Infrastruktur, Probleme, Bauvorhaben und der Weg, hier etwas zu tun.

import { NET } from "../sim/world";
import { nationalAverage, PROVINCES } from "../sim/netz";
import { PROVINZEN, REGION_DE } from "../sim/regional";
import { archetypName } from "../data/provinz_archetypen";
import { Corners } from "./art/Ornament";
import { PARTY_COLORS } from "./Parliament";
import INFRA from "../data/provinz_infra.json";
import type { World } from "../sim/types";

type Infra = { strasse_dichte: number; strasse_km: number; piste_km: number; schiene_km: number; flaeche_km2: number; krankenhaeuser: number; flughaefen: number; kraftwerke: number; bezirke: number };
const infra = INFRA.provinzen as Record<string, Infra>;
const LAND = (() => {
  const v = Object.values(infra);
  const km = v.reduce((s, p) => s + p.strasse_km, 0);
  const fl = v.reduce((s, p) => s + p.flaeche_km2, 0);
  return { dichte: km / fl };
})();

const nf = (x: number, d = 1) => x.toLocaleString("de-DE", { maximumFractionDigits: d, minimumFractionDigits: d });

const WERTE: { id: string; label: string }[] = [
  { id: "verkehrsnetz", label: "Straßen und Autobahnen" },
  { id: "gesundheitsversorgung", label: "Gesundheitsversorgung" },
  { id: "wasserversorgung", label: "Wasserversorgung" },
  { id: "stromversorgung", label: "Stromversorgung" },
  { id: "internet", label: "Breitband" },
];

export function ProvinceCard({ world, plaka, onClose, onBauen }: { world: World; plaka: number; onClose: () => void; onBauen: (plaka: number) => void }) {
  const d = PROVINZEN[plaka - 1]!;
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
        <button className="close" onClick={onClose} aria-label="Schließen">
          ✕
        </button>
      </header>
      <div className="province-body">
        <p className="kicker">Provinz Nr. {plaka} · {REGION_DE[d.region] ?? d.region}</p>
        <p className="kicker">Typ: {archetypName(plaka)}</p>
        <dl>
          <dt>Einwohner</dt>
          <dd>{d.bevoelkerung.toLocaleString("de-DE")}</dd>
          <dt>Wirtschaftskraft</dt>
          <dd>{d.bipProKopf.toLocaleString("de-DE")} ₺ pro Kopf</dd>
          <dt>Arbeitslosigkeit</dt>
          <dd>
            {d.arbeitslosigkeit.toLocaleString("de-DE")} %{d.arbeitslosigkeitHerkunft === "geschaetzt" ? " (geschätzt)" : ""}
          </dd>
          <dt>Rathaus seit 2024</dt>
          <dd>
            {d.buergermeister2024}
            {d.grossstadt ? " · Großstadt" : ""}
          </dd>
          <dt>Abgeordnete</dt>
          <dd>{d.sitze}</dd>
        </dl>

        {inf && (
          <>
            <h3 className="province-sub">Infrastruktur</h3>
            <dl>
              <dt>Straßennetz</dt>
              <dd>
                {inf.strasse_km.toLocaleString("de-DE", { maximumFractionDigits: 0 })} km · {nf(inf.strasse_dichte, 2)} je km²
                <span className={`rel ${dichteRel! < 0.75 ? "dünn" : dichteRel! > 1.3 ? "dicht" : ""}`}> ({dichteRel! < 0.75 ? "dünn" : dichteRel! > 1.3 ? "dicht" : "durchschnittlich"})</span>
              </dd>
              <dt>Bahnstrecken</dt>
              <dd>{inf.schiene_km > 0 ? `${inf.schiene_km.toLocaleString("de-DE", { maximumFractionDigits: 0 })} km` : "keine erfasst"}</dd>
              <dt>Krankenhäuser</dt>
              <dd>
                {inf.krankenhaeuser} ({nf(kh100k!, 1)} je 100.000 Einwohner)
              </dd>
              <dt>Flughäfen · Kraftwerke</dt>
              <dd>
                {inf.flughaefen} · {inf.kraftwerke}
              </dd>
            </dl>
            <p className="footnote">Quelle: OpenStreetMap. Erfasste Straßen und Einrichtungen, keine amtliche Zählung.</p>
          </>
        )}

        <h3 className="province-sub">Lage im Spiel</h3>
        <ul className="province-werte">
          {WERTE.map((wt) => {
            const v = world.net.values[NET.index.get(wt.id)! * PROVINCES + plaka - 1]!;
            const land = nationalAverage(NET, world.net, wt.id);
            return (
              <li key={wt.id}>
                <span>{wt.label}</span>
                <span className="bar" aria-hidden>
                  <i style={{ width: `${Math.max(2, Math.min(100, v))}%` }} className={v < land - 4 ? "schwach" : ""} />
                  <b style={{ left: `${Math.max(0, Math.min(100, land))}%` }} title={`Landesmittel ${nf(land, 0)}`} />
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
            <h3 className="province-sub">Im Bau</h3>
            <ul className="province-projekte">
              {projekte.map((p) => (
                <li key={p.name}>
                  {p.name}: Stufe {nf(p.jetzt, 0)} → {nf(p.ziel, 0)}
                </li>
              ))}
            </ul>
          </>
        )}

        <button className="brass-button province-bauen" onClick={() => onBauen(plaka)}>
          Hier bauen oder fördern …
        </button>
        <p className="footnote">Der Gouverneur wird vom Präsidenten ernannt.</p>
      </div>
    </aside>
  );
}

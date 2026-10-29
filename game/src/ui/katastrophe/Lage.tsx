// Lage und Vorsorge: die Bereitschaft des Landes, die Gefährdung nach Gebiet und Gefahr, die Hebel der Vorsorge
// mit Preis und Wirkung und ein Szenario („Was wäre bei einem Beben dort?“). Alles aus dem Modell, nichts erfunden.

import { useMemo, useState } from "react";
import type { World } from "../../sim/types";
import type { KatastrophenArt } from "../../sim/spiel-typen";
import { bringeEin } from "../../sim/handeln";
import {
  ART_NAMEN,
  bereitGegenReferenz,
  bereitSenkung,
  bereitschaft,
  KATASTROPHE,
  risikoUebersicht,
  staerkeWort,
  szenario,
  type RisikoGebiet,
  type RisikoSicht,
} from "../../sim/katastrophe";
import type { Ziel } from "../schreibtisch/briefing";
import { hebel, nf, type HebelZeile } from "./daten";

import { t } from "../../i18n";
const mio = (x: number) => `${nf(x / 1e6, 1)} Millionen`;

function gebietText(g: RisikoGebiet[], n = 5): string {
  const namen = g.slice(0, n).map((x) => x.name);
  return g.length > n ? `${namen.join(", ")} und ${g.length - n} weitere` : namen.join(", ");
}

// ---------------------------------------------------------------------------

function BereitschaftKarte({ stand }: { stand: number }) {
  const ref = KATASTROPHE.bereitReferenz;
  const gegen = bereitGegenReferenz(stand);
  return (
    <section className="kr-bereit" aria-label={t("ui.katastrophe.Lage.6d149ed")}>
      <div className="kr-bereit-zahl">
        <b>{stand}</b>
        <span>{t("ui.katastrophe.Lage.18df22a")}</span>
      </div>
      <div className="kr-bereit-text">
        <h3>{t("ui.katastrophe.Lage.c509fe3")}</h3>
        <div className="kr-skala" role="img" aria-label={t("ui2.ui.katastrophe.Lage.a9ce597", { p0: stand, p1: ref })}>
          <i className="fuell" style={{ width: `${stand}%` }} />
          <span className="marke ref" style={{ left: `${ref}%` }}>
            <em>{t("ui2.ui.katastrophe.Lage.462275f", { p0: ref })}</em>
          </span>
          <span className="marke heute" style={{ left: `${stand}%` }}>
            <em>{t("ui2.ui.katastrophe.Lage.de86eb4", { p0: stand })}</em>
          </span>
        </div>
        <p>
          {t("ui2.ui.katastrophe.Lage.feedc23")} <strong>{t("ui2.ui.katastrophe.Lage.9844a1b", { p0: nf(bereitSenkung(stand), 1) })}</strong> {t("ui2.ui.katastrophe.Lage.fa0adca")}
          {gegen !== 0 ? (
            <>
              {t("ui2.ui.katastrophe.Lage.7345c7c", { p0: ref })} {gegen > 0 ? t("ui2.ui.katastrophe.Lage.bc80ba0", { p0: nf(gegen, 1) }) : t("ui2.ui.katastrophe.Lage.bab09fd", { p0: nf(-gegen, 1) })}.
            </>
          ) : (
            <>{t("ui2.ui.katastrophe.Lage.393af98")}</>
          )}
        </p>
        <p className="kr-klein">{t("ui.katastrophe.Lage.bd9b25d")}</p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function Gefahr({ r }: { r: RisikoSicht }) {
  const prozent = Math.round(r.jahresChance * 1000) / 10;
  return (
    <li className="kr-gefahr">
      <div className="kr-gefahr-kopf">
        <h4>{r.titel}</h4>
        <span className={`kr-chance ${prozent >= 10 ? "hoch" : prozent >= 4 ? "mittel" : "niedrig"}`}>
          {r.jahresChance <= 0 ? "ruht" : `etwa ${nf(prozent, prozent < 10 ? 1 : 0)} %`}
          <small>{r.jahresChance <= 0 ? t("ui2.ui.katastrophe.Lage.9653262") : t("ui2.ui.katastrophe.Lage.85b9be6")}</small>
        </span>
      </div>
      <div className="kr-balken" aria-hidden>
        <i style={{ width: `${Math.min(100, (prozent / 30) * 100)}%` }} />
      </div>
      <p className="kr-gebiet">
        <strong>{t("ui.katastrophe.Lage.e2323f3")}</strong> {gebietText(r.gebiet)} <span>{t("ui2.ui.katastrophe.Lage.03a3385", { p0: r.gebiet.length, p1: mio(r.bevoelkerung) })}</span>
      </p>
      <p className="kr-gefahr-meta">
        <span>{t("ui2.ui.katastrophe.Lage.5c6f916", { p0: r.saison })}</span>
        {r.freiIn > 0 ? (
          <span>
            {t("ui2.ui.katastrophe.Lage.f590363", { p0: nf(r.letzteVor ?? 0), p1: r.freiIn })} {r.freiIn === 1 ? t("ui2.ui.katastrophe.Lage.da13625") : t("ui2.ui.katastrophe.Lage.1c561ae")}
          </span>
        ) : r.letzteVor !== undefined ? (
          <span>{t("ui2.ui.katastrophe.Lage.f4ac116", { p0: nf(r.letzteVor) })}</span>
        ) : (
          <span>{t("ui.katastrophe.Lage.ce040f9")}</span>
        )}
        {r.kennzahl && (
          <span className={r.kennzahl.gut === "hoch" ? (r.kennzahl.wert >= 50 ? "gut" : "schlecht") : r.kennzahl.wert <= 40 ? "gut" : "schlecht"}>
            {t("ui2.ui.katastrophe.Lage.96504fa", { p0: r.kennzahl.name, p1: r.kennzahl.wert })}
          </span>
        )}
      </p>
    </li>
  );
}

// ---------------------------------------------------------------------------

function HebelKarte({ h, w, refresh, melde, onGehe }: { h: HebelZeile; w: World; refresh: () => void; melde: (m: string) => void; onGehe?: (z: Ziel) => void }) {
  const laeuft = h.umsetzung < 100;
  return (
    <article className="kr-hebel">
      <header>
        <h4>{h.name}</h4>
        <span className="kr-chip">{t("ui2.ui.katastrophe.Lage.875014d", { p0: h.stufe })}</span>
      </header>
      <p className="kr-hebel-text">{h.text}</p>
      <div className="kr-hebel-stufen" aria-hidden>
        <div className="kr-balken">
          <i style={{ width: `${h.stufe}%` }} />
        </div>
        {!h.ausgeschoepft && <span className="ziel" style={{ left: `${h.ziel}%` }} />}
      </div>
      <p className="kr-hebel-schritt">
        {h.ausgeschoepft ? t("ui2.ui.katastrophe.Lage.4f775ff") : (
          <>
            {t("ui2.ui.katastrophe.Lage.4a5d07e", { p0: h.stufe })} <span aria-hidden>→</span> <strong>{h.ziel}</strong>
          </>
        )}
      </p>
      <ul className="kr-wirkung">
        {h.wirkung.map((x) => (
          <li key={x.auf}>
            {t("ui2.ui.katastrophe.Lage.67e5184")} <strong>{x.auf}</strong>
            {x.lag > 0 ? t("ui2.ui.katastrophe.Lage.7207a4e", { p0: x.lag, p1: x.lag === 1 ? "Monat" : "Monaten" }) : " sofort"}: {x.warum}
          </li>
        ))}
      </ul>
      {!h.ausgeschoepft && (
        <p className="kr-preis">
          <span>
            <b>{h.pk}</b> {t("ui2.ui.katastrophe.Lage.28d438e")}
          </span>
          <span>
            <b>{nf(h.bip, h.bip < 0.1 ? 3 : 2)}</b> {t("ui2.ui.katastrophe.Lage.fb307c6")}
          </span>
          <span>
            <b>{h.monate}</b> {h.monate === 1 ? t("ui2.ui.katastrophe.Lage.da13625") : t("ui2.ui.katastrophe.Lage.1c561ae")} {t("ui2.ui.katastrophe.Lage.2dd5af2")}
          </span>
        </p>
      )}
      {laeuft && (
        <p className="kr-umsetzung">
          {t("ui2.ui.katastrophe.Lage.964a093", { p0: h.umsetzung })}{h.restMonate ? t("ui2.ui.katastrophe.Lage.829dd4a", { p0: h.restMonate, p1: h.restMonate === 1 ? "Monat" : "Monate" }) : ""}.
        </p>
      )}
      {h.imParlament && <p className="kr-umsetzung">{t("ui2.ui.katastrophe.Lage.4a67db6")}</p>}
      {!h.moeglich && h.grund && <p className="kr-warn">{h.grund}</p>}
      {!h.ausgeschoepft && (
        <div className="kr-aktionen">
          <button
            type="button"
            className="kr-knopf haupt"
            disabled={!h.moeglich || !h.bezahlbar || h.imParlament}
            title={!h.bezahlbar ? t("ui2.ui.katastrophe.Lage.d5ee02f", { p0: h.pk, p1: Math.floor(w.spiel?.kapital ?? 0) }) : undefined}
            onClick={() => {
              const r = bringeEin(w, h.id, h.ziel, null, "gesetz");
              melde(r.why ? `${r.text} ${r.why}` : r.text);
              refresh();
            }}
          >
            {t("ui2.ui.katastrophe.Lage.abaa171")} <em>{t("ui2.ui.katastrophe.Lage.87b52bd", { p0: h.pk })}</em>
          </button>
          {onGehe && (
            <button type="button" className="kr-knopf" onClick={() => onGehe({ art: "politik", massnahme: { id: h.id, level: h.ziel } })}>
              {t("ui2.ui.katastrophe.Lage.d4cfbbf")}
            </button>
          )}
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------

const GEFAHREN: { art: KatastrophenArt; name: string }[] = [
  { art: "erdbeben", name: "Erdbeben" },
  { art: "flut", name: "Sturzflut" },
  { art: "waldbrand", name: "Großbrand" },
];
const STAERKEN = [
  { wert: 0.5, name: "spürbar" },
  { wert: 0.75, name: "schwer" },
  { wert: 0.95, name: "verheerend" },
];

function Szenario({ w, risiken }: { w: World; risiken: RisikoSicht[] }) {
  const [art, setArt] = useState<KatastrophenArt>("erdbeben");
  const [staerke, setStaerke] = useState(0.75);
  // Erdbeben: nur Provinzen mit Risiko ab Stufe 3 (so wählt auch die Mechanik das Epizentrum); sonst das Gebiet der Gefahr
  const provinzen = useMemo(() => {
    const quellen = risiken.filter((r) => r.art === art);
    const alle = quellen.flatMap((r) => r.gebiet).filter((g) => art !== "erdbeben" || (g.risiko ?? 0) >= 3);
    const einmal = new Map(alle.map((g) => [g.plaka, g]));
    return [...einmal.values()].sort((a, b) => b.bevoelkerung - a.bevoelkerung);
  }, [risiken, art]);
  const [plaka, setPlaka] = useState<number | null>(null);
  const gewaehlt = provinzen.find((p) => p.plaka === plaka) ?? provinzen[0];
  const stand = Math.round(bereitschaft(w));
  const zeilen = gewaehlt
    ? szenario(w, art, [gewaehlt.plaka], staerke, [
        { name: "Ohne Vorsorge", stand: 0 },
        { name: "Heute", stand },
        { name: stand >= 80 ? "Voll ausgebaut" : "Bei Bereitschaft 80", stand: stand >= 80 ? 100 : 80 },
      ])
    : [];

  return (
    <section className="kr-szenario">
      <h3>{t("ui.katastrophe.Lage.18b8780")}</h3>
      <div className="kr-szenario-wahl">
        <label>
          {t("ui2.ui.katastrophe.Lage.7a20fb8")}
          <select value={art} onChange={(e) => { setArt(e.target.value as KatastrophenArt); setPlaka(null); }}>
            {GEFAHREN.map((g) => (
              <option key={g.art} value={g.art}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("ui2.ui.katastrophe.Lage.d784889")}
          <select value={gewaehlt?.plaka ?? ""} onChange={(e) => setPlaka(Number(e.target.value))}>
            {provinzen.map((p) => (
              <option key={p.plaka} value={p.plaka}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("ui2.ui.katastrophe.Lage.7e752b5")}
          <select value={staerke} onChange={(e) => setStaerke(Number(e.target.value))}>
            {STAERKEN.map((s) => (
              <option key={s.wert} value={s.wert}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {gewaehlt && (
        <table className="kr-szenario-tabelle">
          <thead>
            <tr>
              <th scope="col">{t("ui.katastrophe.Lage.99cafe1")}</th>
              <th scope="col">{t("ui2.ui.katastrophe.Lage.c99f806")}</th>
              <th scope="col">{t("ui2.ui.katastrophe.Lage.5280572")}</th>
              <th scope="col">{t("ui.katastrophe.Lage.0bfc8c3")}</th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z) => (
              <tr key={z.name} className={z.name === "Heute" ? "heute" : ""}>
                <th scope="row">
                  {z.name} <small>({z.stand})</small>
                </th>
                <td>{nf(z.tote)}</td>
                <td>{nf(z.obdachlos)}</td>
                <td>{nf(z.wohnungen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="kr-klein">
        {t("ui2.ui.katastrophe.Lage.972ce58")} {gewaehlt ? t("ui2.ui.katastrophe.Lage.c2c3b3a", { p0: ART_NAMEN[art], p1: staerkeWort(STAERKEN.find((s) => s.wert === staerke)!.wert), p2: gewaehlt.name }) : t("ui2.ui.katastrophe.Lage.93cb618")}{t("ui2.ui.katastrophe.Lage.6abc46b")}
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------

export function Lage({ world, refresh, melde, onGehe }: { world: World; refresh: () => void; melde: (m: string) => void; onGehe?: (z: Ziel) => void }) {
  const stand = Math.round(bereitschaft(world));
  const risiken = risikoUebersicht(world);
  const hebelListe = hebel(world);
  return (
    <div className="kr-lage">
      <BereitschaftKarte stand={stand} />

      <section className="kr-abschnitt">
        <h3>{t("ui.katastrophe.Lage.1952bf9")}</h3>
        <ul className="kr-gefahren">
          {risiken.map((r) => (
            <Gefahr key={r.id} r={r} />
          ))}
        </ul>
      </section>

      <section className="kr-abschnitt">
        <h3>{t("ui.katastrophe.Lage.7338818")}</h3>
        <div className="kr-hebel-raster">
          {hebelListe.map((h) => (
            <HebelKarte key={h.id} h={h} w={world} refresh={refresh} melde={melde} {...(onGehe ? { onGehe } : {})} />
          ))}
        </div>
      </section>

      <Szenario w={world} risiken={risiken} />
    </div>
  );
}

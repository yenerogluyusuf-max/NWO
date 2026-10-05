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
    <section className="kr-bereit" aria-label="Bereitschaft des Katastrophenschutzes">
      <div className="kr-bereit-zahl">
        <b>{stand}</b>
        <span>von 100</span>
      </div>
      <div className="kr-bereit-text">
        <h3>Bereitschaft des Katastrophenschutzes (AFAD)</h3>
        <div className="kr-skala" role="img" aria-label={`Bereitschaft ${stand} von 100, Referenz ${ref}`}>
          <i className="fuell" style={{ width: `${stand}%` }} />
          <span className="marke ref" style={{ left: `${ref}%` }}>
            <em>Referenz {ref}</em>
          </span>
          <span className="marke heute" style={{ left: `${stand}%` }}>
            <em>heute {stand}</em>
          </span>
        </div>
        <p>
          Bei einer schweren Katastrophe sterben nach Modellrechnung etwa <strong>{nf(bereitSenkung(stand), 1)} Prozent</strong> weniger Menschen als ganz ohne Vorsorge
          {gegen !== 0 ? (
            <>
              ; gegenüber der Referenz {ref} sind es {gegen > 0 ? `${nf(gegen, 1)} Prozent weniger` : `${nf(-gegen, 1)} Prozent mehr`}.
            </>
          ) : (
            <>, genau wie bei der Referenz.</>
          )}
        </p>
        <p className="kr-klein">Die Bereitschaft wächst mit dem Ausbau der Behörde, dem Frühwarnsystem, der Pflichtversicherung und der Gebäude-Verstärkung, jeweils mit Verzögerung.</p>
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
          <small>{r.jahresChance <= 0 ? "Ruhephase im Modell" : "in zwölf Monaten"}</small>
        </span>
      </div>
      <div className="kr-balken" aria-hidden>
        <i style={{ width: `${Math.min(100, (prozent / 30) * 100)}%` }} />
      </div>
      <p className="kr-gebiet">
        <strong>Gefährdet:</strong> {gebietText(r.gebiet)} <span>({r.gebiet.length} Provinzen, {mio(r.bevoelkerung)} Einwohner)</span>
      </p>
      <p className="kr-gefahr-meta">
        <span>Saison: {r.saison}</span>
        {r.freiIn > 0 ? (
          <span>
            Ruhephase nach dem letzten Fall (vor {nf(r.letzteVor ?? 0)} Monaten): noch {r.freiIn} {r.freiIn === 1 ? "Monat" : "Monate"}
          </span>
        ) : r.letzteVor !== undefined ? (
          <span>Letzter Fall vor {nf(r.letzteVor)} Monaten</span>
        ) : (
          <span>Noch kein Fall in dieser Partie</span>
        )}
        {r.kennzahl && (
          <span className={r.kennzahl.gut === "hoch" ? (r.kennzahl.wert >= 50 ? "gut" : "schlecht") : r.kennzahl.wert <= 40 ? "gut" : "schlecht"}>
            {r.kennzahl.name}: {r.kennzahl.wert} von 100
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
        <span className="kr-chip">Stufe {h.stufe}</span>
      </header>
      <p className="kr-hebel-text">{h.text}</p>
      <div className="kr-hebel-stufen" aria-hidden>
        <div className="kr-balken">
          <i style={{ width: `${h.stufe}%` }} />
        </div>
        {!h.ausgeschoepft && <span className="ziel" style={{ left: `${h.ziel}%` }} />}
      </div>
      <p className="kr-hebel-schritt">
        {h.ausgeschoepft ? "Ausgeschöpft: mehr ist kaum möglich." : (
          <>
            Nächster Schritt: Stufe {h.stufe} <span aria-hidden>→</span> <strong>{h.ziel}</strong>
          </>
        )}
      </p>
      <ul className="kr-wirkung">
        {h.wirkung.map((x) => (
          <li key={x.auf}>
            Wirkt auf <strong>{x.auf}</strong>
            {x.lag > 0 ? ` nach etwa ${x.lag} ${x.lag === 1 ? "Monat" : "Monaten"}` : " sofort"}: {x.warum}
          </li>
        ))}
      </ul>
      {!h.ausgeschoepft && (
        <p className="kr-preis">
          <span>
            <b>{h.pk}</b> Kapital
          </span>
          <span>
            <b>{nf(h.bip, h.bip < 0.1 ? 3 : 2)}</b> % des BIP im Jahr
          </span>
          <span>
            <b>{h.monate}</b> {h.monate === 1 ? "Monat" : "Monate"} bis zur vollen Wirkung
          </span>
        </p>
      )}
      {laeuft && (
        <p className="kr-umsetzung">
          Beschlossen und in Umsetzung: {h.umsetzung} Prozent{h.restMonate ? `, noch etwa ${h.restMonate} ${h.restMonate === 1 ? "Monat" : "Monate"}` : ""}.
        </p>
      )}
      {h.imParlament && <p className="kr-umsetzung">Ein Gesetzentwurf liegt im Parlament.</p>}
      {!h.moeglich && h.grund && <p className="kr-warn">{h.grund}</p>}
      {!h.ausgeschoepft && (
        <div className="kr-aktionen">
          <button
            type="button"
            className="kr-knopf haupt"
            disabled={!h.moeglich || !h.bezahlbar || h.imParlament}
            title={!h.bezahlbar ? `Es fehlt Politisches Kapital (nötig ${h.pk}, vorhanden ${Math.floor(w.spiel?.kapital ?? 0)})` : undefined}
            onClick={() => {
              const r = bringeEin(w, h.id, h.ziel, null, "gesetz");
              melde(r.why ? `${r.text} ${r.why}` : r.text);
              refresh();
            }}
          >
            Als Gesetz einbringen <em>{h.pk} Kapital</em>
          </button>
          {onGehe && (
            <button type="button" className="kr-knopf" onClick={() => onGehe({ art: "politik", massnahme: { id: h.id, level: h.ziel } })}>
              Im Politikfenster ansehen
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
      <h3>Szenario: Was wäre, wenn …</h3>
      <div className="kr-szenario-wahl">
        <label>
          Gefahr
          <select value={art} onChange={(e) => { setArt(e.target.value as KatastrophenArt); setPlaka(null); }}>
            {GEFAHREN.map((g) => (
              <option key={g.art} value={g.art}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Provinz
          <select value={gewaehlt?.plaka ?? ""} onChange={(e) => setPlaka(Number(e.target.value))}>
            {provinzen.map((p) => (
              <option key={p.plaka} value={p.plaka}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Stärke
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
              <th scope="col">Bereitschaft</th>
              <th scope="col">Todesopfer</th>
              <th scope="col">Ohne Obdach</th>
              <th scope="col">Zerstörte Wohnungen</th>
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
        Modellrechnung für {gewaehlt ? `${ART_NAMEN[art]} (${staerkeWort(STAERKEN.find((s) => s.wert === staerke)!.wert)}) allein in ${gewaehlt.name}` : "eine Provinz"}; bei mehreren betroffenen Provinzen
        entsprechend mehr. Bandbreite ±25 %, alle Werte sind Spielparameter.
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
        <h3>Gefährdung des Landes</h3>
        <ul className="kr-gefahren">
          {risiken.map((r) => (
            <Gefahr key={r.id} r={r} />
          ))}
        </ul>
        <p className="kr-klein">
          Wahrscheinlichkeiten sind Spielparameter der Kalibrierung, keine Prognosen. Risikostufen der Provinzen: provinz_profile.csv; die Bruchzonen sind grob nach den
          GEM Global Active Faults zugeordnet.
        </p>
      </section>

      <section className="kr-abschnitt">
        <h3>Vorsorge: Was Sie tun können</h3>
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

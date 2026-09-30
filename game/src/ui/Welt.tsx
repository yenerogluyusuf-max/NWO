// Die Welt: die übrigen Länder als Gegenüber. Links die Länderliste mit Flagge und Haltung, rechts die Akte des gewählten Landes:
// Überblick (Lage, Anliegen, Kennzahlen), Verhandlungstisch, Verträge und einzelne Handlungen. Dazu die Vermittlung zwischen Dritten.

import { useState } from "react";
import type { World } from "../sim/types";
import { AKTIONEN, LAENDER, aktionenFuer, anliegenStand, dimensionZu, fuehreAktionAus, haltungWort, land, weltZustand, type Dimension } from "../sim/laender";
import { NET } from "../sim/modell";
import { tunWort } from "../data/skalen";
import { formatDateDe } from "../sim/dates";
import { laufende } from "../sim/abkommen";
import daten from "../data/vergleich.json";
import { Flagge, flaggenFarben } from "./art/Flaggen";
import { Verhandlungstisch } from "./welt/Verhandlungstisch";
import { Vertraege } from "./welt/Vertraege";
import { Vermittlung } from "./welt/Vermittlung";
import type { WeltTab } from "./welt/LandPopover";
import "./welt/welt.css";

const DIM: { id: Dimension; label: string; text: string }[] = [
  { id: "handel", label: "Handel", text: "Güter-, Dienstleistungs- und Energieverflechtung" },
  { id: "sicherheit", label: "Sicherheit", text: "Militärische Zusammenarbeit und gemeinsame Bedrohungswahrnehmung" },
  { id: "vertrauen", label: "Vertrauen", text: "Zuverlässigkeit, Erinnerung an gehaltene und gebrochene Zusagen" },
  { id: "konflikt", label: "Konflikt", text: "Offene Streitpunkte: je höher, desto heftiger" },
];

const KENNZAHLEN: { key: string; label: string; einheit: string }[] = [
  { key: "FP.CPI.TOTL.ZG", label: "Inflation", einheit: "%" },
  { key: "SL.UEM.TOTL.ZS", label: "Arbeitslosigkeit", einheit: "%" },
  { key: "NY.GDP.MKTP.KD.ZG", label: "Wirtschaftswachstum", einheit: "%" },
  { key: "MS.MIL.XPND.GD.ZS", label: "Verteidigungsausgaben", einheit: "% des BIP" },
];

type Indikatoren = Record<string, { tur: { wert: number; jahr: number }; laender: Record<string, [number, number]> }>;
const IND = (daten as unknown as { indikatoren: Indikatoren }).indikatoren;
const nf = (x: number) => x.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const TABS: { id: WeltTab; label: string }[] = [
  { id: "ueberblick", label: "Überblick" },
  { id: "verhandeln", label: "Verhandlungstisch" },
  { id: "vertraege", label: "Verträge" },
  { id: "handeln", label: "Gesten" },
];

const GRUPPEN = ["Große Mächte", "Verbündete und Partner", "Nachbarn"] as const;

export function Welt({ world, refresh, onMassnahme, start, startTab }: { world: World; refresh: () => void; onMassnahme?: (id: string, richtung: 1 | -1) => void; start?: string; startTab?: WeltTab }) {
  const [gewaehlt, setGewaehlt] = useState<string>(start ?? "EU");
  const [tab, setTab] = useState<WeltTab>(startTab ?? "ueberblick");
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  if (!world.spiel) return <p>Ohne Spielschleife gibt es keine Außenpolitik.</p>;
  const vermittlung = gewaehlt === "vermittlung";
  const l = vermittlung ? null : land(gewaehlt);
  const waehle = (id: string) => {
    setGewaehlt(id);
    setAntwort(null);
  };

  return (
    <div className={`we${tab === "verhandeln" && !vermittlung ? " schmal" : ""}`}>
      <nav className="we-liste" aria-label="Länder">
        {GRUPPEN.map((g) => (
          <div key={g} className="we-gruppe">
            <b>{g}</b>
            <ul>
              {LAENDER.filter((x) => x.gruppe === g).map((x) => {
                const v = dimensionZu(world, x.id, "vertrauen");
                const k = weltZustand(world)[x.id]!.konflikt;
                const n = laufende(world, x.id).length;
                return (
                  <li key={x.id}>
                    <button type="button" className={`we-eintrag${gewaehlt === x.id ? " on" : ""}`} onClick={() => waehle(x.id)} aria-pressed={gewaehlt === x.id} title={x.name}>
                      <Flagge id={x.id} breite={34} />
                      <span className="we-name">{x.name}</span>
                      <span className={`we-haltung ton-${v >= 55 ? "gut" : v >= 35 ? "mittel" : "schlecht"}`}>
                        {haltungWort(world, x.id)}
                        {k >= 65 ? " · Streit" : ""}
                      </span>
                      {n > 0 && (
                        <b className="we-vertragszahl" title={`${n} laufende Verträge`}>
                          {n}
                        </b>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div className="we-gruppe">
          <b>Zwischen Dritten</b>
          <ul>
            <li>
              <button type="button" className={`we-eintrag${vermittlung ? " on" : ""}`} onClick={() => waehle("vermittlung")} aria-pressed={vermittlung}>
                <span className="we-vermittlung-zeichen" aria-hidden>
                  ⇄
                </span>
                <span className="we-name">Vermittlung</span>
                <span className="we-haltung">Ankara als Vermittler</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <div className="we-akte">
        {vermittlung && <Vermittlung world={world} refresh={refresh} />}
        {l && (
          <>
            <header className="we-kopf" style={{ ["--flagge-1" as string]: flaggenFarben(gewaehlt)[0], ["--flagge-2" as string]: flaggenFarben(gewaehlt)[1] }}>
              <Flagge id={gewaehlt} breite={78} titel={l.name} />
              <div className="we-kopf-text">
                <h3>
                  {l.name} <em className="we-haltung-gross">{haltungWort(world, gewaehlt)}</em>
                </h3>
                <p>{l.text}</p>
              </div>
            </header>

            <div className="we-dimensionen">
              {DIM.map((d) => {
                const wert = dimensionZu(world, gewaehlt, d.id);
                return (
                  <div key={d.id} className={`we-dim dim-${d.id}`} title={d.text}>
                    <span>{d.label}</span>
                    <span className="we-balken" aria-hidden>
                      <i style={{ width: `${wert}%` }} />
                    </span>
                    <strong>{Math.round(wert)}</strong>
                  </div>
                );
              })}
            </div>

            <div className="we-tabs" role="tablist" aria-label={`${l.name}: Ansicht`}>
              {TABS.map((t) => {
                const n = t.id === "vertraege" ? laufende(world, gewaehlt).length : 0;
                return (
                  <button key={t.id} role="tab" type="button" aria-selected={tab === t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)}>
                    {t.label}
                    {n > 0 && <b>{n}</b>}
                  </button>
                );
              })}
            </div>

            {tab === "ueberblick" && <Ueberblick world={world} landId={gewaehlt} onMassnahme={onMassnahme} onVerhandeln={() => setTab("verhandeln")} />}
            {tab === "verhandeln" && <Verhandlungstisch key={gewaehlt} world={world} landId={gewaehlt} refresh={refresh} onVertraege={() => setTab("vertraege")} />}
            {tab === "vertraege" && <Vertraege world={world} landId={gewaehlt} refresh={refresh} />}
            {tab === "handeln" && (
              <div className="we-gesten">
                <p className="subtitle">Einzelne Gesten kosten weniger als ein Vertrag und wirken schneller, aber nicht so lange. Große Vorhaben gehören an den Verhandlungstisch.</p>
                {antwort && (
                  <p className={`we-rueck ${antwort.ok ? "ok" : "nein"}`} role="status">
                    {antwort.text}
                    {antwort.why && <em> {antwort.why}</em>}
                  </p>
                )}
                <ul className="we-aktionen">
                  {aktionenFuer(world, gewaehlt).map((a) => (
                    <li key={a.aktion.id}>
                      <button
                        type="button"
                        className="aktion-knopf"
                        disabled={!a.moeglich}
                        onClick={() => {
                          setAntwort(fuehreAktionAus(world, gewaehlt, a.aktion.id));
                          refresh();
                        }}
                      >
                        {a.aktion.label} <b>{a.aktion.pk}</b>
                      </button>
                      <span>{a.moeglich ? AKTIONEN[a.aktion.id].hinweis : a.grund}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Ueberblick({ world, landId, onMassnahme, onVerhandeln }: { world: World; landId: string; onMassnahme?: (id: string, richtung: 1 | -1) => void; onVerhandeln: () => void }) {
  const l = land(landId);
  const z = weltZustand(world)[landId]!;
  const stand = anliegenStand(world, landId);
  const zeilen = KENNZAHLEN.map((k) => ({ k, wert: IND[k.key]?.laender[l.iso] })).filter((x) => x.wert);
  return (
    <div className="we-ueberblick">
      <div className="we-anliegen">
        <b>Was {l.name} von der Türkei will</b>
        <ul>
          {stand.map((s) => (
            <li key={s.anliegen.id} className={s.erfuellt ? "ok" : "offen"}>
              <span aria-hidden>{s.erfuellt ? "✓" : "○"}</span>
              <span>
                <strong>{s.anliegen.titel}</strong>: {s.anliegen.text} <em>{s.text}</em>
                {!s.erfuellt && (s.anliegen.bedingung.art === "massnahme" || s.anliegen.bedingung.art === "massnahme-max") && (
                  <button
                    type="button"
                    className="link"
                    onClick={() => {
                      const b = s.anliegen.bedingung as { id: string; art: string };
                      onMassnahme?.(b.id, b.art === "massnahme" ? 1 : -1);
                    }}
                  >
                    {" "}
                    {tunWort((s.anliegen.bedingung as { id: string }).id, s.anliegen.bedingung.art === "massnahme" ? 1 : -1)}: {NET.nodes[NET.index.get((s.anliegen.bedingung as { id: string }).id)!]!.name}
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
        <button type="button" className="aktion-knopf we-zum-tisch" onClick={onVerhandeln}>
          Zum Verhandlungstisch
        </button>
      </div>

      {!l.wdi || zeilen.length === 0 ? (
        <p className="subtitle">Für dieses Land liegen keine Weltbank-Daten im Spiel vor.</p>
      ) : (
        <div className="we-zahlen">
          <b>Zum Vergleich (Weltbank, letzter Wert)</b>
          <table>
            <tbody>
              {zeilen.map(({ k, wert }) => (
                <tr key={k.key}>
                  <th>{k.label}</th>
                  <td>
                    {nf(wert![0])} {k.einheit} <em>({wert![1]})</em>
                  </td>
                  <td className="we-tur">
                    Türkei {nf(IND[k.key]!.tur.wert)} <em>({IND[k.key]!.tur.jahr})</em>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {l.id === "EU" && <p className="subtitle">Als Maßstab dient Deutschland.</p>}
        </div>
      )}

      {(z.abkommen.length > 0 || z.erinnerung.length > 0) && (
        <div className="we-erinnerung">
          <b>Erinnerung</b>
          <ul>
            {z.abkommen.slice(-4).map((a) => (
              <li key={a}>{a}</li>
            ))}
            {[...z.erinnerung]
              .reverse()
              .slice(0, 3)
              .map((e) => (
                <li key={e}>{e.replace(/^(\d{4})-(\d{2})-(\d{2}):/, (_, j, m, t) => `${formatDateDe(`${j}-${m}-${t}`)}:`)}</li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

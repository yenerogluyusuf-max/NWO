// Der Wahlabend: Vollbild mit Hochrechnung in Stufen, Provinzkarte, Kandidaten, Sitzverteilung vorher und nachher, Reaktionen und der Rede des Präsidenten.
// Reine Darstellung: Das Ergebnis kommt aus der Simulation (sim/wahl.ts), die Rede geht über `onRede` zurück (sim/wahl.ts: rede()).
// Die Provinzkarte ist eine einfache Zeichnung der Provinzgrenzen (d3-geo), unabhängig von der 3D-Karte.

import { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import raw from "../../data/provinzen.json";
import { hochrechnung } from "../../sim/wahl";
import { PARTY_COLORS } from "../parlament/lage";
import { Corners, Flourish } from "../art/Ornament";
import { Vignette } from "../art/Vignette";
import { Portraet } from "../art/Portraet";
import { rendere, t, zahl } from "../../i18n";
import type { WahlErgebnis, WahlRede } from "../../sim/spiel-typen";
import "./wahl.css";

const BREITE = 640;
const HOEHE = 300;

let pfadCache: { plaka: number; d: string }[] | null = null;
function provinzPfade(): { plaka: number; d: string }[] {
  if (pfadCache) return pfadCache;
  const fc = raw as unknown as FeatureCollection<Geometry, { plaka: number }>;
  const projektion = geoMercator().fitSize([BREITE, HOEHE], fc as never);
  const pfad = geoPath(projektion);
  pfadCache = fc.features.map((f) => ({ plaka: f.properties.plaka, d: pfad(f as never) ?? "" }));
  return pfadCache;
}

/** Sitze auf konzentrischen Halbkreisen, von links nach rechts nach Winkel geordnet. */
export function sitzPunkte(n: number, reihen = 7): { x: number; y: number }[] {
  if (n <= 0) return [];
  const radien = Array.from({ length: reihen }, (_, i) => 36 + (i * (104 - 36)) / (reihen - 1));
  const summe = radien.reduce((a, b) => a + b, 0);
  const proReihe = radien.map((r) => Math.round((n * r) / summe));
  proReihe[reihen - 1] = Math.max(0, proReihe[reihen - 1]! + (n - proReihe.reduce((a, b) => a + b, 0)));
  const punkte: { x: number; y: number; w: number }[] = [];
  radien.forEach((r, i) => {
    const k = proReihe[i]!;
    for (let j = 0; j < k; j++) {
      const w = k === 1 ? Math.PI / 2 : Math.PI * (1 - j / (k - 1));
      punkte.push({ x: 112 + r * Math.cos(w), y: 112 - r * Math.sin(w), w });
    }
  });
  return punkte.sort((a, b) => b.w - a.w).map(({ x, y }) => ({ x, y }));
}

const FARBE_UNBEKANNT = "#9a8f78";
const farbeVon = (partei: string): string => (PARTY_COLORS as Record<string, string>)[partei] ?? FARBE_UNBEKANNT;

function Halbrund({ sitze, ordnung, titel, summe }: { sitze: Record<string, number>; ordnung: string[]; titel: string; summe: number }) {
  const punkte = useMemo(() => sitzPunkte(Object.values(sitze).reduce((a, b) => a + b, 0)), [sitze]);
  const farben: string[] = [];
  for (const p of ordnung) for (let i = 0; i < (sitze[p] ?? 0); i++) farben.push(farbeVon(p));
  return (
    <figure>
      <svg viewBox="0 0 224 122" role="img" aria-label={titel}>
        {punkte.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.1} fill={farben[i] ?? FARBE_UNBEKANNT} />
        ))}
      </svg>
      <figcaption>
        <strong>{summe}</strong>
        {titel}
      </figcaption>
    </figure>
  );
}

const WER_ZEICHEN = ["opposition", "wahlrat", "ausland", "maerkte", "partei"] as const;

export interface WahlabendProps {
  ergebnis: WahlErgebnis;
  /** Wird die Rede gewählt, ruft die Ansicht das auf und zeigt den Ausgang (liefert den Text der Simulation) */
  onRede?: (ton: WahlRede) => string | undefined;
  onSchliessen: () => void;
  /** Startstufe der Auszählung (0 bis 5); fehlt sie, läuft die Auszählung von vorn */
  stufe?: number;
}

export function Wahlabend({ ergebnis, onRede, onSchliessen, stufe: stufeStart }: WahlabendProps) {
  const rechnung = useMemo(() => hochrechnung(ergebnis), [ergebnis]);
  const nachgetragen = !!ergebnis.nachgetragen;
  // Die nachgetragene Wahl hat keine Hochrechnung der Präsidentenwahl: Alles steht sofort da
  const [stufe, setStufe] = useState(stufeStart ?? (nachgetragen ? rechnung.length : 0));
  const [rede, setRede] = useState<{ ton: WahlRede; text: string } | null>(ergebnis.rede ? { ton: ergebnis.rede, text: "" } : null);
  useEffect(() => {
    if (stufeStart !== undefined || nachgetragen) return;
    const ruhig = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (ruhig) {
      setStufe(rechnung.length);
      return;
    }
    const takt = window.setInterval(() => setStufe((s) => (s >= rechnung.length ? s : s + 1)), 950);
    return () => window.clearInterval(takt);
  }, [rechnung.length, stufeStart, nachgetragen]);

  const fertig = stufe >= rechnung.length;
  const aktuell = stufe > 0 ? rechnung[Math.min(stufe, rechnung.length) - 1]! : null;
  const letzte = ergebnis.runden[ergebnis.runden.length - 1]!;
  const amtK = ergebnis.kandidaten.find((k) => k.id === "amt")!;
  const gegnerK = ergebnis.kandidaten.find((k) => k.id === "gegner")!;
  const dritteK = ergebnis.kandidaten.find((k) => k.id === "dritte")!;
  const zeigeDritte = ergebnis.runden.length === 1 && letzte.anteile.dritte !== undefined;
  const p0 = ergebnis.parlament;
  const gezaehlt = aktuell?.provinzen ?? [];
  const gezaehltSet = useMemo(() => new Set(gezaehlt), [gezaehlt]);
  const eigeneFarbe = farbeVon(amtK.partei);
  const gegnerFarbe = farbeVon(gegnerK.partei);

  const zeilen = [
    { k: amtK, anteil: aktuell?.amt ?? 0, farbe: eigeneFarbe, id: "amt" as const },
    { k: gegnerK, anteil: aktuell?.gegner ?? 0, farbe: gegnerFarbe, id: "gegner" as const },
    ...(zeigeDritte ? [{ k: dritteK, anteil: aktuell?.dritte ?? 0, farbe: farbeVon(dritteK.partei), id: "dritte" as const }] : []),
  ];

  const p = ergebnis.parlament;
  const ordnung = useMemo(() => {
    const lager = p.lagerNachher.length ? p.lagerNachher : p.lagerVorher;
    const rest = Object.keys({ ...p.sitzeVorher, ...p.sitzeNachher })
      .filter((x) => !lager.includes(x))
      .sort((a, b) => (p.sitzeNachher[b] ?? 0) - (p.sitzeNachher[a] ?? 0));
    return [...lager, ...rest];
  }, [p]);

  const marge = ergebnis.marge;
  const zusammenfassung = ergebnis.gewonnen
    ? t(ergebnis.letzteWahl ? "wahl.ui.sieg_nachfolger" : "wahl.ui.sieg", { name: amtK.name, anteil: letzte.anteile.amt ?? 0, marge })
    : t(ergebnis.letzteWahl ? "wahl.ui.niederlage_nachfolger" : "wahl.ui.niederlage", { name: gegnerK.name, anteil: letzte.anteile.gegner ?? 0, marge });

  return (
    <div className="wn-layer" role="dialog" aria-modal="true" aria-labelledby="wn-titel">
      <article className="frame wn">
        <Corners />
        <header className="wn-kopf">
          <Vignette scene="wahlnacht" banner={t("wahl.ui.banner")} />
          <div className="wn-titel">
            <h2 id="wn-titel">{nachgetragen ? t("wahl.ui.titel_nachgetragen") : ergebnis.letzteWahl ? t("wahl.ui.titel_letzte") : t("wahl.ui.titel")}</h2>
            <span className="wn-datum">{t("wahl.ui.datum", { d: ergebnis.datum })}</span>
          </div>
        </header>

        <div className="wn-koerper">
          {nachgetragen ? (
            <section className="wn-block">
              <h3>{t("wahl.ui.nachtrag_kopf", { datum: ergebnis.datum })}</h3>
              <p className="wn-schwelle">{t("wahl.ui.nachtrag_text")}</p>
              <h3 style={{ marginTop: 10 }}>{t("wahl.ui.stimmenanteile")}</h3>
              <div className="wn-parteienanteile">
                {Object.entries(p0.anteile)
                  .filter(([, a]) => a > 0)
                  .sort((x, y) => y[1] - x[1])
                  .map(([partei, a]) => (
                    <div key={partei} className="zeile">
                      <span>{partei}</span>
                      <i style={{ width: `${Math.max(2, Math.min(100, a * 2))}%`, background: farbeVon(partei) }} />
                      <b>{zahl(a, 1)} %</b>
                    </div>
                  ))}
              </div>
              <p className="wn-schwelle">{t("wahl.ui.beteiligung", { prozent: letzte.beteiligung })}</p>
            </section>
          ) : (
<section className="wn-block">
              <h3>{ergebnis.runden.length > 1 ? t("wahl.ui.stichwahl") : t("wahl.ui.ergebnis")}</h3>
              <p className="wn-fortschritt">
                <span>{fertig ? t("wahl.ui.endergebnis") : t("wahl.ui.ausgezaehlt", { prozent: Math.round((aktuell?.gezaehlt ?? 0) * 100) })}</span>
                <span className="balken" aria-hidden>
                  <i style={{ width: `${Math.round((aktuell?.gezaehlt ?? 0) * 100)}%` }} />
                </span>
                <span>{t("wahl.ui.beteiligung", { prozent: letzte.beteiligung })}</span>
              </p>
              <div className="wn-kandidaten">
                {zeilen.map((z) => (
                  <div key={z.id} className={`wn-kandidat${fertig && ergebnis.sieger === z.id ? " sieger" : ""}`}>
                    <Portraet seed={z.k.name} tint={z.farbe} size={54} rahmen="tinte" stimmung={fertig ? (ergebnis.sieger === z.id ? "sicher" : "besorgt") : "neutral"} />
                    <span className="name">
                      {z.k.name}
                      <small>{z.k.parteiName}</small>
                    </span>
                    <span className="zahl">{aktuell ? zahl(z.anteil, 1) : "–"}{aktuell ? " %" : ""}</span>
                    <span className="spur">
                      <i style={{ width: `${Math.max(0, Math.min(100, z.anteil))}%`, background: z.farbe }} />
                    </span>
                  </div>
                ))}
              </div>
              <p className="wn-schwelle">{t("wahl.ui.schwelle")}</p>
              {ergebnis.runden.length > 1 && (
                <div className="wn-runden">
                  {ergebnis.runden.map((r) => (
                    <div key={r.nr} className="wn-runde">
                      <b>{t("wahl.ui.runde", { nr: r.nr })}</b>
                      {amtK.name}: {zahl(r.anteile.amt ?? 0, 1)}&nbsp;% · {gegnerK.name}: {zahl(r.anteile.gegner ?? 0, 1)}&nbsp;%
                    </div>
                  ))}
                </div>
              )}
              {fertig && <p className="wn-rede-ausgang" role="status">{zusammenfassung}</p>}
            </section>

          )}

          <section className="wn-block wn-karte">
            <h3>{t("wahl.ui.provinzen")}</h3>
            <svg viewBox={`0 0 ${BREITE} ${HOEHE}`} role="img" aria-label={t("wahl.ui.karte_aria")}>
              {provinzPfade().map(({ plaka, d }) => {
                const erg = ergebnis.provinzen[String(plaka)];
                const da = gezaehltSet.has(plaka) && erg;
                const diff = erg ? erg.amt - erg.gegner : 0;
                const farbe = !da ? "#d8cdb2" : diff >= 0 ? eigeneFarbe : gegnerFarbe;
                const deckkraft = !da ? 0.7 : 0.35 + Math.min(0.6, Math.abs(diff) / 40);
                return <path key={plaka} d={d} fill={farbe} fillOpacity={deckkraft} />;
              })}
            </svg>
            <ul className="wn-legende">
              <li>
                <i style={{ background: eigeneFarbe }} />
                {nachgetragen ? t("wahl.ui.legende_lager") : t("wahl.ui.legende_vorn", { name: amtK.name })}
              </li>
              <li>
                <i style={{ background: gegnerFarbe }} />
                {nachgetragen ? t("wahl.ui.legende_opposition") : t("wahl.ui.legende_vorn", { name: gegnerK.name })}
              </li>
              <li>
                <i style={{ background: "#d8cdb2" }} />
                {t("wahl.ui.legende_offen")}
              </li>
            </ul>
          </section>

          <section className="wn-block">
            <h3>{t("wahl.ui.parlament")}</h3>
            <div className="wn-sitze">
              <Halbrund sitze={p.sitzeVorher} ordnung={ordnung} titel={t("wahl.ui.sitze_vorher")} summe={p.lagerSitzeVorher} />
              <Halbrund sitze={p.sitzeNachher} ordnung={ordnung} titel={t("wahl.ui.sitze_nachher")} summe={p.lagerSitzeNachher} />
            </div>
            <ul className="wn-parteien">
              {ordnung
                .filter((x) => (p.sitzeVorher[x] ?? 0) > 0 || (p.sitzeNachher[x] ?? 0) > 0)
                .map((x) => {
                  const d = (p.sitzeNachher[x] ?? 0) - (p.sitzeVorher[x] ?? 0);
                  return (
                    <li key={x}>
                      <span className="punkt" style={{ background: farbeVon(x) }} />
                      <span>{x}</span>
                      <strong>{p.sitzeNachher[x] ?? 0}</strong>
                      <span className={d > 0 ? "plus" : d < 0 ? "minus" : ""}>{d > 0 ? `+${d}` : d < 0 ? `−${Math.abs(d)}` : "±0"}</span>
                    </li>
                  );
                })}
            </ul>
            <p className="wn-hinweis">
              {p.lagerSitzeNachher >= 301 ? t("wahl.ui.lager_mehrheit", { sitze: p.lagerSitzeNachher }) : t("wahl.ui.lager_fehlt", { fehlen: 301 - p.lagerSitzeNachher })}{" "}
              {t("wahl.ui.huerde", { prozent: p.huerde })}
              {p.unterHuerde.length > 0 && <> {t("wahl.ui.unter_huerde", { parteien: p.unterHuerde })}</>}
            </p>
          </section>

          <section className="wn-block">
            <h3>{t("wahl.ui.reaktionen")}</h3>
            <ul className="wn-reaktionen">
              {WER_ZEICHEN.flatMap((wer) =>
                ergebnis.reaktionen
                  .filter((r) => r.wer === wer)
                  .map((r, i) => (
                    <li key={`${wer}${i}`} className={r.wertung > 0 ? "gut" : r.wertung < 0 ? "schlecht" : ""}>
                      <span className="wer">{t(`wahl.ui.wer.${wer}`)}</span>
                      <span>{rendere(r.text)}</span>
                    </li>
                  )),
              )}
            </ul>
            {ergebnis.einfluesse && ergebnis.einfluesse.length > 0 && (
              <>
                <h3 style={{ marginTop: 14 }}>{t("wahl.ui.einfluesse")}</h3>
                <ul className="wn-einfluesse">
                  {ergebnis.einfluesse.map((e) => (
                    <li key={e.name}>
                      <span>{e.name}</span>
                      <span className={e.punkte >= 0 ? "plus" : "minus"}>{e.punkte >= 0 ? "+" : "−"}{zahl(Math.abs(e.punkte), 1)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {ergebnis.gewonnen && onRede && !nachgetragen && (
            <section className="wn-block breit">
              <h3>{t("wahl.ui.rede")}</h3>
              {rede ? (
                <p className="wn-rede-ausgang">{rede.text || t(`wahl.rede.${rede.ton}_ausgang`)}</p>
              ) : (
                <div className="wn-rede">
                  {(["einend", "triumph", "bescheiden"] as const).map((ton) => (
                    <button
                      key={ton}
                      type="button"
                      className="leather-button"
                      disabled={!fertig}
                      onClick={() => {
                        const text = onRede(ton);
                        setRede({ ton, text: text ?? "" });
                      }}
                    >
                      <strong>{t(`wahl.rede.${ton}`)}</strong>
                      <span>{t(`wahl.ui.rede.${ton}_beschr`)}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <footer className="wn-fuss">
          <Flourish width={120} />
          <p>{nachgetragen ? t("wahl.ui.fuss_nachgetragen") : ergebnis.gewonnen && !ergebnis.letzteWahl ? t("wahl.ui.fuss_weiter") : ergebnis.gewonnen ? t("wahl.ui.fuss_letzte") : t("wahl.ui.fuss_ende")}</p>
          <button type="button" className="brass-button" onClick={onSchliessen} disabled={!fertig}>
            {fertig ? t("wahl.ui.weiter") : t("wahl.ui.warten")}
          </button>
        </footer>
      </article>
    </div>
  );
}

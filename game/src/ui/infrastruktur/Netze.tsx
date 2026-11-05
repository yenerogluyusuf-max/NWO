// Die Netze des Landes: Auslastung je Netz, die größten Engpässe, Ausbau mit Preis und Dauer, Großinvestitionsprogramme.
// Gebaut wird über die Vorhaben des Reiches (sim/infrastruktur.ts legt sie an); diese Ansicht zeigt nur Lage und Angebot.

import { useMemo, useState } from "react";
import { t } from "../../i18n";
import {
  auslastung,
  AUSBAUTEN,
  PAKETE,
  ausbauAngebot,
  finanzierung,
  investiere,
  netzSichten,
  paketAngebot,
  starteProgramm,
  type NetzId,
} from "../../sim/infrastruktur";
import { SCHWELLE } from "../../data/infrastruktur-netze";
import { VERGABE_NAMEN, type Vergabe } from "../../sim/reich-typen";
import type { World } from "../../sim/types";
import { UbRueck } from "../akte/Uebersicht";
import { PROV, BREITE, HOEHE } from "../atlas/Karte2D";
import "./netze.css";

const prozent = (a: number): string => `${Math.round(a * 100)} %`;
const ton = (a: number): "gut" | "mittel" | "schlecht" => (a >= SCHWELLE.ueberlast ? "schlecht" : a >= SCHWELLE.voll ? "mittel" : "gut");

/** Ring einer Netzanzeige: füllt sich bis zur Auslastung (Skala bis 140 %), Farbe nach Lage. */
function Ring({ a }: { a: number }) {
  const anteil = Math.min(1, a / 1.4);
  return (
    <svg className={`nz-ring nz-${ton(a)}`} viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r="40" className="nz-ring-grund" pathLength={100} strokeDasharray="75 100" transform="rotate(135 50 50)" />
      <circle cx="50" cy="50" r="40" className="nz-ring-wert" pathLength={100} strokeDasharray={`${anteil * 75} 100`} transform="rotate(135 50 50)" />
      {[SCHWELLE.voll, SCHWELLE.ueberlast].map((x) => {
        const w = ((135 + (x / 1.4) * 270) * Math.PI) / 180;
        return <line key={x} x1={50 + 33 * Math.cos(w)} y1={50 + 33 * Math.sin(w)} x2={50 + 47 * Math.cos(w)} y2={50 + 47 * Math.sin(w)} className="nz-ring-marke" />;
      })}
    </svg>
  );
}

/** Farbe einer Provinz nach Auslastung: grün bis ausgelastet, dann gelb, ab Überlast rot, tiefer rot bis 140 %. */
function farbe(a: number | null): string | undefined {
  if (a === null) return undefined;
  if (a < SCHWELLE.leer) return "#8fb39a";
  if (a < SCHWELLE.voll) return "#5e8f6e";
  if (a < SCHWELLE.ueberlast) return "#d2a64a";
  return a < 1.2 ? "#c0563f" : "#8f2a1e";
}

/** Kleine Landeskarte des gewählten Netzes: jede Provinz in der Farbe ihrer Auslastung, Klick wählt die Provinz. */
function NetzKarte({ werte, gewaehlt, onWaehle }: { werte: Map<number, number | null>; gewaehlt?: number; onWaehle: (plaka: number) => void }) {
  return (
    <svg className="nz-karte" viewBox={`-10 -10 ${BREITE + 20} ${HOEHE + 20}`} role="img" aria-label={t("infra.ui.karte")}>
      {PROV.map((p) => {
        const a = werte.get(p.plaka) ?? null;
        return (
          <path key={p.plaka} d={p.d} className={`${a === null ? "leer" : ""}${p.plaka === gewaehlt ? " gewaehlt" : ""}`} style={a === null ? undefined : { fill: farbe(a) }}
            onClick={() => a !== null && onWaehle(p.plaka)}>
            <title>{a === null ? p.name : `${p.name}: ${prozent(a)}`}</title>
          </path>
        );
      })}
    </svg>
  );
}

export function Netze({ world: w, onGeaendert }: { world: World; onGeaendert?: () => void }) {
  const [vergabe, setVergabe] = useState<Vergabe>("ausschreibung");
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [stand, setStand] = useState(0);
  const sichten = useMemo(() => (w.spiel ? netzSichten(w) : []), [w, w.day, stand]);
  // Vorgabe: das Netz mit dem schlimmsten Engpass
  const [netzWahl, setNetzWahl] = useState<string | null>(null);
  const [ortWahl, setOrtWahl] = useState<number | null>(null);
  const schlimmstes = [...sichten].sort((a, b) => (b.engpaesse[0]?.a ?? b.mittel) - (a.engpaesse[0]?.a ?? a.mittel))[0];
  const netzId = netzWahl ?? schlimmstes?.id ?? null;
  const x = sichten.find((n) => n.id === netzId);
  const werte = useMemo(() => {
    const m = new Map<number, number | null>();
    if (x && !x.land) for (const p of PROV) m.set(p.plaka, auslastung(w, x.id, p.plaka));
    return m;
  }, [w, w.day, stand, x?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!w.spiel) return null;
  const leerKosten = w.spiel.infrastruktur?.leerKosten ?? 0;
  const fin = finanzierung(w);
  const fertig = (r: { ok: boolean; text: string }) => {
    // Die Simulation meldet selbst „Beginn: …“; ein vorangestelltes „Begonnen.“ sagte es doppelt
    setMeldung({ ok: r.ok, text: r.text });
    setStand((n) => n + 1);
    if (r.ok) onGeaendert?.();
  };
  const ort = x ? (ortWahl !== null && werte.get(ortWahl) != null ? ortWahl : x.land ? 0 : x.engpaesse[0]?.plaka ?? 0) : 0;
  const ortName = PROV.find((p) => p.plaka === ort)?.name ?? "";
  const ortA = x ? (x.land ? x.mittel : werte.get(ort) ?? x.mittel) : 0;
  const ausbauten = x ? AUSBAUTEN.filter((a) => a.netz === x.id) : [];
  const vergabeWahl = (
    <label className="nz-vergabe">
      {t("infra.ui.vergabe")}{" "}
      <select value={vergabe} onChange={(e) => setVergabe(e.target.value as Vergabe)}>
        {(Object.keys(VERGABE_NAMEN) as Vergabe[]).map((v) => (
          <option key={v} value={v}>{VERGABE_NAMEN[v]}</option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="nz nz2">
      <p className="nz-lage">
        {t(`infra.ui.etat.${fin.quelle}`, { stufe: fin.stufe > 0 ? `+${fin.stufe}` : String(fin.stufe) })}{" "}
        {fin.stufe !== 0 && t("infra.ui.etat.wirkung", { pk: Math.round((1 - fin.pk) * 100), schulden: Math.round((1 - fin.schulden) * 100) })}
        {leerKosten > 0 && <> {t("infra.ui.leer", { x: Math.round(leerKosten * 1200) / 100 })}</>}
      </p>
      {/* Bild oben: jedes Netz ein Ring, gefüllt bis zur Auslastung, Marken bei 85 und 100 % */}
      <ul className="nz-ringe" aria-label={t("infra.ui.gruppe_netze")}>
        {sichten.map((n) => {
          const top = n.engpaesse[0];
          const ueber = ton(n.mittel) === "schlecht" || (!!top && top.a >= SCHWELLE.ueberlast);
          return (
            <li key={n.id}>
              <button type="button" className={`nz-netz${n.id === netzId ? " on" : ""}`} aria-pressed={n.id === netzId} onClick={() => { setNetzWahl(n.id); setOrtWahl(null); setMeldung(null); }}
                title={top && !n.land ? t("infra.ui.engpass", { ort: top.name, a: Math.round(top.a * 100) }) : undefined}>
                <span className="nz-ring-feld">
                  <Ring a={n.mittel} />
                  <b>{prozent(n.mittel)}</b>
                  {n.laufend > 0 && <em className="nz-bau" title={t("infra.ui.laufend", { n: n.laufend })}>{n.laufend}</em>}
                </span>
                <strong>{n.name}</strong>
                <small className={ueber ? "nz-warn" : ""}>{ueber && top && !n.land ? t("infra.ui.ringEngpass", { ort: top.name, a: Math.round(top.a * 100) }) : t("infra.ui.auslastung_kurz")}</small>
              </button>
            </li>
          );
        })}
      </ul>

      {x && (
        <div className="nz-buehne">
          <div className="nz-kartenfeld">
            {x.land ? (
              <div className="nz-landweit"><Ring a={x.mittel} /><p>{t("infra.ui.landweit", { netz: x.name, a: prozent(x.mittel) })}</p></div>
            ) : (
              <>
                <NetzKarte werte={werte} gewaehlt={ort} onWaehle={(p) => { setOrtWahl(p); setMeldung(null); }} />
                <ul className="nz-legende" aria-hidden>
                  <li><i style={{ background: "#8fb39a" }} />{t("infra.ui.leg.viel")}</li>
                  <li><i style={{ background: "#5e8f6e" }} />{t("infra.ui.leg.frei")}</li>
                  <li><i style={{ background: "#d2a64a" }} />{t("infra.ui.leg.voll")}</li>
                  <li><i style={{ background: "#c0563f" }} />{t("infra.ui.leg.ueber")}</li>
                  <li><i style={{ background: "#8f2a1e" }} />{t("infra.ui.leg.schwer")}</li>
                  <li><i style={{ background: "#e3d9c2" }} />{t("infra.ui.leg.kein")}</li>
                </ul>
              </>
            )}
          </div>
          <aside className="nz-akte">
            <header>
              <span className="nz-kicker">{x.name}</span>
              <h4>{x.land ? t("infra.ui.ganzesLand") : ortName}</h4>
              <p className={`nz-ortwert nz-${ton(ortA)}`}>{prozent(ortA)} <small>{t("infra.ui.auslastung_kurz")}</small></p>
            </header>
            <UbRueck antwort={meldung} />
            <ul className="nz-ausbauten">
              {ausbauten.map((a) => {
                const an = ausbauAngebot(w, a.id, ort, vergabe);
                return (
                  <li key={a.id} className={`nz-ausbau${an.ok ? "" : " aus"}`}>
                    <div>
                      <strong>{t(`infra.ausbau.${a.id}.name`)}</strong>
                      {an.ok ? (
                        <span className="nz-wirkung">
                          <b className={`nz-${ton(an.vorher ?? 0)}`}>{prozent(an.vorher ?? 0)}</b> → <b className={`nz-${ton(an.nachher ?? 0)}`}>{prozent(an.nachher ?? 0)}</b>
                        </span>
                      ) : (
                        <span className="nz-grund">{an.grund}</span>
                      )}
                      {an.ok && <small>{t("infra.ui.preis", { pk: an.pk ?? 0, monate: an.monate ?? 0 })}</small>}
                    </div>
                    <button type="button" className="pd-btn" disabled={!an.ok} onClick={() => fertig(investiere(w, a.id, ort, vergabe))}>{t("infra.ui.bauen")}</button>
                  </li>
                );
              })}
            </ul>
            {vergabeWahl}
            {!x.land && x.engpaesse.length > 0 && (
              <div className="nz-engpaesse">
                <span>{t("infra.ui.engpaesse")}</span>
                {x.engpaesse.map((e) => (
                  <button key={e.plaka} type="button" className={`nz-chip nz-${ton(e.a)}${e.plaka === ort ? " on" : ""}`} onClick={() => { setOrtWahl(e.plaka); setMeldung(null); }}>
                    {e.name} {prozent(e.a)}
                  </button>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}

      <section className="nz-programme">
        <h4>{t("infra.ui.programme")}</h4>
        <ul>
          {PAKETE.map((p) => {
            const an = paketAngebot(w, p.id, vergabe);
            return (
              <li key={p.id} className="nz-programm">
                <div>
                  <strong>{t(`infra.paket.${p.id}.name`)}</strong>
                  <small>{an.ok ? t("infra.ui.paket.preis", { n: an.provinzen.length, pk: an.pk ?? 0, einzeln: an.einzelnPk ?? 0, monate: an.monate ?? 0, risiko: Math.round(p.ueberzug.p * 100) }) : an.grund}</small>
                </div>
                <button type="button" className="pd-btn" disabled={!an.ok} title={t(`infra.paket.${p.id}.text`)} onClick={() => fertig(starteProgramm(w, p.id, vergabe))}>
                  {t("infra.ui.paket.start")} {an.ok && <b>{an.pk ?? 0}</b>}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/** Die eine Zeile für die Land-Akte: größter Engpass und laufende Ausbauten (Fork AKTEN baut die Hülle). */
export function NetzeZeile({ world: w }: { world: World }) {
  if (!w.spiel) return null;
  const s = netzSichten(w);
  const top = s.flatMap((x) => (x.land ? [] : x.engpaesse.slice(0, 1).map((e) => ({ netz: x.name, ...e })))).sort((a, b) => b.a - a.a)[0];
  const laufend = s.reduce((n, x) => n + x.laufend, 0);
  return <span className="nz-zeile">{top ? t("infra.ui.zeile", { netz: top.netz, ort: top.name, a: Math.round(top.a * 100), n: laufend }) : ""}</span>;
}

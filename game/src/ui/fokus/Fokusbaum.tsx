// Der Fokusbaum (sim/fokus.ts): alle sieben Äste auf einer Fläche, die als Ganzes ins Fenster passt und sich ziehen und zoomen lässt.
// Ein Klick auf einen Fokus öffnet das Blatt mit Preis, Voraussetzungen (jede fehlende als Sprung oder Direktknopf), Folgen und Gegenspielern.
// Linien verbinden Vorgänger, gekreuzte rote Linien trennen Gegenwege. Ein frisch vollendeter Fokus trägt einen Stempel.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent, type WheelEvent as RWheelEvent } from "react";
import { createPortal } from "react-dom";
import { datum, t, zahl } from "../../i18n";
import { AESTE, AST_FARBE, AUSSEN, FOKI, FOKUS_VON, OEFFNET, astRaster, type FokusAst } from "../../data/fokusbaum";
import { beginneFokus, brichFokusAb, fokusFolgen, fokusName, fokusReaktion, fokusSicht, fokusUeberblick, richtungsNaehe, type FokusSicht } from "../../sim/fokus";
import { spielerAchsen } from "../../sim/linie";
import { NET } from "../../sim/modell";
import { bringeEin, pruefeVorhaben } from "../../sim/handeln";
import { akteurName } from "../../sim/welt-modell";
import { knotenName as wissensName } from "../../sim/wissensbaum";
import { themeName } from "../politik/bereiche";
import type { Ziel } from "../schreibtisch/briefing";
import type { World } from "../../sim/types";
import "./fokus.css";

// Nacht N6 (Befund F-2): Der Baum ist nicht mehr eine Fläche mit allen sieben Ästen (Karten 120 × 52, Namen in jeder Zoomstufe abgeschnitten),
// sondern zwei Ebenen: die Übersicht der Äste als Medaillen mit Zähler und dem, was jetzt möglich ist, und ein Ast als Baum von links nach rechts.
// Karten 192 × 60 mit Zeichen des Asts, zwei Zeilen Namen und Preis. Die Tiefe läuft nach rechts; eine Stufe mit mehr als fünf Foki teilt sich in
// zwei Spalten, die zweite um eine halbe Zeile versetzt. Linien laufen rechtwinklig durch die Lücken (nie durch eine Karte).
const KW = 192;
const KH = 60;
/** Zeilenabstand: eine Karte und eine Lücke, durch die eine Linie passt */
const ZEILE = 74;
/** Lücke zwischen den beiden Spalten einer Stufe */
const SPALT = 14;
/** Lücke zwischen zwei Stufen: dort laufen die senkrechten Teile der Linien */
const STUFE = 40;
const MAX_ZEILEN = 5;
const RAND = 10;

interface Lage {
  x: number;
  y: number;
  /** Stufe (Tiefe) im Ast */
  stufe: number;
  /** Rechte Kante der Stufe, in deren Lücke die Linie zum Kind senkrecht läuft */
  rechts: number;
}

/** Ein Ast als Baum von links nach rechts. */
function astFlaeche(ast: FokusAst): { pos: Record<string, Lage>; breite: number; hoehe: number } {
  const r = astRaster(ast);
  const stufen: string[][] = Array.from({ length: r.zeilen }, () => []);
  for (const [id, p] of Object.entries(r.plaetze)) stufen[p.zeile]![p.spalte] = id;
  const pos: Record<string, Lage> = {};
  let x = RAND;
  let hoehe = 0;
  for (let d = 0; d < stufen.length; d++) {
    const ids = stufen[d]!.filter(Boolean);
    const zwei = ids.length > MAX_ZEILEN;
    const proSpalte = zwei ? Math.ceil(ids.length / 2) : ids.length;
    const spaltenH = proSpalte * ZEILE - (ZEILE - KH) + (zwei ? ZEILE / 2 : 0);
    hoehe = Math.max(hoehe, spaltenH);
    const breite = zwei ? 2 * KW + SPALT : KW;
    ids.forEach((id, i) => {
      const b = zwei ? i % 2 : 0;
      const zeile = zwei ? Math.floor(i / 2) : i;
      pos[id] = { x: x + b * (KW + SPALT), y: zeile * ZEILE + (b ? ZEILE / 2 : 0), stufe: d, rechts: x + breite };
    });
    x += breite + STUFE;
  }
  // Stufen mittig untereinander ausrichten
  const hoeheJe: Record<number, number> = {};
  for (const l of Object.values(pos)) hoeheJe[l.stufe] = Math.max(hoeheJe[l.stufe] ?? 0, l.y + KH);
  for (const l of Object.values(pos)) l.y += (hoehe - hoeheJe[l.stufe]!) / 2 + RAND;
  return { pos, breite: x - STUFE + RAND, hoehe: hoehe + 2 * RAND };
}

/** Zeichen der Äste (Linienzeichnung 20 × 20, in der Farbe des Asts). */
function AstZeichen({ ast }: { ast: FokusAst }) {
  const d: Record<FokusAst, string> = {
    wirtschaft: "M3 17 H17 M5 17 V11 M9 17 V7 M13 17 V9 M17 17 V4 M4 9 L8 5 L12 7 L17 3",
    aussen: "M10 2 A8 8 0 1 0 10.01 2 M2 10 H18 M10 2 Q5 10 10 18 M10 2 Q15 10 10 18",
    staat: "M3 7 L10 3 L17 7 M4 7 H16 M5 8 V15 M8.5 8 V15 M11.5 8 V15 M15 8 V15 M3 16 H17",
    gesellschaft: "M6.5 7 A2.5 2.5 0 1 0 6.51 7 M13.5 7 A2.5 2.5 0 1 0 13.51 7 M2 17 Q6.5 9 11 17 M9 17 Q13.5 9 18 17",
    sicherheit: "M10 2 L17 5 V10 Q17 15 10 18 Q3 15 3 10 V5 Z M10 6 V14",
    regionen: "M10 18 Q4 11 4 8 A6 6 0 1 1 16 8 Q16 11 10 18 Z M10 6 A2 2 0 1 0 10.01 6",
    wissen: "M10 10 m-1.5 0 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0 M10 10 m-8 0 a8 3 0 1 0 16 0 a8 3 0 1 0 -16 0 M10 10 m-4 -7 a4 9 30 1 0 1 0",
  };
  return (
    <svg className="fk-zeichen" viewBox="0 0 20 20" aria-hidden>
      <path d={d[ast]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Schloss() {
  return (
    <svg className="fk-schloss" viewBox="0 0 12 14" aria-hidden>
      <rect x="1.5" y="6" width="9" height="7" rx="1.5" fill="currentColor" />
      <path d="M3.5 6 V4.5 A2.5 2.5 0 0 1 8.5 4.5 V6" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

const vz = (x: number): string => `${x > 0 ? "+" : x < 0 ? "−" : "±"}${zahl(Math.abs(x), 1)}`;

/** Gegenwege: jedes Paar einmal */
function gegenPaare(): [string, string][] {
  const out: [string, string][] = [];
  const gesehen = new Set<string>();
  for (const f of FOKI)
    for (const g of f.ausschluesse ?? []) {
      const k = [f.id, g].sort().join("|");
      if (gesehen.has(k) || !FOKUS_VON[g]) continue;
      gesehen.add(k);
      out.push([f.id, g]);
    }
  return out;
}

function Voraussetzung({ w, s, onWahl, onGehe, onGetan }: { w: World; s: FokusSicht; onWahl: (id: string) => void; onGehe: (z: Ziel) => void; onGetan: (r: { ok: boolean; text: string }) => void }) {
  const fertig = new Set((w.spiel?.fokus?.fertig ?? []).map((x) => x.id));
  const vorgaenger = s.def.voraus;
  const bed = s.def.bedingungen ?? [];
  if (!vorgaenger.length && !s.bedingungen.length) return null;
  return (
    <div className="fk-block">
      <h4>{t("fokus.ui.bedingungen")}</h4>
      <ul className="fk-liste">
        {vorgaenger.map((v) => (
          <li key={v} className={fertig.has(v) ? "ok" : "fehlt"}>
            <span className="fk-haken" aria-hidden>{fertig.has(v) ? "✓" : "✗"}</span>
            <button type="button" className="fk-link" onClick={() => onWahl(v)}>{fokusName(v)}</button>
          </li>
        ))}
        {s.bedingungen.map((b, i) => {
          const def = bed[i];
          const id = def && (def.art === "massnahme" || def.art === "groesse") ? def.id : undefined;
          const node = id ? NET.nodes[NET.index.get(id)!] : undefined;
          const ziel = def && "min" in def && def.min !== undefined ? Math.min(100, def.min + 1) : def && "max" in def && def.max !== undefined ? Math.max(0, def.max - 1) : undefined;
          const direkt = !b.erfuellt && node?.kind === "massnahme" && ziel !== undefined ? pruefeVorhaben(w, node.id, ziel, null) : undefined;
          return (
            <li key={i} className={b.erfuellt ? "ok" : "fehlt"}>
              <span className="fk-haken" aria-hidden>{b.erfuellt ? "✓" : "✗"}</span>
              <span>{b.text}</span>
              {!b.erfuellt && node && (
                <span className="fk-wege">
                  <button type="button" className="fk-link" onClick={() => onGehe({ art: "politik", ...(node.kind === "massnahme" ? { massnahme: { id: node.id, ...(ziel !== undefined ? { level: ziel } : {}) } } : { theme: node.theme }) })}>
                    {t("fokus.ui.zurStelle")}
                  </button>
                  {direkt?.ok && direkt.gesetz.bezahlbar && ziel !== undefined && (
                    <button type="button" className="fk-direkt" onClick={() => onGetan(bringeEin(w, node.id, ziel, null, "gesetz"))}>
                      {t("fokus.ui.direkt", { stufe: ziel, pk: direkt.gesetz.pk })}
                    </button>
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Blatt({ w, id, onZu, onWahl, onGehe, onGetan }: { w: World; id: string; onZu: () => void; onWahl: (id: string) => void; onGehe: (z: Ziel) => void; onGetan: (r: { ok: boolean; text: string }) => void }) {
  const s = fokusSicht(w, id);
  const f = s.def;
  const folgen = fokusFolgen(f).slice(0, 6);
  const reakt = fokusReaktion(w, f);
  const aussen = Object.entries(AUSSEN[id] ?? {});
  const oeffnet = OEFFNET[id];
  const naehe = richtungsNaehe(f, spielerAchsen(w));
  const gegen = FOKI.filter((g) => (f.ausschluesse ?? []).includes(g.id) || (g.ausschluesse ?? []).includes(id));
  const wk = f.wirkung;
  return (
    <aside className="fk-blatt" aria-live="polite">
      <header className="fk-blatt-kopf" style={{ borderTopColor: AST_FARBE[f.ast] }}>
        <div>
          <p className="fk-blatt-ast">{t(`fokus.ast.${f.ast}.name`)} · {t(`fokus.ui.status.${s.status}`)}</p>
          <h3>{fokusName(id)}</h3>
          <p className="fk-blatt-unter">{t(`fokus.f.${id}.unter`)}</p>
        </div>
        <button type="button" className="fk-zu" onClick={onZu} aria-label={t("fokus.ui.schliessen")}>×</button>
      </header>
      <p className="fk-blatt-text">{t(`fokus.f.${id}.text`)}</p>
      {s.status === "fertig" && s.fertigAm !== undefined && <p className="fk-fertig">{t("fokus.ui.vollendetAm", { datum: datum(datumAusTag(w, s.fertigAm)) })}</p>}
      {s.status === "laeuft" && (
        <div className="fk-lauf">
          <span className="fk-balken" aria-hidden><i style={{ width: `${Math.round((s.lauf ?? 0) * 100)}%` }} /></span>
          <span>{t("fokus.ui.rest", { tage: s.restTage ?? 0 })}</span>
          <button type="button" className="fk-nein" title={t("fokus.ui.abbrechenHinweis")} onClick={() => onGetan(brichFokusAb(w))}>{t("fokus.ui.abbrechen")}</button>
        </div>
      )}
      {s.grund && (s.status === "ausgeschlossen" || s.status === "moeglich") && <p className={`fk-grund fk-grund-${s.status}`}>{s.grund}</p>}
      {(s.status === "moeglich" || s.status === "gesperrt") && (
        <div className="fk-preis">
          <span>{t("fokus.ui.kosten", { pk: s.pk, monate: s.monate })}</span>
          {f.wirkung.achsenVerschiebung && (
            <span className="fk-linie">{t("fokus.ui.linie", { wert: t(naehe > 0.15 ? "fokus.ui.linie.passt" : naehe < -0.15 ? "fokus.ui.linie.bricht" : "fokus.ui.linie.neutral") })}</span>
          )}
          {s.status === "moeglich" && (
            <button type="button" className="fk-ja" disabled={!s.startbar} onClick={() => onGetan(beginneFokus(w, id))}>
              {t("fokus.ui.beginnen")}
            </button>
          )}
        </div>
      )}
      {s.status !== "fertig" && <Voraussetzung w={w} s={s} onWahl={onWahl} onGehe={onGehe} onGetan={onGetan} />}
      {gegen.length > 0 && (
        <div className="fk-block">
          <h4>{t("fokus.ui.gegenweg")}</h4>
          <p className="fk-gegen">
            {gegen.map((g) => (
              <button key={g.id} type="button" className="fk-link fk-link-gegen" onClick={() => onWahl(g.id)}>{fokusName(g.id)}</button>
            ))}
          </p>
        </div>
      )}
      <div className="fk-block">
        <h4>{t("fokus.ui.folgen")}</h4>
        <ul className="fk-folgen">
          {folgen.map((x) => (
            <li key={x.knoten} className={x.delta > 0 ? "plus" : "minus"}>
              <span>{t(`netz.knoten.${x.knoten}.name`)}</span>
              <b>{vz(x.delta)}</b>
            </li>
          ))}
          {wk.sofortKapital ? <li className="plus"><span>{t("fokus.ui.sofortKapital", { n: vz(wk.sofortKapital) })}</span></li> : null}
          {wk.sofortVertrauen ? <li className={wk.sofortVertrauen > 0 ? "plus" : "minus"}><span>{t("fokus.ui.sofortVertrauen", { n: vz(wk.sofortVertrauen * 0.5) })}</span></li> : null}
          {wk.rabattThema && <li className="plus"><span>{t("fokus.ui.rabatt", { thema: themeName(wk.rabattThema.thema as never), anteil: Math.round(wk.rabattThema.anteil * 100) })}</span></li>}
          {wk.metriken?.forschungsrate ? <li className="plus"><span>{t("fokus.ui.forschung")}</span></li> : null}
        </ul>
        {folgen.length > 0 && <p className="fk-klein">{t("fokus.ui.dauer")}</p>}
      </div>
      {(oeffnet?.gesetze?.length || oeffnet?.wissen?.length) && (
        <div className="fk-block">
          <h4>{t("fokus.ui.oeffnet")}</h4>
          <ul className="fk-liste">
            {(oeffnet.gesetze ?? []).map((g) => (
              <li key={g}>
                <button type="button" className="fk-link" onClick={() => onGehe({ art: "akte", akte: "parlament" })}>{t("fokus.ui.gesetz", { name: t(`gesetz.v.${g}.titel`) })}</button>
              </li>
            ))}
            {(oeffnet.wissen ?? []).map((k) => (
              <li key={k}>{t("fokus.ui.wissen", { name: wissensName(k) })}</li>
            ))}
          </ul>
        </div>
      )}
      {aussen.length > 0 && (
        <div className="fk-block">
          <h4>{t("fokus.ui.aussen")}</h4>
          <ul className="fk-folgen">
            {aussen.map(([land, d]) => (
              <li key={land}>
                <button type="button" className="fk-link" onClick={() => onGehe({ art: "land", id: land })}>{akteurName(land)}</button>
                <b>{Object.entries(d).map(([dim, x]) => `${t(`fokus.ui.dim.${dim}`)} ${vz(x as number)}`).join(" · ")}</b>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="fk-block">
        <h4>{t("fokus.ui.reaktion")}</h4>
        {reakt.gruppen.length === 0 && reakt.partner.length === 0 ? (
          <p className="fk-klein">{t("fokus.ui.keineReaktion")}</p>
        ) : (
          <>
            {reakt.gruppen.some((g) => g.delta > 0) && (
              <p className="fk-reakt plus"><b>{t("fokus.ui.dafuer")}:</b> {reakt.gruppen.filter((g) => g.delta > 0).map((g) => t(`netz.knoten.${g.id}.name`)).join(", ")}</p>
            )}
            {reakt.gruppen.some((g) => g.delta < 0) && (
              <p className="fk-reakt minus"><b>{t("fokus.ui.dagegen")}:</b> {reakt.gruppen.filter((g) => g.delta < 0).map((g) => t(`netz.knoten.${g.id}.name`)).join(", ")}</p>
            )}
            {reakt.partner.map((p) => (
              <p key={p.partei} className={`fk-reakt ${p.delta > 0 ? "plus" : "minus"}`}>{t("fokus.ui.partner", { partei: p.partei, d: vz(p.delta) })}</p>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}

function datumAusTag(w: World, tag: number): string {
  const d = new Date(`${w.date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - (w.day - tag));
  return d.toISOString().slice(0, 10);
}

/** Kleinster Maßstab der Baumfläche (Gestaltungsvorgabe: Beschriftung mindestens 12 px auf dem Bildschirm; Karten tragen 13,5 px) */
const FOKUS_MIN_MASSSTAB = 0.9;

/** Übersicht: je Ast eine Medaille mit Zähler, dem laufenden Fokus und dem, was jetzt möglich ist. */
function Uebersicht({ sichten, onAst, onFokus }: { sichten: Record<string, FokusSicht>; onAst: (a: FokusAst) => void; onFokus: (a: FokusAst, id: string) => void }) {
  return (
    <div className="fk-uebersicht">
      {AESTE.map((ast) => {
        const foki = FOKI.filter((f) => f.ast === ast);
        const fertig = foki.filter((f) => sichten[f.id]?.status === "fertig").length;
        const laeuft = foki.find((f) => sichten[f.id]?.status === "laeuft");
        const moeglich = foki.filter((f) => sichten[f.id]?.status === "moeglich");
        const anteil = foki.length ? fertig / foki.length : 0;
        return (
          <section key={ast} className="fk-medaille" style={{ ["--ast" as string]: AST_FARBE[ast] }}>
            <button type="button" className="fk-medaille-kopf" onClick={() => onAst(ast)} title={t(`fokus.ast.${ast}.satz`)}>
              <span className="fk-ring" aria-hidden>
                <svg viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="19" className="grund" />
                  <circle cx="22" cy="22" r="19" className="wert" strokeDasharray={`${(anteil * 119.4).toFixed(1)} 119.4`} />
                </svg>
                <AstZeichen ast={ast} />
              </span>
              <span className="fk-medaille-text">
                <strong>{t(`fokus.ast.${ast}.name`)}</strong>
                <small>{t("n6.fk.astZaehler", { fertig, gesamt: foki.length, moeglich: moeglich.length })}</small>
              </span>
            </button>
            {laeuft && (
              <button type="button" className="fk-medaille-fokus laeuft" onClick={() => onFokus(ast, laeuft.id)}>
                <span>{fokusName(laeuft.id)}</span>
                <span className="fk-balken" aria-hidden><i style={{ width: `${Math.round((sichten[laeuft.id]?.lauf ?? 0) * 100)}%` }} /></span>
              </button>
            )}
            {moeglich.slice(0, 2).map((f) => (
              <button key={f.id} type="button" className="fk-medaille-fokus" onClick={() => onFokus(ast, f.id)}>
                <span>{fokusName(f.id)}</span>
                <em>{t("fokus.ui.kosten", { pk: sichten[f.id]!.pk, monate: sichten[f.id]!.monate })}</em>
              </button>
            ))}
            {moeglich.length > 2 && <button type="button" className="fk-medaille-mehr" onClick={() => onAst(ast)}>{t("n6.fk.mehr", { n: moeglich.length - 2 })}</button>}
          </section>
        );
      })}
    </div>
  );
}

export function Fokusbaum({ world: w, onGeaendert, onGehe }: { world: World; onGeaendert: () => void; onGehe: (z: Ziel) => void }) {
  const paare = useMemo(gegenPaare, []);
  const ue = fokusUeberblick(w);
  // Startansicht: der Ast des laufenden Fokus, sonst die Übersicht aller Äste
  const [ast, setAst] = useState<FokusAst | null>(() => (ue.aktiv ? ue.aktiv.def.ast : null));
  const [auswahl, setAuswahl] = useState<string | null>(null);
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [voll, setVoll] = useState(false);
  const [sicht, setSicht] = useState<{ x: number; y: number; s: number } | null>(null);
  const flaecheRef = useRef<HTMLDivElement>(null);
  const zug = useRef<{ x: number; y: number; sx: number; sy: number; bewegt: boolean } | null>(null);
  const lay = useMemo(() => (ast ? astFlaeche(ast) : null), [ast]);
  const sichten = useMemo(() => Object.fromEntries(FOKI.map((f) => [f.id, fokusSicht(w, f.id)])), [w, w.day, ue.fertig, ue.aktiv?.def.id, meldung]); // eslint-disable-line react-hooks/exhaustive-deps

  const passend = useCallback((): { x: number; y: number; s: number } => {
    const el = flaecheRef.current;
    const bw = el?.clientWidth || 1200;
    const bh = el?.clientHeight || 600;
    if (!lay) return { x: 0, y: 0, s: 1 };
    // Platz für das Blatt rechts lassen, wenn eines offen ist
    const frei = auswahl ? bw - 400 : bw;
    const s = Math.max(FOKUS_MIN_MASSSTAB, Math.min(1.15, (frei - 16) / lay.breite, (bh - 16) / lay.hoehe));
    return { s, x: Math.max(8, (frei - lay.breite * s) / 2), y: Math.max(8, (bh - lay.hoehe * s) / 2) };
  }, [lay, auswahl]);

  useLayoutEffect(() => setSicht(passend()), [passend, voll, ast]);
  useEffect(() => {
    const el = flaecheRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setSicht(passend()));
    ro.observe(el);
    return () => ro.disconnect();
  }, [passend, voll]);

  const zoom = (faktor: number, cx?: number, cy?: number) =>
    setSicht((v) => {
      if (!v) return v;
      const el = flaecheRef.current;
      const px = cx ?? (el?.clientWidth ?? 0) / 2;
      const py = cy ?? (el?.clientHeight ?? 0) / 2;
      const s = Math.max(FOKUS_MIN_MASSSTAB * 0.8, Math.min(2, v.s * faktor));
      const k = s / v.s;
      return { s, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
    });
  const zeige = (id: string) => {
    const f = FOKUS_VON[id];
    if (!f) return;
    if (f.ast !== ast) setAst(f.ast);
    setAuswahl(id);
  };

  const rad = (e: RWheelEvent) => {
    if (!lay) return;
    const r = flaecheRef.current!.getBoundingClientRect();
    zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top);
  };
  const runter = (e: RPointerEvent) => {
    if (!lay || (e.target as HTMLElement).closest("button, .fk-blatt")) return;
    zug.current = { x: e.clientX, y: e.clientY, sx: sicht?.x ?? 0, sy: sicht?.y ?? 0, bewegt: false };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const bewege = (e: RPointerEvent) => {
    const z = zug.current;
    if (!z) return;
    const dx = e.clientX - z.x;
    const dy = e.clientY - z.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) z.bewegt = true;
    setSicht((v) => (v ? { ...v, x: z.sx + dx, y: z.sy + dy } : v));
  };
  const hoch = () => (zug.current = null);

  const getan = (r: { ok: boolean; text: string }) => {
    setMeldung(r);
    if (r.ok) onGeaendert();
  };

  /** Rechtwinklige Linie: aus der rechten Kante des Vorgängers in die Lücke hinter seiner Stufe, dort senkrecht, dann waagrecht zum Kind. */
  const linie = (a: Lage, b: Lage): string => {
    const x1 = a.x + KW;
    const y1 = a.y + KH / 2;
    const gx = a.rechts + STUFE / 2;
    const x2 = b.x;
    const y2 = b.y + KH / 2;
    const r = Math.min(6, Math.abs(y2 - y1) / 2);
    if (Math.abs(y2 - y1) < 1) return `M${x1},${y1} H${x2}`;
    const dir = y2 > y1 ? 1 : -1;
    return `M${x1},${y1} H${gx - r} Q${gx},${y1} ${gx},${y1 + dir * r} V${y2 - dir * r} Q${gx},${y2} ${gx + r},${y2} H${x2}`;
  };

  const astFoki = ast ? FOKI.filter((f) => f.ast === ast) : [];
  const gegenVon = (id: string) => paare.filter(([a, b]) => a === id || b === id).map(([a, b]) => (a === id ? b : a));
  const inhalt = (
    <div className={`fk${voll ? " fk-voll" : ""}`}>
      <div className="fk-kopf">
        <div className="fk-kopf-text">
          <p className="fk-satz">{ue.satz}</p>
          <p className="fk-zaehler">{t("fokus.ui.zaehler", { fertig: ue.fertig, gesamt: ue.gesamt, moeglich: ue.moeglich })}</p>
        </div>
        {ue.aktiv && (
          <button type="button" className="fk-aktiv" onClick={() => zeige(ue.aktiv!.def.id)}>
            <span className="fk-aktiv-name">{fokusName(ue.aktiv.def.id)}</span>
            <span className="fk-balken" aria-hidden><i style={{ width: `${Math.round((ue.aktiv.lauf ?? 0) * 100)}%` }} /></span>
          </button>
        )}
        <div className="fk-werkzeug">
          {ast && (
            <>
              <button type="button" onClick={() => zoom(1.2)} aria-label={t("fokus.ui.naeher")}>+</button>
              <button type="button" onClick={() => zoom(1 / 1.2)} aria-label={t("fokus.ui.weiter")}>−</button>
            </>
          )}
          <button type="button" className={ast ? "" : "on"} onClick={() => { setAst(null); setAuswahl(null); }}>{t("fokus.ui.ganz")}</button>
          <button type="button" onClick={() => setVoll((v) => !v)}>{t(voll ? "fokus.ui.vollAus" : "fokus.ui.voll")}</button>
        </div>
      </div>
      {ast && (
        <nav className="fk-astleiste" aria-label={t("n6.fk.aeste")}>
          {AESTE.map((a) => (
            <button key={a} type="button" className={a === ast ? "on" : ""} style={{ ["--ast" as string]: AST_FARBE[a] }} onClick={() => { setAst(a); setAuswahl(null); }} aria-pressed={a === ast}>
              <AstZeichen ast={a} /> {t(`fokus.ast.${a}.name`)}
            </button>
          ))}
        </nav>
      )}
      {meldung && <p className={`fk-meldung ${meldung.ok ? "ok" : "nein"}`}>{meldung.text}</p>}
      <div
        ref={flaecheRef}
        className={`fk-flaeche${ast ? "" : " uebersicht"}`}
        onWheel={rad}
        onPointerDown={runter}
        onPointerMove={bewege}
        onPointerUp={hoch}
        onPointerCancel={hoch}
        role="application"
        aria-label={t("fokus.tab")}
      >
        {!ast && <Uebersicht sichten={sichten} onAst={(a) => { setAst(a); setAuswahl(null); }} onFokus={(a, id) => { setAst(a); setAuswahl(id); }} />}
        {ast && lay && sicht && (
          <div className="fk-ebene" style={{ width: lay.breite, height: lay.hoehe, transform: `translate(${sicht.x}px, ${sicht.y}px) scale(${sicht.s})`, ["--ast" as string]: AST_FARBE[ast] }}>
            <svg className="fk-linien" width={lay.breite} height={lay.hoehe} aria-hidden>
              {astFoki.flatMap((f) =>
                f.voraus.map((v) => {
                  const a = lay.pos[v];
                  const b = lay.pos[f.id];
                  if (!a || !b) return null;
                  const an = sichten[v]?.status === "fertig";
                  return <path key={`${v}-${f.id}`} className={an ? "an" : ""} d={linie(a, b)} />;
                }),
              )}
              {paare.map(([a, b]) => {
                const p = lay.pos[a];
                const q = lay.pos[b];
                // Nur benachbarte Karten derselben Spalte: Die Linie bleibt in der Lücke zwischen ihnen
                if (!p || !q || p.x !== q.x || Math.abs(p.y - q.y) > ZEILE + 1) return null;
                const x = p.x + KW / 2;
                const y1 = Math.min(p.y, q.y) + KH;
                const y2 = Math.max(p.y, q.y);
                const my = (y1 + y2) / 2;
                return (
                  <g key={`${a}x${b}`} className="fk-gegenlinie">
                    <line x1={x} y1={y1} x2={x} y2={y2} />
                    <path d={`M${x - 5},${my - 5} L${x + 5},${my + 5} M${x + 5},${my - 5} L${x - 5},${my + 5}`} />
                  </g>
                );
              })}
            </svg>
            {astFoki.map((f) => {
              const p = lay.pos[f.id];
              const s = sichten[f.id]!;
              if (!p) return null;
              const frisch = ue.stempel?.id === f.id;
              const gegen = gegenVon(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`fk-knoten fk-${s.status}${auswahl === f.id ? " auf" : ""}`}
                  style={{ left: p.x, top: p.y, width: KW, height: KH }}
                  onClick={() => (zug.current?.bewegt ? undefined : setAuswahl(f.id))}
                  title={`${fokusName(f.id)} · ${t(`fokus.ui.status.${s.status}`)}${gegen.length ? ` · ${t("n6.fk.gegen", { liste: gegen.map(fokusName).join(", ") })}` : ""}`}
                  aria-pressed={auswahl === f.id}
                >
                  <AstZeichen ast={f.ast} />
                  <span className="fk-knoten-text">
                    <span className="fk-knoten-name">{fokusName(f.id)}</span>
                    <span className="fk-knoten-fuss">
                      {s.status === "fertig" ? t("fokus.ui.status.fertig") : s.status === "laeuft" ? t("fokus.ui.rest", { tage: s.restTage ?? 0 }) : t("fokus.ui.kosten", { pk: s.pk, monate: s.monate })}
                      {s.status === "gesperrt" && <Schloss />}
                      {gegen.length > 0 && s.status !== "fertig" && <span className="fk-gegenmarke" aria-hidden>⨯</span>}
                    </span>
                  </span>
                  {s.status === "laeuft" && (
                    <span className="fk-balken" aria-hidden><i style={{ width: `${Math.round((s.lauf ?? 0) * 100)}%` }} /></span>
                  )}
                  {frisch && <span className="fk-stempel">{t("fokus.ui.stempel")}</span>}
                </button>
              );
            })}
          </div>
        )}
        {auswahl && FOKUS_VON[auswahl] && <Blatt w={w} id={auswahl} onZu={() => setAuswahl(null)} onWahl={zeige} onGehe={(z) => { setVoll(false); onGehe(z); }} onGetan={getan} />}
      </div>
      <p className="fk-legende">{ast ? t("n6.fk.legende") : t("n6.fk.legendeUebersicht")}</p>
    </div>
  );
  return voll && typeof document !== "undefined" ? createPortal(inhalt, document.body) : inhalt;
}

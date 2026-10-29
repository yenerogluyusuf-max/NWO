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

// Fläche: Karte 120 × 52, Abstände; Äste in zwei Bändern, je Ast höchstens vier Spalten
const KW = 120;
const KH = 52;
const GX = 14;
const GY = 30;
const KOPF = 40;
const AST_LUECKE = 34;
const BAND_LUECKE = 26;
const MAX_SPALTEN = 4;
const BAENDER: FokusAst[][] = [AESTE.slice(0, 3), AESTE.slice(3)];

interface Lage {
  x: number;
  y: number;
}
interface AstRahmen {
  ast: FokusAst;
  x: number;
  y: number;
  b: number;
  h: number;
}

function flaeche(): { pos: Record<string, Lage>; aeste: AstRahmen[]; breite: number; hoehe: number } {
  const pos: Record<string, Lage> = {};
  const aeste: AstRahmen[] = [];
  let y0 = 0;
  let breite = 0;
  for (const band of BAENDER) {
    let x0 = 0;
    let bandH = 0;
    for (const ast of band) {
      const r = astRaster(ast);
      const spalten = Math.min(MAX_SPALTEN, r.spalten);
      const zeilen: string[][] = Array.from({ length: r.zeilen }, () => []);
      for (const [id, p] of Object.entries(r.plaetze)) zeilen[p.zeile]![p.spalte] = id;
      let zeile = 0;
      for (const ids of zeilen) {
        const liste = ids.filter(Boolean);
        for (let i = 0; i < liste.length; i += spalten) {
          const stueck = liste.slice(i, i + spalten);
          const versatz = ((spalten - stueck.length) * (KW + GX)) / 2;
          stueck.forEach((id, j) => (pos[id] = { x: x0 + versatz + j * (KW + GX), y: y0 + KOPF + zeile * (KH + GY) }));
          zeile++;
        }
      }
      const b = spalten * (KW + GX) - GX;
      const h = KOPF + zeile * (KH + GY) - GY;
      aeste.push({ ast, x: x0, y: y0, b, h });
      x0 += b + AST_LUECKE;
      bandH = Math.max(bandH, h);
    }
    breite = Math.max(breite, x0 - AST_LUECKE);
    y0 += bandH + BAND_LUECKE;
  }
  return { pos, aeste, breite, hoehe: y0 - BAND_LUECKE };
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

export function Fokusbaum({ world: w, onGeaendert, onGehe }: { world: World; onGeaendert: () => void; onGehe: (z: Ziel) => void }) {
  const lay = useMemo(flaeche, []);
  const paare = useMemo(gegenPaare, []);
  const [auswahl, setAuswahl] = useState<string | null>(null);
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [voll, setVoll] = useState(false);
  const [sicht, setSicht] = useState<{ x: number; y: number; s: number } | null>(null);
  const flaecheRef = useRef<HTMLDivElement>(null);
  const zug = useRef<{ x: number; y: number; sx: number; sy: number; bewegt: boolean } | null>(null);
  const ue = fokusUeberblick(w);
  const sichten = useMemo(() => Object.fromEntries(FOKI.map((f) => [f.id, fokusSicht(w, f.id)])), [w, w.day, ue.fertig, ue.aktiv?.def.id, meldung]); // eslint-disable-line react-hooks/exhaustive-deps

  const passend = useCallback((): { x: number; y: number; s: number } => {
    const el = flaecheRef.current;
    const bw = el?.clientWidth || 1200;
    const bh = el?.clientHeight || 600;
    const s = Math.min(1.2, (bw - 24) / lay.breite, (bh - 24) / lay.hoehe);
    return { s, x: (bw - lay.breite * s) / 2, y: (bh - lay.hoehe * s) / 2 };
  }, [lay]);

  useLayoutEffect(() => setSicht(passend()), [passend, voll]);
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
      const s = Math.max(0.3, Math.min(2.2, v.s * faktor));
      const k = s / v.s;
      return { s, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
    });
  const aufAst = (r: AstRahmen) => {
    const el = flaecheRef.current;
    const bw = el?.clientWidth || 1200;
    const bh = el?.clientHeight || 600;
    const s = Math.min(1.5, (bw - 40) / r.b, (bh - 40) / r.h);
    setSicht({ s, x: (bw - r.b * s) / 2 - r.x * s, y: (bh - r.h * s) / 2 - r.y * s });
  };
  const zeige = (id: string) => {
    setAuswahl(id);
    const p = lay.pos[id];
    const el = flaecheRef.current;
    if (!p || !el || !sicht) return;
    const s = Math.max(sicht.s, 0.9);
    setSicht({ s, x: el.clientWidth * 0.36 - (p.x + KW / 2) * s, y: el.clientHeight / 2 - (p.y + KH / 2) * s });
  };

  const rad = (e: RWheelEvent) => {
    const r = flaecheRef.current!.getBoundingClientRect();
    zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top);
  };
  const runter = (e: RPointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
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

  const fern = (sicht?.s ?? 1) < 0.72;
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
          <button type="button" onClick={() => zoom(1.2)} aria-label={t("fokus.ui.naeher")}>+</button>
          <button type="button" onClick={() => zoom(1 / 1.2)} aria-label={t("fokus.ui.weiter")}>−</button>
          <button type="button" onClick={() => setSicht(passend())}>{t("fokus.ui.ganz")}</button>
          <button type="button" onClick={() => setVoll((v) => !v)}>{t(voll ? "fokus.ui.vollAus" : "fokus.ui.voll")}</button>
        </div>
      </div>
      {meldung && <p className={`fk-meldung ${meldung.ok ? "ok" : "nein"}`}>{meldung.text}</p>}
      <div
        ref={flaecheRef}
        className={`fk-flaeche${fern ? " fern" : ""}`}
        onWheel={rad}
        onPointerDown={runter}
        onPointerMove={bewege}
        onPointerUp={hoch}
        onPointerCancel={hoch}
        role="application"
        aria-label={t("fokus.tab")}
      >
        {sicht && (
          <div className="fk-ebene" style={{ width: lay.breite, height: lay.hoehe, transform: `translate(${sicht.x}px, ${sicht.y}px) scale(${sicht.s})` }}>
            {lay.aeste.map((r) => (
              <div key={r.ast} className="fk-ast" style={{ left: r.x - 10, top: r.y, width: r.b + 20, height: r.h + 10, ["--ast" as string]: AST_FARBE[r.ast] }}>
                <button type="button" className="fk-ast-kopf" onClick={() => aufAst(r)} title={t(`fokus.ast.${r.ast}.satz`)}>
                  {t(`fokus.ast.${r.ast}.name`)}
                </button>
              </div>
            ))}
            <svg className="fk-linien" width={lay.breite} height={lay.hoehe} aria-hidden>
              {FOKI.flatMap((f) =>
                f.voraus.map((v) => {
                  const a = lay.pos[v];
                  const b = lay.pos[f.id];
                  if (!a || !b) return null;
                  const x1 = a.x + KW / 2;
                  const y1 = a.y + KH;
                  const x2 = b.x + KW / 2;
                  const y2 = b.y;
                  const my = (y1 + y2) / 2;
                  const an = sichten[v]?.status === "fertig";
                  return <path key={`${v}-${f.id}`} className={an ? "an" : ""} d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`} />;
                }),
              )}
              {paare.map(([a, b]) => {
                const p = lay.pos[a];
                const q = lay.pos[b];
                if (!p || !q) return null;
                const x1 = p.x + KW / 2;
                const y1 = p.y + KH / 2;
                const x2 = q.x + KW / 2;
                const y2 = q.y + KH / 2;
                const mx = (x1 + x2) / 2;
                const my = (y1 + y2) / 2;
                return (
                  <g key={`${a}x${b}`} className="fk-gegenlinie">
                    <line x1={x1} y1={y1} x2={x2} y2={y2} />
                    <path d={`M${mx - 6},${my - 6} L${mx + 6},${my + 6} M${mx + 6},${my - 6} L${mx - 6},${my + 6}`} />
                  </g>
                );
              })}
            </svg>
            {FOKI.map((f) => {
              const p = lay.pos[f.id];
              const s = sichten[f.id]!;
              if (!p) return null;
              const frisch = ue.stempel?.id === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`fk-knoten fk-${s.status}${auswahl === f.id ? " auf" : ""}`}
                  style={{ left: p.x, top: p.y, width: KW, height: KH, ["--ast" as string]: AST_FARBE[f.ast] }}
                  onClick={() => (zug.current?.bewegt ? undefined : setAuswahl(f.id))}
                  title={`${fokusName(f.id)} · ${t(`fokus.ui.status.${s.status}`)}`}
                  aria-pressed={auswahl === f.id}
                >
                  <span className="fk-knoten-name">{fokusName(f.id)}</span>
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
      <p className="fk-legende">{t("fokus.ui.legende")}</p>
    </div>
  );
  return voll && typeof document !== "undefined" ? createPortal(inhalt, document.body) : inhalt;
}

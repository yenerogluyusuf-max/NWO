// Das große Baumfenster nach Civ-6-Vorbild: eine Ebene über der Akte, Zweige als farbige Bahnen, Epochen als Zeitstrahl,
// runde Symbole, geschwungene Verbindungen, Weg bis zum Knoten beim Überfahren, Leiste mit dem gewählten Knoten.
// Ziehen verschiebt, Mausrad zoomt (Trackpad: Wischen verschiebt, Spreizen zoomt). Fehlende Voraussetzungen sind Sprungziele.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { createPortal } from "react-dom";
import { t } from "../../i18n";
import { BAUM, WERK_VON, type ZweigId } from "../../data/wissensbaum";
import { baumSicht, knotenName, setzeSchwerpunkt, type BaumSicht, type KnotenSicht, type Sprung } from "../../sim/wissensbaum";
import type { World } from "../../sim/types";
import { Detail } from "./Wissensbaum";
import { Symbol, knotenSymbol, zweigSymbol } from "./symbole";

// Maße im Baum (Bildpunkte bei Zoom 1)
const M = { x0: 196, colW: 244, nodeW: 206, nodeH: 80, rowH: 94, lanePad: 18, kopf: 0 };
const EPOCHEN = [
  { id: "gegenwart", von: 0, bis: 0 },
  { id: "aufbau", von: 1, bis: 2 },
  { id: "durchbruch", von: 3, bis: 4 },
  { id: "spitze", von: 5, bis: 99 },
] as const;

interface Lage {
  pos: Map<string, { x: number; y: number }>;
  bahnen: { id: ZweigId; top: number; h: number }[];
  spalten: number;
  breite: number;
  hoehe: number;
}

/** Ordnet die Knoten: Spalte aus der Vorgängertiefe, Zeile innerhalb der Bahn nach der mittleren Zeile der Vorgänger. */
function ordne(sicht: BaumSicht): Lage {
  const pos = new Map<string, { x: number; y: number }>();
  const zeileVon = new Map<string, number>();
  const bahnen: Lage["bahnen"] = [];
  let top = 0;
  let spalten = 1;
  for (const z of sicht.zweige) {
    const maxS = Math.max(0, ...z.knoten.map((k) => k.spalte));
    spalten = Math.max(spalten, maxS + 1);
    let zeilen = 1;
    for (let s = 0; s <= maxS; s++) {
      const ks = z.knoten.filter((k) => k.spalte === s);
      const schluessel = (k: KnotenSicht) => {
        const r = k.vorgaenger.map((v) => zeileVon.get(v)).filter((x): x is number => x !== undefined);
        return r.length ? r.reduce((a, b) => a + b, 0) / r.length : 50;
      };
      const sortiert = s === 0 ? ks : [...ks].sort((a, b) => schluessel(a) - schluessel(b));
      sortiert.forEach((k, i) => zeileVon.set(k.id, i));
      zeilen = Math.max(zeilen, ks.length);
    }
    const h = zeilen * M.rowH + 2 * M.lanePad;
    for (const k of z.knoten) {
      pos.set(k.id, { x: M.x0 + k.spalte * M.colW, y: top + M.lanePad + (zeileVon.get(k.id) ?? 0) * M.rowH });
    }
    bahnen.push({ id: z.id, top, h });
    top += h;
  }
  return { pos, bahnen, spalten, breite: M.x0 + spalten * M.colW + 40, hoehe: top };
}

/** Alle Vorgänger eines Knotens (rekursiv). */
function vorfahren(id: string, nach: Map<string, KnotenSicht>, acc = new Set<string>()): Set<string> {
  for (const v of nach.get(id)?.vorgaenger ?? []) {
    if (acc.has(v)) continue;
    acc.add(v);
    vorfahren(v, nach, acc);
  }
  return acc;
}

const klemme = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export interface BaumFensterProps {
  world: World;
  start?: string | null;
  onZu: () => void;
  onGeaendert?: () => void;
  /** Ein Sprung, der aus dem Baum hinausführt (Politiknetz, Haushalt, Außenlage) */
  onAussen?: (s: Sprung, knoten: string) => void;
}

export function BaumFenster({ world: w, start, onZu, onGeaendert, onAussen }: BaumFensterProps) {
  const [stand, setStand] = useState(0);
  const sicht = useMemo(() => baumSicht(w), [w, w.day, stand]);
  const lage = useMemo(() => ordne(sicht), [sicht]);
  const alle = useMemo(() => sicht.zweige.flatMap((z) => z.knoten), [sicht]);
  const nach = useMemo(() => new Map(alle.map((k) => [k.id, k])), [alle]);
  const nachfolger = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const k of alle) for (const v of k.vorgaenger) m.set(v, [...(m.get(v) ?? []), k.id]);
    return m;
  }, [alle]);

  const [wahl, setWahl] = useState<string | null>(start ?? null);
  const [bahnWahl, setBahnWahl] = useState<ZweigId | null>(null);
  const [ueber, setUeber] = useState<string | null>(null);
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [stempelZu, setStempelZu] = useState<string | null>(null);
  const [blick, setBlick] = useState({ x: 0, y: 0, z: 0.85 });
  const fenster = useRef<HTMLDivElement>(null);
  const zug = useRef<{ x: number; y: number; bx: number; by: number; id: number; bewegt: boolean } | null>(null);
  const gezogen = useRef(false);

  const gewaehlt = wahl ? nach.get(wahl) : undefined;
  const pfad = useMemo(() => {
    const id = ueber ?? wahl;
    return id ? vorfahren(id, nach) : new Set<string>();
  }, [ueber, wahl, nach]);
  const ziel = ueber ?? wahl;

  /** Einen Knoten in die Mitte des Bildausschnitts holen. */
  const zeige = useCallback(
    (id: string, z?: number) => {
      const p = lage.pos.get(id);
      const el = fenster.current;
      if (!p || !el) return;
      setBlick((b) => {
        const zz = z ?? b.z;
        const breit = el.clientWidth;
        const hoch = el.clientHeight;
        return { z: zz, x: breit * 0.42 - (p.x + M.nodeW / 2) * zz, y: hoch * 0.45 - (p.y + M.nodeH / 2) * zz };
      });
    },
    [lage],
  );

  // Erster Blick: auf den gewählten, sonst den ersten laufenden oder möglichen Knoten
  useLayoutEffect(() => {
    const el = fenster.current;
    const z0 = el && el.clientWidth < 700 ? 0.66 : 0.86;
    const erst = start ?? alle.find((k) => k.zustand === "laeuft")?.id ?? alle.find((k) => k.zustand === "moeglich")?.id;
    if (erst) zeige(erst, z0);
    else setBlick({ x: 0, y: 0, z: z0 });
    // nur beim Öffnen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mausrad: Rad zoomt um den Zeiger, Trackpad-Wischen verschiebt, Spreizen (ctrl) zoomt
  useEffect(() => {
    const el = fenster.current;
    if (!el) return;
    const rad = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      const istRad = e.ctrlKey || (e.deltaMode !== 0) || (Math.abs(e.deltaX) < 0.5 && Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 40);
      setBlick((b) => {
        if (!istRad) return { ...b, x: b.x - e.deltaX, y: b.y - e.deltaY };
        const f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
        const z = klemme(b.z * f, 0.4, 1.6);
        return { z, x: cx - ((cx - b.x) * z) / b.z, y: cy - ((cy - b.y) * z) / b.z };
      });
    };
    el.addEventListener("wheel", rad, { passive: false });
    return () => el.removeEventListener("wheel", rad);
  }, []);

  // Escape: erst die Leiste, dann das Fenster
  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      if (wahl || bahnWahl) {
        setWahl(null);
        setBahnWahl(null);
      } else onZu();
    };
    window.addEventListener("keydown", taste, true);
    return () => window.removeEventListener("keydown", taste, true);
  }, [wahl, bahnWahl, onZu]);

  const runter = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    zug.current = { x: e.clientX, y: e.clientY, bx: blick.x, by: blick.y, id: e.pointerId, bewegt: false };
    gezogen.current = false;
  };
  const bewege = (e: RPointerEvent<HTMLDivElement>) => {
    const z = zug.current;
    if (!z || z.id !== e.pointerId) return;
    const dx = e.clientX - z.x;
    const dy = e.clientY - z.y;
    if (!z.bewegt && Math.hypot(dx, dy) > 5) {
      z.bewegt = true;
      gezogen.current = true;
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    }
    if (z.bewegt) setBlick((b) => ({ ...b, x: z.bx + dx, y: z.by + dy }));
  };
  const hoch = () => {
    zug.current = null;
    // Ein Klick nach dem Ziehen zählt nicht als Wahl
    window.setTimeout(() => (gezogen.current = false), 0);
  };

  const zoome = (f: number) => {
    const el = fenster.current;
    if (!el) return;
    const cx = el.clientWidth / 2;
    const cy = el.clientHeight / 2;
    setBlick((b) => {
      const z = klemme(b.z * f, 0.4, 1.6);
      return { z, x: cx - ((cx - b.x) * z) / b.z, y: cy - ((cy - b.y) * z) / b.z };
    });
  };
  const ganz = () => {
    const el = fenster.current;
    if (!el) return;
    const z = klemme(Math.min((el.clientWidth - 20) / lage.breite, (el.clientHeight - 20) / lage.hoehe), 0.3, 1);
    setBlick({ z, x: (el.clientWidth - lage.breite * z) / 2, y: 10 });
  };

  const getan = (r: { ok: boolean; text: string }) => {
    setMeldung(r);
    setStand((x) => x + 1);
    if (r.ok) onGeaendert?.();
  };

  const waehle = (id: string) => {
    if (gezogen.current) return;
    setBahnWahl(null);
    setWahl(wahl === id ? null : id);
    setMeldung(null);
  };

  /** Ein Sprungziel: im Baum bleiben (Vorstufe) oder hinaus (Politiknetz, Haushalt, Außenlage), Kapital und Verwaltung als Hinweis. */
  const springe = (s: Sprung, von: string) => {
    if (s.art === "knoten") {
      setBahnWahl(null);
      setWahl(s.id);
      zeige(s.id);
      return;
    }
    if (s.art === "kapital") {
      setMeldung({ ok: false, text: t("wissen.civ.sprung.kapital", { pk: s.pk, kapital: Math.floor(w.spiel?.kapital ?? 0) }) });
      return;
    }
    if (s.art === "verwaltung") {
      setMeldung({ ok: false, text: t("wissen.civ.sprung.verwaltung") });
      return;
    }
    if (onAussen) onAussen(s, von);
  };

  const frisch = alle.find((k) => k.durchbruch && k.id !== stempelZu);
  const laufend = alle.filter((k) => k.zustand === "laeuft");

  // Bildschirmlage von Bahnen und Epochen (Schrift bleibt scharf, nur die Lage folgt dem Zoom)
  const bahnLage = lage.bahnen.map((b) => ({ ...b, sy: blick.y + b.top * blick.z, sh: b.h * blick.z }));
  const epochen = EPOCHEN.filter((e) => e.von < lage.spalten).map((e) => {
    const bis = Math.min(e.bis, lage.spalten - 1);
    const x1 = blick.x + (M.x0 - (M.colW - M.nodeW) / 2 + e.von * M.colW) * blick.z;
    const x2 = blick.x + (M.x0 - (M.colW - M.nodeW) / 2 + (bis + 1) * M.colW) * blick.z;
    return { ...e, x1, x2 };
  });

  const leiste = gewaehlt || bahnWahl;

  return createPortal(
    <div className="wbf" role="dialog" aria-modal="true" aria-label={t("wissen.civ.titel")}>
      <header className="wbf-kopf">
        <div className="wbf-kopf-titel">
          <h2>{t("wissen.civ.titel")}</h2>
          <p>{t("wissen.civ.bildung")}</p>
        </div>
        <div className={`wbf-tempo${sicht.tempo.gesamt >= 1.15 ? " gut" : sicht.tempo.gesamt <= 0.85 ? " schlecht" : ""}`} title={t("wissen.ui.etat", { budget: sicht.etat.budget, grenze: sicht.etat.grenze })}>
          <b>{t("wissen.ui.tempoWert", { tempo: sicht.tempo.gesamt })}</b>
          <span>{t("wissen.ui.tempo")}</span>
        </div>
        <div className="wbf-laufend">
          <span className="wbf-klein">{t("wissen.civ.erforscht")}</span>
          {laufend.length === 0 ? (
            <span className="wbf-nichts">{t("wissen.civ.nichts")}</span>
          ) : (
            <span className="wbf-laufend-liste">
              {laufend.slice(0, 3).map((k) => (
                <button key={k.id} type="button" className="wbf-lauf" onClick={() => { setWahl(k.id); zeige(k.id); }}>
                  <Symbol name={knotenSymbol(k.id, k.zweig)} gross={16} />
                  <span>{knotenName(k.id)}</span>
                  <i style={{ width: `${Math.round(k.fortschritt * 100)}%` }} />
                </button>
              ))}
              {laufend.length > 3 && <span className="wbf-klein">+{laufend.length - 3}</span>}
            </span>
          )}
        </div>
        <div className="wbf-steuer">
          <button type="button" onClick={() => zoome(1 / 1.2)} aria-label={t("wissen.civ.zoomRaus")} title={t("wissen.civ.zoomRaus")}>−</button>
          <button type="button" onClick={() => zoome(1.2)} aria-label={t("wissen.civ.zoomRein")} title={t("wissen.civ.zoomRein")}>+</button>
          <button type="button" className="wbf-ganz" onClick={ganz}>{t("wissen.civ.ganz")}</button>
          <button type="button" className="wbf-zu" onClick={onZu} aria-label={t("wissen.ui.schliessen")}>×</button>
        </div>
      </header>

      <div className="wbf-mitte">
        <div
          ref={fenster}
          className={`wbf-fenster${zug.current?.bewegt ? " zieht" : ""}`}
          onPointerDown={runter}
          onPointerMove={bewege}
          onPointerUp={hoch}
          onPointerCancel={hoch}
        >
          <div className="wbf-flaeche" style={{ width: lage.breite, height: lage.hoehe, transform: `translate(${blick.x}px, ${blick.y}px) scale(${blick.z})` }}>
            {lage.bahnen.map((b) => (
              <div
                key={b.id}
                className={`wbf-bahn b-${b.id}${sicht.schwerpunkt === b.id ? " schwerpunkt" : ""}${bahnWahl === b.id ? " auf" : ""}`}
                style={{ top: b.top, height: b.h, width: lage.breite }}
              />
            ))}
            {/* Epochen als feine Trennlinien */}
            {EPOCHEN.slice(1).filter((e) => e.von < lage.spalten).map((e) => (
              <div key={e.id} className="wbf-epochen-linie" style={{ left: M.x0 - (M.colW - M.nodeW) / 2 + e.von * M.colW, height: lage.hoehe }} />
            ))}
            <svg className="wbf-linien" width={lage.breite} height={lage.hoehe} aria-hidden>
              <defs>
                <marker id="wbf-pfeil" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0 1L10 5L0 9z" fill="currentColor" />
                </marker>
              </defs>
              {alle.flatMap((k) =>
                k.vorgaenger.map((v) => {
                  const a = lage.pos.get(v);
                  const b = lage.pos.get(k.id);
                  if (!a || !b) return null;
                  const x1 = a.x + M.nodeW;
                  const y1 = a.y + M.nodeH / 2;
                  const x2 = b.x - 4;
                  const y2 = b.y + M.nodeH / 2;
                  const dx = Math.max(36, (x2 - x1) / 2);
                  const quer = nach.get(v)?.zweig !== k.zweig;
                  const fertig = nach.get(v)?.zustand === "fertig";
                  const hell = !!ziel && (k.id === ziel || pfad.has(k.id)) && (pfad.has(v));
                  return (
                    <path
                      key={`${v}-${k.id}`}
                      className={`wbf-linie${quer ? " quer" : ""}${fertig ? " fertig" : ""}${hell ? " hell" : ""}${ziel && !hell ? " leise" : ""}`}
                      d={`M${x1} ${y1} C${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
                      markerEnd="url(#wbf-pfeil)"
                    />
                  );
                }),
              )}
            </svg>
            {alle.map((k) => {
              const p = lage.pos.get(k.id)!;
              const werk = WERK_VON[k.id];
              const weiter = nachfolger.get(k.id) ?? [];
              const imPfad = pfad.has(k.id);
              const leise = !!ziel && k.id !== ziel && !imPfad;
              const zeit =
                k.zustand === "fertig"
                  ? t("wissen.ui.zustand.fertig")
                  : k.zustand === "laeuft" && k.restMonate !== undefined
                    ? t("wissen.civ.inMonaten", { n: k.restMonate })
                    : t("wissen.civ.dauer", { n: k.monate });
              return (
                <div
                  key={k.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={wahl === k.id}
                  className={`wbf-k z-${k.zustand} b-${k.zweig}${wahl === k.id ? " auf" : ""}${imPfad ? " pfad" : ""}${leise ? " leise" : ""}`}
                  style={{ left: p.x, top: p.y, width: M.nodeW, height: M.nodeH }}
                  onClick={() => waehle(k.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      waehle(k.id);
                    }
                  }}
                  onPointerEnter={() => setUeber(k.id)}
                  onPointerLeave={() => setUeber((u) => (u === k.id ? null : u))}
                  title={k.grund ?? t(`wissen.n.${k.id}.satz`)}
                >
                  <span className="wbf-k-rund">
                    <Symbol name={knotenSymbol(k.id, k.zweig)} gross={26} />
                  </span>
                  <span className="wbf-k-name">{knotenName(k.id)}</span>
                  <span className="wbf-k-unten">
                    <span className="wbf-k-frei">
                      {werk && (
                        <span title={t("wissen.civ.frei.werk")}>
                          <Symbol name="werk" gross={14} />
                        </span>
                      )}
                      {werk?.gut && (
                        <span title={t("wissen.civ.frei.ware", { gut: t(`gueter.gut.${werk.gut.id}`) })}>
                          <Symbol name="ware" gross={14} />
                        </span>
                      )}
                      {werk?.militaer?.length ? (
                        <span title={t("wissen.civ.frei.gattung", { liste: werk.militaer.map((g) => t(`militaer.gattung.${g}`)) })}>
                          <Symbol name="gattung" gross={14} />
                        </span>
                      ) : null}
                      {weiter.length > 0 && (
                        <span title={t("wissen.civ.frei.weiter", { liste: weiter.map(knotenName) })}>
                          <Symbol name="weiter" gross={14} />
                          <small>{weiter.length}</small>
                        </span>
                      )}
                    </span>
                    {k.zustand === "gesperrt" && k.hindernis ? (
                      <button
                        type="button"
                        className={`wbf-k-grund h-${k.hindernis}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (gezogen.current) return;
                          if (k.sprung) springe(k.sprung, k.id);
                          else waehle(k.id);
                        }}
                        title={k.grund}
                      >
                        {t(`wissen.ui.h.${k.hindernis}`)}
                      </button>
                    ) : (
                      <span className="wbf-k-zeit">{zeit}</span>
                    )}
                  </span>
                  {k.zustand === "laeuft" && (
                    <span className="wbf-k-balken" aria-hidden>
                      <i style={{ width: `${Math.round(k.fortschritt * 100)}%` }} />
                    </span>
                  )}
                  {k.heureka && k.zustand !== "fertig" && (
                    <span
                      className={`wbf-k-heureka${k.heureka.ausgeloest ? " ja" : k.heureka.erfuellt ? " bereit" : ""}`}
                      title={t("wissen.civ.heurekaTip", {
                        bedingung: k.heureka.text,
                        stand: t(k.heureka.ausgeloest ? "wissen.ui.heurekaJa" : k.heureka.erfuellt ? "wissen.ui.heurekaBereit" : "wissen.civ.offen"),
                      })}
                    >
                      <Symbol name="heureka" gross={13} />
                    </span>
                  )}
                  {k.durchbruch && <span className="wbf-k-stempel">{t("wissen.ui.durchbruch")}</span>}
                </div>
              );
            })}
          </div>

          {/* Zeitstrahl oben, Bahnnamen links: folgen dem Bild, Schrift bleibt gleich groß */}
          <div className="wbf-epochen" aria-hidden>
            {epochen.map((e) => (
              <span key={e.id} style={{ left: e.x1, width: Math.max(0, e.x2 - e.x1) }}>
                {t(`wissen.civ.epoche.${e.id}`)}
              </span>
            ))}
          </div>
          <div className="wbf-bahnnamen">
            {bahnLage.map((b) => {
              const z = sicht.zweige.find((x) => x.id === b.id)!;
              return (
                <button
                  key={b.id}
                  type="button"
                  className={`wbf-bahnname b-${b.id}${sicht.schwerpunkt === b.id ? " schwerpunkt" : ""}${bahnWahl === b.id ? " auf" : ""}`}
                  style={{ top: b.sy, height: b.sh }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => { setWahl(null); setBahnWahl(bahnWahl === b.id ? null : b.id); }}
                  title={t("wissen.civ.bahnTip")}
                >
                  <Symbol name={zweigSymbol(b.id)} gross={18} />
                  <span>
                    <b>{t(`wissen.z.${b.id}.name`)}</b>
                    <small>{t("wissen.ui.fertigVon", { fertig: z.fertig, gesamt: z.knoten.length })}</small>
                    {sicht.schwerpunkt === b.id && <em>{t("wissen.ui.schwerpunkt")}</em>}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="wbf-legende">
            <span className="l-fertig">{t("wissen.ui.zustand.fertig")}</span>
            <span className="l-laeuft">{t("wissen.ui.zustand.laeuft")}</span>
            <span className="l-moeglich">{t("wissen.ui.zustand.moeglich")}</span>
            <span className="l-gesperrt">{t("wissen.ui.zustand.gesperrt")}</span>
            <span className="l-heureka"><Symbol name="heureka" gross={12} /> {t("wissen.ui.heureka")}</span>
            <span className="wbf-klein">{t("wissen.civ.ziehen")}</span>
          </p>

          {meldung && (
            <p className={`wbf-meldung ${meldung.ok ? "ok" : "nein"}`} role="status">
              {meldung.text}
              <button type="button" onClick={() => setMeldung(null)} aria-label={t("wissen.ui.schliessen")}>×</button>
            </p>
          )}

          {frisch && (
            <div className="wbf-durchbruch" role="status">
              <span className="wbf-stempel">{t("wissen.ui.durchbruch")}</span>
              <span>{t("wissen.ui.durchbruchText", { name: knotenName(frisch.id) })}</span>
              <button type="button" onClick={() => setStempelZu(frisch.id)} aria-label={t("wissen.ui.schliessen")}>×</button>
            </div>
          )}
        </div>

        {leiste && (
          <aside className="wbf-leiste">
            {gewaehlt ? (
              <Detail key={gewaehlt.id} w={w} k={gewaehlt} onGetan={getan} onZu={() => setWahl(null)} onSprung={(s) => springe(s, gewaehlt.id)} />
            ) : bahnWahl ? (
              <BahnBlatt w={w} sicht={sicht} id={bahnWahl} onGetan={getan} onZu={() => setBahnWahl(null)} />
            ) : null}
          </aside>
        )}
      </div>
    </div>,
    document.body,
  );
}

/** Leiste einer Bahn: Zweck des Zweigs und die Wahl zum Schwerpunkt. */
function BahnBlatt({ w, sicht, id, onGetan, onZu }: { w: World; sicht: BaumSicht; id: ZweigId; onGetan: (r: { ok: boolean; text: string }) => void; onZu: () => void }) {
  const z = sicht.zweige.find((x) => x.id === id)!;
  const ist = sicht.schwerpunkt === id;
  const gesperrt = sicht.schwerpunktSperre > 0;
  return (
    <section className="wb-detail wbf-bahnblatt">
      <header className="wb-detail-kopf">
        <div className="wbf-detail-titel">
          <span className={`wbf-k-rund b-${id}`}><Symbol name={zweigSymbol(id)} gross={24} /></span>
          <div>
            <h3>{t(`wissen.z.${id}.name`)}</h3>
            <p className="wb-detail-zweig">{t("wissen.ui.fertigVon", { fertig: z.fertig, gesamt: z.knoten.length })}</p>
          </div>
        </div>
        <button type="button" className="wb-zu" onClick={onZu} aria-label={t("wissen.ui.schliessen")}>×</button>
      </header>
      <p className="wb-detail-satz">{t(`wissen.z.${id}.satz`)}</p>
      {ist ? (
        <p className="wb-hinweis">{t("wissen.civ.istSchwerpunkt")}</p>
      ) : (
        <div className="wb-knoepfe">
          <button type="button" className="wb-knopf haupt" disabled={gesperrt} onClick={() => onGetan(setzeSchwerpunkt(w, id))}>
            {t("wissen.civ.schwerpunktSetzen", { pk: BAUM.schwerpunktPk })}
          </button>
        </div>
      )}
      {sicht.schwerpunkt && !ist && (
        <button type="button" className="wb-knopf" disabled={gesperrt} onClick={() => onGetan(setzeSchwerpunkt(w, null))}>
          {t("wissen.civ.schwerpunktAus")}
        </button>
      )}
      <p className="wb-hinweis">{gesperrt ? t("wissen.ui.schwerpunktSperre", { tage: sicht.schwerpunktSperre }) : t("wissen.ui.schwerpunktPreis", { pk: BAUM.schwerpunktPk })}</p>
    </section>
  );
}

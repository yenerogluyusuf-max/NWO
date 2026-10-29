// Gemeinsames Muster aller Instrumente-Ansichten: oben ein Satz Lage mit ein, zwei Hauptzahlen, darunter ein Raster kompakter Kacheln
// (Bild, Name, Kernwert, kleine Stufenleisten, Zustandsmarke, höchstens eine Zeile). Ein Klick öffnet die Detailleiste rechts
// (am Handy als Blatt von unten) mit Beschreibung, Handlungen samt Preis und Rückmeldung. Die Übersicht passt ohne Scrollen auf den
// Bildschirm; Einzelheiten stehen nur in der Leiste.

import { createContext, useContext, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { Ziel } from "../schreibtisch/briefing";
import { t } from "../../i18n";
import "./uebersicht.css";

export type UbTon = "gut" | "mittel" | "schlecht" | "neutral" | "aktiv";

export interface UbLeiste {
  name: string;
  stufe: number;
  max: number;
  /** Ausbau auf die nächste Stufe läuft */
  bau?: boolean;
}

export interface UbKachel {
  id: string;
  titel: string;
  /** höchstens eine Zeile */
  zeile?: string;
  /** kleines Porträt oder Symbol */
  bild?: ReactNode;
  /** Kernwert rechts oben */
  wert?: string;
  /** kleine Beschriftung unter dem Kernwert */
  wertLabel?: string;
  leisten?: UbLeiste[];
  /** einfacher Balken 0..1 statt Stufenleisten */
  anteil?: number;
  marke?: { text: string; ton: UbTon };
  /** Randfarbe der Kachel */
  ton?: UbTon;
  /** Gruppe (kleine Zwischenüberschrift) */
  gruppe?: string;
  /** Auffälligkeit: Höheres steht zuerst */
  rang?: number;
}

/** Sprung zu einer anderen Stelle des Spiels (die Bühne stellt ihn bereit). */
export const SprungKontext = createContext<((z: Ziel) => void) | null>(null);
export function useSprung() {
  return useContext(SprungKontext);
}

/** Verweis auf die zuständige Stelle, etwa „Etat im Haushalt erhöhen“. Ohne Bühne bleibt es ein Hinweis. */
export function UbVerweis({ ziel, children }: { ziel: Ziel; children: ReactNode }) {
  const gehe = useSprung();
  if (!gehe) return <span className="ub-hinweis">{children}</span>;
  return (
    <button type="button" className="link ub-verweis" onClick={() => gehe(ziel)}>
      {children} →
    </button>
  );
}

export function UbStufen({ stufe, max, bau, gross }: { stufe: number; max: number; bau?: boolean | undefined; gross?: boolean }) {
  return (
    <span className={`ub-stufen${gross ? " gross" : ""}`} role="img" aria-label={t("ub.stufe", { stufe, max })}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <i key={n} className={`${n <= stufe ? "an" : ""}${bau && n === stufe + 1 ? " bau" : ""}`} aria-hidden />
      ))}
    </span>
  );
}

function Kachel({ k, gewaehlt, onWahl }: { k: UbKachel; gewaehlt: boolean; onWahl: () => void }) {
  const taste = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onWahl();
    }
  };
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={gewaehlt}
      className={`ub-kachel ton-${k.ton ?? "neutral"}${gewaehlt ? " gewaehlt" : ""}`}
      onClick={onWahl}
      onKeyDown={taste}
    >
      {k.bild && <span className="ub-bild">{k.bild}</span>}
      <span className="ub-kern">
        <span className="ub-kopf">
          <b className="ub-titel">{k.titel}</b>
          {k.wert !== undefined && (
            <span className="ub-wert">
              {k.wert}
              {k.wertLabel && <small>{k.wertLabel}</small>}
            </span>
          )}
        </span>
        {k.leisten && k.leisten.length > 0 && (
          <span className="ub-leisten">
            {k.leisten.map((l) => (
              <span key={l.name} className="ub-leiste" title={`${l.name}: ${t("ub.stufe", { stufe: l.stufe, max: l.max })}`}>
                <em>{l.name}</em>
                <UbStufen stufe={l.stufe} max={l.max} bau={l.bau} />
              </span>
            ))}
          </span>
        )}
        {k.anteil !== undefined && (
          <span className="ub-anteil" aria-hidden>
            <i style={{ width: `${Math.max(0, Math.min(1, k.anteil)) * 100}%` }} />
          </span>
        )}
        {(k.marke || k.zeile) && (
          <span className="ub-fuss">
            {k.marke && <span className={`ub-marke ton-${k.marke.ton}`}>{k.marke.text}</span>}
            {k.zeile && <span className="ub-zeile">{k.zeile}</span>}
          </span>
        )}
      </span>
    </div>
  );
}

export interface UebersichtProps {
  /** ein Satz zur Lage */
  lage?: ReactNode;
  /** ein, zwei Hauptzahlen rechts im Kopf */
  zahlen?: { label: string; wert: string; ton?: UbTon }[];
  kacheln: UbKachel[];
  /** Inhalt der Detailleiste zur gewählten Kachel */
  detail: (id: string) => ReactNode;
  /** Kachel, die zu Beginn offen ist (Sprung von außen) */
  start?: string | undefined;
  /** schmalere Kacheln (viele Einträge) */
  dicht?: boolean;
  /** zusätzlicher Inhalt unter dem Raster (kompakt halten) */
  fuss?: ReactNode;
  /** Beschriftung des Rasters für Bildschirmleser */
  aria?: string;
  /** sortiert nach Auffälligkeit (rang), sonst Reihenfolge der Daten */
  sortiert?: boolean;
  /** gesteuerte Auswahl (die Ansicht hält den Zustand selbst) */
  wahl?: string | null;
  onWahl?: (id: string | null) => void;
}

export function Uebersicht({ lage, zahlen, kacheln, detail, start, dicht, fuss, aria, sortiert = true, wahl: wahlAussen, onWahl }: UebersichtProps) {
  const [wahlInnen, setWahlInnen] = useState<string | null>(start ?? null);
  const gesteuert = wahlAussen !== undefined;
  const wahl = gesteuert ? wahlAussen : wahlInnen;
  const setWahl = (id: string | null) => {
    if (!gesteuert) setWahlInnen(id);
    onWahl?.(id);
  };
  const [filter, setFilter] = useState("");
  const leiste = useRef<HTMLElement>(null);
  useEffect(() => {
    if (start && !gesteuert) setWahlInnen(start);
  }, [start, gesteuert]);
  useEffect(() => {
    if (wahl && leiste.current) leiste.current.scrollTop = 0;
  }, [wahl]);
  const sichtbar = useMemo(() => {
    const f = filter.trim().toLocaleLowerCase();
    const liste = f ? kacheln.filter((k) => `${k.titel} ${k.zeile ?? ""} ${k.gruppe ?? ""}`.toLocaleLowerCase().includes(f)) : kacheln;
    if (!sortiert) return liste;
    return liste
      .map((k, i) => ({ k, i }))
      .sort((a, b) => (b.k.rang ?? 0) - (a.k.rang ?? 0) || a.i - b.i)
      .map((x) => x.k);
  }, [kacheln, filter, sortiert]);
  // Gruppen in der Reihenfolge ihres ersten Auftretens
  const gruppen = useMemo(() => {
    const g: { name: string | undefined; kacheln: UbKachel[] }[] = [];
    for (const k of sichtbar) {
      const vorhanden = g.find((x) => x.name === k.gruppe);
      if (vorhanden) vorhanden.kacheln.push(k);
      else g.push({ name: k.gruppe, kacheln: [k] });
    }
    return g;
  }, [sichtbar]);
  const offen = wahl && kacheln.some((k) => k.id === wahl) ? wahl : null;

  return (
    <div className={`ub${offen ? " mit-detail" : ""}${dicht ? " dicht" : ""}`}>
      {(lage || (zahlen && zahlen.length > 0)) && (
        <div className="ub-lage">
          {lage && <p>{lage}</p>}
          {zahlen && zahlen.length > 0 && (
            <span className="ub-zahlen">
              {zahlen.map((z) => (
                <span key={z.label} className={`ub-zahl ton-${z.ton ?? "neutral"}`}>
                  <strong>{z.wert}</strong>
                  <small>{z.label}</small>
                </span>
              ))}
            </span>
          )}
        </div>
      )}
      <div className="ub-flaeche">
        <div className="ub-raster-huelle">
          {kacheln.length > 12 && (
            <input className="ub-filter" type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t("ub.filter")} aria-label={t("ub.filter")} />
          )}
          {gruppen.map((g) => (
            <section key={g.name ?? "_"} className="ub-gruppe" aria-label={g.name ?? aria}>
              {g.name && <h4 className="ub-gruppe-name">{g.name}</h4>}
              <div className="ub-raster">
                {g.kacheln.map((k) => (
                  <Kachel key={k.id} k={k} gewaehlt={offen === k.id} onWahl={() => setWahl(offen === k.id ? null : k.id)} />
                ))}
              </div>
            </section>
          ))}
          {sichtbar.length === 0 && <p className="ub-hinweis">{t("ub.keine")}</p>}
          {fuss}
        </div>
        {offen && (
          <aside className="ub-detail" ref={leiste} aria-label={kacheln.find((k) => k.id === offen)?.titel}>
            <button type="button" className="link ub-zu" onClick={() => setWahl(null)} aria-label={t("ub.schliessen")}>
              ✕
            </button>
            {detail(offen)}
          </aside>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bausteine der Detailleiste

export function UbDetailKopf({ bild, titel, unter, text }: { bild?: ReactNode; titel: string; unter?: ReactNode; text?: ReactNode }) {
  return (
    <header className="ub-dkopf">
      {bild && <span className="ub-dbild">{bild}</span>}
      <span>
        <h4>{titel}</h4>
        {unter && <span className="ub-dunter">{unter}</span>}
      </span>
      {text && <p className="ub-dtext">{text}</p>}
    </header>
  );
}

/** Preis als Chips: „4 Kapital“, „0,08 % des BIP“, „11 Monate“ */
export function UbPreis({ teile }: { teile: (string | false | null | undefined)[] }) {
  const da = teile.filter(Boolean) as string[];
  if (!da.length) return null;
  return (
    <span className="ub-preis">
      {da.map((p) => (
        <span key={p}>{p}</span>
      ))}
    </span>
  );
}

/** Eine Handlung: Knopf, Preis, Wirkung in einem Satz; gesperrt mit Grund (und Verweis auf die zuständige Stelle) */
export function UbHandlung({
  titel,
  satz,
  preis,
  ok = true,
  grund,
  verweis,
  onTun,
  leise,
  knopf,
}: {
  titel: string;
  satz?: ReactNode;
  preis?: (string | false | null | undefined)[];
  ok?: boolean;
  grund?: ReactNode;
  verweis?: ReactNode;
  onTun: () => void;
  leise?: boolean;
  knopf?: string;
}) {
  return (
    <div className={`ub-handlung${ok ? "" : " gesperrt"}${leise ? " leise" : ""}`}>
      <div className="ub-hkopf">
        <b>{titel}</b>
        {preis && <UbPreis teile={preis} />}
      </div>
      {satz && <p>{satz}</p>}
      <div className="ub-hfuss">
        <button type="button" className={`aktion-knopf klein${leise ? " leise" : ""}`} disabled={!ok} onClick={onTun}>
          {knopf ?? titel}
        </button>
        {!ok && grund && <span className="ub-grund">{grund}</span>}
        {verweis}
      </div>
    </div>
  );
}

/** Rückmeldung nach einer Handlung: Stempel mit kurzem Text */
export function UbRueck({ antwort }: { antwort: { ok: boolean; text: string; why?: string | undefined } | null }) {
  if (!antwort) return null;
  return (
    <p className={`ub-rueck ${antwort.ok ? "ok" : "nein"}`} role="status" key={antwort.text}>
      <span className="ub-stempel" aria-hidden>
        {t(antwort.ok ? "ub.stempel.ok" : "ub.stempel.nein")}
      </span>
      <span>
        {antwort.text}
        {antwort.why && <em> {antwort.why}</em>}
      </span>
    </p>
  );
}

/** Aufklappbarer Abschnitt in der Detailleiste */
export function UbMehr({ titel, children, offen }: { titel: string; children: ReactNode; offen?: boolean }) {
  return (
    <details className="ub-mehr" open={offen}>
      <summary>{titel}</summary>
      {children}
    </details>
  );
}

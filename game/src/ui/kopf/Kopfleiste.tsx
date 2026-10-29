// Kopfleiste in drei Zonen nach dem Vorbild der Oberleisten von Civ 6 und HOI 4:
// links „Wer“ (Porträt, Name, Partei), Mitte „Wann“ (Datum, Tempo), rechts „Wie steht es“ (gleich gebaute Kennzahlen), ganz rechts das Menü.
// Sichern, Spielstände, Sprache, Auswahl der Werte und Effekte liegen im Menü statt als Dauerknöpfe in der Leiste.
// Die Leiste rechnet nichts selbst: Stage liefert Werte und Handlungen; sie ordnet und zeigt nur.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { t, zahl } from "../../i18n";
import { Icon, type IconName } from "../icons";
import { Cameo } from "../art/Cameo";
import { SprachWahl } from "../SprachWahl";
import { Effekte } from "../Effekte";
import { tonStatus, tonLabel, tonUm } from "../ton/ton";
import "./kopf.css";

export type KopfWertId = "zustimmung" | "kapital" | "parlament" | "inflation" | "lira" | "leitzins";

export type KopfWert = {
  id: KopfWertId;
  icon: IconName;
  /** Kurzname unter der Zahl */
  name: string;
  wert: string;
  /** Kleiner Zusatz hinter der Zahl, etwa „/600“ */
  zusatz?: string;
  trend?: number;
  /** Steigen ist gut (Zustimmung) oder schlecht (Inflation); bestimmt die Farbe des Trendpfeils */
  steigenGut?: boolean;
  warn?: boolean;
  tip: string;
  tipZeile?: string;
  onKlick?: () => void;
  /** Bild unter der Zahl, etwa der Balken der Mehrheit */
  bild?: ReactNode;
};

/** Höchstens so viele wählbare Werte zusätzlich zu Zustimmung, Kapital und Parlament */
export const MAX_WAHL = 2;

export type Wahlbar = { id: "inflation" | "lira" | "leitzins"; name: string };

export function Kopfleiste(p: {
  name: string;
  partei: string;
  parteiFarbe?: string;
  amt: string;
  datum: string;
  tempo: number;
  onTempo: (i: number) => void;
  werte: KopfWert[];
  wahlbar: Wahlbar[];
  gewaehlt: Set<string>;
  onWertWechsel: (id: Wahlbar["id"]) => void;
  sicherStatus: "ruhig" | "frisch" | "fehler";
  sicherGrund: string | null;
  onSichern: () => void;
  onSpielstaende: () => void;
  /** Zurück ins Titelbild; Stage sichert vorher */
  onHauptmenue?: () => void;
}) {
  useTempoTasten(p.onTempo);
  return (
    <header className="hud kf">
      <div className="hud-bar" />
      <div className="kf-wer" title={`${p.name} · ${p.partei} · ${p.amt}`}>
        <div className="leader">
          <Cameo seed={p.name} size={46} {...(p.parteiFarbe ? { tint: p.parteiFarbe } : {})} ring="keiner" />
        </div>
        <div className="kf-wer-text">
          <div className="kf-name">{p.name}</div>
          <div className="kf-partei">
            <span className="party-dot" style={{ background: p.parteiFarbe }} />
            <span className="kf-partei-name">{p.partei}</span>
          </div>
        </div>
      </div>

      <div className="kf-wann">
        <span className="kf-datum">{p.datum}</span>
        <div className="speeds kf-tempo" role="group" aria-label={t("st.tempo.gruppe")}>
          {[0, 1, 2, 3, 4].map((i) => (
            <button
              key={i}
              type="button"
              className={i === p.tempo ? "on" : ""}
              onClick={() => p.onTempo(i)}
              aria-label={tempoName(i)}
              aria-pressed={i === p.tempo}
              aria-keyshortcuts={i === 0 ? "Space" : String(i)}
              title={t("kopf.tempo.taste", { name: tempoName(i), taste: i === 0 ? t("kopf.tempo.leertaste") : String(i) })}
            >
              {i === 0 ? <span className="pause-glyph" /> : i === 4 ? <span className="skip-glyph" /> : Array.from({ length: i }, (_, k) => <span key={k} className="play-glyph" />)}
            </button>
          ))}
        </div>
      </div>

      <div className="kf-wie" role="group" aria-label={t("kopf.werte.gruppe")}>
        {p.werte.map((w) => (
          <KopfZahl key={w.id} w={w} />
        ))}
      </div>

      <KopfMenue {...p} />
    </header>
  );
}

function tempoName(i: number): string {
  return i === 0 ? t("st.tempo.pause") : i === 4 ? t("st.tempo.bis") : t("st.tempo.n", { n: i });
}

/** Tasten 1 bis 4 wählen das Tempo (die Leertaste für Pause liegt in Stage); nicht beim Tippen in Feldern. */
function useTempoTasten(onTempo: (i: number) => void) {
  const ref = useRef(onTempo);
  ref.current = onTempo;
  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const ziel = e.target as HTMLElement | null;
      if (ziel && (["INPUT", "TEXTAREA", "SELECT"].includes(ziel.tagName) || ziel.isContentEditable)) return;
      const n = ["1", "2", "3", "4"].indexOf(e.key);
      if (n < 0) return;
      e.preventDefault();
      ref.current(n + 1);
    };
    window.addEventListener("keydown", taste);
    return () => window.removeEventListener("keydown", taste);
  }, []);
}

function KopfZahl({ w }: { w: KopfWert }) {
  const zeigeTrend = w.trend !== undefined && Math.abs(w.trend) > 0.05;
  const gut = zeigeTrend ? (w.trend! > 0) === (w.steigenGut ?? false) : false;
  const inhalt = (
    <>
      <Icon name={w.icon} />
      <span className="kf-zahl-kern">
        <span className="kf-zahl-wert">
          {w.wert}
          {w.zusatz && <small className="kf-zahl-zusatz">{w.zusatz}</small>}
          {zeigeTrend && (
            <span className={`kf-trend ${gut ? "gut" : "schlecht"}`} aria-hidden>
              {w.trend! > 0 ? "▲" : "▼"}
              {zahl(Math.abs(w.trend!), 1)}
            </span>
          )}
        </span>
        {w.bild ?? <span className="kf-zahl-name">{w.name}</span>}
      </span>
      <span className="tip" role="tooltip">
        <strong>{w.name}</strong>
        <span className="tip-text">{w.tip}</span>
        {w.tipZeile && <span className="tip-text tip-zeile">{w.tipZeile}</span>}
        {w.onKlick && <span className="tip-text tip-klick">{t("kopf.werte.klick")}</span>}
      </span>
    </>
  );
  const klasse = `stat kf-zahl kf-${w.id}${w.warn ? " warn" : ""}`;
  return w.onKlick ? (
    <button type="button" className={klasse} onClick={w.onKlick} aria-label={`${w.name}: ${w.wert}${w.zusatz ?? ""}`}>
      {inhalt}
    </button>
  ) : (
    <div className={klasse} tabIndex={0}>
      {inhalt}
    </div>
  );
}

/** Balken der Mehrheit: Lager, Duldung, Opposition auf 600 Sitze, mit Strich an der Schwelle */
export function MehrheitsBalken({ lager, geduldet, gesamt, schwelle }: { lager: number; geduldet: number; gesamt: number; schwelle: number }) {
  const g = Math.max(1, gesamt);
  return (
    <span className="kf-mehrheit" aria-hidden>
      <i className="kf-mh-lager" style={{ width: `${(lager / g) * 100}%` }} />
      <i className="kf-mh-duldung" style={{ width: `${(geduldet / g) * 100}%` }} />
      <b className="kf-mh-schwelle" style={{ left: `${(schwelle / g) * 100}%` }} />
    </span>
  );
}

function KopfMenue(p: Parameters<typeof Kopfleiste>[0]) {
  const [offen, setOffen] = useState(false);
  const [ton, setTon] = useState(tonStatus);
  const wurzel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!offen) return;
    const weg = (e: MouseEvent) => {
      if (wurzel.current && !wurzel.current.contains(e.target as Node)) setOffen(false);
    };
    const taste = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOffen(false);
    };
    window.addEventListener("mousedown", weg);
    window.addEventListener("keydown", taste);
    return () => {
      window.removeEventListener("mousedown", weg);
      window.removeEventListener("keydown", taste);
    };
  }, [offen]);
  const fehler = p.sicherStatus === "fehler";
  return (
    <div className="kf-menue" ref={wurzel}>
      {p.sicherStatus === "frisch" && (
        <span className="kf-stempel" role="status">
          {t("kopf.gesichert")}
        </span>
      )}
      <button
        type="button"
        className={`kf-menue-knopf${fehler ? " fehler" : ""}${offen ? " offen" : ""}`}
        aria-expanded={offen}
        aria-haspopup="true"
        aria-label={fehler ? t("kopf.menue.fehler") : t("kopf.menue.titel")}
        title={fehler ? t("st.sichern.fehler", { grund: p.sicherGrund ?? t("st.sichern.unbekannt") }) : t("kopf.menue.titel")}
        onClick={() => setOffen((o) => !o)}
      >
        <span className="kf-menue-striche" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        {fehler && <span className="kf-menue-punkt" aria-hidden />}
      </button>
      {offen && (
        <div className="kf-menue-tafel" role="menu" aria-label={t("kopf.menue.titel")}>
          <button
            type="button"
            role="menuitem"
            className={`kf-eintrag${fehler ? " fehler" : ""}`}
            onClick={() => {
              p.onSichern();
              setOffen(false);
            }}
          >
            <Icon name={fehler ? "warnung" : "siegel"} size={16} />
            <span className="kf-eintrag-text">
              <span>{fehler ? t("st.sichern.nochmal") : t("kopf.menue.sichern")}</span>
              {fehler && <small>{p.sicherGrund ?? t("st.sichern.unbekannt")}</small>}
            </span>
            <kbd>{t("kopf.menue.sichernTaste")}</kbd>
          </button>
          <button
            type="button"
            role="menuitem"
            className="kf-eintrag"
            onClick={() => {
              p.onSpielstaende();
              setOffen(false);
            }}
          >
            <Icon name="akte" size={16} />
            <span className="kf-eintrag-text">
              <span>{t("kopf.menue.spielstaende")}</span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="kf-eintrag"
            onClick={() => setTon(tonUm())}
          >
            <Icon name="ton" size={16} />
            <span className="kf-eintrag-text">
              <span>{tonLabel()}</span>
            </span>
          </button>

          <div className="kf-abschnitt">
            <div className="kf-abschnitt-titel">{t("sprache.wahl")}</div>
            <SprachWahl className="kf-sprache" />
          </div>

          <div className="kf-abschnitt">
            <div className="kf-abschnitt-titel">{t("kopf.menue.werte")}</div>
            <p className="kf-abschnitt-hinweis">{t("kopf.menue.werteHinweis")}</p>
            {p.wahlbar.map((x) => {
              const an = p.gewaehlt.has(x.id);
              // Höchstens fünf Kennzahlen: drei feste und zwei gewählte
              const voll = !an && p.wahlbar.filter((y) => p.gewaehlt.has(y.id)).length >= MAX_WAHL;
              return (
                <label key={x.id} className={`kf-wahl${voll ? " gesperrt" : ""}`} title={voll ? t("kopf.menue.werteVoll") : undefined}>
                  <input type="checkbox" checked={an} disabled={voll} onChange={() => p.onWertWechsel(x.id)} /> {x.name}
                </label>
              );
            })}
          </div>

          <div className="kf-abschnitt">
            <div className="kf-abschnitt-titel">{t("effekte.gruppe")}</div>
            <Effekte className="kf-effekte" />
          </div>

          {p.onHauptmenue && (
            <div className="kf-abschnitt kf-abschnitt-schluss">
              <button
                type="button"
                role="menuitem"
                className="kf-eintrag"
                onClick={() => {
                  setOffen(false);
                  p.onHauptmenue?.();
                }}
              >
                <Icon name="haus" size={16} />
                <span className="kf-eintrag-text">
                  <span>{t("kopf.menue.hauptmenue")}</span>
                  <small className="kf-eintrag-hinweis">{t("kopf.menue.hauptmenueHinweis")}</small>
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

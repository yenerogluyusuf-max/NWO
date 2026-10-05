// Linsenwahl: ein Knopf unten links nennt die aktive Kartenebene, ein Klick öffnet nach oben eine Tafel mit beschrifteten Kacheln
// in Gruppen (Vorbild: die Kartenlinsen in Civilization VI). Neben dem Knopf hängt die kleine Legende der Ebene.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../icons";
import { LegendeKompakt } from "../Kartenlegende";
import { KARTENEBENEN, ebeneName, type Kartenebene, type Legende } from "../ebenen";
import { LINSEN_TASTEN, linseFuerTaste, linsenGruppen, tasteDarfWaehlen } from "./linsen";
import type { World } from "../../sim/types";
import { t } from "../../i18n";
import "./linsen.css";

export interface LinsenWahlProps {
  world: World;
  ebene: Kartenebene;
  /** Name des gewählten Netzknotens, solange die Ebene „Politiknetz“ aktiv ist */
  netName?: string | undefined;
  problemId: string | null;
  legende: Legende | undefined;
  onEbene: (e: Kartenebene) => void;
  onProblem: (id: string | null) => void;
  /** Wahr, solange eine Akte oder ein Fenster offen ist: Dann ruhen die Zifferntasten und die Tafel schließt */
  gesperrt?: boolean;
  /** Nur für den Test ohne Browser: Tafel von Anfang an offen */
  offenStart?: boolean;
}

export function LinsenWahl({ world, ebene, netName, problemId, legende, onEbene, onProblem, gesperrt = false, offenStart = false }: LinsenWahlProps) {
  const [offen, setOffen] = useState(offenStart);
  const huelle = useRef<HTMLDivElement>(null);
  const knopf = useRef<HTMLButtonElement>(null);
  const tafel = useRef<HTMLDivElement>(null);

  // Die Tafel rechnet nur beim Öffnen (und alle zehn Spieltage), nicht bei jedem Bild
  const gruppen = useMemo(
    () => (offen ? linsenGruppen(world) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [offen, world.day - (world.day % 10), world.spiel?.welt],
  );

  const schliesse = useCallback((zumKnopf: boolean) => {
    setOffen(false);
    if (zumKnopf) knopf.current?.focus();
  }, []);

  const waehle = useCallback(
    (e: Kartenebene) => {
      onEbene(e);
      schliesse(true);
    },
    [onEbene, schliesse],
  );

  // Fokus auf die aktive Kachel beim Öffnen
  useEffect(() => {
    if (!offen) return;
    const t = window.setTimeout(() => {
      const ziel = tafel.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]') ?? tafel.current?.querySelector<HTMLButtonElement>("button.linsen-kachel");
      ziel?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [offen]);

  // Esc schliesst, ein Klick daneben auch; Pfeiltasten wandern durch die Kacheln
  useEffect(() => {
    if (!offen) return;
    const taste = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        ev.stopPropagation();
        schliesse(true);
        return;
      }
      if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(ev.key)) return;
      const kacheln = Array.from(tafel.current?.querySelectorAll<HTMLButtonElement>("button.linsen-kachel") ?? []);
      if (!kacheln.length) return;
      const jetzt = kacheln.indexOf(document.activeElement as HTMLButtonElement);
      let neu = jetzt;
      if (ev.key === "Home") neu = 0;
      else if (ev.key === "End") neu = kacheln.length - 1;
      else neu = (jetzt + (ev.key === "ArrowRight" || ev.key === "ArrowDown" ? 1 : -1) + kacheln.length) % kacheln.length;
      ev.preventDefault();
      kacheln[neu]?.focus();
    };
    const daneben = (ev: PointerEvent) => {
      if (huelle.current && !huelle.current.contains(ev.target as Node)) setOffen(false);
    };
    window.addEventListener("keydown", taste, true);
    window.addEventListener("pointerdown", daneben);
    return () => {
      window.removeEventListener("keydown", taste, true);
      window.removeEventListener("pointerdown", daneben);
    };
  }, [offen, schliesse]);

  // Öffnet sich eine Akte oder ein Fenster, schließt die Tafel
  useEffect(() => {
    if (gesperrt) setOffen(false);
  }, [gesperrt]);

  // Zifferntasten 1 bis 9 und 0 wählen die Linsen, solange kein Textfeld Fokus hat und nichts offen ist
  useEffect(() => {
    const taste = (ev: KeyboardEvent) => {
      if (ev.key.length !== 1 || !LINSEN_TASTEN.includes(ev.key.toLowerCase())) return;
      if (!tasteDarfWaehlen(ev.target as HTMLElement | null, ev, gesperrt)) return;
      const e = linseFuerTaste(world, ev.key);
      if (!e) return;
      ev.preventDefault();
      onEbene(e);
      setOffen(false);
    };
    window.addEventListener("keydown", taste);
    return () => window.removeEventListener("keydown", taste);
  }, [world, gesperrt, onEbene]);

  const aktiv = KARTENEBENEN.find((e) => e.id === ebene);
  const name = ebene === "netz" ? (netName ?? t("karte.ebene.netz")) : ebeneName(ebene, world);
  const kicker = ebene === "netz" ? t("karte.ebene.netz") : t("karte.linse.kicker");

  return (
    <div ref={huelle} className={`linsen${offen ? " offen" : ""}`} data-ebene={ebene}>
      {offen && (
        <div ref={tafel} id="linsen-tafel" className="linsen-tafel" role="dialog" aria-label={t("karte.linse.waehlen")}>
          <header className="linsen-tafel-kopf">
            <strong>{t("karte.linse.waehlen")}</strong>
            <span>{t("karte.linse.tasten")}</span>
          </header>
          <div className="linsen-gruppen">
            {gruppen.map((g) => (
              <section key={g.id} className="linsen-gruppe" aria-label={g.label}>
                <h3>{g.label}</h3>
                <div className="linsen-kacheln">
                  {g.linsen.map((l) => (
                    <button key={l.id} type="button" className={`linsen-kachel${l.id === ebene ? " on" : ""}`} aria-pressed={l.id === ebene} onClick={() => waehle(l.id)}>
                      <span className="linsen-medaillon" aria-hidden>
                        <Icon name={l.icon} size={22} />
                      </span>
                      <span className="linsen-text">
                        <b>{l.name}</b>
                        <em>{l.kurz}</em>
                      </span>
                      {l.taste && <kbd aria-label={`Taste ${l.taste}`}>{l.taste}</kbd>}
                      <i className="linsen-streifen" style={{ background: l.streifen }} aria-hidden />
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
      <div className="linsen-zeile">
        <button
          ref={knopf}
          type="button"
          className="linsen-knopf"
          aria-haspopup="dialog"
          aria-expanded={offen}
          aria-controls="linsen-tafel"
          title={`${t("karte.linse.waehlen")} (${t("karte.linse.tasten")})`}
          onClick={() => setOffen((o) => !o)}
        >
          <span className="linsen-medaillon gold" aria-hidden>
            <Icon name={aktiv?.icon ?? "karte"} size={22} />
          </span>
          <span className="linsen-knopf-text">
            <span className="linsen-kicker">{kicker}</span>
            <span className="linsen-name">{name}</span>
          </span>
          <span className="linsen-pfeil" aria-hidden>
            <Icon name="chevron" size={16} />
          </span>
        </button>
        {!offen && <LegendeKompakt key={ebene} world={world} ebene={ebene} legende={legende} problemId={problemId} onProblem={onProblem} />}
      </div>
    </div>
  );
}

// Schalter „Effekte: Hoch, Mittel, Aus“: Bewegung auf der Karte (Konzept: KARTE_KONZEPT_2026-10-04.md Abschnitt 5).
// Ein Klick schaltet weiter; die Wahl wird im Browser gemerkt (anim/effekte.ts). Die Systemeinstellung „Bewegung reduzieren“ setzt „Aus“ als Vorgabe.

import { t } from "../i18n";
import { naechsteStufe, setzeEffektstufe } from "./anim/effekte";
import { useEffektstufe } from "./anim/react";
import "./effekte.css";

export function Effekte({ className }: { className?: string }) {
  const stufe = useEffektstufe();
  return (
    <button
      type="button"
      className={`effekte-schalter stufe-${stufe}${className ? ` ${className}` : ""}`}
      onClick={() => setzeEffektstufe(naechsteStufe(stufe))}
      title={t("effekte.hinweis")}
      aria-label={`${t("effekte.titel")}: ${t(`effekte.${stufe}`)}`}
      aria-live="polite"
    >
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
        <path d="M8 1.2l1.5 4.1 4.1 1.5-4.1 1.5L8 12.4 6.5 8.3 2.4 6.8l4.1-1.5z" fill="currentColor" />
        <path d="M12.6 10.4l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" fill="currentColor" opacity=".7" />
      </svg>
      <span className="effekte-text">
        <span className="effekte-zeile">
          <span className="effekte-name">{t("effekte.titel")}</span>
          <span className="effekte-stufe">{t(`effekte.${stufe}`)}</span>
        </span>
        <span className="effekte-kurz">{t("effekte.kurz")}</span>
      </span>
      <i className="effekte-punkte" aria-hidden>
        <b className={stufe === "hoch" || stufe === "mittel" || stufe === "aus" ? "an" : ""} />
        <b className={stufe === "hoch" || stufe === "mittel" ? "an" : ""} />
        <b className={stufe === "hoch" ? "an" : ""} />
      </i>
    </button>
  );
}

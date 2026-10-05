// Legende „Marken auf der Karte“: sechs Zeilen mit Symbol und Satz (Reich-Marken und Ereignis-Marken), klein, ein- und ausblendbar;
// die Wahl wird im Browser gemerkt. Sitzt unten rechts über der Plakette.

import { useState } from "react";
import { t } from "../../i18n";
import { Icon } from "../icons";
import { MarkenForm, type MarkenArt } from "./MarkenForm";
import "./marken.css";

const SCHLUESSEL = "staatsraeson-markenlegende";

function lesen(): boolean {
  try {
    return localStorage.getItem(SCHLUESSEL) !== "zu";
  } catch {
    return true;
  }
}

const ZEILEN: { art: MarkenArt; icon?: "kuppel" | "tempel" | "kran" }[] = [
  { art: "bau" },
  { art: "wunder", icon: "tempel" },
  { art: "erbe", icon: "kuppel" },
  { art: "ereignis" },
  { art: "frist" },
  { art: "krise" },
];

/** Das Zeichen einer Marke in klein, so wie es auf der Karte steht */
export function MarkenZeichen({ art, icon }: { art: MarkenArt; icon?: "kuppel" | "tempel" | "kran" }) {
  return (
    <span className={`mz mz-${art}`} aria-hidden>
      <MarkenForm art={art} fortschritt={art === "bau" ? 0.62 : 0} />
      {icon && <Icon name={icon} size={11} />}
      {(art === "ereignis" || art === "frist" || art === "krise") && <b>!</b>}
    </span>
  );
}

export function MarkenLegende({ className }: { className?: string }) {
  const [offen, setOffen] = useState(lesen);
  const umschalten = () => {
    const n = !offen;
    setOffen(n);
    try {
      localStorage.setItem(SCHLUESSEL, n ? "offen" : "zu");
    } catch {
      /* ohne Speicher gilt die Wahl nur für diese Sitzung */
    }
  };
  return (
    <aside className={`marken-legende${offen ? " offen" : ""}${className ? ` ${className}` : ""}`} aria-label={t("marken.legende.titel")}>
      <button type="button" className="marken-legende-kopf" onClick={umschalten} aria-expanded={offen} title={offen ? t("marken.legende.zu") : t("marken.legende.auf")}>
        <span className="marken-legende-titel">{t("marken.legende.titel")}</span>
        <i aria-hidden>{offen ? "–" : "?"}</i>
      </button>
      {offen && (
        <>
          <ul className="marken-legende-liste">
            {ZEILEN.map((z) => (
              <li key={z.art}>
                <MarkenZeichen art={z.art} {...(z.icon ? { icon: z.icon } : {})} />
                <span>{t(`marken.legende.${z.art}`)}</span>
              </li>
            ))}
          </ul>
          <p className="marken-legende-hinweis">{t("marken.legende.hinweis")}</p>
        </>
      )}
    </aside>
  );
}

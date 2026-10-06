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

/** Zeilen für die Marken der Linsen „Ressourcen“ und „Strategische Orte“ (kleine Punkte und Rauten unter den Städten) */
function FundZeilen({ fund }: { fund: "ressourcen" | "strategie" }) {
  const zeilen =
    fund === "ressourcen"
      ? [
          { k: "fund-punkt fund-r3", farbe: "rgb(184,134,52)", text: t("fundorte.legende.vorkommen") },
        ]
      : [
          { k: "fund-raute fund-r3", farbe: "rgb(150,44,36)", text: t("fundorte.legende.eigen") },
          { k: "fund-raute fund-r3", farbe: "rgb(70,62,96)", text: t("fundorte.legende.fremd") },
        ];
  return (
    <>
      {zeilen.map((z) => (
        <li key={z.text}>
          <span className={`mz fund-muster ${z.k}`} style={{ "--fund": z.farbe } as React.CSSProperties} aria-hidden>
            <i className="fund-zeichen" />
          </span>
          <span>{z.text}</span>
        </li>
      ))}
    </>
  );
}

/** Zeilen für die Kriegslage (kriegsfx.ts): genommen, umkämpft, beim Gegner, besetzt, Vorstoß */
function KriegZeilen() {
  const zeilen: [string, string][] = [
    ["kl-eigen", "krieg.legende.eigen"],
    ["kl-umkaempft", "krieg.legende.umkaempft"],
    ["kl-gegner", "krieg.legende.gegner"],
    ["kl-besetzt", "krieg.legende.besetzt"],
    ["kl-pfeil", "krieg.legende.pfeil"],
  ];
  return (
    <>
      {zeilen.map(([k, key]) => (
        <li key={key}>
          <span className={`mz kl ${k}`} aria-hidden />
          <span>{t(key)}</span>
        </li>
      ))}
    </>
  );
}

export function MarkenLegende({ className, fund, krieg }: { className?: string; fund?: "ressourcen" | "strategie" | undefined; krieg?: boolean }) {
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
            {krieg && <KriegZeilen />}
            {fund && <FundZeilen fund={fund} />}
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

// Internationaler Vergleich als Balken: Wo steht die Türkei, wo stehen andere? Jeder Wert trägt sein Jahr.

import { useState } from "react";
import { VERGLEICH, einordnung, indikator, nf, type Indikator } from "./vergleich";

import { t } from "../i18n";
interface Zeile {
  id: string;
  name: string;
  wert: number;
  jahr?: number;
  art: "land" | "aggregat" | "tuerkei" | "spiel";
}

const WICHTIG = ["DEU", "FRA", "POL", "GRC", "BRA", "MEX", "IND", "RUS", "EGY", "KOR"];

export function VergleichBalken({ code, spiel }: { code: string; spiel?: { wert: number; text: string } | undefined }) {
  const ind: Indikator | undefined = indikator(code);
  const [alle, setAlle] = useState(false);
  if (!ind) return <p className="subtitle">{t("ui.VergleichBalken.fbd262a")}</p>;

  const zeilen: Zeile[] = [{ id: "TUR", name: `Türkei (Weltbank)`, wert: ind.tur.wert, jahr: ind.tur.jahr, art: "tuerkei" }];
  if (spiel) zeilen.push({ id: "SPIEL", name: spiel.text, wert: spiel.wert, art: "spiel" });
  const codes = alle ? Object.values(VERGLEICH.gruppen).flat() : WICHTIG;
  for (const c of codes) {
    const v = ind.laender[c];
    if (v) zeilen.push({ id: c, name: VERGLEICH.laender[c] ?? c, wert: v[0], jahr: v[1], art: "land" });
  }
  for (const [c, v] of Object.entries(ind.aggregate)) {
    if (c === "UMC" && !alle) continue;
    zeilen.push({ id: c, name: VERGLEICH.aggregate[c] ?? c, wert: v[0], jahr: v[1], art: "aggregat" });
  }
  zeilen.push({ id: "MED", name: "Median aller Länder", wert: ind.median, art: "aggregat" });
  zeilen.sort((a, b) => b.wert - a.wert);

  const min = Math.min(0, ...zeilen.map((z) => z.wert));
  const max = Math.max(0, ...zeilen.map((z) => z.wert));
  const spanne = max - min || 1;
  const nullPos = ((0 - min) / spanne) * 100;

  return (
    <div className="vergleich">
      <p className="vergleich-kopf">
        <strong>{ind.name}</strong>
        <span>
          {ind.einheit}
          {ind.besser ? t("ui2.ui.VergleichBalken.1735eee", { p0: ind.besser === "niedriger" ? "niedriger" : "höher" }) : t("ui2.ui.VergleichBalken.d25423d")}
        </span>
      </p>
      <ul className="vergleich-liste" aria-label={t("ui2.ui.VergleichBalken.56ce178", { p0: ind.name })}>
        {zeilen.map((z) => {
          const links = ((Math.min(0, z.wert) - min) / spanne) * 100;
          const breite = (Math.abs(z.wert) / spanne) * 100;
          return (
            <li key={z.id} className={`v-${z.art}`}>
              <span className="v-name">{z.name}</span>
              <span className="v-bar" aria-hidden>
                {min < 0 && <i className="v-null" style={{ left: `${nullPos}%` }} />}
                <b style={{ left: `${links}%`, width: `${Math.max(0.6, breite)}%` }} />
              </span>
              <span className="v-wert">
                {nf(z.wert)}
                {z.jahr ? <em> {z.jahr}</em> : null}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="vergleich-platz">
        <strong>
          {t("ui2.ui.VergleichBalken.4f98dc7", { p0: ind.tur.rang, p1: ind.tur.von })}
        </strong>{" "}
        {t("ui2.ui.VergleichBalken.012046a", { p0: einordnung(ind) })}
      </p>
      <div className="vergleich-fuss">
        <button className="link" onClick={() => setAlle(!alle)}>
          {alle ? t("ui2.ui.VergleichBalken.744d441") : t("ui2.ui.VergleichBalken.7cdd71c")}
        </button>
        <span>{t("ui2.ui.VergleichBalken.c403b4c", { p0: VERGLEICH.abgerufen.slice(0, 4) })}</span>
      </div>
    </div>
  );
}

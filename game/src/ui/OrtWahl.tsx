// „Wo soll es gelten?“: Eine Maßnahme gilt im ganzen Land oder nur an gewählten Orten (Bau vor Ort).
// Eine zusammenhängende Auswahlleiste: ganzes Land · wo es akut ist · Region · einzelne Provinzen.

import { useEffect, useMemo, useRef, useState } from "react";
import { PROVINZEN, REGION_DE } from "../sim/regional";
import { akuteOrte, provinzenText } from "../sim/handeln";
import { REGION_COLORS } from "./atlas/overlay";
import type { World } from "../sim/types";

import { t } from "../i18n";
const REGIONEN = Object.keys(REGION_DE);

function useSchliessen(offen: boolean, zu: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!offen) return;
    const klick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) zu();
    };
    const taste = (e: KeyboardEvent) => e.key === "Escape" && zu();
    document.addEventListener("mousedown", klick);
    document.addEventListener("keydown", taste);
    return () => {
      document.removeEventListener("mousedown", klick);
      document.removeEventListener("keydown", taste);
    };
  }, [offen, zu]);
  return ref;
}

export function OrtWahl({ world, massnahmeId, ort, onChange }: { world: World; massnahmeId: string; ort: number[] | null; onChange: (o: number[] | null) => void }) {
  const [menu, setMenu] = useState<"region" | "provinz" | null>(null);
  const [filter, setFilter] = useState("");
  const zu = () => setMenu(null);
  const ref = useSchliessen(menu !== null, zu);
  const akut = useMemo(() => akuteOrte(world, massnahmeId), [world, massnahmeId, world.net.month]);
  const gewaehlt = new Set(ort ?? []);
  const sichtbar = PROVINZEN.filter((p) => p.name.toLocaleLowerCase("tr").includes(filter.toLocaleLowerCase("tr")));
  const istLand = ort === null;
  const istAkut = !istLand && !!akut && ort!.length === akut.length && akut.every((p) => gewaehlt.has(p));
  const regionAktiv = !istLand && !istAkut ? REGIONEN.find((r) => PROVINZEN.filter((p) => p.region === r).every((p) => gewaehlt.has(p.plaka)) && ort!.length === PROVINZEN.filter((p) => p.region === r).length) : undefined;
  const einzeln = !istLand && !istAkut && !regionAktiv;

  const umschalten = (plaka: number) => {
    const n = new Set(gewaehlt);
    if (n.has(plaka)) n.delete(plaka);
    else n.add(plaka);
    onChange(n.size ? [...n].sort((a, b) => a - b) : null);
  };

  return (
    <div className="ortwahl" ref={ref}>
      <div className="seg" role="group" aria-label={t("ui2.ui.OrtWahl.bc756c1")}>
        <button className={istLand ? "on" : ""} onClick={() => { onChange(null); zu(); }} aria-pressed={istLand}>
          {t("ui2.ui.OrtWahl.5258c51")}
        </button>
        <button className={istAkut ? "on" : ""} disabled={!akut} onClick={() => { onChange(akut); zu(); }} aria-pressed={istAkut} title={akut ? t("ui2.ui.OrtWahl.f03b3fc") : t("ui2.ui.OrtWahl.17ee897")}>
          {t("ui2.ui.OrtWahl.9053777")}{akut ? <b>{akut.length}</b> : null}
        </button>
        <button className={regionAktiv || menu === "region" ? "on" : ""} onClick={() => setMenu(menu === "region" ? null : "region")} aria-expanded={menu === "region"} aria-haspopup="listbox">
          {regionAktiv ? (REGION_DE[regionAktiv] ?? regionAktiv).split(" (")[0] : t("ui2.ui.OrtWahl.0f21717")} <span className="pf" aria-hidden>▾</span>
        </button>
        <button className={einzeln || menu === "provinz" ? "on" : ""} onClick={() => setMenu(menu === "provinz" ? null : "provinz")} aria-expanded={menu === "provinz"} aria-haspopup="dialog">
          {einzeln ? `${ort!.length} ${ort!.length === 1 ? "Provinz" : "Provinzen"}` : t("ui2.ui.OrtWahl.56d7381")} <span className="pf" aria-hidden>▾</span>
        </button>
      </div>

      {menu === "region" && (
        <div className="pop" role="listbox" aria-label={t("ui.OrtWahl.7cd7b6b")}>
          {REGIONEN.map((r) => {
            const mitglieder = PROVINZEN.filter((p) => p.region === r);
            const einwohner = mitglieder.reduce((s, p) => s + p.bevoelkerung, 0);
            return (
              <button
                key={r}
                role="option"
                aria-selected={regionAktiv === r}
                className={regionAktiv === r ? "on" : ""}
                onClick={() => {
                  onChange(mitglieder.map((p) => p.plaka));
                  zu();
                }}
              >
                <i style={{ background: REGION_COLORS[r] }} />
                <span className="pop-name">{REGION_DE[r]}</span>
                <span className="pop-meta">
                  {t("ui2.ui.OrtWahl.e328e2f", { p0: mitglieder.length, p1: (einwohner / 1_000_000).toLocaleString("de-DE", { maximumFractionDigits: 1 }) })}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {menu === "provinz" && (
        <div className="pop pop-provinz" role="dialog" aria-label={t("ui.OrtWahl.916fd5a")}>
          <input className="pop-suche" type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t("ui.OrtWahl.8431840")} aria-label={t("ui.OrtWahl.889df81")} autoFocus />
          <ul>
            {sichtbar.map((p) => (
              <li key={p.plaka}>
                <label className={gewaehlt.has(p.plaka) ? "on" : ""}>
                  <input type="checkbox" checked={gewaehlt.has(p.plaka)} onChange={() => umschalten(p.plaka)} />
                  <span>{p.name}</span>
                  <em>{t("ui2.ui.OrtWahl.008849e", { p0: (p.bevoelkerung / 1000).toLocaleString("de-DE", { maximumFractionDigits: 0 }) })}</em>
                </label>
              </li>
            ))}
          </ul>
          <div className="pop-fuss">
            <span>{t("ui2.ui.OrtWahl.7f5a6ad", { p0: gewaehlt.size })}</span>
            <button className="link" onClick={() => onChange(null)}>
              {t("ui.OrtWahl.e65c673")}
            </button>
            <button className="link" onClick={zu}>
              {t("ui2.ui.OrtWahl.708ad54")}
            </button>
          </div>
        </div>
      )}

      <p className="ort-text">{istLand ? t("ui2.ui.OrtWahl.bd7c4cf") : t("ui2.ui.OrtWahl.ba24c71", { p0: provinzenText(ort) })}</p>
      {!istLand && ort!.length <= 8 && (
        <ul className="ort-chips">
          {ort!.map((p) => (
            <li key={p}>
              <button onClick={() => umschalten(p)} title={t("ui.OrtWahl.5ef06de")}>
                {PROVINZEN[p - 1]!.name} <span aria-hidden>✕</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

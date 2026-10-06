// Die Wirtschaftsakte, die Referenz des Akten-Gerüsts (ui/akte/): Lage, Instrumente (Zentralbank, Haushalt, Devisen), Verlauf, Personen.
// Jede Kennzahl führt zu einer Entscheidung, jede Entscheidung zeigt ihre Folgen.

import { useState } from "react";
import { aktuelleLocale, t } from "../../i18n";
import type { World } from "../../sim/types";
import type { Handlung } from "../../sim/wirtschaft-kennzahlen";
import { Akte, VorgaengePlatz, type AktenReiterId, type Kernwert } from "../akte/Akte";
import { VerlaufsDiagramm, type VerlaufsReihe } from "../akte/Kennzahl";
import { BerichtListe, PersonenListe, berichteFuer } from "../akte/Bausteine";
import { Lage } from "./Lage";
import { Zentralbank } from "./Zentralbank";
import { Haushalt } from "./Haushalt";
import { Inventar } from "../gueter/Inventar";
import "../politik/design.css";
import "./wirtschaft.css";

/** Ältere Einstiege (Stage, Ereignisfenster, Mentorin) sprechen noch von diesen drei Zielen. */
export type Reiter = "lage" | "zentralbank" | "haushalt";
type Instrument = "zentralbank" | "haushalt" | "inventar";
type ZbAbschnitt = "sitzung" | "gouverneur" | "stufe" | "devisen";

const nf = (x: number, d = 1) => x.toLocaleString(aktuelleLocale(), { minimumFractionDigits: d, maximumFractionDigits: d });

/** Themen des Politiknetzes, deren Wirkungsberichte in diese Akte gehören. */
export const WIRTSCHAFT_THEMEN = ["wirtschaft", "haushalt", "arbeit", "energie"] as const;

function reihen(w: World): VerlaufsReihe[] {
  const h = w.history.slice(-36);
  const monate = h.map((s) => s.month);
  const r = (id: string, einheit: string, f: (s: (typeof h)[number]) => number | undefined, stellen = 1): VerlaufsReihe => ({
    id,
    name: t(`akte.wirtschaft.reihe.${id}`),
    einheit,
    stellen,
    monate,
    werte: h.map((s) => f(s) ?? NaN).filter((x) => Number.isFinite(x)),
  });
  return [
    r("inflation", "%", (s) => s.inflation),
    r("wachstum", "%", (s) => s.growth),
    r("arbeitslosigkeit", "%", (s) => s.unemployment),
    r("leitzins", "%", (s) => s.policyRate),
    r("lira", "TRY", (s) => s.usdTry),
    r("schulden", "%", (s) => s.debtRatio),
  ];
}

export function kernwerteWirtschaft(w: World): Kernwert[] {
  const h = w.history.slice(-12);
  return [
    { label: t("akte.wirtschaft.kern.inflation"), wert: `${nf(w.published.inflation.value)} %`, verlauf: h.map((s) => s.inflation), ton: w.published.inflation.value < 10 ? "gut" : w.published.inflation.value < 25 ? "mittel" : "schlecht" },
    { label: t("akte.wirtschaft.kern.wachstum"), wert: `${nf(w.economy.growth)} %`, verlauf: h.map((s) => s.growth), ton: w.economy.growth >= 3 ? "gut" : w.economy.growth >= 0 ? "mittel" : "schlecht" },
    { label: t("akte.wirtschaft.kern.lira"), wert: nf(w.economy.usdTry), verlauf: h.map((s) => s.usdTry) },
  ];
}

export function WirtschaftAkte({ world, start = "lage", zbAbschnitt, posten, onGeaendert }: { world: World; start?: Reiter; zbAbschnitt?: ZbAbschnitt; posten?: string; onGeaendert?: (() => void) | undefined }) {
  const [reiter, setReiter] = useState<AktenReiterId>(start === "lage" ? "lage" : "instrumente");
  const [instrument, setInstrument] = useState<Instrument>(start === "haushalt" ? "haushalt" : "zentralbank");
  const [abschnitt, setAbschnitt] = useState<ZbAbschnitt | undefined>(zbAbschnitt);
  const [wahl, setWahl] = useState(posten);
  const [, setVersion] = useState(0);
  const geaendert = () => {
    setVersion((v) => v + 1);
    onGeaendert?.();
  };

  function handlung(h: Handlung) {
    setReiter("instrumente");
    setInstrument(h.ziel === "haushalt" ? "haushalt" : "zentralbank");
    setAbschnitt(h.abschnitt);
    setWahl(h.posten);
  }

  const instrumente = () => (
    <div className="ak-instrumente">
      <nav className="ak-unterreiter" role="tablist" aria-label={t("akte.wirtschaft.instrumente")}>
        {(["zentralbank", "haushalt", "inventar"] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={instrument === id}
            className={instrument === id ? "on" : ""}
            onClick={() => {
              setInstrument(id);
              if (id === "zentralbank") setAbschnitt(undefined);
              else if (id === "haushalt") setWahl(undefined);
            }}
          >
            <b>{t(`akte.wirtschaft.instrument.${id}`)}</b>
            <span>{t(`akte.wirtschaft.instrument.${id}Text`)}</span>
          </button>
        ))}
      </nav>
      {instrument === "inventar" ? <Inventar world={world} geaendert={geaendert} /> : instrument === "zentralbank" ? <Zentralbank world={world} geaendert={geaendert} abschnitt={abschnitt} /> : <Haushalt world={world} geaendert={geaendert} posten={wahl} />}
    </div>
  );

  return (
    <div className="wi-akte">
      <Akte
        bereich={"wirtschaft"}
        zweck={t("akte.wirtschaft.zweck")}
        kernwerte={kernwerteWirtschaft(world)}
        aktiv={reiter}
        onReiter={setReiter}
        reiter={[
          { id: "lage", text: t("akte.wirtschaft.lageText"), inhalt: () => <Lage world={world} onHandlung={handlung} /> },
          { id: "instrumente", text: t("akte.wirtschaft.instrumenteText"), inhalt: instrumente },
          {
            id: "verlauf",
            text: t("akte.wirtschaft.verlaufText"),
            inhalt: () => (
              <div className="ak-verlauf">
                <div className="ak-diagramme">
                  {reihen(world).map((r) => (
                    <VerlaufsDiagramm key={r.id} reihe={r} />
                  ))}
                </div>
                <h3 className="ak-abschnitt">{t("akte.verlauf.berichte")}</h3>
                <BerichtListe berichte={berichteFuer(world, WIRTSCHAFT_THEMEN)} />
              </div>
            ),
          },
          { id: "personen", text: t("akte.wirtschaft.personenText"), inhalt: () => <PersonenListe w={world} aemter={["finanzen", "wirtschaft", "zentralbank"]} /> },
          { id: "vorgaenge", inhalt: () => <VorgaengePlatz w={world} onGeaendert={onGeaendert} /> },
        ]}
      />
    </div>
  );
}

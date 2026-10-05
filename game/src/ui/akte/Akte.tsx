// Das gemeinsame Akten-Gerüst (VISION_IM_DETAIL, Abschnitt 0.2): Jede Akte hat denselben Aufbau.
//   Kopf: Zweckzeile und drei Kernwerte
//   Reiter: Lage (Kennzahlen mit Verlauf und Prognose), Instrumente (Handlungen mit Preis und Vorschau),
//           Verlauf (Diagramme und Wirkungsberichte des Bereichs), Personen (zuständige Figuren mit Gesicht und Haltung)
// Die Wirtschaftsakte ist die Referenz; die übrigen Akten folgen demselben Muster.

import { useState, type ReactNode } from "react";
import { t } from "../../i18n";
import { Funke } from "./Kennzahl";
import "./akte.css";

/** „vorgaenge“: Platz für politische Vorhaben vom Versprechen bis zur Rechenschaft (baut ein späterer Strang). */
export type AktenReiterId = "lage" | "instrumente" | "verlauf" | "personen" | "vorgaenge";

export interface AktenReiter {
  id: AktenReiterId;
  /** Kurzer Satz unter dem Reiternamen */
  text?: string;
  inhalt: () => ReactNode;
}

export interface Kernwert {
  label: string;
  wert: string;
  /** Verlauf für die kleine Linie (älteste zuerst) */
  verlauf?: number[];
  /** Ton des Wertes */
  ton?: "gut" | "mittel" | "schlecht";
  hinweis?: string;
}

export interface AkteProps {
  /** Kennung des Bereichs (für Klassen und Tests) */
  bereich: string;
  zweck: string;
  kernwerte: Kernwert[];
  reiter: AktenReiter[];
  start?: AktenReiterId;
  /** Gesteuerte Auswahl (optional) */
  aktiv?: AktenReiterId;
  onReiter?: (id: AktenReiterId) => void;
}

/** Platzhalter des Reiters „Vorgänge“, bis der Vorgang gebaut ist. */
export function VorgaengePlatz() {
  return <p className="ak-leer">{t("akte.vorgaenge.platzhalter")}</p>;
}

export function Akte({ bereich, zweck, kernwerte, reiter, start, aktiv, onReiter }: AkteProps) {
  const [eigen, setEigen] = useState<AktenReiterId>(start ?? reiter[0]?.id ?? "lage");
  const gewaehlt = aktiv ?? eigen;
  const zeige = reiter.find((r) => r.id === gewaehlt) ?? reiter[0];
  const waehle = (id: AktenReiterId) => {
    setEigen(id);
    onReiter?.(id);
  };
  return (
    <div className={`ak-akte ak-${bereich}`} data-bereich={bereich}>
      <header className="ak-kopf">
        <p className="ak-zweck">{zweck}</p>
        <div className="ak-kernwerte">
          {kernwerte.slice(0, 3).map((k) => (
            <div key={k.label} className={`ak-kernwert${k.ton ? ` ${k.ton}` : ""}`} title={k.hinweis}>
              <span className="ak-kernwert-label">{k.label}</span>
              <strong>{k.wert}</strong>
              {k.verlauf && k.verlauf.length > 1 && <Funke werte={k.verlauf} breite={96} hoehe={22} />}
            </div>
          ))}
        </div>
      </header>
      <nav className="ak-reiter" role="tablist" aria-label={t("akte.reiter.aria")}>
        {reiter.map((r) => (
          <button key={r.id} type="button" role="tab" aria-selected={zeige?.id === r.id} className={zeige?.id === r.id ? "on" : ""} onClick={() => waehle(r.id)}>
            <b>{t(`akte.reiter.${r.id}`)}</b>
            {r.text && <span>{r.text}</span>}
          </button>
        ))}
      </nav>
      <div className="ak-inhalt" role="tabpanel">
        {zeige?.inhalt()}
      </div>
    </div>
  );
}

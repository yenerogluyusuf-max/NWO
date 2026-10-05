// Gesicht der Spielfigur einstellen: Geschlecht, Alter, Frisur, Gesichtsform, Brille, Bart oder Kopftuch, oder würfeln.
// Das Porträt selbst steht im Kopf des Buchs und folgt jeder Änderung sofort.

import type { Aussehen } from "../../sim/prolog";
import { t } from "../../i18n";
import { ALTER_BIS, ALTER_VON, BAERTE, FRISUREN, GESICHTSFORMEN } from "./figur";

export interface FigurenwahlProps {
  wert: Aussehen;
  onChange: (a: Aussehen) => void;
  onWuerfeln: () => void;
}

/** Blättern in einer Reihe von Möglichkeiten: ‹ Name › */
function Blaettern({ name, wert, von, onChange }: { name: string; wert: number; von: number; onChange: (n: number) => void }) {
  return (
    <div className="fw-blaettern" role="group" aria-label={name}>
      <button type="button" onClick={() => onChange((wert + von - 1) % von)} aria-label={`${name}: ${t("prolog.aussehen.zurueck")}`}>
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden>
          <path d="M8 1L3 6l5 5" />
        </svg>
      </button>
      <span className="fw-nr">
        {wert + 1} / {von}
      </span>
      <button type="button" onClick={() => onChange((wert + 1) % von)} aria-label={`${name}: ${t("prolog.aussehen.vor")}`}>
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden>
          <path d="M4 1l5 5-5 5" />
        </svg>
      </button>
    </div>
  );
}

export function Figurenwahl({ wert, onChange, onWuerfeln }: FigurenwahlProps) {
  const setze = (teil: Partial<Aussehen>) => onChange({ ...wert, ...teil });
  const maennlich = wert.geschlecht === "m";
  return (
    <fieldset className="figurenwahl">
      <legend>{t("prolog.aussehen.titel")}</legend>
      <div className="fw-zeile">
        <span className="fw-name" id="fw-geschlecht">
          {t("prolog.aussehen.geschlecht")}
        </span>
        <div className="fw-schalter" role="radiogroup" aria-labelledby="fw-geschlecht">
          {(["f", "m"] as const).map((g) => (
            <button key={g} type="button" role="radio" aria-checked={wert.geschlecht === g} className={wert.geschlecht === g ? "on" : ""} onClick={() => setze({ geschlecht: g, ...(g === "m" ? { kopftuch: false } : { bart: "keiner" as const }) })}>
              {t(`prolog.aussehen.${g}`)}
            </button>
          ))}
        </div>
      </div>
      <div className="fw-zeile">
        <label className="fw-name" htmlFor="fw-alter">
          {t("prolog.aussehen.alter")}
        </label>
        <div className="fw-regler">
          <input id="fw-alter" type="range" min={ALTER_VON} max={ALTER_BIS} step={1} value={wert.alter} onChange={(e) => setze({ alter: Number(e.target.value) })} aria-valuetext={t("prolog.aussehen.alter_wert", { n: wert.alter })} />
          <span className="fw-wert">{t("prolog.aussehen.alter_wert", { n: wert.alter })}</span>
        </div>
      </div>
      <div className="fw-zeile">
        <span className="fw-name">{t("prolog.aussehen.frisur")}</span>
        <Blaettern name={t("prolog.aussehen.frisur")} wert={wert.haare % FRISUREN} von={FRISUREN} onChange={(n) => setze({ haare: n })} />
      </div>
      <div className="fw-zeile">
        <span className="fw-name">{t("prolog.aussehen.gesicht")}</span>
        <Blaettern name={t("prolog.aussehen.gesicht")} wert={wert.gesicht % GESICHTSFORMEN} von={GESICHTSFORMEN} onChange={(n) => setze({ gesicht: n })} />
      </div>
      <div className="fw-zeile">
        <span className="fw-name">{t("prolog.aussehen.brille")}</span>
        <button type="button" className={`fw-umschalter${wert.brille ? " on" : ""}`} role="switch" aria-checked={wert.brille} onClick={() => setze({ brille: !wert.brille })}>
          <i aria-hidden />
          <span>{t("prolog.aussehen.brille")}</span>
        </button>
      </div>
      {maennlich ? (
        <div className="fw-zeile">
          <label className="fw-name" htmlFor="fw-bart">
            {t("prolog.aussehen.bart")}
          </label>
          <select id="fw-bart" value={wert.bart} onChange={(e) => setze({ bart: e.target.value as Aussehen["bart"] })}>
            {BAERTE.map((b) => (
              <option key={b} value={b}>
                {t(`prolog.aussehen.bart.${b}`)}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="fw-zeile">
          <span className="fw-name">{t("prolog.aussehen.kopftuch")}</span>
          <button type="button" className={`fw-umschalter${wert.kopftuch ? " on" : ""}`} role="switch" aria-checked={wert.kopftuch} onClick={() => setze({ kopftuch: !wert.kopftuch })}>
            <i aria-hidden />
            <span>{t("prolog.aussehen.kopftuch")}</span>
          </button>
        </div>
      )}
      <div className="fw-fuss">
        <button type="button" className="wuerfel" onClick={onWuerfeln}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <rect x="4" y="4" width="16" height="16" rx="3" />
            <circle cx="9" cy="9" r="1.200" />
            <circle cx="15" cy="15" r="1.200" />
            <circle cx="15" cy="9" r="1.200" />
            <circle cx="9" cy="15" r="1.200" />
          </svg>
          {t("prolog.aussehen.wuerfeln")}
        </button>
        <span className="fw-hinweis">{t("prolog.aussehen.hinweis")}</span>
      </div>
    </fieldset>
  );
}

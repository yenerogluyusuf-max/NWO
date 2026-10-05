// Die einmalige Frage in älteren Spielständen: Die Parlamentswahl lief ohne neue Sitzverteilung. Nachträglich auswerten oder das Parlament lassen, wie es ist?
// Reine Darstellung mit klaren Rückrufen; die Simulation steht in sim/wahl.ts (parlamentNachtragFrage, parlamentNachtragAntwort).
// Einhängen (ui/Stage.tsx): vor Wahlabend, Umbildung und Zielwahl. „Ja“ sichert vorher den Stand als Rücksicherung (ui/speicher.ts: sichereVorEingriff).

import { Corners, Flourish } from "../art/Ornament";
import { t } from "../../i18n";

export interface ParlamentNachtragProps {
  /** Datum der Wahl, um die es geht (ISO) */
  datum: string;
  /** Sitze des Lagers heute (zur Einordnung) */
  lagerSitze: number;
  onJa: () => void;
  onNein: () => void;
  /** Während die Sicherung und die Auswertung laufen, sperrt die Ansicht beide Knöpfe */
  beschaeftigt?: boolean;
}

export function ParlamentNachtrag({ datum, lagerSitze, onJa, onNein, beschaeftigt = false }: ParlamentNachtragProps) {
  return (
    <div className="event-layer" role="dialog" aria-modal="true" aria-labelledby="pn-titel">
      <article className="frame event-window pn">
        <Corners />
        <div className="event-body">
          <p className="kicker">{t("wahl.nachtrag.frage.kicker")}</p>
          <h2 id="pn-titel">{t("wahl.nachtrag.frage.titel")}</h2>
          <Flourish width={180} />
          <p className="event-text">{t("wahl.nachtrag.frage.text", { datum })}</p>
          <p className="pn-heute">{t("wahl.nachtrag.frage.heute", { sitze: lagerSitze })}</p>
          <div className="pn-antworten">
            <button type="button" className="brass-button" disabled={beschaeftigt} onClick={onJa}>
              <strong>{t("wahl.nachtrag.frage.ja")}</strong>
              <span>{t("wahl.nachtrag.frage.ja_beschr")}</span>
            </button>
            <button type="button" className="leather-button" disabled={beschaeftigt} onClick={onNein}>
              <strong>{t("wahl.nachtrag.frage.nein")}</strong>
              <span>{t("wahl.nachtrag.frage.nein_beschr")}</span>
            </button>
          </div>
          <p className="pn-sicherung">{t("wahl.nachtrag.frage.sicherung")}</p>
        </div>
      </article>
    </div>
  );
}

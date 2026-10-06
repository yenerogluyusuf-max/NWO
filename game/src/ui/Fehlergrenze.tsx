// Fehlergrenze: Ein Fehler beim Zeichnen einer Ansicht darf nie das ganze Spiel leeren (React entfernt sonst den gesamten Baum,
// im Fenster bleibt nur der dunkle Hintergrund). Die Grenze zeigt stattdessen, was schiefging, und lässt den Rest weiterlaufen.
//   - Je Akte (`onZu`): Nur die Akte zeigt den Fehler; Leiste, Karte und Zeit bleiben bedienbar.
//   - Für das ganze Spiel (`gross`): letzte Rettung mit „Neu laden“ — der Spielstand ist gesichert.

import { Component, type ErrorInfo, type ReactNode } from "react";
import "./fehlergrenze.css";

import { t } from "../i18n";
interface Props {
  children: ReactNode;
  /** Wie die Ansicht heißt, in der Meldung */
  titel?: string;
  /** Schließt die Akte (nur bei Akten) */
  onZu?: () => void;
  /** Das ganze Spiel: zeigt den großen Rettungsschirm */
  gross?: boolean;
  /** Ändert sich dieser Wert, versucht es die Grenze erneut (z. B. die geöffnete Akte) */
  zuruecksetzen?: unknown;
}

interface State {
  fehler: Error | null;
  stapel: string;
}

export class Fehlergrenze extends Component<Props, State> {
  state: State = { fehler: null, stapel: "" };

  static getDerivedStateFromError(fehler: Error): Partial<State> {
    return { fehler };
  }

  componentDidCatch(fehler: Error, info: ErrorInfo): void {
    const stapel = (info.componentStack ?? "").split("\n").slice(0, 8).join("\n").trim();
    this.setState({ stapel });
    // Der Konsolenfehler landet in der Protokolldatei der App (~/Library/Logs/Staatsräson/spiel.log)
    console.error(`Anzeigefehler in „${this.props.titel ?? "Ansicht"}“: ${fehler.message}\n${stapel}`);
  }

  componentDidUpdate(vorher: Props): void {
    if (this.state.fehler && vorher.zuruecksetzen !== this.props.zuruecksetzen) this.setState({ fehler: null, stapel: "" });
  }

  render(): ReactNode {
    const { fehler, stapel } = this.state;
    if (!fehler) return this.props.children;
    const { titel, onZu, gross } = this.props;
    return (
      <div className={`fehlergrenze${gross ? " gross" : ""}`} role="alert">
        <div className="fehlergrenze-karte">
          <p className="fehlergrenze-kicker">{gross ? t("ui2.ui.Fehlergrenze.32d60c5") : t("ui2.ui.Fehlergrenze.1e5a3b9")}</p>
          <h3>{titel ?? t("ui2.ui.Fehlergrenze.5c38879")}</h3>
          <p className="fehlergrenze-text">
            {gross ? t("ui2.ui.Fehlergrenze.3fa4f76") : t("ui2.ui.Fehlergrenze.50378fd")}
            <code>{fehler.message}</code>
          </p>
          {stapel && (
            <details>
              <summary>{t("ui2.ui.Fehlergrenze.7cdeb23")}</summary>
              <pre>{stapel}</pre>
            </details>
          )}
          <div className="fehlergrenze-knoepfe">
            <button type="button" className="brass-button" onClick={() => this.setState({ fehler: null, stapel: "" })}>
              {t("ui2.ui.Fehlergrenze.f6f5ca2")}
            </button>
            {onZu && (
              <button type="button" className="leather-button" onClick={onZu}>
                {t("ui.Fehlergrenze.220c6d7")}
              </button>
            )}
            {gross && (
              <button type="button" className="leather-button" onClick={() => window.location.reload()}>
                {t("ui2.ui.Fehlergrenze.6903d3e")}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}

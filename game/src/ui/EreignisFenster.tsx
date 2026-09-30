// Ereignisfenster mit Antworten: Bild, Überschrift, Text, die Begründung als Randnotiz und Antworten mit ihrem Preis.
// Wer „Später entscheiden“ wählt, lässt das Ereignis offen; die Frist läuft aber weiter.

import { Vignette } from "./art/Vignette";
import { Corners, Flourish } from "./art/Ornament";
import { Icon } from "./icons";
import type { EreignisAnsicht } from "../sim/ereignisse";

export function EreignisFenster({
  ansicht,
  datum,
  kapital,
  onWaehle,
  onSpaeter,
  onMassnahme,
  naechsteGutschrift,
}: {
  ansicht: EreignisAnsicht;
  datum: string;
  kapital: number;
  onWaehle: (optionId: string) => void;
  onSpaeter: () => void;
  /** Öffnet die Maßnahme, die die Ursache regelt */
  onMassnahme?: (m: { id: string; ziel?: number }) => void;
  naechsteGutschrift?: string;
}) {
  return (
    <div className="event-layer" role="dialog" aria-modal="true" aria-labelledby={`ev-${ansicht.id}`}>
      <article className="frame event-window event-wide">
        <Corners />
        <div className="event-picture">
          <Vignette scene={ansicht.szene} />
          <span className="event-date">{datum}</span>
        </div>
        <div className="event-body">
          <div className="event-head">
            <h2 id={`ev-${ansicht.id}`}>{ansicht.titel}</h2>
            <span className="kapital-stand" title="Ihr Politisches Kapital">
              <Icon name="siegel" size={18} /> {Math.floor(kapital)}
            </span>
          </div>
          <Flourish width={180} />
          <div className="event-text">
            {ansicht.text.map((t, i) => (
              <p key={i}>{t}</p>
            ))}
          </div>
          <p className="event-why">{ansicht.warum}</p>
          <ul className="event-options" aria-label="Antworten">
            {ansicht.optionen.map((o) => (
              <li key={o.id}>
                <button className="event-option" disabled={!o.bezahlbar} onClick={() => onWaehle(o.id)} title={o.bezahlbar ? undefined : "Dafür fehlt Politisches Kapital"}>
                  <span className="opt-main">
                    <strong>{o.label}</strong>
                    <span className="opt-desc">{o.beschreibung}</span>
                    {o.vorschau.length > 0 && (
                      <span className="opt-wirkung" aria-label="Was das bewirkt">
                        {o.vorschau.map((z) => (
                          <span key={z}>{z}</span>
                        ))}
                      </span>
                    )}
                  </span>
                  {(() => {
                    const preis = o.anzeigePk ?? o.pk;
                    const pump = preis > kapital && o.bezahlbar;
                    return (
                      <span className={`opt-cost${preis === 0 ? " frei" : ""}${pump ? " pump" : ""}`} title={pump ? "Mehr, als Sie haben: Sie gehen ins Minus (bis 20) und zahlen mit Legitimität und Vertrauen, bis das Konto ausgeglichen ist." : undefined}>
                        {preis === 0 ? "kostenlos" : `${preis} Kapital`}
                        {pump && <small> auf Pump</small>}
                      </span>
                    );
                  })()}
                </button>
              </li>
            ))}
          </ul>
          {!ansicht.optionen.some((o) => o.bezahlbar && o.pk > 0) && ansicht.optionen.some((o) => o.pk > 0) && (
            <p className="event-knapp">
              Sie haben {Math.floor(kapital)} Kapital; die meisten Antworten kosten mehr und gehen nur noch über die Überziehung (bis 20 im Minus, gegen Legitimität und Vertrauen).{naechsteGutschrift ? ` Die nächste Gutschrift kommt am ${naechsteGutschrift}.` : ""}
            </p>
          )}
          {ansicht.massnahmen.length > 0 && onMassnahme && (
            <div className="event-ursache">
              <span>{ansicht.massnahmenText}</span>
              {ansicht.massnahmen.map((m) => (
                <button key={m.id} className="aktion-knopf" onClick={() => onMassnahme({ id: m.id, ...(m.ziel !== undefined ? { ziel: m.ziel } : {}) })}>
                  {m.name}
                </button>
              ))}
            </div>
          )}
          <div className="event-foot">
            <span>{ansicht.tageBisFrist > 0 ? `Ohne Entscheidung greift in ${ansicht.tageBisFrist} ${ansicht.tageBisFrist === 1 ? "Tag" : "Tagen"} die Standardfolge.` : "Die Frist läuft heute ab."}</span>
            <button className="link" onClick={onSpaeter}>
              Später entscheiden
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

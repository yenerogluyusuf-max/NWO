// Ereignisfenster mit Antworten: Szene zum Thema, die sprechende Person mit Gesicht und Zitat, „Worum es geht“ mit Kennzahlen,
// Antworten als Karten mit Preis und sichtbaren Folgen, Sprung in die passende Akte und die Frist als Balken.
// Wer „Später entscheiden“ wählt, lässt das Ereignis offen; die Frist läuft aber weiter.

import { Corners } from "./art/Ornament";
import { Icon } from "./icons";
import { Portraet as PersonPortraet } from "./personen/bausteine";
import { EreignisSzene } from "./ereignis/Szenen";
import { akteFuer, kennzahlenFuer, richtungVon, sprecherFuer, themaFuer, zitatAus, type AktenZiel, type Kennzahl } from "./ereignis/kontext";
import { t } from "../i18n";
import type { EreignisAnsicht } from "../sim/ereignisse";
import type { World } from "../sim/types";
import "./ereignis.css";

function Verlauf({ werte }: { werte: number[] }) {
  const min = Math.min(...werte);
  const max = Math.max(...werte);
  const spanne = max - min || 1;
  const punkte = werte.map((v, i) => `${(i / (werte.length - 1)) * 100},${28 - ((v - min) / spanne) * 24}`).join(" ");
  return (
    <svg className="ev2-verlauf" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden>
      <polyline points={punkte} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function KennzahlKarte({ k }: { k: Kennzahl }) {
  return (
    <div className="ev2-kz">
      <span className="ev2-kz-label">{k.label}</span>
      <strong>{k.wert}</strong>
      {k.verlauf && <Verlauf werte={k.verlauf} />}
    </div>
  );
}

export function EreignisFenster({
  ansicht,
  datum,
  kapital,
  onWaehle,
  onSpaeter,
  onMassnahme,
  naechsteGutschrift,
  world,
  onAkte,
}: {
  ansicht: EreignisAnsicht;
  datum: string;
  kapital: number;
  onWaehle: (optionId: string) => void;
  onSpaeter: () => void;
  /** Öffnet die Maßnahme, die die Ursache regelt */
  onMassnahme?: (m: { id: string; ziel?: number }) => void;
  naechsteGutschrift?: string;
  /** Spielstand für Sprecher und Kennzahlen; ohne ihn zeigt das Fenster nur Text und Antworten */
  world?: World;
  /** Öffnet die passende Akte, ohne das Ereignis zu entscheiden */
  onAkte?: (ziel: AktenZiel) => void;
}) {
  const thema = themaFuer(ansicht);
  const sprecher = world ? sprecherFuer(world, ansicht) : null;
  const kennzahlen = world ? kennzahlenFuer(world, thema) : [];
  const akte = akteFuer(thema);
  const { zitat, rest } = zitatAus(ansicht.text);
  // Fristbalken: voll bei 30 und mehr Tagen, leer am letzten Tag
  const fristAnteil = Math.max(0, Math.min(1, ansicht.tageBisFrist / 30));
  const knapp = !ansicht.optionen.some((o) => o.bezahlbar && o.pk > 0) && ansicht.optionen.some((o) => o.pk > 0);
  const inflation = world ? world.published.inflation.value.toLocaleString("de-DE", { maximumFractionDigits: 1 }) : undefined;

  return (
    <div className="event-layer" role="dialog" aria-modal="true" aria-labelledby={`ev-${ansicht.id}`}>
      <article className="frame event-window ev2">
        <Corners />
        <header className="ev2-kopf">
          <EreignisSzene thema={thema} />
          <span className="event-date">{datum}</span>
          <span className="kapital-stand ev2-kapital" title={t("ereignis.kapitalTitel")}>
            <Icon name="siegel" size={18} /> {Math.floor(kapital)}
          </span>
        </header>

        <div className="ev2-koerper">
          {sprecher && world && (
            <aside className="ev2-sprecher">
              <PersonPortraet w={world} f={sprecher.figur} size={148} />
              <div className="ev2-wer">
                <strong>{sprecher.figur.name}</strong>
                <span>{sprecher.figur.rolle}</span>
              </div>
              {sprecher.rat && (
                <div className={`ev2-rat${sprecher.rat.offen ? "" : " verhalten"}`}>
                  <span className="ev2-rat-kopf">{sprecher.rat.offen ? t("ereignis.rat") : t("ereignis.ratVerhalten")}</span>
                  {sprecher.rat.zeilen.slice(0, 2).map((z, i) => (
                    <p key={i}>{z}</p>
                  ))}
                </div>
              )}
            </aside>
          )}

          <div className="ev2-haupt">
            <h2 id={`ev-${ansicht.id}`}>{ansicht.titel}</h2>
            <blockquote className="ev2-zitat">{zitat}</blockquote>
            {rest.length > 0 && (
              <details className="ev2-mehr">
                <summary>{t("ereignis.mehr")}</summary>
                {rest.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                <p className="ev2-warum">{ansicht.warum}</p>
              </details>
            )}
            {rest.length === 0 && <p className="ev2-warum">{ansicht.warum}</p>}

            {kennzahlen.length > 0 && (
              <section className="ev2-worum" aria-label={t("ereignis.worum")}>
                <h3>{t("ereignis.worum")}</h3>
                <div className="ev2-kz-reihe">
                  {kennzahlen.map((k) => (
                    <KennzahlKarte key={k.id} k={k} />
                  ))}
                </div>
              </section>
            )}

            <ul className="ev2-optionen" aria-label={t("ereignis.antworten")}>
              {ansicht.optionen.map((o) => {
                const preis = o.anzeigePk ?? o.pk;
                const pump = preis > kapital && o.bezahlbar;
                const zusatz =
                  ansicht.vorlage === "haushaltsjahr" && o.id === "fortschreiben" && inflation
                    ? t("ereignis.haushalt.fortschreiben", { inflation })
                    : ansicht.vorlage === "haushaltsjahr" && o.id === "entwurf"
                      ? t("ereignis.haushalt.entwurf")
                      : undefined;
                return (
                  <li key={o.id}>
                    <button className="ev2-option" disabled={!o.bezahlbar} onClick={() => onWaehle(o.id)} title={o.bezahlbar ? undefined : t("ereignis.fehltKapital")}>
                      <span className="ev2-option-kopf">
                        <strong>{o.label}</strong>
                        <span className={`ev2-preis${preis === 0 ? " frei" : ""}${pump ? " pump" : ""}`} title={pump ? t("ereignis.pumpTitel") : undefined}>
                          {preis === 0 ? t("ereignis.kostenlos") : t("ereignis.preis", { n: preis })}
                          {pump && <small> {t("ereignis.pump")}</small>}
                        </span>
                      </span>
                      <span className="ev2-option-text">{o.beschreibung}</span>
                      {zusatz && <span className="ev2-option-zusatz">{zusatz}</span>}
                      {o.vorschau.length > 0 ? (
                        <span className="ev2-folgen" aria-label={t("ereignis.folgen")}>
                          {o.vorschau.map((z) => {
                            const r = richtungVon(z);
                            return (
                              <span key={z} className={`ev2-chip ${r}`}>
                                <i aria-hidden>{r === "auf" ? "▲" : r === "ab" ? "▼" : "•"}</i> {z}
                              </span>
                            );
                          })}
                        </span>
                      ) : (
                        <span className="ev2-folgen leer">{t("ereignis.folgenUnsicher")}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            {knapp && (
              <p className="event-knapp">
                {t("ereignis.knapp", { kapital: Math.floor(kapital) })}
                {naechsteGutschrift ? ` ${t("ereignis.gutschrift", { datum: naechsteGutschrift })}` : ""}
              </p>
            )}

            <div className="ev2-wege">
              {onAkte && (
                <button className="aktion-knopf ev2-akte" onClick={() => onAkte(akte.ziel)}>
                  <Icon name="buch" size={15} /> {akte.label}
                </button>
              )}
              {ansicht.massnahmen.length > 0 && onMassnahme && (
                <span className="ev2-ursache">
                  <span>{ansicht.massnahmenText}</span>
                  {ansicht.massnahmen.map((m) => (
                    <button key={m.id} className="aktion-knopf" onClick={() => onMassnahme({ id: m.id, ...(m.ziel !== undefined ? { ziel: m.ziel } : {}) })}>
                      {m.name}
                    </button>
                  ))}
                </span>
              )}
            </div>
          </div>
        </div>

        <footer className="ev2-fuss">
          <div className="ev2-frist">
            <span>{ansicht.tageBisFrist > 0 ? t("ereignis.frist", { n: ansicht.tageBisFrist }) : t("ereignis.fristHeute")}</span>
            <i aria-hidden>
              <b style={{ width: `${Math.round(fristAnteil * 100)}%` }} />
            </i>
          </div>
          <button className="link" onClick={onSpaeter}>
            {t("ereignis.spaeter")}
          </button>
        </footer>
      </article>
    </div>
  );
}

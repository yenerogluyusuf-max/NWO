// Der Schreibtisch: das Tagesbriefing. Oben die Lage in sechs Zahlen, links was fällig ist und was der Beraterstab rät,
// rechts Warnungen, Termine, Ziele und die Randnotiz der Mentorin. Jede Zeile führt zu einer Entscheidung: Ein Knopf öffnet die
// passende Akte oder handelt gleich (Gespräch führen, Vorhaben einbringen). Die Rechnung steht in briefing.ts.

import { useMemo, useState } from "react";
import type { World } from "../../sim/types";
import { formatDateDe } from "../../sim/dates";
import { bringeEin } from "../../sim/handeln";
import { verhandle } from "../../sim/verhandeln";
import { vorschlaege } from "../../sim/vorschlaege";
import { zielStand } from "../../sim/ziele";
import { Rng } from "../../sim/rng";
import { mentorNotes } from "../mentor";
import { Cameo } from "../art/Cameo";
import { Icon, type IconName } from "../icons";
import { briefing, type Faellig, type Kennzahl, type Knopf, type Ziel } from "./briefing";
import "./schreibtisch.css";

const ART_ICON: Record<Faellig["art"], IconName> = { ereignis: "warnung", gesetz: "waage", zusage: "haende", schritt: "ziel", duldung: "parlament" };

const TREND: Record<Kennzahl["trend"], string> = { auf: "▲", ab: "▼", gleich: "" };

const TUEREN: { label: string; ziel: Ziel; icon: IconName }[] = [
  { label: "Bereiche der Politik", ziel: { art: "politik" }, icon: "netz" },
  { label: "Programme", ziel: { art: "akte", akte: "programme" }, icon: "ziel" },
  { label: "Parlament", ziel: { art: "akte", akte: "parlament" }, icon: "waage" },
  { label: "Wähler", ziel: { art: "akte", akte: "waehler" }, icon: "menge" },
  { label: "Welt", ziel: { art: "akte", akte: "welt" }, icon: "berg" },
  { label: "Reich", ziel: { art: "akte", akte: "reich_kultur" }, icon: "tempel" },
  { label: "Wirtschaft", ziel: { art: "akte", akte: "wirtschaft" }, icon: "akte" },
  { label: "Personen", ziel: { art: "akte", akte: "personen" }, icon: "person" },
];

export function Schreibtisch({ world, refresh, onGehe }: { world: World; refresh: () => void; onGehe: (z: Ziel) => void }) {
  const spiel = world.spiel;
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const [notiz, setNotiz] = useState<number | null>(null);
  const [weitere, setWeitere] = useState(false);

  // Die Rechnungen sind aufwendig: nur neu, wenn sich Tag, Kapital, Gesetze, Ereignisse, Zusagen oder das Lager ändern
  const schluessel = `${world.day}|${Math.floor(spiel?.kapital ?? 0)}|${spiel?.gesetze.length ?? 0}|${spiel?.ereignisse.length ?? 0}|${spiel?.zusagen.filter((z) => !z.erfuellt && !z.gebrochen).length ?? 0}|${spiel?.lager.length ?? 0}|${Object.keys(world.net.targets).length}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const b = useMemo(() => briefing(world, spiel ? vorschlaege(world, 3) : []), [schluessel]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const notizen = useMemo(() => mentorNotes(world), [schluessel]);
  const ziele = zielStand(world);
  const geschah = [...world.log].reverse().filter((l) => l.kind !== "statistik").slice(0, 4);

  function tue(k: Knopf) {
    if (k.art === "gehe") return onGehe(k.ziel);
    if (k.art === "einbringen") {
      const v = k.vorschlag;
      setAntwort(bringeEin(world, v.massnahme, v.ziel, v.ort, "gesetz"));
    } else {
      setAntwort(verhandle(world, k.partei, "gespraech", new Rng(world.rngState ^ world.day)));
      world.rngState = (world.rngState + 1) | 0;
    }
    refresh();
  }

  if (!spiel) return <p>Ohne Spielschleife gibt es kein Briefing.</p>;

  const dringend = b.faellig.filter((f) => f.dringend).length;
  const [erste, ...weitereNotizen] = notizen;

  return (
    <div className="sk">
      <header className="sk-kopf">
        <div>
          <p className="kicker">Tagesbriefing</p>
          <h3>{b.datum}</h3>
          <p className="subtitle">
            {b.amtszeit.nummer}. Amtszeit · Wahl {b.amtszeit.monateBisWahl <= 1 ? "in Kürze" : `in ${b.amtszeit.monateBisWahl} Monaten`} ({b.amtszeit.wahltag})
            {dringend > 0 ? ` · ${dringend === 1 ? "eine dringende Sache" : `${dringend} dringende Sachen`}` : ""}
          </p>
        </div>
      </header>

      <ul className="sk-kennzahlen" aria-label="Lage in einem Blick">
        {b.kennzahlen.map((k) => (
          <li key={k.id}>
            <button className={`sk-kz ton-${k.ton}`} onClick={() => onGehe(k.ziel)} title={`${k.label}: Akte öffnen`}>
              <span className="sk-kz-label">{k.label}</span>
              <span className="sk-kz-wert">
                {k.wert}
                {k.trend !== "gleich" && <em className={`sk-trend ton-${k.ton}`}>{TREND[k.trend]}</em>}
              </span>
              <span className="sk-kz-zusatz">{k.zusatz}</span>
            </button>
          </li>
        ))}
      </ul>

      {antwort && (
        <p className={`rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
          {antwort.text}
          {antwort.why && <em> {antwort.why}</em>}
        </p>
      )}

      <div className="sk-spalten">
        <div className="sk-haupt">
          <section className="sk-block">
            <h4>Fällig</h4>
            {b.faellig.length === 0 ? (
              <p className="sk-leer">Nichts wartet auf Sie. Nutzen Sie die Zeit: Die Empfehlungen unten sagen, wo es sich lohnt.</p>
            ) : (
              <ul className="sk-faellig">
                {b.faellig.map((f) => (
                  <li key={f.id} className={f.dringend ? "dringend" : ""}>
                    <span className="sk-icon" aria-hidden>
                      <Icon name={ART_ICON[f.art]} size={18} />
                    </span>
                    <span className="sk-faellig-text">
                      <strong>{f.titel}</strong>
                      <em>{f.unter}</em>
                    </span>
                    {f.tage !== undefined && <span className={`sk-frist${f.dringend ? " rot" : ""}`}>{f.tage <= 0 ? "heute" : `${f.tage} T`}</span>}
                    <button className="aktion-knopf" onClick={() => tue(f.knopf)}>
                      {f.knopf.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="sk-block">
            <h4>Der Beraterstab rät</h4>
            {b.empfehlungen.length === 0 ? (
              <p className="sk-leer">Der Stab hat im Moment keinen Rat: Die Lage ist ruhig, das Kapital arbeitet, die Mehrheit steht.</p>
            ) : (
              <ol className="sk-rat">
                {b.empfehlungen.map((e) => (
                  <li key={e.id}>
                    <p className="sk-rat-kopf">
                      <span>{e.rat}</span>
                      {e.wer && <em> · {e.wer}</em>}
                    </p>
                    <strong className="sk-rat-titel">{e.titel}</strong>
                    <p className="sk-rat-text">{e.text}</p>
                    {e.kosten && <p className="sk-rat-kosten">Kosten und Folgen: {e.kosten}</p>}
                    <div className="fraktion-aktionen">
                      {e.knoepfe.map((k, i) => (
                        <button key={i} className="aktion-knopf" onClick={() => tue(k)}>
                          {k.label}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="sk-seite">
          <section className="sk-block">
            <h4>Warnungen</h4>
            {b.warnungen.length === 0 ? (
              <p className="sk-leer">Keine Warnung. Was sich ändert, steht hier zuerst.</p>
            ) : (
              <ul className="sk-warnungen">
                {b.warnungen.slice(0, 6).map((x) => (
                  <li key={x.id} className={`stufe-${x.stufe}`}>
                    <button className="sk-warnung" onClick={() => onGehe(x.ziel)} title="Ansehen und handeln">
                      <span className={`sk-punkt ${x.stufe}`} role="img" aria-label={x.stufe === "rot" ? "dringend" : "Achtung"} />
                      <span>
                        <strong>{x.text}</strong>
                        <em>{x.warum}</em>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="sk-block">
            <h4>Termine</h4>
            <ul className="sk-termine">
              {b.termine.map((t) => (
                <li key={t.id}>
                  <button className="sk-termin" disabled={!t.ziel} onClick={() => t.ziel && onGehe(t.ziel)}>
                    <span className="sk-datum">{t.datum}</span>
                    <span>{t.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {ziele.length > 0 && (
            <section className="sk-block">
              <h4>Ihre Ziele</h4>
              <ul className="sk-ziele">
                {ziele.map((z) => (
                  <li key={z.def.id} className={z.erreicht ? "ja" : "offen"}>
                    <span aria-hidden>{z.erreicht ? "✓" : "○"}</span>
                    <span>
                      <strong>{z.def.titel}</strong>
                      <em>{z.stand}</em>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="sk-block sk-mentor">
            <div className="sk-mentor-kopf">
              <Cameo seed="Defne Arslan" figure="f" glasses size={40} tint="#265a62" />
              <div>
                <strong>Prof. Dr. Defne Arslan</strong>
                <span>Mentorin · neutral</span>
              </div>
            </div>
            {erste && (
              <div className="sk-note">
                <p>{erste.short}</p>
                {notiz === 0 ? <p className="mehr">{erste.more}</p> : <button className="link" onClick={() => setNotiz(0)}>Mehr erklären</button>}
              </div>
            )}
            {weitereNotizen.length > 0 && (
              <>
                {weitere &&
                  weitereNotizen.map((n, i) => (
                    <div key={i} className="sk-note">
                      <p>{n.short}</p>
                      {notiz === i + 1 ? <p className="mehr">{n.more}</p> : <button className="link" onClick={() => setNotiz(i + 1)}>Mehr erklären</button>}
                    </div>
                  ))}
                <button className="link" onClick={() => setWeitere(!weitere)}>
                  {weitere ? "Weniger Hinweise" : `${weitereNotizen.length} weitere ${weitereNotizen.length === 1 ? "Hinweis" : "Hinweise"}`}
                </button>
              </>
            )}
          </section>

          {geschah.length > 0 && (
            <section className="sk-block">
              <h4>Was zuletzt geschah</h4>
              <ul className="sk-log">
                {geschah.map((l, i) => (
                  <li key={`${l.day}-${i}`}>
                    <span className="sk-datum">{formatDateDe(l.date)}</span>
                    <span>{l.text}</span>
                  </li>
                ))}
              </ul>
              <button className="link" onClick={() => onGehe({ art: "akte", akte: "chronik" })}>
                Ganze Chronik
              </button>
            </section>
          )}
        </aside>
      </div>

      <nav className="sk-tueren" aria-label="Schnellzugriff">
        {TUEREN.map((t) => (
          <button key={t.label} onClick={() => onGehe(t.ziel)}>
            <Icon name={t.icon} size={18} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

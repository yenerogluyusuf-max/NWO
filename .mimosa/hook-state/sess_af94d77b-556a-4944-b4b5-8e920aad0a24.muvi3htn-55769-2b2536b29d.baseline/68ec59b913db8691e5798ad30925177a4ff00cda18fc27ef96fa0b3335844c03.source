// Das Gespräch: freie Sprache, geprüfte Aktionen (Spieldesign, Abschnitt 5 und 6).
// Mit eingerichteter KI versteht das Präsidialamt freie Sprache, erklärt die Lage und schlägt Aktionen vor, die Sie bestätigen.
// Ohne KI oder bei einem Fehler antwortet das Regelwerk (`befehl`), wie bisher. Jede wirksame Änderung erscheint im Verlauf mit Begründung.

import { useEffect, useRef, useState } from "react";
import type { World } from "../sim/types";
import { befehl, willkommensText, type ChatZeile } from "../sim/befehle";
import { KiFehler, MODUS_NAME, waehleWeg, type Weg } from "../ki/anbieter";
import { fuehreAus, vorschau } from "../ki/aktionen";
import { fragKi } from "../ki/gespraech";
import { ladeKonfig, ladeZaehler, speichereKonfig, zaehle, type KiZaehler } from "../ki/einstellungen";
import { type KiAktion, type KiKonfig, type KiNachricht } from "../ki/typen";
import { KiEinstellungen } from "./KiEinstellungen";
import "./gespraech.css";

interface Vorschlag {
  aktion: KiAktion;
  /** Nach der Ausführung: was der Kern gemeldet hat */
  erledigt?: { ok: boolean; text: string; why?: string };
}

interface Zeile extends ChatZeile {
  vorschlaege?: Vorschlag[];
  /** Hinweis zur Herkunft der Antwort, etwa „Regelwerk, weil die KI nicht erreichbar war“ */
  quelle?: string;
}

const BEISPIELE_REGEL = ["Was soll ich als Nächstes tun?", "Wie stehen die Rentner zu mir?", "Wie ist das Verhältnis zu Russland?", "Gipfeltreffen mit der EU", "Wie verhandle ich mit der Opposition?", "Hilfe"];
const BEISPIELE_KI = ["Was ist gerade am dringendsten, und warum?", "Wie komme ich an eine Mehrheit für mein nächstes Gesetz?", "Ich will die Inflation senken, ohne die Rentner zu verlieren.", "Erkläre mir, wie ich das Verhältnis zur EU verbessere.", "Wo stehe ich vor der Wahl, und was fehlt?"];

const KI_WILLKOMMEN =
  "Sie haben das Wort, in freien Worten. Ich kenne den Stand Ihrer Partie, erkläre Zusammenhänge und schlage Schritte vor, die Sie bestätigen. Was Kapital kostet, führe ich nie ohne Ihr Zeichen aus.";

export function Chat({ world, refresh }: { world: World; refresh: () => void }) {
  const [zeilen, setZeilen] = useState<Zeile[]>([{ rolle: "spiel", text: willkommensText() }]);
  const [text, setText] = useState("");
  const [konfig, setKonfig] = useState<KiKonfig>(ladeKonfig);
  const [zaehler, setZaehler] = useState<KiZaehler>(ladeZaehler);
  const [weg, setWeg] = useState<Weg | null | undefined>(undefined);
  const [einstellungen, setEinstellungen] = useState(false);
  const [denkt, setDenkt] = useState(false);
  const verlauf = useRef<KiNachricht[]>([]);
  const abbruch = useRef<AbortController | null>(null);
  const unten = useRef<HTMLDivElement>(null);
  const begruesst = useRef(false);
  const eingabe = useRef<HTMLTextAreaElement>(null);

  // Welcher Weg steht offen? Erst prüfen, dann die Begrüßung passend setzen.
  useEffect(() => {
    let aktuell = true;
    waehleWeg(konfig).then((w) => {
      if (!aktuell) return;
      setWeg(w);
      if (!begruesst.current) {
        begruesst.current = true;
        if (w) setZeilen([{ rolle: "spiel", text: KI_WILLKOMMEN }]);
      }
    });
    return () => {
      aktuell = false;
    };
  }, [konfig]);

  useEffect(() => () => abbruch.current?.abort(), []);

  const kiAktiv = !!weg;
  const zuletzt = () => requestAnimationFrame(() => unten.current?.scrollIntoView({ behavior: "smooth" }));

  function aendereKonfig(k: KiKonfig) {
    setKonfig(k);
    speichereKonfig(k);
  }

  function regelAntwort(roh: string, quelle?: string) {
    const antwort = befehl(roh, world);
    setZeilen((z) => [...z, { rolle: "spiel", text: antwort.text, ...(antwort.why ? { why: antwort.why } : {}), ...(quelle ? { quelle } : {}) }]);
    refresh();
  }

  async function senden(e: React.FormEvent, vorgabe?: string) {
    e.preventDefault();
    const roh = (vorgabe ?? text).trim();
    if (!roh || denkt) return;
    setText("");
    if (eingabe.current) eingabe.current.style.height = "auto";
    setZeilen((z) => [...z, { rolle: "spieler", text: roh }]);
    zuletzt();
    if (!kiAktiv) {
      regelAntwort(roh);
      zuletzt();
      return;
    }
    if (zaehler.aufrufe >= konfig.maxAufrufe) {
      setZeilen((z) => [...z, { rolle: "spiel", text: `Das Aufruflimit dieser Sitzung (${konfig.maxAufrufe}) ist erreicht. Sie können es in den KI-Einstellungen anheben; bis dahin antworte ich regelbasiert.` }]);
      regelAntwort(roh, "Regelwerk");
      zuletzt();
      return;
    }
    setDenkt(true);
    const ac = new AbortController();
    abbruch.current = ac;
    try {
      const runde = await fragKi(world, verlauf.current, roh, konfig, undefined, ac.signal);
      setZaehler((z) => zaehle(z, runde.verbrauch.ein, runde.verbrauch.aus));
      const neu: KiNachricht[] = [{ rolle: "user", text: roh }, { rolle: "assistant", text: runde.ergebnis.antwort || "(ohne Text)" }];
      verlauf.current = [...verlauf.current, ...neu].slice(-8);
      setZeilen((z) => [
        ...z,
        {
          rolle: "spiel",
          text: runde.ergebnis.antwort || (runde.ergebnis.aktionen.length ? "Hier sind meine Vorschläge:" : "Dazu habe ich nichts zu sagen."),
          quelle: runde.verbrauch.modell,
          ...(runde.ergebnis.aktionen.length ? { vorschlaege: runde.ergebnis.aktionen.map((aktion) => ({ aktion })) } : {}),
        },
      ]);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const meldung = err instanceof KiFehler ? err.message : "Die KI hat nicht geantwortet.";
      setZeilen((z) => [...z, { rolle: "spiel", text: `${meldung} Ich antworte stattdessen mit dem Regelwerk.` }]);
      regelAntwort(roh, "Regelwerk");
    } finally {
      setDenkt(false);
      zuletzt();
    }
  }

  function fuehre(zeile: number, index: number) {
    const v = zeilen[zeile]?.vorschlaege?.[index];
    if (!v || v.erledigt) return;
    const r = fuehreAus(world, v.aktion);
    setZeilen((z) =>
      z.map((x, i) =>
        i === zeile && x.vorschlaege ? { ...x, vorschlaege: x.vorschlaege.map((y, j) => (j === index ? { ...y, erledigt: r } : y)) } : x,
      ),
    );
    refresh();
    zuletzt();
  }

  const beispiele = kiAktiv ? BEISPIELE_KI : BEISPIELE_REGEL;
  const statusText = weg === undefined ? "KI wird geprüft …" : kiAktiv ? `${weg!.anbieter.name} · ${weg!.modell}` : "Regelwerk · KI nicht eingerichtet";

  // Das Eingabefeld wächst mit dem Text, bis fünf Zeilen
  function wachse(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }

  function taste(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void senden(e as unknown as React.FormEvent);
    }
  }

  return (
    <div className="chat gs">
      <header className="gs-kopf">
        <span className="gs-avatar" aria-hidden>
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path d="M12 3 L20 7 V12 C20 16.5 16.5 19.8 12 21 C7.5 19.8 4 16.5 4 12 V7 Z M8.5 12 L11 14.5 L15.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div className="gs-titel" title="Lage, Rat und Vorschläge Ihres Stabes">
          <strong>Präsidialamt</strong>
          <span className={`gs-status ${kiAktiv ? "an" : "aus"}`} title={kiAktiv ? `Das Sprachmodell versteht freie Sprache. Weg: ${MODUS_NAME[weg!.modus]}.` : "Ohne eingerichtete KI antwortet das Regelwerk."}>
            {statusText}
          </span>
        </div>
        <button type="button" className="gs-einrichten" onClick={() => setEinstellungen((x) => !x)} aria-expanded={einstellungen}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
            <path d="M4 7h9M17 7h3M4 17h3M11 17h9M13 4v6M7 14v6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          {einstellungen ? "Zurück zum Gespräch" : "KI einrichten"}
        </button>
      </header>

      {einstellungen ? (
        <div className="gs-einst-rahmen">
          <KiEinstellungen konfig={konfig} aendere={aendereKonfig} weg={weg} zaehler={zaehler} />
        </div>
      ) : (
        <>
          <div className="gs-verlauf" aria-live="polite">
            {zeilen.map((z, i) => (
              <div key={i} className={`gs-zeile ${z.rolle}`}>
                <span className="gs-absender">
                  {z.rolle === "spieler" ? "Sie" : "Präsidialamt"}
                  {z.quelle && <em> · {z.quelle}</em>}
                </span>
                <div className="gs-blase">
                  <p>{z.text}</p>
                  {z.why && <p className="gs-why">{z.why}</p>}
                </div>
                {z.vorschlaege && (
                  <ul className="gs-vorschlaege">
                    {z.vorschlaege.map((v, j) => {
                      const vs = v.erledigt ? null : vorschau(world, v.aktion);
                      return (
                        <li key={j} className={v.erledigt ? (v.erledigt.ok ? "erledigt" : "fehler") : vs?.problem ? "gesperrt" : ""}>
                          <div className="gs-v-kopf">
                            <strong>{vs?.titel ?? "Erledigt"}</strong>
                            {vs?.kosten !== undefined && (
                              <b className="gs-kosten" title="Politisches Kapital">
                                {vs.kosten}
                              </b>
                            )}
                          </div>
                          {v.aktion.grund && <p className="gs-v-text">{v.aktion.grund}</p>}
                          {vs?.hinweis && !vs.problem && <p className="gs-v-text">{vs.hinweis}</p>}
                          {vs?.problem && <p className="gs-v-problem">{vs.problem}</p>}
                          {v.erledigt && (
                            <p className={`gs-v-ergebnis ${v.erledigt.ok ? "ok" : "nein"}`}>
                              {v.erledigt.text}
                              {v.erledigt.why && <em> {v.erledigt.why}</em>}
                            </p>
                          )}
                          {!v.erledigt && (
                            <button type="button" className="gs-ausfuehren" disabled={!!vs?.problem} onClick={() => fuehre(i, j)}>
                              Ausführen
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
            {denkt && (
              <div className="gs-zeile spiel gs-denkt" role="status">
                <span className="gs-absender">Präsidialamt</span>
                <div className="gs-blase">
                  <p>
                    Das Präsidialamt liest die Lage
                    <span className="punkte" aria-hidden>
                      <i />
                      <i />
                      <i />
                    </span>
                  </p>
                </div>
              </div>
            )}
            <div ref={unten} />
          </div>

          <div className="gs-fuss">
            <div className="gs-beispiele" aria-label="Beispiele">
              {beispiele.map((b) => (
                <button key={b} className="gs-chip" type="button" disabled={denkt} onClick={(e) => senden(e as unknown as React.FormEvent, b)}>
                  {b}
                </button>
              ))}
            </div>
            <form className="gs-eingabe" onSubmit={senden}>
              <textarea
                ref={eingabe}
                rows={1}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  wachse(e.target);
                }}
                onKeyDown={taste}
                placeholder={kiAktiv ? "Schreiben Sie frei, was Sie wissen oder tun wollen …" : "Schreiben Sie, was geschehen soll …"}
                aria-label="Anweisung"
                disabled={denkt}
              />
              <button type="submit" className="gs-senden" disabled={denkt || !text.trim()} aria-label="Senden">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                  <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
            <p className="gs-tipp">Enter sendet, Umschalt und Enter macht eine neue Zeile. Was Kapital kostet, wird nie ohne Ihr Zeichen ausgeführt.</p>
          </div>
        </>
      )}
    </div>
  );
}

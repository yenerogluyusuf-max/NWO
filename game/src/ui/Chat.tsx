// Das Gespräch: freie Sprache, geprüfte Aktionen (Spieldesign, Abschnitt 5 und 6).
// Mit eingerichteter KI versteht das Präsidialamt freie Sprache, erklärt die Lage und schlägt Aktionen vor, die Sie bestätigen.
// Ohne KI oder bei einem Fehler antwortet das Regelwerk (`befehl`), wie bisher. Jede wirksame Änderung erscheint im Verlauf mit Begründung.

import { useEffect, useRef, useState } from "react";
import type { World } from "../sim/types";
import { bestaetigeBefehl, chatBefehl, willkommensText, type ChatVorschlag, type ChatZeile } from "../sim/befehle";
import { NachfolgeAuswahl } from "./personen/NachfolgeAuswahl";
import "./personen/personen.css";
import { KiFehler, MODUS_NAME, waehleWeg, type Weg } from "../ki/anbieter";
import { fuehreAus, vorschau } from "../ki/aktionen";
import { fragKi } from "../ki/gespraech";
import { ladeKonfig, ladeZaehler, speichereKonfig, zaehle, type KiZaehler } from "../ki/einstellungen";
import { type KiAktion, type KiKonfig, type KiNachricht } from "../ki/typen";
import { KiEinstellungen } from "./KiEinstellungen";
import "./gespraech.css";

import { t } from "../i18n";
interface Vorschlag {
  aktion: KiAktion;
  /** Nach der Ausführung: was der Kern gemeldet hat */
  erledigt?: { ok: boolean; text: string; why?: string };
}

/** Eine Vorschlagskarte des Regelwerks (Befund C-2): erst das Zeichen des Präsidenten führt aus. */
interface RegelKarte {
  v: ChatVorschlag;
  /** Bei einer Entlassung: die Nachfolgeauswahl ist aufgeklappt */
  offen?: boolean;
  erledigt?: { ok: boolean; text: string; why?: string };
}

interface Zeile extends ChatZeile {
  vorschlaege?: Vorschlag[];
  karte?: RegelKarte;
  /** Hinweis zur Herkunft der Antwort, etwa „Regelwerk, weil die KI nicht erreichbar war“ */
  quelle?: string;
}

// Der Chat steht in der Kabinettsakte: Die Beispiele fragen nach dem Kabinett (Befund C-31). Befehle des Regelwerks sind deutsch, auch in en und tr.
const BEISPIELE_REGEL = [1, 2, 3, 4, 5, 6].map((i) => t(`n1.chat.bsp${i}`));
const BEISPIELE_KI = [1, 2, 3, 4, 5].map((i) => t(`n1.chat.ki.bsp${i}`));

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
        if (w) setZeilen([{ rolle: "spiel", text: t("n1.chat.ki.willkommen") }]);
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
    const antwort = chatBefehl(roh, world);
    setZeilen((z) => [...z, { rolle: "spiel", text: antwort.text, ...(antwort.why ? { why: antwort.why } : {}), ...(quelle ? { quelle } : {}), ...(antwort.vorschlag ? { karte: { v: antwort.vorschlag } } : {}) }]);
    refresh();
  }

  function aendereKarte(zeile: number, f: (k: RegelKarte) => RegelKarte) {
    setZeilen((z) => z.map((x, i) => (i === zeile && x.karte ? { ...x, karte: f(x.karte) } : x)));
  }

  function bestaetige(zeile: number) {
    const k = zeilen[zeile]?.karte;
    if (!k || k.erledigt || k.v.art !== "befehl") return;
    const r = bestaetigeBefehl(k.v, world);
    // Neuer Preis: die Karte zeigt den neuen Vorschlag statt eines Ergebnisses
    if (r.vorschlag) aendereKarte(zeile, () => ({ v: r.vorschlag!, erledigt: undefined }));
    else aendereKarte(zeile, (x) => ({ ...x, erledigt: { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) } }));
    if (r.vorschlag) setZeilen((z) => [...z, { rolle: "spiel", text: r.text }]);
    refresh();
    zuletzt();
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
      setZeilen((z) => [...z, { rolle: "spiel", text: t("n1.chat.ki.limit", { n: konfig.maxAufrufe }) }]);
      regelAntwort(roh, t("n1.chat.quelle.regel"));
      zuletzt();
      return;
    }
    setDenkt(true);
    const ac = new AbortController();
    abbruch.current = ac;
    try {
      const runde = await fragKi(world, verlauf.current, roh, konfig, undefined, ac.signal);
      setZaehler((z) => zaehle(z, runde.verbrauch.ein, runde.verbrauch.aus));
      const neu: KiNachricht[] = [{ rolle: "user", text: roh }, { rolle: "assistant", text: runde.ergebnis.antwort || t("n1.chat.ki.ohneText") }];
      verlauf.current = [...verlauf.current, ...neu].slice(-8);
      setZeilen((z) => [
        ...z,
        {
          rolle: "spiel",
          text: runde.ergebnis.antwort || (runde.ergebnis.aktionen.length ? t("n1.chat.ki.vorschlaege") : t("n1.chat.ki.nichts")),
          quelle: runde.verbrauch.modell,
          ...(runde.ergebnis.aktionen.length ? { vorschlaege: runde.ergebnis.aktionen.map((aktion) => ({ aktion })) } : {}),
        },
      ]);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const meldung = err instanceof KiFehler ? err.message : t("n1.chat.ki.fehler");
      setZeilen((z) => [...z, { rolle: "spiel", text: t("n1.chat.ki.ersatz", { meldung }) }]);
      regelAntwort(roh, t("n1.chat.quelle.regel"));
    } finally {
      setDenkt(false);
      zuletzt();
    }
  }

  function fuehre(zeile: number, index: number) {
    const v = zeilen[zeile]?.vorschlaege?.[index];
    if (!v || v.erledigt) return;
    // Eine Entlassung aus dem Vorschlag der KI geht über dieselbe Nachfolgeauswahl wie im Kabinett, nie über einen zufälligen Nachfolger (C-2)
    const a = v.aktion;
    const fe = a.art === "figur" && a.handlung === "entlassen" ? world.spiel?.figuren.find((x) => x.amt === a.amt && x.imAmt) : undefined;
    if (fe) {
      const text = t("n1.chat.entlassung.text", { rolle: fe.rolle, name: fe.name });
      setZeilen((z) => [
        ...z.map((x, i) => (i === zeile && x.vorschlaege ? { ...x, vorschlaege: x.vorschlaege.map((y, j) => (j === index ? { ...y, erledigt: { ok: true, text } } : y)) } : x)),
        { rolle: "spiel", text, karte: { v: { art: "entlassung", amt: fe.amt, figurId: fe.id }, offen: true } },
      ]);
      zuletzt();
      return;
    }
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
  const statusText = weg === undefined ? t("n1.chat.status.pruefe") : kiAktiv ? `${weg!.anbieter.name} · ${weg!.modell}` : t("n1.chat.status.regel");

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
        <div className="gs-titel" title={t("ui.Chat.d6f7bb2")}>
          <strong>{t("ui.Chat.e276e84")}</strong>
          <span className={`gs-status ${kiAktiv ? "an" : "aus"}`} title={kiAktiv ? t("ui2.ui.Chat.5f1db09", { p0: MODUS_NAME[weg!.modus] }) : t("ui2.ui.Chat.9c76a21")}>
            {statusText}
          </span>
        </div>
        <button type="button" className="gs-einrichten" onClick={() => setEinstellungen((x) => !x)} aria-expanded={einstellungen}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
            <path d="M4 7h9M17 7h3M4 17h3M11 17h9M13 4v6M7 14v6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          {einstellungen ? t("ui2.ui.Chat.a3c52d2") : t("ui2.ui.Chat.f4ebfe9")}
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
                  {z.rolle === "spieler" ? t("ui2.ui.Chat.2190140") : t("ui2.ui.Chat.e276e84")}
                  {z.quelle && <em> · {z.quelle}</em>}
                </span>
                <div className="gs-blase">
                  <p>{z.text}</p>
                  {z.why && !z.karte && <p className="gs-why">{z.why}</p>}
                </div>
                {z.karte && <RegelKarteAnsicht world={world} zeile={z} refresh={refresh} onAendere={(f) => aendereKarte(i, f)} onBestaetige={() => bestaetige(i)} />}
                {z.vorschlaege && (
                  <ul className="gs-vorschlaege">
                    {z.vorschlaege.map((v, j) => {
                      const vs = v.erledigt ? null : vorschau(world, v.aktion);
                      return (
                        <li key={j} className={v.erledigt ? (v.erledigt.ok ? "erledigt" : "fehler") : vs?.problem ? "gesperrt" : ""}>
                          <div className="gs-v-kopf">
                            <strong>{vs?.titel ?? t("ui2.ui.Chat.adf9ae5")}</strong>
                            {vs?.kosten !== undefined && (
                              <b className="gs-kosten" title={t("ui.Chat.ae69ecb")}>
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
                              {t("ui.Chat.6ef39e4")}
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
                <span className="gs-absender">{t("ui.Chat.e276e84")}</span>
                <div className="gs-blase">
                  <p>
                    {t("ui2.ui.Chat.7ebbad2")}
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
            <div className="gs-beispiele" aria-label={t("ui2.ui.Chat.0977c45")}>
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
                placeholder={kiAktiv ? t("ui2.ui.Chat.17104e8") : t("ui2.ui.Chat.f5421d0")}
                aria-label={t("ui2.ui.Chat.0bba292")}
                disabled={denkt}
              />
              <button type="submit" className="gs-senden" disabled={denkt || !text.trim()} aria-label={t("ui2.ui.Chat.452568f")}>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                  <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
            <p className="gs-tipp">{t("ui.Chat.1332e4b")}</p>
          </div>
        </>
      )}
    </div>
  );
}

/** Die Vorschlagskarte des Regelwerks: Titel, Preis, Folgen in Zahlen; bei einer Entlassung die Nachfolgeauswahl auf Klick. */
function RegelKarteAnsicht({ world, zeile, refresh, onAendere, onBestaetige }: { world: World; zeile: Zeile; refresh: () => void; onAendere: (f: (k: RegelKarte) => RegelKarte) => void; onBestaetige: () => void }) {
  const k = zeile.karte!;
  const v = k.v;
  const ergebnis = k.erledigt && (
    <p className={`gs-v-ergebnis ${k.erledigt.ok ? "ok" : "nein"}`}>
      {k.erledigt.text}
      {k.erledigt.why && <em> {k.erledigt.why}</em>}
    </p>
  );
  const verwerfen = !k.erledigt && (
    <button type="button" className="gs-verwerfen" onClick={() => onAendere((x) => ({ ...x, offen: false, erledigt: { ok: false, text: t(v.art === "entlassung" ? "n1.chat.karte.abbruch" : "n1.chat.karte.verworfen") } }))}>
      {t("n1.chat.karte.verwerfen")}
    </button>
  );
  if (v.art === "befehl") {
    return (
      <ul className="gs-vorschlaege gs-regelkarte">
        <li className={k.erledigt ? (k.erledigt.ok ? "erledigt" : "fehler") : ""}>
          <div className="gs-v-kopf">
            <strong>„{v.titel}“</strong>
            <b className="gs-kosten">{v.kosten > 0 ? t("n1.chat.karte.kosten", { n: v.kosten }) : t("n1.chat.karte.ohneKosten")}</b>
          </div>
          {v.folgen.length > 0 && (
            <ul className="gs-v-folgen">
              {v.folgen.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
          {zeile.why && !k.erledigt && (
            <p className="gs-v-text">
              <span className="gs-v-meldung">{t("n1.chat.karte.meldung")}</span> {zeile.why}
            </p>
          )}
          {ergebnis}
          {!k.erledigt && (
            <div className="gs-v-knoepfe">
              <button type="button" className="gs-ausfuehren" onClick={onBestaetige}>
                {t("n1.chat.karte.ausfuehren")}
              </button>
              {verwerfen}
            </div>
          )}
        </li>
      </ul>
    );
  }
  const f = world.spiel?.figuren.find((x) => x.id === v.figurId && x.imAmt && x.amt === v.amt);
  return (
    <div className="gs-regelkarte gs-entlassung">
      <ul className="gs-vorschlaege">
        <li className={k.erledigt ? (k.erledigt.ok ? "erledigt" : "fehler") : ""}>
          <div className="gs-v-kopf">
            <strong>{f ? t("n1.chat.karte.entlassung.titel", { rolle: f.rolle, name: f.name }) : t("n1.chat.karte.entlassung.weg")}</strong>
          </div>
          {ergebnis}
          {!k.erledigt && f && !k.offen && (
            <div className="gs-v-knoepfe">
              <button type="button" className="gs-ausfuehren" onClick={() => onAendere((x) => ({ ...x, offen: true }))}>
                {t("n1.chat.karte.entlassung.knopf")}
              </button>
              {verwerfen}
            </div>
          )}
        </li>
      </ul>
      {!k.erledigt && f && k.offen && (
        <div className="gs-nachfolge">
          <NachfolgeAuswahl
            world={world}
            figur={f}
            modus="entlassen"
            refresh={refresh}
            onFertig={(m) => onAendere((x) => ({ ...x, offen: false, erledigt: m ? { ok: m.ok, text: m.text, ...(m.why ? { why: m.why } : {}) } : { ok: false, text: t("n1.chat.karte.abbruch") } }))}
          />
        </div>
      )}
    </div>
  );
}

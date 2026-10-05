// Einstellungen des Sprachmodells: Anbieter wählen, Modell, Schlüssel, Adresse, Budget. Alles bleibt in diesem Browser.
// Das Spiel spricht mehrere Anbieter an (Claude, Xiaomi MiMo, DeepSeek, OpenAI, Gemini, OpenRouter, Mistral, jeder OpenAI-kompatible
// Dienst, ein lokaler Server); die Liste steht in ki/anbieterliste.ts.

import { useEffect, useState } from "react";
import { KiFehler, MODUS_NAME, rufeAuf, serverStatus, type ServerStatus, type Weg } from "../ki/anbieter";
import { ANBIETER, anbieterDef, erkenneAnbieter, schluesselWarnung } from "../ki/anbieterliste";
import type { KiKonfig } from "../ki/typen";
import type { KiZaehler } from "../ki/einstellungen";

interface Props {
  konfig: KiKonfig;
  aendere: (k: KiKonfig) => void;
  weg: Weg | null | undefined;
  zaehler: KiZaehler;
}

export function KiEinstellungen({ konfig, aendere, weg, zaehler }: Props) {
  const [test, setTest] = useState<{ ok: boolean; text: string } | "laeuft" | null>(null);
  const [server, setServer] = useState<ServerStatus>({ anbieter: [], relay: false });
  useEffect(() => {
    let aktuell = true;
    serverStatus().then((s) => aktuell && setServer(s));
    return () => {
      aktuell = false;
    };
  }, []);

  const a = anbieterDef(konfig.art);
  const setze = (teil: Partial<KiKonfig>) => aendere({ ...konfig, ...teil });
  const setzeSchluessel = (id: string, wert: string) => setze({ schluessel: { ...konfig.schluessel, [id]: wert } });
  const setzeModell = (id: string, wert: string) => setze({ modell: { ...konfig.modell, [id]: wert } });

  async function pruefe() {
    setTest("laeuft");
    try {
      const r = await rufeAuf(konfig, { system: 'Antworte nur mit dem JSON {"antwort":"bereit","aktionen":[]}.', nachrichten: [{ rolle: "user", text: "Test" }], maxTokens: 60 });
      setTest({ ok: true, text: `Verbindung steht (${r.modell}, ${r.tokensEin + r.tokensAus} Token).` });
    } catch (e) {
      setTest({ ok: false, text: e instanceof KiFehler ? e.message : "Die Verbindung ist fehlgeschlagen." });
    }
  }

  const schluessel = a ? (konfig.schluessel[a.id] ?? "") : "";
  const warnung = a ? schluesselWarnung(a.id, schluessel) : null;
  const echter = erkenneAnbieter(schluessel);
  const modell = a ? (konfig.modell[a.id] ?? "") : "";

  return (
    <div className="gs-einst">
      <div className="gs-einst-kopf">
        <h4>Welche KI soll das Präsidialamt beraten?</h4>
        <p>Sie können einen beliebigen Anbieter wählen. Der Schlüssel bleibt in diesem Browser; ohne Schlüssel antwortet das Regelwerk.</p>
      </div>

      <div className="gs-anbieter" role="radiogroup" aria-label="Anbieter">
        <button type="button" role="radio" aria-checked={konfig.art === "auto"} className={`gs-karte${konfig.art === "auto" ? " on" : ""}`} onClick={() => setze({ art: "auto" })}>
          <strong>Automatisch</strong>
          <span>Nimmt, was eingerichtet ist</span>
        </button>
        {ANBIETER.map((x) => {
          const hat = !!(konfig.schluessel[x.id] ?? "").trim();
          const aufServer = server.anbieter.includes(x.id);
          return (
            <button key={x.id} type="button" role="radio" aria-checked={konfig.art === x.id} className={`gs-karte${konfig.art === x.id ? " on" : ""}`} onClick={() => setze({ art: x.id })}>
              <strong>{x.name}</strong>
              <span>{x.lokal ? "kostenlos, lokal" : aufServer ? "Schlüssel auf dem Server" : hat ? "eingerichtet" : "kein Schlüssel"}</span>
              {(hat || aufServer || x.lokal) && <i className="gs-haken" aria-hidden />}
            </button>
          );
        })}
        <button type="button" role="radio" aria-checked={konfig.art === "aus"} className={`gs-karte${konfig.art === "aus" ? " on" : ""}`} onClick={() => setze({ art: "aus" })}>
          <strong>Aus</strong>
          <span>Nur das Regelwerk</span>
        </button>
      </div>

      {konfig.art === "auto" && (
        <p className="gs-erkl">
          Automatisch nimmt zuerst einen Schlüssel, den der Entwicklungsserver kennt, dann einen der Anbieter, für die Sie unten einen Schlüssel eingetragen haben. Tragen Sie ihn dazu bei dem passenden Anbieter ein: Wählen Sie ihn oben aus.
        </p>
      )}

      {a && (
        <div className="gs-detail">
          <p className="gs-erkl">{a.hinweis}</p>

          {a.eigeneUrl && (
            <label className="gs-feld">
              <span>Adresse</span>
              <input
                value={a.lokal ? konfig.lokalUrl : konfig.eigenUrl}
                placeholder={a.lokal ? "http://127.0.0.1:18127/v1" : "https://…/v1"}
                onChange={(e) => setze(a.lokal ? { lokalUrl: e.target.value } : { eigenUrl: e.target.value })}
                spellCheck={false}
              />
            </label>
          )}

          <label className="gs-feld">
            <span>Modell</span>
            {a.modelle.length > 0 ? (
              <select value={modell || a.standardModell} onChange={(e) => setzeModell(a.id, e.target.value)}>
                {a.modelle.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}: {m.hinweis}
                  </option>
                ))}
              </select>
            ) : (
              <input value={modell} placeholder={a.standardModell || a.modellBeispiel || "Modellname"} onChange={(e) => setzeModell(a.id, e.target.value)} spellCheck={false} />
            )}
          </label>

          {!a.lokal && (
            <label className="gs-feld">
              <span>Schlüssel</span>
              <input type="password" autoComplete="off" spellCheck={false} placeholder={a.praefix ? `${a.praefix}…` : "Schlüssel einfügen"} value={schluessel} onChange={(e) => setzeSchluessel(a.id, e.target.value)} />
            </label>
          )}
          {warnung && (
            <p className="gs-warn" role="alert">
              {warnung}
              {echter && echter !== a.id && (
                <button type="button" className="link" onClick={() => aendere({ ...konfig, art: echter, schluessel: { ...konfig.schluessel, [echter]: schluessel, [a.id]: "" } })}>
                  {" "}
                  Zu {anbieterDef(echter)?.name} verschieben
                </button>
              )}
            </p>
          )}
          {!a.lokal && (
            <p className="gs-erkl klein">
              Sicherer als der Browser: den Schlüssel in der Datei <code>game/.env.local</code> als <code>{a.envVar}=…</code> eintragen und den Entwicklungsserver neu starten; dann bleibt er auf dem Rechner und erreicht den Browser nie.
            </p>
          )}
        </div>
      )}

      <div className="gs-budget">
        <label className="gs-feld schmal">
          <span>Aufrufe je Sitzung höchstens</span>
          <input type="number" min={1} max={2000} value={konfig.maxAufrufe} onChange={(e) => setze({ maxAufrufe: Math.max(1, Number(e.target.value) || 1) })} />
        </label>
        <p className="gs-erkl klein">
          Bisher {zaehler.aufrufe} Aufrufe, {zaehler.tokensEin.toLocaleString("de-DE")} Token gesendet, {zaehler.tokensAus.toLocaleString("de-DE")} empfangen. Jede Frage sendet den Spielzustand mit (rund 2.000 bis 3.000 Token).
        </p>
      </div>

      <div className="gs-test">
        <button type="button" className="aktion-knopf" onClick={pruefe} disabled={test === "laeuft" || konfig.art === "aus"}>
          {test === "laeuft" ? "Prüfe …" : "Verbindung testen"}
        </button>
        <span className={`gs-testtext ${test && test !== "laeuft" ? (test.ok ? "ok" : "nein") : ""}`} role="status">
          {test && test !== "laeuft" ? test.text : weg ? `Aktiv: ${weg.anbieter.name}, ${weg.modell}, ${MODUS_NAME[weg.modus]}.` : "Noch nicht eingerichtet."}
        </span>
      </div>
    </div>
  );
}

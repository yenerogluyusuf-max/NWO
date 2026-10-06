// Einstellungen des Sprachmodells: Anbieter wählen, Modell, Schlüssel, Adresse, Budget. Alles bleibt in diesem Browser.
// Das Spiel spricht mehrere Anbieter an (Claude, Xiaomi MiMo, DeepSeek, OpenAI, Gemini, OpenRouter, Mistral, jeder OpenAI-kompatible
// Dienst, ein lokaler Server); die Liste steht in ki/anbieterliste.ts.

import { useEffect, useState } from "react";
import { KiFehler, MODUS_NAME, rufeAuf, serverStatus, type ServerStatus, type Weg } from "../ki/anbieter";
import { ANBIETER, anbieterDef, erkenneAnbieter, schluesselWarnung } from "../ki/anbieterliste";
import type { KiKonfig } from "../ki/typen";
import type { KiZaehler } from "../ki/einstellungen";

import { t } from "../i18n";
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
        <h4>{t("ui.KiEinstellungen.9e687e8")}</h4>
        <p>{t("ui.KiEinstellungen.9fa9290")}</p>
      </div>

      <div className="gs-anbieter" role="radiogroup" aria-label={t("ui2.ui.KiEinstellungen.d062d4f")}>
        <button type="button" role="radio" aria-checked={konfig.art === "auto"} className={`gs-karte${konfig.art === "auto" ? " on" : ""}`} onClick={() => setze({ art: "auto" })}>
          <strong>{t("ui2.ui.KiEinstellungen.95b5106")}</strong>
          <span>{t("ui.KiEinstellungen.6bc1728")}</span>
        </button>
        {ANBIETER.map((x) => {
          const hat = !!(konfig.schluessel[x.id] ?? "").trim();
          const aufServer = server.anbieter.includes(x.id);
          return (
            <button key={x.id} type="button" role="radio" aria-checked={konfig.art === x.id} className={`gs-karte${konfig.art === x.id ? " on" : ""}`} onClick={() => setze({ art: x.id })}>
              <strong>{x.name}</strong>
              <span>{x.lokal ? "kostenlos, lokal" : aufServer ? t("ui2.ui.KiEinstellungen.f91b0dd") : hat ? "eingerichtet" : t("ui2.ui.KiEinstellungen.3e7eda4")}</span>
              {(hat || aufServer || x.lokal) && <i className="gs-haken" aria-hidden />}
            </button>
          );
        })}
        <button type="button" role="radio" aria-checked={konfig.art === "aus"} className={`gs-karte${konfig.art === "aus" ? " on" : ""}`} onClick={() => setze({ art: "aus" })}>
          <strong>{t("ui2.ui.KiEinstellungen.6997e3e")}</strong>
          <span>{t("ui.KiEinstellungen.b1a4bba")}</span>
        </button>
      </div>

      {konfig.art === "auto" && (
        <p className="gs-erkl">
          {t("ui.KiEinstellungen.a01ed8b")}
        </p>
      )}

      {a && (
        <div className="gs-detail">
          <p className="gs-erkl">{a.hinweis}</p>

          {a.eigeneUrl && (
            <label className="gs-feld">
              <span>{t("ui2.ui.KiEinstellungen.522e146")}</span>
              <input
                value={a.lokal ? konfig.lokalUrl : konfig.eigenUrl}
                placeholder={a.lokal ? "http://127.0.0.1:18127/v1" : "https://…/v1"}
                onChange={(e) => setze(a.lokal ? { lokalUrl: e.target.value } : { eigenUrl: e.target.value })}
                spellCheck={false}
              />
            </label>
          )}

          <label className="gs-feld">
            <span>{t("ui2.ui.KiEinstellungen.a2eae7c")}</span>
            {a.modelle.length > 0 ? (
              <select value={modell || a.standardModell} onChange={(e) => setzeModell(a.id, e.target.value)}>
                {a.modelle.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}: {m.hinweis}
                  </option>
                ))}
              </select>
            ) : (
              <input value={modell} placeholder={a.standardModell || a.modellBeispiel || t("ui2.ui.KiEinstellungen.09f9374")} onChange={(e) => setzeModell(a.id, e.target.value)} spellCheck={false} />
            )}
          </label>

          {!a.lokal && (
            <label className="gs-feld">
              <span>{t("ui.KiEinstellungen.1ac8328")}</span>
              <input type="password" autoComplete="off" spellCheck={false} placeholder={a.praefix ? `${a.praefix}…` : t("ui2.ui.KiEinstellungen.17a8655")} value={schluessel} onChange={(e) => setzeSchluessel(a.id, e.target.value)} />
            </label>
          )}
          {warnung && (
            <p className="gs-warn" role="alert">
              {warnung}
              {echter && echter !== a.id && (
                <button type="button" className="link" onClick={() => aendere({ ...konfig, art: echter, schluessel: { ...konfig.schluessel, [echter]: schluessel, [a.id]: "" } })}>
                  {" "}
                  {t("ui2.ui.KiEinstellungen.0407640", { p0: anbieterDef(echter)?.name })}
                </button>
              )}
            </p>
          )}
          {!a.lokal && (
            <p className="gs-erkl klein">
              {t("ui2.ui.KiEinstellungen.1f3c2cb")} <code>game/.env.local</code> {t("ui2.ui.KiEinstellungen.d79673d")} <code>{a.envVar}=…</code> {t("ui2.ui.KiEinstellungen.cf79c19")}
            </p>
          )}
        </div>
      )}

      <div className="gs-budget">
        <label className="gs-feld schmal">
          <span>{t("ui.KiEinstellungen.b7a66fb")}</span>
          <input type="number" min={1} max={2000} value={konfig.maxAufrufe} onChange={(e) => setze({ maxAufrufe: Math.max(1, Number(e.target.value) || 1) })} />
        </label>
        <p className="gs-erkl klein">
          {t("ui2.ui.KiEinstellungen.421418f", { p0: zaehler.aufrufe, p1: zaehler.tokensEin.toLocaleString("de-DE"), p2: zaehler.tokensAus.toLocaleString("de-DE") })}
        </p>
      </div>

      <div className="gs-test">
        <button type="button" className="aktion-knopf" onClick={pruefe} disabled={test === "laeuft" || konfig.art === "aus"}>
          {test === "laeuft" ? t("ui2.ui.KiEinstellungen.85bec72") : t("ui2.ui.KiEinstellungen.e0cbe4f")}
        </button>
        <span className={`gs-testtext ${test && test !== "laeuft" ? (test.ok ? "ok" : "nein") : ""}`} role="status">
          {test && test !== "laeuft" ? test.text : weg ? t("ui2.ui.KiEinstellungen.8b8b3ac", { p0: weg.anbieter.name, p1: weg.modell, p2: MODUS_NAME[weg.modus] }) : t("ui2.ui.KiEinstellungen.1752bfe")}
        </span>
      </div>
    </div>
  );
}

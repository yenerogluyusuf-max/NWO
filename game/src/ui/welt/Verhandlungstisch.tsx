// Der Verhandlungstisch: links, was die Türkei bietet, rechts, was sie verlangt; in der Mitte die Stimmung der Gegenseite mit den
// Gründen in Grün und Rot. Jede Klausel zeigt, was sie im eigenen Land bewirkt (Wirkung und Kehrseite) und was sie dem Partner wert ist.
// Prüfen kostet nichts; ein Angebot zu unterbreiten kostet Kapital und hat Folgen (Zustimmung, Gegenangebot, Zurückweisung).

import { useMemo, useRef, useState } from "react";
import type { World } from "../../sim/types";
import { land, weltZustand } from "../../sim/laender";
import { VERTRAGSLAUFZEITEN, type Laufzeit } from "../../data/abkommen";
import { STIMMUNG_WORT, bewerte, heimWirkung, klauselnFuer, nimmGegenangebot, sperreRest, verhandle, type Angebot, type Ergebnis, type KlauselSicht } from "../../sim/abkommen";
import { kannZahlen, nurAufPump } from "../../sim/kapital";
import { Flagge } from "../art/Flaggen";

import { t } from "../../i18n";
const punkte = (wert: number) => Math.min(4, Math.max(1, Math.round(Math.abs(wert) / 2.5)));

function Punkte({ n, ton }: { n: number; ton: "gut" | "schlecht" }) {
  return (
    <span className={`we-punkte we-${ton}`} aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <i key={i} className={i <= n ? "an" : ""} />
      ))}
    </span>
  );
}

function KlauselKarte({ k, gewaehlt, veto, onToggle, partner }: { k: KlauselSicht; gewaehlt: boolean; veto: boolean; onToggle: () => void; partner: string }) {
  const wirkung = useMemo(() => heimWirkung(k.def), [k.def]);
  const zeilen = [...wirkung.sofort, ...wirkung.dauer.map((z) => ({ ...z, text: `${z.text} dauerhaft` }))].slice(0, 5);
  const gibt = k.def.seite === "gibt";
  return (
    <li>
      <button
        type="button"
        className={`we-klausel${gewaehlt ? " an" : ""}${veto ? " veto" : ""}${k.gesperrt ? " gesperrt" : ""}`}
        aria-pressed={gewaehlt}
        disabled={!!k.gesperrt}
        onClick={onToggle}
        title={k.gesperrt ?? k.text}
      >
        <span className="we-klausel-kopf">
          <strong>{k.label}</strong>
          {k.def.pk ? (
            <b className="we-pk" title={t("ui.welt.Verhandlungstisch.a663901")}>
              {k.def.pk}
            </b>
          ) : null}
        </span>
        <span className="we-klausel-text">{k.text}</span>
        {k.gesperrt ? (
          <span className="we-klausel-grund">{k.gesperrt}</span>
        ) : (
          <>
            <span className="we-klausel-wert">
              <em>{gibt ? t("ui2.ui.welt.Verhandlungstisch.1fd9805", { p0: partner }) : t("ui2.ui.welt.Verhandlungstisch.223c198", { p0: partner })}</em>
              {k.wert < -50 ? <b className="we-rot">{t("ui2.ui.welt.Verhandlungstisch.66d4eee")}</b> : <Punkte n={punkte(k.wert)} ton={gibt ? "gut" : "schlecht"} />}
            </span>
            {zeilen.length > 0 && (
              <ul className="we-wirkung" aria-label={t("ui2.ui.welt.Verhandlungstisch.dca5dc7")}>
                {zeilen.map((z, i) => (
                  <li key={i} className={z.gut ? "we-gut" : "we-schlecht"}>
                    <span aria-hidden>{z.richtung > 0 ? "▲" : "▼"}</span> {z.text}
                  </li>
                ))}
              </ul>
            )}
            {gewaehlt && <span className="we-kehrseite">{t("ui2.ui.welt.Verhandlungstisch.c7e5524", { p0: k.def.kehrseite })}</span>}
          </>
        )}
      </button>
    </li>
  );
}

function Waage({ stimmung, urteil }: { stimmung: number; urteil: string }) {
  return (
    <div className={`we-waage u-${urteil}`} role="img" aria-label={t("ui2.ui.welt.Verhandlungstisch.f4522cf", { p0: STIMMUNG_WORT[stimmung as 0] })}>
      {[0, 1, 2, 3, 4].map((i) => (
        <i key={i} className={i <= stimmung ? "an" : ""} data-i={i} />
      ))}
    </div>
  );
}

export function Verhandlungstisch({ world, landId, refresh, onVertraege }: { world: World; landId: string; refresh: () => void; onVertraege?: () => void }) {
  const l = land(landId);
  const [gibt, setGibt] = useState<string[]>([]);
  const [will, setWill] = useState<string[]>([]);
  const [jahre, setJahre] = useState<Laufzeit>(5);
  const [antwort, setAntwort] = useState<Ergebnis | null>(null);
  const kopf = useRef<HTMLDivElement>(null);
  if (!world.spiel) return null;
  const zeige = () => requestAnimationFrame(() => kopf.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
  const kapital = world.spiel.kapital;
  const klauseln = klauselnFuer(world, landId);
  const angebot: Angebot = { land: landId, gibt, will, jahre };
  const b = bewerte(world, angebot);
  const rest = sperreRest(world, landId);
  const nichts = gibt.length + will.length === 0;
  const kannBezahlen = kannZahlen(kapital, b.pk);
  const auf = (liste: string[], id: string) => (liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id]);
  const laden = (a: Angebot) => {
    setGibt(a.gibt);
    setWill(a.will);
    setJahre(a.jahre);
  };
  const veto = (id: string) => b.urteil === "veto" && klauseln.find((k) => k.def.id === id)?.rot === true;
  const bietet = klauseln.filter((k) => k.def.seite === "gibt");
  const verlangt = klauseln.filter((k) => k.def.seite === "will");
  const vertraegeLaufen = (weltZustand(world)[landId]!.vertraege ?? []).filter((v) => v.status === "laeuft").length;

  function unterbreite() {
    const r = verhandle(world, angebot);
    setAntwort(r);
    if (r.ok) {
      setGibt([]);
      setWill([]);
    }
    refresh();
    zeige();
  }

  function nimmAn(a: Angebot) {
    const r = nimmGegenangebot(world, a);
    setAntwort(r);
    if (r.ok) {
      setGibt([]);
      setWill([]);
    }
    refresh();
    zeige();
  }

  const stimmungText = nichts ? "Noch kein Angebot" : b.urteil === "veto" ? "Rote Linie" : STIMMUNG_WORT[b.stimmung];
  const urteilText = nichts
    ? "Wählen Sie Klauseln links und rechts."
    : b.urteil === "zustimmung"
      ? `${l.name} würde zustimmen.`
      : b.urteil === "veto"
        ? b.veto
        : b.urteil === "gegenangebot"
          ? `${l.name} würde ein Gegenangebot machen.`
          : `${l.name} würde ablehnen.`;

  return (
    <>
    <section className="we-tisch" aria-label={t("ui2.ui.welt.Verhandlungstisch.7e59256", { p0: l.name })}>
      <div ref={kopf} className="we-tisch-oben">
        <p className="we-tisch-kopf">
          {t("ui2.ui.welt.Verhandlungstisch.7ca12d6", { p0: l.name })}
        </p>

        {antwort && (
          <div className={`we-antwort u-${antwort.urteil}`} role="status">
            <span className="we-stempel" aria-hidden>
              {antwort.urteil === "zustimmung" ? t("ui2.ui.welt.Verhandlungstisch.942f46c") : antwort.urteil === "gegenangebot" ? t("ui2.ui.welt.Verhandlungstisch.8477453") : antwort.urteil === "veto" ? t("ui2.ui.welt.Verhandlungstisch.66d4eee") : antwort.urteil === "ablehnung" ? t("ui2.ui.welt.Verhandlungstisch.110d6fe") : t("ui2.ui.welt.Verhandlungstisch.e70aeb2")}
            </span>
            <p>
              <strong>{antwort.text}</strong> {antwort.why && <em>{antwort.why}</em>}
            </p>
            {antwort.urteil === "gegenangebot" && antwort.bewertung && (
              <ul className="we-gegen">
                {antwort.bewertung.gegenangebote.map((g, i) => (
                  <li key={i}>
                    <span>{g.text}</span>
                    <span className="we-gegen-knoepfe">
                      <button type="button" className="aktion-knopf" onClick={() => nimmAn(g.angebot)}>
                        {t("ui2.ui.welt.Verhandlungstisch.c1c1e04")}
                      </button>
                      <button type="button" className="link" onClick={() => { laden(g.angebot); setAntwort(null); }}>
                        {t("ui.welt.Verhandlungstisch.3f14ba3")}
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {antwort.urteil === "zustimmung" && vertraegeLaufen > 0 && onVertraege && (
              <button type="button" className="link" onClick={onVertraege}>
                {t("ui.welt.Verhandlungstisch.2bfb449")}
              </button>
            )}
          </div>
        )}

        <div className="we-mitte">
          <div className="we-stimmung">
            <Flagge id={landId} breite={44} rund titel={l.name} />
            <div className="we-stimmung-text">
              <strong>{stimmungText}</strong>
              <Waage stimmung={nichts ? -1 : b.stimmung} urteil={nichts ? "leer" : b.urteil} />
              <span className="we-urteil">{urteilText}</span>
            </div>
          </div>
          {!nichts && (
            <ul className="we-gruende" aria-label={t("ui.welt.Verhandlungstisch.507600f")}>
              {b.gruende.slice(0, 8).map((g, i) => (
                <li key={i} className={g.art === "plus" ? "we-gut" : g.art === "minus" ? "we-schlecht" : ""}>
                  <span aria-hidden>{g.art === "plus" ? "+" : g.art === "minus" ? "−" : "·"}</span>
                  <span>{g.text}</span>
                  {g.art !== "info" && g.wert !== 0 && <Punkte n={punkte(g.wert)} ton={g.art === "plus" ? "gut" : "schlecht"} />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="we-spalten">
        <div className="we-spalte">
          <h4>
            <Flagge id="TUR" breite={22} /> {t("ui2.ui.welt.Verhandlungstisch.0f5c0dc")}
          </h4>
          <ul className="we-klauseln">
            {bietet.map((k) => (
              <KlauselKarte key={k.def.id} k={k} partner={l.name} gewaehlt={gibt.includes(k.def.id)} veto={veto(k.def.id)} onToggle={() => { setGibt(auf(gibt, k.def.id)); setAntwort(null); }} />
            ))}
          </ul>
        </div>
        <div className="we-spalte">
          <h4>
            <Flagge id={landId} breite={22} titel={l.name} /> {t("ui2.ui.welt.Verhandlungstisch.17fd837")}
          </h4>
          <ul className="we-klauseln">
            {verlangt.map((k) => (
              <KlauselKarte key={k.def.id} k={k} partner={l.name} gewaehlt={will.includes(k.def.id)} veto={veto(k.def.id)} onToggle={() => { setWill(auf(will, k.def.id)); setAntwort(null); }} />
            ))}
          </ul>
        </div>
      </div>
    </section>
    {/* Die Leiste steht außerhalb des Tisch-Containers: Ein klebendes Element rutscht nicht über den Anfang seines Containers hinaus, in kleinen Fenstern hing sie sonst unter dem Fensterrand */}
    <div className="we-leiste">
      <div className="we-leiste-stimmung" aria-live="polite">
        <Waage stimmung={nichts ? -1 : b.stimmung} urteil={nichts ? "leer" : b.urteil} />
        <span>{stimmungText}</span>
      </div>
      <div className="we-laufzeit" role="radiogroup" aria-label={t("ui2.ui.welt.Verhandlungstisch.f16dc6c")}>
        <span>{t("ui2.ui.welt.Verhandlungstisch.f16dc6c")}</span>
        {VERTRAGSLAUFZEITEN.map((j) => (
          <button key={j} type="button" role="radio" aria-checked={jahre === j} className={jahre === j ? "an" : ""} onClick={() => setJahre(j)} title={j === 2 ? t("ui2.ui.welt.Verhandlungstisch.1e30fb0") : j === 10 ? t("ui2.ui.welt.Verhandlungstisch.a1424ff") : t("ui2.ui.welt.Verhandlungstisch.2dfa660")}>
            {t("ui2.ui.welt.Verhandlungstisch.9bf247c", { p0: j })}
          </button>
        ))}
      </div>
      <div className="we-abgabe">
        {rest > 0 ? (
          <span className="we-sperre">{t("ui2.ui.welt.Verhandlungstisch.c82e52f", { p0: l.name, p1: rest })}</span>
        ) : (
          <>
            <span className={`we-kosten${nurAufPump(kapital, b.pk) ? " pump" : ""}`}>
              {t("ui2.ui.welt.Verhandlungstisch.9bc1843")} <b>{b.pk}</b> {t("ui2.ui.welt.Verhandlungstisch.28d438e")}{nurAufPump(kapital, b.pk) ? t("ui2.ui.welt.Verhandlungstisch.398e48f") : ""}
            </span>
            <button type="button" className="brass-button we-senden" disabled={nichts || !kannBezahlen} onClick={unterbreite}>
              {b.urteil === "veto" ? t("ui2.ui.welt.Verhandlungstisch.8269976") : t("ui2.ui.welt.Verhandlungstisch.c496d92")}
            </button>
          </>
        )}
      </div>
    </div>
    </>
  );
}

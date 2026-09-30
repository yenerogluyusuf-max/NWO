// Der Verhandlungstisch: links, was die Türkei bietet, rechts, was sie verlangt; in der Mitte die Stimmung der Gegenseite mit den
// Gründen in Grün und Rot. Jede Klausel zeigt, was sie im eigenen Land bewirkt (Wirkung und Kehrseite) und was sie dem Partner wert ist.
// Prüfen kostet nichts; ein Angebot zu unterbreiten kostet Kapital und hat Folgen (Zustimmung, Gegenangebot, Zurückweisung).

import { useMemo, useState } from "react";
import type { World } from "../../sim/types";
import { land, weltZustand } from "../../sim/laender";
import { VERTRAGSLAUFZEITEN, type Laufzeit } from "../../data/abkommen";
import { STIMMUNG_WORT, bewerte, heimWirkung, klauselnFuer, nimmGegenangebot, sperreRest, verhandle, type Angebot, type Ergebnis, type KlauselSicht } from "../../sim/abkommen";
import { kannZahlen, nurAufPump } from "../../sim/kapital";
import { Flagge } from "../art/Flaggen";

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
            <b className="we-pk" title="Politischer Preis im eigenen Land, in Kapital">
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
              <em>{gibt ? `Wert für ${partner}` : `Preis für ${partner}`}</em>
              {k.wert < -50 ? <b className="we-rot">Rote Linie</b> : <Punkte n={punkte(k.wert)} ton={gibt ? "gut" : "schlecht"} />}
            </span>
            {zeilen.length > 0 && (
              <ul className="we-wirkung" aria-label="Wirkung im eigenen Land">
                {zeilen.map((z, i) => (
                  <li key={i} className={z.gut ? "we-gut" : "we-schlecht"}>
                    <span aria-hidden>{z.richtung > 0 ? "▲" : "▼"}</span> {z.text}
                  </li>
                ))}
              </ul>
            )}
            {gewaehlt && <span className="we-kehrseite">Kehrseite: {k.def.kehrseite}</span>}
          </>
        )}
      </button>
    </li>
  );
}

function Waage({ stimmung, urteil }: { stimmung: number; urteil: string }) {
  return (
    <div className={`we-waage u-${urteil}`} role="img" aria-label={`Stimmung: ${STIMMUNG_WORT[stimmung as 0]}`}>
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
  if (!world.spiel) return null;
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
  }

  function nimmAn(a: Angebot) {
    const r = nimmGegenangebot(world, a);
    setAntwort(r);
    if (r.ok) {
      setGibt([]);
      setWill([]);
    }
    refresh();
  }

  return (
    <section className="we-tisch" aria-label={`Verhandlungstisch mit ${l.name}`}>
      <p className="we-tisch-kopf">
        Stellen Sie ein Paket zusammen. Was {l.name} davon hält, sehen Sie sofort; erst das Angebot selbst kostet Kapital. Rechts steht, was Sie im eigenen Land bekommen, und was es kostet.
      </p>

      <div className="we-spalten">
        <div className="we-spalte">
          <h4>
            <Flagge id="TUR" breite={22} /> Wir bieten
          </h4>
          <ul className="we-klauseln">
            {bietet.map((k) => (
              <KlauselKarte key={k.def.id} k={k} partner={l.name} gewaehlt={gibt.includes(k.def.id)} veto={veto(k.def.id)} onToggle={() => { setGibt(auf(gibt, k.def.id)); setAntwort(null); }} />
            ))}
          </ul>
        </div>

        <div className="we-mitte">
          <div className="we-stimmung">
            <Flagge id={landId} breite={44} rund titel={l.name} />
            <strong>{nichts ? "Noch kein Angebot" : b.urteil === "veto" ? "Rote Linie" : STIMMUNG_WORT[b.stimmung]}</strong>
            <Waage stimmung={nichts ? 0 : b.stimmung} urteil={nichts ? "leer" : b.urteil} />
            <span className="we-urteil">
              {nichts ? "Wählen Sie Klauseln links und rechts." : b.urteil === "zustimmung" ? `${l.name} würde zustimmen.` : b.urteil === "veto" ? b.veto : b.urteil === "gegenangebot" ? `${l.name} würde ein Gegenangebot machen.` : `${l.name} würde ablehnen.`}
            </span>
          </div>
          {!nichts && (
            <ul className="we-gruende" aria-label="Gründe der Gegenseite">
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

        <div className="we-spalte">
          <h4>
            <Flagge id={landId} breite={22} titel={l.name} /> Wir verlangen
          </h4>
          <ul className="we-klauseln">
            {verlangt.map((k) => (
              <KlauselKarte key={k.def.id} k={k} partner={l.name} gewaehlt={will.includes(k.def.id)} veto={veto(k.def.id)} onToggle={() => { setWill(auf(will, k.def.id)); setAntwort(null); }} />
            ))}
          </ul>
        </div>
      </div>

      <div className="we-leiste">
        <div className="we-laufzeit" role="radiogroup" aria-label="Laufzeit">
          <span>Laufzeit</span>
          {VERTRAGSLAUFZEITEN.map((j) => (
            <button key={j} type="button" role="radio" aria-checked={jahre === j} className={jahre === j ? "an" : ""} onClick={() => setJahre(j)} title={j === 2 ? "Kurz: schwächere Dauerwirkung, leichter zu bekommen" : j === 10 ? "Lang: stärkere Dauerwirkung, das Land verlangt mehr Vertrauen, ein Bruch wiegt schwer" : "Standard"}>
              {j} Jahre
            </button>
          ))}
        </div>
        <div className="we-abgabe">
          {rest > 0 ? (
            <span className="we-sperre">{l.name} spricht erst in {rest} Tagen wieder mit Ihnen.</span>
          ) : (
            <>
              <span className={`we-kosten${nurAufPump(kapital, b.pk) ? " pump" : ""}`}>
                Kosten <b>{b.pk}</b> Kapital{nurAufPump(kapital, b.pk) ? " (auf Pump)" : ""}
              </span>
              <button type="button" className="brass-button we-senden" disabled={nichts || !kannBezahlen} onClick={unterbreite}>
                {b.urteil === "veto" ? "Trotzdem vorlegen" : "Angebot unterbreiten"}
              </button>
            </>
          )}
        </div>
      </div>

      {antwort && (
        <div className={`we-antwort u-${antwort.urteil}`} role="status">
          <span className="we-stempel" aria-hidden>
            {antwort.urteil === "zustimmung" ? "Einigung" : antwort.urteil === "gegenangebot" ? "Gegenangebot" : antwort.urteil === "veto" ? "Rote Linie" : antwort.urteil === "ablehnung" ? "Abgelehnt" : "Nicht möglich"}
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
                      Annehmen
                    </button>
                    <button type="button" className="link" onClick={() => { laden(g.angebot); setAntwort(null); }}>
                      In den Tisch übernehmen
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {antwort.urteil === "zustimmung" && vertraegeLaufen > 0 && onVertraege && (
            <button type="button" className="link" onClick={onVertraege}>
              Zu den laufenden Verträgen
            </button>
          )}
        </div>
      )}
    </section>
  );
}

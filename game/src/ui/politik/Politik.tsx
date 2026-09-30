// Politik nach Bereichen: links alle Themenfelder mit Ampel, rechts der gewählte Bereich mit Lage, akuten Problemen, Vorschlägen
// und allen Maßnahmen. Jede Zeile führt zu einer Entscheidung: Ein Klick öffnet die Maßnahme mit Stufen, Folgen, Kosten und Weg.
// Ohne Auswahl zeigt die Ansicht alle Bereiche als Kacheln („Überblick“).

import { useEffect, useMemo, useRef, useState } from "react";
import type { World } from "../../sim/types";
import { NET } from "../../sim/modell";
import { bringeEin, stufeIn } from "../../sim/handeln";
import { handlungsHebel } from "../../sim/wege";
import { nationalAverage } from "../../sim/netz";
import { tunWort } from "../../data/skalen";
import type { Theme } from "../../data/politiknetz";
import type { Vorschlag } from "../../sim/vorschlaege";
import { NetView } from "../NetView";
import { VorschlagKarte } from "./VorschlagKarte";
import { EINHEIT, alleBereiche, alleVorschlaege, bereichStand, vorschlaegeIn, type Ampel, type BereichKurz, type LageZeile } from "./bereiche";
import "./politik.css";

const nf = (x: number) => x.toLocaleString("de-DE", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const nc = (x: number) => x.toLocaleString("de-DE", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

const AMPEL_WORT: Record<Ampel, string> = { gruen: "ruhig", gelb: "Achtung", rot: "angespannt" };

/** Was geöffnet ist: ein Knoten des Netzes (Maßnahme, Größe, Problem) mit voreingestellter Stufe und Ort. */
export interface Offen {
  id: string;
  level?: number;
  ort?: number[] | null;
}

export function AmpelPunkt({ ampel, klein }: { ampel: Ampel; klein?: boolean }) {
  return <span className={`po-ampel po-${ampel}${klein ? " klein" : ""}`} role="img" aria-label={`Lage: ${AMPEL_WORT[ampel]}`} title={`Lage: ${AMPEL_WORT[ampel]}`} />;
}

function Trend({ z }: { z: LageZeile }) {
  if (z.besser === null) return null;
  return (
    <em className={`po-trend ${z.besser ? "gut" : "schlecht"}`} title={`Seit dem Amtsantritt ${z.delta > 0 ? "gestiegen" : "gesunken"} um ${nf(Math.abs(z.delta))}: ${z.besser ? "besser" : "schlechter"}`}>
      {z.delta > 0 ? "▲" : "▼"}
    </em>
  );
}

function LageBalken({ z, onKlick }: { z: LageZeile; onKlick: () => void }) {
  const pos = Math.max(0, Math.min(100, z.jetzt));
  const start = Math.max(0, Math.min(100, z.start));
  return (
    <li>
      <button className={`po-lage b-${z.bewertung}`} onClick={onKlick} title={`${z.name}: was Sie tun können ansehen`}>
        <span className="po-lage-name">{z.name}</span>
        {z.input ? (
          <span className="po-lage-wert">
            {nf(z.jetzt)} <small>{EINHEIT[z.id] ?? ""}</small>
          </span>
        ) : (
          <>
            <span className="po-balken" aria-hidden>
              <i style={{ width: `${pos}%` }} />
              <b style={{ left: `${start}%` }} title="beim Amtsantritt" />
            </span>
            <span className="po-lage-wert">
              {Math.round(z.jetzt)} <Trend z={z} />
            </span>
          </>
        )}
      </button>
    </li>
  );
}

export function Politik({
  world,
  refresh,
  onDecided,
  onShowOnMap,
  onEingriff,
  onOpen,
  start,
  startOffen,
}: {
  world: World;
  refresh: () => void;
  onDecided: () => void;
  onShowOnMap?: (id: string) => void;
  onEingriff?: (option: string) => void;
  /** Andere Akten öffnen (Wirtschaft, Heute, Programme) */
  onOpen?: (ziel: "wirtschaft" | "bereiche" | "programme" | "parlament") => void;
  start?: Theme;
  /** Öffnet gleich eine Maßnahme (etwa aus „Heute“ oder vom Schreibtisch) */
  startOffen?: Offen;
}) {
  const [bereich, setBereich] = useState<Theme | null>(() => {
    if (start) return start;
    const t = startOffen ? NET.nodes[NET.index.get(startOffen.id)!]?.theme : undefined;
    return t && t !== "gruppen" ? (t as Theme) : null;
  });
  const [offen, setOffen] = useState<Offen | null>(startOffen ?? null);
  const [alleLage, setAlleLage] = useState(false);
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const spiel = world.spiel;
  const wurzel = useRef<HTMLDivElement>(null);
  // Wer den Bereich wechselt oder eine Maßnahme öffnet, beginnt oben
  useEffect(() => {
    wurzel.current?.closest(".dossier-body")?.scrollTo({ top: 0 });
  }, [bereich, offen]);

  // Die Rechnungen sind aufwendig: nur neu, wenn sich Tag, Kapital, Gesetze oder Umsetzungen ändern
  const schluessel = `${world.day}|${Math.floor(spiel?.kapital ?? 0)}|${spiel?.gesetze.length ?? 0}|${Object.keys(world.net.targets).length}|${Object.keys(world.net.ziele ?? {}).length}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const kurz = useMemo(() => alleBereiche(world), [schluessel]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const vorschlaege = useMemo(() => alleVorschlaege(world), [schluessel]);

  function oeffne(o: Offen) {
    setAntwort(null);
    setOffen(o);
  }
  const stelle = (id: string, richtung: 1 | -1, ort: number[] | null) => oeffne({ id, ort, level: Math.max(0, Math.min(100, Math.round(stufeIn(world, id, ort)) + 20 * richtung)) });
  const einstellen = (v: Vorschlag) => oeffne({ id: v.massnahme, level: v.ziel, ort: v.ort });
  const sofort = (v: Vorschlag) => {
    setAntwort(bringeEin(world, v.massnahme, v.ziel, v.ort, "gesetz"));
    refresh();
  };

  const aktuell = kurz.find((k) => k.theme === bereich) ?? null;

  if (offen) {
    return (
      <div className="po po-nur" ref={wurzel}>
        <NetView
          key={`${offen.id}|${offen.level ?? ""}|${offen.ort?.join(",") ?? "land"}`}
          world={world}
          onDecided={onDecided}
          {...(onShowOnMap ? { onShowOnMap } : {})}
          {...(onEingriff ? { onEingriff } : {})}
          initialMassnahme={offen.id}
          {...(offen.level !== undefined ? { initialLevel: offen.level } : {})}
          initialOrt={offen.ort ?? null}
          initialTheme={NET.nodes[NET.index.get(offen.id)!]!.theme as Theme}
          eingebettet={{ zurueck: aktuell ? `Zurück zu ${aktuell.name}` : "Zurück zu den Bereichen", onZurueck: () => setOffen(null) }}
        />
      </div>
    );
  }

  return (
    <div className="po" ref={wurzel}>
      <nav className="po-rail" aria-label="Bereiche der Politik">
        <button className={`po-rail-eintrag${bereich === null ? " on" : ""}`} onClick={() => setBereich(null)} aria-current={bereich === null ? "page" : undefined}>
          <span className="po-rail-name">Überblick</span>
        </button>
        {kurz.map((k) => (
          <button key={k.theme} className={`po-rail-eintrag${bereich === k.theme ? " on" : ""}`} onClick={() => { setBereich(k.theme); setAlleLage(false); setAntwort(null); }} aria-current={bereich === k.theme ? "page" : undefined}>
            <AmpelPunkt ampel={k.ampel} klein />
            <span className="po-rail-name">{k.name}</span>
            {k.akut > 0 && <span className="po-rail-akut" title={`${k.akut} akute Probleme`}>{k.akut}</span>}
          </button>
        ))}
      </nav>

      <div className="po-seite">
        {aktuell === null ? (
          <Ueberblick kurz={kurz} onWaehle={setBereich} onOpen={onOpen} />
        ) : (
          <BereichSeite
            world={world}
            kurz={aktuell}
            vorschlaege={vorschlaegeIn(vorschlaege, aktuell.theme)}
            alleLage={alleLage}
            setAlleLage={setAlleLage}
            antwort={antwort}
            oeffne={oeffne}
            stelle={stelle}
            einstellen={einstellen}
            sofort={sofort}
            onOpen={onOpen}
          />
        )}
      </div>
    </div>
  );
}

function Ueberblick({ kurz, onWaehle, onOpen }: { kurz: BereichKurz[]; onWaehle: (t: Theme) => void; onOpen?: (ziel: "bereiche") => void }) {
  const angespannt = kurz.filter((k) => k.ampel === "rot").sort((a, b) => b.akut - a.akut);
  return (
    <>
      <header className="po-kopf">
        <h3>Alle Bereiche</h3>
      </header>
      <p className="po-hinweis">
        {angespannt.length > 0 ? (
          <>
            <strong>Angespannt:</strong>{" "}
            {angespannt.map((k, i) => (
              <span key={k.theme}>
                {i > 0 && " · "}
                <button className="link" onClick={() => onWaehle(k.theme)}>
                  {k.name}
                </button>
                {k.akut > 0 && ` (${k.akut} akut)`}
              </span>
            ))}
            .
          </>
        ) : (
          <>Kein Bereich ist angespannt.</>
        )}{" "}
        {onOpen && (
          <>
            Die Vorhaben mit der größten Wirkung stehen unter{" "}
            <button className="link" onClick={() => onOpen("bereiche")}>
              Heute
            </button>
            .
          </>
        )}
      </p>
      <div className="po-kacheln">
        {kurz.map((k) => (
          <button key={k.theme} className={`po-kachel po-r-${k.ampel}`} onClick={() => onWaehle(k.theme)}>
            <span className="po-kachel-kopf">
              <AmpelPunkt ampel={k.ampel} />
              <strong>{k.name}</strong>
            </span>
            <span className="po-kachel-text">{k.text}</span>
            <span className="po-kachel-stand" title={k.ampelGrund}>
              {AMPEL_WORT[k.ampel]}
              {k.akut > 0 ? ` · ${k.akut} akut` : ""}
              {k.laufend > 0 ? ` · ${k.laufend} ${k.laufend === 1 ? "Vorhaben läuft" : "Vorhaben laufen"}` : ""}
            </span>
            <ul className="po-signale">
              {k.signale.map((s) => (
                <li key={s.id}>
                  <span>{s.name}</span>
                  <strong>
                    {Math.round(s.jetzt)} <Trend z={s} />
                  </strong>
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </>
  );
}

function BereichSeite({
  world,
  kurz,
  vorschlaege,
  alleLage,
  setAlleLage,
  antwort,
  oeffne,
  stelle,
  einstellen,
  sofort,
  onOpen,
}: {
  world: World;
  kurz: BereichKurz;
  vorschlaege: Vorschlag[];
  alleLage: boolean;
  setAlleLage: (b: boolean) => void;
  antwort: { ok: boolean; text: string; why?: string } | null;
  oeffne: (o: Offen) => void;
  stelle: (id: string, richtung: 1 | -1, ort: number[] | null) => void;
  einstellen: (v: Vorschlag) => void;
  sofort: (v: Vorschlag) => void;
  onOpen?: (ziel: "wirtschaft" | "bereiche" | "programme" | "parlament") => void;
}) {
  const stand = useMemo(
    () => bereichStand(world, kurz.theme),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kurz, world.day, world.spiel?.gesetze.length, Object.keys(world.net.targets).length],
  );
  const mittel = (id: string) => nationalAverage(NET, world.net, id);
  const lageSortiert = [...stand.lage].sort((a, b) => Number(b.bewertung === "schlecht") - Number(a.bewertung === "schlecht") || Math.abs(b.delta) - Math.abs(a.delta));
  const lageSicht = alleLage ? lageSortiert : lageSortiert.slice(0, 6);
  const kapital = world.spiel?.kapital;

  return (
    <>
      <header className="po-kopf">
        <div className="po-titelzeile">
          <AmpelPunkt ampel={stand.ampel} />
          <h3>{stand.name}</h3>
          <span className={`po-lagewort po-l-${stand.ampel}`} title={stand.ampelGrund}>
            {AMPEL_WORT[stand.ampel]}
          </span>
        </div>
        <p className="subtitle">{stand.text}</p>
        <p className="po-kennzeile">
          {stand.probleme.length > 0 ? <span className="schlecht">{stand.probleme.length} akut</span> : <span>kein akutes Problem</span>}
          <span>{stand.laufend > 0 ? `${stand.laufend} ${stand.laufend === 1 ? "Vorhaben läuft" : "Vorhaben laufen"}` : "kein Vorhaben unterwegs"}</span>
          {stand.besser + stand.schlechter > 0 && (
            <span>
              {stand.besser} besser, {stand.schlechter} schlechter seit dem Amtsantritt
            </span>
          )}
          {kapital !== undefined && (
            <span>
              Kapital <b>{Math.floor(kapital)}</b>
            </span>
          )}
        </p>
        <p className="po-grund">{stand.ampelGrund}</p>
      </header>

      {antwort && (
        <p className={`rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
          {antwort.text}
          {antwort.why && <em> {antwort.why}</em>}
        </p>
      )}

      {stand.probleme.length > 0 && (
        <section className="po-block">
          <h4>Akute Probleme</h4>
          <ul className="po-probleme">
            {stand.probleme.map((p) => {
              const orte = p.provinzen;
              const hebel = handlungsHebel(mittel, p.id, -1, 2);
              return (
                <li key={p.id}>
                  <div className="po-problem-kopf">
                    <button className="link" onClick={() => oeffne({ id: p.id })}>
                      <strong>{p.name}</strong>
                    </button>
                    <span>
                      in {orte.length} {orte.length === 1 ? "Provinz" : "Provinzen"}, betrifft {Math.round(p.last * 100)} % der Menschen
                    </span>
                  </div>
                  <div className="po-hebel">
                    {hebel.length === 0 && <span className="subtitle">Alle Hebel sind schon weit ausgebaut.</span>}
                    {hebel.map((h) => (
                      <button key={`${h.massnahme}-${h.richtung}`} className="aktion-knopf" onClick={() => stelle(h.massnahme, h.richtung, orte.length > 0 && orte.length <= 50 ? orte : null)} title={`wirkt ${h.wirkung}`}>
                        {h.name} {tunWort(h.massnahme, h.richtung)}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="po-block">
        <h4>Lage</h4>
        <ul className="po-lageliste">
          {lageSicht.map((z) => (
            <LageBalken key={z.id} z={z} onKlick={() => oeffne({ id: z.id })} />
          ))}
        </ul>
        {lageSortiert.length > 6 && (
          <button className="link" onClick={() => setAlleLage(!alleLage)}>
            {alleLage ? "Weniger anzeigen" : `Alle ${lageSortiert.length} Größen anzeigen`}
          </button>
        )}
        <p className="po-legende">Balken: Index 0 bis 100, der Strich zeigt den Stand beim Amtsantritt. ▲ ▼ zeigen die Veränderung seit damals, grün ist besser, rot schlechter.</p>
        {(kurz.theme === "wirtschaft" || kurz.theme === "haushalt") && onOpen && (
          <p className="po-legende">
            Inflation, Zins, Lira und Zentralbank: <button className="link" onClick={() => onOpen("wirtschaft")}>Wirtschaft ansehen</button>
          </p>
        )}
      </section>

      {vorschlaege.length > 0 && (
        <section className="po-block">
          <h4>Was hier jetzt hilft</h4>
          <ol className="vorschlag-liste">
            {vorschlaege.map((v) => (
              <VorschlagKarte key={v.massnahme} v={v} onEinstellen={einstellen} onSofort={sofort} kompakt />
            ))}
          </ol>
        </section>
      )}

      <section className="po-block">
        <h4>Maßnahmen</h4>
        <p className="subtitle">Jede Maßnahme lässt sich in Stufen einstellen; danach zeigt das Spiel Folgen, Kosten, die Mehrheit und den Weg (Gesetz oder Erlass).</p>
        <ul className="po-massnahmen">
          {stand.massnahmen.map((m) => (
            <li key={m.id} className={m.imParlament || m.ziel !== undefined ? "laeuft" : ""}>
              <div className="po-m-text">
                <strong>{m.name}</strong>
                <span className="po-m-stand">
                  {m.stufe}
                  {m.ziel !== undefined && <em> → Umsetzung läuft auf {Math.round(m.ziel)}</em>}
                  {m.imParlament && <em> · im Parlament: Stufe {Math.round(m.imParlament.stufe)}, Abstimmung in {m.imParlament.tage} Tagen</em>}
                </span>
                <span className="po-m-beschr">{m.text}</span>
                {m.kosten > 0 && (
                  <span className="po-m-kosten">
                    Haushalt: {m.einnahme ? "Einnahmen" : "Kosten"} heute {nc(m.kosten)} % des BIP
                  </span>
                )}
              </div>
              <button className="aktion-knopf" onClick={() => oeffne({ id: m.id })}>
                Ändern
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

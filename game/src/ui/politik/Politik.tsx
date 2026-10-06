// Politik nach Bereichen: links alle Themenfelder mit Ampel, rechts der gewählte Bereich mit Lage, akuten Problemen, Vorschlägen
// und allen Maßnahmen. Jede Zeile führt zu einer Entscheidung: Ein Klick öffnet die Maßnahme mit Stufen, Folgen, Kosten und Weg.
// Ohne Auswahl zeigt die Ansicht alle Bereiche als Kacheln („Überblick“). Gestaltung: politik/design.css (Klassen .pd-).

import { useEffect, useMemo, useRef, useState } from "react";
import type { World } from "../../sim/types";
import { NET } from "../../sim/modell";
import { bringeEin, stufeIn } from "../../sim/handeln";
import { aktiveKrisen, type KrisenSicht } from "../../sim/krisen";
import { handlungsHebel } from "../../sim/wege";
import { nationalAverage } from "../../sim/netz";
import { tunSatz } from "../../data/skalen";
import type { Theme } from "../../data/politiknetz";
import type { Vorschlag } from "../../sim/vorschlaege";
import { NetView } from "../NetView";
import { VorschlagKarte } from "./VorschlagKarte";
import { Emblem, Medaille, embleme } from "./embleme";
import { EINHEIT, alleBereiche, alleVorschlaege, bereichStand, vorschlaegeIn, type Ampel, type BereichKurz, type LageZeile } from "./bereiche";
import "./politik.css";
import "./design.css";

import { t } from "../../i18n";
import { t as tx } from "../../i18n";
const nf = (x: number) => x.toLocaleString("de-DE", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const nc = (x: number) => x.toLocaleString("de-DE", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

const AMPEL_WORT: Record<Ampel, string> = { gruen: "ruhig", gelb: "Achtung", rot: "angespannt" };
const AMPEL_PILL: Record<Ampel, string> = { gruen: "gut", gelb: "warn", rot: "schlecht" };

/** Was geöffnet ist: ein Knoten des Netzes (Maßnahme, Größe, Problem) mit voreingestellter Stufe und Ort. */
export interface Offen {
  id: string;
  level?: number;
  ort?: number[] | null;
}

export function AmpelPunkt({ ampel, klein }: { ampel: Ampel; klein?: boolean }) {
  return <span className={`po-ampel po-${ampel}${klein ? " klein" : ""}`} role="img" aria-label={tx("ui2.ui.politik.Politik.2ddbf6f", { p0: AMPEL_WORT[ampel] })} title={tx("ui2.ui.politik.Politik.2ddbf6f", { p0: AMPEL_WORT[ampel] })} />;
}

/** Zustandszeile der aktiven Krisen (MIL-3): Name, Grund und die Restbedingung, an der sie enden. */
export function KrisenBanner({ krisen }: { krisen: KrisenSicht[] }) {
  if (krisen.length === 0) return null;
  return (
    <ul className="po-krisen" aria-label={tx("ui2.ui.politik.Politik.5de3954")}>
      {krisen.map((k) => (
        <li key={k.id}>
          <strong>{k.name}.</strong> {k.grund} <em>{k.bedingung}</em>
        </li>
      ))}
    </ul>
  );
}

/** Badge an einer betroffenen Maßnahme: gesperrt (gestrichelt) oder verteuert/verbilligt (durchgezogen). */
function BlockerBadge({ blocker }: { blocker: { art: "gesperrt" | "teuer"; faktor: number; titel: string } }) {
  const text = blocker.art === "gesperrt" ? "Gesperrt" : blocker.faktor > 1 ? `Teurer (×${nf(blocker.faktor)})` : `Günstiger (−${Math.round((1 - blocker.faktor) * 100)} %)`;
  const klasse = blocker.art === "gesperrt" ? "gesperrt" : blocker.faktor > 1 ? "teuer" : "guenstig";
  return (
    <span className={`po-blocker po-b-${klasse}`} title={blocker.titel}>
      {text}
    </span>
  );
}

function Trend({ z }: { z: LageZeile }) {
  if (z.besser === null) return null;
  return (
    <em className={`po-trend ${z.besser ? "gut" : "schlecht"}`} title={tx("ui2.ui.politik.Politik.bc7a271", { p0: z.delta > 0 ? "gestiegen" : "gesunken", p1: nf(Math.abs(z.delta)), p2: z.besser ? "besser" : "schlechter" })}>
      {z.delta > 0 ? "▲" : "▼"}
    </em>
  );
}

function LageBalken({ z, onKlick }: { z: LageZeile; onKlick: () => void }) {
  const pos = Math.max(0, Math.min(100, z.jetzt));
  const start = Math.max(0, Math.min(100, z.start));
  return (
    <li>
      <button className={`po-lage b-${z.bewertung}`} onClick={onKlick} title={tx("ui2.ui.politik.Politik.1f21571", { p0: z.name })}>
        <span className="po-lage-name">{z.name}</span>
        {z.input ? (
          <span className="po-lage-wert">
            {nf(z.jetzt)} <small>{EINHEIT[z.id] ?? ""}</small>
          </span>
        ) : (
          <>
            <span className="po-balken" aria-hidden>
              <i style={{ width: `${pos}%` }} />
              <b style={{ left: `${start}%` }} title={tx("ui2.ui.politik.Politik.130b865")} />
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
  const krisen = aktiveKrisen(world);

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
      <nav className="po-rail" aria-label={t("ui.politik.Politik.1100782")}>
        <button className={`po-rail-eintrag${bereich === null ? " on" : ""}`} onClick={() => setBereich(null)} aria-current={bereich === null ? "page" : undefined}>
          <span className="po-rail-name">{t("ui.politik.Politik.8f96328")}</span>
        </button>
        {kurz.map((k) => (
          <button key={k.theme} className={`po-rail-eintrag${bereich === k.theme ? " on" : ""}`} onClick={() => { setBereich(k.theme); setAlleLage(false); setAntwort(null); }} aria-current={bereich === k.theme ? "page" : undefined}>
            <span className={`pd-ring ${k.ampel}`} role="img" aria-label={tx("ui2.ui.politik.Politik.2ddbf6f", { p0: AMPEL_WORT[k.ampel] })} title={tx("ui2.ui.politik.Politik.2ddbf6f", { p0: AMPEL_WORT[k.ampel] })}>
              <Emblem name={embleme(k.theme)} size={16} />
            </span>
            <span className="po-rail-name">{k.name}</span>
            {k.akut > 0 && <span className="po-rail-akut" title={tx("ui2.ui.politik.Politik.3253986", { p0: k.akut })}>{k.akut}</span>}
          </button>
        ))}
      </nav>

      <div className="po-seite">
        <KrisenBanner krisen={krisen} />
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
  const zahl = (a: Ampel) => kurz.filter((k) => k.ampel === a).length;
  const akutGesamt = kurz.reduce((n, k) => n + k.akut, 0);
  // Angespannte Bereiche zuerst, dann nach Zahl der akuten Probleme; innerhalb gleicher Lage bleibt die feste Reihenfolge
  const rang: Record<Ampel, number> = { rot: 0, gelb: 1, gruen: 2 };
  const sortiert = kurz.map((k, i) => ({ k, i })).sort((a, b) => rang[a.k.ampel] - rang[b.k.ampel] || b.k.akut - a.k.akut || a.i - b.i).map((x) => x.k);
  return (
    <>
      <header className="pd-seitenkopf">
        <div>
          <p className="pd-ueber">{tx("ui2.ui.politik.Politik.df56d5e")}</p>
          <h3>{tx("ui2.ui.politik.Politik.d66458f")}</h3>
          <p className="pd-lead">
            {angespannt.length > 0 ? (
              <>
                {tx("ui2.ui.politik.Politik.9c4163b")}{" "}
                {angespannt.slice(0, 3).map((k, i) => (
                  <span key={k.theme}>
                    {i > 0 && (i === Math.min(3, angespannt.length) - 1 ? tx("ui2.ui.politik.Politik.e2e6180") : ", ")}
                    <button className="pd-btn quiet" onClick={() => onWaehle(k.theme)}>
                      {k.name}
                    </button>
                  </span>
                ))}
                .{" "}
              </>
            ) : (
              <>{tx("ui2.ui.politik.Politik.ce216ee")} </>
            )}
            {onOpen && (
              <>
                {tx("ui2.ui.politik.Politik.f4f01f0")}{" "}
                <button className="pd-btn quiet" onClick={() => onOpen("bereiche")}>
                  {tx("ui2.ui.politik.Politik.1ab3309")}
                </button>
                .
              </>
            )}
          </p>
        </div>
        <ul className="pd-zaehler" aria-label={t("ui.politik.Politik.8eec19c")}>
          <li className={zahl("rot") > 0 ? "hell rot" : ""}>
            <b>{zahl("rot")}</b>
            <span>angespannt</span>
          </li>
          <li>
            <b>{zahl("gelb")}</b>
            <span>{tx("ui2.ui.politik.Politik.fe6ddf0")}</span>
          </li>
          <li>
            <b>{zahl("gruen")}</b>
            <span>ruhig</span>
          </li>
          <li>
            <b>{akutGesamt}</b>
            <span>{tx("ui2.ui.politik.Politik.df425a2")}</span>
          </li>
        </ul>
      </header>
      <div className="pd-kacheln">
        {sortiert.map((k) => (
          <button key={k.theme} className={`pd-kachel ${k.ampel}`} onClick={() => onWaehle(k.theme)}>
            <span className="pd-kachel-kopf">
              <Medaille name={embleme(k.theme)} groesse="klein" />
              <strong>{k.name}</strong>
            </span>
            <span className="pd-kachel-stand" title={k.ampelGrund}>
              <span className={`pd-pill ${AMPEL_PILL[k.ampel]}`}>{AMPEL_WORT[k.ampel]}</span>
              {k.akut > 0 && <span className="pd-chip schlecht">{k.akut} akut</span>}
              {k.laufend > 0 && <span className="pd-chip" title={`${k.laufend} ${k.laufend === 1 ? "Vorhaben läuft" : "Vorhaben laufen"}`}>{tx("ui2.ui.politik.Politik.790441d", { p0: k.laufend })}</span>}
            </span>
            <span className="pd-kachel-text">{k.text}</span>
            <ul className="pd-signale">
              {k.signale.map((s) => (
                <li key={s.id}>
                  <span className="pd-signal-name">{s.name}</span>
                  <span className={`pd-mini b-${s.bewertung}`} aria-hidden>
                    <i style={{ width: `${Math.max(0, Math.min(100, s.jetzt))}%` }} />
                  </span>
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
  // Laufende Maßnahmen zuerst: Sie brauchen Aufmerksamkeit, der Rest ist Vorrat
  const massnahmen = [...stand.massnahmen].sort((a, b) => Number(Boolean(b.imParlament || b.ziel !== undefined || b.umsetzung)) - Number(Boolean(a.imParlament || a.ziel !== undefined || a.umsetzung)));

  return (
    <>
      <header className="pd-bereich-kopf">
        <Medaille name={embleme(kurz.theme)} groesse="gross" />
        <div className="pd-bereich-titel">
          <p className="pd-ueber">{tx("ui2.ui.politik.Politik.7a3ac9a")}</p>
          <h3>{stand.name}</h3>
          <p className="pd-lead">{stand.text}</p>
        </div>
        <span className={`pd-pill gross ${AMPEL_PILL[stand.ampel]}`} title={stand.ampelGrund}>
          {AMPEL_WORT[stand.ampel]}
        </span>
      </header>

      <ul className="pd-kennzahlen" aria-label={t("ui.politik.Politik.b7f486b")}>
        <li className={stand.probleme.length > 0 ? "rot" : ""}>
          <b>{stand.probleme.length}</b>
          <span>{stand.probleme.length === 1 ? tx("ui2.ui.politik.Politik.6944fe6") : tx("ui2.ui.politik.Politik.df425a2")}</span>
        </li>
        <li>
          <b>{stand.laufend}</b>
          <span>{stand.laufend === 1 ? tx("ui2.ui.politik.Politik.672ba95") : tx("ui2.ui.politik.Politik.870b084")}</span>
        </li>
        {stand.besser + stand.schlechter > 0 && (
          <li>
            <b>
              <span className="gut">{stand.besser} ▲</span> <span className="schlecht">{stand.schlechter} ▼</span>
            </b>
            <span>{t("ui.politik.Politik.a31e13e")}</span>
          </li>
        )}
        {kapital !== undefined && (
          <li>
            <b>{Math.floor(kapital)}</b>
            <span>{t("ui.politik.Politik.353f9d6")}</span>
          </li>
        )}
      </ul>
      <p className="pd-grund">{stand.ampelGrund}</p>

      {antwort && (
        <p className={`rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
          {antwort.text}
          {antwort.why && <em> {antwort.why}</em>}
        </p>
      )}

      {stand.probleme.length > 0 && (
        <section className="pd-block">
          <h4>{tx("ui2.ui.politik.Politik.45a7713")}</h4>
          <ul className="pd-probleme">
            {stand.probleme.map((p) => {
              const orte = p.provinzen;
              const hebel = handlungsHebel(mittel, p.id, -1, 2);
              return (
                <li key={p.id} className="pd-problem">
                  <div className="pd-problem-kopf">
                    <button className="pd-titelknopf" onClick={() => oeffne({ id: p.id })}>
                      {p.name}
                    </button>
                    <span className="pd-chip">
                      {orte.length} {orte.length === 1 ? tx("ui2.ui.politik.Politik.d784889") : tx("ui2.ui.politik.Politik.56d7381")}
                    </span>
                    <span className="pd-chip schlecht">{tx("ui2.ui.politik.Politik.99ae238", { p0: Math.round(p.last * 100) })}</span>
                  </div>
                  <span className="pd-balken schmal" role="img" aria-label={tx("ui2.ui.politik.Politik.94644df", { p0: Math.round(p.last * 100) })}>
                    <i style={{ width: `${Math.round(p.last * 100)}%` }} />
                  </span>
                  <div className="pd-hebel">
                    <span className="pd-hebel-label">{tx("ui2.ui.politik.Politik.25bcfb4")}</span>
                    {hebel.length === 0 && <span className="pd-leise">{t("ui.politik.Politik.15854cd")}</span>}
                    <div className="pd-hebel-knoepfe">
                      {hebel.map((h) => (
                        <button key={`${h.massnahme}-${h.richtung}`} className="pd-btn" onClick={() => stelle(h.massnahme, h.richtung, orte.length > 0 && orte.length <= 50 ? orte : null)} title={`wirkt ${h.wirkung}`}>
                          <span aria-hidden className="pd-pfeil">{h.richtung > 0 ? "▲" : "▼"}</span>
                          {tunSatz(h.massnahme, h.richtung, h.name)}
                        </button>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="pd-block">
        <h4>{t("ui.politik.Politik.ffbcda4")}</h4>
        <ul className="po-lageliste">
          {lageSicht.map((z) => (
            <LageBalken key={z.id} z={z} onKlick={() => oeffne({ id: z.id })} />
          ))}
        </ul>
        {lageSortiert.length > 6 && (
          <button className="pd-btn quiet" onClick={() => setAlleLage(!alleLage)}>
            {alleLage ? tx("ui2.ui.politik.Politik.34a01ce") : tx("ui2.ui.politik.Politik.310ecfc", { p0: lageSortiert.length })}
          </button>
        )}
        <p className="pd-legende">{t("ui.politik.Politik.145affe")}</p>
        {(kurz.theme === "wirtschaft" || kurz.theme === "haushalt") && onOpen && (
          <p className="pd-legende">
            {tx("ui2.ui.politik.Politik.7e5b474")} <button className="pd-btn quiet" onClick={() => onOpen("wirtschaft")}>{tx("ui2.ui.politik.Politik.6b38126")}</button>
          </p>
        )}
      </section>

      {vorschlaege.length > 0 && (
        <section className="pd-block">
          <h4>{tx("ui2.ui.politik.Politik.d878de6")}</h4>
          <ol className="vorschlag-liste">
            {vorschlaege.map((v) => (
              <VorschlagKarte key={v.massnahme} v={v} onEinstellen={einstellen} onSofort={sofort} kompakt />
            ))}
          </ol>
        </section>
      )}

      <section className="pd-block">
        <h4>{t("ui.politik.Politik.876a5f6")}</h4>
        <p className="pd-legende ohne-rand">{t("ui.politik.Politik.626c180")}</p>
        <ul className="pd-massnahmen">
          {massnahmen.map((m) => {
            const laeuft = Boolean(m.imParlament || m.ziel !== undefined || m.umsetzung);
            const pos = Math.max(0, Math.min(100, m.jetzt));
            return (
              <li key={m.id} className={`pd-m${laeuft ? " laeuft" : ""}`}>
                <div className="pd-m-haupt">
                  <div className="pd-m-kopf">
                    <strong>{m.name}</strong>
                    {m.umsetzung && (
                      <span className="pd-pill teal" title={t("ui.politik.Politik.3fd852b")}>
                        {t("ui.politik.Politik.4d62df2")}
                      </span>
                    )}
                    {m.imParlament && <span className="pd-pill warn">{tx("ui2.ui.politik.Politik.07204cc")}</span>}
                    {m.blocker && <BlockerBadge blocker={m.blocker} />}
                  </div>
                  <p className="pd-m-beschr">{m.text}</p>
                  {m.umsetzung && (
                    <p className="pd-m-umsetzung">
                      <span className="pd-balken schmal" role="img" aria-label={tx("ui2.ui.politik.Politik.595d2f1", { p0: Math.round(m.umsetzung.stand) })}>
                        <i style={{ width: `${m.umsetzung.stand}%` }} />
                      </span>
                      <span>
                        {tx("ui2.ui.politik.Politik.2ba66c2", { p0: Math.round(m.umsetzung.stand), p1: m.umsetzung.rest })} {m.umsetzung.rest === 1 ? tx("ui2.ui.politik.Politik.da13625") : tx("ui2.ui.politik.Politik.3e846ba")}
                      </span>
                    </p>
                  )}
                  {m.imParlament && (
                    <p className="pd-m-umsetzung">
                      <span>{tx("ui2.ui.politik.Politik.03bc1ef", { p0: Math.round(m.imParlament.stufe), p1: m.imParlament.tage })}</span>
                    </p>
                  )}
                </div>
                <div className="pd-m-stufe">
                  <span className="pd-m-stufentext">{m.stufe}</span>
                  <span className="pd-skala" aria-hidden>
                    <i style={{ width: `${pos}%` }} />
                    {m.ziel !== undefined && <b style={{ left: `${Math.max(0, Math.min(100, m.ziel))}%` }} title={tx("ui2.ui.politik.Politik.3759d2f")} />}
                  </span>
                  {m.ziel !== undefined && <small>{tx("ui2.ui.politik.Politik.70d45ec", { p0: Math.round(m.ziel) })}</small>}
                </div>
                <div className="pd-m-kosten">
                  {m.kosten > 0 ? (
                    <>
                      <b>{nc(m.kosten)} %</b>
                      <small>{m.einnahme ? tx("ui2.ui.politik.Politik.f8b133b") : tx("ui2.ui.politik.Politik.9bc1843")} {tx("ui2.ui.politik.Politik.1145673")}</small>
                    </>
                  ) : (
                    <small>{t("ui.politik.Politik.c00fcd3")}</small>
                  )}
                </div>
                <button className="pd-btn" onClick={() => oeffne({ id: m.id })}>
                  {t("ui.politik.Politik.e2398a5")}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

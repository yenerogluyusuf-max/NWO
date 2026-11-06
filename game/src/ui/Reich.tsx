// Das Reich: je Fachbereich eine Akte mit klarer Gliederung. „Lage“ zeigt Größen, Ressourcen, das Dringendste und den Bau; „… pflegen“ den Bestand
// mit Zustand, Folgen und Eingriff; „Neue Vorhaben“ das, was sich beginnen lässt, nach Art getrennt. Kein Bereich wird nur in Geld gemessen:
// Jeder hat eigene Größen, und jedes Vorhaben nennt vorher Ausgangslage und erwartete Wirkung und hinterher Vorher und Nachher.

import { Lieferkalender } from "./militaer/Lieferkalender";
import { useState } from "react";
import type { World } from "../sim/types";
import { BEREICH_NAMEN, VERGABE_NAMEN, type Bereich, type Vergabe } from "../sim/reich-typen";
import {
  aktiveVorteile,
  aufgabeFolgen,
  bauKapazitaet,
  bauPool,
  gibAuf,
  pauseVerlust,
  poolKapazitaet,
  ruestungsKapazitaet,
  type BauPool,
  bauplan,
  beginne,
  groessenWert,
  laufBau,
  pausiere,
  reichZustand,
  verschiebe,
  verwaltungBilanz,
  vorhabenDef,
  vorhabenListe,
  VORZIEHEN_VERWALTUNG,
  warteschlange,
  wirkungsVorschau,
  effektZeile,
  type Platz,
} from "../sim/reich";
import { ERBE } from "../data/erbe";
import { VORTEILE } from "../data/reich";
import { kapitalEinkommen } from "../sim/spiel";
import { Groessen, type GroesseDef } from "./reich/Groessen";
import { Schaetzblaetter } from "./reich/Schaetzblatt";
import { VorhabenKarte } from "./reich/VorhabenKarte";
import { WunderBild } from "./reich/WunderBild";
import { Neues } from "./reich/Neues";
import { StaettenAtlas } from "./reich/Staetten";
import { Lohnt, PflegeListe, lohnendste } from "./reich/Pflege";
import { LohntKacheln, MeldungenKurz, PflegeKacheln, StaettenKacheln, VerwaltungsMarke, VorteilKacheln } from "./reich/LandKacheln";
import { Verlauf } from "./reich/Verlauf";
import { t, aktuelleLocale, zahl } from "../i18n";
import { t as tx } from "../i18n";
import "./reich/reich.css";
import { Bauhilfe } from "./reich/Bauhilfe";
import { ohneBeleg } from "../i18n/ohne-beleg";

const GROESSEN: Record<Bereich, GroesseDef[]> = {
  kultur: [{ id: "kulturerbe" }, { id: "identitaet" }, { id: "vielfalt" }, { id: "tourismus" }, { id: "ansehen" }],
  recht: [
    { id: "justiz_unabhaengigkeit" },
    { id: "justiz_kapazitaet", zusatz: "reste.reich.zusatz.richter" },
    { id: "justiz_effizienz", zusatz: "reste.reich.zusatz.dauer" },
    { id: "urteilsbefolgung" },
    { id: "haftueberfuellung", invers: true, zusatz: "reste.reich.zusatz.belegung" },
    { id: "ausnahmerecht", invers: true },
    { id: "anwaltsautonomie" },
    { id: "strassburg_druck", invers: true },
    { id: "rechtssicherheit" },
    { id: "legitimitaet" },
  ],
  militaer: [{ id: "bereitschaft_heer" }, { id: "bereitschaft_luft" }, { id: "bereitschaft_see" }, { id: "modernisierung" }, { id: "ruestungsautarkie" }, { id: "truppenmoral" }, { id: "offiziersvertrauen" }, { id: "abschreckung" }],
  infrastruktur: [{ id: "verkehrsnetz" }, { id: "bahnnetz" }, { id: "stau", invers: true }, { id: "logistik" }, { id: "internet" }, { id: "stromversorgung" }, { id: "wasserversorgung" }, { id: "wartungszustand" }],
  haushalt: [{ id: "legitimitaet" }, { id: "vertrauen_maerkte" }, { id: "vertrauen_regierung" }],
};

function Statistik({ world }: { world: World }) {
  const z = reichZustand(world);
  const vb = verwaltungBilanz(world);
  const cap = bauKapazitaet(world);
  const plan = bauplan(world);
  const geplant = Object.entries(plan).reduce((a, [id, r]) => a + (vorhabenDef(id) && bauPool(vorhabenDef(id)!) === "land" ? r : 0), 0);
  return (
    <div className="rr-ressourcen">
      <div className={`rr-ressource ${vb.vorrat < 15 ? "knapp" : ""}`} title={t("ui.Reich.6284526")}>
        <span>{t("reich.stat.verwaltung")}</span>
        <span className="rr-balken" aria-hidden>
          <i style={{ width: `${vb.vorrat}%` }} />
        </span>
        <b>{Math.round(vb.vorrat)}</b>
        <em className={vb.netto >= 0 ? "hoch" : "runter"}>
          {vb.netto >= 0 ? "+" : "−"}
          {Math.abs(vb.netto).toLocaleString(aktuelleLocale(), { maximumFractionDigits: 1 })} {t("reich.stat.imMonat")}
        </em>
      </div>
      <div className="rr-ressource" title={t("ui.Reich.d87daa9")}>
        <span>{t("reich.stat.bau")}</span>
        <span className="rr-balken" aria-hidden>
          <i style={{ width: `${Math.min(100, (geplant / Math.max(1, cap)) * 100)}%` }} />
        </span>
        <b>{Math.round(cap)}</b>
        <em>{t("reich.stat.verplant", { geplant: Math.round(geplant), cap: Math.round(cap) })}</em>
      </div>
    </div>
  );
}

/** Pausieren und Aufgeben eines laufenden Vorhabens; Aufgeben fragt erst und nennt den Preis aus derselben Rechnung wie die Buchung. */
function BauKnoepfe({ world, id, pausiert, refresh, onText }: { world: World; id: string; pausiert: boolean; refresh: () => void; onText: (s: string | null) => void }) {
  const [frage, setFrage] = useState(false);
  const l = reichZustand(world).laufend.find((x) => x.id === id);
  const v = vorhabenDef(id);
  if (!l || !v) return null;
  const verlust = Math.round(pauseVerlust(l, v));
  if (frage) {
    const f = aufgabeFolgen(world, id);
    return (
      <div className="bs-frage" role="group">
        <p>
          {f && f.erstattung > 0
            ? t("n6.bau.folgenErstattung", { pk: zahl(f.erstattung) })
            : f
              ? t("n6.bau.folgenVerlust", { anteil: Math.round(f.anteil * 100), bau: zahl(f.verlorenBau) }) + (f.strafe > 0 ? t("n6.bau.folgenStrafe", { strafe: zahl(f.strafe) }) : "") + t("n6.bau.folgenVertrauen") + (f.ruine ? t("n6.bau.ruine") : "") + "."
              : ""}
        </p>
        <span>
          <button type="button" className="aktion-knopf gefahr" onClick={() => { const r = gibAuf(world, id); onText(r.why ? `${r.text} ${r.why}` : r.text); setFrage(false); refresh(); }}>{t("n6.bau.jaAufgeben")}</button>
          <button type="button" className="aktion-knopf" onClick={() => setFrage(false)}>{t("n6.bau.nein")}</button>
        </span>
      </div>
    );
  }
  return (
    <>
      <button type="button" className="aktion-knopf" title={pausiert ? undefined : t("n6.bau.pauseTitel", { bau: verlust })} onClick={() => { pausiere(world, id, !pausiert); refresh(); }}>
        {pausiert ? tx("ui2.ui.Reich.aeff967") : tx("ui2.ui.Reich.95175c7")}
      </button>
      <button type="button" className="aktion-knopf leise" onClick={() => setFrage(true)}>{t("n6.bau.aufgeben")}</button>
    </>
  );
}

function ImBau({ world, bereich, refresh }: { world: World; bereich: Bereich; refresh: () => void }) {
  const z = reichZustand(world);
  const plan = bauplan(world);
  const [hinweis, setHinweis] = useState<string | null>(null);
  const liste = z.laufend.map((l) => ({ l, v: vorhabenDef(l.id)! })).filter((x) => x.v && x.v.bereich === bereich);
  if (!liste.length) return null;
  const schlange = new Map(warteschlange(world).map((e) => [e.id, e]));
  return (
    <section className="rr-abschnitt">
      <h4>{t("reich.bau.titel")} <em>{t("reich.bau.untertitel")}</em></h4>
      {hinweis && <p className="rr-hinweis" role="status">{hinweis}</p>}
      <ul className="rr-bauliste">
        {liste.map(({ l, v }) => {
          const bauGesamt = laufBau(l, v);
          const f = bauGesamt > 0 ? l.fortschritt / bauGesamt : 1;
          const rate = plan[l.id] ?? 0;
          const nr = schlange.get(l.id)?.position ?? 1;
          return (
            <li key={l.id} className={`wunder-a-bau${v.bild ? " wunder-a-mitbild" : ""}${l.pausiert ? " ruht" : rate <= 0 ? " wartet" : ""}`}>
              {v.bild && (
                <div className="wunder-a-mini">
                  <WunderBild art={v.bild} zustand="bau" fortschritt={f} klasse={l.pausiert || rate <= 0 ? "ruht" : ""} />
                </div>
              )}
              <div className="rr-bau-kopf">
                <strong>{v.name}</strong>
                <span className="rr-bau-info">
                  {tx("ui2.ui.Reich.5950cd8", { p0: nr, p1: Math.round(f * 100) })}{" "}
                  {l.pausiert ? t("n6.bau.ruhtVerlust", { bau: Math.round(pauseVerlust(l, v)) }) : rate > 0 ? tx("ui2.ui.Reich.d7fc5d0", { p0: rate.toLocaleString(aktuelleLocale(), { maximumFractionDigits: 0 }) }) : tx("ui2.ui.Reich.6202407")}
                </span>
              </div>
              <span className="rr-balken" aria-hidden>
                <i style={{ width: `${Math.round(f * 100)}%` }} />
              </span>
              <div className="rr-bau-knoepfe">
                <BauKnoepfe world={world} id={l.id} pausiert={!!l.pausiert} refresh={refresh} onText={setHinweis} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Farbe eines Blocks in der Kapazitätsleiste nach dem Bereich des Vorhabens (vorher nach Position, ohne Bedeutung). */
const BEREICH_FARBE: Record<Bereich, string> = { infrastruktur: "#8a6a2a", kultur: "#3f7c86", recht: "#6b4a8a", haushalt: "#4a5a6a", militaer: "#5b6b45" };

/**
 * Die Baustelle (Rundgang 05.11.2026): Bild oben ist die Kapazität eines Monats, aufgeteilt auf die Vorhaben in ihrer Reihenfolge;
 * darunter eine Liste. Seit dem 6. November hat jeder Engpass seine eigene Baustelle (sim/reich.ts: bauPool): die Bauwerke des Landes
 * in Infrastruktur und Bau, die Rüstung bei den Streitkräften; Verträge und Reformen laufen ohne Kapazität nach ihrer Dauer.
 */
function Baustelle({ world, bereich, refresh }: { world: World; bereich: Bereich; refresh: () => void }) {
  const z = reichZustand(world);
  const [hinweis, setHinweis] = useState<string | null>(null);
  const pool: BauPool = bereich === "militaer" ? "ruestung" : "land";
  const alle = warteschlange(world);
  const liste = alle.filter((e) => e.pool === pool);
  const ohne = alle.filter((e) => e.pool === "ohne" && vorhabenDef(e.id)?.bereich === bereich);
  const ruestung = pool === "land" ? alle.filter((e) => e.pool === "ruestung").length : 0;
  const cap = Math.max(1, poolKapazitaet(world, pool));
  // Infrastruktur und Bau: Die Baustelle ist die Leitfrage der Lage. Verwaltungskraft steht als Marke im Kopf, die Baukapazität als
  // Zahl im Kopf und als Leiste darunter (vorher dieselben Zahlen noch einmal als Balkenblock darüber; Tagarbeit 6. November).
  const marke = pool === "land" ? <VerwaltungsMarke world={world} /> : null;
  if (!liste.length && !ohne.length) {
    if (pool !== "land") return null;
    return (
      <section className="rr-abschnitt rr-baustelle">
        <h4>{t("reich.bau.titel")} <em>{t("tag_t3.bau.leer", { cap: Math.round(cap) })}</em>{marke}</h4>
        <Bauhilfe world={world} />
      </section>
    );
  }
  const frei = Math.max(0, cap - liste.reduce((n, e) => n + (e.pausiert ? 0 : e.rate), 0));
  const bauen = liste.filter((e) => !e.pausiert && e.rate > 0).length;
  const monatsText = (m?: number) => (m === undefined ? "" : m <= 0 ? t("reste.reich.jetzt") : t("reste.reich.inMonaten", { n: m }));
  const rueckmeldung = (id: string, richtung: -1 | 1) => {
    const r = verschiebe(world, id, richtung);
    if (!r.ok) setHinweis(r.grund ?? t("reste.reich.ging"));
    else if (r.verdrangt?.length) setHinweis(t("reste.reich.vorgezogen", { name: vorhabenDef(id)?.name ?? id, kosten: r.kosten, liste: r.verdrangt.join(", ") }));
    else setHinweis(null);
    refresh();
  };
  const zeitText = (e: (typeof alle)[number]) => {
    const l = z.laufend.find((x) => x.id === e.id);
    const v = vorhabenDef(e.id);
    return e.pausiert && l && v
      ? t("n6.bau.ruhtVerlust", { bau: Math.round(pauseVerlust(l, v)) })
      : e.vergabePhase
        ? t("reste.reich.vergabe", { start: monatsText(e.startIn) }) + (e.fertigIn !== undefined ? t("reste.reich.fertigZusatz", { fertig: monatsText(e.fertigIn) }) : "")
        : e.rate > 0
          ? t("reste.reich.baut", { rate: Math.round(e.rate), fertig: monatsText(e.fertigIn) })
          : t("reste.reich.wartet", { start: monatsText(e.startIn) }) + (e.fertigIn !== undefined ? t("reste.reich.fertigZusatz", { fertig: monatsText(e.fertigIn) }) : "");
  };
  const zeile = (e: (typeof alle)[number], mitReihe: boolean) => {
    const v = vorhabenDef(e.id);
    const l = z.laufend.find((x) => x.id === e.id);
    if (!v || !l) return null;
    const gesamt = laufBau(l, v);
    const f = gesamt > 0 ? l.fortschritt / gesamt : 1;
    const i = liste.indexOf(e);
    const verdrangt = mitReihe && i > 0 ? (vorhabenDef(liste[i - 1]!.id)?.name ?? liste[i - 1]!.id) : null;
    const baut = !e.pausiert && e.rate > 0;
    const farbe = baut ? BEREICH_FARBE[v.bereich] : undefined;
    return (
      <li key={e.id} className={`bs-eintrag${e.pausiert ? " ruht" : baut ? "" : " wartet"}${v.bereich !== bereich ? " fremd" : ""}`}>
        <span className="bs-pos" style={{ background: farbe }}>{mitReihe ? e.position : "·"}</span>
        {v.bild ? <div className="bs-bild"><WunderBild art={v.bild} zustand="bau" fortschritt={f} klasse={baut ? "" : "ruht"} /></div> : <div className="bs-bild leer" aria-hidden />}
        <div className="bs-mitte">
          <div className="bs-kopf">
            <strong>{v.name}</strong>
            {v.bereich !== bereich && <span className="bs-bereich">{BEREICH_NAMEN[v.bereich]}</span>}
            <span className="rr-plakette" title={tx("ui2.ui.Reich.0804578", { p0: VERGABE_NAMEN[e.vergabe] })}>{VERGABE_NAMEN[e.vergabe]}</span>
          </div>
          <span className="bs-fortschritt" aria-hidden><i style={{ width: `${Math.round(f * 100)}%`, background: farbe }} /></span>
          <span className="bs-zeit"><b>{Math.round(f * 100)} %</b> · {zeitText(e)}</span>
        </div>
        <div className="bs-knoepfe">
          {mitReihe && (
            <>
              <button type="button" className="aktion-knopf" disabled={i === 0} onClick={() => rueckmeldung(e.id, -1)}
                title={verdrangt ? tx("ui2.ui.Reich.f584365", { p0: VORZIEHEN_VERWALTUNG, p1: verdrangt }) : tx("ui2.ui.Reich.a1e5051")}>▲</button>
              <button type="button" className="aktion-knopf" disabled={i === liste.length - 1} onClick={() => rueckmeldung(e.id, 1)} title={t("ui.Reich.df0cd3b")}>▼</button>
            </>
          )}
          <BauKnoepfe world={world} id={e.id} pausiert={e.pausiert} refresh={refresh} onText={setHinweis} />
        </div>
      </li>
    );
  };
  return (
    <section className="rr-abschnitt rr-baustelle">
      {liste.length > 0 && (
        <>
          <h4>{t("reich.bau.titel")} <em title={pool === "land" ? t("ui.Reich.d87daa9") : undefined}>{t(pool === "ruestung" ? "n6.bau.ruestungUnter" : "bs.unter", { cap: Math.round(cap), bauen, warten: liste.length - bauen })}</em>{marke}</h4>
          <div className="bs-leiste" role="img" aria-label={t("bs.leisteAria", { cap: Math.round(cap), frei: Math.round(frei) })}>
            {liste.map((e) => {
              const v = vorhabenDef(e.id);
              return !e.pausiert && e.rate > 0 ? (
                <span key={e.id} style={{ flexGrow: e.rate, background: v ? BEREICH_FARBE[v.bereich] : undefined }} title={`${e.position}. ${v?.name ?? e.id}: ${Math.round(e.rate)}`}>
                  <b>{e.position}</b><em>{v?.name ?? e.id}</em>
                </span>
              ) : null;
            })}
            {frei > 0.5 && <span className="frei" style={{ flexGrow: frei }} title={t("bs.frei", { n: Math.round(frei) })}>{t("bs.frei", { n: Math.round(frei) })}</span>}
          </div>
        </>
      )}
      {hinweis && <p className="rr-hinweis" role="status">{hinweis}</p>}
      {liste.length > 0 && <ol className="bs-liste">{liste.map((e) => zeile(e, true))}</ol>}
      {ohne.length > 0 && (
        <>
          <h4 className="bs-ohne">{t("n6.bau.ohneTitel")} <em>{t("n6.bau.ohneUnter")}</em></h4>
          <ol className="bs-liste">{ohne.map((e) => zeile(e, false))}</ol>
        </>
      )}
      {/* Wie die Reihenfolge wirkt, steht bei der Baustelle des Landes in der aufklappbaren Bauhilfe; sie nannte Pause und Aufgeben schon */}
      {pool === "land" ? (
        <Bauhilfe world={world}>
          {liste.length > 0 && <p>{tx("ui2.ui.Reich.90f1a97", { p0: VORZIEHEN_VERWALTUNG })} {t("tag_t3.bau.schaetzung")}</p>}
        </Bauhilfe>
      ) : liste.length > 0 && <p className="rr-hinweis">{tx("ui2.ui.Reich.90f1a97", { p0: VORZIEHEN_VERWALTUNG })} {t("ui.Reich.119c095")}</p>}
      {ruestung > 0 && <p className="rr-hinweis">{t("n6.bau.ruestungHinweis", { n: ruestung, cap: Math.round(ruestungsKapazitaet(world)) })}</p>}
    </section>
  );
}

const SITZ_NAMEN = (): Record<string, string> => ({ aym: t("reste.reich.aym"), hsk: t("reste.reich.hsk") });

function Sitze({ world }: { world: World }) {
  const z = reichZustand(world);
  return (
    <section className="rr-abschnitt">
      <h4>
        {tx("ui2.ui.Reich.f5c645d")} <em>{t("ui.Reich.9e48137")}</em>
      </h4>
      <div className="rr-sitzgruppen">
        {Object.entries(z.sitze).map(([key, s]) => {
          const n = s.loyal + s.unabhaengig + s.reform;
          const punkte = [
            ...Array.from({ length: s.loyal }, () => "loyal"),
            ...Array.from({ length: s.reform }, () => "reform"),
            ...Array.from({ length: s.unabhaengig }, () => "unabhaengig"),
          ];
          return (
            <div key={key} className="rr-sitzgruppe">
              <strong>{SITZ_NAMEN()[key] ?? key}</strong>
              <span className="rr-sitze" role="img" aria-label={tx("ui2.ui.Reich.eeb0a0b", { p0: n, p1: s.loyal, p2: s.reform, p3: s.unabhaengig })}>
                {punkte.map((p, i) => (
                  <i key={i} className={p} />
                ))}
              </span>
              <span className="rr-sitz-legende">
                <b className="loyal" /> {tx("ui2.ui.Reich.e20dbbc", { p0: s.loyal })} <b className="reform" /> {t("n6.sitze.reform", { n: s.reform })} <b className="unabhaengig" /> {tx("ui2.ui.Reich.da33253", { p0: s.unabhaengig })}
              </span>
            </div>
          );
        })}
      </div>
      <p className="rr-hinweis">{t("ui.Reich.baef25c")}</p>
    </section>
  );
}

function Haushalt({ world }: { world: World }) {
  const vb = verwaltungBilanz(world);
  const k = kapitalEinkommen(world);
  // Werte unter 0,05 zeigen „0“ ohne Vorzeichen (kein „−0,0“)
  const vz = (x: number) => (Math.abs(x) < 0.05 ? 0 : x);
  const mitVz = (x: number) => (vz(x) === 0 ? "0" : `${x > 0 ? "+" : "−"}${z(Math.abs(x))}`);
  const e = world.economy;
  const z = (x: number, d = 1) => x.toLocaleString(aktuelleLocale(), { minimumFractionDigits: d, maximumFractionDigits: d });
  return (
    <section className="rr-abschnitt">
      <h4>
        {tx("ui2.ui.Reich.c84da49")} <em>{t("ui.Reich.048ca62")}</em>
      </h4>
      <p>{t("balance.personal", { wert: z(vb.personal) })}</p>
      <div className="rr-bilanz">
        <table>
          <caption>{tx("ui2.ui.Reich.6435c5e")}</caption>
          <tbody>
            <tr><th>{tx("ui2.ui.Reich.7d72e11")}</th><td className="hoch">+{z(vb.einkommen)}</td></tr>
            <tr><th>{tx("ui2.ui.Reich.04c459d")}</th><td className="runter">−{z(vb.bau)}</td></tr>
            <tr><th>{t("ui.Reich.17a76b2")}</th><td className="runter">−{z(vb.unterhalt)}</td></tr>
            <tr className="summe"><th>{tx("ui2.ui.Reich.8b0fcd0")}</th><td className={vb.netto >= 0 ? "hoch" : "runter"}>{vb.netto >= 0 ? "+" : "−"}{z(Math.abs(vb.netto))}</td></tr>
          </tbody>
        </table>
        <table>
          <caption>{t("ui.Reich.d1bbe69")}</caption>
          <tbody>
            <tr><th>{tx("ui2.ui.Reich.4183cf9")}</th><td>{z(k.grund)}</td></tr>
            <tr><th>{t("ui.Reich.c8434a3")}</th><td>{z(k.vertrauen)}</td></tr>
            <tr><th>{tx("ui2.ui.Reich.fb57aba")}</th><td>{z(k.mehrheit)}</td></tr>
            <tr><th>{t("ui.Reich.6121d6a")}</th><td className={vz(k.legitimitaet) >= 0 ? "hoch" : "runter"}>{mitVz(k.legitimitaet)}</td></tr>
            <tr><th>{t("ui.Reich.kapKabinett")}</th><td className="hoch">{mitVz(k.kabinett)}</td></tr>
            {Math.abs(k.unterhalt) >= 0.05 && <tr><th>{t("ui.Reich.kapUnterhalt")}</th><td className="runter">{mitVz(-k.unterhalt)}</td></tr>}
            {Math.abs(k.altlast) >= 0.05 && <tr><th>{t("ui.Reich.kapAltlast")}</th><td className="runter">{mitVz(-k.altlast)}</td></tr>}
            <tr className="summe"><th>{t("ui.Reich.kapSaldo")}</th><td className={vz(k.summe) >= 0 ? "hoch" : "runter"}>{mitVz(k.summe)}</td></tr>
          </tbody>
        </table>
        <table>
          <caption>{t("ui.Reich.faad857")}</caption>
          <tbody>
            <tr><th>{tx("ui2.ui.Reich.b845c55")}</th><td>{tx("ui2.ui.Reich.ce96c4c", { p0: z(e.debtRatio) })}</td></tr>
            <tr><th>{tx("ui2.ui.Reich.484806d")}</th><td>{z(e.policyRate)} %</td></tr>
            <tr><th>{tx("ui2.ui.Reich.361bef7")}</th><td>{z(e.usdTry)}</td></tr>
            <tr><th>{tx("ui2.ui.Reich.16cdef9")}</th><td>{tx("ui2.ui.Reich.43cbb60", { p0: z(e.riskPremium, 0) })}</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function VorteileListe({ world, bereich }: { world: World; bereich: Bereich }) {
  const aktiv = new Set(aktiveVorteile(world));
  const liste = VORTEILE.filter((v) => v.bereich === bereich);
  if (!liste.length) return null;
  return (
    <section className="rr-abschnitt">
      <h4>
        {tx("ui2.ui.Reich.b192857")} <em>{tx("ui2.ui.Reich.572a802")}</em>
      </h4>
      <ul className="rr-vorteile">
        {liste.map((v) => {
          const an = aktiv.has(v.id);
          return (
            <li key={v.id} className={an ? "aktiv" : ""}>
              <div className="rr-vorteil-kopf">
                <strong>{v.name}</strong>
                <span className={`rr-status ${an ? "fertig" : ""}`}>{an ? tx("ui2.ui.Reich.16a766c") : tx("ui2.ui.Reich.82a62ea")}</span>
              </div>
              <p>{ohneBeleg(v.text)}</p>
              <ul className="rr-wirkung-zeilen">
                {v.dauer.map((e) => effektZeile(e, "dauer")).filter((z): z is NonNullable<typeof z> => !!z).map((z) => (
                  <li key={z.text} className={z.gut ? "rr-gut" : "rr-schlecht"}>
                    <span aria-hidden>{z.richtung > 0 ? "▲" : "▼"}</span> {z.text}
                  </li>
                ))}
              </ul>
              <p className="rr-kehrseite"><b>{tx("ui2.ui.Reich.0289c3f")}</b> {v.kehrseite}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type Tab = "lage" | "bestand" | "neu";

function tabsFuerBereich(bereich: Bereich): { id: Tab; label: string }[] {
  switch (bereich) {
    case "kultur":
      return [{ id: "lage", label: t("reich.tab.lage") }, { id: "bestand", label: t("reich.tab.staetten") }, { id: "neu", label: t("reich.tab.neu") }];
    case "infrastruktur":
      return [{ id: "lage", label: t("reich.tab.lage") }, { id: "bestand", label: t("reich.tab.bauwerke") }, { id: "neu", label: t("reich.tab.neu") }];
    case "militaer":
      return [{ id: "lage", label: t("reich.tab.lage") }, { id: "bestand", label: t("reich.tab.ruestung") }, { id: "neu", label: t("reich.tab.beschaffung") }];
    case "recht":
      return [{ id: "lage", label: t("reich.tab.lage") }, { id: "neu", label: t("reich.tab.reformen") }];
    case "haushalt":
      return [{ id: "lage", label: t("reich.tab.lage") }, { id: "neu", label: t("reich.tab.sonderrechte") }];
  }
}

/** Die Einrichtungen des Rechts, deren Zustand nichts bewegt: Man liest sie an den Größen ab, die sie prägen. */
function Institutionen({ world }: { world: World }) {
  const z = reichZustand(world);
  const stuecke = Object.keys(z.bestand)
    .map((id) => vorhabenDef(id))
    .filter((v): v is NonNullable<typeof v> => !!v && v.bereich === "recht" && v.klasse === "institution");
  if (!stuecke.length) return null;
  return (
    <section className="rr-abschnitt">
      <h4>
        {tx("ui2.ui.Reich.af5c59c")} <em>{t("ui.Reich.aaa550c")}</em>
      </h4>
      <ul className="rv-liste">
        {stuecke.map((v) => {
          const zeigt = wirkungsVorschau(world, v.id)?.zeigt ?? [];
          return (
            <li key={v.id} className="rv-eintrag">
              <div className="rv-kopf">
                <strong>{v.name}</strong>
                {v.unterhalt ? <span className="rr-bau-info">{tx("ui2.ui.Reich.cf4af98", { p0: zahl(v.unterhalt, 1) })}</span> : null}
              </div>
              <ul className="rr-wirkung-zeilen">
                {zeigt.map((g) => (
                  <li key={g.id} className={g.gut ? "rr-gut" : "rr-schlecht"}>
                    {tx("ui2.ui.Reich.96504fa", { p0: g.name, p1: g.wert })}
                  </li>
                ))}
              </ul>
              <details className="rp-mehr">
                <summary>{t("ui.Reich.0995a96")}</summary>
                <p className="rr-text">{ohneBeleg(v.text)}</p>
                <p className="rr-kehrseite"><b>{tx("ui2.ui.Reich.0289c3f")}</b> {v.kehrseite}</p>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Reich(props: { world: World; bereich: Bereich; refresh: () => void; onKarte?: (o: { lon: number; lat: number }) => void; /** Reiter, mit dem die Akte beginnt (eine Marke der Karte kann „Pflegen“ vorgeben) */ startTab?: Tab; /** Vorgewähltes Vorhaben im Katalog */ startVorhaben?: string }) {
  // Je Bereich eigener Zustand der Reiter: Beim Wechsel beginnt die Akte wieder bei der Lage (oder beim vorgegebenen Reiter)
  return <ReichInnen key={`${props.bereich}:${props.startTab ?? ""}:${props.startVorhaben ?? ""}`} {...props} />;
}

function ReichInnen({ world, bereich, refresh, onKarte, startTab, startVorhaben }: { world: World; bereich: Bereich; refresh: () => void; onKarte?: (o: { lon: number; lat: number }) => void; startTab?: Tab; startVorhaben?: string }) {
  const tabs = tabsFuerBereich(bereich);
  const [tab, setTab] = useState<Tab>(startTab && tabs.some((x) => x.id === startTab) ? startTab : "lage");
  const [ergebnisse, setErgebnisse] = useState<Record<string, { ok: boolean; text: string }>>({});
  if (!world.spiel) return <p>{t("ui.Reich.186589c")}</p>;
  const z = reichZustand(world);
  const liste = vorhabenListe(world, bereich);

  const beginneVorhaben = (id: string, vergabe: Vergabe = "ausschreibung", platz: Platz = "ende") => {
    const r = beginne(world, id, vergabe, platz);
    setErgebnisse((e) => ({ ...e, [id]: { ok: r.ok, text: r.why ? `${r.text} ${r.why}` : r.text } }));
    refresh();
  };

  // Pflege (Instandsetzung, Restaurierung) gehört in „pflegen“, nicht unter die neuen Vorhaben
  const neu = liste.filter((s) => s.status !== "fertig" && s.status !== "im_bau" && s.status !== "pausiert" && (s.v.klasse !== "restaurierung" || !!s.v.vorlage));
  const technik = bereich === "infrastruktur" || bereich === "militaer";
  /** Die beiden Bereiche der Akte Land: Lage in Kacheln (Tagarbeit 6. November) */
  const land = bereich === "infrastruktur" || bereich === "kultur";
  const bereitN = neu.filter((s) => s.status === "verfuegbar" && s.bereit).length;
  const dringendN = bereich === "kultur" ? ERBE.filter((e) => (z.staetten[e.id]?.zustand ?? 100) < 45).length : technik ? lohnendste(world, bereich, 99, 1).length : 0;
  const plakette = (id: Tab): number => (id === "neu" ? bereitN : id === "bestand" ? dringendN : 0);

  return (
    <div className="reich">
      {tabs.length > 1 && (
        <div className="rr-tabs" role="tablist" aria-label={t("n6.reich.ansicht", { bereich: BEREICH_NAMEN[bereich] })}>
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)}>
              {t.label}
              {plakette(t.id) > 0 && <i className="rr-tab-zahl" title={t.id === "neu" ? tx("ui2.ui.Reich.9bd93be") : bereich === "kultur" ? tx("ui2.ui.Reich.23ee4a7") : tx("ui2.ui.Reich.7d7f2ba")}>{plakette(t.id)}</i>}
            </button>
          ))}
        </div>
      )}

      {tab === "lage" && (
        <>
          <section className="rr-abschnitt">
            {/* Verwaltungskraft und Baukapazität nur dort, wo Bau und Verwaltung zu Hause sind; vorher in fünf Bereichen derselbe Block (Rundgang 5. November).
                In Infrastruktur und Bau stehen beide seit der Tagarbeit am 6. November im Kopf der Baustelle (VerwaltungsMarke, Kapazitätsleiste). */}
            {bereich === "haushalt" && <Statistik world={world} />}
            {bereich === "haushalt" && <Bauhilfe world={world} />}
            {/* Rüstung (N7, Befund G-4/G-45): oben der Lieferkalender mit einem Datum je System, Kennzahlen und Bauliste aufklappbar */}
            {bereich === "militaer" ? <Lieferkalender world={world} /> : land ? (
              <div className={`lk-groessen${bereich === "kultur" ? " fuenf" : ""}`}><Groessen world={world} liste={GROESSEN[bereich]} /></div>
            ) : <Groessen world={world} liste={GROESSEN[bereich]} />}
          </section>
          {bereich === "militaer" ? (
            <details className="rr-aufklapp">
              <summary>{t("nacht_n7.ruestung.bauliste")}</summary>
              <Baustelle world={world} bereich={bereich} refresh={refresh} />
              <Groessen world={world} liste={GROESSEN[bereich]} />
            </details>
          ) : technik && <Baustelle world={world} bereich={bereich} refresh={refresh} />}
          {/* Akte Land: Pflege, Stätten und Vorteile als Kacheln mit Detail auf Klick (reich/LandKacheln.tsx) */}
          {bereich === "kultur" && <StaettenKacheln world={world} refresh={refresh} />}
          {bereich === "infrastruktur" && <LohntKacheln world={world} bereich={bereich} refresh={refresh} zuPflege={() => setTab("bestand")} />}
          {bereich === "militaer" && <Lohnt world={world} bereich={bereich} refresh={refresh} zuPflege={() => setTab("bestand")} />}
          {bereich === "haushalt" && <Haushalt world={world} />}
          {bereich === "recht" && <Sitze world={world} />}
          {bereich === "recht" && <Institutionen world={world} />}
          {!technik && <ImBau world={world} bereich={bereich} refresh={refresh} />}
          <Verlauf world={world} bereich={bereich} {...(land ? { kacheln: true } : {})} />
          {bereich === "militaer" ? (
            <details className="rr-aufklapp">
              <summary>{t("nacht_n7.ruestung.vorteile")}</summary>
              <VorteileListe world={world} bereich={bereich} />
            </details>
          ) : land ? <VorteilKacheln world={world} bereich={bereich} /> : <VorteileListe world={world} bereich={bereich} />}
          {land ? <MeldungenKurz world={world} /> : z.meldungen.length > 0 && (
            <section className="rr-abschnitt">
              <h4>{tx("ui2.ui.Reich.0326b65")}</h4>
              <ul className="rr-meldungen">
                {[...z.meldungen].reverse().slice(0, 5).map((m, i) => (
                  <li key={`${m.tag}-${i}`} className={m.art}>
                    {m.text}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {tab === "bestand" && bereich === "kultur" && <StaettenAtlas world={world} refresh={refresh} />}
      {tab === "bestand" && bereich === "infrastruktur" && <PflegeKacheln world={world} bereich={bereich} refresh={refresh} />}
      {tab === "bestand" && bereich === "militaer" && <PflegeListe world={world} bereich={bereich} refresh={refresh} />}

      {tab === "neu" && (
        <>
          {bereich === "infrastruktur" && <Schaetzblaetter world={world} refresh={refresh} />}
          {/* Fertige Vorhaben stehen als Filter „Fertig“ im Katalog statt als zweite Kartenreihe darunter (Länge, Befund F-1) */}
          <Neues world={world} bereich={bereich} liste={neu} alle={liste} onBeginne={beginneVorhaben} ergebnisse={ergebnisse} refresh={refresh} start={startVorhaben} {...(onKarte ? { onKarte } : {})} />
        </>
      )}
    </div>
  );
}

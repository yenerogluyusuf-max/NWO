// Das Reich: je Fachbereich eine Akte mit klarer Gliederung. „Lage“ zeigt Größen, Ressourcen, das Dringendste und den Bau; „… pflegen“ den Bestand
// mit Zustand, Folgen und Eingriff; „Neue Vorhaben“ das, was sich beginnen lässt, nach Art getrennt. Kein Bereich wird nur in Geld gemessen:
// Jeder hat eigene Größen, und jedes Vorhaben nennt vorher Ausgangslage und erwartete Wirkung und hinterher Vorher und Nachher.

import { useState } from "react";
import type { World } from "../sim/types";
import { BEREICH_NAMEN, VERGABE_NAMEN, type Bereich, type Vergabe } from "../sim/reich-typen";
import {
  aktiveVorteile,
  bauKapazitaet,
  bauplan,
  beginne,
  erhaltung,
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
  type VorhabenSicht,
} from "../sim/reich";
import { ERBE, KIRCHEN_DER_OFFENBARUNG, type Erbe } from "../data/erbe";
import { VORTEILE } from "../data/reich";
import { kapitalEinkommen } from "../sim/spiel";
import { Groessen, type GroesseDef } from "./reich/Groessen";
import { Schaetzblaetter } from "./reich/Schaetzblatt";
import { VorhabenKarte } from "./reich/VorhabenKarte";
import { WunderBild } from "./reich/WunderBild";
import { Neues } from "./reich/Neues";
import { Lohnt, PflegeListe, Zeilen, lohnendste } from "./reich/Pflege";
import { Verlauf } from "./reich/Verlauf";
import { t, aktuelleLocale } from "../i18n";
import { t as tx } from "../i18n";
import "./reich/reich.css";
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
  const geplant = Object.values(bauplan(world)).reduce((a, b) => a + b, 0);
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

function ImBau({ world, bereich, refresh }: { world: World; bereich: Bereich; refresh: () => void }) {
  const z = reichZustand(world);
  const plan = bauplan(world);
  const liste = z.laufend.map((l) => ({ l, v: vorhabenDef(l.id)! })).filter((x) => x.v && x.v.bereich === bereich);
  if (!liste.length) return null;
  return (
    <section className="rr-abschnitt">
      <h4>{t("reich.bau.titel")} <em>{t("reich.bau.untertitel")}</em></h4>
      <ul className="rr-bauliste">
        {liste.map(({ l, v }) => {
          const bauGesamt = laufBau(l, v);
          const f = bauGesamt > 0 ? l.fortschritt / bauGesamt : 1;
          const rate = plan[l.id] ?? 0;
          const nr = z.laufend.findIndex((x) => x.id === l.id);
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
                  {tx("ui2.ui.Reich.5950cd8", { p0: nr + 1, p1: Math.round(f * 100) })}{" "}
                  {l.pausiert ? t("reste.reich.ruht") : rate > 0 ? tx("ui2.ui.Reich.d7fc5d0", { p0: rate.toLocaleString(aktuelleLocale(), { maximumFractionDigits: 0 }) }) : tx("ui2.ui.Reich.6202407")}
                </span>
              </div>
              <span className="rr-balken" aria-hidden>
                <i style={{ width: `${Math.round(f * 100)}%` }} />
              </span>
              <div className="rr-bau-knoepfe">
                <button type="button" className="aktion-knopf" onClick={() => { pausiere(world, l.id, !l.pausiert); refresh(); }}>
                  {l.pausiert ? tx("ui2.ui.Reich.aeff967") : tx("ui2.ui.Reich.95175c7")}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Baureihenfolge({ world, refresh }: { world: World; refresh: () => void }) {
  const z = reichZustand(world);
  const [hinweis, setHinweis] = useState<string | null>(null);
  if (!z.laufend.length) return null;
  const liste = warteschlange(world);
  const monatsText = (m?: number) => (m === undefined ? "" : m <= 0 ? t("reste.reich.jetzt") : t("reste.reich.inMonaten", { n: m }));
  const rueckmeldung = (id: string, richtung: -1 | 1) => {
    const r = verschiebe(world, id, richtung);
    if (!r.ok) setHinweis(r.grund ?? t("reste.reich.ging"));
    else if (r.verdrangt?.length) setHinweis(t("reste.reich.vorgezogen", { name: vorhabenDef(id)?.name ?? id, kosten: r.kosten, liste: r.verdrangt.join(", ") }));
    else setHinweis(null);
    refresh();
  };
  return (
    <section className="rr-abschnitt">
      <h4>
        {tx("ui2.ui.Reich.bb4c8f7")} <em>{tx("ui2.ui.Reich.90f1a97", { p0: VORZIEHEN_VERWALTUNG })}</em>
      </h4>
      {hinweis && (
        <p className="rr-hinweis" role="status">
          {hinweis}
        </p>
      )}
      <ol className="rr-bauliste rr-queue">
        {liste.map((e) => {
          const v = vorhabenDef(e.id);
          if (!v) return null;
          // Wer eine Position zurückfällt, wenn dieses Vorhaben vorgezogen wird
          const verdrangt = e.position > 1 ? (vorhabenDef(liste[e.position - 2]!.id)?.name ?? liste[e.position - 2]!.id) : null;
          const zeit = e.pausiert
            ? t("reste.reich.ruht")
            : e.vergabePhase
              ? t("reste.reich.vergabe", { start: monatsText(e.startIn) }) + (e.fertigIn !== undefined ? t("reste.reich.fertigZusatz", { fertig: monatsText(e.fertigIn) }) : "")
              : e.rate > 0
                ? t("reste.reich.baut", { rate: Math.round(e.rate), fertig: monatsText(e.fertigIn) })
                : t("reste.reich.wartet", { start: monatsText(e.startIn) }) + (e.fertigIn !== undefined ? t("reste.reich.fertigZusatz", { fertig: monatsText(e.fertigIn) }) : "");
          return (
            <li key={e.id} className={`rr-queue-eintrag${e.pausiert ? " ruht" : ""}`}>
              <span className="rr-queue-pos" aria-label={tx("ui2.ui.Reich.8af9b4d", { p0: e.position })}>
                {e.position}
              </span>
              <div className="rr-bau-kopf">
                <strong>{v.name}</strong>{" "}
                <span className="rr-plakette" title={tx("ui2.ui.Reich.0804578", { p0: VERGABE_NAMEN[e.vergabe] })}>
                  {VERGABE_NAMEN[e.vergabe]}
                </span>
                <span className="rr-bau-info">{zeit}</span>
              </div>
              <div className="rr-bau-knoepfe">
                <button
                  type="button"
                  className="aktion-knopf"
                  disabled={e.position === 1}
                  onClick={() => rueckmeldung(e.id, -1)}
                  title={verdrangt ? tx("ui2.ui.Reich.f584365", { p0: VORZIEHEN_VERWALTUNG, p1: verdrangt }) : tx("ui2.ui.Reich.a1e5051")}
                >
                  ▲
                </button>
                <button type="button" className="aktion-knopf" disabled={e.position === liste.length} onClick={() => rueckmeldung(e.id, 1)} title={t("ui.Reich.df0cd3b")}>
                  ▼
                </button>
                <button type="button" className="aktion-knopf" onClick={() => { pausiere(world, e.id, !e.pausiert); refresh(); }}>
                  {e.pausiert ? tx("ui2.ui.Reich.aeff967") : tx("ui2.ui.Reich.95175c7")}
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="rr-hinweis">{t("ui.Reich.119c095")}</p>
    </section>
  );
}

/** Eine Stätte mit Zustand, Folge und Eingriff: Zustand → Restaurieren → Wirkung. */
function Staetten({ world, refresh, nurSchlechte }: { world: World; refresh: () => void; nurSchlechte?: number }) {
  const z = reichZustand(world);
  const [serie, setSerie] = useState<string>("alle");
  const [rueckmeldung, setRueckmeldung] = useState<string | null>(null);
  const SERIEN: { id: string; name: string }[] = [
    { id: "alle", name: "Alle 53" },
    { id: "kirchen7", name: "Sieben Kirchen" },
    { id: "seldschuken", name: "Seldschuken" },
    { id: "sinan", name: "Sinan" },
    { id: "tas_tepeler", name: "Taş Tepeler" },
    { id: "byzanz", name: "Byzanz" },
    { id: "vielvoelker", name: "Gemeinschaften" },
    { id: "welterbe", name: "Welterbe" },
  ];
  const zustandVon = (e: Erbe) => z.staetten[e.id]?.zustand ?? 0;
  const liste = ERBE.filter((e) => (nurSchlechte !== undefined ? true : serie === "alle" ? true : serie === "welterbe" ? e.unesco.status === "welterbe" : e.serien?.includes(serie as never)))
    .sort((a, b) => zustandVon(a) - zustandVon(b))
    .slice(0, nurSchlechte ?? ERBE.length);
  const sieben = KIRCHEN_DER_OFFENBARUNG.map((k) => z.staetten[k.id]?.zustand ?? 0);
  const restauriere = (e: Erbe) => {
    const r = beginne(world, `restaurierung_${e.id}`);
    setRueckmeldung(r.text);
    refresh();
  };
  return (
    <section className="rr-abschnitt">
      <h4>
        {nurSchlechte !== undefined ? tx("ui2.ui.Reich.fb453c1") : tx("ui2.ui.Reich.51ae0fa")} <em>{tx("ui2.ui.Reich.9219dc0", { p0: Math.round(erhaltung(world)) })}</em>
      </h4>
      {nurSchlechte === undefined && (
        <div className="rr-filter" role="group" aria-label={t("ui.Reich.4825f35")}>
          {SERIEN.map((s) => (
            <button key={s.id} type="button" className={serie === s.id ? "on" : ""} onClick={() => setSerie(s.id)} aria-pressed={serie === s.id}>
              {s.name}
            </button>
          ))}
        </div>
      )}
      {serie === "kirchen7" && nurSchlechte === undefined && (
        <p className="rr-hinweis">
          {tx("ui2.ui.Reich.171fd85", { p0: Math.round(Math.min(...sieben)) })}
        </p>
      )}
      {rueckmeldung && <p className="rr-hinweis" role="status">{rueckmeldung}</p>}
      <ul className="rr-stabliste">
        {liste.map((e) => {
          const st = z.staetten[e.id]!;
          const id = `restaurierung_${e.id}`;
          const def = vorhabenDef(id);
          const laeuft = z.laufend.some((l) => l.id === id);
          const hub = def?.abschluss.find((x) => x.t === "staette");
          const nach = hub && hub.t === "staette" ? Math.min(100, st.zustand + hub.d) : undefined;
          const erbe = groessenWert(world, "kulturerbe", [e.plaka]);
          const vor = def ? wirkungsVorschau(world, id) : null;
          const folgen = (vor?.sofort ?? []).filter((x) => !x.text.startsWith(e.name));
          return (
            <li key={e.id} className={st.zustand < 40 ? "gefaehrdet" : ""}>
              <div className="rr-staette-kopf">
                <strong className="rr-staette-name">{e.name}</strong>
                {e.unesco.status === "welterbe" && <span className="rr-plakette" title={tx("ui2.ui.Reich.2e2e824", { p0: e.unesco.jahr })}>{tx("ui2.ui.Reich.8c5c22e")}</span>}
                {e.kirche7 && <span className="rr-plakette kirche" title={t("ui.Reich.b39ebe5")}>{tx("ui2.ui.Reich.b2c752c")}</span>}
              </div>
              <span className="rr-staette-ort">{e.ort}: {e.satz}</span>
              <div className="rr-zustand">
                <span>{tx("ui2.ui.Reich.97574a9")}</span>
                <span className="rr-balken" aria-hidden>
                  <i style={{ width: `${st.zustand}%` }} className={st.zustand < 40 ? "schwach" : ""} />
                </span>
                <b>{Math.round(st.zustand)}</b>
              </div>
              <p className="rp-satz">
                {st.zustand < 30 ? tx("ui2.ui.Reich.64becd1") : st.zustand < 50 ? tx("ui2.ui.Reich.628669a") : st.zustand < 70 ? tx("ui2.ui.Reich.8db82ca") : tx("ui2.ui.Reich.1ba54c0")}
                {Number.isFinite(erbe) && <> {tx("ui2.ui.Reich.4bc0142")} <b>{Math.round(erbe)}</b> {tx("ui2.ui.Reich.97a6c71")}</>}
              </p>
              {laeuft ? (
                <p className="rp-satz">{t("ui.Reich.b1cebac")}</p>
              ) : st.zustand > 82 ? (
                <p className="rp-satz rp-nicht">{t("ui.Reich.27320b7")}</p>
              ) : (
                def && (
                  <div className="rp-eingriff">
                    <p className="rp-satz">
                      {tx("ui2.ui.Reich.b2936db", { p0: Math.round(st.zustand) })} {nach !== undefined ? Math.round(nach) : "?"}.
                      {folgen.length > 0 ? tx("ui2.ui.Reich.2d8fdd0") : ""}
                    </p>
                    <Zeilen zeilen={folgen} />
                    <ul className="rr-kosten" aria-label={tx("ui2.ui.Reich.9bc1843")}>
                      <li><b>{def.kosten.pk}</b> {tx("ui2.ui.Reich.28d438e")}</li>
                      <li><b>{def.kosten.bau}</b> {tx("ui2.ui.Reich.f4466ae")}</li>
                      <li><b>{def.kosten.monate}</b> {tx("ui2.ui.Reich.1c561ae")}</li>
                    </ul>
                    <button type="button" className="aktion-knopf" onClick={() => restauriere(e)} title={`${def.kehrseite}`}>
                      {tx("ui2.ui.Reich.e0e3ae0")}
                    </button>
                  </div>
                )
              )}
            </li>
          );
        })}
      </ul>
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
                <b className="loyal" /> {tx("ui2.ui.Reich.e20dbbc", { p0: s.loyal })} <b className="reform" /> {s.reform} reformorientiert <b className="unabhaengig" /> {tx("ui2.ui.Reich.da33253", { p0: s.unabhaengig })}
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
  const e = world.economy;
  const z = (x: number, d = 1) => x.toLocaleString(aktuelleLocale(), { minimumFractionDigits: d, maximumFractionDigits: d });
  return (
    <section className="rr-abschnitt">
      <h4>
        {tx("ui2.ui.Reich.c84da49")} <em>{t("ui.Reich.048ca62")}</em>
      </h4>
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
            <tr><th>{t("ui.Reich.6121d6a")}</th><td className={k.legitimitaet >= 0 ? "hoch" : "runter"}>{k.legitimitaet >= 0 ? "+" : "−"}{z(Math.abs(k.legitimitaet))}</td></tr>
            <tr className="summe"><th>{tx("ui2.ui.Reich.2197d26")}</th><td>{z(k.summe)}</td></tr>
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
                {v.unterhalt ? <span className="rr-bau-info">{tx("ui2.ui.Reich.cf4af98", { p0: v.unterhalt.toLocaleString("de-DE") })}</span> : null}
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

/** Auf der Lage-Seite: wo Pflege am meisten bringt, mit Sprung in die Pflegeliste. Bei der Kultur sind es die am schlechtesten erhaltenen Stätten. */
function Dringend({ world, bereich, refresh, zuPflege }: { world: World; bereich: Bereich; refresh: () => void; zuPflege: () => void }) {
  if (bereich === "kultur") return <Staetten world={world} refresh={refresh} nurSchlechte={3} />;
  return <Lohnt world={world} bereich={bereich} refresh={refresh} zuPflege={zuPflege} />;
}

export function Reich(props: { world: World; bereich: Bereich; refresh: () => void; onKarte?: (o: { lon: number; lat: number }) => void; /** Reiter, mit dem die Akte beginnt (eine Marke der Karte kann „Pflegen“ vorgeben) */ startTab?: Tab }) {
  // Je Bereich eigener Zustand der Reiter: Beim Wechsel beginnt die Akte wieder bei der Lage (oder beim vorgegebenen Reiter)
  return <ReichInnen key={`${props.bereich}:${props.startTab ?? ""}`} {...props} />;
}

function ReichInnen({ world, bereich, refresh, onKarte, startTab }: { world: World; bereich: Bereich; refresh: () => void; onKarte?: (o: { lon: number; lat: number }) => void; startTab?: Tab }) {
  const tabs = tabsFuerBereich(bereich);
  const [tab, setTab] = useState<Tab>(startTab && tabs.some((x) => x.id === startTab) ? startTab : "lage");
  const [ergebnisse, setErgebnisse] = useState<Record<string, { ok: boolean; text: string }>>({});
  if (!world.spiel) return <p>{t("ui.Reich.186589c")}</p>;
  const z = reichZustand(world);
  const kapitalJetzt = world.spiel.kapital;
  const liste = vorhabenListe(world, bereich);

  const beginneVorhaben = (id: string, vergabe: Vergabe = "ausschreibung") => {
    const r = beginne(world, id, vergabe);
    setErgebnisse((e) => ({ ...e, [id]: { ok: r.ok, text: r.why ? `${r.text} ${r.why}` : r.text } }));
    refresh();
  };

  // Pflege (Instandsetzung, Restaurierung) gehört in „pflegen“, nicht unter die neuen Vorhaben
  const neu = liste.filter((s) => s.status !== "fertig" && s.status !== "im_bau" && s.status !== "pausiert" && (s.v.klasse !== "restaurierung" || !!s.v.vorlage));
  const technik = bereich === "infrastruktur" || bereich === "militaer";
  // Was fertig ist: Bei Technik steht es unter „pflegen“, die Einrichtungen des Rechts unter „Lage“, der Rest unter den neuen Vorhaben
  const vollendet = technik ? [] : liste.filter((s) => s.status === "fertig" && s.v.klasse !== "restaurierung" && s.v.klasse !== "institution");
  const gross = (s: VorhabenSicht) => s.v.klasse === "wunder" || s.v.klasse === "grossprojekt" || s.v.klasse === "serie";
  const bereitN = neu.filter((s) => s.status === "verfuegbar" && s.bereit).length;
  const dringendN = bereich === "kultur" ? ERBE.filter((e) => (z.staetten[e.id]?.zustand ?? 100) < 45).length : technik ? lohnendste(world, bereich, 99, 1).length : 0;
  const plakette = (id: Tab): number => (id === "neu" ? bereitN : id === "bestand" ? dringendN : 0);

  return (
    <div className="reich">
      {tabs.length > 1 && (
        <div className="rr-tabs" role="tablist" aria-label={`${BEREICH_NAMEN[bereich]}: Ansicht`}>
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
            <Statistik world={world} />
            <Groessen world={world} liste={GROESSEN[bereich]} />
          </section>
          {(bereich === "kultur" || technik) && <Dringend world={world} bereich={bereich} refresh={refresh} zuPflege={() => setTab("bestand")} />}
          {bereich === "haushalt" && <Haushalt world={world} />}
          {bereich === "recht" && <Sitze world={world} />}
          {bereich === "recht" && <Institutionen world={world} />}
          <ImBau world={world} bereich={bereich} refresh={refresh} />
          <Baureihenfolge world={world} refresh={refresh} />
          <Verlauf world={world} bereich={bereich} />
          <VorteileListe world={world} bereich={bereich} />
          {z.meldungen.length > 0 && (
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

      {tab === "bestand" && bereich === "kultur" && <Staetten world={world} refresh={refresh} />}
      {tab === "bestand" && technik && <PflegeListe world={world} bereich={bereich} refresh={refresh} />}

      {tab === "neu" && (
        <>
          {bereich === "infrastruktur" && <Schaetzblaetter world={world} refresh={refresh} />}
          <Neues world={world} liste={neu} alle={liste} onBeginne={beginneVorhaben} ergebnisse={ergebnisse} refresh={refresh} {...(onKarte ? { onKarte } : {})} />
          {vollendet.length > 0 && (
            <section className="rr-abschnitt">
              <h4>
                {tx("ui2.ui.Reich.8c37851")} <em>{vollendet.length} {vollendet.length === 1 ? tx("ui2.ui.Reich.d335b73") : tx("ui2.ui.Reich.d335b73")}</em>
              </h4>
              <div className="rr-raster gross">
                {vollendet.map((s) => (
                  <VorhabenKarte key={s.v.id} s={s} world={world} gross={gross(s)} onBeginne={beginneVorhaben} kapital={kapitalJetzt} {...(onKarte ? { onKarte } : {})} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

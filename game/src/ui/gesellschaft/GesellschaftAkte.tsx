// Akte „Gesellschaft“: Lage (Kennzahlen mit Verlauf, Milieus), Opposition (Führung, Stärke, Züge, Instrumente), Straße (Bewegungen mit
// Antworten und Vorschau), Rathäuser (Kommunen, nächste Wahl, Zwangsverwalter). Alles aus sim/gesellschaft.ts und den Nachbarmodulen.

import { useState } from "react";
import type { World } from "../../sim/types";
import { gesellschaftLage, gesellschaftVon, milieuLage } from "../../sim/gesellschaft";
import { oppositionInstrument, oppositionInstrumente, oppositionVon, parteiName, zielStaerke, type OppInstrument } from "../../sim/opposition";
import { bewegungAntworten, bewegungenSicht } from "../../sim/bewegungen";
import { istLagerPartei, kommunenVon, VERWALTER_KOSTEN, zwangsverwalterAbziehen, zwangsverwalterEinsetzen } from "../../sim/kommunen";
import { PROVINZEN, REGION_DE } from "../../sim/regional";
import { figur } from "../../sim/figuren";
import type { BewegungsAntwort } from "../../sim/gesellschaft-typen";
import { formatDateDe } from "../../sim/dates";
import { t } from "../../i18n";
import { Portraet } from "../art/Portraet";
import { Sparkline } from "../waehler/Sparkline";
import "./gesellschaft.css";

type Reiter = "lage" | "opposition" | "strasse" | "kommunen";

const balken = (x: number) => Math.max(0, Math.min(100, x));

function Balken({ wert, warn = 60, umgekehrt = false }: { wert: number; warn?: number; umgekehrt?: boolean }) {
  const schlecht = umgekehrt ? wert < 100 - warn : wert >= warn;
  return (
    <i className={`ges-balken${schlecht ? " schlecht" : ""}`} aria-hidden>
      <b style={{ width: `${balken(wert)}%` }} />
    </i>
  );
}

function Lage({ world }: { world: World }) {
  const zahlen = gesellschaftLage(world);
  const milieus = milieuLage(world);
  return (
    <div className="ges-lage">
      <div className="ges-kennzahlen">
        {zahlen.map((k) => (
          <article key={k.id} className="ges-kennzahl">
            <header>
              <span>{t(`ges.kz.${k.id}`)}</span>
              <strong>{k.wert}{k.id === "rathaeuser" ? " / 81" : ""}</strong>
            </header>
            <Sparkline monate={k.reihe.monate} werte={k.reihe.werte} hoehe={54} beschriftung={t(`ges.kz.${k.id}`)} />
            <p>{t(`ges.kz.${k.id}.text`)}</p>
          </article>
        ))}
      </div>
      <h3 className="ges-h">{t("ges.milieus.titel")}</h3>
      <p className="ges-unter">{t("ges.milieus.text")}</p>
      <div className="ges-milieus">
        {milieus.map((m) => (
          <article key={m.id} className="ges-milieu">
            <header>
              <strong>{t(`ges.milieu.${m.id}`)}</strong>
              <span className={`ges-trend ${m.trend}`}>{t(`ges.trend.${m.trend}`)}</span>
            </header>
            <div className="ges-zeile">
              <span>{t("ges.milieu.stimmung")}</span>
              <Balken wert={m.stimmung} umgekehrt />
              <em>{m.stimmung}</em>
            </div>
            <div className="ges-zeile">
              <span>{t("ges.milieu.groll")}</span>
              <Balken wert={m.groll} warn={45} />
              <em>{m.groll}</em>
            </div>
            <p className="ges-ursache">
              {t("ges.milieu.ursachen")} {m.ursachen.map((u) => `${u.id.replace(/^m_/, "")} ${u.beitrag >= 0 ? "+" : "−"}${Math.abs(u.beitrag)}`).join(" · ")}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function Opposition({ world, onAktion }: { world: World; onAktion: (text: string) => void }) {
  const o = oppositionVon(world);
  const f = figur(world, "opposition");
  const instr = oppositionInstrumente(world);
  const ziel = Math.round(zielStaerke(world, o));
  return (
    <div className="ges-opp">
      <section className="ges-opp-kopf">
        <Portraet seed={f?.name ?? o.partei} size={132} {...(f ? { geschlecht: f.weiblich ? "f" : "m" } : {})} rolle="opposition" stimmung={o.staerke > 60 ? "sicher" : o.verfahren > 1 ? "veraergert" : "ernst"} />
        <div>
          <p className="ges-kicker">{t("ges.opp.kicker")}</p>
          <h3>{f?.name ?? parteiName(o.partei)}</h3>
          <p className="ges-unter">{t("ges.opp.fuehrt", { partei: parteiName(o.partei) })}{o.buendnis.length ? " · " + t("ges.opp.buendnis", { mit: o.buendnis.map(parteiName).join(", ") }) : ""}</p>
          <div className="ges-zeile breit">
            <span>{t("ges.opp.staerke")}</span>
            <Balken wert={o.staerke} warn={55} />
            <em>{Math.round(o.staerke)}</em>
          </div>
          <p className="ges-unter">{t("ges.opp.ziel", { ziel })}</p>
          <ul className="ges-marken">
            {o.verfahren >= 0.5 && <li>{t("ges.opp.marke.verfahren", { n: Math.round(o.verfahren) })}</li>}
            {o.maertyrer >= 5 && <li>{t("ges.opp.marke.maertyrer", { n: Math.round(o.maertyrer) })}</li>}
            {o.immunitaetAufgehoben && <li>{t("ges.opp.marke.immunitaet")}</li>}
            {o.verbot && <li>{o.verbot.ausgang ? t(`ges.opp.marke.verbot_${o.verbot.ausgang}`) : t("ges.opp.marke.verbot_laeuft", { d: formatDateDe(datumIn(world, o.verbot.entscheidAm)) })}</li>}
            {o.ausschussBis !== undefined && <li className="warn">{t("ges.opp.marke.ausschuss", { tage: o.ausschussBis - world.day })}</li>}
          </ul>
        </div>
      </section>
      <h3 className="ges-h">{t("ges.opp.instrumente")}</h3>
      <div className="ges-instrumente">
        {instr.map((i) => (
          <article key={i.id} className={`ges-instrument${i.moeglich ? "" : " gesperrt"}`}>
            <header>
              <strong>{t(`ges.opp.instrument.${i.id}`)}</strong>
              <span className="ges-preis">{t("ges.preis", { k: i.kapital, a: i.aufmerksamkeit })}</span>
            </header>
            <ul>{i.folgen.map((x) => <li key={x}>{x}</li>)}</ul>
            {i.staerkeSofort !== 0 && <p className="ges-vorschau">{t("ges.opp.vorschau", { d: `${i.staerkeSofort > 0 ? "+" : "−"}${Math.abs(i.staerkeSofort)}` })}</p>}
            <button type="button" className="brass-button" disabled={!i.moeglich} title={i.grund ?? ""} onClick={() => onAktion(oppositionInstrument(world, i.id as OppInstrument).text)}>
              {i.moeglich ? t("ges.ausfuehren") : i.grund}
            </button>
          </article>
        ))}
      </div>
      <h3 className="ges-h">{t("ges.opp.zuege")}</h3>
      <ol className="ges-chronik">
        {o.zuege.slice(-8).reverse().map((z) => (
          <li key={z.tag + z.art}>
            <time>{formatDateDe(z.datum)}</time> <strong>{t(`ges.opp.zugart.${z.art}`)}</strong> {z.text}
          </li>
        ))}
        {o.zuege.length === 0 && <li className="leer">{t("ges.opp.keine_zuege")}</li>}
      </ol>
    </div>
  );
}

function datumIn(w: World, tag: number): string {
  return new Date(Date.parse(w.date + "T00:00:00Z") + (tag - w.day) * 86_400_000).toISOString().slice(0, 10);
}

function Strasse({ world, onAktion }: { world: World; onAktion: (text: string) => void }) {
  const liste = bewegungenSicht(world);
  const g = gesellschaftVon(world);
  return (
    <div className="ges-strasse">
      {liste.length === 0 && <p className="ges-leer">{t("ges.bew.keine")}</p>}
      {liste.map(({ b, druck, antworten }) => (
        <article key={b.id} className={`ges-bewegung phase-${b.phase}`}>
          <header>
            <div>
              <p className="ges-kicker">{t(`ges.bew.phase.${b.phase}`)}</p>
              <h3>{t(`ges.bew.art.${b.art}`)}</h3>
              <p className="ges-unter">{b.provinzen.map((p) => PROVINZEN[p - 1]?.name).join(", ")} · {t("ges.bew.seit", { d: formatDateDe(datumIn(world, b.seit)) })} · {t("ges.bew.druck", { n: druck })}</p>
            </div>
          </header>
          <div className="ges-drei">
            {(["groesse", "radikalitaet", "maertyrer"] as const).map((k) => (
              <div key={k} className="ges-zeile">
                <span>{t(`ges.bew.${k}`)}</span>
                <Balken wert={b[k]} warn={k === "groesse" ? 45 : 50} />
                <em>{Math.round(b[k])}</em>
              </div>
            ))}
          </div>
          <div className="ges-antworten">
            {antworten.map((a) => (
              <button key={a.id} type="button" className={`ges-antwort a-${a.id}`} disabled={!a.moeglich} title={a.grund ?? ""} onClick={() => onAktion(bewegungAntworten(world, b.id, a.id as BewegungsAntwort).text)}>
                <strong>{t(`ges.bew.antwort.${a.id}`)}</strong>
                <span className="ges-preis">{t("ges.preis", { k: a.kapital, a: a.aufmerksamkeit })}</span>
                <span className="ges-vorschau">{t("ges.bew.vorschau", { g: a.vorschau.groesse, r: a.vorschau.radikal, m: a.vorschau.maertyrer })}</span>
                <span className="ges-folgen">{a.folgen.join(" · ")}</span>
              </button>
            ))}
          </div>
        </article>
      ))}
      {g.frueher.length > 0 && (
        <>
          <h3 className="ges-h">{t("ges.bew.frueher")}</h3>
          <ol className="ges-chronik">
            {g.frueher.slice(-8).reverse().map((f) => (
              <li key={f.von + f.art}>
                <time>{formatDateDe(f.von)} – {formatDateDe(f.bis)}</time> <strong>{t(`ges.bew.art.${f.art}`)}</strong> {t("ges.bew.spitze", { n: f.spitze })} · {t(`ges.bew.ende.${f.ende}`)}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

function Kommunen({ world, onAktion }: { world: World; onAktion: (text: string) => void }) {
  const k = kommunenVon(world);
  const regionen = [...new Set(PROVINZEN.map((p) => p.region))];
  const lager = Object.values(k.rathaus).filter((r) => istLagerPartei(world, r.partei)).length;
  const letzte = k.wahlen[k.wahlen.length - 1];
  return (
    <div className="ges-kommunen">
      <p className="ges-unter">
        {t("ges.kom.stand", { lager, naechste: formatDateDe(k.naechste) })}
        {letzte ? " " + t("ges.kom.letzte", { d: formatDateDe(letzte.datum), vorher: letzte.lagerVorher, nachher: letzte.lagerNachher }) : ""}
      </p>
      <p className="ges-unter">{t("ges.kom.verwalter_hinweis", { k: VERWALTER_KOSTEN.kapital })}</p>
      {regionen.map((reg) => (
        <section key={reg} className="ges-region">
          <h4>{REGION_DE[reg] ?? reg}</h4>
          <div className="ges-rathaeuser">
            {PROVINZEN.filter((p) => p.region === reg).map((p) => {
              const r = k.rathaus[String(p.plaka)]!;
              const eigen = istLagerPartei(world, r.partei);
              return (
                <div key={p.plaka} className={`ges-rathaus${eigen ? " lager" : ""}${r.verwalter ? " verwalter" : ""}`}>
                  <span className="name">{p.name}</span>
                  <span className="partei">{r.verwalter ? t("ges.kom.verwaltet") : parteiName(r.partei)}</span>
                  {r.verwalter ? (
                    <button type="button" onClick={() => onAktion(zwangsverwalterAbziehen(world, p.plaka).text)}>{t("ges.kom.abziehen")}</button>
                  ) : !eigen ? (
                    <button type="button" onClick={() => onAktion(zwangsverwalterEinsetzen(world, p.plaka).text)}>{t("ges.kom.einsetzen")}</button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function GesellschaftAkte({ world }: { world: World }) {
  const [reiter, setReiter] = useState<Reiter>("lage");
  const [meldung, setMeldung] = useState<string | null>(null);
  const [, setTick] = useState(0);
  if (!world.spiel) return null;
  const onAktion = (text: string) => {
    setMeldung(text);
    setTick((x) => x + 1);
  };
  const g = gesellschaftVon(world);
  return (
    <div className="ges-akte">
      <p className="ges-zweck">{t("ges.zweck")}</p>
      <nav className="ges-reiter" role="tablist">
        {(["lage", "opposition", "strasse", "kommunen"] as Reiter[]).map((r) => (
          <button key={r} type="button" role="tab" aria-selected={reiter === r} className={reiter === r ? "on" : ""} onClick={() => setReiter(r)}>
            {t(`ges.reiter.${r}`)}
            {r === "strasse" && g.bewegungen.length > 0 && <span className="zahl">{g.bewegungen.length}</span>}
          </button>
        ))}
      </nav>
      {meldung && (
        <p className="ges-meldung" role="status">
          {meldung}
        </p>
      )}
      {reiter === "lage" && <Lage world={world} />}
      {reiter === "opposition" && <Opposition world={world} onAktion={onAktion} />}
      {reiter === "strasse" && <Strasse world={world} onAktion={onAktion} />}
      {reiter === "kommunen" && <Kommunen world={world} onAktion={onAktion} />}
    </div>
  );
}

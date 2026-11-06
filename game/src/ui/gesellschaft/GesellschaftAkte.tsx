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
import { prozent, vz } from "../waehler/format";
import { NET } from "../../sim/modell";
import { oppositionsEinfluss } from "../../sim/wahl";
import { Icon } from "../icons";
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
  // Opposition, Polarisierung und Protestdruck stehen im Aktenkopf; hier nur, was dort fehlt (E-8). Der Hinweis auf zu wenig Verlauf einmal (E-35).
  const zahlen = gesellschaftLage(world).filter((k) => k.id !== "opposition" && k.id !== "polarisierung" && k.id !== "protest");
  const milieus = milieuLage(world);
  const mitVerlauf = zahlen.some((k) => k.reihe.werte.filter((v) => v !== null).length >= 2);
  return (
    <div className="ges-lage">
      {!mitVerlauf && <p className="ges-unter">{t("nacht_n2.lage.ohne_verlauf")}</p>}
      <div className="ges-kennzahlen">
        {zahlen.map((k) => (
          <article key={k.id} className="ges-kennzahl">
            <header>
              <span>{t(`ges.kz.${k.id}`)}</span>
              <strong>{k.wert}{k.id === "rathaeuser" ? " / 81" : ""}</strong>
            </header>
            {mitVerlauf && <Sparkline monate={k.reihe.monate} werte={k.reihe.werte} hoehe={54} beschriftung={t(`ges.kz.${k.id}`)} />}
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
            <MilieuUrsachen ursachen={m.ursachen} />
          </article>
        ))}
      </div>
    </div>
  );
}

/** Ursachen eines Milieus mit Namen aus dem Netz statt interner Kennungen (E-9): „Hilft: Ausnahmerecht niedrig (+8)“. */
function MilieuUrsachen({ ursachen }: { ursachen: { id: string; beitrag: number; wert: number }[] }) {
  const teil = (u: (typeof ursachen)[number]) => {
    const i = NET.index.get(u.id);
    const name = i !== undefined ? NET.nodes[i]!.name : u.id;
    return t(u.wert < 50 ? "nacht_n2.milieu.niedrig" : "nacht_n2.milieu.hoch", { name, d: vz(u.beitrag) });
  };
  const hilft = ursachen.filter((u) => u.beitrag > 0.05);
  const schadet = ursachen.filter((u) => u.beitrag < -0.05);
  if (!hilft.length && !schadet.length) return null;
  return (
    <p className="ges-ursache">
      {hilft.length > 0 && <span className="gut">{t("nacht_n2.milieu.hilft", { liste: hilft.map(teil).join(", ") })}</span>}
      {hilft.length > 0 && schadet.length > 0 && " · "}
      {schadet.length > 0 && <span className="schlecht">{t("nacht_n2.milieu.schadet", { liste: schadet.map(teil).join(", ") })}</span>}
    </p>
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
          <p className="ges-unter">{t("nacht_n2.opp.stand", { d: vz(oppositionsEinfluss(world)) })}</p>
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
            <p className={`ges-vorschau ges-wahl ${i.wahl.wahltag > 0.05 ? "gut" : i.wahl.wahltag < -0.05 ? "schlecht" : ""}`}>
              {t("nacht_n2.opp.wahl", { heute: vz(i.wahl.heute), wahltag: vz(i.wahl.wahltag) })}
              {i.wahl.heute > 0.05 && i.wahl.wahltag < 0 ? <em> {t("nacht_n2.opp.wahl_kehrt")}</em> : null}
            </p>
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

/** Ruhe auf der Straße: kein leeres Blatt, sondern Protestdruck und die Milieus mit dem meisten Groll (Gestaltung leerer Zustände). */
function StrasseRuhig({ world }: { world: World }) {
  const protest = gesellschaftLage(world).find((k) => k.id === "protest")?.wert ?? 0;
  const milieus = [...milieuLage(world)].sort((a, b) => b.groll - a.groll).slice(0, 3);
  return (
    <section className="ges-ruhe">
      <div className="ges-ruhe-zeichen" aria-hidden>
        <Icon name="menge" size={44} />
      </div>
      <div>
        <h3>{t("nacht_n2.strasse.leer_titel")}</h3>
        <p className="ges-unter">{t("nacht_n2.strasse.leer_text", { protest })}</p>
        <ul className="ges-ruhe-liste">
          <li className="kopf">
            <span>{t("ges.kz.protest")}</span>
            <Balken wert={protest} warn={50} />
            <em>{protest}</em>
          </li>
          {milieus.map((m) => (
            <li key={m.id}>
              <span>{t("nacht_n2.strasse.milieu", { name: t(`ges.milieu.${m.id}`) })}</span>
              <Balken wert={m.groll} warn={45} />
              <em>{m.groll}</em>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Strasse({ world, onAktion }: { world: World; onAktion: (text: string) => void }) {
  const liste = bewegungenSicht(world);
  const g = gesellschaftVon(world);
  return (
    <div className="ges-strasse">
      {liste.length === 0 && <StrasseRuhig world={world} />}
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
                <span className="ges-buchung">
                  {[
                    t("nacht_n2.bew.zustimmung", { d: vz(a.zustimmung) }),
                    ...(a.massnahme ? [t("nacht_n2.bew.massnahme", { name: NET.nodes[NET.index.get(a.massnahme.id)!]!.name, n: a.massnahme.stufen })] : []),
                    ...(a.opfer ? [t("nacht_n2.bew.opfer", { chance: prozent(a.opfer.chance, 0), d: vz(a.opfer.zustimmung) })] : []),
                  ].join(" · ")}
                </span>
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

export function GesellschaftAkte({ world, start = "lage", onAenderung }: { world: World; start?: Reiter; onAenderung?: () => void }) {
  const [reiter, setReiter] = useState<Reiter>(start);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [, setTick] = useState(0);
  if (!world.spiel) return null;
  // Jede Handlung zeichnet die Kopfleiste neu und sichert den Spielstand, wie in den anderen Akten (E-6)
  const onAktion = (text: string) => {
    setMeldung(text);
    setTick((x) => x + 1);
    onAenderung?.();
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

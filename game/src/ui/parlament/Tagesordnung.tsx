// Parlament › Tagesordnung (Plan Oberfläche, Anhang A; ENTSCHEIDUNGEN W 2; befund-B B-7, B-8, B-10, B-21): der eine Ort, an dem man
// sieht, wo jedes Gesetz steht. Oben der Weg als Bild (Vorlage → Ausschuss → Plenum → Präsident → Gericht → Umsetzung), darunter je Vorlage
// eine Karte mit ihrer Station, den Handlungen dieser Station (Kompromiss im Ausschuss, Absprachen mit benannten Abgeordneten,
// Unterschrift oder Rücksendung) und dem Ja-Balken an der Mehrheitslinie. Der leere Zustand zeigt, was die Fraktion einbringen
// könnte, und den Gesetzeskatalog mit den Streitpunkten aus data/gesetze/. Alle Zahlen kommen aus der Simulation.

import { useState } from "react";
import type { World } from "../../sim/types";
import type { Gesetz } from "../../sim/spiel-typen";
import { tagesordnung, type TagesordnungPunkt } from "../../sim/tagesordnung";
import { REGELN, gesetzPhase, gesetzPrognose, provinzenText, zieheGesetzZurueck, type GesetzPhase } from "../../sim/handeln";
import { ausschussKompromiss, ausschussMehrheit, ausschussVorschau, gesetzesTisch, sendeZurueck, unterschreibe, zurUnterschrift, type VorhabenSicht } from "../../sim/gesetzgebung";
import { absprachenAngebote, provinzVon, risikoWort, schliesseAbsprache } from "../../sim/fraktionen-absprachen";
import { PARTEI_NAME } from "../../sim/fraktionen";
import { streitpunkte } from "../../data/gesetze";
import { VORHABEN_NACH_ID } from "../../data/gesetzesvorhaben";
import { stufenName } from "../../data/skalen";
import { addDays, formatDateDe } from "../../sim/dates";
import { NotstandKarte } from "./NotstandKarte";
import { VersorgungsTagesordnung } from "../gueter/VersorgungsMandat";
import { notstandVon } from "../../sim/notstand";
import { t } from "../../i18n";
import "./tagesordnung.css";

type Ergebnis = { ok: boolean; text: string; why?: string };

const STATIONEN = ["vorlage", "ausschuss", "plenum", "praesident", "gericht", "umsetzung"] as const;
type Station = (typeof STATIONEN)[number];

function Balken({ p }: { p: TagesordnungPunkt }) {
  if (p.ja === undefined || p.schwelle === undefined) return null;
  const pct = (x: number) => `${Math.min(100, Math.max(0, (x / 600) * 100))}%`;
  return (
    <div className="to-balken" role="img" aria-label={t("to.balkenAria", { ja: p.ja, schwelle: p.schwelle })}>
      {p.tief !== undefined && p.hoch !== undefined && <span className="to-spanne" style={{ left: pct(p.tief), width: `calc(${pct(p.hoch)} - ${pct(p.tief)})` }} />}
      <span className={`to-ja to-${p.urteil ?? "knapp"}`} style={{ width: pct(p.ja) }} />
      <span className="to-linie" style={{ left: pct(p.schwelle) }} title={String(p.schwelle)} />
      {p.direkt !== undefined && <span className="to-linie to-direkt" style={{ left: pct(p.direkt) }} title={String(p.direkt)} />}
    </div>
  );
}

/** Der Weg eines Gesetzes als Bild: sechs Stationen, mit der Zahl der Vorlagen, die gerade dort stehen. */
function WegBild({ zahl, aktiv }: { zahl?: Partial<Record<Station, number>>; aktiv?: Station }) {
  return (
    <ol className={`to-weg${aktiv ? " to-weg-klein" : ""}`} aria-label={t("n4.to.weg")}>
      {STATIONEN.map((s, i) => {
        const n = zahl?.[s] ?? 0;
        const zustand = aktiv ? (STATIONEN.indexOf(aktiv) > i ? "vorbei" : aktiv === s ? "jetzt" : "") : n > 0 ? "jetzt" : "";
        return (
          <li key={s} className={`to-station ${zustand}`.trim()}>
            <span className="to-punkt" aria-hidden="true">{aktiv && zustand === "vorbei" ? "✓" : i + 1}{!aktiv && n > 0 && <em className="to-zahl-marke">{n}</em>}</span>
            <b>{t(`n4.to.st.${s}`)}</b>
            {!aktiv && <small>{t(`n4.to.st.${s}.wer`)}</small>}
          </li>
        );
      })}
    </ol>
  );
}

function stationVon(phase: GesetzPhase): Station {
  return phase === "ausschuss" ? "ausschuss" : "plenum";
}

/** Absprachen mit benannten Abgeordneten (B-10): wer, woher, wie viele Stimmen, welcher Preis, welches Risiko. */
function Absprachen({ world, g, tun }: { world: World; g: Gesetz; tun: (r: Ergebnis) => void }) {
  const angebote = absprachenAngebote(world, g);
  const kapital = world.spiel?.kapital ?? 0;
  if (!angebote.length) return null;
  return (
    <div className="to-absprachen">
      <p className="to-absprachen-kopf">{t("n4.to.absprachen")}</p>
      <ul>
        {angebote.map((a) => (
          <li key={a.id} className={`to-absprache art-${a.art}`}>
            <span className="to-abs-wer">
              <b>{a.wer}</b>
              <small>{t("n4.to.absWo", { partei: PARTEI_NAME[a.partei] ?? a.partei, provinz: provinzVon(a) })}</small>
            </span>
            <span className="to-abs-was">
              <b>{t("n4.to.absStimmen", { n: a.n })}</b>
              <small>{a.art === "zusage" ? t("n4.to.absZusage", { forderung: a.forderung ?? "" }) : t(`n4.to.abs.${a.art}`)}</small>
            </span>
            <span className={`to-abs-risiko r-${risikoWort(a.risiko)}`}>{t("n4.to.absRisiko", { risiko: t(`n4.abs.risiko.${risikoWort(a.risiko)}`) })}</span>
            <button type="button" className="pd-btn" disabled={kapital < a.kapital} onClick={() => tun(schliesseAbsprache(world, g.id, a.id))} title={kapital < a.kapital ? t("n4.abs.kapital", { n: a.kapital, da: Math.floor(kapital) }) : undefined}>
              {t("n4.to.absSchliessen")} <b>{a.kapital}</b>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GesetzKarte({ world, p, g, onMassnahme, tun }: { world: World; p: TagesordnungPunkt; g: Gesetz; onMassnahme: (id: string) => void; tun: (r: Ergebnis) => void }) {
  const phase = gesetzPhase(world, g);
  const gs = gesetzPrognose(world, g);
  const vorschau = phase === "ausschuss" ? ausschussVorschau(world, g) : undefined;
  const ohneAusschussMehrheit = phase === "ausschuss" && g.ausschuss === "offen" && !ausschussMehrheit(world);
  const datum = (tag: number) => formatDateDe(addDays(world.date, tag - world.day));
  const punkte = streitpunkte(g.vorhaben ? VORHABEN_NACH_ID.get(g.vorhaben)?.baustein : undefined);
  const kl = `to-zeile to-art-${phase === "kommission" ? "kommission" : "gesetz"}${p.urteil && phase !== "kommission" ? ` to-${p.urteil}` : ""}`;
  return (
    <li className={kl}>
      <div className="to-kopf">
        <span className="to-art">{t(phase === "kommission" ? "n4.to.art.kommission" : phase === "rueckgabe" ? "n4.to.art.rueckgabe" : "to.art.gesetz")}</span>
        <button type="button" className="to-titel" onClick={() => onMassnahme(g.massnahme)}>{g.name}</button>
        <span className="to-ziel">{t("n4.to.ziel", { ziel: stufenName(g.massnahme, g.stufe), ort: provinzenText(g.provinzen) })}</span>
      </div>
      {phase === "kommission" ? (
        <div className="to-kommission">
          <span className="to-kom-sitze" aria-hidden="true">
            {Array.from({ length: 15 }, (_, i) => <i key={i} className={i < 5 ? "staat" : i < 10 ? "an" : "ag"} />)}
          </span>
          <p>{t("n4.to.kommission", { datum: datum(g.abstimmung), n: Math.max(0, g.abstimmung - world.day) })}</p>
        </div>
      ) : (
        <>
          <ol className="to-weg to-weg-klein" aria-label={t("n4.to.weg")}>
            {STATIONEN.map((s, i) => {
              const jetzt = stationVon(phase);
              const zustand = STATIONEN.indexOf(jetzt) > i ? "vorbei" : jetzt === s ? "jetzt" : "";
              const wann = s === "vorlage" ? datum(g.eingebracht) : s === "ausschuss" && g.ausschussBis !== undefined ? t("n4.to.bis", { datum: datum(g.ausschussBis) }) : s === "plenum" ? datum(g.abstimmung) : s === "praesident" ? t("n4.to.tage15") : "";
              return (
                <li key={s} className={`to-station ${zustand}`.trim()}>
                  <span className="to-punkt" aria-hidden="true">{zustand === "vorbei" ? "✓" : i + 1}</span>
                  <b>{t(`n4.to.st.${s}`)}</b>
                  {wann && <small>{wann}</small>}
                </li>
              );
            })}
          </ol>
          <Balken p={p} />
          <div className="to-fuss">
            <span className="to-zahl">
              {t("n4.to.erwartet", { ja: gs.ja, schwelle: gs.schwelle })}
              {gs.luecke > 0 ? <b> · {t("to.fehlt", { n: gs.luecke })}</b> : gs.urteil === "knapp" ? <b> · {t("to.knapp")}</b> : null}
            </span>
            <button type="button" className="pd-btn quiet" onClick={() => tun(zieheGesetzZurueck(world, g.id))}>
              {t("to.zurueck", { n: Math.floor(g.pk * REGELN.rueckzugAnteil) })}
            </button>
          </div>
          {phase === "rueckgabe" && <p className="to-hinweis">{t("n4.to.rueckgabeHinweis", { noetig: REGELN.mehrheit })}</p>}
          {phase === "ausschuss" && (
            <div className="to-ausschuss">
              {punkte.length > 0 && <p className="to-streit">{t("n4.to.streitpunkte", { liste: punkte })}</p>}
              {ohneAusschussMehrheit && <p className="to-warnung">{t("n4.to.ohneAusschussMehrheit")}</p>}
              {g.ausschuss === "kompromiss" && <p className="to-hinweis">{t("n4.to.kompromissGemacht")}</p>}
              {vorschau && vorschau.ja > gs.ja && (
                <button type="button" className="pd-btn" onClick={() => tun(ausschussKompromiss(world, g.id))}>
                  {t("n4.to.kompromiss", { ziel: vorschau.ziel, ja: vorschau.ja })}
                </button>
              )}
            </div>
          )}
          {g.ausschuss === "geaendert" && phase === "plenum" && g.urStufe !== undefined && (
            <p className="to-warnung">{t("n4.to.geaendert", { vorher: stufenName(g.massnahme, g.urStufe), jetzt: stufenName(g.massnahme, g.stufe) })}</p>
          )}
          <Absprachen world={world} g={g} tun={tun} />
        </>
      )}
    </li>
  );
}

function VorhabenKarte({ v, onMassnahme }: { v: VorhabenSicht; onMassnahme: (id: string) => void }) {
  const punkte = streitpunkte(v.def.baustein);
  const parteien = (l: VorhabenSicht["lager"]["fuer"]) => l.filter((e) => e.art !== "eigene" && e.art !== "partner").slice(0, 3).map((e) => e.name);
  const dafuer = parteien(v.lager.fuer);
  const dagegen = parteien(v.lager.gegen);
  return (
    <li className="to-vorhaben">
      <button type="button" className="to-titel" onClick={() => onMassnahme(v.def.massnahme)}>{v.titel}</button>
      {v.anlass && <span className={`to-anlass a-${v.anlass}`}>{t(`gesetz.ui.anlass.${v.anlass}`)}</span>}
      <p>{v.satz}</p>
      {(dafuer.length > 0 || dagegen.length > 0) && (
        <p className="to-lager">
          {dafuer.length > 0 && <span><b>{t("gesetz.ui.dafuer")}</b> {dafuer.join(", ")}</span>}
          {dagegen.length > 0 && <span><b>{t("gesetz.ui.dagegen")}</b> {dagegen.join(", ")}</span>}
        </p>
      )}
      {punkte.length > 0 && <p className="to-streit">{t("n4.to.streitpunkte", { liste: punkte })}</p>}
    </li>
  );
}

export function Tagesordnung({ world, refresh, onMassnahme, onHaushalt, onVerfassung, onPolitik }: {
  world: World;
  refresh: () => void;
  onMassnahme: (massnahme: string) => void;
  onHaushalt: () => void;
  onVerfassung: () => void;
  onPolitik: () => void;
}) {
  const [antwort, setAntwort] = useState<Ergebnis | null>(null);
  const punkte = tagesordnung(world);
  const sp = world.spiel;
  const unterschrift = zurUnterschrift(world);
  const tisch = sp ? gesetzesTisch(world) : [];
  const tun = (r: Ergebnis) => {
    setAntwort(r);
    refresh();
  };
  const zahl: Partial<Record<Station, number>> = {};
  for (const g of sp?.gesetze ?? []) {
    if (g.weg === "kommission") continue;
    const s = stationVon(gesetzPhase(world, g));
    zahl[s] = (zahl[s] ?? 0) + 1;
  }
  if (unterschrift.length) zahl.praesident = unterschrift.length;
  const gericht = punkte.filter((p) => p.art === "gericht").length;
  if (gericht) zahl.gericht = gericht;
  return (
    <section className="to" aria-label={t("to.titel")}>
      <WegBild zahl={zahl} />
      {antwort && (
        <p className={`rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
          {antwort.text}
          {antwort.why && <em> {antwort.why}</em>}
        </p>
      )}
      {unterschrift.length > 0 && (
        <ul className="to-liste">
          {unterschrift.map((u) => (
            <li key={u.gesetz.id} className="to-zeile to-unterschrift">
              <div className="to-kopf">
                <span className="to-art">{t("n4.to.st.praesident")}</span>
                <strong className="to-titel">{u.gesetz.name}</strong>
                <span className="to-termin">{t("n4.to.frist", { datum: formatDateDe(addDays(world.date, u.frist - world.day)), n: Math.max(0, u.frist - world.day) })}</span>
              </div>
              <p>{t("n4.to.unterschriftText", { ja: u.ja, nein: u.nein, jetzt: stufenName(u.gesetz.massnahme, u.gesetz.stufe), vorher: stufenName(u.gesetz.massnahme, u.gesetz.urStufe ?? u.gesetz.stufe) })}</p>
              <div className="to-fuss">
                <button type="button" className="brass-button" onClick={() => tun(unterschreibe(world, u.gesetz.id))}>{t("n4.to.unterschreiben")}</button>
                <button type="button" className="pd-btn" onClick={() => tun(sendeZurueck(world, u.gesetz.id))}>{t("n4.to.zuruecksenden", { noetig: REGELN.mehrheit })}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {notstandVon(world) && <NotstandKarte world={world} tun={tun} />}
      {punkte.length === 0 && unterschrift.length === 0 ? (
        <div className="to-leer">
          <p>{t("n4.to.leer")}</p>
          {tisch.length > 0 && (
            <>
              <h4>{t("n4.to.koennte")}</h4>
              <ul className="to-vorhaben-liste">{tisch.slice(0, 3).map((v) => <VorhabenKarte key={v.def.id} v={v} onMassnahme={onMassnahme} />)}</ul>
            </>
          )}
          <button type="button" className="pd-btn" onClick={onPolitik}>{t("to.zurPolitik")}</button>
        </div>
      ) : (
        <ol className="to-liste">
          {punkte.map((p) => {
            const g = p.art === "gesetz" ? sp?.gesetze.find((x) => x.id === p.gesetzId) : undefined;
            if (g) return <GesetzKarte key={p.id} world={world} p={p} g={g} onMassnahme={onMassnahme} tun={tun} />;
            const oeffne = p.art === "haushalt" ? onHaushalt : p.art === "verfassung" ? onVerfassung : undefined;
            return (
              <li key={p.id} className={`to-zeile to-art-${p.art}${p.urteil ? ` to-${p.urteil}` : ""}`}>
                <div className="to-kopf">
                  <span className="to-art">{t(`to.art.${p.art}`)}</span>
                  {oeffne ? <button type="button" className="to-titel" onClick={oeffne}>{p.titel}</button> : <strong className="to-titel">{p.titel}</strong>}
                  <span className="to-termin">{t(p.art === "gericht" ? "to.spruch" : "to.termin", { datum: formatDateDe(p.datum), n: p.tageBis })}</span>
                </div>
                <Balken p={p} />
                <div className="to-fuss">
                  {p.ja !== undefined && p.schwelle !== undefined ? (
                    <span className="to-zahl">
                      {t("to.erwartet", { ja: p.ja, schwelle: p.schwelle })}
                      {p.urteil === "knapp" && <b> · {t("to.knapp")}</b>}
                      {p.ja < p.schwelle && <b> · {t("to.fehlt", { n: p.schwelle - p.ja })}</b>}
                    </span>
                  ) : (
                    <span className="to-zahl">{t("to.gericht", { p: Math.round((p.p ?? 0) * 100) })}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {/* Versorgungsvorlagen mit ihren Klauseln stehen hier, beim einen Ort für Abstimmungen (B-7), nicht mehr auf der Fraktionsseite */}
      <VersorgungsTagesordnung world={world} geaendert={refresh} />
      {tisch.length > 0 && (
        <details className="to-katalog">
          <summary>{t("n4.to.katalog", { n: tisch.length })}</summary>
          <p className="to-hinweis">{t("n4.to.katalogText")}</p>
          <ul className="to-vorhaben-liste">{tisch.map((v) => <VorhabenKarte key={v.def.id} v={v} onMassnahme={onMassnahme} />)}</ul>
        </details>
      )}
    </section>
  );
}

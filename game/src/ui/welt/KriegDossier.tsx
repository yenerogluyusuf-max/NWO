// Das Konflikt-Dossier (MIL-1 „Krieg als Vorgang“) in der Welt-Ansicht. Aufbau nach Befund G-5/G-6/G-30 (5. November):
//   1. Kopf und Phasenleiter (Spannung → Drohkulisse → Beschluss → Krieg → Waffenruhe → Frieden) mit dem frühesten nächsten Schritt
//   2. Antwortstreifen: das Ergebnis des letzten Klicks (Einsatzart, Ultimatum, Friedenspaket …) mit Grund
//   3. Lage: vor dem Krieg Eskalation und Mobilmachung, im Krieg Front (zweifarbig um die Mitte), Rückhalt, Gefallene
//   4. Befehle: höchstens vier Hauptschritte, das Kriegsziel als eine Reihe, der Rest zugeklappt; im Krieg Einsatzart und Tempo
//   5. Was ein Krieg kosten würde (vor dem Krieg) und das Lagebild
//   6. Versorgung als eine Zeile, aufklappbar, mit Sprung in die Versorgungsakte
// Der Präsident bestellt und verantwortet hier, er kommandiert nicht. Alle Zahlen kommen aus sim/krieg.ts.

import { useState } from "react";
import type { World } from "../../sim/types";
import {
  KRIEG,
  PHASEN_NAME,
  RAHMUNG,
  aktiveKriege,
  demobSperreBis,
  doktrinPassung,
  eigenStaerke,
  fuehreKriegHandlungAus,
  gegnerStaerke,
  handlungenFuer,
  kriegMit,
  kriegsVorschau,
  kriseEroeffnen,
  kriseGrund,
  krisePreis,
  KRISE_AB,
  lagebild,
  mobilStand,
  phasenLeiter,
  spannungsVerlauf,
  type KriegHandlungId,
  type KriegHandlungSicht,
} from "../../sim/krieg";
import type { KriegVorgang } from "../../sim/krieg-typen";
import { addDays } from "../../sim/dates";
import { land } from "../../sim/laender";
import { militaerVersorgung } from "../../sim/versorgung";
import { gueterZustand } from "../../sim/gueter";
import { zivileVersorgungsDeckung } from "../../sim/versorgungspolitik";

import { datum, t, zahl } from "../../i18n";
import { useSprache } from "../../i18n/react";
import { Schauplatz } from "../krieg/Schauplatz";
import { Besatzung } from "../krieg/Besatzung";
import { Kriegsziel, Leiter } from "../krieg/Leiter";
import { Pakete } from "../krieg/Pakete";
import { Fernkonflikt } from "../krieg/Fernkonflikt";
import { istFernkonflikt } from "../../sim/fernkonflikt";
import { VersorgungsLage } from "../gueter/VersorgungsLage";
import { UbVerweis } from "../akte/Uebersicht";
const nf = (x: number) => zahl(Math.round(x), 0);

type Antwort = { ok: boolean; text: string; why?: string };

/** Wort für die gegnerische Stärke, wenn das Lagebild nur eine grobe Einordnung hergibt. */
function einordnung(eigen: number, gegner: number): string {
  const d = gegner - eigen;
  if (d <= -15) return t("krieg.d.schwaecher");
  if (d <= 15) return t("krieg.d.ebenbuertig");
  return t("krieg.d.staerker");
}

/** Welche Schritte je Phase oben stehen (die übrigen liegen unter „Weitere Schritte“); höchstens vier (Befund G-30). */
const VORRANG: Partial<Record<KriegVorgang["phase"], KriegHandlungId[]>> = {
  // Welle 3, K1: die nächste Sprosse der Leiter steht vorn (Drohkulisse, dann Ultimatum, dann Einsatz)
  spannung: ["drohkulisse", "vermittlung", "deeskalation", "bereitschaft"],
  // Ohne Kriegsziel gibt es keinen Beschluss: Dann rücken Beruhigen und Vermittlung nach oben (Welle H2, der Verlauf verweist auf sie)
  drohkulisse: ["ultimatum", "beschluss_vollmacht", "beschluss", "mobil_teil", "mobil_voll", "beschluss_erlass", "deeskalation", "vermittlung"],
  krieg: ["waffenruhe", "verstaerkung", "koalition_rufen", "mobil_voll"],
  // Die Pakete stehen als Karten darüber (ui/krieg/Pakete.tsx)
  waffenruhe: ["weiterkaempfen"],
};

function Handlung({ h, tun }: { h: KriegHandlungSicht; tun: (id: KriegHandlungId) => void }) {
  return (
    <li className={h.moeglich ? "" : "gesperrt"}>
      <button type="button" className="aktion-knopf" disabled={!h.moeglich} onClick={() => tun(h.id)}>
        {h.label} <b>{h.pk}</b>
      </button>
      <span>{h.moeglich ? h.hinweis : h.grund}</span>
    </li>
  );
}

/**
 * Wohin eine Spannung oder Drohkulisse ohne neuen Anlass läuft, was sie nährt und wo man sie entschärft (Welle H2, 6. November:
 * Im Spielstand 2039 stand die Spannung mit Israel zehn Jahre still, und nichts zeigte, was sie bewegt). Alle Tage aus `spannungsVerlauf`.
 */
function Verlauf({ world, k, onTab }: { world: World; k: KriegVorgang; onTab?: ((tab: "handeln" | "verhandeln") => void) | undefined }) {
  const v = spannungsVerlauf(world, k);
  if (!v) return null;
  const tag = (d: number) => addDays(world.date, d - world.day);
  const name = land(k.land).name;
  return (
    <div className="kd-verlauf">
      <h5>{t("welle_h2.krieg.verlauf.titel")}</h5>
      <p>
        {v.klingtAb
          ? t("welle_h2.krieg.verlauf.klingt", { datum: tag(v.genaehrt) })
          : t("welle_h2.krieg.verlauf.genaehrt", { datum: tag(v.genaehrt), ab: tag(v.abklingenAb), land: name, konflikt: nf(v.konflikt) })}{" "}
        {v.endeEtwa !== undefined ? t("welle_h2.krieg.verlauf.ende", { phase: k.phase, ende: tag(v.endeEtwa) }) : t("welle_h2.krieg.verlauf.kein_ende")}
      </p>
      <p className="subtitle">
        {t("welle_h2.krieg.verlauf.naehrt")} {t("welle_h2.krieg.verlauf.ruhe", { land: name, ruhe: nf(v.ruhewert) })}
      </p>
      <p className="kd-verlauf-wege">
        {t("welle_h2.krieg.verlauf.entschaerfen")}
        {onTab ? (
          <>
            <button type="button" className="link ub-verweis" onClick={() => onTab("handeln")}>{t("welle_h2.krieg.verlauf.gesten", { land: name })} →</button>
            <button type="button" className="link ub-verweis" onClick={() => onTab("verhandeln")}>{t("welle_h2.krieg.verlauf.tisch")} →</button>
          </>
        ) : (
          <span>
            {" "}
            {t("welle_h2.krieg.verlauf.gesten", { land: name })}, {t("welle_h2.krieg.verlauf.tisch")}
          </span>
        )}
      </p>
    </div>
  );
}

export function KriegDossier({ world, landId, refresh, onTab }: { world: World; landId: string; refresh: () => void; onTab?: (tab: "handeln" | "verhandeln") => void }) {
  useSprache();
  const [antwort, setAntwort] = useState<Antwort | null>(null);
  const k = kriegMit(world, landId);
  const melde = (r: Antwort) => {
    setAntwort(r);
    refresh();
  };
  const streifen = antwort && (
    <p className={`we-rueck kd-antwort ${antwort.ok ? "ok" : "nein"}`} role="status">
      {antwort.text}
      {antwort.why && <em>{antwort.why}</em>}
    </p>
  );
  if (!k) {
    // Ohne laufenden Vorgang: erklären, wie ein Konflikt entsteht, und die eigene Krise anbieten (PRUEFUNG_GESAMT_2026-11-04)
    const grund = kriseGrund(world, landId);
    const preis = krisePreis(world, landId);
    const fern = istFernkonflikt(landId);
    return (
      <section className="kd" aria-label={t("krieg.d.aria", { land: land(landId).name })}>
        {streifen}
        {/* Welle 3, K1: die erste Sprosse der Leiter mit ihrem Preis; die übrigen Sprossen stehen als Vorschau darunter */}
        <div className="kl kl-start">
          <h5>{t("welle_k1.leiter.titel")}</h5>
          <ol className="kl-sprossen">
            {(["druck", "drohkulisse", "ultimatum", "einsatz"] as const).map((id, i) => (
              <li key={id} className={`kl-sprosse ${i === 0 ? "jetzt" : "kommt"}`}>
                <b><i aria-hidden>{i + 1}</i>{t(`welle_k1.leiter.${id}`)}</b>
                <span>{t(`welle_k1.leiter.start.${id}`, { spannung: KRIEG.spannungMinTage, droh: KRIEG.drohkulisseMinTage })}</span>
              </li>
            ))}
          </ol>
          <p className="kl-hinweis">{t(fern ? "welle_k1.leiter.start.fern" : "welle_k1.leiter.start.land", { land: land(landId).name })}</p>
        </div>
        <div className="we-aktionen kd-handlungen">
          <button type="button" className="aktion-knopf" disabled={!!grund} onClick={() => melde(kriseEroeffnen(world, landId))}>
            {t("welle_k1.krise.knopf")} <b>{preis.pk}</b>
          </button>
          <span>{grund ?? t(preis.aufschlag ? "welle_k1.krise.preis_aufschlag" : "welle_k1.krise.preis", { ansehen: zahlZeichen1(preis.ansehen), vertrauen: zahlZeichen1(preis.vertrauen), land: land(landId).name, ab: KRISE_AB })}</span>
        </div>
        <p className="subtitle">{t("welle_k1.krise.erklaerung", { anlage: KRIEG.anlageAb })}</p>
        <Besatzung world={world} onTat={(text) => melde({ ok: true, text })} nurLand={landId} />
      </section>
    );
  }
  const l = land(landId);
  const handlungen = handlungenFuer(world, k.id);
  const bild = lagebild(world);
  const dok = doktrinPassung(world);
  const eigen = eigenStaerke(world, k);
  const gegner = gegnerStaerke(world, landId);
  const imKrieg = k.phase === "krieg" || k.phase === "waffenruhe";
  const vorKrieg = k.phase === "spannung" || k.phase === "drohkulisse" || k.phase === "beschluss";
  const trend = k.front > k.frontVorher + 0.5 ? "steigend" : k.front < k.frontVorher - 0.5 ? "fallend" : "stabil";
  const sperre = demobSperreBis(world);
  const leiter = phasenLeiter(world, k);
  const mob = mobilStand(world, k);
  const tag = (d: number) => addDays(world.date, d - world.day);
  const tun = (id: KriegHandlungId) => melde(fuehreKriegHandlungAus(world, k.id, id));

  // Befehle ordnen: das Kriegsziel als eine Reihe, dann bis zu vier Hauptschritte nach Vorrang, der Rest zugeklappt
  const ziele = handlungen.filter((h) => h.id.startsWith("ziel_"));
  const uebrig = handlungen.filter((h) => !h.id.startsWith("ziel_") && !h.id.startsWith("paket_"));
  const fern = istFernkonflikt(k.land);
  const vorrang = VORRANG[k.phase] ?? [];
  const haupt = [...uebrig].filter((h) => vorrang.includes(h.id)).sort((a, b) => vorrang.indexOf(a.id) - vorrang.indexOf(b.id)).slice(0, 4);
  const weitere = uebrig.filter((h) => !haupt.includes(h));
  const vorschau = vorKrieg ? kriegsVorschau(world, k) : null;

  // Versorgung in einer Zeile (die Akte „Versorgung“ führt sie, Befund G-5)
  const m = militaerVersorgung(world, k.land);
  const bilanz = gueterZustand(world).bilanz;

  return (
    <section className="kd" aria-label={t("krieg.d.aria", { land: l.name })}>
      <header className={`kd-kopf kd-phase-${k.phase}`}>
        <b>{t("nacht_n7.d.kopf", { land: l.name, phase: PHASEN_NAME[k.phase] })}</b>
        <span>
          {t("krieg.d.seit", { datum: datum(tag(k.seit)) })}
          {k.rahmung ? ` · ${t("krieg.d.rahmung", { name: RAHMUNG[k.rahmung].name })}` : ""}
        </span>
      </header>

      <ol className="kd-leiter" aria-label={t("nacht_n7.leiter.aria")}>
        {leiter.map((s) => (
          <li key={s.stufe} className={`kd-stufe ${s.stand}`}>
            <i aria-hidden />
            <span>{PHASEN_NAME[s.stufe]}</span>
            {s.ab !== undefined && s.ab > world.day && <small>{t("nacht_n7.leiter.ab", { datum: tag(s.ab) })}</small>}
          </li>
        ))}
      </ol>

      {streifen}

      {vorKrieg && <Leiter world={world} k={k} />}

      {!imKrieg && (
        <div className="kd-zeile" title={t("ui.welt.KriegDossier.c4f3a82")}>
          <span>{t("krieg.d.eskalation")}</span>
          <span className="kd-balken kd-eskalation" aria-hidden>
            <i style={{ width: `${k.eskalation}%` }} />
            <u style={{ left: `${KRIEG.angriffAb}%` }} title={t("nacht_n7.d.angriff_marke")} />
          </span>
          <b>{nf(k.eskalation)}</b>
        </div>
      )}
      <Verlauf world={world} k={k} onTab={onTab} />
      {mob.anteil < 1 && (
        <div className="kd-zeile">
          <span>{t(k.mobilmachung === 2 ? "krieg.k.x.voll" : "krieg.k.x.teil")}</span>
          <span className="kd-balken kd-mobil" aria-hidden>
            <i style={{ width: `${Math.round(mob.anteil * 100)}%` }} />
          </span>
          <b>{t("nacht_n7.d.mobil_fertig", { datum: tag(mob.fertig) })}</b>
        </div>
      )}

      {imKrieg && (
        <>
          <div className="kd-zeile" title={t("nacht_n7.d.front.titel", { woche: k.woche })}>
            <span>{fern ? t("welle_k1.fern.lage") : t("krieg.d.front")}</span>
            <span className="kd-balken kd-front" aria-hidden>
              <i style={{ width: `${k.front}%` }} />
              <u style={{ left: "50%" }} />
            </span>
            <b>
              {nf(k.front)} <em className={`kd-trend kd-trend-${trend}`}>{trend === "steigend" ? "↑" : trend === "fallend" ? "↓" : "→"} {t(`krieg.d.trend.${trend}`)}</em>
            </b>
          </div>
          <div className="kd-zeile" title={t("ui.welt.KriegDossier.fb1d897")}>
            <span>{t("ui.welt.KriegDossier.7c1b834")}</span>
            <span className={`kd-balken kd-rueckhalt${k.uhr < 40 ? " knapp" : ""}`} aria-hidden>
              <i style={{ width: `${Math.max(0, Math.min(100, k.uhr))}%` }} />
            </span>
            <b>{nf(Math.max(0, Math.min(100, k.uhr)))}</b>
          </div>
          <p className="subtitle kd-woche">
            {t("nacht_n7.d.woche", { woche: k.woche, mobil: t(k.mobilmachung === 2 ? "krieg.k.x.voll" : k.mobilmachung === 1 ? "krieg.k.x.teil" : "krieg.d.keine_mobil") })}
            {k.gefallene ? ` · ${t("krieg.d.gefallene", { zahl: zahl(k.gefallene, 0) })}` : ""}
          </p>
        </>
      )}

      {k.phase !== "frieden" && k.phase !== "beendet" && <Kriegsziel world={world} k={k} ziele={ziele} tun={tun} onTat={(text) => melde({ ok: true, text })} />}

      {k.phase === "waffenruhe" && <Pakete world={world} k={k} handlungen={handlungen} tun={tun} />}

      {haupt.length > 0 && (
        <ul className="we-aktionen kd-handlungen">
          {haupt.map((h) => <Handlung key={h.id} h={h} tun={tun} />)}
        </ul>
      )}
      {weitere.length > 0 && (
        <details className="kd-weitere">
          <summary>{t("nacht_n7.d.weitere", { n: weitere.length })}</summary>
          <ul className="we-aktionen kd-handlungen">
            {weitere.map((h) => <Handlung key={h.id} h={h} tun={tun} />)}
          </ul>
        </details>
      )}
      {handlungen.length === 0 && <p className="subtitle">{k.phase === "beschluss" && k.beschluss ? t("nacht_n7.d.warten", { datum: tag(k.beschluss.abstimmung) }) : t("ui.welt.KriegDossier.c605cdb")}</p>}

      {vorschau && (
        <div className="kd-preis">
          <h5>{t("nacht_n7.vorschau.titel")}</h5>
          {!vorschau.angreifer && <p className="subtitle">{t("nacht_n7.vorschau.verteidigung")}</p>}
          <div className="kd-preis-spalten">
            <div>
              <b>{t("nacht_n7.vorschau.daheim")}</b>
              <ul>{vorschau.daheim.map((z) => <li key={z}>{z}</li>)}</ul>
            </div>
            <div>
              <b>{t("nacht_n7.vorschau.ausland")}</b>
              <ul>{vorschau.ausland.map((z) => <li key={z}>{z}</li>)}</ul>
            </div>
          </div>
        </div>
      )}

      <Schauplatz world={world} k={k} onTat={(text) => melde({ ok: true, text })} />
      <Fernkonflikt world={world} k={k} onTat={(text) => melde({ ok: true, text })} />

      <details className="kd-lagebild">
        <summary>
          {t("krieg.d.lagebild", { stufe: t(`krieg.d.stufe.${bild.stufe}`) })}: {t("krieg.d.eigen")} <b>{nf(eigen)}</b> · {t("krieg.d.gegner")}{" "}
          <b>{bild.stufe === "bekannt" ? nf(gegner) : bild.stufe === "vermutet" ? `${nf(gegner - 10)}–${nf(gegner + 10)}` : t("krieg.d.unbekannt")}</b>
        </summary>
        <ul>
          {bild.stufe === "unsicher" && <li>{t("krieg.d.stufe.unsicher")}: {einordnung(eigen, gegner)}</li>}
          <li>
            {t("krieg.d.erschoepfung")} <em>{t(k.uhrGegner >= 70 ? "krieg.d.ersch.gering" : k.uhrGegner >= 40 ? "krieg.d.ersch.wachsend" : "krieg.d.ersch.hoch")} ({t("krieg.d.ersch.vermutet")})</em>
          </li>
        </ul>
        <p className="subtitle">{bild.text}</p>
        {dok.doktrin && (
          <p className={`kd-doktrin ${dok.konsistent ? "ok" : "warn"}`}>
            {t("krieg.d.doktrin", { name: dok.name ?? "" })} {dok.konsistent ? t("krieg.d.doktrin.ok") : t("krieg.d.doktrin.fehlt", { fehlt: dok.fehlt.join("; ") })}
          </p>
        )}
      </details>

      {imKrieg && (
        <details className="kd-versorgung">
          <summary>
            {t("nacht_n7.d.versorgung", {
              zivil: bilanz ? zahl(Math.round(zivileVersorgungsDeckung(bilanz) * 100), 0) : "—",
              treibstoff: zahl(Math.round(m.treibstoff * 100), 0),
              material: zahl(Math.round(m.material * 100), 0),
            })}
          </summary>
          <p className="kd-versorgung-sprung"><UbVerweis ziel={{ art: "versorgung" }}>{t("nacht_n7.d.zur_versorgung")}</UbVerweis></p>
          <VersorgungsLage world={world} geaendert={refresh} />
        </details>
      )}

      <Besatzung world={world} onTat={(text) => melde({ ok: true, text })} nurLand={landId} />

      {sperre > world.day && <p className="kd-demob">{t("krieg.d.demob", { datum: datum(tag(sperre)) })}</p>}
      {aktiveKriege(world).length >= KRIEG.maxAktiv && <p className="subtitle">{t("ui.welt.KriegDossier.66712ad")}</p>}
    </section>
  );
}

const zahlZeichen1 = (x: number): string => (x > 0 ? "+" : x < 0 ? "−" : "") + zahl(Math.abs(x), Number.isInteger(x) ? 0 : 1);

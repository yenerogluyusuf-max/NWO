// Der Kabinettstisch (Cumhurbaşkanlığı Kabinesi; Plan Oberfläche, Anhang A „Kabinett › Kabinettstisch“): alle 17 Ministerien,
// das Präsidialamt und der Generalstab als Gast um einen Tisch. Ring = Stimmung, Abzeichen = offene Vorlagen, Warnzeichen = Rücktrittsgefahr.
// Ein Klick öffnet rechts die Ministerakte: die Ministerkarte und nur die Vorlagen und Befehle dieser Person. Vorher standen 19 große
// Karten und 21 Vorlagen untereinander (20 Bildschirme; Rundgang 5. November).
//
// Alle Ministerkarten haben denselben Aufbau in derselben Reihenfolge, damit man sie nebeneinander lesen kann:
//   Kopf (Gesicht, Ressort, Name, Rolle) · Werte (Loyalität, Leistung, Ehrgeiz) · Kapital-Ertrag · Ressortsorge · Marken · Handlungen.
// Das Wort zur Loyalität ist dasselbe wie im Umfeld (haltung), damit eine Zahl nicht in zwei Ansichten zwei Namen hat.

import type { World } from "../../sim/types";
import { kabinettStatus, type MinisterPosten } from "../../sim/kabinett";
import type { VorlagenZiel } from "../../sim/ministerfluss-typen";
import { haltung } from "../../sim/figuren";
import { gespraechGrund } from "../../sim/gespraeche";
import { ehrgeizWort, eigenVon, grollWort, leistung, leistungWort, nf } from "../../sim/personen";
import type { Figur } from "../../sim/spiel-typen";
import { Icon } from "../icons";
import { MinisterPult } from "../minister/MinisterPult";
import { offeneAnliegen } from "../minister/Posteingang";
import { ministerVorlagen } from "../../sim/ministerfluss";
import { useState } from "react";
import "./kabinettstisch.css";
import { Portraet as Zeichnung } from "../art/Portraet";
import { Balken, Marke, Portraet } from "./bausteine";

import { t } from "../../i18n";
export type ZeilenTon = "gut" | "schlecht" | "neutral";

// Größen, bei denen „mehr“ schlecht ist: Aus „+10 Groll“ wird eine Verschlechterung, aus „Groll sinkt“ eine Verbesserung.
const SCHLECHT_WENN_MEHR = /(groll|defizit|schulden|inflation|risiko|arbeitslos|kriminal|spannung|unruhe|verlust|belast)/i;

/**
 * Ob eine Wirkungszeile einer Beschlussoption gut oder schlecht für den Präsidenten ist. Die Zeilen sind Freitext („Finanzen: +12 Loyalität, Groll sinkt“);
 * das Vorzeichen allein sagt nichts, es kommt auf die Größe an. Zeilen ohne erkennbare Richtung bleiben neutral.
 */
export function tonDerZeile(text: string): ZeilenTon {
  let gut = 0;
  let schlecht = 0;
  for (const teil of text.split(/[;,]|\s&\s/)) {
    const minus = /(^|[\s(:])[-−–]\s?\d/.test(teil) || /\b(sinkt|sinken|fällt|fallen|schwindet|verringert)\b/i.test(teil);
    const plus = /(^|[\s(:])\+\s?\d/.test(teil) || /\b(steigt|steigen|sammelt|wächst|wachsen|erhöht|nimmt zu)\b/i.test(teil);
    if (minus === plus) continue;
    const mehrIstSchlecht = SCHLECHT_WENN_MEHR.test(teil);
    const besser = plus ? !mehrIstSchlecht : mehrIstSchlecht;
    if (besser) gut++;
    else schlecht++;
  }
  return gut > schlecht ? "gut" : schlecht > gut ? "schlecht" : "neutral";
}

/** Der Leitminister eines Themas ist der des zuerst genannten Ressorts („Finanzen & Wirtschaft“ gehört zuerst dem Finanzminister). */
export function leitministerVon(ressort: string, minister: MinisterPosten[]): MinisterPosten | undefined {
  const erst = (ressort.split(/\s*(?:&|\bund\b)\s*/i)[0] ?? "").trim().toLowerCase();
  if (!erst) return undefined;
  return minister.find((m) => m.ressort.toLowerCase() === erst) ?? minister.find((m) => m.ressort.toLowerCase().startsWith(erst) || erst.startsWith(m.ressort.toLowerCase()));
}

/** Eine Zahl mit Vorzeichen und Einheit; die Einheit hängt an der Zahl und bricht nie um. */
const mitVorzeichen = (x: number) => (x > 0 ? `+${nf(x, 1)}` : nf(x, 1));

export function Ministerkarte({ world, m, figur, onWaehlePerson }: { world: World; m: MinisterPosten; figur: Figur | undefined; onWaehlePerson: (id: string, modus?: "gespraech" | "entlassen") => void }) {
  const e = figur ? eigenVon(world, figur) : undefined;
  const q = figur ? leistung(world, figur) : undefined;
  const grund = figur ? gespraechGrund(world, figur.id) : undefined;
  const wort = figur ? haltung(figur) : m.stimmung;
  const ruecktritt = m.loyalitaet < 25;
  const kapitalTon = m.kapitalBeitrag > 1.2 ? "gut" : m.kapitalBeitrag <= 0 ? "warn" : "";
  return (
    <article className={`mr-karte stimmung-${m.stimmung}${ruecktritt ? " gefahr" : ""}`} aria-label={`${m.ressort}: ${m.name}`}>
      <header className="mr-k-kopf">
        {figur && <Portraet w={world} f={figur} size={132} />}
        <div className="mr-titel-block">
          <span className="mr-ressort-name">{m.ressort}</span>
          <strong className="mr-person-name">{m.name}</strong>
          <span className="mr-person-rolle">{m.rolle}</span>
        </div>
      </header>

      <div className="mr-k-werte">
        <Balken label={t("ui.personen.MinisterratSaal.87f6f23")} wert={m.loyalitaet} wort={`${Math.round(m.loyalitaet)} · ${wort}`} hinweis={t("ui2.ui.personen.MinisterratSaal.5abc3cc", { p0: Math.round(m.loyalitaet) })} />
        {q !== undefined && <Balken label={t("ui2.ui.personen.MinisterratSaal.98cd370")} wert={Math.min(100, q * 100)} wort={`${Math.round(q * 100)} · ${leistungWort(q)}`} hinweis={t("ui2.ui.personen.MinisterratSaal.9c9352b")} />}
        <Balken label={t("ui2.ui.personen.MinisterratSaal.3cdcb44")} wert={m.ehrgeiz} ton={m.ehrgeiz >= 75 ? "schlecht" : "gut"} wort={ehrgeizWort(m.ehrgeiz)} {...(m.ehrgeiz >= 75 ? { zeile: t("ui2.ui.personen.MinisterratSaal.8ef008c") } : {})} />
      </div>

      <div className="mr-k-kapital">
        <div className="mr-kapital-feld">
          <span className="mr-kapital-label">{t("ui.personen.MinisterratSaal.840a839")}</span>
          <span className={`mr-kapital-wert ${kapitalTon}`}>{mitVorzeichen(m.kapitalBeitrag)} Kapital/Monat</span>
        </div>
        <small className="mr-kapital-grund">{m.kapitalGrund}</small>
      </div>

      <div className="mr-sorge-box">
        <span className="mr-sorge-label">{t("ui2.ui.personen.MinisterratSaal.945b79c")}</span>
        <span className="mr-sorge-wert">{m.sorge}</span>
      </div>

      <div className="mr-k-marken">
        <Marke art="gold">{m.lagerName}</Marke>
        {m.kommissarisch && <Marke art="rot">{t("ui2.ui.personen.MinisterratSaal.5d54a5d")}</Marke>}
        {ruecktritt && <Marke art="rot">{t("ui.personen.MinisterratSaal.434c793")}</Marke>}
        {e && e.groll >= 40 && <Marke art="rot">{grollWort(e.groll)}</Marke>}
        {m.auftragStatus === "laeuft" && <Marke art="gruen">{t("ui.personen.MinisterratSaal.357a028")}</Marke>}
      </div>

      <footer className="mr-k-aktionen">
        {grund && <p className="mr-k-grund">{grund}</p>}
        <div className="mr-k-knoepfe">
          <button className="pe-aktion" disabled={!!grund} onClick={() => onWaehlePerson(m.id, "gespraech")} title={grund ?? t("ui2.ui.personen.MinisterratSaal.9b543c3")}>
            <Icon name="sprechblase" size={16} />
            {t("ui2.ui.personen.MinisterratSaal.3cd76eb")}
          </button>
          <button className="pe-aktion leise" onClick={() => onWaehlePerson(m.id, "entlassen")} title={t("ui.personen.MinisterratSaal.a8bd79c")}>
            <Icon name="tausch" size={16} />
            {t("ui2.ui.personen.MinisterratSaal.8f17473")}
          </button>
        </div>
      </footer>
    </article>
  );
}

export function MinisterratSaal({
  world,
  refresh,
  onWaehlePerson,
  onGeheVorlage,
  onKarte,
}: {
  world: World;
  refresh: () => void;
  onWaehlePerson: (id: string, modus?: "gespraech" | "entlassen") => void;
  /** Verweise aus den Vorlagen (Akte, Land, Karte); ohne sie bleiben die Verweisknöpfe weg */
  onGeheVorlage?: (z: VorlagenZiel) => void;
  onKarte?: (problemId?: string) => void;
}) {
  const status = kabinettStatus(world);
  const [gewaehlt, setGewaehlt] = useState<string | null>(null);
  const figuren = world.spiel?.figuren ?? [];
  // Offene Vorlagen und Anliegen je Amt (Abzeichen am Platz)
  const vorlagen = world.spiel ? ministerVorlagen(world, { tiefe: 0 }) : [];
  const anliegen = world.spiel ? offeneAnliegen(world) : [];
  const offen = (amt: string) => vorlagen.filter((v) => v.amt === amt).length + anliegen.filter((a) => a.amt === amt).length;
  // Sitzordnung: Präsidialamt am Kopf, die Ministerien im Uhrzeigersinn, der Generalstab als Gast unten
  const sitze = status.minister;
  const n = sitze.length;
  const platz = (i: number) => {
    const winkel = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return { left: `${50 + 46 * Math.cos(winkel)}%`, top: `${50 + 44 * Math.sin(winkel)}%` };
  };
  const m = sitze.find((x) => x.id === gewaehlt);
  const fm = m ? figuren.find((f) => f.id === m.id) : undefined;

  return (
    <div className="mr-saal kt">
      <div className="kt-kopf">
        <span className={`mr-disziplin-badge ${status.disziplin}`}>{status.disziplin.toUpperCase()}</span>
        <span>{t("kt.kapital", { n: mitVorzeichen(status.kapitalSumme) })}</span>
        <span>{t("kt.loyalitaet", { n: Math.round(status.schnittLoyalitaet) })}</span>
        <span>{status.sitzungMoeglich ? t("ui2.ui.personen.MinisterratSaal.25b5b98") : t("ui2.ui.personen.MinisterratSaal.94acca5", { p0: status.tageBisSitzung })}</span>
        {status.ruecktrittGefahr.length > 0 && <span className="kt-warn">{t("kt.ruecktritt", { namen: status.ruecktrittGefahr.map((x) => x.name).join(", ") })}</span>}
      </div>
      <div className="kt-buehne">
        <div className="kt-raum" role="group" aria-label={t("kt.tischAria")}>
          <div className="kt-tisch" aria-hidden="true">
            <span className="kt-tisch-titel">{t("kt.titel")}</span>
            <span className="kt-tisch-text">{status.disziplinText}</span>
          </div>
          {sitze.map((x, i) => {
            const f = figuren.find((y) => y.id === x.id);
            const k = offen(x.amt);
            return (
              <button
                key={x.id}
                type="button"
                className={`kt-platz kt-st-${x.stimmung}${gewaehlt === x.id ? " on" : ""}${x.amt === "generalstab" ? " gast" : ""}${x.kommissarisch ? " kommissarisch" : ""}`}
                style={platz(i)}
                onClick={() => setGewaehlt(gewaehlt === x.id ? null : x.id)}
                title={`${x.rolle} ${x.name} · ${x.sorge}`}
                aria-pressed={gewaehlt === x.id}
              >
                <span className="kt-gesicht">{f && <Zeichnung seed={f.name} size={46} geschlecht={f.weiblich ? "f" : "m"} rolle={x.amt} rahmen="keiner" />}</span>
                <span className="kt-name">{x.name}</span>
                <span className="kt-ressort">{x.ressort}</span>
                {k > 0 && <i className="kt-abzeichen">{k}</i>}
                {x.loyalitaet < 25 && <i className="kt-blitz" title={t("ui.personen.MinisterratSaal.434c793")}>!</i>}
              </button>
            );
          })}
        </div>
        <aside className="kt-akte" aria-live="polite">
          {m ? (
            <>
              <Ministerkarte world={world} m={m} figur={fm} onWaehlePerson={onWaehlePerson} />
              <MinisterPult world={world} refresh={refresh} nur={{ id: m.id, amt: m.amt }} {...(onGeheVorlage ? { onGehe: onGeheVorlage } : {})} {...(onKarte ? { onKarte } : {})} />
            </>
          ) : (
            <p className="kt-leer">{t("kt.waehlen", { n: vorlagen.length + anliegen.length })}</p>
          )}
        </aside>
      </div>
    </div>
  );
}

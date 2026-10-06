// Der Ministerratssaal (Bakanlar Kurulu): Visueller Kabinettssaal nach Democracy 4- und Suzerain-Vorbild.
// Zeigt die 7 Regierungsminister am Konferenztisch, ihren Beitrag zum Politischen Kapital,
// ihre Loyalität, Lagerbindung und Sorgen, und ermöglicht gemeinsame Kabinettssitzungen.
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

function Ministerkarte({ world, m, figur, onWaehlePerson }: { world: World; m: MinisterPosten; figur: Figur | undefined; onWaehlePerson: (id: string, modus?: "gespraech" | "entlassen") => void }) {
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
        <Balken label={t("ui.personen.MinisterratSaal.87f6f23")} wert={m.loyalitaet} wort={`${Math.round(m.loyalitaet)} · ${wort}`} hinweis={`Loyalität ${Math.round(m.loyalitaet)} von 100`} />
        {q !== undefined && <Balken label="Leistung im Ressort" wert={Math.min(100, q * 100)} wort={`${Math.round(q * 100)} · ${leistungWort(q)}`} hinweis="Aus Fähigkeit und Loyalität; Einarbeitung senkt, Zusatzmittel erhöhen" />}
        <Balken label="Ehrgeiz" wert={m.ehrgeiz} ton={m.ehrgeiz >= 75 ? "schlecht" : "gut"} wort={ehrgeizWort(m.ehrgeiz)} {...(m.ehrgeiz >= 75 ? { zeile: "Gefährlich, wenn er übergangen wird." } : {})} />
      </div>

      <div className="mr-k-kapital">
        <div className="mr-kapital-feld">
          <span className="mr-kapital-label">{t("ui.personen.MinisterratSaal.840a839")}</span>
          <span className={`mr-kapital-wert ${kapitalTon}`}>{mitVorzeichen(m.kapitalBeitrag)} PK/Mt.</span>
        </div>
        <small className="mr-kapital-grund">{m.kapitalGrund}</small>
      </div>

      <div className="mr-sorge-box">
        <span className="mr-sorge-label">Ressortsorge</span>
        <span className="mr-sorge-wert">{m.sorge}</span>
      </div>

      <div className="mr-k-marken">
        <Marke art="gold">{m.lagerName}</Marke>
        {m.kommissarisch && <Marke art="rot">kommissarisch</Marke>}
        {ruecktritt && <Marke art="rot">{t("ui.personen.MinisterratSaal.434c793")}</Marke>}
        {e && e.groll >= 40 && <Marke art="rot">{grollWort(e.groll)}</Marke>}
        {m.auftragStatus === "laeuft" && <Marke art="gruen">{t("ui.personen.MinisterratSaal.357a028")}</Marke>}
      </div>

      <footer className="mr-k-aktionen">
        {grund && <p className="mr-k-grund">{grund}</p>}
        <div className="mr-k-knoepfe">
          <button className="pe-aktion" disabled={!!grund} onClick={() => onWaehlePerson(m.id, "gespraech")} title={grund ?? "Vertrauliches Gespräch unter vier Augen führen"}>
            <Icon name="sprechblase" size={16} />
            Gespräch
          </button>
          <button className="pe-aktion leise" onClick={() => onWaehlePerson(m.id, "entlassen")} title={t("ui.personen.MinisterratSaal.a8bd79c")}>
            <Icon name="tausch" size={16} />
            Umbilden
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

  return (
    <div className="mr-saal">
      {/* Kopfband: Kabinettsdisziplin und Kapital-Generierung */}
      <div className="mr-kopfband">
        <div className="mr-status-info">
          <div className="mr-titel-zeile">
            <h3>Der Ministerrat (Bakanlar Kurulu)</h3>
            <span className={`mr-disziplin-badge ${status.disziplin}`}>{status.disziplin.toUpperCase()}</span>
          </div>
          <p className="mr-disziplin-text">{status.disziplinText}</p>
        </div>

        <div className="mr-kennzahlen">
          <div className="mr-kpi">
            <span className="mr-kpi-label">{t("ui.personen.MinisterratSaal.840a839")}</span>
            <strong className={`mr-kpi-wert ${status.kapitalSumme >= 6 ? "gut" : status.kapitalSumme < 2 ? "warn" : ""}`}>{mitVorzeichen(status.kapitalSumme)} PK</strong>
            <small>{t("ui.personen.MinisterratSaal.0207ed0")}</small>
          </div>

          <div className="mr-kpi">
            <span className="mr-kpi-label">{t("ui.personen.MinisterratSaal.99fc71c")}</span>
            <strong className="mr-kpi-wert">{status.schnittLoyalitaet} %</strong>
            <small>über {status.minister.length} Ressorts</small>
          </div>

          <div className="mr-kpi">
            <span className="mr-kpi-label">Kabinettssitzung</span>
            <strong className="mr-kpi-wert">{status.sitzungMoeglich ? "beschlussfähig" : `in ${status.tageBisSitzung} Tagen`}</strong>
            <small>{status.sitzungMoeglich ? "Beschlussvorlagen liegen unten vor" : "Regulärer Zyklus"}</small>
          </div>
        </div>
      </div>

      {/* Vorlagen der Minister (auch die Beschlussvorlagen der Kabinettssitzung) und Befehle an die Minister */}
      <section className="mr-pult" aria-label={t("ui.personen.MinisterratSaal.7efc7da")}>
        <MinisterPult world={world} refresh={refresh} {...(onGeheVorlage ? { onGehe: onGeheVorlage } : {})} {...(onKarte ? { onKarte } : {})} />
      </section>

      {/* Der Ministerratstisch: die Karten haben alle denselben Aufbau, die Reihen sind gleich hoch */}
      <div className="mr-tisch-gitter">
        {status.minister.map((m) => (
          <Ministerkarte key={m.id} world={world} m={m} figur={(world.spiel?.figuren ?? []).find((f) => f.id === m.id)} onWaehlePerson={onWaehlePerson} />
        ))}
      </div>
    </div>
  );
}

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
import { AEMTER, HOCH_SCHLECHT, ehrgeizWort, eigenVon, grollWort, leistung, leistungWort, nf, ressortWirkungSicht } from "../../sim/personen";
import { termineInfo } from "../../sim/gespraeche";
import type { Figur } from "../../sim/spiel-typen";
import { Icon } from "../icons";
import { MinisterPult } from "../minister/MinisterPult";
import { offeneAnliegen } from "../minister/Posteingang";
import { ministerVorlagen } from "../../sim/ministerfluss";
import { useState } from "react";
import "./kabinettstisch.css";
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
export const mitVorzeichen = (x: number) => (x > 0 ? `+${nf(x, 1)}` : x < 0 ? `−${nf(-x, 1)}` : nf(0, 1));

/** Leistung nur dort als Ressortleistung, wo das Ressort im Land wirkt (Befund C-4). Der Hinweis entsteht aus denselben Zahlen, die der Monat bucht. */
function leistungsZeile(world: World, figur: Figur, q: number): { label: string; zeile: string } | null {
  const d = AEMTER[figur.amt];
  const wirkung = ressortWirkungSicht(world, figur).filter((x) => Math.abs(x.punkte) >= 0.05);
  if (d.wirkung.length) {
    // ressortWirkungSicht zählt „besser für das Land“ positiv; angezeigt wird die Richtung der Größe selbst (Kriminalität −0,2 ist gut)
    const liste = wirkung
      .map((x) => {
        const d = HOCH_SCHLECHT.has(x.id) ? -x.punkte : x.punkte;
        return `${x.name} ${d > 0 ? "+" : "−"}${nf(Math.abs(d), 1)}`;
      })
      .join(" · ");
    return { label: t("ui2.ui.personen.MinisterratSaal.98cd370"), zeile: liste ? t("n1.leistung.wirkt", { liste }) : t("n1.leistung.neutral") };
  }
  const auftrag = eigenVon(world, figur).auftrag?.status === "laeuft";
  if (d.ohneKapital) return auftrag ? { label: t("n1.leistung.label"), zeile: t("n1.leistung.nurAuftrag") } : null;
  void q;
  return { label: t("n1.leistung.label"), zeile: t("n1.leistung.nurKapital") };
}

export function Ministerkarte({ world, m, figur, onWaehlePerson }: { world: World; m: MinisterPosten; figur: Figur | undefined; onWaehlePerson: (id: string, modus?: "gespraech" | "entlassen") => void }) {
  const e = figur ? eigenVon(world, figur) : undefined;
  const q = figur ? leistung(world, figur) : undefined;
  const grund = figur ? gespraechGrund(world, figur.id) : undefined;
  const wort = figur ? haltung(figur) : m.stimmung;
  const ruecktritt = m.loyalitaet < 25;
  const kapitalTon = m.kapitalBeitrag > 1.2 ? "gut" : m.kapitalBeitrag <= 0 ? "warn" : "";
  const lz = figur && q !== undefined ? leistungsZeile(world, figur, q) : null;
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
        {q !== undefined && lz && <Balken label={lz.label} wert={Math.min(100, q * 100)} wort={`${Math.round(q * 100)} · ${leistungWort(q)}`} hinweis={t("ui2.ui.personen.MinisterratSaal.9c9352b")} zeile={lz.zeile} zeileLeise />}
        <Balken label={t("ui2.ui.personen.MinisterratSaal.3cdcb44")} wert={m.ehrgeiz} ton={m.ehrgeiz >= 75 ? "schlecht" : "gut"} wort={ehrgeizWort(m.ehrgeiz)} {...(m.ehrgeiz >= 75 ? { zeile: t("n1.person.gefaehrlich", { g: m.weiblich ? "f" : "m" }) } : {})} />
      </div>

      <div className="mr-k-kapital">
        <div className="mr-kapital-feld">
          <span className="mr-kapital-label">{t("ui.personen.MinisterratSaal.840a839")}</span>
          <span className={`mr-kapital-wert ${kapitalTon}`}>{t("n1.kapitalMonat", { n: mitVorzeichen(m.kapitalBeitrag) })}</span>
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
            {t("n1.karte.entlassen")}
          </button>
        </div>
      </footer>
    </article>
  );
}

/** Wer neben dem Präsidialamt sitzt: die vier klassischen Ressorts zuerst, dann die amtliche Reihenfolge (data/ministerien.ts). */
const NAH_AM_KOPF: string[] = ["finanzen", "inneres", "aussen", "justiz"];

/** Reihenfolge der Plätze: Präsidialamt (Kopf), dann abwechselnd rechts und links nach Nähe zum Kopf, der Generalstab zuletzt (Fuß). */
export function sitzordnung(minister: MinisterPosten[]): MinisterPosten[] {
  const kopf = minister.filter((m) => m.amt === "stab");
  const fuss = minister.filter((m) => m.amt === "generalstab");
  const rest = minister.filter((m) => m.amt !== "stab" && m.amt !== "generalstab");
  const rang = (m: MinisterPosten) => (NAH_AM_KOPF.includes(m.amt) ? NAH_AM_KOPF.indexOf(m.amt) : 10 + rest.indexOf(m));
  return [...kopf, ...[...rest].sort((a, b) => rang(a) - rang(b)), ...fuss];
}

/** Halbachsen der Sitzellipse in Prozent des Raums und das Seitenverhältnis des Raums (Breite zu Höhe, bei 1440 × 900 etwa 1,55). */
const RX = 45;
const RY = 40;
const SEITEN = 2.3;

/** Punkte auf einer Hälfte der Sitzellipse in gleichen Bogenabständen (nicht gleichen Winkeln: sonst drängen sich die Plätze an den Seiten). */
function halbbogen(anzahl: number, rechts: boolean): { x: number; y: number }[] {
  const N = 240;
  const pkt = Array.from({ length: N + 1 }, (_, j) => {
    const w = -Math.PI / 2 + ((rechts ? 1 : -1) * Math.PI * j) / N;
    return { x: 50 + RX * Math.cos(w), y: 50 + RY * Math.sin(w) };
  });
  const laenge = [0];
  for (let j = 1; j <= N; j++) laenge.push(laenge[j - 1]! + Math.hypot((pkt[j]!.x - pkt[j - 1]!.x) * SEITEN, pkt[j]!.y - pkt[j - 1]!.y));
  const gesamt = laenge[N]!;
  return Array.from({ length: anzahl }, (_, k) => {
    const ziel = (gesamt * (k + 1)) / (anzahl + 1);
    const j = laenge.findIndex((l) => l >= ziel);
    return pkt[Math.max(0, j)]!;
  });
}

/** Lage des i-ten Platzes: 0 oben, die Nummern 1, 3, 5 … rechts, 2, 4, 6 … links, der letzte Platz (Generalstab) unten. */
function lage(i: number, n: number): { x: number; y: number } {
  if (i === 0) return { x: 50, y: 50 - RY };
  if (i === n - 1) return { x: 50, y: 50 + RY };
  const rechts = Math.ceil((n - 2) / 2);
  const links = n - 2 - rechts;
  const k = Math.ceil(i / 2) - 1;
  return i % 2 === 1 ? halbbogen(rechts, true)[k]! : halbbogen(links, false)[k]!;
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
  // Sitzordnung (Befund C-9): Präsidialamt am Kopf, daneben Finanzen, Inneres, Äußeres und Justiz; die übrigen Ministerien abwechselnd rechts
  // und links in der amtlichen Reihenfolge; der Generalstab als Gast am Fuß. Rechts sitzen neun, links acht.
  const sitze = sitzordnung(status.minister);
  const platz = (i: number) => {
    const p = lage(i, sitze.length);
    return { left: `${p.x}%`, top: `${p.y}%` };
  };
  // An den Seiten steht der Name neben dem Gesicht, zur Tischmitte hin: Dort ist Breite frei, Höhe nicht
  const seite = (i: number) => {
    const p = lage(i, sitze.length);
    return p.x > 91 ? " seite rechts" : p.x < 9 ? " seite links" : "";
  };
  const termine = termineInfo(world);
  const m = sitze.find((x) => x.id === gewaehlt);
  const fm = m ? figuren.find((f) => f.id === m.id) : undefined;

  return (
    <div className="mr-saal kt">
      <div className="kt-buehne">
        <div className="kt-raum" role="group" aria-label={t("kt.tischAria")}>
          {/* Befund C-10: Die Kennzahlzeilen über dem Tisch sind in die Tischmitte gezogen; Loyalität und Kapital stehen nur noch im Kopf der Akte */}
          <div className={`kt-tisch ${status.disziplin}`}>
            <span className="kt-tisch-titel">{t("kt.titel")}</span>
            <span className={`kt-disziplin ${status.disziplin}`}>{t(`n1.disziplin.wort.${status.disziplin}`)}</span>
            <span className="kt-tisch-text">{status.disziplinText}</span>
            <span className="kt-tisch-zeilen">
              <span>{status.sitzungMoeglich ? t("n1.tisch.sitzung.moeglich") : t("n1.tisch.sitzung.in", { n: status.tageBisSitzung })}</span>
              <span>{t("n1.tisch.termine", { frei: Math.max(0, termine.max - termine.belegt), max: termine.max })}</span>
              {status.ruecktrittGefahr.length > 0 && <span className="kt-warn">{t("n1.tisch.ruecktritt", { namen: status.ruecktrittGefahr.map((x) => x.name) })}</span>}
            </span>
          </div>
          {sitze.map((x, i) => {
            const f = figuren.find((y) => y.id === x.id);
            const k = offen(x.amt);
            return (
              <button
                key={x.id}
                type="button"
                className={`kt-platz kt-st-${x.stimmung}${seite(i)}${gewaehlt === x.id ? " on" : ""}${x.amt === "generalstab" ? " gast" : ""}${x.kommissarisch ? " kommissarisch" : ""}`}
                style={platz(i)}
                onClick={() => setGewaehlt(gewaehlt === x.id ? null : x.id)}
                title={`${x.ressort} · ${x.rolle} ${x.name} · ${x.sorge}`}
                aria-pressed={gewaehlt === x.id}
              >
                <span className="kt-gesicht">
                  {f && <Portraet w={world} f={f} size={44} rahmen="keiner" />}
                  {k > 0 && <i className="kt-abzeichen" title={t("n1.tisch.vorlagen", { n: k })}>{k}</i>}
                  {x.loyalitaet < 25 && <i className="kt-blitz" title={t("ui.personen.MinisterratSaal.434c793")}>!</i>}
                </span>
                <span className="kt-text">
                  {/* Am Tisch der Nachname (eindeutig, figuren.ts), der ganze Name steht im Titel und in der Akte */}
                  <span className="kt-name">{x.name.split(" ").at(-1)}</span>
                  <span className="kt-ressort">{t(`n1.amt.kurz.${x.amt}`)}</span>
                </span>
              </button>
            );
          })}
        </div>
        {/* Der Tisch nimmt die ganze Breite (19 Plätze brauchen sie); die Ministerakte legt sich bei einer Wahl als Blatt über die rechte Seite */}
        {!m && (
          <>
            <p className="kt-hinweis">{t("kt.waehlen", { n: vorlagen.length + anliegen.length })}</p>
            <p className="kt-legende">
              <span><i className="kt-ring treu" /> {t("n1.tisch.legende.loyal")}</span>
              <span><i className="kt-ring skeptisch" /> {t("n1.tisch.legende.skeptisch")}</span>
              <span><i className="kt-ring kritisch" /> {t("n1.tisch.legende.kritisch")}</span>
              <span><i className="kt-abzeichen-muster">2</i> {t("n1.tisch.legende.vorlagen")}</span>
            </p>
          </>
        )}
        {m && (
          <aside className="kt-akte" aria-live="polite" aria-label={`${m.ressort}: ${m.name}`}>
            <button type="button" className="kt-zu" onClick={() => setGewaehlt(null)} aria-label={t("n1.tisch.schliessen")} title={t("n1.tisch.schliessen")}>
              ×
            </button>
            <Ministerkarte world={world} m={m} figur={fm} onWaehlePerson={onWaehlePerson} />
            <MinisterPult world={world} refresh={refresh} nur={{ id: m.id, amt: m.amt }} {...(onGeheVorlage ? { onGehe: onGeheVorlage } : {})} {...(onKarte ? { onKarte } : {})} />
          </aside>
        )}
      </div>
    </div>
  );
}

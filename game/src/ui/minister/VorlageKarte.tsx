// Eine Vorlage als Karte: Wer legt vor (Gesicht, Name, Ressort), worum geht es, wie schlimm und wo, was der Minister empfiehlt und warum,
// und zwei bis vier Optionen mit Kosten, Folgen in Zahlen, Dafür und Dagegen. Dieselbe Karte erscheint am Schreibtisch (kompakt),
// im Ministerrat (Posteingang) und in „Heute“. Entschieden wird über `onEntscheide`; hier liegt keine Spiellogik.

import { useState } from "react";
import { Portraet as Zeichnung } from "../art/Portraet";
import { Icon } from "../icons";
import type { NutzenZeile, Vorlage, VorlageOption, VorlagenQuelle, VorlagenZiel } from "../../sim/ministerfluss-typen";
import { AEMTER } from "../../sim/personen";
import "../politik/design.css";
import "./ministerfluss.css";

import { t } from "../../i18n";
const QUELLE_SCHLUESSEL: Record<VorlagenQuelle, string> = {
  ereignis: "ereignis",
  kabinett: "kabinett",
  lage: "lage",
  problem: "problem",
  zusage: "zusage",
  person: "person",
  befehl: "rueckmeldung",
  auftrag: "rueckmeldung",
};
/** Name der Quelle einer Vorlage in der aktuellen Sprache */
export const quelleName = (q: VorlagenQuelle): string => t(`mf.quelle.${QUELLE_SCHLUESSEL[q]}`);

const TINT: Record<string, string> = { stab: "#7c5823", finanzen: "#265a62", inneres: "#4a3f6b", aussen: "#2f5a8a", justiz: "#6b4a3a", generalstab: "#4c5a3a", wirtschaft: "#265a62" };

const nf = (x: number): string => t("mf.zahl1", { x });
const zahl = (n: NutzenZeile, x: number): string => (n.einheit === "Provinzen" ? String(Math.round(x)) : nf(x));
const istMeta = (o: VorlageOption): boolean => o.id === "spaeter" || o.id === "nichts" || o.id === "kenntnis";

/** Beschriftung des Knopfes einer Option, nach dem, was er auslöst. */
export function knopfText(o: VorlageOption): string {
  switch (o.aktion.art) {
    case "ereignis":
      return t("mf.knopf.beschliessen");
    case "kabinett":
      return t("mf.knopf.durchsetzen");
    case "massnahme":
      return t("mf.knopf.gesetz");
    case "zusage":
      return t(o.aktion.weg === "einloesen" ? "mf.knopf.einloesen" : o.aktion.weg === "vertroesten" ? "mf.knopf.vertroesten" : "mf.knopf.brechen");
    case "gespraech":
      return t("mf.knopf.gespraech");
    case "befehl":
      return t("mf.knopf.anordnen");
    case "kenntnis":
      return t("mf.knopf.kenntnis");
    default:
      return o.label;
  }
}

function Gesicht({ v, size = 84 }: { v: Vorlage; size?: number }) {
  if (!v.minister) return <span className="sk-icon" aria-hidden><Icon name="akte" size={22} /></span>;
  return <Zeichnung seed={v.minister.name} size={size} geschlecht={v.minister.weiblich ? "f" : "m"} tint={TINT[v.amt] ?? "#7c5823"} rolle={v.amt} rahmen={size < 40 ? "keiner" : "messing"} />;
}

function Kosten({ o }: { o: VorlageOption }) {
  return (
    <div className="mf-kosten">
      <span>{o.kosten.pk > 0 ? t("mf.kosten.kapital", { pk: o.kosten.pk }) : t("mf.kosten.frei")}</span>
      {o.kosten.aufmerksamkeit > 0 && <span className="leise">{t("mf.kosten.aufmerksamkeit", { n: o.kosten.aufmerksamkeit })}</span>}
    </div>
  );
}

function Nutzen({ zeilen }: { zeilen: NutzenZeile[] }) {
  if (!zeilen.length) return null;
  const monate = zeilen[0]!.monate;
  const kaum = zeilen.every((n) => n.besser === null);
  return (
    <>
      <table className="mf-nutzen">
        <caption>{t("mf.nutzen.titel", { monate })}</caption>
        <thead>
          <tr>
            <th>{t("ui.minister.VorlageKarte.d9130ae")}</th>
            <th>{t("mf.nutzen.heute")}</th>
            <th>{t("mf.nutzen.ohne")}</th>
            <th>{t("ui.minister.VorlageKarte.5977a55")}</th>
          </tr>
        </thead>
        <tbody>
          {zeilen.map((n) => (
            <tr key={n.id}>
              <td>{n.name}{n.einheit === "Provinzen" ? t("mf.nutzen.provinzen") : ""}</td>
              <td>{zahl(n, n.jetzt)}</td>
              <td>{zahl(n, n.ohne)}</td>
              <td className={n.besser === true ? "besser" : n.besser === false ? "schlechter" : ""}>{zahl(n, n.mit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mf-nutzen-fuss">{kaum ? t("mf.nutzen.kaum", { monate }) : ""}{t("mf.nutzen.fuss")}</p>
    </>
  );
}

function Option({ v, o, empfohlen, band, onWaehle }: { v: Vorlage; o: VorlageOption; empfohlen: boolean; band: boolean; onWaehle: (o: VorlageOption) => void }) {
  return (
    <section className={`mf-option${empfohlen ? " empfohlen" : ""}`}>
      {empfohlen && band && v.empfehlung && <span className="mf-band">{v.minister ? t("mf.empfehlungVon", { name: v.minister.name }) : t("mf.empfehlung")}</span>}
      <h5>{o.label}</h5>
      {o.text && <p className="mf-text">{o.text}</p>}
      <Kosten o={o} />
      {o.folgen.length > 0 && (
        <ul className="mf-folgen">
          {o.folgen.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      )}
      {o.nutzen && <Nutzen zeilen={o.nutzen} />}
      {(o.dafuer.length > 0 || o.dagegen.length > 0) && (
        <p className="mf-lager">
          {o.dafuer.length > 0 && (
            <span className="dafuer">
              <b>{t("ui.minister.VorlageKarte.b267e3a")}</b>
              {o.dafuer.join(", ")}.{" "}
            </span>
          )}
          {o.dagegen.length > 0 && (
            <span className="dagegen">
              <b>{t("mf.dagegen")}</b>
              {o.dagegen.join(", ")}.
            </span>
          )}
        </p>
      )}
      <button className={`pd-btn${empfohlen ? " primary" : ""}`} disabled={!o.moeglich} title={o.grund} onClick={() => onWaehle(o)}>
        {knopfText(o)}
      </button>
      {!o.moeglich && o.grund && <p className="mf-grund">{o.grund}</p>}
    </section>
  );
}

function Frist({ v }: { v: Vorlage }) {
  if (v.frist === undefined) return null;
  const f = v.frist;
  return <span className={`mf-marke${f <= 7 ? " rot" : ""}`}>{t("mf.frist", { wann: t("sk.tage", { n: Math.max(0, f) }) })}</span>;
}

export interface VorlageKarteProps {
  v: Vorlage;
  /** Kompakt: Titel, Anlass, Empfehlung und Schnellknöpfe; die Optionen klappen auf */
  kompakt?: boolean;
  nummer?: number;
  onEntscheide: (v: Vorlage, optionId: string) => void;
  onGehe?: (z: VorlagenZiel) => void;
  /** Springt auf die Karte zum Problem */
  onKarte?: (problemId?: string) => void;
  /** „Einstellen und ansehen“ für Vorhaben aus dem Problemlöser */
  onEinstellen?: (v: Vorlage) => void;
}

export function VorlageKarte({ v, kompakt, nummer, onEntscheide, onGehe, onKarte, onEinstellen }: VorlageKarteProps) {
  const [auf, setAuf] = useState(false);
  const echte = v.optionen.filter((o) => !istMeta(o));
  const meta = v.optionen.filter(istMeta);
  const empf = v.empfehlung?.optionId ? v.optionen.find((o) => o.id === v.empfehlung!.optionId) : undefined;
  const zeigeAlle = !kompakt || auf;
  const waehle = (o: VorlageOption) => onEntscheide(v, o.id);

  return (
    <article className={`mf-karte art-${v.art} quelle-${v.quelle}${kompakt ? " kompakt" : ""}`}>
      {nummer !== undefined && (
        <span className="mf-nummer" aria-label={t("mf.rang", { n: nummer })} title={t("ui.minister.VorlageKarte.f7024d7")}>
          {nummer}
        </span>
      )}
      <header className="mf-kopf">
        <Gesicht v={v} size={kompakt ? 56 : 84} />
        <div className="mf-wer">
          <strong>{v.minister ? `${v.minister.rolle} ${v.minister.name}` : AEMTER[v.amt].ressort}</strong>
          <span>
            {AEMTER[v.amt].ressort}
            {v.minister ? ` · ${t("mf.loyalitaet", { n: v.minister.loyalitaet })}` : ""}
          </span>
        </div>
        <div className="mf-marken">
          <span className="mf-marke quelle">{quelleName(v.quelle)}</span>
          <Frist v={v} />
        </div>
      </header>
      <h4 className="mf-titel">{v.titel}</h4>
      {!(kompakt && !auf && v.problem) &&
        v.anlass.map((a, i) => (
          <p key={i} className="mf-anlass">
            {a}
          </p>
        ))}
      {v.problem && (kompakt && !auf ? (
        <p className="mf-problem">
          <b>{v.problem.name}</b> {t("mf.problem", { n: v.problem.provinzen, anteil: Math.round(v.problem.anteil * 100) })}
          {v.problem.ortNamen.length ? t("mf.problemOrte", { orte: v.problem.ortNamen.slice(0, 3).join(", ") }) : ""}.
        </p>
      ) : (
        <p className="mf-problem">
          <b>{t("ui.minister.VorlageKarte.dc0a13e")}</b> {v.problem.name} {t("mf.problem", { n: v.problem.provinzen, anteil: Math.round(v.problem.anteil * 100) })}
          {v.problem.ortNamen.length ? t("mf.problemOrte", { orte: v.problem.ortNamen.join(", ") }) : ""}.
          {onKarte && (
            <button className="pd-btn quiet klein" onClick={() => onKarte(v.problem!.id)}>
              {t("ui.minister.VorlageKarte.c9b2947")}
            </button>
          )}
        </p>
      ))}
      {v.empfehlung && (v.empfehlung.optionId ? (
        kompakt && !auf ? (
          <p className="mf-empf-zeile">
            <b>{t("mf.empfehlung")}</b>
            {empf && empf.id !== "spaeter" ? t("mf.zitat", { text: empf.label }) : t("mf.warten")}
            {v.empfehlung.hinweis && <em>{v.empfehlung.hinweis}</em>}
          </p>
        ) : (
          <aside className="mf-empfehlung">
            <strong>{t("mf.empfehlung")}</strong>
            <p>{v.empfehlung.grund}</p>
            {v.empfehlung.hinweis && <p className="hinweis">{v.empfehlung.hinweis}</p>}
          </aside>
        )
      ) : (
        <aside className="mf-empfehlung still">
          <strong>{t("ui.minister.VorlageKarte.35d0da0")}</strong>
          <p className="hinweis">{v.empfehlung.hinweis}</p>
        </aside>
      ))}

      {kompakt && !auf && (
        <div className="mf-schnell">
          {empf && empf.id !== "spaeter" && (
            <button className="pd-btn primary" disabled={!empf.moeglich} title={empf.grund} onClick={() => waehle(empf)}>
              {t("mf.annehmen")}{empf.kosten.pk > 0 ? <b>{empf.kosten.pk}</b> : null}
            </button>
          )}
          {!empf && echte.length === 1 && echte[0]!.aktion.art === "kenntnis" && (
            <button className="pd-btn" onClick={() => waehle(echte[0]!)}>{t("mf.knopf.kenntnis")}</button>
          )}
          <button className="pd-btn quiet" onClick={() => setAuf(true)}>
            {echte.length > 1 ? t("mf.alleOptionen", { n: echte.length }) : t("mf.folgenAnsehen")}
          </button>
          {meta.some((o) => o.id === "spaeter") && (
            <button className="pd-btn quiet" onClick={() => waehle(meta.find((o) => o.id === "spaeter")!)}>
              {t("ui.minister.VorlageKarte.a1ec84c")}
            </button>
          )}
        </div>
      )}

      {zeigeAlle && (
        <div className="mf-optionen">
          {echte.map((o) => (
            <Option key={o.id} v={v} o={o} empfohlen={v.empfehlung?.optionId === o.id} band={echte.length > 1} onWaehle={waehle} />
          ))}
        </div>
      )}

      {zeigeAlle && (
        <footer className="mf-fuss">
          {onEinstellen && v.vorschlag && (
            <button className="pd-btn quiet" onClick={() => onEinstellen(v)}>
              {t("ui.minister.VorlageKarte.c568008")}
            </button>
          )}
          {onGehe && v.ziel && v.ziel.art !== "karte" && (
            <button className="pd-btn quiet" onClick={() => onGehe(v.ziel!)}>
              {v.ziel.art === "politik" ? t("mf.imNetz") : t("mf.zurAkte")}
            </button>
          )}
          {meta
            .filter((o) => o.id !== "kenntnis")
            .map((o) => (
              <button key={o.id} className="pd-btn quiet" title={o.text} onClick={() => waehle(o)}>
                {o.label}
              </button>
            ))}
          {kompakt && (
            <button className="pd-btn quiet" onClick={() => setAuf(false)}>
              {t("mf.zuklappen")}
            </button>
          )}
          <span className="rang" title={t("ui.minister.VorlageKarte.b93a522")}>
            {t("mf.rangGrund", { n: v.prioritaet, grund: v.prioritaetGrund })}
          </span>
        </footer>
      )}
    </article>
  );
}

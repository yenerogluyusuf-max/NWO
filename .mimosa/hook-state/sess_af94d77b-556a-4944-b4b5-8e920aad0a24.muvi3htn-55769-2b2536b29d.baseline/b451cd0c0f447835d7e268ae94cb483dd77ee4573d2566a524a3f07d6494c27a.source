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

export const QUELLE_NAME: Record<VorlagenQuelle, string> = {
  ereignis: "Ereignis",
  kabinett: "Ministerrat",
  lage: "Lagebericht",
  problem: "Vorschlag",
  zusage: "Zusage",
  person: "Aussprache",
  befehl: "Rückmeldung",
  auftrag: "Rückmeldung",
};

const TINT: Record<string, string> = { stab: "#7c5823", finanzen: "#265a62", inneres: "#4a3f6b", aussen: "#2f5a8a", justiz: "#6b4a3a", generalstab: "#4c5a3a", wirtschaft: "#265a62" };

const nf = (x: number, d = 1): string => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const zahl = (n: NutzenZeile, x: number): string => (n.einheit === "Provinzen" ? String(Math.round(x)) : nf(x, 1));
const istMeta = (o: VorlageOption): boolean => o.id === "spaeter" || o.id === "nichts" || o.id === "kenntnis";

/** Beschriftung des Knopfes einer Option, nach dem, was er auslöst. */
export function knopfText(o: VorlageOption): string {
  switch (o.aktion.art) {
    case "ereignis":
      return "Beschließen";
    case "kabinett":
      return "Diesen Beschluss durchsetzen";
    case "massnahme":
      return "Als Gesetz einbringen";
    case "zusage":
      return o.aktion.weg === "einloesen" ? "Einlösen" : o.aktion.weg === "vertroesten" ? "Vertrösten" : "Zusage brechen";
    case "gespraech":
      return "Gespräch führen";
    case "befehl":
      return "Anordnen";
    case "kenntnis":
      return "Zur Kenntnis";
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
      <span>{o.kosten.pk > 0 ? `${o.kosten.pk} Kapital` : "kostenlos"}</span>
      {o.kosten.aufmerksamkeit > 0 && <span className="leise">{o.kosten.aufmerksamkeit} Aufmerksamkeit</span>}
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
        <caption>Erwarteter Verlauf in {monate} Monaten</caption>
        <thead>
          <tr>
            <th>Größe</th>
            <th>heute</th>
            <th>ohne</th>
            <th>mit</th>
          </tr>
        </thead>
        <tbody>
          {zeilen.map((n) => (
            <tr key={n.id}>
              <td>{n.name}{n.einheit === "Provinzen" ? " (Provinzen mit akutem Problem)" : ""}</td>
              <td>{zahl(n, n.jetzt)}</td>
              <td>{zahl(n, n.ohne)}</td>
              <td className={n.besser === true ? "besser" : n.besser === false ? "schlechter" : ""}>{zahl(n, n.mit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mf-nutzen-fuss">{kaum ? `In ${monate} Monaten ist noch kaum ein Unterschied messbar: Die Wirkung kommt langsam. ` : ""}Rechnung des Politiknetzes bei sonst unveränderter Wirtschaftslage.</p>
    </>
  );
}

function Option({ v, o, empfohlen, band, onWaehle }: { v: Vorlage; o: VorlageOption; empfohlen: boolean; band: boolean; onWaehle: (o: VorlageOption) => void }) {
  return (
    <section className={`mf-option${empfohlen ? " empfohlen" : ""}`}>
      {empfohlen && band && v.empfehlung && <span className="mf-band">Empfehlung{v.minister ? ` von ${v.minister.name}` : ""}</span>}
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
              <b>Dafür</b>
              {o.dafuer.join(", ")}.{" "}
            </span>
          )}
          {o.dagegen.length > 0 && (
            <span className="dagegen">
              <b>Dagegen</b>
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
  const t = v.frist;
  return <span className={`mf-marke${t <= 7 ? " rot" : ""}`}>Frist {t <= 0 ? "heute" : t === 1 ? "morgen" : `in ${t} Tagen`}</span>;
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
        <span className="mf-nummer" aria-label={`Rang ${nummer}`} title="Reihenfolge nach Rang">
          {nummer}
        </span>
      )}
      <header className="mf-kopf">
        <Gesicht v={v} size={kompakt ? 56 : 84} />
        <div className="mf-wer">
          <strong>{v.minister ? `${v.minister.rolle} ${v.minister.name}` : AEMTER[v.amt].ressort}</strong>
          <span>
            {AEMTER[v.amt].ressort}
            {v.minister ? ` · Loyalität ${v.minister.loyalitaet}` : ""}
          </span>
        </div>
        <div className="mf-marken">
          <span className="mf-marke quelle">{QUELLE_NAME[v.quelle]}</span>
          <Frist v={v} />
        </div>
      </header>
      <h4 className="mf-titel">{v.titel}</h4>
      {!(kompakt && !auf && v.problem) &&
        v.anlass.map((t, i) => (
          <p key={i} className="mf-anlass">
            {t}
          </p>
        ))}
      {v.problem && (kompakt && !auf ? (
        <p className="mf-problem">
          <b>{v.problem.name}</b> ist in {v.problem.provinzen} {v.problem.provinzen === 1 ? "Provinz" : "Provinzen"} akut ({Math.round(v.problem.anteil * 100)} Prozent der Bevölkerung)
          {v.problem.ortNamen.length ? `, vor allem in ${v.problem.ortNamen.slice(0, 3).join(", ")}` : ""}.
        </p>
      ) : (
        <p className="mf-problem">
          <b>Wie schlimm und wo:</b> {v.problem.name} ist in {v.problem.provinzen} {v.problem.provinzen === 1 ? "Provinz" : "Provinzen"} akut ({Math.round(v.problem.anteil * 100)} Prozent der Bevölkerung)
          {v.problem.ortNamen.length ? `, vor allem in ${v.problem.ortNamen.join(", ")}` : ""}.
          {onKarte && (
            <button className="pd-btn quiet klein" onClick={() => onKarte(v.problem!.id)}>
              Auf der Karte ansehen
            </button>
          )}
        </p>
      ))}
      {v.empfehlung && (v.empfehlung.optionId ? (
        kompakt && !auf ? (
          <p className="mf-empf-zeile">
            <b>Empfehlung</b>
            {empf && empf.id !== "spaeter" ? `„${empf.label}“` : "Warten"}
            {v.empfehlung.hinweis && <em>{v.empfehlung.hinweis}</em>}
          </p>
        ) : (
          <aside className="mf-empfehlung">
            <strong>Empfehlung</strong>
            <p>{v.empfehlung.grund}</p>
            {v.empfehlung.hinweis && <p className="hinweis">{v.empfehlung.hinweis}</p>}
          </aside>
        )
      ) : (
        <aside className="mf-empfehlung still">
          <strong>Keine Empfehlung</strong>
          <p className="hinweis">{v.empfehlung.hinweis}</p>
        </aside>
      ))}

      {kompakt && !auf && (
        <div className="mf-schnell">
          {empf && empf.id !== "spaeter" && (
            <button className="pd-btn primary" disabled={!empf.moeglich} title={empf.grund} onClick={() => waehle(empf)}>
              Empfehlung annehmen{empf.kosten.pk > 0 ? <b>{empf.kosten.pk}</b> : null}
            </button>
          )}
          {!empf && echte.length === 1 && echte[0]!.aktion.art === "kenntnis" && (
            <button className="pd-btn" onClick={() => waehle(echte[0]!)}>Zur Kenntnis</button>
          )}
          <button className="pd-btn quiet" onClick={() => setAuf(true)}>
            {echte.length > 1 ? `Alle ${echte.length} Optionen` : "Folgen ansehen"}
          </button>
          {meta.some((o) => o.id === "spaeter") && (
            <button className="pd-btn quiet" onClick={() => waehle(meta.find((o) => o.id === "spaeter")!)}>
              Später
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
              Einstellen und ansehen
            </button>
          )}
          {onGehe && v.ziel && v.ziel.art !== "karte" && (
            <button className="pd-btn quiet" onClick={() => onGehe(v.ziel!)}>
              {v.ziel.art === "politik" ? "Im Politiknetz ansehen" : "Zur Akte"}
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
              Zuklappen
            </button>
          )}
          <span className="rang" title="Rang der Vorlage aus Frist, Tragweite und Aktualität">
            Rang {v.prioritaet}: {v.prioritaetGrund}
          </span>
        </footer>
      )}
    </article>
  );
}

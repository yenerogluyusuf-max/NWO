// Regierungsprogramme (Nacht N6, Befund F-30): oben die acht Programme als Medaillen mit Pfad und Lage (das Bild der Frage „Welcher
// Mehrjahresplan ist als Nächstes dran?“), rechts das gewählte Programm mit seinen Schritten als Zeilen; der nächste Schritt steht offen
// mit Voraussetzungen, Wirkung, Preis und Beginnen. Vorher standen acht große Karten untereinander (3,5 Bildschirme).
// Die Regeln stehen in sim/programme.ts. Die frühere Akte (politik/ProgrammeAkte.tsx) bleibt unverändert im Code.

import { useMemo, useState } from "react";
import type { World } from "../sim/types";
import { MAX_LAUFEND, PROGRAMME, programmZustand, schrittSicht, starteSchritt, type Programm, type SchrittSicht } from "../sim/programme";
import { tunWort } from "../data/skalen";
import { NET } from "../sim/modell";
import { Medaille, type EmblemName } from "./politik/embleme";
import "./politik/design.css";
import "./programme.css";
import { t, zahl } from "../i18n";

const EMBLEM: Record<string, EmblemName> = {
  erdbeben: "wiederaufbau",
  preise: "preise",
  regionen: "regionen",
  gesundheit: "gesundheit",
  recht: "recht",
  wasserenergie: "wasser",
  sicherheit: "frieden",
  welt: "welt",
};

type Lage = "laeuft" | "bereit" | "unterwegs" | "ruht" | "erfuellt";
const LAGE_PILL: Record<Lage, string> = { laeuft: "warn", bereit: "gut", unterwegs: "teal", ruht: "still", erfuellt: "teal" };
const LAGE_RANG: Record<Lage, number> = { laeuft: 0, bereit: 1, unterwegs: 2, ruht: 3, erfuellt: 4 };

interface Ansicht {
  p: Programm;
  sichten: SchrittSicht[];
  fertig: number;
  lage: Lage;
  naechster: SchrittSicht | undefined;
}

function ansichtVon(world: World, p: Programm): Ansicht {
  const sichten = p.schritte.map((s) => schrittSicht(world, s));
  const fertig = sichten.filter((x) => x.status === "fertig").length;
  const laufend = sichten.find((x) => x.status === "laufend");
  const bereit = sichten.find((x) => x.status === "bereit");
  const offen = sichten.find((x) => x.status === "offen") ?? sichten.find((x) => x.status === "gesperrt");
  const lage: Lage = fertig === sichten.length ? "erfuellt" : laufend ? "laeuft" : bereit ? "bereit" : fertig > 0 ? "unterwegs" : "ruht";
  return { p, sichten, fertig, lage, naechster: laufend ?? bereit ?? offen };
}

function Pfad({ a }: { a: Ansicht }) {
  return (
    <ol className="pd-pfad pg-pfad" aria-label={t("ui.politik.ProgrammeAkte.d0af8bd")}>
      {a.sichten.map((x, k) => (
        <li key={x.schritt.id} className={x.status} style={x.status === "laufend" ? ({ "--fortschritt": `${Math.round((x.lauf ?? 0) * 360)}deg` } as React.CSSProperties) : undefined}>
          <span className="pd-station" title={`${k + 1}. ${x.schritt.titel}: ${t(`n6.pg.status.${x.status}`)}`}>{x.status === "fertig" ? "✓" : k + 1}</span>
        </li>
      ))}
    </ol>
  );
}

function Schritt({ nr, s, offen, onAuf, onStarte, onMassnahme }: { nr: number; s: SchrittSicht; offen: boolean; onAuf: () => void; onStarte: (id: string) => void; onMassnahme?: ((id: string, richtung: 1 | -1) => void) | undefined }) {
  const sch = s.schritt;
  const bedingungen = s.bedingungen.filter((b) => b.bedingung.art !== "keine");
  const monate = Math.max(1, Math.round(sch.tage / 30));
  return (
    <li className={`pg-schritt status-${s.status}${offen ? " offen" : ""}${sch.vermaechtnis ? " vermaechtnis" : ""}`}>
      <button type="button" className="pg-zeile" aria-expanded={offen} onClick={onAuf}>
        <span className="pd-schritt-nr" aria-hidden>{s.status === "fertig" ? "✓" : nr}</span>
        <span className="pg-zeile-titel">{sch.titel}</span>
        <span className={`pd-pill ${s.status === "bereit" ? "gut" : s.status === "laufend" ? "warn" : s.status === "fertig" ? "teal" : "still"}`} title={t(`n6.pg.status.${s.status}`)}>{t(`n6.pg.kurz.${s.status}`)}</span>
      </button>
      {offen && (
        <div className="pg-blatt">
          <p className="pd-schritt-text">{sch.text}</p>
          {s.status !== "fertig" && (s.fehlt.length > 0 || bedingungen.length > 0) && (
            <ul className="pd-bedingungen" aria-label={t("ui2.ui.politik.ProgrammeAkte.bc4e9f4")}>
              {s.fehlt.length > 0 && (
                <li className="offen">
                  <span className="pd-zeichen" aria-hidden>○</span>
                  <span>{t("ui2.ui.politik.ProgrammeAkte.6d452f3", { p0: s.fehlt.join(", ") })}</span>
                </li>
              )}
              {bedingungen.map((b) => {
                const art = b.bedingung.art;
                const kannMassnahme = !b.erfuellt && (art === "massnahme" || art === "massnahme-max");
                const mid = (b.bedingung as { id?: string }).id;
                return (
                  <li key={b.text} className={b.erfuellt ? "ok" : "offen"}>
                    <span className="pd-zeichen" aria-hidden>{b.erfuellt ? "✓" : "○"}</span>
                    <span>{b.text}</span>
                    {kannMassnahme && mid && onMassnahme && (
                      <button className="pd-btn quiet klein" onClick={() => onMassnahme(mid, art === "massnahme" ? 1 : -1)}>
                        {tunWort(mid, art === "massnahme" ? 1 : -1)}: {NET.nodes[NET.index.get(mid)!]!.name}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="pd-danach">
            <b>{t("ui2.ui.politik.ProgrammeAkte.3371223")}</b> <span>{sch.ergebnis}</span>
          </p>
          {s.status === "laufend" && (
            <p className="pd-lauf">
              <span className="pd-balken" role="img" aria-label={t("ui2.ui.politik.ProgrammeAkte.9844a1b", { p0: Math.round((s.lauf ?? 0) * 100) })}>
                <i style={{ width: `${Math.round((s.lauf ?? 0) * 100)}%` }} />
              </span>
              <span>{t("ui2.ui.politik.ProgrammeAkte.8fb92d8", { p0: s.restTage })}</span>
            </p>
          )}
          {s.status !== "fertig" && s.status !== "laufend" && (
            <footer className="pd-schritt-fuss">
              <span className="pg-preis">{t("fokus.ui.kosten", { pk: zahl(sch.kapital), monate })}</span>
              {s.status === "bereit" && (
                <button className="pd-btn primary" disabled={!s.bezahlbar} title={s.bezahlbar ? undefined : t("ui2.ui.politik.ProgrammeAkte.9fcc6e5")} onClick={() => onStarte(sch.id)}>
                  {t("ui2.ui.politik.ProgrammeAkte.bb0350f")}
                </button>
              )}
            </footer>
          )}
        </div>
      )}
    </li>
  );
}

export function Programme({ world, refresh, onMassnahme }: { world: World; refresh: () => void; onMassnahme?: (id: string, richtung: 1 | -1) => void }) {
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const spiel = world.spiel;
  const ansichten = useMemo(
    () => PROGRAMME.map((p, i) => ({ a: ansichtVon(world, p), i })).sort((x, y) => LAGE_RANG[x.a.lage] - LAGE_RANG[y.a.lage] || x.i - y.i).map((x) => x.a),
    // Die Rechnungen sind klein, ändern sich aber mit jedem Tag
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [world.day, spiel?.kapital, antwort],
  );
  const [gewaehlt, setGewaehlt] = useState<string>(ansichten[0]?.p.id ?? "");
  const [aufSchritt, setAufSchritt] = useState<string | null>(null);
  if (!spiel) return <p>{t("ui.politik.ProgrammeAkte.d7b492f")}</p>;
  const z = programmZustand(world);
  const bereitGesamt = ansichten.reduce((n, a) => n + a.sichten.filter((x) => x.status === "bereit").length, 0);
  const erfuellt = ansichten.filter((a) => a.lage === "erfuellt").length;
  const a = ansichten.find((x) => x.p.id === gewaehlt) ?? ansichten[0]!;
  // null: der nächste Schritt steht offen; "": alle zu; sonst der gewählte
  const offenId = aufSchritt === "" ? null : aufSchritt && a.sichten.some((x) => x.schritt.id === aufSchritt) ? aufSchritt : a.naechster?.schritt.id ?? null;
  const starte = (id: string) => {
    setAntwort(starteSchritt(world, id));
    refresh();
  };
  return (
    <div className="pg">
      <header className="pg-kopf">
        {/* Welle B3: „höchstens zwei gleichzeitig“ zeigt der Zähler daneben */}
        <p className="pd-lead">{t("welle_b3.pg.lead")}</p>
        <ul className="pd-zaehler" aria-label={t("ui.politik.ProgrammeAkte.8b30d8b")}>
          <li><b>{z.laufend.length}<small> / {MAX_LAUFEND}</small></b><span>{t("n6.pg.laufen")}</span></li>
          <li className={bereitGesamt > 0 ? "hell" : ""}><b>{bereitGesamt}</b><span>{t("n6.pg.bereit", { n: bereitGesamt })}</span></li>
          <li><b>{erfuellt}<small> / {PROGRAMME.length}</small></b><span>{t("ui.politik.ProgrammeAkte.9e13af5")}</span></li>
        </ul>
      </header>
      {antwort && (
        <p className={`rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
          {antwort.text}
          {antwort.why && <em> {antwort.why}</em>}
        </p>
      )}
      <div className="pg-buehne">
        <ul className="pg-raster">
          {ansichten.map((x) => (
            <li key={x.p.id}>
              <button type="button" className={`pg-kachel lage-${x.lage}${x.p.id === a.p.id ? " on" : ""}`} aria-pressed={x.p.id === a.p.id} onClick={() => { setGewaehlt(x.p.id); setAufSchritt(null); }}>
                <Medaille name={EMBLEM[x.p.id] ?? "kultur"} groesse="klein" />
                <span className="pg-kachel-text">
                  <strong>{x.p.titel}</strong>
                  <span className={`pd-pill ${LAGE_PILL[x.lage]}`}>{t(`n6.pg.lage.${x.lage}`)}</span>
                  <Pfad a={x} />
                </span>
              </button>
            </li>
          ))}
        </ul>
        <section className="pg-detail" aria-live="polite">
          <header className="pg-detail-kopf">
            <Medaille name={EMBLEM[a.p.id] ?? "kultur"} />
            <div>
              <h4>{a.p.titel}</h4>
              <p className="pd-prog-leitbild">{a.p.leitbild}</p>
            </div>
            <span className="pd-prog-zaehl"><b>{a.fertig}</b><small> / {a.p.schritte.length}</small></span>
          </header>
          {a.lage === "erfuellt" && <p className="pd-prog-fertig">{t("ui2.ui.politik.ProgrammeAkte.6620f50")} {a.p.schritte.find((s) => s.vermaechtnis)?.ergebnis ?? ""}</p>}
          <ol className="pg-schritte">
            {a.sichten.map((x, k) => (
              <Schritt key={x.schritt.id} nr={k + 1} s={x} offen={offenId === x.schritt.id} onAuf={() => setAufSchritt(offenId === x.schritt.id ? "" : x.schritt.id)} onStarte={starte} onMassnahme={onMassnahme} />
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

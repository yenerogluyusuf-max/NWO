// Regierungsprogramme: ein Plan für Jahre. Jedes Programm ist eine Karte mit Medaille, Leitsatz, Pfad aus Stationen
// und dem nächsten Schritt (Voraussetzungen, Preis, Wirkung). Programme, die laufen oder bereit sind, stehen oben.
// Die Regeln stehen in sim/programme.ts; hier wird nur gezeigt und gestartet.

import { useMemo, useState } from "react";
import type { World } from "../../sim/types";
import { MAX_LAUFEND, PROGRAMME, programmZustand, schrittSicht, starteSchritt, type Programm, type SchrittSicht } from "../../sim/programme";
import { tunWort } from "../../data/skalen";
import { NET } from "../../sim/modell";
import { Medaille, type EmblemName } from "./embleme";
import "./design.css";

import { t } from "../../i18n";
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

const STATUS_WORT: Record<SchrittSicht["status"], string> = {
  gesperrt: "wartet auf einen früheren Schritt",
  offen: "Voraussetzung fehlt",
  bereit: "bereit",
  laufend: "läuft",
  fertig: "erreicht",
};

type Lage = "laeuft" | "bereit" | "unterwegs" | "ruht" | "erfuellt";

const LAGE_WORT: Record<Lage, string> = {
  laeuft: "Schritt läuft",
  bereit: "Schritt bereit",
  unterwegs: "in Arbeit",
  ruht: "noch nicht begonnen",
  erfuellt: "erfüllt",
};
const LAGE_PILL: Record<Lage, string> = { laeuft: "warn", bereit: "gut", unterwegs: "teal", ruht: "still", erfuellt: "teal" };
const LAGE_RANG: Record<Lage, number> = { laeuft: 0, bereit: 1, unterwegs: 2, ruht: 3, erfuellt: 4 };

interface Ansicht {
  p: Programm;
  sichten: SchrittSicht[];
  fertig: number;
  lage: Lage;
  /** Der Schritt, um den es gerade geht: der laufende, sonst der bereite, sonst der erste, der noch fehlt */
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

const monateWort = (tage: number) => {
  const m = Math.max(1, Math.round(tage / 30));
  return `${m} ${m === 1 ? "Monat" : "Monate"}`;
};

export function ProgrammeAkte({ world, refresh, onMassnahme }: { world: World; refresh: () => void; onMassnahme?: (id: string, richtung: 1 | -1) => void }) {
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const [auf, setAuf] = useState<Set<string>>(() => new Set());
  const spiel = world.spiel;

  const ansichten = useMemo(
    () => {
      const liste = PROGRAMME.map((p) => ansichtVon(world, p));
      return liste.map((a, i) => ({ a, i })).sort((x, y) => LAGE_RANG[x.a.lage] - LAGE_RANG[y.a.lage] || x.i - y.i).map((x) => x.a);
    },
    // Die Rechnungen sind klein, ändern sich aber mit jedem Tag
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [world.day, spiel?.kapital, antwort],
  );

  if (!spiel) return <p>{t("ui.politik.ProgrammeAkte.d7b492f")}</p>;
  const z = programmZustand(world);
  const laufend = z.laufend.map((l) => {
    const p = PROGRAMME.find((x) => x.schritte.some((s) => s.id === l.schritt))!;
    const s = p.schritte.find((x) => x.id === l.schritt)!;
    return { p, s, sicht: schrittSicht(world, s) };
  });
  const bereitGesamt = ansichten.reduce((n, a) => n + a.sichten.filter((x) => x.status === "bereit").length, 0);
  const erfuellt = ansichten.filter((a) => a.lage === "erfuellt").length;
  const frei = Math.max(0, MAX_LAUFEND - laufend.length);

  const umschalten = (id: string) =>
    setAuf((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  function starte(schrittId: string) {
    setAntwort(starteSchritt(world, schrittId));
    refresh();
  }

  return (
    <div className="pd-programme">
      <header className="pd-seitenkopf">
        <div>
          <p className="pd-ueber">{t("ui2.ui.politik.ProgrammeAkte.a73447b")}</p>
          <h3>{t("ui.politik.ProgrammeAkte.66d15d8")}</h3>
          <p className="pd-lead">
            {t("ui2.ui.politik.ProgrammeAkte.b9bd96c", { p0: MAX_LAUFEND })}
          </p>
        </div>
        <ul className="pd-zaehler" aria-label={t("ui.politik.ProgrammeAkte.8b30d8b")}>
          <li>
            <b>{laufend.length}</b>
            <span>{t("ui2.ui.politik.ProgrammeAkte.f3895b2", { p0: MAX_LAUFEND })}</span>
          </li>
          <li className={bereitGesamt > 0 ? "hell" : ""}>
            <b>{bereitGesamt}</b>
            <span>{bereitGesamt === 1 ? t("ui2.ui.politik.ProgrammeAkte.db0f51b") : t("ui2.ui.politik.ProgrammeAkte.e87c09b")}</span>
          </li>
          <li>
            <b>
              {erfuellt}
              <small> / {PROGRAMME.length}</small>
            </b>
            <span>{t("ui.politik.ProgrammeAkte.9e13af5")}</span>
          </li>
        </ul>
      </header>

      {antwort && (
        <p className={`rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
          {antwort.text}
          {antwort.why && <em> {antwort.why}</em>}
        </p>
      )}

      <section className="pd-plaetze" aria-label={t("ui2.ui.politik.ProgrammeAkte.5a1cdc8")}>
        {laufend.map(({ p, s, sicht }) => (
          <article key={s.id} className="pd-platz belegt">
            <Medaille name={EMBLEM[p.id] ?? "kultur"} groesse="klein" />
            <div className="pd-platz-text">
              <p className="pd-ueber">{t("ui2.ui.politik.ProgrammeAkte.c10fa4e", { p0: p.titel })}</p>
              <strong>{s.titel}</strong>
              <span className="pd-balken" role="img" aria-label={t("ui2.ui.politik.ProgrammeAkte.9844a1b", { p0: Math.round((sicht.lauf ?? 0) * 100) })}>
                <i style={{ width: `${Math.round((sicht.lauf ?? 0) * 100)}%` }} />
              </span>
            </div>
            <span className="pd-platz-rest">
              {t("ui2.ui.politik.ProgrammeAkte.4d05f58")} <b>{sicht.restTage ?? 0}</b> {t("ui2.ui.politik.ProgrammeAkte.e94f59f")}
            </span>
          </article>
        ))}
        {Array.from({ length: frei }, (_, k) => (
          <article key={`frei-${k}`} className="pd-platz leer">
            <span className="pd-platz-punkt" aria-hidden />
            <div className="pd-platz-text">
              <p className="pd-ueber">{t("ui2.ui.politik.ProgrammeAkte.a0ced63")}</p>
              <strong>{bereitGesamt > 0 ? t("ui2.ui.politik.ProgrammeAkte.cad5181") : t("ui2.ui.politik.ProgrammeAkte.7857a01")}</strong>
            </div>
          </article>
        ))}
      </section>

      <ul className="pd-prog-liste">
        {ansichten.map((a) => {
          const offen = auf.has(a.p.id);
          return (
            <li key={a.p.id} className={`pd-prog lage-${a.lage}${offen ? " offen" : ""}`}>
              <header className="pd-prog-kopf">
                <Medaille name={EMBLEM[a.p.id] ?? "kultur"} />
                <div className="pd-prog-titel">
                  <h4>{a.p.titel}</h4>
                  <span className={`pd-pill ${LAGE_PILL[a.lage]}`}>{LAGE_WORT[a.lage]}</span>
                </div>
                <span className="pd-prog-zaehl" title={t("ui2.ui.politik.ProgrammeAkte.f84cf33", { p0: a.fertig, p1: a.p.schritte.length })}>
                  <b>{a.fertig}</b>
                  <small> / {a.p.schritte.length}</small>
                </span>
              </header>
              <p className="pd-prog-leitbild">{a.p.leitbild}</p>

              <ol className="pd-pfad" aria-label={t("ui.politik.ProgrammeAkte.d0af8bd")}>
                {a.sichten.map((x, k) => (
                  <li key={x.schritt.id} className={x.status} style={x.status === "laufend" ? ({ "--fortschritt": `${Math.round((x.lauf ?? 0) * 360)}deg` } as React.CSSProperties) : undefined}>
                    <span className="pd-station" title={`${k + 1}. ${x.schritt.titel}: ${STATUS_WORT[x.status]}`}>
                      {x.status === "fertig" ? "✓" : k + 1}
                    </span>
                  </li>
                ))}
              </ol>

              {a.naechster && a.lage !== "erfuellt" && !offen && (
                <SchrittBlatt
                  hervorgehoben
                  titelZeile={a.lage === "laeuft" ? t("ui2.ui.politik.ProgrammeAkte.541a535") : a.lage === "bereit" ? t("ui2.ui.politik.ProgrammeAkte.e70edf6") : t("ui2.ui.politik.ProgrammeAkte.03670c0")}
                  x={a.sichten.indexOf(a.naechster) + 1}
                  s={a.naechster}
                  onStarte={starte}
                  onMassnahme={onMassnahme}
                />
              )}
              {a.lage === "erfuellt" && (
                <p className="pd-prog-fertig">
                  {t("ui2.ui.politik.ProgrammeAkte.6620f50")} {a.p.schritte.find((s) => s.vermaechtnis)?.ergebnis ?? ""}
                </p>
              )}

              <button className="pd-btn quiet pd-alle" aria-expanded={offen} onClick={() => umschalten(a.p.id)}>
                {offen ? t("ui2.ui.politik.ProgrammeAkte.69f86df") : t("ui2.ui.politik.ProgrammeAkte.ecab80e", { p0: a.p.schritte.length })}
              </button>
              {offen && (
                <ol className="pd-schritte">
                  {a.sichten.map((x, k) => (
                    <li key={x.schritt.id}>
                      <SchrittBlatt
                        x={k + 1}
                        s={x}
                        onStarte={starte}
                        onMassnahme={onMassnahme}
                        {...(x === a.naechster && a.lage !== "erfuellt" ? { hervorgehoben: true, titelZeile: a.lage === "laeuft" ? "Läuft gerade" : a.lage === "bereit" ? "Als Nächstes" : "Nächste Station" } : {})}
                      />
                    </li>
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Ein Schritt mit allem, was man zur Entscheidung braucht: Sinn, Voraussetzungen, Preis, Wirkung. */
function SchrittBlatt({
  x,
  s,
  titelZeile,
  hervorgehoben,
  onStarte,
  onMassnahme,
}: {
  x: number;
  s: SchrittSicht;
  titelZeile?: string;
  hervorgehoben?: boolean;
  onStarte: (id: string) => void;
  onMassnahme: ((id: string, richtung: 1 | -1) => void) | undefined;
}) {
  const sch = s.schritt;
  const bedingungen = s.bedingungen.filter((b) => b.bedingung.art !== "keine");
  return (
    <article className={`pd-schritt status-${s.status}${hervorgehoben ? " hervor" : ""}${sch.vermaechtnis ? " vermaechtnis" : ""}`}>
      <header>
        <span className="pd-schritt-nr" aria-hidden>
          {s.status === "fertig" ? "✓" : x}
        </span>
        <div>
          {titelZeile && <p className="pd-ueber">{titelZeile}</p>}
          <h5>{sch.titel}</h5>
        </div>
        <span className={`pd-pill ${s.status === "bereit" ? "gut" : s.status === "laufend" ? "warn" : s.status === "fertig" ? "teal" : "still"}`}>{STATUS_WORT[s.status]}</span>
      </header>
      <p className="pd-schritt-text">{sch.text}</p>

      {s.status !== "fertig" && (s.fehlt.length > 0 || bedingungen.length > 0) && (
        <ul className="pd-bedingungen" aria-label={t("ui2.ui.politik.ProgrammeAkte.bc4e9f4")}>
          {s.fehlt.length > 0 && (
            <li className="offen">
              <span className="pd-zeichen" aria-hidden>
                ○
              </span>
              <span>{t("ui2.ui.politik.ProgrammeAkte.6d452f3", { p0: s.fehlt.join(", ") })}</span>
            </li>
          )}
          {bedingungen.map((b) => {
            const art = b.bedingung.art;
            const kannMassnahme = !b.erfuellt && (art === "massnahme" || art === "massnahme-max");
            const mid = (b.bedingung as { id?: string }).id;
            return (
              <li key={b.text} className={b.erfuellt ? "ok" : "offen"}>
                <span className="pd-zeichen" aria-hidden>
                  {b.erfuellt ? "✓" : "○"}
                </span>
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
        <b>{t("ui2.ui.politik.ProgrammeAkte.3371223")}</b>
        <span>{sch.ergebnis}</span>
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
          <ul className="pd-preis" aria-label={t("ui2.ui.politik.ProgrammeAkte.0272929")}>
            <li>
              <b>{sch.kapital}</b> {t("ui2.ui.politik.ProgrammeAkte.28d438e")}
            </li>
            <li>
              <b>{monateWort(sch.tage).split(" ")[0]}</b> {monateWort(sch.tage).split(" ")[1]}
            </li>
          </ul>
          {s.status === "bereit" && (
            <button className="pd-btn primary" disabled={!s.bezahlbar} title={s.bezahlbar ? undefined : t("ui2.ui.politik.ProgrammeAkte.9fcc6e5")} onClick={() => onStarte(sch.id)}>
              {t("ui2.ui.politik.ProgrammeAkte.bb0350f")}
            </button>
          )}
        </footer>
      )}
    </article>
  );
}

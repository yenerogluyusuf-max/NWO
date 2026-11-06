// Die Wählerkoalition, wie in Democracy 4: Wer trägt Sie, wer schwankt, wer ist verloren, warum, wohin würden sie wechseln, und was würde helfen.
// Links die Gruppen mit Stimmung, Trend und Richtung, rechts die gewählte Gruppe im Einzelnen. Alles aus dem Politiknetz gerechnet.

import { useEffect, useMemo, useRef, useState } from "react";
import type { World } from "../sim/types";
import { abwanderung, koalition, schritteFuerZustimmung, type GruppeKurz } from "../sim/waehler-detail";
import { zustimmungsBilanz } from "../sim/waehler";
import { entscheidungsMarken, zustimmungsVerlauf } from "../sim/waehler-verlauf";
import { formatDateDe } from "../sim/dates";
import { ROHDATEN, angezeigteZustimmung, institutsReihe, rohdatenKaufen } from "../sim/medien";
import { wahlPrognose } from "../sim/wahl";
import { NET } from "../sim/modell";
import type { Ziel } from "./schreibtisch/briefing";
import { t } from "../i18n";
import { GruppenDetail, type DossierZiel } from "./waehler/GruppenDetail";
import { HilfeKarte } from "./waehler/HilfeKarte";
import { Sparkline } from "./waehler/Sparkline";
import { Kreisfeld } from "./waehler/Kreisfeld";
import { gewichtWort, nf, prozent, vz } from "./waehler/format";
import "./politik/design.css";
import "./waehler/waehler.css";

const ROLLE_TEXT = { traeger: "wa.rolle.traeger", schwankend: "wa.rolle.schwankend", gegner: "wa.rolle.gegner" } as const;

/** Ein Strich auf der Skala von 30 bis 70 Prozent (außerhalb an den Rand gesetzt). */
const SKALA = { von: 30, bis: 70 };
const aufSkala = (x: number) => `${Math.max(0, Math.min(100, ((x - SKALA.von) / (SKALA.bis - SKALA.von)) * 100))}%`;

/**
 * Das erwartete Ergebnis, wenn heute gewählt würde (E-1): dieselbe Rechnung wie am Wahltag (sim/wahl.ts, wahlPrognose), ausgehend von der
 * Zustimmung, die der Spieler sieht. Darunter die Treppe von der Zustimmung zum Ergebnis und, was im Wahlkampf noch sicher kommt.
 */
function Prognose({ world, onGehe, onAenderung }: { world: World; onGehe?: (z: Ziel) => void; onAenderung?: () => void }) {
  const p = wahlPrognose(world);
  const [meldung, setMeldung] = useState<string | null>(null);
  const roh = world.spiel?.medien?.rohdaten;
  const bestellt = !!roh && world.day <= roh.bisTag;
  const ton = p.von > 50 ? "gut" : p.bis < 50 ? "schlecht" : "knapp";
  const monate = Math.round(p.tageBisWahl / 30.4);
  const basisText =
    p.quelle === "institut" ? t("nacht_n2.prognose.basis_institut", { institut: p.institut ?? "" }) : p.quelle === "rohdaten" ? t("nacht_n2.prognose.basis_rohdaten") : t("nacht_n2.prognose.basis_start");
  const a = p.angriffe;
  const themaNode = a.themaId ? NET.nodes[NET.index.get(a.themaId)!] : undefined;
  return (
    <div className="wa-prognose">
      <div className="wa-baro-zahl">
        <span className="wa-baro-kopf">{t("medien.barometer.kopf")}</span>
        <strong className={ton}>{t("nacht_n2.prognose.spanne", { von: nf(p.von, 0), bis: nf(p.bis, 0) })}</strong>
        <span className="wa-baro-text">
          {t(p.letzte ? "nacht_n2.prognose.text_nachfolger" : "nacht_n2.prognose.text", { mitte: nf(p.erwartet, 1) })}{" "}
          {t("nacht_n2.prognose.wahl", { datum: formatDateDe(p.wahlDatum), monate })}
        </span>
      </div>
      <div className="wa-prognose-rechts">
      <div className="wa-skala" role="img" aria-label={t("nacht_n2.prognose.skala_aria", { von: nf(p.von, 0), bis: nf(p.bis, 0), zustimmung: nf(p.zustimmung, 0) })}>
        <div className="wa-skala-spur">
          <i className={`wa-skala-band ${ton}`} style={{ left: aufSkala(p.von), width: `calc(${aufSkala(p.bis)} - ${aufSkala(p.von)})` }} />
          <b className="wa-skala-mitte" style={{ left: aufSkala(p.erwartet) }} />
          <u className="wa-skala-sieg" style={{ left: aufSkala(50) }}>
            <span>{t("nacht_n2.prognose.sieg")}</span>
          </u>
          <s className="wa-skala-zust" style={{ left: aufSkala(p.zustimmung) }} title={basisText} />
        </div>
        <div className="wa-skala-achse" aria-hidden>
          {[30, 40, 50, 60, 70].map((x) => (
            <span key={x} style={{ left: aufSkala(x) }}>
              {x}
            </span>
          ))}
        </div>
      </div>
      <ol className="wa-treppe" aria-label={t("nacht_n2.prognose.treppe")}>
        <li className="basis">
          <span>{basisText}</span>
          <strong>{nf(p.zustimmung, 1)} %</strong>
        </li>
        {p.einfluesse.map((e) => (
          <li key={e.name} className={e.punkte >= 0 ? "plus" : "minus"}>
            <span>{e.name}</span>
            <strong>{vz(e.punkte)}</strong>
          </li>
        ))}
        <li className={`ergebnis ${ton}`}>
          <span>{t("nacht_n2.prognose.ergebnis")}</span>
          <strong>{nf(p.erwartet, 1)} %</strong>
        </li>
      </ol>
      {p.quelle === "institut" && (
        <p className="wa-rohdaten">
          {bestellt && roh ? t("medien.rohdaten.bestellt", { tage: Math.max(0, roh.bereitTag - world.day) }) : t("nacht_n2.prognose.rohdaten", { kapital: ROHDATEN.kapital, tage: ROHDATEN.wartetage })}{" "}
          {!bestellt && (
            <button
              type="button"
              className="pd-btn quiet klein"
              onClick={() => {
                const r = rohdatenKaufen(world);
                setMeldung(r.text);
                if (r.ok) onAenderung?.();
              }}
            >
              {t("medien.ui.rohdaten_kaufen")}
            </button>
          )}
          {meldung && <em> {meldung}</em>}
        </p>
      )}
      </div>
      {a.wochen > 0 && a.summe < 0 && (
        <p className="wa-vorwarnung">
          <b>{t("nacht_n2.vorwarnung.kopf")}</b>{" "}
          {a.thema
            ? t("nacht_n2.vorwarnung.text", { thema: a.thema, n: a.provinzen, orte: a.orte.join(", "), anteil: prozent(a.anteil, 0), summe: vz(a.summe) })
            : t("nacht_n2.vorwarnung.ohne", { summe: vz(a.summe) })}{" "}
          {t(world.spiel?.wahlkampf ? "nacht_n2.vorwarnung.laeuft" : "nacht_n2.vorwarnung.antwort")}
          {themaNode && onGehe && (
            <button type="button" className="pd-btn quiet klein" onClick={() => onGehe({ art: "politik", theme: themaNode.theme })}>
              {t("nacht_n2.vorwarnung.knopf", { thema: a.thema ?? "" })}
            </button>
          )}
        </p>
      )}
    </div>
  );
}

function Barometer({ world, onGehe, onAenderung }: { world: World; onGehe?: (z: Ziel) => void; onAenderung?: () => void }) {
  const bilanz = zustimmungsBilanz(world);
  const wahrVerlauf = zustimmungsVerlauf(world);
  const marken = entscheidungsMarken(world);
  const groesster = Math.max(1, ...bilanz.posten.map((p) => Math.abs(p.delta)));
  // Der Spieler sieht den Strom der Institute (Haus-Effekt, Angstklima, Rauschen); nur wer Rohdaten gekauft hat, sieht die Wahrheit (sim/medien.ts)
  const zeig = angezeigteZustimmung(world);
  const roh = zeig.quelle === "rohdaten";
  const institute = institutsReihe(world);
  const verlauf = roh ? wahrVerlauf : { monate: institute.map((x) => x.monat), werte: institute.map((x) => x.wert) };
  return (
    <section className="wa-barometer">
      <Prognose world={world} {...(onGehe ? { onGehe } : {})} {...(onAenderung ? { onAenderung } : {})} />
      <div className="wa-baro-linie">
        {verlauf.werte.length >= 2 ? (
          <Sparkline monate={verlauf.monate} werte={verlauf.werte} marken={marken} {...(roh ? { ziel: bilanz.tendenz } : {})} hoehe={84} beschriftung={roh ? t("medien.barometer.verlauf_rohdaten") : t("medien.barometer.verlauf")} einheit=" %" />
        ) : (
          <p className="wa-baro-leer">{verlauf.werte.length === 1 ? t("nacht_n2.barometer.eine_umfrage") : t("medien.barometer.leer")}</p>
        )}
        {zeig.verbot && !roh && <p className="wa-baro-leer">{t("medien.barometer.verbot")}</p>}
      </div>
      <details className="wa-bilanz">
        <summary>{t("ui.Waehler.95c4f24")}</summary>
        <ul>
          {bilanz.posten.map((p) => (
            <li key={p.name}>
              <div className="wa-bilanz-zeile">
                <span>{p.name}</span>
                <span className="wa-bilanz-balken" aria-hidden>
                  <i className={p.delta >= 0 ? "plus" : "minus"} style={{ width: `${(Math.abs(p.delta) / groesster) * 50}%`, [p.delta >= 0 ? "left" : "right"]: "50%" }} />
                </span>
                <strong className={p.delta >= 0 ? "gut" : "schlecht"}>{vz(p.delta)}</strong>
              </div>
              <em>{p.text}</em>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function KoalitionsBalken({ k, waehle, aktiv, world, onMassnahme }: { k: ReturnType<typeof koalition>; waehle: (id: string) => void; aktiv: string | null; world: World; onMassnahme?: (id: string, richtung: 1 | -1) => void }) {
  const spiel = world.spiel!;
  const signatur = `${world.date.slice(0, 7)}|${Math.floor(spiel.kapital)}|${Object.keys(world.net.targets).length}|${spiel.gesetze.length}`;
  const schritte = useMemo(() => schritteFuerZustimmung(world, 3), [signatur]); // eslint-disable-line react-hooks/exhaustive-deps
  const wanderung = useMemo(() => abwanderung(world), [signatur]); // eslint-disable-line react-hooks/exhaustive-deps
  const anzahl = (r: GruppeKurz["rolle"]) => {
    const n = k.gruppen.filter((g) => g.rolle === r).length;
    return t("wa.gruppen", { n });
  };
  const gruppe = (g: GruppeKurz | null, was: string, satz: (g: GruppeKurz) => string) =>
    g ? (
      <li>
        <b>{was}</b> {satz(g)}
        <button type="button" className="pd-btn quiet klein" onClick={() => waehle(g.id)}>
          {t("ui.Waehler.97d7cee")}
        </button>
      </li>
    ) : null;
  return (
    <section className="wa-koalition" aria-label={t("ui.Waehler.64eb6ca")}>
      <h3>{t("ui.Waehler.8ac7f95")}</h3>
      <Kreisfeld gruppen={k.gruppen} aktiv={aktiv} waehle={waehle} />
      <ul className="wa-legende">
        <li className="rolle-traeger">
          <b>{prozent(k.traeger)}</b> {t("wa.legende.traeger")} <em>({anzahl("traeger")})</em>
        </li>
        <li className="rolle-schwankend">
          <b>{prozent(k.schwankend)}</b> {t("wa.legende.schwankend")} <em>({anzahl("schwankend")})</em>
        </li>
        <li className="rolle-gegner">
          <b>{prozent(k.gegner)}</b> {t("wa.legende.gegner")} <em>({anzahl("gegner")})</em>
        </li>
      </ul>
      <ul className="wa-hinweise">
        {gruppe(k.gewinnbar, t("wa.gewinnbar.kopf"), (g) => t("wa.gewinnbar.satz", { name: g.name, p: nf(g.potenzial, 1) }))}
        {gruppe(k.gefaehrdet, t("wa.gefaehrdet.kopf"), (g) => t("wa.gefaehrdet.satz", { name: g.name, ziel: nf(g.ziel, 0), jetzt: nf(g.laune, 0) }))}
      </ul>
      {wanderung.anteil >= 0.03 && wanderung.ziele.length > 0 && (
        <details className="wa-wanderung wa-zu">
          <summary>
            {t("wa.wanderung.kopf")} <span className="pd-chip">{t("wa.wanderung.chip", { p: prozent(wanderung.anteil) })}</span>
          </summary>
          <p className="wa-unter">
            {t("wa.wanderung.text", { p: prozent(wanderung.anteil) })}
          </p>
          <ul className="wa-ziele">
            {wanderung.ziele.map((z) => (
              <li key={z.partei}>
                <div className="wa-ziel-kopf">
                  <strong>{z.name}</strong>
                  {z.imLager && <em>{t("wa.wanderung.imLager")}</em>}
                  <span>{t("wa.wanderung.anteil", { p: prozent(z.anteil) })}</span>
                </div>
                <span className="wa-ziel-balken" aria-hidden>
                  <i style={{ width: `${Math.round(z.anteil * 100)}%` }} />
                </span>
                {z.herkunft.length > 0 && <em className="wa-ziel-passt">{t("wa.wanderung.herkunft", { liste: z.herkunft.join(", ") })}</em>}
              </li>
            ))}
          </ul>
        </details>
      )}
      {schritte.length > 0 && (
        <details className="wa-schritte wa-zu">
          <summary>{t("ui.Waehler.35c9e56")}</summary>
          <p className="wa-unter">{t("nacht_n2.hilfe.erklaerung")}</p>
          <ul className="wa-hilfen">
            {schritte.map((h) => (
              <HilfeKarte key={`${h.massnahme}${h.richtung}`} h={h} world={world} ziel={null} {...(onMassnahme ? { onMassnahme } : {})} />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

export function Waehler({ world, onMassnahme, onDossier, onGehe, onAenderung }: { world: World; onMassnahme?: (id: string, richtung: 1 | -1) => void; onDossier?: (d: DossierZiel) => void; onGehe?: (z: Ziel) => void; onAenderung?: () => void }) {
  const spiel = world.spiel;
  const k = useMemo(() => (spiel ? koalition(world) : null), [spiel ? world.date.slice(0, 7) : "", spiel?.gesetze.length, spiel ? Object.keys(world.net.targets).length : 0]); // eslint-disable-line react-hooks/exhaustive-deps
  const [gewaehlt, setGewaehlt] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const erster = useRef(true);
  const standard = k?.gefaehrdet?.id ?? k?.gewinnbar?.id ?? k?.gruppen[0]?.id ?? null;
  const aktuell = gewaehlt ?? standard;
  useEffect(() => {
    // Auf kleinen Bildschirmen liegt die Ansicht unter der Liste: nach der Wahl dorthin springen
    if (erster.current) {
      erster.current = false;
      return;
    }
    if (gewaehlt && window.matchMedia("(max-width: 900px)").matches) detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [gewaehlt]);
  if (!spiel || !k) return <p>{t("ui.Waehler.847ba01")}</p>;
  return (
    <div className="wa-root">
      <Barometer world={world} {...(onGehe ? { onGehe } : {})} {...(onAenderung ? { onAenderung } : {})} />
      <div className="wa-haupt wa-feld-haupt">
        <div className="wa-liste">
          <KoalitionsBalken k={k} waehle={setGewaehlt} aktiv={aktuell} world={world} {...(onMassnahme ? { onMassnahme } : {})} />
        </div>
        <div className="wa-rechts" ref={detailRef}>
          {aktuell && <GruppenDetail key={aktuell} world={world} id={aktuell} {...(onMassnahme ? { onMassnahme } : {})} {...(onDossier ? { onDossier } : {})} />}
        </div>
      </div>
    </div>
  );
}

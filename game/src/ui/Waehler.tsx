// Die Wählerkoalition, wie in Democracy 4: Wer trägt Sie, wer schwankt, wer ist verloren, warum, wohin würden sie wechseln, und was würde helfen.
// Oben die eine Frage mit dem erwarteten Wahlergebnis (dieselbe Rechnung wie am Wahltag), darunter links die Gruppen als Kacheln, rechts die
// gewählte Gruppe im Einzelnen (Tagarbeit 6. November, T4: vorher 2,4 Bildschirme, eine Zeile je Gruppe und drei Kästen für drei Zahlen).

import { useEffect, useMemo, useRef, useState } from "react";
import type { World } from "../sim/types";
import { SCHWELLE_SCHWANKEND, SCHWELLE_TRAEGER, abwanderung, koalition, schritteFuerZustimmung, type GruppeKurz, type Koalition } from "../sim/waehler-detail";
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
import { gewichtWort, nf, prozent, vz } from "./waehler/format";
import "./politik/design.css";
import "./waehler/waehler.css";

/** Ein Strich auf der Skala von 30 bis 70 Prozent (außerhalb an den Rand gesetzt). */
const SKALA = { von: 30, bis: 70 };
const aufSkala = (x: number) => `${Math.max(0, Math.min(100, ((x - SKALA.von) / (SKALA.bis - SKALA.von)) * 100))}%`;

/**
 * Kopf der Ansicht: die Frage, das erwartete Ergebnis, wenn heute gewählt würde (E-1: dieselbe Rechnung wie am Wahltag, sim/wahl.ts,
 * ausgehend von der Zustimmung, die der Spieler sieht), die Treppe von der Zustimmung zum Ergebnis, der Umfrageverlauf und was im
 * Wahlkampf noch sicher kommt. Die Herkunft der Zustimmung seit dem Amtsantritt ist aufklappbar.
 */
function Leitkarte({ world, onGehe, onAenderung }: { world: World; onGehe?: (z: Ziel) => void; onAenderung?: () => void }) {
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

  // Verlauf: Der Spieler sieht den Strom der Institute (Haus-Effekt, Angstklima, Rauschen); nur wer Rohdaten gekauft hat, sieht die Wahrheit (sim/medien.ts)
  const bilanz = zustimmungsBilanz(world);
  const zeig = angezeigteZustimmung(world);
  const rohSicht = zeig.quelle === "rohdaten";
  const institute = institutsReihe(world);
  const verlauf = rohSicht ? zustimmungsVerlauf(world) : { monate: institute.map((x) => x.monat), werte: institute.map((x) => x.wert) };
  const marken = entscheidungsMarken(world);
  const groesster = Math.max(1, ...bilanz.posten.map((x) => Math.abs(x.delta)));

  return (
    <section className="wa-leit" aria-label={t("medien.barometer.kopf")}>
      <div className="wa-leit-links">
        <h3 className="wa-frage">{t("tag_t4.wa.frage")}</h3>
        <span className="wa-baro-kopf">{t("medien.barometer.kopf")}</span>
        {/* Die Zahl und rechts daneben der Umfrageverlauf, sobald es zwei Umfragen gibt */}
        <div className="wa-baro-reihe">
          <strong className={`wa-baro-spanne ${ton}`}>{t("nacht_n2.prognose.spanne", { von: nf(p.von, 0), bis: nf(p.bis, 0) })}</strong>
          {verlauf.werte.length >= 2 && (
            <div className="wa-baro-linie">
              <Sparkline monate={verlauf.monate} werte={verlauf.werte} marken={marken} {...(rohSicht ? { ziel: bilanz.tendenz } : {})} hoehe={44} beschriftung={rohSicht ? t("medien.barometer.verlauf_rohdaten") : t("medien.barometer.verlauf")} einheit=" %" />
            </div>
          )}
        </div>
        <span className="wa-baro-text">
          {t(p.letzte ? "tag_t4.wa.prognose.unter_nachfolger" : "tag_t4.wa.prognose.unter")} · <span className="wa-baro-wahl">{t("tag_t4.wa.prognose.wahl", { datum: formatDateDe(p.wahlDatum), monate })}</span>
        </span>
        {zeig.verbot && !rohSicht && <p className="wa-baro-leer">{t("medien.barometer.verbot")}</p>}
      </div>
      <div className="wa-leit-rechts">
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
      </div>
      {a.wochen > 0 && a.summe < 0 && (
        // ENTSCHEIDUNGEN Z: die Vorwarnung als Kennzahlen; der ganze Satz steht am Titel
        <div
          className="wa-vorwarnung"
          title={`${a.thema ? t("tag_t4.wa.vorwarnung", { thema: a.thema, n: a.provinzen, orte: a.orte.join(", "), anteil: prozent(a.anteil, 0), summe: vz(a.summe) }) : t("nacht_n2.vorwarnung.ohne", { summe: vz(a.summe) })} ${t(world.spiel?.wahlkampf ? "nacht_n2.vorwarnung.laeuft" : "tag_t4.wa.vorwarnung_antwort")}`}
        >
          <b>{t("nacht_n2.vorwarnung.kopf")}</b>
          <span className="wa-vw-chips">
            {a.thema && <span className="wa-vw-chip"><span>{t("welle_b2.wa.angriff")}</span><b>{a.thema}</b></span>}
            {a.thema && <span className="wa-vw-chip" title={a.orte.join(", ")}><span>{t("welle_b2.wa.akut")}</span><b>{t("welle_b2.wa.provinzen", { n: a.provinzen })} · {prozent(a.anteil, 0)}</b></span>}
            <span className="wa-vw-chip schlecht"><span>{t("welle_b2.wa.bisWahl")}</span><b>{vz(a.summe)}</b></span>
          </span>
          {themaNode && onGehe && (
            <button type="button" className="knopf-leise wa-vorwarnung-knopf" onClick={() => onGehe({ art: "politik", theme: themaNode.theme })}>
              {t("nacht_n2.vorwarnung.knopf", { thema: a.thema ?? "" })}
            </button>
          )}
        </div>
      )}
      <div className="wa-leit-fuss">
        <details className="wa-bilanz">
          <summary title={t("tag_t4.wa.prognose.erklaerung")}>{t("ui.Waehler.95c4f24")}</summary>
          <div className="wa-bilanz-inhalt">
            <ul>
              {bilanz.posten.map((x) => (
                <li key={x.name} title={x.text}>
                  <div className="wa-bilanz-zeile">
                    <span>{x.name}</span>
                    <span className="wa-bilanz-balken" aria-hidden>
                      <i className={x.delta >= 0 ? "plus" : "minus"} style={{ width: `${(Math.abs(x.delta) / groesster) * 50}%`, [x.delta >= 0 ? "left" : "right"]: "50%" }} />
                    </span>
                    <strong className={x.delta >= 0 ? "gut" : "schlecht"}>{vz(x.delta)}</strong>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </details>
        {/* Ohne Verlauf steht der Grund in der Fußzeile, damit die Lücke erklärt ist */}
        {verlauf.werte.length < 2 && <p className="wa-baro-leer">{verlauf.werte.length === 1 ? t("nacht_n2.barometer.eine_umfrage") : t("medien.barometer.leer")}</p>}
        {p.quelle === "institut" && (
          <p className="wa-rohdaten" title={t("nacht_n2.prognose.rohdaten", { kapital: ROHDATEN.kapital, tage: ROHDATEN.wartetage })}>
            {bestellt && roh ? t("medien.rohdaten.bestellt", { tage: Math.max(0, roh.bereitTag - world.day) }) : <span className="wa-vw-chip"><span>{t("welle_b2.wa.rohdaten")}</span><b>{t("welle_b2.wa.rohdatenPreis", { kapital: ROHDATEN.kapital, tage: ROHDATEN.wartetage })}</b></span>}{" "}
            {!bestellt && (
              <button
                type="button"
                className="knopf-leise"
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
    </section>
  );
}

/** Gemeinsame Stimmungsachse aller Kacheln, damit die Punkte vergleichbar sind (Spanne wie im früheren Kreisfeld). */
function achse(gruppen: GruppeKurz[]) {
  const werte = gruppen.flatMap((g) => [g.laune, g.ziel]);
  const von = Math.max(0, Math.min(30, Math.floor((Math.min(...werte) - 6) / 5) * 5));
  const bis = Math.min(100, Math.max(75, Math.ceil((Math.max(...werte) + 6) / 5) * 5));
  return (v: number) => ((Math.max(von, Math.min(bis, v)) - von) / (bis - von)) * 100;
}

/** Eine Wählergruppe als Kachel: Name, Stimmung, ein Punkt auf der Achse mit den Schwellen und ein Strich dahin, wohin sie strebt. */
function GruppenKachel({ g, x, gross, an, marke, waehle }: { g: GruppeKurz; x: (v: number) => number; gross: number; an: boolean; marke: "gewinnbar" | "gefaehrdet" | null; waehle: (id: string) => void }) {
  const laenge = x(g.ziel) - x(g.laune);
  const punkt = Math.round(10 + 8 * Math.sqrt(g.anteil / gross));
  return (
    <button
      type="button"
      className={`wa-kachel rolle-${g.rolle}${an ? " on" : ""}`}
      aria-pressed={an}
      onClick={() => waehle(g.id)}
      title={t("wa.feld.titel", { name: g.name, laune: nf(g.laune, 0), ziel: nf(g.ziel, 0), gewicht: gewichtWort(g.anteil) })}
    >
      {marke && <em className={`wa-kachel-marke ${marke}`}>{t(`tag_t4.wa.marke.${marke}`)}</em>}
      <span className="wa-kachel-name">{g.name}</span>
      <span className="wa-kachel-fuss">
        <span className="wa-kachel-spur" aria-hidden>
          <i className="zone gegner" style={{ left: 0, width: `${x(SCHWELLE_SCHWANKEND)}%` }} />
          <i className="zone schwankend" style={{ left: `${x(SCHWELLE_SCHWANKEND)}%`, width: `${x(SCHWELLE_TRAEGER) - x(SCHWELLE_SCHWANKEND)}%` }} />
          <i className="zone traeger" style={{ left: `${x(SCHWELLE_TRAEGER)}%`, width: `${100 - x(SCHWELLE_TRAEGER)}%` }} />
          {Math.abs(g.ziel - g.laune) >= 2 && <i className={`pfeil ${laenge > 0 ? "steigt" : "faellt"}`} style={{ left: `${laenge > 0 ? x(g.laune) : x(g.ziel)}%`, width: `${Math.abs(laenge)}%` }} />}
          <b className="punkt" style={{ left: `${x(g.laune)}%`, width: punkt, height: punkt }} />
        </span>
        <strong className="wa-kachel-zahl">{Math.round(g.laune)}</strong>
      </span>
    </button>
  );
}

function Gruppen({ k, waehle, aktiv, world, onMassnahme }: { k: Koalition; waehle: (id: string) => void; aktiv: string | null; world: World; onMassnahme?: (id: string, richtung: 1 | -1) => void }) {
  const spiel = world.spiel!;
  const signatur = `${world.date.slice(0, 7)}|${Math.floor(spiel.kapital)}|${Object.keys(world.net.targets).length}|${spiel.gesetze.length}`;
  const schritte = useMemo(() => schritteFuerZustimmung(world, 3), [signatur]); // eslint-disable-line react-hooks/exhaustive-deps
  const wanderung = useMemo(() => abwanderung(world), [signatur]); // eslint-disable-line react-hooks/exhaustive-deps
  const zeigeWanderung = wanderung.anteil >= 0.03 && wanderung.ziele.length > 0;
  const [offen, setOffen] = useState<"wanderung" | "schritte" | null>(null);
  const x = achse(k.gruppen);
  const gross = Math.max(...k.gruppen.map((g) => g.anteil), 0.01);
  // Wer trägt, steht vorn; wer bröckelt, hinten
  const reihe = [...k.gruppen].sort((a, b) => b.laune - a.laune || b.anteil - a.anteil);
  const anzahl = (r: GruppeKurz["rolle"]) => t("wa.gruppen", { n: k.gruppen.filter((g) => g.rolle === r).length });
  const marke = (g: GruppeKurz) => (k.gefaehrdet?.id === g.id ? "gefaehrdet" : k.gewinnbar?.id === g.id ? "gewinnbar" : null);
  const hinweis = (g: GruppeKurz | null, was: string, satz: (g: GruppeKurz) => string, klasse: string) =>
    g ? (
      <li className={klasse}>
        <button type="button" onClick={() => waehle(g.id)}>
          <b>{was}</b>
          <span>{satz(g)}</span>
        </button>
      </li>
    ) : null;
  return (
    <section className="wa-koalition" aria-label={t("ui.Waehler.64eb6ca")}>
      <header className="wa-koal-kopf">
        <h4>{t("ui.Waehler.8ac7f95")}</h4>
        <span className="wa-anteile-balken" role="img" aria-label={t("wa.balkenAria", { t: prozent(k.traeger), s: prozent(k.schwankend), g: prozent(k.gegner) })}>
          {(["traeger", "schwankend", "gegner"] as const).map((r) => (k[r] > 0 ? <i key={r} className={`rolle-${r}`} style={{ flexGrow: k[r] }} /> : null))}
        </span>
      </header>
      <ul className="wa-anteile">
        {(["traeger", "schwankend", "gegner"] as const).map((r) => (
          <li key={r} className={`rolle-${r}`} title={anzahl(r)}>
            <b>{prozent(k[r])}</b> {t(`wa.legende.${r}`)}
          </li>
        ))}
      </ul>
      <div className="wa-kacheln">
        {reihe.map((g) => (
          <GruppenKachel key={g.id} g={g} x={x} gross={gross} an={aktiv === g.id} marke={marke(g)} waehle={waehle} />
        ))}
      </div>
      <p className="wa-kachel-legende">{t("tag_t4.wa.kacheln.legende")}</p>
      <ul className="wa-hinweise">
        {hinweis(k.gewinnbar, t("wa.gewinnbar.kopf"), (g) => t("wa.gewinnbar.satz", { name: g.name, p: nf(g.potenzial, 1) }), "gewinnbar")}
        {hinweis(k.gefaehrdet, t("wa.gefaehrdet.kopf"), (g) => t("wa.gefaehrdet.satz", { name: g.name, ziel: nf(g.ziel, 0), jetzt: nf(g.laune, 0) }), "gefaehrdet")}
      </ul>
      {(zeigeWanderung || schritte.length > 0) && (
        <div className="wa-auf" role="group">
          {zeigeWanderung && (
            <button type="button" className={`wa-auf-knopf${offen === "wanderung" ? " on" : ""}`} aria-expanded={offen === "wanderung"} onClick={() => setOffen(offen === "wanderung" ? null : "wanderung")}>
              {t("wa.wanderung.kopf")} <span className="pd-chip" title={t("wa.wanderung.chip", { p: prozent(wanderung.anteil) })}>{prozent(wanderung.anteil)}</span>
            </button>
          )}
          {schritte.length > 0 && (
            <button type="button" className={`wa-auf-knopf${offen === "schritte" ? " on" : ""}`} aria-expanded={offen === "schritte"} onClick={() => setOffen(offen === "schritte" ? null : "schritte")}>
              {t("tag_t4.wa.schritte")}
            </button>
          )}
        </div>
      )}
      {offen === "wanderung" && zeigeWanderung && (
        <div className="wa-auf-inhalt">
          <ul className="wa-ziele" title={t("wa.wanderung.text", { p: prozent(wanderung.anteil) })}>
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
        </div>
      )}
      {offen === "schritte" && schritte.length > 0 && (
        <div className="wa-auf-inhalt">
          <h5 title={t("nacht_n2.hilfe.erklaerung")}>{t("ui.Waehler.35c9e56")}</h5>
          <ul className="wa-hilfen">
            {schritte.map((h) => (
              <HilfeKarte key={`${h.massnahme}${h.richtung}`} h={h} world={world} ziel={null} {...(onMassnahme ? { onMassnahme } : {})} />
            ))}
          </ul>
        </div>
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
    if (erster.current) {
      erster.current = false;
      return;
    }
    // Die Einzelheiten scrollen in ihrer eigenen Fläche: nach der Wahl oben beginnen; auf schmalen Bildschirmen liegt sie unter den Kacheln
    detailRef.current?.querySelector(".wa-rechts-rolle")?.scrollTo?.({ top: 0 });
    if (gewaehlt && window.matchMedia("(max-width: 1100px)").matches) detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [gewaehlt]);
  if (!spiel || !k) return <p>{t("ui.Waehler.847ba01")}</p>;
  return (
    <div className="wa-root">
      <Leitkarte world={world} {...(onGehe ? { onGehe } : {})} {...(onAenderung ? { onAenderung } : {})} />
      <div className="wa-haupt">
        <Gruppen k={k} waehle={setGewaehlt} aktiv={aktuell} world={world} {...(onMassnahme ? { onMassnahme } : {})} />
        <div className="wa-rechts" ref={detailRef}>
          <div className="wa-rechts-rolle">
            {aktuell && <GruppenDetail key={aktuell} world={world} id={aktuell} {...(onMassnahme ? { onMassnahme } : {})} {...(onDossier ? { onDossier } : {})} />}
          </div>
        </div>
      </div>
    </div>
  );
}

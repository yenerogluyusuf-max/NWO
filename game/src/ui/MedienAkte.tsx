// Der Reiter „Medien steuern“ der Medienakte. Aufbau nach dem Maßstab „eine Frage, ein Bild oben; Kacheln, Detail auf Klick“ (Tagarbeit T1,
// 6. November; vorher 3,5 Bildschirme):
//   - oben die Leitfrage mit dem Bild der Öffentlichkeit: Anteil am Publikum je Haus und Lager (dieselbe Rechnung wie `hausmedienAnteil`),
//     daneben die zwei Handgriffe ohne bestimmtes Haus: Rohdaten (woher die Zustimmungszahl stammt) und die Pressekonferenz;
//   - darunter die sieben Häuser als Kacheln und eine Kachel für die dauerhaften Hebel; ein Klick öffnet Zustand und Eingriffe mit Preis
//     und Vorschau der Folgen;
//   - unten der Verlauf der letzten Eingriffe.
// Der Pressefreiheitsrang steht im Aktenkopf (ui/akte/Bereiche.tsx) und hier nicht noch einmal. Reine Darstellung über sim/medien.ts;
// Aktionen melden die Änderung nach oben (`onAenderung`), damit die Bühne sichert und neu zeichnet.

import { useEffect, useRef, useState } from "react";
import type { World } from "../sim/types";
import { formatDateDe } from "../sim/dates";
import { NET } from "../sim/modell";
import { nationalAverage } from "../sim/netz";
import { blattDef } from "../sim/zeitung";
import { MEDIEN_CLUSTER, type MedienCluster } from "../data/medien";
import {
  ROHDATEN,
  angezeigteZustimmung,
  fuehreMedienAktionAus,
  lizenzVon,
  medienAktionen,
  medienVon,
  publikumsAnteile,
  reichweiteJetzt,
  rohdatenKaufen,
  sperrGrund,
  startSelbstzensur,
  type AktionId,
  type BilanzPosten,
  type MedienAktionSicht,
  type MedienLager,
} from "../sim/medien";
import { aktuelleLocale, t, zahl } from "../i18n";

/** Name eines Postens der Eingriffsbilanz: Netzknoten aus dem Politiknetz, sonst Pressefreiheitswert oder Selbstzensur des Hauses. */
const postenName = (id: string): string => (NET.index.has(id) ? NET.nodes[NET.index.get(id)!]!.name : t(`welle_e4.medien.posten.${id}`));
const vorzeichen = (x: number): string => `${x >= 0 ? "+" : "−"}${zahl(Math.abs(x))}`;
import { Knopf } from "./bausteine/Knopf";
import { useSprung } from "./akte/Uebersicht";

const nf = (x: number, d = 1) =>
  x.toLocaleString(aktuelleLocale(), {
    maximumFractionDigits: d,
    minimumFractionDigits: d,
  });
const pct = (n: number) => t("tag_t1.medien.prozent", { n });

const DRUCK: AktionId[] = ["eigentuemerdruck", "anzeigenstopp", "aufsichtsstrafe", "blackout", "lizenzentzug", "verfahren", "sperre_netz", "uebernahme"];
const ZUWENDUNG: AktionId[] = ["staatsanzeigen", "interview"];
const LAGER: MedienLager[] = ["regierung", "angepasst", "kritisch"];
const HEBEL = [
  {
    id: "m_medienaufsicht",
    kurz: "aufsicht",
    lang: "medien.ui.regler_aufsicht",
  },
  {
    id: "m_internetsperren",
    kurz: "internet",
    lang: "medien.ui.regler_internet",
  },
  {
    id: "m_staatsmedien",
    kurz: "staatsmedien",
    lang: "medien.ui.regler_staatsmedien",
  },
] as const;
const HEBEL_ID = "hebel";

/** Ganze Prozente, die zusammen genau 100 ergeben (größter Rest), damit Leiste, Lager und Kacheln dieselben Zahlen zeigen. */
function ganzeProzente(anteile: number[]): number[] {
  const roh = anteile.map((a) => a * 100);
  const ganz = roh.map(Math.floor);
  const summe = anteile.reduce((s, a) => s + a, 0);
  let rest = summe > 0 ? 100 - ganz.reduce((s, x) => s + x, 0) : 0;
  const folge = roh.map((r, i) => ({ i, r: r - Math.floor(r) })).sort((a, b) => b.r - a.r || a.i - b.i);
  for (const { i } of folge) {
    if (rest <= 0) break;
    ganz[i]! += 1;
    rest--;
  }
  return ganz;
}

function Balken({ wert, start, ueberschrift, text }: { wert: number; start?: number; ueberschrift: string; text: string }) {
  const w = Math.max(0, Math.min(100, wert));
  return (
    <span className="md-balken">
      <span className="md-balken-kopf">
        <span>{ueberschrift}</span>
        <strong>{text}</strong>
      </span>
      <i className="md-balken-spur" aria-hidden>
        <b style={{ width: `${w}%` }} />
        {start !== undefined && <u style={{ left: `${Math.max(0, Math.min(100, start))}%` }} />}
      </i>
    </span>
  );
}

export function MedienAkte({ world, onAenderung }: { world: World; onAenderung?: () => void }) {
  const [, setTick] = useState(0);
  // Offen ist ein Haus (Cluster-ID), die Kachel der Hebel oder nichts
  const [offen, setOffen] = useState<string | null>(null);
  const [meldung, setMeldung] = useState<{
    ok: boolean;
    text: string;
    ort: string;
  } | null>(null);
  const [neuerEintrag, setNeuerEintrag] = useState<object | null>(null);
  const gehe = useSprung();
  const detailRef = useRef<HTMLElement>(null);
  // Die Detailfläche rückt ins Bild, wenn sie unter dem Rand aufgeht (nur so weit wie nötig)
  useEffect(() => {
    if (offen)
      detailRef.current?.scrollIntoView?.({
        block: "nearest",
        behavior: "smooth",
      });
  }, [offen]);
  const spiel = world.spiel;
  if (!spiel) return <p className="md-hinweis">{t("medien.ui.ohne_spiel")}</p>;

  const m = medienVon(world);
  const wahr = angezeigteZustimmung(world);
  const aktionen = medienAktionen(world);
  const rohdaten = m.rohdaten;
  const rohdatenLaufen = !!rohdaten && world.day <= rohdaten.bisTag;
  const pk = aktionen.find((a) => a.aktion === "pressekonferenz");
  // Ohne Hook: Er stünde hinter dem frühen Ausstieg, die Reihenfolge der Hooks wäre dann nicht stabil (E-32); die Liste ist klein
  const verlauf = [...m.eingriffe].reverse().slice(0, 8);

  const anteile = publikumsAnteile(world);
  const prozent = ganzeProzente(anteile.map((a) => a.anteil));
  const anteilVon = (id: string) => prozent[anteile.findIndex((a) => a.id === id)] ?? 0;
  const lagerVon = (id: string): MedienLager => anteile.find((a) => a.id === id)?.lager ?? "angepasst";
  const lagerProzent = Object.fromEntries(LAGER.map((l) => [l, anteile.reduce((s, a, i) => s + (a.lager === l ? prozent[i]! : 0), 0)])) as Record<
    MedienLager,
    number
  >;

  // Ein gelungener Eingriff steht sofort als neuester Eintrag unter „Letzte Eingriffe“ (hervorgehoben); eine Meldung erscheint nur, wenn
  // sie mehr sagt: bei einem Fehler oder mit der Gegenreaktion (Leak), die nicht im Verlauf steht. Gekaufte Rohdaten zeigt ihr Feld selbst.
  const neu = (r: { ok: boolean; text: string }, ort: string, eingriff: boolean) => {
    // Die Handlung ist schon ausgeführt (das Ergebnis ist das Argument): Der letzte Eintrag ist ihrer
    const zuletzt = eingriff && r.ok ? medienVon(world).eingriffe.at(-1) : undefined;
    const rest = zuletzt && r.text.startsWith(zuletzt.text) ? r.text.slice(zuletzt.text.length).trim() : r.text;
    setMeldung(!r.ok || (eingriff && rest) ? { ok: r.ok, text: rest, ort } : null);
    setNeuerEintrag(zuletzt ?? null);
    setTick((x) => x + 1);
    if (r.ok) onAenderung?.();
  };
  // Als Funktionen statt eigener Komponenten: so bleiben aufgeklappte Folgen beim Neuzeichnen offen (kein Neuaufbau je Darstellung)
  const meldungZeile = (ort: string) =>
    meldung && meldung.ort === ort ? (
      <p className={`md-meldung${meldung.ok ? "" : " fehler"}`} role="status">
        {meldung.text}
      </p>
    ) : null;

  const fuer = (cluster: string, ids: AktionId[]): MedienAktionSicht[] =>
    aktionen.filter((a) => a.cluster === cluster && ids.includes(a.aktion) && a.anwendbar);
  const hebelWert = (id: string) => Math.round(nationalAverage(NET, world.net, id));
  const waehle = (id: string) => setOffen((o) => (o === id ? null : id));

  const lizenzText = (id: string) => {
    const z = m.cluster[id]!;
    const lizenz = lizenzVon(world, id);
    return lizenz === "gesperrt" && z.gesperrtBis !== undefined && z.gesperrtBis > world.day
      ? t("medien.lizenz.gesperrt_bis", { tage: z.gesperrtBis - world.day })
      : t(`medien.lizenz.${lizenz}`);
  };

  /** Eine Handlung: Name und Knopf, darunter gleich groß „bringt“ und „kostet“ mit den gebuchten Zahlen; Beschreibung und Folgen klappen auf. */
  const aktion = (a: MedienAktionSicht, ort: string, art?: "zuwendung") => {
    const rest = a.vorschau;
    const posten = (x: BilanzPosten) => `${postenName(x.id)} ${vorzeichen(x.wert)}`;
    const kostet = [t("medien.ui.kosten", { kapital: a.kapital, aufmerksamkeit: a.aufmerksamkeit }), ...a.bilanz.kostet.map(posten), ...(a.bilanz.markt ? [t("welle_e4.medien.maerkte")] : [])];
    return (
      <li key={a.aktion} className={`md-aktion${a.moeglich ? "" : " gesperrt"}`}>
        <div className="md-aktion-kopf">
          <div>
            {art && <span className={`md-art ${art}`}>{t(`medien.ui.gruppe_${art}`)}</span>}
            <strong>{t(`medien.aktion.${a.aktion}.name`)}</strong>
          </div>
          <Knopf disabled={!a.moeglich} title={a.grund ?? undefined} onClick={() => neu(fuehreMedienAktionAus(world, a.aktion, a.cluster), ort, true)}>
            {t("medien.ui.anordnen")}
          </Knopf>
        </div>
        <dl className="md-bilanz">
          <dt className="bringt">{t("welle_e4.medien.bringt")}</dt>
          <dd>{a.bilanz.bringt.length ? a.bilanz.bringt.map(posten).join(" · ") : t("welle_e4.medien.nichts")}</dd>
          <dt className="kostet">{t("welle_e4.medien.kostet")}</dt>
          <dd>{kostet.join(" · ")}</dd>
        </dl>
        {/* Höchstens eine Handlung zeigt ihre Einzelheiten zugleich (gleicher Name: der Browser schließt die übrigen) */}
        <details className="md-folgen" name="md-folgen">
          <summary>
            <span>{t("tag_t1.medien.einzelheiten")}</span>
          </summary>
          <p>{t(`medien.aktion.${a.aktion}.text`)}</p>
          {rest.length > 0 && (
            <ul className="md-vorschau">
              {rest.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          )}
        </details>
        {!a.moeglich && a.grund && <p className="md-grund">{a.grund}</p>}
      </li>
    );
  };

  const haus = (c: MedienCluster) => {
    const z = m.cluster[c.id]!;
    const druck = fuer(c.id, DRUCK);
    const zuwendung = fuer(c.id, ZUWENDUNG);
    const grund = sperrGrund(world, c.id);
    const reich = reichweiteJetzt(world, c.id);
    const name = blattDef(c.id).name;
    return (
      <section ref={detailRef} id="md-detail" className={`md-detail ${lagerVon(c.id)}`} aria-label={t("medien.ui.eingriffe_bei", { blatt: name })}>
        <header className="md-detail-kopf">
          <div>
            <h4>{name}</h4>
            <em>{c.name}</em>
            <span className="md-marken">
              <span className={`md-lizenz ${lizenzVon(world, c.id)}`}>{lizenzText(c.id)}</span>
              <span className="md-eigentuemer">{t(`medien.eigentuemer.${z.eigentuemer}`)}</span>
              {z.gekippt && <span className="md-tag">{t("medien.ui.gekippt")}</span>}
              {z.uebernommen && <span className="md-tag">{t("medien.ui.uebernommen")}</span>}
              {z.maertyrer >= 15 && <span className="md-tag">{t("medien.ui.maertyrer")}</span>}
              {grund && <span className="md-tag">{t(`medien.sperre.${grund}`)}</span>}
            </span>
          </div>
          <Knopf stufe="leise" onClick={() => setOffen(null)}>
            {t("tag_t1.medien.schliessen")}
          </Knopf>
        </header>
        <div className="md-zustand">
          <Balken ueberschrift={t("tag_t1.medien.reichweite_start")} wert={Math.min(100, reich * 100 * 0.8)} start={80} text={pct(Math.round(reich * 100))} />
          <Balken ueberschrift={t("medien.ui.selbstzensur")} wert={z.selbstzensur} start={startSelbstzensur(c)} text={`${Math.round(z.selbstzensur)}`} />
          <Balken ueberschrift={t("medien.ui.abhaengigkeit")} wert={z.abhaengigkeit} text={`${Math.round(z.abhaengigkeit)}`} />
        </div>
        {meldungZeile(c.id)}
        {/* Druck und Zuwendung in einem Raster; nur die Zuwendung trägt ihre Art über dem Namen (Druck ist der Regelfall, kein Wort viermal) */}
        <ul className="md-aktionen-liste">
          {druck.map((a) => aktion(a, c.id))}
          {zuwendung.map((a) => aktion(a, c.id, "zuwendung"))}
          {druck.length + zuwendung.length === 0 && <li className="md-hinweis">{t("medien.ui.keine_aktion")}</li>}
        </ul>
      </section>
    );
  };

  const hebel = () => (
    <section ref={detailRef} id="md-detail" className="md-detail md-hebel" aria-label={t("medien.ui.dauerkanaele")}>
      <header className="md-detail-kopf">
        <div>
          <h4>{t("medien.ui.dauerkanaele")}</h4>
          <p className="md-hinweis">{t("medien.ui.dauerkanaele_text")}</p>
        </div>
        <Knopf stufe="leise" onClick={() => setOffen(null)}>
          {t("tag_t1.medien.schliessen")}
        </Knopf>
      </header>
      <ul className="md-hebel-liste">
        {HEBEL.map((h) => (
          <li key={h.id}>
            <Balken ueberschrift={t(h.lang)} wert={hebelWert(h.id)} text={`${hebelWert(h.id)}`} />
            {gehe && (
              <Knopf stufe="leise" onClick={() => gehe({ art: "politik", massnahme: { id: h.id } })}>
                {t("tag_t1.medien.hebel_einstellen")} →
              </Knopf>
            )}
          </li>
        ))}
      </ul>
    </section>
  );

  const offenesHaus = offen && offen !== HEBEL_ID ? MEDIEN_CLUSTER.find((c) => c.id === offen) : undefined;

  return (
    <div className="md">
      {/* Leitfrage und Bild: Wem gehört die Öffentlichkeit? Daneben die Handgriffe ohne bestimmtes Haus */}
      {/* Ist ein Haus offen, rückt die Leitfrage auf eine Zeile mit dem Bild zusammen; die Handgriffe ohne Haus kehren beim Schließen zurück */}
      <section className={`md-leitfrage${offen ? " kompakt" : ""}`} aria-labelledby="md-leitfrage-titel">
        <div className="md-oeffentlichkeit">
          <h3 id="md-leitfrage-titel">{t("tag_t1.medien.leitfrage")}</h3>
          <div
            className="md-publikum"
            role="img"
            aria-label={t("tag_t1.medien.publikum_aria", {
              liste: LAGER.map((l) => `${t(`tag_t1.medien.lager.${l}`)} ${pct(lagerProzent[l])}`).join(", "),
            })}
          >
            {anteile.map((a, i) =>
              prozent[i]! > 0 ? (
                <i
                  key={a.id}
                  className={`md-segment ${a.lager}${offen === a.id ? " on" : ""}`}
                  style={{ flexGrow: a.anteil }}
                  title={t("tag_t1.medien.segment", {
                    name: blattDef(a.id).name,
                    n: prozent[i]!,
                  })}
                />
              ) : null,
            )}
          </div>
          <ul className="md-lager">
            {LAGER.map((l) => (
              <li key={l} className={l}>
                <i aria-hidden />
                <strong>{pct(lagerProzent[l])}</strong> {t(`tag_t1.medien.lager.${l}`)}
              </li>
            ))}
          </ul>
          {!offen && <p className="md-hinweis">{t("tag_t1.medien.publikum_text")}</p>}
        </div>

        {!offen && (
          <div className="md-griffe">
            <div className="md-griff" role="group" aria-label={t("tag_t1.medien.zahl_kopf")}>
              {/* Welle B3: Institut, Alter und Streuung der Zahl als Plaketten, darunter eine kurze Zeile (ENTSCHEIDUNGEN Z) */}
              {wahr.quelle === "institut" ? (
                <>
                  <ul className="rr-kosten md-zahl">
                    <li><b>{wahr.institut ?? ""}</b></li>
                    <li>{t("welle_b3.md.alter", { tage: wahr.alterTage })}</li>
                    <li>{t("welle_b3.md.streuung")} <b>±{nf(wahr.streuung)}</b></li>
                  </ul>
                  <p className="md-hinweis">{t("welle_b3.md.darin")}</p>
                </>
              ) : (
                <p>
                  {wahr.quelle === "rohdaten"
                    ? t("tag_t1.medien.zahl_rohdaten", {
                        bis: (wahr.rohdatenBis ?? world.day) - world.day,
                      })
                    : t("tag_t1.medien.zahl_start")}
                </p>
              )}
              {wahr.verbot && <p className="md-warn">{t("medien.ui.verbot")}</p>}
              {wahr.schublade && <p className="md-hinweis">{t("medien.ui.schublade", { institut: wahr.schublade })}</p>}
              <div className="md-griff-fuss">
                <span className="md-hinweis">
                  {rohdatenLaufen ? (
                    world.day >= rohdaten.bereitTag ? (
                      t("medien.rohdaten.laeuft", {
                        bis: rohdaten.bisTag - world.day,
                      })
                    ) : (
                      t("medien.rohdaten.bestellt", {
                        tage: rohdaten.bereitTag - world.day,
                      })
                    )
                  ) : (
                    <>
                      <span className="md-kosten">
                        {t("medien.ui.kosten", {
                          kapital: ROHDATEN.kapital,
                          aufmerksamkeit: ROHDATEN.aufmerksamkeit,
                        })}
                      </span>
                      {" · "}
                      {t("tag_t1.medien.rohdaten_kurz", {
                        wartetage: ROHDATEN.wartetage,
                        gueltig: ROHDATEN.gueltigTage,
                      })}
                    </>
                  )}
                </span>
                <Knopf disabled={rohdatenLaufen} onClick={() => neu(rohdatenKaufen(world), "band", false)}>
                  {t("medien.ui.rohdaten_kaufen")}
                </Knopf>
              </div>
            </div>
            {pk && (
              <div className="md-griff md-griff-pk" role="group" aria-label={t("tag_t1.medien.pk_kopf")}>
                <ul className="md-aktionen-liste einzeln">{aktion(pk, "band")}</ul>
              </div>
            )}
            {meldungZeile("band")}
          </div>
        )}
      </section>

      {/* Die Häuser als Kacheln; die achte Kachel trägt die dauerhaften Hebel. Mit offenen Einzelheiten werden die Kacheln zur schmalen Leiste
          darüber (Übersicht bleibt, nichts doppelt, die Ansicht bleibt unter anderthalb Bildschirmen). */}
      <section className="md-haeuser" aria-label={t("medien.ui.tableau")}>
        <h4>{t("medien.ui.tableau")}</h4>
        <ul className={`md-kacheln${offen ? " schmal" : ""}`}>
          {MEDIEN_CLUSTER.map((c) => {
            const z = m.cluster[c.id]!;
            const lizenz = lizenzVon(world, c.id);
            const alle = [...fuer(c.id, DRUCK), ...fuer(c.id, ZUWENDUNG)];
            const moeglich = alle.filter((a) => a.moeglich).length;
            const an = offen === c.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className={`md-kachel ${lagerVon(c.id)}${an ? " on" : ""}`}
                  aria-expanded={an}
                  aria-controls={an ? "md-detail" : undefined}
                  onClick={() => waehle(c.id)}
                >
                  <span className="md-kachel-kopf">
                    <strong>{blattDef(c.id).name}</strong>
                    <span
                      className="md-kachel-anteil"
                      title={t("tag_t1.medien.segment", {
                        name: blattDef(c.id).name,
                        n: anteilVon(c.id),
                      })}
                    >
                      {pct(anteilVon(c.id))}
                    </span>
                  </span>
                  <em>{c.name}</em>
                  <span className="md-marken">
                    <span className={`md-lizenz ${lizenz}`}>{lizenzText(c.id)}</span>
                    <span className="md-eigentuemer" title={t(`medien.eigentuemer.${z.eigentuemer}`)}>
                      {t(`tag_t1.medien.eig_kurz.${z.eigentuemer}`)}
                    </span>
                    {z.gekippt && <span className="md-tag">{t("medien.ui.gekippt")}</span>}
                    {z.uebernommen && <span className="md-tag">{t("medien.ui.uebernommen")}</span>}
                    {z.maertyrer >= 15 && <span className="md-tag">{t("medien.ui.maertyrer")}</span>}
                  </span>
                  {/* Strich = Stand zum Start. Ist ein Haus offen, schrumpfen die Kacheln zur Leiste (nur Name und Anteil), und die Einzelheiten tragen die Werte */}
                  <Balken
                    ueberschrift={t("medien.ui.selbstzensur")}
                    wert={z.selbstzensur}
                    start={startSelbstzensur(c)}
                    text={`${Math.round(z.selbstzensur)}`}
                  />
                  <span className="md-kachel-fuss">
                    <span>
                      {moeglich === alle.length
                        ? moeglich === 0
                          ? t("tag_t1.medien.eingriffe_keine")
                          : t("tag_t1.medien.eingriffe_moeglich", {
                              n: moeglich,
                            })
                        : moeglich === 0
                          ? t("tag_t1.medien.eingriffe_keine")
                          : t("tag_t1.medien.eingriffe_teils", {
                              m: moeglich,
                              n: alle.length,
                            })}
                    </span>
                    <i aria-hidden>{an ? "▴" : "▾"}</i>
                  </span>
                </button>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              className={`md-kachel md-hebel${offen === HEBEL_ID ? " on" : ""}`}
              aria-expanded={offen === HEBEL_ID}
              aria-controls={offen === HEBEL_ID ? "md-detail" : undefined}
              onClick={() => waehle(HEBEL_ID)}
            >
              <span className="md-kachel-kopf">
                <strong>{t("medien.ui.dauerkanaele")}</strong>
              </span>
              <span className="md-hebel-werte">
                {HEBEL.map((h) => (
                  <span key={h.id}>
                    {t(`tag_t1.medien.hebel_kurz.${h.kurz}`)} <b>{hebelWert(h.id)}</b>
                  </span>
                ))}
              </span>
              <span className="md-kachel-fuss">
                <span>{t("tag_t1.medien.hebel_fuss")}</span>
                <i aria-hidden>{offen === HEBEL_ID ? "▴" : "▾"}</i>
              </span>
            </button>
          </li>
        </ul>
      </section>

      {offenesHaus && haus(offenesHaus)}
      {offen === HEBEL_ID && hebel()}

      <section className="md-verlauf" aria-label={t("medien.ui.verlauf")}>
        <h5>{t("medien.ui.verlauf")}</h5>
        {verlauf.length === 0 ? (
          <p className="md-hinweis">{t("medien.ui.verlauf_leer")}</p>
        ) : (
          <>
            <ul>
              {verlauf.slice(0, 3).map((e, i) => (
                <VerlaufZeile key={`${e.tag}-${i}`} e={e} neu={e === neuerEintrag} />
              ))}
            </ul>
            {verlauf.length > 3 && (
              <details>
                <summary>{t("tag_t1.medien.verlauf_aelter", { n: verlauf.length - 3 })}</summary>
                <ul>
                  {verlauf.slice(3).map((e, i) => (
                    <VerlaufZeile key={`${e.tag}-${i}`} e={e} />
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function VerlaufZeile({ e, neu = false }: { e: { datum: string; text: string; rsf: number }; neu?: boolean }) {
  return (
    <li className={neu ? "neu" : undefined}>
      <span className="md-wann">{formatDateDe(e.datum)}</span>
      <span>{e.text}</span>
      <span className={`md-rsf-delta${e.rsf > 0 ? " minus" : e.rsf < 0 ? " plus" : ""}`}>
        {e.rsf === 0 ? "" : `${e.rsf > 0 ? "−" : "+"}${nf(Math.abs(e.rsf))}`}
      </span>
    </li>
  );
}

import { useState } from "react";
import type { World } from "../sim/types";
import { NET } from "../sim/world";
import { nationalAverage, startAverage } from "../sim/netz";
import type { Metric, Outlook } from "../sim/forecast";
import { REGELN, STIMMEN_PUFFER, bringeEin, provinzenText, pruefeVorhaben, stufeIn } from "../sim/handeln";
import type { Weg } from "../sim/spiel-typen";
import { berechneVorschau } from "./vorschau";
import { NetGraph } from "./NetGraph";
import { NetNavigator } from "./NetNavigator";
import { Erklaerung } from "./Erklaerung";
import { OrtWahl } from "./OrtWahl";
import { THEME_NAMES, type NodeSpec, type Theme } from "../data/politiknetz";
import { wann } from "./lernen";
import { skala, naechsteStufe } from "../data/skalen";
import { betroffene } from "../sim/wege";
import { PARTEI_NAME } from "../sim/fraktionen";
import { kabinettReaktion } from "../sim/figuren";
import { Handlungsfeld } from "./Handlungsfeld";

const KIND_LABEL: Record<NodeSpec["kind"], string> = {
  massnahme: "Maßnahme",
  groesse: "Größe",
  problem: "Problem",
  gruppe: "Wählergruppe",
};

const DIRECTION: Record<Outlook["direction"], string> = {
  hoeher: "eher höher",
  niedriger: "eher niedriger",
  unklar: "kaum Unterschied",
};

const nf = (x: number) => x.toLocaleString("de-DE", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
/** Kosten brauchen mehr Nachkommastellen: 0,03 % des BIP ist kein Rundungsfehler. */
const nfc = (x: number) => x.toLocaleString("de-DE", { maximumFractionDigits: 3, minimumFractionDigits: 2 });

export function NetView({
  world,
  onDecided,
  onShowOnMap,
  initialTheme,
  initialOrt,
  initialMassnahme,
  initialLevel,
  onEingriff,
  eingebettet,
}: {
  world: World;
  onDecided: () => void;
  onShowOnMap?: (id: string) => void;
  initialTheme?: Theme;
  initialOrt?: number[] | null;
  initialMassnahme?: string;
  initialLevel?: number;
  /** Öffnet den Erlass zu Haushalt und Zentralbank mit vorbereiteter Auswahl */
  onEingriff?: (option: string) => void;
  /** Im Bereich der Politik eingebettet: ohne Themenliste, dafür mit Weg zurück zum Bereich */
  eingebettet?: { zurueck: string; onZurueck: () => void };
}) {
  const [selectedId, setSelectedId] = useState<string>(initialMassnahme ?? (initialTheme === "infrastruktur" ? "m_autobahnen" : "m_mindestlohn"));
  const [level, setLevel] = useState<number | null>(initialLevel ?? null);
  const [ort, setOrt] = useState<number[] | null>(initialOrt ?? null);
  const [weg, setWeg] = useState<Weg>("gesetz");
  const [vorschau, setVorschau] = useState<{ stufe: number; ort: number[] | null; rows: { label: string; o: Outlook }[] } | "laedt" | null>(null);
  const [rueckmeldung, setRueckmeldung] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const [bestaetigt, setBestaetigt] = useState<string | null>(null);
  const [fein, setFein] = useState(false);

  const node = NET.nodes[NET.index.get(selectedId)!]!;
  const istMassnahme = node.kind === "massnahme";
  const now = istMassnahme ? stufeIn(world, node.id, ort) : nationalAverage(NET, world.net, node.id);
  const start = startAverage(NET, world.net, node.id);
  const causes = NET.edges.filter((e) => e.to === node.id);
  const effects = NET.edges.filter((e) => e.from === node.id);
  const nameOf = (id: string) => NET.nodes[NET.index.get(id)!]!.name;
  const sliderValue = level ?? Math.round(now);
  const pr = istMassnahme ? pruefeVorhaben(world, node.id, sliderValue, ort) : null;
  const spiel = world.spiel;
  const effektivWeg: Weg = pr && !pr.erlass.moeglich ? "gesetz" : weg;

  function select(id: string) {
    setSelectedId(id);
    if (!NET.nodes[NET.index.get(id)!]!.input && NET.nodes[NET.index.get(id)!]!.kind !== "massnahme") onShowOnMap?.(id);
    setLevel(null);
    setVorschau(null);
    setRueckmeldung(null);
  }

  /** Aus dem Handlungsfeld einer Größe: die Maßnahme mit sinnvoller Voreinstellung öffnen (20 Punkte in die gewünschte Richtung, an den akuten Orten). */
  function stelle(id: string, richtung: 1 | -1, o: number[] | null) {
    select(id);
    setOrt(o);
    const jetzt = stufeIn(world, id, o);
    setLevel(Math.max(0, Math.min(100, Math.round(jetzt) + 20 * richtung)));
  }

  async function starteVorschau() {
    const stufe = sliderValue;
    const metrics: { label: string; m: Metric }[] = [
      { label: "Inflation", m: "inflation" },
      { label: "Wachstum", m: "growth" },
      ...effects.slice(0, 4).map((e) => ({
        label: ort ? `${nameOf(e.to)} (${provinzenText(ort).replace(/^in /, "")})` : nameOf(e.to),
        m: (ort ? `netin:${e.to}:${ort.join(",")}` : `net:${e.to}`) as Metric,
      })),
    ];
    setVorschau("laedt");
    try {
      const outs = await berechneVorschau(world, { art: "massnahme", id: node.id, stufe, provinzen: ort }, metrics.map((x) => x.m), 12, 10);
      setVorschau({ stufe, ort, rows: metrics.map((x, k) => ({ label: x.label, o: outs[k]! })) });
    } catch {
      setVorschau(null);
    }
  }

  function einbringen() {
    if (aussichtslos && bestaetigt !== vorhabenKey) {
      setBestaetigt(vorhabenKey);
      return;
    }
    const r = bringeEin(world, node.id, sliderValue, ort, effektivWeg);
    setRueckmeldung(r);
    if (r.ok) {
      setVorschau(null);
      setLevel(null);
      onDecided();
    }
  }

  const aendert = !!pr && pr.ok;
  // Krisen-Blocker (MIL-3): eine Sperre zeigt Grund, Ausweg und Restbedingung statt des üblichen Regler-Hinweises
  const gesperrt = pr?.krisen.find((k) => k.art === "gesperrt") ?? null;
  // Aussichtslos: Die Stimmen fehlen, und Absprachen wären nach der Einbringung nicht mehr bezahlbar
  const luecke = pr?.gesetz.stimmen.luecke ?? 0;
  const kaufkosten = Math.ceil((luecke + STIMMEN_PUFFER) * REGELN.kaufKostenProStimme);
  const aussichtslos = !!spiel && !!pr && pr.ok && effektivWeg === "gesetz" && luecke > 0 && pr.kapital - pr.gesetz.pk < kaufkosten;
  const vorhabenKey = `${node.id}|${sliderValue}|${ort?.join(",") ?? "land"}|${effektivWeg}`;
  const kannBezahlen = !spiel || !pr ? true : effektivWeg === "erlass" ? pr.erlass.bezahlbar : pr.gesetz.bezahlbar;
  const aktuellePk = pr ? (effektivWeg === "erlass" ? pr.erlass.pk : pr.gesetz.pk) : 0;

  return (
    <div className={`netview${eingebettet ? " po-eingebettet" : ""}`}>
      {eingebettet ? (
        <div className="po-zurueck">
          <button className="link" onClick={eingebettet.onZurueck}>
            ← {eingebettet.zurueck}
          </button>
        </div>
      ) : (
        <NetNavigator world={world} selectedId={selectedId} onSelect={select} />
      )}

      <section className="paper net-detail">
        <div className="net-main">
          <p className="kind-label">
            {KIND_LABEL[node.kind]} · {THEME_NAMES[node.theme]}
          </p>
          <h2>{node.name}</h2>
          <p>{node.text}</p>
          <p className="valueline">
            {istMassnahme && ort ? `Stufe ${provinzenText(ort)}` : "Landesdurchschnitt"} <strong>{nf(now)}</strong>
            {!node.input && (
              <span className="subtitle">
                {" "}
                (Index 0–100; {istMassnahme && ort ? `im Land ${nf(nationalAverage(NET, world.net, node.id))}, ` : ""}beim Amtsantritt {nf(start)})
              </span>
            )}
            {node.kind === "problem" && (
              <span className="subtitle">
                {" "}
                · akut ab {node.threshold}
              </span>
            )}
          </p>

          <Erklaerung node={node} world={world} onSelect={select} />

          <NetGraph nodeId={node.id} onSelect={select} />
        </div>

        <aside className="net-side">
          {!istMassnahme && spiel && <Handlungsfeld world={world} node={node} onStelle={stelle} {...(onEingriff ? { onEingriff } : {})} />}
          {istMassnahme && pr && (
            <div className="policy schritte">
              <div className="schritt">
                <h4>
                  <span className="nr">1</span> Wo soll es gelten?
                </h4>
                <OrtWahl
                  world={world}
                  massnahmeId={node.id}
                  ort={ort}
                  onChange={(o) => {
                    setOrt(o);
                    setLevel(null);
                    setVorschau(null);
                    setRueckmeldung(null);
                  }}
                />
              </div>

              {(() => {
                const sk = skala(node.id, now);
                const regime = sk.art === "regime";
                const passt = (w: number, wert: number) => Math.abs(w - wert) <= (regime ? 7 : 0.5);
                const jetztStufe = naechsteStufe(sk, now);
                const neuStufe = naechsteStufe(sk, sliderValue);
                const wahl = (w: number) => {
                  setLevel(w);
                  setVorschau(null);
                  setRueckmeldung(null);
                };
                const zeigeKosten = Math.abs(node.cost ?? 0) >= 0.05;
                const einnahme = (node.cost ?? 0) < 0;
                const gruppen = aendert ? betroffene(node.id, sliderValue > now ? 1 : -1) : null;
                return (
                  <>
                    <div className="schritt">
                      <h4>
                        <span className="nr">2</span> {sk.frage}
                      </h4>
                      <div className="stufe-kopf">
                        <span>
                          jetzt <b>{regime ? (jetztStufe.genau ? jetztStufe.stufe.name : `etwa ${jetztStufe.stufe.name}`) : `Stufe ${Math.round(now)}`}</b>
                        </span>
                        <span aria-hidden>→</span>
                        <span className={aendert ? "neu" : ""}>
                          neu <b>{regime ? (neuStufe.genau ? neuStufe.stufe.name : `etwa ${neuStufe.stufe.name}`) : `Stufe ${sliderValue}`}</b>
                        </span>
                      </div>
                      <div className={`stufenwahl art-${sk.art}`} role="radiogroup" aria-label={`${sk.frage} ${node.name}`}>
                        {sk.stufen.map((st) => {
                          const auf = passt(st.w, sliderValue);
                          const heute = passt(st.w, now);
                          return (
                            <button key={st.w} role="radio" aria-checked={auf} className={`stufe-karte${auf ? " on" : ""}${heute ? " heute" : ""}`} onClick={() => wahl(st.w)}>
                              <strong>
                                {st.name}
                                {heute && <em className="heute-marke">heute</em>}
                              </strong>
                              {st.text && <span>{st.text}</span>}
                            </button>
                          );
                        })}
                      </div>
                      <button className="link fein-schalter" onClick={() => setFein((f) => !f)} aria-expanded={fein}>
                        {fein ? "Feineinstellung ausblenden" : "Genauer einstellen"}
                      </button>
                      {fein && (
                        <>
                          <div className="stufe-kopf klein">
                            <span>
                              Stufe jetzt <b>{Math.round(now)}</b>
                            </span>
                            <span aria-hidden>→</span>
                            <span>
                              neu <b>{sliderValue}</b>
                            </span>
                          </div>
                          <input type="range" min={0} max={100} value={sliderValue} aria-label={`Stufe von ${node.name}`} onChange={(ev) => wahl(Number(ev.target.value))} />
                          <div className="skala" aria-hidden>
                            <span>0 gibt es nicht</span>
                            <span>50</span>
                            <span>100 so viel wie möglich</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="schritt">
                      <h4>
                        <span className="nr">3</span> Was folgt daraus?
                      </h4>
                      {(() => {
                        const steigt = sliderValue >= now;
                        const folgen = NET.edges
                          .filter((e) => e.from === node.id)
                          .sort((x, y) => Math.abs(y.weight) - Math.abs(x.weight))
                          .slice(0, 5)
                          .map((e) => ({ id: e.to, name: nameOf(e.to), hoch: e.weight * (steigt ? 1 : -1) > 0, lag: e.lag }));
                        const kabinett = kabinettReaktion(world, node.id, steigt ? 1 : -1);
                        return (
                          <>
                            <ul className="folgen" aria-label="Folgen im Land">
                              {folgen.map((f) => (
                                <li key={f.id} className={f.hoch ? "hoch" : "runter"}>
                                  <span aria-hidden>{f.hoch ? "▲" : "▼"}</span> {f.name}
                                  <em>{wann(f.lag)}</em>
                                </li>
                              ))}
                            </ul>
                            {gruppen && (gruppen.gewinner.length > 0 || gruppen.verlierer.length > 0) && (
                              <p className="betroffene">
                                {gruppen.gewinner.length > 0 && (
                                  <span>
                                    <b>Profitieren:</b> {gruppen.gewinner.join(", ")}
                                  </span>
                                )}
                                {gruppen.verlierer.length > 0 && (
                                  <span>
                                    <b>Verlieren:</b> {gruppen.verlierer.join(", ")}
                                  </span>
                                )}
                              </p>
                            )}
                            {kabinett.length > 0 && (
                              <p className="betroffene">
                                {kabinett.map((k) => (
                                  <span key={k.wer}>
                                    <b>Im Kabinett:</b> {k.wer}: {k.text}
                                  </span>
                                ))}
                              </p>
                            )}
                            <p className="betroffene">
                              <span>
                                <b>Dauer:</b> etwa {pr.monate} Monat{pr.monate === 1 ? "" : "e"} bis zur vollen Wirkung
                                {spiel && pr.ueberlast > 1 ? `; die Verwaltung ist überlastet (${pr.offen} Vorhaben laufen), alles dauert ${Math.round((pr.ueberlast - 1) * 100)} % länger` : ""}
                              </span>
                            </p>
                          </>
                        );
                      })()}
                      {zeigeKosten ? (
                        <p className="haushaltszeile">
                          <b>Haushalt:</b> {einnahme ? "Einnahmen" : "Kosten"} heute {nfc(Math.abs(((node.cost ?? 0) * now) / 100))} % des BIP, bei dieser Wahl {nfc(Math.abs(((node.cost ?? 0) * sliderValue) / 100))} %
                          {Math.abs(pr.kostenBip) >= 0.0005 && (
                            <>
                              {" "}
                              (<span className={pr.kostenBip > 0 ? "minus" : "plus"}>{pr.kostenBip > 0 ? `${nfc(pr.kostenBip)} % Mehrkosten` : `${nfc(-pr.kostenBip)} % Mehreinnahmen`}</span> im Jahr)
                            </>
                          )}
                          .
                        </p>
                      ) : (
                        <p className="haushaltszeile">
                          <b>Haushalt:</b> kein eigener Posten. Der Preis dieser Maßnahme ist politisch, nicht finanziell.
                        </p>
                      )}
                    </div>
                  </>
                );
              })()}

              {spiel && (
                <div className="schritt">
                  <h4>
                    <span className="nr">4</span> Auf welchem Weg?
                  </h4>
                  <div className="weg-wahl" role="radiogroup" aria-label="Weg">
                    <button role="radio" aria-checked={effektivWeg === "gesetz"} className={`weg-karte${effektivWeg === "gesetz" ? " on" : ""}`} onClick={() => setWeg("gesetz")}>
                      <strong>Gesetz</strong>
                      <span className="wk-preis">{pr.gesetz.pk} Kapital</span>
                      <em>Abstimmung in {pr.gesetz.tage} Tagen. Erwartet {pr.gesetz.stimmen.erwartet} Ja-Stimmen, nötig 301.</em>
                      {pr.gesetz.stimmen.sachParteien.length > 0 && <span className="wk-urteil gut">Ihre Forderung erfüllt dieses Gesetz: {pr.gesetz.stimmen.sachParteien.map((k) => PARTEI_NAME[k] ?? k).join(", ")} stimmt mit.</span>}
                      <span className={`wk-urteil ${luecke === 0 ? "gut" : aussichtslos ? "schlecht" : "mittel"}`}>
                        {luecke === 0 ? "Die Mehrheit steht." : aussichtslos ? `Aussichtslos: es fehlen etwa ${luecke} Stimmen.` : `Es fehlen etwa ${luecke} Stimmen; Absprachen kosten etwa ${kaufkosten} Kapital.`}
                      </span>
                      <span className="wk-bar" aria-hidden>
                        <i style={{ width: `${Math.min(100, (pr.gesetz.stimmen.erwartet / 600) * 100)}%` }} />
                        <b style={{ left: `${(301 / 600) * 100}%` }} />
                      </span>
                    </button>
                    <button role="radio" aria-checked={effektivWeg === "erlass"} disabled={!pr.erlass.moeglich} className={`weg-karte${effektivWeg === "erlass" ? " on" : ""}`} onClick={() => setWeg("erlass")} title={pr.erlass.moeglich ? undefined : pr.erlass.grund}>
                      <strong>Erlass</strong>
                      <span className="wk-preis">{pr.erlass.pk} Kapital</span>
                      <em>{pr.erlass.moeglich ? "Sofort, ohne Parlament. Kostet etwas Vertrauen." : "Nur in Sicherheit und Außenbeziehungen möglich."}</em>
                    </button>
                  </div>
                  <div className="weg-kapital">
                    Sie haben <b>{Math.floor(pr.kapital)}</b> Kapital
                    {pr.ueberlast > 1 && <span className="warn"> · Verwaltung überlastet (+{Math.round((pr.ueberlast - 1) * 100)} %)</span>}
                  </div>
                  {pr.hinweise.map((h) => (
                    <p key={h} className="weg-warnung">
                      {h}
                    </p>
                  ))}
                </div>
              )}

              <div className="aktionen">
                <button className="ghost" onClick={starteVorschau} disabled={!aendert || vorschau === "laedt"}>
                  {vorschau === "laedt" ? "Rechnet …" : "Vorschau"}
                </button>
                <button className="primary" disabled={!aendert || !kannBezahlen} onClick={einbringen}>
                  {spiel
                    ? effektivWeg === "erlass"
                      ? `Per Erlass anordnen · ${aktuellePk} Kapital`
                      : aussichtslos && bestaetigt === vorhabenKey
                        ? `Trotzdem einbringen · ${aktuellePk} Kapital`
                        : `Als Gesetz einbringen · ${aktuellePk} Kapital`
                    : "Beschließen"}
                </button>
              </div>
              {!aendert && !gesperrt && <p className="hinweiszeile">Ziehen Sie den Regler auf eine andere Stufe, dann können Sie die Folgen ansehen und das Vorhaben einbringen.</p>}
              {gesperrt && (
                <p className="hinweiszeile warn">
                  <b>{gesperrt.krise.name}:</b> {gesperrt.krise.grund} {gesperrt.ausweg} <em>{gesperrt.krise.bedingung}</em>
                </p>
              )}
              {aussichtslos && (
                <p className="hinweiszeile warn">
                  {bestaetigt === vorhabenKey
                    ? `Wirklich? Es fehlen etwa ${luecke} Stimmen, das Gesetz wird voraussichtlich abgelehnt und die ${aktuellePk} Kapital sind verloren. Klicken Sie noch einmal, um es trotzdem einzubringen.`
                    : `Dieses Gesetz hätte im Parlament keine Mehrheit. Verhandeln Sie zuerst mit den Fraktionen (Parlament und Beschlüsse) oder wählen Sie den Erlass, falls er möglich ist.`}
                </p>
              )}
              {aendert && !kannBezahlen && <p className="hinweiszeile warn">Dafür fehlt Politisches Kapital. Wählen Sie eine kleinere Änderung oder einen kleineren Ort.</p>}
              {rueckmeldung && (
                <p className={`rueckmeldung ${rueckmeldung.ok ? "ok" : "nein"}`}>
                  {rueckmeldung.text}
                  {rueckmeldung.why && <em> {rueckmeldung.why}</em>}
                </p>
              )}
              {vorschau && vorschau !== "laedt" && vorschau.stufe === sliderValue && (
                <table className="preview">
                  <caption>In zwölf Monaten, verglichen mit „nichts ändern“ (Richtung und Bandbreite, keine genauen Zahlen)</caption>
                  <tbody>
                    {vorschau.rows.map(({ label, o }) => (
                      <tr key={label}>
                        <th>{label}</th>
                        <td className={`dir dir-${o.direction}`}>
                          <span aria-hidden>{o.direction === "hoeher" ? "▲" : o.direction === "niedriger" ? "▼" : "◆"}</span> {DIRECTION[o.direction]}
                        </td>
                        <td className="range">
                          etwa {Math.round(o.withAction.low)}–{Math.round(o.withAction.high)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          <div className="links">
            <div>
              <h3>Ursachen</h3>
              {node.input && <p className="subtitle">Kommt aus dem Wirtschaftsmodell.</p>}
              {causes.length === 0 && !node.input && <p className="subtitle">Wird direkt entschieden.</p>}
              <ul>
                {causes.map((e) => (
                  <li key={e.from}>
                    <button className="link" onClick={() => select(e.from)}>
                      {nameOf(e.from)}
                    </button>{" "}
                    <span className={e.weight > 0 ? "plus" : "minus"}>{e.weight > 0 ? "↑ erhöht" : "↓ senkt"}</span>
                    <span className="subtitle"> · {wann(e.lag)}</span>
                    <div className="why">{e.why}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Wirkungen</h3>
              <ul>
                {effects.map((e) => (
                  <li key={e.to}>
                    <button className="link" onClick={() => select(e.to)}>
                      {nameOf(e.to)}
                    </button>{" "}
                    <span className={e.weight > 0 ? "plus" : "minus"}>{e.weight > 0 ? "↑ erhöht" : "↓ senkt"}</span>
                    <span className="subtitle"> · {wann(e.lag)}</span>
                    <div className="why">{e.why}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

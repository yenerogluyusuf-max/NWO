import { useState } from "react";
import type { World } from "../sim/types";
import { NET } from "../sim/world";
import { nationalAverage, startAverage } from "../sim/netz";
import type { Metric, Outlook } from "../sim/forecast";
import { REGELN, STIMMEN_PUFFER, bringeEin, preisUebersicht, provinzenText, pruefeVorhaben, stufeIn } from "../sim/handeln";
import type { Weg } from "../sim/spiel-typen";
import { berechneVorschau } from "./vorschau";
import { restMonate, umsetzungsStand } from "../sim/umsetzung";
import { NetGraph } from "./NetGraph";
import { NetNavigator } from "./NetNavigator";
import { Erklaerung } from "./Erklaerung";
import { OrtWahl } from "./OrtWahl";
import { type NodeSpec, type Theme } from "../data/politiknetz";
import { themeName } from "./politik/bereiche";
import { wann } from "./lernen";
import { skala, naechsteStufe } from "../data/skalen";
import { betroffene } from "../sim/wege";
import { PARTEI_NAME } from "../sim/fraktionen";
import { kabinettReaktion } from "../sim/figuren";
import { Handlungsfeld } from "./Handlungsfeld";
import { zusammenspielFuer } from "../sim/synergien";
import { t } from "../i18n";

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
  // Vier-Preise-Regel: Einführen, Exit-Preis und Unterhalt stehen am Preisschild der Maßnahme
  const pu = istMassnahme && world.spiel ? preisUebersicht(world, node.id, ort) : null;
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
  // INN-2: Umsetzungsstand und beschlossenes Ziel für Balken und Ghost-Marker
  const uStand = istMassnahme ? umsetzungsStand(world.net, node.id) : 100;
  const uRest = istMassnahme ? restMonate(world.net, node.id) : null;
  const landesZiel = world.net.targets[node.id];
  const beschlossenesZiel = landesZiel !== undefined && Math.abs(landesZiel - now) > 1 ? landesZiel : undefined;
  // Krisen-Blocker (MIL-3): eine Sperre zeigt Grund, Ausweg und Restbedingung statt des üblichen Regler-Hinweises
  const gesperrt = pr?.krisen.find((k) => k.art === "gesperrt") ?? null;
  // Aussichtslos: Die Stimmen fehlen, und Absprachen wären nach der Einbringung nicht mehr bezahlbar
  const luecke = pr?.gesetz.stimmen.luecke ?? 0;
  const kaufkosten = Math.ceil((luecke + STIMMEN_PUFFER) * REGELN.kaufKostenProStimme);
  const aussichtslos = !!spiel && !!pr && pr.ok && effektivWeg === "gesetz" && luecke > 0 && pr.kapital - pr.gesetz.pk < kaufkosten;
  const vorhabenKey = `${node.id}|${sliderValue}|${ort?.join(",") ?? "land"}|${effektivWeg}`;
  const kannBezahlen = !spiel || !pr ? true : effektivWeg === "erlass" ? pr.erlass.bezahlbar : pr.gesetz.bezahlbar;
  const aktuellePk = pr ? (effektivWeg === "erlass" ? pr.erlass.pk : pr.gesetz.pk) : 0;

  // Folgen und Preis (Schritt „Was folgt daraus?“) stehen unter dem Bild links; die Entscheidung bleibt rechts
  const zeigeKosten = Math.abs(node.cost ?? 0) >= 0.05;
  const einnahme = (node.cost ?? 0) < 0;
  const gruppen = istMassnahme && aendert ? betroffene(node.id, sliderValue > now ? 1 : -1) : null;
  const folgenPanel =
    istMassnahme && pr
      ? (() => {
          const steigt = sliderValue >= now;
          const folgen = NET.edges
            .filter((e) => e.from === node.id)
            .sort((x, y) => Math.abs(y.weight) - Math.abs(x.weight))
            .slice(0, 5)
            .map((e) => ({ id: e.to, name: nameOf(e.to), hoch: e.weight * (steigt ? 1 : -1) > 0, lag: e.lag }));
          const kabinett = kabinettReaktion(world, node.id, steigt ? 1 : -1);
          return (
            <section className="pd-folgen" aria-label={t("ui.NetView.6019d7e")}>
              <h3>{t("ui2.ui.NetView.6019d7e")}</h3>
              <div className="pd-folgen-raster">
                <div className="pd-folgen-spalte">
                  <h4>{t("ui2.ui.NetView.5190db6")}</h4>
                  <ul className="pd-wirkungen" aria-label={t("ui2.ui.NetView.4f38063")}>
                    {folgen.map((f) => (
                      <li key={f.id} className={f.hoch ? "hoch" : "runter"}>
                        <span className="pd-richtung" aria-hidden>
                          {f.hoch ? "▲" : "▼"}
                        </span>
                        <span className="pd-w-name">{f.name}</span>
                        <em>{wann(f.lag)}</em>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pd-folgen-spalte">
                  <h4>{t("ui.NetView.bf40592")}</h4>
                  <dl className="pd-preisliste">
                    <div>
                      <dt>{t("ui2.ui.NetView.a92d0da")}</dt>
                      <dd>
                        {zeigeKosten ? (
                          <>
                            {einnahme ? t("ui2.ui.NetView.f8b133b") : t("ui2.ui.NetView.9bc1843")} {t("ui2.ui.NetView.f51b21f", { p0: nfc(Math.abs(((node.cost ?? 0) * now) / 100)), p1: nfc(Math.abs(((node.cost ?? 0) * sliderValue) / 100)) })}
                            {Math.abs(pr.kostenBip) >= 0.0005 && (
                              <>
                                {" "}
                                (<span className={pr.kostenBip > 0 ? "minus" : "plus"}>{pr.kostenBip > 0 ? t("ui2.ui.NetView.a8e5793", { p0: nfc(pr.kostenBip) }) : t("ui2.ui.NetView.cfd7d14", { p0: nfc(-pr.kostenBip) })}</span> {t("ui2.ui.NetView.3011d5d")}
                              </>
                            )}
                            .
                          </>
                        ) : (
                          <>{t("ui2.ui.NetView.2f58382")}</>
                        )}
                      </dd>
                    </div>
                    {spiel && pu && (
                      <div>
                        <dt>{t("ui2.ui.NetView.54c5730")}</dt>
                        <dd>
                          {t("ui2.ui.NetView.2a6f5fd", { p0: pu.einfuehren10, p1: pu.streichen10 })}
                          {pu.faktorStreichen > pu.faktorEinfuehren && <> {t("ui2.ui.NetView.c707cb1", { p0: (pu.faktorStreichen / pu.faktorEinfuehren).toLocaleString("de-DE", { maximumFractionDigits: 1 }) })}</>}
                          {pu.unterhaltMonat > 0 && <> {t("ui2.ui.NetView.03b3096", { p0: pu.unterhaltMonat.toLocaleString("de-DE") })}</>}.
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt>{t("ui2.ui.NetView.f6e5817")}</dt>
                      <dd>
                        {t("ui2.ui.NetView.83d0db3", { p0: pr.monate })}{pr.monate === 1 ? "" : "e"} {t("ui2.ui.NetView.2dd5af2")}
                        {spiel && pr.ueberlast > 1 ? t("ui2.ui.NetView.1efdfb9", { p0: pr.offen, p1: Math.round((pr.ueberlast - 1) * 100) }) : ""}
                      </dd>
                    </div>
                    {kabinett.map((k) => (
                      <div key={k.wer}>
                        <dt>Im Kabinett</dt>
                        <dd>
                          {k.wer}: {k.text}
                        </dd>
                      </div>
                    ))}
                    {gruppen && gruppen.gewinner.length > 0 && (
                      <div className="gut">
                        <dt>{t("ui2.ui.NetView.3b0e656")}</dt>
                        <dd>{gruppen.gewinner.join(", ")}</dd>
                      </div>
                    )}
                    {gruppen && gruppen.verlierer.length > 0 && (
                      <div className="schlecht">
                        <dt>{t("ui2.ui.NetView.d9e0863")}</dt>
                        <dd>{gruppen.verlierer.join(", ")}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </section>
          );
        })()
      : null;

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
            {KIND_LABEL[node.kind]} · {themeName(node.theme)}
          </p>
          <h2>{node.name}</h2>
          <p>{node.text}</p>
          <p className="valueline">
            {istMassnahme && ort ? t("ui2.ui.NetView.875014d", { p0: provinzenText(ort) }) : t("ui2.ui.NetView.f37ee0e")} <strong>{nf(now)}</strong>
            {!node.input && (
              <span className="pd-wertleiste" aria-hidden>
                <i style={{ width: `${Math.max(0, Math.min(100, now))}%` }} />
                <b style={{ left: `${Math.max(0, Math.min(100, start))}%` }} title={t("ui2.ui.NetView.130b865")} />
              </span>
            )}
            {!node.input && (
              <span className="subtitle">
                {" "}
                (Index 0–100; {istMassnahme && ort ? t("ui2.ui.NetView.ca61657", { p0: nf(nationalAverage(NET, world.net, node.id)) }) : ""}{t("ui2.ui.NetView.6355a74", { p0: nf(start) })}
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
          {folgenPanel}
        </div>

        <aside className="net-side">
          {!istMassnahme && spiel && <Handlungsfeld world={world} node={node} onStelle={stelle} {...(onEingriff ? { onEingriff } : {})} />}
          {istMassnahme && pr && (
            <div className="policy schritte">
              <div className="schritt">
                <h4>
                  <span className="nr">1</span> {t("ui2.ui.NetView.bc756c1")}
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
                return (
                  <>
                    <div className="schritt">
                      <h4>
                        <span className="nr">2</span> {sk.frage}
                      </h4>
                      <div className="stufe-kopf">
                        <span>
                          {t("ui2.ui.NetView.20a10d5")} <b>{regime ? (jetztStufe.genau ? jetztStufe.stufe.name : `etwa ${jetztStufe.stufe.name}`) : t("ui2.ui.NetView.875014d", { p0: Math.round(now) })}</b>
                        </span>
                        <span aria-hidden>→</span>
                        <span className={aendert ? "neu" : ""}>
                          neu <b>{regime ? (neuStufe.genau ? neuStufe.stufe.name : `etwa ${neuStufe.stufe.name}`) : t("ui2.ui.NetView.875014d", { p0: sliderValue })}</b>
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
                                {heute && <em className="heute-marke">{t("ui2.ui.NetView.cedb067")}</em>}
                              </strong>
                              {st.text && <span>{st.text}</span>}
                            </button>
                          );
                        })}
                      </div>
                      <button className="link fein-schalter" onClick={() => setFein((f) => !f)} aria-expanded={fein}>
                        {fein ? t("ui2.ui.NetView.da9d090") : t("ui2.ui.NetView.e6b85d6")}
                      </button>
                      {fein && (
                        <>
                          <div className="stufe-kopf klein">
                            <span>
                              {t("ui2.ui.NetView.eb9c6e4")} <b>{Math.round(now)}</b>
                            </span>
                            <span aria-hidden>→</span>
                            <span>
                              neu <b>{sliderValue}</b>
                            </span>
                          </div>
                          <input type="range" min={0} max={100} value={sliderValue} aria-label={t("ui2.ui.NetView.b0debca", { p0: node.name })} onChange={(ev) => wahl(Number(ev.target.value))} />
                          <div className="skala" aria-hidden>
                            <span>{t("ui.NetView.2ab5dc0")}</span>
                            <span>50</span>
                            <span>{t("ui.NetView.ab3b29f")}</span>
                          </div>
                        </>
                      )}
                      {(uStand < 100 || beschlossenesZiel !== undefined || aendert) && (
                        <div className="umsetzung">
                          {uStand < 100 && (
                            <p className="um-zeile">
                              <span className="um-balken" aria-hidden>
                                <i style={{ width: `${uStand}%` }} />
                              </span>
                              <span>
                                {t("ui2.ui.NetView.8fc0d7b", { p0: Math.round(uStand) })}{uRest !== null ? t("ui2.ui.NetView.1ffcbe4", { p0: uRest, p1: uRest === 1 ? "Monat" : "Monaten" }) : ""}
                              </span>
                            </p>
                          )}
                          <p className="um-zeile um-geist">
                            <span className="um-balken um-stufen" aria-hidden>
                              <i style={{ width: `${Math.max(0, Math.min(100, now))}%` }} />
                              {beschlossenesZiel !== undefined && <b className="um-ziel" style={{ left: `${beschlossenesZiel}%` }} />}
                              {aendert && <b className="um-absicht" style={{ left: `${sliderValue}%` }} />}
                            </span>
                            <span className="um-legende">
                              {t("ui2.ui.NetView.6b17514")}
                              {beschlossenesZiel !== undefined ? t("ui2.ui.NetView.b4cf04a", { p0: Math.round(beschlossenesZiel) }) : ""}
                              {aendert ? t("ui2.ui.NetView.ed0fc21", { p0: sliderValue }) : ""}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {spiel && (
                <div className="schritt">
                  <h4>
                    <span className="nr">3</span> {t("ui2.ui.NetView.ccce413")}
                  </h4>
                  <div className="weg-wahl" role="radiogroup" aria-label={t("ui2.ui.NetView.d5c00e9")}>
                    <button role="radio" aria-checked={effektivWeg === "gesetz"} className={`weg-karte${effektivWeg === "gesetz" ? " on" : ""}`} onClick={() => setWeg("gesetz")}>
                      <strong>{t("ui.NetView.17ae27b")}</strong>
                      <span className="wk-preis">{t("ui2.ui.NetView.87b52bd", { p0: pr.gesetz.pk })}</span>
                      <em>{t("ui2.ui.NetView.7ce9899", { p0: pr.gesetz.tage, p1: pr.gesetz.stimmen.erwartet })}</em>
                      {pr.gesetz.stimmen.sachParteien.length > 0 && <span className="wk-urteil gut">{t("ui2.ui.NetView.24b472a", { p0: pr.gesetz.stimmen.sachParteien.map((k) => PARTEI_NAME[k] ?? k).join(", ") })}</span>}
                      <span className={`wk-urteil ${luecke === 0 ? "gut" : aussichtslos ? "schlecht" : "mittel"}`}>
                        {luecke === 0 ? t("ui2.ui.NetView.8e0383d") : aussichtslos ? t("ui2.ui.NetView.54cc7ec", { p0: luecke }) : t("ui2.ui.NetView.fbe3cf5", { p0: luecke, p1: kaufkosten })}
                      </span>
                      <span className="wk-bar" aria-hidden>
                        <i style={{ width: `${Math.min(100, (pr.gesetz.stimmen.erwartet / 600) * 100)}%` }} />
                        <b style={{ left: `${(301 / 600) * 100}%` }} />
                      </span>
                    </button>
                    <button role="radio" aria-checked={effektivWeg === "erlass"} disabled={!pr.erlass.moeglich} className={`weg-karte${effektivWeg === "erlass" ? " on" : ""}`} onClick={() => setWeg("erlass")} title={pr.erlass.moeglich ? undefined : pr.erlass.grund}>
                      <strong>{t("ui2.ui.NetView.b4e3a33")}</strong>
                      <span className="wk-preis">{t("ui2.ui.NetView.87b52bd", { p0: pr.erlass.pk })}</span>
                      <em>{pr.erlass.moeglich ? t("ui2.ui.NetView.27460fb") : t("ui2.ui.NetView.c817b01")}</em>
                    </button>
                  </div>
                  <div className="weg-kapital">
                    {t("ui2.ui.NetView.ad667bf")} <b>{Math.floor(pr.kapital)}</b> {t("ui2.ui.NetView.28d438e")}
                    {pr.ueberlast > 1 && <span className="warn"> {t("ui2.ui.NetView.3126ba5", { p0: Math.round((pr.ueberlast - 1) * 100) })}</span>}
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
                  {vorschau === "laedt" ? t("ui2.ui.NetView.e883107") : t("ui2.ui.NetView.df96856")}
                </button>
                <button className="primary" disabled={!aendert || !kannBezahlen} onClick={einbringen}>
                  {spiel
                    ? effektivWeg === "erlass"
                      ? t("ui2.ui.NetView.53365d4", { p0: aktuellePk })
                      : aussichtslos && bestaetigt === vorhabenKey
                        ? t("ui2.ui.NetView.5ffb75c", { p0: aktuellePk })
                        : t("ui2.ui.NetView.acf9290", { p0: aktuellePk })
                    : t("ui2.ui.NetView.742f479")}
                </button>
              </div>
              {!aendert && !gesperrt && <p className="hinweiszeile">{t("ui.NetView.3d01091")}</p>}
              {gesperrt && (
                <p className="hinweiszeile warn">
                  <b>{gesperrt.krise.name}:</b> {gesperrt.krise.grund} {gesperrt.ausweg} <em>{gesperrt.krise.bedingung}</em>
                </p>
              )}
              {aussichtslos && (
                <p className="hinweiszeile warn">
                  {bestaetigt === vorhabenKey
                    ? t("ui2.ui.NetView.be7fdff", { p0: luecke, p1: aktuellePk })
                    : t("ui2.ui.NetView.dc3ce88")}
                </p>
              )}
              {aendert && !kannBezahlen && <p className="hinweiszeile warn">{t("ui.NetView.8e5d078")}</p>}
              {rueckmeldung && (
                <p className={`rueckmeldung ${rueckmeldung.ok ? "ok" : "nein"}`}>
                  {rueckmeldung.text}
                  {rueckmeldung.why && <em> {rueckmeldung.why}</em>}
                </p>
              )}
              {vorschau && vorschau !== "laedt" && vorschau.stufe === sliderValue && (() => {
                // INN-2: Solange die Umsetzung läuft, ist die Wirkung erst teilweise hergestellt —
                // die angezeigte Bandbreite wird deshalb breiter gezeichnet (Anzeigeregel, keine Messung).
                const weite = 1 + (100 - uStand) / 100;
                const band = (low: number, high: number) => {
                  const mitte = (low + high) / 2;
                  const halb = ((high - low) / 2) * weite;
                  return `etwa ${Math.round(mitte - halb)}–${Math.round(mitte + halb)}`;
                };
                return (
                  <table className="preview">
                    <caption>
                      {t("ui2.ui.NetView.94f7c0e")}
                      {uStand < 100 ? t("ui2.ui.NetView.cb032cf", { p0: Math.round(uStand) }) : ""}
                    </caption>
                    <tbody>
                      {vorschau.rows.map(({ label, o }) => (
                        <tr key={label}>
                          <th>{label}</th>
                          <td className={`dir dir-${o.direction}`}>
                            <span aria-hidden>{o.direction === "hoeher" ? "▲" : o.direction === "niedriger" ? "▼" : "◆"}</span> {DIRECTION[o.direction]}
                          </td>
                          <td className="range">{band(o.withAction.low, o.withAction.high)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          )}

          <div className="links">
            <div>
              <h3>{t("ui2.ui.NetView.7757ec0")}</h3>
              {node.input && <p className="subtitle">{t("ui.NetView.6b26667")}</p>}
              {causes.length === 0 && !node.input && <p className="subtitle">{t("ui2.ui.NetView.66525d3")}</p>}
              <ul>
                {causes.map((e) => (
                  <li key={e.from}>
                    <button className="link" onClick={() => select(e.from)}>
                      {nameOf(e.from)}
                    </button>{" "}
                    <span className={e.weight > 0 ? "plus" : "minus"}>{e.weight > 0 ? t("ui2.ui.NetView.4944e2c") : "↓ senkt"}</span>
                    <span className="subtitle"> · {wann(e.lag)}</span>
                    <div className="why">{e.why}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>{t("ui2.ui.NetView.1fac6b5")}</h3>
              <ul>
                {effects.map((e) => (
                  <li key={e.to}>
                    <button className="link" onClick={() => select(e.to)}>
                      {nameOf(e.to)}
                    </button>{" "}
                    <span className={e.weight > 0 ? "plus" : "minus"}>{e.weight > 0 ? t("ui2.ui.NetView.4944e2c") : "↓ senkt"}</span>
                    <span className="subtitle"> · {wann(e.lag)}</span>
                    <div className="why">{e.why}</div>
                  </li>
                ))}
              </ul>
              {node.kind === "massnahme" && zusammenspielFuer(node.id).length > 0 && (
                <>
                  <h3>{t("netz.ui.zusammenspiel")}</h3>
                  <ul>
                    {zusammenspielFuer(node.id).map((z) => (
                      <li key={z.id}>
                        {t("netz.ui.mit")}{" "}
                        <button className="link" onClick={() => select(z.partner)}>
                          {nameOf(z.partner)}
                        </button>
                        {": "}
                        <button className="link" onClick={() => select(z.ziel)}>
                          {nameOf(z.ziel)}
                        </button>{" "}
                        <span className={z.weight > 0 ? "plus" : "minus"}>{z.weight > 0 ? `↑ ${t("netz.ui.erhoeht")}` : `↓ ${t("netz.ui.senkt")}`}</span>
                        <span className="subtitle"> · {wann(z.lag)}</span>
                        <div className="why">{z.why}</div>
                        <div className="subtitle">{z.modus === "gegen" ? t("netz.ui.zusammenspiel_gegen") : t("netz.ui.zusammenspiel_gleich")}</div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

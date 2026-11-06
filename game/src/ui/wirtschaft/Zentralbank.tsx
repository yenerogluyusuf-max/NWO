// Die Zentralbank als Entscheidung: die nächste Zinssitzung mit den Wegen des Präsidenten (Nichts tun, Gespräch, Rede), die Führung der Bank,
// die Unabhängigkeit per Gesetz und die bisherigen Sitzungen. Jede Wahl zeigt vorher, was die Bank beschließen würde und was danach kommt.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { World } from "../../sim/types";
import type { Aktion, Metric, PrognoseReihe } from "../../sim/forecast";
import { ppkDecision, ppkSchrittweite, finanzierungsMehrbedarf } from "../../sim/economy";
import { figur, haltung as figurHaltung } from "../../sim/figuren";
import { glaubwuerdigkeitsKette, zinsKette, type Glied } from "../../sim/folgen";
import { REGELN, stimmenSicht } from "../../sim/handeln";
import { kannZahlen } from "../../sim/kapital";
import { formatDateDe, formatMonthDe } from "../../sim/dates";
import { KENNZAHLEN_NACH_ID, einheitName } from "../../sim/wirtschaft-kennzahlen";
import { alleMarken, startMonat, verlauf, zbZustand } from "../../sim/wirtschaft";
import { STUFEN, aendereStufe, druckOptionen, ernenneGouverneur, glaubwuerdigkeitWort, machDruck, naechsteSitzung, setzeVorgabe, stufenWechsel, type DruckOption } from "../../sim/zentralbank";
import { DEVISEN, devisenZustand, interveniere, interventionsVorschau, iwfAnfrageMoeglich, iwfKuendigen, iwfSicht } from "../../sim/devisen";
import { oeffne } from "../../sim/ereignisse";
import { Rng } from "../../sim/rng";
import type { GovernorStance } from "../../sim/types";
import { Diagramm } from "./Diagramm";
import { Folgen } from "./Folgen";
import { Bestaetigung } from "./Bestaetigung";
import { Wirkung } from "./Wirkung";
import { berechneReihen } from "./prognose";
import "./wirtschaft.css";

import { t } from "../../i18n";
import { zahl } from "../../i18n";
const nf = (x: number, d = 1): string => zahl(x, d);

const METRIK_IDS: { id: Metric; kennzahl: string }[] = [
  { id: "policyRate", kennzahl: "leitzins" },
  { id: "inflation", kennzahl: "inflation" },
  { id: "growth", kennzahl: "wachstum" },
  { id: "usdTry", kennzahl: "usd" },
  { id: "unemployment", kennzahl: "arbeitslosigkeit" },
];
const metriken = (): { id: Metric; kennzahl: string; label: string }[] => METRIK_IDS.map((m) => ({ ...m, label: t(`zb.metrik.${m.id}`) }));

const HALTUNG_IDS: GovernorStance[] = ["vorsichtig", "ausgewogen", "gefuegig"];
const haltungen = (): { id: GovernorStance; name: string; text: string; folge: string }[] =>
  HALTUNG_IDS.map((id) => ({ id, name: t(`zb.haltung.${id}.name`), text: t(`zb.haltung.${id}.text`), folge: t(`zb.haltung.${id}.folge`) }));

/** Wie stark ein Wechsel der Unabhängigkeit die Glaubwürdigkeit bewegt (siehe `wendeStufeAn`). */
const STUFEN_GLAUBWUERDIGKEIT: Record<string, number> = { "B>C": -0.18, "C>B": 0.06, "B>A": 0.08, "A>B": -0.06 };

const haltungName = (h: GovernorStance): string => t(`zb.haltung.${h}.klein`);

function aktionFuer(o: DruckOption | undefined): Aktion | null {
  if (!o || o.id === "keiner" || !o.richtung || !o.weg) return null;
  return { art: "zinsdruck", richtung: o.richtung, weg: o.weg };
}

type Teil = "sitzung" | "fuehrung" | "devisen" | "verlauf";
const TEILE: Teil[] = ["sitzung", "fuehrung", "devisen", "verlauf"];

/**
 * Das Bild oben (AP 11): eine Zinsskala mit Inflation, erwarteter Inflation, Leitzins heute und dem, was die Bank nach ihrer Regel
 * in der nächsten Sitzung beschließt. Die Fläche zwischen Erwartung und Leitzins ist der Realzins: grün, wenn Geld etwas kostet, rot, wenn nicht.
 */
function ZinsBild({ inflation, erwartet, zins, regel, zeile }: { inflation: number; erwartet: number; zins: number; regel: number; zeile?: ReactNode }) {
  const max = Math.max(10, Math.ceil(Math.max(inflation, erwartet, zins, regel) / 10) * 10 + 5);
  const x = (v: number) => 20 + (Math.max(0, v) / max) * 920;
  const real = zins - erwartet;
  const marken = [
    { id: "zins", v: zins, label: t("zb.bild.zins", { p: nf(zins) }), y: 4, cls: "wi-zb-m-zins" },
    { id: "inflation", v: inflation, label: t("zb.bild.inflation", { p: nf(inflation) }), y: 104, cls: "wi-zb-m-infl" },
    { id: "erwartet", v: erwartet, label: t("zb.bild.erwartet", { p: nf(erwartet) }), y: 126, cls: "wi-zb-m-erw" },
  ];
  const striche = Array.from({ length: Math.floor(max / 10) + 1 }, (_, i) => i * 10);
  return (
    <figure className="wi-zb-bild" aria-label={t("zb.bild.aria", { zins: nf(zins), erwartet: nf(erwartet), real: nf(real) })}>
      <svg viewBox="0 0 960 144" role="img">
        <rect x={20} y={44} width={920} height={26} rx={4} className="wi-zb-achse" />
        <rect x={Math.min(x(erwartet), x(zins))} y={44} width={Math.abs(x(zins) - x(erwartet))} height={26} className={real >= 0 ? "wi-zb-real gut" : "wi-zb-real schlecht"} />
        {striche.map((v) => (
          <g key={v}><line x1={x(v)} x2={x(v)} y1={70} y2={76} className="wi-zb-strich" /><text x={x(v)} y={100} textAnchor="middle" className="wi-zb-skala">{v} %</text></g>
        ))}
        {regel !== zins && <path d={`M${x(zins)},38 L${x(regel)},38`} className="wi-zb-pfeil" markerEnd="url(#wi-zb-spitze)" />}
        <defs><marker id="wi-zb-spitze" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" className="wi-zb-spitze" /></marker></defs>
        {marken.map((m) => (
          <g key={m.id} className={m.cls}>
            <line x1={x(m.v)} x2={x(m.v)} y1={m.y < 44 ? 36 : 44} y2={m.y < 44 ? 70 : m.y + 2} />
            <text x={x(m.v)} y={m.y + 14} textAnchor={x(m.v) > 800 ? "end" : x(m.v) < 140 ? "start" : "middle"}>{m.label}</text>
          </g>
        ))}
      </svg>
      {/* Der Beschluss der Regel steht als Leitfrage über dem Bild; hier nur, was das Bild selbst nicht zeigt */}
      <figcaption>
        <b className={real >= 0 ? "wi-gut" : "wi-schlecht"}>{t("zb.bild.real", { p: nf(real) })}</b>{" "}
        <span className="wi-zb-zeile">{zeile}</span>
      </figcaption>
    </figure>
  );
}

export function Zentralbank({ world, geaendert, abschnitt }: { world: World; geaendert: () => void; abschnitt?: "sitzung" | "gouverneur" | "stufe" | "devisen" | undefined }) {
  const z = zbZustand(world);
  const naechste = naechsteSitzung(world);
  const optionen = useMemo(() => druckOptionen(world), [world.day, world.spiel?.kapital, z.stufe, world.governor.stance]);
  const METRIKEN = metriken();
  const HALTUNGEN = haltungen();
  const [gewaehlt, setGewaehlt] = useState<DruckOption["id"]>("keiner");
  const [bestaetigt, setBestaetigt] = useState<string | null>(null);
  const [rueck, setRueck] = useState<{ ok: boolean; text: string; why?: string | undefined } | null>(null);
  const [metrik, setMetrik] = useState<Metric>("policyRate");
  const [reihen, setReihen] = useState<PrognoseReihe[] | null>(null);
  const [rechnet, setRechnet] = useState(false);
  const [vorgabe, setVorgabe] = useState<number | null>(null);
  const [offen, setOffen] = useState<number | null>(null);
  const [betrag, setBetrag] = useState(5);
  const [haltungOffen, setHaltungOffen] = useState<GovernorStance | null>(world.governor.stance);
  const [gesetzOffen, setGesetzOffen] = useState<string | null>(null);
  const [teil, setTeil] = useState<Teil>(abschnitt === "gouverneur" || abschnitt === "stufe" ? "fuehrung" : abschnitt === "devisen" ? "devisen" : "sitzung");

  const e = world.economy;
  const opt = optionen.find((o) => o.id === gewaehlt) ?? optionen[0]!;
  const regel = ppkDecision(e, world.governor.stance);
  const gouv = figur(world, "zentralbank");
  const spielerName = world.player?.name ?? "";
  const modusC = z.stufe === "C";
  const vorgabeWert = vorgabe ?? z.vorgabe ?? regel.newRate;
  const stand = Math.floor(world.day / 30);
  // Beim Ziehen des Reglers rechnet die Vorschau erst, wenn er zur Ruhe kommt
  const [vorgabeRuhig, setVorgabeRuhig] = useState(vorgabeWert);
  useEffect(() => {
    const t = setTimeout(() => setVorgabeRuhig(vorgabeWert), 450);
    return () => clearTimeout(t);
  }, [vorgabeWert]);

  // Aktion für die Prognose: Druck einer Wahl, oder in Stufe C die Vorgabe
  const aktion: Aktion | null = modusC ? { art: "zinsvorgabe", zins: vorgabeRuhig } : aktionFuer(opt);

  useEffect(() => {
    let aktiv = true;
    setRechnet(true);
    berechneReihen(world, aktion, METRIKEN.map((m) => m.id), 12, 8)
      .then((r) => {
        if (!aktiv) return;
        setReihen(r);
        setRechnet(false);
      })
      .catch(() => aktiv && setRechnet(false));
    return () => {
      aktiv = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gewaehlt, stand, modusC, vorgabeRuhig, z.stufe, world.governor.stance]);

  useEffect(() => {
    if (!abschnitt) return;
    setTeil(abschnitt === "gouverneur" || abschnitt === "stufe" ? "fuehrung" : abschnitt === "devisen" ? "devisen" : "sitzung");
    document.getElementById(`wi-zb-${abschnitt}`)?.scrollIntoView({ block: "start" });
  }, [abschnitt]);

  function fuehre(f: () => { ok: boolean; text: string; why?: string }) {
    const r = f();
    setRueck(r);
    setBestaetigt(null);
    setGewaehlt("keiner");
    setVorgabe(null);
    geaendert();
  }

  const delta = (modusC ? vorgabeWert : opt.neu) - e.policyRate;
  const kette: Glied[] = [...zinsKette(delta), ...(opt.abweichung !== 0 && !modusC ? glaubwuerdigkeitsKette(opt.abweichung < 0 ? -1 : 1) : [])];
  const r = reihen?.find((x) => x.metric === metrik);
  const mk = METRIKEN.find((m) => m.id === metrik)!;
  const k = KENNZAHLEN_NACH_ID[mk.kennzahl]!;
  const band = r ? { ohne: r.ohne, ...(r.mit.length ? { mit: r.mit, mitName: modusC ? t("zb.mitVorgabe") : t("zb.mit", { name: opt.label }) } : {}) } : undefined;
  const lager = stimmenSicht(world).lager;
  const wechsel = stufenWechsel(z.stufe);
  const restGouv = (z.gouverneurGeaendert ?? -1e9) + 120 - world.day;
  const restStufe = (z.stufeGeaendert ?? -1e9) + 180 - world.day;
  const eingriffe = alleMarken(world).filter((m) => m.art === "eingriff").reverse().slice(0, 6);
  // Die Leitfrage oben: Was beschließt die Bank am Tag der nächsten Sitzung (in Stufe C: Ihre Vorgabe)?
  const beschluss = modusC ? (z.vorgabe ?? regel.newRate) : regel.newRate;
  const zbFrage = !naechste
    ? t("ui.wirtschaft.Zentralbank.30c1276")
    : modusC
      ? t("t5.zb.frage.vorgabe", { datum: formatDateDe(naechste.datum), neu: beschluss })
      : t(beschluss > e.policyRate ? "t5.zb.frage.erhoeht" : beschluss < e.policyRate ? "t5.zb.frage.senkt" : "t5.zb.frage.haelt", { datum: formatDateDe(naechste.datum), alt: e.policyRate, neu: beschluss });

  // WIR-2: Devisen-Lage (Reserven, Intervention, IWF)
  const dv = devisenZustand(world);
  const netto = e.reservenNettoUsdMrd ?? 0;
  const brutto = e.reservenBruttoUsdMrd ?? 0;
  const lb = e.leistungsbilanzPctBip ?? 0;
  const nettoKnapp = netto < DEVISEN.warnungUnter;
  const iv = interventionsVorschau(world, betrag);
  const iwf = iwfSicht(world);
  const anfrage = iwfAnfrageMoeglich(world);
  const druckText = (e.reservenDruck ?? 0) > 0 ? t("zb.druck.zuschlag") : netto < DEVISEN.druckAus ? t("zb.druck.beobachtung") : t("zb.druck.ruhig");

  return (
    <div className="wi-zb">
      {rueck && (
        <p className={`rueckmeldung ${rueck.ok ? "ok" : "nein"} wi-rueck`} role="status">
          {rueck.text}
          {rueck.why && <em> {rueck.why}</em>}
        </p>
      )}

      {/* Tag T5: Oben steht die eine Frage der Ansicht, was die Bank in der nächsten Sitzung beschließt, mit dem Bild darunter.
          Datum und Regel stehen nur hier, nicht noch einmal im Teil „Nächste Zinssitzung“. */}
      <section className="wi-karte wi-bank">
        <div className="wi-bank-kopf">
          <div>
            <p className="kicker">
              {t("ui.wirtschaft.Zentralbank.440cbd3")}
              {naechste && <> · {t("zb.inTagen", { n: naechste.tage })}</>}
            </p>
            <h3 className="wi-zb-frage">{zbFrage}</h3>
            <p className="wi-zb-person">
              {gouv ? `${gouv.rolle} ${gouv.name}` : t("zb.gouverneurin")} · {t("zb.haltung")} <b>{haltungName(world.governor.stance)}</b>
              {gouv && (
                <>
                  {" "}
                  · {t("zb.verhaeltnis")} <b>{figurHaltung(gouv)}</b>
                </>
              )}
            </p>
          </div>
          <div className={`wi-stufe wi-stufe-${z.stufe}`}>
            <span>{t("n3.zb.stellung")}</span>
            <b>{STUFEN[z.stufe].name}</b>
          </div>
        </div>
        <ZinsBild inflation={e.inflation} erwartet={e.expectedInflation} zins={e.policyRate} regel={modusC ? (z.vorgabe ?? regel.newRate) : regel.newRate} zeile={<>{t("zb.bild.zeile", { glaub: glaubwuerdigkeitWort(e.credibility), risiko: Math.round(e.riskPremium) })} <span className="wi-zb-info" title={STUFEN[z.stufe].text}>ⓘ</span></>} />
        {finanzierungsMehrbedarf(e) >= 0.05 && <p className="wi-hinweis">{t("balance.fiskalstand", { wert: nf(finanzierungsMehrbedarf(e)) })}</p>}
      </section>

      <nav className="wi-zb-teile" aria-label={t("zb.teile")}>
        {TEILE.map((x) => (
          <button key={x} type="button" aria-pressed={teil === x} className={teil === x ? "on" : ""} onClick={() => setTeil(x)}>
            {t(`zb.teil.${x}`)}
          </button>
        ))}
      </nav>

      {/* Tag T5: Wege links als ruhige Liste, rechts die Folgen des gewählten Wegs (Detail auf Klick statt fünf hoher Karten untereinander) */}
      {teil === "sitzung" && <section className="wi-karte wi-zb-sitzung" id="wi-zb-sitzung">
        <div className="wi-zb-wahl">
          <div className="wi-zb-wege">
            <h4>{modusC ? t("t5.zb.vorgabeTitel") : t("ui.wirtschaft.Zentralbank.b761a72")}</h4>
            {!modusC && <p className="wi-hinweis">{regel.why} {t("zb.regel.lage")}</p>}
            {!modusC && ppkSchrittweite(e, world.governor.stance) > 5 && <p className="wi-hinweis wi-druck">{t("balance.zinsschritt", { wert: nf(ppkSchrittweite(e, world.governor.stance)) })}</p>}
            {z.druck && !modusC && (
              <p className="wi-hinweis wi-druck">
                {t("zb.druckLiegt", { was: z.druck.richtung < 0 ? "senkung" : "streng", wie: z.druck.weg === "rede" ? "rede" : "gespraech" })}
              </p>
            )}
            {modusC ? (
              <div className="wi-vorgabe">
                <p className="wi-hinweis">{t("zb.weisung", { regel: regel.newRate })}</p>
                <label htmlFor="wi-vorgabe">
                  {t("zb.vorgabeLabel")} <b>{t("zb.prozent", { p: vorgabeWert })}</b>
                </label>
                <input id="wi-vorgabe" type="range" min={0} max={60} step={0.5} value={vorgabeWert} onChange={(ev) => setVorgabe(Number(ev.target.value))} />
                <button className="wi-handlung" onClick={() => fuehre(() => setzeVorgabe(world, vorgabeWert))}>
                  {t("zb.festlegen", { p: vorgabeWert })} <span aria-hidden>→</span>
                </button>
              </div>
            ) : (
              <div className="wi-optionen" role="radiogroup" aria-label={t("ui.wirtschaft.Zentralbank.b761a72")}>
                {optionen.map((o) => (
                  <label key={o.id} className={`wi-option${gewaehlt === o.id ? " on" : ""}${!o.moeglich ? " aus" : ""}`} title={!o.moeglich ? o.grund : undefined}>
                    <input type="radio" name="wi-druck" checked={gewaehlt === o.id} disabled={!o.moeglich} onChange={() => setGewaehlt(o.id)} />
                    <span className="wi-option-kopf">
                      <b>{o.label}</b>
                      <span className={`wi-beschluss${o.abweichung < 0 ? " wi-schlecht" : o.abweichung > 0 ? " wi-neutral" : ""}`}>{t("zb.bank", { p: o.neu })}</span>
                    </span>
                    {!o.moeglich && o.grund && <span className="wi-grund">{o.grund}</span>}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="wi-vorschau wi-zb-folge" aria-live="polite">
            {!modusC && (
              <>
                <p className="kicker">{opt.label}</p>
                <p className="wi-option-text">{opt.text}</p>
                <p className="wi-kosten">{opt.kosten.join(" · ")}</p>
              </>
            )}
            <h4>{t("zb.danach")}</h4>
            <Folgen kurz glieder={kette} leer={delta === 0 ? t("zb.bliebe", { p: e.policyRate }) : undefined} />
            <Wirkung reihen={reihen} metriken={METRIKEN} rechnet={rechnet} />
            <details className="wi-zb-verlauf"><summary>{t("zb.verlaufZeigen")}</summary>
            <div className="wi-metriken" role="tablist" aria-label={t("ui.wirtschaft.Zentralbank.34b3ca6")}>
              {METRIKEN.map((m) => (
                <button key={m.id} role="tab" aria-selected={metrik === m.id} className={metrik === m.id ? "on" : ""} onClick={() => setMetrik(m.id)}>
                  {m.label}
                </button>
              ))}
            </div>
            <Diagramm punkte={verlauf(world, mk.kennzahl)} startMonat={startMonat(world)} jetztMonat={world.date.slice(0, 7)} band={band} linien={k.linien?.(world)} marken={alleMarken(world).filter((m) => m.art === "zins" || m.art === "eingriff")} stellen={k.stellen} einheit={einheitName(k.einheit)} name={k.name} rechnet={rechnet} />
            </details>

            {!modusC && opt.id !== "keiner" && (
              bestaetigt === "druck" ? (
                <Bestaetigung name={spielerName} titel={opt.label} knopf={opt.weg === "rede" ? t("zb.redeHalten") : t("zb.gespraechFuehren")} onJa={() => fuehre(() => machDruck(world, opt.richtung!, opt.weg!))} onNein={() => setBestaetigt(null)}>
                  <p>{opt.text}</p>
                  <p className="wi-hinweis">
                    {opt.abweichung !== 0 ? t("zb.beschliesst", { neu: opt.neu, regel: regel.newRate }) : t("zb.aendertNichts")} {t("zb.kosten", { l: opt.kosten })}
                  </p>
                </Bestaetigung>
              ) : (
                <button className="wi-handlung wi-haupt" disabled={!opt.moeglich} onClick={() => setBestaetigt("druck")}>
                  {opt.label} <span aria-hidden>→</span>
                </button>
              )
            )}
          </div>
        </div>
      </section>}
      {/* Tag T5: Führung und Gesetz nebeneinander in einer Karte. Je Weg eine Zeile; die gewählte Zeile klappt auf mit Text, Folge und Knopf. */}
      {teil === "fuehrung" && <section className="wi-karte wi-zb-fuehrung">
        <div className="wi-zb-wahl">
          <div id="wi-zb-gouverneur">
            <p className="kicker">{t("ui.wirtschaft.Zentralbank.4e897df")}</p>
            <h4>{t("ui.wirtschaft.Zentralbank.6517018")}</h4>
            <p className="wi-hinweis">{t("zb.neubesetzung", { n: 120 })}</p>
            <div className="wi-zb-liste">
              {HALTUNGEN.map((h) => {
                const jetzt = world.governor.stance === h.id;
                const grund = z.stufe === "A" ? t("zb.geschuetzt") : jetzt ? null : restGouv > 0 ? t("zb.wiederIn", { n: restGouv }) : null;
                const auf = haltungOffen === h.id;
                return (
                  <div key={h.id} className={`wi-zb-eintrag${auf ? " auf" : ""}${jetzt ? " jetzt" : ""}`}>
                    <button type="button" className="wi-zb-eintrag-kopf" aria-expanded={auf} onClick={() => setHaltungOffen(auf ? null : h.id)}>
                      <b>{h.name}</b>
                      {jetzt && <span className="wi-zb-marke">{t("zb.aktuell")}</span>}
                      <i aria-hidden>{auf ? "▾" : "▸"}</i>
                    </button>
                    {auf && (
                      <div className="wi-zb-eintrag-text">
                        <p>{h.text}</p>
                        <p className="wi-zb-folgesatz">{h.folge}</p>
                        {jetzt ? null : bestaetigt === `g-${h.id}` ? (
                          <Bestaetigung name={spielerName} titel={t("zb.neueFuehrung", { name: h.name })} onJa={() => fuehre(() => ernenneGouverneur(world, h.id))} onNein={() => setBestaetigt(null)}>
                            <p>{h.folge}</p>
                            <Folgen glieder={h.id === "gefuegig" ? glaubwuerdigkeitsKette(-0.18) : []} />
                          </Bestaetigung>
                        ) : (
                          <button className="wi-handlung" disabled={!!grund} onClick={() => setBestaetigt(`g-${h.id}`)}>
                            {t("zb.einsetzen")} <span aria-hidden>→</span>
                          </button>
                        )}
                        {grund && <span className="wi-grund">{grund}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div id="wi-zb-stufe">
            <p className="kicker">{t("zb.kicker.gesetz")}</p>
            <h4>{t("ui.wirtschaft.Zentralbank.bf2ad27")}</h4>
            <p className="wi-hinweis">{t("zb.gesetzText", { lager, mehrheit: REGELN.mehrheit })}</p>
            <div className="wi-zb-liste">
              {wechsel.map((w) => {
                const grund = restStufe > 0 ? t("zb.fruehestens", { n: restStufe }) : lager < REGELN.mehrheit ? t("zb.keineMehrheit") : !kannZahlen(world.spiel?.kapital ?? 0, w.pk) ? t("zb.keinKapital") : null;
                const auf = gesetzOffen === w.ziel;
                return (
                  <div key={w.ziel} className={`wi-zb-eintrag${auf ? " auf" : ""}`}>
                    <button type="button" className="wi-zb-eintrag-kopf" aria-expanded={auf} onClick={() => setGesetzOffen(auf ? null : w.ziel)}>
                      <b>
                        {w.text} <small>({STUFEN[w.ziel].name})</small>
                      </b>
                      <span className="wi-kosten">{t("zb.kostetPk", { pk: w.pk })}</span>
                      <i aria-hidden>{auf ? "▾" : "▸"}</i>
                    </button>
                    {auf && (
                      <div className="wi-zb-eintrag-text">
                        <p>{w.effekte}</p>
                        {bestaetigt === `s-${w.ziel}` ? (
                          <Bestaetigung name={spielerName} titel={w.text} knopf={t("zb.unterzeichnen")} onJa={() => fuehre(() => aendereStufe(world, w.ziel))} onNein={() => setBestaetigt(null)}>
                            <p>{w.effekte}</p>
                            <p className="wi-hinweis">{t("zb.kostetPk", { pk: w.pk })}.</p>
                            <Folgen glieder={glaubwuerdigkeitsKette(STUFEN_GLAUBWUERDIGKEIT[`${z.stufe}>${w.ziel}`] ?? 0)} />
                          </Bestaetigung>
                        ) : (
                          <button className="wi-handlung" disabled={!!grund} onClick={() => setBestaetigt(`s-${w.ziel}`)}>
                            {t("ui.wirtschaft.Zentralbank.e3fb7df")} <span aria-hidden>→</span>
                          </button>
                        )}
                        {grund && <span className="wi-grund">{grund}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>}
      {teil === "devisen" && <section className="wi-karte" id="wi-zb-devisen">
        <p className="kicker">{t("ui.wirtschaft.Zentralbank.2c78621")}</p>
        <h3>{t("ui.wirtschaft.Zentralbank.6d066c0")}</h3>
        <p className="wi-hinweis">
          {t("ui.wirtschaft.Zentralbank.e661ba3")}
        </p>
        <dl className="wi-zahlen">
          <div>
            <dt>{t("zb.netto")}</dt>
            <dd className={nettoKnapp ? "wi-schlecht" : ""}>{t("zb.mrdUsd", { x: netto })}</dd>
          </div>
          <div>
            <dt>{t("zb.brutto")}</dt>
            <dd>{t("zb.mrdUsd", { x: brutto })}</dd>
          </div>
          <div>
            <dt>{t("zb.leistungsbilanz")}</dt>
            <dd>{t("zb.bip", { p: lb })}</dd>
          </div>
          <div>
            <dt>{t("ui.wirtschaft.Zentralbank.1d70db1")}</dt>
            <dd>{druckText}</dd>
          </div>
        </dl>
        {nettoKnapp && (
          <p className="wi-hinweis wi-warnung">
            {t("zb.warnung", { w: DEVISEN.warnungUnter, d: DEVISEN.druckAn, k: DEVISEN.kriseAn })}
          </p>
        )}

        {/* Tag T5: Eingreifen und IWF nebeneinander */}
        <div className="wi-zb-wahl wi-zb-devisen-wege">
          <div>
            <h4>{t("zb.intervention")}</h4>
            <p className="wi-hinweis">
              {t("ui.wirtschaft.Zentralbank.7c859d4")}
            </p>
            <div className="wi-metriken" role="tablist" aria-label={t("ui.wirtschaft.Zentralbank.c4908f0")}>
              {[2, 5, 10].map((b) => (
                <button key={b} role="tab" aria-selected={betrag === b} className={betrag === b ? "on" : ""} onClick={() => setBetrag(b)}>
                  {t("zb.mrdUsdGanz", { x: b })}
                </button>
              ))}
            </div>
            <p className="wi-hinweis">
              {t("zb.wirkung", { g: iv.glaettung, s: iv.sofort, n: iv.nettoNachher })}
            </p>
            {iv.warnung && <p className="wi-grund">{iv.warnung}</p>}
            {bestaetigt === "intervention" ? (
              <Bestaetigung name={spielerName} titel={t("zb.verkaufen", { n: betrag })} knopf={t("zb.verkaufenKnopf")} onJa={() => fuehre(() => interveniere(world, betrag))} onNein={() => setBestaetigt(null)}>
                <p>{t("zb.verkauftText", { n: betrag, g: iv.glaettung })}{iv.warnung ? ` ${iv.warnung}` : ""}</p>
              </Bestaetigung>
            ) : (
              <button className="wi-handlung" disabled={!iv.ok} title={iv.grund ?? ""} onClick={() => setBestaetigt("intervention")}>
                {t("zb.verkaufen", { n: betrag })} <span aria-hidden>→</span>
              </button>
            )}
            {!iv.ok && iv.grund && <span className="wi-grund">{iv.grund}</span>}
          </div>
          <div className="wi-zb-iwf">
            <h4>{t("zb.iwf")}</h4>
            {iwf ? (
          <div className="wi-iwf">
                <p className="wi-hinweis">{iwf.zeile}</p>
                <div className="wi-dauer">
                  <span className={`wi-chip ${iwf.zinsOk ? "wi-gut" : "wi-schlecht"}`}>
                    {t("zb.iwfZins", { j: iwf.zinsJetzt, m: iwf.zinsMindest })}
                  </span>
                  <span className={`wi-chip ${iwf.defizitOk ? "wi-gut" : "wi-schlecht"}`}>
                    {t("zb.iwfDefizit", { j: iwf.defizitJetzt, m: iwf.defizitMax })}
                  </span>
                  <span className="wi-chip wi-neutral">{t("zb.iwfGeflossen", { x: iwf.mittelUsdMrd })}</span>
                </div>
                {bestaetigt === "iwf-kuendigen" ? (
                  <Bestaetigung name={spielerName} titel={t("zb.iwfBeendenTitel")} knopf={t("zb.kuendigen")} onJa={() => fuehre(() => iwfKuendigen(world))} onNein={() => setBestaetigt(null)}>
                    <p>{t("zb.iwfBruch", { n: DEVISEN.iwf.risikoBruch })}</p>
                  </Bestaetigung>
                ) : (
                  <button className="wi-handlung" onClick={() => setBestaetigt("iwf-kuendigen")}>
                    {t("zb.iwfBeenden")}
                  </button>
                )}
          </div>
            ) : anfrage.moeglich ? (
              <>
                <p className="wi-hinweis">{t("ui.wirtschaft.Zentralbank.88e14cd")}</p>
                <button className="wi-handlung" onClick={() => fuehre(() => {
                  const ev = oeffne(world, "iwf_angebot", new Rng(world.rngState ^ Math.imul(world.day + 13, 0x9e3779b1)));
                  return ev ? { ok: true, text: t("zb.iwfAngebot") } : { ok: false, text: t("zb.iwfZoegert") };
                })}>
                  {t("zb.iwfAnfragen")} <span aria-hidden>→</span>
                </button>
              </>
            ) : (
              <p className="wi-hinweis">{anfrage.grund}</p>
            )}
          </div>
        </div>
        {dv.interventionen.length > 0 && (
          <>
            <h4>{t("zb.interventionen")}</h4>
            <ul className="wi-marken">
              {[...dv.interventionen].reverse().slice(0, 5).map((x, i) => (
                <li key={i}>
                  <span className="wi-wann">{formatDateDe(x.datum)}</span> {x.text}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>}

      {teil === "verlauf" && <section className="wi-karte">
        <p className="kicker">{t("zb.kicker.sitzungen")}</p>
        <h3>{t("ui.wirtschaft.Zentralbank.f0053e6")}</h3>
        {z.sitzungen.length === 0 ? (
          <p className="wi-hinweis">{t("ui.wirtschaft.Zentralbank.110c84c")}</p>
        ) : (
          <ul className="wi-sitzungen">
            {[...z.sitzungen].reverse().map((s, i) => (
              <li key={s.tag}>
                <button className="wi-sitzung" aria-expanded={offen === i} onClick={() => setOffen(offen === i ? null : i)}>
                  <span className="wi-wann">{formatDateDe(s.datum)}</span>
                  <span className="wi-beschluss-gross">
                    {nf(s.alt)} → <b>{t("zb.prozent", { p: s.neu })}</b>
                  </span>
                  {s.abweichung !== 0 && <span className="wi-chip wi-schlecht">{t(s.stufe === "C" ? "zb.aufWeisung" : "zb.aufDruck", { p: s.regel })}</span>}
                  {s.abweichung === 0 && s.druck && <span className="wi-chip wi-gut">{t("zb.abgewehrt")}</span>}
                </button>
                {offen === i && (
                  <div className="wi-sitzung-text">
                    <p>{s.begruendung}</p>
                    <h4>{t("zb.danach")}</h4>
                    <ul>
                      {s.folgen.map((f, n) => (
                        <li key={n}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {eingriffe.length > 0 && (
          <>
            <h4>{t("zb.eingriffe")}</h4>
            <ul className="wi-marken">
              {eingriffe.map((m, i) => (
                <li key={i}>
                  <span className="wi-wann">{formatMonthDe(m.monat)}</span> {m.text}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>}
    </div>
  );
}

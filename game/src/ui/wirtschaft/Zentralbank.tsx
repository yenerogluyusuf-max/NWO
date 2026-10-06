// Die Zentralbank als Entscheidung: die nächste Zinssitzung mit den Wegen des Präsidenten (Nichts tun, Gespräch, Rede), die Führung der Bank,
// die Unabhängigkeit per Gesetz und die bisherigen Sitzungen. Jede Wahl zeigt vorher, was die Bank beschließen würde und was danach kommt.

import { useEffect, useMemo, useState } from "react";
import type { World } from "../../sim/types";
import type { Aktion, Metric, PrognoseReihe } from "../../sim/forecast";
import { ppkDecision } from "../../sim/economy";
import { figur, haltung as figurHaltung } from "../../sim/figuren";
import { glaubwuerdigkeitsKette, zinsKette, type Glied } from "../../sim/folgen";
import { REGELN, stimmenSicht } from "../../sim/handeln";
import { kannZahlen } from "../../sim/kapital";
import { formatDateDe, formatMonthDe } from "../../sim/dates";
import { KENNZAHLEN_NACH_ID } from "../../sim/wirtschaft-kennzahlen";
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

      <section className="wi-karte wi-bank">
        <div className="wi-bank-kopf">
          <div>
            <p className="kicker">{t("zb.kicker.bank")}</p>
            <h3>{gouv ? `${gouv.rolle} ${gouv.name}` : t("zb.gouverneurin")}</h3>
            <p className="wi-hinweis">
              {t("zb.haltung")} <b>{haltungName(world.governor.stance)}</b>
              {gouv && (
                <>
                  {" "}
                  · {t("zb.verhaeltnis")} <b>{figurHaltung(gouv)}</b>
                </>
              )}
            </p>
          </div>
          <div className={`wi-stufe wi-stufe-${z.stufe}`}>
            <span>{t("zb.stufe", { s: z.stufe })}</span>
            <b>{STUFEN[z.stufe].name}</b>
          </div>
        </div>
        <p className="wi-hinweis">{STUFEN[z.stufe].text}</p>
        <dl className="wi-zahlen">
          <div>
            <dt>{t("zb.metrik.policyRate")}</dt>
            <dd>{t("zb.prozent", { p: e.policyRate })}</dd>
          </div>
          <div>
            <dt>{t("zb.realzins")}</dt>
            <dd>{t("zb.prozent", { p: e.policyRate - e.expectedInflation })}</dd>
          </div>
          <div>
            <dt>{t("ui.wirtschaft.Zentralbank.37e34e7")}</dt>
            <dd>{glaubwuerdigkeitWort(e.credibility)}</dd>
          </div>
          <div>
            <dt>{t("zb.risiko")}</dt>
            <dd>{t("zb.punkte", { n: Math.round(e.riskPremium) })}</dd>
          </div>
        </dl>
      </section>

      <section className="wi-karte" id="wi-zb-sitzung">
        <p className="kicker">{t("ui.wirtschaft.Zentralbank.440cbd3")}</p>
        {naechste ? (
          <h3>
            {formatDateDe(naechste.datum)} <small>· {t("zb.inTagen", { n: naechste.tage })}</small>
          </h3>
        ) : (
          <h3>{t("ui.wirtschaft.Zentralbank.30c1276")}</h3>
        )}
        {!modusC && (
          <p className="wi-hinweis">
            {t("zb.regel")}{" "}
            <b>{regel.newRate === e.policyRate ? t("zb.regel.haelt", { neu: regel.newRate }) : t(regel.newRate > e.policyRate ? "zb.regel.erhoeht" : "zb.regel.senkt", { alt: e.policyRate, neu: regel.newRate })}</b>. {regel.why} {t("zb.regel.lage")}
          </p>
        )}
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
              <label key={o.id} className={`wi-option${gewaehlt === o.id ? " on" : ""}${!o.moeglich ? " aus" : ""}`}>
                <input type="radio" name="wi-druck" checked={gewaehlt === o.id} disabled={!o.moeglich} onChange={() => setGewaehlt(o.id)} />
                <span className="wi-option-kopf">
                  <b>{o.label}</b>
                  <span className={`wi-beschluss${o.abweichung < 0 ? " wi-schlecht" : o.abweichung > 0 ? " wi-neutral" : ""}`}>{t("zb.bank", { p: o.neu })}</span>
                </span>
                <span className="wi-option-text">{o.text}</span>
                <span className="wi-kosten">{o.kosten.join(" · ")}</span>
                {!o.moeglich && o.grund && <span className="wi-grund">{o.grund}</span>}
              </label>
            ))}
          </div>
        )}

        <div className="wi-vorschau">
          <h4>{t("zb.danach")}{!modusC && opt.id !== "keiner" ? `: ${opt.label}` : ""}</h4>
          <Folgen glieder={kette} leer={delta === 0 ? t("zb.bliebe", { p: e.policyRate }) : undefined} />
          <Wirkung reihen={reihen} metriken={METRIKEN} rechnet={rechnet} />
          <div className="wi-metriken" role="tablist" aria-label={t("ui.wirtschaft.Zentralbank.34b3ca6")}>
            {METRIKEN.map((m) => (
              <button key={m.id} role="tab" aria-selected={metrik === m.id} className={metrik === m.id ? "on" : ""} onClick={() => setMetrik(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
          <Diagramm punkte={verlauf(world, mk.kennzahl)} startMonat={startMonat(world)} jetztMonat={world.date.slice(0, 7)} band={band} linien={k.linien?.(world)} marken={alleMarken(world).filter((m) => m.art === "zins" || m.art === "eingriff")} stellen={k.stellen} einheit={k.einheit} name={k.name} rechnet={rechnet} />
        </div>

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
      </section>

      <section className="wi-karte" id="wi-zb-gouverneur">
        <p className="kicker">{t("ui.wirtschaft.Zentralbank.4e897df")}</p>
        <h3>{t("ui.wirtschaft.Zentralbank.6517018")}</h3>
        <p className="wi-hinweis">{t("zb.neubesetzung", { n: 120 })}</p>
        <div className="wi-haltungen">
          {HALTUNGEN.map((h) => {
            const grund = z.stufe === "A" ? t("zb.geschuetzt") : world.governor.stance === h.id ? t("zb.schon") : restGouv > 0 ? t("zb.wiederIn", { n: restGouv }) : null;
            return (
              <div key={h.id} className={`wi-haltung${world.governor.stance === h.id ? " jetzt" : ""}`}>
                <b>{h.name}</b>
                <span>{h.text}</span>
                <em>{h.folge}</em>
                {bestaetigt === `g-${h.id}` ? (
                  <Bestaetigung name={spielerName} titel={t("zb.neueFuehrung", { name: h.name })} onJa={() => fuehre(() => ernenneGouverneur(world, h.id))} onNein={() => setBestaetigt(null)}>
                    <p>{h.folge}</p>
                    <Folgen glieder={h.id === "gefuegig" ? glaubwuerdigkeitsKette(-0.18) : []} />
                  </Bestaetigung>
                ) : (
                  <button disabled={!!grund} title={grund ?? ""} onClick={() => setBestaetigt(`g-${h.id}`)}>
                    {world.governor.stance === h.id ? t("zb.aktuell") : t("zb.einsetzen")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="wi-karte" id="wi-zb-stufe">
        <p className="kicker">{t("zb.kicker.gesetz")}</p>
        <h3>{t("ui.wirtschaft.Zentralbank.bf2ad27")}</h3>
        <p className="wi-hinweis">{t("zb.gesetzText", { lager, mehrheit: REGELN.mehrheit })}</p>
        <div className="wi-wechsel">
          {wechsel.map((w) => {
            const grund = restStufe > 0 ? t("zb.fruehestens", { n: restStufe }) : lager < REGELN.mehrheit ? t("zb.keineMehrheit") : !kannZahlen(world.spiel?.kapital ?? 0, w.pk) ? t("zb.keinKapital") : null;
            return (
              <div key={w.ziel} className="wi-wechsel-karte">
                <b>
                  {w.text} <small>({t("zb.stufe", { s: w.ziel })}: {STUFEN[w.ziel].name})</small>
                </b>
                <span>{w.effekte}</span>
                <span className="wi-kosten">{t("zb.kostetPk", { pk: w.pk })}</span>
                {bestaetigt === `s-${w.ziel}` ? (
                  <Bestaetigung name={spielerName} titel={w.text} knopf={t("zb.unterzeichnen")} onJa={() => fuehre(() => aendereStufe(world, w.ziel))} onNein={() => setBestaetigt(null)}>
                    <p>{w.effekte}</p>
                    <p className="wi-hinweis">{t("zb.kostetPk", { pk: w.pk })}.</p>
                    <Folgen glieder={glaubwuerdigkeitsKette(STUFEN_GLAUBWUERDIGKEIT[`${z.stufe}>${w.ziel}`] ?? 0)} />
                  </Bestaetigung>
                ) : (
                  <button disabled={!!grund} title={grund ?? ""} onClick={() => setBestaetigt(`s-${w.ziel}`)}>
                    {t("ui.wirtschaft.Zentralbank.e3fb7df")}
                  </button>
                )}
                {grund && <span className="wi-grund">{grund}</span>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="wi-karte" id="wi-zb-devisen">
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
      </section>

      <section className="wi-karte">
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
      </section>
    </div>
  );
}

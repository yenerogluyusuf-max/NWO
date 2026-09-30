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
import type { GovernorStance } from "../../sim/types";
import { Diagramm } from "./Diagramm";
import { Folgen } from "./Folgen";
import { Bestaetigung } from "./Bestaetigung";
import { Wirkung } from "./Wirkung";
import { berechneReihen } from "./prognose";
import "./wirtschaft.css";

const nf = (x: number, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });

const METRIKEN: { id: Metric; kennzahl: string; label: string }[] = [
  { id: "policyRate", kennzahl: "leitzins", label: "Leitzins" },
  { id: "inflation", kennzahl: "inflation", label: "Inflation" },
  { id: "growth", kennzahl: "wachstum", label: "Wachstum" },
  { id: "usdTry", kennzahl: "usd", label: "Lira je Dollar" },
  { id: "unemployment", kennzahl: "arbeitslosigkeit", label: "Arbeitslosigkeit" },
];

const HALTUNGEN: { id: GovernorStance; name: string; text: string; folge: string }[] = [
  { id: "vorsichtig", name: "Streng", text: "Eine erfahrene Hüterin der Preisstabilität: reagiert früh auf Inflation und lässt sich kaum beeinflussen.", folge: "Die Märkte belohnen es mit etwas Vertrauen; Zinsen bleiben hoch, Kredite teuer." },
  { id: "ausgewogen", name: "Ausgewogen", text: "Eine Kraft aus dem Haus: wägt Inflation und Wachstum gleich, gibt Druck teilweise nach.", folge: "Ein Wechsel bleibt ein Eingriff; die Märkte beruhigt es nur zum Teil." },
  { id: "gefuegig", name: "Gefügig", text: "Eine regierungsnahe Führung: senkt eher, verweist auf Wachstum und Beschäftigung und folgt Druck fast immer.", folge: "Die Märkte lesen es als Eingriff in die Unabhängigkeit: Lira fällt, Risikoaufschlag steigt, Glaubwürdigkeit leidet stark." },
];

/** Wie stark ein Wechsel der Unabhängigkeit die Glaubwürdigkeit bewegt (siehe `wendeStufeAn`). */
const STUFEN_GLAUBWUERDIGKEIT: Record<string, number> = { "B>C": -0.18, "C>B": 0.06, "B>A": 0.08, "A>B": -0.06 };

const HALTUNG_NAME: Record<GovernorStance, string> = { vorsichtig: "streng", ausgewogen: "ausgewogen", gefuegig: "gefügig" };

function aktionFuer(o: DruckOption | undefined): Aktion | null {
  if (!o || o.id === "keiner" || !o.richtung || !o.weg) return null;
  return { art: "zinsdruck", richtung: o.richtung, weg: o.weg };
}

export function Zentralbank({ world, geaendert, abschnitt }: { world: World; geaendert: () => void; abschnitt?: "sitzung" | "gouverneur" | "stufe" | undefined }) {
  const z = zbZustand(world);
  const naechste = naechsteSitzung(world);
  const optionen = useMemo(() => druckOptionen(world), [world.day, world.spiel?.kapital, z.stufe, world.governor.stance]);
  const [gewaehlt, setGewaehlt] = useState<DruckOption["id"]>("keiner");
  const [bestaetigt, setBestaetigt] = useState<string | null>(null);
  const [rueck, setRueck] = useState<{ ok: boolean; text: string; why?: string | undefined } | null>(null);
  const [metrik, setMetrik] = useState<Metric>("policyRate");
  const [reihen, setReihen] = useState<PrognoseReihe[] | null>(null);
  const [rechnet, setRechnet] = useState(false);
  const [vorgabe, setVorgabe] = useState<number | null>(null);
  const [offen, setOffen] = useState<number | null>(null);

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
  const band = r ? { ohne: r.ohne, ...(r.mit.length ? { mit: r.mit, mitName: modusC ? "Mit Ihrer Vorgabe" : `Mit: ${opt.label}` } : {}) } : undefined;
  const lager = stimmenSicht(world).lager;
  const wechsel = stufenWechsel(z.stufe);
  const restGouv = (z.gouverneurGeaendert ?? -1e9) + 120 - world.day;
  const restStufe = (z.stufeGeaendert ?? -1e9) + 180 - world.day;
  const eingriffe = alleMarken(world).filter((m) => m.art === "eingriff").reverse().slice(0, 6);

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
            <p className="kicker">Die Zentralbank</p>
            <h3>{gouv ? `${gouv.rolle} ${gouv.name}` : "Gouverneurin"}</h3>
            <p className="wi-hinweis">
              Haltung: <b>{HALTUNG_NAME[world.governor.stance]}</b>
              {gouv && (
                <>
                  {" "}
                  · Verhältnis zu Ihnen: <b>{figurHaltung(gouv)}</b>
                </>
              )}
            </p>
          </div>
          <div className={`wi-stufe wi-stufe-${z.stufe}`}>
            <span>Stufe {z.stufe}</span>
            <b>{STUFEN[z.stufe].name}</b>
          </div>
        </div>
        <p className="wi-hinweis">{STUFEN[z.stufe].text}</p>
        <dl className="wi-zahlen">
          <div>
            <dt>Leitzins</dt>
            <dd>{nf(e.policyRate)} %</dd>
          </div>
          <div>
            <dt>Realzins</dt>
            <dd>{nf(e.policyRate - e.expectedInflation)} %</dd>
          </div>
          <div>
            <dt>Glaubwürdigkeit der Bank</dt>
            <dd>{glaubwuerdigkeitWort(e.credibility)}</dd>
          </div>
          <div>
            <dt>Risikoaufschlag</dt>
            <dd>{nf(e.riskPremium, 0)} Punkte</dd>
          </div>
        </dl>
      </section>

      <section className="wi-karte" id="wi-zb-sitzung">
        <p className="kicker">Nächste Zinssitzung</p>
        {naechste ? (
          <h3>
            {formatDateDe(naechste.datum)} <small>· in {naechste.tage} {naechste.tage === 1 ? "Tag" : "Tagen"}</small>
          </h3>
        ) : (
          <h3>Keine Sitzung mehr geplant</h3>
        )}
        {!modusC && (
          <p className="wi-hinweis">
            Ohne Ihr Zutun folgt die Bank ihrer Regel: Nach heutigem Stand {regel.newRate === e.policyRate ? <b>hält sie den Zins bei {nf(regel.newRate)} %</b> : <b>{regel.newRate > e.policyRate ? "erhöht" : "senkt"} sie den Zins von {nf(e.policyRate)} auf {nf(regel.newRate)} %</b>}. {regel.why} Die Lage kann sich bis dahin ändern.
          </p>
        )}
        {z.druck && !modusC && (
          <p className="wi-hinweis wi-druck">
            Für diese Sitzung liegt schon Druck an: {z.druck.richtung < 0 ? "Sie fordern eine Senkung" : "Sie stützen die strenge Linie"} ({z.druck.weg === "rede" ? "öffentlich" : "vertraulich"}).
          </p>
        )}

        {modusC ? (
          <div className="wi-vorgabe">
            <p className="wi-hinweis">Die Bank ist weisungsgebunden: Sie legen den Zins selbst fest. Jede Abweichung von der Regel ({nf(regel.newRate)} %) sehen die Märkte und werten sie als politischen Zins.</p>
            <label htmlFor="wi-vorgabe">
              Leitzins für die nächste Sitzung: <b>{nf(vorgabeWert)} %</b>
            </label>
            <input id="wi-vorgabe" type="range" min={0} max={60} step={0.5} value={vorgabeWert} onChange={(ev) => setVorgabe(Number(ev.target.value))} />
            <button className="wi-handlung" onClick={() => fuehre(() => setzeVorgabe(world, vorgabeWert))}>
              Zins festlegen: {nf(vorgabeWert)} % <span aria-hidden>→</span>
            </button>
          </div>
        ) : (
          <div className="wi-optionen" role="radiogroup" aria-label="Was Sie vor der Sitzung tun">
            {optionen.map((o) => (
              <label key={o.id} className={`wi-option${gewaehlt === o.id ? " on" : ""}${!o.moeglich ? " aus" : ""}`}>
                <input type="radio" name="wi-druck" checked={gewaehlt === o.id} disabled={!o.moeglich} onChange={() => setGewaehlt(o.id)} />
                <span className="wi-option-kopf">
                  <b>{o.label}</b>
                  <span className={`wi-beschluss${o.abweichung < 0 ? " wi-schlecht" : o.abweichung > 0 ? " wi-neutral" : ""}`}>Bank: {nf(o.neu)} %</span>
                </span>
                <span className="wi-option-text">{o.text}</span>
                <span className="wi-kosten">{o.kosten.join(" · ")}</span>
                {!o.moeglich && o.grund && <span className="wi-grund">{o.grund}</span>}
              </label>
            ))}
          </div>
        )}

        <div className="wi-vorschau">
          <h4>Was danach kommt{!modusC && opt.id !== "keiner" ? `: ${opt.label}` : ""}</h4>
          <Folgen glieder={kette} leer={delta === 0 ? `Der Zins bliebe bei ${nf(e.policyRate)} %. Frühere Entscheidungen wirken weiter: Was die Bank in den letzten Monaten beschlossen hat, kommt erst mit Verzögerung bei Kredit, Nachfrage und Preisen an.` : undefined} />
          <Wirkung reihen={reihen} metriken={METRIKEN} rechnet={rechnet} />
          <div className="wi-metriken" role="tablist" aria-label="Größe der Vorschau">
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
            <Bestaetigung name={spielerName} titel={opt.label} knopf={opt.weg === "rede" ? "Rede halten" : "Gespräch führen"} onJa={() => fuehre(() => machDruck(world, opt.richtung!, opt.weg!))} onNein={() => setBestaetigt(null)}>
              <p>{opt.text}</p>
              <p className="wi-hinweis">
                {opt.abweichung !== 0 ? `Nach heutigem Stand beschließt die Bank ${nf(opt.neu)} % statt ${nf(regel.newRate)} %.` : "Nach heutigem Stand ändert das nichts am Beschluss: Die Gouverneurin bleibt bei ihrer Linie."} Kosten: {opt.kosten.join(", ")}.
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
        <p className="kicker">Die Führung der Bank</p>
        <h3>Wer die Zinsen macht</h3>
        <p className="wi-hinweis">Eine Neubesetzung ist ein Präsidialdekret: Sie kostet kein Kapital, aber Vertrauen der Märkte. Danach bleibt der Wechsel {120} Tage gesperrt.</p>
        <div className="wi-haltungen">
          {HALTUNGEN.map((h) => {
            const grund = z.stufe === "A" ? "Die Führung ist gesetzlich geschützt." : world.governor.stance === h.id ? "Hat die Bank schon." : restGouv > 0 ? `Wieder möglich in ${restGouv} Tagen.` : null;
            return (
              <div key={h.id} className={`wi-haltung${world.governor.stance === h.id ? " jetzt" : ""}`}>
                <b>{h.name}</b>
                <span>{h.text}</span>
                <em>{h.folge}</em>
                {bestaetigt === `g-${h.id}` ? (
                  <Bestaetigung name={spielerName} titel={`Neue Führung: ${h.name.toLowerCase()}`} onJa={() => fuehre(() => ernenneGouverneur(world, h.id))} onNein={() => setBestaetigt(null)}>
                    <p>{h.folge}</p>
                    <Folgen glieder={h.id === "gefuegig" ? glaubwuerdigkeitsKette(-0.18) : []} />
                  </Bestaetigung>
                ) : (
                  <button disabled={!!grund} title={grund ?? ""} onClick={() => setBestaetigt(`g-${h.id}`)}>
                    {world.governor.stance === h.id ? "Aktuelle Haltung" : `Einsetzen`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="wi-karte" id="wi-zb-stufe">
        <p className="kicker">Das Zentralbankgesetz</p>
        <h3>Wie unabhängig ist die Bank?</h3>
        <p className="wi-hinweis">Die Unabhängigkeit ändert sich per Gesetz, Schritt für Schritt. Das braucht die Mehrheit im Regierungslager (jetzt {lager} von {REGELN.mehrheit} Stimmen), kostet Kapital, und die Märkte reagieren schon auf die Ankündigung.</p>
        <div className="wi-wechsel">
          {wechsel.map((w) => {
            const grund = restStufe > 0 ? `Frühestens in ${restStufe} Tagen.` : lager < REGELN.mehrheit ? "Es fehlt die Mehrheit im Lager." : !kannZahlen(world.spiel?.kapital ?? 0, w.pk) ? "Es fehlt Kapital." : null;
            return (
              <div key={w.ziel} className="wi-wechsel-karte">
                <b>
                  {w.text} <small>(Stufe {w.ziel}: {STUFEN[w.ziel].name})</small>
                </b>
                <span>{w.effekte}</span>
                <span className="wi-kosten">Kostet {w.pk} Kapital</span>
                {bestaetigt === `s-${w.ziel}` ? (
                  <Bestaetigung name={spielerName} titel={w.text} knopf="Gesetz unterzeichnen" onJa={() => fuehre(() => aendereStufe(world, w.ziel))} onNein={() => setBestaetigt(null)}>
                    <p>{w.effekte}</p>
                    <p className="wi-hinweis">Kostet {w.pk} Kapital.</p>
                    <Folgen glieder={glaubwuerdigkeitsKette(STUFEN_GLAUBWUERDIGKEIT[`${z.stufe}>${w.ziel}`] ?? 0)} />
                  </Bestaetigung>
                ) : (
                  <button disabled={!!grund} title={grund ?? ""} onClick={() => setBestaetigt(`s-${w.ziel}`)}>
                    Gesetz einbringen
                  </button>
                )}
                {grund && <span className="wi-grund">{grund}</span>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="wi-karte">
        <p className="kicker">Die Sitzungen</p>
        <h3>Was die Bank beschlossen hat</h3>
        {z.sitzungen.length === 0 ? (
          <p className="wi-hinweis">Noch hat keine Sitzung stattgefunden.</p>
        ) : (
          <ul className="wi-sitzungen">
            {[...z.sitzungen].reverse().map((s, i) => (
              <li key={s.tag}>
                <button className="wi-sitzung" aria-expanded={offen === i} onClick={() => setOffen(offen === i ? null : i)}>
                  <span className="wi-wann">{formatDateDe(s.datum)}</span>
                  <span className="wi-beschluss-gross">
                    {nf(s.alt)} → <b>{nf(s.neu)} %</b>
                  </span>
                  {s.abweichung !== 0 && <span className="wi-chip wi-schlecht">{s.stufe === "C" ? "auf Weisung" : "auf Druck"}: Regel {nf(s.regel)} %</span>}
                  {s.abweichung === 0 && s.druck && <span className="wi-chip wi-gut">Druck abgewehrt</span>}
                </button>
                {offen === i && (
                  <div className="wi-sitzung-text">
                    <p>{s.begruendung}</p>
                    <h4>Was danach kommt</h4>
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
            <h4>Ihre Eingriffe</h4>
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

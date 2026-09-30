// Eine Wählergruppe im Einzelnen: Stimmung und Verlauf, Ursachenkette, was sie will und stört, worauf sie achtet, wohin sie wechseln würde,
// was ihr jetzt helfen würde (mit Kosten, Nebenwirkungen und einer Vorschau) und was dazu schon auf dem Tisch liegt.

import { useMemo, useState } from "react";
import type { World } from "../../sim/types";
import { NET } from "../../sim/modell";
import { SCHWELLE_TRAEGER, gruppenDetail, type Hilfe, type Praeferenz } from "../../sim/waehler-detail";
import { entscheidungsMarken } from "../../sim/waehler-verlauf";
import type { Outlook } from "../../sim/forecast";
import { berechneVorschau } from "../vorschau";
import { tunWort } from "../../data/skalen";
import { Kette } from "./Kette";
import { Sparkline } from "./Sparkline";
import { monatText, nf, prozent, vz } from "./format";

export type DossierZiel = "schreibtisch" | "gespraech" | "parlament" | "programme";

interface Props {
  world: World;
  id: string;
  onMassnahme?: (id: string, richtung: 1 | -1) => void;
  onDossier?: (d: DossierZiel) => void;
}

const knotenName = (id: string) => NET.nodes[NET.index.get(id)!]!.name;

function StufenMesser({ stufe, seitStart }: { stufe: number; seitStart: number }) {
  const start = Math.max(0, Math.min(100, stufe - seitStart));
  return (
    <span className="wa-stufen" title={`Stufe ${Math.round(stufe)} von 100; zu Beginn ${Math.round(start)}`} aria-hidden>
      <i style={{ width: `${Math.max(0, Math.min(100, stufe))}%` }} />
      <b style={{ left: `${start}%` }} />
    </span>
  );
}

function PraeferenzListe({ titel, liste, richtung, onMassnahme }: { titel: string; liste: Praeferenz[]; richtung: 1 | -1; onMassnahme?: (id: string, richtung: 1 | -1) => void }) {
  return (
    <div className="wa-pref">
      <h5>{titel}</h5>
      {liste.length === 0 ? (
        <p className="wa-leer">Nichts, was sie stark bewegt.</p>
      ) : (
        <ul>
          {liste.map((p) => (
            <li key={p.id}>
              <div className="wa-pref-zeile">
                <button type="button" className="link" onClick={() => onMassnahme?.(p.id, richtung)} title="Die Maßnahme ansehen und einstellen">
                  {p.name}
                </button>
                <StufenMesser stufe={p.stufe} seitStart={p.seitStart} />
                <span className="wa-pref-stufe">{Math.round(p.stufe)}</span>
              </div>
              {p.wirkt !== 0 && (
                <em className={p.wirkt > 0 ? "gut" : "schlecht"}>
                  {p.wirkt > 0 ? "✓ Sie haben es in ihrem Sinn verändert" : "✗ Sie haben es gegen ihren Wunsch verändert"} ({vz(p.seitStart, 0)} Stufen)
                </em>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HilfeKarte({ h, world, gruppe, gruppeName, onMassnahme }: { h: Hilfe; world: World; gruppe: string; gruppeName: string; onMassnahme?: (id: string, richtung: 1 | -1) => void }) {
  const [vor, setVor] = useState<{ laeuft: boolean; zeilen?: { name: string; ohne: number; mit: number; von: number; bis: number }[]; fehler?: string }>({ laeuft: false });
  async function rechne() {
    setVor({ laeuft: true });
    try {
      const metriken = [`net:${gruppe}`, "net:vertrauen_regierung", "inflation", "unemployment"] as const;
      const namen = [gruppeName, "Vertrauen in die Regierung", "Inflation (Prozent)", "Arbeitslosigkeit (Prozent)"];
      const outs: Outlook[] = await berechneVorschau(world, { art: "massnahme", id: h.massnahme, stufe: h.auf }, [...metriken], 12, 8);
      setVor({ laeuft: false, zeilen: outs.map((o, i) => ({ name: namen[i]!, ohne: o.withoutAction.mid, mit: o.withAction.mid, von: o.withAction.low, bis: o.withAction.high })) });
    } catch (e) {
      setVor({ laeuft: false, fehler: e instanceof Error ? e.message : "Die Vorschau ist fehlgeschlagen." });
    }
  }
  return (
    <li className="wa-hilfe">
      <div className="wa-hilfe-kopf">
        <strong>
          {h.name} {tunWort(h.massnahme, h.richtung)}
          <span> von {Math.round(h.von)} auf {h.auf}</span>
        </strong>
        <span className="wa-hilfe-kosten">{h.pk} Kapital</span>
      </div>
      <p className="wa-hilfe-wirkung">
        <b className="gut">{gruppeName} {vz(h.gewinn)}</b> bis zur Wahl (nach einem Jahr {vz(h.nach12)}, langfristig {vz(h.langfristig)}). Ihre Zustimmung insgesamt: <b className={h.zustimmung >= 0 ? "gut" : "schlecht"}>{vz(h.zustimmung)}</b> Punkte.
      </p>
      {(h.gewinner.length > 0 || h.verlierer.length > 0) && (
        <p className="wa-hilfe-neben">
          {h.gewinner.length > 0 && (
            <span className="gut">
              Zugleich besser: {h.gewinner.map((g) => `${g.name} ${vz(g.punkte)}`).join(", ")}.{" "}
            </span>
          )}
          {h.verlierer.length > 0 && <span className="schlecht">Verärgert: {h.verlierer.map((g) => `${g.name} ${vz(g.punkte)}`).join(", ")}.</span>}
        </p>
      )}
      <p className="wa-hilfe-fuss">
        Kosten im Haushalt: {vz(h.kostenBip, 2)} % des BIP im Jahr · Umsetzung etwa {h.monate} {h.monate === 1 ? "Monat" : "Monate"}
        {h.mehrheitFehlt ? " · dem Lager fehlt dafür die Mehrheit im Parlament" : ""}
        {!h.moeglich && h.grund ? ` · ${h.grund}` : ""}
      </p>
      <div className="wa-hilfe-knoepfe">
        <button type="button" className="aktion-knopf" onClick={() => onMassnahme?.(h.massnahme, h.richtung)}>
          Einstellen und einbringen
        </button>
        <button type="button" className="aktion-knopf" onClick={rechne} disabled={vor.laeuft}>
          {vor.laeuft ? "Rechne …" : "Vorschau in zwölf Monaten"}
        </button>
      </div>
      {vor.zeilen && (
        <table className="wa-vorschau" aria-label="Vorschau in zwölf Monaten">
          <thead>
            <tr>
              <th />
              <th>ohne</th>
              <th>mit der Maßnahme</th>
            </tr>
          </thead>
          <tbody>
            {vor.zeilen.map((z) => (
              <tr key={z.name}>
                <th>{z.name}</th>
                <td>{nf(z.ohne)}</td>
                <td>
                  <b>{nf(z.mit)}</b> <em>({nf(z.von)} bis {nf(z.bis)})</em>
                </td>
              </tr>
            ))}
          </tbody>
          <caption>Das ganze Modell mit Zufall und den Rückwirkungen über die Wirtschaft, acht Läufe; die Spanne zeigt, wie unsicher es ist.</caption>
        </table>
      )}
      {vor.fehler && <p className="wa-leer schlecht">{vor.fehler}</p>}
    </li>
  );
}

export function GruppenDetail({ world, id, onMassnahme, onDossier }: Props) {
  const spiel = world.spiel!;
  const signatur = `${id}|${world.date.slice(0, 7)}|${Math.floor(spiel.kapital)}|${Object.keys(world.net.targets).length}|${Object.keys(world.net.ziele ?? {}).length}|${spiel.gesetze.length}|${spiel.ereignisse.length}|${spiel.zusagen.length}`;
  const d = useMemo(() => gruppenDetail(world, id), [signatur]); // eslint-disable-line react-hooks/exhaustive-deps
  const marken = useMemo(() => entscheidungsMarken(world), [signatur]); // eslint-disable-line react-hooks/exhaustive-deps
  const k = d.kurz;
  const knoten = NET.nodes[NET.index.get(id)!]!;
  const ueberTag = Math.round(d.tendenz.abstand);
  const gut = k.laune >= 50;
  const ohneTreiber = d.kette.length === 0;
  const w = d.wanderung;
  return (
    <div className="wa-detail">
      <header className="wa-kopf">
        <div className="wa-kopf-text">
          <h3>{k.name}</h3>
          <p className="wa-absicht">{d.absicht.charAt(0).toUpperCase() + d.absicht.slice(1)}.</p>
          <p className="wa-beschreibung">{knoten.text}</p>
        </div>
        <div className={`wa-zahl ${gut ? "gut" : "schlecht"}`}>
          <strong>{Math.round(k.laune)}</strong>
          <span>{d.wort}</span>
          {k.trend !== null && Math.abs(k.trend) >= 0.4 && (
            <em title="Veränderung gegenüber vor drei Monaten">
              {k.trend > 0 ? "▲" : "▼"} {nf(Math.abs(k.trend))} in drei Monaten
            </em>
          )}
        </div>
      </header>

      <p className="wa-fakten">
        Gewicht {prozent(k.anteil)} der Wähler · {k.beitrag >= 0 ? "trägt" : "kostet"} {nf(Math.abs(k.beitrag), 1)} Punkte Ihrer Zustimmung
      </p>

      <div className="wa-verlauf">
        <Sparkline monate={d.verlauf.monate} werte={d.verlauf.werte} marken={marken} ziel={d.tendenz.ziel} beschriftung={`Stimmung von ${k.name} im Verlauf`} />
        <p className="wa-verlauf-text">
          {Math.abs(ueberTag) < 2
            ? "Bei den heutigen Verhältnissen bleibt die Stimmung etwa hier."
            : `Bei den heutigen Verhältnissen strebt sie nach ${nf(d.tendenz.ziel, 0)} und ${ueberTag < 0 ? "fällt weiter" : "steigt weiter"}${ohneTreiber ? ": Die Stimmung nach der Wahl klingt ab" : ""}.`}{" "}
          <span>Punkte auf der Linie sind Gesetze, die Sie durchgebracht haben.</span>
        </p>
      </div>

      <section className="wa-abschnitt">
        <h4>Warum sie so gestimmt sind</h4>
        <p className="wa-unter">
          Was die Stimmung gegenüber dem Amtsantritt bewegt, in Punkten, und darunter, was wiederum diese Ursachen bewegt hat. Endet bei Ihren Entscheidungen und bei der Wirtschaft.
        </p>
        {ohneTreiber ? (
          <p className="wa-leer">Bisher hat sich nichts Wesentliches gegenüber dem Amtsantritt bewegt.</p>
        ) : (
          <Kette glieder={d.kette} eltern="die Stimmung" {...(onMassnahme ? { onMassnahme } : {})} />
        )}
      </section>

      <section className="wa-abschnitt">
        <h4>Was sie wollen und was sie stört</h4>
        <div className="wa-pref-paar">
          <PraeferenzListe titel="Sie wünschen mehr von" liste={d.praeferenzen.will} richtung={1} {...(onMassnahme ? { onMassnahme } : {})} />
          <PraeferenzListe titel="Sie wünschen weniger von" liste={d.praeferenzen.hasst} richtung={-1} {...(onMassnahme ? { onMassnahme } : {})} />
        </div>
        <p className="wa-unter">Die Marke im Balken zeigt die Stufe zu Beginn Ihrer Amtszeit.</p>
      </section>

      {d.sorgen.length > 0 && (
        <section className="wa-abschnitt">
          <h4>Worauf sie achten</h4>
          <ul className="wa-sorgen">
            {d.sorgen.map((s) => (
              <li key={s.id} className={s.wirkt > 0 ? "gut" : s.wirkt < 0 ? "schlecht" : ""} title={s.text}>
                <span className="wa-sorge-pfeil" aria-hidden>
                  {s.wirkt === 0 ? "·" : s.wirkt > 0 ? "▲" : "▼"}
                </span>
                <span className="wa-sorge-name">
                  {s.name}
                  {s.art === "problem" && s.akutIn > 0 && <em className="wa-akut">akut in {s.akutIn} Provinzen</em>}
                </span>
                <span className="wa-sorge-wert">
                  {s.vorzeichen > 0 ? "mehr ist gut" : "weniger ist gut"} · {vz(s.seitStart)} seit Beginn
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="wa-abschnitt">
        <h4>Wohin sie wechseln würden</h4>
        {w.neigung < 0.04 ? (
          <p className="wa-leer">Bei dieser Stimmung denkt kaum jemand in der Gruppe an einen Wechsel.</p>
        ) : (
          <>
            <div className="wa-neigung">
              <span>Wechselneigung</span>
              <span className="wa-neigung-balken" aria-hidden>
                <i style={{ width: `${Math.round(w.neigung * 100)}%` }} />
              </span>
              <strong>{prozent(w.neigung)}</strong>
            </div>
            <ul className="wa-ziele">
              {w.ziele.map((z) => (
                <li key={z.partei}>
                  <div className="wa-ziel-kopf">
                    <strong>{z.name}</strong>
                    {z.imLager && <em>in Ihrem Lager</em>}
                    <span className={z.naehe >= 0.3 ? "gut" : z.naehe <= -0.3 ? "schlecht" : ""}>{z.naehe >= 0.3 ? "Nähe" : z.naehe <= -0.3 ? "Ferne" : "neutral"} {vz(z.naehe)}</span>
                  </div>
                  {z.passt.length > 0 && <em className="wa-ziel-passt">Fordert, was ihnen gefällt: {z.passt.join("; ")}</em>}
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="wa-unter">
          Die Wechselneigung ist ein Spielparameter, keine Messung: Sie wächst, je weiter die Stimmung unter {SCHWELLE_TRAEGER} fällt. Die Nähe zu einer Partei ergibt sich daraus, was sie fordert und was der Gruppe nützen würde.
        </p>
      </section>

      <section className="wa-abschnitt">
        <h4>Was jetzt helfen würde</h4>
        <p className="wa-unter">
          Jeweils ein Schritt von 20 Stufen, gerechnet bis zur Wahl{d.hilfen[0] ? ` in ${d.hilfen[0].horizont} Monaten` : ""}. Die Zahlen rechnen das Politiknetz durch, ohne Rückwirkungen über die Wirtschaft; die Vorschau darunter rechnet alles.
        </p>
        {d.hilfen.length === 0 ? (
          <p className="wa-leer">Keine einzelne Maßnahme, die dieser Gruppe spürbar hilft, ohne dass sie schon ausgereizt wäre.</p>
        ) : (
          <ul className="wa-hilfen">
            {d.hilfen.map((h) => (
              <HilfeKarte key={h.massnahme} h={h} world={world} gruppe={id} gruppeName={k.name} {...(onMassnahme ? { onMassnahme } : {})} />
            ))}
          </ul>
        )}
      </section>

      {d.regionen.spanne >= 1.5 && (
        <section className="wa-abschnitt">
          <h4>Wo die Stimmung anders ist</h4>
          <ul className="wa-regionen">
            {d.regionen.regionen.map((r) => (
              <li key={r.region}>
                <span>{r.name}</span>
                <span className="wa-region-balken" aria-hidden>
                  <b />
                  <i className={r.abstand >= 0 ? "plus" : "minus"} style={{ width: `${Math.min(50, Math.abs(r.abstand) * 6)}%`, [r.abstand >= 0 ? "left" : "right"]: "50%" }} />
                </span>
                <strong className={r.abstand >= 0 ? "gut" : "schlecht"}>{vz(r.abstand)}</strong>
              </li>
            ))}
          </ul>
          {d.regionen.schlechteste && d.regionen.beste && (
            <p className="wa-unter">
              Am zufriedensten in {d.regionen.beste.name} ({nf(d.regionen.beste.laune, 0)}), am unzufriedensten in {d.regionen.schlechteste.name} ({nf(d.regionen.schlechteste.laune, 0)}).
            </p>
          )}
        </section>
      )}

      {(d.handlungen.zusagen.length > 0 || d.handlungen.ereignisse.length > 0 || d.handlungen.berichte.length > 0) && (
        <section className="wa-abschnitt">
          <h4>Was dazu schon auf dem Tisch liegt</h4>
          <ul className="wa-tisch">
            {d.handlungen.zusagen.map((z) => (
              <li key={z.id}>
                <b>Zusage an {z.von}</b> {z.text}: {knotenName(z.massnahme)}, fällig in {Math.max(0, z.faellig - world.day)} Tagen.
                <button type="button" className="link" onClick={() => onMassnahme?.(z.massnahme, z.richtung >= 0 ? 1 : -1)}>
                  {" "}
                  Jetzt einlösen
                </button>
              </li>
            ))}
            {d.handlungen.ereignisse.map((e) => (
              <li key={e.id}>
                <b>Offenes Ereignis</b> {e.titel}: Die Ursache lässt sich mit „{knotenName(e.massnahme)}“ regeln.
                {onDossier && (
                  <button type="button" className="link" onClick={() => onDossier("schreibtisch")}>
                    {" "}
                    Am Schreibtisch entscheiden
                  </button>
                )}
              </li>
            ))}
            {d.handlungen.berichte.map((b) => (
              <li key={`${b.datum}-${b.titel}`}>
                <b>Wirkungsbericht, {monatText(b.datum.slice(0, 7))}</b> {b.titel} ({b.urteil === "gut" ? "gewirkt" : b.urteil === "schwach" ? "schwach" : b.urteil === "gemischt" ? "gemischt" : "ohne erkennbare Wirkung"}): {b.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {onDossier && (
        <div className="wa-aktionen">
          <button type="button" className="aktion-knopf" onClick={() => onDossier("gespraech")}>
            Im Gespräch beraten lassen
          </button>
          <button type="button" className="aktion-knopf" onClick={() => onDossier("parlament")}>
            Zum Parlament
          </button>
          <button type="button" className="aktion-knopf" onClick={() => onDossier("programme")}>
            Regierungsprogramm
          </button>
        </div>
      )}
    </div>
  );
}

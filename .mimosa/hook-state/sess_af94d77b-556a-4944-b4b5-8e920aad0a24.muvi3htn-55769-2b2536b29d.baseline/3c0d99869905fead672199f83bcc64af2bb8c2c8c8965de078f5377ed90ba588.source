// Das Befehlsblatt: Minister wählen, Befehl wählen, Vorschau mit Kosten, Dauer, Erfolgschance und dem Risiko der Weigerung lesen,
// dann anordnen. Darunter laufen die Befehle und Aufträge mit Frist. Ausgeführt wird über sim/minister-befehle.ts.

import { useMemo, useState } from "react";
import { Portraet as Zeichnung } from "../art/Portraet";
import { addDays, formatDateDe } from "../../sim/dates";
import { haltung } from "../../sim/figuren";
import { AEMTER, eigenVon, leistung } from "../../sim/personen";
import { BEFEHL_NAMEN, befehlAngebote, befehlVorschau, erteileBefehl, laufendeBefehle, MAX_BEFEHLE, type BefehlAngebot } from "../../sim/minister-befehle";
import { KABINETT_AMT } from "../../sim/ministerfluss-kern";
import type { BefehlTyp } from "../../sim/ministerfluss-typen";
import type { World } from "../../sim/types";
import "../politik/design.css";
import "./ministerfluss.css";

const TINT: Record<string, string> = { stab: "#7c5823", finanzen: "#265a62", inneres: "#4a3f6b", aussen: "#2f5a8a", justiz: "#6b4a3a", generalstab: "#4c5a3a", wirtschaft: "#265a62" };
const TYPEN: BefehlTyp[] = ["ziel", "vorhaben", "verhandeln"];

export function BefehlBlatt({ world, refresh }: { world: World; refresh: () => void }) {
  const sp = world.spiel;
  const [figurId, setFigurId] = useState<string | null>(null);
  const [wahl, setWahl] = useState<number | null>(null);
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const minister = useMemo(
    () => (sp?.figuren ?? []).filter((f) => f.imAmt && AEMTER[f.amt].regierungsamt).sort((a, b) => KABINETT_AMT.indexOf(a.amt) - KABINETT_AMT.indexOf(b.amt)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sp?.figuren.length, world.day],
  );
  const laufend = sp ? laufendeBefehle(world) : [];
  const f = minister.find((m) => m.id === (figurId ?? minister[0]?.id));
  const angebote: BefehlAngebot[] = useMemo(
    () => (f && sp ? befehlAngebote(world, f.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [f?.id, world.day, Math.floor(sp?.kapital ?? 0), laufend.length],
  );
  if (!sp) return <p>Ohne Spielschleife gibt es keine Befehle.</p>;
  const gewaehlt = wahl !== null ? angebote[wahl] : undefined;
  const v = gewaehlt ? befehlVorschau(world, gewaehlt.entwurf) : undefined;
  const auftraege = minister.filter((m) => eigenVon(world, m).auftrag?.status === "laeuft");

  const anordnen = () => {
    if (!gewaehlt) return;
    setAntwort(erteileBefehl(world, gewaehlt.entwurf));
    setWahl(null);
    refresh();
  };

  return (
    <div className="mf">
      {antwort && (
        <p className={`mf-rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
          {antwort.text}
          {antwort.why && <em>{antwort.why}</em>}
        </p>
      )}
      <div className="mf-befehle">
        <div className="mf-spalte">
          <h4>Wem?</h4>
          {minister.map((m) => {
            const busy = laufend.some((b) => b.figurId === m.id) || eigenVon(world, m).auftrag?.status === "laeuft";
            return (
              <button key={m.id} className={`mf-wahl${f?.id === m.id ? " on" : ""}${busy ? " beschaeftigt" : ""}`} onClick={() => { setFigurId(m.id); setWahl(null); }}>
                <span className="mf-gesicht">
                  <Zeichnung seed={m.name} size={72} geschlecht={m.weiblich ? "f" : "m"} tint={TINT[m.amt] ?? "#7c5823"} rolle={m.amt} />
                </span>
                <strong>
                  {m.rolle} {m.name}
                </strong>
                <span>
                  {AEMTER[m.amt].ressort} · {haltung(m)} · Leistung {Math.round(leistung(world, m) * 100)} %{busy ? " · beschäftigt" : ""}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mf-spalte">
          <h4>{f ? `Befehl an ${f.name}` : "Welcher Befehl?"}</h4>
          {!f && <p className="mf-leer">Wählen Sie links den Minister. Er führt aus, was Sie anordnen — mit Kosten, Dauer und der Chance, dass es gelingt. Wer Ihnen nicht mehr folgt, kann sich weigern.</p>}
          {f && angebote.length === 0 && <p className="mf-leer">Diesem Amt können Sie nichts befehlen.</p>}
          {f &&
            TYPEN.map((t) => {
              const liste = angebote.map((a, i) => ({ a, i })).filter((x) => x.a.entwurf.typ === t);
              if (!liste.length) return null;
              return (
                <div key={t}>
                  <p className="mf-typ">
                    {BEFEHL_NAMEN[t].label} <em>— {BEFEHL_NAMEN[t].kurz}</em>
                  </p>
                  <ul className="mf-angebote">
                    {liste.map(({ a, i }) => (
                      <li key={i}>
                        <button className={`mf-wahl${wahl === i ? " on" : ""}`} style={{ gridTemplateColumns: "minmax(0, 1fr)" }} onClick={() => setWahl(i)}>
                          <strong>{a.titel}</strong>
                          <span>{a.text}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

          {gewaehlt && v && (
            <section className="mf-vorschau" aria-live="polite">
              <h5>{gewaehlt.titel}</h5>
              <div className="mf-kosten">
                <span>{v.kosten.pk > 0 ? `${v.kosten.pk} Kapital` : "kein Kapital"}</span>
                <span className="leise">{v.kosten.aufmerksamkeit} Aufmerksamkeit jetzt</span>
                <span className="leise">
                  {v.dauerMonate} {v.dauerMonate === 1 ? "Monat" : "Monate"} bis zum Ergebnis
                </span>
              </div>
              {v.erfolgschance !== undefined && (
                <p className="mf-chance">
                  Erfolgsaussicht: {v.chanceWort} ({Math.round(v.erfolgschance * 100)} Prozent)
                  <i aria-hidden>
                    <b style={{ width: `${Math.round(v.erfolgschance * 100)}%` }} />
                  </i>
                </p>
              )}
              <ul className="mf-folgen">
                {v.folgen.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
              {v.risiko.length > 0 && (
                <ul className="mf-risiko">
                  {v.risiko.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              )}
              {!v.moeglich && <p className="mf-grund">{v.grund}</p>}
              <button className="pd-btn primary" disabled={!v.moeglich} onClick={anordnen} style={{ justifySelf: "start" }}>
                Anordnen
              </button>
            </section>
          )}
        </div>
      </div>

      <section className="mf-abschnitt">
        <h4>
          Was läuft{" "}
          <span className="pd-chip">
            {laufend.length} von höchstens {MAX_BEFEHLE} Befehlen
          </span>{" "}
          <span className="pd-chip">
            {auftraege.length} {auftraege.length === 1 ? "Auftrag" : "Aufträge"} mit Frist
          </span>
        </h4>
        {laufend.length + auftraege.length === 0 ? (
          <p className="mf-leer">Im Moment arbeitet kein Minister an einem Befehl von Ihnen.</p>
        ) : (
          <ul className="mf-laufend">
            {laufend.map((b) => {
              const m = minister.find((x) => x.id === b.figurId);
              return (
                <li key={b.id}>
                  {m ? <Zeichnung seed={m.name} size={44} geschlecht={m.weiblich ? "f" : "m"} tint={TINT[m.amt] ?? "#7c5823"} rolle={m.amt} rahmen="keiner" /> : <span />}
                  <span>
                    <strong>
                      {m?.rolle} {m?.name}
                    </strong>
                    <em>{BEFEHL_NAMEN[b.typ].label}: Ergebnis erwartet</em>
                  </span>
                  <span className="frist">{formatDateDe(addDays(sp.start.datum, b.faellig))}</span>
                </li>
              );
            })}
            {auftraege.map((m) => {
              const a = eigenVon(world, m).auftrag!;
              return (
                <li key={`a-${m.id}`}>
                  <Zeichnung seed={m.name} size={44} geschlecht={m.weiblich ? "f" : "m"} tint={TINT[m.amt] ?? "#7c5823"} rolle={m.amt} rahmen="keiner" />
                  <span>
                    <strong>
                      {m.rolle} {m.name}
                    </strong>
                    <em>Ziel: {a.text}</em>
                  </span>
                  <span className="frist">bis {formatDateDe(addDays(sp.start.datum, a.frist))}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

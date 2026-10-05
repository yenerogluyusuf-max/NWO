// Der Schreibtisch: nur das Wichtigste und Aktuellste. Oben die Lage in vier Zahlen und der Zustand des Präsidenten, darunter die
// Unterschriftenmappe — höchstens fünf Vorlagen, jede von dem Minister vorgelegt, der dafür zuständig ist, mit Empfehlung und Folgen —,
// daneben Fristen und die dringendsten Warnungen. Alles andere liegt eine Ebene tiefer: im Posteingang der Minister (Ministerrat),
// in „Heute“ (Politik), in der Zeitung und im aufklappbaren Bereich „Weiteres“. Die Rechnung steht in briefing.ts und sim/ministerfluss.ts.

import { useMemo, useState } from "react";
import type { World } from "../../sim/types";
import { addDays, formatDateDe } from "../../sim/dates";
import { zielStand } from "../../sim/ziele";
import { mentorNotes } from "../mentor";
import { Cameo } from "../art/Cameo";
import { Icon } from "../icons";
import { Mappe } from "../minister/Mappe";
import { schreibtischMappe } from "../../sim/ministerfluss";
import { faellig, kennzahlen, termine, verfassungSicht, warnungen as berechneWarnungen, type Kennzahl, type Ziel } from "./briefing";
import type { VorlagenZiel } from "../../sim/ministerfluss-typen";
import type { UmlaufEintrag } from "../autostopp";
import "../politik/design.css";
import "./schreibtisch.css";
import { DreiFragen } from "./DreiFragen";
import { offenerKonflikt, vorgaenge } from "../../sim/vorgaenge";
import { PROVINZEN } from "../../sim/regional";
import { t } from "../../i18n";

const TREND: Record<Kennzahl["trend"], string> = { auf: "▲", ab: "▼", gleich: "" };

/** Die vier Zahlen, die der Präsident jeden Morgen braucht; Arbeitslosigkeit und Probleme stehen in „Heute“ und in der Wirtschaft. */
const KENNZAHLEN = new Set(["zustimmung", "kapital", "mehrheit", "preise"]);

export function Schreibtisch({
  world,
  refresh,
  onGehe,
  umlauf,
  onKarte,
  onPosteingang,
  onVorgang,
}: {
  world: World;
  refresh: () => void;
  onGehe: (z: Ziel) => void;
  umlauf?: UmlaufEintrag[];
  /** Springt zur Karte (Ebene „Probleme“); fehlt der Aufruf, gibt es den Knopf nicht */
  onKarte?: (problemId?: string) => void;
  /** Öffnet den Posteingang der Minister; ohne Angabe öffnet sich der Ministerrat */
  onPosteingang?: () => void;
  /** Öffnet einen Vorgang in der Land-Akte (Reiter „Vorgänge“) */
  onVorgang?: (id: string) => void;
}) {
  const spiel = world.spiel;
  const [notiz, setNotiz] = useState<number | null>(null);

  // Die Rechnungen sind aufwendig: nur neu, wenn sich Tag, Kapital, Gesetze, Ereignisse, Zusagen oder das Lager ändern
  const schluessel = `${world.day}|${Math.floor(spiel?.kapital ?? 0)}|${Math.round(spiel?.verfassung?.aufmerksamkeit ?? 0)}|${Math.round(spiel?.verfassung?.belastung ?? 0)}|${spiel?.gesetze.length ?? 0}|${spiel?.ereignisse.length ?? 0}|${spiel?.zusagen.filter((z) => !z.erfuellt && !z.gebrochen).length ?? 0}|${spiel?.lager.length ?? 0}|${Object.keys(world.net.targets).length}`;
  // Der Schreibtisch braucht vom Tagesbriefing nur Zahlen, Fristen und Warnungen; die Empfehlungen des Stabs sind die Vorlagen der Minister
  const b = useMemo(() => {
    if (!world.spiel) return null;
    const tage = world.spiel.wahltag - world.day;
    return {
      datum: formatDateDe(world.date),
      amtszeit: { nummer: world.spiel.amtszeit, wahltag: formatDateDe(addDays(world.date, tage)), monateBisWahl: Math.max(0, Math.round(tage / 30.4)) },
      kennzahlen: kennzahlen(world),
      verfassung: verfassungSicht(world),
      faellig: faellig(world),
      warnungen: berechneWarnungen(world),
      termine: termine(world),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schluessel]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const notizen = useMemo(() => mentorNotes(world), [schluessel]);
  const ziele = zielStand(world);
  const geschah = [...world.log].reverse().filter((l) => l.kind !== "statistik").slice(0, 4);

  if (!spiel || !b) return <p>Ohne Spielschleife gibt es kein Briefing.</p>;

  const mappe = schreibtischMappe(world, 5);
  const dringend = mappe.mappe.filter((v) => v.frist !== undefined && v.frist <= 7).length;
  const posteingang = onPosteingang ?? (() => onGehe({ art: "akte", akte: "personen" }));
  // Vorlagen führen zu denselben Zielen wie die übrigen Einträge; die Karte ist ein Sonderfall der Bühne
  const gehe = (z: VorlagenZiel) => {
    if (z.art === "karte") return onKarte?.(z.problemId);
    onGehe(z as Ziel);
  };

  // Fristen: Abstimmungen, auslaufende Duldungen, Programmschritte und feste Termine; Ereignisse und Zusagen liegen als Vorlagen in der Mappe
  const fristen = [
    ...b.faellig
      .filter((f) => f.art === "gesetz" || f.art === "duldung" || f.art === "schritt")
      .map((f) => ({ id: f.id, text: f.titel, wann: f.tage === undefined ? "bereit" : f.tage <= 0 ? "heute" : `in ${f.tage} T`, tage: f.tage ?? 0, dringend: f.dringend, ziel: f.knopf.art === "gehe" ? f.knopf.ziel : undefined })),
    ...b.termine
      .filter((t) => !t.id.startsWith("g-") && !t.id.startsWith("z-"))
      .map((t) => ({ id: `t-${t.id}`, text: t.text, wann: t.datum, tage: t.tage, dringend: false, ziel: t.ziel })),
  ]
    .sort((a, c) => a.tage - c.tage)
    .slice(0, 5);

  // Laufende Vorgänge: wartende Entscheidungen zuerst, höchstens drei
  const laufendeVorgaenge = vorgaenge(world)
    .filter((v) => v.schritt !== "abgeschlossen" && v.schritt !== "aufgegeben")
    .sort((a, c) => Number(!!offenerKonflikt(c)) - Number(!!offenerKonflikt(a)) || c.beschluss - a.beschluss)
    .slice(0, 3);

  const [erste, ...weitereNotizen] = notizen;
  const warnungen = b.warnungen.slice(0, 2);
  const weitereWarnungen = b.warnungen.slice(2);

  return (
    <div className="sk">
      <header className="sk-kopf">
        <div className="sk-titel">
          <p className="pd-ueber">Tagesbriefing</p>
          <h3>{b.datum}</h3>
          <p className="pd-lead">
            {b.amtszeit.nummer}. Amtszeit · Wahl {b.amtszeit.monateBisWahl <= 1 ? "in Kürze" : `in ${b.amtszeit.monateBisWahl} Monaten`} ({b.amtszeit.wahltag})
            {dringend > 0 ? ` · ${dringend === 1 ? "eine Vorlage mit Frist diese Woche" : `${dringend} Vorlagen mit Frist diese Woche`}` : ""}
          </p>
        </div>
        <ul className="sk-kennzahlen vier" aria-label="Lage in einem Blick">
          {b.kennzahlen
            .filter((k) => KENNZAHLEN.has(k.id))
            .map((k) => (
              <li key={k.id}>
                <button className={`sk-kz ton-${k.ton}`} onClick={() => onGehe(k.ziel)} title={`${k.label}: Akte öffnen`}>
                  <span className="sk-kz-label">{k.label}</span>
                  <span className="sk-kz-wert">
                    {k.wert}
                    {k.trend !== "gleich" && <em className={`sk-trend ton-${k.ton}`}>{TREND[k.trend]}</em>}
                  </span>
                  <span className="sk-kz-zusatz">{k.zusatz}</span>
                </button>
              </li>
            ))}
        </ul>
      </header>
      <DreiFragen world={world} />

      {b.verfassung && (
        <div className={`sk-verfassung kompakt stufe-${b.verfassung.stufe}`} tabIndex={0} aria-label={`Zustand des Präsidenten: Aufmerksamkeit ${b.verfassung.aufmerksamkeit} von 100, Belastung ${b.verfassung.belastung} von 100, ${b.verfassung.stufeName}`}>
          <div className="sk-vf-zeilen">
            <div className="sk-vf-zeile">
              <span className="sk-vf-label">Aufmerksamkeit</span>
              <span className="sk-vf-balken" aria-hidden>
                <i className="auf" style={{ width: `${b.verfassung.aufmerksamkeit}%` }} />
              </span>
              <span className="sk-vf-wert">{b.verfassung.aufmerksamkeit}</span>
            </div>
            <div className="sk-vf-zeile">
              <span className="sk-vf-label">Belastung</span>
              <span className="sk-vf-balken" aria-hidden>
                <i className="bel" style={{ width: `${b.verfassung.belastung}%` }} />
              </span>
              <span className="sk-vf-wert">{b.verfassung.belastung}</span>
            </div>
          </div>
          <span className="sk-vf-stufe">
            {b.verfassung.stufeName}
            {b.verfassung.pauseBis ? ` · ruhige Tage bis ${b.verfassung.pauseBis}` : ""}
          </span>
          <div className="tip" role="tooltip">
            <strong>Der Zustand des Präsidenten</strong>
            <p>
              Jede Amtshandlung — Gesetz, Erlass, Gespräch, Verhandlung, Entscheidung im Reich — verbraucht Aufmerksamkeit; sie lädt sich täglich um 3 auf. Unter 20 wächst die
              Belastung, über 60 baut sie ab. {b.verfassung.fluss} Wer einen Minister mit dem Vorhaben beauftragt, spart den größten Teil.
            </p>
            {b.verfassung.treiber.length > 0 ? <p>Was die Belastung treibt: {b.verfassung.treiber.join("; ")}.</p> : <p>Kein Vorgang treibt die Belastung gerade nennenswert.</p>}
            {b.verfassung.stufe >= 1 && <p>Angespannt streuen Stimmenschätzungen breiter und Einbringungen verzögern sich mitunter; ab 70 erzwingt der Stab ruhige Tage, über 85 über Wochen droht der Zusammenbruch.</p>}
          </div>
        </div>
      )}

      <div className="sk-spalten">
        <div className="sk-haupt">
          <section className="sk-block">
            <h4>
              Unterschriftenmappe <span className="pd-chip">das Wichtigste, nach Rang</span>
            </h4>
            <Mappe world={world} refresh={refresh} max={5} onGehe={gehe} onPosteingang={posteingang} {...(onKarte ? { onKarte } : {})} />
          </section>
        </div>

        <aside className="sk-seite">
          <section className="sk-block">
            <h4>Fristen und Termine</h4>
            {fristen.length === 0 ? (
              <p className="pd-leise">Keine Frist in Sicht.</p>
            ) : (
              <ul className="sk-termine">
                {fristen.map((t) => (
                  <li key={t.id}>
                    <button className={`sk-termin${t.dringend ? " dringend" : ""}`} disabled={!t.ziel} onClick={() => t.ziel && onGehe(t.ziel)}>
                      <span className="sk-datum">{t.wann}</span>
                      <span>{t.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {onVorgang && laufendeVorgaenge.length > 0 && (
            <section className="sk-block">
              <h4>{t("vorgang.sprung.titel")}</h4>
              <ul className="sk-termine">
                {laufendeVorgaenge.map((v) => (
                  <li key={v.id}>
                    <button className={`sk-termin${offenerKonflikt(v) ? " dringend" : ""}`} onClick={() => onVorgang(v.id)} title={t("vorgang.sprung.zum")}>
                      <span className="sk-datum">{offenerKonflikt(v) ? t("vorgang.ui.entscheiden") : t(`vorgang.ui.schritt.${v.schritt}`)}</span>
                      <span>{t("vorgang.ui.titel", { ort: PROVINZEN[v.plaka - 1]?.name ?? String(v.plaka) })}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {warnungen.length > 0 && (
            <section className="sk-block">
              <h4>Warnungen</h4>
              <ul className="sk-warnungen">
                {warnungen.map((x) => (
                  <li key={x.id} className={`stufe-${x.stufe}`}>
                    <button className="sk-warnung" onClick={() => onGehe(x.ziel)} title="Ansehen und handeln">
                      <span className={`sk-punkt ${x.stufe}`} role="img" aria-label={x.stufe === "rot" ? "dringend" : "Achtung"} />
                      <span>
                        <strong>{x.text}</strong>
                        <em>{x.warum}</em>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {erste && (
            <section className="sk-block sk-mentor-zeile">
              <Cameo seed="Defne Arslan" figure="f" glasses size={32} tint="#265a62" />
              <div>
                <p>{erste.short}</p>
                {notiz === 0 ? <p className="mehr">{erste.more}</p> : <button className="pd-btn quiet klein" onClick={() => setNotiz(0)}>Mehr erklären</button>}
              </div>
            </section>
          )}
        </aside>
      </div>

      <details className="sk-mehr">
        <summary>
          Weiteres <span className="pd-chip">Ziele, Zeitung, Umlauf, Chronik</span>
        </summary>
        <div className="sk-mehr-inhalt">
          {ziele.length > 0 && (
            <section className="sk-block">
              <h4>Ihre Ziele</h4>
              <ul className="sk-ziele">
                {ziele.map((z) => (
                  <li key={z.def.id} className={z.erreicht ? "ja" : "offen"}>
                    <span aria-hidden>{z.erreicht ? "✓" : "○"}</span>
                    <span>
                      <strong>{z.def.titel}</strong>
                      <em>{z.stand}</em>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {weitereWarnungen.length > 0 && (
            <section className="sk-block">
              <h4>Weitere Warnungen</h4>
              <ul className="sk-warnungen">
                {weitereWarnungen.map((x) => (
                  <li key={x.id} className={`stufe-${x.stufe}`}>
                    <button className="sk-warnung" onClick={() => onGehe(x.ziel)}>
                      <span className={`sk-punkt ${x.stufe}`} aria-hidden />
                      <span>
                        <strong>{x.text}</strong>
                        <em>{x.warum}</em>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {weitereNotizen.length > 0 && (
            <section className="sk-block sk-mentor">
              <div className="sk-mentor-kopf">
                <Cameo seed="Defne Arslan" figure="f" glasses size={36} tint="#265a62" />
                <div>
                  <strong>Prof. Dr. Defne Arslan</strong>
                  <span>Mentorin · neutral</span>
                </div>
              </div>
              {weitereNotizen.map((n, i) => (
                <div key={i} className="sk-note">
                  <p>{n.short}</p>
                  {notiz === i + 1 ? <p className="mehr">{n.more}</p> : <button className="pd-btn quiet klein" onClick={() => setNotiz(i + 1)}>Mehr erklären</button>}
                </div>
              ))}
            </section>
          )}

          <section className="sk-block sk-zeitung">
            <h4>
              Die Zeitung
              {(spiel.zeitung?.ungelesen ?? 0) > 0 && <span className="sk-neue-ausgabe">Neue Ausgabe</span>}
            </h4>
            {spiel.zeitung?.archiv.length ? (
              (() => {
                const a = spiel.zeitung.archiv[spiel.zeitung.archiv.length - 1]!;
                const lead = a.blaetter.find((bl) => bl.artikel.length > 0);
                return (
                  <button className="sk-zeitung-teaser" onClick={() => onGehe({ art: "akte", akte: "zeitung" })} title="Ausgabe lesen">
                    <span className="sk-zeitung-mast">
                      {lead?.name ?? "Die Zeitung"} · Nr. {a.nummer}
                      {a.anlass === "eilmeldung" ? " · EIL" : ""}
                    </span>
                    <strong>{lead?.artikel[0]?.schlagzeile ?? ""}</strong>
                    <em>{formatDateDe(a.datum)}</em>
                  </button>
                );
              })()
            ) : (
              <p className="pd-leise">Die erste Ausgabe erscheint am Monatsersten.</p>
            )}
          </section>

          {umlauf && umlauf.length > 0 && (
            <section className="sk-block">
              <h4>Im Umlauf</h4>
              <p className="pd-leise">Routine ohne Entscheidung, seit dem letzten Halt gesammelt — nichts davon verlangt eine Antwort.</p>
              <ul className="sk-log">
                {[...umlauf].reverse().map((u) => (
                  <li key={u.id}>
                    <span className="sk-datum">{u.datum}</span>
                    <span>
                      <strong>{u.titel}</strong>
                      {u.text ? ` — ${u.text}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {geschah.length > 0 && (
            <section className="sk-block">
              <h4>Was zuletzt geschah</h4>
              <ul className="sk-log">
                {geschah.map((l, i) => (
                  <li key={`${l.day}-${i}`}>
                    <span className="sk-datum">{formatDateDe(l.date)}</span>
                    <span>{l.text}</span>
                  </li>
                ))}
              </ul>
              <button className="pd-btn quiet" onClick={() => onGehe({ art: "akte", akte: "chronik" })}>
                Ganze Chronik
              </button>
            </section>
          )}
        </div>
      </details>

      <nav className="sk-tueren" aria-label="Weiter zu">
        <button className="pd-btn" onClick={posteingang}>
          <Icon name="person" size={18} />
          <span>Alle Vorlagen und Befehle</span>
        </button>
        <button className="pd-btn" onClick={() => onGehe({ art: "akte", akte: "bereiche" })}>
          <Icon name="netz" size={18} />
          <span>Heute: Was jetzt ansteht</span>
        </button>
      </nav>
    </div>
  );
}

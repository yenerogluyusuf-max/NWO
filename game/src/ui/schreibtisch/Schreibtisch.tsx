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
import { rendere, t } from "../../i18n";

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

  if (!spiel || !b) return <p>{t("sk.ui.keinBriefing")}</p>;

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
      .map((f) => ({ id: f.id, text: f.titel, wann: f.tage === undefined ? t("sk.bereit") : t("sk.tageKurz", { n: Math.max(0, f.tage) }), tage: f.tage ?? 0, dringend: f.dringend, ziel: f.knopf.art === "gehe" ? f.knopf.ziel : undefined })),
    ...b.termine
      .filter((x) => !x.id.startsWith("g-") && !x.id.startsWith("z-"))
      .map((x) => ({ id: `t-${x.id}`, text: x.text, wann: x.datum, tage: x.tage, dringend: false, ziel: x.ziel })),
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
          <p className="pd-ueber">{t("sk.ui.ueber")}</p>
          <h3>{b.datum}</h3>
          <p className="pd-lead">
            {t("sk.ui.amtszeit", { n: b.amtszeit.nummer, monate: b.amtszeit.monateBisWahl, wahltag: b.amtszeit.wahltag })}
            {dringend > 0 ? t("sk.ui.dringend", { n: dringend }) : ""}
          </p>
        </div>
        <ul className="sk-kennzahlen vier" aria-label={t("sk.ui.lageAria")}>
          {b.kennzahlen
            .filter((k) => KENNZAHLEN.has(k.id))
            .map((k) => (
              <li key={k.id}>
                <button className={`sk-kz ton-${k.ton}`} onClick={() => onGehe(k.ziel)} title={t("sk.ui.akteOeffnen", { label: k.label })}>
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
        <div className={`sk-verfassung kompakt stufe-${b.verfassung.stufe}`} tabIndex={0} aria-label={t("sk.ui.vfAria", { a: b.verfassung.aufmerksamkeit, b: b.verfassung.belastung, stufe: b.verfassung.stufeName })}>
          <div className="sk-vf-zeilen">
            <div className="sk-vf-zeile">
              <span className="sk-vf-label">{t("sk.ui.aufmerksamkeit")}</span>
              <span className="sk-vf-balken" aria-hidden>
                <i className="auf" style={{ width: `${b.verfassung.aufmerksamkeit}%` }} />
              </span>
              <span className="sk-vf-wert">{b.verfassung.aufmerksamkeit}</span>
            </div>
            <div className="sk-vf-zeile">
              <span className="sk-vf-label">{t("sk.ui.belastung")}</span>
              <span className="sk-vf-balken" aria-hidden>
                <i className="bel" style={{ width: `${b.verfassung.belastung}%` }} />
              </span>
              <span className="sk-vf-wert">{b.verfassung.belastung}</span>
            </div>
          </div>
          <span className="sk-vf-stufe">
            {b.verfassung.stufeName}
            {b.verfassung.pauseBis ? t("sk.ui.ruhigBis", { datum: b.verfassung.pauseBis }) : ""}
          </span>
          <div className="tip" role="tooltip">
            <strong>{t("sk.ui.vfTitel")}</strong>
            <p>{t("sk.ui.vfText", { fluss: b.verfassung.fluss })}</p>
            {b.verfassung.treiber.length > 0 ? <p>{t("sk.ui.vfTreiber", { liste: b.verfassung.treiber.join("; ") })}</p> : <p>{t("sk.ui.vfKeinTreiber")}</p>}
            {b.verfassung.stufe >= 1 && <p>{t("sk.ui.vfAngespannt")}</p>}
          </div>
        </div>
      )}

      <div className="sk-spalten">
        <div className="sk-haupt">
          <section className="sk-block">
            <h4>
              {t("sk.ui.mappe")} <span className="pd-chip">{t("sk.ui.mappeChip")}</span>
            </h4>
            <Mappe world={world} refresh={refresh} max={5} onGehe={gehe} onPosteingang={posteingang} {...(onKarte ? { onKarte } : {})} />
          </section>
        </div>

        <aside className="sk-seite">
          <section className="sk-block">
            <h4>{t("sk.ui.fristen")}</h4>
            {fristen.length === 0 ? (
              <p className="pd-leise">{t("sk.ui.keineFrist")}</p>
            ) : (
              <ul className="sk-termine">
                {fristen.map((x) => (
                  <li key={x.id}>
                    <button className={`sk-termin${x.dringend ? " dringend" : ""}`} disabled={!x.ziel} onClick={() => x.ziel && onGehe(x.ziel)}>
                      <span className="sk-datum">{x.wann}</span>
                      <span>{x.text}</span>
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
              <h4>{t("sk.ui.warnungen")}</h4>
              <ul className="sk-warnungen">
                {warnungen.map((x) => (
                  <li key={x.id} className={`stufe-${x.stufe}`}>
                    <button className="sk-warnung" onClick={() => onGehe(x.ziel)} title={t("sk.ui.ansehenHandeln")}>
                      <span className={`sk-punkt ${x.stufe}`} role="img" aria-label={x.stufe === "rot" ? t("sk.ui.dringendAria") : t("sk.ui.achtungAria")} />
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
                {notiz === 0 ? <p className="mehr">{erste.more}</p> : <button className="pd-btn quiet klein" onClick={() => setNotiz(0)}>{t("sk.ui.mehrErklaeren")}</button>}
              </div>
            </section>
          )}
        </aside>
      </div>

      <details className="sk-mehr">
        <summary>
          {t("sk.ui.weiteres")} <span className="pd-chip">{t("sk.ui.weiteresChip")}</span>
        </summary>
        <div className="sk-mehr-inhalt">
          {ziele.length > 0 && (
            <section className="sk-block">
              <h4>{t("sk.ui.ziele")}</h4>
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
              <h4>{t("sk.ui.weitereWarnungen")}</h4>
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
                  <strong>{t("ui2.ui.schreibtisch.Schreibtisch.5fe7cd9")}</strong>
                  <span>{t("sk.ui.mentorin")}</span>
                </div>
              </div>
              {weitereNotizen.map((n, i) => (
                <div key={i} className="sk-note">
                  <p>{n.short}</p>
                  {notiz === i + 1 ? <p className="mehr">{n.more}</p> : <button className="pd-btn quiet klein" onClick={() => setNotiz(i + 1)}>{t("sk.ui.mehrErklaeren")}</button>}
                </div>
              ))}
            </section>
          )}

          <section className="sk-block sk-zeitung">
            <h4>
              {t("sk.ui.zeitung")}
              {(spiel.zeitung?.ungelesen ?? 0) > 0 && <span className="sk-neue-ausgabe">{t("sk.ui.neueAusgabe")}</span>}
            </h4>
            {spiel.zeitung?.archiv.length ? (
              (() => {
                const a = spiel.zeitung.archiv[spiel.zeitung.archiv.length - 1]!;
                const lead = a.blaetter.find((bl) => bl.artikel.length > 0);
                return (
                  <button className="sk-zeitung-teaser" onClick={() => onGehe({ art: "akte", akte: "zeitung" })} title={t("sk.ui.ausgabeLesen")}>
                    <span className="sk-zeitung-mast">
                      {lead?.name ?? t("sk.ui.zeitung")} · {t("sk.ui.nummer", { n: a.nummer })}
                      {a.anlass === "eilmeldung" ? ` · ${t("sk.ui.eil")}` : ""}
                    </span>
                    <strong>{lead?.artikel[0]?.schlagzeile ?? ""}</strong>
                    <em>{formatDateDe(a.datum)}</em>
                  </button>
                );
              })()
            ) : (
              <p className="pd-leise">{t("sk.ui.ersteAusgabe")}</p>
            )}
          </section>

          {umlauf && umlauf.length > 0 && (
            <section className="sk-block">
              <h4>{t("sk.ui.umlauf")}</h4>
              <p className="pd-leise">{t("sk.ui.umlaufText")}</p>
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
              <h4>{t("sk.ui.zuletzt")}</h4>
              <ul className="sk-log">
                {geschah.map((l, i) => (
                  <li key={`${l.day}-${i}`}>
                    <span className="sk-datum">{formatDateDe(l.date)}</span>
                    <span>{rendere(l.text)}</span>
                  </li>
                ))}
              </ul>
              <button className="pd-btn quiet" onClick={() => onGehe({ art: "akte", akte: "chronik" })}>
                {t("sk.ui.chronik")}
              </button>
            </section>
          )}
        </div>
      </details>

      <nav className="sk-tueren" aria-label={t("sk.ui.weiterAria")}>
        <button className="pd-btn" onClick={posteingang}>
          <Icon name="person" size={18} />
          <span>{t("sk.ui.alleVorlagen")}</span>
        </button>
        <button className="pd-btn" onClick={() => onGehe({ art: "akte", akte: "bereiche" })}>
          <Icon name="netz" size={18} />
          <span>{t("sk.ui.heute")}</span>
        </button>
      </nav>
    </div>
  );
}

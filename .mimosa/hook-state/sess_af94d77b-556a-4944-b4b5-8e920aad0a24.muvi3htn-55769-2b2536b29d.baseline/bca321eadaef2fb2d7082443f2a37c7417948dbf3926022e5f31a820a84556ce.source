// Die Umbildung nach der Wiederwahl als Kabinettstisch: Jede Ministerin und jeder Minister ist eine Porträtkarte mit Kennzahlen,
// Abzeichen und Aktionen (bestätigen, ersetzen, versetzen, einem Partner geben). Kandidaten erscheinen in einer Schublade, der
// Tausch läuft über einen zweiten Klick auf eine andere Karte, ein Folgenpanel zeigt, was die Entscheidungen bewirken.
// Reine Darstellung: Zustand und Kosten kommen aus der Simulation (sim/amtszeit.ts: umbildungSicht), die Entscheidungen gehen über Rückrufe zurück.

import { useEffect, useMemo, useRef, useState } from "react";
import { Corners, Flourish } from "../art/Ornament";
import { Portraet, RESSORT_FARBE, stimmungAus, type Stimmung } from "../art/Portraet";
import { PARTY_COLORS } from "../Parliament";
import { t } from "../../i18n";
import type { Bilanz } from "../../sim/bilanz";
import type { Aspirant } from "../../sim/spiel-typen";
import type { UmbildungMinister, UmbildungSicht } from "../../sim/amtszeit";
import "./wahl.css";

export interface UmbildungProps {
  sicht: UmbildungSicht;
  /** Vorhandenes Politisches Kapital (zur Anzeige und zum Sperren zu teurer Schritte) */
  kapital: number;
  /** Letzter Satz einer Aktion (Erfolg oder Fehler) */
  meldung?: string;
  /** Zwischenbilanz der abgelaufenen Amtszeit (aus erstelleBilanz(w, "zwischen")) */
  zwischenbilanz?: Bilanz;
  /** Nur in der letzten Amtszeit: die Anwärter auf die Nachfolge */
  aspiranten?: Aspirant[];
  onBehalten: (amt: UmbildungMinister["amt"]) => void;
  onErsetzen: (amt: UmbildungMinister["amt"], kandidatId: string) => void;
  onEntlassen: (amt: UmbildungMinister["amt"]) => void;
  onVersetzen: (a: UmbildungMinister["amt"], b: UmbildungMinister["amt"]) => void;
  onPartner: (amt: UmbildungMinister["amt"], partei: string) => void;
  onFertig: () => void;
  /** Das Fenster schließen, ohne die Umbildung abzuschließen (die Entscheidungen bleiben bis zum Ende des Fensters möglich) */
  onSpaeter?: () => void;
}

/** Kosten der Schritte in Kapital (wie in sim/amtszeit.ts; der Rabatt der ersten Wochen ist dort schon eingerechnet) */
const PREIS = { versetzen: 2, partner: 2, kommissarisch: 1 } as const;

const balken = (x: number): number => Math.max(0, Math.min(100, x));
const mittel = (xs: number[]): number => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

export const stimmungVon = (m: Pick<UmbildungMinister, "groll" | "kommissarisch" | "ehrgeiz" | "loyalitaet">): Stimmung => stimmungAus(m);

function willSchluessel(m: Pick<UmbildungMinister, "groll" | "kommissarisch" | "ehrgeiz" | "loyalitaet">): string {
  if (m.groll >= 40) return "groll";
  if (m.kommissarisch) return "kommissarisch";
  if (m.ehrgeiz >= 65) return "ehrgeiz";
  if (m.loyalitaet >= 70) return "treu";
  if (m.loyalitaet < 45) return "zweifel";
  return "sachlich";
}

// Kleine Sinnbilder für die drei Kennzahlen (Handschlag, Zahnrad, Flamme), 12 px
function Sinnbild({ art }: { art: "loyal" | "kompetenz" | "ehrgeiz" }) {
  return (
    <svg className="ub-ikon" width="14" height="14" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {art === "loyal" && <path d="M3 12l5 5 3-2 3 2 7-7M3 12l4-4 4 1 4-2 6 5M8 17l-2 2M11 15l-1.5 2" />}
      {art === "kompetenz" && (
        <>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" />
        </>
      )}
      {art === "ehrgeiz" && <path d="M12 21c-4 0-7-2.8-7-6.6 0-3 2-5 3.4-6.9.9-1.2 1.4-2.6 1.3-4.1 3 1.4 5 4.2 4.8 6.9 1.2-.5 2-1.6 2.3-2.9C19.7 9.3 19 12 19 14.4 19 18.2 16 21 12 21z" />}
    </svg>
  );
}

function Kennzahl({ art, name, wert }: { art: "loyal" | "kompetenz" | "ehrgeiz"; name: string; wert: number }) {
  return (
    <div className={`ub-wert ${art}`} title={`${name}: ${wert}`}>
      <Sinnbild art={art} />
      <span className="ub-wert-name">{name}</span>
      <b>{wert}</b>
      <i aria-hidden>
        <u style={{ width: `${balken(wert)}%` }} />
      </i>
    </div>
  );
}

function Krone() {
  return (
    <svg className="ub-krone" width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" />
    </svg>
  );
}

export function Umbildung({ sicht, kapital, meldung, zwischenbilanz, aspiranten, onBehalten, onErsetzen, onEntlassen, onVersetzen, onPartner, onFertig, onSpaeter }: UmbildungProps) {
  const [schublade, setSchublade] = useState<string | null>(null);
  const [tausch, setTausch] = useState<string | null>(null);
  const [blitz, setBlitz] = useState<string[]>([]);
  const erledigt = sicht.minister.filter((m) => m.entschieden).length;
  const anspruch = sicht.partner.filter((p) => p.anspruch > 0);
  const offenPartner = sicht.partner.filter((p) => p.anspruch > p.vergeben);
  const kronAmt = new Set((aspiranten ?? []).map((a) => a.amt));

  // Ausgangswerte beim Öffnen: Grundlage der Pfeile im Folgenpanel
  const start = useRef({ loyal: mittel(sicht.minister.map((m) => m.loyalitaet)), kapital });
  const loyalJetzt = mittel(sicht.minister.map((m) => m.loyalitaet));
  const pfeil = (jetzt: number, vorher: number, schwelle = 0.5): "auf" | "ab" | "gleich" => (jetzt - vorher > schwelle ? "auf" : vorher - jetzt > schwelle ? "ab" : "gleich");
  const pfLoyal = pfeil(loyalJetzt, start.current.loyal);
  const pfKapital = pfeil(kapital, start.current.kapital, 0.4);
  const marktNervoes = sicht.minister.some((m) => ["finanzen", "zentralbank", "wirtschaft"].includes(m.amt) && (m.entschieden === "ersetzt" || m.entschieden === "entlassen"));
  const offeneAnsprueche = offenPartner.reduce((s, p) => s + (p.anspruch - p.vergeben), 0);

  // Der Tausch lässt beide Karten kurz aufleuchten (nur mit Effekten, siehe wahl.css)
  const blitzen = (a: string, b: string) => {
    setBlitz([a, b]);
    window.setTimeout(() => setBlitz([]), 1000);
  };
  // Esc schließt Schublade und Tauschmodus
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (schublade || tausch) {
        e.stopPropagation();
        setSchublade(null);
        setTausch(null);
      }
    };
    window.addEventListener("keydown", f, true);
    return () => window.removeEventListener("keydown", f, true);
  }, [schublade, tausch]);

  const wahl = useMemo(() => sicht.minister.find((m) => m.amt === schublade) ?? null, [sicht.minister, schublade]);
  const tauscher = useMemo(() => sicht.minister.find((m) => m.amt === tausch) ?? null, [sicht.minister, tausch]);

  return (
    <div className="ub-layer" role="dialog" aria-modal="true" aria-labelledby="ub-titel">
      <article className="frame ub">
        <Corners />
        <header className="ub-kopf">
          <div className="ub-kopf-text">
            <p className="kicker">{sicht.anlass === "nachgereicht" ? t("umbildung.ui.kicker_nachgereicht") : t("umbildung.ui.kicker")}</p>
            <h2 id="ub-titel">{t("umbildung.ui.titel")}</h2>
            <Flourish width={150} />
            <p className="ub-einleitung">{t("umbildung.ui.einleitung", { tage: sicht.tageBisEnde, rabatt: Math.round((1 - sicht.rabatt) * 100) })}</p>
          </div>
          <div className="ub-kopf-zaehler" aria-live="polite">
            <span className="ub-zaehler-zahl">
              {erledigt}
              <small> / {sicht.minister.length}</small>
            </span>
            <span className="ub-zaehler-text">{t("umb2.zaehler", { n: erledigt, von: sicht.minister.length })}</span>
            <i className="ub-zaehler-balken" aria-hidden>
              <u style={{ width: `${(erledigt / Math.max(1, sicht.minister.length)) * 100}%` }} />
            </i>
          </div>
        </header>
        {meldung && (
          <p className="ub-meldung" role="status">
            {meldung}
          </p>
        )}
        {tauscher && (
          <p className="ub-tauschhinweis" role="status">
            <span>{t("umb2.tausch.hinweis", { name: tauscher.name })}</span>
            <button type="button" className="leather-button" onClick={() => setTausch(null)}>
              {t("umb2.tausch.abbrechen")}
            </button>
          </p>
        )}

        <div className="ub-koerper">
          <section className="ub-tisch" aria-label={t("umb2.tisch.aria")}>
            {sicht.minister.map((m, idx) => {
              const stim = stimmungVon(m);
              const farbe = RESSORT_FARBE[m.amt] ?? "#7c5823";
              const ziel = !!tauscher && tauscher.amt !== m.amt;
              const rivale = m.ehrgeiz >= 70 && m.loyalitaet < 55;
              return (
                <section
                  key={m.amt}
                  style={{ ["--i" as string]: idx }}
                  className={`ub-karte${m.entschieden ? ` erledigt ${m.entschieden}` : ""}${ziel ? " tauschziel" : ""}${blitz.includes(m.amt) ? " blitz" : ""}${tausch === m.amt ? " tauscht" : ""}`}
                >
                  <div className="ub-person">
                    <Portraet seed={m.name} geschlecht={m.weiblich ? "f" : "m"} tint={farbe} rolle={m.amt} stimmung={stim} size={150} titel={t("umb2.portraet", { name: m.name })} />
                    <div className="ub-name">
                      <span className="ub-band" style={{ background: farbe }}>
                        {m.rolle}
                      </span>
                      <h3>{m.name}</h3>
                      <div className="ub-abz">
                        {m.kommissarisch && <span className="ub-chip warn">{t("umb2.abz.kommissarisch")}</span>}
                        {kronAmt.has(m.amt) && (
                          <span className="ub-chip krone">
                            <Krone />
                            {t("umb2.abz.kronprinz")}
                          </span>
                        )}
                        {rivale && <span className="ub-chip warn">{t("umb2.abz.rivale")}</span>}
                        {m.groll >= 40 && <span className="ub-chip warn">{t("umb2.abz.groll")}</span>}
                      </div>
                    </div>
                  </div>
                  <p className="ub-will">{t(`umb2.will.${willSchluessel(m)}`)}</p>
                  <div className="ub-werte">
                    <Kennzahl art="loyal" name={t("umbildung.ui.loyalitaet")} wert={m.loyalitaet} />
                    <Kennzahl art="kompetenz" name={t("umbildung.ui.faehigkeit")} wert={m.faehigkeit} />
                    <Kennzahl art="ehrgeiz" name={t("umbildung.ui.ehrgeiz")} wert={m.ehrgeiz} />
                  </div>
                  <div className="ub-aktionen">
                    <button type="button" className="ub-akt" disabled={!sicht.offen || !!m.entschieden} onClick={() => onBehalten(m.amt)} title={t("umbildung.ui.behalten")}>
                      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12.5l5 5L20 6.5" />
                      </svg>
                      {t("umbildung.ui.behalten")}
                    </button>
                    <button type="button" className="ub-akt" disabled={!sicht.offen} aria-expanded={schublade === m.amt} onClick={() => setSchublade(schublade === m.amt ? null : m.amt)} title={t("umbildung.ui.ersetzen")}>
                      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 8h13l-3-3M20 16H7l3 3" />
                      </svg>
                      {t("umbildung.ui.ersetzen")}
                    </button>
                    <button type="button" className="ub-akt" disabled={!sicht.offen || kapital < PREIS.versetzen} aria-pressed={tausch === m.amt} onClick={() => setTausch(tausch === m.amt ? null : m.amt)} title={`${t("umbildung.ui.versetzen")} (${PREIS.versetzen})`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 4L3 8l4 4M3 8h12M17 20l4-4-4-4M21 16H9" />
                      </svg>
                      {t("umbildung.ui.versetzen")}
                    </button>
                  </div>
                  {anspruch.length > 0 && (
                    <div className="ub-parteien">
                      {anspruch.map((p) => (
                        <button
                          key={p.partei}
                          type="button"
                          className="ub-parteichip"
                          style={{ ["--pf" as string]: PARTY_COLORS[p.partei] ?? "#8a7a64" }}
                          disabled={!sicht.offen || kapital < PREIS.partner || !!m.entschieden || p.vergeben >= p.anspruch}
                          onClick={() => onPartner(m.amt, p.partei)}
                          title={t("umbildung.ui.an_partner", { partei: p.name })}
                        >
                          <i aria-hidden />
                          {t("umbildung.ui.an_partner", { partei: p.name })}
                        </button>
                      ))}
                    </div>
                  )}
                  {ziel && (
                    <button type="button" className="ub-tauschknopf" disabled={kapital < PREIS.versetzen} onClick={() => {
                      const von = tauscher!.amt;
                      onVersetzen(von, m.amt);
                      blitzen(von, m.amt);
                      setTausch(null);
                    }}>
                      {t("umb2.tausch.hierher", { pk: PREIS.versetzen })}
                    </button>
                  )}
                  {m.entschieden && <span className={`ub-stempel ${m.entschieden}`}>{t(`umbildung.ui.entschieden.${m.entschieden}`)}</span>}
                </section>
              );
            })}
          </section>

          <aside className="ub-seite">
            <section className="ub-folgen" aria-label={t("umb2.folgen.titel")}>
              <h3>{t("umb2.folgen.titel")}</h3>
              <ul>
                <li>
                  <span className={`ub-pfeil ${pfKapital}`} aria-hidden />
                  <span>
                    <b>{t("umb2.folgen.kapital")}</b>
                    <small>{Math.floor(kapital)}</small>
                  </span>
                </li>
                <li>
                  <span className={`ub-pfeil ${pfLoyal}`} aria-hidden />
                  <span>
                    <b>{t("umb2.folgen.loyalitaet")}</b>
                    <small>{Math.round(loyalJetzt)}</small>
                  </span>
                </li>
                <li>
                  <span className={`ub-pfeil ${anspruch.length === 0 ? "gleich" : offeneAnsprueche === 0 ? "auf" : "ab"}`} aria-hidden />
                  <span>
                    <b>{t("umb2.folgen.partner")}</b>
                    <small>{anspruch.length === 0 ? "–" : offeneAnsprueche === 0 ? t("umb2.folgen.partner_zufrieden") : t("umb2.folgen.partner_offen", { n: offeneAnsprueche })}</small>
                  </span>
                </li>
                <li>
                  <span className={`ub-pfeil ${marktNervoes ? "ab" : "gleich"}`} aria-hidden />
                  <span>
                    <b>{t("umb2.folgen.markt")}</b>
                    <small>{marktNervoes ? t("umb2.folgen.markt_nervoes") : t("umb2.folgen.markt_ruhig")}</small>
                  </span>
                </li>
              </ul>
            </section>

            {anspruch.length > 0 && (
              <section className="ub-partner" aria-label={t("umbildung.ui.partner_aria")}>
                {anspruch.map((p) => (
                  <div key={p.partei} className="ub-partnerzeile">
                    <i style={{ background: PARTY_COLORS[p.partei] ?? "#8a7a64" }} aria-hidden />
                    <span>{t("umbildung.ui.partner_anspruch", { partei: p.name, sitze: p.sitze, anspruch: p.anspruch, vergeben: p.vergeben })}</span>
                  </div>
                ))}
              </section>
            )}

            {aspiranten && aspiranten.length > 0 && (
              <section className="ub-kronprinzen" aria-label={t("umbildung.ui.kronprinzen")}>
                <h3>
                  <Krone />
                  {t("umbildung.ui.kronprinzen")}
                </h3>
                <ul>
                  {aspiranten.map((a) => (
                    <li key={a.amt}>
                      <Portraet seed={a.name} geschlecht={a.weiblich ? "f" : "m"} tint={RESSORT_FARBE[a.amt] ?? "#7c5823"} rolle={a.amt} stimmung={a.ehrgeiz >= 60 ? "selbstgefaellig" : "sicher"} size={76} />
                      <span>
                        <b>{a.name}</b>
                        <small>{a.rolle}</small>
                        <small>{t("umb2.kronprinz.werte", { staerke: a.staerke, ehrgeiz: a.ehrgeiz })}</small>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {zwischenbilanz && (
              <details className="ub-bilanz">
                <summary>{t("umbildung.ui.zwischenbilanz")}</summary>
                <table>
                  <tbody>
                    {zwischenbilanz.kennzahlen.map((k) => (
                      <tr key={k.name}>
                        <th>{k.name}</th>
                        <td>{k.start}</td>
                        <td aria-hidden>→</td>
                        <td>{k.ende}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {zwischenbilanz.ziele.length > 0 && (
                  <ul>
                    {zwischenbilanz.ziele.map((z) => (
                      <li key={z.titel}>
                        {z.erreicht ? "✓" : "✗"} {z.titel} · {z.stand}
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            )}
          </aside>
        </div>

        {wahl && (
          <aside className="ub-schublade" role="region" aria-label={t("umb2.schublade.titel", { rolle: wahl.rolle })}>
            <header>
              <h3>{t("umb2.schublade.titel", { rolle: wahl.rolle })}</h3>
              <button type="button" className="leather-button" onClick={() => setSchublade(null)}>
                {t("umb2.schublade.zu")}
              </button>
            </header>
            <div className="ub-schublade-liste">
              {wahl.kandidaten.length === 0 && <p>{t("umb2.schublade.keine")}</p>}
              {wahl.kandidaten.map((k) => (
                <article key={k.id} className="ub-kandidat">
                  <Portraet seed={k.name} tint={RESSORT_FARBE[wahl.amt] ?? "#7c5823"} rolle={wahl.amt} stimmung={k.loyalitaet >= 60 ? "sicher" : k.ehrgeiz >= 65 ? "selbstgefaellig" : "neutral"} size={112} titel={t("umb2.portraet", { name: k.name })} />
                  <div className="ub-kandidat-text">
                    <strong>{k.name}</strong>
                    <p className="herkunft">{k.herkunft}</p>
                    <p>
                      <b>{t("umb2.schublade.staerke")}:</b> {k.staerke}
                    </p>
                    <p>
                      <b>{t("umb2.schublade.schwaeche")}:</b> {k.schwaeche}
                    </p>
                    <div className="ub-mini">
                      <span title={`${t("umbildung.ui.loyalitaet")}: ${k.loyalitaet}`}>
                        <Sinnbild art="loyal" />
                        {k.loyalitaet}
                      </span>
                      <span title={`${t("umbildung.ui.faehigkeit")}: ${k.faehigkeit}`}>
                        <Sinnbild art="kompetenz" />
                        {k.faehigkeit}
                      </span>
                      <span title={`${t("umbildung.ui.ehrgeiz")}: ${k.ehrgeiz}`}>
                        <Sinnbild art="ehrgeiz" />
                        {k.ehrgeiz}
                      </span>
                    </div>
                  </div>
                  <button type="button" className="brass-button" disabled={kapital < k.pk} onClick={() => onErsetzen(wahl.amt, k.id)}>
                    {t("umbildung.ui.ernennen", { pk: k.pk })}
                  </button>
                </article>
              ))}
            </div>
            <footer>
              <button type="button" className="leather-button" onClick={() => onEntlassen(wahl.amt)} disabled={kapital < PREIS.kommissarisch}>
                {t("umbildung.ui.kommissarisch_einsetzen")}
              </button>
            </footer>
          </aside>
        )}

        <footer className="ub-fuss">
          <p>{t("umbildung.ui.fuss", { n: erledigt, von: sicht.minister.length, kapital: Math.floor(kapital) })}</p>
          <span className="ub-fuss-knoepfe">
            {onSpaeter && (
              <button type="button" className="leather-button" onClick={onSpaeter}>
                {t("umbildung.ui.spaeter")}
              </button>
            )}
            <button type="button" className="brass-button" onClick={onFertig}>
              {t("umbildung.ui.fertig")}
            </button>
          </span>
        </footer>
      </article>
    </div>
  );
}

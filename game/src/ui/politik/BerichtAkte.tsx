// Die Berichtsakte: Was Ihre Beschlüsse bewirkt haben (Wirkungsberichte nach 6 und 12 Monaten).
// Links die Berichte, nach Maßnahme gruppiert; rechts der gewählte Bericht mit Urteil und Begründung, Umsetzungsstand,
// Verlauf je Größe (echte Monatswerte), Provinzen, verbundenen Problemen und einer ehrlichen Aussage zur Zurechnung.
// Ältere Berichte ohne Zusatzdaten erscheinen als schlichte Liste der Veränderungen.

import { useMemo, useRef, useState } from "react";
import type { World } from "../../sim/types";
import { addDays, formatDateDe } from "../../sim/dates";
import { PROVINZEN } from "../../sim/regional";
import { veraenderung, type Bericht, type BerichtGroesse, type Bewertung } from "../../sim/berichte";
import "../bericht.css";
import { t } from "../../i18n";

type Phase = NonNullable<Bericht["phase"]>;

const PHASE_WORT: Record<Phase, string> = {
  wirkt: "Wirkt",
  gemischt: "Gemischte Bilanz",
  schwach: "Bisher kaum Wirkung",
  gegenlaeufig: "Keine gewünschte Wirkung",
  zu_frueh: "Noch zu früh",
};

const PHASE_KURZ: Record<Phase, string> = { wirkt: "wirkt", gemischt: "gemischt", schwach: "schwach", gegenlaeufig: "wirkt nicht", zu_frueh: "zu früh" };

const BEWERTUNG_WORT: Record<Bewertung, string> = {
  erwartet: "wie beabsichtigt",
  nebenwirkung: "Preis eingetreten",
  gegenlaeufig: "gegenläufig",
  unerwartet: "besser als erwartet",
  fremd: "andere Ursache",
  spaeter: "noch nicht fällig",
  ruhig: "kaum bewegt",
};

/** Die Kurzfassung beginnt mit dem Urteil („Wirkt: …“); im Aktenkopf steht das Urteil schon als Überschrift. */
const ohneUrteil = (kurz: string) => kurz.replace(/^(Wirkt|Gemischt|Keine gewünschte Wirkung|Bisher kaum Wirkung): /, "");
const phaseVon = (b: Bericht): Phase => b.phase ?? (b.urteil === "gut" ? "wirkt" : b.urteil === "gemischt" ? "gemischt" : b.urteil === "keine" ? "gegenlaeufig" : "schwach");
const nameVon = (b: Bericht) => b.name ?? b.titel.split(":")[0] ?? b.titel;
const schluessel = (b: Bericht) => `${b.massnahme}|${b.tag}|${b.monate}`;
const nf = (x: number) => x.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf2 = (x: number) => x.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const monate = (n: number) => `${n} ${n === 1 ? "Monat" : "Monate"}`;
const monateDativ = (n: number) => `${n} ${n === 1 ? "Monat" : "Monaten"}`;

function ortText(ort: number[] | null | undefined): string {
  if (!ort || ort.length === 0) return "landesweit";
  const namen = ort.slice(0, 3).map((p) => PROVINZEN[p - 1]?.name ?? `Provinz ${p}`);
  return `nur in ${namen.join(", ")}${ort.length > 3 ? ` und ${ort.length - 3} weiteren` : ""}`;
}

/** Verlaufskurve einer Größe: echte Monatswerte, gestrichelt der Stand beim Beschluss, Marken bei 6 und 12 Monaten. */
function Kurve({ werte, tage, ton, titel }: { werte: number[]; tage: number[]; ton: "gut" | "schlecht" | "neutral"; titel: string }) {
  const B = 200;
  const H = 56;
  const RAND = 5;
  if (werte.length < 2) return null;
  const n = werte.length;
  const t0 = tage[0] ?? 0;
  const tEnde = tage[tage.length - 1] ?? 0;
  const spanT = tEnde - t0 || 1;
  const xs = tage.length === n ? tage.map((t) => RAND + ((t - t0) / spanT) * (B - 2 * RAND)) : werte.map((_, i) => RAND + (i / (n - 1)) * (B - 2 * RAND));
  const lo = Math.min(...werte);
  const hi = Math.max(...werte);
  // Mindestens vier Indexpunkte Höhe: Rauschen soll nicht wie ein Absturz aussehen
  const span = Math.max(hi - lo, 4);
  const mitte = (hi + lo) / 2;
  const y = (v: number) => H - RAND - ((v - (mitte - span / 2)) / span) * (H - 2 * RAND);
  const punkte = werte.map((v, i) => `${xs[i]!.toFixed(1)},${y(v).toFixed(1)}`);
  const marken = [180, 360].filter((t) => tEnde >= t - 1 && tage.length === n);
  const letzter = werte.length - 1;
  return (
    <svg className={`ba-kurve ton-${ton}`} viewBox={`0 0 ${B} ${H}`} role="img" aria-label={titel}>
      <title>{titel}</title>
      <line className="ba-start" x1={RAND} x2={B - RAND} y1={y(werte[0]!)} y2={y(werte[0]!)} />
      {marken.map((t) => {
        const x = RAND + ((t - t0) / spanT) * (B - 2 * RAND);
        return (
          <g key={t}>
            <line className="ba-marke" x1={x} x2={x} y1={9} y2={H - 2} />
            <text className="ba-marke-text" x={Math.min(x, B - 10)} y={7} textAnchor="middle">
              {t === 180 ? "6 M" : "12 M"}
            </text>
          </g>
        );
      })}
      <polyline className="ba-linie" points={punkte.join(" ")} />
      <circle className="ba-punkt start" cx={xs[0]} cy={y(werte[0]!)} r={2.4} />
      <circle className="ba-punkt ende" cx={xs[letzter]} cy={y(werte[letzter]!)} r={3} />
    </svg>
  );
}

function tonVon(g: BerichtGroesse): "gut" | "schlecht" | "neutral" {
  return g.besser === true ? "gut" : g.besser === false ? "schlecht" : "neutral";
}

function ProvinzListe({ titel, liste }: { titel: string; liste: { name: string; delta: number }[] }) {
  if (liste.length === 0) return null;
  return (
    <p className="ba-regionen">
      <span>{titel}</span> {liste.map((r) => `${r.name} (${veraenderung(r.delta)})`).join(", ")}
    </p>
  );
}

function GroesseKarte({ g, tage }: { g: BerichtGroesse; tage: number[] }) {
  const istProblem = g.art === "problem";
  const einheit = "Punkte";
  return (
    <li className={`ba-karte bew-${g.bewertung}`}>
      <div className="ba-karte-text">
        <div className="ba-karte-kopf">
          <strong>{g.name}</strong>
          {g.stimmung && <span className="ba-soll">{t("ui.politik.BerichtAkte.312da1f")}</span>}
          {g.erwartet && <span className="ba-soll">soll {g.erwartet === "steigt" ? "steigen" : "sinken"}</span>}
          <span className={`ba-bewertung bew-${g.bewertung}`}>{g.bewertung === "ruhig" && g.besser === false ? "leicht verschlechtert" : BEWERTUNG_WORT[g.bewertung]}</span>
        </div>
        <p className="ba-zahlen">
          <span className="ba-von">{istProblem ? g.vorher : nf(g.vorher)}</span>
          <span className="ba-pfeil" aria-hidden="true">
            →
          </span>
          <span className="ba-nach">{istProblem ? g.nachher : nf(g.nachher)}</span>
          <span className={`ba-delta ton-${tonVon(g)}`}>
            {Math.abs(g.delta) < 0.05
              ? "unverändert"
              : istProblem
                ? `${Math.abs(g.delta)} ${Math.abs(g.delta) === 1 ? "Provinz" : "Provinzen"} ${g.delta < 0 ? "weniger" : "mehr"} akut`
                : `${veraenderung(g.delta)} ${einheit}`}
          </span>
        </p>
        {g.ursachen && g.ursachen.length > 0 && (
          <p className="ba-ursache">
            Entgegen dem Modell dieser Maßnahme. Eine Ursache ist wahrscheinlich: <strong>{g.ursachen.join(", ")}</strong>.
          </p>
        )}
        {g.warum && (
          <p className="ba-warum">
            {g.warum}
            {g.lag !== undefined && g.lag > 0 ? ` Wirkt frühestens nach etwa ${monateDativ(g.lag)}.` : ""}
          </p>
        )}
        {g.regionen && (
          <>
            <ProvinzListe titel="Am stärksten verbessert:" liste={g.regionen.besser} />
            <ProvinzListe titel="Am stärksten verschlechtert:" liste={g.regionen.schlechter} />
          </>
        )}
        {istProblem && g.entschaerft && <p className="ba-regionen"><span>Nicht mehr akut in:</span> {g.entschaerft.map((r) => r.name).join(", ")}</p>}
        {istProblem && g.neuAkut && <p className="ba-regionen"><span>{t("ui.politik.BerichtAkte.cb5d427")}</span> {g.neuAkut.map((r) => r.name).join(", ")}</p>}
      </div>
      {g.verlauf && g.verlauf.length > 1 && (
        <div className="ba-karte-kurve">
          <Kurve werte={g.verlauf} tage={tage} ton={tonVon(g)} titel={`Verlauf ${g.name}: ${nf(g.verlauf[0]!)} bis ${nf(g.verlauf[g.verlauf.length - 1]!)}`} />
          <span className="ba-kurve-legende">{t("ui.politik.BerichtAkte.06fe74f")}</span>
        </div>
      )}
    </li>
  );
}

function Detail({ b, onGehe }: { b: Bericht; onGehe?: (massnahmeId: string) => void }) {
  const phase = phaseVon(b);
  const direkt = (b.groessen ?? []).filter((g) => g.art === "groesse");
  const probleme = (b.groessen ?? []).filter((g) => g.art === "problem");
  const bewegteProbleme = probleme.filter((g) => g.delta !== 0);
  const ruhigeProbleme = probleme.filter((g) => g.delta === 0 && g.vorher > 0);
  const tage = b.verlaufTage ?? [0, 1];
  return (
    <article className="ba-bericht" aria-label={b.titel}>
      <header className="ba-kopf">
        <p className="ba-kicker">Amtliche Wirkungsüberprüfung · {monate(b.monate)} nach dem Beschluss</p>
        <h3>{nameVon(b)}</h3>
        <p className="ba-unter">
          {b.von !== undefined && b.auf !== undefined ? `Stufe ${Math.round(b.von)} auf ${Math.round(b.auf)}, ${ortText(b.ort)}` : b.titel}
          {b.beschlussDatum ? ` · beschlossen am ${formatDateDe(b.beschlussDatum)}` : ""} · Bericht vom {formatDateDe(b.datum)}
        </p>
        {onGehe && b.massnahme && (
          <button type="button" className="ba-gehe" onClick={() => onGehe(b.massnahme)}>
            {t("ui.politik.BerichtAkte.21b3ac7")}
          </button>
        )}
      </header>

      <section className={`ba-urteil phase-${phase}`} aria-label="Urteil">
        <p className="ba-urteil-wort">{PHASE_WORT[phase]}</p>
        {b.kurz && <p className="ba-urteil-kurz">{ohneUrteil(b.kurz)}</p>}
        {b.begruendung && b.begruendung.length > 0 ? (
          <ul>
            {b.begruendung.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : (
          <p className="ba-urteil-kurz">{b.hinweis}</p>
        )}
        {b.reife && b.reife.stand < 95 && (
          <div className="ba-reife">
            <div className="ba-reife-balken" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={b.reife.stand} aria-label="Umsetzungsstand">
              <i style={{ width: `${Math.max(2, b.reife.stand)}%` }} />
            </div>
            <p>
              Umsetzung {b.reife.stand} Prozent
              {b.reife.restMonate ? ` · volle Wirkung in etwa ${monateDativ(b.reife.restMonate)}` : ""}
              {b.reife.geplantMonate ? ` · geplante Dauer ${monate(b.reife.geplantMonate)}` : ""}
            </p>
          </div>
        )}
      </section>

      {b.groessen ? (
        <>
          {direkt.length > 0 && (
            <section>
              <h4>{t("ui.politik.BerichtAkte.abae981")}</h4>
              <p className="ba-erklaer">{t("ui.politik.BerichtAkte.0c0e428")}</p>
              <ul className="ba-karten">
                {direkt.map((g) => (
                  <GroesseKarte key={g.id} g={g} tage={tage} />
                ))}
              </ul>
              {b.regional === "einheitlich" && <p className="ba-erklaer">{t("ui.politik.BerichtAkte.2c7b2d3")}</p>}
            </section>
          )}
          {bewegteProbleme.length > 0 && (
            <section>
              <h4>Verbundene Probleme</h4>
              <p className="ba-erklaer">{t("ui.politik.BerichtAkte.266cc42")}</p>
              <ul className="ba-karten">
                {bewegteProbleme.map((g) => (
                  <GroesseKarte key={g.id} g={g} tage={tage} />
                ))}
              </ul>
            </section>
          )}
          {ruhigeProbleme.length > 0 && (
            <details className="ba-ruhig">
              <summary>Weitere Probleme in der Nähe, unverändert ({ruhigeProbleme.length})</summary>
              <ul>
                {ruhigeProbleme.map((g) => (
                  <li key={g.id}>
                    {g.name}: weiter in {g.nachher} {g.nachher === 1 ? "Provinz" : "Provinzen"} akut
                  </li>
                ))}
              </ul>
            </details>
          )}
          <section className="ba-zurechnung">
            <h4>{t("ui.politik.BerichtAkte.ca075ac")}</h4>
            <p>
              {t("ui.politik.BerichtAkte.600d358")}
            </p>
            {b.mitwirkend && b.mitwirkend.length > 0 && (
              <p>
                Gleichzeitig wirkten auf dieselben Größen: <strong>{b.mitwirkend.map((m) => m.name).join(", ")}</strong>.
              </p>
            )}
            {b.kosten && (
              <p>
                Haushalt laut Beschluss: {b.kosten.bipProJahr >= 0 ? "Mehrbelastung" : "Entlastung"} von {nf2(Math.abs(b.kosten.bipProJahr))} Prozent des BIP je Jahr, sobald die Maßnahme voll umgesetzt ist.
              </p>
            )}
          </section>
        </>
      ) : (
        <section>
          <h4>{t("ui.politik.BerichtAkte.3f02592")}</h4>
          <ul className="ba-alt">
            {b.zeilen.map((z) => (
              <li key={z}>{z}</li>
            ))}
          </ul>
          <p className="ba-erklaer">{b.hinweis}</p>
        </section>
      )}
    </article>
  );
}

export function BerichtAkte({ world, start, onGehe }: { world: World; start?: Bericht | null; onGehe?: (massnahmeId: string) => void }) {
  const spiel = world.spiel;
  const berichte = spiel?.berichte ?? [];
  const [gewaehlt, setGewaehlt] = useState<string | null>(start ? schluessel(start) : null);
  const wurzel = useRef<HTMLDivElement>(null);

  const sortiert = useMemo(() => [...berichte].sort((a, b) => b.tag - a.tag || b.monate - a.monate), [berichte]);
  const gruppen = useMemo(() => {
    const m = new Map<string, Bericht[]>();
    for (const b of sortiert) m.set(b.massnahme, [...(m.get(b.massnahme) ?? []), b]);
    return [...m.values()];
  }, [sortiert]);

  const aktuell = sortiert.find((b) => schluessel(b) === gewaehlt) ?? sortiert[0];

  // Was gerade beobachtet wird und wann der nächste Bericht fällig ist (Gesetze nach 6, 12 und 24 Monaten, dazu die Rückblicke auf Entscheidungen)
  const beobachtet = [
    ...(spiel?.beobachtungen ?? [])
      .filter((o) => !o.berichtet.includes(24))
      .map((o) => {
        const naechster = o.berichtet.includes(12) ? 24 : o.berichtet.includes(6) ? 12 : 6;
        return { key: `${o.id}-${o.tag}`, monate: naechster, name: o.name, text: `Stufe ${Math.round(o.von)} auf ${Math.round(o.auf)} · ${naechster}-Monats-Bericht am `, datum: addDays(world.date, o.tag + naechster * 30 - world.day) };
      }),
    ...(spiel?.rueckblicke ?? [])
      .filter((r) => !r.stumm && !r.berichtet.includes(24))
      .map((r) => {
        const naechster = r.berichtet.includes(12) ? 24 : r.berichtet.includes(6) ? 12 : 6;
        return { key: r.id, monate: naechster, name: r.name, text: t("takt.bericht.beobachtet", { monate: naechster }) + " ", datum: addDays(world.date, r.tag + naechster * 30 - world.day) };
      }),
  ]
    .sort((a, b) => a.datum.localeCompare(b.datum))
    .slice(0, 8);

  if (!aktuell) {
    return (
      <div className="ba ba-leer">
        <h3>{t("ui.politik.BerichtAkte.70f6fd8")}</h3>
        <p className="subtitle">{t("ui.politik.BerichtAkte.846026c")}</p>
        {beobachtet.length > 0 ? (
          <>
            <h4>Das wird beobachtet</h4>
            <ul className="ba-beobachtet">
              {beobachtet.map(({ key, name, text, datum }) => (
                <li key={key}>
                  <strong>{name}</strong>
                  <span>
                    {text}
                    {formatDateDe(datum)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="subtitle">{t("ui.politik.BerichtAkte.406517e")}</p>
        )}
      </div>
    );
  }

  return (
    <div className="ba" ref={wurzel}>
      <nav className="ba-liste" aria-label="Berichte">
        {gruppen.map((gruppe) => (
          <section key={gruppe[0]!.massnahme} className="ba-gruppe">
            <h4>{nameVon(gruppe[0]!)}</h4>
            <ul>
              {gruppe.map((b) => {
                const phase = phaseVon(b);
                const an = schluessel(b) === schluessel(aktuell);
                return (
                  <li key={schluessel(b)}>
                    <button type="button" className={`ba-eintrag phase-${phase}${an ? " an" : ""}`} aria-current={an ? "true" : undefined} onClick={() => {
                        setGewaehlt(schluessel(b));
                        // Der neue Bericht beginnt oben, auch wenn der alte weit gelesen war
                        window.requestAnimationFrame(() => wurzel.current?.scrollIntoView({ block: "start" }));
                      }}>
                      <span className="ba-eintrag-kopf">
                        <b>{monate(b.monate)} danach</b>
                        <em>{PHASE_KURZ[phase]}</em>
                      </span>
                      <span className="ba-eintrag-datum">{formatDateDe(b.datum)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {beobachtet.length > 0 && (
          <section className="ba-gruppe ba-bald">
            <h4>{t("ui.politik.BerichtAkte.ca9a16f")}</h4>
            <ul>
              {beobachtet.slice(0, 4).map(({ key, name, monate: m, datum }) => (
                <li key={key}>
                  <span className="ba-bald-name">{name}</span>
                  <span className="ba-eintrag-datum">
                    {m} Monate · {formatDateDe(datum)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </nav>
      <Detail b={aktuell} {...(onGehe ? { onGehe } : {})} />
    </div>
  );
}

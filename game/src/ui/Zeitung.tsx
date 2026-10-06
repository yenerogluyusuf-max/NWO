// Die Zeitung (UI-1): Titelseite im Atlas-Stil — Masthead, Datum, Leitartikel, Nebenartikel, Kasten „Zahlen des
// Monats“ (mit Verlauf), Lage im Land, Parlament, Ausland, Umfrage, Kommentar; Blätter als Reiter, Archiv der letzten
// zwölf Ausgaben. Dieselbe Realität in verschiedenen Framings; die Regulierungspreise der Medienhebel stehen als
// Referenz am Rand (REC-4 folgt). Eilmeldungen tragen eine Einordnung („Was feststeht“, „Was offen ist“) und einen
// Knopf zur passenden Akte.
//
// `onGehe` ist optional: Die Bühne reicht ihre `gehe`-Funktion durch (Ziele wie im Schreibtisch: Akte oder Land).
// Ohne sie erscheinen keine Knöpfe, und alles andere funktioniert unverändert.

import { useMemo, useState } from "react";
import type { World } from "../sim/types";
import { formatDateDe } from "../sim/dates";
import { kzBewertung } from "../data/zeitung_texte";
import {
  zeitungVon,
  type FramingArt,
  type ZeitungArtikel,
  type ZeitungAusgabe,
  type ZeitungBlatt,
  type ZeitungHandlung,
  type ZeitungKennzahl,
} from "../sim/zeitung";
import type { Ziel } from "./schreibtisch/briefing";
import { Flourish } from "./art/Ornament";
import { MedienAkte } from "./MedienAkte";
import { rsfSicht, startSelbstzensur } from "../sim/medien";
import { medienCluster } from "../data/medien";
import { t } from "../i18n";
import "./zeitung.css";

type Gehe = ((ziel: Ziel) => void) | undefined;

const TON_NAME: Record<FramingArt, string> = { regierungsnah: "regierungsnah", oppositionell: "oppositionell", neutral: "unabhängig" };

const SPARTE_NAME: Record<string, string> = { politik: "Politik", wirtschaft: "Wirtschaft", ereignis: "Im Land", programm: "Umsetzung", welt: "Ausland", umfrage: "Meinungslage" };

const nf = (x: number) => x.toLocaleString("de-DE", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

// ---------------------------------------------------------------------------
// Bausteine

/** Der Knopf einer Meldung: führt zur passenden Akte (nur wenn die Bühne ihn verdrahtet hat). */
function Handlung({ h, onGehe, klasse = "" }: { h: ZeitungHandlung | undefined; onGehe: Gehe; klasse?: string }) {
  if (!h || !onGehe) return null;
  return (
    <button type="button" className={`zt-gehe ${klasse}`.trim()} onClick={() => onGehe(h.ziel)}>
      {h.text} →
    </button>
  );
}

/** Was der Medienzustand zum Erscheinen sagte: vorsichtigere Redaktion, geschrumpfte oder gewachsene Auflage (sim/medien.ts). */
function BlattStand({ blatt }: { blatt: ZeitungBlatt }) {
  const cluster = medienCluster(blatt.clusterId);
  const hinweise: string[] = [];
  if (cluster && blatt.selbstzensur !== undefined && blatt.selbstzensur >= startSelbstzensur(cluster) + 15) hinweise.push(t("medien.zeitung.vorsicht"));
  if (blatt.reichweite !== undefined && blatt.reichweite <= 0.8) hinweise.push(t("medien.zeitung.auflage_minus"));
  if (blatt.reichweite !== undefined && blatt.reichweite >= 1.15) hinweise.push(t("medien.zeitung.auflage_plus"));
  if (hinweise.length === 0) return null;
  return <p className="zt-blattstand">{hinweise.join(" · ")}</p>;
}

function Masthead({ ausgabe, blatt }: { ausgabe: ZeitungAusgabe; blatt: ZeitungBlatt }) {
  return (
    <header className="zt-masthead">
      <p className="zt-zeile-oben">
        <span>{formatDateDe(ausgabe.datum)}</span>
        <span>
          Ausgabe Nr. {ausgabe.nummer}
          {ausgabe.anlass === "eilmeldung" && <em className="zt-eil">Eilmeldung</em>}
        </span>
        <span>{blatt.digital ? "Erscheint im Netz" : "Erscheint gedruckt"}</span>
      </p>
      <h3 className="zt-blattname">{blatt.name}</h3>
      <p className="zt-unterzeile">{blatt.unterzeile}</p>
      <p className="zt-zeile-unten">
        <span>{TON_NAME[blatt.ton]}</span>
        <Flourish width={180} />
        <span>{blatt.digital ? "heute aktualisiert" : "Preis: eine Kleinigkeit"}</span>
      </p>
      <BlattStand blatt={blatt} />
    </header>
  );
}

function Einordnung({ a }: { a: ZeitungArtikel }) {
  const e = a.einordnung;
  if (!e || (e.feststeht.length === 0 && e.offen.length === 0)) return null;
  return (
    <div className="zt-einordnung" aria-label={t("ui.Zeitung.6019c8a")}>
      {e.feststeht.length > 0 && (
        <section>
          <h5>Was feststeht</h5>
          <ul>
            {e.feststeht.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}
      {e.offen.length > 0 && (
        <section>
          <h5>{t("ui.Zeitung.fddeb73")}</h5>
          <ul>
            {e.offen.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Artikel({ a, lead, onGehe }: { a: ZeitungArtikel; lead?: boolean; onGehe: Gehe }) {
  return (
    <article className={`${lead ? "zt-lead" : ""}${a.kurz ? " zt-kurz" : ""}`.trim()} aria-label={lead ? "Leitartikel" : undefined}>
      <p className="zt-sparte">{SPARTE_NAME[a.sparte] ?? "Politik"}</p>
      {lead ? <h4 className="zt-schlagzeile">{a.schlagzeile}</h4> : <h5 className="zt-schlagzeile">{a.schlagzeile}</h5>}
      {a.text.map((t, i) => (
        <p key={i} className="zt-artikel-text">
          {t}
        </p>
      ))}
      <Einordnung a={a} />
      <Handlung h={a.handlung} onGehe={onGehe} klasse={lead ? "gross" : ""} />
    </article>
  );
}

// --- Kästen -----------------------------------------------------------------

function Sparkline({ werte, bewertung }: { werte: number[]; bewertung: "gut" | "schlecht" | "" }) {
  if (werte.length < 3) return null;
  const w = 84;
  const h = 24;
  const pad = 2.5;
  const min = Math.min(...werte);
  const max = Math.max(...werte);
  const spanne = max - min || 1;
  const pts = werte.map((v, i) => [pad + (i / (werte.length - 1)) * (w - 2 * pad), h - pad - ((v - min) / spanne) * (h - 2 * pad)] as const);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const letzte = pts[pts.length - 1]!;
  return (
    <svg className={`zt-spark ${bewertung}`} viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={`Verlauf der letzten ${werte.length} Werte`}>
      <path d={d} />
      <circle cx={letzte[0]} cy={letzte[1]} r="2.2" />
    </svg>
  );
}

function wertText(k: ZeitungKennzahl): string {
  return k.id === "lira" ? nf(k.wert) : `${nf(k.wert)} %`;
}

function Zahlenkasten({ zahlen, ton }: { zahlen: ZeitungKennzahl[]; ton: FramingArt }) {
  // Die Lesart ordnet: Regierungsnahe stellen Günstiges nach vorn, Oppositionelle Ungünstiges; unabhängig bleibt in fester Reihenfolge
  const liste = ton === "neutral" ? zahlen : [...zahlen].sort((a, b) => (ton === "regierungsnah" ? kzBewertung(b) - kzBewertung(a) : kzBewertung(a) - kzBewertung(b)));
  return (
    <aside className="zt-kasten zt-zahlen" aria-label={t("ui.Zeitung.8357699")}>
      <h5>{t("ui.Zeitung.8357699")}</h5>
      <ul>
        {liste.map((k) => {
          const d = k.vorher === undefined ? undefined : k.wert - k.vorher;
          const bewegt = d !== undefined && Math.abs(d) >= 0.05;
          const b = kzBewertung(k);
          const klasse = !bewegt ? "" : b > 0.05 ? "gut" : b < -0.05 ? "schlecht" : "";
          return (
            <li key={k.id}>
              <span className="zt-zahl-name">
                {k.name}
                {k.stand && <small>{k.stand}</small>}
              </span>
              <span className="zt-zahl-wert">{wertText(k)}</span>
              <span className={`zt-zahl-delta ${klasse}`} title={bewegt ? `Vormonat: ${nf(k.vorher!)}` : "unverändert zum Vormonat"}>
                {bewegt ? `${d! > 0 ? "▲" : "▼"} ${nf(Math.abs(d!))}` : "—"}
              </span>
              {k.verlauf && <Sparkline werte={k.verlauf} bewertung={klasse === "gut" ? "gut" : klasse === "schlecht" ? "schlecht" : ""} />}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function Lagekasten({ ausgabe, onGehe }: { ausgabe: ZeitungAusgabe; onGehe: Gehe }) {
  const lage = ausgabe.lage ?? [];
  if (!lage.length) return null;
  return (
    <aside className="zt-kasten zt-lage" aria-label={t("ui.Zeitung.be6b02b")}>
      <h5>{t("ui.Zeitung.be6b02b")}</h5>
      <ul>
        {lage.map((p) => {
          const trend = p.vorher === undefined ? "" : p.provinzen > p.vorher ? "schlecht" : p.provinzen < p.vorher ? "gut" : "";
          return (
            <li key={p.id}>
              <span className="zt-lage-name">{p.name}</span>
              <span className="zt-lage-zahl">
                {p.provinzen} {p.provinzen === 1 ? "Provinz" : "Provinzen"}
                {trend && (
                  <em className={trend} title={`Vormonat: ${p.vorher}`}>
                    {p.provinzen > p.vorher! ? " ▲" : " ▼"}
                  </em>
                )}
              </span>
              <span className="zt-balken" role="img" aria-label={`${Math.round(p.anteil * 100)} Prozent der Bevölkerung betroffen`}>
                <i style={{ width: `${Math.max(4, Math.round(p.anteil * 100))}%` }} />
              </span>
              <span className="zt-lage-ort">
                {Math.round(p.anteil * 100)} % der Bevölkerung · am stärksten {p.schlimmste}
              </span>
            </li>
          );
        })}
      </ul>
      {onGehe && (
        <button type="button" className="zt-gehe" onClick={() => onGehe({ art: "akte", akte: "bereiche" })}>
          {t("ui.Zeitung.0f54d8c")}
        </button>
      )}
    </aside>
  );
}

function Parlamentkasten({ ausgabe, onGehe }: { ausgabe: ZeitungAusgabe; onGehe: Gehe }) {
  const p = ausgabe.parlament;
  if (!p) return null;
  const anteil = (n: number) => `${(n / 600) * 100}%`;
  return (
    <aside className="zt-kasten zt-parlament" aria-label="Parlament">
      <h5>Parlament</h5>
      <p className="zt-parl-zeile">
        Regierungslager <strong>{p.lager}</strong> von 600 Sitzen
        {p.duldung > 0 && <> · geduldet {p.duldung}</>}
      </p>
      <div className="zt-sitze" role="img" aria-label={`Das Lager hält ${p.lager} Sitze, die Mehrheit liegt bei ${p.noetig}`}>
        <i className="lager" style={{ width: anteil(p.lager) }} />
        {p.duldung > 0 && <i className="duldung" style={{ width: anteil(p.duldung) }} />}
        <b style={{ left: anteil(p.noetig) }} title={`Mehrheit: ${p.noetig}`} />
      </div>
      <p className="zt-parl-meta">
        Mehrheit ab {p.noetig}: {p.lager + p.duldung >= p.noetig ? `${p.lager + p.duldung - p.noetig + 1} Stimmen Spielraum` : `${p.noetig - p.lager - p.duldung} Stimmen fehlen`}.
      </p>
      {p.gesetze.length > 0 && <p className="zt-parl-meta">Im Parlament: {p.gesetze.join(", ")}.</p>}
      {onGehe && (
        <button type="button" className="zt-gehe" onClick={() => onGehe({ art: "akte", akte: "parlament" })}>
          Zum Parlament →
        </button>
      )}
    </aside>
  );
}

function Auslandkasten({ ausgabe, onGehe }: { ausgabe: ZeitungAusgabe; onGehe: Gehe }) {
  const zeilen = ausgabe.ausland ?? [];
  if (!zeilen.length) return null;
  return (
    <aside className="zt-kasten zt-ausland" aria-label="Ausland">
      <h5>Ausland</h5>
      <ul>
        {zeilen.slice(0, 5).map((z, i) => (
          <li key={i}>
            {onGehe && z.ziel ? (
              <button type="button" className="zt-zeile-link" onClick={() => onGehe(z.ziel!)}>
                {z.text}
              </button>
            ) : (
              z.text
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}

function UmfrageKasten({ ausgabe }: { ausgabe: ZeitungAusgabe }) {
  if (!ausgabe.umfrage && ausgabe.umfrageVerbot) {
    return (
      <aside className="zt-umfrage schublade">
        <h5>{t("medien.zeitung.umfrage_titel")}</h5>
        <p>{t("medien.zeitung.umfrage_verbot")}</p>
      </aside>
    );
  }
  if (!ausgabe.umfrage) {
    return ausgabe.umfrageSchublade ? (
      <aside className="zt-umfrage schublade">
        <h5>{t("ui.Zeitung.b283308")}</h5>
        <p>
          Erscheint nicht: {ausgabe.umfrageSchublade} hat gemessen und das Ergebnis in der Schublade gelassen. Man darf mutmaßen, warum.
        </p>
      </aside>
    ) : null;
  }
  const u = ausgabe.umfrage;
  const delta = u.vormonat !== undefined ? u.wert - u.vormonat : undefined;
  return (
    <aside className="zt-umfrage" aria-label={t("ui.Zeitung.36afc3a")}>
      <h5>{t("ui.Zeitung.b283308")}</h5>
      <p className="zt-umfrage-institut">{u.institut}</p>
      <p className="zt-umfrage-wert">
        {nf(u.wert)} <span className="zt-umfrage-prozent">Prozent</span>
        {delta !== undefined && Math.abs(delta) >= 0.05 && (
          <em className={delta >= 0 ? "auf" : "ab"}>
            {delta >= 0 ? "▲" : "▼"} {nf(Math.abs(delta))}
          </em>
        )}
      </p>
      <p className="zt-umfrage-meta">
        Zustimmung zur Regierung{u.stichprobe !== undefined ? ` · ${u.stichprobe.toLocaleString("de-DE")} Befragte` : " · Stichprobe nicht offengelegt"} · Methode {u.methode}
      </p>
    </aside>
  );
}

function Kommentar({ blatt }: { blatt: ZeitungBlatt }) {
  const k = blatt.kommentar;
  if (!k) return null;
  return (
    <aside className={`zt-kommentar ton-${blatt.ton}`} aria-label="Kommentar">
      <p className="zt-sparte">Kommentar · {blatt.name}</p>
      <h5 className="zt-schlagzeile">{k.titel}</h5>
      {k.text.map((t, i) => (
        <p key={i} className="zt-artikel-text">
          {t}
        </p>
      ))}
    </aside>
  );
}

// --- Seite ------------------------------------------------------------------

function Frontseite({ ausgabe, blatt, onGehe }: { ausgabe: ZeitungAusgabe; blatt: ZeitungBlatt; onGehe: Gehe }) {
  const [lead, ...rest] = blatt.artikel;
  const hatKasten = !!(ausgabe.zahlen?.length || ausgabe.lage?.length || ausgabe.parlament || ausgabe.ausland?.length || ausgabe.umfrage || ausgabe.umfrageSchublade);
  // Genug Text: Die Kästen stehen als Seitenleiste daneben. Eine kurze Seite (etwa die Eilmeldung) legt sie in ein Raster darunter.
  const seitlich = hatKasten && blatt.artikel.length >= 3;
  // Die Lesart ordnet auch die Kästen: Regierungsnahe zuerst Zahlen und Parlament, Oppositionelle zuerst die Lage
  const kaesten = (() => {
    const zahlen = ausgabe.zahlen?.length ? <Zahlenkasten key="zahlen" zahlen={ausgabe.zahlen} ton={blatt.ton} /> : null;
    const lage = <Lagekasten key="lage" ausgabe={ausgabe} onGehe={onGehe} />;
    const parl = <Parlamentkasten key="parl" ausgabe={ausgabe} onGehe={onGehe} />;
    const aus = <Auslandkasten key="aus" ausgabe={ausgabe} onGehe={onGehe} />;
    const umf = <UmfrageKasten key="umf" ausgabe={ausgabe} />;
    return blatt.ton === "oppositionell" ? [lage, zahlen, aus, parl, umf] : blatt.ton === "regierungsnah" ? [zahlen, parl, aus, lage, umf] : [zahlen, lage, parl, aus, umf];
  })();
  return (
    <div className="zt-seite">
      <Masthead ausgabe={ausgabe} blatt={blatt} />
      <div className={`zt-koerper${hatKasten ? (seitlich ? " mit-kasten" : " unten") : ""}`}>
        <div className="zt-text">
          {lead && <Artikel a={lead} lead onGehe={onGehe} />}
          {rest.length > 0 && (
            <div className="zt-spalten">
              {rest.map((a) => (
                <Artikel key={a.id} a={a} onGehe={onGehe} />
              ))}
            </div>
          )}
          <Kommentar blatt={blatt} />
          {blatt.verschwiegen.length > 0 && (
            <p className="zt-verschwiegen">
              <strong>Nicht in dieser Ausgabe:</strong> {blatt.verschwiegen.join(" · ")}
            </p>
          )}
        </div>
        {hatKasten && <div className="zt-kaesten">{kaesten}</div>}
      </div>
    </div>
  );
}

/** Kurzer Stand der Pressefreiheit am Rand der Zeitung; die Eingriffe selbst stehen im Reiter „Medien“. */
function MedienHinweis({ world, onMedien }: { world: World; onMedien: () => void }) {
  const rsf = rsfSicht(world);
  return (
    <section className="zt-regulierung" aria-label={t("medien.zeitung.rsf_titel")}>
      <h5>{t("medien.zeitung.rsf_titel")}</h5>
      <p className="zt-reg-hinweis">{t("medien.zeitung.rsf_text", { rang: rsf.rang, score: nf(rsf.score) })}</p>
      <button type="button" className="zt-medien-knopf" onClick={onMedien}>
        {t("medien.zeitung.zu_medien")} →
      </button>
    </section>
  );
}

/** Die Zeile eines Archiveintrags: die Leitüberschrift des unabhängigen (sonst ersten) Blattes und ein Stimmungsmarker. */
function archivKopf(a: ZeitungAusgabe): { titel: string; stimmung: "auf" | "ab" | "" } {
  const blatt = a.blaetter.find((b) => b.ton === "neutral" && b.artikel.length > 0) ?? a.blaetter.find((b) => b.artikel.length > 0);
  const lead = blatt?.artikel[0];
  if (!lead) return { titel: "—", stimmung: "" };
  return { titel: lead.schlagzeile, stimmung: lead.wirkung > 0.05 ? "auf" : lead.wirkung < -0.05 ? "ab" : "" };
}

export function Zeitung({ world, onGehe, onAenderung }: { world: World; onGehe?: (ziel: Ziel) => void; onAenderung?: () => void }) {
  const spiel = world.spiel;
  const z = spiel ? zeitungVon(world) : null;
  const [ausgabeIdx, setAusgabeIdx] = useState<number | null>(null);
  const [blattIdx, setBlattIdx] = useState(0);
  const [ansicht, setAnsicht] = useState<"ausgaben" | "medien">("ausgaben");

  const archiv = z?.archiv ?? [];
  const ausgabe = archiv[ausgabeIdx ?? archiv.length - 1];
  // Beim Blattwechsel die Ausgabe merken; bei Ausgabenwechsel beginnt man vorn
  const blatt = useMemo(() => {
    if (!ausgabe) return undefined;
    return ausgabe.blaetter[Math.min(blattIdx, ausgabe.blaetter.length - 1)];
  }, [ausgabe, blattIdx]);

  if (!spiel) return <p>{t("ui.Zeitung.b1ebc59")}</p>;
  const reiter = (
    <nav className="zt-reiter" role="tablist" aria-label={t("medien.zeitung.reiter")}>
      <button type="button" role="tab" aria-selected={ansicht === "ausgaben"} className={ansicht === "ausgaben" ? "on" : ""} onClick={() => setAnsicht("ausgaben")}>
        {t("medien.zeitung.reiter_ausgaben")}
      </button>
      <button type="button" role="tab" aria-selected={ansicht === "medien"} className={ansicht === "medien" ? "on" : ""} onClick={() => setAnsicht("medien")}>
        {t("medien.zeitung.reiter_medien")}
      </button>
    </nav>
  );
  if (ansicht === "medien")
    return (
      <div className="zt-huelle">
        {reiter}
        <MedienAkte world={world} {...(onAenderung ? { onAenderung } : {})} />
      </div>
    );
  if (!z || !ausgabe || !blatt)
    return (
      <div className="zt-huelle">
        {reiter}
        <div className="zt">
          <p className="subtitle">{t("ui.Zeitung.48a6e01")}</p>
        </div>
      </div>
    );

  return (
    <div className="zt-huelle">
      {reiter}
      <div className="zt">
        <div className="zt-haupt">
          <nav className="zt-blaetter" role="tablist" aria-label={t("ui.Zeitung.6a8c814")}>
            {ausgabe.blaetter.map((b, i) => (
              <button key={b.clusterId} role="tab" aria-selected={b === blatt} className={`zt-blatt-tab ton-${b.ton}${b === blatt ? " on" : ""}`} onClick={() => setBlattIdx(i)}>
                <strong>{b.name}</strong>
                <span>{TON_NAME[b.ton]}</span>
              </button>
            ))}
          </nav>
          {ausgabe.gesperrt && ausgabe.gesperrt.length > 0 && (
            <p className="zt-gesperrt" role="note">
              <strong>{t("medien.zeitung.nicht_erschienen")}</strong>{" "}
              {ausgabe.gesperrt.map((g) => `${g.name} (${t(`medien.sperre.${g.grund}`)})`).join(" · ")}
            </p>
          )}
          <Frontseite ausgabe={ausgabe} blatt={blatt} onGehe={onGehe} />
        </div>

        <aside className="zt-rand">
          <section className="zt-archiv" aria-label={t("ui.Zeitung.db0bb89")}>
            <h5>Archiv</h5>
            <ul>
              {[...archiv].reverse().map((a) => {
                const i = archiv.indexOf(a);
                const kopf = archivKopf(a);
                return (
                  <li key={a.nummer}>
                    <button
                      className={a === ausgabe ? "on" : ""}
                      aria-current={a === ausgabe ? "true" : undefined}
                      onClick={() => {
                        setAusgabeIdx(i);
                        setBlattIdx(0);
                      }}
                    >
                      <span className="zt-archiv-nr">
                        Nr. {a.nummer}
                        {a.anlass === "eilmeldung" && <em>EIL</em>}
                      </span>
                      <span className="zt-archiv-datum">{formatDateDe(a.datum)}</span>
                      <span className="zt-archiv-lead">
                        {kopf.stimmung && <i className={`zt-marke ${kopf.stimmung}`} aria-label={kopf.stimmung === "auf" ? "gute Nachricht" : "schlechte Nachricht"} />}
                        {kopf.titel}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
          <MedienHinweis world={world} onMedien={() => setAnsicht("medien")} />
        </aside>
      </div>
    </div>
  );
}

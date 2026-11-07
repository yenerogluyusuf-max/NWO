// Die Zeitung (UI-1): Titelseite im Atlas-Stil — Masthead, Datum, Leitartikel, Nebenartikel, Kasten „Zahlen des
// Monats“ (mit Verlauf), Lage im Land, Parlament, Ausland, Umfrage, Kommentar; Blätter als Reiter, Archiv der letzten
// zwölf Ausgaben. Dieselbe Realität in verschiedenen Framings; die Regulierungspreise der Medienhebel stehen als
// Referenz am Rand (REC-4 folgt). Eilmeldungen tragen eine Einordnung („Was feststeht“, „Was offen ist“) und einen
// Knopf zur passenden Akte.
//
// `onGehe` ist optional: Die Bühne reicht ihre `gehe`-Funktion durch (Ziele wie im Schreibtisch: Akte oder Land).
// Ohne sie erscheinen keine Knöpfe, und alles andere funktioniert unverändert.

import { useMemo, useState, type ReactNode } from "react";
import type { World } from "../sim/types";
import { formatDateDe } from "../sim/dates";
import { kzBewertung } from "../data/zeitung_texte";
import {
  methodeName,
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
import { lagerVonAusrichtung, startSelbstzensur } from "../sim/medien";
import { medienCluster } from "../data/medien";
import { aktuelleLocale, t } from "../i18n";
import { t as tx } from "../i18n";
import "./zeitung.css";

type Gehe = ((ziel: Ziel) => void) | undefined;

const TON_NAME = (ton: FramingArt): string => t(`reste.zeitung.ton.${ton}`);
/** Das Lager des Blattes wie in der Medienansicht (eine Einordnung, Welle E4). Ältere Ausgaben ohne Feld: aus der Ausrichtung des Hauses. */
const LAGER_NAME = (b: ZeitungBlatt): string => {
  const c = medienCluster(b.clusterId);
  const lager = b.lager ?? (c ? lagerVonAusrichtung(c.ausrichtung) : undefined);
  return lager ? t(`tag_t1.medien.lager.${lager}`) : TON_NAME(b.ton);
};

const SPARTEN = new Set(["politik", "wirtschaft", "ereignis", "programm", "welt", "umfrage"]);
const SPARTE_NAME = (s: string): string | undefined => (SPARTEN.has(s) ? t(`nacht_n2.zeitung.sparte.${s}`) : undefined);

const nf = (x: number) => x.toLocaleString(aktuelleLocale(), { maximumFractionDigits: 1, minimumFractionDigits: 1 });

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
          {tx("ui2.ui.Zeitung.34eb2ac", { p0: ausgabe.nummer })}
          {ausgabe.anlass === "eilmeldung" && <em className="zt-eil">{tx("ui2.ui.Zeitung.758e887")}</em>}
        </span>
        <span>{blatt.digital ? tx("ui2.ui.Zeitung.be93d31") : tx("ui2.ui.Zeitung.ab31749")}</span>
      </p>
      <h3 className="zt-blattname">{blatt.name}</h3>
      <p className="zt-unterzeile">{blatt.unterzeile}</p>
      <p className="zt-zeile-unten">
        <span>{LAGER_NAME(blatt)}</span>
        <Flourish width={180} />
        <span>{blatt.digital ? tx("ui2.ui.Zeitung.5c03644") : tx("ui2.ui.Zeitung.52a9271")}</span>
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
          <h5>{tx("ui2.ui.Zeitung.ec4d075")}</h5>
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
    <article className={`${lead ? "zt-lead" : ""}${a.kurz ? " zt-kurz" : ""}`.trim()} aria-label={lead ? tx("ui2.ui.Zeitung.9956d08") : undefined}>
      <p className="zt-sparte">{SPARTE_NAME(a.sparte) ?? tx("ui2.ui.Zeitung.df56d5e")}</p>
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
    <svg className={`zt-spark ${bewertung}`} viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={tx("ui2.ui.Zeitung.2b00659", { p0: werte.length })}>
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
              <span className={`zt-zahl-delta ${klasse}`} title={bewegt ? tx("ui2.ui.Zeitung.522ec91", { p0: nf(k.vorher!) }) : tx("ui2.ui.Zeitung.89d6477")}>
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
                {p.provinzen} {p.provinzen === 1 ? tx("ui2.ui.Zeitung.d784889") : tx("ui2.ui.Zeitung.56d7381")}
                {trend && (
                  <em className={trend} title={tx("ui2.ui.Zeitung.522ec91", { p0: p.vorher })}>
                    {p.provinzen > p.vorher! ? " ▲" : " ▼"}
                  </em>
                )}
              </span>
              <span className="zt-balken" role="img" aria-label={tx("ui2.ui.Zeitung.f66fc56", { p0: Math.round(p.anteil * 100) })}>
                <i style={{ width: `${Math.max(4, Math.round(p.anteil * 100))}%` }} />
              </span>
              <span className="zt-lage-ort">
                {tx("ui2.ui.Zeitung.d98f48c", { p0: Math.round(p.anteil * 100), p1: p.schlimmste })}
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
    <aside className="zt-kasten zt-parlament" aria-label={tx("ui2.ui.Zeitung.e9f977f")}>
      <h5>{tx("ui2.ui.Zeitung.e9f977f")}</h5>
      <p className="zt-parl-zeile">
        {tx("ui2.ui.Zeitung.565f12f")} <strong>{p.lager}</strong> {tx("ui2.ui.Zeitung.291f7b8")}
        {p.duldung > 0 && <> · {t("nacht_n2.zeitung.geduldet", { n: p.duldung })}</>}
      </p>
      <div className="zt-sitze" role="img" aria-label={tx("ui2.ui.Zeitung.1005de4", { p0: p.lager, p1: p.noetig })}>
        <i className="lager" style={{ width: anteil(p.lager) }} />
        {p.duldung > 0 && <i className="duldung" style={{ width: anteil(p.duldung) }} />}
        <b style={{ left: anteil(p.noetig) }} title={tx("ui2.ui.Zeitung.a382504", { p0: p.noetig })} />
      </div>
      <p className="zt-parl-meta">
        {tx("ui2.ui.Zeitung.943d5a1", { p0: p.noetig })} {p.lager + p.duldung >= p.noetig ? tx("ui2.ui.Zeitung.c560ab3", { p0: p.lager + p.duldung - p.noetig + 1 }) : tx("ui2.ui.Zeitung.69238be", { p0: p.noetig - p.lager - p.duldung })}.
      </p>
      {p.gesetze.length > 0 && <p className="zt-parl-meta">{t("nacht_n2.zeitung.im_parlament", { liste: p.gesetze.join(", ") })}</p>}
      {onGehe && (
        <button type="button" className="zt-gehe" onClick={() => onGehe({ art: "akte", akte: "parlament" })}>
          {tx("ui2.ui.Zeitung.d89d29d")}
        </button>
      )}
    </aside>
  );
}

function Auslandkasten({ ausgabe, onGehe }: { ausgabe: ZeitungAusgabe; onGehe: Gehe }) {
  const zeilen = ausgabe.ausland ?? [];
  if (!zeilen.length) return null;
  return (
    <aside className="zt-kasten zt-ausland" aria-label={tx("ui2.ui.Zeitung.611350a")}>
      <h5>{tx("ui2.ui.Zeitung.611350a")}</h5>
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

function UmfrageKasten({ ausgabe, verlauf }: { ausgabe: ZeitungAusgabe; verlauf?: number[] }) {
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
          {tx("ui2.ui.Zeitung.723651c", { p0: ausgabe.umfrageSchublade })}
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
        {nf(u.wert)} <span className="zt-umfrage-prozent">{tx("ui2.ui.Zeitung.25b4ac6")}</span>
        {delta !== undefined && Math.abs(delta) >= 0.05 && (
          <em className={delta >= 0 ? "auf" : "ab"}>
            {delta >= 0 ? "▲" : "▼"} {nf(Math.abs(delta))}
          </em>
        )}
      </p>
      {/* Der Verlauf der veröffentlichten Werte; vorher stand er als Zeile unter den Zahlen des Monats */}
      {verlauf && <Sparkline werte={verlauf} bewertung={delta === undefined || Math.abs(delta) < 0.05 ? "" : delta > 0 ? "gut" : "schlecht"} />}
      <p className="zt-umfrage-meta">
        {tx("ui2.ui.Zeitung.17826b8")}{u.stichprobe !== undefined ? ` · ${t("nacht_n2.zeitung.befragte", { n: u.stichprobe.toLocaleString(aktuelleLocale()) })}` : tx("ui2.ui.Zeitung.8d2ffa3")} · {t("nacht_n2.zeitung.methode", { m: methodeName(u.methode) })}
      </p>
    </aside>
  );
}

function Kommentar({ blatt }: { blatt: ZeitungBlatt }) {
  const k = blatt.kommentar;
  if (!k) return null;
  return (
    <aside className={`zt-kommentar ton-${blatt.ton}`} aria-label={tx("ui2.ui.Zeitung.19c85a8")}>
      <p className="zt-sparte">{tx("ui2.ui.Zeitung.3f088a2", { p0: blatt.name })}</p>
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
  const [gewaehlt, setGewaehlt] = useState<string | null>(null);
  // Die Zustimmung steht im Kasten „Umfrage des Monats“ (mit Institut und Verlauf), nicht noch einmal unter den Zahlen (Tagarbeit T1)
  const zustimmung = ausgabe.zahlen?.find((k) => k.id === "zustimmung");
  const zahlen = (ausgabe.zahlen ?? []).filter((k) => !(k.id === "zustimmung" && ausgabe.umfrage));
  // Die Kästen als Register am Rand: einer offen, die übrigen einen Klick entfernt (Tagarbeit T1; vorher bis drei Bildschirme lang).
  // Die Lesart ordnet sie: Regierungsnahe zuerst Zahlen und Parlament, Oppositionelle zuerst die Lage; der erste ist offen.
  const alle: { id: string; da: boolean; el: ReactNode }[] = [
    { id: "zahlen", da: zahlen.length > 0, el: <Zahlenkasten zahlen={zahlen} ton={blatt.ton} /> },
    { id: "lage", da: !!ausgabe.lage?.length, el: <Lagekasten ausgabe={ausgabe} onGehe={onGehe} /> },
    { id: "parlament", da: !!ausgabe.parlament, el: <Parlamentkasten ausgabe={ausgabe} onGehe={onGehe} /> },
    { id: "ausland", da: !!ausgabe.ausland?.length, el: <Auslandkasten ausgabe={ausgabe} onGehe={onGehe} /> },
    { id: "umfrage", da: !!(ausgabe.umfrage || ausgabe.umfrageSchublade || ausgabe.umfrageVerbot), el: <UmfrageKasten ausgabe={ausgabe} {...(zustimmung?.verlauf ? { verlauf: zustimmung.verlauf } : {})} /> },
  ];
  const reihe = blatt.ton === "oppositionell" ? ["lage", "zahlen", "ausland", "parlament", "umfrage"] : blatt.ton === "regierungsnah" ? ["zahlen", "parlament", "ausland", "lage", "umfrage"] : ["zahlen", "lage", "parlament", "ausland", "umfrage"];
  const kaesten = reihe.map((id) => alle.find((k) => k.id === id)!).filter((k) => k.da);
  const offen = kaesten.find((k) => k.id === gewaehlt) ?? kaesten[0];
  // Mit Text neben sich stehen die Kästen am Rand; nur eine ganz kurze Seite (ein Aufmacher ohne Einordnung, etwa „Aus der Redaktion“)
  // legt den offenen Kasten breit darunter, damit neben zwei Zeilen keine leere Spalte steht
  const seitlich = blatt.artikel.length >= 2 || !!(lead?.einordnung && (lead.einordnung.feststeht.length || lead.einordnung.offen.length)) || (lead?.text.length ?? 0) >= 3;
  return (
    <div className="zt-seite">
      <Masthead ausgabe={ausgabe} blatt={blatt} />
      <div className={`zt-koerper${kaesten.length ? (seitlich ? " mit-kasten" : " unten") : ""}`}>
        <div className="zt-text">
          {lead && <Artikel a={lead} lead onGehe={onGehe} />}
          {rest.length > 0 && (
            // Ein einzelner Nebenartikel läuft über die ganze Breite statt in der linken von zwei Spalten (keine halbleere Seite)
            <div className={`zt-spalten${rest.length === 1 ? " eine" : ""}`}>
              {rest.map((a) => (
                <Artikel key={a.id} a={a} onGehe={onGehe} />
              ))}
            </div>
          )}
          <Kommentar blatt={blatt} />
          {blatt.verschwiegen.length > 0 && (
            // Welle B3: die verschwiegenen Schlagzeilen als Marken statt als Satz
            <div className="zt-verschwiegen">
              <strong>{tx("ui2.ui.Zeitung.d17ee42")}</strong>
              <ul>{blatt.verschwiegen.map((v) => <li key={v}>{v}</li>)}</ul>
            </div>
          )}
        </div>
        {kaesten.length > 0 && (
          <div className="zt-kaesten">
            {kaesten.length > 1 && (
              <div className="zt-register" role="tablist" aria-label={t("tag_t1.zeitung.register")}>
                {kaesten.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    role="tab"
                    id={`zt-reg-${k.id}`}
                    aria-selected={k === offen}
                    aria-controls={`zt-kasten-${k.id}`}
                    className={k === offen ? "on" : ""}
                    onClick={() => setGewaehlt(k.id)}
                  >
                    {t(`tag_t1.zeitung.kasten.${k.id}`)}
                  </button>
                ))}
              </div>
            )}
            {kaesten.map((k) => (
              <div key={k.id} id={`zt-kasten-${k.id}`} role={kaesten.length > 1 ? "tabpanel" : undefined} aria-labelledby={kaesten.length > 1 ? `zt-reg-${k.id}` : undefined} hidden={k !== offen}>
                {k.el}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Der Weg zur Mediensteuerung am Rand der Zeitung. Rang und Veränderung der Pressefreiheit stehen im Aktenkopf, hier nicht noch einmal (Tagarbeit T1). */
function MedienHinweis({ onMedien }: { onMedien: () => void }) {
  return (
    <section className="zt-regulierung" aria-label={t("medien.zeitung.zu_medien")}>
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

/** Der erste Tag des nächsten Monats (Erscheinungstag der Monatsausgabe), als ISO-Datum. */
function naechsterErster(datum: string): string {
  const [j, m] = datum.split("-").map(Number) as [number, number];
  return m === 12 ? `${j + 1}-01-01` : `${j}-${String(m + 1).padStart(2, "0")}-01`;
}

/** Vor der ersten Ausgabe: ein leeres Titelblatt mit Erscheinungstag statt einer weißen Fläche (Gestaltung leerer Zustände, befund-E). */
function ErsteAusgabe({ world, onMedien }: { world: World; onMedien?: () => void }) {
  return (
    <div className="zt-leer" role="note">
      <div className="zt-leer-blatt" aria-hidden>
        <span className="zt-leer-kopf" />
        <span className="zt-leer-zeile lang" />
        <span className="zt-leer-zeile" />
        <span className="zt-leer-spalten">
          <i />
          <i />
          <i />
        </span>
      </div>
      <div className="zt-leer-text">
        <h3>{t("nacht_n2.zeitung.leer_titel")}</h3>
        <p>{t("nacht_n2.zeitung.leer_text", { datum: formatDateDe(naechsterErster(world.date)) })}</p>
        {onMedien && (
          <button type="button" className="pd-btn" onClick={onMedien}>
            {t("nacht_n2.zeitung.zu_medien")} →
          </button>
        )}
      </div>
    </div>
  );
}

export function Zeitung({ world, onGehe, onMedien }: { world: World; onGehe?: (ziel: Ziel) => void; onAenderung?: () => void; onMedien?: () => void }) {
  const spiel = world.spiel;
  const z = spiel ? zeitungVon(world) : null;
  const [ausgabeIdx, setAusgabeIdx] = useState<number | null>(null);
  const [blattIdx, setBlattIdx] = useState(0);

  const archiv = z?.archiv ?? [];
  const ausgabe = archiv[ausgabeIdx ?? archiv.length - 1];
  // Beim Blattwechsel die Ausgabe merken; bei Ausgabenwechsel beginnt man vorn
  const blatt = useMemo(() => {
    if (!ausgabe) return undefined;
    return ausgabe.blaetter[Math.min(blattIdx, ausgabe.blaetter.length - 1)];
  }, [ausgabe, blattIdx]);

  if (!spiel) return <p>{t("ui.Zeitung.b1ebc59")}</p>;
  // Die Mediensteuerung ist ein eigener Reiter der Akte (Stage: „Medien steuern“); die Zeitung zeigt nur noch die Ausgaben
  if (!z || !ausgabe || !blatt)
    return (
      <div className="zt-huelle">
        <ErsteAusgabe world={world} {...(onMedien ? { onMedien } : {})} />
      </div>
    );

  return (
    <div className="zt-huelle">
      <div className="zt">
        {/* Archiv und Weg zur Mediensteuerung als Leiste über der Seite (Tagarbeit T1): Die Seite bekommt die ganze Breite und wird kürzer */}
        <aside className="zt-rand">
          <section className="zt-archiv" aria-label={t("ui.Zeitung.db0bb89")}>
            <h5>{tx("ui2.ui.Zeitung.d9431e3")}</h5>
            <ul>
              {[...archiv].reverse().map((a) => {
                const i = archiv.indexOf(a);
                const kopf = archivKopf(a);
                return (
                  <li key={a.nummer}>
                    <button
                      className={`${a === ausgabe ? "on" : ""}${kopf.stimmung ? ` ${kopf.stimmung}` : ""}`.trim()}
                      title={kopf.titel}
                      aria-current={a === ausgabe ? "true" : undefined}
                      onClick={() => {
                        setAusgabeIdx(i);
                        setBlattIdx(0);
                      }}
                    >
                      <span className="zt-archiv-nr">
                        {t("nacht_n2.zeitung.nr", { n: a.nummer })}
                        {a.anlass === "eilmeldung" && <em>{t("nacht_n2.zeitung.eil")}</em>}
                      </span>
                      <span className="zt-archiv-datum">{formatDateDe(a.datum)}</span>
                      {kopf.stimmung && <i className={`zt-marke ${kopf.stimmung}`} aria-label={kopf.stimmung === "auf" ? tx("ui2.ui.Zeitung.12cddce") : tx("ui2.ui.Zeitung.690d51c")} />}
                      {/* Die Leitzeile steht im Titel; die Ausgabe selbst zeigt sie als Aufmacher */}
                      <span className="zt-archiv-lead">{kopf.titel}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
          {onMedien && <MedienHinweis onMedien={onMedien} />}
        </aside>
        <div className="zt-haupt">
          <nav className="zt-blaetter" role="tablist" aria-label={t("ui.Zeitung.6a8c814")}>
            {ausgabe.blaetter.map((b, i) => (
              <button key={b.clusterId} role="tab" aria-selected={b === blatt} className={`zt-blatt-tab ton-${b.ton}${b === blatt ? " on" : ""}`} onClick={() => setBlattIdx(i)}>
                <strong>{b.name}</strong>
                <span>{LAGER_NAME(b)}</span>
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

      </div>
    </div>
  );
}

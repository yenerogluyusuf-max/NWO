// Die Zeitung (UI-1): Frontseite im Atlas-Stil — Masthead, Datum, mehrspaltige Artikel,
// Blätter als Reiter, Archiv der letzten zwölf Ausgaben. Dieselbe Realität in verschiedenen
// Framings; die Regulierungspreise der Medienhebel stehen als Referenz am Rand (REC-4 folgt).

import { useMemo, useState } from "react";
import type { World } from "../sim/types";
import { formatDateDe } from "../sim/dates";
import { REGULIERUNG_PREISE, RSF_START } from "../data/medien";
import { zeitungVon, type FramingArt, type ZeitungAusgabe, type ZeitungBlatt } from "../sim/zeitung";
import { Flourish } from "./art/Ornament";
import "./zeitung.css";

const TON_NAME: Record<FramingArt, string> = { regierungsnah: "regierungsnah", oppositionell: "oppositionell", neutral: "unabhängig" };

const SPARTE_NAME: Record<string, string> = { politik: "Politik", wirtschaft: "Wirtschaft", ereignis: "Im Land", programm: "Umsetzung", welt: "Ausland", umfrage: "Meinungslage" };

/** Spielerlesbare Namen der Regulierungshebel (Referenz, REC-4 baut die Mechanik dazu). */
const HEBEL_NAME: Record<string, string> = {
  rtuek_geldstrafe: "Geldstrafe der Rundfunkaufsicht",
  rtuek_programmstopp: "Programmstopp",
  blackout_10tage: "Blackout (zehn Tage)",
  bik_anzeigenstopp: "Anzeigenstopp für Blätter",
  tck217a_verfahren: "Verfahren wegen Falschnachricht",
  lizenzentzug: "Lizenzentzug",
  kontosperrung: "Kontosperrungen",
};

const nf = (x: number) => x.toLocaleString("de-DE", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

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
    </header>
  );
}

function UmfrageKasten({ ausgabe }: { ausgabe: ZeitungAusgabe }) {
  if (!ausgabe.umfrage) {
    return ausgabe.umfrageSchublade ? (
      <aside className="zt-umfrage schublade">
        <h5>Die Umfrage des Monats</h5>
        <p>
          Erscheint nicht: {ausgabe.umfrageSchublade} hat gemessen und das Ergebnis in der Schublade gelassen. Man darf mutmaßen, warum.
        </p>
      </aside>
    ) : null;
  }
  const u = ausgabe.umfrage;
  const delta = u.vormonat !== undefined ? u.wert - u.vormonat : undefined;
  return (
    <aside className="zt-umfrage" aria-label="Veröffentlichte Umfrage des Monats">
      <h5>Die Umfrage des Monats</h5>
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

function Frontseite({ ausgabe, blatt }: { ausgabe: ZeitungAusgabe; blatt: ZeitungBlatt }) {
  const [lead, ...rest] = blatt.artikel;
  return (
    <div className="zt-seite">
      <Masthead ausgabe={ausgabe} blatt={blatt} />
      {lead && (
        <article className="zt-lead" aria-label="Leitartikel">
          <p className="zt-sparte">{SPARTE_NAME[lead.sparte] ?? "Politik"}</p>
          <h4 className="zt-schlagzeile">{lead.schlagzeile}</h4>
          {lead.text.map((t, i) => (
            <p key={i} className="zt-artikel-text">
              {t}
            </p>
          ))}
        </article>
      )}
      <div className="zt-spalten">
        {rest.map((a) => (
          <article key={a.id} className={a.kurz ? "zt-kurz" : ""}>
            <p className="zt-sparte">{SPARTE_NAME[a.sparte] ?? "Politik"}</p>
            <h5 className="zt-schlagzeile">{a.schlagzeile}</h5>
            {a.text.map((t, i) => (
              <p key={i} className="zt-artikel-text">
                {t}
              </p>
            ))}
          </article>
        ))}
        <UmfrageKasten ausgabe={ausgabe} />
        {blatt.verschwiegen.length > 0 && (
          <p className="zt-verschwiegen">
            <strong>Nicht in dieser Ausgabe:</strong> {blatt.verschwiegen.join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

function RegulierungsReferenz() {
  return (
    <section className="zt-regulierung" aria-label="Was Eingriffe in die Presse kosten würden">
      <h5>Was Eingriffe kosten würden</h5>
      <p className="zt-reg-hinweis">
        Referenzwerte des Stabes — keine Optionen. Pressefreiheit heute: Rang {RSF_START.rang}, Wert {nf(RSF_START.score)} (Stand 2028).
      </p>
      <ul>
        {Object.entries(REGULIERUNG_PREISE).map(([id, p]) => (
          <li key={id} title={p.referenz}>
            <span>{HEBEL_NAME[id] ?? id}</span>
            <span className="zt-reg-preis">
              Rangliste −{nf(p.rsfMalus)}
              {p.oppoMobilisierung ? ` · Empörung +${nf(p.oppoMobilisierung)}` : ""}
              {p.einmalig ? " · einmalig" : ""}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Zeitung({ world }: { world: World }) {
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

  if (!spiel) return <p>Ohne Spielschleife erscheint keine Zeitung.</p>;
  if (!z || !ausgabe || !blatt)
    return (
      <div className="zt">
        <p className="subtitle">Die erste Ausgabe erscheint am Monatsersten — gedruckt und, wo man es noch darf, im Netz.</p>
      </div>
    );

  return (
    <div className="zt">
      <div className="zt-haupt">
        <nav className="zt-blaetter" role="tablist" aria-label="Blatt wählen">
          {ausgabe.blaetter.map((b, i) => (
            <button key={b.clusterId} role="tab" aria-selected={b === blatt} className={`zt-blatt-tab ton-${b.ton}${b === blatt ? " on" : ""}`} onClick={() => setBlattIdx(i)}>
              <strong>{b.name}</strong>
              <span>{TON_NAME[b.ton]}</span>
            </button>
          ))}
        </nav>
        <Frontseite ausgabe={ausgabe} blatt={blatt} />
      </div>

      <aside className="zt-rand">
        <section className="zt-archiv" aria-label="Archiv der letzten Ausgaben">
          <h5>Archiv</h5>
          <ul>
            {[...archiv].reverse().map((a) => {
              const i = archiv.indexOf(a);
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
                    <span className="zt-archiv-lead">{a.blaetter.find((b) => b.artikel.length > 0)?.artikel[0]?.schlagzeile ?? "—"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
        <RegulierungsReferenz />
      </aside>
    </div>
  );
}

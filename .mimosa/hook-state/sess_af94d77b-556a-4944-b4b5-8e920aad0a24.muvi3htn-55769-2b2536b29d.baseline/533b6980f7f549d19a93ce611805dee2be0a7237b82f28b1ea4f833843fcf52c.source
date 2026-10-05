// Das EU-Dossier (AUS-2): der Beitrittsvorgang als eigenes Blatt in der Länderakte.
// Fortschrittsbalken je Kapitel, Kriterien-Checklisten mit aktuellem Stand, Zypern-Kopplung,
// Zollunion-Status, Visa-Checkliste und das Archiv der jährlichen Fortschrittsberichte.

import { useState } from "react";
import type { World } from "../../sim/types";
import { KAPITEL, VISA_KRITERIEN, annaeherungSicht, euUebersicht, kuendigeReformAn, type KriteriumStand } from "../../sim/eu";
import { formatDateDe } from "../../sim/dates";

function KriteriumZeile({ s }: { s: KriteriumStand }) {
  return (
    <li className={s.erfuellt ? "ok" : "offen"}>
      <span aria-hidden>{s.erfuellt ? "✓" : "○"}</span>
      <span>
        {s.kriterium.text}
        {s.kriterium.knoten && <em> (jetzt {Math.round(s.jetzt)})</em>}
      </span>
    </li>
  );
}

export function EuDossier({ world, refresh }: { world: World; refresh: () => void }) {
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const [offen, setOffen] = useState<string | null>(null);
  const u = euUebersicht(world);
  const z = u.zustand;
  const anna = annaeherungSicht(world);
  const statusWort = { zu: "zu", bereit: "bereit", offen: "in Verhandlung", abgeschlossen: "geschlossen" } as const;

  return (
    <div className="we-eu">
      <section className="we-eu-block">
        <b>Der Weg nach Europa</b>
        <p className="subtitle">{u.phasenText}</p>
        {z.phase === "eingefroren" && (
          <div className="we-eu-aktion">
            <button
              type="button"
              className="aktion-knopf"
              disabled={!anna.moeglich}
              onClick={() => {
                setAntwort(kuendigeReformAn(world));
                refresh();
              }}
            >
              Reformpaket ankündigen
            </button>
            <span className="subtitle">
              {anna.moeglich
                ? `Startet das Screening (zwölf Monate). Die Annäherung an die EU steht bei ${Math.round(anna.annaeherung)} von nötig 55.`
                : anna.grund}
            </span>
          </div>
        )}
        {antwort && (
          <p className={`we-rueck ${antwort.ok ? "ok" : "nein"}`} role="status">
            {antwort.text}
            {antwort.why && <em> {antwort.why}</em>}
          </p>
        )}
        {z.phase === "screening" && z.screeningBis !== undefined && <p className="subtitle">Abschluss des Screenings erwartet: {formatDateDe(datumNachTagen(world.date, z.screeningBis - world.day))}.</p>}
        {u.kapitalAbzug > 0 && <p className="subtitle">Innenpreis der Verhandlungen: {u.kapitalAbzug.toLocaleString("de-DE", { maximumFractionDigits: 2 })} Kapital im Monat (Reformen binden Rückhalt).</p>}
      </section>

      {!u.zypern.bewegt && (
        <section className="we-eu-block we-eu-warn">
          <b>Zypern-Kopplung</b>
          <p className="subtitle">{u.zypern.text}</p>
        </section>
      )}
      {u.veto && (
        <section className="we-eu-block we-eu-warn">
          <b>Nationales Veto</b>
          <p className="subtitle">{u.veto.text}</p>
        </section>
      )}

      <section className="we-eu-block">
        <b>Die Kapitel ({KAPITEL.length} von 35 — die übrigen laufen als Binnenmarkt-Technik im Hintergrund mit)</b>
        <ul className="we-eu-kapitel">
          {u.kapitel.map((s) => (
            <li key={s.def.id} className={`we-eu-kap st-${s.zustand.status}`}>
              <button type="button" className="we-eu-kap-kopf" onClick={() => setOffen(offen === s.def.id ? null : s.def.id)} aria-expanded={offen === s.def.id}>
                <span className="we-eu-kap-nr">{s.def.nummer}</span>
                <span className="we-eu-kap-name">
                  <strong>{s.def.name}</strong>
                  <span className="we-fortschritt" aria-hidden>
                    <i style={{ width: `${Math.round(s.fortschritt * 100)}%` }} />
                  </span>
                </span>
                <span className={`we-status${s.zustand.status === "abgeschlossen" ? "" : s.blockiertZypern || s.alibi ? " st-gebrochen" : ""}`}>
                  {s.blockiertZypern ? "Zypern" : s.alibi ? "Alibi-Verdacht" : statusWort[s.zustand.status]}
                </span>
              </button>
              {offen === s.def.id && (
                <div className="we-eu-kap-detail">
                  <p className="subtitle">{s.def.text}</p>
                  <div className="we-eu-kap-spalten">
                    <div>
                      <b>Öffnungskriterien</b>
                      <ul className="we-anliegen">{s.oeffnung.map((x) => <KriteriumZeile key={x.kriterium.id} s={x} />)}</ul>
                    </div>
                    <div>
                      <b>Schlusskriterien</b>
                      <ul className="we-anliegen">{s.schluss.map((x) => <KriteriumZeile key={x.kriterium.id} s={x} />)}</ul>
                    </div>
                  </div>
                  <p className="subtitle">
                    Verhandlungszeit: {s.def.jahre} Jahre. Nächster Schritt: {s.schritt}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="we-eu-block">
        <b>Zollunion</b>
        <p className="subtitle">
          {z.zollunion === "modernisiert"
            ? "Modernisiert: Dienstleistungen und Agrar sind Teil des Binnenmarkts; die Industrie gewann, die Landwirtschaft steht im Wettbewerb."
            : "Die Zollunion von 1995 gilt unverändert. Das Mandat für das Update bietet Brüssel an, sobald drei Kapitel vorläufig geschlossen sind — Handel +, Industrie +, Landwirtschaft −."}
        </p>
      </section>

      <section className="we-eu-block">
        <b>Visaliberalisierung {u.visa.gewaehrt ? "(gewährt)" : `(${u.visa.erfuellt} von ${VISA_KRITERIEN.length})`}</b>
        <p className="subtitle">Ein eigener Weg, der nicht auf die Kapitel wartet: sechs Kriterien, dann reisen Bürger ohne Visum.</p>
        <ul className="we-anliegen">{u.visa.kriterien.map((s) => <KriteriumZeile key={s.kriterium.id} s={s} />)}</ul>
      </section>

      {z.berichte.length > 0 && (
        <section className="we-eu-block">
          <b>Fortschrittsberichte</b>
          <ul className="we-eu-berichte">
            {[...z.berichte].reverse().map((b) => (
              <li key={b.tag}>
                <details>
                  <summary>
                    Fortschrittsbericht {b.jahr}
                    {b.alibi.length > 0 ? ` — Alibi-Verdacht bei ${b.alibi.length} ${b.alibi.length === 1 ? "Kapitel" : "Kapiteln"}` : ""}
                  </summary>
                  <ul>
                    {b.zeilen.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
          <p className="subtitle">Der nächste Bericht kommt im November.</p>
        </section>
      )}
    </div>
  );
}

function datumNachTagen(datum: string, tage: number): string {
  return new Date(Date.parse(datum + "T00:00:00Z") + tage * 86_400_000).toISOString().slice(0, 10);
}

// Das EU-Dossier (AUS-2): der Beitrittsvorgang als eigenes Blatt in der Länderakte.
// Fortschrittsbalken je Kapitel, Kriterien-Checklisten mit aktuellem Stand, Zypern-Kopplung,
// Zollunion-Status, Visa-Checkliste und das Archiv der jährlichen Fortschrittsberichte.

import { useState } from "react";
import type { World } from "../../sim/types";
import { KAPITEL, VISA_KRITERIEN, annaeherungSicht, euUebersicht, kuendigeReformAn, type KriteriumStand } from "../../sim/eu";
import { formatDateDe } from "../../sim/dates";

import { t } from "../../i18n";
function KriteriumZeile({ s }: { s: KriteriumStand }) {
  return (
    <li className={s.erfuellt ? "ok" : "offen"}>
      <span aria-hidden>{s.erfuellt ? "✓" : "○"}</span>
      <span>
        {s.kriterium.text}
        {s.kriterium.knoten && <em> {t("ui2.ui.welt.EuDossier.33c118d", { p0: Math.round(s.jetzt) })}</em>}
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
        <b>{t("ui.welt.EuDossier.e9fdb97")}</b>
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
              {t("ui.welt.EuDossier.f0c42d3")}
            </button>
            <span className="subtitle">
              {anna.moeglich
                ? t("ui2.ui.welt.EuDossier.6b8bfa2", { p0: Math.round(anna.annaeherung) })
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
        {z.phase === "screening" && z.screeningBis !== undefined && <p className="subtitle">{t("ui2.ui.welt.EuDossier.d4c40bd", { p0: formatDateDe(datumNachTagen(world.date, z.screeningBis - world.day)) })}</p>}
        {u.kapitalAbzug > 0 && <p className="subtitle">{t("ui2.ui.welt.EuDossier.4724b63", { p0: u.kapitalAbzug.toLocaleString("de-DE", { maximumFractionDigits: 2 }) })}</p>}
      </section>

      {!u.zypern.bewegt && (
        <section className="we-eu-block we-eu-warn">
          <b>Zypern-Kopplung</b>
          <p className="subtitle">{u.zypern.text}</p>
        </section>
      )}
      {u.veto && (
        <section className="we-eu-block we-eu-warn">
          <b>{t("ui2.ui.welt.EuDossier.119a92d")}</b>
          <p className="subtitle">{u.veto.text}</p>
        </section>
      )}

      <section className="we-eu-block">
        <b>{t("ui2.ui.welt.EuDossier.4e56431", { p0: KAPITEL.length })}</b>
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
                  {s.blockiertZypern ? t("ui2.ui.welt.EuDossier.85f5e53") : s.alibi ? "Alibi-Verdacht" : statusWort[s.zustand.status]}
                </span>
              </button>
              {offen === s.def.id && (
                <div className="we-eu-kap-detail">
                  <p className="subtitle">{s.def.text}</p>
                  <div className="we-eu-kap-spalten">
                    <div>
                      <b>{t("ui.welt.EuDossier.8660386")}</b>
                      <ul className="we-anliegen">{s.oeffnung.map((x) => <KriteriumZeile key={x.kriterium.id} s={x} />)}</ul>
                    </div>
                    <div>
                      <b>{t("ui2.ui.welt.EuDossier.543bd74")}</b>
                      <ul className="we-anliegen">{s.schluss.map((x) => <KriteriumZeile key={x.kriterium.id} s={x} />)}</ul>
                    </div>
                  </div>
                  <p className="subtitle">
                    {t("ui2.ui.welt.EuDossier.db9720b", { p0: s.def.jahre, p1: s.schritt })}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="we-eu-block">
        <b>{t("ui2.ui.welt.EuDossier.52c6027")}</b>
        <p className="subtitle">
          {z.zollunion === "modernisiert"
            ? t("ui2.ui.welt.EuDossier.3676e06")
            : t("ui2.ui.welt.EuDossier.f7bcef9")}
        </p>
      </section>

      <section className="we-eu-block">
        <b>{t("ui2.ui.welt.EuDossier.a5305f3")} {u.visa.gewaehrt ? t("ui2.ui.welt.EuDossier.8284a64") : t("ui2.ui.welt.EuDossier.df7bffe", { p0: u.visa.erfuellt, p1: VISA_KRITERIEN.length })}</b>
        <p className="subtitle">{t("ui.welt.EuDossier.c7daf1f")}</p>
        <ul className="we-anliegen">{u.visa.kriterien.map((s) => <KriteriumZeile key={s.kriterium.id} s={s} />)}</ul>
      </section>

      {z.berichte.length > 0 && (
        <section className="we-eu-block">
          <b>{t("ui2.ui.welt.EuDossier.d061d41")}</b>
          <ul className="we-eu-berichte">
            {[...z.berichte].reverse().map((b) => (
              <li key={b.tag}>
                <details>
                  <summary>
                    {t("ui2.ui.welt.EuDossier.f537a8f", { p0: b.jahr })}
                    {b.alibi.length > 0 ? t("ui2.ui.welt.EuDossier.8779dae", { p0: b.alibi.length, p1: b.alibi.length === 1 ? "Kapitel" : "Kapiteln" }) : ""}
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
          <p className="subtitle">{t("ui.welt.EuDossier.d69e835")}</p>
        </section>
      )}
    </div>
  );
}

function datumNachTagen(datum: string, tage: number): string {
  return new Date(Date.parse(datum + "T00:00:00Z") + tage * 86_400_000).toISOString().slice(0, 10);
}

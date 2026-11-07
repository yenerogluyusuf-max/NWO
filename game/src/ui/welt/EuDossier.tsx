// Das EU-Dossier (AUS-2): der Beitrittsvorgang als eigenes Blatt in der Länderakte.
// Fortschrittsbalken je Kapitel, Kriterien-Checklisten mit aktuellem Stand, Zypern-Kopplung,
// Zollunion-Status, Visa-Checkliste und das Archiv der jährlichen Fortschrittsberichte.

import { useState } from "react";
import type { World } from "../../sim/types";
import { EU_REGELN, KAPITEL, START_OFFEN, VISA_KRITERIEN, annaeherungSicht, euUebersicht, kuendigeReformAn, type KriteriumStand } from "../../sim/eu";
import { formatDateDe } from "../../sim/dates";

import { t, zahl } from "../../i18n";
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

export function EuDossier({ world, refresh, onMassnahme, onVerhandeln }: { world: World; refresh: () => void; onMassnahme?: ((id: string, richtung: 1 | -1) => void) | undefined; onVerhandeln?: (() => void) | undefined }) {
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const [offen, setOffen] = useState<string | null>(null);
  const u = euUebersicht(world);
  const z = u.zustand;
  const anna = annaeherungSicht(world);
  // Welle E1: Im Stillstand verhandelt niemand; die vor 2018 eröffneten Kapitel heißen dann „eröffnet“, nicht „in Verhandlung“
  const statusWort = (st: string) => t(`welle_e1.eu.status.${st === "offen" && z.phase === "eingefroren" ? "eroeffnet" : st}`);
  const zahlen = {
    offen: u.kapitel.filter((s) => s.zustand.status === "offen").length,
    geschlossen: u.kapitel.filter((s) => s.zustand.status === "abgeschlossen").length,
    gesperrt: u.kapitel.filter((s) => s.blockiertZypern || s.blockiertRat).length,
  };

  return (
    <div className="we-eu">
      <section className="we-eu-block">
        <b>{t("ui.welt.EuDossier.e9fdb97")}</b>
        <p className="subtitle">{u.phasenText}</p>
        <div className="we-eu-zahlen" role="group" aria-label={t("welle_e1.eu.zahlen")}>
          <span><strong>{zahlen.offen}</strong><small>{t("welle_e1.eu.zahl.offen", { alle: KAPITEL.length })}</small></span>
          <span><strong>{zahlen.geschlossen}</strong><small>{t("welle_e1.eu.zahl.geschlossen")}</small></span>
          <span><strong>{zahlen.gesperrt}</strong><small>{t("welle_e1.eu.zahl.gesperrt")}</small></span>
          <span><strong>{u.visa.erfuellt}/{VISA_KRITERIEN.length}</strong><small>{t("welle_e1.eu.zahl.visa")}</small></span>
        </div>
        <p className="subtitle we-eu-echt">{t("welle_e1.eu.echt", { n: Object.keys(START_OFFEN).length })}</p>
        {z.phase === "eingefroren" && (
          // Welle E1 (ENTSCHEIDUNGEN AA 2): Die Schwelle ist ein sichtbarer Preis, jede Zeile mit dem Weg dorthin
          <div className="we-eu-preis">
            <b>{t("welle_e1.eu.preis.titel")}</b>
            <ul>
              <li className={anna.annaeherung >= anna.noetig ? "ok" : "offen"}>
                <span className="we-eu-preis-name">{t("welle_e1.eu.preis.annaeherung")}</span>
                <span className="we-eu-preis-wert">
                  <strong>{Math.round(anna.annaeherung)}</strong> / {anna.noetig}
                </span>
                <span className="we-eu-preis-balken" aria-hidden><i style={{ width: `${Math.min(100, Math.round((anna.annaeherung / anna.noetig) * 100))}%` }} /></span>
                {onMassnahme && anna.annaeherung < anna.noetig && (
                  <button type="button" className="link" onClick={() => onMassnahme("m_eu_annaeherung", 1)}>{t("welle_e1.eu.preis.zurMassnahme")}</button>
                )}
              </li>
              <li className={anna.reformzusage ? "ok" : "offen"}>
                <span className="we-eu-preis-name">{t("welle_e1.eu.preis.oder")}</span>
                <span className="we-eu-preis-wert">{anna.reformzusage ? t("welle_e1.eu.preis.laeuft") : t("welle_e1.eu.preis.fehlt")}</span>
                <span />
                {onVerhandeln && !anna.reformzusage && (
                  <button type="button" className="link" onClick={onVerhandeln}>{t("welle_e1.eu.preis.zumTisch")}</button>
                )}
              </li>
            </ul>
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
                {t("ui.welt.EuDossier.f0c42d3")} · {t("welle_e1.eu.preis.kapital", { pk: EU_REGELN.pkAnkuendigung })}
              </button>
              <span className="subtitle">{anna.moeglich ? t("welle_e1.eu.preis.bereit") : anna.grund}</span>
            </div>
          </div>
        )}
        {antwort && (
          <p className={`we-rueck ${antwort.ok ? "ok" : "nein"}`} role="status">
            {antwort.text}
            {antwort.why && <em> {antwort.why}</em>}
          </p>
        )}
        {z.phase === "screening" && z.screeningBis !== undefined && <p className="subtitle">{t("ui2.ui.welt.EuDossier.d4c40bd", { p0: formatDateDe(datumNachTagen(world.date, z.screeningBis - world.day)) })}</p>}
        {u.kapitalAbzug > 0 && <p className="subtitle">{t("ui2.ui.welt.EuDossier.4724b63", { p0: zahl(u.kapitalAbzug) })}</p>}
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
                <span className={`we-status${s.zustand.status === "abgeschlossen" ? "" : s.blockiertZypern || s.blockiertRat || s.alibi ? " st-gebrochen" : ""}`}>
                  {s.blockiertZypern ? t("ui2.ui.welt.EuDossier.85f5e53") : s.blockiertRat ? t("welle_e1.eu.status.rat2006") : s.alibi ? t("welle_e1.eu.status.alibi") : statusWort(s.zustand.status)}
                </span>
              </button>
              {offen === s.def.id && (
                <div className="we-eu-kap-detail">
                  <p className="subtitle">{s.def.text}</p>
                  {s.zustand.seit && <p className="subtitle">{t("welle_e1.eu.kapitelSeit", { datum: formatDateDe(s.zustand.seit) })}</p>}
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

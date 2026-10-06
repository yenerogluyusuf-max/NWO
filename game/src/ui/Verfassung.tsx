// Die Verfassungs-Werkstatt (REC-1): Paket-Baukasten mit Stimmen-Prognose je Variante (Richtung und
// Bandbreite — die Mentorin erklärt die Rechnung, sie verspricht keine Scheingenauigkeit), dazu das
// Tracking des laufenden Vorgangs über Parlament, Verfassungsgericht und Volksabstimmung.

import { useMemo, useState } from "react";
import type { World } from "../sim/types";
import { addDays, formatDateDe } from "../sim/dates";
import {
  ARTIKEL,
  VERFASSUNG_REGELN,
  artikelDef,
  artikelSperre,
  aymSicht,
  bringeVerfassungEin,
  geaenderteArtikel,
  kampagnenImpuls,
  paketStimmen,
  pruefeVerfassung,
  referendumPrognose,
  statusQuoVon,
  varianteDef,
  verfassungAktiv,
  verfassungStimmenKaufen,
  verfassungsZustand,
  zieheVerfassungZurueck,
  amtszeitBelegt,
} from "../sim/verfassung";
import { PARTEI_NAME } from "../sim/fraktionen";
import { kannZahlen } from "../sim/kapital";
import type { Ergebnis } from "../sim/handeln";
import "./politik/design.css";

import { t } from "../i18n";
const r1 = (x: number): number => Math.round(x * 10) / 10;

/** Wohin eine Variante die Macht rückt, in einem Wort. */
function richtungWort(autoritaer: number): string {
  if (autoritaer >= 2) return t("vf.richtung.palast");
  if (autoritaer === 1) return t("vf.richtung.exekutive");
  if (autoritaer === -1) return t("vf.richtung.kontrolle");
  if (autoritaer <= -2) return t("vf.richtung.abgabe");
  return t("vf.richtung.gleich");
}

/** Wer im Parlament eine Variante trägt oder ablehnt (Qualität statt Scheingenauigkeit). */
function parteienText(parteien: Record<string, number>): string {
  const dafuer = Object.entries(parteien).filter(([, x]) => x >= 1).map(([p]) => PARTEI_NAME[p] ?? p);
  const dagegen = Object.entries(parteien).filter(([, x]) => x <= -1).map(([p]) => PARTEI_NAME[p] ?? p);
  const teile: string[] = [];
  if (dafuer.length) teile.push(t("vf.dafuer", { l: dafuer }));
  if (dagegen.length) teile.push(t("vf.dagegen", { l: dagegen }));
  return teile.length ? teile.join("; ") : t("vf.ohneFronten");
}

export function VerfassungWerkstatt({ world, refresh }: { world: World; refresh: () => void }) {
  const spiel = world.spiel;
  const [wahl, setWahl] = useState<Record<string, string>>(() => {
    const z = world.spiel?.verfassungsvorgang;
    return Object.fromEntries(ARTIKEL.map((a) => [a.id, z?.aktiv[a.id] ?? statusQuoVon(a.id)]));
  });
  const [antwort, setAntwort] = useState<Ergebnis | null>(null);

  const z = spiel ? verfassungsZustand(world) : null;
  const v = z?.laufend;
  const paket = useMemo(() => Object.fromEntries(ARTIKEL.map((a) => [a.id, wahl[a.id] ?? statusQuoVon(a.id)])), [wahl]);
  const pr = useMemo(() => (spiel ? pruefeVerfassung(world, paket) : null), [world, paket, spiel, world.day]);

  if (!spiel || !z) return null;

  const tu = (r: Ergebnis) => {
    setAntwort(r);
    refresh();
  };

  // -------------------------------------------------------------------------
  // Laufender Vorgang: Tracking über die Stufen
  if (v) {
    const sicht = paketStimmen(world, v.paket, v.absprachen);
    const geaendert = geaenderteArtikel(v.paket);
    const stufen = [
      { id: "parlament", name: t("vf.stufe.parlament", { m: VERFASSUNG_REGELN.mehrheit, d: VERFASSUNG_REGELN.direkt }), frist: v.abstimmung },
      { id: "aym", name: t("vf.stufe.aym"), frist: v.aymTag },
      { id: "kampagne", name: t("vf.stufe.volk"), frist: v.referendumTag },
    ];
    const aktivStufe = v.phase === "parlament" ? 0 : v.phase === "aym" ? 1 : 2;
    const prognose = v.phase === "kampagne" ? referendumPrognose(world) : null;
    return (
      <div className="beschlussbuch vf-akte">
        <section className="paper">
          <h3>{t("ui.Verfassung.cdb7a4e")}</h3>
          <p className="subtitle">{geaendert.map((x) => `„${x.artikel.name}: ${x.variante.name}“`).join(", ")}</p>
          <ol className="vf-stufen">
            {stufen.map((s, i) => (
              <li key={s.id} className={i < aktivStufe ? "vf-stufe erledigt" : i === aktivStufe ? "vf-stufe aktiv" : "vf-stufe"}>
                <strong>{s.name}</strong>
                {i === aktivStufe && s.frist !== undefined && <span> · {t("vf.inTagen", { n: Math.max(0, s.frist - world.day), datum: formatDateDe(addDays(world.date, s.frist - world.day)) })}</span>}
                {i < aktivStufe && <span> · {t("vf.abgeschlossen")}</span>}
              </li>
            ))}
          </ol>
          {antwort && (
            <p className={`rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
              {antwort.text}
              {antwort.why && <em> {antwort.why}</em>}
            </p>
          )}
        </section>

        {v.phase === "parlament" && (
          <section className="paper">
            <h3>{t("vf.abstimmungAm", { datum: formatDateDe(addDays(world.date, v.abstimmung - world.day)) })}</h3>
            <div className="stimmen-bar" aria-label={t("vf.erwartetJa", { n: sicht.erwartet })}>
              <div className="stimmen-ja" style={{ width: `${Math.min(100, (sicht.erwartet / 600) * 100)}%` }} />
              <div className="stimmen-marke" style={{ left: `${(VERFASSUNG_REGELN.mehrheit / 600) * 100}%` }} title={t("vf.marke.volk", { n: VERFASSUNG_REGELN.mehrheit })} />
              <div className="stimmen-marke" style={{ left: `${(VERFASSUNG_REGELN.direkt / 600) * 100}%` }} title={t("vf.marke.direkt", { n: VERFASSUNG_REGELN.direkt })} />
            </div>
            <p>
              {t("vf.erwartet", { n: sicht.erwartet, tief: sicht.tief, hoch: sicht.hoch, absprachen: v.absprachen ?? 0, direkt: VERFASSUNG_REGELN.direkt, mehrheit: VERFASSUNG_REGELN.mehrheit })}
            </p>
            <p className="subtitle">
              {sicht.lueckeMehrheit > 0
                ? t("vf.luecke.mehrheit", { n: sicht.lueckeMehrheit })
                : sicht.lueckeDirekt > 0
                  ? t("vf.luecke.direkt", { n: sicht.lueckeDirekt })
                  : t("vf.luecke.keine")}{" "}
              {t("vf.absprachenDoppelt", { f: VERFASSUNG_REGELN.kaufFaktor })}
            </p>
            <div className="stimmen-steuerung">
              {(() => {
                const ziel = sicht.erwartet >= VERFASSUNG_REGELN.mehrheit ? VERFASSUNG_REGELN.direkt + VERFASSUNG_REGELN.stimmenPuffer : VERFASSUNG_REGELN.mehrheit + VERFASSUNG_REGELN.stimmenPuffer;
                const noetig = Math.max(0, ziel - sicht.erwartet);
                const kosten = Math.ceil(noetig * 0.5 * VERFASSUNG_REGELN.kaufFaktor);
                return noetig > 0 ? (
                  <button className="pd-btn primary" disabled={!kannZahlen(spiel.kapital, kosten)} onClick={() => tu(verfassungStimmenKaufen(world, noetig))} title={t("ui.Verfassung.d78021e")}>
                    {t("vf.huerdeSichern", { n: noetig })} <b>{kosten}</b>
                  </button>
                ) : null;
              })()}
              <button className="pd-btn quiet" onClick={() => tu(zieheVerfassungZurueck(world))} title={t("ui.Verfassung.81b4686")}>
                {t("ui.Verfassung.dfaa501")}
              </button>
            </div>
          </section>
        )}

        {v.phase === "aym" && (
          <section className="paper">
            <h3>{t("vf.angefochten")}</h3>
            {(() => {
              const s = aymSicht(world, v.paket);
              return (
                <p>
                  {t("vf.aym", {
                    n: Math.max(0, (v.aymTag ?? world.day) - world.day),
                    loyal: s.sitze.loyal,
                    unabhaengig: s.sitze.unabhaengig,
                    reform: s.sitze.reform,
                    p: s.pKassation < 0.12 ? "selten" : s.pKassation < 0.25 ? "moeglich" : "wahrscheinlich",
                  })}
                </p>
              );
            })()}
            <p className="subtitle">{t("ui.Verfassung.8ed538c")}</p>
          </section>
        )}

        {v.phase === "kampagne" && prognose && (
          <section className="paper">
            <h3>{t("vf.kampagneBis", { datum: v.referendumTag ? formatDateDe(addDays(world.date, v.referendumTag - world.day)) : "" })}</h3>
            <div className="stimmen-bar" aria-label={t("vf.erwartetProzent", { p: r1(prognose.mitte) })}>
              <div className="stimmen-ja" style={{ width: `${prognose.mitte}%` }} />
              <div className="stimmen-marke" style={{ left: "50%" }} title={t("vf.marke.mehrheit")} />
            </div>
            <p>
              {t("vf.referendum", { mitte: r1(prognose.mitte), tief: r1(prognose.tief), hoch: r1(prognose.hoch), zustimmung: r1(prognose.zustimmung), salienz: `${prognose.salienz >= 0 ? "+" : ""}${t("vf.zahl", { x: r1(prognose.salienz) })}`, kampagne: r1(prognose.kampagne) })}
            </p>
            <p className="subtitle">{t("ui.Verfassung.73d21b7")}</p>
            <div className="stimmen-steuerung">
              <button className="pd-btn" onClick={() => tu(kampagnenImpuls(world))} title={t("vf.impulsTitel", { pk: VERFASSUNG_REGELN.kampagnePk })}>
                {t("vf.impuls")} <b>{VERFASSUNG_REGELN.kampagnePk}</b>
              </button>
            </div>
          </section>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Werkstatt: Paket schnüren
  const belegt = amtszeitBelegt(world);
  const aktivEintraege = Object.entries(z.aktiv);
  return (
    <div className="beschlussbuch vf-akte">
      <section className="paper">
        <h3>{t("vf.werkstatt")}</h3>
        <p className="subtitle">{t("vf.werkstattText", { mehrheit: VERFASSUNG_REGELN.mehrheit, direkt: VERFASSUNG_REGELN.direkt })}</p>
        {belegt && <p className="weg-warnung">{t("ui.Verfassung.f354624")}</p>}
        {antwort && (
          <p className={`rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
            {antwort.text}
            {antwort.why && <em> {antwort.why}</em>}
          </p>
        )}
      </section>

      {ARTIKEL.map((a) => {
        const sperre = artikelSperre(world, a.id);
        const aktiv = verfassungAktiv(world, a.id);
        return (
          <section className="paper vf-artikel" key={a.id}>
            <h3>
              {a.name}
              {aktiv && <span className="vf-aktiv"> · {t("vf.beschlossen", { name: varianteDef(aktiv)?.name ?? aktiv })}</span>}
              {sperre > 0 && <span className="vf-sperre"> · {t("vf.gesperrt", { n: sperre - world.day })}</span>}
            </h3>
            <p className="subtitle">{a.frage}</p>
            <ul className="vf-varianten">
              {a.varianten.map((x) => {
                const gewaehlt = paket[a.id] === x.id;
                // Prognose-Delta dieser Variante gegenüber der aktuellen Wahl (Richtung statt Scheingenauigkeit)
                const alt = { ...paket, [a.id]: x.id };
                const dJetzt = paketStimmen(world, paket).erwartet;
                const dNeu = paketStimmen(world, alt).erwartet;
                const delta = gewaehlt ? 0 : dNeu - dJetzt;
                return (
                  <li key={x.id} className={gewaehlt ? "vf-variante gewaehlt" : "vf-variante"}>
                    <label>
                      <input type="radio" name={`vf-${a.id}`} checked={gewaehlt} disabled={sperre > 0 || belegt} onChange={() => setWahl({ ...wahl, [a.id]: x.id })} />
                      <strong>{x.name}</strong>
                    </label>
                    <p>{x.text}</p>
                    <p className="subtitle">
                      {x.statusQuo ? t("vf.statusQuo") : `${richtungWort(x.autoritaer)}; ${parteienText(x.parteien)}.`}
                      {!x.statusQuo && !gewaehlt && delta !== 0 && ` ${t("vf.mitVariante", { n: dNeu, delta: `${delta > 0 ? "+" : ""}${delta}` })}`}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {pr && (
        <section className="paper">
          <h3>{t("vf.paket")}</h3>
          {pr.geaendert > 0 ? (
            <>
              <p className="subtitle">{geaenderteArtikel(paket).map((x) => `„${x.artikel.name}: ${x.variante.name}“`).join(", ")}</p>
              <div className="stimmen-bar" aria-label={t("vf.erwartetJa", { n: pr.stimmen.erwartet })}>
                <div className="stimmen-ja" style={{ width: `${Math.min(100, (pr.stimmen.erwartet / 600) * 100)}%` }} />
                <div className="stimmen-marke" style={{ left: `${(VERFASSUNG_REGELN.mehrheit / 600) * 100}%` }} title={t("vf.marke.volk", { n: VERFASSUNG_REGELN.mehrheit })} />
                <div className="stimmen-marke" style={{ left: `${(VERFASSUNG_REGELN.direkt / 600) * 100}%` }} title={t("vf.marke.direkt", { n: VERFASSUNG_REGELN.direkt })} />
              </div>
              <p>{t("vf.kosten", { pk: pr.pk, n: pr.stimmen.erwartet, tief: pr.stimmen.tief, hoch: pr.stimmen.hoch })}</p>
              <ul className="vf-hinweise">
                {pr.hinweise.map((h) => (
                  <li key={h} className="subtitle">
                    {h}
                  </li>
                ))}
              </ul>
              <button
                className="pd-btn primary"
                disabled={!pr.ok}
                title={pr.ok ? t("vf.einbringenTitel") : pr.grund}
                onClick={() => tu(bringeVerfassungEin(world, paket))}
              >
                {t("vf.einbringen")} <b>{pr.pk}</b>
              </button>
              {!pr.ok && <p className="weg-warnung">{pr.grund}</p>}
            </>
          ) : (
            <p className="subtitle">{t("ui.Verfassung.4d3a1f3")}</p>
          )}
        </section>
      )}

      {(aktivEintraege.length > 0 || z.historie.length > 0) && (
        <section className="paper">
          <h3>{t("ui.Verfassung.e526422")}</h3>
          {aktivEintraege.length > 0 && (
            <p className="subtitle">{t("vf.beschlossenListe", { l: aktivEintraege.map(([id, vId]) => `„${artikelDef(id)?.name ?? id}: ${varianteDef(vId)?.name ?? vId}“`) })}</p>
          )}
          <ul className="beschluss-liste">
            {[...z.historie].reverse().map((h, i) => (
              <li key={i}>
                <span className="when">{h.datum}</span>
                <div>
                  <p>
                    {h.ausgang}: {h.artikel.join(", ")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

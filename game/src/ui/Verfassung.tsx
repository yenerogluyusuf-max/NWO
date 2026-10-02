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

const nf = (x: number, d = 1) => x.toLocaleString("de-DE", { maximumFractionDigits: d, minimumFractionDigits: d });

/** Wohin eine Variante die Macht rückt, in einem Wort. */
function richtungWort(autoritaer: number): string {
  if (autoritaer >= 2) return "zieht die Macht deutlich zum Palast";
  if (autoritaer === 1) return "stärkt die Exekutive";
  if (autoritaer === -1) return "stärkt die Kontrolle";
  if (autoritaer <= -2) return "gibt deutlich Kontrolle ab";
  return "lässt die Gewichte, wie sie sind";
}

/** Wer im Parlament eine Variante trägt oder ablehnt (Qualität statt Scheingenauigkeit). */
function parteienText(parteien: Record<string, number>): string {
  const dafuer = Object.entries(parteien).filter(([, x]) => x >= 1).map(([p]) => PARTEI_NAME[p] ?? p);
  const dagegen = Object.entries(parteien).filter(([, x]) => x <= -1).map(([p]) => PARTEI_NAME[p] ?? p);
  const teile: string[] = [];
  if (dafuer.length) teile.push(`dafür: ${dafuer.join(", ")}`);
  if (dagegen.length) teile.push(`dagegen: ${dagegen.join(", ")}`);
  return teile.length ? teile.join("; ") : "ohne klare Fronten im Parlament";
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
      { id: "parlament", name: `Parlament (Hürden ${VERFASSUNG_REGELN.mehrheit}/${VERFASSUNG_REGELN.direkt})`, frist: v.abstimmung },
      { id: "aym", name: "Verfassungsgericht", frist: v.aymTag },
      { id: "kampagne", name: "Volksabstimmung", frist: v.referendumTag },
    ];
    const aktivStufe = v.phase === "parlament" ? 0 : v.phase === "aym" ? 1 : 2;
    const prognose = v.phase === "kampagne" ? referendumPrognose(world) : null;
    return (
      <div className="beschlussbuch">
        <section className="paper">
          <h3>Der Verfassungsvorgang läuft</h3>
          <p className="subtitle">{geaendert.map((x) => `„${x.artikel.name}: ${x.variante.name}“`).join(", ")}</p>
          <ol className="vf-stufen">
            {stufen.map((s, i) => (
              <li key={s.id} className={i < aktivStufe ? "vf-stufe erledigt" : i === aktivStufe ? "vf-stufe aktiv" : "vf-stufe"}>
                <strong>{s.name}</strong>
                {i === aktivStufe && s.frist !== undefined && <span> · in {Math.max(0, s.frist - world.day)} Tagen ({formatDateDe(addDays(world.date, s.frist - world.day))})</span>}
                {i < aktivStufe && <span> · abgeschlossen</span>}
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
            <h3>Parlamentsabstimmung am {formatDateDe(addDays(world.date, v.abstimmung - world.day))}</h3>
            <div className="stimmen-bar" aria-label={`Erwartet ${sicht.erwartet} Ja-Stimmen`}>
              <div className="stimmen-ja" style={{ width: `${Math.min(100, (sicht.erwartet / 600) * 100)}%` }} />
              <div className="stimmen-marke" style={{ left: `${(VERFASSUNG_REGELN.mehrheit / 600) * 100}%` }} title={`${VERFASSUNG_REGELN.mehrheit}: Volksabstimmung nötig`} />
              <div className="stimmen-marke" style={{ left: `${(VERFASSUNG_REGELN.direkt / 600) * 100}%` }} title={`${VERFASSUNG_REGELN.direkt}: direkt Gesetz`} />
            </div>
            <p>
              Erwartet werden <strong>{sicht.erwartet}</strong> Ja-Stimmen (Spanne {sicht.tief}–{sicht.hoch}
              {v.absprachen ? `, darin ${v.absprachen} Absprachen` : ""}). Ab {VERFASSUNG_REGELN.direkt} wird das Paket direkt Gesetz, ab {VERFASSUNG_REGELN.mehrheit} entscheidet das Volk, darunter scheitert es.
            </p>
            <p className="subtitle">
              {sicht.lueckeMehrheit > 0
                ? `Zur ersten Hürde fehlen erwartet ${sicht.lueckeMehrheit} Stimmen.`
                : sicht.lueckeDirekt > 0
                  ? `Die erste Hürde steht; zur Direkt-Hürde fehlen erwartet ${sicht.lueckeDirekt} Stimmen.`
                  : "Die Direkt-Hürde steht der Prognose nach."}{" "}
              Absprachen kosten bei der Verfassungsfrage das Doppelte ({VERFASSUNG_REGELN.kaufFaktor}×).
            </p>
            <div className="stimmen-steuerung">
              {(() => {
                const ziel = sicht.erwartet >= VERFASSUNG_REGELN.mehrheit ? VERFASSUNG_REGELN.direkt + VERFASSUNG_REGELN.stimmenPuffer : VERFASSUNG_REGELN.mehrheit + VERFASSUNG_REGELN.stimmenPuffer;
                const noetig = Math.max(0, ziel - sicht.erwartet);
                const kosten = Math.ceil(noetig * 0.5 * VERFASSUNG_REGELN.kaufFaktor);
                return noetig > 0 ? (
                  <button className="aktion-knopf" disabled={!kannZahlen(spiel.kapital, kosten)} onClick={() => tu(verfassungStimmenKaufen(world, noetig))} title="Absprachen mit Fraktionen; bei der Verfassungsfrage doppelt so teuer">
                    Hürde sichern: +{noetig} Stimmen <b>{kosten}</b>
                  </button>
                ) : null;
              })()}
              <button className="aktion-knopf leise" onClick={() => tu(zieheVerfassungZurueck(world))} title="Gekaufte Stimmen sind verloren; ein Teil des Kapitals kommt zurück">
                Zurückziehen
              </button>
            </div>
          </section>
        )}

        {v.phase === "aym" && (
          <section className="paper">
            <h3>Die Opposition hat angefochten</h3>
            {(() => {
              const s = aymSicht(world, v.paket);
              return (
                <p>
                  Das Verfassungsgericht entscheidet in {Math.max(0, (v.aymTag ?? world.day) - world.day)} Tagen. Sein Stand — {s.sitze.loyal} loyal, {s.sitze.unabhaengig} unabhängig, {s.sitze.reform} reformorientiert — lässt eine Kassation eher{" "}
                  {s.pKassation < 0.12 ? "unwahrscheinlich" : s.pKassation < 0.25 ? "möglich" : "wahrscheinlich"} erscheinen.
                </p>
              );
            })()}
            <p className="subtitle">Kassiert das Gericht, ist das Paket tot, der Groll wächst und die Artikel sind zwölf Monate gesperrt. Lässt es zu, geht es weiter.</p>
          </section>
        )}

        {v.phase === "kampagne" && prognose && (
          <section className="paper">
            <h3>Kampagne bis {v.referendumTag ? formatDateDe(addDays(world.date, v.referendumTag - world.day)) : ""}</h3>
            <div className="stimmen-bar" aria-label={`Erwartet ${nf(prognose.mitte)} Prozent Ja`}>
              <div className="stimmen-ja" style={{ width: `${prognose.mitte}%` }} />
              <div className="stimmen-marke" style={{ left: "50%" }} title="50 %: Mehrheit" />
            </div>
            <p>
              Erwartet werden etwa <strong>{nf(prognose.mitte)} Prozent</strong> Ja (Spanne {nf(prognose.tief)}–{nf(prognose.hoch)}): Zustimmung {nf(prognose.zustimmung)}, Themen der Artikel {prognose.salienz >= 0 ? "+" : ""}
              {nf(prognose.salienz)}, Kampagne +{nf(prognose.kampagne)}.
            </p>
            <p className="subtitle">Die Auszählung streut wie eine Wahl; jede weitere Kampagnen-Welle wirkt schwächer. Ein Nein kostet schweres Vertrauen und stärkt die Opposition.</p>
            <div className="stimmen-steuerung">
              <button className="aktion-knopf" onClick={() => tu(kampagnenImpuls(world))} title={`${VERFASSUNG_REGELN.kampagnePk} Kapital je Impuls, mit Abkühlzeit von einer Woche`}>
                Kampagnen-Impuls <b>{VERFASSUNG_REGELN.kampagnePk}</b>
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
    <div className="beschlussbuch">
      <section className="paper">
        <h3>Die Verfassungs-Werkstatt</h3>
        <p className="subtitle">
          Eine Verfassungsfrage je Amtszeit: Schnüren Sie ein Paket aus bis zu fünf Artikeln. Das Parlament braucht {VERFASSUNG_REGELN.mehrheit} Stimmen — dann entscheidet das Volk — oder {VERFASSUNG_REGELN.direkt} für den
          direkten Beschluss; das Verfassungsgericht kann anfechtbar sein. Gescheiterte Artikel sind zwölf Monate gesperrt.
        </p>
        {belegt && <p className="weg-warnung">Diese Amtszeit hat ihre Verfassungsdebatte hinter sich: Erst nach einer Wiederwahl trägt das Land eine neue Frage.</p>}
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
              {aktiv && <span className="vf-aktiv"> · beschlossen: {varianteDef(aktiv)?.name ?? aktiv}</span>}
              {sperre > 0 && <span className="vf-sperre"> · gesperrt noch {sperre - world.day} Tage</span>}
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
                      {x.statusQuo ? "Der bisherige Stand." : `${richtungWort(x.autoritaer)}; ${parteienText(x.parteien)}.`}
                      {!x.statusQuo && !gewaehlt && delta !== 0 && ` Mit dieser Variante stünde das Paket erwartet bei etwa ${dNeu} Ja-Stimmen (${delta > 0 ? "+" : ""}${delta}).`}
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
          <h3>Das Paket</h3>
          {pr.geaendert > 0 ? (
            <>
              <p className="subtitle">{geaenderteArtikel(paket).map((x) => `„${x.artikel.name}: ${x.variante.name}“`).join(", ")}</p>
              <div className="stimmen-bar" aria-label={`Erwartet ${pr.stimmen.erwartet} Ja-Stimmen`}>
                <div className="stimmen-ja" style={{ width: `${Math.min(100, (pr.stimmen.erwartet / 600) * 100)}%` }} />
                <div className="stimmen-marke" style={{ left: `${(VERFASSUNG_REGELN.mehrheit / 600) * 100}%` }} title={`${VERFASSUNG_REGELN.mehrheit}: Volksabstimmung nötig`} />
                <div className="stimmen-marke" style={{ left: `${(VERFASSUNG_REGELN.direkt / 600) * 100}%` }} title={`${VERFASSUNG_REGELN.direkt}: direkt Gesetz`} />
              </div>
              <p>
                Kosten: <strong>{pr.pk}</strong> Politisches Kapital · erwartet <strong>{pr.stimmen.erwartet}</strong> Ja-Stimmen (Spanne {pr.stimmen.tief}–{pr.stimmen.hoch}).
              </p>
              <ul className="vf-hinweise">
                {pr.hinweise.map((h) => (
                  <li key={h} className="subtitle">
                    {h}
                  </li>
                ))}
              </ul>
              <button
                className="aktion-knopf"
                disabled={!pr.ok}
                title={pr.ok ? "Das Paket einbringen; die Abstimmung folgt in vier Wochen" : pr.grund}
                onClick={() => tu(bringeVerfassungEin(world, paket))}
              >
                Paket einbringen <b>{pr.pk}</b>
              </button>
              {!pr.ok && <p className="weg-warnung">{pr.grund}</p>}
            </>
          ) : (
            <p className="subtitle">Noch ändert das Paket nichts: Wählen Sie mindestens einen Artikel, der vom bisherigen Recht abweicht.</p>
          )}
        </section>
      )}

      {(aktivEintraege.length > 0 || z.historie.length > 0) && (
        <section className="paper">
          <h3>Verfassungsstand und Geschichte</h3>
          {aktivEintraege.length > 0 && (
            <p className="subtitle">Beschlossen: {aktivEintraege.map(([id, vId]) => `„${artikelDef(id)?.name ?? id}: ${varianteDef(vId)?.name ?? vId}“`).join(", ")}.</p>
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

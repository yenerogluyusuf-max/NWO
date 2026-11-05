// Die Maßnahmen eines Politikbereichs als Tafel nach dem Vorbild des Haushalts (Vorgabe V, ENTSCHEIDUNGEN): jede Maßnahme eine
// Zeile mit Regler über ihre Stufen; wer eine Stufe wählt, sieht darunter Kapital, Mehrheit, Dauer und Haushalt und bringt das
// Gesetz dort ein. Ein Vorschlag des Stabs steht als Marke an seiner Zeile, nicht in einer zweiten Liste.

import { useMemo, useState } from "react";
import type { World } from "../../sim/types";
import type { Vorschlag } from "../../sim/vorschlaege";
import { bringeEin, pruefeVorhaben, REGELN } from "../../sim/handeln";
import { naechsteStufe, skala, skalenArt } from "../../data/skalen";
import { t, zahl } from "../../i18n";
import type { MassnahmeZeile } from "./bereiche";

type Ergebnis = { ok: boolean; text: string; why?: string };

/** Die wählbaren Werte einer Maßnahme: benannte Zustände oder 0, 10, … 100 */
function stufenVon(id: string, jetzt: number): { w: number; name: string }[] {
  if (skalenArt(id) === "regime") return skala(id, jetzt).stufen.map((s) => ({ w: s.w, name: s.name }));
  return Array.from({ length: 11 }, (_, i) => ({ w: i * 10, name: t("po2.stufe", { n: i * 10 }) }));
}

function naechsterIndex(stufen: { w: number }[], wert: number): number {
  let beste = 0;
  stufen.forEach((s, i) => {
    if (Math.abs(s.w - wert) < Math.abs(stufen[beste]!.w - wert)) beste = i;
  });
  return beste;
}

function Pruefzeile({ world, m, ziel, ort, onErgebnis, onGenauer, onVerwerfen }: { world: World; m: MassnahmeZeile; ziel: number; ort: number[] | null; onErgebnis: (r: Ergebnis) => void; onGenauer: () => void; onVerwerfen: () => void }) {
  const p = useMemo(() => pruefeVorhaben(world, m.id, ziel, ort), [world, m.id, ziel, ort, world.day, world.spiel?.kapital]);
  const st = p.gesetz.stimmen;
  return (
    <div className="mt-panel" role="region" aria-label={m.name}>
      <p className="mt-text">{m.text}</p>
      {p.ok ? (
        <dl className="mt-fakten">
          <div><dt>{t("po2.kapital")}</dt><dd className={p.gesetz.bezahlbar ? "" : "schlecht"}>{t("po2.kapitalWert", { n: p.gesetz.pk })}</dd></div>
          <div><dt>{t("po2.mehrheit")}</dt><dd className={st.luecke > 0 ? "schlecht" : ""}>{st.luecke > 0 ? t("po2.fehlen", { n: st.luecke }) : t("po2.steht", { ja: st.erwartet, noetig: REGELN.mehrheit })}</dd></div>
          <div><dt>{t("po2.dauer")}</dt><dd>{t("po2.monate", { n: p.monate })}</dd></div>
          <div><dt>{t("po2.haushalt")}</dt><dd>{Math.abs(p.kostenBip) < 0.005 ? t("po2.keineKosten") : t(p.kostenBip > 0 ? "po2.kostet" : "po2.bringt", { n: zahl(Math.abs(p.kostenBip), 2) })}</dd></div>
        </dl>
      ) : (
        <p className="mt-gesperrt">{p.grund}</p>
      )}
      {p.hinweise.length > 0 && <p className="mt-hinweis">{p.hinweise.join(" ")}</p>}
      <div className="mt-knoepfe">
        <button type="button" className="brass-button" disabled={!p.ok || !p.gesetz.bezahlbar} onClick={() => onErgebnis(bringeEin(world, m.id, ziel, ort, "gesetz"))}>
          {t("po2.einbringen", { n: p.gesetz.pk })}
        </button>
        {p.ok && p.erlass.moeglich && (
          <button type="button" className="pd-btn" disabled={!p.erlass.bezahlbar} onClick={() => onErgebnis(bringeEin(world, m.id, ziel, ort, "erlass"))}>
            {t("po2.erlass", { n: p.erlass.pk })}
          </button>
        )}
        <button type="button" className="pd-btn quiet" onClick={onGenauer}>{t("po2.genauer")}</button>
        <button type="button" className="pd-btn quiet" onClick={onVerwerfen}>{t("po2.verwerfen")}</button>
      </div>
    </div>
  );
}

export function MassnahmenTafel({ world, massnahmen, vorschlaege, refresh, onGenauer }: {
  world: World;
  massnahmen: MassnahmeZeile[];
  vorschlaege: Vorschlag[];
  refresh: () => void;
  onGenauer: (o: { id: string; level?: number; ort: number[] | null }) => void;
}) {
  const [wahl, setWahl] = useState<{ id: string; ziel: number; ort: number[] | null } | null>(null);
  const [antwort, setAntwort] = useState<Ergebnis | null>(null);
  const vorschlagFuer = new Map(vorschlaege.map((v) => [v.massnahme, v]));
  return (
    <section className="mt" aria-label={t("po2.titel")}>
      <h4>{t("po2.titel")}</h4>
      {antwort && (
        <p className={`rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
          {antwort.text}
          {antwort.why && <em> {antwort.why}</em>}
        </p>
      )}
      <ul className="mt-liste">
        {massnahmen.map((m) => {
          const stufen = stufenVon(m.id, m.jetzt);
          const aktiv = wahl?.id === m.id;
          const zielWert = aktiv ? wahl!.ziel : m.jetzt;
          const idx = naechsterIndex(stufen, zielWert);
          const v = vorschlagFuer.get(m.id);
          const setze = (i: number, ort: number[] | null = null) => {
            const s = stufen[Math.max(0, Math.min(stufen.length - 1, i))]!;
            setAntwort(null);
            setWahl(Math.abs(s.w - m.jetzt) < 1 ? null : { id: m.id, ziel: s.w, ort });
          };
          const jetztName = skalenArt(m.id) === "regime" ? naechsteStufe(skala(m.id, m.jetzt), m.jetzt).stufe.name : t("po2.stufe", { n: Math.round(m.jetzt) });
          return (
            <li key={m.id} className={`mt-zeile${aktiv ? " on" : ""}${m.imParlament || m.umsetzung ? " laeuft" : ""}`}>
              <div className="mt-reihe">
                <div className="mt-name">
                  <span title={m.text}>{m.name}</span>
                  <small>
                    {m.imParlament ? t("po2.imParlament", { tage: m.imParlament.tage }) : m.umsetzung ? t("po2.umsetzung", { stand: Math.round(m.umsetzung.stand), rest: m.umsetzung.rest }) : m.blocker ? m.blocker.titel.slice(0, 80) : ""}
                    {v && !aktiv && (
                      <button type="button" className="mt-vorschlag" onClick={() => setWahl({ id: m.id, ziel: v.ziel, ort: v.ort })}>
                        {t("po2.vorschlag", { stufe: v.zielName ?? t("po2.stufe", { n: v.ziel }), problem: v.problemName })}
                      </button>
                    )}
                  </small>
                </div>
                <div className="mt-regler">
                  <button type="button" aria-label={`${m.name}: ${t("po2.weniger")}`} disabled={idx <= 0} onClick={() => setze(idx - 1)}>−</button>
                  <input type="range" min={0} max={stufen.length - 1} step={1} value={idx} aria-label={m.name} aria-valuetext={stufen[idx]?.name} onChange={(e) => setze(Number(e.target.value))} />
                  <button type="button" aria-label={`${m.name}: ${t("po2.mehr")}`} disabled={idx >= stufen.length - 1} onClick={() => setze(idx + 1)}>+</button>
                </div>
                <span className="mt-stufe">{aktiv ? <><s>{jetztName}</s> <b>{stufen[idx]?.name}</b></> : jetztName}</span>
              </div>
              {aktiv && wahl && (
                <Pruefzeile
                  world={world}
                  m={m}
                  ziel={wahl.ziel}
                  ort={wahl.ort}
                  onErgebnis={(r) => {
                    setAntwort(r);
                    if (r.ok) setWahl(null);
                    refresh();
                  }}
                  onGenauer={() => onGenauer({ id: m.id, level: wahl.ziel, ort: wahl.ort })}
                  onVerwerfen={() => setWahl(null)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

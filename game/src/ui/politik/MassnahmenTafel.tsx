// Die Maßnahmen eines Politikbereichs als Tafel nach dem Vorbild des Haushalts (Vorgabe V, ENTSCHEIDUNGEN): jede Maßnahme eine
// Zeile mit Regler über ihre Stufen; wer eine Stufe wählt, sieht darunter Kapital, Mehrheit, Dauer und Haushalt und bringt das
// Gesetz dort ein. Ein Vorschlag des Stabs steht als Marke an seiner Zeile, nicht in einer zweiten Liste. Das ist der einzige Weg
// zum Gesetz (ENTSCHEIDUNGEN W 2): Einträge des Gesetzeskatalogs erscheinen hier als benannte Fassungen.

import { useMemo, useState } from "react";
import type { World } from "../../sim/types";
import type { Vorschlag } from "../../sim/vorschlaege";
import { bringeEin, GESETZ_SCHWELLE, KOMMISSION, REGELN } from "../../sim/handeln";
import { jaAnteilLager } from "../../sim/linie";
import { NOTSTAND_AB } from "../../data/rechtswege";
import { NotstandKarte } from "../parlament/NotstandKarte";
import { notstandSicht } from "../../sim/notstand";
import { fassungsKnoepfe, gesetzesPrognose } from "../../sim/gesetzgebung";
import type { FassungId } from "../../data/gesetzesvorhaben";
import { echteHalte, echterSatz, hatZustaende, naechsteStufe, skala, skalenArt, stufenName } from "../../data/skalen";
import { ETAT_DER_MASSNAHME, POSTEN_NACH_ID } from "../../sim/haushalt";
import { t, zahl } from "../../i18n";
import type { MassnahmeZeile } from "./bereiche";
import { Preisfeld, ReglerZeile } from "../bausteine/ReglerZeile";

type Ergebnis = { ok: boolean; text: string; why?: string };

/** Die wählbaren Werte einer Maßnahme: benannte Zustände, echte Sätze in ganzen Punkten (N3, B-2) oder 0, 10, … 100 */
function stufenVon(id: string, jetzt: number): { w: number; name: string }[] {
  if (skalenArt(id) === "regime" || hatZustaende(id)) return skala(id, jetzt).stufen.map((s) => ({ w: s.w, name: s.name }));
  if (echterSatz(id)) return echteHalte(id).map((h) => ({ w: h.w, name: stufenName(id, h.w) }));
  return Array.from({ length: 11 }, (_, i) => ({ w: i * 10, name: stufenName(id, i * 10) }));
}

function naechsterIndex(stufen: { w: number }[], wert: number): number {
  let beste = 0;
  stufen.forEach((s, i) => {
    if (Math.abs(s.w - wert) < Math.abs(stufen[beste]!.w - wert)) beste = i;
  });
  return beste;
}

/** Die Prüfzeile unter dem Regler (G1–G6, Plan Anhang A 1.1): Fassungen als Knöpfe, eine Prognose für Kapital, Mehrheit, Dauer und
 *  Haushalt, wer dafür und dagegen ist, dann Einbringen oder Erlass mit dem Risiko vor dem Verfassungsgericht. */
function Pruefzeile({ world, m, ziel, ort, wahl, onFassung, onErgebnis, onGenauer, onVerwerfen }: { world: World; m: MassnahmeZeile; ziel: number; ort: number[] | null; wahl?: FassungId; onFassung: (ziel: number, f: FassungId) => void; onErgebnis: (r: Ergebnis) => void; onGenauer: () => void; onVerwerfen: () => void }) {
  const prog = useMemo(() => gesetzesPrognose(world, m.id, ziel, ort, wahl), [world, m.id, ziel, ort, wahl, world.day, world.spiel?.kapital]);
  const knoepfe = useMemo(() => (ort ? [] : fassungsKnoepfe(world, m.id)), [world, m.id, ort, world.day]);
  const p = prog.pruefung;
  const fas = prog.fassung;
  // B-19: Eigene Partei und Partner stehen nicht unter „Dafür/Dagegen“, sondern mit ihrem Ja-Anteil
  const namen = (l: { name: string; art: string }[]) => l.filter((x) => x.art !== "eigene" && x.art !== "partner").slice(0, 4).map((x) => x.name).join(", ");
  const eigene = world.player?.partei.kurz;
  const richtung = Math.sign(ziel - m.jetzt);
  const eigeneJa = eigene && world.spiel ? Math.round(jaAnteilLager(world, eigene, m.id, richtung) * 100) : undefined;
  const kommission = p.rechtsweg === "kommission";
  // Art. 119: Ab den Notstandsdekreten ist der Weg das Ausrufen des Ausnahmezustands
  if (m.id === "m_notstand" && ziel >= NOTSTAND_AB && world.spiel) {
    return (
      <div className="mt-panel" role="region" aria-label={m.name}>
        <p className="mt-text">{m.text}</p>
        <NotstandKarte world={world} tun={onErgebnis} />
        <div className="mt-knoepfe">
          <button type="button" className="pd-btn quiet" onClick={onVerwerfen}>{t("po2.verwerfen")}</button>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-panel" role="region" aria-label={m.name}>
      <p className="mt-text">{m.text}</p>
      {knoepfe.map((k) => (
        <div key={k.vorhaben} className="mt-fassungen" role="group" aria-label={k.titel}>
          <span>{k.titel}:</span>
          {k.knoepfe.map((b) => (
            <button key={b.fassung} type="button" className={`pd-btn quiet${fas?.vorhaben === k.vorhaben && fas.fassung === b.fassung ? " on" : ""}`} aria-pressed={fas?.vorhaben === k.vorhaben && fas.fassung === b.fassung} onClick={() => onFassung(b.ziel, b.fassung)}>
              {t(`gesetz.fassung.${b.fassung}`)}
            </button>
          ))}
        </div>
      ))}
      {fas && <p className="mt-gilt">{t("po2.giltAls", { titel: fas.titel, fassung: t(`gesetz.fassung.${fas.fassung}`) })}</p>}
      {p.ok ? (
        <Preisfeld
          kl="mt"
          fakten={[
            { label: t("po2.kapital"), wert: t("po2.kapitalWert", { n: p.gesetz.pk }), schlecht: !p.gesetz.bezahlbar },
            kommission
              ? { label: t("n4.mt.weg"), wert: t("n4.mt.kommission", { tage: KOMMISSION.tage }) }
              : { label: t("po2.mehrheit"), wert: prog.luecke > 0 ? t("po2.fehlen", { n: prog.luecke }) : t("n4.mt.steht", { ja: prog.ja, noetig: GESETZ_SCHWELLE }), schlecht: prog.luecke > 0 },
            { label: t("po2.dauer"), wert: kommission ? t("po2.monate", { n: p.monate }) : t("n4.mt.dauer", { tage: REGELN.tageBisAbstimmung, monate: p.monate }) },
            // F1 (N3): Maßnahmen mit gleichnamigem Etat kosten kein eigenes Geld; das Preisfeld nennt den Etat, der sie bezahlt
            { label: t("po2.haushalt"), wert: ETAT_DER_MASSNAHME[m.id] ? t("n3.f1.etat", { posten: POSTEN_NACH_ID[ETAT_DER_MASSNAHME[m.id]!]?.name ?? "" }) : Math.abs(p.kostenBip) < 0.005 ? t("po2.keineKosten") : t(p.kostenBip > 0 ? "po2.kostet" : "po2.bringt", { n: zahl(Math.abs(p.kostenBip), 2) }) },
          ]}
        />
      ) : (
        <p className="mt-gesperrt">{p.grund}</p>
      )}
      {prog.lager && (prog.lager.fuer.length > 0 || prog.lager.gegen.length > 0) && (
        <p className="mt-lager">
          {namen(prog.lager.fuer) && <span><b>{t("po2.dafuer")}</b> {namen(prog.lager.fuer)}</span>}
          {namen(prog.lager.gegen) && <span><b>{t("po2.dagegen")}</b> {namen(prog.lager.gegen)}</span>}
          {eigeneJa !== undefined && !kommission && <span><b>{t("n4.mt.eigene")}</b> {eigeneJa >= 99 ? t("n4.mt.geschlossen") : t("n4.mt.anteil", { p: eigeneJa })}</span>}
        </p>
      )}
      {p.hinweise.length > 0 && <p className="mt-hinweis">{p.hinweise.join(" ")}</p>}
      <div className="mt-knoepfe">
        <button type="button" className="brass-button" disabled={!p.ok || !p.gesetz.bezahlbar} onClick={() => onErgebnis(bringeEin(world, m.id, ziel, ort, "gesetz", wahl))}>
          {t(kommission ? "n4.mt.vorgabe" : "n4.mt.einbringen", { n: p.gesetz.pk })}
        </button>
        {p.ok && p.erlass.moeglich && (
          <button type="button" className="pd-btn" disabled={!p.erlass.bezahlbar} onClick={() => onErgebnis(bringeEin(world, m.id, ziel, ort, "erlass", wahl))}>
            {p.erlass.art === "beschluss" ? t("n4.mt.beschluss", { n: p.erlass.pk }) : fas && fas.gerichtP > 0 ? t("po2.erlassGericht", { n: p.erlass.pk, p: Math.round(fas.gerichtP * 100) }) : t("po2.erlass", { n: p.erlass.pk })}
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
  const [wahl, setWahl] = useState<{ id: string; ziel: number; ort: number[] | null; fassung?: FassungId } | null>(null);
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
          const jetztName = skalenArt(m.id) === "regime" ? naechsteStufe(skala(m.id, m.jetzt), m.jetzt).stufe.name : stufenName(m.id, m.jetzt);
          return (
            <ReglerZeile
              key={m.id}
              kl="mt"
              zustand={`${aktiv ? "on" : ""}${m.imParlament || m.umsetzung ? " laeuft" : ""}`.trim()}
              wert={idx}
              min={0}
              max={stufen.length - 1}
              onWert={(i) => setze(i)}
              minus={`${m.name}: ${t("po2.weniger")}`}
              plus={`${m.name}: ${t("po2.mehr")}`}
              aria={m.name}
              {...(stufen[idx] ? { ariaWert: stufen[idx]!.name } : {})}
              anzeigeKlasse="stufe"
              vorher={jetztName}
              {...(aktiv ? { nachher: stufen[idx]?.name } : {})}
              name={
                <div className="mt-name">
                  <span title={m.text}>{m.name}</span>
                  <small>
                    {m.id === "m_notstand" && notstandSicht(world).aktiv ? t("n4.mt.notstandAktiv", { datum: notstandSicht(world).aktiv!.datum }) : m.imParlament ? t("po2.imParlament", { tage: m.imParlament.tage }) : m.umsetzung ? t("po2.umsetzung", { stand: Math.round(m.umsetzung.stand), rest: m.umsetzung.rest }) : m.blocker ? m.blocker.titel.slice(0, 80) : ""}
                    {v && !aktiv && (
                      <button type="button" className="mt-vorschlag" onClick={() => setWahl({ id: m.id, ziel: v.ziel, ort: v.ort })}>
                        {t("po2.vorschlag", { stufe: v.zielName ?? stufenName(m.id, v.ziel), problem: v.problemName })}
                      </button>
                    )}
                  </small>
                </div>
              }
            >
              {aktiv && wahl && (
                <Pruefzeile
                  world={world}
                  m={m}
                  ziel={wahl.ziel}
                  ort={wahl.ort}
                  {...(wahl.fassung ? { wahl: wahl.fassung } : {})}
                  onFassung={(ziel, fassung) => {
                    setAntwort(null);
                    setWahl({ id: m.id, ziel, ort: null, fassung });
                  }}
                  onErgebnis={(r) => {
                    setAntwort(r);
                    if (r.ok) setWahl(null);
                    refresh();
                  }}
                  onGenauer={() => onGenauer({ id: m.id, level: wahl.ziel, ort: wahl.ort })}
                  onVerwerfen={() => setWahl(null)}
                />
              )}
            </ReglerZeile>
          );
        })}
      </ul>
    </section>
  );
}

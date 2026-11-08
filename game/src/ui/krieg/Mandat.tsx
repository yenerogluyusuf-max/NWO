// Das Mandat der Nationalversammlung als Karte (Welle 4, K7; krieg.md Schritt 11; ENTSCHEIDUNGEN Z: Zahlen statt Sätze).
// Oben die erwartete Abstimmung mit Mehrheit der Anwesenden (Art. 96), darunter ein Balken der Ja-Stimmen nach Fraktionen und je Fraktion
// eine Zeile mit Haltung, Stimmen und dem Knopf für eine Zusage. Für Syrien und den Irak steht stattdessen die Vollmacht mit ihrer Frist.
// Dazu die Heimatfront im Krieg: Reservisten unter Waffen und eine unterdrückte Kritik. Rechnet nichts selbst: sim/mandat.ts, sim/krieg.ts.

import type { World } from "../../sim/types";
import type { KriegVorgang } from "../../sim/krieg-typen";
import { einsatzAnlass, mandatSperreBis, reservistenUnterWaffen, type KriegHandlungId, type KriegHandlungSicht } from "../../sim/krieg";
import { mandatSicht } from "../../sim/mandat";
import { vollmachtFuer, vollmachtStand } from "../../sim/krieg-recht";
import { reservistenLuecke } from "../../sim/reservisten";
import { PARTY_COLORS } from "../parlament/lage";
import { addDays } from "../../sim/dates";
import { datum, t, zahl } from "../../i18n";
import { useSprache } from "../../i18n/react";
import "./mandat.css";

const n0 = (x: number) => zahl(Math.round(x), 0);

export function Mandat({ world, k, handlungen, tun }: { world: World; k: KriegVorgang; handlungen: KriegHandlungSicht[]; tun: (id: KriegHandlungId) => void }) {
  useSprache();
  const vollmacht = vollmachtFuer(world, k.land);
  if (vollmacht) {
    const letzte = vollmachtStand(world).verlauf.filter((v) => v.angenommen).at(-1);
    return (
      <section className="km7 km7-vollmacht" aria-label={t("welle_k7.m.titel")}>
        <h5>{t("welle_k7.m.titel")}</h5>
        <dl className="km7-kern">
          <div>
            <dt>{t("welle_k7.m.v.bis")}</dt>
            <dd>{datum(vollmacht.bis)}</dd>
          </div>
          <div>
            <dt>{t("welle_k7.m.v.abstimmung")}</dt>
            <dd>{t("welle_k7.m.v.monat", { jahr: vollmacht.bis.slice(0, 4) })}</dd>
          </div>
          {letzte && (
            <div>
              <dt>{t("welle_k7.m.v.letzte")}</dt>
              <dd>{t("welle_k7.m.v.letzte_wert", { ja: n0(letzte.ja), nein: n0(letzte.nein) })}</dd>
            </div>
          )}
          <p className="km7-urteil gut">{t("welle_k7.m.v.satz")}</p>
        </dl>
      </section>
    );
  }
  const m = mandatSicht(world, einsatzAnlass(k));
  const sperre = mandatSperreBis(world, k.land);
  const zusagen = new Map(handlungen.filter((h) => h.id.startsWith("zusage_")).map((h) => [h.id.slice("zusage_".length), h]));
  const farbe = (p: string) => (p === world.player?.partei.kurz ? world.player.partei.farbe : PARTY_COLORS[p] ?? "#9a8f78");
  const puffer = m.ja - m.noetig;
  return (
    <section className="km7" aria-label={t("welle_k7.m.titel")}>
      <h5>{t("welle_k7.m.titel")}</h5>
      <dl className="km7-kern">
        <div className={puffer < 0 ? "schlecht" : undefined}>
          <dt>{t("welle_k7.m.ja")}</dt>
          <dd>{n0(m.ja)}</dd>
        </div>
        <div>
          <dt>{t("welle_k7.m.noetig")}</dt>
          <dd>{n0(m.noetig)}</dd>
        </div>
        <div>
          <dt>{t("welle_k7.m.anwesend")}</dt>
          <dd>{n0(m.anwesend)}</dd>
        </div>
        <p className={`km7-urteil ${puffer < 0 ? "schlecht" : "gut"}`}>
          {puffer >= 0 ? t("welle_k7.m.reicht", { puffer: n0(puffer) }) : t("welle_k7.m.fehlt", { fehlen: n0(-puffer) })}
        </p>
      </dl>
      <div className="km7-balken" aria-hidden>
        {m.fraktionen.map((f) => f.ja > 0 && <i key={f.partei} style={{ width: `${(f.ja / m.anwesend) * 100}%`, background: farbe(f.partei) }} />)}
        <u style={{ left: `${(m.noetig / m.anwesend) * 100}%` }} />
      </div>
      <ul className="km7-fraktionen">
        {m.fraktionen.map((f) => {
          const z = zusagen.get(f.partei);
          const wort = f.rolle === "eigene" ? t("welle_k7.m.haltung.eigene") : f.zusage ? t("welle_k7.m.haltung.zusage") : t(`welle_k7.m.haltung.${f.haltung}`);
          return (
            <li key={f.partei} className={`km7-f km7-${f.ja > f.nein + f.enthaltung ? "ja" : f.nein > f.ja + f.enthaltung ? "nein" : "geteilt"}`}>
              <span className="km7-farbe" style={{ background: farbe(f.partei) }} aria-hidden />
              <b>{f.name}</b>
              <span className="km7-sitze">{n0(f.sitze)}</span>
              <span className="km7-wort">{wort}</span>
              <span className="km7-zahlen">{t("welle_k7.m.zeile", { ja: n0(f.ja), nein: n0(f.nein), enth: n0(f.enthaltung) })}</span>
              {z && (
                <button type="button" className="aktion-knopf km7-zusage" disabled={!z.moeglich} title={z.moeglich ? z.hinweis : z.grund} onClick={() => tun(z.id)}>
                  {z.label} <b>{z.pk}</b>
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {[...zusagen.values()].slice(0, 1).map((z) => <p key={z.id} className="km7-hinweis">{z.hinweis}</p>)}
      {sperre > world.day && <p className="km7-sperre">{t("welle_k7.m.sperre", { datum: addDays(world.date, sperre - world.day) })}</p>}
    </section>
  );
}

/** Heimatfront im Krieg: Reservisten unter Waffen (fehlen in den Betrieben) und eine unterdrückte Kritik am Einsatz. */
export function Heimatfront({ world, k }: { world: World; k: KriegVorgang }) {
  useSprache();
  const n = reservistenUnterWaffen(world);
  const kritik = k.kritikBis !== undefined && k.kritikBis > world.day;
  if (n <= 0 && !kritik) return null;
  const l = reservistenLuecke(n);
  return (
    <section className="km7 km7-heimat" aria-label={t("welle_k7.heimat.titel")}>
      <h5>{t("welle_k7.heimat.titel")}</h5>
      {n > 0 && (
        <dl className="km7-kern">
          <div>
            <dt>{t("welle_k7.heimat.reservisten")}</dt>
            <dd>{n0(n)}</dd>
          </div>
          <div>
            <dt>{t("welle_k7.heimat.anteil")}</dt>
            <dd>{zahl(l.anteil, 1)} %</dd>
          </div>
          <div className="schlecht">
            <dt>{t("welle_k7.heimat.wachstum")}</dt>
            <dd>−{zahl(l.wachstum, 1)}</dd>
          </div>
        </dl>
      )}
      {kritik && <p className="km7-sperre">{t("welle_k7.heimat.kritik", { datum: addDays(world.date, k.kritikBis! - world.day) })}</p>}
    </section>
  );
}

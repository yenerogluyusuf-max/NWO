// Vermittlung zwischen Drittstaaten (AUS-4): Ankara als Ort und Vermittler — die Alleinstellung des Spiels.
// Konflikt-Auswahl, Reif-Kurve, ZOPA-Band mit Hebelpunkten, Handlungsleiste mit Preisen und der
// Garantie-Baukasten (Überwachung, Wirtschafts-Anker, militärische Garantie).

import { ersterSatz } from "./kurz";
import { useState } from "react";
import type { World } from "../../sim/types";
import { GARANTIEN, VORBEREITUNGEN, type GarantieArtId, type VorbereitungId } from "../../data/konflikte";
import { STATUS_NAME, beendeGarantie, bieteGarantie, konfliktSichten, vermittle, vorbereite, type KonfliktSicht } from "../../sim/vermittlung";
import { Rng } from "../../sim/rng";
import { Flagge } from "../art/Flaggen";
import { kannZahlen } from "../../sim/kapital";

import { t, zahl } from "../../i18n";
const zopaLabel = (stufe: "geschlossen" | "schmal" | "breit"): string => t(`tag_t8.verm.zopaStufe.${stufe}`);

function ParteiBlock({ seite, vertrauen, titel }: { seite: KonfliktSicht["def"]["a"]; vertrauen: number; titel: string }) {
  return (
    <div className="we-partei">
      <span className="we-partei-kopf">
        <b>{seite.name}</b>
        <span className="we-partei-vertrauen" title={t("ui.welt.Vermittlung.9b946fb")}>
          {t("ui2.ui.welt.Vermittlung.5278431", { p0: Math.round(vertrauen) })}
        </span>
      </span>
      {/* Forderungen und rote Linien in einer Liste, die roten Linien rot und benannt (Tag 6. November; vorher zwei Listen mit je eigener Überschrift) */}
      <i>{titel}</i>
      <ul>
        {seite.forderungen.map((f) => (
          <li key={f}>{f}</li>
        ))}
        {seite.roteLinien.map((r) => (
          <li key={r} className="we-partei-rot">
            <b>{t("ui2.ui.welt.Vermittlung.35de898")}:</b> {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Vermittlung({ world, refresh }: { world: World; refresh: () => void }) {
  const liste = konfliktSichten(world);
  const [gewaehltId, setGewaehltId] = useState(liste[0]?.def.id ?? "");
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const s = liste.find((x) => x.def.id === gewaehltId) ?? liste[0];
  if (!s) return null;
  const offeneGruende = s.garantien.filter((g) => !g.aktiv && !g.angeboten).map((g) => g.grund);
  const gleicherGrund = offeneGruende.length > 1 && offeneGruende.every((g) => g && g === offeneGruende[0]) ? offeneGruende[0] : undefined;
  const tue = (fn: () => { ok: boolean; text: string; why?: string }) => {
    setAntwort(fn());
    refresh();
  };
  return (
    <section className="we-vermittlung">
      <h3>{t("ui2.ui.welt.Vermittlung.2798547")}</h3>
      {/* kürzer (Tag 6. November); der Vergleich mit anderen Spielen gehört nicht in die Oberfläche */}
      {/* Welle B3: nur der erste Satz; was eine Einigung braucht, zeigen Reife, Zone und Aussicht darunter als Balken */}
      <p className="subtitle" title={ersterSatz(t("tag_t7.verm.satz")).rest || undefined}>
        {ersterSatz(t("tag_t7.verm.satz")).satz}
      </p>

      {/* Konflikt-Auswahl */}
      <div className="we-konflikte" role="tablist" aria-label={t("ui2.ui.welt.Vermittlung.e7fad87")}>
        {liste.map((k) => (
          <button
            key={k.def.id}
            type="button"
            role="tab"
            aria-selected={k.def.id === s.def.id}
            className={`we-konflikt${k.def.id === s.def.id ? " on" : ""}`}
            onClick={() => {
              setGewaehltId(k.def.id);
              setAntwort(null);
            }}
          >
            <span className="we-konflikt-kopf">
              {k.def.a.land && <Flagge id={k.def.a.land} breite={26} titel={k.def.a.name} />}
              <span aria-hidden>⇄</span>
              {k.def.b.land && <Flagge id={k.def.b.land} breite={26} titel={k.def.b.name} />}
              {/* Der Spielraum steht in der Zone möglicher Einigung des gewählten Konflikts */}
              <span className="we-konflikt-zahlen" title={t("ui2.ui.welt.Vermittlung.63606da", { p0: Math.round(k.z.reif), p1: Math.round(k.z.konfliktIndex), p2: zopaLabel(k.zopa.stufe) })}>
                {t("tag_t7.verm.zahlen", { reife: Math.round(k.z.reif), konflikt: Math.round(k.z.konfliktIndex) })}
              </span>
            </span>
            <b>
              {k.def.titel} <span className={`we-status st-${k.status}`}>{STATUS_NAME[k.status]}</span>
            </b>
          </button>
        ))}
      </div>

      <article className="we-vermittlung-karte">
        {/* Flaggen und Titel stehen in der gewählten Kachel darüber; hier nur noch für Bildschirmleser (Tag 6. November) */}
        <header className="we-vermittlung-kopf we-unsichtbar">
          <strong>{s.def.titel}</strong>
        </header>
        <p className="we-verm-text">{s.def.text}</p>

        {/* Tag 6. November: links die Lage und was sie reifen lässt (Parteien, Zone möglicher Einigung, Vorbereitung), rechts der Versuch
            selbst (Reife, Aussicht, Vermitteln) und die Garantien. Vorher stand alles untereinander, 2,5 Bildschirme */}
        <div className="we-verm-raster">
        <div className="we-verm-lage">
        <div className="we-parteien">
          <ParteiBlock seite={s.def.a} vertrauen={s.vertrauenA} titel={t("ui2.ui.welt.Vermittlung.727eda0")} />
          <ParteiBlock seite={s.def.b} vertrauen={s.vertrauenB} titel={t("ui2.ui.welt.Vermittlung.727eda0")} />
        </div>

        {/* ZOPA-Band */}
        <div className={`we-zopa zopa-${s.zopa.stufe}`}>
          <div className="we-zopa-kopf">
            <span>{t("ui.welt.Vermittlung.50a2ead")}</span>
            <b>{zopaLabel(s.zopa.stufe)}</b>
          </div>
          <div className="we-zopa-band" aria-label={t("ui2.ui.welt.Vermittlung.d44ed47", { p0: s.zopa.breite })}>
            <i style={{ width: `${s.zopa.breite}%` }} />
          </div>
          {s.zopa.gruende.map((g) => (
            <p key={g} className="we-zopa-grund">
              {g}
            </p>
          ))}
          <ul className="we-hebel">
            {s.def.hebel.map((h) => (
              <li key={h.id}>
                <b>{h.label}</b> — {h.text}
                <em> {h.richtung}</em>
              </li>
            ))}
          </ul>
        </div>

        {/* Handlungsleiste: Vorbereitung */}
        {s.z.einigung === undefined && (
          <div className="we-handlungen">
            <b title={t("ui2.ui.welt.Vermittlung.6821fd1")}>{t("ui2.ui.welt.Vermittlung.7be846f")}</b>
            <div className="we-handlungen-leiste">
              {s.vorbereitungen.map((v) => (
                <button
                  key={v.def.id}
                  type="button"
                  className="aktion-knopf klein"
                  disabled={!v.moeglich}
                  title={`${v.def.hinweis}${v.grund ? ` — ${v.grund}` : ""}`}
                  onClick={() => tue(() => vorbereite(world, s.def.id, v.def.id as VorbereitungId))}
                >
                  {v.def.label} <b>{v.def.pk}</b>
                </button>
              ))}
            </div>
            {/* Die allgemeine Erklärung steht als Tooltip an der Überschrift; sichtbar bleibt nur ein Grund, warum etwas gesperrt ist */}
            {s.vorbereitungen.some((v) => v.grund) && <p className="we-hinweis">{s.vorbereitungen.find((v) => v.grund)!.grund}</p>}
          </div>
        )}

        </div>
        <div className="we-verm-handeln">
        {/* Reif-Kurve */}
        <div className="we-reif" aria-label={t("ui2.ui.welt.Vermittlung.4ccf31c", { p0: Math.round(s.z.reif) })}>
          <div className="we-aussicht">
            <span>{t("ui2.ui.welt.Vermittlung.8b40871")}</span>
            <span className="we-balken">
              <i style={{ width: `${s.z.reif}%` }} />
            </span>
            <b>{Math.round(s.z.reif)}</b>
          </div>
          {s.z.reifVerlauf.length > 1 && (
            <div className="we-reif-kurve" title={t("ui.welt.Vermittlung.d0f5707")}>
              {s.z.reifVerlauf.map((p) => (
                <i key={p.monat} style={{ height: `${Math.max(6, p.wert)}%` }} title={`${p.monat}: ${p.wert}`} />
              ))}
            </div>
          )}
        </div>

        {/* Vermittlungsversuch */}
        <div className="we-aussicht" aria-label={t("ui2.ui.welt.Vermittlung.3d6600b", { p0: s.aussicht })}>
          <span>{t("ui2.ui.welt.Vermittlung.dbf3ace")}{s.z.garantieAngebot ? t("ui2.ui.welt.Vermittlung.40284ec", { p0: GARANTIEN[s.z.garantieAngebot].label }) : ""}</span>
          <span className="we-balken">
            <i style={{ width: `${s.aussicht}%` }} />
          </span>
          <b>{s.aussicht} %</b>
        </div>
        <div className="we-vermittlung-fuss">
          <button
            type="button"
            className="aktion-knopf"
            disabled={!s.moeglich || !world.spiel || !kannZahlen(world.spiel.kapital, s.def.pk)}
            title={s.grund}
            onClick={() => tue(() => vermittle(world, s.def.id, new Rng(world.day * 7919 + s.def.id.length * 104729)))}
          >
            {t("ui2.ui.welt.Vermittlung.ec20cb6")} <b>{s.def.pk}</b>
          </button>
          {s.grund && <span className="we-grund">{s.grund}</span>}
        </div>
        <ul className="we-paket">
          {s.def.paket.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>

        {/* Garantie-Baukasten */}
        <div className="we-garantien">
          <b>{t("ui2.ui.welt.Vermittlung.c51aac3")}</b>
          {/* Gilt derselbe Grund für alle Garantien (etwa „erst ab Reife 50“), steht er einmal hier statt in jeder Karte */}
          {gleicherGrund && <span className="we-grund">{gleicherGrund}</span>}
          <div className="we-garantien-leiste">
            {s.garantien.map((g) => (
              <div key={g.def.id} className={`we-garantie${g.aktiv ? " aktiv" : ""}${g.angeboten ? " angeboten" : ""}`}>
                {/* Kopf mit Knopf, darunter Preis und Risiko; was die Garantie umfasst, klappt auf (Tag 6. November) */}
                <div className="we-garantie-kopf">
                <b>{g.def.label}</b>
                {g.aktiv ? (
                  <button type="button" className="aktion-knopf klein" title={s.z.konfliktIndex <= 25 ? t("ui2.ui.welt.Vermittlung.e6e4576") : t("ui2.ui.welt.Vermittlung.63b85c5")} onClick={() => tue(() => beendeGarantie(world, s.def.id))}>
                    {t("ui2.ui.welt.Vermittlung.53a5aae")}
                  </button>
                ) : g.angeboten ? (
                  <span className="we-angeboten">{t("ui.welt.Vermittlung.a044cfb")}</span>
                ) : (
                  <button
                    type="button"
                    className="aktion-knopf klein"
                    disabled={!g.moeglich}
                    title={g.grund}
                    onClick={() => tue(() => bieteGarantie(world, s.def.id, g.def.id as GarantieArtId))}
                  >
                    {t("ui2.ui.welt.Vermittlung.c89b35b")} <b>{g.def.pk}</b>
                  </button>
                )}
                </div>
                {/* Das Kapital des Angebots steht schon auf dem Knopf; Aufbau, laufende Kosten und Wirkung als Plaketten (Welle B3) */}
                <ul className="rr-kosten we-garantie-preis" aria-label={t("tag_t7.verm.preis", { bip: zahl(g.def.bip), monat: zahl(g.def.monatPk), aussicht: g.def.aussicht })}>
                  <li>{t("welle_b3.verm.aufbau")} <b>{zahl(g.def.bip)} % {t("welle_b3.verm.bip")}</b></li>
                  <li><b>{zahl(g.def.monatPk)}</b> {t("welle_b3.verm.jeMonat")}</li>
                  <li>{t("welle_b3.verm.aussicht")} <b>+{g.def.aussicht}</b></li>
                </ul>
                <details className="we-garantie-mehr">
                  <summary>{t("tag_t7.verm.umfang")}</summary>
                  <p>{g.def.text}</p>
                  <p className="we-garantie-risiko">{g.def.risiko}</p>
                </details>
                {g.grund && !g.aktiv && !g.angeboten && !gleicherGrund && <span className="we-grund">{g.grund}</span>}
              </div>
            ))}
          </div>
        </div>

        </div>
        </div>

        {antwort && (
          <p className={`we-rueck ${antwort.ok ? "ok" : "nein"}`} role="status">
            {antwort.text}
            {antwort.why && <em> {antwort.why}</em>}
          </p>
        )}
      </article>
    </section>
  );
}

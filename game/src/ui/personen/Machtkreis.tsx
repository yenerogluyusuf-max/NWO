// Der Machtkreis als Ansicht: oben ein Lagesatz und vier Werte (Stil, Angst, Nachfolge, Disziplin), in der Mitte das Beziehungsnetz
// mit Gesichtern (Präsident in der Mitte, Linien für Rivalen, Verbündete, Familie und Geschäfte), rechts die gewählte Person mit ihren
// Hebeln und deren Preis, darüber die letzte Szene als Höhepunkt. Alles passt ohne Scrollen auf eine Bildschirmseite. Die Regeln stehen in sim/machtkreis.ts; hier nur die Ansicht.

import { useState } from "react";
import type { World } from "../../sim/types";
import {
  beziehungenVon,
  disziplinStimmen,
  geheimnisVon,
  hebelFuer,
  lageSatz,
  machtkreis,
  personen,
  regimeGrad,
  regimeStil,
  rolleText,
  verborgeneBeziehungen,
  zieheHebel,
  type Person,
} from "../../sim/machtkreis";
import { addDays, formatDateDe } from "../../sim/dates";
import { rendere, t } from "../../i18n";
import { Balken, Gesicht, LAGER_FARBE, tonVon } from "./bausteine";
import "./machtkreis.css";

/** Kleidung des Porträts für Nebenfiguren (das Porträtsystem kennt die Ämter des Spiels als Rollen). */
const KLEIDUNG: Record<string, string> = { kronprinz: "partner", fraktionschef: "partner", journalist: "opposition", richter: "justiz" };

const REIHENFOLGE = ["stab", "finanzen", "wirtschaft", "aussen", "inneres", "justiz", "generalstab", "zentralbank", "partner", "kronprinz", "fraktionschef", "richter", "journalist", "opposition"];

function lagePositionen(ps: Person[]): Map<string, { x: number; y: number }> {
  const sortiert = [...ps].sort((a, b) => REIHENFOLGE.indexOf(a.rolle) - REIHENFOLGE.indexOf(b.rolle));
  const m = new Map<string, { x: number; y: number }>();
  sortiert.forEach((p, i) => {
    const winkel = -Math.PI / 2 + (i / sortiert.length) * Math.PI * 2;
    m.set(p.schluessel, { x: 50 + 41 * Math.cos(winkel), y: 50 + 39 * Math.sin(winkel) });
  });
  return m;
}

const LINIE: Record<string, { farbe: string; strich?: string }> = {
  rivalen: { farbe: "#9b3b2f", strich: "5 4" },
  verbuendet: { farbe: "#3f6b3a" },
  familie: { farbe: "#a87a2a", strich: "1.5 3.5" },
  geschaeft: { farbe: "#7c5823", strich: "1.5 3.5" },
};

export function Machtkreis({ world, refresh }: { world: World; refresh?: () => void }) {
  const sp = world.spiel;
  const [wahl, setWahl] = useState<string | null>(null);
  const [rueck, setRueck] = useState<{ ok: boolean; text: string } | null>(null);
  if (!sp) return null;
  const mk = machtkreis(world);
  const ps = personen(world);
  const pos = lagePositionen(ps);
  const grad = regimeGrad(world);
  const stil = regimeStil(grad);
  const disziplin = disziplinStimmen(world);
  const gewaehlt = ps.find((p) => p.schluessel === wahl) ?? ps.find((p) => p.rolle === "kronprinz") ?? ps[0];
  const linien = mk.beziehungen.filter((b) => b.bekannt && pos.has(b.a) && pos.has(b.b));
  const verborgen = verborgeneBeziehungen(world);
  const datum = (tag: number) => formatDateDe(addDays(sp.start.datum, tag));
  const letzte = mk.szenen[mk.szenen.length - 1];
  const letztePerson = letzte ? ps.find((x) => x.schluessel === letzte.personen[0]) : undefined;

  return (
    <section className="paper mk">
      <div className="mk-kopf">
        <h3>{t("mk.ui.titel")}</h3>
        <p className="mk-lage">{lageSatz(world)}</p>
      </div>
      {letzte && (
        <div className="mk-szene neu" role="status">
          {letztePerson ? <Gesicht name={letztePerson.name} weiblich={letztePerson.weiblich} lager={letztePerson.lager} size={40} rolle={KLEIDUNG[letztePerson.rolle] ?? letztePerson.rolle} /> : <span className="mk-leer" />}
          <p>
            <small>{datum(letzte.tag)}</small> {rendere(letzte.msg)}
          </p>
          <span className="mk-stempel">{letzte.stempel}</span>
        </div>
      )}
      <div className="mk-werte">
        <div className="mk-wert">
          <Balken label={t("mk.ui.stil")} wert={grad} wort={t(`mk.stil.${stil}`)} ton={tonVon(grad, true)} klein hinweis={t(`mk.stil.${stil}.zeile`)} />
        </div>
        <div className="mk-wert">
          <Balken label={t("mk.ui.angst")} wert={mk.angst} wort={String(Math.round(mk.angst))} ton={tonVon(mk.angst, true)} klein hinweis={t(mk.angst > 40 ? "mk.ui.angst.hoch" : "mk.ui.angst.niedrig")} />
        </div>
        <div className="mk-wert">
          <Balken label={t("mk.ui.nachfolge")} wert={mk.nachfolge} wort={String(Math.round(mk.nachfolge))} ton={tonVon(mk.nachfolge, true)} klein hinweis={t(mk.nachfolge >= 60 ? "mk.ui.nachfolge.hoch" : "mk.ui.nachfolge.niedrig")} />
        </div>
        <div className="mk-wert mk-disziplin" title={t("mk.ui.disziplin.zeile")}>
          <b>{t("mk.ui.disziplin")}</b>
          <span className={disziplin >= 0 ? "gut" : "schlecht"}>{t("mk.ui.stimmen", { n: disziplin })}</span>
        </div>
      </div>

      <div className="mk-grid">
        <div className="mk-netz" role="group" aria-label={t("mk.ui.netz")}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {linien.map((b) => {
              const a = pos.get(b.a)!;
              const c = pos.get(b.b)!;
              const l = LINIE[b.art]!;
              const an = gewaehlt && (b.a === gewaehlt.schluessel || b.b === gewaehlt.schluessel);
              return (
                <line
                  key={`${b.a}-${b.b}`}
                  x1={a.x}
                  y1={a.y}
                  x2={c.x}
                  y2={c.y}
                  stroke={l.farbe}
                  strokeWidth={0.8 + (b.staerke / 100) * 2.6}
                  strokeDasharray={l.strich}
                  opacity={an ? 0.95 : 0.4}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
          <div className="mk-mitte">
            <Gesicht name={world.player?.name ?? "P"} lager="praesident" size={64} rolle="stab" />
            <span>{t("mk.ui.sie")}</span>
          </div>
          {ps.map((p) => {
            const q = pos.get(p.schluessel)!;
            const g = geheimnisVon(world, p.schluessel);
            const status = p.neben?.status ?? ((mk.kalt[p.schluessel] ?? -1) > world.day ? "kaltgestellt" : "aktiv");
            return (
              <button
                key={p.schluessel}
                className={`mk-person ${tonVon(p.loyalitaet)}${p.schluessel === gewaehlt?.schluessel ? " on" : ""}${status !== "aktiv" ? " " + status : ""}`}
                style={{ left: `${q.x}%`, top: `${q.y}%`, borderColor: LAGER_FARBE[p.lager] }}
                onClick={() => {
                  setWahl(p.schluessel);
                  setRueck(null);
                }}
                aria-pressed={p.schluessel === gewaehlt?.schluessel}
                title={`${p.name}, ${rolleText(p)}`}
              >
                <Gesicht name={p.name} weiblich={p.weiblich} lager={p.lager} size={46} rolle={KLEIDUNG[p.rolle] ?? p.rolle} {...(p.neben ? { alter: p.neben.alter } : {})} />
                <strong>{p.name.split(" ").slice(-1)[0]}</strong>
                <small>{rolleText(p)}</small>
                {g?.aufgedeckt && <i className="mk-geheim" title={t(`mk.geheimnis.${g.art}`)} />}
              </button>
            );
          })}
        </div>

        {gewaehlt && <Detail world={world} p={gewaehlt} rueck={rueck} onHebel={(h) => {
          const r = zieheHebel(world, gewaehlt.schluessel, h);
          setRueck(r);
          refresh?.();
        }} />}
      </div>

      <div className="mk-legende">
        <span><i className="rivalen" />{t("mk.bez.rivalen")}</span>
        <span><i className="verbuendet" />{t("mk.bez.verbuendet")}</span>
        <span><i className="familie" />{t("mk.bez.familie")} / {t("mk.bez.geschaeft")}</span>
        <span><i className="ring" />{t("mk.ui.ring")}</span>
        {verborgen > 0 && <span className="mk-verborgen">{t("mk.ui.verborgen", { n: verborgen })}</span>}
      </div>

    </section>
  );
}

function Detail({ world, p, rueck, onHebel }: { world: World; p: Person; rueck: { ok: boolean; text: string } | null; onHebel: (h: Parameters<typeof zieheHebel>[2]) => void }) {
  const mk = machtkreis(world);
  const g = geheimnisVon(world, p.schluessel);
  const bez = beziehungenVon(world, p.schluessel);
  const alle = personen(world);
  const hebel = hebelFuer(world, p.schluessel);
  const marken: string[] = [];
  if (p.neben?.status === "kaltgestellt" || (mk.kalt[p.schluessel] ?? -1) > world.day) marken.push(t("mk.status.kaltgestellt"));
  if (p.neben?.status === "haft") marken.push(t("mk.status.haft"));
  if ((mk.deals[p.schluessel] ?? -1) > world.day) marken.push(t("mk.status.deal"));
  if (mk.untersuchungen.some((u) => u.person === p.schluessel)) marken.push(t("mk.status.untersuchung"));
  return (
    <aside className="mk-detail">
      <div className="mk-detail-kopf">
        <Gesicht name={p.name} weiblich={p.weiblich} lager={p.lager} size={72} rolle={KLEIDUNG[p.rolle] ?? p.rolle} {...(p.neben ? { alter: p.neben.alter } : {})} />
        <div>
          <strong>{p.name}</strong>
          <span>{rolleText(p)}</span>
          <em>{t(`mk.lager.${p.lager}`)}</em>
          {marken.length > 0 && <div className="pe-marken">{marken.map((m) => <span key={m} className="pe-marke rot">{m}</span>)}</div>}
        </div>
      </div>
      <p className="mk-satz">{t(`mk.satz.${p.rolle}`)}</p>
      <div className="mk-balken">
        <Balken label={t("mk.ui.loyalitaet")} wert={p.loyalitaet} klein />
        <Balken label={t("mk.ui.ehrgeiz")} wert={p.ehrgeiz} ton={tonVon(p.ehrgeiz, true)} klein />
        <Balken label={t("mk.ui.kompetenz")} wert={p.kompetenz} klein />
        {p.neben && <Balken label={t("mk.ui.einfluss")} wert={p.neben.einfluss} ton="mittel" klein />}
      </div>
      <div className="mk-block">
        <b>{t("mk.ui.beziehungen")}</b>
        {bez.length === 0 ? (
          <p className="mk-leise">{t("mk.ui.keineBeziehungen")}</p>
        ) : (
          <ul>
            {bez.map((b) => {
              const o = alle.find((x) => x.schluessel === b.andere);
              return (
                <li key={b.andere + b.art} className={b.art}>
                  {t(`mk.bez.${b.art}.mit`, { name: o?.name ?? "?", rolle: o ? rolleText(o) : "" })} <small>{t(b.staerke >= 65 ? "mk.ui.stark" : b.staerke >= 40 ? "mk.ui.mittel" : "mk.ui.schwach")}</small>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="mk-block">
        <b>{t("mk.ui.geheimnis")}</b>
        <p className={g?.aufgedeckt ? "mk-rot" : "mk-leise"}>
          {g?.aufgedeckt ? t(g.oeffentlich ? "mk.ui.geheimnis.oeffentlich" : "mk.ui.geheimnis.bekannt", { art: t(`mk.geheimnis.${g.art}`), schwere: t(`mk.schwere.${g.schwere}`) }) : t("mk.ui.geheimnis.nichts")}
        </p>
      </div>
      <div className="mk-hebel">
        {hebel.map((h) => (
          <button key={h.hebel} disabled={!h.moeglich} onClick={() => onHebel(h.hebel)} title={h.grund ?? h.folge}>
            <span className="mk-hebel-kopf">
              <strong>{t(`mk.hebel.${h.hebel}`)}</strong>
              <em>{t("mk.ui.pk", { pk: h.pk })}</em>
            </span>
            <small>{h.moeglich ? h.folge : h.grund}</small>
          </button>
        ))}
      </div>
      {rueck && (
        <p className={`pe-rueck ${rueck.ok ? "ja" : "nein"}`} role="status">
          {rueck.text}
        </p>
      )}
    </aside>
  );
}

// Der Machtkreis als Karten (Welle M1, 8. November 2026; ENTSCHEIDUNGEN Z, Vorbild: Kopf von Wirtschaft › Haushalt).
//
// Die Frage: „Wer kann mir die Macht nehmen, und was zahle ich, damit es nicht geschieht?“ Oben drei große Kennzahlen (Nachfolgedruck mit
// Parteitag, Fraktionsdisziplin in Stimmen, Gefahren), darunter 3 bis 5 Personenkarten mit 2 bis 3 Handlungen, jede mit Preis und Wirkung
// in Zahlen (sim/machtkreis-sicht.ts). Befördern, Absprache und Bauernopfer für Minister fallen weg: Die Karte führt zu Gespräch und
// Entlassung im Kabinett. Das Beziehungsnetz mit allen 14 Personen steht hinter dem Aufklapper „Beziehungen“; dort bleiben die übrigen Hebel
// (Presse, Verfassungsgericht, Zentralbank, Opposition) erreichbar. Die Regeln stehen in sim/machtkreis.ts; hier nur die Ansicht.

import { useState } from "react";
import type { World } from "../../sim/types";
import {
  NACHFOLGE_STUFEN,
  beziehungenVon,
  disziplinStimmen,
  geheimnisVon,
  hebelFuer,
  machtkreis,
  nebenVon,
  parteitagTermin,
  personen,
  regimeGrad,
  regimeStil,
  rolleText,
  verborgeneBeziehungen,
  zieheHebel,
  type Hebel,
  type Person,
} from "../../sim/machtkreis";
import { kreisGefahren, kreisKarten, type KreisHandlung, type KreisKarte } from "../../sim/machtkreis-sicht";
import { drohendeAbspaltung, gegruendeteAbspaltung, gruendungsDatum } from "../../sim/abspaltung";
import { addDays, formatDateDe } from "../../sim/dates";
import { rendere, t } from "../../i18n";
import { Balken, Gesicht, LAGER_FARBE, tonVon } from "./bausteine";
import "./machtkreis.css";

/** Kleidung des Porträts für Nebenfiguren (das Porträtsystem kennt die Ämter des Spiels als Rollen). */
const KLEIDUNG: Record<string, string> = { kronprinz: "partner", fraktionschef: "partner", journalist: "opposition", richter: "richter" };

const REIHENFOLGE = ["stab", "finanzen", "wirtschaft", "aussen", "inneres", "justiz", "generalstab", "zentralbank", "partner", "kronprinz", "fraktionschef", "richter", "journalist", "opposition"];

function lagePositionen(ps: Person[]): Map<string, { x: number; y: number }> {
  const sortiert = [...ps].sort((a, b) => REIHENFOLGE.indexOf(a.rolle) - REIHENFOLGE.indexOf(b.rolle));
  const m = new Map<string, { x: number; y: number }>();
  sortiert.forEach((p, i) => {
    const winkel = -Math.PI / 2 + (i / sortiert.length) * Math.PI * 2;
    // Welle M1: etwas weiter außen und als Ellipse, damit sich die Gesichter nicht überdecken (vorher Çiftçi über Çetin)
    m.set(p.schluessel, { x: 50 + 43 * Math.cos(winkel), y: 50 + 41 * Math.sin(winkel) });
  });
  return m;
}

const LINIE: Record<string, { farbe: string; strich?: string }> = {
  rivalen: { farbe: "#9b3b2f", strich: "5 4" },
  verbuendet: { farbe: "#3f6b3a" },
  familie: { farbe: "#a87a2a", strich: "1.5 3.5" },
  geschaeft: { farbe: "#7c5823", strich: "1.5 3.5" },
};

type Rueck = { ok: boolean; text: string } | null;

export function Machtkreis({ world, refresh, startPerson, onPerson }: { world: World; refresh?: () => void; startPerson?: string; onPerson?: (figurId: string, modus: "gespraech" | "entlassen") => void }) {
  const sp = world.spiel;
  // Welle E3: Ein Sprung aus einem Vorgang wählt die betroffene Person vor (Welle M1: steht sie nicht auf einer Karte, öffnet das Netz)
  const [wahl, setWahl] = useState<string | null>(startPerson ?? null);
  const [rueck, setRueck] = useState<{ person: string; r: Rueck } | null>(null);
  if (!sp) return null;
  const mk = machtkreis(world);
  const karten = kreisKarten(world);
  const gefahren = kreisGefahren(world);
  const grad = regimeGrad(world);
  const stil = regimeStil(grad);
  const disziplin = disziplinStimmen(world);
  const termin = parteitagTermin(world);
  const kp = nebenVon(world, "kronprinz");
  const fc = nebenVon(world, "fraktionschef");
  const letzte = mk.szenen[mk.szenen.length - 1];
  const letztePerson = letzte ? personen(world).find((x) => x.schluessel === letzte.personen[0]) : undefined;
  const datum = (tag: number) => formatDateDe(addDays(sp.start.datum, tag));
  const aufKarte = !startPerson || karten.some((k) => k.person.schluessel === startPerson);
  const droht = drohendeAbspaltung(world);
  const partei = gegruendeteAbspaltung(world);

  const tue = (p: Person, h: KreisHandlung) => {
    if (h.sprung) {
      if (p.figur) onPerson?.(p.figur.id, h.sprung);
      return;
    }
    if (!h.hebel) return;
    setRueck({ person: p.schluessel, r: zieheHebel(world, p.schluessel, h.hebel) });
    refresh?.();
  };

  return (
    <section className="paper mk mk2">
      <header className="mk2-kopf">
        <div className="mk2-frage">
          <small>{t("welle_m1.kreis.kicker")}</small>
          <h3>{t("welle_m1.kreis.frage")}</h3>
          <p>
            {t("welle_m1.kreis.stil", { stil: t(`mk.stil.${stil}`), grad, angst: Math.round(mk.angst) })}
          </p>
        </div>
        <dl className="mk2-zahlen">
          <div className={`mk2-zahl ${tonVon(mk.nachfolge, true)}`}>
            <dt>{t("mk.ui.nachfolge")}</dt>
            <dd>
              {Math.round(mk.nachfolge)}
              <span>/100</span>
            </dd>
            <Stufen druck={mk.nachfolge} />
            <em>{kp?.status === "aktiv" ? t(termin.ausserordentlich ? "welle_m1.kreis.parteitag.ausser" : "welle_m1.kreis.parteitag", { tage: Math.max(0, termin.tag - world.day), kampf: NACHFOLGE_STUFEN.kampfAb }) : t("welle_m1.kreis.parteitag.ohne")}</em>
          </div>
          <div className={`mk2-zahl ${disziplin > 0 ? "gut" : disziplin < 0 ? "schlecht" : "mittel"}`}>
            <dt>{t("mk.ui.disziplin")}</dt>
            <dd>
              {disziplin > 0 ? "+" : disziplin < 0 ? "−" : "±"}
              {Math.abs(disziplin)}
              <span>{t("welle_m1.kreis.stimmen_einheit", { n: Math.abs(disziplin) })}</span>
            </dd>
            <em>{fc ? t("welle_m1.kreis.disziplin", { name: fc.name }) : t("welle_m1.kreis.disziplin_ohne")}</em>
          </div>
          <div className={`mk2-zahl ${gefahren.some((g) => g.ton === "schlecht") ? "schlecht" : gefahren.length ? "mittel" : "gut"}`}>
            <dt>{t("welle_m1.kreis.gefahr")}</dt>
            <dd>{gefahren.length}</dd>
            {gefahren.length === 0 ? (
              <em>{t("welle_m1.kreis.gefahr_keine")}</em>
            ) : (
              <ul className="mk2-gefahren">
                {gefahren.slice(0, 3).map((g) => (
                  <li key={g.art} className={g.ton}>
                    {g.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </dl>
      </header>

      {letzte && (
        <div className="mk-szene neu" role="status">
          {letztePerson ? <Gesicht name={letztePerson.name} weiblich={letztePerson.weiblich} lager={letztePerson.lager} size={40} rolle={KLEIDUNG[letztePerson.rolle] ?? letztePerson.rolle} /> : <span className="mk-leer" />}
          <p>
            <small>{datum(letzte.tag)}</small> {rendere(letzte.msg)}
          </p>
          <span className="mk-stempel">{letzte.stempel}</span>
        </div>
      )}

      {(droht || partei) && (
        <div className={`mk2-abspaltung${droht ? " droht" : ""}`}>
          <div>
            <small>{t(droht ? "welle_m1.kreis.abspaltung.droht" : "welle_m1.kreis.abspaltung.partei")}</small>
            <strong>{droht ? t("welle_m1.kreis.abspaltung.droht_titel", { name: droht.gruender, datum: gruendungsDatum(world, droht) }) : t("welle_m1.abspaltung.partei")}</strong>
          </div>
          {partei && (
            <dl>
              <div>
                <dt>{t("welle_m1.kreis.abspaltung.anteil")}</dt>
                <dd>{t("welle_m1.kreis.prozent", { p: partei.anteil ?? 0 })}</dd>
              </div>
              <div>
                <dt>{t("welle_m1.kreis.abspaltung.sitze")}</dt>
                <dd>{world.parliament?.seats[partei.partei] ?? 0}</dd>
              </div>
              <div>
                <dt>{t("welle_m1.kreis.abspaltung.gruender")}</dt>
                <dd className="name">{partei.gruender}</dd>
              </div>
            </dl>
          )}
          {droht && <p>{t("welle_m1.kreis.abspaltung.droht_text", { tage: Math.max(0, droht.gruendung - world.day) })}</p>}
        </div>
      )}

      <div className={`mk2-karten n${karten.length}`}>
        {karten.map((k) => (
          <PersonKarte key={k.person.schluessel} w={world} k={k} gewaehlt={k.person.schluessel === wahl} rueck={rueck?.person === k.person.schluessel ? rueck.r : null} onTue={(h) => tue(k.person, h)} />
        ))}
      </div>

      <details className="mk2-netz" open={!aufKarte || undefined}>
        <summary>
          {t("welle_m1.kreis.netz", { n: personen(world).length })}
          <span>{t("welle_m1.kreis.netz_zeile")}</span>
        </summary>
        <Netz world={world} wahl={wahl} setWahl={(s) => { setWahl(s); setRueck(null); }} rueck={rueck} setRueck={setRueck} refresh={refresh} />
      </details>
    </section>
  );
}

/** Der Nachfolgedruck als Leiste mit den drei Stufen (60, 80, 95). */
function Stufen({ druck }: { druck: number }) {
  return (
    <span className="mk2-stufen" role="img" aria-label={t("welle_m1.kreis.stufen_aria", { druck: Math.round(druck) })}>
      <i style={{ width: `${Math.max(0, Math.min(100, druck))}%` }} />
      {NACHFOLGE_STUFEN.stufen.map((s) => (
        <b key={s} style={{ left: `${s}%` }} className={druck >= s ? "an" : ""} />
      ))}
    </span>
  );
}

function marken(w: World, p: Person): { text: string; ton: "rot" | "gold" }[] {
  const mk = machtkreis(w);
  const out: { text: string; ton: "rot" | "gold" }[] = [];
  const kalt = p.neben?.status === "kaltgestellt" ? p.neben.bis : (mk.kalt[p.schluessel] ?? -1) > w.day ? mk.kalt[p.schluessel] : undefined;
  if (kalt !== undefined) out.push({ text: t("welle_m1.kreis.marke.kalt", { datum: addDays(w.date, Math.max(0, kalt - w.day)) }), ton: "rot" });
  const deal = mk.deals[p.schluessel];
  if (deal !== undefined && deal > w.day) out.push({ text: t("welle_m1.kreis.marke.deal", { datum: addDays(w.date, deal - w.day) }), ton: "gold" });
  const u = mk.untersuchungen.find((x) => x.person === p.schluessel);
  if (u) out.push({ text: t("welle_m1.kreis.marke.untersuchung", { datum: addDays(w.date, Math.max(0, u.ende - w.day)) }), ton: "gold" });
  const g = geheimnisVon(w, p.schluessel);
  if (g?.aufgedeckt) out.push({ text: t(g.oeffentlich ? "welle_m1.kreis.marke.skandal" : "welle_m1.kreis.marke.geheimnis", { art: t(`mk.geheimnis.${g.art}`), schwere: t(`mk.schwere.${g.schwere}`) }), ton: "rot" });
  return out;
}

function PersonKarte({ w, k, gewaehlt, rueck, onTue }: { w: World; k: KreisKarte; gewaehlt: boolean; rueck: Rueck; onTue: (h: KreisHandlung) => void }) {
  const p = k.person;
  const m = marken(w, p);
  const einfluss = p.neben?.einfluss;
  return (
    <article className={`mk2-karte grund-${k.grund}${gewaehlt ? " on" : ""}`} style={{ ["--lager" as string]: LAGER_FARBE[p.lager] }}>
      <div className="mk2-karte-kopf">
        <Gesicht name={p.name} weiblich={p.weiblich} lager={p.lager} size={56} rolle={KLEIDUNG[p.rolle] ?? p.rolle} {...(p.neben ? { alter: p.neben.alter } : {})} />
        <div>
          <small>{t(`welle_m1.kreis.grund.${k.grund}`)}</small>
          <strong>{p.name}</strong>
          <span>{rolleText(p)}</span>
        </div>
      </div>
      <dl className="mk2-werte">
        <div className={tonVon(p.loyalitaet)}>
          <dt>{t("mk.ui.loyalitaet")}</dt>
          <dd>{Math.round(p.loyalitaet)}</dd>
        </div>
        <div className={tonVon(p.ehrgeiz, true)}>
          <dt>{t("mk.ui.ehrgeiz")}</dt>
          <dd>{Math.round(p.ehrgeiz)}</dd>
        </div>
        {einfluss !== undefined ? (
          <div>
            <dt>{t("mk.ui.einfluss")}</dt>
            <dd>{Math.round(einfluss)}</dd>
          </div>
        ) : (
          <div className={tonVon(p.kompetenz)}>
            <dt>{t("mk.ui.kompetenz")}</dt>
            <dd>{Math.round(p.kompetenz)}</dd>
          </div>
        )}
      </dl>
      {m.length > 0 && (
        <div className="mk2-marken">
          {m.map((x) => (
            <span key={x.text} className={`mk2-marke ${x.ton}`}>
              {x.text}
            </span>
          ))}
        </div>
      )}
      <div className="mk2-handlungen">
        {k.handlungen.map((h) => (
          <button key={h.id} type="button" className={`mk2-handlung${h.sprung ? " sprung" : ""}`} disabled={!h.moeglich} onClick={() => onTue(h)} title={h.grund ?? h.zahlen}>
            <span className="mk2-handlung-kopf">
              <strong>{h.hebel ? t(`welle_m1.kreis.hebel.${p.rolle === "kronprinz" && h.hebel === "befoerdern" ? "aufbauen" : h.hebel}`) : t(`welle_m1.kreis.sprung.${h.sprung}`)}</strong>
              {h.pk !== undefined && <em>{t("mk.ui.pk", { pk: h.pk })}</em>}
              {h.sprung && <em className="pfeil">→</em>}
            </span>
            <small>{h.moeglich ? h.zahlen : h.grund}</small>
          </button>
        ))}
      </div>
      {rueck && (
        <p className={`pe-rueck ${rueck.ok ? "ja" : "nein"}`} role="status">
          {rueck.text}
        </p>
      )}
    </article>
  );
}

/** Das Beziehungsnetz mit allen Personen und dem Blatt der gewählten Person (vorher die Hauptansicht, jetzt hinter dem Aufklapper). */
function Netz({ world, wahl, setWahl, rueck, setRueck, refresh }: { world: World; wahl: string | null; setWahl: (s: string) => void; rueck: { person: string; r: Rueck } | null; setRueck: (r: { person: string; r: Rueck }) => void; refresh?: (() => void) | undefined }) {
  const mk = machtkreis(world);
  const ps = personen(world);
  const pos = lagePositionen(ps);
  const gewaehlt = ps.find((p) => p.schluessel === wahl) ?? ps.find((p) => p.rolle === "kronprinz") ?? ps[0];
  const linien = mk.beziehungen.filter((b) => b.bekannt && pos.has(b.a) && pos.has(b.b));
  const verborgen = verborgeneBeziehungen(world);
  return (
    <>
      <div className="mk-grid">
        <div className="mk-netz" role="group" aria-label={t("mk.ui.netz")}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {linien.map((b) => {
              const a = pos.get(b.a)!;
              const c = pos.get(b.b)!;
              const l = LINIE[b.art]!;
              const an = gewaehlt && (b.a === gewaehlt.schluessel || b.b === gewaehlt.schluessel);
              return <line key={`${b.a}-${b.b}`} x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke={l.farbe} strokeWidth={0.8 + (b.staerke / 100) * 2.6} strokeDasharray={l.strich} opacity={an ? 0.95 : 0.4} vectorEffect="non-scaling-stroke" />;
            })}
          </svg>
          <div className="mk-mitte">
            <Gesicht name={world.player?.name ?? "P"} lager="praesident" size={56} rolle="stab" />
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
                onClick={() => setWahl(p.schluessel)}
                aria-pressed={p.schluessel === gewaehlt?.schluessel}
                title={`${p.name}, ${rolleText(p)}`}
              >
                <Gesicht name={p.name} weiblich={p.weiblich} lager={p.lager} size={40} rolle={KLEIDUNG[p.rolle] ?? p.rolle} {...(p.neben ? { alter: p.neben.alter } : {})} />
                <strong>{p.name.split(" ").slice(-1)[0]}</strong>
                <small>{rolleText(p)}</small>
                {g?.aufgedeckt && <i className="mk-geheim" title={t(`mk.geheimnis.${g.art}`)} />}
              </button>
            );
          })}
        </div>
        {gewaehlt && (
          <Detail
            world={world}
            p={gewaehlt}
            rueck={rueck?.person === gewaehlt.schluessel ? rueck.r : null}
            onHebel={(h) => {
              setRueck({ person: gewaehlt.schluessel, r: zieheHebel(world, gewaehlt.schluessel, h) });
              refresh?.();
            }}
          />
        )}
      </div>
      <div className="mk-legende">
        <span><i className="rivalen" />{t("mk.bez.rivalen")}</span>
        <span><i className="verbuendet" />{t("mk.bez.verbuendet")}</span>
        <span><i className="familie" />{t("mk.bez.familie")} / {t("mk.bez.geschaeft")}</span>
        <span><i className="ring" />{t("mk.ui.ring")}</span>
        {verborgen > 0 && <span className="mk-verborgen">{t("mk.ui.verborgen", { n: verborgen })}</span>}
      </div>
    </>
  );
}

function Detail({ world, p, rueck, onHebel }: { world: World; p: Person; rueck: Rueck; onHebel: (h: Hebel) => void }) {
  const g = geheimnisVon(world, p.schluessel);
  const bez = beziehungenVon(world, p.schluessel);
  const alle = personen(world);
  const hebel = hebelFuer(world, p.schluessel);
  const m = marken(world, p);
  return (
    <aside className="mk-detail">
      <div className="mk-detail-kopf">
        <Gesicht name={p.name} weiblich={p.weiblich} lager={p.lager} size={64} rolle={KLEIDUNG[p.rolle] ?? p.rolle} {...(p.neben ? { alter: p.neben.alter } : {})} />
        <div>
          <strong>{p.name}</strong>
          <span>{rolleText(p)}</span>
          <em>{t(`mk.lager.${p.lager}`)}</em>
          {m.length > 0 && <div className="pe-marken">{m.map((x) => <span key={x.text} className="pe-marke rot">{x.text}</span>)}</div>}
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
      {hebel.length > 0 ? (
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
      ) : null}
      {p.figur && p.rolle !== "opposition" && p.rolle !== "partner" && p.rolle !== "zentralbank" && <p className="mk-leise">{t("welle_m1.kreis.minister_hinweis")}</p>}
      {rueck && (
        <p className={`pe-rueck ${rueck.ok ? "ja" : "nein"}`} role="status">
          {rueck.text}
        </p>
      )}
    </aside>
  );
}

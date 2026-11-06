// Die Lage der Justiz (Tagarbeit T6, 06.11.2026): vorher 2,1 Bildschirme Aktenlesen (zehn Balken, Sitze, vier Einrichtungskarten, die
// dieselben Zahlen noch einmal nannten, zwei Vorteilskarten). Jetzt steht oben die eine Frage der Akte, Rechtsstaat oder Durchgriff,
// mit den beiden Dauervorteilen als Ziele und dem Weg zu den Reformen; darunter die Größen und die Einrichtungen als Kacheln.
// Erklärung, Schwellen, prägende Einrichtungen und die Reformen, die eine Größe bewegen, öffnen sich per Klick.

import { useState, type ReactNode } from "react";
import type { World } from "../../sim/types";
import { NET } from "../../sim/modell";
import { nationalAverage } from "../../sim/netz";
import { vorMonaten } from "../../sim/waehler";
import { aktiveVorteile, effektZeile, pruefeVoraus, reichZustand, vorhabenDef, vorhabenListe, wirkungsVorschau, type VorhabenSicht } from "../../sim/reich";
import type { Voraussetzung } from "../../sim/reich-typen";
import { VORTEILE } from "../../data/reich";
import { ohneBeleg } from "../../i18n/ohne-beleg";
import { t, zahl } from "../../i18n";
import { Knopf } from "../bausteine/Knopf";
import { Verlauf } from "./Verlauf";
import type { GroesseDef } from "./Groessen";
import "./recht-lage.css";

const knoten = (id: string) => NET.nodes[NET.index.get(id) ?? -1];
const wert = (w: World, id: string) => nationalAverage(NET, w.net, id);

/** Sitzgruppe je Einrichtung (sim/reich.ts: z.sitze) */
const SITZE_VON: Record<string, string> = { recht_aym: "aym", recht_hsk: "hsk" };
const SITZ_ARTEN = ["loyal", "reform", "unabhaengig"] as const;

type Auswahl = { art: "groesse" | "einrichtung"; id: string } | null;

/** Schwelle eines Vorteils an einer Größe: „mindestens 52“ oder „höchstens 30“. */
function grenzeText(v: Voraussetzung): string {
  if (v.art !== "knoten") return "";
  return v.min !== undefined ? t("tag_t6.recht.ab", { n: v.min }) : t("tag_t6.recht.bis", { n: v.max! });
}

/** Ein Ziel der Leitfrage: Bedingungen mit Abstand, Dauerwirkung als Abzeichen, Herleitung aufklappbar. */
function Weg({ world, id, seite }: { world: World; id: string; seite: "a" | "b" }) {
  const def = VORTEILE.find((v) => v.id === id);
  if (!def) return null;
  const an = aktiveVorteile(world).includes(id);
  const zeilen = def.dauer.map((e) => effektZeile(e, "dauer")).filter((z): z is NonNullable<typeof z> => !!z);
  return (
    <article className={`rl-weg rl-weg-${seite}${an ? " an" : ""}`}>
      <header>
        <h4>{def.name}</h4>
        <span className={`rl-stand${an ? " an" : ""}`}>{an ? t("ui2.ui.Reich.16a766c") : t("ui2.ui.Reich.82a62ea")}</span>
      </header>
      <ul className="rl-bedingungen">
        {def.voraus.map((v, i) => {
          const s = pruefeVoraus(world, v);
          if (v.art !== "knoten") return <li key={i} className={s.erfuellt ? "ok" : ""}><span>{s.text}</span></li>;
          const jetzt = wert(world, v.id);
          const ziel = v.min ?? v.max!;
          const fehlt = Math.max(0, v.min !== undefined ? Math.ceil(ziel - jetzt) : Math.ceil(jetzt - ziel));
          return (
            <li key={i} className={s.erfuellt ? "ok" : ""}>
              <span className="rl-bed-name">{knoten(v.id)?.name ?? v.id} <em>{grenzeText(v)}</em></span>
              <span className="rr-balken" aria-hidden><i style={{ width: `${Math.round(s.fortschritt * 100)}%` }} /></span>
              <b>{s.erfuellt ? t("tag_t6.recht.erfuellt") : t("tag_t6.recht.fehlen", { n: fehlt })}</b>
            </li>
          );
        })}
      </ul>
      <ul className="rl-wirkung" aria-label={t("tag_t6.recht.wirkung")}>
        {zeilen.map((z) => (
          <li key={z.text} className={z.gut ? "gut" : "schlecht"}><span aria-hidden>{z.richtung > 0 ? "▲" : "▼"}</span> {z.text}</li>
        ))}
      </ul>
      <details className="rl-mehr">
        <summary>{t("tag_t6.recht.worum")}</summary>
        <p>{ohneBeleg(def.text)}</p>
        <p><b>{t("ui2.ui.Reich.0289c3f")}</b> {def.kehrseite}</p>
      </details>
    </article>
  );
}

/** Reformen und Vorhaben des Rechts, die eine Größe bewegen (aus denselben Effekten, die der Abschluss bucht). */
function hebelFuer(liste: VorhabenSicht[], id: string): { s: VorhabenSicht; text: string; gut: boolean }[] {
  const out: { s: VorhabenSicht; text: string; gut: boolean }[] = [];
  for (const s of liste) {
    if (s.v.klasse === "institution") continue;
    const e = [...s.v.abschluss, ...(s.v.dauer ?? [])].find((x) => x.t === "knoten" && x.id === id);
    if (!e) continue;
    const z = effektZeile(e, s.v.abschluss.includes(e) ? "sofort" : "dauer");
    if (z) out.push({ s, text: z.text, gut: z.gut });
  }
  return out.sort((a, b) => Number(b.s.bereit && b.s.status === "verfuegbar") - Number(a.s.bereit && a.s.status === "verfuegbar")).slice(0, 4);
}

function statusWort(s: VorhabenSicht): string {
  if (s.status === "verfuegbar") return s.bereit ? t("tag_t6.recht.bereit") : t("tag_t6.recht.vorausFehlt");
  return t(`n6.vk.status.${s.status}`);
}

export function RechtLage({ world, liste, bereit, zuReformen, children }: { world: World; liste: GroesseDef[]; bereit: number; zuReformen: (id?: string) => void; children?: ReactNode }) {
  const [auswahl, setAuswahl] = useState<Auswahl>(null);
  const z = reichZustand(world);
  const vorhaben = vorhabenListe(world, "recht");
  const einrichtungen = Object.keys(z.bestand)
    .map((id) => vorhabenDef(id))
    .filter((v): v is NonNullable<typeof v> => !!v && v.bereich === "recht" && v.klasse === "institution");
  const wege = VORTEILE.filter((v) => v.bereich === "recht");
  const waehle = (art: "groesse" | "einrichtung", id: string) => setAuswahl((a) => (a?.art === art && a.id === id ? null : { art, id }));
  const verlaufDa = (z.verlauf ?? []).some((e) => vorhabenDef(e.id)?.bereich === "recht");

  // Detail einer Größe: Erklärung, Schwellen der Vorteile, prägende Einrichtungen und die Hebel
  const groesseDetail = (g: GroesseDef) => {
    const node = knoten(g.id);
    if (!node) return null;
    const schwellen = wege.flatMap((d) => d.voraus.filter((v) => v.art === "knoten" && v.id === g.id).map((v) => ({ name: d.name, grenze: grenzeText(v) })));
    const praegen = einrichtungen.filter((v) => v.zeigt?.includes(g.id)).map((v) => v.name);
    const hebel = hebelFuer(vorhaben, g.id);
    return (
      <div className="rl-detail" role="region" aria-label={node.name}>
        <div className="rl-detail-text">
          <h5>{node.name}</h5>
          <p>{node.text}</p>
          {/* Der Zusatz aus der Recherche (GROESSEN.recht) steht wörtlich schon in der Erklärung der Größe und erscheint darum nicht ein zweites Mal */}
          {(schwellen.length > 0 || praegen.length > 0) && (
            <dl className="rl-fakten">
              {schwellen.length > 0 && <div><dt>{t("tag_t6.recht.schwelle")}</dt><dd>{schwellen.map((s) => `${s.name}: ${s.grenze}`).join(" · ")}</dd></div>}
              {praegen.length > 0 && <div><dt>{t("tag_t6.recht.gepraegt")}</dt><dd>{t("tag_t6.recht.liste", { l: praegen })}</dd></div>}
            </dl>
          )}
        </div>
        <div className="rl-hebel rl-detail-seite">
          <h6>{t("tag_t6.recht.hebel")}</h6>
          {hebel.length ? (
            <ul>
              {hebel.map(({ s, text, gut }) => (
                <li key={s.v.id}>
                  <span className="rl-hebel-name"><b>{s.v.name}</b><small>{statusWort(s)}</small></span>
                  <span className={`rl-chip ${gut ? "gut" : "schlecht"}`}>{text}</span>
                  <Knopf stufe="leise" onClick={() => zuReformen(s.v.id)}>{t("tag_t6.recht.ansehen")}</Knopf>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t("tag_t6.recht.keinHebel")}</p>
          )}
        </div>
        <Knopf stufe="leise" className="rl-zu" aria-label={t("tag_t6.recht.schliessen")} onClick={() => setAuswahl(null)}>×</Knopf>
      </div>
    );
  };

  const einrichtungDetail = (id: string) => {
    const v = vorhabenDef(id);
    if (!v) return null;
    const sitz = SITZE_VON[id] ? z.sitze[SITZE_VON[id]!] : undefined;
    return (
      <div className="rl-detail" role="region" aria-label={v.name}>
        <div className="rl-detail-text">
          <h5>{v.name}</h5>
          <p>{ohneBeleg(v.text)}</p>
        </div>
        <div className="rl-detail-seite">
          {sitz && <p>{t("ui2.ui.Reich.eeb0a0b", { p0: sitz.loyal + sitz.reform + sitz.unabhaengig, p1: sitz.loyal, p2: sitz.reform, p3: sitz.unabhaengig })}</p>}
          <p><b>{t("ui2.ui.Reich.0289c3f")}</b> {v.kehrseite}</p>
          {v.unterhalt ? <p className="rl-zusatz">{t("ui2.ui.Reich.cf4af98", { p0: zahl(v.unterhalt, 1) })}</p> : null}
        </div>
        <Knopf stufe="leise" className="rl-zu" aria-label={t("tag_t6.recht.schliessen")} onClick={() => setAuswahl(null)}>×</Knopf>
      </div>
    );
  };

  return (
    <div className="rl">
      {/* Die eine Frage der Akte: zwei Ziele mit Dauerwirkung, dazwischen „oder“, rechts der Weg zur Entscheidung */}
      <section className="rl-frage" aria-labelledby="rl-frage-titel">
        <header className="rl-frage-kopf">
          <h3 id="rl-frage-titel">{t("tag_t6.recht.frage")}</h3>
          <p>{t("tag_t6.recht.lead")}</p>
        </header>
        <div className="rl-wege">
          {wege[0] && <Weg world={world} id={wege[0].id} seite="a" />}
          {wege.length > 1 && <span className="rl-oder" aria-hidden>{t("tag_t6.recht.oder")}</span>}
          {wege[1] && <Weg world={world} id={wege[1].id} seite="b" />}
          <aside className="rl-zug">
            <b className="rl-zug-zahl">{zahl(bereit)}</b>
            <span>{t("tag_t6.recht.bereitN", { n: bereit })}</span>
            <Knopf stufe={bereit > 0 ? "haupt" : "normal"} onClick={() => zuReformen()}>{t("tag_t6.recht.zuReformen")}</Knopf>
          </aside>
        </div>
      </section>

      {children}

      <section className="rl-abschnitt">
        <h4>{t("tag_t6.recht.kennzahlen")} <em>{t("tag_t6.recht.kennzahlenUnter")}</em></h4>
        <ul className="rl-kacheln">
          {liste.map((g) => {
            const node = knoten(g.id);
            if (!node) return null;
            const jetzt = wert(world, g.id);
            const frueher = vorMonaten(world, g.id, 3);
            const trend = frueher === null ? 0 : jetzt - frueher;
            const gut = g.invers ? jetzt < 50 : jetzt >= 50;
            const trendGut = g.invers ? trend < 0 : trend > 0;
            const marken = wege.flatMap((d) => d.voraus.filter((v) => v.art === "knoten" && v.id === g.id).map((v) => ({ d, n: v.art === "knoten" ? (v.min ?? v.max ?? 0) : 0 })));
            const offen = auswahl?.art === "groesse" && auswahl.id === g.id;
            return (
              <li key={g.id}>
                <button type="button" className={`rl-kachel ${gut ? "rr-ok" : "rr-mies"}${offen ? " offen" : ""}`} aria-expanded={offen} onClick={() => waehle("groesse", g.id)}>
                  <span className="rl-kachel-name">{node.name}</span>
                  <span className="rl-kachel-wert">
                    {Math.round(jetzt)}
                    {Math.abs(trend) >= 0.5 && <em className={trendGut ? "hoch" : "runter"} title={t("ui.reich.Groessen.e2a1f3b")}>{trend > 0 ? "▲" : "▼"}</em>}
                  </span>
                  <span className="rr-balken" aria-hidden>
                    <i style={{ width: `${Math.max(2, Math.min(100, jetzt))}%` }} />
                    <b style={{ left: "50%" }} />
                    {marken.map((m) => <b key={m.d.id} className="rl-marke" style={{ left: `${m.n}%` }} />)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {auswahl?.art === "groesse" && (() => { const g = liste.find((x) => x.id === auswahl.id); return g ? groesseDetail(g) : null; })()}
      </section>

      {einrichtungen.length > 0 && (
        <section className="rl-abschnitt">
          <h4>
            {t("tag_t6.recht.einrichtungen")} <em>{t("ui.Reich.9e48137")}</em>
            <span className="rl-legende" aria-hidden>
              <i className="loyal" /> {t("tag_t6.recht.loyal")} <i className="reform" /> {t("tag_t6.recht.reform")} <i className="unabhaengig" /> {t("tag_t6.recht.unabhaengig")}
            </span>
          </h4>
          <ul className="rl-einrichtungen">
            {einrichtungen.map((v) => {
              const sitz = SITZE_VON[v.id] ? z.sitze[SITZE_VON[v.id]!] : undefined;
              const zeigt = wirkungsVorschau(world, v.id)?.zeigt ?? [];
              const offen = auswahl?.art === "einrichtung" && auswahl.id === v.id;
              return (
                <li key={v.id} className={sitz ? "mit-sitzen" : ""}>
                  <button type="button" className={`rl-einrichtung${offen ? " offen" : ""}`} aria-expanded={offen} onClick={() => waehle("einrichtung", v.id)}>
                    <span className="rl-einrichtung-name">{v.name}</span>
                    {sitz && (
                      <span className="rl-sitze" role="img" aria-label={t("ui2.ui.Reich.eeb0a0b", { p0: sitz.loyal + sitz.reform + sitz.unabhaengig, p1: sitz.loyal, p2: sitz.reform, p3: sitz.unabhaengig })}>
                        {SITZ_ARTEN.flatMap((a) => Array.from({ length: sitz[a] }, (_, i) => <i key={`${a}${i}`} className={a} />))}
                        <small>{SITZ_ARTEN.map((a) => sitz[a]).join(" · ")}</small>
                      </span>
                    )}
                    <span className="rl-praegt">{t("tag_t6.recht.praegt", { l: zeigt.map((g) => g.name) })}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {auswahl?.art === "einrichtung" && einrichtungDetail(auswahl.id)}
        </section>
      )}

      {(verlaufDa || z.meldungen.length > 0) && (
        <details className="rl-mehr rl-verlauf">
          <summary>{t("tag_t6.recht.verlauf")}</summary>
          <Verlauf world={world} bereich="recht" />
          {z.meldungen.length > 0 && (
            <ul className="rr-meldungen">
              {[...z.meldungen].reverse().slice(0, 5).map((m, i) => <li key={`${m.tag}-${i}`} className={m.art}>{m.text}</li>)}
            </ul>
          )}
        </details>
      )}
    </div>
  );
}

// Parteikonfigurator im Prolog: eine Voreinstellung vom linken bis zum rechten Rand wählen oder die fünf Achsen frei einstellen.
// Die Regler zeigen Wortmarken statt Zahlen, das Wappen der Partei entsteht live (Farbe, Kürzel, die Linie als Fünfeck),
// die Vorschau zeigt, wen die Linie trägt, wer Partner oder Gegner wird und welche Maßnahmen billig oder teuer werden.
// Keine Linie wird gewertet: Jede hat Preis und Folgen (sim/linie.ts).

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ACHSEN_IDS, PARTEI_ACHSEN, VOREINSTELLUNGEN, type Achsen, type AchseId } from "../../data/linien";
import { vorschau, type ParteiAngabe } from "../../sim/linie";
import { NET } from "../../sim/modell";
import { t } from "../../i18n";
import { bewegungReduziert } from "../anim/effekte";
import { Chips, type Chip } from "./Chips";
import { Parteiwappen } from "./Wappen";
import "./buch.css";

const PARTEI_NAME: Record<string, string> = { AKP: "AKP", "YENİ": "YENİ Parti", CHP: "CHP", MHP: "MHP", "İYİ": "İYİ Parti", DEM: "DEM Parti", Zafer: "Zafer Partisi", YRP: "Yeniden Refah" };

const massnahmeName = (id: string): string => NET.nodes[NET.index.get(id) ?? -1]?.name ?? id;

const kurzAus = (name: string): string => {
  const w = name
    .split(/\s+/)
    .filter((x) => x.length > 2)
    .map((x) => x[0]!.toLocaleUpperCase("tr"))
    .join("");
  return (w || name.slice(0, 3).toLocaleUpperCase("tr")).slice(0, 4);
};

/** Wortmarke einer Achsenstellung: sieben Stufen von Rand zu Rand (Schwellen sind Spielparameter) */
const SCHWELLEN = [-70, -35, -12, 12, 35, 70];
export const wortStufe = (wert: number): number => SCHWELLEN.filter((s) => wert >= s).length;
export const achsenWort = (achse: AchseId, wert: number): string => t(`linie.wort.${achse}.${wortStufe(wert)}`);

/** Voreinstellungen von Rand zu Rand: nach dem Mittel der vier Achsen, auf denen rechts „mehr Markt, Ordnung, Nation, Glaube“ heißt */
const REIHE = [...VOREINSTELLUNGEN].sort((a, b) => mittel(a.achsen) - mittel(b.achsen));
function mittel(a: Achsen): number {
  return (a.wirtschaft + a.gesellschaft + a.national + a.religion) / 4;
}

export interface ParteikonfiguratorProps {
  /** Wird mit der gewählten Partei aufgerufen (Name, Kürzel, Farbe, Achsen) */
  onFertig: (p: ParteiAngabe) => void;
  /** Voreinstellung am Anfang (Kennung aus data/linien.ts); sonst „Mitte“ */
  anfang?: string;
}

export function Parteikonfigurator({ onFertig, anfang = "mitte" }: ParteikonfiguratorProps) {
  const start = VOREINSTELLUNGEN.find((v) => v.id === anfang) ?? VOREINSTELLUNGEN[0]!;
  const [vorId, setVorId] = useState<string>(start.id);
  const [achsen, setAchsen] = useState<Achsen>({ ...start.achsen });
  const [name, setName] = useState<string>(t(`linie.preset.${start.id}.name`));
  const [kurz, setKurz] = useState<string>(start.kurz);
  const [farbe, setFarbe] = useState<string>(start.farbe);
  const [frei, setFrei] = useState(false);
  const reihe = useRef<HTMLDivElement>(null);

  const waehle = (id: string) => {
    const v = VOREINSTELLUNGEN.find((x) => x.id === id)!;
    setVorId(id);
    setAchsen({ ...v.achsen });
    setName(t(`linie.preset.${id}.name`));
    setKurz(v.kurz);
    setFarbe(v.farbe);
    setFrei(false);
  };

  const stelle = (k: AchseId, wert: number) => {
    // Wer an einer Voreinstellung dreht, hat eine eigene Linie: Das Kürzel darf dann nicht mehr das einer Voreinstellung sein
    if (!frei) {
      setFrei(true);
      setVorId("frei");
      if (VOREINSTELLUNGEN.some((v) => v.kurz === kurz)) setKurz(kurzAus(name) === kurz ? `${kurz}+` : kurzAus(name));
    }
    setAchsen((a) => ({ ...a, [k]: wert }));
  };

  // Die gewählte Karte rückt in die Mitte der Reihe (nur die Reihe scrollt, nie die Seite)
  useEffect(() => {
    const el = reihe.current;
    const karte = el?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!el || !karte) return;
    try {
      el.scrollTo({ left: karte.offsetLeft - (el.clientWidth - karte.offsetWidth) / 2, behavior: bewegungReduziert() ? "auto" : "smooth" });
    } catch {
      /* ohne Bildlauf (Test) */
    }
  }, [vorId]);

  const blaettere = (richtung: 1 | -1) => reihe.current?.scrollBy?.({ left: richtung * Math.max(240, (reihe.current?.clientWidth ?? 600) * 0.7), behavior: bewegungReduziert() ? "auto" : "smooth" });

  /** Pfeiltasten wählen die Nachbarkarte (Radiogruppe) */
  const taste = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = REIHE.findIndex((v) => v.id === vorId);
    const n = REIHE[(Math.max(0, i) + (e.key === "ArrowRight" ? 1 : REIHE.length - 1)) % REIHE.length]!;
    e.preventDefault();
    waehle(n.id);
    queueMicrotask(() => reihe.current?.querySelector<HTMLElement>(`[data-vor="${n.id}"]`)?.focus());
  };

  // Die Kürzel der vier klassischen Muster tragen von Hand gesetzte Tabellen: Eine frei gestellte Linie darf sie nicht übernehmen
  const klassischeKurz = VOREINSTELLUNGEN.filter((v) => v.klassisch).map((v) => v.kurz);
  const kurzOk = kurz.trim().length >= 2 && kurz.trim().length <= 5 && !(kurz.trim() in PARTEI_ACHSEN) && kurz.trim() !== "Andere" && !(frei && klassischeKurz.includes(kurz.trim()));
  const nameOk = name.trim().length >= 3;
  const v = useMemo(() => vorschau(achsen, frei ? "" : kurz), [achsen, frei, kurz]);
  const gruppe = (id: string): string => t(`prolog.gruppe.${id}`);
  const traegt: Chip[] = v.gruppen.filter((g) => g.naehe > 0).slice(0, 3).map((g) => ({ text: gruppe(g.id), staerke: Math.min(1, g.naehe / 4) }));
  const fern: Chip[] = v.gruppen.filter((g) => g.naehe < 0).slice(-3).reverse().map((g) => ({ text: gruppe(g.id), staerke: Math.min(1, -g.naehe / 4) }));
  const partner: Chip[] = v.parteien.filter((p) => p.naehe > 0).slice(0, 3).map((p) => ({ text: PARTEI_NAME[p.kurz] ?? p.kurz, staerke: Math.min(1, p.naehe / 2) }));
  const gegner: Chip[] = v.parteien.filter((p) => p.naehe < 0).slice(-3).reverse().map((p) => ({ text: PARTEI_NAME[p.kurz] ?? p.kurz, staerke: Math.min(1, -p.naehe / 2) }));
  const massnahme = (m: { id: string; richtung: 1 | -1 }): Chip => ({ text: `${massnahmeName(m.id)} ${m.richtung > 0 ? "↑" : "↓"}`, staerke: 0 });
  const gewaehlt = VOREINSTELLUNGEN.find((x) => x.id === vorId);

  return (
    <div className="pk" data-frei={frei ? "ja" : "nein"}>
      <section className="pk-reihe" aria-label={t("konfigurator.voreinstellungen")}>
        <div className="pk-reihe-kopf">
          <h3>{t("konfigurator.voreinstellungen")}</h3>
          <div className="pk-pfeile">
            <button type="button" onClick={() => blaettere(-1)} aria-label={t("konfigurator.reihe_zurueck")}>
              <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden>
                <path d="M8 1L3 6l5 5" />
              </svg>
            </button>
            <button type="button" onClick={() => blaettere(1)} aria-label={t("konfigurator.reihe_vor")}>
              <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden>
                <path d="M4 1l5 5-5 5" />
              </svg>
            </button>
          </div>
        </div>
        <div className="pk-skala" aria-hidden>
          <span>{t("konfigurator.rand_links")}</span>
          <i />
          <span>{t("konfigurator.rand_rechts")}</span>
        </div>
        <div ref={reihe} className="pk-presets" role="radiogroup" aria-label={t("konfigurator.voreinstellungen")} onKeyDown={taste}>
          {REIHE.map((p) => (
            <button key={p.id} data-vor={p.id} type="button" role="radio" aria-checked={vorId === p.id} tabIndex={vorId === p.id || (vorId === "frei" && p.id === REIHE[0]!.id) ? 0 : -1} className={vorId === p.id ? "on" : ""} onClick={() => waehle(p.id)} style={{ ["--pf" as string]: p.farbe }}>
              <Parteiwappen kurz={p.kurz} farbe={p.farbe} achsen={p.achsen} size={44} className="pk-mini" />
              <strong>{t(`linie.preset.${p.id}.name`)}</strong>
            </button>
          ))}
        </div>
        <p className="pk-beschreibung" aria-live="polite">
          {gewaehlt ? t(`linie.preset.${gewaehlt.id}.text`) : t("konfigurator.eigene_hinweis")}
        </p>
      </section>

      <section className="pk-achsen" aria-label={t("konfigurator.achsen")}>
        <h3>{t("konfigurator.achsen")}</h3>
        {ACHSEN_IDS.map((k) => {
          const pct = (achsen[k] + 100) / 2;
          const a = Math.min(50, pct);
          const b = Math.max(50, pct);
          return (
            <div key={k} className="pk-achse">
              <div className="pk-achse-kopf">
                <label htmlFor={`pk-${k}`} className="pk-achse-name">
                  {t(`linie.achse.${k}.name`)}
                </label>
                <span className="pk-wort">{achsenWort(k, achsen[k])}</span>
              </div>
              <input id={`pk-${k}`} className="pk-regler" type="range" min={-100} max={100} step={5} value={achsen[k]} onChange={(e) => stelle(k, Number(e.target.value))} aria-valuetext={achsenWort(k, achsen[k])} style={{ ["--a" as string]: `${a}%`, ["--b" as string]: `${b}%` }} />
              <div className="pk-pole" aria-hidden>
                <span>{t(`linie.achse.${k}.links`)}</span>
                <span>{t(`linie.achse.${k}.rechts`)}</span>
              </div>
            </div>
          );
        })}
      </section>

      <aside className="pk-vorschau" aria-label={t("konfigurator.vorschau")}>
        <div className="pk-wappen">
          <Parteiwappen kurz={kurz.trim() || "?"} farbe={farbe} achsen={achsen} size={132} />
          <div className="pk-wappen-name">{name.trim() || t("konfigurator.name_schild")}</div>
        </div>
        <div className="pk-felder">
          <label className="pk-feld-name">
            {t("konfigurator.name")}
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
          </label>
          <label className="pk-feld-kurz">
            {t("konfigurator.kurz")}
            <input value={kurz} onChange={(e) => setKurz(e.target.value)} maxLength={5} aria-invalid={!kurzOk} />
          </label>
          <label className="pk-feld-farbe">
            {t("konfigurator.farbe")}
            <input type="color" value={farbe} onChange={(e) => setFarbe(e.target.value)} />
          </label>
        </div>
        {!kurzOk && <p className="pk-hinweis">{t("konfigurator.kurz_hinweis")}</p>}
        <h3>{t("konfigurator.vorschau")}</h3>
        <dl>
          <dt>{t("konfigurator.traegt")}</dt>
          <dd>{traegt.length ? <Chips chips={traegt} art="gruppe" /> : t("konfigurator.keine")}</dd>
          <dt>{t("konfigurator.fern")}</dt>
          <dd>{fern.length ? <Chips chips={fern} art="fern" /> : t("konfigurator.keine")}</dd>
          <dt>{t("konfigurator.partner")}</dt>
          <dd>{partner.length ? <Chips chips={partner} art="partner" /> : t("konfigurator.keine")}</dd>
          <dt>{t("konfigurator.gegner")}</dt>
          <dd>{gegner.length ? <Chips chips={gegner} art="fern" /> : t("konfigurator.keine")}</dd>
          <dt>{t("konfigurator.billig")}</dt>
          <dd>
            <span className="pk-massnahmen billig">{v.billig.map((m) => massnahme(m).text).join(", ")}</span>
          </dd>
          <dt>{t("konfigurator.teuer")}</dt>
          <dd>
            <span className="pk-massnahmen teuer">{v.teuer.map((m) => massnahme(m).text).join(", ")}</span>
          </dd>
        </dl>
        <p className="pk-fussnote">{t("konfigurator.fussnote")}</p>
        <button type="button" className="primary" disabled={!kurzOk || !nameOk} onClick={() => onFertig({ name: name.trim(), kurz: kurz.trim(), farbe, achsen })}>
          {t("konfigurator.gruenden")}
        </button>
      </aside>
    </div>
  );
}

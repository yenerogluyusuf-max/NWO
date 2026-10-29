// Der MİT: Ausbau wie jede Behörde, dazu das Besondere des Dienstes — Netzkarte (Länder nach Netzstärke), laufende Operationen,
// Qualität des Lagebilds, Inlandsoperationen und der Schutz des Präsidenten. Operationen gegen andere Staaten ordnet der Spieler in
// der Weltansicht an; hier stehen Lage und Inland. Alles Spielmechanik mit Kosten, Dauer und Folgen (sim/welt-dienst.ts, sim/behoerden.ts).

import { useState } from "react";
import type { World } from "../../sim/types";
import { dienstSicht, lagebildQualitaet, praesidentenSchutz, inlandOptionen, ordneInlandAn, dienst, type InlandArt } from "../../sim/welt-dienst";
import { akteurName } from "../../sim/welt-modell";
import { Flagge } from "../art/Flaggen";
import { formatDateDe } from "../../sim/dates";
import { t } from "../../i18n";

const AUSGANG: Record<string, string> = { erfolg: "✓", fehlschlag: "✗", aufgedeckt: "⚠", info: "·" };

/** Das Besondere des MİT in der Detailleiste: Lagebild, Netzkarte, Inland, laufende Operationen, Bericht (aufklappbar). */
export function MitZusatz({ w, refresh }: { w: World; refresh: () => void }) {
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const sicht = dienstSicht(w);
  const lage = lagebildQualitaet(w);
  const schutz = praesidentenSchutz(w);
  const inland = inlandOptionen(w);
  const inlandLage = dienst(w).inlandLage;
  const anordnen = (art: InlandArt) => {
    setAntwort(ordneInlandAn(w, art));
    refresh();
  };

  return (
    <div className="mit-ansicht">
      <div className="mit-lage-zeile">
        <div className="mit-lagebalken">
          <span>
            {t("behoerden.mit.ui.kapazitaet")}<em>{t("behoerden.mit.ui.von", { wert: Math.round(sicht.kapazitaet), max: sicht.kapazitaetMax })}</em>
          </span>
          <i style={{ ["--w" as string]: `${(sicht.kapazitaet / sicht.kapazitaetMax) * 100}%` }} aria-hidden />
        </div>
        <div className="mit-lagebalken">
          <span>
            {t("behoerden.mit.ui.lagebild")}<em>{t("behoerden.mit.ui.lagebild_text", { wort: lage.wort, wert: lage.wert })}</em>
          </span>
          <i style={{ ["--w" as string]: `${lage.wert}%` }} aria-hidden />
        </div>
        <div className="mit-lagebalken">
          <span>{t("behoerden.mit.ui.schutz", { p: schutz })}</span>
          <i style={{ ["--w" as string]: `${schutz * 100}%` }} aria-hidden />
        </div>
      </div>

      <details className="ub-mehr mit-netzkarte">
        <summary>{t("behoerden.mit.ui.netzkarte")}</summary>
        {sicht.netze.length === 0 ? (
          <p className="bh-hinweis">{t("behoerden.mit.ui.netze_leer")}</p>
        ) : (
          <ul className="mit-netze">
            {sicht.netze.map((n) => (
              <li key={n.id}>
                <Flagge id={n.id} breite={26} /> <strong>{akteurName(n.id)}</strong>
                <span className="mit-netz-balken" aria-hidden>
                  {Array.from({ length: n.max }, (_, i) => (
                    <i key={i} className={i < n.stufe ? "an" : ""} />
                  ))}
                </span>
                <em>{t("behoerden.mit.ui.netz_stufe", { stufe: n.stufe, max: n.max })}</em>
              </li>
            ))}
          </ul>
        )}
        <p className="bh-hinweis">{t("behoerden.mit.ui.ausland")}</p>
      </details>

      <details className="ub-mehr mit-inland" open>
        <summary>{t("behoerden.mit.ui.inland")}</summary>
        {inlandLage && (
          <p className="mit-inland-lage">
            {t("behoerden.mit.ui.inlandlage", { monate: Math.max(1, Math.round((w.day - inlandLage.tag) / 30)), putsch: inlandLage.putsch, terror: inlandLage.terror })}
          </p>
        )}
        {antwort && (
          <p className={`bh-rueck ${antwort.ok ? "ok" : "nein"}`} role="status">
            {antwort.text}
            {antwort.why && <em> {antwort.why}</em>}
          </p>
        )}
        <ul className="mit-inland-ops">
          {inland.map((o) => (
            <li key={o.def.art} className={o.moeglich ? "" : "gesperrt"}>
              <div className="mit-inland-kopf">
                <strong>{o.name}</strong>
                <span className="bh-preis">{t("behoerden.mit.ui.aussicht", { p: o.p })}</span>
                {o.pLeck > 0 && <span className="mit-leck">{t("behoerden.mit.ui.leck", { p: o.pLeck })}</span>}
              </div>
              <p>{o.text}</p>
              <div className="bh-achse-fuss">
                <button type="button" className="aktion-knopf klein" disabled={!o.moeglich} onClick={() => anordnen(o.def.art)}>
                  {t("behoerden.mit.ui.anordnen")}
                </button>
                {!o.moeglich && <span className="bh-hinweis">{o.grund}</span>}
              </div>
            </li>
          ))}
        </ul>
        {sicht.inland.length > 0 && (
          <ul className="mit-laufend">
            {sicht.inland.map((l) => (
              <li key={l.id}>{t("behoerden.mit.ui.inland_op", { name: l.name, monate: Math.max(1, Math.round(l.restTage / 30)) })}</li>
            ))}
          </ul>
        )}
      </details>

      {sicht.laufend.length > 0 && (
        <section className="mit-laufend-aussen">
          <h4>{t("behoerden.mit.ui.laufend")}</h4>
          <ul className="mit-laufend">
            {sicht.laufend.map((l) => (
              <li key={l.op.id}>
                <Flagge id={l.ziel} breite={22} /> {t("behoerden.mit.ui.gegen", { name: l.name, land: akteurName(l.ziel), monate: Math.max(1, Math.round(l.restTage / 30)) })}
              </li>
            ))}
          </ul>
        </section>
      )}

      <details className="ub-mehr mit-bericht">
        <summary>{t("behoerden.mit.ui.bericht")}</summary>
        <ul>
          {sicht.bericht.slice(0, 8).map((b, i) => (
            <li key={`${b.tag}-${i}`} className={`ausgang-${b.ausgang}`}>
              <span className="mit-datum">{formatDateDe(b.datum)}</span> <span aria-hidden>{AUSGANG[b.ausgang]}</span> <strong>{b.titel}</strong>
              <br />
              <span>{b.text}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

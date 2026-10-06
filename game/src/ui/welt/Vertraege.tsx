// Verträge mit einem Land: laufende mit Fortschritt, Pflichten und Prüfung, beendete mit dem Grund.

import { useState } from "react";
import type { World } from "../../sim/types";
import { land, weltZustand } from "../../sim/laender";
import { KLAUSEL_NACH_ID } from "../../data/abkommen";
import { fruehesterAusstieg, klauselSicht, kuendige, vertragsName, type Vertrag } from "../../sim/abkommen";
import { pruefeBedingung } from "../../sim/programme";
import { addDays, formatDateDe } from "../../sim/dates";

import { t } from "../../i18n";
const TAGE_JAHR = 360;
const datum = (w: World, tag: number) => formatDateDe(addDays(w.date, tag - w.day));

const STATUS: Record<Vertrag["status"], string> = { laeuft: "läuft", ausgelaufen: "ausgelaufen", gebrochen: "gebrochen", gekuendigt: "gekündigt" };

function VertragKarte({ world, v, refresh }: { world: World; v: Vertrag; refresh: () => void }) {
  const [frage, setFrage] = useState(false);
  const [antwort, setAntwort] = useState<string | null>(null);
  const laeuft = v.status === "laeuft";
  const fortschritt = Math.min(1, (world.day - v.seit) / Math.max(1, v.ablauf - v.seit));
  const frueh = world.day < fruehesterAusstieg(v);
  const pflichten = [...v.gibt, ...v.will]
    .map((id) => KLAUSEL_NACH_ID[id])
    .filter((d) => d?.pflicht)
    .map((d) => ({ d: d!, ok: pruefeBedingung(world, d!.pflicht!).erfuellt }));
  return (
    <li className={`we-vertrag st-${v.status}`}>
      <div className="we-vertrag-kopf">
        <strong>{vertragsName(world, v)}</strong>
        <span className={`we-status st-${v.status}`}>{STATUS[v.status]}</span>
      </div>
      <p className="we-vertrag-klauseln">
        {v.gibt.length > 0 && (
          <span>
            <em>{t("ui2.ui.welt.Vertraege.365a479")}</em> {v.gibt.map((id) => klauselSicht(world, v.land, id)?.label ?? id).join("; ")}.{" "}
          </span>
        )}
        {v.will.length > 0 && (
          <span>
            <em>{t("ui2.ui.welt.Vertraege.ba3ee69")}</em> {v.will.map((id) => klauselSicht(world, v.land, id)?.label ?? id).join("; ")}.
          </span>
        )}
      </p>
      <div className="we-fortschritt" aria-label={t("ui2.ui.welt.Vertraege.b2a85c3", { p0: Math.round(fortschritt * 100) })}>
        <i style={{ width: `${Math.round((laeuft ? fortschritt : v.status === "ausgelaufen" ? 1 : fortschritt) * 100)}%` }} />
      </div>
      <p className="we-vertrag-daten">
        {t("ui2.ui.welt.Vertraege.7273be5", { p0: datum(world, v.seit), p1: datum(world, v.ablauf), p2: v.jahre })}
        {laeuft && <> {t("ui2.ui.welt.Vertraege.6bcee2e", { p0: datum(world, v.letztePruefung + TAGE_JAHR) })}</>}
        {v.verstoesse > 0 && laeuft && <b className="we-schlecht"> {t("ui2.ui.welt.Vertraege.9d1b9b4", { p0: v.verstoesse })}</b>}
      </p>
      {laeuft && pflichten.length > 0 && (
        <ul className="we-pflichten" aria-label={t("ui.welt.Vertraege.a10a0ca")}>
          {pflichten.map(({ d, ok }) => (
            <li key={d.id} className={ok ? "we-gut" : "we-schlecht"}>
              <span aria-hidden>{ok ? "✓" : "✗"}</span> {d.pflichtText ?? d.label}
              {!ok && <em> {t("ui.welt.Vertraege.afbc01f")}</em>}
            </li>
          ))}
        </ul>
      )}
      {v.ende && !laeuft && <p className="we-vertrag-ende">{v.ende}</p>}
      {laeuft && !antwort && (
        <div className="we-vertrag-aktion">
          {!frage ? (
            <button type="button" className="link" onClick={() => setFrage(true)}>
              {t("ui.welt.Vertraege.f9b86fb")}
            </button>
          ) : (
            <>
              <span className={frueh ? "we-schlecht" : ""}>
                {frueh ? t("ui2.ui.welt.Vertraege.2845193", { p0: datum(world, fruehesterAusstieg(v)) }) : t("ui2.ui.welt.Vertraege.669a6fa")}
              </span>
              <button
                type="button"
                className="aktion-knopf"
                onClick={() => {
                  setAntwort(kuendige(world, v.land, v.id).text);
                  refresh();
                }}
              >
                {t("ui.welt.Vertraege.1aacd83")}
              </button>
              <button type="button" className="link" onClick={() => setFrage(false)}>
                {t("ui.welt.Vertraege.2ee8ff6")}
              </button>
            </>
          )}
        </div>
      )}
      {antwort && <p className="we-vertrag-ende">{antwort}</p>}
    </li>
  );
}

export function Vertraege({ world, landId, refresh }: { world: World; landId: string; refresh: () => void }) {
  const l = land(landId);
  const alle = [...(weltZustand(world)[landId]!.vertraege ?? [])].reverse();
  const laufende = alle.filter((v) => v.status === "laeuft");
  const beendet = alle.filter((v) => v.status !== "laeuft");
  if (alle.length === 0) {
    return <p className="we-leer">{t("ui2.ui.welt.Vertraege.89d47b9", { p0: l.dat })}</p>;
  }
  return (
    <div className="we-vertraege">
      {laufende.length > 0 && (
        <>
          <h4>{t("ui2.ui.welt.Vertraege.430694f")}</h4>
          <ul>
            {laufende.map((v) => (
              <VertragKarte key={v.id} world={world} v={v} refresh={refresh} />
            ))}
          </ul>
        </>
      )}
      {beendet.length > 0 && (
        <>
          <h4>{t("ui2.ui.welt.Vertraege.f7c8259")}</h4>
          <ul>
            {beendet.map((v) => (
              <VertragKarte key={v.id} world={world} v={v} refresh={refresh} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

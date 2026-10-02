// Das Konflikt-Dossier (MIL-1 „Krieg als Vorgang“) in der Welt-Ansicht: Phase, Eskalation, Frontlage mit
// Trend, Erschöpfungsuhr, Lagebild mit ehrlichen Unsicherheits-Stufen (bekannt/vermutet/unsicher) und alle
// verfügbaren Handlungen mit Preisen. Der Präsident bestellt und verantwortet hier — er kommandiert nicht.

import type { World } from "../../sim/types";
import {
  KRIEG,
  PHASEN_NAME,
  RAHMUNG,
  aktiveKriege,
  demobSperreBis,
  doktrinPassung,
  eigenStaerke,
  fuehreKriegHandlungAus,
  gegnerStaerke,
  handlungenFuer,
  kriegMit,
  lagebild,
} from "../../sim/krieg";
import { addDays, formatDateDe } from "../../sim/dates";
import { land } from "../../sim/laender";

const nf = (x: number) => String(Math.round(x));

/** Wort für die gegnerische Stärke, wenn das Lagebild nur eine grobe Einordnung hergibt. */
function einordnung(eigen: number, gegner: number): string {
  const d = gegner - eigen;
  if (d <= -15) return "deutlich schwächer als die eigenen Kräfte";
  if (d <= 15) return "etwa ebenbürtig";
  return "deutlich stärker als die eigenen Kräfte";
}

export function KriegDossier({ world, landId, refresh }: { world: World; landId: string; refresh: () => void }) {
  const k = kriegMit(world, landId);
  if (!k) return null;
  const l = land(landId);
  const handlungen = handlungenFuer(world, k.id);
  const bild = lagebild(world);
  const dok = doktrinPassung(world);
  const eigen = eigenStaerke(world, k);
  const gegner = gegnerStaerke(world, landId);
  const imKrieg = k.phase === "krieg" || k.phase === "waffenruhe";
  const trend = k.front > k.frontVorher + 0.5 ? "steigend" : k.front < k.frontVorher - 0.5 ? "fallend" : "stabil";
  const sperre = demobSperreBis(world);

  return (
    <section className="kd" aria-label={`Konfliktvorgang mit ${l.name}`}>
      <header className={`kd-kopf kd-phase-${k.phase}`}>
        <b>Konfliktvorgang: {PHASEN_NAME[k.phase]}</b>
        <span>
          seit {formatDateDe(addDays(world.date, k.seit - world.day))}
          {k.rahmung ? ` · Rahmung „${RAHMUNG[k.rahmung].name}“` : ""}
        </span>
      </header>

      <div className="kd-zeile" title="Treiber der Eskalation; folgt der Konflikt-Dimension">
        <span>Eskalation</span>
        <span className="we-balken" aria-hidden>
          <i style={{ width: `${k.eskalation}%` }} />
        </span>
        <b>{nf(k.eskalation)}</b>
      </div>

      {imKrieg && (
        <>
          <div className="kd-zeile" title={`Abstrakte Frontlage (100 = Sieg, 0 = Zusammenbruch), Woche ${k.woche}`}>
            <span>Frontlage</span>
            <span className="we-balken" aria-hidden>
              <i style={{ width: `${k.front}%` }} />
            </span>
            <b>
              {nf(k.front)} <em className={`kd-trend kd-trend-${trend}`}>{trend === "steigend" ? "↑" : trend === "fallend" ? "↓" : "→"} {trend}</em>
            </b>
          </div>
          <div className="kd-zeile" title="Rückhalt des Einsatzes im Land (Erschöpfungsuhr); Verluste, Dauer und Wirtschaftslage treiben sie">
            <span>Rückhalt im Land</span>
            <span className="we-balken" aria-hidden>
              <i style={{ width: `${Math.max(0, k.uhr)}%` }} />
            </span>
            <b>{nf(k.uhr)}</b>
          </div>
          <p className="subtitle">
            Woche {k.woche} · Verluste {nf(k.verluste)} · {k.mobilmachung === 2 ? "Vollmobilmachung" : k.mobilmachung === 1 ? "Teilmobilmachung" : "keine Mobilmachung"}
          </p>
        </>
      )}

      <div className="kd-lagebild">
        <b>Lagebild ({bild.stufe})</b>
        <ul>
          <li>
            Eigene Stärke: <b>{nf(eigen)}</b> <em>(bekannt)</em>
          </li>
          <li>
            Gegnerische Stärke:{" "}
            {bild.stufe === "bekannt" ? (
              <>
                <b>{nf(gegner)}</b> <em>(bekannt)</em>
              </>
            ) : bild.stufe === "vermutet" ? (
              <>
                <b>
                  {nf(gegner - 10)}–{nf(gegner + 10)}
                </b>{" "}
                <em>(vermutet)</em>
              </>
            ) : (
              <>
                <b>unbekannt</b> <em>(unsicher: {einordnung(eigen, gegner)})</em>
              </>
            )}
          </li>
          <li>
            Erschöpfung des Gegners: <em>{k.uhrGegner >= 70 ? "vermutlich gering" : k.uhrGegner >= 40 ? "vermutlich wachsend" : "vermutlich hoch"} (vermutet, nicht gemessen)</em>
          </li>
        </ul>
        <p className="subtitle">{bild.text}</p>
      </div>

      {dok.doktrin && (
        <p className={`kd-doktrin ${dok.konsistent ? "ok" : "warn"}`}>
          Doktrin „{dok.name}“: {dok.konsistent ? "konsistent (wirkt multiplikativ)" : `verwässert — es fehlt: ${dok.fehlt.join("; ")}`}
        </p>
      )}

      {sperre > world.day && <p className="kd-demob">Demobilisierung bis {formatDateDe(addDays(world.date, sperre - world.day))}: erneute Mobilisierung frühestens danach (90-Tage-Rechnung).</p>}

      <ul className="we-aktionen kd-handlungen">
        {handlungen.map((h) => (
          <li key={h.id}>
            <button
              type="button"
              className="aktion-knopf"
              disabled={!h.moeglich}
              onClick={() => {
                fuehreKriegHandlungAus(world, k.id, h.id);
                refresh();
              }}
            >
              {h.label} <b>{h.pk}</b>
            </button>
            <span>{h.moeglich ? h.hinweis : h.grund}</span>
          </li>
        ))}
        {handlungen.length === 0 && <li className="subtitle">In dieser Phase gibt es keine Handlung; der Vorgang folgt seiner eigenen Logik.</li>}
      </ul>
      {aktiveKriege(world).length >= KRIEG.maxAktiv && <p className="subtitle">Die Aufmerksamkeit des Staates ist ausgeschöpft: Zwei Konfliktvorgänge laufen bereits.</p>}
    </section>
  );
}

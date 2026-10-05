// Die Lage eines Staates aus dem Weltmodell: Wirtschaft, Politik, Wahl und das, was sich zuletzt geändert hat. Alle Zahlen stammen aus dem
// Zustand; die Startwerte nennen ihre Herkunft (Weltbank, Dossier oder Spielparameter). Kleine Verläufe zeigen nur echte Monatswerte.

import type { World } from "../../sim/types";
import { lage, jungeNachrichten, nf } from "../../sim/welt-modell";
import { wahlSicht, letzteWahl } from "../../sim/welt-sicht";
import { addDays, formatDateDe } from "../../sim/dates";
import type { Code } from "../../data/welt-daten";

function Verlauf({ werte, einheit, titel }: { werte: number[]; einheit: string; titel: string }) {
  if (werte.length < 3) return <span className="we-linie leer" title="Noch zu wenige Monate für einen Verlauf">noch kein Verlauf</span>;
  const min = Math.min(...werte);
  const max = Math.max(...werte);
  const spanne = max - min || 1;
  const pts = werte.map((v, i) => `${((i / (werte.length - 1)) * 100).toFixed(1)},${(22 - ((v - min) / spanne) * 18 - 2).toFixed(1)}`).join(" ");
  return (
    <svg className="we-linie" viewBox="0 0 100 24" preserveAspectRatio="none" role="img" aria-label={`${titel}: ${werte.length} Monate, von ${nf(werte[0]!)} auf ${nf(werte[werte.length - 1]!)} ${einheit}`}>
      <title>{`${titel}: von ${nf(werte[0]!)} auf ${nf(werte[werte.length - 1]!)} ${einheit} in ${werte.length} Monaten`}</title>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

function Zahl({ label, wert, einheit, herkunft, verlauf, gut }: { label: string; wert: string; einheit: string; herkunft?: string; verlauf?: number[]; gut?: "hoch" | "niedrig" | null }) {
  return (
    <div className={`we-zahl${gut ? ` gut-${gut}` : ""}`} title={herkunft ? `Startwert: ${herkunft}` : undefined}>
      <span className="we-zahl-label">{label}</span>
      <strong>
        {wert} <em>{einheit}</em>
      </strong>
      {verlauf && <Verlauf werte={verlauf} einheit={einheit} titel={label} />}
      {herkunft && <small className={herkunft === "Spielparameter" ? "param" : ""}>{herkunft}</small>}
    </div>
  );
}

function Balken({ label, wert, wort, schlecht }: { label: string; wert: number; wort?: string; schlecht?: boolean }) {
  return (
    <div className={`we-lagebalken${schlecht ? " schlecht" : ""}`}>
      <span>
        {label}
        <em>{wort ?? Math.round(wert)}</em>
      </span>
      <i style={{ ["--w" as string]: `${Math.max(0, Math.min(100, wert))}%` }} aria-hidden />
    </div>
  );
}

export function WeltLage({ world, id, onDienst }: { world: World; id: string; onDienst?: (ziel: string) => void }) {
  const l = lage(world, id);
  const wahl = wahlSicht(world, id);
  const letzte = letzteWahl(world, id);
  const news = jungeNachrichten(world, id, 4);
  const h = l.herkunft as Record<Code, string>;
  return (
    <section className="we-lage" aria-label="Lage des Staates">
      {l.krise && (
        <p className="we-krise" role="status">
          {l.krise.name} — bis etwa {formatDateDe(addDays(world.date, l.krise.bisTag - world.day))}
        </p>
      )}
      <div className="we-zahlen-raster">
        <Zahl label="Wachstum" wert={nf(l.wachstum)} einheit="%" herkunft={h.wachstum} verlauf={l.verlauf.map((v) => v[0])} gut="hoch" />
        <Zahl label="Inflation" wert={nf(l.inflation)} einheit="%" herkunft={h.inflation} verlauf={l.verlauf.map((v) => v[1])} gut="niedrig" />
        <Zahl label="Staatsschulden" wert={nf(l.schulden, 0)} einheit="% BIP" herkunft={h.schulden} gut="niedrig" />
        <Zahl label="Haushaltssaldo" wert={nf(l.defizit)} einheit="% BIP" herkunft={h.defizit} gut="hoch" />
        <Zahl label="Rüstung" wert={nf(l.ruestung)} einheit="% BIP" herkunft={h.ruestung} />
      </div>
      <div className="we-balken-raster">
        <Balken label="Stabilität" wert={l.stabilitaet} wort={l.stabilitaetWort} schlecht={l.stabilitaet < 35} />
        <Balken label="Rückhalt der Führung" wert={l.rueckhalt} schlecht={l.rueckhalt < 35} />
        <Balken label="Bedrohungslage" wert={l.bedrohung} schlecht={l.bedrohung > 65} />
        {l.krieg >= 5 && <Balken label="Kriegsbelastung" wert={l.krieg} schlecht={l.krieg > 50} />}
      </div>
      <p className="we-regierung">
        <b>{l.regierungsform}</b> · {l.wahlText}
        {l.verlauf.length >= 3 && <span className="we-hinweis"> · Verlauf der Stabilität: <Verlauf werte={l.verlauf.map((v) => v[2])} einheit="Punkte" titel="Stabilität" /></span>}
      </p>

      {wahl && (
        <div className="we-wahl">
          <b>
            {wahl.art} am {wahl.datumDe}
            <em> — in {wahl.monate <= 0 ? "wenigen Tagen" : wahl.monate === 1 ? "einem Monat" : `${wahl.monate} Monaten`}</em>
          </b>
          <ul>
            <li>
              Amtsführung: <span className={`we-haltung-chip k${wahl.fuehrung.kurs}`}>{wahl.fuehrung.wort}</span>
            </li>
            {wahl.herausforderer ? (
              <li>
                Herausforderer: <span className={`we-haltung-chip k${wahl.herausforderer.kurs}`}>{wahl.herausforderer.wort}</span>, {wahl.herausforderer.staerke}
              </li>
            ) : wahl.monate > 5 ? (
              <li className="we-hinweis">Die Lager stehen erst fünf Monate vor der Wahl fest.</li>
            ) : null}
            <li>
              Aussicht der Amtsführung:{" "}
              {wahl.lagebild ? (
                <b>etwa {wahl.lagebild.prozent} Prozent</b>
              ) : (
                <span className="we-hinweis">unbekannt — ohne Aufklärung bleibt nur der Eindruck aus Rückhalt und Wirtschaft</span>
              )}
              {wahl.lagebild && <span className="we-hinweis"> (Lagebild vor {wahl.lagebild.tage} Tagen)</span>}
            </li>
          </ul>
          {onDienst && wahl.offen && (
            <button type="button" className="link" onClick={() => onDienst(id)}>
              Verdeckte Optionen im Wahlkampf ansehen →
            </button>
          )}
        </div>
      )}
      {letzte && (
        <p className="we-letzte-wahl">
          <b>Letzte Wahl:</b> {letzte.fakt}
        </p>
      )}

      {news.length > 0 && (
        <div className="we-geaendert">
          <b>Was sich zuletzt geändert hat</b>
          <ul>
            {news.map((n, i) => (
              <li key={`${n.tag}-${i}`}>
                <span className="we-datum">{formatDateDe(n.datum)}</span> <strong>{n.titel}</strong>
                <br />
                <span>{n.fakt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

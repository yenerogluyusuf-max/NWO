// Der Posteingang der Minister: alle Vorlagen, die auf dem Tisch liegen, nach Rang, auf Wunsch nach Ressort; dazu die Wiedervorlagen
// und was sichtbar verfallen ist. Der Schreibtisch zeigt nur die ersten fünf (Mappe); hier liegt der Rest.

import { useEffect, useMemo, useState } from "react";
import { Portraet as Zeichnung } from "../art/Portraet";
import { addDays, formatDateDe } from "../../sim/dates";
import { AEMTER } from "../../sim/personen";
import { KABINETT_AMT, amtBesetzt } from "../../sim/ministerfluss-kern";
import { entscheideVorlage, flussZustand, ministerVorlagen, ministerflussSchluessel, pflegeVorlagen } from "../../sim/ministerfluss";
import type { Amt, Vorlage, VorlagenZiel } from "../../sim/ministerfluss-typen";
import type { World } from "../../sim/types";
import { VorlageKarte } from "./VorlageKarte";
import "../politik/design.css";
import "./ministerfluss.css";

import { t } from "../../i18n";
export interface PostfachProps {
  world: World;
  refresh: () => void;
  onGehe?: (z: VorlagenZiel) => void;
  onKarte?: (problemId?: string) => void;
  onEinstellen?: (v: Vorlage) => void;
}

const TINT: Record<string, string> = { stab: "#7c5823", finanzen: "#265a62", inneres: "#4a3f6b", aussen: "#2f5a8a", justiz: "#6b4a3a", generalstab: "#4c5a3a", wirtschaft: "#265a62" };

export function Posteingang({ world, refresh, onGehe, onKarte, onEinstellen }: PostfachProps) {
  const [ressort, setRessort] = useState<Amt | "alle">("alle");
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const [zaehler, setZaehler] = useState(0);
  const schluessel = `${ministerflussSchluessel(world)}|${zaehler}`;
  // Die aufwendigen Vorschauen rechnen nur für die obersten Vorlagen; die Rechnung läuft nur neu, wenn sich der Tisch ändert
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const alle = useMemo(() => ministerVorlagen(world, { tiefe: 6 }), [schluessel]);
  useEffect(() => {
    pflegeVorlagen(world);
    setZaehler((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world.day]);

  const sichtbar = ressort === "alle" ? alle : alle.filter((v) => v.amt === ressort);
  const z = flussZustand(world);
  const vertagt = Object.entries(z.vertagt).filter(([, t]) => t > world.day).length;

  const entscheide = (v: Vorlage, optionId: string) => {
    setAntwort(entscheideVorlage(world, v.id, optionId));
    refresh();
  };

  return (
    <div className="mf">
      <div className="mf-ressorts" role="group" aria-label={t("ui.minister.Posteingang.31ce8a9")}>
        <button className={`mf-ressort${ressort === "alle" ? " on" : ""}`} onClick={() => setRessort("alle")} style={{ paddingLeft: 11 }}>
          Alle <em className={alle.length ? "" : "null"}>{alle.length}</em>
        </button>
        {KABINETT_AMT.map((amt) => {
          const f = amtBesetzt(world, amt);
          const n = alle.filter((v) => v.amt === amt).length;
          return (
            <button key={amt} className={`mf-ressort${ressort === amt ? " on" : ""}`} onClick={() => setRessort(amt)} title={f ? `${f.rolle} ${f.name}` : "Amt unbesetzt"}>
              {f ? <Zeichnung seed={f.name} size={36} geschlecht={f.weiblich ? "f" : "m"} tint={TINT[amt] ?? "#7c5823"} rolle={amt} rahmen="keiner" /> : null}
              {AEMTER[amt].ressort} <em className={n ? "" : "null"}>{n}</em>
            </button>
          );
        })}
      </div>

      {antwort && (
        <p className={`mf-rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
          {antwort.text}
          {antwort.why && <em>{antwort.why}</em>}
        </p>
      )}

      {sichtbar.length === 0 ? (
        <p className="mf-leer">{ressort === "alle" ? "Nichts liegt vor. Die Minister melden sich, sobald sich die Lage ändert." : `Das ${AEMTER[ressort as Amt].ressort}ressort hat im Moment nichts vorzulegen.`}</p>
      ) : (
        <ol className="mf-liste">
          {sichtbar.map((v) => (
            <li key={v.id}>
              <VorlageKarte v={v} kompakt={false} onEntscheide={entscheide} {...(onGehe ? { onGehe } : {})} {...(onKarte ? { onKarte } : {})} {...(onEinstellen ? { onEinstellen } : {})} />
            </li>
          ))}
        </ol>
      )}

      {(vertagt > 0 || z.verfallen.length > 0) && (
        <section className="mf-abschnitt">
          <h4>{t("ui.minister.Posteingang.e0a2eb3")}</h4>
          {vertagt > 0 && <p className="mf-leer">{vertagt === 1 ? "Eine Vorlage ist" : `${vertagt} Vorlagen sind`} vertagt und kommt zur Wiedervorlage zurück.</p>}
          {z.verfallen.length > 0 && (
            <ul className="mf-verfallen">
              {[...z.verfallen]
                .reverse()
                .slice(0, 6)
                .map((x) => (
                  <li key={`${x.id}-${x.verfallen}`}>
                    <span>
                      <strong>{x.titel}</strong> — verfallen: {x.grund}
                    </span>
                    <span>{formatDateDe(addDays(world.spiel!.start.datum, x.verfallen))}</span>
                  </li>
                ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

import { aktiveRessortNachsorge } from "../../sim/ressortnachsorge";
import { RessortAnliegenKarten } from "./RessortAnliegen";
import { offeneRessortVorfaelle } from "../../sim/ressortpolitik";
// Der Posteingang der Minister: alle Vorlagen, die auf dem Tisch liegen, nach Rang, auf Wunsch nach Ressort; dazu die Wiedervorlagen
// und was sichtbar verfallen ist. Der Schreibtisch zeigt nur die ersten fünf (Mappe); hier liegt der Rest.

import { useEffect, useMemo, useState } from "react";
import { Portraet as Zeichnung } from "../art/Portraet";
import { AEMTER } from "../../sim/personen";
import { KABINETT_AMT, amtBesetzt } from "../../sim/ministerfluss-kern";
import { entscheideVorlage, flussZustand, ministerVorlagen, ministerflussSchluessel, pflegeVorlagen } from "../../sim/ministerfluss";
import type { Amt, Vorlage, VorlagenZiel } from "../../sim/ministerfluss-typen";
import type { World } from "../../sim/types";
import { VorlageKarte } from "./VorlageKarte";
import { VorlagenRueckblick } from "./VorlagenRueckblick";
import { zusagenMappenStand } from "../../sim/ministerfluss-zusagen";
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

/** Anliegen, Vorfälle und Nachsorge der Ressorts, die neben den Vorlagen auf dem Tisch liegen; der Reiter im Ministerpult zählt dieselben */
export function offeneAnliegen(world: World) {
  return [...(world.spiel?.ministerfluss?.ressortAnliegen ?? []).filter((a) => ["offen", "besprochen", "abgelehnt"].includes(a.status)), ...offeneRessortVorfaelle(world), ...aktiveRessortNachsorge(world)];
}

export function Posteingang({ world, refresh, onGehe, onKarte, onEinstellen }: PostfachProps) {
  const [ressort, setRessort] = useState<Amt | "alle">("alle");
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const [zaehler, setZaehler] = useState(0);
  const schluessel = `${ministerflussSchluessel(world)}|${zaehler}`;
  const pflegeStand=zusagenMappenStand(world);
  // Die aufwendigen Vorschauen rechnen nur für die obersten Vorlagen; die Rechnung läuft nur neu, wenn sich der Tisch ändert
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const alle = useMemo(() => ministerVorlagen(world, { tiefe: 6 }), [world,schluessel]);
  useEffect(() => {
    pflegeVorlagen(world);
    setZaehler((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world,pflegeStand]);

  const anliegen=offeneAnliegen(world);
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
          {t("ui2.ui.minister.Posteingang.4c7a986")} <em className={alle.length+anliegen.length ? "" : "null"}>{alle.length+anliegen.length}</em>
        </button>
        {KABINETT_AMT.map((amt) => {
          const f = amtBesetzt(world, amt);
          const n = alle.filter((v) => v.amt === amt).length+anliegen.filter(a=>a.amt===amt).length;
          return (
            <button key={amt} className={`mf-ressort${ressort === amt ? " on" : ""}`} onClick={() => setRessort(amt)} title={f ? `${f.rolle} ${f.name}` : t("ui2.ui.minister.Posteingang.f30b991")}>
              {f ? <Zeichnung seed={f.name} size={36} geschlecht={f.weiblich ? "f" : "m"} tint={TINT[amt] ?? "#7c5823"} rolle={amt} rahmen="keiner" /> : null}
              {AEMTER[amt].ressort} <em className={n ? "" : "null"}>{n}</em>
            </button>
          );
        })}
      </div>

      <RessortAnliegenKarten world={world} refresh={refresh} amt={ressort==="alle"?undefined:ressort}/>
      {antwort && (
        <p className={`mf-rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
          {antwort.text}
          {antwort.why && <em>{antwort.why}</em>}
        </p>
      )}

      {sichtbar.length === 0 && !anliegen.some(a=>ressort==="alle"||a.amt===ressort) ? (
        <p className="mf-leer">{ressort === "alle" ? t("ui2.ui.minister.Posteingang.5be9b5f") : t("ui2.ui.minister.Posteingang.5efa51c", { p0: AEMTER[ressort as Amt].ressort })}</p>
      ) : (
        <ol className="mf-liste">
          {sichtbar.map((v) => (
            <li key={v.id}>
              <VorlageKarte v={v} kompakt={false} onEntscheide={entscheide} {...(onGehe ? { onGehe } : {})} {...(onKarte ? { onKarte } : {})} {...(onEinstellen ? { onEinstellen } : {})} />
            </li>
          ))}
        </ol>
      )}

      {vertagt > 0 && (
        <section className="mf-abschnitt">
          <h4>{t("mzr.wiedervorlage")}</h4>
          <p className="mf-leer">{t("mfl.ui.vertagt", { n: vertagt })}</p>
        </section>
      )}
      <VorlagenRueckblick world={world} eintraege={z.verfallen}/>
    </div>
  );
}

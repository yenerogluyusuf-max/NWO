// Die Unterschriftenmappe des Schreibtischs: nur das Wichtigste und Aktuellste, höchstens fünf Karten, jede von dem Minister vorgelegt,
// der dafür zuständig ist. Der Rest liegt im Posteingang des Ministerrats.

import { useEffect, useMemo, useState } from "react";
import { entscheideVorlage, ministerflussSchluessel, pflegeVorlagen, schreibtischMappe } from "../../sim/ministerfluss";
import type { Vorlage, VorlagenZiel } from "../../sim/ministerfluss-typen";
import type { World } from "../../sim/types";
import { VorlageKarte } from "./VorlageKarte";
import "../politik/design.css";
import "./ministerfluss.css";

import { t } from "../../i18n";
export interface MappeProps {
  world: World;
  refresh: () => void;
  max?: number;
  onGehe?: (z: VorlagenZiel) => void;
  onKarte?: (problemId?: string) => void;
  /** Öffnet den Posteingang der Minister */
  onPosteingang?: () => void;
  onEinstellen?: (v: Vorlage) => void;
}

export function Mappe({ world, refresh, max = 5, onGehe, onKarte, onPosteingang, onEinstellen }: MappeProps) {
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const [zaehler, setZaehler] = useState(0);
  const schluessel = `${ministerflussSchluessel(world)}|${zaehler}|${max}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const m = useMemo(() => schreibtischMappe(world, max), [schluessel]);
  useEffect(() => {
    pflegeVorlagen(world);
    setZaehler((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world.day]);

  const entscheide = (v: Vorlage, optionId: string) => {
    setAntwort(entscheideVorlage(world, v.id, optionId));
    refresh();
  };

  return (
    <div className="mf">
      {antwort && (
        <p className={`mf-rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
          {antwort.text}
          {antwort.why && <em>{antwort.why}</em>}
        </p>
      )}
      {m.mappe.length === 0 ? (
        <p className="mf-leer">{t("ui.minister.Mappe.61fe21b")}</p>
      ) : (
        <ol className="mf-liste">
          {m.mappe.map((v, i) => (
            <li key={v.id}>
              <VorlageKarte v={v} kompakt nummer={i + 1} onEntscheide={entscheide} {...(onGehe ? { onGehe } : {})} {...(onKarte ? { onKarte } : {})} {...(onEinstellen ? { onEinstellen } : {})} />
            </li>
          ))}
        </ol>
      )}
      {(m.weitere > 0 || m.verfallen > 0) && onPosteingang && (
        <p className="mf-leer">
          {m.weitere > 0 ? t("mf.weitere", { n: m.weitere }) : t("mf.posteingangLeer")}
          {m.vertagt > 0 ? t("mf.vertagt", { n: m.vertagt }) : ""}
          {m.verfallen > 0 ? t("mf.verfallen", { n: m.verfallen }) : ""}.{" "}
          <button className="pd-btn quiet" onClick={onPosteingang}>
            {t("mf.zumPosteingang")}
          </button>
        </p>
      )}
    </div>
  );
}

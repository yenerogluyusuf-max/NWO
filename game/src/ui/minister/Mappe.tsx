import { aktiveRessortNachsorge } from "../../sim/ressortnachsorge";
import { RessortAnliegenKarten } from "./RessortAnliegen";
import { offeneRessortVorfaelle } from "../../sim/ressortpolitik";
// Die Unterschriftenmappe des Schreibtischs: nur das Wichtigste und Aktuellste, höchstens fünf Karten, jede von dem Minister vorgelegt,
// der dafür zuständig ist. Der Rest liegt im Posteingang des Ministerrats.

import { useEffect, useMemo, useState } from "react";
import { entscheideVorlage, ministerflussSchluessel, pflegeVorlagen, schreibtischMappe } from "../../sim/ministerfluss";
import type { Vorlage, VorlagenZiel } from "../../sim/ministerfluss-typen";
import type { World } from "../../sim/types";
import { VorlageKarte } from "./VorlageKarte";
import { zusagenMappenStand } from "../../sim/ministerfluss-zusagen";
import "../politik/design.css";
import "./ministerfluss.css";

import { t } from "../../i18n";
export interface MappeProps {
  world: World;
  refresh: () => void;
  max?: number;
  /** Schreibtisch führt Minister und Auswahl in eigenen Arbeitsbereichen. */
  ohneRessorts?: boolean;
  fokus?: boolean;
  vorlageId?: string;
  onAuswahl?: (id: string) => void;
  onGehe?: (z: VorlagenZiel) => void;
  onKarte?: (problemId?: string) => void;
  /** Öffnet den Posteingang der Minister */
  onPosteingang?: () => void;
  onEinstellen?: (v: Vorlage) => void;
}

export function Mappe({ world, refresh, max = 5, ohneRessorts = false, fokus = false, vorlageId, onAuswahl, onGehe, onKarte, onPosteingang, onEinstellen }: MappeProps) {
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const [zaehler, setZaehler] = useState(0);
  const schluessel = `${ministerflussSchluessel(world)}|${zaehler}|${max}`;
  const pflegeStand=zusagenMappenStand(world);
  const offeneAnliegen=world.spiel?.ministerfluss?.ressortAnliegen?.some(a=>["offen","besprochen","abgelehnt"].includes(a.status));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const m = useMemo(() => schreibtischMappe(world, max), [world,schluessel]);
  useEffect(() => {
    pflegeVorlagen(world);
    setZaehler((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world,pflegeStand]);

  const entscheide = (v: Vorlage, optionId: string) => {
    setAntwort(entscheideVorlage(world, v.id, optionId));
    refresh();
  };

  return (
    <div className="mf">
      {!ohneRessorts && <RessortAnliegenKarten world={world} refresh={refresh}/>}
      {antwort && (
        <p className={`mf-rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
          {antwort.text}
          {antwort.why && <em>{antwort.why}</em>}
        </p>
      )}
      {m.mappe.length === 0 ? (
        (ohneRessorts || (!offeneAnliegen&&!offeneRessortVorfaelle(world).length&&!aktiveRessortNachsorge(world).length))&&<p className="mf-leer">{t("ui.minister.Mappe.61fe21b")}</p>
      ) : (
        <>
        {fokus && <div className="sd-auswahl" role="group" aria-label={t("sd.vorlagen")}>
          {m.mappe.map(v=><button type="button" className="sd-auswahlkarte" key={v.id} aria-pressed={v.id===vorlageId} onClick={()=>onAuswahl?.(v.id)}>
            <span>{v.minister?.name??t("sk.ui.mappe")}</span><strong>{v.titel}</strong>
            <small>{v.frist===undefined?v.prioritaetGrund:t(v.frist<0?"sd.ueberfaellig":v.frist===0?"sd.heute":"sd.inTagen",{n:Math.abs(v.frist)})}</small>
          </button>)}
        </div>}
        {fokus && !m.mappe.some(v=>v.id===vorlageId) && <p className="sd-leer">{t(vorlageId?"sd.erledigt":"sd.auswaehlen")}</p>}
        <ol className="mf-liste" {...(fokus&&m.mappe.some(v=>v.id===vorlageId)?{'data-sd-detail':true,tabIndex:-1,'aria-label':m.mappe.find(v=>v.id===vorlageId)!.titel}:{})}>
          {m.mappe.filter(v=>!fokus||v.id===vorlageId).map((v, i) => (
            <li key={v.id}>
              <VorlageKarte v={v} kompakt nummer={fokus ? undefined : i + 1} onEntscheide={entscheide} {...(onGehe ? { onGehe } : {})} {...(onKarte ? { onKarte } : {})} {...(onEinstellen ? { onEinstellen } : {})} />
            </li>
          ))}
        </ol></>
      )}
      {(m.weitere > 0 || m.rueckblick > 0 || m.vertagt > 0) && onPosteingang && (
        <p className="mf-leer">
          {m.weitere > 0 ? t("mf.weitere", { n: m.weitere }) : t("mf.posteingangLeer")}
          {m.vertagt > 0 ? t("mf.vertagt", { n: m.vertagt }) : ""}
          {m.rueckblick > 0 ? t("mzr.anzahl", { n: m.rueckblick }) : ""}.{" "}
          <button className="pd-btn quiet" onClick={onPosteingang}>
            {t("mf.zumPosteingang")}
          </button>
        </p>
      )}
    </div>
  );
}

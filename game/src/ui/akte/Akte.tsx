// Bereichsarbeitsplatz: direkte fachliche Zugänge, ruhige Kennzahlen und nachgeordnete Einordnung.
// Bestehende Reiterkennungen bleiben für gespeicherte und programmatische Zugänge erhalten.

import { useId, useState, type ReactNode } from "react";
import { t } from "../../i18n";
import { Funke } from "./Kennzahl";
import { VorgaengeReiter } from "./Vorgaenge";
import type { World } from "../../sim/types";
import { Icon, type IconName } from "../icons";
import { aktenProfil } from "./profil";
import { Vignette, type Scene } from "../art/Vignette";
import "./akte.css";

/** „vorgaenge“: Platz für politische Vorhaben vom Versprechen bis zur Rechenschaft (baut ein späterer Strang). */
export type AktenReiterId = "lage" | "instrumente" | "verlauf" | "personen" | "vorgaenge";

export interface AktenReiter {
  id: AktenReiterId;
  /** Kurzer Satz unter dem Reiternamen */
  text?: string;
  inhalt: () => ReactNode;
}

export interface Kernwert {
  label: string;
  wert: string;
  /** Verlauf für die kleine Linie (älteste zuerst) */
  verlauf?: number[];
  /** Ton des Wertes */
  ton?: "gut" | "mittel" | "schlecht";
  hinweis?: string;
  /** 0 bis 1: Stand auf einer Skala von 0 bis 100; dann zeigt der Kopf einen Messring */
  anteil?: number;
}

/** Kopfzeichnung je Bereich (GESTALTUNG_2026-11-04, G1). Bis jeder Bereich ein eigenes Motiv hat, teilen sich manche eines. */
const KOPFBILD: Record<string, Scene> = {
  sicherheit: "kueste", aussen: "istanbul", recht: "parlament", regierung: "parlament", wirtschaft: "bank",
  land: "anatolien", wissen: "anatolien", gesellschaft: "istanbul", medien: "istanbul",
};

function Messring({ anteil }: { anteil: number }) {
  const r = 17, u = 2 * Math.PI * r, a = Math.max(0, Math.min(1, anteil));
  return (
    <svg className="ak-ring" width="42" height="42" viewBox="0 0 42 42" aria-hidden>
      <circle cx="21" cy="21" r={r} className="spur" />
      <circle cx="21" cy="21" r={r} className="wert" strokeDasharray={`${u * a} ${u}`} transform="rotate(-90 21 21)" />
    </svg>
  );
}

export interface AkteProps {
  /** Kennung des Bereichs (für Klassen und Tests) */
  bereich: string;
  zweck: string;
  kernwerte: Kernwert[];
  reiter: AktenReiter[];
  start?: AktenReiterId;
  /** Gesteuerte Auswahl (optional) */
  aktiv?: AktenReiterId;
  onReiter?: (id: AktenReiterId) => void;
  /** Fachliche Ziele ersetzen die abstrakte Sammelrubrik und deren zweite Reiterleiste. */
  zugaenge?: { aktiv:string; eintraege:AktenZugang[] };
  datum?:string;
}

export interface AktenZugang { id:string; label:string; text?:string; icon:IconName; waehlen:()=>void }
export interface AktenNavigation { id:string; label:string; text?:string; icon:IconName; aktiv:boolean; gruppe:"arbeit"|"einordnung"; waehlen:()=>void }
const REITER_ICON:Record<AktenReiterId,IconName>={lage:"ziel",instrumente:"feder",verlauf:"buch",personen:"person",vorgaenge:"akte"};

/** Eine Navigationsebene. Der Inhalt wird weiterhin erst für den ausgewählten Zugang aufgebaut. */
export function aktenNavigation(bereich:string,reiter:AktenReiter[],aktiv:AktenReiterId|undefined,waehle:(id:AktenReiterId)=>void,zugaenge?:AkteProps["zugaenge"]):AktenNavigation[] {
  const profil=aktenProfil(bereich);
  return reiter.flatMap((r):AktenNavigation[]=>{
    if(r.id==="instrumente"&&zugaenge?.eintraege.length)return zugaenge.eintraege.map(z=>({
      ...z,id:`zugang-${z.id}`,aktiv:aktiv===r.id&&zugaenge.aktiv===z.id,gruppe:"arbeit",
      waehlen:()=>{waehle(r.id);z.waehlen();},
    }));
    return [{id:r.id,label:profil.reiter(r.id),text:r.text,icon:REITER_ICON[r.id],aktiv:aktiv===r.id,
      gruppe:r.id==="lage"||r.id==="instrumente"?"arbeit":"einordnung",waehlen:()=>waehle(r.id)}];
  });
}

/** Reiter „Vorgänge“: mit Welt die Vorgangsliste (ui/akte/Vorgaenge.tsx), ohne Welt der Platzhalter. */
export function VorgaengePlatz({ w, onGeaendert, start }: { w?: World; onGeaendert?: (() => void) | undefined; start?: string | undefined }) {
  if (w) return <VorgaengeReiter key={start ?? ""} w={w} onGeaendert={onGeaendert} {...(start ? { start } : {})} />;
  return <p className="ak-leer">{t("akte.vorgaenge.platzhalter")}</p>;
}

export function Akte({ bereich, zweck, kernwerte, reiter, start, aktiv, onReiter, zugaenge, datum }: AkteProps) {
  const id=useId();
  const [eigen, setEigen] = useState<AktenReiterId>(start ?? reiter[0]?.id ?? "lage");
  const gewaehlt = aktiv ?? eigen;
  const zeige = reiter.find((r) => r.id === gewaehlt) ?? reiter[0];
  const waehle = (id: AktenReiterId) => {
    setEigen(id);
    onReiter?.(id);
  };
  const profil=aktenProfil(bereich),navigation=aktenNavigation(bereich,reiter,zeige?.id,waehle,zugaenge);
  const ausgewaehlt=navigation.find(n=>n.aktiv);
  return (
    <div className={`ak-akte ak-${bereich}`} data-bereich={bereich}>
      <header className={`ak-kopf${KOPFBILD[bereich] ? " mit-bild" : ""}`}>
        {KOPFBILD[bereich] && <div className="ak-kopfbild"><Vignette scene={KOPFBILD[bereich]} /></div>}
        <div className="ak-identitaet">
          <div className="ak-titelzeile"><span className="ak-bereichszeichen"><Icon name={profil.icon} size={28}/></span>
            <div><div className="ak-metazeile"><span>{t(bereich==="recht"?"rn.gesetzgebung":bereich==="regierung"?"rn.vollzug":"akneu.ressort")}</span>{datum&&<span>{datum}</span>}</div><h2>{profil.titel}</h2></div>
          </div>
          <p className="ak-zweck">{zweck}</p>
        </div>
        <dl className="ak-kernwerte" aria-label={t("akneu.kennzahlen")}>
          {kernwerte.slice(0, 3).map((k) => (
            <div key={k.label} className={`ak-kernwert${k.ton ? ` ${k.ton}` : ""}${k.anteil !== undefined ? " mit-ring" : ""}`} title={k.hinweis}>
              <dt className="ak-kernwert-label">{k.label}</dt>
              <dd>{k.anteil !== undefined && <Messring anteil={k.anteil} />}<strong>{k.wert}</strong></dd>
              {k.verlauf && k.verlauf.length > 1 && <Funke werte={k.verlauf} breite={96} hoehe={22} />}
            </div>
          ))}
        </dl>
      </header>
      <div className="ak-arbeitsplatz">
        <nav className="ak-navigation" aria-label={t("akneu.navigation",{bereich:profil.titel})}>
          <a className="ak-zum-inhalt" href={`#${id}-inhalt`}>{t("akneu.zumInhalt")}</a>
          {(["arbeit","einordnung"] as const).map(gruppe=><div className={`ak-navgruppe ${gruppe}`} key={gruppe}>
            <span className="ak-navtitel">{t(`akneu.${gruppe}`)}</span>
            <div>{navigation.filter(n=>n.gruppe===gruppe).map(n=><button key={n.id} id={`${id}-${n.id}`} type="button" aria-current={n.aktiv?"page":undefined} aria-controls={`${id}-inhalt`} aria-description={n.text} className={n.aktiv?"on":""} onClick={n.waehlen}>
              <Icon name={n.icon} size={20}/><span>{n.label}</span><i aria-hidden="true">{n.aktiv?"→":""}</i>
            </button>)}</div>
          </div>)}
        </nav>
        <section id={`${id}-inhalt`} className="ak-inhalt" role="region" tabIndex={-1} aria-labelledby={ausgewaehlt?`${id}-${ausgewaehlt.id}`:undefined} aria-label={ausgewaehlt?undefined:profil.titel}>
          {zeige?.inhalt()}
        </section>
      </div>
    </div>
  );
}

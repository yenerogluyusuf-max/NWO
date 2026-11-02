import { useId, useRef, useState } from "react";
import type { World } from "../../sim/types";
import { gueterZustand } from "../../sim/gueter";
import { militaerVersorgung, type VersorgungsPrioritaet } from "../../sim/versorgung";
import { zivileVersorgungsDeckung, type VersorgungsProgramm } from "../../sim/versorgungspolitik";
import { akteurName } from "../../sim/welt-modell";
import { addDays, formatDateDe } from "../../sim/dates";
import { t, zahl } from "../../i18n";
import { UbVerweis } from "../akte/Uebersicht";
import "./inventar.css";
import "./regierung.css";
import { VersorgungsProgrammKarte } from "./VersorgungsProgrammKarte";
import { VersorgungsMonatsbericht } from "./VersorgungsMonatsbericht";
import { VersorgungsKursKarte } from "./VersorgungsKursKarte";

/** Ein Regierungsbriefing für Wirtschaftsakte und Kriegsdossier, aus derselben Monatsbilanz. */
export function VersorgungsLage({ world, geaendert, programm }: { world: World; geaendert: () => void; programm?: VersorgungsProgramm }) {
  const [meldung, setMeldung] = useState("");
  const [kursWahl,setKursWahl]=useState<VersorgungsPrioritaet>();
  const kursId=useId();
  const kursKnopf=useRef<HTMLButtonElement>(null);
  const z = gueterZustand(world), b = z.bilanz, reg = z.regierung;
  const m = militaerVersorgung(world);
  const kriege = (world.spiel?.kriege ?? []).filter(k => k.phase === "krieg" || k.phase === "waffenruhe");
  const knapp = Object.values(b?.waren ?? {}).filter(f => f && f.fehl > 0.005 * f.bedarf).length;
  const datum = (tag: number) => formatDateDe(addDays(world.date, tag-world.day));
  const tun = (r: { ok: boolean; text: string }) => { setMeldung(r.text); if (r.ok) geaendert(); };
  const vorzeichen = (n: number) => `${n > 0 ? "+" : ""}${zahl(n, 2)}`;
  return <section className="rg-lage" aria-label={t("regierung.titel")}>
    <header className="rg-kopf"><span>{t("regierung.kicker")}</span><h3>{t("regierung.titel")}</h3><p>{t("regierung.intro")}</p></header>
    <div className="rg-inhalt">
      <div className="rg-lagezeile"><span className={knapp ? "rg-warnung" : ""}>{t("gueter.kette.engpaesse")}: <b>{b ? knapp : "—"}</b></span><UbVerweis ziel={{art:"versorgung"}}>{t("transport.zurKarte")}</UbVerweis></div>
      <div className="rg-zahlen">
        <div><span>{t("regierung.deckung")}</span><strong>{b ? `${zahl(zivileVersorgungsDeckung(b)*100, 0)} %` : "—"}</strong></div>
        <div><span>{t("gueter.kette.treibstoff")}</span><strong>{kriege.length && b ? `${zahl(m.treibstoff*100, 0)} %` : "—"}</strong></div>
        <div><span>{t("gueter.kette.handelsbeitrag")}</span><strong>{b ? vorzeichen(b.handelsDeltaUsdMrd) : "—"}</strong><small>{t("gueter.kette.mrdUsd")}</small></div>
      </div>
      <fieldset className="rg-kurse"><legend>{t("regierung.kurs")}</legend>
        {(["ausgewogen", "zivil", "militaer"] as VersorgungsPrioritaet[]).map(kurs => {
          const aktiv = (z.prioritaet ?? "ausgewogen") === kurs;
          return <button key={kurs} ref={kursWahl===kurs?kursKnopf:undefined} type="button" aria-pressed={kursWahl===kurs} aria-expanded={kursWahl===kurs} aria-controls={kursId} onClick={() => setKursWahl(kursWahl===kurs?undefined:kurs)}>
            <span className="rg-kurszeichen" aria-hidden="true">{aktiv ? "●" : "○"}</span><b>{t(`gueter.kette.${kurs}`)}</b><span>{t(`regierung.${kurs}`)}</span>
            <small className="ve-kurs-status">{t(aktiv?"regierung.aktuellerKurs":"ve.ansehen")}</small>
          </button>;
        })}
      </fieldset>
      <p className="rg-leise">{t("regierung.kursPreis")} {reg?.kursAb && reg.kursAb > world.day ? t("regierung.gebundenBis", {datum:datum(reg.kursAb)}) : ""}</p>
      <div id={kursId}>{kursWahl&&<VersorgungsKursKarte world={world} kurs={kursWahl} onErgebnis={r=>{tun(r);if(r.ok){kursKnopf.current?.focus();setKursWahl(undefined);}}}/>}</div>
      <h4 className="rg-abschnitt">{t("regierung.programme")}</h4>
      <div className="rg-programme">{(["schutz", "energie", "netz"] as VersorgungsProgramm[]).map((id, i) =>
        <VersorgungsProgrammKarte key={id} world={world} programm={id} index={i} start={programm===id} geaendert={geaendert}/>
      )}</div>
      <p role="status" className="rg-meldung">{meldung}</p>
      <p className="rg-leise">{t("regierung.abrechnung")}</p>
      {kriege.map(k => <div className="rg-aussenlink" key={k.id}><span>{akteurName(k.land)}</span><UbVerweis ziel={{art:"land", id:k.land}}>{t("regierung.deeskalation")}</UbVerweis></div>)}
      <VersorgungsMonatsbericht bericht={reg?.bericht} world={world} geaendert={geaendert}/>
    </div>
  </section>;
}

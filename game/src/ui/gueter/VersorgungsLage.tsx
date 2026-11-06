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
  const [kursOffen,setKursOffen]=useState(false);
  const kursId=useId();
  const kursKnopf=useRef<HTMLButtonElement>(null);
  const z = gueterZustand(world), b = z.bilanz, reg = z.regierung;
  const m = militaerVersorgung(world);
  const kriege = (world.spiel?.kriege ?? []).filter(k => k.phase === "krieg" || k.phase === "waffenruhe");
  const knapp = Object.values(b?.waren ?? {}).filter(f => f && f.fehl > 0.005 * f.bedarf).length;
  const datum = (tag: number) => formatDateDe(addDays(world.date, tag-world.day));
  const tun = (r: { ok: boolean; text: string }) => { setMeldung(r.text); if (r.ok) geaendert(); };
  const vorzeichen = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${zahl(Math.abs(n), 2)}`;
  const kursZu = !(knapp > 0 || kriege.length > 0 || (z.prioritaet ?? "ausgewogen") !== "ausgewogen" || kursOffen || kursWahl);
  const naechsterMonat = (d: string) => { const j = Number(d.slice(0, 4)), mo = Number(d.slice(5, 7)); return mo === 12 ? `${j + 1}-01` : `${j}-${String(mo + 1).padStart(2, "0")}`; };
  return <section className="rg-lage" aria-label={t("regierung.titel")}>
    {/* Tag T5: Kopf in einer Zeile (Titel links, Auftrag rechts); Lage, Vorrang und Kartenweg teilen sich eine Zeile */}
    <header className="rg-kopf"><div><span>{t("regierung.kicker")}</span><h3>{t("regierung.titel")}</h3></div><p>{t("regierung.intro")}</p></header>
    <div className="rg-inhalt">
      {/* Vor dem ersten Monatsabschluss gibt es keine Bilanz: ein Satz mit dem Termin statt dreier Striche (Befund D-17) */}
      <div className="rg-lagezeile">
        {b ? <span className={knapp ? "rg-warnung" : ""}>{t("gueter.kette.engpaesse")}: <b>{knapp}</b></span> : <span>{t("n3.vs.nochKeine", { datum: formatDateDe(`${naechsterMonat(world.date)}-01`) })}</span>}
        {kursZu && <span className="rg-leise rg-kurs-zu">{t("n3.vs.vorrang", { kurs: t(`gueter.kette.${z.prioritaet ?? "ausgewogen"}`) })} <button type="button" className="pd-btn quiet klein" onClick={() => setKursOffen(true)}>{t("n3.vs.vorrangAendern")}</button></span>}
        <UbVerweis ziel={{art:"versorgung"}}>{t("transport.zurKarte")}</UbVerweis>
      </div>
      {b && <>
        <div className="rg-zahlen">
          <div><span>{t("regierung.deckung")}</span><strong>{`${zahl(zivileVersorgungsDeckung(b)*100, 0)} %`}</strong></div>
          {kriege.length > 0 && <div><span>{t("gueter.kette.treibstoff")}</span><strong>{`${zahl(m.treibstoff*100, 0)} %`}</strong></div>}
          <div><span>{t("gueter.kette.handelsbeitrag")}</span><strong>{vorzeichen(b.handelsDeltaUsdMrd)}</strong><small>{t("gueter.kette.mrdUsd")}</small></div>
        </div>
      </>}
      {/* Der Vorrang im Engpass steht erst offen da, wenn etwas knapp ist, Krieg herrscht oder ein anderer Kurs gilt */}
      {!kursZu && <>
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
      </>}
      <h4 className="rg-abschnitt">{t("regierung.programme")}<small>{t("regierung.abrechnung")}</small></h4>
      <div className="rg-programme">{(["schutz", "energie", "netz"] as VersorgungsProgramm[]).map((id, i) =>
        <VersorgungsProgrammKarte key={id} world={world} programm={id} index={i} start={programm===id} geaendert={geaendert}/>
      )}</div>
      <p role="status" className="rg-meldung">{meldung}</p>
      {kriege.map(k => <div className="rg-aussenlink" key={k.id}><span>{akteurName(k.land)}</span><UbVerweis ziel={{art:"land", id:k.land}}>{t("regierung.deeskalation")}</UbVerweis></div>)}
      {/* Vor der ersten Bilanz sagt die Lagezeile oben schon, wann sie kommt; die leere Berichtsfläche entfällt dann */}
      {(b || reg?.bericht) && <VersorgungsMonatsbericht bericht={reg?.bericht} world={world} geaendert={geaendert}/>}
    </div>
  </section>;
}

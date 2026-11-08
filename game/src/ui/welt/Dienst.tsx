// Der Dienst (MİT) als eine Akte (Welle M1, 8. November 2026; ENTSCHEIDUNGEN Z).
//
// Vorher an drei Orten: hier sechs Operationen gegen einen von 43 Zielstaaten (Wahlkampfhilfe, Desinformation, Netz, Cyber, Gruppen,
// Cyberangriff; ohne Zweck und mit negativem Erwartungswert, machtkreis_dienst.md 2.3), unter Sicherheit › Behörden › MİT Inland und Ausbau
// in der vierten Ebene, im Machtkreis die Überprüfung. Jetzt: Kopf mit vier Kennzahlen, die drei Gelegenheiten nach dem echten MİT (Zugriff,
// Schlag gegen Kader, Austausch), das Inland mit der Gegenspionage, der Ausbau und der Bericht. Die Liste der Zielstaaten und die
// Operationen ohne Zweck entfallen; laufende alte Operationen enden wie angeordnet (sim/welt-dienst.ts). Rechtsrahmen in sim/dienst-sicht.ts.

import { useState } from "react";
import type { World } from "../../sim/types";
import { OP_DEFS, dienst, dienstSicht, inlandOptionen, lagebildQualitaet, ordneAn, ordneInlandAn, praesidentenSchutz, type InlandArt } from "../../sim/welt-dienst";
import { gelegenheiten, tageBisGelegenheit, type Gelegenheit } from "../../sim/dienst-sicht";
import { behoerdeSicht } from "../../sim/behoerden";
import { akteurName } from "../../sim/welt-modell";
import { machtkreis } from "../../sim/machtkreis";
import { formatDateDe } from "../../sim/dates";
import { Flagge } from "../art/Flaggen";
import { Portraet } from "../art/Portraet";
import { BehoerdeDetail } from "../behoerden/Behoerde";
import { useSprung } from "../akte/Uebersicht";
import { t } from "../../i18n";
import "../behoerden/behoerden.css";
import "./dienst.css";

const ausgangName = (a: string): string => t(`tag_t8.dienst.bericht.${a}`);

type Antwort = { ok: boolean; text: string; why?: string } | null;

export function Dienst({ world, refresh, onLand }: { world: World; refresh: () => void; ziel?: string; onLand: (id: string) => void }) {
  const [antwort, setAntwort] = useState<Antwort>(null);
  const gehe = useSprung();
  if (!world.spiel) return null;
  const sicht = dienstSicht(world);
  const lage = lagebildQualitaet(world);
  const schutz = praesidentenSchutz(world);
  const leitung = behoerdeSicht(world, "mit").leitung;
  const gel = gelegenheiten(world);
  const inland = inlandOptionen(world);
  const kreis = machtkreis(world).untersuchungen.length;
  const laufend = sicht.laufend.length + sicht.inland.length + kreis;
  const naechste = tageBisGelegenheit(world);
  const kapital = world.spiel.kapital;
  const gegen = OP_DEFS.gegen;

  const tue = (f: () => Antwort) => {
    setAntwort(f());
    refresh();
  };

  return (
    <div className="we-dienst dz">
      <p className="we-dienst-kopf dz-satz">{t("welle_m1.dienst.satz")}</p>

      <header className="dz-kopf">
        <div className="dz-wer">
          <Portraet seed={leitung.name} size={64} geschlecht={leitung.weiblich ? "f" : "m"} rahmen="messing" />
          <div>
            <small>{t("welle_m1.dienst.kicker")}</small>
            <h3>{t("welle_m1.dienst.frage")}</h3>
            <p>{t("welle_m1.dienst.leitung", { titel: leitung.titel, name: leitung.name })}</p>
          </div>
        </div>
        <dl className="dz-zahlen">
          <div className={sicht.kapazitaet < 25 ? "schlecht" : sicht.kapazitaet < 50 ? "mittel" : "gut"}>
            <dt>{t("welle_m1.dienst.zahl.kapazitaet")}</dt>
            <dd>
              {Math.round(sicht.kapazitaet)}
              <span>/{sicht.kapazitaetMax}</span>
            </dd>
            <span className="dz-balken" aria-hidden>
              <i style={{ width: `${(sicht.kapazitaet / sicht.kapazitaetMax) * 100}%` }} />
            </span>
          </div>
          <div className={laufend ? "aktiv" : ""}>
            <dt>{t("welle_m1.dienst.zahl.laufend")}</dt>
            <dd>{laufend}</dd>
            <em>{t("welle_m1.dienst.zahl.laufend_zeile", { aussen: sicht.laufend.length, inland: sicht.inland.length, kreis })}</em>
          </div>
          <div className={lage.wert >= 60 ? "gut" : lage.wert >= 35 ? "mittel" : "schlecht"}>
            <dt>{t("welle_m1.dienst.zahl.lagebild")}</dt>
            <dd>
              {lage.wert}
              <span>/100</span>
            </dd>
            <em>{lage.wort}</em>
          </div>
          <div className={schutz >= 0.7 ? "gut" : schutz >= 0.4 ? "mittel" : "schlecht"}>
            <dt>{t("welle_m1.dienst.zahl.schutz")}</dt>
            <dd>{t("welle_m1.dienst.prozent", { p: Math.round(schutz * 100) })}</dd>
            <em>{t("welle_m1.dienst.zahl.schutz_zeile")}</em>
          </div>
        </dl>
      </header>

      {antwort && (
        <p className={`we-rueck ${antwort.ok ? "ok" : "nein"}`} role="status">
          {antwort.text}
          {antwort.why && <em> {antwort.why}</em>}
        </p>
      )}

      <section className="dz-abschnitt">
        <div className="dz-abschnitt-kopf">
          <h4>{t("welle_m1.dienst.ausland")}</h4>
          <span>{naechste > 0 ? t("welle_m1.dienst.naechste", { tage: naechste }) : t("welle_m1.dienst.naechste_frei")}</span>
        </div>
        <div className="dz-karten">
          {gel.map((g) => (
            <GelegenheitKarte key={g.art} w={world} g={g} onVorgang={gehe ? (id) => gehe({ art: "ereignis", id }) : undefined} onLand={onLand} />
          ))}
        </div>
      </section>

      <section className="dz-abschnitt">
        <div className="dz-abschnitt-kopf">
          <h4>{t("welle_m1.dienst.inland")}</h4>
          {dienst(world).inlandLage && <span>{t("behoerden.mit.ui.inlandlage", { monate: Math.max(1, Math.round((world.day - dienst(world).inlandLage!.tag) / 30)), putsch: dienst(world).inlandLage!.putsch, terror: dienst(world).inlandLage!.terror })}</span>}
        </div>
        <div className="dz-karten dz-inland">
          {inland.map((o) => {
            const laeuft = sicht.inland.find((x) => x.art === o.def.art);
            return (
              <article key={o.def.art} className={`dz-karte${o.moeglich ? "" : " gesperrt"}`}>
                <strong>{o.name}</strong>
                <div className="dz-chips">
                  <span>{t("welle_m1.dienst.chip.kapital", { n: o.def.pk })}</span>
                  <span>{t("welle_m1.dienst.chip.kapazitaet", { n: o.def.kap })}</span>
                  <span>{t("welle_m1.dienst.chip.monate", { n: o.def.monate })}</span>
                </div>
                <p>{o.text}</p>
                <div className="dz-quote">
                  <span>
                    {t("welle_m1.dienst.aussicht_kurz")} <b>{t("welle_m1.dienst.prozent", { p: Math.round(o.p * 100) })}</b>
                  </span>
                  {o.pLeck > 0 && (
                    <span className="risiko">
                      {t("welle_m1.dienst.leck_kurz")} <b>{t("welle_m1.dienst.prozent", { p: Math.round(o.pLeck * 100) })}</b>
                    </span>
                  )}
                </div>
                {laeuft ? (
                  <p className="dz-stand">{t("welle_m1.dienst.laeuft", { monate: Math.max(1, Math.round(laeuft.restTage / 30)) })}</p>
                ) : (
                  <div className="dz-fuss">
                    <button type="button" className="aktion-knopf klein" disabled={!o.moeglich} onClick={() => tue(() => ordneInlandAn(world, o.def.art as InlandArt))}>
                      {t("behoerden.mit.ui.anordnen")}
                    </button>
                    {!o.moeglich && <span className="we-hinweis">{o.grund}</span>}
                  </div>
                )}
              </article>
            );
          })}
          <article className={`dz-karte${sicht.abwehr > 0 ? " aktiv" : ""}`}>
            <strong>{gegen.name}</strong>
            <div className="dz-chips">
              <span>{t("welle_m1.dienst.chip.kapital", { n: gegen.pk })}</span>
              <span>{t("welle_m1.dienst.chip.kapazitaet", { n: gegen.kap })}</span>
              <span>{t("welle_m1.dienst.chip.monate", { n: gegen.monate })}</span>
            </div>
            <p>{t("welle_m1.dienst.gegen.text", { fremd: sicht.aufgedeckteFremde.length })}</p>
            {sicht.abwehr > 0 ? (
              <p className="dz-stand">{t("welle_m1.dienst.laeuft", { monate: sicht.abwehr })}</p>
            ) : (
              <div className="dz-fuss">
                <button type="button" className="aktion-knopf klein" disabled={kapital < gegen.pk || sicht.kapazitaet < gegen.kap} onClick={() => tue(() => ordneAn(world, "gegen", "USA"))}>
                  {t("behoerden.mit.ui.anordnen")}
                </button>
              </div>
            )}
          </article>
        </div>
      </section>

      <details className="dz-aufklapp">
        <summary>{t("welle_m1.dienst.ausbau", { personal: behoerdeSicht(world, "mit").achsen[0]?.stufe ?? 3, technik: behoerdeSicht(world, "mit").achsen[1]?.stufe ?? 3, reichweite: behoerdeSicht(world, "mit").achsen[2]?.stufe ?? 3 })}</summary>
        <div className="dz-ausbau">
          <BehoerdeDetail w={world} id="mit" refresh={refresh} />
        </div>
      </details>

      <details className="dz-aufklapp" open={sicht.bericht.some((b) => b.ausgang !== "info" && world.day - b.tag < 120) || undefined}>
        <summary>{t("welle_m1.dienst.bericht", { n: sicht.bericht.length })}</summary>
        <div className="dz-bericht">
          {sicht.laufend.length > 0 && (
            <ul className="dz-laufend">
              {sicht.laufend.map((l) => (
                <li key={l.op.id}>
                  <Flagge id={l.ziel} breite={24} /> <strong>{l.name}</strong> {t("welle_m1.dienst.laufend_zeile", { land: akteurName(l.ziel), monate: Math.max(1, Math.round(l.restTage / 30)) })}
                </li>
              ))}
            </ul>
          )}
          {sicht.aufgedeckteFremde.length > 0 && (
            <ul className="dz-laufend fremd">
              {sicht.aufgedeckteFremde.map((f, i) => (
                <li key={i}>
                  <Flagge id={f.von} breite={24} /> {t("welle_m1.dienst.fremd_zeile", { land: akteurName(f.von) })}
                </li>
              ))}
            </ul>
          )}
          {sicht.bericht.length === 0 ? (
            <p className="we-hinweis">{t("ui.welt.Dienst.5419971")}</p>
          ) : (
            <ul className="dz-eintraege">
              {sicht.bericht.slice(0, 12).map((b, i) => (
                <li key={`${b.tag}-${i}`} className={`ausgang-${b.ausgang}`}>
                  <span className="we-datum">{formatDateDe(b.datum)}</span> <span className={`we-chip ausgang-${b.ausgang}`}>{ausgangName(b.ausgang)}</span> <strong>{b.titel}</strong>
                  <br />
                  <span>{b.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>
    </div>
  );
}

function GelegenheitKarte({ w, g, onVorgang, onLand }: { w: World; g: Gelegenheit; onVorgang?: ((id: string) => void) | undefined; onLand: (id: string) => void }) {
  const def = OP_DEFS[g.art];
  const zustand = g.offen ? "offen" : g.laufend ? "laufend" : g.bedingung.erfuellt ? "bereit" : "ruht";
  return (
    <article className={`dz-karte dz-gel z-${zustand}`}>
      <div className="dz-gel-kopf">
        <strong>{def.name}</strong>
        <span className={`dz-stempel z-${zustand}`}>{t(`welle_m1.dienst.zustand.${zustand}`)}</span>
      </div>
      <div className="dz-chips">
        <span>{t("welle_m1.dienst.chip.kapital", { n: def.pk })}</span>
        <span>{t("welle_m1.dienst.chip.kapazitaet", { n: def.kap })}</span>
        <span>{t("welle_m1.dienst.chip.monate", { n: def.monate })}</span>
      </div>
      <p>{t(`welle_m1.dienst.zweck.${g.art}`)}</p>
      <p className="dz-quote">{g.aussicht}</p>
      <p className={`dz-bed${g.bedingung.erfuellt ? " ja" : ""}`}>{g.bedingung.text}</p>
      {g.offen && (
        <div className="dz-fuss">
          {g.offen.land && <Flagge id={g.offen.land} breite={24} />}
          <span>{t("welle_m1.dienst.offen", { land: g.offen.land ? akteurName(g.offen.land) : "", tage: g.offen.fristTage })}</span>
          {onVorgang && (
            <button type="button" className="aktion-knopf klein" onClick={() => onVorgang(g.offen!.id)}>
              {t("welle_m1.dienst.zum_vorgang")} →
            </button>
          )}
        </div>
      )}
      {g.laufend && (
        <div className="dz-fuss">
          <Flagge id={g.laufend.land} breite={24} />
          <span>
            {t("welle_m1.dienst.laufend", { land: akteurName(g.laufend.land), monate: Math.max(1, Math.round(g.laufend.restTage / 30)) })}
            {g.laufend.p !== undefined && ` · ${t("welle_m1.dienst.festgehalten", { p: Math.round(g.laufend.p * 100), auf: Math.round((g.laufend.pAuf ?? 0) * 100) })}`}
          </span>
          <button type="button" className="link" onClick={() => onLand(g.laufend!.land)}>
            {t("welle_m1.dienst.land")} →
          </button>
        </div>
      )}
      {g.letzter && (
        <p className={`dz-letzter ausgang-${g.letzter.ausgang}`}>
          <span className="we-datum">{formatDateDe(g.letzter.datum)}</span> {ausgangName(g.letzter.ausgang)}: {g.letzter.text}
        </p>
      )}
    </article>
  );
}

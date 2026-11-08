// Der Friedenstisch (Welle 3, K4; krieg.md Schritt 7). Oben die Lage als Karte des Schauplatzes, die Regionen gefärbt nach der Forderung,
// daneben das Budget des Gegners gegen die Punkte des Pakets und der Preis daheim und im Ausland. Darunter je Region eine Zeile mit den
// Formen (Zone, Sonderstatus, Abtretung, Rückgabe) und ihren Punkten, dann die Auflagen des Vertrags. Ganz unten drei Wege: das eigene
// Paket vorlegen, den Vorschlag oder das Gegenangebot des Gegners annehmen, das Paket des Vermittlers annehmen.
// Rechnet nichts selbst: alle Zahlen aus sim/friedenstisch.ts (tischPreis, tischRegionen, tischBudget, vermittlerPaket).

import type { World } from "../../sim/types";
import type { FriedensTisch, KriegVorgang, TischForm } from "../../sim/krieg-typen";
import { PAKETE, paketPreis, type KriegHandlungId, type KriegHandlungSicht } from "../../sim/krieg";
import {
  TISCH,
  tischBudget,
  tischEntwurf,
  tischPreis,
  tischRegionen,
  tischSetzen,
  tischVorlegen,
  vermittlerPaket,
  vermittlerVon,
  type TischPreis,
} from "../../sim/friedenstisch";
import { regionenVon } from "../../sim/kriegsschauplatz";
import { land } from "../../sim/laender";
import { akteurName } from "../../sim/welt-modell";
import type { Region } from "../../data/schauplaetze";
import { t, zahl } from "../../i18n";
import { useSprache } from "../../i18n/react";
import { SchauplatzKarte } from "./Schauplatz";
import "./krieg.css";
import "./schauplatz-karte.css";
import "./friedenstisch.css";

const FORMEN: TischForm[] = ["zone", "zivil", "satellit", "annexion", "rueckgabe"];
const zz = (x: number, d = 1): string => (x > 0 ? "+" : x < 0 ? "−" : "±") + zahl(Math.abs(x), d);
const pz = (x: number): string => (x > 0 ? "" : x < 0 ? "−" : "") + zahl(Math.abs(x), 0);

/** Einwohner kurz (wie im Schauplatz). */
function einwohnerKurz(n: number): string {
  return n >= 1_000_000 ? t("welle_k2.ui.mio", { z: zahl(n / 1_000_000, 2) }) : t("welle_k2.ui.tsd", { z: zahl(Math.round(n / 1000), 0) });
}

/** Der Inhalt eines Pakets in kurzen Zeilen (für die drei Wege). */
function inhalt(k: KriegVorgang, x: FriedensTisch, vermittler?: string): string[] {
  const out: string[] = [];
  for (const r of tischRegionen(k, x)) {
    if (r.lage === "umkaempft" && r.form === "rueckgabe") continue;
    out.push(`${t(`krieg.region.${r.region.id}`)}: ${t(`welle_k4.form.${r.form}${r.lage === "umkaempft" && r.form === "zone" ? "_umk" : ""}.kurz`)}`);
  }
  const halten = tischRegionen(k, x).some((r) => r.form !== "rueckgabe");
  if (halten && x.rueckzugKm) out.push(t("welle_k4.auflage.rueckzug.kurz", { km: x.rueckzugKm }));
  if (halten && x.patrouillen && vermittler) out.push(t("welle_k4.auflage.patrouillen.kurz", { mit: vermittler }));
  if (halten && x.rueckkehr) out.push(t("welle_k4.auflage.rueckkehr.kurz"));
  if (x.reparation) out.push(t("welle_k4.auflage.reparation.kurz"));
  if (x.garantien) out.push(t("welle_k4.auflage.garantien.kurz"));
  return out;
}

/** Innen- und Außenpreis eines Pakets als zwei Zeilen Zahlen (dieselben Buchungen wie beim Friedensschluss). */
function Preis({ p, gegner }: { p: TischPreis; gegner: string }) {
  const aussen = Object.entries(p.konflikt).map(([id, v]) => t("welle_k4.preis.konflikt", { land: id === gegner ? land(id).name : akteurName(id), z: zz(v, 0) }));
  return (
    <dl className="ft-preis">
      <dt>{t("welle_k4.preis.daheim")}</dt>
      <dd>
        {t("welle_k4.preis.zustimmung", { z: zz(p.zustimmung) })}
        {p.nationalisten ? ` · ${t("welle_k4.preis.nationalisten", { z: zz(p.nationalisten) })}` : ""}
        {p.bip ? ` · ${t("welle_k4.preis.bip", { z: zz(-p.bip, 1) })}` : ""}
      </dd>
      <dt>{t("welle_k4.preis.aussen")}</dt>
      <dd>{[t("welle_k4.preis.ansehen", { z: zz(p.ansehen) }), ...aussen].join(" · ")}</dd>
    </dl>
  );
}

/** Balken: Punkte des Pakets gegen das Budget des Gegners. */
function Waage({ p }: { p: TischPreis }) {
  const max = Math.max(p.budget, p.punkte, 1) * 1.15;
  return (
    <span className={`ft-waage${p.annahme ? " ja" : " nein"}`} aria-hidden>
      <i style={{ width: `${Math.min(100, (p.punkte / max) * 100)}%` }} />
      <u style={{ left: `${Math.min(100, (p.budget / max) * 100)}%` }} />
    </span>
  );
}

export function Friedenstisch({ world, k, handlungen, tun, onTat }: { world: World; k: KriegVorgang; handlungen: KriegHandlungSicht[]; tun: (id: KriegHandlungId) => void; onTat: (r: { ok: boolean; text: string; why?: string }) => void }) {
  useSprache();
  const name = land(k.land).name;
  const entwurf = tischEntwurf(k);
  const preis = tischPreis(world, k, entwurf);
  const budget = tischBudget(world, k);
  const regs = tischRegionen(k, entwurf);
  const formNach = new Map(regs.map((r) => [r.region.id, r]));
  const halten = regs.some((r) => r.form !== "rueckgabe");
  const v = vermittlerVon(world, k);
  const vName = v ? akteurName(v) : undefined;
  const vPaket = vermittlerPaket(world, k);
  const vPreis = vPaket ? tischPreis(world, k, vPaket) : undefined;
  const gegen = k.tischAbgelehnt?.gegen;
  const gegenPreis = gegen ? tischPreis(world, k, gegen) : undefined;
  // Der Vorschlag der Gegenseite aus der Waffenruhe (sim/krieg.ts waffenruheTag), solange kein Gegenangebot vom Tisch vorliegt
  const angebot = !gegen && k.angebotPaket ? handlungen.find((h) => h.id === k.angebotPaket) : undefined;
  const setze = (a: Parameters<typeof tischSetzen>[2]) => onTat(tischSetzen(world, k.id, a));

  // Warum eine Form nicht verhandelbar ist, steht einmal über den Regionen (nicht in jeder Zeile)
  const sperren = [...new Set(regs.flatMap((r) => r.formen.map((f) => f.grund).filter((g): g is string => !!g)))];
  const kartenLage = (r: Region): string => {
    const x = formNach.get(r.id);
    if (!x) return "aussen";
    if (x.lage === "umkaempft" && x.form === "rueckgabe") return "gegner";
    return `ft-${x.form}`;
  };

  return (
    <section className="ft" aria-label={t("welle_k4.titel", { land: name })}>
      <header className="ft-kopf">
        <h5>{t("welle_k4.titel", { land: name })}</h5>
        <span>{t("welle_k4.frage", { land: name })}</span>
      </header>

      <div className="ft-oben">
        <div className="ft-karte">
          <SchauplatzKarte regionen={regionenVon(k.land)} lage={kartenLage} />
          <ul className="skk-legende ft-legende" aria-hidden>
            {FORMEN.map((f) => <li key={f} className={`ft-l-${f}`}>{t(`welle_k4.form.${f}.name`)}</li>)}
          </ul>
        </div>
        <div className="ft-bilanz">
          <dl className="ft-zahlen">
            <div>
              <dt>{t("welle_k4.budget", { land: name })}</dt>
              <dd>{zahl(budget.punkte, 0)}</dd>
            </div>
            <div>
              <dt>{t("welle_k4.paket_punkte")}</dt>
              <dd className={preis.annahme ? "ja" : "nein"}>{zahl(preis.punkte, 0)}</dd>
            </div>
          </dl>
          <Waage p={preis} />
          <p className={`ft-antwort ${preis.annahme ? "ja" : "nein"}`}>
            {preis.annahme
              ? t("welle_k4.antwort.ja", { land: name })
              : preis.gesperrt.length
                ? t("welle_k4.antwort.sperre", { land: name })
                : t("welle_k4.antwort.nein", { land: name, n: preis.punkte - preis.budget })}
          </p>
          <Preis p={preis} gegner={k.land} />
          <details className="kp-rechnung">
            <summary>{t("welle_k4.budget.rechnung")}</summary>
            <table>
              <tbody>
                {budget.posten.map((x) => (
                  <tr key={x.id}>
                    <td>{t(`welle_k4.budget.${x.id}`)}</td>
                    <td className={x.wert >= 0 ? "kp-plus" : "kp-minus"}>{zz(x.wert)}</td>
                  </tr>
                ))}
                <tr className="kp-summe">
                  <td>{t("welle_k4.budget.summe")}</td>
                  <td>{zahl(budget.punkte, 0)}</td>
                </tr>
              </tbody>
            </table>
          </details>
        </div>
      </div>

      {sperren.length > 0 && (
        <ul className="ft-sperren">
          {sperren.map((g) => <li key={g}>{g}</li>)}
        </ul>
      )}
      <ol className="ft-regionen" aria-label={t("welle_k4.regionen")}>
        {regs.map((r) => {
          return (
            <li key={r.region.id} className={`ft-region ft-${r.lage}`}>
              <div className="ft-region-kopf">
                <strong>{t(`krieg.region.${r.region.id}`)}</strong>
                <small>
                  {t(`welle_k4.lage.${r.lage}`)} · {t("welle_k2.ui.km2", { z: zahl(r.region.flaecheKm2, 0) })}
                  {r.region.einwohner ? ` · ${einwohnerKurz(r.region.einwohner.zahl)}` : ""}
                </small>
              </div>
              <div className="ft-formen" role="group">
                {r.formen.map((f) => {
                  const umkVerzicht = r.lage === "umkaempft" && f.form === "rueckgabe";
                  return (
                    <button
                      key={f.form}
                      type="button"
                      className={`ft-form ft-form-${f.form}${r.form === f.form ? " on" : ""}`}
                      disabled={!!f.grund || r.form === f.form}
                      title={f.grund ?? t(`welle_k4.form.${umkVerzicht ? "verzicht" : f.form}.text`)}
                      onClick={() => setze({ region: r.region.id, form: f.form })}
                    >
                      <strong>{t(`welle_k4.form.${umkVerzicht ? "verzicht" : f.form}.name`)}</strong>
                      <span>{f.grund ? t("welle_k4.gesperrt") : t("welle_k4.punkte", { n: pz(f.punkte) })}</span>
                    </button>
                  );
                })}
              </div>
              <p className="ft-hilfe">{t(`welle_k4.form.${r.lage === "umkaempft" && r.form === "rueckgabe" ? "verzicht" : r.form === "zone" && r.lage === "umkaempft" ? "zone_umk" : r.form}.text`)}</p>
            </li>
          );
        })}
      </ol>

      <div className="ft-auflagen">
        <h6>{t("welle_k4.auflagen")}</h6>
        <div className="ft-auflage">
          <span>{t("welle_k4.auflage.rueckzug", { land: name })}</span>
          <div className="ft-formen" role="group">
            {([0, 10, 30] as const).map((km) => (
              <button key={km} type="button" className={`ft-form${entwurf.rueckzugKm === km ? " on" : ""}`} disabled={!halten || entwurf.rueckzugKm === km} onClick={() => setze({ rueckzugKm: km })}>
                <strong>{km ? t("welle_k4.km", { km }) : t("welle_k4.km0")}</strong>
                <span>{t("welle_k4.punkte", { n: pz(TISCH.rueckzug[km]) })}</span>
              </button>
            ))}
          </div>
        </div>
        <ul className="ft-schalter">
          {(["patrouillen", "rueckkehr", "reparation", "garantien"] as const).map((f) => {
            const an = entwurf[f];
            const brauchtHalten = f === "patrouillen" || f === "rueckkehr";
            const aus = (brauchtHalten && !halten) || (f === "patrouillen" && !v);
            return (
              <li key={f}>
                <button type="button" className={`ft-schalt${an ? " on" : ""}`} aria-pressed={an} disabled={aus} onClick={() => setze({ [f]: !an })}>
                  <i aria-hidden />
                  <strong>{t(`welle_k4.auflage.${f}`, { mit: vName ?? "" })}</strong>
                  <span>{t("welle_k4.punkte", { n: pz(TISCH[f]) })}</span>
                </button>
                <small>{t(`welle_k4.auflage.${f}.text`, { mit: vName ?? "", land: name })}</small>
              </li>
            );
          })}
        </ul>
      </div>

      <ul className="ft-wege">
        <li className={`ft-weg${preis.annahme ? " ja" : " nein"}`}>
          <div className="kp-titel"><strong>{t("welle_k4.weg.eigen")}</strong></div>
          <p className="ft-weg-zahl"><b>{zahl(preis.punkte, 0)}</b> / {zahl(preis.budget, 0)}</p>
          <ul className="ft-inhalt">{inhalt(k, entwurf, vName).map((z) => <li key={z}>{z}</li>)}</ul>
          <button type="button" className="aktion-knopf" onClick={() => onTat(tischVorlegen(world, k.id, "eigen"))}>
            {t("welle_k4.weg.vorlegen")}
          </button>
          <small className={preis.annahme ? "kp-ja" : "kp-nein"}>{preis.annahme ? t("welle_k4.weg.nimmt_an", { land: name }) : t("welle_k4.weg.lehnt_ab", { land: name })}</small>
        </li>
        {gegen && gegenPreis && (
          <li className="ft-weg ja angebot">
            <div className="kp-titel"><strong>{t("welle_k4.weg.gegen", { land: name })}</strong></div>
            <p className="ft-weg-zahl"><b>{zahl(gegenPreis.punkte, 0)}</b> / {zahl(gegenPreis.budget, 0)}</p>
            <ul className="ft-inhalt">{inhalt(k, gegen, vName).map((z) => <li key={z}>{z}</li>)}</ul>
            <Preis p={gegenPreis} gegner={k.land} />
            <button type="button" className="aktion-knopf" onClick={() => onTat(tischVorlegen(world, k.id, "gegen"))}>{t("welle_k4.weg.annehmen")}</button>
          </li>
        )}
        {angebot && (
          <li className="ft-weg ja angebot">
            <div className="kp-titel"><strong>{t("welle_k4.weg.vorschlag", { land: name })}</strong></div>
            <p className="kp-text">{PAKETE[angebot.id]!.text}</p>
            <dl className="ft-preis">
              <dt>{t("welle_k4.preis.daheim")}</dt>
              <dd>{(() => { const pp = paketPreis(world, k, PAKETE[angebot.id]!.paket(k.front)); return [t("welle_k4.preis.zustimmung", { z: zz(-pp.po) }), pp.nationalisten ? t("welle_k4.preis.nationalisten", { z: zz(pp.nationalisten, 0) }) : ""].filter(Boolean).join(" · "); })()}</dd>
            </dl>
            <button type="button" className="aktion-knopf" disabled={!angebot.moeglich} onClick={() => tun(angebot.id)}>{t("welle_k4.weg.annehmen")} <b>{angebot.pk}</b></button>
          </li>
        )}
        {vPaket && vPreis && v && (
          <li className="ft-weg ja vermittler">
            <div className="kp-titel">
              <strong>{t(`welle_k4.weg.vermittler.${v}`)}</strong>
              <em>{t(`welle_k4.weg.vorbild.${v}`)}</em>
            </div>
            <p className="ft-weg-zahl"><b>{zahl(vPreis.punkte, 0)}</b> / {zahl(vPreis.budget, 0)}</p>
            <ul className="ft-inhalt">{inhalt(k, vPaket, vName).map((z) => <li key={z}>{z}</li>)}<li>{t(`welle_k4.weg.bonus.${v}`)}</li></ul>
            <Preis p={vPreis} gegner={k.land} />
            <button type="button" className="aktion-knopf" onClick={() => onTat(tischVorlegen(world, k.id, "vermittler"))}>{t("welle_k4.weg.annehmen")}</button>
          </li>
        )}
      </ul>
    </section>
  );
}

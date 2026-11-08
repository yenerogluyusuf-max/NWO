// Besetzte Regionen und neue Provinzen (Welle 3, K5; ENTSCHEIDUNGEN Z: Karten mit Kennzahlen statt Fließtext).
// Je Region: Kennzahlen, die Formwahl mit einer Vorschau über drei Jahre (Kosten, Widerstand, Ansehen, Rückkehr) und, vor der Annexion,
// alle Folgen auf einen Blick: neue Provinz, Einwohner, Wahlberechtigte, Sitze, Eingliederung, Sicherheitsrat, Generalversammlung,
// Sanktionsstufen. Rechnet nichts selbst: Kurven aus `formKurve`, Folgen aus `annexionVorschau` (dieselben Funktionen buchen).

import { useState } from "react";
import type { World } from "../../sim/types";
import { datum, t, zahl } from "../../i18n";
import { useSprache } from "../../i18n/react";
import { aendereBesatzung, besatzungLesen, besatzungsSicht, formKurve, wechselPk, type BesatzungsSicht, type KurvenPunkt } from "../../sim/besatzung";
import { annexionVorschau, annexionen, type AnnexionsVorschau } from "../../sim/annexion";
import { neueProvinzVon, staatAnnektiert, wahlberechtigte } from "../../sim/provinzen-neu";
import { land } from "../../sim/laender";
import { bipWertMrd } from "../../sim/staatsgeld";
import { addDays } from "../../sim/dates";
import { BESATZUNG, FORMEN, type BesatzungsWahl } from "../../data/besatzung";
import { GV_VERGLEICH, SANKTIONS_STUFEN, UN_MITGLIEDER } from "../../data/annexion";
import type { AnnexionsVorgang, UnAbstimmung } from "../../sim/krieg-typen";
import "./krieg.css";
import "./besatzung.css";

const pz = (x: number, d = 2) => zahl(Math.round(x * 10 ** d) / 10 ** d, d);
const vz = (x: number, d = 1) => (x > 0 ? "+" : x < 0 ? "−" : "±") + zahl(Math.abs(Math.round(x * 10 ** d) / 10 ** d), d);
const tausend = (x: number) => (x >= 1e6 ? t("welle_k5.ui.mio", { n: zahl(Math.round(x / 1e5) / 10, 1) }) : zahl(Math.round(x / 1000) * 1000, 0));

export function Besatzung({ world, onTat, nurLand }: { world: World; onTat: (text: string) => void; nurLand?: string }) {
  useSprache();
  const liste = besatzungsSicht(world).filter((b) => !nurLand || b.land === nurLand);
  const vorgaenge = annexionen(world).filter((a) => (!nurLand || a.land === nurLand) && a.regionen.some((id) => besatzungLesen(world).some((b) => b.region === id && b.form === a.art)));
  if (!liste.length) return null;
  const bip = bipWertMrd(world.economy);
  const kostenJahr = liste.reduce((s, b) => s + b.kostenMonat, 0) * 12;
  const steuernJahr = liste.reduce((s, b) => s + b.einnahmenMonat, 0) * 12;
  const einwohner = liste.reduce((s, b) => s + b.einwohner, 0);
  const provinzen = liste.filter((b) => b.form === "annexion").length;
  const ganz = [...new Set(liste.map((b) => b.land))].filter((l) => staatAnnektiert(world, l));
  return (
    <section className="bz" aria-label={t("krieg.besatzung.titel")}>
      <header className="bz-kopf">
        <h5>{t("welle_k5.ui.titel")}</h5>
        <dl className="bz-kern">
          <div><dt>{t("welle_k5.ui.regionen")}</dt><dd>{liste.length}</dd></div>
          <div><dt>{t("welle_k5.ui.einwohner")}</dt><dd>{tausend(einwohner)}</dd></div>
          <div><dt>{t("welle_k5.ui.kosten_jahr")}</dt><dd>{pz(kostenJahr)} %<small>{t("welle_k5.ui.mrd", { n: zahl(Math.round((kostenJahr * bip) / 100), 0) })}</small></dd></div>
          {provinzen > 0 && <div><dt>{t("welle_k5.ui.steuern_jahr")}</dt><dd>{pz(steuernJahr, 3)} %<small>{t("welle_k5.ui.mrd", { n: zahl(Math.round((steuernJahr * bip) / 10) / 10, 1) })}</small></dd></div>}
          {provinzen > 0 && <div><dt>{t("welle_k5.ui.provinzen")}</dt><dd>{provinzen}</dd></div>}
        </dl>
      </header>
      {ganz.map((l) => <p key={l} className="bz-staat">{t("welle_k5.staat.exil", { land: land(l).name })}</p>)}
      {vorgaenge.map((a) => <Reaktion key={a.id} world={world} a={a} />)}
      <ul className="bz-liste">
        {liste.map((b) => <Region key={b.region} world={world} b={b} onTat={onTat} />)}
      </ul>
    </section>
  );
}

/** Die internationale Reaktion: Sicherheitsrat, Generalversammlung (mit Krim und Oblaste), Sanktionsstufe. */
function Reaktion({ world, a }: { world: World; a: AnnexionsVorgang }) {
  const naechste = a.stufe < a.stufeMax ? SANKTIONS_STUFEN[a.stufe] : undefined;
  return (
    <section className="bz-reaktion" aria-label={t("welle_k5.ui.reaktion")}>
      <h6>{t(a.art === "satellit" ? "welle_k5.ui.reaktion_satellit" : "welle_k5.ui.reaktion")} · {land(a.land).name}</h6>
      <div className="bz-un">
        <UnZeile titel={t("welle_k5.ui.sr")} s={a.sr} offen={t("welle_k5.ui.sr_offen", { datum: datum(addDays(world.date, Math.max(0, a.seit + 3 - world.day)), "kurz") })} sr />
        {a.art === "annexion" && <UnZeile titel={t("welle_k5.ui.gv")} s={a.gv} offen={t("welle_k5.ui.gv_offen", { datum: datum(addDays(world.date, Math.max(0, a.seit + 9 - world.day)), "kurz") })} vergleich />}
      </div>
      {a.art === "annexion" && (
        <p className="bz-stufe">
          <b>{t("welle_k5.ui.stufe", { stufe: a.stufe, max: a.stufeMax })}</b>
          {naechste ? <span>{t("welle_k5.ui.stufe_naechste", { datum: datum(addDays(world.date, a.seit + naechste.tag - world.day), "kurz") })}</span> : null}
          {a.vertrag ? <span>{t(a.angriff ? "welle_k5.ui.vertrag_angriff" : "welle_k5.ui.vertrag")}</span> : null}
        </p>
      )}
    </section>
  );
}

function UnZeile({ titel, s, offen, sr, vergleich }: { titel: string; s?: UnAbstimmung; offen: string; sr?: boolean; vergleich?: boolean }) {
  if (s && s.ja + s.nein + s.enth === 0) return <div className="bz-unzeile"><span>{titel}</span><em>{t("welle_k5.ui.keine_abstimmung")}</em></div>;
  return (
    <div className="bz-unzeile">
      <span>{titel}</span>
      {s ? (
        <>
          <Stimmen s={s} gesamt={sr ? 15 : UN_MITGLIEDER} />
          <b>{zahl(s.ja, 0)} : {zahl(s.nein, 0)} : {zahl(s.enth, 0)}</b>
          <em>{sr ? (s.veto?.length ? t("welle_k5.ui.veto", { wer: s.veto.map((id) => t(`welle_k5.p5.${id}`)).join(", ") }) : s.angenommen ? t("welle_k5.ui.angenommen") : t("welle_k5.ui.abgelehnt")) : vergleich ? t("welle_k5.ui.vergleich", { krim: `${GV_VERGLEICH.krim.ja}:${GV_VERGLEICH.krim.nein}:${GV_VERGLEICH.krim.enth}`, oblaste: `${GV_VERGLEICH.oblaste.ja}:${GV_VERGLEICH.oblaste.nein}:${GV_VERGLEICH.oblaste.enth}` }) : ""}</em>
        </>
      ) : (
        <em>{offen}</em>
      )}
    </div>
  );
}

/** Ja, Nein, Enthaltung als ein Balken. */
function Stimmen({ s, gesamt }: { s: Pick<UnAbstimmung, "ja" | "nein" | "enth">; gesamt: number }) {
  const w = (x: number) => `${(100 * x) / gesamt}%`;
  return (
    <span className="bz-stimmen" aria-hidden>
      <i className="ja" style={{ width: w(s.ja) }} />
      <i className="nein" style={{ width: w(s.nein) }} />
      <i className="enth" style={{ width: w(s.enth) }} />
    </span>
  );
}

function Region({ world, b, onTat }: { world: World; b: BesatzungsSicht; onTat: (text: string) => void }) {
  const [wahl, setWahl] = useState<BesatzungsWahl | null>(null);
  const p = neueProvinzVon(world, b.region);
  const name = t(`krieg.region.${b.region}`);
  const bip = bipWertMrd(world.economy);
  const formName = b.form === "zone" && b.stellvertreter ? t("welle_k5.form.zone.mit") : t(`welle_k5.form.${b.form}.name`);
  return (
    <li className={`bz-region form-${b.form}`}>
      <div className="bz-rkopf">
        <strong>{p ? t("welle_k5.ui.provinz_name", { name, plaka: p.plaka }) : name}</strong>
        <span>
          {land(b.land).name} · {formName}
          {b.grundlage === "linie" ? ` · ${t("welle_k1.besatzung.linie")}` : ""}
        </span>
      </div>
      <dl className="bz-zahlen">
        <div><dt>{t("welle_k5.ui.einwohner")}</dt><dd>{b.einwohner ? tausend(b.einwohner) : "–"}</dd></div>
        <div title={t("krieg.besatzung.widerstand_hilfe", { ziel: b.widerstandZiel })} className={b.widerstand >= BESATZUNG.anschlagAb ? "schlecht" : undefined}>
          <dt>{t("krieg.besatzung.widerstand")}</dt>
          <dd>{zahl(Math.round(b.widerstand), 0)}<small>{t("welle_k5.ui.ziel", { ziel: b.widerstandZiel })}</small></dd>
          <span className="bz-balken" aria-hidden><i style={{ width: `${b.widerstand}%` }} /><u style={{ left: `${b.widerstandZiel}%` }} /></span>
        </div>
        <div><dt>{t("welle_k5.ui.kosten_jahr")}</dt><dd>{pz(b.kostenMonat * 12)} %<small>{t("welle_k5.ui.mrd", { n: zahl(Math.round((b.kostenMonat * 12 * bip) / 100), 0) })}</small></dd></div>
        {b.land === "SYR" && <div><dt>{t("welle_k5.ui.rueckkehr")}</dt><dd>{zahl(b.rueckkehr ?? 0, 0)}</dd></div>}
        {p && (
          <>
            <div><dt>{t("welle_k5.ui.steuern_jahr")}</dt><dd>{pz(b.einnahmenMonat * 12, 3)} %</dd></div>
            <div><dt>{t("welle_k5.ui.eingliederung")}</dt><dd>{datum(addDays(world.date, p.eingliederungBis - world.day), "monat")}</dd></div>
            <div><dt>{t("welle_k5.ui.waehler")}</dt><dd>{tausend(wahlberechtigte(p))}</dd></div>
            <div><dt>{t("welle_k5.ui.sitze")}</dt><dd>{p.sitze !== undefined ? zahl(p.sitze, 0) : "–"}<small>{p.sitze !== undefined ? t("welle_k5.ui.sitze_seit") : t("welle_k5.ui.sitze_ab")}</small></dd></div>
          </>
        )}
      </dl>
      <div className="bz-wahl" role="group" aria-label={t("welle_k5.ui.formwahl", { region: name })}>
        {[...FORMEN, "rueckgabe" as const].map((f) => {
          const jetzt = f === b.form;
          return (
            <button key={f} type="button" className={`bz-form${jetzt ? " jetzt" : ""}${wahl === f ? " on" : ""}`} aria-pressed={wahl === f} disabled={jetzt} onClick={() => setWahl(wahl === f ? null : f)}>
              <strong>{f === "zone" && b.stellvertreter ? t("welle_k5.form.zone.mit") : t(`welle_k5.form.${f}.name`)}</strong>
              <span>{jetzt ? t("welle_k5.ui.jetzt") : t("krieg.besatzung.preis", { pk: wechselPk(f) })}</span>
            </button>
          );
        })}
      </div>
      {wahl && <Vorschau world={world} b={b} wahl={wahl} onTat={(text) => { setWahl(null); onTat(text); }} />}
    </li>
  );
}

/** Die Vorschau einer Wahl: drei Jahre im Vergleich zur heutigen Form, bei der Annexion dazu alle Folgen. */
function Vorschau({ world, b, wahl, onTat }: { world: World; b: BesatzungsSicht; wahl: BesatzungsWahl; onTat: (text: string) => void }) {
  const name = t(`krieg.region.${b.region}`);
  const heute = formKurve(world, b.region, b.form);
  const neu = wahl === "rueckgabe" ? [] : formKurve(world, b.region, wahl);
  const gesperrt = b.form === "annexion" && wahl !== "rueckgabe" ? t("welle_k5.fehler.provinz") : b.grundlage === "linie" && (wahl === "annexion" || wahl === "satellit") ? t("welle_k5.fehler.linie") : null;
  const kapital = (world.spiel?.kapital ?? 0) >= wechselPk(wahl);
  return (
    <div className="bz-vorschau">
      <p className="bz-satz">{t(`welle_k5.form.${wahl}.kurz`)}</p>
      {wahl !== "rueckgabe" && (
        <div className="bz-kurven" aria-label={t("welle_k5.ui.kurven", { jahre: 3 })}>
          <Kurve titel={t("welle_k5.ui.k_kosten")} a={heute} b={neu} wert={(x) => x.kosten} text={(x) => `${pz(x)} %`} />
          <Kurve titel={t("welle_k5.ui.k_widerstand")} a={heute} b={neu} wert={(x) => x.widerstand} text={(x) => zahl(Math.round(x), 0)} max={100} />
          <Kurve titel={t("welle_k5.ui.k_ansehen")} a={heute} b={neu} wert={(x) => x.ansehen} text={(x) => vz(x)} />
          {b.land === "SYR" && <Kurve titel={t("welle_k5.ui.k_rueckkehr")} a={heute} b={neu} wert={(x) => x.rueckkehr} text={(x) => tausend(x)} />}
          {wahl === "annexion" && <Kurve titel={t("welle_k5.ui.k_steuern")} a={heute} b={neu} wert={(x) => x.einnahmen} text={(x) => `${pz(x, 3)} %`} />}
          <p className="bz-legende"><i className="a" /> {t("welle_k5.ui.legende_heute", { form: t(`welle_k5.form.${b.form}.name`) })} <i className="b" /> {t(`welle_k5.form.${wahl}.name`)} · {t("welle_k5.ui.kurven", { jahre: 3 })}</p>
        </div>
      )}
      {wahl === "annexion" && b.form !== "annexion" && <Folgen landId={b.land} v={annexionVorschau(world, b)} />}
      <div className="bz-tat">
        <button type="button" className="aktion-knopf" disabled={!!gesperrt || !kapital} onClick={() => onTat(aendereBesatzung(world, b.region, wahl).text)}>
          {t(`welle_k5.ui.knopf.${wahl}`, { region: name })} <b>{wechselPk(wahl)}</b>
        </button>
        {gesperrt ? <span className="bz-grund">{gesperrt}</span> : !kapital ? <span className="bz-grund">{t("krieg.besatzung.kapital", { pk: wechselPk(wahl) })}</span> : wahl === "rueckgabe" ? <span>{t("krieg.besatzung.rueckgabe_kurz")}</span> : null}
      </div>
    </div>
  );
}

/** Kleine Linie über drei Jahre: heutige Form grau, gewählte Form in Siegelrot; daneben der Wert nach drei Jahren. */
function Kurve({ titel, a, b, wert, text, max }: { titel: string; a: KurvenPunkt[]; b: KurvenPunkt[]; wert: (p: KurvenPunkt) => number; text: (x: number) => string; max?: number }) {
  const alle = [...a, ...b].map(wert);
  const hi = max ?? Math.max(0, ...alle);
  const lo = max !== undefined ? 0 : Math.min(0, ...alle);
  const spanne = hi - lo || 1;
  const pfad = (k: KurvenPunkt[]) => k.map((p, i) => `${i ? "L" : "M"}${((100 * p.monat) / 36).toFixed(1)},${(38 - (36 * (wert(p) - lo)) / spanne).toFixed(1)}`).join(" ");
  const ende = b.length ? wert(b[b.length - 1]!) : a.length ? wert(a[a.length - 1]!) : 0;
  return (
    <figure className="bz-kurve">
      <figcaption>{titel}</figcaption>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden>
        <path className="a" d={pfad(a)} />
        {b.length > 0 && <path className="b" d={pfad(b)} />}
      </svg>
      <b>{text(ende)}</b>
    </figure>
  );
}

/** Was eine Annexion jetzt brächte, vor dem Klick. */
function Folgen({ landId, v }: { landId: string; v: AnnexionsVorschau }) {
  return (
    <section className="bz-folgen" aria-label={t("welle_k5.ui.folgen")}>
      <h6>{t("welle_k5.ui.folgen")}</h6>
      <dl className="bz-zahlen">
        <div><dt>{t("welle_k5.ui.neue_provinz")}</dt><dd>{v.plaka}</dd></div>
        <div><dt>{t("welle_k5.ui.einwohner")}</dt><dd>+{tausend(v.einwohner)}</dd></div>
        <div><dt>{t("welle_k5.ui.waehler")}</dt><dd>{tausend(v.wahlberechtigte)}<small>{t("welle_k5.ui.ablehnung", { p: zahl(Math.round(v.ablehnung * 100), 0) })}</small></dd></div>
        <div><dt>{t("welle_k5.ui.sitze")}</dt><dd>{zahl(v.sitze, 0)}<small>{t("welle_k5.ui.sitze_ab")}</small></dd></div>
        <div><dt>{t("welle_k5.ui.eingliederung")}</dt><dd>{t("welle_k5.ui.jahre", { n: zahl(v.eingliederungJahre, 1) })}</dd></div>
        <div className="schlecht"><dt>{t("welle_k5.ui.ansehen")}</dt><dd>{vz(v.ansehen, 0)}</dd></div>
      </dl>
      {v.schonLaufend ? (
        <p className="bz-hinweis">{t("welle_k5.ui.schon_laufend")}</p>
      ) : !v.sr && !v.gv ? (
        <p className="bz-hinweis">{t("welle_k5.ui.hatay")}</p>
      ) : (
        <div className="bz-un">
          {v.sr && <UnZeile titel={t("welle_k5.ui.sr_erwartet")} s={v.sr} offen="" sr />}
          {v.gv && <UnZeile titel={t("welle_k5.ui.gv_erwartet")} s={v.gv} offen="" vergleich />}
        </div>
      )}
      {v.stufen.length > 0 && (
        <table className="bz-stufen">
          <caption>{t("welle_k5.ui.stufen", { wer: Object.keys(v.traeger).map((k) => t(`welle_k5.traeger.${k}`)).join(" und ") || t("welle_k5.traeger.keiner") })}</caption>
          <thead><tr><th>{t("welle_k5.ui.st_stufe")}</th><th>{t("welle_k5.ui.st_ab")}</th><th>{t("welle_k5.ui.st_was")}</th><th>{t("welle_k5.ui.st_risiko")}</th><th>{t("welle_k5.ui.st_nachfrage")}</th></tr></thead>
          <tbody>
            {v.stufen.map((s) => (
              <tr key={s.stufe}>
                <td>{s.stufe}</td>
                <td>{datum(s.datum, "monat")}</td>
                <td>{t(`welle_k5.ui.st_name${s.stufe}`)}</td>
                <td>+{zahl(s.risiko, 0)}</td>
                <td>{s.nachfrage ? `−${zahl(s.nachfrage, 1)}` : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {v.stufen.length > 0 && <p className="bz-hinweis">{t("welle_k5.ui.iwf")}</p>}
      {v.ganzerStaat && <p className="bz-hinweis">{t("welle_k5.ui.ganzer_staat", { land: land(landId).name })}</p>}
    </section>
  );
}


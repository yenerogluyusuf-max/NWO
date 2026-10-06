// Der Dienst (MİT) als Spielebene: verdeckte Operationen gegenüber einem Staat anordnen, laufende ansehen und den Bericht lesen.
// Im Bericht steht nur, was der Spieler selbst angeordnet hat oder was aufgedeckt wurde. Die Operationen sind Spielmechanik mit Kosten,
// Dauer, niedriger bis mittlerer Erfolgschance und Aufdeckungsrisiko — nie ein sicherer Sieg.

import { useMemo, useState } from "react";
import type { World } from "../../sim/types";
import { OP_DEFS, EINGEHEND_NAME, dienstSicht, opsOptionen, ordneAn } from "../../sim/welt-dienst";
import { akteurListe, ANZEIGE_GRUPPEN, wahlSicht } from "../../sim/welt-sicht";
import { akteurName } from "../../sim/welt-modell";
import { formatDateDe } from "../../sim/dates";
import { Flagge } from "../art/Flaggen";
import type { Operation } from "../../sim/welt-modell";

import { t } from "../../i18n";
const AUSGANG: Record<string, string> = { erfolg: "Erfolg", fehlschlag: "Fehlschlag", aufgedeckt: "Aufgedeckt", info: "Vermerk" };

export function Dienst({ world, refresh, ziel: start, onLand }: { world: World; refresh: () => void; ziel?: string; onLand: (id: string) => void }) {
  const liste = useMemo(() => akteurListe(), []);
  const [ziel, setZiel] = useState<string>(start ?? "USA");
  const [lager, setLager] = useState<NonNullable<Operation["lager"]>>("herausforderer");
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const sicht = dienstSicht(world);
  const optionen = opsOptionen(world, ziel);
  const wahl = wahlSicht(world, ziel);
  const kapitalOk = world.spiel!.kapital;

  const anordnen = (art: Operation["art"]) => {
    setAntwort(ordneAn(world, art, ziel, art === "kandidat" ? lager : undefined));
    refresh();
  };
  const gegen = () => {
    setAntwort(ordneAn(world, "gegen", ziel));
    refresh();
  };

  return (
    <div className="we-dienst">
      <header className="we-dienst-kopf">
        <h3>{t("ui2.ui.welt.Dienst.e0f3da3")}</h3>
        <p className="subtitle">
          {t("ui.welt.Dienst.3515c0b")}
        </p>
      </header>

      <div className="we-dienst-kapazitaet">
        <div className="we-lagebalken">
          <span>
            {t("ui2.ui.welt.Dienst.df4fa73")}<em>{t("ui2.ui.welt.Dienst.4b66de7", { p0: Math.round(sicht.kapazitaet) })}</em>
          </span>
          <i style={{ ["--w" as string]: `${sicht.kapazitaet}%` }} aria-hidden />
        </div>
        <div className="we-dienst-abwehr">
          {sicht.abwehr > 0 ? <span className="we-chip gut">{t("ui2.ui.welt.Dienst.b89a5d4", { p0: sicht.abwehr })}</span> : <span className="we-chip">{t("ui.welt.Dienst.62d901a")}</span>}
          <button type="button" className="aktion-knopf klein" onClick={gegen} disabled={kapitalOk < OP_DEFS.gegen.pk || sicht.kapazitaet < OP_DEFS.gegen.kap} title={OP_DEFS.gegen.text}>
            {t("ui2.ui.welt.Dienst.c2f1952")} <b>{OP_DEFS.gegen.pk}</b>
          </button>
        </div>
      </div>

      {antwort && (
        <p className={`we-rueck ${antwort.ok ? "ok" : "nein"}`} role="status">
          {antwort.text}
          {antwort.why && <em> {antwort.why}</em>}
        </p>
      )}

      <section className="we-dienst-ziel">
        <label htmlFor="we-ziel">{t("ui2.ui.welt.Dienst.7f3406b")}</label>
        <div className="we-ziel-zeile">
          <Flagge id={ziel} breite={34} />
          <select id="we-ziel" value={ziel} onChange={(e) => { setZiel(e.target.value); setAntwort(null); }}>
            {ANZEIGE_GRUPPEN.map((g) => (
              <optgroup key={g} label={g}>
                {liste.filter((a) => a.gruppe === g).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button type="button" className="link" onClick={() => onLand(ziel)}>
            {t("ui.welt.Dienst.09324d6")}
          </button>
        </div>
        {wahl ? (
          <p className="we-dienst-wahl">
            <b>
              {t("ui2.ui.welt.Dienst.03d2e63", { p0: wahl.art, p1: wahl.datumDe })}
            </b>{" "}
            {t("ui2.ui.welt.Dienst.bd63467", { p0: wahl.monate, p1: wahl.fuehrung.wort })}
            {wahl.herausforderer ? `, Herausforderer: ${wahl.herausforderer.wort} (${wahl.herausforderer.staerke})` : ""}.{" "}
            {wahl.lagebild ? t("ui2.ui.welt.Dienst.dae5ff2", { p0: wahl.lagebild.prozent }) : t("ui2.ui.welt.Dienst.8b6c72f")}
          </p>
        ) : (
          <p className="we-dienst-wahl we-hinweis">{t("ui2.ui.welt.Dienst.afb73cc", { p0: akteurName(ziel) })}</p>
        )}
      </section>

      <ul className="we-ops">
        {optionen.map((o) => (
          <li key={o.def.art} className={`we-op${o.moeglich ? "" : " gesperrt"}`}>
            <div className="we-op-kopf">
              <strong>{o.def.name}</strong>
              <span className="we-chip">{t("ui2.ui.welt.Dienst.fd26502", { p0: o.def.pk })}</span>
              <span className="we-chip">{t("ui2.ui.welt.Dienst.a85d312", { p0: o.def.kap })}</span>
              <span className="we-chip">{t("ui2.ui.welt.Dienst.905dfe8", { p0: o.def.monate })}</span>
            </div>
            <p>{o.def.text}</p>
            <div className="we-op-aussicht">
              <span>
                {t("ui2.ui.welt.Dienst.ee42fd2")} <b className={`aus-${o.aussicht.wort}`}>{o.aussicht.wort}</b>
              </span>
              <span>
                {t("ui2.ui.welt.Dienst.733a033")} <b className={`risiko-${o.aussicht.aufWort.replace(" ", "-")}`}>{o.aussicht.aufWort}</b>
              </span>
            </div>
            <ul className="we-faktoren">
              {o.aussicht.faktoren.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            {o.lager && (
              <div className="we-lager" role="radiogroup" aria-label={t("ui2.ui.welt.Dienst.ec3f7e0")}>
                {o.lager.map((l) => (
                  <label key={l.id}>
                    <input type="radio" name="we-lager" checked={lager === l.id} onChange={() => setLager(l.id)} /> {l.label}
                  </label>
                ))}
              </div>
            )}
            <div className="we-op-fuss">
              <button type="button" className="aktion-knopf" disabled={!o.moeglich} onClick={() => anordnen(o.def.art)}>
                {t("ui2.ui.welt.Dienst.d53a9d4")}
              </button>
              {!o.moeglich && <span className="we-hinweis">{o.grund}</span>}
            </div>
          </li>
        ))}
      </ul>

      {sicht.laufend.length > 0 && (
        <section className="we-dienst-laufend">
          <b>{t("ui2.ui.welt.Dienst.b6d953d")}</b>
          <ul>
            {sicht.laufend.map((l) => (
              <li key={l.op.id}>
                <Flagge id={l.ziel} breite={26} /> <strong>{l.name}</strong> {t("ui2.ui.welt.Dienst.f6581a2", { p0: akteurName(l.ziel), p1: Math.max(1, Math.round(l.restTage / 30)) })}
              </li>
            ))}
          </ul>
        </section>
      )}

      {sicht.aufgedeckteFremde.length > 0 && (
        <section className="we-dienst-fremd">
          <b>{t("ui.welt.Dienst.4377a99")}</b>
          <ul>
            {sicht.aufgedeckteFremde.map((f, i) => (
              <li key={i}>
                <Flagge id={f.von} breite={26} /> {EINGEHEND_NAME[f.art]} — {akteurName(f.von)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="we-dienst-bericht">
        <b>{t("ui.welt.Dienst.84dfd2a")}</b>
        {sicht.bericht.length === 0 ? (
          <p className="we-hinweis">{t("ui.welt.Dienst.5419971")}</p>
        ) : (
          <ul>
            {sicht.bericht.slice(0, 12).map((b, i) => (
              <li key={`${b.tag}-${i}`} className={`ausgang-${b.ausgang}`}>
                <span className="we-datum">{formatDateDe(b.datum)}</span> <span className={`we-chip ausgang-${b.ausgang}`}>{AUSGANG[b.ausgang]}</span> <strong>{b.titel}</strong>
                <br />
                <span>{b.text}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

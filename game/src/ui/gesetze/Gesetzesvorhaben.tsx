// Gesetzesvorhaben als Karten: Was es ist, wer dafür und wer dagegen ist, was es kostet und ob die Mehrheit steht.
// Eine Entscheidung je Karte: Fassung wählen (scharf, Kompromiss, verwässert), dann Parlament oder Erlass. Die Abstimmung selbst
// erscheint als kurzer Auftritt (ui/parlament/AbstimmungsKarte.tsx), die Folgen im Protokoll und in der Zeitung.

import { useState } from "react";
import { t } from "../../i18n";
import { FASSUNGEN, type FassungId } from "../../data/gesetzesvorhaben";
import { bringeVorhabenEin, gesetzesTisch, GESETZGEBUNG, laufendeVerfahren, type LagerEintrag, type VorhabenSicht } from "../../sim/gesetzgebung";
import type { World } from "../../sim/types";
import { Uebersicht, UbDetailKopf, UbRueck, type UbKachel } from "../akte/Uebersicht";
import "./gesetze.css";

function Lager({ titel, liste, art }: { titel: string; liste: LagerEintrag[]; art: "fuer" | "gegen" }) {
  if (!liste.length) return null;
  return (
    <div className={`gv-lager ${art}`}>
      <span className="gv-lager-titel">{titel}</span>
      <ul>
        {liste.map((e) => (
          <li key={`${e.art}-${e.id}`} className={e.art} title={e.sitze !== undefined ? t("gesetz.ui.sitze", { n: e.sitze }) : undefined}>
            {e.name}
            {e.art === "partner" && <em>{t("gesetz.ui.partner")}</em>}
            {e.art === "eigene" && <em>{t("gesetz.ui.eigene")}</em>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Mehrheit({ ja, urteil }: { ja: number; urteil: "sicher" | "knapp" | "verloren" }) {
  const anteil = Math.max(0, Math.min(1, ja / 600));
  return (
    <div className={`gv-mehrheit ${urteil}`}>
      <div className="gv-balken" aria-hidden="true">
        <span style={{ width: `${anteil * 100}%` }} />
        <i style={{ left: "50.17%" }} />
      </div>
      <span>
        {t("gesetz.ui.stimmen", { ja })} · <b>{t(`gesetz.ui.urteil.${urteil}`)}</b>
      </span>
    </div>
  );
}

function Karte({ s, world, onGetan }: { s: VorhabenSicht; world: World; onGetan: () => void }) {
  const [fassung, setFassung] = useState<FassungId>("kompromiss");
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string } | null>(null);
  const f = s.fassungen[fassung];
  const haushalt = Math.abs(f.kostenBip) < 0.005 ? t("gesetz.ui.haushaltNull") : f.kostenBip > 0 ? t("gesetz.ui.haushaltKostet", { x: f.kostenBip }) : t("gesetz.ui.haushaltBringt", { x: -f.kostenBip });
  const handle = (weg: "gesetz" | "erlass") => {
    const r = bringeVorhabenEin(world, s.def.id, fassung, weg);
    setAntwort({ ok: r.ok, text: r.text });
    if (r.ok) onGetan();
  };
  const partnerGegen = s.lager.gegen.filter((e) => e.art === "partner").map((e) => e.name);
  const status = s.imParlament ? t("gesetz.ui.abstimmungIn", { tage: s.imParlament.tage }) : s.gericht ? t("gesetz.ui.urteilIn", { tage: s.gericht.tage, p: Math.round(s.gericht.p * 100) }) : s.ruhtTage ? t("gesetz.ui.ruht", { tage: s.ruhtTage }) : undefined;
  return (
    <article className={`gv-karte gv-im-detail${s.imParlament || s.gericht ? " laeuft" : ""}`}>
      <UbDetailKopf titel={s.titel} unter={s.anlass ? t(`gesetz.ui.anlass.${s.anlass}`) : undefined} text={s.satz} />
      <div className="gv-lagerzeile">
        <Lager titel={t("gesetz.ui.dafuer")} liste={s.lager.fuer} art="fuer" />
        <Lager titel={t("gesetz.ui.dagegen")} liste={s.lager.gegen} art="gegen" />
      </div>
      {partnerGegen.length > 0 && !status && <p className="gv-warnung">{t("gesetz.ui.partnerWarnung", { parteien: partnerGegen })}</p>}
      {status ? (
        <p className="gv-status">{status}</p>
      ) : (
        <>
          <div className="gv-fassungen" role="radiogroup" aria-label={s.titel}>
            {FASSUNGEN.map((id) => (
              <button key={id} type="button" role="radio" aria-checked={fassung === id} className={fassung === id ? "on" : ""} onClick={() => setFassung(id)} title={t(`gesetz.fassung.${id}.hinweis`)}>
                {t(`gesetz.fassung.${id}`)}
              </button>
            ))}
          </div>
          <p className="gv-hinweis">{fassung === "kompromiss" ? s.kompromiss : t(`gesetz.fassung.${fassung}.hinweis`)}</p>
          <div className="gv-preis">
            <b>{t("gesetz.ui.kapital", { pk: f.pk })}</b>
            <span>{haushalt}</span>
            <span>{t("gesetz.ui.stufe", { von: s.stufe, nach: f.ziel })}</span>
            <span>{t("gesetz.ui.monate", { n: f.monate })}</span>
          </div>
          <Mehrheit ja={f.ja} urteil={f.urteil} />
          {f.klageP > 0 && <p className="gv-risiko">{t("gesetz.ui.klageRisiko", { p: Math.round(f.klageP * 100) })}</p>}
          <div className="gv-knoepfe">
            <button type="button" className="gv-knopf primary" disabled={!f.moeglich || !f.bezahlbar} onClick={() => handle("gesetz")}>
              {t("gesetz.ui.einbringen", { pk: f.pk })}
            </button>
            {f.erlass && (
              <button type="button" className="gv-knopf" disabled={!f.moeglich || !f.erlass.bezahlbar} onClick={() => handle("erlass")} title={f.erlass.gerichtP > 0 ? t("gesetz.ui.erlassRisiko", { p: Math.round(f.erlass.gerichtP * 100) }) : t("gesetz.ui.erlassUnangefochten")}>
                {t("gesetz.ui.erlass", { pk: f.erlass.pk })}
                <small>{f.erlass.gerichtP > 0 ? t("gesetz.ui.erlassRisiko", { p: Math.round(f.erlass.gerichtP * 100) }) : t("gesetz.ui.erlassUnangefochten")}</small>
              </button>
            )}
          </div>
          {f.grund && <p className="gv-grund">{f.grund}</p>}
        </>
      )}
      <UbRueck antwort={antwort} />
    </article>
  );
}

export function Gesetzesvorhaben({ world, refresh }: { world: World; refresh: () => void }) {
  const [, setZaehler] = useState(0);
  const tisch = gesetzesTisch(world);
  const verfahren = laufendeVerfahren(world);
  const getan = () => {
    setZaehler((z) => z + 1);
    refresh();
  };
  const kacheln: UbKachel[] = tisch.map((s, i): UbKachel => {
    const f = s.fassungen.kompromiss;
    const laeuft = s.imParlament ? t("gesetz.ui.kurz.parlament", { tage: s.imParlament.tage }) : s.gericht ? t("gesetz.ui.kurz.gericht", { tage: s.gericht.tage }) : s.ruhtTage ? t("gesetz.ui.kurz.ruht", { tage: s.ruhtTage }) : undefined;
    return {
      id: s.def.id,
      gruppe: i < GESETZGEBUNG.vorn ? t("gesetz.ui.tisch") : t("gesetz.ui.weitere"),
      titel: s.titel,
      wert: t(`gesetz.ui.urteil.${f.urteil}`),
      wertLabel: t("gesetz.ui.stimmen", { ja: f.ja }),
      zeile: s.satz,
      ...(laeuft
        ? { marke: { text: laeuft, ton: "aktiv" as const } }
        : s.anlass
          ? { marke: { text: t(`gesetz.ui.anlass.${s.anlass}`), ton: "mittel" as const } }
          : {}),
      ton: laeuft ? "aktiv" : f.urteil === "sicher" ? "gut" : f.urteil === "knapp" ? "mittel" : "schlecht",
    };
  });
  const lage =
    verfahren.parlament.length + verfahren.gericht.length > 0
      ? [
          ...verfahren.parlament.map((v) => t("gesetz.ui.lage.parlament", { titel: v.titel, tage: v.tage, ja: v.ja })),
          ...verfahren.gericht.map((v) => t("gesetz.ui.lage.gericht", { titel: v.titel, tage: v.tage, p: Math.round(v.p * 100) })),
        ].join(" · ")
      : t("gesetz.ui.zweck");
  return (
    <div className="gv">
      <Uebersicht
        aria={t("gesetz.ui.tisch")}
        sortiert={false}
        lage={lage}
        zahlen={[
          { label: t("gesetz.ui.imParlament"), wert: String(verfahren.parlament.length), ton: verfahren.parlament.length ? "aktiv" : "neutral" },
          { label: t("gesetz.ui.beimGericht"), wert: String(verfahren.gericht.length), ton: verfahren.gericht.length ? "mittel" : "neutral" },
        ]}
        kacheln={kacheln}
        detail={(id) => {
          const s = tisch.find((x) => x.def.id === id);
          return s ? <Karte key={id} s={s} world={world} onGetan={getan} /> : null;
        }}
      />
    </div>
  );
}

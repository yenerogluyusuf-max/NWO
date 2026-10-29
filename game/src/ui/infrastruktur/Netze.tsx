// Die Netze des Landes: Auslastung je Netz, die größten Engpässe, Ausbau mit Preis und Dauer, Großinvestitionsprogramme.
// Gebaut wird über die Vorhaben des Reiches (sim/infrastruktur.ts legt sie an); diese Ansicht zeigt nur Lage und Angebot.

import { useMemo, useState } from "react";
import { t } from "../../i18n";
import {
  AUSBAUTEN,
  PAKETE,
  ausbauAngebot,
  finanzierung,
  investiere,
  netzSichten,
  paketAngebot,
  starteProgramm,
  type NetzId,
} from "../../sim/infrastruktur";
import { SCHWELLE } from "../../data/infrastruktur-netze";
import { VERGABE_NAMEN, type Vergabe } from "../../sim/reich-typen";
import type { World } from "../../sim/types";
import { Uebersicht, UbDetailKopf, UbHandlung, UbRueck, type UbKachel } from "../akte/Uebersicht";
import "./netze.css";

const prozent = (a: number): string => `${Math.round(a * 100)} %`;
const ton = (a: number): "gut" | "mittel" | "schlecht" => (a >= SCHWELLE.ueberlast ? "schlecht" : a >= SCHWELLE.voll ? "mittel" : "gut");

/** Balken der Auslastung: Füllung bis zum Wert, Marken bei „ausgelastet“ und „überlastet“ (Skala bis 140 %). */
function Balken({ a, start }: { a: number; start?: number }) {
  const breite = (x: number) => `${Math.min(100, (x / 1.4) * 100)}%`;
  return (
    <span className={`nz-balken nz-${ton(a)}`} aria-hidden>
      <i style={{ width: breite(a) }} />
      <b style={{ left: breite(SCHWELLE.voll) }} />
      <b className="nz-voll" style={{ left: breite(SCHWELLE.ueberlast) }} />
      {start !== undefined && <u style={{ left: breite(start) }} title={t("infra.ui.start")} />}
    </span>
  );
}

export function Netze({ world: w, onGeaendert }: { world: World; onGeaendert?: () => void }) {
  const [vergabe, setVergabe] = useState<Vergabe>("ausschreibung");
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [stand, setStand] = useState(0);
  const sichten = useMemo(() => (w.spiel ? netzSichten(w) : []), [w, w.day, stand]);
  if (!w.spiel) return null;
  const leerKosten = w.spiel.infrastruktur?.leerKosten ?? 0;
  const fin = finanzierung(w);
  const fertig = (r: { ok: boolean; text: string }) => {
    setMeldung({ ok: r.ok, text: r.ok ? t("infra.ui.begonnen", { text: r.text }) : r.text });
    setStand((x) => x + 1);
    if (r.ok) onGeaendert?.();
  };
  const ueber = sichten.filter((x) => ton(x.mittel) === "schlecht").length;
  const laufendGesamt = sichten.reduce((n, x) => n + x.laufend, 0);
  const vergabeWahl = (
    <label className="nz-vergabe">
      {t("infra.ui.vergabe")}{" "}
      <select value={vergabe} onChange={(e) => setVergabe(e.target.value as Vergabe)}>
        {(Object.keys(VERGABE_NAMEN) as Vergabe[]).map((v) => (
          <option key={v} value={v}>
            {VERGABE_NAMEN[v]}
          </option>
        ))}
      </select>
    </label>
  );
  const kacheln: UbKachel[] = [
    ...sichten.map((x): UbKachel => {
      const tn = ton(x.mittel);
      const top = x.engpaesse[0];
      return {
        id: x.id,
        gruppe: t("infra.ui.gruppe_netze"),
        titel: x.name,
        wert: prozent(x.mittel),
        wertLabel: t("infra.ui.auslastung_kurz"),
        anteil: Math.min(1, x.mittel / 1.4),
        ton: x.laufend ? "aktiv" : tn,
        ...(top && !x.land ? { zeile: t("infra.ui.engpass", { ort: top.name, a: Math.round(top.a * 100) }) } : {}),
        ...(x.laufend ? { marke: { text: t("infra.ui.laufend", { n: x.laufend }), ton: "aktiv" as const } } : tn === "schlecht" ? { marke: { text: t("infra.ui.ueberlastet"), ton: "schlecht" as const } } : {}),
        rang: tn === "schlecht" ? 2 : tn === "mittel" ? 1 : 0,
      };
    }),
    ...PAKETE.map((p): UbKachel => {
      const an = paketAngebot(w, p.id, vergabe);
      return {
        id: `paket:${p.id}`,
        gruppe: t("infra.ui.programme"),
        titel: t(`infra.paket.${p.id}.name`),
        ...(an.ok ? { wert: t("ub.preis.kapital", { n: an.pk ?? 0 }), zeile: t("infra.ui.paket.kurz", { n: an.provinzen.length, monate: an.monate ?? 0 }) } : { zeile: an.grund ?? "" }),
        ton: an.ok ? "neutral" : "neutral",
        rang: -1,
      };
    }),
  ];
  const detail = (id: string) => {
    if (id.startsWith("paket:")) {
      const p = PAKETE.find((x) => `paket:${x.id}` === id)!;
      const an = paketAngebot(w, p.id, vergabe);
      return (
        <>
          <UbDetailKopf titel={t(`infra.paket.${p.id}.name`)} text={t(`infra.paket.${p.id}.text`)} />
          <UbRueck antwort={meldung} />
          {vergabeWahl}
          <UbHandlung
            titel={t("infra.ui.paket.start")}
            ok={an.ok}
            grund={an.grund}
            satz={an.ok ? t("infra.ui.paket.preis", { n: an.provinzen.length, pk: an.pk ?? 0, einzeln: an.einzelnPk ?? 0, monate: an.monate ?? 0, risiko: Math.round(p.ueberzug.p * 100) }) : undefined}
            preis={an.ok ? [t("ub.preis.kapital", { n: an.pk ?? 0 }), t("ub.preis.monate", { n: an.monate ?? 0 })] : undefined}
            onTun={() => fertig(starteProgramm(w, p.id, vergabe))}
          />
        </>
      );
    }
    const x = sichten.find((n) => n.id === id);
    if (!x) return null;
    return (
      <>
        <UbDetailKopf titel={x.name} unter={`${t("infra.ui.auslastung_kurz")} ${prozent(x.mittel)}${x.laufend ? ` · ${t("infra.ui.laufend", { n: x.laufend })}` : ""}`} />
        <Balken a={x.mittel} start={x.start} />
        <UbRueck antwort={meldung} />
        {vergabeWahl}
        <h5 className="ub-dabschnitt">{t("infra.ui.engpaesse")}</h5>
        <table className="nz-tabelle">
          <tbody>
            {x.engpaesse.map((e) => (
              <tr key={e.plaka}>
                <th scope="row">{e.name}</th>
                <td className={`nz-${ton(e.a)}`}>{prozent(e.a)}</td>
                <td>
                  {AUSBAUTEN.filter((a) => a.netz === x.id).map((a) => {
                    const an = ausbauAngebot(w, a.id, e.plaka, vergabe);
                    return (
                      <button
                        key={a.id}
                        className="nz-knopf"
                        disabled={!an.ok}
                        title={an.ok ? t("infra.ui.angebot", { pk: an.pk ?? 0, monate: an.monate ?? 0, vorher: Math.round((an.vorher ?? 0) * 100), nachher: Math.round((an.nachher ?? 0) * 100) }) : an.grund}
                        onClick={() => fertig(investiere(w, a.id, e.plaka, vergabe))}
                      >
                        {t(`infra.ausbau.${a.id}.name`)}
                        {an.ok && <small>{t("infra.ui.preis", { pk: an.pk ?? 0, monate: an.monate ?? 0 })}</small>}
                      </button>
                    );
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  };
  return (
    <div className="nz">
      <Uebersicht
        aria={t("infra.ui.gruppe_netze")}
        lage={
          <>
            {t(`infra.ui.etat.${fin.quelle}`, { stufe: fin.stufe > 0 ? `+${fin.stufe}` : String(fin.stufe) })}{" "}
            {fin.stufe !== 0 && t("infra.ui.etat.wirkung", { pk: Math.round((1 - fin.pk) * 100), schulden: Math.round((1 - fin.schulden) * 100) })}
            {leerKosten > 0 && <> {t("infra.ui.leer", { x: Math.round(leerKosten * 1200) / 100 })}</>}
          </>
        }
        zahlen={[
          { label: t("infra.ui.zahl_ueber"), wert: String(ueber), ton: ueber ? "schlecht" : "gut" },
          { label: t("infra.ui.zahl_laufend"), wert: String(laufendGesamt), ton: laufendGesamt ? "aktiv" : "neutral" },
        ]}
        kacheln={kacheln}
        detail={detail}
      />
    </div>
  );
}

/** Die eine Zeile für die Land-Akte: größter Engpass und laufende Ausbauten (Fork AKTEN baut die Hülle). */
export function NetzeZeile({ world: w }: { world: World }) {
  if (!w.spiel) return null;
  const s = netzSichten(w);
  const top = s.flatMap((x) => (x.land ? [] : x.engpaesse.slice(0, 1).map((e) => ({ netz: x.name, ...e })))).sort((a, b) => b.a - a.a)[0];
  const laufend = s.reduce((n, x) => n + x.laufend, 0);
  return <span className="nz-zeile">{top ? t("infra.ui.zeile", { netz: top.netz, ort: top.name, a: Math.round(top.a * 100), n: laufend }) : ""}</span>;
}

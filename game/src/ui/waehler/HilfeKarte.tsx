// Ein konkreter Schritt mit Kosten und der Wirkung aus der Vorschau, die das ganze Modell durchrechnet (E-4, befund-E).
// Die schnelle Schätzung des Politiknetzes (sim/waehler-detail.ts) sortiert nur vor; jede Zahl auf der Karte stammt aus derselben Vorschau
// wie die Tabelle darunter: acht Modellläufe mit und ohne den Schritt, mit Zufall und den Rückwirkungen über die Wirtschaft.

import { useEffect, useState } from "react";
import type { World } from "../../sim/types";
import type { Hilfe } from "../../sim/waehler-detail";
import type { Metric, Outlook } from "../../sim/forecast";
import { GRUPPEN } from "../../sim/gruppen";
import { NET } from "../../sim/modell";
import { berechneVorschau } from "../vorschau";
import { tunSatz } from "../../data/skalen";
import { nf, vz } from "./format";

import { t } from "../../i18n";
interface Zeile {
  name: string;
  ohne: number;
  mit: number;
  von: number;
  bis: number;
  hochIstGut: boolean;
}

interface Ergebnis {
  monate: number;
  zustimmung: { d: number; von: number; bis: number };
  /** Gruppen mit spürbarer Wirkung (mindestens 0,3 Punkte), nach Betrag */
  gruppen: { id: string; name: string; d: number }[];
  zeilen: Zeile[];
}

const LAEUFE = 8;

/** Monate der Vorschau: zwölf, oder bis zur Wahl, wenn sie früher ist. */
export function vorschauMonate(world: World): number {
  const bis = Math.round(((world.spiel?.wahltag ?? world.day + 400) - world.day) / 30.4);
  return Math.max(1, Math.min(12, bis));
}

/**
 * `ziel`: die Gruppe, um die es geht; ohne Ziel geht es um die Zustimmung insgesamt.
 * Mit Web Worker rechnet die Karte die Vorschau von selbst (im Hintergrund, nacheinander); ohne Worker (Tests) auf Knopfdruck.
 */
export function HilfeKarte({ h, world, ziel, onMassnahme }: { h: Hilfe; world: World; ziel: { id: string; name: string } | null; onMassnahme?: (id: string, richtung: 1 | -1) => void }) {
  const [vor, setVor] = useState<{ laeuft: boolean; e?: Ergebnis; fehler?: string }>({ laeuft: false });
  const monate = vorschauMonate(world);
  async function rechne() {
    setVor({ laeuft: true });
    try {
      const gruppen = GRUPPEN.map((g) => ({ m: `net:${g.id}` as Metric, id: g.id, name: NET.nodes[NET.index.get(g.id)!]!.name }));
      const feste: { m: Metric; name: string; hoch: boolean }[] = [
        { m: "zustimmung", name: t("nacht_n2.hilfe.zustimmung_zeile"), hoch: true },
        { m: "net:vertrauen_regierung", name: t("hk.vertrauen"), hoch: true },
        { m: "inflation", name: t("hk.inflation"), hoch: false },
        { m: "unemployment", name: t("hk.arbeitslosigkeit"), hoch: false },
      ];
      const outs: Outlook[] = await berechneVorschau(world, { art: "massnahme", id: h.massnahme, stufe: h.auf }, [...feste.map((x) => x.m), ...gruppen.map((g) => g.m)], monate, LAEUFE);
      const wirk = (o: Outlook) => ({ d: o.effect, von: o.effectRange?.low ?? o.effect, bis: o.effectRange?.high ?? o.effect });
      const zg = gruppen.map((g, i) => ({ id: g.id, name: g.name, d: outs[feste.length + i]!.effect })).filter((g) => Math.abs(g.d) >= 0.3).sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
      const zeile = (o: Outlook, name: string, hoch: boolean): Zeile => ({ name, ohne: o.withoutAction.mid, mit: o.withAction.mid, von: o.withAction.low, bis: o.withAction.high, hochIstGut: hoch });
      const zielZeile = ziel ? gruppen.findIndex((g) => g.id === ziel.id) : -1;
      setVor({
        laeuft: false,
        e: {
          monate,
          zustimmung: wirk(outs[0]!),
          gruppen: zg,
          zeilen: [...(zielZeile >= 0 ? [zeile(outs[feste.length + zielZeile]!, ziel!.name, true)] : []), ...feste.map((f, i) => zeile(outs[i]!, f.name, f.hoch))],
        },
      });
    } catch (e) {
      setVor({ laeuft: false, fehler: e instanceof Error ? e.message : t("hk.fehler") });
    }
  }
  // Mit Worker gleich rechnen: Die Karte zeigt nur Zahlen der Vorschau, keine zweite, widersprüchliche Schätzung
  useEffect(() => {
    if (typeof Worker !== "undefined") void rechne();
  }, [h.massnahme, h.auf, world.date.slice(0, 7)]); // eslint-disable-line react-hooks/exhaustive-deps
  const e = vor.e;
  const gruppeZiel = e && ziel ? e.gruppen.find((g) => g.id === ziel.id) : undefined;
  const andere = e ? e.gruppen.filter((g) => g.id !== ziel?.id) : [];
  const gewinner = andere.filter((g) => g.d > 0).slice(0, 3);
  const verlierer = andere.filter((g) => g.d < 0).slice(0, 3);
  return (
    <li className="wa-hilfe">
      <div className="wa-hilfe-kopf">
        <strong>
          {tunSatz(h.massnahme, h.richtung, h.name)}
          <span> {t("hk.vonAuf", { von: Math.round(h.von), auf: h.auf })}</span>
        </strong>
        <span className="wa-hilfe-kosten">{t("hk.kapital", { pk: h.pk })}</span>
      </div>
      {e ? (
        <>
          <p className="wa-hilfe-wirkung">
            {ziel && (
              <>
                <b className={(gruppeZiel?.d ?? 0) >= 0 ? "gut" : "schlecht"}>{t("nacht_n2.hilfe.gruppe", { name: ziel.name, d: vz(gruppeZiel?.d ?? 0) })}</b>
                {" · "}
              </>
            )}
            <b className={e.zustimmung.d >= 0 ? "gut" : "schlecht"}>
              {t("nacht_n2.hilfe.zustimmung", { m: e.monate, d: vz(e.zustimmung.d), von: vz(e.zustimmung.von), bis: vz(e.zustimmung.bis) })}
            </b>
          </p>
          {(gewinner.length > 0 || verlierer.length > 0) && (
            <p className="wa-hilfe-neben">
              {gewinner.length > 0 && <span className="gut">{t("hk.zugleich", { liste: gewinner.map((g) => `${g.name} ${vz(g.d)}`).join(", ") })} </span>}
              {verlierer.length > 0 && <span className="schlecht">{t("hk.veraergert", { liste: verlierer.map((g) => `${g.name} ${vz(g.d)}`).join(", ") })}</span>}
            </p>
          )}
        </>
      ) : (
        <p className="wa-hilfe-wirkung wa-hilfe-rechnet">{vor.laeuft ? t("nacht_n2.hilfe.rechnet", { m: monate }) : t("nacht_n2.hilfe.grob")}</p>
      )}
      <p className="wa-hilfe-fuss">
        {t("hk.kosten", { bip: vz(h.kostenBip, 2), m: h.monate })}
        {h.mehrheitFehlt ? " · " + t("hk.mehrheitFehlt") : ""}
        {!h.moeglich && h.grund ? ` · ${h.grund}` : ""}
      </p>
      <div className="wa-hilfe-knoepfe">
        <button type="button" className="pd-btn primary" onClick={() => onMassnahme?.(h.massnahme, h.richtung)}>
          {t("ui.waehler.HilfeKarte.fa37717")}
        </button>
        {!e && !vor.laeuft && (
          <button type="button" className="pd-btn" onClick={rechne}>
            {t("nacht_n2.hilfe.rechnen")}
          </button>
        )}
      </div>
      {e && (
        <details className="wa-vorschau-zu">
          <summary>{t("nacht_n2.hilfe.tabelle")}</summary>
          <table className="wa-vorschau" aria-label={t("ui.waehler.HilfeKarte.144ef13")}>
            <thead>
              <tr>
                <th />
                <th>{t("hk.ohne")}</th>
                <th>{t("ui.waehler.HilfeKarte.8033433")}</th>
                <th>{t("hk.unterschied")}</th>
              </tr>
            </thead>
            <tbody>
              {e.zeilen.map((z) => (
                <tr key={z.name}>
                  <th>{z.name}</th>
                  <td>{nf(z.ohne)}</td>
                  <td>
                    <b>{nf(z.mit)}</b> <em>({t("hk.spanne", { von: nf(z.von), bis: nf(z.bis) })})</em>
                  </td>
                  <td className={Math.abs(z.mit - z.ohne) < 0.05 ? "" : (z.mit - z.ohne > 0) === z.hochIstGut ? "gut" : "schlecht"}>
                    <b>{vz(z.mit - z.ohne)}</b>
                  </td>
                </tr>
              ))}
            </tbody>
            <caption>{t("ui.waehler.HilfeKarte.2079c15")}</caption>
          </table>
        </details>
      )}
      {vor.fehler && <p className="wa-leer schlecht">{vor.fehler}</p>}
    </li>
  );
}

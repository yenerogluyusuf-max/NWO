// Ein konkreter Schritt mit Wirkung, Nebenwirkungen und Kosten, dazu eine Vorschau, die das ganze Modell durchrechnet.

import { useState } from "react";
import type { World } from "../../sim/types";
import type { Hilfe } from "../../sim/waehler-detail";
import type { Outlook } from "../../sim/forecast";
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

/**
 * `ziel`: die Gruppe, um die es geht; ohne Ziel geht es um die Zustimmung insgesamt (die Gruppe, die am meisten gewinnt, steht dann in der Vorschau).
 */
export function HilfeKarte({ h, world, ziel, onMassnahme }: { h: Hilfe; world: World; ziel: { id: string; name: string } | null; onMassnahme?: (id: string, richtung: 1 | -1) => void }) {
  const [vor, setVor] = useState<{ laeuft: boolean; zeilen?: Zeile[]; fehler?: string }>({ laeuft: false });
  const gruppe = ziel ?? (h.hauptgruppe ? { id: h.hauptgruppe.id, name: h.hauptgruppe.name } : null);
  async function rechne() {
    setVor({ laeuft: true });
    try {
      const metriken: { m: `net:${string}` | "inflation" | "unemployment"; name: string; hoch: boolean }[] = [];
      if (gruppe) metriken.push({ m: `net:${gruppe.id}`, name: gruppe.name, hoch: true });
      metriken.push({ m: "net:vertrauen_regierung", name: t("hk.vertrauen"), hoch: true }, { m: "inflation", name: t("hk.inflation"), hoch: false }, { m: "unemployment", name: t("hk.arbeitslosigkeit"), hoch: false });
      const outs: Outlook[] = await berechneVorschau(world, { art: "massnahme", id: h.massnahme, stufe: h.auf }, metriken.map((x) => x.m), 12, 8);
      setVor({
        laeuft: false,
        zeilen: outs.map((o, i) => ({ name: metriken[i]!.name, ohne: o.withoutAction.mid, mit: o.withAction.mid, von: o.withAction.low, bis: o.withAction.high, hochIstGut: metriken[i]!.hoch })),
      });
    } catch (e) {
      setVor({ laeuft: false, fehler: e instanceof Error ? e.message : t("hk.fehler") });
    }
  }
  return (
    <li className="wa-hilfe">
      <div className="wa-hilfe-kopf">
        <strong>
          {tunSatz(h.massnahme, h.richtung, h.name)}
          <span> {t("hk.vonAuf", { von: Math.round(h.von), auf: h.auf })}</span>
        </strong>
        <span className="wa-hilfe-kosten">{t("hk.kapital", { pk: h.pk })}</span>
      </div>
      {ziel ? (
        <p className="wa-hilfe-wirkung">
          <b className="gut">{ziel.name} {vz(h.gewinn)}</b> {t("hk.bisWahl", { j: vz(h.nach12), l: vz(h.langfristig) })} {t("hk.insgesamt")} <b className={h.zustimmung >= 0 ? "gut" : "schlecht"}>{vz(h.zustimmung)}</b> {t("hk.punkte")}
        </p>
      ) : (
        <p className="wa-hilfe-wirkung">
          <b className="gut">{t("hk.zustimmungPunkte", { d: vz(h.gewinn) })}</b> {t("hk.bisWahl", { j: vz(h.nach12), l: vz(h.langfristig) })}
          {h.hauptgruppe && <> {t("hk.amMeisten", { name: h.hauptgruppe.name, d: vz(h.hauptgruppe.punkte) })}</>}
        </p>
      )}
      {(h.gewinner.filter((g) => g.id !== ziel?.id && g.id !== h.hauptgruppe?.id).length > 0 || h.verlierer.length > 0) && (
        <p className="wa-hilfe-neben">
          {h.gewinner.filter((g) => g.id !== ziel?.id && g.id !== h.hauptgruppe?.id).length > 0 && (
            <span className="gut">
              {t("hk.zugleich", { liste: h.gewinner.filter((g) => g.id !== ziel?.id && g.id !== h.hauptgruppe?.id).map((g) => `${g.name} ${vz(g.punkte)}`).join(", ") })}{" "}
            </span>
          )}
          {h.verlierer.length > 0 && <span className="schlecht">{t("hk.veraergert", { liste: h.verlierer.map((g) => `${g.name} ${vz(g.punkte)}`).join(", ") })}</span>}
        </p>
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
        <button type="button" className="pd-btn" onClick={rechne} disabled={vor.laeuft}>
          {vor.laeuft ? t("hk.rechne") : t("hk.vorschau")}
        </button>
      </div>
      {vor.zeilen && (
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
            {vor.zeilen.map((z) => (
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
      )}
      {vor.fehler && <p className="wa-leer schlecht">{vor.fehler}</p>}
    </li>
  );
}

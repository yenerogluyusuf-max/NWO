// Ein konkreter Schritt mit Wirkung, Nebenwirkungen und Kosten, dazu eine Vorschau, die das ganze Modell durchrechnet.

import { useState } from "react";
import type { World } from "../../sim/types";
import type { Hilfe } from "../../sim/waehler-detail";
import type { Outlook } from "../../sim/forecast";
import { berechneVorschau } from "../vorschau";
import { tunWort } from "../../data/skalen";
import { nf, vz } from "./format";

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
      metriken.push({ m: "net:vertrauen_regierung", name: "Vertrauen in die Regierung", hoch: true }, { m: "inflation", name: "Inflation (Prozent)", hoch: false }, { m: "unemployment", name: "Arbeitslosigkeit (Prozent)", hoch: false });
      const outs: Outlook[] = await berechneVorschau(world, { art: "massnahme", id: h.massnahme, stufe: h.auf }, metriken.map((x) => x.m), 12, 8);
      setVor({
        laeuft: false,
        zeilen: outs.map((o, i) => ({ name: metriken[i]!.name, ohne: o.withoutAction.mid, mit: o.withAction.mid, von: o.withAction.low, bis: o.withAction.high, hochIstGut: metriken[i]!.hoch })),
      });
    } catch (e) {
      setVor({ laeuft: false, fehler: e instanceof Error ? e.message : "Die Vorschau ist fehlgeschlagen." });
    }
  }
  return (
    <li className="wa-hilfe">
      <div className="wa-hilfe-kopf">
        <strong>
          {h.name} {tunWort(h.massnahme, h.richtung)}
          <span> von {Math.round(h.von)} auf {h.auf}</span>
        </strong>
        <span className="wa-hilfe-kosten">{h.pk} Kapital</span>
      </div>
      {ziel ? (
        <p className="wa-hilfe-wirkung">
          <b className="gut">{ziel.name} {vz(h.gewinn)}</b> bis zur Wahl (nach einem Jahr {vz(h.nach12)}, langfristig {vz(h.langfristig)}). Ihre Zustimmung insgesamt: <b className={h.zustimmung >= 0 ? "gut" : "schlecht"}>{vz(h.zustimmung)}</b> Punkte.
        </p>
      ) : (
        <p className="wa-hilfe-wirkung">
          <b className="gut">Zustimmung {vz(h.gewinn)} Punkte</b> bis zur Wahl (nach einem Jahr {vz(h.nach12)}, langfristig {vz(h.langfristig)}).
          {h.hauptgruppe && <> Am meisten gewinnt {h.hauptgruppe.name} ({vz(h.hauptgruppe.punkte)}).</>}
        </p>
      )}
      {(h.gewinner.filter((g) => g.id !== ziel?.id && g.id !== h.hauptgruppe?.id).length > 0 || h.verlierer.length > 0) && (
        <p className="wa-hilfe-neben">
          {h.gewinner.filter((g) => g.id !== ziel?.id && g.id !== h.hauptgruppe?.id).length > 0 && (
            <span className="gut">
              Zugleich besser: {h.gewinner.filter((g) => g.id !== ziel?.id && g.id !== h.hauptgruppe?.id).map((g) => `${g.name} ${vz(g.punkte)}`).join(", ")}.{" "}
            </span>
          )}
          {h.verlierer.length > 0 && <span className="schlecht">Verärgert: {h.verlierer.map((g) => `${g.name} ${vz(g.punkte)}`).join(", ")}.</span>}
        </p>
      )}
      <p className="wa-hilfe-fuss">
        Kosten im Haushalt: {vz(h.kostenBip, 2)} % des BIP im Jahr · Umsetzung etwa {h.monate} {h.monate === 1 ? "Monat" : "Monate"}
        {h.mehrheitFehlt ? " · dem Lager fehlt dafür die Mehrheit im Parlament" : ""}
        {!h.moeglich && h.grund ? ` · ${h.grund}` : ""}
      </p>
      <div className="wa-hilfe-knoepfe">
        <button type="button" className="aktion-knopf" onClick={() => onMassnahme?.(h.massnahme, h.richtung)}>
          Einstellen und einbringen
        </button>
        <button type="button" className="aktion-knopf" onClick={rechne} disabled={vor.laeuft}>
          {vor.laeuft ? "Rechne …" : "Vorschau in zwölf Monaten"}
        </button>
      </div>
      {vor.zeilen && (
        <table className="wa-vorschau" aria-label="Vorschau in zwölf Monaten">
          <thead>
            <tr>
              <th />
              <th>ohne</th>
              <th>mit der Maßnahme</th>
              <th>Unterschied</th>
            </tr>
          </thead>
          <tbody>
            {vor.zeilen.map((z) => (
              <tr key={z.name}>
                <th>{z.name}</th>
                <td>{nf(z.ohne)}</td>
                <td>
                  <b>{nf(z.mit)}</b> <em>({nf(z.von)} bis {nf(z.bis)})</em>
                </td>
                <td className={Math.abs(z.mit - z.ohne) < 0.05 ? "" : (z.mit - z.ohne > 0) === z.hochIstGut ? "gut" : "schlecht"}>
                  <b>{vz(z.mit - z.ohne)}</b>
                </td>
              </tr>
            ))}
          </tbody>
          <caption>Das ganze Modell mit Zufall und den Rückwirkungen über die Wirtschaft, acht Läufe; die Spanne zeigt, wie unsicher es ist.</caption>
        </table>
      )}
      {vor.fehler && <p className="wa-leer schlecht">{vor.fehler}</p>}
    </li>
  );
}

// Das Handlungsfeld einer Größe, eines Problems oder einer Wählergruppe: Man stellt sie nicht selbst ein, aber man kann etwas tun.
// Es zeigt die stärksten Hebel des Politiknetzes mit Wirkstärke und einem Knopf, der die Maßnahme mit sinnvoller Voreinstellung öffnet,
// und bei den Größen des Wirtschaftsmodells die direkten Eingriffe (Haushalt, Zentralbank).

import { NET } from "../sim/modell";
import { nationalAverage, PROVINCES } from "../sim/netz";
import { handlungsHebel, MAKRO_EINGRIFFE, type HandlungsHebel } from "../sim/wege";
import { tunSatz } from "../data/skalen";
import type { NodeSpec } from "../data/politiknetz";
import type { World } from "../sim/types";

import { t } from "../i18n";
const EINGRIFF_NAME: Record<string, string> = {
  ausgaben: "Staatsausgaben erhöhen",
  sparen: "Staatsausgaben kürzen",
  kritik: "Zentralbank öffentlich kritisieren",
  gouverneur: "Zentralbankführung austauschen",
};

function akuteProvinzen(world: World, node: NodeSpec): number[] {
  if (node.kind !== "problem" || !node.threshold) return [];
  const i = NET.index.get(node.id)!;
  const out: number[] = [];
  for (let p = 0; p < PROVINCES; p++) if (world.net.values[i * PROVINCES + p]! >= node.threshold) out.push(p + 1);
  return out;
}

export function Handlungsfeld({
  world,
  node,
  onStelle,
  onEingriff,
}: {
  world: World;
  node: NodeSpec;
  onStelle: (massnahme: string, richtung: 1 | -1, ort: number[] | null) => void;
  onEingriff?: (option: string) => void;
}) {
  const mittel = (id: string) => nationalAverage(NET, world.net, id);
  const zeile = (h: HandlungsHebel, ort: number[] | null, zusatz?: string) => (
    <li key={`${h.massnahme}-${h.folge}`} className="hh-zeile">
      <div className="hh-text">
        <strong>
          {tunSatz(h.massnahme, h.richtung, h.name)}
        </strong>
        <span>
          {t("ui2.ui.Handlungsfeld.928f8c4", { p0: h.wirkung, p1: Math.round(h.jetzt) })}
          {zusatz ? ` · ${zusatz}` : ""}
        </span>
      </div>
      <button className="aktion-knopf" onClick={() => onStelle(h.massnahme, h.richtung, ort)} title={t("ui.Handlungsfeld.ba54e97")}>
        {t("ui2.ui.Handlungsfeld.24b298d")}
      </button>
    </li>
  );

  let inhalt: React.ReactNode = null;
  if (node.kind === "problem") {
    const orte = akuteProvinzen(world, node);
    const hebel = handlungsHebel(mittel, node.id, -1, 4);
    inhalt = (
      <>
        <p className="subtitle">
          {orte.length > 0
            ? t("ui2.ui.Handlungsfeld.6550592", { p0: node.name, p1: orte.length, p2: orte.length === 1 ? "Provinz" : "Provinzen" })
            : t("ui2.ui.Handlungsfeld.8ed19cd", { p0: node.name })}
        </p>
        <b className="hh-kopf">{t("ui2.ui.Handlungsfeld.be55758")}</b>
        <ul className="hh-liste">{hebel.map((h) => zeile(h, orte.length > 0 && orte.length <= 50 ? orte : null, orte.length ? `${orte.length} ${orte.length === 1 ? "Provinz" : "Provinzen"}` : undefined))}</ul>
        {hebel.length === 0 && <p className="subtitle">{t("ui.Handlungsfeld.14f0951")}</p>}
      </>
    );
  } else if (node.kind === "gruppe") {
    const hebel = handlungsHebel(mittel, node.id, 1, 4);
    inhalt = (
      <>
        <p className="subtitle">{t("ui.Handlungsfeld.7de9cd7")}</p>
        <b className="hh-kopf">{t("ui2.ui.Handlungsfeld.3f10267")}</b>
        <ul className="hh-liste">{hebel.map((h) => zeile(h, null))}</ul>
      </>
    );
  } else {
    const senken = handlungsHebel(mittel, node.id, -1, 3);
    const heben = handlungsHebel(mittel, node.id, 1, 3);
    const eingriffe = MAKRO_EINGRIFFE[node.id] ?? [];
    inhalt = (
      <>
        <p className="subtitle">{node.input ? t("ui2.ui.Handlungsfeld.104f44b") : t("ui2.ui.Handlungsfeld.ab52d02")}</p>
        {eingriffe.length > 0 && (
          <>
            <b className="hh-kopf">{t("ui2.ui.Handlungsfeld.8b03b58")}</b>
            <ul className="hh-liste">
              {eingriffe.map((e) => (
                <li key={e.option} className="hh-zeile">
                  <div className="hh-text">
                    <strong>{EINGRIFF_NAME[e.option]}</strong>
                    <span>{e.wirkt}</span>
                  </div>
                  <button className="aktion-knopf" onClick={() => onEingriff?.(e.option)} title={t("ui.Handlungsfeld.dc1774b")}>
                    {t("ui2.ui.Handlungsfeld.aa11755")}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        {senken.length > 0 && (
          <>
            <b className="hh-kopf">{t("ui2.ui.Handlungsfeld.4f20a36", { p0: node.name })}</b>
            <ul className="hh-liste">{senken.map((h) => zeile(h, null))}</ul>
          </>
        )}
        {heben.length > 0 && (
          <>
            <b className="hh-kopf">{t("ui2.ui.Handlungsfeld.d25c677", { p0: node.name })}</b>
            <ul className="hh-liste">{heben.map((h) => zeile(h, null))}</ul>
          </>
        )}
        {senken.length === 0 && heben.length === 0 && eingriffe.length === 0 && <p className="subtitle">{t("ui.Handlungsfeld.9f94acf")}</p>}
      </>
    );
  }

  return (
    <div className="policy handlungsfeld">
      <h4 className="hh-titel">{t("ui.Handlungsfeld.51a8bcf")}</h4>
      {inhalt}
    </div>
  );
}

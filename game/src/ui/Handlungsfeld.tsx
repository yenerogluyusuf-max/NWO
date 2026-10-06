// Das Handlungsfeld einer Größe, eines Problems oder einer Wählergruppe: Man stellt sie nicht selbst ein, aber man kann etwas tun.
// Es zeigt die stärksten Hebel des Politiknetzes mit Wirkstärke und einem Knopf, der die Maßnahme mit sinnvoller Voreinstellung öffnet,
// und bei den Größen des Wirtschaftsmodells die direkten Eingriffe (Haushalt, Zentralbank).

import { NET } from "../sim/modell";
import { nationalAverage, PROVINCES } from "../sim/netz";
import { handlungsHebel, MAKRO_EINGRIFFE, type HandlungsHebel } from "../sim/wege";
import { tunWort } from "../data/skalen";
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
          {h.name} {tunWort(h.massnahme, h.richtung)}
        </strong>
        <span>
          wirkt {h.wirkung} · jetzt Stufe {Math.round(h.jetzt)}
          {zusatz ? ` · ${zusatz}` : ""}
        </span>
      </div>
      <button className="aktion-knopf" onClick={() => onStelle(h.massnahme, h.richtung, ort)} title={t("ui.Handlungsfeld.ba54e97")}>
        Einstellen
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
            ? `${node.name} ist in ${orte.length} ${orte.length === 1 ? "Provinz" : "Provinzen"} akut. Diese Vorhaben helfen am meisten; sie werden dort angesetzt, wo es brennt.`
            : `${node.name} ist zurzeit nirgends akut. Diese Vorhaben halten es niedrig.`}
        </p>
        <b className="hh-kopf">Abhelfen</b>
        <ul className="hh-liste">{hebel.map((h) => zeile(h, orte.length > 0 && orte.length <= 50 ? orte : null, orte.length ? `${orte.length} ${orte.length === 1 ? "Provinz" : "Provinzen"}` : undefined))}</ul>
        {hebel.length === 0 && <p className="subtitle">{t("ui.Handlungsfeld.14f0951")}</p>}
      </>
    );
  } else if (node.kind === "gruppe") {
    const hebel = handlungsHebel(mittel, node.id, 1, 4);
    inhalt = (
      <>
        <p className="subtitle">{t("ui.Handlungsfeld.7de9cd7")}</p>
        <b className="hh-kopf">Was sie wollen</b>
        <ul className="hh-liste">{hebel.map((h) => zeile(h, null))}</ul>
      </>
    );
  } else {
    const senken = handlungsHebel(mittel, node.id, -1, 3);
    const heben = handlungsHebel(mittel, node.id, 1, 3);
    const eingriffe = MAKRO_EINGRIFFE[node.id] ?? [];
    inhalt = (
      <>
        <p className="subtitle">{node.input ? "Diese Zahl rechnet das Wirtschaftsmodell. Sie stellen sie nicht ein, aber Sie können an ihren Ursachen ansetzen." : "Diese Größe stellen Sie nicht selbst ein, aber Sie können an ihren Ursachen ansetzen."}</p>
        {eingriffe.length > 0 && (
          <>
            <b className="hh-kopf">Direkt eingreifen</b>
            <ul className="hh-liste">
              {eingriffe.map((e) => (
                <li key={e.option} className="hh-zeile">
                  <div className="hh-text">
                    <strong>{EINGRIFF_NAME[e.option]}</strong>
                    <span>{e.wirkt}</span>
                  </div>
                  <button className="aktion-knopf" onClick={() => onEingriff?.(e.option)} title={t("ui.Handlungsfeld.dc1774b")}>
                    Vorbereiten
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        {senken.length > 0 && (
          <>
            <b className="hh-kopf">Um „{node.name}“ zu senken</b>
            <ul className="hh-liste">{senken.map((h) => zeile(h, null))}</ul>
          </>
        )}
        {heben.length > 0 && (
          <>
            <b className="hh-kopf">Um „{node.name}“ zu erhöhen</b>
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

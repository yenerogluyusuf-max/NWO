// Die Operationsform in der Kriegsakte (Welle 3, K3): vier Karten mit dem Vorbild und den Faktoren der Form auf die Rechnung des Schauplatzes,
// darunter die Wahl, ob die Syrische Nationalarmee mitkämpft. Rechnet nichts selbst: Möglichkeit, Grund und Preis kommen aus sim/operationen.ts,
// die Faktoren aus data/operationen.ts (dieselben Zahlen, mit denen die Kriegswoche rechnet).

import type { World } from "../../sim/types";
import type { KriegVorgang } from "../../sim/krieg-typen";
import { OPERATIONSFORMEN, VERBUENDETE, type OperationsFormId, type VerbuendeteId } from "../../data/operationen";
import { anDerGrenze, formenFuer, operationsFaktoren, waehleOperation } from "../../sim/operationen";
import { t, zahl } from "../../i18n";
import { useSprache } from "../../i18n/react";
import "./operation.css";

const faktor = (f: number) => t("welle_k3.op.w.faktor", { f: zahl(f, f === Math.round(f) ? 0 : f * 10 === Math.round(f * 10) ? 1 : 2) });
/** Gut (unter 1), schlecht (über 1) oder neutral, aus Sicht der Türkei */
const ton = (f: number, mehrIstGut = false) => (f === 1 ? "" : (f > 1) === mehrIstGut ? "gut" : "schlecht");

export function Operation({ world, k, onTat }: { world: World; k: KriegVorgang; onTat: (text: string) => void }) {
  useSprache();
  const formen = formenFuer(world, k);
  if (!formen.length) return null;
  const imKrieg = k.phase === "krieg";
  const mit: VerbuendeteId = k.verbuendete ?? "allein";
  const snaMoeglich = formen.some((f) => f.sna);
  const aktiv = formen.find((f) => f.aktiv);
  const of = operationsFaktoren(k);
  return (
    <section className="op" aria-label={t("welle_k3.op.kopf")}>
      <header className="op-kopf">
        <h5>{t("welle_k3.op.kopf")}</h5>
        <span>{t("welle_k3.op.frage")}</span>
      </header>
      {/* Eine Tabelle zum Vergleichen: je Form eine Zeile, die Faktoren in Spalten (ENTSCHEIDUNGEN Z: Zahlen statt Sätze) */}
      <div className="op-tabelle" role="group" aria-label={t("welle_k3.op.frage")}>
        <div className="op-zeile op-kopfzeile" aria-hidden>
          <span />
          <span>{t("welle_k3.op.w.tiefe")}</span>
          <span>{t("welle_k3.op.w.tempo")}</span>
          <span>{t("welle_k3.op.w.verluste")}</span>
          <span>{t("welle_k3.op.w.welt")}</span>
          <span>{t("welle_k3.op.w.inland")}</span>
        </div>
        {formen.map((f) => {
          const d = OPERATIONSFORMEN[f.id];
          // Mit der SNA zeigt die aktive Zeile die Faktoren samt Verbündeten (Verluste in der Großoffensive, Weltpreis)
          const sna = f.aktiv && mit === "sna";
          const verlust = sna ? of.verlust : d.verlust;
          const welt = sna ? of.welt : d.welt;
          const geht = f.moeglich && !f.aktiv;
          return (
            <button
              key={f.id}
              type="button"
              className={`op-zeile op-form${f.aktiv ? " on" : ""}${f.moeglich || f.aktiv ? "" : " aus"}`}
              aria-pressed={f.aktiv}
              aria-disabled={!geht}
              title={f.grund ?? t(`welle_k3.op.${f.id}.vorbild`)}
              onClick={() => geht && onTat(waehleOperation(world, k, f.id, f.sna ? mit : "allein").text)}
            >
              <span className="op-name">
                <strong>{t(`welle_k3.op.${f.id}.name`)}</strong>
                <b>{f.aktiv ? t("welle_k3.op.gilt") : f.pk > 0 ? t("welle_k3.op.w.preis", { pk: f.pk }) : t("welle_k3.op.w.frei")}</b>
                <small>{!f.moeglich && !f.aktiv && f.grund ? <em className="op-grund">{f.grund}</em> : t(`welle_k3.op.${f.id}.vorbild`)}</small>
              </span>
              <span className="op-wert">{t(`welle_k3.op.w.tiefe${d.tiefe}`)}</span>
              <span className={`op-wert ${ton(d.vorstoss, true)}`}>{faktor(d.vorstoss)}</span>
              <span className={`op-wert ${ton(verlust)}`}>{faktor(verlust)}</span>
              <span className={`op-wert ${ton(welt)}`}>{faktor(welt)}</span>
              <span className={`op-wert ${ton(d.uhr)}`}>{faktor(d.uhr)}</span>
            </button>
          );
        })}
      </div>
      {snaMoeglich && (
        <div className="op-mit" role="group" aria-label={t("welle_k3.op.mit")}>
          <span className="op-etikett">{t("welle_k3.op.mit")}</span>
          {(["allein", "sna"] as VerbuendeteId[]).map((m) => {
            const form: OperationsFormId | undefined = aktiv?.id;
            const geht = !!form && (m === "allein" || VERBUENDETE.sna.formen.includes(form)) && k.phase !== "waffenruhe";
            return (
              <button key={m} type="button" className={mit === m ? "on" : ""} aria-pressed={mit === m} aria-disabled={!geht || mit === m} onClick={() => geht && mit !== m && form && onTat(waehleOperation(world, k, form, m).text)}>
                <strong>{t(m === "sna" ? "welle_k3.op.sna" : "welle_k3.op.allein")}</strong>
                {m === "sna" && <span>{t("welle_k3.op.sna.kurz")}</span>}
              </button>
            );
          })}
        </div>
      )}
      <p className="op-hinweis">
        {!k.operation ? t("welle_k3.op.ohne") : imKrieg ? t("welle_k3.op.im_krieg") : t("welle_k3.op.ab_einsatz")}
      </p>
      {anDerGrenze(k) && <p className="op-grenze">{t("welle_k3.op.grenze")}</p>}
    </section>
  );
}

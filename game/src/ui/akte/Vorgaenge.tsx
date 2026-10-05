// Reiter „Vorgänge“ im Akten-Gerüst: alle politischen Vorhaben, offene Entscheidungen zuerst; Klick öffnet das Vorgangsblatt.

import { useState } from "react";
import { t } from "../../i18n";
import { PROVINZEN } from "../../sim/regional";
import { offenerKonflikt, vorgaenge, type Vorgang } from "../../sim/vorgaenge";
import type { World } from "../../sim/types";
import { VorgangBlatt, schrittIndex } from "../vorgang/VorgangBlatt";

const rang = (v: Vorgang): number => (offenerKonflikt(v) ? 0 : v.schritt === "abgeschlossen" || v.schritt === "aufgegeben" ? 2 : 1);

export function VorgaengeReiter({ w, onGeaendert, start }: { w: World; onGeaendert?: () => void; start?: string }) {
  const liste = vorgaenge(w).slice().sort((a, b) => rang(a) - rang(b) || b.beschluss - a.beschluss);
  const [offen, setOffen] = useState<string | null>(start ?? liste[0]?.id ?? null);
  const [, neu] = useState(0);
  const geaendert = () => {
    neu((n) => n + 1);
    onGeaendert?.();
  };
  if (!liste.length) return <p className="ak-leer">{t("vorgang.ui.leer")}</p>;
  const gewaehlt = liste.find((v) => v.id === offen);
  return (
    <div className="vg-reiter">
      <ul className="vg-liste">
        {liste.map((v) => {
          const ort = PROVINZEN[v.plaka - 1]?.name ?? String(v.plaka);
          const i = schrittIndex(v);
          return (
            <li key={v.id}>
              <button type="button" className={`vg-eintrag${v.id === offen ? " an" : ""}`} onClick={() => setOffen(v.id)} aria-pressed={v.id === offen}>
                <b>{t("vorgang.ui.titel", { ort })}</b>
                <span>{v.schritt === "aufgegeben" ? t("vorgang.ui.aufgegeben") : v.schritt === "abgeschlossen" ? t("vorgang.ui.abgeschlossen") : t(`vorgang.ui.schritt.${v.schritt}`)}</span>
                {offenerKonflikt(v) && <em className="vg-marke">{t("vorgang.ui.entscheiden")}</em>}
                <i className="vg-balken" aria-hidden>
                  <s style={{ width: `${Math.max(0, Math.min(100, (Math.max(0, i) / 6) * 100))}%` }} />
                </i>
              </button>
            </li>
          );
        })}
      </ul>
      {gewaehlt && <VorgangBlatt w={w} v={gewaehlt} onGeaendert={geaendert} />}
    </div>
  );
}

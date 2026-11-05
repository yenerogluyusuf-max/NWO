// Ein Vorhaben als Kachel im Katalog (Rückmeldung 05.11.2026: „dieser Bereich und die, die so aussehen, müssen viel besser werden“):
// Art, Name, Stand und die Eckdaten auf einen Blick; ein Klick öffnet daneben die volle Karte mit Wirkungen, Vergabe und „Beginnen“.

import type { VorhabenSicht } from "../../sim/reich";
import { effektZeile } from "../../sim/reich";
import { KLASSEN_NAMEN } from "../../sim/reich-typen";
import { t } from "../../i18n";

function stand(s: VorhabenSicht): { wort: string; ton: string } {
  if (s.status === "fertig") return { wort: t("vk.fertig"), ton: "fertig" };
  if (s.status === "im_bau") return { wort: t("vk.imBau"), ton: "bau" };
  if (s.status === "pausiert") return { wort: t("vk.pausiert"), ton: "bau" };
  if (s.status === "gesperrt" || s.status === "ausgeschlossen") return { wort: t("vk.gesperrt"), ton: "zu" };
  if (!s.bereit) return { wort: t("vk.voraus"), ton: "zu" };
  if (!s.bezahlbar) return { wort: t("vk.kapital"), ton: "knapp" };
  return { wort: t("vk.bereit"), ton: "bereit" };
}

export function VorhabenKachel({ s, gewaehlt, onWaehle }: { s: VorhabenSicht; gewaehlt: boolean; onWaehle: () => void }) {
  const v = s.v;
  const st = stand(s);
  const monate = v.kosten.monate;
  const zeit = monate >= 24 ? t("vk.jahre", { n: Math.round(monate / 12) }) : t("vk.monate", { n: monate });
  const bringt = v.abschluss.map((e) => effektZeile(e)).find((x) => !!x);
  return (
    <button type="button" className={`vk klasse-${v.klasse} vk-${st.ton}${gewaehlt ? " on" : ""}${v.unrealistisch ? " utopie" : ""}`} aria-pressed={gewaehlt} onClick={onWaehle}>
      <span className="vk-kopf">
        <span className="vk-klasse">{KLASSEN_NAMEN[v.klasse]}{v.stufe ? ` · ${t("vk.stufe", { n: v.stufe })}` : ""}</span>
        <span className={`vk-stand vk-${st.ton}`}>{st.wort}</span>
      </span>
      <strong className="vk-name">{v.name}</strong>
      <span className="vk-eck">
        {v.kosten.pk > 0 && <span>{t("vk.pk", { n: v.kosten.pk })}</span>}
        <span>{zeit}</span>
        {v.kosten.schulden ? <span>{t("vk.bip", { n: v.kosten.schulden.toLocaleString("de-DE", { maximumFractionDigits: 1 }) })}</span> : null}
      </span>
      {bringt && <span className={`vk-bringt${bringt.gut === false ? " schlecht" : ""}`}>{bringt.text}</span>}
      {s.status === "im_bau" || s.status === "pausiert" ? <span className="vk-balken"><i style={{ width: `${Math.round((s.fortschritt ?? 0) * 100)}%` }} /></span> : null}
    </button>
  );
}

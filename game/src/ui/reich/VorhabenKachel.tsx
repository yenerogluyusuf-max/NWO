// Ein Vorhaben als Kachel im Katalog (Rückmeldung 05.11.2026: „dieser Bereich und die, die so aussehen, müssen viel besser werden“):
// Bild, Art, Name, Stand und die Eckdaten auf einen Blick; ein Klick öffnet daneben die volle Karte mit Wirkungen, Vergabe und „Beginnen“.
// Nacht N6: Jede Kachel trägt ihr Motiv (Entwurf, Baustelle oder fertig), Zahlen gehen durch den Formatierer der Sprache.

import type { VorhabenSicht } from "../../sim/reich";
import { effektZeile } from "../../sim/reich";
import { KLASSEN_NAMEN } from "../../sim/reich-typen";
import { t, zahl } from "../../i18n";
import { WunderBild } from "./WunderBild";
import { bipText } from "./VorhabenKarte";

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
  const zeit = monate >= 24 ? t("vk.jahre", { n: zahl(Math.round(monate / 12)) }) : t("vk.monate", { n: monate });
  const bringt = v.abschluss.map((e) => effektZeile(e)).find((x) => !!x);
  const bildZustand = s.status === "fertig" ? "fertig" : s.status === "im_bau" || s.status === "pausiert" ? "bau" : "entwurf";
  return (
    <button type="button" className={`vk klasse-${v.klasse} vk-${st.ton}${gewaehlt ? " on" : ""}${v.unrealistisch ? " utopie" : ""}`} aria-pressed={gewaehlt} onClick={onWaehle}>
      {v.bild && (
        <span className="vk-bild" aria-hidden>
          <WunderBild art={v.bild} zustand={bildZustand === "entwurf" ? "fertig" : bildZustand} fortschritt={s.fortschritt} klasse={bildZustand === "entwurf" ? "vk-vorschau" : ""} />
        </span>
      )}
      <span className="vk-text">
        <span className="vk-kopf">
          <span className="vk-klasse">{v.vorlage ? t("ui.reich.Regional.3887a19") : KLASSEN_NAMEN[v.klasse]}{v.stufe ? ` · ${t("vk.stufe", { n: v.stufe })}` : ""}</span>
          <span className={`vk-stand vk-${st.ton}`}>{st.wort}</span>
        </span>
        <strong className="vk-name">{v.name}</strong>
        <span className="vk-eckzeile">
          {[v.kosten.pk > 0 ? t("vk.pk", { n: zahl(v.kosten.pk) }) : null, v.kosten.bau > 0 ? t("n6.vk.bau", { n: zahl(v.kosten.bau) }) : null, zeit, v.kosten.schulden ? bipText(v.kosten.schulden) : null].filter(Boolean).join(" · ")}
        </span>
        {bringt && <span className={`vk-bringt${bringt.gut === false ? " schlecht" : ""}`}>{bringt.text}</span>}
        {s.status === "im_bau" || s.status === "pausiert" ? <span className="vk-balken"><i style={{ width: `${Math.round((s.fortschritt ?? 0) * 100)}%` }} /></span> : null}
      </span>
    </button>
  );
}

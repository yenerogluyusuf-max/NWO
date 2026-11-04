// Konfliktlage in der Akte Sicherheit (PRUEFUNG_GESAMT_2026-11-04): Laufende Konflikte und angespannte Länder an einer Stelle,
// jeweils mit dem Sprung in das Konfliktdossier des Landes. Früher lag der Krieg nur unter Außen → Land → Konflikt, und die
// Sicherheitsakte zeigte Konflikte bloß an. Nur lesend; gehandelt wird im Dossier.

import { t } from "../../i18n";
import { PHASEN_NAME, aktiveKriege, KRISE_AB } from "../../sim/krieg";
import { LAENDER, weltZustand } from "../../sim/laender";
import type { World } from "../../sim/types";

/** Ab dieser Spannung erscheint ein Land in der Konfliktlage (Spielparameter, wie die Schwelle der Zwischenfälle). */
const ANGESPANNT_AB = 50;

export function Konfliktlage({ w, onKonflikt }: { w: World; onKonflikt: (landId: string) => void }) {
  const aktiv = aktiveKriege(w);
  const z = weltZustand(w);
  const angespannt = LAENDER
    .filter((l) => !aktiv.some((k) => k.land === l.id) && (z[l.id]?.konflikt ?? 0) >= ANGESPANNT_AB)
    .sort((a, b) => (z[b.id]?.konflikt ?? 0) - (z[a.id]?.konflikt ?? 0))
    .slice(0, 6);
  if (!aktiv.length && !angespannt.length) return <p className="ak-leer">{t("gz.konflikt.ruhig", { ab: ANGESPANNT_AB })}</p>;
  return (
    <section className="gz-konflikte" aria-label={t("gz.konflikt.titel")}>
      <h3 className="ak-abschnitt">{t("gz.konflikt.titel")}</h3>
      <ul>
        {aktiv.map((k) => {
          const name = LAENDER.find((l) => l.id === k.land)?.name ?? k.land;
          const imKrieg = k.phase === "krieg" || k.phase === "waffenruhe";
          return (
            <li key={k.id} className={`gz-konflikt ${k.phase}`}>
              <div><strong>{name}</strong><span>{PHASEN_NAME[k.phase]}{imKrieg ? ` · ${t("gz.konflikt.front", { front: Math.round(k.front) })}` : ` · ${t("gz.konflikt.eskalation", { wert: Math.round(k.eskalation) })}`}</span></div>
              <button type="button" className="gz-knopf" onClick={() => onKonflikt(k.land)}>{t("gz.konflikt.oeffnen")}</button>
            </li>
          );
        })}
        {angespannt.map((l) => {
          const wert = Math.round(z[l.id]?.konflikt ?? 0);
          return (
            <li key={l.id} className="gz-konflikt angespannt">
              <div><strong>{l.name}</strong><span>{t("gz.konflikt.spannung", { wert })}{wert >= KRISE_AB ? ` · ${t("gz.konflikt.krise")}` : ""}</span></div>
              <button type="button" className="gz-knopf" onClick={() => onKonflikt(l.id)}>{t("gz.konflikt.oeffnen")}</button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

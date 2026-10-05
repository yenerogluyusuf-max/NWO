// Drei Fragen, die der Schreibtisch beantwortet: Wovon hängt meine Regierung ab? Welches Versprechen wird zuerst fällig? Was kann ich liegen lassen?

import { t } from "../../i18n";
import type { World } from "../../sim/types";
import { startFragen } from "../akte/lage";

export function DreiFragen({ world }: { world: World }) {
  const f = startFragen(world);
  const zeilen: [string, string][] = [
    [t("akte.fragen.f1"), f.abhaengig],
    [t("akte.fragen.f2"), f.zuerst],
    [t("akte.fragen.f3"), f.liegenLassen],
  ];
  return (
    <section className="sk-fragen" aria-label={t("akte.fragen.aria")}>
      {zeilen.map(([frage, antwort]) => (
        <div key={frage} className="sk-frage">
          <b>{frage}</b>
          <p>{antwort}</p>
        </div>
      ))}
    </section>
  );
}

// Zentralbank und Haushalt: Entscheidungen mit Vorschau und Folgekette (`wirtschaft/`). Die früheren Erlasse (Führung austauschen, Zentralbank
// kritisieren, Ausgaben erhöhen oder kürzen) sind jetzt Wege in der Zentralbank- und der Haushaltsansicht.

import type { World } from "../sim/types";
import { WirtschaftAkte, type Reiter } from "./wirtschaft/Akte";

/** Welche Ansicht ein Erlass der früheren Liste jetzt öffnet. */
const START: Record<string, { reiter: Reiter; abschnitt?: "sitzung" | "gouverneur" | "stufe"; posten?: string }> = {
  gouverneur: { reiter: "zentralbank", abschnitt: "gouverneur" },
  kritik: { reiter: "zentralbank", abschnitt: "sitzung" },
  ausgaben: { reiter: "haushalt", posten: "soziales" },
  sparen: { reiter: "haushalt", posten: "personal" },
};

export function Decisions({ world, onGeaendert, start }: { world: World; onGeaendert?: () => void; onDecided?: () => void; start?: string }) {
  const s = (start && START[start]) || { reiter: "zentralbank" as Reiter };
  return <WirtschaftAkte world={world} start={s.reiter} {...(s.abschnitt ? { zbAbschnitt: s.abschnitt } : {})} {...(s.posten ? { posten: s.posten } : {})} onGeaendert={onGeaendert} />;
}

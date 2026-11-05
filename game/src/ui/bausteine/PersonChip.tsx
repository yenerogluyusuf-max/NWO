// Baustein „Porträt-Chip“ (PLAN_OBERFLAECHE_DETAIL Teil 1, Q3): Gesicht, Name, Amt und ein Ring nach der Stimmung (dieselben Stufen
// wie der Kabinettstisch, `stimmungVon`); ein Klick öffnet Gespräch oder Akte. Ersetzt die Personenreiter der Akten.

import type { World } from "../../sim/types";
import type { Figur } from "../../sim/spiel-typen";
import { stimmungVon } from "../../sim/kabinett";
import { Portraet } from "../personen/bausteine";
import "./bausteine.css";

export function PersonChip({ w, f, unter, onKlick }: { w: World; f: Figur; unter?: string; onKlick?: (f: Figur) => void }) {
  const stimmung = stimmungVon(f.loyalitaet, f.eigen?.groll ?? 0);
  const inhalt = (
    <>
      <span className={`bs-person-ring ${stimmung}`}>
        <Portraet w={w} f={f} size={40} />
      </span>
      <span className="bs-person-text">
        <b>{f.name}</b>
        <small>{unter ?? f.rolle}</small>
      </span>
    </>
  );
  return onKlick ? (
    <button type="button" className="bs-person" onClick={() => onKlick(f)}>
      {inhalt}
    </button>
  ) : (
    <span className="bs-person">{inhalt}</span>
  );
}

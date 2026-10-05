// Kleine Zeilen aus Marken mit drei Punkten Stärke: Wählergruppen, Vorteil, Preis, Partner (Prolog und Parteikonfigurator).

export interface Chip {
  text: string;
  /** Stärke von 0 bis 1: wie viele der drei Punkte gefüllt sind */
  staerke: number;
}

export type ChipArt = "gruppe" | "vorteil" | "preis" | "partner" | "fern";

export function Chips({ chips, art }: { chips: Chip[]; art: ChipArt }) {
  return (
    <>
      {chips.map((c) => (
        <span key={c.text} className={`chip ${art}`}>
          <i className="pips" aria-hidden>
            <b className={c.staerke > 0 ? "an" : ""} />
            <b className={c.staerke > 0.34 ? "an" : ""} />
            <b className={c.staerke > 0.67 ? "an" : ""} />
          </i>
          <span>{c.text}</span>
        </span>
      ))}
    </>
  );
}

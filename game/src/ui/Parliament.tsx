import type { World } from "../sim/types";

/** Neutrale Farben für die Parteien; keine Parteilogos (Länderpaket, Abschnitt 4). */
export const PARTY_COLORS: Record<string, string> = {
  AKP: "#c98a2b",
  YENİ: "#6b7fa8",
  DEM: "#7d5a8c",
  MHP: "#9b3b3b",
  İYİ: "#5a9aa8",
  CHP: "#b5655a",
  Zafer: "#7a7a55",
  YRP: "#4f7a4f",
};

export function Parliament({ world }: { world: World }) {
  const parl = world.parliament;
  const player = world.player;
  if (!parl || !player) return null;
  const own = player.partei.kurz;
  const order = Object.entries(parl.seats)
    .filter(([, s]) => s > 0)
    .sort((a, b) => {
      const rank = (p: string) => (p === own ? 0 : p === player.buendnis ? 1 : 2);
      return rank(a[0]) - rank(b[0]) || b[1] - a[1];
    });
  const bloc = (parl.seats[own] ?? 0) + (player.buendnis ? (parl.seats[player.buendnis] ?? 0) : 0);

  return (
    <section className="paper parliament">
      <h3>Parlament</h3>
      <p className="subtitle">
        600 Sitze · Mehrheit ab 301 · {bloc >= 301 ? "eigene Mehrheit" : `es fehlen ${301 - bloc} Stimmen`}
      </p>
      <div className="seatbar" role="img" aria-label="Sitzverteilung">
        {order.map(([party, seats]) => (
          <div
            key={party}
            className="seg"
            style={{ width: `${(seats / 600) * 100}%`, background: party === own ? player.partei.farbe : (PARTY_COLORS[party] ?? "#999") }}
            title={`${party}: ${seats}`}
          />
        ))}
        <div className="majority" style={{ left: `${(301 / 600) * 100}%` }} />
      </div>
      <ul className="seatlist">
        {order.map(([party, seats]) => (
          <li key={party}>
            <span className="dot" style={{ background: party === own ? player.partei.farbe : (PARTY_COLORS[party] ?? "#999") }} />
            {party === own ? player.partei.name : party}
            {party === player.buendnis && " (Bündnis)"} <strong>{seats}</strong>
            <span className="subtitle"> · {parl.shares[party]!.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

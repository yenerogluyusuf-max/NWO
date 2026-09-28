import type { World } from "../sim/types";

/** Neutrale Farben für die Parteien; keine Parteilogos (Länderpaket, Abschnitt 4). */
export const PARTY_COLORS: Record<string, string> = {
  AKP: "#e0892b",
  YENİ: "#6f82a3",
  DEM: "#8a6a93",
  MHP: "#a4524a",
  İYİ: "#6aa0a6",
  CHP: "#bb7462",
  Zafer: "#86845e",
  YRP: "#5f845a",
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

  const color = (party: string) => (party === own ? player.partei.farbe : (PARTY_COLORS[party] ?? "#999"));

  return (
    <section className="paper parliament">
      <h3>Parlament</h3>
      <div className="hemicycle-wrap">
        <Hemicycle order={order.map(([p, n]) => ({ color: color(p), seats: n }))} />
        <div className="hemicycle-center">
          <strong>{bloc}</strong>
          <span>{bloc >= 301 ? "eigene Mehrheit" : `es fehlen ${301 - bloc}`}</span>
        </div>
      </div>
      <ul className="seatlist">
        {order.map(([party, seats]) => (
          <li key={party}>
            <span className="dot" style={{ background: color(party) }} />
            <span className="party">
              {party === own ? player.partei.name : party}
              {party === player.buendnis && <em> · Bündnis</em>}
            </span>
            <strong>{seats}</strong>
            <span className="share">{parl.shares[party]!.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %</span>
          </li>
        ))}
      </ul>
      <p className="footnote">600 Sitze. Gesetze brauchen 301 Stimmen, Verfassungsänderungen 360 mit Volksabstimmung oder 400 ohne.</p>
    </section>
  );
}

/** Halbrund mit einem Punkt je Sitz, von links nach rechts nach Parteien gefüllt. */
function Hemicycle({ order }: { order: { color: string; seats: number }[] }) {
  const total = order.reduce((a, b) => a + b.seats, 0);
  const rows = 12;
  const r0 = 44;
  const r1 = 100;
  // Sitze je Reihe proportional zum Radius
  const radii = Array.from({ length: rows }, (_, i) => r0 + ((r1 - r0) * i) / (rows - 1));
  const sum = radii.reduce((a, b) => a + b, 0);
  let left = total;
  const perRow = radii.map((r, i) => {
    const n = i === rows - 1 ? left : Math.round((total * r) / sum);
    left -= n;
    return n;
  });
  const seats: { x: number; y: number; a: number }[] = [];
  radii.forEach((r, i) => {
    const n = perRow[i]!;
    for (let k = 0; k < n; k++) {
      const a = Math.PI - (Math.PI * (k + 0.5)) / n;
      seats.push({ x: 110 + r * Math.cos(a), y: 106 - r * Math.sin(a), a });
    }
  });
  seats.sort((p, q) => q.a - p.a);
  const colors: string[] = [];
  for (const o of order) for (let k = 0; k < o.seats; k++) colors.push(o.color);
  return (
    <svg className="hemicycle" viewBox="0 0 220 112" role="img" aria-label="Sitzverteilung im Parlament">
      {seats.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.35" fill={colors[i] ?? "#ccc"} stroke="rgba(40,26,14,0.35)" strokeWidth="0.35" />
      ))}
      <line x1="110" y1="2" x2="110" y2="60" stroke="#2a1f18" strokeWidth="0.8" strokeDasharray="2 1.5" />
    </svg>
  );
}

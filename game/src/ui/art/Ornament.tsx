// Messingbeschläge und Zierlinien für Fenster und Leisten.

/** Eckbeschlag, für die übrigen Ecken per CSS gespiegelt. */
export function Corner({ className }: { className?: string }) {
  return (
    <svg className={`corner ${className ?? ""}`} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id="brass-corner" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8e2a0" />
          <stop offset="0.5" stopColor="#c69a4a" />
          <stop offset="1" stopColor="#6e4b1c" />
        </linearGradient>
      </defs>
      <path
        d="M2 2 H30 C30 6 26 8 22 8 H10 C9 8 8 9 8 10 V22 C8 26 6 30 2 30 Z"
        fill="url(#brass-corner)"
        stroke="#3a2812"
        strokeWidth="1"
      />
      <path d="M30 2 C36 2 40 5 40 9 C40 12 37 13 35 11" fill="none" stroke="url(#brass-corner)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M2 30 C2 36 5 40 9 40 C12 40 13 37 11 35" fill="none" stroke="url(#brass-corner)" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="7" cy="7" r="2.6" fill="#3a2812" />
      <circle cx="6.5" cy="6.5" r="1.4" fill="#f8e2a0" />
      <path d="M13 13 C18 13 22 16 22 21" fill="none" stroke="#c69a4a" strokeWidth="1" strokeOpacity="0.7" />
    </svg>
  );
}

export function Corners() {
  return (
    <>
      <Corner className="tl" />
      <Corner className="tr" />
      <Corner className="bl" />
      <Corner className="br" />
    </>
  );
}

/** Zierlinie mit Raute in der Mitte, etwa unter Überschriften. */
export function Flourish({ className, width = 220 }: { className?: string; width?: number }) {
  return (
    <svg className={`flourish ${className ?? ""}`} width={width} height="14" viewBox="0 0 220 14" aria-hidden>
      <path d="M4 7 H92 M128 7 H216" stroke="currentColor" strokeWidth="1" />
      <path d="M92 7 C98 1 104 1 110 7 C116 13 122 13 128 7" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M92 7 C98 13 104 13 110 7 C116 1 122 1 128 7" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M110 3 L114 7 L110 11 L106 7 Z" fill="currentColor" />
      <circle cx="4" cy="7" r="1.6" fill="currentColor" />
      <circle cx="216" cy="7" r="1.6" fill="currentColor" />
    </svg>
  );
}

/** Rundes Emblem mit Halbmond und Stern für Siegel und Ladebildschirm. */
export function StateSeal({ size = 120 }: { size?: number }) {
  const ticks = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    return <line key={i} x1={60 + Math.cos(a) * 50} y1={60 + Math.sin(a) * 50} x2={60 + Math.cos(a) * (i % 4 ? 53 : 55)} y2={60 + Math.sin(a) * (i % 4 ? 53 : 55)} stroke="currentColor" strokeWidth="1" />;
  });
  return (
    <svg className="state-seal" width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      <circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" strokeWidth="1" />
      {ticks}
      <circle cx="54" cy="60" r="20" fill="currentColor" />
      <circle cx="59.5" cy="60" r="16" fill="var(--seal-bg, #1a1410)" />
      <path d="M78 60 l2.2 6 6.4 0.2 -5 3.9 1.8 6.2 -5.4 -3.7 -5.4 3.7 1.8 -6.2 -5 -3.9 6.4 -0.2 Z" transform="translate(0 -8)" fill="currentColor" />
    </svg>
  );
}

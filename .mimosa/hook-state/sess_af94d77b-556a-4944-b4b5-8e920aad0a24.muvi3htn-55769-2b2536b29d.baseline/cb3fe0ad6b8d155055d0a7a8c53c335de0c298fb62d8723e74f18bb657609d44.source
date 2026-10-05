// Formen der Karten-Marken: sechs unverwechselbare Silhouetten (Form und Farbe getrennt je Art).
//   Bauvorhaben   Kreis mit Fortschrittsring und Kran (Kupfer)
//   Wunder        Raute (Gold) mit Tempel
//   Kulturerbe    Torbogen (Bronze, Farbe nach Zustand) mit Kuppel
//   Ereignis      Tropfenmarke (Rot)
//   Frist         Kalenderblatt (Orange)
//   Krise         Warndreieck (Gelb)
// Die Symbole in der Mitte setzt die Karte darüber (ui/icons.tsx); der Kran ist Teil der Form, weil sein Ausleger leise schwenkt.

export type MarkenArt = "bau" | "wunder" | "erbe" | "ereignis" | "frist" | "krise";

const UMFANG_BAU = 2 * Math.PI * 13;

export function MarkenForm({ art, fortschritt = 0, pausiert = false }: { art: MarkenArt; fortschritt?: number; pausiert?: boolean }) {
  const p = Math.min(1, Math.max(0, fortschritt));
  switch (art) {
    case "bau":
      return (
        <svg className="ort-form form-bau" viewBox="0 0 32 32" aria-hidden focusable="false">
          <circle className="f-rand" cx="16" cy="16" r="15.2" />
          <circle className="f-spur" cx="16" cy="16" r="13" fill="none" strokeWidth="3" />
          <circle
            className="f-fort"
            cx="16"
            cy="16"
            r="13"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={pausiert ? "3 3.2" : `${(UMFANG_BAU * p).toFixed(2)} ${UMFANG_BAU.toFixed(2)}`}
            transform="rotate(-90 16 16)"
          />
          <circle className="f-grund" cx="16" cy="16" r="10" />
          {/* Kran: Mast, Ausleger mit Gegengewicht und Haken (der Ausleger schwenkt leise) */}
          <path className="f-kran" d="M12 24.5 V10.2 M9 24.5 H15 M12 10.2 L9 13 M12 10.2 L16.5 8" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <g className="f-ausleger">
            <path className="f-kran" d="M7.2 10.4 H23.4 M7.2 10.4 V12.6" fill="none" strokeWidth="1.5" strokeLinecap="round" />
            <path className="f-kran" d="M21 10.4 V15.6" fill="none" strokeWidth="1" strokeLinecap="round" />
            <path className="f-haken" d="M21 15.6 q0 1.9 -1.5 1.9" fill="none" strokeWidth="1.1" strokeLinecap="round" />
          </g>
        </svg>
      );
    case "wunder":
      return (
        <svg className="ort-form form-wunder" viewBox="0 0 32 32" aria-hidden focusable="false">
          <path className="f-rand" d="M16 0.8 L31.2 16 L16 31.2 L0.8 16 Z" />
          <path className="f-gold" d="M16 3.4 L28.6 16 L16 28.6 L3.4 16 Z" />
          <path className="f-glanz" d="M16 3.4 L28.6 16 L16 12.4 L3.4 16 Z" />
        </svg>
      );
    case "erbe":
      return (
        <svg className="ort-form form-erbe" viewBox="0 0 32 32" aria-hidden focusable="false">
          <path className="f-rand" d="M4.2 30 V15 A11.8 11.8 0 0 1 27.8 15 V30 Z" />
          <path className="f-erbe" d="M6.4 28 V15.4 A9.6 9.6 0 0 1 25.6 15.4 V28 Z" />
          <path className="f-sockel" d="M4.2 28.2 H27.8" fill="none" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case "ereignis":
      return (
        <svg className="ort-form form-ereignis" viewBox="0 0 32 32" aria-hidden focusable="false">
          <path className="f-rand" d="M16 31 C16 31 3.6 19.6 3.6 12.4 A12.4 12.4 0 0 1 28.4 12.4 C28.4 19.6 16 31 16 31 Z" />
          <path className="f-ereignis" d="M16 28.2 C16 28.2 6 18.8 6 12.4 A10 10 0 0 1 26 12.4 C26 18.8 16 28.2 16 28.2 Z" />
        </svg>
      );
    case "frist":
      return (
        <svg className="ort-form form-frist" viewBox="0 0 32 32" aria-hidden focusable="false">
          <rect className="f-rand" x="2.6" y="4" width="26.8" height="25" rx="4.6" />
          <rect className="f-frist" x="4.6" y="6" width="22.8" height="21" rx="3.2" />
          <path className="f-band" d="M4.6 9.2 A3.2 3.2 0 0 1 7.8 6 H24.2 A3.2 3.2 0 0 1 27.4 9.2 V12.2 H4.6 Z" />
          <path className="f-ring" d="M10.5 3 V7.4 M21.5 3 V7.4" fill="none" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case "krise":
      return (
        <svg className="ort-form form-krise" viewBox="0 0 32 32" aria-hidden focusable="false">
          <path className="f-rand" d="M16 1.8 L31 28.6 Q31.6 30 30 30 H2 Q0.4 30 1 28.6 Z" strokeLinejoin="round" />
          <path className="f-krise" d="M16 5.6 L28.2 27.4 H3.8 Z" strokeLinejoin="round" />
        </svg>
      );
  }
}

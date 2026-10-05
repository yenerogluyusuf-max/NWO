// Die Karte hinter dem Buch: Das Buch deckt die rechte Seite; die Karte zielt in die Mitte der freien Fläche (AtlasMap, Eigenschaft `randRechts`).

/** Breite des Buchs in Bildpunkten (wie `.buch-huelle` in prolog/buch.css: 41 % der Fensterbreite, 500 bis 880 Bildpunkte; die Parteiseite ist breiter) */
export const buchBreite = (fensterBreite: number, weit = false): number => (weit ? Math.min(fensterBreite - 28, Math.min(1120, Math.max(760, 0.55 * fensterBreite))) : Math.min(880, Math.max(500, 0.41 * fensterBreite)));

/** Verdeckter Rand rechts in Bildpunkten für das Fenster, wie es jetzt ist (ohne Fenster: 0). */
export const verdeckterRand = (weit = false, fensterBreite = typeof window === "undefined" ? 0 : window.innerWidth): number => (fensterBreite > 0 ? buchBreite(fensterBreite, weit) + Math.max(14, 0.022 * fensterBreite) : 0);

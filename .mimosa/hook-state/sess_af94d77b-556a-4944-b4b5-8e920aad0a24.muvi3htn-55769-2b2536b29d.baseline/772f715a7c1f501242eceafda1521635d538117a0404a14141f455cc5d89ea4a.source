// Politisches Kapital kann bis zu einer Grenze überzogen werden: Auch ein Staat gibt mehr aus, als er hat, und zahlt später zurück.
// Wer im Minus handelt, nimmt Rückhalt auf Pump: Jeden Monat unter null sinken Legitimität und Vertrauen, und die Gutschrift geht
// zuerst in die Rückzahlung. Die Überziehung ist begrenzt, damit Kapital nie beliebig negativ wird.

/** Wie weit das Kapital unter null fallen darf */
export const UEBERZIEHUNG = 20;

/** Wie viel sich noch ausgeben lässt, einschließlich der Überziehung. */
export const verfuegbar = (kapital: number): number => kapital + UEBERZIEHUNG;

/** Ob sich `pk` bezahlen lässt (Kapital plus Überziehung). */
export const kannZahlen = (kapital: number, pk: number): boolean => kapital + UEBERZIEHUNG >= pk - 1e-9;

/** Ob ein Betrag nur mit Überziehung zu bezahlen ist. */
export const nurAufPump = (kapital: number, pk: number): boolean => pk > 0 && kapital < pk && kannZahlen(kapital, pk);

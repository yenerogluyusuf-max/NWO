// Entfernt Beleg- und Quellenhinweise aus Texten, bevor sie im Spiel erscheinen.
// Die Daten behalten ihre Belege (Prüfbarkeit im Code); der Spieler sieht nur den Inhalt.
const VORSPANN = /^(Spielparameter|Game parameter|Oyun parametresi)\s*[,;:]?\s*/i;
const KLAMMER = /\s*\([^()]*(Spielparameter|game parameter|oyun parametre|RECHERCHE_|Quelle|Kaynak|Source)[^()]*\)/gi;
const SATZ = /[^.]*\b(in den Quellen|the sources|Kaynaklar)\b[^.]*\.\s*/gi;

export function ohneBeleg(s: string): string {
  let r = s.replace(KLAMMER, "").replace(SATZ, "");
  if (VORSPANN.test(r)) {
    r = r.replace(VORSPANN, "");
    r = r.charAt(0).toLocaleUpperCase() + r.slice(1);
  }
  return r.trim();
}

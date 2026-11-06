// Baustein „Knopf“ (befund-H H-02, Gestaltungsleitfaden §5): ein Knopf in drei Stufen statt eigener Knopfklassen je Ansicht.
//   haupt   primär: Leder mit Messingkante, höchstens einer je Entscheidung
//   normal  sekundär: Pergament mit Messingrand (Standard)
//   leise   nur Schrift, für Nebenwege („Mehr zeigen“, „Abbrechen“)
// Aussehen, Druck- und Fokusrückmeldung stehen in akte/bauteile.css (Klassen .knopf, .knopf-haupt, .knopf-leise). Eine Ansicht darf
// Lage und Breite bestimmen (eigene Klasse dazu), aber keine eigene Farbe, Schrift oder Rundung.

import type { ButtonHTMLAttributes } from "react";

export type KnopfStufe = "haupt" | "normal" | "leise";

/** Die Klasse der Stufe (für Stellen, die kein eigenes Element rendern können, etwa Links mit Knopfgestalt). */
export function knopfKlasse(stufe: KnopfStufe = "normal"): string {
  return stufe === "haupt" ? "knopf-haupt" : stufe === "leise" ? "knopf-leise" : "knopf";
}

export function Knopf({ stufe = "normal", className, type = "button", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { stufe?: KnopfStufe }) {
  const k = knopfKlasse(stufe);
  return <button type={type} className={className ? `${k} ${className}` : k} {...rest} />;
}

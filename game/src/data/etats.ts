/**
 * ENTSCHEIDUNGEN W, Nachtrag F1: Der Haushaltsposten ist der Etat. Die gleichnamige Maßnahme ist das Gesetz und kostet kein eigenes Geld
 * (Kosten 0 in data/politiknetz.ts); ihre Zeile im Politikbereich nennt den Etat, aus dem sie bezahlt wird. Eigenes Modul, damit auch
 * die Rechtswege (data/rechtswege.ts, Art. 161) wissen, welche Maßnahmen Haushaltsgeld bewegen.
 */
export const ETAT_DER_MASSNAHME: Record<string, string> = {
  m_verteidigung: "verteidigung",
  m_renten: "rentenniveau",
  m_sozialhilfe: "sozialhilfe",
  m_forschung: "forschung",
  m_polizei: "innere_sicherheit",
  m_agrarsubventionen: "landwirtschaft",
  m_energiesubventionen: "subventionen",
};

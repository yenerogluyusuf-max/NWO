// Welcher Rechtsweg eine Maßnahme ändert (befund-B B-4). Quelle: Verfassung der Republik Türkei (Gesetz Nr. 2709) in der Fassung des
// Gesetzes Nr. 6771 vom 21.01.2017 und Fachgesetze, Wortlaut bei mevzuat.gov.tr, abgerufen am 06.11.2026 über Legal Data Hunter
// (Quelle TR/MevzuatHF, Kennungen „TR-kanun-2709#art=…“):
//
// - Gesetz (Art. 88, 89, 96): Gesetzesvorlagen bringen nur Abgeordnete ein („Kanun teklif etmeye milletvekilleri yetkilidir“).
// - Präsidialbeschluss (Art. 73 Abs. 4): Sätze von Steuern und Abgaben darf der Präsident „in den Grenzen, die das Gesetz nennt“, ändern,
//   wenn ein Gesetz ihn dazu ermächtigt. Belegt für die Mehrwertsteuer: Katma Değer Vergisi Kanunu Nr. 3065 Art. 28 („Katma değer
//   vergisi oranı … % 10'dur. Cumhurbaşkanı bu oranı, dört katına kadar artırmaya, % 1'e kadar indirmeye … yetkilidir“), also 1 bis 40 %;
//   der heutige Regelsatz von 20 % beruht auf dem Präsidialbeschluss Nr. 7346 (data/skalen.ts). Kraftstoff- und Zollsätze laufen in der
//   Praxis ebenso über Beschlüsse; die Ermächtigung (ÖTV-Gesetz Nr. 4760 Art. 12, Einfuhrregime) ist hier noch nicht im Wortlaut
//   geprüft, deshalb bleiben sie vorerst beim Gesetz (Bericht N4, zur Bestätigung).
// - Präsidialerlass (Art. 104 Abs. 17): nur in Angelegenheiten der Exekutive, nie Grundrechte, nie Gegenstände, die die Verfassung dem
//   Gesetz vorbehält (data/gesetzesvorhaben.ts).
// - Haushalt (Art. 161): Ausgaben laufen über den Haushalt; „Harcanabilecek tutarın Cumhurbaşkanlığı kararnamesiyle aşılabileceğine dair
//   bütçe kanununa hüküm konulamaz“. Eine Maßnahme, die Geld kostet, lässt sich deshalb nicht per Erlass ausweiten, nur per Gesetz (das
//   der Haushaltsposten bezahlt, ENTSCHEIDUNGEN W F1). Kürzen innerhalb des Etats darf die Regierung selbst.
// - Kommission (Arbeitsgesetz Nr. 4857 Art. 39, Asgari Ücret Yönetmeliği Art. 8, mevzuat.gov.tr Nr. 5454): Den Mindestlohn setzt die
//   Mindestlohnkommission fest: fünf Vertreter des Staates, fünf der größten Arbeitnehmer- und fünf der größten Arbeitgeberorganisation.
//   Sie tritt auf Ruf des Arbeitsministeriums zusammen, entscheidet mit Stimmenmehrheit (bei Gleichstand gilt die Seite des Vorsitzes),
//   der Beschluss ist endgültig und wird im Resmî Gazete veröffentlicht. Der Präsident gibt also seinen fünf Vertretern eine Vorgabe.
// - Ausnahmezustand (Art. 119): ausrufen nur bei den dort genannten Anlässen, höchstens sechs Monate, Vorlage an das Parlament am selben
//   Tag, Verlängerung auf Antrag des Präsidenten um jeweils höchstens vier Monate (sim/notstand.ts).

import type { NodeSpec } from "./politiknetz";
import { ETAT_DER_MASSNAHME } from "./etats";

export type Rechtsweg = "gesetz" | "beschluss" | "erlass" | "haushalt" | "kommission" | "notstand";

/** Maßnahmen, deren Satz der Präsident per Beschluss ändern darf (Art. 73 Abs. 4 mit gesetzlicher Ermächtigung). */
export const BESCHLUSS_MASSNAHMEN: Record<string, { quelle: string }> = {
  m_mwst: { quelle: "KDV-Gesetz Nr. 3065 Art. 28" },
};

/** Ab dieser Stufe von m_notstand braucht es einen ausgerufenen Ausnahmezustand (data/skalen.ts: 65 Notstandsdekrete, 90 Ausnahmezustand). */
export const NOTSTAND_AB = 65;

/** Mindestlohn: der Weg über die Kommission. */
export const KOMMISSION_MASSNAHMEN = new Set(["m_mindestlohn"]);

/** Themen, in denen ein Erlass (Art. 104 Abs. 17) grundsätzlich zulässig ist, und einzelne Verwaltungsmaßnahmen außerhalb davon. */
export const ERLASS_THEMEN = new Set(["sicherheit", "aussen", "militaer"]);
export const ERLASS_MASSNAHMEN = new Set(["m_steuerfahndung", "m_verwaltungsdigital"]);

/**
 * Der Hauptweg einer Maßnahme in eine Richtung (+1 erhöhen, −1 senken) zu einer Zielstufe.
 * „erlass“ und „beschluss“ heißen: Gesetz oder der schnelle Weg; „haushalt“: nur Gesetz, kein Erlass; „kommission“ und „notstand“
 * sind eigene Verfahren ohne Abstimmung über ein Gesetz.
 */
export function rechtswegVon(node: Pick<NodeSpec, "id" | "theme" | "cost">, richtung: number, ziel: number): Rechtsweg {
  if (KOMMISSION_MASSNAHMEN.has(node.id)) return "kommission";
  if (node.id === "m_notstand" && ziel >= NOTSTAND_AB) return "notstand";
  if (BESCHLUSS_MASSNAHMEN[node.id]) return "beschluss";
  const erlassThema = ERLASS_THEMEN.has(node.theme) || ERLASS_MASSNAHMEN.has(node.id);
  if (!erlassThema) return "gesetz";
  // Art. 161: Mehr Geld ausgeben geht nur über den Haushalt. Etat-Maßnahmen (F1) haben keine eigenen Kosten mehr, bewegen aber
  // Haushaltsgeld: Sie gehen in beide Richtungen nur über den Haushalt
  if (ETAT_DER_MASSNAHME[node.id]) return "haushalt";
  if ((node.cost ?? 0) > 0 && richtung > 0) return "haushalt";
  return "erlass";
}

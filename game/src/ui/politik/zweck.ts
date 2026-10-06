// Wozu dient welche Akte? Ein Satz unter dem Titel jedes Fensters, damit man den Unterschied zwischen den Ansichten versteht
// (ENTSCHEIDUNGEN.md, „Aufbau der Ansichten“). Jeder Reiter hat seinen eigenen Satz (Schlüssel: die Kennung des Reiters);
// der Satz der Gruppe (Kurzname im Menü) gilt nur, wenn ein Reiter keinen eigenen hat. Texte: Katalog ansichten.json.

import { katalogDe, t } from "../../i18n";

const hat = (k: string): boolean => katalogDe()[k] !== undefined;

export function zweckVon(dossier: string | null, kurz: string | undefined): string | undefined {
  if (dossier && hat(`zweck.tab.${dossier}`)) return t(`zweck.tab.${dossier}`);
  if (kurz && hat(`zweck.akte.${kurz}`)) return t(`zweck.akte.${kurz}`);
  return undefined;
}

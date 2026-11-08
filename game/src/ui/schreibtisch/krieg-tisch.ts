// Ein laufender Krieg auf dem Schreibtisch (Welle 3, K3; krieg.md Schritt 6): Er steht oben unter „Was verlangt heute Ihre Entscheidung?“,
// mit der Lage und dem nächsten Entscheid. Vorher stand der Krieg nur bei Nachschub unter 50 % oder in der Waffenruhe im ruhigen Block „Lage“
// (krieg.md 1.5: „sechs Entscheidungen heute, keine davon zum Krieg“). Nur Lesen: Rang und Bündelung ändern weder Fristen noch Folgen.

import type { World } from '../../sim/types';
import type { KriegVorgang } from '../../sim/krieg-typen';
import type { OffenesEreignis } from '../../sim/spiel-typen';
import { aktiveKriege } from '../../sim/krieg';
import { akteurName } from '../../sim/welt-modell';
import { t } from '../../i18n';
import { DRINGEND_TAGE, type Prioritaet } from './arbeitsplatz';

/** Vorlagen, die zu einem Krieg gehören (Wendepunkte, Angebot der Waffenruhe, Drohkulisse, Putschgerüchte) */
const istKriegsVorlage = (id: string) => id.startsWith('krieg_') || id === 'putschgeruechte';

/** Laufende Kriege (Kampf oder Waffenruhe) mit dem offenen Vorgang, der zu ihnen gehört. Wendepunkte gehen vor dem Angebot der Gegenseite. */
export function kriegeAufDemTisch(w: World): { k: KriegVorgang; ev?: OffenesEreignis }[] {
  const sp = w.spiel;
  if (!sp) return [];
  return aktiveKriege(w).filter((k) => k.phase === 'krieg' || k.phase === 'waffenruhe').map((k) => {
    const offen = sp.ereignisse.filter((e) => istKriegsVorlage(e.vorlage) && e.daten?.vorgang === k.id).sort((a, b) => Number(b.vorlage.startsWith('krieg_wp_')) - Number(a.vorlage.startsWith('krieg_wp_')) || a.frist - b.frist);
    return offen[0] ? { k, ev: offen[0] } : { k };
  });
}

/** Die Einträge für schreibtischArbeit und die Vorgänge, die dort nicht noch einmal einzeln stehen. */
export function kriegsTisch(w: World): { eintraege: Prioritaet[]; ereignisse: Set<string> } {
  const sp = w.spiel;
  const ereignisse = new Set<string>();
  const eintraege: Prioritaet[] = [];
  if (!sp) return { eintraege, ereignisse };
  for (const { k, ev } of kriegeAufDemTisch(w)) {
    for (const e of sp.ereignisse) if (istKriegsVorlage(e.vorlage) && e.daten?.vorgang === k.id) ereignisse.add(e.id);
    const tage = ev ? ev.frist - w.day : undefined;
    // Rot mit offener Frist bis eine Woche, sonst Gelb: Ein Krieg ohne offenen Entscheid ist Lage, die man im Auge behält
    const ton: Prioritaet['ton'] = tage !== undefined && tage <= DRINGEND_TAGE ? 'rot' : 'gelb';
    const land = akteurName(k.land);
    eintraege.push({
      id: `krieg-${k.id}`,
      titel: k.phase === 'waffenruhe' ? t('welle_k3.tisch.titel_waffenruhe', { land }) : t('welle_k3.tisch.titel', { land, woche: k.woche }),
      grund: t('welle_k3.tisch.grund', { front: Math.round(k.front), uhr: Math.round(Math.max(0, Math.min(100, k.uhr))), gefallene: k.gefallene ?? 0 }),
      ...(tage !== undefined ? { tage } : {}),
      ton,
      // Über allem anderen (Zusagen in Gefahr stehen bei 220): Der Krieg ist die erste Frage des Tages
      rang: ev ? 240 : 230,
      sprung: { art: 'extern', ziel: { art: 'konflikt', land: k.land } },
      gruppe: 'land',
      inhalt: { art: 'krieg', kriegId: k.id, ...(ev ? { ereignisId: ev.id } : {}) },
    });
  }
  return { eintraege, ereignisse };
}

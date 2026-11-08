// Der Krieg als Kachel des Schreibtischs (Welle 3, K3): oben die Lage als Kennzahlen (dieselbe Karte wie in der Kriegsakte, klein), darunter
// der nächste Entscheid mit seinen Wegen und Preisen. Keine eigene Logik: Die Wege eines Vorgangs kommen aus `antworten` (sim/ereignisse.ts)
// und werden über `entscheideVorlage` entschieden wie überall am Tisch; ohne offenen Vorgang stehen die Schritte aus `handlungenFuer`.

import type { World } from '../../sim/types';
import { antworten, vorlage as ereignisVorlage } from '../../sim/ereignisse';
import { entscheideVorlage } from '../../sim/ministerfluss';
import { PAKETE, fuehreKriegHandlungAus, handlungenFuer, kriegZu, type KriegHandlungId } from '../../sim/krieg';
import { kannZahlen } from '../../sim/kapital';
import { t } from '../../i18n';
import { Lagekarte } from '../krieg/Lagekarte';
import type { Antwort } from './Tischkachel';
import type { Ziel } from './briefing';
import '../krieg/operation.css';

/** Ohne offenen Vorgang: die nächsten Schritte des Krieges in der Reihenfolge der Akte (höchstens zwei). */
const SCHRITTE: Partial<Record<string, KriegHandlungId[]>> = { krieg: ['waffenruhe', 'verstaerkung'], waffenruhe: ['weiterkaempfen'] };

export function KriegKachel({ world, kriegId, ereignisId, onAntwort, refresh, onGehe }: {
  world: World; kriegId: string; ereignisId?: string; onAntwort: (a: Antwort) => void; refresh: () => void; onGehe: (z: Ziel) => void;
}) {
  const k = kriegZu(world, kriegId);
  if (!k || !world.spiel) return null;
  const kapital = world.spiel.kapital;
  const tun = (f: () => Antwort) => { onAntwort(f()); refresh(); };
  const ev = ereignisId ? world.spiel.ereignisse.find((e) => e.id === ereignisId) : undefined;
  const preis = (pk: number) => (pk > 0 ? t('mf.kosten.kapital', { pk: Math.round(pk) }) : t('mf.kosten.frei'));
  let naechster;
  if (ev) {
    const v = ereignisVorlage(ev.vorlage);
    const wege = antworten(world, ev);
    naechster = <>
      <p className="kt3-frage">{v.titel(world, ev)}</p>
      <ul className="kt3-wege">{wege.map((o) => {
        const pk = o.anzeigePk ?? o.pk;
        const geht = !o.sperre && kannZahlen(kapital, pk);
        return <li key={o.id}>
          <button type="button" className="knopf tk2-option" disabled={!geht} title={o.sperre ?? o.beschreibung} onClick={() => tun(() => entscheideVorlage(world, `ereignis:${ev.id}`, o.id))}>
            <span className="kt3-kopf"><span className="tk2-label">{o.label}</span><span className="tk2-preis">{preis(pk)}</span></span>
            <span className="kt3-wirkung">{o.beschreibung}</span>
          </button>
          {o.sperre && <small className="kt3-grund">{o.sperre}</small>}
        </li>;
      })}</ul>
    </>;
  } else {
    // Ohne offenen Vorgang: das Paket der Gegenseite in der Waffenruhe, sonst die nächsten Schritte der Akte
    const h = handlungenFuer(world, k.id);
    const paket = k.phase === 'waffenruhe' && k.angebotPaket ? h.find((x) => x.id === k.angebotPaket) : undefined;
    const schritte = [...(paket ? [paket] : []), ...(SCHRITTE[k.phase] ?? []).map((id) => h.find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => !!x)].slice(0, 3);
    naechster = <>
      <p className="kt3-leer">{paket ? t('welle_k3.tisch.paket', { paket: PAKETE[k.angebotPaket!]!.name }) : t('welle_k3.tisch.kein_wp')}</p>
      {schritte.length > 0 && <ul className="kt3-wege">{schritte.map((s) => <li key={s.id}>
        <button type="button" className="knopf tk2-option" disabled={!s.moeglich} title={s.grund ?? s.hinweis} onClick={() => tun(() => fuehreKriegHandlungAus(world, k.id, s.id))}>
          <span className="kt3-kopf"><span className="tk2-label">{s.label}</span><span className="tk2-preis">{preis(s.pk)}</span></span>
          <span className="kt3-wirkung">{s.moeglich ? s.hinweis : s.grund}</span>
        </button>
      </li>)}</ul>}
    </>;
  }
  return <div className="kt3">
    <Lagekarte k={k} klein />
    <div className="kt3-naechster">
      <span className="kt3-kicker">{t('welle_k3.tisch.naechster')}</span>
      {naechster}
    </div>
    <button type="button" className="knopf-leise tk2-akte" onClick={() => onGehe({ art: 'konflikt', land: k.land })}>{t('welle_k3.tisch.akte')}</button>
  </div>;
}

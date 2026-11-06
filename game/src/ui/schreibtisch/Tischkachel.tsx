// Eine Entscheidung als Kachel des Schreibtischs (Rückmeldung des Inhabers 06.11.2026: „ich kann hier auch nichts machen“).
// Bild wie im Ereignisfenster (Szene des Themas, Gesicht oder Wappen), ein konkreter Satz zur Lage und die Wege direkt als Knöpfe mit Preis.
// Hier liegt keine Spiellogik: Wege, Preise und Folgen kommen aus den Plänen der Simulation (Tischkarte.tsx, ministerfluss.ts), entschieden
// wird über dieselben Kernfunktionen wie in den Fachakten.

import { useMemo, useState, type ReactNode } from 'react';
import type { World } from '../../sim/types';
import type { Amt, Vorlage, VorlageOption, VorlagenZiel } from '../../sim/ministerfluss-typen';
import { entscheideVorlage } from '../../sim/ministerfluss';
import { RESSORT_REAKTION } from '../../sim/ressortpolitik';
import { RESSORT_ANLIEGEN, RESSORT_STILLSTAND } from '../../sim/ressortanliegen';
import { NET } from '../../sim/modell';
import { addDays, formatDateDe } from '../../sim/dates';
import { kannZahlen } from '../../sim/kapital';
import { t, zahl } from '../../i18n';
import { Portraet as Zeichnung } from '../art/Portraet';
import { Wappen } from '../prolog/Wappen';
import { EreignisSzene } from '../ereignis/Szenen';
import { themaFuer, type Thema } from '../ereignis/kontext';
import { vorlage as ereignisVorlage } from '../../sim/ereignisse';
import { RessortForderungsWege } from '../minister/RessortForderungsWege';
import { quelleName } from '../minister/VorlageKarte';
import { Icon } from '../icons';
import { anliegenKarte, entscheideAnliegen, entscheideVorfall, entscheideZusage, vorfallKarte, zusageKarte } from './Tischkarte';
import { fristText, type ForderungsReihe, type Prioritaet, type RessortReihe } from './arbeitsplatz';
import type { Ziel } from './briefing';

export type Antwort = { ok: boolean; text: string; why?: string };
export interface KachelProps {
  world: World;
  e: Prioritaet;
  /** Große Karte oben (mit Bild und Titel) oder aufgeklappte Zeile der Liste (nur Satz und Wege) */
  gross?: boolean;
  onAntwort: (a: Antwort) => void;
  refresh: () => void;
  onGehe: (z: Ziel) => void;
  onKarte?: (problemId?: string) => void;
  onVorgang?: (id: string) => void;
}

const istMeta = (o: VorlageOption) => o.id === 'spaeter' || o.id === 'nichts' || o.id === 'kenntnis';
const knoten = (id: string) => NET.nodes[NET.index.get(id) ?? -1]?.name ?? id;
const ressortName = (amt: Amt) => t(`daten.amt.${amt}.ressort`);
const datum = (w: World, tag: number) => formatDateDe(addDays(w.date, tag - w.day));
const REAKTIONEN = ['stuetzen', 'zurueckpfeifen', 'entlassen'] as const;
// Bereichsbild je Ressort (dieselben Szenen wie im Ereignisfenster)
const AMT_THEMA: Partial<Record<Amt, Thema>> = {
  finanzen: 'haushalt', zentralbank: 'haushalt', arbeit: 'haushalt', wirtschaft: 'wirtschaft', energie: 'wirtschaft', handel: 'wirtschaft', landwirtschaft: 'wirtschaft',
  aussen: 'aussen', generalstab: 'sicherheit', verteidigung: 'sicherheit', justiz: 'recht', inneres: 'gesellschaft', gesundheit: 'gesellschaft', bildung: 'gesellschaft',
  kultur: 'gesellschaft', jugend: 'gesellschaft', familie: 'gesellschaft', umwelt: 'wohnen', verkehr: 'wohnen', partner: 'partner', stab: 'recht',
};

/** Preis einer Option, wie gebucht: Kapital (oder kostenlos) */
const preis = (o: VorlageOption) => (o.kosten.pk > 0 ? t('mf.kosten.kapital', { pk: Math.round(o.kosten.pk) }) : t('mf.kosten.frei'));
/** Die eine Folgezeile einer Option: Leitgröße mit und ohne Eingriff, sonst die erste Sofortfolge */
function wirkung(o: VorlageOption): string | undefined {
  const n = o.nutzen?.[0];
  if (n) return `${n.name}: ${zahl(n.jetzt, 0)} → ${zahl(n.mit, 0)}`;
  return o.folgen[0];
}

/** Die Wege einer Vorlage als Knöpfe mit Preis; mehr als drei und die Nebenwege (Später, Nicht tun) leise darunter. */
export function Wege({ v, onWaehle, kompakt = false, max = 3 }: { v: Vorlage; onWaehle: (optionId: string) => void; kompakt?: boolean; max?: number }) {
  const [alle, setAlle] = useState(false);
  const echte = v.optionen.filter((o) => !istMeta(o));
  const meta = v.optionen.filter((o) => istMeta(o) && (o.id !== 'kenntnis' || !echte.length));
  const zeig = alle ? echte : echte.slice(0, max);
  const empf = v.empfehlung?.optionId;
  return <div className="tk2-wege">
    <ul className={`tk2-optionen${kompakt ? ' kompakt' : ''}`}>
      {zeig.map((o) => {
        const w = kompakt ? undefined : wirkung(o);
        return <li key={o.id}>
          <button type="button" className={`${o.id === empf ? 'knopf-haupt' : 'knopf'} tk2-option`} disabled={!o.moeglich} title={o.grund ?? o.text ?? o.label} onClick={() => onWaehle(o.id)}>
            <span className="tk2-option-kopf"><span className="tk2-label">{o.label}</span><span className="tk2-preis">{preis(o)}</span></span>
            {(w || o.kosten.aufmerksamkeit > 0) && !kompakt && <span className="tk2-wirkung">{[w, o.kosten.aufmerksamkeit > 0 ? t('mf.kosten.aufmerksamkeit', { n: o.kosten.aufmerksamkeit }) : ''].filter(Boolean).join(' · ')}</span>}
          </button>
          {!o.moeglich && o.grund && <small className="tk2-grund">{o.grund}</small>}
        </li>;
      })}
    </ul>
    {(echte.length > max || meta.length > 0) && <div className="tk2-fuss">
      {echte.length > max && <button type="button" className="knopf-leise" aria-expanded={alle} onClick={() => setAlle(!alle)}>{alle ? t('h4.weniger') : t('h4.alleWege', { n: echte.length })}</button>}
      {meta.map((o) => <button key={o.id} type="button" className="knopf-leise" title={o.text} onClick={() => onWaehle(o.id)}>{o.label}</button>)}
    </div>}
  </div>;
}

function Gesicht({ name, weiblich, amt, size }: { name: string; weiblich?: boolean; amt: Amt; size: number }) {
  return <Zeichnung seed={name} size={size} geschlecht={weiblich ? 'f' : 'm'} rolle={amt} rahmen="messing" />;
}

/** Wer die Entscheidung vorlegt: Minister (Gesicht), mehrere Minister, eine Partei (Wappen) oder das Land */
function Bild({ world, e, size }: { world: World; e: Prioritaet; size: number }): ReactNode {
  const figur = (amt: Amt) => world.spiel?.figuren.find((f) => f.imAmt && f.amt === amt);
  const i = e.inhalt;
  if (i.art === 'ressorts') return <span className="tk2-gruppenbild">{i.reihen.slice(0, 4).map((r) => { const f = figur(r.amt); return f ? <Gesicht key={r.amt} name={f.name} weiblich={f.weiblich} amt={r.amt} size={Math.round(size * 0.72)} /> : null; })}</span>;
  if (i.art === 'partei') return <Wappen id={`partei:${i.partei}`} size={size} />;
  if (i.art === 'zusage') { const z = world.spiel?.zusagen.find((x) => x.id === i.zusageId); return z && world.parliament?.seats[z.von] !== undefined ? <Wappen id={`partei:${z.von}`} size={size} /> : <span className="tk2-zeichen"><Icon name="siegel" size={size / 2} /></span>; }
  const amt = i.art === 'ressort' ? i.amt : i.art === 'vorlage' ? i.vorlage.amt : undefined;
  const m = i.art === 'vorlage' ? i.vorlage.minister : undefined;
  const f = amt ? figur(amt) : undefined;
  if (m && amt) return <Gesicht name={m.name} weiblich={m.weiblich} amt={amt} size={size} />;
  if (f && amt) return <Gesicht name={f.name} weiblich={f.weiblich} amt={amt} size={size} />;
  return <span className="tk2-zeichen"><Icon name={e.gruppe === 'land' ? 'karte' : 'akte'} size={size / 2} /></span>;
}

function thema(world: World, e: Prioritaet): Thema {
  const i = e.inhalt;
  if (i.art === 'partei' || i.art === 'zusage') return 'partner';
  if (i.art === 'vorgang' || e.gruppe === 'land') return 'wohnen';
  if (i.art === 'vorlage' && i.vorlage.quelle === 'ereignis' && i.vorlage.ziel?.art === 'ereignis') {
    const id = i.vorlage.ziel.id, ev = world.spiel?.ereignisse.find((x) => x.id === id);
    if (ev) return themaFuer({ id: ev.id, vorlage: ev.vorlage, szene: ereignisVorlage(ev.vorlage).szene }, world);
  }
  const amt = i.art === 'ressort' ? i.amt : i.art === 'ressorts' ? i.reihen[0]?.amt : i.art === 'vorlage' ? i.vorlage.amt : undefined;
  return (amt && AMT_THEMA[amt]) ?? 'gesellschaft';
}

/** Ein Ressort im Bündel der Stillstände: was gelitten hat, bis wann man reagieren kann, und die Reaktion direkt an der Zeile. */
function StillstandReihe({ world, r, entscheide }: { world: World; r: RessortReihe; entscheide: (f: () => Antwort) => void }) {
  const anfrage = useMemo(() => (r.anliegen ? anliegenKarte(world, r.anliegen) : undefined), [world, world.day, world.spiel?.kapital, r.anliegen]);
  const kapital = world.spiel?.kapital ?? 0;
  return <li className="tk2-reihe">
    <div className="tk2-reihe-kopf"><b>{ressortName(r.amt)}</b><span>{r.name}</span><span className={`tk2-reihe-frist${r.tage <= 7 ? ' rot' : ''}`}>{t('h4.bis', { datum: datum(world, world.day + r.tage) })}</span></div>
    <p className="tk2-reihe-wert">{t('h4.still.reihe', { groesse: knoten(r.groesse), vor: zahl(r.vor, 0), nach: zahl(r.nach, 0), anfrage: datum(world, r.anfrage) })}</p>
    {anfrage ? <>
      <p className="tk2-reihe-hinweis">{t('h4.still.neueAnfrage', { frist: datum(world, world.day + (anfrage.frist ?? 0)) })}</p>
      <Wege v={anfrage} kompakt max={2} onWaehle={(id) => entscheide(() => entscheideAnliegen(world, r.anliegen!, id))} />
    </> : <div className="tk2-reaktionen" role="group" aria-label={t('rp.art.vorfall')}>
      {REAKTIONEN.map((art) => <button key={art} type="button" className="knopf tk2-klein" disabled={!kannZahlen(kapital, RESSORT_REAKTION[art].pk)} title={t(`rp.text.${art}`)}
        onClick={() => entscheide(() => entscheideVorfall(world, r.vorfall, art))}>{t(`h4.kurz.${art}`)} <b aria-label={t('mf.kosten.kapital', { pk: RESSORT_REAKTION[art].pk })}><Icon name="siegel" size={13} />{RESSORT_REAKTION[art].pk}</b></button>)}
    </div>}
    {r.vorlagen[0] && <details className="tk2-tiefe"><summary>{t('h4.ursacheAngehen')}</summary>
      <p className="tk2-satz">{r.vorlagen[0].titel}</p>
      <Wege v={r.vorlagen[0]} onWaehle={(id) => entscheide(() => entscheideVorlage(world, r.vorlagen[0]!.id, id))} />
    </details>}
  </li>;
}

export function Tischkachel({ world, e, gross = false, onAntwort, refresh, onGehe, onVorgang }: KachelProps) {
  const entscheide = (f: () => Antwort) => { onAntwort(f()); refresh(); };
  const i = e.inhalt;
  // Die Pläne rechnen in Kopien der Welt: nur neu, wenn sich Tag, Kapital oder der Eintrag ändert
  const schluessel = `${world.day}|${world.spiel?.kapital}|${e.id}|${JSON.stringify(i.art === 'ressort' ? [i.anliegen, i.vorfall] : i.art === 'zusage' ? i.zusageId : '')}`;
  const lead = useMemo<{ v: Vorlage; tun: (id: string) => Antwort } | undefined>(() => {
    if (i.art === 'vorlage') return { v: i.vorlage, tun: (id) => entscheideVorlage(world, i.vorlage.id, id) };
    if (i.art === 'zusage') { const v = zusageKarte(world, i.zusageId); return v ? { v, tun: (id) => entscheideZusage(world, i.zusageId, id) } : undefined; }
    if (i.art === 'ressort') {
      if (i.anliegen) { const v = anliegenKarte(world, i.anliegen); if (v) return { v, tun: (id) => entscheideAnliegen(world, i.anliegen!, id) }; }
      if (i.vorfall) { const v = vorfallKarte(world, i.vorfall); if (v) return { v, tun: (id) => entscheideVorfall(world, i.vorfall!, id) }; }
      const v = i.vorlagen[0];
      return v ? { v, tun: (id) => entscheideVorlage(world, v.id, id) } : undefined;
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, schluessel]);
  // Was im selben Ressort außerdem offen ist: hinter einem Aufklapper (Tiefe auf Klick), nicht als eigene Zeile
  const weitere = i.art === 'ressort' ? [...(i.anliegen && i.vorfall ? [{ id: i.vorfall, titel: t('h4.r.vorfall.titel', { ressort: ressortName(i.amt), art: 'stillstand' }), art: 'vorfall' as const }] : []),
    ...i.vorlagen.filter((v) => v !== lead?.v).map((v) => ({ id: v.id, titel: v.titel, art: 'vorlage' as const, v }))] : [];

  const frist = e.tage === undefined ? (e.ton === 'rot' ? t('h4.dringend') : t('h4.ohneFrist')) : fristText(e.tage);
  const koerper = <>
    <p className="tk2-satz">{e.grund}</p>
    {lead && <Wege v={lead.v} onWaehle={(id) => entscheide(() => lead.tun(id))} />}
    {i.art === 'ressorts' && <>
      <ul className="tk2-reihen">{i.reihen.map((r) => <StillstandReihe key={r.amt} world={world} r={r} entscheide={entscheide} />)}</ul>
      <p className="tk2-ursache">{t('h4.still.ursache', { tage: RESSORT_ANLIEGEN.frist, punkte: zahl(RESSORT_STILLSTAND.groesse, 1) })}</p>
    </>}
    {i.art === 'partei' && <ul className="tk2-reihen">{i.reihen.map((r) => <ForderungReihe key={r.forderung} world={world} r={r} refresh={refresh} />)}</ul>}
    {i.art === 'vorgang' && <button type="button" className="knopf-haupt tk2-sprung" onClick={() => (onVorgang ? onVorgang(i.id) : onGehe({ art: 'akte', akte: 'programme' }))}>{t('vorgang.sprung.zum')}</button>}
    {i.art === 'sprung' && <button type="button" className="knopf-haupt tk2-sprung" onClick={() => onGehe(i.ziel)}>{t('h4.oeffnen')}</button>}
    {weitere.length > 0 && <div className="tk2-weitere"><span className="tk2-kicker">{t('h4.r.weitere')}</span>
      {weitere.map((x) => <details key={x.id} className="tk2-tiefe"><summary>{x.titel}</summary>
        {x.art === 'vorfall' ? <WegeVonVorfall world={world} id={x.id} entscheide={entscheide} /> : <Wege v={x.v!} onWaehle={(id) => entscheide(() => entscheideVorlage(world, x.id, id))} />}
      </details>)}
    </div>}
    {lead?.v.ziel && lead.v.ziel.art !== 'karte' && lead.v.ziel.art !== 'ereignis' && <button type="button" className="knopf-leise tk2-akte" onClick={() => onGehe(lead.v.ziel as VorlagenZiel as Ziel)}>{t('mf.zurAkte')}</button>}
  </>;
  if (!gross) return <div className="tk2 klein">{koerper}</div>;
  return <article className={`tk2 gross ton-${e.ton}`} aria-labelledby={`tk2-${e.id}`}>
    <div className="tk2-bild">
      <EreignisSzene thema={thema(world, e)} />
      <span className="tk2-gesicht"><Bild world={world} e={e} size={64} /></span>
      <span className={`tk2-frist ton-${e.ton}`}>{frist}</span>
    </div>
    <div className="tk2-koerper">
      <span className="tk2-kicker">{i.art === 'vorlage' ? quelleName(i.vorlage.quelle) : t(`h4.gruppe.${e.gruppe}`)}</span>
      <h4 id={`tk2-${e.id}`}>{e.titel}</h4>
      {koerper}
    </div>
  </article>;
}

function WegeVonVorfall({ world, id, entscheide }: { world: World; id: string; entscheide: (f: () => Antwort) => void }) {
  const v = useMemo(() => vorfallKarte(world, id), [world, world.day, world.spiel?.kapital, id]);
  return v ? <Wege v={v} onWaehle={(o) => entscheide(() => entscheideVorfall(world, id, o))} /> : null;
}

/** Eine Forderung an ein Ressort: eine Zeile; ein Klick öffnet die Wege (Gesetz, Etat, Absprache) aus RessortForderungsWege */
function ForderungReihe({ world, r, refresh }: { world: World; r: ForderungsReihe; refresh: () => void }) {
  const [auf, setAuf] = useState(false);
  return <li className="tk2-reihe">
    <button type="button" className="tk2-reihe-knopf" aria-expanded={auf} onClick={() => setAuf(!auf)}>
      <span className="tk2-reihe-kopf"><b>{ressortName(r.amt)}</b><span className={`tk2-reihe-frist${r.tage <= 7 ? ' rot' : ''}`}>{fristText(r.tage)}</span></span>
      <span className="tk2-reihe-wert">{t('h4.partei.reihe', { groesse: knoten(r.groesse), stand: zahl(r.stand, 0), ziel: zahl(r.ziel, 0) })} <i aria-hidden>{auf ? '▾' : '▸'}</i></span>
    </button>
    {auf && <RessortForderungsWege world={world} bezug={{ beobachtung: r.nachsorge, forderung: r.forderung }} refresh={refresh} offenStart />}
  </li>;
}

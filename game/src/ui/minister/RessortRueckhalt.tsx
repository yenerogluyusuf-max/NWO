import type { ReactNode } from 'react';
import type { RessortForderung } from '../../sim/ressortrueckhalt';
import type { RessortRueckhaltBeleg } from '../../sim/ressortrueckhalt';
import { HOCH_SCHLECHT } from '../../sim/personen';
import { NET } from '../../sim/modell';
import { formatDateDe } from '../../sim/dates';
import { t, zahl } from '../../i18n';

const name=(id:string)=>NET.nodes[NET.index.get(id)??-1]?.name??id;
const saldo=(n:number)=>`${n>0?'+':''}${zahl(n,2)}`;

/** Nur gespeicherte Reaktionen: Monatsrückblick und Live-Meldung verwenden denselben Beleg. */
export function RessortRueckhalt({beleg:b,hilfe}:{beleg?:RessortRueckhaltBeleg;hilfe?:(f:RessortForderung)=>ReactNode}) {
  if(!b)return <p className="rn-grenze">{t('rr.alt')}</p>;
  const druck=b.urteil==='druck'||b.urteil==='druckpause';
  return <section className={`rr ${druck?'rr-druck':''}`} aria-label={t('rr.titel')}>
    <div className="rr-kopf"><small>{t('rr.titel')}</small><strong>{t(`rr.urteil.${b.urteil}`)}</strong></div>
    <p>{t(`rr.erklaerung.${b.urteil}`)}</p>
    {b.grund&&<p><b>{t(`rr.grund.${b.grund}`,{n:b.stagnation})}</b></p>}
    {b.belege.map(v=><p className="rr-beleg" key={v.groesse}>{name(v.groesse)}: {zahl(v.vorher,2)} → {zahl(v.jetzt,2)} · {t(v.verbesserung>=0?'rr.neu':'rr.verlust',{n:zahl(Math.abs(v.verbesserung),2)})}</p>)}
    {!!b.parteien.length&&<details open={druck}><summary>{t('rr.gebucht')}</summary><div className="rr-fraktionen">
      {b.parteien.map(p=><article key={p.partei}><b>{p.partei}</b><small>{t(`rr.rolle.${p.rolle}`)}{p.traeger?` · ${t('rr.traeger')}`:''}</small>
        <p>{t('rr.bereit')}: <strong>{saldo(p.nachher-p.vorher)}</strong> <span>({zahl(p.vorher,2)} → {zahl(p.nachher,2)})</span></p>
        {p.personen.map((f,i)=><p key={`${f.name}-${i}`}>{t('rr.loyal',{name:f.name})}: <strong>{saldo(f.nachher-f.vorher)}</strong> <span>({zahl(f.vorher,2)} → {zahl(f.nachher,2)})</span></p>)}
      </article>)}
    </div></details>}
    {b.opposition&&<p className="rr-opposition">{t('rr.opposition',{partei:b.opposition.partei})}: <strong>{saldo(b.opposition.nachher-b.opposition.vorher)}</strong> ({zahl(b.opposition.vorher,2)} → {zahl(b.opposition.nachher,2)})</p>}
    {!!b.forderungen.length&&<div className="rr-forderungen"><h5>{t('rr.forderungen')}</h5><p>{t('rr.keineZusage')}</p>
      {b.forderungen.map(f=><article key={f.id} className={`rr-forderung rr-${f.status}`}>
        <div className="rr-kopf"><b>{f.partei} · {t(`rr.rolle.${f.rolle}`)}</b><strong>{t(`rr.status.${f.status}`)}</strong></div>
        <p>{name(f.groesse)}: {t(HOCH_SCHLECHT.has(f.groesse)?'rr.hoechstens':'rr.mindestens',{ziel:zahl(f.ziel,2)})}</p>
        <dl><div><dt>{t('rr.beiForderung')}</dt><dd>{zahl(f.ausgang,2)}</dd></div><div><dt>{t('rr.gemessen')}</dt><dd>{zahl(f.stand,2)}</dd></div><div><dt>{t('rr.frist')}</dt><dd>{formatDateDe(f.fristDatum)}</dd></div></dl>
        {f.geprueft&&<small>{t('rr.geprueft',{datum:formatDateDe(f.geprueft)})}</small>}
        {f.status==='offen'&&hilfe?.(f)}
      </article>)}
      <p>{t('rr.schritte')}</p>
    </div>}
    {b.koalition.parteien.length>0&&<p className="rr-gefahr"><b>{t('rr.gefahr',{parteien:b.koalition.parteien.join(', '),datum:formatDateDe(b.koalition.pruefung),vor:b.koalition.sitze,nach:b.koalition.danach})}</b> {t('rr.hilfe')}</p>}
    {druck&&b.naechsterDruck&&<p>{t('rr.pause',{datum:formatDateDe(b.naechsterDruck)})}</p>}
    <details><summary>{t('rr.regeln')}</summary><p>{t('rr.regel')}</p><p>{t('rr.preise')}</p><p>{t('rr.forderungsregel')}</p></details>
  </section>;
}

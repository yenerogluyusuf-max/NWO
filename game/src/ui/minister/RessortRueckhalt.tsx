import type { ReactNode } from 'react';
import type { RessortForderung } from '../../sim/ressortrueckhalt';
import type { RessortRueckhaltBeleg } from '../../sim/ressortrueckhalt';
import { HOCH_SCHLECHT } from '../../sim/personen';
import { NET } from '../../sim/modell';
import { RESSORT_NACHSORGE } from '../../sim/ressortnachsorge';
import { formatDateDe } from '../../sim/dates';
import { t, zahl } from '../../i18n';
import './ressorterholung.css';

const name=(id:string)=>NET.nodes[NET.index.get(id)??-1]?.name??id;
const saldo=(n:number)=>`${n>0?'+':''}${zahl(n,2)}`;
export const ton=(n:number)=>n>0?'gut':n<0?'schlecht':'';

/** Ein Wert als Chip: Etikett, Zahl, optional Veränderung (ENTSCHEIDUNGEN Z: Zahlen statt Sätze). */
export function Chip({label,wert,delta,umgekehrt=false,klasse='',title}:{label:ReactNode;wert?:ReactNode;delta?:number;umgekehrt?:boolean;klasse?:string;title?:string}) {
  return <span className={`rk-chip ${klasse}`.trim()} title={title}><span>{label}</span>{wert!==undefined&&<b>{wert}</b>}{delta!==undefined&&<em className={ton(umgekehrt?-delta:delta)}>{saldo(delta)}</em>}</span>;
}

/** Nur gespeicherte Reaktionen: Monatsrückblick und Live-Meldung verwenden denselben Beleg.
 *  Die Regeln der Bewertung stehen nicht mehr in jedem Beleg, sondern einmal je Liste in `RessortRegeln`. */
export function RessortRueckhalt({beleg:b,hilfe}:{beleg?:RessortRueckhaltBeleg;hilfe?:(f:RessortForderung)=>ReactNode}) {
  if(!b)return <p className="rn-grenze">{t('rr.alt')}</p>;
  const druck=b.urteil==='druck'||b.urteil==='druckpause';
  const offen=b.forderungen.filter(f=>f.status==='offen'),erledigt=b.forderungen.filter(f=>f.status!=='offen');
  return <section className={`rr ${druck?'rr-druck':''}`} aria-label={t('rr.titel')}>
    <div className="rr-kopf"><small>{t('rr.titel')}</small><strong className="rk-urteil" title={t(`rr.erklaerung.${b.urteil}`)}>{t(`rr.urteil.${b.urteil}`)}</strong></div>
    {(b.grund||b.belege.length>0||b.opposition||(druck&&b.naechsterDruck))&&<div className="rk-chips">
      {b.grund&&<Chip klasse="schlecht" label={t(`welle_b2.rr.grund.${b.grund}`,{n:b.stagnation})}/>}
      {b.belege.map(v=><Chip key={v.groesse} label={name(v.groesse)} wert={`${zahl(v.vorher,2)} → ${zahl(v.jetzt,2)}`} delta={v.verbesserung} title={t(v.verbesserung>=0?'rr.neu':'rr.verlust',{n:zahl(Math.abs(v.verbesserung),2)})}/>)}
      {b.opposition&&<Chip label={t('rr.opposition',{partei:b.opposition.partei})} wert={`${zahl(b.opposition.vorher,2)} → ${zahl(b.opposition.nachher,2)}`} delta={b.opposition.nachher-b.opposition.vorher} umgekehrt/>}
      {druck&&b.naechsterDruck&&<Chip label={t('welle_b2.rr.pause')} wert={formatDateDe(b.naechsterDruck)}/>}
    </div>}
    {b.koalition.parteien.length>0&&<div className="rk-chips rr-gefahr" role="note">
      <Chip klasse="schlecht" label={t('welle_b2.rr.gefahr',{datum:formatDateDe(b.koalition.pruefung)})} wert={t('welle_b2.rr.sitze',{vor:b.koalition.sitze,nach:b.koalition.danach})}/>
      <Chip klasse="schlecht" label={t('welle_b2.rr.unter20')} wert={b.koalition.parteien.join(', ')}/>
    </div>}
    {!!b.parteien.length&&<details open={druck}><summary>{t('rr.gebucht')}</summary>
      <table className="rk-tabelle"><thead><tr><th>{t('welle_b2.rk.fraktion')}</th><th>{t('rr.bereit')}</th><th>{t('welle_b2.rk.loyalitaet')}</th></tr></thead>
        <tbody>{b.parteien.map(p=><tr key={p.partei}>
          <td><b>{p.partei}</b> <small>{t(`rr.rolle.${p.rolle}`)}{p.traeger?` · ${t('rr.traeger')}`:''}</small></td>
          <td><span className="rk-wert">{zahl(p.vorher,2)} → {zahl(p.nachher,2)}</span> {(p.nachher-p.vorher)!==0&&<em className={ton(p.nachher-p.vorher)}>{saldo(p.nachher-p.vorher)}</em>}</td>
          <td>{p.personen.map((f,i)=><span className="rk-person" key={`${f.name}-${i}`}>{f.name} <span className="rk-wert">{zahl(f.vorher,2)} → {zahl(f.nachher,2)}</span> {(f.nachher-f.vorher)!==0&&<em className={ton(f.nachher-f.vorher)}>{saldo(f.nachher-f.vorher)}</em>}</span>)}{!p.personen.length&&'—'}</td>
        </tr>)}</tbody></table>
    </details>}
    {!!b.forderungen.length&&<div className="rr-forderungen">
      {offen.length>0?<><h5>{t('rr.forderungen')}</h5><Forderungen liste={offen} hilfe={hilfe}/></>:null}
      {erledigt.length>0&&<details><summary>{offen.length?t('welle_b2.rr.abgeschlossen',{n:erledigt.length}):<>{t('rr.forderungen')} · {t('welle_b2.rr.abgeschlossen',{n:erledigt.length})}</>}</summary><Forderungen liste={erledigt}/></details>}
    </div>}
  </section>;
}

function Forderungen({liste,hilfe}:{liste:RessortForderung[];hilfe?:(f:RessortForderung)=>ReactNode}) {
  return <table className="rk-tabelle rr-ftabelle"><thead><tr><th>{t('welle_b2.rk.fraktion')}</th><th>{t('welle_b2.rk.ziel')}</th><th>{t('rr.beiForderung')}</th><th>{t('rr.gemessen')}</th><th>{t('welle_b2.rk.frist')}</th><th>{t('welle_b2.rk.stand')}</th></tr></thead>
    <tbody>{liste.map(f=>[
      <tr key={f.id} className={`rr-forderung rr-${f.status}`}>
        <td><b>{f.partei}</b> <small>{t(`rr.rolle.${f.rolle}`)}</small></td>
        <td>{name(f.groesse)} <span className="rk-wert">{t(HOCH_SCHLECHT.has(f.groesse)?'welle_b2.rk.hoechstens':'welle_b2.rk.mindestens',{ziel:zahl(f.ziel,2)})}</span></td>
        <td className="rk-wert">{zahl(f.ausgang,2)}</td><td className="rk-wert">{zahl(f.stand,2)}</td>
        <td>{formatDateDe(f.fristDatum)}</td>
        <td><span className={`rk-status rr-s-${f.status}`} title={f.geprueft?t('rr.geprueft',{datum:formatDateDe(f.geprueft)}):undefined}>{t(`rr.status.${f.status}`)}</span></td>
      </tr>,
      f.status==='offen'&&hilfe?<tr key={`${f.id}-wege`} className="rr-wege"><td colSpan={6}>{hilfe(f)}</td></tr>:null,
    ])}</tbody></table>;
}

/** Die Regeln der Erholungsbewertung, einmal je Liste statt in jedem Beleg. Zahlen wie in sim/ressortrueckhalt.ts (Z. 82–128)
 *  und sim/ressortnachsorge.ts (RESSORT_NACHSORGE). */
const PREISE:{zeile:'fortschritt'|'bestaetigt'|'druck';werte:string[]}[]=[
  {zeile:'fortschritt',werte:['+2','+2','+1','0','+1','−1']},
  {zeile:'bestaetigt',werte:['+4','+4','+2','+1','+1','−2']},
  {zeile:'druck',werte:['−3','−2','−2','−1','−1','+2']},
];
export function RessortRegeln() {
  const e=RESSORT_NACHSORGE.entwarnung;
  const zeilen:[string,string][]=[
    [t('welle_b2.rg.takt'),t('welle_b2.rg.taktWert',{takt:RESSORT_NACHSORGE.takt,stabil:RESSORT_NACHSORGE.stabilTakt})],
    [t('welle_b2.rg.entwarnung'),t('welle_b2.rg.entwarnungWert',{schaedlich:e,nuetzlich:100-e})],
    [t('welle_b2.rg.schritt'),t('welle_b2.rg.schrittWert',{n:RESSORT_NACHSORGE.schritt})],
    [t('welle_b2.rg.druck'),t('welle_b2.rg.druckWert')],
    [t('welle_b2.rg.forderung'),t('welle_b2.rg.forderungWert')],
    [t('welle_b2.rg.grenze'),t('welle_b2.rg.grenzeWert')],
  ];
  return <details className="rk-regeln"><summary>{t('rr.regeln')}</summary>
    <table className="rk-tabelle"><tbody>{zeilen.map(([a,b])=><tr key={a}><th scope="row">{a}</th><td>{b}</td></tr>)}</tbody></table>
    <table className="rk-tabelle rk-preise"><thead><tr><th>{t('welle_b2.rg.preise')}</th>{[1,2,3,4,5,6].map(i=><th key={i}>{t(`welle_b2.rg.spalte${i}`)}</th>)}</tr></thead>
      <tbody>{PREISE.map(z=><tr key={z.zeile}><th scope="row">{t(`welle_b2.rg.zeile.${z.zeile}`)}</th>{z.werte.map((w,i)=><td key={i} className="rk-wert">{w}</td>)}</tr>)}</tbody></table>
    <p className="rk-fuss">{t('welle_b2.rg.fuss')}</p>
  </details>;
}

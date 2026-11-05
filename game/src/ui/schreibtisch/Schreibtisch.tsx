// Ein Arbeitsplatz: Lage verstehen, einen Vorgang entscheiden, später seine Wirkung prüfen.
import { WAHLKAMPF } from "../../sim/wahlkampf";
import { useId, useState } from 'react';
import type { World } from '../../sim/types';
import type { Amt, VorlagenZiel } from '../../sim/ministerfluss-typen';
import { schreibtischMappe } from '../../sim/ministerfluss';
import { gefaehrdeteZusagen } from '../../sim/zusagenwarnung';
import { AEMTER } from '../../sim/personen';
import { VersorgungsMonatsbericht } from '../gueter/VersorgungsMonatsbericht';
import { zusageText } from '../../sim/zusagen';
import { formatDateDe } from '../../sim/dates';
import { zielStand } from '../../sim/ziele';
import { offenerKonflikt, vorgaenge } from '../../sim/vorgaenge';
import { epochenSicht } from '../../sim/epoche';
import { PROVINZEN } from '../../sim/regional';
import { mentorNotes } from '../mentor';
import { Icon } from '../icons';
import { Cameo } from '../art/Cameo';
import { Mappe } from '../minister/Mappe';
import { RessortAnliegenKarten } from '../minister/RessortAnliegen';
import { RessortErholung } from '../minister/RessortErholung';
import { Krisenrat } from '../wirtschaft/Krisenrat';
import { ZusagenWache } from './ZusagenWache';
import { DreiFragen } from './DreiFragen';
import { RessortTischkarten, ZusageTischkarte } from './Tischkarte';
import { tageslage, type Ziel } from './briefing';
import { aktuelleAuswahl, fristText, schreibtischArbeit, regierungsVorgaenge, type ArbeitsGruppe, type Prioritaet } from './arbeitsplatz';
import type { UmlaufEintrag } from '../autostopp';
import { rendere, t } from '../../i18n';
import '../politik/design.css';
import './schreibtisch.css';

const KENNZAHLEN = new Set(['zustimmung','kapital','mehrheit','preise']);
type Arbeit=ReturnType<typeof schreibtischArbeit>;
type Auswahl={vorlagen?:string;minister?:string;zusagen?:string;beobachtung?:string};
type GemeinsameProps={world:World;refresh:()=>void;onGehe:(z:Ziel)=>void};

function AuswahlKarten({titel,karten,auswahl,onAuswahl}:{titel:string;karten:{id:string;titel:string;unter:string;frist?:number}[];auswahl?:string;onAuswahl:(id:string)=>void}) {
  return <div className="sd-auswahl" role="group" aria-label={titel}>{karten.map(k=><button type="button" className="sd-auswahlkarte" key={k.id} aria-pressed={auswahl===k.id} onClick={()=>onAuswahl(k.id)}>
    <strong>{k.titel}</strong><span>{k.unter}</span>{k.frist!==undefined&&<small>{fristText(k.frist)}</small>}
  </button>)}</div>;
}

/** Nur der gewählte Vorgang erzeugt die ausführlichen und teilweise aufwendigen Handlungspläne. */
export function SchreibtischEntscheidungen({world,refresh,onGehe,arbeit,zusagen,gruppe,auswahl,onAuswahl,onPosteingang,onKarte}:GemeinsameProps&{
  arbeit:Arbeit;zusagen:ReturnType<typeof gefaehrdeteZusagen>;gruppe:ArbeitsGruppe;auswahl:Auswahl;onAuswahl:(gruppe:keyof Auswahl,id:string)=>void;
  onPosteingang:()=>void;onKarte?:(problemId?:string)=>void;
}) {
  const gehe=(z:VorlagenZiel)=>z.art==='karte'?onKarte?.(z.problemId):onGehe(z as Ziel);
  if(gruppe==='vorlagen')return <Mappe world={world} refresh={refresh} ohneRessorts fokus vorlageId={auswahl.vorlagen} onAuswahl={id=>onAuswahl('vorlagen',id)} onGehe={gehe} onPosteingang={onPosteingang} onKarte={onKarte}/>;
  if(gruppe==='minister') {
    const minister=aktuelleAuswahl(arbeit.minister,auswahl.minister);
    const amt=auswahl.minister&&Object.hasOwn(AEMTER,auswahl.minister)?auswahl.minister as Amt:undefined;
    return <><AuswahlKarten titel={t('sd.minister')} karten={arbeit.minister.map(m=>({id:m.id,titel:m.name,unter:t('sd.anliegenZahl',{n:m.anzahl})}))} auswahl={auswahl.minister} onAuswahl={id=>onAuswahl('minister',id)}/>
      {!minister&&<p className="sd-leer">{t(!arbeit.minister.length?'sd.keinMinister':auswahl.minister?'sd.erledigt':'sd.auswaehlen')}</p>}
      {amt&&<div data-sd-detail tabIndex={-1} role="region" aria-label={AEMTER[amt].ressort}><RessortAnliegenKarten key={amt} world={world} refresh={refresh} amt={amt} mitNachsorge={false}/></div>}</>;
  }
  const zusage=aktuelleAuswahl(zusagen.map(z=>({id:z.z.id,z})),auswahl.zusagen);
  return <><AuswahlKarten titel={t('sd.zusagen')} karten={zusagen.map(z=>({id:z.z.id,titel:zusageText(z.z),unter:`${z.partei} · ${t(`zw.rolle.${z.rolle}`)}`,frist:z.erinnerung?z.erinnerung.frist-world.day:z.tage}))} auswahl={auswahl.zusagen} onAuswahl={id=>onAuswahl('zusagen',id)}/>
    {!zusage&&<p className="sd-leer">{t(!zusagen.length?'sd.keineZusage':auswahl.zusagen?'sd.erledigt':'sd.auswaehlen')}</p>}
    {auswahl.zusagen&&<div data-sd-detail tabIndex={-1} role="region" aria-label={t('sd.zusagen')}><ZusagenWache key={auswahl.zusagen} world={world} refresh={refresh} onGehe={onGehe} zusageId={auswahl.zusagen}/></div>}
    <button type="button" className="pd-btn quiet" onClick={()=>onGehe({art:'zusagen'})}>{t('zw.alleZusagen')}</button></>;
}

export function SchreibtischInArbeit({world,refresh,onGehe,arbeit,auswahl,onAuswahl,onVorgang}:GemeinsameProps&{
  arbeit:Arbeit;auswahl?:string;onAuswahl:(id:string)=>void;onVorgang?:(id:string)=>void;
}) {
  const regierung=regierungsVorgaenge(world);
  const faellig=tageslage(world).faellig.filter(f=>f.art==='gesetz'||f.art==='schritt');
  const laufend=vorgaenge(world).filter(v=>v.schritt!=='abgeschlossen'&&v.schritt!=='aufgegeben');
  const minister=aktuelleAuswahl(arbeit.beobachtet,auswahl);
  return <div className="sd-arbeit">
    <section className="sd-block"><h4>{t('sd.wirkungPruefen')}</h4><p className="sd-hinweis">{t('sd.wirkungText')}</p>
      <AuswahlKarten titel={t('sd.wirkungPruefen')} karten={arbeit.beobachtet.map(m=>({id:m.id,titel:m.name,unter:t(m.forderungen?'sd.forderungen':'sd.beobachtung',{n:m.forderungen})}))} auswahl={auswahl} onAuswahl={onAuswahl}/>
      {minister?<div data-sd-detail tabIndex={-1} role="region" aria-label={minister.name}><RessortErholung key={minister.id} world={world} refresh={refresh} amt={minister.amt}/></div>:
        <p className="sd-leer">{t(!arbeit.beobachtet.length?'sd.keineBeobachtung':auswahl?'sd.erledigt':'sd.auswaehlen')}</p>}
    </section>
    <section className="sd-block"><h4>{t('sd.laufendeBeschluesse')}</h4>
      {!faellig.length&&!regierung.length&&<p className="sd-hinweis">{t('sd.keineBeschluesse')}</p>}
      <ul className="sd-vorgaenge">{regierung.map(g=><li key={g.id}><div><span className="sd-etikett">{g.status} · {formatDateDe(g.datum)}</span><h5>{g.titel}</h5><p>{g.unter}</p></div><button type="button" className="pd-btn" onClick={()=>onGehe(g.ziel)}>{t('sd.vorgangOeffnen')}</button></li>)}{faellig.map(f=><li key={f.id}><div><span className="sd-etikett">{f.art==='gesetz'?t('sd.beratung'):t('sk.bereit')}</span><h5>{f.titel}</h5><p>{f.unter}</p></div>
        {f.knopf.art==='gehe'&&<button type="button" className="pd-btn" onClick={()=>{if(f.knopf.art==='gehe')onGehe(f.knopf.ziel);}}>{f.knopf.label}</button>}
      </li>)}</ul>
      <div className="sd-links"><button type="button" className="pd-btn quiet" onClick={()=>onGehe({art:'akte',akte:'wirtschaft',start:'haushalt'})}>{t('sd.haushalt')}</button><button type="button" className="pd-btn quiet" onClick={()=>onGehe({art:'akte',akte:'wirtschaft',start:'inventar'})}>{t('sd.versorgung')}</button></div>
    </section>
    {laufend.length>0&&<section className="sd-block"><h4>{t('vorgang.sprung.titel')}</h4><ul className="sd-vorgaenge">{laufend.map(v=><li key={v.id}><div><span className="sd-etikett">{offenerKonflikt(v)?t('vorgang.ui.entscheiden'):t(`vorgang.ui.schritt.${v.schritt}`)}</span><h5>{t('vorgang.ui.titel',{ort:PROVINZEN[v.plaka-1]?.name??String(v.plaka)})}</h5></div><button type="button" className="pd-btn" onClick={()=>onVorgang?onVorgang(v.id):onGehe({art:'akte',akte:'programme'})}>{t('vorgang.sprung.zum')}</button></li>)}</ul></section>}
  </div>;
}

export function SchreibtischRueckblick({world,onGehe,onPosteingang,umlauf}:{world:World;onGehe:(z:Ziel)=>void;onPosteingang:()=>void;umlauf?:UmlaufEintrag[]}) {
  const ziele=zielStand(world),geschah=[...world.log].reverse().filter(l=>l.kind!=='statistik').slice(0,6);
  const ausgabe=world.spiel?.zeitung?.archiv.at(-1),blatt=ausgabe?.blaetter.find(b=>b.artikel.length);
  return <div className="sd-rueckblick">
    <section className="sd-bericht"><Icon name="buch" size={30}/><div><span className="sd-etikett">{t('sd.ergebnisse')}</span><h4>{t('sd.monatsbericht')}</h4><p>{t('sd.berichtText')}</p><details className="sd-berichtdetail"><summary>{t('sd.berichtOeffnen')}</summary><VersorgungsMonatsbericht bericht={world.spiel?.gueter?.regierung?.bericht}/></details></div></section>
    <section className="sd-block"><h4>{t('sk.ui.zuletzt')}</h4>{geschah.length?<ol className="sd-verlauf">{geschah.map((l,i)=><li key={`${l.day}-${i}`}><time>{formatDateDe(l.date)}</time><p>{rendere(l.text)}</p></li>)}</ol>:<p className="sd-hinweis">{t('sd.keinVerlauf')}</p>}
      <div className="sd-links"><button type="button" className="pd-btn quiet" onClick={()=>onGehe({art:'akte',akte:'chronik'})}>{t('sk.ui.chronik')}</button><button type="button" className="pd-btn quiet" onClick={onPosteingang}>{t('sd.mappenverlauf')}</button></div>
    </section>
    {ausgabe&&<section className="sd-block"><span className="sd-etikett">{blatt?.name??t('sk.ui.zeitung')} · {formatDateDe(ausgabe.datum)}</span><h4>{blatt?.artikel[0]?.schlagzeile}</h4><button type="button" className="pd-btn quiet" onClick={()=>onGehe({art:'akte',akte:'zeitung'})}>{t('sk.ui.ausgabeLesen')}</button></section>}
    {ziele.length>0&&<details className="sd-details"><summary>{t('sk.ui.ziele')}</summary><ul className="sd-ziele">{ziele.map(z=><li key={z.def.id}><span aria-hidden>{z.erreicht?'✓':'○'}</span><div><strong>{z.def.titel}</strong><p>{z.stand}</p></div></li>)}</ul></details>}
    {!!umlauf?.length&&<details className="sd-details"><summary>{t('sk.ui.umlauf')}</summary><p>{t('sk.ui.umlaufText')}</p><ol className="sd-verlauf">{[...umlauf].reverse().map(u=><li key={u.id}><time>{u.datum}</time><p><b>{u.titel}</b> {u.text}</p></li>)}</ol></details>}
  </div>;
}

/** Amtszeit-Epoche (sim/epoche.ts): Wert, Aussicht und die letzten historischen Momente */
function EpochenBand({world}:{world:World}){
  const e=epochenSicht(world);if(!e)return null;
  return <section className={`sd-epoche ${e.aussicht}`} aria-label={t('epoche.ui.titel',{nr:e.amtszeit})}>
    <div className="sd-epoche-kopf"><span className="sd-epoche-siegel" aria-hidden>{e.aussicht==='golden'?'☀':e.aussicht==='heroisch'?'✦':e.aussicht==='dunkel'?'☾':'◆'}</span>
      <div><span className="sd-epoche-kicker">{t('epoche.ui.titel',{nr:e.amtszeit})}</span><strong>{t('epoche.ui.aussicht',{stufe:t(`epoche.stufe.${e.aussicht}`)})}</strong>
      <small>{t('epoche.ui.wert',{wert:e.wert>0?`+${e.wert}`:String(e.wert)})}{e.bisGolden>0&&e.aussicht!=='golden'&&e.aussicht!=='heroisch'?` · ${t('epoche.ui.bis',{n:e.bisGolden})}`:''}</small></div></div>
    {e.momente.length?<ul className="sd-epoche-momente">{e.momente.map(m=><li key={m.tag+m.id} className={m.wert>0?'gut':'schlecht'}><b>{m.wert>0?`+${m.wert}`:m.wert}</b> {m.titel}</li>)}</ul>:<p className="sd-epoche-leer" title={t('epoche.ui.erklaerung')}>{t('epoche.ui.keine')}</p>}
  </section>;
}

/** Die Entscheidung zu einem Eintrag des Tisches, direkt unter seiner Zeile. */
function TischDetail({world,refresh,onGehe,p,onKarte,onPosteingang}:GemeinsameProps&{p:Prioritaet;onKarte?:(problemId?:string)=>void;onPosteingang:()=>void}){
  const s=p.sprung;if(s.art!=='intern')return null;
  const gehe=(z:VorlagenZiel)=>z.art==='karte'?onKarte?.(z.problemId):onGehe(z as Ziel);
  const {gruppe,bereich,id}=s.auswahl;
  if(gruppe==='vorlagen'&&id)return <Mappe world={world} refresh={refresh} ohneRessorts fokus nurKarte vorlageId={id} onGehe={gehe} onPosteingang={onPosteingang} onKarte={onKarte}/>;
  if(gruppe==='minister'&&id&&Object.hasOwn(AEMTER,id))return bereich==='arbeit'?<RessortErholung world={world} refresh={refresh} amt={id as Amt}/>:<RessortTischkarten world={world} refresh={refresh} amt={id as Amt} onGehe={gehe}/>;
  if(gruppe==='zusagen'&&id)return <ZusageTischkarte world={world} refresh={refresh} onGehe={onGehe} zusageId={id}/>;
  return null;
}

export function Schreibtisch({world,refresh,onGehe,umlauf,onKarte,onPosteingang,onVorgang}:GemeinsameProps&{
  umlauf?:UmlaufEintrag[];onKarte?:(problemId?:string)=>void;onPosteingang?:()=>void;onVorgang?:(id:string)=>void;
}) {
  // Vorgabe V (ENTSCHEIDUNGEN): Der Schreibtisch beantwortet eine Frage, „Was muss ich heute entscheiden?“. Eine Liste nach
  // Dringlichkeit; die Entscheidung öffnet sich an der Zeile. Früher standen dieselben Vorgänge in „Jetzt wichtig“ und noch einmal
  // im Arbeitsbereich, und die Entscheidung erschien am Ende der Liste.
  const [krisenOffen,setKrisenOffen]=useState(false);
  // undefined: der dringendste Eintrag mit eigener Entscheidung steht offen; null: bewusst alles zugeklappt
  const [wahl,setWahl]=useState<string|null|undefined>(undefined);
  const liste=useId();
  const b=world.spiel?tageslage(world):null;
  if(!world.spiel||!b)return <p>{t('sk.ui.keinBriefing')}</p>;
  const mappe=schreibtischMappe(world,5),zusagen=gefaehrdeteZusagen(world),arbeit=schreibtischArbeit(world,b,mappe.mappe,zusagen);
  const posteingang=onPosteingang??(()=>onGehe({art:'akte',akte:'personen'}));
  const offen=wahl===undefined?arbeit.alle.find(p=>p.sprung.art==='intern')?.id??null:wahl;
  const oeffne=(p:Prioritaet)=>{
    const s=p.sprung;
    if(s.art==='extern'){onGehe(s.ziel);return;}
    if(s.art==='vorgang'){if(onVorgang)onVorgang(s.id);else onGehe({art:'akte',akte:'programme'});return;}
    setWahl(offen===p.id?null:p.id);
  };
  const fristen=[...regierungsVorgaenge(world).map(g=>({id:g.id,text:g.titel,wann:`${g.status} · ${formatDateDe(g.datum)}`,tage:g.tage,ziel:g.ziel})),...b.faellig.filter(f=>f.art==='gesetz'||f.art==='duldung'||f.art==='schritt').map(f=>({id:f.id,text:f.titel,wann:f.tage===undefined?t('sk.bereit'):fristText(f.tage),tage:f.tage??0,ziel:f.knopf.art==='gehe'?f.knopf.ziel:undefined})),
    ...b.termine.filter(x=>!x.id.startsWith('g-')&&!x.id.startsWith('z-')).map(x=>({id:`t-${x.id}`,text:x.text,wann:x.datum,tage:x.tage,ziel:x.ziel})),
    // Der Wahlkampf kündigt sich an: Wer ihn nicht vorbereitet, verliert am Wahltag rund acht Punkte an Angriffe, Duell und Lager (Messung 5. November)
    ...(()=>{const sp=world.spiel;if(!sp||sp.ende)return [];const tage=sp.wahltag-WAHLKAMPF.beginnTage-world.day;return tage>0&&tage<=180?[{id:'wahlkampf-beginn',text:t('sd.wahlkampfFrist'),wann:fristText(tage),tage,ziel:{art:'akte' as const,akte:'wahlkampf' as const}}]:[];})()].sort((a,c)=>a.tage-c.tage).slice(0,6);
  const notizen=mentorNotes(world),v=b.verfassung;
  return <div className="sk sk2">
    <header className="sk2-kopf">
      <div><p className="sk2-datum">{b.datum}</p><p>{t('sk.ui.amtszeit',{n:b.amtszeit.nummer,monate:b.amtszeit.monateBisWahl,wahltag:b.amtszeit.wahltag})}</p></div>
      <ul className="sk2-zahlen" aria-label={t('sk.ui.lageAria')}>{b.kennzahlen.filter(k=>KENNZAHLEN.has(k.id)).map(k=><li key={k.id}><button type="button" className={`ton-${k.ton}`} onClick={()=>onGehe(k.ziel)} title={`${k.zusatz} · ${t('sk.ui.akteOeffnen',{label:k.label})}`}><span>{k.label}</span><strong>{k.wert}{k.trend!=='gleich'&&<em aria-hidden>{k.trend==='auf'?'↑':'↓'}</em>}</strong></button></li>)}</ul>
    </header>
    <div className="sk2-layout">
      <div className="sk2-haupt">
        <section className="sk2-tisch" aria-labelledby={`${liste}-titel`}>
          <h4 id={`${liste}-titel`}>{t('sd.aufDemTisch')} <span>{arbeit.alle.length}</span></h4>
          {arbeit.alle.length===0?<p className="sd-leer">{t('sd.nichtsAufDemTisch')}</p>:<ol>{arbeit.alle.map(p=>{
            const intern=p.sprung.art==='intern',auf=offen===p.id;
            return <li key={p.id} className={`sk2-zeile ton-${p.ton}${auf?' on':''}`}>
              <button type="button" className="sk2-knopf" aria-expanded={intern?auf:undefined} aria-controls={intern?`${liste}-${p.id}`:undefined} onClick={()=>oeffne(p)}>
                <i aria-hidden className="sk2-punkt"/>
                <span className="sk2-text"><strong>{p.titel}</strong><small>{p.grund}</small></span>
                <span className="sk2-frist">{p.tage===undefined?t(p.ton==='rot'?'sd.akut':p.ton==='gelb'?'sd.achtung':'sd.vorlage'):fristText(p.tage)}</span>
                <span className="sk2-pfeil" aria-hidden>{intern?(auf?'▾':'▸'):'↗'}</span>
              </button>
              {auf&&<div id={`${liste}-${p.id}`} className="sk2-detail" data-sd-detail tabIndex={-1}><TischDetail world={world} refresh={refresh} onGehe={onGehe} p={p} onKarte={onKarte} onPosteingang={posteingang}/></div>}
            </li>;})}</ol>}
          {mappe.weitere>0&&<p className="sk2-weitere">{t('mf.weitere',{n:mappe.weitere})}. <button type="button" className="pd-btn quiet" onClick={posteingang}>{t('mf.zumPosteingang')}</button></p>}
        </section>
        <details className="sd-details sk2-mehr"><summary>{t('sd.arbeit')}</summary><SchreibtischInArbeit world={world} refresh={refresh} onGehe={onGehe} arbeit={arbeit} onAuswahl={()=>{}} onVorgang={onVorgang}/></details>
        <details className="sd-details sk2-mehr"><summary>{t('sd.rueckblick')}</summary><SchreibtischRueckblick world={world} onGehe={onGehe} onPosteingang={posteingang} umlauf={umlauf}/></details>
        <details className="sd-krisenrat" onToggle={e=>setKrisenOffen(e.currentTarget.open)}><summary><Icon name="kuppel" size={22}/>{t("kp.titel")}<small>{t("kp.einstieg")}</small></summary>{krisenOffen&&<Krisenrat world={world} geaendert={refresh}/>}</details>
      </div>
      <aside className="sd-seite">
        <section className="sd-kalender"><h4><Icon name="akte" size={18}/>{t('sk.ui.fristen')}</h4>{fristen.length?<ol>{fristen.map(f=><li key={f.id}>{f.ziel?<button type="button" onClick={()=>f.ziel&&onGehe(f.ziel)}><time>{f.wann}</time><span>{f.text}</span><span aria-hidden>↗</span></button>:<div><time>{f.wann}</time><span>{f.text}</span></div>}</li>)}</ol>:<p>{t('sk.ui.keineFrist')}</p>}</section>
        {v&&<section className={`sd-kraft stufe-${v.stufe}`}><header><span>{t('sd.handlungsspielraum')}</span><b>{v.stufeName}</b></header><div className="sd-kraftwerte"><label>{t('sk.ui.aufmerksamkeit')} <b>{v.aufmerksamkeit}</b><meter min={0} max={100} value={v.aufmerksamkeit}/></label><label>{t('sk.ui.belastung')} <b>{v.belastung}</b><meter min={0} max={100} value={v.belastung}/></label></div>{v.pauseBis&&<p>{t('sk.ui.ruhigBis',{datum:v.pauseBis})}</p>}<details><summary>{t('sk.ui.mehrErklaeren')}</summary><p>{t('sk.ui.vfText',{fluss:v.fluss})}</p>{v.treiber.length>0&&<p>{t('sk.ui.vfTreiber',{liste:v.treiber.join('; ')})}</p>}</details></section>}
        <EpochenBand world={world}/>
        <details className="sd-details sd-mentorin"><summary><Cameo seed="Defne Arslan" figure="f" glasses size={28} tint="#265a62"/>{t('sk.ui.mentorin')}</summary><DreiFragen world={world}/>{notizen.map((n,i)=><details key={i}><summary>{n.short}</summary><p>{n.more}</p></details>)}</details>
        <nav className="sd-tueren" aria-label={t('sk.ui.weiterAria')}><button type="button" onClick={posteingang}><Icon name="person" size={18}/>{t('sk.ui.alleVorlagen')} <span aria-hidden>↗</span></button><button type="button" onClick={()=>onGehe({art:'akte',akte:'bereiche'})}><Icon name="netz" size={18}/>{t('sk.ui.heute')} <span aria-hidden>↗</span></button></nav>
      </aside>
    </div>
  </div>;
}

// Ein Arbeitsplatz: Lage verstehen, einen Vorgang entscheiden, später seine Wirkung prüfen.
import { useId, useState } from 'react';
import type { World } from '../../sim/types';
import type { Amt, VorlagenZiel } from '../../sim/ministerfluss-typen';
import { schreibtischMappe } from '../../sim/ministerfluss';
import { gefaehrdeteZusagen } from '../../sim/zusagenwarnung';
import { AEMTER } from '../../sim/personen';
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
import { Tischkachel, type Antwort } from './Tischkachel';
import { lageSatz } from '../minister/VorlageKarte';
import { tageslage, type Ziel } from './briefing';
import { aktuelleAuswahl, fristText, schreibtischArbeit, regierungsVorgaenge, tischFristen, TISCH_GRUPPEN, type ArbeitsGruppe, type Prioritaet } from './arbeitsplatz';
import type { UmlaufEintrag } from '../autostopp';
import { rendere, t, zahl } from '../../i18n';
import '../politik/design.css';
import '../wirtschaft/haushalt.css';
import './schreibtisch.css';

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
  const bericht=world.spiel?.gueter?.regierung?.bericht;
  return <div className="sd-rueckblick">
    {/* Kein weißes Blatt mit dem ganzen Monatsbericht (ENTSCHEIDUNGEN Z, Rückmeldung 06.11.2026): Kennzahlen und ein Sprung zum Bericht */}
    <section className="sd-bericht hd-bilanz" aria-label={t('sd.monatsbericht')}>
      <h4 className="hd-titel">{bericht?t('h4.bericht.titel',{monat:bericht.monat}):t('sd.monatsbericht')}</h4>
      {bericht?<dl className="hd-kern">
        <div><dt>{t('h4.bericht.deckung')}</dt><dd>{t('h4.prozent',{n:zahl(bericht.deckung*100,1)})}</dd></div>
        {(()=>{const v=Math.round(bericht.vertrauen*10)/10;return <div className={v<0?'schlecht':undefined}><dt>{t('h4.bericht.vertrauen')}</dt><dd>{v>0?'+':''}{zahl(v===0?0:v,1)}</dd></div>;})()}
        {bericht.parlamentarisch&&<div className={bericht.parlamentarisch==='kritik'?'schlecht':undefined}><dt>{t('h4.bericht.parlament')}</dt><dd>{t(`vm.urteil.${bericht.parlamentarisch}`)}</dd></div>}
      </dl>:<p className="hd-fenster">{t('vm.nochNicht')}</p>}
      <button type="button" className="knopf" onClick={()=>onGehe({art:'akte',akte:'wirtschaft',start:'inventar'})}>{t('h4.bericht.oeffnen')}</button>
    </section>
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

type Reiter='heute'|'arbeit'|'rueckblick'|'krisenrat';
const REITER:Reiter[]=['heute','arbeit','rueckblick','krisenrat'];

export function Schreibtisch({world,refresh,onGehe,umlauf,onKarte,onPosteingang,onVorgang}:GemeinsameProps&{
  umlauf?:UmlaufEintrag[];onKarte?:(problemId?:string)=>void;onPosteingang?:()=>void;onVorgang?:(id:string)=>void;
}) {
  // Rückmeldung des Inhabers 06.11.2026 („Schreibtisch ist eine Katastrophe … ich kann hier auch nichts machen“): Eine Frage oben, die
  // höchstens drei wichtigsten Entscheidungen als Karten mit Bild und Wegen, darunter alles Weitere gruppiert und die Lage in einem ruhigen
  // Block. Keine Datumskarte mehr (das Datum steht in der Kopfleiste), „In Arbeit“, „Rückblick“ und Krisenrat sind Reiter.
  const [reiter,setReiter]=useState<Reiter>('heute');
  const [offen,setOffen]=useState<string|null>(null);
  const [antwort,setAntwort]=useState<Antwort|null>(null);
  // Gewählter Minister unter „In Arbeit“: vorher ging die Auswahl ins Leere (onAuswahl ohne Wirkung), die Karten öffneten nichts
  const [arbeitWahl,setArbeitWahl]=useState<string|undefined>(undefined);
  const id=useId();
  const b=world.spiel?tageslage(world):null;
  if(!world.spiel||!b)return <p>{t('sk.ui.keinBriefing')}</p>;
  const mappe=schreibtischMappe(world,5),zusagen=gefaehrdeteZusagen(world),arbeit=schreibtischArbeit(world,b,mappe.mappe,zusagen);
  const posteingang=onPosteingang??(()=>onGehe({art:'akte',akte:'personen'}));
  const oben=arbeit.highlights,rest=arbeit.alle.slice(oben.length),fristen=tischFristen(world,b);
  const rot=arbeit.alle.filter(p=>p.ton==='rot').length;
  const notizen=mentorNotes(world),v=b.verfassung;
  const kachel={world,refresh,onGehe,onKarte,onVorgang,onAntwort:setAntwort};
  const oeffne=(p:Prioritaet)=>{
    if(p.inhalt.art==='vorgang'){if(onVorgang)onVorgang(p.inhalt.id);else onGehe({art:'akte',akte:'programme'});return;}
    if(p.inhalt.art==='sprung'){onGehe(p.inhalt.ziel);return;}
    setOffen(offen===p.id?null:p.id);
  };
  const zeile=(p:Prioritaet)=>{const auf=offen===p.id,innen=p.inhalt.art!=='vorgang'&&p.inhalt.art!=='sprung';
    return <li key={p.id} className={`sk3-zeile ton-${p.ton}${auf?' on':''}`}>
      <button type="button" className="sk3-knopf" aria-expanded={innen?auf:undefined} aria-controls={innen?`${id}-${p.id}`:undefined} onClick={()=>oeffne(p)}>
        <i aria-hidden className="sk3-punkt"/><span className="sk3-text">{p.titel}</span>
        <span className="sk3-frist">{p.tage===undefined?(p.ton==='rot'?t('h4.dringend'):''):fristText(p.tage)}</span>
        <span className="sk3-pfeil" aria-hidden>{innen?(auf?'▾':'▸'):'↗'}</span>
      </button>
      {auf&&<div id={`${id}-${p.id}`} className="sk3-detail" data-sd-detail tabIndex={-1}><Tischkachel {...kachel} e={p}/></div>}
    </li>;};
  return <div className="sk sk3">
    <header className="sk3-kopf">
      <p className="sk3-amtszeit">{t('sk.ui.amtszeit',{n:b.amtszeit.nummer,monate:b.amtszeit.monateBisWahl,wahltag:b.amtszeit.wahltag})}</p>
      <div className="sk3-reiter" role="tablist" aria-label={t('sd.arbeitsbereiche')}>
        {REITER.map(r=><button key={r} type="button" role="tab" aria-selected={reiter===r} className={reiter===r?'on':undefined} onClick={()=>setReiter(r)}>
          {t(r==='heute'?'h4.reiter.heute':r==='arbeit'?'sd.arbeit':r==='rueckblick'?'sd.rueckblick':'h4.reiter.krisenrat')}{r==='heute'&&arbeit.alle.length>0&&<span>{arbeit.alle.length}</span>}
        </button>)}
      </div>
    </header>
    {reiter==='heute'&&<>
      <section className="sk3-frage" aria-labelledby={`${id}-frage`}>
        <h3 id={`${id}-frage`}>{t('h4.frage')}</h3>
        <p>{t('h4.frageUnter',{n:arbeit.alle.length,rot})}</p>
      </section>
      {antwort&&<p className={`sk3-antwort ${antwort.ok?'ok':'nein'}`} role="status">{antwort.text}{antwort.why&&<em> {antwort.why}</em>}<button type="button" className="knopf-leise" onClick={()=>setAntwort(null)} aria-label={t('h4.schliessen')}>×</button></p>}
      {oben.length?<ol className="sk3-kacheln">{oben.map(p=><li key={p.id}><Tischkachel {...kachel} e={p} gross/></li>)}</ol>:<p className="sk3-leer">{t('sd.nichtsAufDemTisch')}</p>}
      <div className="sk3-unten">
        <section className="sk3-liste" aria-label={t('h4.weiter')}>
          <h4>{t('h4.weiter')}</h4>
          {TISCH_GRUPPEN.map(g=>{const zeilen=rest.filter(p=>p.gruppe===g),termine=g==='fristen'?fristen:[];
            if(!zeilen.length&&!termine.length)return null;
            return <div key={g} className="sk3-gruppe"><h5>{t(`h4.gruppe.${g}`)}</h5><ol>{zeilen.map(zeile)}
              {termine.map(f=><li key={f.id} className="sk3-zeile termin"><button type="button" className="sk3-knopf" onClick={()=>onGehe(f.ziel)}>
                <i aria-hidden className="sk3-punkt"/><span className="sk3-text">{f.text}</span><span className="sk3-frist">{f.wann}</span><span className="sk3-pfeil" aria-hidden>↗</span></button></li>)}
            </ol></div>;})}
          {mappe.weitere>0&&<p className="sk3-weitere">{t('mf.weitere',{n:mappe.weitere})}. <button type="button" className="knopf-leise" onClick={posteingang}>{t('mf.zumPosteingang')}</button></p>}
        </section>
        <aside className="sk3-seite">
          <section className="sk3-lage" aria-labelledby={`${id}-lage`}>
            <h4 id={`${id}-lage`}>{t('h4.lage')}</h4>
            {arbeit.lage.length?<ul>{arbeit.lage.map(l=><li key={l.id} className={`ton-${l.ton}`}><button type="button" onClick={()=>onGehe(l.ziel)} title={l.warum}>
              <i aria-hidden className="sk3-punkt"/><span><strong>{l.text}</strong><small>{lageSatz(l.warum).satz}</small></span><span aria-hidden>↗</span></button></li>)}</ul>:<p>{t('h4.lageLeer')}</p>}
          </section>
          {v&&<section className={`sk3-kraft stufe-${v.stufe}`} aria-label={t('sd.handlungsspielraum')}>
            <h4>{t('sd.handlungsspielraum')}</h4><b className="sk3-kraft-stufe">{v.stufeName}</b>
            <dl><div><dt>{t('sk.ui.aufmerksamkeit')}</dt><dd>{v.aufmerksamkeit}</dd></div><div className={v.stufe>=1?'schlecht':undefined}><dt>{t('sk.ui.belastung')}</dt><dd>{v.belastung}</dd></div></dl>
            {v.pauseBis&&<p>{t('sk.ui.ruhigBis',{datum:v.pauseBis})}</p>}
          </section>}
          <details className="sd-details sd-mentorin"><summary><Cameo seed="Defne Arslan" figure="f" glasses size={28} tint="#265a62"/>{t('sk.ui.mentorin')}</summary><DreiFragen world={world}/>{notizen.map((n,i)=><details key={i}><summary>{n.short}</summary><p>{n.more}</p></details>)}</details>
          <nav className="sd-tueren" aria-label={t('sk.ui.weiterAria')}><button type="button" onClick={posteingang}><Icon name="person" size={18}/>{t('sk.ui.alleVorlagen')} <span aria-hidden>↗</span></button><button type="button" onClick={()=>onGehe({art:'akte',akte:'bereiche'})}><Icon name="netz" size={18}/>{t('sk.ui.heute')} <span aria-hidden>↗</span></button></nav>
        </aside>
      </div>
    </>}
    {reiter==='arbeit'&&<SchreibtischInArbeit world={world} refresh={refresh} onGehe={onGehe} arbeit={arbeit} auswahl={arbeitWahl} onAuswahl={id=>setArbeitWahl(arbeitWahl===id?undefined:id)} onVorgang={onVorgang}/>}
    {reiter==='rueckblick'&&<><EpochenBand world={world}/><SchreibtischRueckblick world={world} onGehe={onGehe} onPosteingang={posteingang} umlauf={umlauf}/></>}
    {reiter==='krisenrat'&&<Krisenrat world={world} geaendert={refresh}/>}
  </div>;
}

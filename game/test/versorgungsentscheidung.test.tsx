import { afterEach, describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createWorld, save } from '../src/sim/world';
import { turkey2026 } from '../src/sim/scenario';
import { schnellProfil, startAfterElection } from '../src/sim/prolog';
import { fraktion } from '../src/sim/fraktionen';
import { gueterSicht } from '../src/sim/gueter';
import { aussenZustand } from '../src/sim/diplomatie';
import { transportZustand } from '../src/sim/transport';
import { TRANSPORT_ROUTEN } from '../src/data/transport';
import { addDays, formatDateDe } from '../src/sim/dates';
import { aktiveParteivorsitzende } from '../src/sim/koalitionslage';
import { beschliesseVersorgungsProgramm, beschliesseVersorgungsKurs, aendereVersorgungsVorlage, versorgungsParlamentTag, type VersorgungsProgramm } from '../src/sim/versorgungspolitik';
import { versorgungsStartVorschau, versorgungsKursVorschau } from '../src/sim/versorgungsentscheidung';
import { versorgungsStimmen } from '../src/sim/versorgungsmehrheit';
import { VersorgungsVorschlag } from '../src/ui/gueter/VersorgungsVorschlag';
import { VersorgungsKursKarte } from '../src/ui/gueter/VersorgungsKursKarte';
import { VersorgungsLage } from '../src/ui/gueter/VersorgungsLage';
import { EconomyFile } from '../src/ui/EconomyFile';
import { regierungsVorgaenge } from '../src/ui/schreibtisch/arbeitsplatz';
import { setzeSprache, t, katalogVon, platzhalter } from '../src/i18n';
import de from '../src/i18n/katalog/de/versorgungsentscheidung.json';
const noop=()=>{};
function welt() {
  const w=createWorld(turkey2026,17);startAfterElection(w,{...schnellProfil(),buendnis:'YENİ'});
  w.day=60;w.date='2028-06-23';w.spiel!.start.datum=addDays(w.date,-60);
  w.spiel!.ereignisse=[];w.spiel!.kapital=100;w.spiel!.lager=['YENİ'];
  w.parliament!.seats={[w.player!.partei.kurz]:130,'YENİ':120,CHP:200,MHP:80,DEM:70};
  for(const p of Object.keys(w.parliament!.seats))fraktion(w,p).bereitschaft=50;
  aussenZustand(w).energie.hormus='offen';gueterSicht(w);
  return w;
}
type Welt=ReturnType<typeof welt>;
function zeit(w:Welt,n:number){w.day+=n;w.date=addDays(w.date,n);}
function netzSchaden(w:Welt) {
  const r=TRANSPORT_ROUTEN.find(r=>r.art!=='front')!;
  transportZustand(w).schaden[r.id]=0.5;
}
afterEach(async()=>{await setzeSprache('de');});

describe('Entscheidung vor der Versorgungsinitiative',()=>{
  test('Vorschauen initialisieren keine Konten, Fraktionen oder Transportdaten im Original',()=>{
    const w=welt();delete w.spiel!.transport;delete w.spiel!.fraktionen;
    const before=save(w);
    for(const p of ['schutz','energie','netz'] as const)versorgungsStartVorschau(w,p);
    versorgungsKursVorschau(w,'militaer');expect(save(w)).toBe(before);
  });
  test.each(['schutz','energie','netz'] as VersorgungsProgramm[])('%s: Vorschlag entspricht der echten neuen Vorlage; nur Initiative wird bezahlt',programm=>{
    const w=welt();if(programm==='netz')netzSchaden(w);
    const before=save(w),p=versorgungsStartVorschau(w,programm),kapital=w.spiel!.kapital,debt=w.economy.debtRatio;
    expect(p.grund).toBeUndefined();expect(save(w)).toBe(before);
    expect(beschliesseVersorgungsProgramm(w,programm).ok).toBe(true);
    const v=w.spiel!.gueter!.regierung!.vorlagen![programm]!;
    expect(v).toEqual(p.vorlage);expect(w.spiel!.kapital).toBe(kapital-p.vorlage.pk);
    expect(w.economy.debtRatio).toBe(debt);expect(w.spiel!.gueter!.regierung!.programme[programm]).toBeUndefined();
    expect(versorgungsStimmen(w,v,v.abstimmung)).toEqual(p.stimmen);
    expect(p.ab).toBe(v.abstimmung+p.konditionen.vorlauf);expect(p.bis-p.ab).toBe(p.konditionen.dauer);
  });
  test.each([6,7,8])('Duldung endet in %i Tagen: Anzeige und Votumsstimmen verwenden dieselbe Grenze',tage=>{
    const w=welt();fraktion(w,'CHP').duldungBis=w.day+tage;
    const p=versorgungsStartVorschau(w,'schutz'),chp=p.stimmen.find(f=>f.partei==='CHP')!;
    expect(chp.rolle).toBe(tage<=7?'opposition':'duldung');expect(p.duldungen.some(f=>f.partei==='CHP')).toBe(tage<=7);
    beschliesseVersorgungsProgramm(w,'schutz');zeit(w,7);versorgungsParlamentTag(w);
    expect(w.spiel!.gueter!.regierung!.vorlagen!.schutz!.stimmen).toEqual(p.stimmen);
  });
  test('ein abgelaufenes Paket vererbt weder Zusatzbudget, Klauseln noch historische Stimmen an den neuen Antrag',()=>{
    const w=welt();beschliesseVersorgungsProgramm(w,'schutz');aendereVersorgungsVorlage(w,'schutz','sozial');
    zeit(w,7);versorgungsParlamentTag(w);const alt=structuredClone(w.spiel!.gueter!.regierung!.vorlagen!.schutz!);
    expect(alt.status).toBe('angenommen');zeit(w,90);
    const p=versorgungsStartVorschau(w,'schutz');expect(p.konditionen.bip).toBe(0.04);expect(alt.beschluss!.bip).toBe(0.07);
    expect(p.vorlage.klauseln).toEqual([]);expect(p.vorlage.gespraeche).toEqual([]);expect(p.ja).toBeLessThan(301);
    expect(w.spiel!.gueter!.regierung!.vorlagen!.schutz).toEqual(alt);
    expect(beschliesseVersorgungsProgramm(w,'schutz').ok).toBe(true);expect(w.spiel!.gueter!.regierung!.vorlagen!.schutz).toEqual(p.vorlage);
  });
  test('Ablehnung sperrt den neuen Antrag während der Pause und belastet kein weiteres Konto',()=>{
    const w=welt();beschliesseVersorgungsProgramm(w,'schutz');zeit(w,7);versorgungsParlamentTag(w);
    expect(w.spiel!.gueter!.regierung!.vorlagen!.schutz!.status).toBe('abgelehnt');
    const before=save(w),p=versorgungsStartVorschau(w,'schutz');expect(p.grund).toBe(t('mandat.pause'));
    expect(beschliesseVersorgungsProgramm(w,'schutz').ok).toBe(false);expect(save(w)).toBe(before);
    zeit(w,14);expect(versorgungsStartVorschau(w,'schutz').grund).toBeUndefined();
  });
  test.each([true,false])('politische Vorschau entspricht den gebuchten Reaktionen, Annahme=%s',annahme=>{
    const w=welt();if(annahme)w.parliament!.seats={[w.player!.partei.kurz]:350,'YENİ':120,CHP:130};
    fraktion(w,'YENİ').bereitschaft=2;aktiveParteivorsitzende(w,'YENİ')[0]!.loyalitaet=2;
    const p=versorgungsStartVorschau(w,'schutz'),debt=w.economy.debtRatio;
    expect(p.ja>=301).toBe(annahme);beschliesseVersorgungsProgramm(w,'schutz');zeit(w,7);versorgungsParlamentTag(w);
    const v=w.spiel!.gueter!.regierung!.vorlagen!.schutz!;
    expect(v.status).toBe(annahme?'angenommen':'abgelehnt');expect(v.reaktionen).toEqual(annahme?p.annahme:p.ablehnung);
    expect(w.economy.debtRatio-debt).toBeCloseTo(annahme?p.konditionen.bip:0);
  });
  test('veralteter Klick prüft fehlendes Kapital erneut, ohne Teilbuchung',()=>{
    const w=welt();expect(versorgungsStartVorschau(w,'schutz').grund).toBeUndefined();w.spiel!.kapital=3;
    const before=save(w);expect(beschliesseVersorgungsProgramm(w,'schutz').ok).toBe(false);expect(save(w)).toBe(before);
  });
  test('Partnerwechsel zeigt die jeweilige Sperre, ohne einen Vertrag anzulegen',()=>{
    const w=welt();aussenZustand(w).eigeneSanktionen.push('USA');const before=save(w);
    expect(versorgungsStartVorschau(w,'energie','USA').grund).toBe(t('regierung.partnerGesperrt'));
    expect(versorgungsStartVorschau(w,'energie','AZE').grund).toBeUndefined();expect(save(w)).toBe(before);
  });
});

describe('Regierungskurs vor der verbindlichen Änderung',()=>{
  test.each(['zivil','militaer'] as const)('%s: Vorschau und echte unmittelbare Partei- und Personenfolgen stimmen überein',kurs=>{
    const w=welt();const before=structuredClone(w),p=versorgungsKursVorschau(w,kurs);expect(save(w)).toBe(save(before));
    expect(p.grund).toBeUndefined();expect(beschliesseVersorgungsKurs(w,kurs).ok).toBe(true);
    expect(w.spiel!.kapital).toBe(before.spiel!.kapital-p.pk);expect(w.spiel!.gueter!.regierung!.kursAb).toBe(p.bis);
    for(const r of p.reaktionen) {
      expect(fraktion(w,r.partei).bereitschaft-fraktion(before,r.partei).bereitschaft).toBeCloseTo(r.bereitschaft);
      for(const person of r.personen)expect(w.spiel!.figuren.find(f=>f.name===person.name)!.loyalitaet-before.spiel!.figuren.find(f=>f.name===person.name)!.loyalitaet).toBeCloseTo(person.loyalitaet);
    }
    expect(w.economy.debtRatio).toBe(before.economy.debtRatio);expect(p.reaktionen.length).toBeGreaterThan(0);
  });
  test('gebundener Kurs zeigt den Grund und keine erfundenen unmittelbaren Reaktionen',()=>{
    const w=welt();beschliesseVersorgungsKurs(w,'militaer');const before=save(w),p=versorgungsKursVorschau(w,'zivil');
    expect(p.grund).toBe(t('regierung.kursBindung'));expect(p.reaktionen).toEqual([]);expect(p.risiken).toEqual([]);
    expect(beschliesseVersorgungsKurs(w,'zivil').ok).toBe(false);expect(save(w)).toBe(before);
  });
  test('aktuelle und durch den Kurs verschärfte Bruchgefahr nennt Datum, Person und Sitze',()=>{
    const w=welt();aktiveParteivorsitzende(w,'YENİ')[0]!.loyalitaet=18;
    const p=versorgungsKursVorschau(w,'zivil');expect(p.risiken).toHaveLength(1);
    expect(p.risiken[0]).toMatchObject({partei:'YENİ',vorher:18,sitze:120,rest:130,datum:'2028-07-01'});
    expect(p.risiken[0]!.nachher).toBeLessThan(20);
  });
});

describe('Entscheidungskarten und Aktenzugänge',()=>{
  test('Kosten, Votum, Folgen und Fraktionen stehen vor der verbindlichen Handlung',()=>{
    const w=welt(),before=save(w),html=renderToStaticMarkup(<VersorgungsVorschlag world={w} programm="schutz" partner="AZE" onErgebnis={noop}/>);
    for(const text of [t('ve.jetzt'),t('mandat.budgetBeiAnnahme'),t('ve.votum'),t('ve.politischerPreis'),t('ve.stimmenDetails')])expect(html.indexOf(text)).toBeLessThan(html.indexOf('<footer>'));
    expect(html).toContain(t('welle_b1.ve.naechsterSchritt')); // Welle B1: derselbe Hinweis (Beratung eröffnet, noch nicht beschlossen) in einem Satz
    expect(html).not.toContain(t('mandat.tatsaechlicheFolgen'));expect(save(w)).toBe(before);
  });
  test('geschlossene Vorgänge rendern keine unsichtbaren Verhandlungskarten',()=>{
    const w=welt();beschliesseVersorgungsProgramm(w,'schutz');const html=renderToStaticMarkup(<VersorgungsLage world={w} geaendert={noop}/>);
    expect(html).toContain('data-programm="schutz"');expect(html).not.toContain('class="rg-mandat"');expect(html).not.toContain('class="ek-entscheidung"');
  });
  test('ein geöffneter abgeschlossener Vorgang trennt neuen Antrag und bisherigen Beschluss',()=>{
    const w=welt();beschliesseVersorgungsProgramm(w,'schutz');aendereVersorgungsVorlage(w,'schutz','sozial');zeit(w,7);versorgungsParlamentTag(w);zeit(w,90);
    const html=renderToStaticMarkup(<VersorgungsLage world={w} programm="schutz" geaendert={noop}/>);
    expect(html).toContain(t('ve.neuerAntrag'));expect(html).toContain(t('ve.bisherigerBeschluss'));
    expect(html.indexOf(t('ve.bisherigerBeschluss'))).toBeGreaterThan(html.indexOf(t('ve.einbringen',{pk:4})));
    expect(html).toContain('0,04 %');expect(html).toContain(t('mandat.status.angenommen'));
  });
  test('laufendes Votum und aktives Programm öffnen vom Schreibtisch genau diesen Vorgang',()=>{
    const w=welt();beschliesseVersorgungsProgramm(w,'schutz');aendereVersorgungsVorlage(w,'schutz','sozial');
    const laufend=regierungsVorgaenge(w).find(v=>v.id.startsWith('versorgung-schutz'))!;
    expect(laufend.ziel).toEqual({art:'akte',akte:'wirtschaft',start:'inventar',programm:'schutz'});
    const html=renderToStaticMarkup(<EconomyFile world={w} start="inventar" programm="schutz"/>);
    expect(html).toMatch(/<details class="rg-programm" open="" data-programm="schutz">/);expect(html).toContain('class="rg-mandat"');expect(html).not.toContain(t('ve.neuerAntrag'));
    zeit(w,7);versorgungsParlamentTag(w);
    expect(regierungsVorgaenge(w).find(v=>v.id==='programm-schutz')!.ziel).toEqual(laufend.ziel);
  });
  test('Kursvorschau zeigt Regierungskompetenz und Kosten, ohne die Auswahl schon zu buchen',()=>{
    const w=welt(),before=save(w),html=renderToStaticMarkup(<VersorgungsKursKarte world={w} kurs="zivil" onErgebnis={noop}/>);
    expect(html).toContain(t('ve.keinVotum'));expect(html).toContain(t('ve.kursAusfuehren',{pk:3}));expect(html).toContain(formatDateDe(addDays(w.date,30)));expect(save(w)).toBe(before);
  });
  test.each(['de','en','tr'] as const)('alle neuen Entscheidungen und Sperren sind übersetzt: %s',async sprache=>{
    await setzeSprache(sprache);const w=welt();w.spiel!.kapital=0;
    const html=renderToStaticMarkup(<><VersorgungsVorschlag world={w} programm="energie" partner="AZE" onErgebnis={noop}/><VersorgungsKursKarte world={w} kurs="zivil" onErgebnis={noop}/></>);
    expect(html).not.toMatch(/⟦|\{(?:n|pk|datum|parteien|ab|bis|tage)\}/);expect(html).toContain('disabled=""');expect(html).toContain(t('transport.kapital'));
    for(const [key,wert] of Object.entries(de)) {
      expect(katalogVon(sprache)[key],key).toBeTruthy();expect(platzhalter(katalogVon(sprache)[key]!).sort(),key).toEqual(platzhalter(wert).sort());
    }
  });
});

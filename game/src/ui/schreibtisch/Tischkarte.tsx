// Ressortvorfälle und Ressortanliegen als dieselbe Karte wie jede Vorlage (Rückmeldung 05.11.2026 zum Schreibtisch: „sieht wieder alles
// verschieden aus“). Die Wege und ihre Preise kommen unverändert aus den Plänen der Simulation; hier wird nur die Darstellung angeglichen.
// Entschieden wird weiter über entscheideRessortVorfall und beantworteRessortAnliegen, nie über entscheideVorlage.

import { useMemo, useState } from 'react';
import type { World } from '../../sim/types';
import type { Vorlage, VorlageOption, VorlagenZiel } from '../../sim/ministerfluss-typen';
import { ministerInfo } from '../../sim/ministerfluss-kern';
import { offeneRessortVorfaelle, ressortPolitikPlan, entscheideRessortVorfall, type RessortReaktion, type RessortVorfall } from '../../sim/ressortpolitik';
import { ressortAntwortPlan, beantworteRessortAnliegen, ressortInhaber, type RessortAnliegen, type RessortAntwort } from '../../sim/ressortanliegen';
import { NET } from '../../sim/modell';
import { POSTEN_NACH_ID } from '../../sim/haushalt';
import { addDays, formatDateDe } from '../../sim/dates';
import { t, zahl } from '../../i18n';
import { VorlageKarte } from '../minister/VorlageKarte';
import { gefaehrdeteZusagen, zusagenSchrittPlan, fuehreZusagenSchrittAus, type ZusagenWarnung, type ZusagenSchrittPlan, type ZusagenSchritt } from '../../sim/zusagenwarnung';
import { koalitionsHilfePlan, stabilisiereKoalition, type KoalitionsHilfePlan, type Stabilisierung } from '../../sim/koalitionshilfe';
import { KOALITIONSBRUCH_LOYALITAET } from '../../sim/koalitionslage';
import { zusageText } from '../../sim/zusagen';
import { PARTEI_NAME } from '../../sim/fraktionen';
import type { Ziel } from './briefing';
import '../minister/ministerfluss.css';

type VorfallPlan = NonNullable<ReturnType<typeof ressortPolitikPlan>>;
type AnliegenPlan = NonNullable<ReturnType<typeof ressortAntwortPlan>>;
const REAKTIONEN: RessortReaktion[] = ['stuetzen', 'zurueckpfeifen', 'entlassen'];
const ANTWORTEN: RessortAntwort[] = ['reden', 'umsetzen', 'spaeter', 'ablehnen'];
const knoten = (id: string) => NET.nodes[NET.index.get(id) ?? -1]?.name ?? id;
const sign = (n: number) => `${n > 0 ? '+' : ''}${zahl(n, 1)}`;
const datum = (w: World, tag: number) => formatDateDe(addDays(w.date, tag - w.day));
const ausgang = (v: RessortVorfall) => (v.art === 'auftragVerfehlt' ? 'rp.auftrag' : v.art === 'stillstand' ? 'rp.stillstand' : v.erfolg ? 'rp.eigenGut' : 'rp.eigenSchlecht');
const ZUR_AKTE: VorlagenZiel = { art: 'akte', akte: 'personen' };

function option(id: string, label: string, text: string, p: { ok: boolean; grund?: string; pk: number; aufmerksamkeit: number }, folgen: string[]): VorlageOption {
  return { id, label, text, kosten: { pk: p.ok ? Math.max(0, p.pk) : 0, aufmerksamkeit: p.ok ? Math.max(0, p.aufmerksamkeit) : 0 }, folgen, dafuer: [], dagegen: [], verlierer: [], aktion: { art: 'nichts' }, moeglich: p.ok, ...(p.grund ? { grund: p.grund } : {}) };
}

/** Folgen eines Vorfallplans in Worten, aus dem durchgerechneten Beleg. */
function vorfallFolgen(w: World, p: VorfallPlan): string[] {
  const z: string[] = [];
  if (p.beleg) z.push(t('rp.sofort', { vertrauen: sign(p.beleg.vertrauen), leg: sign(p.beleg.legitimitaet) }));
  if (p.beleg?.nachfolger) z.push(t('rp.nachfolger', { name: p.beleg.nachfolger.name, partei: p.beleg.nachfolger.partei ?? t('rp.parteilos'), faehigkeit: zahl(p.beleg.nachfolger.faehigkeit, 0), loyalitaet: zahl(p.beleg.nachfolger.loyalitaet, 0), datum: datum(w, p.beleg.nachfolger.einarbeitungBis ?? w.day) }));
  if (p.risiken.length) z.push(t('rp.bruch', { datum: formatDateDe(p.pruefung), parteien: p.risiken.map((r) => r.partei).join(', '), vor: p.sitze, nach: p.danach, fehlt: Math.max(0, 301 - p.danach) }));
  return z;
}

export function vorfallAlsVorlage(w: World, v: RessortVorfall, plaene: VorfallPlan[]): Vorlage | undefined {
  const f = w.spiel?.figuren.find((x) => x.id === v.figur);
  if (!f) return undefined;
  const sache = t('rp.sachfolgeKurz', { name: knoten(v.folge.groesse), vor: zahl(v.folge.vorher, 0), nach: zahl(v.folge.nachher, 0) }) + (v.folge.bip > 0.0005 ? ` ${t('rp.sachKosten', { bip: zahl(v.folge.bip, 2) })}` : '');
  return {
    id: `tisch-vorfall-${v.id}`, thema: v.id, art: 'warnung', quelle: 'person', amt: v.amt, minister: ministerInfo(w, f),
    titel: t(`ra.art.${v.art}`), anlass: [`${t(ausgang(v))} ${sache}`], tag: v.tag, prioritaet: 0, prioritaetGrund: '', ziel: ZUR_AKTE,
    optionen: plaene.map((p) => option(p.art, t(`rp.art.${p.art}`), t(`rp.text.${p.art}`), p, vorfallFolgen(w, p))),
  };
}

function anliegenFolgen(w: World, p: AnliegenPlan): string[] {
  const z: string[] = [];
  if (!p.ok) return z;
  if (p.folge) z.push(t('ra.sofort', { loy: sign(p.folge.loyalitaet), groll: sign(p.folge.groll) }));
  if (p.gesetz) z.push(`${t('hh.mehrheit', { ja: p.gesetz.ja, fehlt: Math.max(0, 301 - p.gesetz.ja), datum: datum(w, p.gesetz.tag) })} ${t('hh.nurEingebracht')}`);
  if (p.hilfe) z.push(t('ra.haushaltFolge', { n: sign(p.hilfe.defizit), leg: sign(p.hilfe.legitimitaet) }));
  z.push(t('ra.antwortFrist', { datum: datum(w, p.frist) }));
  return z;
}

export function anliegenAlsVorlage(w: World, a: RessortAnliegen, plaene: AnliegenPlan[]): Vorlage | undefined {
  const f = ressortInhaber(w, a);
  if (!f) return undefined;
  const v = a.vorschlag;
  const vtext = v?.art === 'gesetz' ? `${knoten(v.id)} → ${zahl(v.ziel, 0)}` : v?.art === 'haushalt' ? (v.aktion.art === 'etat' ? t('hh.etat', { name: POSTEN_NACH_ID[v.aktion.posten]!.name, ziel: v.aktion.ziel }) : v.aktion.art === 'programm' ? t(`regierung.${v.aktion.programm}.titel`) : '') : '';
  const bitte = t(a.status === 'besprochen' ? 'ra.nachGespraech' : a.status === 'abgelehnt' ? 'ra.zurueckgewiesen' : 'ra.bitte', { groesse: knoten(a.groesse), wert: zahl(a.vorher, 1) });
  return {
    id: `tisch-anliegen-${a.id}`, thema: a.id, art: 'frage', quelle: 'person', amt: a.amt, minister: ministerInfo(w, f),
    titel: t('tk.anliegenTitel', { groesse: knoten(a.groesse) }), anlass: [bitte, ...(vtext ? [`${t('ra.vorschlag')} ${vtext}`] : [])], tag: a.seit, frist: a.frist - w.day, prioritaet: 0, prioritaetGrund: '', ziel: ZUR_AKTE,
    optionen: plaene.map((p) => option(p.art, t(`ra.art.${p.art}`), t(`ra.antwort.${p.art}`), p, anliegenFolgen(w, p))),
  };
}

/** Alle offenen Vorfälle und Anliegen eines Ressorts als Vorlagenkarten. */
export function RessortTischkarten({ world, refresh, amt, onGehe }: { world: World; refresh: () => void; amt: RessortVorfall['amt']; onGehe?: (z: VorlagenZiel) => void }) {
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string } | null>(null);
  const vorfaelle = offeneRessortVorfaelle(world).filter((v) => v.amt === amt);
  const anliegen = (world.spiel?.ministerfluss?.ressortAnliegen ?? []).filter((a) => a.amt === amt && ['offen', 'besprochen', 'abgelehnt'].includes(a.status));
  // Jeder Plan rechnet in einer Kopie der Welt; nur neu, wenn sich Tag, Kapital oder die Einträge ändern
  const schluessel = JSON.stringify([world.day, world.spiel?.kapital, vorfaelle.map((v) => v.id), anliegen.map((a) => [a.id, a.status])]);
  const karten = useMemo(() => [
    ...vorfaelle.map((v) => ({ v: vorfallAlsVorlage(world, v, REAKTIONEN.flatMap((art) => { const p = ressortPolitikPlan(world, v.id, art); return p ? [p] : []; })), art: 'vorfall' as const })),
    ...anliegen.map((a) => ({ v: anliegenAlsVorlage(world, a, ANTWORTEN.flatMap((art) => { const p = ressortAntwortPlan(world, a.id, art); return p ? [p] : []; })), art: 'anliegen' as const })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [world, schluessel]);
  const entscheide = (k: { v: Vorlage; art: 'vorfall' | 'anliegen' }, optionId: string) => {
    if (k.art === 'vorfall') {
      const p = ressortPolitikPlan(world, k.v.thema, optionId as RessortReaktion);
      setAntwort(p ? entscheideRessortVorfall(world, p) : { ok: false, text: t('rp.veraltet') });
    } else {
      const p = ressortAntwortPlan(world, k.v.thema, optionId as RessortAntwort);
      setAntwort(p ? beantworteRessortAnliegen(world, p) : { ok: false, text: t('ra.veraltet') });
    }
    refresh();
  };
  return <div className="mf">
    {antwort && <p className={`mf-rueckmeldung ${antwort.ok ? 'ok' : 'nein'}`} role="status">{antwort.text}</p>}
    {!karten.length && !antwort && <p className="mf-leer">{t('tk.leer')}</p>}
    <ol className="mf-liste">{karten.flatMap((k) => (k.v ? [<li key={k.v.id}><VorlageKarte v={k.v} onEntscheide={(_, id) => entscheide({ v: k.v!, art: k.art }, id)} {...(onGehe ? { onGehe } : {})} /></li>] : []))}</ol>
  </div>;
}

const SCHRITTE: ZusagenSchritt[] = ['einloesen', 'vertroesten'];
const GESPRAECHE: Stabilisierung[] = ['fraktion', 'vertrauen', 'rueckendeckung'];
const loyalWert = (n: number) => (n < 20 && Math.round(n * 100) / 100 >= 20 ? `< ${zahl(20, 0)}` : zahl(n, 0));

/** Folgen eines Zusagenschritts oder Koalitionsgesprächs in Worten, aus der durchgerechneten Kopie. */
function zusagenFolgen(w: World, s: ZusagenWarnung, a: ZusagenSchrittPlan | KoalitionsHilfePlan): string[] {
  if (!a.moeglich) return [];
  const z = [t('zw.sofort', { bereitschaft: sign(a.bereitschaft), vertrauen: sign(a.vertrauen) })];
  if ('legitimitaet' in a && Math.abs(a.legitimitaet) >= 0.05) z.push(t('zw.legitimitaet', { n: sign(a.legitimitaet) }));
  const nach = s.vorsitz.length ? Math.min(...s.vorsitz.map((f) => a.personen.find((p) => p.id === f.id)?.nachher ?? f.loyalitaet)) : undefined;
  if (s.koalition && nach !== undefined) z.push(`${t('vn.danach', { n: loyalWert(nach) })}${nach < KOALITIONSBRUCH_LOYALITAET ? ` ${t('vn.bleibtAkut')}` : ''}`);
  if ('faelligDanach' in a && a.art === 'vertroesten') z.push(t('zw.neueFrist', { datum: datum(w, a.faelligDanach) }));
  if ('abstimmung' in a && a.abstimmung !== undefined && !a.erfuellt) z.push(t('zw.erstVotum', { datum: datum(w, a.abstimmung) }));
  if (a.kapitalDanach < 0) z.push(t('vn.aufPump', { n: zahl(a.kapitalDanach, 1) }));
  return z;
}

export function zusageAlsVorlage(w: World, s: ZusagenWarnung, schritte: ZusagenSchrittPlan[], gespraeche: KoalitionsHilfePlan[]): Vorlage {
  const vorsitz = s.vorsitz[0] ? w.spiel?.figuren.find((f) => f.id === s.vorsitz[0]!.id) : undefined;
  const lage = [t(s.akut ? 'zw.akut' : s.wenigRueckhalt ? 'zw.wenig' : s.koalition ? 'zw.fristRisiko' : 'zw.fraktionRisiko'),
    ...(s.koalition ? [t('zw.pruefung', { datum: formatDateDe(s.pruefung), sitze: s.sitze, rest: s.ohne })] : []),
    ...(s.erinnerung ? [t('zw.erinnerung', { datum: datum(w, s.erinnerung.frist) })] : [])].join(' ');
  const gesetzOffen = !!s.gesetz && !s.gesetz.erreicht;
  return {
    id: `tisch-zusage-${s.z.id}`, thema: s.z.id, art: 'warnung', quelle: 'zusage', amt: 'stab', ...(vorsitz ? { minister: ministerInfo(w, vorsitz) } : {}),
    titel: zusageText(s.z), anlass: [lage, t(s.akut ? 'zw.empfehlung.akut' : s.gesetz?.entwurf ? 'zw.empfehlung.gesetz' : 'zw.empfehlung.erfuellen')], tag: s.z.faellig, frist: s.tage, prioritaet: 0, prioritaetGrund: '',
    optionen: [
      ...schritte.map((a) => option(a.art, a.art === 'vertroesten' ? t('zw.vertroesten') : t(gesetzOffen ? 'zusage.gesetz.aktion' : 'zw.einloesen'),
        t(a.art === 'vertroesten' ? 'zw.vertroestenText' : gesetzOffen ? 'zusage.gesetz.belohnung' : 'zw.einloesenText'), { ok: a.moeglich, grund: a.moeglich ? undefined : a.text, pk: a.pk, aufmerksamkeit: a.aufmerksamkeit }, zusagenFolgen(w, s, a))),
      ...gespraeche.map((a) => option(a.art, t(`vn.aktion.${a.art}`), t(`vn.aktion.${a.art}.text`), { ok: a.moeglich, grund: a.grund, pk: a.pk, aufmerksamkeit: a.aufmerksamkeit }, zusagenFolgen(w, s, a))),
    ],
  };
}

/** Eine gefährdete Zusage als Vorlagenkarte: erfüllen, vertrösten oder (bei Partnern) mit dem Vorsitz reden. */
export function ZusageTischkarte({ world, refresh, zusageId, onGehe }: { world: World; refresh: () => void; zusageId: string; onGehe: (z: Ziel) => void }) {
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string } | null>(null);
  const s = gefaehrdeteZusagen(world).find((x) => x.z.id === zusageId);
  const vorlage = useMemo(() => {
    if (!s) return undefined;
    const schritte = SCHRITTE.flatMap((art) => { const a = zusagenSchrittPlan(world, s.z.id, art); return a ? [a] : []; });
    const gespraeche = s.koalition && s.vorsitz.length ? GESPRAECHE.flatMap((art) => { const a = koalitionsHilfePlan(world, s.partei, art); return a ? [a] : []; }) : [];
    return zusageAlsVorlage(world, s, schritte, gespraeche);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, world.day, world.spiel?.kapital, JSON.stringify(s)]);
  const entscheide = (optionId: string) => {
    if (!s) return;
    if (optionId === 'einloesen' || optionId === 'vertroesten') {
      const a = zusagenSchrittPlan(world, s.z.id, optionId);
      setAntwort(a ? fuehreZusagenSchrittAus(world, a) : { ok: false, text: t('vn.veraltet') });
    } else {
      const a = koalitionsHilfePlan(world, s.partei, optionId as Stabilisierung);
      setAntwort(a ? stabilisiereKoalition(world, a) : { ok: false, text: t('vn.veraltet') });
    }
    refresh();
  };
  return <div className="mf">
    {antwort && <p className={`mf-rueckmeldung ${antwort.ok ? 'ok' : 'nein'}`} role="status">{antwort.text}</p>}
    {vorlage && s ? <VorlageKarte v={vorlage} wer={{ name: PARTEI_NAME[s.partei] ?? s.partei, unter: `${t(`zw.rolle.${s.rolle}`)}${s.vorsitz[0] ? ` · ${s.vorsitz[0].name} · ${t('mf.loyalitaet', { n: Math.round(s.vorsitz[0].loyalitaet) })}` : ''}` }} onEntscheide={(_, id) => entscheide(id)} />
      : !antwort && <p className="mf-leer">{t('zw.keineGefahr')}</p>}
    <p className="mf-leer"><button type="button" className="pd-btn quiet" onClick={() => onGehe({ art: 'zusagen' })}>{t('zw.alleZusagen')}</button></p>
  </div>;
}

// Der Prolog als illustriertes Lebenslauf-Buch: oben die Szene der Station mit dem Porträt der Figur, darunter das Band der acht Stationen,
// dann die Seite mit Frage und großen Karten. Die Figur altert, kleidet sich und schaut mit den Antworten anders (prolog/figur.ts);
// die Karte dahinter schwenkt je Station. Jede Antwort zeigt ihre wichtigste Folge, die Vorschau darunter alle (prolog/folge.ts).

import { useEffect, useMemo, useRef, useState } from "react";
import { antwortenFuer, emptyProfile, STATIONS, type Answer, type Aussehen, type PlayerProfile, type Station } from "../sim/prolog";
import { STARTSZENARIEN, type StartszenarioId } from "../data/startszenarien";
import { profilFuerSzenario } from "../sim/start-szenario";
import { biografieFolgen } from "../sim/biografie";
import { setzeLinie } from "../sim/linie";
import { Corners } from "./art/Ornament";
import { Portraet } from "./art/Portraet";
import { Parteikonfigurator } from "./prolog/Parteikonfigurator";
import { Szene, type SzenenId } from "./prolog/Szenen";
import { Fortschritt } from "./prolog/Fortschritt";
import { Wappen, Parteiwappen } from "./prolog/Wappen";
import { Figurenwahl } from "./prolog/Figurenwahl";
import { figurLage, nameNachAenderung, portraetFuer, standardAussehen, wuerfleAussehen, zufallsName } from "./prolog/figur";
import { folgeVon, type AntwortFolge } from "./prolog/folge";
import { Chips, type Chip } from "./prolog/Chips";
import { plakaByName } from "./atlas/overlay";
import { bewegungReduziert } from "./anim/effekte";
import { useEffektstufe } from "./anim/react";
import { t } from "../i18n";
import "./prolog/buch.css";

/** Wohin die Karte hinter dem Buch schaut: Kfz-Kennziffer und Abstand je Station (Spielparameter der Kamera) */
const KAMERA: Record<string, { plaka?: number; d?: number; heimat?: boolean }> = {
  kindheit: {},
  jugend: { heimat: true, d: 6.5 },
  beruf: { plaka: 34, d: 7 },
  liebe: { plaka: 34, d: 4.5 },
  politik: { plaka: 6, d: 7 },
  partei: { plaka: 6, d: 5.5 },
  wahlkampf: { plaka: 42, d: 11 },
  wahlnacht: { plaka: 6, d: 6 },
};

const SZENE: Record<string, SzenenId> = {
  kindheit: "kindheit",
  jugend: "jugend",
  beruf: "beruf",
  liebe: "liebe",
  politik: "politik",
  partei: "partei",
  wahlkampf: "wahlkampf",
  wahlnacht: "wahlnacht",
};

export interface PrologueProps {
  onDone: (p: PlayerProfile) => void;
  /** Die Karte hinter dem Buch soll auf eine Provinz schauen (Kfz-Kennziffer) mit einem Abstand; ohne Angabe die Übersicht */
  onFocus?: (plaka: number | undefined, d?: number, weit?: boolean) => void;
  /** Erste Seite: −2 Gesicht und Name (Standard), −1 Szenario, sonst Station (für Werkzeuge und Tests) */
  anfang?: number;
}

/** Die wichtigste Folge einer Antwort in einer Zeile */
function FolgeZeile({ folge }: { folge: AntwortFolge }) {
  const plus = folge.gruppen.filter((g) => g.delta > 0).slice(0, 2);
  const chipsGruppen: Chip[] = plus.map((g) => ({ text: t(`prolog.gruppe.${g.id}`), staerke: Math.min(1, g.delta / 3) }));
  const hatBio = folge.vorteil.length + folge.preis.length > 0;
  return (
    <span className="wk-folge" aria-label={t("prolog.chip.gruppen")}>
      {hatBio && <Chips art="vorteil" chips={folge.vorteil.slice(0, 1)} />}
      {hatBio && <Chips art="preis" chips={folge.preis.slice(0, 1)} />}
      {!hatBio && <Chips art="gruppe" chips={chipsGruppen} />}
      {folge.partner && <Chips art="partner" chips={[{ text: `${t("prolog.chip.partner")}: ${folge.partner}`, staerke: 1 }]} />}
      {!hatBio && chipsGruppen.length === 0 && !folge.partner && <span className="chip leer">{t("prolog.chip.keine")}</span>}
    </span>
  );
}

/** Vorschau einer Antwort als Zettel an der Karte (bei Zeiger oder Fokus): alles, was sie bringt und kostet */
function Zettel({ a, folge }: { a: Answer; folge: AntwortFolge }) {
  const plus = folge.gruppen.filter((g) => g.delta > 0).map((g) => t(`prolog.gruppe.${g.id}`));
  const minus = folge.gruppen.filter((g) => g.delta < 0).map((g) => t(`prolog.gruppe.${g.id}`));
  const nichts = !a.vorteil && !a.preis && plus.length === 0 && minus.length === 0 && !folge.partner;
  return (
    <span className="wk-zettel" role="note">
      <b className="z-kopf">{t("prolog.vorschau.titel")}</b>
      {a.vorteil && (
        <span className="z-zeile v-vorteil">
          <b>{t("prolog.vorschau.vorteil")}</b> {a.vorteil}
        </span>
      )}
      {a.preis && (
        <span className="z-zeile v-preis">
          <b>{t("prolog.vorschau.preis")}</b> {a.preis}
        </span>
      )}
      {plus.length > 0 && (
        <span className="z-zeile v-naeher">
          <b>{t("prolog.vorschau.naeher")}</b> {plus.join(", ")}
        </span>
      )}
      {minus.length > 0 && (
        <span className="z-zeile v-ferner">
          <b>{t("prolog.vorschau.ferner")}</b> {minus.join(", ")}
        </span>
      )}
      {folge.partner && (
        <span className="z-zeile v-partner">
          <b>{t("prolog.chip.partner")}</b> {folge.partner}
        </span>
      )}
      {nichts && <span className="z-zeile">{t("prolog.vorschau.nichts")}</span>}
    </span>
  );
}

export function Prologue({ onDone, onFocus, anfang = -2 }: PrologueProps) {
  const [profile] = useState<PlayerProfile>(emptyProfile);
  // Im Browser beginnt die Figur mit einem zufälligen Gesicht; der Name kommt aus dem Namenpool desselben Geschlechts. Ohne Fenster (Tests, Werkzeuge) gilt die Vorgabe.
  const [aussehen, setAussehen] = useState<Aussehen>(() => (typeof window === "undefined" ? standardAussehen() : wuerfleAussehen()));
  const [name, setName] = useState(() => zufallsName(aussehen.geschlecht));
  /** Hat die Spielerin oder der Spieler den Namen selbst getippt? Dann würfelt kein Wechsel von Geschlecht oder Gesicht ihn um. */
  const [nameVonHand, setNameVonHand] = useState(false);
  const [step, setStep] = useState(anfang);
  const [chosen, setChosen] = useState<string[]>([]);
  const [symbole, setSymbole] = useState<(string | undefined)[]>([]);
  const [szenario, setSzenario] = useState<StartszenarioId>("neugruendung");
  const [gewaehlt, setGewaehlt] = useState<number | undefined>(undefined);
  const sperre = useRef(false);
  const buch = useRef<HTMLDivElement>(null);
  const nameFeld = useRef<HTMLInputElement>(null);
  const stufe = useEffektstufe();
  const total = STATIONS.length;

  // Der Zeiger bewegt die Ebenen der Szene (Parallaxe) nur bei „hoch“
  useEffect(() => {
    const el = buch.current;
    if (!el || stufe !== "hoch" || bewegungReduziert()) return;
    const bewege = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--px", String(((e.clientX - r.left) / r.width - 0.5) * 2));
      el.style.setProperty("--py", String(((e.clientY - r.top) / r.height - 0.5) * 2));
    };
    el.addEventListener("pointermove", bewege);
    return () => el.removeEventListener("pointermove", bewege);
  }, [stufe]);

  // Jede neue Seite beginnt oben; das Namensfeld bekommt den Fokus, ohne die Seite zu verschieben (sonst fehlt oben die Überschrift)
  useEffect(() => {
    buch.current?.querySelector(".buch-koerper")?.scrollTo?.({ top: 0 });
    if (step === -2) nameFeld.current?.focus({ preventScroll: true });
  }, [step]);

  const festgelegt = useMemo(() => STATIONS.map((s) => !!s.ueberspringen?.(profile)), [profile, step]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Die Karte schaut auf die Station */
  function schaue(id: string | undefined) {
    if (!id || !onFocus) return;
    const k = KAMERA[id];
    if (!k) return onFocus(undefined);
    const plaka = k.heimat ? profile.heimatPlaka || undefined : k.plaka;
    onFocus(plaka, plaka ? k.d : undefined, STATIONS.find((s) => s.id === id)?.modus === "konfigurator");
  }

  /** Geht zur nächsten Station; Stationen, die das Szenario festlegt (Partei, Bündnis, Wahl), entfallen. */
  function weiter(label: string, symbol?: string) {
    const neu = [...chosen, label];
    const sym = [...symbole, symbol];
    let next = step + 1;
    while (next < total && STATIONS[next]!.ueberspringen?.(profile)) {
      STATIONS[next]!.auto?.(profile);
      neu.push(t("prolog.festgelegt"));
      sym.push(undefined);
      next++;
    }
    setChosen(neu);
    setSymbole(sym);
    setGewaehlt(undefined);
    setStep(next);
    schaue(STATIONS[next]?.id ?? "wahlnacht");
  }

  /** Eine Antwort wählen: die Karte hebt sich kurz (Siegel), dann schlägt die Seite um */
  function waehle(a: Answer, i: number) {
    if (sperre.current) return;
    sperre.current = true;
    setGewaehlt(i);
    const fertig = () => {
      a.apply(profile);
      weiter(a.label, a.symbol);
      sperre.current = false;
    };
    if (stufe === "aus" || bewegungReduziert()) fertig();
    else window.setTimeout(fertig, 420);
  }

  /** Aussehen ändern; beim Wechsel des Geschlechts bekommt ein nicht selbst getippter Name sofort einen passenden neuen */
  function aendereAussehen(neu: Aussehen, immer = false) {
    setName(nameNachAenderung(aussehen, neu, name, nameVonHand, immer));
    setAussehen(neu);
  }

  function wuerfleGesicht() {
    aendereAussehen(wuerfleAussehen(), true);
  }

  function zumSzenario() {
    profile.name = name.trim();
    profile.aussehen = aussehen;
    setStep(-1);
  }

  function zurStation() {
    profile.startszenario = szenario;
    setStep(0);
    schaue(STATIONS[0]!.id);
  }

  function randomRest() {
    let s = Math.max(step, 0);
    const labels = [...chosen];
    const syms = [...symbole];
    if (step < 0) {
      profile.name = name.trim() || zufallsName(aussehen.geschlecht);
      profile.aussehen = aussehen;
      profile.startszenario = szenario;
      s = 0;
    }
    for (; s < total; s++) {
      const st = STATIONS[s]!;
      if (st.ueberspringen?.(profile)) {
        st.auto?.(profile);
        labels.push(t("prolog.festgelegt"));
        syms.push(undefined);
        continue;
      }
      const answers = antwortenFuer(st, profile, true);
      const a = answers[Math.floor(Math.random() * answers.length)]!;
      a.apply(profile);
      labels.push(a.label);
      syms.push(a.symbol);
    }
    setChosen(labels);
    setSymbole(syms);
    setStep(total);
    schaue("wahlnacht");
  }

  // Zustand der Figur nach den bisherigen Antworten
  const lage = figurLage(profile, aussehen, step, total);
  const station = step >= 0 && step < total ? STATIONS[step]! : undefined;
  const anzeige = step >= total ? profilFuerSzenario(profile) : undefined;
  const farbe = anzeige?.partei.farbe ?? (profile.partei.kurz ? profile.partei.farbe : undefined);
  const szeneId: SzenenId = station ? (SZENE[station.id] ?? "aufbruch") : step >= total ? "wahlnacht" : "aufbruch";
  const weit = station?.modus === "konfigurator";
  const kopfName = name.trim() || (step < -1 ? "" : profile.name);

  const zeile = [
    t("prolog.alter_beruf", { alter: lage.alter }),
    profile.heimat,
    profile.partei.kurz ? profile.partei.name : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  const kopf = (
    <header className="buch-kopf">
      <Szene szene={szeneId} {...(farbe ? { farbe } : {})} />
      <figure className="buch-figur">
        <Portraet {...portraetFuer(name, aussehen)} alter={lage.alter} tint={lage.tint} stimmung={lage.stimmung} size={170} rahmen="messing" lebendig titel={kopfName || t("prolog.aussehen.titel")} />
      </figure>
      <div className="buch-ich">
        <p className={`ich-name${kopfName ? "" : " leer"}`}>{kopfName || "…"}</p>
        <div className="ich-spur">
          {symbole.map((s, i) => (s && s !== `partei:${profile.partei.kurz}` ? <span key={i} title={`${t(`prolog.band.${STATIONS[i]!.id}`)}: ${chosen[i] ?? ""}`}><Wappen id={s} size={24} className="spur" /></span> : null))}
          {profile.partei.kurz && profile.achsen && <span title={profile.partei.name}><Parteiwappen kurz={profile.partei.kurz} farbe={profile.partei.farbe} achsen={profile.achsen} size={22} className="spur" /></span>}
        </div>
        <p className="ich-zeile">{zeile}</p>
      </div>
    </header>
  );

  const schale = (inhalt: React.ReactNode, kicker: string) => (
    <>
      <div className={`buch-huelle${weit ? " weit" : ""}`}>
      <section ref={buch} className={`frame buch${weit ? " weit" : ""}${step >= total ? " fertig" : ""}${step < 0 ? " vorspann" : ""}`} data-station={station?.id ?? (step >= total ? "ende" : "vor")}>
        <Corners />
        {kopf}
        <Fortschritt stationen={STATIONS.map((s) => s.id)} schritt={step} festgelegt={festgelegt} />
        <div className="buch-koerper">
          <div className="buch-seite" key={`${step}`}>
            <p className="kicker">{kicker}</p>
            {inhalt}
          </div>
        </div>
      </section>
      </div>
    </>
  );

  // Erstes Blatt: Gesicht und Name
  if (step === -2) {
    return schale(
      <>
        <h2>{t("prolog.wer")}</h2>
        <p className="story">{t("prolog.ich.einleitung")}</p>
        <div className="schild">
          <label htmlFor="ich-name">{t("prolog.name_schild")}</label>
          <div className="schild-zeile">
            <input id="ich-name" ref={nameFeld} value={name} onChange={(e) => {
              setName(e.target.value);
              setNameVonHand(e.target.value.trim().length > 0);
            }} onFocus={(e) => e.target.select()} placeholder={t("prolog.name_platzhalter")} maxLength={40} autoComplete="off" />
            <button type="button" className="wuerfel" onClick={() => {
              setName((n) => zufallsName(aussehen.geschlecht, Math.random, n));
              setNameVonHand(false);
            }}>
              {t("prolog.name_zufall")}
            </button>
          </div>
        </div>
        <Figurenwahl wert={aussehen} onChange={(a) => aendereAussehen(a)} onWuerfeln={wuerfleGesicht} />
        <div className="confirm">
          <button className="primary" disabled={name.trim().length < 2} onClick={zumSzenario}>
            {t("prolog.weiter")}
          </button>
          <button className="link" onClick={randomRest}>
            {t("prolog.zufaellig")}
          </button>
        </div>
      </>,
      t("prolog.ich.kicker"),
    );
  }

  // Zweites Blatt: Wie beginnt die Geschichte?
  if (step === -1) {
    return schale(
      <>
        <h2>{t("prolog.szenario_titel")}</h2>
        <p className="story">{t("prolog.szenario.einleitung")}</p>
        <div className="szenarien" role="radiogroup" aria-label={t("prolog.szenario_titel")}>
          {STARTSZENARIEN.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={szenario === s.id} disabled={!s.verfuegbar} className={`sz-karte${szenario === s.id ? " on" : ""}${s.verfuegbar ? "" : " gesperrt"}`} onClick={() => setSzenario(s.id)}>
              <Wappen id={`start_${s.id}`} size={52} an={szenario === s.id} className="wk-wappen" />
              <span className="sz-text">
                <strong>{t(`start.${s.id}.name`)}</strong>
                <span>{t(`start.${s.id}.text`)}</span>
                {!s.verfuegbar && <em className="sz-bald">{t(`start.${s.id}.status`)}</em>}
              </span>
            </button>
          ))}
        </div>
        <div className="confirm">
          <button className="primary" onClick={zurStation}>
            {t("prolog.weiter")}
          </button>
          <button className="link" onClick={() => setStep(-2)}>
            {t("prolog.szenario.zurueck")}
          </button>
        </div>
      </>,
      t("prolog.szenario.kicker"),
    );
  }

  if (station) return <Stationsseite station={station} schale={schale} profile={profile} step={step} total={total} gewaehlt={gewaehlt} waehle={waehle} onKonfig={(a) => { setzeLinie(profile, a); weiter(a.name, `partei:${a.kurz}`); }} onRest={randomRest} onFocus={onFocus} />;

  // Zusammenfassung mit dem, was das Szenario festlegt (Partei, Wahl) und den Folgen der Biografie
  const folgen = biografieFolgen(anzeige!);
  const untertitel =
    anzeige!.startszenario && anzeige!.startszenario !== "neugruendung"
      ? t(`prolog.zusammenfassung.${anzeige!.startszenario}`, { partei: anzeige!.partei.name, anteil: anzeige!.wahl.anteil })
      : t("prolog.zusammenfassung.neugruendung", { partei: anzeige!.partei.name, gang: anzeige!.wahl.runde === 1 ? "erste" : "stich", anteil: anzeige!.wahl.anteil });
  return schale(
    <>
      <h2>{profile.name}</h2>
      <p className="subtitle">{untertitel}</p>
      <p className="story">{t("prolog.lebenslauf", { heimat: profile.heimat, beruf: chosen[2] ?? profile.beruf, versprechen: anzeige!.versprechen[0] ?? "" })}</p>
      <h3 className="lauf-titel">{t("prolog.lebenslauf_titel")}</h3>
      <ol className="lauf">
        {STATIONS.map((s, i) => (
          <li key={s.id} className={festgelegt[i] ? "fest" : ""}>
            {symbole[i] ? <Wappen id={symbole[i]!} size={34} className="wk-wappen" /> : <span className="lauf-leer" aria-hidden />}
            <span className="lauf-text">
              <small>{t(`prolog.band.${s.id}`)}</small>
              <strong>{chosen[i]}</strong>
            </span>
          </li>
        ))}
      </ol>
      {folgen.length > 0 && (
        <div className="biografie-folgen">
          <h3>{t("prolog.folgen_titel")}</h3>
          <ul>
            {folgen.map((f) => (
              <li key={f.merkmal}>
                <span className="folge vorteil">{t(`biografie.${f.id}.vorteil`)}</span>
                <span className="folge preis">{t(`biografie.${f.id}.preis`)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="story">{t(anzeige!.startszenario && anzeige!.startszenario !== "neugruendung" ? "prolog.ende_andere" : "prolog.ende")}</p>
      <div className="confirm">
        <button className="primary" onClick={() => onDone(profile)}>
          {t("prolog.amtsantritt")}
        </button>
      </div>
    </>,
    t("prolog.wahlnacht_kicker"),
  );
}

interface SeiteProps {
  station: Station;
  schale: (inhalt: React.ReactNode, kicker: string) => React.ReactElement;
  profile: PlayerProfile;
  step: number;
  total: number;
  gewaehlt: number | undefined;
  waehle: (a: Answer, i: number) => void;
  onKonfig: (a: Parameters<typeof setzeLinie>[1]) => void;
  onRest: () => void;
  onFocus: PrologueProps["onFocus"];
}

/** Eine Station: Geschichte, Frage, Karten (oder der Konfigurator) und die Vorschau */
function Stationsseite({ station, schale, profile, step, total, gewaehlt, waehle, onKonfig, onRest, onFocus }: SeiteProps) {
  const antworten = antwortenFuer(station, profile, true);
  const folgen = useMemo(() => (station.modus === "konfigurator" ? [] : antworten.map((a) => folgeVon(profile, a))), [station, profile, antworten.length, step]); // eslint-disable-line react-hooks/exhaustive-deps
  const istHeimat = station.id === "kindheit";
  const kicker = t("prolog.station_n", { titel: station.title, n: step + 1, gesamt: total });
  return schale(
    <>
      <p className="story">{station.story}</p>
      <h2>{station.question}</h2>
      {station.modus === "konfigurator" ? (
        <Parteikonfigurator onFertig={onKonfig} />
      ) : (
        <>
          <div className={`answers n${antworten.length}`}>
            {antworten.map((a, i) => (
              <button
                key={a.label}
                className={`wahl-karte${gewaehlt === i ? " gewaehlt" : ""}${gewaehlt !== undefined && gewaehlt !== i ? " zurueck" : ""}`}
                onClick={() => waehle(a, i)}
                onPointerEnter={() => {
                  if (istHeimat) {
                    const p = plakaByName(a.label);
                    if (p) onFocus?.(p, 7.5);
                  }
                }}
              >
                {a.symbol && <Wappen id={a.symbol} size={46} an={gewaehlt === i} className="wk-wappen" />}
                <strong>{a.label}</strong>
                <span className="wk-text">{a.text}</span>
                {folgen[i] && <FolgeZeile folge={folgen[i]!} />}
                {folgen[i] && <Zettel a={a} folge={folgen[i]!} />}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="confirm">
        <button className="link" onClick={onRest}>
          {t("prolog.rest_zufaellig")}
        </button>
      </div>
    </>,
    kicker,
  );
}

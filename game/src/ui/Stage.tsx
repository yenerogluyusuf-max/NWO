import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { World } from "../sim/types";
import { advance, NET } from "../sim/world";
import { formatDateDe } from "../sim/dates";
import { nationalAverage, PROVINCES } from "../sim/netz";
import { PROVINZEN } from "../sim/regional";
import { AtlasMap } from "./atlas/AtlasMap";
import { PROVINCE_FC, REGION_COLORS } from "./atlas/overlay";
import { Schreibtisch } from "./schreibtisch/Schreibtisch";
import type { Ziel } from "./schreibtisch/briefing";
import { zweckVon } from "./politik/zweck";
import { Chat } from "./Chat";
import { Bereiche } from "./Bereiche";
import { Politik } from "./politik/Politik";
import { Beschlussbuch } from "./Beschlussbuch";
import { VerfassungWerkstatt } from "./Verfassung";
import { Waehler } from "./Waehler";
import { WahlkampfZentrale } from "./Wahlkampf";
import { Programme } from "./Programme";
import { Welt } from "./Welt";
import { beziehungZurTuerkei } from "../sim/welt-modell";
import { LandPopover, type LandAuswahl, type WeltTab } from "./welt/LandPopover";
import { EconomyFile } from "./EconomyFile";
import { NetView } from "./NetView";
import { Decisions } from "./Decisions";
import { Personen } from "./Personen";
import { Chronik } from "./Chronik";
import { PARTY_COLORS } from "./Parliament";
import { Icon, type IconName } from "./icons";
import { Cameo } from "./art/Cameo";
import type { Theme } from "../data/politiknetz";
import { Corners } from "./art/Ornament";
import { EventWindow, type GameEvent } from "./EventWindow";
import { EreignisFenster } from "./EreignisFenster";
import { Reich } from "./Reich";
import { WunderFenster } from "./reich/WunderFenster";
import { AbstimmungsKarte } from "./parlament/AbstimmungsKarte";
import { istAbstimmung } from "./parlament/abstimmung";
import { quittiereFeier, reichZustand, vorhabenDef } from "../sim/reich";
import { ERBE } from "../data/erbe";
import { kartenOrte } from "../sim/reich";
import type { KartenOrt } from "./atlas/AtlasMap";
import { Meldungen, type Meldung } from "./Meldungen";
import { bewerteHalt, hinweisKlasse, sammleUmlauf, type UmlaufEintrag } from "./autostopp";
import { ZielWahl } from "./ZielWahl";
import { Effekte } from "./Effekte";
import { MarkenLegende } from "./atlas/MarkenLegende";
import { ereignisMarkenText, reichMarken } from "./atlas/marken";
import { stadtInfos } from "./atlas/staedte";
import { provinceLonLat } from "./atlas/overlay";
import { BilanzFenster } from "./BilanzFenster";
import { Wahlabend } from "./wahl/Wahlabend";
import { Umbildung } from "./wahl/Umbildung";
import { rede, wahlabend, wahlabendQuittieren } from "../sim/wahl";
import { maxAmtszeiten, umbildungAbschliessen, umbildungBehalten, umbildungEntlassen, umbildungErsetzen, umbildungPartner, umbildungSicht, umbildungVersetzen, waehleZieleAmtszeit, type UmbildungErgebnis } from "../sim/amtszeit";
import { zieleAngebot } from "../sim/ziele";
import { erstelleBilanz } from "../sim/bilanz";
import { Plakette } from "./Kartenlegende";
import { LinsenWahl } from "./linsen/LinsenWahl";
import { ProvinceCard } from "./ProvinceCard";
import { ansicht, entscheide, vorlage } from "../sim/ereignisse";
import { stimmenSicht, stufeIn } from "../sim/handeln";
import { kapitalEinkommen, waehleZiele } from "../sim/spiel";
import { naechsterSchritt } from "../sim/programme";
import { Rng } from "../sim/rng";
import { beiSpeicherfehler, letzterSpeicherfehler, speichere, speichereWarten, sitzungBegonnen, vorsitzungSnapshot } from "./speicher";
import { standDerDinge, type StandDerDinge } from "./standderdinge";
import { StandDerDingeBlatt } from "./StandDerDingeBlatt";
import { PARTEI_NAME } from "../sim/fraktionen";
import { LAENDERNAMEN, LAND_PINS, farbenFuerEbene, laenderFarben, landName, type Kartenebene } from "./ebenen";
import { t, aktuelleLocale } from "../i18n";
import { kurzVergleich } from "./vergleich";
import { Zeitung } from "./Zeitung";
import { zeitungGelesen } from "../sim/zeitung";
import { Katastrophe } from "./Katastrophe";
import { SpeicherDossier } from "./SpeicherDossier";
import { Fehlergrenze } from "./Fehlergrenze";
import type { VorlagenZiel } from "../sim/ministerfluss-typen";
import { WirkungsberichtDossier } from "./politik/WirkungsberichtDossier";
import type { Bericht } from "../sim/berichte";
import { SprachWahl } from "./SprachWahl";
import { kapitalErklaerung, mehrheitsSicht } from "./akte/lage";

type Dossier =
  | "schreibtisch"
  | "verfassung"
  | "politik"
  | "bereiche"
  | "gespraech"
  | "wirtschaft"
  | "netz"
  | "entscheidungen"
  | "parlament"
  | "personen"
  | "chronik"
  | "beschluesse"
  | "waehler"
  | "wahlkampf"
  | "katastrophe"
  | "programme"
  | "welt"
  | "reich_kultur"
  | "reich_recht"
  | "reich_militaer"
  | "reich_infra"
  | "reich_haushalt"
  | "zeitung"
  | "speicher"
  | "wirkungsbericht"
  | null;

/** Millisekunden je Tick und Tage je Tick: Pause, ruhig, zügig, schnell, bis zum nächsten Ereignis. */
const SPEEDS = [0, 700, 200, 40, 14];
const TAGE_JE_TICK = [0, 1, 1, 1, 4];

/** Beschriftungen wie in einem Atlas: Meere und Nachbarländer. */
const GEO_LABELS: { text: string; lon: number; lat: number; kind: "meer" | "land" }[] = [
  { text: "Schwarzes Meer", lon: 34.6, lat: 43.1, kind: "meer" },
  { text: "Mittelmeer", lon: 31.0, lat: 34.6, kind: "meer" },
  { text: "Ägäis", lon: 25.0, lat: 38.4, kind: "meer" },
];

/** Alle 81 Provinzen erscheinen als Stadtbanner auf der Karte (ui/atlas/staedte.ts): bei Gedränge bleibt die Stadt mit dem höheren Rang */
const ALLE_PROVINZEN = PROVINCE_FC.features.map((f) => f.properties.plaka);

export function Stage({ world: initial, onNeu, geladen }: { world: World; onNeu: () => void; geladen?: boolean }) {
  const world = useRef<World>(initial);
  const [, setVersion] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [dossier, setDossier] = useState<Dossier>(null);
  // Beim Laden gibt es kein Amtsübergabe-Intro, sondern das „Stand der Dinge“-Blatt (Re-Entry)
  const [intro, setIntro] = useState<GameEvent | null>(() => (geladen ? null : startEvent(initial)));
  const [standDerD, setStandDerD] = useState<StandDerDinge | null>(() => (geladen && initial.spiel && !initial.spiel.ende ? standDerDinge(initial, vorsitzungSnapshot()) : null));
  const [spaeter, setSpaeter] = useState<Set<string>>(() => new Set());
  const [meldungen, setMeldungen] = useState<Meldung[]>([]);
  const [ebene, setEbene] = useState<Kartenebene>("gelaende");
  const [problemId, setProblemId] = useState<string | null>(null);
  const [netVorhaben, setNetVorhaben] = useState<{ id: string; level: number } | null>(null);
  const [erlassStart, setErlassStart] = useState<string | undefined>(undefined);
  const [netNode, setNetNode] = useState<string>("p_wassermangel");
  const [netTheme, setNetTheme] = useState<Theme | null>(null);
  /** Maßnahme, die „Politik“ gleich geöffnet zeigt (aus „Heute“ oder vom Schreibtisch) */
  const [politikStart, setPolitikStart] = useState<{ theme?: Theme; offen?: { id: string; level?: number; ort?: number[] | null } } | null>(null);
  const [netOrt, setNetOrt] = useState<number[] | null>(null);
  const [selected, setSelected] = useState<number | undefined>(undefined);
  /** Kamerafahrt der Karte, etwa zu einem fertigen Wunder */
  /** Reiter der Reich-Akte, den eine Marke der Karte vorgibt (sonst beginnt die Akte bei der Lage) */
  const [reichStart, setReichStart] = useState<"lage" | "bestand" | "neu" | undefined>(undefined);
  const [kamera, setKamera] = useState<{ lon: number; lat: number; d: number } | undefined>(undefined);
  const [bilanzZu, setBilanzZu] = useState(false);
  /** Umlauf (Klasse C der Auto-Stopp-Taxonomie): gesammelt statt unterbrechend; `umlaufNeu` zählt Ungelesenes für den Zähler am Schreibtisch. */
  const [umlauf, setUmlauf] = useState<UmlaufEintrag[]>([]);
  const [umlaufNeu, setUmlaufNeu] = useState(0);
  const umlaufZaehler = useRef(0);
  const gesehen = useRef(new Set<string>());
  const letzteSicherung = useRef(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const w = world.current;
  const spiel = w.spiel;

  const sichere = useCallback((sofort = false) => {
    const jetzt = Date.now();
    if (!sofort && jetzt - letzteSicherung.current < 3000) return;
    letzteSicherung.current = jetzt;
    speichere(world.current);
  }, []);

  const melde = useCallback((m: Omit<Meldung, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setMeldungen((l) => [...l.slice(-2), { ...m, id }]);
    window.setTimeout(() => setMeldungen((l) => l.filter((x) => x.id !== id)), 8000);
  }, []);

  /** Klasse C hält nie an: Die Meldung geht in den Sammel-Hinweis (Zähler am Schreibtisch), lesbar beim nächsten Stopp. */
  const umlaufPush = useCallback((m: Omit<UmlaufEintrag, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    umlaufZaehler.current += 1;
    setUmlaufNeu(umlaufZaehler.current);
    setUmlauf((l) => sammleUmlauf(l, [{ ...m, id }]));
  }, []);

  const umlaufGelesen = useCallback(() => {
    umlaufZaehler.current = 0;
    setUmlaufNeu(0);
  }, []);

  // Zeit läuft: Ein Tick rechnet einen oder mehrere Tage. Die Auto-Stopp-Taxonomie (ui/autostopp.ts) entscheidet,
  // was anhält: A (Entscheidung) und B (Wendepunkt) stoppen, C (Umlauf) sammelt sich lautlos am Schreibtisch.
  useEffect(() => {
    const ms = SPEEDS[speed]!;
    if (!ms) return;
    const schritt = TAGE_JE_TICK[speed]!;
    const startTag = world.current.day;
    const id = setInterval(() => {
      try {
      const wd = world.current;
      const before = wd.log.length;
      let halt = false;
      for (let i = 0; i < schritt && !halt; i++) {
        advance(wd, 1);
        const s = wd.spiel;
        if (!s) continue;
        // C-Hinweise halten nie; sie wandern aus der Warteschlange in den Sammel-Hinweis
        const bw = bewerteHalt(s, gesehen.current);
        if (bw.umlaufHinweise.length) {
          s.hinweise = s.hinweise.filter((h) => hinweisKlasse(h.id) !== "C");
          for (const h of bw.umlaufHinweise) umlaufPush({ datum: formatDateDe(wd.date), titel: h.titel, text: h.text.join(" ") });
        }
        if (bw.halt) halt = true;
      }
      const s = wd.spiel;
      if (s) for (const e of s.ereignisse) gesehen.current.add(e.id);
      // Die Monatsumfrage erscheint nicht mehr als nackte Zahl: Das Institut publiziert sie IN der
      // Zeitung (UI-1); die Ausgabe selbst meldet der C-Hinweis „zeitung-*" in den Umlauf.
      // Meldungen für das, was ohne Zutun des Spielers geschah (alles Klasse C: Feed plus Sammel-Hinweis)
      const titel = new Set((s?.ereignisse ?? []).map((e) => vorlage(e.vorlage).titel(wd, e)));
      for (const l of wd.log.slice(before)) {
        // Abstimmungen zeigt die Abstimmungskarte, nicht der Meldungsstapel
        if (l.kind === "statistik" || titel.has(l.text) || istAbstimmung(l.text)) continue;
        const ton: Meldung["ton"] = l.kind === "markt" ? "markt" : l.text.includes("Zentralbank") ? "bank" : l.text.includes("Parlament") ? "parlament" : "ereignis";
        melde({ titel: l.text, ...(l.why ? { text: l.why } : {}), ton });
        umlaufPush({ datum: formatDateDe(l.date), titel: l.text, ...(l.why ? { text: l.why } : {}) });
      }
      if (halt) {
        setSpeed(0);
        sichere(true);
        // Beim nächsten Stopp ist lesbar, was der Umlauf gesammelt hat
        const n = umlaufZaehler.current;
        if (n > 0) melde({ titel: `${n} ${n === 1 ? "Meldung" : "Meldungen"} im Umlauf`, text: "Routine ohne Entscheidung — gesammelt am Schreibtisch.", ton: "ereignis" });
      } else if (speed === 4 && wd.day - startTag > 150) {
        setSpeed(0);
        melde({ titel: "Ein halbes Jahr ohne Zwischenfall.", text: "Das Vorspulen hält an; die Lage bleibt Ihre Sache.", ton: "ereignis" });
      } else if (wd.day % 30 === 0) sichere();
      refresh();
      } catch (e) {
        // Ein Fehler im Spieltakt darf das Spiel nicht beenden: Zeit anhalten, sichern (der Stand vor dem Fehler), Hinweis mit Ursache
        console.error("Fehler im Spieltakt:", e);
        setSpeed(0);
        melde({ titel: "Die Zeit wurde angehalten: Fehler im Spielablauf", text: e instanceof Error ? e.message : String(e), ton: "markt" });
      }
    }, ms);
    return () => clearInterval(id);
  }, [speed, refresh, melde, sichere, umlaufPush]);

  // Nur im Entwicklungsmodus: Weltzustand für Browsertests erreichbar machen
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __welt?: World; __neu?: () => void }).__welt = world.current;
  }, []);

  // Beim Laden beginnt eine neue Sitzung: Der geladene Stand wird zur Vergleichsbasis der nächsten Rückkehr
  const sitzungMarkiert = useRef(false);
  useEffect(() => {
    if (sitzungMarkiert.current) return;
    sitzungMarkiert.current = true;
    if (geladen) sitzungBegonnen(world.current);
  }, [geladen]);

  // Fehler außerhalb der Anzeige (Zeitgeber, Versprechen) erscheinen als Meldung statt still zu verpuffen
  useEffect(() => {
    const zeige = (text: string) => {
      console.error("Unbehandelter Fehler:", text);
      melde({ titel: "Interner Fehler (das Spiel läuft weiter)", text: text.slice(0, 200), ton: "markt" });
    };
    const bei = (e: ErrorEvent) => {
      if (/getBoundingClientRect|ResizeObserver/.test(e.message)) return;
      zeige(e.message);
    };
    const beiVersprechen = (e: PromiseRejectionEvent) => zeige(e.reason instanceof Error ? e.reason.message : String(e.reason));
    window.addEventListener("error", bei);
    window.addEventListener("unhandledrejection", beiVersprechen);
    return () => {
      window.removeEventListener("error", bei);
      window.removeEventListener("unhandledrejection", beiVersprechen);
    };
  }, [melde]);

  // Sichern beim Beenden: Die App ruft vor dem Schließen `window.__sichereJetzt()` auf; ein Browser sichert beim Verstecken des Tabs.
  useEffect(() => {
    const w = window as unknown as { __sichereJetzt?: () => Promise<unknown> };
    w.__sichereJetzt = () => speichereWarten(world.current);
    const beiVerstecken = () => {
      if (document.visibilityState === "hidden") void speichereWarten(world.current);
    };
    document.addEventListener("visibilitychange", beiVerstecken);
    window.addEventListener("pagehide", beiVerstecken);
    return () => {
      delete w.__sichereJetzt;
      document.removeEventListener("visibilitychange", beiVerstecken);
      window.removeEventListener("pagehide", beiVerstecken);
    };
  }, []);

  // Leertaste: Pause und Weiter
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ziel = e.target as HTMLElement;
      if (e.code !== "Space" || ["INPUT", "TEXTAREA", "BUTTON"].includes(ziel.tagName)) return;
      e.preventDefault();
      setSpeed((s) => (s === 0 ? 1 : 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Marken: offene Ereignisse mit Ort und die drei schwersten akuten Probleme
  const marken = useMemo(() => {
    const out: { id: string; plaka: number; art: "ereignis" | "frist" | "krise"; text: string }[] = [];
    if (!spiel) return out;
    for (const e of spiel.ereignisse) {
      const plaka = e.provinzen[0];
      if (!plaka) continue;
      const v = vorlage(e.vorlage);
      const tage = Math.max(0, e.frist - w.day);
      out.push({ id: e.id, plaka, art: tage <= 5 ? "frist" : "ereignis", text: ereignisMarkenText(v.titel(w, e), tage) });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spiel?.ereignisse.length, w.day]);

  // Tafel, Größenzeichen und Statussymbole der Stadtbanner: ändert sich mit Netz, Ereignissen und laufenden Vorhaben
  const stadtInfo = useMemo(
    () => stadtInfos(w, marken),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [marken, w.net.month, spiel?.reich?.laufend.length, w.day - (w.day % 10)],
  );

  const laenderKarte = useMemo(
    () => (ebene === "welt" ? laenderFarben(w) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ebene, w.day - (w.day % 10), spiel?.welt],
  );
  const laenderPins = useMemo(
    () =>
      spiel
        ? LAND_PINS.map((p) => {
            const v = beziehungZurTuerkei(w, p.id).vertrauen;
            return { ...p, name: p.id === "EU" ? landName("EU") : landName(p.iso), ton: (v >= 55 ? "gut" : v >= 35 ? "mittel" : "schlecht") as "gut" | "mittel" | "schlecht" };
          })
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [w.day - (w.day % 10), spiel?.welt],
  );
  const [weltStart, setWeltStart] = useState<string | undefined>(undefined);
  const [weltTab, setWeltTab] = useState<WeltTab | undefined>(undefined);
  const [landAuswahl, setLandAuswahl] = useState<LandAuswahl | null>(null);

  const geoLabels = useMemo(
    () => [
      { text: t("karte.meer.schwarz"), lon: 34.6, lat: 43.1, kind: "meer" as const },
      { text: t("karte.meer.mittel"), lon: 31.0, lat: 34.6, kind: "meer" as const },
      { text: t("karte.meer.aegaeis"), lon: 25.0, lat: 38.4, kind: "meer" as const },
    ],
    [],
  );

  // Marken für Wunder und Bauvorhaben immer, für Stätten in der Kartenebene „Kulturerbe“
  // Marken der Reich-Akten (Bauvorhaben, Wunder, Kulturerbe) mit allem, was die Tafel beim Überfahren zeigt: ui/atlas/marken.ts
  const orte = useMemo<KartenOrt[]>(
    () => reichMarken(w, ebene),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ebene, spiel?.reich, spiel?.reich?.laufend.length, w.day - (w.day % 10)],
  );

  const { fill, legende } = useMemo(
    () => farbenFuerEbene(w, ebene, problemId, netNode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ebene, problemId, netNode, w.net.month, w.parliament, w.day - (w.day % 30)],
  );

  const inflation = w.published.inflation.value;
  const own = w.player?.partei.kurz;
  const stimmen = spiel ? stimmenSicht(w) : null;
  // Die Mehrheit zählt das Lager und die Fraktionen, die es gerade dulden
  const bloc = stimmen ? stimmen.lager + stimmen.duldungSitze : (own ? (w.parliament?.seats[own] ?? 0) : 0);
  // Mehrheit getrennt nach Lager, Duldung und Opposition; nie eine Gesamtzahl wie „600/600“
  const mehr = mehrheitsSicht(w);
  const [hudExtra, setHudExtra] = useState<Set<HudExtra>>(ladeHudExtra);
  const wechsleHudExtra = (x: HudExtra) =>
    setHudExtra((alt) => {
      const neu = new Set(alt);
      if (neu.has(x)) neu.delete(x);
      else neu.add(x);
      try {
        localStorage.setItem(HUD_SCHLUESSEL, JSON.stringify([...neu]));
      } catch {
        /* nur für diese Sitzung */
      }
      return neu;
    });
  const trust = nationalAverage(NET, w.net, "vertrauen_regierung");
  const zustimmung = spiel?.umfrage.zustimmung ?? trust;
  const zVor = spiel && spiel.umfrage.verlauf.length > 3 ? spiel.umfrage.verlauf[spiel.umfrage.verlauf.length - 4]!.wert : undefined;

  // Navigation in drei Ebenen (VISION_IM_DETAIL 0.2): die Karte liegt immer darunter, der Schreibtisch ist die Zentrale des Tages,
  // dazu neun Akten nach einem Muster. Die alten Ansichten sind umgezogen, nicht neu gebaut; ihre Kennungen bleiben, damit alle Sprünge gelten.
  const menue: { kurz: string; titel: string; icon: IconName; badge?: number; umlauf?: number; tabs: { id: Exclude<Dossier, null>; label: string }[] }[] = [
    {
      kurz: t("nav.schreibtisch"),
      titel: t("nav.schreibtischTitel"),
      icon: "feder",
      badge: (spiel?.ereignisse.length ?? 0) || undefined,
      umlauf: umlaufNeu || undefined,
      tabs: [
        { id: "schreibtisch", label: t("buehne.tab.schreibtisch") },
        { id: "bereiche", label: t("buehne.tab.heute") },
        { id: "politik", label: t("nav.tab.probleme") },
        { id: "chronik", label: t("buehne.tab.chronik") },
        { id: "wirkungsbericht", label: t("buehne.tab.wirkungsbericht") },
        { id: "netz", label: t("nav.tab.warum") },
        { id: "speicher", label: t("buehne.tab.speicher") },
      ],
    },
    {
      kurz: t("nav.wirtschaft"),
      titel: t("nav.wirtschaftTitel"),
      icon: "bank",
      // „entscheidungen“ bleibt als Einstieg für Zinssitzung und Erlasse
      tabs: [
        { id: "wirtschaft", label: t("buehne.tab.wirtschaft") },
        { id: "reich_haushalt", label: t("buehne.tab.haushalt") },
      ],
    },
    {
      kurz: t("nav.gesellschaft"),
      titel: t("nav.gesellschaftTitel"),
      icon: "menge",
      tabs: [
        { id: "waehler", label: t("buehne.tab.waehler") },
        { id: "wahlkampf", label: t("buehne.tab.wahlkampf") },
      ],
    },
    {
      kurz: t("nav.recht"),
      titel: t("nav.rechtTitel"),
      icon: "waage",
      badge: (spiel?.gesetze.length ?? 0) + (spiel?.verfassungsvorgang?.laufend ? 1 : 0) || undefined,
      tabs: [
        { id: "parlament", label: t("buehne.tab.parlament") },
        { id: "beschluesse", label: t("buehne.tab.beschluesse") },
        { id: "verfassung", label: t("buehne.tab.verfassung") },
        { id: "reich_recht", label: t("buehne.tab.recht") },
      ],
    },
    {
      kurz: t("nav.regierung"),
      titel: t("nav.regierungTitel"),
      icon: "person",
      tabs: [
        { id: "personen", label: t("buehne.tab.personen") },
        { id: "gespraech", label: t("buehne.tab.gespraech") },
      ],
    },
    {
      kurz: t("nav.sicherheit"),
      titel: t("nav.sicherheitTitel"),
      icon: "siegel",
      tabs: [{ id: "reich_militaer", label: t("buehne.tab.militaer") }],
    },
    {
      kurz: t("nav.aussen"),
      titel: t("nav.aussenTitel"),
      icon: "berg",
      tabs: [{ id: "welt", label: t("buehne.tab.welt") }],
    },
    {
      kurz: t("nav.land"),
      titel: t("nav.landTitel"),
      icon: "karte",
      badge: (spiel?.katastrophen?.faelle.filter((f) => !f.bewaeltigt).length ?? 0) + (spiel?.reich?.laufend.length ?? 0) || undefined,
      tabs: [
        { id: "reich_infra", label: t("buehne.tab.infra") },
        { id: "reich_kultur", label: t("buehne.tab.kultur") },
        { id: "katastrophe", label: t("buehne.tab.katastrophe") },
      ],
    },
    {
      kurz: t("nav.wissen"),
      titel: t("nav.wissenTitel"),
      icon: "buch",
      tabs: [{ id: "programme", label: t("buehne.tab.programme") }],
    },
    {
      kurz: t("nav.medien"),
      titel: t("nav.medienTitel"),
      icon: "zeitung",
      umlauf: (spiel?.zeitung?.ungelesen ?? 0) || undefined,
      tabs: [{ id: "zeitung", label: t("buehne.tab.zeitung") }],
    },
  ];
  const gruppe = menue.find((m) => m.tabs.some((t) => t.id === dossier) || (dossier === "entscheidungen" && m.tabs.some((t) => t.id === "wirtschaft")));

  /** Mit welchem Reiter die Wirtschaftsakte öffnet (das Ereignisfenster springt in den Haushalt) */
  const [wirtschaftStart, setWirtschaftStart] = useState<"lage" | "haushalt">("lage");
  const [umbSpaeterBis, setUmbSpaeterBis] = useState<number | null>(null);
  const [umbMeldung, setUmbMeldung] = useState<string | undefined>(undefined);
  const offen = spiel?.ereignisse.find((e) => !spaeter.has(e.id));
  // Ereigniskamera: Ein Ereignis mit Provinzen lässt die Kamera hinfliegen und einen Ring auf der Karte laufen; Beben zittern (nur Effekte „hoch“)
  const ereignisKarte = useMemo(() => {
    if (!offen || offen.provinzen.length === 0) return undefined;
    const v = offen.vorlage;
    const art = /beben/.test(v) ? "beben" : /anschlag|terror/.test(v) ? "anschlag" : /krieg|putsch/.test(v) ? "krieg" : "ereignis";
    const kamera = art !== "ereignis" || /flut|brand|duerre|ueberschwemm|katastrophe|erdrutsch/.test(v);
    const ll = provinceLonLat(offen.provinzen[0]!);
    if (!ll) return undefined;
    return { id: offen.id, lon: ll[0], lat: ll[1], art, d: offen.provinzen.length > 1 ? 8.5 : 6.5, kamera } as const;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offen?.id]);
  // Klasse B (Wendepunkt) und A (etwa der Wahlabend, INN-5) werden zum Fenster; C-Hinweise sind längst im Umlauf
  // Der Wahlabend hat eine eigene Ansicht (ui/wahl/Wahlabend.tsx): sein Hinweis erscheint nicht noch einmal als Fenster
  const hinweis = spiel?.hinweise.find((h) => hinweisKlasse(h.id) !== "C" && h.id !== spiel.wahl?.abend);
  const wahlErg = spiel ? wahlabend(w) : undefined;
  const bilanz = spiel?.ende && !bilanzZu && !wahlErg;
  const zielWahlOffen = !!spiel && !spiel.ersterTagErledigt && !intro && !standDerD;
  // Neue Amtszeit: Umbildungsfenster und Zielwahl (sim/amtszeit.ts); „Später" blendet das Umbildungsfenster nur bis zum Ende seiner Frist aus
  const umbSicht = spiel ? umbildungSicht(w) : null;
  const umbOffen = !!umbSicht?.offen && umbSpaeterBis !== spiel?.umbildung?.bis;
  const neueZiele = !!spiel?.zielwahl?.offen;
  const blockiert = !!wahlErg || umbOffen || neueZiele;

  const beendeZeit = () => setSpeed(0);
  /** Eine Aktion im Umbildungsfenster: Text merken, sichern, neu zeichnen */
  const umbAktion = (r: UmbildungErgebnis) => {
    setUmbMeldung(r.text);
    if (r.ok) sichere(true);
    refresh();
  };
  const oeffneDossier = (d: Dossier) => {
    if (d === "politik") setPolitikStart(null);
    if (d === "schreibtisch") umlaufGelesen();
    if (d === "zeitung") zeitungGelesen(world.current); // Badge „Neue Ausgabe" erlischt beim Öffnen
    setDossier(d);
    if (d) beendeZeit();
  };
  const [aktiverBericht, setAktiverBericht] = useState<Bericht | null>(null);

  /** Zustand des Sichern-Knopfs: ruhig, gerade gesichert (kurz) oder Fehler (bleibt, bis ein Sichern gelingt) */
  const [sicherStatus, setSicherStatus] = useState<"ruhig" | "frisch" | "fehler">(() => (letzterSpeicherfehler() ? "fehler" : "ruhig"));
  const [sicherGrund, setSicherGrund] = useState<string | null>(() => letzterSpeicherfehler());
  const frischTimer = useRef<number | undefined>(undefined);

  // Scheitert ein automatisches Sichern, sieht der Spieler es sofort am Knopf (früher verschwand der Fehler still)
  useEffect(() => {
    return beiSpeicherfehler((grund) => {
      setSicherGrund(grund);
      if (grund) {
        setSicherStatus("fehler");
        melde({ titel: "Spielstand NICHT gesichert", text: grund, ton: "markt" });
      } else {
        setSicherStatus((s) => (s === "fehler" ? "ruhig" : s));
      }
    });
  }, [melde]);

  const schnellSichern = useCallback(async () => {
    const r = await speichereWarten(world.current);
    window.clearTimeout(frischTimer.current);
    if (r.ok) {
      const datum = formatDateDe(world.current.date);
      const zustimmung = Math.round(world.current.spiel?.umfrage.zustimmung ?? 0);
      setSicherGrund(null);
      setSicherStatus("frisch");
      frischTimer.current = window.setTimeout(() => setSicherStatus("ruhig"), 2600);
      melde({ titel: "Spielstand gesichert", text: `${datum} · ${zustimmung} % Zustimmung (${r.wo})`, ton: "ereignis" });
    } else {
      setSicherGrund(r.grund);
      setSicherStatus("fehler");
      melde({ titel: "Spielstand NICHT gesichert", text: r.grund, ton: "markt" });
    }
  }, [melde]);

  // Tastenkürzel Cmd+S / Ctrl+S zum Schnellspeichern
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void schnellSichern();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [schnellSichern]);

  /** Ein Klick auf die Meldung „Wirkungsbericht: <Maßnahme>, <n> Monate danach“ öffnet genau diesen Bericht (nicht den ersten mit ähnlichem Namen). */
  const oeffneBerichtAusMeldung = useCallback((m: Meldung) => {
    const berichte = world.current.spiel?.berichte ?? [];
    const treffer = /^Wirkungsbericht:\s*(.+),\s*(\d+) Monate danach$/.exec(m.titel.trim());
    const name = treffer?.[1]?.trim();
    const monate = treffer ? Number(treffer[2]) : undefined;
    const gefunden =
      [...berichte].reverse().find((b) => name !== undefined && monate !== undefined && (b.name ?? "") === name && b.monate === monate) ??
      [...berichte].reverse().find((b) => name !== undefined && (b.name ?? b.titel).includes(name)) ??
      berichte[berichte.length - 1];
    if (gefunden) {
      setAktiverBericht(gefunden);
      setDossier("wirkungsbericht");
      setSpeed(0);
    }
  }, []);

  /** Wohin ein Eintrag des Schreibtischs führt: eine Akte, ein Bereich oder eine Maßnahme der Politik, ein Ereignis oder ein Land. */
  const gehe = (z: Ziel) => {
    switch (z.art) {
      case "akte":
        oeffneDossier(z.akte);
        break;
      case "politik":
        setPolitikStart(z.massnahme ? { offen: z.massnahme, ...(z.theme ? { theme: z.theme } : {}) } : z.theme ? { theme: z.theme } : null);
        setDossier("politik");
        beendeZeit();
        break;
      case "ereignis":
        setDossier(null);
        setSpaeter((sp) => {
          const n = new Set(sp);
          n.delete(z.id);
          return n;
        });
        break;
      case "land":
        setWeltStart(z.id);
        oeffneDossier("welt");
        break;
    }
  };

  /** Verweise aus den Vorlagen der Minister: eine Akte, ein Land oder die Problemkarte */
  const geheVorlage = (z: VorlagenZiel) => {
    if (z.art === "karte") {
      setEbene("probleme");
      setProblemId(z.problemId ?? null);
      setDossier(null);
      beendeZeit();
    } else gehe(z as Ziel);
  };
  const zeigeKarte = (problemId?: string) => geheVorlage({ art: "karte", ...(problemId ? { problemId } : {}) });

  return (
    <div className="stage">
      <AtlasMap
        className="stage-map"
        sparsam={!!dossier}
        fill={fill}
        fillAlpha={ebene === "wahl" ? 0.56 : 0.62}
        selected={selected}
        labels={ALLE_PROVINZEN}
        stadtInfo={stadtInfo}
        geoLabels={geoLabels}
        onSelect={(p) => setSelected(p)}
        orte={orte}
        onOrt={(id, ort) => {
          // Klick auf eine Marke: die Akte des Reiches öffnen, im Reiter, den die Tafel genannt hat (Lage oder Pflegen)
          setReichStart(ort?.klickTab);
          if (id.startsWith("erbe:")) setDossier("reich_kultur");
          else {
            const b = vorhabenDef(id.slice(2))?.bereich ?? reichZustand(w).regional?.[id.slice(2)]?.def.bereich ?? reichZustand(w).frei?.[id.slice(2)]?.def.bereich;
            setDossier(b === "kultur" ? "reich_kultur" : b === "recht" ? "reich_recht" : b === "militaer" ? "reich_militaer" : b === "haushalt" ? "reich_haushalt" : "reich_infra");
          }
          beendeZeit();
        }}
        marken={marken}
        onMarke={(id) => {
          const ev = spiel?.ereignisse.find((e) => e.id === id);
          if (ev) {
            setSpaeter((sp) => { const n = new Set(sp); n.delete(id); return n; });
            setDossier(null);
          } else {
            const plaka = Number(id.split(":")[1]);
            if (plaka) { setSelected(plaka); setEbene("probleme"); }
          }
        }}
        laenderPins={laenderPins}
        {...(landAuswahl ? { landAuswahl: landAuswahl.iso } : {})}
        onLand={(iso, pos) => setLandAuswahl({ iso, x: pos?.x ?? window.innerWidth / 2, y: pos?.y ?? window.innerHeight / 2 })}
        {...(ebene === "welt" ? { laenderFarben: laenderKarte } : {})}
        ebene={ebene}
        datum={w.date}
        {...(ereignisKarte ? { ereignis: ereignisKarte } : {})}
        {...(kamera ? { camera: kamera } : {})}
      />

      <header className="hud">
        <div className="hud-bar" />
        <div className="hud-left">
          <div className="leader">
            <Cameo seed={w.player?.name ?? "Staatspräsident"} size={46} tint={w.player?.partei.farbe} ring="keiner" />
          </div>
          <div className="leader-text">
            <div className="hud-name" title={w.player?.name ?? "Staatspräsident"}>{w.player?.name ?? "Staatspräsident"}</div>
            <div className="hud-sub" title={`${w.player?.partei.name ?? "Staatsräson"} · ${t("buehne.staatsoberhaupt")}`}>
              <span className="party-dot" style={{ background: w.player?.partei.farbe }} /> <span className="hud-partei">{w.player?.partei.name ?? "Staatsräson"} · {t("buehne.staatsoberhaupt")}</span>
            </div>
          </div>
        </div>
        <div className="hud-center">
          <div className="datum">
            <span className="date-day">{formatDateDe(w.date)}</span>
            <div className="speeds" role="group" aria-label="Spieltempo">
              {[0, 1, 2, 3, 4].map((i) => (
                <button
                  key={i}
                  className={i === speed ? "on" : ""}
                  onClick={() => setSpeed(i)}
                  aria-label={i === 0 ? "Pause" : i === 4 ? "Bis zum nächsten Ereignis" : `Tempo ${i}`}
                  title={i === 0 ? "Pause (Leertaste)" : i === 4 ? "Bis zum nächsten Ereignis" : `Tempo ${i}`}
                >
                  {i === 0 ? <span className="pause-glyph" /> : i === 4 ? <span className="skip-glyph" /> : Array.from({ length: i }, (_, k) => <span key={k} className="play-glyph" />)}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`hud-speichern${sicherStatus === "fehler" ? " fehler" : sicherStatus === "frisch" ? " frisch" : ""}`}
              onClick={() => void schnellSichern()}
              title={sicherStatus === "fehler" ? `Nicht gesichert: ${sicherGrund ?? "Unbekannter Fehler"}` : "Zwischenstand sichern (Cmd+S / Strg+S)"}
              aria-label={sicherStatus === "fehler" ? "Spielstand nicht gesichert, erneut versuchen" : "Zwischenstand sichern"}
            >
              <Icon name={sicherStatus === "fehler" ? "warnung" : "siegel"} size={14} />
              <span>{sicherStatus === "fehler" ? t("buehne.nichtGesichert") : sicherStatus === "frisch" ? t("buehne.gesichert") : t("buehne.sichern")}</span>
            </button>
            <SprachWahl className="hud-sprache" kurz />
          </div>
        </div>
        <div className="hud-right">
          {spiel && (
            <Stat
              icon="haende"
              label={t("buehne.stat.zustimmung")}
              value={`${Math.round(zustimmung)} %`}
              trend={zVor !== undefined ? zustimmung - zVor : undefined}
              warn={zustimmung < 40}
              tip={`Wie viele Wähler Sie heute wieder wählen würden. Die nächste Wahl ist in ${Math.max(0, Math.round((spiel.wahltag - w.day) / 30.4))} Monaten; ab 50 Prozent gewinnen Sie.`}
            />
          )}
          {spiel && <Stat icon="siegel" label={t("buehne.stat.kapitalKurz")} value={`${Math.floor(spiel.kapital)}`} warn={spiel.kapital < 5} tip={kapitalErklaerung(w)} />}
          {mehr.vorhanden && (
            <Stat
              icon="parlament"
              label={t("nav.mehrheit.titel")}
              value={mehr.geduldet > 0 ? `${mehr.lager} + ${mehr.geduldet}` : `${mehr.lager}`}
              warn={!mehr.steht}
              tip={t("nav.mehrheit.hinweis", { lager: mehr.lager, geduldet: mehr.geduldet, opp: mehr.opposition, schwelle: mehr.schwelle })}
              unter={mehr.steht ? `${t("nav.mehrheit.schwelle", { n: mehr.schwelle })} · ${t("nav.mehrheit.steht")}` : `${t("nav.mehrheit.schwelle", { n: mehr.schwelle })} · ${t("nav.mehrheit.fehlt", { n: mehr.fehlt })}`}
            />
          )}
          {hudExtra.has("inflation") && (
  <Stat icon="preis" label={t("buehne.stat.inflation")} value={`${inflation.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`} trend={trend(w, "inflation")} tip={`Preisanstieg zum Vorjahresmonat, veröffentlicht vom Statistikamt mit einigen Wochen Verzögerung. ${kurzVergleich("FP.CPI.TOTL.ZG") ?? ""}`} />
          )}
          {hudExtra.has("lira") && (
  <Stat icon="lira" label={t("buehne.stat.lira")} value={w.economy.usdTry.toLocaleString("de-DE", { maximumFractionDigits: 1 })} trend={trend(w, "usdTry")} tip={`Wechselkurs am Markt, täglich. Steigt er, werden Importe wie Energie teurer. ${kurzVergleich("PA.NUS.FCRF.ABW") ?? ""}`} />
          )}
          {hudExtra.has("leitzins") && (
  <Stat icon="bank" label={t("buehne.stat.leitzins")} value={`${w.economy.policyRate.toLocaleString("de-DE")} %`} trend={trend(w, "policyRate")} tip="Setzt der Geldpolitische Ausschuss der Zentralbank, achtmal im Jahr." />
          )}
          <HudWahl gewaehlt={hudExtra} onWechsel={wechsleHudExtra} />
        </div>
      </header>

      <Alerts world={w} bloc={bloc} onProblems={() => { setEbene("probleme"); setProblemId(null); oeffneDossier("bereiche"); }} onDesk={() => oeffneDossier("schreibtisch")} onParlament={() => oeffneDossier("parlament")} onEreignis={() => { setSpaeter(new Set()); }} onProgramm={() => oeffneDossier("programme")} onZins={() => { setErlassStart(undefined); oeffneDossier("entscheidungen"); }} />

      <Meldungen items={meldungen} onClose={(id) => setMeldungen((l) => l.filter((x) => x.id !== id))} onOeffne={oeffneBerichtAusMeldung} />
      <AbstimmungsKarte world={w} />

      <nav className="dossier-menu" aria-label={t("nav.aria")}>
        {menue.map((m) => (
          <button key={m.kurz} className={gruppe === m ? "on" : ""} onClick={() => oeffneDossier(gruppe === m ? null : m.tabs[0]!.id)} aria-label={m.titel} title={m.titel}>
            <Icon name={m.icon} />
            {m.badge !== undefined && <span className="menu-badge">{m.badge}</span>}
            {m.umlauf !== undefined && <span className="menu-badge ruhig" title="Umlauf: gesammelte Meldungen ohne Entscheidung">{m.umlauf}</span>}
            <span className="menu-kurz">{m.kurz}</span>
          </button>
        ))}
      </nav>

      {dossier && (
        <section className={`dossier frame${dossier === "netz" ? " full" : dossier === "schreibtisch" || dossier === "gespraech" || dossier === "waehler" || dossier === "wahlkampf" || dossier === "katastrophe" || dossier === "welt" || dossier === "wirtschaft" || dossier === "entscheidungen" || dossier === "parlament" || dossier === "verfassung" || dossier === "personen" || dossier === "chronik" || dossier === "bereiche" || dossier === "politik" || dossier === "beschluesse" || dossier === "programme" || dossier === "zeitung" || dossier === "speicher" || dossier === "wirkungsbericht" || dossier?.startsWith("reich_") ? " wide" : ""}${dossier === "politik" || dossier === "schreibtisch" ? " po-breit" : ""}`} aria-label={gruppe?.titel}>
          <Corners />
          <header className="dossier-head">
            <h2>{gruppe?.titel}</h2>
            {gruppe && gruppe.tabs.length > 1 && (
              <div className="dossier-tabs" role="tablist" aria-label={`${gruppe.titel}: Ansicht`}>
                {gruppe.tabs.map((t) => (
                  <button key={t.id} role="tab" aria-selected={dossier === t.id} className={dossier === t.id ? "on" : ""} onClick={() => { if (t.id === "politik") setPolitikStart(null); setDossier(t.id); }}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            <button className="close" onClick={() => setDossier(null)} aria-label="Schließen">
              ✕
            </button>
          </header>
          <div className="dossier-body">
            <Fehlergrenze titel={gruppe?.titel ?? "Akte"} onZu={() => setDossier(null)} zuruecksetzen={dossier}>
            {dossier !== "wirtschaft" && zweckVon(dossier, gruppe?.kurz) && <p className="dossier-zweck">{zweckVon(dossier, gruppe?.kurz)}</p>}
            {dossier === "schreibtisch" && <Schreibtisch world={w} refresh={() => { refresh(); sichere(true); }} onGehe={gehe} umlauf={umlauf} onKarte={zeigeKarte} onPosteingang={() => oeffneDossier("personen")} />}
            {dossier === "zeitung" && <Zeitung world={w} onGehe={gehe} />}
            {dossier === "gespraech" && <Chat world={w} refresh={() => { refresh(); sichere(true); }} />}
            {dossier === "speicher" && (
              <SpeicherDossier
                world={w}
                onLaden={(nw) => {
                  world.current = nw;
                  refresh();
                  sichere(true);
                }}
                onGespeichert={(msg) => melde({ titel: msg, ton: "ereignis" })}
                onClose={() => setDossier(null)}
              />
            )}
            {dossier === "wirkungsbericht" && (
              <WirkungsberichtDossier
                world={w}
                gewaehlterBericht={aktiverBericht}
                onMassnahmeOeffnen={(mid) => {
                  setPolitikStart({ offen: { id: mid } });
                  setDossier("politik");
                }}
                onClose={() => setDossier(null)}
              />
            )}
            {dossier === "politik" && (
              <Politik
                key={politikStart ? `${politikStart.theme ?? ""}|${politikStart.offen?.id ?? ""}|${politikStart.offen?.level ?? ""}|${politikStart.offen?.ort?.join(",") ?? ""}` : "politik"}
                {...(politikStart?.offen ? { startOffen: politikStart.offen } : {})}
                {...(politikStart?.theme ? { start: politikStart.theme } : {})}
                world={w}
                refresh={() => { refresh(); sichere(true); }}
                onDecided={() => { refresh(); sichere(true); }}
                onShowOnMap={(id) => {
                  setNetNode(id);
                  setEbene("netz");
                }}
                onEingriff={(option) => { setErlassStart(option); setDossier("entscheidungen"); }}
                onOpen={(ziel) => setDossier(ziel)}
              />
            )}
            {dossier === "bereiche" && (
              <Bereiche
                world={w}
                refresh={() => { refresh(); sichere(true); }}
                onGehe={geheVorlage}
                onKarte={zeigeKarte}
                onBereiche={() => { setPolitikStart(null); setDossier("politik"); }}
                onVorhaben={(v) => {
                  setPolitikStart({ offen: { id: v.massnahme, level: v.ziel, ort: v.ort } });
                  setDossier("politik");
                }}
              />
            )}
            {dossier === "wirtschaft" && <EconomyFile key={wirtschaftStart} world={w} start={wirtschaftStart} onGeaendert={() => { refresh(); sichere(true); }} />}
            {(dossier === "parlament" || dossier === "beschluesse") && (
              <Beschlussbuch
                teil={dossier === "parlament" ? "parlament" : "beschluesse"}
                world={w}
                refresh={() => { refresh(); sichere(true); }}
                onBerichtOeffnen={(b) => {
                  setAktiverBericht(b);
                  setDossier("wirkungsbericht");
                }}
              />
            )}
            {dossier === "verfassung" && <VerfassungWerkstatt world={w} refresh={() => { refresh(); sichere(true); }} />}
            {dossier === "programme" && (
              <Programme
                world={w}
                refresh={() => { refresh(); sichere(true); }}
                onMassnahme={(id, richtung) => {
                  setNetTheme(null);
                  setNetOrt(null);
                  setNetVorhaben({ id, level: Math.max(0, Math.min(100, Math.round(stufeIn(w, id, null)) + 20 * richtung)) });
                  setDossier("netz");
                }}
              />
            )}
            {dossier === "welt" && (
              <Welt
                key={`${weltStart ?? "start"}-${weltTab ?? "ueberblick"}`}
                {...(weltStart ? { start: weltStart } : {})}
                {...(weltTab ? { startTab: weltTab } : {})}
                world={w}
                refresh={() => { refresh(); sichere(true); }}
                onMassnahme={(id, richtung) => {
                  setNetTheme(null);
                  setNetOrt(null);
                  setNetVorhaben({ id, level: Math.max(0, Math.min(100, Math.round(stufeIn(w, id, null)) + 20 * richtung)) });
                  setDossier("netz");
                }}
              />
            )}
            {dossier === "waehler" && (
              <Waehler
                world={w}
                onDossier={(d) => setDossier(d)}
                onMassnahme={(id, richtung) => {
                  setNetTheme(null);
                  setNetOrt(null);
                  setNetVorhaben({ id, level: Math.max(0, Math.min(100, Math.round(stufeIn(w, id, null)) + 20 * richtung)) });
                  setDossier("netz");
                }}
              />
            )}
            {dossier === "wahlkampf" && <WahlkampfZentrale world={w} refresh={() => { refresh(); sichere(true); }} />}
            {dossier === "katastrophe" && <Katastrophe world={w} refresh={() => { refresh(); sichere(true); }} onGehe={gehe} />}
            {dossier === "personen" && (
              <Personen
                world={w}
                refresh={() => { refresh(); sichere(true); }}
                onGeheVorlage={geheVorlage}
                onKarte={zeigeKarte}
                onMassnahme={(id, richtung) => {
                  setNetTheme(null);
                  setNetOrt(null);
                  setNetVorhaben({ id, level: Math.max(0, Math.min(100, Math.round(stufeIn(w, id, null)) + 20 * richtung)) });
                  setDossier("netz");
                }}
              />
            )}
            {dossier === "chronik" && <Chronik world={w} />}
            {dossier?.startsWith("reich_") && (
              <Reich
                world={w}
                bereich={({ reich_kultur: "kultur", reich_recht: "recht", reich_militaer: "militaer", reich_infra: "infrastruktur", reich_haushalt: "haushalt" } as const)[dossier as "reich_kultur"]}
                refresh={() => { refresh(); sichere(true); }}
                onKarte={(o) => { setKamera({ ...o, d: 4.6 }); setDossier(null); }}
                {...(reichStart ? { startTab: reichStart } : {})}
              />
            )}
            {dossier === "netz" && (
              <NetView
                key={`${netTheme ?? "netz"}-${netOrt?.join(",") ?? "land"}-${netVorhaben?.id ?? ""}-${netVorhaben?.level ?? ""}`}
                initialTheme={netTheme ?? undefined}
                initialOrt={netOrt}
                {...(netVorhaben ? { initialMassnahme: netVorhaben.id, initialLevel: netVorhaben.level } : {})}
                world={w}
                onDecided={() => { refresh(); sichere(true); }}
                onEingriff={(option) => { setErlassStart(option); setDossier("entscheidungen"); }}
                onShowOnMap={(id) => {
                  setNetNode(id);
                  setEbene("netz");
                }}
              />
            )}
            {dossier === "entscheidungen" && (
              <Decisions
                key={erlassStart ?? "erlass"}
                {...(erlassStart ? { start: erlassStart } : {})}
                world={w}
                onGeaendert={() => {
                  refresh();
                  sichere(true);
                }}
              />
            )}
            </Fehlergrenze>
          </div>
        </section>
      )}

      <LinsenWahl
        world={w}
        ebene={ebene}
        netName={ebene === "netz" ? NET.nodes[NET.index.get(netNode)!]!.name : undefined}
        problemId={problemId}
        legende={legende}
        onEbene={(e) => setEbene(e)}
        onProblem={(id) => setProblemId(id)}
        gesperrt={!!dossier || !!bilanz || !!standDerD || !!intro || zielWahlOffen || !!hinweis || !!offen || !!spiel?.reich?.feier[0] || !!landAuswahl}
      />
      <Plakette world={w} ebene={ebene} />
      <img className="compass" src="/ui/kompass.png" alt="" />
      <div className="karten-werkzeuge">
        <MarkenLegende />
        <Effekte />
      </div>

      {selected && (
        <ProvinceCard
          world={w}
          plaka={selected}
          onClose={() => setSelected(undefined)}
          onBauen={(p) => {
            setNetTheme("infrastruktur");
            setNetOrt([p]);
            setDossier("netz");
          }}
        />
      )}

      {wahlErg && !standDerD && !intro && !zielWahlOffen && (
        <Wahlabend
          key={wahlErg.id}
          ergebnis={wahlErg}
          onRede={(ton) => {
            const r = rede(w, ton);
            if (r.ok) {
              sichere(true);
              refresh();
            }
            return r.text;
          }}
          onSchliessen={() => {
            wahlabendQuittieren(w);
            sichere(true);
            refresh();
          }}
        />
      )}

      {!wahlErg && umbOffen && umbSicht && spiel && !standDerD && !intro && !zielWahlOffen && (
        <Umbildung
          sicht={umbSicht}
          kapital={spiel.kapital}
          {...(umbMeldung ? { meldung: umbMeldung } : {})}
          zwischenbilanz={erstelleBilanz(w, "zwischen")}
          {...(spiel.nachfolge?.aspiranten ? { aspiranten: spiel.nachfolge.aspiranten } : {})}
          onBehalten={(amt) => umbAktion(umbildungBehalten(w, amt))}
          onErsetzen={(amt, id) => umbAktion(umbildungErsetzen(w, amt, id))}
          onEntlassen={(amt) => umbAktion(umbildungEntlassen(w, amt))}
          onVersetzen={(a, b) => umbAktion(umbildungVersetzen(w, a, b))}
          onPartner={(amt, partei) => umbAktion(umbildungPartner(w, amt, partei))}
          onFertig={() => {
            umbildungAbschliessen(w);
            setUmbMeldung(undefined);
            sichere(true);
            refresh();
          }}
          onSpaeter={() => setUmbSpaeterBis(spiel.umbildung?.bis ?? null)}
        />
      )}

      {!wahlErg && !umbOffen && neueZiele && spiel && !standDerD && !intro && !zielWahlOffen && (
        <ZielWahl
          modus="amtszeit"
          angebot={zieleAngebot(w, spiel.amtszeit >= maxAmtszeiten(w))}
          onFertig={(ids) => {
            waehleZieleAmtszeit(w, ids);
            sichere(true);
            refresh();
          }}
        />
      )}

      {bilanz && spiel?.ende && <BilanzFenster world={w} onNeu={onNeu} onSchliessen={() => setBilanzZu(true)} />}

      {!bilanz && standDerD && (
        <StandDerDingeBlatt
          stand={standDerD}
          onSchliessen={() => {
            // Einmalig: Danach ist der Schreibtisch der Einstieg, wie an jedem anderen Tag auch
            setStandDerD(null);
            oeffneDossier("schreibtisch");
          }}
        />
      )}

      {!bilanz && intro && (
        <EventWindow
          key={intro.id}
          event={intro}
          onClose={() => {
            setIntro(null);
          }}
        />
      )}

      {!bilanz && !intro && zielWahlOffen && (
        <ZielWahl
          onFertig={(ids, schwer) => {
            waehleZiele(w, ids, schwer);
            sichere(true);
            refresh();
          }}
        />
      )}

      {!bilanz && !blockiert && !standDerD && !intro && !zielWahlOffen && hinweis && (
        <EventWindow
          key={hinweis.id}
          event={{
            id: hinweis.id,
            scene: hinweis.szene,
            date: formatDateDe(w.date),
            title: hinweis.titel,
            text: (
              <>
                {hinweis.text.map((t, i) => (
                  <p key={i}>{t}</p>
                ))}
              </>
            ),
            actions: [{ label: "Verstanden", primary: true }],
          }}
          onClose={() => {
            // Quittiert genau diesen Hinweis (in der Warteschlange können gesammelte C-Meldungen nachrücken)
            spiel!.hinweise = spiel!.hinweise.filter((x) => x.id !== hinweis.id);
            refresh();
          }}
        />
      )}

      {landAuswahl && (
        <LandPopover
          auswahl={landAuswahl}
          world={w}
          onClose={() => setLandAuswahl(null)}
          onOeffne={(id, tab) => {
            setLandAuswahl(null);
            setWeltStart(id);
            setWeltTab(tab);
            setDossier("welt");
            beendeZeit();
          }}
        />
      )}

      {!bilanz && !blockiert && !standDerD && !intro && !zielWahlOffen && !hinweis && !offen && spiel?.reich?.feier[0] && (
        <WunderFenster
          key={spiel.reich.feier[0]}
          id={spiel.reich.feier[0]}
          datum={w.date}
          onWeiter={() => { quittiereFeier(w, spiel.reich!.feier[0]!); refresh(); }}
          onKarte={(o) => { quittiereFeier(w, spiel.reich!.feier[0]!); setKamera({ ...o, d: 4.6 }); setDossier(null); refresh(); }}
        />
      )}

      {!bilanz && !blockiert && !standDerD && !intro && !zielWahlOffen && !hinweis && offen && spiel && (
        <EreignisFenster
          key={offen.id}
          ansicht={ansicht(w, offen)}
          datum={formatDateDe(w.date)}
          kapital={spiel.kapital}
          naechsteGutschrift={formatDateDe(kapitalEinkommen(w).naechste)}
          world={w}
          onAkte={(ziel) => {
            // Akte ansehen, ohne zu entscheiden: das Ereignis bleibt offen, die Frist läuft
            setSpaeter((s) => new Set(s).add(offen.id));
            if (ziel.dossier === "wirtschaft") setWirtschaftStart(ziel.start);
            oeffneDossier(ziel.dossier);
          }}
          onMassnahme={(m) => {
            // Das Ereignis bleibt offen (die Frist läuft); der Spieler sieht sich das Gesetz an oder regelt die Ursache selbst
            setSpaeter((s) => new Set(s).add(offen.id));
            setNetTheme(null);
            setNetOrt(null);
            setNetVorhaben({ id: m.id, level: m.ziel ?? Math.min(100, Math.round(stufeIn(w, m.id, null)) + 20) });
            setDossier("netz");
            setSpeed(0);
          }}
          onWaehle={(optionId) => {
            const r = entscheide(w, offen.id, optionId, new Rng(w.rngState ^ w.day));
            if (r.ok) {
              w.rngState = (w.rngState + 1) | 0;
              sichere(true);
              melde({ titel: r.text, ton: "ereignis" });
              // Den Haushalt selbst vorbereiten: gleich in die Haushaltsakte mit den Reglern
              if (offen.vorlage === "haushaltsjahr" && optionId === "entwurf") {
                setWirtschaftStart("haushalt");
                oeffneDossier("wirtschaft");
              }
            }
            refresh();
          }}
          onSpaeter={() => setSpaeter((s) => new Set(s).add(offen.id))}
        />
      )}
    </div>
  );
}

function Stat({ icon, label, value, warn, trend: t, tip, unter }: { icon: IconName; label: string; value: string; warn?: boolean; trend?: number; tip: string; unter?: string }) {
  return (
    <div className={`stat${warn ? " warn" : ""}`} tabIndex={0}>
      <Icon name={icon} />
      <div>
        <div className="stat-value">
          {value}
          {t !== undefined && Math.abs(t) > 0.05 && (
            <span className={`trend ${t > 0 ? "up" : "down"}`} aria-hidden>
              {t > 0 ? "▲" : "▼"}
              {Math.abs(t).toLocaleString("de-DE", { maximumFractionDigits: 1 })}
            </span>
          )}
        </div>
        <div className="stat-label">{label}</div>
        {unter && <div className="stat-unter">{unter}</div>}
      </div>
      <div className="tip" role="tooltip">
        <strong>{label}</strong>
        <p>{tip}</p>
        {t !== undefined && Math.abs(t) > 0.05 && (
          <p className="tip-trend">
            {t > 0 ? "Gestiegen" : "Gesunken"} zuletzt um {Math.abs(t).toLocaleString("de-DE", { maximumFractionDigits: 1 })}
          </p>
        )}
      </div>
    </div>
  );
}

type HudExtra = "inflation" | "lira" | "leitzins";
const HUD_EXTRAS: HudExtra[] = ["inflation", "lira", "leitzins"];
const HUD_SCHLUESSEL = "staatsraeson-hud-extra";

function ladeHudExtra(): Set<HudExtra> {
  try {
    const roh = localStorage.getItem(HUD_SCHLUESSEL);
    if (roh) return new Set((JSON.parse(roh) as string[]).filter((x): x is HudExtra => (HUD_EXTRAS as string[]).includes(x)));
  } catch {
    /* ohne Speicher: alle zeigen */
  }
  return new Set(HUD_EXTRAS);
}

/** Wahl der zusätzlichen Werte in der Kopfleiste (Zustimmung, Kapital und Mehrheit stehen fest). */
function HudWahl({ gewaehlt, onWechsel }: { gewaehlt: Set<HudExtra>; onWechsel: (x: HudExtra) => void }) {
  const [offen, setOffen] = useState(false);
  const name: Record<HudExtra, string> = { inflation: t("buehne.stat.inflation"), lira: t("buehne.stat.lira"), leitzins: t("buehne.stat.leitzins") };
  return (
    <div className="hud-wahl">
      <button type="button" className="hud-wahl-knopf" aria-expanded={offen} title={t("nav.hud.mehrHinweis")} onClick={() => setOffen((o) => !o)}>
        {t("nav.hud.mehr")}
      </button>
      {offen && (
        <div className="hud-wahl-tafel" role="group" aria-label={t("nav.hud.mehrHinweis")}>
          {HUD_EXTRAS.map((x) => (
            <label key={x}>
              <input type="checkbox" checked={gewaehlt.has(x)} onChange={() => onWechsel(x)} /> {name[x]}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}


/** Veränderung zum Vormonat aus der Monatsgeschichte. */
function trend(w: World, key: "inflation" | "usdTry" | "policyRate"): number | undefined {
  const h = w.history;
  if (h.length < 2) return undefined;
  if (key === "inflation") return h[h.length - 1]!.inflation - h[h.length - 2]!.inflation;
  const before = h[h.length - 1]![key];
  if (before === undefined) return undefined;
  return (key === "usdTry" ? w.economy.usdTry : w.economy.policyRate) - before;
}

/** Hinweise unter der Kopfleiste, wie die Warnsymbole in Hearts of Iron. */
function Alerts({ world, bloc, onProblems, onDesk, onParlament, onEreignis, onProgramm, onZins }: { world: World; bloc: number; onProblems: () => void; onDesk: () => void; onParlament: () => void; onEreignis: () => void; onProgramm: () => void; onZins: () => void }) {
  const items: { id: string; tone: "rot" | "gelb" | "blau"; icon: IconName; label: string; kurz: string; text: string; count?: number; onClick?: () => void }[] = [];
  const pl = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`;
  const spiel = world.spiel;

  const offen = spiel?.ereignisse.length ?? 0;
  if (offen > 0) {
    items.push({ id: "ereignisse", tone: "rot", icon: "feder", label: "Wartende Entscheidungen", kurz: pl(offen, "Entscheidung", "Entscheidungen"), count: offen, text: spiel!.ereignisse.map((e) => vorlage(e.vorlage).titel(world, e)).join(" · "), onClick: onEreignis });
  }

  const problems = NET.nodes.filter((n) => n.kind === "problem");
  const perProblem = problems
    .map((n) => {
      let c = 0;
      for (let p = 0; p < PROVINCES; p++) if (world.net.values[NET.index.get(n.id)! * PROVINCES + p]! >= n.threshold!) c++;
      return { name: n.name, c };
    })
    .filter((x) => x.c > 0)
    .sort((a, b) => b.c - a.c);
  if (perProblem.length) {
    items.push({
      id: "probleme",
      tone: "rot",
      icon: "warnung",
      label: "Akute Probleme",
      kurz: pl(perProblem.length, "akutes Problem", "akute Probleme"),
      count: perProblem.length,
      text: perProblem.slice(0, 4).map((x) => `${x.name} in ${x.c} ${x.c === 1 ? "Provinz" : "Provinzen"}`).join(" · "),
      onClick: onProblems,
    });
  }

  const zusagen = spiel?.zusagen.filter((z) => !z.erfuellt && !z.gebrochen) ?? [];
  if (zusagen.length) {
    items.push({ id: "zusagen", tone: "gelb", icon: "haende", label: "Offene Zusagen", kurz: pl(zusagen.length, "Zusage", "Zusagen"), count: zusagen.length, text: zusagen.map((z) => z.text).join(" · "), onClick: onDesk });
  }

  const gesetze = spiel?.gesetze ?? [];
  if (gesetze.length) {
    items.push({ id: "gesetze", tone: "gelb", icon: "waage", label: "Gesetze im Parlament", kurz: pl(gesetze.length, "Gesetz im Parlament", "Gesetze im Parlament"), count: gesetze.length, text: gesetze.map((g) => `${g.name}: Abstimmung in ${Math.max(0, g.abstimmung - world.day)} Tagen`).join(" · "), onClick: onParlament });
  }

  const schritt = spiel ? naechsterSchritt(world) : null;
  if (schritt && schritt.status === "bereit") {
    items.push({ id: "programm", tone: "gelb", icon: "ziel", label: "Programmschritt bereit", kurz: "Programmschritt bereit", text: `${schritt.schritt.titel}: die Voraussetzungen sind erfüllt, der Schritt kann beginnen.`, onClick: onProgramm });
  }

  const duldungen = Object.entries(spiel?.fraktionen ?? {}).filter(([k, f]) => f.duldungBis !== undefined && f.duldungBis > world.day && !(spiel?.lager ?? []).includes(k));
  const baldEnde = duldungen.filter(([, f]) => (f.duldungBis ?? 0) - world.day <= 45).sort((a, b) => (a[1].duldungBis ?? 0) - (b[1].duldungBis ?? 0))[0];
  if (baldEnde) {
    const tage = (baldEnde[1].duldungBis ?? 0) - world.day;
    items.push({ id: "duldung", tone: "rot", icon: "parlament", label: "Duldung läuft aus", kurz: `Duldung endet in ${tage} Tagen`, text: `Die ${PARTEI_NAME[baldEnde[0]] ?? baldEnde[0]} duldet die Regierung nur noch ${tage} Tage. Danach fehlen ihre Stimmen, wenn Sie nicht neu verhandeln.`, onClick: onParlament });
  }

  if (bloc < 301) {
    items.push({ id: "mehrheit", tone: "rot", icon: "parlament", label: "Keine Mehrheit", kurz: "Keine Mehrheit", text: `Für Gesetze fehlen ${301 - bloc} Stimmen im Lager. Stimmen lassen sich kaufen, Partner bieten sich an.`, onClick: onParlament });
  }

  const next = world.ppkDays.find((d) => d >= world.day);
  if (next !== undefined && next - world.day <= 10) {
    const days = next - world.day;
    items.push({
      id: "ppk",
      tone: "blau",
      icon: "bank",
      label: "Zinssitzung",
      kurz: days === 0 ? "Zinssitzung heute" : `Zinssitzung in ${pl(days, "Tag", "Tagen")}`,
      text: days === 0 ? "Der Geldpolitische Ausschuss tagt heute." : `Der Geldpolitische Ausschuss tagt in ${days} ${days === 1 ? "Tag" : "Tagen"}.`,
      onClick: onZins,
    });
  }

  if (!items.length) return null;
  return (
    <div className="alerts" aria-label="Hinweise">
      {items.map((a) => (
        <button key={`${a.id}-${a.count ?? 0}`} className={`alert tone-${a.tone}${a.count !== undefined || a.tone !== "rot" ? " kompakt" : ""}`} onClick={a.onClick} aria-label={`${a.label}: ${a.text}`}>
          <span className="alert-punkt">
            <Icon name={a.icon} size={15} />
          </span>
          {a.count !== undefined && <span className="alert-zahl">{a.count}</span>}
          <span className="alert-text">{a.kurz}</span>
          <span className="tip" role="tooltip">
            <strong>{a.label}</strong>
            <p>{a.text}</p>
          </span>
        </button>
      ))}
    </div>
  );
}

function startEvent(w: World): GameEvent {
  const p = w.player;
  const own = p?.partei.kurz;
  const seats = own ? (w.parliament?.seats[own] ?? 0) : 0;
  const sicht = stimmenSicht(w);
  const partner = (w.spiel?.lager ?? []).map((k) => `${PARTEI_NAME[k] ?? k} (${w.parliament?.seats[k] ?? 0})`);
  return {
    id: "amtsuebergabe",
    scene: "parlament",
    date: formatDateDe(w.date),
    title: t("amtsuebergabe.titel"),
    text: (
      <>
        <p>
          {t("amtsuebergabe.absatz1", {
            name: p?.name ?? t("buehne.staatsoberhaupt"),
            partei: p?.partei.name ?? own ?? "",
            sitze: seats,
          })}
          {partner.length > 0
            ? " " +
              (sicht.lager >= 301
                ? t("amtsuebergabe.mehrheit_ja", { partner: partner.join(", "), sitze: sicht.lager })
                : t("amtsuebergabe.mehrheit_nein", { partner: partner.join(", "), sitze: sicht.lager }))
            : ""}
        </p>
        <p>
          {t("amtsuebergabe.absatz2", {
            inflation: w.published.inflation.value.toLocaleString(aktuelleLocale(), { maximumFractionDigits: 1 }),
          })}
        </p>
      </>
    ),
    why: t("amtsuebergabe.warum"),
    actions: [{ label: t("amtsuebergabe.aktion"), primary: true }],
  };
}

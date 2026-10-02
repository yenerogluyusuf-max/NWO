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
import { Waehler } from "./Waehler";
import { Programme } from "./Programme";
import { Welt } from "./Welt";
import { vertrauenZu } from "../sim/laender";
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
import { quittiereFeier, vorhabenDef } from "../sim/reich";
import { ERBE } from "../data/erbe";
import { VORHABEN } from "../data/reich";
import type { KartenOrt } from "./atlas/AtlasMap";
import { Meldungen, type Meldung } from "./Meldungen";
import { bewerteHalt, hinweisKlasse, sammleUmlauf, type UmlaufEintrag } from "./autostopp";
import { ZielWahl } from "./ZielWahl";
import { BilanzFenster } from "./BilanzFenster";
import { Kartenlegende } from "./Kartenlegende";
import { ProvinceCard } from "./ProvinceCard";
import { ansicht, entscheide, vorlage } from "../sim/ereignisse";
import { stimmenSicht, stufeIn } from "../sim/handeln";
import { kapitalEinkommen, waehleZiele } from "../sim/spiel";
import { naechsterSchritt } from "../sim/programme";
import { Rng } from "../sim/rng";
import { speichere, sitzungBegonnen, vorsitzungSnapshot } from "./speicher";
import { standDerDinge, type StandDerDinge } from "./standderdinge";
import { StandDerDingeBlatt } from "./StandDerDingeBlatt";
import { PARTEI_NAME } from "../sim/fraktionen";
import { LAENDERNAMEN, LAND_PINS, KARTENEBENEN, farbenFuerEbene, laenderFarben, type Kartenebene } from "./ebenen";
import { kurzVergleich } from "./vergleich";

type Dossier = "schreibtisch" | "politik" | "bereiche" | "gespraech" | "wirtschaft" | "netz" | "entscheidungen" | "parlament" | "personen" | "chronik" | "beschluesse" | "waehler" | "programme" | "welt" | "reich_kultur" | "reich_recht" | "reich_militaer" | "reich_infra" | "reich_haushalt" | null;

/** Millisekunden je Tick und Tage je Tick: Pause, ruhig, zügig, schnell, bis zum nächsten Ereignis. */
const SPEEDS = [0, 700, 200, 40, 14];
const TAGE_JE_TICK = [0, 1, 1, 1, 4];

/** Beschriftungen wie in einem Atlas: Meere und Nachbarländer. */
const GEO_LABELS: { text: string; lon: number; lat: number; kind: "meer" | "land" }[] = [
  { text: "Schwarzes Meer", lon: 34.6, lat: 43.1, kind: "meer" },
  { text: "Mittelmeer", lon: 31.0, lat: 34.6, kind: "meer" },
  { text: "Ägäis", lon: 25.0, lat: 38.4, kind: "meer" },
];

const METROS = PROVINCE_FC.features.filter((f) => PROVINZEN[f.properties.plaka - 1]?.grossstadt).map((f) => f.properties.plaka);

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
  const [kamera, setKamera] = useState<{ lon: number; lat: number; d: number } | undefined>(undefined);
  const [bilanzZu, setBilanzZu] = useState(false);
  /** Umlauf (Klasse C der Auto-Stopp-Taxonomie): gesammelt statt unterbrechend; `umlaufNeu` zählt Ungelesenes für den Zähler am Schreibtisch. */
  const [umlauf, setUmlauf] = useState<UmlaufEintrag[]>([]);
  const [umlaufNeu, setUmlaufNeu] = useState(0);
  const umlaufZaehler = useRef(0);
  const umfrageStand = useRef(initial.spiel?.umfrage.verlauf.length ?? 0);
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
      // Monatsumfrage (Klasse C): kein Stopp, ein Eintrag im Sammel-Hinweis
      const verlauf = s?.umfrage.verlauf ?? [];
      if (s && verlauf.length > umfrageStand.current) {
        for (const e of verlauf.slice(umfrageStand.current - verlauf.length)) {
          const davor = verlauf[verlauf.indexOf(e) - 1]?.wert;
          umlaufPush({
            datum: formatDateDe(wd.date),
            titel: "Monatsumfrage",
            text: `Zustimmung ${e.wert.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %${davor !== undefined ? ` (Vormonat ${davor.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %)` : ""} — Routine, nichts zu entscheiden.`,
          });
        }
        umfrageStand.current = verlauf.length;
      }
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
      out.push({ id: e.id, plaka, art: tage <= 5 ? "frist" : "ereignis", text: `${v.titel(w, e)}: Frist in ${tage} Tagen` });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spiel?.ereignisse.length, w.day]);

  const laenderKarte = useMemo(
    () => (ebene === "welt" ? laenderFarben(w) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ebene, w.day - (w.day % 10), spiel?.welt],
  );
  const laenderPins = useMemo(
    () =>
      spiel
        ? LAND_PINS.map((p) => {
            const v = vertrauenZu(w, p.id);
            return { ...p, name: p.id === "EU" ? "Europäische Union" : (LAENDERNAMEN[p.iso] ?? p.iso), ton: (v >= 55 ? "gut" : v >= 35 ? "mittel" : "schlecht") as "gut" | "mittel" | "schlecht" };
          })
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [w.day - (w.day % 10), spiel?.welt],
  );
  const [weltStart, setWeltStart] = useState<string | undefined>(undefined);
  const [weltTab, setWeltTab] = useState<WeltTab | undefined>(undefined);
  const [landAuswahl, setLandAuswahl] = useState<LandAuswahl | null>(null);

  // Marken für Wunder und Bauvorhaben immer, für Stätten in der Kartenebene „Kulturerbe“
  const orte = useMemo<KartenOrt[]>(() => {
    const z = spiel?.reich;
    if (!z) return [];
    const out: KartenOrt[] = [];
    if (ebene === "erbe") {
      for (const e of ERBE) {
        const zustand = z.staetten[e.id]?.zustand ?? 0;
        out.push({ id: `erbe:${e.id}`, lon: e.lon, lat: e.lat, art: "erbe", text: `${e.name}, ${e.ort} (Zustand ${Math.round(zustand)})`, zustand, dmax: 15 });
      }
    }
    for (const v of VORHABEN) {
      if (!v.ort || !["wunder", "grossprojekt", "serie"].includes(v.klasse)) continue;
      if (z.bestand[v.id]) out.push({ id: `v:${v.id}`, lon: v.ort.lon, lat: v.ort.lat, art: "wunder", text: `${v.name} (fertig)` });
      else if (z.laufend.some((l) => l.id === v.id)) out.push({ id: `v:${v.id}`, lon: v.ort.lon, lat: v.ort.lat, art: "bau", text: `${v.name} (im Bau)` });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ebene, spiel?.reich, spiel?.reich?.laufend.length, w.day - (w.day % 30)]);

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
  const trust = nationalAverage(NET, w.net, "vertrauen_regierung");
  const zustimmung = spiel?.umfrage.zustimmung ?? trust;
  const zVor = spiel && spiel.umfrage.verlauf.length > 3 ? spiel.umfrage.verlauf[spiel.umfrage.verlauf.length - 4]!.wert : undefined;

  // Das Menü ordnet nach dem, was man tut. Mehrere Ansichten derselben Sache liegen als Reiter in einem Fenster.
  // badge = wartende Entscheidungen (rot, Klasse A), umlauf = gesammelte Routine (ruhig, Klasse C)
  const menue: { kurz: string; titel: string; icon: IconName; badge?: number; umlauf?: number; tabs: { id: Exclude<Dossier, null>; label: string }[] }[] = [
    { kurz: "Schreibtisch", titel: "Schreibtisch", icon: "feder", badge: (spiel?.ereignisse.length ?? 0) || undefined, umlauf: umlaufNeu || undefined, tabs: [{ id: "schreibtisch", label: "Schreibtisch" }] },
    { kurz: "Gespräch", titel: "Gespräch", icon: "sprechblase", tabs: [{ id: "gespraech", label: "Gespräch" }] },
    {
      kurz: "Politik",
      titel: "Politik",
      icon: "netz",
      tabs: [
        { id: "politik", label: "Bereiche" },
        { id: "bereiche", label: "Heute" },
        { id: "programme", label: "Programme" },
        { id: "beschluesse", label: "Umsetzung" },
        { id: "netz", label: "Netz und Suche" },
      ],
    },
    { kurz: "Wähler", titel: "Wähler", icon: "menge", tabs: [{ id: "waehler", label: "Wählerkoalition" }] },
    { kurz: "Welt", titel: "Die Welt", icon: "berg", tabs: [{ id: "welt", label: "Länder" }] },
    {
      kurz: "Reich",
      titel: "Das Reich",
      icon: "tempel",
      badge: (spiel?.reich?.laufend.length ?? 0) || undefined,
      tabs: [
        { id: "reich_kultur", label: "Kultur und Erbe" },
        { id: "reich_recht", label: "Recht" },
        { id: "reich_militaer", label: "Streitkräfte" },
        { id: "reich_infra", label: "Infrastruktur" },
        { id: "reich_haushalt", label: "Verwaltung" },
      ],
    },
    { kurz: "Parlament", titel: "Parlament", icon: "waage", badge: spiel?.gesetze.length || undefined, tabs: [{ id: "parlament", label: "Fraktionen und Abstimmung" }] },
    {
      kurz: "Wirtschaft",
      titel: "Wirtschaft",
      icon: "akte",
      // Die Akte hat eigene Reiter (Lage, Zentralbank, Haushalt); „entscheidungen“ bleibt als Einstieg für Zinssitzung und Erlasse
      tabs: [{ id: "wirtschaft", label: "Wirtschaft" }],
    },
    { kurz: "Personen", titel: "Personen und Zusagen", icon: "person", tabs: [{ id: "personen", label: "Personen und Zusagen" }] },
    { kurz: "Chronik", titel: "Chronik und Umfragen", icon: "buch", tabs: [{ id: "chronik", label: "Chronik und Umfragen" }] },
  ];
  const gruppe = menue.find((m) => m.tabs.some((t) => t.id === dossier) || (dossier === "entscheidungen" && m.kurz === "Wirtschaft"));

  const offen = spiel?.ereignisse.find((e) => !spaeter.has(e.id));
  // Nur Klasse B wird zum Banner-Fenster; C-Hinweise (Taxonomie) sind längst im Umlauf-Sammel-Hinweis
  const hinweis = spiel?.hinweise.find((h) => hinweisKlasse(h.id) === "B");
  const bilanz = spiel?.ende && !bilanzZu;
  const zielWahlOffen = !!spiel && !spiel.ersterTagErledigt && !intro && !standDerD;

  const beendeZeit = () => setSpeed(0);
  const oeffneDossier = (d: Dossier) => {
    if (d === "politik") setPolitikStart(null);
    if (d === "schreibtisch") umlaufGelesen();
    setDossier(d);
    if (d) beendeZeit();
  };
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

  return (
    <div className="stage">
      <AtlasMap
        className="stage-map"
        fill={fill}
        fillAlpha={ebene === "wahl" ? 0.56 : 0.62}
        selected={selected}
        labels={METROS}
        geoLabels={GEO_LABELS}
        onSelect={(p) => setSelected(p)}
        orte={orte}
        onOrt={(id) => {
          if (id.startsWith("erbe:")) setDossier("reich_kultur");
          else {
            const b = vorhabenDef(id.slice(2))?.bereich;
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
        {...(kamera ? { camera: kamera } : {})}
      />

      <header className="hud">
        <div className="hud-bar" />
        <div className="hud-left">
          <div className="leader">
            <Cameo seed={w.player?.name ?? "Staatspräsident"} size={46} tint={w.player?.partei.farbe} ring="keiner" />
          </div>
          <div className="leader-text">
            <div className="hud-name">{w.player?.name ?? "Staatspräsident"}</div>
            <div className="hud-sub">
              <span className="party-dot" style={{ background: w.player?.partei.farbe }} /> {w.player?.partei.name ?? "Staatsräson"} · Staatsoberhaupt
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
          </div>
        </div>
        <div className="hud-right">
          {spiel && (
            <Stat
              icon="haende"
              label="Zustimmung"
              value={`${Math.round(zustimmung)} %`}
              trend={zVor !== undefined ? zustimmung - zVor : undefined}
              warn={zustimmung < 40}
              tip={`Wie viele Wähler Sie heute wieder wählen würden. Die nächste Wahl ist in ${Math.max(0, Math.round((spiel.wahltag - w.day) / 30.4))} Monaten; ab 50 Prozent gewinnen Sie.`}
            />
          )}
          {spiel && <Stat icon="siegel" label="Kapital" value={`${Math.floor(spiel.kapital)}`} warn={spiel.kapital < 5} tip={kapitalTip(w)} />}
          <Stat icon="preis" label="Inflation" value={`${inflation.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`} trend={trend(w, "inflation")} tip={`Preisanstieg zum Vorjahresmonat, veröffentlicht vom Statistikamt mit einigen Wochen Verzögerung. ${kurzVergleich("FP.CPI.TOTL.ZG") ?? ""}`} />
          <Stat icon="lira" label="Lira je $" value={w.economy.usdTry.toLocaleString("de-DE", { maximumFractionDigits: 1 })} trend={trend(w, "usdTry")} tip={`Wechselkurs am Markt, täglich. Steigt er, werden Importe wie Energie teurer. ${kurzVergleich("PA.NUS.FCRF.ABW") ?? ""}`} />
          <Stat icon="bank" label="Leitzins" value={`${w.economy.policyRate.toLocaleString("de-DE")} %`} trend={trend(w, "policyRate")} tip="Setzt der Geldpolitische Ausschuss der Zentralbank, achtmal im Jahr." />
          <Stat icon="parlament" label="Sitze" value={`${bloc}/600`} warn={bloc < 301} tip={`Ihr Lager${stimmen && stimmen.duldungSitze > 0 ? ` (${stimmen.lager}) und die Fraktionen, die es zurzeit dulden (${stimmen.duldungSitze})` : ""} im Parlament. Gesetze brauchen 301 Stimmen, eine Verfassungsänderung ohne Volksabstimmung 400, mit Volksabstimmung 360.`} />
        </div>
      </header>

      <Alerts world={w} bloc={bloc} onProblems={() => { setEbene("probleme"); setProblemId(null); oeffneDossier("bereiche"); }} onDesk={() => oeffneDossier("schreibtisch")} onParlament={() => oeffneDossier("parlament")} onEreignis={() => { setSpaeter(new Set()); }} onProgramm={() => oeffneDossier("programme")} onZins={() => { setErlassStart(undefined); oeffneDossier("entscheidungen"); }} />

      <Meldungen items={meldungen} onClose={(id) => setMeldungen((l) => l.filter((x) => x.id !== id))} />
      <AbstimmungsKarte world={w} />

      <nav className="dossier-menu" aria-label="Akten">
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
        <section className={`dossier frame${dossier === "netz" ? " full" : dossier === "schreibtisch" || dossier === "gespraech" || dossier === "waehler" || dossier === "welt" || dossier === "wirtschaft" || dossier === "entscheidungen" || dossier === "parlament" || dossier === "personen" || dossier === "chronik" || dossier === "bereiche" || dossier === "politik" || dossier === "beschluesse" || dossier === "programme" || dossier?.startsWith("reich_") ? " wide" : ""}${dossier === "politik" || dossier === "schreibtisch" ? " po-breit" : ""}`} aria-label={gruppe?.titel}>
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
            {zweckVon(dossier, gruppe?.kurz) && <p className="dossier-zweck">{zweckVon(dossier, gruppe?.kurz)}</p>}
            {dossier === "schreibtisch" && <Schreibtisch world={w} refresh={() => { refresh(); sichere(true); }} onGehe={gehe} umlauf={umlauf} />}
            {dossier === "gespraech" && <Chat world={w} refresh={() => { refresh(); sichere(true); }} />}
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
                onBereiche={() => { setPolitikStart(null); setDossier("politik"); }}
                onVorhaben={(v) => {
                  setPolitikStart({ offen: { id: v.massnahme, level: v.ziel, ort: v.ort } });
                  setDossier("politik");
                }}
              />
            )}
            {dossier === "wirtschaft" && <EconomyFile world={w} onGeaendert={() => { refresh(); sichere(true); }} />}
            {(dossier === "parlament" || dossier === "beschluesse") && <Beschlussbuch teil={dossier === "parlament" ? "parlament" : "beschluesse"} world={w} refresh={() => { refresh(); sichere(true); }} />}
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
            {dossier === "personen" && (
              <Personen
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
            {dossier === "chronik" && <Chronik world={w} />}
            {dossier?.startsWith("reich_") && (
              <Reich
                world={w}
                bereich={({ reich_kultur: "kultur", reich_recht: "recht", reich_militaer: "militaer", reich_infra: "infrastruktur", reich_haushalt: "haushalt" } as const)[dossier as "reich_kultur"]}
                refresh={() => { refresh(); sichere(true); }}
                onKarte={(o) => { setKamera({ ...o, d: 4.6 }); setDossier(null); }}
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
          </div>
        </section>
      )}

      <nav className="mapmodes" aria-label="Kartenebenen">
        <div className="mapmode-buttons">
          {KARTENEBENEN.filter((m) => m.id !== "netz").map((m) => (
            <button key={m.id} className={ebene === m.id ? "on" : ""} onClick={() => setEbene(m.id)} title={m.label} aria-pressed={ebene === m.id}>
              <Icon name={m.icon} />
            </button>
          ))}
        </div>
        <div className="mapmode-caption">
          <span className="mapmode-kicker">Kartenebene</span>
          <span className="mapmode-name">{ebene === "netz" ? NET.nodes[NET.index.get(netNode)!]!.name : KARTENEBENEN.find((m) => m.id === ebene)?.label}</span>
        </div>
      </nav>

      <Kartenlegende
        world={w}
        ebene={ebene}
        legende={legende}
        problemId={problemId}
        onProblem={(id) => setProblemId(id)}
      />
      <img className="compass" src="/ui/kompass.png" alt="" />

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

      {!bilanz && !standDerD && !intro && !zielWahlOffen && hinweis && (
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

      {!bilanz && !standDerD && !intro && !zielWahlOffen && !hinweis && !offen && spiel?.reich?.feier[0] && (
        <WunderFenster
          key={spiel.reich.feier[0]}
          id={spiel.reich.feier[0]}
          datum={w.date}
          onWeiter={() => { quittiereFeier(w, spiel.reich!.feier[0]!); refresh(); }}
          onKarte={(o) => { quittiereFeier(w, spiel.reich!.feier[0]!); setKamera({ ...o, d: 4.6 }); setDossier(null); refresh(); }}
        />
      )}

      {!bilanz && !standDerD && !intro && !zielWahlOffen && !hinweis && offen && spiel && (
        <EreignisFenster
          key={offen.id}
          ansicht={ansicht(w, offen)}
          datum={formatDateDe(w.date)}
          kapital={spiel.kapital}
          naechsteGutschrift={formatDateDe(kapitalEinkommen(w).naechste)}
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
            }
            refresh();
          }}
          onSpaeter={() => setSpaeter((s) => new Set(s).add(offen.id))}
        />
      )}
    </div>
  );
}

function Stat({ icon, label, value, warn, trend: t, tip }: { icon: IconName; label: string; value: string; warn?: boolean; trend?: number; tip: string }) {
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

/** Was das Kapital kostet, wie es wieder aufgeladen wird und wann. */
function kapitalTip(w: World): string {
  const k = kapitalEinkommen(w);
  const z = (x: number) => x.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const teile = [`Grundeinkommen ${z(k.grund)}`, `Vertrauen ${z(k.vertrauen)}`, k.mehrheit > 0 ? `Mehrheit ${z(k.mehrheit)}` : "Mehrheit 0 (dem Lager fehlen Sitze)", ...(Math.abs(k.legitimitaet) >= 0.05 ? [`Legitimität ${k.legitimitaet > 0 ? "+" : "−"}${z(Math.abs(k.legitimitaet))}`] : [])].join(" + ");
  return `Politisches Kapital ist kein Geld, sondern Rückhalt: Gefolgschaft, Aufmerksamkeit und Spielraum. Gesetze, Erlasse, Verhandlungen und Antworten auf Ereignisse verbrauchen davon. Es lädt sich jeden Monatsersten auf, und Sie dürfen bis 20 ins Minus gehen (auf Pump, gegen Legitimität und Vertrauen), zurzeit um ${z(k.summe)} (${teile}). Nächste Gutschrift: ${formatDateDe(k.naechste)}. Höchstens ${k.grenze}.`;
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
        <button key={`${a.id}-${a.count ?? 0}`} className={`alert tone-${a.tone}`} onClick={a.onClick} aria-label={`${a.label}: ${a.text}`}>
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
    title: "Amtsübergabe in Ankara",
    text: (
      <>
        <p>
          Um neun Uhr legt {p?.name ?? "das neue Staatsoberhaupt"} im Parlament den Amtseid ab. Die {p?.partei.name ?? "eigene Partei"} stellt {seats} der 600 Abgeordneten.
          {partner.length > 0
            ? ` Mit ${partner.join(", ")} steht das Regierungslager bei ${sicht.lager} Sitzen: ${sicht.lager >= 301 ? "Gesetze haben eine Mehrheit, solange die Partner mitgehen. Sie erwarten dafür ihre Forderungen erfüllt." : "eine Mehrheit fehlt noch."}`
            : ""}
        </p>
        <p>
          Auf dem Schreibtisch liegen das Morgenbriefing, die Zusagen aus dem Wahlkampf und der nächste Schritt für Ihr Programm. Die Inflation liegt bei{" "}
          {w.published.inflation.value.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %, die Wahl in etwa fünf Jahren. Wählen Sie gleich Ihre Ziele.
        </p>
      </>
    ),
    why: "Die Wirtschaftsdaten stammen vom 25. September 2026. Die Wahl 2028 ist erfunden, das Land und seine Regeln sind echt.",
    actions: [{ label: "An die Arbeit", primary: true }],
  };
}

import { useEffect, useRef, useState } from "react";
import { createAtlas, loadKuestenFeld, loadRelief, lonLatToUv, type AtlasScene, type Relief } from "./scene";
import { VectorLayer, type BezirkInfo } from "./vector";
import { FxLayer } from "./fx";
import { effektFuer } from "./jahreszeit";
import { feinsteStufe, gemeinteFlaechen, setzeTintenSenke, uebertrageUeberStufen } from "./tinte";
import { DAUER, flugBogen, flugDauer } from "../anim/dauer";
import { mische, sanftInOut } from "../anim/easing";
import { bewegungsFaktor, dauerFaktor, leerlaufBilder } from "../anim/effekte";
import { useEffektstufe } from "../anim/react";
import { naehere } from "../anim/zeitgeber";
import { PROVINZEN } from "../../sim/regional";
import { PARTY_COLORS } from "../Parliament";
import { PROVINCE_FC, provinceCenters } from "./overlay";
import { Icon } from "../icons";
import { Flagge } from "../art/Flaggen";
import "./karte.css";
import "./marken.css";
import "./staedte.css";
import { StadtFigur } from "./StadtFigur";
import { stadtArt, type StadtInfo } from "./staedte";
import { MarkenForm } from "./MarkenForm";
import { t } from "../../i18n";
import type { Kartenebene } from "../ebenen";
import type { KartenMarke } from "../gueter/linsen";

export interface KartenOrt {
  id: string;
  lon: number;
  lat: number;
  art: "erbe" | "wunder" | "bau";
  /** Satz für Screenreader und als Rückfall, wenn die Felder der Tafel fehlen */
  text: string;
  /** Zustand 0 bis 100 (Stätten und fertige Stücke) */
  zustand?: number;
  /** Ab dieser Kamerahöhe (größere Zahl = weiter weg) wird die Marke ausgeblendet */
  dmax?: number;
  /** Tafel beim Überfahren (siehe marken.ts): Name, Ort, Art und Lage in Worten, Fortschritt oder Zustand, Restdauer, nächste Entscheidung */
  name?: string;
  ortName?: string;
  artText?: string;
  lage?: "imBau" | "pausiert" | "fertig" | "verfallen" | "gefahr";
  lageText?: string;
  /** Anteil 0 bis 1 (nur Bauvorhaben): füllt den Ring um den Kran */
  fortschritt?: number;
  zeile?: string;
  rest?: string;
  naechste?: string;
  klick?: string;
  /** Reiter der Reich-Akte, den ein Klick öffnet */
  klickTab?: "lage" | "bestand" | "neu";
  /** Rang bei Gedränge: höhere Marken bleiben, wenn weit herausgezoomt Marken zusammenrücken */
  rang?: number;
}

export interface AtlasMapProps {
  fill?: Record<number, string>;
  fillAlpha?: number;
  selected?: number;
  onSelect?: (plaka: number) => void;
  /** Farben der Länder nach ISO-Kürzel (Ebene „Beziehungen“) */
  laenderFarben?: Record<string, string>;
  /** Tippen auf ein Land außerhalb der Türkei, in jeder Ebene; `pos` ist die Bildschirmposition (Fensterkoordinaten) des Tippens */
  onLand?: (iso: string, pos?: { x: number; y: number }) => void;
  /** Land unter dem Zeiger (ISO-Kürzel), `undefined` beim Verlassen */
  hoverLand?: (iso: string | undefined) => void;
  /** Land, das dauerhaft hervorgehoben wird (ISO-Kürzel), etwa das angetippte */
  landAuswahl?: string;
  /** Stätten, Wunder und Bauvorhaben mit Länge und Breite */
  orte?: KartenOrt[];
  /** Flaggen der Gesprächspartner an einem Punkt im Land; Tippen ruft `onLand` mit der Kennung `iso` */
  laenderPins?: { id: string; iso: string; lon: number; lat: number; name: string; ton: "gut" | "mittel" | "schlecht"; /** Rang bei Gedränge: höhere Flaggen bleiben, überdeckte werden ausgeblendet */ rang?: number }[];
  /** Klick auf eine Reich-Marke; `ort` trägt den Reiter der Akte (`klickTab`) */
  onOrt?: (id: string, ort?: KartenOrt) => void;
  /** Vorkommen und strategische Orte der Linsen „Ressourcen“ und „Strategische Orte“ (ui/gueter/linsen.ts): klein, unter den Städten */
  fundorte?: KartenMarke[];
  /** Klick auf eine solche Marke */
  onFundort?: (m: KartenMarke) => void;
  /** Ereignis- und Krisenmarken an Provinzen */
  marken?: { id: string; plaka: number; art: "ereignis" | "frist" | "krise"; text: string }[];
  onMarke?: (id: string) => void;
  onHover?: (plaka: number | undefined) => void;
  /** Zusatzzeilen unter dem Namen der Provinz im Zeiger (etwa Kapazität und Auslastung der Linse „Belastung“) */
  hoverZeilen?: (plaka: number) => string[];
  /** Welche Provinzen als Städte erscheinen (Kfz-Kennziffern): Banner, Figur und Tafel */
  labels?: number[];
  /** Tafel, Größenzeichen, Statussymbole und Rang je Stadt (siehe staedte.ts); ohne sie zeigt die Karte nur Punkt und Name */
  stadtInfo?: Record<number, StadtInfo>;
  /** Freie Beschriftungen wie Meere und Nachbarländer */
  geoLabels?: { text: string; lon: number; lat: number; kind: "meer" | "land" }[];
  className?: string;
  /** Ohne Bedienung, etwa als Hintergrund des Titelbilds */
  interactive?: boolean;
  /** Kamera fährt weich an diese Stelle */
  camera?: { lon: number; lat: number; d: number };
  /** Langsames Schweben der Kamera */
  drift?: boolean;
  /** Rechter Bildrand in Pixeln, der verdeckt ist (das Buch im Prolog): Das Ziel der Kamera steht in der Mitte der freien Fläche */
  randRechts?: number;
  /** Welche Kartenebene gezeigt wird (bestimmt Straßen, Bezirke, Einrichtungen) */
  ebene?: Kartenebene;
  /** Spieldatum (ISO): bestimmt die Jahreszeit des Geländes (Schnee, Frühlingsgrün, Wärme) */
  datum?: string;
  /**
   * Ereigniskamera: Bei neuer Kennung fliegt die Kamera an die Stelle, ein Ring läuft nach außen; bei `beben` zittert die Karte kurz.
   * `kamera: false` lässt die Kamera stehen (nur Ring).
   */
  ereignis?: { id: string; lon: number; lat: number; art: "beben" | "anschlag" | "krieg" | "ereignis"; d?: number; kamera?: boolean };
  /** Die Karte liegt hinter einer offenen Akte: nur noch selten zeichnen (spart Rechenzeit; Eingaben wecken sie sofort) */
  sparsam?: boolean;
}

const NAMES: Record<number, string> = Object.fromEntries(PROVINCE_FC.features.map((f) => [f.properties.plaka, f.properties.name]));

interface Ctx {
  atlas: AtlasScene;
  relief: Relief;
  vector: VectorLayer;
  centers: Record<number, [number, number]>;
  /** Anteil des Kerns (Türkei) an Breite und Höhe des Rahmens: Schweben und Flüge sind in Kernmaßen gedacht */
  kern: { b: number; h: number };
}

/** Anfangsabstand: die ganze Türkei samt Rand passt auf ein Fenster im Seitenverhältnis 16:10 */
const START_D = 15;
const MIN_D = 2.4;
/** Weitester Abstand: die ganze Welt im Bild (Strategieansicht) */
const MAX_D = 220;
/** Oberflächenelemente über der Karte: Beschriftungen und Namen weichen ihnen aus, statt darunter abgeschnitten zu werden */
const UI_SPERREN = [".hud", ".alerts", ".dossier-menu", ".linsen", ".linsen-legende", ".cartouche", ".compass", ".effekte-schalter", ".meldungen"];
type Rechteck = { x: number; y: number; w: number; h: number };

function uiSperren(rect: DOMRect): Rechteck[] {
  const out: Rechteck[] = [];
  for (const sel of UI_SPERREN) {
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      out.push({ x: r.left - rect.left, y: r.top - rect.top, w: r.width, h: r.height });
    }
  }
  return out;
}

/** Wohin die Tafel einer Marke ragt: oberhalb (o) oder unterhalb (u), und mittig (m), links (l) oder rechts (r) ausgerichtet, damit sie im Bild bleibt */
function tafelLage(el: HTMLElement, x: number, y: number, breite: number): void {
  const wert = `${y < 230 ? "u" : "o"}${x < 150 ? "l" : x > breite - 150 ? "r" : "m"}`;
  if (el.dataset.tafel !== wert) el.dataset.tafel = wert;
}

/** Abstand eines Kastens (Mitte x, y; Halbbreite hb, Halbhöhe hh) zum nächsten gesperrten Rechteck (0 = überdeckt) */
function abstandZuSperren(sperren: Rechteck[], x: number, y: number, hb: number, hh: number): number {
  let m = Infinity;
  for (const r of sperren) {
    const dx = Math.max(r.x - (x + hb), x - hb - (r.x + r.w), 0);
    const dy = Math.max(r.y - (y + hh), y - hh - (r.y + r.h), 0);
    m = Math.min(m, Math.hypot(dx, dy));
  }
  return m;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function AtlasMap({
  fill,
  fillAlpha,
  selected,
  onSelect,
  laenderFarben,
  onLand,
  hoverLand,
  landAuswahl,
  marken = [],
  onMarke,
  orte = [],
  fundorte = [],
  onFundort,
  laenderPins = [],
  onOrt,
  onHover,
  hoverZeilen,
  labels = [],
  stadtInfo,
  geoLabels = [],
  className,
  interactive = true,
  camera,
  drift = false,
  randRechts = 0,
  ebene = "gelaende",
  sparsam = false,
  datum,
  ereignis,
}: AtlasMapProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const vec = useRef<HTMLCanvasElement>(null);
  const labelLayer = useRef<HTMLDivElement>(null);
  const ctx = useRef<Ctx | null>(null);
  const [ready, setReady] = useState(false);
  const [namenDa, setNamenDa] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [hover, setHover] = useState<number | undefined>(undefined);
  const [landHover, setLandHover] = useState<{ iso: string; name: string } | undefined>(undefined);
  const landHoverRef = useRef<string | undefined>(undefined);
  const [bezirk, setBezirk] = useState<{ info: BezirkInfo; x: number; y: number } | undefined>(undefined);
  const styleRef = useRef({ fill, fillAlpha, hover, selected, ebene });
  const labelsRef = useRef(labels);
  labelsRef.current = labels;
  const view = useRef({ u: 0.5, v: 0.5, d: 13 });
  /** Kamerafahrt mit Bogen: Start- und Zielpunkt, Beginn, Dauer und Höhe des Bogens */
  const flight = useRef<{ u0: number; v0: number; d0: number; u1: number; v1: number; d1: number; start: number; dauer: number; bogen: number } | null>(null);
  /** Nachlauf nach dem Ziehen (Trägheit) in Texturkoordinaten je Millisekunde */
  const traegheit = useRef<{ vu: number; vv: number; letzte: number } | null>(null);
  /** Weicher Zoom: Zielabstand und Zeigerposition, auf die gezoomt wird */
  const zoomZiel = useRef<{ ziel: number; x: number; y: number; letzte: number } | null>(null);
  /** Weiches Anstoßen an Rand oder Zoomgrenze */
  const anstoss = useRef<{ start: number; richtung: number } | null>(null);
  const letzterAnstoss = useRef(0);
  const stufe = useEffektstufe();
  const stufeRef = useRef(stufe);
  stufeRef.current = stufe;
  const fxCanvas = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<FxLayer | null>(null);
  const vorOrte = useRef<Map<string, { art: string; lon: number; lat: number }> | null>(null);
  const vorMarken = useRef<Set<string> | null>(null);
  const ziehen = useRef<{ x: number; y: number; t: number }[]>([]);
  const ereignisId = useRef<string | undefined>(undefined);
  const datumRef = useRef(datum);
  datumRef.current = datum;
  const driftRef = useRef(drift);
  driftRef.current = drift;
  const drag = useRef<{ x: number; y: number; ground: [number, number]; moved: boolean } | null>(null);
  const hoverRaf = useRef(0);
  // Bedarfsgerechtes Zeichnen: Voll nur bei Bewegung und Eingabe, sonst wenige Bilder pro Sekunde (die Wasserwellen laufen langsam weiter).
  // Früher zeichnete die Schleife jedes Bild neu (Relief-Shader mit Rauschen auf bis zu 3000 × 1700 Pixeln, dazu die Beschriftungen) —
  // im Leerlauf blieb ein Kern des Rechners dauernd belegt, auch hinter einer ganz offenen Akte.
  const aktivBis = useRef(0);
  /** Bis wann die Karte verschoben oder gezoomt wird (dann gröbere Auflösung) */
  const bewegtBis = useRef(0);
  const terrainDirty = useRef(true);
  const labelsDirty = useRef(true);
  const sparsamRef = useRef(sparsam);
  sparsamRef.current = sparsam;
  const wecke = (ms = 1500) => {
    aktivBis.current = Math.max(aktivBis.current, performance.now() + ms);
  };

  // Szene einmalig aufbauen
  useEffect(() => {
    let disposed = false;
    let frame = 0;
    let ro: ResizeObserver | undefined;
    Promise.all([loadRelief(), loadKuestenFeld()])
      .then(([relief, kueste]) => {
        if (disposed || !canvas.current || !wrap.current || !vec.current) return;
        const atlas = createAtlas(canvas.current, relief, kueste);
        const vector = new VectorLayer(vec.current, atlas, relief);
        const fx = new FxLayer(fxCanvas.current!, atlas, vector);
        fxRef.current = fx;
        atlas.setEffekt(effektFuer(stufeRef.current, datumRef.current ?? "2026-09-25"));
        vector.onDaten = () => {
          aktivBis.current = Math.max(aktivBis.current, performance.now() + 1500);
          labelsDirty.current = true;
          vector.markDirty();
          setNamenDa(vector.namenBereit());
        };
        const [ku0, kv0] = lonLatToUv(relief, relief.kern.lon0, relief.kern.lat1);
        const [ku1, kv1] = lonLatToUv(relief, relief.kern.lon1, relief.kern.lat0);
        const kern = { b: ku1 - ku0, h: kv1 - kv0 };
        ctx.current = { atlas, relief, vector, centers: provinceCenters(relief), kern };
        const dpr = Math.min(window.devicePixelRatio, 2);
        const size = () => {
          aktivBis.current = Math.max(aktivBis.current, performance.now() + 1500);
          labelsDirty.current = true;
          terrainDirty.current = true;
          const r = wrap.current!.getBoundingClientRect();
          atlas.resize(r.width, r.height);
          vector.resize(Math.max(1, r.width), Math.max(1, r.height), dpr);
          fx.resize(Math.max(1, r.width), Math.max(1, r.height), dpr);
          const c = view.current;
          const v = atlas.setView(c.u, c.v, c.d);
          view.current = { ...c, u: v.u, v: v.v };
        };
        const [u0, v0] = lonLatToUv(relief, 35.3, 38.6);
        view.current = { u: u0, v: v0, d: START_D };
        size();
        ro = new ResizeObserver(size);
        ro.observe(wrap.current);
        vector.setStyle(styleRef.current);
        // Nur für Prüfskripte in der Entwicklung: Kamera setzen und Bildschirmposition eines Ortes abfragen
        if (import.meta.env.DEV) {
          (window as unknown as { __karte?: unknown }).__karte = {
            setze: (lon: number, lat: number, d: number) => {
              const [u, v] = lonLatToUv(relief, lon, lat);
              flight.current = null;
              const n = atlas.setView(u, v, d);
              view.current = { u: n.u, v: n.v, d };
            },
            /** Zeit für das letzte gezeichnete Bild (Flächen, Namen) in Millisekunden */
            zeiten: () => ({ ...vector.zeiten }),
            /** Zuletzt gesetzte Namen mit Rechtecken und die von der Oberfläche belegten Rechtecke */
            namen: () => ({ gesetzt: vector.gesetzteNamen(), reserviert: vector.reservierteRechtecke() }),
            /** Land und Provinz an einer Bildschirmposition (Fensterkoordinaten), wie beim Tippen */
            trefferBei: (cx: number, cy: number) => {
              const r = wrap.current!.getBoundingClientRect();
              const uv = atlas.pickUv(cx - r.left, cy - r.top);
              if (!uv) return { provinz: undefined, land: undefined };
              const provinz = vector.pickProvince(uv[0], uv[1]);
              return { provinz, land: provinz ? undefined : vector.pickLand(uv[0], uv[1]) };
            },
            bildschirm: (lon: number, lat: number) => {
              const [u, v] = lonLatToUv(relief, lon, lat);
              const p = atlas.project(u, v);
              const r = wrap.current!.getBoundingClientRect();
              return { x: p.x + r.left, y: p.y + r.top, sichtbar: p.sichtbar };
            },
          };
        }
        const t0 = performance.now();
        let letzter = -1e9;
        let letzterTerrain = -1e9;
        let letzterSchluessel = "";
        let letzterZeitpunkt = performance.now();
        const loop = (now: number) => {
          const jetzt = performance.now();
          const stufe = stufeRef.current;
          const f = flight.current;
          const tr = traegheit.current;
          const zm = zoomZiel.current;
          const bebt = fx.bebt(jetzt);
          const bewegt = !!f || !!tr || !!zm || !!anstoss.current || bebt || jetzt < bewegtBis.current;
          const fxLaeuft = fx.laeuft();
          const aktiv = bewegt || fxLaeuft || jetzt < aktivBis.current;
          const atmet = !aktiv && !sparsamRef.current && fx.atmet(stufe);
          // Mindestabstand zwischen zwei Durchläufen: aktiv jedes Bild; Atmen der Auswahl 15 bis 30 Bilder/s; Titelbild-Schweben 30 Bilder/s;
          // Ruhe 15/s; hinter einer Akte etwa 3/s
          const minMs = sparsamRef.current && !f ? 320 : aktiv ? 0 : atmet ? 1000 / Math.max(1, leerlaufBilder(stufe)) : driftRef.current ? 33 : 66;
          if (now - letzter < minMs - 3) {
            frame = requestAnimationFrame(loop);
            return;
          }
          letzter = now;
          const dt = Math.min(60, jetzt - letzterZeitpunkt);
          letzterZeitpunkt = jetzt;
          const t = (jetzt - t0) / 1000;
          const cur = view.current;
          let changed = false;
          if (f) {
            const p = f.dauer <= 0 ? 1 : (jetzt - f.start) / f.dauer;
            const e = sanftInOut(p);
            cur.u = mische(f.u0, f.u1, e);
            cur.v = mische(f.v0, f.v1, e);
            // Bogen: Auf weiter Strecke fährt die Kamera kurz heraus und dann hinein
            cur.d = mische(f.d0, f.d1, e) * (1 + (f.bogen - 1) * Math.sin(Math.PI * Math.min(1, p)));
            if (p >= 1) {
              cur.u = f.u1;
              cur.v = f.v1;
              cur.d = f.d1;
              flight.current = null;
            }
            changed = true;
          } else {
            // Nachlauf nach dem Ziehen
            if (tr) {
              const dtT = Math.min(50, jetzt - tr.letzte);
              tr.letzte = jetzt;
              cur.u += tr.vu * dtT;
              cur.v += tr.vv * dtT;
              const k = Math.exp(-dtT / 240);
              tr.vu *= k;
              tr.vv *= k;
              if (Math.hypot(tr.vu / kern.b, tr.vv / kern.h) < 2e-6) traegheit.current = null;
              changed = true;
            }
            // Weicher Zoom auf die Stelle unter dem Zeiger
            if (zm) {
              const dtZ = Math.min(50, jetzt - zm.letzte);
              zm.letzte = jetzt;
              const dNeu = naehere(cur.d, zm.ziel, dtZ, 85);
              const vor = atlas.groundUv(zm.x, zm.y);
              let n = atlas.setView(cur.u, cur.v, dNeu);
              const nach = atlas.groundUv(zm.x, zm.y);
              if (vor && nach) n = atlas.setView(n.u + (vor[0] - nach[0]), n.v + (vor[1] - nach[1]), dNeu);
              cur.u = n.u;
              cur.v = n.v;
              cur.d = dNeu;
              if (Math.abs(dNeu - zm.ziel) / zm.ziel < 0.002) {
                cur.d = zm.ziel;
                zoomZiel.current = null;
              }
              changed = true;
            }
          }
          // Weiches Anstoßen: Der Abstand federt kurz nach, wenn Rand oder Zoomgrenze erreicht wurden
          let dFaktor = 1;
          if (anstoss.current) {
            const ta = jetzt - anstoss.current.start;
            if (ta > 420) anstoss.current = null;
            else dFaktor = 1 + anstoss.current.richtung * 0.014 * Math.exp(-ta / 110) * Math.sin(ta / 38);
            changed = true;
          }
          const [su, sv] = fx.schuettel(jetzt);
          const wackelt = su !== 0 || sv !== 0;
          if (changed || driftRef.current || wackelt) {
            const sway = driftRef.current ? [Math.sin(t * 0.05) * 0.035 * kern.b, Math.cos(t * 0.037) * 0.02 * kern.h] : [0, 0];
            // Beben: kleine, schnell abklingende Verschiebung (etwa ein halbes Prozent der Kartenbreite)
            const bu = su * 0.006 * kern.b;
            const bv = sv * 0.006 * kern.h;
            const v = atlas.setView(cur.u + sway[0]! + bu, cur.v + sway[1]! + bv, cur.d * dFaktor);
            if (!driftRef.current && !wackelt) {
              cur.u = v.u;
              cur.v = v.v;
            }
          }
          // Beim Verschieben und Zoomen genügt eine gröbere Auflösung; im Stand kehrt die volle Schärfe zurück
          atlas.setQualitaet(bewegt || driftRef.current ? 0.6 : 1);
          // Das Relief (schwerer Shader) nur neu rechnen, wenn sich der Blickpunkt oder die Größe geändert hat oder das Wasser weiterläuft;
          // eine Hervorhebung beim Überfahren kostet so nur die leichte Effektschicht.
          const schluessel = `${cur.u.toFixed(5)}|${cur.v.toFixed(5)}|${cur.d.toFixed(3)}|${wackelt ? t : 0}`;
          const wasserMs = sparsamRef.current ? 320 : 80;
          if (terrainDirty.current || schluessel !== letzterSchluessel || jetzt - letzterTerrain >= wasserMs) {
            atlas.render(t);
            letzterTerrain = jetzt;
            terrainDirty.current = false;
          }
          vector.draw();
          fx.draw(jetzt, stufe);
          void dt;
          // Die Beschriftungen ändern sich nur mit Blickpunkt, Größe oder Inhalt (Layout lesen ist teuer)
          if (labelsDirty.current || schluessel !== letzterSchluessel || driftRef.current) {
            placeLabels();
            labelsDirty.current = false;
            letzterSchluessel = schluessel;
          }
          frame = requestAnimationFrame(loop);
        };
        loop(performance.now());
        setReady(true);
      })
      .catch((e) => setFehler(String(e)));
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      ro?.disconnect();
      ctx.current?.atlas.dispose();
      ctx.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nach jedem Aufbau der Komponente: Die Beschriftungen könnten sich geändert haben (Marken, Orte, Flaggen, Städte)
  useEffect(() => {
    labelsDirty.current = true;
  });

  // Die Karte wird wieder sichtbar (Akte geschlossen): sofort frisch zeichnen
  useEffect(() => {
    if (!sparsam) wecke(1200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sparsam]);

  // Farben, Auswahl und Ebene an die Vektorebene weitergeben
  useEffect(() => {
    wecke(900);
    styleRef.current = { fill, fillAlpha, hover, selected, ebene };
    ctx.current?.vector.setStyle({ ...(fill ? { fill } : {}), ...(fill === undefined ? { fill: undefined } : {}), ...(laenderFarben ? { laender: laenderFarben } : { laender: undefined as never }), fillAlpha, hover, selected, ebene });
  }, [fill, fillAlpha, ebene, ready, laenderFarben]);

  // Was die Oberfläche schon selbst beschriftet (Stadtschilder), zeichnet die Karte nicht noch einmal;
  // die übergebenen Meeresnamen ersetzt die Karte durch eigene, sobald ihre Namensdaten da sind.
  useEffect(() => {
    ctx.current?.vector.setAusgeblendet(labels.map((p) => NAMES[p] ?? "").filter(Boolean));
  }, [labels, ready]);

  useEffect(() => {
    ctx.current?.vector.setStyle({ landAuswahl });
  }, [landAuswahl, ready]);

  /** Startet eine Kamerafahrt mit Beschleunigen, Abbremsen und Bogen; mit Effekte „aus“ springt die Kamera. */
  function starteFlug(lon: number, lat: number, d: number): void {
    const c = ctx.current;
    if (!c) return;
    const [u1, v1] = lonLatToUv(c.relief, lon, lat);
    const cur = view.current;
    const strecke = (Math.hypot((u1 - cur.u) / c.kern.b, (v1 - cur.v) / c.kern.h) * START_D) / Math.max(cur.d, d);
    const dauer = bewegungsFaktor(stufeRef.current) === 0 ? 0 : flugDauer(strecke, cur.d / d);
    traegheit.current = null;
    zoomZiel.current = null;
    flight.current = { u0: cur.u, v0: cur.v, d0: cur.d, u1, v1, d1: d, start: performance.now(), dauer, bogen: dauer === 0 ? 1 : flugBogen(strecke) };
    wecke(dauer + 600);
  }

  // Kamerafahrt zu einer Stelle
  useEffect(() => {
    if (!ready || !camera) return;
    starteFlug(camera.lon, camera.lat, camera.d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, camera?.lon, camera?.lat, camera?.d]);

  // Verdeckter Rand rechts (das Buch im Prolog): Die Kamera zielt in die Mitte der freien Fläche
  useEffect(() => {
    const c = ctx.current;
    if (!ready || !c) return;
    c.atlas.setzeRand(randRechts);
    terrainDirty.current = true;
    labelsDirty.current = true;
    wecke(500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, randRechts]);

  // Jahreszeit, Schaum, Wolkenschatten und Strömung des Geländes folgen Effektstufe und Spieldatum
  useEffect(() => {
    const c = ctx.current;
    if (!ready || !c) return;
    c.atlas.setEffekt(effektFuer(stufe, datum ?? "2026-09-25"));
    terrainDirty.current = true;
    wecke(500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, stufe, datum?.slice(0, 7)]);

  // Hervorhebungen (Hover, Auswahl) in der Effektschicht: weich, ohne die Vektorebene neu zu zeichnen
  useEffect(() => {
    const fx = fxRef.current;
    if (!ready || !fx) return;
    fx.setZiel({ ...(hover !== undefined ? { hover } : {}), ...(selected !== undefined ? { selected } : {}), ...(landAuswahl ? { landAuswahl } : {}), ...(landHover ? { hoverLand: landHover.iso } : {}) }, stufe);
    wecke(700);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, hover, selected, landAuswahl, landHover?.iso, stufe]);

  // Ereigniskamera: neues Ereignis → Kamera fliegt hin, Ring läuft, bei Beben zittert die Karte
  useEffect(() => {
    const c = ctx.current;
    const fx = fxRef.current;
    if (!ready || !c || !fx || !ereignis) return;
    if (ereignisId.current === ereignis.id) return;
    const erste = ereignisId.current === undefined;
    ereignisId.current = ereignis.id;
    // Beim ersten Mal (Laden eines Spielstands) keine Show
    if (erste && stufeRef.current === "aus") return;
    const [u, v] = lonLatToUv(c.relief, ereignis.lon, ereignis.lat);
    const jetzt = performance.now();
    if (stufeRef.current !== "aus") {
      fx.ring(u, v, jetzt, ereignis.art === "krieg" ? "rgba(168, 58, 50, 1)" : ereignis.art === "ereignis" ? "rgba(214, 168, 72, 1)" : "rgba(196, 70, 52, 1)", 0.05);
      if (ereignis.art === "beben" && stufeRef.current === "hoch" && bewegungsFaktor("hoch") > 0) fx.beben(jetzt, 1);
    }
    if (ereignis.kamera !== false && bewegungsFaktor(stufeRef.current) > 0) starteFlug(ereignis.lon, ereignis.lat, ereignis.d ?? 6.5);
    wecke(2200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, ereignis?.id]);

  // Fertigstellung: Verschwindet ein Bauvorhaben aus der Liste, gibt es Funken und einen Ring an seiner Stelle
  useEffect(() => {
    const c = ctx.current;
    const fx = fxRef.current;
    if (!ready || !c || !fx) return;
    const neu = new Map(orte.map((o) => [o.id, { art: o.art, lon: o.lon, lat: o.lat }]));
    const alt = vorOrte.current;
    vorOrte.current = neu;
    if (!alt || stufeRef.current === "aus") return;
    for (const [id, o] of alt) {
      if (o.art === "bau" && !neu.has(id)) {
        const [u, v] = lonLatToUv(c.relief, o.lon, o.lat);
        fx.funke(u, v, performance.now());
        wecke(1500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, orte]);

  // Neue Ereignis- und Krisenmarken: ein Ring auf der Provinz zieht den Blick hin
  useEffect(() => {
    const c = ctx.current;
    const fx = fxRef.current;
    if (!ready || !c || !fx) return;
    const neu = new Set(marken.map((m) => m.id));
    const alt = vorMarken.current;
    vorMarken.current = neu;
    if (!alt || stufeRef.current === "aus") return;
    for (const m of marken) {
      if (alt.has(m.id) || m.art === "frist") continue;
      const mitte = c.centers[m.plaka];
      if (mitte) {
        fx.ring(mitte[0], mitte[1], performance.now(), m.art === "krise" ? "rgba(214, 168, 72, 1)" : "rgba(196, 70, 52, 1)", 0.03);
        wecke(1800);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, marken]);

  // Tinten-Animation für Besitzerwechsel (Annexion, Besatzung): `animiereBesitzerwechsel` aus tinte.ts läuft über diese Karte
  useEffect(() => {
    const c = ctx.current;
    const fx = fxRef.current;
    if (!ready || !c || !fx) return;
    setzeTintenSenke({
      starte: (a) =>
        new Promise<void>((fertigAlles) => {
          const stufen = c.vector.stufenZugriff();
          const bezug = feinsteStufe(stufen);
          const flaechen = bezug >= 0 ? gemeinteFlaechen(stufen[bezug]!, a.von, a.flaechenIds) : [];
          if (!flaechen.length) return fertigAlles();
          const wechsle = () => {
            uebertrageUeberStufen(stufen, a.von, a.nach, a.flaechenIds, bezug);
            c.vector.markDirty();
            wecke(600);
            fertigAlles();
          };
          const dauer = (a.dauerMs ?? DAUER.tinte) * dauerFaktor(stufeRef.current);
          if (dauer <= 0) return wechsle();
          const farbe = a.farbe ?? c.vector.besitzerFarbe(a.nach) ?? "rgba(214, 168, 72, 1)";
          fx.tinte(flaechen, farbe, performance.now(), dauer, wechsle);
          wecke(dauer + 800);
        }),
    });
    return () => setzeTintenSenke(null);
  }, [ready]);

  function placeLabels() {
    const c = ctx.current;
    const layer = labelLayer.current;
    if (!c || !layer) return;
    const rect = layer.getBoundingClientRect();
    const sperren = uiSperren(rect);
    /** Faktor 0 bis 1: Unter Kopfleiste, Aktenleiste, Hinweisen und Legende verschwindet ein Schild weich, statt abgeschnitten zu werden */
    const ui = (x: number, y: number, hb: number, hh: number) => (sperren.length ? smooth(0, 26, abstandZuSperren(sperren, x, y, hb, hh)) : 1);
    // Stadtfiguren erst aus der Nähe, von weitem nur Banner wie Siegpunkte
    layer.classList.toggle("far", view.current.d > 11);
    // Aus der Nähe steht neben jeder Marke ihr Name
    layer.classList.toggle("nah", view.current.d < 9);
    // Stadtfiguren über dem Banner: die Hauptstadt fast immer, Großstädte ab mittlerer Zoomstufe, Provinzstädte erst aus der Nähe
    layer.classList.toggle("figuren-hauptstadt", view.current.d < 24);
    layer.classList.toggle("figuren-metropole", view.current.d < 17);
    layer.classList.toggle("figuren-stadt", view.current.d < 9);
    const belegt: { x: number; y: number; w: number; h: number }[] = [];
    const reichMarken: { el: HTMLElement; x: number; y: number; rang: number; sichtbar: boolean }[] = [];
    const staedteEl: { el: HTMLElement; x: number; y: number; sichtbar: boolean }[] = [];
    const pins: { el: HTMLElement; x: number; y: number }[] = [];
    const fundEl: { el: HTMLElement; x: number; y: number; rang: number }[] = [];
    for (const el of Array.from(layer.children) as HTMLElement[]) {
      let center: [number, number] | undefined;
      if (el.dataset.lon) center = lonLatToUv(c.relief, Number(el.dataset.lon), Number(el.dataset.lat));
      else center = c.centers[Number(el.dataset.plaka)];
      if (!center) continue;
      const p = c.atlas.project(center[0], center[1]);
      // Städte: Banner und Figur werden gesammelt und unten nach Rang platziert
      if (el.classList.contains("city")) {
        staedteEl.push({ el, x: p.x, y: p.y, sichtbar: p.sichtbar });
        continue;
      }
      // Vorkommen und strategische Orte: klein, belegen keinen Platz (Städte gehen vor), bei Gedränge bleibt der höhere Rang
      if (el.classList.contains("fund")) {
        el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
        const sicht = p.sichtbar && p.x > 0 && p.x < rect.width && p.y > 60 && p.y < rect.height;
        const f = sicht ? ui(p.x, p.y, 8, 8) : 0;
        el.style.opacity = f > 0.02 ? (f >= 0.98 ? "1" : f.toFixed(2)) : "0";
        fundEl.push({ el, x: p.x, y: p.y, rang: Number(el.dataset.rang ?? 1) });
        tafelLage(el, p.x, p.y, rect.width);
        continue;
      }
      const scale = el.dataset.plaka ? Math.min(1.5, Math.max(0.62, 11 / view.current.d)) : 1;
      const ort = el.classList.contains("ort");
      if (ort) {
        el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
        const dmax = Number(el.dataset.dmax ?? 99);
        const dmin = Number(el.dataset.dmin ?? 0);
        const sichtOrt = p.sichtbar && view.current.d <= dmax && view.current.d >= dmin && p.x > 0 && p.x < rect.width && p.y > 60 && p.y < rect.height;
        // Flaggen und Marken nahe an der Oberfläche blenden weich aus; ganz überdeckte sind weg
        const fadeOrt = sichtOrt ? ui(p.x, p.y, 16, 16) : 0;
        el.style.opacity = fadeOrt > 0.02 ? (fadeOrt >= 0.98 ? "1" : fadeOrt.toFixed(2)) : "0";
        el.style.pointerEvents = Number(el.style.opacity) > 0.5 ? "auto" : "none";
        tafelLage(el, p.x, p.y, rect.width);
        if (el.style.opacity === "1") belegt.push(el.classList.contains("ort-land") ? { x: p.x - 24, y: p.y - 24, w: 48, h: 48 } : { x: p.x - 15, y: p.y - 15, w: 30, h: 30 });
        if (el.classList.contains("ort-land")) pins.push({ el, x: p.x, y: p.y });
        // Reich-Marken (nicht die Flaggen der Länder): bei Gedränge nach Rang zusammenfassen
        if (!el.classList.contains("ort-land")) reichMarken.push({ el, x: p.x, y: p.y, rang: Number(el.dataset.rang ?? 1), sichtbar: Number(el.style.opacity) > 0.5 });
        continue;
      }
      const marke = el.classList.contains("marke");
      el.style.transform = marke
        ? `translate(${p.x + Number(el.dataset.dx ?? 0)}px, ${p.y - 26 + Number(el.dataset.dy ?? 0)}px) translate(-50%, -100%)`
        : el.dataset.plaka
          ? `translate(${p.x}px, ${p.y}px) translate(-50%, -8px) scale(${scale.toFixed(3)})`
          : `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
      // am Rand ausblenden, damit Namen nicht abgeschnitten werden
      const half = el.offsetWidth / 2 + 12;
      const edge = Math.min(p.x - half, rect.width - p.x - half, p.y - 70, rect.height - p.y - 20);
      // Weit herausgezoomt (Welt im Bild) verschwinden die Schilder der 81 Provinzen, die Ereignismarken etwas später
      const ferne = 1 - smooth(el.dataset.plaka && !marke ? 24 : 60, el.dataset.plaka && !marke ? 42 : 95, view.current.d);
      const uiF = p.sichtbar ? ui(p.x, p.y - (marke ? 40 : 0), el.offsetWidth / 2 * scale, el.offsetHeight / 2 * scale) : 0;
      el.style.opacity = p.sichtbar ? String(Math.max(0, Math.min(1, edge / 40)) * ferne * uiF) : "0";
      if (marke) {
        const sichtM = Number(el.style.opacity) > 0.5;
        el.style.pointerEvents = sichtM ? "auto" : "none";
        el.tabIndex = sichtM ? 0 : -1;
        tafelLage(el, p.x + Number(el.dataset.dx ?? 0), p.y - 26 + Number(el.dataset.dy ?? 0), rect.width);
      }
      if (p.sichtbar && marke) belegt.push({ x: p.x - 16, y: p.y - 58, w: 32, h: 34 });
    }
    const fundGesetzt: { x: number; y: number }[] = [];
    for (const m of fundEl.filter((q) => q.el.style.opacity !== "0").sort((a, b) => b.rang - a.rang)) {
      const frei = !fundGesetzt.some((q) => Math.hypot(q.x - m.x, q.y - m.y) < 14);
      if (frei) fundGesetzt.push(m);
      else m.el.style.opacity = "0";
      m.el.style.pointerEvents = frei && Number(m.el.style.opacity) > 0.5 ? "auto" : "none";
      m.el.tabIndex = frei ? 0 : -1;
    }
    for (const m of fundEl) if (m.el.style.opacity === "0") m.el.style.pointerEvents = "none";
    // Gedränge: Reich-Marken, die näher als 28 Bildpunkte beieinander liegen, fasst die mit dem höchsten Rang zusammen (Zahl der verdeckten)
    const behalten: { el: HTMLElement; x: number; y: number; mehr: number }[] = [];
    for (const m of reichMarken.filter((q) => q.sichtbar).sort((a, b) => b.rang - a.rang)) {
      const nah = behalten.find((q) => Math.hypot(q.x - m.x, q.y - m.y) < 28);
      if (nah) {
        nah.mehr++;
        m.el.style.opacity = "0";
        m.el.style.pointerEvents = "none";
        m.el.tabIndex = -1;
      } else behalten.push({ el: m.el, x: m.x, y: m.y, mehr: 0 });
    }
    for (const m of reichMarken) {
      const k = behalten.find((q) => q.el === m.el);
      const badge = m.el.querySelector<HTMLElement>(".ort-mehr");
      if (badge) {
        const n = k && k.mehr > 0 ? String(k.mehr) : "";
        if (badge.dataset.mehr !== n) badge.dataset.mehr = n;
      }
      m.el.tabIndex = m.el.style.opacity === "0" ? -1 : 0;
    }
    // Flaggen der Länder: bei Gedränge bleibt die mit dem höheren Rang, die überdeckte wird ausgeblendet
    const flaggen: { el: HTMLElement; x: number; y: number; rang: number }[] = [];
    for (const el of Array.from(layer.children) as HTMLElement[]) {
      if (!el.classList.contains("ort-land") || el.style.opacity !== "1") continue;
      const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(el.style.transform);
      if (!m) continue;
      flaggen.push({ el, x: Number(m[1]), y: Number(m[2]), rang: Number(el.dataset.rang ?? 0) });
    }
    flaggen.sort((a, b) => b.rang - a.rang);
    const gesetzt: { x: number; y: number }[] = [];
    for (const f of flaggen) {
      if (gesetzt.some((g) => Math.hypot(g.x - f.x, g.y - f.y) < 34)) {
        f.el.style.opacity = "0";
        f.el.style.pointerEvents = "none";
      } else {
        gesetzt.push(f);
      }
    }
    // Städte: Banner für alle Provinzen; bei Kollision bleibt die Stadt mit dem höheren Rang. Hindernisse sind die sichtbaren Flaggen der Länder.
    {
      const d = view.current.d;
      const skala = Math.min(1.45, Math.max(1, 14 / d));
      const ferneS = 1 - smooth(24, 42, d);
      const figur = { hauptstadt: [72, 54, d < 24], metropole: [64, 48, d < 17], stadt: [58, 44, d < 9] } as const;
      // erst alles lesen, dann schreiben (kein erzwungenes Layout je Stadt)
      const breiten = staedteEl.map((s) => s.el.offsetWidth);
      const fertig = staedteEl.map((s, i) => {
        const el = s.el;
        const art = el.classList.contains("city-hauptstadt") ? "hauptstadt" : el.classList.contains("city-metropole") ? "metropole" : "stadt";
        const [fb, fh, zeigt] = figur[art];
        const w = breiten[i]! * skala;
        const W = Math.max(w, zeigt ? fb * skala : 0) + 6;
        const oben = s.y - 8 - (zeigt ? fh * skala : 0);
        const unten = s.y + 6 + 27 * skala;
        const rang = Number(el.dataset.rang ?? 0) + (el.classList.contains("selected") ? 1e12 : 0);
        const half = w / 2 + 12;
        const edge = Math.min(s.x - half, rect.width - s.x - half, s.y - 70, rect.height - s.y - 20);
        const fade = s.sichtbar ? Math.max(0, Math.min(1, edge / 40)) * ferneS * ui(s.x, s.y + 12, w / 2, 14 * skala) : 0;
        return { s, rang, fade, r: { x: s.x - W / 2, y: oben, w: W, h: unten - oben } };
      });
      const hindernisse: { x: number; y: number; w: number; h: number }[] = pins.filter((q) => q.el.style.opacity !== "0").map((q) => ({ x: q.x - 22, y: q.y - 22, w: 44, h: 44 }));
      const schneidet = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      for (const f of fertig.sort((a, b) => b.rang - a.rang)) {
        const el = f.s.el;
        const platz = f.fade > 0.02 && !hindernisse.some((q) => schneidet(f.r, q));
        el.style.transform = `translate(${f.s.x}px, ${f.s.y}px) translate(-50%, -6px)`;
        const innen = el.firstElementChild as HTMLElement | null;
        if (innen) innen.style.scale = skala.toFixed(3);
        if (platz) {
          hindernisse.push(f.r);
          belegt.push({ x: f.r.x, y: f.r.y + 10, w: f.r.w, h: f.r.h - 10 });
          el.style.opacity = f.fade >= 0.98 ? "1" : f.fade.toFixed(2);
          el.style.pointerEvents = f.fade > 0.5 ? "auto" : "none";
          el.tabIndex = f.fade > 0.5 ? 0 : -1;
        } else {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
          el.tabIndex = -1;
        }
        tafelLage(el, f.s.x, f.s.y, rect.width);
      }
    }
    // Auch die Oberfläche belegt Platz: Namen der Karte (Belgrad, Tirana …) rücken nicht unter Kopfleiste und Aktenleiste
    for (const r of sperren) belegt.push({ x: r.x - 6, y: r.y - 6, w: r.w + 12, h: r.h + 12 });
    c.vector.setReserviert(belegt);
  }

  function local(e: React.PointerEvent | React.WheelEvent): { x: number; y: number } {
    const r = wrap.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  /** Land unter dem Zeiger: hebt es hervor und meldet es nach außen */
  function setLandzeiger(iso: string | undefined) {
    const c = ctx.current;
    if (!c || landHoverRef.current === iso) return;
    landHoverRef.current = iso;
    c.vector.setStyle({ hoverLand: iso });
    setLandHover(iso ? { iso, name: c.vector.laender().find((l) => l.iso === iso)?.name ?? iso } : undefined);
    hoverLand?.(iso);
  }

  function updateHover(e: React.PointerEvent) {
    const c = ctx.current;
    if (!c) return;
    const { x, y } = local(e);
    const uv = c.atlas.pickUv(x, y);
    if (!uv) {
      setHover(undefined);
      setBezirk(undefined);
      setLandzeiger(undefined);
      c.vector.setStyle({ hoverBezirk: undefined, hoverLand: undefined });
      return;
    }
    const p = c.vector.pickProvince(uv[0], uv[1]);
    if (p !== hover) {
      setHover(p);
      onHover?.(p);
    }
    setLandzeiger(p ? undefined : c.vector.pickLand(uv[0], uv[1]));
    const b = c.vector.pickBezirk(uv[0], uv[1]);
    if (b && (ebene === "infrastruktur" || view.current.d < 7)) {
      c.vector.setStyle({ hoverBezirk: b.index });
      setBezirk({ info: b.info, x, y });
    } else {
      c.vector.setStyle({ hoverBezirk: undefined });
      setBezirk(undefined);
    }
  }

  return (
    <div
      ref={wrap}
      className={`atlas ${interactive ? "" : "passive"} ${hover || landHover ? "karte-zeiger" : ""} ${className ?? ""}`}
      onPointerDown={(e) => {
        const c = ctx.current;
        wecke(2500);
        if (!interactive || !c) return;
        flight.current = null;
        traegheit.current = null;
        zoomZiel.current = null;
        ziehen.current = [];
        const { x, y } = local(e);
        const g = c.atlas.groundUv(x, y);
        drag.current = g ? { x: e.clientX, y: e.clientY, ground: g, moved: false } : null;
      }}
      onPointerMove={(e) => {
        if (!interactive) return;
        wecke(900);
        const c = ctx.current;
        const d = drag.current;
        if (c && d && e.buttons === 1) {
          if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 4) d.moved = true;
          if (!d.moved) return;
          bewegtBis.current = performance.now() + 260;
          const { x, y } = local(e);
          const g = c.atlas.groundUv(x, y);
          if (!g) return;
          // Die Stelle unter dem Zeiger bleibt unter dem Zeiger: Die Karte wird gegriffen
          const v = view.current;
          const wunschU = v.u + (d.ground[0] - g[0]);
          const wunschV = v.v + (d.ground[1] - g[1]);
          const n = c.atlas.setView(wunschU, wunschV, v.d);
          view.current = { ...v, u: n.u, v: n.v };
          // Rand erreicht: weiches Anstoßen (höchstens alle 600 ms)
          const jetzt = performance.now();
          if ((Math.abs(n.u - wunschU) / c.kern.b > 0.004 || Math.abs(n.v - wunschV) / c.kern.h > 0.004) && jetzt - letzterAnstoss.current > 600 && bewegungsFaktor(stufeRef.current) > 0) {
            letzterAnstoss.current = jetzt;
            anstoss.current = { start: jetzt, richtung: 1 };
          }
          ziehen.current.push({ x: n.u, y: n.v, t: jetzt });
          if (ziehen.current.length > 6) ziehen.current.shift();
          return;
        }
        if (hoverRaf.current) return;
        const ev = e;
        hoverRaf.current = requestAnimationFrame(() => {
          hoverRaf.current = 0;
          updateHover(ev);
        });
      }}
      onPointerUp={(e) => {
        const c = ctx.current;
        const d = drag.current;
        drag.current = null;
        // Nachlauf: Geschwindigkeit der letzten etwa 90 Millisekunden des Ziehens
        if (c && d?.moved && bewegungsFaktor(stufeRef.current) > 0) {
          const jetzt = performance.now();
          const probe = ziehen.current.filter((q) => jetzt - q.t < 90);
          if (probe.length >= 2) {
            const a0 = probe[0]!;
            const a1 = probe[probe.length - 1]!;
            const dtP = Math.max(8, a1.t - a0.t);
            const vu = (a1.x - a0.x) / dtP;
            const vv = (a1.y - a0.y) / dtP;
            if (Math.hypot(vu / c.kern.b, vv / c.kern.h) > 6e-5) {
              traegheit.current = { vu: vu * 0.85, vv: vv * 0.85, letzte: jetzt };
              wecke(1600);
            }
          }
        }
        ziehen.current = [];
        if (c && d && !d.moved) {
          // Klick auf ein Stadtbanner: diese Provinz (nicht, was unter dem Zeiger auf dem Gelände liegt)
          const stadt = (e.target as HTMLElement | null)?.closest?.(".city") as HTMLElement | null;
          const plakaStadt = stadt ? Number(stadt.dataset.plaka) : 0;
          if (plakaStadt) {
            onSelect?.(plakaStadt);
            return;
          }
          const { x, y } = local(e);
          const uv = c.atlas.pickUv(x, y);
          const p = uv ? c.vector.pickProvince(uv[0], uv[1]) : undefined;
          if (p) onSelect?.(p);
          else if (uv && onLand) {
            const iso = c.vector.pickLand(uv[0], uv[1]);
            if (iso) onLand(iso, { x: e.clientX, y: e.clientY });
          }
        }
      }}
      onPointerLeave={() => {
        setHover(undefined);
        setBezirk(undefined);
        setLandzeiger(undefined);
        ctx.current?.vector.setStyle({ hoverBezirk: undefined });
        onHover?.(undefined);
      }}
      onWheel={(e) => {
        const c = ctx.current;
        wecke(2500);
        if (!interactive || !c) return;
        bewegtBis.current = performance.now() + 260;
        flight.current = null;
        traegheit.current = null;
        const { x, y } = local(e);
        const v = view.current;
        const basis = zoomZiel.current?.ziel ?? v.d;
        const gewuenscht = basis * Math.exp(Math.max(-0.35, Math.min(0.35, e.deltaY * 0.0022)));
        const d = Math.min(MAX_D, Math.max(MIN_D, gewuenscht));
        const jetzt = performance.now();
        // Zoomgrenze erreicht und weitergedreht: weiches Anstoßen
        if (d !== gewuenscht && jetzt - letzterAnstoss.current > 600 && bewegungsFaktor(stufeRef.current) > 0) {
          letzterAnstoss.current = jetzt;
          anstoss.current = { start: jetzt, richtung: gewuenscht < d ? -1 : 1 };
        }
        if (bewegungsFaktor(stufeRef.current) === 0) {
          // Effekte aus oder Bewegung reduziert: sofort, auf die Stelle unter dem Zeiger
          const vor = c.atlas.groundUv(x, y);
          let n = c.atlas.setView(v.u, v.v, d);
          const nach = c.atlas.groundUv(x, y);
          if (vor && nach) n = c.atlas.setView(n.u + (vor[0] - nach[0]), n.v + (vor[1] - nach[1]), d);
          view.current = { u: n.u, v: n.v, d };
          return;
        }
        // Sonst gleitet der Abstand zum Ziel (gemeinsam mit weiteren Raddrehungen)
        zoomZiel.current = { ziel: d, x, y, letzte: jetzt };
      }}
    >
      <canvas ref={canvas} className="atlas-canvas" />
      <canvas ref={vec} className="atlas-vector" />
      <canvas ref={fxCanvas} className="atlas-fx" aria-hidden />
      <div ref={labelLayer} className="atlas-labels" aria-hidden>
        {(namenDa ? [] : geoLabels).map((g) => (
          <span key={g.text} data-lon={g.lon} data-lat={g.lat} className={`atlas-geo ${g.kind}`}>
            {g.text}
          </span>
        ))}
        {orte.map((o) => {
          const art = o.art;
          const lage = o.lage ?? (art === "bau" ? "imBau" : o.zustand !== undefined && o.zustand < 40 ? "gefahr" : "fertig");
          const istMega = o.id.includes("kanal_istanbul") || o.id.includes("akkuyu") || o.id.includes("gap") || o.id.includes("marmaray") || o.id.includes("canakkale") || o.id.includes("osmangazi");
          return (
            <button
              key={o.id}
              type="button"
              data-lon={o.lon}
              data-lat={o.lat}
              data-dmax={o.dmax ?? 99}
              data-rang={o.rang ?? 1}
              className={`ort ort-${art} lage-${lage}${lage === "gefahr" ? " gefaehrdet" : ""}${istMega ? " ort-mega" : ""}`}
              aria-label={o.text}
              style={{ ...(o.zustand !== undefined ? { "--z": String(Math.round(o.zustand)) } : {}), ...(o.fortschritt !== undefined ? { "--p": String(o.fortschritt) } : {}) } as React.CSSProperties}
              onPointerUp={(e) => {
                e.stopPropagation();
                drag.current = null;
              }}
              onClick={(e) => {
                e.stopPropagation();
                onOrt?.(o.id, o);
              }}
            >
              <MarkenForm art={art} fortschritt={o.fortschritt ?? 0} pausiert={lage === "pausiert"} />
              {art !== "bau" && <Icon name={art === "erbe" ? "kuppel" : "tempel"} size={art === "erbe" ? 12 : 14} />}
              <b className="ort-mehr" aria-hidden />
              <span className="ort-name" aria-hidden>
                {o.name ?? o.text}
              </span>
              <span className="ort-tafel" role="tooltip" aria-hidden>
                <span className="ort-tafel-art">{o.artText ?? ""}</span>
                <strong>{o.name ?? o.text}</strong>
                {o.ortName && <span className="ort-tafel-ort">{o.ortName}</span>}
                {o.zeile && <span className="ort-tafel-zeile">{o.zeile}</span>}
                {o.rest && <span className="ort-tafel-rest">{o.rest}</span>}
                {o.naechste && (
                  <span className="ort-tafel-next">
                    <b>{t("marken.naechste.label")}:</b> {o.naechste}
                  </span>
                )}
                {o.klick && <span className="ort-tafel-klick">{o.klick}</span>}
              </span>
            </button>
          );
        })}
        {fundorte.map((m) => (
          <button
            key={m.id}
            type="button"
            data-lon={m.lon}
            data-lat={m.lat}
            data-rang={m.rang}
            className={`fund fund-${m.form} fund-r${m.rang}`}
            style={{ "--fund": m.farbe } as React.CSSProperties}
            aria-label={`${m.artText}: ${m.titel}. ${m.text}`}
            onPointerUp={(e) => {
              e.stopPropagation();
              drag.current = null;
            }}
            onClick={(e) => {
              e.stopPropagation();
              onFundort?.(m);
            }}
          >
            <i className="fund-zeichen" aria-hidden />
            <span className="ort-tafel" role="tooltip" aria-hidden>
              <span className="ort-tafel-art">{m.artText}</span>
              <strong>{m.titel}</strong>
              <span className="ort-tafel-zeile">{m.text}</span>
              {m.zusatz && <span className="ort-tafel-rest">{m.zusatz}</span>}
              <span className="ort-tafel-klick">{m.klick}</span>
            </span>
          </button>
        ))}
        {laenderPins.map((p) => (
          <button
            key={p.id}
            type="button"
            data-lon={p.lon}
            data-lat={p.lat}
            data-dmin="5.5"
            data-dmax="400"
            data-rang={p.rang ?? 0}
            className={`ort ort-land ton-${p.ton}`}
            title={p.name}
            aria-label={`${p.name}: Länderkarte öffnen`}
            onClick={(e) => {
              e.stopPropagation();
              onLand?.(p.iso, { x: e.clientX, y: e.clientY });
            }}
            onPointerUp={(e) => e.stopPropagation()}
          >
            <Flagge id={p.id} breite={28} rund />
          </button>
        ))}
        {marken.map((m, i) => {
          const artText = t(`marken.art.${m.art}`);
          return (
            <button
              key={m.id}
              data-plaka={m.plaka}
              data-dx={(i % 3) * 22 - 22}
              data-dy={-Math.floor(i / 3) * 26}
              className={`marke marke-${m.art}`}
              aria-label={`${artText}: ${m.text}`}
              onPointerUp={(e) => {
                e.stopPropagation();
                drag.current = null;
              }}
              onClick={(e) => {
                e.stopPropagation();
                onMarke?.(m.id);
              }}
            >
              <MarkenForm art={m.art} />
              <span className="marke-glyph" aria-hidden>!</span>
              <span className="ort-name" aria-hidden>
                {artText}
              </span>
              <span className="ort-tafel" role="tooltip" aria-hidden>
                <span className="ort-tafel-art">{artText}</span>
                <strong>{m.text}</strong>
                <span className="ort-tafel-klick">{t("marken.klick.ereignis")}</span>
              </span>
            </button>
          );
        })}
        {labels.map((p) => {
          const info = stadtInfo?.[p];
          const kind = info?.art ?? stadtArt(p);
          const mayor = info?.partei ?? PROVINZEN[p - 1]?.buergermeister2024 ?? "";
          const farbe = info?.parteiFarbe ?? PARTY_COLORS[mayor] ?? "#8a7a64";
          const st = info?.status;
          return (
            <button
              key={p}
              type="button"
              data-plaka={p}
              data-rang={info?.rang ?? (PROVINZEN[p - 1]?.bevoelkerung ?? 0) / 1000}
              className={`city city-${kind}${p === selected ? " selected" : ""}`}
              aria-label={info?.beschreibung ?? NAMES[p]}
              onClick={(e) => {
                // Mausklick behandelt die Karte beim Loslassen (Ziehen bleibt Ziehen); die Tastatur löst hier aus
                if (e.detail === 0) {
                  e.stopPropagation();
                  onSelect?.(p);
                }
              }}
            >
              <span className="city-innen">
                <span className="city-figur" aria-hidden>
                  <StadtFigur art={kind} />
                </span>
                <i className="karte-stadtpunkt" aria-hidden />
                <span className="city-banner">
                  <i className="stadt-streifen" style={{ background: farbe }} />
                  {info && <span className="stadt-groesse">{info.groesse}</span>}
                  {kind === "hauptstadt" && (
                    <b className="stadt-stern" aria-hidden>
                      ★
                    </b>
                  )}
                  {NAMES[p]}
                  {st && (st.frist || st.ereignis || st.krise || st.bau) && (
                    <span className="city-status" aria-hidden>
                      {st.frist && (
                        <span className="cs-frist">
                          <MarkenForm art="frist" />
                          <b>!</b>
                        </span>
                      )}
                      {st.ereignis && (
                        <span className="cs-ereignis">
                          <MarkenForm art="ereignis" />
                          <b>!</b>
                        </span>
                      )}
                      {st.krise && (
                        <span className="cs-krise">
                          <MarkenForm art="krise" />
                          <b>!</b>
                        </span>
                      )}
                      {st.bau && (
                        <span className="cs-bau">
                          <MarkenForm art="bau" fortschritt={0.5} />
                        </span>
                      )}
                    </span>
                  )}
                </span>
              </span>
              {info && (
                <span className="city-tafel" role="tooltip" aria-hidden>
                  <span className="city-tafel-art">{info.artText}</span>
                  <strong>
                    <i style={{ background: farbe }} />
                    {NAMES[p]}
                  </strong>
                  <span className="city-tafel-zeile">{info.einwohnerText}</span>
                  <span className="city-tafel-zeile">{info.rathausText}</span>
                  <span className="city-tafel-zeile city-tafel-lage">{info.lageText}</span>
                  {info.zustimmungText && <span className="city-tafel-zeile">{info.zustimmungText}</span>}
                  <span className="city-tafel-zeile">{info.vorhabenText}</span>
                  <span className="city-tafel-klick">{info.klick}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
      {!ready && !fehler && <div className="atlas-loading">Die Karte wird gezeichnet …</div>}
      {fehler && <div className="atlas-loading">Die Karte konnte nicht geladen werden.</div>}
      {bezirk ? (
        <div className="atlas-hover bezirk" style={{ left: bezirk.x + 16, top: bezirk.y + 16 }}>
          <strong>{bezirk.info.name}</strong>
          <span>{t("karte.bezirk.flaeche", { prov: NAMES[bezirk.info.plaka] ?? "", km: bezirk.info.flaeche })}</span>
          <span>{t("karte.bezirk.strassen", { dichte: bezirk.info.dichte })}</span>
          <span>{t("karte.bezirk.einrichtungen", { k: bezirk.info.krankenhaeuser, f: bezirk.info.flughaefen })}</span>
        </div>
      ) : (
        (hover || landHover) && (
          <div className="atlas-hover" {...(hover && hoverZeilen ? { style: { top: 72, bottom: "auto", zIndex: 6, maxWidth: 360 } } : {})}>
            {hover ? NAMES[hover] : landHover!.name}
            {hover && hoverZeilen?.(hover).map((z) => <span key={z} style={{ display: "block", fontSize: "0.8em", lineHeight: 1.35, opacity: 0.9 }}>{z}</span>)}
          </div>
        )
      )}
    </div>
  );
}

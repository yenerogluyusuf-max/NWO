// Identitätsmuster (Vorgabe P und S, 4. November 2026): drei Richtungen für ein eigenes Spielgesicht, in denen die Karte die Bühne ist
// und die Akte seitlich daneben aufgeht. Kein Spielcode, nur Ansicht. Aufruf: npm run dev, dann /identitaet.html?v=cini|tisch|hilal
// Die Karte zeichnet die echten Provinzgrenzen (data/provinzen.json) und Nachbarn (data/nachbarn.json); die Werte auf der Karte sind
// Beispielwerte aus dem Kriegsrundgang vom 4. November (Iran greift an, Woche 4, Front 63).
import { createRoot } from "react-dom/client";
import "@fontsource/cinzel/latin-500.css";
import "@fontsource/cinzel/latin-ext-500.css";
import "@fontsource/cinzel/latin-700.css";
import "@fontsource/cinzel/latin-ext-700.css";
import "@fontsource/saira-condensed/latin-500.css";
import "@fontsource/saira-condensed/latin-ext-500.css";
import "@fontsource/saira-condensed/latin-700.css";
import "@fontsource/saira-condensed/latin-ext-700.css";
import "@fontsource/marcellus-sc/latin-400.css";
import "@fontsource/marcellus-sc/latin-ext-400.css";
import "@fontsource/courier-prime/latin-400.css";
import "@fontsource/courier-prime/latin-ext-400.css";
import "@fontsource/courier-prime/latin-700.css";
import "@fontsource/courier-prime/latin-ext-700.css";
import "@fontsource-variable/oswald";
import "@fontsource-variable/eb-garamond";
import "@fontsource-variable/inter";
import "./ui/muster/identitaet.css";
import provinzen from "./data/provinzen.json";
import nachbarn from "./data/nachbarn.json";
import { Icon, type IconName } from "./ui/icons";

type Richtung = "cini" | "tisch" | "hilal";
const v = (new URLSearchParams(location.search).get("v") ?? "cini") as Richtung;

// --- Karte -----------------------------------------------------------------------------------------------------------
const LON0 = 25.2, LAT0 = 42.6, K = 46, KY = K * 1.28; // flächentreu genug für die Breite der Türkei
const px = (lon: number, lat: number): [number, number] => [(lon - LON0) * K, (LAT0 - lat) * KY];
const ring = (r: number[][]) => r.map(([lo, la], i) => { const [x, y] = px(lo!, la!); return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`; }).join("") + "Z";
type Feat = { properties: { plaka: number; name: string }; geometry: { type: string; coordinates: number[][][] | number[][][][] } };
const PROV = (provinzen as unknown as { features: Feat[] }).features.map((f) => {
  const polys = (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) as number[][][][];
  const d = polys.map((p) => p.map(ring).join("")).join("");
  const pts = polys[0]![0]!; let sx = 0, sy = 0; for (const [lo, la] of pts) { const [x, y] = px(lo!, la!); sx += x; sy += y; }
  return { plaka: f.properties.plaka, name: f.properties.name, d, c: [sx / pts.length, sy / pts.length] as [number, number] };
});
const NACHBARN = (nachbarn as unknown as { countries: { iso: string; name: string; rings: number[][][] }[] }).countries.map((c) => ({ iso: c.iso, name: c.name, d: c.rings.map(ring).join("") }));
const W = (45.2 - LON0) * K, H = (LAT0 - 35.6) * KY;

// Beispielwerte: Zustimmung je Provinz (Spielstand des Rundgangs, gerundet), Front im Osten, Proteste, Baustellen
const wert = (p: number) => 30 + ((p * 37) % 41);
const FRONT = new Set([65, 30, 4, 76, 73]); // Van, Hakkâri, Ağrı, Iğdır, Şırnak
const PROTEST = [34, 6]; const BAU = [33, 61]; const KRISE = [31];
const mitte = (p: number) => PROV.find((x) => x.plaka === p)!.c;

function Karte({ farbe }: { farbe: (z: number, p: number) => string }) {
  const [vx, vy] = mitte(65);
  return (
    <svg className="id-karte" viewBox={`-60 -40 ${W + 120} ${H + 80}`} preserveAspectRatio="xMidYMid meet" aria-label="Karte der Türkei">
      <defs>
        <pattern id="schraffur" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" className="id-front-grund" /><line x1="0" y1="0" x2="0" y2="7" className="id-front-linie" /></pattern>
        <marker id="pfeil" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" className="id-pfeilspitze" /></marker>
        <filter id="leuchten" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <g className="id-nachbarn">{NACHBARN.map((n) => <path key={n.iso} d={n.d} />)}</g>
      <g className="id-land" filter="url(#leuchten)"><path d={PROV.map((p) => p.d).join("")} /></g>
      <g className="id-provinzen">
        {PROV.map((p) => <path key={p.plaka} d={p.d} fill={FRONT.has(p.plaka) ? "url(#schraffur)" : farbe(wert(p.plaka), p.plaka)} className={FRONT.has(p.plaka) ? "front" : ""}><title>{p.name}</title></path>)}
      </g>
      <path className="id-vorstoss" d={`M${vx + 150},${vy + 40} Q${vx + 60},${vy - 10} ${vx + 8},${vy + 4}`} markerEnd="url(#pfeil)" />
      <path className="id-vorstoss eigen" d={`M${vx - 120},${vy - 20} Q${vx - 50},${vy - 50} ${vx - 6},${vy - 14}`} markerEnd="url(#pfeil)" />
      {PROTEST.map((p) => <Marke key={p} c={mitte(p)} icon="menge" art="protest" />)}
      {BAU.map((p) => <Marke key={p} c={mitte(p)} icon="kran" art="bau" />)}
      {KRISE.map((p) => <Marke key={p} c={mitte(p)} icon="warnung" art="krise" />)}
      <g className="id-ortsname"><text x={mitte(34)[0] - 10} y={mitte(34)[1] - 24}>İstanbul</text><text x={mitte(6)[0] - 20} y={mitte(6)[1] - 24}>Ankara</text><text x={vx - 10} y={vy + 46}>Front Van</text></g>
    </svg>
  );
}
function Marke({ c, icon, art }: { c: [number, number]; icon: IconName; art: string }) {
  return (
    <g className={`id-marke ${art}`} transform={`translate(${c[0]},${c[1]})`}>
      <circle r="17" className="ring" /><circle r="13" className="kern" />
      <g transform="translate(-9,-9)"><Icon name={icon} size={18} /></g>
    </g>
  );
}

// --- Inhalt ------------------------------------------------------------------------------------------------------------
const NAV: { gruppe: string; punkte: [IconName, string, number?][] }[] = [
  { gruppe: "Regieren", punkte: [["feder", "Schreibtisch"], ["siegel", "Politik"], ["parlament", "Parlament"], ["person", "Kabinett"]] },
  { gruppe: "Land gestalten", punkte: [["bank", "Wirtschaft"], ["menge", "Gesellschaft"], ["karte", "Land", 5], ["buch", "Forschung & Ziele"]] },
  { gruppe: "Welt", punkte: [["berg", "Außen"], ["ziel", "Sicherheit"], ["zeitung", "Medien", 3]] },
];
const HUD: [IconName, string, string, string?][] = [
  ["menge", "47 %", "Zustimmung"], ["siegel", "111", "Kapital"], ["lira", "−3,4 %", "Haushalt", "schlecht"], ["preis", "30,0 %", "Inflation", "gut"], ["muenze", "51,2", "Lira je $", "schlecht"],
];
const KARTEN = [
  { kicker: "Krieg · Iran", titel: "Die Front im Osten hält", text: "Woche 4, Front 63 von 100, steigend. Der Nachschub über Van läuft.", tag: "Dringend", art: "krieg", knopf: "Zum Lagetisch" },
  { kicker: "Justiz", titel: "Ebru Kılıç: Verantwortung klären", text: "Die Ministerin steht unter Druck. Entlassen kostet Rückhalt, Halten kostet Ansehen.", tag: "Dringend", art: "dringend", knopf: "Entscheiden" },
  { kicker: "Erbe · Batman", titel: "Hasankeyf verfällt", text: "Zustand 15. Ohne Hilfe verliert die Stätte Besucher und Ansehen.", tag: "Im Blick", art: "blick", knopf: "Ansehen" },
];

function Seite() {
  const farbe: Record<Richtung, (z: number, p: number) => string> = {
    cini: (z) => `hsl(${214 - (z - 30) * 0.25} ${34 + (z - 30) * 0.5}% ${20 + (z - 30) * 0.75}%)`,
    tisch: (z) => `hsl(38 ${30 + (z - 30) * 0.5}% ${80 - (z - 30) * 0.45}%)`,
    hilal: (z) => `hsl(${352 + (z - 30) * 0.2} ${20 + (z - 30) * 1.2}% ${12 + (z - 30) * 0.45}%)`,
  };
  const NAME: Record<Richtung, string> = { cini: "Çini", tisch: "Kriegstisch", hilal: "Hilal" };
  return (
    <div className={`id id-${v}`}>
      <div className="id-grund" aria-hidden />
      <header className="id-hud">
        <div className="id-wer"><span className="id-bild">DA</span><span><b>Deniz Aydın</b><i>Aufbruchspartei · 1. Amtszeit</i></span></div>
        <div className="id-zeit"><b>14. August 2028</b><span className="id-tempo"><button className="an">❚❚</button><button>▶</button><button>▶▶</button><button>▶▶▶</button></span></div>
        <div className="id-werte">{HUD.map(([i, w, l, s]) => <div key={l} className={`id-wert ${s ?? ""}`}><Icon name={i} size={18} /><span><b>{w}</b><small>{l}</small></span></div>)}</div>
      </header>
      <nav className="id-nav" aria-label="Bereiche">
        <div className="id-marke-spiel"><b>Staatsräson</b><small>Türkiye · 2028</small></div>
        {NAV.map((g) => (
          <div key={g.gruppe} className="id-gruppe">
            <span className="id-gruppenkopf">{g.gruppe}</span>
            {g.punkte.map(([i, n, z], k) => <button key={n} className={`id-punkt${g.gruppe === "Regieren" && k === 0 ? " an" : ""}`}><span className="id-medaillon"><Icon name={i} size={20} /></span><span className="id-punktname">{n}</span>{z ? <em>{z}</em> : null}</button>)}
          </div>
        ))}
      </nav>
      <main className="id-buehne">
        <div className="id-kartenleiste">
          {["Zustimmung", "Wirtschaft", "Sicherheit", "Bauvorhaben", "Welt"].map((x, i) => <button key={x} className={i === 2 ? "an" : ""}>{x}</button>)}
        </div>
        <Karte farbe={farbe[v]} />
        <div className="id-legende"><span><i className="l-front" />Front</span><span><i className="l-protest" />Protest</span><span><i className="l-bau" />Baustelle</span><span><i className="l-zust" />Zustimmung</span></div>
        <div className="id-meldung">
          <span className="id-meldungskopf">{v === "tisch" ? "Telegramm · 14.08.2028 · 06:40" : "Eilmeldung"}</span>
          <b>Grenzzwischenfall bei Hakkâri</b>
          <p>Iranische Drohnen über zwei Dörfern. Der Generalstab bittet um Freigabe für Gegenschläge.</p>
          <div className="id-wahl"><button className="haupt">Freigeben · 4 PK</button><button>Abwarten</button></div>
        </div>
      </main>
      <aside className="id-akte" aria-label="Schreibtisch">
        <div className="id-aktenkopf"><span className="id-kicker">Präsidialamt · Schreibtisch</span><h1>Jetzt wichtig</h1><p>Wahl in 17 Monaten · Mehrheit 327 von 600</p></div>
        <div className="id-karten">
          {KARTEN.map((k, i) => (
            <article key={k.titel} className={`id-karte-akte ${k.art}`}>
              <span className="id-nr">{String(i + 1).padStart(2, "0")}</span>
              <span className="id-tag">{k.tag}</span>
              <span className="id-kicker">{k.kicker}</span>
              <h2>{k.titel}</h2>
              <p>{k.text}</p>
              <button>{k.knopf} →</button>
            </article>
          ))}
        </div>
        <div className="id-lage">
          <button><b>63 ↑</b><small>Front Van</small></button><button><b>2</b><small>Proteste</small></button><button><b>2</b><small>Baustellen</small></button>
        </div>
        <div className="id-ziel"><span className="id-kicker">Großes Ziel · Union der Turkstaaten</span><div className="id-band"><i style={{ left: "28%", width: "22%" }} /></div><small>Chance möglich, etwa 28–50 %</small></div>
      </aside>
      <div className="id-schild">Richtung „{NAME[v]}“</div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Seite />);

// Gestaltungsmuster (GESTALTUNG_2026-11-04.md, Stufen G1–G4): drei Beispiele, wie die Akten aussehen könnten.
// Kein Spielcode: Die Seite liest echte Vorhaben aus den Spieldaten (Kosten, Wirkung, Kehrseite, Voraussetzung) und zeigt
// Kennzahlen aus dem geprüften Spielstand vom 4. August 2028 (Rundgang vom 4. November 2026). Aufruf: npm run dev, dann /muster.html
import { createRoot } from "react-dom/client";
import type { ReactNode } from "react";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/eb-garamond";
import "@fontsource-variable/inter";
import "./ui/styles.css";
import "./ui/muster/muster.css";
import { ladeSprache } from "./i18n";
import { Corners, Flourish } from "./ui/art/Ornament";
import { Icon, type IconName } from "./ui/icons";

// ---------------------------------------------------------------------------------------------------------------------
// G2: Zeichensprache. Eine Größe hat überall dasselbe Zeichen und dieselbe Farbe.

type Ressource = "pk" | "geld" | "aufmerksamkeit" | "bau" | "zeit" | "verwaltung" | "schulden" | "ap" | "zustimmung";
const RESSOURCE: Record<Ressource, { name: string; farbe: string; icon: IconName | "uhr"; was: string }> = {
  pk: { name: "Politisches Kapital", farbe: "#8e2a22", icon: "siegel", was: "Ihr politischer Spielraum: Gespräche, Gesetze, Druck." },
  geld: { name: "Staatsgeld", farbe: "#a8781f", icon: "lira", was: "Haushalt in Mrd. TRY oder Prozent des BIP." },
  schulden: { name: "Schuldenquote", farbe: "#6b4a2b", icon: "bank", was: "Prozentpunkte des BIP, verteilt über die Bauzeit." },
  aufmerksamkeit: { name: "Aufmerksamkeit", farbe: "#2f5d8a", icon: "ziel", was: "Wie viel die Regierung gleichzeitig verfolgen kann." },
  verwaltung: { name: "Verwaltungskraft", farbe: "#5b4a7a", icon: "akte", was: "Je Monat gebunden, solange etwas läuft." },
  bau: { name: "Baukapazität", farbe: "#7a5b26", icon: "kran", was: "Baupunkte: was Werften, Firmen und Ämter leisten." },
  zeit: { name: "Zeit", farbe: "#46594f", icon: "uhr", was: "Frühestens so viele Monate, auch mit Geld im Überfluss." },
  ap: { name: "Wahlkampfpunkte", farbe: "#2f6b45", icon: "urne", was: "Das Wochenbudget der Kampagne." },
  zustimmung: { name: "Zustimmung", farbe: "#355f55", icon: "menge", was: "Umfragewert der Regierung." },
};

function Zeichen({ r, size = 18 }: { r: Ressource; size?: number }) {
  const d = RESSOURCE[r];
  return (
    <span className="mu-zeichen" style={{ ["--farbe" as string]: d.farbe, width: size + 10, height: size + 10 }} aria-hidden>
      {d.icon === "uhr" ? (
        <svg width={size} height={size} viewBox="0 0 24 24"><path d="M7 3h10M7 21h10M8 3c0 5 8 6 8 9s-8 4-8 9M16 3c0 5-8 6-8 9s8 4 8 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      ) : (
        <Icon name={d.icon} size={size} />
      )}
    </span>
  );
}

/** Ein Preis-Baustein: Zeichen, Zahl, Einheit. Überall gleich gebaut, damit man Kosten liest, ohne zu lesen. */
function Preis({ r, wert, einheit, titel }: { r: Ressource; wert: string; einheit?: string; titel?: string }) {
  return (
    <span className="mu-preis" title={titel ?? RESSOURCE[r].name} style={{ ["--farbe" as string]: RESSOURCE[r].farbe }}>
      <Zeichen r={r} size={14} />
      <b>{wert}</b>
      {einheit && <small>{einheit}</small>}
    </span>
  );
}

const de = (x: number, s = 1) => x.toLocaleString("de-DE", { maximumFractionDigits: s });

// ---------------------------------------------------------------------------------------------------------------------
// G1: Aktenrahmen mit eigener Zeichnung je Bereich (hier: Sicherheit). Neue Strichzeichnung im Stil von art/Vignette.tsx.

function SicherheitVignette() {
  const tinte = "#2a1f18";
  return (
    <svg className="mu-vignette" viewBox="0 0 900 200" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs>
        <linearGradient id="mu-himmel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6ecd2" />
          <stop offset="1" stopColor="#ead9b2" />
        </linearGradient>
      </defs>
      <rect width="900" height="200" fill="url(#mu-himmel)" />
      <circle cx="760" cy="62" r="30" fill="#e7c77c" opacity=".55" />
      {/* Küste mit Leuchtturm und Radar */}
      <path d="M0 150 C60 132 110 126 170 134 S260 150 300 142 L330 160 L0 160 Z" fill="#d8c59a" stroke={tinte} strokeWidth="1.3" />
      <path d="M210 134 L214 92 L224 92 L228 134" fill="#efe2c2" stroke={tinte} strokeWidth="1.3" />
      <path d="M208 92 h22 l-4 -10 h-14 Z" fill="#8e2a22" stroke={tinte} strokeWidth="1.2" />
      <path d="M90 128 v-26 M78 98 a14 8 0 0 1 24 0" fill="none" stroke={tinte} strokeWidth="1.3" />
      {/* Meer */}
      {[166, 176, 186].map((y, i) => (
        <path key={y} d={`M${i * 14} ${y} q18 -5 36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0 t36 0`} fill="none" stroke={tinte} strokeWidth=".8" opacity={0.5 - i * 0.12} />
      ))}
      <rect y="160" width="900" height="40" fill="#cdbb8f" opacity=".35" />
      {/* Schiff */}
      <path d="M430 158 L660 158 L640 172 L448 172 Z" fill="#c9b78d" stroke={tinte} strokeWidth="1.4" />
      <path d="M470 158 v-16 h60 v-10 h34 v26 M582 158 v-30 h22 v30 M540 132 v-22 M552 110 h-24 M600 128 l8 -18" fill="none" stroke={tinte} strokeWidth="1.3" />
      <path d="M506 142 h14 M566 140 h10" stroke={tinte} strokeWidth="1" />
      {/* Strahlflugzeug mit Kondensstreifen */}
      <path d="M380 58 C470 50 560 46 640 40" fill="none" stroke={tinte} strokeWidth=".8" strokeDasharray="2 5" opacity=".6" />
      <path d="M640 40 l40 -4 l8 3 l-8 3 l-40 2 Z M660 38 l-10 -12 h6 l16 11 M660 41 l-8 10 h6 l14 -9 M644 39 l-6 -6 h4 l6 5" fill="#efe2c2" stroke={tinte} strokeWidth="1.2" strokeLinejoin="round" />
      {/* Berge im Hintergrund */}
      <path d="M690 150 L740 104 L770 126 L812 86 L870 150 Z" fill="#e1cf9f" stroke={tinte} strokeWidth="1.1" opacity=".9" />
      <path d="M812 86 l-10 14 l8 -2 l6 8 l6 -10" fill="#f7f0de" stroke={tinte} strokeWidth="1" />
    </svg>
  );
}

/** Kennzahl als Messring: Wert, Bereich 0–100, Richtung gut/schlecht. */
function Messring({ name, wert, gut = true, text }: { name: string; wert: number; gut?: boolean; text: string }) {
  const r = 26, u = 2 * Math.PI * r, anteil = Math.max(0, Math.min(1, wert / 100));
  const stufe = gut ? (wert >= 60 ? "gut" : wert >= 40 ? "mittel" : "schlecht") : wert <= 40 ? "gut" : wert <= 60 ? "mittel" : "schlecht";
  return (
    <div className={`mu-ring ${stufe}`}>
      <svg width="68" height="68" viewBox="0 0 68 68" aria-hidden>
        <circle cx="34" cy="34" r={r} className="spur" />
        <circle cx="34" cy="34" r={r} className="wert" strokeDasharray={`${u * anteil} ${u}`} transform="rotate(-90 34 34)" />
        <text x="34" y="39" textAnchor="middle">{de(wert, 0)}</text>
      </svg>
      <div><strong>{name}</strong><small>{text}</small></div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// G3: Möglichkeiten als Bildkarten, mit echten Vorhaben aus den Spieldaten.

import { MILITAER_VORHABEN } from "./data/reich/militaer";
import { INFRA_VORHABEN } from "./data/reich/infrastruktur";
import { KLASSEN_NAMEN, type Vorhaben } from "./sim/reich-typen";
import { effektZeile } from "./sim/reich";
import { WunderBild } from "./ui/reich/WunderBild";

const alle = [...MILITAER_VORHABEN, ...INFRA_VORHABEN];
const vorhaben = (id: string) => alle.find((v) => v.id === id)!;

function voraussetzung(v: Vorhaben): string | null {
  const teile = (v.voraus ?? []).map((x) => {
    if (x.art === "land") return `Vertrauen ${x.land} mindestens ${x.min}`;
    if (x.art === "bestand") return `zuerst: ${alle.find((a) => a.id === x.id)?.name ?? x.id}`;
    return null;
  }).filter(Boolean);
  return teile.length ? teile.join(" · ") : null;
}

function Bildkarte({ id, zustand, rest }: { id: string; zustand: "moeglich" | "verlangt" | "bau"; rest?: string }) {
  const v = vorhaben(id), k = v.kosten, verlangt = voraussetzung(v);
  const wirkung = v.abschluss.map((e) => effektZeile(e)).filter((z): z is NonNullable<typeof z> => !!z).slice(0, 4);
  return (
    <article className={`mu-bildkarte ${zustand}`}>
      <div className="mu-bild">
        <WunderBild art={v.bild ?? "stadt"} zustand={zustand === "bau" ? "bau" : zustand === "verlangt" ? "entwurf" : "fertig"} fortschritt={zustand === "bau" ? 0.75 : 0} animiert={zustand === "bau"} />
        <span className="mu-klasse">{KLASSEN_NAMEN[v.klasse]}</span>
        {zustand === "bau" && <span className="mu-stempel bau">Im Bau</span>}
        {zustand === "verlangt" && <span className="mu-stempel verlangt">Voraussetzung fehlt</span>}
      </div>
      <div className="mu-karteninhalt">
        <h4>{v.name}</h4>
        <div className="mu-preise">
          {k.pk > 0 && <Preis r="pk" wert={de(k.pk)} />}
          <Preis r="bau" wert={de(k.bau, 0)} />
          <Preis r="zeit" wert={zustand === "bau" && rest ? rest : de(k.monate, 0)} einheit={zustand === "bau" ? "Mon. Rest" : "Mon."} />
          {k.schulden ? <Preis r="schulden" wert={`+${de(k.schulden)}`} einheit="Pp." /> : null}
        </div>
        <ul className="mu-wirkung">
          {wirkung.map((w) => <li key={w.text} className={w.gut ? "gut" : "schlecht"}>{w.richtung > 0 ? "▲" : "▼"} {w.text}</li>)}
        </ul>
        <p className="mu-kehrseite">{v.kehrseite}</p>
        {zustand === "verlangt" && verlangt && <p className="mu-verlangt">Verlangt {verlangt}</p>}
        <div className="mu-aktion">
          {zustand === "moeglich" && <button className="leather-button mu-los">Beginnen</button>}
          {zustand === "verlangt" && <button className="mu-weg">Weg dorthin zeigen →</button>}
          {zustand === "bau" && <button className="mu-weg">Auf der Karte zeigen →</button>}
        </div>
      </div>
    </article>
  );
}

function AkteSicherheit() {
  return (
    <section className="mu-akte frame">
      <Corners />
      <header className="mu-aktenkopf">
        <SicherheitVignette />
        <div className="mu-aktentitel">
          <span className="mu-kicker">Regierungsbereich · 4. August 2028</span>
          <h2>Sicherheit &amp; Verteidigung</h2>
          <Flourish width={180} />
          <p>Streitkräfte, Bereitschaft, laufende Konflikte und die Bündnisse, auf die Sie zählen können.</p>
        </div>
        <div className="mu-lagestempel ruhig"><span>Lage</span><b>ruhig</b></div>
      </header>
      <div className="mu-kennzahlen">
        <Messring name="Bereitschaft Heer" wert={60} text="einsatzbereite Verbände" />
        <Messring name="Abschreckung" wert={55} text="was ein Gegner einpreisen muss" />
        <div className="mu-zahlkarte"><b>0</b><strong>Laufende Konflikte</strong><small>Kein Schauplatz offen</small></div>
        <div className="mu-zahlkarte"><b>4</b><strong>Bündnisse</strong><small>Nordatlantikpakt · Turkstaaten · G20 · Mekka-Pakt</small></div>
      </div>
      <h3 className="mu-abschnitt">Was Sie jetzt in Auftrag geben können</h3>
      <div className="mu-karten">
        <Bildkarte id="mil_huerjet" zustand="moeglich" />
        <Bildkarte id="mil_kaan" zustand="verlangt" />
        <Bildkarte id="mil_tf2000" zustand="verlangt" />
        <Bildkarte id="infra_akkuyu" zustand="bau" rest="etwa 13" />
      </div>
      <p className="mu-fuss">Leere Abschnitte („Derzeit nichts.“) entfallen. Handeln geschieht auf der Karte, nicht hinter „… öffnen“.</p>
    </section>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// G4: Entscheidungskarte entschlackt. Gleiche Inhalte wie die heutige Wahlversprechen-Karte, das Wichtigste zuerst.

function Versprechen() {
  return (
    <article className="mu-entscheid">
      <header>
        <div><span className="mu-kicker">Dein Wort zählt · Wahlversprechen</span><h3>Renten erhöhen</h3></div>
        <Preis r="ap" wert="1" einheit="AP" titel="Preis heute: Wahlkampfpunkte" />
      </header>
      <div className="mu-ziel">
        <div className="mu-zielbalken" aria-label="Landesziel Rente: wirksam 50, zugesagt 70">
          <span className="ist" style={{ width: "50%" }} />
          <span className="neu" style={{ left: "50%", width: "20%" }} />
          <i style={{ left: "50%" }}>50</i><i className="z" style={{ left: "70%" }}>70</i>
        </div>
        <div className="mu-zielzeile"><span>Landesziel Rentenstufe</span><span><b>bis 31. Juli 2029</b></span></div>
      </div>
      <div className="mu-dreier">
        <div><span className="mu-klein">Sofort</span><b className="gut">+0,23</b><small>Regierungsvertrauen</small><b className="gut">+1,22</b><small>Rentnerinnen und Rentner</small></div>
        <div><span className="mu-klein">Später im Parlament</span><div className="mu-preise"><Preis r="pk" wert="8" /><Preis r="aufmerksamkeit" wert="10" /><Preis r="geld" wert="+0,24" einheit="% BIP/Jahr" /></div><small>≈ 201,60 Mrd. TRY im Jahr · Umsetzung 1 Monat</small></div>
        <div><span className="mu-klein">Mehrheit am 27. Juni 2028</span><b className="gut">335 / 301</b><small>erwartete Ja-Stimmen / nötig</small></div>
      </div>
      <details className="mu-herleitung">
        <summary>Wie das gerechnet ist und was nicht gebucht wird</summary>
        <p>Verbindlich ist das feste Landesziel. Ein ausreichender landesweiter Beschluss erfüllt die Zusage; die Umsetzung folgt erst danach. Einbringen allein genügt nicht.</p>
        <p>Die Beträge werden durch das Versprechen noch nicht gebucht. Eine Gegenfinanzierung entsteht nicht automatisch. Künftige Ereignisse, Koalitionsbrüche und die Streuung der Abstimmung können das Ergebnis verändern.</p>
        <p>Koalition beim Zielbeschluss: Burak Koçak 62,0 → 60,5 · Taner Sarı 25,0 → 24,7 · Volkan Karaca (YENİ) 61,0 → 59,7 · Cem Polat (DEM) 61,0 → 63,0.</p>
      </details>
      <div className="mu-aktion"><button className="leather-button mu-los">Verbindlich versprechen</button><span className="mu-klein">Gesetz · Parlament · Haushalt verlinkt</span></div>
    </article>
  );
}

function Legende() {
  return (
    <div className="mu-legende">
      {(Object.keys(RESSOURCE) as Ressource[]).map((r) => (
        <div key={r}><Zeichen r={r} size={20} /><div><strong>{RESSOURCE[r].name}</strong><small>{RESSOURCE[r].was}</small></div></div>
      ))}
    </div>
  );
}

function Teil({ nr, titel, text, children }: { nr: string; titel: string; text: string; children: ReactNode }) {
  return (
    <section className="mu-teil" data-teil={nr}>
      <div className="mu-teilkopf"><span>{nr}</span><div><h2>{titel}</h2><p>{text}</p></div></div>
      {children}
    </section>
  );
}

function Muster() {
  return (
    <main className="mu-seite">
      <header className="mu-seitenkopf">
        <h1>Gestaltungsmuster</h1>
        <p>Vorschlag zu GESTALTUNG_2026-11-04 · Beispiele, noch nicht im Spiel · Kosten, Wirkung und Kehrseite aus den Spieldaten; Kennzahlen aus den geprüften Spielständen vom 6. Juni und 4. August 2028</p>
      </header>
      <Teil nr="1" titel="Eine Akte, die zum Spiel gehört" text="Pergament, eine eigene Zeichnung je Bereich, Kennzahlen als Messringe, die Lage als Stempel. Darunter die Möglichkeiten als Bildkarten mit Preis, Wirkung und Kehrseite.">
        <AkteSicherheit />
      </Teil>
      <Teil nr="2" titel="Ein Zeichen je Ressource" text="Überall dieselbe Farbe und dasselbe Symbol. Kosten liest man auf einen Blick, auf jeder Karte gleich gebaut.">
        <Legende />
      </Teil>
      <Teil nr="3" titel="Entscheidungen: das Wichtigste zuerst" text="Dieselben Angaben wie die heutige Wahlversprechen-Karte. Oben Ziel, Frist, Preis und Mehrheit; die vollständige Herleitung bleibt erhalten, aber aufklappbar.">
        <Versprechen />
      </Teil>
    </main>
  );
}

ladeSprache("de").then(() => createRoot(document.getElementById("root")!).render(<Muster />));

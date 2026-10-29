// Ton des Spiels: kleine, prozedurale Klänge über WebAudio — ohne Audiodateien, ohne Ladezeit.
// Vier Meldungsklänge (Markt tickt, Bank ruft tief, Parlament knallt trocken, Ereignis erklingt weich),
// alles leise (Grundpegel 0,1), abschaltbar und der Zustand liegt im Browser (localStorage).
// Ohne AudioContext (Tests, alte Browser) tut alles nichts und wirft nichts.

import { t } from "../../i18n";

const SCHLUESSEL = "staatsraeson.ton";
type Art = "markt" | "bank" | "parlament" | "ereignis";

let kontext: AudioContext | null = null;

/** Ton ist an, außer der Spieler hat ihn ausgeschaltet. */
export function tonStatus(): boolean {
  try {
    return (localStorage.getItem(SCHLUESSEL) ?? "an") === "an";
  } catch {
    return true;
  }
}

export function tonUm(): boolean {
  const neu = !tonStatus();
  try {
    localStorage.setItem(SCHLUESSEL, neu ? "an" : "aus");
  } catch {
    /* ohne Speicher bleibt der Ton für diese Sitzung umgeschaltet */
  }
  return neu;
}

function kontextHolen(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Klasse = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Klasse) return null;
    kontext ??= new Klasse();
    if (kontext.state === "suspended") void kontext.resume();
    return kontext;
  } catch {
    return null;
  }
}

/** Ein kurzer Ton: Sinus mit Hüllkurve. Frequenz in Hz, Beginn und Länge in Sekunden. */
function note(k: AudioContext, freq: number, beginn: number, dauer: number, pegel: number, art: OscillatorType = "sine"): void {
  const osc = k.createOscillator();
  const hüll = k.createGain();
  osc.type = art;
  osc.frequency.setValueAtTime(freq, k.currentTime + beginn);
  hüll.gain.setValueAtTime(0, k.currentTime + beginn);
  hüll.gain.linearRampToValueAtTime(pegel, k.currentTime + beginn + 0.012);
  hüll.gain.exponentialRampToValueAtTime(0.0001, k.currentTime + beginn + dauer);
  osc.connect(hüll).connect(k.destination);
  osc.start(k.currentTime + beginn);
  osc.stop(k.currentTime + beginn + dauer + 0.02);
}

function klangEreignis(k: AudioContext): void {
  note(k, 659.25, 0, 0.28, 0.09); // E5
  note(k, 880, 0.09, 0.34, 0.07); // A5
}

function klangParlament(k: AudioContext): void {
  note(k, 196, 0, 0.14, 0.12, "triangle"); // G3, trocken wie ein Hammer
  note(k, 98, 0.015, 0.22, 0.08, "sine");
}

function klangBank(k: AudioContext): void {
  note(k, 146.83, 0, 0.3, 0.1); // D3
  note(k, 110, 0.12, 0.3, 0.07); // A2
}

function klangMarkt(k: AudioContext): void {
  note(k, 1174.66, 0, 0.09, 0.05); // D6, ein kurzer Tick
}

/** Spielt den Klang einer Meldung, wenn Ton an ist. Wirft nichts. */
export function spieleMeldungsTon(art: Art): void {
  if (!tonStatus()) return;
  try {
    const k = kontextHolen();
    if (!k) return;
    switch (art) {
      case "ereignis":
        klangEreignis(k);
        break;
      case "parlament":
        klangParlament(k);
        break;
      case "bank":
        klangBank(k);
        break;
      case "markt":
        klangMarkt(k);
        break;
    }
  } catch {
    /* Ton darf das Spiel nie brechen */
  }
}

/** Beschriftung des Schalters im Menü. */
export function tonLabel(): string {
  return tonStatus() ? t("kopf.ton.an") : t("kopf.ton.aus");
}

// Türkische Fallendungen für Eigennamen: Vokalharmonie, Pufferlaute, Apostroph.
// „Almanya“ → „Almanya’ya“, „Irak“ → „Irak’ta“, „ABD“ → „ABD’ye“, „Ankara“ → „Ankara’dan“.
//
// Grenzen: Verlässlich für Eigennamen (Länder, Orte, Parteien, Behörden). Gattungsnamen mit Lautwechsel am Wortende
// (çocuk → çocuğa) bildet die Funktion nicht; solche Formen schreibt der Katalog aus. Die Ausnahmetabelle ist von einer
// türkischen Muttersprachlerin bzw. einem Muttersprachler zu prüfen (Aussprache von Abkürzungen schwankt).

import type { Fall } from "./typen";

const VOKALE = "aeıioöuüâîû";
const HINTER = "aıouâû"; // dunkle Vokale
const RUND = "oöuü";
/** Harte (stimmlose) Konsonanten: danach beginnt die Endung mit t statt d („fıstıkçı şahap“) */
const HART = "fstkçşhp";

/**
 * Abkürzungen mit Vokalbuchstaben, die als Buchstabenfolge gesprochen werden, und Wörter, deren Schreibung die Aussprache
 * verfehlt. Wert = so gesprochen (nur für die Endung ausgewertet). Reine Konsonantenfolgen (TBMM, TCMB, BM, YSK, TRT, KDV)
 * brauchen keinen Eintrag: Jeder Konsonantenbuchstabe wird mit angehängtem „e“ gesprochen (be, ce, de … me).
 */
const AUSNAHMEN: Record<string, string> = {
  AB: "abe",
  ABD: "abede",
  AYM: "ayeme",
  AİHM: "aihme",
  AKP: "akape",
  CHP: "cehepe",
  MHP: "emhape",
  IMF: "imfe",
  BRICS: "briks",
  PKK: "pekaka",
  TSK: "tesaka",
};

/** Letzter Vokal des gesprochenen Wortes; fehlt einer, gilt der helle Vokal „e“. */
function letzterVokal(wort: string): string {
  for (let i = wort.length - 1; i >= 0; i--) {
    const c = wort[i]!.toLocaleLowerCase("tr");
    if (VOKALE.includes(c)) return c;
  }
  return "e";
}

const endetAufVokal = (gesprochen: string): boolean => VOKALE.includes(gesprochen[gesprochen.length - 1]!.toLocaleLowerCase("tr"));

function istAbkuerzung(wort: string): boolean {
  return wort.length > 1 && wort === wort.toLocaleUpperCase("tr") && /[A-ZÇĞİÖŞÜ]/.test(wort);
}

/** Gesprochene Form für die Endungsbildung. */
function gesprochen(wort: string): string {
  const aus = AUSNAHMEN[wort];
  if (aus) return aus;
  // Abkürzung ohne Vokalbuchstaben: Buchstabennamen, am Ende immer „-e“ (TBMM → „tebememe“)
  if (istAbkuerzung(wort) && !/[AEIİOÖUÜ]/.test(wort)) return wort.toLocaleLowerCase("tr") + "e";
  return wort;
}

function vierfach(v: string): "ı" | "i" | "u" | "ü" {
  if (HINTER.includes(v)) return RUND.includes(v) ? "u" : "ı";
  return RUND.includes(v) ? "ü" : "i";
}

const zweifach = (v: string): "a" | "e" => (HINTER.includes(v) ? "a" : "e");

const APOSTROPH = "’";

/**
 * Hängt die Endung eines Falls an einen Namen an. Eigennamen (Großbuchstabe am Anfang) bekommen einen Apostroph,
 * Gattungsnamen nicht. `nom` gibt das Wort unverändert zurück. Steht schon ein Apostroph im Wort, bleibt es unverändert.
 */
export function ek(wort: string, fall: Fall): string {
  if (fall === "nom" || wort.length === 0) return wort;
  if (wort.includes("’") || wort.includes("'")) return wort;
  const g = gesprochen(wort);
  const v = letzterVokal(g);
  const vokalEnde = endetAufVokal(g);
  const letzter = g[g.length - 1]!.toLocaleLowerCase("tr");
  const erster = wort[0]!;
  const eigenname = erster !== erster.toLocaleLowerCase("tr") && erster === erster.toLocaleUpperCase("tr");
  const trenner = eigenname ? APOSTROPH : "";
  const hart = !vokalEnde && HART.includes(letzter);
  let endung: string;
  switch (fall) {
    case "dat":
      endung = (vokalEnde ? "y" : "") + zweifach(v);
      break;
    case "akk":
      endung = (vokalEnde ? "y" : "") + vierfach(v);
      break;
    case "gen":
      endung = vokalEnde ? "n" + vierfach(v) + "n" : vierfach(v) + "n";
      break;
    case "loc":
      endung = (hart ? "t" : "d") + zweifach(v);
      break;
    case "abl":
      endung = (hart ? "t" : "d") + zweifach(v) + "n";
      break;
    case "ins":
      endung = (vokalEnde ? "y" : "") + "l" + zweifach(v);
      break;
    default:
      endung = "";
  }
  return wort + trenner + endung;
}

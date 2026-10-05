// Das Vermächtnis: der Rückblick auf die ganze Laufbahn in Kapiteln, aus den tatsächlichen Daten der Partie gebaut (Amtszeiten, Wahlen, Ziele, Zusagen,
// Kriege, Verfassung, Reich, Kabinett, Katastrophen). Reine Daten: Die Oberfläche (ui/wahl/Vermaechtnis.tsx) setzt Zahlen und Namen in Texte der aktuellen
// Sprache. Kein Kapitel erfindet Zahlen; jede Angabe stammt aus dem Weltzustand.

import { VORHABEN } from "../data/reich";
import { zielStand } from "./ziele";
import { zusagenBilanz } from "./zusagen";
import { amtszeitStarts } from "./amtszeit";
import { katastrophenBilanz, katastrophenZustand } from "./katastrophe";
import { kriege } from "./krieg";
import { LAENDER } from "./laender";
import { AEMTER } from "./personen";
import { erstelleBilanz } from "./bilanz";
import { endenSicht } from "./enden";
import type { Bilanz } from "./bilanz";
import type { World } from "./types";
import type { EndeArt } from "./spiel-typen";

export interface VermaechtnisAmtszeit {
  nr: number;
  von: string;
  bis: string;
  zustimmungStart: number;
  zustimmungEnde: number;
  ziele: { titel: string; erreicht: boolean; stand: string }[];
}

export interface VermaechtnisDaten {
  name: string;
  /** Zeitraum der Laufbahn */
  von: string;
  bis: string;
  tage: number;
  ende: { art: EndeArt; titel: string; text: string; datum: string; nachfolge?: "sieg" | "niederlage" } | null;
  /** Zustimmung Monat für Monat */
  kurve: { monat: string; wert: number }[];
  amtszeiten: VermaechtnisAmtszeit[];
  wahlen: { datum: string; anteil: number; stichwahl: boolean; gewonnen: boolean; marge: number; lagerSitze: number; lagerSitzeVorher: number; letzte: boolean }[];
  zusagen: { gehalten: number; gebrochen: number; offen: number; glaubwuerdigkeit: number };
  kriege: { gegner: string; wochen: number; ausgang: string }[];
  verfassung: { aenderungen: string[]; gescheitert: number };
  reich: { fertig: number; laufend: number; wunder: string[] };
  kabinett: { ehemalige: number; amtierend: { name: string; rolle: string; loyalitaet: number }[] };
  katastrophen: { fall: number; text: string };
  /** Die letzten Entscheidungen und Wendepunkte aus der Chronik (ohne Routine) */
  wendepunkte: { datum: string; titel: string; ausgang: string }[];
  kennzahlen: Bilanz["kennzahlen"];
  /** Die Enden-Schicht am Schluss: Putschrisiko, Verfahrensstand (für den Epilog) */
  schluss: { putschRisiko: number; amtsenthebungStufe: number };
}

/** Alles für das Vermächtnis-Fenster; funktioniert mitten im Spiel (Zwischenstand) und am Ende. */
export function vermaechtnis(w: World): VermaechtnisDaten {
  const sp = w.spiel!;
  const ende = sp.ende;
  const starts = amtszeitStarts(w);
  const archiv = sp.zielArchiv ?? [];
  const amtszeiten: VermaechtnisAmtszeit[] = starts.map((a, i) => {
    const naechste = starts[i + 1];
    const zielGruppe = archiv.find((x) => x.amtszeit === a.nr);
    const ziele = zielGruppe ? zielGruppe.ziele : i === starts.length - 1 ? zielStand(w).map((z) => ({ titel: z.def.titel, erreicht: z.erreicht, stand: z.stand })) : [];
    return {
      nr: a.nr,
      von: a.datum,
      bis: naechste ? naechste.datum : ende?.datum ?? w.date,
      zustimmungStart: Math.round((naechste ? a.zustimmung : a.zustimmung) * 10) / 10,
      zustimmungEnde: Math.round((naechste ? naechste.zustimmung : sp.umfrage.zustimmung) * 10) / 10,
      ziele,
    };
  });
  const z = zusagenBilanz(w);
  const wahlen = (sp.wahl?.historie ?? []).map((e) => {
    const r = e.runden[e.runden.length - 1]!;
    return {
      datum: e.datum,
      anteil: Math.round((r.anteile.amt ?? 0) * 10) / 10,
      stichwahl: e.runden.length > 1,
      gewonnen: e.gewonnen,
      marge: e.marge,
      lagerSitze: e.parlament.lagerSitzeNachher,
      lagerSitzeVorher: e.parlament.lagerSitzeVorher,
      letzte: !!e.letzteWahl,
    };
  });
  const bestand = sp.reich?.bestand ?? {};
  const wunder = Object.keys(bestand)
    .map((id) => VORHABEN.find((v) => v.id === id))
    .filter((v): v is NonNullable<typeof v> => !!v && v.klasse === "wunder")
    .map((v) => v.name)
    .slice(0, 8);
  const kat = katastrophenZustand(w);
  const hist = sp.verfassungsvorgang?.historie ?? [];
  const chronik = sp.chronik.filter((c) => !/^(Wirkungsbericht|Schritt erreicht|Programm erfüllt)/.test(c.titel) && !c.ausgang.startsWith("Keine Entscheidung"));
  const es = endenSicht(w);
  return {
    name: w.player?.name ?? "",
    von: sp.start.datum,
    bis: ende?.datum ?? w.date,
    tage: ende ? ende.tag : w.day,
    ende: ende ? { art: ende.art, titel: ende.titel, text: ende.text, datum: ende.datum, ...(ende.nachfolge ? { nachfolge: ende.nachfolge } : {}) } : null,
    kurve: sp.umfrage.verlauf,
    amtszeiten,
    wahlen,
    zusagen: { gehalten: z.gehalten, gebrochen: z.gebrochen, offen: z.offen, glaubwuerdigkeit: Math.round(z.glaubwuerdigkeit) },
    kriege: kriege(w).map((k) => ({ gegner: LAENDER.find((l) => l.id === k.land)?.name ?? k.land, wochen: k.woche, ausgang: k.ausgang ?? k.phase })),
    verfassung: {
      aenderungen: hist.filter((h) => h.ausgang.startsWith("Beschlossen")).flatMap((h) => h.artikel),
      gescheitert: hist.filter((h) => !h.ausgang.startsWith("Beschlossen")).length,
    },
    reich: { fertig: Object.keys(bestand).length, laufend: sp.reich?.laufend.length ?? 0, wunder },
    kabinett: {
      ehemalige: sp.ehemalige?.length ?? 0,
      amtierend: sp.figuren
        .filter((f) => f.imAmt && AEMTER[f.amt].regierungsamt)
        .map((f) => ({ name: f.name, rolle: f.rolle, loyalitaet: Math.round(f.loyalitaet) })),
    },
    katastrophen: { fall: kat.faelle.length, text: katastrophenBilanz(w) ?? "" },
    wendepunkte: chronik.slice(-6).map((c) => ({ datum: c.datum, titel: c.titel, ausgang: c.ausgang })),
    kennzahlen: erstelleBilanz(w, ende ? "ende" : "zwischen").kennzahlen,
    schluss: { putschRisiko: es.putsch.risiko, amtsenthebungStufe: es.amtsenthebung.stufe },
  };
}

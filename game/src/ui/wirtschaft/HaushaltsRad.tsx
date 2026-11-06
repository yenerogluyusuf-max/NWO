// Das Haushaltsrad: außen, wofür der Staat sein Geld ausgibt (nach Aufgaben), innen, woher es kommt (nach Steuern), und die
// Lücke als schraffiertes Stück „neue Schulden“. Ein Blick zeigt Größenordnung und Defizit; ein Klick auf ein Stück führt zu den
// Reglern. Wunsch des Projektinhabers am 5. November („Kreisdiagramm ist doch besser“, Vorbild Democracy 4).
// Farben: Erdpalette des Gestaltungssystems (bausteine/palette.ts, befund-H H-09) statt Tabellenfarben; die hellen Töne Ocker und Sand
// liegen unter 3:1 Kontrast, darum trägt jede Farbe in der Legende Namen und Betrag.

import type { World } from "../../sim/types";
import { staatsfinanzen } from "../../sim/staatsfinanzen";
import { POSTEN, POSTEN_NACH_ID, etatBip, rentenSicht, stufeVon, type PostenGruppe } from "../../sim/haushalt";
import { zinsausgabenJetzt } from "../../sim/wirtschaft";
import { PLAN_2026, STEUERN_2026 } from "../../data/haushaltsplan";
import { t, zahl } from "../../i18n";
import { Rad, type RadStueck as RadStueckBaustein } from "../bausteine/Rad";
import { DATEN_FARBEN } from "../bausteine/palette";

const FARBEN: readonly string[] = DATEN_FARBEN;
const UEBRIG = "#a39a8c";
// Einnahmen als eine Familie in Braun- und Ockertönen (eigene Größen, nicht dieselben Farben wie die Ausgaben)
const EINNAHME = ["#4a3424", "#7c5823", "#9a7240", "#b8935e", "#cdb48a"];

export interface RadStueck {
  id: string;
  name: string;
  mrd: number;
  farbe: string;
  /** Wohin ein Klick führt: Gruppe der Ausgaben oder die Einnahmen */
  ziel?: PostenGruppe | "steuern";
  schraffiert?: boolean;
}

const AUSGABE_GRUPPEN: PostenGruppe[] = ["renten", "soziales", "dienste", "sicherheit", "wirtschaft", "staat"];

/** Die Stücke beider Ringe aus dem Spielstand; nichts wird gebucht. */
export function radStuecke(world: World): { aussen: RadStueck[]; innen: RadStueck[]; ausgabenMrd: number; einnahmenMrd: number; kreditMrd: number; ueberhangMrd: number } {
  const fin = staatsfinanzen(world);
  const mrd = (bipProzent: number) => (bipProzent * fin.bip) / 100;
  const aussen: RadStueck[] = AUSGABE_GRUPPEN.map((g, i) => {
    const summe =
      g === "renten"
        ? mrd(rentenSicht(world).etat)
        : // Personal überschneidet sich mit den Fachressorts (data/haushaltsplan.ts): es steckt im Reststück, nicht in „Staat“
          POSTEN.filter((p) => p.gruppe === g && p.seite === "ausgabe" && p.id !== "personal").reduce((s, p) => s + mrd(etatBip(p, stufeVon(world, p.id)) ?? 0), 0);
    return { id: g, name: g === "staat" ? t("hd.rad.staat") : t(`haushalt.gruppe.${g}`), mrd: summe, farbe: FARBEN[i]!, ziel: g };
  });
  aussen.push({ id: "zinsen", name: t("hd.zinsen"), mrd: mrd(zinsausgabenJetzt(world)), farbe: FARBEN[6]! });
  const bekannt = aussen.reduce((s, x) => s + x.mrd, 0);
  // Was die Fachressorts nicht erklären: Gehälter des öffentlichen Dienstes, Reformkosten und weitere Ausgaben. Übersteigen die
  // geschätzten Ressortanteile die Ausgaben, wird das als Überhang gemeldet statt den Ring über 100 % zu füllen.
  const rest = fin.ausgabenMrd - bekannt;
  if (rest > 0) aussen.push({ id: "uebrig", name: t("hd.rad.uebrig"), mrd: rest, farbe: UEBRIG, ziel: "staat" });

  // Einnahmen: Zusammensetzung des Haushaltsgesetzes 2026, auf die heutigen Einnahmen gerechnet, dazu die beschlossenen Steueränderungen
  const steuerPosten = POSTEN.filter((p) => p.seite === "einnahme");
  const delta = (id: string) => mrd(stufeVon(world, id) * (POSTEN_NACH_ID[id]?.schritt ?? 0));
  const basis = fin.einnahmenMrd - steuerPosten.reduce((s, p) => s + delta(p.id), 0);
  const gesamt2026 = PLAN_2026.einnahmenGesamt;
  const anteil = (...ids: string[]) => STEUERN_2026.filter((x) => ids.includes(x.id)).reduce((s, x) => s + x.mrd, 0) / gesamt2026;
  const steuern2026 = STEUERN_2026.reduce((s, x) => s + x.mrd, 0) / gesamt2026;
  const est = anteil("est"), verbrauch = anteil("mwst", "oetv"), kst = anteil("kst");
  const innen: RadStueck[] = [
    { id: "einkommensteuer", name: POSTEN_NACH_ID.einkommensteuer!.name, mrd: basis * est + delta("einkommensteuer"), farbe: EINNAHME[0]!, ziel: "steuern" },
    { id: "verbrauchsteuern", name: POSTEN_NACH_ID.verbrauchsteuern!.name, mrd: basis * verbrauch + delta("verbrauchsteuern"), farbe: EINNAHME[1]!, ziel: "steuern" },
    { id: "unternehmensteuer", name: POSTEN_NACH_ID.unternehmensteuer!.name, mrd: basis * kst + delta("unternehmensteuer"), farbe: EINNAHME[2]!, ziel: "steuern" },
    { id: "uebrige_steuern", name: t("hd.rad.uebrigeSteuern"), mrd: basis * (steuern2026 - est - verbrauch - kst), farbe: EINNAHME[3]! },
    { id: "sonstige", name: t("hd.rad.sonstige"), mrd: basis * (1 - steuern2026), farbe: EINNAHME[4]! },
  ];
  if (fin.kreditMrd > 0) innen.push({ id: "kredit", name: t("hd.rad.kredit"), mrd: fin.kreditMrd, farbe: "#8c2b1f", schraffiert: true });
  return { aussen: aussen.filter((x) => x.mrd > 0), innen: innen.filter((x) => x.mrd > 0), ausgabenMrd: fin.ausgabenMrd, einnahmenMrd: fin.einnahmenMrd, kreditMrd: Math.max(0, fin.kreditMrd), ueberhangMrd: Math.max(0, -rest) };
}

export function HaushaltsRad({ world, defizit, onZiel }: { world: World; defizit: number; onZiel?: (ziel: PostenGruppe | "steuern") => void }) {
  const r = radStuecke(world);
  const bio = (x: number) => t("hd.bio", { n: zahl(x / 1000, 1) });
  const ziele = new Map([...r.aussen, ...r.innen].map((x) => [x.id, x.ziel]));
  const alsRad = (x: RadStueck): RadStueckBaustein => ({ id: x.id, name: x.name, wert: x.mrd, farbe: x.farbe, ...(x.schraffiert ? { schraffiert: true } : {}), ...(x.ziel ? { klickbar: true } : {}) });
  return (
    <Rad
      aussen={{ stuecke: r.aussen.map(alsRad), summe: Math.max(r.ausgabenMrd, r.aussen.reduce((s, x) => s + x.mrd, 0)), titel: t("hd.rad.wofuer"), gesamt: r.ausgabenMrd }}
      innen={{ stuecke: r.innen.map(alsRad), summe: Math.max(r.einnahmenMrd + r.kreditMrd, r.innen.reduce((s, x) => s + x.mrd, 0)), titel: t("hd.rad.woher"), gesamt: r.einnahmenMrd + r.kreditMrd }}
      wertText={bio}
      mitte={{ titel: defizit > 0 ? t("hd.defizit") : t("hd.ueberschuss"), wert: `${zahl(Math.abs(defizit), 1)} %`, klein: t("hd.desBip") }}
      aria={t("hd.rad.aria", { ausgaben: bio(r.ausgabenMrd), einnahmen: bio(r.einnahmenMrd), kredit: bio(r.kreditMrd) })}
      fuss={
        <>
          {t("hd.rad.lesart")}
          {r.ueberhangMrd > 0 && <span className="hr-ueberhang"> {t("hd.rad.ueberhang", { mrd: bio(r.ueberhangMrd) })}</span>}
        </>
      }
      {...(onZiel ? { onStueck: (id: string) => { const z = ziele.get(id); if (z) onZiel(z); } } : {})}
    />
  );
}

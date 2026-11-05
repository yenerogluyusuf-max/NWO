// Das Haushaltsrad: außen, wofür der Staat sein Geld ausgibt (nach Aufgaben), innen, woher es kommt (nach Steuern), und die
// Lücke als schraffiertes Stück „neue Schulden“. Ein Blick zeigt Größenordnung und Defizit; ein Klick auf ein Stück führt zu den
// Reglern. Wunsch des Projektinhabers am 5. November („Kreisdiagramm ist doch besser“, Vorbild Democracy 4).
// Farben: geprüft mit dem Palettenprüfer (Lichtband, Buntheit, Farbsehschwäche, Abstand); die hellen Töne Gold und Terrakotta
// liegen unter 3:1 Kontrast, darum trägt jede Farbe in der Legende Namen und Betrag.

import { useId, useState } from "react";
import type { World } from "../../sim/types";
import { staatsfinanzen } from "../../sim/staatsfinanzen";
import { POSTEN, POSTEN_NACH_ID, etatBip, rentenSicht, stufeVon, type PostenGruppe } from "../../sim/haushalt";
import { zinsausgabenJetzt } from "../../sim/wirtschaft";
import { PLAN_2026, STEUERN_2026 } from "../../data/haushaltsplan";
import { t, zahl } from "../../i18n";

const FARBEN = ["#b23a26", "#00938f", "#d4a02a", "#6e55a8", "#e07b3c", "#2f6fb5", "#5f9b3a"];
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
export function radStuecke(world: World): { aussen: RadStueck[]; innen: RadStueck[]; ausgabenMrd: number; einnahmenMrd: number; kreditMrd: number } {
  const fin = staatsfinanzen(world);
  const mrd = (bipProzent: number) => (bipProzent * fin.bip) / 100;
  const aussen: RadStueck[] = AUSGABE_GRUPPEN.map((g, i) => {
    const summe =
      g === "renten"
        ? mrd(rentenSicht(world).etat)
        : POSTEN.filter((p) => p.gruppe === g && p.seite === "ausgabe").reduce((s, p) => s + mrd(etatBip(p, stufeVon(world, p.id)) ?? 0), 0);
    return { id: g, name: t(`haushalt.gruppe.${g}`), mrd: summe, farbe: FARBEN[i]!, ziel: g };
  });
  aussen.push({ id: "zinsen", name: t("hd.zinsen"), mrd: mrd(zinsausgabenJetzt(world)), farbe: FARBEN[6]! });
  const bekannt = aussen.reduce((s, x) => s + x.mrd, 0);
  if (fin.ausgabenMrd - bekannt > 0) aussen.push({ id: "uebrig", name: t("hd.rad.uebrig"), mrd: fin.ausgabenMrd - bekannt, farbe: UEBRIG });

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
  return { aussen: aussen.filter((x) => x.mrd > 0), innen: innen.filter((x) => x.mrd > 0), ausgabenMrd: fin.ausgabenMrd, einnahmenMrd: fin.einnahmenMrd, kreditMrd: Math.max(0, fin.kreditMrd) };
}

/** Bogenstück eines Rings von Winkel a bis b (Bogenmaß, 0 oben, im Uhrzeigersinn). */
function bogen(cx: number, cy: number, r0: number, r1: number, a: number, b: number): string {
  const p = (r: number, w: number) => `${(cx + r * Math.sin(w)).toFixed(2)} ${(cy - r * Math.cos(w)).toFixed(2)}`;
  const gross = b - a > Math.PI ? 1 : 0;
  return `M ${p(r1, a)} A ${r1} ${r1} 0 ${gross} 1 ${p(r1, b)} L ${p(r0, b)} A ${r0} ${r0} 0 ${gross} 0 ${p(r0, a)} Z`;
}

export function HaushaltsRad({ world, defizit, onZiel }: { world: World; defizit: number; onZiel?: (ziel: PostenGruppe | "steuern") => void }) {
  const id = useId().replace(/:/g, "");
  const r = radStuecke(world);
  const [hover, setHover] = useState<string | null>(null);
  const bio = (x: number) => t("hd.bio", { n: zahl(x / 1000, 1) });
  const prozent = (x: number, von: number) => `${zahl((x / von) * 100, 0)} %`;
  const ring = (stuecke: RadStueck[], r0: number, r1: number, summe: number) => {
    let a = 0;
    const luecke = 0.012; // 2 px Abstand zwischen den Stücken
    return stuecke.map((s) => {
      const b = a + (s.mrd / summe) * Math.PI * 2;
      const pfad = bogen(130, 130, r0, r1, a + luecke / 2, Math.max(a + luecke / 2 + 0.001, b - luecke / 2));
      a = b;
      const aktiv = hover === s.id;
      return (
        <path
          key={s.id}
          d={pfad}
          fill={s.schraffiert ? `url(#${id}-schraffur)` : s.farbe}
          stroke={s.schraffiert ? s.farbe : "none"}
          strokeWidth={s.schraffiert ? 1.5 : 0}
          opacity={hover && !aktiv ? 0.45 : 1}
          className={s.ziel && onZiel ? "hr-klickbar" : undefined}
          onMouseEnter={() => setHover(s.id)}
          onMouseLeave={() => setHover(null)}
          onClick={() => s.ziel && onZiel?.(s.ziel)}
        >
          <title>{`${s.name}: ${bio(s.mrd)} (${prozent(s.mrd, summe)})`}</title>
        </path>
      );
    });
  };
  const summeAussen = Math.max(r.ausgabenMrd, r.aussen.reduce((s, x) => s + x.mrd, 0));
  const summeInnen = Math.max(r.einnahmenMrd + r.kreditMrd, r.innen.reduce((s, x) => s + x.mrd, 0));
  const legende = (stuecke: RadStueck[], summe: number, titel: string, gesamt: number) => (
    <section className="hr-legende" aria-label={titel}>
      <h3>
        {titel} <b>{bio(gesamt)}</b>
      </h3>
      <ul>
        {stuecke.map((s) => (
          <li key={s.id} className={hover === s.id ? "on" : undefined} onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)}>
            <button type="button" disabled={!s.ziel || !onZiel} onClick={() => s.ziel && onZiel?.(s.ziel)}>
              <i aria-hidden className={s.schraffiert ? "schraffiert" : undefined} style={{ background: s.schraffiert ? undefined : s.farbe }} />
              <span>{s.name}</span>
              <span className="hr-wert">{bio(s.mrd)}</span>
              <span className="hr-anteil">{prozent(s.mrd, summe)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
  const aktiv = [...r.aussen, ...r.innen].find((s) => s.id === hover);
  return (
    <div className="hr">
      {legende(r.aussen, summeAussen, t("hd.rad.wofuer"), r.ausgabenMrd)}
      <figure className="hr-figur">
        <svg viewBox="0 0 260 260" role="img" aria-label={t("hd.rad.aria", { ausgaben: bio(r.ausgabenMrd), einnahmen: bio(r.einnahmenMrd), kredit: bio(r.kreditMrd) })}>
          <defs>
            <pattern id={`${id}-schraffur`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#f6e3d6" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#8c2b1f" strokeWidth="2.4" />
            </pattern>
          </defs>
          {ring(r.aussen, 92, 126, summeAussen)}
          {ring(r.innen, 62, 86, summeInnen)}
          <text x="130" y="122" textAnchor="middle" className="hr-mitte-titel">
            {aktiv ? aktiv.name.length > 18 ? `${aktiv.name.slice(0, 17)}…` : aktiv.name : defizit > 0 ? t("hd.defizit") : t("hd.ueberschuss")}
          </text>
          <text x="130" y="146" textAnchor="middle" className="hr-mitte-wert">
            {aktiv ? bio(aktiv.mrd) : `${zahl(Math.abs(defizit), 1)} %`}
          </text>
          <text x="130" y="163" textAnchor="middle" className="hr-mitte-klein">
            {aktiv ? "" : t("hd.desBip")}
          </text>
        </svg>
        <figcaption>{t("hd.rad.lesart")}</figcaption>
      </figure>
      {legende(r.innen, summeInnen, t("hd.rad.woher"), r.einnahmenMrd + r.kreditMrd)}
    </div>
  );
}

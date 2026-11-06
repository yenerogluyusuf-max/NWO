// Lage der Regionen (Befund F-12, Nacht N6): Die Seite zeigt jetzt Regionen. Oben eine Karte der Provinzen, gefärbt nach der gewählten Ebene
// (Netze, Erbe, Erdbebenrisiko, Baustellen), daneben die fünf Provinzen mit dem größten Handlungsbedarf mit Sprung zur zuständigen Stelle,
// darunter die sieben Regionen in einer Zeile je Region. Nur Werte, die wirklich je Provinz verschieden sind: Auslastung der Netze
// (sim/infrastruktur.ts), Zustand der Stätten (data/erbe.ts), Erdbebenrisiko 1–5 (data/katastrophe_risiko.json, AFAD-basiert, Recherche
// Provinzdaten) und die Orte der Baustellen. Vorher wiederholte die Seite die Bildkarten der neuen Vorhaben und die Bauliste.

import { useMemo, useState } from "react";
import type { World } from "../../sim/types";
import { netzSichten, auslastung } from "../../sim/infrastruktur";
import { SCHWELLE } from "../../data/infrastruktur-netze";
import { ERBE } from "../../data/erbe";
import { PROVINZEN, REGION_DE } from "../../sim/regional";
import { reichZustand, vorhabenDef } from "../../sim/reich";
import RISIKO from "../../data/katastrophe_risiko.json";
import { PROV, BREITE, HOEHE } from "../atlas/Karte2D";
import { t, zahl } from "../../i18n";
import { datenText } from "../../i18n/daten";
import "./regionen.css";

type Ebene = "netze" | "erbe" | "risiko" | "bau";
const EBENEN: Ebene[] = ["netze", "erbe", "risiko", "bau"];
/** Wohin der Sprung je Ebene führt (Zugänge der Akte Land, ui/Stage.tsx) */
const ZIEL: Record<Ebene, string> = { netze: "netze", erbe: "reich_kultur", risiko: "katastrophe", bau: "reich_infra" };

interface ProvinzWert {
  plaka: number;
  /** 0 (gut) bis 1 (schlecht), für die Farbe */
  not: number;
  text: string;
}

const risikoVon = (plaka: number): number => (RISIKO as { provinzen: Record<string, { deprem?: number }> }).provinzen[String(plaka)]?.deprem ?? 0;

function werte(w: World, ebene: Ebene): Map<number, ProvinzWert> {
  const out = new Map<number, ProvinzWert>();
  if (ebene === "netze") {
    const netze = netzSichten(w).filter((n) => !n.land);
    for (let p = 1; p <= PROVINZEN.length; p++) {
      let schlimm: { a: number; name: string } | null = null;
      for (const n of netze) {
        const a = auslastung(w, n.id, p);
        if (a !== null && (!schlimm || a > schlimm.a)) schlimm = { a, name: n.name };
      }
      if (schlimm) out.set(p, { plaka: p, not: Math.max(0, Math.min(1, (schlimm.a - 0.6) / (SCHWELLE.ueberlast + 0.15 - 0.6))), text: t("n6.rl.netz", { netz: schlimm.name, a: Math.round(schlimm.a * 100) }) });
    }
  } else if (ebene === "erbe") {
    const z = reichZustand(w);
    // Je Provinz die am schlechtesten erhaltene Stätte
    const schlechteste = new Map<number, { name: string; z: number }>();
    for (const e of ERBE) {
      const zz = z.staetten[e.id]?.zustand ?? 100;
      const alt = schlechteste.get(e.plaka);
      if (!alt || zz < alt.z) schlechteste.set(e.plaka, { name: e.name, z: zz });
    }
    for (const [p, x] of schlechteste) out.set(p, { plaka: p, not: Math.max(0, Math.min(1, (70 - x.z) / 55)), text: t("n6.rl.erbe", { name: x.name, z: Math.round(x.z) }) });
  } else if (ebene === "risiko") {
    const offen = new Set((w.spiel?.katastrophen?.faelle ?? []).filter((f) => !f.bewaeltigt).flatMap((f) => f.provinzen));
    for (let p = 1; p <= PROVINZEN.length; p++) {
      const r = risikoVon(p);
      if (!r && !offen.has(p)) continue;
      out.set(p, { plaka: p, not: offen.has(p) ? 1 : Math.max(0, (r - 1) / 4), text: offen.has(p) ? t("n6.rl.fall") : t("n6.rl.risiko", { r }) });
    }
  } else {
    const z = reichZustand(w);
    const zahlJe = new Map<number, string[]>();
    for (const l of z.laufend) {
      const v = vorhabenDef(l.id);
      if (!v) continue;
      const orte = v.ort ? [v.ort.plaka] : v.provinzen ?? [];
      if (orte.length > 20) continue;
      for (const p of orte) zahlJe.set(p, [...(zahlJe.get(p) ?? []), v.name]);
    }
    for (const [p, namen] of zahlJe) out.set(p, { plaka: p, not: Math.min(1, 0.35 + namen.length * 0.25), text: namen.slice(0, 2).join(", ") + (namen.length > 2 ? ` +${namen.length - 2}` : "") });
  }
  return out;
}

/** Farbe vom Pergament (gut) über Ocker zum Siegelrot (schlecht); bei Baustellen Messing statt Rot. */
function farbe(not: number, ebene: Ebene): string {
  const stufen = ebene === "bau" ? ["#efe2c0", "#d9b56a", "#a07e3c"] : ["#e8dcc0", "#d9a25e", "#a8402f"];
  const [a, b, c] = stufen.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))) as [number[], number[], number[]];
  const mix = (x: number[], y: number[], k: number) => x.map((v, i) => Math.round(v + (y[i]! - v) * k));
  const rgb = not < 0.5 ? mix(a, b, not * 2) : mix(b, c, (not - 0.5) * 2);
  return `rgb(${rgb.join(",")})`;
}

export function RegionenLage({ w, springe }: { w: World; springe?: ((tab: string) => void) | undefined }) {
  const [ebene, setEbene] = useState<Ebene>("netze");
  const [plaka, setPlaka] = useState<number | null>(null);
  const daten = useMemo(() => werte(w, ebene), [w, ebene, w.day]);
  const rang = [...daten.values()].sort((a, b) => b.not - a.not || a.plaka - b.plaka).slice(0, 5);
  const regionen = useMemo(() => {
    const netze = werte(w, "netze"), erbe = werte(w, "erbe"), bau = werte(w, "bau");
    return Object.keys(REGION_DE).map((r) => {
      const prov = PROVINZEN.filter((p) => p.region === r);
      const bev = prov.reduce((s, p) => s + p.bevoelkerung, 0);
      const ges = PROVINZEN.reduce((s, p) => s + p.bevoelkerung, 0);
      const ueber = prov.filter((p) => (netze.get(p.plaka)?.not ?? 0) >= 0.73).length;
      const gefaehrdet = prov.filter((p) => (erbe.get(p.plaka)?.not ?? 0) >= 0.45).length;
      const risiko = prov.reduce((s, p) => s + risikoVon(p.plaka) * p.bevoelkerung, 0) / Math.max(1, bev);
      return { id: r, name: datenText("region", r, REGION_DE[r]!), anteil: bev / ges, ueber, gefaehrdet, risiko, bau: prov.filter((p) => bau.has(p.plaka)).length, n: prov.length };
    });
  }, [w, w.day]);
  const gewaehlt = plaka !== null ? daten.get(plaka) : undefined;
  return (
    <section className="rl" aria-label={t("n6.rl.titel")}>
      <div className="rl-oben">
        <div className="rl-karte-feld">
          <div className="rr-filter rl-ebenen" role="group" aria-label={t("n6.rl.ebene")}>
            {EBENEN.map((e) => (
              <button key={e} type="button" className={ebene === e ? "on" : ""} aria-pressed={ebene === e} onClick={() => { setEbene(e); setPlaka(null); }}>
                {t(`n6.rl.ebene.${e}`)}
              </button>
            ))}
          </div>
          <svg className="rl-karte" viewBox={`-10 -10 ${BREITE + 20} ${HOEHE + 20}`} role="img" aria-label={t("n6.rl.karteAria", { ebene: t(`n6.rl.ebene.${ebene}`) })}>
            {PROV.map((p) => {
              const d = daten.get(p.plaka);
              return (
                <path key={p.plaka} d={p.d} className={`${d ? "" : "ohne"}${p.plaka === plaka ? " gewaehlt" : ""}`} style={d ? { fill: farbe(d.not, ebene) } : undefined} onClick={() => setPlaka(p.plaka)}>
                  <title>{d ? `${p.name}: ${d.text}` : p.name}</title>
                </path>
              );
            })}
          </svg>
          <p className="rl-legende">{gewaehlt ? `${PROVINZEN[gewaehlt.plaka - 1]?.name}: ${gewaehlt.text}` : t(`n6.rl.legende.${ebene}`)}</p>
        </div>
        <aside className="rl-bedarf">
          <h4>{t("n6.rl.bedarf")}</h4>
          {rang.length === 0 ? (
            <p className="rr-hinweis">{t(`n6.rl.leer.${ebene}`)}</p>
          ) : (
            <ol>
              {rang.map((x, i) => (
                <li key={x.plaka} className={x.plaka === plaka ? "on" : ""}>
                  <button type="button" onClick={() => setPlaka(x.plaka)}>
                    <span className="rl-nr" style={{ background: farbe(x.not, ebene) }}>{i + 1}</span>
                    <span className="rl-name">{PROVINZEN[x.plaka - 1]?.name}</span>
                    <span className="rl-wert">{x.text}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
          {springe && <button type="button" className="aktion-knopf rl-sprung" onClick={() => springe(ZIEL[ebene])}>{t(`n6.rl.sprung.${ebene}`)}</button>}
        </aside>
      </div>
      <table className="rl-regionen">
        <thead>
          <tr>
            <th>{t("n6.rl.region")}</th>
            <th>{t("n6.rl.bevoelkerung")}</th>
            <th>{t("n6.rl.ueberlast")}</th>
            <th>{t("n6.rl.gefaehrdet")}</th>
            <th>{t("n6.rl.risikoKopf")}</th>
            <th>{t("n6.rl.baustellen")}</th>
          </tr>
        </thead>
        <tbody>
          {regionen.map((r) => (
            <tr key={r.id}>
              <th>{r.name}</th>
              <td>{zahl(Math.round(r.anteil * 100))} %</td>
              <td className={r.ueber > 0 ? "schlecht" : ""}>{r.ueber} / {r.n}</td>
              <td className={r.gefaehrdet > 0 ? "schlecht" : ""}>{r.gefaehrdet}</td>
              <td>{zahl(r.risiko, 1)}</td>
              <td>{r.bau}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

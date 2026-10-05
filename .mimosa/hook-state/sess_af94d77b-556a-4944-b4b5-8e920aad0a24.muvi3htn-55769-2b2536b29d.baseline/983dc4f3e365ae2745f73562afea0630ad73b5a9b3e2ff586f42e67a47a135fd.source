// Das Band der Stationen: acht benannte Stationen mit Symbol statt acht gleicher Striche. Die aktuelle hebt sich ab,
// erledigte tragen Messing, vom Szenario festgelegte sind gestrichelt. Die Namen stehen im Katalog (`prolog.band.<station>`).

import type { ReactNode } from "react";
import { t } from "../../i18n";

const ICON: Record<string, ReactNode> = {
  // Herkunft: Haus mit Schornstein
  kindheit: (
    <>
      <path d="M4 20V11l8-6 8 6v9z" />
      <path d="M10 20v-6h4v6" />
      <path d="M16 7V4h2v5" />
    </>
  ),
  // Jugend: beschriebenes Blatt
  jugend: (
    <>
      <path d="M5 4h10l4 4v12H5z" />
      <path d="M15 4v4h4" />
      <path d="M8 12h8M8 15h6M8 18h4" />
    </>
  ),
  // Beruf: Aktentasche
  beruf: (
    <>
      <path d="M4 8h16v11H4z" />
      <path d="M9 8V5.500h6V8" />
      <path d="M4 13h16" />
      <path d="M11 13v2h2v-2" />
    </>
  ),
  // Partner: Herz
  liebe: <path d="M12 20C6 16 4 13 4 10a4 4 0 018-1.500A4 4 0 0120 10c0 3-2 6-8 10z" />,
  // Weg in die Politik: Wegweiser
  politik: (
    <>
      <path d="M12 3v18" />
      <path d="M6 5.500h10l2 2.500-2 2.500H6z" />
      <path d="M18 12.500H8l-2 2.500 2 2.500h10z" />
    </>
  ),
  // Partei: Fahne
  partei: (
    <>
      <path d="M6 21V4" />
      <path d="M6 5h12l-2.500 4L18 13H6" />
    </>
  ),
  // Wahlkampf: Megaphon
  wahlkampf: (
    <>
      <path d="M4 10v4h3l7 4V6l-7 4z" />
      <path d="M17 9c1.500 1.200 1.500 4.800 0 6" />
      <path d="M19.500 7c2.500 2.200 2.500 7.800 0 10" />
    </>
  ),
  // Wahlnacht: Mond und Stern
  wahlnacht: (
    <>
      <path d="M17 15a7 7 0 11-7.500-10 6 6 0 007.500 10z" />
      <path d="M18 3.500l.9 1.900 1.900.9-1.900.9-.9 1.900-.9-1.900-1.900-.9 1.900-.9z" />
    </>
  ),
};

export interface FortschrittProps {
  /** Kennungen der Stationen in der Reihenfolge des Prologs */
  stationen: string[];
  /** Aktuelle Station (−1 oder kleiner: noch vor der ersten) */
  schritt: number;
  /** Stationen, die das Szenario festgelegt hat */
  festgelegt?: boolean[];
}

export function Fortschritt({ stationen, schritt, festgelegt = [] }: FortschrittProps) {
  return (
    <ol className="band" aria-label={t("prolog.band.titel")}>
      {stationen.map((id, i) => {
        const art = festgelegt[i] ? "fest" : i < schritt ? "fertig" : i === schritt ? "jetzt" : "offen";
        const name = t(`prolog.band.${id}`);
        return (
          <li key={id} className={`b-item ${art}`} aria-current={i === schritt ? "step" : undefined} title={festgelegt[i] ? `${name} · ${t("prolog.band.festgelegt")}` : name}>
            <span className="b-marke">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
                {ICON[id]}
              </svg>
            </span>
            <span className="b-name">{name}</span>
          </li>
        );
      })}
    </ol>
  );
}

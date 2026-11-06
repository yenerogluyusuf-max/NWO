// Welche Ministerien gehen an die Partnerpartei? (Befund C-6) Vorher gab „Einlösen“ still die ersten zwei Ressorts einer festen Liste ab
// und entließ dabei zwei Minister, ohne dass es irgendwo stand. Jetzt wählt der Präsident; je Platz steht, wer geht und wer kommt.

import { useState } from "react";
import type { World } from "../../sim/types";
import type { Figur, Zusage } from "../../sim/spiel-typen";
import { kabinettStatus } from "../../sim/kabinett";
import { PARTNER_MINISTER, waehlbareRessorts } from "../../sim/ressortvergabe";
import { loeseEin, ZUSAGE_EINLOESEN_PK, type ZusageAntwort } from "../../sim/zusagen";
import { kannZahlen } from "../../sim/kapital";
import { PARTEI_NAME } from "../../sim/fraktionen";
import { liste, t } from "../../i18n";
import { Portraet } from "./bausteine";

export function MinisterienWahl({ world, z, onFertig }: { world: World; z: Zusage; onFertig: (r?: ZusageAntwort) => void }) {
  const [wahl, setWahl] = useState<Figur["amt"][]>([]);
  const offen = waehlbareRessorts(world, z.von);
  const noetig = Math.min(2, offen.length);
  const status = kabinettStatus(world);
  const partei = PARTEI_NAME[z.von] ?? z.von;
  const figuren = world.spiel!.figuren;
  const kapital = world.spiel!.kapital;
  const umschalten = (a: Figur["amt"]) => setWahl((x) => (x.includes(a) ? x.filter((y) => y !== a) : x.length >= noetig ? [...x.slice(1), a] : [...x, a]));
  const gehen = wahl.map((a) => status.minister.find((m) => m.amt === a)).filter((m): m is NonNullable<typeof m> => !!m);
  const fertig = wahl.length === noetig;
  const bezahlbar = kannZahlen(kapital, ZUSAGE_EINLOESEN_PK);

  return (
    <section className="pe-mwahl" aria-label={t("n1.mwahl.titel", { partei, n: noetig })}>
      <h4>{t("n1.mwahl.titel", { partei, n: noetig })}</h4>
      <p className="pe-mwahl-text">{t("n1.mwahl.text", { partei, loy: PARTNER_MINISTER.loyalitaet, fae: PARTNER_MINISTER.faehigkeit })}</p>
      <div className="pe-mwahl-plaetze" role="group">
        {offen.map((a) => {
          const m = status.minister.find((x) => x.amt === a);
          const f = figuren.find((x) => x.amt === a && x.imAmt);
          if (!m || !f) return null;
          const an = wahl.includes(a);
          return (
            <button key={a} type="button" className={`pe-mwahl-platz${an ? " on" : ""}`} aria-pressed={an} onClick={() => umschalten(a)}>
              <Portraet w={world} f={f} size={40} />
              <span className="pe-mwahl-name">
                <strong>{m.ressort}</strong>
                <em>{m.name}</em>
                <small>{t("n1.mwahl.werte", { fae: m.faehigkeit, loy: Math.round(m.loyalitaet) })}</small>
              </span>
              {an && <i className="pe-mwahl-marke">{t("n1.mwahl.geht")}</i>}
            </button>
          );
        })}
      </div>
      <p className={`pe-mwahl-folge${fertig ? "" : " leer"}`} role="status">
        {fertig
          ? t("n1.mwahl.folge", { gehen: liste(gehen.map((m) => `${m.name} (${m.ressort})`)), partei, n: noetig })
          : t("n1.mwahl.nochWaehlen", { n: noetig - wahl.length })}
      </p>
      <div className="pe-wege">
        <button className="pe-aktion haupt" disabled={!fertig || !bezahlbar} onClick={() => onFertig(loeseEin(world, z, wahl))} title={bezahlbar ? undefined : t("n1.mwahl.kapital")}>
          {t("n1.mwahl.einloesen")} <b>{ZUSAGE_EINLOESEN_PK}</b>
        </button>
        <button className="pe-aktion leise" onClick={() => onFertig()}>
          {t("ui.personen.NachfolgeAuswahl.07af7cb")}
        </button>
      </div>
    </section>
  );
}

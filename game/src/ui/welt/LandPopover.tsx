// Ein Land auf der Karte angetippt: kleine Karte mit Flagge, Haltung, Anliegen und den Wegen zum Verhandlungstisch und zur Länderakte.

import { useEffect, useRef } from "react";
import type { World } from "../../sim/types";
import { anliegenStand, dimensionZu, haltungWort, land, weltZustand } from "../../sim/laender";
import { initiativeGegen } from "../../sim/initiative";
import { laufende } from "../../sim/abkommen";
import { ISO_ZU_LAND, LAENDERNAMEN } from "../ebenen";
import { Flagge } from "../art/Flaggen";
import { WEITERE_NACH_ID } from "../../data/welt-weitere";
import { beziehungZurTuerkei } from "../../sim/welt-modell";
import { haltungWortAlle, wahlSicht } from "../../sim/welt-sicht";

import { t } from "../../i18n";
export type WeltTab = "ueberblick" | "verhandeln" | "vertraege" | "handeln" | "konflikt" | "beitritt";

export interface LandAuswahl {
  iso: string;
  x: number;
  y: number;
}

/** Länder ohne eigenen Gesprächspartner, bei denen ein Satz mehr sagt als der allgemeine Hinweis. */
const SONDERTEXTE: Record<string, string> = {
  CYN: "Die Türkische Republik Nordzypern wird nur von der Türkei anerkannt. Die Zypernfrage verhandelt Ankara mit der Republik Zypern und, über die EU, mit Brüssel.",
  PSX: "Die Palästinensischen Gebiete sind kein eigener Verhandlungspartner im Spiel; Ankaras Haltung zu Gaza läuft über Israel, Ägypten und die Golfstaaten.",
  KOS: "Kosovo erkennt die Türkei an; im Spiel gibt es dazu keinen eigenen Verhandlungstisch.",
};

export function LandPopover({ auswahl, world, onClose, onOeffne }: { auswahl: LandAuswahl; world: World; onClose: () => void; onOeffne: (landId: string, tab: WeltTab) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const taste = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", taste);
    ref.current?.focus();
    return () => window.removeEventListener("keydown", taste);
  }, [onClose]);

  const landId = ISO_ZU_LAND[auswahl.iso];
  const breite = 296;
  const links = Math.max(8, Math.min(auswahl.x + 14, window.innerWidth - breite - 8));
  const oben = Math.max(56, Math.min(auswahl.y - 24, window.innerHeight - 330));
  const name = LAENDERNAMEN[auswahl.iso] ?? auswahl.iso;
  const sondertext = SONDERTEXTE[auswahl.iso];

  // Weitere Staaten (EU-Mitglieder, BRICS, Golf …) haben eine eigene Karte im Weltmodell
  const weiterer = WEITERE_NACH_ID.get(auswahl.iso);
  if (weiterer && world.spiel) {
    const b = beziehungZurTuerkei(world, weiterer.id);
    const wahl = wahlSicht(world, weiterer.id);
    return (
      <div className="we-pop" ref={ref} tabIndex={-1} style={{ left: links, top: oben, width: breite }} role="dialog" aria-label={weiterer.name}>
        <button type="button" className="we-pop-zu" onClick={onClose} aria-label={t("ui.welt.LandPopover.44424b1")}>
          ×
        </button>
        <div className="we-pop-kopf">
          <Flagge id={weiterer.id} breite={44} titel={weiterer.name} />
          <div>
            <strong>{weiterer.name}</strong>
            <span className={`we-ton ton-${b.vertrauen >= 55 ? "gut" : b.vertrauen >= 35 ? "mittel" : "schlecht"}`}>
              {haltungWortAlle(world, weiterer.id)}
              {b.konflikt >= 65 ? " · Streit" : ""}
            </span>
          </div>
        </div>
        <div className="we-pop-werte">
          {(["handel", "sicherheit", "vertrauen", "konflikt"] as const).map((d) => (
            <div key={d} className={`we-pop-wert dim-${d}`}>
              <span>{{ handel: "Handel", sicherheit: "Sicherheit", vertrauen: "Vertrauen", konflikt: "Konflikt" }[d]}</span>
              <span className="we-balken" aria-hidden>
                <i style={{ width: `${b[d]}%` }} />
              </span>
              <b>{Math.round(b[d])}</b>
            </div>
          ))}
        </div>
        {wahl && (
          <p className="we-pop-text">
            {wahl.art} am {wahl.datumDe}.
          </p>
        )}
        <div className="we-pop-knoepfe">
          <button type="button" className="brass-button" onClick={() => onOeffne(weiterer.id, "ueberblick")}>
            {t("ui.welt.LandPopover.d0f9bf7")}
          </button>
          <button type="button" className="aktion-knopf" onClick={() => onOeffne(weiterer.id, "handeln")}>
            Gesten
          </button>
        </div>
      </div>
    );
  }

  if (!landId || !world.spiel) {
    return (
      <div className="we-pop" ref={ref} tabIndex={-1} style={{ left: links, top: oben, width: breite }} role="dialog" aria-label={name}>
        <button type="button" className="we-pop-zu" onClick={onClose} aria-label={t("ui.welt.LandPopover.44424b1")}>
          ×
        </button>
        <div className="we-pop-kopf">
          <Flagge id={auswahl.iso} breite={44} titel={name} />
          <div>
            <strong>{name}</strong>
            <span>{t("ui.welt.LandPopover.f901420")}</span>
          </div>
        </div>
        <p className="we-pop-text">{sondertext ?? `${name} spielt in dieser Amtszeit keine eigene Rolle am Verhandlungstisch; seine Lage wirkt über Handel und Region auf die Nachbarn.`}</p>
      </div>
    );
  }
  const l = land(landId);
  const z = weltZustand(world)[landId]!;
  const vertrauen = dimensionZu(world, landId, "vertrauen");
  const stand = anliegenStand(world, landId);
  const mitglied = auswahl.iso !== landId;
  const laeuft = laufende(world, landId).length;
  const initiative = initiativeGegen(world, landId);
  return (
    <div className="we-pop" ref={ref} tabIndex={-1} style={{ left: links, top: oben, width: breite }} role="dialog" aria-label={name}>
      <button type="button" className="we-pop-zu" onClick={onClose} aria-label={t("ui.welt.LandPopover.44424b1")}>
        ×
      </button>
      <div className="we-pop-kopf">
        <Flagge id={landId} breite={44} titel={l.name} />
        <div>
          <strong>{mitglied ? name : l.name}</strong>
          <span className={`we-ton ton-${vertrauen >= 55 ? "gut" : vertrauen >= 35 ? "mittel" : "schlecht"}`}>
            {haltungWort(world, landId)}
            {z.konflikt >= 65 ? " · Streit" : ""}
          </span>
        </div>
      </div>
      {mitglied && <p className="we-pop-text">{name} gehört zur Europäischen Union; Verhandlungen führt Ankara mit der Union.</p>}
      {initiative && (
        <p className="we-pop-initiative" role="status">
          {initiative.titel} — eine Entscheidung wartet.
        </p>
      )}
      <div className="we-pop-werte">
        {(["handel", "sicherheit", "vertrauen", "konflikt"] as const).map((d) => (
          <div key={d} className={`we-pop-wert dim-${d}`}>
            <span>{{ handel: "Handel", sicherheit: "Sicherheit", vertrauen: "Vertrauen", konflikt: "Konflikt" }[d]}</span>
            <span className="we-balken" aria-hidden>
              <i style={{ width: `${dimensionZu(world, landId, d)}%` }} />
            </span>
            <b>{Math.round(dimensionZu(world, landId, d))}</b>
          </div>
        ))}
      </div>
      <ul className="we-pop-anliegen">
        {stand.slice(0, 2).map((s) => (
          <li key={s.anliegen.id} className={s.erfuellt ? "we-gut" : ""}>
            <span aria-hidden>{s.erfuellt ? "✓" : "○"}</span> {s.anliegen.titel}
          </li>
        ))}
      </ul>
      {laeuft > 0 && <p className="we-pop-text">{laeuft} laufende{laeuft === 1 ? "r Vertrag" : " Verträge"}.</p>}
      <div className="we-pop-knoepfe">
        <button type="button" className="brass-button" onClick={() => onOeffne(landId, "verhandeln")}>
          Verhandeln
        </button>
        <button type="button" className="aktion-knopf" onClick={() => onOeffne(landId, "ueberblick")}>
          {t("ui.welt.LandPopover.d0f9bf7")}
        </button>
      </div>
    </div>
  );
}

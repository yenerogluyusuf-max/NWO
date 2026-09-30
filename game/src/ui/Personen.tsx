// Personen und Zusagen: Wer um den Präsidenten steht (Profil, Sorgen, Ressort, Gespräche, Wechsel im Amt) und was versprochen wurde.
// Die Regeln stehen in sim/personen.ts, gespraeche.ts, nachfolge.ts und zusagen.ts; hier nur die Ansicht.

import { useState } from "react";
import type { World } from "../sim/types";
import { zusagenBilanz, zusagenSicht } from "../sim/zusagen";
import { termineInfo } from "../sim/gespraeche";
import { AEMTER, eigenVon } from "../sim/personen";
import { Umfeld } from "./personen/Umfeld";
import { ZusagenAnsicht } from "./personen/ZusagenAnsicht";
import "./personen/personen.css";

export function Personen({ world, refresh, onMassnahme }: { world: World; refresh?: () => void; onMassnahme?: (id: string, richtung: 1 | -1) => void }) {
  const spiel = world.spiel;
  const [tab, setTab] = useState<"umfeld" | "zusagen">("umfeld");
  if (!spiel) return <p>In dieser Partie gibt es kein Umfeld.</p>;
  const neu = () => refresh?.();
  const bilanz = zusagenBilanz(world);
  const offen = zusagenSicht(world);
  const dringend = offen.filter((z) => z.dringlichkeit === "dringend" || z.dringlichkeit === "ueberfaellig").length;
  const termine = termineInfo(world);
  const regierung = spiel.figuren.filter((f) => f.imAmt && AEMTER[f.amt].regierungsamt);
  const auftraege = regierung.filter((f) => eigenVon(world, f).auftrag?.status === "laeuft").length;
  const gefahr = spiel.figuren.filter((f) => f.imAmt && f.amt !== "opposition" && f.loyalitaet < 25).length;
  return (
    <div className="pe">
      <div className="pe-kopf">
        <div className={`pe-chip${termine.belegt >= termine.max ? " warn" : ""}`}>
          <b>Termine (30 Tage)</b>
          <span>
            {termine.belegt} von {termine.max}
          </span>
          <em>Ihre Zeit ist knapp</em>
        </div>
        <div className={`pe-chip${bilanz.glaubwuerdigkeit >= 75 ? " gut" : bilanz.glaubwuerdigkeit < 40 ? " warn" : ""}`}>
          <b>Glaubwürdigkeit</b>
          <span>{Math.round(bilanz.glaubwuerdigkeit)}</span>
          <em>{bilanz.wort}</em>
        </div>
        <div className="pe-chip">
          <b>Aufträge</b>
          <span>{auftraege}</span>
          <em>laufen im Kabinett</em>
        </div>
        <div className={`pe-chip${gefahr ? " warn" : ""}`}>
          <b>Rücktrittsgefahr</b>
          <span>{gefahr}</span>
          <em>{gefahr ? "Loyalität unter 25" : "niemand"}</em>
        </div>
      </div>

      <div className="pe-tabs" role="tablist" aria-label="Personen und Zusagen">
        <button role="tab" aria-selected={tab === "umfeld"} className={tab === "umfeld" ? "on" : ""} onClick={() => setTab("umfeld")}>
          Umfeld
        </button>
        <button role="tab" aria-selected={tab === "zusagen"} className={tab === "zusagen" ? "on" : ""} onClick={() => setTab("zusagen")}>
          Zusagen{offen.length > 0 && <span className="pe-zahl">{offen.length}</span>}
        </button>
      </div>
      {dringend > 0 && tab !== "zusagen" && (
        <p className="pe-rueck nein" role="status">
          {dringend === 1 ? "Eine Zusage ist" : `${dringend} Zusagen sind`} bald fällig oder überfällig.{" "}
          <button className="link" onClick={() => setTab("zusagen")}>
            Zu den Zusagen
          </button>
        </p>
      )}

      {tab === "umfeld" && (
        <section className="paper">
          <h3>Ihr Umfeld</h3>
          <p className="subtitle">Wer Ihnen folgt, hängt an Ihren Entscheidungen. Jede Person hat ein Ressort, einen Stil und einen Ehrgeiz; Gespräche haben Folgen, die später wiederkehren.</p>
          <Umfeld world={world} refresh={neu} />
        </section>
      )}
      {tab === "zusagen" && <ZusagenAnsicht world={world} refresh={neu} {...(onMassnahme ? { onMassnahme } : {})} />}
    </div>
  );
}

// Personen und Zusagen: Wer um den Präsidenten steht (Profil, Sorgen, Ressort, Gespräche, Wechsel im Amt) und was versprochen wurde.
// Die Regeln stehen in sim/personen.ts, gespraeche.ts, nachfolge.ts und zusagen.ts; hier nur die Ansicht.

import { useEffect, useRef, useState } from "react";
import type { World } from "../sim/types";
import type { VorlagenZiel } from "../sim/ministerfluss-typen";
import { zusagenBilanz, zusagenSicht } from "../sim/zusagen";
import { termineInfo } from "../sim/gespraeche";
import { AEMTER, eigenVon } from "../sim/personen";
import { Icon } from "./icons";
import { Umfeld } from "./personen/Umfeld";
import { MinisterratSaal } from "./personen/MinisterratSaal";
import { ZusagenAnsicht } from "./personen/ZusagenAnsicht";
import "./personen/personen.css";

import { t } from "../i18n";
export function Personen({ world, refresh, onMassnahme, onGeheVorlage, onKarte, onVorgang }: { world: World; refresh?: () => void; onMassnahme?: (id: string, richtung: 1 | -1) => void; onGeheVorlage?: (z: VorlagenZiel) => void; onKarte?: (problemId?: string) => void; onVorgang?: (id: string) => void }) {
  const spiel = world.spiel;
  const [tab, setTab] = useState<"kabinett" | "umfeld" | "zusagen">("kabinett");
  const [gewaehltePerson, setGewaehltePerson] = useState<{ id: string; modus?: "gespraech" | "entlassen" } | null>(null);
  const wurzel = useRef<HTMLDivElement>(null);
  // Wer im Kabinett nach unten gescrollt hat und dann in eine andere Ansicht wechselt, sieht deren Anfang, nicht ihre Mitte
  useEffect(() => {
    // Kommt der Spieler mit einer gewählten Person aus dem Kabinett, springt das Umfeld selbst an deren Szene
    if (tab === "umfeld" && gewaehltePerson) return;
    const fenster = wurzel.current?.closest(".dossier-body");
    if (fenster instanceof HTMLElement) fenster.scrollTo({ top: 0 });
  }, [tab, gewaehltePerson]);

  if (!spiel) return <p>{t("ui.Personen.8c5dcf6")}</p>;
  const neu = () => refresh?.();
  const bilanz = zusagenBilanz(world);
  const offen = zusagenSicht(world);
  const dringend = offen.filter((z) => z.dringlichkeit === "dringend" || z.dringlichkeit === "ueberfaellig").length;
  const termine = termineInfo(world);
  const regierung = spiel.figuren.filter((f) => f.imAmt && AEMTER[f.amt].regierungsamt);
  const auftraege = regierung.filter((f) => eigenVon(world, f).auftrag?.status === "laeuft").length;
  const gefahr = spiel.figuren.filter((f) => f.imAmt && f.amt !== "opposition" && f.loyalitaet < 25).length;

  function waehleAusKabinett(id: string, modus?: "gespraech" | "entlassen") {
    setGewaehltePerson({ id, modus });
    setTab("umfeld");
  }

  return (
    <div className="pe" ref={wurzel}>
      <div className="pe-kopf">
        <div className={`pe-chip${termine.belegt >= termine.max ? " warn" : ""}`}>
          <b>Termine (30 Tage)</b>
          <span>
            {termine.belegt} von {termine.max}
          </span>
          <em>{t("ui.Personen.eda230f")}</em>
        </div>
        <div className={`pe-chip${bilanz.glaubwuerdigkeit >= 75 ? " gut" : bilanz.glaubwuerdigkeit < 40 ? " warn" : ""}`}>
          <b>{t("ui.Personen.e8d0e79")}</b>
          <span>{Math.round(bilanz.glaubwuerdigkeit)}</span>
          <em>{bilanz.wort}</em>
        </div>
        <div className="pe-chip">
          <b>{t("ui.Personen.3d15f74")}</b>
          <span>{auftraege}</span>
          <em>laufen im Kabinett</em>
        </div>
        <div className={`pe-chip${gefahr ? " warn" : ""}`}>
          <b>{t("ui.Personen.434c793")}</b>
          <span>{gefahr}</span>
          <em>{gefahr ? "Loyalität unter 25" : "niemand"}</em>
        </div>
      </div>

      <div className="pe-tabs" role="tablist" aria-label={t("ui.Personen.c98699e")}>
        <button role="tab" aria-selected={tab === "kabinett"} className={tab === "kabinett" ? "on" : ""} onClick={() => setTab("kabinett")}>
          <Icon name="kuppel" size={16} />
          Ministerrat
        </button>
        <button role="tab" aria-selected={tab === "umfeld"} className={tab === "umfeld" ? "on" : ""} onClick={() => setTab("umfeld")}>
          {t("ui.Personen.51eda9e")}
        </button>
        <button role="tab" aria-selected={tab === "zusagen"} className={tab === "zusagen" ? "on" : ""} onClick={() => setTab("zusagen")}>
          Zusagen{offen.length > 0 && <span className="pe-zahl">{offen.length}</span>}
        </button>
      </div>
      {dringend > 0 && tab !== "zusagen" && (
        <p className="pe-rueck nein" role="status">
          {dringend === 1 ? "Eine Zusage ist" : `${dringend} Zusagen sind`} bald fällig oder überfällig.{" "}
          <button className="link" onClick={() => setTab("zusagen")}>
            {t("ui.Personen.030fbc4")}
          </button>
        </p>
      )}

      {tab === "kabinett" && (
        <MinisterratSaal world={world} refresh={neu} onWaehlePerson={waehleAusKabinett} {...(onGeheVorlage ? { onGeheVorlage } : {})} {...(onKarte ? { onKarte } : {})} />
      )}
      {tab === "umfeld" && (
        <section className="paper">
          <h3>Ihr Umfeld</h3>
          <p className="subtitle">{t("ui.Personen.9d370c2")}</p>
          <Umfeld
            world={world}
            refresh={neu}
            initialPersonId={gewaehltePerson?.id}
            initialModus={gewaehltePerson?.modus}
          />
        </section>
      )}
      {tab === "zusagen" && <ZusagenAnsicht world={world} refresh={neu} {...(onMassnahme ? { onMassnahme } : {})} {...(onVorgang ? { onVorgang } : {})} />}
    </div>
  );
}

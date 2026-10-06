// Das Katastrophen-Dossier als Krisenstab (INF-5): Lage und Vorsorge, laufende Fälle mit Hilfskette, Versprechen, Chronik.
// Die Mechanik steht in sim/katastrophe.ts; die Teilansichten stehen in ui/katastrophe/*. Hier liegen nur Kopf und Reiter.

import { useState } from "react";
import type { World } from "../sim/types";
import { formatDateDe } from "../sim/dates";
import { bereitschaft, fallSicht, versprechensLage } from "../sim/katastrophe";
import type { Ziel } from "./schreibtisch/briefing";
import { Lage } from "./katastrophe/Lage";
import { Faelle } from "./katastrophe/Faelle";
import { Chronik, Versprechen } from "./katastrophe/Versprechen";
import { t } from "../i18n";
import "./katastrophe.css";

type Reiter = "lage" | "faelle" | "versprechen" | "chronik";

/**
 * `onGehe` ist optional: Die Bühne reicht ihre `gehe`-Funktion durch (Ziele wie im Schreibtisch: Akte oder Maßnahme im Politikfenster).
 * Ohne sie bleiben die Verweise auf andere Akten weg; alle Handlungen im Krisenstab selbst laufen auch ohne.
 */
export function Katastrophe({ world, refresh, onGehe }: { world: World; refresh: () => void; onGehe?: (z: Ziel) => void }) {
  const [reiterGewaehlt, setReiter] = useState<Reiter | null>(null);
  const [notiz, setNotiz] = useState<string | null>(null);
  const spiel = world.spiel;
  if (!spiel) return <p>{t("ui2.ui.Katastrophe.616efb9")}</p>;

  const faelle = spiel.katastrophen?.faelle ?? [];
  const aktive = faelle.filter((f) => !f.bewaeltigt);
  // Ohne laufenden Fall ist die Vorsorge die Hauptsache; mit einem Fall zuerst der Fall
  const reiter: Reiter = reiterGewaehlt ?? (aktive.length > 0 ? "faelle" : "lage");
  const stand = Math.round(bereitschaft(world));
  const offeneVersprechen = versprechensLage(world).filter((z) => z.quote < 0.95).length;

  const reiterListe: { id: Reiter; name: string; anzahl?: number }[] = [
    { id: "lage", name: t("reste.kat.lage") },
    { id: "faelle", name: t("reste.kat.faelle"), ...(aktive.length ? { anzahl: aktive.length } : {}) },
    { id: "versprechen", name: t("reste.kat.versprechen"), ...(offeneVersprechen ? { anzahl: offeneVersprechen } : {}) },
    { id: "chronik", name: t("reste.kat.chronik") },
  ];
  const warn = !!notiz && /fehlt|nicht möglich|nicht ok/i.test(notiz);

  return (
    <div className="kr">
      <header className="kr-kopf">
        <div className="kr-merker">
          <span className={stand < 30 ? "warn" : ""}>
            {t("ui2.ui.Katastrophe.99cafe1")} <b>{stand}</b> {t("ui2.ui.Katastrophe.18df22a")}
          </span>
          <span className={aktive.length ? "warn" : ""}>
            {t("ui2.ui.Katastrophe.e805c0a")} <b>{aktive.length}</b>
          </span>
          <span>
            {t("ui2.ui.Katastrophe.ae69ecb")} <b>{Math.floor(spiel.kapital)}</b>
          </span>
          {faelle.length > 0 && (
            <span>
              {t("ui2.ui.Katastrophe.b06d65d")} <b>{formatDateDe([...faelle].sort((a, b) => b.tag - a.tag)[0]!.datum)}</b>
            </span>
          )}
        </div>
        <div className="kr-tabs" role="tablist" aria-label={t("ui2.ui.Katastrophe.7eadd22")}>
          {reiterListe.map((r) => (
            <button key={r.id} type="button" role="tab" aria-selected={reiter === r.id} className={reiter === r.id ? "on" : ""} onClick={() => setReiter(r.id)}>
              {r.name}
              {r.anzahl !== undefined && <span className="anzahl">{r.anzahl}</span>}
            </button>
          ))}
        </div>
        {notiz && (
          <p className={`kr-status${warn ? " warn" : ""}`} role="status">
            {notiz}
          </p>
        )}
      </header>

      {reiter === "lage" && <Lage world={world} refresh={refresh} melde={setNotiz} {...(onGehe ? { onGehe } : {})} />}
      {reiter === "faelle" && <Faelle world={world} refresh={refresh} melde={setNotiz} zurLage={() => setReiter("lage")} {...(onGehe ? { onGehe } : {})} />}
      {reiter === "versprechen" && <Versprechen world={world} {...(onGehe ? { onGehe } : {})} />}
      {reiter === "chronik" && <Chronik world={world} />}
    </div>
  );
}

// Für die Kartenmarken der Oberfläche: betroffene Provinzen der offenen Fälle
export function katastrophenMarken(w: World): { plaka: number; text: string }[] {
  const z = w.spiel?.katastrophen;
  if (!z) return [];
  return z.faelle
    .filter((f) => !f.bewaeltigt)
    .flatMap((f) => {
      const s = fallSicht(w, f);
      return f.provinzen.slice(0, 1).map((plaka) => ({ plaka, text: `${s.titel} (${formatDateDe(f.datum)})` }));
    });
}

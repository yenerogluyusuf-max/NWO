// Das Gespräch als Szene: Thema wählen, Ansatz wählen (mit Kosten und Vorschau der Folgen), dann die Sprechblasen und was daraus folgt.

import { useMemo, useState } from "react";
import type { World } from "../../sim/types";
import type { Figur } from "../../sim/spiel-typen";
import { ansaetzeFuer, fuehreGespraech, termineInfo, themenFuer, type AnsatzId, type GespraechErgebnis } from "../../sim/gespraeche";
import { haltung } from "../../sim/figuren";
import { Portraet } from "./bausteine";

export function GespraechSzene({ world, figur, refresh, onFertig }: { world: World; figur: Figur; refresh: () => void; onFertig: () => void }) {
  const [themaId, setThemaId] = useState<string | null>(null);
  const [ergebnis, setErgebnis] = useState<GespraechErgebnis | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  // Der Name gilt für das Gespräch, auch wenn es mit einem Rücktritt endet und ein Nachfolger das Amt übernimmt
  const [sprecher] = useState(figur.name);
  const themen = useMemo(() => themenFuer(world, figur.id), [world, figur.id, world.day, world.spiel?.kapital, ergebnis]);
  const thema = themen.find((t) => t.id === themaId);
  const ansaetze = useMemo(() => (themaId ? ansaetzeFuer(world, figur.id, themaId) : []), [world, figur.id, themaId, world.day, world.spiel?.kapital, ergebnis]);
  const termine = termineInfo(world);
  const schritt = ergebnis ? 3 : themaId ? 2 : 1;

  function waehle(a: AnsatzId) {
    if (!themaId) return;
    const r = fuehreGespraech(world, figur.id, themaId, a);
    if (!r.ok) {
      setFehler(r.text);
      return;
    }
    setFehler(null);
    setErgebnis(r);
    refresh();
  }

  return (
    <div className="pe-szene">
      <div className="pe-szenenkopf">
        <Portraet w={world} f={figur} size={52} />
        <div>
          <h3>Gespräch mit {sprecher}</h3>
          <div className="pe-rolle">
            {figur.rolle} · {haltung(figur)}
          </div>
        </div>
        <div className="pe-termine">
          Termine in 30 Tagen: {termine.belegt} von {termine.max}
        </div>
      </div>
      <div className="pe-schritte" aria-label="Schritte">
        <span className={schritt === 1 ? "on" : ""}>1 Thema</span>
        <span className={schritt === 2 ? "on" : ""}>2 Ansatz</span>
        <span className={schritt === 3 ? "on" : ""}>3 Ergebnis</span>
      </div>

      {schritt === 1 && (
        <>
          <p className="subtitle">Worüber wollen Sie sprechen? Das Thema bestimmt, was ein Gespräch bewirken kann: Rat gibt es zu Lage und Zusagen, Aufträge zu messbaren Größen, Kritik nur mit Anlass.</p>
          <div className="pe-themen">
            {themen.map((t) => (
              <button key={t.id} className={`pe-thema${t.dringlich ? " dringend" : ""}`} onClick={() => setThemaId(t.id)}>
                <strong>{t.titel}</strong>
                <span>{t.text}</span>
              </button>
            ))}
          </div>
          <div className="pe-aktionen">
            <button className="pe-aktion leise" onClick={onFertig}>
              Abbrechen
            </button>
          </div>
        </>
      )}

      {schritt === 2 && thema && (
        <>
          <p className="subtitle">
            Thema: <strong>{thema.titel}</strong>. Jeder Ansatz zeigt, was er kostet und bewirkt; Grau heißt: geht gerade nicht (der Grund steht dabei).
          </p>
          {fehler && (
            <p className="pe-rueck nein" role="alert">
              {fehler}
            </p>
          )}
          <div className="pe-ansaetze">
            {ansaetze.map((a) => (
              <button key={a.ansatz} className="pe-ansatz" disabled={!!a.plan.grund} onClick={() => waehle(a.ansatz)} title={a.plan.grund ?? a.kurz}>
                <header>
                  <strong>{a.label}</strong>
                  <span className={`pe-kosten${a.plan.pk === 0 ? " frei" : ""}`}>{a.plan.pk === 0 ? "kostenlos" : `${a.plan.pk} Kapital`}</span>
                </header>
                <p>{a.kurz}</p>
                {a.plan.grund ? (
                  <span className="pe-grund">{a.plan.grund}</span>
                ) : (
                  <ul>
                    {a.plan.folgen.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                )}
                {a.plan.aussicht && !a.plan.grund && <span className={`pe-aussicht ${a.plan.aussicht}`}>Aussicht: {a.plan.aussicht === "gut" ? "gut" : a.plan.aussicht === "offen" ? "offen" : "schlecht"}</span>}
              </button>
            ))}
          </div>
          <div className="pe-aktionen">
            <button className="pe-aktion leise" onClick={() => setThemaId(null)}>
              Anderes Thema
            </button>
            <button className="pe-aktion leise" onClick={onFertig}>
              Abbrechen
            </button>
          </div>
        </>
      )}

      {schritt === 3 && ergebnis && (
        <>
          <div className="pe-dialog" aria-live="polite">
            {ergebnis.szene.map((z, i) => (
              <div key={i} className={`pe-blase ${z.wer}`}>
                {z.wer !== "erzaehler" && <span className="pe-sprecher">{z.wer === "ich" ? "Sie" : sprecher}</span>}
                {z.text}
              </div>
            ))}
          </div>
          {ergebnis.hinweise.length > 0 && (
            <div className="pe-hinweise">
              <h4>Was {figur.weiblich ? "sie" : "er"} Ihnen sagt</h4>
              {ergebnis.hinweise.map((h, i) => (
                <p key={i}>{h}</p>
              ))}
            </div>
          )}
          <div className="pe-block">
            <h4>Was daraus folgt{ergebnis.kosten > 0 ? ` (${ergebnis.kosten} Kapital)` : ""}</h4>
            <ul className="pe-folgen">
              {ergebnis.folgen.map((f, i) => (
                <li key={i}>
                  <span className={f.ton} aria-hidden>
                    {f.ton === "gut" ? "▲" : f.ton === "schlecht" ? "▼" : "•"}
                  </span>
                  <span className={f.ton}>{f.text}</span>
                </li>
              ))}
              {ergebnis.folgen.length === 0 && <li className="neutral">Keine unmittelbaren Folgen.</li>}
            </ul>
          </div>
          <div className="pe-aktionen">
            <button className="pe-aktion haupt" onClick={onFertig}>
              Zurück zur Person
            </button>
          </div>
        </>
      )}
    </div>
  );
}

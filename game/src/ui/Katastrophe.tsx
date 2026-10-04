// Das Katastrophen-Dossier (INF-5): Schadenslage mit Nebel der ersten Tage (bekannt/vermutet/
// unsicher), Hilfskette (Soforthilfe, Übergang, Wohnungsbau-Programm mit Vergabewahl), die
// Versprechensschuld (geliefert X von Y Wohnungen) und die Nachbetrachtung („Bereitschaft hat
// X verhindert"). Die Mechanik steht in sim/katastrophe.ts; hier steht nur die Ansicht.

import { useState } from "react";
import type { World } from "../sim/types";
import type { KatastropheFall } from "../sim/spiel-typen";
import type { Vergabe } from "../sim/reich-typen";
import { VERGABE_NAMEN } from "../sim/reich-typen";
import { kannZahlen } from "../sim/kapital";
import { warteschlange } from "../sim/reich";
import { formatDateDe } from "../sim/dates";
import {
  ART_NAMEN,
  beginneWiederaufbau,
  dossier,
  fallSicht,
  schaetzung,
  soforthilfe,
  staerkeWort,
  starteUebergang,
  type FallSicht,
} from "../sim/katastrophe";

const nf = (x: number, d = 0) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Kosten der Dossier-Aktionen in Politischem Kapital (Spielparameter, wie im Ereignis). */
const PK_SOFORTHILFE = 3;
const PK_UEBERGANG = 2;

const NEBEL_TEXT: Record<string, string> = {
  unsicher: "Erste Stunden: Die Lage ist unklar, Zahlen sind ungesichert.",
  vermutet: "Erste Tage: Schäden werden vermutet, Bandbreiten statt genauer Zahlen.",
  bekannt: "Die Schadenslage ist aufgeklärt.",
};

function SchadensTabelle({ w, fall }: { w: World; fall: KatastropheFall }) {
  return (
    <table className="kat-tabelle">
      <tbody>
        <tr>
          <td>Todesopfer</td>
          <td>{schaetzung(w, fall, fall.tote)}</td>
        </tr>
        <tr>
          <td>Verletzte</td>
          <td>{schaetzung(w, fall, fall.verletzte)}</td>
        </tr>
        <tr>
          <td>Ohne Obdach</td>
          <td>{schaetzung(w, fall, fall.obdachlos)}</td>
        </tr>
        <tr>
          <td>Zerstörte Wohnungen</td>
          <td>{schaetzung(w, fall, fall.wohnungen)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function FallKarte({ w, sicht, onAction, meldung }: { w: World; sicht: FallSicht; onAction: (text: string) => void; meldung: (m: string) => void }) {
  const fall = sicht.fall;
  const [vergabe, setVergabe] = useState<Vergabe>("ausschreibung");
  const spiel = w.spiel!;
  const zusage = fall.zusage;
  const schlange = fall.wohnbau ? warteschlange(w).find((e) => e.id === fall.wohnbau!.id) : undefined;
  const geliefert = Math.round((zusage?.geliefert ?? 0) + fall.privatGeliefert);

  const aktion = (pk: number, f: () => { ok: boolean; text: string } | string) => {
    if (!kannZahlen(spiel.kapital, pk)) {
      meldung(`Dafür fehlt Politisches Kapital (${pk} nötig).`);
      return;
    }
    spiel.kapital -= pk;
    const r = f();
    meldung(typeof r === "string" ? r : r.text);
    onAction("");
  };

  return (
    <section className="prog-schritt paper">
      <header className="prog-schritt-kopf">
        <span className="prog-titel">{sicht.titel}</span>
        <span className="prog-stand">
          {formatDateDe(fall.datum)} · {staerkeWort(fall.staerke)}
          {fall.bewaeltigt ? " · bewältigt" : ""}
        </span>
      </header>
      <div className="prog-koerper">
        <p className="prog-text kat-nebel">{NEBEL_TEXT[sicht.nebel]}</p>
        <SchadensTabelle w={w} fall={fall} />
        <p className="prog-text">{sicht.verhindertText}</p>

        <div className="prog-bedingungen">
          <p className="prog-text">
            <strong>Hilfskette:</strong> Soforthilfe {fall.hilfe.soforthilfe ? "✓ geleistet" : "— ausstehend"}
            {" · "}Übergangsversorgung {sicht.uebergang.aktiv ? `läuft noch ${Math.round(sicht.uebergang.restTage / 30)} Monate (≈ ${nf(sicht.uebergang.kostenMonat, 3)} % BIP je Monat)` : "— nicht eingerichtet"}
            {" · "}Wiederaufbau {fall.wohnbau ? (schlange ? `im Bau, Position ${schlange.position} der Baureihenfolge${schlange.fertigIn !== undefined ? `, fertig in ca. ${schlange.fertigIn} Monaten` : ""}` : "abgeschlossen") : "— nicht angemeldet"}
          </p>
        </div>

        {!fall.bewaeltigt && (
          <div className="prog-schritte">
            {!fall.hilfe.soforthilfe && (
              <button className="brass-button" disabled={!kannZahlen(spiel.kapital, PK_SOFORTHILFE)} onClick={() => aktion(PK_SOFORTHILFE, () => soforthilfe(w, fall.id))}>
                Soforthilfe anordnen ({PK_SOFORTHILFE} Kapital)
              </button>
            )}
            {fall.hilfe.soforthilfe && !sicht.uebergang.aktiv && (
              <button className="leather-button" disabled={!kannZahlen(spiel.kapital, PK_UEBERGANG)} onClick={() => aktion(PK_UEBERGANG, () => starteUebergang(w, fall.id))}>
                Übergangsversorgung einrichten ({PK_UEBERGANG} Kapital)
              </button>
            )}
          </div>
        )}

        {sicht.wiederaufbau.moeglich && !fall.bewaeltigt && (
          <div className="prog-bedingungen">
            <p className="prog-text">
              <strong>Wohnungsbau-Programm:</strong> zerstörte Wohnungen wieder aufbauen — konkurriert mit allen anderen Vorhaben um die Baukapazität des Landes und verdrängt,
              was hinten steht. Kosten in % BIP über die Bauzeit.
            </p>
            <div className="prog-schritte">
              {(Object.keys(VERGABE_NAMEN) as Vergabe[]).map((v) => (
                <label key={v} className="kat-vergabe">
                  <input type="radio" name={`vergabe-${fall.id}`} checked={vergabe === v} onChange={() => setVergabe(v)} /> {VERGABE_NAMEN[v]}
                </label>
              ))}
              <button
                className="brass-button"
                onClick={() => {
                  const r = beginneWiederaufbau(w, fall.id, vergabe);
                  meldung(r.text);
                  onAction("");
                }}
              >
                Programm beginnen ({VERGABE_NAMEN[vergabe]})
              </button>
            </div>
          </div>
        )}

        {zusage && (
          <div className="prog-bedingungen">
            <p className="prog-text">
              <strong>Versprechensschuld:</strong> geliefert {nf(geliefert)} von {nf(zusage.wohnungen)} versprochenen Wohnungen (
              {nf(Math.min(100, (geliefert / zusage.wohnungen) * 100))} %)
              {fall.privatGeliefert > 0 ? ` — davon ${nf(Math.round(fall.privatGeliefert))} durch private Erholung` : ""}.
            </p>
            <div className="prog-balken">
              <div className="prog-lauf" style={{ width: `${Math.min(100, (geliefert / zusage.wohnungen) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function Katastrophe({ world, refresh }: { world: World; refresh: () => void }) {
  const [notiz, setNotiz] = useState<string | null>(null);
  const d = dossier(world);
  const aktive = d.sichten.filter((s) => !s.fall.bewaeltigt);
  const alte = d.sichten.filter((s) => s.fall.bewaeltigt);

  return (
    <div className="programme kat-dossier">
      <p className="subtitle">
        Bereitschaft des Katastrophenschutzes (AFAD): <strong>{d.bereitschaft} von 100</strong>. Sie wächst mit dem Ausbau der Behörde, dem Frühwarnsystem, der
        Pflichtversicherung und der Gebäude-Verstärkung (Politik: Sicherheit und Wohnen) — und senkt Schaden und Opferzahlen, wenn es geschieht.
      </p>
      {notiz && <p className="prog-ergebnis">{notiz}</p>}

      {d.sichten.length === 0 && (
        <p className="subtitle">
          Noch ist in dieser Amtszeit keine Katastrophe eingetreten. Die Risiken bleiben: die Bruchzonen (Kartenebene „Katastrophenrisiko"), Sturzfluten am Schwarzen Meer,
          Großbrände an der Küste im Sommer und die Dürre im Konya-Becken.
        </p>
      )}

      <div className="prog-liste">
        {aktive.map((s) => (
          <FallKarte key={s.fall.id} w={world} sicht={s} onAction={() => refresh()} meldung={setNotiz} />
        ))}
      </div>

      {d.versprechen.length > 0 && (
        <section className="prog-schritt paper">
          <header className="prog-schritt-kopf">
            <span className="prog-titel">Versprechensschuld im Überblick</span>
          </header>
          <div className="prog-koerper">
            <table className="kat-tabelle">
              <thead>
                <tr>
                  <th>Katastrophe</th>
                  <th>Versprochen</th>
                  <th>Geliefert</th>
                  <th>Stand</th>
                </tr>
              </thead>
              <tbody>
                {d.versprechen.map((v) => (
                  <tr key={v.fallId}>
                    <td>
                      {ART_NAMEN[v.art]}, {v.ort}
                    </td>
                    <td>{nf(v.versprochen)}</td>
                    <td>{nf(Math.round(v.geliefert))}</td>
                    <td>{v.quote >= 0.95 ? "erfüllt" : v.imBau ? "im Bau" : "offen"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="prog-text kat-mahnung">
              Zur Mahnung: Nach dem Beben von 2023 waren 319.000 Wohnungen versprochen; im Februar 2025 waren 201.431 übergeben. Wer mehr verspricht, als er baut, wird am
              Wahltag daran gemessen.
            </p>
          </div>
        </section>
      )}

      {alte.length > 0 && (
        <div className="prog-liste">
          {alte.map((s) => (
            <FallKarte key={s.fall.id} w={world} sicht={s} onAction={() => refresh()} meldung={setNotiz} />
          ))}
        </div>
      )}
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

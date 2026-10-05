// Neue Vorhaben: nach Thema getrennt (Programme für Regionen, Verkehr und Welt, Energie und Wasser, Städte, Raumfahrt, Künstliche Intelligenz, Technologie
// mit ihren Feldern), danach das Übrige nach Art, zuletzt das Unrealistische. Eine Leiste oben wählt das Thema. Ketten zeigen ihren Weg: Jede Stufe
// verlangt die vorige. Vorlagen („Programme für Regionen“) fragen nach dem Ort; alles andere beginnt wie bisher mit der Vergabe.

import { useState } from "react";
import type { World } from "../../sim/types";
import { FELDER, KLASSEN_NAMEN, THEMEN, type Klasse, type Vergabe } from "../../sim/reich-typen";
import type { VorhabenSicht } from "../../sim/reich";
import { VorhabenKarte } from "./VorhabenKarte";
import { VorlageKarte } from "./Regional";

/** Reihenfolge und Erklärung der Arten für Vorhaben ohne Thema. */
const ARTEN: { klasse: Klasse; titel: string; satz: string }[] = [
  { klasse: "wunder", titel: "Wunder", satz: "Einmalig, mit Siegesfeier und Gegnern; sie verändern das Land dauerhaft." },
  { klasse: "grossprojekt", titel: "Großprojekte", satz: "Brücken, Bahnen, Kraftwerke, Programme: lange Bauzeit, dauerhafte Leistung, Schulden und Widerstand." },
  { klasse: "serie", titel: "Themenrouten", satz: "Eine Route verbindet mehrere Stätten und verlangt, dass alle gut erhalten sind." },
  { klasse: "ausbau", titel: "Ausbauten", satz: "Ergänzen, was schon steht: Besucherzentren, Personenverkehr, Erweiterungen." },
  { klasse: "forschung", titel: "Forschung", satz: "Ungewisser Ausgang: Durchbrüche lassen sich nicht erzwingen." },
  { klasse: "institution", titel: "Neue Einrichtungen", satz: "Brauchen Jahre, bis sie arbeiten, und binden Verwaltungskraft." },
  { klasse: "beschaffung", titel: "Beschaffung", satz: "Waffensysteme vom Vertrag bis zur Einsatzbereitschaft; Lieferanten erwarten etwas dafür." },
  { klasse: "doktrin", titel: "Doktrinen", satz: "Eine Doktrin schließt die anderen aus und prägt, worauf sich die Streitkräfte vorbereiten." },
  { klasse: "reform", titel: "Reformen", satz: "Kosten Kapital und Stimmen, nicht Geld; jede hat Gewinner und Verlierer." },
  { klasse: "sonderrecht", titel: "Sonderrechte", satz: "Schnelle Instrumente mit einer Kehrseite, die sich später zeigt." },
];

const UTOPIE_SATZ =
  "Möglich, aber extrem schwierig und sehr teuer: Jahrzehnte Bauzeit, riesige Schulden, Voraussetzungen, die erst Vorstufen schaffen, Mehrkosten, die eher die Regel sind, und Widerstand, der nicht nachlässt. Der Gegenwert ist Ansehen, keine Abkürzung zum Sieg.";

const STATUS_KURZ = (s: VorhabenSicht): string =>
  s.status === "fertig" ? "fertig" : s.status === "im_bau" || s.status === "pausiert" ? "im Bau" : s.status === "gesperrt" || s.status === "ausgeschlossen" ? "gesperrt" : s.bereit ? "bereit" : "Voraussetzung fehlt";

/** Ketten innerhalb eines Themas: zusammenhängende Vorhaben, die einander als „fertig“ verlangen. Nur Ketten mit mindestens zwei Gliedern. */
function ketten(alle: VorhabenSicht[], thema: string): VorhabenSicht[][] {
  const mitglieder = alle.filter((s) => s.v.thema === thema);
  const index = new Map(mitglieder.map((s) => [s.v.id, s]));
  const elter = new Map<string, string>(mitglieder.map((s) => [s.v.id, s.v.id]));
  const wurzel = (id: string): string => (elter.get(id) === id ? id : wurzel(elter.get(id)!));
  for (const s of mitglieder) {
    for (const x of s.v.voraus) {
      if (x.art === "bestand" && index.has(x.id)) elter.set(wurzel(s.v.id), wurzel(x.id));
    }
  }
  const gruppen = new Map<string, VorhabenSicht[]>();
  for (const s of mitglieder) gruppen.set(wurzel(s.v.id), [...(gruppen.get(wurzel(s.v.id)) ?? []), s]);
  return [...gruppen.values()].filter((g) => g.length >= 2).map((g) => g.sort((a, b) => (a.v.stufe ?? 0) - (b.v.stufe ?? 0) || a.v.name.localeCompare(b.v.name, "de")));
}

function Weg({ kette }: { kette: VorhabenSicht[] }) {
  return (
    <ol className="rr-weg" aria-label="Weg der Stufen">
      {kette.map((s) => (
        <li key={s.v.id} className={`weg-${s.status === "fertig" ? "fertig" : s.status === "im_bau" || s.status === "pausiert" ? "bau" : s.bereit && s.status === "verfuegbar" ? "bereit" : "zu"}`}>
          <span className="weg-stufe">{s.v.stufe ?? "·"}</span>
          <span className="weg-name">{s.v.name}</span>
          <em>{STATUS_KURZ(s)}</em>
        </li>
      ))}
    </ol>
  );
}

export function Neues({
  world,
  liste,
  alle,
  onBeginne,
  ergebnisse,
  onKarte,
  refresh,
}: {
  world: World;
  /** Was sich beginnen lässt oder gesperrt ist */
  liste: VorhabenSicht[];
  /** Alle Vorhaben des Bereichs, auch fertige und laufende (für die Ketten); ohne Angabe gilt `liste` */
  alle?: VorhabenSicht[];
  onBeginne: (id: string, vergabe: Vergabe) => void;
  ergebnisse: Record<string, { ok: boolean; text: string }>;
  onKarte?: (o: { lon: number; lat: number }) => void;
  refresh?: () => void;
}) {
  const [auswahl, setAuswahl] = useState<string>("alle");
  const kapital = world.spiel?.kapital ?? 0;
  const alleListe = alle ?? liste;
  const gross = (s: VorhabenSicht) => s.v.klasse === "wunder" || s.v.klasse === "grossprojekt" || s.v.klasse === "serie";
  const sortiere = (items: VorhabenSicht[]) =>
    [...items].sort((x, y) => (x.v.stufe ?? 0) - (y.v.stufe ?? 0) || Number(y.bereit) - Number(x.bereit) || Number(x.status === "gesperrt") - Number(y.status === "gesperrt"));

  const nutzlos = () => undefined;
  const karte = (s: VorhabenSicht) =>
    s.v.vorlage ? (
      <VorlageKarte key={s.v.id} world={world} v={s.v} refresh={refresh ?? nutzlos} />
    ) : (
      <VorhabenKarte key={s.v.id} s={s} world={world} gross={gross(s)} onBeginne={onBeginne} ergebnis={ergebnisse[s.v.id]} kapital={kapital} {...(onKarte ? { onKarte } : {})} />
    );

  const utopien = liste.filter((s) => s.v.unrealistisch);
  const ohneThema = liste.filter((s) => !s.v.thema && !s.v.unrealistisch);
  const themen = THEMEN.map((t) => ({ ...t, items: liste.filter((s) => s.v.thema === t.id) })).filter((t) => t.items.length > 0);
  if (!liste.length) return <p className="subtitle">Hier gibt es im Moment nichts, was sich beginnen ließe.</p>;

  const themaAbschnitt = (t: (typeof themen)[number], mitUtopie: boolean) => {
    const items = sortiere(t.items.filter((s) => mitUtopie || !s.v.unrealistisch));
    if (!items.length) return null;
    const verkettet = ketten(alleListe, t.id);
    const felder = t.id === "technologie" ? FELDER.map((f) => ({ ...f, items: items.filter((s) => s.v.feld === f.id) })).filter((f) => f.items.length) : null;
    return (
      <section key={t.id} className="rr-abschnitt rr-art rr-thema" aria-label={t.titel}>
        <h4>
          {t.titel} <em>{items.length} {items.length === 1 ? "Vorhaben" : "Vorhaben"}</em>
        </h4>
        <p className="rr-hinweis">{t.satz}</p>
        {t.id !== "technologie" && verkettet.map((k) => <Weg key={k[0]!.v.id} kette={k} />)}
        {felder ? (
          felder.map((f) => (
            <div key={f.id} className="rr-feld">
              <h5>{f.titel}</h5>
              {ketten(alleListe, t.id)
                .filter((k) => k.some((s) => s.v.feld === f.id))
                .map((k) => (
                  <Weg key={k[0]!.v.id} kette={k} />
                ))}
              <div className="rr-raster gross">{f.items.map(karte)}</div>
            </div>
          ))
        ) : (
          <div className="rr-raster gross">{items.map(karte)}</div>
        )}
      </section>
    );
  };

  const klassenAbschnitte = ARTEN.map((a) => ({ ...a, items: sortiere(ohneThema.filter((s) => s.v.klasse === a.klasse)) })).filter((a) => a.items.length > 0);

  const chips: { id: string; name: string; n: number }[] = [
    { id: "alle", name: "Alles", n: liste.length },
    ...themen.map((t) => ({ id: t.id, name: t.titel, n: t.items.length })),
    ...(ohneThema.length ? [{ id: "weitere", name: "Weitere Vorhaben", n: ohneThema.length }] : []),
    ...(utopien.length ? [{ id: "utopie", name: "Unrealistisch", n: utopien.length }] : []),
  ];
  const aktiv = chips.some((c) => c.id === auswahl) ? auswahl : "alle";

  return (
    <>
      {chips.length > 2 && (
        <div className="rr-filter rr-themen" role="group" aria-label="Thema der Vorhaben">
          {chips.map((c) => (
            <button key={c.id} type="button" className={aktiv === c.id ? "on" : ""} aria-pressed={aktiv === c.id} onClick={() => setAuswahl(c.id)}>
              {c.name} <b>{c.n}</b>
            </button>
          ))}
        </div>
      )}

      {aktiv === "alle" && (
        <>
          {themen.map((t) => themaAbschnitt(t, false))}
          {klassenAbschnitte.length > 0 && <h3 className="rr-teiler">Weitere Vorhaben</h3>}
          {klassenAbschnitte.map((a) => (
            <section key={a.klasse} className="rr-abschnitt rr-art" aria-label={KLASSEN_NAMEN[a.klasse]}>
              <h4>
                {a.titel} <em>{a.items.length} {a.items.length === 1 ? "Vorhaben" : "Vorhaben"}</em>
              </h4>
              <p className="rr-hinweis">{a.satz}</p>
              <div className="rr-raster gross">{a.items.map(karte)}</div>
            </section>
          ))}
          {utopien.length > 0 && (
            <section className="rr-abschnitt rr-art rr-utopie" aria-label="Unrealistisch, aber möglich">
              <h4>
                Unrealistisch, aber möglich <em>{utopien.length} Vorhaben</em>
              </h4>
              <p className="rr-hinweis">{UTOPIE_SATZ}</p>
              <div className="rr-raster gross">{sortiere(utopien).map(karte)}</div>
            </section>
          )}
        </>
      )}

      {aktiv !== "alle" && aktiv !== "weitere" && aktiv !== "utopie" && themen.filter((t) => t.id === aktiv).map((t) => themaAbschnitt(t, true))}

      {aktiv === "weitere" &&
        klassenAbschnitte.map((a) => (
          <section key={a.klasse} className="rr-abschnitt rr-art" aria-label={KLASSEN_NAMEN[a.klasse]}>
            <h4>
              {a.titel} <em>{a.items.length} {a.items.length === 1 ? "Vorhaben" : "Vorhaben"}</em>
            </h4>
            <p className="rr-hinweis">{a.satz}</p>
            <div className="rr-raster gross">{a.items.map(karte)}</div>
          </section>
        ))}

      {aktiv === "utopie" && (
        <section className="rr-abschnitt rr-art rr-utopie" aria-label="Unrealistisch, aber möglich">
          <h4>
            Unrealistisch, aber möglich <em>{utopien.length} Vorhaben</em>
          </h4>
          <p className="rr-hinweis">{UTOPIE_SATZ}</p>
          <div className="rr-raster gross">{sortiere(utopien).map(karte)}</div>
        </section>
      )}
    </>
  );
}

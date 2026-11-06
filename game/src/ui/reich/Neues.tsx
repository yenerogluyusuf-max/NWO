// Neue Vorhaben: ein Katalog wie ein Bauamt (Befund F-1, Nacht N6). Oben das Bild der Frage „Kann ich jetzt bauen, und wann käme ein neuer
// Auftrag dran?“ (Kapazität des Engpasses), darunter Filter und ein Raster aus Kacheln mit Bild; ein Klick öffnet daneben die volle Karte.
// Vorher standen 77 Einträge und zwölf voll aufgeklappte Programme untereinander (15,9 Bildschirme). Vorlagen („Programme für Regionen“)
// sind jetzt Kacheln wie alle anderen; ihre Karte mit Ortswahl steht im Detail. Ketten zeigen ihren Weg im Detail.

import { useState } from "react";
import type { World } from "../../sim/types";
import { FELDER, THEMEN, type Bereich, type Klasse, type Vergabe } from "../../sim/reich-typen";
import { bauKapazitaet, poolKapazitaet, warteschlange, vorhabenDef, type Platz, type VorhabenSicht } from "../../sim/reich";
import { VorhabenKarte } from "./VorhabenKarte";
import { VorhabenKachel } from "./VorhabenKachel";
import "./vorhabenkachel.css";
import { VorlageKarte } from "./Regional";
import { t } from "../../i18n";

/** Reihenfolge der Arten für Vorhaben ohne Thema. */
const ARTEN: Klasse[] = ["wunder", "grossprojekt", "serie", "ausbau", "forschung", "institution", "beschaffung", "doktrin", "reform", "sonderrecht"];

const stufeVon = (s: VorhabenSicht): string =>
  s.status === "fertig" ? "fertig" : s.status === "im_bau" || s.status === "pausiert" ? "bau" : s.bereit && s.status === "verfuegbar" ? "bereit" : "zu";

/** Ketten innerhalb eines Themas: zusammenhängende Vorhaben, die einander als „fertig“ verlangen. */
function ketteVon(alle: VorhabenSicht[], s: VorhabenSicht): VorhabenSicht[] {
  if (!s.v.thema) return [];
  const mitglieder = alle.filter((x) => x.v.thema === s.v.thema);
  const index = new Map(mitglieder.map((x) => [x.v.id, x]));
  const elter = new Map<string, string>(mitglieder.map((x) => [x.v.id, x.v.id]));
  const wurzel = (id: string): string => (elter.get(id) === id ? id : wurzel(elter.get(id)!));
  for (const x of mitglieder) for (const vo of x.v.voraus) if (vo.art === "bestand" && index.has(vo.id)) elter.set(wurzel(x.v.id), wurzel(vo.id));
  const meine = wurzel(s.v.id);
  const kette = mitglieder.filter((x) => wurzel(x.v.id) === meine);
  return kette.length >= 2 ? kette.sort((a, b) => (a.v.stufe ?? 0) - (b.v.stufe ?? 0) || a.v.name.localeCompare(b.v.name)) : [];
}

function Weg({ kette, aktiv }: { kette: VorhabenSicht[]; aktiv: string }) {
  return (
    <ol className="rr-weg" aria-label={t("ui.reich.Neues.9e231f6")}>
      {kette.map((s) => (
        <li key={s.v.id} className={`weg-${stufeVon(s)}${s.v.id === aktiv ? " aktiv" : ""}`}>
          <span className="weg-stufe">{s.v.stufe ?? "·"}</span>
          <span className="weg-name">{s.v.name}</span>
          <em>{t(`n6.neu.stand.${stufeVon(s)}`)}</em>
        </li>
      ))}
    </ol>
  );
}

/** Das Bild oben: Wie voll ist die Kapazität, und wann käme ein neuer Auftrag dran? */
function Kapazitaetsbild({ world, bereich }: { world: World; bereich: Bereich }) {
  const pool = bereich === "militaer" ? "ruestung" : "land";
  const liste = warteschlange(world).filter((e) => e.pool === pool);
  const cap = Math.max(1, pool === "land" ? bauKapazitaet(world) : poolKapazitaet(world, pool));
  const belegt = liste.reduce((n, e) => n + (e.pausiert ? 0 : e.rate), 0);
  const frei = Math.max(0, cap - belegt);
  const fertig = liste.filter((e) => e.fertigIn !== undefined && !e.pausiert).sort((a, b) => a.fertigIn! - b.fertigIn!)[0];
  const naechster = fertig ? vorhabenDef(fertig.id)?.name ?? fertig.id : null;
  const satz =
    frei >= 5
      ? t("n6.neu.kapFrei", { frei: Math.round(frei), cap: Math.round(cap) })
      : naechster && fertig
        ? t("n6.neu.kapVoll", { cap: Math.round(cap), n: fertig.fertigIn!, name: naechster })
        : t("n6.neu.kapVollOhne", { cap: Math.round(cap) });
  return (
    <div className="vk-kap" role="img" aria-label={satz}>
      <span className="vk-kap-leiste" aria-hidden>
        {liste.filter((e) => !e.pausiert && e.rate > 0).map((e) => (
          <i key={e.id} style={{ flexGrow: e.rate }} title={`${e.position}. ${vorhabenDef(e.id)?.name ?? e.id}`} />
        ))}
        {frei > 0.5 && <i className="frei" style={{ flexGrow: frei }} />}
      </span>
      <span className="vk-kap-satz">{satz}</span>
    </div>
  );
}

export function Neues({
  world,
  bereich: bereichVorgabe,
  liste,
  alle,
  onBeginne,
  ergebnisse,
  onKarte,
  refresh,
  start,
}: {
  world: World;
  /** Fachbereich; ohne Angabe der Bereich der ersten Einträge */
  bereich?: Bereich;
  /** Was sich beginnen lässt oder gesperrt ist */
  liste: VorhabenSicht[];
  /** Alle Vorhaben des Bereichs, auch fertige und laufende (für Ketten und „Fertig“) */
  alle?: VorhabenSicht[];
  onBeginne: (id: string, vergabe: Vergabe, platz?: Platz) => void;
  ergebnisse: Record<string, { ok: boolean; text: string }>;
  onKarte?: (o: { lon: number; lat: number }) => void;
  refresh?: () => void;
  /** Vorgewähltes Vorhaben (Sprung aus der Lage, von der Karte oder dem Provinzblatt) */
  start?: string | undefined;
}) {
  const alleListe = alle ?? liste;
  const bereich: Bereich = bereichVorgabe ?? alleListe[0]?.v.bereich ?? "infrastruktur";
  const fertig = alleListe.filter((s) => s.status === "fertig" && s.v.klasse !== "restaurierung" && s.v.klasse !== "institution" && bereich !== "infrastruktur" && bereich !== "militaer");
  const laufend = alleListe.filter((s) => s.status === "im_bau" || s.status === "pausiert");
  const bereit = liste.filter((s) => s.status === "verfuegbar" && s.bereit && !s.v.unrealistisch);
  const utopien = liste.filter((s) => s.v.unrealistisch);
  const ohneThema = liste.filter((s) => !s.v.thema && !s.v.unrealistisch);
  const themen = THEMEN.map((th) => ({ id: th.id, titel: th.titel, satz: th.satz, items: liste.filter((s) => s.v.thema === th.id && !s.v.unrealistisch) })).filter((th) => th.items.length > 0);
  const arten = ARTEN.map((k) => ({ id: `art_${k}`, klasse: k, items: ohneThema.filter((s) => s.v.klasse === k) })).filter((a) => a.items.length > 0);

  const chips: { id: string; name: string; n: number; satz?: string; items: VorhabenSicht[] }[] = [
    ...(bereit.length ? [{ id: "bereit", name: t("n6.neu.bereit"), n: bereit.length, items: bereit }] : []),
    ...themen.map((th) => ({ id: th.id, name: th.titel, n: th.items.length, satz: th.satz, items: th.items })),
    // Ohne Thema: nach Art; wenige Arten bekommen je einen eigenen Filter (Kultur), viele einen gemeinsamen (Infrastruktur)
    ...(themen.length > 1 ? (ohneThema.length ? [{ id: "weitere", name: t("n6.neu.weitere"), n: ohneThema.length, items: ohneThema }] : []) : arten.map((a) => ({ id: a.id, name: t(`n6.neu.art.${a.klasse}`), n: a.items.length, satz: t(`n6.neu.artSatz.${a.klasse}`), items: a.items }))),
    ...(laufend.length ? [{ id: "laufend", name: t("n6.neu.laufend"), n: laufend.length, items: laufend }] : []),
    ...(fertig.length ? [{ id: "fertig", name: t("n6.neu.fertig"), n: fertig.length, items: fertig }] : []),
    ...(utopien.length ? [{ id: "visionen", name: t("n6.neu.visionen"), n: utopien.length, satz: t("n6.neu.visionenSatz"), items: utopien }] : []),
  ];
  const startChip = start ? chips.find((c) => c.items.some((s) => s.v.id === start))?.id : undefined;
  const [auswahl, setAuswahl] = useState<string>(startChip ?? chips[0]?.id ?? "bereit");
  // Ohne Vorgabe ist die erste bereite Kachel gewählt: Das Detail rechts zeigt sofort eine volle Karte statt eines leeren Rahmens
  const [gewaehlt, setGewaehlt] = useState<string | null>(start ?? (chips[0]?.items.find((s) => s.bereit && s.status === "verfuegbar") ?? chips[0]?.items[0])?.v.id ?? null);
  const kapital = world.spiel?.kapital ?? 0;
  if (!chips.length) return <p className="subtitle">{t("ui.reich.Neues.e94e6ab")}</p>;
  const aktiv = chips.find((c) => c.id === auswahl) ?? chips[0]!;
  const sortiert = [...aktiv.items].sort(
    (x, y) => Number(y.bereit && y.status === "verfuegbar") - Number(x.bereit && x.status === "verfuegbar") || (x.v.stufe ?? 0) - (y.v.stufe ?? 0) || Number(y.bezahlbar) - Number(x.bezahlbar),
  );
  const felder = aktiv.id === "technologie" ? FELDER.map((f) => ({ ...f, items: sortiert.filter((s) => s.v.feld === f.id) })).filter((f) => f.items.length) : null;
  const detail = alleListe.find((x) => x.v.id === gewaehlt) ?? liste.find((x) => x.v.id === gewaehlt);
  const kachel = (s: VorhabenSicht) => <VorhabenKachel key={s.v.id} s={s} gewaehlt={gewaehlt === s.v.id} onWaehle={() => setGewaehlt(gewaehlt === s.v.id ? null : s.v.id)} />;
  const kette = detail ? ketteVon(alleListe, detail) : [];
  const nutzlos = () => undefined;

  return (
    <div className="vk-katalog">
      <div className="vk-liste">
        {(bereich === "infrastruktur" || bereich === "kultur" || bereich === "militaer") && <Kapazitaetsbild world={world} bereich={bereich} />}
        <div className="rr-filter rr-themen" role="group" aria-label={t("ui.reich.Neues.e47e4da")}>
          {chips.map((c) => (
            <button key={c.id} type="button" className={`${aktiv.id === c.id ? "on" : ""}${c.id === "visionen" ? " vision" : ""}`} aria-pressed={aktiv.id === c.id} onClick={() => setAuswahl(c.id)}>
              {c.name} <b>{c.n}</b>
            </button>
          ))}
        </div>
        {aktiv.satz && <p className="rr-hinweis vk-satz">{aktiv.satz}</p>}
        {felder ? (
          felder.map((f) => (
            <div key={f.id} className="rr-feld">
              <h5>{f.titel}</h5>
              <div className="rr-raster vk-raster">{f.items.map(kachel)}</div>
            </div>
          ))
        ) : (
          <div className={`rr-raster vk-raster${aktiv.id === "visionen" ? " visionen" : ""}`}>{sortiert.map(kachel)}</div>
        )}
      </div>
      <aside className="vk-detail" aria-live="polite">
        {detail ? (
          <>
            {kette.length > 0 && <Weg kette={kette} aktiv={detail.v.id} />}
            {detail.v.vorlage && detail.status === "verfuegbar" ? (
              <VorlageKarte key={detail.v.id} world={world} v={detail.v} refresh={refresh ?? nutzlos} />
            ) : (
              <VorhabenKarte key={detail.v.id} s={detail} world={world} gross onBeginne={onBeginne} ergebnis={ergebnisse[detail.v.id]} kapital={kapital} {...(onKarte ? { onKarte } : {})} />
            )}
          </>
        ) : (
          <p className="vk-leer">{t("vk.waehlen")}</p>
        )}
      </aside>
    </div>
  );
}

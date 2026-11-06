// Der Verhandlungstisch (Welle H6, 06.11.2026): oben die Szene — wer gegenübersitzt, was ihm wichtig ist, seine Roten Linien —, darunter
// die Waage: links, was die Türkei gibt, rechts, was sie verlangt, dazu der Vorsprung, den die Gegenseite mindestens will. Die Waage
// zeigt das Urteil, dieselben Zahlen bucht sim/abkommen.ts (`bewerte`). Darunter die Klauseln als Karten mit offener Beschreibung
// (ENTSCHEIDUNGEN Y), je Seite nach Themen geordnet; unten die Leiste mit Urteil, Laufzeit, Preis und Knopf.
// Prüfen kostet nichts; ein Angebot zu unterbreiten kostet Kapital und hat Folgen (Zustimmung, Gegenangebot, Zurückweisung).

import { useMemo, useRef, useState } from "react";
import type { World } from "../../sim/types";
import { haltungWort, land, vertrauenZu, weltZustand } from "../../sim/laender";
import { PROFILE, THEMEN, VERTRAGSLAUFZEITEN, themaVon, type Laufzeit, type Thema } from "../../data/abkommen";
import { ABWAEGUNG, bewerte, heimWirkung, klauselnFuer, laufende, nimmGegenangebot, sperreRest, verhandle, type Angebot, type Bewertung, type Ergebnis, type Gegenangebot, type KlauselSicht } from "../../sim/abkommen";
import { kannZahlen, nurAufPump } from "../../sim/kapital";
import { Flagge } from "../art/Flaggen";
import { t, zahl } from "../../i18n";
import "./verhandlungstisch.css";

/** Eine Zahl der Abwägung, auf eine Stelle gerundet, mit echtem Minuszeichen */
const pz = (x: number, vorzeichen = false): string => {
  const r = Math.round(x * 10) / 10;
  const betrag = zahl(Math.abs(r));
  if (r === 0) return zahl(0);
  return r < 0 ? `−${betrag}` : vorzeichen ? `+${betrag}` : betrag;
};

/** Wer am Tisch spricht: die Hauptstadt (Moskau, Brüssel …) in der Sprache des Spiels */
const sitzVon = (landId: string): string => {
  const s = t(`welle_h6.sitz.${landId}`);
  return s.startsWith("welle_h6.") ? land(landId).name : s;
};

function WertMarke({ k, partner }: { k: KlauselSicht; partner: string }) {
  if (k.rot) return <b className="vt-rot">{t("ui2.ui.welt.Verhandlungstisch.66d4eee")}</b>;
  const gibt = k.def.seite === "gibt";
  const ton = k.wert > 0 ? (gibt ? "plus" : "interesse") : k.wert < 0 ? "minus" : "null";
  return (
    <span className={`vt-wert ${ton}`} title={gibt ? t("welle_h6.karte.wert_titel", { sitz: partner }) : t("welle_h6.karte.kosten_titel", { sitz: partner })}>
      <b>{pz(k.wert, true)}</b>
      <small>{k.wert >= 0 && !gibt ? t("welle_h6.karte.interesse", { sitz: partner }) : t("welle_h6.karte.fuer", { sitz: partner })}</small>
    </span>
  );
}

function KlauselKarte({ k, gewaehlt, veto, onToggle, partner }: { k: KlauselSicht; gewaehlt: boolean; veto: boolean; onToggle: () => void; partner: string }) {
  const wirkung = useMemo(() => heimWirkung(k.def), [k.def]);
  const zeilen = [...wirkung.sofort, ...wirkung.dauer.map((z) => ({ ...z, text: t("tag_t7.tisch.dauerhaft", { text: z.text }) }))].slice(0, 5);
  return (
    <li>
      <button
        type="button"
        className={`vt-karte${gewaehlt ? " an" : ""}${veto ? " veto" : ""}${k.gesperrt ? " gesperrt" : ""}`}
        aria-pressed={gewaehlt}
        disabled={!!k.gesperrt}
        onClick={onToggle}
        data-klausel={k.def.id}
      >
        <span className="vt-karte-kopf">
          <strong>{k.label}</strong>
          {!k.gesperrt && <WertMarke k={k} partner={partner} />}
        </span>
        {/* Die Beschreibung steht offen auf jeder Karte (ENTSCHEIDUNGEN Y: dieser Bereich braucht Raum) */}
        <span className="vt-karte-text">{k.text}</span>
        {k.gesperrt ? (
          <span className="vt-karte-grund">{k.gesperrt}</span>
        ) : (
          <>
            {zeilen.length > 0 && (
              <ul className="vt-wirkung" aria-label={t("ui2.ui.welt.Verhandlungstisch.dca5dc7")}>
                {zeilen.map((z, i) => (
                  <li key={i} className={z.gut ? "gut" : "schlecht"}>
                    <span aria-hidden>{z.richtung > 0 ? "▲" : "▼"}</span> {z.text}
                  </li>
                ))}
              </ul>
            )}
            <span className="vt-karte-fuss">
              {gewaehlt && <span className="vt-im-paket">{t("welle_h6.karte.im_paket")}</span>}
              {k.def.pk ? <span className="vt-pk">{t("welle_h6.karte.pk", { pk: k.def.pk })}</span> : null}
            </span>
            {gewaehlt && <span className="vt-kehrseite">{t("ui2.ui.welt.Verhandlungstisch.c7e5524", { p0: k.def.kehrseite })}</span>}
          </>
        )}
      </button>
    </li>
  );
}

/** Die Waage als Bild: Der Balken neigt sich zur schwereren Seite; links liegt, was die Türkei gibt, rechts, was sie verlangt, plus Vorsprung. */
function WaageBild({ links, rechts, leer }: { links: number; rechts: number; leer: boolean }) {
  const diff = links - rechts;
  // Spielgrafik: höchstens 13 Grad Neigung, 2,2 Grad je Punkt Unterschied
  const winkel = leer ? 0 : -Math.max(-13, Math.min(13, diff * 2.2));
  const L = 118;
  const rad = (winkel * Math.PI) / 180;
  const yLinks = -L * Math.sin(rad);
  const yRechts = L * Math.sin(rad);
  const schale = (x: number, y: number, seite: "geben" | "verlangen") => (
    <g className={`vt-schale-bild ${seite}`} style={{ transform: `translate(${x}px, ${y}px)` }}>
      <line x1={-30} y1={0} x2={0} y2={-46} />
      <line x1={30} y1={0} x2={0} y2={-46} />
      <path d="M -40 0 Q 0 22 40 0 Z" />
    </g>
  );
  return (
    <svg className="vt-waage-bild" viewBox="0 0 320 132" aria-hidden>
      <path className="vt-sockel" d="M 130 126 L 190 126 L 176 116 L 144 116 Z" />
      <rect className="vt-saeule" x={156} y={30} width={8} height={88} rx={3} />
      {schale(160 - L, 72 + yLinks, "geben")}
      {schale(160 + L, 72 + yRechts, "verlangen")}
      <g className="vt-balken" style={{ transform: `rotate(${winkel}deg)` }}>
        <rect x={160 - L - 6} y={23} width={2 * L + 12} height={6} rx={3} />
        <circle cx={160 - L} cy={26} r={4} />
        <circle cx={160 + L} cy={26} r={4} />
      </g>
      <circle className="vt-achse" cx={160} cy={26} r={7} />
    </svg>
  );
}

function urteilSatz(b: Bewertung, nichts: boolean, sitz: string): string {
  if (nichts) return t("welle_h6.urteil.leer");
  if (b.urteil === "zustimmung") return t("welle_h6.urteil.zustimmung", { sitz });
  if (b.urteil === "veto") return t("welle_h6.urteil.veto", { sitz });
  if (!b.gespraech) return t("welle_h6.urteil.kein_gespraech", { sitz });
  if (b.urteil === "gegenangebot") return b.gegenangebote[0]?.art === "kuerzer" && b.punkte >= 0 ? t("welle_h6.urteil.kuerzer", { sitz }) : t("welle_h6.urteil.gegenleistung", { sitz });
  return t("welle_h6.urteil.ablehnung", { sitz });
}

function GegenListe({ liste, onLaden, onAnnehmen }: { liste: Gegenangebot[]; onLaden: (a: Angebot) => void; onAnnehmen?: (a: Angebot) => void }) {
  return (
    <ul className="vt-gegen">
      {liste.map((g, i) => (
        <li key={i}>
          <span className="vt-gegen-text">
            <strong>{g.text}</strong>
            {g.hinweis && <small>{g.hinweis}</small>}
          </span>
          <span className="vt-gegen-knoepfe">
            {onAnnehmen && (
              <button type="button" className="knopf-haupt" onClick={() => onAnnehmen(g.angebot)}>
                {t("ui2.ui.welt.Verhandlungstisch.c1c1e04")}
              </button>
            )}
            <button type="button" className={onAnnehmen ? "knopf-leise" : "knopf"} onClick={() => onLaden(g.angebot)}>
              {t("ui.welt.Verhandlungstisch.3f14ba3")}
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Verhandlungstisch({ world, landId, refresh, onVertraege }: { world: World; landId: string; refresh: () => void; onVertraege?: () => void }) {
  const l = land(landId);
  const [gibt, setGibt] = useState<string[]>([]);
  const [will, setWill] = useState<string[]>([]);
  const [jahre, setJahre] = useState<Laufzeit>(5);
  const [antwort, setAntwort] = useState<Ergebnis | null>(null);
  const kopf = useRef<HTMLDivElement>(null);
  if (!world.spiel) return null;
  const zeige = () => requestAnimationFrame(() => kopf.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
  const kapital = world.spiel.kapital;
  const klauseln = klauselnFuer(world, landId);
  const angebot: Angebot = { land: landId, gibt, will, jahre };
  const b = bewerte(world, angebot);
  const rest = sperreRest(world, landId);
  const nichts = gibt.length + will.length === 0;
  const kannBezahlen = kannZahlen(kapital, b.pk);
  const sitz = sitzVon(landId);
  const profil = PROFILE[landId];
  const z = weltZustand(world)[landId]!;
  const auf = (liste: string[], id: string) => (liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id]);
  const umschalten = (k: KlauselSicht) => {
    if (k.gesperrt) return;
    if (k.def.seite === "gibt") setGibt(auf(gibt, k.def.id));
    else setWill(auf(will, k.def.id));
    setAntwort(null);
  };
  const laden = (a: Angebot) => {
    setGibt(a.gibt);
    setWill(a.will);
    setJahre(a.jahre);
    setAntwort(null);
  };
  const veto = (id: string) => b.urteil === "veto" && klauseln.find((k) => k.def.id === id)?.rot === true;
  const vertraegeLaufen = (z.vertraege ?? []).filter((v) => v.status === "laeuft").length;
  // Klauseln, die schon in einem laufenden Vertrag stehen: eine Zeile statt einer Karte, damit der Tisch überschaubar bleibt
  const aktiv = new Set(laufende(world, landId).flatMap((v) => [...v.gibt, ...v.will]));
  const margeGrund = ABWAEGUNG.margeGrund + (jahre - 2) * ABWAEGUNG.margeJeJahr;
  const margeRoh = margeGrund - b.beziehung * ABWAEGUNG.beziehungsFaktor;

  // Szene: was dem Gegenüber wichtig ist (seine größten Wünsche an die Türkei) und was es nie gibt (Rote Linien) oder am teuersten ist
  const frei = klauseln.filter((k) => !k.gesperrt);
  const wuensche = frei.filter((k) => k.def.seite === "gibt" && k.wert > 0).sort((x, y) => y.wert - x.wert).slice(0, 3);
  const roteLinien = klauseln.filter((k) => k.rot);
  const teuer = frei.filter((k) => k.def.seite === "will" && !k.rot && k.wert < 0).sort((x, y) => x.wert - y.wert).slice(0, 2);

  function unterbreite() {
    const r = verhandle(world, angebot);
    setAntwort(r);
    if (r.ok) {
      setGibt([]);
      setWill([]);
    }
    refresh();
    zeige();
  }

  function nimmAn(a: Angebot) {
    const r = nimmGegenangebot(world, a);
    setAntwort(r);
    if (r.ok) {
      setGibt([]);
      setWill([]);
    }
    refresh();
    zeige();
  }

  const satz = urteilSatz(b, nichts, sitz);
  const ton = nichts ? "leer" : b.urteil;
  const gewaehlt = (ids: string[]) => ids.map((id) => klauseln.find((k) => k.def.id === id)).filter((k): k is KlauselSicht => !!k);
  const linksListe = gewaehlt(gibt);
  const rechtsListe = gewaehlt(will);
  // Forderungen im eigenen Interesse des Partners liegen auf seiner Gewinnseite (links), wie die Rechnung in sim/abkommen.ts
  const links = b.gibtWert;
  const rechts = b.willKosten + b.grenze;

  const spalte = (seite: "gibt" | "will") => {
    const alle = klauseln.filter((k) => k.def.seite === seite);
    const laeuft = alle.filter((k) => aktiv.has(k.def.id));
    const sichtbar = alle.filter((k) => !laeuft.includes(k));
    const auswahl = seite === "gibt" ? gibt : will;
    return (
      <div className={`vt-spalte ${seite}`}>
        <h4>
          <Flagge id={seite === "gibt" ? "TUR" : landId} breite={24} titel={seite === "gibt" ? undefined : l.name} />
          <span>{seite === "gibt" ? t("welle_h6.spalte.bieten") : t("welle_h6.spalte.verlangen")}</span>
          <small>{seite === "gibt" ? t("welle_h6.spalte.bieten_legende", { sitz }) : t("welle_h6.spalte.verlangen_legende", { sitz })}</small>
        </h4>
        {THEMEN.map((th: Thema) => {
          const liste = sichtbar.filter((k) => themaVon(k.def.id, landId) === th);
          if (!liste.length) return null;
          return (
            <section key={th} className={`vt-thema th-${th}`} aria-label={t(`welle_h6.thema.${th}`)}>
              <h5>
                <span>{t(`welle_h6.thema.${th}`)}</span>
                <small>{liste.filter((k) => auswahl.includes(k.def.id)).length > 0 ? t("welle_h6.thema.gewaehlt", { n: liste.filter((k) => auswahl.includes(k.def.id)).length }) : ""}</small>
              </h5>
              <ul className="vt-karten">
                {liste.map((k) => (
                  <KlauselKarte key={k.def.id} k={k} partner={sitz} gewaehlt={auswahl.includes(k.def.id)} veto={veto(k.def.id)} onToggle={() => umschalten(k)} />
                ))}
              </ul>
            </section>
          );
        })}
        {laeuft.length > 0 && (
          <p className="vt-laeuft">
            <b>{t("welle_h6.spalte.laeuft")}</b> {laeuft.map((k) => k.label).join(" · ")}
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      <section className="vt" aria-label={t("ui2.ui.welt.Verhandlungstisch.7e59256", { p0: l.name })}>
        <div ref={kopf} className="vt-anker" />
        {antwort && (
          <div className={`vt-antwort u-${antwort.urteil}`} role="status">
            <span className="vt-stempel" aria-hidden>
              {antwort.urteil === "zustimmung" ? t("ui2.ui.welt.Verhandlungstisch.942f46c") : antwort.urteil === "gegenangebot" ? t("ui2.ui.welt.Verhandlungstisch.8477453") : antwort.urteil === "veto" ? t("ui2.ui.welt.Verhandlungstisch.66d4eee") : antwort.urteil === "ablehnung" ? t("ui2.ui.welt.Verhandlungstisch.110d6fe") : t("ui2.ui.welt.Verhandlungstisch.e70aeb2")}
            </span>
            <p>
              <strong>{antwort.text}</strong> {antwort.why && <em>{antwort.why}</em>}
            </p>
            {antwort.urteil === "gegenangebot" && antwort.bewertung && <GegenListe liste={antwort.bewertung.gegenangebote} onLaden={laden} onAnnehmen={nimmAn} />}
            {antwort.urteil === "zustimmung" && vertraegeLaufen > 0 && onVertraege && (
              <button type="button" className="knopf-leise" onClick={onVertraege}>
                {t("ui.welt.Verhandlungstisch.2bfb449")}
              </button>
            )}
          </div>
        )}

        {/* Die Szene: wer gegenübersitzt, was ihm wichtig ist, wo seine Grenzen liegen */}
        <header className="vt-szene">
          <Flagge id={landId} breite={64} rund titel={l.name} className="vt-szene-flagge" />
          <div className="vt-szene-kopf">
            <span className="vt-kicker">{t("welle_h6.szene.gegenueber")}</span>
            <h3>
              {sitz} <em>{haltungWort(world, landId)}</em>
            </h3>
          </div>
          <dl className="vt-kern">
            <div className={vertrauenZu(world, landId) >= 55 ? "gut" : vertrauenZu(world, landId) < 35 ? "schlecht" : ""}>
              <dt>{t("welle_h6.szene.vertrauen")}</dt>
              <dd>{Math.round(vertrauenZu(world, landId))}</dd>
            </div>
            <div className={z.konflikt >= 60 ? "schlecht" : ""}>
              <dt>{t("welle_h6.szene.streit")}</dt>
              <dd>{Math.round(z.konflikt)}</dd>
            </div>
            <div title={profil?.hebelText}>
              <dt>{t("welle_h6.szene.hebel")}</dt>
              <dd>{pz(profil?.hebel ?? 0, true)}</dd>
            </div>
          </dl>
          <div className="vt-marken">
            <div className="vt-marken-zeile">
              <span className="vt-marken-titel">{t("welle_h6.szene.wichtig", { sitz })}</span>
              {wuensche.map((k) => (
                <button key={k.def.id} type="button" className={`vt-marke plus${gibt.includes(k.def.id) ? " an" : ""}`} onClick={() => umschalten(k)} aria-pressed={gibt.includes(k.def.id)}>
                  {k.label} <b>{pz(k.wert, true)}</b>
                </button>
              ))}
            </div>
            <div className="vt-marken-zeile">
              <span className="vt-marken-titel">{t("welle_h6.szene.teuer", { sitz })}</span>
              {teuer.map((k) => (
                <span key={k.def.id} className="vt-marke minus">
                  {k.label} <b>{pz(k.wert, true)}</b>
                </span>
              ))}
            </div>
            <div className="vt-marken-zeile">
              <span className="vt-marken-titel">{t("welle_h6.szene.rot")}</span>
              {roteLinien.length ? (
                roteLinien.map((k) => (
                  <span key={k.def.id} className="vt-marke rot" title={k.rotText}>
                    {k.label}
                  </span>
                ))
              ) : (
                <em className="vt-marken-leer">{t("welle_h6.szene.rot_keine")}</em>
              )}
            </div>
          </div>
        </header>

        {/* Die Waage: dieselben Zahlen, die die Gegenseite rechnet */}
        <div className={`vt-waage u-${ton}`}>
          <div className="vt-schale geben">
            <span className="vt-schale-titel">{t("welle_h6.waage.links")}</span>
            <strong>{pz(links)}</strong>
            <ul>
              {linksListe.map((k) => (
                <li key={k.def.id}>
                  <button type="button" onClick={() => umschalten(k)} title={t("welle_h6.waage.entfernen")}>
                    {k.label} <b>{pz(k.wert, true)}</b>
                  </button>
                </li>
              ))}
              {rechtsListe.filter((k) => k.wert > 0).map((k) => (
                <li key={k.def.id} className="interesse">
                  <span>{k.label} <b>{pz(k.wert, true)}</b></span>
                </li>
              ))}
              {nichts || linksListe.length ? null : <li className="leer">{t("welle_h6.waage.nichts_geboten")}</li>}
            </ul>
          </div>
          <div className="vt-waage-mitte">
            <WaageBild links={links} rechts={rechts} leer={nichts} />
            <p className={`vt-urteil u-${ton}`} aria-live="polite">{satz}</p>
            {!nichts && b.urteil !== "veto" && b.gespraech && (
              <p className="vt-bilanz">
                {b.urteil === "zustimmung"
                  ? t("welle_h6.waage.reicht", { sitz, ueber: pz(b.punkte - b.grenze) })
                  : t("welle_h6.waage.fehlt", { fehlt: pz(b.grenze - b.punkte) })}
              </p>
            )}
            {b.urteil === "veto" && b.veto && <p className="vt-bilanz">{b.veto}</p>}
          </div>
          <div className="vt-schale verlangen">
            <span className="vt-schale-titel">{t("welle_h6.waage.rechts")}</span>
            <strong>{pz(rechts)}</strong>
            <ul>
              {rechtsListe.filter((k) => k.wert <= 0).map((k) => (
                <li key={k.def.id}>
                  <button type="button" onClick={() => umschalten(k)} title={t("welle_h6.waage.entfernen")}>
                    {k.label} <b>{k.rot ? t("ui2.ui.welt.Verhandlungstisch.66d4eee") : pz(k.wert)}</b>
                  </button>
                </li>
              ))}
              <li className="vorsprung" title={t("welle_h6.waage.vorsprung_titel", { sitz })}>
                <span>{t("welle_h6.waage.vorsprung", { sitz })} <b>{pz(b.grenze)}</b></span>
              </li>
            </ul>
          </div>

          {!nichts && b.urteil === "gegenangebot" && antwort?.urteil !== "gegenangebot" && (
            <div className="vt-wunsch">
              <h5>{t("welle_h6.waage.dafuer", { sitz })}</h5>
              <GegenListe liste={b.gegenangebote} onLaden={laden} />
            </div>
          )}

          <details className="vt-rechnung">
            <summary>{t("welle_h6.rechnung.titel", { sitz })}</summary>
            <table>
              <tbody>
                <tr>
                  <th scope="row">{t("welle_h6.rechnung.bekommt")}</th>
                  <td>{pz(b.gibtWert)}</td>
                </tr>
                <tr>
                  <th scope="row">{t("welle_h6.rechnung.gibt")}</th>
                  <td>{pz(-b.willKosten)}</td>
                </tr>
                <tr className="summe">
                  <th scope="row">{t("welle_h6.rechnung.saldo")}</th>
                  <td>{pz(b.punkte, true)}</td>
                </tr>
                <tr>
                  <th scope="row">{t("welle_h6.rechnung.grund", { jahre })}</th>
                  <td>{pz(margeGrund)}</td>
                </tr>
                {b.gruende
                  .filter((g) => g.quelle === "beziehung" && g.wert !== 0)
                  .map((g, i) => (
                    <tr key={i}>
                      <th scope="row">{g.text}</th>
                      <td>{pz(-g.wert, true)}</td>
                    </tr>
                  ))}
                {margeRoh < ABWAEGUNG.margeMin && (
                  <tr>
                    <th scope="row">{t("welle_h6.rechnung.untergrenze")}</th>
                    <td>{pz(ABWAEGUNG.margeMin - margeRoh, true)}</td>
                  </tr>
                )}
                <tr className="summe">
                  <th scope="row">{t("welle_h6.rechnung.marge")}</th>
                  <td>{pz(b.grenze)}</td>
                </tr>
              </tbody>
            </table>
            <p>{t("welle_h6.rechnung.regel")}</p>
          </details>
        </div>

        <div className="vt-spalten">
          {spalte("gibt")}
          {spalte("will")}
        </div>
      </section>
      {/* Die Leiste steht außerhalb des Tisch-Containers: Ein klebendes Element rutscht nicht über den Anfang seines Containers hinaus */}
      <div className={`vt-leiste u-${ton}`}>
        <div className="vt-leiste-urteil" aria-live="polite">
          <i aria-hidden />
          <span>{satz}</span>
        </div>
        <div className="vt-laufzeit" role="radiogroup" aria-label={t("ui2.ui.welt.Verhandlungstisch.f16dc6c")}>
          <span>{t("ui2.ui.welt.Verhandlungstisch.f16dc6c")}</span>
          {VERTRAGSLAUFZEITEN.map((j) => (
            <button key={j} type="button" role="radio" aria-checked={jahre === j} className={jahre === j ? "an" : ""} onClick={() => setJahre(j)} title={j === 2 ? t("ui2.ui.welt.Verhandlungstisch.1e30fb0") : j === 10 ? t("ui2.ui.welt.Verhandlungstisch.a1424ff") : t("ui2.ui.welt.Verhandlungstisch.2dfa660")}>
              {t("ui2.ui.welt.Verhandlungstisch.9bf247c", { p0: j })}
            </button>
          ))}
        </div>
        <div className="vt-abgabe">
          {rest > 0 ? (
            <span className="vt-sperre">{t("ui2.ui.welt.Verhandlungstisch.c82e52f", { p0: l.name, p1: rest })}</span>
          ) : (
            <>
              <span className={`vt-preis${nurAufPump(kapital, b.pk) ? " pump" : ""}`}>
                <b>{b.pk}</b> {t("welle_h6.leiste.kapital")}
                {nurAufPump(kapital, b.pk) ? <small>{t("welle_h6.leiste.pump")}</small> : null}
              </span>
              <button type="button" className="knopf-haupt vt-senden" disabled={nichts || !kannBezahlen} onClick={unterbreite}>
                {b.urteil === "veto" ? t("ui2.ui.welt.Verhandlungstisch.8269976") : t("ui2.ui.welt.Verhandlungstisch.c496d92")}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

import { Preisfeld, ReglerZeile } from "../bausteine/ReglerZeile";
import { Staatsfinanzen } from "./Staatsfinanzen";
import { HaushaltsRad } from "./HaushaltsRad";
import { geldAusBip } from "../../sim/staatsgeld";
// Der Haushalt wie in Democracy: oben die Bilanz (Einnahmen, Ausgaben, Defizit, Schulden), darunter je Ressort ein Regler mit Betrag in Lira
// und % des BIP, vorher → nachher, einer Wirkungszeile und dem Wunsch der zuständigen Ministerin oder des Ministers. Renten mit eigenen
// Stellgrößen (Rentenniveau, Renteneintrittsalter). Im Oktober-Fenster gehen Änderungen kostenlos in den Entwurf, sonst sind sie ein Nachtrag.
// Tiefe aufklappbar: Vorschau mit Folgen über zwölf Monate je Ressort, der Haushaltsplan 2026 mit Quellen.

import { behoerdenVerbrauch } from "../../sim/behoerden";
import { useEffect, useId, useRef, useState } from "react";
import type { World } from "../../sim/types";
import type { Aktion, Metric, PrognoseReihe } from "../../sim/forecast";
import { impulsKette } from "../../sim/folgen";
import { formatDateDe } from "../../sim/dates";
import { KENNZAHLEN_NACH_ID, einheitName } from "../../sim/wirtschaft-kennzahlen";
import { alleMarken, defizitJetzt, haushaltZustand, startMonat, verlauf, zinsausgabenJetzt } from "../../sim/wirtschaft";
import {
  HAUSHALT_ZYKLUS,
  PAKETE,
  POSTEN,
  POSTEN_NACH_ID,
  etatBip,
  haushaltsGesetzSicht,
  haushaltsEntwurfsSicht,
  haushaltsfenster,
  inSpanne,
  ministerWunsch,
  mrdJeStufe,
  paketInEntwurf,
  postenId,
  rentenSicht,
  stufeVon,
  wirksamVon,
  type PostenDef,
  type PostenGruppe,
} from "../../sim/haushalt";
import { forschungsSicht } from "../../sim/wissensbasis";
import { ministerFuer } from "../../sim/ministerfluss-kern";
import { REGELN } from "../../sim/handeln";
import { HaushaltsMehrheit } from "./HaushaltsMehrheit";
import { HaushaltsNachbericht } from "./HaushaltsBericht";
import { AUSGABEN_2026, PLAN_2026, STEUERN_2026 } from "../../data/haushaltsplan";
import { t, zahl } from "../../i18n";
import { useSprache } from "../../i18n/react";
import { UbDetailKopf } from "../akte/Uebersicht";
import { Diagramm } from "./Diagramm";
import { Folgen } from "./Folgen";
import { HaushaltsEntwurf } from "./HaushaltsEntwurf";
import { haushaltsPostenEntscheidung, fuehreHaushaltsPostenAus } from "../../sim/haushaltsentscheidung";
import { Wirkung } from "./Wirkung";
import { berechneReihen } from "./prognose";
import "./wirtschaft.css";
import "./haushalt.css";

const nf = (x: number, d = 1) => zahl(x, d);
const mrdText = (x: number) => zahl(Math.round(x), 0);
const bio = (mrd: number) => zahl(mrd / 1000, 1);
const vz = (x: number) => (x > 0 ? `+${x}` : x < 0 ? `−${Math.abs(x)}` : "0");


const METRIKEN: { id: Metric; kennzahl: string }[] = [
  { id: "defizit", kennzahl: "defizit" },
  { id: "debtRatio", kennzahl: "schulden" },
  { id: "growth", kennzahl: "wachstum" },
  { id: "inflation", kennzahl: "inflation" },
  { id: "unemployment", kennzahl: "arbeitslosigkeit" },
  { id: "riskPremium", kennzahl: "risiko" },
];

const GRUPPEN: PostenGruppe[] = ["renten", "soziales", "dienste", "sicherheit", "wirtschaft", "staat", "steuern"];


/** Der Betrag eines Postens bei einer Stufe: Etat in Mrd. Lira und % des BIP, Renten in ihren eigenen Einheiten. */
function betrag(world: World, p: PostenDef, stufe: number): string {
  if (p.id === "rentenniveau") return t("haushalt.ui.wert.niveau", { wert: nf(rentenSicht(world, stufe).niveau, 0) });
  if (p.id === "rentenalter") return t("haushalt.ui.wert.alter", { wert: nf(rentenSicht(world, undefined, stufe).alter, 0) });
  const bip = etatBip(p, stufe);
  if (bip === undefined) {
    const mrd = stufe * mrdJeStufe(p, world);
    return stufe === 0 ? t("haushalt.ui.wert.steuer_null") : t("haushalt.ui.wert.steuer", { mrd: `${mrd > 0 ? "+" : "−"}${mrdText(Math.abs(mrd))}` });
  }
  return t("haushalt.ui.wert.etat", { mrd: mrdText(geldAusBip(world, bip)), bip: nf(bip, 1) });
}

export function Haushalt({ world, geaendert, posten }: { world: World; geaendert: () => void; posten?: string | undefined }) {
  useSprache();
  const rueckRef=useRef<HTMLParagraphElement>(null);
  const z = haushaltZustand(world);
  const start = posten ? postenId(posten) : null;
  const [sel, setSel] = useState<string | null>(start);
  const [entwurf, setEntwurf] = useState<number | null>(start && POSTEN_NACH_ID[start] ? inSpanne(POSTEN_NACH_ID[start]!, stufeVon(world, start) + 1) : null);
  const [rueck, setRueck] = useState<{ ok: boolean; text: string; why?: string | undefined } | null>(null);
  const [metrik, setMetrik] = useState<Metric>("defizit");
  const [reihen, setReihen] = useState<PrognoseReihe[] | null>(null);
  const [rechnet, setRechnet] = useState(false);
  const [prognoseOffen,setPrognoseOffen]=useState(false);
  const [offen, setOffen] = useState<number | null>(null);
  const stand = Math.floor(world.day / 30);
  const p = sel ? POSTEN_NACH_ID[sel] : undefined;
  const entscheidung = p && entwurf !== null ? haushaltsPostenEntscheidung(world, p.id, entwurf) : null;
  const v = entscheidung?.vorschau;
  const fenster = haushaltsfenster(world);
  const gesetzSicht = haushaltsGesetzSicht(world);
  const entwurfEintraege = Object.entries(z.entwurf ?? {}).filter(([id, s]) => (z.stufen[id] ?? 0) !== s);

  // Die Vorschau über zwölf Monate rechnet erst, wenn der Regler kurz ruht
  useEffect(() => {
    setReihen(null);
    setRechnet(false);
    if (!prognoseOffen || !p || entwurf === null || entwurf === stufeVon(world, p.id)) {
      return;
    }
    let aktiv = true;
    const zeit = setTimeout(() => {
      setRechnet(true);
      const aktion: Aktion = { art: "posten", id: p.id, stufe: entwurf };
      berechneReihen(world, aktion, METRIKEN.map((m) => m.id), 12, 8)
        .then((r) => {
          if (!aktiv) return;
          setReihen(r);
          setRechnet(false);
        })
        .catch(() => aktiv && setRechnet(false));
    }, 300);
    return () => {
      aktiv = false;
      clearTimeout(zeit);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, entwurf, stand, prognoseOffen]);


  const maxAus = Math.max(...AUSGABEN_2026.map((x) => x.mrd));
  const maxSt = Math.max(...STEUERN_2026.map((x) => x.mrd));

  const r = reihen?.find((x) => x.metric === metrik);
  const mk = METRIKEN.find((m) => m.id === metrik)!;
  const k = KENNZAHLEN_NACH_ID[mk.kennzahl]!;
  const band = r ? { ohne: r.ohne, ...(r.mit.length ? { mit: r.mit, mitName: t("haushalt.ui.vorschau.mit", { posten: p?.name ?? "" }) } : {}) } : undefined;

  function waehle(id: string, s: number) {
    setSel(id);
    setEntwurf(s);
  }

  function beschliesse() {
    if (!entscheidung) return;
    const res = fuehreHaushaltsPostenAus(world, entscheidung);
    setRueck(res);
    if (res.ok) {
      setEntwurf(null);
      setSel(null);
      setPrognoseOffen(false);
    }
    geaendert();
    requestAnimationFrame(()=>rueckRef.current?.focus());
  }

  const defizit = defizitJetzt(world);
  const behoerdenSatz = () => {
    const verbrauch = behoerdenVerbrauch(structuredClone(world));

    return verbrauch.length === 0
      ? t("haushalt.ui.behoerden.keine")
      : t("haushalt.ui.behoerden.satz", {
          liste: verbrauch.map((x) => t("haushalt.ui.behoerden.posten", { posten: POSTEN_NACH_ID[x.posten]?.name ?? x.posten, etat: x.ausEtat, defizit: x.aufsDefizit > 0.0005 ? "ja" : "nein", d: x.aufsDefizit })),
        });
  };
  const detail = (id: string) => {
    if (id === "_bilanz")
      return (
        <div className="hh-im-detail">

        <Staatsfinanzen world={world} details />
        <p className="wi-hinweis hh-behoerden">{behoerdenSatz()}</p>
        </div>
      );
    if (id === "_abschluss") return <HaushaltsNachbericht world={world} geaendert={geaendert}/>;
    if (id === "_zyklus") return <div className="hh-im-detail">
        <p className="kicker">{t("haushalt.ui.zyklus.kicker")}</p>
        {fenster.offen ? (
          <>
            <h3>
              {t("haushalt.ui.zyklus.offen", { tage: fenster.tageRest })}
            </h3>
            <p className="wi-hinweis">{t("haushalt.ui.zyklus.offen_text")}</p>
            <h4>{t("haushalt.ui.zyklus.entwurf_fuer", { jahr: String(fenster.jahr + 1) })}</h4>
            {entwurfEintraege.length === 0 ? (
              <p className="wi-hinweis">{t("haushalt.ui.zyklus.entwurf_leer")}</p>
            ) : (
              <ul className="wi-marken">
                {entwurfEintraege.map(([id, s]) => {
                  const q = POSTEN_NACH_ID[id];
                  if (!q) return null;
                  return (
                    <li key={id}>
                      {q.name}: {betrag(world, q, z.stufen[id] ?? 0)} → <b>{betrag(world, q, s)}</b>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="wi-metriken" role="group" aria-label={t("haushalt.ui.zyklus.pakete")}>
              {Object.entries(PAKETE).map(([id, paket]) => (
                <button key={id} onClick={() => { const r = paketInEntwurf(world, id); setRueck(r); geaendert(); }}>
                  {t("haushalt.ui.zyklus.paket", { name: paket.name })}
                </button>
              ))}
            </div>
            <p className="wi-hinweis">{t("eo.paketHinweis")}</p>
            <HaushaltsEntwurf world={world} onErgebnis={r=>{setRueck(r);geaendert();requestAnimationFrame(()=>rueckRef.current?.focus());}}/>

          </>
        ) : fenster.gesetzUnterwegs && gesetzSicht ? (
          <>
            <h3>{t("haushalt.ui.zyklus.parlament", { tage: gesetzSicht.tageBis })}</h3>
            <p className="wi-hinweis">
              {t("haushalt.ui.zyklus.parlament_text", { ja: gesetzSicht.ja, noetig: REGELN.mehrheit })}{" "}
              {gesetzSicht.urteil === "sicher" ? t("haushalt.ui.zyklus.sicher") : gesetzSicht.luecke > 0 ? t("haushalt.ui.zyklus.luecke", { n: gesetzSicht.luecke }) : t("haushalt.ui.zyklus.knapp")}
            </p>
            <HaushaltsMehrheit world={world} geaendert={geaendert}/>
          </>
        ) : (
          <>
            <h3>{t("haushalt.ui.zyklus.naechstes", { jahr: fenster.naechsterStart.slice(0, 4), monate: fenster.monateBis })}</h3>
            <p className="wi-hinweis">
              {t("haushalt.ui.zyklus.geschlossen_text", { faktor: HAUSHALT_ZYKLUS.nachtragFaktor })}
              {fenster.letztesErgebnis && <> {t(`haushalt.ui.zyklus.ergebnis.${fenster.letztesErgebnis}`)}</>}
            </p>
            <HaushaltsNachbericht world={world} geaendert={geaendert}/>
          </>
        )}
      </div>;
    if (id === "_plan")
      return (
        <div className="hh-im-detail">
          <UbDetailKopf titel={t("haushalt.ui.plan.kicker")} unter={t("haushalt.ui.plan.titel", { aus: bio(PLAN_2026.ausgabenGesamt), ein: bio(PLAN_2026.einnahmenGesamt) })} />

        <p className="wi-hinweis">{t("haushalt.ui.plan.hinweis", { defizit: bio(PLAN_2026.defizit), bip: nf(PLAN_2026.defizitProzentBip) })}</p>
        <div className="wi-plan">
          <div>
            <h4>{t("haushalt.ui.plan.ausgaben")}</h4>
            <ul className="wi-plan-liste">
              {AUSGABEN_2026.map((x) => {
                const live = 0; // Der historische Plan bleibt eine unveränderte Referenz.
                return (
                  <li key={x.id} title={x.text}>
                    <span className="wi-plan-name">{x.name}</span>
                    <span className="wi-plan-balken" aria-hidden>
                      <i style={{ width: `${(x.mrd / maxAus) * 100}%` }} />
                    </span>
                    <span className="wi-plan-wert">{mrdText(x.mrd)}</span>
                    <span className={`wi-plan-live ${live > 5 ? "wi-mehr" : live < -5 ? "wi-weniger" : ""}`}>{Math.abs(live) >= 5 ? `${live > 0 ? "+" : "−"}${mrdText(Math.abs(live))}` : ""}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h4>{t("haushalt.ui.plan.steuern")}</h4>
            <ul className="wi-plan-liste">
              {STEUERN_2026.map((x) => (
                <li key={x.id} title={x.text}>
                  <span className="wi-plan-name">{x.name}</span>
                  <span className="wi-plan-balken" aria-hidden>
                    <i className="wi-steuer" style={{ width: `${(x.mrd / maxSt) * 100}%` }} />
                  </span>
                  <span className="wi-plan-wert">{mrdText(x.mrd)}</span>
                  <span className="wi-plan-live" />
                </li>
              ))}
            </ul>
          </div>
        </div>
              </div>
      );
    if (id === "_bisher") return <div className="hh-im-detail">
        <p className="kicker">{t("haushalt.ui.bisher.kicker")}</p>
        <h3>{t("haushalt.ui.bisher.titel")}</h3>
        {z.aenderungen.length === 0 ? (
          <p className="wi-hinweis">{t("haushalt.ui.bisher.leer")}</p>
        ) : (
          <ul className="wi-sitzungen">
            {[...z.aenderungen].reverse().map((a, i) => (
              <li key={a.tag + a.posten}>
                <button className="wi-sitzung" aria-expanded={offen === i} onClick={() => setOffen(offen === i ? null : i)}>
                  <span className="wi-wann">{formatDateDe(a.datum)}</span>
                  <span className="wi-beschluss-gross">{a.text}</span>
                </button>
                {offen === i && (
                  <div className="wi-sitzung-text">
                    <h4>{t("haushalt.ui.vorschau.danach")}</h4>
                    <ul>
                      {a.folgen.map((f, n) => (
                        <li key={n}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>;
    return null;
  };
  // Die Tafel nach dem Vorbild von Democracy 4 (Rückmeldung des Projektinhabers 5. November: „zu kompliziert“, „extrem lang
  // gezogen“): oben die Bilanz als Balken, darunter alle Posten auf einen Blick, je eine Zeile mit Regler. Wer einen Posten
  // verstellt, sieht Preis und Wirkung direkt darunter und beschließt dort. Verfahren, Ausgangslage und Verlauf stehen darunter.
  // Das Verfahren (Fenster, Abstimmung, Bericht nach dem Beschluss) steht offen; der Rest auf Wunsch
  const [mehr, setMehr] = useState<string | null>(posten?.startsWith("_") ? posten : "_zyklus");
  const mehrheit = gesetzSicht ?? haushaltsEntwurfsSicht(world);
  const tafelId = useId().replace(/:/g, "");
  const waehleZeile = (q: PostenDef, s: number) => {
    if (sel !== q.id) setPrognoseOffen(false);
    setRueck(null);
    waehle(q.id, inSpanne(q, s));
  };
  const zeile = (q: PostenDef) => {
    const ist = stufeVon(world, q.id);
    const plan = z.entwurf?.[q.id] ?? ist;
    const aktiv = sel === q.id && entwurf !== null;
    const zeigt = aktiv ? entwurf! : plan;
    const f = ministerFuer(world, q.amt);
    const wunsch = ministerWunsch(world, q.id);
    const offenWunsch = !!f && q.seite === "ausgabe" && q.id !== "rentenalter" && ist < wunsch;
    const runter = q.id === "rentenalter" ? t("haushalt.ui.regler.frueher") : q.seite === "ausgabe" ? t("haushalt.ui.regler.kuerzen") : t("haushalt.ui.regler.senken");
    const rauf = q.id === "rentenalter" ? t("haushalt.ui.regler.spaeter") : q.seite === "ausgabe" ? t("haushalt.ui.regler.ausbauen") : t("haushalt.ui.regler.anheben");
    return (
      <ReglerZeile
        key={q.id}
        kl="hd"
        zustand={`${sel === q.id ? "on" : ""}${zeigt !== ist ? " geaendert" : ""}`.trim()}
        name={
          <button type="button" className="hd-name" onClick={() => { setSel(q.id); setEntwurf(plan); setPrognoseOffen(false); }} title={q.text}>
            <span>{q.name}</span>
            {offenWunsch && <small>{t("haushalt.ui.kurz.wunsch", { stufe: vz(wunsch) })}</small>}
          </button>
        }
        wert={zeigt}
        min={q.min}
        max={q.max}
        onWert={(s) => waehleZeile(q, s)}
        minus={`${q.name}: ${runter}`}
        plus={`${q.name}: ${rauf}`}
        aria={t("haushalt.ui.regler.aria", { posten: q.name })}
        ariaWert={`${vz(zeigt)}: ${betrag(world, q, zeigt)}`}
        anzeigeKlasse="betrag"
        vorher={betrag(world, q, ist)}
        {...(zeigt !== ist ? { nachher: betrag(world, q, zeigt) } : {})}
      >
        {sel === q.id && aktiv && entscheidung && v && entwurf !== (fenster.offen ? z.entwurf?.[q.id] ?? ist : ist) && (
          <div className="hd-panel" role="region" aria-label={q.name}>
            <p className="hd-panel-wirkung">
              {q.wirkung}
              {ist !== 0 && Math.round((wirksamVon(world, q.id) / ist) * 100) < 95 && <> {t("haushalt.ui.reifung", { anteil: Math.round((wirksamVon(world, q.id) / ist) * 100), monate: q.reifeMonate })}</>}
              {q.id === "forschung" && (() => { const fo = forschungsSicht(world, etatBip(q, zeigt) ?? 0); return <> {t("haushalt.ui.forschung.grenze", { grenze: nf(fo.grenze, 2), verpufft: nf(fo.verpufft, 2) })}</>; })()}
              {zeigt > 2 && q.seite === "ausgabe" && q.id !== "forschung" && <> {t("haushalt.ui.abnehmend")}</>}
            </p>
            <Preisfeld
              kl="hd"
              fakten={[
                { label: t("eo.kapital"), wert: t("ve.pk", { n: entscheidung.pk }) },
                { label: t("haushalt.ui.vorschau.defizit"), wert: `${nf(v.defizitVorher, 2)} → ${nf(v.defizitNachher, 2)} %` },
                { label: t("eo.befugnis"), wert: t(entscheidung.modus === "entwurf" ? "eo.votum" : "eo.regierung") },
              ]}
            />
            <p className="hd-verteilung">
              <span><b>{t("haushalt.ui.vorschau.gewinner")}</b> {q.gewinner}</span>
              <span><b>{t("haushalt.ui.vorschau.verlierer")}</b> {q.verlierer}</span>
            </p>
            {entscheidung.modus !== "entwurf" && <p className="hd-hinweis">{t("eo.nachtragFolge", { leg: nf(entscheidung.legitimitaet, 2), loy: nf(entscheidung.loyalitaet, 2), monate: q.reifeMonate })}</p>}
            {entscheidung.grund && <p className="hd-gesperrt">{entscheidung.grund}</p>}
            <div className="hd-knoepfe">
              <button type="button" className="brass-button" disabled={!!entscheidung.grund} onClick={beschliesse}>
                {entscheidung.modus === "entwurf" ? t(entscheidung.entfernen ? "eo.entwurfEntfernen" : "eo.entwurfAendern") : t("haushalt.ui.knopf.nachtrag", { kapital: entscheidung.pk })}
              </button>
              <button type="button" className="pd-btn quiet" onClick={() => { setEntwurf(null); setSel(null); setPrognoseOffen(false); }}>{t("haushalt.ui.knopf.verwerfen")}</button>
            </div>
            <details className="hh-tiefe" onToggle={(e) => setPrognoseOffen(e.currentTarget.open)}>
              <summary>{t("haushalt.ui.vorschau.tiefe")}</summary>
              <p className="wi-kehrseite"><b>{t("haushalt.ui.vorschau.kehrseite")}</b> {q.kehrseite}</p>
              <Folgen titel={t("haushalt.ui.vorschau.danach")} glieder={impulsKette(v.impuls)} />
              <div className="wi-dauer">
                {v.zeilen.map((x) => (
                  <span key={x.text} className={`wi-chip ${x.gut === true ? "wi-gut" : x.gut === false ? "wi-schlecht" : "wi-neutral"}`}>
                    {x.richtung > 0 ? "▲" : "▼"} {x.text}
                  </span>
                ))}
              </div>
              <Wirkung reihen={reihen} metriken={METRIKEN.map((m) => ({ ...m, label: KENNZAHLEN_NACH_ID[m.kennzahl]?.name ?? m.kennzahl }))} rechnet={rechnet} />
              <div className="wi-metriken" role="group" aria-label={t("haushalt.ui.vorschau.groesse")}>
                {METRIKEN.map((m) => (
                  <button key={m.id} type="button" aria-pressed={metrik === m.id} className={metrik === m.id ? "on" : ""} onClick={() => setMetrik(m.id)}>
                    {KENNZAHLEN_NACH_ID[m.kennzahl]?.name ?? m.kennzahl}
                  </button>
                ))}
              </div>
              <Diagramm punkte={verlauf(world, mk.kennzahl)} startMonat={startMonat(world)} jetztMonat={world.date.slice(0, 7)} band={band} linien={k.linien?.(world)} marken={alleMarken(world).filter((m) => m.art === "haushalt" || m.art === "zins")} stellen={k.stellen} einheit={einheitName(k.einheit)} name={k.name} rechnet={rechnet} />
            </details>
          </div>
        )}
      </ReglerZeile>
    );
  };
  const seite = (welche: "ausgabe" | "einnahme") => (
    <section className="hd-seite" id={welche === "einnahme" ? `${tafelId}-einnahmen` : undefined} aria-label={t(welche === "ausgabe" ? "hd.ausgaben" : "hd.einnahmen")}>
      <h3>{t(welche === "ausgabe" ? "hd.ausgaben" : "hd.einnahmen")}</h3>
      {GRUPPEN.map((g) => {
        const liste = POSTEN.filter((q) => q.gruppe === g && q.seite === welche);
        if (!liste.length) return null;
        return (
          <div key={g} className="hd-gruppe" id={`${tafelId}-${g}`}>
            {welche === "ausgabe" && <h4>{t(`haushalt.gruppe.${g}`)}</h4>}
            <ul>{liste.map(zeile)}</ul>
          </div>
        );
      })}
    </section>
  );
  const mehrListe: { id: string; titel: string }[] = [
    { id: "_zyklus", titel: t("haushalt.ui.zyklus.kicker") },
    ...(z.abschluesse?.length ? [{ id: "_abschluss", titel: t("hb.titel") }] : []),
    { id: "_bilanz", titel: t("hd.rechnung") },
    { id: "_bisher", titel: t("haushalt.ui.bisher.titel") },
    { id: "_plan", titel: t("haushalt.ui.plan.kicker") },
  ];
  return (
    <div className="wi-hh hd">
      {rueck && (
        <p className={`rueckmeldung ${rueck.ok ? "ok" : "nein"} wi-rueck`} role="status" ref={rueckRef} tabIndex={-1}>
          {rueck.text}
          {rueck.why && <em> {rueck.why}</em>}
        </p>
      )}
      <section className="hd-bilanz" aria-label={t("hd.bilanz")}>
        <h2 className="hd-titel">{t("eo.haushalt")}</h2>
        <HaushaltsRad
          world={world}
          defizit={defizit}
          onZiel={(ziel) => document.getElementById(ziel === "steuern" ? `${tafelId}-einnahmen` : `${tafelId}-${ziel}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
        />
        <dl className="hd-kern">
          <div><dt>{t("hd.schulden")}</dt><dd>{nf(world.economy.debtRatio, 1)} %<small>{t("hd.desBip")}</small></dd></div>
          <div><dt>{t("hd.zinsen")}</dt><dd>{nf(zinsausgabenJetzt(world), 1)} %<small>{t("hd.desBip")}</small></dd></div>
        </dl>
        <p className="hd-fenster">
          {fenster.offen ? t("haushalt.ui.ressorts.hinweis_offen") : t("haushalt.ui.ressorts.hinweis_nachtrag", { faktor: HAUSHALT_ZYKLUS.nachtragFaktor })}
          {mehrheit && (
            <>
              {" "}
              <b>{t("hm.kachelStimmen", { datum: formatDateDe(mehrheit.datum) })}: {mehrheit.ja}</b> · {mehrheit.luecke ? t("gp.luecke", { n: mehrheit.luecke }) : t("gp.mehrheit")}
              {mehrheit.auslaufend.length ? ` ${t("hm.kachelFristen", { n: mehrheit.auslaufend.length })}` : ""}
            </>
          )}
        </p>
      </section>
      <div className="hd-spalten">
        {seite("ausgabe")}
        {seite("einnahme")}
      </div>
      <section className="hd-mehr" aria-label={t("hd.mehr")}>
        <div className="hd-mehr-reiter" role="group" aria-label={t("hd.mehr")}>
          {mehrListe.map((m) => (
            <button key={m.id} type="button" aria-pressed={mehr === m.id} className={mehr === m.id ? "on" : ""} onClick={() => setMehr(mehr === m.id ? null : m.id)}>
              {m.titel}
            </button>
          ))}
        </div>
        {mehr && <div className="hd-mehr-inhalt">{detail(mehr)}</div>}
      </section>
    </div>
  );
}

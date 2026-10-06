// Der Haushalt wie in Democracy: oben die Bilanz (Einnahmen, Ausgaben, Defizit, Schulden), darunter je Ressort ein Regler mit Betrag in Lira
// und % des BIP, vorher → nachher, einer Wirkungszeile und dem Wunsch der zuständigen Ministerin oder des Ministers. Renten mit eigenen
// Stellgrößen (Rentenniveau, Renteneintrittsalter). Im Oktober-Fenster gehen Änderungen kostenlos in den Entwurf, sonst sind sie ein Nachtrag.
// Tiefe aufklappbar: Vorschau mit Folgen über zwölf Monate je Ressort, der Haushaltsplan 2026 mit Quellen.

import { behoerdenVerbrauch } from "../../sim/behoerden";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  bringeHaushaltsgesetzEin,
  etatBip,
  haushaltsGesetzSicht,
  haushaltsStimmenKaufen,
  haushaltsfenster,
  impulsAusPosten,
  inSpanne,
  ministerWunsch,
  mrdJeStufe,
  paketInEntwurf,
  postenId,
  postenVorschau,
  rentenSicht,
  setzeEntwurf,
  setzePosten,
  stufeVon,
  wirksamVon,
  type PostenDef,
  type PostenGruppe,
} from "../../sim/haushalt";
import { forschungsSicht } from "../../sim/wissensbasis";
import { ministerFuer } from "../../sim/ministerfluss-kern";
import { REGELN, stimmenSicht } from "../../sim/handeln";
import { AUSGABEN_2026, PLAN_2026, STEUERN_2026 } from "../../data/haushaltsplan";
import { t, zahl } from "../../i18n";
import { useSprache } from "../../i18n/react";
import { Portraet } from "../art/Portraet";
import { Diagramm } from "./Diagramm";
import { Folgen } from "./Folgen";
import { Bestaetigung } from "./Bestaetigung";
import { Wirkung } from "./Wirkung";
import { berechneReihen } from "./prognose";
import "./wirtschaft.css";
import "./haushalt.css";

const nf = (x: number, d = 1) => zahl(x, d);
const mrdText = (x: number) => zahl(Math.round(x), 0);
const bio = (mrd: number) => zahl(mrd / 1000, 1);
const vz = (x: number) => (x > 0 ? `+${x}` : x < 0 ? `−${Math.abs(x)}` : "0");
const mrdAusBip = (bip: number) => bip * PLAN_2026.mrdProProzentBip;

const METRIKEN: { id: Metric; kennzahl: string }[] = [
  { id: "defizit", kennzahl: "defizit" },
  { id: "debtRatio", kennzahl: "schulden" },
  { id: "growth", kennzahl: "wachstum" },
  { id: "inflation", kennzahl: "inflation" },
  { id: "unemployment", kennzahl: "arbeitslosigkeit" },
  { id: "riskPremium", kennzahl: "risiko" },
];

const GRUPPEN: PostenGruppe[] = ["renten", "soziales", "dienste", "sicherheit", "wirtschaft", "staat", "steuern"];

const TINT: Record<string, string> = { stab: "#7c5823", finanzen: "#265a62", inneres: "#4a3f6b", aussen: "#2f5a8a", justiz: "#6b4a3a", generalstab: "#4c5a3a", wirtschaft: "#265a62" };

/** Der Betrag eines Postens bei einer Stufe: Etat in Mrd. Lira und % des BIP, Renten in ihren eigenen Einheiten. */
function betrag(world: World, p: PostenDef, stufe: number): string {
  if (p.id === "rentenniveau") return t("haushalt.ui.wert.niveau", { wert: nf(rentenSicht(world, stufe).niveau, 0) });
  if (p.id === "rentenalter") return t("haushalt.ui.wert.alter", { wert: nf(rentenSicht(world, undefined, stufe).alter, 0) });
  const bip = etatBip(p, stufe);
  if (bip === undefined) {
    const mrd = stufe * mrdJeStufe(p);
    return stufe === 0 ? t("haushalt.ui.wert.steuer_null") : t("haushalt.ui.wert.steuer", { mrd: `${mrd > 0 ? "+" : "−"}${mrdText(Math.abs(mrd))}` });
  }
  return t("haushalt.ui.wert.etat", { mrd: mrdText(mrdAusBip(bip)), bip: nf(bip, 1) });
}

function Minister({ world, p }: { world: World; p: PostenDef }) {
  const f = ministerFuer(world, p.amt);
  if (!f) return <span className="hh-minister leer" aria-hidden />;
  return (
    <span className="hh-minister" title={`${f.name}, ${f.rolle}`}>
      <Portraet seed={f.name} size={36} geschlecht={f.weiblich ? "f" : "m"} tint={TINT[p.amt] ?? "#7c5823"} rolle={p.amt} rahmen="keiner" lebendig={false} />
    </span>
  );
}

function Zeile({ world, p, aktiv, wert, plan, onWahl, children }: { world: World; p: PostenDef; aktiv: boolean; wert: number; plan: number; onWahl: (s: number) => void; children?: ReactNode }) {
  const ist = stufeVon(world, p.id);
  const wirksam = wirksamVon(world, p.id);
  const f = ministerFuer(world, p.amt);
  const wunsch = ministerWunsch(world, p.id);
  const zeigt = aktiv ? wert : plan;
  const anteil = ist !== 0 ? Math.round((wirksam / ist) * 100) : 100;
  const forschung = p.id === "forschung" ? forschungsSicht(world, etatBip(p, zeigt) ?? 0) : null;
  return (
    <li className={`hh-zeile${aktiv ? " on" : ""}`}>
      <div className="hh-kopf">
        <Minister world={world} p={p} />
        <div className="hh-name">
          <b>{p.name}</b>
          <span className="hh-text">{p.text}</span>
        </div>
        <div className="hh-betrag">
          {zeigt !== ist ? (
            <>
              <s>{betrag(world, p, ist)}</s> <span aria-hidden>→</span> <b>{betrag(world, p, zeigt)}</b>
            </>
          ) : (
            <b>{betrag(world, p, ist)}</b>
          )}
        </div>
      </div>
      <div className="hh-regler">
        <span className="hh-rand">{p.id === "rentenalter" ? t("haushalt.ui.regler.frueher") : p.seite === "ausgabe" ? t("haushalt.ui.regler.kuerzen") : t("haushalt.ui.regler.senken")}</span>
        <input
          type="range"
          min={p.min}
          max={p.max}
          step={1}
          value={zeigt}
          aria-label={t("haushalt.ui.regler.aria", { posten: p.name })}
          aria-valuetext={`${vz(zeigt)}: ${betrag(world, p, zeigt)}`}
          onChange={(e) => onWahl(Number(e.target.value))}
        />
        <span className="hh-rand">{p.id === "rentenalter" ? t("haushalt.ui.regler.spaeter") : p.seite === "ausgabe" ? t("haushalt.ui.regler.ausbauen") : t("haushalt.ui.regler.anheben")}</span>
        <span className="hh-stufe">{vz(zeigt)}</span>
      </div>
      <p className="hh-wirkung">
        {p.wirkung}
        {ist !== 0 && anteil < 95 && <> {t("haushalt.ui.reifung", { anteil, monate: p.reifeMonate })}</>}
        {forschung && <> {t("haushalt.ui.forschung.grenze", { grenze: nf(forschung.grenze, 2), verpufft: nf(forschung.verpufft, 2) })}</>}
        {zeigt > 2 && p.seite === "ausgabe" && p.id !== "forschung" && <> {t("haushalt.ui.abnehmend")}</>}
      </p>
      {f && p.seite === "ausgabe" && p.id !== "rentenalter" && (
        <p className={`hh-wunsch${ist >= wunsch ? " erfuellt" : ""}`}>
          {ist >= wunsch ? t("haushalt.ui.wunsch.erfuellt", { name: f.name }) : t("haushalt.ui.wunsch.offen", { name: f.name, stufe: vz(wunsch), betrag: betrag(world, p, wunsch) })}
        </p>
      )}
      {children}
    </li>
  );
}

export function Haushalt({ world, geaendert, posten }: { world: World; geaendert: () => void; posten?: string | undefined }) {
  useSprache();
  const z = haushaltZustand(world);
  const start = posten ? postenId(posten) : null;
  const [sel, setSel] = useState<string | null>(start);
  const [entwurf, setEntwurf] = useState<number | null>(start && POSTEN_NACH_ID[start] ? inSpanne(POSTEN_NACH_ID[start]!, stufeVon(world, start) + 1) : null);
  const [bestaetigt, setBestaetigt] = useState(false);
  const [gesetzBestaetigt, setGesetzBestaetigt] = useState(false);
  const [rueck, setRueck] = useState<{ ok: boolean; text: string; why?: string | undefined } | null>(null);
  const [metrik, setMetrik] = useState<Metric>("defizit");
  const [reihen, setReihen] = useState<PrognoseReihe[] | null>(null);
  const [rechnet, setRechnet] = useState(false);
  const [offen, setOffen] = useState<number | null>(null);
  const stand = Math.floor(world.day / 30);
  const p = sel ? POSTEN_NACH_ID[sel] : undefined;
  const v = p && entwurf !== null ? postenVorschau(world, p.id, entwurf) : null;
  const fenster = haushaltsfenster(world);
  const gesetzSicht = haushaltsGesetzSicht(world);
  const entwurfEintraege = Object.entries(z.entwurf ?? {}).filter(([id, s]) => (z.stufen[id] ?? 0) !== s);
  const stimmen = stimmenSicht(world);

  // Die Vorschau über zwölf Monate rechnet erst, wenn der Regler kurz ruht
  useEffect(() => {
    if (!p || entwurf === null || entwurf === stufeVon(world, p.id)) {
      setReihen(null);
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
  }, [sel, entwurf, stand]);

  useEffect(() => {
    if (posten) document.getElementById("wi-hh-regler")?.scrollIntoView({ block: "start" });
  }, [posten]);

  // Die Bilanz: Haushaltsgesetz 2026 plus die eigenen Regler, Zinsen im Stand des Spiels
  const bilanz = useMemo(() => {
    let aus = 0;
    let ein = 0;
    for (const q of POSTEN) {
      const st = z.stufen[q.id] ?? 0;
      if (!st) continue;
      if (q.seite === "ausgabe") aus += st * mrdJeStufe(q);
      else ein += st * mrdJeStufe(q);
    }
    const zinsen = mrdAusBip(zinsausgabenJetzt(world));
    return { ausgaben: PLAN_2026.ausgabenGesamt + aus + (zinsen - mrdAusBip(PLAN_2026.zinsenProzentBip)), einnahmen: PLAN_2026.einnahmenGesamt + ein, zinsen };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [z.stufen, stand]);
  const maxAus = Math.max(...AUSGABEN_2026.map((x) => x.mrd));
  const maxSt = Math.max(...STEUERN_2026.map((x) => x.mrd));

  const r = reihen?.find((x) => x.metric === metrik);
  const mk = METRIKEN.find((m) => m.id === metrik)!;
  const k = KENNZAHLEN_NACH_ID[mk.kennzahl]!;
  const band = r ? { ohne: r.ohne, ...(r.mit.length ? { mit: r.mit, mitName: t("haushalt.ui.vorschau.mit", { posten: p?.name ?? "" }) } : {}) } : undefined;

  function waehle(id: string, s: number) {
    setSel(id);
    setEntwurf(s);
    setBestaetigt(false);
  }

  function beschliesse() {
    if (!p || entwurf === null) return;
    // WIR-3: Im offenen Fenster geht die Änderung kostenlos in den Entwurf, sonst ist sie ein Nachtrag
    const res = v?.zyklus.modus === "entwurf" ? setzeEntwurf(world, p.id, entwurf) : setzePosten(world, p.id, entwurf);
    setRueck(res);
    setBestaetigt(false);
    if (res.ok) {
      setEntwurf(null);
      setSel(null);
    }
    geaendert();
  }

  const vorschauBlock = p && v && entwurf !== null && entwurf !== stufeVon(world, p.id) && (
    <div className="wi-hh-vorschau" aria-live="polite">
      <dl className="wi-zahlen">
        <div>
          <dt>{t("haushalt.ui.vorschau.kapital")}</dt>
          <dd>{v.kapital}</dd>
        </div>
        <div>
          <dt>{t("haushalt.ui.vorschau.defizit")}</dt>
          <dd>
            {nf(v.defizitVorher, 2)} → {nf(v.defizitNachher, 2)} %
          </dd>
        </div>
        <div>
          <dt>{t("haushalt.ui.vorschau.jahr")}</dt>
          <dd>
            {v.impuls >= 0 ? "+" : "−"}
            {t("haushalt.ui.vorschau.mrd", { mrd: mrdText(Math.abs(v.impuls) * PLAN_2026.mrdProProzentBip), bip: nf(Math.abs(v.impuls), 2) })}
          </dd>
        </div>
      </dl>
      <div className="wi-verteilung">
        <span>
          <b>{t("haushalt.ui.vorschau.gewinner")}</b> {p.gewinner}
        </span>
        <span>
          <b>{t("haushalt.ui.vorschau.verlierer")}</b> {p.verlierer}
        </span>
      </div>
      <p className="wi-kehrseite">
        <b>{t("haushalt.ui.vorschau.kehrseite")}</b> {p.kehrseite}
      </p>
      <details className="hh-tiefe">
        <summary>{t("haushalt.ui.vorschau.tiefe")}</summary>
        <Folgen titel={t("haushalt.ui.vorschau.danach")} glieder={impulsKette(v.impuls)} />
        <h4>{t("haushalt.ui.vorschau.netz")}</h4>
        <div className="wi-dauer">
          {v.zeilen.map((x) => (
            <span key={x.text} className={`wi-chip ${x.gut === true ? "wi-gut" : x.gut === false ? "wi-schlecht" : "wi-neutral"}`}>
              {x.richtung > 0 ? "▲" : "▼"} {x.text}
            </span>
          ))}
        </div>
        <Wirkung reihen={reihen} metriken={METRIKEN.map((m) => ({ ...m, label: KENNZAHLEN_NACH_ID[m.kennzahl]?.name ?? m.kennzahl }))} rechnet={rechnet} />
        <div className="wi-metriken" role="tablist" aria-label={t("haushalt.ui.vorschau.groesse")}>
          {METRIKEN.map((m) => (
            <button key={m.id} role="tab" aria-selected={metrik === m.id} className={metrik === m.id ? "on" : ""} onClick={() => setMetrik(m.id)}>
              {KENNZAHLEN_NACH_ID[m.kennzahl]?.name ?? m.kennzahl}
            </button>
          ))}
        </div>
        <Diagramm punkte={verlauf(world, mk.kennzahl)} startMonat={startMonat(world)} jetztMonat={world.date.slice(0, 7)} band={band} linien={k.linien?.(world)} marken={alleMarken(world).filter((m) => m.art === "haushalt" || m.art === "zins")} stellen={k.stellen} einheit={einheitName(k.einheit)} name={k.name} rechnet={rechnet} />
      </details>
      <p className="wi-hinweis">{v.zyklus.hinweis}</p>
      {!v.ok && v.grund && <p className="wi-grund">{v.grund}</p>}
      {bestaetigt ? (
        <Bestaetigung name={world.player?.name ?? ""} titel={v.zyklus.modus === "entwurf" ? t("haushalt.ui.bestaetigung.entwurf", { posten: p.name }) : t("haushalt.ui.bestaetigung.nachtrag", { posten: p.name })} knopf={t("haushalt.ui.knopf.beschliessen")} onJa={beschliesse} onNein={() => setBestaetigt(false)}>
          <p>
            {p.name}: {betrag(world, p, stufeVon(world, p.id))} → {betrag(world, p, entwurf)}.{" "}
            {v.zyklus.modus === "entwurf" ? t("haushalt.ui.bestaetigung.entwurf_text") : t("haushalt.ui.bestaetigung.nachtrag_text", { kapital: v.kapital, vorher: nf(v.defizitVorher, 2), nachher: nf(v.defizitNachher, 2) })}
          </p>
        </Bestaetigung>
      ) : (
        <button className="wi-handlung wi-haupt" disabled={!v.ok} onClick={() => setBestaetigt(true)}>
          {v.zyklus.modus === "entwurf" ? t("haushalt.ui.knopf.entwurf") : t("haushalt.ui.knopf.nachtrag", { kapital: v.kapital })} <span aria-hidden>→</span>
        </button>
      )}
      <button className="pd-btn quiet" onClick={() => { setSel(null); setEntwurf(null); }}>
        {t("haushalt.ui.knopf.verwerfen")}
      </button>
    </div>
  );

  const defizit = defizitJetzt(world);
  const verbrauch = behoerdenVerbrauch(world);

  return (
    <div className="wi-hh">
      {rueck && (
        <p className={`rueckmeldung ${rueck.ok ? "ok" : "nein"} wi-rueck`} role="status">
          {rueck.text}
          {rueck.why && <em> {rueck.why}</em>}
        </p>
      )}

      <section className="wi-karte hh-bilanz">
        <p className="kicker">{t("haushalt.ui.bilanz.kicker")}</p>
        <h3>{defizit > 0 ? t("haushalt.ui.bilanz.titel_defizit", { defizit: nf(defizit, 1) }) : t("haushalt.ui.bilanz.titel_ueberschuss", { wert: nf(-defizit, 1) })}</h3>
        <dl className="hh-bilanz-zahlen">
          <div>
            <dt>{t("haushalt.ui.bilanz.einnahmen")}</dt>
            <dd>{t("haushalt.ui.bilanz.bio", { bio: bio(bilanz.einnahmen) })}</dd>
          </div>
          <div>
            <dt>{t("haushalt.ui.bilanz.ausgaben")}</dt>
            <dd>{t("haushalt.ui.bilanz.bio", { bio: bio(bilanz.ausgaben) })}</dd>
          </div>
          <div className={defizit > 3 ? "hh-warn" : ""}>
            <dt>{t("haushalt.ui.bilanz.defizit")}</dt>
            <dd>{nf(defizit, 1)} %</dd>
          </div>
          <div>
            <dt>{t("haushalt.ui.bilanz.schulden")}</dt>
            <dd>{nf(world.economy.debtRatio, 1)} %</dd>
          </div>
          <div>
            <dt>{t("haushalt.ui.bilanz.zinsen")}</dt>
            <dd>{nf(zinsausgabenJetzt(world), 1)} %</dd>
          </div>
        </dl>
        <p className="wi-hinweis">
          {t("haushalt.ui.bilanz.hinweis", { grund: nf(world.economy.deficit), regler: nf(impulsAusPosten(world)), impuls: nf(world.economy.fiscalImpulse), massnahmen: nf(world.economy.policyCost, 2), zins: nf(world.economy.zinsMehrlast ?? 0, 2) })}
        </p>
      </section>

      <section className="wi-karte" id="wi-hh-zyklus">
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
            {gesetzBestaetigt ? (
              <Bestaetigung name={world.player?.name ?? ""} titel={t("haushalt.ui.zyklus.einbringen", { jahr: String(fenster.jahr + 1) })} knopf={t("haushalt.ui.knopf.einbringen")} onJa={() => { const r = bringeHaushaltsgesetzEin(world); setRueck(r); setGesetzBestaetigt(false); geaendert(); }} onNein={() => setGesetzBestaetigt(false)}>
                <p>{t("haushalt.ui.zyklus.einbringen_text", { n: entwurfEintraege.length, tage: REGELN.tageBisAbstimmung, erwartet: stimmen.erwartet, noetig: REGELN.mehrheit })}</p>
              </Bestaetigung>
            ) : (
              <button className="wi-handlung wi-haupt" disabled={entwurfEintraege.length === 0} onClick={() => setGesetzBestaetigt(true)}>
                {t("haushalt.ui.zyklus.einbringen", { jahr: String(fenster.jahr + 1) })} <span aria-hidden>→</span>
              </button>
            )}
          </>
        ) : fenster.gesetzUnterwegs && gesetzSicht ? (
          <>
            <h3>{t("haushalt.ui.zyklus.parlament", { tage: gesetzSicht.tageBis })}</h3>
            <p className="wi-hinweis">
              {t("haushalt.ui.zyklus.parlament_text", { ja: gesetzSicht.ja, noetig: REGELN.mehrheit })}{" "}
              {gesetzSicht.urteil === "sicher" ? t("haushalt.ui.zyklus.sicher") : gesetzSicht.luecke > 0 ? t("haushalt.ui.zyklus.luecke", { n: gesetzSicht.luecke }) : t("haushalt.ui.zyklus.knapp")}
            </p>
            {gesetzSicht.noetig > 0 && (
              <button className="wi-handlung" disabled={!gesetzSicht.bezahlbar} title={gesetzSicht.bezahlbar ? "" : t("haushalt.ui.zyklus.kein_kapital")} onClick={() => { const r = haushaltsStimmenKaufen(world, gesetzSicht.noetig); setRueck(r); geaendert(); }}>
                {t("haushalt.ui.zyklus.sichern", { n: gesetzSicht.noetig, kosten: gesetzSicht.kosten })} <span aria-hidden>→</span>
              </button>
            )}
          </>
        ) : (
          <>
            <h3>{t("haushalt.ui.zyklus.naechstes", { jahr: fenster.naechsterStart.slice(0, 4), monate: fenster.monateBis })}</h3>
            <p className="wi-hinweis">
              {t("haushalt.ui.zyklus.geschlossen_text", { faktor: HAUSHALT_ZYKLUS.nachtragFaktor })}
              {fenster.letztesErgebnis && <> {t(`haushalt.ui.zyklus.ergebnis.${fenster.letztesErgebnis}`)}</>}
            </p>
          </>
        )}
      </section>

      <section className="wi-karte" id="wi-hh-regler">
        <p className="kicker">{fenster.offen ? t("haushalt.ui.ressorts.kicker_entwurf") : t("haushalt.ui.ressorts.kicker_nachtrag")}</p>
        <h3>{t("haushalt.ui.ressorts.titel")}</h3>
        <p className="wi-hinweis">{fenster.offen ? t("haushalt.ui.ressorts.hinweis_offen") : t("haushalt.ui.ressorts.hinweis_nachtrag", { faktor: HAUSHALT_ZYKLUS.nachtragFaktor })}</p>
        <p className="wi-hinweis hh-behoerden">
          {verbrauch.length === 0
            ? t("haushalt.ui.behoerden.keine")
            : t("haushalt.ui.behoerden.satz", {
                liste: verbrauch.map((x) => t("haushalt.ui.behoerden.posten", { posten: POSTEN_NACH_ID[x.posten]?.name ?? x.posten, etat: x.ausEtat, defizit: x.aufsDefizit > 0.0005 ? "ja" : "nein", d: x.aufsDefizit })),
              })}
        </p>
        {GRUPPEN.map((g) => (
          <div key={g} className="hh-gruppe">
            <h4>{t(`haushalt.gruppe.${g}`)}</h4>
            {g === "renten" && <p className="hh-text">{t("haushalt.ui.renten.etat", { etat: nf(rentenSicht(world).etat, 1), mrd: mrdText(mrdAusBip(rentenSicht(world).etat)) })}</p>}
            <ul className="hh-liste">
              {POSTEN.filter((q) => q.gruppe === g).map((q) => {
                const aktiv = sel === q.id;
                const plan = z.entwurf?.[q.id] ?? stufeVon(world, q.id);
                return (
                  <Zeile key={q.id} world={world} p={q} aktiv={aktiv} wert={aktiv && entwurf !== null ? entwurf : plan} plan={plan} onWahl={(s) => waehle(q.id, s)}>
                    {aktiv && vorschauBlock}
                  </Zeile>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <details className="wi-karte hh-plan" id="wi-hh-plan">
        <summary>
          <span className="kicker">{t("haushalt.ui.plan.kicker")}</span> {t("haushalt.ui.plan.titel", { aus: bio(PLAN_2026.ausgabenGesamt), ein: bio(PLAN_2026.einnahmenGesamt) })}
        </summary>
        <p className="wi-hinweis">{t("haushalt.ui.plan.hinweis", { defizit: bio(PLAN_2026.defizit), bip: nf(PLAN_2026.defizitProzentBip) })}</p>
        <div className="wi-plan">
          <div>
            <h4>{t("haushalt.ui.plan.ausgaben")}</h4>
            <ul className="wi-plan-liste">
              {AUSGABEN_2026.map((x) => {
                const live = x.id === "zinsen" ? bilanz.zinsen - x.mrd : 0;
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
        <p className="wi-quelle">
          {t("haushalt.ui.plan.quellen")}{" "}
          {PLAN_2026.quellen.map((q, i) => (
            <span key={q.url}>
              {i > 0 && "; "}
              <a href={q.url} target="_blank" rel="noreferrer">
                {q.name}
              </a>
            </span>
          ))}
          . {PLAN_2026.hinweis} {t("haushalt.ui.plan.ressorts_beleg")}
        </p>
      </details>

      <section className="wi-karte">
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
      </section>
    </div>
  );
}

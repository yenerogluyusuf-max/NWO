import { Staatsfinanzen } from "./Staatsfinanzen";
import { geldAusBip } from "../../sim/staatsgeld";
// Der Haushalt wie in Democracy: oben die Bilanz (Einnahmen, Ausgaben, Defizit, Schulden), darunter je Ressort ein Regler mit Betrag in Lira
// und % des BIP, vorher → nachher, einer Wirkungszeile und dem Wunsch der zuständigen Ministerin oder des Ministers. Renten mit eigenen
// Stellgrößen (Rentenniveau, Renteneintrittsalter). Im Oktober-Fenster gehen Änderungen kostenlos in den Entwurf, sonst sind sie ein Nachtrag.
// Tiefe aufklappbar: Vorschau mit Folgen über zwölf Monate je Ressort, der Haushaltsplan 2026 mit Quellen.

import { behoerdenVerbrauch } from "../../sim/behoerden";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
import { Portraet } from "../art/Portraet";
import { UbDetailKopf, type UbKachel } from "../akte/Uebersicht";
import { Diagramm } from "./Diagramm";
import { Folgen } from "./Folgen";
import { EntscheidungsKarte } from "../entscheidungen/EntscheidungsKarte";
import { HaushaltsArbeitsplatz } from "./HaushaltsArbeitsplatz";
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

const TINT: Record<string, string> = { stab: "#7c5823", finanzen: "#265a62", inneres: "#4a3f6b", aussen: "#2f5a8a", justiz: "#6b4a3a", generalstab: "#4c5a3a", wirtschaft: "#265a62" };

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
    <div className={`hh-zeile${aktiv ? " on" : ""}`}>
      <div className="hh-kopf">
        <div className="hh-name">
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
    </div>
  );
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
  const entwurfsSicht = haushaltsEntwurfsSicht(world);
  const mehrheit = gesetzSicht ?? entwurfsSicht;

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

  const vorschauBlock = p && v && entscheidung && entwurf !== null && entwurf !== (fenster.offen ? z.entwurf?.[p.id] ?? stufeVon(world,p.id) : stufeVon(world,p.id)) && (
    <div className="wi-hh-vorschau">
    <EntscheidungsKarte kicker={t(entscheidung.modus === "entwurf" ? "eo.entwurf" : "eo.nachtrag")} titel={p.name} einleitung={p.wirkung}
      fakten={[
        {label:t("eo.kapital"),wert:t("ve.pk",{n:entscheidung.pk})},
        {label:t("haushalt.ui.vorschau.defizit"),wert:`${nf(v.defizitVorher,2)} → ${nf(v.defizitNachher,2)} %`,hinweis:entscheidung.modus==="entwurf"?t("eo.nachAnnahme"):t("eo.sofort")},
        {label:t("sf.finanzwirkung"),wert:t("sf.betrag",{n:nf(entscheidung.finanzMrd,1)}),hinweis:t("sf.preisHinweis")},
        {label:t("eo.befugnis"),wert:t(entscheidung.modus==="entwurf"?"eo.votum":"eo.regierung"),hinweis:t(entscheidung.modus==="entwurf"?"eo.entwurfNur":"eo.keinVotum")},
      ]}
      aktion={entscheidung.modus==="entwurf"?t(entscheidung.entfernen?"eo.entwurfEntfernen":"eo.entwurfAendern"):t("haushalt.ui.knopf.nachtrag",{kapital:entscheidung.pk})}
      gesperrt={entscheidung.grund} hinweis={v.zyklus.hinweis} onAusfuehren={beschliesse}>
      <p>{p.name}: {betrag(world,p,stufeVon(world,p.id))} → <b>{betrag(world,p,entwurf)}</b></p>
      <p>{entscheidung.modus==="entwurf"?t("eo.entwurfWirkung"):t("eo.nachtragFolge",{leg:nf(entscheidung.legitimitaet,2),loy:nf(entscheidung.loyalitaet,2),monate:p.reifeMonate})}</p>
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
      <details className="hh-tiefe" onToggle={e=>setPrognoseOffen(e.currentTarget.open)}>
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
        <div className="wi-metriken" role="group" aria-label={t("haushalt.ui.vorschau.groesse")}>
          {METRIKEN.map((m) => (
            <button key={m.id} type="button" aria-pressed={metrik === m.id} className={metrik === m.id ? "on" : ""} onClick={() => setMetrik(m.id)}>
              {KENNZAHLEN_NACH_ID[m.kennzahl]?.name ?? m.kennzahl}
            </button>
          ))}
        </div>
        <Diagramm punkte={verlauf(world, mk.kennzahl)} startMonat={startMonat(world)} jetztMonat={world.date.slice(0, 7)} band={band} linien={k.linien?.(world)} marken={alleMarken(world).filter((m) => m.art === "haushalt" || m.art === "zins")} stellen={k.stellen} einheit={einheitName(k.einheit)} name={k.name} rechnet={rechnet} />
      </details>
    </EntscheidungsKarte>
      <button type="button" className="pd-btn quiet" onClick={() => {setEntwurf(null);setPrognoseOffen(false);}}>{t("haushalt.ui.knopf.verwerfen")}</button>
    </div>
  );

  const defizit = defizitJetzt(world);
  const behoerdenSatz = () => {
    const verbrauch = behoerdenVerbrauch(structuredClone(world));

    return verbrauch.length === 0
      ? t("haushalt.ui.behoerden.keine")
      : t("haushalt.ui.behoerden.satz", {
          liste: verbrauch.map((x) => t("haushalt.ui.behoerden.posten", { posten: POSTEN_NACH_ID[x.posten]?.name ?? x.posten, etat: x.ausEtat, defizit: x.aufsDefizit > 0.0005 ? "ja" : "nein", d: x.aufsDefizit })),
        });
  };
  const kacheln: UbKachel[] = [
    ...(z.abschluesse?.length?[{id:"_abschluss",gruppe:t("haushalt.ui.gruppe_lage"),titel:t("hb.titel"),zeile:t("hb.kachel"),wert:String(z.abschluesse.at(-1)!.ja),wertLabel:t("gp.votum")}]:[]),
    {
      id: "_bilanz",
      gruppe: t("haushalt.ui.gruppe_lage"),
      titel: t("haushalt.ui.bilanz.kicker"),
      wert: `${nf(defizit, 1)} %`,
      wertLabel: t("haushalt.ui.bilanz.defizit"),
      zeile: t("haushalt.ui.bilanz.kurz", { schulden: nf(world.economy.debtRatio, 1), zinsen: nf(zinsausgabenJetzt(world), 1) }),
      ton: defizit > 3 ? "schlecht" : defizit > 1.5 ? "mittel" : "gut",
    },
    {
      id: "_zyklus",
      gruppe: t("haushalt.ui.gruppe_lage"),
      titel: t("haushalt.ui.zyklus.kicker"),
      ...(mehrheit ? { wert: String(mehrheit.ja), wertLabel: t("hm.kachelStimmen", { datum:formatDateDe(mehrheit.datum) }) } : {}),
      zeile: mehrheit
        ? `${mehrheit.luecke ? t("gp.luecke",{n:mehrheit.luecke}) : t("gp.mehrheit")}${mehrheit.auslaufend.length ? ` ${t("hm.kachelFristen",{n:mehrheit.auslaufend.length})}` : ""}`
        : fenster.offen
        ? t("haushalt.ui.zyklus.offen", { tage: fenster.tageRest })
        : fenster.gesetzUnterwegs && gesetzSicht
          ? t("haushalt.ui.zyklus.parlament", { tage: gesetzSicht.tageBis })
          : t("haushalt.ui.zyklus.naechstes", { jahr: fenster.naechsterStart.slice(0, 4), monate: fenster.monateBis }),
      ...(fenster.offen
        ? { marke: { text: t("haushalt.ui.zyklus.marke_offen", { n: entwurfEintraege.length }), ton: "aktiv" as const }, ton: "aktiv" as const }
        : fenster.gesetzUnterwegs && gesetzSicht
          ? { marke: { text: t(`gesetz.ui.urteil.${gesetzSicht.urteil === "sicher" ? "sicher" : gesetzSicht.luecke > 0 ? "verloren" : "knapp"}`), ton: gesetzSicht.urteil === "sicher" ? ("gut" as const) : ("mittel" as const) }, ton:gesetzSicht.urteil==="sicher"?"gut" as const:gesetzSicht.luecke>0?"schlecht" as const:"mittel" as const }
          : {}),
    },
    {
      id: "_plan",
      gruppe: t("haushalt.ui.gruppe_lage"),
      titel: t("haushalt.ui.plan.kicker"),
      zeile: t("haushalt.ui.plan.titel", { aus: bio(PLAN_2026.ausgabenGesamt), ein: bio(PLAN_2026.einnahmenGesamt) }),
    },
    {
      id: "_bisher",
      gruppe: t("haushalt.ui.gruppe_lage"),
      titel: t("haushalt.ui.bisher.titel"),
      wert: String(z.aenderungen.length),
      zeile: z.aenderungen.length ? z.aenderungen[z.aenderungen.length - 1]!.text : t("haushalt.ui.bisher.leer"),
    },
    ...GRUPPEN.flatMap((g) =>
      POSTEN.filter((q) => q.gruppe === g).map((q): UbKachel => {
        const ist = stufeVon(world, q.id);
        const plan = z.entwurf?.[q.id] ?? ist;
        const f = ministerFuer(world, q.amt);
        const wunsch = ministerWunsch(world, q.id);
        const offenWunsch = !!f && q.seite === "ausgabe" && q.id !== "rentenalter" && ist < wunsch;
        return {
          id: q.id,
          gruppe: t(`haushalt.gruppe.${g}`),
          titel: q.name,
          bild: f ? <Minister world={world} p={q} /> : undefined,
          wert: betrag(world, q, plan),
          wertLabel: plan !== ist ? t("haushalt.ui.kurz.vorher", { wert: betrag(world, q, ist) }) : vz(plan),
          ...(plan !== ist
            ? { marke: { text: t("haushalt.ui.kurz.entwurf"), ton: "aktiv" as const }, ton: "aktiv" as const }
            : offenWunsch
              ? { marke: { text: t("haushalt.ui.kurz.wunsch", { stufe: vz(wunsch) }), ton: "mittel" as const } }
              : {}),
        };
      }),
    ),
  ];
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
    const q = POSTEN_NACH_ID[id];
    if (!q) return null;
    const aktiv = sel === q.id;
    const plan = z.entwurf?.[q.id] ?? stufeVon(world, q.id);
    return (
      <div className="hh-im-detail">
        <UbDetailKopf bild={<Minister world={world} p={q} />} titel={q.name} unter={t(`haushalt.gruppe.${q.gruppe}`)} />
        {q.gruppe === "renten" && <p className="hh-text">{t("haushalt.ui.renten.etat", { etat: nf(rentenSicht(world).etat, 1), mrd: mrdText(geldAusBip(world, rentenSicht(world).etat)) })}</p>}
        <Zeile world={world} p={q} aktiv={aktiv} wert={aktiv && entwurf !== null ? entwurf : plan} plan={plan} onWahl={(s) => waehle(q.id, s)}>
          {aktiv && vorschauBlock}
        </Zeile>
      </div>
    );
  };
  const [blick, setBlick] = useState<string>(start ?? "_zyklus");
  return (
    <div className="wi-hh">
      {rueck && (
        <p className={`rueckmeldung ${rueck.ok ? "ok" : "nein"} wi-rueck`} role="status" ref={rueckRef} tabIndex={-1}>
          {rueck.text}
          {rueck.why && <em> {rueck.why}</em>}
        </p>
      )}
      {blick !== "_bilanz" && <Staatsfinanzen world={world} />}
      <HaushaltsArbeitsplatz
        lage={
          <>
            <b>{defizit > 0 ? t("haushalt.ui.bilanz.titel_defizit", { defizit: nf(defizit, 1) }) : t("haushalt.ui.bilanz.titel_ueberschuss", { wert: nf(-defizit, 1) })}</b>{" "}
            {fenster.offen ? t("haushalt.ui.ressorts.hinweis_offen") : t("haushalt.ui.ressorts.hinweis_nachtrag", { faktor: HAUSHALT_ZYKLUS.nachtragFaktor })}
          </>
        }
        zahlen={[
          { label: t("haushalt.ui.bilanz.defizit"), wert: `${nf(defizit, 1)} %` },
          { label: t("haushalt.ui.bilanz.schulden"), wert: `${nf(world.economy.debtRatio, 1)} %` },
        ]}
        kacheln={kacheln}
        wahl={blick}
        onWahl={(id) => {
          setBlick(id);
          if (id && POSTEN_NACH_ID[id]) {
            if (sel !== id) {
              setSel(id);
              setEntwurf(null);
              setPrognoseOffen(false);
            }
          } else {
            setSel(null);
            setEntwurf(null);
            setPrognoseOffen(false);
          }
        }}
        detail={detail}
      />
    </div>
  );
}

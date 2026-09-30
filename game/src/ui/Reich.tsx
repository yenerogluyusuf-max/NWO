// Das Reich: je Fachbereich der Bestand (Inventar), die Vorhaben (Projekte, Wunder, Reformen), der Bau in der Warteschlange und die Vorteile.
// Kein Bereich wird nur in Geld gemessen: Jeder hat eigene Größen, und jedes Vorhaben nennt seine Kosten in Kapital, Bau und Verwaltungskraft.

import { useState } from "react";
import type { World } from "../sim/types";
import { BEREICH_NAMEN, KLASSEN_NAMEN, type Bereich, type Klasse } from "../sim/reich-typen";
import {
  aktiveVorteile,
  bauKapazitaet,
  bauplan,
  beginne,
  erhaltung,
  pausiere,
  reichZustand,
  verschiebe,
  verwaltungBilanz,
  vorhabenDef,
  vorhabenListe,
  vorhabenSicht,
  effektZeile,
  type VorhabenSicht,
} from "../sim/reich";
import { ERBE, KIRCHEN_DER_OFFENBARUNG, type Erbe } from "../data/erbe";
import { VORTEILE } from "../data/reich";
import { kapitalEinkommen } from "../sim/spiel";
import { Groessen, type GroesseDef } from "./reich/Groessen";
import { VorhabenKarte } from "./reich/VorhabenKarte";
import { WunderBild } from "./reich/WunderBild";

const GROESSEN: Record<Bereich, GroesseDef[]> = {
  kultur: [{ id: "kulturerbe" }, { id: "identitaet" }, { id: "vielfalt" }, { id: "tourismus" }, { id: "ansehen" }],
  recht: [
    { id: "justiz_unabhaengigkeit" },
    { id: "justiz_kapazitaet", zusatz: "17 Richter je 100.000 Einwohner, Schnitt 22" },
    { id: "justiz_effizienz", zusatz: "Strafgerichte 228 Tage (2024)" },
    { id: "urteilsbefolgung" },
    { id: "haftueberfuellung", invers: true, zusatz: "etwa 142 Prozent Belegung" },
    { id: "ausnahmerecht", invers: true },
    { id: "anwaltsautonomie" },
    { id: "strassburg_druck", invers: true },
    { id: "rechtssicherheit" },
    { id: "legitimitaet" },
  ],
  militaer: [{ id: "bereitschaft_heer" }, { id: "bereitschaft_luft" }, { id: "bereitschaft_see" }, { id: "modernisierung" }, { id: "ruestungsautarkie" }, { id: "truppenmoral" }, { id: "offiziersvertrauen" }, { id: "abschreckung" }],
  infrastruktur: [{ id: "verkehrsnetz" }, { id: "bahnnetz" }, { id: "stau", invers: true }, { id: "logistik" }, { id: "internet" }, { id: "stromversorgung" }, { id: "wasserversorgung" }, { id: "wartungszustand" }],
  haushalt: [{ id: "legitimitaet" }, { id: "vertrauen_maerkte" }, { id: "vertrauen_regierung" }],
};

const EINLEITUNG: Record<Bereich, string> = {
  kultur: "Das Erbe des Landes ist Inventar: 53 Stätten, in Ephesos, Antakya, Ani und überall. Sie verfallen ohne Pflege, und Besucher belasten sie. Wunder, Routen und Restaurierungen kosten Kapital, Bau und Verwaltung, kaum Geld, und sie bringen Ansehen, Zusammenhalt und Gäste.",
  recht: "Reformen im Rechtssystem kosten Kapital, Stimmen und Zeit, nicht Geld. Sie bewegen die Unabhängigkeit der Justiz, die Kapazität der Gerichte und die Befolgung von Urteilen. Durchgriff bringt Rückhalt im Lager und kostet Legitimität: ein Zielkonflikt, keine Frage der Kasse.",
  militaer: "Der Präsident bestellt und verantwortet, er kommandiert nicht. Programme haben einen Lebenszyklus vom Vertrag bis zur Einsatzbereitschaft; Lieferanten erwarten etwas dafür, und manches ist blockiert, bis eine Bedingung fällt. Doktrinen schließen einander aus.",
  infrastruktur: "Was gebaut ist, steht im Bestand und braucht Pflege; was gebaut wird, teilt sich die Baukapazität des Landes. Große Projekte sind Wunder mit dauerhaften Vorteilen und mit Gegnern.",
  haushalt: "Neben dem Haushalt gibt es drei knappe Größen: Verwaltungskraft, Baukapazität und Legitimität. Sonderrechte und Instrumente wirken schnell und haben Kehrseiten, die sich später zeigen.",
};

function Statistik({ world }: { world: World }) {
  const z = reichZustand(world);
  const vb = verwaltungBilanz(world);
  const cap = bauKapazitaet(world);
  const geplant = Object.values(bauplan(world)).reduce((a, b) => a + b, 0);
  return (
    <div className="rr-ressourcen">
      <div className={`rr-ressource ${vb.vorrat < 15 ? "knapp" : ""}`} title="Verwaltungskraft: Sie bezahlt den laufenden Unterhalt aller Vorhaben. Ist der Vorrat leer, kommen Bauten nur zur Hälfte voran und die Legitimität leidet.">
        <span>Verwaltungskraft</span>
        <span className="rr-balken" aria-hidden>
          <i style={{ width: `${vb.vorrat}%` }} />
        </span>
        <b>{Math.round(vb.vorrat)}</b>
        <em className={vb.netto >= 0 ? "hoch" : "runter"}>
          {vb.netto >= 0 ? "+" : "−"}
          {Math.abs(vb.netto).toLocaleString("de-DE", { maximumFractionDigits: 1 })} im Monat
        </em>
      </div>
      <div className="rr-ressource" title="Baukapazität: Baupunkte, die das Land je Monat aufbringt. Laufende Vorhaben teilen sie nach der Reihenfolge auf.">
        <span>Baukapazität</span>
        <span className="rr-balken" aria-hidden>
          <i style={{ width: `${Math.min(100, (geplant / Math.max(1, cap)) * 100)}%` }} />
        </span>
        <b>{Math.round(cap)}</b>
        <em>{Math.round(geplant)} von {Math.round(cap)} je Monat verplant</em>
      </div>
    </div>
  );
}

function ImBau({ world, bereich, refresh }: { world: World; bereich: Bereich; refresh: () => void }) {
  const z = reichZustand(world);
  const plan = bauplan(world);
  const liste = z.laufend.map((l) => ({ l, v: vorhabenDef(l.id)! })).filter((x) => x.v && x.v.bereich === bereich);
  if (!liste.length) return null;
  return (
    <section className="rr-abschnitt">
      <h4>Im Bau <em>Reihenfolge = Vorrang bei der Baukapazität</em></h4>
      <ul className="rr-bauliste">
        {liste.map(({ l, v }) => {
          const f = v.kosten.bau > 0 ? l.fortschritt / v.kosten.bau : 1;
          const rate = plan[l.id] ?? 0;
          const nr = z.laufend.findIndex((x) => x.id === l.id);
          return (
            <li key={l.id} className={`wunder-a-bau${v.bild ? " wunder-a-mitbild" : ""}${l.pausiert ? " ruht" : rate <= 0 ? " wartet" : ""}`}>
              {v.bild && (
                <div className="wunder-a-mini">
                  <WunderBild art={v.bild} zustand="bau" fortschritt={f} klasse={l.pausiert || rate <= 0 ? "ruht" : ""} />
                </div>
              )}
              <div className="rr-bau-kopf">
                <strong>{v.name}</strong>
                <span className="rr-bau-info">
                  {Math.round(f * 100)} % ·{" "}
                  {l.pausiert ? "ruht" : rate > 0 ? `${rate.toLocaleString("de-DE", { maximumFractionDigits: 0 })} Baupunkte im Monat` : "wartet auf Baukapazität"}
                </span>
              </div>
              <span className="rr-balken" aria-hidden>
                <i style={{ width: `${Math.round(f * 100)}%` }} />
              </span>
              <div className="rr-bau-knoepfe">
                <button type="button" className="aktion-knopf" disabled={nr === 0} onClick={() => { verschiebe(world, l.id, -1); refresh(); }} title="Früher bauen">
                  ▲
                </button>
                <button type="button" className="aktion-knopf" disabled={nr === z.laufend.length - 1} onClick={() => { verschiebe(world, l.id, 1); refresh(); }} title="Später bauen">
                  ▼
                </button>
                <button type="button" className="aktion-knopf" onClick={() => { pausiere(world, l.id, !l.pausiert); refresh(); }}>
                  {l.pausiert ? "Weiter" : "Pausieren"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Staetten({ world, refresh, onStaette }: { world: World; refresh: () => void; onStaette?: (id: string) => void }) {
  const z = reichZustand(world);
  const [serie, setSerie] = useState<string>("alle");
  const [rueckmeldung, setRueckmeldung] = useState<string | null>(null);
  const SERIEN: { id: string; name: string }[] = [
    { id: "alle", name: "Alle 53" },
    { id: "kirchen7", name: "Sieben Kirchen" },
    { id: "seldschuken", name: "Seldschuken" },
    { id: "sinan", name: "Sinan" },
    { id: "tas_tepeler", name: "Taş Tepeler" },
    { id: "byzanz", name: "Byzanz" },
    { id: "vielvoelker", name: "Gemeinschaften" },
    { id: "welterbe", name: "Welterbe" },
  ];
  const liste = ERBE.filter((e) => (serie === "alle" ? true : serie === "welterbe" ? e.unesco.status === "welterbe" : e.serien?.includes(serie as never))).sort((a, b) => (z.staetten[a.id]?.zustand ?? 0) - (z.staetten[b.id]?.zustand ?? 0));
  const sieben = KIRCHEN_DER_OFFENBARUNG.map((k) => z.staetten[k.id]?.zustand ?? 0);
  const restauriere = (e: Erbe) => {
    const r = beginne(world, `restaurierung_${e.id}`);
    setRueckmeldung(r.text);
    refresh();
  };
  return (
    <section className="rr-abschnitt">
      <h4>
        Stätten <em>Erhaltung insgesamt {Math.round(erhaltung(world))}</em>
      </h4>
      <div className="rr-filter" role="group" aria-label="Auswahl der Stätten">
        {SERIEN.map((s) => (
          <button key={s.id} type="button" className={serie === s.id ? "on" : ""} onClick={() => setSerie(s.id)} aria-pressed={serie === s.id}>
            {s.name}
          </button>
        ))}
      </div>
      {serie === "kirchen7" && (
        <p className="rr-hinweis">
          Die sieben Gemeinden der Offenbarung liegen alle im Westen der Türkei. Die Kirchenroute der Sieben verlangt für jede Stätte mindestens Zustand 55; die schwächste steht bei {Math.round(Math.min(...sieben))}.
        </p>
      )}
      {rueckmeldung && <p className="rr-hinweis" role="status">{rueckmeldung}</p>}
      <ul className="rr-staetten">
        {liste.map((e) => {
          const st = z.staetten[e.id]!;
          const laeuft = z.laufend.some((l) => l.id === `restaurierung_${e.id}`);
          return (
            <li key={e.id} className={st.zustand < 40 ? "gefaehrdet" : ""}>
              <div className="rr-staette-kopf">
                <button type="button" className="link rr-staette-name" onClick={() => onStaette?.(e.id)}>
                  {e.name}
                </button>
                {e.unesco.status === "welterbe" && <span className="rr-plakette" title={`Welterbe seit ${e.unesco.jahr}`}>Welterbe</span>}
                {e.kirche7 && <span className="rr-plakette kirche" title="Eine der sieben Gemeinden der Offenbarung">Offenbarung</span>}
              </div>
              <span className="rr-staette-ort">{e.ort}: {e.satz}</span>
              <div className="rr-zustand">
                <span>Zustand</span>
                <span className="rr-balken" aria-hidden>
                  <i style={{ width: `${st.zustand}%` }} className={st.zustand < 40 ? "schwach" : ""} />
                </span>
                <b>{Math.round(st.zustand)}</b>
              </div>
              <button type="button" className="aktion-knopf" disabled={laeuft || st.zustand > 82} onClick={() => restauriere(e)} title={laeuft ? "Die Restaurierung läuft." : st.zustand > 82 ? "Schon in bestem Zustand." : `Restaurierung beginnen (${e.unesco.status === "welterbe" ? 3 : 2} Kapital)`}>
                {laeuft ? "Läuft" : "Restaurieren"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const SITZ_NAMEN: Record<string, string> = { aym: "Verfassungsgericht", hsk: "Richter- und Staatsanwaltsrat" };

function Sitze({ world }: { world: World }) {
  const z = reichZustand(world);
  return (
    <section className="rr-abschnitt">
      <h4>
        Besetzung der Gerichte <em>Wer sitzt, prägt die Unabhängigkeit</em>
      </h4>
      <div className="rr-sitzgruppen">
        {Object.entries(z.sitze).map(([key, s]) => {
          const n = s.loyal + s.unabhaengig + s.reform;
          const punkte = [
            ...Array.from({ length: s.loyal }, () => "loyal"),
            ...Array.from({ length: s.reform }, () => "reform"),
            ...Array.from({ length: s.unabhaengig }, () => "unabhaengig"),
          ];
          return (
            <div key={key} className="rr-sitzgruppe">
              <strong>{SITZ_NAMEN[key] ?? key}</strong>
              <span className="rr-sitze" role="img" aria-label={`${n} Sitze: ${s.loyal} loyal, ${s.reform} reformorientiert, ${s.unabhaengig} unabhängig`}>
                {punkte.map((p, i) => (
                  <i key={i} className={p} />
                ))}
              </span>
              <span className="rr-sitz-legende">
                <b className="loyal" /> {s.loyal} loyal zur Regierung <b className="reform" /> {s.reform} reformorientiert <b className="unabhaengig" /> {s.unabhaengig} unabhängig
              </span>
            </div>
          );
        })}
      </div>
      <p className="rr-hinweis">Freie Sitze werden durch Ernennungen neu besetzt; jede ist eine Entscheidung zwischen Loyalität und Unabhängigkeit. Das Verfassungsgericht hat 15 Mitglieder (12 vom Präsidenten ernannt, 3 vom Parlament gewählt), der Richterrat 13.</p>
    </section>
  );
}

function Haushalt({ world }: { world: World }) {
  const vb = verwaltungBilanz(world);
  const k = kapitalEinkommen(world);
  const e = world.economy;
  const z = (x: number, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
  return (
    <section className="rr-abschnitt">
      <h4>
        Verwaltung und Haushalt <em>Was knapp ist, ist selten nur Geld</em>
      </h4>
      <div className="rr-bilanz">
        <table>
          <caption>Verwaltungskraft je Monat</caption>
          <tbody>
            <tr><th>Einkommen (Grundstock, Digitalisierung, Institutionen)</th><td className="hoch">+{z(vb.einkommen)}</td></tr>
            <tr><th>Bauvorhaben</th><td className="runter">−{z(vb.bau)}</td></tr>
            <tr><th>Unterhalt des Bestands</th><td className="runter">−{z(vb.unterhalt)}</td></tr>
            <tr className="summe"><th>Saldo</th><td className={vb.netto >= 0 ? "hoch" : "runter"}>{vb.netto >= 0 ? "+" : "−"}{z(Math.abs(vb.netto))}</td></tr>
          </tbody>
        </table>
        <table>
          <caption>Politisches Kapital je Monat</caption>
          <tbody>
            <tr><th>Grundeinkommen</th><td>{z(k.grund)}</td></tr>
            <tr><th>Vertrauen der Bürger</th><td>{z(k.vertrauen)}</td></tr>
            <tr><th>Mehrheit im Parlament</th><td>{z(k.mehrheit)}</td></tr>
            <tr><th>Legitimität der Regierung</th><td className={k.legitimitaet >= 0 ? "hoch" : "runter"}>{k.legitimitaet >= 0 ? "+" : "−"}{z(Math.abs(k.legitimitaet))}</td></tr>
            <tr className="summe"><th>Summe</th><td>{z(k.summe)}</td></tr>
          </tbody>
        </table>
        <table>
          <caption>Haushalt und Märkte</caption>
          <tbody>
            <tr><th>Staatsschulden</th><td>{z(e.debtRatio)} % des BIP</td></tr>
            <tr><th>Leitzins</th><td>{z(e.policyRate)} %</td></tr>
            <tr><th>Lira je Dollar</th><td>{z(e.usdTry)}</td></tr>
            <tr><th>Risikoaufschlag</th><td>{z(e.riskPremium, 0)} Punkte</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function VorteileListe({ world, bereich }: { world: World; bereich: Bereich }) {
  const aktiv = new Set(aktiveVorteile(world));
  const liste = VORTEILE.filter((v) => v.bereich === bereich);
  if (!liste.length) return null;
  return (
    <section className="rr-abschnitt">
      <h4>
        Vorteile <em>gelten, solange ihre Bedingungen gelten</em>
      </h4>
      <ul className="rr-vorteile">
        {liste.map((v) => {
          const an = aktiv.has(v.id);
          return (
            <li key={v.id} className={an ? "aktiv" : ""}>
              <div className="rr-vorteil-kopf">
                <strong>{v.name}</strong>
                <span className={`rr-status ${an ? "fertig" : ""}`}>{an ? "Aktiv" : "Noch nicht erreicht"}</span>
              </div>
              <p>{v.text}</p>
              <ul className="rr-wirkung-zeilen">
                {v.dauer.map((e) => effektZeile(e, "dauer")).filter((z): z is NonNullable<typeof z> => !!z).map((z) => (
                  <li key={z.text} className={z.gut ? "rr-gut" : "rr-schlecht"}>
                    <span aria-hidden>{z.richtung > 0 ? "▲" : "▼"}</span> {z.text}
                  </li>
                ))}
              </ul>
              <p className="rr-kehrseite"><b>Der Preis:</b> {v.kehrseite}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Reich({ world, bereich, refresh, onKarte }: { world: World; bereich: Bereich; refresh: () => void; onKarte?: (o: { lon: number; lat: number }) => void }) {
  const [filter, setFilter] = useState<Klasse | "alle">("alle");
  const [ergebnisse, setErgebnisse] = useState<Record<string, { ok: boolean; text: string }>>({});
  if (!world.spiel) return <p>Ohne Spielschleife gibt es kein Reich.</p>;
  const z = reichZustand(world);
  const liste = vorhabenListe(world, bereich);

  const beginneVorhaben = (id: string) => {
    const r = beginne(world, id);
    setErgebnisse((e) => ({ ...e, [id]: { ok: r.ok, text: r.why ? `${r.text} ${r.why}` : r.text } }));
    refresh();
  };

  // Institutionen mit Sitzen zeigt der Bereich Recht als eigenes Feld
  const bestand = liste.filter((s) => s.status === "fertig" && !(bereich === "recht" && s.v.klasse === "institution" && s.v.start));
  const offen = liste.filter((s) => s.status !== "fertig" && s.status !== "im_bau" && s.status !== "pausiert" && !(s.v.klasse === "restaurierung" && bereich === "kultur"));
  const klassenVorhanden = Array.from(new Set(offen.map((s) => s.v.klasse)));
  const sichtbar = offen.filter((s) => filter === "alle" || s.v.klasse === filter);
  const sortiert = [...sichtbar].sort((a, b) => Number(b.bereit) - Number(a.bereit) || Number(a.status === "gesperrt") - Number(b.status === "gesperrt"));
  const gross = (s: VorhabenSicht) => s.v.klasse === "wunder" || s.v.klasse === "grossprojekt" || s.v.klasse === "serie";

  return (
    <div className="reich">
      <header className="rr-kopf">
        <h3>{BEREICH_NAMEN[bereich]}</h3>
        <p className="subtitle">{EINLEITUNG[bereich]}</p>
      </header>

      <section className="rr-abschnitt">
        <Statistik world={world} />
        <Groessen world={world} liste={GROESSEN[bereich]} />
      </section>

      {bereich === "haushalt" && <Haushalt world={world} />}
      {bereich === "recht" && <Sitze world={world} />}
      <ImBau world={world} bereich={bereich} refresh={refresh} />

      {bereich === "kultur" && <Staetten world={world} refresh={refresh} />}

      {bestand.length > 0 && (
        <section className="rr-abschnitt">
          <h4>
            Bestand <em>{bestand.length} {bestand.length === 1 ? "Stück" : "Stücke"}, ohne Pflege verfällt der Zustand</em>
          </h4>
          <div className="rr-raster">
            {bestand.map((s) => (
              <div key={s.v.id} className="rr-bestand">
                <VorhabenKarte s={s} gross={gross(s)} onBeginne={beginneVorhaben} {...(onKarte ? { onKarte } : {})} />
                {liste.find((x) => x.v.id === `sanierung_${s.v.id.replace("infra_", "")}` && x.status === "verfuegbar") && (
                  <button
                    type="button"
                    className="aktion-knopf rr-sanieren"
                    onClick={() => beginneVorhaben(`sanierung_${s.v.id.replace("infra_", "")}`)}
                    disabled={!!vorhabenSicht(world, `sanierung_${s.v.id.replace("infra_", "")}`)?.grund}
                  >
                    Sanieren (2 Kapital)
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <VorteileListe world={world} bereich={bereich} />

      <section className="rr-abschnitt">
        <h4>
          Vorhaben <em>{sortiert.length} {sortiert.length === 1 ? "verfügbar" : "verfügbar oder gesperrt"}</em>
        </h4>
        {klassenVorhanden.length > 1 && (
          <div className="rr-filter" role="group" aria-label="Art des Vorhabens">
            <button type="button" className={filter === "alle" ? "on" : ""} onClick={() => setFilter("alle")}>Alle</button>
            {klassenVorhanden.map((k) => (
              <button key={k} type="button" className={filter === k ? "on" : ""} onClick={() => setFilter(k)} aria-pressed={filter === k}>
                {KLASSEN_NAMEN[k]}
              </button>
            ))}
          </div>
        )}
        <div className="rr-raster gross">
          {sortiert.map((s) => (
            <VorhabenKarte key={s.v.id} s={s} gross={gross(s)} onBeginne={beginneVorhaben} ergebnis={ergebnisse[s.v.id]} {...(onKarte ? { onKarte } : {})} />
          ))}
        </div>
        {sortiert.length === 0 && <p className="subtitle">Hier gibt es im Moment nichts, was sich beginnen ließe.</p>}
      </section>

      {z.meldungen.length > 0 && (
        <section className="rr-abschnitt">
          <h4>Zuletzt</h4>
          <ul className="rr-meldungen">
            {[...z.meldungen].reverse().slice(0, 5).map((m, i) => (
              <li key={`${m.tag}-${i}`} className={m.art}>
                {m.text}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// Die Welt: die übrigen Staaten als Gegenüber. Links die Staaten in Gruppen (mit Filter und Suche), die Blöcke (EU, NATO, BRICS …), der Dienst und die
// Vermittlung zwischen Dritten; rechts die Akte des Gewählten. Die 18 Hauptakteure haben einen Verhandlungstisch, die weiteren Staaten (EU-Mitglieder,
// BRICS, Golf, Turkstaaten …) Lage, Gesten und ihren Platz in den Blöcken.

import { useMemo, useState } from "react";
import type { World } from "../sim/types";
import { AKTIONEN, aktionenFuer, anliegenStand, dimensionZu, fuehreAktionAus, land, weltZustand, type Dimension } from "../sim/laender";
import { NET } from "../sim/modell";
import { tunWort } from "../data/skalen";
import { formatDateDe } from "../sim/dates";
import { laufende } from "../sim/abkommen";
import daten from "../data/vergleich.json";
import { GRUPPEN_FILTER, mitgliedschaften } from "../data/welt-institutionen";
import { WEITERE_NACH_ID } from "../data/welt-weitere";
import { Flagge, flaggenFarben } from "./art/Flaggen";
import { Verhandlungstisch } from "./welt/Verhandlungstisch";
import { Vertraege } from "./welt/Vertraege";
import { Vermittlung } from "./welt/Vermittlung";
import { KriegDossier } from "./welt/KriegDossier";
import { EuDossier } from "./welt/EuDossier";
import { WeltLage } from "./welt/WeltLage";
import { Dienst } from "./welt/Dienst";
import { Block, BlockListe } from "./welt/Block";
import { aktiveKriege, kriegMit, PHASEN_NAME } from "../sim/krieg";
import { beziehungZurTuerkei, fuehreGesteAus, gestenFuerWeitere, istHauptakteur, akteurName } from "../sim/welt-modell";
import { ratStimmen, THEMA_NAME } from "../sim/welt-bloecke";
import { ANZEIGE_GRUPPEN, akteurListe, haltungWortAlle, imFilter, trifft } from "../sim/welt-sicht";
import type { EuThema } from "../data/welt-weitere";
import type { WeltTab } from "./welt/LandPopover";
import { Aussenlage } from "./welt/Aussenlage";
import { t } from "../i18n";
import { t as tx } from "../i18n";
import "./welt/welt.css";

const DIM: { id: Dimension; label: string; text: string }[] = [
  { id: "handel", label: "Handel", text: "Güter-, Dienstleistungs- und Energieverflechtung" },
  { id: "sicherheit", label: "Sicherheit", text: "Militärische Zusammenarbeit und gemeinsame Bedrohungswahrnehmung" },
  { id: "vertrauen", label: "Vertrauen", text: "Zuverlässigkeit, Erinnerung an gehaltene und gebrochene Zusagen" },
  { id: "konflikt", label: "Konflikt", text: "Offene Streitpunkte: je höher, desto heftiger" },
];

const KENNZAHLEN: { key: string; label: string; einheit: string }[] = [
  { key: "FP.CPI.TOTL.ZG", label: "Inflation", einheit: "%" },
  { key: "SL.UEM.TOTL.ZS", label: "Arbeitslosigkeit", einheit: "%" },
  { key: "NY.GDP.MKTP.KD.ZG", label: "Wirtschaftswachstum", einheit: "%" },
  { key: "MS.MIL.XPND.GD.ZS", label: "Verteidigungsausgaben", einheit: "% des BIP" },
];

type Indikatoren = Record<string, { tur: { wert: number; jahr: number }; laender: Record<string, [number, number]> }>;
const IND = (daten as unknown as { indikatoren: Indikatoren }).indikatoren;
const nf = (x: number) => x.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const TABS: { id: WeltTab; label: string }[] = [
  { id: "ueberblick", label: "reste.welt.ueberblick" },
  { id: "verhandeln", label: "reste.welt.verhandeln" },
  { id: "vertraege", label: "reste.welt.vertraege" },
  { id: "handeln", label: "reste.welt.gesten" },
];

type Modus = "aussen" | "laender" | "bloecke" | "dienst" | "vermittlung";
const MODI: { id: Modus; label: string }[] = [
  { id: "aussen", label: t("aussen.ui.modus") },
  { id: "laender", label: "Staaten" },
  { id: "bloecke", label: "Blöcke" },
  { id: "dienst", label: "Dienst" },
  { id: "vermittlung", label: "Vermittlung" },
];

export function Welt({ world, refresh, onMassnahme, start, startTab }: { world: World; refresh: () => void; onMassnahme?: (id: string, richtung: 1 | -1) => void; start?: string; startTab?: WeltTab }) {
  const [modus, setModus] = useState<Modus>(start === "vermittlung" ? "vermittlung" : "laender");
  const [gewaehlt, setGewaehlt] = useState<string>(start && start !== "vermittlung" ? start : "EU");
  const [block, setBlock] = useState<string>("eu");
  const [filter, setFilter] = useState<string>("alle");
  const [suche, setSuche] = useState("");
  const [tab, setTab] = useState<WeltTab>(startTab ?? "ueberblick");
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const [dienstZiel, setDienstZiel] = useState<string | undefined>(undefined);
  const alle = useMemo(() => akteurListe(), []);
  if (!world.spiel) return <p>{t("ui.Welt.4f623c0")}</p>;

  const waehle = (id: string) => {
    setGewaehlt(id);
    setModus("laender");
    setAntwort(null);
    if (!istHauptakteur(id) && (tab === "verhandeln" || tab === "vertraege" || tab === "konflikt" || tab === "beitritt")) setTab("ueberblick");
  };
  const zumDienst = (ziel: string) => {
    setDienstZiel(ziel);
    setModus("dienst");
  };
  const sichtbar = alle.filter((a) => imFilter(filter, a.id) && trifft(a, suche));
  const haupt = istHauptakteur(gewaehlt);
  const l = haupt ? land(gewaehlt) : null;
  const wd = WEITERE_NACH_ID.get(gewaehlt);

  const eintrag = (a: (typeof alle)[number]) => {
    const v = beziehungZurTuerkei(world, a.id).vertrauen;
    const k = beziehungZurTuerkei(world, a.id).konflikt;
    const n = a.haupt ? laufende(world, a.id).length : 0;
    const vorgang = a.haupt ? kriegMit(world, a.id) : undefined;
    return (
      <li key={a.id}>
        <button type="button" className={`we-eintrag${modus === "laender" && gewaehlt === a.id ? " on" : ""}`} onClick={() => waehle(a.id)} aria-pressed={modus === "laender" && gewaehlt === a.id} title={a.name}>
          <Flagge id={a.id} breite={34} />
          <span className="we-name">{a.name}</span>
          <span className={`we-haltung ton-${v >= 55 ? "gut" : v >= 35 ? "mittel" : "schlecht"}`}>
            {haltungWortAlle(world, a.id)}
            {vorgang ? ` · ⚔ ${PHASEN_NAME[vorgang.phase]}` : k >= 65 ? " · Streit" : ""}
          </span>
          {n > 0 && (
            <b className="we-vertragszahl" title={tx("ui2.ui.Welt.f9ed63b", { p0: n })}>
              {n}
            </b>
          )}
        </button>
      </li>
    );
  };

  return (
    <div className={`we${tab === "verhandeln" && modus === "laender" && haupt ? " schmal" : ""}`}>
      <nav className="we-liste" aria-label={t("ui.Welt.5f9089a")}>
        <div className="we-modus" role="tablist" aria-label={tx("ui2.ui.Welt.5c38879")}>
          {MODI.map((m) => (
            <button key={m.id} type="button" role="tab" aria-selected={modus === m.id} className={modus === m.id ? "on" : ""} onClick={() => setModus(m.id)}>
              {m.label}
            </button>
          ))}
        </div>

        {modus === "laender" && (
          <>
            <div className="we-suche">
              <input type="search" value={suche} onChange={(e) => setSuche(e.target.value)} placeholder={t("ui.Welt.268aa0f")} aria-label={t("ui.Welt.7a93826")} />
            </div>
            <div className="we-chips" role="group" aria-label={t("ui.Welt.f4e8075")}>
              {GRUPPEN_FILTER.map((g) => (
                <button key={g.id} type="button" className={filter === g.id ? "on" : ""} aria-pressed={filter === g.id} onClick={() => setFilter(g.id)}>
                  {g.label}
                </button>
              ))}
            </div>
            <div className="we-liste-rumpf">
              {sichtbar.length === 0 && <p className="we-hinweis">{t("ui.Welt.b5f3c58")}</p>}
              {filter === "alle" && !suche.trim()
                ? ANZEIGE_GRUPPEN.map((g) => {
                    const mitglieder = sichtbar.filter((a) => a.gruppe === g);
                    return mitglieder.length ? (
                      <div key={g} className="we-gruppe">
                        <b>{g}</b>
                        <ul>{mitglieder.map(eintrag)}</ul>
                      </div>
                    ) : null;
                  })
                : (
                  <div className="we-gruppe">
                    <b>{sichtbar.length} {sichtbar.length === 1 ? tx("ui2.ui.Welt.1d0274d") : tx("ui2.ui.Welt.9c0333c")}</b>
                    <ul>{sichtbar.map(eintrag)}</ul>
                  </div>
                )}
            </div>
          </>
        )}
        {modus === "bloecke" && (
          <div className="we-liste-rumpf">
            <div className="we-gruppe">
              <b>{t("ui.Welt.d24bc84")}</b>
              <BlockListe world={world} gewaehlt={block} onWaehle={setBlock} />
            </div>
          </div>
        )}
        {modus === "aussen" && <p className="we-hinweis we-liste-hinweis">{t("aussen.ui.liste_hinweis")}</p>}
        {modus === "dienst" && <p className="we-hinweis we-liste-hinweis">{t("ui.Welt.37f315c")}</p>}
        {modus === "vermittlung" && <p className="we-hinweis we-liste-hinweis">{tx("ui2.ui.Welt.be92f9d")}</p>}
      </nav>

      <div className="we-akte">
        {modus === "aussen" && <Aussenlage world={world} refresh={refresh} />}
        {modus === "vermittlung" && <Vermittlung world={world} refresh={refresh} />}
        {modus === "dienst" && <Dienst world={world} refresh={refresh} {...(dienstZiel ? { ziel: dienstZiel } : {})} onLand={waehle} />}
        {modus === "bloecke" && <Block key={block} world={world} id={block} refresh={refresh} onLand={waehle} />}
        {modus === "laender" && haupt && l && aktiveKriege(world).length > 0 && !kriegMit(world, gewaehlt) && (
          <div className="we-kriegsbanner" role="status">
            {aktiveKriege(world).map((kv) => (
              <button
                key={kv.id}
                type="button"
                className="we-kriegsbanner-eintrag"
                onClick={() => {
                  waehle(kv.land);
                  setTab("konflikt");
                }}
              >
                {tx("ui2.ui.Welt.34760b0", { p0: PHASEN_NAME[kv.phase], p1: land(kv.land).name })}
              </button>
            ))}
          </div>
        )}
        {modus === "laender" && haupt && l && (
          <>
            <header className="we-kopf" style={{ ["--flagge-1" as string]: flaggenFarben(gewaehlt)[0], ["--flagge-2" as string]: flaggenFarben(gewaehlt)[1] }}>
              <Flagge id={gewaehlt} breite={78} titel={l.name} />
              <div className="we-kopf-text">
                <h3>
                  {l.name} <em className="we-haltung-gross">{haltungWortAlle(world, gewaehlt)}</em>
                </h3>
                <p>{l.text}</p>
                <Mitgliedschaften id={gewaehlt} onBlock={(b) => { setBlock(b); setModus("bloecke"); }} />
              </div>
            </header>

            <div className="we-dimensionen">
              {DIM.map((d) => {
                const wert = dimensionZu(world, gewaehlt, d.id);
                return (
                  <div key={d.id} className={`we-dim dim-${d.id}`} title={d.text}>
                    <span>{d.label}</span>
                    <span className="we-balken" aria-hidden>
                      <i style={{ width: `${wert}%` }} />
                    </span>
                    <strong>{Math.round(wert)}</strong>
                  </div>
                );
              })}
            </div>

            <div className="we-tabs" role="tablist" aria-label={tx("reste.welt.ansicht", { name: l.name })}>
              {TABS.map((t) => {
                const n = t.id === "vertraege" ? laufende(world, gewaehlt).length : 0;
                return (
                  <button key={t.id} role="tab" type="button" aria-selected={tab === t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)}>
                    {tx(t.label)}
                    {n > 0 && <b>{n}</b>}
                  </button>
                );
              })}
              {kriegMit(world, gewaehlt) && (
                <button role="tab" type="button" aria-selected={tab === "konflikt"} className={tab === "konflikt" ? "on" : ""} onClick={() => setTab("konflikt")}>
                  ⚔ {tx("reste.welt.konflikt")}
                </button>
              )}
              {gewaehlt === "EU" && (
                <button role="tab" type="button" aria-selected={tab === "beitritt"} className={tab === "beitritt" ? "on" : ""} onClick={() => setTab("beitritt")}>
                  ★ Beitritt
                </button>
              )}
            </div>

            {tab === "ueberblick" && <Ueberblick world={world} landId={gewaehlt} onMassnahme={onMassnahme} onVerhandeln={() => setTab("verhandeln")} onDienst={zumDienst} onRat={gewaehlt === "EU" ? () => { setBlock("eu"); setModus("bloecke"); } : undefined} />}
            {tab === "verhandeln" && <Verhandlungstisch key={gewaehlt} world={world} landId={gewaehlt} refresh={refresh} onVertraege={() => setTab("vertraege")} />}
            {tab === "vertraege" && <Vertraege world={world} landId={gewaehlt} refresh={refresh} />}
            {tab === "konflikt" && <KriegDossier world={world} landId={gewaehlt} refresh={refresh} />}
            {tab === "beitritt" && gewaehlt === "EU" && <EuDossier world={world} refresh={refresh} />}
            {tab === "handeln" && (
              <div className="we-gesten">
                <p className="subtitle">{t("ui.Welt.0d4ca65")}</p>
                {antwort && (
                  <p className={`we-rueck ${antwort.ok ? "ok" : "nein"}`} role="status">
                    {antwort.text}
                    {antwort.why && <em> {antwort.why}</em>}
                  </p>
                )}
                <ul className="we-aktionen">
                  {aktionenFuer(world, gewaehlt).map((a) => (
                    <li key={a.aktion.id}>
                      <button
                        type="button"
                        className="aktion-knopf"
                        disabled={!a.moeglich}
                        onClick={() => {
                          setAntwort(fuehreAktionAus(world, gewaehlt, a.aktion.id));
                          refresh();
                        }}
                      >
                        {a.aktion.label} <b>{a.aktion.pk}</b>
                      </button>
                      <span>{a.moeglich ? AKTIONEN[a.aktion.id].hinweis : a.grund}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {modus === "laender" && !haupt && wd && (
          <WeitereAkte
            world={world}
            id={gewaehlt}
            tab={tab === "handeln" ? "handeln" : "ueberblick"}
            onTab={(t) => setTab(t)}
            antwort={antwort}
            onAntwort={(a) => setAntwort(a)}
            refresh={refresh}
            onDienst={zumDienst}
            onBlock={(b) => { setBlock(b); setModus("bloecke"); }}
          />
        )}
      </div>
    </div>
  );
}

function Mitgliedschaften({ id, onBlock }: { id: string; onBlock: (b: string) => void }) {
  const m = mitgliedschaften(id);
  if (m.length === 0) return null;
  return (
    <p className="we-mitglied">
      {m.map((x) => (
        <button key={x.institution.id} type="button" className={`we-chip block ${x.rolle}`} onClick={() => onBlock(x.institution.id)} title={`${x.institution.name}: ${x.rolle}`}>
          {x.institution.kurz}
          {x.rolle !== "mitglied" ? ` (${x.rolle})` : ""}
        </button>
      ))}
    </p>
  );
}

function WeitereAkte({
  world, id, tab, onTab, antwort, onAntwort, refresh, onDienst, onBlock,
}: {
  world: World;
  id: string;
  tab: "ueberblick" | "handeln";
  onTab: (t: WeltTab) => void;
  antwort: { ok: boolean; text: string; why?: string } | null;
  onAntwort: (a: { ok: boolean; text: string; why?: string } | null) => void;
  refresh: () => void;
  onDienst: (ziel: string) => void;
  onBlock: (b: string) => void;
}) {
  const wd = WEITERE_NACH_ID.get(id)!;
  const b = beziehungZurTuerkei(world, id);
  const dims: { id: Dimension; label: string; wert: number; text: string }[] = DIM.map((d) => ({ ...d, wert: b[d.id] }));
  const stimmen = wd.eu
    ? (Object.keys(THEMA_NAME) as EuThema[]).map((t) => ({ t, s: ratStimmen(world, t).find((x) => x.id === id) }))
    : [];
  return (
    <>
      <header className="we-kopf" style={{ ["--flagge-1" as string]: flaggenFarben(id)[0], ["--flagge-2" as string]: flaggenFarben(id)[1] }}>
        <Flagge id={id} breite={78} titel={wd.name} />
        <div className="we-kopf-text">
          <h3>
            {wd.name} <em className="we-haltung-gross">{haltungWortAlle(world, id)}</em>
          </h3>
          <p>{wd.text}</p>
          <Mitgliedschaften id={id} onBlock={onBlock} />
        </div>
      </header>
      <div className="we-dimensionen">
        {dims.map((d) => (
          <div key={d.id} className={`we-dim dim-${d.id}`} title={d.text}>
            <span>{d.label}</span>
            <span className="we-balken" aria-hidden>
              <i style={{ width: `${d.wert}%` }} />
            </span>
            <strong>{Math.round(d.wert)}</strong>
          </div>
        ))}
      </div>
      <div className="we-tabs" role="tablist" aria-label={`${wd.name}: Ansicht`}>
        <button role="tab" type="button" aria-selected={tab === "ueberblick"} className={tab === "ueberblick" ? "on" : ""} onClick={() => onTab("ueberblick")}>
          {t("ui.Welt.8f96328")}
        </button>
        <button role="tab" type="button" aria-selected={tab === "handeln"} className={tab === "handeln" ? "on" : ""} onClick={() => onTab("handeln")}>
          {tx("ui2.ui.Welt.94297be")}
        </button>
      </div>

      {tab === "ueberblick" && (
        <div className="we-ueberblick">
          <WeltLage world={world} id={id} onDienst={onDienst} />
          {wd.eu && (
            <div className="we-eu-position">
              <b>{tx("ui2.ui.Welt.415b845")}</b>
              <ul>
                {stimmen.map(({ t, s }) =>
                  s ? (
                    <li key={t} className={`stimme-${s.stimme}`}>
                      <span>{THEMA_NAME[t]}</span>
                      <b>{{ dafuer: "dafür", enthaltung: "Enthaltung", dagegen: "dagegen" }[s.stimme]}</b>
                    </li>
                  ) : null,
                )}
              </ul>
              <button type="button" className="link" onClick={() => onBlock("eu")}>
                {tx("ui2.ui.Welt.a45d750")}
              </button>
            </div>
          )}
          <p className="we-hinweis">{tx("ui2.ui.Welt.a3f5878", { p0: akteurName(id) })}</p>
          <button type="button" className="aktion-knopf we-zum-tisch" onClick={() => onDienst(id)}>
            {tx("ui2.ui.Welt.8edbc59", { p0: akteurName(id) })}
          </button>
        </div>
      )}

      {tab === "handeln" && (
        <div className="we-gesten">
          <p className="subtitle">{tx("ui2.ui.Welt.746c8c5", { p0: akteurName(id) })}{wd.anker ? tx("ui2.ui.Welt.e54b787", { p0: akteurName(wd.anker.id) }) : ""}.</p>
          {antwort && (
            <p className={`we-rueck ${antwort.ok ? "ok" : "nein"}`} role="status">
              {antwort.text}
              {antwort.why && <em> {antwort.why}</em>}
            </p>
          )}
          <ul className="we-aktionen">
            {gestenFuerWeitere(world, id).map((a) => (
              <li key={a.aktion.id}>
                <button
                  type="button"
                  className="aktion-knopf"
                  disabled={!a.moeglich}
                  onClick={() => {
                    onAntwort(fuehreGesteAus(world, id, a.aktion.id));
                    refresh();
                  }}
                >
                  {a.aktion.label} <b>{a.aktion.pk}</b>
                </button>
                <span>{a.moeglich ? AKTIONEN[a.aktion.id].hinweis : a.grund}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function Ueberblick({ world, landId, onMassnahme, onVerhandeln, onDienst, onRat }: { world: World; landId: string; onMassnahme?: ((id: string, richtung: 1 | -1) => void) | undefined; onVerhandeln: () => void; onDienst: (ziel: string) => void; onRat?: (() => void) | undefined }) {
  const l = land(landId);
  const z = weltZustand(world)[landId]!;
  const stand = anliegenStand(world, landId);
  const zeilen = KENNZAHLEN.map((k) => ({ k, wert: IND[k.key]?.laender[l.iso] })).filter((x) => x.wert);
  return (
    <div className="we-ueberblick">
      <WeltLage world={world} id={landId} onDienst={onDienst} />
      <div className="we-anliegen">
        <b>{tx("ui2.ui.Welt.5ff75db", { p0: l.name })}</b>
        <ul>
          {stand.map((s) => (
            <li key={s.anliegen.id} className={s.erfuellt ? "ok" : "offen"}>
              <span aria-hidden>{s.erfuellt ? "✓" : "○"}</span>
              <span>
                <strong>{s.anliegen.titel}</strong>: {s.anliegen.text} <em>{s.text}</em>
                {!s.erfuellt && (s.anliegen.bedingung.art === "massnahme" || s.anliegen.bedingung.art === "massnahme-max") && (
                  <button
                    type="button"
                    className="link"
                    onClick={() => {
                      const b = s.anliegen.bedingung as { id: string; art: string };
                      onMassnahme?.(b.id, b.art === "massnahme" ? 1 : -1);
                    }}
                  >
                    {" "}
                    {tunWort((s.anliegen.bedingung as { id: string }).id, s.anliegen.bedingung.art === "massnahme" ? 1 : -1)}: {NET.nodes[NET.index.get((s.anliegen.bedingung as { id: string }).id)!]!.name}
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
        <div className="we-zum-tisch-zeile">
          <button type="button" className="aktion-knopf we-zum-tisch" onClick={onVerhandeln}>
            {tx("ui2.ui.Welt.9dd195c")}
          </button>
          <button type="button" className="aktion-knopf we-zum-tisch" onClick={() => onDienst(landId)}>
            {tx("ui2.ui.Welt.d9c8900")}
          </button>
          {onRat && (
            <button type="button" className="aktion-knopf we-zum-tisch" onClick={onRat}>
              {t("ui.Welt.e966efd")}
            </button>
          )}
        </div>
      </div>

      {!l.wdi || zeilen.length === 0 ? (
        <p className="subtitle">{t("ui.Welt.882f065")}</p>
      ) : (
        <div className="we-zahlen">
          <b>{tx("ui2.ui.Welt.e92d8d2")}</b>
          <table>
            <tbody>
              {zeilen.map(({ k, wert }) => (
                <tr key={k.key}>
                  <th>{k.label}</th>
                  <td>
                    {nf(wert![0])} {k.einheit} <em>({wert![1]})</em>
                  </td>
                  <td className="we-tur">
                    {tx("ui2.ui.Welt.6153704", { p0: nf(IND[k.key]!.tur.wert) })} <em>({IND[k.key]!.tur.jahr})</em>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {l.id === "EU" && <p className="subtitle">{t("ui.Welt.c5a36bc")}</p>}
        </div>
      )}

      {(z.abkommen.length > 0 || z.erinnerung.length > 0) && (
        <div className="we-erinnerung">
          <b>{tx("ui2.ui.Welt.d95298f")}</b>
          <ul>
            {z.abkommen.slice(-4).map((a) => (
              <li key={a}>{a}</li>
            ))}
            {[...z.erinnerung]
              .reverse()
              .slice(0, 3)
              .map((e) => (
                <li key={e}>{e.replace(/^(\d{4})-(\d{2})-(\d{2}):/, (_, j, m, t) => `${formatDateDe(`${j}-${m}-${t}`)}:`)}</li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

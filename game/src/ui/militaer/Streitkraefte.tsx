// Die Streitkräfte als Bestand: Kampfkraft auf einen Blick, je Gattung Zahl, Generation und Herkunft, darunter die Instrumente
// (Kaufen, Produzieren, Entwickeln, Modernisieren, Ausmustern) mit Vorschau, der Wehrdienst, die laufenden Vorhaben und die
// Zielräume eines Krieges. Rechnet nichts selbst: alles kommt aus sim/streitkraefte.ts und sim/krieg.ts.

import { useState } from "react";
import type { World } from "../../sim/types";
import { t, zahl as zahlI18n } from "../../i18n";
import { useSprache } from "../../i18n/react";
import {
  beginneAusbau,
  mustereAus,
  setzeWehrdienst,
  streitkraefteSicht,
  vorschauAusbau,
  type GattungSicht,
} from "../../sim/streitkraefte";
import { PHASEN_NAME, aktiveKriege, eigenStaerke, gegnerStaerke, lagebild, waehleZielraum, zielraeumeFuer } from "../../sim/krieg";
import { NET } from "../../sim/modell";
import { nationalAverage, startAverage } from "../../sim/netz";
import { RadarLegende, StreitkraefteRadar, abweichungsTon, gegenueber2026 } from "./zustand";
import type { KriegPhase } from "../../sim/krieg-typen";
import { land } from "../../sim/laender";
import type { GattungId } from "../../data/streitkraefte";
import { Schauplatz } from "../krieg/Schauplatz";
import { Besatzung } from "../krieg/Besatzung";
import { besatzungsSicht } from "../../sim/kriegsschauplatz";
import { Uebersicht, UbDetailKopf, UbHandlung, UbRueck, type UbKachel } from "../akte/Uebersicht";
import "./militaer.css";

const WEHRDIENST = [0, 6, 12, 18] as const;

const zahl = (n: number, stellen = 0): string => zahlI18n(Math.round(n * 10 ** stellen) / 10 ** stellen);
const landName = (id: string | null): string => (id ? land(id).name : "");

// Für Panzer, Drohnen, Luftabwehr, Marine und Raketen gibt es keine offene Bestandsquelle (IISS hinter Bezahlschranke,
// RECHERCHE_GITHUB_DATEN.md): der Wert ist ein Spielparameter, gezeigt als Anteil am Bestand vom Juni 2026 statt als „Index 100“.
// Seit dem 6. November als benannter Zustand („wie 2026“, „+12 % gegenüber 2026“, Befund G-12): „100 %“ las sich wie Einsatzbereitschaft.
// Das Personal steht auf Tausend gerundet („rund 355.000“), weil die Quelle keine Genauigkeit auf den Soldaten hergibt (Befund G-13).
function mengeText(g: { einheit: GattungSicht["einheit"]; start?: number; id?: GattungId }, n: number): string {
  if (g.einheit === "index") return gegenueber2026(g.start ? n / g.start : 1);
  if (g.einheit === "tage") return t("militaer.ui.einheit.tage", { n: zahl(n) });
  if (g.id === "personal") return t("nacht_n7.zustand.rund", { n: zahl(Math.round(n / 1000) * 1000) });
  return zahl(n);
}

/** Detailleiste einer Gattung: Bestand, Herkunft, alle Instrumente mit Preis und Wirkung, Ausmustern */
function GattungDetail({ world, g, onTat, antwort }: { world: World; g: GattungSicht; onTat: (r: { ok: boolean; text: string }) => void; antwort: { ok: boolean; text: string } | null }) {
  const diff = g.menge - g.start;
  return (
    <>
      <UbDetailKopf
        titel={t(`militaer.gattung.${g.id}`)}
        unter={`${mengeText(g, g.menge)} · ${t("militaer.ui.generation", { g: zahl(g.generation, 1) })}${Math.abs(diff) > 0.05 ? ` · ${t("militaer.ui.gegen_start", { n: mengeText(g, g.start) })}` : ""}${g.einheit === "index" ? ` · ${t("militaer.ui.indexHinweis")}` : ""}`}
        text={
          <>
            {t("militaer.ui.herkunft", { p: zahl(g.heimisch * 100) })}
            {g.heimisch < 0.995 && g.lieferland ? ` · ${t("militaer.ui.lieferland", { land: landName(g.lieferland) })}` : ""} · {t("militaer.ui.heim_generation", { g: zahl(g.heimGeneration, 1) })}
          </>
        }
      />
      <UbRueck antwort={antwort} />
      {(["kauf", "produktion", "entwicklung", "modernisierung"] as const).map((art) => {
        const v = vorschauAusbau(world, g.id, art);
        return (
          <UbHandlung
            key={art}
            titel={t(`militaer.art.${art}`)}
            knopf={t("militaer.ui.beauftragen")}
            ok={v.ok}
            grund={v.grund}
            preis={[t("ub.preis.kapital", { n: v.pk }), t("militaer.ui.preis_bip", { bip: zahl(v.bipGesamt, 2) }), t("ub.preis.monate", { n: v.monate })]}
            satz={
              <>
                {t("militaer.ui.vorschau.generation", { g: zahl(v.generation, 1) })}
                {v.risiko !== undefined ? ` · ${t("militaer.ui.vorschau.risiko", { p: zahl(v.risiko * 100) })}` : ""}
                {v.abhaengig ? <span className="sk-warnung"> · {t("militaer.ui.vorschau.abhaengig", { land: landName(v.abhaengig) })}</span> : null}
              </>
            }
            onTun={() => onTat(beginneAusbau(world, g.id, art))}
          />
        );
      })}
      <UbHandlung titel={t("militaer.art.ausmustern")} satz={t("militaer.ui.vorschau.ausmustern")} onTun={() => onTat(mustereAus(world, g.id))} leise />
    </>
  );
}

function Zielraeume({ world, onTat }: { world: World; onTat: (text: string) => void }) {
  const kriege = aktiveKriege(world).filter((k) => k.phase !== "frieden" && k.phase !== "beendet");
  return (
    <section className="sk-abschnitt">
      <p className="sk-hilfe">{t("militaer.ui.ziel_hilfe")}</p>
      {kriege.length === 0 && <p className="sk-leer">{t("militaer.ui.ziel_keins")}</p>}
      {kriege.map((k) => {
        const raeume = zielraeumeFuer(k.land);
        return (
          <div key={k.id} className="sk-krieg">
            <div className="sk-kopf">
              <strong>{t("militaer.ui.ziel_krieg", { land: landName(k.land) })}</strong>
              {/* Dieselbe Unsicherheit wie im Konfliktdossier (Befund G-19): Die Gegenwehr ist nur so genau, wie das Lagebild reicht */}
              <span className="sk-klein">{t("nacht_n7.ziel_staerke", { e: zahl(eigenStaerke(world, k)), g: gegnerSicht(world, gegnerStaerke(world, k.land)) })}</span>
            </div>
            {raeume.length === 0 && <p className="sk-leer">{t("militaer.ui.ziel_allgemein")}</p>}
            <ul className="sk-ziele">
              {raeume.map((z) => {
                const an = k.zielraum === z.id;
                return (
                  <li key={z.id}>
                    <button type="button" className={an ? "on" : ""} disabled={an} onClick={() => onTat(waehleZielraum(world, k.id, z.id).text)}>
                      <strong>{t(`militaer.zielraum.${z.id}`)}</strong>
                      <span>
                        {t("militaer.ui.ziel_gegenwehr", { f: zahl(z.schwierigkeit, 2) })} · {t(`militaer.ui.ziel_bedeutung.${z.bedeutung}`)}
                        {an ? ` · ${t("militaer.ui.gewaehlt")}` : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {k.phase === "krieg" && k.zielraum && <p className="sk-klein">{t("militaer.ui.ziel_wechsel")}</p>}
            <Schauplatz world={world} k={k} onTat={onTat} />
          </div>
        );
      })}
    </section>
  );
}

function gegnerSicht(world: World, g: number): string {
  const stufe = lagebild(world).stufe;
  if (stufe === "bekannt") return zahl(g);
  if (stufe === "vermutet") return `${zahl(g - 10)}–${zahl(g + 10)}`;
  return t("krieg.d.unbekannt");
}

const PHASEN_RANG: KriegPhase[] = ["spannung", "drohkulisse", "waffenruhe", "beschluss", "krieg"];
const schwerstePhase = (phasen: KriegPhase[]): KriegPhase => phasen.reduce((a, b) => (PHASEN_RANG.indexOf(b) > PHASEN_RANG.indexOf(a) ? b : a));

export function Streitkraefte({ world, refresh }: { world: World; refresh: () => void }) {
  useSprache();
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string } | null>(null);
  const s = streitkraefteSicht(world);
  const belegt = s.laufend.filter((b) => !b.name).length;
  const onTat = (r: { ok: boolean; text: string }) => {
    setAntwort(r);
    refresh();
  };
  const onText = (text: string) => onTat({ ok: true, text });
  const kriege = aktiveKriege(world).filter((k) => k.phase !== "frieden" && k.phase !== "beendet");
  const besetzt = besatzungsSicht(world).length;
  // Gilt eine gezielte US-Sanktion (CAATSA), zeigt der Zeitstrahl, welche Lieferung einzeln genehmigt ist und trotzdem kommt
  const caatsa = (world.spiel?.weltmodell as unknown as { aussen?: { sanktionen?: { id: string }[] } } | undefined)?.aussen?.sanktionen?.some((x) => x.id === "caatsa") ?? false;
  const laufendFuer = (id: string) => s.laufend.filter((b) => b.gattung === id).sort((x, y) => Number(!!y.name) - Number(!!x.name))[0];
  const kacheln: UbKachel[] = s.gattungen.map((g) => {
    const lauf = laufendFuer(g.id);
    const rest = lauf ? Math.max(0, Math.ceil((lauf.fertig - world.day) / 30)) : 0;
    const abhaengig = g.heimisch < 0.5 && g.lieferland;
    const diff = g.menge - g.start;
    return {
      id: g.id,
      gruppe: t(`militaer.ui.teil.${g.teil}`),
      titel: t(`militaer.gattung.${g.id}`),
      wert: mengeText(g, g.menge),
      // Generation nur bei Gerät; beim Personal und beim Munitionsvorrat sagt eine Punkteleiste nichts (Befund A9)
      ...(g.id === "personal" || g.id === "munition" ? {} : { leisten: [{ name: t("militaer.ui.gen_kurz"), stufe: Math.round(g.generation), max: 5 }] }),
      zeile: s.laufend.filter((b) => b.gattung === g.id && b.name).map((b) => b.name).join(", ") || t("militaer.ui.herkunft", { p: zahl(g.heimisch * 100) }),
      ...(lauf
        ? { marke: { text: lauf.gestoppt ? t("militaer.ui.gestoppt") : t("militaer.ui.in_monaten", { n: rest }), ton: "aktiv" as const } }
        : abhaengig
          ? { marke: { text: t("militaer.ui.abhaengig_kurz", { land: landName(g.lieferland) }), ton: "mittel" as const } }
          : diff < -0.05
            ? { marke: { text: t("militaer.ui.weniger"), ton: "schlecht" as const } }
            : {}),
      ton: lauf ? "aktiv" : diff < -0.05 ? "schlecht" : abhaengig ? "mittel" : "neutral",
      rang: 0,
    };
  });
  const gruppeLage = t("militaer.ui.gruppe_lage");
  kacheln.push({
    id: "_wehrdienst",
    gruppe: gruppeLage,
    titel: t("militaer.ui.wehrdienst"),
    wert: t(`militaer.ui.wehrdienst.${s.wehrdienst}`),
    zeile: t("militaer.ui.wehrdienst_kurz"),
  });
  kacheln.push({
    id: "_laufend",
    gruppe: gruppeLage,
    titel: t("militaer.ui.laufend"),
    wert: String(s.laufend.length),
    zeile: s.laufend.length ? [...s.laufend].sort((a, b) => Number(!!b.name) - Number(!!a.name)).slice(0, 2).map((x) => x.name ?? t(`militaer.gattung.${x.gattung as GattungId}`)).join(", ") : t("militaer.ui.laufend_leer"),
    anteil: belegt / Math.max(1, s.kapazitaet),
    // Freie Plätze als Marke im Fuß statt als Beschriftung unter der Zahl (Tag 6. November): die lange Beschriftung schob die Zahl in eine zweite Zeile
    ...(belegt >= s.kapazitaet
      ? { ton: "mittel" as const, marke: { text: t("militaer.ui.voll"), ton: "mittel" as const } }
      : { marke: { text: t("tag_t7.sk.frei", { n: s.kapazitaet - belegt }), ton: "neutral" as const } }),
  });
  kacheln.push({
    id: "_ziel",
    gruppe: gruppeLage,
    titel: t("militaer.ui.ziel"),
    wert: kriege.length ? String(kriege.length) : "–",
    zeile: kriege.length ? kriege.map((k) => landName(k.land)).join(", ") : t("militaer.ui.ziel_keins_kurz"),
    // „Krieg läuft“ nur, wenn geschossen wird; sonst die Phase des schwersten Vorgangs (Spannung, Drohkulisse …)
    ...(kriege.some((k) => k.phase === "krieg")
      ? { ton: "schlecht" as const, marke: { text: t("militaer.ui.krieg_laeuft"), ton: "schlecht" as const } }
      : kriege.length
        ? { ton: "mittel" as const, marke: { text: PHASEN_NAME[schwerstePhase(kriege.map((k) => k.phase))], ton: "mittel" as const } }
        : {}),
  });
  if (besetzt)
    kacheln.push({ id: "_besatzung", gruppe: gruppeLage, titel: t("krieg.besatzung.titel"), wert: String(besetzt), ton: "mittel", marke: { text: t("militaer.ui.besetzt"), ton: "mittel" } });
  const detail = (id: string) => {
    const g = s.gattungen.find((x) => x.id === id);
    if (g) return <GattungDetail key={id} world={world} g={g} onTat={onTat} antwort={antwort} />;
    if (id === "_wehrdienst")
      return (
        <>
          <UbDetailKopf titel={t("militaer.ui.wehrdienst")} text={t("militaer.ui.wehrdienst_hilfe")} />
          <UbRueck antwort={antwort} />
          <div className="sk-instrumente" role="group">
            {WEHRDIENST.map((m) => (
              <button key={m} type="button" className={s.wehrdienst === m ? "on" : ""} onClick={() => onTat(setzeWehrdienst(world, m))}>
                {t(`militaer.ui.wehrdienst.${m}`)}
              </button>
            ))}
          </div>
        </>
      );
    if (id === "_laufend")
      return (
        <>
          <UbDetailKopf titel={t("militaer.ui.laufend")} unter={t("nacht_n7.kapazitaet_frei", { n: Math.max(0, s.kapazitaet - belegt) })} />
          {s.laufend.length === 0 && <p className="sk-leer">{t("militaer.ui.laufend_leer")}</p>}
          <ol className="sk-zeitstrahl">
            {s.laufend.map((b) => {
              const gesamt = Math.max(1, b.fertig - b.beginn);
              const anteil = Math.max(0, Math.min(1, (world.day - b.beginn) / gesamt));
              const rest = Math.max(0, Math.ceil((b.fertig - world.day) / 30));
              return (
                <li key={b.id} className={b.gestoppt ? "gestoppt" : ""}>
                  <div className="sk-kopf">
                    <strong>{b.name ?? t(`militaer.gattung.${b.gattung as GattungId}`)}</strong>
                    <span className="sk-klein">
                      {t(`militaer.art.${b.art}`)} · {b.gestoppt ? t("militaer.ui.gestoppt") : t("militaer.ui.in_monaten", { n: rest })}
                      {b.lizenz === "einzelgenehmigung" && !b.gestoppt && caatsa ? ` · ${t("welle_e4.militaer.einzelgenehmigung")}` : ""}
                    </span>
                  </div>
                  <div className="sk-fortschritt">
                    <span style={{ width: `${anteil * 100}%` }} />
                  </div>
                  {(b.versorgungsVerzug ?? 0) > 0 && <p className="sk-klein">{t("gueter.kette.bauVerzug", { tage: b.versorgungsVerzug })}</p>}
                </li>
              );
            })}
          </ol>
        </>
      );
    if (id === "_ziel")
      return (
        <>
          <UbDetailKopf titel={t("militaer.ui.ziel")} />
          <UbRueck antwort={antwort} />
          <Zielraeume world={world} onTat={onText} />
        </>
      );
    if (id === "_besatzung")
      return (
        <>
          <UbRueck antwort={antwort} />
          <Besatzung world={world} onTat={onText} />
        </>
      );
    return null;
  };
  // Bereitschaft je Teilstreitkraft relativ zum Start (dieselben Knoten, die der Krieg in eigenStaerke liest)
  const bereit = (id: string) => (NET.index.has(id) ? nationalAverage(NET, world.net, id) / Math.max(1, startAverage(NET, world.net, id)) : 1);
  const achsen = (["heer", "luft", "see"] as const).map((teil) => ({ teil, name: t(`militaer.ui.teil.${teil}`), kampfkraft: s.teile[teil], bereitschaft: bereit(`bereitschaft_${teil}`) }));
  return (
    <div className="streitkraefte">
      <div className="sk-oben">
        <StreitkraefteRadar achsen={achsen} />
        <div className="sk-oben-text">
          <p className="sk-kampfkraft">
            <span>{t("militaer.ui.kampfkraft")}</span>
            <strong className={abweichungsTon(s.index)}>{gegenueber2026(s.index)}</strong>
          </p>
          <ul className="sk-achsen">
            {achsen.map((a) => (
              <li key={a.teil} className={abweichungsTon(Math.min(a.kampfkraft, a.bereitschaft))}>
                <b>{a.name}</b>
                <span>{t("nacht_n7.radar.zeile", { kraft: gegenueber2026(a.kampfkraft), bereit: gegenueber2026(a.bereitschaft) })}</span>
              </li>
            ))}
          </ul>
          <p className="sk-lagezeile">
            <span>
              {t("militaer.ui.etat")} <b>{t("militaer.ui.etat_wert", { p: zahl(s.etat * 100) })}</b>
            </span>
            <span>
              {t("militaer.ui.innovation")} <b>{t("militaer.ui.innovation_wert", { p: zahl(s.innovation * 100) })}</b>
            </span>
          </p>
          <RadarLegende />
        </div>
      </div>
      <Uebersicht
        aria={t("militaer.tab")}
        sortiert={false}
        kacheln={kacheln}
        start={kriege.length ? "_ziel" : undefined}
        detail={detail}
      />
    </div>
  );
}

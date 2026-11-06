// Akte „Außenlage“: Lage (Kennzahlen mit Verlauf, Vorwarnungen, Energie, Flucht, Terror, Friedensprozess, Sanktionen, Staatsführungen),
// Instrumente (mit Vorschau der Folgen) und Verlauf (Diagramme und Wirkungsberichte). Maßstab ist die Wirtschaftsakte.

import { useState } from "react";
import type { World } from "../../sim/types";
import { AGENDEN, aussenBerichte, aussenLage, aussenZustand, fuehreInstrumentAus, instrumente, sanktionsStaende, vorschau, type Agenda, type InstrumentId, type Lieferant } from "../../sim/diplomatie";
import { akteurName } from "../../sim/welt-modell";
import { t, zahl } from "../../i18n";
import "./aussenlage.css";

type Reiter = "lage" | "instrumente" | "verlauf";
const LIEFERANTEN: Lieferant[] = ["RUS", "AZE", "LNG", "IRN", "HEIM"];
const FARBE: Record<Lieferant, string> = { RUS: "#8c2b1f", AZE: "#2f6b45", LNG: "#2c4a7a", IRN: "#a8732b", HEIM: "#5c4a86" };
const nf = (x: number, d = 1) => zahl(x, d);

function Linie({ werte, breite = 140, hoehe = 34, label }: { werte: number[]; breite?: number; hoehe?: number; label: string }) {
  if (werte.length < 2) return <svg className="al-linie" width={breite} height={hoehe} role="img" aria-label={label} />;
  const min = Math.min(...werte);
  const max = Math.max(...werte);
  const span = max - min || 1;
  const pts = werte.map((v, i) => `${((i / (werte.length - 1)) * (breite - 4) + 2).toFixed(1)},${(hoehe - 3 - ((v - min) / span) * (hoehe - 6)).toFixed(1)}`).join(" ");
  const letzt = pts.split(" ").pop()!.split(",");
  return (
    <svg className="al-linie" width={breite} height={hoehe} viewBox={`0 0 ${breite} ${hoehe}`} role="img" aria-label={label}>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx={letzt[0]} cy={letzt[1]} r="2.6" fill="currentColor" />
    </svg>
  );
}

function Balken({ wert, ton }: { wert: number; ton: "gut" | "mittel" | "schlecht" }) {
  return (
    <i className={`al-balken ton-${ton}`} aria-hidden>
      <b style={{ width: `${Math.max(0, Math.min(100, wert))}%` }} />
    </i>
  );
}

/** eingebettet: im Aktenreiter „Weltlage“ unter dem Lageurteil; Titel und Zweck stehen dort schon */
export function Aussenlage({ world, refresh, eingebettet = false }: { world: World; refresh: () => void; eingebettet?: boolean }) {
  const [reiter, setReiter] = useState<Reiter>("lage");
  const lage = aussenLage(world);
  return (
    <div className="al">
      <header className="al-kopf">
        {!eingebettet && <h2>{t("aussen.ui.titel")}</h2>}
        {!eingebettet && <p>{t("aussen.ui.zweck")}</p>}
        <div className="al-reiter" role="tablist">
          {(["lage", "instrumente", "verlauf"] as Reiter[]).map((r) => (
            <button key={r} type="button" role="tab" aria-selected={reiter === r} className={reiter === r ? "on" : ""} onClick={() => setReiter(r)}>
              {t(`aussen.ui.reiter.${r}`)}
            </button>
          ))}
        </div>
      </header>
      {reiter === "lage" && <Lage world={world} lage={lage} />}
      {reiter === "instrumente" && <Instrumente world={world} refresh={refresh} />}
      {reiter === "verlauf" && <Verlauf world={world} lage={lage} />}
    </div>
  );
}

function Lage({ world, lage }: { world: World; lage: ReturnType<typeof aussenLage> }) {
  return (
    <div className="al-lage">
      {lage.vorwarnungen.length > 0 && (
        <section className="al-warn" aria-label={t("aussen.ui.vorwarnungen")}>
          <h3>{t("aussen.ui.vorwarnungen")}</h3>
          <ul>
            {lage.vorwarnungen.map((v) => (
              <li key={v.id} className={v.ernst === 2 ? "ernst" : ""}>
                {v.text}
              </li>
            ))}
          </ul>
        </section>
      )}
      {/* Kennzahlen-Kacheln entfallen: Ansehen und EU-Vertrauen stehen im Kopf (Befund G-9) */}
      <div className="al-raster">
        <section className="al-karte">
          <h3>{t("aussen.ui.energie")}</h3>
          <div className="al-mix" role="img" aria-label={t("aussen.ui.energie")}>
            {LIEFERANTEN.filter((l) => lage.energie.anteile[l] > 0).map((l) => (
              <span key={l} style={{ width: `${lage.energie.anteile[l]}%`, background: FARBE[l] }} title={`${t(`aussen.lieferant.${l}`)} ${nf(lage.energie.anteile[l], 0)} %`} />
            ))}
          </div>
          <ul className="al-legende">
            {LIEFERANTEN.filter((l) => lage.energie.anteile[l] > 0).map((l) => (
              <li key={l}>
                <i style={{ background: FARBE[l] }} /> {t(`aussen.lieferant.${l}`)} {nf(lage.energie.anteile[l], 0)} %
              </li>
            ))}
          </ul>
          <p>
            {t("aussen.ui.hormus")}: <b className={`al-chip h-${lage.energie.hormus}`}>{t(`aussen.ui.hormus_${lage.energie.hormus}`)}</b> · {t("aussen.ui.versorgung")}: <b>{nf(lage.energie.versorgung, 0)}</b>
          </p>
        </section>
        <section className="al-karte">
          <h3>{t("aussen.ui.flucht")}</h3>
          <p className="al-gross">{t("aussen.ui.flucht_bestand", { n: nf(lage.flucht.bestand, 2) })}</p>
          <p>{t("aussen.ui.flucht_fluss", { zu: Math.round(lage.flucht.zufluss * 1000), ab: Math.round(lage.flucht.abfluss * 1000) })}</p>
          <p>{t("aussen.ui.flucht_kosten", { k: nf(lage.flucht.kostenJahr, 2) })}</p>
        </section>
        {/* Terror und Friedensprozess stehen jetzt in der Sicherheit (Befund G-10, ui/militaer/InnereSicherheit.tsx) */}
        <section className="al-karte">
          <h3>{t("aussen.ui.sanktionen")}</h3>
          {lage.sanktionen.length === 0 ? <p>{t("aussen.ui.keine_sanktionen")}</p> : (
            <ul>
              {/* Wie man eine Sanktion loswird: Bedingung, Zählerstand und Wege (PRUEFUNG_GESAMT_2026-11-04) */}
              {sanktionsStaende(world).map((s) => (
                <li key={s.id}>
                  <b>{akteurName(s.von)}</b>: {t(`aussen.ui.sanktion.${s.id}`)}
                  {/* Welle B3: der Zähler als Balken mit Zahl, die Bedingung als eine Zeile, die Wege zum Aufklappen */}
                  <span className="al-zaehler">
                    <span className="al-zaehler-spur" aria-hidden><i style={{ width: `${Math.round((100 * s.zaehler) / Math.max(1, s.noetig))}%` }} /></span>
                    {t("aussen.ui.zaehler", { n: s.zaehler, noetig: s.noetig })}
                  </span>
                  <p className="al-klein">{s.bedingung}</p>
                  <details className="al-wege"><summary>{t("welle_b3.al.wege")}</summary><p className="al-klein">{s.wege.replace(/^[^:]{1,12}:\s*/, "")}</p></details>
                </li>
              ))}
            </ul>
          )}
          {(aussenZustand(world).eigeneSanktionen.length > 0) && (
            <>
              <h3>{t("aussen.ui.eigene_sanktionen")}</h3>
              <ul>
                {aussenZustand(world).eigeneSanktionen.map((id) => (
                  <li key={id}><b>{akteurName(id)}</b>{(aussenZustand(world).gegenSanktionen ?? []).includes(id) ? ` · ${t("aussen.ui.gegensanktion")}` : ""}</li>
                ))}
              </ul>
            </>
          )}
          {world.economy.sanktionsLast && (world.economy.sanktionsLast.risiko > 0 || world.economy.sanktionsLast.nachfrage > 0) && (
            <ul className="rr-kosten al-last" aria-label={t("aussen.ui.sanktion_last", { risiko: Math.round(world.economy.sanktionsLast.risiko), nachfrage: Math.round(world.economy.sanktionsLast.nachfrage * 10) / 10 })}>
              <li>{t("welle_b3.al.risiko")} <b>+{Math.round(world.economy.sanktionsLast.risiko)}</b></li>
              <li>{t("welle_b3.al.nachfrage")} <b>−{zahl(Math.round(world.economy.sanktionsLast.nachfrage * 10) / 10, 1)}</b></li>
            </ul>
          )}
          <h3>{t("aussen.ui.diaspora")}</h3>
          <div className="al-zeile">
            <span>{t("aussen.ui.diaspora_vertrauen")}</span>
            <Balken wert={lage.diaspora.vertrauen} ton={lage.diaspora.vertrauen >= 60 ? "gut" : lage.diaspora.vertrauen >= 40 ? "mittel" : "schlecht"} />
            <b>{Math.round(lage.diaspora.vertrauen)}</b>
          </div>
          {lage.diaspora.flussMrd !== 0 && <p>{t("aussen.ui.diaspora_fluss", { m: nf(lage.diaspora.flussMrd, 2) })}</p>}
        </section>
      </div>
      {/* Das Raster der Staatsführungen ohne Namen entfällt (Befund G-29); die Länder stehen in der Länderakte */}
    </div>
  );
}

function Instrumente({ world, refresh }: { world: World; refresh: () => void }) {
  const liste = instrumente(world);
  const [landWahl, setLandWahl] = useState<Record<string, string>>({});
  const [agenda, setAgenda] = useState<Agenda>("handel");
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  return (
    <div className="al-instr">
      {antwort && (
        <p className={`al-antwort ${antwort.ok ? "ok" : "nein"}`} role="status">
          {antwort.text} {antwort.why && <span>{antwort.why}</span>}
        </p>
      )}
      <div className="al-instr-raster">
        {liste.map((i) => {
          const landId = i.braucheLand ? landWahl[i.id] ?? i.laender[0] : undefined;
          const folgen = vorschau(world, i.id as InstrumentId, landId, agenda);
          return (
            <article key={i.id} className={`al-instrument${i.moeglich ? "" : " gesperrt"}`}>
              <h4>{i.label}</h4>
              <p>{i.text}</p>
              {i.braucheLand && i.laender.length > 0 && (
                <label className="al-feld">
                  {t("aussen.ui.land")}
                  <select value={landId} onChange={(e) => setLandWahl({ ...landWahl, [i.id]: e.target.value })}>
                    {i.laender.map((id) => (
                      <option key={id} value={id}>
                        {akteurName(id)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {i.id === "staatsbesuch" && (
                <label className="al-feld">
                  {t("aussen.ui.agenda")}
                  <select value={agenda} onChange={(e) => setAgenda(e.target.value as Agenda)}>
                    {AGENDEN.map((a) => (
                      <option key={a} value={a}>
                        {t(`aussen.agenda.${a}`)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <ul className="al-folgen">
                {folgen.map((f, n) => (
                  <li key={n} className={f.ton > 0 ? "gut" : f.ton < 0 ? "schlecht" : ""}>
                    {f.text}
                  </li>
                ))}
              </ul>
              <div className="al-instr-fuss">
                <span>{t("aussen.ui.preis", { pk: i.pk, a: i.aufmerksamkeit })}</span>
                <button
                  type="button"
                  className="brass-button"
                  disabled={!i.moeglich || (i.braucheLand && !landId)}
                  title={i.grund}
                  onClick={() => {
                    setAntwort(fuehreInstrumentAus(world, i.id as InstrumentId, landId, agenda));
                    refresh();
                  }}
                >
                  {t("aussen.ui.ausfuehren")}
                </button>
              </div>
              {!i.moeglich && i.grund && <p className="al-klein">{i.grund}</p>}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Verlauf({ world, lage }: { world: World; lage: ReturnType<typeof aussenLage> }) {
  const berichte = aussenBerichte(world);
  return (
    <div className="al-verlauf">
      {lage.monate.length < 2 && <p>{t("aussen.ui.verlauf_leer")}</p>}
      <div className="al-diagramme">
        {lage.kennzahlen.map((k) => (
          <figure key={k.id} className="al-diagramm">
            <figcaption>
              {t(`aussen.ui.kz.${k.id}`)} <span>{lage.monate[0] ?? ""} – {lage.monate[lage.monate.length - 1] ?? ""}</span>
            </figcaption>
            <Linie werte={k.reihe} breite={320} hoehe={90} label={t(`aussen.ui.kz.${k.id}`)} />
          </figure>
        ))}
      </div>
      <h3>{t("aussen.ui.berichte")}</h3>
      {berichte.length === 0 ? <p>{t("aussen.ui.berichte_leer")}</p> : (
        <ul className="al-berichte">
          {berichte.map((b) => (
            <li key={b.id}>
              <strong>{b.titel}</strong> <span className="al-klein">{b.datum} · {t(`aussen.ui.bericht_stand.${b.stand}`)}</span>
              {b.zeilen.length > 0 && (
                <ul>
                  {b.zeilen.map((z) => {
                    const d = z.nachher - z.vorher;
                    return (
                      <li key={z.key} className={Math.abs(d) < 0.5 ? "" : (z.key === "flucht" ? -d : d) > 0 ? "gut" : "schlecht"}>
                        {t(`aussen.ui.bk.${z.key}`)}: {nf(z.vorher, z.key === "flucht" ? 2 : 0)} → {nf(z.nachher, z.key === "flucht" ? 2 : 0)}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

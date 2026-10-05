// Die Streitkräfte als Bestand: Kampfkraft auf einen Blick, je Gattung Zahl, Generation und Herkunft, darunter die Instrumente
// (Kaufen, Produzieren, Entwickeln, Modernisieren, Ausmustern) mit Vorschau, der Wehrdienst, die laufenden Vorhaben und die
// Zielräume eines Krieges. Rechnet nichts selbst: alles kommt aus sim/streitkraefte.ts und sim/krieg.ts.

import { useState } from "react";
import type { World } from "../../sim/types";
import { t } from "../../i18n";
import { useSprache } from "../../i18n/react";
import {
  beginneAusbau,
  mustereAus,
  setzeWehrdienst,
  streitkraefteSicht,
  vorschauAusbau,
  type BeschaffungsArt,
  type GattungSicht,
} from "../../sim/streitkraefte";
import { aktiveKriege, eigenStaerke, gegnerStaerke, waehleZielraum, zielraeumeFuer } from "../../sim/krieg";
import { land } from "../../sim/laender";
import type { GattungId } from "../../data/streitkraefte";
import "./militaer.css";

type Instrument = BeschaffungsArt | "ausmustern";
const INSTRUMENTE: Instrument[] = ["kauf", "produktion", "entwicklung", "modernisierung", "ausmustern"];
const WEHRDIENST = [0, 6, 12, 18] as const;

const zahl = (n: number, stellen = 0): string => n.toLocaleString("de-DE", { maximumFractionDigits: stellen });
const landName = (id: string | null): string => (id ? land(id).name : "");

function mengeText(g: { einheit: GattungSicht["einheit"] }, n: number): string {
  if (g.einheit === "index") return t("militaer.ui.einheit.index", { n: zahl(n) });
  if (g.einheit === "tage") return t("militaer.ui.einheit.tage", { n: zahl(n) });
  return zahl(n);
}

function Balken({ wert, titel }: { wert: number; titel: string }) {
  // 100 = Stand 2026 sitzt in der Mitte der Skala (0 bis 200)
  const breite = Math.max(0, Math.min(100, wert / 2));
  return (
    <div className="sk-balken" title={titel}>
      <span className="sk-balken-wert" style={{ width: `${breite}%` }} />
      <span className="sk-balken-marke" />
    </div>
  );
}

function Generation({ g, heim }: { g: number; heim: number }) {
  return (
    <span className="sk-gen" aria-label={t("militaer.ui.generation", { g: zahl(g, 1) })}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= Math.round(g) ? "voll" : i <= heim ? "heim" : ""} />
      ))}
    </span>
  );
}

function Karte({ world, g, onTat }: { world: World; g: GattungSicht; onTat: (text: string) => void }) {
  const [gewaehlt, setGewaehlt] = useState<Instrument | null>(null);
  const v = gewaehlt && gewaehlt !== "ausmustern" ? vorschauAusbau(world, g.id, gewaehlt) : null;
  const fuehreAus = () => {
    if (!gewaehlt) return;
    const r = gewaehlt === "ausmustern" ? mustereAus(world, g.id) : beginneAusbau(world, g.id, gewaehlt);
    onTat(r.text);
    if (r.ok) setGewaehlt(null);
  };
  const diff = g.menge - g.start;
  return (
    <li className="sk-karte">
      <div className="sk-kopf">
        <h4>{t(`militaer.gattung.${g.id}`)}</h4>
        <strong className="sk-zahl">{mengeText(g, g.menge)}</strong>
      </div>
      <div className="sk-reihe">
        <Generation g={g.generation} heim={g.heimGeneration} />
        <span>{t("militaer.ui.generation", { g: zahl(g.generation, 1) })}</span>
        {Math.abs(diff) > 0.05 && <span className={diff > 0 ? "sk-plus" : "sk-minus"}>{t("militaer.ui.gegen_start", { n: mengeText(g, g.start) })}</span>}
      </div>
      <div className="sk-reihe sk-klein">
        <span>{t("militaer.ui.herkunft", { p: zahl(g.heimisch * 100) })}</span>
        {g.heimisch < 0.995 && g.lieferland && <span>{t("militaer.ui.lieferland", { land: landName(g.lieferland) })}</span>}
        <span>{t("militaer.ui.heim_generation", { g: zahl(g.heimGeneration, 1) })}</span>
      </div>
      <div className="sk-instrumente" role="group">
        {INSTRUMENTE.map((i) => (
          <button key={i} type="button" className={gewaehlt === i ? "on" : ""} onClick={() => setGewaehlt(gewaehlt === i ? null : i)}>
            {t(`militaer.art.${i}`)}
          </button>
        ))}
      </div>
      {gewaehlt && (
        <div className="sk-vorschau">
          {v ? (
            <>
              <p>{t("militaer.ui.vorschau.kosten", { pk: v.pk, bip: zahl(v.bipGesamt, 2) })}</p>
              <p>
                {t("militaer.ui.vorschau.dauer", { monate: v.monate })} · {t("militaer.ui.vorschau.generation", { g: zahl(v.generation, 1) })}
              </p>
              {v.risiko !== undefined && <p>{t("militaer.ui.vorschau.risiko", { p: zahl(v.risiko * 100) })}</p>}
              {v.abhaengig && <p className="sk-warnung">{t("militaer.ui.vorschau.abhaengig", { land: landName(v.abhaengig) })}</p>}
              {!v.ok && v.grund && <p className="sk-nicht">{v.grund}</p>}
            </>
          ) : (
            <p>{t("militaer.ui.vorschau.ausmustern")}</p>
          )}
          <div className="sk-reihe">
            <button type="button" className="sk-los" disabled={v ? !v.ok : false} onClick={fuehreAus}>
              {t(gewaehlt === "ausmustern" ? "militaer.art.ausmustern" : "militaer.ui.beauftragen")}
            </button>
            <button type="button" onClick={() => setGewaehlt(null)}>
              {t("militaer.ui.zurueck")}
            </button>
          </div>
        </div>
      )}
      <p className="sk-quelle">{t("militaer.ui.quelle", { q: g.quelle })}</p>
    </li>
  );
}

function Zielraeume({ world, onTat }: { world: World; onTat: (text: string) => void }) {
  const kriege = aktiveKriege(world).filter((k) => k.phase !== "frieden" && k.phase !== "beendet");
  return (
    <section className="sk-abschnitt">
      <h4>{t("militaer.ui.ziel")}</h4>
      <p className="sk-hilfe">{t("militaer.ui.ziel_hilfe")}</p>
      {kriege.length === 0 && <p className="sk-leer">{t("militaer.ui.ziel_keins")}</p>}
      {kriege.map((k) => {
        const raeume = zielraeumeFuer(k.land);
        return (
          <div key={k.id} className="sk-krieg">
            <div className="sk-kopf">
              <strong>{t("militaer.ui.ziel_krieg", { land: landName(k.land) })}</strong>
              <span className="sk-klein">{t("militaer.ui.ziel_staerke", { e: zahl(eigenStaerke(world, k)), g: zahl(gegnerStaerke(world, k.land)) })}</span>
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
          </div>
        );
      })}
    </section>
  );
}

export function Streitkraefte({ world, refresh }: { world: World; refresh: () => void }) {
  useSprache();
  const [meldung, setMeldung] = useState<string | null>(null);
  const s = streitkraefteSicht(world);
  const belegt = s.laufend.filter((b) => !b.name).length;
  const onTat = (text: string) => {
    setMeldung(text);
    refresh();
  };
  const nachTeil = (teil: GattungSicht["teil"]) => s.gattungen.filter((g) => g.teil === teil);
  return (
    <div className="streitkraefte">
      <p className="sk-hilfe">{t("militaer.ui.zweck")}</p>
      <section className="sk-lage">
        <div className="sk-gesamt">
          <span>{t("militaer.ui.kampfkraft")}</span>
          <strong>{zahl(s.index * 100)}</strong>
          <small>{t("militaer.ui.kampfkraft_hilfe")}</small>
        </div>
        <ul className="sk-teile">
          {(["heer", "luft", "see"] as const).map((teil) => (
            <li key={teil}>
              <span>{t(`militaer.ui.teil.${teil}`)}</span>
              <Balken wert={s.teile[teil] * 100} titel={zahl(s.teile[teil] * 100)} />
              <b>{zahl(s.teile[teil] * 100)}</b>
            </li>
          ))}
        </ul>
        <dl className="sk-rahmen">
          <dt>{t("militaer.ui.etat")}</dt>
          <dd>{t("militaer.ui.etat_wert", { p: zahl(s.etat * 100) })}</dd>
          <dt>{t("militaer.ui.innovation")}</dt>
          <dd>{t("militaer.ui.innovation_wert", { p: zahl(s.innovation * 100) })}</dd>
          <dt>{t("militaer.ui.kapazitaet")}</dt>
          <dd>{t("militaer.ui.kapazitaet_wert", { belegt, kap: s.kapazitaet })}</dd>
        </dl>
      </section>
      {meldung && (
        <p className="sk-meldung" role="status">
          {meldung}
        </p>
      )}
      {(["heer", "luft", "see"] as const).map((teil) => (
        <section key={teil} className="sk-abschnitt">
          <h4>{t(`militaer.ui.teil.${teil}`)}</h4>
          <ul className="sk-liste">
            {nachTeil(teil).map((g) => (
              <Karte key={g.id} world={world} g={g} onTat={onTat} />
            ))}
          </ul>
        </section>
      ))}
      <section className="sk-abschnitt">
        <h4>{t("militaer.ui.wehrdienst")}</h4>
        <p className="sk-hilfe">{t("militaer.ui.wehrdienst_hilfe")}</p>
        <div className="sk-instrumente" role="group">
          {WEHRDIENST.map((m) => (
            <button key={m} type="button" className={s.wehrdienst === m ? "on" : ""} onClick={() => onTat(setzeWehrdienst(world, m).text)}>
              {t(`militaer.ui.wehrdienst.${m}`)}
            </button>
          ))}
        </div>
      </section>
      <section className="sk-abschnitt">
        <h4>{t("militaer.ui.laufend")}</h4>
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
                  </span>
                </div>
                <div className="sk-fortschritt">
                  <span style={{ width: `${anteil * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
      </section>
      <Zielraeume world={world} onTat={onTat} />
    </div>
  );
}

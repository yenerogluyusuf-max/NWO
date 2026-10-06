// Die acht Bereichsakten im Gerüst der Wirtschaftsakte (VISION_IM_DETAIL 0.2): Gesellschaft, Parlament und Recht, Regierung,
// Sicherheit, Außenpolitik, Land, Agenda, Medien. Lage, Verlauf und Personen entstehen hier aus den vorhandenen Daten (nur lesen);
// die bisherigen Ansichten des Bereichs liegen unverändert im Reiter „Instrumente“ (Unterreiter), damit keine Funktion verloren geht.

import type { ReactNode } from "react";
import { aktuelleLocale, t } from "../../i18n";
import { NET } from "../../sim/modell";
import { nationalAverage } from "../../sim/netz";
import { gesellschaftLage, milieuLage } from "../../sim/gesellschaft";
import { medienVon, rsfSicht, lizenzVon } from "../../sim/medien";
import { MEDIEN_CLUSTER } from "../../data/medien";
import { programmZustand, schrittMitProgramm } from "../../sim/programme";
import { zielStand } from "../../sim/ziele";
import { alleLaufenden } from "../../sim/abkommen";
import { aktiveKriege, PHASEN_NAME } from "../../sim/krieg";
import { paktSicht } from "../../sim/pakte";
import { vorhabenDef } from "../../sim/reich";
import { akteurName } from "../../sim/welt-modell";
import { kapitalEinkommen } from "../../sim/spiel";
import { PROVINZEN } from "../../sim/regional";
import type { Figur } from "../../sim/spiel-typen";
import type { World } from "../../sim/types";
import { Akte, VorgaengePlatz, type AktenReiterId, type Kernwert } from "./Akte";
import { VerlaufsDiagramm, type VerlaufsReihe } from "./Kennzahl";
import { BerichtListe, PersonenListe, berichteFuer } from "./Bausteine";
import { mehrheitsSicht } from "./lage";
import { BehoerdenInstrument } from "../behoerden/Instrument";
import { laufendeVerfahren } from "../../sim/gesetzgebung";

export type BereichId = "gesellschaft" | "recht" | "regierung" | "sicherheit" | "aussen" | "land" | "wissen" | "medien";

export const BEREICHE: readonly BereichId[] = ["gesellschaft", "recht", "regierung", "sicherheit", "aussen", "land", "wissen", "medien"];

const nf = (x: number, d = 0) => x.toLocaleString(aktuelleLocale(), { minimumFractionDigits: d, maximumFractionDigits: d });

/** Landesmittel eines Netzknotens; undefined, wenn es den Knoten nicht gibt. */
function knoten(w: World, id: string): number | undefined {
  if (NET.index.get(id) === undefined) return undefined;
  return nationalAverage(NET, w.net, id);
}

const ton = (x: number, gut: number, schlecht: number): Kernwert["ton"] => (gut > schlecht ? (x >= gut ? "gut" : x <= schlecht ? "schlecht" : "mittel") : x <= gut ? "gut" : x >= schlecht ? "schlecht" : "mittel");

/** Zustimmungsverlauf der letzten zwölf Monate (älteste zuerst). */
function zustimmungsVerlauf(w: World): number[] {
  return (w.spiel?.umfrage.verlauf ?? []).slice(-12).map((v) => v.wert);
}

function knotenKern(w: World, id: string, label: string, gut: number, schlecht: number): Kernwert {
  const x = knoten(w, id);
  if (x === undefined) return leer(label);
  return { label, wert: nf(x), ton: ton(x, gut, schlecht) };
}

// ---------------------------------------------------------------------------
// Kernwerte je Bereich (drei, aus vorhandenen Daten)

/** Platzhalter, damit der Kopf immer drei Felder hat: fehlt eine Größe im Stand, steht dort ein Strich mit Begründung. */
function leer(label: string): Kernwert {
  return { label, wert: "—", hinweis: t("akte.b.kern.keineDaten") };
}

export function kernwerteBereich(w: World, b: BereichId): Kernwert[] {
  const sp = w.spiel;
  const k: (Kernwert | undefined)[] = [];
  switch (b) {
    case "gesellschaft": {
      const lage = sp ? gesellschaftLage(w) : [];
      const reihe = (id: string) => (lage.find((x) => x.id === id)?.reihe.werte ?? []).filter((v): v is number => v !== null).slice(-12);
      const zust = sp?.umfrage.zustimmung;
      k.push(zust !== undefined ? { label: t("akte.b.kern.zustimmung"), wert: `${nf(zust)} %`, verlauf: zustimmungsVerlauf(w), ton: ton(zust, 50, 40) } : leer(t("akte.b.kern.zustimmung")));
      const pol = lage.find((x) => x.id === "polarisierung");
      k.push(pol ? { label: t("akte.b.kern.polarisierung"), wert: nf(pol.wert), verlauf: reihe("polarisierung"), ton: ton(pol.wert, 40, 65) } : leer(t("akte.b.kern.polarisierung")));
      const pro = lage.find((x) => x.id === "protest");
      k.push(pro ? { label: t("akte.b.kern.protest"), wert: nf(pro.wert), verlauf: reihe("protest"), ton: ton(pro.wert, 35, 60) } : leer(t("akte.b.kern.protest")));
      break;
    }
    case "recht": {
      const m = mehrheitsSicht(w);
      k.push(m.vorhanden ? { label: t("akte.b.kern.mehrheit"), wert: nf(m.lager + m.geduldet), hinweis: t("akte.b.kern.mehrheitHinweis", { lager: m.lager, geduldet: m.geduldet, schwelle: m.schwelle }), ton: m.steht ? "gut" : "schlecht" } : leer(t("akte.b.kern.mehrheit")));
      k.push({ label: t("akte.b.kern.gesetze"), wert: nf(sp?.gesetze.length ?? 0) });
      k.push(knotenKern(w, "justiz_unabhaengigkeit", t("akte.b.kern.justiz"), 55, 35));
      break;
    }
    case "regierung": {
      const figs = (sp?.figuren ?? []).filter((f) => f.imAmt && f.amt !== "opposition" && f.amt !== "partner");
      const schnitt = figs.length ? figs.reduce((s, f) => s + f.loyalitaet, 0) / figs.length : 0;
      k.push(figs.length ? { label: t("akte.b.kern.loyalitaet"), wert: nf(schnitt), ton: ton(schnitt, 60, 40) } : leer(t("akte.b.kern.loyalitaet")));
      const offen = (sp?.zusagen ?? []).filter((z) => !z.erfuellt && !z.gebrochen);
      const ueberfaellig = offen.filter((z) => z.faellig < w.day).length;
      k.push({ label: t("akte.b.kern.zusagen"), wert: nf(offen.length), hinweis: t("akte.b.kern.ueberfaellig", { n: ueberfaellig }), ton: ueberfaellig > 0 ? "schlecht" : "mittel" });
      k.push(sp ? { label: t("akte.b.kern.kabinettErtrag"), wert: `+${nf(kapitalEinkommen(w).kabinett, 1)}` } : leer(t("akte.b.kern.kabinettErtrag")));
      break;
    }
    case "sicherheit": {
      k.push(knotenKern(w, "bereitschaft_heer", t("akte.b.kern.bereitschaft"), 60, 40));
      k.push(knotenKern(w, "abschreckung", t("akte.b.kern.abschreckung"), 60, 40));
      const kriege = sp ? aktiveKriege(w).length : 0;
      k.push({ label: t("akte.b.kern.konflikte"), wert: nf(kriege), ton: kriege > 0 ? "schlecht" : "gut" });
      break;
    }
    case "aussen": {
      k.push(knotenKern(w, "ansehen", t("akte.b.kern.ansehen"), 55, 40));
      k.push(knotenKern(w, "beziehungen_eu", t("akte.b.kern.eu"), 55, 35));
      k.push({ label: t("akte.b.kern.vertraege"), wert: nf(sp ? alleLaufenden(w).length : 0) });
      break;
    }
    case "land": {
      const faelle = (sp?.katastrophen?.faelle ?? []).filter((f) => !f.bewaeltigt).length;
      k.push({ label: t("akte.b.kern.faelle"), wert: nf(faelle), ton: faelle > 0 ? "schlecht" : "gut" });
      k.push({ label: t("akte.b.kern.bauten"), wert: nf(sp?.reich?.laufend.length ?? 0) });
      k.push(knotenKern(w, "verkehrsnetz", t("akte.b.kern.infrastruktur"), 60, 40));
      break;
    }
    case "wissen": {
      const z = sp ? programmZustand(w) : undefined;
      k.push({ label: t("akte.b.kern.programmeLaufend"), wert: nf(z?.laufend.length ?? 0) });
      const ziele = sp ? zielStand(w) : [];
      k.push(ziele.length ? { label: t("akte.b.kern.ziele"), wert: `${nf(ziele.filter((x) => x.erreicht).length)} / ${nf(ziele.length)}` } : { label: t("akte.b.kern.ziele"), wert: nf(0), hinweis: t("akte.b.kern.keineZiele"), ton: "mittel" });
      k.push(knotenKern(w, "hochschule", t("akte.b.kern.hochschule"), 60, 40));
      break;
    }
    case "medien": {
      if (sp) {
        const rsf = rsfSicht(w);
        k.push({ label: t("akte.b.kern.pressefreiheit"), wert: nf(rsf.score, 1), verlauf: rsf.verlauf.slice(-12).map((v) => v.score), ton: ton(rsf.score, 50, 30) });
        const m = medienVon(w);
        const gesperrt = Object.keys(m.cluster).filter((id) => lizenzVon(w, id) === "gesperrt").length;
        k.push({ label: t("akte.b.kern.gesperrt"), wert: nf(gesperrt), ton: gesperrt > 0 ? "schlecht" : "gut" });
        k.push({ label: t("akte.b.kern.ausweich"), wert: nf(m.ausweich) });
      } else {
        k.push(leer(t("akte.b.kern.pressefreiheit")), leer(t("akte.b.kern.gesperrt")), leer(t("akte.b.kern.ausweich")));
      }
      break;
    }
  }
  return k.filter((x): x is Kernwert => !!x);
}

// ---------------------------------------------------------------------------
// Lage: Kennzahlen und eine kurze Liste je Bereich

interface LageZeile {
  titel: string;
  meta?: string;
  ton?: "gut" | "mittel" | "schlecht";
}

function lageZeilen(w: World, b: BereichId): { kopf: string; zeilen: LageZeile[] }[] {
  const sp = w.spiel;
  if (!sp) return [];
  switch (b) {
    case "gesellschaft":
      return [
        {
          kopf: t("akte.b.lage.milieus"),
          zeilen: milieuLage(w).map((m) => ({ titel: t(`ges.milieu.${m.id}`), meta: t("akte.b.lage.milieuMeta", { s: m.stimmung, g: m.groll }), ton: ton(m.stimmung, 50, 35) })),
        },
      ];
    case "recht":
      return [
        {
          kopf: t("akte.b.lage.gesetze"),
          zeilen: sp.gesetze.map((g) => ({ titel: g.name, meta: t("akte.b.lage.abstimmungIn", { tage: Math.max(0, g.abstimmung - w.day) }) })),
        },
        {
          kopf: t("gesetz.ui.beimGericht"),
          zeilen: laufendeVerfahren(w).gericht.map((v) => ({ titel: v.titel, meta: t("gesetz.ui.urteilIn", { tage: v.tage, p: Math.round(v.p * 100) }), ton: (v.p >= 0.3 ? "schlecht" : "mittel") as LageZeile["ton"] })),
        },
      ];
    case "regierung":
      return [
        {
          kopf: t("akte.b.lage.zusagen"),
          zeilen: sp.zusagen
            .filter((z) => !z.erfuellt && !z.gebrochen)
            .sort((a, c) => a.faellig - c.faellig)
            .slice(0, 6)
            .map((z) => ({ titel: z.text, meta: z.faellig < w.day ? t("akte.b.lage.ueberfaelligSeit", { tage: w.day - z.faellig, von: z.von }) : t("akte.b.lage.faelligIn", { tage: z.faellig - w.day, von: z.von }), ton: z.faellig < w.day ? "schlecht" : "mittel" })),
        },
      ];
    case "sicherheit": {
      const kriege = aktiveKriege(w).map((k) => ({ titel: akteurName(k.land), meta: t("akte.b.lage.konfliktMeta", { phase: PHASEN_NAME[k.phase] ?? k.phase, front: Math.round(k.front) }), ton: (k.front >= 55 ? "gut" : k.front <= 40 ? "schlecht" : "mittel") as LageZeile["ton"] }));
      const pakte = paktSicht(w).filter((p) => p.tuerkeiMitglied).map((p) => ({ titel: p.name, meta: p.gespalten ? t("akte.b.lage.paktGespalten") : t("akte.b.lage.paktMitglieder", { n: p.mitglieder.length }) }));
      return [
        { kopf: t("akte.b.lage.konflikte"), zeilen: kriege },
        { kopf: t("akte.b.lage.pakte"), zeilen: pakte },
      ];
    }
    case "aussen":
      return [{ kopf: t("akte.b.lage.vertraege"), zeilen: alleLaufenden(w).map((v) => ({ titel: akteurName(v.land), meta: t("akte.b.lage.vertragMeta", { jahre: v.jahre, verstoesse: v.verstoesse }) })) }];
    case "land": {
      const faelle = (sp.katastrophen?.faelle ?? []).filter((f) => !f.bewaeltigt).map((f) => ({ titel: t(`akte.b.katastrophe.${f.art}`), meta: f.provinzen.map((p) => PROVINZEN[p - 1]?.name ?? String(p)).join(", "), ton: "schlecht" as const }));
      const bauten = (sp.reich?.laufend ?? []).map((l) => ({ titel: vorhabenDef(l.id)?.name ?? l.id, meta: l.pausiert ? t("akte.b.lage.pausiert") : t("akte.b.lage.seit", { d: l.start }) }));
      return [
        { kopf: t("akte.b.lage.faelle"), zeilen: faelle },
        { kopf: t("akte.b.lage.bauten"), zeilen: bauten },
      ];
    }
    case "wissen": {
      const z = programmZustand(w);
      const laufend = z.laufend.map((l) => ({ titel: schrittMitProgramm(l.schritt)?.schritt.titel ?? l.schritt, meta: t("akte.b.lage.fertigIn", { tage: Math.max(0, l.ende - w.day) }) }));
      const ziele = zielStand(w).map((x) => ({ titel: x.def.titel, meta: x.stand, ton: (x.erreicht ? "gut" : "mittel") as LageZeile["ton"] }));
      return [
        { kopf: t("akte.b.lage.programme"), zeilen: laufend },
        { kopf: t("akte.b.lage.ziele"), zeilen: ziele },
      ];
    }
    case "medien": {
      const m = medienVon(w);
      return [
        {
          kopf: t("akte.b.lage.cluster"),
          zeilen: Object.entries(m.cluster).map(([id, c]) => {
            const l = lizenzVon(w, id);
            return { titel: MEDIEN_CLUSTER.find((c) => c.id === id)?.name ?? id, meta: t("akte.b.lage.clusterMeta", { lizenz: t(`medien.lizenz.${l}`), zensur: Math.round(c.selbstzensur) }), ton: (l === "gesperrt" ? "schlecht" : l === "frei" ? "gut" : "mittel") as LageZeile["ton"] };
          }),
        },
      ];
    }
  }
}

export type LageStufe = "ruhig" | "gemischt" | "angespannt" | "kritisch";

/** Ein Satz statt Zahlenwand: Stufe aus den Tönen der drei Kernwerte, Begründung aus den auffälligen. */
export function lageUrteil(w: World, b: BereichId): { stufe: LageStufe; satz: string } {
  const kern = kernwerteBereich(w, b).filter((k) => k.wert !== "—");
  const schlecht = kern.filter((k) => k.ton === "schlecht");
  const mittel = kern.filter((k) => k.ton === "mittel");
  const stufe: LageStufe = schlecht.length >= 2 ? "kritisch" : schlecht.length === 1 ? "angespannt" : mittel.length >= 2 ? "gemischt" : "ruhig";
  const gruende = (schlecht.length ? schlecht : mittel).map((k) => t("akte.b.urteil.grund", { label: k.label, wert: k.wert }));
  const satz = stufe === "ruhig" || gruende.length === 0
    ? t("akte.b.urteil.ruhigSatz")
    : t("akte.b.urteil.weil", { gruende: gruende.join(" · ") });
  return { stufe, satz };
}

/** Sichtbar bleiben die ersten Einträge; der Rest ist aufklappbar. */
const SICHTBAR = 4;

function Zeilen({ zeilen }: { zeilen: LageZeile[] }) {
  const li = (z: LageZeile, i: number) => (
    <li key={`${z.titel}-${i}`} className={z.ton ?? ""}>
      <b>{z.titel}</b>
      {z.meta && <span>{z.meta}</span>}
    </li>
  );
  // Auffälliges zuerst, damit die sichtbaren Zeilen die wichtigen sind
  const rang = (z: LageZeile) => (z.ton === "schlecht" ? 0 : z.ton === "mittel" ? 1 : 2);
  const sortiert = zeilen.map((z, i) => ({ z, i })).sort((a, c) => rang(a.z) - rang(c.z) || a.i - c.i).map((x) => x.z);
  const vorn = sortiert.slice(0, SICHTBAR);
  const rest = sortiert.slice(SICHTBAR);
  return (
    <>
      <ul className="ak-liste">{vorn.map(li)}</ul>
      {rest.length > 0 && (
        <details className="ak-mehr">
          <summary>{t("akte.b.lage.mehr", { n: rest.length })}</summary>
          <ul className="ak-liste">{rest.map((z, i) => li(z, i + SICHTBAR))}</ul>
        </details>
      )}
    </>
  );
}

function LageAnsicht({ w, b, onInstrumente }: { w: World; b: BereichId; onInstrumente: () => void }) {
  const gruppen = lageZeilen(w, b);
  const urteil = lageUrteil(w, b);
  // Die drei Kernwerte stehen schon im Kopf; die Lage zeigt ihre Begründungen nur aufgeklappt.
  const hinweise = kernwerteBereich(w, b).filter((k) => k.hinweis && k.wert !== "—");
  return (
    <div className="ak-lage">
      <div className={`ak-urteil ${urteil.stufe}`}>
        <strong>{t(`akte.b.urteil.${urteil.stufe}`)}</strong>
        <span>{urteil.satz}</span>
        <button type="button" className="ak-urteil-knopf" onClick={onInstrumente}>
          {t("akte.b.lage.zuInstrumenten")}
        </button>
      </div>
      {hinweise.length > 0 && (
        <details className="ak-mehr">
          <summary>{t("akte.b.lage.woher")}</summary>
          <ul className="ak-liste">
            {hinweise.map((k) => (
              <li key={k.label} className={k.ton ?? ""}>
                <b>{k.label}: {k.wert}</b>
                <span>{k.hinweis}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
      {gruppen.map((g) => (
        <section key={g.kopf}>
          <h3 className="ak-abschnitt">{g.kopf}</h3>
          {g.zeilen.length === 0 ? <p className="ak-leer">{t("akte.b.lage.leer")}</p> : <Zeilen zeilen={g.zeilen} />}
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Verlauf: Diagramme aus vorhandenen Verlaufsdaten, Wirkungsberichte des Bereichs

/** Themen des Politiknetzes je Bereich (für die Wirkungsberichte). */
export const BEREICH_THEMEN: Record<BereichId, readonly string[]> = {
  gesellschaft: ["gesellschaft", "wohnen", "gesundheit", "bildung"],
  recht: ["recht"],
  regierung: ["haushalt", "recht", "gesellschaft"],
  sicherheit: ["sicherheit", "militaer"],
  aussen: ["aussen"],
  land: ["infrastruktur", "landwirtschaft", "energie", "kultur", "wohnen"],
  wissen: ["bildung"],
  medien: ["gesellschaft"],
};

/** Zuständige Ämter je Bereich (Reiter Personen). */
export const BEREICH_AEMTER: Record<BereichId, readonly Figur["amt"][]> = {
  gesellschaft: ["inneres", "opposition"],
  recht: ["justiz", "partner", "opposition"],
  regierung: ["stab", "finanzen", "inneres", "aussen", "justiz", "generalstab", "wirtschaft", "partner"],
  sicherheit: ["generalstab", "inneres"],
  aussen: ["aussen"],
  land: ["inneres", "wirtschaft"],
  wissen: ["stab", "wirtschaft"],
  medien: ["stab", "inneres"],
};

function verlaufsReihen(w: World, b: BereichId): VerlaufsReihe[] {
  const sp = w.spiel;
  if (!sp) return [];
  const zust = sp.umfrage.verlauf.slice(-36);
  const zustimmung: VerlaufsReihe = { id: "zustimmung", name: t("akte.b.kern.zustimmung"), einheit: "%", stellen: 0, monate: zust.map((v) => v.monat), werte: zust.map((v) => v.wert) };
  if (b === "gesellschaft") {
    const lage = gesellschaftLage(w);
    return [
      zustimmung,
      ...lage.map((x) => {
        const paare = x.reihe.werte.map((v, i) => [v, x.reihe.monate[i]] as const).filter((p): p is readonly [number, string] => p[0] !== null).slice(-36);
        return { id: x.id, name: t(`akte.b.reihe.${x.id}`), einheit: "", stellen: 0, monate: paare.map((p) => p[1]), werte: paare.map((p) => p[0]) };
      }),
    ];
  }
  if (b === "medien") {
    const rsf = rsfSicht(w).verlauf.slice(-36);
    return [{ id: "rsf", name: t("akte.b.kern.pressefreiheit"), einheit: "", stellen: 1, monate: rsf.map((v) => v.datum.slice(0, 7)), werte: rsf.map((v) => v.score) }, zustimmung];
  }
  return [zustimmung];
}

function VerlaufAnsicht({ w, b }: { w: World; b: BereichId }) {
  const reihen = verlaufsReihen(w, b).filter((r) => r.werte.length > 1);
  return (
    <div className="ak-verlauf">
      {reihen.length > 0 ? (
        <div className="ak-diagramme">
          {reihen.map((r) => (
            <VerlaufsDiagramm key={r.id} reihe={r} />
          ))}
        </div>
      ) : (
        <p className="ak-leer">{t("akte.b.verlauf.keineDaten")}</p>
      )}
      <h3 className="ak-abschnitt">{t("akte.verlauf.berichte")}</h3>
      <BerichtListe berichte={berichteFuer(w, BEREICH_THEMEN[b])} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rahmen: Bereichsakte mit den bisherigen Ansichten als Instrumente

export interface BereichsAkteProps {
  bereich: BereichId;
  world: World;
  /** Die bisherigen Ansichten des Bereichs (Kennung und Name), Unterreiter der Instrumente */
  tabs: { id: string; label: string }[];
  aktiverTab: string;
  onTab: (id: string) => void;
  reiter: AktenReiterId;
  onReiter: (r: AktenReiterId) => void;
  /** Vorgang, den der Reiter „Vorgänge“ geöffnet zeigt (Sprung von Schreibtisch, Zusagen oder Karte) */
  vorgangStart?: string | undefined;
  /** Inhalt der aktiven Ansicht */
  children: ReactNode;
}

export function BereichsAkte({ bereich, world, tabs, aktiverTab, onTab, reiter, onReiter, vorgangStart, children }: BereichsAkteProps) {
  const instrumente = () => (
    <div className="ak-instrumente">
      {tabs.length > 1 && (
        <nav className="ak-unterreiter" role="tablist" aria-label={t("akte.b.instrumente.aria")}>
          {tabs.map((tab) => (
            <button key={tab.id} type="button" role="tab" aria-selected={aktiverTab === tab.id} className={aktiverTab === tab.id ? "on" : ""} onClick={() => onTab(tab.id)}>
              <b>{tab.label}</b>
            </button>
          ))}
        </nav>
      )}
      {children}
      <BehoerdenInstrument w={world} bereich={bereich} />
    </div>
  );
  return (
    <Akte
      bereich={bereich}
      zweck={t(`akte.b.${bereich}.zweck`)}
      kernwerte={kernwerteBereich(world, bereich)}
      aktiv={reiter}
      onReiter={onReiter}
      reiter={[
        { id: "lage", text: t("akte.b.reiter.lage"), inhalt: () => <LageAnsicht w={world} b={bereich} onInstrumente={() => onReiter("instrumente")} /> },
        { id: "instrumente", text: t("akte.b.reiter.instrumente"), inhalt: instrumente },
        { id: "verlauf", text: t("akte.b.reiter.verlauf"), inhalt: () => <VerlaufAnsicht w={world} b={bereich} /> },
        { id: "personen", text: t("akte.b.reiter.personen"), inhalt: () => <PersonenListe w={world} aemter={BEREICH_AEMTER[bereich]} /> },
        { id: "vorgaenge", inhalt: () => <VorgaengePlatz w={world} start={vorgangStart} /> },
      ]}
    />
  );
}

/** Hüllt den Inhalt einer Gruppe in die Bereichsakte, wenn die Gruppe eine hat; sonst bleibt der Inhalt, wie er ist. */
export function AkteRahmen(props: Omit<BereichsAkteProps, "bereich"> & { bereich?: BereichId | undefined }) {
  const { bereich, children, ...rest } = props;
  if (!bereich) return <>{children}</>;
  return (
    <BereichsAkte bereich={bereich} {...rest}>
      {children}
    </BereichsAkte>
  );
}

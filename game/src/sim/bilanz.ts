// Bilanz der Amtszeit: das Geschichtsbuchkapitel, aus den tatsächlichen Daten der Partie gebaut.
// Kein erzählter Text erfindet Zahlen; jede Angabe stammt aus dem Weltzustand oder der Chronik.

import { istEntscheidung, istGetroffen } from "./chronik";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { formatDateDe } from "./dates";
import { zielStand } from "./ziele";
import { PROVINCES } from "./netz";
import type { World } from "./types";
import { PROGRAMME, programmZustand } from "./programme";
import { LAENDER, haltungWort, vertrauenZu, weltZustand } from "./laender";
import { katastrophenBilanz } from "./katastrophe";
import { waehlerLage, zustimmungsBilanz } from "./waehler";
import { putschRisiko, amtsenthebungSitze } from "./enden";
import { zusagenBilanz } from "./zusagen";
import { kriege } from "./krieg";
import { t } from "../i18n";
import type { ChronikEintrag } from "./spiel-typen";

export interface Bilanz {
  titel: string;
  absaetze: string[];
  kennzahlen: { name: string; start: string; ende: string; urteil: "besser" | "schlechter" | "gleich" }[];
  ziele: { titel: string; erreicht: boolean; stand: string }[];
  chronik: ChronikEintrag[];
}

/** Prozentwert mit einer Nachkommastelle in der Sprache des Spiels */
const prozentText = (x: number): string => t("bilanz.kz.prozent", { n: Math.round(x * 10) / 10 });

// „sank von 31,5 auf 30,1 Prozent“ oder, wenn sich nichts bewegt hat, „blieb bei 31,5 Prozent“
/** Wie sich eine Größe bewegte, als Satzteil in der Sprache des Spiels (bilanz.wandel.<groesse>: auf, ab oder gleich). */
function wandel(groesse: "inflation" | "alq" | "schulden" | "vertrauen", vorher: number, nachher: number, stellen = 1): string {
  const r = (x: number) => Math.round(x * 10 ** stellen) / 10 ** stellen;
  const richtung = r(vorher) === r(nachher) ? "gleich" : nachher > vorher ? "auf" : "ab";
  return t(`bilanz.wandel.${groesse}`, { richtung, von: r(vorher), nach: r(nachher) });
}

function dauer(tage: number): string {
  const monate = Math.max(1, Math.round(tage / 30.4));
  return monate < 24 ? t("bilanz.dauer.monate", { n: monate }) : t("bilanz.dauer.jahre", { n: Math.round((tage / 365) * 10) / 10 });
}

export function akuteProbleme(w: World): number {
  let n = 0;
  for (const node of NET.nodes) {
    if (node.kind !== "problem" || !node.threshold) continue;
    const i = NET.index.get(node.id)!;
    for (let p = 0; p < PROVINCES; p++) {
      if (w.net.values[i * PROVINCES + p]! >= node.threshold) {
        n++;
        break;
      }
    }
  }
  return n;
}

function urteil(vorher: number, nachher: number, kleinerIstBesser: boolean, schwelle = 0.3): "besser" | "schlechter" | "gleich" {
  const d = nachher - vorher;
  if (Math.abs(d) < schwelle) return "gleich";
  return (d < 0) === kleinerIstBesser ? "besser" : "schlechter";
}

/** Warum die Laufbahn endete, in einem Satz (Ursachen aus den Daten); leer, wenn es keine zu nennen gibt. */
function endeUrsache(w: World): string {
  const ende = w.spiel?.ende;
  if (!ende) return "";
  const kosten = (): string[] =>
    zustimmungsBilanz(w).posten.filter((p) => p.delta <= -1).sort((a, b) => a.delta - b.delta).slice(0, 2).map((p) => p.name);
  switch (ende.art) {
    case "abwahl":
    case "sturz":
    case "ruecktritt": {
      const k = kosten();
      const schluessel = { abwahl: "bilanz.ende.abwahl", sturz: "bilanz.ende.sturz", ruecktritt: "bilanz.ende.ruecktritt" }[ende.art];
      return t(schluessel, { kosten: k, hatKosten: k.length ? "ja" : "nein" });
    }
    case "putsch":
      return t("bilanz.ende.putsch", { ursachen: putschRisiko(w).teile.filter((x) => x.punkte > 0).sort((a, b) => b.punkte - a.punkte).slice(0, 3).map((x) => x.name) });
    case "amtsenthebung":
      return t("bilanz.ende.amtsenthebung", { gegen: amtsenthebungSitze(w).gegen });
    case "tod":
      return t("bilanz.ende.tod");
    default:
      return ende.nachfolge ? "" : t("bilanz.ende.amtszeitende");
  }
}

/** Zusagen, Kriege, Verfassung, Reich und Wendepunkte als Sätze am Ende der Bilanz. */
function vermaechtnisSaetze(w: World): string[] {
  const sp = w.spiel!;
  const out: string[] = [];
  const z = zusagenBilanz(w);
  if (z.gehalten + z.gebrochen + z.offen > 0) out.push(t("bilanz.zusagen", { gehalten: z.gehalten, gebrochen: z.gebrochen, offen: z.offen, glaub: Math.round(z.glaubwuerdigkeit) }));
  const ks = kriege(w).filter((k) => k.phase !== "beendet");
  if (ks.length) out.push(t("bilanz.kriege", { n: ks.length, liste: ks.map((k) => LAENDER.find((l) => l.id === k.land)?.name ?? k.land) }));
  const hist = sp.verfassungsvorgang?.historie ?? [];
  const geaendert = hist.filter((h) => h.ausgang.startsWith("Beschlossen")).flatMap((h) => h.artikel);
  if (geaendert.length) out.push(t("bilanz.verfassung", { n: geaendert.length, artikel: geaendert }));
  const fertig = Object.keys(sp.reich?.bestand ?? {}).length;
  if (fertig > 0) out.push(t("bilanz.reich", { fertig }));
  const wende = sp.chronik.filter(istGetroffen).slice(-3).map((c) => c.titel);
  if (wende.length) out.push(t("bilanz.wendepunkte", { liste: wende }));
  return out;
}

/**
 * Bilanz der Laufbahn. „ende“: das Geschichtsbuchkapitel am Spielende. „zwischen“: die Zwischenbilanz der abgelaufenen Amtszeit nach der Wiederwahl
 * (Start der Laufbahn gegen heute; die Ziele der abgelaufenen Amtszeit stehen im Archiv).
 */
export function erstelleBilanz(w: World, modus: "ende" | "zwischen" = "ende"): Bilanz {
  const spiel = w.spiel!;
  const s0 = spiel.start;
  const e = w.economy;
  const name = w.player?.name ?? t("bilanz.praesident");
  const ende = spiel.ende;
  const vertrauen = nationalAverage(NET, w.net, "vertrauen_regierung");
  const akut = akuteProbleme(w);
  const gesetze = w.log.filter((l) => l.kind === "entscheidung" && l.text.startsWith("Das Parlament nimmt")).length;
  const abgelehnt = w.log.filter((l) => l.kind === "entscheidung" && l.text.startsWith("Das Parlament lehnt")).length;
  const entscheidungen = spiel.chronik.filter(istEntscheidung).length;
  const unentschieden = spiel.chronik.filter((c) => c.ohneEntscheidung && c.art !== "haken").length;
  const archiv = spiel.zielArchiv ?? [];
  const mehrere = archiv.length > 0 && modus === "ende" && spiel.ziele.length > 0;
  const fruehere = archiv.flatMap((a) => a.ziele.map((z) => ({ titel: mehrere ? t("bilanz.ziele.amtszeit", { n: a.amtszeit, titel: z.titel }) : z.titel, erreicht: z.erreicht, stand: z.stand })));
  const laufende = modus === "zwischen" ? [] : zielStand(w).map((z) => ({ titel: mehrere ? t("bilanz.ziele.amtszeit", { n: spiel.amtszeit, titel: z.def.titel }) : z.def.titel, erreicht: z.erreicht, stand: z.stand }));
  const ziele = [...fruehere, ...laufende];
  const erreicht = ziele.filter((z) => z.erreicht).length;

  const absaetze: string[] = [];
  absaetze.push(t("bilanz.satz.regierte", { name, von: formatDateDe(s0.datum), bis: formatDateDe(ende?.datum ?? w.date), dauer: dauer(w.day) }) + (ende ? ` ${ende.text}` : ""));
  absaetze.push(t("bilanz.satz.wirtschaft", {
    inflation: wandel("inflation", s0.inflation, w.published.inflation.value), alq: wandel("alq", s0.arbeitslosigkeit, e.unemployment),
    schulden: wandel("schulden", s0.schulden, e.debtRatio), usd: Math.round(e.usdTry * 10) / 10,
  }));
  absaetze.push(t("bilanz.satz.vertrauen", { vertrauen: wandel("vertrauen", s0.vertrauen, vertrauen, 0), start: s0.akut, jetzt: akut }));
  absaetze.push(t("bilanz.satz.parlament", { gesetze, abgelehnt, entscheidungen, unentschieden }));
  absaetze.push(ziele.length ? t("bilanz.satz.ziele", { erreicht, von: ziele.length }) : t("bilanz.satz.keineZiele"));

  // Epochen: wie die Geschichtsschreibung die Amtszeiten einordnet (sim/epoche.ts)
  const ep = spiel.epoche;
  if (ep && (ep.bewertungen.length || ep.momente.length)) {
    const teile = ep.bewertungen.map((b) => t("bilanz.epoche.amtszeit", { nr: b.amtszeit, stufe: t(`epoche.stufe.${b.stufe}`), wert: b.wert > 0 ? `+${b.wert}` : String(b.wert) }));
    const gross = [...ep.momente].sort((a, b) => Math.abs(b.wert) - Math.abs(a.wert)).slice(0, 3).map((m) => m.titel);
    absaetze.push(t("bilanz.epoche", { teile: teile.join("; "), anzahl: teile.length, momente: gross.join(", "), mitMomenten: gross.length ? "ja" : "nein" }));
  }

  // Warum es endete: Ursachen aus den Daten der Partie (Zustimmungsbilanz, Putschrisiko, Verfahren)
  if (ende && modus === "ende") {
    const u = endeUrsache(w);
    if (u) absaetze.push(u);
  }

  // Vermächtnis: Programme, Beziehungen zur Welt, Wählerschaft
  const pz = programmZustand(w);
  const fertigeProgramme = PROGRAMME.filter((p) => p.schritte.every((x) => pz.fertig.includes(x.id)));
  const schritteFertig = PROGRAMME.reduce((n, p) => n + p.schritte.filter((x) => pz.fertig.includes(x.id)).length, 0);
  const schritteAlle = PROGRAMME.reduce((n, p) => n + p.schritte.length, 0);
  absaetze.push(
    fertigeProgramme.length > 0
      ? t("bilanz.satz.programme", { n: fertigeProgramme.length, liste: fertigeProgramme.map((p) => p.titel), fertig: schritteFertig, alle: schritteAlle })
      : schritteFertig > 0
        ? t("bilanz.satz.programmeUnvollendet", { fertig: schritteFertig, alle: schritteAlle })
        : t("bilanz.satz.keinProgramm"),
  );
  if (spiel.welt) {
    const beste = [...LAENDER].sort((a, b) => vertrauenZu(w, b.id) - vertrauenZu(w, a.id));
    const schlechteste = beste[beste.length - 1]!;
    const nah = beste[0]!;
    const feind = LAENDER.filter((l) => weltZustand(w)[l.id]!.konflikt >= 70).map((l) => l.name);
    absaetze.push(t("bilanz.satz.aussen", { nah: nah.name, nahWort: haltungWort(w, nah.id), fern: schlechteste.name, fernWort: haltungWort(w, schlechteste.id), streit: feind, hatStreit: feind.length ? "ja" : "nein" }));
  }
  const gruppen = waehlerLage(w);
  const zufrieden = gruppen.filter((g) => g.laune >= 58).map((g) => g.name);
  const veraergert = gruppen.filter((g) => g.laune < 45).map((g) => g.name);
  absaetze.push(t("bilanz.satz.waehler", { zufrieden, veraergert, hatZufrieden: zufrieden.length ? "ja" : "nein", hatVeraergert: veraergert.length ? "ja" : "nein" }));
  // Wahlen der Laufbahn: Ergebnis, Stichwahl, Lager im Parlament, Rede
  const wahlen = spiel.wahl?.historie ?? [];
  for (const e of wahlen) {
    const r = e.runden[e.runden.length - 1]!;
    const amt = r.anteile.amt ?? 0;
    absaetze.push(
      t(e.gewonnen ? "bilanz.wahl.gewonnen" : "bilanz.wahl.verloren", {
        datum: e.datum,
        anteil: Math.round(amt * 10) / 10,
        gang: e.runden.length > 1 ? "stich" : "erst",
        marge: e.marge,
        sitze: e.parlament.lagerSitzeNachher,
        vorher: e.parlament.lagerSitzeVorher,
        letzte: e.letzteWahl ? "ja" : "nein",
      }),
    );
  }
  // Vermächtnis in Zahlen: Was die Zustimmung seit dem Amtsantritt am meisten gehoben und am meisten gekostet hat
  if (modus === "ende" || spiel.amtszeit > 1) {
    const zb = zustimmungsBilanz(w);
    const hilfe = zb.posten.filter((p) => p.delta >= 1).sort((a, b) => b.delta - a.delta).slice(0, 2).map((p) => p.name);
    const kosten = zb.posten.filter((p) => p.delta <= -1).sort((a, b) => a.delta - b.delta).slice(0, 2).map((p) => p.name);
    if (hilfe.length || kosten.length) {
      absaetze.push(t("bilanz.zustimmung", { hilfe, kosten, hatHilfe: hilfe.length ? "ja" : "nein", hatKosten: kosten.length ? "ja" : "nein", jetzt: Math.round(zb.jetzt) }));
    }
  }
  if (modus === "ende" && ende?.nachfolge) absaetze.push(t(ende.nachfolge === "sieg" ? "bilanz.nachfolge.sieg" : "bilanz.nachfolge.niederlage", { name: spiel.nachfolge?.nachfolger?.name ?? "" }));
  // INF-5: Katastrophen der Amtszeit und die Versprechensschuld (mit der Mahnung als Referenz)
  const katSatz = katastrophenBilanz(w);
  if (katSatz) absaetze.push(katSatz);
  if (modus === "ende") absaetze.push(...vermaechtnisSaetze(w));

  return {
    titel: modus === "zwischen" ? t("bilanz.zwischen.titel") : (ende?.titel ?? t("bilanz.titel")),
    absaetze,
    kennzahlen: [
      { name: t("bilanz.kz.inflation"), start: prozentText(s0.inflation), ende: prozentText(w.published.inflation.value), urteil: urteil(s0.inflation, w.published.inflation.value, true, 1) },
      { name: t("bilanz.kz.alq"), start: prozentText(s0.arbeitslosigkeit), ende: prozentText(e.unemployment), urteil: urteil(s0.arbeitslosigkeit, e.unemployment, true) },
      { name: t("bilanz.kz.wachstum"), start: prozentText(s0.wachstum), ende: prozentText(e.growth), urteil: urteil(s0.wachstum, e.growth, false) },
      { name: t("bilanz.kz.schulden"), start: t("bilanz.kz.bip", { n: Math.round(s0.schulden * 10) / 10 }), ende: t("bilanz.kz.bip", { n: Math.round(e.debtRatio * 10) / 10 }), urteil: urteil(s0.schulden, e.debtRatio, true, 1) },
      { name: t("bilanz.kz.vertrauen"), start: String(Math.round(s0.vertrauen)), ende: String(Math.round(vertrauen)), urteil: urteil(s0.vertrauen, vertrauen, false, 1) },
      { name: t("bilanz.kz.akut"), start: String(s0.akut), ende: String(akut), urteil: urteil(s0.akut, akut, true, 0.5) },
    ],
    ziele,
    chronik: spiel.chronik,
  };
}

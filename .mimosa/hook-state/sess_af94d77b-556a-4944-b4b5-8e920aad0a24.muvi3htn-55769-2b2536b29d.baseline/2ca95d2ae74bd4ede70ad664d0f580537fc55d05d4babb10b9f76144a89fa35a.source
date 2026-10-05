// Bilanz der Amtszeit: das Geschichtsbuchkapitel, aus den tatsächlichen Daten der Partie gebaut.
// Kein erzählter Text erfindet Zahlen; jede Angabe stammt aus dem Weltzustand oder der Chronik.

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

const nf = (x: number, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });

// „sank von 31,5 auf 30,1 Prozent“ oder, wenn sich nichts bewegt hat, „blieb bei 31,5 Prozent“
function wandel(vorher: number, nachher: number, verben: [string, string, string], stellen = 1, einheit = "Prozent"): string {
  const zahl = (x: number) => [nf(x, stellen), einheit].filter(Boolean).join(" ");
  if (nf(vorher, stellen) === nf(nachher, stellen)) return `${verben[2]} bei ${zahl(nachher)}`;
  return `${nachher > vorher ? verben[0] : verben[1]} von ${nf(vorher, stellen)} auf ${zahl(nachher)}`;
}

function dauer(tage: number): string {
  const monate = Math.max(1, Math.round(tage / 30.4));
  if (monate < 24) return `${monate} ${monate === 1 ? "Monat" : "Monate"}`;
  return `${nf(tage / 365, 1)} Jahre`;
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
  const wende = sp.chronik.filter((c) => !/^(Wirkungsbericht|Schritt erreicht|Programm erfüllt)/.test(c.titel) && !c.ausgang.startsWith("Keine Entscheidung")).slice(-3).map((c) => c.titel);
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
  const name = w.player?.name ?? "Der Präsident";
  const ende = spiel.ende;
  const vertrauen = nationalAverage(NET, w.net, "vertrauen_regierung");
  const akut = akuteProbleme(w);
  const gesetze = w.log.filter((l) => l.kind === "entscheidung" && l.text.startsWith("Das Parlament nimmt")).length;
  const abgelehnt = w.log.filter((l) => l.kind === "entscheidung" && l.text.startsWith("Das Parlament lehnt")).length;
  const entscheidungen = spiel.chronik.filter((c) => !/^(Wirkungsbericht|Schritt erreicht|Programm erfüllt)/.test(c.titel)).length;
  const unentschieden = spiel.chronik.filter((c) => c.ausgang.startsWith("Keine Entscheidung")).length;
  const archiv = spiel.zielArchiv ?? [];
  const mehrere = archiv.length > 0 && modus === "ende" && spiel.ziele.length > 0;
  const fruehere = archiv.flatMap((a) => a.ziele.map((z) => ({ titel: mehrere ? t("bilanz.ziele.amtszeit", { n: a.amtszeit, titel: z.titel }) : z.titel, erreicht: z.erreicht, stand: z.stand })));
  const laufende = modus === "zwischen" ? [] : zielStand(w).map((z) => ({ titel: mehrere ? t("bilanz.ziele.amtszeit", { n: spiel.amtszeit, titel: z.def.titel }) : z.def.titel, erreicht: z.erreicht, stand: z.stand }));
  const ziele = [...fruehere, ...laufende];
  const erreicht = ziele.filter((z) => z.erreicht).length;

  const absaetze: string[] = [];
  absaetze.push(
    `${name} regierte die Türkei vom ${formatDateDe(s0.datum)} bis zum ${formatDateDe(ende?.datum ?? w.date)}, ${dauer(w.day)} lang.` +
      (ende ? ` ${ende.text}` : ""),
  );
  absaetze.push(
    `Wirtschaftlich: Die Inflation ${wandel(s0.inflation, w.published.inflation.value, ["stieg", "sank", "blieb"])}, die Arbeitslosigkeit ${wandel(s0.arbeitslosigkeit, e.unemployment, ["stieg", "sank", "blieb"])}, ` +
      `die Staatsschulden ${wandel(s0.schulden, e.debtRatio, ["stiegen", "sanken", "blieben"], 1, "Prozent der Wirtschaftsleistung")}. Für einen Dollar musste man am Ende ${nf(e.usdTry)} Lira zahlen.`,
  );
  absaetze.push(
    `Das Vertrauen in die Regierung ${wandel(s0.vertrauen, vertrauen, ["wuchs", "sank", "blieb"], 0, "")}. ` +
      `Von ${s0.akut} akuten Problemen beim Start blieben ${akut} übrig (mindestens eine Provinz betroffen).`,
  );
  absaetze.push(
    `Das Parlament nahm ${gesetze} Gesetzentwürfe an und lehnte ${abgelehnt} ab. ${entscheidungen} Ereignisse verlangten eine Antwort` +
      (unentschieden > 0 ? `; bei ${unentschieden} davon blieb der Präsident eine Entscheidung schuldig.` : "."),
  );
  absaetze.push(
    ziele.length
      ? `Von den eigenen Zielen wurden ${erreicht} von ${ziele.length} erreicht. Das Land wird sich an diese Amtszeit so erinnern, wie es sie erlebt hat, nicht wie sie gemeint war.`
      : "Eigene Ziele hatte sich der Präsident nicht gesetzt.",
  );

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
      ? `Von ihren Regierungsprogrammen führte die Amtszeit ${fertigeProgramme.length === 1 ? "eines" : `${fertigeProgramme.length}`} zu Ende: ${fertigeProgramme.map((p) => `„${p.titel}“`).join(", ")}. Insgesamt wurden ${schritteFertig} von ${schritteAlle} Schritten erreicht.`
      : schritteFertig > 0
        ? `Regierungsprogramme blieben unvollendet: ${schritteFertig} von ${schritteAlle} Schritten wurden erreicht, kein Programm bis zum Ende geführt.`
        : "Ein Regierungsprogramm wurde nicht verfolgt; die Amtszeit blieb Verwaltung ohne langen Plan.",
  );
  if (spiel.welt) {
    const beste = [...LAENDER].sort((a, b) => vertrauenZu(w, b.id) - vertrauenZu(w, a.id));
    const schlechteste = beste[beste.length - 1]!;
    const nah = beste[0]!;
    const feind = LAENDER.filter((l) => weltZustand(w)[l.id]!.konflikt >= 70).map((l) => l.name);
    absaetze.push(
      `Außenpolitisch: Am engsten stand am Ende ${nah.name} (${haltungWort(w, nah.id)}), am kühlsten blieb das Verhältnis zu: ${schlechteste.name} (${haltungWort(w, schlechteste.id)}).` +
        (feind.length ? ` Offene Streitfälle bestanden weiter: ${feind.join(", ")}.` : ""),
    );
  }
  const gruppen = waehlerLage(w);
  const zufrieden = gruppen.filter((g) => g.laune >= 58).map((g) => g.name);
  const veraergert = gruppen.filter((g) => g.laune < 45).map((g) => g.name);
  absaetze.push(
    `Ihre Wählerschaft am Ende: ${zufrieden.length ? `zufrieden waren ${zufrieden.join(", ")}` : "keine Gruppe war ausgesprochen zufrieden"}${veraergert.length ? `; verärgert waren ${veraergert.join(", ")}` : ""}.`,
  );
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
    titel: modus === "zwischen" ? t("bilanz.zwischen.titel") : (ende?.titel ?? "Bilanz der Amtszeit"),
    absaetze,
    kennzahlen: [
      { name: "Inflation", start: `${nf(s0.inflation)} %`, ende: `${nf(w.published.inflation.value)} %`, urteil: urteil(s0.inflation, w.published.inflation.value, true, 1) },
      { name: "Arbeitslosigkeit", start: `${nf(s0.arbeitslosigkeit)} %`, ende: `${nf(e.unemployment)} %`, urteil: urteil(s0.arbeitslosigkeit, e.unemployment, true) },
      { name: "Wachstum", start: `${nf(s0.wachstum)} %`, ende: `${nf(e.growth)} %`, urteil: urteil(s0.wachstum, e.growth, false) },
      { name: "Staatsschulden", start: `${nf(s0.schulden)} % des BIP`, ende: `${nf(e.debtRatio)} % des BIP`, urteil: urteil(s0.schulden, e.debtRatio, true, 1) },
      { name: "Vertrauen in die Regierung", start: nf(s0.vertrauen, 0), ende: nf(vertrauen, 0), urteil: urteil(s0.vertrauen, vertrauen, false, 1) },
      { name: "Akute Probleme", start: String(s0.akut), ende: String(akut), urteil: urteil(s0.akut, akut, true, 0.5) },
    ],
    ziele,
    chronik: spiel.chronik,
  };
}

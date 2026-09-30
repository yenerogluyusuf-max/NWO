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
import { waehlerLage } from "./waehler";
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

export function erstelleBilanz(w: World): Bilanz {
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
  const ziele = zielStand(w).map((z) => ({ titel: z.def.titel, erreicht: z.erreicht, stand: z.stand }));
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

  return {
    titel: ende?.titel ?? "Bilanz der Amtszeit",
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

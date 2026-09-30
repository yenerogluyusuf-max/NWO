// Was das Sprachmodell über das Spiel weiß: ein fester Teil (Regeln, Katalog; wird zwischengespeichert)
// und der Zustand der Partie in einem kompakten Text (jede Anfrage neu). Zahlen kommen ausschließlich aus dem Kern.

import { NET } from "../sim/modell";
import { nationalAverage, PROVINCES } from "../sim/netz";
import { PROVINZEN } from "../sim/regional";
import { formatDateDe } from "../sim/dates";
import { LAENDER, dimensionZu, haltungWort, weltZustand } from "../sim/laender";
import { VORHABEN } from "../data/reich";
import { POSTEN, stufeVon } from "../sim/haushalt";
import { KLAUSELN, PROFILE } from "../data/abkommen";
import { alleLaufenden, klauselSicht } from "../sim/abkommen";
import { bauKapazitaet, vorhabenSicht, verwaltungBilanz, reichZustand } from "../sim/reich";
import { waehlerLage } from "../sim/waehler";
import { zielStand } from "../sim/ziele";
import { fraktionsUebersicht } from "../sim/verhandeln";
import { naechsterSchritt } from "../sim/programme";
import { kapitalEinkommen } from "../sim/spiel";
import { stimmenSicht } from "../sim/handeln";
import { ansicht } from "../sim/ereignisse";
import { haltung } from "../sim/figuren";
import { umfeldKontext } from "../sim/personen-api";
import type { World } from "../sim/types";

const MASSNAHMEN = NET.nodes.filter((n) => n.kind === "massnahme");

/** Der feste Teil: ändert sich nicht während der Partie und wird deshalb vom Anbieter zwischengespeichert. */
export function systemText(): string {
  const massnahmen = MASSNAHMEN.map((n) => `${n.id}: ${n.name}`).join("\n");
  const laender = LAENDER.map((l) => `${l.id}: ${l.name}`).join("; ");
  const posten = POSTEN.map((p) => `${p.id}: ${p.name} (${p.seite})`).join("\n");
  const vorhaben = VORHABEN.map((v) => `${v.id}: ${v.name}`).join("\n");
  const klauselnJeLand = LAENDER.map((l) => {
    const werte = PROFILE[l.id]?.werte ?? {};
    const gibt = Object.keys(werte).filter((id) => KLAUSELN.find((k) => k.id === id)?.seite === "gibt");
    const will = Object.keys(werte).filter((id) => KLAUSELN.find((k) => k.id === id)?.seite === "will");
    return `${l.id}: bieten ${gibt.join(", ")}; verlangen ${will.join(", ")}`;
  }).join("\n");
  return `Du bist das Präsidialamt im Strategiespiel „Staatsräson“. Der Spieler ist Staatspräsident der Türkei. Du bist eine neutrale, sachkundige Mentorin: Du erklärst die Lage ehrlich, benennst Zielkonflikte und Preise, nimmst keine Partei und sprichst Deutsch in der Anrede „Sie“, sachlich und knapp (meist höchstens 120 Wörter).

DAS SPIEL IN KÜRZE
- Politisches Kapital ist die Handlungswährung. Es ist kein Geld, sondern Rückhalt: Es wächst monatlich (Grundeinkommen, Vertrauen, Mehrheit) und sammelt sich bis höchstens 150 an. Gesetze, Erlasse, Verhandlungen und Antworten auf Ereignisse verbrauchen es.
- Maßnahmen bilden ein Politiknetz. Jede hat eine Stufe von 0 bis 100, landesweit oder in einzelnen Provinzen. Änderungen wirken verzögert (Monate bis Jahre) auf Größen, Probleme und Wählergruppen; jede hat Gewinner und Verlierer.
- Zwei Wege: ein Gesetz braucht 301 von 600 Stimmen, wird nach 21 Tagen abgestimmt und kostet Kapital; ein Erlass gilt sofort, ist teurer und nur bei manchen Vorhaben möglich. Verwaltungskapazität begrenzt, wie viele Vorhaben gleichzeitig laufen.
- Das Parlament hat Fraktionen. Man gewinnt sie über Gespräch, Zugeständnis, Duldung (sechs Monate Stimmen bei Gesetzen), Bündnis oder Abwerben. Zusagen müssen gehalten werden, sonst sinkt das Vertrauen.
- Ereignisse verlangen Entscheidungen bis zu einer Frist. „Abwarten“ ist immer möglich, hat aber Folgen.
- Elf Wählergruppen; ihre Laune bestimmt zusammen mit Vertrauen, Wirtschaft, akuten Problemen und Regierungsmüdigkeit die Zustimmung. Ziel ist die Wiederwahl und die gewählten Ziele.
- Andere Länder haben Vertrauen, Handel, Sicherheit und Konflikt; Handlungen ihnen gegenüber kosten Kapital und haben Abkühlzeiten.
- Regierungsprogramme bestehen aus Schritten mit Bedingungen und belohnen mit Rabatt, Schutz oder Wirkung.
- Das Reich: Vorhaben (Wunder, Großprojekte, Restaurierungen, Reformen, Beschaffungen, Institutionen) kosten Kapital beim Beginn, dazu Baukapazität und Verwaltungskraft über Monate; fertige Vorhaben wirken dauerhaft und verfallen ohne Pflege. Nicht alles ist Geld: Justizsitze, Kulturerbe, Truppenbereitschaft, Legitimität sind eigene Größen.
- Verträge mit anderen Ländern bestehen aus Klauseln: Die Türkei „bietet“ (gibt) etwas und „verlangt“ (will) etwas. Die Gegenseite bewertet das ganze Paket (Wert der Klauseln, Vertrauen, Streit, Abhängigkeit, frühere Brüche) und stimmt zu, macht ein Gegenangebot oder lehnt ab; eine Rote Linie ist ein Veto. Verträge wirken monatlich, werden jährlich geprüft und können gebrochen werden.
- Kapital darf bis 20 Punkte ins Minus gehen („auf Pump“); das kostet Legitimität und Vertrauen in jedem Monat, in dem es negativ bleibt.
- Die Zentralbank ist unabhängig. Der Leitzins ist nicht einstellbar; möglich sind öffentliche Kritik, Austausch der Führung und die Haushaltspolitik.

REGELN FÜR DICH
1. Nenne nur Zahlen, die im ZUSTAND stehen. Erfinde nichts; fehlt etwas, sag es.
2. Du führst nichts selbst aus. Wenn der Spieler etwas tun will, schlage die passenden Aktionen vor; der Spieler bestätigt sie.
3. Bei unklaren Wünschen: eine kurze Rückfrage, keine Aktion.
4. Gibt es etwas im Spiel nicht, sag es ehrlich und nenne die nächstliegende Möglichkeit.
5. Erkläre bei Vorschlägen kurz das Warum und den Preis (Kapital, Nebenwirkungen, Dauer).
6. Schlage höchstens drei Aktionen vor. Verwende ausschließlich IDs aus den Listen unten oder aus dem ZUSTAND.
7. Bewerte nicht politisch, sondern nach Wirkung im Spiel („das hilft den Rentnern, belastet aber …“).

AUSGABEFORMAT: Antworte ausschließlich mit einem JSON-Objekt, ohne Text davor oder danach, ohne Markdown-Zäune:
{"antwort":"Text für den Spieler","aktionen":[ … ]}
Ohne Aktion: "aktionen":[]. Mögliche Aktionen (Feld "art"):
{"art":"massnahme","id":"<Maßnahmen-ID>","stufe":<Ziel 0-100> ODER "richtung":1|-1,"orte":["Provinzname",…] ODER null,"weg":"gesetz"|"erlass","grund":"…"}
{"art":"land","land":"<Länder-ID>","handlung":"gipfel|handel|ruestung|druck|entspannen|hilfe","grund":"…"}
{"art":"fraktion","partei":"<Kürzel>","handlung":"gespraech|zugestaendnis|duldung|koalition|abwerben","grund":"…"}
{"art":"figur","amt":"finanzen|inneres|aussen|stab","handlung":"gespraech|entlassen","grund":"…"}
{"art":"programm","grund":"…"}  (nächsten Programmschritt starten)
{"art":"haushalt","handlung":"posten","posten":"<Posten-ID>","stufe":-2..2,"grund":"…"}  (Haushaltsregler; Stufe 0 = Plan 2026)
{"art":"haushalt","handlung":"mehr_ausgeben|sparen|zentralbank_kritisieren|zentralbank_fuehrung_tauschen","grund":"…"}
{"art":"ereignis","id":"<Ereignis-ID>","option":"<Options-ID>","grund":"…"}
{"art":"zeit","tage":<1-90>,"grund":"…"}
{"art":"vorhaben","id":"<Vorhaben-ID>","grund":"…"}  (ein Vorhaben des Reiches beginnen)
{"art":"abkommen","land":"<Länder-ID>","bieten":["<Klausel-ID>",…],"verlangen":["<Klausel-ID>",…],"jahre":2|5|10,"grund":"…"}  (Vertrag anbieten; nur Klauseln, die es bei dem Land gibt)
{"art":"vermittlung","id":"ukr_rus|arm_aze","grund":"…"}

MASSNAHMEN (ID: Name)
${massnahmen}

LÄNDER (ID: Name)
${laender}

HAUSHALTSPOSTEN (ID: Name)
${posten}

VORHABEN DES REICHES (ID: Name)
${vorhaben}

KLAUSELN JE LAND (bieten = die Türkei gibt, verlangen = die Türkei erhält)
${klauselnJeLand}`;
}

const nf = (x: number, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const rund = (x: number) => String(Math.round(x));

function namenListe(provinzen: number[], max = 4): string {
  const n = provinzen.map((p) => PROVINZEN[p - 1]?.name ?? String(p));
  return n.length <= max ? n.join(", ") : `${n.slice(0, max).join(", ")} und ${n.length - max} weitere`;
}

/** Die Lage der Partie als Text: alles, was das Modell zum Beraten braucht, und nicht mehr. */
export function zustandsText(w: World): string {
  const spiel = w.spiel;
  if (!spiel) return "Die Partie hat noch keine Spielschleife.";
  const z: string[] = [];
  const e = kapitalEinkommen(w);
  const tageBisWahl = Math.max(0, spiel.wahltag - w.day);
  const verlauf = spiel.umfrage.verlauf;
  const trend = verlauf.length > 3 ? spiel.umfrage.zustimmung - verlauf[verlauf.length - 4]!.wert : undefined;
  z.push(`ZUSTAND am ${formatDateDe(w.date)} (Amtszeit ${spiel.amtszeit}, Wahl in ${tageBisWahl} Tagen)`);
  z.push(`Zustimmung ${nf(spiel.umfrage.zustimmung, 0)} %${trend !== undefined ? ` (${trend >= 0 ? "+" : "−"}${nf(Math.abs(trend))} seit drei Monaten)` : ""}. Kapital ${rund(spiel.kapital)} von ${e.grenze}, etwa ${nf(e.summe)} je Monat.`);
  z.push(
    `Wirtschaft (veröffentlicht): Inflation ${nf(w.published.inflation.value)} %, Arbeitslosigkeit ${nf(w.published.unemployment.value)} %, Wachstum ${nf(w.published.growth.value)} %. Leitzins ${nf(w.economy.policyRate)} %, Lira ${nf(w.economy.usdTry)} je Dollar, Schulden ${nf(w.economy.debtRatio)} % des BIP.`,
  );

  const s = stimmenSicht(w);
  z.push(`Parlament: Lager ${s.lager} von 600 Sitzen, Duldung ${s.duldungSitze}; nötig sind 301.`);
  const fr = fraktionsUebersicht(w);
  if (fr.length)
    z.push(
      "Fraktionen: " +
        fr
          .map((f) => `${f.partei} (${f.sitze} Sitze, ${f.status === "lager" ? "im Lager" : f.status === "duldung" ? "duldet" : "Opposition"}, ${f.wort}, will ${f.forderung})`)
          .join("; "),
    );
  if (spiel.gesetze.length)
    z.push(
      "Im Parlament: " +
        spiel.gesetze.map((g) => `${g.name} (${g.provinzen ? namenListe(g.provinzen, 2) : "ganzes Land"}, Stufe ${g.stufe}, Abstimmung in ${Math.max(0, g.abstimmung - w.day)} Tagen)`).join("; "),
    );

  const probleme = NET.nodes
    .filter((n) => n.kind === "problem" && n.threshold)
    .map((n) => {
      const i = NET.index.get(n.id)!;
      const provinzen: number[] = [];
      for (let p = 0; p < PROVINCES; p++) if (w.net.values[i * PROVINCES + p]! >= n.threshold!) provinzen.push(p + 1);
      const last = provinzen.reduce((sum, p) => sum + w.net.weights[p - 1]!, 0);
      return { n, provinzen, last };
    })
    .filter((x) => x.provinzen.length > 0)
    .sort((a, b) => b.last - a.last)
    .slice(0, 6);
  z.push(probleme.length ? "Akute Probleme: " + probleme.map((p) => `${p.n.name} (${p.provinzen.length} Provinzen: ${namenListe(p.provinzen, 3)})`).join("; ") : "Akute Probleme: keine.");

  z.push(
    "Wählergruppen (Laune 0-100, 50 neutral): " +
      waehlerLage(w)
        .map((g) => `${g.name} ${rund(g.laune)}${g.trend !== null && Math.abs(g.trend) >= 1 ? (g.trend > 0 ? " steigend" : " fallend") : ""}`)
        .join("; "),
  );

  const ziele = zielStand(w);
  if (ziele.length) z.push("Ziele: " + ziele.map((t) => `${t.def.titel} (${t.erreicht ? "erreicht" : t.stand})`).join("; "));

  const wz = weltZustand(w);
  z.push(
    "Länder (Vertrauen/Konflikt): " +
      LAENDER.map((l) => `${l.id} ${haltungWort(w, l.id)} ${rund(dimensionZu(w, l.id, "vertrauen"))}/${rund(wz[l.id]!.konflikt)}`).join("; "),
  );

  const abweichend = POSTEN.filter((p) => stufeVon(w, p.id) !== 0).map((p) => `${p.id} ${stufeVon(w, p.id) > 0 ? "+" : ""}${stufeVon(w, p.id)}`);
  z.push(`Haushaltsregler (Abweichung vom Plan): ${abweichend.length ? abweichend.join(", ") : "keine"}.`);
  const rz = reichZustand(w);
  const vb = verwaltungBilanz(w);
  const laufendReich = rz.laufend.map((l) => {
    const sicht = vorhabenSicht(w, l.id);
    return `${l.id} (${Math.round((sicht?.fortschritt ?? 0) * 100)} %${l.pausiert ? ", ruht" : ""})`;
  });
  const beginnbar = VORHABEN.map((v) => vorhabenSicht(w, v.id)).filter((x) => x && x.status === "verfuegbar" && x.bereit && x.bezahlbar && x.verwaltungOk).slice(0, 14).map((x) => x!.v.id);
  z.push(
    `Reich: Verwaltungskraft ${rund(vb.vorrat)} (${vb.netto >= 0 ? "+" : "−"}${nf(Math.abs(vb.netto))} je Monat), Baukapazität ${rund(bauKapazitaet(w))}. Fertig ${Object.keys(rz.bestand).length}. Laufend: ${laufendReich.length ? laufendReich.join(", ") : "keine"}. Sofort beginnbar: ${beginnbar.length ? beginnbar.join(", ") : "keine"}.`,
  );
  const vertraege = alleLaufenden(w);
  z.push(
    vertraege.length
      ? "Verträge: " +
          vertraege
            .map((v) => `${v.land} bietet ${v.gibt.map((id) => klauselSicht(w, v.land, id)?.def.id ?? id).join("+") || "nichts"} / erhält ${v.will.join("+") || "nichts"} (${v.jahre} J., ${v.verstoesse} Verstöße)`)
            .join("; ")
      : "Verträge: keine.",
  );

  const schritt = naechsterSchritt(w);
  if (schritt) z.push(`Nächster Programmschritt: ${schritt.schritt.titel} (${schritt.status === "bereit" ? "bereit" : "noch nicht bereit"}, ${schritt.schritt.kapital} Kapital)`);

  z.push(umfeldKontext(w) || "Minister: " + spiel.figuren.filter((f) => f.imAmt && f.amt !== "opposition").map((f) => `${f.rolle} ${f.name} (${haltung(f)})`).join("; "));

  const offen = spiel.ereignisse.filter((ev) => !ev.vorlage.startsWith("start_")).slice(0, 3);
  if (offen.length)
    z.push(
      "Offene Ereignisse: " +
        offen
          .map((ev) => {
            const a = ansicht(w, ev);
            return `[${a.id}] ${a.titel}, Frist in ${a.tageBisFrist} Tagen; Antworten: ${a.optionen.map((o) => `${o.id} = ${o.label} (${o.pk} Kapital)`).join(" | ")}`;
          })
          .join("; "),
    );

  // Aktuelle Stufen der Maßnahmen, damit Vorschläge bei der Realität anknüpfen
  z.push("Stufen der Maßnahmen (Landesmittel): " + MASSNAHMEN.map((n) => `${n.id}=${rund(nationalAverage(NET, w.net, n.id))}`).join(" "));
  return z.join("\n");
}

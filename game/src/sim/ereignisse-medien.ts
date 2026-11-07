// Medien melden sich auf dem Schreibtisch (Welle E4, 7. November 2026; Gesamtplan Welle 2, ENTSCHEIDUNGEN AA).
//
// Welle H3 hat den Angriff eines kritischen Hauses nach langem Schweigen gebaut (medien_kampagne, sim/ereignisse-bereiche.ts). Diese
// Datei ergänzt drei Vorgänge, die etwas anderes verlangen:
//
//   medien_plattform    Eine Plattform befolgt eine Sperranordnung nicht. Plattformen befolgen Anordnungen zu 91,8 % (TikTok), 85,7 % (X)
//                       und 79,2 % (Instagram) (Reuters Institute, Digital News Report 2026, Türkei). Wege wie in der Wirklichkeit: Sperre
//                       wie bei Instagram vom 02. bis 10.08.2024, Drosselung nach Gesetz 7253 (Amtsblatt 31202 vom 31.07.2020, bis 90 %
//                       der Bandbreite) oder Rücknahme der Anordnung. Nach Sperren weichen Nutzer auf VPN aus (2025: Anmeldungen bei Proton
//                       VPN +1.100 %, Recherche M-R4); das Spiel bucht das als Ausweichen in soziale Netze.
//   medien_enthuellung  Ein kritisches Haus enthüllt Unregelmäßigkeiten bei der Vergabe eines laufenden Vorhabens. Am stärksten, wenn die
//                       Regierung es an eine Stammfirma vergeben hat (sim/reich.ts, Vergabe „stammfirma“ nährt die Korruption). Wege:
//                       Prüfung durch den Rechnungshof (Sayıştay) mit nachgeholter Ausschreibung, Pressekonferenz, Verfahren gegen das Blatt.
//   medien_sendezeit    Vor einer Wahl verteilt der Staatsrundfunk die Sendezeit. Vorbild ist die Wahl 2023: TRT 1 und TRT Haber gaben
//                       dem Lager des Amtsinhabers 44 bzw. 45 % der politischen Berichte, dem Herausforderer 28 bzw. 25 %; ein Interview
//                       lief zugleich auf 29 Sendern (OSZE/ODIHR, Abschlussbericht 29.09.2023, https://odihr.osce.org/odihr/elections/turkiye/553966).
//                       Einen bezifferten Effekt auf das Wahlergebnis belegt keine Studie (Recherche M-R7): Die Wirkung ist Spielparameter.
//
// Jede Antwort wirkt über die vorhandenen Wege: Medieneingriffe (sim/medien.ts), Pressefreiheitswert, Zustand der Häuser, Bauliste und
// Netzknoten. Neue Vorlagen würfeln selbst (`eigenerWurf`) und schaffen keinen Zusatzplatz (`ohneZusatzplatz`). Alle Größen sind Spielparameter.

import { t, zahl } from "../i18n";
import { medienCluster } from "../data/medien";
import { fuehreMedienAktionAus, medienAktionen, medienVon, pressefreiheitBuchen, type AktionId } from "./medien";
import { angreifer } from "./ereignisse-bereiche";
import { blattDef } from "./zeitung";
import { hashWert } from "./aufmerksamkeit";
import { vertrauenAendern, wirke } from "./wirkung";
import { clamp } from "./economy";
import { netz, opt } from "./ereignis-hilfen";
import { NET } from "./modell";
import type { Option, Vorlage } from "./ereignis-hilfen";
import { reichZustand, vorhabenDef } from "./reich";
import type { OffenesEreignis } from "./spiel-typen";
import type { World } from "./types";

// ---------------------------------------------------------------------------
// Spielparameter

/** Ein Satz Wirkungen auf Netzknoten und den Pressefreiheitswert (`presse`: Punkte Malus wie bei den Eingriffen, negativ = gewonnen). */
type Paket = { presse?: number; ausweich?: number } & Partial<Record<string, number>>;

export const MEDIEN_VORGAENGE = {
  plattform: {
    /** Chance je Monat bei der Startstufe der Internetsperren (60); sie wächst mit der Stufe und mit dem Protestdruck */
    chance: 0.04,
    abkuehlung: 420,
    frist: 14,
    sperren: { presse: 1.5, ausweich: 15, junge: -1.5, staedtische_saekulare: -1, konservative: 0.5, vertrauen_regierung: 0.3, ansehen: -0.5, beziehungen_eu: -0.4, unternehmer: -0.3 } as Paket,
    drosseln: { presse: 0.8, ausweich: 8, junge: -0.8, staedtische_saekulare: -0.5, konservative: 0.3, ansehen: -0.3, beziehungen_eu: -0.2 } as Paket,
    nachgeben: { presse: -0.2, junge: 0.3, konservative: -0.4, nationalisten: -0.3, vertrauen_regierung: -0.3 } as Paket,
    /** Liegen lassen: Die Behörde drosselt nach Gesetz 7253 selbst; der Präsident hat sich nicht gezeigt */
    liegen: { presse: 0.8, ausweich: 8, junge: -0.8, staedtische_saekulare: -0.5, ansehen: -0.3, beziehungen_eu: -0.2, vertrauen_regierung: -0.3 } as Paket,
  },
  enthuellung: {
    chance: 0.04,
    /** Faktor, wenn ein laufendes Vorhaben an eine Stammfirma vergeben ist */
    stammfirma: 2.5,
    abkuehlung: 360,
    frist: 14,
    /** Vertrauen und Leserschaft der kritischen Häuser, die eine unbeantwortete Enthüllung kostet (mal Stärke) */
    schaden: { vertrauen_regierung: -2, staedtische_saekulare: -0.8, junge: -0.4 } as Paket,
    /** Rechnungshof prüft, Ausschreibung wird nachgeholt: Kapital, Korruption, Unternehmer, Monate Vergabephase */
    pruefenPk: 2,
    pruefen: { korruption: -1.5, unternehmer: -0.5, vertrauen_regierung: 0.5 } as Paket,
    pruefenMonate: 2,
    /** Anteil des Schadens, der nach Pressekonferenz oder Verfahren bleibt */
    nachPressekonferenz: 0.5,
    nachVerfahren: 0.2,
    /** Reichweite, die das Haus gewinnt, wenn die Regierung schweigt */
    reichweite: 0.05,
  },
  sendezeit: {
    /** Tage vor der Kommunalwahl, ab denen die Frage kommt (der Wahlkampf zum Präsidentenamt hat seine eigene Phase) */
    tageVorKommunalwahl: 90,
    chance: 0.5,
    abkuehlung: 300,
    frist: 10,
    linie: { presse: 1, konservative: 1, nationalisten: 0.5, staedtische_saekulare: -0.8, vertrauen_regierung: 0.4, ansehen: -0.8, beziehungen_eu: -0.5 } as Paket,
    ausgewogen: { presse: -1, ansehen: 0.8, beziehungen_eu: 0.4, staedtische_saekulare: 0.5, konservative: -0.3 } as Paket,
    allesender: { presse: 1.5, konservative: 1.5, nationalisten: 0.8, junge: -0.5, staedtische_saekulare: -1.2, ansehen: -1.2, beziehungen_eu: -0.6 } as Paket,
    allesenderPk: 2,
    /** Selbstzensur im Staatsrundfunk: Regierungslinie hebt sie, Ausgewogenheit senkt sie */
    zensurLinie: 10,
    zensurAusgewogen: -10,
    /** Liegen lassen: Der Sender folgt der Gewohnheit, mit halber Wirkung der Regierungslinie */
    liegenAnteil: 0.5,
  },
} as const;

/** Bucht ein Paket mit Faktor. Die Zahlen zeigt das Ereignisfenster aus derselben Buchung auf einer Kopie der Welt (sim/ereignisse.ts). */
function bucheMedien(w: World, p: Paket, f = 1): void {
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || v === 0) continue;
    if (k === "presse") pressefreiheitBuchen(w, v * f);
    else if (k === "ausweich") {
      const m = medienVon(w);
      m.ausweich = clamp(m.ausweich + v * f, 0, 100);
    } else if (k === "vertrauen_regierung") vertrauenAendern(w, v * f);
    else wirke(w, k, v * f);
  }
}

const dStr = (ev: OffenesEreignis, k: string): string => String(ev.daten?.[k] ?? "");

// ---------------------------------------------------------------------------
// Eine Plattform verweigert sich

/** Befolgungsquote je Plattform (Reuters Institute DNR 2026): Wer seltener befolgt, verweigert sich eher. */
const PLATTFORMEN: { id: string; befolgt: number }[] = [
  { id: "instagram", befolgt: 0.792 },
  { id: "x", befolgt: 0.857 },
  { id: "tiktok", befolgt: 0.918 },
];

function plattformWahl(w: World): string {
  const gewicht = PLATTFORMEN.map((p) => 1 - p.befolgt);
  let u = hashWert(`${w.seed}|medien_plattform|${w.date.slice(0, 7)}`) * gewicht.reduce((a, b) => a + b, 0);
  for (let i = 0; i < PLATTFORMEN.length; i++) {
    u -= gewicht[i]!;
    if (u <= 0) return PLATTFORMEN[i]!.id;
  }
  return PLATTFORMEN[0]!.id;
}

const MEDIEN_PLATTFORM: Vorlage = {
  id: "medien_plattform",
  eigenerWurf: true,
  ohneZusatzplatz: true,
  szene: "istanbul",
  frist: MEDIEN_VORGAENGE.plattform.frist,
  abkuehlung: MEDIEN_VORGAENGE.plattform.abkuehlung,
  wettbewerb: "aussitzen",
  chance: (w) => {
    if (!w.spiel) return 0;
    const stufe = clamp(netz(w, "m_internetsperren") / 60, 0, 2);
    const protest = clamp(netz(w, "protestdruck") / 40, 0.5, 2);
    return MEDIEN_VORGAENGE.plattform.chance * stufe * protest;
  },
  erzeuge: (w) => ({ provinzen: [], staerke: 1, daten: { plattform: plattformWahl(w), stufe: Math.round(netz(w, "m_internetsperren")) } }),
  titel: (_, ev) => t("welle_e4.plattform.titel", { plattform: t(`welle_e4.plattform.name.${dStr(ev, "plattform")}`) }),
  text: (_, ev) => [
    t("welle_e4.plattform.text1", { plattform: t(`welle_e4.plattform.name.${dStr(ev, "plattform")}`) }),
    t("welle_e4.plattform.text2", { quote: zahl(Math.round((PLATTFORMEN.find((p) => p.id === dStr(ev, "plattform"))?.befolgt ?? 0.8) * 1000) / 10, 1) }),
  ],
  warum: () => t("welle_e4.plattform.warum"),
  stelle: () => ({ art: "medien" }),
  massnahmen: ["m_internetsperren"],
  optionen: (_, ev) => {
    const p = MEDIEN_VORGAENGE.plattform;
    const name = t(`welle_e4.plattform.name.${dStr(ev, "plattform")}`);
    const weg = (id: "sperren" | "drosseln" | "nachgeben"): Option => ({
      ...opt(id, t(`welle_e4.plattform.opt.${id}.label`, { plattform: name }), t(`welle_e4.plattform.opt.${id}.beschr`), 0, (w) => {
        bucheMedien(w, p[id]);
        return t(`welle_e4.plattform.opt.${id}.ausgang`, { plattform: name });
      }),
      stelle: { art: "medien" },
    });
    return [weg("sperren"), weg("drosseln"), weg("nachgeben")];
  },
  standard: (w, ev) => {
    bucheMedien(w, MEDIEN_VORGAENGE.plattform.liegen);
    return t("welle_e4.plattform.standard", { plattform: t(`welle_e4.plattform.name.${dStr(ev, "plattform")}`) });
  },
};

// ---------------------------------------------------------------------------
// Enthüllung über eine Vergabe

/** Das laufende Vorhaben, über das berichtet wird: zuerst eines, das an eine Stammfirma vergeben ist, sonst das teuerste. */
function enthuellungsZiel(w: World): { id: string; stammfirma: boolean } | null {
  if (!w.spiel?.reich) return null;
  const laufend = reichZustand(w).laufend.filter((l) => !l.frei && vorhabenDef(l.id) && (vorhabenDef(l.id)!.kosten.bau ?? 0) > 0);
  const stamm = laufend.find((l) => l.vergabe === "stammfirma");
  if (stamm) return { id: stamm.id, stammfirma: true };
  const teuer = [...laufend].sort((a, b) => vorhabenDef(b.id)!.kosten.bau - vorhabenDef(a.id)!.kosten.bau)[0];
  return teuer ? { id: teuer.id, stammfirma: false } : null;
}

const blattName = (ev: OffenesEreignis): string => (medienCluster(dStr(ev, "blatt")) ? blattDef(dStr(ev, "blatt")).name : t("welle_h3.medien.einHaus"));
const vorhabenName = (ev: OffenesEreignis): string => vorhabenDef(dStr(ev, "vorhaben"))?.name ?? dStr(ev, "vorhaben");

/** Eine Antwort über einen echten Medieneingriff; danach bleibt der Anteil `rest` des Schadens. */
function eingriffsAntwort(w0: World, ev0: OffenesEreignis, id: string, aktion: AktionId, cluster: string | undefined, rest: number, label: string): Option {
  const sicht = medienAktionen(w0).find((s) => s.aktion === aktion && s.cluster === cluster);
  // Die Zahlen des Schadens zeigt das Ereignisfenster aus der Rechnung auf einer Kopie; der Text nennt nur den Anteil, der bleibt
  const o = opt(id, label, t("welle_e4.enthuellung.rest", { prozent: Math.round(rest * 100) }), 0, (w, ev) => {
    const r = fuehreMedienAktionAus(w, aktion, cluster);
    if (!r.ok) {
      bucheMedien(w, MEDIEN_VORGAENGE.enthuellung.schaden, ev.staerke);
      return t("welle_e4.enthuellung.gescheitert", { grund: r.text });
    }
    bucheMedien(w, MEDIEN_VORGAENGE.enthuellung.schaden, ev.staerke * rest);
    return t(`welle_e4.enthuellung.opt.${id}.ausgang`, { blatt: blattName(ev), ergebnis: r.text });
  });
  return {
    ...o,
    anzeigePk: sicht?.kapital ?? 0,
    aufmerksamkeit: sicht?.aufmerksamkeit ?? 0,
    stelle: { art: "medien", ...(cluster ? { cluster } : {}) },
    ...(sicht && !sicht.moeglich ? { sperre: sicht.grund ?? t("medien.fehler.nicht_moeglich") } : !sicht ? { sperre: t("medien.fehler.nicht_moeglich") } : {}),
  };
}

const MEDIEN_ENTHUELLUNG: Vorlage = {
  id: "medien_enthuellung",
  eigenerWurf: true,
  ohneZusatzplatz: true,
  szene: "istanbul",
  frist: MEDIEN_VORGAENGE.enthuellung.frist,
  abkuehlung: MEDIEN_VORGAENGE.enthuellung.abkuehlung,
  wettbewerb: "aussitzen",
  chance: (w) => {
    const z = enthuellungsZiel(w);
    if (!z || !angreifer(w)) return 0;
    const p = MEDIEN_VORGAENGE.enthuellung;
    return p.chance * (z.stammfirma ? p.stammfirma : 1) * clamp(netz(w, "korruption") / 50, 0.5, 2);
  },
  erzeuge: (w) => {
    const z = enthuellungsZiel(w);
    const a = angreifer(w);
    if (!z || !a) return null;
    return { provinzen: [], staerke: z.stammfirma ? 1.4 : 0.8, daten: { vorhaben: z.id, blatt: a.id, stammfirma: z.stammfirma ? 1 : 0 } };
  },
  titel: (_, ev) => t("welle_e4.enthuellung.titel", { blatt: blattName(ev), vorhaben: vorhabenName(ev) }),
  text: (w, ev) => [
    t(Number(ev.daten?.stammfirma) ? "welle_e4.enthuellung.text.stammfirma" : "welle_e4.enthuellung.text.allgemein", { blatt: blattName(ev), vorhaben: vorhabenName(ev) }),
    t("welle_e4.enthuellung.text2", { korruption: Math.round(netz(w, "korruption")) }),
  ],
  warum: () => t("welle_e4.enthuellung.warum"),
  stelle: (_, ev) => ({ art: "medien", cluster: dStr(ev, "blatt") }),
  optionen: (w, ev) => {
    const p = MEDIEN_VORGAENGE.enthuellung;
    const blatt = dStr(ev, "blatt");
    const c = medienCluster(blatt);
    const aufsicht: AktionId = c?.verwundbarkeit.includes("lizenz") ? "aufsichtsstrafe" : "verfahren";
    const pruefen: Option = {
      ...opt("pruefen", t("welle_e4.enthuellung.opt.pruefen.label"), t("welle_e4.enthuellung.opt.pruefen.beschr", { monate: p.pruefenMonate }), p.pruefenPk, (ww, e) => {
        bucheMedien(ww, p.pruefen);
        const l = ww.spiel?.reich ? reichZustand(ww).laufend.find((x) => x.id === dStr(e, "vorhaben")) : undefined;
        if (l) {
          l.vergabe = "ausschreibung";
          l.vergabeBis = Math.max(l.vergabeBis ?? 0, ww.day + p.pruefenMonate * 30);
        }
        return t("welle_e4.enthuellung.opt.pruefen.ausgang", { vorhaben: vorhabenName(e) });
      }),
    };
    return [
      pruefen,
      eingriffsAntwort(w, ev, "pressekonferenz", "pressekonferenz", undefined, p.nachPressekonferenz, t("welle_e4.enthuellung.opt.pressekonferenz.label")),
      eingriffsAntwort(w, ev, "verfahren", aufsicht, c ? blatt : undefined, p.nachVerfahren, t(`welle_e4.enthuellung.opt.verfahren.label.${aufsicht}`, { blatt: blattName(ev) })),
    ];
  },
  standard: (w, ev) => {
    bucheMedien(w, MEDIEN_VORGAENGE.enthuellung.schaden, ev.staerke);
    const z = medienVon(w).cluster[dStr(ev, "blatt")];
    if (z) z.reichweite = clamp(z.reichweite + MEDIEN_VORGAENGE.enthuellung.reichweite, 0.1, 1.6);
    return t("welle_e4.enthuellung.standard", { blatt: blattName(ev), vorhaben: vorhabenName(ev) });
  },
};

// ---------------------------------------------------------------------------
// Sendezeit vor einer Wahl

/** Welche Wahl ansteht: der Wahlkampf ums Präsidentenamt (eigene Phase in sim/wahlkampf.ts) oder die Kommunalwahl in den nächsten 90 Tagen. */
function anstehendeWahl(w: World): "praesident" | "kommunal" | null {
  const sp = w.spiel;
  if (!sp || sp.ende) return null;
  if (sp.wahlkampf !== undefined) return "praesident";
  const naechste = sp.gesellschaft?.kommunen?.naechste;
  if (!naechste) return null;
  const tage = (Date.parse(naechste) - Date.parse(w.date)) / 86_400_000;
  return tage >= 0 && tage <= MEDIEN_VORGAENGE.sendezeit.tageVorKommunalwahl ? "kommunal" : null;
}

/** Selbstzensur des Staatsrundfunks ändern: der vorhandene Weg, über den das Haus berichtet (sim/medien.ts, sim/zeitung.ts). */
function staatsfunk(w: World, d: number): void {
  const z = medienVon(w).cluster["staatsrundfunk"];
  if (z) z.selbstzensur = clamp(z.selbstzensur + d, 0, 100);
}

const MEDIEN_SENDEZEIT: Vorlage = {
  id: "medien_sendezeit",
  eigenerWurf: true,
  ohneZusatzplatz: true,
  szene: "istanbul",
  frist: MEDIEN_VORGAENGE.sendezeit.frist,
  abkuehlung: MEDIEN_VORGAENGE.sendezeit.abkuehlung,
  wettbewerb: "aussitzen",
  chance: (w) => (anstehendeWahl(w) ? MEDIEN_VORGAENGE.sendezeit.chance : 0),
  erzeuge: (w) => ({ provinzen: [], staerke: 1, daten: { wahl: anstehendeWahl(w) ?? "kommunal" } }),
  titel: (_, ev) => t(`welle_e4.sendezeit.titel.${dStr(ev, "wahl")}`),
  text: () => [t("welle_e4.sendezeit.text1"), t("welle_e4.sendezeit.text2")],
  warum: () => t("welle_e4.sendezeit.warum"),
  stelle: () => ({ art: "medien", cluster: "staatsrundfunk" }),
  massnahmen: ["m_staatsmedien"],
  optionen: () => {
    const p = MEDIEN_VORGAENGE.sendezeit;
    return [
      { ...opt("linie", t("welle_e4.sendezeit.opt.linie.label"), t("welle_e4.sendezeit.opt.linie.beschr"), 0, (w) => {
        bucheMedien(w, p.linie);
        staatsfunk(w, p.zensurLinie);
        return t("welle_e4.sendezeit.opt.linie.ausgang");
      }), stelle: { art: "medien", cluster: "staatsrundfunk" } },
      { ...opt("ausgewogen", t("welle_e4.sendezeit.opt.ausgewogen.label"), t("welle_e4.sendezeit.opt.ausgewogen.beschr"), 0, (w) => {
        bucheMedien(w, p.ausgewogen);
        staatsfunk(w, p.zensurAusgewogen);
        return t("welle_e4.sendezeit.opt.ausgewogen.ausgang");
      }), stelle: { art: "medien", cluster: "staatsrundfunk" } },
      { ...opt("allesender", t("welle_e4.sendezeit.opt.allesender.label"), t("welle_e4.sendezeit.opt.allesender.beschr"), p.allesenderPk, (w) => {
        bucheMedien(w, p.allesender);
        staatsfunk(w, p.zensurLinie);
        return t("welle_e4.sendezeit.opt.allesender.ausgang");
      }), stelle: { art: "medien", cluster: "staatsrundfunk" } },
    ];
  },
  standard: (w) => {
    const p = MEDIEN_VORGAENGE.sendezeit;
    bucheMedien(w, p.linie, p.liegenAnteil);
    staatsfunk(w, p.zensurLinie * p.liegenAnteil);
    return t("welle_e4.sendezeit.standard");
  },
};

export const MEDIEN_VORLAGEN: Vorlage[] = [MEDIEN_PLATTFORM, MEDIEN_ENTHUELLUNG, MEDIEN_SENDEZEIT];

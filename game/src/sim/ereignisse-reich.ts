// Ereignisse der Fachbereiche: Kultur und Erbe, Recht, Streitkräfte, Infrastruktur (FACHBEREICHE.md).
// Wie in den anderen Vorlagen sind Wahrscheinlichkeiten und Wirkungen Platzhalter der Kalibrierung; Zahlen im Text stammen
// aus dem Weltzustand oder sind mit Quelle belegt (RECHERCHE_KONKURRENZ_FACHBEREICHE.md).

import { wirke, vertrauenAendern } from "./wirkung";
import { landAendern } from "./laender";
import { clamp } from "./economy";
import { beschr, kosten, monatVon, netz, opt, zusageAnlegen } from "./ereignis-hilfen";
import type { Vorlage } from "./ereignis-hilfen";
import { reichZustand, vorhabenDef } from "./reich";
import { ERBE, ERBE_NACH_ID } from "../data/erbe";
import type { World } from "./types";
import type { Rng } from "./rng";

const staette = (ev: { daten?: Record<string, number | string> }) => ERBE_NACH_ID[String(ev.daten?.staette ?? "")] ?? ERBE[0]!;

/** Zieht eine Stätte, deren Gewicht mit schlechtem Zustand wächst. */
function schwaecheZiehen(w: World, rng: Rng, nur?: (e: (typeof ERBE)[number]) => boolean): (typeof ERBE)[number] | null {
  const z = reichZustand(w);
  const kandidaten = ERBE.filter((e) => (nur ? nur(e) : true));
  const gewichte = kandidaten.map((e) => Math.max(0.05, (100 - (z.staetten[e.id]?.zustand ?? 50)) / 100) ** 2);
  const summe = gewichte.reduce((a, b) => a + b, 0);
  if (!kandidaten.length || summe <= 0) return null;
  let r = rng.next() * summe;
  for (let i = 0; i < kandidaten.length; i++) {
    r -= gewichte[i]!;
    if (r <= 0) return kandidaten[i]!;
  }
  return kandidaten[kandidaten.length - 1]!;
}

const hebeStaette = (w: World, id: string, d: number) => {
  const st = reichZustand(w).staetten[id];
  if (st) st.zustand = clamp(st.zustand + d, 0, 100);
};

/** Besetzt einen frei werdenden Sitz: Ein Mitglied verlässt das Gericht (nach Anteil), ein neues aus dem gewählten Lager kommt. */
function besetze(w: World, key: "aym" | "hsk", wahl: "loyal" | "unabhaengig" | "reform", rng: Rng): void {
  const s = reichZustand(w).sitze[key];
  if (!s) return;
  const n = s.loyal + s.unabhaengig + s.reform;
  let r = rng.next() * n;
  const geht = r < s.loyal ? "loyal" : r < s.loyal + s.reform ? "reform" : "unabhaengig";
  r = 0;
  s[geht] -= 1;
  s[wahl] += 1;
}

// ---------------------------------------------------------------------------
// Kultur und Erbe

const RAUBGRABUNG: Vorlage = {
  id: "erbe_raubgrabung",
  szene: "anatolien",
  frist: 15,
  abkuehlung: 240,
  chance: (w) => (netz(w, "kriminalitaet") > 40 ? 0.03 : 0.015),
  erzeuge: (w, rng) => {
    const e = schwaecheZiehen(w, rng, (x) => x.bezug.includes("antik") || x.bezug.includes("fruehmenschlich"));
    return e ? { provinzen: [e.plaka], staerke: 0.5 + 0.5 * rng.next(), daten: { staette: e.id } } : null;
  },
  titel: (_, ev) => `Raubgrabung bei ${staette(ev).name}`,
  text: (_, ev) => [
    `Wächter melden nächtliche Grabungen bei ${staette(ev).name} (${staette(ev).ort}): Löcher im Boden, Spuren von Metalldetektoren, ein Händler bietet im Ausland Stücke an, die aus der Gegend stammen könnten.`,
    "Das Gesetz zum Schutz von Kulturgütern sieht zwei bis fünf Jahre Haft vor; die Wächter sind zu wenige.",
  ],
  warum: () => "Ein Erbe, das niemand bewacht, geht Stück für Stück verloren: durch Raub, durch Verfall und durch Gleichgültigkeit.",
  massnahmen: ["m_denkmalschutz", "m_archaeologie"],
  optionen: (_, ev) => [
    opt("schutz", "Wächter aufstocken und Ermittler schicken", beschr(3, 0, "sichert die Stätte und stellt Täter."), 3, (w) => {
      hebeStaette(w, staette(ev).id, 8);
      wirke(w, "kriminalitaet", -1, ev.provinzen);
      wirke(w, "ansehen", 0.5);
      return `Die Stätte bei ${staette(ev).name} wird bewacht; die Ermittler verfolgen die Händler.`;
    }),
    opt("grabung", "Die Grabung selbst übernehmen: Funde sichern", beschr(2, 0.02, "die Wissenschaft rettet, was noch da ist."), 2, (w) => {
      kosten(w, 0.02);
      hebeStaette(w, staette(ev).id, 5);
      wirke(w, "hochschule", 0.5);
      wirke(w, "identitaet", 0.5);
      return `Archäologen übernehmen die Grabung bei ${staette(ev).name} und sichern die Funde.`;
    }),
  ],
  standard: (w, ev) => {
    hebeStaette(w, staette(ev).id, -10 * ev.staerke);
    wirke(w, "ansehen", -0.5);
    return `Die Raubgräber machen weiter; bei ${staette(ev).name} gehen Funde verloren.`;
  },
};

const ERDBEBENSCHADEN: Vorlage = {
  id: "erbe_erdbebenschaden",
  szene: "anatolien",
  frist: 12,
  abkuehlung: 400,
  chance: (w) => (netz(w, "erdbebenvorsorge") < 45 ? 0.012 : 0.006),
  erzeuge: (w, rng) => {
    const e = schwaecheZiehen(w, rng);
    return e ? { provinzen: [e.plaka], staerke: 0.4 + 0.6 * rng.next(), daten: { staette: e.id } } : null;
  },
  titel: (_, ev) => `Nachbeben: Schäden an ${staette(ev).name}`,
  text: (_, ev) => [
    `Ein Erdbeben der Stärke fünf bringt bei ${staette(ev).name} (${staette(ev).ort}) Mauern zum Einsturz und reißt Risse in tragende Bauteile. Gutachter warnen: Bleibt die Stätte ungesichert, droht der nächste Regen den Rest zu zerstören.`,
    "Antakya hat 2023 mehr als die Hälfte seiner historischen Bausubstanz verloren; niemand will sich das wiederholen.",
  ],
  warum: () => "Das Erdbebenland verliert sein Erbe nicht nur durch Alter, sondern durch einzelne Nächte; Vorsorge ist billiger als Wiederaufbau.",
  massnahmen: ["m_denkmalschutz", "m_bauaufsicht"],
  optionen: (_, ev) => [
    opt("sichern", "Sofort sichern: Stützen, Dächer, Gutachter", beschr(3, 0.03, "rettet, was zu retten ist."), 3, (w) => {
      kosten(w, 0.03);
      hebeStaette(w, staette(ev).id, 12);
      return `Notdächer und Stützen sichern ${staette(ev).name}.`;
    }),
    opt("zusagen", "Den Wiederaufbau zusagen", beschr(1, 0, "ein Versprechen, das später eingefordert wird."), 1, (w) => {
      zusageAnlegen(w, { von: `Denkmalbehörde von ${staette(ev).ort}`, text: `Der Wiederaufbau von ${staette(ev).name} wurde zugesagt`, tage: 300, massnahme: "m_denkmalschutz" });
      hebeStaette(w, staette(ev).id, 4);
      return `Der Wiederaufbau von ${staette(ev).name} ist zugesagt.`;
    }),
  ],
  standard: (w, ev) => {
    hebeStaette(w, staette(ev).id, -18 * ev.staerke);
    wirke(w, "kulturerbe", -1, ev.provinzen);
    return `Ungesichert verfällt ${staette(ev).name} weiter; der nächste Regen richtet den Rest an.`;
  },
};

const UNESCO: Vorlage = {
  id: "erbe_unesco",
  szene: "parlament",
  frist: 25,
  abkuehlung: 540,
  chance: (w) => (monatVon(w) === 7 ? 0.45 : 0),
  erzeuge: (w, rng) => {
    const z = reichZustand(w);
    const kand = ERBE.filter((e) => e.unesco.status === "tentativ" && (z.staetten[e.id]?.zustand ?? 0) >= 50);
    if (!kand.length) return null;
    const e = kand[Math.floor(rng.next() * kand.length)]!;
    return { provinzen: [e.plaka], staerke: 1, daten: { staette: e.id } };
  },
  titel: (_, ev) => `Das Welterbekomitee berät über ${staette(ev).name}`,
  text: (w, ev) => [
    `Im Juli tagt das Welterbekomitee der UNESCO. Die Türkei hat ${staette(ev).name} (${staette(ev).ort}) für die Liste vorgeschlagen; der Zustand der Stätte ist ${Math.round(reichZustand(w).staetten[staette(ev).id]?.zustand ?? 0)} von 100. Die Gutachter verlangen einen Plan zur Erhaltung, ein Besuchermanagement und Ansprechpartner vor Ort.`,
    "Zuletzt wurde Sardes 2025 aufgenommen, nach jahrelanger Vorbereitung.",
  ],
  warum: () => "Ein Welterbetitel hängt an Zustand, Verwaltung und Diplomatie; er bringt Gäste und Ansehen und verpflichtet zu Pflege und Berichten.",
  massnahmen: ["m_archaeologie", "m_denkmalschutz"],
  optionen: (_, ev) => [
    opt("betreiben", "Den Antrag mit vollem Einsatz betreiben", beschr(4, 0, "Diplomatie, Gutachter und ein Erhaltungsplan; der Ausgang ist offen."), 4, (w, _e, rng) => {
      const st = reichZustand(w).staetten[staette(ev).id]?.zustand ?? 50;
      const p = clamp(0.4 + 0.006 * (st - 55) + 0.004 * (netz(w, "ansehen") - 50), 0.15, 0.85);
      if (rng.next() < p) {
        wirke(w, "ansehen", 3);
        wirke(w, "tourismus", 3, ev.provinzen);
        wirke(w, "identitaet", 1);
        hebeStaette(w, staette(ev).id, 6);
        return `${staette(ev).name} wird in die Welterbeliste aufgenommen.`;
      }
      wirke(w, "ansehen", -0.5);
      return `Das Komitee vertagt die Entscheidung über ${staette(ev).name}: Der Erhaltungsplan überzeugt noch nicht.`;
    }),
    opt("zurueck", "Den Antrag zurückstellen und erst die Stätte sichern", beschr(1, 0, "spart Kraft und kostet ein Jahr."), 1, (w) => {
      hebeStaette(w, staette(ev).id, 5);
      return `Ankara stellt den Antrag für ${staette(ev).name} zurück und sichert zuerst die Stätte.`;
    }),
  ],
  standard: (w) => {
    wirke(w, "ansehen", -0.3);
    return "Ohne Beitrag Ankaras schiebt das Komitee den Antrag auf.";
  },
};

const FUND: Vorlage = {
  id: "erbe_fund",
  szene: "anatolien",
  frist: 15,
  abkuehlung: 420,
  chance: (w) => (netz(w, "m_archaeologie") >= 40 ? 0.03 : 0.008),
  erzeuge: (w, rng) => {
    const kand = ERBE.filter((e) => e.bezug.includes("fruehmenschlich") || e.bezug.includes("antik"));
    const e = kand[Math.floor(rng.next() * kand.length)]!;
    return { provinzen: [e.plaka], staerke: 0.5 + 0.5 * rng.next(), daten: { staette: e.id } };
  },
  titel: (_, ev) => `Ein Fund bei ${staette(ev).name}`,
  text: (_, ev) => [
    `Die Grabungsleiter bei ${staette(ev).name} (${staette(ev).ort}) melden einen Fund, der die Forschung verändern könnte: eine Anlage, die älter ist als angenommen, mit Reliefs und Inschriften. Die Presse hat schon davon erfahren.`,
    "Göbekli Tepe zählte 2024 750.000 Besucher; ein neuer Fund wird sofort zum Ziel.",
  ],
  warum: () => "Funde machen ein Land sichtbar, aber Schutz und Forschung brauchen Zeit; wer zu früh feiert, riskiert Schäden und Raub.",
  massnahmen: ["m_archaeologie"],
  optionen: (_, ev) => [
    opt("offen", "Sofort bekannt machen und ein Museum ankündigen", beschr(2, 0.02, "Aufmerksamkeit, Gäste und Erwartungen."), 2, (w) => {
      kosten(w, 0.02);
      wirke(w, "tourismus", 2, ev.provinzen);
      wirke(w, "identitaet", 1.5);
      wirke(w, "ansehen", 1.5);
      hebeStaette(w, staette(ev).id, -3);
      return `Die Regierung macht den Fund bei ${staette(ev).name} bekannt und kündigt ein Museum an.`;
    }),
    opt("sichern", "Erst wissenschaftlich sichern, dann berichten", beschr(1, 0, "langsamer Ruhm, sichere Stätte."), 1, (w) => {
      wirke(w, "hochschule", 1);
      wirke(w, "identitaet", 0.5);
      hebeStaette(w, staette(ev).id, 4);
      return `Wissenschaftler dokumentieren den Fund bei ${staette(ev).name}, bevor er veröffentlicht wird.`;
    }),
  ],
  standard: (w, ev) => {
    hebeStaette(w, staette(ev).id, -4);
    return `Ohne Entscheidung sickern Bilder durch; bei ${staette(ev).name} stehen bald Schaulustige.`;
  },
};

const HAGIA_SOPHIA: Vorlage = {
  id: "erbe_hagia_sophia",
  szene: "istanbul",
  frist: 20,
  abkuehlung: 720,
  chance: (w) => (netz(w, "vielfalt") < 48 && Number(w.date.slice(0, 4)) >= 2029 ? 0.012 : 0),
  erzeuge: () => ({ provinzen: [34], staerke: 1 }),
  titel: () => "Streit um die Hagia Sophia",
  text: () => [
    "Zum Jahrestag der Umwidmung streiten Verbände, Kirchen und Museumsleute wieder um die Nutzung der Hagia Sophia: Gebet für die einen, Weltkulturerbe für die anderen, Ziel für Millionen Besucher.",
    "Das Dekret vom 2. Juli 2020 machte sie wieder zur Moschee; die UNESCO bedauerte es. Seit 15. Januar 2024 zahlen ausländische Gäste 25 Euro.",
  ],
  warum: () => "Ein Bauwerk kann für mehrere Gemeinschaften heilig sein; jede Änderung der Besuchsregeln wird politisch gelesen.",
  massnahmen: ["m_minderheitenrechte"],
  optionen: () => [
    opt("offen", "Besuchszeiten für alle Glaubensrichtungen öffnen", beschr(3, 0, "Vielfalt und Ansehen, aber Protest der Konservativen."), 3, (w) => {
      wirke(w, "vielfalt", 3);
      wirke(w, "ansehen", 2);
      wirke(w, "konservative", -2);
      hebeStaette(w, "hagia_sophia", 2);
      return "Die Regierung öffnet feste Zeiten für Besucher aller Glaubensrichtungen.";
    }),
    opt("gebuehr", "Den Eintritt für Ausländer anheben", beschr(1, 0, "Einnahmen, weniger Gäste."), 1, (w) => {
      w.economy.debtRatio -= 0.02;
      wirke(w, "tourismus", -1, [34]);
      return "Der Eintritt für ausländische Gäste steigt; das bringt Einnahmen und dämpft den Andrang.";
    }),
  ],
  standard: (w) => {
    wirke(w, "polarisierung", 1);
    return "Ohne Entscheidung bleibt es beim Streit.";
  },
};

const PILGERWELLE: Vorlage = {
  id: "kultur_pilgerwelle",
  szene: "anatolien",
  frist: 12,
  abkuehlung: 360,
  chance: (w) => (w.spiel?.reich?.bestand.serie_kirchen7 ? 0.05 : 0.004),
  erzeuge: () => ({ provinzen: [35, 45, 20], staerke: 1 }),
  titel: () => "Eine Pilgerwelle an der Kirchenroute",
  text: () => [
    "Zum kirchlichen Feiertag kommen weit mehr Pilger und Reisegruppen, als die Kirchenroute der Sieben verkraftet: Busse stauen sich in Selçuk, in Bergama fehlen Unterkünfte, und in Sardes drängen sich die Gäste in der Synagoge.",
    "Das ist der Erfolg, den man wollte, und die Belastung, vor der die Denkmalbehörden warnten.",
  ],
  warum: () => "Erfolg belastet: Wer Besucher anzieht, muss sie lenken, sonst zahlt die Stätte.",
  massnahmen: ["m_denkmalschutz", "m_kulturfoerderung"],
  optionen: () => [
    opt("lenken", "Unterkünfte und Besucherlenkung ausbauen", beschr(2, 0.02, "schützt die Stätten, kostet Baukapazität."), 2, (w) => {
      kosten(w, 0.02);
      wirke(w, "tourismus", 1, [35, 45, 20]);
      for (const id of ["ephesos", "smyrna", "pergamon", "thyatira", "sardes", "philadelphia", "laodikeia"]) hebeStaette(w, id, 2);
      return "Ordner, Parkflächen und Führungen lenken die Pilger.";
    }),
    opt("laufen", "Laufen lassen", beschr(0, 0, "mehr Gäste heute, mehr Verschleiß morgen."), 0, (w) => {
      wirke(w, "tourismus", 2, [35, 45, 20]);
      for (const id of ["ephesos", "smyrna", "pergamon", "thyatira", "sardes", "philadelphia", "laodikeia"]) hebeStaette(w, id, -3);
      return "Die Pilger kommen in Scharen; die Stätten tragen die Last.";
    }),
  ],
  standard: (w) => {
    for (const id of ["ephesos", "pergamon", "sardes"]) hebeStaette(w, id, -2);
    return "Der Andrang bleibt unbewältigt; die Stätten leiden.";
  },
};

// ---------------------------------------------------------------------------
// Recht

const ERNENNUNG: Vorlage = {
  id: "recht_ernennung",
  szene: "parlament",
  frist: 20,
  abkuehlung: 330,
  chance: () => 0.05,
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => "Ein Sitz am Verfassungsgericht wird frei",
  text: (w) => {
    const s = reichZustand(w).sitze.aym!;
    return [
      "Ein Mitglied des Verfassungsgerichts tritt in den Ruhestand. Der Präsident ernennt zwölf der fünfzehn Mitglieder; für den frei gewordenen Platz muss er einen Namen nennen.",
      `Im Gericht sitzen jetzt ${s.loyal} Juristen, die der Regierung nahestehen, ${s.reform} Reformorientierte und ${s.unabhaengig} Unabhängige. Jede Ernennung verschiebt das Gleichgewicht für zwölf Jahre.`,
    ];
  },
  warum: () => "Wer die Sitze besetzt, prägt, ob Gerichte Vorhaben der Regierung stoppen: Loyalität kauft Ruhe, Unabhängigkeit kauft Glaubwürdigkeit.",
  massnahmen: ["m_richterrat"],
  optionen: () => [
    opt("loyal", "Einen Juristen aus dem eigenen Umfeld ernennen", beschr(0, 0, "sicher für die Regierung, teuer für die Unabhängigkeit."), 0, (w, _e, rng) => {
      besetze(w, "aym", "loyal", rng);
      wirke(w, "justiz_unabhaengigkeit", -1);
      wirke(w, "konservative", 0.5);
      return "Der Präsident ernennt einen Juristen aus dem eigenen Umfeld.";
    }),
    opt("unabhaengig", "Eine anerkannte, unabhängige Juristin ernennen", beschr(2, 0, "Glaubwürdigkeit im In- und Ausland, weniger Zugriff."), 2, (w, _e, rng) => {
      besetze(w, "aym", "unabhaengig", rng);
      wirke(w, "justiz_unabhaengigkeit", 1.5);
      wirke(w, "ansehen", 1);
      wirke(w, "staedtische_saekulare", 1);
      return "Der Präsident ernennt eine unabhängige Juristin; die Fachwelt lobt die Wahl.";
    }),
    opt("kompromiss", "Eine Kandidatin suchen, die auch die Opposition mitträgt", beschr(3, 0, "ein Kompromiss, der Fraktionen einbindet."), 3, (w, _e, rng) => {
      besetze(w, "aym", "reform", rng);
      wirke(w, "justiz_unabhaengigkeit", 0.8);
      wirke(w, "polarisierung", -0.5);
      return "Nach Gesprächen mit der Opposition steht eine Kandidatin fest, die beide Lager mittragen.";
    }),
  ],
  standard: (w) => {
    const s = reichZustand(w).sitze.aym!;
    s.loyal += 1;
    s.unabhaengig = Math.max(0, s.unabhaengig - 1);
    return "Der Präsident lässt die Frist verstreichen; der Sitz geht an den Kandidaten seines Umfelds.";
  },
};

const AYM_GEGEN_KASSATION: Vorlage = {
  id: "recht_aym_kassation",
  szene: "parlament",
  frist: 15,
  abkuehlung: 400,
  chance: (w) => (netz(w, "urteilsbefolgung") < 45 ? 0.025 : 0.006),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => "Verfassungsgericht gegen Kassationshof",
  text: () => [
    "Der Kassationshof weigert sich, ein Urteil des Verfassungsgerichts umzusetzen, das die Freilassung eines gewählten Abgeordneten anordnet: Das Urteil habe „keinen Rechtswert“. Zum zweiten Mal steht Gericht gegen Gericht.",
    "Anwälte und Opposition fordern, dass die Regierung das Urteil durchsetzt; regierungsnahe Kreise stellen sich hinter den Kassationshof.",
  ],
  warum: () => "Wenn oberste Gerichte einander nicht anerkennen, entscheidet sich, ob Urteile etwas gelten; die Regierung hat kein neutrales Amt in diesem Streit.",
  massnahmen: ["m_urteilsumsetzung"],
  optionen: () => [
    opt("durchsetzen", "Das Urteil des Verfassungsgerichts durchsetzen", beschr(4, 0, "stärkt die Gerichtsbarkeit, verärgert das Lager."), 4, (w) => {
      wirke(w, "urteilsbefolgung", 5);
      wirke(w, "justiz_unabhaengigkeit", 2);
      wirke(w, "strassburg_druck", -2);
      wirke(w, "konservative", -1);
      return "Die Regierung sorgt dafür, dass das Urteil des Verfassungsgerichts umgesetzt wird.";
    }),
    opt("kassation", "Den Kassationshof stützen", beschr(0, 0, "Ruhe im Lager, Streit mit Straßburg."), 0, (w) => {
      wirke(w, "urteilsbefolgung", -4);
      wirke(w, "justiz_unabhaengigkeit", -2);
      wirke(w, "ansehen", -1.5);
      wirke(w, "konservative", 1);
      return "Die Regierung stellt sich hinter den Kassationshof; das Urteil bleibt unerfüllt.";
    }),
  ],
  standard: (w) => {
    wirke(w, "urteilsbefolgung", -2);
    wirke(w, "polarisierung", 1);
    return "Der Streit der Gerichte bleibt ungelöst; das Vertrauen in beide sinkt.";
  },
};

const EGMR_URTEIL: Vorlage = {
  id: "recht_egmr",
  szene: "parlament",
  frist: 20,
  abkuehlung: 300,
  chance: (w) => (netz(w, "strassburg_druck") >= 50 ? 0.035 : 0.01),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => "Ein Urteil aus Straßburg",
  text: () => [
    "Der Europäische Gerichtshof für Menschenrechte stellt fest, dass die Türkei in einem weiteren Fall die Konvention verletzt hat. 2025 ergingen 74 Urteile gegen die Türkei, 66 mit Verletzung; 22.566 Beschwerden waren am 1. Juli 2026 anhängig.",
    "Das Ministerkomitee des Europarats fragt, ob und wann die Regierung das Urteil umsetzt.",
  ],
  warum: () => "Urteile aus Straßburg sind bindend; wer sie nicht umsetzt, sammelt Verfahren und Vorwürfe.",
  massnahmen: ["m_urteilsumsetzung"],
  optionen: () => [
    opt("umsetzen", "Das Urteil umsetzen", beschr(3, 0, "Freiheit und Ansehen, Ärger im Lager."), 3, (w) => {
      wirke(w, "urteilsbefolgung", 4);
      wirke(w, "strassburg_druck", -3);
      wirke(w, "konservative", -1.5);
      landAendern(w, "EU", { vertrauen: 2 }, "Ein Straßburger Urteil wurde umgesetzt");
      return "Die Regierung setzt das Straßburger Urteil um.";
    }),
    opt("zurueck", "Das Urteil zurückweisen", beschr(0, 0, "Beifall zu Hause, Druck von außen."), 0, (w) => {
      wirke(w, "strassburg_druck", 3);
      wirke(w, "ansehen", -2);
      wirke(w, "konservative", 1.5);
      landAendern(w, "EU", { vertrauen: -2 }, "Ein Straßburger Urteil wurde zurückgewiesen");
      return "Die Regierung weist das Straßburger Urteil zurück.";
    }),
  ],
  standard: (w) => {
    wirke(w, "strassburg_druck", 1);
    return "Das Urteil bleibt liegen; die Liste des Ministerkomitees wächst.";
  },
};

const HAFTREVOLTE: Vorlage = {
  id: "recht_haftrevolte",
  szene: "istanbul",
  frist: 8,
  abkuehlung: 360,
  chance: (w) => 0.02 * Math.max(0, netz(w, "haftueberfuellung") / 70) ** 3,
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => "Unruhen in einer überfüllten Haftanstalt",
  text: () => [
    "In einer Haftanstalt, die für halb so viele Menschen gebaut wurde, brechen Unruhen aus: Insassen verweigern das Essen, ein Flügel brennt. Angehörige stehen vor dem Tor.",
    "Im August 2026 saßen 433.520 Menschen auf 304.956 Plätzen, 65.227 davon in Untersuchungshaft.",
  ],
  warum: () => "Überfüllung ist eine Politikfrage: Sie entsteht aus Haftpraxis und Kapazität, und sie entlädt sich in solchen Nächten.",
  massnahmen: ["m_haftvermeidung"],
  optionen: () => [
    opt("verlegen", "Sofort verlegen und Plätze schaffen", beschr(3, 0.03, "beruhigt die Lage kurz, kostet Bauarbeit."), 3, (w) => {
      kosten(w, 0.03);
      wirke(w, "haftueberfuellung", -2);
      wirke(w, "justizvertrauen", 0.5);
      return "Häftlinge werden verlegt, zusätzliche Plätze eingerichtet.";
    }),
    opt("haerte", "Härte zeigen", beschr(0, 0, "Beifall der Konservativen, Kritik im Ausland."), 0, (w) => {
      wirke(w, "konservative", 1);
      wirke(w, "ansehen", -2);
      wirke(w, "justizvertrauen", -1);
      return "Sondereinsatzkräfte beenden die Unruhen mit Härte.";
    }),
    opt("vermeidung", "Haftvermeidung und Bewährung ankündigen", beschr(2, 0, "eine Richtung, keine Sofortlösung."), 2, (w) => {
      wirke(w, "haftueberfuellung", -1);
      wirke(w, "justizvertrauen", 1);
      wirke(w, "konservative", -1);
      return "Die Regierung kündigt an, Untersuchungshaft zurückzudrängen.";
    }),
  ],
  standard: (w) => {
    wirke(w, "justizvertrauen", -1);
    wirke(w, "ansehen", -1);
    return "Die Lage in der Anstalt entgleitet; Berichte gehen um die Welt.";
  },
};

// ---------------------------------------------------------------------------
// Streitkräfte

const LIEFERVERZUG: Vorlage = {
  id: "mil_lieferverzug",
  szene: "parlament",
  frist: 15,
  abkuehlung: 300,
  chance: (w) => ((w.spiel?.reich?.laufend ?? []).some((l) => vorhabenDef(l.id)?.bereich === "militaer") ? 0.025 : 0),
  erzeuge: (w) => {
    const laeuft = (w.spiel?.reich?.laufend ?? []).map((l) => vorhabenDef(l.id)).filter((v) => v?.bereich === "militaer" && !v.id.startsWith("doktrin"));
    const v = laeuft[0];
    return v ? { provinzen: [], staerke: 1, daten: { vorhaben: v.id } } : null;
  },
  titel: (_, ev) => `Verzug bei „${vorhabenDef(String(ev.daten?.vorhaben))?.name ?? "einem Rüstungsprogramm"}“`,
  text: (_, ev) => [
    `Beim Programm „${vorhabenDef(String(ev.daten?.vorhaben))?.name ?? "Rüstung"}“ melden die Hersteller Verzug: Ein Zulieferteil kommt nicht, die Abnahme wird verschoben, die Ausbildung hinkt hinterher.`,
    "Verzug ist der Normalfall bei Rüstung; die Frage ist, wer den Preis zahlt: der Lieferant, die Truppe oder der Präsident.",
  ],
  warum: () => "Bestellt ist nicht einsatzbereit: Vom Vertrag bis zur Bereitschaft vergehen Jahre, und jede Störung kostet Zeit oder Bündnisgeduld.",
  massnahmen: ["m_ruestungsindustrie"],
  optionen: (_, ev) => [
    opt("druck", "Auf den Lieferanten Druck machen", beschr(2, 0, "Termine halten, Beziehungen belasten."), 2, (w) => {
      const l = reichZustand(w).laufend.find((x) => x.id === String(ev.daten?.vorhaben));
      if (l) l.fortschritt += (vorhabenDef(l.id)?.kosten.bau ?? 0) * 0.03;
      wirke(w, "beziehungen_usa", -0.5);
      return "Ankara macht Druck: Der Lieferant sagt Aufholung zu.";
    }),
    opt("hinnehmen", "Die Frist hinnehmen", beschr(0, 0, "Ruhe, aber ein Loch in der Bereitschaft."), 0, (w) => {
      const l = reichZustand(w).laufend.find((x) => x.id === String(ev.daten?.vorhaben));
      if (l) l.fortschritt = Math.max(0, l.fortschritt - (vorhabenDef(l.id)?.kosten.bau ?? 0) * 0.05);
      wirke(w, "bereitschaft_luft", -0.5);
      return "Die Regierung nimmt den Verzug hin; das Programm rutscht nach hinten.";
    }),
    opt("eigen", "Die eigene Fertigung vorziehen", beschr(3, 0.05, "mehr Autarkie, später Ergebnisse."), 3, (w) => {
      kosten(w, 0.05);
      wirke(w, "ruestungsautarkie", 2);
      const l = reichZustand(w).laufend.find((x) => x.id === String(ev.daten?.vorhaben));
      if (l) l.fortschritt = Math.max(0, l.fortschritt - (vorhabenDef(l.id)?.kosten.bau ?? 0) * 0.03);
      return "Die Rüstungsagentur zieht die eigene Fertigung vor.";
    }),
  ],
  standard: (w, ev) => {
    const l = reichZustand(w).laufend.find((x) => x.id === String(ev.daten?.vorhaben));
    if (l) l.fortschritt = Math.max(0, l.fortschritt - (vorhabenDef(l.id)?.kosten.bau ?? 0) * 0.04);
    return "Der Verzug läuft weiter; das Programm verliert Zeit.";
  },
};

const MILITAERRAT: Vorlage = {
  id: "mil_militaerrat",
  szene: "parlament",
  frist: 20,
  abkuehlung: 330,
  chance: (w) => (monatVon(w) === 8 ? 0.7 : 0),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => "Der Oberste Militärrat tagt",
  text: () => [
    "Im August tagt der Oberste Militärrat unter Vorsitz des Präsidenten: Er entscheidet über Beförderungen und Pensionierungen der Generäle und Admirale.",
    "Nach 2016 wurden Schätzungen zufolge 40 Prozent bis zwei Drittel der Generäle entlassen; wer nun befördert wird, sagt der Truppe, wonach im Land befördert wird.",
  ],
  warum: () => "Die Auswahl der Führung entscheidet, ob Offiziere sich an Leistung oder an Nähe orientieren. Loyalität kauft Ruhe, Leistung kauft Bereitschaft.",
  massnahmen: ["m_offiziersauswahl"],
  optionen: () => [
    opt("leistung", "Nach Leistung befördern", beschr(3, 0, "Vertrauen und Bereitschaft, aber weniger Zugriff."), 3, (w) => {
      wirke(w, "offiziersvertrauen", 4);
      wirke(w, "truppenmoral", 2);
      wirke(w, "bereitschaft_heer", 1);
      return "Der Militärrat befördert nach Leistung und Qualifikation.";
    }),
    opt("loyalitaet", "Nach Loyalität befördern", beschr(0, 0, "Rückhalt in der Führung, Misstrauen in der Truppe."), 0, (w) => {
      wirke(w, "offiziersvertrauen", -3);
      wirke(w, "bereitschaft_heer", -1);
      vertrauenAendern(w, 0.5);
      if (w.spiel) w.spiel.kapital = clamp(w.spiel.kapital + 3, 0, 150);
      return "Der Militärrat befördert Offiziere, die dem Präsidenten nahestehen.";
    }),
    opt("generalstab", "Den Vorschlag des Generalstabs bestätigen", beschr(1, 0, "ruhig, wenig Streit."), 1, (w) => {
      wirke(w, "offiziersvertrauen", 1);
      wirke(w, "truppenmoral", 1);
      return "Der Militärrat bestätigt die Vorschläge des Generalstabs.";
    }),
  ],
  standard: (w) => {
    wirke(w, "offiziersvertrauen", -1);
    return "Der Rat tagt ohne Ihre Vorgaben; der Generalstab setzt sich durch.";
  },
};

// ---------------------------------------------------------------------------
// Infrastruktur

const BAUUNFALL: Vorlage = {
  id: "infra_bauunfall",
  szene: "anatolien",
  frist: 10,
  abkuehlung: 360,
  chance: (w) => {
    const z = w.spiel?.reich;
    const n = (z?.laufend ?? []).filter((l) => vorhabenDef(l.id)?.bereich === "infrastruktur").length;
    return n >= 1 ? 0.012 + (z && z.verwaltung < 30 ? 0.02 : 0) : 0;
  },
  erzeuge: (w) => {
    const l = (w.spiel?.reich?.laufend ?? []).map((x) => vorhabenDef(x.id)).find((v) => v?.bereich === "infrastruktur");
    return l ? { provinzen: l.provinzen?.slice(0, 1) ?? [], staerke: 1, daten: { vorhaben: l.id } } : null;
  },
  titel: (_, ev) => `Unfall auf der Baustelle „${vorhabenDef(String(ev.daten?.vorhaben))?.name ?? "einer Großbaustelle"}“`,
  text: (_, ev) => [
    `Auf der Baustelle von „${vorhabenDef(String(ev.daten?.vorhaben))?.name ?? "einem Großprojekt"}“ stürzt ein Gerüst ein; Arbeiter werden verletzt, mehrere sterben. Gewerkschaften und Angehörige fordern Aufklärung.`,
    "Beim Bau des Istanbuler Flughafens starben offiziell 27 Arbeiter; die Zahl blieb umstritten.",
  ],
  warum: () => "Großprojekte werden unter Zeitdruck gebaut; wenn Verwaltung und Aufsicht überlastet sind, zahlen es die Arbeiter.",
  massnahmen: ["m_gewerkschaftsrechte", "m_bauaufsicht"],
  optionen: (_, ev) => [
    opt("aufklaeren", "Untersuchung und Sicherheitsprogramm", beschr(3, 0, "hilft den Arbeitern, kostet Baufortschritt."), 3, (w) => {
      wirke(w, "arbeitnehmer", 1.5);
      wirke(w, "zivilgesellschaft", 0.5);
      const l = reichZustand(w).laufend.find((x) => x.id === String(ev.daten?.vorhaben));
      if (l) l.fortschritt = Math.max(0, l.fortschritt - (vorhabenDef(l.id)?.kosten.bau ?? 0) * 0.03);
      return "Die Baustelle ruht, eine unabhängige Untersuchung beginnt, ein Sicherheitsprogramm folgt.";
    }),
    opt("decken", "Das Bauunternehmen decken", beschr(0, 0, "Der Bau läuft weiter; die Wut wächst."), 0, (w) => {
      wirke(w, "korruption", 1.5);
      wirke(w, "arbeitnehmer", -3);
      wirke(w, "legitimitaet", -1);
      return "Die Regierung deckt das Bauunternehmen; die Arbeiten laufen weiter.";
    }),
  ],
  standard: (w) => {
    wirke(w, "arbeitnehmer", -1.5);
    wirke(w, "legitimitaet", -0.5);
    return "Ohne klare Antwort wächst die Wut der Angehörigen und der Gewerkschaften.";
  },
};

export const REICH_VORLAGEN: Vorlage[] = [
  RAUBGRABUNG,
  ERDBEBENSCHADEN,
  UNESCO,
  FUND,
  HAGIA_SOPHIA,
  PILGERWELLE,
  ERNENNUNG,
  AYM_GEGEN_KASSATION,
  EGMR_URTEIL,
  HAFTREVOLTE,
  LIEFERVERZUG,
  MILITAERRAT,
  BAUUNFALL,
];

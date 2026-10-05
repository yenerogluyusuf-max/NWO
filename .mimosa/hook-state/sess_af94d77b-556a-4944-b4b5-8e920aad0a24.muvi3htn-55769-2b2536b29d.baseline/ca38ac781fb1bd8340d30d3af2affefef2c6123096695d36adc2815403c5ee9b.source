// Kultur und Erbe: Restaurierungen, Ausbauten, Themenrouten und Wunder (FACHBEREICHE.md, Abschnitt 6.1).
// Der Bestand sind die 53 Stätten aus `erbe.ts`. Die Wirkungen sind Spielparameter; Fakten stehen im Text mit Quelle
// (RECHERCHE_KONKURRENZ_FACHBEREICHE.md, Abschnitt 5). Startzustände der Stätten stehen in `STAETTEN_START`.

import { ERBE, type Erbe } from "../erbe";
import type { Vorhaben } from "../../sim/reich-typen";
import type { VorteilDef } from "./typen";
import { ortVon, stoss, stuetze } from "./bau";

/** Zustand der Stätten am Spielbeginn (0 bis 100): Spielparameter, keine Messwerte. */
export const STAETTEN_START: Record<string, number> = {
  ephesos: 74, smyrna: 40, pergamon: 70, thyatira: 30, sardes: 62, philadelphia: 33, laodikeia: 60,
  hagia_sophia: 75, suleymaniye: 86, topkapi: 82, neve_shalom: 78, phanar: 70,
  goebekli_tepe: 80, catalhoyuk: 64, arslantepe: 58, hattusa: 66, gordion: 60, troja: 72, nemrut: 68, kappadokien: 70, pamukkale: 62, aphrodisias: 70, xanthos: 56,
  aspendos: 72, zeugma: 55, myra: 56, suemela: 60, akdamar: 62, mor_gabriel: 66, petrusgrotte: 45, antakya: 22, iznik: 50, meryem_ana: 76,
  divrigi: 70, mevlana: 80, esrefoglu: 66, bursa: 74, selimiye: 84, kirkpinar: 70, ani: 42, ahlat: 45, ishak_pascha: 60, hasankeyf: 15,
  safranbolu: 68, diyarbakir: 62, mardin: 60, balikligoel: 66, hacibektas: 62, anitkabir: 88, gelibolu: 76, synagoge_edirne: 40, karahan_tepe: 55, kueltepe: 50,
};

const restaurierung = (e: Erbe): Vorhaben => {
  const gross = e.unesco.status === "welterbe";
  const antakya = e.id === "antakya";
  return {
    id: `restaurierung_${e.id}`,
    bereich: "kultur",
    klasse: "restaurierung",
    name: `Restaurierung: ${e.name}`,
    text: `Statik, Dach, Schutz vor Feuchtigkeit und Besuchern: Der Zustand von ${e.name} (${e.ort}) steigt deutlich.`,
    ort: ortVon(e.id),
    provinzen: [e.plaka],
    voraus: [{ art: "staette-max", id: e.id, max: 82, text: `${e.name} nicht schon in bestem Zustand` }],
    kosten: { pk: gross ? 3 : 2, bau: antakya ? 260 : gross ? 140 : 100, monate: gross ? 10 : 8, verwaltung: 0.5 },
    abschluss: [{ t: "staette", id: e.id, d: antakya ? 34 : 26 }, stoss("identitaet", 0.3, [e.plaka])],
    kehrseite: "Bindet Restauratoren und Baukapazität; die Stätte ist während der Arbeiten teilweise gesperrt.",
    quelle: "Spielvorhaben; Ort und Bedeutung nach RECHERCHE_KONKURRENZ_FACHBEREICHE.md, Abschnitt 5",
  };
};

const AUSBAU_STAETTEN = ["ephesos", "pergamon", "goebekli_tepe", "pamukkale", "kappadokien", "troja", "nemrut", "aphrodisias", "ani", "suemela", "mevlana", "catalhoyuk", "diyarbakir", "hagia_sophia"];

const ausbau = (e: Erbe): Vorhaben => ({
  id: `ausbau_${e.id}`,
  bereich: "kultur",
  klasse: "ausbau",
  name: `Besucherzentrum und Museum: ${e.name}`,
  text: `Besucherlenkung, Museum und Dienste in ${e.ort}: mehr Gäste, mehr Erklärung, mehr Druck auf die Stätte.`,
  ort: ortVon(e.id),
  provinzen: [e.plaka],
  voraus: [{ art: "staetten", ids: [e.id], min: 50, text: `${e.name} mindestens in Zustand 50` }],
  kosten: { pk: 3, bau: 220, monate: 14, verwaltung: 1 },
  abschluss: [{ t: "staette", id: e.id, d: 4 }, stoss("tourismus", 1.5, [e.plaka])],
  dauer: [stuetze("tourismus", 1.6, [e.plaka]), { t: "staette", id: e.id, d: -0.08 }],
  unterhalt: 0.4,
  kehrseite: "Mehr Besucher belasten die Stätte: Ihr Zustand sinkt schneller, wenn nicht restauriert wird.",
  quelle: "Spielvorhaben",
});

const RESTAURIERUNGEN: Vorhaben[] = ERBE.map(restaurierung);
const AUSBAUTEN: Vorhaben[] = AUSBAU_STAETTEN.map((id) => ausbau(ERBE.find((e) => e.id === id)!));

const serie = (
  id: string,
  name: string,
  text: string,
  stätten: string[],
  min: number,
  o: Partial<Vorhaben> & Pick<Vorhaben, "kosten" | "abschluss" | "dauer" | "kehrseite">,
): Vorhaben => ({
  id,
  bereich: "kultur",
  klasse: "serie",
  name,
  text,
  voraus: [{ art: "staetten", ids: stätten, min, text: `Alle ${stätten.length} Stätten mindestens in Zustand ${min}` }],
  einmalig: true,
  ...o,
});

const IZ = [35, 45, 20];

const SERIEN: Vorhaben[] = [
  serie(
    "serie_kirchen7",
    "Kirchenroute der Sieben",
    "Ein Pilger- und Kulturweg zu den sieben Gemeinden der Offenbarung: Ephesos, Smyrna, Pergamon, Thyatira, Sardes, Philadelphia und Laodikeia. Alle sieben liegen im Westen der Türkei.",
    ["ephesos", "smyrna", "pergamon", "thyatira", "sardes", "philadelphia", "laodikeia"],
    55,
    {
      ort: { lat: 38.5, lon: 28.0, plaka: 45, name: "Westanatolien" },
      provinzen: IZ,
      voraus: [
        { art: "staetten", ids: ["ephesos", "smyrna", "pergamon", "thyatira", "sardes", "philadelphia", "laodikeia"], min: 55, text: "Alle sieben Stätten mindestens in Zustand 55" },
        { art: "knoten", id: "vielfalt", min: 38 },
      ],
      kosten: { pk: 6, bau: 420, monate: 24, verwaltung: 1.5, schulden: 0.06 },
      abschluss: [{ t: "serie", serie: "kirchen7", d: 10 }, stoss("tourismus", 2.5, IZ), stoss("ansehen", 2), stoss("vielfalt", 3)],
      dauer: [stuetze("tourismus", 2.2, IZ), stuetze("ansehen", 1.4), stuetze("vielfalt", 1.6)],
      unterhalt: 0.8,
      kehrseite: "Pilgerströme belasten die Stätten, und ein Teil der Konservativen sieht den christlichen Schwerpunkt kritisch.",
      verlierer: "konservative",
      bild: "kirche",
      zitat: { text: "Wer Ohren hat, der höre, was der Geist den Gemeinden sagt!", von: "Offenbarung des Johannes 2,7" },
      quelle: "Offenbarung 1 bis 3; Orte: RECHERCHE_KONKURRENZ_FACHBEREICHE.md, Abschnitt 5",
    },
  ),
  serie(
    "serie_seldschuken",
    "Seldschukenroute",
    "Von Konya über Beyşehir und Divriği bis Ahlat: Moscheen, Hospitäler und Grabmale der Seldschukenzeit.",
    ["divrigi", "mevlana", "esrefoglu", "ahlat"],
    55,
    {
      ort: { lat: 38.4, lon: 37.2, plaka: 58, name: "Anatolien" },
      provinzen: [42, 58, 13],
      kosten: { pk: 4, bau: 300, monate: 18, verwaltung: 1, schulden: 0.03 },
      abschluss: [{ t: "serie", serie: "seldschuken", d: 8 }, stoss("tourismus", 1.5, [42, 58, 13]), stoss("identitaet", 1.5)],
      dauer: [stuetze("tourismus", 1.4, [42, 58, 13]), stuetze("identitaet", 1.0)],
      unterhalt: 0.5,
      kehrseite: "Die Route liegt abseits der Küsten; ohne Verkehrsanbindung kommen wenige Gäste.",
      bild: "kuppel",
      quelle: "Spielvorhaben",
    },
  ),
  serie(
    "serie_sinan",
    "Sinan-Route",
    "Süleymaniye in Istanbul und Selimiye in Edirne: zwei Meisterwerke des Baumeisters Sinan.",
    ["suleymaniye", "selimiye"],
    62,
    {
      ort: { lat: 41.35, lon: 27.6, plaka: 22, name: "Thrakien" },
      provinzen: [34, 22],
      kosten: { pk: 3, bau: 180, monate: 12, verwaltung: 0.8, schulden: 0.02 },
      abschluss: [{ t: "serie", serie: "sinan", d: 6 }, stoss("tourismus", 1.2, [34, 22]), stoss("identitaet", 1)],
      dauer: [stuetze("tourismus", 1.0, [34, 22]), stuetze("identitaet", 0.8)],
      unterhalt: 0.3,
      kehrseite: "Edirne liegt an der Grenze zu Griechenland und Bulgarien; Reisende brauchen schnelle Übergänge.",
      bild: "kuppel",
      quelle: "Spielvorhaben",
    },
  ),
  serie(
    "serie_tas_tepeler",
    "Taş-Tepeler-Route",
    "Göbekli Tepe, Karahan Tepe und Balıklıgöl: die Steinzeit, wie sie in Südostanatolien sichtbar wird.",
    ["goebekli_tepe", "karahan_tepe", "balikligoel"],
    55,
    {
      ort: { lat: 37.15, lon: 38.9, plaka: 63, name: "Şanlıurfa" },
      provinzen: [63],
      kosten: { pk: 5, bau: 340, monate: 20, verwaltung: 1.2, schulden: 0.05 },
      abschluss: [{ t: "serie", serie: "tas_tepeler", d: 9 }, stoss("tourismus", 2.4, [63]), stoss("ansehen", 1.2)],
      dauer: [stuetze("tourismus", 2.4, [63]), stuetze("ansehen", 0.8)],
      unterhalt: 0.6,
      kehrseite: "750.000 Besucher (2024) sind für Göbekli Tepe schon viel; ohne Lenkung leidet die Anlage.",
      bild: "fels",
      quelle: "dailysabah.com (Besucherzahl 2024); Stätten: RECHERCHE_KONKURRENZ_FACHBEREICHE.md",
    },
  ),
  serie(
    "serie_byzanz",
    "Byzantinische Route",
    "Hagia Sophia, Kappadokien, Myra, Sümela, İznik und der Phanar: Spuren des Ostens der Christenheit.",
    ["hagia_sophia", "kappadokien", "myra", "suemela", "iznik", "phanar"],
    52,
    {
      ort: { lat: 39.5, lon: 32.0, plaka: 50, name: "Anatolien" },
      provinzen: [34, 50, 7, 61, 16],
      kosten: { pk: 5, bau: 360, monate: 22, verwaltung: 1.3, schulden: 0.05 },
      abschluss: [{ t: "serie", serie: "byzanz", d: 8 }, stoss("tourismus", 1.8, [34, 50, 7, 61, 16]), stoss("ansehen", 1.5), stoss("vielfalt", 1.5)],
      dauer: [stuetze("tourismus", 1.6, [34, 50, 7, 61, 16]), stuetze("ansehen", 1.0), stuetze("vielfalt", 1.0)],
      unterhalt: 0.7,
      kehrseite: "Die Nutzung der Hagia Sophia bleibt ein Streitpunkt; jede Änderung an den Besuchsregeln wird politisch gelesen.",
      verlierer: "konservative",
      bild: "kuppel",
      quelle: "Spielvorhaben; Streit um die Nutzung: news.un.org/en/story/2020/07/1068151",
    },
  ),
  serie(
    "serie_vielvoelker",
    "Route der Gemeinschaften",
    "Synagogen, Klöster, Kirchen und Altstädte, in denen Juden, Armenier, Syrer und Griechen lebten und leben: Sardes, Istanbul, Akdamar, Mor Gabriel, Antakya, Mardin, Ani, Edirne.",
    ["sardes", "neve_shalom", "phanar", "akdamar", "mor_gabriel", "antakya", "ani", "mardin", "synagoge_edirne"],
    50,
    {
      ort: { lat: 38.0, lon: 38.0, plaka: 47, name: "Anatolien" },
      provinzen: [45, 34, 65, 47, 31, 36, 22],
      voraus: [
        { art: "staetten", ids: ["sardes", "neve_shalom", "phanar", "akdamar", "mor_gabriel", "antakya", "ani", "mardin", "synagoge_edirne"], min: 50, text: "Alle neun Stätten mindestens in Zustand 50" },
        { art: "massnahme", id: "m_minderheitenrechte", min: 45 },
      ],
      kosten: { pk: 8, bau: 520, monate: 30, verwaltung: 2, schulden: 0.08 },
      abschluss: [{ t: "serie", serie: "vielvoelker", d: 7 }, stoss("vielfalt", 6), stoss("ansehen", 2.5), stoss("zivilgesellschaft", 2)],
      dauer: [stuetze("vielfalt", 3), stuetze("ansehen", 1.5), stuetze("zivilgesellschaft", 1.2), stuetze("polarisierung", -1.5)],
      unterhalt: 1,
      kehrseite: "Ein Teil der Mehrheitsgesellschaft sieht die Betonung der Minderheiten mit Misstrauen; Nutzungsfragen an den Stätten werden neu verhandelt.",
      verlierer: "konservative",
      bild: "stadt",
      quelle: "Spielvorhaben",
    },
  ),
];

const WUNDER: Vorhaben[] = [
  {
    id: "wunder_ephesos",
    bereich: "kultur",
    klasse: "wunder",
    name: "Ephesos: Gesamtplan Ausgrabung und Besucherlenkung",
    text: "Ein Jahrzehnteprojekt für die Hafenstadt der Antike: Ausgrabungen, Wiederaufbau ausgewählter Bauten, Wege für Besucher und ein Museum am Fuß des Hügels. Vorbild ist das nationale Programm „Geleceğe Miras“ (Erbe für die Zukunft), das seit 2023 in Ephesos begann.",
    ort: ortVon("ephesos"),
    provinzen: [35, 9],
    voraus: [
      { art: "staetten", ids: ["ephesos"], min: 60, text: "Ephesos mindestens in Zustand 60" },
      { art: "massnahme", id: "m_archaeologie", min: 50 },
    ],
    kosten: { pk: 8, bau: 900, monate: 30, verwaltung: 2.5, schulden: 0.15 },
    abschluss: [{ t: "staette", id: "ephesos", d: 22 }, { t: "staette", id: "meryem_ana", d: 12 }, stoss("tourismus", 3, [35, 9]), stoss("ansehen", 2.5), stoss("identitaet", 1.5)],
    dauer: [stuetze("tourismus", 2.6, [35, 9]), stuetze("ansehen", 1.5), stuetze("identitaet", 1)],
    unterhalt: 1,
    kehrseite: "Ein Massenziel: Der Besucherdruck verschleißt die Stätte, und Anwohner in Selçuk klagen über Lärm und Preise.",
    verlierer: "Anwohner von Selçuk",
    einmalig: true,
    bild: "tempel",
    zitat: { text: "Groß ist die Diana der Epheser!", von: "Apostelgeschichte 19,28" },
    quelle: "turkiyetoday.com (Geleceğe Miras: 251 Grabungsstätten, über 5.000 Beschäftigte)",
  },
  {
    id: "wunder_antakya",
    bereich: "kultur",
    klasse: "wunder",
    name: "Antakya: Wiederaufbau der Altstadt",
    text: "Die Stadt, in der die Jünger zuerst Christen genannt wurden, verlor im Erdbeben 2023 den größten Teil ihrer historischen Bausubstanz. Der Wiederaufbau bringt Gassen, Kirchen, Synagoge und Moscheen zurück und öffnet das Mosaikmuseum wieder voll.",
    ort: ortVon("antakya"),
    provinzen: [31],
    voraus: [
      { art: "knoten", id: "erdbebenvorsorge", min: 40 },
      { art: "massnahme", id: "m_denkmalschutz", min: 45 },
    ],
    kosten: { pk: 10, bau: 1400, monate: 48, verwaltung: 3, schulden: 0.25 },
    abschluss: [{ t: "staette", id: "antakya", d: 55 }, { t: "staette", id: "petrusgrotte", d: 30 }, stoss("vielfalt", 4, [31]), stoss("tourismus", 3, [31]), stoss("identitaet", 2)],
    dauer: [stuetze("vielfalt", 2, [31]), stuetze("tourismus", 2.2, [31]), stuetze("identitaet", 1)],
    unterhalt: 1.2,
    kehrseite: "Wer zurückkehrt, braucht zuerst Wohnungen: Das Kulturprojekt konkurriert mit dem Wohnungsbau um Baukapazität und Verwaltungskraft.",
    verlierer: "Erdbebenüberlebende ohne Wohnung",
    einmalig: true,
    bild: "stadt",
    zitat: { text: "… dass die Jünger in Antiochia zuerst Christen genannt wurden.", von: "Apostelgeschichte 11,26" },
    quelle: "igi-global.com/gateway/chapter/373147 (über 50 Prozent der Bausubstanz verloren); Apg 11,26",
  },
  {
    id: "wunder_goebekli",
    bereich: "kultur",
    klasse: "wunder",
    name: "Göbekli Tepe: Besucherzentrum und Forschungscampus",
    text: "Die älteste bekannte Monumentalanlage der Menschheit bekommt ein Besucherzentrum mit Lenkung, ein Forschungshaus mit Werkstätten und eine Verbindung zu den Schwesterstätten des Taş-Tepeler-Projekts.",
    ort: ortVon("goebekli_tepe"),
    provinzen: [63],
    voraus: [
      { art: "staetten", ids: ["goebekli_tepe"], min: 60, text: "Göbekli Tepe mindestens in Zustand 60" },
      { art: "massnahme", id: "m_archaeologie", min: 55 },
    ],
    kosten: { pk: 7, bau: 700, monate: 26, verwaltung: 2, schulden: 0.1 },
    abschluss: [{ t: "staette", id: "goebekli_tepe", d: 15 }, { t: "staette", id: "karahan_tepe", d: 10 }, stoss("tourismus", 3.5, [63]), stoss("ansehen", 2.5), stoss("hochschule", 1.5)],
    dauer: [stuetze("tourismus", 3, [63]), stuetze("ansehen", 1.5), stuetze("identitaet", 1.5)],
    unterhalt: 0.9,
    kehrseite: "750.000 Besucher im Jahr 2024 sind schon jetzt viel; ohne Lenkung leidet die Stätte.",
    einmalig: true,
    bild: "fels",
    quelle: "dailysabah.com (Besucher 2024); Stätten: RECHERCHE_KONKURRENZ_FACHBEREICHE.md",
  },
  {
    id: "wunder_ani",
    bereich: "kultur",
    klasse: "wunder",
    name: "Ani öffnen: Grenzübergang, Museum, Wiederherstellung",
    text: "Die mittelalterliche Hauptstadt liegt unmittelbar an der Grenze zu Armenien. Ein geöffneter Übergang, ein Museum und die Sicherung der Bauten machen sie zum Ort der Verständigung, und zu einem Prüfstein der Normalisierung.",
    ort: ortVon("ani"),
    provinzen: [36],
    voraus: [
      { art: "staetten", ids: ["ani"], min: 45, text: "Ani mindestens in Zustand 45" },
      { art: "land", land: "ARM", dim: "vertrauen", min: 45 },
    ],
    kosten: { pk: 9, bau: 620, monate: 28, verwaltung: 2, schulden: 0.08 },
    abschluss: [{ t: "staette", id: "ani", d: 32 }, { t: "land", land: "ARM", dim: "vertrauen", d: 8 }, { t: "land", land: "ARM", dim: "konflikt", d: -6 }, { t: "land", land: "AZE", dim: "vertrauen", d: -4 }, stoss("tourismus", 2, [36]), stoss("ansehen", 3)],
    dauer: [stuetze("tourismus", 2, [36]), stuetze("ansehen", 1.2), stuetze("vielfalt", 1)],
    unterhalt: 0.8,
    kehrseite: "Nationalisten sehen darin ein Zugeständnis an Armenien, und Aserbaidschan achtet auf jedes Zeichen der Annäherung.",
    verlierer: "konservative",
    einmalig: true,
    bild: "tor",
    quelle: "Ani: Welterbe 2016 (whc.unesco.org); Grenzöffnung für Drittstaatler und Diplomaten vereinbart, nicht umgesetzt (turkiyetoday.com)",
  },
  {
    id: "wunder_kappadokien",
    bereich: "kultur",
    klasse: "wunder",
    name: "Kappadokien: Schutzplan für die Felslandschaft",
    text: "Begrenzung der Ballonstarts, Lenkung der Besucher und Sicherung der Felsenkirchen: Die berühmteste Landschaft der Türkei soll bleiben, was sie ist.",
    ort: ortVon("kappadokien"),
    provinzen: [50, 38],
    voraus: [{ art: "staetten", ids: ["kappadokien"], min: 55, text: "Kappadokien mindestens in Zustand 55" }],
    kosten: { pk: 6, bau: 480, monate: 22, verwaltung: 1.6, schulden: 0.06 },
    abschluss: [{ t: "staette", id: "kappadokien", d: 18 }, stoss("kulturerbe", 2, [50, 38]), stoss("ansehen", 1.5)],
    dauer: [{ t: "staette", id: "kappadokien", d: 0.1 }, stuetze("tourismus", 1.2, [50, 38]), stuetze("ansehen", 0.8)],
    unterhalt: 0.7,
    kehrseite: "Ballonbetreiber und Hotels verlieren Umsatz, wenn die Zahl der Starts begrenzt wird.",
    verlierer: "Ballonbetreiber und Hoteliers in Göreme",
    einmalig: true,
    bild: "fels",
    quelle: "Spielvorhaben; Welterbe seit 1985 (Wikipedia: List of World Heritage Sites in Turkey)",
  },
  {
    id: "programm_erbe_zukunft",
    bereich: "kultur",
    klasse: "grossprojekt",
    name: "Erbe für die Zukunft: Nationalprogramm für Grabungen und Restaurierung",
    text: "Ein Programm für hunderte Grabungsstätten und Denkmäler im ganzen Land, mit Personal, Werkstätten und Museen, nach dem Vorbild des Programms „Geleceğe Miras“ (seit 2023: 251 Grabungsstätten, über 5.000 Beschäftigte).",
    ort: { lat: 39.0, lon: 35.0, plaka: 6, name: "Türkei" },
    voraus: [
      { art: "massnahme", id: "m_archaeologie", min: 55 },
      { art: "massnahme", id: "m_denkmalschutz", min: 50 },
    ],
    kosten: { pk: 12, bau: 1800, monate: 60, verwaltung: 3.5, schulden: 0.3 },
    abschluss: [{ t: "serie", serie: "alle", d: 10 }, stoss("identitaet", 3), stoss("ansehen", 2), stoss("hochschule", 1.5)],
    dauer: [{ t: "serie", serie: "alle", d: 0.06 }, stuetze("tourismus", 1.6), stuetze("identitaet", 1.2)],
    unterhalt: 1.5,
    kehrseite: "Bindet Restauratoren und Baukapazität über Jahre; andere Bauvorhaben kommen später an die Reihe.",
    einmalig: true,
    bild: "tempel",
    quelle: "turkiyetoday.com (Geleceğe Miras)",
  },
];

export const KULTUR_VORHABEN: Vorhaben[] = [...WUNDER, ...SERIEN, ...AUSBAUTEN, ...RESTAURIERUNGEN];

export const KULTUR_VORTEILE: VorteilDef[] = [
  {
    id: "v_kulturnation",
    bereich: "kultur",
    name: "Kulturnation",
    text: "Ein gepflegtes Erbe und ein starker Zusammenhalt machen das Land zu einem Ziel und zu einem Vorbild.",
    voraus: [{ art: "knoten", id: "kulturerbe", min: 62 }, { art: "knoten", id: "identitaet", min: 58 }],
    dauer: [stuetze("ansehen", 1.5), stuetze("tourismus", 1.5)],
    kehrseite: "Der Vorteil hält nur, solange gepflegt wird: Lässt der Erhalt nach, ist er verloren.",
  },
  {
    id: "v_land_der_vielfalt",
    bereich: "kultur",
    name: "Land der Vielfalt",
    text: "Minderheiten sind sichtbar und anerkannt; Gemeinden gründen Vereine, und Partner in Europa schauen anders auf das Land.",
    voraus: [{ art: "knoten", id: "vielfalt", min: 55 }],
    dauer: [stuetze("beziehungen_eu", 2), stuetze("zivilgesellschaft", 2), stuetze("polarisierung", -2), stuetze("konservative", -1.5)],
    kehrseite: "Konservative Wähler sehen ihre Mehrheitskultur relativiert.",
  },
];

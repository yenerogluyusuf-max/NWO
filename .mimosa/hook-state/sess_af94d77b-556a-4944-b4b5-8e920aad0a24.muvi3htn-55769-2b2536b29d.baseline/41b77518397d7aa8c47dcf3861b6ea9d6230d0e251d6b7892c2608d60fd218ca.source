// Kultur- und Erbestätten der Türkei: der Bestand des Kulturbereichs.
// Koordinaten: Wikipedia-Artikelwerte, gegengeprüft mit Wikidata P625 (Recherche vom 30.09.2026, RECHERCHE_KONKURRENZ_FACHBEREICHE.md, Abschnitt 5).
// `ungefaehr` heißt: Die Quellen weichen um mehr als etwa 300 m ab, oder der Wert ist ein Stadtmittelpunkt statt der Ruine.
// Die Bedeutungssätze und die Provinzzuordnung sind Allgemeinwissen und vor einer Veröffentlichung zu belegen.
// Welterbe: nur Stätten, die die Liste der UNESCO nennt (Stand Sardes 2025); „tentativ“ = Tentativliste.

export type Bezug = "antik" | "fruehmenschlich" | "christlich" | "juedisch" | "armenisch" | "syrisch" | "islamisch" | "alevitisch" | "republik" | "natur";

export interface Erbe {
  id: string;
  name: string;
  ort: string;
  /** Kfz-Kennziffer der Provinz */
  plaka: number;
  lat: number;
  lon: number;
  epoche: string;
  bezug: Bezug[];
  unesco: { status: "welterbe" | "tentativ" | "nein"; jahr?: number };
  satz: string;
  ungefaehr?: boolean;
  /** Die sieben Kirchen der Offenbarung (Offenbarung 2 und 3) */
  kirche7?: boolean;
  /** Serien, zu denen die Stätte gehört (Pilgerrouten und Themenwege) */
  serien?: ("kirchen7" | "seldschuken" | "sinan" | "tas_tepeler" | "byzanz" | "vielvoelker")[];
}

const W = (jahr: number) => ({ status: "welterbe" as const, jahr });
const T = { status: "tentativ" as const };
const N = { status: "nein" as const };

export const ERBE: Erbe[] = [
  { id: "ephesos", name: "Ephesos", ort: "Selçuk", plaka: 35, lat: 37.941, lon: 27.342, epoche: "antik, christlich", bezug: ["antik", "christlich"], unesco: W(2015), satz: "Hafenmetropole der Antike, Wirkungsort des Johannes, Ort der Marienverehrung.", kirche7: true, serien: ["kirchen7"] },
  { id: "smyrna", name: "Smyrna (Agora)", ort: "İzmir", plaka: 35, lat: 38.419, lon: 27.138, epoche: "antik, christlich", bezug: ["antik", "christlich"], unesco: T, satz: "Die Kirche von Smyrna liegt unter einer lebenden Großstadt.", kirche7: true, serien: ["kirchen7"] },
  { id: "pergamon", name: "Pergamon", ort: "Bergama", plaka: 35, lat: 39.133, lon: 27.184, epoche: "antik, christlich", bezug: ["antik", "christlich"], unesco: W(2014), satz: "Altar, Bibliothek und „Thron des Satans“ der Offenbarung.", ungefaehr: true, kirche7: true, serien: ["kirchen7"] },
  { id: "thyatira", name: "Thyatira", ort: "Akhisar", plaka: 45, lat: 38.92, lon: 27.836, epoche: "antik, christlich", bezug: ["antik", "christlich"], unesco: N, satz: "Ruinen mitten im Stadtzentrum.", ungefaehr: true, kirche7: true, serien: ["kirchen7"] },
  { id: "sardes", name: "Sardes", ort: "Sart", plaka: 45, lat: 38.488, lon: 28.04, epoche: "antik, jüdisch, christlich", bezug: ["antik", "juedisch", "christlich"], unesco: W(2025), satz: "Hauptstadt der Lyder mit Artemistempel und einer der größten antiken Synagogen.", kirche7: true, serien: ["kirchen7", "vielvoelker"] },
  { id: "philadelphia", name: "Philadelphia", ort: "Alaşehir", plaka: 45, lat: 38.35, lon: 28.517, epoche: "antik, christlich", bezug: ["antik", "christlich"], unesco: N, satz: "Stadtmittelpunkt; eine Säule der Johannesbasilika steht noch.", ungefaehr: true, kirche7: true, serien: ["kirchen7"] },
  { id: "laodikeia", name: "Laodikeia", ort: "bei Denizli", plaka: 20, lat: 37.836, lon: 29.108, epoche: "antik, christlich", bezug: ["antik", "christlich"], unesco: T, satz: "Laufende Ausgrabung einer reichen Handelsstadt.", kirche7: true, serien: ["kirchen7"] },
  { id: "hagia_sophia", name: "Hagia Sophia", ort: "İstanbul", plaka: 34, lat: 41.008, lon: 28.98, epoche: "byzantinisch, osmanisch", bezug: ["christlich", "islamisch"], unesco: W(1985), satz: "Kirche, Moschee, Museum, wieder Moschee: Nutzungsstreit seit 2020.", serien: ["byzanz"] },
  { id: "suleymaniye", name: "Süleymaniye-Moschee", ort: "İstanbul", plaka: 34, lat: 41.016, lon: 28.964, epoche: "osmanisch", bezug: ["islamisch"], unesco: W(1985), satz: "Sinans Moschee für Süleyman.", serien: ["sinan"] },
  { id: "topkapi", name: "Topkapı-Palast", ort: "İstanbul", plaka: 34, lat: 41.013, lon: 28.984, epoche: "osmanisch", bezug: ["islamisch"], unesco: W(1985), satz: "Sultanssitz und Staatsschatz." },
  { id: "neve_shalom", name: "Neve-Shalom-Synagoge", ort: "İstanbul", plaka: 34, lat: 41.027, lon: 28.972, epoche: "jüdisch", bezug: ["juedisch"], unesco: N, satz: "Zentrum der jüdischen Gemeinde Istanbuls.", serien: ["vielvoelker"] },
  { id: "phanar", name: "Phanar (Ökumenisches Patriarchat)", ort: "İstanbul", plaka: 34, lat: 41.029, lon: 28.952, epoche: "byzantinisch, christlich", bezug: ["christlich"], unesco: N, satz: "Sitz des Ökumenischen Patriarchen.", serien: ["byzanz", "vielvoelker"] },
  { id: "goebekli_tepe", name: "Göbekli Tepe", ort: "Şanlıurfa", plaka: 63, lat: 37.223, lon: 38.922, epoche: "frühmenschlich", bezug: ["fruehmenschlich"], unesco: W(2018), satz: "Älteste bekannte Monumentalanlage der Menschheit; 750.000 Besucher 2024.", serien: ["tas_tepeler"] },
  { id: "catalhoyuk", name: "Çatalhöyük", ort: "Çumra", plaka: 42, lat: 37.667, lon: 32.828, epoche: "frühmenschlich", bezug: ["fruehmenschlich"], unesco: W(2012), satz: "Neolithische Großsiedlung." },
  { id: "arslantepe", name: "Arslantepe", ort: "Malatya", plaka: 44, lat: 38.382, lon: 38.361, epoche: "Bronzezeit", bezug: ["antik"], unesco: W(2021), satz: "Frühe Staatlichkeit mit Palast." },
  { id: "hattusa", name: "Hattuša", ort: "Boğazkale", plaka: 19, lat: 40.02, lon: 34.615, epoche: "hethitisch", bezug: ["antik"], unesco: W(1986), satz: "Hauptstadt der Hethiter, Löwentor." },
  { id: "gordion", name: "Gordion", ort: "Polatlı", plaka: 6, lat: 39.65, lon: 31.978, epoche: "phrygisch", bezug: ["antik"], unesco: W(2023), satz: "Midas-Tumulus." },
  { id: "troja", name: "Troja", ort: "Tevfikiye", plaka: 17, lat: 39.958, lon: 26.239, epoche: "antik", bezug: ["antik"], unesco: W(1998), satz: "Homers Troja mit mehreren Siedlungsschichten." },
  { id: "nemrut", name: "Nemrut Dağı", ort: "Adıyaman", plaka: 2, lat: 37.981, lon: 38.741, epoche: "antik (Kommagene)", bezug: ["antik"], unesco: W(1987), satz: "Kolossalstatuen und Königsgrab auf dem Gipfel." },
  { id: "kappadokien", name: "Göreme und Kappadokien", ort: "Göreme", plaka: 50, lat: 38.643, lon: 34.829, epoche: "byzantinisch, Naturerbe", bezug: ["christlich", "natur"], unesco: W(1985), satz: "Felsenkirchen und Feenkamine; Ballontourismus.", serien: ["byzanz"] },
  { id: "pamukkale", name: "Hierapolis und Pamukkale", ort: "Pamukkale", plaka: 20, lat: 37.925, lon: 29.126, epoche: "antik, Naturerbe", bezug: ["antik", "natur"], unesco: W(1988), satz: "Sinterterrassen und Nekropole; Massentourismus belastet die Terrassen." },
  { id: "aphrodisias", name: "Aphrodisias", ort: "Geyre", plaka: 9, lat: 37.708, lon: 28.724, epoche: "antik", bezug: ["antik"], unesco: W(2017), satz: "Marmor und Bildhauerschule." },
  { id: "xanthos", name: "Xanthos und Letoon", ort: "Kınık", plaka: 7, lat: 36.356, lon: 29.319, epoche: "lykisch", bezug: ["antik"], unesco: W(1988), satz: "Hauptstadt Lykiens mit Inschriften." },
  { id: "aspendos", name: "Aspendos", ort: "Serik", plaka: 7, lat: 36.939, lon: 31.172, epoche: "antik (römisch)", bezug: ["antik"], unesco: T, satz: "Römisches Theater, fast unversehrt." },
  { id: "zeugma", name: "Zeugma", ort: "Nizip", plaka: 27, lat: 37.059, lon: 37.866, epoche: "antik", bezug: ["antik"], unesco: T, satz: "Mosaike am Euphrat." },
  { id: "myra", name: "Myra (Nikolauskirche)", ort: "Demre", plaka: 7, lat: 36.245, lon: 29.985, epoche: "byzantinisch, christlich", bezug: ["christlich"], unesco: T, satz: "Nikolaus von Myra, Pilgerziel.", serien: ["byzanz"] },
  { id: "suemela", name: "Sümela-Kloster", ort: "Maçka", plaka: 61, lat: 40.69, lon: 39.658, epoche: "byzantinisch", bezug: ["christlich"], unesco: T, satz: "Felsenkloster der Muttergottes.", serien: ["byzanz"] },
  { id: "akdamar", name: "Akdamar-Kirche", ort: "Gevaş", plaka: 65, lat: 38.34, lon: 43.037, epoche: "armenisch, mittelalterlich", bezug: ["christlich", "armenisch"], unesco: T, satz: "Reliefkirche auf einer Insel im Vansee.", serien: ["vielvoelker"] },
  { id: "mor_gabriel", name: "Mor-Gabriel-Kloster", ort: "Midyat", plaka: 47, lat: 37.322, lon: 41.539, epoche: "christlich (syrisch)", bezug: ["christlich", "syrisch"], unesco: T, satz: "Syrisch-orthodoxes Kloster.", serien: ["vielvoelker"] },
  { id: "petrusgrotte", name: "Petrus-Grotte", ort: "Antakya", plaka: 31, lat: 36.209, lon: 36.178, epoche: "christlich", bezug: ["christlich"], unesco: T, satz: "Frühe Christengemeinde von Antiochia." },
  { id: "antakya", name: "Antakya (Altstadt und Mosaikmuseum)", ort: "Antakya", plaka: 31, lat: 36.203, lon: 36.161, epoche: "antik, vielfältig", bezug: ["antik", "christlich", "juedisch", "islamisch"], unesco: N, satz: "Mosaikmuseum und Vielvölkerstadt; im Erdbeben 2023 schwer getroffen.", serien: ["vielvoelker"] },
  { id: "iznik", name: "İznik (Nicäa)", ort: "İznik", plaka: 16, lat: 40.429, lon: 29.72, epoche: "byzantinisch, osmanisch", bezug: ["christlich", "islamisch"], unesco: T, satz: "Konzilsstadt und Stadt der Fliesen.", serien: ["byzanz"] },
  { id: "meryem_ana", name: "Meryem Ana Evi", ort: "Selçuk", plaka: 35, lat: 37.912, lon: 27.334, epoche: "christlich, islamisch", bezug: ["christlich", "islamisch"], unesco: N, satz: "Gemeinsamer Pilgerort bei Ephesos." },
  { id: "divrigi", name: "Große Moschee und Hospital von Divriği", ort: "Divriği", plaka: 58, lat: 39.371, lon: 38.122, epoche: "seldschukisch", bezug: ["islamisch"], unesco: W(1985), satz: "Portalplastik und Moschee mit Heilhaus.", serien: ["seldschuken"] },
  { id: "mevlana", name: "Mevlana-Museum", ort: "Konya", plaka: 42, lat: 37.871, lon: 32.505, epoche: "seldschukisch, lebende Kultur", bezug: ["islamisch"], unesco: T, satz: "Rumi-Grab und Derwischtanz (Sema, immaterielles Erbe 2008).", serien: ["seldschuken"] },
  { id: "esrefoglu", name: "Eşrefoğlu-Moschee", ort: "Beyşehir", plaka: 42, lat: 37.683, lon: 31.72, epoche: "seldschukisch", bezug: ["islamisch"], unesco: W(2023), satz: "Holzsäulenmoschee (Serie der Holzsäulenmoscheen).", serien: ["seldschuken"] },
  { id: "bursa", name: "Bursa und Cumalıkızık", ort: "Bursa", plaka: 16, lat: 40.185, lon: 29.062, epoche: "osmanisch", bezug: ["islamisch"], unesco: W(2014), satz: "Wiege des Osmanischen Reichs." },
  { id: "selimiye", name: "Selimiye-Moschee", ort: "Edirne", plaka: 22, lat: 41.678, lon: 26.559, epoche: "osmanisch", bezug: ["islamisch"], unesco: W(2011), satz: "Sinans Meisterwerk (Überlieferung).", serien: ["sinan"] },
  { id: "kirkpinar", name: "Kırkpınar (Sarayiçi)", ort: "Edirne", plaka: 22, lat: 41.691, lon: 26.555, epoche: "lebende Kultur", bezug: ["islamisch"], unesco: N, satz: "Ölringen-Fest, immaterielles Erbe 2010.", ungefaehr: true },
  { id: "ani", name: "Ani", ort: "Ocaklı", plaka: 36, lat: 40.508, lon: 43.573, epoche: "armenisch, seldschukisch", bezug: ["armenisch", "christlich", "islamisch"], unesco: W(2016), satz: "Mittelalterliche Hauptstadt an der Grenze zu Armenien.", serien: ["vielvoelker"] },
  { id: "ahlat", name: "Ahlat", ort: "Ahlat", plaka: 13, lat: 38.753, lon: 42.494, epoche: "seldschukisch", bezug: ["islamisch"], unesco: T, satz: "Grabsteine und Steinmetzkunst.", ungefaehr: true, serien: ["seldschuken"] },
  { id: "ishak_pascha", name: "İshak-Pascha-Palast", ort: "Doğubayazıt", plaka: 4, lat: 39.52, lon: 44.129, epoche: "osmanisch", bezug: ["islamisch"], unesco: T, satz: "Palast am Ararat." },
  { id: "hasankeyf", name: "Hasankeyf", ort: "Hasankeyf", plaka: 72, lat: 37.715, lon: 41.413, epoche: "mittelalterlich", bezug: ["islamisch"], unesco: N, satz: "2020 vom Ilısu-Stausee überflutet, Teile versetzt.", ungefaehr: true },
  { id: "safranbolu", name: "Safranbolu", ort: "Safranbolu", plaka: 78, lat: 41.249, lon: 32.683, epoche: "osmanisch", bezug: ["islamisch"], unesco: W(1994), satz: "Fachwerk-Handelsstadt." },
  { id: "diyarbakir", name: "Festung Diyarbakır und Hevsel-Gärten", ort: "Diyarbakır", plaka: 21, lat: 37.911, lon: 40.227, epoche: "römisch bis islamisch", bezug: ["islamisch", "antik"], unesco: W(2015), satz: "Basaltmauern und Gärten am Tigris." },
  { id: "mardin", name: "Mardin", ort: "Mardin", plaka: 47, lat: 37.313, lon: 40.735, epoche: "Vielvölker, syrisch", bezug: ["syrisch", "christlich", "islamisch"], unesco: T, satz: "Steinstadt der Vielfalt.", serien: ["vielvoelker"] },
  { id: "balikligoel", name: "Balıklıgöl", ort: "Şanlıurfa", plaka: 63, lat: 37.148, lon: 38.784, epoche: "Abraham-Tradition", bezug: ["islamisch", "christlich", "juedisch"], unesco: T, satz: "Pilgerort mit dem Heiligen Karpfenteich.", serien: ["tas_tepeler"] },
  { id: "hacibektas", name: "Hacıbektaş-Komplex", ort: "Hacıbektaş", plaka: 50, lat: 38.944, lon: 34.56, epoche: "Alevi-Bektaşi, lebende Kultur", bezug: ["alevitisch"], unesco: T, satz: "Zentrum der Alevi-Tradition.", ungefaehr: true },
  { id: "anitkabir", name: "Anıtkabir", ort: "Ankara", plaka: 6, lat: 39.926, lon: 32.838, epoche: "republikanisch", bezug: ["republik"], unesco: N, satz: "Atatürk-Mausoleum; Ort der nationalen Identität." },
  { id: "gelibolu", name: "Gelibolu (Gallipoli)", ort: "Eceabat", plaka: 17, lat: 40.17, lon: 26.368, epoche: "Erinnerungsort 1915", bezug: ["republik"], unesco: T, satz: "Gründungsmythos und Besuchsziel der ANZAC-Gäste.", ungefaehr: true },
  { id: "synagoge_edirne", name: "Große Synagoge von Edirne", ort: "Edirne", plaka: 22, lat: 41.672, lon: 26.552, epoche: "jüdisch", bezug: ["juedisch"], unesco: N, satz: "Minderheitenerbe der Grenzstadt.", serien: ["vielvoelker"] },
  { id: "karahan_tepe", name: "Karahan Tepe", ort: "Şanlıurfa", plaka: 63, lat: 37.093, lon: 39.304, epoche: "frühmenschlich", bezug: ["fruehmenschlich"], unesco: N, satz: "Schwesterstätte von Göbekli Tepe (Taş-Tepeler-Projekt).", serien: ["tas_tepeler"] },
  { id: "kueltepe", name: "Kültepe-Kaniş", ort: "Kayseri", plaka: 38, lat: 38.85, lon: 35.633, epoche: "Bronzezeit", bezug: ["antik"], unesco: T, satz: "Assyrische Handelskolonie mit Keilschrifttafeln." },
];

export const ERBE_NACH_ID: Record<string, Erbe> = Object.fromEntries(ERBE.map((e) => [e.id, e]));

export const KIRCHEN_DER_OFFENBARUNG: Erbe[] = ERBE.filter((e) => e.kirche7);

// Militär-, Ausrüstungs- und Schauplatzdaten für strategische Konflikte.
// Vorbild: Hearts of Iron IV Divisions-Vorlagen, Doktrin-Pfade und Theater-Regionen.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

export type AusruestungsKategorie =
  | "infanterie"
  | "gepanzert"
  | "drohnen"
  | "luftwaffe"
  | "marine"
  | "flugabwehr";

export interface AusruestungsGen {
  id: string;
  kategorie: AusruestungsKategorie;
  generation: 1 | 2 | 3;
  name: string;
  nameTr: string;
  nameEn: string;
  angriffswert: number;
  verteidigungswert: number;
  herstellungskosten: number; // in Industrie-Kapazität / Monat
  benoetigtTech?: string;
  beschreibung: string;
}

export const AUSRUESTUNGS_GENERATIONEN: AusruestungsGen[] = [
  // Infanterie
  {
    id: "ausr_inf_1",
    kategorie: "infanterie",
    generation: 1,
    name: "Standard-Infanteriewaffen (G3 / MPT-76 Gen 1)",
    nameTr: "Standart Piyade Tüfekleri (MPT-76)",
    nameEn: "Standard Infantry Rifles (MPT-76)",
    angriffswert: 10,
    verteidigungswert: 12,
    herstellungskosten: 2,
    beschreibung: "Solides Infanteriegewehr im Kaliber 7.62mm, hohe Durchschlagskraft.",
  },
  {
    id: "ausr_inf_2",
    kategorie: "infanterie",
    generation: 2,
    name: "Modernisierte Infanterieausrüstung (MPT-76MH & Wärmebild)",
    nameTr: "Modernize Piyade Donanımı (Hafif MPT & Termal Dürbün)",
    nameEn: "Modernized Infantry Kit (Lightweight MPT & Thermal Optics)",
    angriffswert: 16,
    verteidigungswert: 18,
    herstellungskosten: 4,
    beschreibung: "Gewichtsreduzierte Sturmgewehre mit vernetzter Nachtsicht und ballistischer Keramik.",
  },
  {
    id: "ausr_inf_3",
    kategorie: "infanterie",
    generation: 3,
    name: "Smart-Infanteriesystem (Exoskelett & HUD)",
    nameTr: "Akıllı Asker Sistemi (CENKER Exoskeleton)",
    nameEn: "Future Soldier Integrated Combat Suite",
    angriffswert: 25,
    verteidigungswert: 28,
    herstellungskosten: 8,
    benoetigtTech: "tech_ki_grundlagen",
    beschreibung: "Exoskelette für Gebirgsjäger, biometrische Sensoren und direkte Drohnensteuerung am Helm.",
  },

  // Gepanzerte Fahrzeuge
  {
    id: "ausr_panzer_1",
    kategorie: "gepanzert",
    generation: 1,
    name: "Kampfwagen Leopard 2A4 / M60T Fırat",
    nameTr: "Modernize M60T Fırat ve Leopard 2A4",
    nameEn: "Leopard 2A4 & M60T Modernized Armor",
    angriffswert: 24,
    verteidigungswert: 26,
    herstellungskosten: 8,
    beschreibung: "Kampfwertgesteigerte NATO-Panzer mit Pulat-Abstandsaktivem Schutzsystem.",
  },
  {
    id: "ausr_panzer_2",
    kategorie: "gepanzert",
    generation: 2,
    name: "Hauptkampfpanzer Altay T1",
    nameTr: "Milli Ana Muharebe Tankı Altay T1",
    nameEn: "Altay T1 Main Battle Tank",
    angriffswert: 38,
    verteidigungswert: 40,
    herstellungskosten: 16,
    beschreibung: "Moderner Kampfpanzer mit inländischer Verbundpanzerung und Akkor-Schutzsystem.",
  },
  {
    id: "ausr_panzer_3",
    kategorie: "gepanzert",
    generation: 3,
    name: "Altay T2 mit unbemanntem Turm & Drohnenglas",
    nameTr: "İnsansız Kuleli Altay T2 ve Otonom Zırhlılar",
    nameEn: "Altay T2 Unmanned Turret & Autonomous Armor",
    angriffswert: 55,
    verteidigungswert: 52,
    herstellungskosten: 24,
    benoetigtTech: "tech_ki_llm",
    beschreibung: "Unbemannter Geschützturm, 360-Grad-Sensoren und autonome Begleitpanzer.",
  },

  // Drohnen
  {
    id: "ausr_drohnen_1",
    kategorie: "drohnen",
    generation: 1,
    name: "Taktische Aufklärungs- und Kampfdrohne TB2",
    nameTr: "Bayraktar TB2 Taktik SİHA",
    nameEn: "Bayraktar TB2 Tactical UCAV",
    angriffswert: 20,
    verteidigungswert: 8,
    herstellungskosten: 5,
    beschreibung: "Kostengünstige Präzisionsdrohne für LASER-gelenkte MAM-L-Munition.",
  },
  {
    id: "ausr_drohnen_2",
    kategorie: "drohnen",
    generation: 2,
    name: "Schwere Kampfdrohne Akıncı & Aksungur",
    nameTr: "Bayraktar Akıncı ve Aksungur Ağır SİHA",
    nameEn: "Akıncı & Aksungur Heavy Strategic UCAV",
    angriffswert: 35,
    verteidigungswert: 14,
    herstellungskosten: 12,
    beschreibung: "Doppeltriebwerkige Plattform für Marschflugkörper SOM und AESA-Radar.",
  },
  {
    id: "ausr_drohnen_3",
    kategorie: "drohnen",
    generation: 3,
    name: "Tarnkappen-Kampfjet Kızılelma & ANKA-3",
    nameTr: "Kızılelma ve ANKA-3 İnsansız Hayalet Savaş Uçağı",
    nameEn: "Kızılelma & ANKA-3 Stealth Combat Drones",
    angriffswert: 58,
    verteidigungswert: 30,
    herstellungskosten: 22,
    benoetigtTech: "tech_turbofan_jet",
    beschreibung: "Überschallfähige Tarnkappenjets für Luftkampf und autonome Schwarmformationen.",
  },
];

export interface DivisionsVorlage {
  id: string;
  name: string;
  nameTr: string;
  nameEn: string;
  rolle: "front" | "verteidigung" | "schnell" | "gebirge" | "spezial";
  feuerkraft: number;
  organisation: number;
  panzerung: number;
  mobilitaet: number;
  nachschubBedarf: number;
  gelaendeBoni: {
    ebene: number;
    gebirge: number;
    stadt: number;
    kueste: number;
  };
  symbol: string;
}

export const DIVISIONS_VORLAGEN: DivisionsVorlage[] = [
  {
    id: "div_mekanize",
    name: "Mechanisierte Infanterie-Brigade",
    nameTr: "Mekanize Piyade Tugayı",
    nameEn: "Mechanized Infantry Brigade",
    rolle: "front",
    feuerkraft: 35,
    organisation: 60,
    panzerung: 25,
    mobilitaet: 30,
    nachschubBedarf: 15,
    gelaendeBoni: { ebene: 1.2, gebirge: 0.8, stadt: 1.0, kueste: 0.9 },
    symbol: "infantry",
  },
  {
    id: "div_zirhli",
    name: "Gepanzerte Brigade (Panzerdivision)",
    nameTr: "Zırhlı Tugay (Tank Tümeni)",
    nameEn: "Armored Brigade",
    rolle: "schnell",
    feuerkraft: 55,
    organisation: 45,
    panzerung: 50,
    mobilitaet: 40,
    nachschubBedarf: 28,
    gelaendeBoni: { ebene: 1.4, gebirge: 0.5, stadt: 0.7, kueste: 0.8 },
    symbol: "tank",
  },
  {
    id: "div_komando",
    name: "Kommando- und Gebirgsjäger-Brigade",
    nameTr: "Dağ Komando Tugayı",
    nameEn: "Mountain Commando Brigade",
    rolle: "gebirge",
    feuerkraft: 30,
    organisation: 75,
    panzerung: 10,
    mobilitaet: 25,
    nachschubBedarf: 10,
    gelaendeBoni: { ebene: 0.9, gebirge: 1.5, stadt: 1.2, kueste: 1.0 },
    symbol: "mountain",
  },
  {
    id: "div_iha_artillerie",
    name: "Drohnen- & Raketenartillerie-Brigade",
    nameTr: "İHA ve Füze Topçu Tugayı",
    nameEn: "UAV & Rocket Artillery Brigade",
    rolle: "spezial",
    feuerkraft: 65,
    organisation: 40,
    panzerung: 15,
    mobilitaet: 20,
    nachschubBedarf: 22,
    gelaendeBoni: { ebene: 1.3, gebirge: 1.1, stadt: 0.9, kueste: 1.1 },
    symbol: "crosshair",
  },
  {
    id: "div_amfibi",
    name: "Amphibische Marineinfanterie-Brigade",
    nameTr: "Amfibi Deniz Piyade Tugayı",
    nameEn: "Amphibious Marine Brigade",
    rolle: "spezial",
    feuerkraft: 32,
    organisation: 65,
    panzerung: 18,
    mobilitaet: 25,
    nachschubBedarf: 14,
    gelaendeBoni: { ebene: 1.0, gebirge: 0.9, stadt: 1.1, kueste: 1.6 },
    symbol: "anchor",
  },
];

export interface MilitaerDoktrin {
  id: string;
  baum: "tiefenangriff" | "asymmetrisch" | "festung" | "mavi_vatan";
  name: string;
  nameTr: string;
  nameEn: string;
  text: string;
  textTr: string;
  textEn: string;
  boni: {
    angriffMod: number;
    verteidigungMod: number;
    nachschubMod: number;
    luftUeberlegenheitMod: number;
  };
}

export const MILITAER_DOKTRINEN: MilitaerDoktrin[] = [
  {
    id: "doktrin_tiefenangriff",
    baum: "tiefenangriff",
    name: "Vernetzter Tiefenangriff",
    nameTr: "Ağ Merkezli Derin Darbe Doktrini",
    nameEn: "Networked Deep Strike Doctrine",
    text: "Echtzeit-Verbindung von Drohnen, Artillerie und mechanisierten Verbänden zur Zerschlagung gegnerischer Kommandoposten.",
    textTr: "İHA, topçu ve zırhlı birliklerin tek ağda birleşerek düşman komuta kademesini anında imha etmesi.",
    textEn: "Unified real-time sensor-to-shooter loop decimating hostile command and logistics nodes.",
    boni: { angriffMod: 0.25, verteidigungMod: 0.05, nachschubMod: -0.1, luftUeberlegenheitMod: 0.2 },
  },
  {
    id: "doktrin_asymmetrisch",
    baum: "asymmetrisch",
    name: "Autonome Schwarmkriegführung",
    nameTr: "Otonom Sürü ve Yıpratma Doktrini",
    nameEn: "Autonomous Swarm & Attrition Doctrine",
    text: "Massenhafter Einsatz billiger Kamikaze-Drohnen überlastet feindliche Flugabwehrraketen.",
    textTr: "Düşman pahalı hava savunmasını ucuz kamikaze dron sürüleriyle doyuma ulaştırma stratejisi.",
    textEn: "Overwhelming adversary air defense envelopes via saturated low-cost loitering munition waves.",
    boni: { angriffMod: 0.2, verteidigungMod: 0.15, nachschubMod: -0.2, luftUeberlegenheitMod: 0.15 },
  },
  {
    id: "doktrin_festung",
    baum: "festung",
    name: "Integrierte Luftraumverweigerung",
    nameTr: "Çelik Hat ve Hava İnkarcılığı",
    nameEn: "Integrated Anti-Access & Area Denial (A2/AD)",
    text: "Mehrschichtige Flugabwehr und befestigte Grenzbunker machen gegnerische Durchbrüche unbezahlbar.",
    textTr: "Katmanlı hava savunma bataryaları ve beton sığınaklarla sınır boyunda geçilmez kale oluşturulması.",
    textEn: "Multi-layered SAM missile umbrellas and fortified border bastions halting enemy offensive momentum.",
    boni: { angriffMod: -0.05, verteidigungMod: 0.35, nachschubMod: -0.15, luftUeberlegenheitMod: 0.25 },
  },
  {
    id: "doktrin_mavi_vatan",
    baum: "mavi_vatan",
    name: "Mavi Vatan Kontroll- & Riegel-Doktrin",
    nameTr: "Mavi Vatan Deniz Kontrolü ve Boğazlar Kilidi",
    nameEn: "Blue Homeland Sea Denial & Chokepoint Control",
    text: "Vollständige Sperrung der Meerengen und Unterwasser-Sensorketten sichern die maritimen Handelswege.",
    textTr: "Türk Boğazlarının kilitlenmesi ve denizaltı devriyeleriyle açık deniz geçiş üstünlüğü kurulması.",
    textEn: "Complete closure of strategic straits and AIP submarine barriers securing maritime sea lines of communication.",
    boni: { angriffMod: 0.15, verteidigungMod: 0.2, nachschubMod: 0.05, luftUeberlegenheitMod: 0.1 },
  },
];

export interface SchauplatzRegion {
  id: string;
  theater: "syrien" | "irak" | "aegaeis" | "zypern" | "kaukasus" | "iran";
  name: string;
  nameTr: string;
  nameEn: string;
  provinzenAnzahl: number;
  gelaende: "ebene" | "gebirge" | "stadt" | "kueste";
  nachbarTuerkei: boolean;
  strategischerWert: number; // 1..10
}

export const SCHAUPLATZ_REGIONEN: SchauplatzRegion[] = [
  // Syrien
  { id: "reg_syr_aleppo", theater: "syrien", name: "Aleppo (Haleb)", nameTr: "Halep", nameEn: "Aleppo", provinzenAnzahl: 3, gelaende: "stadt", nachbarTuerkei: true, strategischerWert: 9 },
  { id: "reg_syr_idlib", theater: "syrien", name: "Idlib", nameTr: "İdlib", nameEn: "Idlib", provinzenAnzahl: 2, gelaende: "ebene", nachbarTuerkei: true, strategischerWert: 8 },
  { id: "reg_syr_afrin", theater: "syrien", name: "Afrin & Nordkorridor", nameTr: "Afrin ve Fırat Kalkanı Bölgesi", nameEn: "Afrin & Euphrates Shield Zone", provinzenAnzahl: 2, gelaende: "gebirge", nachbarTuerkei: true, strategischerWert: 8 },
  { id: "reg_syr_rojava", theater: "syrien", name: "Nordost-Syrien (Hasaka / Qamishli)", nameTr: "Kamışlı ve Haseke Koridoru", nameEn: "Northeast Syria (Qamishli/Hasakah)", provinzenAnzahl: 3, gelaende: "ebene", nachbarTuerkei: true, strategischerWert: 7 },
  { id: "reg_syr_damaskus", theater: "syrien", name: "Damaskus Zentralregion", nameTr: "Şam ve Güney Suriye", nameEn: "Damascus Central Sector", provinzenAnzahl: 4, gelaende: "stadt", nachbarTuerkei: false, strategischerWert: 10 },

  // Irak
  { id: "reg_irq_erbil", theater: "irak", name: "Erbil & Dohuk (Kurdistan)", nameTr: "Erbil ve Duhok Hattı", nameEn: "Erbil & Dohuk Sector", provinzenAnzahl: 3, gelaende: "gebirge", nachbarTuerkei: true, strategischerWert: 8 },
  { id: "reg_irq_qandil", theater: "irak", name: "Qandil-Gebirge", nameTr: "Kandil Dağları Güvenlik Hattı", nameEn: "Qandil Mountain Redoubt", provinzenAnzahl: 2, gelaende: "gebirge", nachbarTuerkei: true, strategischerWert: 9 },
  { id: "reg_irq_mosul", theater: "irak", name: "Mossul & Ninive", nameTr: "Musul ve Ninova Havzası", nameEn: "Mosul & Nineveh Plains", provinzenAnzahl: 3, gelaende: "ebene", nachbarTuerkei: false, strategischerWert: 7 },
  { id: "reg_irq_kirkuk", theater: "irak", name: "Kirkuk Ölfelder", nameTr: "Kerkük Petrol Havzası", nameEn: "Kirkuk Oil Fields", provinzenAnzahl: 2, gelaende: "ebene", nachbarTuerkei: false, strategischerWert: 9 },

  // Ägäis & Griechenland
  { id: "reg_aeg_evros", theater: "aegaeis", name: "Thrakien / Evros-Grenze", nameTr: "Batı Trakya ve Meriç Sınırı", nameEn: "Thrace / Evros Frontier", provinzenAnzahl: 3, gelaende: "ebene", nachbarTuerkei: true, strategischerWert: 9 },
  { id: "reg_aeg_inseln", theater: "aegaeis", name: "Nord- und Ostägäische Inseln", nameTr: "Doğu Ege Adaları", nameEn: "Eastern Aegean Islands", provinzenAnzahl: 4, gelaende: "kueste", nachbarTuerkei: true, strategischerWert: 8 },
  { id: "reg_aeg_kreta", theater: "aegaeis", name: "Kreta & Südägäis", nameTr: "Girit ve Güney Ege Deniz Hattı", nameEn: "Crete & South Aegean Basin", provinzenAnzahl: 3, gelaende: "kueste", nachbarTuerkei: false, strategischerWert: 8 },

  // Zypern
  { id: "reg_cyp_nord", theater: "zypern", name: "Nordzypern (KKTC)", nameTr: "Kuzey Kıbrıs Türk Cumhuriyeti", nameEn: "Northern Cyprus (TRNC)", provinzenAnzahl: 3, gelaende: "kueste", nachbarTuerkei: true, strategischerWert: 10 },
  { id: "reg_cyp_sued", theater: "zypern", name: "Südzypern (Republik Zypern)", nameTr: "Güney Kıbrıs Rum Yönetimi", nameEn: "Southern Cyprus", provinzenAnzahl: 3, gelaende: "kueste", nachbarTuerkei: false, strategischerWert: 7 },

  // Kaukasus
  { id: "reg_kauk_zangezur", theater: "kaukasus", name: "Zangezur-Streifen (Syunik)", nameTr: "Zengezur Koridoru (Sünik)", nameEn: "Zangezur Corridor (Syunik)", provinzenAnzahl: 2, gelaende: "gebirge", nachbarTuerkei: true, strategischerWert: 9 },
  { id: "reg_kauk_karabach", theater: "kaukasus", name: "Bergkarabach & Schuscha", nameTr: "Karabağ ve Şuşa", nameEn: "Karabakh & Shusha", provinzenAnzahl: 2, gelaende: "gebirge", nachbarTuerkei: false, strategischerWert: 7 },
  { id: "reg_kauk_batumi", theater: "kaukasus", name: "Adscharien / Batumi", nameTr: "Acaristan ve Batum Limanı", nameEn: "Adjara / Batumi Port", provinzenAnzahl: 2, gelaende: "kueste", nachbarTuerkei: true, strategischerWert: 6 },
];

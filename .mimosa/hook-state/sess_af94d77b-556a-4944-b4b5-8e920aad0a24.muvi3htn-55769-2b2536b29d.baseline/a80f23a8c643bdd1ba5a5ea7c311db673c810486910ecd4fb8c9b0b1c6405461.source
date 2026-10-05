// Strategische 3D-Kartenfeatures: Megaprojekte, seismische Verwerfungslinien und taktische Frontlinien.
// Unterstützt HOI4-artige Frontabschnitts-Glows, Civ-artige Weltwunder/Großprojekte und seismische Risiko-Visualisierung.

import type { World } from "../../sim/types";
import { reichZustand } from "../../sim/reich";
import { lonLatToUv, type AtlasScene, type Relief } from "./scene";

export interface BruchlinieDef {
  id: string;
  name: string;
  nameTr: string;
  nameEn: string;
  typ: "hauptverwerfung" | "nebenverwerfung";
  risiko: number; // 0..1
  punkte: [lon: number, lat: number][];
}

export interface TaktikFrontDef {
  id: string;
  name: string;
  nameTr: string;
  nameEn: string;
  status: "aktiv" | "befestigt" | "patrouille" | "puffer";
  bedrohung: number; // 0..1
  punkte: [lon: number, lat: number][];
}

export interface MegaprojektGeoDef {
  id: string;
  name: string;
  nameTr: string;
  nameEn: string;
  typ: "wasserstrasse" | "nuklear" | "staudamm" | "haengebruecke";
  lon: number;
  lat: number;
  trasse?: [lon: number, lat: number][];
}

/** Die großen seismischen Bruchzonen der Türkei */
export const BRUCHLINIEN: BruchlinieDef[] = [
  // Kuzey Anadolu Fay Hattı (NAF) - von Saros bis Karlıova
  {
    id: "fault_naf",
    name: "Nordanatolische Verwerfung (NAF)",
    nameTr: "Kuzey Anadolu Fay Hattı (KAF)",
    nameEn: "North Anatolian Fault Zone (NAF)",
    typ: "hauptverwerfung",
    risiko: 0.95,
    punkte: [
      [26.2, 40.55], // Saros-Bucht
      [27.4, 40.82], // Marmarameer West (Tekirdağ-Becken)
      [28.8, 40.87], // Marmarameer Zentral (Silivri/Kumburgaz)
      [29.3, 40.76], // İzmit-Bucht
      [30.5, 40.73], // Adapazarı / Sakarya
      [31.6, 40.74], // Düzce / Bolu
      [33.6, 40.95], // Çerkeş / Ilgaz
      [35.4, 41.05], // Ladik / Amasya
      [36.8, 40.65], // Erbaa / Tokat
      [38.5, 40.28], // Suşehri
      [39.5, 39.75], // Erzincan-Ebene
      [40.4, 39.42], // Yedisu
      [41.0, 39.30], // Karlıova Triple Junction
    ],
  },
  // Doğu Anadolu Fay Hattı (EAF) - von Hatay/Antakya bis Karlıova
  {
    id: "fault_eaf",
    name: "Ostanatolische Verwerfung (EAF)",
    nameTr: "Doğu Anadolu Fay Hattı (DAF)",
    nameEn: "East Anatolian Fault Zone (EAF)",
    typ: "hauptverwerfung",
    risiko: 0.92,
    punkte: [
      [36.15, 36.20], // Antakya / Amik-Ebene
      [36.35, 36.75], // Kırıkhan / Hassa
      [36.70, 37.35], // Türkoğlu / Kahramanmaraş
      [37.20, 37.60], // Pazarcık
      [37.90, 37.95], // Gölbaşı / Adıyaman
      [38.50, 38.35], // Çelikhan / Sürgü
      [39.20, 38.60], // Hazar-See / Elazığ
      [40.10, 38.85], // Palu / Bingöl
      [41.00, 39.30], // Karlıova Triple Junction
    ],
  },
  // Batı Anadolu Graben-System (Gediz & Menderes)
  {
    id: "fault_gediz",
    name: "Gediz-Grabenverwerfung",
    nameTr: "Gediz Çöküntü Fayı",
    nameEn: "Gediz Graben Fault System",
    typ: "nebenverwerfung",
    risiko: 0.78,
    punkte: [
      [27.15, 38.45], // Izmir-Bucht
      [27.70, 38.50], // Turgutlu / Manisa
      [28.15, 38.48], // Salihli
      [28.75, 38.35], // Alaşehir
    ],
  },
  {
    id: "fault_menderes",
    name: "Büyük-Menderes-Verwerfung",
    nameTr: "Büyük Menderes Fay Hattı",
    nameEn: "Büyük Menderes Graben System",
    typ: "nebenverwerfung",
    risiko: 0.75,
    punkte: [
      [27.30, 37.75], // Söke
      [27.85, 37.85], // Aydın
      [28.50, 37.90], // Nazilli
      [29.10, 37.78], // Pamukkale / Denizli
    ],
  },
];

/** Taktische Frontabschnitte und Pufferzonen (HOI4-Stil) */
export const TAKTIK_FRONTEN: TaktikFrontDef[] = [
  // Syrischer Sicherheitskorridor (Pufferzone Operation Fırat Kalkanı / Barış Pınarı / Zeytin Dalı)
  {
    id: "front_syr_korridor",
    name: "Syrischer Sicherheitskorridor (30-km-Pufferzone)",
    nameTr: "Suriye Güvenli Bölge ve Harekât Koridoru",
    nameEn: "Syrian Northern Security Corridor (Buffer Zone)",
    status: "aktiv",
    bedrohung: 0.85,
    punkte: [
      [36.35, 36.55], // Afrin-Westriegel
      [36.90, 36.60], // Kilis-Azaz-Grenzabschnitt
      [37.50, 36.70], // Jarablus / Euphrat-Übergang
      [38.30, 36.75], // Kobane-Südriegel
      [38.95, 36.70], // Tel Abyad
      [39.90, 36.85], // Ras al-Ayn
      [41.20, 37.05], // Qamishli-Nordpuffer
      [42.15, 37.15], // Cizre / Dreiländereck
    ],
  },
  // Nordirak Grenzriegel (Operation Pençe-Kilit / Bergfestungen)
  {
    id: "front_irq_pence",
    name: "Nordirak-Grenzsicherungslinie (Pençe-Kilit)",
    nameTr: "Kuzey Irak Pençe-Kilit Güvenlik Hattı",
    nameEn: "Northern Iraq Border Denial Line (Claw-Lock)",
    status: "befestigt",
    bedrohung: 0.75,
    punkte: [
      [42.50, 37.25], // Haftanin-Sektor
      [43.20, 37.15], // Metina / Zap-Tal
      [43.80, 37.10], // Avasin-Basyan
      [44.30, 37.05], // Hakurk
      [44.80, 36.95], // Qandil-Vorpostenkette
    ],
  },
  // Ägäis Demarkations- & Fluggrenze (FIR / Schelfgrenze)
  {
    id: "front_aeg_demark",
    name: "Ägäis-Demarkation & Mavi-Vatan-Riegel",
    nameTr: "Ege Demarkasyon Hattı ve Mavi Vatan Koruma Sahası",
    nameEn: "Aegean Demarcation Line & Maritime Buffer",
    status: "patrouille",
    bedrohung: 0.65,
    punkte: [
      [25.80, 40.50], // Samothraki-Nordsee
      [25.40, 39.80], // Lemnos-Ostkorridor
      [25.60, 39.00], // Lesbos-Westsektor
      [25.80, 38.30], // Chios-Passage
      [26.40, 37.50], // Samos-Ikaria-Gürtel
      [26.80, 36.80], // Kos / Dodekanes
      [27.60, 36.00], // Rhodos-Westrand
    ],
  },
  // Zypern Grüne Linie (BM-Waffenstillstandszone)
  {
    id: "front_cyp_greenline",
    name: "Zypern-Waffenstillstandslinie (Grüne Linie)",
    nameTr: "Kıbrıs Yeşil Hat (BM Tampon Bölgesi)",
    nameEn: "Cyprus Ceasefire Line (UN Buffer Zone)",
    status: "puffer",
    bedrohung: 0.5,
    punkte: [
      [32.80, 35.15], // Morphou-Bucht
      [33.36, 35.17], // Nikosia-Zentrum
      [33.95, 35.08], // Dhekelia
      [34.00, 35.03], // Famagusta-Rand
    ],
  },
];

/** Geometrien und Schlüsseldaten der Megaprojekte */
export const MEGAPROJEKTE_DETAILS: MegaprojektGeoDef[] = [
  {
    id: "infra_kanal_istanbul",
    name: "Kanal Istanbul",
    nameTr: "Kanal İstanbul",
    nameEn: "Istanbul Canal",
    typ: "wasserstrasse",
    lon: 28.73,
    lat: 41.18,
    trasse: [
      [28.69, 41.34], // Karadeniz-Mündung (Yeniköy / Karaburun)
      [28.71, 41.28], // Dursunköy
      [28.73, 41.22], // Sazlıdere-Stausee-Brücke
      [28.76, 41.08], // Küçükçekmece-Nord
      [28.78, 40.98], // Marmarameer-Mündung
    ],
  },
  {
    id: "infra_akkuyu",
    name: "Kernkraftwerk Akkuyu",
    nameTr: "Akkuyu Nükleer Güç Santrali",
    nameEn: "Akkuyu Nuclear Power Plant",
    typ: "nuklear",
    lon: 33.541,
    lat: 36.144,
  },
  {
    id: "infra_gap",
    name: "Atatürk-Staudamm (GAP)",
    nameTr: "Atatürk Barajı ve Hidroelektrik Santrali (GAP)",
    nameEn: "Atatürk Dam & Hydroelectric Complex (GAP)",
    typ: "staudamm",
    lon: 38.318,
    lat: 37.482,
    trasse: [
      [38.295, 37.492], // Westlicher Dammfuß
      [38.318, 37.482], // Dammkrone & Überlauf
      [38.342, 37.475], // Östliche Verankerung
    ],
  },
  {
    id: "infra_canakkale1915",
    name: "1915-Çanakkale-Brücke",
    nameTr: "1915 Çanakkale Köprüsü",
    nameEn: "1915 Çanakkale Bridge",
    typ: "haengebruecke",
    lon: 26.636,
    lat: 40.34,
    trasse: [
      [26.620, 40.355], // Gelibolu-Pylon (Europa)
      [26.655, 40.325], // Lapseki-Pylon (Asien)
    ],
  },
  {
    id: "infra_osmangazi",
    name: "Osmangazi-Brücke",
    nameTr: "Osmangazi Köprüsü",
    nameEn: "Osmangazi Bridge",
    typ: "haengebruecke",
    lon: 29.516,
    lat: 40.755,
    trasse: [
      [29.510, 40.770], // Dilovası-Pylon (Nord)
      [29.525, 40.740], // Hersek-Pylon (Süd)
    ],
  },
];

export interface ZeichneFeaturesOptions {
  zeit: number; // performance.now()
  ebene: string;
  zoom: number; // view.d
  erdbebenAkut?: boolean;
  kriegAktiv?: boolean;
}

/** Zeichnet seismische Bruchlinien mit Warn-Glow */
export function zeichneBruchlinien(
  ctx: CanvasRenderingContext2D,
  atlas: AtlasScene,
  relief: Relief,
  options: ZeichneFeaturesOptions,
): void {
  const { zeit, ebene, erdbebenAkut } = options;
  // Sichtbar bei Kartenebene "risiko", oder wenn ein Erdbeben akut droht
  const sichtbar = ebene === "risiko" || !!erdbebenAkut;
  if (!sichtbar) return;

  const puls = 0.5 + 0.5 * Math.sin(zeit * 0.003);
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (const f of BRUCHLINIEN) {
    const coords: { x: number; y: number; sichtbar: boolean }[] = [];
    for (const [lon, lat] of f.punkte) {
      const [u, v] = lonLatToUv(relief, lon, lat);
      coords.push(atlas.project(u, v));
    }
    if (coords.length < 2 || !coords.some((c) => c.sichtbar)) continue;

    // 1. Äußerer seismischer Warn-Glow
    ctx.beginPath();
    let first = true;
    for (const pt of coords) {
      if (first) {
        ctx.moveTo(pt.x, pt.y);
        first = false;
      } else {
        ctx.lineTo(pt.x, pt.y);
      }
    }
    ctx.strokeStyle = f.typ === "hauptverwerfung"
      ? `rgba(224, 76, 56, ${(0.35 + 0.3 * puls * f.risiko).toFixed(2)})`
      : `rgba(235, 140, 50, ${(0.25 + 0.2 * puls * f.risiko).toFixed(2)})`;
    ctx.lineWidth = f.typ === "hauptverwerfung" ? 8 : 5;
    ctx.stroke();

    // 2. Scharfer Kern (Gezackte / gestrichelte Verwerfung)
    ctx.beginPath();
    first = true;
    for (const pt of coords) {
      if (first) {
        ctx.moveTo(pt.x, pt.y);
        first = false;
      } else {
        ctx.lineTo(pt.x, pt.y);
      }
    }
    ctx.strokeStyle = f.typ === "hauptverwerfung" ? "#b31e12" : "#c96818";
    ctx.lineWidth = f.typ === "hauptverwerfung" ? 2.5 : 1.6;
    ctx.setLineDash(f.typ === "hauptverwerfung" ? [6, 4] : [4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

/** Zeichnet Frontlinien im HOI4-Stil mit taktischem Glow und Schraffur */
export function zeichneTaktikFronten(
  ctx: CanvasRenderingContext2D,
  atlas: AtlasScene,
  relief: Relief,
  options: ZeichneFeaturesOptions,
): void {
  const { zeit, ebene, kriegAktiv } = options;
  // Sichtbar bei Kartenebene "probleme", "welt" oder aktivem Krieg/Militärkrise
  const sichtbar = ebene === "probleme" || ebene === "welt" || !!kriegAktiv;
  if (!sichtbar) return;

  const puls = 0.5 + 0.5 * Math.sin(zeit * 0.0025);
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (const front of TAKTIK_FRONTEN) {
    const coords: { x: number; y: number; sichtbar: boolean }[] = [];
    for (const [lon, lat] of front.punkte) {
      const [u, v] = lonLatToUv(relief, lon, lat);
      coords.push(atlas.project(u, v));
    }
    if (coords.length < 2 || !coords.some((c) => c.sichtbar)) continue;

    // 1. Taktischer Neon-Bloom / Glow
    ctx.beginPath();
    let first = true;
    for (const pt of coords) {
      if (first) {
        ctx.moveTo(pt.x, pt.y);
        first = false;
      } else {
        ctx.lineTo(pt.x, pt.y);
      }
    }
    const farbeGlow = front.status === "aktiv"
      ? `rgba(235, 60, 40, ${(0.3 + 0.3 * puls).toFixed(2)})`
      : front.status === "befestigt"
        ? `rgba(220, 160, 30, ${(0.25 + 0.25 * puls).toFixed(2)})`
        : `rgba(60, 150, 230, ${(0.25 + 0.2 * puls).toFixed(2)})`;

    ctx.strokeStyle = farbeGlow;
    ctx.lineWidth = 10;
    ctx.stroke();

    // 2. Militärischer Bandstreifen (HOI4-Frontkante)
    ctx.beginPath();
    first = true;
    for (const pt of coords) {
      if (first) {
        ctx.moveTo(pt.x, pt.y);
        first = false;
      } else {
        ctx.lineTo(pt.x, pt.y);
      }
    }
    const farbeKern = front.status === "aktiv" ? "#cf2e20" : front.status === "befestigt" ? "#d48d1c" : "#2e7fc9";
    ctx.strokeStyle = farbeKern;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

/** Zeichnet physische Megaprojekt-Trassen (Kanal Istanbul, Dämme, Brücken) */
export function zeichneMegaprojekte(
  ctx: CanvasRenderingContext2D,
  atlas: AtlasScene,
  relief: Relief,
  world: World,
  options: ZeichneFeaturesOptions,
): void {
  const z = reichZustand(world);
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (const m of MEGAPROJEKTE_DETAILS) {
    const laeuft = z.laufend.find((l) => l.id === m.id);
    const fertig = !!z.bestand[m.id];
    // Wenn das Vorhaben weder im Bau noch fertig ist, nur ganz dezent oder gar nicht zeichnen
    if (!laeuft && !fertig) continue;

    if (m.trasse && m.trasse.length >= 2) {
      const coords: { x: number; y: number; sichtbar: boolean }[] = [];
      for (const [lon, lat] of m.trasse) {
        const [u, v] = lonLatToUv(relief, lon, lat);
        coords.push(atlas.project(u, v));
      }
      if (coords.length < 2 || !coords.some((c) => c.sichtbar)) continue;

      if (m.typ === "wasserstrasse") {
        // Kanal Istanbul:
        ctx.beginPath();
        let first = true;
        for (const pt of coords) {
          if (first) {
            ctx.moveTo(pt.x, pt.y);
            first = false;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        if (fertig) {
          // Tiefes Kanalblau mit hellen Schifffahrts-Böschungen
          ctx.strokeStyle = "rgba(240, 226, 196, 0.9)";
          ctx.lineWidth = 6.5;
          ctx.stroke();
          ctx.strokeStyle = "rgba(32, 98, 142, 0.98)";
          ctx.lineWidth = 4.2;
          ctx.stroke();
        } else {
          // Baustellen-Aushub (Erde & Warnschraffur)
          ctx.strokeStyle = "rgba(180, 110, 50, 0.85)";
          ctx.lineWidth = 5;
          ctx.setLineDash([6, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else if (m.typ === "haengebruecke") {
        // Çanakkale 1915 / Osmangazi
        ctx.beginPath();
        let first = true;
        for (const pt of coords) {
          if (first) {
            ctx.moveTo(pt.x, pt.y);
            first = false;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        ctx.strokeStyle = "#e84a38"; // Kräftiges Brücken-Rot
        ctx.lineWidth = 3.5;
        ctx.stroke();
        // Hängekabel-Pylonen
        for (const pt of coords) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#2a1e12";
          ctx.fill();
        }
      } else if (m.typ === "staudamm") {
        // Atatürk-Staudamm Sperrmauer
        ctx.beginPath();
        let first = true;
        for (const pt of coords) {
          if (first) {
            ctx.moveTo(pt.x, pt.y);
            first = false;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        // Beton-Mauer
        ctx.strokeStyle = "rgba(230, 235, 238, 0.95)";
        ctx.lineWidth = 4.5;
        ctx.stroke();
        ctx.strokeStyle = "rgba(42, 60, 70, 0.9)";
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
    }

    // Punktmarker / Kraftwerks-Icon für Akkuyu
    if (m.typ === "nuklear") {
      const [u, v] = lonLatToUv(relief, m.lon, m.lat);
      const pt = atlas.project(u, v);
      if (pt.sichtbar) {
        const puls = 0.5 + 0.5 * Math.sin(options.zeit * 0.004);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, fertig ? 8 + puls * 3 : 6, 0, Math.PI * 2);
        ctx.fillStyle = fertig
          ? `rgba(64, 180, 255, ${(0.3 + 0.25 * puls).toFixed(2)})`
          : "rgba(220, 160, 40, 0.35)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = fertig ? "#1e88e5" : "#e65100";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

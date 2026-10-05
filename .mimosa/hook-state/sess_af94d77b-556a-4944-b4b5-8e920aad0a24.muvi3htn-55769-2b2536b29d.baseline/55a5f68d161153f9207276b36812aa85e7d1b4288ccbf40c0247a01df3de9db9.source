// Die Kartendaten (public/data/karte) sind stimmig: Landzerlegung ohne Überlappung, Provinzen und Länder an den richtigen Orten,
// Bezirke, Küsten-Distanzfeld und Ortsnamen. Erzeugt mit tools/geodaten/karte2/ (siehe dortige README).

import { existsSync, readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { describe, expect, test } from "vitest";
import { PROVINZEN } from "../src/sim/regional";

const DIR = "public/data/karte";
const vorhanden = existsSync(`${DIR}/karte.json`);

interface Ring { lon: Float64Array; lat: Float64Array }
interface Flaeche { besitzer: number; ringe: Ring[]; bb: [number, number, number, number] }
interface Stufe { flaechen: Flaeche[]; bogen: { typ: number; n: number }[] }

function lese(datei: string): Stufe {
  const b = readFileSync(`${DIR}/${datei}`);
  const a = new Int32Array(b.buffer, b.byteOffset, Math.floor(b.byteLength / 4));
  expect(a[0]).toBe(0x4b32);
  const nFl = a[2]!;
  const nBogen = a[3]!;
  let p = 4;
  const flaechen: Flaeche[] = [];
  for (let f = 0; f < nFl; f++) {
    const besitzer = a[p]!;
    const nRinge = a[p + 1]!;
    p += 2;
    const ringe: Ring[] = [];
    for (let k = 0; k < nRinge; k++) {
      const n = a[p]!;
      const lon = new Float64Array(n);
      const lat = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        lon[i] = a[p + 1 + 2 * i]! / 1e5;
        lat[i] = a[p + 2 + 2 * i]! / 1e5;
      }
      p += 1 + 2 * n;
      ringe.push({ lon, lat });
    }
    let bb: [number, number, number, number] = [999, 999, -999, -999];
    const r0 = ringe[0]!;
    for (let i = 0; i < r0.lon.length; i++) bb = [Math.min(bb[0], r0.lon[i]!), Math.min(bb[1], r0.lat[i]!), Math.max(bb[2], r0.lon[i]!), Math.max(bb[3], r0.lat[i]!)];
    flaechen.push({ besitzer, ringe, bb });
  }
  const bogen: { typ: number; n: number }[] = [];
  for (let k = 0; k < nBogen; k++) {
    const typ = a[p]!;
    const n = a[p + 1]!;
    bogen.push({ typ, n });
    p += 2 + 2 * n;
  }
  expect(p).toBe(a.length);
  return { flaechen, bogen };
}

function drin(f: Flaeche, lon: number, lat: number): boolean {
  if (lon < f.bb[0] || lon > f.bb[2] || lat < f.bb[1] || lat > f.bb[3]) return false;
  let d = false;
  for (const r of f.ringe) {
    for (let i = 0, j = r.lon.length - 1; i < r.lon.length; j = i++) {
      if (r.lat[i]! > lat !== r.lat[j]! > lat && lon < ((r.lon[j]! - r.lon[i]!) * (lat - r.lat[i]!)) / (r.lat[j]! - r.lat[i]!) + r.lon[i]!) d = !d;
    }
  }
  return d;
}

const meta = vorhanden ? (JSON.parse(readFileSync(`${DIR}/karte.json`, "utf8")) as { besitzer: { k: string; plaka?: number; iso?: string; name?: string }[] }) : null;
/** Besitzer der Flächen an einer Stelle; der Sammelbesitzer „Türkei“ (Vereinigung der Provinzen) zählt nicht mit */
function bei(st: Stufe, lon: number, lat: number, ohneTuerkei = true): number[] {
  const tur = ohneTuerkei && meta ? meta.besitzer.findIndex((b) => b.k === "t") : -1;
  return st.flaechen.filter((f) => f.besitzer !== tur && drin(f, lon, lat)).map((f) => f.besitzer);
}

const isoIndex = (iso: string) => meta!.besitzer.findIndex((b) => b.iso === iso);

/** Orte mit bekannter Provinz (Kfz-Kennziffer) oder bekanntem Land */
const PROVINZ_ORTE: [string, number, number, number][] = [
  ["Ankara", 32.86, 39.93, 6], ["İstanbul", 28.98, 41.01, 34], ["İzmir", 27.14, 38.42, 35], ["Trabzon", 39.72, 41.0, 61], ["Van", 43.38, 38.5, 65],
  ["Diyarbakır", 40.22, 37.91, 21], ["Antalya", 30.71, 36.9, 7], ["Edirne", 26.55, 41.68, 22], ["Hakkâri", 43.74, 37.58, 30], ["Kars", 43.09, 40.6, 36],
  ["Boyabat", 34.77, 41.47, 57], ["Mersin", 34.64, 36.8, 33], ["Konya", 32.48, 37.87, 42], ["Erzurum", 41.27, 39.9, 25], ["Gaziantep", 37.38, 37.06, 27],
  ["Samsun", 36.33, 41.29, 55], ["Bodrum", 27.43, 37.04, 48], ["Çanakkale", 26.41, 40.15, 17], ["Şanlıurfa", 38.79, 37.17, 63], ["Hatay/Antakya", 36.16, 36.2, 31],
];
const LAND_ORTE: [string, number, number, string][] = [
  ["Athen", 23.73, 37.98, "GRC"], ["Sofia", 23.32, 42.7, "BGR"], ["Bagdad", 44.4, 33.3, "IRQ"], ["Aleppo", 37.16, 36.2, "SYR"], ["Tiflis", 44.8, 41.72, "GEO"],
  ["Eriwan", 44.51, 40.18, "ARM"], ["Baku", 49.87, 40.4, "AZE"], ["Nikosia", 33.36, 35.17, "CYP"], ["Täbris", 46.3, 38.08, "IRN"], ["Beirut", 35.5, 33.89, "LBN"],
  ["Bukarest", 26.1, 44.43, "ROU"], ["Kairo-Delta/Alexandria", 29.92, 31.2, "EGY"], ["Amman", 35.93, 31.95, "JOR"], ["Jerusalem", 35.22, 31.78, "ISR"],
  ["Ramallah", 35.2, 31.9, "PSX"], ["Gaza", 34.45, 31.5, "PSX"], ["Famagusta", 33.95, 35.12, "CYN"], ["Belgrad", 20.46, 44.8, "SRB"], ["Skopje", 21.43, 42.0, "MKD"],
  ["Krasnodar", 38.98, 45.04, "RUS"], ["Samarra", 43.87, 34.2, "IRQ"],
];

describe.skipIf(!vorhanden)("Kartendaten: Landzerlegung", () => {
  test("Besitzertabelle: 81 Provinzen zuerst, danach die Länder mit ISO-Kürzel und Namen", () => {
    expect(meta!.besitzer.slice(0, 81).every((b, i) => b.k === "p" && b.plaka === i + 1)).toBe(true);
    const laender = meta!.besitzer.slice(81).filter((b) => b.k === "l");
    expect(meta!.besitzer.filter((b) => b.k === "t")).toHaveLength(1); // Sammelbesitzer Türkei
    expect(laender.length).toBeGreaterThanOrEqual(25);
    expect(laender.every((l) => l.k === "l" && /^[A-Z]{3}$/.test(l.iso ?? "") && (l.name ?? "").length > 2)).toBe(true);
    for (const iso of ["GRC", "BGR", "SYR", "IRQ", "IRN", "GEO", "ARM", "AZE", "CYP", "PSX", "ISR", "LBN", "JOR", "EGY", "ROU", "UKR", "RUS", "SAU"]) expect(isoIndex(iso), iso).toBeGreaterThan(80);
  });

  for (const stufe of [0, 1, 2]) {
    describe(`Stufe ${stufe}`, () => {
      const st = lese(`karte-L${stufe}.bin`);

      test("jede Provinz hat eine Fläche, alle Punkte liegen im Kartenausschnitt", () => {
        const habe = new Set(st.flaechen.map((f) => f.besitzer));
        for (let i = 0; i < 81; i++) expect(habe.has(i), `Provinz ${i + 1}`).toBe(true);
        for (const f of st.flaechen) for (const r of f.ringe) for (let i = 0; i < r.lon.length; i++) {
          expect(r.lon[i]!).toBeGreaterThanOrEqual(19.3);
          expect(r.lon[i]!).toBeLessThanOrEqual(50.7);
          expect(r.lat[i]!).toBeGreaterThanOrEqual(30.8);
          expect(r.lat[i]!).toBeLessThanOrEqual(46.2);
        }
      });

      test("keine Überlappung: jeder Zufallspunkt liegt in höchstens einer Fläche", () => {
        let s = 12345;
        const zufall = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
        let getroffen = 0;
        for (let k = 0; k < 2500; k++) {
          const lon = 19.6 + zufall() * 30.8;
          const lat = 31.1 + zufall() * 14.8;
          const n = bei(st, lon, lat).length;
          expect(n, `${lon.toFixed(3)}, ${lat.toFixed(3)}`).toBeLessThanOrEqual(1);
          getroffen += n;
        }
        expect(getroffen).toBeGreaterThan(900); // ein gutes Drittel des Ausschnitts ist Land
      });

      test("bekannte Orte liegen in der richtigen Provinz und im richtigen Land", () => {
        const grob = stufe === 0 ? 2 : 0; // die gröbste Stufe darf an sehr schmalen Küsten irren
        let falsch = 0;
        for (const [name, lon, lat, plaka] of PROVINZ_ORTE) {
          const t = bei(st, lon, lat);
          if (!(t.length === 1 && t[0] === plaka - 1)) falsch++;
          if (stufe > 0) expect(t, name).toEqual([plaka - 1]);
        }
        for (const [name, lon, lat, iso] of LAND_ORTE) {
          const t = bei(st, lon, lat);
          if (!(t.length === 1 && t[0] === isoIndex(iso))) falsch++;
          if (stufe > 0) expect(t, name).toEqual([isoIndex(iso)]);
        }
        expect(falsch).toBeLessThanOrEqual(grob);
      });

      test("Bögen: nur bekannte Typen; Landesgrenze und Küste der Türkei vorhanden", () => {
        const typen = new Set(st.bogen.map((b) => b.typ));
        for (const t of typen) expect([0, 2, 3, 4, 5]).toContain(t);
        for (const t of [0, 2, 3, 4, 5]) expect(typen.has(t), `Typ ${t}`).toBe(true);
      });
    });
  }

  test("Provinznamen stimmen mit der Kennziffer überein (81 Provinzen im Spiel)", () => {
    expect(PROVINZEN).toHaveLength(81);
    expect(PROVINZEN[5]!.name).toBe("Ankara");
    expect(PROVINZEN[33]!.name).toBe("İstanbul");
  });
});

describe.skipIf(!vorhanden)("Kartendaten: Bezirke", () => {
  const info = JSON.parse(readFileSync(`${DIR}/bezirke.json`, "utf8")) as { name: string; plaka: number; flaeche_km2: number }[];
  for (const stufe of [1, 2]) {
    test(`Stufe B${stufe}: Bezirke liegen in ihrer Provinz und überlappen nicht`, () => {
      const st = lese(`karte-B${stufe}.bin`);
      expect(info).toHaveLength(973);
      const habe = new Set(st.flaechen.map((f) => f.besitzer));
      expect(habe.size).toBeGreaterThan(stufe === 1 ? 900 : 950);
      // Ein Bezirk liegt in der Provinz, zu der er gehört: Stichprobe über Flächenmittelpunkte
      const prov = lese(`karte-L${stufe}.bin`);
      let unstimmig = 0;
      let geprueft = 0;
      for (const f of st.flaechen.filter((_, i) => i % 3 === 0)) {
        const r = f.ringe[0]!;
        let lon = 0;
        let lat = 0;
        for (let i = 0; i < r.lon.length; i++) {
          lon += r.lon[i]!;
          lat += r.lat[i]!;
        }
        lon /= r.lon.length;
        lat /= r.lon.length;
        if (!drin(f, lon, lat)) continue; // Mittelpunkt außerhalb (konkave Form)
        const p = bei(prov, lon, lat);
        geprueft++;
        if (!(p.length === 1 && p[0] === info[f.besitzer]!.plaka - 1)) unstimmig++;
      }
      expect(geprueft).toBeGreaterThan(300);
      expect(unstimmig).toBeLessThanOrEqual(Math.ceil(geprueft * 0.01));
      let s = 777;
      const zufall = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
      for (let k = 0; k < 1500; k++) expect(bei(st, 26 + zufall() * 19, 36 + zufall() * 6).length).toBeLessThanOrEqual(1);
    });
  }
});

describe.skipIf(!vorhanden)("Kartendaten: Küsten-Distanzfeld", () => {
  const meta2 = JSON.parse(readFileSync("public/data/relief-z8.json", "utf8")) as { width: number; height: number; lon0: number; lon1: number; lat0: number; lat1: number };
  const roh = gunzipSync(readFileSync(`${DIR}/kueste-sdf.bin.gz`));
  const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  const wert = (lon: number, lat: number) => {
    const x = Math.round(((lon - meta2.lon0) / (meta2.lon1 - meta2.lon0)) * meta2.width - 0.5);
    const y = Math.round(((merc(meta2.lat1) - merc(lat)) / (merc(meta2.lat1) - merc(meta2.lat0))) * meta2.height - 0.5);
    return roh[y * meta2.width + x]!;
  };
  test("Größe stimmt, Land über 128, Meer unter 128", () => {
    expect(roh.length).toBe(meta2.width * meta2.height);
    expect(wert(32.86, 39.93)).toBeGreaterThan(200); // Ankara
    expect(wert(34.6, 43.2)).toBeLessThan(60); // Schwarzes Meer
    expect(wert(25.0, 39.3)).toBeLessThan(128); // offene Ägäis zwischen Skyros und Lemnos
    expect(wert(26.0, 38.4)).toBeGreaterThan(128); // Insel Chios
    expect(wert(28.98, 41.01)).toBeGreaterThan(128); // İstanbul
    expect(wert(33.1, 35.05)).toBeGreaterThan(128); // Zypern
  });
});

describe.skipIf(!vorhanden)("Kartendaten: Namen", () => {
  const orte = JSON.parse(readFileSync(`${DIR}/orte.json`, "utf8")) as { orte: { n: string; l: string; k: string }[]; meere: { n: string }[]; gipfel: { n: string; ele: number }[] };
  test("Hauptstädte, Meere und Gipfel sind vorhanden, Städte deutsch beschriftet", () => {
    const namen = new Set(orte.orte.map((o) => o.n));
    for (const n of ["Ankara", "İstanbul", "İzmir", "Athen", "Bagdad", "Damaskus", "Tiflis", "Eriwan", "Bukarest"]) expect(namen.has(n), n).toBe(true);
    expect(orte.orte.filter((o) => o.k === "h").length).toBeGreaterThanOrEqual(15);
    for (const n of ["Schwarzes Meer", "Mittelmeer", "Ägäis", "Marmarameer"]) expect(orte.meere.some((m) => m.n === n), n).toBe(true);
    expect(orte.gipfel.some((g) => g.n.startsWith("Ararat") && g.ele === 5137)).toBe(true);
  });
});

// Strategische Korridore, keine Vermessung einzelner Trassen. Kapazitäten sind Spielparameter.
// Ein Transportpunkt entspricht einem Anteil am normalen Monatsbedarf; verschiedene Wareneinheiten
// werden nie als Tonnen addiert. Knoten verwenden die vorhandenen Provinzmittelpunkte.
import MITTEN from "./reich/provinzmitten.json";
import { PROVINZEN } from "../sim/regional";

export const HUB_IDS = [22, 34, 35, 6, 42, 33, 1, 31, 27, 63, 21, 73, 65, 25, 36, 55, 61];
export const HUBS = HUB_IDS.map(plaka => ({ id: String(plaka), plaka,
  name: PROVINZEN.find(p => p.plaka === plaka)!.name,
  lon: (MITTEN as Record<string, number[]>)[String(plaka)]![0]!,
  lat: (MITTEN as Record<string, number[]>)[String(plaka)]![1]!,
}));
export const HUB_NACH_ID = Object.fromEntries(HUBS.map(h => [h.id, h]));
export type TransportArt = "strasse" | "bahn" | "see" | "pipeline" | "front" | "luft";
export interface TransportRoute { id: string; von: string; nach: string; art: TransportArt; kap: number; via?: number[]; land?: string }
const r = (von: number, nach: number, art: TransportArt, kap: number, via?: number[]): TransportRoute => ({ id: `${art}-${von}-${nach}`, von: String(von), nach: String(nach), art, kap, via });
export const TRANSPORT_ROUTEN: TransportRoute[] = [
  r(22,34,"strasse",8), r(34,6,"bahn",24,[41,54,26]), r(34,35,"strasse",16,[16,10]),
  r(35,42,"bahn",14,[20,3]), r(6,42,"bahn",16), r(42,33,"bahn",12,[70]),
  r(33,1,"strasse",14), r(1,27,"bahn",12,[80]), r(1,31,"strasse",8), r(31,27,"strasse",6,[79]),
  r(27,63,"strasse",12), r(63,21,"strasse",10), r(21,73,"strasse",8,[47]),
  r(21,65,"strasse",8,[13]), r(65,25,"strasse",8,[4]), r(25,36,"strasse",8),
  r(6,55,"bahn",14,[19,5]), r(55,61,"strasse",10,[52,28]), r(61,25,"strasse",8,[29]),
  r(6,25,"bahn",16,[66,58,24]), r(6,21,"bahn",14,[38,44,23]), r(42,1,"strasse",10,[51]),
  r(35,33,"see",14), r(34,55,"see",12),
  ...[[34,22],[34,6],[35,6],[6,42],[42,33],[33,1],[1,31],[1,27],[27,63],[63,21],[21,73],[21,65],[65,25],[25,36],[6,25],[6,55],[55,61]].map(([a,b]) => r(a!,b!,"pipeline",12)),
];

// Jede Provinz gehört genau einem regionalen Umschlagknoten; Zuordnung nach Entfernung ist eine Spielabstraktion.
export const HUB_PROVINZEN: Record<string, number[]> = Object.fromEntries(HUBS.map(h => [h.id, []]));
for (const p of PROVINZEN) {
  const xy = (MITTEN as Record<string, number[]>)[String(p.plaka)]!;
  const h = [...HUBS].sort((a,b) => Math.hypot((a.lon-xy[0]!)*0.77,a.lat-xy[1]!) - Math.hypot((b.lon-xy[0]!)*0.77,b.lat-xy[1]!))[0]!;
  HUB_PROVINZEN[h.id]!.push(p.plaka);
}
const bevoelkerung = PROVINZEN.reduce((s,p) => s+p.bevoelkerung,0);
export const HUB_GEWICHT = Object.fromEntries(HUBS.map(h => [h.id, PROVINZEN.filter(p => HUB_PROVINZEN[h.id]!.includes(p.plaka)).reduce((s,p)=>s+p.bevoelkerung,0)/bevoelkerung]));
export const FRONT_ZUGANG: Record<string, string[]> = { SYR:["27","63"], IRQ:["73","65"], GRC:["22","35"], CYP:["33","35"], ARM:["36","65"], IRN:["65","36"] };

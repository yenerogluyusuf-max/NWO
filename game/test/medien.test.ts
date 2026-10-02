// Struktur der Medien-Cluster (RECHERCHE_MEDIEN_UMFRAGEN.md, Kapitel A.5).

import { describe, expect, test } from "vitest";
import { MEDIEN_CLUSTER, REGULIERUNG_PREISE, medienCluster, type MedienSegment } from "../src/data/medien";

const SEGMENTE: MedienSegment[] = ["laendlich_konservativ", "urban_alt", "urban_jung", "kurdistan", "akademisch"];

describe("Medien-Cluster", () => {
  test("Vier bis sieben Cluster mit eindeutigen Kennungen", () => {
    expect(MEDIEN_CLUSTER.length).toBeGreaterThanOrEqual(4);
    expect(MEDIEN_CLUSTER.length).toBeLessThanOrEqual(7);
    expect(new Set(MEDIEN_CLUSTER.map((c) => c.id)).size).toBe(MEDIEN_CLUSTER.length);
    for (const c of MEDIEN_CLUSTER) expect(c.name.length).toBeGreaterThan(3);
  });

  test("Wertebereiche: Empfindlichkeit 0–100, Reichweiten und Wahrscheinlichkeiten 0–1", () => {
    for (const c of MEDIEN_CLUSTER) {
      expect(c.eigentuemerEmpfindlichkeit, c.id).toBeGreaterThanOrEqual(0);
      expect(c.eigentuemerEmpfindlichkeit, c.id).toBeLessThanOrEqual(100);
      for (const s of SEGMENTE) {
        expect(c.reichweiteSegmente[s], `${c.id}/${s}`).toBeGreaterThanOrEqual(0);
        expect(c.reichweiteSegmente[s], `${c.id}/${s}`).toBeLessThanOrEqual(1);
      }
      expect(c.berichtSkandalRegierung, c.id).toBeGreaterThanOrEqual(0);
      expect(c.berichtSkandalRegierung, c.id).toBeLessThanOrEqual(1);
      expect(c.berichtSkandalOpposition, c.id).toBeGreaterThanOrEqual(0);
      expect(c.berichtSkandalOpposition, c.id).toBeLessThanOrEqual(1);
      for (const v of c.verwundbarkeit) expect(["eigentum", "plattform", "lizenz"], c.id).toContain(v);
    }
  });

  test("Jedes Wählersegment wird von mindestens einem Cluster nennenswert erreicht", () => {
    for (const s of SEGMENTE) {
      const max = Math.max(...MEDIEN_CLUSTER.map((c) => c.reichweiteSegmente[s]));
      expect(max, s).toBeGreaterThanOrEqual(0.1);
    }
  });

  test("Ordnung der Eigentümer-Empfindlichkeit folgt der Recherche (Staat > Holdings > Opposition > Digital)", () => {
    const nach = (id: string) => medienCluster(id)!.eigentuemerEmpfindlichkeit;
    expect(nach("staatsrundfunk")).toBeGreaterThan(nach("holding_kern"));
    expect(nach("holding_kern")).toBeGreaterThan(nach("kommerz_konform"));
    expect(nach("kommerz_konform")).toBeGreaterThan(nach("opposition_masse"));
    expect(nach("digital_frei")).toBe(0);
  });

  test("Regulierungspreise: nicht-negative RSF-Mali, Blackout teurer als Anzeigenstopp", () => {
    for (const [k, p] of Object.entries(REGULIERUNG_PREISE)) {
      expect(p.rsfMalus, k).toBeGreaterThanOrEqual(0);
      expect(p.referenz.length, k).toBeGreaterThan(5);
    }
    expect(REGULIERUNG_PREISE.blackout_10tage.rsfMalus).toBeGreaterThan(REGULIERUNG_PREISE.bik_anzeigenstopp.rsfMalus);
  });
});

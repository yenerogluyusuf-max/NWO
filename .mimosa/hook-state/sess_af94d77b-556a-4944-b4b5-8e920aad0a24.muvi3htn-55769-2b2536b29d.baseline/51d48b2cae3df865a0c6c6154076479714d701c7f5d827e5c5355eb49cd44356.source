import { describe, expect, test } from "vitest";
import { BRUCHLINIEN, TAKTIK_FRONTEN, MEGAPROJEKTE_DETAILS } from "../src/ui/atlas/karten-features";

describe("Strategische 3D-Kartenfeatures", () => {
  test("Bruchlinien enthalten NAF und EAF mit validen Koordinaten", () => {
    expect(BRUCHLINIEN.length).toBeGreaterThanOrEqual(4);
    const naf = BRUCHLINIEN.find((b) => b.id === "fault_naf");
    expect(naf).toBeDefined();
    expect(naf!.typ).toBe("hauptverwerfung");
    expect(naf!.punkte.length).toBeGreaterThan(10);
    expect(naf!.risiko).toBeGreaterThan(0.9);

    const eaf = BRUCHLINIEN.find((b) => b.id === "fault_eaf");
    expect(eaf).toBeDefined();
    expect(eaf!.punkte.length).toBeGreaterThan(5);

    for (const b of BRUCHLINIEN) {
      expect(b.name).toBeTruthy();
      expect(b.nameTr).toBeTruthy();
      expect(b.nameEn).toBeTruthy();
      for (const [lon, lat] of b.punkte) {
        expect(lon).toBeGreaterThan(25);
        expect(lon).toBeLessThan(45);
        expect(lat).toBeGreaterThan(35);
        expect(lat).toBeLessThan(43);
      }
    }
  });

  test("Taktische Fronten decken Syrien, Irak, Ägäis und Zypern ab", () => {
    expect(TAKTIK_FRONTEN.length).toBeGreaterThanOrEqual(4);
    const syr = TAKTIK_FRONTEN.find((f) => f.id === "front_syr_korridor");
    expect(syr).toBeDefined();
    expect(syr!.status).toBe("aktiv");
    expect(syr!.punkte.length).toBeGreaterThan(5);

    const irq = TAKTIK_FRONTEN.find((f) => f.id === "front_irq_pence");
    expect(irq).toBeDefined();
    expect(irq!.status).toBe("befestigt");

    const aeg = TAKTIK_FRONTEN.find((f) => f.id === "front_aeg_demark");
    expect(aeg).toBeDefined();
    expect(aeg!.status).toBe("patrouille");

    const cyp = TAKTIK_FRONTEN.find((f) => f.id === "front_cyp_greenline");
    expect(cyp).toBeDefined();
    expect(cyp!.status).toBe("puffer");
  });

  test("Megaprojekte enthalten Kanal Istanbul, Akkuyu, Atatürk-Damm und Meerengen-Brücken", () => {
    expect(MEGAPROJEKTE_DETAILS.length).toBeGreaterThanOrEqual(5);

    const kanal = MEGAPROJEKTE_DETAILS.find((m) => m.id === "infra_kanal_istanbul");
    expect(kanal).toBeDefined();
    expect(kanal!.typ).toBe("wasserstrasse");
    expect(kanal!.trasse).toBeDefined();
    expect(kanal!.trasse!.length).toBeGreaterThan(3);

    const akkuyu = MEGAPROJEKTE_DETAILS.find((m) => m.id === "infra_akkuyu");
    expect(akkuyu).toBeDefined();
    expect(akkuyu!.typ).toBe("nuklear");
    expect(akkuyu!.lon).toBeCloseTo(33.54, 1);
    expect(akkuyu!.lat).toBeCloseTo(36.14, 1);

    const gap = MEGAPROJEKTE_DETAILS.find((m) => m.id === "infra_gap");
    expect(gap).toBeDefined();
    expect(gap!.typ).toBe("staudamm");

    const canakkale = MEGAPROJEKTE_DETAILS.find((m) => m.id === "infra_canakkale1915");
    expect(canakkale).toBeDefined();
    expect(canakkale!.typ).toBe("haengebruecke");
  });
});

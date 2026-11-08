// In Umsetzung (05.11.2026, „hier fehlt ein erweitern“): jede laufende Maßnahme lässt sich weiter ausbauen oder im Ziel senken;
// der Stand steht in Worten (benannter Zustand, Satz oder Anteil am Ausgang), nicht als Indexzahl.
import { expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { UmsetzungAkte } from "../src/ui/politik/UmsetzungAkte";
import { stufenName } from "../src/data/skalen";

test("laufende Maßnahme: weiter ausbauen, Ziel senken und stoppen, Stand in Worten", () => {
  const w = createWorld(turkey2026, 5);
  startAfterElection(w, schnellProfil());
  const s = save(w);
  const offen = [{ id: "m_mwst", name: "Mehrwertsteuer", now: 60, target: 70, months: 3 }];
  const html = renderToStaticMarkup(<UmsetzungAkte world={w} refresh={() => {}} offen={offen} beschlossen={0} wirksam={0} onAendern={() => {}} />);
  expect(save(w)).toBe(s);
  expect(html).toContain(stufenName("m_mwst", 60));
  expect(html).toContain(stufenName("m_mwst", 90));
  expect(html).toContain(stufenName("m_mwst", 50));
  expect(html).toContain("20 %");
  expect((html.match(/pd-um-tun/g) ?? []).length).toBe(1);
  expect((html.match(/<button/g) ?? []).length).toBeGreaterThanOrEqual(3);
});

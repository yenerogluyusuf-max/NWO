// Alle Kataloge des Reiches an einer Stelle.

import type { Vorhaben } from "../../sim/reich-typen";
import { KULTUR_VORHABEN, KULTUR_VORTEILE, STAETTEN_START } from "./kultur";
import { INFRA_VORHABEN, INFRA_VORTEILE, INSTANDZUSETZEN, sanierung } from "./infrastruktur";
import { RECHT_VORHABEN, RECHT_VORTEILE } from "./recht";
import { MILITAER_VORHABEN, MILITAER_VORTEILE, MIL_PFLEGBAR, militaerInstandsetzung } from "./militaer";
import { HAUSHALT_VORHABEN, HAUSHALT_VORTEILE } from "./haushalt";
import { ZUKUNFT_ALLE, ZUKUNFT_VORTEILE } from "./zukunft";
import { TECH_ALLE } from "./technologie";
import { REGIONAL_VORLAGEN } from "./regional";
import type { VorteilDef } from "./typen";
import { datenFelder, datenTexte } from "../../i18n/daten";
import { aktuelleSprache, t } from "../../i18n";
import { ERBE_NACH_ID } from "../erbe";

export { STAETTEN_START };
export { katalogFuerEingabe } from "./katalog";

/** Zukunftskatalog und Technologie: Ketten von Großvorhaben (Raumfahrt, KI, Verkehr, Städte, Energie, Technologiefelder). */
const NEU: Vorhaben[] = [...ZUKUNFT_ALLE, ...TECH_ALLE];
/** Jedes gebaute Stück mit Wirkung lässt sich instand setzen: auch die Vorhaben des Zukunftskatalogs. */
const NEU_PFLEGE: Vorhaben[] = [
  ...NEU.filter((v) => v.bereich === "infrastruktur" && INSTANDZUSETZEN(v)).map(sanierung),
  ...NEU.filter((v) => v.bereich === "militaer" && MIL_PFLEGBAR(v)).map(militaerInstandsetzung),
];

export const VORHABEN: Vorhaben[] = [...KULTUR_VORHABEN, ...INFRA_VORHABEN, ...RECHT_VORHABEN, ...MILITAER_VORHABEN, ...HAUSHALT_VORHABEN, ...NEU, ...REGIONAL_VORLAGEN, ...NEU_PFLEGE];
export const VORTEILE: VorteilDef[] = [...KULTUR_VORTEILE, ...INFRA_VORTEILE, ...RECHT_VORTEILE, ...MILITAER_VORTEILE, ...HAUSHALT_VORTEILE, ...ZUKUNFT_VORTEILE];

// Namen und Texte dreisprachig (Kataloge daten_vorhaben.json, daten_vorteil.json; Deutsch bleibt hier die Quelle).
// Abgeleitete Vorhaben (Instandsetzung, Restaurierung, Besucherzentrum) setzen ihre Texte aus dem übersetzten Namen des Stammstücks zusammen.
const ABGELEITET = (v: Vorhaben): boolean => v.pflegt !== undefined || ((v.id.startsWith("restaurierung_") || v.id.startsWith("ausbau_")) && ERBE_NACH_ID[v.id.replace(/^(restaurierung|ausbau)_/, "")] !== undefined);
const STAMM = VORHABEN.filter((v) => !ABGELEITET(v));
datenTexte("vorhaben", STAMM, (v) => v.id, ["name", "text", "kehrseite", "anker", "konkurrenz"]);
datenFelder("vorhaben.sperre", STAMM.filter((v) => v.sperre).map((v) => ({ id: v.id, obj: v.sperre!, feld: "text" })));
datenFelder("vorhaben.zitat", STAMM.filter((v) => v.zitat).map((v) => ({ id: v.id, obj: v.zitat!, feld: "text" })));
datenFelder("vorhaben.vorlage", STAMM.filter((v) => v.vorlage).map((v) => ({ id: v.id, obj: v.vorlage!, feld: "kurz" })));
datenFelder("vorhaben.voraus", STAMM.flatMap((v) => v.voraus.map((b, i) => ({ id: `${v.id}.${i}`, obj: b, feld: "text" }))));
datenTexte("vorteil", VORTEILE, (v) => v.id, ["name", "text", "kehrseite"]);

const KEHRSEITE: Record<string, string> = {
  "Bindet Baukapazität, die dann für Neubauten fehlt.": "reich.kehrseite.bau",
  "Bindet Werften und Techniker, die dann für Neubeschaffung fehlen.": "reich.kehrseite.werften",
  "Bindet Restauratoren und Baukapazität; die Stätte ist während der Arbeiten teilweise gesperrt.": "reich.kehrseite.restaurierung",
  "Mehr Besucher belasten die Stätte: Ihr Zustand sinkt schneller, wenn nicht restauriert wird.": "reich.kehrseite.besucher",
};

if (aktuelleSprache() !== "de") {
  const nachId = new Map(VORHABEN.map((v) => [v.id, v]));
  for (const v of VORHABEN.filter(ABGELEITET)) {
    const k = KEHRSEITE[v.kehrseite];
    if (k) v.kehrseite = t(k);
    if (v.pflegt !== undefined) {
      const stamm = nachId.get(v.pflegt);
      if (!stamm) continue;
      const hub = v.abschluss.find((e) => e.t === "bestand")?.d ?? 0;
      v.name = t("reich.instandsetzung.name", { name: stamm.name });
      v.text = t("reich.instandsetzung.text", { name: stamm.name, hub });
      for (const b of v.voraus) if (b.art === "bestand-max") b.text = t("reich.voraus.nichtBester", { name: stamm.name });
      continue;
    }
    const e = ERBE_NACH_ID[v.id.replace(/^(restaurierung|ausbau)_/, "")]!;
    if (v.id.startsWith("restaurierung_")) {
      v.name = t("reich.restaurierung.name", { name: e.name });
      v.text = t("reich.restaurierung.text", { name: e.name, ort: e.ort });
      for (const b of v.voraus) if (b.art === "staette-max") b.text = t("reich.voraus.nichtBester", { name: e.name });
    } else {
      v.name = t("reich.ausbau.name", { name: e.name });
      v.text = t("reich.ausbau.text", { ort: e.ort });
      for (const b of v.voraus) if (b.art === "staetten") b.text = t("reich.voraus.mindestens", { name: e.name, min: b.min });
    }
  }
}

// Welle 3, K6 (krieg.md Schritt 10, karte.md K8): das Kriegsziel auf der großen Karte setzen. Baut die Anfrage der Ortswahl
// (ui/atlas/ortswahl.ts) für einen Konfliktvorgang: Ziele sind die Regionen des Schauplatzes (`r:<regionId>`), die Bewertung folgt der
// Tiefenregel und der Reichweite der Operationsform, die Vorschau rechnet mit denselben Zahlen, die `waehleZielRegionen` bucht.
// Rechnet nichts selbst, was die Simulation entscheidet: Regeln und Preis kommen aus sim/zielwahl.ts, Fläche und Einwohner aus
// data/schauplaetze.ts, Gegenwehr aus data/streitkraefte.ts.

import type { World } from "../../sim/types";
import type { KriegVorgang } from "../../sim/krieg-typen";
import { regionenVon, zielRegionen } from "../../sim/kriegsschauplatz";
import { gehalteneRegionen, regionWaehlbar, waehleZielRegionen, zielAendertSich, zielBereinigen, zielLuecke, zielraumFuerRegionen, zielwahlOffen, zielwahlPreis } from "../../sim/zielwahl";
import { operationVon, operationsTiefe } from "../../sim/operationen";
import { kannZahlen } from "../../sim/kapital";
import { land } from "../../sim/laender";
import { REGION_NACH_ID, type Region } from "../../data/schauplaetze";
import { ZIELRAEUME } from "../../data/streitkraefte";
import { rahmenVon } from "../atlas/front";
import type { OrtBewertung, OrtswahlAnfrage, OrtswahlVorschau } from "../atlas/ortswahl";
import { liste, t, zahl } from "../../i18n";

const rid = (ziel: string): string => ziel.slice(2);

/** Einwohner kurz: unter einer Million in Tausend, sonst in Millionen (wie im Schauplatz der Akte). */
function einwohnerKurz(n: number): string {
  return n >= 1_000_000 ? t("welle_k2.ui.mio", { z: zahl(n / 1_000_000, 2) }) : t("welle_k2.ui.tsd", { z: zahl(Math.round(n / 1000), 0) });
}

/** Wie das geltende Ziel heißt: der feste Zielraum oder die eigene Auswahl mit ihren Regionen. */
export function zielBeschreibung(k: KriegVorgang): string {
  if (k.zielRegionen) return t("welle_k6.ziel.eigene", { regionen: liste(zielRegionen(k).map((r) => t(`krieg.region.${r.id}`))) });
  return k.zielraum ? t(`militaer.zielraum.${k.zielraum}`) : "";
}

/** Bewertung jeder Region für die aktuelle Auswahl (dieselbe Regel, die `waehleZielRegionen` prüft). */
export function bewerteRegionen(w: World, k: KriegVorgang, auswahl: readonly string[]): Record<string, OrtBewertung> {
  const ids = auswahl.map(rid);
  const gehalten = gehalteneRegionen(w, k);
  const reicht = operationsTiefe(k);
  const op = operationVon(k);
  const out: Record<string, OrtBewertung> = {};
  for (const r of regionenVon(k.land)) {
    const z = `r:${r.id}`;
    if (gehalten.has(r.id)) out[z] = { bewertung: "erfuellt", grund: t("welle_k6.grund.erfuellt") };
    else if (!regionWaehlbar(k.land, r.id, ids, gehalten)) out[z] = { bewertung: "gesperrt", grund: t("welle_k6.grund.gesperrt", { tiefe: r.tiefe - 1 }) };
    else if (r.tiefe > reicht && op) out[z] = { bewertung: "moeglich", grund: t("welle_k6.grund.tiefer", { form: t(`welle_k3.op.${op.id}.name`) }) };
    else out[z] = { bewertung: "gut", grund: t(r.tiefe === 1 ? "welle_k6.grund.grenze" : "welle_k6.grund.anschluss") };
  }
  return out;
}

/** Was das Seitenfenster zur Auswahl zeigt. */
export function kriegszielVorschau(w: World, k: KriegVorgang, auswahl: readonly string[]): OrtswahlVorschau {
  const ids = auswahl.map(rid);
  const regionen = regionenVon(k.land).filter((r) => ids.includes(r.id)).sort((a, b) => a.tiefe - b.tiefe);
  const km2 = regionen.reduce((s, r) => s + r.flaecheKm2, 0);
  const einw = regionen.reduce((s, r) => s + (r.einwohner?.zahl ?? 0), 0);
  const raum = zielraumFuerRegionen(k.land, ids);
  const def = raum ? ZIELRAEUME.find((z) => z.id === raum.id) : undefined;
  const preis = zielwahlPreis(k, ids);
  const kennzahlen: OrtswahlVorschau["kennzahlen"] = [
    { etikett: t("welle_k6.leiste.regionen"), wert: zahl(regionen.length, 0), klein: t("welle_k6.leiste.von", { n: regionenVon(k.land).length }) },
    { etikett: t("welle_k6.leiste.flaeche"), wert: t("welle_k2.ui.km2", { z: zahl(km2, 0) }) },
    { etikett: t("welle_k6.leiste.einwohner"), wert: einw > 0 ? einwohnerKurz(einw) : "–" },
    { etikett: t("welle_k6.leiste.gegenwehr"), wert: def ? `×${zahl(def.schwierigkeit, 2)}` : "–", ...(def ? { klein: t("welle_k6.leiste.bedeutung", { b: def.bedeutung }) } : {}) },
  ];
  const zeilen = regionen.map((r: Region) => ({
    ziel: `r:${r.id}`,
    name: t(`krieg.region.${r.id}`),
    zahlen: [t("welle_k2.ui.km2", { z: zahl(r.flaecheKm2, 0) }), r.einwohner ? einwohnerKurz(r.einwohner.zahl) : "", t(`welle_k6.gelaende.${r.gelaende}`)].filter(Boolean).join(" · "),
  }));
  const gehalten = gehalteneRegionen(w, k);
  const luecke = zielLuecke(k.land, ids, gehalten);
  const offen = zielwahlOffen(w, k);
  let grund: string | undefined;
  if (!offen.ok) grund = offen.grund;
  else if (!ids.length) grund = t("welle_k6.ziel.leer");
  else if (luecke) grund = t("welle_k6.ziel.luecke", { region: t(`krieg.region.${luecke}`) });
  else if (!zielAendertSich(k, ids) && (k.zielraum || k.zielRegionen)) grund = t("welle_k6.ziel.unveraendert");
  else if (preis.pk > 0 && !kannZahlen(w.spiel?.kapital ?? 0, preis.pk)) grund = t("militaer.grund.kapital");
  // Was die gewählte Operation nicht erreicht, zählt nicht zum Kriegsziel (sim/krieg.ts kriegszielErreicht filtert nach operationsTiefe)
  const op = operationVon(k);
  const zuTief = op ? regionen.filter((r) => r.tiefe > operationsTiefe(k)) : [];
  const hinweis = [
    raum ? t(raum.genau ? "welle_k6.leiste.entspricht" : "welle_k6.leiste.eigene", { raum: t(`militaer.zielraum.${raum.id}`) }) : "",
    zuTief.length && op ? t("welle_k6.leiste.zu_tief", { regionen: liste(zuTief.map((r) => t(`krieg.region.${r.id}`))), n: zuTief.length, form: t(`welle_k3.op.${op.id}.name`) }) : "",
  ].filter(Boolean).join(" ") || undefined;
  return {
    kennzahlen,
    zeilen,
    preis: preis.pk > 0 ? t("welle_k6.leiste.preis_wechsel", { pk: preis.pk, moral: zahl(Math.abs(preis.moral), 0) }) : "",
    ok: !grund,
    ...(grund ? { grund } : {}),
    ...(hinweis ? { hinweis } : {}),
  };
}

/** Die Anfrage der Ortswahl „Kriegsziel auf der Karte“ für einen Konfliktvorgang. */
export function kriegszielAnfrage(w: World, k: KriegVorgang): OrtswahlAnfrage {
  const alle = regionenVon(k.land);
  const rahmen = rahmenVon(alle.map((r) => r.id));
  const gehalten = gehalteneRegionen(w, k);
  const start = zielRegionen(k).filter((r) => !gehalten.has(r.id)).map((r) => `r:${r.id}`);
  return {
    id: `kriegsziel:${k.id}`,
    titel: t("welle_k6.leiste.titel", { land: land(k.land).name }),
    frage: t("welle_k6.leiste.frage"),
    ziele: alle.map((r) => `r:${r.id}`),
    start: k.zielraum || k.zielRegionen ? start : [],
    bewerte: (a) => bewerteRegionen(w, k, a),
    bereinige: (a) => zielBereinigen(k.land, a.map(rid), gehalteneRegionen(w, k)).map((id) => `r:${id}`),
    vorschau: (a) => kriegszielVorschau(w, k, a),
    uebernehmen: (a) => waehleZielRegionen(w, k.id, a.map(rid)),
    knopf: t("welle_k6.leiste.knopf"),
    // Der Ausschnitt zeigt den ganzen Schauplatz (Spielparameter der Darstellung: Abstand aus der Breite des Schauplatzes in Grad)
    ...(rahmen ? { kamera: { lon: rahmen.lon, lat: rahmen.lat, d: Math.min(12, Math.max(4, Math.max(rahmen.breite, rahmen.hoehe * 1.6) * 0.95 + 1.4)) } } : {}),
  };
}

/** Ob der Knopf „Auf der Karte wählen“ erscheint. */
export function kriegszielKarteMoeglich(w: World, k: KriegVorgang): boolean {
  return zielwahlOffen(w, k).ok && !!REGION_NACH_ID[regionenVon(k.land)[0]?.id ?? ""];
}

// Internationale Vergleichsdaten (Weltbank, CC BY 4.0) und ihre Zuordnung zu den Größen des Spiels.
// Regel des Projekts: Quelle oder Lücke. Jeder Wert trägt sein Jahr; wo es keinen Vergleich gibt, sagt die Oberfläche das.

import daten from "../data/vergleich.json";
import type { World } from "../sim/types";
import { aktuelleLocale, aktuelleSprache, katalogVon, t } from "../i18n";

export interface Indikator {
  name: string;
  einheit: string;
  besser: "höher" | "niedriger" | null;
  thema: string;
  tur: { wert: number; jahr: number; rang: number; von: number };
  median: number;
  laender: Record<string, [number, number]>;
  aggregate: Record<string, [number, number]>;
}

interface Datei {
  quelle: string;
  abgerufen: string;
  hinweis: string;
  laender: Record<string, string>;
  gruppen: Record<string, string[]>;
  aggregate: Record<string, string>;
  indikatoren: Record<string, Indikator>;
}

export const VERGLEICH = daten as unknown as Datei;

/**
 * Namen und Einheiten der Indikatoren, Länder und Aggregate aus dem Katalog (`vgl.*`), soweit dort ein Eintrag steht; die deutschen
 * Daten bleiben der Rückfall. Läuft einmal beim Laden des Moduls: Die Sprache wechselt nur durch Neuladen.
 */
function lokalisiere(): void {
  const sprache = aktuelleSprache();
  if (sprache === "de") return;
  const kat = katalogVon(sprache);
  const en = katalogVon("en");
  const hole = (key: string): string | undefined => kat[key] ?? en[key];
  for (const [c, ind] of Object.entries(VERGLEICH.indikatoren)) {
    ind.name = hole(`vgl.ind.${c}.name`) ?? ind.name;
    ind.einheit = hole(`vgl.ind.${c}.einheit`) ?? ind.einheit;
  }
  for (const c of Object.keys(VERGLEICH.laender)) VERGLEICH.laender[c] = hole(`vgl.land.${c}`) ?? VERGLEICH.laender[c]!;
  for (const c of Object.keys(VERGLEICH.aggregate)) VERGLEICH.aggregate[c] = hole(`vgl.agg.${c}`) ?? VERGLEICH.aggregate[c]!;
}

lokalisiere();

export function indikator(code: string): Indikator | undefined {
  return VERGLEICH.indikatoren[code];
}

/** Welche Weltbank-Indikatoren zu welcher Größe, Maßnahme oder welchem Problem des Politiknetzes gehören. */
export const ZUORDNUNG: Record<string, string[]> = {
  // Eingänge aus dem Wirtschaftsmodell
  inflation: ["FP.CPI.TOTL.ZG"],
  arbeitslosigkeit: ["SL.UEM.TOTL.ZS"],
  wachstum: ["NY.GDP.MKTP.KD.ZG"],
  schulden: ["GC.DOD.TOTL.GD.ZS"],
  defizit: ["GC.NLD.TOTL.GD.ZS"],
  abwertung: ["PA.NUS.FCRF.ABW"],
  // Wirtschaft und Haushalt
  zinslast: ["GC.XPN.INTP.RV.ZS"],
  steuereinnahmen: ["GC.TAX.TOTL.GD.ZS"],
  export: ["NE.EXP.GNFS.ZS"],
  m_exportfoerderung: ["NE.EXP.GNFS.ZS"],
  investitionen: ["NE.GDI.FTOT.ZS"],
  m_investitionsanreize: ["NE.GDI.FTOT.ZS"],
  auslandskapital: ["BX.KLT.DINV.WD.GD.ZS"],
  kredite: ["FS.AST.PRVT.GD.ZS"],
  produktivitaet: ["SL.GDP.PCAP.EM.KD"],
  realeinkommen: ["NY.GNP.PCAP.PP.CD"],
  tourismus: ["ST.INT.RCPT.XP.ZS"],
  m_tourismuswerbung: ["ST.INT.RCPT.XP.ZS"],
  m_einkommensteuer: ["GC.TAX.TOTL.GD.ZS"],
  m_mwst: ["GC.TAX.TOTL.GD.ZS"],
  // Arbeit und Soziales
  ungleichheit: ["SI.POV.GINI"],
  armut: ["SI.POV.UMIC"],
  p_armut: ["SI.POV.UMIC", "SI.POV.GINI"],
  m_sozialhilfe: ["SI.POV.UMIC"],
  jugendarbeitslosigkeit: ["SL.UEM.1524.ZS"],
  p_jugendarbeitslosigkeit: ["SL.UEM.1524.ZS"],
  m_ausbildung: ["SL.UEM.1524.ZS"],
  frauenerwerb: ["SL.TLF.CACT.FE.ZS"],
  m_kinderbetreuung: ["SL.TLF.CACT.FE.ZS"],
  // Gesundheit, Bildung
  lebenserwartung: ["SP.DYN.LE00.IN"],
  geburtenrate: ["SP.DYN.TFRT.IN"],
  aerzte: ["SH.MED.PHYS.ZS"],
  p_aerztemangel: ["SH.MED.PHYS.ZS"],
  m_aerztegehalt: ["SH.MED.PHYS.ZS"],
  gesundheitsversorgung: ["SH.MED.BEDS.ZS", "SH.MED.PHYS.ZS"],
  m_krankenhausbau: ["SH.MED.BEDS.ZS"],
  bildungsqualitaet: ["SE.XPD.TOTL.GD.ZS"],
  m_schulbau: ["SE.XPD.TOTL.GD.ZS"],
  m_lehrergehaelter: ["SE.XPD.TOTL.GD.ZS"],
  hochschule: ["SE.TER.ENRR", "GB.XPD.RSDV.GD.ZS"],
  m_unigruendungen: ["SE.TER.ENRR"],
  m_forschung: ["GB.XPD.RSDV.GD.ZS"],
  // Infrastruktur, Energie, Umwelt
  internet: ["IT.NET.USER.ZS"],
  m_breitband: ["IT.NET.USER.ZS"],
  verkehrsnetz: ["LP.LPI.INFR.XQ"],
  m_autobahnen: ["LP.LPI.INFR.XQ"],
  m_bahn: ["LP.LPI.INFR.XQ"],
  logistik: ["LP.LPI.OVRL.XQ"],
  erneuerbare: ["EG.ELC.RNEW.ZS"],
  m_solar_wind: ["EG.ELC.RNEW.ZS"],
  energieimporte: ["EG.IMP.CONS.ZS"],
  luftqualitaet: ["EN.ATM.PM25.MC.M3"],
  p_luftverschmutzung: ["EN.ATM.PM25.MC.M3"],
  klimaschutz: ["EN.GHG.CO2.PC.CE.AR5"],
  m_co2_preis: ["EN.GHG.CO2.PC.CE.AR5"],
  ernte: ["AG.YLD.CREL.KG"],
  // Sicherheit, Recht, Gesellschaft
  kriminalitaet: ["VC.IHR.PSRC.P5"],
  p_kriminalitaet: ["VC.IHR.PSRC.P5"],
  m_polizei: ["VC.IHR.PSRC.P5"],
  militaer: ["MS.MIL.XPND.GD.ZS"],
  m_verteidigung: ["MS.MIL.XPND.GD.ZS"],
  korruption: ["GOV_WGI_CC.EST"],
  p_korruption: ["GOV_WGI_CC.EST"],
  m_antikorruption: ["GOV_WGI_CC.EST"],
  rechtssicherheit: ["GOV_WGI_RL.EST"],
  justizvertrauen: ["GOV_WGI_RL.EST"],
  m_justizreform: ["GOV_WGI_RL.EST"],
  pressefreiheit: ["GOV_WGI_VA.EST"],
  zivilgesellschaft: ["GOV_WGI_VA.EST"],
  m_medienaufsicht: ["GOV_WGI_VA.EST"],
  m_internetsperren: ["GOV_WGI_VA.EST"],
  m_versammlungsfreiheit: ["GOV_WGI_VA.EST"],
  vertrauen_regierung: ["GOV_WGI_GE.EST"],
};

export function indikatorenFuer(id: string): { code: string; ind: Indikator }[] {
  return (ZUORDNUNG[id] ?? []).flatMap((code) => {
    const ind = indikator(code);
    return ind ? [{ code, ind }] : [];
  });
}

/** Der Wert des Spiels in der Einheit des Vergleichs, wo beide dieselbe Größe messen (Eingänge des Wirtschaftsmodells). */
export function spielWert(w: World, id: string): { wert: number; text: string } | undefined {
  const e = w.economy;
  switch (id) {
    case "inflation":
      return { wert: w.published.inflation.value, text: t("vgl.spiel.veroeffentlicht") };
    case "arbeitslosigkeit":
      return { wert: w.published.unemployment.value, text: t("vgl.spiel.veroeffentlicht") };
    case "wachstum":
      return { wert: w.published.growth.value, text: t("vgl.spiel.veroeffentlicht") };
    case "schulden":
      return { wert: e.debtRatio, text: t("vgl.spiel.heute") };
    case "defizit":
      return { wert: -(e.deficit + e.fiscalImpulse + e.policyCost), text: t("vgl.spiel.geplant") };
    case "abwertung":
      return { wert: e.fxChange12, text: t("vgl.spiel.zwoelf") };
    default:
      return undefined;
  }
}

export const nf = (x: number, d?: number): string => {
  const digits = d ?? (Math.abs(x) >= 1000 ? 0 : Math.abs(x) >= 100 ? 0 : Math.abs(x) >= 10 ? 1 : 2);
  return x.toLocaleString(aktuelleLocale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

/** Ein Satz zur Einordnung: wie viele Länder liegen darüber oder darunter? */
export function einordnung(ind: Indikator): string {
  const tu = ind.tur;
  const hoeher = tu.rang - 1;
  const niedriger = tu.von - tu.rang;
  const halb = tu.von / 2;
  let wort: string;
  if (tu.rang <= tu.von * 0.1) wort = t("vgl.wort.hoechste");
  else if (tu.rang <= halb) wort = t("vgl.wort.oben");
  else if (tu.rang <= tu.von * 0.9) wort = t("vgl.wort.unten");
  else wort = t("vgl.wort.niedrigste");
  const bewertung =
    ind.besser === null ? "" : (ind.besser === "niedriger" && tu.rang <= halb) || (ind.besser === "höher" && tu.rang > halb) ? t("vgl.bew.unguenstig") : t("vgl.bew.guenstig");
  return t("vgl.einordnung", { von: tu.von, hoeher, niedriger, wort, bewertung });
}

/** Kurzform für Tooltips: einige bekannte Vergleichswerte mit Jahr. */
export function kurzVergleich(code: string): string | undefined {
  const ind = indikator(code);
  if (!ind) return undefined;
  const eu = ind.aggregate.EUU;
  const teile = [
    `${VERGLEICH.laender.DEU} ${nf(ind.laender.DEU?.[0] ?? NaN)}`,
    eu ? `EU ${nf(eu[0])}` : undefined,
    ind.laender.BRA ? `${VERGLEICH.laender.BRA} ${nf(ind.laender.BRA[0])}` : undefined,
    `${t("vgl.median")} ${nf(ind.median)}`,
  ].filter((x): x is string => !!x && !x.includes("NaN"));
  return t("vgl.kurz", { einheit: ind.einheit, jahr: ind.tur.jahr, wert: nf(ind.tur.wert), teile: teile.join(", ") });
}

// Internationale Vergleichsdaten (Weltbank, CC BY 4.0) und ihre Zuordnung zu den Größen des Spiels.
// Regel des Projekts: Quelle oder Lücke. Jeder Wert trägt sein Jahr; wo es keinen Vergleich gibt, sagt die Oberfläche das.

import daten from "../data/vergleich.json";
import type { World } from "../sim/types";

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
      return { wert: w.published.inflation.value, text: "Türkei im Spiel (zuletzt veröffentlicht)" };
    case "arbeitslosigkeit":
      return { wert: w.published.unemployment.value, text: "Türkei im Spiel (zuletzt veröffentlicht)" };
    case "wachstum":
      return { wert: w.published.growth.value, text: "Türkei im Spiel (zuletzt veröffentlicht)" };
    case "schulden":
      return { wert: e.debtRatio, text: "Türkei im Spiel (heute)" };
    case "defizit":
      return { wert: -(e.deficit + e.fiscalImpulse + e.policyCost), text: "Türkei im Spiel (geplant)" };
    case "abwertung":
      return { wert: e.fxChange12, text: "Türkei im Spiel (letzte 12 Monate)" };
    default:
      return undefined;
  }
}

export const nf = (x: number, d?: number): string => {
  const digits = d ?? (Math.abs(x) >= 1000 ? 0 : Math.abs(x) >= 100 ? 0 : Math.abs(x) >= 10 ? 1 : 2);
  return x.toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

/** Ein Satz zur Einordnung: wie viele Länder liegen darüber oder darunter? */
export function einordnung(ind: Indikator): string {
  const t = ind.tur;
  const hoeher = t.rang - 1;
  const niedriger = t.von - t.rang;
  const halb = t.von / 2;
  let wort: string;
  if (t.rang <= t.von * 0.1) wort = "unter den höchsten Werten der Welt";
  else if (t.rang <= halb) wort = "in der oberen Hälfte";
  else if (t.rang <= t.von * 0.9) wort = "in der unteren Hälfte";
  else wort = "unter den niedrigsten Werten der Welt";
  const bewertung =
    ind.besser === null ? "" : (ind.besser === "niedriger" && t.rang <= halb) || (ind.besser === "höher" && t.rang > halb) ? " Das ist ungünstig." : " Das ist günstig.";
  return `Von ${t.von} Ländern haben ${hoeher} einen höheren und ${niedriger} einen niedrigeren Wert; die Türkei steht ${wort}.${bewertung}`;
}

/** Kurzform für Tooltips: einige bekannte Vergleichswerte mit Jahr. */
export function kurzVergleich(code: string): string | undefined {
  const ind = indikator(code);
  if (!ind) return undefined;
  const eu = ind.aggregate.EUU;
  const teile = [
    `Deutschland ${nf(ind.laender.DEU?.[0] ?? NaN)}`,
    eu ? `EU ${nf(eu[0])}` : undefined,
    ind.laender.BRA ? `Brasilien ${nf(ind.laender.BRA[0])}` : undefined,
    `Welt-Median ${nf(ind.median)}`,
  ].filter((x): x is string => !!x && !x.includes("NaN"));
  return `Zum Vergleich (${ind.einheit}, Stand ${ind.tur.jahr}): Türkei ${nf(ind.tur.wert)}, ${teile.join(", ")}. Quelle: Weltbank.`;
}

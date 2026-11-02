import { t } from "../../i18n";
import type { IconName } from "../icons";
import type { AktenReiterId } from "./Akte";

export const AKTEN_PROFILE={
  wirtschaft:"bank",gesellschaft:"menge",recht:"waage",regierung:"kuppel",sicherheit:"siegel",
  aussen:"haende",land:"karte",wissen:"buch",medien:"zeitung",
} as const satisfies Record<string,IconName>;

export function aktenProfil(bereich:string) {
  const bekannt=Object.hasOwn(AKTEN_PROFILE,bereich);
  const id=bekannt?bereich:"allgemein";
  return {titel:t(`akneu.${id}.titel`),icon:bekannt?AKTEN_PROFILE[bereich as keyof typeof AKTEN_PROFILE]:"akte" as IconName,
    reiter:(r:AktenReiterId)=>r==="instrumente"?t("akneu.handeln"):t(`akneu.${id}.${r}`)};
}

/** Die bestehenden Ansichten behalten ihre Kennung und damit ihre bisherigen Sprungziele. */
export const ZUGANG_ICON:Record<string,IconName>={
  zentralbank:"bank",haushalt:"muenze",inventar:"tausch",waehler:"menge",wahlkampf:"urne",
  gesetze:"feder",parlament:"parlament",beschluesse:"buch",verfassung:"waage",reich_recht:"tempel",
  personen:"person",gespraech:"sprechblase",streitkraefte:"siegel",reich_militaer:"ziel",welt:"haende",
  reich_infra:"kran",netze:"netz",reich_kultur:"tempel",katastrophe:"beben",fokusbaum:"ziel",
  wissensbaum:"buch",programme:"akte",zeitung:"zeitung",behoerden:"kuppel",
};

// Zuordnung der freien Eingabe zum Katalog: Passt „Autobahn bis China“, „Marsmission“ oder „Wohnungsbau in Hatay“ auf ein Katalogvorhaben, soll der
// Katalog gelten (feste Preise, Ketten, Voraussetzungen) und nicht das Schätzblatt der freien Eingabe (sim/grossprojekt.ts). Die Funktion
// ändert nichts und ruft nichts auf; der Aufrufer (Gespräch, Befehle) entscheidet. Vorlagen („reg_…“) brauchen zusätzlich einen Ort:
// Dafür öffnet die Oberfläche die Ortswahl, oder der Aufrufer liest den Ort aus dem Text und ruft `beginneRegional`.

import { REGIONAL_VORLAGEN } from "./regional";
import { TECH_ALLE } from "./technologie";
import { ZUKUNFT_ALLE } from "./zukunft";

export interface KatalogTreffer {
  /** Kennung des Katalogvorhabens oder der Vorlage */
  id: string;
  name: string;
  /** Eine Vorlage braucht einen Ort (`beginneRegional`), ein Katalogvorhaben wird mit `beginne` angelegt */
  vorlage: boolean;
  /** Ein Satz für die Antwort an den Spieler */
  grund: string;
}

const NAMEN = new Map([...ZUKUNFT_ALLE, ...TECH_ALLE, ...REGIONAL_VORLAGEN].map((v) => [v.id, v.name]));

/** Kleinschreibung, ohne Umlaute und Satzzeichen („Straße“ → „strasse“). */
export function falteEingabe(text: string): string {
  return text
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type Regel = [id: string, test: (t: string) => boolean];

const hat = (t: string, ...muster: RegExp[]) => muster.some((m) => m.test(t));
const alle = (t: string, ...muster: RegExp[]) => muster.every((m) => m.test(t));

/** Von der besonderen zur allgemeinen Regel: Die erste, die passt, gilt. */
const REGELN: Regel[] = [
  // ---- Verkehr und Welt
  ["welt_autobahn_china", (t) => alle(t, /(autobahn|strasse|highway|schnellstrasse)/, /(china|seidenstrasse|mittlerer korridor|kasachstan|zentralasien)/)],
  ["welt_hsr_china", (t) => alle(t, /(hochgeschwindigkeit|schnellbahn|eisenbahn|zug|bahn)/, /(china|seidenstrasse|mittlerer korridor|kasachstan|zentralasien)/)],
  ["welt_korridor_abkommen", (t) => alle(t, /(korridor|transit)/, /(abkommen|vertrag)/)],
  ["welt_korridor_terminals", (t) => hat(t, /(kaspi|faehre).*(terminal|hafen|bahn)|terminal.*(kaspi|korridor)/)],
  ["welt_maglev", (t) => hat(t, /(maglev|magnetschweb|hyperloop)/)],
  ["welt_bruecke_zypern", (t) => alle(t, /zypern/, /(bruecke|tunnel|verbindung)/)],
  ["welt_megahafen", (t) => alle(t, /hafen/, /(gross|mega|riesig|welt)/)],
  // ---- Städte
  ["stadt_hauptstadt_neu", (t) => hat(t, /(neue|neuen|neuer) hauptstadt/, /hauptstadt (bauen|gruenden|verlegen)/)],
  ["stadt_unterwasser", (t) => hat(t, /unterwasser ?stadt|meeresstadt|tauchstadt/)],
  ["stadt_satellit_ost", (t) => hat(t, /(satelliten|trabanten|neu) ?stadt/)],
  // ---- Energie und Wasser
  ["energie_fusion_kraftwerk", (t) => alle(t, /fusion/, /(kraftwerk|strom|netz)/)],
  ["energie_fusion_testreaktor", (t) => alle(t, /fusion/, /(test|reaktor|versuch|anlage)/)],
  ["energie_fusion_forschung", (t) => hat(t, /fusion/)],
  ["energie_brennstoffkreislauf", (t) => hat(t, /(anreicher|brennstoff ?kreislauf|wiederaufarbeit)/)],
  ["energie_smr", (t) => hat(t, /(smr|kleine.*reaktor|mini ?reaktor|modulare? reaktor|atomprogramm|kernkraftprogramm|neues atomkraftwerk)/)],
  ["energie_hvdc_europa", (t) => alle(t, /(stromverbund|gleichstrom|hvdc|stromkabel|stromleitung)/, /(europa|eu|bulgarien|griechenland)/)],
  ["wasser_friedensleitung", (t) => hat(t, /friedensleitung|wasser.*(syrien|nahost|nahen osten|jordanien|israel)/)],
  ["wasser_konya", (t) => alle(t, /(konya|zentralanatolien)/, /wasser/)],
  ["wasser_entsalzung", (t) => hat(t, /entsalz/)],
  // ---- Raumfahrt
  ["raum_mars", (t) => hat(t, /\bmars(mission|flug|reise|expedition|basis|kolonie|landung)?\b/)],
  ["raum_aufzug", (t) => hat(t, /(weltraum|raum) ?aufzug|space elevator/)],
  ["raum_mondbasis", (t) => hat(t, /mond ?(basis|station)|basis auf dem mond/)],
  ["raum_orbit_bemannt", (t) => hat(t, /(bemannt|astronaut|kosmonaut|raumfahrer|raumkapsel)/)],
  ["raum_mondsonde", (t) => hat(t, /\bmond\b|mondmission|mondlandung/)],
  ["raum_bahnhof", (t) => hat(t, /(weltraumbahnhof|raketenstart|startplatz|kosmodrom|raketenbahnhof)/)],
  ["raum_traeger", (t) => hat(t, /(traegerrakete|rakete|orbitalrakete)/)],
  ["raum_satelliten", (t) => hat(t, /satellit/)],
  ["raum_agentur", (t) => hat(t, /(raumfahrt|weltraum).*(behoerde|agentur|programm)|raumfahrt|weltraum/)],
  // ---- Künstliche Intelligenz
  ["ki_agi", (t) => hat(t, /\bagi\b|allgemeine kuenstliche intelligenz|superintelligenz/)],
  ["ki_sprachmodell", (t) => hat(t, /sprachmodell|\bllm\b|chatbot/)],
  ["ki_chipfab", (t) => alle(t, /(chip|halbleiter)/, /(fabrik|fertigung|werk)/)],
  ["ki_rechenzentren", (t) => hat(t, /(rechenzentr|datacenter|supercomputer)/)],
  ["ki_verwaltung", (t) => alle(t, /(\bki\b|kuenstliche intelligenz)/, /(verwaltung|behoerde|amt)/)],
  ["ki_justiz", (t) => alle(t, /(\bki\b|kuenstliche intelligenz)/, /(justiz|gericht|richter)/)],
  ["ki_militaer", (t) => alle(t, /(\bki\b|kuenstliche intelligenz)/, /(militaer|armee|heer|drohne|schwarm|waffen)/)],
  ["ki_strategie", (t) => hat(t, /(\bki\b|kuenstliche intelligenz)/)],
  // ---- Technologie
  ["chips_euv", (t) => hat(t, /(lithografie|\beuv\b|belichtungsmaschine)/)],
  ["chips_design", (t) => alle(t, /(chip|halbleiter)/, /(entwurf|design)/)],
  ["quanten_computer", (t) => hat(t, /quanten ?(computer|rechner)/)],
  ["quanten_zentrum", (t) => hat(t, /quant/)],
  ["robotik_offensive", (t) => hat(t, /(roboter|robotik|automatisierungsoffensive)/)],
  ["nano_zentrum", (t) => hat(t, /(nano|graphen)/)],
  ["batt_zellfabrik", (t) => hat(t, /(batterie|akku|zellfabrik)/)],
  ["h2_elektrolyse", (t) => hat(t, /(wasserstoff|elektrolyse)/)],
  ["bio_gentherapie", (t) => hat(t, /gentherapie/)],
  ["bio_genomik", (t) => hat(t, /(genom|erbgut)/)],
  ["bio_impfstoffwerk", (t) => hat(t, /(impfstoff|wirkstoffwerk|pharmawerk)/)],
  ["bio_saatgut", (t) => hat(t, /(saatgut|agrarbiotech|pflanzenzucht)/)],
  ["bio_medizintechnik", (t) => hat(t, /medizintechnik/)],
  ["meer_tiefseebergbau", (t) => hat(t, /(tiefseebergbau|manganknollen|meeresbodenbergbau)/)],
  ["meer_uboote", (t) => hat(t, /(u boot|uboot|unterseeboot)/)],
  ["meer_uwdrohnen", (t) => hat(t, /(unterwasserdrohne|uuv|meeresboden ueberwach)/)],
  ["meer_tiefsee_gas", (t) => alle(t, /(tiefsee|schwarzen meer|sakarya)/, /(gas|bohr|foerder)/)],
  ["meer_offshore_wind", (t) => hat(t, /(offshore|windpark.*(meer|see|kueste))/)],
  ["meer_hafenautomatisierung", (t) => hat(t, /hafen ?automatisier|automatisier.*hafen/)],
  ["meer_institut", (t) => hat(t, /(meeresforsch|ozeanograf|forschungsschiff)/)],
  ["luft_flugtaxi", (t) => hat(t, /(flugtaxi|lufttaxi|air ?taxi)/)],
  ["luft_triebwerke", (t) => hat(t, /triebwerk/)],
  ["luft_regionalflugzeug", (t) => hat(t, /(regionalflugzeug|passagierflugzeug|verkehrsflugzeug|flugzeug bauen)/)],
  // ---- Programme für Regionen (brauchen einen Ort)
  ["reg_stadterneuerung", (t) => hat(t, /(stadtsanierung|stadterneuerung|altstadt.*saniere|viertel.*saniere)/)],
  ["reg_wiederaufbau", (t) => hat(t, /(wiederaufbau|erdbebenertuechtigung|erdbebensicher)/)],
  ["reg_kultur", (t) => hat(t, /(restaurier.*(staette|region|programm)|denkmal.*restaurier)/)],
  ["reg_damm", (t) => hat(t, /(staudamm|stausee|damm und bewaesserung|bewaesserung)/)],
  ["reg_wasser", (t) => hat(t, /(wasserleitung|klaeranlage|wasserspeicher|wasserversorgung bauen)/)],
  ["reg_krankenhaus", (t) => hat(t, /(krankenhaus|klinik)/)],
  ["reg_schulbau", (t) => hat(t, /schulbau/) || alle(t, /schul/, /(bau|errichte|neue|ausbau)/)],
  ["reg_wohnungsbau", (t) => hat(t, /(wohnungsbau|sozialwohnung)/) || alle(t, /wohnung/, /(bau|errichte|neue)/)],
  ["reg_bahn", (t) => hat(t, /(bahnausbau|bahnstrecke)/) || alle(t, /(bahn|zugstrecke)/, /(bau|ausbau|neue|errichte)/)],
  ["reg_strassen", (t) => hat(t, /(strassenbau|umgehungsstrasse)/) || alle(t, /(strasse|bruecke|autobahn)/, /(bau|neue|ausbau|errichte)/)],
  ["reg_strom", (t) => hat(t, /(stromnetzausbau|stromnetz ausbauen|umspannwerk)/)],
  ["reg_breitband", (t) => hat(t, /(breitband|glasfaser|mobilfunkmast)/)],
  ["reg_foerderung", (t) => hat(t, /(regionalfoerderung|strukturschwache|ansiedlung)/)],
];

/**
 * Gibt das Katalogvorhaben zurück, das zur freien Eingabe passt, sonst `null`.
 * Beispiele: „Autobahn bis China“ → welt_autobahn_china; „Marsmission“ → raum_mars; „Baue Schulen in Hatay“ → reg_schulbau (Vorlage, Ort Hatay).
 */
export function katalogFuerEingabe(text: string): KatalogTreffer | null {
  const t = falteEingabe(text);
  if (!t) return null;
  for (const [id, test] of REGELN) {
    if (!test(t)) continue;
    const name = NAMEN.get(id) ?? id;
    const vorlage = id.startsWith("reg_");
    return {
      id,
      name,
      vorlage,
      grund: vorlage ? `Dafür gibt es ein Programm: „${name}“. Es lässt sich für eine Provinz, eine Region oder das ganze Land anlegen.` : `Dafür gibt es ein Vorhaben im Katalog: „${name}“, mit festen Preisen, Voraussetzungen und Stufen.`,
    };
  }
  return null;
}

/** Alle Kennungen, auf die die Zuordnung zeigen kann (für Tests). */
export const KATALOG_ZIELE: string[] = REGELN.map(([id]) => id);

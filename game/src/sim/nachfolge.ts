// Entlassen, Zurücktreten, Ernennen: Ein Wechsel im Amt ist ein Prozess mit Kandidaten und Folgen. Wer geht, nimmt Groll mit und kann später
// aussagen; sein Lager ärgert sich; die Märkte reagieren auf Wechsel in Finanzen und Wirtschaft; der Nachfolger arbeitet sich zwei Monate ein
// und bringt Stil, Fähigkeit, Ehrgeiz und ein Lager mit. Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung).

import { t } from "../i18n";
import { addLog } from "./log";
import { clamp } from "./economy";
import { kannZahlen } from "./kapital";
import { vertrauenAendern, wirke } from "./wirkung";
import { Rng } from "./rng";
import { besetzeNeu, ehemaligeMerken, figur, neuerName, vergebeneNamen } from "./figuren";
import { setzeAusscheidenHaken } from "./gespraeche";
import { AEMTER, eigenVon, hashZahl, loyalitaetVerschieben } from "./personen";
import type { Kandidat, LagerArt, Stil } from "./personen-typen";
import type { Figur } from "./spiel-typen";
import type { World } from "./types";
import { offeneRessortVorfaelle, ressortEntlassungStart, ressortEntlassungEnde, ressortEntlassungsHinweise } from "./ressortpolitik";
import { neuanfangGrund } from "./aufmerksamkeit";

interface Archetyp {
  key: "fach" | "vertrauter" | "ehrgeizig";
  stile: Stil[];
  fae: [number, number];
  ehr: [number, number];
  loy: [number, number];
  /** Lager: eigenes Ressort-Lager, Vertraute des Präsidenten oder Partei */
  lager: (own: LagerArt) => LagerArt;
  markt: { finanzen: number; wirtschaft: number };
  echo: number;
  pk: number;
  staerke: (ressort: string, g: "f" | "m") => string;
  schwaeche: (g: "f" | "m") => string;
}

const ARCHETYPEN: Archetyp[] = [
  {
    key: "fach", stile: ["nuechtern", "vorsichtig", "streng"], fae: [74, 88], ehr: [25, 50], loy: [42, 54], lager: (own) => own,
    markt: { finanzen: -25, wirtschaft: -10 }, echo: 2, pk: 4,
    staerke: (r) => t("n1.nf.fach.staerke", { ressort: r }),
    schwaeche: () => t("n1.nf.fach.schwaeche"),
  },
  {
    key: "vertrauter", stile: ["loyal"], fae: [52, 66], ehr: [35, 55], loy: [66, 78], lager: () => "praesident",
    markt: { finanzen: 30, wirtschaft: 12 }, echo: 0, pk: 3,
    staerke: () => t("n1.nf.vertrauter.staerke"),
    schwaeche: () => t("n1.nf.vertrauter.schwaeche"),
  },
  {
    key: "ehrgeizig", stile: ["machtbewusst", "eitel"], fae: [62, 76], ehr: [76, 92], loy: [48, 60], lager: () => "partei",
    markt: { finanzen: 10, wirtschaft: 5 }, echo: 2, pk: 5,
    staerke: (_r, g) => t("n1.nf.ehrgeizig.staerke", { g }),
    schwaeche: (g) => t("n1.nf.ehrgeizig.schwaeche", { g }),
  },
];

/** Ämter mit eigener Herkunft der drei Kandidaten (Katalog n1.nf.herkunft.<amt>.<typ>, Form nach Geschlecht); die übrigen nehmen „sonst“. */
const HERKUNFT_AEMTER = new Set(["finanzen", "inneres", "aussen", "stab", "justiz", "generalstab", "wirtschaft"]);

const zufall = (w: World, f: Figur, extra: string): number => hashZahl(`${w.seed}|${f.id}|${eigenVon(w, f).seit}|${f.name}|${extra}`);

const between = (a: number, b: number, u: number): number => Math.round(a + (b - a) * u);

/** Drei Kandidaten für ein Amt: fachlich stark, vertraut oder ehrgeizig. Stabil, solange der Amtsinhaber gleich bleibt. */
export function kandidatenFuer(w: World, amt: Figur["amt"]): Kandidat[] {
  const f = figur(w, amt);
  if (!f) return [];
  const d = AEMTER[amt];
  const herkunftAmt = HERKUNFT_AEMTER.has(amt) ? amt : "sonst";
  const g = f.weiblich ? "f" : "m";
  const ressortName = t(`daten.amt.${amt}.ressort`);
  const rng = new Rng(Math.floor(zufall(w, f, "kand") * 2147483647));
  const benutzt = vergebeneNamen(w);
  return ARCHETYPEN.map((a): Kandidat => {
    const u = (s: string) => zufall(w, f, `${a.key}|${s}`);
    const name = neuerName(rng, benutzt, f.weiblich);
    const markt = amt === "finanzen" ? a.markt.finanzen : amt === "wirtschaft" ? a.markt.wirtschaft : 0;
    return {
      id: `${amt}-${a.key}`,
      name,
      weiblich: !!f.weiblich,
      stil: a.stile[Math.floor(u("stil") * a.stile.length)]!,
      faehigkeit: between(a.fae[0], a.fae[1], u("fae")),
      ehrgeiz: between(a.ehr[0], a.ehr[1], u("ehr")),
      lager: a.lager(d.lager),
      loyalitaet: between(a.loy[0], a.loy[1], u("loy")),
      herkunft: t(`n1.nf.herkunft.${herkunftAmt}.${a.key}`, { g }),
      staerke: a.staerke(ressortName, g),
      schwaeche: a.schwaeche(g),
      markt,
      lagerEcho: a.echo,
      pk: a.pk,
    };
  });
}

export const KOMMISSARISCH_PK = 2;

/** Was eine Entlassung bewirkt, in Worten mit Zahlen (für die Oberfläche vor der Entscheidung). */
export function entlassungsFolgen(w: World, amt: Figur["amt"]): string[] {
  const f = figur(w, amt);
  if (!f) return [];
  const e = eigenVon(w, f);
  const gleich = (w.spiel?.figuren ?? []).filter((x) => x !== f && x.imAmt && eigenVon(w, x).lager === e.lager);
  const out = [t("n1.nf.folge.geht", { name: f.name, groll: e.groll >= 30 || f.loyalitaet < 35 ? "ja" : "nein", wert: Math.round(Math.min(100, 35 + e.groll * 0.5 + (f.loyalitaet < 30 ? 20 : 0))) })];
  if (gleich.length) out.push(t("n1.nf.folge.lager", { namen: gleich.map((x) => x.name).join(", "), lager: lagerKurz(e.lager), n: 4 }));
  out.push(t("n1.nf.folge.vertrauen", { n: 0.4 }));
  if (amt === "finanzen") out.push(t("n1.nf.folge.markt.finanzen", { rp: 30, gl: 0.03 }));
  else if (amt === "wirtschaft") out.push(t("n1.nf.folge.markt.wirtschaft", { rp: 10 }));
  out.push(t("n1.nf.folge.einarbeitung", { p: 25 }));
  out.push(...ressortEntlassungsHinweise(w,f));
  return out;
}

/** Lager in Kurzform (Katalog n1.nf.lager.*). */
const lagerKurz = (l: LagerArt): string => t(`n1.nf.lager.${l}`);

export interface WechselErgebnis {
  ok: boolean;
  text: string;
  why?: string;
  folgen: string[];
}

function verlasse(w: World, f: Figur, grund: string, groll?: number): void {
  const e = eigenVon(w, f);
  ehemaligeMerken(w, f, grund, groll);
  for (const x of w.spiel!.figuren) if (x !== f && x.imAmt && eigenVon(w, x).lager === e.lager && AEMTER[x.amt].regierungsamt) loyalitaetVerschieben(x, -4);
  vertrauenAendern(w, -0.4);
}

function marktFolgen(w: World, amt: Figur["amt"]): void {
  if (amt === "finanzen") {
    w.economy.riskPremium += 30;
    w.economy.credibility = clamp(w.economy.credibility - 0.03, 0.05, 0.95);
  } else if (amt === "wirtschaft") {
    w.economy.riskPremium += 10;
    w.economy.credibility = clamp(w.economy.credibility - 0.01, 0.05, 0.95);
  } else {
    w.economy.credibility = clamp(w.economy.credibility - 0.01, 0.05, 0.95);
  }
}

function ernennen(w: World, f: Figur, k: Kandidat): void {
  besetzeNeu(w, f, { name: k.name, weiblich: k.weiblich, loyalitaet: k.loyalitaet, stil: k.stil, faehigkeit: k.faehigkeit, ehrgeiz: k.ehrgeiz, lager: k.lager, notiz: t("n1.nf.notiz.ernannt", { herkunft: k.herkunft }) });
  if (k.markt) w.economy.riskPremium = Math.max(0, w.economy.riskPremium + k.markt);
  if (k.lagerEcho) for (const x of w.spiel!.figuren) if (x !== f && x.imAmt && eigenVon(w, x).lager === k.lager && AEMTER[x.amt].regierungsamt) loyalitaetVerschieben(x, k.lagerEcho);
}

/**
 * Entlässt die Amtsinhaberin und ernennt einen Kandidaten (`kandidatId`) oder setzt eine kommissarische Leitung ein (`null`).
 * Kostet die Ernennung in Kapital; die Folgen wirken sofort und später (Ehemalige, Lager, Märkte).
 */
export function entlasse(w: World, amt: Figur["amt"], kandidatId: string | null, rabatt = 0): WechselErgebnis {
  const sp = w.spiel;
  const f = figur(w, amt);
  const leer = (text: string): WechselErgebnis => ({ ok: false, text, folgen: [] });
  if (!sp || !f) return leer(t("n1.nf.fehler.keinAmt"));
  if (!AEMTER[amt].entlassbar) return leer(t(amt === "zentralbank" ? "n1.nf.fehler.zentralbank" : "n1.nf.fehler.nichtEntlassbar"));
  const k = kandidatId === null ? null : kandidatenFuer(w, amt).find((x) => x.id === kandidatId);
  if (kandidatId !== null && !k) return leer(t("n1.nf.fehler.keinKandidat"));
  const pk = Math.max(1,(k ? k.pk : KOMMISSARISCH_PK)-Math.max(0,Number.isFinite(rabatt)?rabatt:0));
  if (!kannZahlen(sp.kapital, pk)) return leer(t("n1.nf.fehler.kapitalWechsel", { pk, da: Math.floor(sp.kapital) }));
  if(offeneRessortVorfaelle(w).some(v=>v.figur===f.id)){const pause=neuanfangGrund(w);if(pause)return leer(pause);}
  const ressortVorher=ressortEntlassungStart(w,f);
  sp.kapital -= pk;
  const alt = `${f.rolle} ${f.name}`;
  const folgen = entlassungsFolgen(w, amt);
  verlasse(w, f, t("n1.nf.grund.entlassen"));
  marktFolgen(w, amt);
  if (k) {
    ernennen(w, f, k);
    folgen.push(t("n1.nf.folge.uebernimmt", { name: k.name, herkunft: k.herkunft, staerke: k.staerke }));
  } else {
    const rng = new Rng(Math.floor(zufall(w, f, "interim") * 2147483647));
    const benutzt = vergebeneNamen(w);
    besetzeNeu(w, f, { name: neuerName(rng, benutzt, f.weiblich), loyalitaet: 50, faehigkeit: 45, ehrgeiz: 20, kommissarisch: true, notiz: t("n1.nf.notiz.kommEntlassung", { alt }) });
    folgen.push(t("n1.nf.folge.kommissarisch"));
  }
  const neu = `${f.rolle} ${f.name}`;
  const art = k ? "ernennt" : "kommissarisch";
  const text = t("n1.nf.log.entlassen", { alt, neu, art });
  addLog(w, "entscheidung", text, t(amt === "finanzen" ? "n1.nf.log.entlassen.whyFinanzen" : "n1.nf.log.entlassen.why"));
  ressortEntlassungEnde(w,f,ressortVorher);
  return { ok: true, text: t("n1.nf.ergebnis.entlassen", { alt, neu, art }), why: t("n1.nf.kosten", { pk }), folgen };
}

/** Ernennt einen Nachfolger für eine kommissarische Leitung. */
export function ernenneNachfolger(w: World, amt: Figur["amt"], kandidatId: string): WechselErgebnis {
  const sp = w.spiel;
  const f = figur(w, amt);
  const leer = (text: string): WechselErgebnis => ({ ok: false, text, folgen: [] });
  if (!sp || !f) return leer(t("n1.nf.fehler.keinAmt"));
  if (!f.eigen?.kommissarisch) return leer(t("n1.nf.fehler.besetzt"));
  const k = kandidatenFuer(w, amt).find((x) => x.id === kandidatId);
  if (!k) return leer(t("n1.nf.fehler.keinKandidat"));
  const pk = Math.max(1, k.pk - 1);
  if (!kannZahlen(sp.kapital, pk)) return leer(t("n1.nf.fehler.kapitalErnennung", { pk, da: Math.floor(sp.kapital) }));
  sp.kapital -= pk;
  const alt = t("n1.nf.altKommissarisch", { rolle: f.rolle, name: f.name });
  ernennen(w, f, k);
  addLog(w, "entscheidung", t("n1.nf.log.ernennt", { rolle: f.rolle, name: f.name, alt }), t("n1.nf.log.ernennt.why"));
  return { ok: true, text: t("n1.nf.ergebnis.ernannt", { name: f.name }), why: t("n1.nf.kosten", { pk }), folgen: [`${k.name} (${k.herkunft}): ${k.staerke}`] };
}

/** Der Rücktritt im Streit (nach einem Ultimatum, einer Drohung oder einem Skandal): eine kommissarische Leitung übernimmt, der Vorgänger nimmt Groll mit. */
export function ausscheiden(w: World, f: Figur, grund: string): void {
  if (!w.spiel || !AEMTER[f.amt].regierungsamt) return;
  const alt = `${f.rolle} ${f.name}`;
  const rng = new Rng(Math.floor(zufall(w, f, "rueck") * 2147483647));
  const benutzt = vergebeneNamen(w);
  verlasse(w, f, grund, Math.min(100, 55 + eigenVon(w, f).groll * 0.4));
  marktFolgen(w, f.amt);
  besetzeNeu(w, f, { name: neuerName(rng, benutzt, f.weiblich), loyalitaet: 50, faehigkeit: 45, ehrgeiz: 20, kommissarisch: true, notiz: t("n1.nf.notiz.kommRuecktritt", { alt }) });
  addLog(w, "ereignis", t("n1.nf.log.ruecktritt", { alt }), t("n1.nf.log.ruecktritt.why", { grund }));
}

setzeAusscheidenHaken((w, f, grund) => ausscheiden(w, f, grund));

/** Für Chat und Sprachmodell: entlässt und wählt einen Kandidaten nach dem Zufallsstrom (ohne Auswahlfenster). */
export function entlasseSchnell(w: World, amt: Figur["amt"], rng: Rng): WechselErgebnis {
  const ks = kandidatenFuer(w, amt);
  if (!ks.length) return { ok: false, text: t("n1.nf.fehler.keinAmt"), folgen: [] };
  const k = ks[Math.min(ks.length - 1, Math.floor(rng.next() * ks.length))]!;
  return entlasse(w, amt, k.id);
}

/** Wirkung einer Entlassung für die Zentralbank: hier nur ein Hinweis, der Ablauf steht in Zentralbank und Haushalt. */
export const kannEntlassen = (f: Figur): boolean => AEMTER[f.amt].entlassbar;

// ---------------------------------------------------------------------------
// Ehemalige

/** Monatlich: Wer im Streit gegangen ist, redet vielleicht. */
export function ehemaligeMonat(w: World): void {
  const sp = w.spiel;
  if (!sp?.ehemalige) return;
  for (const x of sp.ehemalige) {
    if (x.ausgepackt) continue;
    x.groll = Math.max(0, x.groll - 0.5);
    if (x.groll < 55 || x.ehrgeiz < 40) continue;
    const p = 0.035 + (x.groll - 55) / 600;
    if (hashZahl(`${w.seed}|${x.name}|${w.day}|packt`) < p) {
      x.ausgepackt = true;
      vertrauenAendern(w, -1);
      wirke(w, "legitimitaet", -0.8);
      wirke(w, "polarisierung", 0.5);
      const titel = t("n1.nf.auspacken.titel", { rolle: x.rolle, name: x.name });
      addLog(w, "ereignis", t("n1.nf.auspacken.text", { titel, g: x.weiblich ? "f" : "m", amt: x.rolle.replace(/^(Der|Die) /, "") }), t("n1.nf.auspacken.why"));
      sp.chronik.push({ tag: w.day, datum: w.date, titel, ausgang: t("n1.nf.auspacken.ausgang") });
    }
  }
}


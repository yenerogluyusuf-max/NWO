import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
//#region src/sim/economy.ts
const PARAMS = {
	/** Neutraler Realzins in % */
	neutralRealRate: 3,
	/** Ausländische Inflation in % (für den Inflationsabstand beim Wechselkurs) */
	foreignInflation: 2.5,
	/** Z1: Wirkung des Realzinses auf die Auslastung (je Prozentpunkt, pro Monat) */
	rateOnGap: .02,
	/**
	* Z1: Sättigung des Zinskanals (Prozentpunkte Realzins): Bei extremen Realzinsen
	* (2021–2023: ex ante −30 bis −50) ist die Transmission über den Kreditkanal begrenzt
	* (KKM, Finanzrepression, staatliche Kreditgarantien). Kalibrierung WIR-1: Ohne Deckel
	* erzeugt der negative Realzins von 2022 einen Dauerstimulus von über +2 Punkten/Monat.
	*/
	rateTransmissionCap: 15,
	/** Z1: Verzögerung in Monaten */
	rateLagMonths: 6,
	/** Persistenz der Auslastung pro Monat */
	gapPersistence: .92,
	/** Z6: Wirkung zusätzlicher Staatsausgaben (% BIP) auf die Auslastung */
	fiscalOnGap: .1,
	/** Z2: Wirkung der Auslastung auf die Inflation */
	gapOnInflation: .5,
	/** Z5: Weitergabe einer übermäßigen Abwertung an die Inflation */
	fxPassThrough: .37,
	/** Anpassungsgeschwindigkeit der Inflation pro Monat */
	inflationSpeed: .22,
	/** Z3: Anpassungsgeschwindigkeit der Erwartungen pro Monat */
	expectationSpeed: .3,
	/** Z9: Okun-Koeffizient (monatlich) */
	okun: .07,
	/** Natürliche Arbeitslosenquote in % */
	naturalUnemployment: 9.4,
	/** Z4: Wirkung des Realzinses auf die Abwertung (% p. a. je Prozentpunkt) */
	carryOnFx: 1,
	/** Tägliche Schwankung des Wechselkurses (Standardabweichung, Anteil) */
	fxNoise: .0015,
	/** Langfristiges Inflationsziel der Zentralbank in % */
	longRunTarget: 5,
	/** Monatliche Annäherung der Zwischenziele an das langfristige Ziel (ergibt etwa 24, 15, 9, 5) */
	targetGlide: .04,
	/**
	* ZEI-4 (Spielparameter, Befund der Spielbarkeitsanalyse 29.09.): Dauerhafte Politikkosten über etwa 1 % des BIP
	* lesen die Märkte als strukturelles Defizit — Basispunkte Risikoaufschlag je Prozentpunkt darüber.
	* Ohne diesen Kanal schmolz die Schuldenquote (Z7) bei hohem Nominalwachstum weg, und „alles auf Maximum“ blieb folgenlos.
	*/
	politiklastAufRisiko: 130
};
/** Wirkung der Außenwelt (Indizes, Start = 100). Platzhalter der Kalibrierung. */
const AUSSEN = {
	/** Prozentpunkte Inflation je Indexpunkt Energiepreis über 100 (Energieimporte) */
	oelAufInflation: .03,
	/** Auslastung (Prozentpunkte je Monat) je Indexpunkt Energiepreis */
	oelAufAuslastung: .004,
	/** Auslastung (Prozentpunkte je Monat) je Indexpunkt EU-Nachfrage */
	euAufAuslastung: .012,
	/** Basispunkte Risikoaufschlag je Indexpunkt Weltzins über 100 */
	weltzinsAufRisiko: 2
};
/** Potenzialwachstum einschließlich der Wirkung des Politiknetzes. */
function potential(e) {
	return e.potentialGrowth + e.potentialShift;
}
/** Realzins in Prozentpunkten. */
function realRate(e) {
	return e.policyRate - e.expectedInflation;
}
/** Z4: tägliche Veränderung des Wechselkurses (Anteil, z. B. 0,001 = 0,1 %). */
function dailyDepreciation(e, rng) {
	const inflationGap = e.expectedInflation - PARAMS.foreignInflation;
	const carry = PARAMS.carryOnFx * (realRate(e) - PARAMS.neutralRealRate);
	const risk = (e.riskPremium - 250) / 100;
	const annual = inflationGap - carry + risk;
	const noise = rng.normal(PARAMS.fxNoise * (1.5 - e.credibility));
	return annual / 100 / 365 + noise;
}
/** Z8: täglicher Risikoaufschlag, zieht zum fundamentalen Wert. */
function dailyRiskPremium(e, rng) {
	const fundamental = 150 + 2.5 * Math.max(0, e.expectedInflation - 10) + 2 * Math.max(0, e.debtRatio - 40) + 200 * (1 - e.credibility) + PARAMS.politiklastAufRisiko * Math.max(0, e.policyCost - 2) + AUSSEN.weltzinsAufRisiko * ((e.weltzins ?? 100) - 100);
	return e.riskPremium + .02 * (fundamental - e.riskPremium) + rng.normal(2);
}
/** Monatliche Fortschreibung der Realwirtschaft (Z1, Z2, Z3, Z5, Z6, Z7, Z9). */
function monthlyUpdate(e, history, rng) {
	const lagged = history[history.length - PARAMS.rateLagMonths];
	const laggedRealRate = clamp(lagged ? lagged.realRate : realRate(e), -PARAMS.rateTransmissionCap, PARAMS.rateTransmissionCap);
	e.outputGap = PARAMS.gapPersistence * e.outputGap - PARAMS.rateOnGap * (laggedRealRate - PARAMS.neutralRealRate) + PARAMS.fiscalOnGap * (e.fiscalImpulse + e.policyCost) + AUSSEN.euAufAuslastung * ((e.euNachfrage ?? 100) - 100) - AUSSEN.oelAufAuslastung * ((e.oel ?? 100) - 100) + rng.normal(.25);
	const yearAgo = history[history.length - 12];
	e.fxChange12 = yearAgo ? (e.usdTry / yearAgo.usdTry - 1) * 100 : e.inflation - PARAMS.foreignInflation;
	const excessDepreciation = e.fxChange12 - (e.inflation - PARAMS.foreignInflation);
	const anchor = e.expectedInflation + PARAMS.gapOnInflation * e.outputGap + PARAMS.fxPassThrough * excessDepreciation + e.costPush + AUSSEN.oelAufInflation * ((e.oel ?? 100) - 100);
	const previousInflation = e.inflation;
	e.inflation += PARAMS.inflationSpeed * (anchor - e.inflation) + rng.normal(.3);
	e.inflation = Math.max(-2, e.inflation);
	e.inflationTarget += PARAMS.targetGlide * (PARAMS.longRunTarget - e.inflationTarget);
	const credibleAnchor = e.credibility * e.inflationTarget + (1 - e.credibility) * e.inflation;
	e.expectedInflation += PARAMS.expectationSpeed * (credibleAnchor - e.expectedInflation);
	const r = realRate(e);
	if (r > 1 && e.inflation < previousInflation) e.credibility += .01;
	if (r < 0) e.credibility -= .012;
	if (e.policyCost > 1.75) e.credibility -= .045 * Math.min(2.5, e.policyCost - 1.75);
	e.credibility = clamp(e.credibility, .05, .95);
	const gapYearAgo = yearAgo ? yearAgo.outputGap : e.outputGap;
	e.growth = potential(e) + (e.outputGap - gapYearAgo);
	e.unemployment += .03 * (PARAMS.naturalUnemployment - e.unemployment) - PARAMS.okun * (e.growth - potential(e));
	e.unemployment = clamp(e.unemployment, 3, 30);
	const nominalGrowth = (e.growth + e.inflation) / 100;
	e.debtRatio += (e.deficit + e.fiscalImpulse + e.policyCost + (e.zinsMehrlast ?? 0)) / 12 - e.debtRatio * nominalGrowth / 12;
	e.debtRatio = Math.max(0, e.debtRatio);
}
/** Gewichte der Reaktionsregel je Haltung der Führung. */
const PPK_GEWICHTE = {
	vorsichtig: {
		infl: .5,
		gap: .2,
		bias: 0
	},
	ausgewogen: {
		infl: .5,
		gap: .5,
		bias: 0
	},
	gefuegig: {
		infl: .2,
		gap: .8,
		bias: -8
	}
};
/** Der Zins, auf den die Regel der Bank zielt (vor der Glättung), in %. */
function ppkZiel(e, stance) {
	const w = PPK_GEWICHTE[stance];
	return PARAMS.neutralRealRate + e.expectedInflation + w.infl * (e.inflation - e.inflationTarget) + w.gap * e.outputGap + w.bias;
}
function clamp(x, min, max) {
	return Math.min(max, Math.max(min, x));
}
//#endregion
//#region src/sim/rng.ts
var Rng = class {
	state;
	constructor(state) {
		this.state = state;
	}
	/** Gleichverteilt in [0, 1). */
	next() {
		this.state = this.state + 1831565813 | 0;
		let r = Math.imul(this.state ^ this.state >>> 15, this.state | 1);
		r ^= r + Math.imul(r ^ r >>> 7, r | 61);
		return ((r ^ r >>> 14) >>> 0) / 4294967296;
	}
	/** Normalverteilt mit Mittelwert 0 und Standardabweichung sd. */
	normal(sd = 1) {
		const u = Math.max(this.next(), 1e-12);
		const v = this.next();
		return sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
	}
	/** Gleichverteilt in [min, max]. */
	between(min, max) {
		return min + (max - min) * this.next();
	}
};
//#endregion
//#region src/sim/dates.ts
const DAY_MS = 864e5;
function addDays(isoDate, days) {
	const t = Date.parse(isoDate + "T00:00:00Z") + days * DAY_MS;
	return new Date(t).toISOString().slice(0, 10);
}
function dayOfMonth(isoDate) {
	return Number(isoDate.slice(8, 10));
}
function monthOf(isoDate) {
	return isoDate.slice(0, 7);
}
/** Vormonat im Format JJJJ-MM. */
function previousMonth(month, back = 1) {
	let y = Number(month.slice(0, 4));
	let m = Number(month.slice(5, 7)) - back;
	while (m < 1) {
		m += 12;
		y -= 1;
	}
	return `${y}-${String(m).padStart(2, "0")}`;
}
//#endregion
//#region scripts/lernfaelle.ts
function kalibrierungsPfad(datei) {
	const kandidaten = [
		fileURLToPath(new URL(`../../kalibrierung/${datei}`, import.meta.url)),
		fileURLToPath(new URL(`../../../kalibrierung/${datei}`, import.meta.url)),
		`${process.cwd()}/../kalibrierung/${datei}`,
		`${process.cwd()}/kalibrierung/${datei}`
	];
	for (const p of kandidaten) if (existsSync(p)) return p;
	throw new Error(`kalibrierung/${datei} nicht gefunden (versucht: ${kandidaten.join(", ")})`);
}
/** Einfacher CSV-Feld-Splitter mit Anführungszeichen (keine eingebetteten Zeilenumbrüche im Bestand). */
function splitFelder(zeile) {
	const out = [];
	let cur = "";
	let q = false;
	for (const ch of zeile) if (q) {
		if (ch === "\"") q = false;
		else cur += ch;
	} else if (ch === "\"") q = true;
	else if (ch === ",") {
		out.push(cur);
		cur = "";
	} else cur += ch;
	out.push(cur);
	return out;
}
function zahl(x) {
	if (x === void 0 || x.trim() === "") return void 0;
	const v = Number(x);
	return Number.isFinite(v) ? v : void 0;
}
let zeitreihenCache = null;
function ladeZeitreihen(pfad = kalibrierungsPfad("zeitreihen_2018_2026.csv")) {
	if (zeitreihenCache && pfad.endsWith("zeitreihen_2018_2026.csv")) return zeitreihenCache;
	const zeilen = readFileSync(pfad, "utf-8").split(/\r?\n/).filter((l) => l.trim() !== "");
	const kopf = splitFelder(zeilen[0]);
	const idx = (name) => kopf.indexOf(name);
	const map = /* @__PURE__ */ new Map();
	for (const zeile of zeilen.slice(1)) {
		const f = splitFelder(zeile);
		const monat = f[idx("monat")];
		map.set(monat, {
			monat,
			...zahl(f[idx("tuefe_yoy")]) !== void 0 ? { tuefe: zahl(f[idx("tuefe_yoy")]) } : {},
			...f[idx("tuefe_est")] !== void 0 ? { tuefeEst: f[idx("tuefe_est")] === "true" } : {},
			...zahl(f[idx("leitzins")]) !== void 0 ? { leitzins: zahl(f[idx("leitzins")]) } : {},
			...zahl(f[idx("usdtry")]) !== void 0 ? { usdtry: zahl(f[idx("usdtry")]) } : {},
			...zahl(f[idx("cds_5y")]) !== void 0 ? { cds: zahl(f[idx("cds_5y")]) } : {},
			...zahl(f[idx("bip_yoy_quartal")]) !== void 0 ? { bip: zahl(f[idx("bip_yoy_quartal")]) } : {},
			...zahl(f[idx("arbeitslosigkeit")]) !== void 0 ? { alq: zahl(f[idx("arbeitslosigkeit")]) } : {}
		});
	}
	if (pfad.endsWith("zeitreihen_2018_2026.csv")) zeitreihenCache = map;
	return map;
}
function indexAm(pfad, monat, basis = 100) {
	let wert = basis;
	for (const p of pfad) if (p.monat <= monat) wert = p.wert;
	return wert;
}
function schuldenAm(anker, monat) {
	const sortiert = [...anker].sort((a, b) => a.monat < b.monat ? -1 : 1);
	let vor = sortiert[0];
	for (const a of sortiert) {
		if (a.monat > monat) {
			const spanne = Date.parse(a.monat + "-01T00:00:00Z") - Date.parse(vor.monat + "-01T00:00:00Z");
			const fort = Date.parse(monat + "-01T00:00:00Z") - Date.parse(vor.monat + "-01T00:00:00Z");
			return vor.wert + (a.wert - vor.wert) * fort / Math.max(1, spanne);
		}
		vor = a;
	}
	return vor.wert;
}
/** Wendet Rate-Vorgabe, Schocks und Außenindizes eines Monats an (zum Monatsersten). */
function monatsTreiber(fall, e, monat, zeile, aktiv) {
	if (zeile?.leitzins !== void 0) e.policyRate = zeile.leitzins;
	for (const s of fall.schocks.filter((x) => x.monat === monat)) if (s.art === "fx") {
		e.usdTry *= 1 + s.wert;
		e.eurTry *= 1 + s.wert;
	} else if (s.art === "risiko") e.riskPremium = clamp(e.riskPremium + s.wert, 50, 2e3);
	else if (s.art === "glaubwuerdigkeit") e.credibility = clamp(e.credibility + s.wert, .05, .95);
	else if (s.art === "inflation") e.inflation = Math.max(-2, e.inflation + s.wert);
	else {
		const dauer = s.monate ?? 1;
		aktiv.push({
			art: s.art,
			wert: s.wert,
			bis: nextMonth(monat, dauer)
		});
	}
	for (let i = aktiv.length - 1; i >= 0; i--) if (aktiv[i].bis < monat) aktiv.splice(i, 1);
	e.fiscalImpulse = aktiv.filter((a) => a.art === "fiskal" || a.art === "nachfrage").reduce((s, a) => s + a.wert, 0);
	e.costPush = aktiv.filter((a) => a.art === "costpush").reduce((s, a) => s + a.wert, 0);
	e.oel = indexAm(fall.oel, monat);
	e.weltzins = indexAm(fall.weltzins, monat);
	e.euNachfrage = indexAm(fall.euNachfrage, monat);
}
/**
* Fährt einen Lernfall vom Stichtag an tageweise. Spiegelt die Schleife aus
* `world.tick` ohne Spielschleife/Politiknetz: täglich Z4/Z8, monatlich Z1–Z9,
* danach Vorgabe/Schocks/Indizes des neuen Monats.
*/
function replay(fall, serien = ladeZeitreihen()) {
	const S = fall.startMonat;
	const zeile = (m) => serien.get(m) ?? fall.historyExtras.find((x) => x.monat === m);
	const start = zeile(S);
	if (!start?.tuefe || !start.leitzins || !start.usdtry || !start.cds || !start.bip || !start.alq) throw new Error(`Lernfall ${fall.id}: Stichtag ${S} hat fehlende CSV-Werte`);
	const e = {
		policyRate: start.leitzins,
		inflation: start.tuefe,
		expectedInflation: fall.erwartungStart,
		inflationTarget: 5,
		credibility: fall.glaubwuerdigkeitStart,
		outputGap: fall.gapStart,
		potentialGrowth: fall.potenzial,
		growth: start.bip,
		unemployment: start.alq,
		usdTry: start.usdtry,
		eurTry: start.usdtry * fall.eurUsd,
		riskPremium: start.cds,
		debtRatio: fall.schuldenStart,
		deficit: fall.defizit,
		fiscalImpulse: 0,
		fxChange12: 0,
		policyCost: 0,
		costPush: 0,
		potentialShift: 0,
		zinsMehrlast: 0,
		oel: indexAm(fall.oel, S),
		euNachfrage: indexAm(fall.euNachfrage, S),
		weltzins: indexAm(fall.weltzins, S)
	};
	const gap12 = fall.gapStart - (start.bip - fall.potenzial);
	const history = [];
	for (let k = 11; k >= 0; k--) {
		const m = previousMonth(S, k);
		const z = zeile(m);
		if (!z?.tuefe || !z.leitzins || !z.usdtry || !z.cds || !z.bip || !z.alq) throw new Error(`Lernfall ${fall.id}: Vorgeschichte ${m} unvollständig`);
		const share = (11 - k) / 11;
		const erwartungProxy = 1.5 + .7 * z.tuefe;
		history.push({
			month: m,
			inflation: z.tuefe,
			growth: z.bip,
			unemployment: z.alq,
			outputGap: gap12 + share * (fall.gapStart - gap12),
			realRate: z.leitzins - erwartungProxy,
			usdTry: z.usdtry,
			eurTry: z.usdtry * fall.eurUsd,
			policyRate: z.leitzins,
			riskPremium: z.cds,
			debtRatio: schuldenAm(fall.schuldenAnker, m)
		});
	}
	e.fxChange12 = (e.usdTry / history[0].usdTry - 1) * 100;
	const rng = new Rng(fall.seed);
	const aktiv = [];
	const reihe = [];
	const protokoll = (monat) => {
		reihe.push({
			monat,
			inflation: e.inflation,
			leitzins: e.policyRate,
			usdTry: e.usdTry,
			cds: e.riskPremium,
			schuldenquote: e.debtRatio,
			alq: e.unemployment,
			wachstum: e.growth,
			erwartung: e.expectedInflation,
			glaubwuerdigkeit: e.credibility,
			fxChange12: e.fxChange12,
			regelzinsAusgewogen: ppkZiel(e, "ausgewogen")
		});
	};
	protokoll(S);
	const ersterMonat = nextMonth(S);
	monatsTreiber(fall, e, ersterMonat, zeile(ersterMonat), aktiv);
	const ende = `${nextMonth(S, fall.monate + 1)}-01`;
	let date = `${ersterMonat}-01`;
	while (date < ende) {
		date = addDays(date, 1);
		const dep = dailyDepreciation(e, rng);
		e.usdTry *= 1 + dep;
		e.eurTry *= 1 + dep + rng.normal(.002);
		e.riskPremium = clamp(dailyRiskPremium(e, rng), 50, 2e3);
		if (dayOfMonth(date) === 1) {
			monthlyUpdate(e, history, rng);
			const abgelaufen = previousMonth(monthOf(date));
			history.push({
				month: abgelaufen,
				inflation: e.inflation,
				growth: e.growth,
				unemployment: e.unemployment,
				outputGap: e.outputGap,
				realRate: e.policyRate - e.expectedInflation,
				usdTry: e.usdTry,
				eurTry: e.eurTry,
				policyRate: e.policyRate,
				riskPremium: e.riskPremium,
				debtRatio: e.debtRatio
			});
			protokoll(abgelaufen);
			monatsTreiber(fall, e, monthOf(date), zeile(monthOf(date)), aktiv);
		}
	}
	return reihe;
}
/** Monat JJJJ-MM um `ahead` Monate vorgerechnet (previousMonth aus dates.ts kann nur zurück). */
function nextMonth(month, ahead = 1) {
	let y = Number(month.slice(0, 4));
	let m = Number(month.slice(5, 7)) + ahead;
	while (m > 12) {
		m -= 12;
		y += 1;
	}
	return `${y}-${String(m).padStart(2, "0")}`;
}
const LERNFAELLE = [
	{
		id: "2019",
		titel: "Rezession und späte Straffung",
		startMonat: "2018-08",
		monate: 18,
		seed: 201808,
		eurUsd: 1.16,
		erwartungStart: 17,
		glaubwuerdigkeitStart: .35,
		gapStart: -1,
		schuldenStart: 30.4,
		defizit: 3.8,
		potenzial: 4.5,
		historyExtras: [
			{
				monat: "2017-09",
				tuefe: 11.2,
				leitzins: 12.75,
				usdtry: 3.5,
				cds: 165,
				bip: 11.3,
				alq: 10.6
			},
			{
				monat: "2017-10",
				tuefe: 11.9,
				leitzins: 12.75,
				usdtry: 3.75,
				cds: 160,
				bip: 7.4,
				alq: 10.3
			},
			{
				monat: "2017-11",
				tuefe: 12.98,
				leitzins: 12.75,
				usdtry: 3.95,
				cds: 185,
				bip: 7.4,
				alq: 10.3
			},
			{
				monat: "2017-12",
				tuefe: 11.92,
				leitzins: 12.75,
				usdtry: 3.79,
				cds: 175,
				bip: 7.4,
				alq: 10.4
			}
		],
		schuldenAnker: [
			{
				monat: "2017-09",
				wert: 28.3
			},
			{
				monat: "2018-08",
				wert: 30.4
			},
			{
				monat: "2019-12",
				wert: 32.6
			},
			{
				monat: "2020-02",
				wert: 33.5
			}
		],
		oel: [
			{
				monat: "2018-09",
				wert: 105
			},
			{
				monat: "2018-11",
				wert: 112
			},
			{
				monat: "2019-01",
				wert: 78
			},
			{
				monat: "2019-05",
				wert: 92
			},
			{
				monat: "2019-09",
				wert: 85
			}
		],
		weltzins: [
			{
				monat: "2018-09",
				wert: 105
			},
			{
				monat: "2018-12",
				wert: 115
			},
			{
				monat: "2019-04",
				wert: 95
			},
			{
				monat: "2019-08",
				wert: 80
			},
			{
				monat: "2019-11",
				wert: 80
			}
		],
		euNachfrage: [{
			monat: "2019-03",
			wert: 96
		}],
		schocks: [
			{
				monat: "2018-09",
				art: "fx",
				wert: -.14,
				ereignis: "TCMB hebt Leitzins auf 24 %",
				notiz: "Rücklauf 6,92 → ~6,0 (CSV 2018-09: 6,06)"
			},
			{
				monat: "2018-10",
				art: "fx",
				wert: -.06,
				ereignis: "Pastor Brunson freigelassen",
				notiz: "Richtung 5,6 (CSV 2018-10)"
			},
			{
				monat: "2018-09",
				art: "nachfrage",
				wert: -4,
				monate: 10,
				ereignis: "Lira-Crash nach US-Stahlzöllen",
				notiz: "Kreditkanal-Proxy für die Rezession Q4/2018–Q2/2019 (Kreditvolumen brach zweistellig ein)"
			},
			{
				monat: "2019-03",
				art: "risiko",
				wert: 80,
				ereignis: "Kommunalwahlen",
				notiz: "Istanbul-Annullierung, S-400-Streit: CDS-Prämie blieb erhöht"
			},
			{
				monat: "2019-05",
				art: "risiko",
				wert: 60,
				ereignis: "Wiederholungswahl Istanbul",
				notiz: "CDS-Spitze 470 (05/2019)"
			},
			{
				monat: "2019-10",
				art: "risiko",
				wert: 40,
				ereignis: "Friedensquelle",
				notiz: "US-Sanktionsdrohungen"
			}
		]
	},
	{
		id: "2021",
		titel: "Zinsstreit und Lira-Sturz",
		startMonat: "2021-03",
		monate: 15,
		seed: 202103,
		eurUsd: 1.19,
		erwartungStart: 15,
		glaubwuerdigkeitStart: .3,
		gapStart: 2.5,
		schuldenStart: 40.5,
		defizit: 3.5,
		potenzial: 4.5,
		historyExtras: [],
		schuldenAnker: [
			{
				monat: "2020-03",
				wert: 33.5
			},
			{
				monat: "2021-03",
				wert: 40.5
			},
			{
				monat: "2022-06",
				wert: 40
			}
		],
		oel: [
			{
				monat: "2021-10",
				wert: 125
			},
			{
				monat: "2022-02",
				wert: 150
			},
			{
				monat: "2022-03",
				wert: 195
			},
			{
				monat: "2022-06",
				wert: 205
			}
		],
		weltzins: [
			{
				monat: "2021-11",
				wert: 115
			},
			{
				monat: "2022-01",
				wert: 130
			},
			{
				monat: "2022-03",
				wert: 155
			},
			{
				monat: "2022-05",
				wert: 185
			}
		],
		euNachfrage: [{
			monat: "2022-03",
			wert: 96
		}],
		schocks: [
			{
				monat: "2021-09",
				art: "glaubwuerdigkeit",
				wert: -.04,
				ereignis: "Zinssenkung trotz 19,6 % Inflation",
				notiz: "1. Schnitt unter die Regel"
			},
			{
				monat: "2021-10",
				art: "glaubwuerdigkeit",
				wert: -.05,
				ereignis: "Zinssenkung trotz 19,6 % Inflation",
				notiz: "2. Schnitt (−2 Punkte)"
			},
			{
				monat: "2021-11",
				art: "glaubwuerdigkeit",
				wert: -.03,
				ereignis: "Leitzins 15 %; Lira im freien Fall",
				notiz: "3./4. Schnitt"
			},
			{
				monat: "2021-11",
				art: "fx",
				wert: .48,
				ereignis: "Leitzins 15 %; Lira im freien Fall",
				notiz: "11/2021: +39 % im Monat, Run auf die Lira"
			},
			{
				monat: "2021-11",
				art: "risiko",
				wert: 260,
				ereignis: "Leitzins 15 %; Lira im freien Fall",
				notiz: "CDS 350 → 520 um den Lira-Run"
			},
			{
				monat: "2021-12",
				art: "risiko",
				wert: 140,
				ereignis: "KKM eingeführt",
				notiz: "KKM-Chaoswoche (Intraday 18,4)"
			},
			{
				monat: "2021-12",
				art: "inflation",
				wert: 10,
				ereignis: "Leitzins 15 %; Lira im freien Fall",
				notiz: "Repricing-Welle 1 nach dem Lira-Run (real: +13,5 % MoM)"
			},
			{
				monat: "2022-01",
				art: "inflation",
				wert: 11.5,
				ereignis: "KKM eingeführt",
				notiz: "Repricing-Welle 2 (real: +11,1 % MoM)"
			},
			{
				monat: "2022-01",
				art: "costpush",
				wert: 4.5,
				monate: 4,
				ereignis: "Mindestlohn",
				notiz: "Mindestlohn 2.826 → 4.253 TL (+50 %)"
			},
			{
				monat: "2022-04",
				art: "costpush",
				wert: 2,
				monate: 3,
				ereignis: "Russland überfällt die Ukraine",
				notiz: "Energiepreisschock, regulierte Tarife"
			},
			{
				monat: "2022-04",
				art: "inflation",
				wert: 4,
				ereignis: "Russland überfällt die Ukraine",
				notiz: "April-Repricing (real: +7,25 % MoM)"
			},
			{
				monat: "2022-01",
				art: "nachfrage",
				wert: 2.8,
				monate: 6,
				ereignis: "KKM eingeführt",
				notiz: "Kreditboom H1/2022 (KKM-Subvention, KGF: TL-Kredite +50 % jahresweise); hält ALQ-Pfad fallend"
			},
			{
				monat: "2022-02",
				art: "risiko",
				wert: 90,
				ereignis: "Russland überfällt die Ukraine",
				notiz: "Globale Risikoaversion"
			},
			{
				monat: "2022-04",
				art: "risiko",
				wert: 85,
				ereignis: "CDS-Allzeithoch 908 bp",
				notiz: "Lauf zum Allzeithoch (07/2022): Negativzins + Reservenverluste"
			}
		]
	},
	{
		id: "2023",
		titel: "Erdbeben, Wahl und Kurswechsel",
		startMonat: "2023-01",
		monate: 18,
		seed: 202301,
		eurUsd: 1.07,
		erwartungStart: 30,
		glaubwuerdigkeitStart: .12,
		gapStart: -.5,
		schuldenStart: 31.5,
		defizit: 2.9,
		potenzial: 4.5,
		historyExtras: [],
		schuldenAnker: [
			{
				monat: "2022-01",
				wert: 40
			},
			{
				monat: "2023-01",
				wert: 31.5
			},
			{
				monat: "2024-06",
				wert: 28.5
			}
		],
		oel: [
			{
				monat: "2023-04",
				wert: 90
			},
			{
				monat: "2023-09",
				wert: 120
			},
			{
				monat: "2024-01",
				wert: 105
			}
		],
		weltzins: [
			{
				monat: "2023-07",
				wert: 120
			},
			{
				monat: "2023-10",
				wert: 135
			},
			{
				monat: "2024-01",
				wert: 118
			},
			{
				monat: "2024-06",
				wert: 115
			}
		],
		euNachfrage: [{
			monat: "2023-06",
			wert: 97
		}],
		schocks: [
			{
				monat: "2023-03",
				art: "fx",
				wert: -.03,
				ereignis: "Erdbeben Kahramanmaraş",
				notiz: "Kursverteidigung mit Reserven (März)"
			},
			{
				monat: "2023-04",
				art: "fx",
				wert: -.03,
				ereignis: "Erdbeben Kahramanmaraş",
				notiz: "Kursverteidigung mit Reserven (April)"
			},
			{
				monat: "2023-02",
				art: "costpush",
				wert: 1.5,
				monate: 3,
				ereignis: "Mindestlohn",
				notiz: "Mindestlohn 5.500 → 8.507 TL (+100 % gegenüber 01/2022-Reihe)"
			},
			{
				monat: "2023-03",
				art: "fiskal",
				wert: 1,
				monate: 15,
				ereignis: "Erdbeben Kahramanmaraş",
				notiz: "Defizit-Effekt des Wiederaufbaus (2023: ~5,4 % statt ~2,9 % des BIP)"
			},
			{
				monat: "2023-05",
				art: "risiko",
				wert: 260,
				ereignis: "Parlaments-/Präsidentschaftswahl, 1. Runde",
				notiz: "CDS-Spitze 700 bp vor der Stichwahl"
			},
			{
				monat: "2023-06",
				art: "fx",
				wert: .22,
				ereignis: "Lira bricht nach der Wahl ein",
				notiz: "20,5 → 26,0 (CSV 06/2023); Rest Diffusion"
			},
			{
				monat: "2023-06",
				art: "glaubwuerdigkeit",
				wert: .16,
				ereignis: "Erkan Gouverneurin; Şimşek Finanzminister",
				notiz: "Regime-Bruch; credibility-Sprung"
			},
			{
				monat: "2023-06",
				art: "risiko",
				wert: -90,
				ereignis: "Erkan Gouverneurin; Şimşek Finanzminister",
				notiz: "CDS-Rückgang nach der Wende"
			},
			{
				monat: "2023-07",
				art: "costpush",
				wert: 3.5,
				monate: 5,
				ereignis: "Mindestlohn",
				notiz: "Mindestlohn 8.507 → 11.402 TL (+34 %)"
			},
			{
				monat: "2023-08",
				art: "costpush",
				wert: 1.5,
				monate: 3,
				ereignis: "Parlaments-/Präsidentschaftswahl, 1. Runde",
				notiz: "KDV-/ÖTV-Erhöhungen 07/2023 (Wahlrechnung)"
			},
			{
				monat: "2023-07",
				art: "inflation",
				wert: 4.3,
				ereignis: "Mindestlohn",
				notiz: "Juli-Repricing (real: +9,5 % MoM)"
			},
			{
				monat: "2023-08",
				art: "inflation",
				wert: 8,
				ereignis: "Parlaments-/Präsidentschaftswahl, 1. Runde",
				notiz: "August-Repricing (real: +9,1 % MoM, stärkster August-Druck der Reihe)"
			},
			{
				monat: "2024-01",
				art: "costpush",
				wert: 5,
				monate: 5,
				ereignis: "Mindestlohn",
				notiz: "Mindestlohn 11.402 → 17.002 TL (+49 %) + Indexierung"
			},
			{
				monat: "2024-01",
				art: "inflation",
				wert: 6.5,
				ereignis: "Mindestlohn",
				notiz: "Januar-Repricing (real: +6,7 % MoM)"
			},
			{
				monat: "2023-11",
				art: "risiko",
				wert: -60,
				ereignis: "Leitzins 25 %",
				notiz: "Straffungszyklus läuft, CDS-Rückgang 480 → 365"
			},
			{
				monat: "2024-03",
				art: "glaubwuerdigkeit",
				wert: .15,
				ereignis: "Leitzins 50 %",
				notiz: "Karahan-Kontinuität, Straffung geliefert"
			},
			{
				monat: "2024-05",
				art: "risiko",
				wert: -55,
				ereignis: "Leitzins 50 %",
				notiz: "Risikoprämie fällt mit gelieferter Straffung (CDS 265, 06/2024)"
			},
			{
				monat: "2024-06",
				art: "fx",
				wert: -.03,
				ereignis: "Leitzins 50 %",
				notiz: "Reale Stabilisierung: KKM-Abbau, Reservenaufbau"
			}
		]
	}
];
//#endregion
//#region scripts/lernfaelle-debug.ts
const serien = ladeZeitreihen();
const fmt = (x, d = 1) => x === void 0 ? "  --  " : x.toFixed(d).padStart(6);
for (const fall of LERNFAELLE) {
	console.log(`\n=== Lernfall ${fall.id}: ${fall.titel} (Start ${fall.startMonat}, ${fall.monate} Monate) ===`);
	console.log("Monat   | TÜFE sim/ist   | Zins sim/ist | USD/TRY sim/ist | CDS sim/ist     | ALQ sim/ist   | Schulden sim | Erwart | Glaubw | fxChange12 | Regelzins");
	const reihe = replay(fall, serien);
	for (const r of reihe) {
		const ist = serien.get(r.monat);
		console.log(`${r.monat} | ${fmt(r.inflation)}/${fmt(ist?.tuefe)} | ${fmt(r.leitzins)}/${fmt(ist?.leitzins)} | ${fmt(r.usdTry)}/${fmt(ist?.usdtry)} | ${fmt(r.cds, 0)}/${fmt(ist?.cds, 0)} | ${fmt(r.alq)}/${fmt(ist?.alq)} | ${fmt(r.schuldenquote)} | ${fmt(r.erwartung)} | ${fmt(r.glaubwuerdigkeit, 2)} | ${fmt(r.fxChange12)} | ${fmt(r.regelzinsAusgewogen)}`);
	}
}
//#endregion

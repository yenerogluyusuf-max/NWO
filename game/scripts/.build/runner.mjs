//#region game/src/sim/economy.ts
const PARAMS = {
	/** Neutraler Realzins in % */
	neutralRealRate: 3,
	/** Ausländische Inflation in % (für den Inflationsabstand beim Wechselkurs) */
	foreignInflation: 2.5,
	/** Z1: Wirkung des Realzinses auf die Auslastung (je Prozentpunkt, pro Monat) */
	rateOnGap: .05,
	/** Z1: Verzögerung in Monaten */
	rateLagMonths: 6,
	/** Persistenz der Auslastung pro Monat */
	gapPersistence: .85,
	/** Z6: Wirkung zusätzlicher Staatsausgaben (% BIP) auf die Auslastung */
	fiscalOnGap: .12,
	/** Z2: Wirkung der Auslastung auf die Inflation */
	gapOnInflation: .5,
	/** Z5: Weitergabe einer übermäßigen Abwertung an die Inflation */
	fxPassThrough: .25,
	/** Anpassungsgeschwindigkeit der Inflation pro Monat */
	inflationSpeed: .12,
	/** Z3: Anpassungsgeschwindigkeit der Erwartungen pro Monat */
	expectationSpeed: .15,
	/** Z9: Okun-Koeffizient (monatlich) */
	okun: .035,
	/** Natürliche Arbeitslosenquote in % */
	naturalUnemployment: 9,
	/** Z4: Wirkung des Realzinses auf die Abwertung (% p. a. je Prozentpunkt) */
	carryOnFx: .5,
	/** Tägliche Schwankung des Wechselkurses (Standardabweichung, Anteil) */
	fxNoise: .0015,
	/** Langfristiges Inflationsziel der Zentralbank in % */
	longRunTarget: 5,
	/** Monatliche Annäherung der Zwischenziele an das langfristige Ziel (ergibt etwa 24, 15, 9, 5) */
	targetGlide: .04
};
/** Wirkung der Außenwelt (Indizes, Start = 100). Platzhalter der Kalibrierung. */
const AUSSEN = {
	/** Prozentpunkte Inflation je Indexpunkt Energiepreis über 100 (Energieimporte) */
	oelAufInflation: .02,
	/** Auslastung (Prozentpunkte je Monat) je Indexpunkt Energiepreis */
	oelAufAuslastung: .004,
	/** Auslastung (Prozentpunkte je Monat) je Indexpunkt EU-Nachfrage */
	euAufAuslastung: .012,
	/** Basispunkte Risikoaufschlag je Indexpunkt Weltzins über 100 */
	weltzinsAufRisiko: 3
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
	const inflationGap = e.inflation - PARAMS.foreignInflation;
	const carry = PARAMS.carryOnFx * (realRate(e) - PARAMS.neutralRealRate);
	const risk = (e.riskPremium - 250) / 100;
	const annual = inflationGap - carry + risk;
	const noise = rng.normal(PARAMS.fxNoise * (1.5 - e.credibility));
	return annual / 100 / 365 + noise;
}
/** Z8: täglicher Risikoaufschlag, zieht zum fundamentalen Wert. */
function dailyRiskPremium(e, rng) {
	const fundamental = 150 + 3 * Math.max(0, e.inflation - 10) + 2 * Math.max(0, e.debtRatio - 40) + 200 * (1 - e.credibility) + AUSSEN.weltzinsAufRisiko * ((e.weltzins ?? 100) - 100);
	return e.riskPremium + .02 * (fundamental - e.riskPremium) + rng.normal(2);
}
/** Monatliche Fortschreibung der Realwirtschaft (Z1, Z2, Z3, Z5, Z6, Z7, Z9). */
function monthlyUpdate(e, history, rng) {
	const lagged = history[history.length - PARAMS.rateLagMonths];
	const laggedRealRate = lagged ? lagged.realRate : realRate(e);
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
	if (r < 0) e.credibility -= .02;
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
		infl: .8,
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
/**
* Reaktionsregel des Geldpolitischen Ausschusses (angelehnt an Taylor 1993): Die Bank geht die halbe Strecke zum Zielzins, höchstens
* fünf Punkte je Sitzung. `druck` ist die Verschiebung des Beschlusses in Prozentpunkten durch politischen Einfluss (Zentralbank-Modul);
* er kommt zur Regel hinzu und darf über die Höchstschrittweite hinausgehen. Ohne Einfluss bleibt es die reine Regel.
*/
function ppkDecision(e, stance, druck = 0) {
	const target = ppkZiel(e, stance);
	const step = clamp((target - e.policyRate) * .5, -5, 5) + druck;
	const newRate = Math.max(0, Math.round((e.policyRate + step) * 2) / 2);
	let why;
	if (newRate > e.policyRate) why = "Die Inflation liegt deutlich über dem Ziel; der Ausschuss strafft.";
	else if (newRate < e.policyRate && stance === "gefuegig") why = "Der Ausschuss senkt und verweist auf Wachstum und Beschäftigung.";
	else if (newRate < e.policyRate) why = "Die Inflation sinkt; der Ausschuss lockert vorsichtig.";
	else why = "Der Ausschuss hält den Zins und will die Wirkung früherer Entscheidungen abwarten.";
	return {
		newRate,
		why,
		target
	};
}
function clamp(x, min, max) {
	return Math.min(max, Math.max(min, x));
}
const SLOTS = 13;
function buildModel(nodes, edges) {
	const index = new Map(nodes.map((n, i) => [n.id, i]));
	for (const e of edges) {
		if (!index.has(e.from)) throw new Error(`Politiknetz: unbekannter Knoten „${e.from}“`);
		if (!index.has(e.to)) throw new Error(`Politiknetz: unbekannter Knoten „${e.to}“`);
		if (e.lag < 0 || e.lag > 12) throw new Error(`Politiknetz: Verzögerung außerhalb 0–12 bei ${e.from} → ${e.to}`);
	}
	return {
		nodes,
		edges,
		index,
		edgeFrom: Int32Array.from(edges.map((e) => index.get(e.from))),
		edgeTo: Int32Array.from(edges.map((e) => index.get(e.to))),
		edgeWeight: Float64Array.from(edges.map((e) => e.weight)),
		edgeLag: Int32Array.from(edges.map((e) => e.lag))
	};
}
function createNet(model, economy, regional = {}, weights = new Array(81).fill(1 / 81)) {
	const n = model.nodes.length;
	const start = new Array(n * 81);
	model.nodes.forEach((node, i) => {
		const base = node.input ? inputValue(node.input, economy, 1) : node.start;
		const factors = regional[node.id];
		for (let p = 0; p < 81; p++) {
			const f = factors?.[p] ?? 1;
			start[i * 81 + p] = node.input ? inputValue(node.input, economy, f) : clampIndex$1(base * f);
		}
	});
	const values = start.slice();
	return {
		values,
		start,
		history: Array.from({ length: SLOTS }, () => values.slice()),
		month: 0,
		targets: {},
		steps: {},
		weights: weights.slice()
	};
}
/** Wert einer Eingangsgröße aus dem Wirtschaftsmodell, je Provinz mit Faktor. */
function inputValue(input, e, factor) {
	switch (input) {
		case "inflation": return e.inflation;
		case "arbeitslosigkeit": return e.unemployment * factor;
		case "wachstum": return 50 + (e.growth - potential(e)) * 5;
		case "leitzins": return e.policyRate;
		case "abwertung": return e.fxChange12;
		case "defizit": return 50 + (e.deficit + e.fiscalImpulse + e.policyCost + (e.zinsMehrlast ?? 0)) * 5;
		case "schulden": return e.debtRatio;
	}
}
/** Ein Monat: Eingänge übernehmen, Maßnahmen umsetzen, Wirkungen weitergeben. */
function stepNet(model, s, e, regional = {}) {
	const n = model.nodes.length;
	const v = s.values;
	model.nodes.forEach((node, i) => {
		if (!node.input) return;
		const factors = regional[node.id];
		for (let p = 0; p < 81; p++) v[i * 81 + p] = inputValue(node.input, e, factors?.[p] ?? 1);
	});
	for (const [id, target] of Object.entries(s.targets)) {
		const i = model.index.get(id);
		if (i === void 0) continue;
		const step = s.steps[id] ?? 100;
		for (let p = 0; p < 81; p++) {
			const k = i * 81 + p;
			const diff = target - v[k];
			v[k] = v[k] + Math.sign(diff) * Math.min(Math.abs(diff), step);
		}
	}
	if (s.ziele) for (const [id, arr] of Object.entries(s.ziele)) {
		const i = model.index.get(id);
		if (i === void 0) continue;
		const st = s.schritte?.[id];
		let offen = false;
		for (let p = 0; p < 81; p++) {
			const t = arr[p];
			if (t < 0) continue;
			const k = i * 81 + p;
			const diff = t - v[k];
			const step = st?.[p] ?? 100;
			if (Math.abs(diff) <= step) {
				v[k] = t;
				arr[p] = -1;
			} else {
				v[k] = v[k] + Math.sign(diff) * step;
				offen = true;
			}
		}
		if (!offen) {
			delete s.ziele[id];
			if (s.schritte) delete s.schritte[id];
		}
	}
	const delta = new Float64Array(n * 81);
	for (let j = 0; j < model.edgeFrom.length; j++) {
		const from = model.edgeFrom[j];
		const to = model.edgeTo[j];
		const w = model.edgeWeight[j];
		const past = s.history[(s.month - model.edgeLag[j] + SLOTS * 1e3) % SLOTS];
		const fo = from * 81;
		const to0 = to * 81;
		for (let p = 0; p < 81; p++) delta[to0 + p] = delta[to0 + p] + w * (past[fo + p] - s.start[fo + p]);
	}
	model.nodes.forEach((node, i) => {
		if (node.input || node.kind === "massnahme") return;
		const o = i * 81;
		for (let p = 0; p < 81; p++) {
			const k = o + p;
			const next = v[k] + delta[k] - node.decay * (v[k] - s.start[k]);
			v[k] = clampIndex$1(next);
		}
	});
	s.month += 1;
	s.history[s.month % SLOTS] = v.slice();
	if (!s.acute) s.acute = new Array(n * 81).fill(0);
	const ac = s.acute;
	model.nodes.forEach((node, i) => {
		if (node.kind !== "problem" || !node.threshold) return;
		const stop = node.threshold - 8;
		for (let p = 0; p < 81; p++) {
			const k = i * 81 + p;
			if (v[k] >= node.threshold) ac[k] = 1;
			else if (v[k] < stop) ac[k] = 0;
		}
	});
}
/** Landesdurchschnitt eines Knotens, gewichtet nach Bevölkerung. */
function nationalAverage(model, s, id) {
	const i = model.index.get(id);
	if (i === void 0) return NaN;
	let sum = 0;
	for (let p = 0; p < 81; p++) sum += s.values[i * 81 + p] * s.weights[p];
	return sum;
}
function startAverage(model, s, id) {
	const i = model.index.get(id);
	if (i === void 0) return NaN;
	let sum = 0;
	for (let p = 0; p < 81; p++) sum += s.start[i * 81 + p] * s.weights[p];
	return sum;
}
/** Laufende Kosten aller Maßnahmen gegenüber dem Start in % des BIP pro Jahr. */
function policyCost(model, s) {
	let total = 0;
	model.nodes.forEach((node) => {
		if (node.kind !== "massnahme" || !node.cost) return;
		total += (nationalAverage(model, s, node.id) - startAverage(model, s, node.id)) / 100 * node.cost;
	});
	return total;
}
function clampIndex$1(x) {
	return Math.min(100, Math.max(0, x));
}
//#endregion
//#region game/src/data/politiknetz.ts
const N$1 = [];
const E = [];
function m(theme, id, name, start, cost, months, text) {
	N$1.push({
		id,
		name,
		theme,
		kind: "massnahme",
		text,
		start,
		decay: 0,
		cost,
		months
	});
}
function g(theme, id, name, start, text, decay = .08) {
	N$1.push({
		id,
		name,
		theme,
		kind: "groesse",
		text,
		start,
		decay
	});
}
function inp(theme, id, name, input, text) {
	N$1.push({
		id,
		name,
		theme,
		kind: "groesse",
		text,
		start: 0,
		decay: 0,
		input
	});
}
function p(theme, id, name, start, threshold, text) {
	N$1.push({
		id,
		name,
		theme,
		kind: "problem",
		text,
		start,
		decay: .1,
		threshold
	});
}
function grp(id, name, text) {
	N$1.push({
		id,
		name,
		theme: "gruppen",
		kind: "gruppe",
		text,
		start: 50,
		decay: .15
	});
}
/**
* Die Bauzeit einer Maßnahme steckt in ihrer Umsetzungsdauer (`months`). Die
* Verzögerung einer Verbindung beschreibt nur, wie lange die Wirkung danach
* braucht, und ist deshalb auf 12 Monate begrenzt.
*/
function e(from, to, weight, lag, why) {
	E.push({
		from,
		to,
		weight,
		lag: Math.min(lag, 12),
		why
	});
}
inp("wirtschaft", "inflation", "Inflation", "inflation", "Jahresinflation in %, aus dem Wirtschaftsmodell.");
inp("wirtschaft", "arbeitslosigkeit", "Arbeitslosigkeit", "arbeitslosigkeit", "Arbeitslosenquote, regional unterschiedlich.");
inp("wirtschaft", "wachstum", "Wachstum", "wachstum", "Wirtschaftswachstum, als Index (50 = Potenzialwachstum).");
inp("wirtschaft", "leitzins", "Leitzins", "leitzins", "Leitzins der Zentralbank in %.");
inp("wirtschaft", "abwertung", "Abwertung der Lira", "abwertung", "Wertverlust der Lira gegenüber dem Dollar in den letzten zwölf Monaten, in %.");
inp("haushalt", "defizit", "Haushaltsdefizit", "defizit", "Defizit in % des BIP, als Index.");
inp("haushalt", "schulden", "Staatsschulden", "schulden", "Schuldenquote in % des BIP.");
g("wirtschaft", "lebenshaltung", "Gefühlte Teuerung", 70, "Wie teuer sich der Alltag anfühlt: Lebensmittel, Miete, Energie.");
g("wirtschaft", "realeinkommen", "Reallöhne", 45, "Was die Löhne nach Abzug der Preissteigerung wert sind.");
g("wirtschaft", "investitionen", "Investitionen", 45, "Wie viel Unternehmen in Anlagen und Maschinen stecken.");
g("wirtschaft", "export", "Exportstärke", 55, "Wettbewerbsfähigkeit der Exportindustrie.");
g("wirtschaft", "tourismus", "Tourismus", 65, "Gäste und Deviseneinnahmen aus dem Tourismus.");
g("wirtschaft", "industrie", "Industrieproduktion", 55, "Leistung von Textil-, Auto-, Maschinen- und Chemieindustrie.");
g("wirtschaft", "mittelstand", "Lage des Mittelstands", 45, "Kleine und mittlere Betriebe: Aufträge, Finanzierung, Überleben.");
g("wirtschaft", "kredite", "Kreditvergabe", 40, "Wie leicht Haushalte und Firmen an Kredite kommen.");
g("wirtschaft", "auslandskapital", "Auslandskapital", 40, "Direktinvestitionen und Portfoliozuflüsse aus dem Ausland.");
g("wirtschaft", "kostendruck", "Kostendruck der Betriebe", 60, "Lohn-, Energie- und Importkosten. Wirkt auf die Inflation zurück.");
g("wirtschaft", "produktivitaet", "Produktivität", 50, "Was pro Arbeitsstunde entsteht. Wirkt auf das Potenzialwachstum zurück.");
g("wirtschaft", "ungleichheit", "Ungleichheit", 60, "Abstand zwischen hohen und niedrigen Einkommen.");
g("wirtschaft", "schattenwirtschaft", "Schattenwirtschaft", 45, "Arbeit und Umsatz ohne Steuern und Versicherung.");
g("wirtschaft", "gruendungen", "Unternehmensgründungen", 50, "Wie viele neue Firmen entstehen.");
g("wirtschaft", "dollarisierung", "Dollarisierung", 55, "Wie sehr Menschen ihr Erspartes in Dollar, Euro oder Gold halten.");
m("wirtschaft", "m_mindestlohn", "Mindestlohn", 50, .6, 1, "Höhe des gesetzlichen Mindestlohns im Verhältnis zum Durchschnittslohn.");
m("wirtschaft", "m_exportfoerderung", "Exportförderung", 40, .4, 6, "Günstige Exportkredite und Zuschüsse für Ausfuhren.");
m("wirtschaft", "m_investitionsanreize", "Investitionsanreize", 45, .5, 9, "Steuervorteile und Zuschüsse für Investitionen, auch in Förderregionen.");
m("wirtschaft", "m_kreditgarantien", "Staatliche Kreditgarantien", 35, .5, 3, "Der Staat bürgt für Kredite an Betriebe.");
m("wirtschaft", "m_preiskontrollen", "Preiskontrollen für Lebensmittel", 20, .1, 2, "Obergrenzen und Kontrollen bei Grundnahrungsmitteln.");
m("wirtschaft", "m_tourismuswerbung", "Tourismuswerbung", 50, .1, 6, "Werbung und Förderung für den Tourismus im Ausland.");
m("wirtschaft", "m_kmu", "Mittelstandsförderung", 40, .3, 6, "Programme für kleine und mittlere Betriebe.");
m("wirtschaft", "m_zoelle", "Einfuhrzölle", 40, -.3, 3, "Zölle auf Importe außerhalb der Zollunion mit der EU.");
m("wirtschaft", "m_bankenaufsicht", "Bankenaufsicht", 55, .02, 6, "Regeln für Kreditvergabe und Eigenkapital der Banken.");
e("inflation", "lebenshaltung", .04, 0, "Steigende Preise machen den Alltag spürbar teurer. Auch wenn die Inflation sinkt, bleiben die Preise hoch.");
e("abwertung", "lebenshaltung", .03, 1, "Eine schwache Lira verteuert Importe wie Energie und Medikamente.");
e("inflation", "realeinkommen", -.06, 0, "Wenn Preise schneller steigen als Löhne, sinkt die Kaufkraft.");
e("m_mindestlohn", "realeinkommen", .06, 1, "Ein höherer Mindestlohn hebt die unteren Einkommen.");
e("m_mindestlohn", "kostendruck", .05, 1, "Höhere Löhne sind höhere Kosten für die Betriebe.");
e("m_mindestlohn", "schattenwirtschaft", .03, 3, "Ist der Mindestlohn hoch, stellen manche Betriebe lieber ohne Vertrag ein.");
e("m_mindestlohn", "ungleichheit", -.04, 3, "Der Abstand zwischen unten und oben wird kleiner.");
e("abwertung", "kostendruck", .04, 1, "Importierte Vorprodukte werden teurer.");
e("leitzins", "kredite", -.05, 2, "Hohe Zinsen verteuern Kredite.");
e("leitzins", "investitionen", -.03, 4, "Teure Finanzierung lässt Firmen Investitionen verschieben.");
e("kredite", "investitionen", .05, 3, "Wer an Kredite kommt, investiert eher.");
e("kredite", "mittelstand", .05, 2, "Kleine Betriebe hängen besonders an Bankkrediten.");
e("m_kreditgarantien", "kredite", .06, 2, "Staatsbürgschaften machen Kredite für Banken sicherer.");
e("m_kreditgarantien", "mittelstand", .04, 3, "Betriebe überbrücken Engpässe mit verbürgten Krediten.");
e("m_bankenaufsicht", "kredite", -.03, 3, "Strenge Regeln bremsen riskante Kreditvergabe.");
e("m_bankenaufsicht", "auslandskapital", .02, 6, "Stabile Banken schaffen Vertrauen bei Anlegern.");
e("abwertung", "export", .03, 3, "Eine schwache Lira macht türkische Waren im Ausland billiger.");
e("abwertung", "tourismus", .03, 3, "Urlaub in der Türkei wird für Ausländer günstiger.");
e("m_exportfoerderung", "export", .05, 6, "Günstige Exportkredite helfen Ausfuhren.");
e("m_zoelle", "industrie", .02, 6, "Zölle schützen heimische Hersteller vor Konkurrenz.");
e("m_zoelle", "kostendruck", .03, 3, "Importierte Vorprodukte werden teurer.");
e("m_zoelle", "export", -.02, 9, "Handelspartner reagieren, und geschützte Firmen werden träger.");
e("export", "industrie", .05, 2, "Exportaufträge lasten Fabriken aus.");
e("industrie", "arbeitsplaetze_industrie", .05, 3, "Mehr Produktion braucht mehr Beschäftigte.");
e("m_tourismuswerbung", "tourismus", .04, 6, "Werbung bringt mehr Gäste.");
e("m_investitionsanreize", "investitionen", .05, 9, "Steuervorteile senken die Kosten einer Investition.");
e("m_investitionsanreize", "auslandskapital", .03, 12, "Anreize ziehen auch ausländische Investoren an.");
e("m_kmu", "mittelstand", .05, 6, "Förderprogramme stützen kleine Betriebe.");
e("m_kmu", "gruendungen", .04, 6, "Wer gründen will, bekommt Starthilfe.");
e("investitionen", "produktivitaet", .03, 12, "Neue Maschinen machen Arbeit produktiver.");
e("auslandskapital", "investitionen", .04, 6, "Ausländisches Geld finanziert Fabriken und Projekte.");
e("m_preiskontrollen", "lebenshaltung", -.04, 1, "Obergrenzen dämpfen sichtbare Preise im Supermarkt.");
e("m_preiskontrollen", "schattenwirtschaft", .03, 3, "Unter Preisdeckeln wandern Waren auf graue Märkte.");
e("m_preiskontrollen", "landwirtschaft_einkommen", -.04, 6, "Niedrige Preise treffen die Erzeuger.");
e("inflation", "dollarisierung", .05, 1, "Bei hoher Inflation flüchten Sparer in Dollar und Gold.");
e("abwertung", "dollarisierung", .04, 0, "Wer eine schwache Lira erlebt, traut ihr weniger.");
e("dollarisierung", "auslandskapital", -.02, 3, "Wenn schon Einheimische der Lira misstrauen, zögern Ausländer auch.");
e("schattenwirtschaft", "steuereinnahmen", -.04, 3, "Schwarzarbeit zahlt keine Steuern.");
e("ungleichheit", "polarisierung", .02, 12, "Große Unterschiede verschärfen politische Gräben.");
e("gruendungen", "mittelstand", .03, 12, "Aus Gründungen wird Mittelstand.");
g("haushalt", "steuereinnahmen", "Steuereinnahmen", 50, "Was der Staat tatsächlich einnimmt.");
g("haushalt", "steuermoral", "Steuerehrlichkeit", 45, "Wie viele Steuern tatsächlich gezahlt werden.");
g("haushalt", "zinslast", "Zinslast des Staates", 45, "Anteil des Haushalts, der für Zinsen draufgeht.");
g("haushalt", "vertrauen_maerkte", "Vertrauen der Märkte", 45, "Wie Anleger die Staatsfinanzen einschätzen.");
m("haushalt", "m_einkommensteuer", "Einkommensteuer", 50, -1.5, 3, "Höhe der Einkommensteuer.");
m("haushalt", "m_mwst", "Mehrwertsteuer", 60, -2, 1, "Höhe der Mehrwertsteuer.");
m("haushalt", "m_koerperschaftsteuer", "Körperschaftsteuer", 50, -.8, 3, "Steuer auf Unternehmensgewinne.");
m("haushalt", "m_kraftstoffsteuer", "Steuer auf Kraftstoff", 60, -.8, 1, "Verbrauchsteuer auf Benzin und Diesel.");
m("haushalt", "m_immobiliensteuer", "Steuer auf Immobilien und Vermögen", 30, -.5, 6, "Grundsteuer und Abgaben auf teure Immobilien.");
m("haushalt", "m_steueramnestie", "Steueramnestie", 20, -.1, 2, "Wer Schulden beim Fiskus nachzahlt, bekommt Strafen erlassen.");
m("haushalt", "m_steuerfahndung", "Steuerfahndung", 45, .05, 6, "Mehr Prüfer und Kontrollen gegen Steuerhinterziehung.");
m("haushalt", "m_privatisierung", "Privatisierung", 30, -.2, 12, "Verkauf staatlicher Unternehmen und Beteiligungen.");
e("m_einkommensteuer", "steuereinnahmen", .05, 1, "Höhere Sätze bringen mehr Einnahmen.");
e("m_einkommensteuer", "realeinkommen", -.04, 1, "Netto bleibt weniger vom Lohn.");
e("m_einkommensteuer", "schattenwirtschaft", .03, 6, "Hohe Steuern machen Schwarzarbeit attraktiver.");
e("m_mwst", "steuereinnahmen", .07, 1, "Die Mehrwertsteuer ist die ergiebigste Steuer.");
e("m_mwst", "lebenshaltung", .05, 1, "Sie steckt in jedem Preis im Laden.");
e("m_mwst", "ungleichheit", .02, 6, "Ärmere geben einen größeren Teil ihres Einkommens für Konsum aus.");
e("m_koerperschaftsteuer", "steuereinnahmen", .03, 3, "Gewinnsteuern bringen Einnahmen.");
e("m_koerperschaftsteuer", "investitionen", -.03, 9, "Höhere Steuern mindern den Ertrag einer Investition.");
e("m_koerperschaftsteuer", "auslandskapital", -.02, 9, "Investoren vergleichen Steuersätze.");
e("m_kraftstoffsteuer", "steuereinnahmen", .03, 1, "Kraftstoff wird viel verkauft.");
e("m_kraftstoffsteuer", "lebenshaltung", .03, 0, "Benzinpreise spürt jeder sofort.");
e("m_kraftstoffsteuer", "kostendruck", .02, 1, "Transport wird teurer.");
e("m_kraftstoffsteuer", "luftqualitaet", .01, 12, "Etwas weniger Verkehr.");
e("m_immobiliensteuer", "steuereinnahmen", .02, 6, "Einnahmen aus Immobilien.");
e("m_immobiliensteuer", "ungleichheit", -.03, 12, "Vermögende tragen mehr.");
e("m_immobiliensteuer", "mieten", .01, 12, "Ein Teil wird auf Mieter umgelegt.");
e("m_steueramnestie", "steuereinnahmen", .03, 1, "Nachzahlungen bringen kurzfristig Geld.");
e("m_steueramnestie", "steuermoral", -.04, 6, "Wer brav zahlt, fühlt sich betrogen; wer nicht zahlt, wartet auf die nächste Amnestie.");
e("m_steuerfahndung", "steuermoral", .05, 6, "Wer kontrolliert wird, zahlt eher.");
e("m_steuerfahndung", "schattenwirtschaft", -.04, 6, "Schwarzarbeit wird riskanter.");
e("m_steuerfahndung", "mittelstand", -.01, 3, "Prüfungen belasten auch ehrliche Betriebe.");
e("steuermoral", "steuereinnahmen", .05, 3, "Ehrliche Steuerzahler füllen die Kasse.");
e("m_privatisierung", "steuereinnahmen", .02, 6, "Verkaufserlöse entlasten den Haushalt, aber nur einmal.");
e("m_privatisierung", "auslandskapital", .02, 12, "Investoren kaufen Staatsbetriebe.");
e("m_privatisierung", "korruption", .02, 12, "Verkäufe unter Wert an Nahestehende sind ein bekanntes Risiko.");
e("leitzins", "zinslast", .03, 3, "Neue Schulden werden teurer.");
e("schulden", "zinslast", .03, 6, "Mehr Schulden, mehr Zinsen.");
e("defizit", "vertrauen_maerkte", -.04, 1, "Hohe Defizite machen Anleger nervös.");
e("zinslast", "vertrauen_maerkte", -.02, 3, "Eine hohe Zinslast engt den Spielraum ein.");
e("vertrauen_maerkte", "auslandskapital", .04, 1, "Vertrauen zieht Kapital an.");
g("arbeit", "armut", "Armut", 40, "Anteil der Menschen, die mit dem Nötigsten nicht auskommen.");
g("arbeit", "informelle_arbeit", "Informelle Beschäftigung", 45, "Arbeit ohne Vertrag und Sozialversicherung.");
g("arbeit", "frauenerwerb", "Frauenerwerbstätigkeit", 35, "Anteil der Frauen mit bezahlter Arbeit.");
g("arbeit", "jugendarbeitslosigkeit", "Jugendarbeitslosigkeit", 55, "Arbeitslosigkeit der 15- bis 24-Jährigen.");
g("arbeit", "arbeitsplaetze_industrie", "Industriearbeitsplätze", 50, "Beschäftigung in Fabriken.");
g("arbeit", "rentenniveau", "Rentenniveau", 40, "Was Renten im Verhältnis zu den Lebenshaltungskosten wert sind.");
g("arbeit", "streikneigung", "Streikbereitschaft", 35, "Wie schnell Gewerkschaften und Beschäftigte zu Streiks greifen.");
g("arbeit", "sozialkassen", "Lage der Sozialversicherung", 45, "Beiträge gegen Ausgaben der Renten- und Krankenkasse.");
m("arbeit", "m_renten", "Rentenerhöhungen", 50, 1.2, 1, "Anpassung der Renten über die Inflation hinaus.");
m("arbeit", "m_fruehrente", "Frühverrentung", 40, .6, 3, "Früherer Renteneintritt für bestimmte Jahrgänge.");
m("arbeit", "m_kindergeld", "Kindergeld und Familienhilfe", 30, .5, 2, "Geld für Familien mit Kindern.");
m("arbeit", "m_sozialhilfe", "Sozialhilfe", 35, .6, 2, "Grundsicherung für bedürftige Haushalte.");
m("arbeit", "m_arbeitslosengeld", "Arbeitslosengeld", 30, .3, 2, "Höhe und Dauer des Arbeitslosengeldes.");
m("arbeit", "m_gewerkschaftsrechte", "Gewerkschaftsrechte", 35, 0, 6, "Recht auf Organisation, Tarifverhandlung und Streik.");
m("arbeit", "m_kinderbetreuung", "Kinderbetreuung", 25, .3, 12, "Plätze in Krippen und Kindergärten.");
m("arbeit", "m_ausbildung", "Berufsausbildungsprogramme", 40, .2, 9, "Kurse und Lehrstellen für Arbeitslose und Junge.");
p("arbeit", "p_armut", "Armut", 40, 60, "Viele Haushalte kommen nicht mehr über den Monat.");
p("arbeit", "p_jugendarbeitslosigkeit", "Perspektivlose Jugend", 45, 60, "Junge Menschen finden keine Arbeit und keine Ausbildung.");
p("arbeit", "p_streiks", "Streikwelle", 30, 60, "Beschäftigte legen die Arbeit nieder.");
e("arbeitslosigkeit", "armut", .03, 2, "Wer keine Arbeit hat, rutscht schnell in die Armut.");
e("realeinkommen", "armut", -.05, 1, "Steigende Reallöhne heben Haushalte aus der Armut.");
e("lebenshaltung", "armut", .04, 1, "Teures Leben trifft die Ärmsten zuerst.");
e("m_sozialhilfe", "armut", -.05, 2, "Grundsicherung fängt die Ärmsten auf.");
e("m_kindergeld", "armut", -.03, 2, "Familien mit vielen Kindern sind besonders gefährdet.");
e("m_kindergeld", "geburtenrate", .01, 12, "Etwas mehr Familien entscheiden sich für Kinder.");
e("m_renten", "rentenniveau", .06, 1, "Höhere Renten gleichen die Teuerung aus.");
e("inflation", "rentenniveau", -.04, 1, "Die Inflation frisst die Renten auf.");
e("m_renten", "sozialkassen", -.04, 3, "Höhere Renten belasten die Kassen.");
e("m_fruehrente", "sozialkassen", -.05, 6, "Mehr Rentner, weniger Beitragszahler.");
e("m_fruehrente", "fachkraefte", -.02, 12, "Erfahrene Beschäftigte verlassen die Betriebe.");
e("m_arbeitslosengeld", "armut", -.02, 2, "Arbeitslose stürzen weniger tief.");
e("m_arbeitslosengeld", "informelle_arbeit", -.02, 6, "Wer versichert ist, hat einen Grund, es zu bleiben.");
e("m_gewerkschaftsrechte", "realeinkommen", .03, 9, "Gewerkschaften verhandeln höhere Löhne.");
e("m_gewerkschaftsrechte", "streikneigung", .04, 3, "Wer streiken darf, tut es auch.");
e("m_gewerkschaftsrechte", "kostendruck", .02, 9, "Tarifabschlüsse erhöhen die Lohnkosten.");
e("m_kinderbetreuung", "frauenerwerb", .05, 12, "Mütter können arbeiten, wenn die Kinder betreut sind.");
e("m_ausbildung", "jugendarbeitslosigkeit", -.04, 9, "Ausbildung öffnet Türen in den Arbeitsmarkt.");
e("m_ausbildung", "fachkraefte", .03, 12, "Mehr ausgebildete Arbeitskräfte.");
e("arbeitslosigkeit", "jugendarbeitslosigkeit", .05, 1, "Junge trifft eine schwache Konjunktur zuerst.");
e("informelle_arbeit", "sozialkassen", -.04, 6, "Informell Beschäftigte zahlen keine Beiträge.");
e("schattenwirtschaft", "informelle_arbeit", .05, 1, "Schwarzarbeit ist informelle Arbeit.");
e("frauenerwerb", "produktivitaet", .02, 12, "Mehr Arbeitskräfte, mehr Talent.");
e("frauenerwerb", "armut", -.02, 6, "Zwei Einkommen schützen Familien.");
e("inflation", "streikneigung", .04, 1, "Wenn Löhne der Inflation hinterherlaufen, wächst die Wut.");
e("realeinkommen", "streikneigung", -.04, 1, "Wer mehr in der Tasche hat, streikt seltener.");
e("streikneigung", "p_streiks", .08, 0, "Hohe Bereitschaft wird irgendwann zu Streiks.");
e("armut", "p_armut", .1, 0, "Wachsende Armut wird zum Problem.");
e("jugendarbeitslosigkeit", "p_jugendarbeitslosigkeit", .1, 0, "Ohne Arbeit und Ausbildung fehlen Perspektiven.");
e("p_streiks", "industrie", -.03, 0, "Streiks legen die Produktion lahm.");
e("sozialkassen", "vertrauen_maerkte", .01, 6, "Löchrige Sozialkassen belasten am Ende den Haushalt.");
e("industrie", "arbeitsplaetze_industrie", .04, 3, "Fabriken stellen ein, wenn die Aufträge laufen.");
g("gesundheit", "gesundheitsversorgung", "Gesundheitsversorgung", 55, "Erreichbarkeit und Qualität von Ärzten und Krankenhäusern.");
g("gesundheit", "aerzte", "Ärzte im Land", 50, "Wie viele Ärztinnen und Ärzte im Land arbeiten.");
g("gesundheit", "wartezeiten", "Wartezeiten", 45, "Wie lange man auf Termine und Behandlungen wartet.");
g("gesundheit", "lebenserwartung", "Lebenserwartung", 55, "Wie alt die Menschen werden.");
g("gesundheit", "medikamente", "Versorgung mit Medikamenten", 55, "Ob Apotheken alle Medikamente vorrätig haben.");
m("gesundheit", "m_krankenhausbau", "Krankenhausbau", 45, .4, 24, "Neue Krankenhäuser, auch in öffentlich-privater Partnerschaft.");
m("gesundheit", "m_aerztegehalt", "Gehälter im Gesundheitswesen", 40, .3, 3, "Bezahlung von Ärzten und Pflegekräften im staatlichen Dienst.");
m("gesundheit", "m_hausarzt", "Hausarztsystem", 45, .15, 12, "Familienärzte als erste Anlaufstelle.");
m("gesundheit", "m_zuzahlungen", "Zuzahlungen der Patienten", 30, -.2, 2, "Eigenanteil bei Arztbesuch und Medikamenten.");
p("gesundheit", "p_aerztemangel", "Ärztemangel", 40, 60, "Ärztinnen und Ärzte wandern ab, Stellen bleiben leer.");
e("m_krankenhausbau", "gesundheitsversorgung", .04, 24, "Neue Kliniken, sobald sie fertig sind.");
e("m_krankenhausbau", "korruption", .01, 24, "Große Bauaufträge bergen Vergaberisiken.");
e("m_aerztegehalt", "aerzte", .05, 6, "Bessere Bezahlung hält Ärzte im Land.");
e("abwertung", "aerzte", -.02, 6, "Gehälter in Lira verlieren gegenüber dem Ausland an Wert.");
e("abwertung", "medikamente", -.03, 2, "Importierte Medikamente werden knapp, wenn die Preise festgelegt sind.");
e("aerzte", "gesundheitsversorgung", .05, 3, "Ohne Ärzte keine Versorgung.");
e("aerzte", "p_aerztemangel", -.1, 0, "Fehlende Ärzte werden zum Problem.");
e("m_hausarzt", "wartezeiten", -.04, 12, "Hausärzte entlasten die Krankenhäuser.");
e("m_zuzahlungen", "wartezeiten", -.02, 3, "Weniger Bagatellbesuche.");
e("m_zuzahlungen", "armut", .01, 3, "Ärmere verzichten auf Behandlung.");
e("gesundheitsversorgung", "wartezeiten", -.04, 3, "Mehr Kapazität, kürzere Wartezeiten.");
e("gesundheitsversorgung", "lebenserwartung", .02, 12, "Gute Versorgung verlängert das Leben.");
e("medikamente", "gesundheitsversorgung", .03, 1, "Ohne Medikamente hilft der beste Arzt wenig.");
e("armut", "lebenserwartung", -.02, 12, "Armut kostet Lebensjahre.");
e("luftqualitaet", "lebenserwartung", .02, 12, "Schlechte Luft macht krank.");
g("bildung", "bildungsqualitaet", "Bildungsqualität", 45, "Was Schülerinnen und Schüler tatsächlich lernen.");
g("bildung", "schulabbruch", "Schulabbruch", 40, "Wer die Schule ohne Abschluss verlässt.");
g("bildung", "hochschule", "Qualität der Hochschulen", 45, "Forschung und Lehre an Universitäten.");
g("bildung", "fachkraefte", "Fachkräfte", 45, "Gut ausgebildete Arbeitskräfte, die im Land bleiben.");
g("bildung", "abwanderung", "Abwanderung von Fachkräften", 55, "Gut Ausgebildete, die ins Ausland gehen.");
g("bildung", "geburtenrate", "Geburtenrate", 45, "Kinder pro Frau, als Index.");
m("bildung", "m_lehrergehaelter", "Lehrergehälter", 45, .4, 3, "Bezahlung der Lehrkräfte.");
m("bildung", "m_schulbau", "Schulbau", 45, .3, 24, "Neue Schulen und kleinere Klassen.");
m("bildung", "m_religioese_schulen", "Religiöse Schulen (İmam-Hatip)", 55, .1, 12, "Anteil staatlicher Schulen mit religiösem Schwerpunkt.");
m("bildung", "m_berufsschulen", "Berufsschulen", 45, .2, 12, "Berufliche Bildung mit Betrieben zusammen.");
m("bildung", "m_unigruendungen", "Neue Universitäten", 50, .2, 24, "Universitäten in jeder Provinz.");
m("bildung", "m_stipendien", "Stipendien", 35, .15, 6, "Unterstützung für Studierende aus ärmeren Familien.");
m("bildung", "m_forschung", "Forschungsförderung", 30, .3, 12, "Geld für Forschung und Entwicklung.");
m("bildung", "m_wissenschaftsfreiheit", "Wissenschaftsfreiheit", 40, 0, 12, "Unabhängigkeit der Universitäten bei Berufungen und Lehre.");
p("bildung", "p_abwanderung", "Abwanderung von Fachkräften", 55, 60, "Ärzte, Ingenieure und Forscher verlassen das Land.");
e("m_lehrergehaelter", "bildungsqualitaet", .03, 12, "Gut bezahlte Lehrer bleiben im Beruf.");
e("m_schulbau", "bildungsqualitaet", .03, 24, "Kleinere Klassen, besserer Unterricht.");
e("m_schulbau", "schulabbruch", -.02, 24, "Eine Schule in der Nähe hält Kinder im Unterricht.");
e("m_religioese_schulen", "religioesitaet", .01, 24, "Religiöse Bildung prägt Werte.");
e("m_religioese_schulen", "polarisierung", .01, 12, "Über die Schulform wird heftig gestritten.");
e("m_berufsschulen", "fachkraefte", .04, 24, "Betriebe finden ausgebildete Leute.");
e("m_berufsschulen", "jugendarbeitslosigkeit", -.02, 24, "Der Weg in den Beruf wird kürzer.");
e("m_unigruendungen", "hochschule", -.01, 24, "Viele neue Universitäten verteilen knappe Professoren dünn.");
e("m_unigruendungen", "wachstum_regional", .01, 24, "Studierende beleben kleinere Städte.");
e("m_stipendien", "schulabbruch", -.02, 12, "Ärmere Kinder bleiben länger im Bildungssystem.");
e("m_forschung", "hochschule", .04, 24, "Forschungsgeld hält gute Leute.");
e("m_forschung", "produktivitaet", .02, 24, "Neue Technik macht produktiver.");
e("m_wissenschaftsfreiheit", "hochschule", .04, 12, "Freie Wissenschaft zieht Talente an.");
e("m_wissenschaftsfreiheit", "abwanderung", -.03, 12, "Wer frei forschen kann, bleibt eher.");
e("bildungsqualitaet", "fachkraefte", .04, 12, "Gute Schulen, gute Fachkräfte.");
e("hochschule", "fachkraefte", .03, 12, "Starke Universitäten bilden gut aus.");
e("fachkraefte", "produktivitaet", .04, 6, "Qualifizierte Arbeit ist produktiver.");
e("abwertung", "abwanderung", .03, 3, "Gehälter in Lira verlieren gegenüber dem Ausland.");
e("realeinkommen", "abwanderung", -.03, 3, "Wer gut verdient, bleibt eher.");
e("pressefreiheit", "abwanderung", -.02, 12, "Viele gehen auch wegen des politischen Klimas.");
e("polarisierung", "abwanderung", .02, 12, "Ein vergiftetes Klima treibt Menschen fort.");
e("abwanderung", "fachkraefte", -.05, 3, "Wer geht, fehlt.");
e("abwanderung", "aerzte", -.03, 3, "Auch Ärzte wandern ab.");
e("abwanderung", "p_abwanderung", .1, 0, "Anhaltende Abwanderung wird zum Problem.");
e("armut", "schulabbruch", .03, 6, "Arme Kinder müssen früher mitverdienen.");
e("schulabbruch", "jugendarbeitslosigkeit", .03, 12, "Ohne Abschluss kaum Arbeit.");
g("infrastruktur", "verkehrsnetz", "Straßen und Autobahnen", 60, "Zustand und Dichte des Straßennetzes.");
g("infrastruktur", "bahnnetz", "Bahnnetz", 35, "Schnellzüge, Güterbahn und Nahverkehr auf der Schiene.");
g("infrastruktur", "stau", "Stau in den Städten", 60, "Wie viel Zeit Menschen im Verkehr verlieren.");
g("infrastruktur", "logistik", "Logistik und Häfen", 55, "Wie schnell Waren ins Land, durchs Land und hinaus kommen.");
g("infrastruktur", "internet", "Breitband und Mobilfunk", 55, "Schnelles Internet in Stadt und Land.");
g("infrastruktur", "wachstum_regional", "Regionale Entwicklung", 50, "Wirtschaftliche Dynamik abseits der großen Zentren.");
m("infrastruktur", "m_autobahnen", "Autobahn- und Brückenbau", 55, .5, 36, "Neue Autobahnen, Brücken und Tunnel.");
m("infrastruktur", "m_oepp_garantien", "Garantien für Betreiberprojekte", 50, .3, 12, "Der Staat garantiert privaten Betreibern Mindesteinnahmen bei Autobahnen, Flughäfen und Kliniken.");
m("infrastruktur", "m_bahn", "Bahnausbau", 40, .5, 48, "Schnellfahrstrecken und Güterbahn.");
m("infrastruktur", "m_nahverkehr", "Nahverkehr", 40, .3, 24, "U-Bahnen, Straßenbahnen und Busse in den Städten.");
m("infrastruktur", "m_breitband", "Breitbandausbau", 40, .2, 24, "Glasfaser und Mobilfunk bis ins Dorf.");
m("infrastruktur", "m_regionalfoerderung", "Regionalförderung", 45, .3, 12, "Zuschüsse für strukturschwache Provinzen.");
e("m_autobahnen", "verkehrsnetz", .04, 36, "Neue Straßen, sobald sie fertig sind.");
e("m_autobahnen", "bauwirtschaft", .03, 3, "Großbaustellen beschäftigen die Bauwirtschaft.");
e("m_autobahnen", "korruption", .01, 12, "Große Aufträge, große Versuchungen.");
e("m_oepp_garantien", "verkehrsnetz", .02, 24, "Private Betreiber bauen schneller.");
e("m_oepp_garantien", "zinslast", .02, 24, "Garantiezahlungen belasten künftige Haushalte.");
e("m_bahn", "bahnnetz", .04, 48, "Neue Strecken, sobald sie fertig sind.");
e("m_bahn", "luftqualitaet", .01, 48, "Mehr Güter auf der Schiene, weniger Lastwagen.");
e("m_nahverkehr", "stau", -.04, 24, "U-Bahnen holen Autos von der Straße.");
e("m_nahverkehr", "luftqualitaet", .02, 24, "Weniger Abgase in den Städten.");
e("m_breitband", "internet", .05, 24, "Schnelles Netz, wo es vorher keines gab.");
e("m_regionalfoerderung", "wachstum_regional", .05, 12, "Förderung zieht Betriebe in schwächere Provinzen.");
e("m_regionalfoerderung", "landflucht", -.02, 24, "Wer vor Ort Arbeit findet, bleibt.");
e("verkehrsnetz", "logistik", .04, 6, "Gute Straßen, schnelle Lieferungen.");
e("bahnnetz", "logistik", .03, 6, "Die Bahn bringt Container billig zum Hafen.");
e("logistik", "export", .03, 6, "Wer schnell liefert, gewinnt Aufträge.");
e("logistik", "produktivitaet", .02, 12, "Weniger Leerlauf in der Lieferkette.");
e("internet", "produktivitaet", .02, 12, "Digitale Arbeit braucht schnelles Netz.");
e("internet", "wachstum_regional", .02, 12, "Gutes Netz macht auch Kleinstädte attraktiv.");
e("stau", "produktivitaet", -.02, 6, "Zeit im Stau ist verlorene Zeit.");
e("stau", "luftqualitaet", -.03, 1, "Stehende Autos verpesten die Luft.");
g("energie", "energiepreise", "Energiepreise", 65, "Strom-, Gas- und Kraftstoffpreise für Haushalte und Betriebe.");
g("energie", "energieimporte", "Abhängigkeit von Energieimporten", 70, "Anteil importierter Energie, vor allem Gas und Öl.");
g("energie", "stromversorgung", "Stromversorgung", 60, "Ob das Netz stabil genug für Industrie und Haushalte ist.");
g("energie", "erneuerbare", "Erneuerbare Energie", 45, "Anteil von Wasser, Wind, Sonne und Erdwärme am Strom.");
g("energie", "luftqualitaet", "Luftqualität", 45, "Wie sauber die Luft in den Städten ist.");
g("energie", "klimaschutz", "Klimaschutz", 35, "Wie stark die Emissionen sinken.");
m("energie", "m_energiesubventionen", "Energiesubventionen", 55, 1, 1, "Der Staat deckelt Strom- und Gaspreise und trägt die Differenz.");
m("energie", "m_solar_wind", "Ausbau von Sonne und Wind", 45, .2, 24, "Ausschreibungen und Einspeisevergütungen.");
m("energie", "m_kernkraft", "Kernkraft", 50, .2, 48, "Weitere Reaktoren neben dem ersten Kraftwerk.");
m("energie", "m_gasfoerderung", "Heimische Gasförderung", 50, .2, 24, "Förderung aus Feldern im Schwarzen Meer.");
m("energie", "m_umweltauflagen", "Umweltauflagen", 35, .05, 12, "Grenzwerte für Industrie, Kraftwerke und Verkehr.");
m("energie", "m_co2_preis", "CO₂-Preis", 10, -.2, 12, "Ein Preis für Emissionen, wichtig für den Handel mit der EU.");
m("energie", "m_netzausbau", "Stromnetzausbau", 45, .2, 24, "Leitungen, Speicher und Umspannwerke.");
p("energie", "p_stromausfaelle", "Stromausfälle", 30, 60, "Das Netz hält die Last nicht.");
p("energie", "p_luftverschmutzung", "Luftverschmutzung", 50, 60, "Smog in den großen Städten.");
e("abwertung", "energiepreise", .05, 1, "Öl und Gas werden in Dollar bezahlt.");
e("m_energiesubventionen", "energiepreise", -.06, 1, "Gedeckelte Preise, der Staat zahlt den Rest.");
e("m_energiesubventionen", "klimaschutz", -.01, 12, "Billige Energie wird verschwendet.");
e("energiepreise", "lebenshaltung", .05, 1, "Heizen und Tanken belasten jeden Haushalt.");
e("energiepreise", "kostendruck", .05, 1, "Energie ist für viele Betriebe der größte Kostenblock.");
e("energiepreise", "armut", .02, 2, "Energiearmut: Heizen wird zum Luxus.");
e("m_solar_wind", "erneuerbare", .04, 24, "Neue Anlagen gehen ans Netz.");
e("m_kernkraft", "energieimporte", -.02, 48, "Weniger Gas für Strom.");
e("m_gasfoerderung", "energieimporte", -.03, 24, "Eigenes Gas ersetzt Importe.");
e("erneuerbare", "energieimporte", -.04, 6, "Sonne und Wind müssen nicht importiert werden.");
e("erneuerbare", "klimaschutz", .04, 6, "Weniger Kohle und Gas im Strommix.");
e("energieimporte", "energiepreise", .03, 3, "Wer importiert, zahlt Weltmarktpreise.");
e("m_umweltauflagen", "luftqualitaet", .04, 12, "Filter und Grenzwerte wirken.");
e("m_umweltauflagen", "kostendruck", .01, 12, "Auflagen kosten die Betriebe Geld.");
e("m_co2_preis", "klimaschutz", .05, 12, "Emissionen bekommen einen Preis.");
e("m_co2_preis", "kostendruck", .02, 6, "Energieintensive Betriebe zahlen mehr.");
e("m_co2_preis", "export", .01, 24, "Die EU erhebt auf Importe ohne CO₂-Preis eine Grenzabgabe.");
e("m_netzausbau", "stromversorgung", .05, 24, "Stärkere Netze, weniger Ausfälle.");
e("wachstum", "stromversorgung", -.02, 3, "Mehr Produktion, mehr Last.");
e("stromversorgung", "p_stromausfaelle", -.1, 0, "Ein schwaches Netz fällt aus.");
e("p_stromausfaelle", "industrie", -.04, 0, "Ohne Strom stehen die Maschinen.");
e("luftqualitaet", "p_luftverschmutzung", -.1, 0, "Schlechte Luft wird zum Problem.");
g("landwirtschaft", "wasserversorgung", "Wasserversorgung", 55, "Ob Städte und Felder genug sauberes Wasser haben.");
g("landwirtschaft", "duerre", "Trockenheit", 45, "Niederschlagsmangel und sinkende Grundwasserspiegel.");
g("landwirtschaft", "ernte", "Ernten", 55, "Erträge von Getreide, Obst, Gemüse und Baumwolle.");
g("landwirtschaft", "lebensmittelpreise", "Lebensmittelpreise", 65, "Preise für Brot, Gemüse, Fleisch und Milch.");
g("landwirtschaft", "landwirtschaft_einkommen", "Einkommen der Landwirte", 40, "Was Bauern nach Abzug der Kosten bleibt.");
g("landwirtschaft", "landflucht", "Landflucht", 55, "Wie viele Menschen Dörfer und Kleinstädte verlassen.");
m("landwirtschaft", "m_agrarsubventionen", "Agrarsubventionen", 45, .4, 6, "Zahlungen je Fläche und Produkt, Zuschüsse für Diesel und Dünger.");
m("landwirtschaft", "m_bewaesserung", "Moderne Bewässerung", 35, .2, 24, "Tropfbewässerung statt Überflutung der Felder.");
m("landwirtschaft", "m_staudaemme", "Staudämme und Speicher", 50, .3, 48, "Talsperren für Wasser und Strom.");
m("landwirtschaft", "m_wasserleitungen", "Wasserleitungen und Kläranlagen", 40, .3, 24, "Trinkwassernetz, weniger Leitungsverluste, Abwasserreinigung.");
m("landwirtschaft", "m_saatgut", "Saatgut- und Erzeugerprogramme", 35, .1, 12, "Beratung, Genossenschaften und bessere Sorten.");
m("landwirtschaft", "m_mechanisierung", "Landwirtschaftliche Mechanisierung", 30, .5, 36, "Traktoren, Mähdrescher und Erntemaschinen: von Handarbeit über Maschinen zu High-Tech mit GPS und Drohnen. Höhere Erträge, weniger Arbeitskräfte, Dieselverbrauch und Wartungskosten.");
m("landwirtschaft", "m_agrarforschung", "Agrarforschung und Hochtechnologie", 28, .3, 24, "Hochleistungssaat, Präzisionslandwirtschaft, Bodensensorik und Digitalisierung der Betriebe.");
m("wirtschaft", "m_industrie_modernisierung", "Industrielle Modernisierung", 35, .6, 36, "Neue Maschinengenerationen und Automation. Die Umstellung dauert; alte Anlagen laufen weiter, Fachkräfte werden gebraucht.");
e("m_mechanisierung", "ernte", .05, 6, "Maschinen erhöhen den Ertrag pro Fläche und verkürzen die Erntezeit.");
e("m_mechanisierung", "landwirtschaft_einkommen", .04, 12, "Höhere Erträge und weniger Verluste erhöhen das Einkommen der Landwirte.");
e("m_mechanisierung", "lebensmittelpreise", -.03, 6, "Günstigere Produktion dämpft die Nahrungsmittelpreise.");
e("m_mechanisierung", "landflucht", -.02, 12, "Rentable Betriebe halten Menschen auf dem Land, doch Maschinen ersetzen auch Arbeitskräfte.");
e("m_mechanisierung", "energieimporte", .02, 3, "Diesel und Strom für Maschinen erhöhen den Energiebedarf.");
e("m_agrarforschung", "ernte", .04, 12, "Bessere Sorten und Präzisionslandwirtschaft steigern die Erträge.");
e("m_agrarforschung", "wasserversorgung", .02, 6, "Tropfbewässerung und Sensorik sparen Wasser.");
e("m_agrarforschung", "landwirtschaft_einkommen", .03, 12, "Wissen macht die Betriebe wettbewerbsfähiger.");
e("m_industrie_modernisierung", "produktivitaet", .05, 12, "Neue Maschinengenerationen erhöhen die Produktivität der Industrie.");
e("m_industrie_modernisierung", "investitionen", .03, 6, "Modernisierung bindet und lockt Kapital.");
e("m_industrie_modernisierung", "arbeitsplaetze_industrie", -.02, 12, "Automation ersetzt einen Teil der Arbeitsplätze, schafft aber produktivere.");
m("haushalt", "m_verwaltungsdigital", "Digitale Verwaltung und Steuertechnik", 30, .2, 24, "E-Rechnung, Datenabgleich, digitale Behördenwege: von Papierakten zu vernetzten Verfahren.");
m("arbeit", "m_fachkraefteprogramm", "Fachkräfte und Weiterbildung", 35, .3, 24, "Technikerschulen, Meisterbetriebe, Umschulung: die Stufenleiter braucht Menschen, die sie bedienen.");
m("bildung", "m_bildungstechnik", "Bildungstechnik und digitales Lernen", 30, .2, 24, "Geräte, Lernplattformen und Fortbildung der Lehrkräfte.");
m("gesundheit", "m_medizintechnik", "Medizintechnik und Krankenhausmodernisierung", 30, .4, 24, "Digitale Diagnostik, moderne Geräte, vernetzte Patientenakten.");
m("infrastruktur", "m_smart_infrastruktur", "Intelligente Infrastruktur", 25, .3, 24, "Verkehrsleitsysteme, Sensoren, digitale Netze: mehr Kapazität ohne neue Straßen.");
m("energie", "m_speicher_smartgrid", "Netzmodernisierung und Speicher", 28, .35, 24, "Smart Grid, Batteriespeicher, digitale Laststeuerung.");
m("wohnen", "m_bauindustrie", "Industrieller Wohnungsbau", 25, .3, 24, "Modulbau und Vorfertigung: Wohnungen in Fabrikqualität, schneller und günstiger.");
m("sicherheit", "m_polizeitechnik", "Moderne Sicherheitsverwaltung", 30, .25, 24, "Forensik, digitale Aktenführung, bessere Koordinierung der Behörden.");
m("gesellschaft", "m_digitale_oeffentlichkeit", "Digitale Öffentlichkeit und Beteiligung", 35, .15, 12, "Online-Beteiligung, offene Daten, digitale Behördengänge.");
m("aussen", "m_handelssysteme", "Moderne Zoll- und Handelssysteme", 30, .2, 24, "Digitale Zollabfertigung, nachvollziehbare Lieferketten, Umsetzung von Handelsabkommen.");
e("m_verwaltungsdigital", "steuereinnahmen", .04, 6, "Bessere Erfassung hebt die realen Einnahmen.");
e("m_verwaltungsdigital", "steuermoral", .03, 6, "Digitale Verfahren machen Hinterziehen schwieriger.");
e("m_verwaltungsdigital", "schattenwirtschaft", -.03, 12, "Digitale Zahlungen verkleinern den grauen Markt.");
e("m_fachkraefteprogramm", "fachkraefte", .04, 12, "Weiterbildung und Technikerschulen erhöhen den Fachkräftebestand.");
e("m_fachkraefteprogramm", "produktivitaet", .04, 12, "Gut ausgebildete Fachkräfte machen Betriebe produktiver.");
e("m_fachkraefteprogramm", "arbeitsplaetze_industrie", .03, 12, "Qualifizierte Arbeitskräfte ziehen bessere Industrie an.");
e("m_fachkraefteprogramm", "jugendarbeitslosigkeit", -.03, 6, "Ausbildungsplätze halten Jugendliche im Erwerbsleben.");
e("m_fachkraefteprogramm", "abwanderung", -.03, 12, "Perspektiven im Land halten Fachkräfte vom Auswandern ab.");
e("m_bildungstechnik", "bildungsqualitaet", .04, 12, "Gute Werkzeuge und geschulte Lehrkräfte heben den Unterricht.");
e("m_bildungstechnik", "hochschule", .03, 12, "Digitale Ausstattung stärkt Forschung und Lehre.");
e("m_bildungstechnik", "schulabbruch", -.02, 6, "Individuelle Förderung fängt schwache Schüler auf.");
e("m_bildungstechnik", "fachkraefte", .02, 12, "Bessere Bildung liefert den Nachwuchs für die Modernisierung.");
e("m_medizintechnik", "gesundheitsversorgung", .05, 6, "Moderne Geräte verbessern die Versorgung spürbar.");
e("m_medizintechnik", "wartezeiten", -.04, 6, "Digitale Abläufe verkürzen die Wartezeiten.");
e("m_medizintechnik", "medikamente", .02, 6, "Vernetzte Lieferketten sichern die Arzneimittelversorgung.");
e("m_medizintechnik", "lebenserwartung", .01, 24, "Bessere Diagnostik rettet Leben — langsam und wenig sichtbar.");
e("m_smart_infrastruktur", "stau", -.04, 6, "Leitsysteme verteilen den Verkehr besser.");
e("m_smart_infrastruktur", "logistik", .04, 6, "Vernetzte Häfen und Terminals beschleunigen den Warenfluss.");
e("m_smart_infrastruktur", "internet", .03, 6, "Der Ausbau der Netze geht Hand in Hand.");
e("m_smart_infrastruktur", "verkehrsnetz", .02, 12, "Kapazitätsreserven heben die Auslastung der Straßen.");
e("m_speicher_smartgrid", "stromversorgung", .05, 6, "Speicher und Laststeuerung stabilisieren das Netz.");
e("m_speicher_smartgrid", "erneuerbare", .04, 6, "Ohne Speicher bleibt Wind und Sonne ungenutzt.");
e("m_speicher_smartgrid", "energiepreise", -.03, 12, "Effiziente Netze senken die Erzeugungskosten.");
e("m_speicher_smartgrid", "energieimporte", -.02, 12, "Mehr eigene Erneuerbare ersetzen importiertes Gas und Öl.");
e("m_bauindustrie", "wohnungsbau", .05, 6, "Vorfertigung beschleunigt den Bau spürbar.");
e("m_bauindustrie", "mieten", -.04, 12, "Mehr Wohnungen zu günstigeren Kosten dämpfen die Mieten.");
e("m_bauindustrie", "bauwirtschaft", .03, 6, "Die Bauwirtschaft wächst mit der Serie.");
e("m_bauindustrie", "bauqualitaet", .02, 6, "Werkshallen und Standards sichern die Qualität.");
e("m_polizeitechnik", "kriminalitaet", -.04, 6, "Bessere Aufklärung wirkt abschreckend.");
e("m_polizeitechnik", "justizvertrauen", .03, 12, "Schnelle, nachvollziehbare Verfahren stärken das Vertrauen.");
e("m_polizeitechnik", "rechtssicherheit", .02, 12, "Digitale Akten und klare Zuständigkeiten erhöhen die Rechtssicherheit.");
e("m_digitale_oeffentlichkeit", "zivilgesellschaft", .03, 6, "Digitale Beteiligung erleichtert Vereins- und Bürgerarbeit.");
e("m_digitale_oeffentlichkeit", "vertrauen_regierung", .02, 6, "Transparente Verfahren wirken dem Misstrauen entgegen.");
e("m_digitale_oeffentlichkeit", "polarisierung", .02, 12, "Digitale Räume spalten auch: mehr Öffentlichkeit bedeutet mehr Streit.");
e("m_handelssysteme", "export", .04, 12, "Schnelle Zölle und nachvollziehbare Lieferketten stärken die Ausfuhr.");
e("m_handelssysteme", "logistik", .03, 6, "Digitale Abfertigung beschleunigt die Häfen.");
e("m_handelssysteme", "tourismus", .02, 6, "Reibungslose Einreise und Abfertigung erleichtern den Tourismus.");
e("m_handelssysteme", "ansehen", .02, 12, "Ein verlässlicher Handelspartner genießt Ansehen.");
p("landwirtschaft", "p_wassermangel", "Wassermangel", 40, 60, "Die Wasserversorgung wird schlechter; in manchen Städten wird Wasser rationiert.");
p("landwirtschaft", "p_landflucht", "Verödung ländlicher Regionen", 45, 60, "Dörfer leeren sich, Schulen und Praxen schließen.");
e("duerre", "wasserversorgung", -.05, 1, "Ohne Regen leeren sich die Speicher.");
e("duerre", "ernte", -.06, 2, "Trockenheit vernichtet Ernten.");
e("m_bewaesserung", "wasserversorgung", .03, 24, "Effiziente Bewässerung spart viel Wasser.");
e("m_bewaesserung", "ernte", .03, 24, "Gleichmäßige Bewässerung, stabilere Erträge.");
e("m_staudaemme", "wasserversorgung", .04, 48, "Speicher überbrücken trockene Sommer.");
e("m_staudaemme", "erneuerbare", .02, 48, "Wasserkraft liefert Strom.");
e("m_staudaemme", "polarisierung", .01, 12, "Umsiedlungen und überflutete Kulturstätten sind umstritten.");
e("m_wasserleitungen", "wasserversorgung", .05, 24, "Weniger Verluste im Netz, sauberes Wasser in den Städten.");
e("wasserversorgung", "p_wassermangel", -.1, 0, "Wo das Wasser knapp wird, wird es zum Problem.");
e("wasserversorgung", "ernte", .03, 3, "Felder brauchen Wasser.");
e("m_agrarsubventionen", "landwirtschaft_einkommen", .05, 6, "Direkte Zahlungen stützen die Höfe.");
e("m_agrarsubventionen", "ernte", .02, 12, "Günstiger Dünger und Diesel erhöhen die Erträge.");
e("m_saatgut", "ernte", .03, 12, "Bessere Sorten und Beratung.");
e("ernte", "lebensmittelpreise", -.05, 2, "Gute Ernten drücken die Preise.");
e("abwertung", "lebensmittelpreise", .03, 2, "Futter, Dünger und Diesel werden importiert.");
e("energiepreise", "lebensmittelpreise", .03, 2, "Traktoren, Kühlhäuser und Transport brauchen Energie.");
e("lebensmittelpreise", "lebenshaltung", .06, 0, "Lebensmittel sind der größte Posten im Einkaufskorb.");
e("lebensmittelpreise", "kostendruck", .02, 1, "Auch Kantinen und Restaurants zahlen mehr.");
e("lebensmittelpreise", "landwirtschaft_einkommen", .03, 1, "Höhere Preise, höhere Erlöse, wenn die Kosten nicht mitsteigen.");
e("ernte", "landwirtschaft_einkommen", .04, 1, "Gute Ernte, gutes Jahr.");
e("landwirtschaft_einkommen", "landflucht", -.04, 6, "Wer von der Landwirtschaft leben kann, bleibt.");
e("landflucht", "p_landflucht", .1, 0, "Anhaltende Abwanderung leert Dörfer.");
e("landflucht", "mieten", .02, 6, "Wer in die Stadt zieht, braucht eine Wohnung.");
e("landflucht", "stau", .01, 12, "Die Städte wachsen.");
e("wachstum_regional", "landflucht", -.04, 6, "Arbeit vor Ort hält die Menschen.");
g("wohnen", "mieten", "Mieten", 70, "Mieten in den Städten im Verhältnis zum Einkommen.");
g("wohnen", "wohnungsbau", "Wohnungsbau", 50, "Wie viele Wohnungen fertig werden.");
g("wohnen", "bauwirtschaft", "Bauwirtschaft", 50, "Aufträge und Beschäftigung am Bau.");
g("wohnen", "bauqualitaet", "Bauqualität", 45, "Ob Gebäude nach Vorschrift gebaut sind.");
g("wohnen", "erdbebenvorsorge", "Erdbebenvorsorge", 40, "Wie viele Gebäude erdbebensicher sind und wie gut der Katastrophenschutz vorbereitet ist.");
m("wohnen", "m_sozialwohnungen", "Staatlicher Wohnungsbau", 50, .4, 24, "Wohnungen der staatlichen Wohnungsbaubehörde, günstig verkauft oder vermietet.");
m("wohnen", "m_mietdeckel", "Mietpreisbremse", 30, 0, 1, "Obergrenze für Mieterhöhungen.");
m("wohnen", "m_stadterneuerung", "Erdbebensichere Stadterneuerung", 40, .5, 36, "Abriss und Neubau gefährdeter Häuser.");
m("wohnen", "m_bauaufsicht", "Bauaufsicht", 40, .05, 12, "Unabhängige Prüfung von Statik und Material.");
m("wohnen", "m_baukredite", "Günstige Baukredite", 35, .3, 3, "Zinsverbilligte Kredite für Wohnungskäufer.");
m("wohnen", "m_bauamnestie", "Bauamnestie", 15, -.1, 2, "Nachträgliche Legalisierung illegaler Bauten gegen Gebühr.");
p("wohnen", "p_wohnungsnot", "Wohnungsnot", 55, 60, "Mieten fressen die Einkommen, junge Familien finden keine Wohnung.");
p("wohnen", "p_erdbebengefahr", "Erdbebengefahr", 55, 60, "Viele Gebäude würden ein starkes Beben nicht überstehen.");
e("m_sozialwohnungen", "wohnungsbau", .05, 24, "Der Staat baut selbst.");
e("m_sozialwohnungen", "bauwirtschaft", .03, 6, "Aufträge für Baufirmen.");
e("m_sozialwohnungen", "korruption", .01, 12, "Vergaben an nahestehende Baufirmen sind ein bekanntes Risiko.");
e("m_mietdeckel", "mieten", -.05, 1, "Bestehende Mieten steigen langsamer.");
e("m_mietdeckel", "wohnungsbau", -.03, 12, "Vermieten lohnt weniger, weniger wird gebaut.");
e("m_mietdeckel", "polarisierung", .01, 6, "Streit zwischen Mietern und Vermietern.");
e("m_stadterneuerung", "erdbebenvorsorge", .05, 36, "Gefährdete Häuser werden ersetzt.");
e("m_stadterneuerung", "bauwirtschaft", .04, 6, "Großes Bauprogramm.");
e("m_stadterneuerung", "mieten", .02, 12, "Während des Umbaus fehlen Wohnungen.");
e("m_bauaufsicht", "bauqualitaet", .05, 12, "Wer geprüft wird, baut sauber.");
e("m_bauaufsicht", "wohnungsbau", -.01, 6, "Prüfungen kosten Zeit.");
e("m_bauaufsicht", "korruption", -.02, 12, "Unabhängige Prüfer sind schwerer zu bestechen.");
e("m_bauamnestie", "bauqualitaet", -.05, 6, "Unsichere Bauten werden legalisiert statt ertüchtigt.");
e("m_bauamnestie", "steuereinnahmen", .02, 2, "Gebühren bringen schnelles Geld.");
e("m_baukredite", "wohnungsbau", .04, 6, "Mehr Käufer, mehr Neubau.");
e("m_baukredite", "mieten", -.02, 12, "Wer kauft, mietet nicht.");
e("leitzins", "wohnungsbau", -.04, 6, "Hohe Zinsen machen Baukredite teuer.");
e("wohnungsbau", "mieten", -.04, 6, "Mehr Wohnungen, weniger Druck auf die Mieten.");
e("wohnungsbau", "bauwirtschaft", .04, 1, "Neubau ist Bauwirtschaft.");
e("bauwirtschaft", "arbeitsplaetze_industrie", .02, 3, "Der Bau beschäftigt viele Menschen.");
e("inflation", "mieten", .04, 1, "Vermieter gleichen die Inflation aus.");
e("mieten", "lebenshaltung", .05, 0, "Die Miete ist der größte Fixposten.");
e("mieten", "p_wohnungsnot", .1, 0, "Unbezahlbare Mieten werden zur Wohnungsnot.");
e("bauqualitaet", "erdbebenvorsorge", .03, 12, "Gut gebaute Häuser halten Beben stand.");
e("korruption", "bauqualitaet", -.03, 6, "Wo geschmiert wird, wird gepfuscht.");
e("erdbebenvorsorge", "p_erdbebengefahr", -.1, 0, "Wenig Vorsorge heißt große Gefahr.");
g("sicherheit", "kriminalitaet", "Kriminalität", 45, "Diebstahl, Gewalt, organisierte Kriminalität.");
g("sicherheit", "terrorgefahr", "Terrorgefahr", 40, "Gefahr von Anschlägen.");
g("sicherheit", "justizvertrauen", "Vertrauen in die Justiz", 35, "Ob Menschen glauben, vor Gericht fair behandelt zu werden.");
g("sicherheit", "korruption", "Korruption", 55, "Bestechung, Vetternwirtschaft und manipulierte Vergaben.");
g("sicherheit", "rechtssicherheit", "Rechtssicherheit", 40, "Ob Regeln für alle gleich gelten und vorhersehbar sind.");
g("sicherheit", "militaer", "Einsatzbereitschaft der Streitkräfte", 60, "Ausrüstung, Ausbildung und Moral der Armee.");
m("sicherheit", "m_polizei", "Polizei und Gendarmerie", 60, .3, 6, "Personal und Ausstattung der Sicherheitskräfte.");
m("recht", "m_justizreform", "Justizreform", 35, .1, 18, "Reformpaket der Gerichtsverfassung: Verfahrensrecht, Ausbildung, Gerichtsstruktur. Richterstellen und Richterrat sind eigene Stellschrauben.");
m("recht", "m_antikorruption", "Korruptionsbekämpfung", 35, .05, 12, "Unabhängige Ermittler, offene Vergaben, Vermögenserklärungen.");
m("sicherheit", "m_friedensprozess", "Friedensprozess", 55, .1, 12, "Politische Lösung mit Waffenabgabe und Wiedereingliederung.");
m("militaer", "m_verteidigung", "Verteidigungsausgaben", 55, 1, 12, "Budget für Streitkräfte und Rüstungsindustrie.");
m("militaer", "m_ruestungsindustrie", "Heimische Rüstungsindustrie", 60, .3, 24, "Drohnen, Panzer, Schiffe aus eigener Produktion.");
p("sicherheit", "p_korruption", "Korruptionsskandale", 45, 60, "Vergaben und Ämter werden gekauft; die Presse berichtet.");
p("sicherheit", "p_kriminalitaet", "Unsicherheit auf den Straßen", 35, 60, "Menschen fühlen sich nachts nicht mehr sicher.");
e("m_polizei", "kriminalitaet", -.04, 6, "Mehr Streifen, weniger Straftaten.");
e("m_polizei", "terrorgefahr", -.02, 6, "Mehr Ermittler, mehr vereitelte Anschläge.");
e("armut", "kriminalitaet", .03, 6, "Not treibt manche in die Kriminalität.");
e("jugendarbeitslosigkeit", "kriminalitaet", .02, 6, "Junge ohne Perspektive sind anfälliger.");
e("m_justizreform", "justizvertrauen", .04, 18, "Faire und schnelle Verfahren schaffen Vertrauen.");
e("m_justizreform", "rechtssicherheit", .04, 18, "Vorhersehbare Urteile.");
e("m_antikorruption", "korruption", -.05, 12, "Wer erwischt wird, zahlt einen Preis.");
e("m_antikorruption", "p_korruption", .03, 3, "Ermittlungen bringen erst einmal Skandale ans Licht.");
e("korruption", "p_korruption", .1, 0, "Verbreitete Korruption fliegt irgendwann auf.");
e("korruption", "auslandskapital", -.03, 6, "Investoren meiden Länder, in denen man zahlen muss.");
e("korruption", "justizvertrauen", -.03, 6, "Wer Korruption sieht, verliert Vertrauen.");
e("rechtssicherheit", "auslandskapital", .04, 6, "Investoren brauchen verlässliche Regeln.");
e("rechtssicherheit", "investitionen", .02, 6, "Auch heimische Firmen investieren nur, wenn sie ihrem Recht vertrauen.");
e("justizvertrauen", "rechtssicherheit", .03, 6, "Eine vertrauenswürdige Justiz macht Regeln verlässlich.");
e("m_friedensprozess", "terrorgefahr", -.04, 12, "Wer die Waffen niederlegt, verübt keine Anschläge.");
e("m_friedensprozess", "polarisierung", .02, 3, "Über den Prozess wird heftig gestritten.");
e("m_friedensprozess", "wachstum_regional", .02, 24, "Frieden bringt Investitionen in den Südosten.");
e("terrorgefahr", "tourismus", -.04, 1, "Anschläge vertreiben Gäste.");
e("terrorgefahr", "investitionen", -.02, 3, "Unsicherheit bremst Investitionen.");
e("m_verteidigung", "militaer", .04, 12, "Mehr Geld, bessere Ausrüstung.");
e("m_ruestungsindustrie", "militaer", .02, 24, "Eigene Waffen, weniger Abhängigkeit.");
e("m_ruestungsindustrie", "industrie", .02, 24, "Rüstungsbetriebe sind Hochtechnologie.");
e("m_ruestungsindustrie", "export", .01, 24, "Drohnen und Schiffe werden exportiert.");
e("kriminalitaet", "p_kriminalitaet", .1, 0, "Steigende Kriminalität wird spürbar.");
g("gesellschaft", "pressefreiheit", "Pressefreiheit", 30, "Ob Journalisten frei berichten können.");
g("gesellschaft", "polarisierung", "Polarisierung", 70, "Wie tief die politischen Gräben sind.");
g("gesellschaft", "vertrauen_regierung", "Vertrauen in die Regierung", 45, "Ob die Menschen der Regierung glauben.");
g("gesellschaft", "religioesitaet", "Religiöse Prägung", 60, "Wie stark religiöse Werte den Alltag prägen.");
g("gesellschaft", "frauenrechte", "Gleichstellung", 40, "Rechte und Schutz von Frauen im Alltag.");
g("gesellschaft", "zivilgesellschaft", "Zivilgesellschaft", 40, "Vereine, Stiftungen und Initiativen, die sich einmischen.");
m("gesellschaft", "m_medienaufsicht", "Medienaufsicht", 65, 0, 3, "Strafen und Sendeverbote durch die Rundfunkaufsicht.");
m("gesellschaft", "m_internetsperren", "Internetsperren", 60, 0, 1, "Sperren von Seiten und Beiträgen, Drosselung sozialer Medien.");
m("gesellschaft", "m_staatsmedien", "Staatliche Medien und Werbung", 60, .1, 3, "Budget für Staatssender und staatliche Anzeigen.");
m("gesellschaft", "m_religionsbehoerde", "Budget der Religionsbehörde", 60, .2, 6, "Moscheen, Imame, religiöse Bildung.");
m("gesellschaft", "m_gewaltschutz", "Schutz vor Gewalt gegen Frauen", 35, .05, 12, "Frauenhäuser, Schutzanordnungen, Schulungen für Polizei.");
m("gesellschaft", "m_versammlungsfreiheit", "Versammlungsfreiheit", 35, 0, 3, "Wie frei Demonstrationen stattfinden dürfen.");
p("gesellschaft", "p_polarisierung", "Tiefe Spaltung", 65, 70, "Die Lager reden nicht mehr miteinander.");
e("m_medienaufsicht", "pressefreiheit", -.05, 3, "Strafen schüchtern Redaktionen ein.");
e("m_internetsperren", "pressefreiheit", -.04, 1, "Wer nicht lesen kann, erfährt nichts.");
e("m_internetsperren", "internet", -.01, 1, "Gesperrte Dienste bremsen auch Firmen.");
e("m_staatsmedien", "vertrauen_regierung", .02, 3, "Freundliche Berichterstattung stützt die Regierung, bei einem Teil der Menschen.");
e("m_staatsmedien", "polarisierung", .02, 6, "Die anderen fühlen sich übergangen.");
e("pressefreiheit", "korruption", -.03, 12, "Wo recherchiert wird, wird weniger geschmiert.");
e("pressefreiheit", "rechtssicherheit", .02, 12, "Öffentliche Kontrolle diszipliniert Behörden.");
e("pressefreiheit", "auslandskapital", .01, 12, "Investoren lesen auch die Berichte über Pressefreiheit.");
e("m_religionsbehoerde", "religioesitaet", .01, 24, "Mehr religiöse Angebote.");
e("m_gewaltschutz", "frauenrechte", .05, 12, "Schutz wirkt, wenn er durchgesetzt wird.");
e("frauenrechte", "frauenerwerb", .03, 12, "Wer sicher und gleichberechtigt ist, arbeitet eher.");
e("m_versammlungsfreiheit", "zivilgesellschaft", .04, 6, "Wer demonstrieren darf, organisiert sich.");
e("m_versammlungsfreiheit", "polarisierung", -.01, 12, "Protest hat ein Ventil.");
e("zivilgesellschaft", "korruption", -.02, 12, "Initiativen decken Missstände auf.");
e("lebenshaltung", "vertrauen_regierung", -.04, 1, "Wem das Geld nicht reicht, der gibt der Regierung die Schuld.");
e("korruption", "vertrauen_regierung", -.02, 3, "Skandale beschädigen das Vertrauen.");
e("polarisierung", "p_polarisierung", .1, 0, "Die Gräben werden unüberbrückbar.");
e("polarisierung", "vertrauen_regierung", -.01, 3, "Die andere Hälfte vertraut grundsätzlich nicht.");
g("aussen", "gefluechtete", "Geflüchtete im Land", 60, "Zahl der Geflüchteten, vor allem aus Syrien.");
g("aussen", "beziehungen_eu", "Beziehungen zur EU", 40, "Handel, Visafragen, Beitrittsprozess.");
g("aussen", "beziehungen_usa", "Beziehungen zu den USA", 45, "Bündnis, Rüstung, Sanktionen.");
g("aussen", "beziehungen_russland", "Beziehungen zu Russland", 55, "Energie, Tourismus, Rüstung.");
g("aussen", "beziehungen_nahost", "Beziehungen zu den Nachbarn im Nahen Osten", 45, "Syrien, Irak, Iran, Israel, Golfstaaten.");
g("aussen", "ansehen", "Internationales Ansehen", 45, "Wie das Land im Ausland wahrgenommen wird.");
m("aussen", "m_rueckkehr", "Rückkehrprogramm für Geflüchtete", 40, .1, 12, "Anreize und Abkommen für die Rückkehr nach Syrien.");
m("aussen", "m_integration", "Integration von Geflüchteten", 35, .2, 12, "Sprachkurse, Arbeitserlaubnisse, Schulplätze.");
m("aussen", "m_grenzschutz", "Grenzschutz", 60, .2, 12, "Mauern, Personal und Technik an den Grenzen.");
m("aussen", "m_eu_annaeherung", "Annäherung an die EU", 35, 0, 12, "Reformen für Visafreiheit und Zollunion.");
p("aussen", "p_migrationsdruck", "Spannungen um Migration", 55, 60, "Unmut über Geflüchtete, Konflikte in Stadtvierteln.");
e("m_rueckkehr", "gefluechtete", -.03, 12, "Ein Teil kehrt zurück, wenn es sicher ist.");
e("m_integration", "informelle_arbeit", -.02, 12, "Mit Arbeitserlaubnis arbeiten Geflüchtete offiziell.");
e("m_integration", "p_migrationsdruck", -.03, 12, "Wer integriert ist, fällt weniger auf.");
e("m_grenzschutz", "gefluechtete", -.01, 12, "Weniger neue Ankünfte.");
e("m_grenzschutz", "beziehungen_eu", .01, 6, "Die EU schätzt Grenzschutz, sie zahlt dafür.");
e("gefluechtete", "informelle_arbeit", .02, 6, "Viele Geflüchtete arbeiten ohne Vertrag.");
e("gefluechtete", "mieten", .01, 6, "Mehr Nachfrage nach billigen Wohnungen.");
e("gefluechtete", "p_migrationsdruck", .06, 0, "Viele Geflüchtete, viel Streit.");
e("arbeitslosigkeit", "p_migrationsdruck", .03, 1, "In schlechten Zeiten sucht man Schuldige.");
e("m_eu_annaeherung", "beziehungen_eu", .05, 12, "Reformen öffnen Türen in Brüssel.");
e("m_eu_annaeherung", "rechtssicherheit", .02, 24, "EU-Standards verlangen verlässliche Regeln.");
e("pressefreiheit", "beziehungen_eu", .02, 6, "Die EU achtet auf Pressefreiheit.");
e("beziehungen_eu", "export", .03, 12, "Die EU ist der wichtigste Absatzmarkt.");
e("beziehungen_eu", "auslandskapital", .03, 6, "Gute Beziehungen beruhigen Investoren.");
e("beziehungen_usa", "auslandskapital", .02, 6, "Sanktionsrisiken schrecken Anleger ab.");
e("beziehungen_usa", "militaer", .02, 24, "Ersatzteile und Rüstungsgüter aus den USA.");
e("beziehungen_russland", "energiepreise", -.02, 6, "Gute Beziehungen, günstigeres Gas.");
e("beziehungen_russland", "tourismus", .02, 6, "Russische Gäste sind eine große Gruppe.");
e("beziehungen_nahost", "export", .02, 12, "Irak und Golfstaaten sind wichtige Märkte.");
e("beziehungen_nahost", "terrorgefahr", -.02, 12, "Zusammenarbeit an den Grenzen.");
e("ansehen", "tourismus", .02, 6, "Ein gutes Bild zieht Gäste an.");
e("pressefreiheit", "ansehen", .02, 6, "Das Ausland schaut auf die Pressefreiheit.");
grp("rentner", "Rentnerinnen und Rentner", "Leben von Renten; spüren Teuerung und Gesundheitsversorgung.");
grp("arbeitnehmer", "Beschäftigte", "Angestellte und Arbeiter; achten auf Löhne, Jobs und Preise.");
grp("unternehmer", "Unternehmer und Selbständige", "Achten auf Kredite, Steuern, Kosten und verlässliche Regeln.");
grp("landwirte", "Landwirte", "Achten auf Erträge, Preise, Wasser und Subventionen.");
grp("junge", "Junge Erwachsene", "Achten auf Jobs, Wohnungen, Bildung und Freiheit.");
grp("beamte", "Staatsbedienstete", "Achten auf Gehälter und die Lage des Staates.");
grp("konservative", "Religiös-Konservative", "Achten auf Werte, Familie, Stabilität und Sicherheit.");
grp("staedtische_saekulare", "Säkulare Städter", "Achten auf Freiheit, Rechtsstaat, Bildung und Wirtschaft.");
e("rentenniveau", "rentner", .08, 0, "Die Rente ist ihr Einkommen.");
e("lebenshaltung", "rentner", -.06, 0, "Jede Preiserhöhung trifft sie direkt.");
e("gesundheitsversorgung", "rentner", .03, 3, "Ältere brauchen Ärzte.");
e("m_fruehrente", "rentner", .03, 1, "Wer früher in Rente darf, ist dankbar.");
e("realeinkommen", "arbeitnehmer", .07, 0, "Was am Monatsende bleibt, zählt.");
e("arbeitslosigkeit", "arbeitnehmer", -.02, 0, "Angst um den Arbeitsplatz.");
e("lebenshaltung", "arbeitnehmer", -.04, 0, "Teures Leben frisst den Lohn.");
e("m_mindestlohn", "arbeitnehmer", .03, 0, "Jede Erhöhung wird gefeiert.");
e("kredite", "unternehmer", .04, 1, "Ohne Kredit kein Geschäft.");
e("kostendruck", "unternehmer", -.05, 0, "Steigende Kosten fressen die Marge.");
e("rechtssicherheit", "unternehmer", .03, 3, "Sie brauchen verlässliche Regeln.");
e("m_koerperschaftsteuer", "unternehmer", -.03, 1, "Niemand zahlt gern mehr Steuern.");
e("mittelstand", "unternehmer", .04, 1, "Geht es den Betrieben gut, sind die Inhaber zufrieden.");
e("landwirtschaft_einkommen", "landwirte", .08, 0, "Das Einkommen vom Hof.");
e("wasserversorgung", "landwirte", .03, 0, "Ohne Wasser keine Ernte.");
e("m_agrarsubventionen", "landwirte", .03, 0, "Subventionen sind für viele überlebenswichtig.");
e("jugendarbeitslosigkeit", "junge", -.05, 0, "Keine Arbeit, keine Zukunft.");
e("mieten", "junge", -.04, 0, "Die eigene Wohnung ist unerreichbar.");
e("pressefreiheit", "junge", .02, 3, "Viele Junge wollen frei im Netz reden.");
e("m_internetsperren", "junge", -.03, 0, "Gesperrte Plattformen ärgern vor allem Junge.");
e("bildungsqualitaet", "junge", .02, 6, "Gute Bildung, gute Chancen.");
e("m_aerztegehalt", "beamte", .02, 0, "Auch Staatsbedienstete profitieren von Gehaltsrunden.");
e("m_lehrergehaelter", "beamte", .03, 0, "Lehrkräfte sind die größte Gruppe im Staatsdienst.");
e("inflation", "beamte", -.04, 0, "Feste Gehälter verlieren an Wert.");
e("religioesitaet", "konservative", .02, 6, "Religiöse Werte im Alltag.");
e("m_religionsbehoerde", "konservative", .02, 3, "Moscheen und religiöse Bildung.");
e("m_religioese_schulen", "konservative", .02, 6, "Religiöse Schulen sind ihnen wichtig.");
e("kriminalitaet", "konservative", -.02, 0, "Sicherheit und Ordnung.");
e("terrorgefahr", "konservative", -.02, 0, "Sicherheit vor allem.");
e("lebenshaltung", "konservative", -.03, 0, "Auch sie zahlen die Preise.");
e("pressefreiheit", "staedtische_saekulare", .04, 0, "Freiheit ist ihnen wichtig.");
e("rechtssicherheit", "staedtische_saekulare", .03, 0, "Rechtsstaat ist ihnen wichtig.");
e("m_religioese_schulen", "staedtische_saekulare", -.02, 6, "Sie wollen weltliche Schulen.");
e("m_internetsperren", "staedtische_saekulare", -.03, 0, "Sie ärgern sich über Sperren.");
e("frauenrechte", "staedtische_saekulare", .02, 0, "Gleichstellung ist ihnen wichtig.");
e("lebenshaltung", "staedtische_saekulare", -.03, 0, "Die Städte sind besonders teuer.");
e("p_armut", "vertrauen_regierung", -.03, 1, "Wer nicht über den Monat kommt, macht die Regierung verantwortlich.");
e("p_armut", "kriminalitaet", .02, 6, "Not treibt manche in die Kriminalität.");
e("p_jugendarbeitslosigkeit", "junge", -.04, 0, "Eine Generation ohne Perspektive ist wütend.");
e("p_jugendarbeitslosigkeit", "abwanderung", .02, 6, "Wer hier keine Zukunft sieht, geht.");
e("p_streiks", "vertrauen_regierung", -.01, 1, "Streiks zeigen, dass die Regierung die Lage nicht im Griff hat.");
e("p_aerztemangel", "rentner", -.03, 1, "Ältere spüren fehlende Ärzte zuerst.");
e("p_aerztemangel", "wartezeiten", .04, 1, "Weniger Ärzte, längere Wartezeiten.");
e("p_abwanderung", "produktivitaet", -.01, 6, "Mit den Besten geht Wissen verloren.");
e("p_abwanderung", "staedtische_saekulare", -.02, 1, "Viele kennen jemanden, der gegangen ist.");
e("p_stromausfaelle", "vertrauen_regierung", -.03, 0, "Ohne Strom kippt die Stimmung schnell.");
e("p_luftverschmutzung", "lebenserwartung", -.01, 12, "Smog macht krank.");
e("p_luftverschmutzung", "staedtische_saekulare", -.02, 1, "Städter leiden unter der Luft.");
e("p_wassermangel", "landwirte", -.04, 0, "Ohne Wasser verdorrt die Ernte.");
e("p_wassermangel", "vertrauen_regierung", -.03, 1, "Wenn das Wasser rationiert wird, fragt jeder nach dem Staat.");
e("p_wassermangel", "landflucht", .02, 6, "Wo das Wasser fehlt, ziehen Menschen weg.");
e("p_landflucht", "landwirte", -.02, 1, "Wenn das Dorf stirbt, stirbt auch der Hof.");
e("p_wohnungsnot", "junge", -.04, 0, "Junge finden keine eigene Wohnung.");
e("p_wohnungsnot", "vertrauen_regierung", -.02, 1, "Unbezahlbares Wohnen wird zum Wahlkampfthema.");
e("p_erdbebengefahr", "vertrauen_regierung", -.01, 12, "Nach jedem kleineren Beben fragen die Menschen, ob ihr Haus hält.");
e("p_korruption", "vertrauen_regierung", -.04, 0, "Skandale beschädigen das Vertrauen.");
e("p_korruption", "auslandskapital", -.02, 3, "Investoren meiden Skandale.");
e("p_kriminalitaet", "konservative", -.02, 0, "Unsicherheit ärgert die, die Ordnung wollen.");
e("p_kriminalitaet", "tourismus", -.01, 3, "Gäste meiden unsichere Orte.");
e("p_polarisierung", "vertrauen_regierung", -.02, 1, "In einem gespaltenen Land vertraut die Hälfte grundsätzlich nicht.");
e("p_polarisierung", "investitionen", -.01, 6, "Politische Unsicherheit bremst Investitionen.");
e("p_migrationsdruck", "polarisierung", .02, 3, "Migration wird zum Streitthema.");
e("p_migrationsdruck", "vertrauen_regierung", -.02, 1, "Viele werfen der Regierung Untätigkeit vor.");
function ee(from, to, weight, lag, why) {
	if (E.some((k) => k.from === from && k.to === to)) return;
	e(from, to, weight, lag, why);
}
ee("m_medienaufsicht", "polarisierung", .03, 3, "Ein gegängeltes Medienfeld macht den Streit nicht leiser, nur lauter und bitterer.");
ee("m_medienaufsicht", "beziehungen_eu", -.03, 3, "Brüssel liest Sendeverbote als Rückschritt bei den Grundrechten.");
ee("m_medienaufsicht", "ansehen", -.03, 3, "Das Ausland beobachtet, wer Kritiker zum Schweigen bringt.");
ee("m_medienaufsicht", "staedtische_saekulare", -.04, 1, "Wer kritische Berichte liest, fühlt sich bevormundet.");
ee("m_medienaufsicht", "junge", -.03, 1, "Junge Menschen holen sich ihre Nachrichten dort, wo niemand sie sperrt.");
ee("m_medienaufsicht", "konservative", .02, 1, "Ein Teil der Wähler will Ordnung und Anstand im Medienfeld.");
ee("m_medienaufsicht", "zivilgesellschaft", -.03, 3, "Redaktionen und Vereine üben Selbstzensur.");
ee("m_internetsperren", "junge", -.05, 1, "Gesperrte Plattformen treffen vor allem die, die sie täglich nutzen.");
ee("m_internetsperren", "staedtische_saekulare", -.04, 1, "Sperren wirken wie Gängelung.");
ee("m_internetsperren", "gruendungen", -.03, 3, "Digitale Firmen meiden ein Land, in dem Seiten gesperrt werden.");
ee("m_internetsperren", "investitionen", -.02, 3, "Investoren fürchten Willkür im Netz.");
ee("m_internetsperren", "ansehen", -.02, 3, "Netzsperren gelten im Ausland als Zeichen von Zensur.");
ee("m_internetsperren", "zivilgesellschaft", -.03, 3, "Ohne freie Kanäle verstummen Initiativen.");
ee("m_internetsperren", "polarisierung", .02, 3, "Verbote treiben Menschen in Gegenöffentlichkeiten.");
ee("m_staatsmedien", "pressefreiheit", -.03, 3, "Wer den Anzeigenmarkt beherrscht, beherrscht die Berichte.");
ee("m_staatsmedien", "konservative", .03, 1, "Regierungsnahe Sender sprechen ihre Sprache.");
ee("m_staatsmedien", "vertrauen_regierung", .02, 1, "Freundliche Berichte heben kurz die Stimmung.");
ee("m_staatsmedien", "polarisierung", .02, 3, "Zwei Öffentlichkeiten, die einander nicht mehr zuhören.");
ee("m_staatsmedien", "staedtische_saekulare", -.02, 1, "Wer nicht mehr glaubt, was gesendet wird, wendet sich ab.");
ee("m_versammlungsfreiheit", "zivilgesellschaft", .04, 3, "Wer demonstrieren darf, organisiert sich.");
ee("m_versammlungsfreiheit", "pressefreiheit", .02, 3, "Freie Straßen und freie Berichte gehören zusammen.");
ee("m_versammlungsfreiheit", "junge", .03, 1, "Junge Menschen wollen sichtbar sein.");
ee("m_versammlungsfreiheit", "staedtische_saekulare", .03, 1, "Freiheitsrechte gehören für sie zum Kern.");
ee("m_versammlungsfreiheit", "ansehen", .02, 6, "Das Ausland schaut auf die Bilder von den Plätzen.");
ee("m_versammlungsfreiheit", "polarisierung", .02, 3, "Große Kundgebungen machen Gegensätze sichtbar.");
ee("m_versammlungsfreiheit", "konservative", -.02, 1, "Manche fürchten Unruhe und Blockaden.");
ee("m_gewerkschaftsrechte", "streikneigung", .04, 1, "Wer streiken darf, streikt auch.");
ee("m_gewerkschaftsrechte", "arbeitnehmer", .04, 1, "Starke Tarifpartner sind das, was Beschäftigte wollen.");
ee("m_gewerkschaftsrechte", "realeinkommen", .02, 6, "Tarifverträge halten die Löhne mit den Preisen Schritt.");
ee("m_gewerkschaftsrechte", "unternehmer", -.03, 1, "Arbeitgeber fürchten Streiks und höhere Abschlüsse.");
ee("m_gewerkschaftsrechte", "kostendruck", .02, 3, "Höhere Löhne erhöhen die Kosten der Betriebe.");
ee("m_gewerkschaftsrechte", "ungleichheit", -.02, 6, "Tarifbindung drückt die Lohnunterschiede.");
ee("m_wissenschaftsfreiheit", "ansehen", .02, 6, "Freie Universitäten machen ein Land in der Welt der Wissenschaft anschlussfähig.");
ee("m_wissenschaftsfreiheit", "produktivitaet", .01, 12, "Freie Forschung zahlt sich über Jahre aus.");
ee("m_wissenschaftsfreiheit", "junge", .02, 3, "Studierende bleiben, wenn sie frei lernen dürfen.");
ee("m_wissenschaftsfreiheit", "staedtische_saekulare", .03, 3, "Autonome Hochschulen gehören zu ihrem Bild von einem freien Land.");
ee("m_wissenschaftsfreiheit", "konservative", -.02, 3, "Manche sehen darin einen Verlust an Aufsicht über die Lehre.");
ee("m_wissenschaftsfreiheit", "beziehungen_eu", .02, 6, "Forschungsprogramme setzen Wissenschaftsfreiheit voraus.");
ee("m_antikorruption", "auslandskapital", .03, 6, "Investoren fordern saubere Vergaben.");
ee("m_antikorruption", "vertrauen_maerkte", .02, 3, "Transparente Vergaben senken das Risiko.");
ee("m_antikorruption", "beamte", -.02, 1, "Prüfungen verunsichern die Verwaltung.");
ee("m_antikorruption", "junge", .02, 3, "Junge Menschen verlangen saubere Politik.");
ee("m_antikorruption", "staedtische_saekulare", .02, 3, "Transparenz ist ein Kernanliegen der Städter.");
ee("m_antikorruption", "rechtssicherheit", .02, 6, "Wer sich auf Regeln verlassen kann, plant.");
ee("m_justizreform", "auslandskapital", .02, 6, "Verlässliche Gerichte sind das erste, was Investoren prüfen.");
ee("m_justizreform", "beziehungen_eu", .03, 6, "Ohne unabhängige Justiz gibt es keine Fortschritte in Brüssel.");
ee("m_justizreform", "ansehen", .02, 6, "Ein Rechtsstaat wird in der Welt ernst genommen.");
ee("m_justizreform", "staedtische_saekulare", .02, 3, "Unabhängige Gerichte schützen vor Willkür.");
ee("m_friedensprozess", "konservative", -.03, 1, "Manche sehen darin ein Nachgeben.");
ee("m_friedensprozess", "beziehungen_eu", .02, 3, "Frieden im Südosten wird in Europa begrüßt.");
ee("m_friedensprozess", "ansehen", .02, 6, "Wer einen Konflikt beendet, gewinnt Ansehen.");
ee("m_friedensprozess", "beziehungen_nahost", .02, 6, "Ein befriedeter Südosten entspannt die Region.");
ee("m_grenzschutz", "ansehen", -.02, 3, "Mauern und Zäune gefallen dem Ausland selten.");
ee("m_grenzschutz", "beziehungen_eu", -.02, 3, "Härte an der Grenze belastet Absprachen zur Migration.");
ee("m_grenzschutz", "konservative", .03, 1, "Ein Teil der Wähler will Kontrolle.");
ee("m_grenzschutz", "terrorgefahr", -.02, 3, "Kontrollierte Grenzen erschweren Infiltration.");
ee("m_verteidigung", "konservative", .02, 1, "Starke Streitkräfte sind für viele ein Kern des Staates.");
ee("m_verteidigung", "beziehungen_usa", .02, 6, "Ein fairer Anteil in der NATO wird in Washington gesehen.");
ee("m_verteidigung", "terrorgefahr", -.02, 6, "Bessere Fähigkeiten schrecken ab.");
ee("m_verteidigung", "beziehungen_russland", -.01, 6, "Moskau beobachtet die Aufrüstung im Schwarzen Meer.");
ee("m_ruestungsindustrie", "export", .03, 6, "Drohnen und Panzer sind Exportschlager.");
ee("m_ruestungsindustrie", "arbeitsplaetze_industrie", .03, 6, "Rüstungsfabriken schaffen Arbeit in der Industrie.");
ee("m_ruestungsindustrie", "militaer", .02, 12, "Eigene Produktion macht unabhängiger von Lieferungen.");
ee("m_ruestungsindustrie", "beziehungen_eu", -.01, 6, "Rüstungsexporte sind in Europa umstritten.");
ee("m_polizei", "konservative", .02, 1, "Mehr Polizei ist für viele ein Zeichen von Ordnung.");
ee("m_polizei", "terrorgefahr", -.02, 3, "Mehr Personal erschwert Anschläge.");
ee("m_polizei", "polarisierung", .01, 3, "Ein starker Polizeiapparat spaltet, wenn er politisch benutzt wird.");
ee("m_polizei", "staedtische_saekulare", -.01, 1, "Manche Städter fürchten einen Kontrollstaat.");
ee("m_religionsbehoerde", "religioesitaet", .03, 6, "Moscheen und Imame prägen das Land.");
ee("m_religionsbehoerde", "konservative", .04, 1, "Religiös-Konservative sehen ihre Werte gestärkt.");
ee("m_religionsbehoerde", "staedtische_saekulare", -.03, 1, "Säkulare Städter fürchten eine Vermischung von Religion und Staat.");
ee("m_religionsbehoerde", "frauenrechte", -.02, 12, "Konservative Auslegungen schränken oft Frauen ein.");
ee("m_religionsbehoerde", "polarisierung", .02, 3, "Kulturkampf-Thema.");
ee("m_religioese_schulen", "religioesitaet", .03, 12, "Wer in der Schule lernt, was Glaube heißt, bleibt ihm näher.");
ee("m_religioese_schulen", "konservative", .03, 1, "Ein Kernanliegen religiöser Familien.");
ee("m_religioese_schulen", "staedtische_saekulare", -.03, 1, "Säkulare Eltern sehen ihre Kinder ungern in religiösen Schulen.");
ee("m_religioese_schulen", "bildungsqualitaet", -.02, 12, "Ein Schwerpunkt auf Religion geht zulasten von Naturwissenschaften.");
ee("m_gewaltschutz", "staedtische_saekulare", .03, 1, "Ein Kernanliegen vieler Frauen und Männer in den Städten.");
ee("m_gewaltschutz", "junge", .02, 1, "Junge Menschen erwarten Schutz.");
ee("m_gewaltschutz", "justizvertrauen", .02, 6, "Wer Anzeigen ernst nimmt, gewinnt Vertrauen in die Gerichte.");
ee("m_gewaltschutz", "konservative", -.01, 1, "Manche sehen darin einen Eingriff in die Familie.");
ee("m_eu_annaeherung", "konservative", -.02, 1, "Nationale Kreise misstrauen Brüsseler Bedingungen.");
ee("m_eu_annaeherung", "export", .02, 12, "Eine modernisierte Zollunion erleichtert die Ausfuhr.");
ee("m_eu_annaeherung", "auslandskapital", .02, 12, "Reformen und Nähe zur EU beruhigen Investoren.");
ee("m_eu_annaeherung", "unternehmer", .02, 3, "Die Wirtschaft will Zugang zum Binnenmarkt.");
ee("m_eu_annaeherung", "staedtische_saekulare", .02, 1, "Für sie ist Europa Teil der Zukunft.");
ee("m_rueckkehr", "ansehen", -.02, 3, "Zwangsnahe Programme werden im Ausland kritisch gesehen.");
ee("m_rueckkehr", "beziehungen_eu", -.02, 3, "Brüssel achtet auf Freiwilligkeit.");
ee("m_rueckkehr", "konservative", .02, 1, "Für viele ein Zeichen, dass die Regierung handelt.");
ee("m_integration", "konservative", -.02, 1, "Manche sehen Integration als Dauerlösung, die sie nicht wollen.");
ee("m_integration", "unternehmer", .02, 6, "Betriebe brauchen Arbeitskräfte.");
ee("m_integration", "arbeitnehmer", -.01, 3, "Einfache Arbeit wird zur Konkurrenz.");
ee("m_integration", "ansehen", .02, 6, "Ein Land, das aufnimmt und einbindet, gewinnt Ansehen.");
ee("m_integration", "informelle_arbeit", -.02, 6, "Mit Arbeitserlaubnis wird Schwarzarbeit weniger.");
ee("m_privatisierung", "beamte", -.03, 1, "Verkäufe gefährden Stellen.");
ee("m_privatisierung", "arbeitnehmer", -.02, 3, "Private Betreiber sparen an Personal.");
ee("m_privatisierung", "unternehmer", .03, 1, "Mehr Raum für Private.");
ee("m_privatisierung", "auslandskapital", .02, 6, "Ausländische Käufer bringen Kapital.");
ee("m_privatisierung", "vertrauen_maerkte", .02, 3, "Schuldenabbau durch Verkäufe beruhigt Märkte.");
ee("m_kernkraft", "beziehungen_russland", .02, 12, "Akkuyu bindet Ankara und Moskau.");
ee("m_kernkraft", "staedtische_saekulare", -.02, 1, "Sorgen vor einem Reaktorunfall im Erdbebenland.");
ee("m_kernkraft", "klimaschutz", .01, 12, "Kernkraft stößt kaum CO2 aus.");
ee("m_energiesubventionen", "lebenshaltung", -.03, 1, "Gedeckelte Preise entlasten sofort.");
ee("m_energiesubventionen", "arbeitnehmer", .02, 1, "Haushalte spüren die niedrigeren Rechnungen.");
ee("m_energiesubventionen", "rentner", .02, 1, "Rentner treffen Energiepreise besonders.");
ee("m_umweltauflagen", "industrie", -.02, 3, "Strengere Grenzwerte verteuern die Produktion.");
ee("m_umweltauflagen", "unternehmer", -.02, 1, "Betriebe sehen Kosten und Bürokratie.");
ee("m_umweltauflagen", "staedtische_saekulare", .03, 1, "Saubere Luft ist ein Stadtthema.");
ee("m_umweltauflagen", "beziehungen_eu", .02, 6, "Grenzwerte nach EU-Vorbild gehören zum Beitrittspfad.");
ee("m_umweltauflagen", "kostendruck", .02, 3, "Auflagen erhöhen die Kosten der Betriebe.");
ee("m_co2_preis", "energiepreise", .03, 3, "Ein Preis auf Kohlenstoff verteuert fossile Energie.");
ee("m_co2_preis", "kostendruck", .03, 3, "Betriebe zahlen für ihren Ausstoß.");
ee("m_co2_preis", "klimaschutz", .04, 6, "Ein Preis lenkt Investitionen um.");
ee("m_co2_preis", "beziehungen_eu", .03, 6, "Ohne eigenen CO2-Preis trifft der Grenzausgleich der EU die Ausfuhr.");
ee("m_co2_preis", "unternehmer", -.03, 1, "Industrie und Energieversorger wehren sich.");
ee("m_co2_preis", "arbeitnehmer", -.02, 3, "Höhere Preise treffen auch Haushalte.");
ee("m_bankenaufsicht", "unternehmer", -.02, 1, "Strengere Kreditregeln bremsen Finanzierungen.");
ee("m_bankenaufsicht", "vertrauen_maerkte", .03, 3, "Solide Banken beruhigen Anleger.");
ee("m_einkommensteuer", "arbeitnehmer", -.03, 1, "Wer mehr abgibt, hat weniger übrig.");
ee("m_einkommensteuer", "unternehmer", -.02, 1, "Auch Selbständige zahlen mehr.");
ee("m_einkommensteuer", "ungleichheit", -.02, 12, "Progressive Sätze drücken die Unterschiede.");
ee("m_mwst", "lebenshaltung", .03, 1, "Die Mehrwertsteuer steckt in jedem Preis.");
ee("m_mwst", "arbeitnehmer", -.03, 1, "Sie trifft alle, die ihr Einkommen ausgeben.");
ee("m_mwst", "rentner", -.03, 1, "Feste Einkommen werden entwertet.");
ee("m_mwst", "armut", .01, 6, "Wer wenig hat, gibt fast alles aus und zahlt darauf.");
ee("m_kraftstoffsteuer", "lebenshaltung", .02, 1, "Benzin und Diesel bestimmen die Fahrtkosten.");
ee("m_kraftstoffsteuer", "landwirte", -.03, 1, "Landwirte hängen am Diesel.");
ee("m_kraftstoffsteuer", "arbeitnehmer", -.02, 1, "Pendler zahlen mehr.");
ee("m_kraftstoffsteuer", "klimaschutz", .02, 12, "Höhere Preise dämpfen den Verbrauch.");
ee("m_kraftstoffsteuer", "luftqualitaet", .01, 12, "Weniger Verkehr, sauberere Luft.");
ee("m_immobiliensteuer", "unternehmer", -.03, 1, "Wer viel besitzt, wehrt sich.");
ee("m_immobiliensteuer", "ungleichheit", -.03, 12, "Vermögen wird stärker herangezogen.");
ee("m_immobiliensteuer", "mieten", .02, 3, "Vermieter geben die Steuer an die Mieter weiter.");
ee("m_steuerfahndung", "unternehmer", -.02, 1, "Kontrollen belasten Betriebe.");
ee("m_steuerfahndung", "schattenwirtschaft", -.03, 6, "Wer erwischt wird, meldet an.");
ee("m_steuerfahndung", "mittelstand", -.01, 3, "Kleine Betriebe leiden unter dem Aufwand.");
ee("m_kindergeld", "konservative", .02, 1, "Familienpolitik ist ihnen wichtig.");
ee("m_kindergeld", "arbeitnehmer", .02, 1, "Familien mit Kindern profitieren.");
ee("m_sozialhilfe", "vertrauen_regierung", .01, 3, "Wer Hilfe erhält, dankt es dem Staat.");
ee("m_sozialhilfe", "arbeitnehmer", -.01, 3, "Manche fragen, warum sie selbst so viel zahlen.");
ee("m_kinderbetreuung", "arbeitnehmer", .02, 3, "Eltern können arbeiten.");
ee("m_kinderbetreuung", "staedtische_saekulare", .02, 3, "Ein Kernanliegen berufstätiger Eltern.");
ee("m_autobahnen", "bauwirtschaft", .03, 3, "Große Projekte füllen die Auftragsbücher.");
ee("m_autobahnen", "luftqualitaet", -.02, 12, "Mehr Straßen, mehr Verkehr.");
ee("m_autobahnen", "klimaschutz", -.02, 12, "Mehr Verkehr, mehr Ausstoß.");
ee("m_solar_wind", "klimaschutz", .03, 6, "Erneuerbare ersetzen fossile Energie.");
ee("m_solar_wind", "energiepreise", -.02, 12, "Sonne und Wind sind, einmal gebaut, günstig.");
ee("m_solar_wind", "luftqualitaet", .02, 6, "Weniger Kohle, sauberere Luft.");
ee("m_solar_wind", "staedtische_saekulare", .02, 1, "Ein Zukunftsthema für die Städte.");
ee("m_gasfoerderung", "klimaschutz", -.02, 6, "Mehr fossile Energie.");
ee("m_gasfoerderung", "energiepreise", -.02, 12, "Heimisches Gas macht unabhängiger von Weltmarktpreisen.");
ee("m_netzausbau", "erneuerbare", .02, 6, "Ohne Netze kommt der Strom aus Sonne und Wind nicht an.");
ee("m_mechanisierung", "landflucht", .02, 12, "Maschinen ersetzen Hände, die Jungen ziehen weg.");
ee("m_agrarsubventionen", "landwirte", .03, 1, "Direkte Hilfe sichert Einkommen.");
ee("m_preiskontrollen", "schattenwirtschaft", .03, 3, "Unter dem Preis verschwindet Ware in den Schwarzmarkt.");
ee("m_preiskontrollen", "landwirte", -.03, 1, "Bauern verkaufen unter Wert.");
ee("m_preiskontrollen", "unternehmer", -.02, 1, "Händler klagen über Verluste.");
ee("m_exportfoerderung", "unternehmer", .03, 1, "Exporteure sehen Rückhalt vom Staat.");
ee("m_exportfoerderung", "arbeitsplaetze_industrie", .02, 6, "Aufträge aus dem Ausland sichern Stellen in den Fabriken.");
ee("m_exportfoerderung", "industrie", .02, 6, "Mehr Ausfuhr füllt die Werkhallen.");
ee("m_investitionsanreize", "unternehmer", .04, 1, "Wer investiert, wird belohnt.");
ee("m_investitionsanreize", "produktivitaet", .02, 12, "Neue Anlagen steigern die Leistung je Arbeitsstunde.");
ee("m_investitionsanreize", "arbeitsplaetze_industrie", .02, 9, "Neue Fabriken brauchen Leute.");
ee("m_investitionsanreize", "ungleichheit", .01, 12, "Steuervorteile nützen vor allem den Großen.");
ee("m_kreditgarantien", "unternehmer", .02, 1, "Der Staat steht für Kredite gerade.");
ee("m_kreditgarantien", "gruendungen", .02, 6, "Mit Bürgschaft wagen mehr Menschen den Schritt.");
ee("m_kreditgarantien", "vertrauen_maerkte", -.01, 6, "Ausfälle belasten den Staat als Bürgen.");
ee("m_tourismuswerbung", "unternehmer", .02, 3, "Hotels und Gastronomie füllen sich.");
ee("m_tourismuswerbung", "ansehen", .01, 12, "Ein Land, das man kennt, hat es leichter.");
ee("m_tourismuswerbung", "arbeitnehmer", .01, 6, "Saisonarbeit an der Küste.");
ee("m_kmu", "unternehmer", .03, 1, "Kleine Betriebe fühlen sich gesehen.");
ee("m_kmu", "arbeitnehmer", .02, 6, "Kleine Betriebe stellen ein.");
ee("m_kmu", "landflucht", -.01, 12, "Betriebe in der Provinz halten Menschen dort.");
ee("m_steueramnestie", "unternehmer", .03, 1, "Wer Schulden beim Fiskus hat, atmet auf.");
ee("m_steueramnestie", "schattenwirtschaft", -.03, 6, "Wer nachzahlt, kehrt in die offizielle Wirtschaft zurück.");
ee("m_steueramnestie", "arbeitnehmer", -.03, 1, "Wer pünktlich zahlt, empfindet es als Hohn.");
ee("m_steueramnestie", "staedtische_saekulare", -.02, 1, "Amnestien für Vermögende wirken ungerecht.");
ee("m_steueramnestie", "justizvertrauen", -.02, 6, "Wer Steuern hinterzieht, kommt straflos davon.");
ee("m_renten", "rentner", .04, 0, "Jede Erhöhung wird gefeiert.");
ee("m_renten", "junge", -.03, 3, "Die Jüngeren zahlen die Beiträge.");
ee("m_renten", "arbeitnehmer", -.02, 3, "Höhere Renten bedeuten höhere Beiträge.");
ee("m_renten", "armut", -.02, 3, "Altersarmut geht zurück.");
ee("m_arbeitslosengeld", "arbeitnehmer", .02, 1, "Wer seine Stelle verliert, fällt weicher.");
ee("m_arbeitslosengeld", "junge", .02, 1, "Besonders wichtig für Berufseinsteiger.");
ee("m_arbeitslosengeld", "unternehmer", -.02, 1, "Höhere Sozialabgaben.");
ee("m_arbeitslosengeld", "sozialkassen", -.03, 3, "Die Ausgaben steigen.");
ee("m_ausbildung", "junge", .03, 3, "Ein Angebot für die, die sonst warten.");
ee("m_ausbildung", "unternehmer", .02, 6, "Betriebe bekommen Nachwuchs.");
ee("m_ausbildung", "arbeitnehmer", .01, 6, "Bessere Aussichten für die eigenen Kinder.");
ee("m_krankenhausbau", "rentner", .03, 6, "Für Ältere zählt die Klinik in der Nähe.");
ee("m_krankenhausbau", "arbeitnehmer", .02, 6, "Bessere Versorgung für die Familie.");
ee("m_krankenhausbau", "lebenserwartung", .02, 12, "Schnellere Hilfe rettet Leben.");
ee("m_krankenhausbau", "wartezeiten", -.02, 12, "Mehr Betten, kürzere Wege.");
ee("m_krankenhausbau", "bauwirtschaft", .02, 3, "Bauaufträge für die Baubranche.");
ee("m_aerztegehalt", "gesundheitsversorgung", .02, 6, "Mehr Ärzte bleiben im Dienst.");
ee("m_aerztegehalt", "abwanderung", -.02, 6, "Weniger Ärzte gehen ins Ausland.");
ee("m_aerztegehalt", "wartezeiten", -.02, 12, "Mehr Personal, kürzere Warteschlangen.");
ee("m_hausarzt", "gesundheitsversorgung", .03, 12, "Der erste Ansprechpartner fehlte vielerorts.");
ee("m_hausarzt", "rentner", .03, 6, "Ältere brauchen jemanden in der Nähe.");
ee("m_hausarzt", "landwirte", .02, 6, "Auf dem Land ist der Weg zum Arzt weit.");
ee("m_hausarzt", "lebenserwartung", .01, 12, "Früh erkannte Krankheiten sind besser behandelbar.");
ee("m_zuzahlungen", "rentner", -.04, 1, "Ältere gehen am häufigsten zum Arzt.");
ee("m_zuzahlungen", "arbeitnehmer", -.03, 1, "Jeder Besuch kostet.");
ee("m_zuzahlungen", "gesundheitsversorgung", -.02, 6, "Wer zahlen muss, geht später zum Arzt.");
ee("m_zuzahlungen", "sozialkassen", .02, 3, "Die Kassen werden entlastet.");
ee("m_lehrergehaelter", "staedtische_saekulare", .02, 6, "Bildung ist ihr Thema.");
ee("m_lehrergehaelter", "schulabbruch", -.02, 12, "Motivierte Lehrer halten Schüler in der Schule.");
ee("m_lehrergehaelter", "abwanderung", -.01, 12, "Wer gut bezahlt wird, geht seltener ins Ausland.");
ee("m_schulbau", "bauwirtschaft", .02, 3, "Bauaufträge in allen Provinzen.");
ee("m_schulbau", "junge", .02, 6, "Kürzere Wege, kleinere Klassen.");
ee("m_schulbau", "landflucht", -.01, 12, "Eine Schule im Dorf hält Familien dort.");
ee("m_berufsschulen", "junge", .03, 6, "Ein Weg in Arbeit ohne Studium.");
ee("m_berufsschulen", "unternehmer", .02, 6, "Betriebe bekommen Fachleute.");
ee("m_berufsschulen", "produktivitaet", .01, 12, "Besser Ausgebildete leisten mehr.");
ee("m_unigruendungen", "junge", .03, 3, "Studienplätze in der Nähe.");
ee("m_unigruendungen", "staedtische_saekulare", .02, 6, "Hochschulen prägen das Umfeld.");
ee("m_unigruendungen", "landflucht", -.02, 12, "Universitäten binden junge Menschen an die Region.");
ee("m_stipendien", "junge", .03, 3, "Wer nicht reiche Eltern hat, kann trotzdem studieren.");
ee("m_stipendien", "hochschule", .02, 12, "Mehr Begabte kommen an die Hochschule.");
ee("m_stipendien", "ungleichheit", -.02, 12, "Bildung hängt weniger am Geldbeutel.");
ee("m_forschung", "staedtische_saekulare", .02, 6, "Forschung gilt ihnen als Zukunft.");
ee("m_forschung", "ansehen", .02, 12, "Wer forscht, wird ernst genommen.");
ee("m_forschung", "export", .01, 12, "Technik aus eigener Forschung lässt sich verkaufen.");
ee("m_forschung", "abwanderung", -.01, 12, "Wer forschen kann, bleibt.");
ee("m_oepp_garantien", "bauwirtschaft", .03, 3, "Große Projekte füllen die Auftragsbücher.");
ee("m_oepp_garantien", "unternehmer", .02, 3, "Der Staat stützt die Bauherren.");
ee("m_oepp_garantien", "korruption", .02, 12, "Große Verträge ohne Wettbewerb laden zur Bevorzugung ein.");
ee("m_oepp_garantien", "vertrauen_maerkte", -.02, 12, "Garantien sind Schulden im Verborgenen.");
ee("m_bahn", "bauwirtschaft", .03, 3, "Jahre voller Bauaufträge.");
ee("m_bahn", "logistik", .03, 12, "Güter kommen schneller ans Ziel.");
ee("m_bahn", "stau", -.02, 12, "Weniger Lastwagen auf den Straßen.");
ee("m_bahn", "landflucht", -.01, 12, "Anbindung hält Orte lebendig.");
ee("m_nahverkehr", "staedtische_saekulare", .03, 6, "Ein Stadtthema.");
ee("m_nahverkehr", "junge", .03, 6, "Junge fahren mehr mit Bus und Bahn.");
ee("m_nahverkehr", "arbeitnehmer", .02, 6, "Der Weg zur Arbeit wird kürzer.");
ee("m_nahverkehr", "bauwirtschaft", .02, 3, "Bauaufträge in den Städten.");
ee("m_breitband", "junge", .03, 6, "Ohne Netz kein Leben.");
ee("m_breitband", "gruendungen", .03, 12, "Digitale Firmen lassen sich überall nieder.");
ee("m_breitband", "landflucht", -.02, 12, "Arbeiten aus dem Dorf wird möglich.");
ee("m_breitband", "bildungsqualitaet", .01, 12, "Zugang zu Lernangeboten.");
ee("m_regionalfoerderung", "landwirte", .03, 3, "Hilfe für die Provinz.");
ee("m_regionalfoerderung", "konservative", .02, 3, "Die Provinz fühlt sich gesehen.");
ee("m_regionalfoerderung", "investitionen", .02, 12, "Anreize ziehen Betriebe in die Regionen.");
ee("m_regionalfoerderung", "korruption", .01, 12, "Fördergelder ziehen Begünstigung an.");
ee("m_regionalfoerderung", "polarisierung", -.01, 12, "Wer sich nicht vergessen fühlt, ist weniger wütend.");
ee("m_netzausbau", "industrie", .01, 12, "Verlässlicher Strom für die Fabriken.");
ee("m_netzausbau", "bauwirtschaft", .01, 3, "Aufträge für Leitungsbauer.");
ee("m_bewaesserung", "landwirte", .04, 3, "Bauern bekommen Wasser aufs Feld.");
ee("m_bewaesserung", "landwirtschaft_einkommen", .03, 6, "Sichere Ernten, sichere Einkommen.");
ee("m_bewaesserung", "duerre", -.03, 6, "Trockene Jahre treffen weniger hart.");
ee("m_wasserleitungen", "landwirte", .02, 3, "Wasser im Dorf.");
ee("m_wasserleitungen", "arbeitnehmer", .02, 6, "Wasser im Haus.");
ee("m_wasserleitungen", "duerre", -.02, 6, "Weniger Verluste in den Leitungen.");
ee("m_wasserleitungen", "bauwirtschaft", .02, 3, "Bauaufträge in allen Provinzen.");
ee("m_saatgut", "landwirte", .03, 3, "Bessere Erträge auf demselben Feld.");
ee("m_saatgut", "landwirtschaft_einkommen", .03, 6, "Höhere Erträge, höhere Einkommen.");
ee("m_saatgut", "lebensmittelpreise", -.02, 6, "Mehr Ernte, niedrigere Preise.");
ee("m_baukredite", "bauwirtschaft", .04, 3, "Mehr Kredit, mehr Aufträge.");
ee("m_baukredite", "arbeitnehmer", .02, 3, "Der Traum vom Eigenheim rückt näher.");
ee("m_baukredite", "unternehmer", .02, 3, "Bauunternehmer bekommen Aufträge.");
ee("m_bauamnestie", "bauwirtschaft", .02, 2, "Nachträgliche Genehmigungen bringen Aufträge für Gutachter und Bauleute.");
ee("m_bauamnestie", "konservative", .03, 1, "Ein Wahlversprechen für Hausbesitzer.");
ee("m_bauamnestie", "arbeitnehmer", .02, 1, "Wer illegal gebaut hat, muss nicht mehr zittern.");
ee("m_bauamnestie", "erdbebenvorsorge", -.04, 12, "Nicht geprüfte Häuser bleiben unsicher.");
ee("m_bauamnestie", "rechtssicherheit", -.03, 6, "Wer Regeln bricht, wird belohnt.");
g("recht", "justiz_unabhaengigkeit", "Unabhängigkeit der Justiz", 32, "Ob Richter und Staatsanwälte ohne Weisung und Druck entscheiden. Der Richterrat, den Präsident und Parlament besetzen, prägt sie.", .03);
g("recht", "justiz_kapazitaet", "Kapazität der Gerichte", 45, "Richter, Staatsanwälte und Gerichtssäle im Verhältnis zu den Verfahren. Die Türkei hat 17 Richter je 100.000 Einwohner, der europäische Schnitt liegt bei 22.", .03);
g("recht", "justiz_effizienz", "Effizienz der Verfahren", 50, "Wie schnell Verfahren enden. Strafgerichte brauchten 2024 im Schnitt 228, Zivilgerichte 231 Tage, die Vollstreckung 919.", .05);
g("recht", "urteilsbefolgung", "Befolgung von Urteilen", 35, "Ob Behörden und Gerichte Urteile des Verfassungsgerichts und des Straßburger Gerichtshofs umsetzen. Das Verfahren im Fall Kavala läuft seit 2022 nach Artikel 46.", .03);
g("recht", "haftueberfuellung", "Überfüllung der Haftanstalten", 71, "Im August 2026 saßen 433.520 Menschen auf 304.956 Plätzen, etwa 142 Prozent. Ein hoher Wert heißt mehr Überfüllung.", .02);
g("recht", "ausnahmerecht", "Ausnahmerecht", 10, "Wie viel Staatshandeln über Notstandsbefugnisse und Sonderregeln läuft. Von 2016 bis 2018 galt ein Ausnahmezustand mit 32 Dekreten. Ein hoher Wert heißt mehr Ausnahmerecht.", .06);
g("recht", "anwaltsautonomie", "Autonomie der Anwaltschaft", 55, "Ob die Anwaltskammern frei sprechen und Verfahren begleiten können. Das Gesetz von 2020 erlaubt weitere Kammern in Großstädten; alle 80 Kammern lehnten es ab.", .03);
g("recht", "strassburg_druck", "Druck aus Straßburg", 60, "Offene Urteile und Verfahren des Europäischen Gerichtshofs für Menschenrechte, die Ankara umsetzen soll. Ein hoher Wert heißt mehr Druck.", .03);
g("gesellschaft", "legitimitaet", "Legitimität der Regierung", 60, "Wie sehr Bürger, Beamte und Partner die Regeln, nach denen regiert wird, für rechtmäßig halten. Sie sinkt durch Ausnahmerecht und Willkür und steigt mit unabhängiger Justiz, Rechtssicherheit und Erfolgen.", .03);
g("militaer", "bereitschaft_heer", "Einsatzbereitschaft des Heeres", 60, "Wie viel Gerät und Personal des Heeres tatsächlich einsatzbereit ist, mit Ausbildung und Ersatzteilen.", .04);
g("militaer", "bereitschaft_luft", "Einsatzbereitschaft der Luftwaffe", 55, "Einsatzbereite Flugzeuge und Luftabwehr, mit Piloten, Technikern und Ersatzteilen.", .04);
g("militaer", "bereitschaft_see", "Einsatzbereitschaft der Marine", 58, "Einsatzbereite Schiffe und Boote; die Marine wächst mit eigenen Fregatten und einem Hubschrauberträger.", .04);
g("militaer", "modernisierung", "Modernisierung der Ausrüstung", 45, "Anteil der jüngsten Systemgeneration: Drohnen, Kampfjets, Panzer, Luftabwehr.", .02);
g("militaer", "ruestungsautarkie", "Rüstungsautarkie", 60, "Wie viel die Streitkräfte aus eigener Industrie bekommen. Triebwerke und Elektronik bleiben Lücken; eigene Motoren stehen für Kampfjet und Panzer noch aus.", .02);
g("militaer", "truppenmoral", "Truppenmoral", 60, "Wie gern Soldaten dienen und wie sicher sie sich in Führung und Versorgung fühlen.", .04);
g("militaer", "offiziersvertrauen", "Vertrauen in die Offiziersführung", 45, "Ob Offiziere Beförderungen nach Leistung erwarten. Nach 2016 wurden Schätzungen zufolge 40 Prozent bis zwei Drittel der Generäle entlassen.", .03);
g("militaer", "abschreckung", "Abschreckung", 55, "Was Nachbarn und Gegner den Streitkräften zutrauen: Bereitschaft, Modernisierung, Bündnisrückhalt.", .03);
g("kultur", "kulturerbe", "Erhaltung des Kulturerbes", 55, "Zustand der historischen Stätten, Städte und Denkmäler; wird aus dem Bestand des Reiches je Provinz gesetzt.", .02);
g("kultur", "identitaet", "Nationale Identität und Zusammenhalt", 55, "Wie stark sich Menschen über Geschichte, Sprache und Symbole verbunden fühlen.", .03);
g("kultur", "vielfalt", "Akzeptanz kultureller und religiöser Vielfalt", 40, "Wie Mehrheit und Behörden Minderheiten und Glaubensgemeinschaften sehen: Aleviten, Armenier, Griechen, Juden, Syrer, Kurden.", .03);
g("infrastruktur", "wartungszustand", "Zustand der Anlagen", 55, "Wie gut Straßen, Brücken, Schienen, Leitungen und Kraftwerke gepflegt sind. Mehr Anlagen brauchen mehr Pflege.", .03);
m("recht", "m_richterstellen", "Richter- und Staatsanwaltsstellen", 45, .15, 24, "Mehr Stellen, Ausbildungsplätze und Gerichtssäle; wirkt erst nach Jahren, weil die Ausbildung dauert.");
m("recht", "m_richterrat", "Besetzung des Richterrats", 25, 0, 12, "Wer die Mitglieder des Richter- und Staatsanwaltsrats (HSK) bestimmt, der über Ernennung, Versetzung und Beförderung von Richtern entscheidet.");
m("recht", "m_haftvermeidung", "Haftvermeidung und Bewährung", 30, .02, 12, "Untersuchungshaft nur als letztes Mittel, Bewährung und elektronische Aufsicht statt Vollzug.");
m("recht", "m_notstand", "Ausnahmezustand und Sonderbefugnisse", 10, 0, 1, "Wie weit die Regierung mit Notstandsbefugnissen und Sonderregeln handelt, statt über Gesetze im normalen Verfahren.");
m("recht", "m_urteilsumsetzung", "Umsetzung von Gerichtsurteilen aus Straßburg und Ankara", 30, 0, 6, "Ob Behörden und Gerichte Urteile des Verfassungsgerichts und des Europäischen Gerichtshofs für Menschenrechte umsetzen.");
m("kultur", "m_denkmalschutz", "Denkmalschutz und Restaurierung", 40, .1, 12, "Personal, Mittel und Auflagen für den Erhalt historischer Stätten und Altstädte.");
m("kultur", "m_kulturfoerderung", "Kunst- und Kulturförderung", 40, .08, 6, "Theater, Musik, Literatur, Filmförderung und Festivals.");
m("kultur", "m_archaeologie", "Ausgrabungen und Museen", 45, .06, 12, "Grabungsgenehmigungen, Restaurierungswerkstätten, Museen und Nachtmuseen.");
m("kultur", "m_minderheitenrechte", "Rechte religiöser und sprachlicher Minderheiten", 35, .01, 12, "Schulen, Sprachen, Kirchen- und Klostereigentum, Gebetsstätten der Aleviten.");
m("militaer", "m_wehrdienst", "Wehrdienst", 30, .05, 6, "Dauer und Art des Wehrdienstes. Heute sechs Monate mit Freikauf gegen Gebühr.");
m("militaer", "m_uebungen", "Ausbildung und Übungen", 45, .15, 12, "Manöver, Flugstunden, Seetage und Ausbildungsplätze für Piloten und Techniker.");
m("militaer", "m_offiziersauswahl", "Beförderung im Obersten Militärrat", 35, 0, 6, "Nach welchen Kriterien der Oberste Militärrat im August Offiziere befördert und pensioniert.");
m("infrastruktur", "m_instandhaltung", "Instandhaltung der Infrastruktur", 45, .2, 12, "Wartung, Erneuerung und Sanierung von Straßen, Brücken, Schienen und Leitungen.");
ee("m_richterstellen", "justiz_kapazitaet", .06, 12, "Mehr Stellen bedeuten mehr erledigte Verfahren, sobald die Ausbildung abgeschlossen ist.");
ee("m_richterstellen", "justiz_effizienz", .03, 12, "Mit mehr Richtern schrumpfen die Wartezeiten.");
ee("m_richterstellen", "beamte", .03, 1, "Neue Stellen im Staatsdienst.");
ee("m_richterrat", "justiz_unabhaengigkeit", .06, 6, "Ein Rat, den Kollegen wählen, ist schwerer zu steuern als einer, den Minister und Präsident besetzen.");
ee("m_richterrat", "rechtssicherheit", .03, 6, "Wer sich auf unabhängige Ernennungen verlassen kann, plant mit dem Recht.");
ee("m_richterrat", "beziehungen_eu", .03, 6, "Die Venedig-Kommission empfiehlt, mindestens die Hälfte des Rates von Richterkollegen wählen zu lassen.");
ee("m_richterrat", "staedtische_saekulare", .03, 1, "Unabhängige Gerichte sind ihnen ein Kernanliegen.");
ee("m_richterrat", "beamte", -.02, 1, "Manche Richter und Beamte verlieren den Draht nach oben.");
ee("m_haftvermeidung", "haftueberfuellung", -.06, 6, "Weniger Untersuchungshaft entlastet die Anstalten.");
ee("m_haftvermeidung", "justizvertrauen", .01, 12, "Weniger Wartezeit in Haft wirkt fairer.");
ee("m_haftvermeidung", "kriminalitaet", .01, 12, "Ein Teil der Entlassenen wird rückfällig.");
ee("m_haftvermeidung", "konservative", -.03, 1, "Wird als Nachgiebigkeit gegenüber Straftätern gelesen.");
ee("m_haftvermeidung", "staedtische_saekulare", .02, 1, "Verhältnismäßigkeit gilt ihnen als Grundsatz.");
ee("m_notstand", "ausnahmerecht", .1, 0, "Notstandsbefugnisse bedeuten mehr Ausnahmerecht.");
ee("m_notstand", "terrorgefahr", -.03, 3, "Weitreichende Befugnisse erschweren Anschläge.");
ee("m_notstand", "konservative", .03, 1, "Ein Teil der Wähler will einen starken Staat in der Krise.");
ee("m_urteilsumsetzung", "urteilsbefolgung", .08, 3, "Wer Urteile umsetzt, befolgt sie.");
ee("m_urteilsumsetzung", "strassburg_druck", -.05, 6, "Wo Urteile umgesetzt sind, verschwinden sie von der Liste des Ministerkomitees.");
ee("m_urteilsumsetzung", "beziehungen_eu", .03, 6, "Brüssel misst Fortschritte an der Umsetzung von Straßburger Urteilen.");
ee("m_urteilsumsetzung", "justiz_unabhaengigkeit", .03, 6, "Gerichte, deren Urteile befolgt werden, entscheiden freier.");
ee("m_urteilsumsetzung", "konservative", -.03, 1, "Wird als Nachgeben gegenüber Straßburg gelesen.");
ee("m_urteilsumsetzung", "ansehen", .03, 6, "Ein Land, das Urteile umsetzt, wird ernster genommen.");
ee("m_justizreform", "justiz_unabhaengigkeit", .03, 6, "Ein Reformpaket stärkt auch die Unabhängigkeit, wenn die Ernennungen geregelt sind.");
ee("m_justizreform", "justiz_effizienz", .03, 12, "Besseres Verfahrensrecht und bessere Ausbildung verkürzen die Verfahren.");
ee("m_antikorruption", "justiz_unabhaengigkeit", .02, 6, "Unabhängige Ermittler brauchen unabhängige Gerichte.");
ee("m_verwaltungsdigital", "justiz_effizienz", .03, 12, "Digitale Akten und elektronische Zustellung beschleunigen die Verfahren.");
ee("justiz_unabhaengigkeit", "justizvertrauen", .05, 6, "Wer glaubt, dass Richter frei entscheiden, vertraut den Gerichten.");
ee("justiz_unabhaengigkeit", "rechtssicherheit", .04, 6, "Unabhängige Richter machen Entscheidungen berechenbar.");
ee("justiz_unabhaengigkeit", "korruption", -.03, 12, "Unabhängige Gerichte verfolgen auch Mächtige.");
ee("justiz_unabhaengigkeit", "auslandskapital", .02, 12, "Investoren prüfen zuerst, ob sie ihr Recht bekommen.");
ee("justiz_unabhaengigkeit", "urteilsbefolgung", .03, 6, "Unabhängige Gerichte setzen ihre Urteile eher durch.");
ee("justiz_unabhaengigkeit", "legitimitaet", .03, 6, "Wer die Regeln für fair hält, hält die Regierung für rechtmäßig.");
ee("justiz_kapazitaet", "justiz_effizienz", .05, 6, "Mehr Kapazität, kürzere Verfahren.");
ee("justiz_kapazitaet", "haftueberfuellung", -.01, 12, "Schnellere Verfahren verkürzen die Untersuchungshaft.");
ee("justiz_effizienz", "justizvertrauen", .03, 3, "Schnelle Verfahren wirken gerecht.");
ee("justiz_effizienz", "rechtssicherheit", .03, 6, "Wer schnell zu seinem Recht kommt, kann planen.");
ee("justiz_effizienz", "mittelstand", .02, 12, "Verträge lassen sich schneller durchsetzen.");
ee("justiz_effizienz", "investitionen", .01, 12, "Verlässliche Verfahren senken das Risiko.");
ee("urteilsbefolgung", "justizvertrauen", .03, 6, "Urteile, die befolgt werden, stärken das Vertrauen.");
ee("urteilsbefolgung", "strassburg_druck", -.04, 6, "Was umgesetzt ist, steht nicht mehr auf der Liste.");
ee("urteilsbefolgung", "ansehen", .02, 6, "Ein Land, das Urteile befolgt, gewinnt Ansehen.");
ee("haftueberfuellung", "justizvertrauen", -.02, 6, "Überfüllte Anstalten und lange Untersuchungshaft schaden dem Ruf der Justiz.");
ee("haftueberfuellung", "ansehen", -.02, 6, "Berichte über überfüllte Haftanstalten gehen ins Ausland.");
ee("haftueberfuellung", "kriminalitaet", .01, 12, "In überfüllten Anstalten gibt es kaum Wiedereingliederung.");
ee("ausnahmerecht", "justiz_unabhaengigkeit", -.05, 3, "Wer per Dekret entlässt, schüchtert Richter ein.");
ee("ausnahmerecht", "rechtssicherheit", -.05, 1, "Ausnahmerecht macht das Recht unberechenbar.");
ee("ausnahmerecht", "strassburg_druck", .05, 6, "Beschwerden über Notstandsmaßnahmen landen in Straßburg.");
ee("ausnahmerecht", "ansehen", -.04, 3, "Das Ausland sieht Notstandsdekrete kritisch.");
ee("ausnahmerecht", "pressefreiheit", -.03, 3, "Notstandsbefugnisse treffen zuerst Redaktionen.");
ee("ausnahmerecht", "zivilgesellschaft", -.04, 3, "Vereine werden geschlossen oder verunsichert.");
ee("ausnahmerecht", "staedtische_saekulare", -.04, 1, "Freiheitsrechte sind ihnen wichtig.");
ee("ausnahmerecht", "beziehungen_eu", -.03, 3, "Brüssel misst Notstandsrecht an den Kopenhagener Kriterien.");
ee("ausnahmerecht", "legitimitaet", -.04, 3, "Wer per Ausnahmerecht regiert, verliert Rückhalt bei den Regeln.");
ee("ausnahmerecht", "konservative", .02, 1, "Ein Teil der Wähler mag Härte in der Krise.");
ee("anwaltsautonomie", "justizvertrauen", .02, 6, "Freie Anwälte gehören zu fairen Verfahren.");
ee("anwaltsautonomie", "zivilgesellschaft", .02, 6, "Anwaltskammern sind ein Stück Zivilgesellschaft.");
ee("strassburg_druck", "beziehungen_eu", -.02, 6, "Offene Urteile belasten das Verhältnis zu Europa.");
ee("strassburg_druck", "ansehen", -.02, 6, "Ein langes Verfahren nach Artikel 46 wird international beachtet.");
ee("korruption", "legitimitaet", -.03, 6, "Korruption höhlt das Vertrauen in die Regeln aus.");
ee("rechtssicherheit", "legitimitaet", .03, 6, "Berechenbares Recht stützt die Legitimität.");
ee("legitimitaet", "vertrauen_regierung", .04, 3, "Rechtmäßig empfundene Regierungen genießen mehr Vertrauen.");
ee("legitimitaet", "vertrauen_maerkte", .02, 6, "Investoren schätzen berechenbare Regeln.");
ee("m_verteidigung", "bereitschaft_heer", .02, 6, "Mehr Mittel für Munition, Wartung und Ersatzteile.");
ee("m_verteidigung", "bereitschaft_luft", .02, 6, "Mehr Mittel für Flugstunden und Ersatzteile.");
ee("m_verteidigung", "bereitschaft_see", .02, 6, "Mehr Mittel für Seetage und Werften.");
ee("m_verteidigung", "modernisierung", .03, 12, "Neue Systeme kommen erst nach Jahren.");
ee("m_ruestungsindustrie", "ruestungsautarkie", .05, 12, "Eigene Fabriken ersetzen Importe.");
ee("m_ruestungsindustrie", "modernisierung", .02, 12, "Neue Systeme aus eigener Fertigung.");
ee("m_wehrdienst", "bereitschaft_heer", .03, 6, "Mehr Wehrpflichtige und längere Dienstzeit stärken die Masse des Heeres.");
ee("m_wehrdienst", "truppenmoral", -.02, 3, "Wer zum Dienst gezwungen wird, dient weniger gern.");
ee("m_wehrdienst", "junge", -.06, 1, "Junge Männer verlieren Monate an Ausbildung und Beruf.");
ee("m_wehrdienst", "arbeitnehmer", -.02, 3, "Fehlende Arbeitskräfte und Kosten für Familien.");
ee("m_wehrdienst", "konservative", .03, 1, "Wehrdienst gilt als nationale Pflicht.");
ee("m_wehrdienst", "militaer", .02, 6, "Die Streitkräfte gewinnen an Umfang.");
ee("m_uebungen", "bereitschaft_heer", .05, 6, "Übungen halten Verbände einsatzfähig.");
ee("m_uebungen", "bereitschaft_luft", .04, 6, "Flugstunden halten Piloten in Form.");
ee("m_uebungen", "bereitschaft_see", .04, 6, "Seetage halten Besatzungen in Form.");
ee("m_uebungen", "truppenmoral", .02, 3, "Gute Ausbildung stärkt das Selbstvertrauen.");
ee("m_offiziersauswahl", "offiziersvertrauen", .05, 6, "Beförderung nach Leistung schafft Vertrauen in die Führung.");
ee("m_offiziersauswahl", "truppenmoral", .03, 6, "Gerechte Beförderung wirkt bis in die Truppe.");
ee("m_offiziersauswahl", "bereitschaft_heer", .02, 12, "Qualifizierte Führung verbessert die Einsatzbereitschaft.");
ee("m_offiziersauswahl", "abschreckung", .02, 12, "Eine kompetente Führung wird ernster genommen.");
ee("bereitschaft_heer", "abschreckung", .03, 3, "Einsatzbereite Verbände schrecken ab.");
ee("bereitschaft_luft", "abschreckung", .03, 3, "Einsatzbereite Luftwaffe schreckt ab.");
ee("bereitschaft_see", "abschreckung", .02, 3, "Einsatzbereite Marine schreckt ab.");
ee("bereitschaft_heer", "militaer", .02, 3, "Die Stärke der Streitkräfte hängt an ihrer Bereitschaft.");
ee("bereitschaft_luft", "militaer", .02, 3, "Die Stärke der Streitkräfte hängt an ihrer Bereitschaft.");
ee("bereitschaft_see", "militaer", .02, 3, "Die Stärke der Streitkräfte hängt an ihrer Bereitschaft.");
ee("modernisierung", "abschreckung", .04, 6, "Moderne Systeme verändern die Rechnung des Gegners.");
ee("modernisierung", "bereitschaft_heer", .01, 6, "Neues Gerät ist meist besser gewartet.");
ee("modernisierung", "export", .01, 12, "Bewährte Systeme sind Exportprodukte.");
ee("ruestungsautarkie", "export", .02, 12, "Eigene Industrie exportiert.");
ee("ruestungsautarkie", "abschreckung", .02, 12, "Wer nicht von Lieferungen abhängt, kann nicht erpresst werden.");
ee("ruestungsautarkie", "beziehungen_usa", -.01, 12, "Weniger Abhängigkeit heißt weniger Hebel für Washington.");
ee("truppenmoral", "bereitschaft_heer", .03, 3, "Motivierte Soldaten sind einsatzbereiter.");
ee("truppenmoral", "abschreckung", .02, 6, "Ein motiviertes Heer wird ernst genommen.");
ee("offiziersvertrauen", "truppenmoral", .02, 6, "Vertrauen in die Führung hebt die Stimmung.");
ee("offiziersvertrauen", "bereitschaft_heer", .02, 6, "Eine Führung mit Vertrauen entscheidet schneller.");
ee("abschreckung", "terrorgefahr", -.01, 6, "Starke Streitkräfte schwächen Gruppen im Grenzgebiet.");
ee("abschreckung", "konservative", .03, 1, "Ein Teil der Wähler will ein starkes Heer.");
ee("abschreckung", "ansehen", .01, 12, "Ein starker Staat wird als Partner gesucht.");
ee("abschreckung", "vertrauen_regierung", .01, 6, "Sicherheit stärkt das Vertrauen.");
ee("m_denkmalschutz", "kulturerbe", .06, 12, "Restaurierung und Pflege heben den Zustand der Stätten.");
ee("m_denkmalschutz", "tourismus", .02, 12, "Gepflegte Stätten ziehen Gäste an.");
ee("m_denkmalschutz", "identitaet", .02, 12, "Historische Orte stiften Zusammenhalt.");
ee("m_denkmalschutz", "konservative", .02, 1, "Das Erbe der Vorfahren zählt.");
ee("m_denkmalschutz", "staedtische_saekulare", .02, 1, "Erhalt historischer Städte ist ihr Anliegen.");
ee("m_denkmalschutz", "wohnungsbau", -.01, 12, "Auflagen bremsen Neubau in Altstädten.");
ee("m_kulturfoerderung", "identitaet", .03, 6, "Kunst und Feste stiften Gemeinschaft.");
ee("m_kulturfoerderung", "junge", .02, 3, "Junge Menschen nutzen Bühnen und Festivals.");
ee("m_kulturfoerderung", "staedtische_saekulare", .03, 1, "Kulturförderung ist ihnen ein Kernanliegen.");
ee("m_kulturfoerderung", "zivilgesellschaft", .02, 6, "Kulturvereine sind ein Teil der Zivilgesellschaft.");
ee("m_kulturfoerderung", "tourismus", .01, 12, "Festivals bringen Gäste.");
ee("m_archaeologie", "kulturerbe", .02, 12, "Ausgrabungen sichern Funde vor Raubgrabung.");
ee("m_archaeologie", "tourismus", .03, 12, "Neue Funde und Museen ziehen Gäste an.");
ee("m_archaeologie", "identitaet", .02, 12, "Die Geschichte des Landes wird sichtbar.");
ee("m_archaeologie", "ansehen", .02, 12, "Wer forscht und zeigt, gewinnt Ansehen.");
ee("m_archaeologie", "hochschule", .01, 12, "Ausgrabungen binden Fakultäten und Studierende.");
ee("m_minderheitenrechte", "vielfalt", .08, 6, "Rechte auf Sprache, Schule und Gebetsstätten heben die Akzeptanz.");
ee("m_minderheitenrechte", "polarisierung", .02, 3, "Zu Beginn wächst der Streit um Zugeständnisse.");
ee("m_minderheitenrechte", "konservative", -.04, 1, "Ein Teil der Wähler sieht die Einheit des Landes berührt.");
ee("m_minderheitenrechte", "staedtische_saekulare", .04, 1, "Gleiche Rechte sind ihnen wichtig.");
ee("m_minderheitenrechte", "junge", .02, 1, "Junge sehen es meist gelassener.");
ee("m_minderheitenrechte", "ansehen", .03, 6, "Minderheitenrechte werden international beachtet.");
ee("m_minderheitenrechte", "beziehungen_eu", .03, 6, "Kopenhagener Kriterien: Schutz von Minderheiten.");
ee("m_minderheitenrechte", "zivilgesellschaft", .03, 6, "Vereine der Gemeinden können frei arbeiten.");
ee("m_minderheitenrechte", "identitaet", -.02, 3, "Manche sehen die gemeinsame Identität geschwächt.");
ee("kulturerbe", "tourismus", .04, 6, "Gepflegte Stätten sind das Ziel der Kulturreisenden.");
ee("kulturerbe", "ansehen", .02, 12, "Weltbekannte Stätten prägen das Bild des Landes.");
ee("kulturerbe", "identitaet", .02, 12, "Ein gepflegtes Erbe stärkt den Zusammenhalt.");
ee("tourismus", "kulturerbe", -.01, 12, "Besucherdruck belastet Stätten wie Pamukkale und Ephesos.");
ee("identitaet", "polarisierung", -.02, 6, "Gemeinsame Erzählungen mildern den Streit.");
ee("identitaet", "vertrauen_regierung", .01, 6, "Zusammenhalt stärkt das Vertrauen.");
ee("identitaet", "konservative", .02, 1, "Ein Teil der Wähler schätzt Symbole und Geschichte.");
ee("vielfalt", "polarisierung", -.03, 6, "Wer sich anerkannt fühlt, streitet weniger.");
ee("vielfalt", "ansehen", .03, 6, "Vielfalt wird im Ausland wahrgenommen.");
ee("vielfalt", "zivilgesellschaft", .03, 6, "Gemeinden gründen Vereine und Stiftungen.");
ee("vielfalt", "tourismus", .01, 12, "Vielfalt macht Städte wie Mardin und Antakya besuchenswert.");
ee("vielfalt", "beziehungen_eu", .02, 6, "Minderheitenschutz gehört zum Beitrittsweg.");
ee("m_religionsbehoerde", "vielfalt", -.03, 6, "Wer eine Auslegung bevorzugt, schwächt die Akzeptanz anderer Gemeinschaften.");
ee("m_religioese_schulen", "vielfalt", -.02, 12, "Ein Schwerpunkt auf eine Richtung lässt weniger Raum für andere.");
ee("m_integration", "vielfalt", .03, 12, "Wer aufgenommen wird, gehört dazu.");
ee("erdbebenvorsorge", "kulturerbe", .02, 12, "Verstärkte Gebäude schützen auch Denkmäler.");
ee("m_instandhaltung", "wartungszustand", .06, 6, "Wartung und Erneuerung heben den Zustand.");
ee("m_instandhaltung", "verkehrsnetz", .02, 12, "Gepflegte Straßen sind befahrbarer.");
ee("m_instandhaltung", "stromversorgung", .02, 12, "Erneuerte Leitungen fallen seltener aus.");
ee("m_instandhaltung", "bauwirtschaft", .03, 3, "Aufträge für Bau- und Wartungsfirmen.");
ee("m_instandhaltung", "arbeitnehmer", .01, 3, "Sichere Arbeit im Bau.");
ee("wartungszustand", "verkehrsnetz", .03, 6, "Gepflegte Straßen sind schneller und sicherer.");
ee("wartungszustand", "bahnnetz", .02, 6, "Gepflegte Gleise erlauben höhere Geschwindigkeit.");
ee("wartungszustand", "stromversorgung", .03, 6, "Gepflegte Leitungen und Kraftwerke fallen seltener aus.");
ee("wartungszustand", "logistik", .02, 6, "Weniger Sperrungen und Ausfälle.");
ee("wartungszustand", "wasserversorgung", .02, 6, "Weniger Verluste in den Leitungen.");
ee("m_autobahnen", "wartungszustand", -.01, 12, "Mehr Anlagen brauchen mehr Pflege.");
ee("m_bahn", "wartungszustand", -.01, 12, "Mehr Gleise brauchen mehr Pflege.");
ee("m_breitband", "wartungszustand", -.005, 12, "Mehr Netz braucht mehr Pflege.");
grp("minderheiten", "Minderheiten", "Kurdinnen und Kurden, Aleviten, Christen und andere: achten auf Rechte, Sprache, Sicherheit und die Lage ihrer Regionen.");
grp("nationalisten", "Nationalisten und Sicherheitsorientierte", "Achten auf die Stärke des Staates, auf Grenzen, Sicherheit und den Zusammenhalt des Landes.");
grp("arme", "Menschen in Armut", "Kommen kaum über die Runden: achten auf Preise, Sozialleistungen, Wohnen und Arbeit.");
ee("m_minderheitenrechte", "minderheiten", .05, 1, "Sprache, Schulen und Glaubensorte sind ihnen ein Kernanliegen.");
ee("m_friedensprozess", "minderheiten", .04, 1, "Ein Ende der Gewalt und eine politische Lösung sind ihnen wichtig.");
ee("m_versammlungsfreiheit", "minderheiten", .03, 1, "Wer demonstrieren darf, wird gehört.");
ee("m_regionalfoerderung", "minderheiten", .03, 3, "Ihre Regionen liegen bei Einkommen und Infrastruktur oft zurück.");
ee("m_notstand", "minderheiten", -.03, 1, "Notstandsbefugnisse trafen im Südosten über Jahre den Alltag.");
ee("m_urteilsumsetzung", "minderheiten", .02, 3, "Wer sich auf Urteile verlassen kann, fühlt sich sicherer.");
ee("m_internetsperren", "minderheiten", -.02, 1, "Gesperrte Plattformen treffen auch die Medien in ihren Sprachen.");
ee("ausnahmerecht", "minderheiten", -.03, 0, "Sonderregeln verschieben das Gleichgewicht zu ihren Lasten.");
ee("justiz_unabhaengigkeit", "minderheiten", .02, 3, "Faire Verfahren sind für alle wichtig, die sich sonst schutzlos fühlen.");
ee("rechtssicherheit", "minderheiten", .02, 3, "Verlässliche Regeln schützen die, die sonst zuerst verlieren.");
ee("pressefreiheit", "minderheiten", .02, 3, "Eigene Medien und freie Berichte machen sie sichtbar.");
ee("vielfalt", "minderheiten", .04, 3, "Ob Vielfalt anerkannt wird, spüren sie im Alltag.");
ee("polarisierung", "minderheiten", -.02, 1, "Tiefe Spaltung trifft Minderheiten zuerst.");
ee("p_polarisierung", "minderheiten", -.03, 0, "Wo die Gesellschaft gespalten ist, sind sie die Zielscheibe.");
ee("wachstum_regional", "minderheiten", .03, 3, "Arbeit und Einkommen in ihren Regionen.");
ee("arbeitslosigkeit", "minderheiten", -.03, 0, "Im Südosten liegt die Arbeitslosigkeit über dem Durchschnitt.");
ee("lebenshaltung", "minderheiten", -.03, 0, "Auch sie zahlen die Preise.");
ee("m_verteidigung", "nationalisten", .03, 1, "Starke Streitkräfte sind ihnen ein Kern des Staates.");
ee("m_grenzschutz", "nationalisten", .04, 1, "Kontrolle an den Grenzen ist ihre erste Forderung.");
ee("m_polizei", "nationalisten", .03, 1, "Mehr Polizei ist für sie ein Zeichen von Ordnung.");
ee("m_ruestungsindustrie", "nationalisten", .03, 3, "Eigene Waffen machen unabhängig.");
ee("m_wehrdienst", "nationalisten", .03, 1, "Der Wehrdienst gilt als nationale Pflicht.");
ee("m_rueckkehr", "nationalisten", .03, 1, "Für sie ein Zeichen, dass die Regierung handelt.");
ee("m_integration", "nationalisten", -.03, 1, "Sie sehen darin eine Dauerlösung, die sie nicht wollen.");
ee("m_friedensprozess", "nationalisten", -.03, 1, "Manche sehen darin ein Zugeständnis an Gewalt.");
ee("m_minderheitenrechte", "nationalisten", -.04, 1, "Für sie berührt es die Einheit des Landes.");
ee("m_eu_annaeherung", "nationalisten", -.02, 1, "Sie misstrauen Brüsseler Bedingungen.");
ee("m_notstand", "nationalisten", .02, 1, "Ein starker Staat in der Krise ist ihnen recht.");
ee("m_haftvermeidung", "nationalisten", -.02, 1, "Wird als Nachgiebigkeit gegenüber Straftätern gelesen.");
ee("terrorgefahr", "nationalisten", -.04, 0, "Sicherheit vor Terror steht für sie an erster Stelle.");
ee("kriminalitaet", "nationalisten", -.03, 0, "Unsicherheit und Kriminalität empören sie.");
ee("p_kriminalitaet", "nationalisten", -.03, 0, "Unsicherheit auf den Straßen ärgert die, die Ordnung wollen.");
ee("gefluechtete", "nationalisten", -.03, 0, "Die Zahl der Geflüchteten im Land ist ihnen zu hoch.");
ee("p_migrationsdruck", "nationalisten", -.04, 0, "Spannungen um Migration nähren ihre Unzufriedenheit.");
ee("abschreckung", "nationalisten", .03, 1, "Ein Land, dem die Nachbarn Respekt zollen.");
ee("ansehen", "nationalisten", .02, 3, "Sie wollen, dass das Land in der Welt gehört wird.");
ee("identitaet", "nationalisten", .03, 3, "Symbole, Sprache und gemeinsame Geschichte.");
ee("lebenshaltung", "nationalisten", -.03, 0, "Auch sie zahlen die Preise.");
ee("arbeitslosigkeit", "nationalisten", -.02, 0, "Ohne Arbeit schwindet das Vertrauen in den Staat.");
ee("m_sozialhilfe", "arme", .05, 1, "Für viele der Unterschied zwischen Auskommen und Not.");
ee("m_arbeitslosengeld", "arme", .04, 1, "Ein Netz, wenn die Arbeit wegfällt.");
ee("m_kindergeld", "arme", .03, 1, "Familien mit wenig Geld spüren jeden Zuschuss.");
ee("m_mindestlohn", "arme", .03, 1, "Ein höherer Lohn am unteren Ende, sofern die Arbeit bleibt.");
ee("m_sozialwohnungen", "arme", .04, 3, "Wer sich keine Miete leisten kann, wartet auf sie.");
ee("m_mietdeckel", "arme", .03, 1, "Die Miete frisst den Lohn.");
ee("m_energiesubventionen", "arme", .04, 1, "Strom und Heizung sind ein großer Teil der Ausgaben.");
ee("m_preiskontrollen", "arme", .03, 1, "Niedrigere Preise im Regal, solange sie halten.");
ee("m_zuzahlungen", "arme", -.04, 1, "Wer wenig hat, geht später zum Arzt.");
ee("m_mwst", "arme", -.04, 1, "Verbrauchsteuern treffen die, die alles ausgeben müssen.");
ee("m_kraftstoffsteuer", "arme", -.02, 1, "Teurer Sprit verteuert Wege und Waren.");
ee("m_hausarzt", "arme", .02, 3, "Eine Praxis in der Nähe spart Wege und Geld.");
ee("lebenshaltung", "arme", -.05, 0, "Sie spüren die Teuerung zuerst.");
ee("lebensmittelpreise", "arme", -.04, 0, "Ein großer Teil des Einkommens geht in Lebensmittel.");
ee("energiepreise", "arme", -.03, 0, "Strom und Heizung werden zum Luxus.");
ee("mieten", "arme", -.04, 0, "Die Miete ist der größte Posten.");
ee("armut", "arme", -.05, 0, "Wer arm ist, misst die Regierung an dem, was im Portemonnaie bleibt.");
ee("p_armut", "arme", -.05, 0, "Wo Armut zum Problem wird, kippt die Stimmung.");
ee("arbeitslosigkeit", "arme", -.04, 0, "Ohne Arbeit gibt es kaum Auskommen.");
ee("realeinkommen", "arme", .04, 1, "Was der Lohn wert ist, entscheidet über den Monat.");
ee("informelle_arbeit", "arme", -.02, 3, "Arbeit ohne Vertrag heißt: ohne Schutz.");
ee("gesundheitsversorgung", "arme", .02, 3, "Wer wenig hat, ist auf öffentliche Gesundheit angewiesen.");
ee("ungleichheit", "arme", -.02, 3, "Der Abstand nach oben wird wahrgenommen.");
ee("p_wohnungsnot", "arme", -.03, 0, "Kein Dach über dem Kopf ist keine Statistik.");
ee("sozialkassen", "arme", .02, 3, "Solide Kassen halten die Leistungen.");
ee("leitzins", "unternehmer", -.012, 2, "Teure Kredite verkleinern den Spielraum von Betrieben und Selbständigen.");
ee("leitzins", "mittelstand", -.015, 3, "Der Mittelstand lebt von Bankkrediten.");
ee("leitzins", "bauwirtschaft", -.02, 3, "Wer nicht finanzieren kann, baut nicht.");
ee("leitzins", "gruendungen", -.012, 4, "Gründer bekommen kaum Kredit, wenn die Zinsen hoch sind.");
ee("leitzins", "rentner", .01, 1, "Sparer und Rentner profitieren von hohen Zinsen.");
ee("leitzins", "junge", -.008, 3, "Wohnung und Ausbildung auf Kredit werden teurer.");
ee("leitzins", "arbeitnehmer", -.005, 6, "Wenn Betriebe weniger investieren, sind Jobs gefährdet.");
ee("abwertung", "mittelstand", -.012, 2, "Importabhängige Betriebe zahlen mehr für Vorprodukte.");
ee("zinslast", "vertrauen_maerkte", -.015, 3, "Wer viel für Zinsen ausgibt, hat weniger Spielraum: Anleger werden nervös.");
const NODES = N$1;
//#endregion
//#region game/src/sim/modell.ts
const NET = buildModel(NODES, E);
//#endregion
//#region game/src/sim/wirkung.ts
function clampIndex(x) {
	return Math.min(100, Math.max(0, x));
}
/** Verschiebt einen Knoten in den genannten Provinzen (Kfz-Kennziffern) oder im ganzen Land. */
function wirke(world, id, delta, provinzen) {
	const i = NET.index.get(id);
	if (i === void 0) throw new Error(`Unbekannter Knoten: ${id}`);
	const s = world.net;
	const jetzt = s.history[s.month % s.history.length];
	const liste = provinzen && provinzen.length ? provinzen : null;
	for (let p = 0; p < 81; p++) {
		if (liste && !liste.includes(p + 1)) continue;
		const k = i * 81 + p;
		const neu = clampIndex(s.values[k] + delta);
		const echt = neu - s.values[k];
		s.values[k] = neu;
		jetzt[k] = clampIndex(jetzt[k] + echt);
	}
}
/** Durchschnitt eines Knotens über die genannten Provinzen, nach Bevölkerung gewichtet. */
function wertIn(world, id, provinzen) {
	const i = NET.index.get(id);
	if (i === void 0) return NaN;
	let sum = 0;
	let w = 0;
	for (const plaka of provinzen) {
		const weight = world.net.weights[plaka - 1];
		sum += world.net.values[i * 81 + plaka - 1] * weight;
		w += weight;
	}
	return w > 0 ? sum / w : NaN;
}
/** Vertrauen in die Regierung, landesweit verschoben. */
function vertrauenAendern(world, delta) {
	wirke(world, "vertrauen_regierung", delta);
}
//#endregion
//#region game/src/sim/log.ts
function addLog(world, kind, text, why) {
	const entry = {
		day: world.day,
		date: world.date,
		kind,
		text
	};
	if (why) entry.why = why;
	world.log.push(entry);
}
/** Zahl mit einer Nachkommastelle im deutschen Format. */
function fmt(x) {
	return x.toLocaleString("de-DE", {
		maximumFractionDigits: 1,
		minimumFractionDigits: 1
	});
}
/** Wie viel sich noch ausgeben lässt, einschließlich der Überziehung. */
const verfuegbar = (kapital) => kapital + 20;
/** Ob sich `pk` bezahlen lässt (Kapital plus Überziehung). */
const kannZahlen = (kapital, pk) => kapital + 20 >= pk - 1e-9;
//#endregion
//#region game/src/sim/programme.ts
const kein = [{ art: "keine" }];
const PROGRAMME = [
	{
		id: "erdbeben",
		titel: "Wiederaufbau und Erdbebenschutz",
		leitbild: "Nie wieder eingestürzte Häuser: erst wissen, was gefährdet ist, dann prüfen, umsiedeln und einen Katastrophenschutz aufbauen.",
		schritte: [
			{
				id: "erdbeben1",
				titel: "Gefährdete Gebäude erfassen",
				text: "Ein Kataster zeigt, welche Häuser einer Bebenlast nicht standhalten.",
				voraus: [],
				bedingung: kein,
				kapital: 3,
				tage: 30,
				ergebnis: "Erdbebenvorsorge +3, Bauqualität +1",
				wirkung: (w) => {
					wirke(w, "erdbebenvorsorge", 3);
					wirke(w, "bauqualitaet", 1);
				}
			},
			{
				id: "erdbeben2",
				titel: "Unabhängige Bauprüfer",
				text: "Statik und Material prüfen Fachleute, die vom Bauherrn unabhängig sind.",
				voraus: ["erdbeben1"],
				bedingung: [{
					art: "massnahme",
					id: "m_bauaufsicht",
					min: 60
				}],
				kapital: 4,
				tage: 45,
				ergebnis: "Bauqualität +4; Wohnen kostet 15 % weniger Kapital",
				wirkung: (w) => wirke(w, "bauqualitaet", 4),
				rabatt: {
					thema: "wohnen",
					anteil: .15
				}
			},
			{
				id: "erdbeben3",
				titel: "Sichere Umsiedlung",
				text: "Wer in einem gefährdeten Haus wohnt, bekommt ein sicheres angeboten, nicht nur einen Abrissbescheid.",
				voraus: ["erdbeben2"],
				bedingung: [{
					art: "massnahme",
					id: "m_stadterneuerung",
					min: 60
				}],
				kapital: 5,
				tage: 60,
				ergebnis: "Erdbebenvorsorge +5, Wohnungsbau +2",
				wirkung: (w) => {
					wirke(w, "erdbebenvorsorge", 5);
					wirke(w, "wohnungsbau", 2);
				}
			},
			{
				id: "erdbeben4",
				titel: "Katastrophenschutzbehörde",
				text: "Eine Behörde koordiniert Rettung, Notunterkünfte und Wiederaufbau, bevor das nächste Beben kommt.",
				voraus: ["erdbeben2"],
				bedingung: [{
					art: "massnahme-max",
					id: "m_bauamnestie",
					max: 20
				}],
				kapital: 5,
				tage: 60,
				ergebnis: "Erdbeben treffen das Land nur noch mit 70 % ihrer Stärke",
				wirkung: (w) => vertrauenAendern(w, 1),
				schutz: {
					ereignis: "erdbeben",
					faktor: .7
				}
			},
			{
				id: "erdbeben5",
				titel: "Ein Land, das dem Beben standhält",
				text: "In den Erdbebengebieten steht kaum noch ein Haus, dem man nicht traut.",
				voraus: ["erdbeben3", "erdbeben4"],
				bedingung: [{
					art: "problem",
					id: "p_erdbebengefahr",
					maxProvinzen: 8
				}],
				kapital: 6,
				tage: 90,
				ergebnis: "Kapital +10, Vertrauen +3",
				wirkung: (w) => vertrauenAendern(w, 3),
				bonusKapital: 10,
				vermaechtnis: true
			}
		]
	},
	{
		id: "preise",
		titel: "Preisstabilität",
		leitbild: "Die Lira wieder wertvoll machen: Haushaltsdisziplin, Steuern einziehen statt erhöhen und eine Zentralbank, die in Ruhe arbeitet.",
		schritte: [
			{
				id: "preise1",
				titel: "Haushaltsdisziplin verkünden",
				text: "Der Präsident legt sich öffentlich auf einen soliden Haushalt fest.",
				voraus: [],
				bedingung: kein,
				kapital: 3,
				tage: 30,
				ergebnis: "Vertrauen der Märkte +3, Risikoaufschlag −15",
				wirkung: (w) => {
					wirke(w, "vertrauen_maerkte", 3);
					w.economy.riskPremium = Math.max(100, w.economy.riskPremium - 15);
					w.economy.credibility = clamp(w.economy.credibility + .02, .05, .95);
				}
			},
			{
				id: "preise2",
				titel: "Steuern einziehen statt erhöhen",
				text: "Mehr Prüfer, digitale Steuerverwaltung: Wer zahlen muss, zahlt.",
				voraus: ["preise1"],
				bedingung: [{
					art: "massnahme",
					id: "m_steuerfahndung",
					min: 55
				}],
				kapital: 4,
				tage: 45,
				ergebnis: "Steuereinnahmen +3, Steuermoral +2; Haushalt kostet 15 % weniger Kapital",
				wirkung: (w) => {
					wirke(w, "steuereinnahmen", 3);
					wirke(w, "steuermoral", 2);
				},
				rabatt: {
					thema: "haushalt",
					anteil: .15
				}
			},
			{
				id: "preise3",
				titel: "Die Zentralbank in Ruhe lassen",
				text: "Ein halbes Jahr ohne öffentliche Angriffe auf die Zentralbank: Die Märkte merken es.",
				voraus: ["preise1"],
				bedingung: [{
					art: "ruhe-zentralbank",
					tage: 180
				}],
				kapital: 3,
				tage: 60,
				ergebnis: "Glaubwürdigkeit +5 %, Risikoaufschlag −25",
				wirkung: (w) => {
					w.economy.credibility = clamp(w.economy.credibility + .05, .05, .95);
					w.economy.riskPremium = Math.max(100, w.economy.riskPremium - 25);
				}
			},
			{
				id: "preise4",
				titel: "Die Teuerung bricht",
				text: "Die Inflation fällt unter 22 Prozent: Erstmals seit Langem sinken die Preise nicht nur im Bericht.",
				voraus: ["preise2"],
				bedingung: [{
					art: "inflation",
					max: 22
				}],
				kapital: 4,
				tage: 45,
				ergebnis: "Lebenshaltung −2, Vertrauen der Märkte +2",
				wirkung: (w) => {
					wirke(w, "lebenshaltung", -2);
					wirke(w, "vertrauen_maerkte", 2);
				}
			},
			{
				id: "preise5",
				titel: "Zweistellige Inflation ist Vergangenheit",
				text: "Die Inflation liegt unter 15 Prozent und bleibt dort.",
				voraus: ["preise3", "preise4"],
				bedingung: [{
					art: "inflation",
					max: 15
				}],
				kapital: 6,
				tage: 90,
				ergebnis: "Kapital +10, Vertrauen +3",
				wirkung: (w) => vertrauenAendern(w, 3),
				bonusKapital: 10,
				vermaechtnis: true
			}
		]
	},
	{
		id: "regionen",
		titel: "Starke Regionen",
		leitbild: "Ein Land ohne Hinterland: Straßen, Bahn und Internet bis ins Dorf, damit niemand für Arbeit wegziehen muss.",
		schritte: [
			{
				id: "regionen1",
				titel: "Straßen und Brücken",
				text: "Das Straßennetz wird dort ausgebaut, wo es fehlt.",
				voraus: [],
				bedingung: [{
					art: "massnahme",
					id: "m_autobahnen",
					min: 60
				}],
				kapital: 3,
				tage: 45,
				ergebnis: "Straßen und Autobahnen +2",
				wirkung: (w) => wirke(w, "verkehrsnetz", 2)
			},
			{
				id: "regionen2",
				titel: "Bahn und Häfen",
				text: "Güter auf die Schiene, Häfen ans Netz.",
				voraus: ["regionen1"],
				bedingung: [{
					art: "massnahme",
					id: "m_bahn",
					min: 55
				}],
				kapital: 4,
				tage: 60,
				ergebnis: "Logistik +3, Exportstärke +1",
				wirkung: (w) => {
					wirke(w, "logistik", 3);
					wirke(w, "export", 1);
				}
			},
			{
				id: "regionen3",
				titel: "Breitband bis ins Dorf",
				text: "Wer auf dem Land wohnt, arbeitet auch dort.",
				voraus: ["regionen1"],
				bedingung: [{
					art: "massnahme",
					id: "m_breitband",
					min: 60
				}],
				kapital: 4,
				tage: 45,
				ergebnis: "Internet +3, Landflucht −2",
				wirkung: (w) => {
					wirke(w, "internet", 3);
					wirke(w, "landflucht", -2);
				}
			},
			{
				id: "regionen4",
				titel: "Regionale Wachstumszentren",
				text: "Förderung gebündelt in Provinzen, die sonst abgehängt bleiben.",
				voraus: ["regionen2", "regionen3"],
				bedingung: [{
					art: "massnahme",
					id: "m_regionalfoerderung",
					min: 65
				}],
				kapital: 5,
				tage: 60,
				ergebnis: "Regionales Wachstum +4; Infrastruktur kostet 15 % weniger Kapital",
				wirkung: (w) => wirke(w, "wachstum_regional", 4),
				rabatt: {
					thema: "infrastruktur",
					anteil: .15
				}
			},
			{
				id: "regionen5",
				titel: "Ein Land ohne Hinterland",
				text: "Kaum noch eine Provinz verliert ihre Jungen an die Städte.",
				voraus: ["regionen4"],
				bedingung: [{
					art: "problem",
					id: "p_landflucht",
					maxProvinzen: 5
				}],
				kapital: 6,
				tage: 90,
				ergebnis: "Kapital +10, Vertrauen +3",
				wirkung: (w) => vertrauenAendern(w, 3),
				bonusKapital: 10,
				vermaechtnis: true
			}
		]
	},
	{
		id: "gesundheit",
		titel: "Gesundheit für alle",
		leitbild: "Eine Ärztin im Ort, ein Bett im Krankenhaus, kurze Wartezeiten: Gesundheit darf keine Frage der Provinz sein.",
		schritte: [
			{
				id: "gesundheit1",
				titel: "Hausarztmodelle",
				text: "Familienärzte als erste Anlaufstelle entlasten die Kliniken.",
				voraus: [],
				bedingung: [{
					art: "massnahme",
					id: "m_hausarzt",
					min: 55
				}],
				kapital: 3,
				tage: 45,
				ergebnis: "Wartezeiten −3",
				wirkung: (w) => wirke(w, "wartezeiten", -3)
			},
			{
				id: "gesundheit2",
				titel: "Ärzte im Land halten",
				text: "Bessere Bezahlung und Bedingungen halten Ärztinnen und Ärzte im Land.",
				voraus: [],
				bedingung: [{
					art: "massnahme",
					id: "m_aerztegehalt",
					min: 55
				}],
				kapital: 4,
				tage: 45,
				ergebnis: "Ärzte im Land +3, Abwanderung −1",
				wirkung: (w) => {
					wirke(w, "aerzte", 3);
					wirke(w, "abwanderung", -1);
				}
			},
			{
				id: "gesundheit3",
				titel: "Das Krankenhausnetz",
				text: "Neue Häuser dort, wo die nächste Klinik zu weit weg ist.",
				voraus: ["gesundheit1"],
				bedingung: [{
					art: "massnahme",
					id: "m_krankenhausbau",
					min: 65
				}],
				kapital: 5,
				tage: 60,
				ergebnis: "Gesundheitsversorgung +4; Gesundheit kostet 15 % weniger Kapital",
				wirkung: (w) => wirke(w, "gesundheitsversorgung", 4),
				rabatt: {
					thema: "gesundheit",
					anteil: .15
				}
			},
			{
				id: "gesundheit4",
				titel: "Ärztemangel überwunden",
				text: "In keiner Provinz fehlt es mehr an Ärzten.",
				voraus: ["gesundheit2", "gesundheit3"],
				bedingung: [{
					art: "problem",
					id: "p_aerztemangel",
					maxProvinzen: 3
				}],
				kapital: 6,
				tage: 90,
				ergebnis: "Kapital +10, Vertrauen +3",
				wirkung: (w) => vertrauenAendern(w, 3),
				bonusKapital: 10,
				vermaechtnis: true
			}
		]
	},
	{
		id: "recht",
		titel: "Rechtsstaat und Vertrauen",
		leitbild: "Wer dem Staat vertraut, zahlt Steuern und geht wählen: offene Vergaben, unabhängige Richter und Medien, die fragen dürfen.",
		schritte: [
			{
				id: "recht1",
				titel: "Öffentliche Vergaben",
				text: "Jede große Vergabe ist einsehbar, jedes Vermögen erklärt.",
				voraus: [],
				bedingung: [{
					art: "massnahme",
					id: "m_antikorruption",
					min: 55
				}],
				kapital: 3,
				tage: 45,
				ergebnis: "Korruption −3, Vertrauen in die Justiz +2",
				wirkung: (w) => {
					wirke(w, "korruption", -3);
					wirke(w, "justizvertrauen", 2);
				}
			},
			{
				id: "recht2",
				titel: "Ein Richterrat",
				text: "Richter ernennt ein Rat aus Richtern, nicht die Regierung.",
				voraus: ["recht1"],
				bedingung: [{
					art: "massnahme",
					id: "m_justizreform",
					min: 55
				}],
				kapital: 5,
				tage: 60,
				ergebnis: "Rechtssicherheit +4, Vertrauen in die Justiz +3",
				wirkung: (w) => {
					wirke(w, "rechtssicherheit", 4);
					wirke(w, "justizvertrauen", 3);
				}
			},
			{
				id: "recht3",
				titel: "Medien, die fragen dürfen",
				text: "Die Aufsicht greift nur noch bei Straftaten ein.",
				voraus: ["recht1"],
				bedingung: [{
					art: "massnahme-max",
					id: "m_medienaufsicht",
					max: 50
				}],
				kapital: 4,
				tage: 45,
				ergebnis: "Pressefreiheit +4, Zivilgesellschaft +2",
				wirkung: (w) => {
					wirke(w, "pressefreiheit", 4);
					wirke(w, "zivilgesellschaft", 2);
				}
			},
			{
				id: "recht4",
				titel: "Ein Staat, dem man traut",
				text: "Korruption ist die Ausnahme, und die Justiz gilt als unabhängig.",
				voraus: ["recht2", "recht3"],
				bedingung: [{
					art: "groesse",
					id: "justizvertrauen",
					min: 55
				}, {
					art: "groesse",
					id: "korruption",
					max: 40
				}],
				kapital: 6,
				tage: 90,
				ergebnis: "Kapital +10, Vertrauen +3",
				wirkung: (w) => vertrauenAendern(w, 3),
				bonusKapital: 10,
				vermaechtnis: true
			}
		]
	},
	{
		id: "wasserenergie",
		titel: "Wasser und Energie der Zukunft",
		leitbild: "Sauberes Wasser aus dem Hahn, Strom, der nicht ausfällt, und eine Energieversorgung, die nicht am Preis des Auslands hängt.",
		schritte: [
			{
				id: "wasser1",
				titel: "Trinkwassernetze",
				text: "Leitungen und Kläranlagen dort, wo das Wasser knapp ist.",
				voraus: [],
				bedingung: [{
					art: "massnahme",
					id: "m_wasserleitungen",
					min: 55
				}],
				kapital: 3,
				tage: 45,
				ergebnis: "Wasserversorgung +3",
				wirkung: (w) => wirke(w, "wasserversorgung", 3)
			},
			{
				id: "wasser2",
				titel: "Bewässerung und Speicher",
				text: "Tropfbewässerung spart, Speicher puffern die Trockenzeit.",
				voraus: ["wasser1"],
				bedingung: [{
					art: "massnahme",
					id: "m_bewaesserung",
					min: 55
				}],
				kapital: 4,
				tage: 60,
				ergebnis: "Dürre −3, Ernte +2; Landwirtschaft kostet 15 % weniger Kapital",
				wirkung: (w) => {
					wirke(w, "duerre", -3);
					wirke(w, "ernte", 2);
				},
				rabatt: {
					thema: "landwirtschaft",
					anteil: .15
				}
			},
			{
				id: "wasser3",
				titel: "Sonne und Wind",
				text: "Ausschreibungen für erneuerbaren Strom senken die Importe.",
				voraus: [],
				bedingung: [{
					art: "massnahme",
					id: "m_solar_wind",
					min: 60
				}],
				kapital: 4,
				tage: 60,
				ergebnis: "Erneuerbare +4, Energieimporte −2",
				wirkung: (w) => {
					wirke(w, "erneuerbare", 4);
					wirke(w, "energieimporte", -2);
				}
			},
			{
				id: "wasser4",
				titel: "Stromnetz und Speicher",
				text: "Leitungen und Batterien halten den Strom im Netz, wenn der Wind sich legt.",
				voraus: ["wasser3"],
				bedingung: [{
					art: "massnahme",
					id: "m_netzausbau",
					min: 60
				}],
				kapital: 4,
				tage: 60,
				ergebnis: "Stromversorgung +4; Energie kostet 15 % weniger Kapital",
				wirkung: (w) => wirke(w, "stromversorgung", 4),
				rabatt: {
					thema: "energie",
					anteil: .15
				}
			},
			{
				id: "wasser5",
				titel: "Wasser und Strom sind sicher",
				text: "Kein akuter Wassermangel, keine akuten Stromausfälle.",
				voraus: ["wasser2", "wasser4"],
				bedingung: [{
					art: "problem",
					id: "p_wassermangel",
					maxProvinzen: 3
				}, {
					art: "problem",
					id: "p_stromausfaelle",
					maxProvinzen: 3
				}],
				kapital: 6,
				tage: 90,
				ergebnis: "Kapital +10, Vertrauen +3",
				wirkung: (w) => vertrauenAendern(w, 3),
				bonusKapital: 10,
				vermaechtnis: true
			}
		]
	},
	{
		id: "sicherheit",
		titel: "Sicherheit und Frieden",
		leitbild: "Sicher leben, ohne dass Sicherheit zum Vorwand wird: moderne Behörden, gesicherte Grenzen und ein Friedensprozess, der hält.",
		schritte: [
			{
				id: "sicherheit1",
				titel: "Moderne Sicherheitsverwaltung",
				text: "Forensik, digitale Akten, abgestimmte Behörden.",
				voraus: [],
				bedingung: [{
					art: "massnahme",
					id: "m_polizeitechnik",
					min: 50
				}],
				kapital: 3,
				tage: 45,
				ergebnis: "Kriminalität −2",
				wirkung: (w) => wirke(w, "kriminalitaet", -2)
			},
			{
				id: "sicherheit2",
				titel: "Grenzen sichern",
				text: "Technik und Personal an den Übergängen, nicht nur Mauern.",
				voraus: ["sicherheit1"],
				bedingung: [{
					art: "massnahme",
					id: "m_grenzschutz",
					min: 65
				}],
				kapital: 4,
				tage: 60,
				ergebnis: "Terrorgefahr −3",
				wirkung: (w) => wirke(w, "terrorgefahr", -3)
			},
			{
				id: "sicherheit3",
				titel: "Ein Friedensprozess, der hält",
				text: "Waffenabgabe, Wiedereingliederung, politische Teilhabe.",
				voraus: ["sicherheit1"],
				bedingung: [{
					art: "massnahme",
					id: "m_friedensprozess",
					min: 65
				}],
				kapital: 5,
				tage: 60,
				ergebnis: "Terrorgefahr −4, Polarisierung −2",
				wirkung: (w) => {
					wirke(w, "terrorgefahr", -4);
					wirke(w, "polarisierung", -2);
				}
			},
			{
				id: "sicherheit4",
				titel: "Ein Land, das sich sicher fühlt",
				text: "Terror und Kriminalität sind niedrig, und niemand fürchtet den Staat.",
				voraus: ["sicherheit2", "sicherheit3"],
				bedingung: [{
					art: "groesse",
					id: "terrorgefahr",
					max: 40
				}],
				kapital: 6,
				tage: 90,
				ergebnis: "Kapital +10, Vertrauen +3",
				wirkung: (w) => vertrauenAendern(w, 3),
				bonusKapital: 10,
				vermaechtnis: true
			}
		]
	},
	{
		id: "welt",
		titel: "Die Türkei in der Welt",
		leitbild: "Partner statt Zuschauer: Brüssel und Washington im Gespräch, Handel ohne Wartezeiten und ein Umgang mit Geflüchteten, der trägt.",
		schritte: [
			{
				id: "welt1",
				titel: "Gespräche mit Brüssel",
				text: "Reformen gegen Visafreiheit und eine modernisierte Zollunion.",
				voraus: [],
				bedingung: [{
					art: "massnahme",
					id: "m_eu_annaeherung",
					min: 50
				}],
				kapital: 4,
				tage: 60,
				ergebnis: "Beziehungen zur EU +4",
				wirkung: (w) => wirke(w, "beziehungen_eu", 4)
			},
			{
				id: "welt2",
				titel: "Zoll ohne Wartezeit",
				text: "Digitale Abfertigung, nachvollziehbare Lieferketten.",
				voraus: [],
				bedingung: [{
					art: "massnahme",
					id: "m_handelssysteme",
					min: 50
				}],
				kapital: 3,
				tage: 45,
				ergebnis: "Exportstärke +3",
				wirkung: (w) => wirke(w, "export", 3)
			},
			{
				id: "welt3",
				titel: "Integration, die trägt",
				text: "Sprachkurse, Arbeitserlaubnis, Schulplätze.",
				voraus: [],
				bedingung: [{
					art: "massnahme",
					id: "m_integration",
					min: 55
				}],
				kapital: 4,
				tage: 60,
				ergebnis: "Migrationsdruck sinkt: Geflüchtete −3",
				wirkung: (w) => wirke(w, "gefluechtete", -3)
			},
			{
				id: "welt4",
				titel: "Ein Partner, den man ernst nimmt",
				text: "Brüssel und Washington rufen an, bevor sie entscheiden.",
				voraus: [
					"welt1",
					"welt2",
					"welt3"
				],
				bedingung: [{
					art: "groesse",
					id: "beziehungen_eu",
					min: 55
				}, {
					art: "groesse",
					id: "ansehen",
					min: 55
				}],
				kapital: 6,
				tage: 90,
				ergebnis: "Kapital +10, Vertrauen +3",
				wirkung: (w) => vertrauenAendern(w, 3),
				bonusKapital: 10,
				vermaechtnis: true
			}
		]
	}
];
const SCHRITT = /* @__PURE__ */ new Map();
for (const p of PROGRAMME) for (const s of p.schritte) SCHRITT.set(s.id, {
	schritt: s,
	programm: p
});
function programmZustand(w) {
	const spiel = w.spiel;
	return spiel.programm ??= {
		fertig: [],
		laufend: []
	};
}
function anzahlAkut(w, id) {
	const node = NET.nodes[NET.index.get(id)];
	const i = NET.index.get(id);
	let n = 0;
	for (let p = 0; p < 81; p++) if (node.threshold && w.net.values[i * 81 + p] >= node.threshold) n++;
	return n;
}
const name$1 = (id) => NET.nodes[NET.index.get(id)].name;
function pruefeBedingung(w, b) {
	switch (b.art) {
		case "keine": return {
			bedingung: b,
			erfuellt: true,
			fortschritt: 1,
			text: "Keine Voraussetzung"
		};
		case "massnahme": {
			const jetzt = nationalAverage(NET, w.net, b.id);
			const start = startAverage(NET, w.net, b.id);
			const f = start >= b.min ? 1 : clamp((jetzt - start) / (b.min - start), 0, 1);
			return {
				bedingung: b,
				erfuellt: jetzt >= b.min - .5,
				fortschritt: f,
				text: `${name$1(b.id)} mindestens auf Stufe ${b.min} (jetzt ${Math.round(jetzt)})`
			};
		}
		case "massnahme-max": {
			const jetzt = nationalAverage(NET, w.net, b.id);
			const start = startAverage(NET, w.net, b.id);
			const f = start <= b.max ? 1 : clamp((start - jetzt) / (start - b.max), 0, 1);
			return {
				bedingung: b,
				erfuellt: jetzt <= b.max + .5,
				fortschritt: f,
				text: `${name$1(b.id)} höchstens auf Stufe ${b.max} (jetzt ${Math.round(jetzt)})`
			};
		}
		case "groesse": {
			const jetzt = nationalAverage(NET, w.net, b.id);
			const ok = (b.min === void 0 || jetzt >= b.min) && (b.max === void 0 || jetzt <= b.max);
			const start = startAverage(NET, w.net, b.id);
			const ziel = b.min ?? b.max;
			return {
				bedingung: b,
				erfuellt: ok,
				fortschritt: ok ? 1 : clamp(1 - Math.abs(ziel - jetzt) / Math.max(1, Math.abs(ziel - start)), 0, 1),
				text: `${name$1(b.id)} ${b.min !== void 0 ? `mindestens ${b.min}` : `höchstens ${b.max}`} (jetzt ${Math.round(jetzt)})`
			};
		}
		case "problem": {
			const n = anzahlAkut(w, b.id);
			return {
				bedingung: b,
				erfuellt: n <= b.maxProvinzen,
				fortschritt: n <= b.maxProvinzen ? 1 : clamp(1 - (n - b.maxProvinzen) / Math.max(1, 81), 0, 1),
				text: `${name$1(b.id)} in höchstens ${b.maxProvinzen} Provinzen akut (jetzt ${n})`
			};
		}
		case "inflation": {
			const i = w.published.inflation.value;
			const start = w.spiel?.start.inflation ?? i;
			return {
				bedingung: b,
				erfuellt: i <= b.max,
				fortschritt: i <= b.max ? 1 : clamp((start - i) / Math.max(1, start - b.max), 0, 1),
				text: `Inflation höchstens ${b.max} % (jetzt ${i.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %)`
			};
		}
		case "ruhe-zentralbank": {
			const letzter = programmZustand(w).zentralbankAngriff;
			const seit = letzter === void 0 ? w.day : w.day - letzter;
			return {
				bedingung: b,
				erfuellt: seit >= b.tage,
				fortschritt: clamp(seit / b.tage, 0, 1),
				text: `${Math.round(b.tage / 30)} Monate ohne Angriff auf die Zentralbank (bisher ${Math.floor(seit / 30)})`
			};
		}
	}
}
function schrittSicht(w, s) {
	const z = programmZustand(w);
	const bedingungen = s.bedingung.map((b) => pruefeBedingung(w, b));
	const fehlt = s.voraus.filter((v) => !z.fertig.includes(v)).map((v) => SCHRITT.get(v).schritt.titel);
	const laufend = z.laufend.find((l) => l.schritt === s.id);
	let status;
	if (z.fertig.includes(s.id)) status = "fertig";
	else if (laufend) status = "laufend";
	else if (fehlt.length) status = "gesperrt";
	else if (bedingungen.every((b) => b.erfuellt)) status = "bereit";
	else status = "offen";
	return {
		schritt: s,
		status,
		bedingungen,
		fehlt,
		...laufend ? {
			lauf: clamp((w.day - laufend.start) / Math.max(1, laufend.ende - laufend.start), 0, 1),
			restTage: Math.max(0, laufend.ende - w.day)
		} : {},
		bezahlbar: kannZahlen(w.spiel?.kapital ?? 0, s.kapital)
	};
}
/** Täglich: Abgeschlossene Schritte wirken lassen. */
function programmTag(w) {
	const spiel = w.spiel;
	if (!spiel?.programm) return;
	const z = spiel.programm;
	for (const l of [...z.laufend]) {
		if (l.ende > w.day) continue;
		z.laufend = z.laufend.filter((x) => x !== l);
		const e = SCHRITT.get(l.schritt);
		if (!e) continue;
		const s = e.schritt;
		z.fertig.push(s.id);
		s.wirkung(w);
		if (s.bonusKapital) spiel.kapital = Math.min(150, spiel.kapital + s.bonusKapital);
		if (s.rabatt) spiel.modifikatoren = {
			...spiel.modifikatoren ?? {},
			[`rabatt:${s.rabatt.thema}`]: (spiel.modifikatoren?.[`rabatt:${s.rabatt.thema}`] ?? 0) + s.rabatt.anteil
		};
		if (s.schutz) spiel.modifikatoren = {
			...spiel.modifikatoren ?? {},
			[`schutz:${s.schutz.ereignis}`]: s.schutz.faktor
		};
		const titel = s.vermaechtnis ? `Programm erfüllt: ${e.programm.titel}` : `Schritt erreicht: ${s.titel}`;
		spiel.chronik.push({
			tag: w.day,
			datum: w.date,
			titel,
			ausgang: `${s.text} ${s.ergebnis}.`
		});
		addLog(w, "ereignis", titel, `${s.text} ${s.ergebnis}.`);
		spiel.hinweise.push({
			id: `programm-${s.id}-${w.day}`,
			titel,
			szene: "istanbul",
			text: [s.text, `Wirkung: ${s.ergebnis}.`]
		});
	}
}
/** Rabatt auf die Kapitalkosten einer Maßnahme dieses Themas (0 bis 1). */
function rabattFuer(w, thema) {
	return Math.min(.5, w.spiel?.modifikatoren?.[`rabatt:${thema}`] ?? 0);
}
/** Faktor auf die Stärke eines Ereignisses (1 = keine Veränderung). */
function schutzFuer(w, ereignis) {
	return w.spiel?.modifikatoren?.[`schutz:${ereignis}`] ?? 1;
}
/** Der nächste sinnvolle Schritt: bereit vor offen, Vermächtnis zuletzt; für den Schreibtisch. */
function naechsterSchritt(w) {
	let beste = null;
	for (const p of PROGRAMME) for (const s of p.schritte) {
		const sicht = schrittSicht(w, s);
		if (sicht.status !== "bereit" && sicht.status !== "offen") continue;
		if ((sicht.status === "bereit" ? 0 : 10) + (s.vermaechtnis ? 5 : 0) + (sicht.bedingungen.reduce((m, b) => Math.min(m, b.fortschritt), 1) < .3 ? 3 : 0) - (sicht.bedingungen.reduce((m, b) => Math.min(m, b.fortschritt), 1) >= .6 ? 4 : 0) < (beste ? (beste.status === "bereit" ? 0 : 10) + (beste.schritt.vermaechtnis ? 5 : 0) + (beste.bedingungen.reduce((m, b) => Math.min(m, b.fortschritt), 1) < .3 ? 3 : 0) - (beste.bedingungen.reduce((m, b) => Math.min(m, b.fortschritt), 1) >= .6 ? 4 : 0) : Infinity)) beste = sicht;
	}
	return beste;
}
//#endregion
//#region game/src/sim/regional.ts
const PROVINZEN = [
	{
		"plaka": 1,
		"name": "Adana",
		"bevoelkerung": 2283609,
		"region": "Akdeniz",
		"nuts2": "TR62",
		"bipProKopf": 350981,
		"arbeitslosigkeit": 11.6,
		"arbeitslosigkeitHerkunft": "belegt",
		"sitze": 15,
		"stimmen2023": {
			"AKP": 29.96,
			"CHP": 28.5,
			"MHP": 10.87,
			"İYİ": 10.88,
			"YSP": 9.71
		},
		"buergermeister2024": "CHP",
		"grossstadt": true
	},
	{
		"plaka": 2,
		"name": "Adıyaman",
		"bevoelkerung": 617821,
		"region": "Güneydoğu Anadolu",
		"nuts2": "TRC1",
		"bipProKopf": 327509,
		"arbeitslosigkeit": 9.7,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 5,
		"stimmen2023": {
			"AKP": 52.09,
			"CHP": 18.54,
			"MHP": 4.05,
			"İYİ": 0,
			"YSP": 12.08
		},
		"buergermeister2024": "CHP",
		"grossstadt": false
	},
	{
		"plaka": 3,
		"name": "Afyonkarahisar",
		"bevoelkerung": 751808,
		"region": "Ege",
		"nuts2": "TR33",
		"bipProKopf": 336256,
		"arbeitslosigkeit": 9.6,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 6,
		"stimmen2023": {
			"AKP": 43.68,
			"CHP": 18.43,
			"MHP": 16.05,
			"İYİ": 12.52,
			"YSP": .32
		},
		"buergermeister2024": "CHP",
		"grossstadt": false
	},
	{
		"plaka": 4,
		"name": "Ağrı",
		"bevoelkerung": 491489,
		"region": "Doğu Anadolu",
		"nuts2": "TRA2",
		"bipProKopf": 194660,
		"arbeitslosigkeit": 11.6,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 4,
		"stimmen2023": {
			"AKP": 24.45,
			"CHP": 10.67,
			"MHP": 2.26,
			"İYİ": 1.63,
			"YSP": 55.92
		},
		"buergermeister2024": "DEM",
		"grossstadt": false
	},
	{
		"plaka": 5,
		"name": "Amasya",
		"bevoelkerung": 342242,
		"region": "Karadeniz",
		"nuts2": "TR83",
		"bipProKopf": 346376,
		"arbeitslosigkeit": 9.5,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 3,
		"stimmen2023": {
			"AKP": 38.98,
			"CHP": 29.59,
			"MHP": 16.75,
			"İYİ": 7.18,
			"YSP": .34
		},
		"buergermeister2024": "CHP",
		"grossstadt": false
	},
	{
		"plaka": 6,
		"name": "Ankara",
		"bevoelkerung": 5910320,
		"region": "İç Anadolu",
		"nuts2": "TR51",
		"bipProKopf": 788859,
		"arbeitslosigkeit": 7.1,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 36,
		"stimmen2023": {
			"AKP": 31.75,
			"CHP": 30.55,
			"MHP": 10.1,
			"İYİ": 13.01,
			"YSP": 2.91
		},
		"buergermeister2024": "CHP",
		"grossstadt": true
	},
	{
		"plaka": 7,
		"name": "Antalya",
		"bevoelkerung": 2777677,
		"region": "Akdeniz",
		"nuts2": "TR61",
		"bipProKopf": 561429,
		"arbeitslosigkeit": 5.8,
		"arbeitslosigkeitHerkunft": "belegt",
		"sitze": 17,
		"stimmen2023": {
			"AKP": 28.19,
			"CHP": 32.26,
			"MHP": 9.87,
			"İYİ": 11.45,
			"YSP": 4.72
		},
		"buergermeister2024": "CHP",
		"grossstadt": true
	},
	{
		"plaka": 8,
		"name": "Artvin",
		"bevoelkerung": 167531,
		"region": "Karadeniz",
		"nuts2": "TR90",
		"bipProKopf": 390108,
		"arbeitslosigkeit": 9.1,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 2,
		"stimmen2023": {
			"AKP": 36.57,
			"CHP": 29.75,
			"MHP": 9.52,
			"İYİ": 13.21,
			"YSP": .86
		},
		"buergermeister2024": "CHP",
		"grossstadt": false
	},
	{
		"plaka": 9,
		"name": "Aydın",
		"bevoelkerung": 1172107,
		"region": "Ege",
		"nuts2": "TR32",
		"bipProKopf": 387277,
		"arbeitslosigkeit": 9.1,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 8,
		"stimmen2023": {
			"AKP": 27.83,
			"CHP": 35.51,
			"MHP": 8.46,
			"İYİ": 13.09,
			"YSP": 7.22
		},
		"buergermeister2024": "CHP",
		"grossstadt": true
	},
	{
		"plaka": 10,
		"name": "Balıkesir",
		"bevoelkerung": 1284517,
		"region": "Marmara",
		"nuts2": "TR22",
		"bipProKopf": 459714,
		"arbeitslosigkeit": 8.6,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 9,
		"stimmen2023": {
			"AKP": 33.99,
			"CHP": 31.33,
			"MHP": 8.01,
			"İYİ": 14.78,
			"YSP": 2
		},
		"buergermeister2024": "CHP",
		"grossstadt": true
	},
	{
		"plaka": 11,
		"name": "Bilecik",
		"bevoelkerung": 228995,
		"region": "Marmara",
		"nuts2": "TR41",
		"bipProKopf": 527473,
		"arbeitslosigkeit": 8.2,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 2,
		"stimmen2023": {
			"AKP": 36.72,
			"CHP": 26.55,
			"MHP": 10.18,
			"İYİ": 12.32,
			"YSP": 2.64
		},
		"buergermeister2024": "CHP",
		"grossstadt": false
	},
	{
		"plaka": 12,
		"name": "Bingöl",
		"bevoelkerung": 282299,
		"region": "Doğu Anadolu",
		"nuts2": "TRB1",
		"bipProKopf": 276713,
		"arbeitslosigkeit": 9.6,
		"arbeitslosigkeitHerkunft": "belegt",
		"sitze": 3,
		"stimmen2023": {
			"AKP": 38.26,
			"CHP": 5.16,
			"MHP": 13.41,
			"İYİ": 1.95,
			"YSP": 24.4
		},
		"buergermeister2024": "AKP",
		"grossstadt": false
	},
	{
		"plaka": 13,
		"name": "Bitlis",
		"bevoelkerung": 360423,
		"region": "Doğu Anadolu",
		"nuts2": "TRB2",
		"bipProKopf": 231869,
		"arbeitslosigkeit": 10.9,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 3,
		"stimmen2023": {
			"AKP": 36.81,
			"CHP": 0,
			"MHP": 3.55,
			"İYİ": 13.21,
			"YSP": 40.84
		},
		"buergermeister2024": "AKP",
		"grossstadt": false
	},
	{
		"plaka": 14,
		"name": "Bolu",
		"bevoelkerung": 327173,
		"region": "Karadeniz",
		"nuts2": "TR42",
		"bipProKopf": 548317,
		"arbeitslosigkeit": 8.1,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 3,
		"stimmen2023": {
			"AKP": 36.28,
			"CHP": 21.62,
			"MHP": 23.37,
			"İYİ": 7.49,
			"YSP": .81
		},
		"buergermeister2024": "CHP",
		"grossstadt": false
	},
	{
		"plaka": 15,
		"name": "Burdur",
		"bevoelkerung": 277226,
		"region": "Akdeniz",
		"nuts2": "TR61",
		"bipProKopf": 392276,
		"arbeitslosigkeit": 9.1,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 3,
		"stimmen2023": {
			"AKP": 35.96,
			"CHP": 31.02,
			"MHP": 13.95,
			"İYİ": 11.54,
			"YSP": .62
		},
		"buergermeister2024": "CHP",
		"grossstadt": false
	},
	{
		"plaka": 16,
		"name": "Bursa",
		"bevoelkerung": 3263011,
		"region": "Marmara",
		"nuts2": "TR41",
		"bipProKopf": 492876,
		"arbeitslosigkeit": 8.4,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 20,
		"stimmen2023": {
			"AKP": 38.47,
			"CHP": 24.12,
			"MHP": 8.45,
			"İYİ": 12.04,
			"YSP": 4.28
		},
		"buergermeister2024": "CHP",
		"grossstadt": true
	},
	{
		"plaka": 17,
		"name": "Çanakkale",
		"bevoelkerung": 573976,
		"region": "Marmara",
		"nuts2": "TR22",
		"bipProKopf": 482680,
		"arbeitslosigkeit": 8.4,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 4,
		"stimmen2023": {
			"AKP": 31.42,
			"CHP": 35.28,
			"MHP": 6.42,
			"İYİ": 16.57,
			"YSP": 1.91
		},
		"buergermeister2024": "CHP",
		"grossstadt": false
	},
	{
		"plaka": 18,
		"name": "Çankırı",
		"bevoelkerung": 200549,
		"region": "İç Anadolu",
		"nuts2": "TR82",
		"bipProKopf": 430386,
		"arbeitslosigkeit": 8.8,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 2,
		"stimmen2023": {
			"AKP": 41.69,
			"CHP": 0,
			"MHP": 31.11,
			"İYİ": 18.05,
			"YSP": .3
		},
		"buergermeister2024": "MHP",
		"grossstadt": false
	},
	{
		"plaka": 19,
		"name": "Çorum",
		"bevoelkerung": 519590,
		"region": "Karadeniz",
		"nuts2": "TR83",
		"bipProKopf": 328605,
		"arbeitslosigkeit": 9.6,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 4,
		"stimmen2023": {
			"AKP": 39.59,
			"CHP": 30.99,
			"MHP": 20.15,
			"İYİ": 0,
			"YSP": .4
		},
		"buergermeister2024": "AKP",
		"grossstadt": false
	},
	{
		"plaka": 20,
		"name": "Denizli",
		"bevoelkerung": 1060975,
		"region": "Ege",
		"nuts2": "TR32",
		"bipProKopf": 411046,
		"arbeitslosigkeit": 8.9,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 7,
		"stimmen2023": {
			"AKP": 33.29,
			"CHP": 31.82,
			"MHP": 8.28,
			"İYİ": 14.26,
			"YSP": 2.36
		},
		"buergermeister2024": "CHP",
		"grossstadt": true
	},
	{
		"plaka": 21,
		"name": "Diyarbakır",
		"bevoelkerung": 1852356,
		"region": "Güneydoğu Anadolu",
		"nuts2": "TRC2",
		"bipProKopf": 245024,
		"arbeitslosigkeit": 10.7,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 12,
		"stimmen2023": {
			"AKP": 22.25,
			"CHP": 7.64,
			"MHP": 1.14,
			"İYİ": 2.22,
			"YSP": 62.6
		},
		"buergermeister2024": "DEM",
		"grossstadt": true
	},
	{
		"plaka": 22,
		"name": "Edirne",
		"bevoelkerung": 422438,
		"region": "Marmara",
		"nuts2": "TR21",
		"bipProKopf": 417266,
		"arbeitslosigkeit": 8.9,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 4,
		"stimmen2023": {
			"AKP": 22.83,
			"CHP": 39.36,
			"MHP": 7.49,
			"İYİ": 20.74,
			"YSP": 1.78
		},
		"buergermeister2024": "CHP",
		"grossstadt": false
	},
	{
		"plaka": 23,
		"name": "Elazığ",
		"bevoelkerung": 605678,
		"region": "Doğu Anadolu",
		"nuts2": "TRB1",
		"bipProKopf": 349939,
		"arbeitslosigkeit": 9.4,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 5,
		"stimmen2023": {
			"AKP": 39.79,
			"CHP": 20.52,
			"MHP": 11.35,
			"İYİ": 2.35,
			"YSP": 7.03
		},
		"buergermeister2024": "AKP",
		"grossstadt": false
	},
	{
		"plaka": 24,
		"name": "Erzincan",
		"bevoelkerung": 239625,
		"region": "Doğu Anadolu",
		"nuts2": "TRA1",
		"bipProKopf": 394311,
		"arbeitslosigkeit": 9.9,
		"arbeitslosigkeitHerkunft": "belegt",
		"sitze": 2,
		"stimmen2023": {
			"AKP": 38.04,
			"CHP": 36.31,
			"MHP": 19.71,
			"İYİ": 0,
			"YSP": 1.03
		},
		"buergermeister2024": "MHP",
		"grossstadt": false
	},
	{
		"plaka": 25,
		"name": "Erzurum",
		"bevoelkerung": 736877,
		"region": "Doğu Anadolu",
		"nuts2": "TRA1",
		"bipProKopf": 321146,
		"arbeitslosigkeit": 9.7,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 6,
		"stimmen2023": {
			"AKP": 42.77,
			"CHP": 6.4,
			"MHP": 16.65,
			"İYİ": 9.6,
			"YSP": 9.89
		},
		"buergermeister2024": "AKP",
		"grossstadt": true
	},
	{
		"plaka": 26,
		"name": "Eskişehir",
		"bevoelkerung": 927956,
		"region": "İç Anadolu",
		"nuts2": "TR41",
		"bipProKopf": 530834,
		"arbeitslosigkeit": 8.2,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 6,
		"stimmen2023": {
			"AKP": 32.45,
			"CHP": 34.06,
			"MHP": 7.11,
			"İYİ": 14.02,
			"YSP": 1.96
		},
		"buergermeister2024": "CHP",
		"grossstadt": true
	},
	{
		"plaka": 27,
		"name": "Gaziantep",
		"bevoelkerung": 2222415,
		"region": "Güneydoğu Anadolu",
		"nuts2": "TRC1",
		"bipProKopf": 318204,
		"arbeitslosigkeit": 9.8,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 14,
		"stimmen2023": {
			"AKP": 44.4,
			"CHP": 20.07,
			"MHP": 9.55,
			"İYİ": 5.43,
			"YSP": 9.09
		},
		"buergermeister2024": "AKP",
		"grossstadt": true
	},
	{
		"plaka": 28,
		"name": "Giresun",
		"bevoelkerung": 455074,
		"region": "Karadeniz",
		"nuts2": "TR90",
		"bipProKopf": 307828,
		"arbeitslosigkeit": 9.9,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 4,
		"stimmen2023": {
			"AKP": 42.57,
			"CHP": 20.33,
			"MHP": 15.59,
			"İYİ": 12.87,
			"YSP": .24
		},
		"buergermeister2024": "CHP",
		"grossstadt": false
	},
	{
		"plaka": 29,
		"name": "Gümüşhane",
		"bevoelkerung": 138807,
		"region": "Karadeniz",
		"nuts2": "TR90",
		"bipProKopf": 287458,
		"arbeitslosigkeit": 10.1,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 2,
		"stimmen2023": {
			"AKP": 46.92,
			"CHP": 0,
			"MHP": 26.4,
			"İYİ": 18.67,
			"YSP": .3
		},
		"buergermeister2024": "MHP",
		"grossstadt": false
	},
	{
		"plaka": 30,
		"name": "Hakkari",
		"bevoelkerung": 279681,
		"region": "Doğu Anadolu",
		"nuts2": "TRB2",
		"bipProKopf": 304752,
		"arbeitslosigkeit": 13.8,
		"arbeitslosigkeitHerkunft": "belegt",
		"sitze": 3,
		"stimmen2023": {
			"AKP": 19.57,
			"CHP": 6.67,
			"MHP": 2.68,
			"İYİ": 0,
			"YSP": 64.1
		},
		"buergermeister2024": "DEM",
		"grossstadt": false
	},
	{
		"plaka": 31,
		"name": "Hatay",
		"bevoelkerung": 1577531,
		"region": "Akdeniz",
		"nuts2": "TR63",
		"bipProKopf": 346978,
		"arbeitslosigkeit": 9.7,
		"arbeitslosigkeitHerkunft": "belegt",
		"sitze": 11,
		"stimmen2023": {
			"AKP": 33.14,
			"CHP": 28.33,
			"MHP": 12.09,
			"İYİ": 8.11,
			"YSP": 3.02
		},
		"buergermeister2024": "AKP",
		"grossstadt": true
	},
	{
		"plaka": 32,
		"name": "Isparta",
		"bevoelkerung": 445303,
		"region": "Akdeniz",
		"nuts2": "TR61",
		"bipProKopf": 388226,
		"arbeitslosigkeit": 9.1,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 4,
		"stimmen2023": {
			"AKP": 31.89,
			"CHP": 21.98,
			"MHP": 20.45,
			"İYİ": 16.59,
			"YSP": .69
		},
		"buergermeister2024": "AKP",
		"grossstadt": false
	},
	{
		"plaka": 33,
		"name": "Mersin",
		"bevoelkerung": 1956428,
		"region": "Akdeniz",
		"nuts2": "TR62",
		"bipProKopf": 444761,
		"arbeitslosigkeit": 8.7,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 13,
		"stimmen2023": {
			"AKP": 23.96,
			"CHP": 30.83,
			"MHP": 11.86,
			"İYİ": 11.99,
			"YSP": 13.32
		},
		"buergermeister2024": "CHP",
		"grossstadt": true
	},
	{
		"plaka": 34,
		"name": "İstanbul",
		"bevoelkerung": 15754053,
		"region": "Marmara",
		"nuts2": "TR10",
		"bipProKopf": 802669,
		"arbeitslosigkeit": 7.1,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 98,
		"stimmen2023": {
			"AKP": 35.43,
			"CHP": 28.27,
			"MHP": 6.02,
			"İYİ": 8.15,
			"YSP": 8.11
		},
		"buergermeister2024": "CHP",
		"grossstadt": true
	},
	{
		"plaka": 35,
		"name": "İzmir",
		"bevoelkerung": 4504185,
		"region": "Ege",
		"nuts2": "TR31",
		"bipProKopf": 556376,
		"arbeitslosigkeit": 8,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 28,
		"stimmen2023": {
			"AKP": 24.34,
			"CHP": 41.06,
			"MHP": 5.11,
			"İYİ": 11.53,
			"YSP": 7.45
		},
		"buergermeister2024": "CHP",
		"grossstadt": true
	},
	{
		"plaka": 36,
		"name": "Kars",
		"bevoelkerung": 268991,
		"region": "Doğu Anadolu",
		"nuts2": "TRA2",
		"bipProKopf": 302089,
		"arbeitslosigkeit": 9.9,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 3,
		"stimmen2023": {
			"AKP": 24.81,
			"CHP": 16.07,
			"MHP": 9.56,
			"İYİ": 15.1,
			"YSP": 28.49
		},
		"buergermeister2024": "MHP",
		"grossstadt": false
	},
	{
		"plaka": 37,
		"name": "Kastamonu",
		"bevoelkerung": 379934,
		"region": "Karadeniz",
		"nuts2": "TR82",
		"bipProKopf": 395056,
		"arbeitslosigkeit": 9,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 3,
		"stimmen2023": {
			"AKP": 44.9,
			"CHP": 21.49,
			"MHP": 14.96,
			"İYİ": 7.67,
			"YSP": .22
		},
		"buergermeister2024": "CHP",
		"grossstadt": false
	},
	{
		"plaka": 38,
		"name": "Kayseri",
		"bevoelkerung": 1458991,
		"region": "İç Anadolu",
		"nuts2": "TR72",
		"bipProKopf": 403635,
		"arbeitslosigkeit": 9,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 10,
		"stimmen2023": {
			"AKP": 40.1,
			"CHP": 16.88,
			"MHP": 19.04,
			"İYİ": 10.11,
			"YSP": .83
		},
		"buergermeister2024": "AKP",
		"grossstadt": true
	},
	{
		"plaka": 39,
		"name": "Kırklareli",
		"bevoelkerung": 379595,
		"region": "Marmara",
		"nuts2": "TR21",
		"bipProKopf": 531388,
		"arbeitslosigkeit": 8.2,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 3,
		"stimmen2023": {
			"AKP": 24.42,
			"CHP": 45.6,
			"MHP": 4.62,
			"İYİ": 15.42,
			"YSP": 1.7
		},
		"buergermeister2024": "MHP",
		"grossstadt": false
	},
	{
		"plaka": 40,
		"name": "Kırşehir",
		"bevoelkerung": 242777,
		"region": "İç Anadolu",
		"nuts2": "TR71",
		"bipProKopf": 347041,
		"arbeitslosigkeit": 9.5,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 2,
		"stimmen2023": {
			"AKP": 38.23,
			"CHP": 29.13,
			"MHP": 14.8,
			"İYİ": 7.27,
			"YSP": 2.47
		},
		"buergermeister2024": "CHP",
		"grossstadt": false
	},
	{
		"plaka": 41,
		"name": "Kocaeli",
		"bevoelkerung": 2161171,
		"region": "Marmara",
		"nuts2": "TR42",
		"bipProKopf": 788873,
		"arbeitslosigkeit": 7.1,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 14,
		"stimmen2023": {
			"AKP": 39.11,
			"CHP": 23.72,
			"MHP": 8.25,
			"İYİ": 9.6,
			"YSP": 5.67
		},
		"buergermeister2024": "AKP",
		"grossstadt": true
	},
	{
		"plaka": 42,
		"name": "Konya",
		"bevoelkerung": 2343409,
		"region": "İç Anadolu",
		"nuts2": "TR52",
		"bipProKopf": 388841,
		"arbeitslosigkeit": 9.1,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 15,
		"stimmen2023": {
			"AKP": 47.6,
			"CHP": 13.22,
			"MHP": 14.27,
			"İYİ": 8.76,
			"YSP": 2.55
		},
		"buergermeister2024": "AKP",
		"grossstadt": true
	},
	{
		"plaka": 43,
		"name": "Kütahya",
		"bevoelkerung": 570478,
		"region": "Ege",
		"nuts2": "TR33",
		"bipProKopf": 406533,
		"arbeitslosigkeit": 9,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 5,
		"stimmen2023": {
			"AKP": 46.24,
			"CHP": 16.42,
			"MHP": 12.95,
			"İYİ": 10.61,
			"YSP": .27
		},
		"buergermeister2024": "CHP",
		"grossstadt": false
	},
	{
		"plaka": 44,
		"name": "Malatya",
		"bevoelkerung": 755854,
		"region": "Doğu Anadolu",
		"nuts2": "TRB1",
		"bipProKopf": 365880,
		"arbeitslosigkeit": 9.3,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 6,
		"stimmen2023": {
			"AKP": 44.75,
			"CHP": 21.39,
			"MHP": 12.84,
			"İYİ": 3.92,
			"YSP": 2.98
		},
		"buergermeister2024": "AKP",
		"grossstadt": true
	},
	{
		"plaka": 45,
		"name": "Manisa",
		"bevoelkerung": 1477756,
		"region": "Ege",
		"nuts2": "TR33",
		"bipProKopf": 454705,
		"arbeitslosigkeit": 8.6,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 10,
		"stimmen2023": {
			"AKP": 30.86,
			"CHP": 29.26,
			"MHP": 13.97,
			"İYİ": 11.17,
			"YSP": 5.64
		},
		"buergermeister2024": "CHP",
		"grossstadt": true
	},
	{
		"plaka": 46,
		"name": "Kahramanmaraş",
		"bevoelkerung": 1146278,
		"region": "Akdeniz",
		"nuts2": "TR63",
		"bipProKopf": 342387,
		"arbeitslosigkeit": 9.9,
		"arbeitslosigkeitHerkunft": "belegt",
		"sitze": 8,
		"stimmen2023": {
			"AKP": 47.21,
			"CHP": 15.92,
			"MHP": 16.12,
			"İYİ": 7.11,
			"YSP": 1.16
		},
		"buergermeister2024": "AKP",
		"grossstadt": true
	},
	{
		"plaka": 47,
		"name": "Mardin",
		"bevoelkerung": 903576,
		"region": "Güneydoğu Anadolu",
		"nuts2": "TRC3",
		"bipProKopf": 247416,
		"arbeitslosigkeit": 10.7,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 6,
		"stimmen2023": {
			"AKP": 24.3,
			"CHP": 6.55,
			"MHP": 3.19,
			"İYİ": 1.11,
			"YSP": 56.11
		},
		"buergermeister2024": "DEM",
		"grossstadt": true
	},
	{
		"plaka": 48,
		"name": "Muğla",
		"bevoelkerung": 1099547,
		"region": "Ege",
		"nuts2": "TR32",
		"bipProKopf": 526553,
		"arbeitslosigkeit": 8.2,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 7,
		"stimmen2023": {
			"AKP": 23.6,
			"CHP": 37.62,
			"MHP": 6.03,
			"İYİ": 17.29,
			"YSP": 3.32
		},
		"buergermeister2024": "CHP",
		"grossstadt": true
	},
	{
		"plaka": 49,
		"name": "Muş",
		"bevoelkerung": 389127,
		"region": "Doğu Anadolu",
		"nuts2": "TRB2",
		"bipProKopf": 230300,
		"arbeitslosigkeit": 11.7,
		"arbeitslosigkeitHerkunft": "belegt",
		"sitze": 3,
		"stimmen2023": {
			"AKP": 20.23,
			"CHP": 0,
			"MHP": 16.43,
			"İYİ": 5.59,
			"YSP": 51.53
		},
		"buergermeister2024": "DEM",
		"grossstadt": false
	},
	{
		"plaka": 50,
		"name": "Nevşehir",
		"bevoelkerung": 320150,
		"region": "İç Anadolu",
		"nuts2": "TR71",
		"bipProKopf": 365241,
		"arbeitslosigkeit": 9.3,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 3,
		"stimmen2023": {
			"AKP": 38.88,
			"CHP": 17.13,
			"MHP": 20.37,
			"İYİ": 16.02,
			"YSP": .49
		},
		"buergermeister2024": "İYİ",
		"grossstadt": false
	},
	{
		"plaka": 51,
		"name": "Niğde",
		"bevoelkerung": 374492,
		"region": "İç Anadolu",
		"nuts2": "TR71",
		"bipProKopf": 362804,
		"arbeitslosigkeit": 9.3,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 3,
		"stimmen2023": {
			"AKP": 33.05,
			"CHP": 23.95,
			"MHP": 22.43,
			"İYİ": 12.35,
			"YSP": .45
		},
		"buergermeister2024": "AKP",
		"grossstadt": false
	},
	{
		"plaka": 52,
		"name": "Ordu",
		"bevoelkerung": 768087,
		"region": "Karadeniz",
		"nuts2": "TR90",
		"bipProKopf": 293783,
		"arbeitslosigkeit": 10,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 6,
		"stimmen2023": {
			"AKP": 44.64,
			"CHP": 24.01,
			"MHP": 12.6,
			"İYİ": 9.89,
			"YSP": .2
		},
		"buergermeister2024": "AKP",
		"grossstadt": true
	},
	{
		"plaka": 53,
		"name": "Rize",
		"bevoelkerung": 346947,
		"region": "Karadeniz",
		"nuts2": "TR90",
		"bipProKopf": 355740,
		"arbeitslosigkeit": 9.4,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 3,
		"stimmen2023": {
			"AKP": 53.27,
			"CHP": 21.36,
			"MHP": 12.93,
			"İYİ": 0,
			"YSP": .3
		},
		"buergermeister2024": "AKP",
		"grossstadt": false
	},
	{
		"plaka": 54,
		"name": "Sakarya",
		"bevoelkerung": 1123693,
		"region": "Marmara",
		"nuts2": "TR42",
		"bipProKopf": 479426,
		"arbeitslosigkeit": 8.5,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 8,
		"stimmen2023": {
			"AKP": 46.97,
			"CHP": 15.96,
			"MHP": 11.93,
			"İYİ": 11.04,
			"YSP": 1.46
		},
		"buergermeister2024": "AKP",
		"grossstadt": true
	},
	{
		"plaka": 55,
		"name": "Samsun",
		"bevoelkerung": 1392403,
		"region": "Karadeniz",
		"nuts2": "TR83",
		"bipProKopf": 369415,
		"arbeitslosigkeit": 9.3,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 9,
		"stimmen2023": {
			"AKP": 41.82,
			"CHP": 19.41,
			"MHP": 14.15,
			"İYİ": 12.21,
			"YSP": .28
		},
		"buergermeister2024": "AKP",
		"grossstadt": true
	},
	{
		"plaka": 56,
		"name": "Siirt",
		"bevoelkerung": 332369,
		"region": "Güneydoğu Anadolu",
		"nuts2": "TRC3",
		"bipProKopf": 261810,
		"arbeitslosigkeit": 10.4,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 3,
		"stimmen2023": {
			"AKP": 35.39,
			"CHP": 7.16,
			"MHP": 3.62,
			"İYİ": 1.42,
			"YSP": 47.89
		},
		"buergermeister2024": "DEM",
		"grossstadt": false
	},
	{
		"plaka": 57,
		"name": "Sinop",
		"bevoelkerung": 225848,
		"region": "Karadeniz",
		"nuts2": "TR82",
		"bipProKopf": 321023,
		"arbeitslosigkeit": 9.7,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 2,
		"stimmen2023": {
			"AKP": 42.07,
			"CHP": 25.44,
			"MHP": 8.94,
			"İYİ": 9.49,
			"YSP": .34
		},
		"buergermeister2024": "CHP",
		"grossstadt": false
	},
	{
		"plaka": 58,
		"name": "Sivas",
		"bevoelkerung": 631401,
		"region": "İç Anadolu",
		"nuts2": "TR72",
		"bipProKopf": 351134,
		"arbeitslosigkeit": 9.4,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 5,
		"stimmen2023": {
			"AKP": 39.96,
			"CHP": 15.98,
			"MHP": 18.02,
			"İYİ": 7.32,
			"YSP": .43
		},
		"buergermeister2024": "BBP",
		"grossstadt": false
	},
	{
		"plaka": 59,
		"name": "Tekirdağ",
		"bevoelkerung": 1208441,
		"region": "Marmara",
		"nuts2": "TR21",
		"bipProKopf": 604226,
		"arbeitslosigkeit": 7.8,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 8,
		"stimmen2023": {
			"AKP": 29.99,
			"CHP": 36.26,
			"MHP": 6.24,
			"İYİ": 11.3,
			"YSP": 6.06
		},
		"buergermeister2024": "CHP",
		"grossstadt": true
	},
	{
		"plaka": 60,
		"name": "Tokat",
		"bevoelkerung": 614141,
		"region": "Karadeniz",
		"nuts2": "TR83",
		"bipProKopf": 264527,
		"arbeitslosigkeit": 10.4,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 5,
		"stimmen2023": {
			"AKP": 36.65,
			"CHP": 20.37,
			"MHP": 22.14,
			"İYİ": 11.18,
			"YSP": .31
		},
		"buergermeister2024": "MHP",
		"grossstadt": false
	},
	{
		"plaka": 61,
		"name": "Trabzon",
		"bevoelkerung": 823323,
		"region": "Karadeniz",
		"nuts2": "TR90",
		"bipProKopf": 345969,
		"arbeitslosigkeit": 9.5,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 6,
		"stimmen2023": {
			"AKP": 47.44,
			"CHP": 17.68,
			"MHP": 10.73,
			"İYİ": 12.27,
			"YSP": .3
		},
		"buergermeister2024": "AKP",
		"grossstadt": true
	},
	{
		"plaka": 62,
		"name": "Tunceli",
		"bevoelkerung": 85083,
		"region": "Doğu Anadolu",
		"nuts2": "TRB1",
		"bipProKopf": 478675,
		"arbeitslosigkeit": 8.5,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 1,
		"stimmen2023": {
			"AKP": 12.07,
			"CHP": 32.13,
			"MHP": 5.37,
			"İYİ": 2.2,
			"YSP": 43.87
		},
		"buergermeister2024": "DEM",
		"grossstadt": false
	},
	{
		"plaka": 63,
		"name": "Şanlıurfa",
		"bevoelkerung": 2265800,
		"region": "Güneydoğu Anadolu",
		"nuts2": "TRC2",
		"bipProKopf": 188144,
		"arbeitslosigkeit": 9.8,
		"arbeitslosigkeitHerkunft": "belegt",
		"sitze": 14,
		"stimmen2023": {
			"AKP": 42.49,
			"CHP": 7.46,
			"MHP": 9.27,
			"İYİ": 4.56,
			"YSP": 25.33
		},
		"buergermeister2024": "YRP",
		"grossstadt": true
	},
	{
		"plaka": 64,
		"name": "Uşak",
		"bevoelkerung": 374405,
		"region": "Ege",
		"nuts2": "TR33",
		"bipProKopf": 397680,
		"arbeitslosigkeit": 9,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 3,
		"stimmen2023": {
			"AKP": 35.41,
			"CHP": 28.93,
			"MHP": 9.21,
			"İYİ": 17.71,
			"YSP": 1.3
		},
		"buergermeister2024": "CHP",
		"grossstadt": false
	},
	{
		"plaka": 65,
		"name": "Van",
		"bevoelkerung": 1112013,
		"region": "Doğu Anadolu",
		"nuts2": "TRB2",
		"bipProKopf": 203049,
		"arbeitslosigkeit": 12.7,
		"arbeitslosigkeitHerkunft": "belegt",
		"sitze": 8,
		"stimmen2023": {
			"AKP": 25.04,
			"CHP": 8.21,
			"MHP": 4.82,
			"İYİ": 0,
			"YSP": 54.27
		},
		"buergermeister2024": "DEM",
		"grossstadt": true
	},
	{
		"plaka": 66,
		"name": "Yozgat",
		"bevoelkerung": 413208,
		"region": "İç Anadolu",
		"nuts2": "TR72",
		"bipProKopf": 303087,
		"arbeitslosigkeit": 9.9,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 4,
		"stimmen2023": {
			"AKP": 42.91,
			"CHP": 0,
			"MHP": 23.1,
			"İYİ": 23.39,
			"YSP": .35
		},
		"buergermeister2024": "YRP",
		"grossstadt": false
	},
	{
		"plaka": 67,
		"name": "Zonguldak",
		"bevoelkerung": 585203,
		"region": "Karadeniz",
		"nuts2": "TR81",
		"bipProKopf": 364851,
		"arbeitslosigkeit": 9.3,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 5,
		"stimmen2023": {
			"AKP": 39.57,
			"CHP": 32.03,
			"MHP": 8.27,
			"İYİ": 10.07,
			"YSP": .33
		},
		"buergermeister2024": "CHP",
		"grossstadt": false
	},
	{
		"plaka": 68,
		"name": "Aksaray",
		"bevoelkerung": 441136,
		"region": "İç Anadolu",
		"nuts2": "TR71",
		"bipProKopf": 404383,
		"arbeitslosigkeit": 9,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 4,
		"stimmen2023": {
			"AKP": 43.21,
			"CHP": 0,
			"MHP": 20.91,
			"İYİ": 25.22,
			"YSP": .59
		},
		"buergermeister2024": "AKP",
		"grossstadt": false
	},
	{
		"plaka": 69,
		"name": "Bayburt",
		"bevoelkerung": 82836,
		"region": "Karadeniz",
		"nuts2": "TRA1",
		"bipProKopf": 331432,
		"arbeitslosigkeit": 9.6,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 1,
		"stimmen2023": {
			"AKP": 59.62,
			"CHP": 0,
			"MHP": 16.56,
			"İYİ": 16.27,
			"YSP": .42
		},
		"buergermeister2024": "AKP",
		"grossstadt": false
	},
	{
		"plaka": 70,
		"name": "Karaman",
		"bevoelkerung": 262355,
		"region": "İç Anadolu",
		"nuts2": "TR52",
		"bipProKopf": 471850,
		"arbeitslosigkeit": 8.5,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 3,
		"stimmen2023": {
			"AKP": 40.45,
			"CHP": 18.98,
			"MHP": 18.09,
			"İYİ": 11,
			"YSP": .49
		},
		"buergermeister2024": "MHP",
		"grossstadt": false
	},
	{
		"plaka": 71,
		"name": "Kırıkkale",
		"bevoelkerung": 282830,
		"region": "İç Anadolu",
		"nuts2": "TR71",
		"bipProKopf": 436061,
		"arbeitslosigkeit": 10,
		"arbeitslosigkeitHerkunft": "belegt",
		"sitze": 3,
		"stimmen2023": {
			"AKP": 34.73,
			"CHP": 26.46,
			"MHP": 21.19,
			"İYİ": 10.23,
			"YSP": .3
		},
		"buergermeister2024": "CHP",
		"grossstadt": false
	},
	{
		"plaka": 72,
		"name": "Batman",
		"bevoelkerung": 662626,
		"region": "Güneydoğu Anadolu",
		"nuts2": "TRC3",
		"bipProKopf": 236422,
		"arbeitslosigkeit": 9.9,
		"arbeitslosigkeitHerkunft": "belegt",
		"sitze": 5,
		"stimmen2023": {
			"AKP": 28.38,
			"CHP": 7.91,
			"MHP": 1.13,
			"İYİ": 0,
			"YSP": 59.29
		},
		"buergermeister2024": "DEM",
		"grossstadt": false
	},
	{
		"plaka": 73,
		"name": "Şırnak",
		"bevoelkerung": 573666,
		"region": "Güneydoğu Anadolu",
		"nuts2": "TRC3",
		"bipProKopf": 306150,
		"arbeitslosigkeit": 9.9,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 4,
		"stimmen2023": {
			"AKP": 20.49,
			"CHP": 8.15,
			"MHP": 2.14,
			"İYİ": 1.07,
			"YSP": 64.43
		},
		"buergermeister2024": "AKP",
		"grossstadt": false
	},
	{
		"plaka": 74,
		"name": "Bartın",
		"bevoelkerung": 206663,
		"region": "Karadeniz",
		"nuts2": "TR81",
		"bipProKopf": 318484,
		"arbeitslosigkeit": 9.8,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 2,
		"stimmen2023": {
			"AKP": 36.04,
			"CHP": 31.65,
			"MHP": 23.49,
			"İYİ": 0,
			"YSP": .32
		},
		"buergermeister2024": "CHP",
		"grossstadt": false
	},
	{
		"plaka": 75,
		"name": "Ardahan",
		"bevoelkerung": 90392,
		"region": "Doğu Anadolu",
		"nuts2": "TRA2",
		"bipProKopf": 385104,
		"arbeitslosigkeit": 4,
		"arbeitslosigkeitHerkunft": "belegt",
		"sitze": 2,
		"stimmen2023": {
			"AKP": 34.38,
			"CHP": 29.62,
			"MHP": 2.96,
			"İYİ": 4.86,
			"YSP": 21.75
		},
		"buergermeister2024": "CHP",
		"grossstadt": false
	},
	{
		"plaka": 76,
		"name": "Iğdır",
		"bevoelkerung": 205071,
		"region": "Doğu Anadolu",
		"nuts2": "TRA2",
		"bipProKopf": 264690,
		"arbeitslosigkeit": 9.8,
		"arbeitslosigkeitHerkunft": "belegt",
		"sitze": 2,
		"stimmen2023": {
			"AKP": 34.68,
			"CHP": 5.91,
			"MHP": 4.51,
			"İYİ": 6.6,
			"YSP": 44.66
		},
		"buergermeister2024": "DEM",
		"grossstadt": false
	},
	{
		"plaka": 77,
		"name": "Yalova",
		"bevoelkerung": 311635,
		"region": "Marmara",
		"nuts2": "TR42",
		"bipProKopf": 501231,
		"arbeitslosigkeit": 11.8,
		"arbeitslosigkeitHerkunft": "belegt",
		"sitze": 3,
		"stimmen2023": {
			"AKP": 33.54,
			"CHP": 28.62,
			"MHP": 11.26,
			"İYİ": 9.63,
			"YSP": 5.62
		},
		"buergermeister2024": "CHP",
		"grossstadt": false
	},
	{
		"plaka": 78,
		"name": "Karabük",
		"bevoelkerung": 249614,
		"region": "Karadeniz",
		"nuts2": "TR81",
		"bipProKopf": 369785,
		"arbeitslosigkeit": 11.3,
		"arbeitslosigkeitHerkunft": "belegt",
		"sitze": 3,
		"stimmen2023": {
			"AKP": 37,
			"CHP": 21.69,
			"MHP": 15.91,
			"İYİ": 9.76,
			"YSP": .4
		},
		"buergermeister2024": "AKP",
		"grossstadt": false
	},
	{
		"plaka": 79,
		"name": "Kilis",
		"bevoelkerung": 157363,
		"region": "Güneydoğu Anadolu",
		"nuts2": "TRC1",
		"bipProKopf": 253567,
		"arbeitslosigkeit": 10.6,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 2,
		"stimmen2023": {
			"AKP": 38.92,
			"CHP": 19.93,
			"MHP": 26.89,
			"İYİ": 5.78,
			"YSP": .86
		},
		"buergermeister2024": "CHP",
		"grossstadt": false
	},
	{
		"plaka": 80,
		"name": "Osmaniye",
		"bevoelkerung": 564123,
		"region": "Akdeniz",
		"nuts2": "TR63",
		"bipProKopf": 316158,
		"arbeitslosigkeit": 11.6,
		"arbeitslosigkeitHerkunft": "belegt",
		"sitze": 4,
		"stimmen2023": {
			"AKP": 32.31,
			"CHP": 16.96,
			"MHP": 28.6,
			"İYİ": 12.75,
			"YSP": 2
		},
		"buergermeister2024": "MHP",
		"grossstadt": false
	},
	{
		"plaka": 81,
		"name": "Düzce",
		"bevoelkerung": 415622,
		"region": "Karadeniz",
		"nuts2": "TR42",
		"bipProKopf": 450404,
		"arbeitslosigkeit": 8.6,
		"arbeitslosigkeitHerkunft": "geschaetzt",
		"sitze": 3,
		"stimmen2023": {
			"AKP": 49.26,
			"CHP": 22.58,
			"MHP": 16.14,
			"İYİ": 0,
			"YSP": .96
		},
		"buergermeister2024": "AKP",
		"grossstadt": false
	}
].sort((a, b) => a.plaka - b.plaka);
const totalPop = PROVINZEN.reduce((s, p) => s + p.bevoelkerung, 0);
/** Bevölkerungsanteil je Provinz, Index = Kfz-Kennziffer − 1. */
const WEIGHTS = PROVINZEN.map((p) => p.bevoelkerung / totalPop);
const avgGdp = PROVINZEN.reduce((s, p) => s + p.bevoelkerung * p.bipProKopf, 0) / totalPop;
const avgUnemployment = PROVINZEN.reduce((s, p) => s + p.bevoelkerung * p.arbeitslosigkeit, 0) / totalPop;
/** Grobe Einordnung der Provinzen an großen Bruchzonen (Nordanatolische, Ostanatolische Verwerfung, Ägäis). */
const SEISMIC = /* @__PURE__ */ new Set([
	2,
	9,
	10,
	12,
	14,
	16,
	20,
	23,
	24,
	31,
	34,
	35,
	41,
	44,
	45,
	46,
	48,
	54,
	65,
	77,
	81
]);
/** Grenzprovinzen zu Syrien mit vielen Geflüchteten. */
const BORDER = /* @__PURE__ */ new Set([
	27,
	31,
	47,
	63,
	79
]);
const WATER = {
	"Güneydoğu Anadolu": .8,
	"İç Anadolu": .85,
	Akdeniz: .95,
	Ege: .95,
	Marmara: 1,
	"Doğu Anadolu": 1.05,
	Karadeniz: 1.2
};
function perProvince(f) {
	return PROVINZEN.map((p) => f(p, p.bipProKopf / avgGdp));
}
const cityFactor = (p, big, mid, small) => p.bevoelkerung > 4e6 ? big : p.bevoelkerung > 2e6 ? mid : small;
const REGIONAL = {
	arbeitslosigkeit: perProvince((p) => p.arbeitslosigkeit / avgUnemployment),
	armut: perProvince((_, r) => r ** -.5),
	p_armut: perProvince((_, r) => r ** -.5),
	realeinkommen: perProvince((_, r) => r ** .3),
	schulabbruch: perProvince((_, r) => r ** -.4),
	jugendarbeitslosigkeit: perProvince((p) => p.arbeitslosigkeit / avgUnemployment),
	p_jugendarbeitslosigkeit: perProvince((p) => p.arbeitslosigkeit / avgUnemployment),
	bildungsqualitaet: perProvince((_, r) => r ** .2),
	hochschule: perProvince((_, r) => r ** .2),
	gesundheitsversorgung: perProvince((_, r) => r ** .2),
	aerzte: perProvince((_, r) => r ** .3),
	p_aerztemangel: perProvince((_, r) => r ** -.3),
	internet: perProvince((_, r) => r ** .25),
	wachstum_regional: perProvince((_, r) => r ** .3),
	landwirtschaft_einkommen: perProvince((_, r) => r ** .2),
	landflucht: perProvince((p, r) => r ** -.4 * cityFactor(p, .6, .8, 1)),
	p_landflucht: perProvince((p, r) => r ** -.4 * cityFactor(p, .6, .8, 1)),
	mieten: perProvince((p) => cityFactor(p, 1.25, 1.1, .85)),
	p_wohnungsnot: perProvince((p) => cityFactor(p, 1.25, 1.1, .85)),
	stau: perProvince((p) => cityFactor(p, 1.3, 1.1, .8)),
	luftqualitaet: perProvince((p) => cityFactor(p, .8, .9, 1.05)),
	p_luftverschmutzung: perProvince((p) => cityFactor(p, 1.3, 1.1, .9)),
	wasserversorgung: perProvince((p) => WATER[p.region] ?? 1),
	duerre: perProvince((p) => 1 / (WATER[p.region] ?? 1)),
	p_wassermangel: perProvince((p) => (1 / (WATER[p.region] ?? 1)) ** 2),
	p_erdbebengefahr: perProvince((p) => SEISMIC.has(p.plaka) ? 1.15 : .85),
	erdbebenvorsorge: perProvince((p) => SEISMIC.has(p.plaka) ? .95 : 1.05),
	gefluechtete: perProvince((p) => BORDER.has(p.plaka) ? 1.5 : p.plaka === 34 ? 1.2 : .85),
	p_migrationsdruck: perProvince((p) => BORDER.has(p.plaka) ? 1.2 : p.plaka === 34 ? 1.1 : .9)
};
//#endregion
//#region game/src/sim/ereignis-hilfen.ts
const nf$4 = (x, d = 1) => x.toLocaleString("de-DE", {
	minimumFractionDigits: d,
	maximumFractionDigits: d
});
const monatVon = (w) => Number(w.date.slice(5, 7));
const sommer = (w) => monatVon(w) >= 6 && monatVon(w) <= 9;
function namen(provinzen) {
	const n = provinzen.map((p) => PROVINZEN[p - 1]?.name ?? String(p));
	if (n.length === 1) return n[0];
	return `${n.slice(0, -1).join(", ")} und ${n[n.length - 1]}`;
}
function einwohner(provinzen) {
	return provinzen.reduce((s, p) => s + (PROVINZEN[p - 1]?.bevoelkerung ?? 0), 0);
}
function ziehe(rng, gewicht, n) {
	const g = Array.from({ length: 81 }, (_, p) => Math.max(0, gewicht(p + 1)));
	const out = [];
	for (let k = 0; k < n; k++) {
		const summe = g.reduce((a, b) => a + b, 0);
		if (summe <= 0) break;
		let r = rng.next() * summe;
		for (let p = 0; p < 81; p++) {
			r -= g[p];
			if (r <= 0) {
				out.push(p + 1);
				g[p] = 0;
				break;
			}
		}
	}
	return out;
}
const akutIn = (w, id) => {
	const i = NET.index.get(id);
	const node = i === void 0 ? void 0 : NET.nodes[i];
	if (i === void 0 || !node?.threshold) return [];
	const out = [];
	for (let p = 0; p < 81; p++) if (w.net.values[i * 81 + p] >= node.threshold) out.push(p + 1);
	return out;
};
/** Einmalige Kosten in % des BIP: erhöhen die Schulden und stützen kurz die Nachfrage. */
function kosten(w, prozentBip) {
	w.economy.debtRatio += prozentBip;
	w.economy.outputGap += .08 * prozentBip;
}
const dk = (ev, k) => Number(ev.daten?.[k] ?? 0);
function opt(id, label, beschreibung, pk, wirkung) {
	return {
		id,
		label,
		beschreibung,
		pk,
		wirkung
	};
}
const PROZ_STADT = /* @__PURE__ */ new Set([
	34,
	6,
	35,
	16,
	1,
	27,
	42,
	7,
	33,
	21
]);
const jahrVon = (w) => Number(w.date.slice(0, 4));
/** Landesdurchschnitt eines Knotens. */
const netz$1 = (w, id) => nationalAverage(NET, w.net, id);
/** Preisangabe einer Antwort in Worten: „Kostet 3 Kapital und 0,2 % des BIP; …“ */
function beschr(pk, bipProzent, folge) {
	const teile = [];
	if (pk > 0) teile.push(`${pk} Kapital`);
	if (bipProzent > 0) teile.push(`${nf$4(bipProzent, bipProzent < .1 ? 2 : 1)} % des BIP`);
	return `${teile.length ? `Kostet ${teile.join(" und ")}` : bipProzent < 0 ? `Bringt ${nf$4(-bipProzent, 2)} % des BIP` : "Kostet nichts"}; ${folge}`;
}
/** Eine Zusage, die später fällig wird und dann als Ereignis eingefordert wird. */
function zusageAnlegen(w, z) {
	w.spiel?.zusagen.push({
		id: `z-${z.von}-${w.day}-${w.spiel.zusagen.length}`,
		von: z.von,
		text: z.text,
		faellig: w.day + z.tage,
		...z.massnahme ? {
			massnahme: z.massnahme,
			richtung: 1
		} : {},
		erfuellt: false,
		gebrochen: false
	});
}
//#endregion
//#region game/src/sim/laender.ts
const A = (id, titel, text, bedingung) => ({
	id,
	titel,
	text,
	bedingung
});
const LAENDER = [
	{
		id: "USA",
		dat: "den Vereinigten Staaten",
		akk: "die Vereinigten Staaten",
		name: "Vereinigte Staaten",
		kurz: "US",
		gruppe: "Große Mächte",
		iso: "USA",
		wdi: "USA",
		knoten: "beziehungen_usa",
		anteil: 1,
		text: "NATO-Verbündeter mit Stützpunkt in Incirlik und wichtigster Rüstungslieferant, zugleich im Streit um das russische Luftabwehrsystem S-400 und den Ausschluss der Türkei vom F-35-Programm.",
		start: {
			handel: 70,
			sicherheit: 65,
			vertrauen: 45,
			konflikt: 55
		},
		anliegen: [A("usa-nato", "Ein fairer Anteil in der NATO", "Washington erwartet, dass die Türkei ihren Beitrag zur Verteidigung leistet.", {
			art: "massnahme",
			id: "m_verteidigung",
			min: 55
		}), A("usa-grenze", "Sichere Südgrenze", "Kontrolle über die Grenze zu Syrien und den Kampf gegen Terrornetzwerke.", {
			art: "massnahme",
			id: "m_grenzschutz",
			min: 60
		})],
		aktionen: [
			"gipfel",
			"handel",
			"ruestung",
			"druck",
			"entspannen"
		]
	},
	{
		id: "EU",
		dat: "der Europäischen Union",
		akk: "die Europäische Union",
		name: "Europäische Union",
		kurz: "EU",
		gruppe: "Große Mächte",
		iso: "DEU",
		wdi: "DEU",
		knoten: "beziehungen_eu",
		anteil: 1,
		text: "Größter Handelspartner und Zollunionspartner der Türkei; die Beitrittsgespräche liegen seit Jahren auf Eis. Brüssel verlangt Fortschritte bei Rechtsstaat und Grundrechten, Ankara Visafreiheit und eine modernisierte Zollunion.",
		start: {
			handel: 90,
			sicherheit: 55,
			vertrauen: 40,
			konflikt: 45
		},
		anliegen: [
			A("eu-recht", "Unabhängige Justiz", "Ein Richterrat, der nicht der Regierung untersteht, ist die Vorbedingung für alles Weitere.", {
				art: "massnahme",
				id: "m_justizreform",
				min: 55
			}),
			A("eu-medien", "Freie Medien", "Die Medienaufsicht soll nur bei Straftaten eingreifen.", {
				art: "massnahme-max",
				id: "m_medienaufsicht",
				max: 50
			}),
			A("eu-annaeherung", "Ernsthafte Annäherung", "Reformen für Visafreiheit und eine modernisierte Zollunion.", {
				art: "massnahme",
				id: "m_eu_annaeherung",
				min: 55
			})
		],
		aktionen: [
			"gipfel",
			"handel",
			"druck",
			"entspannen"
		]
	},
	{
		id: "RUS",
		dat: "Russland",
		akk: "Russland",
		name: "Russland",
		kurz: "RU",
		gruppe: "Große Mächte",
		iso: "RUS",
		wdi: "RUS",
		knoten: "beziehungen_russland",
		anteil: 1,
		text: "Wichtiger Lieferant von Erdgas, Bauherr des ersten Kernkraftwerks Akkuyu und größter Touristenlieferant; zugleich Gegenspieler in Syrien, im Schwarzen Meer und im Krieg gegen die Ukraine, den Ankara zu vermitteln versucht.",
		start: {
			handel: 75,
			sicherheit: 40,
			vertrauen: 45,
			konflikt: 50
		},
		anliegen: [A("rus-akkuyu", "Akkuyu vollenden", "Das Kernkraftwerk soll ans Netz gehen und weitere Vorhaben folgen.", {
			art: "massnahme",
			id: "m_kernkraft",
			min: 50
		}), A("rus-handel", "Offene Märkte", "Handel und Tourismus ohne neue Hürden, vor allem keine höheren Zölle.", {
			art: "massnahme-max",
			id: "m_zoelle",
			max: 45
		})],
		aktionen: [
			"gipfel",
			"handel",
			"ruestung",
			"druck",
			"entspannen"
		]
	},
	{
		id: "GRC",
		dat: "Griechenland",
		akk: "Griechenland",
		name: "Griechenland",
		kurz: "GR",
		gruppe: "Nachbarn",
		iso: "GRC",
		wdi: "GRC",
		knoten: "beziehungen_eu",
		anteil: .4,
		text: "NATO-Verbündeter und Nachbar in der Ägäis; Streit um Seegrenzen, Luftraum, Inselstatus und Zypern, dazu Migration über die Ägäis. Zwischen den Krisen bestehen Deeskalationskanäle.",
		start: {
			handel: 40,
			sicherheit: 30,
			vertrauen: 30,
			konflikt: 65
		},
		anliegen: [A("grc-aegaeis", "Ruhe in der Ägäis", "Keine Provokationen zu Wasser und in der Luft; Gespräche über die Seegrenzen.", {
			art: "land",
			dim: "konflikt",
			max: 50
		}), A("grc-migration", "Kontrollierte Migration", "Die Türkei soll den Weg über die Ägäis besser sichern.", {
			art: "massnahme",
			id: "m_grenzschutz",
			min: 60
		})],
		aktionen: [
			"gipfel",
			"druck",
			"entspannen"
		]
	},
	{
		id: "IRN",
		dat: "dem Iran",
		akk: "den Iran",
		name: "Iran",
		kurz: "IR",
		gruppe: "Nachbarn",
		iso: "IRN",
		wdi: "IRN",
		knoten: "beziehungen_nahost",
		anteil: .3,
		text: "Große Nachbarmacht im Osten: Handelspartner und Gaslieferant, Konkurrent um Einfluss im Irak und in Syrien, mit gemeinsamen Interessen gegen kurdische Aufstände.",
		start: {
			handel: 55,
			sicherheit: 40,
			vertrauen: 40,
			konflikt: 45
		},
		anliegen: [A("irn-handel", "Handel trotz Sanktionen", "Teheran will, dass Ankara den Handel nicht den Sanktionen opfert.", {
			art: "land",
			dim: "handel",
			min: 55
		}), A("irn-gas", "Gas und Wasser", "Verlässliche Lieferungen und ein sachlicher Umgang mit Grenzflüssen.", {
			art: "land",
			dim: "vertrauen",
			min: 45
		})],
		aktionen: [
			"gipfel",
			"handel",
			"druck",
			"entspannen"
		]
	},
	{
		id: "SYR",
		dat: "Syrien",
		akk: "Syrien",
		name: "Syrien",
		kurz: "SY",
		gruppe: "Nachbarn",
		iso: "SYR",
		wdi: "SYR",
		knoten: "beziehungen_nahost",
		anteil: .3,
		text: "Nachbar im Süden nach Jahren des Krieges: Sicherheitsfragen an der Grenze, Millionen Geflüchtete in der Türkei, Einfluss im Norden des Landes und die Frage der Rückkehr.",
		start: {
			handel: 35,
			sicherheit: 20,
			vertrauen: 25,
			konflikt: 75
		},
		anliegen: [A("syr-rueckkehr", "Rückkehr ermöglichen", "Ein Programm für die Rückkehr von Geflüchteten mit Wiederaufbauhilfe.", {
			art: "massnahme",
			id: "m_rueckkehr",
			min: 55
		}), A("syr-grenze", "Ruhe an der Grenze", "Keine Eskalation im Grenzgebiet.", {
			art: "land",
			dim: "konflikt",
			max: 60
		})],
		aktionen: [
			"gipfel",
			"hilfe",
			"druck",
			"entspannen"
		]
	},
	{
		id: "IRQ",
		dat: "dem Irak",
		akk: "den Irak",
		name: "Irak",
		kurz: "IQ",
		gruppe: "Nachbarn",
		iso: "IRQ",
		wdi: "IRQ",
		knoten: "beziehungen_nahost",
		anteil: .3,
		text: "Nachbar im Südosten: Öl-Pipeline nach Ceyhan, Streit um das Wasser von Euphrat und Tigris, türkische Militäreinsätze im Norden gegen die PKK und ein wichtiger Markt für Bauunternehmen.",
		start: {
			handel: 60,
			sicherheit: 35,
			vertrauen: 40,
			konflikt: 55
		},
		anliegen: [A("irq-wasser", "Mehr Wasser flussabwärts", "Bagdad verlangt Abflussmengen aus den türkischen Staudämmen.", {
			art: "land",
			dim: "vertrauen",
			min: 45
		}), A("irq-souveraenitaet", "Achtung der Grenzen", "Weniger Militäreinsätze auf irakischem Gebiet.", {
			art: "land",
			dim: "konflikt",
			max: 50
		})],
		aktionen: [
			"gipfel",
			"handel",
			"hilfe",
			"entspannen"
		]
	},
	{
		id: "AZE",
		dat: "Aserbaidschan",
		akk: "Aserbaidschan",
		name: "Aserbaidschan",
		kurz: "AZ",
		gruppe: "Verbündete und Partner",
		iso: "AZE",
		wdi: "AZE",
		knoten: "beziehungen_nahost",
		anteil: .2,
		text: "Engster Partner im Kaukasus, „eine Nation, zwei Staaten“: Gas über die Pipelines TANAP und TAP, Rüstungszusammenarbeit und ein Korridor nach Zentralasien.",
		start: {
			handel: 75,
			sicherheit: 85,
			vertrauen: 85,
			konflikt: 15
		},
		anliegen: [A("aze-korridor", "Der Korridor nach Osten", "Verkehrswege und Bahn nach Zentralasien.", {
			art: "massnahme",
			id: "m_bahn",
			min: 50
		}), A("aze-gas", "Gasabnahme", "Verlässliche Abnahme aserbaidschanischen Gases.", {
			art: "land",
			dim: "handel",
			min: 70
		})],
		aktionen: [
			"gipfel",
			"handel",
			"ruestung",
			"hilfe"
		]
	},
	{
		id: "ARM",
		dat: "Armenien",
		akk: "Armenien",
		name: "Armenien",
		kurz: "AM",
		gruppe: "Nachbarn",
		iso: "ARM",
		wdi: "ARM",
		knoten: "ansehen",
		anteil: .2,
		text: "Nachbar im Osten, dessen Grenze zur Türkei seit Langem geschlossen ist; Normalisierungsgespräche laufen, belastet vom Karabach-Konflikt und dem Streit um die Bewertung von 1915.",
		start: {
			handel: 20,
			sicherheit: 25,
			vertrauen: 30,
			konflikt: 55
		},
		anliegen: [A("arm-grenze", "Die Grenze öffnen", "Diplomatische Beziehungen und ein offener Übergang.", {
			art: "land",
			dim: "vertrauen",
			min: 45
		}), A("arm-frieden", "Frieden im Kaukasus", "Keine einseitige Parteinahme im Streit mit Aserbaidschan.", {
			art: "land",
			dim: "konflikt",
			max: 45
		})],
		aktionen: [
			"gipfel",
			"entspannen",
			"hilfe"
		]
	},
	{
		id: "SAU",
		dat: "Saudi-Arabien und den Golfstaaten",
		akk: "Saudi-Arabien und die Golfstaaten",
		name: "Saudi-Arabien und Golfstaaten",
		kurz: "GO",
		gruppe: "Verbündete und Partner",
		iso: "SAU",
		wdi: "SAU",
		knoten: "beziehungen_nahost",
		anteil: .5,
		text: "Wichtige Geldgeber und Investoren: nach Jahren der Spannung (Katar-Blockade, Khashoggi) wieder eng, mit Krediten, Einlagen und Bauaufträgen.",
		start: {
			handel: 55,
			sicherheit: 50,
			vertrauen: 55,
			konflikt: 30
		},
		anliegen: [A("sau-invest", "Ein verlässliches Investitionsklima", "Rechtssicherheit für Geld aus dem Golf.", {
			art: "massnahme",
			id: "m_justizreform",
			min: 45
		}), A("sau-partner", "Partnerschaft statt Konkurrenz", "Abstimmung in der Region.", {
			art: "land",
			dim: "vertrauen",
			min: 60
		})],
		aktionen: [
			"gipfel",
			"handel",
			"ruestung",
			"hilfe"
		]
	},
	{
		id: "ISR",
		dat: "Israel",
		akk: "Israel",
		name: "Israel",
		kurz: "IL",
		gruppe: "Nachbarn",
		iso: "ISR",
		wdi: "ISR",
		knoten: "beziehungen_nahost",
		anteil: .3,
		text: "Handelspartner mit belasteten politischen Beziehungen: Der Krieg in Gaza, die Frage der Palästinenser und Streit um Einfluss in der Region bestimmen den Ton.",
		start: {
			handel: 50,
			sicherheit: 25,
			vertrauen: 30,
			konflikt: 60
		},
		anliegen: [A("isr-handel", "Wirtschaft von Politik trennen", "Handel und Energie sollen vom politischen Streit unberührt bleiben.", {
			art: "land",
			dim: "handel",
			min: 50
		}), A("isr-ruhe", "Weniger Schärfe", "Ein gemäßigterer Ton.", {
			art: "land",
			dim: "konflikt",
			max: 55
		})],
		aktionen: [
			"gipfel",
			"handel",
			"druck",
			"entspannen"
		]
	},
	{
		id: "CHN",
		dat: "China",
		akk: "China",
		name: "China",
		kurz: "CN",
		gruppe: "Große Mächte",
		iso: "CHN",
		wdi: "CHN",
		knoten: "ansehen",
		anteil: .3,
		text: "Wichtiger Lieferant von Vorprodukten und Investor („Neue Seidenstraße“, Mittlerer Korridor); die Handelsbilanz ist stark einseitig, und die Lage der Uiguren belastet das Verhältnis.",
		start: {
			handel: 75,
			sicherheit: 30,
			vertrauen: 45,
			konflikt: 30
		},
		anliegen: [A("chn-invest", "Offene Türen für Investitionen", "Chinesische Firmen in Infrastruktur und Industrie.", {
			art: "massnahme",
			id: "m_investitionsanreize",
			min: 45
		}), A("chn-korridor", "Der Mittlere Korridor", "Bahn und Häfen als Landbrücke.", {
			art: "massnahme",
			id: "m_bahn",
			min: 50
		})],
		aktionen: [
			"gipfel",
			"handel",
			"druck"
		]
	},
	{
		id: "UKR",
		dat: "der Ukraine",
		akk: "die Ukraine",
		name: "Ukraine",
		kurz: "UA",
		gruppe: "Nachbarn",
		iso: "UKR",
		wdi: "UKR",
		knoten: "ansehen",
		anteil: .25,
		text: "Nachbar über das Schwarze Meer, seit dem russischen Angriff im Krieg: Ankara liefert Drohnen, hält die Meerengen und vermittelte das Getreideabkommen, pflegt aber zugleich enge Beziehungen zu Moskau und sanktioniert es nicht.",
		start: {
			handel: 55,
			sicherheit: 60,
			vertrauen: 60,
			konflikt: 15
		},
		anliegen: [A("ukr-meerengen", "Die Meerengen geschlossen halten", "Keine Kriegsschiffe durch Bosporus und Dardanellen, wie der Vertrag von Montreux es erlaubt.", {
			art: "massnahme",
			id: "m_verteidigung",
			min: 50
		}), A("ukr-vermittlung", "Ein ehrlicher Vermittler", "Ankara soll sich nicht auf die Seite Moskaus schlagen.", {
			art: "land",
			dim: "vertrauen",
			min: 55
		})],
		aktionen: [
			"gipfel",
			"handel",
			"ruestung",
			"hilfe"
		]
	},
	{
		id: "GEO",
		dat: "Georgien",
		akk: "Georgien",
		name: "Georgien",
		kurz: "GE",
		gruppe: "Nachbarn",
		iso: "GEO",
		wdi: "GEO",
		knoten: "ansehen",
		anteil: .15,
		text: "Kleiner Nachbar im Nordosten: Transitland für Erdgas und Öl (Baku-Tiflis-Ceyhan), Bahnstrecke nach Baku, mit russischen Truppen in Abchasien und Südossetien und einem Streit über den Weg nach Westen.",
		start: {
			handel: 65,
			sicherheit: 60,
			vertrauen: 65,
			konflikt: 20
		},
		anliegen: [A("geo-transit", "Verlässlicher Transit", "Pipelines und die Bahn nach Baku bleiben offen und werden ausgebaut.", {
			art: "massnahme",
			id: "m_bahn",
			min: 50
		}), A("geo-westen", "Rückhalt auf dem Weg nach Westen", "Georgien will Unterstützung, nicht Belehrung.", {
			art: "land",
			dim: "vertrauen",
			min: 60
		})],
		aktionen: [
			"gipfel",
			"handel",
			"hilfe"
		]
	},
	{
		id: "EGY",
		dat: "Ägypten",
		akk: "Ägypten",
		name: "Ägypten",
		kurz: "EG",
		gruppe: "Verbündete und Partner",
		iso: "EGY",
		wdi: "EGY",
		knoten: "beziehungen_nahost",
		anteil: .25,
		text: "Große arabische Macht am südöstlichen Mittelmeer: nach Jahren der Entfremdung (Sturz der Muslimbrüder 2013) im Gespräch über Normalisierung, im Streit um Seegrenzen und Gasfelder, im Wettbewerb um Einfluss in Libyen und Gaza.",
		start: {
			handel: 55,
			sicherheit: 35,
			vertrauen: 40,
			konflikt: 45
		},
		anliegen: [A("egy-gas", "Ein Ausgleich im Mittelmeer", "Seegrenzen und Gasfelder ohne Konfrontation.", {
			art: "land",
			dim: "konflikt",
			max: 40
		}), A("egy-libyen", "Gemeinsame Linie in Libyen", "Abstimmung statt Stellvertreterkonkurrenz.", {
			art: "land",
			dim: "vertrauen",
			min: 50
		})],
		aktionen: [
			"gipfel",
			"handel",
			"entspannen",
			"druck"
		]
	},
	{
		id: "LBY",
		dat: "Libyen",
		akk: "Libyen",
		name: "Libyen",
		kurz: "LY",
		gruppe: "Verbündete und Partner",
		iso: "LBY",
		knoten: "beziehungen_nahost",
		anteil: .15,
		text: "Seit 2011 ein geteiltes Land: Ankara stützt die Regierung in Tripolis mit Ausbildern und Drohnen und schloss 2019 ein Memorandum über Seegrenzen im östlichen Mittelmeer, das Griechenland, Ägypten und Zypern ablehnen.",
		start: {
			handel: 45,
			sicherheit: 55,
			vertrauen: 55,
			konflikt: 35
		},
		anliegen: [A("lby-seegrenze", "Das Seegrenz-Memorandum halten", "Tripolis will, dass Ankara zu dem Abkommen von 2019 steht.", {
			art: "land",
			dim: "vertrauen",
			min: 50
		}), A("lby-truppen", "Ausbildung und Drohnen", "Militärische Hilfe für die Streitkräfte in Tripolis.", {
			art: "land",
			dim: "sicherheit",
			min: 50
		})],
		aktionen: [
			"gipfel",
			"handel",
			"ruestung",
			"hilfe"
		]
	},
	{
		id: "KAZ",
		dat: "Kasachstan",
		akk: "Kasachstan",
		name: "Kasachstan",
		kurz: "KZ",
		gruppe: "Verbündete und Partner",
		iso: "KAZ",
		knoten: "ansehen",
		anteil: .1,
		text: "Größter Staat Zentralasiens und Mitglied der Organisation der Turkstaaten: Transitland am Mittleren Korridor zwischen China und Europa, Öl- und Gasexporteur, mit türkischen Bauunternehmen im Land; zugleich eng an Moskau und Peking gebunden.",
		start: {
			handel: 55,
			sicherheit: 40,
			vertrauen: 65,
			konflikt: 10
		},
		anliegen: [A("kaz-korridor", "Der Mittlere Korridor", "Bahn und Häfen als Landbrücke nach Europa, an Russland vorbei.", {
			art: "massnahme",
			id: "m_bahn",
			min: 50
		}), A("kaz-partner", "Partnerschaft unter Turkstaaten", "Verlässliche Abstimmung im Kreis der Turkstaaten.", {
			art: "land",
			dim: "vertrauen",
			min: 55
		})],
		aktionen: [
			"gipfel",
			"handel",
			"hilfe"
		]
	},
	{
		id: "CYP",
		dat: "Zypern",
		akk: "Zypern",
		name: "Zypern",
		kurz: "CY",
		gruppe: "Nachbarn",
		iso: "CYP",
		knoten: "beziehungen_eu",
		anteil: .2,
		text: "EU-Mitglied und geteilte Insel: Im Norden besteht die nur von der Türkei anerkannte Türkische Republik Nordzypern. Strittig sind Seegrenzen und Gasfelder, Häfen und Flughäfen, Varosha und die Frage von zwei Staaten oder einer Föderation.",
		start: {
			handel: 15,
			sicherheit: 15,
			vertrauen: 20,
			konflikt: 75
		},
		anliegen: [A("cyp-hafen", "Häfen und Flughäfen öffnen", "Schiffe und Flugzeuge der Republik Zypern sollen türkische Häfen und Flughäfen nutzen dürfen.", {
			art: "land",
			dim: "vertrauen",
			min: 45
		}), A("cyp-ruhe", "Keine Bohrschiffe, keine Provokation", "Ruhe in den Gewässern rund um die Insel.", {
			art: "land",
			dim: "konflikt",
			max: 55
		})],
		aktionen: [
			"gipfel",
			"entspannen",
			"druck"
		]
	}
];
const LAND = new Map(LAENDER.map((l) => [l.id, l]));
const land = (id) => {
	const l = LAND.get(id);
	if (!l) throw new Error(`Unbekanntes Land: ${id}`);
	return l;
};
const AKTIONEN = {
	gipfel: {
		id: "gipfel",
		label: "Gipfeltreffen",
		hinweis: "Ein Treffen auf höchster Ebene schafft Vertrauen und öffnet Türen; je besser das Verhältnis schon ist, desto weniger bringt es.",
		pk: 3,
		abkuehlung: 120
	},
	handel: {
		id: "handel",
		label: "Handelsabkommen",
		hinweis: "Zölle sinken, Lieferketten werden verlässlicher; oft verlangt die Gegenseite dafür etwas.",
		pk: 5,
		abkuehlung: 180
	},
	ruestung: {
		id: "ruestung",
		label: "Rüstungsgeschäft",
		hinweis: "Sicherheitspartnerschaft und Aufträge; andere Mächte sehen es genau.",
		pk: 4,
		abkuehlung: 150
	},
	druck: {
		id: "druck",
		label: "Öffentlich Druck machen",
		hinweis: "Beifall zu Hause, Ärger im Ausland.",
		pk: 2,
		abkuehlung: 60
	},
	entspannen: {
		id: "entspannen",
		label: "Konflikt entschärfen",
		hinweis: "Gespräche über Streitpunkte; das Land will dafür ein Zeichen des Entgegenkommens.",
		pk: 4,
		abkuehlung: 120
	},
	hilfe: {
		id: "hilfe",
		label: "Wirtschaftshilfe und Wiederaufbau",
		hinweis: "Investitionen und Aufbauhilfe binden ein Land enger an die Türkei.",
		pk: 4,
		abkuehlung: 150
	}
};
function weltZustand(w) {
	const spiel = w.spiel;
	if (!spiel.welt) {
		spiel.welt = {};
		for (const l of LAENDER) {
			const knoten = startAverage(NET, w.net, l.knoten);
			spiel.welt[l.id] = {
				handel: l.start.handel,
				sicherheit: l.start.sicherheit,
				konflikt: l.start.konflikt,
				versatz: clamp(l.start.vertrauen - knoten, -45, 45),
				zuletzt: {},
				erinnerung: [],
				abkommen: []
			};
		}
	}
	for (const l of LAENDER) spiel.welt[l.id] ??= {
		handel: l.start.handel,
		sicherheit: l.start.sicherheit,
		konflikt: l.start.konflikt,
		versatz: 0,
		zuletzt: {},
		erinnerung: [],
		abkommen: []
	};
	return spiel.welt;
}
/** Das Vertrauen eines Landes: das Vertrauen im Politiknetz plus der Versatz für dieses Land. */
function vertrauenZu(w, id) {
	const l = land(id);
	const z = weltZustand(w)[id];
	return clamp(nationalAverage(NET, w.net, l.knoten) + z.versatz, 0, 100);
}
function dimensionZu(w, id, dim) {
	const z = weltZustand(w)[id];
	return dim === "vertrauen" ? vertrauenZu(w, id) : z[dim];
}
function haltungWort(w, id) {
	const v = vertrauenZu(w, id);
	const k = weltZustand(w)[id].konflikt;
	if (v >= 75) return "enger Partner";
	if (v >= 55 && k < 50) return "Partner";
	if (v >= 40) return k >= 60 ? "angespannt" : "nüchtern";
	if (v >= 25) return "kühl";
	return "feindselig";
}
function anliegenStand(w, id) {
	return land(id).anliegen.map((a) => {
		const b = a.bedingung;
		if (b.art === "land") {
			const jetzt = dimensionZu(w, id, b.dim);
			const namen = {
				handel: "Handel",
				sicherheit: "Sicherheit",
				vertrauen: "Vertrauen",
				konflikt: "Konflikt"
			};
			const ok = (b.min === void 0 || jetzt >= b.min) && (b.max === void 0 || jetzt <= b.max);
			return {
				anliegen: a,
				erfuellt: ok,
				text: `${namen[b.dim]} ${b.min !== void 0 ? `mindestens ${b.min}` : `höchstens ${b.max}`} (jetzt ${Math.round(jetzt)})`,
				fortschritt: ok ? 1 : .4
			};
		}
		const s = pruefeBedingung(w, b);
		return {
			anliegen: a,
			erfuellt: s.erfuellt,
			text: s.text,
			fortschritt: s.fortschritt
		};
	});
}
function aktionenFuer(w, id) {
	const l = land(id);
	const z = weltZustand(w)[id];
	const spiel = w.spiel;
	return l.aktionen.map((a) => {
		const def = AKTIONEN[a];
		const rest = (z.zuletzt[a] ?? -1e9) + def.abkuehlung - w.day;
		let grund;
		if (rest > 0) grund = `Wieder möglich in ${rest} Tagen.`;
		else if (!kannZahlen(spiel.kapital, def.pk)) grund = "Dafür fehlt Kapital.";
		else if (a === "handel" && vertrauenZu(w, id) < 40) grund = "Dafür ist das Vertrauen noch zu gering.";
		else if (a === "ruestung" && z.sicherheit < 35) grund = "Dafür ist die Sicherheitszusammenarbeit zu dünn.";
		else if (a === "entspannen" && z.konflikt < 30) grund = "Es gibt keinen Streit, der entschärft werden müsste.";
		else if (a === "gipfel" && z.konflikt >= 80) grund = "Solange der Konflikt so heftig ist, kommt kein Treffen zustande.";
		else if (a === "gipfel" && vertrauenZu(w, id) >= 82) grund = "Das Verhältnis ist so gut, wie es allein durch Treffen wird; jetzt zählen Taten.";
		else if (a === "hilfe" && z.handel >= 88 && vertrauenZu(w, id) >= 82) grund = "Mehr Hilfe würde das Verhältnis nicht mehr verbessern.";
		return {
			aktion: def,
			moeglich: !grund,
			...grund ? { grund } : {}
		};
	});
}
/** Wirkung auf ein Land: Dimension und Netzknoten zugleich, damit beides eine Wirklichkeit bleibt. */
function landAendern(w, id, delta, notiz) {
	const l = land(id);
	const z = weltZustand(w)[id];
	const ertrag = (dim, d) => d > 0 ? d * clamp((100 - dimensionZu(w, id, dim)) / 55, .1, 1.2) : d;
	if (delta.handel) delta = {
		...delta,
		handel: ertrag("handel", delta.handel)
	};
	if (delta.sicherheit) delta = {
		...delta,
		sicherheit: ertrag("sicherheit", delta.sicherheit)
	};
	if (delta.vertrauen) delta = {
		...delta,
		vertrauen: ertrag("vertrauen", delta.vertrauen)
	};
	if (delta.handel) z.handel = clamp(z.handel + delta.handel, 0, 100);
	if (delta.sicherheit) z.sicherheit = clamp(z.sicherheit + delta.sicherheit, 0, 100);
	if (delta.konflikt) z.konflikt = clamp(z.konflikt + delta.konflikt, 0, 100);
	if (delta.vertrauen) {
		z.versatz = clamp(z.versatz + delta.vertrauen * .6, -60, 60);
		wirke(w, l.knoten, delta.vertrauen * .4 * l.anteil);
	}
	if (notiz) {
		z.erinnerung.push(`${w.date}: ${notiz}`);
		if (z.erinnerung.length > 6) z.erinnerung.shift();
	}
}
/** Einmal im Monat: Konflikte kühlen ab oder schwelen; zufriedene Länder werden warm. */
function weltMonat(w) {
	if (!w.spiel) return;
	const z = weltZustand(w);
	for (const l of LAENDER) {
		const s = z[l.id];
		s.konflikt = clamp(s.konflikt + Math.sign(l.start.konflikt - s.konflikt) * Math.min(1, Math.abs(l.start.konflikt - s.konflikt)), 0, 100);
		const stand = anliegenStand(w, l.id);
		const erfuellt = stand.filter((x) => x.erfuellt).length;
		if (erfuellt === stand.length) s.versatz = clamp(s.versatz + .8, -60, 60);
		else if (erfuellt === 0) s.versatz = clamp(s.versatz - .3, -60, 60);
	}
}
//#endregion
//#region game/src/sim/folgen.ts
/** Größen des Netzes, bei denen ein höherer Wert schlechter ist. */
const SCHLECHT_WENN_HOCH$1 = /* @__PURE__ */ new Set([
	"haftueberfuellung",
	"ausnahmerecht",
	"strassburg_druck",
	"korruption",
	"polarisierung",
	"kriminalitaet",
	"terrorgefahr",
	"stau",
	"energiepreise",
	"energieimporte",
	"lebenshaltung",
	"armut",
	"ungleichheit",
	"schattenwirtschaft",
	"duerre",
	"kostendruck",
	"mieten",
	"abwanderung",
	"landflucht",
	"zinslast",
	"streikneigung",
	"gefluechtete",
	"dollarisierung",
	"wartezeiten",
	"schulabbruch",
	"informelle_arbeit",
	"jugendarbeitslosigkeit",
	"lebensmittelpreise",
	"luftverschmutzung",
	"inflation",
	"arbeitslosigkeit",
	"abwertung",
	"defizit",
	"schulden"
]);
/** Ob eine Bewegung der Größe in diese Richtung gut ist; `null` bei Größen ohne klare Wertung (etwa der Leitzins). */
function istGut(id, richtung) {
	const n = NET.nodes[NET.index.get(id) ?? -1];
	if (!n) return null;
	if (id === "leitzins") return null;
	if (n.kind === "massnahme") return null;
	return n.kind === "problem" || SCHLECHT_WENN_HOCH$1.has(id) ? richtung < 0 : richtung > 0;
}
let ausgehend = null;
function ausgehendeKanten() {
	if (ausgehend) return ausgehend;
	const m = /* @__PURE__ */ new Map();
	for (let j = 0; j < NET.edgeFrom.length; j++) {
		const von = NET.edgeFrom[j];
		const liste = m.get(von) ?? [];
		liste.push({
			nach: NET.edgeTo[j],
			gewicht: NET.edgeWeight[j],
			lag: NET.edgeLag[j],
			warum: NET.edges[j].why
		});
		m.set(von, liste);
	}
	ausgehend = m;
	return m;
}
/**
* Die Kette, die eine Bewegung der Größe `startId` im Politiknetz auslöst: bis zu drei Stufen, jeweils die stärksten Verbindungen.
* `richtung` ist die Richtung der Bewegung (+1 steigt, −1 sinkt).
*/
function netzKette(startId, richtung, breite = [
	4,
	2,
	2
]) {
	const start = NET.index.get(startId);
	if (start === void 0) return [];
	const aus = ausgehendeKanten();
	const gesehen = /* @__PURE__ */ new Set([start]);
	const out = [];
	let front = [{
		i: start,
		dir: richtung,
		nach: 0
	}];
	for (const ebene of [
		1,
		2,
		3
	]) {
		const naechste = [];
		for (const f of front) {
			const kanten = (aus.get(f.i) ?? []).filter((k) => Math.abs(k.gewicht) >= (ebene === 1 ? .01 : .015) && NET.nodes[k.nach].kind !== "massnahme" && !NET.nodes[k.nach].input && !gesehen.has(k.nach)).sort((a, b) => Math.abs(b.gewicht) - Math.abs(a.gewicht)).slice(0, ebene === 1 ? breite[0] : breite[ebene - 1]);
			for (const k of kanten) {
				if (gesehen.has(k.nach)) continue;
				gesehen.add(k.nach);
				const dir = k.gewicht > 0 ? f.dir : -f.dir;
				const node = NET.nodes[k.nach];
				const nach = f.nach + k.lag;
				out.push({
					text: node.name,
					groesse: true,
					richtung: dir,
					gut: istGut(node.id, dir),
					nach,
					ebene,
					warum: k.warum
				});
				naechste.push({
					i: k.nach,
					dir,
					nach,
					g: Math.abs(k.gewicht)
				});
			}
		}
		front = naechste.sort((a, b) => b.g - a.g).slice(0, 4);
		if (!front.length) break;
	}
	return out;
}
/** Was eine Zinsänderung im Wirtschaftsmodell auslöst (Z1 bis Z9) und welche Verzögerung dabei gilt. */
function zinsKette(delta) {
	if (!delta) return [];
	const s = delta > 0 ? 1 : -1;
	const lag = PARAMS.rateLagMonths;
	return [...[
		{
			text: s > 0 ? "Die Lira wird stärker: Anleger holen sich den höheren Zins" : "Die Lira wird schwächer: Anleger ziehen Geld ab",
			richtung: s,
			gut: s > 0,
			nach: 0,
			ebene: 1,
			warum: "Z4: Der Realzins zieht Kapital an oder weg, binnen Tagen."
		},
		{
			text: s > 0 ? "Die Wirtschaft läuft kühler: Auslastung sinkt" : "Die Wirtschaft läuft heißer: Auslastung steigt",
			richtung: -s,
			gut: null,
			nach: lag,
			ebene: 1,
			warum: `Z1: Der Zins wirkt auf Kredite und Nachfrage, nach etwa ${lag} Monaten.`
		},
		{
			text: s > 0 ? "Die Inflation sinkt" : "Die Inflation steigt",
			richtung: -s,
			gut: s > 0,
			nach: lag + 3,
			ebene: 2,
			warum: "Z2 und Z5: Weniger Auslastung und eine stärkere Lira bremsen die Preise."
		},
		{
			text: s > 0 ? "Wachstum und Beschäftigung leiden" : "Wachstum und Beschäftigung profitieren",
			richtung: -s,
			gut: s < 0,
			nach: lag + 2,
			ebene: 2,
			warum: "Z9: Die Arbeitslosigkeit folgt dem Wachstum mit Verzögerung."
		},
		{
			text: s > 0 ? "Neue Staatsschulden werden teurer: Der Zinsdienst wächst langsam" : "Neue Staatsschulden werden billiger: Der Zinsdienst wächst langsamer",
			richtung: s,
			gut: s < 0,
			nach: 12,
			ebene: 2,
			warum: "Z7: Die Schuld wird erst bei Fälligkeit neu finanziert, deshalb kommt die Wirkung über Jahre."
		}
	], ...netzKette("leitzins", s, [
		3,
		2,
		1
	]).filter((g) => g.ebene <= 2)];
}
/** Was ein Ausgabenimpuls (oder eine Steuersenkung) im Wirtschaftsmodell auslöst; `delta` in Prozent des BIP je Jahr (+ mehr Nachfrage). */
function impulsKette(delta) {
	if (!delta) return [];
	const s = delta > 0 ? 1 : -1;
	return [
		{
			text: s > 0 ? "Die Nachfrage steigt: Der Staat kauft und zahlt mehr" : "Die Nachfrage sinkt: Der Staat kauft und zahlt weniger",
			richtung: s,
			gut: null,
			nach: 1,
			ebene: 1,
			warum: "Z6: Ausgaben und Steuern wirken auf die Nachfrage."
		},
		{
			text: s > 0 ? "Das Defizit wächst, die Schulden steigen" : "Das Defizit schrumpft, die Schulden wachsen langsamer",
			richtung: s,
			gut: s < 0,
			nach: 1,
			ebene: 1,
			warum: "Z7: Defizite werden zu Schulden."
		},
		{
			text: s > 0 ? "Wachstum und Beschäftigung steigen" : "Wachstum und Beschäftigung sinken",
			richtung: s,
			gut: s > 0,
			nach: 3,
			ebene: 2,
			warum: "Z1 und Z9: Höhere Auslastung heißt mehr Produktion und Arbeit."
		},
		{
			text: s > 0 ? "Die Inflation steigt" : "Die Inflation sinkt",
			richtung: s,
			gut: s < 0,
			nach: 6,
			ebene: 2,
			warum: "Z2: Läuft die Wirtschaft heißer, steigen Preise und Löhne schneller."
		},
		{
			text: s > 0 ? "Der Risikoaufschlag steigt: Anleger verlangen mehr für Staatsanleihen" : "Der Risikoaufschlag sinkt: Anleger verlangen weniger für Staatsanleihen",
			richtung: s,
			gut: s < 0,
			nach: 1,
			ebene: 2,
			warum: "Z8: Hohe Defizite machen Anleger nervös."
		},
		...netzKette("defizit", s, [
			2,
			1,
			1
		]).filter((g) => g.ebene <= 2)
	];
}
/** Was der Verlust (oder Gewinn) an Glaubwürdigkeit der Zentralbank auslöst. */
function glaubwuerdigkeitsKette(delta) {
	if (!delta) return [];
	const s = delta < 0 ? 1 : -1;
	return [
		{
			text: s > 0 ? "Die Lira gibt nach, der Risikoaufschlag steigt" : "Die Lira festigt sich, der Risikoaufschlag sinkt",
			richtung: s,
			gut: s < 0,
			nach: 0,
			ebene: 1,
			warum: "Z4 und Z8: Märkte reagieren binnen Tagen auf politischen Einfluss."
		},
		{
			text: s > 0 ? "Die Inflationserwartungen steigen" : "Die Inflationserwartungen sinken",
			richtung: s,
			gut: s < 0,
			nach: 2,
			ebene: 1,
			warum: "Z3: Verliert die Bank Glaubwürdigkeit, verankern sich die Erwartungen schlechter."
		},
		{
			text: s > 0 ? "Löhne und Preise ziehen vorsorglich an: Die Inflation verfestigt sich" : "Die Inflation lässt sich leichter senken",
			richtung: s,
			gut: s < 0,
			nach: 6,
			ebene: 2,
			warum: "Z3: Erwartungen bestimmen, wie zäh die Inflation ist."
		}
	];
}
/** Die Kette als Text in einer Zeile, für Chronik und Meldungen. */
function kettenZeile(g) {
	const pfeil = g.groesse ? ` ${g.richtung > 0 ? "▲" : "▼"}` : "";
	return `${g.text}${pfeil}${g.nach ? ` (nach etwa ${g.nach} Monaten)` : ""}`;
}
//#endregion
//#region game/src/sim/dates.ts
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
function monthNumber(isoDate) {
	return Number(isoDate.slice(5, 7));
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
const MONTHS_DE = [
	"Januar",
	"Februar",
	"März",
	"April",
	"Mai",
	"Juni",
	"Juli",
	"August",
	"September",
	"Oktober",
	"November",
	"Dezember"
];
function formatDateDe(isoDate) {
	return `${dayOfMonth(isoDate)}. ${MONTHS_DE[monthNumber(isoDate) - 1]} ${isoDate.slice(0, 4)}`;
}
function formatMonthDe(month) {
	return `${MONTHS_DE[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
}
//#endregion
//#region game/src/data/haushaltsplan.ts
const PLAN_2026 = {
	ausgabenGesamt: 18929,
	einnahmenGesamt: 16216,
	steuerGesamt: 13800,
	defizit: 2713,
	defizitProzentBip: 3.5,
	zinsenProzentBip: 3.5,
	/** Rund eine Milliarde Lira entspricht so viel BIP: 1 % des BIP ≈ 783 Mrd. Lira, abgeleitet aus Zinsausgaben und deren BIP-Anteil */
	mrdProProzentBip: 783,
	quellen: [
		{
			name: "Forbes Türkiye, „2026 bütçesi 18,9 trilyon TL“ (Ausgaben nach Arten)",
			url: "https://www.forbes.com.tr/ekonomi/2026-butcesi-18-9-trilyon-tl"
		},
		{
			name: "Tez-Koop-İş, „2026 Bütçesinde Harcamalar ve Vergiler“ (Steuern nach Arten, SGK-Übertragungen)",
			url: "https://tezkoopis.org/2026-butcesinde-harcamalar-ve-vergiler-2026-yili-merkezi-yonetim-butcesinin-analizi-2/"
		},
		{
			name: "Daily Sabah, „Türkiye presents 2026 draft budget“ (Steuereinnahmen, Zinsen, Defizit)",
			url: "https://www.dailysabah.com/business/economy/turkiye-presents-2026-draft-budget-reaffirms-disinflation-goal"
		}
	],
	hinweis: "Die Quellen weichen bei einzelnen Summen leicht ab; die Zeilen addieren sich zu den 18,9 Billionen Lira des Haushaltsgesetzes. Wie viel des BIP eine Milliarde Lira ist, ist aus den Zinsausgaben abgeleitet und nur eine Größenordnung."
};
/** Der Durchschnittszins auf die Schuld beim Start: Zinsausgaben (3,5 % des BIP) geteilt durch die Schuldenquote (23,8 % des BIP). */
const ZINSSATZ_START = PLAN_2026.zinsenProzentBip / 23.8 * 100;
//#endregion
//#region game/src/sim/scenario.ts
const turkey2026 = {
	id: "tuerkei-2026-09-25",
	dataDate: "2026-09-25",
	startDate: "2028-06-05",
	description: "Türkei mit den Daten vom Stichtag 25.09.2026. Das Spiel beginnt direkt nach der Wahl 2028 (Startdatum im Spiel ist eine Annahme: Amtsantritt Anfang Juni 2028). Quellen: tuerkei/STARTDATEN.md.",
	economy: {
		"policyRate": {
			"value": 37,
			"provenance": "belegt",
			"note": "Zinsentscheid 10.09.2026"
		},
		"inflation": {
			"value": 31.51,
			"provenance": "belegt",
			"note": "August 2026, TÜİK"
		},
		"expectedInflation": {
			"value": 28,
			"provenance": "geschaetzt",
			"note": "Platzhalter nahe der Jahresendprognose der Zentralbank; Erwartungsumfrage noch nicht erhoben"
		},
		"inflationTarget": {
			"value": 24,
			"provenance": "belegt",
			"note": "Zwischenziel 2026"
		},
		"credibility": {
			"value": .45,
			"provenance": "geschaetzt",
			"note": "Interne Größe des Modells, keine Messung"
		},
		"outputGap": {
			"value": -1,
			"provenance": "geschaetzt",
			"note": "Wachstum unter Potenzial"
		},
		"potentialGrowth": {
			"value": 4,
			"provenance": "geschaetzt",
			"note": "Platzhalter für die Kalibrierung"
		},
		"growth": {
			"value": 2.3,
			"provenance": "belegt",
			"note": "2. Quartal 2026"
		},
		"unemployment": {
			"value": 8.1,
			"provenance": "belegt",
			"note": "Juli 2026"
		},
		"usdTry": {
			"value": 48.95,
			"provenance": "belegt",
			"note": "Marktkurs 25.09.2026"
		},
		"eurTry": {
			"value": 55.75,
			"provenance": "belegt",
			"note": "Marktkurs 25.09.2026"
		},
		"riskPremium": {
			"value": 250,
			"provenance": "belegt",
			"note": "CDS 5 Jahre, Ende September 2026"
		},
		"debtRatio": {
			"value": 23.8,
			"provenance": "belegt",
			"note": "Ende 2025, EU-Definition"
		},
		"deficit": {
			"value": 3.1,
			"provenance": "belegt",
			"note": "Ziel 2026"
		},
		"fiscalImpulse": {
			"value": 0,
			"provenance": "abgeleitet",
			"note": "Kein zusätzlicher Impuls zu Spielbeginn"
		}
	},
	governor: {
		"name": "Gouverneur der Zentralbank",
		"stance": "vorsichtig"
	},
	published: {
		"inflation": {
			"value": 31.51,
			"period": "2028-05",
			"publishedOn": "2028-06-03"
		},
		"growth": {
			"value": 2.3,
			"period": "2028-Q1",
			"publishedOn": "2028-06-01"
		},
		"unemployment": {
			"value": 8.1,
			"period": "2028-04",
			"publishedOn": "2028-05-31"
		}
	}
};
const netz = (w, id) => nationalAverage(NET, w.net, id);
/** Das geplante Defizit in % des BIP: Grundlinie, eigener Impuls, Kosten der Maßnahmen und Mehrzinsen. */
function defizitJetzt(w) {
	const e = w.economy;
	return e.deficit + e.fiscalImpulse + e.policyCost + (e.zinsMehrlast ?? 0);
}
/** Zinsausgaben des Staates in % des BIP: Schuldenquote mal Durchschnittszins. */
function zinsausgabenJetzt(w) {
	const z = w.spiel?.wirtschaft?.haushalt;
	const satz = z ? z.zinssatz : ZINSSATZ_START;
	return w.economy.debtRatio * satz / 100;
}
/** Größen, die nicht in `world.history` stehen und deshalb eigens aufgezeichnet werden. */
const EXTRA = {
	erwartung: (w) => w.economy.expectedInflation,
	realzins: (w) => realRate(w.economy),
	defizit: defizitJetzt,
	zinssatz: (w) => w.spiel?.wirtschaft?.haushalt.zinssatz ?? ZINSSATZ_START,
	zinsausgaben: zinsausgabenJetzt,
	reallohn: (w) => netz(w, "realeinkommen"),
	investitionen: (w) => netz(w, "investitionen"),
	export: (w) => netz(w, "export"),
	vertrauen_maerkte: (w) => netz(w, "vertrauen_maerkte"),
	teuerung: (w) => netz(w, "lebenshaltung"),
	armut: (w) => netz(w, "armut"),
	kredite: (w) => netz(w, "kredite"),
	auslandskapital: (w) => netz(w, "auslandskapital"),
	zinslast: (w) => netz(w, "zinslast")
};
function neuerZentralbankZustand() {
	return {
		stufe: "B",
		druck: null,
		kritikTage: [],
		sitzungen: []
	};
}
/** Der Marktzins beim Start des Szenarios (Leitzins plus Risikoaufschlag): der Bezugspunkt des Zinsdienstes, unabhängig davon, wann die Akte angelegt wird. */
const MARKTZINS_START = turkey2026.economy.policyRate.value + turkey2026.economy.riskPremium.value / 100;
function neuerHaushaltZustand() {
	return {
		stufen: {},
		zinssatz: ZINSSATZ_START,
		marktStart: MARKTZINS_START,
		aenderungen: []
	};
}
function neuerZustand(w) {
	const monate = w.history.slice(-12).map((s) => s.month);
	while (monate.length < 12) monate.unshift(previousMonth(monate[0] ?? monthOf(w.date)));
	const reihen = {};
	for (const [id, f] of Object.entries(EXTRA)) reihen[id] = monate.map(() => f(w));
	return {
		zb: neuerZentralbankZustand(),
		haushalt: neuerHaushaltZustand(),
		monate,
		reihen,
		marken: []
	};
}
/** Der Zustand der Wirtschaftsakte; ältere Spielstände legen ihn beim ersten Zugriff an. Ohne Spielschleife gibt es einen flüchtigen. */
function wirtschaftZustand(w) {
	const sp = w.spiel;
	if (sp?.wirtschaft) return sp.wirtschaft;
	const z = neuerZustand(w);
	if (sp) sp.wirtschaft = z;
	return z;
}
const zbZustand = (w) => wirtschaftZustand(w).zb;
const haushaltZustand = (w) => wirtschaftZustand(w).haushalt;
/** Eine Marke auf der Zeitachse setzen (Zinsentscheid, Haushalt, Eingriff). */
function addMarke(w, art, text) {
	if (!w.spiel) return;
	const z = wirtschaftZustand(w);
	z.marken.push({
		tag: w.day,
		monat: monthOf(w.date),
		art,
		text
	});
	if (z.marken.length > 200) z.marken.shift();
}
/** Einmal im Monat: die Reihen fortschreiben (am Monatsersten, für den Vormonat). */
function zeichneAuf(w) {
	if (!w.spiel) return;
	const z = wirtschaftZustand(w);
	const monat = previousMonth(monthOf(w.date));
	if (z.monate[z.monate.length - 1] === monat) return;
	z.monate.push(monat);
	for (const [id, f] of Object.entries(EXTRA)) (z.reihen[id] ??= z.monate.slice(0, -1).map(() => f(w))).push(f(w));
	while (z.monate.length > 120) {
		z.monate.shift();
		for (const r of Object.values(z.reihen)) r.shift();
	}
}
//#endregion
//#region game/src/data/erbe.ts
const W = (jahr) => ({
	status: "welterbe",
	jahr
});
const T = { status: "tentativ" };
const N = { status: "nein" };
const ERBE = [
	{
		id: "ephesos",
		name: "Ephesos",
		ort: "Selçuk",
		plaka: 35,
		lat: 37.941,
		lon: 27.342,
		epoche: "antik, christlich",
		bezug: ["antik", "christlich"],
		unesco: W(2015),
		satz: "Hafenmetropole der Antike, Wirkungsort des Johannes, Ort der Marienverehrung.",
		kirche7: true,
		serien: ["kirchen7"]
	},
	{
		id: "smyrna",
		name: "Smyrna (Agora)",
		ort: "İzmir",
		plaka: 35,
		lat: 38.419,
		lon: 27.138,
		epoche: "antik, christlich",
		bezug: ["antik", "christlich"],
		unesco: T,
		satz: "Die Kirche von Smyrna liegt unter einer lebenden Großstadt.",
		kirche7: true,
		serien: ["kirchen7"]
	},
	{
		id: "pergamon",
		name: "Pergamon",
		ort: "Bergama",
		plaka: 35,
		lat: 39.133,
		lon: 27.184,
		epoche: "antik, christlich",
		bezug: ["antik", "christlich"],
		unesco: W(2014),
		satz: "Altar, Bibliothek und „Thron des Satans“ der Offenbarung.",
		ungefaehr: true,
		kirche7: true,
		serien: ["kirchen7"]
	},
	{
		id: "thyatira",
		name: "Thyatira",
		ort: "Akhisar",
		plaka: 45,
		lat: 38.92,
		lon: 27.836,
		epoche: "antik, christlich",
		bezug: ["antik", "christlich"],
		unesco: N,
		satz: "Ruinen mitten im Stadtzentrum.",
		ungefaehr: true,
		kirche7: true,
		serien: ["kirchen7"]
	},
	{
		id: "sardes",
		name: "Sardes",
		ort: "Sart",
		plaka: 45,
		lat: 38.488,
		lon: 28.04,
		epoche: "antik, jüdisch, christlich",
		bezug: [
			"antik",
			"juedisch",
			"christlich"
		],
		unesco: W(2025),
		satz: "Hauptstadt der Lyder mit Artemistempel und einer der größten antiken Synagogen.",
		kirche7: true,
		serien: ["kirchen7", "vielvoelker"]
	},
	{
		id: "philadelphia",
		name: "Philadelphia",
		ort: "Alaşehir",
		plaka: 45,
		lat: 38.35,
		lon: 28.517,
		epoche: "antik, christlich",
		bezug: ["antik", "christlich"],
		unesco: N,
		satz: "Stadtmittelpunkt; eine Säule der Johannesbasilika steht noch.",
		ungefaehr: true,
		kirche7: true,
		serien: ["kirchen7"]
	},
	{
		id: "laodikeia",
		name: "Laodikeia",
		ort: "bei Denizli",
		plaka: 20,
		lat: 37.836,
		lon: 29.108,
		epoche: "antik, christlich",
		bezug: ["antik", "christlich"],
		unesco: T,
		satz: "Laufende Ausgrabung einer reichen Handelsstadt.",
		kirche7: true,
		serien: ["kirchen7"]
	},
	{
		id: "hagia_sophia",
		name: "Hagia Sophia",
		ort: "İstanbul",
		plaka: 34,
		lat: 41.008,
		lon: 28.98,
		epoche: "byzantinisch, osmanisch",
		bezug: ["christlich", "islamisch"],
		unesco: W(1985),
		satz: "Kirche, Moschee, Museum, wieder Moschee: Nutzungsstreit seit 2020.",
		serien: ["byzanz"]
	},
	{
		id: "suleymaniye",
		name: "Süleymaniye-Moschee",
		ort: "İstanbul",
		plaka: 34,
		lat: 41.016,
		lon: 28.964,
		epoche: "osmanisch",
		bezug: ["islamisch"],
		unesco: W(1985),
		satz: "Sinans Moschee für Süleyman.",
		serien: ["sinan"]
	},
	{
		id: "topkapi",
		name: "Topkapı-Palast",
		ort: "İstanbul",
		plaka: 34,
		lat: 41.013,
		lon: 28.984,
		epoche: "osmanisch",
		bezug: ["islamisch"],
		unesco: W(1985),
		satz: "Sultanssitz und Staatsschatz."
	},
	{
		id: "neve_shalom",
		name: "Neve-Shalom-Synagoge",
		ort: "İstanbul",
		plaka: 34,
		lat: 41.027,
		lon: 28.972,
		epoche: "jüdisch",
		bezug: ["juedisch"],
		unesco: N,
		satz: "Zentrum der jüdischen Gemeinde Istanbuls.",
		serien: ["vielvoelker"]
	},
	{
		id: "phanar",
		name: "Phanar (Ökumenisches Patriarchat)",
		ort: "İstanbul",
		plaka: 34,
		lat: 41.029,
		lon: 28.952,
		epoche: "byzantinisch, christlich",
		bezug: ["christlich"],
		unesco: N,
		satz: "Sitz des Ökumenischen Patriarchen.",
		serien: ["byzanz", "vielvoelker"]
	},
	{
		id: "goebekli_tepe",
		name: "Göbekli Tepe",
		ort: "Şanlıurfa",
		plaka: 63,
		lat: 37.223,
		lon: 38.922,
		epoche: "frühmenschlich",
		bezug: ["fruehmenschlich"],
		unesco: W(2018),
		satz: "Älteste bekannte Monumentalanlage der Menschheit; 750.000 Besucher 2024.",
		serien: ["tas_tepeler"]
	},
	{
		id: "catalhoyuk",
		name: "Çatalhöyük",
		ort: "Çumra",
		plaka: 42,
		lat: 37.667,
		lon: 32.828,
		epoche: "frühmenschlich",
		bezug: ["fruehmenschlich"],
		unesco: W(2012),
		satz: "Neolithische Großsiedlung."
	},
	{
		id: "arslantepe",
		name: "Arslantepe",
		ort: "Malatya",
		plaka: 44,
		lat: 38.382,
		lon: 38.361,
		epoche: "Bronzezeit",
		bezug: ["antik"],
		unesco: W(2021),
		satz: "Frühe Staatlichkeit mit Palast."
	},
	{
		id: "hattusa",
		name: "Hattuša",
		ort: "Boğazkale",
		plaka: 19,
		lat: 40.02,
		lon: 34.615,
		epoche: "hethitisch",
		bezug: ["antik"],
		unesco: W(1986),
		satz: "Hauptstadt der Hethiter, Löwentor."
	},
	{
		id: "gordion",
		name: "Gordion",
		ort: "Polatlı",
		plaka: 6,
		lat: 39.65,
		lon: 31.978,
		epoche: "phrygisch",
		bezug: ["antik"],
		unesco: W(2023),
		satz: "Midas-Tumulus."
	},
	{
		id: "troja",
		name: "Troja",
		ort: "Tevfikiye",
		plaka: 17,
		lat: 39.958,
		lon: 26.239,
		epoche: "antik",
		bezug: ["antik"],
		unesco: W(1998),
		satz: "Homers Troja mit mehreren Siedlungsschichten."
	},
	{
		id: "nemrut",
		name: "Nemrut Dağı",
		ort: "Adıyaman",
		plaka: 2,
		lat: 37.981,
		lon: 38.741,
		epoche: "antik (Kommagene)",
		bezug: ["antik"],
		unesco: W(1987),
		satz: "Kolossalstatuen und Königsgrab auf dem Gipfel."
	},
	{
		id: "kappadokien",
		name: "Göreme und Kappadokien",
		ort: "Göreme",
		plaka: 50,
		lat: 38.643,
		lon: 34.829,
		epoche: "byzantinisch, Naturerbe",
		bezug: ["christlich", "natur"],
		unesco: W(1985),
		satz: "Felsenkirchen und Feenkamine; Ballontourismus.",
		serien: ["byzanz"]
	},
	{
		id: "pamukkale",
		name: "Hierapolis und Pamukkale",
		ort: "Pamukkale",
		plaka: 20,
		lat: 37.925,
		lon: 29.126,
		epoche: "antik, Naturerbe",
		bezug: ["antik", "natur"],
		unesco: W(1988),
		satz: "Sinterterrassen und Nekropole; Massentourismus belastet die Terrassen."
	},
	{
		id: "aphrodisias",
		name: "Aphrodisias",
		ort: "Geyre",
		plaka: 9,
		lat: 37.708,
		lon: 28.724,
		epoche: "antik",
		bezug: ["antik"],
		unesco: W(2017),
		satz: "Marmor und Bildhauerschule."
	},
	{
		id: "xanthos",
		name: "Xanthos und Letoon",
		ort: "Kınık",
		plaka: 7,
		lat: 36.356,
		lon: 29.319,
		epoche: "lykisch",
		bezug: ["antik"],
		unesco: W(1988),
		satz: "Hauptstadt Lykiens mit Inschriften."
	},
	{
		id: "aspendos",
		name: "Aspendos",
		ort: "Serik",
		plaka: 7,
		lat: 36.939,
		lon: 31.172,
		epoche: "antik (römisch)",
		bezug: ["antik"],
		unesco: T,
		satz: "Römisches Theater, fast unversehrt."
	},
	{
		id: "zeugma",
		name: "Zeugma",
		ort: "Nizip",
		plaka: 27,
		lat: 37.059,
		lon: 37.866,
		epoche: "antik",
		bezug: ["antik"],
		unesco: T,
		satz: "Mosaike am Euphrat."
	},
	{
		id: "myra",
		name: "Myra (Nikolauskirche)",
		ort: "Demre",
		plaka: 7,
		lat: 36.245,
		lon: 29.985,
		epoche: "byzantinisch, christlich",
		bezug: ["christlich"],
		unesco: T,
		satz: "Nikolaus von Myra, Pilgerziel.",
		serien: ["byzanz"]
	},
	{
		id: "suemela",
		name: "Sümela-Kloster",
		ort: "Maçka",
		plaka: 61,
		lat: 40.69,
		lon: 39.658,
		epoche: "byzantinisch",
		bezug: ["christlich"],
		unesco: T,
		satz: "Felsenkloster der Muttergottes.",
		serien: ["byzanz"]
	},
	{
		id: "akdamar",
		name: "Akdamar-Kirche",
		ort: "Gevaş",
		plaka: 65,
		lat: 38.34,
		lon: 43.037,
		epoche: "armenisch, mittelalterlich",
		bezug: ["christlich", "armenisch"],
		unesco: T,
		satz: "Reliefkirche auf einer Insel im Vansee.",
		serien: ["vielvoelker"]
	},
	{
		id: "mor_gabriel",
		name: "Mor-Gabriel-Kloster",
		ort: "Midyat",
		plaka: 47,
		lat: 37.322,
		lon: 41.539,
		epoche: "christlich (syrisch)",
		bezug: ["christlich", "syrisch"],
		unesco: T,
		satz: "Syrisch-orthodoxes Kloster.",
		serien: ["vielvoelker"]
	},
	{
		id: "petrusgrotte",
		name: "Petrus-Grotte",
		ort: "Antakya",
		plaka: 31,
		lat: 36.209,
		lon: 36.178,
		epoche: "christlich",
		bezug: ["christlich"],
		unesco: T,
		satz: "Frühe Christengemeinde von Antiochia."
	},
	{
		id: "antakya",
		name: "Antakya (Altstadt und Mosaikmuseum)",
		ort: "Antakya",
		plaka: 31,
		lat: 36.203,
		lon: 36.161,
		epoche: "antik, vielfältig",
		bezug: [
			"antik",
			"christlich",
			"juedisch",
			"islamisch"
		],
		unesco: N,
		satz: "Mosaikmuseum und Vielvölkerstadt; im Erdbeben 2023 schwer getroffen.",
		serien: ["vielvoelker"]
	},
	{
		id: "iznik",
		name: "İznik (Nicäa)",
		ort: "İznik",
		plaka: 16,
		lat: 40.429,
		lon: 29.72,
		epoche: "byzantinisch, osmanisch",
		bezug: ["christlich", "islamisch"],
		unesco: T,
		satz: "Konzilsstadt und Stadt der Fliesen.",
		serien: ["byzanz"]
	},
	{
		id: "meryem_ana",
		name: "Meryem Ana Evi",
		ort: "Selçuk",
		plaka: 35,
		lat: 37.912,
		lon: 27.334,
		epoche: "christlich, islamisch",
		bezug: ["christlich", "islamisch"],
		unesco: N,
		satz: "Gemeinsamer Pilgerort bei Ephesos."
	},
	{
		id: "divrigi",
		name: "Große Moschee und Hospital von Divriği",
		ort: "Divriği",
		plaka: 58,
		lat: 39.371,
		lon: 38.122,
		epoche: "seldschukisch",
		bezug: ["islamisch"],
		unesco: W(1985),
		satz: "Portalplastik und Moschee mit Heilhaus.",
		serien: ["seldschuken"]
	},
	{
		id: "mevlana",
		name: "Mevlana-Museum",
		ort: "Konya",
		plaka: 42,
		lat: 37.871,
		lon: 32.505,
		epoche: "seldschukisch, lebende Kultur",
		bezug: ["islamisch"],
		unesco: T,
		satz: "Rumi-Grab und Derwischtanz (Sema, immaterielles Erbe 2008).",
		serien: ["seldschuken"]
	},
	{
		id: "esrefoglu",
		name: "Eşrefoğlu-Moschee",
		ort: "Beyşehir",
		plaka: 42,
		lat: 37.683,
		lon: 31.72,
		epoche: "seldschukisch",
		bezug: ["islamisch"],
		unesco: W(2023),
		satz: "Holzsäulenmoschee (Serie der Holzsäulenmoscheen).",
		serien: ["seldschuken"]
	},
	{
		id: "bursa",
		name: "Bursa und Cumalıkızık",
		ort: "Bursa",
		plaka: 16,
		lat: 40.185,
		lon: 29.062,
		epoche: "osmanisch",
		bezug: ["islamisch"],
		unesco: W(2014),
		satz: "Wiege des Osmanischen Reichs."
	},
	{
		id: "selimiye",
		name: "Selimiye-Moschee",
		ort: "Edirne",
		plaka: 22,
		lat: 41.678,
		lon: 26.559,
		epoche: "osmanisch",
		bezug: ["islamisch"],
		unesco: W(2011),
		satz: "Sinans Meisterwerk (Überlieferung).",
		serien: ["sinan"]
	},
	{
		id: "kirkpinar",
		name: "Kırkpınar (Sarayiçi)",
		ort: "Edirne",
		plaka: 22,
		lat: 41.691,
		lon: 26.555,
		epoche: "lebende Kultur",
		bezug: ["islamisch"],
		unesco: N,
		satz: "Ölringen-Fest, immaterielles Erbe 2010.",
		ungefaehr: true
	},
	{
		id: "ani",
		name: "Ani",
		ort: "Ocaklı",
		plaka: 36,
		lat: 40.508,
		lon: 43.573,
		epoche: "armenisch, seldschukisch",
		bezug: [
			"armenisch",
			"christlich",
			"islamisch"
		],
		unesco: W(2016),
		satz: "Mittelalterliche Hauptstadt an der Grenze zu Armenien.",
		serien: ["vielvoelker"]
	},
	{
		id: "ahlat",
		name: "Ahlat",
		ort: "Ahlat",
		plaka: 13,
		lat: 38.753,
		lon: 42.494,
		epoche: "seldschukisch",
		bezug: ["islamisch"],
		unesco: T,
		satz: "Grabsteine und Steinmetzkunst.",
		ungefaehr: true,
		serien: ["seldschuken"]
	},
	{
		id: "ishak_pascha",
		name: "İshak-Pascha-Palast",
		ort: "Doğubayazıt",
		plaka: 4,
		lat: 39.52,
		lon: 44.129,
		epoche: "osmanisch",
		bezug: ["islamisch"],
		unesco: T,
		satz: "Palast am Ararat."
	},
	{
		id: "hasankeyf",
		name: "Hasankeyf",
		ort: "Hasankeyf",
		plaka: 72,
		lat: 37.715,
		lon: 41.413,
		epoche: "mittelalterlich",
		bezug: ["islamisch"],
		unesco: N,
		satz: "2020 vom Ilısu-Stausee überflutet, Teile versetzt.",
		ungefaehr: true
	},
	{
		id: "safranbolu",
		name: "Safranbolu",
		ort: "Safranbolu",
		plaka: 78,
		lat: 41.249,
		lon: 32.683,
		epoche: "osmanisch",
		bezug: ["islamisch"],
		unesco: W(1994),
		satz: "Fachwerk-Handelsstadt."
	},
	{
		id: "diyarbakir",
		name: "Festung Diyarbakır und Hevsel-Gärten",
		ort: "Diyarbakır",
		plaka: 21,
		lat: 37.911,
		lon: 40.227,
		epoche: "römisch bis islamisch",
		bezug: ["islamisch", "antik"],
		unesco: W(2015),
		satz: "Basaltmauern und Gärten am Tigris."
	},
	{
		id: "mardin",
		name: "Mardin",
		ort: "Mardin",
		plaka: 47,
		lat: 37.313,
		lon: 40.735,
		epoche: "Vielvölker, syrisch",
		bezug: [
			"syrisch",
			"christlich",
			"islamisch"
		],
		unesco: T,
		satz: "Steinstadt der Vielfalt.",
		serien: ["vielvoelker"]
	},
	{
		id: "balikligoel",
		name: "Balıklıgöl",
		ort: "Şanlıurfa",
		plaka: 63,
		lat: 37.148,
		lon: 38.784,
		epoche: "Abraham-Tradition",
		bezug: [
			"islamisch",
			"christlich",
			"juedisch"
		],
		unesco: T,
		satz: "Pilgerort mit dem Heiligen Karpfenteich.",
		serien: ["tas_tepeler"]
	},
	{
		id: "hacibektas",
		name: "Hacıbektaş-Komplex",
		ort: "Hacıbektaş",
		plaka: 50,
		lat: 38.944,
		lon: 34.56,
		epoche: "Alevi-Bektaşi, lebende Kultur",
		bezug: ["alevitisch"],
		unesco: T,
		satz: "Zentrum der Alevi-Tradition.",
		ungefaehr: true
	},
	{
		id: "anitkabir",
		name: "Anıtkabir",
		ort: "Ankara",
		plaka: 6,
		lat: 39.926,
		lon: 32.838,
		epoche: "republikanisch",
		bezug: ["republik"],
		unesco: N,
		satz: "Atatürk-Mausoleum; Ort der nationalen Identität."
	},
	{
		id: "gelibolu",
		name: "Gelibolu (Gallipoli)",
		ort: "Eceabat",
		plaka: 17,
		lat: 40.17,
		lon: 26.368,
		epoche: "Erinnerungsort 1915",
		bezug: ["republik"],
		unesco: T,
		satz: "Gründungsmythos und Besuchsziel der ANZAC-Gäste.",
		ungefaehr: true
	},
	{
		id: "synagoge_edirne",
		name: "Große Synagoge von Edirne",
		ort: "Edirne",
		plaka: 22,
		lat: 41.672,
		lon: 26.552,
		epoche: "jüdisch",
		bezug: ["juedisch"],
		unesco: N,
		satz: "Minderheitenerbe der Grenzstadt.",
		serien: ["vielvoelker"]
	},
	{
		id: "karahan_tepe",
		name: "Karahan Tepe",
		ort: "Şanlıurfa",
		plaka: 63,
		lat: 37.093,
		lon: 39.304,
		epoche: "frühmenschlich",
		bezug: ["fruehmenschlich"],
		unesco: N,
		satz: "Schwesterstätte von Göbekli Tepe (Taş-Tepeler-Projekt).",
		serien: ["tas_tepeler"]
	},
	{
		id: "kueltepe",
		name: "Kültepe-Kaniş",
		ort: "Kayseri",
		plaka: 38,
		lat: 38.85,
		lon: 35.633,
		epoche: "Bronzezeit",
		bezug: ["antik"],
		unesco: T,
		satz: "Assyrische Handelskolonie mit Keilschrifttafeln."
	}
];
const ERBE_NACH_ID = Object.fromEntries(ERBE.map((e) => [e.id, e]));
ERBE.filter((e) => e.kirche7);
//#endregion
//#region game/src/data/reich/bau.ts
const DECAY = new Map(NODES.map((n) => [n.id, n.decay]));
/**
* Dauerhafte Verschiebung einer Größe um `verschiebung` Punkte: Das Netz zieht jeden Monat einen Teil der Abweichung zurück
* (Trägheit), also braucht ein Dauerwirkung `verschiebung × Trägheit` je Monat, damit sich das Gleichgewicht um genau so viel verschiebt.
*/
function stuetze(id, verschiebung, provinzen) {
	const decay = DECAY.get(id);
	if (decay === void 0) throw new Error(`Unbekannte Größe: ${id}`);
	return {
		t: "knoten",
		id,
		d: Math.round(verschiebung * decay * 1e3) / 1e3,
		...provinzen ? { provinzen } : {}
	};
}
/** Einmaliger Stoß auf eine Größe. */
const stoss = (id, d, provinzen) => ({
	t: "knoten",
	id,
	d,
	...provinzen ? { provinzen } : {}
});
/** Ort eines Vorhabens aus dem Erbekatalog. */
function ortVon(erbeId) {
	const e = ERBE_NACH_ID[erbeId];
	if (!e) throw new Error(`Unbekannte Stätte: ${erbeId}`);
	return {
		lat: e.lat,
		lon: e.lon,
		plaka: e.plaka,
		name: e.name
	};
}
/** Die zehn Provinzen des Erdbebengebiets von 2023 (Kfz-Kennziffern). */
const ERDBEBENGEBIET = [
	31,
	46,
	27,
	44,
	2,
	80,
	1,
	21,
	63,
	79
];
//#endregion
//#region game/src/sim/haushalt.ts
const s = (id, verschiebung) => {
	const e = stuetze(id, verschiebung);
	return {
		id: e.id,
		d: e.d
	};
};
const st = (id, d) => ({
	id,
	d
});
const POSTEN = [
	{
		id: "soziales",
		name: "Renten und Sozialleistungen",
		seite: "ausgabe",
		schritt: .4,
		unbeliebt: -1,
		plan: "uebertragungen",
		text: "Zuschüsse an die Sozialversicherung, Renten, Sozialhilfe und Familienleistungen.",
		sofort: [st("rentner", 3), st("arbeitnehmer", 1)],
		dauer: [
			s("rentenniveau", 2),
			s("armut", -1.5),
			s("sozialkassen", 1.5)
		],
		gewinner: "Rentner, arme Haushalte",
		verlierer: "Steuerzahler, Märkte (mehr Defizit)",
		kehrseite: "Mehr Leistungen ohne Gegenfinanzierung treiben das Defizit; wer später kürzt, verliert die, die sich darauf verlassen haben."
	},
	{
		id: "personal",
		name: "Gehälter im öffentlichen Dienst",
		seite: "ausgabe",
		schritt: .4,
		unbeliebt: -1,
		plan: "personal",
		text: "Löhne für Beamte, Lehrer, Ärzte, Polizei; Personalausgaben sind der zweitgrößte Posten.",
		sofort: [st("beamte", 3)],
		dauer: [
			s("aerzte", 1),
			s("kostendruck", .4),
			s("korruption", -.3)
		],
		gewinner: "Staatsbedienstete, Krankenhäuser",
		verlierer: "Privatwirtschaft (Lohndruck), Haushalt",
		kehrseite: "Höhere Gehälter im Staat ziehen die Löhne im Privatsektor nach und treiben die Preise."
	},
	{
		id: "investitionen",
		name: "Öffentliche Investitionen",
		seite: "ausgabe",
		schritt: .4,
		unbeliebt: -1,
		plan: "investitionen",
		text: "Straßen, Brücken, Wasser, Schulen: Bauten, die Jahrzehnte halten.",
		sofort: [st("unternehmer", 1)],
		dauer: [
			s("bauwirtschaft", 2),
			s("wachstum_regional", .6),
			s("verkehrsnetz", .8),
			s("produktivitaet", .4)
		],
		gewinner: "Bauwirtschaft, Regionen, Unternehmer",
		verlierer: "Haushalt (Schulden heute)",
		kehrseite: "Die Kosten stehen sofort im Haushalt, die Erträge kommen erst nach Jahren; in der Zwischenzeit steigt die Bauwirtschaft schneller als die Preise."
	},
	{
		id: "gesundheit_bildung",
		name: "Gesundheit und Bildung (laufende Mittel)",
		seite: "ausgabe",
		schritt: .4,
		unbeliebt: -1,
		text: "Betrieb von Krankenhäusern, Schulen und Hochschulen: Personal, Material, Wartung.",
		sofort: [st("junge", 1), st("arbeitnehmer", .5)],
		dauer: [
			s("gesundheitsversorgung", 1.2),
			s("wartezeiten", -1.5),
			s("bildungsqualitaet", 1),
			s("hochschule", .5)
		],
		gewinner: "Patienten, Familien, junge Menschen",
		verlierer: "Haushalt",
		kehrseite: "Mittel allein bauen keine Ärzte und Lehrer: Ohne Ausbildung und Stellen verpufft ein Teil."
	},
	{
		id: "sicherheit",
		name: "Sicherheit und Verteidigung",
		seite: "ausgabe",
		schritt: .4,
		unbeliebt: -1,
		text: "Streitkräfte, Polizei, Grenzschutz und Nachrichtendienste im laufenden Betrieb.",
		sofort: [st("konservative", 1.5)],
		dauer: [
			s("militaer", 1.5),
			s("abschreckung", 1.2),
			s("kriminalitaet", -.5),
			s("terrorgefahr", -.5)
		],
		gewinner: "Sicherheitskräfte, Religiös-Konservative",
		verlierer: "Haushalt, Säkulare Städter, Beziehungen im Nachbarraum",
		kehrseite: "Mehr Rüstung beruhigt im Land und beunruhigt Nachbarn."
	},
	{
		id: "subventionen",
		name: "Preisstützen und Subventionen",
		seite: "ausgabe",
		schritt: .4,
		unbeliebt: -1,
		text: "Verbilligter Strom und Diesel, Agrarhilfen, gedeckelte Preise: der Staat zahlt, damit der Alltag billiger bleibt.",
		sofort: [st("landwirte", 2), st("arbeitnehmer", 1)],
		dauer: [
			s("energiepreise", -2),
			s("lebensmittelpreise", -1.5),
			s("lebenshaltung", -1),
			s("landwirtschaft_einkommen", 1.5),
			s("klimaschutz", -.4)
		],
		gewinner: "Verbraucher, Landwirte",
		verlierer: "Haushalt, Klima",
		kehrseite: "Preise, die der Staat drückt, verschwinden nicht: Sie tauchen im Haushalt wieder auf, und wer Subventionen streicht, sieht sofort die Rechnung."
	},
	{
		id: "einkommensteuer",
		name: "Lohn- und Einkommensteuer",
		seite: "einnahme",
		schritt: .3,
		unbeliebt: 1,
		plan: "est",
		text: "Was Beschäftigte und Selbständige von ihrem Einkommen abgeben.",
		sofort: [st("arbeitnehmer", -3), st("unternehmer", -1)],
		dauer: [
			s("realeinkommen", -1.2),
			s("steuermoral", -.6),
			s("schattenwirtschaft", .5),
			s("ungleichheit", -.4)
		],
		gewinner: "Haushalt",
		verlierer: "Beschäftigte, Selbständige",
		kehrseite: "Die Lohnabzüge treffen Beschäftigte, die sich nicht wehren können; wer kann, weicht in die Schattenwirtschaft aus."
	},
	{
		id: "verbrauchsteuern",
		name: "Mehrwert- und Sonderverbrauchsteuern",
		seite: "einnahme",
		schritt: .3,
		unbeliebt: 1,
		plan: "mwst",
		text: "Steuern auf Konsum, Kraftstoffe, Tabak und Autos; zusammen die größte Einnahmequelle des Staates.",
		sofort: [st("arbeitnehmer", -2), st("rentner", -2)],
		dauer: [
			s("lebenshaltung", 1.5),
			s("ungleichheit", .6),
			s("armut", .4),
			s("kostendruck", .3)
		],
		gewinner: "Haushalt",
		verlierer: "Alle Verbraucher, besonders Arme und Rentner",
		kehrseite: "Steuern auf den Konsum sind schnell erhoben und treffen die Ärmsten am stärksten; sie treiben außerdem die Preise."
	},
	{
		id: "unternehmensteuer",
		name: "Körperschaftsteuer",
		seite: "einnahme",
		schritt: .3,
		unbeliebt: 1,
		plan: "kst",
		text: "Steuer auf die Gewinne von Kapitalgesellschaften.",
		sofort: [st("unternehmer", -3)],
		dauer: [
			s("investitionen", -1),
			s("auslandskapital", -1.2),
			s("gruendungen", -.5),
			s("ungleichheit", -.3)
		],
		gewinner: "Haushalt, Beschäftigte (relativ)",
		verlierer: "Unternehmen, Investoren",
		kehrseite: "Höhere Gewinnsteuern vertreiben Kapital in andere Länder; niedrigere ziehen es an, kosten aber Einnahmen."
	}
];
const POSTEN_NACH_ID = Object.fromEntries(POSTEN.map((p) => [p.id, p]));
/** Vorzeichen der Wirkung auf die Nachfrage: Ausgaben stützen, Steuern dämpfen. */
const vorzeichen = (p) => p.seite === "ausgabe" ? 1 : -1;
/** Die Stufe eines Postens (−2 bis +2). */
function stufeVon(w, id) {
	return haushaltZustand(w).stufen[id] ?? 0;
}
/** Wie viele Milliarden Lira eine Stufe ungefähr bedeutet (Größenordnung, abgeleitet). */
const mrdJeStufe = (p) => Math.round(p.schritt * PLAN_2026.mrdProProzentBip);
/** Kapital, das eine Änderung um `delta` Stufen kostet: Schritte in die unbeliebte Richtung doppelt. */
function kapitalKosten(p, delta) {
	return Math.abs(delta) * (Math.sign(delta) === p.unbeliebt ? 2 : 1);
}
/** Was eine Änderung des Postens sofort bedeutet; Folgewirkungen über zwölf Monate rechnet die Vorschau der Oberfläche. */
function postenVorschau(w, id, stufe) {
	const p = POSTEN_NACH_ID[id];
	const aktuell = stufeVon(w, id);
	const delta = clamp(Math.round(stufe), -2, 2) - aktuell;
	const impuls = delta * p.schritt * vorzeichen(p);
	const kapital = kapitalKosten(p, delta);
	const defizitVorher = defizitJetzt(w);
	const zeilen = [];
	if (delta !== 0) for (const e of [...p.sofort, ...p.dauer]) {
		const node = NET.nodes[NET.index.get(e.id) ?? -1];
		if (!node || !e.d) continue;
		const richtung = Math.sign(e.d * delta) || 1;
		if (zeilen.some((z) => z.text === node.name)) continue;
		zeilen.push({
			text: node.name,
			richtung,
			gut: gutFuer(node.id, richtung),
			nach: 0
		});
	}
	const spiel = w.spiel;
	return {
		ok: !!spiel && delta !== 0 && kannZahlen(spiel.kapital, kapital),
		...delta === 0 ? { grund: "Keine Änderung." } : !spiel ? { grund: "Ohne Spielschleife." } : !kannZahlen(spiel.kapital, kapital) ? { grund: `Das kostet ${kapital} Kapital; vorhanden sind ${Math.floor(spiel.kapital)}.` } : {},
		delta,
		kapital,
		defizitVorher,
		defizitNachher: defizitVorher - impuls,
		impuls,
		zeilen
	};
}
/** Ob die Bewegung einer Größe für das Land gut ist; Gruppen sind zufrieden, wenn ihr Wert steigt. */
function gutFuer(id, richtung) {
	return istGut(id, richtung);
}
function wende(w, p, delta) {
	const e = w.economy;
	e.fiscalImpulse += delta * p.schritt * vorzeichen(p);
	for (const x of p.sofort) wirke(w, x.id, x.d * delta);
}
/** Einen Posten auf eine Stufe stellen (Nachtragshaushalt): kostet Kapital, wirkt sofort auf die Stimmung und dauerhaft auf die Politikfelder. */
function setzePosten(w, id, stufe, ohneKosten = false) {
	const spiel = w.spiel;
	const p = POSTEN_NACH_ID[id];
	if (!spiel || !p) return {
		ok: false,
		text: "Diesen Haushaltsposten gibt es nicht."
	};
	const v = postenVorschau(w, id, stufe);
	if (v.delta === 0) return {
		ok: false,
		text: "Der Posten steht schon auf dieser Stufe."
	};
	if (!ohneKosten && !kannZahlen(spiel.kapital, v.kapital)) return {
		ok: false,
		text: `Das kostet ${v.kapital} Kapital; vorhanden sind ${Math.floor(spiel.kapital)}.`
	};
	const z = haushaltZustand(w);
	const ziel = clamp(Math.round(stufe), -2, 2);
	if (!ohneKosten) spiel.kapital -= v.kapital;
	z.stufen[id] = ziel;
	if (ziel === 0) delete z.stufen[id];
	wende(w, p, v.delta);
	z.letzteAenderung = w.day;
	const mrd = Math.round(Math.abs(v.delta) * mrdJeStufe(p));
	const richtung = v.delta > 0 ? p.seite === "ausgabe" ? "erhöht" : "angehoben" : p.seite === "ausgabe" ? "gekürzt" : "gesenkt";
	const text = `Nachtragshaushalt: ${p.name} ${richtung} (etwa ${mrd.toLocaleString("de-DE")} Mrd. Lira im Jahr).`;
	const folgen = [...impulsKette(v.impuls).slice(0, 4).map(kettenZeile), ...v.zeilen.slice(0, 4).map((x) => `${x.text} ${x.richtung > 0 ? "▲" : "▼"} (dauerhaft)`)];
	z.aenderungen.push({
		tag: w.day,
		datum: w.date,
		posten: p.name,
		text,
		folgen
	});
	if (z.aenderungen.length > 12) z.aenderungen.shift();
	addLog(w, "entscheidung", text, `Defizit ${fmt(v.defizitVorher)} auf ${fmt(v.defizitNachher)} % des BIP. ${p.kehrseite}`);
	addMarke(w, "haushalt", text);
	return {
		ok: true,
		text,
		why: `${v.kapital ? `Kostet ${v.kapital} Kapital. ` : ""}Defizit ${fmt(v.defizitVorher)} auf ${fmt(v.defizitNachher)} % des BIP.`
	};
}
/** Ein einfacher Schritt für Sprachbefehle und die KI, wenn kein bestimmter Posten genannt wird: mehr ausgeben oder sparen. */
function einfacherSchritt(w, art) {
	const kandidaten = art === "mehr" ? [
		"investitionen",
		"soziales",
		"gesundheit_bildung"
	] : [
		"personal",
		"subventionen",
		"sicherheit"
	];
	for (const id of kandidaten) {
		const ziel = stufeVon(w, id) + (art === "mehr" ? 1 : -1);
		if (Math.abs(ziel) <= 2) return {
			id,
			stufe: ziel
		};
	}
	return null;
}
/** Pakete für das Haushaltsjahr: mehrere Regler auf einmal. */
const PAKETE = {
	konsolidieren: {
		name: "Konsolidieren",
		schritte: {
			personal: -1,
			subventionen: -1,
			einkommensteuer: 1
		}
	},
	investieren: {
		name: "Investieren",
		schritte: { investitionen: 2 }
	}
};
/** Ein Paket des Haushaltsjahres anwenden (die Kosten trägt das Ereignis). */
function wendePaketAn(w, id) {
	const paket = PAKETE[id];
	if (!paket || !w.spiel) return;
	for (const [posten, delta] of Object.entries(paket.schritte)) {
		const ziel = clamp(stufeVon(w, posten) + delta, -2, 2);
		if (ziel !== stufeVon(w, posten)) setzePosten(w, posten, ziel, true);
	}
}
/** Einmal im Monat: Dauerwirkungen der Regler und der Zinsdienst des Staates. */
function haushaltMonat(w) {
	if (!w.spiel) return;
	const z = haushaltZustand(w);
	for (const p of POSTEN) {
		const stufe = z.stufen[p.id] ?? 0;
		if (!stufe) continue;
		for (const x of p.dauer) wirke(w, x.id, x.d * stufe);
	}
	const e = w.economy;
	const markt = e.policyRate + e.riskPremium / 100;
	const ziel = ZINSSATZ_START + .25 * (markt - z.marktStart);
	z.zinssatz = clamp(z.zinssatz + .06 * (ziel - z.zinssatz), 3, 60);
	e.zinsMehrlast = e.debtRatio / 100 * (z.zinssatz - ZINSSATZ_START);
}
//#endregion
//#region game/src/data/reich/kultur.ts
/** Zustand der Stätten am Spielbeginn (0 bis 100): Spielparameter, keine Messwerte. */
const STAETTEN_START = {
	ephesos: 74,
	smyrna: 40,
	pergamon: 70,
	thyatira: 30,
	sardes: 62,
	philadelphia: 33,
	laodikeia: 60,
	hagia_sophia: 75,
	suleymaniye: 86,
	topkapi: 82,
	neve_shalom: 78,
	phanar: 70,
	goebekli_tepe: 80,
	catalhoyuk: 64,
	arslantepe: 58,
	hattusa: 66,
	gordion: 60,
	troja: 72,
	nemrut: 68,
	kappadokien: 70,
	pamukkale: 62,
	aphrodisias: 70,
	xanthos: 56,
	aspendos: 72,
	zeugma: 55,
	myra: 56,
	suemela: 60,
	akdamar: 62,
	mor_gabriel: 66,
	petrusgrotte: 45,
	antakya: 22,
	iznik: 50,
	meryem_ana: 76,
	divrigi: 70,
	mevlana: 80,
	esrefoglu: 66,
	bursa: 74,
	selimiye: 84,
	kirkpinar: 70,
	ani: 42,
	ahlat: 45,
	ishak_pascha: 60,
	hasankeyf: 15,
	safranbolu: 68,
	diyarbakir: 62,
	mardin: 60,
	balikligoel: 66,
	hacibektas: 62,
	anitkabir: 88,
	gelibolu: 76,
	synagoge_edirne: 40,
	karahan_tepe: 55,
	kueltepe: 50
};
const restaurierung = (e) => {
	const gross = e.unesco.status === "welterbe";
	const antakya = e.id === "antakya";
	return {
		id: `restaurierung_${e.id}`,
		bereich: "kultur",
		klasse: "restaurierung",
		name: `Restaurierung: ${e.name}`,
		text: `Statik, Dach, Schutz vor Feuchtigkeit und Besuchern: Der Zustand von ${e.name} (${e.ort}) steigt deutlich.`,
		ort: ortVon(e.id),
		provinzen: [e.plaka],
		voraus: [{
			art: "staette-max",
			id: e.id,
			max: 82,
			text: `${e.name} nicht schon in bestem Zustand`
		}],
		kosten: {
			pk: gross ? 3 : 2,
			bau: antakya ? 260 : gross ? 140 : 100,
			monate: gross ? 10 : 8,
			verwaltung: .5
		},
		abschluss: [{
			t: "staette",
			id: e.id,
			d: antakya ? 34 : 26
		}, stoss("identitaet", .3, [e.plaka])],
		kehrseite: "Bindet Restauratoren und Baukapazität; die Stätte ist während der Arbeiten teilweise gesperrt.",
		quelle: "Spielvorhaben; Ort und Bedeutung nach RECHERCHE_KONKURRENZ_FACHBEREICHE.md, Abschnitt 5"
	};
};
const AUSBAU_STAETTEN = [
	"ephesos",
	"pergamon",
	"goebekli_tepe",
	"pamukkale",
	"kappadokien",
	"troja",
	"nemrut",
	"aphrodisias",
	"ani",
	"suemela",
	"mevlana",
	"catalhoyuk",
	"diyarbakir",
	"hagia_sophia"
];
const ausbau = (e) => ({
	id: `ausbau_${e.id}`,
	bereich: "kultur",
	klasse: "ausbau",
	name: `Besucherzentrum und Museum: ${e.name}`,
	text: `Besucherlenkung, Museum und Dienste in ${e.ort}: mehr Gäste, mehr Erklärung, mehr Druck auf die Stätte.`,
	ort: ortVon(e.id),
	provinzen: [e.plaka],
	voraus: [{
		art: "staetten",
		ids: [e.id],
		min: 50,
		text: `${e.name} mindestens in Zustand 50`
	}],
	kosten: {
		pk: 3,
		bau: 220,
		monate: 14,
		verwaltung: 1
	},
	abschluss: [{
		t: "staette",
		id: e.id,
		d: 4
	}, stoss("tourismus", 1.5, [e.plaka])],
	dauer: [stuetze("tourismus", 1.6, [e.plaka]), {
		t: "staette",
		id: e.id,
		d: -.08
	}],
	unterhalt: .4,
	kehrseite: "Mehr Besucher belasten die Stätte: Ihr Zustand sinkt schneller, wenn nicht restauriert wird.",
	quelle: "Spielvorhaben"
});
const RESTAURIERUNGEN = ERBE.map(restaurierung);
const AUSBAUTEN = AUSBAU_STAETTEN.map((id) => ausbau(ERBE.find((e) => e.id === id)));
const serie = (id, name, text, stätten, min, o) => ({
	id,
	bereich: "kultur",
	klasse: "serie",
	name,
	text,
	voraus: [{
		art: "staetten",
		ids: stätten,
		min,
		text: `Alle ${stätten.length} Stätten mindestens in Zustand ${min}`
	}],
	einmalig: true,
	...o
});
const IZ = [
	35,
	45,
	20
];
const SERIEN = [
	serie("serie_kirchen7", "Kirchenroute der Sieben", "Ein Pilger- und Kulturweg zu den sieben Gemeinden der Offenbarung: Ephesos, Smyrna, Pergamon, Thyatira, Sardes, Philadelphia und Laodikeia. Alle sieben liegen im Westen der Türkei.", [
		"ephesos",
		"smyrna",
		"pergamon",
		"thyatira",
		"sardes",
		"philadelphia",
		"laodikeia"
	], 55, {
		ort: {
			lat: 38.5,
			lon: 28,
			plaka: 45,
			name: "Westanatolien"
		},
		provinzen: IZ,
		voraus: [{
			art: "staetten",
			ids: [
				"ephesos",
				"smyrna",
				"pergamon",
				"thyatira",
				"sardes",
				"philadelphia",
				"laodikeia"
			],
			min: 55,
			text: "Alle sieben Stätten mindestens in Zustand 55"
		}, {
			art: "knoten",
			id: "vielfalt",
			min: 38
		}],
		kosten: {
			pk: 6,
			bau: 420,
			monate: 24,
			verwaltung: 1.5,
			schulden: .06
		},
		abschluss: [
			{
				t: "serie",
				serie: "kirchen7",
				d: 10
			},
			stoss("tourismus", 2.5, IZ),
			stoss("ansehen", 2),
			stoss("vielfalt", 3)
		],
		dauer: [
			stuetze("tourismus", 2.2, IZ),
			stuetze("ansehen", 1.4),
			stuetze("vielfalt", 1.6)
		],
		unterhalt: .8,
		kehrseite: "Pilgerströme belasten die Stätten, und ein Teil der Konservativen sieht den christlichen Schwerpunkt kritisch.",
		verlierer: "konservative",
		bild: "kirche",
		zitat: {
			text: "Wer Ohren hat, der höre, was der Geist den Gemeinden sagt!",
			von: "Offenbarung des Johannes 2,7"
		},
		quelle: "Offenbarung 1 bis 3; Orte: RECHERCHE_KONKURRENZ_FACHBEREICHE.md, Abschnitt 5"
	}),
	serie("serie_seldschuken", "Seldschukenroute", "Von Konya über Beyşehir und Divriği bis Ahlat: Moscheen, Hospitäler und Grabmale der Seldschukenzeit.", [
		"divrigi",
		"mevlana",
		"esrefoglu",
		"ahlat"
	], 55, {
		ort: {
			lat: 38.4,
			lon: 37.2,
			plaka: 58,
			name: "Anatolien"
		},
		provinzen: [
			42,
			58,
			13
		],
		kosten: {
			pk: 4,
			bau: 300,
			monate: 18,
			verwaltung: 1,
			schulden: .03
		},
		abschluss: [
			{
				t: "serie",
				serie: "seldschuken",
				d: 8
			},
			stoss("tourismus", 1.5, [
				42,
				58,
				13
			]),
			stoss("identitaet", 1.5)
		],
		dauer: [stuetze("tourismus", 1.4, [
			42,
			58,
			13
		]), stuetze("identitaet", 1)],
		unterhalt: .5,
		kehrseite: "Die Route liegt abseits der Küsten; ohne Verkehrsanbindung kommen wenige Gäste.",
		bild: "kuppel",
		quelle: "Spielvorhaben"
	}),
	serie("serie_sinan", "Sinan-Route", "Süleymaniye in Istanbul und Selimiye in Edirne: zwei Meisterwerke des Baumeisters Sinan.", ["suleymaniye", "selimiye"], 62, {
		ort: {
			lat: 41.35,
			lon: 27.6,
			plaka: 22,
			name: "Thrakien"
		},
		provinzen: [34, 22],
		kosten: {
			pk: 3,
			bau: 180,
			monate: 12,
			verwaltung: .8,
			schulden: .02
		},
		abschluss: [
			{
				t: "serie",
				serie: "sinan",
				d: 6
			},
			stoss("tourismus", 1.2, [34, 22]),
			stoss("identitaet", 1)
		],
		dauer: [stuetze("tourismus", 1, [34, 22]), stuetze("identitaet", .8)],
		unterhalt: .3,
		kehrseite: "Edirne liegt an der Grenze zu Griechenland und Bulgarien; Reisende brauchen schnelle Übergänge.",
		bild: "kuppel",
		quelle: "Spielvorhaben"
	}),
	serie("serie_tas_tepeler", "Taş-Tepeler-Route", "Göbekli Tepe, Karahan Tepe und Balıklıgöl: die Steinzeit, wie sie in Südostanatolien sichtbar wird.", [
		"goebekli_tepe",
		"karahan_tepe",
		"balikligoel"
	], 55, {
		ort: {
			lat: 37.15,
			lon: 38.9,
			plaka: 63,
			name: "Şanlıurfa"
		},
		provinzen: [63],
		kosten: {
			pk: 5,
			bau: 340,
			monate: 20,
			verwaltung: 1.2,
			schulden: .05
		},
		abschluss: [
			{
				t: "serie",
				serie: "tas_tepeler",
				d: 9
			},
			stoss("tourismus", 2.4, [63]),
			stoss("ansehen", 1.2)
		],
		dauer: [stuetze("tourismus", 2.4, [63]), stuetze("ansehen", .8)],
		unterhalt: .6,
		kehrseite: "750.000 Besucher (2024) sind für Göbekli Tepe schon viel; ohne Lenkung leidet die Anlage.",
		bild: "fels",
		quelle: "dailysabah.com (Besucherzahl 2024); Stätten: RECHERCHE_KONKURRENZ_FACHBEREICHE.md"
	}),
	serie("serie_byzanz", "Byzantinische Route", "Hagia Sophia, Kappadokien, Myra, Sümela, İznik und der Phanar: Spuren des Ostens der Christenheit.", [
		"hagia_sophia",
		"kappadokien",
		"myra",
		"suemela",
		"iznik",
		"phanar"
	], 52, {
		ort: {
			lat: 39.5,
			lon: 32,
			plaka: 50,
			name: "Anatolien"
		},
		provinzen: [
			34,
			50,
			7,
			61,
			16
		],
		kosten: {
			pk: 5,
			bau: 360,
			monate: 22,
			verwaltung: 1.3,
			schulden: .05
		},
		abschluss: [
			{
				t: "serie",
				serie: "byzanz",
				d: 8
			},
			stoss("tourismus", 1.8, [
				34,
				50,
				7,
				61,
				16
			]),
			stoss("ansehen", 1.5),
			stoss("vielfalt", 1.5)
		],
		dauer: [
			stuetze("tourismus", 1.6, [
				34,
				50,
				7,
				61,
				16
			]),
			stuetze("ansehen", 1),
			stuetze("vielfalt", 1)
		],
		unterhalt: .7,
		kehrseite: "Die Nutzung der Hagia Sophia bleibt ein Streitpunkt; jede Änderung an den Besuchsregeln wird politisch gelesen.",
		verlierer: "konservative",
		bild: "kuppel",
		quelle: "Spielvorhaben; Streit um die Nutzung: news.un.org/en/story/2020/07/1068151"
	}),
	serie("serie_vielvoelker", "Route der Gemeinschaften", "Synagogen, Klöster, Kirchen und Altstädte, in denen Juden, Armenier, Syrer und Griechen lebten und leben: Sardes, Istanbul, Akdamar, Mor Gabriel, Antakya, Mardin, Ani, Edirne.", [
		"sardes",
		"neve_shalom",
		"phanar",
		"akdamar",
		"mor_gabriel",
		"antakya",
		"ani",
		"mardin",
		"synagoge_edirne"
	], 50, {
		ort: {
			lat: 38,
			lon: 38,
			plaka: 47,
			name: "Anatolien"
		},
		provinzen: [
			45,
			34,
			65,
			47,
			31,
			36,
			22
		],
		voraus: [{
			art: "staetten",
			ids: [
				"sardes",
				"neve_shalom",
				"phanar",
				"akdamar",
				"mor_gabriel",
				"antakya",
				"ani",
				"mardin",
				"synagoge_edirne"
			],
			min: 50,
			text: "Alle neun Stätten mindestens in Zustand 50"
		}, {
			art: "massnahme",
			id: "m_minderheitenrechte",
			min: 45
		}],
		kosten: {
			pk: 8,
			bau: 520,
			monate: 30,
			verwaltung: 2,
			schulden: .08
		},
		abschluss: [
			{
				t: "serie",
				serie: "vielvoelker",
				d: 7
			},
			stoss("vielfalt", 6),
			stoss("ansehen", 2.5),
			stoss("zivilgesellschaft", 2)
		],
		dauer: [
			stuetze("vielfalt", 3),
			stuetze("ansehen", 1.5),
			stuetze("zivilgesellschaft", 1.2),
			stuetze("polarisierung", -1.5)
		],
		unterhalt: 1,
		kehrseite: "Ein Teil der Mehrheitsgesellschaft sieht die Betonung der Minderheiten mit Misstrauen; Nutzungsfragen an den Stätten werden neu verhandelt.",
		verlierer: "konservative",
		bild: "stadt",
		quelle: "Spielvorhaben"
	})
];
const KULTUR_VORHABEN = [
	...[
		{
			id: "wunder_ephesos",
			bereich: "kultur",
			klasse: "wunder",
			name: "Ephesos: Gesamtplan Ausgrabung und Besucherlenkung",
			text: "Ein Jahrzehnteprojekt für die Hafenstadt der Antike: Ausgrabungen, Wiederaufbau ausgewählter Bauten, Wege für Besucher und ein Museum am Fuß des Hügels. Vorbild ist das nationale Programm „Geleceğe Miras“ (Erbe für die Zukunft), das seit 2023 in Ephesos begann.",
			ort: ortVon("ephesos"),
			provinzen: [35, 9],
			voraus: [{
				art: "staetten",
				ids: ["ephesos"],
				min: 60,
				text: "Ephesos mindestens in Zustand 60"
			}, {
				art: "massnahme",
				id: "m_archaeologie",
				min: 50
			}],
			kosten: {
				pk: 8,
				bau: 900,
				monate: 30,
				verwaltung: 2.5,
				schulden: .15
			},
			abschluss: [
				{
					t: "staette",
					id: "ephesos",
					d: 22
				},
				{
					t: "staette",
					id: "meryem_ana",
					d: 12
				},
				stoss("tourismus", 3, [35, 9]),
				stoss("ansehen", 2.5),
				stoss("identitaet", 1.5)
			],
			dauer: [
				stuetze("tourismus", 2.6, [35, 9]),
				stuetze("ansehen", 1.5),
				stuetze("identitaet", 1)
			],
			unterhalt: 1,
			kehrseite: "Ein Massenziel: Der Besucherdruck verschleißt die Stätte, und Anwohner in Selçuk klagen über Lärm und Preise.",
			verlierer: "Anwohner von Selçuk",
			einmalig: true,
			bild: "tempel",
			zitat: {
				text: "Groß ist die Diana der Epheser!",
				von: "Apostelgeschichte 19,28"
			},
			quelle: "turkiyetoday.com (Geleceğe Miras: 251 Grabungsstätten, über 5.000 Beschäftigte)"
		},
		{
			id: "wunder_antakya",
			bereich: "kultur",
			klasse: "wunder",
			name: "Antakya: Wiederaufbau der Altstadt",
			text: "Die Stadt, in der die Jünger zuerst Christen genannt wurden, verlor im Erdbeben 2023 den größten Teil ihrer historischen Bausubstanz. Der Wiederaufbau bringt Gassen, Kirchen, Synagoge und Moscheen zurück und öffnet das Mosaikmuseum wieder voll.",
			ort: ortVon("antakya"),
			provinzen: [31],
			voraus: [{
				art: "knoten",
				id: "erdbebenvorsorge",
				min: 40
			}, {
				art: "massnahme",
				id: "m_denkmalschutz",
				min: 45
			}],
			kosten: {
				pk: 10,
				bau: 1400,
				monate: 48,
				verwaltung: 3,
				schulden: .25
			},
			abschluss: [
				{
					t: "staette",
					id: "antakya",
					d: 55
				},
				{
					t: "staette",
					id: "petrusgrotte",
					d: 30
				},
				stoss("vielfalt", 4, [31]),
				stoss("tourismus", 3, [31]),
				stoss("identitaet", 2)
			],
			dauer: [
				stuetze("vielfalt", 2, [31]),
				stuetze("tourismus", 2.2, [31]),
				stuetze("identitaet", 1)
			],
			unterhalt: 1.2,
			kehrseite: "Wer zurückkehrt, braucht zuerst Wohnungen: Das Kulturprojekt konkurriert mit dem Wohnungsbau um Baukapazität und Verwaltungskraft.",
			verlierer: "Erdbebenüberlebende ohne Wohnung",
			einmalig: true,
			bild: "stadt",
			zitat: {
				text: "… dass die Jünger in Antiochia zuerst Christen genannt wurden.",
				von: "Apostelgeschichte 11,26"
			},
			quelle: "igi-global.com/gateway/chapter/373147 (über 50 Prozent der Bausubstanz verloren); Apg 11,26"
		},
		{
			id: "wunder_goebekli",
			bereich: "kultur",
			klasse: "wunder",
			name: "Göbekli Tepe: Besucherzentrum und Forschungscampus",
			text: "Die älteste bekannte Monumentalanlage der Menschheit bekommt ein Besucherzentrum mit Lenkung, ein Forschungshaus mit Werkstätten und eine Verbindung zu den Schwesterstätten des Taş-Tepeler-Projekts.",
			ort: ortVon("goebekli_tepe"),
			provinzen: [63],
			voraus: [{
				art: "staetten",
				ids: ["goebekli_tepe"],
				min: 60,
				text: "Göbekli Tepe mindestens in Zustand 60"
			}, {
				art: "massnahme",
				id: "m_archaeologie",
				min: 55
			}],
			kosten: {
				pk: 7,
				bau: 700,
				monate: 26,
				verwaltung: 2,
				schulden: .1
			},
			abschluss: [
				{
					t: "staette",
					id: "goebekli_tepe",
					d: 15
				},
				{
					t: "staette",
					id: "karahan_tepe",
					d: 10
				},
				stoss("tourismus", 3.5, [63]),
				stoss("ansehen", 2.5),
				stoss("hochschule", 1.5)
			],
			dauer: [
				stuetze("tourismus", 3, [63]),
				stuetze("ansehen", 1.5),
				stuetze("identitaet", 1.5)
			],
			unterhalt: .9,
			kehrseite: "750.000 Besucher im Jahr 2024 sind schon jetzt viel; ohne Lenkung leidet die Stätte.",
			einmalig: true,
			bild: "fels",
			quelle: "dailysabah.com (Besucher 2024); Stätten: RECHERCHE_KONKURRENZ_FACHBEREICHE.md"
		},
		{
			id: "wunder_ani",
			bereich: "kultur",
			klasse: "wunder",
			name: "Ani öffnen: Grenzübergang, Museum, Wiederherstellung",
			text: "Die mittelalterliche Hauptstadt liegt unmittelbar an der Grenze zu Armenien. Ein geöffneter Übergang, ein Museum und die Sicherung der Bauten machen sie zum Ort der Verständigung, und zu einem Prüfstein der Normalisierung.",
			ort: ortVon("ani"),
			provinzen: [36],
			voraus: [{
				art: "staetten",
				ids: ["ani"],
				min: 45,
				text: "Ani mindestens in Zustand 45"
			}, {
				art: "land",
				land: "ARM",
				dim: "vertrauen",
				min: 45
			}],
			kosten: {
				pk: 9,
				bau: 620,
				monate: 28,
				verwaltung: 2,
				schulden: .08
			},
			abschluss: [
				{
					t: "staette",
					id: "ani",
					d: 32
				},
				{
					t: "land",
					land: "ARM",
					dim: "vertrauen",
					d: 8
				},
				{
					t: "land",
					land: "ARM",
					dim: "konflikt",
					d: -6
				},
				{
					t: "land",
					land: "AZE",
					dim: "vertrauen",
					d: -4
				},
				stoss("tourismus", 2, [36]),
				stoss("ansehen", 3)
			],
			dauer: [
				stuetze("tourismus", 2, [36]),
				stuetze("ansehen", 1.2),
				stuetze("vielfalt", 1)
			],
			unterhalt: .8,
			kehrseite: "Nationalisten sehen darin ein Zugeständnis an Armenien, und Aserbaidschan achtet auf jedes Zeichen der Annäherung.",
			verlierer: "konservative",
			einmalig: true,
			bild: "tor",
			quelle: "Ani: Welterbe 2016 (whc.unesco.org); Grenzöffnung für Drittstaatler und Diplomaten vereinbart, nicht umgesetzt (turkiyetoday.com)"
		},
		{
			id: "wunder_kappadokien",
			bereich: "kultur",
			klasse: "wunder",
			name: "Kappadokien: Schutzplan für die Felslandschaft",
			text: "Begrenzung der Ballonstarts, Lenkung der Besucher und Sicherung der Felsenkirchen: Die berühmteste Landschaft der Türkei soll bleiben, was sie ist.",
			ort: ortVon("kappadokien"),
			provinzen: [50, 38],
			voraus: [{
				art: "staetten",
				ids: ["kappadokien"],
				min: 55,
				text: "Kappadokien mindestens in Zustand 55"
			}],
			kosten: {
				pk: 6,
				bau: 480,
				monate: 22,
				verwaltung: 1.6,
				schulden: .06
			},
			abschluss: [
				{
					t: "staette",
					id: "kappadokien",
					d: 18
				},
				stoss("kulturerbe", 2, [50, 38]),
				stoss("ansehen", 1.5)
			],
			dauer: [
				{
					t: "staette",
					id: "kappadokien",
					d: .1
				},
				stuetze("tourismus", 1.2, [50, 38]),
				stuetze("ansehen", .8)
			],
			unterhalt: .7,
			kehrseite: "Ballonbetreiber und Hotels verlieren Umsatz, wenn die Zahl der Starts begrenzt wird.",
			verlierer: "Ballonbetreiber und Hoteliers in Göreme",
			einmalig: true,
			bild: "fels",
			quelle: "Spielvorhaben; Welterbe seit 1985 (Wikipedia: List of World Heritage Sites in Turkey)"
		},
		{
			id: "programm_erbe_zukunft",
			bereich: "kultur",
			klasse: "grossprojekt",
			name: "Erbe für die Zukunft: Nationalprogramm für Grabungen und Restaurierung",
			text: "Ein Programm für hunderte Grabungsstätten und Denkmäler im ganzen Land, mit Personal, Werkstätten und Museen, nach dem Vorbild des Programms „Geleceğe Miras“ (seit 2023: 251 Grabungsstätten, über 5.000 Beschäftigte).",
			ort: {
				lat: 39,
				lon: 35,
				plaka: 6,
				name: "Türkei"
			},
			voraus: [{
				art: "massnahme",
				id: "m_archaeologie",
				min: 55
			}, {
				art: "massnahme",
				id: "m_denkmalschutz",
				min: 50
			}],
			kosten: {
				pk: 12,
				bau: 1800,
				monate: 60,
				verwaltung: 3.5,
				schulden: .3
			},
			abschluss: [
				{
					t: "serie",
					serie: "alle",
					d: 10
				},
				stoss("identitaet", 3),
				stoss("ansehen", 2),
				stoss("hochschule", 1.5)
			],
			dauer: [
				{
					t: "serie",
					serie: "alle",
					d: .06
				},
				stuetze("tourismus", 1.6),
				stuetze("identitaet", 1.2)
			],
			unterhalt: 1.5,
			kehrseite: "Bindet Restauratoren und Baukapazität über Jahre; andere Bauvorhaben kommen später an die Reihe.",
			einmalig: true,
			bild: "tempel",
			quelle: "turkiyetoday.com (Geleceğe Miras)"
		}
	],
	...SERIEN,
	...AUSBAUTEN,
	...RESTAURIERUNGEN
];
const KULTUR_VORTEILE = [{
	id: "v_kulturnation",
	bereich: "kultur",
	name: "Kulturnation",
	text: "Ein gepflegtes Erbe und ein starker Zusammenhalt machen das Land zu einem Ziel und zu einem Vorbild.",
	voraus: [{
		art: "knoten",
		id: "kulturerbe",
		min: 62
	}, {
		art: "knoten",
		id: "identitaet",
		min: 58
	}],
	dauer: [stuetze("ansehen", 1.5), stuetze("tourismus", 1.5)],
	kehrseite: "Der Vorteil hält nur, solange gepflegt wird: Lässt der Erhalt nach, ist er verloren."
}, {
	id: "v_land_der_vielfalt",
	bereich: "kultur",
	name: "Land der Vielfalt",
	text: "Minderheiten sind sichtbar und anerkannt; Gemeinden gründen Vereine, und Partner in Europa schauen anders auf das Land.",
	voraus: [{
		art: "knoten",
		id: "vielfalt",
		min: 55
	}],
	dauer: [
		stuetze("beziehungen_eu", 2),
		stuetze("zivilgesellschaft", 2),
		stuetze("polarisierung", -2),
		stuetze("konservative", -1.5)
	],
	kehrseite: "Konservative Wähler sehen ihre Mehrheitskultur relativiert."
}];
//#endregion
//#region game/src/data/reich/infrastruktur.ts
const ohne = { abschluss: [] };
const BESTAND = [
	{
		id: "infra_marmaray",
		bereich: "infrastruktur",
		klasse: "grossprojekt",
		name: "Marmaray",
		text: "Bahntunnel unter dem Bosporus: Eröffnung am 29.10.2013, Gesamtlinie 12.03.2019, 75.000 Fahrgäste je Stunde und Richtung. Bau ab 2004 mit japanischem Kredit (111 Mrd. Yen); Funde in Yenikapı verzögerten ihn um etwa vier Jahre.",
		ort: {
			lat: 41,
			lon: 28.98,
			plaka: 34,
			name: "İstanbul"
		},
		provinzen: [34],
		voraus: [],
		kosten: {
			pk: 0,
			bau: 0,
			monate: 1
		},
		...ohne,
		dauer: [
			stuetze("bahnnetz", 3, [34]),
			stuetze("stau", -3, [34]),
			stuetze("logistik", 1.2, [34])
		],
		unterhalt: .5,
		kehrseite: "Ein Tunnel im Erdbebenland: Wartung und Erdbebensicherheit binden Verwaltungskraft.",
		bild: "bahn",
		quelle: "en.wikipedia.org/wiki/Marmaray",
		start: {
			status: "fertig",
			zustand: 84
		}
	},
	{
		id: "infra_osmangazi",
		bereich: "infrastruktur",
		klasse: "grossprojekt",
		name: "Osmangazi-Brücke",
		text: "Hängebrücke über den Golf von İzmit, eröffnet am 01.07.2016, gebaut und betrieben von Privaten (BOT). Der Staat garantiert 40.000 Fahrzeuge am Tag; darunter zahlt er drauf. Die Strecke Istanbul–İzmir wird um etwa 140 km kürzer.",
		ort: {
			lat: 40.755,
			lon: 29.516,
			plaka: 41,
			name: "Kocaeli"
		},
		provinzen: [
			41,
			77,
			16
		],
		voraus: [],
		kosten: {
			pk: 0,
			bau: 0,
			monate: 1
		},
		...ohne,
		dauer: [stuetze("verkehrsnetz", 2.2, [
			41,
			77,
			16
		]), stuetze("logistik", 1, [
			41,
			77,
			16
		])],
		unterhalt: .4,
		kehrseite: "Die Garantie bindet den Haushalt: Liegt die Nutzung unter dem Sollwert, zahlt der Staat die Differenz.",
		bild: "bruecke",
		quelle: "en.wikipedia.org/wiki/Osman_Gazi_Bridge; bianet.org (Garantiezahlungen)",
		start: {
			status: "fertig",
			zustand: 80
		}
	},
	{
		id: "infra_flughafen",
		bereich: "infrastruktur",
		klasse: "grossprojekt",
		name: "Istanbuler Flughafen",
		text: "Eröffnet am 29.10.2018 nach Bau ab Mai 2015, betrieben als BOT für 25 Jahre; 90 Mio. Passagiere je Jahr in der ersten Ausbaustufe. Für den Bau wurden 657.950 Bäume entfernt, offiziell starben 27 Arbeiter.",
		ort: {
			lat: 41.262,
			lon: 28.728,
			plaka: 34,
			name: "İstanbul"
		},
		provinzen: [34],
		voraus: [],
		kosten: {
			pk: 0,
			bau: 0,
			monate: 1
		},
		...ohne,
		dauer: [
			stuetze("tourismus", 2, [34]),
			stuetze("logistik", 2.5, [34]),
			stuetze("export", 1)
		],
		unterhalt: .8,
		kehrseite: "Ein Drehkreuz ist ein Ziel: Betrieb und Sicherheit binden Verwaltungskraft, und der Bau bleibt im Gedächtnis (Wald, Arbeitertote).",
		bild: "flughafen",
		quelle: "en.wikipedia.org/wiki/Istanbul_Airport",
		start: {
			status: "fertig",
			zustand: 86
		}
	},
	{
		id: "infra_yht",
		bereich: "infrastruktur",
		klasse: "grossprojekt",
		name: "Hochgeschwindigkeitsbahn",
		text: "Ankara–Eskişehir 2009, –Konya 2011, –Istanbul 2014, –Sivas 2023: 1.385 km, 12,4 Mio. Fahrgäste 2024. Der Ausbau nach İzmir ist geplant.",
		ort: {
			lat: 39.936,
			lon: 32.844,
			plaka: 6,
			name: "Ankara"
		},
		provinzen: [
			6,
			26,
			11,
			54,
			41,
			34,
			42,
			66,
			58
		],
		voraus: [],
		kosten: {
			pk: 0,
			bau: 0,
			monate: 1
		},
		...ohne,
		dauer: [
			stuetze("bahnnetz", 4, [
				6,
				26,
				11,
				54,
				41,
				34,
				42,
				66,
				58
			]),
			stuetze("logistik", 1.5),
			stuetze("wachstum_regional", 1.2, [
				26,
				42,
				58
			])
		],
		unterhalt: .7,
		kehrseite: "Gleise, Signale und Züge altern; ohne Instandhaltung fallen Verspätungen und Ausfälle auf.",
		bild: "bahn",
		quelle: "en.wikipedia.org/wiki/High-speed_rail_in_Turkey",
		start: {
			status: "fertig",
			zustand: 78
		}
	},
	{
		id: "infra_canakkale1915",
		bereich: "infrastruktur",
		klasse: "grossprojekt",
		name: "1915-Çanakkale-Brücke",
		text: "Hängebrücke über die Dardanellen, Bau ab März 2017, eröffnet am 18.03.2022, 2.023 m Spannweite. Der Staat garantierte 16,4 Mio. Fahrten im Jahr; die tatsächliche Nutzung lag deutlich darunter.",
		ort: {
			lat: 40.34,
			lon: 26.636,
			plaka: 17,
			name: "Çanakkale"
		},
		provinzen: [17, 59],
		voraus: [],
		kosten: {
			pk: 0,
			bau: 0,
			monate: 1
		},
		...ohne,
		dauer: [stuetze("verkehrsnetz", 1.8, [17, 59]), stuetze("tourismus", .6, [17])],
		unterhalt: .4,
		kehrseite: "Eine Garantie über dem Bedarf: Der Haushalt trägt die Lücke, solange die Nutzung nicht steigt.",
		bild: "bruecke",
		quelle: "en.wikipedia.org/wiki/1915_Çanakkale_Bridge",
		start: {
			status: "fertig",
			zustand: 82
		}
	},
	{
		id: "infra_gap",
		bereich: "infrastruktur",
		klasse: "grossprojekt",
		name: "Südostanatolien-Projekt (GAP) mit Atatürk-Damm",
		text: "22 Dämme und 19 Kraftwerke am Euphrat und Tigris; der Atatürk-Damm (Bau 1983 bis 1990) liefert 2.400 MW und bewässert 4.760 km². Ilısu (2020) überflutete Hasankeyf.",
		ort: {
			lat: 37.482,
			lon: 38.318,
			plaka: 2,
			name: "Adıyaman"
		},
		provinzen: [
			63,
			2,
			21,
			47,
			56,
			73,
			72,
			27
		],
		voraus: [],
		kosten: {
			pk: 0,
			bau: 0,
			monate: 1
		},
		...ohne,
		dauer: [
			stuetze("wasserversorgung", 3, [
				63,
				2,
				21,
				47,
				56,
				73,
				72,
				27
			]),
			stuetze("ernte", 2, [
				63,
				2,
				21,
				47
			]),
			stuetze("stromversorgung", 2, [
				63,
				2,
				21,
				47,
				72
			]),
			stuetze("duerre", -2.5, [
				63,
				2,
				21,
				47
			])
		],
		unterhalt: .9,
		kehrseite: "Wasser flussabwärts: Irak und Syrien verlangen Abflussmengen; jede Trockenzeit verschärft den Streit.",
		verlierer: "Irak und Syrien",
		bild: "damm",
		quelle: "en.wikipedia.org/wiki/Southeastern_Anatolia_Project; /Atatürk_Dam; /Ilisu_Dam",
		start: {
			status: "fertig",
			zustand: 76
		}
	},
	{
		id: "infra_btk",
		bereich: "infrastruktur",
		klasse: "grossprojekt",
		name: "Bahn Baku–Tiflis–Kars",
		text: "826 km, eröffnet am 30.10.2017; seit dem 02.06.2026 im Volllastbetrieb, der Personenverkehr Kars–Tiflis fehlt noch. Verbindet die Türkei über Georgien und Aserbaidschan mit dem Kaspischen Meer.",
		ort: {
			lat: 40.608,
			lon: 43.096,
			plaka: 36,
			name: "Kars"
		},
		provinzen: [36, 75],
		voraus: [],
		kosten: {
			pk: 0,
			bau: 0,
			monate: 1
		},
		...ohne,
		dauer: [
			stuetze("logistik", 2, [36, 75]),
			stuetze("export", .6),
			{
				t: "land",
				land: "GEO",
				dim: "vertrauen",
				d: .04
			},
			{
				t: "land",
				land: "AZE",
				dim: "handel",
				d: .05
			}
		],
		unterhalt: .4,
		kehrseite: "Die Strecke hängt von zwei Nachbarn ab: Georgische Innenpolitik und aserbaidschanische Interessen bestimmen den Takt mit.",
		bild: "bahn",
		quelle: "dailysabah.com (Volllastbetrieb 2026); en.wikipedia.org/wiki/Baku–Tbilisi–Kars_railway",
		start: {
			status: "fertig",
			zustand: 74
		}
	},
	{
		id: "infra_stromnetz",
		bereich: "infrastruktur",
		klasse: "grossprojekt",
		name: "Übertragungsnetz (TEİAŞ)",
		text: "72.000 km Leitungen und elf Verbindungen ins Ausland. Der landesweite Blackout von 2015 zeigte die schwache Ost-West-Achse.",
		ort: {
			lat: 39.9,
			lon: 32.85,
			plaka: 6,
			name: "Türkei"
		},
		voraus: [],
		kosten: {
			pk: 0,
			bau: 0,
			monate: 1
		},
		...ohne,
		dauer: [stuetze("stromversorgung", 3), stuetze("energiepreise", -.8)],
		unterhalt: .9,
		kehrseite: "Ein altes Netz mit vielen Engpässen: Erneuerbare und neue Kraftwerke kommen nur an, wenn die Leitungen mitwachsen.",
		quelle: "en.wikipedia.org/wiki/Electricity_sector_in_Turkey",
		start: {
			status: "fertig",
			zustand: 66
		}
	},
	{
		id: "infra_akkuyu",
		bereich: "infrastruktur",
		klasse: "grossprojekt",
		name: "Kernkraftwerk Akkuyu",
		text: "Vier Blöcke zu je 1.114 MW, etwa zehn Prozent des Strombedarfs; Rosatom baut, besitzt und betreibt (Vertrag 2010). Im September 2026 laufen Kalttests, Brennstoff ist noch nicht geladen. Sanktionen erschweren die Zahlungen.",
		ort: {
			lat: 36.144,
			lon: 33.541,
			plaka: 33,
			name: "Mersin"
		},
		provinzen: [33],
		voraus: [],
		kosten: {
			pk: 0,
			bau: 2200,
			monate: 60,
			verwaltung: 2
		},
		abschluss: [
			stoss("stromversorgung", 5),
			stoss("energieimporte", -3),
			{
				t: "land",
				land: "RUS",
				dim: "vertrauen",
				d: 3
			}
		],
		dauer: [
			stuetze("stromversorgung", 3),
			stuetze("energieimporte", -2),
			stuetze("beziehungen_russland", 1.2)
		],
		unterhalt: 1.4,
		kehrseite: "Russland baut, besitzt und betreibt: eine Abhängigkeit für Jahrzehnte, dazu Sorgen um die Sicherheit im Erdbebenland.",
		verlierer: "staedtische_saekulare",
		einmalig: true,
		bild: "reaktor",
		quelle: "world-nuclear-news.org (Kalttests, 21.09.2026); en.wikipedia.org/wiki/Akkuyu_Nuclear_Power_Plant",
		start: {
			status: "im_bau",
			fortschritt: .75
		}
	},
	{
		id: "infra_wiederaufbau",
		bereich: "infrastruktur",
		klasse: "grossprojekt",
		name: "Wiederaufbau im Erdbebengebiet",
		text: "Nach dem Beben vom 06.02.2023 versprach die Regierung 319.000 Wohnungen in einem Jahr; im Februar 2025 waren 201.431 übergeben, das Ziel wurde auf 453.000 bis Ende 2025 angehoben. Rund 200.000 Arbeiter auf etwa 3.500 Baustellen.",
		ort: {
			lat: 37.583,
			lon: 36.933,
			plaka: 46,
			name: "Kahramanmaraş"
		},
		provinzen: ERDBEBENGEBIET,
		voraus: [],
		kosten: {
			pk: 0,
			bau: 2600,
			monate: 72,
			verwaltung: 3,
			schulden: .3
		},
		abschluss: [
			stoss("wohnungsbau", 6, ERDBEBENGEBIET),
			stoss("erdbebenvorsorge", 4, ERDBEBENGEBIET),
			stoss("vertrauen_regierung", 2)
		],
		dauer: [stuetze("wohnungsbau", 3, ERDBEBENGEBIET), stuetze("mieten", -2, ERDBEBENGEBIET)],
		unterhalt: .6,
		kehrseite: "Versprechen gegen Lieferung: Jede Verzögerung wird als gebrochenes Versprechen gelesen, und die Baunachfrage treibt die Preise.",
		verlierer: "Erdbebenüberlebende in Containern",
		einmalig: true,
		bild: "stadt",
		quelle: "dailysabah.com (Wiederaufbau); turkishminute.com/2025/02/05",
		start: {
			status: "im_bau",
			fortschritt: .5
		}
	}
];
const ZUKUNFT = [
	{
		id: "infra_kanal_istanbul",
		bereich: "infrastruktur",
		klasse: "wunder",
		name: "Kanal Istanbul",
		text: "Eine künstliche Wasserstraße von etwa 45 km zwischen Schwarzem Meer und Marmarameer, angekündigt am 27.04.2011. Die Sazlıdere-Brücke wurde am 26.06.2021 begonnen; der Aushub hat nach Berichten von Mai 2025 nicht begonnen.",
		ort: {
			lat: 41.2,
			lon: 28.75,
			plaka: 34,
			name: "İstanbul"
		},
		provinzen: [34],
		voraus: [{
			art: "knoten",
			id: "auslandskapital",
			min: 40
		}, {
			art: "knoten",
			id: "vertrauen_maerkte",
			min: 42
		}],
		kosten: {
			pk: 12,
			bau: 3200,
			monate: 60,
			verwaltung: 3,
			schulden: .9
		},
		abschluss: [
			stoss("logistik", 3, [34, 59]),
			{
				t: "land",
				land: "RUS",
				dim: "vertrauen",
				d: -6
			},
			{
				t: "land",
				land: "UKR",
				dim: "vertrauen",
				d: -2
			},
			stoss("wasserversorgung", -3, [34]),
			stoss("ansehen", 1)
		],
		dauer: [
			stuetze("logistik", 2.5, [34, 59]),
			stuetze("export", 1),
			stuetze("wasserversorgung", -1.5, [34]),
			stuetze("staedtische_saekulare", -2)
		],
		unterhalt: 1.2,
		kehrseite: "Trinkwasser aus dem Terkos- und Durusu-Gebiet und der Vertrag von Montreux (Meerengenregime): Umweltverbände, Opposition und Anrainer lehnen ab.",
		verlierer: "staedtische_saekulare",
		einmalig: true,
		bild: "kanal",
		quelle: "en.wikipedia.org/wiki/Kanal_Istanbul; erkansaka.net/2025/05/02/kanal-istanbul-project-analysis-2025"
	},
	{
		id: "infra_yht_izmir",
		bereich: "infrastruktur",
		klasse: "grossprojekt",
		name: "Hochgeschwindigkeitsbahn Ankara–İzmir",
		text: "Die Verbindung der Hauptstadt mit der Ägäis über Afyon, Uşak und Manisa. Ein Inbetriebnahmetermin (vorläufig 2027) ist unbestätigt.",
		ort: {
			lat: 38.6,
			lon: 29.4,
			plaka: 64,
			name: "Uşak"
		},
		provinzen: [
			6,
			3,
			64,
			45,
			35
		],
		voraus: [{
			art: "massnahme",
			id: "m_bahn",
			min: 45
		}],
		kosten: {
			pk: 7,
			bau: 1500,
			monate: 40,
			verwaltung: 2,
			schulden: .35
		},
		abschluss: [
			stoss("bahnnetz", 6, [
				6,
				3,
				64,
				45,
				35
			]),
			stoss("stau", -2, [35]),
			stoss("wachstum_regional", 2, [
				3,
				64,
				45
			])
		],
		dauer: [
			stuetze("bahnnetz", 5, [
				6,
				3,
				64,
				45,
				35
			]),
			stuetze("logistik", 1.5),
			stuetze("wachstum_regional", 1.5, [
				3,
				64,
				45
			])
		],
		unterhalt: .8,
		kehrseite: "Bindet Baukapazität für Jahre; Landwirte an der Trasse verlieren Flächen.",
		verlierer: "landwirte",
		einmalig: true,
		bild: "bahn",
		quelle: "en.wikipedia.org/wiki/High-speed_rail_in_Turkey (Termin unbestätigt)"
	},
	{
		id: "infra_strom_ost",
		bereich: "infrastruktur",
		klasse: "grossprojekt",
		name: "Ost-West-Stromachse",
		text: "Leitungen und Umspannwerke, die den Strom aus dem Westen und Süden in den Osten bringen und Ausfälle verhindern.",
		ort: {
			lat: 39.9,
			lon: 41.3,
			plaka: 25,
			name: "Erzurum"
		},
		provinzen: [
			25,
			4,
			36,
			65,
			12,
			24,
			44,
			23
		],
		voraus: [{
			art: "massnahme",
			id: "m_netzausbau",
			min: 45
		}],
		kosten: {
			pk: 5,
			bau: 800,
			monate: 24,
			verwaltung: 1.6,
			schulden: .15
		},
		abschluss: [stoss("stromversorgung", 5, [
			25,
			4,
			36,
			65,
			12,
			24,
			44,
			23
		])],
		dauer: [stuetze("stromversorgung", 4, [
			25,
			4,
			36,
			65,
			12,
			24,
			44,
			23
		])],
		unterhalt: .5,
		kehrseite: "Trassen führen durch Weiden und Schutzgebiete; Anwohner klagen gegen Masten.",
		verlierer: "landwirte",
		bild: "turm",
		quelle: "Spielvorhaben; Ausgangslage: en.wikipedia.org/wiki/Electricity_sector_in_Turkey"
	},
	{
		id: "infra_btk_personen",
		bereich: "infrastruktur",
		klasse: "ausbau",
		name: "Bahn Kars–Tiflis: Personenverkehr",
		text: "Die fehlende Personenverbindung auf der Bahn Baku–Tiflis–Kars: Fahrgäste statt nur Güter.",
		ort: {
			lat: 40.608,
			lon: 43.096,
			plaka: 36,
			name: "Kars"
		},
		provinzen: [36, 75],
		voraus: [{
			art: "bestand",
			id: "infra_btk"
		}],
		kosten: {
			pk: 3,
			bau: 260,
			monate: 12,
			verwaltung: 1
		},
		abschluss: [
			{
				t: "land",
				land: "GEO",
				dim: "vertrauen",
				d: 3
			},
			{
				t: "land",
				land: "AZE",
				dim: "vertrauen",
				d: 2
			},
			stoss("ansehen", 1)
		],
		dauer: [stuetze("tourismus", .8, [36, 75]), stuetze("logistik", .6, [36, 75])],
		unterhalt: .3,
		kehrseite: "Ein zweites Gleis für Personen bindet Baukapazität und braucht Abstimmung mit Georgien.",
		einmalig: true,
		bild: "bahn",
		quelle: "dailysabah.com (2026)"
	},
	{
		id: "infra_bosporus_tunnel3",
		bereich: "infrastruktur",
		klasse: "grossprojekt",
		name: "Großer Istanbuler Tunnel",
		text: "Ein dritter Querungstunnel unter dem Bosporus für Straße und Schiene, seit Jahren angekündigt.",
		ort: {
			lat: 41.03,
			lon: 29,
			plaka: 34,
			name: "İstanbul"
		},
		provinzen: [34],
		voraus: [{
			art: "bestand",
			id: "infra_marmaray"
		}],
		kosten: {
			pk: 6,
			bau: 1300,
			monate: 36,
			verwaltung: 2,
			schulden: .4
		},
		abschluss: [stoss("stau", -3, [34]), stoss("verkehrsnetz", 3, [34])],
		dauer: [stuetze("stau", -3, [34]), stuetze("verkehrsnetz", 2.5, [34])],
		unterhalt: .6,
		kehrseite: "Ein weiterer Tunnel im Erdbebenland: Bau und Betrieb sind teuer und riskant.",
		einmalig: true,
		bild: "bruecke",
		quelle: "angekündigt (Spielvorhaben, kein Baubeginn)"
	},
	{
		id: "infra_wasser_ost",
		bereich: "infrastruktur",
		klasse: "grossprojekt",
		name: "Wasserleitungen und Speicher im Osten",
		text: "Leitungen, Speicher und Bewässerung für die Provinzen, in denen Trockenzeiten am härtesten treffen.",
		ort: {
			lat: 39,
			lon: 42,
			plaka: 65,
			name: "Ostanatolien"
		},
		provinzen: [
			65,
			4,
			13,
			49,
			12,
			21,
			47,
			72,
			73
		],
		voraus: [{
			art: "massnahme",
			id: "m_wasserleitungen",
			min: 45
		}],
		kosten: {
			pk: 5,
			bau: 700,
			monate: 26,
			verwaltung: 1.5,
			schulden: .2
		},
		abschluss: [stoss("wasserversorgung", 5, [
			65,
			4,
			13,
			49,
			12,
			21,
			47,
			72,
			73
		]), stoss("duerre", -4, [
			65,
			4,
			13,
			49,
			12,
			21,
			47,
			72,
			73
		])],
		dauer: [stuetze("wasserversorgung", 4, [
			65,
			4,
			13,
			49,
			12,
			21,
			47,
			72,
			73
		]), stuetze("landflucht", -1.5, [
			65,
			4,
			13,
			49,
			12,
			21,
			47,
			72,
			73
		])],
		unterhalt: .6,
		kehrseite: "Wasser für den Osten fehlt flussabwärts: Streit mit dem Irak wächst, wenn mehr entnommen wird.",
		verlierer: "Irak",
		bild: "damm",
		quelle: "Spielvorhaben"
	},
	{
		id: "infra_glasfaser",
		bereich: "infrastruktur",
		klasse: "grossprojekt",
		name: "Glasfaser bis ins Dorf",
		text: "Glasfaser und Mobilfunk auch dort, wo bisher niemand ausbaut.",
		voraus: [{
			art: "massnahme",
			id: "m_breitband",
			min: 45
		}],
		kosten: {
			pk: 5,
			bau: 650,
			monate: 24,
			verwaltung: 1.4,
			schulden: .2
		},
		abschluss: [stoss("internet", 6), stoss("landflucht", -1)],
		dauer: [
			stuetze("internet", 5),
			stuetze("landflucht", -1.5),
			stuetze("gruendungen", 1)
		],
		unterhalt: .5,
		kehrseite: "Für kleine Orte rechnet sich der Ausbau nie: Er bleibt dauerhaft auf Zuschüsse angewiesen.",
		einmalig: true,
		bild: "turm",
		quelle: "Spielvorhaben"
	},
	{
		id: "infra_sozialwohnungen",
		bereich: "infrastruktur",
		klasse: "grossprojekt",
		name: "Sozialwohnungsprogramm der Wohnungsbaubehörde (TOKİ)",
		text: "Ein Programm für bezahlbaren Wohnraum in Städten mit hohen Mieten. Die Wohnungsbaubehörde TOKİ baut seit 1984.",
		voraus: [{
			art: "knoten",
			id: "mieten",
			min: 55
		}],
		kosten: {
			pk: 6,
			bau: 1500,
			monate: 36,
			verwaltung: 2,
			schulden: .4
		},
		abschluss: [stoss("wohnungsbau", 5), stoss("mieten", -3)],
		dauer: [
			stuetze("wohnungsbau", 4),
			stuetze("mieten", -3),
			stuetze("bauwirtschaft", 1.5)
		],
		unterhalt: .5,
		kehrseite: "Neubau am Stadtrand: Wege werden länger, und Bauunternehmen treiben die Preise, wenn die Baukapazität knapp ist.",
		verlierer: "unternehmer",
		einmalig: true,
		bild: "stadt",
		quelle: "en.wikipedia.org/wiki/TOKİ (seit 1984)"
	},
	{
		id: "infra_sinop",
		bereich: "infrastruktur",
		klasse: "grossprojekt",
		name: "Kernkraftwerk Sinop",
		text: "Ein zweites Kernkraftwerk am Schwarzen Meer; der Partner ist offen.",
		ort: {
			lat: 42,
			lon: 35.15,
			plaka: 57,
			name: "Sinop"
		},
		provinzen: [57],
		voraus: [{
			art: "bestand",
			id: "infra_akkuyu"
		}],
		kosten: {
			pk: 9,
			bau: 2600,
			monate: 60,
			verwaltung: 3,
			schulden: .6
		},
		abschluss: [stoss("stromversorgung", 4), stoss("energieimporte", -2)],
		dauer: [
			stuetze("stromversorgung", 3),
			stuetze("energieimporte", -2),
			stuetze("staedtische_saekulare", -1.5)
		],
		unterhalt: 1.4,
		kehrseite: "Erdbebenland und der Standort am Meer: Widerstand vor Ort, und die Wahl des Partners entscheidet über eine neue Abhängigkeit.",
		verlierer: "staedtische_saekulare",
		einmalig: true,
		bild: "reaktor",
		quelle: "Spielvorhaben"
	}
];
/** Sanierung je Bestandsstück: Wartung ist ein Vorhaben mit Baukapazität, nicht mit Geld. */
const sanierung = (b) => ({
	id: `sanierung_${b.id.replace("infra_", "")}`,
	bereich: "infrastruktur",
	klasse: "restaurierung",
	name: `Sanierung: ${b.name}`,
	text: `Wartung und Erneuerung von ${b.name}: Der Zustand steigt, und der Nutzen der Anlage bleibt erhalten.`,
	...b.ort ? { ort: b.ort } : {},
	...b.provinzen ? { provinzen: b.provinzen } : {},
	voraus: [{
		art: "bestand",
		id: b.id
	}],
	kosten: {
		pk: 2,
		bau: 150,
		monate: 8,
		verwaltung: .6
	},
	abschluss: [{
		t: "bestand",
		id: b.id,
		d: 26
	}],
	kehrseite: "Bindet Baukapazität, die dann für Neubauten fehlt.",
	quelle: "Spielvorhaben"
});
const INFRA_VORHABEN = [
	...BESTAND,
	...ZUKUNFT,
	...BESTAND.filter((b) => b.start?.status === "fertig").map(sanierung)
];
const INFRA_VORTEILE = [{
	id: "v_drehkreuz",
	bereich: "infrastruktur",
	name: "Drehkreuz zwischen Europa und Asien",
	text: "Flughafen, Bahntunnel und Brücken funktionieren zusammen: Das Land ist Umsteigeort für Waren und Reisende.",
	voraus: [
		{
			art: "bestand",
			id: "infra_flughafen"
		},
		{
			art: "bestand",
			id: "infra_marmaray"
		},
		{
			art: "bestand",
			id: "infra_osmangazi"
		},
		{
			art: "knoten",
			id: "wartungszustand",
			min: 52
		}
	],
	dauer: [
		stuetze("logistik", 2.5),
		stuetze("export", 1.2),
		stuetze("ansehen", 1)
	],
	kehrseite: "Der Vorteil hängt an der Pflege: Fällt der Zustand der Anlagen, ist er verloren."
}, {
	id: "v_land_der_bruecken",
	bereich: "infrastruktur",
	name: "Land der großen Bauten",
	text: "Fünf fertige Großprojekte machen das Land zum Vorbild: Investoren und Bauunternehmen vertrauen auf die Verwaltung.",
	voraus: [{
		art: "knoten",
		id: "bauwirtschaft",
		min: 62
	}, {
		art: "knoten",
		id: "verkehrsnetz",
		min: 58
	}],
	dauer: [stuetze("auslandskapital", 2), stuetze("bauwirtschaft", 1.5)],
	kehrseite: "Große Bauten wecken Erwartungen; Verzug und Garantien werden im Ausland genau beobachtet."
}];
//#endregion
//#region game/src/data/reich/recht.ts
const inst = (id, name, text, kehrseite, zustand, unterhalt) => ({
	id,
	bereich: "recht",
	klasse: "institution",
	name,
	text,
	voraus: [],
	kosten: {
		pk: 0,
		bau: 0,
		monate: 1
	},
	abschluss: [],
	unterhalt,
	kehrseite,
	bild: "gericht",
	quelle: "RECHERCHE_KONKURRENZ_FACHBEREICHE.md, Abschnitt 2",
	start: {
		status: "fertig",
		zustand
	}
});
const RECHT_VORHABEN = [
	inst("recht_aym", "Verfassungsgericht", "15 Mitglieder: 12 ernennt der Präsident (3 aus dem Kassationshof, 2 aus dem Staatsrat, 3 auf Vorschlag des Hochschulrats, 4 frei), 3 wählt das Parlament. Die Individualbeschwerde gibt es seit dem 23.09.2012; ein Verfahren dauerte 2024 im Schnitt 512 Tage (+61 Prozent).", "Wer die Sitze besetzt, prägt das Gericht: Jede Ernennung ist eine Entscheidung zwischen Loyalität und Unabhängigkeit.", 62, .3),
	inst("recht_hsk", "Richter- und Staatsanwaltsrat (HSK)", "13 Mitglieder, Vorsitz führt der Justizminister; der Präsident ernennt 4, das Parlament wählt 7 (2/3, dann 3/5, dann Los). Der Rat entscheidet über Ernennung, Versetzung und Beförderung; Untersuchungen gegen Richter brauchen die Erlaubnis des Ministers. Kein Mitglied wird von Richterkollegen gewählt.", "Der Rat hält die Justiz in der Hand: Wer ihn kontrolliert, kontrolliert die Karrieren, und wer ihn freigibt, verliert Steuerbarkeit.", 60, .3),
	inst("recht_vollzug", "Strafvollzug", "304.956 Plätze bei 433.520 Häftlingen im August 2026, etwa 142 Prozent; 65.227 sitzen in Untersuchungshaft.", "Überfüllte Anstalten schaden dem Ruf der Justiz und der Wiedereingliederung; neue Plätze allein lösen es nicht.", 45, .6),
	inst("recht_anwaltskammern", "Anwaltskammern", "80 Kammern. Ein Gesetz von 2020 erlaubt weitere Kammern ab 5.000 Anwälten (Istanbul, Ankara, İzmir); alle 80 Kammern lehnten es ab, das Verfassungsgericht wies die Klage ab.", "Freie Anwälte sind unbequem: Wer sie spaltet, gewinnt Einfluss und verliert an Legitimität.", 65, .1),
	{
		id: "recht_digitale_justiz",
		bereich: "recht",
		klasse: "grossprojekt",
		name: "Digitale Justiz",
		text: "Elektronische Akten, Fernverhandlungen und automatische Terminierung in allen Gerichten.",
		voraus: [{
			art: "massnahme",
			id: "m_verwaltungsdigital",
			min: 45
		}],
		kosten: {
			pk: 5,
			bau: 420,
			monate: 24,
			verwaltung: 1.5,
			schulden: .05
		},
		abschluss: [stoss("justiz_effizienz", 6)],
		dauer: [stuetze("justiz_effizienz", 5), stuetze("justiz_kapazitaet", 1.5)],
		unterhalt: .6,
		kehrseite: "Schulung und Datenschutz kosten Zeit; kleine Kanzleien und ältere Richter kommen schwer mit.",
		verlierer: "anwaltsautonomie",
		einmalig: true,
		bild: "gericht",
		quelle: "Spielvorhaben"
	},
	{
		id: "recht_justizakademie",
		bereich: "recht",
		klasse: "institution",
		name: "Justizakademie",
		text: "Eine Ausbildungsstätte für Richter, Staatsanwälte und Gerichtspersonal mit festen Standards.",
		voraus: [{
			art: "massnahme",
			id: "m_richterstellen",
			min: 48
		}],
		kosten: {
			pk: 4,
			bau: 260,
			monate: 20,
			verwaltung: 1.2,
			schulden: .03
		},
		abschluss: [stoss("justiz_kapazitaet", 5), stoss("justiz_unabhaengigkeit", 2)],
		dauer: [stuetze("justiz_kapazitaet", 4), stuetze("justiz_unabhaengigkeit", 1.5)],
		unterhalt: .5,
		kehrseite: "Ausbildung dauert Jahre; Ausbilder fehlen im Gerichtsdienst, und die Ergebnisse zeigen sich erst nach der nächsten Wahl.",
		einmalig: true,
		bild: "gericht",
		quelle: "Spielvorhaben"
	},
	{
		id: "recht_gefaengnisbau",
		bereich: "recht",
		klasse: "grossprojekt",
		name: "Neue Haftanstalten",
		text: "Zusätzliche Plätze für den Strafvollzug, um die Überfüllung zu senken.",
		voraus: [{
			art: "knoten",
			id: "haftueberfuellung",
			min: 65
		}],
		kosten: {
			pk: 5,
			bau: 900,
			monate: 30,
			verwaltung: 1.6,
			schulden: .3
		},
		abschluss: [stoss("haftueberfuellung", -8)],
		dauer: [stuetze("haftueberfuellung", -6)],
		unterhalt: .7,
		kehrseite: "Mehr Plätze lösen die Ursachen nicht: Ohne Haftvermeidung füllen sie sich wieder; das Personal fehlt.",
		verlierer: "zivilgesellschaft",
		einmalig: true,
		bild: "gericht",
		quelle: "turkishminute.com/2026/08/11 (Belegung)"
	},
	{
		id: "recht_kavala",
		bereich: "recht",
		klasse: "reform",
		name: "Urteile im Fall Kavala umsetzen",
		text: "Das Verfahren nach Artikel 46 Absatz 4 der Menschenrechtskonvention läuft seit Februar 2022. Die Umsetzung des Straßburger Urteils beendet es und zeigt, ob die Regierung Urteile über politische Interessen stellt.",
		voraus: [{
			art: "knoten",
			id: "strassburg_druck",
			min: 50
		}],
		kosten: {
			pk: 6,
			bau: 20,
			monate: 2,
			verwaltung: .5
		},
		abschluss: [
			stoss("urteilsbefolgung", 10),
			stoss("strassburg_druck", -8),
			stoss("justiz_unabhaengigkeit", 2),
			stoss("ansehen", 3),
			stoss("konservative", -3),
			{
				t: "land",
				land: "EU",
				dim: "vertrauen",
				d: 4
			}
		],
		kehrseite: "Wird von Teilen des Lagers als Nachgeben gegenüber Straßburg gelesen; der Kassationshof und Regierungsnahe protestieren.",
		verlierer: "konservative",
		einmalig: true,
		bild: "gericht",
		quelle: "hrw.org/news/2025/06/16 (Verfahren nach Art. 46(4) seit Februar 2022)"
	},
	{
		id: "recht_kammergesetz",
		bereich: "recht",
		klasse: "reform",
		name: "Gesetz über mehrere Anwaltskammern",
		text: "Weitere Kammern in Großstädten, wie es das Gesetz von 2020 vorsieht: Die Kammern lassen sich spalten, die Regierung gewinnt Einfluss.",
		voraus: [],
		kosten: {
			pk: 3,
			bau: 30,
			monate: 4,
			verwaltung: .5
		},
		abschluss: [
			stoss("anwaltsautonomie", -8),
			stoss("justizvertrauen", -1),
			stoss("zivilgesellschaft", -2),
			stoss("staedtische_saekulare", -2),
			stoss("konservative", 1),
			{
				t: "kapital",
				d: 6
			}
		],
		kehrseite: "Alle 80 Kammern lehnten das Gesetz von 2020 ab; Anwälte marschieren. Durchgriff bringt Rückhalt im Lager, kostet aber Legitimität.",
		verlierer: "zivilgesellschaft",
		einmalig: true,
		bild: "gericht",
		quelle: "bianet.org/haber/constitutional-court-rejects-appeal-against-law-on-multiple-bar-associations-231931"
	},
	{
		id: "recht_zielfristen",
		bereich: "recht",
		klasse: "reform",
		name: "Zielfristen und Leistungsdruck für Richter",
		text: "Jede Richterin und jeder Richter wird an Erledigungszahlen gemessen; der Rat wertet die Leistung aus.",
		voraus: [],
		kosten: {
			pk: 4,
			bau: 40,
			monate: 6,
			verwaltung: .5
		},
		abschluss: [stoss("justiz_effizienz", 6), stoss("justiz_unabhaengigkeit", -4)],
		dauer: [stuetze("justiz_effizienz", 3), stuetze("justiz_unabhaengigkeit", -2)],
		kehrseite: "Richter urteilen schneller und oberflächlicher, Berufungen nehmen zu, und wer nicht liefert, muss um die Karriere fürchten.",
		verlierer: "Richter und Staatsanwälte",
		einmalig: true,
		bild: "gericht",
		quelle: "cdn.uyap.gov.tr (Strategie 2025 bis 2029: Leistungseinheit des Rates)"
	}
];
const RECHT_VORTEILE = [{
	id: "v_rechtsstaat",
	bereich: "recht",
	name: "Rechtsstaat-Dividende",
	text: "Unabhängige Gerichte und berechenbares Recht: Investoren, Partner und Bürger vertrauen den Regeln.",
	voraus: [{
		art: "knoten",
		id: "justiz_unabhaengigkeit",
		min: 52
	}, {
		art: "knoten",
		id: "rechtssicherheit",
		min: 55
	}],
	dauer: [
		stuetze("auslandskapital", 2.5),
		stuetze("legitimitaet", 2),
		stuetze("investitionen", 1.5)
	],
	kehrseite: "Unabhängige Gerichte sind unbequem: Sie kassieren auch Vorhaben der Regierung."
}, {
	id: "v_durchgriff",
	bereich: "recht",
	name: "Durchgriff",
	text: "Mit Ausnahmerecht und gelenkter Justiz lässt sich schnell regieren, gegen Terror wie gegen Kritik.",
	voraus: [{
		art: "knoten",
		id: "ausnahmerecht",
		min: 30
	}],
	dauer: [
		stuetze("terrorgefahr", -2),
		stuetze("konservative", 2),
		stuetze("legitimitaet", -3),
		stuetze("ansehen", -2)
	],
	kehrseite: "Ein Vorteil mit Preis: Er kostet Legitimität und Ansehen und verschwindet, sobald das Ausnahmerecht endet."
}];
//#endregion
//#region game/src/data/reich/militaer.ts
const MILITAER_VORHABEN = [
	{
		id: "mil_drohnen",
		bereich: "militaer",
		klasse: "grossprojekt",
		name: "Drohnenverbund (Bayraktar TB2, Akıncı, TB3)",
		text: "Abkommen über die TB2 mit 34 Ländern, über die Akıncı mit 10; die Piaggio-Übernahme (30.06.2025) und der Einsatz der TB3 vom Träger Anadolu (Oktober 2025) erweitern den Verbund.",
		voraus: [],
		kosten: {
			pk: 0,
			bau: 0,
			monate: 1
		},
		abschluss: [],
		dauer: [
			stuetze("modernisierung", 4),
			stuetze("abschreckung", 3),
			stuetze("export", 2),
			stuetze("bereitschaft_heer", 1.5)
		],
		unterhalt: .8,
		kehrseite: "Exportgenehmigungen sind politisch: Wer liefert, gewinnt Kunden und Feinde; Konflikte mit Abnehmerländern belasten das Ansehen.",
		bild: "jet",
		quelle: "en.wikipedia.org/wiki/Baykar_Bayraktar_family; euro-sd.com (Piaggio, 2025)",
		start: {
			status: "fertig",
			zustand: 80
		}
	},
	{
		id: "mil_anadolu",
		bereich: "militaer",
		klasse: "grossprojekt",
		name: "Hubschrauberträger TCG Anadolu und Fregatten",
		text: "Die Anadolu (2023) trägt Drohnen und Hubschrauber; dazu kommen die Fregatten der İstif-Klasse (die sechste lief im Juli 2026 vom Stapel).",
		voraus: [],
		kosten: {
			pk: 0,
			bau: 0,
			monate: 1
		},
		abschluss: [],
		dauer: [
			stuetze("bereitschaft_see", 3),
			stuetze("abschreckung", 2),
			stuetze("ansehen", 1)
		],
		unterhalt: .7,
		kehrseite: "Große Schiffe binden Werften, Besatzungen und Verwaltungskraft, und ihr Einsatz ist politisch sichtbar.",
		bild: "schiff",
		quelle: "en.wikipedia.org/wiki/TCG_Anadolu; armyrecognition.com (İstif-Klasse, 2026)",
		start: {
			status: "fertig",
			zustand: 78
		}
	},
	{
		id: "mil_s400",
		bereich: "militaer",
		klasse: "beschaffung",
		name: "S-400-Luftabwehr (eingelagert)",
		text: "Zwei Batterien und über 120 Raketen (Juli bis September 2019); nicht in die NATO-Luftverteidigung integrierbar. Die US-Sanktion (CAATSA) gegen die Rüstungsagentur SSB gilt seit Dezember 2020.",
		voraus: [],
		kosten: {
			pk: 0,
			bau: 0,
			monate: 1
		},
		abschluss: [],
		dauer: [{
			t: "land",
			land: "USA",
			dim: "vertrauen",
			d: .1
		}],
		unterhalt: .3,
		kehrseite: "Solange die S-400 im Land stehen, sperrt Washington die F-35 (NDAA §1245).",
		bild: "kuppelschirm",
		quelle: "everycrsreport.com/reports/IN12710.html; meforum.org/63894",
		start: {
			status: "fertig",
			zustand: 60
		}
	},
	{
		id: "mil_f16",
		bereich: "militaer",
		klasse: "beschaffung",
		name: "F-16 Block 70",
		text: "40 Stück bestellt; 79 Modernisierungskits wurden im November 2024 zugunsten der eigenen Modernisierung gestrichen. Der Bestand liegt bei 235 F-16.",
		voraus: [],
		kosten: {
			pk: 0,
			bau: 800,
			monate: 40,
			verwaltung: 1.2,
			schulden: .35
		},
		abschluss: [
			stoss("bereitschaft_luft", 4),
			stoss("modernisierung", 3),
			{
				t: "land",
				land: "USA",
				dim: "sicherheit",
				d: 3
			}
		],
		dauer: [stuetze("bereitschaft_luft", 2)],
		unterhalt: .7,
		kehrseite: "Abhängigkeit von amerikanischer Freigabe für Ersatzteile und Munition.",
		einmalig: true,
		bild: "jet",
		quelle: "theaviationist.com/2024/11/30/turkey-f-16-modernization-kits",
		start: {
			status: "im_bau",
			fortschritt: .4
		}
	},
	{
		id: "mil_stahlkuppel",
		bereich: "militaer",
		klasse: "grossprojekt",
		name: "Stahlkuppel: mehrschichtige Luftverteidigung",
		text: "47 Systeme für 460 Mio. USD kamen am 27.08.2025 ins Inventar; Siper Block I ist seit Januar 2026 einsatzbereit, der Vertrag über 6,5 Mrd. USD wurde am 26.11.2025 geschlossen. Komponenten von Aselsan folgen 2028 bis 2032.",
		voraus: [],
		kosten: {
			pk: 0,
			bau: 1800,
			monate: 72,
			verwaltung: 2,
			schulden: .4
		},
		abschluss: [
			stoss("abschreckung", 4),
			stoss("bereitschaft_luft", 3),
			stoss("modernisierung", 3)
		],
		dauer: [
			stuetze("abschreckung", 3),
			stuetze("bereitschaft_luft", 2),
			stuetze("ruestungsautarkie", 1.5)
		],
		unterhalt: 1,
		kehrseite: "Ein System aus vielen Sensoren und Effektoren: Die Integration mit NATO-Systemen ist offen.",
		einmalig: true,
		bild: "kuppelschirm",
		quelle: "breakingdefense.com/2026/06 (Aselsan, 900-Mio.-Auftrag)",
		start: {
			status: "im_bau",
			fortschritt: .3
		}
	},
	{
		id: "mil_altay",
		bereich: "militaer",
		klasse: "beschaffung",
		name: "Kampfpanzer Altay T1",
		text: "Serienstart am 05.09.2025, Dienst seit dem 28.10.2025. Die ersten 40 oder mehr Stück bekommen einen koreanischen Antrieb, der Motor von BMC Power soll ab Ende 2026 folgen.",
		voraus: [],
		kosten: {
			pk: 0,
			bau: 1100,
			monate: 60,
			verwaltung: 1.4,
			schulden: .3
		},
		abschluss: [
			stoss("bereitschaft_heer", 3),
			stoss("modernisierung", 3),
			stoss("ruestungsautarkie", 1)
		],
		dauer: [stuetze("bereitschaft_heer", 1.5), stuetze("modernisierung", 1.5)],
		unterhalt: .7,
		kehrseite: "Der Motor kommt aus Korea: Autarkie ist noch nicht erreicht.",
		einmalig: true,
		bild: "turm",
		quelle: "turdef.com (Auslieferungsplan Altay)",
		start: {
			status: "im_bau",
			fortschritt: .3
		}
	},
	{
		id: "mil_kaan",
		bereich: "militaer",
		klasse: "wunder",
		name: "Kampfjet KAAN Block 10",
		text: "Erstflug im Februar 2024; ein Vertrag über 20 Stück wurde am 08.05.2026 unterzeichnet, Indonesien bestellte 48. Der Motor kommt bisher von General Electric (F110), ein eigener TF35000 ist für 2032 angekündigt.",
		ort: {
			lat: 39.95,
			lon: 32.75,
			plaka: 6,
			name: "Ankara (TUSAŞ)"
		},
		voraus: [{
			art: "land",
			land: "USA",
			dim: "vertrauen",
			min: 35
		}],
		kosten: {
			pk: 8,
			bau: 2e3,
			monate: 48,
			verwaltung: 2.5,
			schulden: .7
		},
		abschluss: [
			stoss("modernisierung", 6),
			stoss("bereitschaft_luft", 4),
			stoss("abschreckung", 3),
			stoss("export", 2)
		],
		dauer: [stuetze("modernisierung", 3), stuetze("export", 1.5)],
		unterhalt: 1.3,
		kehrseite: "Solange der Motor aus den USA kommt, hat Washington ein Veto über Exporte und Lieferungen.",
		einmalig: true,
		bild: "jet",
		quelle: "breakingdefense.com/2026/05 (Vertrag über 20 Stück); flightglobal.com (Indonesien 48)"
	},
	{
		id: "mil_kaan_motor",
		bereich: "militaer",
		klasse: "grossprojekt",
		name: "Eigener Triebwerksantrieb TF35000",
		text: "Ein Kampfjet-Triebwerk aus eigener Entwicklung beendet die Abhängigkeit von amerikanischen Freigaben. Als Ziel wird 2032 genannt.",
		voraus: [],
		kosten: {
			pk: 7,
			bau: 1800,
			monate: 60,
			verwaltung: 2,
			schulden: .5
		},
		abschluss: [stoss("ruestungsautarkie", 8), stoss("export", 1.5)],
		dauer: [stuetze("ruestungsautarkie", 5)],
		unterhalt: 1,
		kehrseite: "Jahre der Entwicklung mit ungewissem Ausgang; Ingenieure und Prüfstände fehlen anderswo.",
		einmalig: true,
		bild: "jet",
		quelle: "breakingdefense.com/2026/05 (Ziel 2032)"
	},
	{
		id: "mil_eurofighter",
		bereich: "militaer",
		klasse: "beschaffung",
		name: "Eurofighter Typhoon",
		text: "20 neue Jets, bis zu 8 Mrd. Pfund (27.10.2025); ein Support-Vertrag vom 25.03.2026 sieht die Ausbildung von 10 Fluglehrern und etwa 100 Technikern in Großbritannien vor. Erste Lieferungen nach Presseberichten 2030.",
		voraus: [{
			art: "land",
			land: "EU",
			dim: "vertrauen",
			min: 38
		}],
		kosten: {
			pk: 6,
			bau: 1e3,
			monate: 36,
			verwaltung: 1.5,
			schulden: .5
		},
		abschluss: [
			stoss("bereitschaft_luft", 3),
			stoss("modernisierung", 4),
			{
				t: "land",
				land: "EU",
				dim: "sicherheit",
				d: 4
			},
			{
				t: "land",
				land: "RUS",
				dim: "vertrauen",
				d: -2
			}
		],
		dauer: [stuetze("modernisierung", 2)],
		unterhalt: .9,
		kehrseite: "Lieferung frühestens 2030: Bis dahin bleibt eine Lücke in der Luftwaffe.",
		einmalig: true,
		bild: "jet",
		quelle: "defensenews.com/global/europe/2026/03/25"
	},
	{
		id: "mil_f35",
		bereich: "militaer",
		klasse: "beschaffung",
		name: "F-35",
		text: "Ausgeschlossen seit Juli 2019. Das Gesetz NDAA §1245 verlangt, dass keine S-400 im Land stehen; am 22.07.2026 meldete das Außenministerium der USA, die Bedingung sei unerfüllt.",
		voraus: [{
			art: "land",
			land: "USA",
			dim: "vertrauen",
			min: 50
		}],
		sperre: {
			solange: {
				art: "bestand",
				id: "mil_s400"
			},
			text: "Blockiert: Die S-400 stehen im Land (NDAA §1245, CAATSA). Erst müssen sie abgegeben werden."
		},
		kosten: {
			pk: 9,
			bau: 1500,
			monate: 48,
			verwaltung: 2,
			schulden: .9
		},
		abschluss: [
			stoss("bereitschaft_luft", 6),
			stoss("modernisierung", 7),
			stoss("abschreckung", 5),
			{
				t: "land",
				land: "USA",
				dim: "sicherheit",
				d: 6
			}
		],
		dauer: [stuetze("bereitschaft_luft", 3), stuetze("modernisierung", 3)],
		unterhalt: 1.2,
		kehrseite: "Die Bindung an Washington wird enger: Software, Ersatzteile und Einsatz unterliegen amerikanischer Freigabe.",
		einmalig: true,
		bild: "jet",
		quelle: "everycrsreport.com/reports/IN12710.html; turkishminute.com/2026/07/21"
	},
	{
		id: "mil_s400_abgeben",
		bereich: "militaer",
		klasse: "reform",
		name: "S-400 abgeben oder verkaufen",
		text: "Die russischen Batterien verlassen das Land. Das räumt die Sperre für die F-35 und beendet die CAATSA-Sanktion, kostet aber Gesicht und Moskaus Wohlwollen.",
		voraus: [{
			art: "bestand",
			id: "mil_s400"
		}],
		kosten: {
			pk: 7,
			bau: 30,
			monate: 3,
			verwaltung: .5
		},
		abschluss: [
			{
				t: "entferne",
				id: "mil_s400"
			},
			{
				t: "land",
				land: "USA",
				dim: "vertrauen",
				d: 8
			},
			{
				t: "land",
				land: "USA",
				dim: "sicherheit",
				d: 5
			},
			{
				t: "land",
				land: "RUS",
				dim: "vertrauen",
				d: -8
			},
			{
				t: "land",
				land: "RUS",
				dim: "handel",
				d: -4
			},
			stoss("abschreckung", -3),
			stoss("bereitschaft_luft", -2),
			stoss("konservative", -3)
		],
		kehrseite: "Ein Gesichtsverlust zu Hause und in Moskau; die Luftabwehr hat eine Lücke, bis die Stahlkuppel steht.",
		verlierer: "konservative",
		einmalig: true,
		bild: "kuppelschirm",
		quelle: "turkishminute.com/2026/07/21 (Streit um S-400 und F-35)"
	},
	{
		id: "mil_tf2000",
		bereich: "militaer",
		klasse: "grossprojekt",
		name: "Zerstörer TF-2000",
		text: "Ein Luftverteidigungszerstörer aus eigener Werft. Die Termine widersprechen sich in den Quellen (2027 bzw. 2030).",
		voraus: [{
			art: "bestand",
			id: "mil_anadolu"
		}],
		kosten: {
			pk: 6,
			bau: 1600,
			monate: 60,
			verwaltung: 2,
			schulden: .6
		},
		abschluss: [
			stoss("bereitschaft_see", 5),
			stoss("modernisierung", 3),
			stoss("abschreckung", 3)
		],
		dauer: [stuetze("bereitschaft_see", 2), stuetze("ruestungsautarkie", 1)],
		unterhalt: 1,
		kehrseite: "Ein Großschiff mit Zeitplanrisiko: Verzögerungen sind wahrscheinlich, und die Werft fehlt anderswo.",
		einmalig: true,
		bild: "schiff",
		quelle: "en.wikipedia.org/wiki/TCG_Anadolu (Termine widersprüchlich)"
	},
	{
		id: "mil_huerjet",
		bereich: "militaer",
		klasse: "ausbau",
		name: "Hürjet: Trainer und Export",
		text: "Der Strahltrainer Hürjet bildet Piloten aus und ist ein Exportprodukt: Spanien hat einen Vertrag über 30 Stück geschlossen.",
		voraus: [],
		kosten: {
			pk: 3,
			bau: 300,
			monate: 20,
			verwaltung: .8,
			schulden: .1
		},
		abschluss: [
			stoss("export", 1.5),
			stoss("bereitschaft_luft", 1.5),
			stoss("ansehen", .5)
		],
		dauer: [stuetze("export", 1.5), stuetze("bereitschaft_luft", 1)],
		unterhalt: .4,
		kehrseite: "Ein Exporterfolg verlangt Kundendienst und Ersatzteile über Jahrzehnte.",
		einmalig: true,
		bild: "jet",
		quelle: "theaviationist.com/2025/12/30/spain-signs-contract-for-30-hurjets"
	},
	{
		id: "doktrin_drohnen",
		bereich: "militaer",
		klasse: "doktrin",
		name: "Doktrin: Drohnenverbund",
		text: "Unbemannte Systeme tragen die Aufklärung und den Schlag; die Truppe wird um den Verbund herum gebaut.",
		voraus: [{
			art: "bestand",
			id: "mil_drohnen"
		}],
		ast: "doktrin",
		kosten: {
			pk: 5,
			bau: 60,
			monate: 6,
			verwaltung: .6
		},
		abschluss: [],
		dauer: [
			stuetze("modernisierung", 2),
			stuetze("abschreckung", 2.5),
			stuetze("bereitschaft_heer", 1),
			stuetze("offiziersvertrauen", -2)
		],
		unterhalt: .4,
		kehrseite: "Piloten und Panzeroffiziere verlieren Status; gegen einen Gegner mit starker Luftabwehr wäre der Verbund eine Belastungsprobe.",
		bild: "jet",
		quelle: "Spielvorhaben"
	},
	{
		id: "doktrin_luftverteidigung",
		bereich: "militaer",
		klasse: "doktrin",
		name: "Doktrin: mehrschichtige Luftverteidigung",
		text: "Die Streitkräfte setzen auf Sensoren, Abfangjäger und Datenlinks, die den Luftraum in Schichten schützen.",
		voraus: [{
			art: "massnahme",
			id: "m_verteidigung",
			min: 50
		}],
		ast: "doktrin",
		kosten: {
			pk: 5,
			bau: 80,
			monate: 6,
			verwaltung: .8
		},
		abschluss: [],
		dauer: [
			stuetze("abschreckung", 3),
			stuetze("bereitschaft_luft", 2),
			stuetze("ruestungsautarkie", 1)
		],
		unterhalt: 1.2,
		kehrseite: "Teuer im Unterhalt: Sensoren, Abfangjäger und Datenlinks binden Verwaltungskraft.",
		bild: "kuppelschirm",
		quelle: "Spielvorhaben"
	},
	{
		id: "doktrin_autonomie",
		bereich: "militaer",
		klasse: "doktrin",
		name: "Doktrin: strategische Autonomie",
		text: "Kein System ohne eigene Alternative: Entwicklung und Fertigung im Land haben Vorrang vor Zukäufen.",
		voraus: [{
			art: "knoten",
			id: "ruestungsautarkie",
			min: 55
		}],
		ast: "doktrin",
		kosten: {
			pk: 5,
			bau: 60,
			monate: 6,
			verwaltung: .6
		},
		abschluss: [],
		dauer: [
			stuetze("ruestungsautarkie", 4),
			stuetze("abschreckung", 1.5),
			stuetze("beziehungen_usa", -2),
			stuetze("beziehungen_eu", -1)
		],
		unterhalt: .4,
		kehrseite: "Weniger Bindung an Bündnispartner: weniger Hebel für Washington und Brüssel, aber auch weniger Rückhalt.",
		bild: "turm",
		quelle: "Spielvorhaben"
	}
];
const MILITAER_VORTEILE = [{
	id: "v_regionale_macht",
	bereich: "militaer",
	name: "Regionale Ordnungsmacht",
	text: "Bereitschaft, Ausrüstung und Bündnisrückhalt machen die Streitkräfte zu einer Größe, mit der jeder rechnet.",
	voraus: [{
		art: "knoten",
		id: "abschreckung",
		min: 62
	}, {
		art: "knoten",
		id: "bereitschaft_luft",
		min: 58
	}],
	dauer: [
		stuetze("ansehen", 1),
		stuetze("beziehungen_nahost", 1.5),
		stuetze("konservative", 2)
	],
	kehrseite: "Ein starkes Heer weckt Erwartungen und Misstrauen: Nachbarn rüsten auf."
}, {
	id: "v_ruestungsexporteur",
	bereich: "militaer",
	name: "Rüstungsexporteur",
	text: "Eigene Industrie beliefert Kunden in aller Welt; die Auftragsbücher sind gefüllt (2025: Exporte von 10,05 Mrd. USD, Auftragsbestand 17,8 Mrd.).",
	voraus: [{
		art: "knoten",
		id: "ruestungsautarkie",
		min: 68
	}],
	dauer: [stuetze("export", 2.5), stuetze("auslandskapital", 1)],
	kehrseite: "Abnehmer bestimmen mit: Exporte an Konfliktparteien belasten Bündnisse und das Ansehen."
}];
//#endregion
//#region game/src/data/reich/haushalt.ts
const HAUSHALT_VORHABEN = [
	{
		id: "sr_energiedeckel",
		bereich: "haushalt",
		klasse: "sonderrecht",
		name: "Preisdeckel für Energie (BOTAŞ)",
		text: "Der staatliche Gasimporteur gibt Gas und Strom unter dem Importpreis ab: Die Haushalte entlastet es sofort.",
		voraus: [],
		kosten: {
			pk: 4,
			bau: 0,
			monate: 1,
			verwaltung: .3
		},
		abschluss: [
			stoss("energiepreise", -5),
			stoss("lebenshaltung", -3),
			stoss("legitimitaet", 2)
		],
		dauer: [
			stuetze("energiepreise", -4),
			stuetze("lebenshaltung", -2),
			stuetze("energieimporte", 1.5),
			{
				t: "schulden",
				d: .02
			}
		],
		unterhalt: .5,
		kehrseite: "Der Staat trägt die Differenz zwischen Importpreis und Deckel: Der Haushalt und die Devisenbilanz zahlen, und Sparen wird nicht belohnt.",
		verlierer: "unternehmer",
		einmalig: true,
		quelle: "Spielvorhaben"
	},
	{
		id: "sr_kreditgarantien",
		bereich: "haushalt",
		klasse: "sonderrecht",
		name: "Kreditgarantiefonds",
		text: "Der Staat bürgt für Kredite an Betriebe, die sonst keine bekämen.",
		voraus: [],
		kosten: {
			pk: 4,
			bau: 0,
			monate: 1,
			verwaltung: .3
		},
		abschluss: [stoss("kredite", 4), stoss("mittelstand", 3)],
		dauer: [
			stuetze("kredite", 3),
			stuetze("mittelstand", 2),
			{
				t: "risiko",
				d: .4
			}
		],
		unterhalt: .3,
		kehrseite: "Eine Eventualschuld: Bei einer Ausfallwelle wird die Bürgschaft real, und die Märkte rechnen schon vorher mit.",
		verlierer: "Sparer und Banken",
		einmalig: true,
		quelle: "Spielvorhaben"
	},
	{
		id: "sr_wechselkursschutz",
		bereich: "haushalt",
		klasse: "sonderrecht",
		name: "Einlagen mit Wechselkursgarantie",
		text: "Sparer, die in Lira anlegen, bekommen den Wertverlust gegenüber dem Dollar vom Staat ausgeglichen.",
		voraus: [],
		kosten: {
			pk: 5,
			bau: 0,
			monate: 1,
			verwaltung: .4
		},
		abschluss: [{
			t: "risiko",
			d: -25
		}, stoss("dollarisierung", -4)],
		dauer: [{
			t: "schulden",
			d: .03
		}, stuetze("dollarisierung", -3)],
		unterhalt: .5,
		kehrseite: "Der Staat trägt das Wechselkursrisiko: Jede Abwertung wird zur Rechnung, und der Ausstieg ist teuer.",
		verlierer: "arbeitnehmer",
		einmalig: true,
		quelle: "Spielvorhaben"
	},
	{
		id: "sr_staatsbanken",
		bereich: "haushalt",
		klasse: "sonderrecht",
		name: "Kreditlenkung über Staatsbanken",
		text: "Die Staatsbanken vergeben Kredite nach politischen Vorgaben: an Bau, Landwirtschaft und Exporteure.",
		voraus: [],
		kosten: {
			pk: 3,
			bau: 0,
			monate: 1,
			verwaltung: .3
		},
		abschluss: [stoss("investitionen", 3), stoss("kredite", 5)],
		dauer: [
			stuetze("investitionen", 2),
			stuetze("kredite", 2),
			{
				t: "risiko",
				d: .3
			}
		],
		unterhalt: .4,
		kehrseite: "Kredite folgen der Politik, nicht dem Risiko: Ausfälle in den Staatsbanken landen beim Haushalt.",
		verlierer: "Sparer",
		einmalig: true,
		quelle: "Spielvorhaben"
	},
	{
		id: "sr_vermoegensfonds",
		bereich: "haushalt",
		klasse: "sonderrecht",
		name: "Staatlicher Vermögensfonds",
		text: "Ein Fonds hält Beteiligungen des Staates außerhalb des normalen Haushalts und kann rasch investieren.",
		voraus: [],
		kosten: {
			pk: 5,
			bau: 0,
			monate: 1,
			verwaltung: .5
		},
		abschluss: [stoss("auslandskapital", 2), stoss("investitionen", 2)],
		dauer: [stuetze("investitionen", 1.5), stuetze("korruption", 1.5)],
		unterhalt: .4,
		kehrseite: "Ein Fonds außerhalb des Haushalts hat wenig Aufsicht: Vorwürfe der Vetternwirtschaft folgen.",
		verlierer: "zivilgesellschaft",
		einmalig: true,
		quelle: "Spielvorhaben"
	}
];
const HAUSHALT_VORTEILE = [{
	id: "v_solide_verwaltung",
	bereich: "haushalt",
	name: "Solide Verwaltung",
	text: "Eine Verwaltung, der man ihre Zahlen glaubt: Märkte und Bürger vertrauen auf den Kurs.",
	voraus: [{
		art: "knoten",
		id: "legitimitaet",
		min: 65
	}, {
		art: "massnahme",
		id: "m_verwaltungsdigital",
		min: 55
	}],
	dauer: [stuetze("vertrauen_maerkte", 2), {
		t: "kapital",
		d: .4
	}],
	kehrseite: "Ein Ruf, den man sich Jahr für Jahr erarbeitet und mit einem Skandal verliert."
}];
//#endregion
//#region game/src/data/reich/index.ts
const VORHABEN = [
	...KULTUR_VORHABEN,
	...INFRA_VORHABEN,
	...RECHT_VORHABEN,
	...MILITAER_VORHABEN,
	...HAUSHALT_VORHABEN
];
const VORTEILE = [
	...KULTUR_VORTEILE,
	...INFRA_VORTEILE,
	...RECHT_VORTEILE,
	...MILITAER_VORTEILE,
	...HAUSHALT_VORTEILE
];
//#endregion
//#region game/src/data/abkommen.ts
const SUEDOST = [
	63,
	21,
	47,
	27,
	2
];
const KLAUSELN = [
	{
		id: "zoll",
		seite: "gibt",
		label: "Zölle senken, Marktzugang öffnen",
		text: "Türkische Zölle fallen für die Waren des Partners; heimische Hersteller müssen sich dem Wettbewerb stellen.",
		abschluss: [stoss("unternehmer", -2)],
		dauer: [
			stuetze("export", 2),
			stuetze("industrie", -1.2),
			stuetze("mittelstand", -1.5),
			stuetze("lebenshaltung", -1)
		],
		land: {
			handel: 12,
			vertrauen: 2
		},
		kehrseite: "Heimische Hersteller geraten unter Preisdruck, vor allem im Mittelstand.",
		pflicht: {
			art: "massnahme-max",
			id: "m_zoelle",
			max: 50
		},
		pflichtText: "Einfuhrzölle bleiben niedrig.",
		mindestens: {
			dim: "vertrauen",
			wert: 35,
			text: "Ohne Grundvertrauen öffnet niemand seinen Markt."
		}
	},
	{
		id: "transit",
		seite: "gibt",
		label: "Transit- und Korridorrechte",
		text: "Bahn, Straße und Leitungen des Partners dürfen durch türkisches Gebiet und die türkischen Häfen laufen.",
		dauer: [stuetze("logistik", 1.5), stuetze("wachstum_regional", .5)],
		land: {
			handel: 6,
			vertrauen: 3
		},
		kehrseite: "Durchleitung bindet Anlagen und macht abhängig vom Nachbarn."
	},
	{
		id: "meerengen",
		seite: "gibt",
		label: "Zusage zu den Meerengen (Montreux)",
		text: "Ankara bekräftigt, Bosporus und Dardanellen nach dem Vertrag von Montreux zu regeln und keine Kriegsschiffe der Kriegsparteien durchzulassen.",
		dauer: [stuetze("ansehen", 1.5)],
		land: {
			vertrauen: 6,
			sicherheit: 4
		},
		kehrseite: "Bindet die Handlungsfreiheit am Bosporus; eine Seite fühlt sich immer benachteiligt.",
		mindestens: {
			dim: "vertrauen",
			wert: 40,
			text: "Für eine solche Zusage braucht der Partner erst Vertrauen."
		}
	},
	{
		id: "militaerzugang",
		seite: "gibt",
		label: "Militärzugang und Ausbildung",
		text: "Ausbilder, Hafenbesuche und der Zugang zu Stützpunkten für die Streitkräfte des Partners.",
		pk: 2,
		abschluss: [stoss("konservative", -.5)],
		dauer: [stuetze("abschreckung", 1.5)],
		land: {
			sicherheit: 10,
			vertrauen: 3
		},
		kehrseite: "Fremde Truppen und Ausbilder im eigenen Land; Dritte reagieren darauf.",
		mindestens: {
			dim: "sicherheit",
			wert: 40,
			text: "Militärische Nähe setzt eine belastbare Sicherheitszusammenarbeit voraus."
		}
	},
	{
		id: "ruestung_koop",
		seite: "gibt",
		label: "Rüstungskooperation und Lieferungen",
		text: "Gemeinsame Entwicklung und Lieferungen türkischer Systeme wie Drohnen, Schiffe und Panzer.",
		pk: 2,
		abschluss: [stoss("ansehen", -.5)],
		dauer: [
			stuetze("export", 1),
			stuetze("industrie", .8),
			stuetze("ruestungsautarkie", 1)
		],
		land: {
			sicherheit: 12,
			vertrauen: 4
		},
		kehrseite: "Lieferungen an Krisenparteien kosten Ansehen und ziehen Gegenspieler an.",
		mindestens: {
			dim: "sicherheit",
			wert: 35,
			text: "Für Rüstungsgeschäfte ist die Zusammenarbeit noch zu dünn."
		}
	},
	{
		id: "ruestung_kauf",
		seite: "gibt",
		label: "Rüstungskäufe beim Partner",
		text: "Die Türkei kauft Flugzeuge, Triebwerke und Ersatzteile; Ankara zahlt, der Partner liefert.",
		pk: 1,
		abschluss: [{
			t: "schulden",
			d: .3
		}],
		dauer: [stuetze("modernisierung", 2), stuetze("abschreckung", 1)],
		land: {
			sicherheit: 8,
			handel: 6,
			vertrauen: 3
		},
		kehrseite: "Bestellungen im Ausland belasten die Zahlungsbilanz und die heimische Rüstungsindustrie."
	},
	{
		id: "bauauftraege",
		seite: "gibt",
		label: "Bauaufträge und Wiederaufbau",
		text: "Türkische Baufirmen bauen Straßen, Kraftwerke und Wohnungen; der Staat bürgt und finanziert mit.",
		pk: 1,
		abschluss: [{
			t: "schulden",
			d: .1
		}],
		dauer: [stuetze("bauwirtschaft", 2), stuetze("export", .5)],
		land: {
			handel: 6,
			vertrauen: 4
		},
		kehrseite: "Türkische Baufirmen verdienen, der Staat trägt die Risiken mit."
	},
	{
		id: "visa",
		seite: "gibt",
		label: "Visaerleichterung",
		text: "Kurzzeitvisa und Geschäftsreisen werden leichter; Reisende und Händler kommen ohne lange Wege.",
		dauer: [stuetze("tourismus", 1.5)],
		land: {
			vertrauen: 4,
			handel: 3
		},
		kehrseite: "Mehr Reisende bedeuten mehr Kontrolle und, in Grenzstädten, mehr Spannung."
	},
	{
		id: "grenzoeffnung",
		seite: "gibt",
		label: "Grenzöffnung und diplomatische Beziehungen",
		text: "Die geschlossene Grenze wird geöffnet, Botschafter werden ausgetauscht; Bahn und Handel können folgen.",
		pk: 4,
		abschluss: [stoss("konservative", -2), stoss("ansehen", 1.5)],
		dauer: [stuetze("tourismus", .6, [
			36,
			76,
			75
		]), stuetze("wachstum_regional", .6, [
			36,
			76,
			75
		])],
		land: {
			vertrauen: 10,
			konflikt: -10
		},
		kehrseite: "Nationalisten und der engste Partner Baku sehen Verrat; die Grenzprovinzen Kars, Iğdır und Ardahan tragen die Last.",
		mindestens: {
			dim: "vertrauen",
			wert: 30,
			text: "Ohne erste Zeichen des Vertrauens gibt es keine Grenzöffnung."
		}
	},
	{
		id: "vermittlung_zusage",
		seite: "gibt",
		label: "Ankara vermittelt im Streit",
		text: "Die Türkei bietet sich als Vermittler an: Istanbul als Ort, Erdoğans Draht zu beiden Seiten als Werkzeug.",
		pk: 1,
		abschluss: [stoss("ansehen", 1.5)],
		dauer: [stuetze("ansehen", .5)],
		land: { vertrauen: 5 },
		kehrseite: "Wer vermittelt, wird von beiden Seiten am Ergebnis gemessen."
	},
	{
		id: "gas_kauf",
		seite: "gibt",
		label: "Langfristiger Gaskaufvertrag",
		text: "Ankara verpflichtet sich zur Abnahme von Erdgas über mehrere Jahre; der Preis ist vereinbart.",
		pk: 1,
		dauer: [
			stuetze("stromversorgung", 1),
			stuetze("energieimporte", 1.5),
			stuetze("energiepreise", -.8)
		],
		land: {
			handel: 10,
			vertrauen: 2
		},
		kehrseite: "Bindung an einen Lieferanten; wer sein Gas kauft, verhandelt nie ganz frei, und Dritte drohen mit Sanktionen."
	},
	{
		id: "investitionen_oeffnen",
		seite: "gibt",
		label: "Türen für Investitionen öffnen",
		text: "Investoren des Partners bekommen Zugang zu Industrie, Infrastruktur und Häfen, mit Rechtsschutz.",
		abschluss: [stoss("unternehmer", -.5)],
		dauer: [stuetze("auslandskapital", 2), stuetze("investitionen", 1)],
		land: {
			handel: 5,
			vertrauen: 3
		},
		kehrseite: "Politischer Einfluss kommt mit dem Kapital.",
		pflicht: {
			art: "massnahme",
			id: "m_investitionsanreize",
			min: 40
		},
		pflichtText: "Ein verlässliches Investitionsklima."
	},
	{
		id: "kredit_hilfe",
		seite: "gibt",
		label: "Kredit und Wirtschaftshilfe",
		text: "Ankara gibt Kredite, Wiederaufbauhilfe und Zuschüsse an den Partner.",
		pk: 1,
		abschluss: [{
			t: "schulden",
			d: .2
		}, stoss("ansehen", 1)],
		land: {
			vertrauen: 8,
			handel: 4
		},
		kehrseite: "Kredite an Schwächere kommen selten zurück, und Wähler fragen, warum das Geld nicht zu Hause bleibt."
	},
	{
		id: "reform_zusage",
		seite: "gibt",
		label: "Reformzusage: Justiz und Rechtsstaat",
		text: "Ankara sagt zu, die Justiz unabhängiger zu machen und Urteile zu befolgen; Brüssel prüft jedes Jahr.",
		pk: 3,
		abschluss: [stoss("konservative", -1)],
		dauer: [stuetze("vertrauen_maerkte", 1)],
		land: { vertrauen: 8 },
		kehrseite: "Ein Versprechen, das Ankara innenpolitisch einhalten müsste; wer es bricht, verliert Glaubwürdigkeit.",
		pflicht: {
			art: "massnahme",
			id: "m_justizreform",
			min: 55
		},
		pflichtText: "Justizreform auf mindestens Stufe 55."
	},
	{
		id: "sanktionen_umgehung",
		seite: "gibt",
		label: "Umgehung der Russland-Sanktionen unterbinden",
		text: "Türkische Firmen liefern keine Güter mehr über Umwege nach Russland; Banken prüfen strenger.",
		pk: 2,
		abschluss: [stoss("beziehungen_russland", -4)],
		dauer: [stuetze("export", -1.2)],
		land: { vertrauen: 6 },
		kehrseite: "Der Handel mit Russland und die Nebenverdienste der Exporteure schrumpfen."
	},
	{
		id: "migration_zusage",
		seite: "gibt",
		label: "Migrations- und Rücknahmeabkommen",
		text: "Die Türkei sichert die Grenzen und nimmt irreguläre Migranten zurück.",
		pk: 2,
		dauer: [stuetze("gefluechtete", 1)],
		land: { vertrauen: 6 },
		kehrseite: "Wer zurückgenommen wird, bleibt zunächst im Land; der Druck auf Grenzprovinzen wächst.",
		pflicht: {
			art: "massnahme",
			id: "m_grenzschutz",
			min: 60
		},
		pflichtText: "Grenzschutz auf mindestens Stufe 60."
	},
	{
		id: "s400",
		seite: "gibt",
		label: "S-400 stilllegen oder einlagern",
		text: "Das russische Luftabwehrsystem wird nicht mehr betrieben: Voraussetzung für ein Ende der US-Sanktionen und den Weg zurück zum F-35.",
		pk: 4,
		abschluss: [
			stoss("konservative", -2.5),
			stoss("beziehungen_russland", -4),
			stoss("abschreckung", -1.5)
		],
		dauer: [stuetze("modernisierung", 1)],
		land: {
			vertrauen: 10,
			sicherheit: 6
		},
		kehrseite: "Moskau verliert einen Großkunden, und im Land gilt es als Kniefall vor Washington."
	},
	{
		id: "zahlungsweg",
		seite: "gibt",
		label: "Zahlungsweg über türkische Banken",
		text: "Türkische Banken wickeln Zahlungen ab, die anderswo an Sanktionen scheitern.",
		pk: 4,
		abschluss: [stoss("beziehungen_usa", -3), {
			t: "risiko",
			d: 8
		}],
		dauer: [stuetze("vertrauen_maerkte", -1.5), stuetze("export", .8)],
		land: {
			handel: 8,
			vertrauen: 4
		},
		kehrseite: "Sekundärsanktionen: Wer die Sanktionen des Westens umgeht, wird selbst zum Ziel."
	},
	{
		id: "ende_sperre",
		seite: "gibt",
		label: "Handels- und Häfensperre aufheben",
		text: "Die Sperre für Handel und Schiffe wird beendet; der Luftraum bleibt ein Thema für sich.",
		pk: 5,
		abschluss: [stoss("konservative", -3), stoss("ansehen", -1)],
		dauer: [stuetze("export", 1.5)],
		land: {
			handel: 12,
			konflikt: -8
		},
		kehrseite: "Für viele Wählerinnen und Wähler ein Bruch mit der Gaza-Haltung."
	},
	{
		id: "v_casus",
		seite: "gibt",
		label: "Kriegsdrohung von 1995 ruhen lassen",
		text: "Der Parlamentsbeschluss von 1995, eine Ausweitung der griechischen Hoheitsgewässer auf zwölf Seemeilen als Kriegsgrund zu betrachten, wird nicht mehr bekräftigt.",
		pk: 4,
		abschluss: [stoss("konservative", -2), stoss("abschreckung", -1)],
		land: {
			konflikt: -12,
			vertrauen: 6
		},
		kehrseite: "Ein Druckmittel weniger in der Ägäis; Nationalisten sprechen von Ausverkauf."
	},
	{
		id: "verzicht_bohrung",
		seite: "gibt",
		label: "Keine Erkundungsbohrungen in umstrittenen Gewässern",
		text: "Bohrschiffe bleiben aus Gewässern fern, in denen der Partner Rechte beansprucht.",
		pk: 3,
		abschluss: [stoss("konservative", -1)],
		dauer: [stuetze("energieimporte", 1)],
		land: {
			konflikt: -8,
			vertrauen: 5
		},
		kehrseite: "Gasfelder im Mittelmeer bleiben ungenutzt, solange die Grenzen ungeklärt sind.",
		pflicht: {
			art: "massnahme-max",
			id: "m_gasfoerderung",
			max: 55
		},
		pflichtText: "Keine Ausweitung der Gasförderung über Stufe 55."
	},
	{
		id: "hafen_oeffnung",
		seite: "gibt",
		label: "Häfen und Flughäfen für zyprische Schiffe und Flugzeuge öffnen",
		text: "Türkische Häfen und Flughäfen stehen Schiffen und Flugzeugen der Republik Zypern offen, wie es das Ankara-Protokoll zur Zollunion verlangt.",
		pk: 3,
		abschluss: [stoss("konservative", -2), stoss("ansehen", 1.5)],
		dauer: [stuetze("logistik", .5), stuetze("tourismus", .4)],
		land: {
			vertrauen: 8,
			konflikt: -6
		},
		kehrseite: "Nationalisten sehen darin eine Anerkennung Zyperns ohne Gegenleistung."
	},
	{
		id: "wasser",
		seite: "gibt",
		label: "Wassermengen aus Euphrat und Tigris zusagen",
		text: "Die Staudämme im Südosten geben verlässlich Wasser nach Süden ab, auch wenn es knapp wird.",
		pk: 2,
		abschluss: [stoss("landwirte", -2)],
		dauer: [stuetze("wasserversorgung", -1.5, SUEDOST), stuetze("landwirtschaft_einkommen", -.8, SUEDOST)],
		land: {
			vertrauen: 8,
			konflikt: -6
		},
		kehrseite: "Jeder Kubikmeter flussabwärts fehlt im Südosten, besonders in Dürrejahren."
	},
	{
		id: "energie_lieferung",
		seite: "gibt",
		label: "Strom und Gas ins Nachbarland liefern",
		text: "Leitungen und Netze werden verbunden; die Türkei liefert Strom und Gas.",
		dauer: [stuetze("stromversorgung", -.6), stuetze("export", .5)],
		land: {
			handel: 8,
			vertrauen: 4
		},
		kehrseite: "Was das Nachbarland bekommt, fehlt im Notfall zu Hause."
	},
	{
		id: "beistand",
		seite: "gibt",
		label: "Beistandsverpflichtung",
		text: "Ein Angriff auf einen Partner gilt als Angriff auf alle; Ankara verpflichtet sich zu Hilfe im Ernstfall.",
		pk: 3,
		abschluss: [stoss("abschreckung", 2), stoss("beziehungen_usa", -1)],
		dauer: [stuetze("abschreckung", 2)],
		land: {
			sicherheit: 12,
			vertrauen: 6
		},
		kehrseite: "Beistand heißt: im Ernstfall Truppen. Ein Vertrag, den man nur einmal bricht.",
		mindestens: {
			dim: "vertrauen",
			wert: 55,
			text: "Beistand versprechen nur enge Partner."
		}
	},
	{
		id: "seesicherheit",
		seite: "gibt",
		label: "Minenräumung und Seesicherheit im Schwarzen Meer",
		text: "Gemeinsame Kräfte räumen Minen und sichern Schifffahrtswege im Schwarzen Meer.",
		pk: 1,
		dauer: [stuetze("abschreckung", .8), stuetze("logistik", .6)],
		land: {
			sicherheit: 6,
			vertrauen: 4
		},
		kehrseite: "Türkische Schiffe im Krisengebiet: ein Zwischenfall reicht für eine Krise mit Moskau."
	},
	{
		id: "bohrung",
		seite: "gibt",
		label: "Türkische Erkundung und Förderung",
		text: "Türkische Firmen erkunden und fördern Öl und Gas auf dem Gebiet des Partners.",
		pk: 1,
		dauer: [stuetze("energieimporte", -1), stuetze("energiepreise", -.5)],
		land: {
			handel: 6,
			vertrauen: 2
		},
		kehrseite: "Streit mit Ägypten und Griechenland um Seegrenzen und Hoheitsrechte."
	},
	{
		id: "w_zoll",
		seite: "will",
		label: "Marktzugang für türkische Waren",
		text: "Türkische Hersteller dürfen zu gleichen Bedingungen liefern; Handelshürden fallen.",
		dauer: [stuetze("export", 2.5), stuetze("industrie", 1.5)],
		land: {},
		kehrseite: "Für den Partner ein Preis: Seine Hersteller haben das Nachsehen."
	},
	{
		id: "w_zollunion",
		seite: "will",
		label: "Zollunion modernisieren",
		text: "Die Zollunion von 1995 wird auf Dienstleistungen, Landwirtschaft und öffentliche Aufträge ausgeweitet.",
		abschluss: [stoss("ansehen", 1)],
		dauer: [
			stuetze("export", 3),
			stuetze("industrie", 2),
			stuetze("investitionen", 1.5)
		],
		land: {},
		kehrseite: "Griechenland und Zypern blockieren seit Jahren; jede Bewegung dort kostet die anderen etwas."
	},
	{
		id: "w_visa",
		seite: "will",
		label: "Visafreiheit für Türkinnen und Türken",
		text: "Kurzaufenthalte im Schengenraum ohne Visum: der Kern dessen, was viele Türken von Europa erwarten.",
		abschluss: [
			stoss("staedtische_saekulare", 3),
			stoss("junge", 3),
			stoss("ansehen", 1.5)
		],
		land: {},
		kehrseite: "Brüssel verlangt dafür Gegenleistungen, die im eigenen Land wehtun."
	},
	{
		id: "w_ruestung",
		seite: "will",
		label: "Zugang zu Rüstungstechnik",
		text: "Kampfflugzeuge, Triebwerke und Ersatzteile: Der Partner gibt frei, was heute gesperrt ist.",
		dauer: [
			stuetze("modernisierung", 3),
			stuetze("abschreckung", 1.5),
			stuetze("bereitschaft_luft", 2)
		],
		land: {},
		kehrseite: "Abhängigkeit vom Lieferanten: Wer liefert, kann auch wieder sperren."
	},
	{
		id: "w_sanktion",
		seite: "will",
		label: "Sanktionen aufheben",
		text: "Die Sanktionen gegen die türkische Rüstungsbehörde und ihre Lieferketten entfallen.",
		abschluss: [stoss("ansehen", 1)],
		dauer: [
			stuetze("investitionen", 1),
			stuetze("vertrauen_maerkte", 1.5),
			stuetze("auslandskapital", 1)
		],
		land: {},
		kehrseite: "Der Partner verlangt dafür, dass Ankara Position bezieht."
	},
	{
		id: "w_preis",
		seite: "will",
		label: "Preisnachlass beim Gas",
		text: "Der Lieferant senkt den Preis; für die Türkei ein Hebel gegen hohe Energiepreise.",
		dauer: [stuetze("energiepreise", -2), stuetze("lebenshaltung", -1)],
		land: {},
		kehrseite: "Ein Nachlass wird beim nächsten Mal zurückverlangt."
	},
	{
		id: "w_aufschub",
		seite: "will",
		label: "Zahlungsaufschub für Gasrechnungen",
		text: "Rechnungen für Gaslieferungen werden gestundet; der Haushalt gewinnt Luft.",
		abschluss: [{
			t: "schulden",
			d: -.15
		}],
		dauer: [stuetze("vertrauen_maerkte", .5)],
		land: {},
		kehrseite: "Gestundetes Geld ist nicht gespart; die Schuld wächst leise."
	},
	{
		id: "w_swap",
		seite: "will",
		label: "Kredit oder Währungsswap",
		text: "Der Partner stellt Devisen oder einen Swap bereit; die Reserven der Zentralbank steigen.",
		abschluss: [{
			t: "risiko",
			d: -12
		}, {
			t: "schulden",
			d: .1
		}],
		dauer: [stuetze("vertrauen_maerkte", 2), stuetze("auslandskapital", 1.5)],
		land: {},
		kehrseite: "Geldgeber stellen Bedingungen; das Geld ist nie umsonst."
	},
	{
		id: "w_pkk",
		seite: "will",
		label: "Vorgehen gegen PKK und ihre Ableger",
		text: "Der Partner geht gegen bewaffnete Gruppen auf seinem Gebiet vor und stimmt Grenzoperationen ab.",
		abschluss: [stoss("konservative", 1.5)],
		dauer: [stuetze("terrorgefahr", -2)],
		land: {},
		kehrseite: "Ein Versprechen, das nur zählt, wenn es gehalten wird; die Türkei trägt sonst wieder allein."
	},
	{
		id: "w_rueckkehr",
		seite: "will",
		label: "Rückkehr von Geflüchteten aufnehmen",
		text: "Der Partner nimmt Geflüchtete zurück, die freiwillig heimkehren wollen; die Türkei begleitet die Rückkehr.",
		abschluss: [stoss("konservative", 1)],
		dauer: [stuetze("gefluechtete", -3)],
		land: {},
		kehrseite: "Rückkehr ohne Wiederaufbau bleibt ein Wort; ohne Sicherheit kehren nur wenige zurück."
	},
	{
		id: "w_stuetzpunkt",
		seite: "will",
		label: "Stützpunkte und Zugang",
		text: "Türkische Streitkräfte erhalten Zugang zu Häfen, Flugplätzen und Ausbildungsplätzen.",
		abschluss: [stoss("ansehen", -.5)],
		dauer: [stuetze("abschreckung", 1.5)],
		land: {},
		kehrseite: "Ein Stützpunkt im Ausland kostet Geld und macht zum Ziel."
	},
	{
		id: "w_pipeline",
		seite: "will",
		label: "Öl- und Gasleitung nutzen",
		text: "Die Leitung zum türkischen Hafen wird verlässlich betrieben; Ceyhan bleibt Ausfuhrpunkt.",
		dauer: [stuetze("logistik", 1), stuetze("energieimporte", -1)],
		land: {},
		kehrseite: "Ein Bagdader Streit um Öleinnahmen wird schnell zum türkischen Problem."
	},
	{
		id: "w_transit",
		seite: "will",
		label: "Transit für türkische Güter und Leitungen",
		text: "Türkische Waren, Leitungen und Bahnen dürfen den Nachbarn queren.",
		dauer: [stuetze("logistik", 1.5), stuetze("export", .6)],
		land: {},
		kehrseite: "Abhängig ist, wer durch fremdes Land liefern muss."
	},
	{
		id: "w_hafen",
		seite: "will",
		label: "Hafen- und Standortrechte",
		text: "Türkische Betreiber bekommen Konzessionen für Häfen und Logistikzentren.",
		dauer: [stuetze("logistik", 1.2), stuetze("investitionen", .5)],
		land: {},
		kehrseite: "Konzessionen im Ausland hängen an der Laune der Regierung dort."
	},
	{
		id: "w_werk",
		seite: "will",
		label: "Fabrikansiedlung in der Türkei",
		text: "Ein Hersteller baut ein Werk in der Türkei: Arbeitsplätze und Technik statt Einfuhr.",
		dauer: [
			stuetze("industrie", 2),
			stuetze("arbeitsplaetze_industrie", 1.5),
			stuetze("investitionen", 1)
		],
		land: {},
		kehrseite: "Ein Werk kommt mit Auflagen und Zulieferern, die nicht türkisch sind."
	},
	{
		id: "w_1915",
		seite: "will",
		label: "Verzicht auf die Anerkennungskampagne von 1915",
		text: "Der Partner beendet die Kampagne, die Ereignisse von 1915 international als Völkermord anerkennen zu lassen.",
		abschluss: [stoss("konservative", 3), stoss("ansehen", 1)],
		land: {},
		kehrseite: "Eine Forderung, die den Partner im Kern seiner Erinnerung trifft."
	},
	{
		id: "w_inseln",
		seite: "will",
		label: "Entmilitarisierung der Inseln",
		text: "Die Ägäisinseln mit entmilitarisiertem Status werden nicht bewaffnet, wie es die Verträge von Lausanne und Paris vorsehen.",
		abschluss: [stoss("konservative", 2), stoss("abschreckung", 1)],
		land: {},
		kehrseite: "Für Athen eine Rote Linie: Es sieht in der Bewaffnung sein Recht auf Selbstverteidigung."
	},
	{
		id: "w_seegrenze",
		seite: "will",
		label: "Ausgleich bei Seegrenzen und Festlandsockel",
		text: "Seegrenzen, Festlandsockel und Gasfelder werden verhandelt, nicht einseitig erklärt.",
		abschluss: [stoss("konservative", 1.5)],
		dauer: [stuetze("energieimporte", -1.2), stuetze("abschreckung", .5)],
		land: {},
		kehrseite: "Jeder Kompromiss auf See sieht im Inneren nach Nachgeben aus."
	},
	{
		id: "w_trnc",
		seite: "will",
		label: "Gleichberechtigung Nordzyperns",
		text: "Die Republik Zypern erkennt die Gleichberechtigung der Volksgruppen an; Ankaras Ziel ist eine Lösung mit zwei Staaten.",
		abschluss: [stoss("konservative", 3), stoss("ansehen", -1)],
		land: {},
		kehrseite: "Eine Rote Linie der Republik Zypern; sie erklärt jede Anerkennung Nordzyperns zum Verstoß gegen UN-Beschlüsse."
	},
	{
		id: "w_direkthandel",
		seite: "will",
		label: "Direkthandel mit Nordzypern",
		text: "Waren und Reisende aus dem Norden der Insel dürfen ohne Umweg in die EU.",
		abschluss: [stoss("konservative", 1.5)],
		dauer: [stuetze("tourismus", .5)],
		land: {},
		kehrseite: "Nikosia wertet jeden Direkthandel als Aufwertung der Teilung."
	},
	{
		id: "w_libyen",
		seite: "will",
		label: "Gemeinsame Linie in Libyen",
		text: "Abstimmung statt Stellvertreterkonkurrenz: Beide Seiten sprechen mit denselben Partnern in Libyen.",
		abschluss: [stoss("ansehen", 1)],
		dauer: [stuetze("abschreckung", .5)],
		land: {},
		kehrseite: "Wer sich abstimmt, muss auf den eigenen Vorteil im Land verzichten."
	},
	{
		id: "w_getreide",
		seite: "will",
		label: "Getreide- und Handelskorridor",
		text: "Getreide und Düngemittel fahren durch das Schwarze Meer; Häfen und Versicherer arbeiten wieder.",
		dauer: [stuetze("lebensmittelpreise", -1.5), stuetze("export", .5)],
		land: {},
		kehrseite: "Ein Korridor hält nur, solange beide Seiten still halten."
	},
	{
		id: "w_luftraum",
		seite: "will",
		label: "Überflug und Luftraum öffnen",
		text: "Flüge dürfen wieder über das Gebiet des Partners führen; Fluglinien und Fracht profitieren.",
		dauer: [stuetze("tourismus", .6), stuetze("logistik", .4)],
		land: {},
		kehrseite: "Ein Zugeständnis im Luftraum wird zu Hause als Schwäche gelesen."
	},
	{
		id: "w_investition_zusage",
		seite: "will",
		label: "Investitionszusagen und Einlagen",
		text: "Staatsfonds und Banken des Partners legen Geld in der Türkei an.",
		dauer: [stuetze("auslandskapital", 2.5), stuetze("investitionen", 1.5)],
		land: {},
		kehrseite: "Geld aus dem Ausland folgt Bedingungen; wer zahlt, will mitreden."
	},
	{
		id: "w_akkuyu",
		seite: "will",
		label: "Akkuyu vollenden: Zahlungsweg und Fertigstellung",
		text: "Das erste Kernkraftwerk geht ans Netz; der Zahlungsweg wird gesichert, gestundete Gelder werden freigegeben.",
		dauer: [stuetze("stromversorgung", 1.5), stuetze("energieimporte", -1)],
		land: {},
		kehrseite: "Ein Kraftwerk in russischer Hand: Wer den Brennstoff liefert, hat das letzte Wort."
	},
	{
		id: "w_handelsziel",
		seite: "will",
		label: "Handelsziel und Rüstungsproduktion",
		text: "Der Handel wächst auf ein gemeinsames Ziel, dazu gemeinsame Rüstungsproduktion.",
		dauer: [stuetze("export", 2), stuetze("industrie", 1)],
		land: {},
		kehrseite: "Handelsziele sind nur Wünsche, solange die Zölle nicht fallen."
	},
	{
		id: "w_defizit",
		seite: "will",
		label: "Ausgleich des Handelsdefizits",
		text: "Ein Teil der Einfuhren wird durch türkische Lieferungen ausgeglichen; das Defizit sinkt.",
		dauer: [stuetze("export", 2), stuetze("kostendruck", -.5)],
		land: {},
		kehrseite: "Der Partner verlangt im Gegenzug Zugeständnisse bei Investitionen."
	}
];
const KLAUSEL_NACH_ID = Object.fromEntries(KLAUSELN.map((k) => [k.id, k]));
/** Ausstrahlung auf Dritte: Wer mit dem einen paktiert, verärgert den anderen (Klausel oder Land → betroffene Länder). */
const AUSSTRAHLUNG = {
	"ruestung_koop@AZE": [{
		land: "ARM",
		dim: "vertrauen",
		d: -6,
		text: "Erevan sieht die Aufrüstung Bakus mit Sorge."
	}],
	"ruestung_koop@UKR": [{
		land: "RUS",
		dim: "vertrauen",
		d: -6,
		text: "Moskau wertet Drohnenlieferungen an Kiew als Parteinahme."
	}],
	"ruestung_koop@LBY": [{
		land: "EGY",
		dim: "vertrauen",
		d: -5,
		text: "Kairo sieht Ankaras Rolle in Libyen als Gegenspiel."
	}, {
		land: "GRC",
		dim: "vertrauen",
		d: -4,
		text: "Athen sieht die türkische Präsenz in Libyen und das Seegrenz-Memorandum mit Sorge."
	}],
	"ruestung_koop@SYR": [{
		land: "ISR",
		dim: "vertrauen",
		d: -4,
		text: "Jerusalem wertet türkische Rüstungszusammenarbeit mit Damaskus als Bedrohung."
	}],
	"ruestung_koop@SAU": [{
		land: "IRN",
		dim: "vertrauen",
		d: -4,
		text: "Teheran beobachtet den Rüstungsbund am Golf."
	}],
	"gas_kauf@RUS": [{
		land: "USA",
		dim: "vertrauen",
		d: -4,
		text: "Washington sieht jeden Gasvertrag mit Moskau kritisch."
	}, {
		land: "EU",
		dim: "vertrauen",
		d: -3,
		text: "Brüssel will Russlands Energieeinnahmen austrocknen."
	}],
	"gas_kauf@IRN": [{
		land: "USA",
		dim: "vertrauen",
		d: -5,
		text: "Washington droht mit Sekundärsanktionen."
	}],
	"grenzoeffnung@ARM": [{
		land: "AZE",
		dim: "vertrauen",
		d: -6,
		text: "Baku verlangt zuerst einen Friedensvertrag mit Armenien."
	}],
	"s400@USA": [{
		land: "RUS",
		dim: "vertrauen",
		d: -8,
		text: "Moskau verliert einen Großkunden und sieht die Türkei im westlichen Lager."
	}],
	"ende_sperre@ISR": [{
		land: "SAU",
		dim: "vertrauen",
		d: -2,
		text: "Manche arabische Partner lesen die Öffnung als Signal an Jerusalem."
	}],
	"beistand@SAU": [{
		land: "IRN",
		dim: "vertrauen",
		d: -5,
		text: "Teheran liest den Pakt als Bündnis gegen sich."
	}],
	"w_seegrenze@EGY": [{
		land: "GRC",
		dim: "vertrauen",
		d: -3,
		text: "Athen fürchtet eine Absprache über den Kopf Griechenlands."
	}],
	"transit@KAZ": [{
		land: "RUS",
		dim: "vertrauen",
		d: -2,
		text: "Moskau sieht die Umgehung seines Transitnetzes."
	}]
};
const PROFILE = {
	USA: {
		hebel: -2,
		rot: [],
		hebelText: "Washington sitzt am längeren Hebel: Es liefert die Technik, die Ankara braucht.",
		werte: {
			s400: 9,
			ruestung_kauf: 6,
			militaerzugang: 4,
			sanktionen_umgehung: 6,
			vermittlung_zusage: 2,
			gas_kauf: 5,
			investitionen_oeffnen: 2,
			w_ruestung: -5,
			w_sanktion: -6
		},
		texte: {
			w_ruestung: {
				label: "F-35, F110-Triebwerke und Ersatzteile freigeben",
				text: "Washington gibt die gesperrte Technik frei: F-35-Kampfjets (die Türkei will 40), F110-Triebwerke für das Kampfflugzeug KAAN, Ersatzteile für die F-16."
			},
			w_sanktion: {
				label: "CAATSA-Sanktionen aufheben",
				text: "Die Sanktionen gegen die türkische Rüstungsbehörde wegen des Kaufs der S-400 entfallen."
			},
			s400: { text: "Das russische Luftabwehrsystem S-400 wird eingelagert oder stillgelegt; das Gesetz zur Verteidigung der USA (NDAA §1245) knüpft den Weg zurück an genau diese Bedingung." },
			gas_kauf: {
				label: "Amerikanisches Flüssiggas kaufen",
				text: "Langfristige Lieferverträge über US-LNG: ein Teil des Gases kommt nicht mehr aus Moskau."
			}
		}
	},
	EU: {
		hebel: 0,
		rot: [],
		hebelText: "Brüssel ist der größte Handelspartner, aber ein Bündnis von 27: Jede Bewegung braucht Einstimmigkeit.",
		werte: {
			reform_zusage: 9,
			zoll: 5,
			sanktionen_umgehung: 6,
			migration_zusage: 7,
			investitionen_oeffnen: 2,
			vermittlung_zusage: 1,
			w_zollunion: -5,
			w_visa: -7,
			w_ruestung: -4
		},
		texte: {
			w_zollunion: { text: "Die Zollunion von 1995 wird modernisiert; Griechenland und Zypern blockieren bisher." },
			w_ruestung: {
				label: "SAFE-Teilnahme (europäische Rüstungsprogramme)",
				text: "Die Türkei darf an den gemeinsamen Rüstungsprogrammen der EU teilnehmen."
			},
			w_visa: { text: "Visafreiheit für Kurzaufenthalte im Schengenraum; Brüssel knüpft sie an Reformen bei Rechtsstaat und Terrorgesetzen." }
		}
	},
	RUS: {
		hebel: 0,
		rot: [],
		hebelText: "Moskau braucht die Türkei als Tor nach Westen; Ankara braucht Moskaus Gas und Akkuyu.",
		werte: {
			gas_kauf: 8,
			zoll: 3,
			meerengen: 4,
			vermittlung_zusage: 3,
			investitionen_oeffnen: 2,
			zahlungsweg: 7,
			transit: 5,
			w_preis: -6,
			w_aufschub: -4,
			w_akkuyu: -3,
			w_getreide: -2
		},
		texte: {
			gas_kauf: {
				label: "Gasverträge verlängern",
				text: "Die Gasverträge mit Russland laufen Ende 2026 aus; es geht um rund 22 Milliarden Kubikmeter im Jahr."
			},
			w_akkuyu: { text: "Akkuyu wird fertig; rund 2 Milliarden US-Dollar stecken wegen der Sanktionen fest, ein Zahlungsweg muss her." },
			transit: {
				label: "Türkei als Gas-Drehkreuz",
				text: "Russisches Gas geht über türkisches Gebiet weiter nach Südeuropa."
			}
		}
	},
	GRC: {
		hebel: -1,
		rot: ["w_inseln"],
		hebelText: "Athen hat als EU- und NATO-Mitglied Rückhalt, den es im Streit mit Ankara nutzt.",
		werte: {
			v_casus: 7,
			verzicht_bohrung: 6,
			migration_zusage: 6,
			vermittlung_zusage: 1,
			w_inseln: -99,
			w_seegrenze: -8,
			w_zollunion: -3
		},
		rotText: { w_inseln: "Athen erklärt die Bewaffnung der Inseln zum Recht auf Selbstverteidigung; über den Status spricht es nicht." },
		texte: {
			v_casus: { text: "Der Parlamentsbeschluss von 1995 (Kriegsgrund bei zwölf Seemeilen) wird nicht mehr bekräftigt; Athen nennt das seit Jahren als Bedingung für Gespräche über die Seegrenzen." },
			w_seegrenze: {
				label: "Zwölf-Meilen-Zone und Festlandsockel verhandeln",
				text: "Seegrenzen und Festlandsockel werden verhandelt, nicht einseitig erklärt; das Kabelprojekt Great Sea Interconnector hängt daran."
			}
		}
	},
	IRN: {
		hebel: 0,
		rot: [],
		hebelText: "Beide brauchen einander: Teheran den Markt, Ankara das Gas.",
		werte: {
			gas_kauf: 8,
			zoll: 4,
			visa: 3,
			vermittlung_zusage: 3,
			transit: 2,
			zahlungsweg: 8,
			w_pkk: -4,
			w_preis: -5
		},
		texte: {
			gas_kauf: {
				label: "Gasvertrag verlängern",
				text: "Der Vertrag über etwa 9,6 Milliarden Kubikmeter im Jahr lief Ende Juli 2026 aus; ehemalige BOTAŞ-Manager halten eine automatische Verlängerung um fünf Jahre für möglich."
			},
			w_pkk: {
				label: "Vorgehen gegen PJAK",
				text: "Teheran geht gegen die kurdische Gruppe PJAK an der Grenze vor."
			},
			vermittlung_zusage: { text: "Ankara vermittelt bei einer Waffenruhe und bei Fragen wie der Straße von Hormus." }
		}
	},
	SYR: {
		hebel: 4,
		rot: [],
		hebelText: "Damaskus ist auf Ankara angewiesen: Wiederaufbau, Strom und Sicherheit hängen an der Türkei.",
		werte: {
			bauauftraege: 8,
			ruestung_koop: 7,
			energie_lieferung: 6,
			kredit_hilfe: 6,
			visa: 2,
			w_rueckkehr: -5,
			w_pkk: -3,
			w_stuetzpunkt: -3
		},
		texte: {
			ruestung_koop: {
				label: "Ausbildungs- und Rüstungsabkommen",
				text: "Türkische Ausbilder und Systeme für die syrischen Streitkräfte."
			},
			energie_lieferung: {
				label: "Strom und Gas über die Kilis–Aleppo-Leitung",
				text: "Die Kilis–Aleppo-Leitung und Stromnetze werden ausgebaut; der Wiederaufbau braucht beides."
			},
			w_pkk: {
				label: "SDF in den Staat integrieren",
				text: "Die kurdisch geführten SDF werden in die syrischen Streitkräfte eingegliedert; Ankara will keine eigenständige Kraft an der Grenze."
			},
			w_stuetzpunkt: { text: "Türkische Stützpunkte im Norden Syriens bleiben; Damaskus muss zustimmen." }
		}
	},
	IRQ: {
		hebel: 0,
		rot: [],
		hebelText: "Bagdad braucht Wasser aus der Türkei; Ankara braucht Ruhe an der Grenze und die Pipeline.",
		werte: {
			wasser: 8,
			bauauftraege: 6,
			zoll: 3,
			transit: 4,
			kredit_hilfe: 3,
			w_pipeline: -3,
			w_pkk: -6
		},
		texte: {
			w_pipeline: {
				label: "Kirkuk–Ceyhan-Leitung",
				text: "Der Einjahresvertrag vom August 2026 wird verlängert; Ziel sind eine Million Barrel am Tag."
			},
			transit: {
				label: "Entwicklungsstraße",
				text: "Die geplante Entwicklungsstraße von Basra zur türkischen Grenze verbindet Golf und Europa."
			},
			wasser: { text: "Bagdad verlangt feste Abflussmengen aus den türkischen Staudämmen; bisher gibt es Projekte ohne zugesagte Wassermenge." },
			w_pkk: { text: "Bagdad koordiniert das Vorgehen gegen die PKK auf irakischem Gebiet, statt Militäreinsätze zu dulden." }
		}
	},
	AZE: {
		hebel: 1,
		rot: [],
		hebelText: "Baku und Ankara sind eng verbunden, aber Baku hat das Gas und den Korridor nach Osten.",
		werte: {
			ruestung_koop: 7,
			gas_kauf: 7,
			beistand: 8,
			investitionen_oeffnen: 3,
			w_transit: -2,
			w_preis: -3
		},
		texte: {
			gas_kauf: { text: "Gas über die Pipelines TANAP und TAP; die Leitung Iğdır–Nachitschewan von 2025 ist der Anfang." },
			w_transit: {
				label: "Nachitschewan-Bahn und Leitung",
				text: "Die Bahn Kars–Nachitschewan und die Verbindung über TRIPP verbinden die Türkei mit Baku."
			}
		}
	},
	ARM: {
		hebel: 0,
		rot: ["w_1915"],
		hebelText: "Erevan will die Grenze und die Bahn, aber nicht um den Preis seiner Erinnerung.",
		werte: {
			grenzoeffnung: 9,
			transit: 5,
			zoll: 3,
			w_transit: -6,
			w_1915: -99
		},
		rotText: { w_1915: "Erevan verlangt die Anerkennung von 1915; auf sie zu verzichten, hieße, seine Erinnerung zu verkaufen." },
		texte: {
			grenzoeffnung: { text: "Grenzöffnung für Drittstaatler und Diplomaten ist vereinbart, aber nicht umgesetzt; Direktflüge gibt es seit 2026." },
			transit: {
				label: "Bahn Gjumri–Kars",
				text: "Die Bahn zwischen Gjumri und Kars verbindet beide Länder."
			},
			w_transit: {
				label: "Transit über den Sangesur-Korridor (TRIPP)",
				text: "Die Verbindung nach Nachitschewan und Baku führt über armenisches Gebiet; Transit gegen Grenzöffnung ist der Kern eines Ausgleichs."
			}
		}
	},
	SAU: {
		hebel: -2,
		rot: [],
		hebelText: "Die Golfstaaten haben das Geld; Ankara braucht ihre Einlagen und Aufträge.",
		werte: {
			ruestung_koop: 8,
			bauauftraege: 5,
			militaerzugang: 4,
			beistand: 7,
			w_swap: -4,
			w_investition_zusage: -5
		},
		texte: {
			beistand: {
				label: "Beistandspakt ausbauen",
				text: "Am 7. August 2026 unterzeichneten Saudi-Arabien, Pakistan und die Türkei einen Beistandspakt; er wird jetzt mit Leben gefüllt."
			},
			ruestung_koop: {
				label: "KAAN und Luftabwehr",
				text: "Das Kampfflugzeug KAAN ist in Endverhandlung; dazu kommt Luftabwehr."
			}
		}
	},
	ISR: {
		hebel: 0,
		rot: [],
		hebelText: "Handel läuft trotz Streit; die Sperre ist das Druckmittel beider Seiten.",
		werte: {
			ende_sperre: 9,
			zoll: 4,
			vermittlung_zusage: 3,
			w_luftraum: -2,
			w_zoll: -2
		},
		texte: {
			ende_sperre: { text: "Die Handels- und Häfensperre beendet die Verbindungen; ein Ende ist der Preis für alles Weitere." },
			vermittlung_zusage: {
				label: "Türkei im Friedensrat für Gaza",
				text: "Die Türkei ist Mitglied im Friedensrat für Gaza; Jerusalem will sie dort zurückhaltend sehen."
			}
		}
	},
	CHN: {
		hebel: 0,
		rot: [],
		hebelText: "China ist der größere Markt, die Türkei der Tor zum Westen: ein Handel unter Gleichen mit Schlagseite.",
		werte: {
			investitionen_oeffnen: 6,
			transit: 5,
			zoll: 4,
			bauauftraege: 2,
			w_defizit: -5,
			w_werk: -5,
			w_swap: -4
		},
		texte: {
			w_defizit: {
				label: "Handelsdefizit ausgleichen",
				text: "Das Handelsdefizit betrug 2025 rund 46,3 Milliarden US-Dollar; Ankara verlangt Ausgleich über Zölle, Quoten und Investitionen."
			},
			w_werk: {
				label: "Werk in der Türkei (BYD)",
				text: "Ein BYD-Werk in der Türkei wurde abgesagt; Ankara will eine neue Zusage."
			},
			w_swap: {
				label: "RMB-Clearing und Swap",
				text: "Seit November 2025 gibt es eine Abrechnung in Renminbi; ein größerer Swap würde die Reserven stützen."
			},
			transit: {
				label: "Mittlerer Korridor",
				text: "Bahn und Häfen als Landbrücke zwischen China und Europa, an Russland vorbei."
			}
		}
	},
	UKR: {
		hebel: 0,
		rot: [],
		hebelText: "Kiew braucht Ankaras Meerengen und Drohnen, Ankara braucht Kiews Vertrauen.",
		werte: {
			ruestung_koop: 8,
			meerengen: 7,
			bauauftraege: 6,
			vermittlung_zusage: 4,
			seesicherheit: 4,
			w_getreide: -3,
			w_zoll: -3
		},
		texte: {
			seesicherheit: {
				label: "Minenräumung im Schwarzen Meer (Maritime Component Command)",
				text: "Im April 2026 wurde ein gemeinsames Seekommando eingerichtet; die Minenräumung ist sein erster Auftrag."
			},
			vermittlung_zusage: {
				label: "Vermittlung: Gefangenenaustausch in Istanbul",
				text: "Ankara richtet Gespräche und den Austausch von Gefangenen in Istanbul aus."
			}
		}
	},
	GEO: {
		hebel: 2,
		rot: [],
		hebelText: "Tiflis braucht die Türkei als Absatzmarkt und Tor nach Westen.",
		werte: {
			transit: 6,
			zoll: 3,
			visa: 3,
			ruestung_koop: 2,
			investitionen_oeffnen: 3,
			w_transit: -2,
			w_hafen: -4
		},
		texte: {
			transit: {
				label: "Bahn Baku–Tiflis–Kars (BTK)",
				text: "Die Bahn ist seit dem 2. Juni 2026 im Volllastbetrieb; der Ausbau geht weiter."
			},
			w_hafen: {
				label: "Hafen Anaklia",
				text: "Türkische Betreiber wollen den Tiefseehafen Anaklia am Schwarzen Meer mit betreiben."
			}
		}
	},
	EGY: {
		hebel: 0,
		rot: [],
		hebelText: "Kairo war lange Gegenspieler; die Annäherung seit Februar 2026 trägt, aber Libyen und die Seegrenzen belasten.",
		werte: {
			ruestung_koop: 7,
			zoll: 5,
			investitionen_oeffnen: 3,
			w_handelsziel: -4,
			w_libyen: -6,
			w_seegrenze: -5
		},
		texte: { w_handelsziel: {
			label: "Handel von 8 auf 15 Milliarden Dollar",
			text: "Die Strategische Partnerschaft vom Februar 2026 sieht vor, den Handel von 8 auf 15 Milliarden US-Dollar zu steigern, dazu gemeinsame Rüstungsproduktion."
		} }
	},
	LBY: {
		hebel: 2,
		rot: [],
		hebelText: "Tripolis lehnt sich an Ankara an: Truppen, Ausbildung und Aufträge stützen die Regierung dort.",
		werte: {
			ruestung_koop: 7,
			militaerzugang: 5,
			bauauftraege: 6,
			bohrung: 4,
			w_seegrenze: -2,
			w_stuetzpunkt: -3
		},
		texte: { w_seegrenze: {
			label: "Seegrenz-Memorandum von 2019 bekräftigen",
			text: "Das Abkommen von 2019 über die Seegrenzen im östlichen Mittelmeer wird bekräftigt; Griechenland, Ägypten und Zypern lehnen es ab."
		} }
	},
	KAZ: {
		hebel: 0,
		rot: [],
		hebelText: "Astana verhandelt ohne Eile: Es hat mehrere Partner und lässt sich keinem ganz.",
		werte: {
			transit: 6,
			bauauftraege: 5,
			ruestung_koop: 4,
			investitionen_oeffnen: 3,
			visa: 2,
			w_transit: -3,
			w_investition_zusage: -3
		},
		texte: { transit: {
			label: "Mittlerer Korridor über das Kaspische Meer",
			text: "Bahn, Häfen und Schiffe an der Trans-Kaspischen Route, an Russland vorbei."
		} }
	},
	CYP: {
		hebel: -1,
		rot: ["w_trnc"],
		hebelText: "Nikosia ist EU-Mitglied und nutzt den Rückhalt: Ohne Bewegung der Türkei gibt es keine Gefälligkeit.",
		werte: {
			hafen_oeffnung: 9,
			verzicht_bohrung: 7,
			vermittlung_zusage: 3,
			w_direkthandel: -8,
			w_seegrenze: -6,
			w_trnc: -99,
			w_zollunion: -3
		},
		rotText: { w_trnc: "Nikosia erkennt Nordzypern nicht an; jede Zwei-Staaten-Lösung verstößt aus seiner Sicht gegen die UN-Beschlüsse." },
		texte: { verzicht_bohrung: {
			label: "Keine Bohrungen in der zyprischen Wirtschaftszone",
			text: "Bohrschiffe bleiben aus dem Gebiet, das Zypern als seine ausschließliche Wirtschaftszone beansprucht."
		} }
	}
};
const VERTRAGSLAUFZEITEN = [
	2,
	5,
	10
];
//#endregion
//#region game/src/sim/reich.ts
const VORHABEN_NACH_ID = new Map(VORHABEN.map((v) => [v.id, v]));
const VORTEIL_NACH_ID = new Map(VORTEILE.map((v) => [v.id, v]));
const vorhabenDef = (id) => VORHABEN_NACH_ID.get(id);
const vorteilDef = (id) => VORTEIL_NACH_ID.get(id);
const VERWALTUNG_START = 60;
/** Anteil unabhängiger und reformorientierter Mitglieder am Spielbeginn */
const SITZE_START = {
	aym: 6 / 15,
	hsk: 6 / 13
};
const MELDUNGEN_MAX = 40;
/** Der Zustand des Reiches; wird beim ersten Zugriff angelegt (ältere Spielstände haben ihn nicht). */
function reichZustand(w) {
	const spiel = w.spiel;
	if (!spiel) throw new Error("Ohne Spielschleife gibt es kein Reich.");
	if (spiel.reich) return spiel.reich;
	const z = {
		verwaltung: VERWALTUNG_START,
		bestand: {},
		laufend: [],
		staetten: {},
		vorteile: [],
		gewaehlt: {},
		meldungen: [],
		feier: [],
		bauGenutzt: 0,
		sitze: {
			aym: {
				loyal: 9,
				unabhaengig: 3,
				reform: 3
			},
			hsk: {
				loyal: 7,
				unabhaengig: 3,
				reform: 3
			}
		}
	};
	for (const e of ERBE) z.staetten[e.id] = { zustand: STAETTEN_START[e.id] ?? (e.unesco.status === "welterbe" ? 66 : e.unesco.status === "tentativ" ? 52 : 46) };
	for (const v of VORHABEN) if (v.start?.status === "fertig") {
		z.bestand[v.id] = {
			seit: "Spielbeginn",
			zustand: v.start.zustand ?? 78
		};
		if (v.ast) z.gewaehlt[v.ast] = v.id;
	} else if (v.start?.status === "im_bau") {
		z.laufend.push({
			id: v.id,
			fortschritt: Math.round(v.kosten.bau * (v.start.fortschritt ?? .3)),
			start: "Spielbeginn"
		});
		if (v.ast) z.gewaehlt[v.ast] = v.id;
	}
	spiel.reich = z;
	return z;
}
const level = (w, id) => nationalAverage(NET, w.net, id);
/** Baupunkte je Monat, die das Land insgesamt aufbringt. */
function bauKapazitaet(w) {
	const z = reichZustand(w);
	let cap = 110 + .35 * level(w, "m_bauindustrie") + .25 * level(w, "m_industrie_modernisierung") + .15 * level(w, "m_fachkraefteprogramm");
	for (const id of Object.keys(z.bestand)) cap += vorhabenDef(id)?.kapazitaet?.bau ?? 0;
	return Math.round(cap * 10) / 10;
}
/** Verwaltungskraft: Vorrat und monatliche Bilanz. */
function verwaltungBilanz(w) {
	const z = reichZustand(w);
	let einkommen = 18 + .05 * level(w, "m_verwaltungsdigital");
	for (const id of Object.keys(z.bestand)) einkommen += vorhabenDef(id)?.kapazitaet?.verwaltung ?? 0;
	let bau = 0;
	for (const l of z.laufend) if (!l.pausiert) bau += vorhabenDef(l.id)?.kosten.verwaltung ?? 0;
	let unterhalt = 0;
	for (const id of Object.keys(z.bestand)) unterhalt += vorhabenDef(id)?.unterhalt ?? 0;
	return {
		vorrat: z.verwaltung,
		einkommen,
		bau,
		unterhalt,
		netto: einkommen - bau - unterhalt
	};
}
const nodeName = (id) => NET.nodes[NET.index.get(id) ?? -1]?.name ?? id;
function pruefeVoraus(w, v) {
	const z = reichZustand(w);
	const ok = (erfuellt, fortschritt, text) => ({
		voraus: v,
		erfuellt,
		fortschritt: erfuellt ? 1 : clamp(fortschritt, 0, .99),
		text
	});
	switch (v.art) {
		case "bestand": {
			const d = vorhabenDef(v.id);
			const da = !!z.bestand[v.id];
			const im = z.laufend.find((l) => l.id === v.id);
			return ok(da, im && d ? im.fortschritt / d.kosten.bau : 0, `„${d?.name ?? v.id}“ ist fertig`);
		}
		case "nicht-bestand": return ok(!z.bestand[v.id], 0, v.text);
		case "staette-max": {
			const st = z.staetten[v.id]?.zustand ?? 0;
			return ok(st <= v.max, 1 - (st - v.max) / 100, `${v.text} (jetzt ${Math.round(st)})`);
		}
		case "staetten": {
			const zustaende = v.ids.map((id) => ({
				id,
				z: z.staetten[id]?.zustand ?? 0
			}));
			const schwach = zustaende.reduce((a, b) => b.z < a.z ? b : a);
			return ok(zustaende.every((s) => s.z >= v.min), zustaende.reduce((s, x) => s + Math.min(1, x.z / v.min), 0) / zustaende.length, `${v.text} (schwächste: ${ERBE_NACH_ID[schwach.id]?.name ?? schwach.id}, Zustand ${Math.round(schwach.z)})`);
		}
		case "knoten": {
			const jetzt = level(w, v.id);
			const gut = (v.min === void 0 || jetzt >= v.min) && (v.max === void 0 || jetzt <= v.max);
			const ziel = v.min ?? v.max;
			return ok(gut, 1 - Math.abs(ziel - jetzt) / 50, `${nodeName(v.id)} ${v.min !== void 0 ? `mindestens ${v.min}` : `höchstens ${v.max}`} (jetzt ${Math.round(jetzt)})`);
		}
		case "massnahme": {
			const jetzt = level(w, v.id);
			const gut = (v.min === void 0 || jetzt >= v.min - .5) && (v.max === void 0 || jetzt <= v.max + .5);
			const ziel = v.min ?? v.max;
			return ok(gut, 1 - Math.abs(ziel - jetzt) / 50, `${nodeName(v.id)} ${v.min !== void 0 ? `mindestens auf Stufe ${v.min}` : `höchstens auf Stufe ${v.max}`} (jetzt ${Math.round(jetzt)})`);
		}
		case "land": {
			const jetzt = dimensionZu(w, v.land, v.dim);
			const gut = (v.min === void 0 || jetzt >= v.min) && (v.max === void 0 || jetzt <= v.max);
			const namen = {
				handel: "Handel",
				sicherheit: "Sicherheit",
				vertrauen: "Vertrauen",
				konflikt: "Konflikt"
			};
			const ziel = v.min ?? v.max;
			return ok(gut, 1 - Math.abs(ziel - jetzt) / 50, `${namen[v.dim]} zu ${v.land} ${v.min !== void 0 ? `mindestens ${v.min}` : `höchstens ${v.max}`} (jetzt ${Math.round(jetzt)})`);
		}
		case "vorteil": {
			const d = vorteilDef(v.id);
			return ok(aktiveVorteile(w).includes(v.id), 0, `Vorteil „${d?.name ?? v.id}“ ist aktiv`);
		}
		case "jahr": return ok(Number(w.date.slice(0, 4)) >= v.min, 0, `Frühestens ab ${v.min}`);
	}
}
function vorhabenSicht(w, id) {
	const v = vorhabenDef(id);
	const spiel = w.spiel;
	if (!v || !spiel) return null;
	const z = reichZustand(w);
	const voraus = v.voraus.map((x) => pruefeVoraus(w, x));
	const bereit = voraus.every((x) => x.erfuellt);
	const bezahlbar = kannZahlen(spiel.kapital, v.kosten.pk);
	const verwaltungOk = z.verwaltung >= (v.kosten.verwaltung ?? 0) * 3;
	const bestand = z.bestand[id];
	const lauf = z.laufend.find((l) => l.id === id);
	const basis = {
		v,
		voraus,
		bezahlbar,
		verwaltungOk,
		bereit
	};
	if (bestand) return {
		...basis,
		status: "fertig",
		fortschritt: 1,
		zustand: bestand.zustand
	};
	if (lauf) {
		const f = v.kosten.bau > 0 ? lauf.fortschritt / v.kosten.bau : 1;
		const rate = bauplan(w)[id] ?? 0;
		const cap = Math.max(1, rate > 0 ? rate : Math.min(v.kosten.bau / Math.max(1, v.kosten.monate), bauKapazitaet(w)));
		return {
			...basis,
			status: lauf.pausiert ? "pausiert" : "im_bau",
			fortschritt: f,
			rate,
			restMonate: Math.ceil((v.kosten.bau - lauf.fortschritt) / cap)
		};
	}
	if (v.sperre) {
		if (pruefeVoraus(w, v.sperre.solange).erfuellt) return {
			...basis,
			status: "gesperrt",
			grund: v.sperre.text,
			fortschritt: 0
		};
	}
	if (v.ast) {
		const anderes = z.gewaehlt[v.ast];
		if (anderes && anderes !== id) return {
			...basis,
			status: "ausgeschlossen",
			grund: `Schließt sich mit „${vorhabenDef(anderes)?.name ?? anderes}“ aus.`,
			fortschritt: 0
		};
	}
	return {
		...basis,
		status: "verfuegbar",
		fortschritt: 0
	};
}
/** Wie viele Baupunkte je Monat jedes laufende Vorhaben bei der jetzigen Reihenfolge und Kapazität bekommt. */
function bauplan(w) {
	const z = reichZustand(w);
	const verzug = z.verwaltung <= 0 ? .5 : 1;
	let cap = bauKapazitaet(w);
	const out = {};
	for (const l of z.laufend) {
		const v = vorhabenDef(l.id);
		if (!v || l.pausiert) {
			out[l.id] = 0;
			continue;
		}
		const rest = Math.max(0, v.kosten.bau - l.fortschritt);
		const aufnahme = Math.min(v.kosten.bau / Math.max(1, v.kosten.monate), cap, rest);
		out[l.id] = aufnahme * verzug;
		cap -= aufnahme;
	}
	return out;
}
function wendeEffekt(w, e, faktor = 1) {
	const spiel = w.spiel;
	const z = spiel ? reichZustand(w) : null;
	switch (e.t) {
		case "knoten":
			if (NET.index.has(e.id)) wirke(w, e.id, e.d * faktor, e.provinzen && e.provinzen.length ? e.provinzen : null);
			break;
		case "land":
			landAendern(w, e.land, { [e.dim]: e.d * faktor });
			break;
		case "kapital":
			if (spiel) spiel.kapital = clamp(spiel.kapital + e.d * faktor, 0, 150);
			break;
		case "schulden":
			w.economy.debtRatio += e.d * faktor;
			break;
		case "risiko":
			w.economy.riskPremium = Math.max(0, w.economy.riskPremium + e.d * faktor);
			break;
		case "staette":
			if (z?.staetten[e.id]) z.staetten[e.id].zustand = clamp(z.staetten[e.id].zustand + e.d * faktor, 0, 100);
			break;
		case "serie":
			if (z) {
				for (const s of ERBE) if ((e.serie === "alle" || s.serien?.includes(e.serie)) && z.staetten[s.id]) z.staetten[s.id].zustand = clamp(z.staetten[s.id].zustand + e.d * faktor, 0, 100);
			}
			break;
		case "entferne":
			if (z) delete z.bestand[e.id];
			break;
		case "bestand": if (z?.bestand[e.id]) z.bestand[e.id].zustand = clamp(z.bestand[e.id].zustand + e.d * faktor, 0, 100);
	}
}
/** Größen, bei denen ein höherer Wert schlechter ist. */
const SCHLECHT_WENN_HOCH = /* @__PURE__ */ new Set([
	"haftueberfuellung",
	"ausnahmerecht",
	"strassburg_druck",
	"korruption",
	"polarisierung",
	"kriminalitaet",
	"terrorgefahr",
	"stau",
	"energiepreise",
	"energieimporte",
	"lebenshaltung",
	"armut",
	"ungleichheit",
	"schattenwirtschaft",
	"duerre",
	"kostendruck",
	"mieten",
	"abwanderung",
	"landflucht",
	"zinslast",
	"streikneigung",
	"gefluechtete"
]);
function effektZeile(e, modus = "sofort") {
	const zahl = (x) => Math.abs(x).toLocaleString("de-DE", { maximumFractionDigits: 1 });
	if (modus === "dauer" && e.t === "knoten") {
		const node = NET.nodes[NET.index.get(e.id) ?? -1];
		const verschiebung = node && node.decay > 0 ? e.d / node.decay : e.d;
		return effektZeile({
			...e,
			d: Math.round(verschiebung * 10) / 10
		}, "sofort");
	}
	const je = modus === "dauer" && e.t !== "knoten" ? " je Monat" : "";
	const z = effektZeileBasis(e, zahl);
	return z ? {
		...z,
		text: z.text + je
	} : null;
}
function effektZeileBasis(e, zahl) {
	switch (e.t) {
		case "knoten": {
			if (!e.d) return null;
			const node = NET.nodes[NET.index.get(e.id) ?? -1];
			const name = node?.name ?? e.id;
			const gruppe = node?.kind === "gruppe";
			const schlecht = SCHLECHT_WENN_HOCH.has(e.id);
			const wo = e.provinzen && e.provinzen.length && e.provinzen.length < 81 ? ` in ${e.provinzen.length} ${e.provinzen.length === 1 ? "Provinz" : "Provinzen"}` : "";
			return {
				text: `${name} ${e.d > 0 ? "+" : "−"}${zahl(e.d)}${wo}`,
				richtung: e.d > 0 ? 1 : -1,
				gut: gruppe ? e.d > 0 : schlecht ? e.d < 0 : e.d > 0
			};
		}
		case "land": return {
			text: `${e.land}: ${{
				handel: "Handel",
				sicherheit: "Sicherheit",
				vertrauen: "Vertrauen",
				konflikt: "Konflikt"
			}[e.dim]} ${e.d > 0 ? "+" : "−"}${zahl(e.d)}`,
			richtung: e.d > 0 ? 1 : -1,
			gut: e.dim === "konflikt" ? e.d < 0 : e.d > 0
		};
		case "kapital": return {
			text: `Politisches Kapital ${e.d > 0 ? "+" : "−"}${zahl(e.d)}`,
			richtung: e.d > 0 ? 1 : -1,
			gut: e.d > 0
		};
		case "schulden": return {
			text: `Schulden ${e.d > 0 ? "+" : "−"}${zahl(e.d)} Prozentpunkte des BIP`,
			richtung: e.d > 0 ? 1 : -1,
			gut: e.d < 0
		};
		case "risiko": return {
			text: `Risikoaufschlag ${e.d > 0 ? "+" : "−"}${zahl(e.d)} Punkte`,
			richtung: e.d > 0 ? 1 : -1,
			gut: e.d < 0
		};
		case "staette": return {
			text: `${ERBE_NACH_ID[e.id]?.name ?? e.id}: Zustand ${e.d > 0 ? "+" : "−"}${zahl(e.d)}`,
			richtung: e.d > 0 ? 1 : -1,
			gut: e.d > 0
		};
		case "serie": return {
			text: `${e.serie === "alle" ? "Alle Stätten des Landes" : "Alle Stätten der Route"}: Zustand ${e.d > 0 ? "+" : "−"}${zahl(e.d)}`,
			richtung: e.d > 0 ? 1 : -1,
			gut: e.d > 0
		};
		case "entferne": return {
			text: `${vorhabenDef(e.id)?.name ?? e.id} verlässt den Bestand`,
			richtung: -1,
			gut: true
		};
		case "bestand": return {
			text: `${vorhabenDef(e.id)?.name ?? e.id}: Zustand ${e.d > 0 ? "+" : "−"}${zahl(e.d)}`,
			richtung: e.d > 0 ? 1 : -1,
			gut: e.d > 0
		};
	}
}
function aktiveVorteile(w) {
	if (!w.spiel?.reich) return [];
	return VORTEILE.filter((d) => d.voraus.every((x) => pruefeVoraus(w, x).erfuellt)).map((d) => d.id);
}
function meldung(w, art, text) {
	const z = reichZustand(w);
	z.meldungen.push({
		tag: w.day,
		datum: w.date,
		art,
		text
	});
	if (z.meldungen.length > MELDUNGEN_MAX) z.meldungen.shift();
}
function schliesseAb(w, v) {
	const z = reichZustand(w);
	z.laufend = z.laufend.filter((l) => l.id !== v.id);
	if (v.klasse !== "restaurierung") z.bestand[v.id] = {
		seit: w.date,
		zustand: 90
	};
	for (const e of v.abschluss) wendeEffekt(w, e);
	if ((v.klasse === "wunder" || v.klasse === "grossprojekt" || v.klasse === "serie") && !z.feier.includes(v.id)) z.feier.push(v.id);
	const text = `Fertig: ${v.name}.`;
	meldung(w, "fertig", text);
	addLog(w, "entscheidung", text, v.kehrseite);
	w.spiel.chronik.push({
		tag: w.day,
		datum: w.date,
		titel: v.name,
		ausgang: `Fertiggestellt (${v.klasse === "wunder" ? "Wunder" : v.klasse === "serie" ? "Themenroute" : "Vorhaben"}).`
	});
}
/** Einmal im Monat: bauen, verfallen lassen, wirken lassen, Vorteile prüfen. */
function reichMonat(w, _rng) {
	const spiel = w.spiel;
	if (!spiel || spiel.ende) return;
	const z = reichZustand(w);
	const vb = verwaltungBilanz(w);
	z.verwaltung = clamp(z.verwaltung + vb.netto, 0, 100);
	const verzug = z.verwaltung <= 0 ? .5 : 1;
	if (verzug < 1 && z.laufend.length) {
		wirke(w, "legitimitaet", -.4);
		if (!z.meldungen.some((m) => m.art === "verzug" && w.day - m.tag < 60)) meldung(w, "verzug", "Die Verwaltungskraft ist aufgebraucht: Bauvorhaben kommen nur zur Hälfte voran, die Legitimität leidet.");
	}
	let cap = bauKapazitaet(w);
	let genutzt = 0;
	for (const l of [...z.laufend]) {
		if (l.pausiert) continue;
		const v = vorhabenDef(l.id);
		if (!v) continue;
		const rest = Math.max(0, v.kosten.bau - l.fortschritt);
		const monatsMax = v.kosten.bau / Math.max(1, v.kosten.monate);
		const aufnahme = Math.min(monatsMax, cap, rest) * verzug;
		l.fortschritt += aufnahme;
		cap -= aufnahme / verzug;
		genutzt += aufnahme;
		if (v.kosten.schulden && v.kosten.bau > 0) w.economy.debtRatio += v.kosten.schulden * aufnahme / v.kosten.bau;
		if (l.fortschritt >= v.kosten.bau - 1e-6) schliesseAb(w, v);
	}
	z.bauGenutzt = genutzt;
	const pflege = 1.25 - .6 * (level(w, "m_instandhaltung") / 100);
	for (const [id, b] of Object.entries(z.bestand)) {
		const v = vorhabenDef(id);
		if (!v) continue;
		const ref = v.start?.status === "fertig" ? v.start.zustand ?? 78 : 0;
		const skala = ref > 0 ? clamp((b.zustand - ref) / 30, -1, 1) : b.zustand < 30 ? .4 * (b.zustand / 30) : b.zustand / 100;
		if (v.dauer) for (const e of v.dauer) wendeEffekt(w, e, skala);
		const rate = v.bereich === "militaer" ? .1 : v.bereich === "infrastruktur" ? .09 : .06;
		b.zustand = Math.max(15, b.zustand - rate * pflege);
	}
	for (const [key, sitz] of Object.entries(z.sitze)) {
		const n = sitz.loyal + sitz.unabhaengig + sitz.reform;
		if (!n) continue;
		const anteil = (sitz.unabhaengig + sitz.reform) / n;
		wirke(w, "justiz_unabhaengigkeit", (anteil - (SITZE_START[key] ?? anteil)) * .9);
	}
	const schutz = 1.2 - .5 * (level(w, "m_denkmalschutz") / 100);
	const summe = /* @__PURE__ */ new Map();
	for (const e of ERBE) {
		const st = z.staetten[e.id];
		if (!st) continue;
		st.zustand = Math.max(5, st.zustand - .05 * schutz);
		const a = summe.get(e.plaka) ?? {
			s: 0,
			n: 0
		};
		a.s += st.zustand;
		a.n += 1;
		summe.set(e.plaka, a);
	}
	const i = NET.index.get("kulturerbe");
	if (i !== void 0) for (const [plaka, a] of summe) {
		const ziel = a.s / a.n;
		const jetzt = w.net.values[i * 81 + plaka - 1];
		wirke(w, "kulturerbe", (ziel - jetzt) * .25, [plaka]);
	}
	const aktiv = aktiveVorteile(w);
	for (const id of aktiv) {
		const d = vorteilDef(id);
		if (d?.dauer) for (const e of d.dauer) wendeEffekt(w, e);
	}
	for (const id of aktiv) if (!z.vorteile.includes(id)) {
		const d = vorteilDef(id);
		meldung(w, "freigeschaltet", `Vorteil erreicht: ${d?.name ?? id}.`);
		addLog(w, "entscheidung", `Vorteil erreicht: ${d?.name ?? id}.`, d?.text);
	}
	for (const id of z.vorteile) if (!aktiv.includes(id)) meldung(w, "gesperrt", `Vorteil verloren: ${vorteilDef(id)?.name ?? id}. Die Voraussetzungen gelten nicht mehr.`);
	z.vorteile = aktiv;
}
//#endregion
//#region game/src/sim/abkommen.ts
/** Wie stark die Dauerwirkungen eines Vertrags bei kurzer, mittlerer und langer Bindung ausfallen */
const LAUFZEIT_FAKTOR = {
	2: .8,
	5: 1,
	10: 1.25
};
const TAGE_JAHR = 360;
const BRUCH_STRAFE = 6;
function vertraegeVon(w, landId) {
	const z = weltZustand(w)[landId];
	return z.vertraege ??= [];
}
const laufende = (w, landId) => vertraegeVon(w, landId).filter((v) => v.status === "laeuft");
function alleLaufenden(w) {
	const out = [];
	for (const id of Object.keys(weltZustand(w))) out.push(...laufende(w, id));
	return out;
}
function klauselnFuer(w, landId) {
	const p = PROFILE[landId];
	if (!p) return [];
	const aktiv = new Set(laufende(w, landId).flatMap((v) => [...v.gibt, ...v.will]));
	const out = [];
	for (const [id, wert] of Object.entries(p.werte)) {
		const def = KLAUSEL_NACH_ID[id];
		if (!def) continue;
		const o = p.texte?.[id];
		const rot = p.rot.includes(id);
		let gesperrt;
		if (aktiv.has(id)) gesperrt = "Dazu läuft schon ein Vertrag.";
		else if (def.mindestens && dimensionZu(w, landId, def.mindestens.dim) < def.mindestens.wert) gesperrt = def.mindestens.text;
		out.push({
			def,
			label: o?.label ?? def.label,
			text: o?.text ?? def.text,
			wert,
			rot,
			...rot && p.rotText?.[id] ? { rotText: p.rotText[id] } : {},
			...gesperrt ? { gesperrt } : {}
		});
	}
	return out;
}
const klauselSicht = (w, landId, id) => klauselnFuer(w, landId).find((k) => k.def.id === id);
/** Was eine Klausel im eigenen Land bewirkt, in Zeilen für Karte und Vorschau (grün gut, rot schlecht). */
function heimWirkung(def) {
	return {
		sofort: (def.abschluss ?? []).map((e) => effektZeile(e, "sofort")).filter((z) => !!z),
		dauer: (def.dauer ?? []).map((e) => effektZeile(e, "dauer")).filter((z) => !!z)
	};
}
const STIMMUNG_WORT = [
	"Ablehnend",
	"Skeptisch",
	"Zögernd",
	"Geneigt",
	"Einverstanden"
];
/** Kapital für einen Vertrag: ein Sockel für die Verhandlung, dazu der politische Preis der Klauseln im eigenen Land. */
function pkFuer(a) {
	const n = a.gibt.length + a.will.length;
	const klauseln = [...a.gibt, ...a.will].reduce((s, id) => s + (KLAUSEL_NACH_ID[id]?.pk ?? 0), 0);
	return n === 0 ? 0 : 2 + Math.ceil(n / 2) + klauseln;
}
function grenzeFuer(jahre) {
	return 4 + (jahre - 2) * .35;
}
function beitraege(w, a) {
	const p = PROFILE[a.land];
	const gruende = [];
	if (!p) return {
		punkte: -99,
		gruende
	};
	const l = land(a.land);
	const z = weltZustand(w)[a.land];
	let punkte = 0;
	let veto;
	for (const id of [...a.gibt, ...a.will]) {
		const k = klauselSicht(w, a.land, id);
		if (!k) {
			gruende.push({
				text: `${l.name} verhandelt darüber nicht.`,
				wert: -20,
				art: "minus"
			});
			punkte -= 20;
			continue;
		}
		if (k.rot) veto = k.rotText ?? `${l.name} nimmt „${k.label}“ nicht an.`;
		const gibt = k.def.seite === "gibt";
		if (k.wert >= 0) gruende.push({
			text: gibt ? `„${k.label}“: ${l.name} will das.` : `„${k.label}“ kostet ${l.name} nichts.`,
			wert: k.wert,
			art: "plus"
		});
		else if (!k.rot) gruende.push({
			text: `„${k.label}“ kostet ${l.name} etwas.`,
			wert: k.wert,
			art: "minus"
		});
		else gruende.push({
			text: `„${k.label}“ ist eine Rote Linie.`,
			wert: 0,
			art: "minus"
		});
		if (!k.rot) punkte += k.wert;
	}
	const v = vertrauenZu(w, a.land);
	const basis = (v - 45) / 5;
	gruende.push({
		text: basis >= 0 ? `Vertrauen zur Türkei trägt (${Math.round(v)}).` : `Das Vertrauen ist gering (${Math.round(v)}).`,
		wert: basis,
		art: basis >= 0 ? "plus" : "minus"
	});
	const konf = -(z.konflikt - 40) / 8;
	if (Math.abs(konf) >= 1) gruende.push({
		text: konf < 0 ? "Offener Streit belastet die Gespräche." : "Es gibt kaum offenen Streit.",
		wert: konf,
		art: konf < 0 ? "minus" : "plus"
	});
	if (p.hebel !== 0) gruende.push({
		text: p.hebelText,
		wert: p.hebel,
		art: p.hebel > 0 ? "plus" : "minus"
	});
	const bruch = -(z.bruch ?? 0);
	if (bruch < -.3) gruende.push({
		text: `Die Erinnerung an einen gebrochenen Vertrag wirkt nach.`,
		wert: bruch,
		art: "minus"
	});
	const gehalten = Math.min(3, (z.gehalten ?? 0) * 1.5);
	if (gehalten > 0) gruende.push({
		text: "Frühere Verträge hat die Türkei gehalten.",
		wert: gehalten,
		art: "plus"
	});
	const gegenseitig = a.gibt.length > 0 && a.will.length > 0 ? 2 : 0;
	if (gegenseitig) gruende.push({
		text: "Ein ausgewogenes Paket: Geben und Nehmen.",
		wert: gegenseitig,
		art: "plus"
	});
	else if (a.will.length > 0 && a.gibt.length === 0) gruende.push({
		text: "Sie verlangen nur, ohne etwas zu bieten.",
		wert: 0,
		art: "info"
	});
	punkte += basis + konf + p.hebel + bruch + gehalten + gegenseitig;
	return {
		punkte,
		gruende,
		...veto ? { veto } : {}
	};
}
function stimmungFuer(d) {
	return d >= 0 ? 4 : d >= -3 ? 3 : d >= -7 ? 2 : d >= -12 ? 1 : 0;
}
/** Kosten einer Klausel für den Spieler, für die Reihenfolge der Gegenangebote: politischer Preis und schädliche Wirkungen. */
function eigenerPreis(def) {
	const schlecht = [...def.abschluss ?? [], ...def.dauer ?? []].map((e) => effektZeile(e, "dauer")).filter((z) => z && !z.gut).length;
	return (def.pk ?? 0) + schlecht * .6;
}
function gegenangebote(w, a) {
	const l = land(a.land);
	const kandidaten = [];
	const mitGrenze = (b) => beitraege(w, b).punkte - grenzeFuer(b.jahre);
	for (const j of VERTRAGSLAUFZEITEN) {
		if (j >= a.jahre) continue;
		const b = {
			...a,
			jahre: j
		};
		if (mitGrenze(b) >= 0) kandidaten.push({
			angebot: b,
			preis: .5,
			text: `${l.name} stimmt zu, wenn die Laufzeit auf ${j} Jahre verkürzt wird.`,
			punkte: mitGrenze(b)
		});
	}
	for (const k of klauselnFuer(w, a.land)) {
		if (k.def.seite !== "gibt" || k.gesperrt || k.rot || a.gibt.includes(k.def.id) || k.wert <= 0) continue;
		const b = {
			...a,
			gibt: [...a.gibt, k.def.id]
		};
		if (mitGrenze(b) >= 0) kandidaten.push({
			angebot: b,
			preis: 1 + eigenerPreis(k.def),
			text: `${l.name} stimmt zu, wenn Sie zusätzlich „${k.label}“ anbieten.`,
			punkte: mitGrenze(b)
		});
	}
	for (const id of a.will) {
		const k = klauselSicht(w, a.land, id);
		if (!k) continue;
		const b = {
			...a,
			will: a.will.filter((x) => x !== id)
		};
		if ((b.gibt.length || b.will.length) && mitGrenze(b) >= 0) kandidaten.push({
			angebot: b,
			preis: 2 + Math.abs(k.wert) * .3,
			text: `${l.name} stimmt zu, wenn Sie auf „${k.label}“ verzichten.`,
			punkte: mitGrenze(b)
		});
	}
	kandidaten.sort((x, y) => x.preis - y.preis || x.punkte - y.punkte);
	const out = kandidaten.slice(0, 3).map((k) => ({
		text: k.text,
		angebot: k.angebot
	}));
	if (out.length) return out;
	const forderungen = a.will.map((id) => ({
		id,
		k: klauselSicht(w, a.land, id)
	})).filter((x) => x.k && !x.k.rot).sort((x, y) => x.k.wert - y.k.wert);
	const angebote = klauselnFuer(w, a.land).filter((k) => k.def.seite === "gibt" && !k.gesperrt && !k.rot && k.wert > 0 && !a.gibt.includes(k.def.id)).sort((x, y) => y.wert - x.wert);
	if (forderungen[0] && angebote[0]) {
		const b = {
			...a,
			will: a.will.filter((x) => x !== forderungen[0].id),
			gibt: [...a.gibt, angebote[0].def.id]
		};
		if (mitGrenze(b) >= 0) return [{
			text: `${l.name} stimmt zu, wenn Sie auf „${forderungen[0].k.label}“ verzichten und „${angebote[0].label}“ anbieten.`,
			angebot: b
		}];
	}
	return [];
}
function bewerte(w, a) {
	const grenze = grenzeFuer(a.jahre);
	const pk = pkFuer(a);
	if (a.gibt.length + a.will.length === 0) return {
		urteil: "leer",
		punkte: 0,
		grenze,
		stimmung: 0,
		gruende: [],
		gegenangebote: [],
		pk
	};
	const { punkte, gruende, veto } = beitraege(w, a);
	gruende.sort((x, y) => Math.abs(y.wert) - Math.abs(x.wert));
	if (veto) return {
		urteil: "veto",
		punkte,
		grenze,
		stimmung: 0,
		gruende,
		veto,
		gegenangebote: [],
		pk
	};
	const d = punkte - grenze;
	if (d >= 0) return {
		urteil: "zustimmung",
		punkte,
		grenze,
		stimmung: stimmungFuer(d),
		gruende,
		gegenangebote: [],
		pk
	};
	const gegen = d >= -6 ? gegenangebote(w, a) : [];
	return {
		urteil: gegen.length ? "gegenangebot" : "ablehnung",
		punkte,
		grenze,
		stimmung: stimmungFuer(d),
		gruende,
		gegenangebote: gegen,
		pk
	};
}
const nameKlauseln = (w, landId, ids) => ids.map((id) => klauselSicht(w, landId, id)?.label ?? id).join(", ");
function vertragsName(w, v) {
	const alle = [...v.gibt, ...v.will];
	const erste = klauselSicht(w, v.land, alle[0] ?? "")?.label ?? alle[0] ?? "Vertrag";
	return alle.length > 1 ? `${erste} und ${alle.length - 1} weitere Klausel${alle.length > 2 ? "n" : ""}` : erste;
}
/** Sperrfrist nach einer Zurückweisung, in Tagen; 0, wenn das Land verhandelt. */
function sperreRest(w, landId) {
	return Math.max(0, (weltZustand(w)[landId]?.sperreBis ?? 0) - w.day);
}
/** Legt einen Vertrag an und wendet Abschlusswirkungen an; das Kapital wird vom Aufrufer abgezogen. */
function schliesse(w, a) {
	const l = land(a.land);
	const z = weltZustand(w)[a.land];
	const v = {
		id: `v-${a.land}-${w.day}-${(z.vertraege ??= []).length}`,
		land: a.land,
		gibt: [...a.gibt],
		will: [...a.will],
		jahre: a.jahre,
		seit: w.day,
		ablauf: w.day + a.jahre * TAGE_JAHR,
		status: "laeuft",
		verstoesse: 0,
		letztePruefung: w.day
	};
	z.vertraege.push(v);
	landAendern(w, a.land, {
		vertrauen: 3,
		konflikt: -3
	}, `Vertrag über ${nameKlauseln(w, a.land, [...a.gibt, ...a.will])}`);
	for (const id of [...a.gibt, ...a.will]) {
		const def = KLAUSEL_NACH_ID[id];
		if (!def) continue;
		for (const e of def.abschluss ?? []) wendeEffekt(w, e);
		if (def.land) landAendern(w, a.land, def.land);
		for (const x of AUSSTRAHLUNG[`${id}@${a.land}`] ?? []) landAendern(w, x.land, { [x.dim]: x.d }, x.text);
	}
	z.abkommen.push(`Vertrag ${w.date.slice(0, 4)}: ${nameKlauseln(w, a.land, [...a.gibt, ...a.will])} (${a.jahre} Jahre)`);
	addLog(w, "entscheidung", `Vertrag mit ${l.dat}: ${nameKlauseln(w, a.land, [...a.gibt, ...a.will])}`, `Laufzeit ${a.jahre} Jahre. Er wirkt jeden Monat, wird jedes Jahr geprüft und bindet beide Seiten.`);
	return v;
}
/** Ob das Angebot formal in Ordnung ist: ein Satz mit dem Mangel, sonst `null`. */
function pruefeAngebot(w, a) {
	if (!PROFILE[a.land]) return "Mit diesem Land gibt es keine Verhandlungen.";
	if (!VERTRAGSLAUFZEITEN.includes(a.jahre)) return "Diese Laufzeit gibt es nicht.";
	const ids = [...a.gibt, ...a.will];
	if (ids.length === 0) return "Ein Vertrag braucht mindestens eine Klausel.";
	if (new Set(ids).size !== ids.length) return "Eine Klausel kann nur einmal im Vertrag stehen.";
	for (const id of ids) if (!KLAUSEL_NACH_ID[id]) return `Die Klausel „${id}“ gibt es nicht.`;
	for (const id of a.gibt) if (KLAUSEL_NACH_ID[id]?.seite !== "gibt") return "Unter „Wir bieten“ steht etwas, das wir verlangen.";
	for (const id of a.will) if (KLAUSEL_NACH_ID[id]?.seite !== "will") return "Unter „Wir verlangen“ steht etwas, das wir bieten.";
	for (const id of ids) {
		const k = klauselSicht(w, a.land, id);
		if (!k) return `${land(a.land).name} verhandelt nicht über „${KLAUSEL_NACH_ID[id]?.label ?? id}“.`;
		if (k.gesperrt) return `„${k.label}“: ${k.gesperrt}`;
	}
	return null;
}
/** Ob der Partner seine Seite hält: Er tut es, solange Vertrauen und Ruhe da sind. */
function partnerVerlaesslich(w, landId) {
	return vertrauenZu(w, landId) >= 25 && weltZustand(w)[landId].konflikt < 85;
}
function beende$1(w, v, status, text) {
	v.status = status;
	v.ende = text;
}
function pruefeJahr(w, v) {
	const l = land(v.land);
	const z = weltZustand(w)[v.land];
	v.letztePruefung = w.day;
	const verfehlt = [];
	for (const id of [...v.gibt, ...v.will]) {
		const def = KLAUSEL_NACH_ID[id];
		if (!def?.pflicht) continue;
		if (!pruefeBedingung(w, def.pflicht).erfuellt) verfehlt.push(def.pflichtText ?? def.label);
	}
	if (verfehlt.length === 0) {
		landAendern(w, v.land, { vertrauen: 2 }, "Jahresprüfung des Vertrags bestanden");
		addLog(w, "entscheidung", `Vertrag mit ${l.dat}: Die Jahresprüfung ist bestanden.`, "Die Türkei hat alle Pflichten erfüllt: Das Vertrauen wächst.");
		return;
	}
	v.verstoesse += 1;
	landAendern(w, v.land, {
		vertrauen: -6,
		konflikt: 3
	}, `Verstoß gegen den Vertrag: ${verfehlt.join("; ")}`);
	if (v.verstoesse >= 2) {
		beende$1(w, v, "gebrochen", `Zwei Jahre in Folge verfehlt: ${verfehlt.join("; ")}`);
		landAendern(w, v.land, {
			vertrauen: -12,
			konflikt: 6
		}, "Der Vertrag ist gebrochen");
		wirke(w, "ansehen", -2);
		z.bruch = (z.bruch ?? 0) + BRUCH_STRAFE;
		addLog(w, "entscheidung", `Der Vertrag mit ${l.dat} ist gebrochen.`, `Verfehlt: ${verfehlt.join("; ")}. Das Vertrauen bricht ein, und ${l.name} wird künftig härter verhandeln.`);
	} else addLog(w, "entscheidung", `Vertrag mit ${l.dat}: ein Verstoß.`, `Verfehlt: ${verfehlt.join("; ")}. Beim zweiten Mal gilt der Vertrag als gebrochen.`);
}
/** Einmal im Monat: Dauerwirkungen, Jahresprüfung, Ablauf; die Erinnerung an Brüche klingt ab. */
function abkommenMonat(w, _rng) {
	if (!w.spiel?.welt) return;
	for (const id of Object.keys(w.spiel.welt)) {
		const z = w.spiel.welt[id];
		if (z.bruch) z.bruch = Math.max(0, z.bruch - .15);
		for (const v of z.vertraege ?? []) {
			if (v.status !== "laeuft") continue;
			const f = LAUFZEIT_FAKTOR[v.jahre];
			const verlaesslich = partnerVerlaesslich(w, id);
			for (const cid of [...v.gibt, ...v.will]) {
				const def = KLAUSEL_NACH_ID[cid];
				if (!def) continue;
				const g = def.seite === "will" && !verlaesslich ? .4 : 1;
				for (const e of def.dauer ?? []) wendeEffekt(w, e, f * g);
			}
			if (w.day >= v.ablauf) {
				z.gehalten = (z.gehalten ?? 0) + (v.verstoesse === 0 ? 1 : 0);
				beende$1(w, v, "ausgelaufen", "Die Laufzeit ist zu Ende.");
				landAendern(w, id, { vertrauen: v.verstoesse === 0 ? 2 : 0 });
				addLog(w, "entscheidung", `Vertrag mit ${land(id).dat} ausgelaufen.`, v.verstoesse === 0 ? "Er wurde gehalten; für einen neuen Vertrag zählt das." : "Es gab Verstöße; dafür wird das Land in Erinnerung behalten.");
				continue;
			}
			if (w.day - v.letztePruefung >= TAGE_JAHR) pruefeJahr(w, v);
		}
	}
}
/** Ein laufender Vertrag ohne Verstoß lässt sich vor dem Ablauf um weitere Jahre verlängern; der Partner muss ihm noch trauen. */
const VERLAENGERUNG_PK = {
	2: 1,
	5: 3,
	10: 6
};
function verlaengere(w, landId, vertragId, jahre, bezahlen = true) {
	const spiel = w.spiel;
	const v = vertraegeVon(w, landId).find((x) => x.id === vertragId);
	if (!spiel || !v || v.status !== "laeuft") return {
		ok: false,
		text: "Diesen Vertrag gibt es nicht mehr."
	};
	const l = land(landId);
	if (v.verstoesse > 0) return {
		ok: false,
		text: `${l.name} verlängert keinen Vertrag mit Verstößen.`
	};
	if (!partnerVerlaesslich(w, landId) || vertrauenZu(w, landId) < 35) return {
		ok: false,
		text: `${l.name} vertraut der Türkei nicht genug für eine Verlängerung.`
	};
	const pk = VERLAENGERUNG_PK[jahre];
	if (bezahlen) {
		if (!kannZahlen(spiel.kapital, pk)) return {
			ok: false,
			text: "Dafür fehlt das Kapital."
		};
		spiel.kapital -= pk;
	}
	v.ablauf += jahre * TAGE_JAHR;
	v.jahre = v.jahre >= jahre ? v.jahre : jahre;
	landAendern(w, landId, { vertrauen: 3 }, "Vertrag verlängert");
	addLog(w, "entscheidung", `Vertrag mit ${l.dat} um ${jahre} Jahre verlängert.`, `Das Vertrauen wächst.`);
	return {
		ok: true,
		text: `Der Vertrag mit ${l.dat} läuft ${jahre} Jahre länger.`,
		why: bezahlen ? `Kostet ${pk} Kapital.` : "Das Vertrauen wächst."
	};
}
/**
* Ein Paket, das der Partner von sich aus vorschlagen würde: das Angebot, das ihm am meisten wert ist, gegen die Forderung, die ihn am
* wenigsten kostet. `null`, wenn er dem Paket selbst nicht zustimmen würde.
*/
function vorschlagVomPartner(w, landId) {
	const ks = klauselnFuer(w, landId).filter((k) => !k.gesperrt && !k.rot);
	const gibt = ks.filter((k) => k.def.seite === "gibt" && k.wert > 0).sort((a, b) => b.wert - a.wert)[0];
	const will = ks.filter((k) => k.def.seite === "will").sort((a, b) => b.wert - a.wert)[0];
	if (!gibt && !will) return null;
	const a = {
		land: landId,
		gibt: gibt ? [gibt.def.id] : [],
		will: will ? [will.def.id] : [],
		jahre: 5
	};
	return bewerte(w, a).urteil === "zustimmung" ? a : null;
}
const VERMITTLUNGEN = [{
	id: "ukr_rus",
	titel: "Ukraine und Russland",
	a: "UKR",
	b: "RUS",
	pk: 5,
	abkuehlung: 240,
	minA: 45,
	minB: 35,
	text: "Ankara richtet in Istanbul Gespräche aus: Meerengenregeln, Getreidekorridor und der Austausch von Gefangenen.",
	paket: [
		"Gefangenenaustausch in Istanbul",
		"Meerengenregeln nach Montreux",
		"Getreide- und Handelskorridor im Schwarzen Meer"
	]
}, {
	id: "arm_aze",
	titel: "Armenien und Aserbaidschan",
	a: "ARM",
	b: "AZE",
	pk: 5,
	abkuehlung: 240,
	minA: 35,
	minB: 45,
	text: "Transit gegen Grenzöffnung: Eine Verbindung nach Nachitschewan über armenisches Gebiet, dafür Schritte zur Öffnung der Grenze.",
	paket: [
		"Transit über armenisches Gebiet (TRIPP)",
		"Grenzöffnung für Drittstaatler und Diplomaten",
		"Bahn zwischen Gjumri und Kars"
	]
}];
function aussichtFuer(w, d) {
	const ansehen = nationalAverage(NET, w.net, "ansehen");
	const va = vertrauenZu(w, d.a);
	const vb = vertrauenZu(w, d.b);
	const konflikt = Math.max(weltZustand(w)[d.a].konflikt, weltZustand(w)[d.b].konflikt);
	const roh = 20 + (Math.min(va, vb) - 35) * 1.2 - Math.max(0, konflikt - 60) * .6 + (ansehen - 45) * .6;
	return Math.round(clamp(roh, 8, 85));
}
function vermittlungen(w) {
	const spiel = w.spiel;
	return VERMITTLUNGEN.map((d) => {
		let grund;
		const zuletzt = spiel?.vermittelt?.[d.id] ?? -1e9;
		if (spiel && !kannZahlen(spiel.kapital, d.pk)) grund = "Dafür fehlt das Kapital.";
		else if (w.day - zuletzt < d.abkuehlung) grund = `Wieder möglich in ${d.abkuehlung - (w.day - zuletzt)} Tagen.`;
		else if (vertrauenZu(w, d.a) < d.minA) grund = `${land(d.a).name} vertraut Ankara als Vermittler noch nicht genug.`;
		else if (vertrauenZu(w, d.b) < d.minB) grund = `${land(d.b).name} vertraut Ankara als Vermittler noch nicht genug.`;
		return {
			def: d,
			moeglich: !grund,
			...grund ? { grund } : {},
			aussicht: aussichtFuer(w, d)
		};
	});
}
//#endregion
//#region game/src/sim/wege.ts
/**
* Maßnahmen, die eine Größe in die gewünschte Richtung bewegen (`gewuenscht` +1 erhöhen, −1 senken),
* nach Stärke sortiert. Ist die Größe selbst eine Maßnahme, gibt es keine Hebel.
*/
function hebel(zielId, gewuenscht, n = 4) {
	const summe = /* @__PURE__ */ new Map();
	for (const e1 of NET.edges) {
		const von = NET.nodes[NET.index.get(e1.from)];
		if (von.kind !== "massnahme") continue;
		if (e1.to === zielId) summe.set(von.id, (summe.get(von.id) ?? 0) + e1.weight);
		else for (const e2 of NET.edges) if (e2.from === e1.to && e2.to === zielId) summe.set(von.id, (summe.get(von.id) ?? 0) + e1.weight * e2.weight * .5);
	}
	return [...summe.entries()].map(([id, s]) => ({
		node: NET.nodes[NET.index.get(id)],
		staerke: Math.abs(s),
		richtung: s * gewuenscht > 0 ? 1 : -1
	})).filter((h) => h.staerke > 5e-4).sort((a, b) => b.staerke - a.staerke).slice(0, n);
}
//#endregion
//#region game/src/sim/gruppen.ts
const GRUPPEN = [
	{
		id: "arbeitnehmer",
		gewicht: 1.4
	},
	{
		id: "rentner",
		gewicht: 1.3
	},
	{
		id: "junge",
		gewicht: 1.1
	},
	{
		id: "konservative",
		gewicht: 1.1
	},
	{
		id: "staedtische_saekulare",
		gewicht: 1
	},
	{
		id: "landwirte",
		gewicht: .8
	},
	{
		id: "beamte",
		gewicht: .6
	},
	{
		id: "unternehmer",
		gewicht: .5
	},
	{
		id: "arme",
		gewicht: 1
	},
	{
		id: "nationalisten",
		gewicht: .8
	},
	{
		id: "minderheiten",
		gewicht: .7
	}
];
const GRUPPEN_SUMME = GRUPPEN.reduce((s, g) => s + g.gewicht, 0);
//#endregion
//#region game/src/sim/aussenwelt.ts
const AUSSENWELT = {
	/** Rückkehr zum Mittel pro Monat */
	rueckkehr: .08,
	/** Monatliche Schwankung (Standardabweichung, Indexpunkte) */
	rauschen: {
		oel: 3.5,
		eu: 1.2,
		weltzins: 1
	},
	/** Wahrscheinlichkeit eines Schocks pro Monat */
	schockChance: {
		oel: .035,
		eu: .02,
		weltzins: .015
	}
};
function aussenweltStart(world) {
	const e = world.economy;
	e.oel ??= 100;
	e.euNachfrage ??= 100;
	e.weltzins ??= 100;
}
/** Ein Monat Außenwelt. Meldet Schocks im Protokoll (Art „markt“), damit die Oberfläche sie anzeigen kann. */
function aussenweltMonat(world, rng) {
	const e = world.economy;
	aussenweltStart(world);
	const schritt = (wert, sd) => wert + AUSSENWELT.rueckkehr * (100 - wert) + rng.normal(sd);
	e.oel = Math.max(40, schritt(e.oel, AUSSENWELT.rauschen.oel));
	e.euNachfrage = Math.max(60, schritt(e.euNachfrage, AUSSENWELT.rauschen.eu));
	e.weltzins = Math.max(60, schritt(e.weltzins, AUSSENWELT.rauschen.weltzins));
	if (rng.next() < AUSSENWELT.schockChance.oel) {
		const richtung = rng.next() < .7 ? 1 : -1;
		const staerke = rng.between(18, 38);
		e.oel = Math.max(40, e.oel + richtung * staerke);
		addLog(world, "markt", richtung > 0 ? "Der Energiepreis springt am Weltmarkt nach oben." : "Der Energiepreis fällt am Weltmarkt deutlich.", richtung > 0 ? "Die Türkei importiert den größten Teil ihrer Energie: Das treibt Inflation und Lira unter Druck." : "Billigere Energie entlastet Preise und Handelsbilanz.");
	}
	if (rng.next() < AUSSENWELT.schockChance.eu) {
		const staerke = rng.between(8, 16);
		e.euNachfrage = Math.max(60, e.euNachfrage - staerke);
		addLog(world, "markt", "Die Nachfrage aus der EU bricht ein.", "Die EU ist der wichtigste Handelspartner: Exporte und Beschäftigung in den Industrieprovinzen leiden.");
	}
	if (rng.next() < AUSSENWELT.schockChance.weltzins) {
		const staerke = rng.between(6, 14);
		e.weltzins = e.weltzins + staerke;
		addLog(world, "markt", "Die großen Zentralbanken heben die Zinsen an.", "Anleger ziehen Geld aus Schwellenländern ab: Risikoaufschlag und Lira geraten unter Druck.");
	}
}
//#endregion
//#region game/src/sim/rng.ts
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
function seedToState(seed) {
	return seed | 0;
}
//#endregion
//#region game/src/sim/personen.ts
const nf$3 = (x, d = 1) => x.toLocaleString("de-DE", {
	minimumFractionDigits: d,
	maximumFractionDigits: d
});
const AEMTER = {
	finanzen: {
		amt: "finanzen",
		ressort: "Finanzen",
		fach: [
			"steuereinnahmen",
			"vertrauen_maerkte",
			"zinslast",
			"steuermoral"
		],
		massnahmen: [
			"m_einkommensteuer",
			"m_mwst",
			"m_steuerfahndung",
			"m_verwaltungsdigital",
			"m_steueramnestie",
			"m_privatisierung"
		],
		wirkung: [
			{
				id: "steuermoral",
				d: .12
			},
			{
				id: "steuereinnahmen",
				d: .1
			},
			{
				id: "vertrauen_maerkte",
				d: .1
			}
		],
		stile: [
			"nuechtern",
			"vorsichtig",
			"streng"
		],
		faehigkeit: [58, 82],
		ehrgeiz: [30, 62],
		lager: "markt",
		regierungsamt: true,
		entlassbar: true
	},
	inneres: {
		amt: "inneres",
		ressort: "Inneres",
		fach: ["kriminalitaet", "terrorgefahr"],
		massnahmen: [
			"m_polizei",
			"m_polizeitechnik",
			"m_grenzschutz",
			"m_versammlungsfreiheit"
		],
		wirkung: [{
			id: "kriminalitaet",
			d: -.12
		}, {
			id: "terrorgefahr",
			d: -.1
		}],
		stile: [
			"streng",
			"machtbewusst",
			"loyal"
		],
		faehigkeit: [52, 78],
		ehrgeiz: [45, 78],
		lager: "apparat",
		regierungsamt: true,
		entlassbar: true
	},
	aussen: {
		amt: "aussen",
		ressort: "Äußeres",
		fach: [
			"ansehen",
			"beziehungen_eu",
			"beziehungen_usa",
			"beziehungen_russland",
			"beziehungen_nahost"
		],
		massnahmen: [
			"m_eu_annaeherung",
			"m_integration",
			"m_handelssysteme",
			"m_grenzschutz"
		],
		wirkung: [{
			id: "ansehen",
			d: .1
		}],
		stile: [
			"vorsichtig",
			"eitel",
			"nuechtern"
		],
		faehigkeit: [55, 80],
		ehrgeiz: [35, 68],
		lager: "diplomatie",
		regierungsamt: true,
		entlassbar: true
	},
	zentralbank: {
		amt: "zentralbank",
		ressort: "Zentralbank",
		fach: ["vertrauen_maerkte", "lebenshaltung"],
		massnahmen: ["m_bankenaufsicht"],
		wirkung: [],
		stile: [
			"vorsichtig",
			"streng",
			"nuechtern"
		],
		faehigkeit: [60, 84],
		ehrgeiz: [15, 40],
		lager: "markt",
		regierungsamt: false,
		entlassbar: false
	},
	stab: {
		amt: "stab",
		ressort: "Präsidialamt",
		fach: [
			"vertrauen_regierung",
			"legitimitaet",
			"polarisierung"
		],
		massnahmen: ["m_digitale_oeffentlichkeit", "m_staatsmedien"],
		wirkung: [{
			id: "vertrauen_regierung",
			d: .06
		}],
		stile: [
			"loyal",
			"nuechtern",
			"machtbewusst"
		],
		faehigkeit: [55, 80],
		ehrgeiz: [35, 60],
		lager: "praesident",
		regierungsamt: true,
		entlassbar: true
	},
	justiz: {
		amt: "justiz",
		ressort: "Justiz",
		fach: [
			"justiz_unabhaengigkeit",
			"justiz_effizienz",
			"haftueberfuellung",
			"urteilsbefolgung"
		],
		massnahmen: [
			"m_justizreform",
			"m_richterstellen",
			"m_haftvermeidung",
			"m_urteilsumsetzung",
			"m_antikorruption"
		],
		wirkung: [{
			id: "justiz_effizienz",
			d: .1
		}, {
			id: "justizvertrauen",
			d: .06
		}],
		stile: [
			"nuechtern",
			"streng",
			"vorsichtig"
		],
		faehigkeit: [55, 80],
		ehrgeiz: [25, 60],
		lager: "justiz",
		regierungsamt: true,
		entlassbar: true
	},
	generalstab: {
		amt: "generalstab",
		ressort: "Streitkräfte",
		fach: [
			"bereitschaft_heer",
			"bereitschaft_luft",
			"bereitschaft_see",
			"truppenmoral",
			"offiziersvertrauen"
		],
		massnahmen: [
			"m_verteidigung",
			"m_uebungen",
			"m_ruestungsindustrie",
			"m_offiziersauswahl",
			"m_wehrdienst"
		],
		wirkung: [{
			id: "truppenmoral",
			d: .1
		}, {
			id: "bereitschaft_heer",
			d: .06
		}],
		stile: [
			"streng",
			"machtbewusst",
			"vorsichtig"
		],
		faehigkeit: [58, 82],
		ehrgeiz: [30, 70],
		lager: "streitkraefte",
		regierungsamt: true,
		entlassbar: true
	},
	wirtschaft: {
		amt: "wirtschaft",
		ressort: "Wirtschaft",
		fach: [
			"investitionen",
			"industrie",
			"export",
			"auslandskapital"
		],
		massnahmen: [
			"m_investitionsanreize",
			"m_exportfoerderung",
			"m_kmu",
			"m_industrie_modernisierung",
			"m_kreditgarantien"
		],
		wirkung: [{
			id: "investitionen",
			d: .08
		}, {
			id: "industrie",
			d: .06
		}],
		stile: [
			"eitel",
			"nuechtern",
			"machtbewusst"
		],
		faehigkeit: [52, 78],
		ehrgeiz: [40, 72],
		lager: "markt",
		regierungsamt: true,
		entlassbar: true
	},
	partner: {
		amt: "partner",
		ressort: "Bündnispartei",
		fach: ["vertrauen_regierung"],
		massnahmen: [],
		wirkung: [],
		stile: [
			"machtbewusst",
			"nuechtern",
			"eitel"
		],
		faehigkeit: [50, 70],
		ehrgeiz: [55, 85],
		lager: "partei",
		regierungsamt: false,
		entlassbar: false
	},
	opposition: {
		amt: "opposition",
		ressort: "Opposition",
		fach: ["polarisierung"],
		massnahmen: [],
		wirkung: [],
		stile: ["machtbewusst", "eitel"],
		faehigkeit: [50, 72],
		ehrgeiz: [70, 95],
		lager: "opposition",
		regierungsamt: false,
		entlassbar: false
	}
};
/** Ein deterministischer Zufall aus Text: verbraucht keinen Zufallsstrom des Spiels. */
function hashZahl(s) {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
	h ^= h >>> 13;
	h = Math.imul(h, 1540483477);
	h ^= h >>> 15;
	return (h >>> 0) / 4294967296;
}
const zwischen = (a, b, u) => Math.round(a + (b - a) * u);
/** Das Profil einer Figur; wird angelegt, wenn es fehlt (ältere Spielstände, neue Nachfolger). */
function eigenVon(w, f) {
	if (f.eigen) return f.eigen;
	const d = AEMTER[f.amt];
	const s = `${w.seed}|${f.id}|${f.name}`;
	const eigen = {
		stil: d.stile[Math.floor(hashZahl(s + "|stil") * d.stile.length)],
		faehigkeit: zwischen(d.faehigkeit[0], d.faehigkeit[1], hashZahl(s + "|fae")),
		ehrgeiz: zwischen(d.ehrgeiz[0], d.ehrgeiz[1], hashZahl(s + "|ehr")),
		groll: 0,
		lager: d.lager,
		seit: w.day,
		erinnerung: []
	};
	f.eigen = eigen;
	return eigen;
}
function figurNachId(w, id) {
	return w.spiel?.figuren.find((f) => f.id === id);
}
function merke(w, f, text) {
	const e = eigenVon(w, f);
	e.erinnerung.push({
		tag: w.day,
		text
	});
	if (e.erinnerung.length > 10) e.erinnerung.shift();
}
const erinnerungen = (f) => [...f.eigen?.erinnerung ?? []].reverse();
const klemme = (x, a = 0, b = 100) => Math.min(b, Math.max(a, x));
function loyalitaetVerschieben(f, delta) {
	f.loyalitaet = klemme(f.loyalitaet + delta);
}
function grollVerschieben(w, f, delta) {
	const e = eigenVon(w, f);
	e.groll = klemme(e.groll + delta);
}
/** Wie gut das Ressort läuft: 0 bis 1,3. Fähigkeit und Loyalität zählen, Zusatzmittel und Druck erhöhen. */
function leistung(w, f) {
	const e = eigenVon(w, f);
	const basis = (.6 * e.faehigkeit + .4 * f.loyalitaet) / 100;
	const mittel = e.mittelBis !== void 0 && e.mittelBis > w.day ? 1.25 : 1;
	const druck = e.druckBis !== void 0 && e.druckBis > w.day ? 1.15 : 1;
	const neu = (e.einarbeitungBis !== void 0 && e.einarbeitungBis > w.day ? .75 : 1) * (e.kommissarisch ? .8 : 1);
	return klemme(basis * mittel * druck * neu, 0, 1.3);
}
function leistungWort(q) {
	if (q >= .85) return "hervorragend";
	if (q >= .7) return "gut";
	if (q >= .55) return "solide";
	if (q >= .4) return "schwach";
	return "lähmend";
}
function grollWort(g) {
	if (g >= 70) return "gekränkt";
	if (g >= 40) return "verärgert";
	if (g >= 15) return "gereizt";
	return "gelassen";
}
function wertVon(w, id) {
	return NET.index.has(id) ? nationalAverage(NET, w.net, id) : NaN;
}
/** Was eine Person gerade umtreibt, aus dem Weltzustand gerechnet (mit Zahlen). */
function sorgeText(w, f) {
	const e = w.economy;
	const sp = w.spiel;
	switch (f.amt) {
		case "finanzen":
			if (e.riskPremium > 450) return `Der Risikoaufschlag liegt bei ${Math.round(e.riskPremium)} Punkten; jede weitere Belastung des Haushalts kostet an den Märkten doppelt.`;
			if (e.deficit > 4.5) return `Das Defizit liegt bei ${nf$3(e.deficit)} % des BIP und die Schulden bei ${nf$3(e.debtRatio)} %; er sieht keinen Spielraum für neue Ausgaben.`;
			return `Die Schulden liegen bei ${nf$3(e.debtRatio)} % des BIP, das Defizit bei ${nf$3(e.deficit)} %; er will, dass der Haushalt keine Überraschungen bringt.`;
		case "inneres": {
			const k = wertVon(w, "kriminalitaet");
			const t = wertVon(w, "terrorgefahr");
			return `Die Kriminalität steht bei ${Math.round(k)} von 100, die Terrorgefahr bei ${Math.round(t)}; sie fürchtet, dass ihre Kräfte für beides nicht reichen.`;
		}
		case "aussen": {
			const rang = LAENDER.map((l) => ({
				l,
				v: vertrauenZu(w, l.id)
			})).sort((a, b) => a.v - b.v)[0];
			return rang ? `Am schwierigsten ist das Verhältnis zu ${rang.l.dat} (Vertrauen ${Math.round(rang.v)} von 100); dort verliert er gerade Boden.` : "Er sorgt sich um die Bündnisse des Landes.";
		}
		case "zentralbank": return `Die Inflation liegt bei ${nf$3(e.inflation)} % (Ziel ${nf$3(e.inflationTarget)} %), der Leitzins bei ${nf$3(e.policyRate)} %; sie wacht darüber, dass ihre Unabhängigkeit nicht angetastet wird.`;
		case "stab": return `Die Zustimmung liegt bei ${nf$3(sp.umfrage.zustimmung)} %, ${sp.zusagen.filter((z) => !z.erfuellt && !z.gebrochen).length} Zusagen sind offen und ${sp.gesetze.length} Gesetze liegen im Parlament; sie zählt jeden Tag bis zur Wahl.`;
		case "justiz": {
			const h = wertVon(w, "haftueberfuellung");
			const u = wertVon(w, "justiz_unabhaengigkeit");
			return `Die Haftanstalten sind zu ${Math.round(h)} von 100 überfüllt, die Unabhängigkeit der Justiz steht bei ${Math.round(u)}; sie will Verfahren beschleunigen, ohne dass es nach Einmischung aussieht.`;
		}
		case "generalstab": {
			const m = wertVon(w, "truppenmoral");
			const v = wertVon(w, "offiziersvertrauen");
			return `Die Truppenmoral steht bei ${Math.round(m)}, das Vertrauen der Offiziere bei ${Math.round(v)}; ihn beschäftigen Ausrüstung, Beförderungen und wer sie entscheidet.`;
		}
		case "wirtschaft": return `Die Investitionen stehen bei ${Math.round(wertVon(w, "investitionen"))} von 100, das Wachstum bei ${nf$3(e.growth)} %; er will, dass sich das Land für Investoren nicht nach Willkür anfühlt.`;
		case "partner": {
			const offen = sp.zusagen.filter((z) => !z.erfuellt && !z.gebrochen && z.von === f.partei);
			return offen.length ? `Er wartet auf ${offen.length === 1 ? "eine Zusage" : `${offen.length} Zusagen`}: ${offen[0].text.replace(/^Die [^ ]+ erwartet /, "")}` : `Er fragt, was seine Partei vom Bündnis hat.`;
		}
		case "opposition": return `Die Polarisierung liegt bei ${Math.round(wertVon(w, "polarisierung"))} von 100; er sucht den Fehler, den er Ihnen vorhalten kann.`;
	}
}
//#endregion
//#region game/src/sim/figuren.ts
const VORNAMEN_F = [
	"Selin",
	"Derya",
	"Zeynep",
	"Nilay",
	"Melis",
	"Pınar",
	"Gizem",
	"Ebru",
	"Sevgi",
	"Nazlı",
	"Ilgın",
	"Damla",
	"Aylin",
	"Defne",
	"Hande"
];
const VORNAMEN_M = [
	"Kaan",
	"Barış",
	"Emre",
	"Tolga",
	"Volkan",
	"Onur",
	"Serkan",
	"Levent",
	"Murat",
	"Cengiz",
	"Orhan",
	"Taner",
	"Cem",
	"Burak",
	"Mert"
];
const NACHNAMEN = [
	"Yücel",
	"Karaca",
	"Erdem",
	"Aksoy",
	"Kılıç",
	"Tunç",
	"Arıkan",
	"Özgür",
	"Bozkurt",
	"Çelik",
	"Sarı",
	"Koçak",
	"Ateş",
	"Işık",
	"Uysal",
	"Yalçın",
	"Duran",
	"Güler",
	"Polat",
	"Demirci",
	"Kaplan",
	"Sezer",
	"Turan",
	"Akın"
];
const ROLLEN = [
	{
		id: "finanzen",
		amt: "finanzen",
		rolle: () => "Finanzminister",
		ziel: "Ein Haushalt ohne Überraschungen und Märkte, die dem Land vertrauen.",
		start: 62,
		weiblich: false
	},
	{
		id: "inneres",
		amt: "inneres",
		rolle: () => "Innenministerin",
		ziel: "Ruhe auf den Straßen und Rückhalt der Sicherheitskräfte.",
		start: 60,
		weiblich: true
	},
	{
		id: "aussen",
		amt: "aussen",
		rolle: () => "Außenminister",
		ziel: "Verlässliche Partner und ein Land, das mit allen redet.",
		start: 58,
		weiblich: false
	},
	{
		id: "zentralbank",
		amt: "zentralbank",
		rolle: () => "Gouverneurin der Zentralbank",
		ziel: "Preisstabilität, auch wenn sie unbeliebt macht.",
		start: 50,
		weiblich: true
	},
	{
		id: "stab",
		amt: "stab",
		rolle: () => "Chefin des Präsidialamts",
		ziel: "Dass der Präsident seine Amtszeit übersteht und etwas hinterlässt.",
		start: 75,
		weiblich: true
	},
	{
		id: "opposition",
		amt: "opposition",
		rolle: () => "Oppositionsführer",
		ziel: "Die Regierung vorführen und die nächste Wahl gewinnen.",
		start: 25,
		weiblich: false
	}
];
/** Weitere Ämter, die das Umfeld seit dem Ausbau der Personen tragen: Justiz, Streitkräfte, Wirtschaft. Eigener Zufallsstrom, damit alte Partien gleich bleiben. */
const ZUSATZ_ROLLEN = [
	{
		id: "justiz",
		amt: "justiz",
		rolle: () => "Justizministerin",
		ziel: "Verfahren beschleunigen, ohne dass es nach Einmischung aussieht.",
		start: 55,
		weiblich: true
	},
	{
		id: "generalstab",
		amt: "generalstab",
		rolle: () => "Chef des Generalstabs",
		ziel: "Einsatzbereite Streitkräfte und eine Beförderungspraxis, die die Truppe versteht.",
		start: 52,
		weiblich: false
	},
	{
		id: "wirtschaft",
		amt: "wirtschaft",
		rolle: () => "Wirtschaftsminister",
		ziel: "Ein Land, in dem sich Investieren lohnt und Gesetze nicht über Nacht wechseln.",
		start: 60,
		weiblich: false
	}
];
function name(rng, benutzt, weiblich) {
	for (;;) {
		const vor = weiblich ?? rng.next() < .5 ? VORNAMEN_F : VORNAMEN_M;
		const n = `${vor[Math.floor(rng.next() * vor.length)]} ${NACHNAMEN[Math.floor(rng.next() * NACHNAMEN.length)]}`;
		if (!benutzt.has(n)) {
			benutzt.add(n);
			return n;
		}
	}
}
/** Ein Name, der im Umfeld noch nicht vorkommt. */
const neuerName = name;
/** Erzeugt das Umfeld beim Amtsantritt. Das Regierungslager hat als Partner den Vorsitz der Bündnispartei. */
function erzeugeFiguren(world, rng) {
	const benutzt = /* @__PURE__ */ new Set();
	const figuren = ROLLEN.map((r) => ({
		id: r.id,
		name: name(rng, benutzt, r.weiblich),
		weiblich: r.weiblich,
		rolle: r.rolle(world),
		amt: r.amt,
		ziel: r.ziel,
		loyalitaet: r.start,
		imAmt: true
	}));
	const partner = world.player?.buendnis;
	if (partner) figuren.push({
		id: "partner",
		name: name(rng, benutzt, false),
		weiblich: false,
		rolle: `Vorsitz der ${partner}`,
		amt: "partner",
		ziel: "Ministerien, Einfluss und die Zusagen aus dem Wahlkampf.",
		loyalitaet: 55,
		imAmt: true,
		partei: partner
	});
	figuren.push(...zusatzFiguren(world, figuren, new Rng(world.seed ^ 20973 | 0)));
	return figuren;
}
function zusatzFiguren(world, vorhanden, rng) {
	const benutzt = new Set(vorhanden.map((f) => f.name));
	return ZUSATZ_ROLLEN.filter((r) => !vorhanden.some((f) => f.amt === r.amt)).map((r) => ({
		id: r.id,
		name: name(rng, benutzt, r.weiblich),
		weiblich: r.weiblich,
		rolle: r.rolle(world),
		amt: r.amt,
		ziel: r.ziel,
		loyalitaet: r.start,
		imAmt: true
	}));
}
/** Ältere Spielstände haben die neuen Ämter noch nicht: sie werden einmal ergänzt. */
function ergaenzeFiguren(world) {
	const sp = world.spiel;
	if (!sp) return;
	if (!ZUSATZ_ROLLEN.some((r) => !sp.figuren.some((f) => f.amt === r.amt))) return;
	sp.figuren.push(...zusatzFiguren(world, sp.figuren, new Rng(world.seed ^ 20973 ^ Math.imul(world.day, 2654435761) | 0)));
}
function figur(world, amt) {
	return world.spiel?.figuren.find((f) => f.amt === amt);
}
function anrede(f) {
	return f ? `${f.rolle} ${f.name}` : "";
}
function aendere(world, f, delta, grund) {
	if (!f) return;
	const vorher = f.loyalitaet;
	f.loyalitaet = Math.min(100, Math.max(0, f.loyalitaet + delta));
	if (grund && Math.abs(delta) >= 3 && Math.floor(vorher / 25) !== Math.floor(f.loyalitaet / 25)) addLog(world, "ereignis", `${anrede(f)}: ${f.loyalitaet > vorher ? "die Stimmung bessert sich" : "die Stimmung kippt"}.`, grund);
}
/** Figuren reagieren auf eine Änderung: erhöht (+1) oder gesenkt (−1). */
function reagiereFiguren(world, theme, massnahme, richtung) {
	if (!world.spiel || richtung === 0) return;
	const kosten = NET.nodes[NET.index.get(massnahme) ?? -1]?.cost ?? 0;
	if (kosten > 0) aendere(world, figur(world, "finanzen"), -richtung * 1.5, "Der Finanzminister mag keine Ausgaben ohne Deckung.");
	else if (kosten < 0) aendere(world, figur(world, "finanzen"), richtung * 1, "Mehr Einnahmen sind ihm recht.");
	if (theme === "sicherheit" || massnahme === "m_grenzschutz") aendere(world, figur(world, "inneres"), richtung * 2, "Die Innenministerin liest das als Rückhalt (oder Entzug) für die Sicherheitskräfte.");
	if (theme === "aussen") aendere(world, figur(world, "aussen"), richtung * 1.5, "Der Außenminister misst das daran, was es den Gesprächen mit den Partnern bringt.");
	if (theme === "recht") aendere(world, figur(world, "justiz"), richtung * (massnahme === "m_notstand" ? -2 : 1.5), "Die Justizministerin misst das daran, ob die Gerichte gestärkt oder beschnitten werden.");
	if (theme === "militaer") aendere(world, figur(world, "generalstab"), richtung * (massnahme === "m_offiziersauswahl" ? .5 : 2), "Der Chef des Generalstabs liest das als Rückhalt (oder Entzug) für die Truppe.");
	if (theme === "wirtschaft") aendere(world, figur(world, "wirtschaft"), richtung * (WIRTSCHAFT_EINGRIFF[massnahme] ?? 1.2), "Der Wirtschaftsminister misst das daran, was es Investoren und Betrieben bringt.");
	aendere(world, figur(world, "opposition"), -.3);
}
/** Maßnahmen der Wirtschaft, die Betriebe belasten statt fördern (Vorzeichen der Reaktion des Wirtschaftsministers). */
const WIRTSCHAFT_EINGRIFF = {
	m_mindestlohn: -1,
	m_preiskontrollen: -1.5,
	m_zoelle: -.5
};
/** Wer geht, merkt sich den Streit: Der Ehemalige kann später gegen den Präsidenten aussagen. */
function ehemaligeMerken(world, f, grund, groll) {
	const sp = world.spiel;
	if (!sp) return;
	const e = eigenVon(world, f);
	const g = groll ?? Math.min(100, Math.max(0, 35 + e.groll * .5 + (f.loyalitaet < 30 ? 20 : 0)));
	(sp.ehemalige ??= []).push({
		name: f.name,
		...f.weiblich !== void 0 ? { weiblich: f.weiblich } : {},
		amt: f.amt,
		rolle: f.rolle,
		ausgeschieden: world.day,
		groll: Math.round(g),
		ehrgeiz: e.ehrgeiz,
		lager: e.lager,
		grund,
		ausgepackt: false
	});
	if (sp.ehemalige.length > 12) sp.ehemalige.shift();
}
/** Setzt einen neuen Menschen auf das Amt: Name, Loyalität und Profil ändern sich, Rolle und Aufgabe bleiben. */
function besetzeNeu(world, f, b) {
	f.name = b.name;
	if (b.weiblich !== void 0) f.weiblich = b.weiblich;
	f.loyalitaet = b.loyalitaet;
	f.imAmt = true;
	delete f.gespraech;
	delete f.eigen;
	const e = eigenVon(world, f);
	if (b.stil) e.stil = b.stil;
	if (b.faehigkeit !== void 0) e.faehigkeit = b.faehigkeit;
	if (b.ehrgeiz !== void 0) e.ehrgeiz = b.ehrgeiz;
	if (b.lager) e.lager = b.lager;
	e.seit = world.day;
	e.einarbeitungBis = world.day + 60;
	if (b.kommissarisch) e.kommissarisch = true;
	if (b.notiz) merke(world, f, b.notiz);
}
/** Ersetzt ein Regierungsmitglied durch eine kommissarische Leitung (etwa nach einer Affäre); ein Nachfolger lässt sich danach ernennen. */
function ersetze(world, amt, rng) {
	const alt = figur(world, amt);
	const spiel = world.spiel;
	if (!alt || !spiel) return void 0;
	const benutzt = new Set(spiel.figuren.map((f) => f.name));
	const spec = ROLLEN.find((r) => r.amt === amt) ?? ZUSATZ_ROLLEN.find((r) => r.amt === amt);
	const neu = name(rng, benutzt, spec?.weiblich);
	const loyal = Math.round(50 + rng.between(-8, 16));
	const vorher = `${alt.rolle} ${alt.name}`;
	ehemaligeMerken(world, alt, "im Zuge einer Affäre ausgeschieden", 60);
	besetzeNeu(world, alt, {
		name: neu,
		loyalitaet: loyal,
		kommissarisch: true,
		notiz: `Kommissarisch eingesetzt nach dem Ausscheiden von ${vorher}`
	});
	if (spec) alt.ziel = spec.ziel;
	return alt;
}
/** Wie gern die Figur dem Präsidenten noch folgt, in Worten. */
function haltung(f) {
	if (f.loyalitaet >= 75) return "loyal";
	if (f.loyalitaet >= 55) return "verlässlich";
	if (f.loyalitaet >= 35) return "distanziert";
	if (f.loyalitaet >= 20) return "verärgert";
	return "kurz vor dem Bruch";
}
/** Für Ereignisse und Handlungen des Spielers: die Loyalität einer Figur verschieben. */
function loyalitaetAendern(world, amt, delta, grund) {
	aendere(world, figur(world, amt), delta, grund);
}
/** Der Vorsitz einer Partnerpartei als Figur mit eigenem Namen. */
function partnerFigur(world, partei, rolle, ziel, rng) {
	const benutzt = new Set((world.spiel?.figuren ?? []).map((f) => f.name));
	const weiblich = rng.next() < .35;
	return {
		id: `partner-${partei}`,
		name: name(rng, benutzt, weiblich),
		weiblich,
		rolle,
		amt: "partner",
		ziel,
		loyalitaet: 55,
		imAmt: true,
		partei
	};
}
/** Ein neuer, noch nicht vergebener Name für Nebenfiguren in Ereignissen (Bürgermeister, Chefredakteure, Vorstände). */
function zufallsName(world, rng) {
	return name(rng, new Set((world.spiel?.figuren ?? []).map((f) => f.name)));
}
//#endregion
//#region game/src/sim/berichte.ts
const REGEL = {
	schwelle: 8,
	berichteNachMonaten: [6, 12]
};
function zielGroessen(id) {
	return NET.edges.filter((e) => e.from === id).sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)).slice(0, 4).map((e) => ({
		id: e.to,
		erwartung: e.weight >= 0 ? 1 : -1
	}));
}
function problemeUm(id) {
	const nah = /* @__PURE__ */ new Set();
	for (const e of NET.edges) if (e.from === id) nah.add(e.to);
	for (const e of NET.edges) if (nah.has(e.from)) nah.add(e.to);
	return [...nah].filter((n) => NET.nodes[NET.index.get(n)].kind === "problem");
}
function akutZahl(world, id) {
	const node = NET.nodes[NET.index.get(id)];
	const i = NET.index.get(id);
	let n = 0;
	for (let p = 0; p < 81; p++) if (node.threshold && world.net.values[i * 81 + p] >= node.threshold) n++;
	return n;
}
/** Nach einem Beschluss festhalten, wie die Lage vorher war. */
function beobachte(world, id, von, auf, ort) {
	const spiel = world.spiel;
	if (!spiel || Math.abs(auf - von) < REGEL.schwelle) return;
	const node = NET.nodes[NET.index.get(id)];
	if (!node || node.kind !== "massnahme") return;
	const werte = {};
	for (const z of zielGroessen(id)) if (!NET.nodes[NET.index.get(z.id)].input) werte[z.id] = nationalAverage(NET, world.net, z.id);
	const akut = {};
	for (const p of problemeUm(id)) akut[p] = akutZahl(world, p);
	(spiel.beobachtungen ??= []).push({
		id,
		name: node.name,
		tag: world.day,
		von,
		auf,
		ort,
		werte,
		akut,
		berichtet: []
	});
	if (spiel.beobachtungen.length > 60) spiel.beobachtungen.shift();
}
const nf$2 = (x) => x.toLocaleString("de-DE", {
	minimumFractionDigits: 1,
	maximumFractionDigits: 1
});
function bericht(world, b, monate) {
	const node = NET.nodes[NET.index.get(b.id)];
	const zeilen = [];
	let passt = 0;
	let gegen = 0;
	let bewegt = 0;
	const ziele = zielGroessen(b.id);
	for (const z of ziele) {
		if (b.werte[z.id] === void 0) continue;
		const n = NET.nodes[NET.index.get(z.id)];
		const jetzt = nationalAverage(NET, world.net, z.id);
		const d = jetzt - b.werte[z.id];
		const erwartet = z.erwartung * (b.auf > b.von ? 1 : -1);
		zeilen.push(`${n.name}: ${nf$2(b.werte[z.id])} auf ${nf$2(jetzt)} (${d >= 0 ? "+" : "−"}${nf$2(Math.abs(d))})`);
		if (Math.abs(d) >= .8) {
			bewegt++;
			if (d * erwartet > 0) passt++;
			else if (Math.abs(d) >= 1.5) gegen++;
		}
	}
	for (const [pid, vorher] of Object.entries(b.akut)) {
		const jetzt = akutZahl(world, pid);
		if (jetzt === vorher && vorher === 0) continue;
		const n = NET.nodes[NET.index.get(pid)];
		zeilen.push(`${n.name}: akut in ${vorher} auf ${jetzt} Provinzen`);
		if (jetzt < vorher) passt++;
		else if (jetzt > vorher + 1) gegen++;
	}
	const rest = Math.max(0, (node.months ?? 1) - monate);
	const urteil = passt >= 1 && gegen === 0 ? "gut" : passt >= 1 && gegen >= 1 ? "gemischt" : bewegt === 0 ? "schwach" : "keine";
	const orte = b.ort ? ` (nur in ${b.ort.length} ${b.ort.length === 1 ? "Provinz" : "Provinzen"})` : "";
	return {
		tag: world.day,
		datum: world.date,
		massnahme: b.id,
		titel: `${b.name}${orte}: Stufe ${Math.round(b.von)} auf ${Math.round(b.auf)}, ${monate} Monate danach`,
		monate,
		urteil,
		zeilen,
		hinweis: (rest > 0 ? `Die volle Wirkung braucht noch etwa ${rest} ${rest === 1 ? "Monat" : "Monate"}. ` : "") + (urteil === "gut" ? "Es wirkt in die gewünschte Richtung." : urteil === "gemischt" ? "Es wirkt, aber anderes hat sich verschlechtert; ob es an dieser Maßnahme liegt, zeigt das Politiknetz." : urteil === "schwach" ? "Bisher ist kaum etwas zu sehen." : "Die Zahlen bewegen sich nicht in die gewünschte Richtung.") + " Die Zahlen zeigen die Veränderung insgesamt, nicht nur die dieser Maßnahme."
	};
}
/** Täglich: Fällige Berichte schreiben. */
function berichteTag(world) {
	const spiel = world.spiel;
	if (!spiel?.beobachtungen) return;
	for (const b of spiel.beobachtungen) for (const m of REGEL.berichteNachMonaten) {
		if (b.berichtet.includes(m) || world.day - b.tag < m * 30) continue;
		b.berichtet.push(m);
		const r = bericht(world, b, m);
		(spiel.berichte ??= []).push(r);
		if (spiel.berichte.length > 80) spiel.berichte.shift();
		spiel.chronik.push({
			tag: world.day,
			datum: world.date,
			titel: `Wirkungsbericht: ${b.name}`,
			ausgang: `${r.zeilen.slice(0, 2).join("; ")}. ${r.urteil === "gut" ? "Es wirkt." : r.urteil === "schwach" ? "Bisher kaum Wirkung." : r.urteil === "gemischt" ? "Gemischte Bilanz." : "Keine Wirkung in die gewünschte Richtung."}`
		});
		addLog(world, "ereignis", `Wirkungsbericht: ${b.name}, ${m} Monate danach`, r.zeilen.join("; ") + ". " + r.hinweis);
	}
}
//#endregion
//#region game/src/sim/fraktionen.ts
/** Woran eine Fraktion ihre Unterstützung knüpft. */
const FORDERUNG = {
	AKP: {
		massnahme: "m_religioese_schulen",
		text: "mehr Rückhalt für religiöse Schulen"
	},
	"YENİ": {
		massnahme: "m_wissenschaftsfreiheit",
		text: "mehr Wissenschaftsfreiheit"
	},
	DEM: {
		massnahme: "m_friedensprozess",
		text: "Fortschritte im Friedensprozess"
	},
	MHP: {
		massnahme: "m_verteidigung",
		text: "höhere Verteidigungsausgaben"
	},
	"İYİ": {
		massnahme: "m_grenzschutz",
		text: "mehr Grenzschutz"
	},
	CHP: {
		massnahme: "m_justizreform",
		text: "eine Justizreform"
	},
	Zafer: {
		massnahme: "m_grenzschutz",
		text: "deutlich mehr Grenzschutz"
	},
	YRP: {
		massnahme: "m_religionsbehoerde",
		text: "mehr Mittel für die Religionsbehörde"
	}
};
/** Was eine Fraktion je nach Lage fordern kann; nur Maßnahmen, die man erhöhen soll. Die Forderung wechselt alle paar Monate. */
const FORDERUNGEN = {
	AKP: [
		{
			massnahme: "m_religioese_schulen",
			text: "mehr Rückhalt für religiöse Schulen"
		},
		{
			massnahme: "m_kindergeld",
			text: "ein höheres Kindergeld"
		},
		{
			massnahme: "m_bauindustrie",
			text: "Aufträge und Förderung für die Bauindustrie"
		},
		{
			massnahme: "m_agrarsubventionen",
			text: "höhere Agrarsubventionen"
		},
		{
			massnahme: "m_autobahnen",
			text: "neue Autobahnen und Brücken"
		}
	],
	"YENİ": [
		{
			massnahme: "m_wissenschaftsfreiheit",
			text: "mehr Wissenschaftsfreiheit"
		},
		{
			massnahme: "m_investitionsanreize",
			text: "Investitionsanreize für Unternehmen"
		},
		{
			massnahme: "m_kmu",
			text: "Förderung für den Mittelstand"
		},
		{
			massnahme: "m_verwaltungsdigital",
			text: "eine digitale Verwaltung"
		},
		{
			massnahme: "m_forschung",
			text: "mehr Geld für Forschung"
		}
	],
	CHP: [
		{
			massnahme: "m_justizreform",
			text: "eine Justizreform"
		},
		{
			massnahme: "m_gewaltschutz",
			text: "besseren Schutz vor Gewalt gegen Frauen"
		},
		{
			massnahme: "m_sozialwohnungen",
			text: "mehr Sozialwohnungen"
		},
		{
			massnahme: "m_stipendien",
			text: "mehr Stipendien für Studierende"
		},
		{
			massnahme: "m_mindestlohn",
			text: "einen höheren Mindestlohn"
		}
	],
	MHP: [
		{
			massnahme: "m_verteidigung",
			text: "höhere Verteidigungsausgaben"
		},
		{
			massnahme: "m_ruestungsindustrie",
			text: "Ausbau der heimischen Rüstungsindustrie"
		},
		{
			massnahme: "m_grenzschutz",
			text: "mehr Grenzschutz"
		},
		{
			massnahme: "m_polizei",
			text: "eine stärkere Polizei"
		}
	],
	"İYİ": [
		{
			massnahme: "m_grenzschutz",
			text: "mehr Grenzschutz"
		},
		{
			massnahme: "m_rueckkehr",
			text: "Rückkehrprogramme für Geflüchtete"
		},
		{
			massnahme: "m_kmu",
			text: "Entlastung für den Mittelstand"
		},
		{
			massnahme: "m_polizei",
			text: "eine stärkere Polizei"
		}
	],
	DEM: [
		{
			massnahme: "m_friedensprozess",
			text: "Fortschritte im Friedensprozess"
		},
		{
			massnahme: "m_regionalfoerderung",
			text: "mehr Geld für die benachteiligten Regionen"
		},
		{
			massnahme: "m_versammlungsfreiheit",
			text: "mehr Versammlungsfreiheit"
		},
		{
			massnahme: "m_gewerkschaftsrechte",
			text: "stärkere Gewerkschaftsrechte"
		}
	],
	Zafer: [
		{
			massnahme: "m_grenzschutz",
			text: "deutlich mehr Grenzschutz"
		},
		{
			massnahme: "m_rueckkehr",
			text: "konsequente Rückführungen"
		},
		{
			massnahme: "m_polizei",
			text: "eine stärkere Polizei"
		}
	],
	YRP: [
		{
			massnahme: "m_religionsbehoerde",
			text: "mehr Mittel für die Religionsbehörde"
		},
		{
			massnahme: "m_renten",
			text: "höhere Renten"
		},
		{
			massnahme: "m_sozialhilfe",
			text: "höhere Sozialhilfe"
		},
		{
			massnahme: "m_kindergeld",
			text: "ein höheres Kindergeld"
		}
	]
};
const PARTEI_NAME = {
	AKP: "AKP",
	"YENİ": "YENİ Parti",
	CHP: "CHP",
	MHP: "MHP",
	"İYİ": "İYİ Parti",
	DEM: "DEM Parti",
	Zafer: "Zafer Partisi",
	YRP: "Yeniden Refah"
};
/** Kurzbeschreibung der Ausrichtung, damit man Partner und Gegner einordnen kann. */
const AUSRICHTUNG = {
	AKP: "national-konservativ, bisherige Regierungspartei",
	"YENİ": "liberal-zentristisch, wirtschaftsnah",
	CHP: "sozialdemokratisch, säkular",
	MHP: "nationalistisch, sicherheitsorientiert",
	"İYİ": "nationalistisch-liberal, grenzstreng",
	DEM: "linksgerichtet, für die kurdischen Regionen",
	Zafer: "nationalistisch, migrationskritisch",
	YRP: "islamisch-konservativ, sozialpolitisch"
};
/** Politische Nähe der Fraktionen zur eigenen Partei des Spielers: −2 (fern) bis +2 (nah). */
const NAEHE = {
	AP: {
		AKP: -1,
		"YENİ": 2,
		CHP: 1,
		MHP: -1,
		"İYİ": 1,
		DEM: 0,
		Zafer: -2,
		YRP: -1
	},
	PG: {
		AKP: -1,
		"YENİ": 1,
		CHP: 2,
		MHP: -1,
		"İYİ": -1,
		DEM: 2,
		Zafer: -2,
		YRP: 0
	},
	PW: {
		AKP: 2,
		"YENİ": 0,
		CHP: -1,
		MHP: 1,
		"İYİ": 1,
		DEM: -1,
		Zafer: 0,
		YRP: 2
	},
	PR: {
		AKP: -1,
		"YENİ": 1,
		CHP: 1,
		MHP: 0,
		"İYİ": 0,
		DEM: 1,
		Zafer: -1,
		YRP: 0
	}
};
/** Ausgangsbereitschaft einer Fraktion, mit dem Präsidenten zusammenzuarbeiten (0 bis 100). */
function startBereitschaft(world, partei) {
	const nah = NAEHE[world.player?.partei.kurz ?? ""]?.[partei] ?? 0;
	const zustimmung = world.spiel?.umfrage.zustimmung ?? 50;
	return clamp(Math.round(42 + 12 * nah + .35 * (zustimmung - 50)), 10, 90);
}
function fraktion(world, partei) {
	const spiel = world.spiel;
	if (!spiel) return { bereitschaft: 40 };
	spiel.fraktionen ??= {};
	return spiel.fraktionen[partei] ??= { bereitschaft: startBereitschaft(world, partei) };
}
function bereitschaftAendern(world, partei, delta) {
	if (!world.parliament?.seats[partei]) return;
	const f = fraktion(world, partei);
	f.bereitschaft = clamp(f.bereitschaft + delta, 0, 100);
}
function bereitschaftWort(b) {
	if (b >= 70) return "aufgeschlossen";
	if (b >= 55) return "gesprächsbereit";
	if (b >= 40) return "abwägend";
	if (b >= 25) return "reserviert";
	return "ablehnend";
}
/** Anteil der Sitze einer duldenden Fraktion, der tatsächlich mitstimmt. */
const DULDUNG_QUOTE = .7;
/** Fraktionen, die das Lager bei Gesetzen dulden (ohne im Lager zu sein): ihre Sitze und die erwarteten Ja-Stimmen daraus. */
function duldung(world) {
	const spiel = world.spiel;
	const parl = world.parliament;
	const out = {
		sitze: 0,
		ja: 0,
		parteien: []
	};
	if (!spiel || !parl) return out;
	for (const [partei, f] of Object.entries(spiel.fraktionen ?? {})) {
		if (f.duldungBis === void 0 || f.duldungBis <= world.day || spiel.lager.includes(partei)) continue;
		const sitze = parl.seats[partei] ?? 0;
		out.sitze += sitze;
		out.ja += Math.round(sitze * DULDUNG_QUOTE);
		out.parteien.push(partei);
	}
	return out;
}
/** Anteil der Sitze einer Fraktion, der für ein Gesetz stimmt, das genau ihre Kernforderung erfüllt. */
const SACHSTIMMEN_QUOTE = .6;
/** Ja-Stimmen aus Fraktionen außerhalb des Lagers, deren Kernforderung dieses Gesetz erfüllt (Sachkoalition). */
function sachstimmen(world, massnahme, richtung) {
	const spiel = world.spiel;
	const parl = world.parliament;
	const out = {
		ja: 0,
		sitze: 0,
		parteien: []
	};
	if (!spiel || !parl || !massnahme || richtung <= 0) return out;
	const dul = duldung(world).parteien;
	for (const [partei, sitze] of Object.entries(parl.seats)) {
		if (partei === world.player?.partei.kurz || spiel.lager.includes(partei) || dul.includes(partei)) continue;
		if (forderungVon(world, partei).massnahme !== massnahme) continue;
		out.sitze += sitze;
		out.ja += Math.round(sitze * SACHSTIMMEN_QUOTE);
		out.parteien.push(partei);
	}
	return out;
}
/**
* Wer außer dem eigenen Bündnispartner noch ins Lager gehört, damit das Spiel mit einer Regierungsmehrheit beginnt.
* Gewählt wird nach politischer Nähe und Größe; wer der eigenen Partei fern steht („−2“), wird nur gewählt, wenn nichts anderes bleibt.
*/
function waehlePartner(seats, eigene, buendnis) {
	const nah = NAEHE[eigene] ?? {};
	const grund = (seats[eigene] ?? 0) + (buendnis ? seats[buendnis] ?? 0 : 0);
	if (grund >= 316) return [];
	const kandidaten = Object.keys(seats).filter((p) => p !== eigene && p !== buendnis && (seats[p] ?? 0) >= 15 && (nah[p] ?? 0) > -2);
	const kombis = [];
	for (let i = 0; i < kandidaten.length; i++) {
		kombis.push([kandidaten[i]]);
		for (let j = i + 1; j < kandidaten.length; j++) {
			kombis.push([kandidaten[i], kandidaten[j]]);
			for (let k = j + 1; k < kandidaten.length; k++) kombis.push([
				kandidaten[i],
				kandidaten[j],
				kandidaten[k]
			]);
		}
	}
	const summe = (k) => k.reduce((s, p) => s + (seats[p] ?? 0), 0);
	const riese = (k) => k.some((p) => (seats[p] ?? 0) >= 200);
	const wert = (k, ziel) => k.reduce((s, p) => s + (nah[p] ?? 0) * 3, 0) - (grund + summe(k) - ziel) / 40 - 1.2 * (k.length - 1);
	let ersatz = null;
	for (const ziel of [316, 306]) {
		const genug = kombis.filter((k) => grund + summe(k) >= ziel);
		if (!genug.length) continue;
		const ohneRiese = genug.filter((k) => !riese(k));
		const beste = (ohneRiese.length ? ohneRiese : genug).reduce((b, k) => wert(k, ziel) > wert(b, ziel) ? k : b);
		if (!riese(beste)) return beste;
		ersatz ??= beste;
	}
	if (ersatz) return ersatz;
	const sortiert = [...kandidaten].sort((x, y) => (nah[y] ?? 0) - (nah[x] ?? 0) || (seats[y] ?? 0) - (seats[x] ?? 0));
	const out = [];
	let bloc = grund;
	for (const p of sortiert) {
		if (bloc >= 306) break;
		out.push(p);
		bloc += seats[p] ?? 0;
	}
	return out;
}
const hash = (t) => {
	let h = 2166136261;
	for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
	return h >>> 0;
};
/** Zeitraum, nach dem eine Fraktion etwas anderes verlangt (Tage). */
const FORDERUNG_DAUER = 270;
/**
* Woran die Fraktion ihre Unterstützung gerade knüpft. Sie behält die Forderung, bis sie erfüllt, überholt oder zu alt ist,
* und wählt dann eine andere aus ihrem Vorrat; welche, hängt von dieser Partie ab, nicht vom Zufall der Sekunde.
*/
function forderungVon(world, partei) {
	const spiel = world.spiel;
	const pool = FORDERUNGEN[partei];
	if (!spiel || !pool?.length) return FORDERUNG[partei] ?? {
		massnahme: "m_justizreform",
		text: "ein Entgegenkommen"
	};
	const f = fraktion(world, partei);
	const stufe = (id) => nationalAverage(NET, world.net, id);
	const alt = f.forderung;
	if (!alt || world.day - alt.seit > FORDERUNG_DAUER || stufe(alt.massnahme) >= 90) {
		spiel.salz ??= world.rngState >>> 0;
		const frei = pool.filter((e) => stufe(e.massnahme) < 85 && e.massnahme !== alt?.massnahme);
		const liste = frei.length ? frei : pool;
		const wahl = liste[hash(`${spiel.salz}|${partei}|${Math.floor(world.day / FORDERUNG_DAUER)}|${alt?.massnahme ?? ""}`) % liste.length];
		f.forderung = {
			massnahme: wahl.massnahme,
			text: wahl.text,
			seit: world.day
		};
	}
	return {
		massnahme: f.forderung.massnahme,
		text: f.forderung.text
	};
}
//#endregion
//#region game/src/sim/handeln.ts
const REGELN = {
	/** Gleichzeitig laufende Vorhaben, bevor die Verwaltung überlastet ist */
	kapazitaet: 8,
	/** Zuschlag je Vorhaben über der Kapazität (Dauer und Kapital) */
	ueberlastStufe: .2,
	/** Tage vom Einbringen bis zur Abstimmung */
	tageBisAbstimmung: 21,
	mehrheit: 301,
	/** Kapital je gekaufter Stimme */
	kaufKostenProStimme: .5,
	/** Anteil des Kapitals, der beim Zurückziehen eines Gesetzes zurückkommt */
	rueckzugAnteil: .6,
	/** Ein Erlass kostet mehr Kapital und Vertrauen */
	erlassFaktor: 2,
	/** Allgemeiner Faktor auf alle Kapitalkosten von Änderungen (Kalibrierung der Knappheit) */
	kapitalFaktor: 1.8,
	kapitalMax: 150
};
/** Kapital je Stufenpunkt Änderung; heikle Themen kosten mehr. */
const GEWICHT_THEMA = {
	wirtschaft: .2,
	haushalt: .28,
	arbeit: .2,
	bildung: .18,
	gesundheit: .18,
	landwirtschaft: .18,
	energie: .2,
	infrastruktur: .15,
	wohnen: .2,
	sicherheit: .25,
	recht: .25,
	militaer: .25,
	kultur: .15,
	gesellschaft: .3,
	aussen: .28
};
const GEWICHT_MASSNAHME = {
	m_einkommensteuer: .35,
	m_mwst: .35,
	m_kraftstoffsteuer: .32,
	m_justizreform: .35,
	m_internetsperren: .4,
	m_medienaufsicht: .35,
	m_friedensprozess: .4,
	m_religioese_schulen: .35,
	m_verteidigung: .3
};
/** Wo das Recht einen Erlass des Präsidenten zulässt (Verwaltung, Sicherheit, Außenbeziehungen). */
const ERLASS_THEMEN = /* @__PURE__ */ new Set([
	"sicherheit",
	"aussen",
	"militaer"
]);
const ERLASS_MASSNAHMEN = /* @__PURE__ */ new Set(["m_steuerfahndung", "m_verwaltungsdigital"]);
function provinzName(plaka) {
	return PROVINZEN[plaka - 1]?.name ?? `Provinz ${plaka}`;
}
/** „Hatay“, „Hatay und Adana“, „Hatay, Adana und Mersin“, bei vielen „12 Provinzen“. */
function provinzenText(provinzen) {
	if (!provinzen || provinzen.length === 0 || provinzen.length >= 81) return "im ganzen Land";
	const namen = provinzen.map(provinzName);
	if (namen.length > 4) return `in ${namen.length} Provinzen`;
	if (namen.length === 1) return `in ${namen[0]}`;
	return `in ${namen.slice(0, -1).join(", ")} und ${namen[namen.length - 1]}`;
}
function ortsListe(provinzen) {
	if (!provinzen || provinzen.length === 0 || provinzen.length >= 81) return null;
	return [...new Set(provinzen)].filter((p) => p >= 1 && p <= 81).sort((a, b) => a - b);
}
function anteil(world, ort) {
	if (!ort) return 1;
	return ort.reduce((s, p) => s + world.net.weights[p - 1], 0);
}
function knotenIndex(id) {
	const i = NET.index.get(id);
	const node = i === void 0 ? void 0 : NET.nodes[i];
	if (i === void 0 || !node || node.kind !== "massnahme") throw new Error(`Keine Maßnahme: ${id}`);
	return i;
}
/** Bevölkerungsgewichteter Mittelwert der Stufe in den Provinzen (oder im ganzen Land). */
function stufeIn(world, id, ort) {
	if (!ort) return nationalAverage(NET, world.net, id);
	const i = knotenIndex(id);
	let sum = 0;
	let w = 0;
	for (const p of ort) {
		const weight = world.net.weights[p - 1];
		sum += world.net.values[i * 81 + p - 1] * weight;
		w += weight;
	}
	return sum / w;
}
/** Maßnahmen, die noch umgesetzt werden, plus Gesetze in der Beratung. */
function offeneVorhaben(world) {
	const ids = /* @__PURE__ */ new Set();
	for (const [id, target] of Object.entries(world.net.targets)) if (Math.abs(nationalAverage(NET, world.net, id) - target) > 1) ids.add(id);
	for (const id of Object.keys(world.net.ziele ?? {})) ids.add(id);
	for (const g of world.spiel?.gesetze ?? []) ids.add(g.massnahme);
	return ids.size;
}
function ueberlast(world, zusaetzlich = 0) {
	const ueber = Math.max(0, offeneVorhaben(world) + zusaetzlich - REGELN.kapazitaet);
	return 1 + REGELN.ueberlastStufe * ueber;
}
/** `gesetz` (Maßnahme und Richtung der Änderung) macht die Rechnung inhaltsbezogen: Fraktionen stimmen für das, was sie wollen. */
function stimmenSicht(world, gesetz) {
	const parl = world.parliament;
	const player = world.player;
	if (!parl || !player) return {
		lager: 600,
		erwartet: 600,
		low: 590,
		high: 600,
		luecke: 0,
		duldung: 0,
		duldungSitze: 0,
		sach: 0,
		sachParteien: []
	};
	const lager = [player.partei.kurz, ...world.spiel?.lager ?? []].reduce((s, p) => s + (parl.seats[p] ?? 0), 0);
	const dul = duldung(world);
	const sach = sachstimmen(world, gesetz?.massnahme, gesetz?.richtung ?? 0);
	const gegner = 600 - lager - dul.sitze - sach.sitze;
	const uebertritt = clamp(.04 + .22 * ((world.spiel?.umfrage.zustimmung ?? 50) - 35) / 40, .02, .3);
	const erwartet = Math.min(600, lager + dul.ja + sach.ja + Math.round(gegner * uebertritt));
	const band = 8 + Math.round(gegner * .02);
	return {
		lager,
		erwartet,
		low: erwartet - band,
		high: Math.min(600, erwartet + band),
		luecke: Math.max(0, REGELN.mehrheit - erwartet),
		duldung: dul.ja,
		duldungSitze: dul.sitze,
		sach: sach.ja,
		sachParteien: sach.parteien
	};
}
function pkKosten(world, id, delta, ort, weg, ueberl) {
	const node = NET.nodes[knotenIndex(id)];
	const gewicht = GEWICHT_MASSNAHME[id] ?? GEWICHT_THEMA[node.theme] ?? .2;
	const share = anteil(world, ort);
	const ortsfaktor = ort ? .35 + .65 * Math.min(1, share * 3) : 1;
	const rabatt = 1 - rabattFuer(world, node.theme);
	const basis = Math.abs(delta) * gewicht * REGELN.kapitalFaktor * ortsfaktor * ueberl * rabatt * (weg === "erlass" ? REGELN.erlassFaktor : 1);
	return Math.max(2, Math.round(basis));
}
function erlassMoeglich(id) {
	const node = NET.nodes[knotenIndex(id)];
	return ERLASS_THEMEN.has(node.theme) || ERLASS_MASSNAHMEN.has(id);
}
function pruefeVorhaben(world, id, stufe, provinzen) {
	const i = knotenIndex(id);
	const node = NET.nodes[i];
	const ort = ortsListe(provinzen);
	const ziel = clamp(Math.round(stufe), 0, 100);
	const aenderung = ziel - stufeIn(world, id, ort);
	const share = anteil(world, ort);
	let kostenBip = 0;
	const liste = ort ?? Array.from({ length: 81 }, (_, p) => p + 1);
	for (const p of liste) kostenBip += world.net.weights[p - 1] * (ziel - world.net.values[i * 81 + p - 1]) * (node.cost ?? 0) / 100;
	const offen = offeneVorhaben(world);
	const ueberl = ueberlast(world, 1);
	const kapital = world.spiel?.kapital ?? Infinity;
	const stimmen = stimmenSicht(world, {
		massnahme: id,
		richtung: Math.sign(aenderung)
	});
	const pkGesetz = pkKosten(world, id, aenderung, ort, "gesetz", ueberl);
	const erlassOk = erlassMoeglich(id);
	const pkErlass = pkKosten(world, id, aenderung, ort, "erlass", ueberl);
	const hinweise = [];
	if (ueberl > 1) hinweise.push(`Die Verwaltung ist mit ${offen} laufenden Vorhaben überlastet: Dauer und Kapital steigen um ${Math.round((ueberl - 1) * 100)} %.`);
	if (stimmen.luecke > 0) hinweise.push(`Dem Lager fehlen für eine Mehrheit voraussichtlich ${stimmen.luecke} Stimmen; sie lassen sich mit Kapital kaufen, das kostet später Gegenleistungen.`);
	if (ort && share < .05) hinweise.push("Ein kleiner Ort: Die Wirkung auf die Landeswerte ist gering, die vor Ort deutlich.");
	const base = {
		ok: true,
		massnahme: id,
		name: node.name,
		stufe: ziel,
		provinzen: ort,
		aenderung,
		monate: Math.max(1, Math.ceil((node.months ?? 1) * ueberl)),
		kostenBip,
		ueberlast: ueberl,
		offen,
		kapital,
		gesetz: {
			pk: pkGesetz,
			stimmen,
			tage: REGELN.tageBisAbstimmung,
			bezahlbar: kannZahlen(kapital, pkGesetz)
		},
		erlass: erlassOk ? {
			moeglich: true,
			pk: pkErlass,
			bezahlbar: kannZahlen(kapital, pkErlass)
		} : {
			moeglich: false,
			pk: pkErlass,
			bezahlbar: false,
			grund: "Dafür braucht der Präsident ein Gesetz; ein Erlass ist nur in Sicherheit und Außenbeziehungen zulässig."
		},
		hinweise
	};
	if (Math.abs(aenderung) < 1) return {
		...base,
		ok: false,
		grund: "Das ist schon die aktuelle Stufe."
	};
	return base;
}
function wendeAn(world, id, level, provinzen) {
	const i = knotenIndex(id);
	const node = NET.nodes[i];
	const ort = ortsListe(provinzen);
	const target = clamp(Math.round(level), 0, 100);
	const months = Math.max(1, (node.months ?? 1) * ueberlast(world));
	const vorher = stufeIn(world, id, ort);
	const s = world.net;
	beobachte(world, id, vorher, target, ort);
	if (!ort) {
		s.targets[id] = target;
		s.steps[id] = Math.max(Math.abs(target - nationalAverage(NET, s, id)) / months, .01);
		if (s.ziele) delete s.ziele[id];
		if (s.schritte) delete s.schritte[id];
	} else {
		s.ziele ??= {};
		s.schritte ??= {};
		const arr = s.ziele[id] ??= new Array(81).fill(-1);
		const st = s.schritte[id] ??= new Array(81).fill(100);
		if (s.targets[id] !== void 0) {
			for (let p = 0; p < 81; p++) if (!ort.includes(p + 1) && arr[p] < 0) {
				arr[p] = s.targets[id];
				st[p] = s.steps[id] ?? 100;
			}
			delete s.targets[id];
			delete s.steps[id];
		}
		for (const p of ort) {
			arr[p - 1] = target;
			st[p - 1] = Math.max(Math.abs(target - s.values[i * 81 + p - 1]) / months, .01);
		}
	}
	const richtung = Math.sign(target - vorher);
	for (const z of world.spiel?.zusagen ?? []) if (!z.erfuellt && !z.gebrochen && z.massnahme === id && richtung === Math.sign(z.richtung ?? 0)) {
		z.erfuellt = true;
		bereitschaftAendern(world, z.von, 10);
		addLog(world, "ereignis", `Zusage erfüllt: ${z.text}`, "Wer Zusagen hält, wird beim nächsten Mal ernster genommen.");
	}
	reagiereFiguren(world, node.theme, id, richtung);
}
/**
* Direkte Anwendung ohne Kapital und Abstimmung. Für Tests, den Kern und Fälle ohne Spielschleife;
* die Oberfläche geht über `bringeEin`.
*/
function setPolicy(world, id, level, provinzen) {
	const i = knotenIndex(id);
	const node = NET.nodes[i];
	const ort = ortsListe(provinzen);
	const target = clamp(Math.round(level), 0, 100);
	const current = stufeIn(world, id, ort);
	const months = node.months ?? 1;
	let costChange = 0;
	for (const p of ort ?? Array.from({ length: 81 }, (_, k) => k + 1)) costChange += world.net.weights[p - 1] * (target - world.net.values[i * 81 + p - 1]) * (node.cost ?? 0) / 100;
	wendeAn(world, id, target, ort);
	addLog(world, "entscheidung", `${node.name} ${provinzenText(ort)}: von Stufe ${Math.round(current)} auf ${target} ${target > current ? "erhöht" : "gesenkt"}.`, `${node.text} Umsetzung in etwa ${months} ${months === 1 ? "Monat" : "Monaten"}` + (Math.abs(costChange) >= 5e-4 ? `; ${costChange > 0 ? "kostet" : "bringt"} jährlich etwa ${fmt(Math.abs(costChange))} % der Wirtschaftsleistung.` : "."));
}
/** Wird nach jedem erfolgreich eingebrachten Vorhaben aufgerufen (Ereignisse schließen sich, wenn der Spieler die Ursache selbst regelt). */
let nachEinbringen = null;
function setzeEinbringHaken(fn) {
	nachEinbringen = fn;
}
/** Ein Vorhaben einbringen: als Gesetz (mit Abstimmung) oder als Erlass. */
function bringeEin(world, id, stufe, provinzen, weg) {
	const pr = pruefeVorhaben(world, id, stufe, provinzen);
	if (!pr.ok) return {
		ok: false,
		text: pr.grund ?? "Nicht möglich."
	};
	const spiel = world.spiel;
	if (!spiel) {
		setPolicy(world, id, stufe, provinzen);
		const l = world.log[world.log.length - 1];
		return {
			ok: true,
			text: l.text,
			why: l.why
		};
	}
	if (spiel.ende) return {
		ok: false,
		text: "Die Amtszeit ist beendet."
	};
	if (weg === "erlass") {
		if (!pr.erlass.moeglich) return {
			ok: false,
			text: pr.erlass.grund,
			why: "Wege statt Verbote: Der Weg über ein Gesetz steht offen."
		};
		if (!pr.erlass.bezahlbar) return {
			ok: false,
			text: `Für den Erlass fehlt Politisches Kapital (nötig ${pr.erlass.pk}, vorhanden ${Math.floor(spiel.kapital)}).`
		};
		spiel.kapital -= pr.erlass.pk;
		setPolicy(world, id, pr.stufe, pr.provinzen);
		vertrauenAendern(world, -(1 + Math.abs(pr.aenderung) / 40));
		const l = world.log[world.log.length - 1];
		nachEinbringen?.(world, id, `Per Erlass angeordnet: ${l.text}`);
		return {
			ok: true,
			text: `Erlass: ${l.text}`,
			why: `${l.why} Ein Erlass umgeht das Parlament und kostet ${pr.erlass.pk} Kapital sowie etwas Vertrauen.`
		};
	}
	if (!pr.gesetz.bezahlbar) return {
		ok: false,
		text: `Für dieses Gesetz fehlt Politisches Kapital (nötig ${pr.gesetz.pk}, vorhanden ${Math.floor(spiel.kapital)}).`,
		why: "Kapital wächst mit Vertrauen und Mehrheit; nicht alles auf einmal."
	};
	if (spiel.gesetze.some((g) => g.massnahme === id)) return {
		ok: false,
		text: `Zu „${pr.name}“ liegt schon ein Gesetzentwurf im Parlament.`
	};
	spiel.kapital -= pr.gesetz.pk;
	const tag = world.day + REGELN.tageBisAbstimmung;
	spiel.gesetze.push({
		id: `g-${world.day}-${id}`,
		massnahme: id,
		name: pr.name,
		stufe: pr.stufe,
		provinzen: pr.provinzen,
		eingebracht: world.day,
		abstimmung: tag,
		pk: pr.gesetz.pk,
		absprachen: 0,
		richtung: Math.sign(pr.aenderung)
	});
	const text = `Gesetzentwurf „${pr.name}“ ${provinzenText(pr.provinzen)} auf Stufe ${pr.stufe} eingebracht. Die Abstimmung ist in ${REGELN.tageBisAbstimmung} Tagen.`;
	const why = `${pr.gesetz.pk} Kapital gezahlt. Erwartet werden ${pr.gesetz.stimmen.erwartet} Ja-Stimmen (Spanne ${pr.gesetz.stimmen.low} bis ${pr.gesetz.stimmen.high}), nötig sind ${REGELN.mehrheit}.`;
	addLog(world, "entscheidung", text, why);
	nachEinbringen?.(world, id, text);
	return {
		ok: true,
		text,
		why
	};
}
function gesetzRichtung(world, g) {
	return g.richtung ?? Math.sign(g.stufe - stufeIn(world, g.massnahme, g.provinzen));
}
/** Am Abstimmungstag wird entschieden: Ja-Stimmen aus Lager, Übertritten, Absprachen und Zufall. */
function gesetzeAbstimmen(world, rng) {
	const spiel = world.spiel;
	if (!spiel) return [];
	const out = [];
	const faellig = spiel.gesetze.filter((g) => g.abstimmung <= world.day);
	if (faellig.length === 0) return out;
	spiel.gesetze = spiel.gesetze.filter((g) => g.abstimmung > world.day);
	for (const g of faellig) {
		const sicht = stimmenSicht(world, {
			massnahme: g.massnahme,
			richtung: gesetzRichtung(world, g)
		});
		const ja = Math.min(600, Math.max(0, sicht.erwartet + g.absprachen + Math.round(rng.normal(6))));
		const nein = 600 - ja;
		const angenommen = ja >= REGELN.mehrheit;
		out.push({
			gesetz: g.name,
			angenommen,
			ja,
			nein
		});
		if (angenommen) {
			wendeAn(world, g.massnahme, g.stufe, g.provinzen);
			const node = NET.nodes[knotenIndex(g.massnahme)];
			addLog(world, "entscheidung", `Das Parlament nimmt „${g.name}“ ${provinzenText(g.provinzen)} an (${ja} zu ${nein}). Stufe ${g.stufe}.`, `${node.text} Umsetzung in etwa ${Math.max(1, Math.ceil((node.months ?? 1) * ueberlast(world)))} Monaten.`);
		} else {
			vertrauenAendern(world, -1.2);
			spiel.umfrage.zustimmung = Math.max(0, spiel.umfrage.zustimmung - .8);
			addLog(world, "entscheidung", `Das Parlament lehnt „${g.name}“ ab (${ja} zu ${nein}).`, `Das eingesetzte Kapital (${g.pk}) ist verloren, die Regierung wirkt geschwächt. Es fehlten ${REGELN.mehrheit - ja} Stimmen; ein Rückzug vor der Abstimmung hätte ${Math.floor(g.pk * REGELN.rueckzugAnteil)} Kapital gerettet.`);
		}
	}
	return out;
}
//#endregion
//#region game/src/data/skalen.ts
const S = (w, name, text) => text ? {
	w,
	name,
	text
} : {
	w,
	name
};
/** Benannte Zustände; genau einer liegt nahe am Startwert der Maßnahme („heute“). */
const REGIME = {
	m_wissenschaftsfreiheit: [
		S(10, "Staatlich gelenkt", "Rektoren und Berufungen bestimmt der Staat."),
		S(25, "Stark kontrolliert", "Wenig Spielraum in Lehre und Berufungen."),
		S(40, "Teilweise autonom", "Autonomie mit politischer Einflussnahme."),
		S(65, "Weitgehend autonom", "Hochschulen wählen Leitung und Personal weitgehend selbst."),
		S(90, "Volle akademische Freiheit", "Unabhängige Berufungen, freie Forschung und Lehre.")
	],
	m_medienaufsicht: [
		S(10, "Selbstkontrolle", "Die Branche kontrolliert sich selbst."),
		S(30, "Nur bei Straftaten", "Eingriffe nur nach Gerichtsbeschluss."),
		S(50, "Regelmäßige Aufsicht", "Die Behörde prüft und rügt."),
		S(65, "Strenge Aufsicht mit Strafen", "Bußgelder und Sendeverbote sind an der Tagesordnung."),
		S(90, "Verbote und Schließungen", "Kritische Sender und Zeitungen werden geschlossen.")
	],
	m_internetsperren: [
		S(0, "Keine Sperren", "Das Netz ist frei."),
		S(25, "Nur bei schweren Straftaten", "Sperren nach Gerichtsbeschluss."),
		S(45, "Gezielte Sperren", "Einzelne Seiten und Beiträge werden gesperrt."),
		S(60, "Umfangreiche Sperren und Drosselung", "Soziale Medien werden in Krisen gedrosselt."),
		S(90, "Plattformsperren und Zensur", "Ganze Plattformen sind gesperrt.")
	],
	m_staatsmedien: [
		S(10, "Öffentlich-rechtlich unabhängig", "Sender mit Beitrag und unabhängiger Aufsicht."),
		S(35, "Kleines Budget", "Staatliche Sender, wenig staatliche Anzeigen."),
		S(60, "Große Staatssender", "Viel staatliche Werbung, regierungsnahe Berichte."),
		S(85, "Staatsmedien dominieren", "Andere Sender sind vom Anzeigenmarkt abgeschnitten.")
	],
	m_versammlungsfreiheit: [
		S(10, "Verbote und harte Auflagen", "Demonstrationen werden meist untersagt."),
		S(35, "Eingeschränkt", "Genehmigungen, Sperrzonen und Auflagen."),
		S(60, "Weitgehend frei mit Anmeldung", "Anmeldung genügt, Verbote sind die Ausnahme."),
		S(85, "Volle Versammlungsfreiheit", "Kundgebungen sind frei, die Polizei schützt sie.")
	],
	m_gewerkschaftsrechte: [
		S(10, "Streikverbote", "Streiks gelten als Gefahr für die Ordnung."),
		S(35, "Eingeschränktes Streikrecht", "Streiks sind erlaubt, aber leicht verboten."),
		S(60, "Volles Streikrecht", "Tarifverhandlung und Streik sind gesichert."),
		S(85, "Starke Tarifpartner", "Mitbestimmung und branchenweite Tarifverträge.")
	],
	m_justizreform: [
		S(10, "Politisch gelenkt", "Ernennungen und Verfahren folgen der Regierung."),
		S(35, "Langsam und abhängig", "Überlastete Gerichte, Ernennungen unter Einfluss."),
		S(55, "Mehr Richter, schnellere Verfahren", "Mehr Personal, kürzere Verfahren."),
		S(80, "Unabhängige Ernennungen", "Ein Richterrat ernennt, nicht die Regierung."),
		S(95, "Volle Unabhängigkeit", "Unabhängige Justiz mit Kontrolle durch das Verfassungsgericht.")
	],
	m_antikorruption: [
		S(10, "Keine Kontrolle", "Vergaben laufen ohne Prüfung."),
		S(35, "Nur Einzelverfahren", "Korruption wird verfolgt, wenn sie auffällt."),
		S(55, "Offene Vergaben", "Große Aufträge werden öffentlich ausgeschrieben."),
		S(75, "Unabhängige Ermittler", "Vermögenserklärungen und eine eigene Behörde."),
		S(95, "Lückenlose Transparenz", "Alle Vergaben und Vermögen sind einsehbar.")
	],
	m_friedensprozess: [
		S(10, "Abbruch und Härte", "Keine Gespräche, militärische Antwort."),
		S(30, "Eingefroren", "Keine Fortschritte, keine Eskalation."),
		S(55, "Gespräche im Gang", "Vermittler arbeiten an einer Lösung."),
		S(75, "Waffenabgabe vereinbart", "Erste Schritte der Entwaffnung."),
		S(95, "Politische Lösung", "Wiedereingliederung und politische Teilhabe.")
	],
	m_grenzschutz: [
		S(10, "Offene Grenzen", "Kaum Kontrollen."),
		S(35, "Kontrollen an Übergängen", "Übergänge werden geprüft, der Rest ist offen."),
		S(60, "Mauer und Patrouillen", "Zäune, Personal und Überwachung an den Grenzen."),
		S(85, "Militarisierte Grenze", "Ausgebaute Sperranlagen mit Technik.")
	],
	m_privatisierung: [
		S(5, "Der Staat behält alles", "Keine Verkäufe."),
		S(30, "Wenige Verkäufe", "Einzelne Beteiligungen werden verkauft."),
		S(55, "Große Beteiligungen verkaufen", "Verkehr, Energie und Banken teilweise in Privathand."),
		S(80, "Breite Privatisierung", "Fast alle Staatsunternehmen gehen an den Markt.")
	],
	m_kernkraft: [
		S(10, "Kein weiterer Reaktor", "Nur, was schon gebaut wird."),
		S(50, "Das erste Kraftwerk", "Ein Kraftwerk in Betrieb, kein weiterer Ausbau."),
		S(70, "Ein zweites Kraftwerk", "Bau eines weiteren Standorts."),
		S(90, "Programm mit mehreren Standorten", "Mehrere Reaktoren und eine eigene Industrie.")
	],
	m_bauamnestie: [
		S(0, "Keine Amnestie", "Schwarzbauten werden abgerissen oder verfolgt."),
		S(15, "Kleine Einzelfälle", "Nur Härtefälle werden legalisiert."),
		S(45, "Legalisierung gegen Gebühr", "Gegen Gebühr, ohne Prüfung der Statik."),
		S(80, "Breite Amnestie", "Alle Schwarzbauten werden legalisiert.")
	],
	m_steueramnestie: [
		S(0, "Keine Amnestie", "Steuersünder werden voll belangt."),
		S(20, "Kleine Regelung", "Für kleine Rückstände."),
		S(50, "Befristete Amnestie", "Strafen entfallen, wer nachzahlt."),
		S(80, "Umfassende Amnestie", "Großzügige Regeln für Vermögen im Ausland.")
	],
	m_bauaufsicht: [
		S(10, "Nur formal", "Genehmigungen auf Papier."),
		S(40, "Stichproben", "Gelegentliche Kontrollen der Baustellen."),
		S(65, "Unabhängige Statikprüfung", "Externe Prüfer nehmen Statik und Material ab."),
		S(90, "Lückenlos mit Haftung", "Prüfer und Bauherren haften persönlich.")
	],
	m_religioese_schulen: [
		S(10, "Randfach", "Religion nur als Wahlfach."),
		S(30, "Weniger religiöse Schulen", "Der Anteil wird verringert."),
		S(55, "Wie heute", "Ein deutlicher Anteil der Schulen mit religiösem Schwerpunkt."),
		S(75, "Ausbau", "Mehr Schulen und mehr Plätze."),
		S(95, "Dominierendes Modell", "Der religiöse Schwerpunkt prägt das Schulwesen.")
	],
	m_eu_annaeherung: [
		S(5, "Abkehr", "Die Beziehungen zu Brüssel werden heruntergefahren."),
		S(35, "Distanzierte Zusammenarbeit", "Handel ja, Reformen nein."),
		S(60, "Reformen für Visafreiheit", "Gegenleistungen bei Recht und Grenzen."),
		S(85, "Beitrittsprozess", "Volle Annäherung mit umfassenden Reformen.")
	],
	m_preiskontrollen: [
		S(0, "Freie Preise", "Der Markt bestimmt."),
		S(20, "Vereinzelte Kontrollen", "Gelegentliche Prüfungen."),
		S(45, "Höchstpreise für Grundnahrung", "Für Brot, Öl und Milch."),
		S(80, "Umfassende Preisdeckel", "Viele Waren; Schwarzmärkte wachsen.")
	],
	m_mietdeckel: [
		S(0, "Keine Grenze", "Vermieter setzen die Miete frei."),
		S(30, "Milde Begrenzung", "Erhöhungen dürfen die Inflation nicht übersteigen."),
		S(55, "Deckel für Bestandsmieten", "Bestehende Mietverträge sind geschützt."),
		S(85, "Strenger Mietstopp", "Kaum Erhöhungen; der Neubau leidet.")
	],
	m_energiesubventionen: [
		S(10, "Marktpreise", "Der Staat greift nicht ein."),
		S(30, "Nur für Bedürftige", "Zuschüsse für ärmere Haushalte."),
		S(55, "Preisdeckel für alle", "Der Staat deckelt Strom und Gas."),
		S(80, "Volle Übernahme", "Der Staat trägt fast die ganze Differenz.")
	],
	m_hausarzt: [
		S(10, "Freie Arztwahl", "Patienten gehen zu jedem Arzt."),
		S(45, "Hausarzt-Pilotprojekte", "Erste Provinzen testen das System."),
		S(70, "Verbindlicher Hausarzt", "Der Hausarzt ist erste Anlaufstelle."),
		S(90, "Vollständig gesteuert", "Überweisungen nur über den Hausarzt.")
	],
	m_umweltauflagen: [
		S(5, "Kaum Auflagen", "Grenzwerte werden nicht durchgesetzt."),
		S(35, "Basisgrenzwerte", "Grenzwerte gelten, Kontrollen sind selten."),
		S(60, "EU-nahe Grenzwerte", "Strengere Werte, regelmäßige Kontrollen."),
		S(85, "Strenge Auflagen", "Hohe Anforderungen an Industrie und Verkehr.")
	],
	m_co2_preis: [
		S(0, "Kein Preis", "Emissionen kosten nichts."),
		S(10, "Symbolischer Preis", "Ein kleiner Preis ohne Lenkungswirkung."),
		S(35, "Handelssystem wie die EU", "Anschluss an den europäischen Handel."),
		S(65, "Hoher CO₂-Preis", "Spürbar für Industrie und Verkehr."),
		S(90, "Sehr hoher Preis", "Ein starker Anreiz zum Umbau.")
	],
	m_bankenaufsicht: [
		S(10, "Locker", "Kaum Vorgaben."),
		S(30, "Basisregeln", "Mindestvorgaben für Eigenkapital."),
		S(55, "Streng", "Strenge Regeln für Kredite und Eigenkapital."),
		S(80, "Sehr streng", "Hohe Eigenkapitalquoten, enge Kontrolle.")
	],
	m_gewaltschutz: [
		S(10, "Kaum Schutz", "Wenig Plätze, wenig Verfolgung."),
		S(35, "Lückenhaft", "Frauenhäuser gibt es, aber zu wenige."),
		S(60, "Frauenhäuser und Schutzanordnungen", "Schnelle Anordnungen und Plätze."),
		S(85, "Umfassend mit Polizeischulung", "Dazu geschulte Beamte und Verfahren.")
	],
	m_rueckkehr: [
		S(5, "Kein Programm", "Rückkehr ist Sache der Betroffenen."),
		S(40, "Freiwillige Anreize", "Hilfen für Rückkehrwillige."),
		S(65, "Abkommen und Programme", "Vereinbarungen mit Herkunftsregionen."),
		S(90, "Konsequente Rückführung", "Druck und Abschiebung.")
	],
	m_integration: [
		S(5, "Keine Integration", "Aufenthalt ohne Angebote."),
		S(35, "Grundangebote", "Schulplätze und Sprachkurse in Teilen des Landes."),
		S(60, "Sprachkurse und Arbeitserlaubnis", "Zugang zu Arbeit und Schule."),
		S(85, "Volle Perspektive", "Bleiberecht und Einbürgerung.")
	],
	m_richterrat: [
		S(5, "Weisungsnah", "Justizminister und Präsident bestimmen Zusammensetzung und Beförderungen."),
		S(25, "Wie heute", "Der Justizminister führt den Vorsitz; der Präsident ernennt 4, das Parlament wählt 7 der 13 Mitglieder."),
		S(50, "Teilweise Kollegenwahl", "Ein Teil der Mitglieder wird von Richtern und Staatsanwälten gewählt."),
		S(75, "Mindestens die Hälfte von Kollegen gewählt", "Die Empfehlung der Venedig-Kommission."),
		S(95, "Selbstverwaltung der Justiz", "Kollegenwahl, der Minister ohne Vorsitz und ohne Erlaubnisrecht bei Untersuchungen.")
	],
	m_notstand: [
		S(0, "Kein Sonderrecht", "Nur das reguläre Verfahren."),
		S(10, "Wie heute", "Notstandsbefugnisse ruhen; die Antiterrorgesetze gelten."),
		S(40, "Erweiterte Polizeibefugnisse per Gesetz", "Mehr Gewahrsam und Durchsuchung, weiter mit richterlicher Kontrolle."),
		S(65, "Notstandsdekrete", "Dekrete mit Gesetzeskraft für bestimmte Bereiche, vom Parlament zu bestätigen."),
		S(90, "Ausnahmezustand", "Höchstens sechs Monate, das Parlament stimmt am selben Tag zu und kann um vier Monate verlängern.")
	],
	m_urteilsumsetzung: [
		S(5, "Urteile ignorieren", "Gerichte und Behörden folgen weder Straßburg noch dem Verfassungsgericht."),
		S(30, "Wie heute", "Nur einzelne Urteile werden umgesetzt, andere bleiben liegen."),
		S(55, "Ausgewählte Fälle umsetzen", "Klare Fälle werden umgesetzt, politisch heikle noch nicht."),
		S(80, "Alle Urteile umsetzen", "Auch in Fällen mit politischem Gewicht, etwa Kavala.")
	],
	m_minderheitenrechte: [
		S(10, "Nur die im Vertrag von Lausanne genannten Gemeinden", "Rechte für Griechen, Armenier und Juden; andere Gemeinschaften ohne Anerkennung."),
		S(35, "Wie heute", "Rechte einzelner Gemeinden; viele Streitfragen um Schulen, Sprache und Eigentum bleiben offen."),
		S(60, "Rechte ausbauen", "Sprachunterricht, Rückgabe von Kirchen- und Klostereigentum, Gebetsstätten der Aleviten."),
		S(85, "Volle Gleichstellung und Sprachrechte", "Gleiche Rechte für alle Gemeinschaften, Unterricht in der Muttersprache.")
	],
	m_wehrdienst: [
		S(0, "Freiwilligenarmee", "Nur Berufs- und Zeitsoldaten."),
		S(15, "Kurzer Wehrdienst (3 Monate)", "Grundausbildung für alle, danach Reserve."),
		S(30, "Wie heute: 6 Monate mit Freikauf", "Freikauf gegen Gebühr mit einem Monat Grundausbildung."),
		S(60, "12 Monate ohne Freikauf", "Mehr Masse, weniger Ausnahmen."),
		S(90, "18 Monate Dienstpflicht", "Lange Dienstzeit für alle Wehrpflichtigen.")
	],
	m_offiziersauswahl: [
		S(10, "Loyalität entscheidet", "Beförderung folgt der Nähe zur Führung."),
		S(35, "Wie heute", "Der Oberste Militärrat unter Vorsitz des Präsidenten entscheidet im August."),
		S(65, "Leistung und Qualifikation", "Bewertungen und Prüfungen zählen, das Gremium entscheidet weiter."),
		S(90, "Unabhängiges Auswahlverfahren", "Ein Auswahlverfahren aus Leistungsdaten, ohne politischen Einfluss.")
	]
};
/** Sätze und Preise: senken oder anheben. */
const SATZ = /* @__PURE__ */ new Set([
	"m_einkommensteuer",
	"m_mwst",
	"m_koerperschaftsteuer",
	"m_kraftstoffsteuer",
	"m_immobiliensteuer",
	"m_zuzahlungen",
	"m_mindestlohn",
	"m_zoelle"
]);
const SATZ_NAMEN = [
	"Deutlich senken",
	"Senken",
	"Unverändert",
	"Anheben",
	"Deutlich anheben"
];
const MENGE_NAMEN = [
	"Stark zurückfahren",
	"Zurückfahren",
	"Wie heute",
	"Ausbauen",
	"Massiv ausbauen"
];
function skalenArt(id) {
	return REGIME[id] ? "regime" : SATZ.has(id) ? "satz" : "menge";
}
/**
* Die wählbaren Stufen einer Maßnahme. Bei Regimen sind es die benannten Zustände; bei Sätzen und Mengen fünf Schritte um den
* heutigen Stand (±20 und ±40 Punkte), soweit sie zwischen 0 und 100 liegen.
*/
function skala(id, jetzt) {
	const art = skalenArt(id);
	if (art === "regime") return {
		art,
		frage: "Welche Ausrichtung?",
		stufen: REGIME[id]
	};
	const namen = art === "satz" ? SATZ_NAMEN : MENGE_NAMEN;
	const mitte = Math.round(jetzt);
	const stufen = [];
	for (let k = -2; k <= 2; k++) {
		const w = mitte + 20 * k;
		if (w < 0 || w > 100) continue;
		stufen.push({
			w,
			name: namen[k + 2],
			text: k === 0 ? `Stufe ${w}` : `Stufe ${w} (${k > 0 ? "+" : "−"}${Math.abs(20 * k)})`
		});
	}
	return {
		art,
		frage: art === "satz" ? "Auf welchen Satz?" : "Wie viel?",
		stufen
	};
}
//#endregion
//#region game/src/sim/zusagen.ts
/** Das Gesetz, das eine Zusage verlangt: Maßnahme, Zielstufe (bei benannten Zuständen der nächste Zustand), Preis und Aussicht. */
function zusageVorhaben(w, z) {
	if (!z?.massnahme || !z.richtung) return null;
	const id = z.massnahme;
	const jetzt = stufeIn(w, id, null);
	let ziel = clamp(Math.round(jetzt + 20 * z.richtung), 0, 100);
	let jetztName;
	let zielName;
	if (skalenArt(id) === "regime") {
		const sk = skala(id, jetzt);
		const heute = sk.stufen.reduce((b, st) => Math.abs(st.w - jetzt) < Math.abs(b.w - jetzt) ? st : b, sk.stufen[0]);
		const weiter = sk.stufen.filter((st) => z.richtung > 0 ? st.w > heute.w + 3 : st.w < heute.w - 3);
		const naechster = z.richtung > 0 ? weiter[0] : weiter[weiter.length - 1];
		if (naechster) {
			ziel = naechster.w;
			jetztName = heute.name;
			zielName = naechster.name;
		}
	}
	const pr = pruefeVorhaben(w, id, ziel, null);
	return {
		id,
		name: NET.nodes[NET.index.get(id)].name,
		jetzt,
		ziel,
		jetztName,
		zielName,
		pr
	};
}
const LAND_ALIAS = {
	"EU-Kommission": "EU",
	"US-Regierung": "USA"
};
function zusageBezug(w, z) {
	const f = w.spiel?.figuren.find((x) => x.partei === z.von);
	if (f) return {
		art: "person",
		id: f.id,
		name: f.name
	};
	if (w.parliament?.seats[z.von] !== void 0) return {
		art: "fraktion",
		id: z.von,
		name: z.von
	};
	const alias = LAND_ALIAS[z.von];
	const l = LAENDER.find((x) => x.id === alias || x.name === z.von || x.dat === z.von || x.akk === z.von || z.von.includes(x.name));
	if (l) return {
		art: "land",
		id: l.id,
		name: l.name
	};
	return {
		art: "sonst",
		name: z.von
	};
}
/** Legt Start- und Zielstufe einer Zusage fest, wenn sie noch fehlen (ältere Spielstände, Zusagen ohne Merker). */
function zusagenPflege(w) {
	for (const z of w.spiel?.zusagen ?? []) {
		if (z.erfuellt || z.gebrochen || !z.massnahme || !z.richtung) continue;
		if (z.stufeStart === void 0) z.stufeStart = Math.round(stufeIn(w, z.massnahme, null));
		if (z.stufeZiel === void 0) z.stufeZiel = zusageVorhaben(w, z)?.ziel ?? clamp(z.stufeStart + 20 * z.richtung, 0, 100);
	}
}
function zusagenBilanz(w) {
	const zs = w.spiel?.zusagen ?? [];
	const gehalten = zs.filter((z) => z.erfuellt).length;
	const gebrochen = zs.filter((z) => z.gebrochen).length;
	const offen = zs.filter((z) => !z.erfuellt && !z.gebrochen).length;
	const vertroestet = zs.reduce((a, z) => a + (z.vertroestet ?? 0), 0);
	const g = clamp(60 + 8 * gehalten - 15 * gebrochen - 3 * vertroestet, 0, 100);
	return {
		gehalten,
		gebrochen,
		offen,
		vertroestet,
		glaubwuerdigkeit: g,
		wort: g >= 75 ? "verlässlich" : g >= 55 ? "ordentlich" : g >= 35 ? "angeschlagen" : "verspielt"
	};
}
/** Wer viel bricht, verliert monatlich Legitimität; wer verlässlich ist, gewinnt sie langsam. */
function glaubwuerdigkeitMonat(w) {
	const b = zusagenBilanz(w);
	if (b.gehalten + b.gebrochen === 0) return;
	if (b.glaubwuerdigkeit < 40) wirke(w, "legitimitaet", -.15);
	else if (b.glaubwuerdigkeit >= 80) wirke(w, "legitimitaet", .08);
}
/** Die Folgen einer erfüllten oder gebrochenen Zusage über die Akteure hinaus: Glaubwürdigkeit, Land, Erinnerung. Nur einmal je Zusage. */
function zusageAbschluss(w, z, art) {
	if (z.abgeschlossen !== void 0) return;
	z.abgeschlossen = w.day;
	const bezug = zusageBezug(w, z);
	if (art === "erfuellt") {
		wirke(w, "legitimitaet", .6);
		wirke(w, "vertrauen_regierung", .3);
		if (bezug.art === "land") landAendern(w, bezug.id, { vertrauen: 6 }, `Zusage gehalten: ${z.text}`);
	} else {
		wirke(w, "legitimitaet", -1.2);
		wirke(w, "vertrauen_regierung", -.6);
		if (bezug.art === "land") landAendern(w, bezug.id, {
			vertrauen: -12,
			konflikt: 4
		}, `Zusage gebrochen: ${z.text}`);
	}
	const f = bezug.art === "person" ? w.spiel?.figuren.find((x) => x.id === bezug.id) : void 0;
	if (f) merke(w, f, art === "erfuellt" ? `Zusage gehalten: ${z.text}` : `Zusage gebrochen: ${z.text}`);
}
/** Erfasst Zusagen, die andere Teile des Spiels erfüllt oder gebrochen haben, ohne die Folgen zu buchen (etwa ein beschlossenes Gesetz). */
function nachbuchen(w) {
	for (const z of w.spiel?.zusagen ?? []) if (z.abgeschlossen === void 0 && (z.erfuellt || z.gebrochen)) zusageAbschluss(w, z, z.erfuellt ? "erfuellt" : "gebrochen");
}
function zusagenMonat(w) {
	zusagenPflege(w);
	nachbuchen(w);
	glaubwuerdigkeitMonat(w);
}
const personZu = (w, z) => w.spiel?.figuren.find((x) => x.partei === z.von);
/** Löst eine Zusage ein: bringt das verlangte Gesetz ein oder gilt sie als erfüllt, wenn die Maßnahme schon dort steht. Kosten trägt das Gesetz. */
function loeseZusageEin(w, z) {
	const v = zusageVorhaben(w, z);
	const f = personZu(w, z);
	if (v) {
		if (!v.pr.ok) {
			z.erfuellt = true;
			bereitschaftAendern(w, z.von, 10);
			zusageAbschluss(w, z, "erfuellt");
			return {
				ok: true,
				text: "Die Maßnahme steht schon dort, wo die Partei sie wollte; die Zusage gilt als erfüllt."
			};
		}
		const ziel = z.stufeZiel !== void 0 && (z.stufeZiel - v.jetzt) * Math.sign(z.richtung ?? 1) > 0 ? z.stufeZiel : v.ziel;
		const r = bringeEin(w, v.id, ziel, null, "gesetz");
		if (!r.ok) {
			z.faellig = w.day + 40;
			return {
				ok: false,
				text: `Die Zusage bleibt offen, es ist nichts bezahlt: ${r.text}`
			};
		}
		z.faellig = w.day + REGELN.tageBisAbstimmung + 15;
	} else {
		z.erfuellt = true;
		bereitschaftAendern(w, z.von, 10);
		zusageAbschluss(w, z, "erfuellt");
	}
	if (f) loyalitaetVerschieben(f, 12);
	return {
		ok: true,
		text: "Die Zusage wird erfüllt."
	};
}
/** Vertröstet: drei Monate mehr, die Geduld sinkt. Der Preis in Kapital wird vom Aufrufer gebucht (Ereignis oder Oberfläche). */
function vertroesteZusage(w, z) {
	z.faellig = w.day + 90;
	z.vertroestet = (z.vertroestet ?? 0) + 1;
	const f = personZu(w, z);
	if (f) {
		loyalitaetVerschieben(f, -8);
		grollVerschieben(w, f, 4);
		merke(w, f, `Auf ${z.text} vertröstet (${z.vertroestet}. Mal)`);
	}
	vertrauenAendern(w, -.5);
	wirke(w, "legitimitaet", -.2);
	return "Die Zusage wird vertagt; die Geduld wird kürzer.";
}
/** Bricht die Zusage: Verbündete, Vertrauen und Glaubwürdigkeit leiden. */
function brecheZusage(w, z, verfall = false) {
	z.gebrochen = true;
	bereitschaftAendern(w, z.von, verfall ? -20 : -25);
	const f = personZu(w, z);
	if (f) {
		loyalitaetVerschieben(f, verfall ? -15 : -25);
		grollVerschieben(w, f, verfall ? 12 : 20);
	}
	if (!verfall) vertrauenAendern(w, -1);
	zusageAbschluss(w, z, "gebrochen");
	addLog(w, "entscheidung", `Zusage gebrochen: ${z.text}`, "Verbündete, Vertrauen und Glaubwürdigkeit leiden.");
	return verfall ? "Die Zusage verfällt unbeantwortet; das wird als Bruch gewertet." : "Die Zusage wird gebrochen.";
}
function termine(w) {
	const sp = w.spiel;
	if (!sp) return [];
	return (sp.termine ?? []).filter((t) => t > w.day - 30);
}
function termineInfo(w) {
	return {
		belegt: termine(w).length,
		max: 4
	};
}
//#endregion
//#region game/src/sim/nachfolge.ts
const zufall = (w, f, extra) => hashZahl(`${w.seed}|${f.id}|${eigenVon(w, f).seit}|${f.name}|${extra}`);
function verlasse(w, f, grund, groll) {
	const e = eigenVon(w, f);
	ehemaligeMerken(w, f, grund, groll);
	for (const x of w.spiel.figuren) if (x !== f && x.imAmt && eigenVon(w, x).lager === e.lager && AEMTER[x.amt].regierungsamt) loyalitaetVerschieben(x, -4);
	vertrauenAendern(w, -.4);
}
function marktFolgen(w, amt) {
	if (amt === "finanzen") {
		w.economy.riskPremium += 30;
		w.economy.credibility = clamp(w.economy.credibility - .03, .05, .95);
	} else if (amt === "wirtschaft") {
		w.economy.riskPremium += 10;
		w.economy.credibility = clamp(w.economy.credibility - .01, .05, .95);
	} else w.economy.credibility = clamp(w.economy.credibility - .01, .05, .95);
}
/** Der Rücktritt im Streit (nach einem Ultimatum, einer Drohung oder einem Skandal): eine kommissarische Leitung übernimmt, der Vorgänger nimmt Groll mit. */
function ausscheiden(w, f, grund) {
	if (!w.spiel || !AEMTER[f.amt].regierungsamt) return;
	const alt = `${f.rolle} ${f.name}`;
	const rng = new Rng(Math.floor(zufall(w, f, "rueck") * 2147483647));
	const benutzt = new Set(w.spiel.figuren.map((x) => x.name));
	verlasse(w, f, grund, Math.min(100, 55 + eigenVon(w, f).groll * .4));
	marktFolgen(w, f.amt);
	besetzeNeu(w, f, {
		name: neuerName(rng, benutzt, f.weiblich),
		loyalitaet: 50,
		faehigkeit: 45,
		ehrgeiz: 20,
		kommissarisch: true,
		notiz: `Kommissarisch eingesetzt nach dem Rücktritt von ${alt}`
	});
	addLog(w, "ereignis", `${alt} tritt zurück.`, `${grund}. Eine kommissarische Leitung übernimmt; die Märkte und die Presse achten auf den Nachfolger.`);
}
/** Monatlich: Wer im Streit gegangen ist, redet vielleicht. */
function ehemaligeMonat(w) {
	const sp = w.spiel;
	if (!sp?.ehemalige) return;
	for (const x of sp.ehemalige) {
		if (x.ausgepackt) continue;
		x.groll = Math.max(0, x.groll - .5);
		if (x.groll < 55 || x.ehrgeiz < 40) continue;
		const p = .035 + (x.groll - 55) / 600;
		if (hashZahl(`${w.seed}|${x.name}|${w.day}|packt`) < p) {
			x.ausgepackt = true;
			vertrauenAendern(w, -1);
			wirke(w, "legitimitaet", -.8);
			wirke(w, "polarisierung", .5);
			const titel = `${x.rolle} ${x.name} packt aus`;
			addLog(w, "ereignis", `${titel}: In Interviews und einem Buch schildert ${x.weiblich ? "die frühere" : "der frühere"} ${x.rolle.replace(/^(Der|Die) /, "")} das Innenleben der Regierung.`, "Wer im Streit geht, nimmt seine Kenntnisse mit; das Vertrauen in die Regierung sinkt.");
			sp.chronik.push({
				tag: w.day,
				datum: w.date,
				titel,
				ausgang: "Die Enthüllungen schaden dem Ansehen der Regierung: Vertrauen und Legitimität sinken."
			});
		}
	}
}
//#endregion
//#region game/src/sim/eingriffe.ts
/** Zusätzliche Staatsausgaben (+) oder Kürzungen (−) in % des BIP festlegen. */
function setFiscalImpulse(world, percentOfGdp) {
	const before = world.economy.fiscalImpulse;
	world.economy.fiscalImpulse = percentOfGdp;
	addLog(world, "entscheidung", `Haushalt: zusätzlicher Impuls von ${fmt(before)} auf ${fmt(percentOfGdp)} % des BIP geändert.`, percentOfGdp > before ? "Mehr Ausgaben stützen die Nachfrage, erhöhen aber Defizit und Schulden." : "Weniger Ausgaben dämpfen die Nachfrage und entlasten den Haushalt.");
	if (percentOfGdp !== before) addMarke(world, "haushalt", `Haushaltsimpuls ${fmt(before)} auf ${fmt(percentOfGdp)} % des BIP`);
}
//#endregion
//#region game/src/sim/akteure.ts
function waehle(rng, liste) {
	return liste[Math.floor(rng.next() * liste.length)];
}
const BANKEN = [
	"Bosporus Handelsbank",
	"Toros Kreditbank",
	"Fırat Sparkasse",
	"Ege Investmentbank",
	"Sakarya Mittelstandsbank",
	"Kapadokya Genossenschaftsbank"
];
const ZEITUNGEN = [
	"Günün Sesi",
	"Akşam Sözü",
	"Halkın Nabzı",
	"Ülke Postası",
	"Yeni Söz"
];
const KOHLEFIRMEN = [
	"Kuzey Kömür AŞ",
	"Toprak Madencilik",
	"Karakaya Kömür",
	"Batı Linyit AŞ"
];
const TEXTILFIRMEN = [
	"Ege Dokuma AŞ",
	"Denizli Tekstil",
	"Uşak Konfeksiyon",
	"Bursa İplik AŞ",
	"Marmara Giyim"
];
const CYBER_ZIELE = [
	"die Zahlungssysteme mehrerer Banken und ein Umspannwerk",
	"das Netz eines großen Stromversorgers und die Fahrkartensysteme der Bahn",
	"die Abfertigung an zwei Flughäfen und Teile des Mobilfunknetzes",
	"die Rechenzentren einer Krankenhauskette und die Steuerbehörde"
];
/** Wer jenseits der Grenze liegt, je nach Provinz (Kfz-Kennziffer). */
const GRENZ_NACHBAR = {
	31: "Syrien",
	79: "Syrien",
	27: "Syrien",
	63: "Syrien",
	47: "Syrien",
	73: "Irak",
	30: "Irak",
	65: "Iran",
	76: "Iran",
	36: "Armenien",
	75: "Georgien",
	8: "Georgien"
};
const NATO_BEWERBER = [
	{
		land: "die Ukraine",
		lage: "Mitten im Krieg um die Aufnahme zu stimmen, hieße, Russland offen zu konfrontieren.",
		russland: 1.6
	},
	{
		land: "Georgien",
		lage: "Ein Nachbar am Schwarzen Meer, mit russischen Truppen auf einem Teil seines Gebiets.",
		russland: 1.2
	},
	{
		land: "Moldau",
		lage: "Ein kleines Land mit einer abtrünnigen Region unter russischem Einfluss.",
		russland: 1
	},
	{
		land: "Bosnien und Herzegowina",
		lage: "Innenpolitisch tief gespalten; Ankara hat dort eigene Interessen und Freunde.",
		russland: .5
	}
];
//#endregion
//#region game/src/sim/ereignisse-innen.ts
const KOHLE = [
	67,
	43,
	45,
	74
];
const SCHWARZMEER = [
	53,
	61,
	8,
	28,
	52,
	55,
	57,
	67,
	74,
	37
];
const TEXTIL = [
	16,
	20,
	59,
	64,
	46
];
const AGRAR = [
	42,
	63,
	1,
	33,
	21,
	47
];
const INNEN_VORLAGEN = [
	{
		id: "mindestlohn",
		szene: "istanbul",
		frist: 25,
		abkuehlung: 300,
		chance: (w) => monatVon(w) === 12 ? .95 : 0,
		erzeuge: () => ({
			provinzen: [],
			staerke: 1
		}),
		titel: () => "Der Mindestlohn für das neue Jahr",
		text: (w) => [`Die Mindestlohnkommission legt zum Jahresende fest, was ab Januar gilt. Die Gewerkschaften verlangen einen Ausgleich für die Teuerung (Inflation ${nf$4(w.published.inflation.value)} %), die Arbeitgeber warnen vor Kosten, die kleine Betriebe nicht tragen können.`],
		warum: () => "Der Mindestlohn ist der wichtigste Preis am Arbeitsmarkt: Er schützt die Ärmsten und stützt die Nachfrage, kostet aber Betriebe Spielraum und kann die Preise treiben.",
		optionen: () => [
			opt("kraeftig", "Kräftig anheben", beschr(3, 0, "die Beschäftigten gewinnen, kleine Betriebe und die Preise stehen unter Druck."), 3, (ww) => {
				setPolicy(ww, "m_mindestlohn", Math.min(100, netz$1(ww, "m_mindestlohn") + 15));
				wirke(ww, "arbeitnehmer", 3);
				wirke(ww, "unternehmer", -3);
				wirke(ww, "kostendruck", 2);
				return "Der Mindestlohn steigt deutlich.";
			}),
			opt("mass", "Den Preisanstieg ausgleichen", beschr(1, 0, "ein Kompromiss, der beide Seiten unzufrieden lässt."), 1, (ww) => {
				setPolicy(ww, "m_mindestlohn", Math.min(100, netz$1(ww, "m_mindestlohn") + 6));
				wirke(ww, "arbeitnehmer", 1);
				return "Der Mindestlohn folgt der Inflation.";
			}),
			opt("einfrieren", "Einfrieren", beschr(0, 0, "die Betriebe atmen auf, die Streikneigung steigt."), 0, (ww) => {
				wirke(ww, "arbeitnehmer", -4);
				wirke(ww, "streikneigung", 4);
				wirke(ww, "unternehmer", 2);
				return "Der Mindestlohn bleibt, wie er ist.";
			})
		],
		standard: (w) => {
			wirke(w, "arbeitnehmer", -3);
			wirke(w, "streikneigung", 3);
			return "Ohne Entscheidung bleibt der Mindestlohn eingefroren; die Gewerkschaften sind verärgert.";
		}
	},
	{
		id: "haushaltsjahr",
		szene: "bank",
		frist: 25,
		abkuehlung: 300,
		chance: (w) => monatVon(w) === 10 && jahrVon(w) >= 2028 ? .9 : 0,
		erzeuge: () => ({
			provinzen: [],
			staerke: 1
		}),
		titel: () => "Der Haushalt für das nächste Jahr",
		text: (w) => [`${anrede(figur(w, "finanzen"))} legt den Haushaltsentwurf vor. Die Schulden liegen bei ${nf$4(w.economy.debtRatio)} % des BIP, die Inflation bei ${nf$4(w.published.inflation.value)} %. Das Parlament berät ihn bis Jahresende.`, "Jede Richtung hat Gewinner und Verlierer: Ausgaben stützen die Konjunktur, Sparen beruhigt die Märkte."],
		warum: () => "Der Haushalt ist die größte einzelne Entscheidung des Jahres: Er legt fest, wie viel der Staat der Wirtschaft zuführt oder entzieht.",
		optionen: () => [
			opt("konsolidieren", "Konsolidieren", beschr(3, 0, "Personal, Subventionen und Einkommensteuer wirken zusammen: Märkte und Finanzminister sind zufrieden, die Nachfrage lahmt."), 3, (w) => {
				wendePaketAn(w, "konsolidieren");
				wirke(w, "vertrauen_maerkte", 3);
				loyalitaetAendern(w, "finanzen", 6);
				vertrauenAendern(w, -.8);
				return "Der Haushalt setzt auf Konsolidierung.";
			}),
			opt("fortschreiben", "Fortschreiben", beschr(0, 0, "kein Signal in irgendeine Richtung."), 0, () => "Der Haushalt wird fortgeschrieben."),
			opt("investieren", "Investieren", beschr(3, 0, "der Haushalt investiert in Straßen, Wasser und Schulen: mehr Wachstum, mehr Schulden."), 3, (w) => {
				wendePaketAn(w, "investieren");
				vertrauenAendern(w, 1);
				loyalitaetAendern(w, "finanzen", -6);
				return "Der Haushalt setzt auf Investitionen.";
			})
		],
		standard: () => "Der Haushalt wird fortgeschrieben."
	},
	{
		id: "bergwerksunglueck",
		szene: "anatolien",
		frist: 6,
		abkuehlung: 500,
		chance: (w) => .008 + Math.max(0, netz$1(w, "korruption") - 45) * 7e-4,
		erzeuge: (w, rng) => {
			const p = ziehe(rng, (pl) => KOHLE.includes(pl) ? 1 : 0, 1);
			return p.length ? {
				provinzen: p,
				staerke: .6 + .4 * rng.next(),
				daten: { firma: waehle(rng, KOHLEFIRMEN) }
			} : null;
		},
		titel: (_, ev) => `Grubenunglück bei ${ev.daten?.firma}`,
		text: (_, ev) => [`Im Bergwerk der ${ev.daten?.firma} in ${namen(ev.provinzen)} ist es zu einem schweren Unglück gekommen; Rettungskräfte suchen nach Eingeschlossenen. Gewerkschaften sprechen von Warnungen, die jahrelang ignoriert wurden.`],
		warum: () => "Arbeitsschutz wird meist erst nach einem Unglück Thema. Aufsicht kostet Geld und Zeit, ihr Fehlen kostet Menschenleben und irgendwann das Vertrauen.",
		eroeffne: (w, ev) => {
			wirke(w, "streikneigung", 4 * ev.staerke);
			vertrauenAendern(w, -1.5 * ev.staerke);
		},
		optionen: (_, ev) => [
			opt("untersuchen", "Unabhängige Untersuchung und schärfere Aufsicht", beschr(4, .05, "der Bergbau wird teurer, das Vertrauen wächst."), 4, (w) => {
				kosten(w, .05);
				wirke(w, "justizvertrauen", 3);
				wirke(w, "korruption", -2);
				wirke(w, "arbeitnehmer", 2);
				wirke(w, "unternehmer", -2);
				vertrauenAendern(w, 1 * ev.staerke);
				return "Eine unabhängige Kommission untersucht das Unglück; die Aufsicht wird verschärft.";
			}),
			opt("entschaedigen", "Familien entschädigen und Nothilfe leisten", beschr(2, .05, "lindert die Not, ändert nichts an den Ursachen."), 2, (w) => {
				kosten(w, .05);
				wirke(w, "arbeitnehmer", 1);
				vertrauenAendern(w, 1.5 * ev.staerke);
				return "Die Familien der Opfer werden entschädigt.";
			}),
			opt("betreiber", "Die Verantwortung beim Betreiber suchen", beschr(1, 0, "schnell erledigt, aber die Gewerkschaften glauben es nicht."), 1, (w) => {
				wirke(w, "justizvertrauen", -3);
				wirke(w, "streikneigung", 4);
				vertrauenAendern(w, -1);
				return "Der Betreiber wird belangt; die Kritik an der Aufsicht bleibt.";
			})
		],
		standard: (w, ev) => {
			wirke(w, "streikneigung", 4);
			vertrauenAendern(w, -2 * ev.staerke);
			return "Ohne Antwort wächst der Zorn der Bergleute und ihrer Familien.";
		}
	},
	{
		id: "ueberschwemmung",
		szene: "anatolien",
		frist: 6,
		abkuehlung: 240,
		chance: (w) => monatVon(w) >= 8 && monatVon(w) <= 11 ? .07 : .004,
		erzeuge: (w, rng) => {
			const p = ziehe(rng, (pl) => SCHWARZMEER.includes(pl) ? 1 : 0, 2);
			return p.length ? {
				provinzen: p,
				staerke: .4 + .6 * rng.next()
			} : null;
		},
		titel: () => "Überschwemmungen am Schwarzen Meer",
		text: (_, ev) => [`Sturzfluten reißen in ${namen(ev.provinzen)} Brücken und Straßen mit; Dörfer sind abgeschnitten, Felder stehen unter Wasser.`],
		warum: () => "Steile Täler, Bebauung an Bachläufen und fehlender Hochwasserschutz machen aus Starkregen eine Katastrophe.",
		eroeffne: (w, ev) => {
			wirke(w, "verkehrsnetz", -6 * ev.staerke, ev.provinzen);
			wirke(w, "ernte", -4 * ev.staerke, ev.provinzen);
			wirke(w, "wasserversorgung", -3 * ev.staerke, ev.provinzen);
		},
		optionen: (_, ev) => [
			opt("hilfe", "Katastrophenhilfe und Wiederaufbau der Straßen", beschr(3, .15, "die Region kommt schneller auf die Beine."), 3, (w) => {
				kosten(w, .15);
				wirke(w, "verkehrsnetz", 5 * ev.staerke, ev.provinzen);
				wirke(w, "ernte", 2, ev.provinzen);
				vertrauenAendern(w, 1.5);
				return "Der Wiederaufbau der Straßen beginnt; Betroffene erhalten Hilfe.";
			}),
			opt("schutz", "Hochwasserschutz und Umsiedlung aus Gefahrenlagen", beschr(5, .3, "langfristig sicherer, kurzfristig teuer und unbeliebt bei den Umzuziehenden."), 5, (w) => {
				kosten(w, .3);
				wirke(w, "verkehrsnetz", 3 * ev.staerke, ev.provinzen);
				wirke(w, "landflucht", 2, ev.provinzen);
				vertrauenAendern(w, .5);
				return "Ein Hochwasserschutzprogramm wird aufgelegt; gefährdete Siedlungen werden verlegt.";
			}),
			opt("kommunen", "Den Kommunen die Aufräumarbeit überlassen", beschr(0, 0, "die Region fühlt sich allein gelassen."), 0, (w) => {
				vertrauenAendern(w, -1.5);
				return "Die Kommunen räumen auf, so gut sie können.";
			})
		],
		standard: (w, ev) => {
			wirke(w, "verkehrsnetz", -2 * ev.staerke, ev.provinzen);
			vertrauenAendern(w, -2 * ev.staerke);
			return "Die Hilfe kommt spät; die Menschen in den Tälern fühlen sich im Stich gelassen.";
		}
	},
	{
		id: "bankenstress",
		szene: "bank",
		frist: 6,
		abkuehlung: 400,
		chance: (w) => w.economy.riskPremium > 350 || netz$1(w, "vertrauen_maerkte") < 36 ? .12 : .004,
		erzeuge: (_, rng) => ({
			provinzen: [],
			staerke: 1,
			daten: { bank: waehle(rng, BANKEN) }
		}),
		titel: (_, ev) => `Die ${ev.daten?.bank} gerät ins Wanken`,
		text: (w, ev) => [`Die ${ev.daten?.bank}, eine Bank mittlerer Größe, kann ihre Refinanzierung nicht mehr sichern; Kunden heben Geld ab. Der Risikoaufschlag steht bei ${nf$4(w.economy.riskPremium, 0)} Basispunkten, die Märkte beobachten jede Reaktion.`],
		warum: () => "Banken leben von Vertrauen. Springt der Staat ein, sichert er die Ersparnisse und belohnt riskantes Wirtschaften; lässt er sie fallen, riskiert er einen Dominoeffekt.",
		eroeffne: (w) => {
			wirke(w, "kredite", -4);
			wirke(w, "vertrauen_maerkte", -3);
		},
		optionen: () => [opt("liquiditaet", "Liquidität bereitstellen", beschr(4, .4, "die Bank hält, die Kreditvergabe erholt sich, der Steuerzahler haftet."), 4, (w) => {
			kosten(w, .4);
			wirke(w, "kredite", 5);
			wirke(w, "vertrauen_maerkte", 3);
			return "Der Staat stellt der Bank Liquidität bereit.";
		}), opt("abwickeln", "Abwickeln und die Aufsicht durchgreifen lassen", beschr(3, .15, "der Markt lernt, die Kunden sind gesichert, kleine Firmen leiden."), 3, (w) => {
			kosten(w, .15);
			wirke(w, "vertrauen_maerkte", 4);
			wirke(w, "mittelstand", -2);
			wirke(w, "kredite", -2);
			return "Die Bank wird abgewickelt; die Einlagen sind gesichert.";
		})],
		standard: (w) => {
			wirke(w, "kredite", -4);
			wirke(w, "vertrauen_maerkte", -4);
			w.economy.riskPremium += 25;
			return "Ohne Entscheidung erfasst die Unruhe weitere Banken; der Risikoaufschlag steigt.";
		}
	},
	{
		id: "studentenproteste",
		szene: "istanbul",
		frist: 10,
		abkuehlung: 300,
		chance: (w) => (netz$1(w, "m_wissenschaftsfreiheit") < 45 ? .03 : .004) + (akutIn(w, "p_jugendarbeitslosigkeit").length > 0 ? .015 : 0),
		erzeuge: (w, rng) => {
			const p = ziehe(rng, (pl) => PROZ_STADT.has(pl) ? 1 : .1, 2);
			return p.length ? {
				provinzen: p,
				staerke: .5 + .5 * rng.next()
			} : null;
		},
		titel: () => "Studentinnen und Studenten gehen auf die Straße",
		text: (_, ev) => [`In ${namen(ev.provinzen)} besetzen Studierende Hörsäle und marschieren durch die Innenstädte: gegen Studiengebühren, Wohnungsnot und fehlende Aussichten auf Arbeit.`],
		warum: () => "Junge Menschen ohne Perspektive sind der verlässlichste Auslöser für Massenproteste; wie ein Staat mit ihnen umgeht, prägt sein Bild bei allen anderen.",
		eroeffne: (w, ev) => {
			wirke(w, "junge", -3 * ev.staerke);
			wirke(w, "polarisierung", 2 * ev.staerke);
		},
		optionen: (_, ev) => [opt("dialog", "Dialog und Stipendien", beschr(3, .1, "entspannt die Lage, kostet Geld."), 3, (w) => {
			kosten(w, .1);
			wirke(w, "junge", 4 * ev.staerke);
			wirke(w, "hochschule", 1);
			wirke(w, "polarisierung", -1);
			return "Der Präsident empfängt Studierendenvertreter; Stipendien werden aufgestockt.";
		}), opt("raeumen", "Hochschulen räumen lassen", beschr(2, 0, "Ruhe auf den Straßen, der Preis ist Vertrauen der Jungen und im Ausland."), 2, (w) => {
			wirke(w, "junge", -5);
			wirke(w, "pressefreiheit", -2);
			wirke(w, "polarisierung", 3);
			wirke(w, "beziehungen_eu", -2);
			loyalitaetAendern(w, "inneres", 3);
			return "Die Polizei räumt die besetzten Hörsäle.";
		})],
		standard: (w, ev) => {
			wirke(w, "junge", -3 * ev.staerke);
			wirke(w, "polarisierung", 2);
			return "Die Proteste ziehen sich hin und werden lauter.";
		}
	},
	{
		id: "pressekonflikt",
		szene: "istanbul",
		frist: 8,
		abkuehlung: 400,
		chance: (w) => netz$1(w, "pressefreiheit") < 55 ? .02 : .006,
		erzeuge: (w, rng) => ({
			provinzen: [],
			staerke: 1,
			daten: {
				blatt: waehle(rng, ZEITUNGEN),
				chef: zufallsName(w, rng)
			}
		}),
		titel: (_, ev) => `Festnahmen bei der Zeitung ${ev.daten?.blatt}`,
		text: (_, ev) => [`Bei der Zeitung ${ev.daten?.blatt} sind der Chefredakteur ${ev.daten?.chef} und mehrere Reporter nach kritischen Berichten festgenommen worden. Verbände und die EU fordern ihre Freilassung; regierungsnahe Medien sprechen von Propaganda gegen den Staat.`],
		warum: () => "Kontrolle über die Medien verschafft kurz Ruhe, kostet aber Glaubwürdigkeit im Land und Ansehen im Ausland; ein Staat, der Kritik einsperrt, bekommt dafür die schlechteren Informationen.",
		optionen: () => [
			opt("freilassen", "Die Freilassung veranlassen und die Verfahren prüfen", beschr(3, 0, "die Pressefreiheit und das Ausland danken es, die Sicherheitskräfte murren."), 3, (w) => {
				wirke(w, "pressefreiheit", 3);
				wirke(w, "ansehen", 2);
				wirke(w, "beziehungen_eu", 2);
				wirke(w, "polarisierung", -1);
				loyalitaetAendern(w, "inneres", -4, "Die Innenministerin sieht ihre Sicherheitskräfte im Stich gelassen.");
				return "Die Journalisten kommen frei; die Verfahren werden überprüft.";
			}),
			opt("justiz", "Der Justiz ihren Lauf lassen", beschr(1, 0, "kein Eingriff, aber auch kein Signal."), 1, (w) => {
				wirke(w, "ansehen", -1);
				return "Die Justiz führt die Verfahren fort.";
			}),
			opt("haerte", "Härte zeigen und die Medienaufsicht ausweiten", beschr(2, 0, "das Lager jubelt, Land und Ausland wenden sich ab."), 2, (w) => {
				wirke(w, "pressefreiheit", -5);
				wirke(w, "polarisierung", 3);
				wirke(w, "beziehungen_eu", -4);
				wirke(w, "ansehen", -3);
				wirke(w, "konservative", 2);
				loyalitaetAendern(w, "inneres", 3);
				return "Die Medienaufsicht wird ausgeweitet.";
			})
		],
		standard: (w) => {
			wirke(w, "ansehen", -1);
			wirke(w, "polarisierung", 1);
			return "Die Verfahren laufen; die Kritik hält an.";
		}
	},
	{
		id: "bauamnestie_forderung",
		szene: "parlament",
		frist: 20,
		abkuehlung: 400,
		chance: (w) => netz$1(w, "m_bauamnestie") < 40 ? .018 : 0,
		erzeuge: () => ({
			provinzen: [],
			staerke: 1
		}),
		titel: () => "Eine Bauamnestie wird gefordert",
		text: (w) => [`${anrede(figur(w, "partner")) || "Ein Bündnispartner"} drängt auf ein Bauamnestie-Gesetz: Wer ohne Genehmigung gebaut hat, zahlt eine Gebühr und wird legalisiert. Das bringt Geld und Stimmen, und es legalisiert Häuser, die kein Statiker je gesehen hat.`],
		warum: () => "Bauamnestien sind populär und einträglich. Sie sind auch der Grund, warum bei Erdbeben so viele Häuser einstürzen: Wer weiß, dass Schwarzbauten legalisiert werden, baut ohne Prüfung.",
		optionen: () => [
			opt("zustimmen", "Zustimmen", beschr(0, -.1, "Einnahmen und Zustimmung jetzt, Erdbebenrisiko später."), 0, (w) => {
				kosten(w, -.1);
				vertrauenAendern(w, 2);
				wirke(w, "steuereinnahmen", 2);
				wirke(w, "bauqualitaet", -4);
				wirke(w, "erdbebenvorsorge", -4);
				loyalitaetAendern(w, "partner", 8);
				return "Die Bauamnestie wird beschlossen.";
			}),
			opt("statik", "Nur mit Statiknachweis", beschr(3, 0, "ein Kompromiss, der die Baupolitik schützt und den Partner nur halb zufrieden stellt."), 3, (w) => {
				wirke(w, "steuereinnahmen", 1);
				wirke(w, "bauqualitaet", -1);
				loyalitaetAendern(w, "partner", 3);
				return "Eine Amnestie gilt nur für Gebäude mit bestandenem Statiknachweis.";
			}),
			opt("ablehnen", "Ablehnen", beschr(2, 0, "die Bausicherheit gewinnt, der Partner ist verärgert."), 2, (w) => {
				wirke(w, "bauqualitaet", 1);
				loyalitaetAendern(w, "partner", -8, "Der Partner hält Ihnen die abgelehnte Bauamnestie vor.");
				return "Die Bauamnestie wird abgelehnt.";
			})
		],
		standard: (w) => {
			loyalitaetAendern(w, "partner", -5);
			return "Die Forderung bleibt unbeantwortet; der Partner wird ungeduldig.";
		}
	},
	{
		id: "rentnerprotest",
		szene: "anatolien",
		frist: 10,
		abkuehlung: 300,
		chance: (w) => w.economy.inflation > 12 && netz$1(w, "rentenniveau") < 52 ? .07 : .004,
		erzeuge: () => ({
			provinzen: [],
			staerke: 1
		}),
		titel: () => "Rentner fordern Ausgleich",
		text: (w) => [`Rentnerverbände demonstrieren vor dem Parlament: Bei ${nf$4(w.published.inflation.value)} % Inflation reicht die Mindestrente nicht mehr bis zum Monatsende.`],
		warum: () => "Renten hinken der Teuerung hinterher, weil sie nur in Schritten angepasst werden. Rentner wählen zuverlässig, und ihre Not ist sichtbar.",
		optionen: () => [
			opt("erhoehen", "Die Mindestrente kräftig erhöhen", beschr(3, .3, "die Not sinkt, der Haushalt spürt es dauerhaft."), 3, (w) => {
				kosten(w, .3);
				wirke(w, "rentner", 5);
				wirke(w, "armut", -2);
				loyalitaetAendern(w, "finanzen", -3);
				return "Die Mindestrente steigt deutlich.";
			}),
			opt("einmal", "Eine Einmalzahlung leisten", beschr(2, .15, "lindert kurz, ohne den Haushalt dauerhaft zu belasten."), 2, (w) => {
				kosten(w, .15);
				wirke(w, "rentner", 3);
				return "Rentner erhalten eine Einmalzahlung.";
			}),
			opt("ablehnen", "Nichts tun", beschr(0, 0, "der Haushalt bleibt ruhig, die Rentner sind wütend."), 0, (w) => {
				wirke(w, "rentner", -4);
				return "Die Forderung wird zurückgewiesen.";
			})
		],
		standard: (w) => {
			wirke(w, "rentner", -3);
			vertrauenAendern(w, -1);
			return "Die Demonstrationen gehen weiter.";
		}
	},
	{
		id: "grippewelle",
		szene: "parlament",
		frist: 8,
		abkuehlung: 300,
		chance: (w) => {
			return [
				11,
				12,
				1,
				2,
				3
			].includes(monatVon(w)) ? .025 + (netz$1(w, "gesundheitsversorgung") < 55 ? .025 : 0) : 0;
		},
		erzeuge: (_, rng) => ({
			provinzen: [],
			staerke: .5 + .5 * rng.next()
		}),
		titel: () => "Eine schwere Grippewelle",
		text: () => ["Eine Grippewelle legt Schulen, Betriebe und Notaufnahmen lahm. In den Krankenhäusern fehlen Betten und Personal."],
		warum: () => "Wie gut ein Gesundheitssystem ist, zeigt sich in der Spitzenbelastung, nicht im Durchschnitt.",
		eroeffne: (w, ev) => {
			wirke(w, "gesundheitsversorgung", -4 * ev.staerke);
			wirke(w, "wartezeiten", 5 * ev.staerke);
			wirke(w, "produktivitaet", -1);
		},
		optionen: () => [
			opt("impfen", "Impfkampagne und Aufrufe", beschr(2, .1, "wirkt in Wochen, hilft vor allem den Schwächsten."), 2, (w) => {
				kosten(w, .1);
				wirke(w, "gesundheitsversorgung", 3);
				wirke(w, "wartezeiten", -2);
				return "Eine landesweite Impfkampagne läuft an.";
			}),
			opt("kapazitaet", "Krankenhauskapazitäten und Personal aufstocken", beschr(4, .25, "stärkt das System auch nach der Welle."), 4, (w) => {
				kosten(w, .25);
				wirke(w, "gesundheitsversorgung", 4);
				wirke(w, "wartezeiten", -4);
				wirke(w, "aerzte", 1);
				return "Zusätzliche Betten und Personal werden bereitgestellt.";
			}),
			opt("abwarten", "Auf die Selbstheilung setzen", beschr(0, 0, "die Welle läuft aus, das Vertrauen leidet."), 0, (w) => {
				vertrauenAendern(w, -1);
				return "Die Regierung setzt auf Eigenverantwortung.";
			})
		],
		standard: (w) => {
			wirke(w, "wartezeiten", 3);
			vertrauenAendern(w, -1.5);
			return "Die Krankenhäuser laufen über; die Kritik an der Regierung wächst.";
		}
	},
	{
		id: "bauernproteste",
		szene: "anatolien",
		frist: 10,
		abkuehlung: 300,
		chance: (w) => netz$1(w, "landwirte") < 42 ? .05 : .004,
		erzeuge: (w, rng) => {
			const p = ziehe(rng, (pl) => AGRAR.includes(pl) ? 1 + (100 - wertIn(w, "landwirtschaft_einkommen", [pl])) / 50 : .05, 3);
			return p.length ? {
				provinzen: p,
				staerke: .5 + .5 * rng.next()
			} : null;
		},
		titel: () => "Traktoren vor den Rathäusern",
		text: (_, ev) => [`Bäuerinnen und Bauern blockieren in ${namen(ev.provinzen)} mit ihren Traktoren die Straßen: Dünger und Diesel sind teuer, die Erzeugerpreise fallen.`],
		warum: () => "Landwirte tragen das Risiko von Wetter und Preisen. Wenn die Kosten schneller steigen als die Preise, die sie erzielen, geben sie auf und ziehen in die Städte.",
		eroeffne: (w, ev) => {
			wirke(w, "landwirte", -3 * ev.staerke);
			wirke(w, "landflucht", 2, ev.provinzen);
		},
		optionen: (_, ev) => [
			opt("subventionen", "Agrarsubventionen erhöhen", beschr(3, .2, "hilft schnell, belastet den Haushalt."), 3, (w) => {
				setPolicy(w, "m_agrarsubventionen", Math.min(100, netz$1(w, "m_agrarsubventionen") + 12));
				wirke(w, "landwirte", 4 * ev.staerke);
				return "Die Agrarsubventionen steigen.";
			}),
			opt("mindestpreise", "Mindestpreise für Getreide garantieren", beschr(2, .05, "sichert die Einkommen, verteuert die Lebensmittel."), 2, (w) => {
				kosten(w, .05);
				wirke(w, "landwirte", 4 * ev.staerke);
				wirke(w, "lebensmittelpreise", 3);
				return "Der Staat garantiert Mindestpreise für Getreide.";
			}),
			opt("gespraech", "Gespräche mit den Verbänden", beschr(1, 0, "Zeit gewonnen, nichts gelöst."), 1, (w) => {
				wirke(w, "landwirte", 1);
				return "Die Regierung lädt die Bauernverbände zu Gesprächen.";
			})
		],
		standard: (w, ev) => {
			wirke(w, "landwirte", -3 * ev.staerke);
			vertrauenAendern(w, -1);
			return "Die Blockaden halten an, bis die Ernte drängt.";
		}
	},
	{
		id: "fabrikschliessungen",
		szene: "anatolien",
		frist: 10,
		abkuehlung: 300,
		chance: (w) => netz$1(w, "kostendruck") > 58 ? .05 : .004,
		erzeuge: (w, rng) => {
			const p = ziehe(rng, (pl) => TEXTIL.includes(pl) ? 1 : .02, 2);
			return p.length ? {
				provinzen: p,
				staerke: .5 + .5 * rng.next(),
				daten: { firma: waehle(rng, TEXTILFIRMEN) }
			} : null;
		},
		titel: (_, ev) => `${ev.daten?.firma} schließt Werke`,
		text: (_, ev) => [`Die ${ev.daten?.firma} und ihre Zulieferer schließen Werke in ${namen(ev.provinzen)}: Energie, Löhne und Kredite sind zu teuer, Aufträge wandern in Länder mit niedrigeren Kosten ab.`],
		warum: () => "Industrie reagiert auf Kosten, nicht auf Reden. Wenn die Kosten schneller steigen als die Preise, die sich am Weltmarkt erzielen lassen, verschwinden Arbeitsplätze, die nicht wiederkommen.",
		eroeffne: (w, ev) => {
			wirke(w, "arbeitsplaetze_industrie", -4 * ev.staerke, ev.provinzen);
			wirke(w, "industrie", -2 * ev.staerke, ev.provinzen);
			wirke(w, "streikneigung", 2);
		},
		optionen: (_, ev) => [
			opt("kurzarbeit", "Kurzarbeitergeld", beschr(3, .15, "rettet Stellen auf Zeit."), 3, (w) => {
				kosten(w, .15);
				wirke(w, "arbeitsplaetze_industrie", 3 * ev.staerke, ev.provinzen);
				wirke(w, "arbeitnehmer", 2);
				return "Kurzarbeitergeld überbrückt die Auftragslücke.";
			}),
			opt("kredit", "Kreditgarantien für die Betriebe", beschr(3, .1, "hilft den Betrieben, nicht unbedingt den Beschäftigten."), 3, (w) => {
				kosten(w, .1);
				wirke(w, "kredite", 2);
				wirke(w, "mittelstand", 2);
				wirke(w, "arbeitsplaetze_industrie", 2 * ev.staerke, ev.provinzen);
				return "Der Staat verbürgt Kredite für betroffene Betriebe.";
			}),
			opt("umschulen", "Umschulung und neue Ansiedlungen", beschr(4, .2, "wirkt langsam, aber tragfähig."), 4, (w) => {
				kosten(w, .2);
				wirke(w, "fachkraefte", 2);
				wirke(w, "arbeitsplaetze_industrie", 1, ev.provinzen);
				return "Ein Umschulungsprogramm und Ansiedlungshilfen werden aufgelegt.";
			})
		],
		standard: (w, ev) => {
			wirke(w, "arbeitsplaetze_industrie", -3 * ev.staerke, ev.provinzen);
			wirke(w, "armut", 2, ev.provinzen);
			vertrauenAendern(w, -1);
			return "Die Entlassungen laufen weiter; in den Orten fehlt es an Alternativen.";
		}
	},
	{
		id: "buergermeister_verfahren",
		szene: "parlament",
		frist: 10,
		abkuehlung: 400,
		chance: (w) => .006 + Math.max(0, netz$1(w, "polarisierung") - 50) * 8e-4,
		erzeuge: (w, rng) => {
			const p = ziehe(rng, (pl) => PROZ_STADT.has(pl) ? 1 : 0, 1);
			if (!p.length) return null;
			const seats = Object.entries(w.parliament?.seats ?? {}).filter(([k]) => k !== w.player?.partei.kurz && !(w.spiel?.lager ?? []).includes(k)).sort((a, b) => b[1] - a[1]);
			return {
				provinzen: p,
				staerke: 1,
				daten: {
					name: zufallsName(w, rng),
					partei: seats[0]?.[0] ?? "Opposition"
				}
			};
		},
		titel: (_, ev) => `Verfahren gegen das Rathaus von ${namen(ev.provinzen)}`,
		text: (_, ev) => [`Staatsanwälte werfen dem Rathaus von ${namen(ev.provinzen)} unter ${ev.daten?.name} (${ev.daten?.partei}) Unregelmäßigkeiten bei Vergaben vor. Die Partei spricht von einem politischen Verfahren, das Innenministerium erwägt, einen Zwangsverwalter einzusetzen.`],
		warum: () => "Wo die Regierung eine Stadt nicht gewinnt, bleibt ihr die Justiz. Wer sie einsetzt, gewinnt Kontrolle und verliert Glaubwürdigkeit bei allen, die den Vorwurf für politisch halten.",
		optionen: () => [
			opt("justiz", "Die Justiz unabhängig arbeiten lassen", beschr(2, 0, "wahrt den Anschein des Rechtsstaats, kostet die Kontrolle über die Stadt."), 2, (w) => {
				wirke(w, "justizvertrauen", 2);
				wirke(w, "polarisierung", -1);
				loyalitaetAendern(w, "inneres", -2);
				return "Das Verfahren läuft ohne Eingriff der Regierung.";
			}),
			opt("verwalter", "Einen Zwangsverwalter einsetzen", beschr(3, 0, "Kontrolle über die Stadt, Streit im ganzen Land."), 3, (w) => {
				wirke(w, "polarisierung", 5);
				wirke(w, "justizvertrauen", -4);
				wirke(w, "ansehen", -3);
				wirke(w, "beziehungen_eu", -2);
				wirke(w, "staedtische_saekulare", -4);
				wirke(w, "konservative", 1);
				return "Ein Zwangsverwalter übernimmt die Geschäfte der Stadt.";
			}),
			opt("dialog", "Das Gespräch mit der Stadtspitze suchen", beschr(2, 0, "entspannt die Lage, ohne den Vorwurf auszuräumen."), 2, (w) => {
				wirke(w, "polarisierung", -2);
				vertrauenAendern(w, 1);
				wirke(w, "konservative", -1);
				return "Der Präsident lädt die Stadtspitze zu einem Gespräch.";
			})
		],
		standard: (w) => {
			wirke(w, "polarisierung", 2);
			return "Die Lage in der Stadt bleibt gespannt; das Verfahren zieht sich.";
		}
	},
	{
		id: "tourismusrekord",
		szene: "anatolien",
		frist: 12,
		abkuehlung: 300,
		chance: (w) => sommer(w) && netz$1(w, "tourismus") >= 50 ? .05 : 0,
		erzeuge: () => ({
			provinzen: [],
			staerke: 1
		}),
		titel: () => "Eine Rekordsaison",
		text: () => ["Die Hotels an der Küste sind voll, die Flughäfen melden Höchstwerte. Die Branche fragt, was der Staat mit dem Rückenwind anfängt."],
		warum: () => "Gute Jahre sind die Zeit, in der man Infrastruktur baut, nicht nur feiert: Die Saison von heute entscheidet über die von übermorgen.",
		optionen: () => [
			opt("ausbauen", "In Küsteninfrastruktur investieren", beschr(3, .2, "sichert die Zukunft der Saison."), 3, (w) => {
				kosten(w, .2);
				wirke(w, "tourismus", 3);
				wirke(w, "verkehrsnetz", 2);
				return "Flughäfen, Straßen und Kläranlagen an der Küste werden ausgebaut.";
			}),
			opt("abgabe", "Eine Abgabe auf Übernachtungen erheben", beschr(1, -.15, "bringt Geld, dämpft die Nachfrage ein wenig."), 1, (w) => {
				kosten(w, -.15);
				wirke(w, "steuereinnahmen", 1);
				wirke(w, "tourismus", -1);
				return "Übernachtungen werden mit einer Abgabe belegt.";
			}),
			opt("geniessen", "Den Erfolg genießen", beschr(0, 0, "ein guter Sommer und sonst nichts."), 0, (w) => {
				vertrauenAendern(w, .5);
				return "Die Regierung feiert die Saison.";
			})
		],
		standard: () => "Die Saison endet, ohne dass der Staat etwas daraus macht."
	},
	{
		id: "kanal_istanbul",
		szene: "istanbul",
		frist: 30,
		abkuehlung: 3e3,
		chance: (w) => w.day > 200 ? .012 : 0,
		erzeuge: () => ({
			provinzen: [34],
			staerke: 1
		}),
		titel: () => "Der Kanal Istanbul",
		text: () => ["Ein Großprojekt liegt bereit: ein zweiter Wasserweg neben dem Bosporus. Bauindustrie und Regierungsnahe drängen auf den Baubeginn; Umweltverbände, Wasserwerke und die Opposition warnen vor Kosten und Folgen für Trinkwasser und Meer."],
		warum: () => "Großprojekte binden Geld, Kapital und Aufmerksamkeit über Jahre. Sie versprechen Wachstum, und manche halten es, andere hinterlassen vor allem Schulden.",
		optionen: () => [
			opt("bauen", "Bauen", beschr(6, 1, "Aufträge und Schlagzeilen, dazu Schulden und Umweltrisiken."), 6, (w) => {
				kosten(w, 1);
				wirke(w, "bauwirtschaft", 6, [34]);
				wirke(w, "klimaschutz", -3);
				wirke(w, "vertrauen_maerkte", -2);
				wirke(w, "konservative", 2);
				wirke(w, "staedtische_saekulare", -3);
				return "Der Bau des Kanals wird beschlossen.";
			}),
			opt("nahverkehr", "Stattdessen Metro und Nahverkehr ausbauen", beschr(3, .3, "spürbar im Alltag, weniger eindrucksvoll auf Fotos."), 3, (w) => {
				kosten(w, .3);
				wirke(w, "stau", -4, [34]);
				wirke(w, "bauwirtschaft", 2, [34]);
				wirke(w, "staedtische_saekulare", 2);
				return "Die Regierung setzt auf Metro und Nahverkehr statt auf einen Kanal.";
			}),
			opt("verschieben", "Verschieben", beschr(0, 0, "die Bauindustrie ist enttäuscht, das Geld bleibt im Haushalt."), 0, (w) => {
				wirke(w, "bauwirtschaft", -1);
				return "Das Projekt wird zurückgestellt.";
			})
		],
		standard: () => "Das Projekt bleibt liegen."
	},
	{
		id: "kommunalwahl",
		szene: "wahlnacht",
		frist: 25,
		abkuehlung: 3e3,
		chance: (w) => jahrVon(w) === 2029 && monatVon(w) === 3 ? 1 : 0,
		erzeuge: () => ({
			provinzen: [],
			staerke: 1
		}),
		titel: () => "Kommunalwahlen",
		text: (w) => [`Im ganzen Land werden Bürgermeister und Gemeinderäte gewählt. Es ist der erste Stimmungstest seit Ihrem Amtsantritt; Ihre Zustimmung liegt bei ${nf$4(w.spiel?.umfrage.zustimmung ?? 0, 0)} %.`],
		warum: () => "Kommunalwahlen zeigen, ob die Menschen dem Präsidenten zutrauen, ihre Stadt zu verwalten, und sie sind die Generalprobe für die nächste Präsidentschaftswahl.",
		optionen: (w) => {
			const ergebnis = (ww) => {
				const z = ww.spiel.umfrage.zustimmung;
				if (z >= 52) {
					vertrauenAendern(ww, 2);
					return "Das Lager gewinnt viele Rathäuser; der Rückenwind trägt.";
				}
				if (z <= 42) {
					vertrauenAendern(ww, -2);
					return "Das Lager verliert Städte; die Opposition feiert.";
				}
				return "Das Ergebnis ist gemischt: Gewinne auf dem Land, Verluste in den Städten.";
			};
			return [
				opt("reisen", "Selbst durchs Land reisen", beschr(4, 0, "bringt Stimmen und Schlagzeilen, mobilisiert auch die Gegner."), 4, (ww) => {
					vertrauenAendern(ww, 2);
					wirke(ww, "polarisierung", 2);
					return `Der Präsident führt Wahlkampf. ${ergebnis(ww)}`;
				}),
				opt("projekte", "Lokale Projekte vorziehen", beschr(3, .1, "Straßen und Schulen vor dem Wahltag."), 3, (ww) => {
					kosten(ww, .1);
					wirke(ww, "verkehrsnetz", 2);
					vertrauenAendern(ww, 1.5);
					return `Projekte in den Provinzen werden vorgezogen. ${ergebnis(ww)}`;
				}),
				opt("sachlich", "Sachlich bleiben", beschr(0, 0, "keine Hilfe, kein Schaden."), 0, (ww) => `Der Präsident hält sich im Wahlkampf zurück. ${ergebnis(ww)}`)
			];
		},
		standard: (w) => {
			const z = w.spiel.umfrage.zustimmung;
			return z >= 52 ? "Das Lager gewinnt viele Rathäuser." : z <= 42 ? "Das Lager verliert Städte." : "Das Ergebnis ist gemischt.";
		}
	}
];
//#endregion
//#region game/src/sim/ereignisse-laender.ts
const AB_TAG = 200;
const ANREDE = {
	USA: "Die US-Regierung",
	EU: "Die EU-Kommission",
	RUS: "Moskau",
	CHN: "Peking",
	AZE: "Baku",
	SAU: "Riad und die Golfstaaten",
	GRC: "Athen",
	IRN: "Teheran",
	SYR: "Damaskus",
	IRQ: "Bagdad",
	ARM: "Eriwan",
	ISR: "Jerusalem",
	UKR: "Kiew",
	GEO: "Tiflis",
	EGY: "Kairo",
	LBY: "Tripolis",
	KAZ: "Astana",
	CYP: "Nikosia"
};
/** Länder mit einem unerfüllten Anliegen, das sich ändern ließe, und mit wenig Geduld. */
function ungeduldig(w) {
	let beste = null;
	for (const l of LAENDER) {
		const z = weltZustand(w)[l.id];
		if (w.day - (z.zuletzt.gipfel ?? -1e9) < 150) continue;
		if (w.day - (w.spiel?.zuletzt[`land_fordert#${l.id}`] ?? -1e9) < 270) continue;
		for (const s of anliegenStand(w, l.id)) {
			if (s.erfuellt) continue;
			const b = s.anliegen.bedingung;
			if (b.art !== "massnahme" && b.art !== "massnahme-max") continue;
			const wert = (100 - vertrauenZu(w, l.id)) * .4 + z.konflikt * .3 + (l.gruppe === "Große Mächte" ? 12 : 0);
			if (!beste || wert > beste.wert) beste = {
				id: l.id,
				anliegen: s.anliegen.id,
				text: `${s.anliegen.titel}: ${s.anliegen.text}`,
				wert
			};
		}
	}
	return beste;
}
const LAND_FORDERT = {
	id: "land_fordert",
	szene: "parlament",
	frist: 25,
	abkuehlung: 240,
	chance: (w) => w.day > AB_TAG && ungeduldig(w) ? .035 : 0,
	eroeffne: (w, ev) => {
		if (w.spiel) w.spiel.zuletzt[`land_fordert#${String(ev.daten?.land)}`] = w.day;
	},
	erzeuge: (w) => {
		const u = ungeduldig(w);
		return u ? {
			provinzen: [],
			staerke: 1,
			daten: {
				land: u.id,
				anliegen: u.anliegen,
				text: u.text
			}
		} : null;
	},
	titel: (_, ev) => `${ANREDE[String(ev.daten?.land)] ?? land(String(ev.daten?.land)).name} verliert die Geduld`,
	text: (w, ev) => {
		const l = land(String(ev.daten?.land));
		return [`${ANREDE[l.id] ?? l.name} lässt ausrichten, dass die Geduld schwindet: ${ev.daten?.text}`, `Das Verhältnis steht bei Vertrauen ${Math.round(vertrauenZu(w, l.id))} und Konflikt ${Math.round(weltZustand(w)[l.id].konflikt)}. Eine Antwort wird erwartet.`];
	},
	warum: () => "Andere Staaten haben eigene Interessen. Wer sie ignoriert, zahlt später: an Vertrauen, an Märkten, an Sicherheit.",
	massnahmen: [],
	optionen: (w, ev) => {
		const l = land(String(ev.daten?.land));
		const a = l.anliegen.find((x) => x.id === String(ev.daten?.anliegen));
		const m = a && "id" in a.bedingung ? a.bedingung : null;
		return [
			opt("gespraech", "Ein Gespräch anbieten", beschr(2, 0, "kauft Zeit, ohne etwas zu ändern."), 2, (ww) => {
				landAendern(ww, l.id, { vertrauen: 4 }, "Gesprächsangebot nach einer Forderung");
				return `${ANREDE[l.id] ?? l.name} nimmt das Gesprächsangebot an, wartet aber weiter auf Taten.`;
			}),
			opt("zusagen", "Eine Zusage machen", beschr(3, 0, `${ANREDE[l.id] ?? l.name} bekommt ein Versprechen, das in acht Monaten eingefordert wird.`), 3, (ww) => {
				landAendern(ww, l.id, { vertrauen: 6 }, "Zusage nach einer Forderung");
				if (m) zusageAnlegen(ww, {
					von: ANREDE[l.id] ?? l.name,
					text: `${ANREDE[l.id] ?? l.name} wurde zugesagt: ${a.titel}`,
					tage: 240,
					massnahme: m.id
				});
				return `Die Regierung sagt ${ANREDE[l.id] ?? l.name} zu, ${a?.titel ?? "das Anliegen"} anzugehen.`;
			}),
			opt("zurueckweisen", "Zurückweisen", beschr(0, 0, "Beifall zu Hause, Ärger im Ausland."), 0, (ww) => {
				landAendern(ww, l.id, {
					vertrauen: -8,
					konflikt: 5
				}, "Forderung zurückgewiesen");
				wirke(ww, "konservative", 1);
				vertrauenAendern(ww, .5);
				return `Die Regierung weist die Forderung von ${ANREDE[l.id] ?? l.name} zurück.`;
			})
		];
	},
	standard: (w, ev) => {
		const l = land(String(ev.daten?.land));
		landAendern(w, l.id, { vertrauen: -5 }, "Forderung unbeantwortet");
		return `${ANREDE[l.id] ?? l.name} wertet das Schweigen als Antwort.`;
	}
};
/** Länder mit viel Vertrauen schlagen von sich aus ein Paket vor: etwas für die Türkei gegen etwas von der Türkei. */
function angebot(w) {
	const kandidaten = LAENDER.filter((l) => vertrauenZu(w, l.id) >= 55 && weltZustand(w)[l.id].konflikt < 60 && sperreRest(w, l.id) === 0 && (w.spiel?.zuletzt[`land_angebot#${l.id}`] ?? -1e9) < w.day - 300).map((l) => ({
		id: l.id,
		paket: vorschlagVomPartner(w, l.id)
	})).filter((x) => x.paket !== null);
	return kandidaten.length ? kandidaten[Math.floor(w.day / 30 % kandidaten.length)] : null;
}
const labelVon = (w, landId, id) => klauselSicht(w, landId, id)?.label ?? id;
const paketText = (w, a) => {
	const teile = [];
	if (a.gibt.length) teile.push(`Die Türkei bietet: ${a.gibt.map((id) => `„${labelVon(w, a.land, id)}“`).join(", ")}`);
	if (a.will.length) teile.push(`Die Türkei erhält: ${a.will.map((id) => `„${labelVon(w, a.land, id)}“`).join(", ")}`);
	return `${teile.join(". ")}. Laufzeit ${a.jahre} Jahre.`;
};
const paketPreis = (a) => [...a.gibt, ...a.will].reduce((s, id) => s + (KLAUSEL_NACH_ID[id]?.pk ?? 0), 0);
const LAND_ANGEBOT = {
	id: "land_angebot",
	szene: "bank",
	frist: 30,
	abkuehlung: 300,
	chance: (w) => w.day > AB_TAG && angebot(w) ? .04 : 0,
	eroeffne: (w, ev) => {
		if (w.spiel) w.spiel.zuletzt[`land_angebot#${String(ev.daten?.land)}`] = w.day;
	},
	erzeuge: (w) => {
		const a = angebot(w);
		return a ? {
			provinzen: [],
			staerke: 1,
			daten: {
				land: a.id,
				gibt: a.paket.gibt.join(","),
				will: a.paket.will.join(",")
			}
		} : null;
	},
	titel: (_, ev) => `${ANREDE[String(ev.daten?.land)] ?? land(String(ev.daten?.land)).name} schlägt einen Vertrag vor`,
	text: (w, ev) => {
		const l = land(String(ev.daten?.land));
		const a = paketAus(ev);
		return [`${ANREDE[l.id] ?? l.name} legt ein Paket auf den Tisch. ${paketText(w, a)}`, `Das Verhältnis ist gut (Vertrauen ${Math.round(vertrauenZu(w, l.id))}); es ist die Zeit, daraus etwas zu machen. Was das Paket bei uns bewirkt, zeigen die Antworten.`];
	},
	warum: () => "Vertrauen ist Kapital, das man nur einlösen kann, wenn ein Angebot kommt. Wer es nie einlöst, hat es umsonst aufgebaut. Ein Vertrag bindet aber beide Seiten und wird jedes Jahr geprüft.",
	massnahmen: [],
	optionen: (w, ev) => {
		const l = land(String(ev.daten?.land));
		const a = paketAus(ev);
		const kurz = {
			...a,
			jahre: 2
		};
		const zeilen = [...a.gibt, ...a.will].flatMap((id) => KLAUSEL_NACH_ID[id] ? heimWirkung(KLAUSEL_NACH_ID[id]).dauer.slice(0, 2).map((z) => z.text) : []).slice(0, 4).join("; ");
		const preis = paketPreis(a);
		return [
			opt("annehmen", "Annehmen: fünf Jahre", beschr(preis, 0, zeilen ? `bei uns: ${zeilen}; ein Vertrag bindet und wird jedes Jahr geprüft.` : "ein Vertrag bindet und wird jedes Jahr geprüft."), preis, (ww) => {
				const pruef = pruefeAngebot(ww, a);
				if (pruef) return `Das Paket ist nicht mehr möglich: ${pruef}`;
				schliesse(ww, a);
				return `Die Türkei und ${l.name} schließen den Vertrag: ${paketText(ww, a)}`;
			}),
			opt("kurz", "Kürzer binden: zwei Jahre", beschr(Math.ceil(preis * .6), 0, "schwächere Dauerwirkung, dafür weniger Bindung."), Math.ceil(preis * .6), (ww) => {
				const pruef = pruefeAngebot(ww, kurz);
				if (pruef) return `Das Paket ist nicht mehr möglich: ${pruef}`;
				schliesse(ww, kurz);
				return `Die Türkei und ${l.name} schließen einen Vertrag auf zwei Jahre.`;
			}),
			opt("ablehnen", "Ablehnen", beschr(0, 0, "wahrt die Unabhängigkeit, kostet Wärme."), 0, (ww) => {
				landAendern(ww, l.id, { vertrauen: -3 }, "Vertragsvorschlag abgelehnt");
				return `Die Türkei lehnt den Vorschlag von ${ANREDE[l.id] ?? l.name} höflich ab.`;
			})
		];
	},
	standard: (w, ev) => {
		landAendern(w, String(ev.daten?.land), { vertrauen: -2 }, "Vertragsvorschlag verfallen");
		return "Der Vorschlag verfällt ungenutzt.";
	}
};
function paketAus(ev) {
	const liste = (x) => String(x ?? "").split(",").filter(Boolean);
	return {
		land: String(ev.daten?.land),
		gibt: liste(ev.daten?.gibt),
		will: liste(ev.daten?.will),
		jahre: 5
	};
}
/** Ein Vertrag, der bald ausläuft und noch nichts angesprochen hat. */
function ablaufend(w) {
	for (const l of LAENDER) for (const v of laufende(w, l.id)) if (v.ablauf - w.day <= 150 && v.ablauf - w.day > 20 && (w.spiel?.zuletzt[`vertrag_verlaengerung#${v.id}`] ?? -1e9) < 0) return {
		id: v.id,
		land: l.id
	};
	return null;
}
const VERTRAG_VERLAENGERUNG = {
	id: "vertrag_verlaengerung",
	szene: "bank",
	frist: 40,
	abkuehlung: 60,
	chance: (w) => ablaufend(w) ? .6 : 0,
	eroeffne: (w, ev) => {
		if (w.spiel) w.spiel.zuletzt[`vertrag_verlaengerung#${String(ev.daten?.vertrag)}`] = w.day;
	},
	erzeuge: (w) => {
		const a = ablaufend(w);
		return a ? {
			provinzen: [],
			staerke: 1,
			daten: {
				land: a.land,
				vertrag: a.id
			}
		} : null;
	},
	titel: (_, ev) => `Der Vertrag mit ${land(String(ev.daten?.land)).dat} läuft aus`,
	text: (w, ev) => {
		const l = land(String(ev.daten?.land));
		const v = laufende(w, l.id).find((x) => x.id === String(ev.daten?.vertrag));
		return [`Der Vertrag mit ${l.dat} (${v ? vertragsName(w, v) : "Vertrag"}) endet in etwa fünf Monaten. ${v && v.verstoesse === 0 ? "Er wurde bisher gehalten; das zählt für eine Verlängerung." : "Es gab Verstöße, eine Verlängerung ist unwahrscheinlich."}`, `Das Vertrauen zu ${l.dat} liegt bei ${Math.round(vertrauenZu(w, l.id))}.`];
	},
	warum: () => "Verträge, die auslaufen, hören nicht auf zu wirken, weil man sie vergisst: Die Dauerwirkungen enden, und das Land fragt sich, ob man es ernst gemeint hat.",
	massnahmen: [],
	optionen: (w, ev) => {
		const l = land(String(ev.daten?.land));
		const id = String(ev.daten?.vertrag);
		return [
			opt("verlaengern5", "Um fünf Jahre verlängern", beschr(VERLAENGERUNG_PK[5], 0, "die Dauerwirkungen laufen weiter, die Bindung auch."), VERLAENGERUNG_PK[5], (ww) => verlaengere(ww, l.id, id, 5, false).text),
			opt("verlaengern2", "Um zwei Jahre verlängern", beschr(VERLAENGERUNG_PK[2], 0, "kürzere Bindung, die Wirkungen laufen weiter."), VERLAENGERUNG_PK[2], (ww) => verlaengere(ww, l.id, id, 2, false).text),
			opt("auslaufen", "Auslaufen lassen", beschr(0, 0, "die Wirkungen enden mit dem Vertrag."), 0, () => `Der Vertrag mit ${l.dat} läuft aus.`)
		];
	},
	standard: (w, ev) => `Der Vertrag mit ${land(String(ev.daten?.land)).dat} läuft ohne Verlängerung aus.`
};
/** Streit sucht den Präsidenten: Länder mit hohem Konflikt provozieren. */
function schwelend(w) {
	const k = LAENDER.filter((l) => weltZustand(w)[l.id].konflikt >= 65).sort((a, b) => weltZustand(w)[b.id].konflikt - weltZustand(w)[a.id].konflikt);
	return k.length ? { id: k[0].id } : null;
}
const LAENDER_VORLAGEN = [
	LAND_FORDERT,
	LAND_ANGEBOT,
	{
		id: "land_provokation",
		szene: "anatolien",
		frist: 12,
		abkuehlung: 240,
		chance: (w) => w.day > AB_TAG && schwelend(w) ? .035 : 0,
		erzeuge: (w) => {
			const a = schwelend(w);
			return a ? {
				provinzen: [],
				staerke: 1,
				daten: { land: a.id }
			} : null;
		},
		titel: (_, ev) => `Streit mit ${land(String(ev.daten?.land)).dat} flammt auf`,
		text: (w, ev) => {
			const l = land(String(ev.daten?.land));
			return [`Der Dauerstreit mit ${l.dat} verschärft sich: Erklärungen, Manöver, Vorwürfe. Der Konflikt liegt bei ${Math.round(weltZustand(w)[l.id].konflikt)} von 100.`, `${l.text.split(";")[0]}.`];
		},
		warum: () => "Schwelende Konflikte lösen sich nicht von selbst. Jede Seite braucht einen Weg heraus, der nicht wie Niederlage aussieht.",
		massnahmen: [],
		optionen: (_, ev) => {
			const l = land(String(ev.daten?.land));
			return [
				opt("deeskalieren", "Deeskalieren und einen Kanal öffnen", beschr(3, 0, "senkt die Spannung, Nationalisten murren."), 3, (ww) => {
					landAendern(ww, l.id, {
						konflikt: -10,
						vertrauen: 3
					}, "Deeskalation");
					wirke(ww, "konservative", -1);
					loyalitaetAendern(ww, "aussen", 4);
					return `Ein diplomatischer Kanal mit ${l.dat} wird geöffnet; die Lage beruhigt sich.`;
				}),
				opt("standhalten", "Standhalten", beschr(1, 0, "Härte zeigen, ohne zu eskalieren."), 1, (ww) => {
					landAendern(ww, l.id, { konflikt: 2 }, "Standhaft geblieben");
					vertrauenAendern(ww, .5);
					return `Die Regierung bleibt fest und antwortet auf die Erklärungen aus ${l.name} mit einer eigenen.`;
				}),
				opt("eskalieren", "Mit einem Manöver antworten", beschr(3, .1, "starker Auftritt, höhere Spannung und Kosten."), 3, (ww) => {
					kosten(ww, .1);
					landAendern(ww, l.id, {
						konflikt: 10,
						vertrauen: -6
					}, "Manöver als Antwort");
					vertrauenAendern(ww, 1.5);
					wirke(ww, "militaer", 1);
					return `Ein Manöver der Streitkräfte antwortet auf ${l.akk}; die Spannung steigt.`;
				})
			];
		},
		standard: (w, ev) => {
			landAendern(w, String(ev.daten?.land), { konflikt: 4 }, "Provokation unbeantwortet");
			return "Ohne Antwort verschärft sich der Ton.";
		}
	},
	VERTRAG_VERLAENGERUNG
];
//#endregion
//#region game/src/sim/ereignisse-aussen.ts
const GRENZE = [
	31,
	79,
	27,
	63,
	47,
	73,
	30,
	65,
	76,
	36,
	75,
	8
];
const AUSSEN_VORLAGEN = [
	{
		id: "grenzzwischenfall",
		szene: "anatolien",
		frist: 5,
		abkuehlung: 300,
		chance: (w) => netz$1(w, "terrorgefahr") > 55 ? .04 : .012,
		erzeuge: (w, rng) => {
			const p = ziehe(rng, (pl) => GRENZE.includes(pl) ? 1 : 0, 1);
			return p.length ? {
				provinzen: p,
				staerke: .5 + .5 * rng.next()
			} : null;
		},
		titel: (_, ev) => `Zwischenfall an der Grenze zu ${GRENZ_NACHBAR[ev.provinzen[0] ?? 0] ?? "einem Nachbarn"}`,
		text: (_, ev) => {
			const nachbar = GRENZ_NACHBAR[ev.provinzen[0] ?? 0] ?? "dem Nachbarland";
			return [`An der Grenze zu ${nachbar} bei ${namen(ev.provinzen)} fallen Schüsse; Grenzsoldaten melden Verletzte. Wer zuerst geschossen hat, ist unklar: ${nachbar} und die türkische Seite geben sich gegenseitig die Schuld.`];
		},
		warum: () => "Grenzzwischenfälle entscheiden sich an der Frage, ob man eine Lage beruhigt oder ausnutzt. Jede Reaktion ist auch ein Signal an die Nachbarn und an die Wähler.",
		eroeffne: (w, ev) => {
			wirke(w, "terrorgefahr", 4 * ev.staerke, ev.provinzen);
			wirke(w, "vertrauen_regierung", -.5);
		},
		optionen: (_, ev) => [
			opt("diplomatie", "Protest und Vermittlung", beschr(2, 0, "beruhigt die Lage, wirkt auf Hardliner schwach."), 2, (w) => {
				wirke(w, "beziehungen_nahost", 2);
				wirke(w, "terrorgefahr", -1, ev.provinzen);
				loyalitaetAendern(w, "aussen", 4);
				return "Die Regierung protestiert diplomatisch und bietet Vermittlung an.";
			}),
			opt("verstaerken", "Grenztruppen verstärken", beschr(3, .1, "erhöht die Sicherheit, kostet Geld."), 3, (w) => {
				kosten(w, .1);
				wirke(w, "terrorgefahr", -3 * ev.staerke, ev.provinzen);
				wirke(w, "militaer", 2);
				loyalitaetAendern(w, "inneres", 3);
				return "Zusätzliche Truppen sichern die Grenze.";
			}),
			opt("vergeltung", "Mit einem Gegenschlag antworten", beschr(4, .15, "ein starker Auftritt, der Spannungen und Risiken erhöht."), 4, (w) => {
				kosten(w, .15);
				vertrauenAendern(w, 2);
				wirke(w, "ansehen", -3);
				wirke(w, "beziehungen_nahost", -5);
				wirke(w, "terrorgefahr", 2, ev.provinzen);
				return "Die Armee antwortet mit einem begrenzten Gegenschlag.";
			})
		],
		standard: (w, ev) => {
			wirke(w, "terrorgefahr", 2 * ev.staerke, ev.provinzen);
			vertrauenAendern(w, -1);
			return "Ohne klare Reaktion wächst die Unruhe in den Grenzorten.";
		}
	},
	{
		id: "eu_angebot",
		szene: "parlament",
		frist: 20,
		abkuehlung: 600,
		chance: (w) => netz$1(w, "beziehungen_eu") >= 45 ? .04 : .005,
		erzeuge: () => ({
			provinzen: [],
			staerke: 1
		}),
		titel: () => "Brüssel bietet Gespräche an",
		text: () => ["Die EU-Kommission bietet an, die Zollunion zu modernisieren und Visaerleichterungen zu verhandeln, wenn die Türkei Zusagen zu Rechtsstaat und Justiz macht. Die Wirtschaft drängt, die Nationalisten warnen vor Bevormundung."],
		warum: () => "Europa ist der wichtigste Absatzmarkt und Kapitalgeber der Türkei, und es verlangt dafür Gegenleistungen bei Rechtsstaat und Justiz.",
		optionen: () => [
			opt("verhandeln", "Verhandlungen aufnehmen und eine Justizreform zusagen", beschr(4, 0, "Export und Kapital gewinnen, Sie schulden Brüssel eine Reform."), 4, (w) => {
				wirke(w, "beziehungen_eu", 6);
				wirke(w, "export", 3);
				wirke(w, "auslandskapital", 3);
				wirke(w, "konservative", -1);
				zusageAnlegen(w, {
					von: "EU-Kommission",
					text: "Der EU wurde eine Justizreform zugesagt",
					tage: 240,
					massnahme: "m_justizreform"
				});
				return "Die Türkei nimmt die Gespräche auf und sagt eine Justizreform zu.";
			}),
			opt("teilweise", "Nur über den Handel sprechen", beschr(2, 0, "ein Anfang, ohne Zusagen zum Rechtsstaat."), 2, (w) => {
				wirke(w, "beziehungen_eu", 2);
				wirke(w, "export", 1);
				return "Beide Seiten sprechen zunächst nur über den Handel.";
			}),
			opt("ablehnen", "Ablehnen", beschr(0, 0, "das nationale Lager applaudiert, die Wirtschaft ist enttäuscht."), 0, (w) => {
				wirke(w, "beziehungen_eu", -3);
				wirke(w, "konservative", 2);
				wirke(w, "unternehmer", -1);
				return "Das Angebot wird abgelehnt.";
			})
		],
		standard: (w) => {
			wirke(w, "beziehungen_eu", -1);
			return "Das Angebot bleibt unbeantwortet und verfällt.";
		}
	},
	{
		id: "iwf_angebot",
		szene: "bank",
		frist: 12,
		abkuehlung: 500,
		chance: (w) => w.economy.riskPremium > 400 ? .2 : 0,
		erzeuge: () => ({
			provinzen: [],
			staerke: 1
		}),
		titel: () => "Der IWF bietet ein Programm an",
		text: (w) => [`Bei ${nf$4(w.economy.riskPremium, 0)} Basispunkten Risikoaufschlag und ${nf$4(w.economy.usdTry)} Lira je Dollar bietet der Internationale Währungsfonds ein Kreditprogramm an. ${anrede(figur(w, "finanzen"))} wägt ab.`, "Der Preis wären Auflagen: Sparen, Reformen und Aufsicht durch Prüfer."],
		warum: () => "Ein IWF-Programm bringt Geld und Vertrauen der Märkte und kostet politische Freiheit: Die Auflagen treffen meist die, die am wenigsten haben.",
		optionen: () => [
			opt("annehmen", "Das Programm annehmen", beschr(5, 0, "die Märkte beruhigen sich, die Auflagen kosten Zustimmung."), 5, (w) => {
				w.economy.riskPremium = Math.max(150, w.economy.riskPremium - 60);
				w.economy.credibility = clamp(w.economy.credibility + .05, .05, .95);
				setFiscalImpulse(w, Math.min(w.economy.fiscalImpulse, -1));
				wirke(w, "vertrauen_maerkte", 8);
				wirke(w, "realeinkommen", -3);
				wirke(w, "arbeitnehmer", -3);
				wirke(w, "junge", -2);
				return "Die Regierung nimmt das Programm an und verspricht Haushaltsdisziplin.";
			}),
			opt("golf", "Kredite aus dem Golf suchen", beschr(4, 0, "Geld ohne Auflagen, aber mit politischen Gegenleistungen."), 4, (w) => {
				w.economy.riskPremium = Math.max(150, w.economy.riskPremium - 30);
				w.economy.credibility = clamp(w.economy.credibility + .01, .05, .95);
				wirke(w, "beziehungen_nahost", 4);
				wirke(w, "beziehungen_usa", -1);
				return "Golfstaaten stellen Kredite bereit; sie erwarten Entgegenkommen.";
			}),
			opt("allein", "Den Weg allein gehen", beschr(0, 0, "keine Auflagen, aber auch keine Hilfe."), 0, (w) => {
				w.economy.riskPremium += 20;
				wirke(w, "vertrauen_maerkte", -2);
				wirke(w, "konservative", 1);
				return "Die Regierung lehnt fremde Hilfe ab.";
			})
		],
		standard: (w) => {
			w.economy.riskPremium += 25;
			return "Das Angebot verfällt; die Märkte deuten das als Zögern.";
		}
	},
	{
		id: "ratingagentur",
		szene: "bank",
		frist: 12,
		abkuehlung: 360,
		chance: (w) => w.economy.debtRatio > 45 || netz$1(w, "vertrauen_maerkte") < 38 ? .08 : .004,
		erzeuge: (_, rng) => ({
			provinzen: [],
			staerke: 1,
			daten: { agentur: waehle(rng, [
				"Fitch",
				"Moody's",
				"S&P Global Ratings"
			]) }
		}),
		titel: (_, ev) => `${ev.daten?.agentur} droht mit Herabstufung`,
		text: (w, ev) => [`${ev.daten?.agentur} stellt die Bonität des Landes auf den Prüfstand: Schulden ${nf$4(w.economy.debtRatio)} % des BIP, Inflation ${nf$4(w.published.inflation.value)} %. Eine Herabstufung würde Kredite verteuern.`],
		warum: () => "Ratings entscheiden mit, was der Staat für Schulden zahlt. Sie folgen dem Vertrauen der Investoren und beeinflussen es zugleich.",
		optionen: () => [
			opt("fahrplan", "Einen Reformfahrplan vorlegen", beschr(3, 0, "beruhigt die Investoren, bindet die Regierung."), 3, (w) => {
				wirke(w, "vertrauen_maerkte", 4);
				setFiscalImpulse(w, Math.min(w.economy.fiscalImpulse, 0));
				loyalitaetAendern(w, "finanzen", 4);
				return "Ein mehrjähriger Reformfahrplan wird vorgelegt.";
			}),
			opt("roadshow", "Eine Investorenreise", beschr(2, 0, "wirbt Kapital, ersetzt keine Reformen."), 2, (w) => {
				wirke(w, "auslandskapital", 3);
				w.economy.riskPremium -= 10;
				return "Der Finanzminister wirbt bei Investoren.";
			}),
			opt("zurueckweisen", "Die Kritik zurückweisen", beschr(0, 0, "populär im Inland, teuer an den Märkten."), 0, (w) => {
				w.economy.riskPremium += 20;
				wirke(w, "vertrauen_maerkte", -3);
				wirke(w, "konservative", 1);
				return "Die Regierung weist die Kritik als ungerechtfertigt zurück.";
			})
		],
		standard: (w) => {
			w.economy.riskPremium += 25;
			wirke(w, "vertrauen_maerkte", -4);
			return "Die Agentur stuft das Land herab; Kredite werden teurer.";
		}
	},
	{
		id: "nato_ratifizierung",
		szene: "parlament",
		frist: 20,
		abkuehlung: 900,
		chance: (w) => w.day > 300 ? .02 : 0,
		erzeuge: (_, rng) => {
			const b = waehle(rng, NATO_BEWERBER);
			return {
				provinzen: [],
				staerke: 1,
				daten: {
					land: b.land,
					lage: b.lage,
					ru: b.russland
				}
			};
		},
		titel: (_, ev) => `NATO: ${String(ev.daten?.land ?? "Ein Staat").replace(/^die /, "Die ")} will beitreten`,
		text: (_, ev) => [`${String(ev.daten?.land).replace(/^die /, "Die ")} hat den Beitritt zur NATO beantragt; die Mitglieder müssen ihn ratifizieren, und Ankara hat eine Stimme. ${ev.daten?.lage}`, "Washington und Brüssel drängen auf Zustimmung; Ankara kann sie geben oder zurückhalten und dafür Zugeständnisse verlangen."],
		warum: () => "Wer ein Veto hat, hat einen Preis. Die Frage ist, ob man ihn in Waffen, in Zusagen oder in Vertrauen bezahlt bekommen will.",
		optionen: (_, ev) => [
			opt("zustimmen", "Zustimmen, gegen Zusagen bei Rüstung und Terrorbekämpfung", beschr(3, 0, "der Westen dankt, Moskau verzieht die Miene."), 3, (w) => {
				wirke(w, "beziehungen_usa", 5);
				wirke(w, "beziehungen_eu", 2);
				wirke(w, "beziehungen_russland", -4 * (dk(ev, "ru") || 1));
				wirke(w, "militaer", 2);
				wirke(w, "ansehen", 2);
				loyalitaetAendern(w, "aussen", 4);
				return "Die Türkei stimmt zu und erhält Zusagen bei Rüstung und Terrorbekämpfung.";
			}),
			opt("blockieren", "Blockieren, bis die Bedingungen erfüllt sind", beschr(2, 0, "Härte nach innen, Ärger nach außen."), 2, (w) => {
				wirke(w, "beziehungen_usa", -4);
				wirke(w, "beziehungen_eu", -3);
				wirke(w, "beziehungen_russland", 2 * (dk(ev, "ru") || 1));
				wirke(w, "ansehen", -1);
				wirke(w, "konservative", 2);
				vertrauenAendern(w, 1);
				return `Die Türkei blockiert die Ratifizierung des Beitritts von ${ev.daten?.land}.`;
			}),
			opt("zeit", "Zeit gewinnen", beschr(0, 0, "hält alle Optionen offen und kostet Nerven."), 0, (w) => {
				wirke(w, "ansehen", -1);
				loyalitaetAendern(w, "aussen", -2);
				return "Die Regierung vertagt die Entscheidung.";
			})
		],
		standard: (w) => {
			wirke(w, "ansehen", -1);
			return "Die Entscheidung wird vertagt; die Verbündeten werden ungeduldig.";
		}
	},
	{
		id: "gasvertrag",
		szene: "bank",
		frist: 20,
		abkuehlung: 700,
		chance: (w) => [3, 9].includes(monatVon(w)) ? .04 : 0,
		erzeuge: (_, rng) => ({
			provinzen: [],
			staerke: 1,
			daten: { land: waehle(rng, [
				"Russland",
				"Aserbaidschan",
				"Iran"
			]) }
		}),
		titel: (_, ev) => `Der Gasvertrag mit ${ev.daten?.land} läuft aus`,
		text: (w, ev) => [`Der langfristige Liefervertrag für Erdgas mit Lieferanten aus ${ev.daten?.land} steht zur Verlängerung an. Die Energiepreise stehen bei Index ${nf$4(netz$1(w, "energiepreise"), 0)}, die Abhängigkeit von Importen bei ${nf$4(netz$1(w, "energieimporte"), 0)}.`],
		warum: () => "Gasverträge binden über Jahre. Ein günstiger Preis ist eine Abhängigkeit, und jede Alternative kostet erst einmal mehr.",
		optionen: (_, ev) => {
			const bez = ev.daten?.land === "Russland" ? "beziehungen_russland" : "beziehungen_nahost";
			return [
				opt("verlaengern", "Langfristig verlängern", beschr(2, 0, "billiges Gas, mehr Abhängigkeit."), 2, (w) => {
					wirke(w, "energiepreise", -3);
					wirke(w, "energieimporte", 2);
					wirke(w, bez, 4);
					wirke(w, "beziehungen_eu", -3);
					return "Der Vertrag wird langfristig verlängert.";
				}),
				opt("diversifizieren", "Neue Lieferanten und Flüssiggas erschließen", beschr(4, .2, "teurer heute, unabhängiger morgen."), 4, (w) => {
					kosten(w, .2);
					wirke(w, "energiepreise", 2);
					wirke(w, "energieimporte", -3);
					wirke(w, "beziehungen_eu", 2);
					wirke(w, bez, -2);
					return "Neue Lieferanten und Flüssiggas-Terminals werden erschlossen.";
				}),
				opt("kurz", "Nur kurz verlängern", beschr(1, 0, "kauft Zeit, ohne Weichen zu stellen."), 1, () => "Der Vertrag wird um ein Jahr verlängert.")
			];
		},
		standard: (w) => {
			wirke(w, "energiepreise", 3);
			return "Der Vertrag läuft aus; Notkäufe am Spotmarkt verteuern die Energie.";
		}
	},
	{
		id: "gasfund",
		szene: "istanbul",
		frist: 15,
		abkuehlung: 3e3,
		chance: (w) => w.day > 150 ? .008 : 0,
		erzeuge: () => ({
			provinzen: [],
			staerke: 1
		}),
		titel: () => "Ein Gasfeld wird entdeckt",
		text: () => ["Im Schwarzen Meer ist ein bedeutendes Gasfeld gefunden worden. Die Förderung würde Jahre dauern, aber sie verspricht weniger Importe und neue Einnahmen."],
		warum: () => "Ressourcenfunde sind ein Geschenk und eine Versuchung: Sie können Importe ersetzen, Schulden tilgen oder in Subventionen verpuffen.",
		optionen: () => [
			opt("foerdern", "Rasch erschließen", beschr(3, .3, "weniger Importe, mehr Klimalast."), 3, (w) => {
				kosten(w, .3);
				wirke(w, "energieimporte", -5);
				wirke(w, "energiepreise", -3);
				wirke(w, "auslandskapital", 2);
				wirke(w, "klimaschutz", -2);
				return "Die Erschließung beginnt.";
			}),
			opt("fonds", "Einen Staatsfonds gründen", beschr(4, -.4, "Einnahmen für kommende Jahre, wenig für heute."), 4, (w) => {
				kosten(w, -.4);
				wirke(w, "vertrauen_maerkte", 3);
				wirke(w, "energieimporte", -2);
				return "Ein Staatsfonds legt die künftigen Einnahmen an.";
			}),
			opt("senken", "Die Energiepreise sofort senken", beschr(2, .2, "populär und teuer."), 2, (w) => {
				kosten(w, .2);
				wirke(w, "lebenshaltung", -3);
				vertrauenAendern(w, 2);
				return "Die Regierung senkt die Energiepreise für Haushalte.";
			})
		],
		standard: () => "Das Feld wird vermessen; eine Entscheidung fällt nicht."
	},
	{
		id: "cyberangriff",
		szene: "istanbul",
		frist: 6,
		abkuehlung: 500,
		chance: () => .008,
		erzeuge: (_, rng) => ({
			provinzen: [],
			staerke: 1,
			daten: { ziel: waehle(rng, CYBER_ZIELE) }
		}),
		titel: () => "Ein Cyberangriff",
		text: (_, ev) => [`Ein Angriff legt für Stunden ${ev.daten?.ziel} lahm. Die Herkunft ist unklar; Sicherheitsbehörden sprechen von einem professionellen Vorgehen.`],
		warum: () => "Digitale Infrastruktur ist so verwundbar wie sie schlecht geschützt ist. Die Schwachstelle liegt oft nicht in der Technik, sondern in der Zuständigkeit.",
		eroeffne: (w) => {
			wirke(w, "stromversorgung", -3);
			wirke(w, "vertrauen_maerkte", -2);
		},
		optionen: () => [
			opt("behoerde", "Notfallplan und eine Cyberbehörde", beschr(4, .1, "schützt künftig, kostet jetzt."), 4, (w) => {
				kosten(w, .1);
				wirke(w, "stromversorgung", 4);
				wirke(w, "vertrauen_maerkte", 3);
				return "Ein Notfallplan wird beschlossen, eine Cyberbehörde aufgebaut.";
			}),
			opt("beschuldigen", "Öffentlich einen Staat beschuldigen", beschr(2, 0, "das Land rückt zusammen, die Beweislage bleibt dünn."), 2, (w) => {
				vertrauenAendern(w, 1);
				wirke(w, "beziehungen_nahost", -3);
				wirke(w, "ansehen", -1);
				return "Die Regierung macht einen Staat öffentlich verantwortlich.";
			}),
			opt("still", "Still beheben", beschr(0, 0, "keine Aufregung, keine Lehre."), 0, (w) => {
				wirke(w, "vertrauen_maerkte", -3);
				return "Die Systeme werden ohne öffentliche Erklärung repariert.";
			})
		],
		standard: (w) => {
			wirke(w, "vertrauen_maerkte", -3);
			return "Die Behörden schweigen; das Misstrauen wächst.";
		}
	},
	{
		id: "weltwirtschaftskrise",
		szene: "bank",
		frist: 10,
		abkuehlung: 1500,
		chance: (w) => w.day > 500 ? .012 : 0,
		erzeuge: (_, rng) => ({
			provinzen: [],
			staerke: .7 + .5 * rng.next()
		}),
		titel: () => "Eine Weltwirtschaftskrise erreicht die Türkei",
		text: (w, ev) => [`Ein Einbruch an den Weltmärkten reißt die Nachfrage nach türkischen Waren ein: Bestellungen werden storniert, Touristen bleiben aus, Auslandskapital zieht ab. Das Wachstum liegt bei ${nf$4(w.economy.growth)} %, der Risikoaufschlag steigt auf ${nf$4(w.economy.riskPremium + 60 * ev.staerke, 0)} Basispunkte.`, `${anrede(figur(w, "finanzen"))} fragt, ob der Staat stützen oder sparen soll. Wer Kapital zurückgelegt hat, kann jetzt handeln.`],
		warum: () => "Krisen kommen von außen und treffen die, die am wenigsten Puffer haben. Ein Staat, der in guten Jahren Kapital und Vertrauen aufbaut, hat in schlechten Handlungsspielraum.",
		eroeffne: (w, ev) => {
			w.economy.riskPremium += 60 * ev.staerke;
			w.economy.outputGap -= 1.6 * ev.staerke;
			wirke(w, "export", -6 * ev.staerke);
			wirke(w, "tourismus", -7 * ev.staerke);
			wirke(w, "auslandskapital", -6 * ev.staerke);
			wirke(w, "vertrauen_maerkte", -5 * ev.staerke);
			wirke(w, "mittelstand", -3 * ev.staerke);
		},
		optionen: (_, ev) => [
			opt("konjunktur", "Ein Konjunkturprogramm auflegen", beschr(6, 1, "stützt die Nachfrage und die Beschäftigung, kostet Schulden."), 6, (w) => {
				kosten(w, 1);
				w.economy.outputGap += 1 * ev.staerke;
				wirke(w, "mittelstand", 3);
				wirke(w, "arbeitnehmer", 2);
				vertrauenAendern(w, 2);
				return "Ein Konjunkturprogramm stützt die Wirtschaft.";
			}),
			opt("kurzarbeit", "Kurzarbeit und Kredite für Betriebe", beschr(4, .4, "hält Arbeitsplätze, ohne den Haushalt zu sprengen."), 4, (w) => {
				kosten(w, .4);
				wirke(w, "mittelstand", 3);
				wirke(w, "arbeitsplaetze_industrie", 3);
				wirke(w, "kredite", 2);
				return "Kurzarbeitergeld und Kreditgarantien federn den Schlag ab.";
			}),
			opt("sparen", "Ruhig bleiben und den Haushalt schützen", beschr(2, 0, "die Märkte danken es, die Betriebe müssen selbst durch."), 2, (w) => {
				wirke(w, "vertrauen_maerkte", 3);
				wirke(w, "mittelstand", -3);
				wirke(w, "arbeitnehmer", -3);
				vertrauenAendern(w, -2);
				return "Die Regierung hält den Haushalt und lässt die Krise auslaufen.";
			})
		],
		standard: (w, ev) => {
			w.economy.riskPremium += 30 * ev.staerke;
			wirke(w, "arbeitsplaetze_industrie", -4);
			wirke(w, "armut", 2);
			vertrauenAendern(w, -3);
			return "Ohne Antwort vertieft sich die Krise; die Entlassungen häufen sich.";
		}
	},
	{
		id: "pandemie",
		szene: "parlament",
		frist: 8,
		abkuehlung: 2e3,
		chance: (w) => w.day > 700 ? .007 : 0,
		erzeuge: (_, rng) => ({
			provinzen: [],
			staerke: .7 + .5 * rng.next()
		}),
		titel: () => "Eine neue Seuche breitet sich aus",
		text: (w) => [`Ein neuer Erreger verbreitet sich schneller als jeder Winterinfekt: Krankenhäuser melden Überlastung, Schulen schließen, Flüge werden gestrichen. Die Gesundheitsversorgung steht bei Index ${nf$4(netz$1(w, "gesundheitsversorgung"), 0)}.`, "Der Ärzteverband fordert Maßnahmen; die Wirtschaft warnt vor einem Stillstand."],
		warum: () => "Seuchen zeigen, wie belastbar ein Gesundheitssystem und ein Staat sind. Beschränkungen schützen Leben und kosten Wirtschaft; beides zugleich lässt sich nicht maximieren.",
		eroeffne: (w, ev) => {
			wirke(w, "gesundheitsversorgung", -6 * ev.staerke);
			wirke(w, "wartezeiten", 8 * ev.staerke);
			wirke(w, "produktivitaet", -3 * ev.staerke);
			wirke(w, "tourismus", -6 * ev.staerke);
		},
		optionen: (_, ev) => [
			opt("beschraenken", "Strenge Beschränkungen und Impfprogramm", beschr(6, .5, "schützt Leben, kostet Wirtschaftsleistung und Geduld."), 6, (w) => {
				kosten(w, .5);
				wirke(w, "gesundheitsversorgung", 5 * ev.staerke);
				wirke(w, "wartezeiten", -4);
				wirke(w, "produktivitaet", -2);
				wirke(w, "tourismus", -3);
				vertrauenAendern(w, 1.5);
				return "Beschränkungen und ein Impfprogramm dämmen die Ausbreitung ein.";
			}),
			opt("gezielt", "Gezielt schützen: Risikogruppen und Krankenhäuser", beschr(4, .3, "ein Mittelweg."), 4, (w) => {
				kosten(w, .3);
				wirke(w, "gesundheitsversorgung", 3 * ev.staerke);
				wirke(w, "wartezeiten", -2);
				return "Risikogruppen und Krankenhäuser werden gezielt geschützt.";
			}),
			opt("offen", "Das Land offen halten", beschr(1, 0, "die Wirtschaft läuft, das Gesundheitssystem gerät an die Grenze."), 1, (w) => {
				wirke(w, "gesundheitsversorgung", -3 * ev.staerke);
				wirke(w, "wartezeiten", 4);
				vertrauenAendern(w, -2);
				return "Die Regierung hält das Land offen; die Krankenhäuser laufen voll.";
			})
		],
		standard: (w, ev) => {
			wirke(w, "gesundheitsversorgung", -4 * ev.staerke);
			wirke(w, "wartezeiten", 5);
			vertrauenAendern(w, -3);
			return "Ohne klare Linie breitet sich die Seuche aus; das Vertrauen sinkt.";
		}
	}
];
//#endregion
//#region game/src/sim/ereignisse-reich.ts
const staette = (ev) => ERBE_NACH_ID[String(ev.daten?.staette ?? "")] ?? ERBE[0];
/** Zieht eine Stätte, deren Gewicht mit schlechtem Zustand wächst. */
function schwaecheZiehen(w, rng, nur) {
	const z = reichZustand(w);
	const kandidaten = ERBE.filter((e) => nur ? nur(e) : true);
	const gewichte = kandidaten.map((e) => Math.max(.05, (100 - (z.staetten[e.id]?.zustand ?? 50)) / 100) ** 2);
	const summe = gewichte.reduce((a, b) => a + b, 0);
	if (!kandidaten.length || summe <= 0) return null;
	let r = rng.next() * summe;
	for (let i = 0; i < kandidaten.length; i++) {
		r -= gewichte[i];
		if (r <= 0) return kandidaten[i];
	}
	return kandidaten[kandidaten.length - 1];
}
const hebeStaette = (w, id, d) => {
	const st = reichZustand(w).staetten[id];
	if (st) st.zustand = clamp(st.zustand + d, 0, 100);
};
/** Besetzt einen frei werdenden Sitz: Ein Mitglied verlässt das Gericht (nach Anteil), ein neues aus dem gewählten Lager kommt. */
function besetze(w, key, wahl, rng) {
	const s = reichZustand(w).sitze[key];
	if (!s) return;
	const n = s.loyal + s.unabhaengig + s.reform;
	let r = rng.next() * n;
	const geht = r < s.loyal ? "loyal" : r < s.loyal + s.reform ? "reform" : "unabhaengig";
	r = 0;
	s[geht] -= 1;
	s[wahl] += 1;
}
const REICH_VORLAGEN = [
	{
		id: "erbe_raubgrabung",
		szene: "anatolien",
		frist: 15,
		abkuehlung: 240,
		chance: (w) => netz$1(w, "kriminalitaet") > 40 ? .03 : .015,
		erzeuge: (w, rng) => {
			const e = schwaecheZiehen(w, rng, (x) => x.bezug.includes("antik") || x.bezug.includes("fruehmenschlich"));
			return e ? {
				provinzen: [e.plaka],
				staerke: .5 + .5 * rng.next(),
				daten: { staette: e.id }
			} : null;
		},
		titel: (_, ev) => `Raubgrabung bei ${staette(ev).name}`,
		text: (_, ev) => [`Wächter melden nächtliche Grabungen bei ${staette(ev).name} (${staette(ev).ort}): Löcher im Boden, Spuren von Metalldetektoren, ein Händler bietet im Ausland Stücke an, die aus der Gegend stammen könnten.`, "Das Gesetz zum Schutz von Kulturgütern sieht zwei bis fünf Jahre Haft vor; die Wächter sind zu wenige."],
		warum: () => "Ein Erbe, das niemand bewacht, geht Stück für Stück verloren: durch Raub, durch Verfall und durch Gleichgültigkeit.",
		massnahmen: ["m_denkmalschutz", "m_archaeologie"],
		optionen: (_, ev) => [opt("schutz", "Wächter aufstocken und Ermittler schicken", beschr(3, 0, "sichert die Stätte und stellt Täter."), 3, (w) => {
			hebeStaette(w, staette(ev).id, 8);
			wirke(w, "kriminalitaet", -1, ev.provinzen);
			wirke(w, "ansehen", .5);
			return `Die Stätte bei ${staette(ev).name} wird bewacht; die Ermittler verfolgen die Händler.`;
		}), opt("grabung", "Die Grabung selbst übernehmen: Funde sichern", beschr(2, .02, "die Wissenschaft rettet, was noch da ist."), 2, (w) => {
			kosten(w, .02);
			hebeStaette(w, staette(ev).id, 5);
			wirke(w, "hochschule", .5);
			wirke(w, "identitaet", .5);
			return `Archäologen übernehmen die Grabung bei ${staette(ev).name} und sichern die Funde.`;
		})],
		standard: (w, ev) => {
			hebeStaette(w, staette(ev).id, -10 * ev.staerke);
			wirke(w, "ansehen", -.5);
			return `Die Raubgräber machen weiter; bei ${staette(ev).name} gehen Funde verloren.`;
		}
	},
	{
		id: "erbe_erdbebenschaden",
		szene: "anatolien",
		frist: 12,
		abkuehlung: 400,
		chance: (w) => netz$1(w, "erdbebenvorsorge") < 45 ? .012 : .006,
		erzeuge: (w, rng) => {
			const e = schwaecheZiehen(w, rng);
			return e ? {
				provinzen: [e.plaka],
				staerke: .4 + .6 * rng.next(),
				daten: { staette: e.id }
			} : null;
		},
		titel: (_, ev) => `Nachbeben: Schäden an ${staette(ev).name}`,
		text: (_, ev) => [`Ein Erdbeben der Stärke fünf bringt bei ${staette(ev).name} (${staette(ev).ort}) Mauern zum Einsturz und reißt Risse in tragende Bauteile. Gutachter warnen: Bleibt die Stätte ungesichert, droht der nächste Regen den Rest zu zerstören.`, "Antakya hat 2023 mehr als die Hälfte seiner historischen Bausubstanz verloren; niemand will sich das wiederholen."],
		warum: () => "Das Erdbebenland verliert sein Erbe nicht nur durch Alter, sondern durch einzelne Nächte; Vorsorge ist billiger als Wiederaufbau.",
		massnahmen: ["m_denkmalschutz", "m_bauaufsicht"],
		optionen: (_, ev) => [opt("sichern", "Sofort sichern: Stützen, Dächer, Gutachter", beschr(3, .03, "rettet, was zu retten ist."), 3, (w) => {
			kosten(w, .03);
			hebeStaette(w, staette(ev).id, 12);
			return `Notdächer und Stützen sichern ${staette(ev).name}.`;
		}), opt("zusagen", "Den Wiederaufbau zusagen", beschr(1, 0, "ein Versprechen, das später eingefordert wird."), 1, (w) => {
			zusageAnlegen(w, {
				von: `Denkmalbehörde von ${staette(ev).ort}`,
				text: `Der Wiederaufbau von ${staette(ev).name} wurde zugesagt`,
				tage: 300,
				massnahme: "m_denkmalschutz"
			});
			hebeStaette(w, staette(ev).id, 4);
			return `Der Wiederaufbau von ${staette(ev).name} ist zugesagt.`;
		})],
		standard: (w, ev) => {
			hebeStaette(w, staette(ev).id, -18 * ev.staerke);
			wirke(w, "kulturerbe", -1, ev.provinzen);
			return `Ungesichert verfällt ${staette(ev).name} weiter; der nächste Regen richtet den Rest an.`;
		}
	},
	{
		id: "erbe_unesco",
		szene: "parlament",
		frist: 25,
		abkuehlung: 540,
		chance: (w) => monatVon(w) === 7 ? .45 : 0,
		erzeuge: (w, rng) => {
			const z = reichZustand(w);
			const kand = ERBE.filter((e) => e.unesco.status === "tentativ" && (z.staetten[e.id]?.zustand ?? 0) >= 50);
			if (!kand.length) return null;
			const e = kand[Math.floor(rng.next() * kand.length)];
			return {
				provinzen: [e.plaka],
				staerke: 1,
				daten: { staette: e.id }
			};
		},
		titel: (_, ev) => `Das Welterbekomitee berät über ${staette(ev).name}`,
		text: (w, ev) => [`Im Juli tagt das Welterbekomitee der UNESCO. Die Türkei hat ${staette(ev).name} (${staette(ev).ort}) für die Liste vorgeschlagen; der Zustand der Stätte ist ${Math.round(reichZustand(w).staetten[staette(ev).id]?.zustand ?? 0)} von 100. Die Gutachter verlangen einen Plan zur Erhaltung, ein Besuchermanagement und Ansprechpartner vor Ort.`, "Zuletzt wurde Sardes 2025 aufgenommen, nach jahrelanger Vorbereitung."],
		warum: () => "Ein Welterbetitel hängt an Zustand, Verwaltung und Diplomatie; er bringt Gäste und Ansehen und verpflichtet zu Pflege und Berichten.",
		massnahmen: ["m_archaeologie", "m_denkmalschutz"],
		optionen: (_, ev) => [opt("betreiben", "Den Antrag mit vollem Einsatz betreiben", beschr(4, 0, "Diplomatie, Gutachter und ein Erhaltungsplan; der Ausgang ist offen."), 4, (w, _e, rng) => {
			const p = clamp(.4 + .006 * ((reichZustand(w).staetten[staette(ev).id]?.zustand ?? 50) - 55) + .004 * (netz$1(w, "ansehen") - 50), .15, .85);
			if (rng.next() < p) {
				wirke(w, "ansehen", 3);
				wirke(w, "tourismus", 3, ev.provinzen);
				wirke(w, "identitaet", 1);
				hebeStaette(w, staette(ev).id, 6);
				return `${staette(ev).name} wird in die Welterbeliste aufgenommen.`;
			}
			wirke(w, "ansehen", -.5);
			return `Das Komitee vertagt die Entscheidung über ${staette(ev).name}: Der Erhaltungsplan überzeugt noch nicht.`;
		}), opt("zurueck", "Den Antrag zurückstellen und erst die Stätte sichern", beschr(1, 0, "spart Kraft und kostet ein Jahr."), 1, (w) => {
			hebeStaette(w, staette(ev).id, 5);
			return `Ankara stellt den Antrag für ${staette(ev).name} zurück und sichert zuerst die Stätte.`;
		})],
		standard: (w) => {
			wirke(w, "ansehen", -.3);
			return "Ohne Beitrag Ankaras schiebt das Komitee den Antrag auf.";
		}
	},
	{
		id: "erbe_fund",
		szene: "anatolien",
		frist: 15,
		abkuehlung: 420,
		chance: (w) => netz$1(w, "m_archaeologie") >= 40 ? .03 : .008,
		erzeuge: (w, rng) => {
			const kand = ERBE.filter((e) => e.bezug.includes("fruehmenschlich") || e.bezug.includes("antik"));
			const e = kand[Math.floor(rng.next() * kand.length)];
			return {
				provinzen: [e.plaka],
				staerke: .5 + .5 * rng.next(),
				daten: { staette: e.id }
			};
		},
		titel: (_, ev) => `Ein Fund bei ${staette(ev).name}`,
		text: (_, ev) => [`Die Grabungsleiter bei ${staette(ev).name} (${staette(ev).ort}) melden einen Fund, der die Forschung verändern könnte: eine Anlage, die älter ist als angenommen, mit Reliefs und Inschriften. Die Presse hat schon davon erfahren.`, "Göbekli Tepe zählte 2024 750.000 Besucher; ein neuer Fund wird sofort zum Ziel."],
		warum: () => "Funde machen ein Land sichtbar, aber Schutz und Forschung brauchen Zeit; wer zu früh feiert, riskiert Schäden und Raub.",
		massnahmen: ["m_archaeologie"],
		optionen: (_, ev) => [opt("offen", "Sofort bekannt machen und ein Museum ankündigen", beschr(2, .02, "Aufmerksamkeit, Gäste und Erwartungen."), 2, (w) => {
			kosten(w, .02);
			wirke(w, "tourismus", 2, ev.provinzen);
			wirke(w, "identitaet", 1.5);
			wirke(w, "ansehen", 1.5);
			hebeStaette(w, staette(ev).id, -3);
			return `Die Regierung macht den Fund bei ${staette(ev).name} bekannt und kündigt ein Museum an.`;
		}), opt("sichern", "Erst wissenschaftlich sichern, dann berichten", beschr(1, 0, "langsamer Ruhm, sichere Stätte."), 1, (w) => {
			wirke(w, "hochschule", 1);
			wirke(w, "identitaet", .5);
			hebeStaette(w, staette(ev).id, 4);
			return `Wissenschaftler dokumentieren den Fund bei ${staette(ev).name}, bevor er veröffentlicht wird.`;
		})],
		standard: (w, ev) => {
			hebeStaette(w, staette(ev).id, -4);
			return `Ohne Entscheidung sickern Bilder durch; bei ${staette(ev).name} stehen bald Schaulustige.`;
		}
	},
	{
		id: "erbe_hagia_sophia",
		szene: "istanbul",
		frist: 20,
		abkuehlung: 720,
		chance: (w) => netz$1(w, "vielfalt") < 48 && Number(w.date.slice(0, 4)) >= 2029 ? .012 : 0,
		erzeuge: () => ({
			provinzen: [34],
			staerke: 1
		}),
		titel: () => "Streit um die Hagia Sophia",
		text: () => ["Zum Jahrestag der Umwidmung streiten Verbände, Kirchen und Museumsleute wieder um die Nutzung der Hagia Sophia: Gebet für die einen, Weltkulturerbe für die anderen, Ziel für Millionen Besucher.", "Das Dekret vom 2. Juli 2020 machte sie wieder zur Moschee; die UNESCO bedauerte es. Seit 15. Januar 2024 zahlen ausländische Gäste 25 Euro."],
		warum: () => "Ein Bauwerk kann für mehrere Gemeinschaften heilig sein; jede Änderung der Besuchsregeln wird politisch gelesen.",
		massnahmen: ["m_minderheitenrechte"],
		optionen: () => [opt("offen", "Besuchszeiten für alle Glaubensrichtungen öffnen", beschr(3, 0, "Vielfalt und Ansehen, aber Protest der Konservativen."), 3, (w) => {
			wirke(w, "vielfalt", 3);
			wirke(w, "ansehen", 2);
			wirke(w, "konservative", -2);
			hebeStaette(w, "hagia_sophia", 2);
			return "Die Regierung öffnet feste Zeiten für Besucher aller Glaubensrichtungen.";
		}), opt("gebuehr", "Den Eintritt für Ausländer anheben", beschr(1, 0, "Einnahmen, weniger Gäste."), 1, (w) => {
			w.economy.debtRatio -= .02;
			wirke(w, "tourismus", -1, [34]);
			return "Der Eintritt für ausländische Gäste steigt; das bringt Einnahmen und dämpft den Andrang.";
		})],
		standard: (w) => {
			wirke(w, "polarisierung", 1);
			return "Ohne Entscheidung bleibt es beim Streit.";
		}
	},
	{
		id: "kultur_pilgerwelle",
		szene: "anatolien",
		frist: 12,
		abkuehlung: 360,
		chance: (w) => w.spiel?.reich?.bestand.serie_kirchen7 ? .05 : .004,
		erzeuge: () => ({
			provinzen: [
				35,
				45,
				20
			],
			staerke: 1
		}),
		titel: () => "Eine Pilgerwelle an der Kirchenroute",
		text: () => ["Zum kirchlichen Feiertag kommen weit mehr Pilger und Reisegruppen, als die Kirchenroute der Sieben verkraftet: Busse stauen sich in Selçuk, in Bergama fehlen Unterkünfte, und in Sardes drängen sich die Gäste in der Synagoge.", "Das ist der Erfolg, den man wollte, und die Belastung, vor der die Denkmalbehörden warnten."],
		warum: () => "Erfolg belastet: Wer Besucher anzieht, muss sie lenken, sonst zahlt die Stätte.",
		massnahmen: ["m_denkmalschutz", "m_kulturfoerderung"],
		optionen: () => [opt("lenken", "Unterkünfte und Besucherlenkung ausbauen", beschr(2, .02, "schützt die Stätten, kostet Baukapazität."), 2, (w) => {
			kosten(w, .02);
			wirke(w, "tourismus", 1, [
				35,
				45,
				20
			]);
			for (const id of [
				"ephesos",
				"smyrna",
				"pergamon",
				"thyatira",
				"sardes",
				"philadelphia",
				"laodikeia"
			]) hebeStaette(w, id, 2);
			return "Ordner, Parkflächen und Führungen lenken die Pilger.";
		}), opt("laufen", "Laufen lassen", beschr(0, 0, "mehr Gäste heute, mehr Verschleiß morgen."), 0, (w) => {
			wirke(w, "tourismus", 2, [
				35,
				45,
				20
			]);
			for (const id of [
				"ephesos",
				"smyrna",
				"pergamon",
				"thyatira",
				"sardes",
				"philadelphia",
				"laodikeia"
			]) hebeStaette(w, id, -3);
			return "Die Pilger kommen in Scharen; die Stätten tragen die Last.";
		})],
		standard: (w) => {
			for (const id of [
				"ephesos",
				"pergamon",
				"sardes"
			]) hebeStaette(w, id, -2);
			return "Der Andrang bleibt unbewältigt; die Stätten leiden.";
		}
	},
	{
		id: "recht_ernennung",
		szene: "parlament",
		frist: 20,
		abkuehlung: 330,
		chance: () => .05,
		erzeuge: () => ({
			provinzen: [],
			staerke: 1
		}),
		titel: () => "Ein Sitz am Verfassungsgericht wird frei",
		text: (w) => {
			const s = reichZustand(w).sitze.aym;
			return ["Ein Mitglied des Verfassungsgerichts tritt in den Ruhestand. Der Präsident ernennt zwölf der fünfzehn Mitglieder; für den frei gewordenen Platz muss er einen Namen nennen.", `Im Gericht sitzen jetzt ${s.loyal} Juristen, die der Regierung nahestehen, ${s.reform} Reformorientierte und ${s.unabhaengig} Unabhängige. Jede Ernennung verschiebt das Gleichgewicht für zwölf Jahre.`];
		},
		warum: () => "Wer die Sitze besetzt, prägt, ob Gerichte Vorhaben der Regierung stoppen: Loyalität kauft Ruhe, Unabhängigkeit kauft Glaubwürdigkeit.",
		massnahmen: ["m_richterrat"],
		optionen: () => [
			opt("loyal", "Einen Juristen aus dem eigenen Umfeld ernennen", beschr(0, 0, "sicher für die Regierung, teuer für die Unabhängigkeit."), 0, (w, _e, rng) => {
				besetze(w, "aym", "loyal", rng);
				wirke(w, "justiz_unabhaengigkeit", -1);
				wirke(w, "konservative", .5);
				return "Der Präsident ernennt einen Juristen aus dem eigenen Umfeld.";
			}),
			opt("unabhaengig", "Eine anerkannte, unabhängige Juristin ernennen", beschr(2, 0, "Glaubwürdigkeit im In- und Ausland, weniger Zugriff."), 2, (w, _e, rng) => {
				besetze(w, "aym", "unabhaengig", rng);
				wirke(w, "justiz_unabhaengigkeit", 1.5);
				wirke(w, "ansehen", 1);
				wirke(w, "staedtische_saekulare", 1);
				return "Der Präsident ernennt eine unabhängige Juristin; die Fachwelt lobt die Wahl.";
			}),
			opt("kompromiss", "Eine Kandidatin suchen, die auch die Opposition mitträgt", beschr(3, 0, "ein Kompromiss, der Fraktionen einbindet."), 3, (w, _e, rng) => {
				besetze(w, "aym", "reform", rng);
				wirke(w, "justiz_unabhaengigkeit", .8);
				wirke(w, "polarisierung", -.5);
				return "Nach Gesprächen mit der Opposition steht eine Kandidatin fest, die beide Lager mittragen.";
			})
		],
		standard: (w) => {
			const s = reichZustand(w).sitze.aym;
			s.loyal += 1;
			s.unabhaengig = Math.max(0, s.unabhaengig - 1);
			return "Der Präsident lässt die Frist verstreichen; der Sitz geht an den Kandidaten seines Umfelds.";
		}
	},
	{
		id: "recht_aym_kassation",
		szene: "parlament",
		frist: 15,
		abkuehlung: 400,
		chance: (w) => netz$1(w, "urteilsbefolgung") < 45 ? .025 : .006,
		erzeuge: () => ({
			provinzen: [],
			staerke: 1
		}),
		titel: () => "Verfassungsgericht gegen Kassationshof",
		text: () => ["Der Kassationshof weigert sich, ein Urteil des Verfassungsgerichts umzusetzen, das die Freilassung eines gewählten Abgeordneten anordnet: Das Urteil habe „keinen Rechtswert“. Zum zweiten Mal steht Gericht gegen Gericht.", "Anwälte und Opposition fordern, dass die Regierung das Urteil durchsetzt; regierungsnahe Kreise stellen sich hinter den Kassationshof."],
		warum: () => "Wenn oberste Gerichte einander nicht anerkennen, entscheidet sich, ob Urteile etwas gelten; die Regierung hat kein neutrales Amt in diesem Streit.",
		massnahmen: ["m_urteilsumsetzung"],
		optionen: () => [opt("durchsetzen", "Das Urteil des Verfassungsgerichts durchsetzen", beschr(4, 0, "stärkt die Gerichtsbarkeit, verärgert das Lager."), 4, (w) => {
			wirke(w, "urteilsbefolgung", 5);
			wirke(w, "justiz_unabhaengigkeit", 2);
			wirke(w, "strassburg_druck", -2);
			wirke(w, "konservative", -1);
			return "Die Regierung sorgt dafür, dass das Urteil des Verfassungsgerichts umgesetzt wird.";
		}), opt("kassation", "Den Kassationshof stützen", beschr(0, 0, "Ruhe im Lager, Streit mit Straßburg."), 0, (w) => {
			wirke(w, "urteilsbefolgung", -4);
			wirke(w, "justiz_unabhaengigkeit", -2);
			wirke(w, "ansehen", -1.5);
			wirke(w, "konservative", 1);
			return "Die Regierung stellt sich hinter den Kassationshof; das Urteil bleibt unerfüllt.";
		})],
		standard: (w) => {
			wirke(w, "urteilsbefolgung", -2);
			wirke(w, "polarisierung", 1);
			return "Der Streit der Gerichte bleibt ungelöst; das Vertrauen in beide sinkt.";
		}
	},
	{
		id: "recht_egmr",
		szene: "parlament",
		frist: 20,
		abkuehlung: 300,
		chance: (w) => netz$1(w, "strassburg_druck") >= 50 ? .035 : .01,
		erzeuge: () => ({
			provinzen: [],
			staerke: 1
		}),
		titel: () => "Ein Urteil aus Straßburg",
		text: () => ["Der Europäische Gerichtshof für Menschenrechte stellt fest, dass die Türkei in einem weiteren Fall die Konvention verletzt hat. 2025 ergingen 74 Urteile gegen die Türkei, 66 mit Verletzung; 22.566 Beschwerden waren am 1. Juli 2026 anhängig.", "Das Ministerkomitee des Europarats fragt, ob und wann die Regierung das Urteil umsetzt."],
		warum: () => "Urteile aus Straßburg sind bindend; wer sie nicht umsetzt, sammelt Verfahren und Vorwürfe.",
		massnahmen: ["m_urteilsumsetzung"],
		optionen: () => [opt("umsetzen", "Das Urteil umsetzen", beschr(3, 0, "Freiheit und Ansehen, Ärger im Lager."), 3, (w) => {
			wirke(w, "urteilsbefolgung", 4);
			wirke(w, "strassburg_druck", -3);
			wirke(w, "konservative", -1.5);
			landAendern(w, "EU", { vertrauen: 2 }, "Ein Straßburger Urteil wurde umgesetzt");
			return "Die Regierung setzt das Straßburger Urteil um.";
		}), opt("zurueck", "Das Urteil zurückweisen", beschr(0, 0, "Beifall zu Hause, Druck von außen."), 0, (w) => {
			wirke(w, "strassburg_druck", 3);
			wirke(w, "ansehen", -2);
			wirke(w, "konservative", 1.5);
			landAendern(w, "EU", { vertrauen: -2 }, "Ein Straßburger Urteil wurde zurückgewiesen");
			return "Die Regierung weist das Straßburger Urteil zurück.";
		})],
		standard: (w) => {
			wirke(w, "strassburg_druck", 1);
			return "Das Urteil bleibt liegen; die Liste des Ministerkomitees wächst.";
		}
	},
	{
		id: "recht_haftrevolte",
		szene: "istanbul",
		frist: 8,
		abkuehlung: 360,
		chance: (w) => .02 * Math.max(0, netz$1(w, "haftueberfuellung") / 70) ** 3,
		erzeuge: () => ({
			provinzen: [],
			staerke: 1
		}),
		titel: () => "Unruhen in einer überfüllten Haftanstalt",
		text: () => ["In einer Haftanstalt, die für halb so viele Menschen gebaut wurde, brechen Unruhen aus: Insassen verweigern das Essen, ein Flügel brennt. Angehörige stehen vor dem Tor.", "Im August 2026 saßen 433.520 Menschen auf 304.956 Plätzen, 65.227 davon in Untersuchungshaft."],
		warum: () => "Überfüllung ist eine Politikfrage: Sie entsteht aus Haftpraxis und Kapazität, und sie entlädt sich in solchen Nächten.",
		massnahmen: ["m_haftvermeidung"],
		optionen: () => [
			opt("verlegen", "Sofort verlegen und Plätze schaffen", beschr(3, .03, "beruhigt die Lage kurz, kostet Bauarbeit."), 3, (w) => {
				kosten(w, .03);
				wirke(w, "haftueberfuellung", -2);
				wirke(w, "justizvertrauen", .5);
				return "Häftlinge werden verlegt, zusätzliche Plätze eingerichtet.";
			}),
			opt("haerte", "Härte zeigen", beschr(0, 0, "Beifall der Konservativen, Kritik im Ausland."), 0, (w) => {
				wirke(w, "konservative", 1);
				wirke(w, "ansehen", -2);
				wirke(w, "justizvertrauen", -1);
				return "Sondereinsatzkräfte beenden die Unruhen mit Härte.";
			}),
			opt("vermeidung", "Haftvermeidung und Bewährung ankündigen", beschr(2, 0, "eine Richtung, keine Sofortlösung."), 2, (w) => {
				wirke(w, "haftueberfuellung", -1);
				wirke(w, "justizvertrauen", 1);
				wirke(w, "konservative", -1);
				return "Die Regierung kündigt an, Untersuchungshaft zurückzudrängen.";
			})
		],
		standard: (w) => {
			wirke(w, "justizvertrauen", -1);
			wirke(w, "ansehen", -1);
			return "Die Lage in der Anstalt entgleitet; Berichte gehen um die Welt.";
		}
	},
	{
		id: "mil_lieferverzug",
		szene: "parlament",
		frist: 15,
		abkuehlung: 300,
		chance: (w) => (w.spiel?.reich?.laufend ?? []).some((l) => vorhabenDef(l.id)?.bereich === "militaer") ? .025 : 0,
		erzeuge: (w) => {
			const v = (w.spiel?.reich?.laufend ?? []).map((l) => vorhabenDef(l.id)).filter((v) => v?.bereich === "militaer" && !v.id.startsWith("doktrin"))[0];
			return v ? {
				provinzen: [],
				staerke: 1,
				daten: { vorhaben: v.id }
			} : null;
		},
		titel: (_, ev) => `Verzug bei „${vorhabenDef(String(ev.daten?.vorhaben))?.name ?? "einem Rüstungsprogramm"}“`,
		text: (_, ev) => [`Beim Programm „${vorhabenDef(String(ev.daten?.vorhaben))?.name ?? "Rüstung"}“ melden die Hersteller Verzug: Ein Zulieferteil kommt nicht, die Abnahme wird verschoben, die Ausbildung hinkt hinterher.`, "Verzug ist der Normalfall bei Rüstung; die Frage ist, wer den Preis zahlt: der Lieferant, die Truppe oder der Präsident."],
		warum: () => "Bestellt ist nicht einsatzbereit: Vom Vertrag bis zur Bereitschaft vergehen Jahre, und jede Störung kostet Zeit oder Bündnisgeduld.",
		massnahmen: ["m_ruestungsindustrie"],
		optionen: (_, ev) => [
			opt("druck", "Auf den Lieferanten Druck machen", beschr(2, 0, "Termine halten, Beziehungen belasten."), 2, (w) => {
				const l = reichZustand(w).laufend.find((x) => x.id === String(ev.daten?.vorhaben));
				if (l) l.fortschritt += (vorhabenDef(l.id)?.kosten.bau ?? 0) * .03;
				wirke(w, "beziehungen_usa", -.5);
				return "Ankara macht Druck: Der Lieferant sagt Aufholung zu.";
			}),
			opt("hinnehmen", "Die Frist hinnehmen", beschr(0, 0, "Ruhe, aber ein Loch in der Bereitschaft."), 0, (w) => {
				const l = reichZustand(w).laufend.find((x) => x.id === String(ev.daten?.vorhaben));
				if (l) l.fortschritt = Math.max(0, l.fortschritt - (vorhabenDef(l.id)?.kosten.bau ?? 0) * .05);
				wirke(w, "bereitschaft_luft", -.5);
				return "Die Regierung nimmt den Verzug hin; das Programm rutscht nach hinten.";
			}),
			opt("eigen", "Die eigene Fertigung vorziehen", beschr(3, .05, "mehr Autarkie, später Ergebnisse."), 3, (w) => {
				kosten(w, .05);
				wirke(w, "ruestungsautarkie", 2);
				const l = reichZustand(w).laufend.find((x) => x.id === String(ev.daten?.vorhaben));
				if (l) l.fortschritt = Math.max(0, l.fortschritt - (vorhabenDef(l.id)?.kosten.bau ?? 0) * .03);
				return "Die Rüstungsagentur zieht die eigene Fertigung vor.";
			})
		],
		standard: (w, ev) => {
			const l = reichZustand(w).laufend.find((x) => x.id === String(ev.daten?.vorhaben));
			if (l) l.fortschritt = Math.max(0, l.fortschritt - (vorhabenDef(l.id)?.kosten.bau ?? 0) * .04);
			return "Der Verzug läuft weiter; das Programm verliert Zeit.";
		}
	},
	{
		id: "mil_militaerrat",
		szene: "parlament",
		frist: 20,
		abkuehlung: 330,
		chance: (w) => monatVon(w) === 8 ? .7 : 0,
		erzeuge: () => ({
			provinzen: [],
			staerke: 1
		}),
		titel: () => "Der Oberste Militärrat tagt",
		text: () => ["Im August tagt der Oberste Militärrat unter Vorsitz des Präsidenten: Er entscheidet über Beförderungen und Pensionierungen der Generäle und Admirale.", "Nach 2016 wurden Schätzungen zufolge 40 Prozent bis zwei Drittel der Generäle entlassen; wer nun befördert wird, sagt der Truppe, wonach im Land befördert wird."],
		warum: () => "Die Auswahl der Führung entscheidet, ob Offiziere sich an Leistung oder an Nähe orientieren. Loyalität kauft Ruhe, Leistung kauft Bereitschaft.",
		massnahmen: ["m_offiziersauswahl"],
		optionen: () => [
			opt("leistung", "Nach Leistung befördern", beschr(3, 0, "Vertrauen und Bereitschaft, aber weniger Zugriff."), 3, (w) => {
				wirke(w, "offiziersvertrauen", 4);
				wirke(w, "truppenmoral", 2);
				wirke(w, "bereitschaft_heer", 1);
				return "Der Militärrat befördert nach Leistung und Qualifikation.";
			}),
			opt("loyalitaet", "Nach Loyalität befördern", beschr(0, 0, "Rückhalt in der Führung, Misstrauen in der Truppe."), 0, (w) => {
				wirke(w, "offiziersvertrauen", -3);
				wirke(w, "bereitschaft_heer", -1);
				vertrauenAendern(w, .5);
				if (w.spiel) w.spiel.kapital = clamp(w.spiel.kapital + 3, 0, 150);
				return "Der Militärrat befördert Offiziere, die dem Präsidenten nahestehen.";
			}),
			opt("generalstab", "Den Vorschlag des Generalstabs bestätigen", beschr(1, 0, "ruhig, wenig Streit."), 1, (w) => {
				wirke(w, "offiziersvertrauen", 1);
				wirke(w, "truppenmoral", 1);
				return "Der Militärrat bestätigt die Vorschläge des Generalstabs.";
			})
		],
		standard: (w) => {
			wirke(w, "offiziersvertrauen", -1);
			return "Der Rat tagt ohne Ihre Vorgaben; der Generalstab setzt sich durch.";
		}
	},
	{
		id: "infra_bauunfall",
		szene: "anatolien",
		frist: 10,
		abkuehlung: 360,
		chance: (w) => {
			const z = w.spiel?.reich;
			return (z?.laufend ?? []).filter((l) => vorhabenDef(l.id)?.bereich === "infrastruktur").length >= 1 ? .012 + (z && z.verwaltung < 30 ? .02 : 0) : 0;
		},
		erzeuge: (w) => {
			const l = (w.spiel?.reich?.laufend ?? []).map((x) => vorhabenDef(x.id)).find((v) => v?.bereich === "infrastruktur");
			return l ? {
				provinzen: l.provinzen?.slice(0, 1) ?? [],
				staerke: 1,
				daten: { vorhaben: l.id }
			} : null;
		},
		titel: (_, ev) => `Unfall auf der Baustelle „${vorhabenDef(String(ev.daten?.vorhaben))?.name ?? "einer Großbaustelle"}“`,
		text: (_, ev) => [`Auf der Baustelle von „${vorhabenDef(String(ev.daten?.vorhaben))?.name ?? "einem Großprojekt"}“ stürzt ein Gerüst ein; Arbeiter werden verletzt, mehrere sterben. Gewerkschaften und Angehörige fordern Aufklärung.`, "Beim Bau des Istanbuler Flughafens starben offiziell 27 Arbeiter; die Zahl blieb umstritten."],
		warum: () => "Großprojekte werden unter Zeitdruck gebaut; wenn Verwaltung und Aufsicht überlastet sind, zahlen es die Arbeiter.",
		massnahmen: ["m_gewerkschaftsrechte", "m_bauaufsicht"],
		optionen: (_, ev) => [opt("aufklaeren", "Untersuchung und Sicherheitsprogramm", beschr(3, 0, "hilft den Arbeitern, kostet Baufortschritt."), 3, (w) => {
			wirke(w, "arbeitnehmer", 1.5);
			wirke(w, "zivilgesellschaft", .5);
			const l = reichZustand(w).laufend.find((x) => x.id === String(ev.daten?.vorhaben));
			if (l) l.fortschritt = Math.max(0, l.fortschritt - (vorhabenDef(l.id)?.kosten.bau ?? 0) * .03);
			return "Die Baustelle ruht, eine unabhängige Untersuchung beginnt, ein Sicherheitsprogramm folgt.";
		}), opt("decken", "Das Bauunternehmen decken", beschr(0, 0, "Der Bau läuft weiter; die Wut wächst."), 0, (w) => {
			wirke(w, "korruption", 1.5);
			wirke(w, "arbeitnehmer", -3);
			wirke(w, "legitimitaet", -1);
			return "Die Regierung deckt das Bauunternehmen; die Arbeiten laufen weiter.";
		})],
		standard: (w) => {
			wirke(w, "arbeitnehmer", -1.5);
			wirke(w, "legitimitaet", -.5);
			return "Ohne klare Antwort wächst die Wut der Angehörigen und der Gewerkschaften.";
		}
	}
];
//#endregion
//#region game/src/sim/ereignisse-personen.ts
/** Mitglieder der Regierung, die im Amt sind und nicht nur kommissarisch führen. */
function regierung(w) {
	return (w.spiel?.figuren ?? []).filter((f) => f.imAmt && AEMTER[f.amt].regierungsamt && !f.eigen?.kommissarisch);
}
const figurVon = (w, ev) => figurNachId(w, String(ev.daten?.figur ?? ""));
const er = (f) => f?.weiblich ? "sie" : "er";
const Er = (f) => f?.weiblich ? "Sie" : "Er";
const wer = (f) => f ? `${f.rolle} ${f.name}` : "Ein Mitglied der Regierung";
const RUECKTRITT = {
	id: "person_ruecktritt",
	szene: "istanbul",
	frist: 20,
	abkuehlung: 120,
	chance: (w) => regierung(w).some((f) => f.loyalitaet < 25 && eigenVon(w, f).groll >= 30 && (eigenVon(w, f).drohung === void 0 || w.day - eigenVon(w, f).drohung > 150)) ? .25 : 0,
	erzeuge: (w) => {
		const f = regierung(w).sort((a, b) => a.loyalitaet - b.loyalitaet)[0];
		return f ? {
			provinzen: [],
			staerke: 1,
			daten: { figur: f.id }
		} : null;
	},
	eroeffne: (w, ev) => {
		const f = figurVon(w, ev);
		if (f) eigenVon(w, f).drohung = w.day;
	},
	titel: (w, ev) => `${wer(figurVon(w, ev))} droht mit Rücktritt`,
	text: (w, ev) => {
		const f = figurVon(w, ev);
		if (!f) return ["Ein Mitglied der Regierung droht mit Rücktritt."];
		const e = eigenVon(w, f);
		return [`${wer(f)} hat Ihnen ausrichten lassen, dass ${er(f)} unter diesen Bedingungen nicht weiterarbeiten will. Die Loyalität liegt bei ${Math.round(f.loyalitaet)} von 100, ${er(f)} wirkt ${grollWort(e.groll)}.`, sorgeText(w, f)];
	},
	warum: () => "Wer Menschen im Amt hält, die nicht mehr folgen, zahlt mit Leistung; wer sie ziehen lässt, zahlt mit Groll, Märkten und einer Einarbeitung. Wer sie bindet, zahlt mit Kapital.",
	optionen: (w, ev) => {
		const f = figurVon(w, ev);
		return [
			opt("zugestaendnisse", "Zugeständnisse machen", beschr(3, 0, `${Er(f)} bleibt: Loyalität +15, Groll −25; Sie geben Mittel und Freiheit im Ressort.`), 3, (ww) => {
				const g = figurVon(ww, ev);
				if (g) {
					loyalitaetVerschieben(g, 15);
					grollVerschieben(ww, g, -25);
					eigenVon(ww, g).mittelBis = ww.day + 120;
					merke(ww, g, "Nach einer Rücktrittsdrohung mit Zugeständnissen gehalten");
				}
				return `${wer(g)} bleibt; das Ressort bekommt vier Monate lang Zusatzmittel.`;
			}),
			opt("aussprache", "Aussprache unter vier Augen", beschr(1, 0, `${Er(f)} lässt sich halten, aber nur halb: Loyalität +8, Groll −10.`), 1, (ww) => {
				const g = figurVon(ww, ev);
				if (g) {
					loyalitaetVerschieben(g, 8);
					grollVerschieben(ww, g, -10);
					merke(ww, g, "Nach einer Rücktrittsdrohung ausgesprochen");
				}
				return `${wer(g)} bleibt vorerst, aber die Stimmung ist nicht gut.`;
			}),
			opt("annehmen", "Rücktritt annehmen", beschr(0, 0, "Eine kommissarische Leitung übernimmt; der Vorgänger nimmt Groll mit."), 0, (ww) => {
				const g = figurVon(ww, ev);
				if (g) ausscheiden(ww, g, "Rücktritt nach eigener Drohung");
				return `${wer(g)} tritt zurück; eine kommissarische Leitung übernimmt.`;
			})
		];
	},
	standard: (w, ev) => {
		const f = figurVon(w, ev);
		if (f) ausscheiden(w, f, "Rücktritt, nachdem der Präsident nicht geantwortet hat");
		return `${wer(f)} zieht die Konsequenz und tritt zurück; die Regierung wirkt führungslos.`;
	}
};
const VORWURF = {
	finanzen: "bei einer Ausschreibung des Ministeriums einen Bekannten begünstigt zu haben",
	inneres: "Ermittlungen gegen Vertraute des Ressorts behindert zu haben",
	aussen: "vertrauliche Unterlagen aus den Verhandlungen nicht gesichert zu haben",
	stab: "Termine des Präsidenten an Lobbyisten vermittelt zu haben",
	justiz: "auf ein laufendes Verfahren Einfluss genommen zu haben",
	generalstab: "bei einer Beschaffung einen Lieferanten bevorzugt zu haben",
	wirtschaft: "bei der Vergabe von Aufträgen Verwandte bedacht zu haben"
};
const PERSONEN_VORLAGEN = [
	RUECKTRITT,
	{
		id: "person_skandal",
		szene: "istanbul",
		frist: 15,
		abkuehlung: 240,
		chance: (w) => regierung(w).length ? regierung(w).some((f) => f.loyalitaet < 40 || eigenVon(w, f).groll >= 45) ? .012 : .003 : 0,
		erzeuge: (w, rng) => {
			const liste = regierung(w).filter((f) => VORWURF[f.amt]);
			if (!liste.length) return null;
			const gewichte = liste.map((f) => 1 + (100 - f.loyalitaet) / 50 + eigenVon(w, f).groll / 60);
			let r = rng.next() * gewichte.reduce((a, b) => a + b, 0);
			let f = liste[liste.length - 1];
			for (let i = 0; i < liste.length; i++) {
				r -= gewichte[i];
				if (r <= 0) {
					f = liste[i];
					break;
				}
			}
			return {
				provinzen: [],
				staerke: 1,
				daten: { figur: f.id }
			};
		},
		titel: (w, ev) => `Vorwürfe gegen ${wer(figurVon(w, ev))}`,
		text: (w, ev) => {
			const f = figurVon(w, ev);
			if (!f) return ["Gegen ein Mitglied der Regierung werden Vorwürfe laut."];
			return [`Mehrere Zeitungen berichten, ${wer(f)} habe ${VORWURF[f.amt] ?? "Pflichten verletzt"}. ${Er(f)} weist alles zurück, die Opposition fordert Konsequenzen.`, `Ob etwas dran ist, weiß niemand sicher; ${er(f)} hat Ihnen versichert, es sei nichts. Die Loyalität liegt bei ${Math.round(f.loyalitaet)} von 100.`];
		},
		warum: () => "Ein Skandal wird an dem gemessen, was der Präsident tut: Wer stützt, haftet mit; wer fallen lässt, zahlt mit einem Feind und dem Verdacht der Willkür; wer prüfen lässt, braucht Zeit und Mut.",
		optionen: (w, ev) => {
			const f = figurVon(w, ev);
			const wahr = (ww) => hashZahl(`${ww.seed}|skandal|${ev.id}|${f?.id}`) < .45;
			return [
				opt("pruefen", "Untersuchung zulassen", beschr(1, 0, "Klärung in zwei Wochen; ist etwas dran, geht sie; wenn nicht, ist sie rehabilitiert."), 1, (ww) => {
					const g = figurVon(ww, ev);
					if (!g) return "Die Untersuchung läuft ins Leere.";
					vertrauenAendern(ww, .3);
					if (wahr(ww)) {
						ausscheiden(ww, g, "Rücktritt nach bestätigten Vorwürfen");
						return `Die Untersuchung bestätigt die Vorwürfe: ${wer(g)} tritt zurück, Sie haben sauber gehandelt.`;
					}
					loyalitaetVerschieben(g, 12);
					grollVerschieben(ww, g, -10);
					merke(ww, g, "Vorwürfe geprüft und ausgeräumt");
					return `Die Untersuchung entlastet ${wer(g)}: ${er(g)} ist Ihnen dankbar, dass Sie geprüft statt verurteilt haben.`;
				}),
				opt("stuetzen", "Öffentlich stützen", beschr(2, 0, "Loyalität +10; stellt sich später heraus, dass etwas dran war, haften Sie mit."), 2, (ww) => {
					const g = figurVon(ww, ev);
					if (g) {
						loyalitaetVerschieben(g, 10);
						grollVerschieben(ww, g, -10);
					}
					if (wahr(ww)) {
						vertrauenAendern(ww, -1.4);
						wirke(ww, "legitimitaet", -.6);
						return `Wenig später kommt heraus, dass an den Vorwürfen etwas dran war; Sie haben sich blamiert (Vertrauen −1,4).`;
					}
					vertrauenAendern(ww, .2);
					return "Die Vorwürfe verlaufen im Sand; Ihre Rückendeckung hat sich bewährt.";
				}),
				opt("fallenlassen", "Fallen lassen", beschr(0, 0, `${Er(f)} geht sofort; der Verdacht der Willkür bleibt, wenn nichts dran war.`), 0, (ww) => {
					const g = figurVon(ww, ev);
					if (g) ausscheiden(ww, g, "Von Präsidenten fallen gelassen");
					vertrauenAendern(ww, wahr(ww) ? -.2 : -.8);
					return `${wer(g)} muss gehen, ohne dass etwas geklärt wurde.`;
				})
			];
		},
		standard: (w, ev) => {
			vertrauenAendern(w, -1.5);
			const f = figurVon(w, ev);
			if (f) grollVerschieben(w, f, 15);
			return "Der Präsident schweigt; die Presse deutet das als Schwäche, und die betroffene Person fühlt sich im Stich gelassen.";
		}
	},
	{
		id: "person_intrige",
		szene: "parlament",
		frist: 20,
		abkuehlung: 180,
		chance: (w) => regierung(w).some((f) => eigenVon(w, f).ehrgeiz >= 75 && f.loyalitaet < 55) ? .03 : 0,
		erzeuge: (w) => {
			const f = regierung(w).sort((a, b) => eigenVon(w, b).ehrgeiz - eigenVon(w, a).ehrgeiz)[0];
			return f ? {
				provinzen: [],
				staerke: 1,
				daten: { figur: f.id }
			} : null;
		},
		titel: (w, ev) => `${wer(figurVon(w, ev))} sammelt Rückhalt gegen Sie`,
		text: (w, ev) => {
			const f = figurVon(w, ev);
			if (!f) return ["Ein Ehrgeiziger sammelt Rückhalt."];
			const e = eigenVon(w, f);
			return [`Aus der Fraktion hört man, dass ${wer(f)} ${er(f)} in Hintergrundgesprächen als die bessere Wahl für die Führung ins Spiel bringt. Der Ehrgeiz liegt bei ${Math.round(e.ehrgeiz)} von 100, die Loyalität bei ${Math.round(f.loyalitaet)}.`, `Noch ist es nur Gerede; wer jetzt nichts tut, riskiert, dass daraus eine Hausmacht wird.`];
		},
		warum: () => "Ehrgeizige, die nicht eingebunden werden, suchen sich andere Aufgaben. Einbinden kostet Mittel, Ausbooten kostet einen Feind, Abwarten kostet Ruhe.",
		optionen: (w, ev) => {
			const f = figurVon(w, ev);
			return [
				opt("einbinden", "Einbinden: mehr Mittel und Verantwortung", beschr(3, 0, `${Er(f)} lässt vom Ehrgeiz ab, solange die Anerkennung reicht: Loyalität +12, Ehrgeiz −8, Zusatzmittel.`), 3, (ww) => {
					const g = figurVon(ww, ev);
					if (g) {
						const e = eigenVon(ww, g);
						loyalitaetVerschieben(g, 12);
						e.ehrgeiz = Math.max(0, e.ehrgeiz - 8);
						e.mittelBis = ww.day + 150;
						grollVerschieben(ww, g, -15);
						merke(ww, g, "Nach Machtspielen eingebunden");
					}
					return `${wer(g)} bekommt mehr Mittel und Verantwortung; das Gerede verstummt vorerst.`;
				}),
				opt("entlassen", "Entfernen", beschr(2, 0, `${Er(f)} verlässt das Amt; der Groll ist groß, und ein Nachfolger muss her.`), 2, (ww) => {
					const g = figurVon(ww, ev);
					if (g) ausscheiden(ww, g, "Von Präsidenten wegen Machtspielen entfernt");
					return `${wer(g)} wird aus dem Amt gedrängt; eine kommissarische Leitung übernimmt.`;
				}),
				opt("beobachten", "Beobachten", beschr(0, 0, "Kein Streit, aber der Ehrgeiz merkt, dass Sie nicht handeln."), 0, (ww) => {
					const g = figurVon(ww, ev);
					if (g) {
						loyalitaetVerschieben(g, -4);
						grollVerschieben(ww, g, 10);
					}
					return `Sie lassen ${wer(g)} gewähren; ${er(g)} sammelt weiter.`;
				})
			];
		},
		standard: (w, ev) => {
			const f = figurVon(w, ev);
			if (f) {
				loyalitaetVerschieben(f, -5);
				grollVerschieben(w, f, 12);
			}
			vertrauenAendern(w, -.4);
			return "Ohne Reaktion des Präsidenten wächst die Hausmacht; die Zeitungen sprechen von einem Machtkampf.";
		}
	},
	{
		id: "person_leck",
		szene: "istanbul",
		frist: 12,
		abkuehlung: 150,
		chance: (w) => regierung(w).some((f) => eigenVon(w, f).groll >= 60) ? .06 : 0,
		erzeuge: (w) => {
			const f = regierung(w).sort((a, b) => eigenVon(w, b).groll - eigenVon(w, a).groll)[0];
			return f ? {
				provinzen: [],
				staerke: 1,
				daten: { figur: f.id }
			} : null;
		},
		titel: () => "Aus dem Kabinett dringt etwas durch",
		text: (w, ev) => {
			const f = figurVon(w, ev);
			return ["Ein vertrauliches Gespräch aus der Regierung steht in der Zeitung: Zitate, Zahlen, ein Streit um den Kurs. Wer geredet hat, weiß niemand.", f ? `Verdächtig ist, wer verärgert ist: Bei ${wer(f)} liegt der Groll bei ${Math.round(eigenVon(w, f).groll)} von 100.` : "Verdächtig ist, wer verärgert ist."];
		},
		warum: () => "Wer verärgert wird und nichts zu verlieren hat, redet. Eine Suche nach der Quelle kostet Vertrauen im Kabinett, Schweigen kostet Vertrauen im Land.",
		optionen: (w, ev) => {
			const f = figurVon(w, ev);
			return [
				opt("dementieren", "Dementieren und Geschlossenheit beschwören", beschr(1, 0, "Die Presse bohrt weiter, aber das Kabinett fühlt sich nicht verdächtigt."), 1, (ww) => {
					vertrauenAendern(ww, -.5);
					return "Die Regierung dementiert; die Zeitung bleibt bei ihrer Darstellung.";
				}),
				opt("quelle", "Die Quelle suchen", beschr(2, 0, `Sie stellen ${wer(f)} zur Rede: Loyalität −8, Groll +8, aber das Leck versiegt.`), 2, (ww) => {
					const g = figurVon(ww, ev);
					if (g) {
						loyalitaetVerschieben(g, -8);
						grollVerschieben(ww, g, 8);
						merke(ww, g, "Nach einem Leck zur Rede gestellt");
					}
					vertrauenAendern(ww, -.2);
					return `${wer(g)} bestreitet alles; das Leck bleibt danach aus, das Misstrauen im Kabinett nicht.`;
				}),
				opt("aussitzen", "Aussitzen", beschr(0, 0, "Kostet nichts, aber die Geschichte wächst."), 0, (ww) => {
					vertrauenAendern(ww, -1.2);
					const g = figurVon(ww, ev);
					if (g) grollVerschieben(ww, g, 4);
					return "Die Regierung schweigt; die Zeitung legt nach.";
				})
			];
		},
		standard: (w) => {
			vertrauenAendern(w, -1.5);
			return "Ohne Reaktion wird das Leck zum Dauerthema: Der Eindruck eines zerstrittenen Kabinetts bleibt.";
		}
	}
];
/** Die zweite Hälfte einer Amtszeit ist rauer: Krisen werden häufiger, je länger man regiert (Regierungsalter). Nur Krisen aus der Außenwelt und der Wirtschaft. */
const ALTERSKRISEN = /* @__PURE__ */ new Set([
	"weltwirtschaftskrise",
	"pandemie",
	"waehrungsrutsch",
	"energiepreisschock",
	"haushaltsdruck",
	"bankenstress"
]);
function alterFaktor(world, id) {
	if (!ALTERSKRISEN.has(id)) return 1;
	const jahre = world.day / 365;
	return 1 + Math.min(1.2, .18 * Math.max(0, jahre - 1.5));
}
/** Feste Termine des Staatsjahres: Sie kommen immer und zählen nicht zur Dichte. */
const TERMINE = /* @__PURE__ */ new Set([
	"mindestlohn",
	"haushaltsjahr",
	"kommunalwahl",
	"zusage",
	"koalitionsangebot"
]);
/** Ab so vielen Ereignissen in zwölf Monaten (offen oder entschieden) werden neue seltener: Das Spiel soll fordern, nicht zuschütten. */
const DICHTE_SCHWELLE = 6;
function dichteFaktor(world, id) {
	if (TERMINE.has(id) || id.startsWith("start_")) return 1;
	const sp = world.spiel;
	if (!sp) return 1;
	const grenze = world.day - 365;
	let n = sp.ereignisse.filter((e) => !TERMINE.has(e.vorlage) && !e.vorlage.startsWith("start_")).length;
	for (let i = sp.chronik.length - 1; i >= 0; i--) {
		const c = sp.chronik[i];
		if (c.tag < grenze) break;
		if (!/^(Wirkungsbericht|Schritt erreicht|Programm erfüllt|Der Mindestlohn|Der Haushalt für|Kommunalwahlen|Zusage fällig)/.test(c.titel)) n++;
	}
	return n <= DICHTE_SCHWELLE ? 1 : Math.max(.3, 1 - .14 * (n - DICHTE_SCHWELLE));
}
const ERDBEBEN = {
	id: "erdbeben",
	szene: "anatolien",
	frist: 7,
	abkuehlung: 240,
	chance: () => .028,
	erzeuge: (w, rng) => {
		const p = ziehe(rng, (pl) => (SEISMIC.has(pl) ? 1 : .05) * wertIn(w, "p_erdbebengefahr", [pl]) ** 2, 1);
		if (!p.length) return null;
		const staerke = rng.next() ** 1.5 * .65 + .35;
		const vorsorge = (wertIn(w, "erdbebenvorsorge", p) + wertIn(w, "bauqualitaet", p)) / 200;
		const schaden = clamp(staerke * (1.25 - .8 * vorsorge), .05, 1);
		return {
			provinzen: p,
			staerke,
			daten: {
				mag: 5.6 + 1.9 * staerke,
				schaden,
				vorsorge
			}
		};
	},
	titel: (_, ev) => `Erdbeben in ${namen(ev.provinzen)}`,
	text: (w, ev) => {
		const s = dk(ev, "schaden");
		const wort = s < .3 ? "Schäden an einzelnen Gebäuden" : s < .6 ? "schwere Schäden in mehreren Stadtvierteln" : "eingestürzte Häuser und viele Menschen ohne Obdach";
		return [`Ein Erdbeben der Stärke ${nf$4(dk(ev, "mag"))} erschüttert ${namen(ev.provinzen)} (${einwohner(ev.provinzen).toLocaleString("de-DE")} Einwohner). Gemeldet werden ${wort}.`, `${anrede(figur(w, "inneres"))} bittet um Ihre Anweisungen. Die Rettungskräfte sind unterwegs; die Frage ist, wie der Staat in den nächsten Wochen und Monaten auftritt.`];
	},
	warum: (_, ev) => `Wie schwer es trifft, hängt an Bauqualität und Erdbebenvorsorge der Provinz (hier ${nf$4(dk(ev, "vorsorge") * 100, 0)} von 100). Alte Häuser und schwache Bauaufsicht machen den Unterschied.`,
	eroeffne: (w, ev) => {
		const s = dk(ev, "schaden");
		wirke(w, "wohnungsbau", -10 * s, ev.provinzen);
		wirke(w, "bauwirtschaft", -4 * s, ev.provinzen);
		wirke(w, "p_wohnungsnot", 12 * s, ev.provinzen);
		wirke(w, "lebenshaltung", 4 * s, ev.provinzen);
		vertrauenAendern(w, -2 * s);
	},
	optionen: (_, ev) => {
		const s = dk(ev, "schaden");
		return [
			opt("fonds", "Notstand und Wiederaufbaufonds", `Kostet ${nf$4(.5 * s + .1)} % des BIP und 8 Kapital; schnelle Aufträge machen Korruption wahrscheinlicher.`, 8, (w) => {
				kosten(w, .5 * s + .1);
				wirke(w, "wohnungsbau", 8 * s, ev.provinzen);
				wirke(w, "p_wohnungsnot", -8 * s, ev.provinzen);
				wirke(w, "korruption", 2 * s + 1);
				vertrauenAendern(w, 3.5 * s);
				return "Ein Wiederaufbaufonds wird aufgelegt; die Aufträge laufen schnell, aber nicht überall sauber.";
			}),
			opt("nothilfe", "Nur Nothilfe und Zelte", `Kostet ${nf$4(.1 * s + .03)} % des BIP und 2 Kapital; der Wiederaufbau bleibt Sache der Provinz.`, 2, (w) => {
				kosten(w, .1 * s + .03);
				vertrauenAendern(w, -1 * s);
				return "Der Staat leistet Nothilfe und überlässt den Wiederaufbau den Betroffenen und der Provinz.";
			}),
			opt("untersuchung", "Bauaufsicht und Bauunternehmer untersuchen", `Kostet 5 Kapital und ${nf$4(.15 * s + .05)} % des BIP; ehrlich, aber nicht schnell.`, 5, (w) => {
				kosten(w, .15 * s + .05);
				wirke(w, "erdbebenvorsorge", 3);
				wirke(w, "bauqualitaet", 2);
				wirke(w, "korruption", -2);
				vertrauenAendern(w, 1.5 * (1 - dk(ev, "vorsorge")));
				return "Eine Untersuchung der Bauaufsicht beginnt; Bauunternehmer und Kommunen geraten unter Druck.";
			})
		];
	},
	standard: (w, ev) => {
		kosten(w, .05);
		vertrauenAendern(w, -2.5 * dk(ev, "schaden"));
		wirke(w, "p_wohnungsnot", 3 * dk(ev, "schaden"), ev.provinzen);
		return "Der Staat reagiert zu spät; die Betroffenen fühlen sich allein gelassen.";
	}
};
const DUERRE = {
	id: "duerre",
	szene: "anatolien",
	frist: 10,
	abkuehlung: 300,
	chance: (w) => sommer(w) ? .06 * (.6 + nationalAverage(NET, w.net, "duerre") / 60) : 0,
	erzeuge: (w, rng) => {
		const p = ziehe(rng, (pl) => wertIn(w, "p_wassermangel", [pl]) ** 3, 4);
		if (!p.length) return null;
		return {
			provinzen: p,
			staerke: .4 + .6 * rng.next()
		};
	},
	titel: () => "Dürre",
	text: (w, ev) => [`Seit Wochen fällt in ${namen(ev.provinzen)} kaum Regen. Die Getreideernte ist gefährdet, die Talsperren sind halb leer.`, `Der Bauernverband fordert Hilfe; in den Städten wird über Wasserrationierung geredet. ${anrede(figur(w, "finanzen"))} erinnert an die Haushaltslage.`],
	warum: () => "Wasserversorgung, Bewässerung und Talsperren entscheiden, ob aus einer trockenen Saison eine Krise wird.",
	eroeffne: (w, ev) => {
		wirke(w, "ernte", -8 * ev.staerke, ev.provinzen);
		wirke(w, "lebensmittelpreise", 6 * ev.staerke, ev.provinzen);
		wirke(w, "landwirtschaft_einkommen", -6 * ev.staerke, ev.provinzen);
	},
	optionen: (_, ev) => [
		opt("hilfe", "Soforthilfe für Landwirte", `Kostet ${nf$4(.12)} % des BIP und 3 Kapital.`, 3, (w) => {
			kosten(w, .12);
			wirke(w, "landwirtschaft_einkommen", 5 * ev.staerke, ev.provinzen);
			wirke(w, "ernte", 3 * ev.staerke, ev.provinzen);
			return "Landwirte erhalten Soforthilfe und Wassertransporte.";
		}),
		opt("import", "Getreide importieren", `Kostet ${nf$4(.08)} % des BIP und 2 Kapital; dämpft Preise, drückt aber die Erzeuger.`, 2, (w) => {
			kosten(w, .08);
			wirke(w, "lebensmittelpreise", -5 * ev.staerke, ev.provinzen);
			wirke(w, "landwirtschaft_einkommen", -2 * ev.staerke, ev.provinzen);
			return "Getreide wird importiert; die Preise beruhigen sich, die Bauern murren.";
		}),
		opt("rationieren", "Trinkwasser in den Städten rationieren", "Kostet 3 Kapital und Vertrauen; verhindert Schlimmeres.", 3, (w) => {
			vertrauenAendern(w, -1.5 * ev.staerke);
			wirke(w, "wasserversorgung", 3, ev.provinzen);
			return "Das Wasser wird rationiert; das ist unbeliebt, aber die Versorgung hält.";
		})
	],
	standard: (w, ev) => {
		wirke(w, "ernte", -4 * ev.staerke, ev.provinzen);
		wirke(w, "wasserversorgung", -4 * ev.staerke, ev.provinzen);
		vertrauenAendern(w, -2 * ev.staerke);
		return "Ohne Entscheidung verschärft sich die Lage: Ernten fallen aus, Wasser wird knapp.";
	}
};
const WAEHRUNG = {
	id: "waehrungsrutsch",
	szene: "bank",
	frist: 5,
	abkuehlung: 240,
	chance: (w) => {
		const h = w.history;
		const letzter = h[h.length - 1];
		const davor = h[h.length - 2];
		return (letzter && davor ? (letzter.usdTry / davor.usdTry - 1) * 100 : 0) > 6 || w.economy.riskPremium > 420 ? .5 : .006;
	},
	erzeuge: () => ({
		provinzen: [],
		staerke: 1
	}),
	titel: () => "Die Lira rutscht",
	text: (w) => [`Die Lira verliert an den Märkten schnell an Wert (${nf$4(w.economy.usdTry)} je Dollar); der Risikoaufschlag liegt bei ${nf$4(w.economy.riskPremium, 0)} Basispunkten.`, `${anrede(figur(w, "finanzen"))} und ${anrede(figur(w, "zentralbank"))} warten auf ein Signal. Die Zinsen legt die Zentralbank fest, nicht der Präsident.`],
	warum: () => "Die Währung reagiert auf Inflationsabstand, Zinsen, Risikoaufschlag und Vertrauen. Kurzfristige Eingriffe kaufen Zeit, lösen die Ursache aber nicht.",
	optionen: () => [
		opt("reserven", "Devisenreserven einsetzen", "Kostet 3 Kapital; stützt die Lira kurz, die Reserven sinken.", 3, (w) => {
			w.economy.usdTry *= .96;
			w.economy.eurTry *= .96;
			w.economy.riskPremium += 20;
			w.economy.credibility = clamp(w.economy.credibility - .02, .05, .95);
			return "Die Zentralbank verkauft Reserven; die Lira erholt sich kurz.";
		}),
		opt("kapital", "Kapitalverkehr beschränken", "Kostet 6 Kapital; stützt die Lira stark, schreckt aber Investoren ab und fördert den Schwarzmarkt.", 6, (w) => {
			w.economy.usdTry *= .93;
			w.economy.eurTry *= .93;
			w.economy.credibility = clamp(w.economy.credibility - .06, .05, .95);
			wirke(w, "auslandskapital", -8);
			wirke(w, "schattenwirtschaft", 5);
			wirke(w, "vertrauen_maerkte", -8);
			return "Der Kapitalverkehr wird beschränkt; die Lira stabilisiert sich, das Ausland zieht sich zurück.";
		}),
		opt("ruhe", "Ruhe bewahren und die Zentralbank stützen", "Kostet 2 Kapital; hilft langfristig, kurzfristig bleibt der Druck.", 2, (w) => {
			w.economy.credibility = clamp(w.economy.credibility + .02, .05, .95);
			w.economy.riskPremium -= 10;
			const g = figur(w, "zentralbank");
			if (g) g.loyalitaet = Math.min(100, g.loyalitaet + 6);
			return "Der Präsident bekennt sich öffentlich zur Unabhängigkeit der Zentralbank.";
		})
	],
	standard: (w) => {
		w.economy.riskPremium += 30;
		w.economy.usdTry *= 1.03;
		w.economy.eurTry *= 1.03;
		w.economy.credibility = clamp(w.economy.credibility - .03, .05, .95);
		return "Ohne Signal setzt sich der Abverkauf fort.";
	}
};
const ENERGIE = {
	id: "energiepreisschock",
	szene: "istanbul",
	frist: 10,
	abkuehlung: 240,
	chance: (w) => (w.economy.oel ?? 100) > 128 ? .6 : 0,
	erzeuge: () => ({
		provinzen: [],
		staerke: 1
	}),
	titel: () => "Energiepreise steigen",
	text: (w) => [`Der Energiepreis am Weltmarkt liegt ${nf$4((w.economy.oel ?? 100) - 100, 0)} Prozent über dem Normalstand. Die Türkei importiert den größten Teil ihrer Energie.`, "Strom-, Gas- und Benzinrechnungen steigen. Die Opposition spricht vom Winter der leeren Portemonnaies."],
	warum: () => "Energieimporte belasten Handelsbilanz, Lira und Inflation gleichzeitig; Subventionen dämpfen die Rechnung und kosten den Haushalt.",
	eroeffne: (w) => {
		wirke(w, "energiepreise", 6);
		wirke(w, "lebenshaltung", 3);
	},
	optionen: () => [
		opt("deckel", "Preise deckeln (Subventionen)", "Kostet 0,4 % des BIP und 3 Kapital; entlastet Haushalte, belastet den Staat.", 3, (w) => {
			kosten(w, .4);
			wirke(w, "energiepreise", -6);
			wirke(w, "lebenshaltung", -3);
			return "Energiepreise werden gedeckelt; der Staat trägt die Differenz.";
		}),
		opt("haerte", "Preise durchlassen, Härtefälle stützen", "Kostet 0,15 % des BIP und 2 Kapital; ehrlich, aber schmerzhaft.", 2, (w) => {
			kosten(w, .15);
			wirke(w, "lebenshaltung", 1);
			vertrauenAendern(w, -1.5);
			return "Die Preise werden durchgereicht; Härtefälle erhalten Zuschüsse.";
		}),
		opt("sparen", "Sparappell und Tempolimit", "Kostet 2 Kapital; wirkt wenig, kostet wenig.", 2, (w) => {
			wirke(w, "energieimporte", -2);
			vertrauenAendern(w, -.5);
			return "Ein Sparappell geht an Haushalte und Betriebe.";
		})
	],
	standard: (w) => {
		vertrauenAendern(w, -2);
		wirke(w, "lebenshaltung", 2);
		return "Die Preise steigen ungebremst; der Unmut wächst.";
	}
};
const HAUSHALT = {
	id: "haushaltsdruck",
	szene: "bank",
	frist: 12,
	abkuehlung: 400,
	chance: (w) => w.economy.riskPremium > 450 || w.economy.debtRatio > 45 ? .4 : 0,
	erzeuge: () => ({
		provinzen: [],
		staerke: 1
	}),
	titel: () => "Die Ratingagenturen drohen",
	text: (w) => [`Mehrere Ratingagenturen kündigen eine Herabstufung an: Die Schuldenquote liegt bei ${nf$4(w.economy.debtRatio)} % des BIP, der Risikoaufschlag bei ${nf$4(w.economy.riskPremium, 0)} Basispunkten.`, `${anrede(figur(w, "finanzen"))} verlangt ein Signal, dass der Haushalt gesteuert wird.`],
	warum: () => "Höhere Risikoaufschläge machen Kredite teurer; wer den Haushalt nicht im Griff hat, zahlt dafür mit Zinsen und einer schwachen Währung.",
	optionen: () => [
		opt("sparpaket", "Sparpaket", "Kostet 6 Kapital und Vertrauen; beruhigt die Märkte, der Finanzminister ist zufrieden.", 6, (w) => {
			setFiscalImpulse(w, w.economy.fiscalImpulse - 1.5);
			wirke(w, "vertrauen_maerkte", 6);
			vertrauenAendern(w, -3);
			const f = figur(w, "finanzen");
			if (f) f.loyalitaet = Math.min(100, f.loyalitaet + 8);
			return "Ein Sparpaket wird angekündigt; die Märkte atmen auf, das Land murrt.";
		}),
		opt("steuer", "Steuern anheben", "Kostet 6 Kapital; bringt Einnahmen, trifft die Haushalte.", 6, (w) => {
			w.economy.debtRatio -= .6;
			wirke(w, "steuereinnahmen", 4);
			wirke(w, "lebenshaltung", 3);
			vertrauenAendern(w, -2);
			return "Steuern werden angehoben; das Loch im Haushalt wird kleiner.";
		}),
		opt("wachstum", "Auf Wachstum setzen", "Kostet nichts, aber die Märkte glauben es nicht.", 0, (w) => {
			w.economy.riskPremium += 40;
			return "Der Präsident verspricht, aus den Problemen herauszuwachsen; die Märkte sind skeptisch.";
		})
	],
	standard: (w) => {
		w.economy.riskPremium += 50;
		w.economy.credibility = clamp(w.economy.credibility - .03, .05, .95);
		return "Die Agenturen stufen das Land herab; Kredite werden teurer.";
	}
};
/** Vier Geschichten mit demselben Kern: öffentliches Geld, kein Wettbewerb, Nähe zur Regierung. Die Variante wird beim Eintreten gezogen, damit sich Affären nicht wie Kopien lesen. */
const AFFAEREN = [
	{
		titel: "Eine Vergabeaffäre",
		text: "Ein Bericht deckt auf, dass ein großer Bauauftrag ohne echte Ausschreibung an eine Firma mit Nähe zur Regierung ging."
	},
	{
		titel: "Ein Beschaffungsskandal",
		text: "Eine Zeitung veröffentlicht Unterlagen, nach denen das Verteidigungsministerium Ausrüstung zu weit überhöhten Preisen bei einem einzigen Lieferanten bestellt hat."
	},
	{
		titel: "Klinikeinkauf unter Verdacht",
		text: "Der Rechnungshof beanstandet, dass ein Krankenhausverbund Geräte und Medikamente über einen Zwischenhändler bezogen hat, der einem Parteifreund gehört."
	},
	{
		titel: "Fragwürdige Energieverträge",
		text: "Ein Untersuchungsausschuss der Opposition legt Verträge vor, nach denen ein staatlicher Versorger Strom aus Anlagen eines Regierungsnahen zu festen Preisen abnehmen muss."
	}
];
const KORRUPTION = {
	id: "korruptionsaffaere",
	szene: "parlament",
	frist: 10,
	abkuehlung: 420,
	chance: (w) => .03 * (.5 + nationalAverage(NET, w.net, "korruption") / 50) * (w.player?.partner.includes("Bauunternehmer") ? 1.6 : 1),
	erzeuge: (w, rng) => {
		const alter = AFFAEREN.map((_, i) => w.spiel?.zuletzt[`korruptionsaffaere#${i}`] ?? -1e9);
		const aelteste = Math.min(...alter);
		const kandidaten = alter.flatMap((t, i) => t === aelteste ? [i] : []);
		return {
			provinzen: [],
			staerke: 1,
			daten: { variante: kandidaten[Math.floor(rng.next() * kandidaten.length)] }
		};
	},
	eroeffne: (w, ev) => {
		if (w.spiel) w.spiel.zuletzt[`korruptionsaffaere#${Number(ev.daten?.variante ?? 0)}`] = w.day;
	},
	titel: (_w, ev) => AFFAEREN[Number(ev.daten?.variante ?? 0)]?.titel ?? AFFAEREN[0].titel,
	text: (w, ev) => {
		const v = Number(ev.daten?.variante ?? 0);
		return [v === 0 && w.player?.partner.includes("Bauunternehmer") ? "Ein Bericht deckt auf, dass eine Baufirma aus dem Umfeld Ihrer Familie einen staatlichen Auftrag ohne echte Ausschreibung erhalten hat." : AFFAEREN[v]?.text ?? AFFAEREN[0].text, `${anrede(figur(w, "stab"))} rät zu einer schnellen Entscheidung, bevor die Opposition die Geschichte bestimmt.`];
	},
	warum: () => "Korruption entsteht aus schwacher Kontrolle, Zeitdruck und Nähe. Sie schadet dem Vertrauen und lässt sich nicht einfach wegwischen.",
	optionen: () => [
		opt("aufklaeren", "Untersuchung zulassen", "Kostet 3 Kapital und kurzfristig Vertrauen; zahlt sich später aus.", 3, (w) => {
			vertrauenAendern(w, -2);
			wirke(w, "korruption", -4);
			wirke(w, "justizvertrauen", 2);
			return "Eine unabhängige Untersuchung wird zugelassen.";
		}),
		opt("abwiegeln", "Abwiegeln", "Kostet 1 Kapital; die Geschichte bleibt und wächst.", 1, (w) => {
			vertrauenAendern(w, -3);
			wirke(w, "korruption", 2);
			wirke(w, "pressefreiheit", -1);
			return "Die Regierung weist die Vorwürfe zurück; die Presse bohrt weiter.";
		}),
		opt("opfern", "Einen Verantwortlichen fallen lassen", "Kostet 4 Kapital; ein Kabinettsmitglied verliert das Amt.", 4, (w, _e, rng) => {
			vertrauenAendern(w, -.5);
			const opfer = rng.next() < .5 ? "inneres" : "aussen";
			const alt = figur(w, opfer);
			const name = alt ? anrede(alt) : "Ein Verantwortlicher";
			ersetze(w, opfer, rng);
			return `${name} tritt zurück; die Affäre verliert an Schärfe.`;
		})
	],
	standard: (w) => {
		vertrauenAendern(w, -3);
		wirke(w, "korruption", 3);
		return "Die Affäre wächst; der Eindruck von Vertuschung bleibt hängen.";
	}
};
const STREIK = {
	id: "streikwelle",
	szene: "istanbul",
	frist: 10,
	abkuehlung: 240,
	chance: (w) => akutIn(w, "p_streiks").length > 0 ? .15 : w.economy.inflation > 25 && nationalAverage(NET, w.net, "realeinkommen") < 48 ? .08 : .008,
	erzeuge: (w, rng) => {
		const p = ziehe(rng, (pl) => wertIn(w, "streikneigung", [pl]) ** 2 * (PROVINZEN[pl - 1]?.grossstadt ? 2 : 1), 3);
		return p.length ? {
			provinzen: p,
			staerke: .5 + .5 * rng.next()
		} : null;
	},
	titel: () => "Streikwelle",
	text: (w, ev) => [`In ${namen(ev.provinzen)} legen Beschäftigte die Arbeit nieder. Die Löhne halten mit den Preisen nicht Schritt (Inflation ${nf$4(w.published.inflation.value)} %).`, "Die Gewerkschaften fordern einen Inflationsausgleich; die Unternehmen warnen vor Kosten und Entlassungen."],
	warum: () => "Wenn Preise schneller steigen als Löhne, wächst die Streikbereitschaft. Lohnzugeständnisse dämpfen sie, treiben aber die Kosten der Betriebe und damit die Inflation.",
	eroeffne: (w, ev) => {
		wirke(w, "produktivitaet", -3 * ev.staerke, ev.provinzen);
		wirke(w, "streikneigung", 4 * ev.staerke, ev.provinzen);
	},
	optionen: (_, ev) => [
		opt("lohn", "Lohnzugeständnis", "Kostet 3 Kapital und 0,2 % des BIP; beruhigt die Beschäftigten, treibt den Kostendruck.", 3, (w) => {
			kosten(w, .2);
			wirke(w, "streikneigung", -8 * ev.staerke, ev.provinzen);
			wirke(w, "arbeitnehmer", 4, ev.provinzen);
			wirke(w, "kostendruck", 3);
			return "Der Staat gibt beim Lohn nach; die Streiks enden, die Betriebe ächzen.";
		}),
		opt("verbot", "Streiks verbieten", "Kostet 5 Kapital; unterdrückt kurz, vertieft die Spaltung.", 5, (w) => {
			wirke(w, "streikneigung", -5 * ev.staerke, ev.provinzen);
			wirke(w, "polarisierung", 6);
			wirke(w, "rechtssicherheit", -4);
			wirke(w, "arbeitnehmer", -6);
			return "Die Streiks werden verboten; die Gewerkschaften sprechen von einem Angriff auf ihre Rechte.";
		}),
		opt("vermitteln", "Vermitteln", "Kostet 3 Kapital; ein Kompromiss, den keiner feiert.", 3, (w) => {
			wirke(w, "streikneigung", -4 * ev.staerke, ev.provinzen);
			wirke(w, "arbeitnehmer", 1);
			wirke(w, "unternehmer", -1);
			return "Eine Schlichtung bringt einen Kompromiss.";
		})
	],
	standard: (w, ev) => {
		wirke(w, "produktivitaet", -3 * ev.staerke, ev.provinzen);
		vertrauenAendern(w, -1.5);
		return "Die Streiks dauern an; Produktion und Vertrauen leiden.";
	}
};
const MIETE = {
	id: "mietproteste",
	szene: "istanbul",
	frist: 10,
	abkuehlung: 300,
	chance: (w) => akutIn(w, "p_wohnungsnot").length > 0 ? .12 : .005,
	erzeuge: (w, rng) => {
		const akut = akutIn(w, "p_wohnungsnot");
		const p = ziehe(rng, (pl) => akut.includes(pl) ? PROVINZEN[pl - 1]?.bevoelkerung ?? 0 : 0, 2);
		return p.length ? {
			provinzen: p,
			staerke: .5 + .5 * rng.next()
		} : null;
	},
	titel: () => "Mietproteste",
	text: (_, ev) => [`In ${namen(ev.provinzen)} gehen Tausende Mieterinnen und Mieter auf die Straße: Die Mieten fressen die Einkommen auf.`, "Vermieter und Bauunternehmer warnen, dass Eingriffe den Neubau abwürgen."],
	warum: () => "Hohe Mieten sind Angebot und Nachfrage in der Stadt; ein Deckel entlastet sofort, schmälert aber auf Dauer den Neubau.",
	eroeffne: (w, ev) => {
		wirke(w, "junge", -3 * ev.staerke, ev.provinzen);
		wirke(w, "staedtische_saekulare", -2 * ev.staerke, ev.provinzen);
	},
	optionen: (_, ev) => [
		opt("deckel", "Mieten deckeln", "Kostet 4 Kapital; wirkt sofort, bremst den Neubau.", 4, (w) => {
			wirke(w, "mieten", -6 * ev.staerke, ev.provinzen);
			wirke(w, "wohnungsbau", -3, ev.provinzen);
			wirke(w, "unternehmer", -2);
			return "Die Mieten werden gedeckelt; Bauinvestoren ziehen sich zurück.";
		}),
		opt("sozial", "Sozialwohnungen versprechen", "Kostet 3 Kapital und 0,2 % des BIP; die Wirkung kommt spät.", 3, (w) => {
			kosten(w, .2);
			wirke(w, "p_wohnungsnot", -3 * ev.staerke, ev.provinzen);
			wirke(w, "junge", 3, ev.provinzen);
			return "Ein Sozialwohnungsprogramm wird angekündigt.";
		}),
		opt("raeumen", "Proteste auflösen", "Kostet 2 Kapital; verschärft die Fronten.", 2, (w) => {
			wirke(w, "polarisierung", 5);
			wirke(w, "pressefreiheit", -2);
			wirke(w, "junge", -5, ev.provinzen);
			wirke(w, "staedtische_saekulare", -5, ev.provinzen);
			return "Die Polizei löst die Proteste auf; die Wut bleibt.";
		})
	],
	standard: (w, ev) => {
		wirke(w, "junge", -3 * ev.staerke, ev.provinzen);
		vertrauenAendern(w, -1);
		return "Die Proteste wachsen; niemand fühlt sich zuständig.";
	}
};
const FLUECHTLINGE = {
	id: "fluechtlingswelle",
	szene: "anatolien",
	frist: 10,
	abkuehlung: 400,
	chance: () => .018,
	erzeuge: (_, rng) => ({
		provinzen: [.../* @__PURE__ */ new Set([31, ...[...BORDER].filter(() => rng.next() < .6).slice(0, 3)])],
		staerke: .4 + .6 * rng.next()
	}),
	titel: () => "Neue Fluchtbewegung an der Grenze",
	text: (w, ev) => [`An der Südgrenze kommen wieder mehr Menschen an, vor allem aus Syrien, und sie bleiben zuerst in ${namen([...new Set(ev.provinzen)])}. Die Provinzen sind ohnehin belastet.`, `${anrede(figur(w, "inneres"))} und ${anrede(figur(w, "aussen"))} sind sich nicht einig, was zu tun ist.`],
	warum: () => "Migration verbindet Innen-, Außen- und Wirtschaftspolitik: Grenzschutz, Aufnahme, Integration und Verhandlungen mit der EU kosten jeweils etwas anderes.",
	eroeffne: (w, ev) => {
		wirke(w, "gefluechtete", 6 * ev.staerke, ev.provinzen);
		wirke(w, "p_migrationsdruck", 5 * ev.staerke, ev.provinzen);
	},
	optionen: (_, ev) => [
		opt("grenze", "Grenze sichern (Erlass)", "Kostet 4 Kapital; weniger Ankünfte, Kritik von Menschenrechtlern.", 4, (w) => {
			wirke(w, "gefluechtete", -5 * ev.staerke, ev.provinzen);
			wirke(w, "beziehungen_eu", 2);
			wirke(w, "konservative", 2);
			return "Die Grenze wird stärker gesichert; die Ankünfte gehen zurück.";
		}),
		opt("aufnehmen", "Aufnehmen und integrieren", "Kostet 3 Kapital und 0,25 % des BIP; menschlich, aber politisch riskant.", 3, (w) => {
			kosten(w, .25);
			wirke(w, "beziehungen_eu", 3);
			wirke(w, "p_migrationsdruck", 4 * ev.staerke, ev.provinzen);
			wirke(w, "konservative", -2);
			return "Die Menschen werden aufgenommen; die Provinzen bekommen Unterstützung, die Stimmung bleibt gespalten.";
		}),
		opt("eu", "Mit der EU verhandeln", "Kostet 5 Kapital; wenn es klappt, zahlt die EU.", 5, (w) => {
			w.economy.debtRatio -= .1;
			wirke(w, "beziehungen_eu", 2);
			wirke(w, "gefluechtete", 3 * ev.staerke, ev.provinzen);
			return "Eine Vereinbarung mit der EU bringt Geld für die Grenzprovinzen.";
		})
	],
	standard: (w, ev) => {
		wirke(w, "p_migrationsdruck", 6 * ev.staerke, ev.provinzen);
		vertrauenAendern(w, -1);
		return "Ohne Entscheidung wächst der Druck in den Grenzprovinzen.";
	}
};
const ANSCHLAG = {
	id: "anschlag",
	szene: "istanbul",
	frist: 5,
	abkuehlung: 360,
	chance: (w) => .012 * (nationalAverage(NET, w.net, "terrorgefahr") / 50),
	erzeuge: (_, rng) => {
		const p = ziehe(rng, (pl) => PROZ_STADT.has(pl) ? 3 : .5, 1);
		return p.length ? {
			provinzen: p,
			staerke: 1
		} : null;
	},
	titel: (_, ev) => `Anschlag in ${namen(ev.provinzen)}`,
	text: (w, ev) => [`Ein Anschlag erschüttert ${namen(ev.provinzen)}. Die Behörden sprechen von einer organisierten Tat; die Lage ist noch unklar.`, `${anrede(figur(w, "inneres"))} verlangt weitreichende Befugnisse. Das Land wartet auf Ihre Worte.`],
	warum: () => "Nach Anschlägen wächst der Ruf nach Härte. Mehr Befugnisse geben Sicherheit, kosten aber Freiheit und Vertrauen der Liberalen.",
	eroeffne: (w) => {
		wirke(w, "terrorgefahr", 4);
		vertrauenAendern(w, -1);
	},
	optionen: () => [opt("paket", "Sicherheitspaket mit mehr Befugnissen", "Kostet 4 Kapital; Rückhalt bei Konservativen, Kritik von Liberalen.", 4, (w) => {
		wirke(w, "terrorgefahr", -5);
		wirke(w, "pressefreiheit", -3);
		wirke(w, "rechtssicherheit", -2);
		wirke(w, "konservative", 3);
		wirke(w, "staedtische_saekulare", -2);
		return "Ein Sicherheitspaket wird beschlossen.";
	}), opt("besonnen", "Besonnenheit und Ermittlung", "Kostet 2 Kapital; würdevoll, aber angreifbar.", 2, (w) => {
		vertrauenAendern(w, 1.5);
		wirke(w, "terrorgefahr", -1);
		return "Der Präsident mahnt zur Besonnenheit; die Ermittlungen laufen.";
	})],
	standard: (w) => {
		vertrauenAendern(w, -2);
		return "Ohne klare Antwort wirkt die Regierung ratlos.";
	}
};
const WALDBRAND = {
	id: "waldbrand",
	szene: "anatolien",
	frist: 5,
	abkuehlung: 200,
	chance: (w) => monatVon(w) >= 7 && monatVon(w) <= 9 ? .09 : 0,
	erzeuge: (w, rng) => {
		const p = ziehe(rng, (pl) => ["Ege", "Akdeniz"].includes(PROVINZEN[pl - 1]?.region ?? "") ? 1 : .05, 2);
		return p.length ? {
			provinzen: p,
			staerke: .4 + .6 * rng.next()
		} : null;
	},
	titel: () => "Waldbrände",
	text: (_, ev) => [`In ${namen(ev.provinzen)} brennen Wälder; Dörfer werden geräumt, der Rauch hängt über den Küstenorten mitten in der Urlaubssaison.`],
	warum: () => "Hitze, Trockenheit und fehlende Löschkapazität treffen die Küste besonders hart: Tourismus und Luftqualität leiden mit.",
	eroeffne: (w, ev) => {
		wirke(w, "tourismus", -5 * ev.staerke, ev.provinzen);
		wirke(w, "luftqualitaet", -4 * ev.staerke, ev.provinzen);
	},
	optionen: (_, ev) => [opt("loeschen", "Löschflugzeuge und Nothilfe", "Kostet 3 Kapital und 0,1 % des BIP.", 3, (w) => {
		kosten(w, .1);
		wirke(w, "tourismus", 3 * ev.staerke, ev.provinzen);
		vertrauenAendern(w, 1);
		return "Löschflugzeuge und Hilfskräfte sind im Einsatz; die Brände werden eingedämmt.";
	}), opt("entschaedigen", "Evakuieren und Betroffene entschädigen", "Kostet 3 Kapital und 0,2 % des BIP.", 3, (w) => {
		kosten(w, .2);
		vertrauenAendern(w, 2 * ev.staerke);
		return "Betroffene werden untergebracht und entschädigt.";
	})],
	standard: (w, ev) => {
		wirke(w, "tourismus", -3 * ev.staerke, ev.provinzen);
		vertrauenAendern(w, -2 * ev.staerke);
		return "Die Brände breiten sich aus; die Hilfe kommt spät.";
	}
};
const STROM = {
	id: "stromausfaelle",
	szene: "istanbul",
	frist: 7,
	abkuehlung: 240,
	chance: (w) => nationalAverage(NET, w.net, "stromversorgung") < 50 || akutIn(w, "p_stromausfaelle").length > 0 ? .08 : .004,
	erzeuge: (w, rng) => {
		const p = ziehe(rng, (pl) => (PROZ_STADT.has(pl) ? 2 : .6) * (100 - wertIn(w, "stromversorgung", [pl])), 3);
		return p.length ? {
			provinzen: p,
			staerke: .5 + .5 * rng.next()
		} : null;
	},
	titel: () => "Stromausfälle",
	text: (_, ev) => [`In ${namen(ev.provinzen)} fällt tagelang wiederholt der Strom aus. Betriebe stehen still, Krankenhäuser laufen mit Notaggregaten.`],
	warum: () => "Netze, Speicher und Importe entscheiden, ob Spitzenlasten abgefangen werden.",
	eroeffne: (w, ev) => {
		wirke(w, "stromversorgung", -6 * ev.staerke, ev.provinzen);
		wirke(w, "produktivitaet", -2 * ev.staerke, ev.provinzen);
	},
	optionen: (_, ev) => [opt("ration", "Industrie rationieren", "Kostet 2 Kapital; hält die Haushalte am Netz, die Betriebe verlieren.", 2, (w) => {
		wirke(w, "produktivitaet", -2, ev.provinzen);
		wirke(w, "stromversorgung", 3, ev.provinzen);
		return "Die Industrie wird zeitweise vom Netz genommen.";
	}), opt("import", "Notimporte", "Kostet 3 Kapital und 0,2 % des BIP.", 3, (w) => {
		kosten(w, .2);
		wirke(w, "stromversorgung", 5, ev.provinzen);
		wirke(w, "energieimporte", 2);
		return "Strom wird zugekauft.";
	})],
	standard: (w, ev) => {
		vertrauenAendern(w, -2 * ev.staerke);
		wirke(w, "produktivitaet", -2 * ev.staerke, ev.provinzen);
		return "Die Ausfälle halten an; die Wut auf die Regierung wächst.";
	}
};
const AERZTE = {
	id: "aerztestreik",
	szene: "parlament",
	frist: 10,
	abkuehlung: 300,
	chance: (w) => akutIn(w, "p_aerztemangel").length > 0 ? .08 : .004,
	erzeuge: (w, rng) => {
		const akut = akutIn(w, "p_aerztemangel");
		const p = ziehe(rng, (pl) => akut.includes(pl) ? 1 : .05, 3);
		return p.length ? {
			provinzen: p,
			staerke: .5 + .5 * rng.next()
		} : null;
	},
	titel: () => "Ärztinnen und Ärzte protestieren",
	text: (_, ev) => [`In ${namen(ev.provinzen)} legen Ärztinnen und Ärzte aus Protest gegen Bezahlung und Arbeitsbedingungen die Arbeit nieder. Viele denken laut über das Ausland nach.`],
	warum: () => "Ärztemangel entsteht, wenn Bezahlung und Bedingungen nicht mithalten. Er trifft zuerst die Provinzen abseits der Metropolen.",
	eroeffne: (w, ev) => {
		wirke(w, "wartezeiten", 5 * ev.staerke, ev.provinzen);
		wirke(w, "abwanderung", 3 * ev.staerke);
	},
	optionen: (_, ev) => [opt("gehalt", "Gehälter anheben", "Kostet 3 Kapital und 0,2 % des BIP.", 3, (w) => {
		kosten(w, .2);
		wirke(w, "aerzte", 4 * ev.staerke, ev.provinzen);
		wirke(w, "abwanderung", -2);
		return "Die Gehälter im Gesundheitswesen steigen.";
	}), opt("ausland", "Ärzte aus dem Ausland werben", "Kostet 3 Kapital; dauert, entlastet aber.", 3, (w) => {
		wirke(w, "aerzte", 2 * ev.staerke, ev.provinzen);
		return "Ein Programm wirbt Ärztinnen und Ärzte aus dem Ausland an.";
	})],
	standard: (w, ev) => {
		wirke(w, "aerzte", -2 * ev.staerke, ev.provinzen);
		vertrauenAendern(w, -1);
		return "Die Proteste halten an; Ärzte verlassen das Land.";
	}
};
const PREISDECKEL = {
	id: "preisdeckel_knappheit",
	szene: "istanbul",
	frist: 10,
	abkuehlung: 300,
	chance: (w) => nationalAverage(NET, w.net, "m_preiskontrollen") >= 60 ? .25 : 0,
	erzeuge: () => ({
		provinzen: [],
		staerke: 1
	}),
	titel: () => "Leere Regale",
	text: () => ["Unter dem Preisdeckel bieten Händler manche Grundnahrungsmittel kaum noch an. Auf grauen Märkten kosten sie das Doppelte."],
	warum: () => "Ein Preisdeckel unter dem Marktpreis lässt Ware verschwinden oder auf graue Märkte wandern: Der sichtbare Preis sinkt, die Wirklichkeit nicht.",
	eroeffne: (w) => {
		wirke(w, "schattenwirtschaft", 4);
		wirke(w, "lebenshaltung", 3);
	},
	optionen: () => [
		opt("lockern", "Preisdeckel lockern", "Kostet 2 Kapital; die Ware kehrt zurück, die Preise steigen.", 2, (w) => {
			setPolicy(w, "m_preiskontrollen", Math.max(0, nationalAverage(NET, w.net, "m_preiskontrollen") - 25));
			return "Der Preisdeckel wird gelockert.";
		}),
		opt("importieren", "Staatlich importieren", "Kostet 3 Kapital und 0,2 % des BIP.", 3, (w) => {
			kosten(w, .2);
			wirke(w, "lebensmittelpreise", -3);
			return "Der Staat importiert Grundnahrungsmittel.";
		}),
		opt("durchhalten", "Durchhalten und Händler bestrafen", "Kostet 2 Kapital; der Schwarzmarkt wächst.", 2, (w) => {
			wirke(w, "schattenwirtschaft", 6);
			wirke(w, "mittelstand", -3);
			return "Händler werden bestraft; die Ware bleibt knapp.";
		})
	],
	standard: (w) => {
		wirke(w, "schattenwirtschaft", 3);
		vertrauenAendern(w, -1.5);
		return "Die Regale bleiben leer; der Unmut wächst.";
	}
};
const MIETDECKEL = {
	id: "mietdeckel_folgen",
	szene: "istanbul",
	frist: 10,
	abkuehlung: 300,
	chance: (w) => nationalAverage(NET, w.net, "m_mietdeckel") >= 60 ? .2 : 0,
	erzeuge: () => ({
		provinzen: [],
		staerke: 1
	}),
	titel: () => "Der Neubau bricht ein",
	text: () => ["Seit der Mietpreisbremse werden kaum noch Mietwohnungen gebaut; Investoren wandern in andere Anlagen ab. Die Bauwirtschaft klagt."],
	warum: () => "Gedeckelte Mieten entlasten die, die schon eine Wohnung haben, und bremsen das Angebot für alle, die noch suchen.",
	eroeffne: (w) => {
		wirke(w, "wohnungsbau", -4);
		wirke(w, "bauwirtschaft", -3);
	},
	optionen: () => [
		opt("ausnahme", "Ausnahmen für den Neubau", "Kostet 3 Kapital; der Bau erholt sich, Mieter murren.", 3, (w) => {
			wirke(w, "wohnungsbau", 4);
			wirke(w, "junge", -1);
			return "Neubauten werden vom Deckel ausgenommen.";
		}),
		opt("foerdern", "Bauförderung verdoppeln", "Kostet 4 Kapital und 0,3 % des BIP.", 4, (w) => {
			kosten(w, .3);
			wirke(w, "wohnungsbau", 6);
			wirke(w, "bauwirtschaft", 3);
			return "Die Bauförderung wird verdoppelt.";
		}),
		opt("beibehalten", "Deckel beibehalten", "Kostet nichts; die Mieter bleiben geschützt, der Bau leidet.", 0, (w) => {
			wirke(w, "wohnungsbau", -3);
			return "Der Deckel bleibt.";
		})
	],
	standard: (w) => {
		wirke(w, "wohnungsbau", -3);
		return "Der Neubau bleibt schwach.";
	}
};
/** Fällige Zusagen (aus dem Wahlkampf, Absprachen mit Fraktionen, Bündnispartner, Länder). Die Regeln stehen in sim/zusagen.ts. */
const ZUSAGE = {
	id: "zusage",
	szene: "parlament",
	frist: 20,
	abkuehlung: 0,
	chance: () => 0,
	erzeuge: () => null,
	titel: (w, ev) => `Zusage fällig: ${w.spiel?.zusagen.find((z) => z.id === String(ev.daten?.zusage))?.von ?? ""}`,
	text: (w, ev) => {
		const z = w.spiel?.zusagen.find((x) => x.id === String(ev.daten?.zusage));
		const f = z ? w.spiel?.figuren.find((x) => x.partei === z.von) : void 0;
		const bezug = z ? zusageBezug(w, z) : void 0;
		if (!z) return ["Eine Zusage ist fällig."];
		if (f) return [`${f.rolle} ${f.name} erinnert Sie an Ihr Versprechen: ${z.text}.`];
		if (bezug?.art === "land") return [`${bezug.name} erinnert Sie an Ihr Versprechen: ${z.text}. Das Vertrauen dort hängt davon ab, ob Ankara Wort hält.`];
		return [`Ihnen wird die Rechnung präsentiert: ${z.text}.`];
	},
	warum: () => "Wer Zusagen bricht, verliert Verbündete und Glaubwürdigkeit; wer sie hält, zahlt mit Kapital oder Politik. Beides bleibt im Gedächtnis: Legitimität und Vertrauen im Land hängen davon ab.",
	optionen: (w, ev) => {
		const z = w.spiel?.zusagen.find((x) => x.id === String(ev.daten?.zusage));
		return [
			(() => {
				const v = zusageVorhaben(w, z);
				const beschreibung = v ? v.pr.ok ? `Bringt „${v.name}“ als Gesetz ein: ${v.zielName ? `von „${v.jetztName}“ zu „${v.zielName}“` : `Stufe ${Math.round(v.jetzt)} auf ${v.ziel}`}. Kostet ${v.pr.gesetz.pk} Kapital; ${v.pr.gesetz.stimmen.luecke === 0 ? "die Mehrheit steht" : `es fehlen etwa ${v.pr.gesetz.stimmen.luecke} Stimmen`}.` : `„${v.name}“ steht schon auf dieser Stufe; die Zusage gilt damit als erfüllt.` : "Kostet 4 Kapital; die Partei ist zufrieden.";
				const o = opt("erfuellen", v ? "Das Gesetz einbringen" : "Zusage erfüllen", beschreibung, v ? 0 : 4, (ww) => {
					if (!z) return "Die Zusage besteht nicht mehr.";
					return loeseZusageEin(ww, z).text;
				});
				if (v?.pr.ok) o.anzeigePk = v.pr.gesetz.pk;
				return o;
			})(),
			...(z?.vertroestet ?? 0) < 2 ? [opt("vertroesten", "Vertrösten", `Kostet 1 Kapital; die Partei wartet drei Monate.${(z?.vertroestet ?? 0) === 1 ? " Das ist die letzte Vertröstung." : " Sie können sie noch zweimal vertrösten."}`, 1, (ww) => z ? vertroesteZusage(ww, z) : "Die Zusage besteht nicht mehr.")] : [],
			opt("brechen", "Zusage brechen", "Kostet nichts, aber Verbündete und Glaubwürdigkeit.", 0, (ww) => z ? brecheZusage(ww, z) : "Die Zusage besteht nicht mehr.")
		];
	},
	standard: (w, ev) => {
		const z = w.spiel?.zusagen.find((x) => x.id === String(ev.daten?.zusage));
		return z ? brecheZusage(w, z, true) : "Die Zusage verfällt unbeantwortet; das wird als Bruch gewertet.";
	}
};
/** Angebote anderer Fraktionen, wenn dem Lager die Mehrheit fehlt. */
const KOALITION = {
	id: "koalitionsangebot",
	szene: "parlament",
	frist: 30,
	abkuehlung: 240,
	chance: (w) => w.spiel && w.parliament && w.player && w.spiel.figuren.length && lueckeJetzt(w) > 0 ? .1 : 0,
	erzeuge: (w, rng) => {
		const parl = w.parliament;
		if (!parl || !w.player) return null;
		const kandidaten = Object.entries(parl.seats).filter(([k, s]) => s >= 15 && k !== w.player.partei.kurz && !(w.spiel?.lager ?? []).includes(k) && FORDERUNG[k]).map(([k]) => k);
		if (!kandidaten.length) return null;
		const partei = kandidaten[Math.floor(rng.next() * kandidaten.length)];
		return {
			provinzen: [],
			staerke: 1,
			daten: {
				partei,
				sitze: parl.seats[partei] ?? 0
			}
		};
	},
	titel: (_, ev) => `${ev.daten?.partei} bietet Unterstützung an`,
	text: (w, ev) => {
		const f = forderungVon(w, String(ev.daten?.partei));
		return [`Die ${ev.daten?.partei} (${ev.daten?.sitze} Sitze) signalisiert, Ihr Lager im Parlament zu stützen, wenn Sie ihr entgegenkommen.`, `Ihr Preis: ${f?.text ?? "ein Entgegenkommen"}. Ohne Mehrheit bleiben Gesetze mühsam und teuer.`];
	},
	warum: () => "Ohne eigene Mehrheit braucht ein Präsident Partner. Jeder Partner hat eigene Wähler und einen Preis.",
	optionen: (_, ev) => [opt("zustimmen", "Auf das Angebot eingehen", "Kostet 4 Kapital; das Lager wächst, die Partei erwartet Gegenleistung.", 4, (w, _e, rng) => {
		const partei = String(ev.daten?.partei);
		const f = forderungVon(w, partei);
		w.spiel.lager.push(partei);
		w.spiel.zusagen.push({
			id: `z-koalition-${partei}-${w.day}`,
			von: partei,
			text: `Die ${partei} erwartet ${f.text}`,
			faellig: w.day + 150,
			massnahme: f.massnahme,
			richtung: 1,
			erfuellt: false,
			gebrochen: false
		});
		w.spiel.figuren.push(partnerFigur(w, partei, `Vorsitz der ${partei}`, f.text, rng));
		return `Die ${partei} stützt fortan das Lager (+${ev.daten?.sitze} Sitze).`;
	}), opt("ablehnen", "Ablehnen", "Kostet nichts; die Mehrheit bleibt schwer.", 0, () => "Das Angebot wird abgelehnt.")],
	standard: () => "Das Angebot verfällt."
};
function lueckeJetzt(w) {
	const parl = w.parliament;
	const player = w.player;
	if (!parl || !player) return 0;
	const lager = [player.partei.kurz, ...w.spiel?.lager ?? []].reduce((s, p) => s + (parl.seats[p] ?? 0), 0);
	return Math.max(0, 301 - lager);
}
const START_HAUSHALT = {
	id: "start_haushalt",
	szene: "bank",
	frist: 30,
	abkuehlung: 0,
	chance: () => 0,
	erzeuge: () => ({
		provinzen: [],
		staerke: 1
	}),
	titel: () => "Der erste Haushaltsentwurf",
	text: (w) => [`${anrede(figur(w, "finanzen"))} legt den Entwurf vor: Die Inflation liegt bei ${nf$4(w.published.inflation.value)} %, die Schulden bei ${nf$4(w.economy.debtRatio)} % des BIP. Die Märkte beobachten, ob der neue Präsident Disziplin hält.`, "Der Entwurf lässt Spielraum in beide Richtungen."],
	warum: () => "Mehr Ausgaben stützen kurz die Nachfrage und treiben Inflation und Schulden; Sparen beruhigt die Märkte und kostet Zustimmung.",
	optionen: () => [
		opt("sparen", "Sparkurs", "Kostet 3 Kapital; beruhigt die Märkte, der Finanzminister ist zufrieden.", 3, (w) => {
			setFiscalImpulse(w, w.economy.fiscalImpulse - 1);
			wirke(w, "vertrauen_maerkte", 4);
			vertrauenAendern(w, -1);
			const f = figur(w, "finanzen");
			if (f) f.loyalitaet = Math.min(100, f.loyalitaet + 8);
			return "Der Haushalt setzt auf Disziplin.";
		}),
		opt("mitte", "Ausgeglichen", "Kostet nichts; kein Signal in irgendeine Richtung.", 0, () => "Der Haushalt bleibt, wie er ist."),
		opt("wachstum", "Wachstumshaushalt", "Kostet 3 Kapital; mehr Investitionen und mehr Schulden.", 3, (w) => {
			setFiscalImpulse(w, w.economy.fiscalImpulse + 1.5);
			vertrauenAendern(w, 1);
			const f = figur(w, "finanzen");
			if (f) f.loyalitaet = Math.max(0, f.loyalitaet - 8);
			return "Der Haushalt setzt auf Wachstum und Investitionen.";
		})
	],
	standard: () => "Der Haushalt bleibt, wie er ist."
};
const START_PARTNER = {
	id: "start_partner",
	szene: "parlament",
	frist: 30,
	abkuehlung: 0,
	chance: () => 0,
	erzeuge: () => ({
		provinzen: [],
		staerke: 1
	}),
	titel: (w) => w.player?.buendnis ? `${w.player.buendnis} meldet sich` : "Die Opposition fordert Klarheit",
	text: (w) => w.player?.buendnis ? [`Der Vorsitz der ${w.player.buendnis} erinnert an den Wahlkampf: ${(w.player.versprechen[0] ?? "Es gibt Zusagen").replace(/\.$/, "")}. Sie erwartet Ihre Antwort noch in der ersten Woche.`] : ["Die Opposition fordert vom neuen Präsidenten, seine Wahlversprechen in den ersten hundert Tagen einzulösen, und kündigt eine genaue Zählung an."],
	warum: () => "Zusagen sind Kapital: Wer sie hält, wird ernst genommen; wer sie bricht, bezahlt später.",
	optionen: (w) => w.player?.buendnis ? [
		opt("grosszuegig", "Großzügig sein", "Kostet 4 Kapital; das Lager hält.", 4, (ww) => {
			const f = ww.spiel?.figuren.find((x) => x.amt === "partner");
			if (f) f.loyalitaet = Math.min(100, f.loyalitaet + 12);
			return `Die ${ww.player?.buendnis} erhält Zusagen und bleibt im Lager.`;
		}),
		opt("knapp", "Knapp anbieten", "Kostet 1 Kapital; die Partei murrt.", 1, (ww) => {
			const f = ww.spiel?.figuren.find((x) => x.amt === "partner");
			if (f) f.loyalitaet = Math.min(100, f.loyalitaet + 3);
			return "Das Angebot fällt knapp aus.";
		}),
		opt("vertagen", "Vertagen", "Kostet nichts; die Geduld sinkt.", 0, (ww) => {
			const f = ww.spiel?.figuren.find((x) => x.amt === "partner");
			if (f) f.loyalitaet = Math.max(0, f.loyalitaet - 10);
			return "Die Antwort wird vertagt.";
		})
	] : [opt("liste", "Eine Liste der Versprechen veröffentlichen", "Kostet 2 Kapital; schafft Transparenz und Druck.", 2, (ww) => {
		vertrauenAendern(ww, 1);
		return "Der Präsident veröffentlicht seine Zusagen und stellt sich der Zählung.";
	}), opt("abwarten", "Abwarten", "Kostet nichts.", 0, () => "Der Präsident lässt die Forderung unbeantwortet.")],
	standard: () => "Die Forderung bleibt unbeantwortet."
};
const ERDBEBEN_REGION = [
	31,
	46,
	2,
	44,
	27,
	80,
	1,
	21,
	63,
	79,
	23
];
const VORLAGEN = [
	ERDBEBEN,
	DUERRE,
	WAEHRUNG,
	ENERGIE,
	HAUSHALT,
	KORRUPTION,
	STREIK,
	MIETE,
	FLUECHTLINGE,
	ANSCHLAG,
	WALDBRAND,
	STROM,
	AERZTE,
	PREISDECKEL,
	MIETDECKEL,
	KOALITION,
	ZUSAGE,
	START_HAUSHALT,
	START_PARTNER,
	{
		id: "start_wiederaufbau",
		szene: "anatolien",
		frist: 30,
		abkuehlung: 0,
		chance: () => 0,
		erzeuge: () => ({
			provinzen: [],
			staerke: 1
		}),
		titel: () => "Der Wiederaufbau im Erdbebengebiet",
		text: (w) => ["In den Provinzen, die 2023 vom Erdbeben getroffen wurden, ist der Wiederaufbau nicht abgeschlossen. Viele Familien leben noch in Containern.", `${anrede(figur(w, "stab"))} legt den Bericht vor: Ein schneller Bau spart Zeit, ein sauberer Bau spart Leben, wenn es wieder bebt.`],
		warum: () => "Wiederaufbau konkurriert mit allem anderen um Haushalt, Personal und Material; Eile und Korruption erhöhen die Verwundbarkeit.",
		optionen: () => [
			opt("chefsache", "Zur Chefsache machen", "Kostet 6 Kapital und 0,4 % des BIP; schneller Wiederaufbau.", 6, (w) => {
				kosten(w, .4);
				wirke(w, "wohnungsbau", 6, ERDBEBEN_REGION);
				wirke(w, "p_wohnungsnot", -5, ERDBEBEN_REGION);
				wirke(w, "korruption", 1.5);
				vertrauenAendern(w, 1.5);
				return "Der Wiederaufbau wird Chefsache; die Aufträge laufen schnell.";
			}),
			opt("sauber", "Sauber und kontrolliert bauen", "Kostet 4 Kapital und 0,2 % des BIP; langsamer, sicherer.", 4, (w) => {
				kosten(w, .2);
				wirke(w, "wohnungsbau", 3, ERDBEBEN_REGION);
				wirke(w, "erdbebenvorsorge", 3, ERDBEBEN_REGION);
				wirke(w, "bauqualitaet", 3, ERDBEBEN_REGION);
				return "Der Wiederaufbau folgt strengen Prüfungen: langsamer, aber sicherer.";
			}),
			opt("weiter", "Beim Bestehenden bleiben", "Kostet nichts; die Region wartet weiter.", 0, (w) => {
				vertrauenAendern(w, -.5);
				return "Der Wiederaufbau läuft im bisherigen Tempo weiter.";
			})
		],
		standard: () => "Der Wiederaufbau läuft im bisherigen Tempo weiter."
	},
	...INNEN_VORLAGEN,
	...AUSSEN_VORLAGEN,
	...LAENDER_VORLAGEN,
	...REICH_VORLAGEN,
	...PERSONEN_VORLAGEN
];
/** Womit man die Ursache eines Ereignisses selbst regeln kann (statt nur zu reagieren). */
const EREIGNIS_MASSNAHMEN = {
	erdbeben: ["m_bauaufsicht", "m_stadterneuerung"],
	duerre: [
		"m_bewaesserung",
		"m_wasserleitungen",
		"m_agrarsubventionen"
	],
	energiepreisschock: [
		"m_energiesubventionen",
		"m_solar_wind",
		"m_speicher_smartgrid"
	],
	korruptionsaffaere: ["m_antikorruption", "m_justizreform"],
	streikwelle: ["m_mindestlohn", "m_gewerkschaftsrechte"],
	mietproteste: [
		"m_mietdeckel",
		"m_sozialwohnungen",
		"m_baukredite"
	],
	fluechtlingswelle: [
		"m_integration",
		"m_grenzschutz",
		"m_rueckkehr"
	],
	anschlag: ["m_polizei", "m_polizeitechnik"],
	waldbrand: ["m_umweltauflagen"],
	stromausfaelle: ["m_netzausbau", "m_speicher_smartgrid"],
	aerztestreik: ["m_aerztegehalt", "m_krankenhausbau"],
	preisdeckel_knappheit: ["m_preiskontrollen"],
	mietdeckel_folgen: ["m_mietdeckel", "m_baukredite"],
	mindestlohn: ["m_mindestlohn"],
	bergwerksunglueck: ["m_gewerkschaftsrechte", "m_antikorruption"],
	ueberschwemmung: [
		"m_staudaemme",
		"m_regionalfoerderung",
		"m_autobahnen"
	],
	bankenstress: ["m_bankenaufsicht", "m_kreditgarantien"],
	studentenproteste: [
		"m_stipendien",
		"m_wissenschaftsfreiheit",
		"m_unigruendungen"
	],
	pressekonflikt: ["m_medienaufsicht", "m_internetsperren"],
	bauamnestie_forderung: ["m_bauamnestie", "m_bauaufsicht"],
	rentnerprotest: ["m_renten"],
	grippewelle: [
		"m_krankenhausbau",
		"m_hausarzt",
		"m_aerztegehalt"
	],
	bauernproteste: [
		"m_agrarsubventionen",
		"m_bewaesserung",
		"m_saatgut"
	],
	fabrikschliessungen: [
		"m_industrie_modernisierung",
		"m_kreditgarantien",
		"m_ausbildung"
	],
	buergermeister_verfahren: ["m_justizreform"],
	tourismusrekord: ["m_tourismuswerbung"],
	grenzzwischenfall: ["m_grenzschutz", "m_verteidigung"],
	eu_angebot: ["m_eu_annaeherung", "m_justizreform"],
	gasvertrag: ["m_gasfoerderung", "m_solar_wind"],
	gasfund: ["m_gasfoerderung"],
	cyberangriff: ["m_smart_infrastruktur"],
	weltwirtschaftskrise: [
		"m_kmu",
		"m_kreditgarantien",
		"m_investitionsanreize"
	],
	pandemie: [
		"m_krankenhausbau",
		"m_hausarzt",
		"m_medizintechnik"
	],
	erbe_raubgrabung: ["m_archaeologie", "m_polizei"],
	erbe_erdbebenschaden: ["m_bauaufsicht", "m_denkmalschutz"],
	recht_ernennung: ["m_justizreform", "m_richterrat"],
	recht_haftrevolte: ["m_haftvermeidung", "m_richterstellen"],
	mil_lieferverzug: ["m_verteidigung", "m_ruestungsindustrie"],
	infra_bauunfall: ["m_bauaufsicht", "m_instandhaltung"]
};
for (const v of VORLAGEN) if (EREIGNIS_MASSNAHMEN[v.id]) v.massnahmen = EREIGNIS_MASSNAHMEN[v.id];
const VORLAGE_NACH_ID = new Map(VORLAGEN.map((v) => [v.id, v]));
/**
* Die Antworten eines Ereignisses. Gibt es keine kostenlose, kommt immer „Abwarten“ dazu: Wer kein Kapital hat, soll nicht vor lauter grauen
* Knöpfen stehen, sondern die Standardfolge bewusst in Kauf nehmen können.
*/
function antworten(w, ev) {
	const v = vorlage(ev.vorlage);
	const optionen = v.optionen(w, ev);
	if (optionen.some((o) => (o.anzeigePk ?? o.pk) === 0)) return optionen;
	return [...optionen, {
		id: "aussitzen",
		label: "Abwarten und nichts tun",
		beschreibung: "Kostet nichts; es geschieht die Standardfolge, die das Ereignis für den Fall vorsieht, dass niemand handelt.",
		pk: 0,
		wirkung: (ww, e, rng) => v.standard(ww, e, rng)
	}];
}
function vorlage(id) {
	const v = VORLAGE_NACH_ID.get(id);
	if (!v) throw new Error(`Unbekannte Ereignisvorlage: ${id}`);
	return v;
}
function oeffne(world, vorlageId, rng, params) {
	const spiel = world.spiel;
	if (!spiel) return null;
	const v = vorlage(vorlageId);
	const gen = params ?? v.erzeuge(world, rng);
	if (!gen) return null;
	const ev = {
		id: `${vorlageId}-${world.day}-${spiel.ereignisse.length}`,
		vorlage: vorlageId,
		tag: world.day,
		frist: world.day + v.frist,
		provinzen: gen.provinzen ?? [],
		staerke: (gen.staerke ?? 1) * schutzFuer(world, vorlageId) * (vorlageId.startsWith("start_") || vorlageId === "zusage" ? 1 : schwierig(world).haerte)
	};
	if (gen.daten) ev.daten = gen.daten;
	spiel.ereignisse.push(ev);
	spiel.zuletzt[vorlageId] = world.day;
	v.eroeffne?.(world, ev, rng);
	addLog(world, "ereignis", v.titel(world, ev), v.text(world, ev)[0]);
	return ev;
}
/** Einmal im Monat: Vorlagen würfeln. Der Zufall wird für jede Vorlage gezogen, damit der Verlauf stabil bleibt. */
function ereignisMonat(world, rng) {
	const spiel = world.spiel;
	if (!spiel || spiel.ende) return;
	const offenNormal = () => spiel.ereignisse.filter((e) => !e.vorlage.startsWith("start_")).length;
	for (const v of VORLAGEN) {
		const u = rng.next();
		if (v.chance(world) <= 0) continue;
		if (offenNormal() >= 3) continue;
		if (spiel.ereignisse.some((e) => e.vorlage === v.id)) continue;
		if (world.day - (spiel.zuletzt[v.id] ?? -1e9) < v.abkuehlung) continue;
		if (u < v.chance(world) * 1 * schwierig(world).ereignisse * alterFaktor(world, v.id) * dichteFaktor(world, v.id)) oeffne(world, v.id, rng);
	}
}
/** Täglich: fällige Zusagen einfordern, Fristen abwarten. */
function ereignisTag(world, rng) {
	const spiel = world.spiel;
	if (!spiel) return;
	if (spiel.zusagen.some((z) => z.von === "Fraktionen")) spiel.zusagen = spiel.zusagen.filter((z) => z.von !== "Fraktionen");
	spiel.ereignisse = spiel.ereignisse.filter((e) => e.vorlage !== "zusage" || spiel.zusagen.some((z) => z.id === String(e.daten?.zusage)));
	for (const z of spiel.zusagen) {
		if (z.erfuellt || z.gebrochen || z.faellig > world.day) continue;
		if (spiel.ereignisse.some((e) => e.vorlage === "zusage" && e.daten?.zusage === z.id)) continue;
		oeffne(world, "zusage", rng, {
			provinzen: [],
			staerke: 1,
			daten: { zusage: z.id }
		});
	}
	for (const ev of [...spiel.ereignisse]) {
		if (ev.frist > world.day) continue;
		const v = vorlage(ev.vorlage);
		const ausgang = v.standard(world, ev, rng);
		if (!ev.vorlage.startsWith("start_")) spiel.umfrage.zustimmung = Math.max(0, spiel.umfrage.zustimmung - .8);
		abschliessen(world, ev, v.titel(world, ev), `Keine Entscheidung: ${ausgang}`);
	}
}
function abschliessen(world, ev, titel, ausgang) {
	const spiel = world.spiel;
	spiel.ereignisse = spiel.ereignisse.filter((e) => e.id !== ev.id);
	spiel.chronik.push({
		tag: world.day,
		datum: world.date,
		titel,
		ausgang
	});
	addLog(world, "entscheidung", `${titel}: ${ausgang}`);
}
/** Wer die Ursache selbst regelt (ein Vorhaben zu einer zugehörigen Maßnahme einbringt), hat das Ereignis in die Hand genommen. */
setzeEinbringHaken((world, massnahmeId, text) => {
	const spiel = world.spiel;
	if (!spiel) return;
	for (const ev of [...spiel.ereignisse]) {
		if (ev.vorlage.startsWith("start_")) continue;
		const v = vorlage(ev.vorlage);
		const zusage = ev.vorlage === "zusage" ? spiel.zusagen.find((x) => x.id === String(ev.daten?.zusage)) : void 0;
		if (!v.massnahmen?.includes(massnahmeId) && zusage?.massnahme !== massnahmeId) continue;
		if (zusage) zusage.faellig = world.day + REGELN.tageBisAbstimmung + 15;
		abschliessen(world, ev, v.titel(world, ev), `Selbst an der Ursache angesetzt. ${text}`);
	}
});
const VORSCHAU_CACHE = /* @__PURE__ */ new Map();
/**
* Was eine Antwort sofort bewirkt: auf einer Kopie der Welt durchgerechnet, nichts davon geschieht wirklich.
* Zeigt Maßnahmenänderungen, Haushalt und die Größen, die sich am stärksten bewegen.
*/
function wirkungsVorschau(world, ev, optionId) {
	const key = `${ev.id}|${optionId}|${world.day}|${Math.floor(world.spiel?.kapital ?? 0)}`;
	const gemerkt = VORSCHAU_CACHE.get(key);
	if (gemerkt) return gemerkt;
	const zeilen = [];
	try {
		const kopie = structuredClone(world);
		const evK = kopie.spiel.ereignisse.find((e) => e.id === ev.id);
		const o = evK ? antworten(kopie, evK).find((x) => x.id === optionId) : void 0;
		if (evK && o) {
			const vorher = /* @__PURE__ */ new Map();
			for (const n of NET.nodes) if (!n.input) vorher.set(n.id, nationalAverage(NET, world.net, n.id));
			const schulden0 = kopie.economy.debtRatio;
			const risiko0 = kopie.economy.riskPremium;
			const fx0 = kopie.economy.usdTry;
			const loyal0 = new Map(kopie.spiel.figuren.map((f) => [f.id, f.loyalitaet]));
			o.wirkung(kopie, evK, new Rng(12345));
			for (const [id, ziel] of Object.entries(kopie.net.targets)) {
				const jetzt = nationalAverage(NET, world.net, id);
				const alt = world.net.targets[id];
				if (Math.abs(ziel - (alt ?? jetzt)) >= 1 && Math.abs(ziel - jetzt) >= 1) zeilen.push(`${NET.nodes[NET.index.get(id)].name}: Stufe ${Math.round(jetzt)} auf ${Math.round(ziel)}`);
			}
			const ds = kopie.economy.debtRatio - schulden0;
			if (Math.abs(ds) >= .04) zeilen.push(`Schulden ${ds > 0 ? "+" : "−"}${nf$4(Math.abs(ds), 2)} Prozentpunkte`);
			const dr = kopie.economy.riskPremium - risiko0;
			if (Math.abs(dr) >= 4) zeilen.push(`Risikoaufschlag ${dr > 0 ? "+" : "−"}${nf$4(Math.abs(dr), 0)} Punkte`);
			const df = (kopie.economy.usdTry / fx0 - 1) * 100;
			if (Math.abs(df) >= .4) zeilen.push(`Lira ${df > 0 ? "schwächer" : "stärker"} um ${nf$4(Math.abs(df))} %`);
			for (const f of kopie.spiel.figuren) {
				const d = f.loyalitaet - (loyal0.get(f.id) ?? f.loyalitaet);
				if (Math.abs(d) >= 3) zeilen.push(`${f.rolle} ${f.name}: ${d > 0 ? "mehr" : "weniger"} Rückhalt`);
			}
			const aenderungen = [];
			for (const n of NET.nodes) {
				if (n.input) continue;
				const d = nationalAverage(NET, kopie.net, n.id) - (vorher.get(n.id) ?? 0);
				if (Math.abs(d) >= .4) aenderungen.push({
					name: n.name,
					d
				});
			}
			aenderungen.sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
			for (const a of aenderungen.slice(0, 4)) zeilen.push(`${a.name} ${a.d > 0 ? "+" : "−"}${nf$4(Math.abs(a.d))}`);
		}
	} catch {}
	const ergebnis = zeilen.slice(0, 6);
	if (VORSCHAU_CACHE.size > 300) VORSCHAU_CACHE.clear();
	VORSCHAU_CACHE.set(key, ergebnis);
	return ergebnis;
}
function zusageAnsicht(world, ev, v) {
	if (ev.vorlage === "zusage") {
		const z = world.spiel?.zusagen.find((x) => x.id === String(ev.daten?.zusage));
		const vorhaben = zusageVorhaben(world, z);
		return {
			massnahmen: vorhaben ? [{
				id: vorhaben.id,
				name: vorhaben.name,
				ziel: vorhaben.ziel
			}] : [],
			massnahmenText: "Das Gesetz vorher ansehen:"
		};
	}
	return {
		massnahmen: (v.massnahmen ?? []).map((id) => ({
			id,
			name: NET.nodes[NET.index.get(id)].name
		})),
		massnahmenText: "Oder an der Ursache ansetzen:"
	};
}
function ansicht(world, ev) {
	const v = vorlage(ev.vorlage);
	return {
		id: ev.id,
		vorlage: ev.vorlage,
		szene: v.szene,
		titel: v.titel(world, ev),
		text: v.text(world, ev),
		warum: v.warum(world, ev),
		frist: ev.frist,
		tageBisFrist: Math.max(0, ev.frist - world.day),
		optionen: antworten(world, ev).map(({ wirkung: _w, ...rest }) => ({
			...rest,
			bezahlbar: kannZahlen(world.spiel?.kapital ?? 0, rest.anzeigePk ?? rest.pk),
			vorschau: wirkungsVorschau(world, ev, rest.id)
		})),
		...zusageAnsicht(world, ev, v)
	};
}
//#endregion
//#region game/src/sim/verhandeln.ts
const VERHANDLUNG = {
	gespraechAbkuehlung: 30,
	zugestaendnisAbkuehlung: 120,
	duldungTage: 180,
	koalitionZusageTage: 150,
	duldungMin: 40,
	koalitionMin: 55
};
const pkGespraech = 1;
const pkZugestaendnis = 3;
const pkDuldung = (sitze) => 2 + Math.ceil(sitze / 40);
const pkKoalition = (sitze) => 4 + Math.ceil(sitze / 30);
const pkAbwerben = (sitze) => 5 + Math.ceil(sitze / 40);
function eigene(world) {
	return world.player?.partei.kurz ?? "";
}
function datumBis(world, tag) {
	return formatDateDe(addDays(world.date, tag - world.day));
}
/** Alle Fraktionen außer der eigenen, mit Stand und möglichen Verhandlungsschritten. */
function fraktionsUebersicht(world) {
	const spiel = world.spiel;
	const parl = world.parliament;
	if (!spiel || !parl) return [];
	const kapital = verfuegbar(spiel.kapital);
	const out = [];
	for (const [partei, sitze] of Object.entries(parl.seats)) {
		if (partei === eigene(world) || sitze <= 0) continue;
		const f = fraktion(world, partei);
		const imLager = spiel.lager.includes(partei);
		const duldet = f.duldungBis !== void 0 && f.duldungBis > world.day && !imLager;
		const status = imLager ? "lager" : duldet ? "duldung" : "opposition";
		const forderung = forderungVon(world, partei).text;
		const aktionen = [];
		{
			const rest = (f.gespraech ?? -1e9) + VERHANDLUNG.gespraechAbkuehlung - world.day;
			aktionen.push({
				id: "gespraech",
				label: "Gespräch führen",
				pk: pkGespraech,
				moeglich: rest <= 0 && kapital >= pkGespraech,
				...rest > 0 ? { grund: `Erst in ${rest} Tagen wieder sinnvoll.` } : kapital < pkGespraech ? { grund: "Dafür fehlt Kapital." } : {},
				hinweis: "Macht die Fraktion offener für Sie (+8)."
			});
		}
		if (!imLager) {
			{
				const rest = (f.zugestaendnis ?? -1e9) + VERHANDLUNG.zugestaendnisAbkuehlung - world.day;
				aktionen.push({
					id: "zugestaendnis",
					label: "Kontrollrechte zugestehen",
					pk: pkZugestaendnis,
					moeglich: rest <= 0 && kapital >= pkZugestaendnis,
					...rest > 0 ? { grund: `Schon zugestanden; wieder möglich in ${rest} Tagen.` } : kapital < pkZugestaendnis ? { grund: "Dafür fehlt Kapital." } : {},
					hinweis: "Untersuchungsausschuss, Redezeit, Einsicht: macht sie deutlich offener (+15) und entspannt das Klima."
				});
			}
			{
				const pk = pkDuldung(sitze);
				const ja = Math.round(sitze * DULDUNG_QUOTE);
				const grund = duldet ? `Läuft noch bis ${datumBis(world, f.duldungBis)}.` : f.bereitschaft < VERHANDLUNG.duldungMin ? `Sie ist ${bereitschaftWort(f.bereitschaft)}; erst Gespräche oder Zugeständnisse.` : kapital < pk ? "Dafür fehlt Kapital." : void 0;
				aktionen.push({
					id: "duldung",
					label: "Duldung aushandeln",
					pk,
					moeglich: !grund,
					...grund ? { grund } : {},
					hinweis: `${VERHANDLUNG.duldungTage / 30} Monate lang etwa ${ja} Ja-Stimmen bei Gesetzen. Sie erwartet dafür ${forderung}.`
				});
			}
			{
				const pk = pkKoalition(sitze);
				const grund = sitze < 10 ? "Zu klein für ein Bündnis." : f.bereitschaft < VERHANDLUNG.koalitionMin ? `Sie ist ${bereitschaftWort(f.bereitschaft)}; für ein Bündnis braucht sie mehr Vertrauen.` : kapital < pk ? "Dafür fehlt Kapital." : void 0;
				aktionen.push({
					id: "koalition",
					label: "Ins Lager holen",
					pk,
					moeglich: !grund,
					...grund ? { grund } : {},
					hinweis: `Alle ${sitze} Sitze im Lager, dauerhaft. Sie erwartet ${forderung}; bei Bruch verlässt sie das Lager.`
				});
			}
			if (sitze >= 20) {
				const pk = pkAbwerben(sitze);
				aktionen.push({
					id: "abwerben",
					label: "Abgeordnete abwerben",
					pk,
					moeglich: kapital >= pk,
					...kapital < pk ? { grund: "Dafür fehlt Kapital." } : {},
					hinweis: "Einzelne Abgeordnete wechseln zu Ihnen, wenn es gelingt. Die Fraktion vergisst das nicht."
				});
			}
		}
		out.push({
			partei,
			name: PARTEI_NAME[partei] ?? partei,
			ausrichtung: AUSRICHTUNG[partei] ?? "",
			sitze,
			status,
			...f.duldungBis !== void 0 && duldet ? { duldungBis: f.duldungBis } : {},
			bereitschaft: f.bereitschaft,
			wort: bereitschaftWort(f.bereitschaft),
			forderung,
			aktionen
		});
	}
	return out.sort((a, b) => b.sitze - a.sitze);
}
/** Einmal im Monat: Duldungen laufen aus, die Stimmung kehrt langsam zum Ausgangswert zurück. */
function verhandlungMonat(world) {
	const spiel = world.spiel;
	if (!spiel?.fraktionen) return;
	for (const [partei, f] of Object.entries(spiel.fraktionen)) {
		if (f.duldungBis !== void 0 && f.duldungBis <= world.day) {
			delete f.duldungBis;
			addLog(world, "ereignis", `Die Duldung durch die ${PARTEI_NAME[partei] ?? partei} endet.`, "Ihre Stimmen fehlen ab jetzt bei Gesetzen; eine neue Vereinbarung kostet erneut Kapital.");
		}
		const ziel = startBereitschaft(world, partei);
		f.bereitschaft += Math.sign(ziel - f.bereitschaft) * Math.min(1, Math.abs(ziel - f.bereitschaft));
	}
}
//#endregion
//#region game/src/sim/waehler-verlauf.ts
const VERLAUF_MAX = 72;
/** Wert eines Knotens im Landesdurchschnitt vor n Monaten, aus dem Gedächtnis des Netzes (13 Monate). */
function frueherWert(world, id, n) {
	const s = world.net;
	const i = NET.index.get(id);
	if (i === void 0 || s.month < n) return null;
	const slot = s.history[(s.month - n + s.history.length * 1e3) % s.history.length];
	if (!slot) return null;
	let sum = 0;
	for (let p = 0; p < 81; p++) sum += slot[i * 81 + p] * s.weights[p];
	return Number.isFinite(sum) ? sum : null;
}
function monatVor(datum, n) {
	const [j, m] = datum.split("-").map(Number);
	const idx = j * 12 + (m - 1) - n;
	return `${Math.floor(idx / 12)}-${String(idx % 12 + 1).padStart(2, "0")}`;
}
/** Legt den Verlauf an und füllt ihn aus dem Gedächtnis des Netzes, falls er fehlt (ältere Spielstände). */
function verlaufSichern(world) {
	const spiel = world.spiel;
	if (spiel.waehler && spiel.waehler.monate.length) return spiel.waehler;
	const v = {
		monate: [],
		laune: {},
		zustimmung: []
	};
	spiel.waehler = v;
	const heute = world.date.slice(0, 7);
	for (let n = Math.min(12, world.net.month); n >= 1; n--) {
		const monat = monatVor(heute, n);
		v.monate.push(monat);
		for (const g of GRUPPEN) (v.laune[g.id] ??= []).push(frueherWert(world, g.id, n));
		const eintrag = spiel.umfrage.verlauf.find((u) => u.monat === monat);
		v.zustimmung.push(eintrag ? eintrag.wert : null);
	}
	return v;
}
/** Einmal im Monat: Stimmung aller Gruppen und die Zustimmung festhalten. */
function verlaufAufzeichnen(world) {
	const spiel = world.spiel;
	if (!spiel) return;
	const v = verlaufSichern(world);
	const monat = world.date.slice(0, 7);
	if (v.monate[v.monate.length - 1] === monat) return;
	v.monate.push(monat);
	for (const g of GRUPPEN) {
		const reihe = v.laune[g.id] ??= [];
		while (reihe.length < v.monate.length - 1) reihe.unshift(null);
		reihe.push(nationalAverage(NET, world.net, g.id));
	}
	v.zustimmung.push(spiel.umfrage.zustimmung);
	while (v.monate.length > VERLAUF_MAX) {
		v.monate.shift();
		v.zustimmung.shift();
		for (const g of GRUPPEN) v.laune[g.id]?.shift();
	}
}
//#endregion
//#region game/src/sim/personen-monat.ts
/** Die monatliche Wirkung des Ressorts: Bei Leistung über 0,5 bewegt es seine Größen zum Guten, darunter zum Schlechten. */
function ressortWirkung(w, f) {
	const d = AEMTER[f.amt];
	if (!d.wirkung.length) return;
	const faktor = 2 * (leistung(w, f) - .5);
	for (const x of d.wirkung) wirke(w, x.id, x.d * faktor);
}
function auftragMonat(w, f) {
	const e = eigenVon(w, f);
	const a = e.auftrag;
	if (!a || a.status !== "laeuft") return;
	wirke(w, a.groesse, a.richtung * .6 * leistung(w, f));
	if (w.day < a.frist) return;
	const jetzt = wertVon(w, a.groesse);
	const erreicht = (jetzt - a.vorher) * a.richtung >= a.delta - .3;
	a.nachher = jetzt;
	e.bilanz ??= {
		erfuellt: 0,
		verfehlt: 0
	};
	if (erreicht) {
		a.status = "erfuellt";
		e.bilanz.erfuellt++;
		loyalitaetVerschieben(f, 8);
		e.ehrgeiz = Math.min(100, e.ehrgeiz + 3);
		wirke(w, "legitimitaet", .3);
		merke(w, f, `Auftrag erfüllt: ${a.text}`);
		addLog(w, "ereignis", `${f.rolle} ${f.name} hat den Auftrag erfüllt: ${a.text} (${nf$3(a.vorher, 0)} auf ${nf$3(jetzt, 0)}).`, "Wer liefert, wird loyaler; Erfolge im Ressort zahlen auf die Legitimität ein.");
	} else {
		a.status = "verfehlt";
		e.bilanz.verfehlt++;
		loyalitaetVerschieben(f, -5);
		grollVerschieben(w, f, 8);
		merke(w, f, `Auftrag verfehlt: ${a.text}`);
		addLog(w, "ereignis", `${f.rolle} ${f.name} hat den Auftrag verfehlt: ${a.text} (${nf$3(a.vorher, 0)} auf ${nf$3(jetzt, 0)}).`, "Ein verfehltes Ziel kostet Loyalität und macht Groll: Sie kann darauf hinweisen, dass Sie sie nicht unterstützt haben.");
	}
}
function personenMonat(w) {
	const sp = w.spiel;
	if (!sp) return;
	ergaenzeFiguren(w);
	zusagenMonat(w);
	ehemaligeMonat(w);
	for (const f of sp.figuren) {
		if (!f.imAmt || f.amt === "opposition") continue;
		const e = eigenVon(w, f);
		if (e.ehrgeiz >= 70 && f.loyalitaet < 50) grollVerschieben(w, f, 2);
		else if (f.loyalitaet < 30) grollVerschieben(w, f, 1);
		else grollVerschieben(w, f, -1);
		if (e.groll >= 60) loyalitaetVerschieben(f, -.5);
		if (AEMTER[f.amt].regierungsamt) {
			ressortWirkung(w, f);
			auftragMonat(w, f);
		}
	}
}
//#endregion
//#region game/src/sim/ziele.ts
function akutAnzahl(w, id) {
	const i = NET.index.get(id);
	const node = i === void 0 ? void 0 : NET.nodes[i];
	if (i === void 0 || !node?.threshold) return 0;
	let n = 0;
	for (let p = 0; p < 81; p++) if (w.net.values[i * 81 + p] >= node.threshold) n++;
	return n;
}
function minimum(w, id) {
	const i = NET.index.get(id);
	if (i === void 0) return NaN;
	let m = 100;
	for (let p = 0; p < 81; p++) m = Math.min(m, w.net.values[i * 81 + p]);
	return m;
}
const nf$1 = (x) => x.toLocaleString("de-DE", {
	maximumFractionDigits: 1,
	minimumFractionDigits: 1
});
const ZIELE = [
	{
		id: "inflation15",
		titel: "Inflation unter 15 Prozent",
		beschreibung: "Die veröffentlichte Inflation liegt zum Ende der Amtszeit unter 15 %.",
		pruefe: (w) => ({
			erreicht: w.published.inflation.value < 15,
			stand: `jetzt ${nf$1(w.published.inflation.value)} %`
		})
	},
	{
		id: "arbeit8",
		titel: "Arbeitslosigkeit unter 8 Prozent",
		beschreibung: "Die Arbeitslosenquote liegt zum Ende unter 8 %.",
		pruefe: (w) => ({
			erreicht: w.economy.unemployment < 8,
			stand: `jetzt ${nf$1(w.economy.unemployment)} %`
		})
	},
	{
		id: "schulden30",
		titel: "Schuldenquote unter 30 Prozent",
		beschreibung: "Die Staatsschulden liegen zum Ende unter 30 % des BIP.",
		pruefe: (w) => ({
			erreicht: w.economy.debtRatio < 30,
			stand: `jetzt ${nf$1(w.economy.debtRatio)} %`
		})
	},
	{
		id: "wasserstrom",
		titel: "Wasser und Strom sichern",
		beschreibung: "Kein akuter Wassermangel und keine akuten Stromausfälle in irgendeiner Provinz.",
		pruefe: (w) => {
			const n = akutAnzahl(w, "p_wassermangel") + akutAnzahl(w, "p_stromausfaelle");
			return {
				erreicht: n === 0,
				stand: n === 0 ? "in keiner Provinz akut" : `noch in ${n} Fällen akut`
			};
		}
	},
	{
		id: "erdbeben",
		titel: "Erdbebensicher bauen",
		beschreibung: "Die Erdbebengefahr ist in höchstens 5 Provinzen akut.",
		pruefe: (w) => {
			const n = akutAnzahl(w, "p_erdbebengefahr");
			return {
				erreicht: n <= 5,
				stand: `akut in ${n} Provinzen`
			};
		}
	},
	{
		id: "wohnen",
		titel: "Wohnungsnot beenden",
		beschreibung: "Die Wohnungsnot ist in keiner Provinz akut.",
		pruefe: (w) => {
			const n = akutAnzahl(w, "p_wohnungsnot");
			return {
				erreicht: n === 0,
				stand: n === 0 ? "in keiner Provinz akut" : `akut in ${n} Provinzen`
			};
		}
	},
	{
		id: "aerzte",
		titel: "Ärzte für alle Provinzen",
		beschreibung: "Der Ärztemangel ist in keiner Provinz akut.",
		pruefe: (w) => {
			const n = akutAnzahl(w, "p_aerztemangel");
			return {
				erreicht: n === 0,
				stand: n === 0 ? "in keiner Provinz akut" : `akut in ${n} Provinzen`
			};
		}
	},
	{
		id: "strassen",
		titel: "Keine abgehängte Provinz",
		beschreibung: "Das Straßennetz liegt in jeder Provinz mindestens auf Stufe 45.",
		pruefe: (w) => {
			const m = minimum(w, "verkehrsnetz");
			return {
				erreicht: m >= 45,
				stand: `schwächste Provinz: Stufe ${nf$1(m)}`
			};
		}
	},
	{
		id: "mehrheit",
		titel: "Regierungsmehrheit halten",
		beschreibung: "Das Regierungslager hat am Ende mindestens 301 Sitze.",
		pruefe: (w) => {
			const s = stimmenSicht(w);
			return {
				erreicht: s.lager >= 301,
				stand: `${s.lager} von 600 Sitzen`
			};
		}
	},
	{
		id: "vertrauen60",
		titel: "Vertrauen gewinnen",
		beschreibung: "Das mittlere Vertrauen in die Regierung liegt am Ende bei mindestens 60.",
		pruefe: (w) => {
			const v = nationalAverage(NET, w.net, "vertrauen_regierung");
			return {
				erreicht: v >= 60,
				stand: `jetzt ${nf$1(v)}`
			};
		}
	}
];
function zielDef(id) {
	return ZIELE.find((z) => z.id === id);
}
function zielStand(w) {
	return (w.spiel?.ziele ?? []).flatMap((id) => {
		const def = zielDef(id);
		if (!def) return [];
		return [{
			def,
			...def.pruefe(w)
		}];
	});
}
//#endregion
//#region game/src/sim/bilanz.ts
function akuteProbleme(w) {
	let n = 0;
	for (const node of NET.nodes) {
		if (node.kind !== "problem" || !node.threshold) continue;
		const i = NET.index.get(node.id);
		for (let p = 0; p < 81; p++) if (w.net.values[i * 81 + p] >= node.threshold) {
			n++;
			break;
		}
	}
	return n;
}
//#endregion
//#region game/src/sim/spiel.ts
/** Die Schwierigkeit verändert nur drei Stellschrauben: das Einkommen an Kapital, die Regierungsmüdigkeit und die Häufigkeit und Härte von Ereignissen. */
const SCHWIERIGKEITEN = {
	entspannt: {
		name: "Entspannt",
		text: "Mehr Kapital, weniger Müdigkeit, weniger Krisen. Zum Kennenlernen.",
		kapital: 1.25,
		muedigkeit: .75,
		ereignisse: .85,
		haerte: .9
	},
	normal: {
		name: "Normal",
		text: "Das Spiel, wie es gemeint ist.",
		kapital: 1,
		muedigkeit: 1,
		ereignisse: 1,
		haerte: 1
	},
	hart: {
		name: "Hart",
		text: "Knappes Kapital, schnelle Müdigkeit, mehr und härtere Krisen. Fehler kosten die Wiederwahl.",
		kapital: .8,
		muedigkeit: 1.22,
		ereignisse: 1.25,
		haerte: 1.2
	}
};
function schwierig(world) {
	return SCHWIERIGKEITEN[world.spiel?.schwierigkeit ?? "normal"];
}
const SPIEL = {
	startKapital: 60,
	/** Kapital je Monat: Grundeinkommen, dazu Vertrauen und Mehrheit */
	kapitalGrund: 3.5,
	kapitalVertrauen: 5,
	kapitalMehrheit: 1.5,
	/** Verlust an Zustimmung je Monat im Amt (Regierungsmüdigkeit) */
	muedigkeit: .3,
	/** Gewicht der Probleme in der Zustimmung: Summe der Bevölkerungsanteile in Provinzen mit akutem Problem */
	problemGewicht: 4,
	/** Monate unter der Sturzschwelle bis zum Sturz */
	sturzMonate: 6,
	sturzSchwelle: 25,
	amtszeitJahre: 5
};
function problemLast(w) {
	let summe = 0;
	for (const node of NET.nodes) {
		if (node.kind !== "problem" || !node.threshold) continue;
		const i = NET.index.get(node.id);
		let anteil = 0;
		for (let p = 0; p < 81; p++) if (w.net.values[i * 81 + p] >= node.threshold) anteil += w.net.weights[p];
		summe += anteil;
	}
	return summe;
}
/** Die Bestandteile der Zustimmung; jeder Teil steht für sich, damit die Oberfläche erklären kann, woher die Zahl kommt. */
function zustimmungsTeile(w, monate) {
	const s0 = w.spiel.start;
	const e = w.economy;
	const vertrauen = nationalAverage(NET, w.net, "vertrauen_regierung");
	const gruppen = GRUPPEN.reduce((s, g) => s + g.gewicht * nationalAverage(NET, w.net, g.id), 0) / GRUPPEN_SUMME;
	const wirtschaft = clamp(50 + .6 * (s0.inflation - e.inflation) - 3 * (e.unemployment - s0.arbeitslosigkeit) + 1.5 * (e.growth - s0.wachstum), 0, 100);
	const probleme = SPIEL.problemGewicht * problemLast(w);
	const muedigkeit = SPIEL.muedigkeit * schwierig(w).muedigkeit * monate;
	return {
		vertrauen,
		gruppen,
		wirtschaft,
		probleme,
		muedigkeit,
		roh: .45 * vertrauen + .25 * gruppen + .3 * wirtschaft - probleme - muedigkeit
	};
}
/** Zustimmung, wie sie sich aus dem Zustand ergäbe (ohne Startverschiebung). */
function rohZustimmung(w, monate) {
	return zustimmungsTeile(w, monate).roh;
}
function zielZustimmung(w) {
	const x = rohZustimmung(w, w.day / 30.4) + w.spiel.kalibrierung;
	return clamp(x > 50 ? 50 + .65 * (x - 50) : x, 0, 100);
}
function tageBis(von, bis) {
	return Math.round((Date.parse(bis + "T00:00:00Z") - Date.parse(von + "T00:00:00Z")) / 864e5);
}
function zusagenAusProfil(profil) {
	const out = [];
	const neu = (id, von, text, faellig, massnahme) => {
		const z = {
			id,
			von,
			text,
			faellig,
			erfuellt: false,
			gebrochen: false
		};
		if (massnahme) {
			z.massnahme = massnahme;
			z.richtung = 1;
		}
		out.push(z);
	};
	for (const v of profil.versprechen) if (v.includes("zwei Ministerien")) neu("z-ministerien", "YENİ", "Der YENİ Parti wurden zwei Ministerien zugesagt", 45);
	else if (v.includes("Mitspracherecht")) neu("z-friedensprozess", "MHP", "Der MHP wurde ein Mitspracherecht beim Friedensprozess zugesagt", 60);
	else if (v.includes("Rentenerhöhung")) neu("z-renten", "Wähler", "Rentenerhöhung in den ersten hundert Tagen versprochen", 100, "m_renten");
	else if (v.includes("Vergaben")) neu("z-vergaben", "Wähler", "Offene Vergaben und Vermögenserklärungen versprochen", 150, "m_antikorruption");
	return out;
}
/** Erzeugt die Spielschleife beim Amtsantritt und öffnet die drei Vorgänge des ersten Tages. */
function initSpiel(world, profil, rng) {
	aussenweltStart(world);
	const start = {
		inflation: world.published.inflation.value,
		arbeitslosigkeit: world.economy.unemployment,
		wachstum: world.economy.growth,
		schulden: world.economy.debtRatio,
		vertrauen: nationalAverage(NET, world.net, "vertrauen_regierung"),
		akut: 0,
		datum: world.date
	};
	const spiel = {
		kapital: SPIEL.startKapital,
		gesetze: [],
		ereignisse: [],
		zuletzt: {},
		figuren: [],
		zusagen: zusagenAusProfil(profil),
		umfrage: {
			zustimmung: profil.wahl.anteil,
			verlauf: []
		},
		ziele: [],
		ersterTagErledigt: false,
		wahltag: tageBis(world.date, addDays(world.date, 365 * SPIEL.amtszeitJahre + 1)),
		amtszeit: 1,
		lager: profil.buendnis ? [profil.buendnis] : [],
		tiefstand: 0,
		chronik: [],
		hinweise: [],
		kalibrierung: 0,
		start
	};
	world.spiel = spiel;
	spiel.figuren = erzeugeFiguren(world, rng);
	const gouverneur = figur(world, "zentralbank");
	if (gouverneur) world.governor.name = gouverneur.name;
	spiel.start.akut = akuteProbleme(world);
	spiel.kalibrierung = profil.wahl.anteil - rohZustimmung(world, 0);
	oeffne(world, "start_haushalt", rng);
	oeffne(world, "start_partner", rng);
	oeffne(world, "start_wiederaufbau", rng);
}
function spielTick(world, rng) {
	const spiel = world.spiel;
	if (!spiel || spiel.ende) return;
	gesetzeAbstimmen(world, rng);
	ereignisTag(world, rng);
	programmTag(world);
	berichteTag(world);
	if (dayOfMonth(world.date) === 1) spielMonat(world, rng);
	if (world.day >= spiel.wahltag) wahl(world, rng);
}
function kapitalEinkommen(world) {
	const vertrauen = SPIEL.kapitalVertrauen * nationalAverage(NET, world.net, "vertrauen_regierung") / 100;
	const mehrheit = stimmenSicht(world).lager >= REGELN.mehrheit ? SPIEL.kapitalMehrheit : 0;
	const [j, m] = world.date.split("-").map(Number);
	const naechste = m === 12 ? `${j + 1}-01-01` : `${j}-${String(m + 1).padStart(2, "0")}-01`;
	const f = schwierig(world).kapital;
	const legit = nationalAverage(NET, world.net, "legitimitaet");
	const legitimitaet = Number.isFinite(legit) ? Math.max(-1, Math.min(1, (legit - 60) / 40)) : 0;
	return {
		grund: SPIEL.kapitalGrund * f,
		vertrauen: vertrauen * f,
		mehrheit: mehrheit * f,
		legitimitaet: legitimitaet * f,
		summe: (SPIEL.kapitalGrund + vertrauen + mehrheit + legitimitaet) * f,
		naechste,
		grenze: REGELN.kapitalMax
	};
}
function spielMonat(world, rng) {
	const spiel = world.spiel;
	spiel.kapital = Math.min(REGELN.kapitalMax, spiel.kapital + kapitalEinkommen(world).summe);
	if (spiel.kapital < 0) {
		const last = Math.min(1, -spiel.kapital / 12);
		wirke(world, "legitimitaet", -.6 * last);
		wirke(world, "vertrauen_regierung", -.25 * last);
		if (!spiel.hinweise.some((h) => h.id.startsWith("pump-")) && world.day - (spiel.zuletzt.pump ?? -1e9) > 180) {
			spiel.zuletzt.pump = world.day;
			addLog(world, "ereignis", "Sie handeln auf Pump: Das Politische Kapital ist im Minus.", "Wer Rückhalt vorwegnimmt, zahlt mit Legitimität und Vertrauen, bis die monatliche Gutschrift das Konto ausgleicht.");
		}
	}
	verhandlungMonat(world);
	weltMonat(world);
	abkommenMonat(world, rng);
	reichMonat(world, rng);
	aussenweltMonat(world, rng);
	ereignisMonat(world, rng);
	const ziel = zielZustimmung(world);
	spiel.umfrage.zustimmung += .35 * (ziel - spiel.umfrage.zustimmung);
	spiel.umfrage.verlauf.push({
		monat: world.date.slice(0, 7),
		wert: Math.round(spiel.umfrage.zustimmung * 10) / 10
	});
	if (spiel.umfrage.verlauf.length > 120) spiel.umfrage.verlauf.shift();
	verlaufAufzeichnen(world);
	if (spiel.umfrage.zustimmung < SPIEL.sturzSchwelle) spiel.tiefstand += 1;
	else spiel.tiefstand = Math.max(0, spiel.tiefstand - 1);
	if (spiel.tiefstand === 3) {
		spiel.hinweise.push({
			id: `warnung-${world.day}`,
			titel: "Warnzeichen",
			szene: "istanbul",
			text: [`Die Zustimmung liegt seit drei Monaten unter ${SPIEL.sturzSchwelle} Prozent. Auf den Plätzen sammeln sich Menschen; ${anrede(figur(world, "stab"))} warnt vor Massenprotesten.`, "Wenn sich nichts ändert, droht das Ende der Amtszeit lange vor der nächsten Wahl."]
		});
		addLog(world, "ereignis", "Warnzeichen: Die Zustimmung bleibt sehr niedrig.", "Nach sechs Monaten unter der Schwelle droht der Sturz.");
	}
	if (spiel.tiefstand >= SPIEL.sturzMonate) {
		beende(world, "sturz", "Massenproteste beenden die Amtszeit", `Nach Monaten unter ${SPIEL.sturzSchwelle} Prozent Zustimmung zwingen Massenproteste, ein Bruch im Lager und der Druck der Straße den Präsidenten aus dem Amt.`);
		return;
	}
	personenMonat(world);
	figurenPruefen(world, rng);
}
function figurenPruefen(world, rng) {
	const spiel = world.spiel;
	for (const f of spiel.figuren) if (f.amt === "partner" && f.partei && spiel.lager.includes(f.partei) && f.loyalitaet < 20) {
		spiel.lager = spiel.lager.filter((p) => p !== f.partei);
		const seats = world.parliament?.seats[f.partei] ?? 0;
		addLog(world, "ereignis", `Die ${f.partei} verlässt das Regierungslager (${seats} Sitze).`, "Ohne die Partner wird jede Abstimmung schwerer; Zusagen zu brechen hat einen Preis.");
		spiel.hinweise.push({
			id: `bruch-${world.day}-${f.partei}`,
			titel: "Bruch im Lager",
			szene: "parlament",
			text: [`Die ${f.partei} kündigt die Zusammenarbeit auf und verlässt das Regierungslager. Dem Lager fehlen damit ${seats} Sitze.`]
		});
		f.loyalitaet = 30;
	}
	for (const f of spiel.figuren) {
		if (!f.imAmt || !AEMTER[f.amt].regierungsamt || f.eigen?.kommissarisch || f.loyalitaet >= 12) continue;
		if (rng.next() < .4) ausscheiden(world, f, "Rücktritt, weil ihm der Rückhalt fehlt");
	}
}
function beende(world, art, titel, text, anteil) {
	const spiel = world.spiel;
	spiel.ende = {
		tag: world.day,
		datum: world.date,
		art,
		titel,
		text,
		...anteil !== void 0 ? { anteil } : {}
	};
	spiel.ereignisse = [];
	spiel.gesetze = [];
	addLog(world, "ereignis", titel, text);
}
function wahl(world, rng) {
	const spiel = world.spiel;
	const anteil = clamp(spiel.umfrage.zustimmung + rng.normal(2.2), 0, 100);
	const name = world.player?.name ?? "Der Präsident";
	if (anteil >= 50) {
		if (spiel.amtszeit === 1) {
			spiel.amtszeit = 2;
			spiel.wahltag = world.day + 365 * SPIEL.amtszeitJahre + 1;
			spiel.chronik.push({
				tag: world.day,
				datum: world.date,
				titel: "Wiederwahl",
				ausgang: `${name} wird mit ${fmt(anteil)} Prozent wiedergewählt.`
			});
			addLog(world, "ereignis", `Wahlabend: ${name} wird mit ${fmt(anteil)} Prozent im Amt bestätigt.`, "Eine zweite Amtszeit ist die letzte; danach schreibt die Verfassung eine Pause vor.");
			spiel.hinweise.push({
				id: `wahl-${world.day}`,
				titel: "Wahlabend: Wiederwahl",
				szene: "wahlnacht",
				text: [`${name} gewinnt die Präsidentschaftswahl mit ${fmt(anteil)} Prozent. Die zweite Amtszeit beginnt; sie ist die letzte.`]
			});
		} else beende(world, "amtszeitende", "Ende der zweiten Amtszeit", `Nach zwei Amtszeiten endet die Zeit im Amt; die Verfassung erlaubt keine weitere.`, anteil);
	} else beende(world, "abwahl", "Abgewählt", `Bei der Wahl am ${formatDateDe(world.date)} erhält ${name} nur ${fmt(anteil)} Prozent der Stimmen.`, anteil);
}
//#endregion
//#region game/src/sim/waehler.ts
function launenWort(x) {
	if (x >= 70) return "begeistert";
	if (x >= 58) return "zufrieden";
	if (x >= 45) return "gemischt";
	if (x >= 33) return "verärgert";
	return "wütend";
}
function vorMonaten(world, id, n) {
	const s = world.net;
	const i = NET.index.get(id);
	if (i === void 0 || world.day < 30 * n) return null;
	const slot = s.history[(s.month - n + s.history.length * 1e3) % s.history.length];
	if (!slot) return null;
	let sum = 0;
	let w = 0;
	for (let p = 0; p < 81; p++) {
		sum += slot[i * 81 + p] * s.weights[p];
		w += s.weights[p];
	}
	return w > 0 ? sum / w : null;
}
function abweichung(world, id) {
	const node = NET.nodes[NET.index.get(id)];
	const s0 = world.spiel?.start;
	if (node.input) {
		if (!s0) return 0;
		if (id === "inflation") return world.economy.inflation - s0.inflation;
		if (id === "arbeitslosigkeit") return world.economy.unemployment - s0.arbeitslosigkeit;
		if (id === "wachstum") return world.economy.growth - s0.wachstum;
		return 0;
	}
	return nationalAverage(NET, world.net, id) - startAverage(NET, world.net, id);
}
function waehlerLage(world) {
	const lage = [];
	for (const g of GRUPPEN) {
		const node = NET.nodes[NET.index.get(g.id)];
		const laune = nationalAverage(NET, world.net, g.id);
		const frueher = vorMonaten(world, g.id, 3);
		const mitWert = NET.edges.filter((e) => e.to === g.id).map((e) => ({
			e,
			wert: e.weight * abweichung(world, e.from)
		}));
		const bewegt = mitWert.filter((m) => Math.abs(m.wert) > .02).sort((a, b) => Math.abs(b.wert) - Math.abs(a.wert));
		const veraendert = bewegt.length > 0;
		const gruende = (veraendert ? bewegt : [...mitWert].sort((a, b) => Math.abs(b.e.weight) - Math.abs(a.e.weight)).map((m) => ({
			...m,
			wert: m.e.weight
		}))).slice(0, 4).map((m) => ({
			name: NET.nodes[NET.index.get(m.e.from)].name,
			richtung: m.wert >= 0 ? 1 : -1,
			text: m.e.why,
			wert: Math.abs(m.wert)
		}));
		const forderungen = [];
		for (const h of hebel(g.id, 1, 10)) {
			NET.index.get(h.node.id);
			const jetzt = nationalAverage(NET, world.net, h.node.id);
			if (h.richtung > 0 && jetzt >= 92 || h.richtung < 0 && jetzt <= 8) continue;
			forderungen.push({
				massnahme: h.node.id,
				name: h.node.name,
				richtung: h.richtung,
				stufe: Math.round(jetzt)
			});
			if (forderungen.length >= 3) break;
		}
		const anteil = g.gewicht / GRUPPEN_SUMME;
		lage.push({
			id: g.id,
			name: node.name,
			text: node.text,
			anteil,
			laune,
			trend: frueher === null ? null : laune - frueher,
			wort: launenWort(laune),
			gruende,
			veraendert,
			forderungen,
			beitrag: .25 * anteil * (laune - 50)
		});
	}
	return lage.sort((a, b) => b.anteil - a.anteil);
}
//#endregion
//#region game/src/sim/personen-api.ts
/** Ein Textblock über das ganze Umfeld für das Sprachmodell: Zahlen und Zustand, keine Empfehlung. */
function umfeldKontext(w) {
	const sp = w.spiel;
	if (!sp) return "";
	const t = termineInfo(w);
	const b = zusagenBilanz(w);
	const zeilen = [`Umfeld (Termine ${t.belegt}/${t.max} in 30 Tagen; Glaubwürdigkeit ${Math.round(b.glaubwuerdigkeit)} ${b.wort}; Zusagen: ${b.gehalten} gehalten, ${b.gebrochen} gebrochen, ${b.offen} offen):`];
	for (const f of sp.figuren) {
		if (!f.imAmt) continue;
		const e = eigenVon(w, f);
		const kurz = [`${f.rolle} ${f.name}: Loyalität ${Math.round(f.loyalitaet)}, Groll ${Math.round(e.groll)}, Ehrgeiz ${Math.round(e.ehrgeiz)}, ${e.stil}`];
		if (AEMTER[f.amt].wirkung.length) kurz.push(`Ressort ${leistungWort(leistung(w, f))}`);
		if (e.kommissarisch) kurz.push("kommissarisch");
		if (e.auftrag?.status === "laeuft") kurz.push(`Auftrag: ${e.auftrag.text} bis ${formatDateDe(addDays(sp.start.datum, e.auftrag.frist))}`);
		const er = erinnerungen(f)[0];
		if (er) kurz.push(`zuletzt: ${er.text}`);
		zeilen.push(`- ${kurz.join("; ")}. Sorge: ${sorgeText(w, f)}`);
	}
	return zeilen.join("\n");
}
//#endregion
//#region game/src/ki/kontext.ts
const MASSNAHMEN = NET.nodes.filter((n) => n.kind === "massnahme");
/** Der feste Teil: ändert sich nicht während der Partie und wird deshalb vom Anbieter zwischengespeichert. */
function systemText() {
	return `Du bist das Präsidialamt im Strategiespiel „Staatsräson“. Der Spieler ist Staatspräsident der Türkei. Du bist eine neutrale, sachkundige Mentorin: Du erklärst die Lage ehrlich, benennst Zielkonflikte und Preise, nimmst keine Partei und sprichst Deutsch in der Anrede „Sie“, sachlich und knapp (meist höchstens 120 Wörter).

DAS SPIEL IN KÜRZE
- Politisches Kapital ist die Handlungswährung. Es ist kein Geld, sondern Rückhalt: Es wächst monatlich (Grundeinkommen, Vertrauen, Mehrheit) und sammelt sich bis höchstens 150 an. Gesetze, Erlasse, Verhandlungen und Antworten auf Ereignisse verbrauchen es.
- Maßnahmen bilden ein Politiknetz. Jede hat eine Stufe von 0 bis 100, landesweit oder in einzelnen Provinzen. Änderungen wirken verzögert (Monate bis Jahre) auf Größen, Probleme und Wählergruppen; jede hat Gewinner und Verlierer.
- Zwei Wege: ein Gesetz braucht 301 von 600 Stimmen, wird nach 21 Tagen abgestimmt und kostet Kapital; ein Erlass gilt sofort, ist teurer und nur bei manchen Vorhaben möglich. Verwaltungskapazität begrenzt, wie viele Vorhaben gleichzeitig laufen.
- Das Parlament hat Fraktionen. Man gewinnt sie über Gespräch, Zugeständnis, Duldung (sechs Monate Stimmen bei Gesetzen), Bündnis oder Abwerben. Zusagen müssen gehalten werden, sonst sinkt das Vertrauen.
- Ereignisse verlangen Entscheidungen bis zu einer Frist. „Abwarten“ ist immer möglich, hat aber Folgen.
- Elf Wählergruppen; ihre Laune bestimmt zusammen mit Vertrauen, Wirtschaft, akuten Problemen und Regierungsmüdigkeit die Zustimmung. Ziel ist die Wiederwahl und die gewählten Ziele.
- Andere Länder haben Vertrauen, Handel, Sicherheit und Konflikt; Handlungen ihnen gegenüber kosten Kapital und haben Abkühlzeiten.
- Regierungsprogramme bestehen aus Schritten mit Bedingungen und belohnen mit Rabatt, Schutz oder Wirkung.
- Das Reich: Vorhaben (Wunder, Großprojekte, Restaurierungen, Reformen, Beschaffungen, Institutionen) kosten Kapital beim Beginn, dazu Baukapazität und Verwaltungskraft über Monate; fertige Vorhaben wirken dauerhaft und verfallen ohne Pflege. Nicht alles ist Geld: Justizsitze, Kulturerbe, Truppenbereitschaft, Legitimität sind eigene Größen.
- Verträge mit anderen Ländern bestehen aus Klauseln: Die Türkei „bietet“ (gibt) etwas und „verlangt“ (will) etwas. Die Gegenseite bewertet das ganze Paket (Wert der Klauseln, Vertrauen, Streit, Abhängigkeit, frühere Brüche) und stimmt zu, macht ein Gegenangebot oder lehnt ab; eine Rote Linie ist ein Veto. Verträge wirken monatlich, werden jährlich geprüft und können gebrochen werden.
- Kapital darf bis 20 Punkte ins Minus gehen („auf Pump“); das kostet Legitimität und Vertrauen in jedem Monat, in dem es negativ bleibt.
- Die Zentralbank ist unabhängig. Der Leitzins ist nicht einstellbar; möglich sind öffentliche Kritik, Austausch der Führung und die Haushaltspolitik.

REGELN FÜR DICH
1. Nenne nur Zahlen, die im ZUSTAND stehen. Erfinde nichts; fehlt etwas, sag es.
2. Du führst nichts selbst aus. Wenn der Spieler etwas tun will, schlage die passenden Aktionen vor; der Spieler bestätigt sie.
3. Bei unklaren Wünschen: eine kurze Rückfrage, keine Aktion.
4. Gibt es etwas im Spiel nicht, sag es ehrlich und nenne die nächstliegende Möglichkeit.
5. Erkläre bei Vorschlägen kurz das Warum und den Preis (Kapital, Nebenwirkungen, Dauer).
6. Schlage höchstens drei Aktionen vor. Verwende ausschließlich IDs aus den Listen unten oder aus dem ZUSTAND.
7. Bewerte nicht politisch, sondern nach Wirkung im Spiel („das hilft den Rentnern, belastet aber …“).

AUSGABEFORMAT: Antworte ausschließlich mit einem JSON-Objekt, ohne Text davor oder danach, ohne Markdown-Zäune:
{"antwort":"Text für den Spieler","aktionen":[ … ]}
Ohne Aktion: "aktionen":[]. Mögliche Aktionen (Feld "art"):
{"art":"massnahme","id":"<Maßnahmen-ID>","stufe":<Ziel 0-100> ODER "richtung":1|-1,"orte":["Provinzname",…] ODER null,"weg":"gesetz"|"erlass","grund":"…"}
{"art":"land","land":"<Länder-ID>","handlung":"gipfel|handel|ruestung|druck|entspannen|hilfe","grund":"…"}
{"art":"fraktion","partei":"<Kürzel>","handlung":"gespraech|zugestaendnis|duldung|koalition|abwerben","grund":"…"}
{"art":"figur","amt":"finanzen|inneres|aussen|stab","handlung":"gespraech|entlassen","grund":"…"}
{"art":"programm","grund":"…"}  (nächsten Programmschritt starten)
{"art":"haushalt","handlung":"posten","posten":"<Posten-ID>","stufe":-2..2,"grund":"…"}  (Haushaltsregler; Stufe 0 = Plan 2026)
{"art":"haushalt","handlung":"mehr_ausgeben|sparen|zentralbank_kritisieren|zentralbank_fuehrung_tauschen","grund":"…"}
{"art":"ereignis","id":"<Ereignis-ID>","option":"<Options-ID>","grund":"…"}
{"art":"zeit","tage":<1-90>,"grund":"…"}
{"art":"vorhaben","id":"<Vorhaben-ID>","grund":"…"}  (ein Vorhaben des Reiches beginnen)
{"art":"abkommen","land":"<Länder-ID>","bieten":["<Klausel-ID>",…],"verlangen":["<Klausel-ID>",…],"jahre":2|5|10,"grund":"…"}  (Vertrag anbieten; nur Klauseln, die es bei dem Land gibt)
{"art":"vermittlung","id":"ukr_rus|arm_aze","grund":"…"}

MASSNAHMEN (ID: Name)
${MASSNAHMEN.map((n) => `${n.id}: ${n.name}`).join("\n")}

LÄNDER (ID: Name)
${LAENDER.map((l) => `${l.id}: ${l.name}`).join("; ")}

HAUSHALTSPOSTEN (ID: Name)
${POSTEN.map((p) => `${p.id}: ${p.name} (${p.seite})`).join("\n")}

VORHABEN DES REICHES (ID: Name)
${VORHABEN.map((v) => `${v.id}: ${v.name}`).join("\n")}

KLAUSELN JE LAND (bieten = die Türkei gibt, verlangen = die Türkei erhält)
${LAENDER.map((l) => {
		const werte = PROFILE[l.id]?.werte ?? {};
		const gibt = Object.keys(werte).filter((id) => KLAUSELN.find((k) => k.id === id)?.seite === "gibt");
		const will = Object.keys(werte).filter((id) => KLAUSELN.find((k) => k.id === id)?.seite === "will");
		return `${l.id}: bieten ${gibt.join(", ")}; verlangen ${will.join(", ")}`;
	}).join("\n")}`;
}
const nf = (x, d = 1) => x.toLocaleString("de-DE", {
	minimumFractionDigits: d,
	maximumFractionDigits: d
});
const rund = (x) => String(Math.round(x));
function namenListe(provinzen, max = 4) {
	const n = provinzen.map((p) => PROVINZEN[p - 1]?.name ?? String(p));
	return n.length <= max ? n.join(", ") : `${n.slice(0, max).join(", ")} und ${n.length - max} weitere`;
}
/** Die Lage der Partie als Text: alles, was das Modell zum Beraten braucht, und nicht mehr. */
function zustandsText(w) {
	const spiel = w.spiel;
	if (!spiel) return "Die Partie hat noch keine Spielschleife.";
	const z = [];
	const e = kapitalEinkommen(w);
	const tageBisWahl = Math.max(0, spiel.wahltag - w.day);
	const verlauf = spiel.umfrage.verlauf;
	const trend = verlauf.length > 3 ? spiel.umfrage.zustimmung - verlauf[verlauf.length - 4].wert : void 0;
	z.push(`ZUSTAND am ${formatDateDe(w.date)} (Amtszeit ${spiel.amtszeit}, Wahl in ${tageBisWahl} Tagen)`);
	z.push(`Zustimmung ${nf(spiel.umfrage.zustimmung, 0)} %${trend !== void 0 ? ` (${trend >= 0 ? "+" : "−"}${nf(Math.abs(trend))} seit drei Monaten)` : ""}. Kapital ${rund(spiel.kapital)} von ${e.grenze}, etwa ${nf(e.summe)} je Monat.`);
	z.push(`Wirtschaft (veröffentlicht): Inflation ${nf(w.published.inflation.value)} %, Arbeitslosigkeit ${nf(w.published.unemployment.value)} %, Wachstum ${nf(w.published.growth.value)} %. Leitzins ${nf(w.economy.policyRate)} %, Lira ${nf(w.economy.usdTry)} je Dollar, Schulden ${nf(w.economy.debtRatio)} % des BIP.`);
	const s = stimmenSicht(w);
	z.push(`Parlament: Lager ${s.lager} von 600 Sitzen, Duldung ${s.duldungSitze}; nötig sind 301.`);
	const fr = fraktionsUebersicht(w);
	if (fr.length) z.push("Fraktionen: " + fr.map((f) => `${f.partei} (${f.sitze} Sitze, ${f.status === "lager" ? "im Lager" : f.status === "duldung" ? "duldet" : "Opposition"}, ${f.wort}, will ${f.forderung})`).join("; "));
	if (spiel.gesetze.length) z.push("Im Parlament: " + spiel.gesetze.map((g) => `${g.name} (${g.provinzen ? namenListe(g.provinzen, 2) : "ganzes Land"}, Stufe ${g.stufe}, Abstimmung in ${Math.max(0, g.abstimmung - w.day)} Tagen)`).join("; "));
	const probleme = NET.nodes.filter((n) => n.kind === "problem" && n.threshold).map((n) => {
		const i = NET.index.get(n.id);
		const provinzen = [];
		for (let p = 0; p < 81; p++) if (w.net.values[i * 81 + p] >= n.threshold) provinzen.push(p + 1);
		return {
			n,
			provinzen,
			last: provinzen.reduce((sum, p) => sum + w.net.weights[p - 1], 0)
		};
	}).filter((x) => x.provinzen.length > 0).sort((a, b) => b.last - a.last).slice(0, 6);
	z.push(probleme.length ? "Akute Probleme: " + probleme.map((p) => `${p.n.name} (${p.provinzen.length} Provinzen: ${namenListe(p.provinzen, 3)})`).join("; ") : "Akute Probleme: keine.");
	z.push("Wählergruppen (Laune 0-100, 50 neutral): " + waehlerLage(w).map((g) => `${g.name} ${rund(g.laune)}${g.trend !== null && Math.abs(g.trend) >= 1 ? g.trend > 0 ? " steigend" : " fallend" : ""}`).join("; "));
	const ziele = zielStand(w);
	if (ziele.length) z.push("Ziele: " + ziele.map((t) => `${t.def.titel} (${t.erreicht ? "erreicht" : t.stand})`).join("; "));
	const wz = weltZustand(w);
	z.push("Länder (Vertrauen/Konflikt): " + LAENDER.map((l) => `${l.id} ${haltungWort(w, l.id)} ${rund(dimensionZu(w, l.id, "vertrauen"))}/${rund(wz[l.id].konflikt)}`).join("; "));
	const abweichend = POSTEN.filter((p) => stufeVon(w, p.id) !== 0).map((p) => `${p.id} ${stufeVon(w, p.id) > 0 ? "+" : ""}${stufeVon(w, p.id)}`);
	z.push(`Haushaltsregler (Abweichung vom Plan): ${abweichend.length ? abweichend.join(", ") : "keine"}.`);
	const rz = reichZustand(w);
	const vb = verwaltungBilanz(w);
	const laufendReich = rz.laufend.map((l) => {
		const sicht = vorhabenSicht(w, l.id);
		return `${l.id} (${Math.round((sicht?.fortschritt ?? 0) * 100)} %${l.pausiert ? ", ruht" : ""})`;
	});
	const beginnbar = VORHABEN.map((v) => vorhabenSicht(w, v.id)).filter((x) => x && x.status === "verfuegbar" && x.bereit && x.bezahlbar && x.verwaltungOk).slice(0, 14).map((x) => x.v.id);
	z.push(`Reich: Verwaltungskraft ${rund(vb.vorrat)} (${vb.netto >= 0 ? "+" : "−"}${nf(Math.abs(vb.netto))} je Monat), Baukapazität ${rund(bauKapazitaet(w))}. Fertig ${Object.keys(rz.bestand).length}. Laufend: ${laufendReich.length ? laufendReich.join(", ") : "keine"}. Sofort beginnbar: ${beginnbar.length ? beginnbar.join(", ") : "keine"}.`);
	const vertraege = alleLaufenden(w);
	z.push(vertraege.length ? "Verträge: " + vertraege.map((v) => `${v.land} bietet ${v.gibt.map((id) => klauselSicht(w, v.land, id)?.def.id ?? id).join("+") || "nichts"} / erhält ${v.will.join("+") || "nichts"} (${v.jahre} J., ${v.verstoesse} Verstöße)`).join("; ") : "Verträge: keine.");
	const schritt = naechsterSchritt(w);
	if (schritt) z.push(`Nächster Programmschritt: ${schritt.schritt.titel} (${schritt.status === "bereit" ? "bereit" : "noch nicht bereit"}, ${schritt.schritt.kapital} Kapital)`);
	z.push(umfeldKontext(w) || "Minister: " + spiel.figuren.filter((f) => f.imAmt && f.amt !== "opposition").map((f) => `${f.rolle} ${f.name} (${haltung(f)})`).join("; "));
	const offen = spiel.ereignisse.filter((ev) => !ev.vorlage.startsWith("start_")).slice(0, 3);
	if (offen.length) z.push("Offene Ereignisse: " + offen.map((ev) => {
		const a = ansicht(w, ev);
		return `[${a.id}] ${a.titel}, Frist in ${a.tageBisFrist} Tagen; Antworten: ${a.optionen.map((o) => `${o.id} = ${o.label} (${o.pk} Kapital)`).join(" | ")}`;
	}).join("; "));
	z.push("Stufen der Maßnahmen (Landesmittel): " + MASSNAHMEN.map((n) => `${n.id}=${rund(nationalAverage(NET, w.net, n.id))}`).join(" "));
	return z.join("\n");
}
//#endregion
//#region game/src/sim/zentralbank.ts
/** Wie empfänglich die Führung für Druck ist, je nach Haltung. */
const EMPFAENGLICH = {
	vorsichtig: .3,
	ausgewogen: .6,
	gefuegig: 1
};
function saetze(zeilen, max = 6) {
	return zeilen.slice(0, max).map(kettenZeile);
}
/**
* Die Zinssitzung des Geldpolitischen Ausschusses. Ohne Einfluss folgt die Bank ihrer Regel; mit Druck (Stufen A und B) verschiebt sie
* ihren Zielzins je nach Empfänglichkeit; in Stufe C bestimmt der Präsident den Zins. Jede Abweichung von der Regel sehen die Märkte.
*/
function zinssitzung(w) {
	const e = w.economy;
	const alt = e.policyRate;
	const regel = ppkDecision(e, w.governor.stance);
	if (!w.spiel) {
		e.policyRate = regel.newRate;
		addLog(w, "entscheidung", protokolltext(alt, regel.newRate), regel.why);
		return;
	}
	const z = zbZustand(w);
	const druck = z.druck && w.day - z.druck.tag <= 75 ? z.druck : null;
	let neu = regel.newRate;
	let begruendung = regel.why;
	let abw = 0;
	if (z.stufe === "C") {
		const ziel = z.vorgabe ?? ppkDecision(e, "gefuegig").newRate;
		neu = clamp(Math.round(ziel * 2) / 2, 0, 60);
		abw = neu - regel.newRate;
		begruendung = z.vorgabe != null ? "Auf Weisung der Regierung setzt der Ausschuss den Zins fest." : "Ohne Vorgabe folgt der Ausschuss der Linie der Regierung.";
		e.credibility = clamp(e.credibility - .005, .05, .95);
		e.riskPremium += 3;
	} else if (druck) {
		const emp = EMPFAENGLICH[w.governor.stance] * (z.stufe === "A" ? .5 : 1);
		const bias = druck.richtung * druck.staerke * emp * 3;
		neu = ppkDecision(e, w.governor.stance, bias).newRate;
		abw = neu - regel.newRate;
		if (abw === 0) begruendung = `Der Ausschuss bleibt bei seiner Linie: Die Gouverneurin lässt sich nicht beeinflussen. ${regel.why}`;
		else if (abw < 0) begruendung = "Der Ausschuss senkt stärker, als seine Regel vorsieht, und verweist auf Wachstum und Beschäftigung. Beobachter sehen den Druck der Regierung.";
		else begruendung = "Der Ausschuss strafft stärker, als seine Regel vorsieht, und stützt sich dabei auf die Rückendeckung der Regierung.";
	}
	e.policyRate = neu;
	if (abw < 0) {
		const a = -abw;
		e.credibility = clamp(e.credibility - .02 * a, .05, .95);
		e.riskPremium += 6 * a;
		e.usdTry *= 1 + .004 * a;
		e.eurTry *= 1 + .004 * a;
		wirke(w, "vertrauen_maerkte", -.8 * a);
		loyalitaetAendern(w, "zentralbank", -3 * a, "Die Gouverneurin fühlt sich zu einer Entscheidung gedrängt, die sie nicht für richtig hält.");
	} else if (abw > 0) {
		e.credibility = clamp(e.credibility + .01 * abw, .05, .95);
		e.riskPremium = Math.max(50, e.riskPremium - 3 * abw);
		wirke(w, "unternehmer", -.5 * abw);
	} else if (druck && z.stufe !== "C") loyalitaetAendern(w, "zentralbank", -2, "Die Gouverneurin hat den Versuch bemerkt, sie zu beeinflussen.");
	const delta = neu - alt;
	const folgen = delta !== 0 ? saetze(zinsKette(delta)) : [`Der Zins bleibt bei ${fmt(neu)} %: Frühere Entscheidungen wirken weiter, ihre Wirkung ist noch nicht ausgespielt.`];
	if (abw !== 0) folgen.push(...saetze(glaubwuerdigkeitsKette(abw < 0 ? -1 : 1), 3));
	const s = {
		tag: w.day,
		datum: w.date,
		alt,
		neu,
		regel: regel.newRate,
		abweichung: abw,
		...druck && z.stufe !== "C" ? { druck } : {},
		stufe: z.stufe,
		begruendung,
		folgen
	};
	z.sitzungen.push(s);
	if (z.sitzungen.length > 24) z.sitzungen.shift();
	z.druck = null;
	z.vorgabe = null;
	const text = protokolltext(alt, neu);
	addLog(w, "entscheidung", abw !== 0 && z.stufe !== "C" ? `${text} Der Zins weicht wegen des Drucks der Regierung von der Regel der Bank ab.` : text, begruendung);
	addMarke(w, "zins", `${text}${abw !== 0 ? " (auf Druck)" : ""}`);
}
function protokolltext(alt, neu) {
	return neu === alt ? `Die Zentralbank hält den Leitzins bei ${fmt(neu)} %.` : `Die Zentralbank ${neu > alt ? "erhöht" : "senkt"} den Leitzins von ${fmt(alt)} auf ${fmt(neu)} %.`;
}
//#endregion
//#region game/src/sim/wirtschaft-tick.ts
function wirtschaftMonat(world) {
	if (!world.spiel) return;
	haushaltMonat(world);
	zeichneAuf(world);
}
//#endregion
//#region game/src/sim/world.ts
/** Kopplung des Politiknetzes an das Wirtschaftsmodell (Platzhalter für die Kalibrierung). */
const COUPLING = {
	/** Prozentpunkte Inflation je Indexpunkt Kostendruck über dem Start */
	costPush: .08,
	/** Prozentpunkte Potenzialwachstum je Indexpunkt Produktivität über dem Start */
	productivity: .04
};
const PPK_INTERVAL_DAYS = 45;
function createWorld(scenario, seed) {
	const economy = {
		...Object.fromEntries(Object.entries(scenario.economy).map(([k, v]) => [k, v.value])),
		fxChange12: 0,
		policyCost: 0,
		costPush: 0,
		potentialShift: 0
	};
	const history = syntheticHistory(economy, scenario.startDate);
	economy.fxChange12 = (economy.usdTry / history[0].usdTry - 1) * 100;
	const ppkDays = [];
	for (let d = 20; d < 10950; d += PPK_INTERVAL_DAYS) ppkDays.push(d);
	const world = {
		scenarioId: scenario.id,
		seed,
		rngState: seedToState(seed),
		day: 0,
		date: scenario.startDate,
		economy,
		governor: { ...scenario.governor },
		ppkDays,
		history,
		published: structuredClone(scenario.published),
		log: [],
		net: createNet(NET, economy, REGIONAL, WEIGHTS)
	};
	addLog(world, "ereignis", "Amtsantritt. Die Wirtschaftsdaten stammen vom Stichtag " + formatDateDe(scenario.dataDate) + ".");
	return world;
}
/**
* Zwölf Monate Vorgeschichte, rückwärts aus den Startwerten abgeleitet, damit
* Vorjahresvergleiche und Verzögerungen vom ersten Tag an funktionieren.
* Die Auslastung vor einem Jahr ergibt sich aus dem gemessenen Wachstum.
*/
function syntheticHistory(e, startDate) {
	const gapYearAgo = e.outputGap - (e.growth - e.potentialGrowth);
	const monthlyDepreciation = Math.pow(1 + (e.inflation - 2.5) / 100, 1 / 12);
	const history = [];
	for (let k = 12; k >= 1; k--) {
		const share = (12 - k) / 11;
		history.push({
			month: previousMonth(monthOf(startDate), k),
			inflation: e.inflation,
			growth: e.growth,
			unemployment: e.unemployment,
			outputGap: gapYearAgo + share * (e.outputGap - gapYearAgo),
			realRate: realRate(e),
			usdTry: e.usdTry / Math.pow(monthlyDepreciation, k - 1),
			eurTry: e.eurTry / Math.pow(monthlyDepreciation, k - 1),
			policyRate: e.policyRate,
			riskPremium: e.riskPremium,
			debtRatio: e.debtRatio
		});
	}
	return history;
}
/** Einen Tag fortschreiben. */
function tick(world) {
	const rng = new Rng(world.rngState);
	world.day += 1;
	world.date = addDays(world.date, 1);
	const e = world.economy;
	const dep = dailyDepreciation(e, rng);
	e.usdTry *= 1 + dep;
	e.eurTry *= 1 + dep + rng.normal(.002);
	e.riskPremium = clamp(dailyRiskPremium(e, rng), 50, 2e3);
	if (world.ppkDays.includes(world.day)) zinssitzung(world);
	if (dayOfMonth(world.date) === 1) {
		monthlyUpdate(e, world.history, rng);
		world.history.push({
			month: previousMonth(monthOf(world.date)),
			inflation: e.inflation,
			growth: e.growth,
			unemployment: e.unemployment,
			outputGap: e.outputGap,
			realRate: realRate(e),
			usdTry: e.usdTry,
			eurTry: e.eurTry,
			policyRate: e.policyRate,
			riskPremium: e.riskPremium,
			debtRatio: e.debtRatio
		});
		publishQuarterlyGrowth(world);
		monthlyNet(world);
		wirtschaftMonat(world);
	}
	if (dayOfMonth(world.date) === 3) publishInflation(world);
	if (dayOfMonth(world.date) === 10) publishUnemployment(world);
	spielTick(world, rng);
	world.rngState = rng.state;
}
/** Politiknetz einen Monat fortschreiben und an das Wirtschaftsmodell zurückkoppeln. */
function monthlyNet(world) {
	const e = world.economy;
	stepNet(NET, world.net, e, REGIONAL);
	e.policyCost = policyCost(NET, world.net);
	const cost = nationalAverage(NET, world.net, "kostendruck") - startAverage(NET, world.net, "kostendruck");
	e.costPush = clamp(COUPLING.costPush * cost, -5, 5);
	const prod = nationalAverage(NET, world.net, "produktivitaet") - startAverage(NET, world.net, "produktivitaet");
	e.potentialShift = clamp(COUPLING.productivity * prod, -2, 2);
}
function advance(world, days) {
	for (let i = 0; i < days; i++) tick(world);
}
function findSnapshot(world, month) {
	return world.history.find((s) => s.month === month);
}
function publishInflation(world) {
	const month = previousMonth(monthOf(world.date));
	const snap = findSnapshot(world, month);
	if (!snap) return;
	const before = world.published.inflation.value;
	world.published.inflation = {
		value: snap.inflation,
		period: month,
		publishedOn: world.date
	};
	addLog(world, "statistik", `Inflation ${formatMonthDe(month)}: ${fmt(snap.inflation)} % zum Vorjahr (zuvor ${fmt(before)} %).`);
}
function publishUnemployment(world) {
	const month = previousMonth(monthOf(world.date), 2);
	const snap = findSnapshot(world, month);
	if (!snap) return;
	world.published.unemployment = {
		value: snap.unemployment,
		period: month,
		publishedOn: world.date
	};
	addLog(world, "statistik", `Arbeitslosenquote ${formatMonthDe(month)}: ${fmt(snap.unemployment)} %.`);
}
function publishQuarterlyGrowth(world) {
	if (monthNumber(world.date) % 3 !== 0) return;
	const quarterEnd = previousMonth(monthOf(world.date), 3);
	const snap = findSnapshot(world, quarterEnd);
	if (!snap) return;
	const q = Math.ceil(Number(quarterEnd.slice(5, 7)) / 3);
	const period = `${quarterEnd.slice(0, 4)}-Q${q}`;
	world.published.growth = {
		value: snap.growth,
		period,
		publishedOn: world.date
	};
	addLog(world, "statistik", `Wachstum ${q}. Quartal ${quarterEnd.slice(0, 4)}: ${fmt(snap.growth)} % zum Vorjahr.`);
}
//#endregion
//#region game/src/sim/befehle.ts
/** Kleinschreibung ohne Umlaute und Akzente; türkische Buchstaben werden zu ihren lateinischen Verwandten. */
function fold(s) {
	return s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
const STOPP = /* @__PURE__ */ new Set([
	"und",
	"der",
	"die",
	"das",
	"den",
	"dem",
	"des",
	"fuer",
	"von",
	"auf",
	"mit",
	"gegen",
	"im",
	"in",
	"an",
	"zu",
	"zur",
	"zum",
	"bei",
	"eine",
	"einen",
	"ein",
	"ich",
	"will",
	"moechte",
	"bitte",
	"wir",
	"sollen",
	"soll",
	"muss",
	"mehr",
	"weniger"
]);
const PROV_FOLD = PROVINZEN.map((p) => ({
	plaka: p.plaka,
	name: fold(p.name),
	region: p.region
})).sort((a, b) => b.name.length - a.name.length);
const REGION_NAMEN = {
	marmara: ["Marmara"],
	aegaeis: ["Ege"],
	ege: ["Ege"],
	mittelmeer: ["Akdeniz"],
	akdeniz: ["Akdeniz"],
	zentralanatolien: ["İç Anadolu"],
	schwarzmeer: ["Karadeniz"],
	karadeniz: ["Karadeniz"],
	ostanatolien: ["Doğu Anadolu"],
	suedostanatolien: ["Güneydoğu Anadolu"],
	osten: ["Doğu Anadolu", "Güneydoğu Anadolu"],
	westen: ["Marmara", "Ege"],
	suedosten: ["Güneydoğu Anadolu"],
	norden: ["Karadeniz"],
	sueden: ["Akdeniz", "Güneydoğu Anadolu"]
};
function ortAusText(t) {
	const gefunden = /* @__PURE__ */ new Set();
	for (const p of PROV_FOLD) if (new RegExp(`(^| )${p.name}( |$)`).test(t)) gefunden.add(p.plaka);
	for (const [wort, regionen] of Object.entries(REGION_NAMEN)) if (new RegExp(`(^| )(im |in |am |der |den )?${wort}( |$)`).test(t) && !(wort === "osten" && gefunden.size)) {
		for (const p of PROVINZEN) if (regionen.includes(p.region)) gefunden.add(p.plaka);
	}
	return gefunden.size ? [...gefunden].sort((a, b) => a - b) : null;
}
NET.nodes.filter((n) => n.kind === "massnahme").map((n) => ({
	node: n,
	name: fold(n.name),
	schluessel: fold(n.name).split(" ").filter((w) => w.length >= 4 && !STOPP.has(w))
}));
//#endregion
//#region game/src/ki/aktionen.ts
const MAX_AKTIONEN = 3;
const LAND_HANDLUNGEN = new Set(Object.keys(AKTIONEN));
const FRAKTIONS_HANDLUNGEN = /* @__PURE__ */ new Set([
	"gespraech",
	"zugestaendnis",
	"duldung",
	"koalition",
	"abwerben"
]);
const FIGUR_AEMTER = /* @__PURE__ */ new Set([
	"finanzen",
	"inneres",
	"aussen",
	"stab"
]);
const HAUSHALT_HANDLUNGEN = /* @__PURE__ */ new Set([
	"posten",
	"mehr_ausgeben",
	"sparen",
	"zentralbank_kritisieren",
	"zentralbank_fuehrung_tauschen"
]);
const istText = (x) => typeof x === "string" && x.trim().length > 0;
const kurz = (x) => istText(x) ? x.trim().slice(0, 240) : void 0;
/** Liest die Antwort des Modells: strenges JSON, sonst der erste JSON-Block im Text, sonst der Text selbst ohne Aktionen. */
function leseAntwort(roh) {
	const text = roh.trim();
	const kandidaten = [text];
	const zaun = text.match(/```(?:json)?\s*([\s\S]*?)```/);
	if (zaun) kandidaten.push(zaun[1]);
	const a = text.indexOf("{");
	const b = text.lastIndexOf("}");
	if (a >= 0 && b > a) kandidaten.push(text.slice(a, b + 1));
	for (const k of kandidaten) try {
		const j = JSON.parse(k);
		if (j && typeof j === "object" && (istText(j.antwort) || Array.isArray(j.aktionen))) {
			const aktionen = (Array.isArray(j.aktionen) ? j.aktionen : []).map(pruefeForm).filter((x) => x !== null).slice(0, MAX_AKTIONEN);
			return {
				antwort: istText(j.antwort) ? j.antwort.trim() : "",
				aktionen,
				gelesen: true
			};
		}
	} catch {}
	return {
		antwort: text,
		aktionen: [],
		gelesen: false
	};
}
/** Nur die Form: Felder und Typen. Ob die Aktion im Spiel möglich ist, entscheidet `vorschau`. */
function pruefeForm(x) {
	if (!x || typeof x !== "object") return null;
	const o = x;
	const grund = kurz(o.grund);
	const g = grund ? { grund } : {};
	switch (o.art) {
		case "massnahme": {
			if (!istText(o.id)) return null;
			const orte = Array.isArray(o.orte) ? o.orte.filter(istText) : null;
			const stufe = typeof o.stufe === "number" && Number.isFinite(o.stufe) ? Math.min(100, Math.max(0, Math.round(o.stufe))) : void 0;
			const richtung = o.richtung === 1 || o.richtung === -1 ? o.richtung : void 0;
			if (stufe === void 0 && richtung === void 0) return null;
			return {
				art: "massnahme",
				id: o.id.trim(),
				...stufe !== void 0 ? { stufe } : {},
				...richtung !== void 0 ? { richtung } : {},
				orte: orte && orte.length ? orte : null,
				weg: o.weg === "erlass" ? "erlass" : "gesetz",
				...g
			};
		}
		case "land": return istText(o.land) && istText(o.handlung) ? {
			art: "land",
			land: o.land.trim(),
			handlung: o.handlung.trim(),
			...g
		} : null;
		case "fraktion": return istText(o.partei) && istText(o.handlung) ? {
			art: "fraktion",
			partei: o.partei.trim(),
			handlung: o.handlung.trim(),
			...g
		} : null;
		case "figur": return istText(o.amt) && istText(o.handlung) ? {
			art: "figur",
			amt: o.amt.trim(),
			handlung: o.handlung.trim(),
			...g
		} : null;
		case "programm": return {
			art: "programm",
			...g
		};
		case "haushalt": {
			if (!istText(o.handlung)) return null;
			const stufe = typeof o.stufe === "number" && Number.isFinite(o.stufe) ? Math.min(2, Math.max(-2, Math.round(o.stufe))) : void 0;
			return {
				art: "haushalt",
				handlung: o.handlung.trim(),
				...istText(o.posten) ? { posten: o.posten.trim() } : {},
				...stufe !== void 0 ? { stufe } : {},
				...g
			};
		}
		case "ereignis": return istText(o.id) && istText(o.option) ? {
			art: "ereignis",
			id: o.id.trim(),
			option: o.option.trim(),
			...g
		} : null;
		case "vorhaben": return istText(o.id) ? {
			art: "vorhaben",
			id: o.id.trim(),
			...g
		} : null;
		case "abkommen": {
			if (!istText(o.land)) return null;
			const liste = (x) => Array.isArray(x) ? x.filter(istText).map((t) => t.trim()).slice(0, 8) : [];
			const jahre = typeof o.jahre === "number" ? Math.round(o.jahre) : void 0;
			return {
				art: "abkommen",
				land: o.land.trim(),
				bieten: liste(o.bieten),
				verlangen: liste(o.verlangen),
				...jahre !== void 0 ? { jahre } : {},
				...g
			};
		}
		case "vermittlung": return istText(o.id) ? {
			art: "vermittlung",
			id: o.id.trim(),
			...g
		} : null;
		case "zeit": {
			const tage = typeof o.tage === "number" && Number.isFinite(o.tage) ? Math.min(90, Math.max(1, Math.round(o.tage))) : 0;
			return tage ? {
				art: "zeit",
				tage,
				...g
			} : null;
		}
		default: return null;
	}
}
const nfs = (x) => x.toLocaleString("de-DE", {
	minimumFractionDigits: 1,
	maximumFractionDigits: 1
});
/** Welcher Haushaltsposten auf welche Stufe gestellt werden soll; die einfachen Handlungen wählen einen Posten selbst. */
function haushaltsposten(w, a) {
	if (a.handlung === "mehr_ausgeben" || a.handlung === "sparen") return einfacherSchritt(w, a.handlung === "sparen" ? "sparen" : "mehr") ?? { fehler: "Alle Ausgabenposten stehen schon am Rand." };
	if (!a.posten || !POSTEN_NACH_ID[a.posten]) return { fehler: `„${a.posten ?? ""}“ ist kein Haushaltsposten dieses Spiels.` };
	if (a.stufe === void 0) return { fehler: "Es fehlt die Stufe (−2 bis +2)." };
	return {
		id: a.posten,
		stufe: a.stufe
	};
}
function massnahmeZiel(w, a) {
	const i = NET.index.get(a.id);
	const node = i === void 0 ? void 0 : NET.nodes[i];
	if (!node || node.kind !== "massnahme") return { fehler: `„${a.id}“ ist keine Maßnahme dieses Spiels.` };
	const ort = a.orte && a.orte.length ? ortAusText(fold(a.orte.join(" "))) : null;
	if (a.orte && a.orte.length && !ort) return { fehler: `Die Orte „${a.orte.join(", ")}“ kenne ich nicht.` };
	const jetzt = stufeIn(w, node.id, ort);
	const ziel = a.stufe !== void 0 ? a.stufe : Math.min(100, Math.max(0, Math.round(jetzt + (a.richtung ?? 1) * 25)));
	return {
		id: node.id,
		name: node.name,
		ort,
		ziel
	};
}
/** Was die Aktion wäre, ohne sie auszuführen. */
function vorschau(w, a) {
	const spiel = w.spiel;
	if (!spiel) return {
		aktion: a,
		titel: "Keine Spielschleife",
		problem: "Ohne Amtsantritt gibt es nichts auszuführen."
	};
	if (spiel.ende) return {
		aktion: a,
		titel: "Amtszeit beendet",
		problem: "Die Amtszeit ist beendet."
	};
	switch (a.art) {
		case "massnahme": {
			const m = massnahmeZiel(w, a);
			if ("fehler" in m) return {
				aktion: a,
				titel: a.id,
				problem: m.fehler
			};
			const pr = pruefeVorhaben(w, m.id, m.ziel, m.ort);
			const weg = a.weg === "erlass" ? "Erlass" : "Gesetz";
			const titel = `${m.name} ${provinzenText(m.ort)} auf Stufe ${m.ziel} (${weg})`;
			if (!pr.ok) return {
				aktion: a,
				titel,
				problem: pr.grund ?? "Keine Änderung."
			};
			if (a.weg === "erlass") {
				if (!pr.erlass.moeglich) return {
					aktion: a,
					titel,
					problem: pr.erlass.grund ?? "Als Erlass nicht möglich."
				};
				return {
					aktion: a,
					titel,
					kosten: pr.erlass.pk,
					...pr.erlass.bezahlbar ? {} : { problem: "Dafür fehlt Kapital." }
				};
			}
			const mehrheit = pr.gesetz.stimmen.erwartet >= 301 ? `Mehrheit steht (erwartet ${pr.gesetz.stimmen.erwartet} Stimmen).` : `Es fehlen etwa ${pr.gesetz.stimmen.luecke} Stimmen zur Mehrheit.`;
			return {
				aktion: a,
				titel,
				kosten: pr.gesetz.pk,
				hinweis: `${mehrheit} Abstimmung in ${pr.gesetz.tage} Tagen.`,
				...pr.gesetz.bezahlbar ? {} : { problem: "Dafür fehlt Kapital." }
			};
		}
		case "land": {
			const def = LAENDER.find((l) => l.id === a.land);
			if (!def) return {
				aktion: a,
				titel: a.land,
				problem: `„${a.land}“ ist kein Land dieses Spiels.`
			};
			if (!LAND_HANDLUNGEN.has(a.handlung)) return {
				aktion: a,
				titel: `${def.name}: ${a.handlung}`,
				problem: "Diese Handlung gibt es nicht."
			};
			const s = aktionenFuer(w, def.id).find((x) => x.aktion.id === a.handlung);
			const titel = `${AKTIONEN[a.handlung].label} mit ${def.dat}`;
			if (!s) return {
				aktion: a,
				titel,
				problem: "Diese Handlung gibt es diesem Land gegenüber nicht."
			};
			return {
				aktion: a,
				titel,
				kosten: s.aktion.pk,
				...s.moeglich ? {} : { problem: s.grund ?? "Geht gerade nicht." }
			};
		}
		case "fraktion": {
			const f = fraktionsUebersicht(w).find((x) => x.partei === a.partei);
			if (!f) return {
				aktion: a,
				titel: a.partei,
				problem: `Die Fraktion „${a.partei}“ hat in diesem Parlament keine Sitze.`
			};
			if (!FRAKTIONS_HANDLUNGEN.has(a.handlung)) return {
				aktion: a,
				titel: `${f.name}: ${a.handlung}`,
				problem: "Diese Verhandlungsart gibt es nicht."
			};
			const s = f.aktionen.find((x) => x.id === a.handlung);
			const titel = `${s?.label ?? a.handlung} mit der ${f.name}`;
			if (!s) return {
				aktion: a,
				titel,
				problem: "Das geht bei dieser Fraktion nicht."
			};
			return {
				aktion: a,
				titel,
				kosten: s.pk,
				...s.moeglich ? {} : { problem: s.grund ?? "Geht gerade nicht." }
			};
		}
		case "figur": {
			if (!FIGUR_AEMTER.has(a.amt)) return {
				aktion: a,
				titel: a.amt,
				problem: "Dieses Amt kenne ich nicht."
			};
			const f = spiel.figuren.find((x) => x.amt === a.amt && x.imAmt);
			if (!f) return {
				aktion: a,
				titel: a.amt,
				problem: "Dieses Amt ist gerade nicht besetzt."
			};
			if (a.handlung === "gespraech") return {
				aktion: a,
				titel: `Gespräch mit ${f.rolle} ${f.name}`
			};
			if (a.handlung === "entlassen") return {
				aktion: a,
				titel: `${f.rolle} ${f.name} entlassen`,
				kosten: 4,
				...kannZahlen(spiel.kapital, 4) ? {} : { problem: "Dafür fehlt Kapital." }
			};
			return {
				aktion: a,
				titel: a.handlung,
				problem: "Diese Handlung gibt es bei Personen nicht."
			};
		}
		case "programm": {
			const s = naechsterSchritt(w);
			if (!s) return {
				aktion: a,
				titel: "Programmschritt",
				problem: "Es gibt keinen offenen Programmschritt."
			};
			return {
				aktion: a,
				titel: `Programmschritt: ${s.schritt.titel}`,
				kosten: s.schritt.kapital,
				...s.status === "bereit" ? {} : { problem: s.fehlt.length ? `Es fehlt: ${s.fehlt.join(", ")}.` : "Noch nicht bereit." }
			};
		}
		case "haushalt": {
			if (!HAUSHALT_HANDLUNGEN.has(a.handlung)) return {
				aktion: a,
				titel: a.handlung,
				problem: "Diese Haushaltshandlung gibt es nicht."
			};
			if (a.handlung === "zentralbank_kritisieren") return {
				aktion: a,
				titel: "Zentralbank öffentlich kritisieren",
				hinweis: "Wirkt auf Märkte und Glaubwürdigkeit; die Zentralbank-Ansicht zeigt die Folgen."
			};
			if (a.handlung === "zentralbank_fuehrung_tauschen") return {
				aktion: a,
				titel: "Zentralbankführung austauschen",
				hinweis: "Wirkt auf Märkte und Glaubwürdigkeit; das Zentralbankgesetz kann die Führung schützen."
			};
			const posten = haushaltsposten(w, a);
			if ("fehler" in posten) return {
				aktion: a,
				titel: a.posten ?? a.handlung,
				problem: posten.fehler
			};
			const p = POSTEN_NACH_ID[posten.id];
			const titel = `${p.name}: Stufe ${posten.stufe > 0 ? "+" : ""}${posten.stufe}`;
			const v = postenVorschau(w, posten.id, posten.stufe);
			if (v.delta === 0) return {
				aktion: a,
				titel,
				problem: "Der Posten steht schon auf dieser Stufe."
			};
			return {
				aktion: a,
				titel,
				kosten: v.kapital,
				hinweis: `Defizit ${nfs(v.defizitVorher)} auf ${nfs(v.defizitNachher)} % des BIP. ${p.kehrseite}`,
				...v.ok ? {} : { problem: v.grund ?? "Geht gerade nicht." }
			};
		}
		case "ereignis": {
			const ev = spiel.ereignisse.find((x) => x.id === a.id);
			if (!ev) return {
				aktion: a,
				titel: a.id,
				problem: "Dieses Ereignis ist nicht (mehr) offen."
			};
			const o = antworten(w, ev).find((x) => x.id === a.option);
			if (!o) return {
				aktion: a,
				titel: a.option,
				problem: "Diese Antwort gibt es bei dem Ereignis nicht."
			};
			const pk = o.anzeigePk ?? o.pk;
			return {
				aktion: a,
				titel: o.label,
				kosten: pk,
				...kannZahlen(spiel.kapital, pk) ? {} : { problem: "Dafür fehlt Kapital." }
			};
		}
		case "vorhaben": {
			const sicht = vorhabenSicht(w, a.id);
			if (!sicht) return {
				aktion: a,
				titel: a.id,
				problem: `„${a.id}“ ist kein Vorhaben dieses Spiels.`
			};
			const v = sicht.v;
			const titel = `Beginn: ${v.name}`;
			if (sicht.status === "fertig") return {
				aktion: a,
				titel,
				problem: "Es ist schon fertig."
			};
			if (sicht.status === "im_bau" || sicht.status === "pausiert") return {
				aktion: a,
				titel,
				problem: "Es läuft bereits."
			};
			if (sicht.status === "gesperrt" || sicht.status === "ausgeschlossen") return {
				aktion: a,
				titel,
				problem: sicht.grund ?? "Es ist gesperrt."
			};
			const fehlt = sicht.voraus.filter((x) => !x.erfuellt).map((x) => x.text);
			if (fehlt.length) return {
				aktion: a,
				titel,
				problem: `Voraussetzungen fehlen: ${fehlt.join("; ")}.`
			};
			if (!sicht.bezahlbar) return {
				aktion: a,
				titel,
				kosten: v.kosten.pk,
				problem: "Dafür fehlt Kapital."
			};
			if (!sicht.verwaltungOk) return {
				aktion: a,
				titel,
				kosten: v.kosten.pk,
				problem: "Die Verwaltungskraft reicht dafür nicht."
			};
			return {
				aktion: a,
				titel,
				kosten: v.kosten.pk,
				hinweis: `Etwa ${v.kosten.monate} Monate Bauzeit. ${v.kehrseite}`
			};
		}
		case "abkommen": {
			const def = LAENDER.find((l) => l.id === a.land);
			if (!def) return {
				aktion: a,
				titel: a.land,
				problem: `„${a.land}“ ist kein Land dieses Spiels.`
			};
			const jahre = a.jahre ?? 5;
			const angebot = {
				land: def.id,
				gibt: a.bieten,
				will: a.verlangen,
				jahre
			};
			const titel = `Vertrag mit ${def.dat}: ${a.bieten.length + a.verlangen.length} Klauseln, ${jahre} Jahre`;
			const mangel = pruefeAngebot(w, angebot);
			if (mangel) return {
				aktion: a,
				titel,
				problem: mangel
			};
			const b = bewerte(w, angebot);
			if (!kannZahlen(spiel.kapital, b.pk)) return {
				aktion: a,
				titel,
				kosten: b.pk,
				problem: "Dafür fehlt Kapital."
			};
			if (b.urteil === "veto") return {
				aktion: a,
				titel,
				kosten: b.pk,
				problem: b.veto ?? "Eine Rote Linie der Gegenseite."
			};
			const erwartet = b.urteil === "zustimmung" ? "Die Gegenseite würde zustimmen." : b.urteil === "gegenangebot" ? "Die Gegenseite würde ein Gegenangebot machen." : `Die Gegenseite ist ${STIMMUNG_WORT[b.stimmung].toLowerCase()} und würde ablehnen.`;
			return {
				aktion: a,
				titel,
				kosten: b.pk,
				hinweis: erwartet
			};
		}
		case "vermittlung": {
			const v = vermittlungen(w).find((x) => x.def.id === a.id);
			if (!v) return {
				aktion: a,
				titel: a.id,
				problem: "Diese Vermittlung gibt es nicht."
			};
			return {
				aktion: a,
				titel: `Vermittlung: ${v.def.titel}`,
				kosten: v.def.pk,
				hinweis: `Aussicht etwa ${v.aussicht} Prozent.`,
				...v.moeglich ? {} : { problem: v.grund ?? "Geht gerade nicht." }
			};
		}
		case "zeit": return {
			aktion: a,
			titel: `${a.tage} ${a.tage === 1 ? "Tag" : "Tage"} weiter`,
			hinweis: "Die Zeit hält an, sobald ein Ereignis auf eine Entscheidung wartet."
		};
	}
}
//#endregion
//#region game/src/sim/prolog.ts
const near = (p, g, d) => {
	p.naehe[g] = (p.naehe[g] ?? 0) + d;
};
const STATIONS = [
	{
		id: "kindheit",
		title: "Kindheit",
		story: "Jede Karriere beginnt irgendwo. Deine beginnt in einer Küche, in der abends über Politik gestritten wurde.",
		question: "Wo bist du aufgewachsen?",
		answers: [
			{
				label: "İzmir",
				text: "Eine Großstadt am Meer, weltoffen und laut.",
				apply: (p) => {
					p.heimat = "İzmir";
					p.heimatPlaka = 35;
					near(p, "staedtische_saekulare", 3);
				}
			},
			{
				label: "Konya",
				text: "Eine Stadt in Zentralanatolien, fromm, fleißig, stolz.",
				apply: (p) => {
					p.heimat = "Konya";
					p.heimatPlaka = 42;
					near(p, "konservative", 3);
				}
			},
			{
				label: "Diyarbakır",
				text: "Eine alte Stadt im Südosten, mit vielen Sprachen und vielen Wunden.",
				apply: (p) => {
					p.heimat = "Diyarbakır";
					p.heimatPlaka = 21;
					near(p, "junge", 1);
				}
			},
			{
				label: "Trabzon",
				text: "Eine Hafenstadt am Schwarzen Meer, Fußball, Tee und Dickköpfe.",
				apply: (p) => {
					p.heimat = "Trabzon";
					p.heimatPlaka = 61;
					near(p, "arbeitnehmer", 2);
				}
			}
		]
	},
	{
		id: "jugend",
		title: "Jugend",
		story: "Mit siebzehn hattest du Meinungen zu allem und Erfahrung mit nichts.",
		question: "Was hat dich geprägt?",
		answers: [
			{
				label: "Die Studentenbewegung",
				text: "Flugblätter, Nachtdiskussionen, eine Festnahme, über die du heute schmunzelst.",
				apply: (p) => {
					p.jugend = "Studentenbewegung";
					near(p, "junge", 3);
					near(p, "staedtische_saekulare", 2);
				}
			},
			{
				label: "Der Familienbetrieb",
				text: "Du hast gelernt, was eine Lohnabrechnung ist, bevor du wählen durftest.",
				apply: (p) => {
					p.jugend = "Familienbetrieb";
					near(p, "unternehmer", 3);
				}
			},
			{
				label: "Die Moscheegemeinde",
				text: "Jugendgruppe, Ferienlager, ein Imam, der dir das Zuhören beibrachte.",
				apply: (p) => {
					p.jugend = "Moscheegemeinde";
					near(p, "konservative", 3);
				}
			},
			{
				label: "Der Sportverein",
				text: "Kapitän der Jugendmannschaft. Du weißt, wie man eine Kabine zusammenhält.",
				apply: (p) => {
					p.jugend = "Sportverein";
					near(p, "arbeitnehmer", 2);
					near(p, "junge", 1);
				}
			}
		]
	},
	{
		id: "beruf",
		title: "Beruf",
		story: "Bevor du Reden hieltest, hast du gearbeitet. Die Leute wissen das; deine Gegner auch.",
		question: "Womit hast du dein Geld verdient?",
		answers: [
			{
				label: "Anwältin oder Anwalt",
				text: "Verträge, Gerichte, Mandanten, die dir heute noch Gefallen schulden.",
				apply: (p) => {
					p.beruf = "Anwalt";
					near(p, "staedtische_saekulare", 1);
				}
			},
			{
				label: "Ärztin oder Arzt",
				text: "Nachtdienste in einer Provinzklinik. Du weißt, was im Gesundheitswesen fehlt.",
				apply: (p) => {
					p.beruf = "Arzt";
					near(p, "rentner", 2);
				}
			},
			{
				label: "Unternehmerin oder Unternehmer",
				text: "Eine Firma mit dreihundert Beschäftigten. Und ein Steuerbescheid, den die Presse gern hätte.",
				apply: (p) => {
					p.beruf = "Unternehmer";
					near(p, "unternehmer", 3);
					near(p, "arbeitnehmer", -1);
				}
			},
			{
				label: "Ökonomin oder Ökonom",
				text: "Zehn Jahre bei einer Bank, dann an der Universität. Du verstehst Zinsen; die Wähler weniger.",
				apply: (p) => {
					p.beruf = "Ökonom";
					near(p, "unternehmer", 1);
					near(p, "staedtische_saekulare", 1);
				}
			}
		]
	},
	{
		id: "liebe",
		title: "Liebe",
		story: "Es gibt Menschen, die man trifft, und Menschen, die einem zustoßen.",
		question: "Wie hast du deine Partnerin oder deinen Partner kennengelernt?",
		answers: [
			{
				label: "Im Hörsaal",
				text: "Sie war schlauer als du und hat es dich jeden Tag wissen lassen. Heute ist sie Richterin.",
				apply: (p) => {
					p.partner = "Richterin, eigene Karriere, eigene Meinung";
				}
			},
			{
				label: "Auf einer Hochzeit",
				text: "Die Familien haben nachgeholfen. Er führt heute das Bauunternehmen seines Vaters.",
				apply: (p) => {
					p.partner = "Bauunternehmer, Aufträge vom Staat möglich";
					near(p, "unternehmer", 1);
				}
			},
			{
				label: "Bei einer Demonstration",
				text: "Ihr wurdet zusammen vom Wasserwerfer getroffen. Sie ist heute Journalistin.",
				apply: (p) => {
					p.partner = "Journalistin, kritisch, gut vernetzt";
					near(p, "staedtische_saekulare", 1);
				}
			},
			{
				label: "Im Krankenhaus",
				text: "Er war Krankenpfleger, du warst Patient. Er hält dich bis heute auf dem Boden.",
				apply: (p) => {
					p.partner = "Krankenpfleger, bodenständig, meidet Kameras";
					near(p, "arbeitnehmer", 1);
				}
			}
		]
	},
	{
		id: "politik",
		title: "Der Weg in die Politik",
		story: "Niemand geht in die Politik, weil er einen ruhigen Abend sucht.",
		question: "Was hat dich in die Politik gebracht?",
		answers: [
			{
				label: "Ein Unglück",
				text: "Ein Haus in deiner Heimatstadt stürzte ein. Der Bauunternehmer kam mit einer Geldstrafe davon.",
				apply: (p) => {
					p.motiv = "Unglück und Wut über Pfusch";
					near(p, "rentner", 1);
					near(p, "staedtische_saekulare", 1);
				}
			},
			{
				label: "Wut über Korruption",
				text: "Du hast gesehen, wie Aufträge verteilt werden. Und wer sie bekommt.",
				apply: (p) => {
					p.motiv = "Korruption";
					near(p, "junge", 2);
				}
			},
			{
				label: "Ein Mentor",
				text: "Ein alter Bürgermeister nahm dich mit auf Wahlkampftour. Er ist heute dein schärfster Kritiker.",
				apply: (p) => {
					p.motiv = "Mentor";
					near(p, "konservative", 1);
				}
			},
			{
				label: "Ehrgeiz",
				text: "Du wolltest es einfach. Wenigstens bist du ehrlich zu dir.",
				apply: (p) => {
					p.motiv = "Ehrgeiz";
				}
			}
		]
	},
	{
		id: "partei",
		title: "Die eigene Partei",
		story: "Die alten Parteien waren dir zu eng, zu müde oder zu sehr mit sich selbst beschäftigt. Also hast du eine neue gegründet.",
		question: "Wofür steht deine Partei?",
		answers: [
			{
				label: "Aufbruch der Mitte",
				text: "Wirtschaft, Rechtsstaat, weniger Streit. Für alle, die müde sind vom Kulturkampf.",
				apply: (p) => {
					p.partei = {
						name: "Aufbruchspartei",
						kurz: "AP",
						farbe: "#2f5d62"
					};
					near(p, "unternehmer", 3);
					near(p, "staedtische_saekulare", 3);
					near(p, "junge", 2);
				}
			},
			{
				label: "Soziale Gerechtigkeit",
				text: "Löhne, Renten, Wohnungen. Für alle, denen am Monatsende das Geld fehlt.",
				apply: (p) => {
					p.partei = {
						name: "Partei der Gerechtigkeit",
						kurz: "PG",
						farbe: "#a8325e"
					};
					near(p, "arbeitnehmer", 4);
					near(p, "rentner", 3);
					near(p, "unternehmer", -2);
				}
			},
			{
				label: "Werte und Wohlstand",
				text: "Familie, Glaube, ehrliche Arbeit. Konservativ, aber sauber.",
				apply: (p) => {
					p.partei = {
						name: "Partei der Werte",
						kurz: "PW",
						farbe: "#2e6b3f"
					};
					near(p, "konservative", 4);
					near(p, "landwirte", 2);
					near(p, "staedtische_saekulare", -2);
				}
			},
			{
				label: "Die Regionen",
				text: "Mehr Geld und mehr Rechte für die Provinzen, weniger Ankara.",
				apply: (p) => {
					p.partei = {
						name: "Partei der Regionen",
						kurz: "PR",
						farbe: "#556b2f"
					};
					near(p, "landwirte", 4);
					near(p, "junge", 1);
				}
			}
		]
	},
	{
		id: "wahlkampf",
		title: "Der Wahlkampf 2028",
		story: "Achtzehn Monate Kundgebungen, schlechter Tee, gute Umfragen und eine Frage, die dir jeder Berater stellt.",
		question: "Gehst du ein Wahlbündnis ein, und was versprichst du?",
		answers: [
			{
				label: "Bündnis mit der YENİ Parti",
				text: "Stark gegen die Regierung, aber ihr Vorsitz erwartet Ministerien.",
				apply: (p) => {
					p.buendnis = "YENİ";
					p.versprechen.push("Der YENİ Parti wurden zwei Ministerien zugesagt.");
				}
			},
			{
				label: "Bündnis mit der MHP",
				text: "Die Nationalisten bringen Stimmen in Anatolien und wollen ein hartes Wort in Sicherheitsfragen.",
				apply: (p) => {
					p.buendnis = "MHP";
					p.versprechen.push("Der MHP wurde ein Mitspracherecht beim Friedensprozess zugesagt.");
					near(p, "konservative", 2);
				}
			},
			{
				label: "Allein, mit einem großen Versprechen",
				text: "Kein Bündnis. Dafür das Versprechen: Renten rauf in den ersten hundert Tagen.",
				apply: (p) => {
					p.versprechen.push("Rentenerhöhung in den ersten hundert Tagen versprochen.");
					near(p, "rentner", 3);
				}
			},
			{
				label: "Allein, mit einem harten Versprechen",
				text: "Kein Bündnis. Dafür: Jede große Vergabe wird öffentlich, jeder Minister legt sein Vermögen offen.",
				apply: (p) => {
					p.versprechen.push("Offene Vergaben und Vermögenserklärungen aller Minister versprochen.");
					near(p, "junge", 2);
					near(p, "staedtische_saekulare", 2);
				}
			}
		]
	},
	{
		id: "wahlnacht",
		title: "Die Wahlnacht",
		story: "Es ist kurz nach Mitternacht. Die Hochrechnungen schwanken, dein Telefon glüht, deine Familie schläft auf dem Sofa.",
		question: "Wie hast du gewonnen?",
		answers: [
			{
				label: "Knapp in der Stichwahl",
				text: "50,6 Prozent. Die Hälfte des Landes hat dich nicht gewollt, und sie sagt es laut.",
				apply: (p) => {
					p.wahl = {
						runde: 2,
						anteil: 50.6
					};
				}
			},
			{
				label: "Deutlich in der Stichwahl",
				text: "54 Prozent. Ein klarer Auftrag, aber nach zwei Wahlgängen.",
				apply: (p) => {
					p.wahl = {
						runde: 2,
						anteil: 54
					};
				}
			},
			{
				label: "Im ersten Wahlgang",
				text: "51,2 Prozent schon in der ersten Runde. Niemand hatte damit gerechnet, du auch nicht.",
				apply: (p) => {
					p.wahl = {
						runde: 1,
						anteil: 51.2
					};
				}
			}
		]
	}
];
function emptyProfile() {
	return {
		name: "",
		heimat: "",
		heimatPlaka: 6,
		jugend: "",
		beruf: "",
		partner: "",
		motiv: "",
		partei: {
			name: "",
			kurz: "",
			farbe: "#555"
		},
		naehe: {},
		versprechen: [],
		wahl: {
			runde: 2,
			anteil: 51
		}
	};
}
/** Durchschnitt der Umfragen vom Stichtag (tuerkei/recherche/umfragen.md), Unentschlossene herausgerechnet. */
const POLLS = {
	AKP: 33.7,
	YENİ: 23.1,
	DEM: 9,
	MHP: 7.5,
	İYİ: 6.9,
	CHP: 6.8,
	Zafer: 3.5,
	YRP: 2.8,
	Andere: 6.7
};
/** Aus welchen Parteien die neue Partei Stimmen gewinnt, je nach Profil (Anteil am Zugewinn). */
const SOURCES = {
	AP: {
		YENİ: .35,
		CHP: .2,
		İYİ: .2,
		AKP: .15,
		Andere: .1
	},
	PG: {
		YENİ: .3,
		CHP: .2,
		AKP: .25,
		DEM: .1,
		Andere: .15
	},
	PW: {
		AKP: .5,
		MHP: .2,
		YRP: .15,
		İYİ: .1,
		Andere: .05
	},
	PR: {
		DEM: .25,
		AKP: .25,
		YENİ: .2,
		MHP: .1,
		Andere: .2
	}
};
/** Welche Partei von 2023 als regionales Muster für eine Partei von 2026 dient. */
const PATTERN = {
	AKP: "AKP",
	YENİ: "CHP",
	CHP: "CHP",
	MHP: "MHP",
	İYİ: "İYİ",
	DEM: "YSP",
	Zafer: null,
	YRP: null,
	Andere: null
};
/** Regionale Stärke einer Partei: Anteil 2023 in der Provinz im Verhältnis zum Landeswert (1 = Durchschnitt). */
function regionalRatio(party, p) {
	const pattern = PATTERN[party];
	if (!pattern) return 1;
	const nat = NAT_2023[pattern];
	let local = p.stimmen2023[pattern];
	if (pattern === "CHP" && local === 0) local = (p.stimmen2023.CHP + p.stimmen2023.İYİ) / (NAT_2023.CHP + NAT_2023.İYİ) * nat;
	return nat > 0 ? local / nat : 1;
}
const NAT_2023 = [
	"AKP",
	"CHP",
	"MHP",
	"İYİ",
	"YSP"
].reduce((acc, k) => {
	acc[k] = PROVINZEN.reduce((s, p, i) => s + p.stimmen2023[k] * WEIGHTS[i], 0);
	return acc;
}, {});
/**
* Parlament 2028 je Provinz: Umfragedurchschnitt, regional verteilt nach den
* Ergebnissen von 2023. Die neue Partei zieht 15 bis 30 % an sich, dort, wo
* ihre Quellparteien stark sind, und in der Heimatprovinz. Jeder landesweite
* Anteil schwankt um bis zu ±5 Punkte. Hürde 7 % landesweit (Bündnisse
* gemeinsam), dann D'Hondt je Provinz (Wahlgesetz Art. 33, 34).
*/
function electParliament(profile, rng) {
	const own = profile.partei.kurz || "EIGENE";
	const parties = [...Object.keys(POLLS), own];
	const gain = rng.between(15, 30);
	const sources = SOURCES[own] ?? { Andere: 1 };
	const swing = {};
	for (const party of Object.keys(POLLS)) swing[party] = POLLS[party] > 5 ? rng.between(-5, 5) : rng.between(-1, 1);
	swing[own] = rng.between(-3, 3);
	const local = PROVINZEN.map((p) => {
		const sh = {};
		for (const party of Object.keys(POLLS)) sh[party] = Math.max(.2, (POLLS[party] + swing[party]) * regionalRatio(party, p));
		let ownShare = 0;
		for (const [src, w] of Object.entries(sources)) {
			const take = Math.min(sh[src] * .8, (gain + swing[own]) * w * regionalRatio(src, p));
			sh[src] = sh[src] - take;
			ownShare += take;
		}
		if (p.plaka === profile.heimatPlaka) ownShare += 8;
		sh[own] = ownShare;
		for (const party of parties) sh[party] = Math.max(.1, sh[party] + rng.between(-1, 1));
		const total = parties.reduce((s, k) => s + sh[k], 0);
		for (const party of parties) sh[party] = sh[party] / total * 100;
		return sh;
	});
	const shares = {};
	for (const party of parties) shares[party] = local.reduce((s, sh, i) => s + sh[party] * WEIGHTS[i], 0);
	const allianceShare = profile.buendnis ? shares[own] + (shares[profile.buendnis] ?? 0) : 0;
	const eligible = parties.filter((party) => party !== "Andere" && (shares[party] >= 7 || !!profile.buendnis && (party === own || party === profile.buendnis) && allianceShare >= 7));
	const seats = Object.fromEntries(eligible.map((p) => [p, 0]));
	const byProvince = {};
	PROVINZEN.forEach((p, i) => {
		const sh = local[i];
		const got = Object.fromEntries(eligible.map((x) => [x, 0]));
		for (let s = 0; s < p.sitze; s++) {
			let best = eligible[0];
			let bestQ = -1;
			for (const party of eligible) {
				const q = sh[party] / (got[party] + 1);
				if (q > bestQ) {
					bestQ = q;
					best = party;
				}
			}
			got[best] += 1;
			seats[best] += 1;
		}
		byProvince[p.plaka] = got;
	});
	return {
		shares,
		seats,
		byProvince
	};
}
/** Wirkung des Prologs auf den Weltzustand. */
function applyProfile(world, profile) {
	for (const [group, d] of Object.entries(profile.naehe)) {
		const i = NET.index.get(group);
		if (i === void 0) continue;
		for (let p = 0; p < 81; p++) {
			const k = i * 81 + p;
			world.net.values[k] = Math.min(100, Math.max(0, world.net.values[k] + d));
		}
	}
	for (const group of [
		"arbeitnehmer",
		"rentner",
		"konservative",
		"staedtische_saekulare",
		"junge",
		"landwirte",
		"unternehmer",
		"beamte"
	]) {
		const i = NET.index.get(group);
		if (i === void 0) continue;
		const k = i * 81 + profile.heimatPlaka - 1;
		world.net.values[k] = Math.min(100, world.net.values[k] + 5);
	}
	world.net.history = world.net.history.map(() => world.net.values.slice());
}
/** Amtsantritt nach der Wahl 2028: Profil übernehmen, Parlament wählen, erste Einträge. */
function startAfterElection(world, profile) {
	const rng = new Rng(world.rngState);
	world.player = structuredClone(profile);
	world.parliament = electParliament(profile, rng);
	applyProfile(world, profile);
	const own = profile.partei.kurz;
	const ownSeats = world.parliament.seats[own] ?? 0;
	const allySeats = profile.buendnis ? world.parliament.seats[profile.buendnis] ?? 0 : 0;
	let weitere = waehlePartner(world.parliament.seats, own, profile.buendnis);
	const duldender = weitere.find((p) => (world.parliament.seats[p] ?? 0) >= 200 && ownSeats + allySeats + weitere.reduce((n, q) => n + (world.parliament.seats[q] ?? 0), 0) > 520);
	if (duldender) weitere = weitere.filter((p) => p !== duldender);
	const weitereSeats = weitere.reduce((s, p) => s + (world.parliament.seats[p] ?? 0), 0);
	const bloc = ownSeats + allySeats + weitereSeats;
	const partnerNamen = [profile.buendnis, ...weitere].filter(Boolean).map((k) => PARTEI_NAME[k] ?? k);
	world.log.push({
		day: world.day,
		date: world.date,
		kind: "ereignis",
		text: `${profile.name} gewinnt die Präsidentschaftswahl ${profile.wahl.runde === 1 ? "im ersten Wahlgang" : "in der Stichwahl"} mit ${profile.wahl.anteil.toLocaleString("de-DE")} %. Die ${profile.partei.name} erhält ${ownSeats} von 600 Sitzen` + (partnerNamen.length ? `; zusammen mit ${partnerNamen.length === 1 ? "dem Bündnispartner" : "den Bündnispartnern"} ${partnerNamen.join(" und ")} hat das Regierungslager ${bloc} Sitze.` : ".") + (duldender ? ` Die ${PARTEI_NAME[duldender] ?? duldender} (${world.parliament.seats[duldender] ?? 0} Sitze) bleibt formal Opposition und duldet die Regierung zunächst für acht Monate.` : ""),
		why: bloc >= 301 ? `Eine Regierungsmehrheit: Gesetze und Haushalt sind möglich, solange die Partner im Lager bleiben. Sie erwarten ihre Forderungen erfüllt; wer Zusagen bricht, verliert sie. Verfassungsänderungen brauchen trotzdem 360 Stimmen.` : `Keine eigene Mehrheit: Für Gesetze fehlen ${301 - bloc} Stimmen. Es braucht Partner, Absprachen oder Überläufer.`
	});
	for (const v of profile.versprechen) world.log.push({
		day: world.day,
		date: world.date,
		kind: "ereignis",
		text: `Offene Zusage aus dem Wahlkampf: ${v}`
	});
	initSpiel(world, profile, rng);
	weitere.forEach((partei, i) => {
		const spiel = world.spiel;
		const forderung = forderungVon(world, partei);
		const name = PARTEI_NAME[partei] ?? partei;
		spiel.lager.push(partei);
		if (forderung) spiel.zusagen.push({
			id: `z-start-${partei}`,
			von: partei,
			text: `Die ${name} erwartet ${forderung.text}`,
			faellig: 120 + 60 * i,
			massnahme: forderung.massnahme,
			richtung: 1,
			erfuellt: false,
			gebrochen: false
		});
		const figur = partnerFigur(world, partei, `Vorsitz der ${name}`, forderung?.text ?? "Einfluss und Ämter", rng);
		if ((world.parliament?.seats[partei] ?? 0) >= 200) figur.loyalitaet = 38;
		spiel.figuren.push(figur);
	});
	if (duldender && world.spiel) {
		const f = fraktion(world, duldender);
		f.duldungBis = world.day + 240;
		f.bereitschaft = Math.max(f.bereitschaft, 55);
		const forderung = forderungVon(world, duldender);
		world.spiel.zusagen.push({
			id: `z-duldung-${duldender}`,
			von: duldender,
			text: `Die ${PARTEI_NAME[duldender] ?? duldender} erwartet für ihre Duldung ${forderung.text}`,
			faellig: 200,
			massnahme: forderung.massnahme,
			richtung: 1,
			erfuellt: false,
			gebrochen: false
		});
	}
	world.rngState = rng.state;
}
/** Ein vollständiges Profil ohne Prolog: für den Schnellstart und Tests. `waehle(n)` gibt den Index der Antwort bei n Möglichkeiten. */
function schnellProfil(name = "Deniz Aydın", waehle = () => 0) {
	const p = emptyProfile();
	p.name = name;
	for (const st of STATIONS) st.answers[Math.min(st.answers.length - 1, waehle(st.answers.length))].apply(p);
	return p;
}
//#endregion
//#region game/scripts/runner.ts
const SEED = 42042;
function neueWelt() {
	const w = createWorld(turkey2026, SEED);
	startAfterElection(w, schnellProfil());
	return w;
}
function katalog() {
	return {
		massnahmen: NET.nodes.filter((n) => n.kind === "massnahme").map((n) => ({
			id: n.id,
			name: n.name
		})),
		laender: LAENDER.map((l) => ({
			id: l.id,
			name: l.name
		})),
		posten: POSTEN.map((p) => ({
			id: p.id,
			name: p.name,
			seite: p.seite
		})),
		vorhaben: VORHABEN.map((v) => ({
			id: v.id,
			name: v.name
		})),
		klauseln: KLAUSELN.map((k) => ({
			id: k.id,
			name: k.name,
			seite: k.seite
		})),
		klauselnJeLand: LAENDER.map((l) => {
			const werte = PROFILE[l.id]?.werte ?? {};
			return {
				land: l.id,
				bieten: Object.keys(werte).filter((id) => KLAUSELN.find((k) => k.id === id)?.seite === "gibt"),
				verlangen: Object.keys(werte).filter((id) => KLAUSELN.find((k) => k.id === id)?.seite === "will")
			};
		}),
		landHandlungen: Object.keys(AKTIONEN),
		fraktionsHandlungen: [
			"gespraech",
			"zugestaendnis",
			"duldung",
			"koalition",
			"abwerben"
		],
		haushaltHandlungen: [
			"posten",
			"mehr_ausgeben",
			"sparen",
			"zentralbank_kritisieren",
			"zentralbank_fuehrung_tauschen"
		],
		figurAemter: [
			"finanzen",
			"inneres",
			"aussen",
			"stab"
		],
		systemText: systemText()
	};
}
const MAX_TOKENS = 900;
function passt(a, e) {
	const o = a;
	if (a.art !== e.art) return false;
	if (e.id !== void 0 && o.id !== e.id) return false;
	if (e.handlung !== void 0 && o.handlung !== e.handlung) return false;
	if (e.land !== void 0 && o.land !== e.land) return false;
	if (e.partei !== void 0 && String(o.partei ?? "").toUpperCase() !== e.partei.toUpperCase()) return false;
	if (e.amt !== void 0 && o.amt !== e.amt) return false;
	return true;
}
/** Zählt Aktionen mit erfundenen IDs/Handlungen (Halluzination) — vor der Spielprüfung. */
function halluzination(a) {
	switch (a.art) {
		case "massnahme": {
			const i = NET.index.get(a.id);
			const n = i === void 0 ? void 0 : NET.nodes[i];
			if (!n || n.kind !== "massnahme") return `erfundene Maßnahmen-ID „${a.id}“`;
			return null;
		}
		case "land":
			if (!LAENDER.find((l) => l.id === a.land)) return `erfundenes Land „${a.land}“`;
			if (!(a.handlung in AKTIONEN)) return `erfundene Länder-Handlung „${a.handlung}“`;
			return null;
		case "fraktion":
			if (![
				"gespraech",
				"zugestaendnis",
				"duldung",
				"koalition",
				"abwerben"
			].includes(a.handlung)) return `erfundene Fraktions-Handlung „${a.handlung}“`;
			return null;
		case "figur":
			if (![
				"finanzen",
				"inneres",
				"aussen",
				"stab"
			].includes(a.amt)) return `erfundenes Amt „${a.amt}“`;
			if (!["gespraech", "entlassen"].includes(a.handlung)) return `erfundene Figur-Handlung „${a.handlung}“`;
			return null;
		case "haushalt":
			if (![
				"posten",
				"mehr_ausgeben",
				"sparen",
				"zentralbank_kritisieren",
				"zentralbank_fuehrung_tauschen"
			].includes(a.handlung)) return `erfundene Haushaltshandlung „${a.handlung}“`;
			if (a.handlung === "posten" && a.posten && !POSTEN.find((p) => p.id === a.posten)) return `erfundener Haushaltsposten „${a.posten}“`;
			return null;
		case "vorhaben":
			if (!VORHABEN.find((v) => v.id === a.id)) return `erfundenes Vorhaben „${a.id}“`;
			return null;
		case "abkommen":
			if (!LAENDER.find((l) => l.id === a.land)) return `erfundenes Land „${a.land}“`;
			for (const id of [...a.bieten, ...a.verlangen]) if (!KLAUSELN.find((k) => k.id === id)) return `erfundene Klausel „${id}“`;
			return null;
		case "vermittlung":
			if (!["ukr_rus", "arm_aze"].includes(a.id)) return `erfundene Vermittlung „${a.id}“`;
			return null;
		default: return null;
	}
}
async function rufeAnbieter(an, system, benutzer, zeitlimitMs) {
	const t0 = Date.now();
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), zeitlimitMs);
	try {
		let url;
		let kopf;
		let body;
		if (an.protokoll === "anthropic") {
			url = `${an.basis}/messages`;
			kopf = {
				"content-type": "application/json",
				"x-api-key": an.schluessel,
				"anthropic-version": "2023-06-01"
			};
			body = {
				model: an.modell,
				max_tokens: MAX_TOKENS,
				system: [{
					type: "text",
					text: system,
					cache_control: { type: "ephemeral" }
				}],
				messages: [{
					role: "user",
					content: benutzer
				}]
			};
		} else {
			url = `${an.basis}/chat/completions`;
			kopf = { "content-type": "application/json" };
			if (an.schluessel) kopf["authorization"] = `Bearer ${an.schluessel}`;
			body = {
				model: an.modell,
				[an.tokenFeld]: MAX_TOKENS,
				...an.temperatur !== null ? { temperature: an.temperatur } : {},
				...an.extra ?? {},
				messages: [{
					role: "system",
					content: system
				}, {
					role: "user",
					content: benutzer
				}]
			};
		}
		const r = await fetch(url, {
			method: "POST",
			headers: kopf,
			body: JSON.stringify(body),
			signal: ctrl.signal
		});
		const roh = await r.text();
		if (!r.ok) throw new Error(`HTTP ${r.status}: ${roh.slice(0, 300)}`);
		const j = JSON.parse(roh);
		if (an.protokoll === "anthropic") return {
			text: (j.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join(""),
			ein: j.usage?.input_tokens ?? 0,
			aus: j.usage?.output_tokens ?? 0,
			ms: Date.now() - t0,
			modell: j.model ?? an.modell
		};
		const c = j.choices?.[0]?.message?.content;
		return {
			text: typeof c === "string" ? c : Array.isArray(c) ? c.map((x) => x?.text ?? "").join("") : "",
			ein: j.usage?.prompt_tokens ?? 0,
			aus: j.usage?.completion_tokens ?? 0,
			ms: Date.now() - t0,
			modell: j.model ?? an.modell
		};
	} finally {
		clearTimeout(timer);
	}
}
async function benchmark(konf) {
	const zeitlimit = konf.zeitlimitMs ?? 6e4;
	const { writeFileSync, readFileSync, existsSync } = await import("node:fs");
	let ergebnisse = [];
	if (existsSync(konf.ausJson)) try {
		ergebnisse = JSON.parse(readFileSync(konf.ausJson, "utf-8")).ergebnisse ?? [];
	} catch {
		ergebnisse = [];
	}
	const fertig = new Set(ergebnisse.map((e) => `${e.anbieter}|${e.aufgabe}`));
	const system = systemText();
	for (const an of konf.anbieter) for (const aufgabe of konf.aufgaben) {
		if (fertig.has(`${an.id}|${aufgabe.id}`)) {
			console.error(`[${an.id}] ${aufgabe.id}: übersprungen (schon gemessen)`);
			continue;
		}
		const w = neueWelt();
		let eingabe = aufgabe.eingabe;
		if (aufgabe.art === "rat") {
			let offen = w.spiel?.ereignisse.filter((ev) => !ev.vorlage.startsWith("start_"))[0];
			let tage = 0;
			while (!offen && tage < 240 && !w.spiel?.ende) {
				advance(w, 7);
				tage += 7;
				offen = w.spiel?.ereignisse.filter((ev) => !ev.vorlage.startsWith("start_"))[0];
			}
			if (!offen) {
				ergebnisse.push({
					anbieter: an.id,
					modell: an.modell,
					aufgabe: aufgabe.id,
					art: aufgabe.art,
					ok: false,
					jsonValide: false,
					aktionen: 0,
					aktionenAusfuehrbar: 0,
					halluzinationen: [],
					treffer: null,
					fehler: "kein offenes Ereignis im Ausgangszustand",
					ms: 0,
					tokensEin: 0,
					tokensAus: 0,
					kosten: 0,
					antwortKurz: ""
				});
				continue;
			}
			eingabe = eingabe.replace("{ereignisId}", offen.id);
		}
		const benutzer = `${zustandsText(w)}\n\nAUFTRAG DES SPIELERS:\n${eingabe}`;
		try {
			const roh = await rufeAnbieter(an, system, benutzer, zeitlimit);
			const g = leseAntwort(roh.text);
			const hall = g.aktionen.map(halluzination).filter((x) => x !== null);
			const vorschauen = g.aktionen.map((a) => vorschau(w, a));
			const ausfuehrbar = vorschauen.filter((v) => !v.problem).length;
			let treffer = null;
			if (aufgabe.erwarte) treffer = g.aktionen.some((a, i) => passt(a, aufgabe.erwarte) && !vorschauen[i].problem);
			else if (aufgabe.erwarteKeineAktion) treffer = g.aktionen.length === 0;
			const kosten = (roh.ein * (an.preisEinProMio ?? 0) + roh.aus * (an.preisAusProMio ?? 0)) / 1e6;
			ergebnisse.push({
				anbieter: an.id,
				modell: roh.modell,
				aufgabe: aufgabe.id,
				art: aufgabe.art,
				ok: true,
				jsonValide: g.gelesen,
				aktionen: g.aktionen.length,
				aktionenAusfuehrbar: ausfuehrbar,
				halluzinationen: hall,
				treffer,
				ms: roh.ms,
				tokensEin: roh.ein,
				tokensAus: roh.aus,
				kosten,
				antwortKurz: (g.antwort || roh.text).slice(0, 220).replace(/\s+/g, " ")
			});
			console.error(`[${an.id}] ${aufgabe.id}: json=${g.gelesen} treffer=${treffer} hall=${hall.length} ${roh.ms}ms`);
		} catch (e) {
			ergebnisse.push({
				anbieter: an.id,
				modell: an.modell,
				aufgabe: aufgabe.id,
				art: aufgabe.art,
				ok: false,
				jsonValide: false,
				aktionen: 0,
				aktionenAusfuehrbar: 0,
				halluzinationen: [],
				treffer: null,
				fehler: e.message.slice(0, 300),
				ms: 0,
				tokensEin: 0,
				tokensAus: 0,
				kosten: 0,
				antwortKurz: ""
			});
			console.error(`[${an.id}] ${aufgabe.id}: FEHLER ${e.message.slice(0, 120)}`);
		}
	}
	writeFileSync(konf.ausJson, JSON.stringify({
		datum: (/* @__PURE__ */ new Date()).toISOString(),
		system,
		ergebnisse
	}, null, 2));
	console.log(JSON.stringify({
		geschrieben: konf.ausJson,
		anzahl: ergebnisse.length
	}));
}
const [, , cmd, arg] = process.argv;
if (cmd === "katalog") console.log(JSON.stringify(katalog(), null, 2));
else if (cmd === "zustand") {
	const w = neueWelt();
	console.log(zustandsText(w));
	const v = vermittlungen(w);
	console.error(`Vermittlungen: ${v.map((x) => x.def.id).join(", ")}`);
} else if (cmd === "benchmark") {
	if (!arg) throw new Error("benchmark braucht den Pfad einer Konfigurations-JSON");
	const { readFileSync } = await import("node:fs");
	await benchmark(JSON.parse(readFileSync(arg, "utf-8")));
} else {
	console.error("Aufruf: runner.mjs katalog | zustand | benchmark <konfig.json>");
	process.exit(1);
}
//#endregion
export {};

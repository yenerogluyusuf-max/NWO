// Ereignisse um Personen: Rücktrittsdrohung, Skandal, Intrige und Durchstecherei. Sie entstehen aus dem Zustand des Umfelds (Loyalität, Groll,
// Ehrgeiz), nicht aus dem Würfel allein: Wer seine Leute pflegt, sieht sie selten. Alle Wahrscheinlichkeiten und Wirkungen sind Platzhalter
// der Kalibrierung; Zahlen im Text kommen aus dem Weltzustand.

import { vertrauenAendern, wirke } from "./wirkung";
import { beschr, opt } from "./ereignis-hilfen";
import type { Vorlage } from "./ereignis-hilfen";
import { AEMTER, eigenVon, figurNachId, grollVerschieben, grollWort, hashZahl, loyalitaetVerschieben, merke, sorgeText } from "./personen";
import { ausscheiden } from "./nachfolge";
import type { Figur } from "./spiel-typen";
import type { World } from "./types";
import type { Rng } from "./rng";

/** Mitglieder der Regierung, die im Amt sind und nicht nur kommissarisch führen. */
function regierung(w: World): Figur[] {
  return (w.spiel?.figuren ?? []).filter((f) => f.imAmt && AEMTER[f.amt].regierungsamt && !f.eigen?.kommissarisch);
}

const figurVon = (w: World, ev: { daten?: Record<string, number | string> }): Figur | undefined => figurNachId(w, String(ev.daten?.figur ?? ""));
const er = (f: Figur | undefined) => (f?.weiblich ? "sie" : "er");
const Er = (f: Figur | undefined) => (f?.weiblich ? "Sie" : "Er");
const wer = (f: Figur | undefined) => (f ? `${f.rolle} ${f.name}` : "Ein Mitglied der Regierung");

// ---------------------------------------------------------------------------
// Rücktrittsdrohung

const RUECKTRITT: Vorlage = {
  id: "person_ruecktritt",
  szene: "istanbul",
  frist: 20,
  abkuehlung: 120,
  chance: (w) => (regierung(w).some((f) => f.loyalitaet < 25 && eigenVon(w, f).groll >= 30 && (eigenVon(w, f).drohung === undefined || w.day - eigenVon(w, f).drohung! > 150)) ? 0.25 : 0),
  erzeuge: (w) => {
    const f = regierung(w).sort((a, b) => a.loyalitaet - b.loyalitaet)[0];
    return f ? { provinzen: [], staerke: 1, daten: { figur: f.id } } : null;
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
    return [
      `${wer(f)} hat Ihnen ausrichten lassen, dass ${er(f)} unter diesen Bedingungen nicht weiterarbeiten will. Die Loyalität liegt bei ${Math.round(f.loyalitaet)} von 100, ${er(f)} ist ${grollWort(e.groll)}.`,
      sorgeText(w, f),
    ];
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
      }),
    ];
  },
  standard: (w, ev) => {
    const f = figurVon(w, ev);
    if (f) ausscheiden(w, f, "Rücktritt, nachdem der Präsident nicht geantwortet hat");
    return `${wer(f)} zieht die Konsequenz und tritt zurück; die Regierung wirkt führungslos.`;
  },
};

// ---------------------------------------------------------------------------
// Skandal

const VORWURF: Record<string, string> = {
  finanzen: "bei einer Ausschreibung des Ministeriums einen Bekannten begünstigt zu haben",
  inneres: "Ermittlungen gegen Vertraute des Ressorts behindert zu haben",
  aussen: "vertrauliche Unterlagen aus den Verhandlungen nicht gesichert zu haben",
  stab: "Termine des Präsidenten an Lobbyisten vermittelt zu haben",
  justiz: "auf ein laufendes Verfahren Einfluss genommen zu haben",
  generalstab: "bei einer Beschaffung einen Lieferanten bevorzugt zu haben",
  wirtschaft: "bei der Vergabe von Aufträgen Verwandte bedacht zu haben",
};

const SKANDAL: Vorlage = {
  id: "person_skandal",
  szene: "istanbul",
  frist: 15,
  abkuehlung: 240,
  chance: (w) => (regierung(w).length ? (regierung(w).some((f) => f.loyalitaet < 40 || eigenVon(w, f).groll >= 45) ? 0.012 : 0.003) : 0),
  erzeuge: (w, rng: Rng) => {
    const liste = regierung(w).filter((f) => VORWURF[f.amt]);
    if (!liste.length) return null;
    // Wer schwach im Rückhalt steht, gerät eher ins Visier
    const gewichte = liste.map((f) => 1 + (100 - f.loyalitaet) / 50 + eigenVon(w, f).groll / 60);
    let r = rng.next() * gewichte.reduce((a, b) => a + b, 0);
    let f = liste[liste.length - 1]!;
    for (let i = 0; i < liste.length; i++) {
      r -= gewichte[i]!;
      if (r <= 0) {
        f = liste[i]!;
        break;
      }
    }
    return { provinzen: [], staerke: 1, daten: { figur: f.id } };
  },
  titel: (w, ev) => `Vorwürfe gegen ${wer(figurVon(w, ev))}`,
  text: (w, ev) => {
    const f = figurVon(w, ev);
    if (!f) return ["Gegen ein Mitglied der Regierung werden Vorwürfe laut."];
    return [
      `Mehrere Zeitungen berichten, ${wer(f)} habe ${VORWURF[f.amt] ?? "Pflichten verletzt"}. ${Er(f)} weist alles zurück, die Opposition fordert Konsequenzen.`,
      `Ob etwas dran ist, weiß niemand sicher; ${er(f)} hat Ihnen versichert, es sei nichts. Die Loyalität liegt bei ${Math.round(f.loyalitaet)} von 100.`,
    ];
  },
  warum: () => "Ein Skandal wird an dem gemessen, was der Präsident tut: Wer stützt, haftet mit; wer fallen lässt, zahlt mit einem Feind und dem Verdacht der Willkür; wer prüfen lässt, braucht Zeit und Mut.",
  optionen: (w, ev) => {
    const f = figurVon(w, ev);
    const wahr = (ww: World) => hashZahl(`${ww.seed}|skandal|${ev.id}|${f?.id}`) < 0.45;
    return [
      opt("pruefen", "Untersuchung zulassen", beschr(1, 0, "Klärung in zwei Wochen; ist etwas dran, geht sie; wenn nicht, ist sie rehabilitiert."), 1, (ww) => {
        const g = figurVon(ww, ev);
        if (!g) return "Die Untersuchung läuft ins Leere.";
        vertrauenAendern(ww, 0.3);
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
          wirke(ww, "legitimitaet", -0.6);
          return `Wenig später kommt heraus, dass an den Vorwürfen etwas dran war; Sie haben sich blamiert (Vertrauen −1,4).`;
        }
        vertrauenAendern(ww, 0.2);
        return "Die Vorwürfe verlaufen im Sand; Ihre Rückendeckung hat sich bewährt.";
      }),
      opt("fallenlassen", "Fallen lassen", beschr(0, 0, `${Er(f)} geht sofort; der Verdacht der Willkür bleibt, wenn nichts dran war.`), 0, (ww) => {
        const g = figurVon(ww, ev);
        if (g) ausscheiden(ww, g, "Von Präsidenten fallen gelassen");
        vertrauenAendern(ww, wahr(ww) ? -0.2 : -0.8);
        return `${wer(g)} muss gehen, ohne dass etwas geklärt wurde.`;
      }),
    ];
  },
  standard: (w, ev) => {
    vertrauenAendern(w, -1.5);
    const f = figurVon(w, ev);
    if (f) grollVerschieben(w, f, 15);
    return "Der Präsident schweigt; die Presse deutet das als Schwäche, und die betroffene Person fühlt sich im Stich gelassen.";
  },
};

// ---------------------------------------------------------------------------
// Intrige

const INTRIGE: Vorlage = {
  id: "person_intrige",
  szene: "parlament",
  frist: 20,
  abkuehlung: 180,
  chance: (w) => (regierung(w).some((f) => eigenVon(w, f).ehrgeiz >= 75 && f.loyalitaet < 55) ? 0.03 : 0),
  erzeuge: (w) => {
    const f = regierung(w).sort((a, b) => eigenVon(w, b).ehrgeiz - eigenVon(w, a).ehrgeiz)[0];
    return f ? { provinzen: [], staerke: 1, daten: { figur: f.id } } : null;
  },
  titel: (w, ev) => `${wer(figurVon(w, ev))} sammelt Rückhalt gegen Sie`,
  text: (w, ev) => {
    const f = figurVon(w, ev);
    if (!f) return ["Ein Ehrgeiziger sammelt Rückhalt."];
    const e = eigenVon(w, f);
    return [
      `Aus der Fraktion hört man, dass ${wer(f)} ${er(f)} in Hintergrundgesprächen als die bessere Wahl für die Führung ins Spiel bringt. Der Ehrgeiz liegt bei ${Math.round(e.ehrgeiz)} von 100, die Loyalität bei ${Math.round(f.loyalitaet)}.`,
      `Noch ist es nur Gerede; wer jetzt nichts tut, riskiert, dass daraus eine Hausmacht wird.`,
    ];
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
      }),
    ];
  },
  standard: (w, ev) => {
    const f = figurVon(w, ev);
    if (f) {
      loyalitaetVerschieben(f, -5);
      grollVerschieben(w, f, 12);
    }
    vertrauenAendern(w, -0.4);
    return "Ohne Reaktion des Präsidenten wächst die Hausmacht; die Zeitungen sprechen von einem Machtkampf.";
  },
};

// ---------------------------------------------------------------------------
// Durchstecherei

const LECK: Vorlage = {
  id: "person_leck",
  szene: "istanbul",
  frist: 12,
  abkuehlung: 150,
  chance: (w) => (regierung(w).some((f) => eigenVon(w, f).groll >= 60) ? 0.06 : 0),
  erzeuge: (w) => {
    const f = regierung(w).sort((a, b) => eigenVon(w, b).groll - eigenVon(w, a).groll)[0];
    return f ? { provinzen: [], staerke: 1, daten: { figur: f.id } } : null;
  },
  titel: () => "Aus dem Kabinett dringt etwas durch",
  text: (w, ev) => {
    const f = figurVon(w, ev);
    return [
      "Ein vertrauliches Gespräch aus der Regierung steht in der Zeitung: Zitate, Zahlen, ein Streit um den Kurs. Wer geredet hat, weiß niemand.",
      f ? `Verdächtig ist, wer verärgert ist: Bei ${wer(f)} liegt der Groll bei ${Math.round(eigenVon(w, f).groll)} von 100.` : "Verdächtig ist, wer verärgert ist.",
    ];
  },
  warum: () => "Wer verärgert wird und nichts zu verlieren hat, redet. Eine Suche nach der Quelle kostet Vertrauen im Kabinett, Schweigen kostet Vertrauen im Land.",
  optionen: (w, ev) => {
    const f = figurVon(w, ev);
    return [
      opt("dementieren", "Dementieren und Geschlossenheit beschwören", beschr(1, 0, "Die Presse bohrt weiter, aber das Kabinett fühlt sich nicht verdächtigt."), 1, (ww) => {
        vertrauenAendern(ww, -0.5);
        return "Die Regierung dementiert; die Zeitung bleibt bei ihrer Darstellung.";
      }),
      opt("quelle", "Die Quelle suchen", beschr(2, 0, `Sie stellen ${wer(f)} zur Rede: Loyalität −8, Groll +8, aber das Leck versiegt.`), 2, (ww) => {
        const g = figurVon(ww, ev);
        if (g) {
          loyalitaetVerschieben(g, -8);
          grollVerschieben(ww, g, 8);
          merke(ww, g, "Nach einem Leck zur Rede gestellt");
        }
        vertrauenAendern(ww, -0.2);
        return `${wer(g)} bestreitet alles; das Leck bleibt danach aus, das Misstrauen im Kabinett nicht.`;
      }),
      opt("aussitzen", "Aussitzen", beschr(0, 0, "Kostet nichts, aber die Geschichte wächst."), 0, (ww) => {
        vertrauenAendern(ww, -1.2);
        const g = figurVon(ww, ev);
        if (g) grollVerschieben(ww, g, 4);
        return "Die Regierung schweigt; die Zeitung legt nach.";
      }),
    ];
  },
  standard: (w) => {
    vertrauenAendern(w, -1.5);
    return "Ohne Reaktion wird das Leck zum Dauerthema: Der Eindruck eines zerstrittenen Kabinetts bleibt.";
  },
};

export const PERSONEN_VORLAGEN: Vorlage[] = [RUECKTRITT, SKANDAL, INTRIGE, LECK];

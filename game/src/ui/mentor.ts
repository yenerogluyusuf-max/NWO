// Randnotizen der Mentorin (Lernkonzept, Abschnitt 4). Vorerst feste Regeln
// statt Sprachmodell. Sie erklären nur, was das Modell tatsächlich rechnet,
// und nennen keine Zahlen über die Zukunft.

import type { World } from "../sim/types";
import { realRate } from "../sim/economy";
import { stimmenSicht } from "../sim/handeln";
import { waehlerLage } from "../sim/waehler";
import { t } from "../i18n";

export interface Note {
  short: string;
  more: string;
  /** Kennung und Rang (Takt): gleiche Kennungen erscheinen nur einmal, die dringendste Notiz steht vorn */
  id?: string;
  prio?: number;
}

export function mentorNotes(world: World): Note[] {
  const e = world.economy;
  const roh = new Map<string, Note & { prio: number }>();
  /** Eine Notiz vormerken; bei gleicher Kennung gewinnt die mit dem höheren Rang („Kapital knapp“ stand früher doppelt) */
  const add = (id: string, prio: number, n: { short: string; more: string }) => {
    const alt = roh.get(id);
    if (!alt || alt.prio < prio) roh.set(id, { ...n, id, prio });
  };
  const r = realRate(e);

  if (r > 3) {
    add("realzins-hoch", 40, {
      short: t("mentor.realzins-hoch.short"),
      more: t("mentor.realzins-hoch.more"),
    });
  } else if (r < 0) {
    add("realzins-negativ", 45, {
      short: t("mentor.realzins-negativ.short"),
      more: t("mentor.realzins-negativ.more"),
    });
  }

  const yearAgo = world.history[world.history.length - 12];
  if (yearAgo) {
    const fx = (e.usdTry / yearAgo.usdTry - 1) * 100;
    const normal = e.inflation - 2.5;
    if (fx > normal + 10) {
      add("lira-schwach", 50, {
        short: t("mentor.lira-schwach.short"),
        more: t("mentor.lira-schwach.more"),
      });
    }
  }

  if (e.credibility < 0.25) {
    add("glaubwuerdigkeit", 55, {
      short: t("mentor.glaubwuerdigkeit.short"),
      more: t("mentor.glaubwuerdigkeit.more"),
    });
  }

  const spiel = world.spiel;
  if (spiel) {
    if (world.day < 45) {
      add("tipp-start", 95, {
        short: t("mentor.tipp-start.short"),
        more: t("mentor.tipp-start.more"),
      });
    }
    if (spiel.kapital < 10) {
      add("kapital", 85, {
        short: t("mentor.kapital.short"),
        more: t("mentor.kapital.more"),
      });
    }
    const s = stimmenSicht(world);
    if (s.luecke > 0) {
      add("mehrheit", 80, {
        short: t("mentor.mehrheit.short", { n: s.luecke }),
        more: t("mentor.mehrheit.more"),
      });
    }
  }

  if (roh.size === 0) {
    add("ruhig", 1, {
      short: t("mentor.ruhig.short"),
      more: t("mentor.ruhig.more"),
    });
  }
  // Hinweise zu den Spielsystemen: Kapital, Wähler, Partner
  const sp = world.spiel;
  if (sp) {
    if (sp.kapital < 8 && world.day > 60) {
      add("kapital", 88, {
        short: t("mentor.kapital.short2"),
        more: t("mentor.kapital.more2"),
      });
    }
    const verstimmt = waehlerLage(world).filter((g) => g.laune < 42).sort((a, b) => a.laune - b.laune)[0];
    if (verstimmt) {
      add("waehler-verstimmt", 70, {
        short: t("mentor.waehler-verstimmt.short", { name: verstimmt.name, s: Math.round(verstimmt.laune) }),
        more: t("mentor.waehler-verstimmt.more", { gruende: verstimmt.gruende.slice(0, 2).map((r) => `${r.name} (${r.text.replace(/\.$/, "")})`).join("; ") }),
      });
    }
    const wackelig = sp.figuren.find((f) => f.amt === "partner" && sp.lager.includes(f.partei ?? "") && f.loyalitaet < 32);
    if (wackelig) {
      add("partner-wackelt", 90, {
        short: t("mentor.partner-wackelt.short", { rolle: wackelig.rolle, name: wackelig.name }),
        more: t("mentor.partner-wackelt.more"),
      });
    }
  }
  // Nachher-Notiz: Was der jüngste Wirkungsbericht über eine frühere Entscheidung sagt (sim/berichte.ts), solange er frisch ist
  const bericht = [...(world.spiel?.berichte ?? [])].reverse().find((b) => world.day - b.tag <= 60 && b.phase !== "zu_frueh" && b.kurz);
  if (bericht) {
    add(`nachher-${bericht.tag}-${bericht.massnahme}`, 75, { short: bericht.kurz!, more: [...(bericht.begruendung ?? []), bericht.hinweis].join(" ") });
  }
  // „Alles ruhig“ nur, wenn sonst nichts zu sagen ist
  if (roh.size > 1) roh.delete("ruhig");
  return [...roh.values()].sort((a, b) => b.prio - a.prio).slice(0, 5);
}

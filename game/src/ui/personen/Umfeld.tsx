// Das Umfeld: links die Menschen um den Präsidenten mit Stimmung, rechts das Profil der gewählten Person mit Lage, Auftrag, Gespräch und Wechsel im Amt.

import { useEffect, useRef, useState } from "react";
import type { World } from "../../sim/types";
import type { Figur } from "../../sim/spiel-typen";
import { haltung } from "../../sim/figuren";
import { NET } from "../../sim/modell";
import { AEMTER, ehrgeizWort, eigenVon, empfehlung, erinnerungen, grollWort, lageIm, leistung, leistungWort, nf, ressortWirkungSicht, sorgeText, sprechbar, wertVon } from "../../sim/personen";
import { LAGER_NAMEN, STIL_NAMEN } from "../../sim/personen-typen";
import { AUFTRAG_TAGE, gespraechGrund } from "../../sim/gespraeche";
import { zusagenSicht } from "../../sim/zusagen";
import { addDays, formatDateDe } from "../../sim/dates";
import { kannZahlen } from "../../sim/kapital";
import { Balken, Marke, Portraet, tonVon } from "./bausteine";
import { GespraechSzene } from "./GespraechSzene";
import { NachfolgeAuswahl, type WechselMeldung } from "./NachfolgeAuswahl";

import { t } from "../../i18n";
const REIHENFOLGE: Figur["amt"][] = ["stab", "finanzen", "wirtschaft", "inneres", "aussen", "justiz", "generalstab"];

function gruppen(w: World): { titel: string; liste: Figur[] }[] {
  const fs = (w.spiel?.figuren ?? []).filter((f) => f.imAmt);
  const regierung = fs.filter((f) => AEMTER[f.amt].regierungsamt).sort((a, b) => REIHENFOLGE.indexOf(a.amt) - REIHENFOLGE.indexOf(b.amt));
  const buendnis = fs.filter((f) => f.amt === "partner" || f.amt === "zentralbank");
  const gegner = fs.filter((f) => f.amt === "opposition");
  return [
    { titel: "Regierung", liste: regierung },
    { titel: "Bündnis und Institutionen", liste: buendnis },
    { titel: "Gegenspieler", liste: gegner },
  ].filter((g) => g.liste.length);
}

const NAME = (id: string) => NET.nodes[NET.index.get(id) ?? -1]?.name ?? id;
const datum = (w: World, tag: number) => formatDateDe(addDays(w.spiel!.start.datum, tag));

export function Umfeld({
  world,
  refresh,
  initialPersonId,
  initialModus,
}: {
  world: World;
  refresh: () => void;
  initialPersonId?: string | null;
  initialModus?: "detail" | "gespraech" | "entlassen" | "nachfolge";
}) {
  const spiel = world.spiel!;
  const [auswahl, setAuswahl] = useState<string | null>(initialPersonId ?? null);
  const [modus, setModus] = useState<"detail" | "gespraech" | "entlassen" | "nachfolge">(initialModus ?? "detail");
  const [meldung, setMeldung] = useState<WechselMeldung | null>(null);

  const detailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (initialPersonId) {
      setAuswahl(initialPersonId);
      if (initialModus) setModus(initialModus);
      // Aus dem Kabinett kommend beginnt die Ansicht bei der gewählten Person, nicht mitten in der Liste
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ block: "start" }));
    }
  }, [initialPersonId, initialModus]);
  const f = spiel.figuren.find((x) => x.id === auswahl);
  const gr = gruppen(world);
  const zusagenAlle = zusagenSicht(world);
  // Beim Wechsel in eine Szene springt die Ansicht an ihren Anfang
  const erster = useRef(true);
  useEffect(() => {
    if (erster.current) {
      erster.current = false;
      return;
    }
    detailRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [modus, auswahl]);

  function waehle(id: string) {
    setAuswahl(id);
    setModus("detail");
    setMeldung(null);
  }

  return (
    <div className={`pe-layout${f ? " pe-offen" : ""}${f && modus !== "detail" ? " pe-szenenmodus" : ""}`}>
      <div className="pe-liste">
        {gr.map((g) => (
          <div key={g.titel} style={{ display: "contents" }}>
            <div className="pe-gruppe">{g.titel}</div>
            {g.liste.map((p) => {
              const e = eigenVon(world, p);
              const zus = zusagenAlle.filter((z) => z.bezug.id === p.id).length;
              return (
                <button key={p.id} className={`pe-karte${auswahl === p.id ? " on" : ""}`} onClick={() => waehle(p.id)} aria-pressed={auswahl === p.id}>
                  <Portraet w={world} f={p} />
                  <span>
                    <strong>{p.name}</strong>
                    <span className="pe-rolle">{p.rolle}</span>
                    <span className="pe-zeile">
                      <span style={{ flex: 1 }}>
                        <Balken wert={p.loyalitaet} wort={haltung(p)} klein />
                      </span>
                    </span>
                    <span className="pe-zeile" style={{ flexWrap: "wrap" }}>
                      {e.kommissarisch && <Marke art="gold">{t("ui2.ui.personen.Umfeld.5d54a5d")}</Marke>}
                      {e.auftrag?.status === "laeuft" && <Marke art="gruen">{t("ui.personen.Umfeld.357a028")}</Marke>}
                      {e.groll >= 40 && p.amt !== "opposition" && <Marke art="rot">{grollWort(e.groll)}</Marke>}
                      {p.loyalitaet < 25 && p.amt !== "opposition" && <Marke art="rot">{t("ui.personen.Umfeld.434c793")}</Marke>}
                      {zus > 0 && <Marke art="gold">{zus === 1 ? "1 Zusage" : t("ui2.ui.personen.Umfeld.4e66df4", { p0: zus })}</Marke>}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ))}
        {(spiel.ehemalige?.length ?? 0) > 0 && (
          <div className="pe-ehemalige">
            <div className="pe-gruppe">{t("ui2.ui.personen.Umfeld.d9790e8")}</div>
            <ul>
              {[...spiel.ehemalige!].reverse().slice(0, 5).map((x) => (
                <li key={`${x.name}-${x.ausgeschieden}`}>
                  <strong>{x.name}</strong>, {x.rolle}: {x.grund} ({datum(world, x.ausgeschieden)}).{x.ausgepackt ? t("ui2.ui.personen.Umfeld.af920b2") : x.groll >= 55 && x.ehrgeiz >= 40 ? t("ui2.ui.personen.Umfeld.e180454") : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="pe-detail" ref={detailRef}>
        {!f && <p className="pe-leer">{t("ui.personen.Umfeld.bc8ab5f")}</p>}
        {f && (
          <>
            <button className="pe-zurueck" onClick={() => setAuswahl(null)}>
              {t("ui2.ui.personen.Umfeld.f62e55c")}
            </button>
            {modus === "gespraech" && <GespraechSzene key={`${f.id}-${world.day}`} world={world} figur={f} refresh={refresh} onFertig={() => setModus("detail")} />}
            {(modus === "entlassen" || modus === "nachfolge") && (
              <NachfolgeAuswahl
                world={world}
                figur={f}
                modus={modus}
                refresh={refresh}
                onFertig={(m) => {
                  if (m) setMeldung(m);
                  setModus("detail");
                }}
              />
            )}
            {modus === "detail" && <Detail world={world} f={f} meldung={meldung} onModus={setModus} />}
          </>
        )}
      </div>
    </div>
  );
}

function Detail({ world, f, meldung, onModus }: { world: World; f: Figur; meldung: WechselMeldung | null; onModus: (m: "gespraech" | "entlassen" | "nachfolge") => void }) {
  const spiel = world.spiel!;
  const e = eigenVon(world, f);
  const d = AEMTER[f.amt];
  const lage = lageIm(world, f);
  const q = leistung(world, f);
  const grund = gespraechGrund(world, f.id);
  const zus = zusagenSicht(world).filter((z) => z.bezug.id === f.id || (f.partei && z.z.von === f.partei));
  const a = e.auftrag;
  const auftragStand = a && a.status === "laeuft" ? Math.max(0, Math.min(1, ((wertVon(world, a.groesse) - a.vorher) * a.richtung) / a.delta)) : undefined;
  return (
    <>
      {meldung && (
        <p className={`pe-rueck${meldung.ok ? "" : " nein"}`} role="status">
          {meldung.text}
          {meldung.why && <em> {meldung.why}</em>}
        </p>
      )}
      <div className="pe-kopfzeile">
        <Portraet w={world} f={f} size={140} />
        <div>
          <h3>{f.name}</h3>
          <div className="pe-rolle">{f.rolle}</div>
          <div className="pe-marken">
            <Marke>{STIL_NAMEN[e.stil]}</Marke>
            <Marke art="gold">{LAGER_NAMEN[e.lager]}</Marke>
            {e.kommissarisch && <Marke art="rot">{t("ui2.ui.personen.Umfeld.5d54a5d")}</Marke>}
            {e.einarbeitungBis !== undefined && e.einarbeitungBis > world.day && <Marke>{t("ui2.ui.personen.Umfeld.31f3f5e", { p0: datum(world, e.einarbeitungBis) })}</Marke>}
            {e.mittelBis !== undefined && e.mittelBis > world.day && <Marke art="gruen">{t("ui2.ui.personen.Umfeld.8038b75", { p0: datum(world, e.mittelBis) })}</Marke>}
            {e.druckBis !== undefined && e.druckBis > world.day && <Marke art="rot">{t("ui2.ui.personen.Umfeld.43f31d1")}</Marke>}
          </div>
        </div>
      </div>

      <div className="pe-werte">
        <Balken label={t("ui.personen.Umfeld.87f6f23")} wert={f.loyalitaet} wort={haltung(f)} hinweis={t("ui2.ui.personen.Umfeld.5abc3cc", { p0: Math.round(f.loyalitaet) })} />
        {f.amt !== "opposition" && <Balken label={t("ui2.ui.personen.Umfeld.3c20244")} wert={e.groll} ton={tonVon(e.groll, true)} wort={grollWort(e.groll)} hinweis={t("ui2.ui.personen.Umfeld.8e094b6")} />}
        <Balken label={t("ui2.ui.personen.Umfeld.3cdcb44")} wert={e.ehrgeiz} ton={e.ehrgeiz >= 75 ? "schlecht" : "gut"} wort={ehrgeizWort(e.ehrgeiz)} hinweis={t("ui2.ui.personen.Umfeld.fb3dd93")} />
        {d.wirkung.length > 0 && <Balken label={t("ui2.ui.personen.Umfeld.1f34211")} wert={Math.min(100, q * 100)} wort={leistungWort(q)} hinweis={t("ui2.ui.personen.Umfeld.6b665e0")} />}
      </div>

      <div className="pe-block">
        <h4>{t("ui2.ui.personen.Umfeld.9f39c02")} {f.weiblich ? "sie" : "er"} will</h4>
        <p>{f.ziel}</p>
      </div>
      <div className="pe-block">
        <h4>{t("ui2.ui.personen.Umfeld.9f39c02")} {f.weiblich ? "sie" : "er"} {t("ui2.ui.personen.Umfeld.3bd0592")}</h4>
        <p>{sorgeText(world, f)}</p>
      </div>

      {empfehlung(world, f) && <p className="pe-rueck" role="note">{empfehlung(world, f)}</p>}

      {lage.length > 0 && (
        <div className="pe-block">
          <h4>{t("ui2.ui.personen.Umfeld.696da9e", { p0: d.ressort })}</h4>
          <div className="pe-lage">
            {lage.map((l) => (
              <Balken key={l.id} label={l.name} wert={l.wert} ton={l.ton} wort={`${Math.round(l.wert)}${l.schlechtWennHoch ? " (hoch = schlecht)" : ""}`} klein />
            ))}
          </div>
        </div>
      )}

      {d.wirkung.length > 0 && (
        <div className="pe-block">
          <h4>{t("ui2.ui.personen.Umfeld.9f39c02")} {f.weiblich ? "sie" : "er"} {t("ui2.ui.personen.Umfeld.74d9e99")}</h4>
          <p>
            {ressortWirkungSicht(world, f)
              .map((x) => `${x.name} ${x.punkte >= 0 ? "+" : "−"}${nf(Math.abs(x.punkte), 1)}`)
              .join(", ")}{" "}
            {t("ui2.ui.personen.Umfeld.4997875", { p0: leistungWort(q) })}
          </p>
        </div>
      )}

      {a && (
        <div className={`pe-auftrag ${a.status}`}>
          <h4 style={{ margin: 0, font: "600 11px var(--display)", letterSpacing: "0.13em", textTransform: "uppercase", color: "var(--ink-soft)" }}>{t("ui2.ui.personen.Umfeld.4ec1a90")}</h4>
          <div>
            <strong>{a.text}</strong>{t("ui2.ui.personen.Umfeld.6dca946", { p0: NAME(a.groesse), p1: Math.round(a.vorher), p2: a.delta })} {a.richtung > 0 ? t("ui2.ui.personen.Umfeld.538533a") : t("ui2.ui.personen.Umfeld.4550ae0")}{t("ui2.ui.personen.Umfeld.76822c8", { p0: datum(world, a.frist) })}
          </div>
          {a.status === "laeuft" && auftragStand !== undefined && <Balken wert={auftragStand * 100} wort={`${Math.round(auftragStand * 100)} %`} ton={auftragStand >= 0.6 ? "gut" : auftragStand >= 0.25 ? "mittel" : "schlecht"} klein label={t("ui2.ui.personen.Umfeld.b1ef968", { p0: Math.round(wertVon(world, a.groesse)) })} />}
          {a.status === "erfuellt" && <div>{t("ui2.ui.personen.Umfeld.c1aa0a7", { p0: Math.round(a.vorher), p1: Math.round(a.nachher ?? 0) })}</div>}
          {a.status === "verfehlt" && <div>{t("ui2.ui.personen.Umfeld.cffd6ad", { p0: Math.round(a.vorher), p1: Math.round(a.nachher ?? 0) })}</div>}
          {e.bilanz && <div className="subtitle" style={{ margin: 0 }}>{t("ui2.ui.personen.Umfeld.fddaa27", { p0: e.bilanz.erfuellt, p1: e.bilanz.verfehlt })}</div>}
        </div>
      )}

      {zus.length > 0 && (
        <div className="pe-block">
          <h4>{t("ui2.ui.personen.Umfeld.9049d8e")}</h4>
          {zus.map((z) => (
            <p key={z.z.id}>
              {t("ui2.ui.personen.Umfeld.cd4f025", { p0: z.z.text })} {z.tage < 0 ? t("ui2.ui.personen.Umfeld.af1b471") : t("ui2.ui.personen.Umfeld.af10ef2")} {t("ui2.ui.personen.Umfeld.1c7f52e", { p0: Math.abs(z.tage), p1: formatDateDe(z.datum) })}
            </p>
          ))}
        </div>
      )}

      <div className="pe-aktionen">
        {sprechbar(f) ? (
          <button className="pe-aktion haupt" disabled={!!grund} title={grund ?? t("ui2.ui.personen.Umfeld.7e4fc7d")} onClick={() => onModus("gespraech")}>
            {t("ui.personen.Umfeld.9abd389")}
          </button>
        ) : (
          <p className="subtitle" style={{ margin: 0 }}>{t("ui.personen.Umfeld.0b8e66a")}</p>
        )}
        {e.kommissarisch && (
          <button className="pe-aktion" disabled={!kannZahlen(spiel.kapital, 1)} onClick={() => onModus("nachfolge")}>
            {t("ui2.ui.personen.Umfeld.4f4a5d3")}
          </button>
        )}
        {d.entlassbar && !e.kommissarisch && (
          <button className="pe-aktion leise" onClick={() => onModus("entlassen")} title={t("ui.personen.Umfeld.592baca")}>
            {t("ui2.ui.personen.Umfeld.dd0f76f")}
          </button>
        )}
        {f.amt === "zentralbank" && <p className="subtitle" style={{ margin: 0 }}>{t("ui.personen.Umfeld.7920b3c")}</p>}
      </div>
      {grund && sprechbar(f) && <p className="subtitle" style={{ margin: 0 }}>{grund}</p>}

      {erinnerungen(f).length > 0 && (
        <div className="pe-block">
          <h4>{t("ui2.ui.personen.Umfeld.d95298f")}</h4>
          <ul className="pe-erinnerung">
            {erinnerungen(f).slice(0, 6).map((x, i) => (
              <li key={i}>
                <time>{datum(world, x.tag)}</time>
                <span>{x.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="subtitle" style={{ margin: 0 }}>
        {t("ui2.ui.personen.Umfeld.4de8751", { p0: datum(world, e.seit), p1: Math.round(AUFTRAG_TAGE / 30), p2: nf(f.loyalitaet, 0) })}
      </p>
    </>
  );
}


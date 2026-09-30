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

export function Umfeld({ world, refresh }: { world: World; refresh: () => void }) {
  const spiel = world.spiel!;
  const [auswahl, setAuswahl] = useState<string | null>(null);
  const [modus, setModus] = useState<"detail" | "gespraech" | "entlassen" | "nachfolge">("detail");
  const [meldung, setMeldung] = useState<WechselMeldung | null>(null);
  const f = spiel.figuren.find((x) => x.id === auswahl);
  const gr = gruppen(world);
  const zusagenAlle = zusagenSicht(world);
  const detailRef = useRef<HTMLDivElement>(null);
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
                      {e.kommissarisch && <Marke art="gold">kommissarisch</Marke>}
                      {e.auftrag?.status === "laeuft" && <Marke art="gruen">Auftrag läuft</Marke>}
                      {e.groll >= 40 && p.amt !== "opposition" && <Marke art="rot">{grollWort(e.groll)}</Marke>}
                      {p.loyalitaet < 25 && p.amt !== "opposition" && <Marke art="rot">Rücktrittsgefahr</Marke>}
                      {zus > 0 && <Marke art="gold">{zus === 1 ? "1 Zusage" : `${zus} Zusagen`}</Marke>}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ))}
        {(spiel.ehemalige?.length ?? 0) > 0 && (
          <div className="pe-ehemalige">
            <div className="pe-gruppe">Ausgeschieden</div>
            <ul>
              {[...spiel.ehemalige!].reverse().slice(0, 5).map((x) => (
                <li key={`${x.name}-${x.ausgeschieden}`}>
                  <strong>{x.name}</strong>, {x.rolle}: {x.grund} ({datum(world, x.ausgeschieden)}).{x.ausgepackt ? " Hat ausgepackt." : x.groll >= 55 && x.ehrgeiz >= 40 ? " Könnte reden." : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="pe-detail" ref={detailRef}>
        {!f && <p className="pe-leer">Wählen Sie eine Person: Sie sehen ihr Profil, ihre Sorgen und ihr Ressort und können mit ihr reden.</p>}
        {f && (
          <>
            <button className="pe-zurueck" onClick={() => setAuswahl(null)}>
              ← Alle Personen
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
        <Portraet w={world} f={f} size={78} />
        <div>
          <h3>{f.name}</h3>
          <div className="pe-rolle">{f.rolle}</div>
          <div className="pe-marken">
            <Marke>{STIL_NAMEN[e.stil]}</Marke>
            <Marke art="gold">{LAGER_NAMEN[e.lager]}</Marke>
            {e.kommissarisch && <Marke art="rot">kommissarisch</Marke>}
            {e.einarbeitungBis !== undefined && e.einarbeitungBis > world.day && <Marke>arbeitet sich ein bis {datum(world, e.einarbeitungBis)}</Marke>}
            {e.mittelBis !== undefined && e.mittelBis > world.day && <Marke art="gruen">Zusatzmittel bis {datum(world, e.mittelBis)}</Marke>}
            {e.druckBis !== undefined && e.druckBis > world.day && <Marke art="rot">unter Druck</Marke>}
          </div>
        </div>
      </div>

      <div className="pe-werte">
        <Balken label="Loyalität" wert={f.loyalitaet} wort={haltung(f)} hinweis={`Loyalität ${Math.round(f.loyalitaet)} von 100`} />
        {f.amt !== "opposition" && <Balken label="Groll" wert={e.groll} ton={tonVon(e.groll, true)} wort={grollWort(e.groll)} hinweis="Aufgestauter Ärger: führt zu Durchstechereien und zum Bruch" />}
        <Balken label="Ehrgeiz" wert={e.ehrgeiz} ton={e.ehrgeiz >= 75 ? "schlecht" : "gut"} wort={ehrgeizWort(e.ehrgeiz)} hinweis="Ehrgeizige sind gefährlich, wenn sie übergangen werden" />
        {d.wirkung.length > 0 && <Balken label="Ressortleistung" wert={Math.min(100, q * 100)} wort={leistungWort(q)} hinweis="Aus Fähigkeit und Loyalität; Zusatzmittel und Druck erhöhen, Einarbeitung senkt" />}
      </div>

      <div className="pe-block">
        <h4>Was {f.weiblich ? "sie" : "er"} will</h4>
        <p>{f.ziel}</p>
      </div>
      <div className="pe-block">
        <h4>Was {f.weiblich ? "sie" : "er"} gerade umtreibt</h4>
        <p>{sorgeText(world, f)}</p>
      </div>

      {empfehlung(world, f) && <p className="pe-rueck" role="note">{empfehlung(world, f)}</p>}

      {lage.length > 0 && (
        <div className="pe-block">
          <h4>Lage im Ressort {d.ressort}</h4>
          <div className="pe-lage">
            {lage.map((l) => (
              <Balken key={l.id} label={l.name} wert={l.wert} ton={l.ton} wort={`${Math.round(l.wert)}${l.schlechtWennHoch ? " (hoch = schlecht)" : ""}`} klein />
            ))}
          </div>
        </div>
      )}

      {d.wirkung.length > 0 && (
        <div className="pe-block">
          <h4>Was {f.weiblich ? "sie" : "er"} im Ressort bewirkt</h4>
          <p>
            {ressortWirkungSicht(world, f)
              .map((x) => `${x.name} ${x.punkte >= 0 ? "+" : "−"}${nf(Math.abs(x.punkte), 1)}`)
              .join(", ")}{" "}
            Punkte auf Dauer (Leistung {leistungWort(q)}). Wer nachlässt oder gegen Sie arbeitet, bremst das Ressort.
          </p>
        </div>
      )}

      {a && (
        <div className={`pe-auftrag ${a.status}`}>
          <h4 style={{ margin: 0, font: "600 11px var(--display)", letterSpacing: "0.13em", textTransform: "uppercase", color: "var(--ink-soft)" }}>Auftrag</h4>
          <div>
            <strong>{a.text}</strong>: {NAME(a.groesse)} von {Math.round(a.vorher)} um mindestens {a.delta} Punkte {a.richtung > 0 ? "steigern" : "senken"}, bis {datum(world, a.frist)}.
          </div>
          {a.status === "laeuft" && auftragStand !== undefined && <Balken wert={auftragStand * 100} wort={`${Math.round(auftragStand * 100)} %`} ton={auftragStand >= 0.6 ? "gut" : auftragStand >= 0.25 ? "mittel" : "schlecht"} klein label={`Fortschritt (jetzt ${Math.round(wertVon(world, a.groesse))})`} />}
          {a.status === "erfuellt" && <div>Erfüllt: {Math.round(a.vorher)} auf {Math.round(a.nachher ?? 0)}.</div>}
          {a.status === "verfehlt" && <div>Verfehlt: {Math.round(a.vorher)} auf {Math.round(a.nachher ?? 0)}.</div>}
          {e.bilanz && <div className="subtitle" style={{ margin: 0 }}>Bisher: {e.bilanz.erfuellt} erfüllt, {e.bilanz.verfehlt} verfehlt.</div>}
        </div>
      )}

      {zus.length > 0 && (
        <div className="pe-block">
          <h4>Offene Zusagen</h4>
          {zus.map((z) => (
            <p key={z.z.id}>
              {z.z.text}: fällig {z.tage < 0 ? "seit" : "in"} {Math.abs(z.tage)} Tagen ({formatDateDe(z.datum)}).
            </p>
          ))}
        </div>
      )}

      <div className="pe-aktionen">
        {sprechbar(f) ? (
          <button className="pe-aktion haupt" disabled={!!grund} title={grund ?? "Ein Gespräch: Thema und Ansatz wählen"} onClick={() => onModus("gespraech")}>
            Gespräch führen
          </button>
        ) : (
          <p className="subtitle" style={{ margin: 0 }}>Mit dem Oppositionsführer verhandeln Sie über die Fraktionen im Parlament.</p>
        )}
        {e.kommissarisch && (
          <button className="pe-aktion" disabled={!kannZahlen(spiel.kapital, 1)} onClick={() => onModus("nachfolge")}>
            Nachfolger ernennen
          </button>
        )}
        {d.entlassbar && !e.kommissarisch && (
          <button className="pe-aktion leise" onClick={() => onModus("entlassen")} title="Kandidaten ansehen, Folgen prüfen, dann entscheiden">
            Entlassen …
          </button>
        )}
        {f.amt === "zentralbank" && <p className="subtitle" style={{ margin: 0 }}>Die Zentralbankführung tauschen Sie unter „Wirtschaft“ aus; das kostet Glaubwürdigkeit.</p>}
      </div>
      {grund && sprechbar(f) && <p className="subtitle" style={{ margin: 0 }}>{grund}</p>}

      {erinnerungen(f).length > 0 && (
        <div className="pe-block">
          <h4>Erinnerung</h4>
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
        Seit {datum(world, e.seit)} im Amt · Gespräche binden Termine: höchstens vier in dreißig Tagen · Aufträge laufen {Math.round(AUFTRAG_TAGE / 30)} Monate · {nf(f.loyalitaet, 0)} Loyalität
      </p>
    </>
  );
}


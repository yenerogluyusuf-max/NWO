// Programme für Regionen: Dieselbe Vorlage (Wohnungsbau, Schulen, Wasser …) lässt sich für eine Provinz, eine Region oder das ganze Land anlegen.
// „Wo?“ wählt die Ortswahl der Politik (ui/OrtWahl.tsx); Preis, Dauer und Baukapazität folgen dem Umfang (sim/reich.ts: regionalVorschau, mit
// `umfangFaktor` wie in der Politik), die Wirkung gilt nur in den gewählten Provinzen. Dasselbe Vorhaben am selben Ort gibt es nur einmal.

import { useMemo, useState } from "react";
import type { World } from "../../sim/types";
import type { Vorhaben } from "../../sim/reich-typen";
import { akuteOrte } from "../../sim/handeln";
import { beginneRegional, reichZustand, regionalVorschau, type EffektZeile } from "../../sim/reich";
import { OrtWahl } from "../OrtWahl";
import { Zeilen } from "./Pflege";
import { verliererName } from "./VorhabenKarte";

import { t } from "../../i18n";
import { ohneBeleg } from "../../i18n/ohne-beleg";
export function VorlageKarte({ world, v, refresh }: { world: World; v: Vorhaben; refresh: () => void }) {
  const massnahme = v.vorlage!.massnahme;
  // Beginnt dort, wo es akut ist; gibt es keinen akuten Ort, gilt das ganze Land
  const [ort, setOrt] = useState<number[] | null>(() => akuteOrte(world, massnahme));
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string } | null>(null);
  const vor = useMemo(() => regionalVorschau(world, v.id, ort), [world, v.id, ort, world.day, world.spiel?.kapital]);
  const z = reichZustand(world);
  const angelegt = Object.values(z.regional ?? {}).filter((e) => e.vorlage === v.id);

  const anlegen = () => {
    const r = beginneRegional(world, v.id, ort);
    setAntwort({ ok: r.ok, text: r.text });
    refresh();
  };

  const grund = !vor.ok
    ? vor.grund
    : vor.konflikt
      ? "Dasselbe Programm gibt es dort schon"
      : !vor.bereit
        ? "Voraussetzungen fehlen"
        : !vor.bezahlbar
          ? "Dafür fehlt Kapital"
          : !vor.verwaltungOk
            ? "Die Verwaltungskraft reicht nicht"
            : "";

  return (
    <article className="rr-karte rg-karte klasse-grossprojekt">
      <div className="rr-karte-kopf">
        <span className="rr-klasse">{t("ui.reich.Regional.3887a19")}</span>
      </div>
      <h4 className="rr-name">{v.name}</h4>
      <p className="rr-text">{ohneBeleg(v.text)}</p>

      <div className="rg-wo">
        <b className="rr-wirkung-kopf">Wo?</b>
        <OrtWahl world={world} massnahmeId={massnahme} ort={ort} onChange={(o) => { setOrt(o); setAntwort(null); }} />
      </div>

      {!vor.ok ? (
        <p className="rr-sperre">{vor.grund}</p>
      ) : (
        <>
          <p className="rg-preisschild" title={t("ui.reich.Regional.7796ba9")}>
            {vor.preisschild}
          </p>
          <ul className="rr-kosten" aria-label={t("ui.reich.Regional.3a20748")}>
            <li><b>{vor.def.kosten.pk.toLocaleString("de-DE")}</b> {t("ui2.ui.reich.Regional.28d438e")}</li>
            <li><b>{vor.def.kosten.bau.toLocaleString("de-DE")}</b> {t("ui2.ui.reich.Regional.f4466ae")}</li>
            <li><b>{vor.def.kosten.monate}</b> {t("ui2.ui.reich.Regional.1c561ae")}</li>
            {vor.def.kosten.verwaltung ? <li><b>{vor.def.kosten.verwaltung.toLocaleString("de-DE")}</b> {t("ui2.ui.reich.Regional.48ddb61")}</li> : null}
            {vor.def.kosten.schulden ? <li><b>{vor.def.kosten.schulden.toLocaleString("de-DE")}</b> % BIP</li> : null}
          </ul>
          {vor.voraus.length > 0 && (
            <ul className="rr-voraus" aria-label={t("ui2.ui.reich.Regional.bc4e9f4")}>
              {vor.voraus.map((x, i) => (
                <li key={i} className={x.erfuellt ? "ok" : "offen"}>
                  <span aria-hidden>{x.erfuellt ? "✓" : "○"}</span> {x.text}
                </li>
              ))}
            </ul>
          )}
          <div className="rr-wirkung">
            <b className="rr-wirkung-kopf">{t("ui2.ui.reich.Regional.ca81108")}</b>
            <Zeilen zeilen={vor.vorschau.sofort.slice(0, 6) as EffektZeile[]} />
            {vor.vorschau.dauerhaft.length > 0 && (
              <>
                <b className="rr-wirkung-kopf">{t("ui2.ui.reich.Regional.90053b7")}</b>
                <Zeilen zeilen={vor.vorschau.dauerhaft.slice(0, 5)} />
              </>
            )}
          </div>
          {vor.konflikt && <p className="rr-sperre">{vor.konflikt}</p>}
        </>
      )}

      <p className="rr-kehrseite">
        <b>{t("ui2.ui.reich.Regional.0289c3f")}</b> {v.kehrseite}
        {v.verlierer && <em> Es verliert: {verliererName(v.verlierer)}.</em>}
      </p>

      <button type="button" className="aktion-knopf rr-beginnen" disabled={!!grund} onClick={anlegen} title={grund || undefined}>
        {t("ui2.ui.reich.Regional.846460c")}{vor.ok ? t("ui2.ui.reich.Regional.89cba7e", { p0: vor.def.name.split(": ").slice(1).join(": ") }) : ""}
      </button>
      {antwort && <p className={`rr-ergebnis ${antwort.ok ? "ok" : "nein"}`}>{antwort.text}</p>}

      {angelegt.length > 0 && (
        <div className="rg-angelegt">
          <b className="rr-wirkung-kopf">{t("ui2.ui.reich.Regional.597c344")}</b>
          <ul>
            {angelegt.map((e) => {
              const fertig = !!z.bestand[e.def.id];
              const l = z.laufend.find((x) => x.id === e.def.id);
              return (
                <li key={e.def.id} className={fertig ? "fertig" : ""}>
                  {e.def.name} <span className="rr-bau-info">{fertig ? t("ui2.ui.reich.Regional.54e0d1a") : l ? t("ui2.ui.reich.Regional.e972436") : t("ui2.ui.reich.Regional.f59a934")}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </article>
  );
}

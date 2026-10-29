// Behörden ausbauen: Übersicht als Kacheln (Leitung, drei Stufenleisten Personal/Technik/Reichweite, Zustand), Einzelheiten in der
// Detailleiste: je Achse Ausbau (Preis, Dauer, Wirkung in einem Satz) und Kürzen, Etat, Unterhalt, Sonderinstrument. Der Ausbau ist
// Spielmechanik mit spürbaren Folgen (sim/behoerden.ts).

import { useState, type ReactNode } from "react";
import type { World } from "../../sim/types";
import type { Achse, BehoerdeId } from "../../data/behoerden";
import { behoerdeSicht, behoerdenImBereich, baueAus, kuerze, setzeInstrumentEin, type Antwort } from "../../sim/behoerden";
import { Portraet } from "../art/Portraet";
import { Uebersicht, UbDetailKopf, UbHandlung, UbRueck, UbStufen, UbVerweis, type UbKachel } from "../akte/Uebersicht";
import { t } from "../../i18n";

function ertragWort(anteil: number): string {
  return t(anteil >= 0.75 ? "behoerden.ui.ertrag.voll" : anteil >= 0.45 ? "behoerden.ui.ertrag.merklich" : "behoerden.ui.ertrag.gering");
}

/** Kachel einer Behörde: Leitung, drei Stufenleisten, Zustand (Ausbau läuft, Etat gekürzt, Sonderinstrument bereit) */
export function behoerdeKachel(w: World, id: BehoerdeId): UbKachel {
  const s = behoerdeSicht(w, id);
  const knapp = !!s.etat && (s.etat.gekuerzt || s.etat.spielraum <= 0);
  const marke = s.bau
    ? { text: t("ub.behoerde.baut", { achse: s.bau.name, monate: s.bau.restMonate }), ton: "aktiv" as const }
    : s.etat?.gekuerzt
      ? { text: t("ub.behoerde.gekuerzt"), ton: "schlecht" as const }
      : s.instrument?.moeglich
        ? { text: t("ub.behoerde.instrument"), ton: "gut" as const }
        : knapp
          ? { text: t("ub.behoerde.knapp"), ton: "mittel" as const }
          : undefined;
  return {
    id,
    titel: s.name,
    zeile: s.leitung.name,
    bild: <Portraet seed={s.leitung.name} size={40} geschlecht={s.leitung.weiblich ? "f" : "m"} rahmen="messing" />,
    leisten: s.achsen.map((a) => ({ name: a.name, stufe: a.stufe, max: 5, bau: s.bau?.achse === a.achse })),
    ...(marke ? { marke } : {}),
    ton: s.bau ? "aktiv" : s.etat?.gekuerzt ? "schlecht" : knapp ? "mittel" : "neutral",
    rang: (s.bau ? 3 : 0) + (s.etat?.gekuerzt ? 2 : 0) + (s.instrument?.moeglich ? 1 : 0),
  };
}

/** Inhalt der Detailleiste einer Behörde; `extra` hängt Besonderes an (MİT: Lagebild, Netze, Inland). */
export function BehoerdeDetail({ w, id, refresh, extra }: { w: World; id: BehoerdeId; refresh: () => void; extra?: ReactNode }) {
  const [antwort, setAntwort] = useState<Antwort | null>(null);
  const s = behoerdeSicht(w, id);
  const tun = (f: () => Antwort) => {
    setAntwort(f());
    refresh();
  };
  return (
    <>
      <UbDetailKopf
        bild={<Portraet seed={s.leitung.name} size={56} geschlecht={s.leitung.weiblich ? "f" : "m"} rahmen="messing" />}
        titel={s.name}
        unter={`${s.leitung.titel}: ${s.leitung.name}`}
        text={s.text}
      />
      <UbRueck antwort={antwort} />
      {s.achsen.map((a) => {
        const imBau = s.bau?.achse === a.achse;
        if (imBau)
          return (
            <div key={a.achse} className="ub-handlung">
              <div className="ub-hkopf">
                <b>{a.name}</b>
                <UbStufen stufe={a.stufe} max={5} bau gross />
              </div>
              <p>{t("behoerden.ui.laeuft", { achse: s.bau!.name, stufe: s.bau!.ziel, monate: s.bau!.restMonate })}</p>
            </div>
          );
        return (
          <div key={a.achse} className="ub-achse">
            <UbHandlung
              titel={`${a.name} · ${t("behoerden.ui.stufe", { stufe: a.stufe })}`}
              knopf={t("behoerden.ui.ausbauen")}
              satz={a.ausbau.satz}
              ok={a.ausbau.ok}
              grund={a.ausbau.grund}
              preis={a.ausbau.ok ? [t("ub.preis.kapital", { n: a.ausbau.pk }), t("ub.preis.bip", { bip: a.ausbau.bip }), t("ub.preis.monate", { n: a.ausbau.monate }), ertragWort(a.ausbau.anteil)] : undefined}
              onTun={() => tun(() => baueAus(w, id, a.achse as Achse))}
              verweis={
                a.kuerzen.ok ? (
                  <button type="button" className="link ub-verweis leise" onClick={() => tun(() => kuerze(w, id, a.achse as Achse))} title={t("behoerden.ui.kuerz_preis", { bip: a.kuerzen.ersparnis })}>
                    {t("behoerden.ui.kuerzen")}
                  </button>
                ) : undefined
              }
            />
          </div>
        );
      })}
      {s.instrument && (
        <UbHandlung
          titel={`${t("behoerden.ui.instrument")}: ${s.instrument.name}`}
          knopf={t("behoerden.ui.einsetzen")}
          satz={s.instrument.text}
          ok={s.instrument.moeglich}
          grund={s.instrument.grund}
          preis={s.instrument.moeglich ? [t("ub.preis.kapital", { n: s.instrument.pk }), s.instrument.bip > 0 && t("ub.preis.bip", { bip: s.instrument.bip })] : undefined}
          onTun={() => tun(() => setzeInstrumentEin(w, id))}
          leise
        />
      )}
      {s.etat && (
        <p className={`ub-info${s.etat.gekuerzt || s.etat.spielraum <= 0 ? " knapp" : ""}`}>
          {t(s.etat.gekuerzt ? "behoerden.ui.etat_gekuerzt" : s.etat.spielraum > 0 ? "behoerden.ui.etat_spielraum" : "behoerden.ui.etat_kein", { ressort: s.etat.name, bip: s.etat.spielraum })}{" "}
          {(s.etat.gekuerzt || s.etat.spielraum <= 0) && <UbVerweis ziel={{ art: "akte", akte: "reich_haushalt" }}>{t("ub.zum_haushalt")}</UbVerweis>}
        </p>
      )}
      {s.unterhalt !== 0 && (
        <p className="ub-info">{s.unterhalt > 0 ? t("behoerden.ui.unterhalt", { bip: s.unterhalt }) : t("behoerden.ui.unterhalt_spar", { bip: -s.unterhalt })}</p>
      )}
      {extra}
    </>
  );
}

/** Alle Behörden eines Bereichs als Übersicht; `extra` liefert Zusatzinhalt je Behörde (MİT). */
export function BehoerdenListe({ w, bereich, refresh, extra }: { w: World; bereich: string; refresh: () => void; extra?: (id: BehoerdeId) => ReactNode }) {
  const ids = behoerdenImBereich(bereich);
  if (!ids.length) return null;
  const kacheln = ids.map((id) => behoerdeKachel(w, id));
  const imBau = kacheln.filter((k) => k.ton === "aktiv").length;
  const knapp = kacheln.filter((k) => k.ton === "schlecht" || k.ton === "mittel").length;
  return (
    <Uebersicht
      aria={t("behoerden.ui.aria")}
      lage={t("behoerden.ui.untertitel")}
      zahlen={[
        { label: t("ub.behoerde.zahl_bau"), wert: String(imBau), ton: imBau ? "aktiv" : "neutral" },
        { label: t("ub.behoerde.zahl_knapp"), wert: String(knapp), ton: knapp ? "schlecht" : "gut" },
      ]}
      kacheln={kacheln}
      detail={(id) => <BehoerdeDetail key={id} w={w} id={id as BehoerdeId} refresh={refresh} extra={extra?.(id as BehoerdeId)} />}
    />
  );
}

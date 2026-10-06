// Speicher- und Ladeverwaltung: Schnellspeichern, 5 Slots, JSON-Export und Import.

import { useRef, useState } from "react";
import type { World } from "../sim/types";
import { formatDateDe } from "../sim/dates";
import {
  alleSlots,
  exportiereSpielstandDatei,
  fruehereStaende,
  importiereSpielstandDatei,
  ladeRueck,
  ladeSlot,
  loescheSlot,
  speichereSlot,
  speichereWarten,
  spielstandInfo,
  type Ergebnis,
} from "./speicher";
import { Icon } from "./icons";

import { t } from "../i18n";
interface Props {
  world: World;
  onLaden: (w: World) => void;
  onGespeichert: (meldung: string) => void;
  onClose?: () => void;
}

export function SpeicherDossier({ world, onLaden, onGespeichert, onClose }: Props) {
  const [slots, setSlots] = useState(() => alleSlots());
  const [slotNotiz, setSlotNotiz] = useState<Record<number, string>>({});
  const [importFehler, setImportFehler] = useState<string | null>(null);
  const [status, setStatus] = useState<{ art: "ok" | "fehler" | "arbeit"; text: string } | null>(null);
  const [auto, setAuto] = useState(() => spielstandInfo());
  const [frueher, setFrueher] = useState(() => fruehereStaende());
  const dateiInput = useRef<HTMLInputElement>(null);

  const aktualisiere = () => {
    setSlots(alleSlots());
    setAuto(spielstandInfo());
    setFrueher(fruehereStaende());
  };

  /** Zeigt das echte Ergebnis einer Sicherung im Reiter selbst (Meldungen sind hinter einer offenen Akte unsichtbar). */
  const zeige = (r: Ergebnis, wasGesichert: string) => {
    const uhr = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    if (r.ok) {
      setStatus({ art: "ok", text: `${wasGesichert} gesichert um ${uhr} Uhr (${r.wo}).` });
      onGespeichert(`${wasGesichert} gesichert`);
    } else {
      setStatus({ art: "fehler", text: `NICHT gesichert: ${r.grund}` });
    }
    aktualisiere();
  };

  async function schnell() {
    setStatus({ art: "arbeit", text: "Sichere …" });
    zeige(await speichereWarten(world), `${formatDateDe(world.date)}`);
  }

  async function speichereIn(slot: number) {
    const notiz = slotNotiz[slot]?.trim() || `Zwischenstand ${formatDateDe(world.date)}`;
    setStatus({ art: "arbeit", text: `Sichere in Slot ${slot} …` });
    // Der Slot bekommt den Stand; der automatische Stand zieht mit, damit „Fortsetzen“ nie älter ist als der Slot
    const r = await speichereSlot(world, slot, notiz);
    zeige(r, `Slot ${slot} („${notiz}“)`);
    if (r.ok) void speichereWarten(world);
  }

  async function ladeAus(slot: number) {
    const w = await ladeSlot(slot);
    if (!w) {
      setStatus({ art: "fehler", text: `Slot ${slot} lässt sich nicht lesen (beschädigt oder leer).` });
      return;
    }
    onLaden(w);
    onGespeichert(`Slot ${slot} geladen.`);
    onClose?.();
  }

  async function ladeFrueher(key: Parameters<typeof ladeRueck>[0]) {
    const w = await ladeRueck(key);
    if (!w) {
      setStatus({ art: "fehler", text: "Diese Sicherung lässt sich nicht lesen." });
      return;
    }
    onLaden(w);
    onGespeichert("Frühere Sicherung geladen.");
    onClose?.();
  }

  async function loesche(slot: number) {
    await loescheSlot(slot);
    aktualisiere();
  }

  function exportiere() {
    const ok = exportiereSpielstandDatei(world);
    if (ok) {
      onGespeichert("Spielstand als JSON-Datei heruntergeladen.");
    }
  }

  function dateiGewaehlt(e: React.ChangeEvent<HTMLInputElement>) {
    setImportFehler(null);
    const datei = e.target.files?.[0];
    if (!datei) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const w = importiereSpielstandDatei(text);
      if (w) {
        onLaden(w);
        onGespeichert("Spielstand aus Datei erfolgreich geladen.");
        onClose?.();
      } else {
        setImportFehler("Die gewählte Datei ist kein gültiger Staatsräson-Spielstand.");
      }
    };
    reader.onerror = () => setImportFehler("Fehler beim Lesen der Datei.");
    reader.readAsText(datei);
  }

  return (
    <div className="speicher-dossier" style={{ padding: "8px 4px", display: "grid", gap: 18 }}>
      <section className="paper" style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 19 }}>Aktueller Stand im Amt</h3>
            <p className="subtitle" style={{ margin: "4px 0 0" }}>
              {world.player?.name ?? "Staatsoberhaupt"} · {formatDateDe(world.date)} · {Math.round(world.spiel?.umfrage.zustimmung ?? 0)} % Zustimmung
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="brass-button"
              onClick={() => void schnell()}
            >
              <Icon name="siegel" size={14} /> Schnellspeichern
            </button>
            <button type="button" className="leather-button" onClick={exportiere}>
              <Icon name="buch" size={14} /> Als Datei sichern (.json)
            </button>
            <button type="button" className="leather-button" onClick={() => dateiInput.current?.click()}>
              <Icon name="feder" size={14} /> Datei laden
            </button>
            <input
              ref={dateiInput}
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={dateiGewaehlt}
            />
          </div>
        </div>
        <p
          role="status"
          aria-live="polite"
          style={{
            margin: "10px 0 0",
            fontStyle: "italic",
            color: status?.art === "fehler" ? "var(--seal)" : "var(--ink-soft)",
            fontWeight: status?.art === "fehler" ? 700 : 400,
          }}
        >
          {status
            ? status.text
            : auto
              ? `Letzte Sicherung im Browser: ${formatDateDe(auto.datum)}${auto.gespeichert ? `, gesichert am ${new Date(auto.gespeichert).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} Uhr` : ""}.`
              : "Noch nichts im Browser gesichert."}
        </p>
        {importFehler && <p style={{ color: "var(--seal)", margin: "10px 0 0", fontStyle: "italic" }}>{importFehler}</p>}
      </section>

      {frueher.length > 0 && (
        <section className="paper" style={{ padding: "14px 18px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 18 }}>{t("ui.SpeicherDossier.408d35f")}</h3>
          <p className="subtitle" style={{ margin: "0 0 12px" }}>
            {t("ui.SpeicherDossier.fe43274")}
          </p>
          <div style={{ display: "grid", gap: 8 }}>
            {frueher.map((r) => (
              <div key={r.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "8px 12px", border: "1px solid rgba(120, 90, 50, 0.35)", background: "rgba(255, 250, 235, 0.75)" }}>
                <span>
                  <strong>{r.key === "hoechst" ? "Weitester Stand" : "Automatische Sicherung"}</strong> · {formatDateDe(r.info.datum)}
                  {r.info.zustimmung !== undefined ? ` · ${Math.round(r.info.zustimmung)} % Zustimmung` : ""}
                  {r.info.gespeichert ? ` · gesichert ${new Date(r.info.gespeichert).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} Uhr` : ""}
                </span>
                <button type="button" className="leather-button" onClick={() => void ladeFrueher(r.key)}>
                  Laden
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="paper" style={{ padding: "14px 18px" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 18 }}>Feste Speicher-Slots (1 bis 5)</h3>
        <p className="subtitle" style={{ margin: "0 0 14px" }}>
          {t("ui.SpeicherDossier.30a1a01")}
        </p>

        <div style={{ display: "grid", gap: 10 }}>
          {[1, 2, 3, 4, 5].map((slotNum) => {
            const info = slots.find((s) => s.slot === slotNum);
            return (
              <div
                key={slotNum}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.4fr) auto",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  border: "1px solid rgba(120, 90, 50, 0.35)",
                  background: info ? "rgba(255, 250, 235, 0.75)" : "rgba(240, 235, 220, 0.35)",
                  borderRadius: 2,
                }}
              >
                <div>
                  <strong style={{ display: "block", fontSize: 15 }}>
                    Slot {slotNum}: {info ? info.label : "Leer"}
                  </strong>
                  {info ? (
                    <span style={{ fontSize: 13, color: "var(--ink-soft)", fontStyle: "italic" }}>
                      {info.datum} · {info.name} ({Math.round(info.zustimmung ?? 0)} % Zustimmung)
                    </span>
                  ) : (
                    <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>{t("ui.SpeicherDossier.e0f9ca5")}</span>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    placeholder={t("ui.SpeicherDossier.7b85853")}
                    value={slotNotiz[slotNum] ?? (info ? info.label : "")}
                    onChange={(e) => setSlotNotiz((n) => ({ ...n, [slotNum]: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "5px 8px",
                      font: "14px var(--serif)",
                      background: "#fff9ec",
                      border: "1px solid rgba(120, 90, 50, 0.4)",
                      borderRadius: 2,
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    className="brass-button"
                    style={{ padding: "4px 10px", fontSize: 13 }}
                    onClick={() => void speichereIn(slotNum)}
                    title={`Aktuellen Stand in Slot ${slotNum} sichern`}
                  >
                    Sichern
                  </button>
                  {info && (
                    <>
                      <button
                        type="button"
                        className="leather-button"
                        style={{ padding: "4px 10px", fontSize: 13 }}
                        onClick={() => void ladeAus(slotNum)}
                        title={`Spielstand aus Slot ${slotNum} laden`}
                      >
                        Laden
                      </button>
                      <button
                        type="button"
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--seal)",
                          cursor: "pointer",
                          fontSize: 16,
                          padding: "0 4px",
                        }}
                        onClick={() => void loesche(slotNum)}
                        title={`Slot ${slotNum} leeren`}
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

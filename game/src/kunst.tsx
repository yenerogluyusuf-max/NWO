// Kunstbogen: alle Zeichnungen auf einer Seite, zum Prüfen während der Entwicklung.
import { createRoot } from "react-dom/client";
import "@fontsource-variable/fraunces";
import "@fontsource/caveat/500.css";
import "./ui/styles.css";
import { Cameo } from "./ui/art/Cameo";
import { Portraet, STIMMUNGEN, RESSORT_FARBE, type Stimmung } from "./ui/art/Portraet";
import { KOPFFORMEN } from "./ui/art/portraet-proportionen";
import { Vignette, type Scene } from "./ui/art/Vignette";
import { Corners, Flourish, StateSeal } from "./ui/art/Ornament";

const SCENES: Scene[] = ["istanbul", "parlament", "bank", "anatolien", "wahlnacht"];
const NAMEN = Array.from({ length: 60 }, (_, i) => `Person ${i + 1}`);
const RESSORTS = Object.keys(RESSORT_FARBE);
const titel = { margin: 0, color: "#f1d58f", font: "600 15px Inter, sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" as const };
const zeile = { display: "flex", flexWrap: "wrap" as const, gap: 14, alignItems: "flex-end" };
const unter = { margin: 0, textAlign: "center" as const, color: "#cdb88c", font: "13px Inter, sans-serif" };

function Abschnitt({ id, kopf, children }: { id: string; kopf: string; children: React.ReactNode }) {
  return (
    <section data-abschnitt={id} style={{ display: "grid", gap: 12, padding: 6 }}>
      <h2 style={titel}>{kopf}</h2>
      <div style={zeile}>{children}</div>
    </section>
  );
}

function Galerie() {
  return (
    <div style={{ display: "grid", gap: 26 }}>
      <Abschnitt id="held" kopf="Heldenporträts 240 px (Rollen, Alter, Geschlecht)">
        {(
          [
            ["Emre Koçak", "m", 52, "finanzen", "sicher"],
            ["Pınar Yıldız", "f", 41, "inneres", "ernst"],
            ["Barış Sezer", "m", 47, "aussen", "selbstgefaellig"],
            ["Burak Akın", "m", 58, "generalstab", "ernst"],
            ["Melis Yalçın", "f", 55, "justiz", "sicher"],
            ["Damla Turan", "f", 36, "stab", "laechelnd"],
          ] as const
        ).map(([n, g, al, ro, st]) => (
          <figure key={n} style={{ margin: 0 }}>
            <Portraet seed={n} geschlecht={g} alter={al} rolle={ro} tint={RESSORT_FARBE[ro]} stimmung={st} size={240} namensschild={n} raster={false} />
            <figcaption style={unter}>{ro}, {al}, {st}</figcaption>
          </figure>
        ))}
      </Abschnitt>
      <Abschnitt id="raster" kopf="Prüfbild: Proportionsraster mit Hilfslinien (12 Kopfformen, Frau und Mann)">
        {KOPFFORMEN.flatMap((_, i) =>
          (["m", "f"] as const).map((g) => (
            <figure key={`${g}${i}`} style={{ margin: 0 }}>
              <Portraet seed={`Raster ${i}`} geschlecht={g} alter={38} kopfform={i} haare={g === "m" ? 0 : 1} size={176} hilfslinien hintergrund={false} stimmung="neutral" raster={false} />
              <figcaption style={unter}>Form {i + 1}, {g}</figcaption>
            </figure>
          )),
        )}
      </Abschnitt>
      <Abschnitt id="mienen" kopf="Mienen (Mann und Frau, 150 px)">
        {(["m", "f"] as const).flatMap((g) =>
          STIMMUNGEN.map((st: Stimmung) => (
            <figure key={g + st} style={{ margin: 0 }}>
              <Portraet seed={g === "m" ? "Barış Sezer" : "Defne Aksoy"} geschlecht={g} alter={44} stimmung={st} size={150} tint="#2c4a7a" rolle="aussen" raster={false} />
              <figcaption style={unter}>{st}</figcaption>
            </figure>
          )),
        )}
      </Abschnitt>
      <Abschnitt id="alter" kopf="Altersreihe 22 bis 78 (Haut, Falten, Haar, Glatze nur Männer ab 40)">
        {[22, 30, 38, 46, 54, 62, 70, 78].flatMap((al) =>
          (["m", "f"] as const).map((g) => (
            <figure key={g + al} style={{ margin: 0 }}>
              <Portraet seed={g === "m" ? "Kemal Yılmaz" : "Elif Kaya"} geschlecht={g} alter={al} size={130} tint="#8c2b1f" stimmung="sicher" raster={false} />
              <figcaption style={unter}>{al}</figcaption>
            </figure>
          )),
        )}
      </Abschnitt>
      <Abschnitt id="rollen" kopf="Rollen und Hintergründe (200 px)">
        {RESSORTS.map((ro, i) => (
          <figure key={ro} style={{ margin: 0 }}>
            <Portraet seed={`Rolle ${ro}`} geschlecht={i % 3 === 1 ? "f" : "m"} alter={45 + i} rolle={ro} tint={RESSORT_FARBE[ro]} stimmung="ernst" size={200} namensschild={ro} raster={false} />
            <figcaption style={unter}>{ro}</figcaption>
          </figure>
        ))}
      </Abschnitt>
      <Abschnitt id="zubehoer" kopf="Zubehör: Brillen, Bärte, Kopftuch, Frisuren 0 bis 9">
        {(["rund", "oval", "eckig", "halb"] as const).map((b) => (
          <Portraet key={b} seed="Pınar Koçak" geschlecht="f" alter={44} brille={b} size={128} tint="#5c4a86" raster={false} />
        ))}
        {(["stoppel", "schnurr", "kinn", "voll"] as const).map((b) => (
          <Portraet key={b} seed="Orhan Özgür" geschlecht="m" alter={50} bart={b} size={128} tint="#2f6b45" raster={false} />
        ))}
        <Portraet seed="Melis Yalçın" geschlecht="f" alter={40} kopftuch size={128} tint="#a8732b" raster={false} />
        <Portraet seed="Aylin Demir" geschlecht="f" alter={55} kopftuch brille="oval" size={128} tint="#2f5d62" raster={false} />
        {Array.from({ length: 10 }, (_, i) => (
          <Portraet key={`hm${i}`} seed={`Frisur ${i}`} geschlecht="m" alter={i === 3 ? 56 : 44} haare={i} kopftuch={false} bart="keiner" size={112} tint="#4a5a6e" raster={false} />
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <Portraet key={`hf${i}`} seed={`Frisur ${i}`} geschlecht="f" alter={36} haare={i} kopftuch={false} size={112} tint="#8a3a5e" raster={false} />
        ))}
      </Abschnitt>
      <Abschnitt id="sechzig" kopf="60 Gesichter aus dem Samen (112 px)">
        {NAMEN.map((n, i) => (
          <Portraet key={n} seed={n} size={112} tint={RESSORT_FARBE[RESSORTS[i % RESSORTS.length]!]} rolle={RESSORTS[i % RESSORTS.length]!} raster={false} />
        ))}
      </Abschnitt>
      <Abschnitt id="groessen" kopf="Größen 40 bis 240 (gleiche Maße in jeder Größe)">
        {[40, 56, 72, 96, 140, 240].map((sz) => (
          <Portraet key={sz} seed="Damla Turan" geschlecht="f" alter={46} size={sz} tint="#2f5d62" stimmung="sicher" rolle="stab" raster={false} />
        ))}
      </Abschnitt>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <div style={{ padding: 24, background: "#2b221b", minHeight: "100vh", display: "grid", gap: 20 }}>
    <Galerie />
    <div style={{ display: "flex", gap: 18, alignItems: "center", color: "#f1d58f" }}>
      {["Deniz Aydın", "Ali Kaya", "Ayşe Demir", "Mehmet Öz", "Zeynep", "Kemal", "Elif"].map((n, i) => (
        <Cameo key={n} seed={n} size={70} tint={["#8e2a22", "#265a62", "#6b4d8a", "#b0762a"][i % 4]} />
      ))}
      <Cameo seed="Defne Arslan" figure="f" glasses size={70} tint="#265a62" />
      <StateSeal />
      <Flourish />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {SCENES.map((s) => (
        <div key={s} className="frame" style={{ position: "relative" }}>
          <Corners />
          <Vignette scene={s} />
        </div>
      ))}
    </div>
  </div>,
);

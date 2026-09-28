// Kunstbogen: alle Zeichnungen auf einer Seite, zum Prüfen während der Entwicklung.
import { createRoot } from "react-dom/client";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "@fontsource/caveat/500.css";
import "./ui/styles.css";
import { Cameo } from "./ui/art/Cameo";
import { Vignette, type Scene } from "./ui/art/Vignette";
import { Corners, Flourish, StateSeal } from "./ui/art/Ornament";

const SCENES: Scene[] = ["istanbul", "parlament", "bank", "anatolien", "wahlnacht"];

createRoot(document.getElementById("root")!).render(
  <div style={{ padding: 24, background: "#2b221b", minHeight: "100vh", display: "grid", gap: 20 }}>
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

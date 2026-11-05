import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Drei Schriftfamilien (Gestaltungsleitfaden, befund-H §5): Fraunces für Titel und große Zahlen, EB Garamond für Lese- und Datentext,
// Marcellus SC für Beschriftungen. Inter und Courier Prime werden nicht mehr geladen (Aktenvermerke stehen in Kapitälchen).
import "@fontsource-variable/fraunces";
import "@fontsource-variable/eb-garamond";
import "@fontsource/marcellus-sc/latin-400.css";
import "@fontsource/marcellus-sc/latin-ext-400.css";
import "./ui/styles.css";
import "./ui/fenster.css";
import { aktuelleSprache, ladeSprache } from "./i18n";

// Erst die Kataloge der gewählten Sprache laden, dann die App einlesen: Viele Module bilden ihre Texte schon beim Laden.
async function start() {
  const sprache = aktuelleSprache();
  await ladeSprache(sprache);
  document.documentElement.lang = sprache;
  const { App } = await import("./ui/App");
  // Gemeinsame Bauteile zuletzt: Sie legen Knöpfe und Abschnittstitel aller Akten fest (ENTSCHEIDUNGEN T)
  await import("./ui/akte/bauteile.css");
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void start();

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/eb-garamond";
import "@fontsource-variable/inter";
import "./ui/styles.css";
import "./ui/fenster.css";
import { aktuelleSprache, ladeSprache } from "./i18n";

// Erst die Kataloge der gewählten Sprache laden, dann die App einlesen: Viele Module bilden ihre Texte schon beim Laden.
async function start() {
  const sprache = aktuelleSprache();
  await ladeSprache(sprache);
  document.documentElement.lang = sprache;
  const { App } = await import("./ui/App");
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void start();

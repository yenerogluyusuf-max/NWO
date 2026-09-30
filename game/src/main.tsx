import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/eb-garamond";
import "@fontsource-variable/inter";
import "./ui/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

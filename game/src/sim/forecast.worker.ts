// Rechnet die „Folgen im Voraus“ in einem eigenen Thread, damit die Oberfläche nicht einfriert.
// Nachricht rein: { id, welt (JSON), aktion, metriken, monate, laeufe }; Nachricht raus: { id, ergebnis } oder { id, fehler }.

import { outlookMany, type Aktion, type Metric } from "./forecast";
import { load } from "./world";

interface Anfrage {
  id: number;
  welt: string;
  aktion: Aktion;
  metriken: Metric[];
  monate: number;
  laeufe: number;
}

const ctx = self as unknown as {
  onmessage: ((e: { data: Anfrage }) => void) | null;
  postMessage: (m: unknown) => void;
};

ctx.onmessage = (e) => {
  const { id, welt, aktion, metriken, monate, laeufe } = e.data;
  try {
    ctx.postMessage({ id, ergebnis: outlookMany(load(welt), aktion, metriken, monate, laeufe) });
  } catch (err) {
    ctx.postMessage({ id, fehler: String(err) });
  }
};

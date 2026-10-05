// Bewegungssprache, Teil 6: React-Anbindung der Effektstufe.

import { useSyncExternalStore } from "react";
import { abonniereEffekte, effektstufe, type Effektstufe } from "./effekte";

export function useEffektstufe(): Effektstufe {
  return useSyncExternalStore(abonniereEffekte, effektstufe, () => "mittel" as const);
}

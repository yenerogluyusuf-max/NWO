// Das Politiknetz ist statisch; nur sein Zustand gehört zum Spielstand.
// Eigene Datei, damit die Spielmodule das Netz kennen, ohne von world.ts abzuhängen.

import { buildModel, type NetModel } from "./netz";
import { EDGES, NODES } from "../data/politiknetz";

export const NET: NetModel = buildModel(NODES, EDGES);

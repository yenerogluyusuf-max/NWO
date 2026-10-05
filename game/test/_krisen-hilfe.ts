// Hilfe für Tests: Zahl der aktiven Krisen-Blocker eines Spielstands.
import type { World } from "../src/sim/types";

export const krisenAktiv = (w: World): number => w.spiel?.krisen?.length ?? 0;

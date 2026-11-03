import type { Zusage } from './spiel-typen';

/** Metadaten neuer Zusagen und die bisherigen festen Kennungen; keine Umbenennung alter Belege. */
export function wahlversprechenThema(z: Zusage): string | undefined {
  return z.wahlversprechen?.thema ?? /^z-wahl-(v_[a-z]+)(?:$|--)/.exec(z.id)?.[1];
}

export function freieWahlzusageId(zusagen: Zusage[], thema: string, amtszeit: number, wahltag: number): string {
  const basis = `z-wahl-${thema}`;
  if (!zusagen.some(z => z.id === basis)) return basis;
  const runde = `${basis}--${amtszeit}-${wahltag}`;
  let id = runde, n = 2;
  while (zusagen.some(z => z.id === id)) id = `${runde}-${n++}`;
  return id;
}

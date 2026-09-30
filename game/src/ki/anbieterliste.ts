// Die Sprachmodell-Anbieter, die das Spiel ansprechen kann. Ohne Browser-Abhängigkeiten, damit auch der Entwicklungsserver
// (vite.config.ts) dieselbe Liste benutzt: Er kennt daraus Adresse, Protokoll und die Umgebungsvariable des Schlüssels.
// Adressen und Modellnamen stammen aus der Dokumentation der Anbieter (Stand 30.09.2026); wo Modellnamen schnell veralten,
// steht kein Standard, und der Spieler trägt den Namen aus seinem Konto ein.

export type Protokoll = "anthropic" | "openai";

export interface ModellDef {
  id: string;
  name: string;
  hinweis: string;
}

export interface AnbieterDef {
  id: string;
  name: string;
  protokoll: Protokoll;
  /** Adresse bis vor den Pfad (`/messages` oder `/chat/completions`), ohne Schrägstrich am Ende */
  basis: string;
  /** Umgebungsvariable des Schlüssels auf dem Entwicklungsserver (game/.env.local) */
  envVar?: string;
  /** So beginnen die Schlüssel dieses Anbieters, soweit bekannt (nur für Warnungen) */
  praefix?: string;
  modelle: ModellDef[];
  /** Vorbelegtes Modell; leer, wenn der Spieler es aus seinem Konto eintragen soll */
  standardModell: string;
  /** Platzhalter im Eingabefeld, wenn es keine Auswahlliste gibt */
  modellBeispiel?: string;
  /** Bei manchen Modellen heißt das Feld max_completion_tokens */
  tokenFeld: "max_tokens" | "max_completion_tokens";
  /** Zusätzliche Felder in der Anfrage (etwa das Denken abschalten) */
  extra?: Record<string, unknown>;
  /** Temperatur der Anfrage; `null` sendet keine (manche Modelle erlauben nur den Standard) */
  temperatur: number | null;
  /** Der Spieler trägt die Adresse selbst ein */
  eigeneUrl?: boolean;
  /** Läuft auf diesem Rechner, braucht keinen Schlüssel */
  lokal?: boolean;
  /** Ein Satz: wofür der Anbieter steht und woran man den Schlüssel erkennt */
  hinweis: string;
}

export const ANBIETER: AnbieterDef[] = [
  {
    id: "anthropic",
    name: "Claude (Anthropic)",
    protokoll: "anthropic",
    basis: "https://api.anthropic.com/v1",
    envVar: "ANTHROPIC_API_KEY",
    praefix: "sk-ant-",
    modelle: [
      { id: "claude-sonnet-5-5", name: "Claude Sonnet 5.5", hinweis: "Standard: gutes Verständnis, mittlere Kosten" },
      { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", hinweis: "schnell und günstig" },
      { id: "claude-opus-5-5", name: "Claude Opus 5.5", hinweis: "am stärksten, am teuersten" },
    ],
    standardModell: "claude-sonnet-5-5",
    tokenFeld: "max_tokens",
    temperatur: null,
    hinweis: "Schlüssel beginnen mit „sk-ant-“. Der feste Regeltext wird zwischengespeichert, das spart Kosten.",
  },
  {
    id: "mimo",
    name: "Xiaomi MiMo",
    protokoll: "openai",
    basis: "https://api.xiaomimimo.com/v1",
    envVar: "MIMO_API_KEY",
    modelle: [
      { id: "mimo-v2.6-flash", name: "MiMo V2.6 Flash", hinweis: "schnell und günstig" },
      { id: "mimo-v2.6-pro", name: "MiMo V2.6 Pro", hinweis: "stärker, langsamer" },
      { id: "mimo-v2.5-pro", name: "MiMo V2.5 Pro", hinweis: "Vorgänger, stark" },
      { id: "mimo-v2.5", name: "MiMo V2.5", hinweis: "Vorgänger" },
    ],
    standardModell: "mimo-v2.6-flash",
    tokenFeld: "max_completion_tokens",
    // Ohne Denkphase kommt die Antwort schneller und kostet weniger; nur so gilt auch die Temperatur
    extra: { thinking: { type: "disabled" } },
    temperatur: 0.3,
    hinweis: "Schlüssel aus der MiMo-Plattform (api.xiaomimimo.com). Das Denken ist abgeschaltet, damit die Antworten schnell kommen.",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    protokoll: "openai",
    basis: "https://api.deepseek.com",
    envVar: "DEEPSEEK_API_KEY",
    modelle: [
      { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", hinweis: "schnell und sehr günstig" },
      { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", hinweis: "stärker, langer Kontext" },
    ],
    standardModell: "deepseek-v4-flash",
    tokenFeld: "max_tokens",
    temperatur: 0.3,
    hinweis: "Die älteren Namen deepseek-chat und deepseek-reasoner laufen laut Anbieter am 24. Juli 2026 aus.",
  },
  {
    id: "openai",
    name: "OpenAI",
    protokoll: "openai",
    basis: "https://api.openai.com/v1",
    envVar: "OPENAI_API_KEY",
    praefix: "sk-",
    modelle: [],
    standardModell: "",
    modellBeispiel: "Modellname wie in Ihrem OpenAI-Konto",
    tokenFeld: "max_completion_tokens",
    temperatur: null,
    hinweis: "Tragen Sie den Modellnamen aus Ihrem Konto ein; Schlüssel beginnen mit „sk-“.",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    protokoll: "openai",
    basis: "https://generativelanguage.googleapis.com/v1beta/openai",
    envVar: "GEMINI_API_KEY",
    praefix: "AIza",
    modelle: [],
    standardModell: "",
    modellBeispiel: "z. B. gemini-3-flash (laut Google AI Studio prüfen)",
    tokenFeld: "max_tokens",
    temperatur: 0.3,
    hinweis: "Schlüssel aus Google AI Studio, sie beginnen mit „AIza“. Modellnamen ändert Google häufig: den aktuellen Namen dort nachsehen.",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    protokoll: "openai",
    basis: "https://openrouter.ai/api/v1",
    envVar: "OPENROUTER_API_KEY",
    praefix: "sk-or-",
    modelle: [],
    standardModell: "",
    modellBeispiel: "Anbieter/Modell, wie auf openrouter.ai gelistet",
    tokenFeld: "max_tokens",
    temperatur: 0.3,
    hinweis: "Ein Schlüssel für viele Modelle verschiedener Anbieter; Schlüssel beginnen mit „sk-or-“.",
  },
  {
    id: "mistral",
    name: "Mistral",
    protokoll: "openai",
    basis: "https://api.mistral.ai/v1",
    envVar: "MISTRAL_API_KEY",
    modelle: [],
    standardModell: "",
    modellBeispiel: "Modellname wie in Ihrem Mistral-Konto",
    tokenFeld: "max_tokens",
    temperatur: 0.3,
    hinweis: "Europäischer Anbieter; den Modellnamen aus Ihrem Konto eintragen.",
  },
  {
    id: "eigen",
    name: "Anderer OpenAI-kompatibler Dienst",
    protokoll: "openai",
    basis: "",
    envVar: "KI_EIGEN_API_KEY",
    modelle: [],
    standardModell: "",
    modellBeispiel: "Modellname des Dienstes",
    tokenFeld: "max_tokens",
    temperatur: 0.3,
    eigeneUrl: true,
    hinweis: "Jeder Dienst mit dem Chat-Format von OpenAI (POST …/chat/completions): Adresse bis vor „/chat/completions“, Schlüssel, Modellname.",
  },
  {
    id: "lokal",
    name: "Lokaler Server (kostenlos)",
    protokoll: "openai",
    basis: "http://127.0.0.1:18127/v1",
    modelle: [],
    standardModell: "local",
    modellBeispiel: "local",
    tokenFeld: "max_tokens",
    temperatur: 0.3,
    eigeneUrl: true,
    lokal: true,
    hinweis: "llama.cpp, Ollama oder LM Studio auf diesem Rechner. Kostet nichts, verlässt den Rechner nicht.",
  },
];

export const ANBIETER_NACH_ID: Record<string, AnbieterDef> = Object.fromEntries(ANBIETER.map((a) => [a.id, a]));

export const anbieterDef = (id: string): AnbieterDef | undefined => ANBIETER_NACH_ID[id];

/** Erkennt den Anbieter an der Form des Schlüssels, soweit sie eindeutig ist; sonst `undefined`. */
export function erkenneAnbieter(schluessel: string): string | undefined {
  const s = schluessel.trim();
  if (s.startsWith("sk-ant-")) return "anthropic";
  if (s.startsWith("sk-or-")) return "openrouter";
  if (s.startsWith("AIza")) return "gemini";
  return undefined;
}

/** Ein Hinweis, wenn ein Schlüssel offensichtlich nicht zu dem Anbieter gehört, unter dem er steht. */
export function schluesselWarnung(anbieterId: string, schluessel: string): string | null {
  const s = schluessel.trim();
  const a = ANBIETER_NACH_ID[anbieterId];
  if (!s || !a) return null;
  if (/\s/.test(s)) return "Der Schlüssel enthält Leerzeichen oder Zeilenumbrüche; bitte nur den Schlüssel selbst einfügen.";
  const echt = erkenneAnbieter(s);
  if (echt && echt !== anbieterId) return `Das sieht nach einem Schlüssel von ${ANBIETER_NACH_ID[echt]!.name} aus, nicht von ${a.name}. Wählen Sie oben den passenden Anbieter.`;
  if (a.praefix && !s.startsWith(a.praefix) && (anbieterId === "anthropic" || anbieterId === "gemini" || anbieterId === "openrouter")) {
    return `${a.name}-Schlüssel beginnen mit „${a.praefix}“. Dieser nicht: Gehört er zu einem anderen Anbieter (etwa Xiaomi MiMo, DeepSeek oder OpenAI), wählen Sie oben diesen aus.`;
  }
  return null;
}

/** Das Ziel einer Anfrage: Adresse des Endpunkts für Anbieter und Adresse. */
export function endpunkt(a: AnbieterDef, eigeneUrl?: string): string {
  const basis = (a.eigeneUrl ? (eigeneUrl && eigeneUrl.trim() ? eigeneUrl.trim() : a.basis) : a.basis).replace(/\/+$/, "");
  return `${basis}${a.protokoll === "anthropic" ? "/messages" : "/chat/completions"}`;
}

/** Ob ein Host nach einem privaten oder lokalen Ziel aussieht; der Entwicklungsserver leitet dorthin nichts weiter. */
export function istPrivaterHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".localhost")) return true;
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) return true;
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(h);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

import en from '../../content/i18n/en.json';
import es from '../../content/i18n/es.json';
import pt from '../../content/i18n/pt.json';

/**
 * Textos del juego en cada idioma (content/i18n/<idioma>.json). El inglés es el idioma principal
 * de la app (el que se usa por defecto y como respaldo de los textos de interfaz). Los nombres
 * de categorías y objetos en español salen de categorias_thiings.json y los de los demás
 * idiomas de content/i18n/catalog.<idioma>.json (ver catalog.ts).
 */
export const LANGS = [
  { id: 'en', label: 'English', flag: '🇺🇸' },
  { id: 'es', label: 'Español', flag: '🇪🇸' },
  { id: 'pt', label: 'Português', flag: '🇧🇷' },
] as const;

export type Lang = (typeof LANGS)[number]['id'];

/** Política de privacidad de AndreGames (por ahora solo existe en español). */
export const PRIVACY_URL = 'https://andregames.co/privacidad';
export const DEFAULT_LANG: Lang = 'en';

type UiTexts = typeof en.ui;
export type UiKey = keyof UiTexts;

export interface Texts {
  difficulty: Record<string, { label: string; description: string }>;
  categories: Record<string, string>;
  items: Record<string, string>;
}

const UI: Record<Lang, { ui: UiTexts; difficulty: Texts['difficulty'] }> = { es, en, pt };

const KEY = 'clasifica-lang';
const isLang = (v: unknown): v is Lang => LANGS.some((l) => l.id === v);

function loadLang(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (isLang(v)) return v;
  } catch {
    /* almacenamiento no disponible */
  }
  return DEFAULT_LANG;
}

let current: Lang = loadLang();
if (typeof document !== 'undefined') document.documentElement.lang = current;

export const getLang = () => current;

/** Cambia el idioma y lo recuerda. Solo se cambia desde el inicio: los niveles se traducen al empezar. */
export function setLang(lang: Lang) {
  current = lang;
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* ignorar */
  }
}

/** Texto de la interfaz en el idioma actual; `{n}` y similares se reemplazan con `vars`. */
export function t(key: UiKey, vars: Record<string, string | number> = {}): string {
  const s = UI[current].ui[key] ?? UI[DEFAULT_LANG].ui[key];
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Textos de las dificultades en el idioma actual (las categorías y objetos los completa catalog.ts). */
export const baseTexts = (): Texts => ({ difficulty: UI[current].difficulty, categories: {}, items: {} });

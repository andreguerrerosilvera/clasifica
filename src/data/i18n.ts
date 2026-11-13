import es from '../../content/i18n/es.json';

/**
 * Textos del juego. Para otro idioma: agregar content/i18n/<idioma>.json y elegirlo aquí.
 * Los nombres de categorías y objetos salen del catálogo (ver catalogTexts en catalog.ts).
 */
export interface Texts {
  difficulty: Record<string, { label: string; description: string }>;
  categories: Record<string, string>;
  items: Record<string, string>;
}

export const texts: Texts = { ...es, categories: {}, items: {} };

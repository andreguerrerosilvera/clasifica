import es from '../../content/i18n/es.json';

/** Textos del juego. Para otro idioma: agregar content/i18n/<idioma>.json y elegirlo aquí. */
export interface Texts {
  difficulty: Record<string, { label: string; description: string }>;
  levels: Record<string, { title: string; subtitle: string }>;
  categories: Record<string, string>;
  items: Record<string, string>;
}

export const texts: Texts = es;

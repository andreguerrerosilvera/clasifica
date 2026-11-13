import thiingsJson from '../../content/categorias_thiings.json';
import catalogEn from '../../content/i18n/catalog.en.json';
import catalogPt from '../../content/i18n/catalog.pt.json';
import type { Catalog } from '../logic/levelGen';
import { itemKey } from '../logic/generator';
import { type Lang, type Texts, baseTexts, getLang } from './i18n';

/** Formato de content/categorias_thiings.json (catálogo armado con los gráficos de thiings.co). */
interface ThiingsFile {
  categorias: {
    categoria: string;
    objetos: { nombre: string; slug: string }[];
  }[];
}

/** Id estable de una categoría a partir de su nombre: "Bebé" → "bebe". */
export const categoryId = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

/** Imagen optimizada local de un objeto (la genera `npm run images` en public/thiings/). */
const BASE_URL: string = import.meta.env?.BASE_URL ?? '/';
export const imagePath = (slug: string) => `${BASE_URL}thiings/${slug}.webp`;

const fail = (msg: string): never => {
  throw new Error(`[content] categorias_thiings.json: ${msg}`);
};

/**
 * Catálogo de generación y sus textos. Cada objeto usa su slug de thiings.co como id
 * y la ruta de su imagen local en el campo `emoji` (la carta la dibuja como imagen).
 */
function buildCatalog(file: ThiingsFile) {
  const catalog: Catalog = {};
  const categories: Record<string, string> = {};
  const items: Record<string, string> = {};
  for (const c of file.categorias) {
    const id = categoryId(c.categoria);
    if (catalog[id]) fail(`categoría repetida: ${c.categoria}`);
    const seen = new Set<string>();
    for (const o of c.objetos) {
      if (seen.has(o.slug)) fail(`objeto repetido en ${c.categoria}: ${o.slug}`);
      seen.add(o.slug);
      items[itemKey(id, o.slug)] = o.nombre;
    }
    const objs = c.objetos.map((o) => ({ id: o.slug, emoji: imagePath(o.slug) }));
    catalog[id] = { icon: objs[0]?.emoji ?? '', items: objs };
    categories[id] = c.categoria;
  }
  return { catalog, categories, items };
}

const built = buildCatalog(thiingsJson as ThiingsFile);

export const CATALOG: Catalog = built.catalog;

/** Traducciones del catálogo: nombre de cada categoría (por id) y de cada carta (por `categoria.slug`). */
interface CatalogTranslation {
  categories: Record<string, string>;
  items: Record<string, string>;
}
const TRANSLATIONS: Partial<Record<Lang, CatalogTranslation>> = { en: catalogEn, pt: catalogPt };

/**
 * Textos del juego en el idioma actual. En español los nombres vienen del propio catálogo; en los
 * demás idiomas, de su traducción (si faltara alguno, se usa el español).
 */
const textsCache: Partial<Record<Lang, Texts>> = {};
export function catalogTexts(): Texts {
  const lang = getLang();
  const tr = TRANSLATIONS[lang];
  return (textsCache[lang] ??= {
    ...baseTexts(),
    categories: { ...built.categories, ...tr?.categories },
    items: { ...built.items, ...tr?.items },
  });
}

/**
 * Pares de categorías que comparten algún objeto: no pueden salir juntas, porque esa carta
 * encajaría en las dos.
 */
export function sharedItemConflicts(catalog: Catalog): [string, string][] {
  const ids = Object.keys(catalog);
  const sets = ids.map((id) => new Set(catalog[id].items.map((i) => i.id)));
  const out: [string, string][] = [];
  for (let a = 0; a < ids.length; a++)
    for (let b = a + 1; b < ids.length; b++)
      if ([...sets[a]].some((slug) => sets[b].has(slug))) out.push([ids[a], ids[b]]);
  return out;
}

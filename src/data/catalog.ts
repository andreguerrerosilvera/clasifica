import thiingsJson from '../../content/categorias_thiings.json';
import type { Catalog } from '../logic/levelGen';
import { itemKey } from '../logic/generator';
import type { Texts } from './i18n';

/** Formato de content/categorias_thiings.json (catálogo armado con los gráficos de thiings.co). */
interface ThiingsFile {
  categorias: {
    categoria: string;
    objetos: { nombre: string; slug: string; imagen: string }[];
  }[];
}

/** Id estable de una categoría a partir de su nombre: "Bebé" → "bebe". */
export const categoryId = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

const fail = (msg: string): never => {
  throw new Error(`[content] categorias_thiings.json: ${msg}`);
};

/**
 * Catálogo de generación y sus textos. Cada objeto usa su slug de thiings.co como id
 * y la URL de su imagen en el campo `emoji` (la carta la dibuja como imagen).
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
    catalog[id] = { icon: c.objetos[0]?.imagen ?? '', items: c.objetos.map((o) => ({ id: o.slug, emoji: o.imagen })) };
    categories[id] = c.categoria;
  }
  return { catalog, categories, items };
}

const built = buildCatalog(thiingsJson as ThiingsFile);

export const CATALOG: Catalog = built.catalog;

/** Textos de categorías y objetos del catálogo (los nombres vienen del propio JSON). */
export const catalogTexts = (base: Texts): Texts => ({ ...base, categories: built.categories, items: built.items });

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

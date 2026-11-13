import type { DifficultyDef, DifficultyId, LevelDef, RawLevel } from '../models/types';
import { Difficulty } from '../models/types';
import { CATEGORY_COL, COLS, MIN_CATEGORIES } from '../logic/rules';
import { itemKey } from '../logic/generator';
import type { Texts } from './i18n';

export type { RawLevel };

export type RawDifficulties = Record<string, { openSlots: number }>;

const DIFFICULTY_IDS = Object.values(Difficulty) as string[];

const fail = (file: string, msg: string): never => {
  throw new Error(`[content] ${file}: ${msg}`);
};

/** Comprueba que el tablero fijo contiene cada carta exactamente una vez. */
export function validateLayout(raw: RawLevel, file: string) {
  const layout = raw.layout;
  if (!layout) return fail(file, 'falta "layout"');
  if (layout.columns.length !== COLS) fail(file, `"layout.columns" debe tener ${COLS} columnas`);
  if (layout.columns[CATEGORY_COL].length) fail(file, `la columna ${CATEGORY_COL} (central) debe ir vacía`);

  const expected = new Set(raw.categories.flatMap((c) => c.items.map((i) => itemKey(c.id, i.id))));
  const seen = new Set<string>();
  for (const key of layout.columns.flat()) {
    if (!expected.has(key)) fail(file, `"layout.columns" referencia una carta que no existe: ${key}`);
    if (seen.has(key)) fail(file, `carta repetida en "layout.columns": ${key}`);
    seen.add(key);
  }
  for (const key of expected) if (!seen.has(key)) fail(file, `falta la carta ${key} en "layout.columns"`);
  for (const key of layout.hidden) if (!expected.has(key)) fail(file, `"layout.hidden" referencia ${key}, que no existe`);

  const catIds = raw.categories.map((c) => c.id);
  const order = layout.categoryOrder;
  if (order.length !== catIds.length || !catIds.every((id) => order.includes(id)))
    fail(file, '"layout.categoryOrder" debe contener cada categoría exactamente una vez');
}

/** Valida un nivel generado y lo completa con sus textos traducidos. */
export function resolveLevel(raw: RawLevel, file: string, t: Texts): LevelDef {
  if (!Number.isInteger(raw.id) || raw.id < 1) fail(file, '"id" debe ser un entero positivo');
  if (!DIFFICULTY_IDS.includes(raw.difficulty))
    fail(file, `"difficulty" debe ser uno de: ${DIFFICULTY_IDS.join(', ')} (recibido: ${raw.difficulty})`);
  if (!Number.isInteger(raw.moves) || raw.moves < 1) fail(file, '"moves" debe ser un entero positivo');
  if ((raw.categories?.length ?? 0) < MIN_CATEGORIES)
    fail(file, `el nivel debe tener al menos ${MIN_CATEGORIES} categorías distintas (tiene ${raw.categories?.length ?? 0})`);

  const catIds = new Set<string>();
  const text = <T,>(value: T | undefined, what: string): T => value ?? fail(file, `falta la traducción de ${what}`);
  const categories = raw.categories.map((c) => {
    if (catIds.has(c.id)) fail(file, `categoría repetida: ${c.id}`);
    catIds.add(c.id);
    if (!c.items?.length) fail(file, `la categoría ${c.id} no tiene items`);
    const ids = new Set<string>();
    return {
      id: c.id,
      icon: c.icon,
      name: text(t.categories[c.id], `categories.${c.id}`),
      items: c.items.map((i) => {
        if (ids.has(i.id)) fail(file, `item repetido en ${c.id}: ${i.id}`);
        ids.add(i.id);
        return { id: i.id, emoji: i.emoji, name: text(t.items[itemKey(c.id, i.id)], `items.${itemKey(c.id, i.id)}`) };
      }),
    };
  });

  validateLayout(raw, file);
  return {
    id: raw.id,
    title: `Nivel ${raw.id}`,
    difficulty: raw.difficulty as DifficultyId,
    moves: raw.moves,
    categories,
    layout: raw.layout!,
  };
}

export function resolveDifficulties(raw: RawDifficulties, t: Texts): Record<DifficultyId, DifficultyDef> {
  const out = {} as Record<DifficultyId, DifficultyDef>;
  for (const id of DIFFICULTY_IDS as DifficultyId[]) {
    const params = raw[id] ?? fail('difficulties.json', `falta la dificultad ${id}`);
    const label = t.difficulty[id] ?? fail('i18n', `falta difficulty.${id}`);
    out[id] = { id, label: label.label, description: label.description, openSlots: params.openSlots };
  }
  return out;
}

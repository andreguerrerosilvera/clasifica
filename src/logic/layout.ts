import type { CategoryDef, DifficultyDef, LevelDef, LevelLayout } from '../models/types';
import { hasAnyMove } from './board';
import { createLevel, itemKey } from './generator';
import { mulberry32, shuffle } from './rng';
import { COLS, ITEM_COLS } from './rules';
import { solve } from './solver';

export interface LayoutOptions {
  seed: number;
  /** proporción de cartas "?" (0 a 0.45) */
  hiddenRatio: number;
  /** moves = pasos del solver × margin */
  margin: number;
  attempts?: number;
}

/**
 * Mezcla las cartas en un tablero y comprueba con el solver que tenga solución.
 * Devuelve el tablero y los movimientos, o null si no encontró ninguno resoluble.
 */
export function buildLayout(
  categories: CategoryDef[],
  diff: DifficultyDef,
  { seed, hiddenRatio, margin, attempts = 600 }: LayoutOptions,
): { layout: LevelLayout; moves: number } | null {
  const ratio = Math.min(0.45, Math.max(0, hiddenRatio));
  const keys = categories.flatMap((c) => c.items.map((i) => itemKey(c.id, i.id)));
  const totalItems = keys.length;

  let fallback: { layout: LevelLayout; moves: number } | null = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const rnd = mulberry32(seed + attempt * 31);
    const order = shuffle(keys, rnd);
    const hidden = order.filter(() => rnd() < ratio);
    const categoryOrder = shuffle(
      categories.map((c) => c.id),
      rnd,
    );
    const columns: string[][] = Array.from({ length: COLS }, () => []);
    order.forEach((k, i) => columns[ITEM_COLS[i % ITEM_COLS.length]].push(k));
    const layout = { columns, hidden, categoryOrder };

    const level: LevelDef = { id: 0, title: '', difficulty: diff.id, moves: 1, categories, layout };
    const state = createLevel(level, diff);
    if (!hasAnyMove(state)) continue;
    const steps = solve(state);
    if (steps === null) continue;
    const candidate = { layout, moves: Math.ceil(steps * margin) };
    // Evita tableros triviales: preferimos los que exigen algo de bandeja.
    if (steps > totalItems || attempt > attempts / 3) return candidate;
    fallback ??= candidate;
  }
  return fallback;
}

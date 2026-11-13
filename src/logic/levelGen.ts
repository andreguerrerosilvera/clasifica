import type { DifficultyDef, DifficultyId, RawLevel } from '../models/types';
import { buildLayout } from './layout';
import { mulberry32, shuffle } from './rng';
import { MIN_CATEGORIES } from './rules';

/** Catálogo de categorías (se arma desde content/categorias_thiings.json): id → icono y objetos. `emoji` puede ser una URL de imagen. */
export type Catalog = Record<string, { icon: string; items: { id: string; emoji: string }[] }>;

type Range = [number, number];

/** Parámetros de generación (content/generation.json). */
export interface GenerationConfig {
  /** dificultad de los primeros niveles, uno por nivel (arranque suave) */
  introDifficulties: DifficultyId[];
  /** dificultad de los niveles siguientes, en ciclo según su número */
  difficultyCycle: DifficultyId[];
  difficulties: Record<DifficultyId, { categories: Range; itemsPerCategory: Range; hidden: Range; margin: number }>;
  /** tope de cartas en el tablero (4 columnas de objetos) */
  maxItems: number;
  /** pares de categorías que no pueden salir juntas porque alguna carta encajaría en las dos */
  conflicts: [string, string][];
}

const between = (rnd: () => number, [min, max]: Range) => min + Math.floor(rnd() * (max - min + 1));

export function difficultyForLevel(id: number, cfg: GenerationConfig): DifficultyId {
  const intro = cfg.introDifficulties;
  if (id <= intro.length) return intro[id - 1];
  return cfg.difficultyCycle[(id - intro.length - 1) % cfg.difficultyCycle.length];
}

/** Elige categorías al azar evitando los pares en conflicto. */
function pickCategories(rnd: () => number, catalog: Catalog, cfg: GenerationConfig, count: number): string[] {
  const clash = (a: string, b: string) => cfg.conflicts.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const picked: string[] = [];
  for (const id of shuffle(Object.keys(catalog), rnd)) {
    if (picked.length === count) break;
    if (catalog[id].items.length < 4) continue;
    if (picked.some((p) => clash(p, id))) continue;
    picked.push(id);
  }
  return picked;
}

/**
 * Crea un nivel nuevo combinando categorías del catálogo y le arma un tablero resoluble.
 * Con la misma semilla genera siempre el mismo nivel.
 */
export function generateLevel(
  id: number,
  seed: number,
  catalog: Catalog,
  cfg: GenerationConfig,
  diff: DifficultyDef,
): RawLevel {
  const params = cfg.difficulties[diff.id];
  for (let attempt = 0; attempt < 20; attempt++) {
    const rnd = mulberry32(seed + attempt * 7919);
    const catIds = pickCategories(rnd, catalog, cfg, between(rnd, params.categories));
    if (catIds.length < MIN_CATEGORIES) continue;

    // Objetos por categoría, sin pasar del tope de cartas del tablero.
    const counts = catIds.map((cid) => Math.min(between(rnd, params.itemsPerCategory), catalog[cid].items.length));
    while (counts.reduce((a, b) => a + b, 0) > cfg.maxItems) counts[counts.indexOf(Math.max(...counts))]--;
    const categories = catIds.map((cid, i) => ({
      id: cid,
      icon: catalog[cid].icon,
      items: shuffle(catalog[cid].items, rnd).slice(0, counts[i]),
    }));

    const hiddenRatio = params.hidden[0] + rnd() * (params.hidden[1] - params.hidden[0]);
    const defs = categories.map((c) => ({ ...c, name: c.id, items: c.items.map((i) => ({ ...i, name: i.id })) }));
    const built = buildLayout(defs, diff, { seed: seed + attempt, hiddenRatio, margin: params.margin, attempts: 300 });
    if (!built) continue;
    return { id, difficulty: diff.id, moves: built.moves, categories, layout: built.layout };
  }
  throw new Error(`[generación] no se pudo crear un tablero resoluble para el nivel ${id}`);
}

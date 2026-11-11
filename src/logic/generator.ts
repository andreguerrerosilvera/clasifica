import type { Card, DifficultyDef, GameState, LevelDef } from '../models/types';
import { CATEGORY_SLOTS, TRAY_SIZE } from './rules';

/** Id de carta de un objeto: `categoria.item` (así se referencia en el layout). */
export const itemKey = (catId: string, itemId: string) => `${catId}.${itemId}`;

/** Construye el estado inicial de un nivel a partir de su tablero fijo (sin aleatoriedad). */
export function createLevel(level: LevelDef, diff: DifficultyDef): GameState {
  const totals: Record<string, number> = {};
  const progress: Record<string, number> = {};
  const lastItem: Record<string, Card | null> = {};
  const items = new Map<string, Card>();
  const categoryCards = new Map<string, Card>();
  for (const cat of level.categories) {
    totals[cat.id] = cat.items.length;
    progress[cat.id] = 0;
    lastItem[cat.id] = null;
    categoryCards.set(cat.id, {
      id: `cat-${cat.id}`,
      kind: 'category',
      cat: cat.id,
      emoji: cat.icon,
      label: cat.name,
      hidden: false,
    });
    for (const it of cat.items) {
      const id = itemKey(cat.id, it.id);
      items.set(id, { id, kind: 'item', cat: cat.id, emoji: it.emoji, label: it.name, hidden: false });
    }
  }

  const hidden = new Set(level.layout.hidden);
  const columns = level.layout.columns.map((col) => col.map((key) => ({ ...items.get(key)!, hidden: hidden.has(key) })));
  const cats = level.layout.categoryOrder.map((id) => categoryCards.get(id)!);

  return {
    levelId: level.id,
    difficulty: level.difficulty,
    columns,
    categories: cats.slice(0, CATEGORY_SLOTS),
    pending: cats.slice(CATEGORY_SLOTS),
    tray: Array(TRAY_SIZE).fill(null),
    openSlots: diff.openSlots,
    progress,
    totals,
    lastItem,
    moves: level.moves,
    startMoves: level.moves,
    totalItems: items.size,
    placedCount: 0,
    bonusUnlocked: false,
    status: 'playing',
  };
}

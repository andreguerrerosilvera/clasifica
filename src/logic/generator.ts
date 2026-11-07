import type { Card, DifficultyDef, GameState, LevelDef } from '../models/types';
import { hasAnyMove, moveToTray, placeItem, remainingCards } from './board';
import { findHint } from './hints';
import { mulberry32, shuffle } from './rng';
import { CATEGORY_SLOTS, COLS, ITEM_COLS, TRAY_SIZE } from './rules';

/** Resuelve el nivel con una estrategia voraz; devuelve los movimientos usados o null. */
export function solve(start: GameState): number | null {
  let s: GameState = { ...structuredClone(start), moves: 10_000 };
  let steps = 0;
  while (steps < 600) {
    if (remainingCards(s) === 0) return steps;
    const hint = findHint(s);
    if (!hint) return null;
    const next = hint.target === 'tray' ? moveToTray(s, hint.itemId) : placeItem(s, hint.itemId)?.state;
    if (!next) return null;
    s = next;
    steps++;
  }
  return null;
}

export function createLevel(level: LevelDef, diff: DifficultyDef): GameState {
  const diffIndex = ['facil', 'normal', 'dificil'].indexOf(diff.id);
  const hiddenRatio = Math.min(0.45, level.hiddenRatio * diff.hiddenFactor);
  const totals: Record<string, number> = {};
  const progress: Record<string, number> = {};
  const lastItem: Record<string, Card | null> = {};
  const base: Card[] = [];
  const allCategories: Card[] = [];
  for (const cat of level.categories) {
    totals[cat.id] = cat.items.length;
    progress[cat.id] = 0;
    lastItem[cat.id] = null;
    allCategories.push({ id: `cat-${cat.id}`, kind: 'category', cat: cat.id, emoji: cat.icon, label: cat.name, hidden: false });
    cat.items.forEach((it, i) =>
      base.push({ id: `${cat.id}-${i}`, kind: 'item', cat: cat.id, emoji: it.emoji, label: it.name, hidden: false }),
    );
  }
  const totalItems = base.length;

  let fallback: GameState | null = null;
  for (let attempt = 0; attempt < 600; attempt++) {
    const rnd = mulberry32(level.seed * 7919 + diffIndex * 104729 + attempt * 31);
    const order = shuffle(base, rnd).map((c) => ({
      ...c,
      hidden: c.kind === 'item' && rnd() < hiddenRatio,
    }));
    const cats = shuffle(allCategories, rnd);
    const columns: Card[][] = Array.from({ length: COLS }, () => []);
    order.forEach((c, i) => columns[ITEM_COLS[i % ITEM_COLS.length]].push(c));

    const s: GameState = {
      levelId: level.id,
      difficulty: diff.id,
      columns,
      categories: cats.slice(0, CATEGORY_SLOTS),
      pending: cats.slice(CATEGORY_SLOTS),
      tray: Array(TRAY_SIZE).fill(null),
      openSlots: diff.openSlots,
      progress: { ...progress },
      totals,
      lastItem: { ...lastItem },
      moves: 0,
      startMoves: 0,
      totalItems,
      placedCount: 0,
      bonusUnlocked: false,
      status: 'playing',
    };
    // Al inicio debe haber alguna jugada directa.
    if (!hasAnyMove(s)) continue;

    const steps = solve(s);
    if (steps === null) continue;
    const moves = Math.ceil(steps * diff.moveFactor);
    const ready = { ...s, moves, startMoves: moves };
    // Evita tableros triviales: preferimos los que exigen algo de bandeja.
    if (steps > totalItems || attempt > 200) return ready;
    fallback ??= ready;
  }
  if (fallback) return fallback;
  throw new Error(`No se pudo generar el nivel ${level.id}`);
}

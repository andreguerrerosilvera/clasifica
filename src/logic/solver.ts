import type { GameState } from '../models/types';
import { moveToTray, placeItem, remainingCards } from './board';
import { findHint } from './hints';

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

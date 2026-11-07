import type { Card, GameState, Location } from '../models/types';
import { BONUS_COL, BONUS_MOVES, COLS, ROWS, TRAY_SIZE } from './rules';

const clone = <T,>(v: T): T => structuredClone(v);

/* ------------------------------------------------------------------ */
/* Consultas                                                          */
/* ------------------------------------------------------------------ */

export const visibleRows = (s: GameState, col: number) =>
  col === BONUS_COL && !s.bonusUnlocked ? ROWS - 1 : ROWS;

export const visibleCards = (s: GameState, col: number) =>
  s.columns[col].slice(0, visibleRows(s, col));

export function locate(s: GameState, id: string): Location | null {
  for (let col = 0; col < s.columns.length; col++) {
    const vis = visibleRows(s, col);
    const idx = s.columns[col].findIndex((c) => c.id === id);
    if (idx !== -1 && idx < vis) return { where: 'board', col, idx, card: s.columns[col][idx] };
  }
  const slot = s.tray.findIndex((c) => c?.id === id);
  if (slot !== -1) return { where: 'tray', slot, card: s.tray[slot]! };
  return null;
}

/** Carta de categoría revelada para `cat`, si está en su casilla */
export function activeCategory(s: GameState, cat: string): Card | null {
  return s.categories.find((c) => c?.cat === cat) ?? null;
}

export const canPlace = (s: GameState, card: Card) =>
  card.kind === 'item' && !card.hidden && activeCategory(s, card.cat) !== null;

export const freeTraySlot = (s: GameState) => {
  for (let i = 0; i < s.openSlots; i++) if (!s.tray[i]) return i;
  return -1;
};

/** Cartas de objeto que el jugador puede tocar en el tablero */
export function pickableBoardItems(s: GameState): Card[] {
  const out: Card[] = [];
  for (let col = 0; col < COLS; col++)
    for (const c of visibleCards(s, col)) if (c.kind === 'item' && !c.hidden) out.push(c);
  return out;
}

export function hasAnyMove(s: GameState): boolean {
  if (s.tray.some((c) => c && canPlace(s, c))) return true;
  const items = pickableBoardItems(s);
  if (items.some((c) => canPlace(s, c))) return true;
  return items.length > 0 && freeTraySlot(s) !== -1;
}

export const remainingCards = (s: GameState) =>
  s.columns.reduce((n, c) => n + c.length, 0) + s.tray.filter(Boolean).length;

/* ------------------------------------------------------------------ */
/* Mutaciones (sobre una copia)                                        */
/* ------------------------------------------------------------------ */

function removeFromBoard(s: GameState, col: number, idx: number): Card {
  const column = s.columns[col];
  const [removed] = column.splice(idx, 1);
  // Revela las cartas "?" vecinas: izquierda, derecha, debajo y la que cae al hueco.
  const reveal = (c: number, i: number) => {
    if (c < 0 || c >= COLS || i < 0) return;
    const card = s.columns[c][i];
    if (card && i < visibleRows(s, c)) card.hidden = false;
  };
  reveal(col - 1, idx);
  reveal(col + 1, idx);
  reveal(col, idx);
  reveal(col, idx - 1);
  return removed;
}

function evaluate(s: GameState) {
  if (remainingCards(s) === 0) s.status = 'won';
  else if (s.moves <= 0) s.status = 'lost';
  else if (!hasAnyMove(s)) s.status = 'stuck';
  else s.status = 'playing';
}

export interface PlaceResult {
  state: GameState;
  completedCategory: Card | null;
}

/** Coloca una carta (del tablero o la bandeja) en su categoría. */
export function placeItem(prev: GameState, id: string, spendMove = true): PlaceResult | null {
  const s = clone(prev);
  const loc = locate(s, id);
  if (!loc || !canPlace(s, loc.card)) return null;
  const card = loc.where === 'board' ? removeFromBoard(s, loc.col, loc.idx) : loc.card;
  if (loc.where === 'tray') s.tray[loc.slot] = null;

  s.progress[card.cat] += 1;
  s.lastItem[card.cat] = card;
  s.placedCount += 1;
  if (spendMove) s.moves -= 1;

  let completedCategory: Card | null = null;
  if (s.progress[card.cat] >= s.totals[card.cat]) {
    completedCategory = activeCategory(s, card.cat);
    // La siguiente categoría ocupa la misma casilla; la casilla nunca se mueve.
    const slot = s.categories.findIndex((c) => c?.cat === card.cat);
    if (slot !== -1) s.categories[slot] = s.pending.shift() ?? null;
  }
  evaluate(s);
  return { state: s, completedCategory };
}

/** Mueve una carta del tablero a la bandeja. */
export function moveToTray(prev: GameState, id: string): GameState | null {
  const s = clone(prev);
  const loc = locate(s, id);
  if (!loc || loc.where !== 'board' || loc.card.kind !== 'item' || loc.card.hidden) return null;
  const slot = freeTraySlot(s);
  if (slot === -1) return null;
  s.tray[slot] = removeFromBoard(s, loc.col, loc.idx);
  s.moves -= 1;
  evaluate(s);
  return s;
}

export function unlockBonus(prev: GameState): GameState {
  const s = clone(prev);
  s.bonusUnlocked = true;
  s.moves += BONUS_MOVES;
  evaluate(s);
  return s;
}

export function unlockTraySlot(prev: GameState): GameState {
  const s = clone(prev);
  s.openSlots = Math.min(TRAY_SIZE, s.openSlots + 1);
  evaluate(s);
  return s;
}

export function addMoves(prev: GameState, n: number): GameState {
  const s = clone(prev);
  s.moves += n;
  evaluate(s);
  return s;
}

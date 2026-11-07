import type { Card, DifficultyDef, GameState, LevelDef, Location } from './types';

export const ROWS = 4;
export const COLS = 5;
/** columna central: aquí viven, ancladas, las cartas de categoría (nunca contiene objetos) */
export const CATEGORY_COL = 2;
/** categorías reveladas al iniciar (la 4ª casilla de la columna es GRATIS) */
export const CATEGORY_SLOTS = 3;
/** la casilla "GRATIS" es la última casilla de la columna central */
export const BONUS_COL = CATEGORY_COL;
const ITEM_COLS = Array.from({ length: COLS }, (_, i) => i).filter((i) => i !== CATEGORY_COL);
export const BONUS_MOVES = 5;
export const TRAY_SIZE = 5;

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

/** Imán: coloca todas las cartas disponibles de la categoría con más coincidencias. */
export function magnet(prev: GameState): { state: GameState; placedIds: string[]; completed: Card[] } | null {
  const candidates = [...prev.tray.filter((c): c is Card => !!c), ...pickableBoardItems(prev)].filter((c) =>
    canPlace(prev, c),
  );
  if (!candidates.length) return null;
  const counts = new Map<string, number>();
  for (const c of candidates) counts.set(c.cat, (counts.get(c.cat) ?? 0) + 1);
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];

  let s = prev;
  const placedIds: string[] = [];
  const completed: Card[] = [];
  // Repite porque al caer las columnas pueden aparecer más cartas de la categoría.
  for (let guard = 0; guard < 40; guard++) {
    const next = [...s.tray.filter((c): c is Card => !!c), ...pickableBoardItems(s)].find(
      (c) => c.cat === best && canPlace(s, c),
    );
    if (!next) break;
    const r = placeItem(s, next.id, false)!;
    s = r.state;
    placedIds.push(next.id);
    if (r.completedCategory) completed.push(r.completedCategory);
  }
  return { state: s, placedIds, completed };
}

export type Hint = { itemId: string; target: string | 'tray' } | null;

export function findHint(s: GameState): Hint {
  const fromTray = s.tray.find((c) => c && canPlace(s, c));
  if (fromTray) return { itemId: fromTray.id, target: activeCategory(s, fromTray.cat)!.id };
  const items = pickableBoardItems(s);
  const direct = items.find((c) => canPlace(s, c));
  if (direct) return { itemId: direct.id, target: activeCategory(s, direct.cat)!.id };
  if (freeTraySlot(s) !== -1 && items.length) return { itemId: chooseTrayCandidate(s, items).id, target: 'tray' };
  return null;
}

/** Heurística: guardar en la bandeja la carta cuya categoría está más cerca de revelarse. */
function chooseTrayCandidate(s: GameState, items: Card[]): Card {
  const depth = (cat: string) => {
    const i = s.pending.findIndex((c) => c.cat === cat);
    return i === -1 ? 999 : i;
  };
  return [...items].sort((a, b) => depth(a.cat) - depth(b.cat))[0];
}

/* ------------------------------------------------------------------ */
/* Generación de niveles + solver                                      */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Resuelve el nivel con una estrategia voraz; devuelve los movimientos usados o null. */
export function solve(start: GameState): number | null {
  let s: GameState = { ...clone(start), moves: 10_000 };
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

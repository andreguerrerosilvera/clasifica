/** Constantes y economía del juego (sin dependencias de UI). */

export const ROWS = 4;
export const COLS = 5;

/** Columna central: aquí viven, ancladas, las cartas de categoría (nunca contiene objetos). */
export const CATEGORY_COL = 2;
/** Categorías reveladas al iniciar (la 4ª casilla de la columna es GRATIS). */
export const CATEGORY_SLOTS = 3;
/** La casilla "GRATIS" es la última casilla de la columna central. */
export const BONUS_COL = CATEGORY_COL;
export const BONUS_MOVES = 5;

export const TRAY_SIZE = 5;

/** Columnas que contienen objetos (todas menos la central). */
export const ITEM_COLS = Array.from({ length: COLS }, (_, i) => i).filter((i) => i !== CATEGORY_COL);

export const COST = { hint: 30, undo: 40, magnet: 80, slot: 100, playOn: 100 } as const;
export const PLAY_ON_MOVES = 10;
export const HISTORY_LIMIT = 40;

export const winReward = (movesLeft: number) => 50 + movesLeft * 2;

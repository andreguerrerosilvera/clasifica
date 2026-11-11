/** Constantes y economía del juego (sin dependencias de UI). */

export const ROWS = 4;
export const COLS = 5;

/** Columna central: aquí viven, ancladas, las cartas de categoría (nunca contiene objetos). */
export const CATEGORY_COL = 2;
/**
 * Casilla GRATIS (la última de la columna central). Desactivada para el piloto: la lógica sigue,
 * pero no se muestra y la columna empieza con sus 4 casillas ocupadas por categorías.
 */
export const FREE_SLOT_ENABLED = false;
/** Categorías reveladas al iniciar: 3 + GRATIS si está activa; si no, las 4 casillas. */
export const CATEGORY_SLOTS = FREE_SLOT_ENABLED ? ROWS - 1 : ROWS;
/** Mínimo de categorías distintas por nivel (las 4 casillas de la columna central). */
export const MIN_CATEGORIES = 4;
export const BONUS_COL = CATEGORY_COL;
export const BONUS_MOVES = 5;

export const TRAY_SIZE = 5;

/** Columnas que contienen objetos (todas menos la central). */
export const ITEM_COLS = Array.from({ length: COLS }, (_, i) => i).filter((i) => i !== CATEGORY_COL);

export const COST = { hint: 30, undo: 40, magnet: 80, slot: 100, playOn: 100 } as const;
export const PLAY_ON_MOVES = 10;
export const HISTORY_LIMIT = 40;

/** Monedas por ganar un nivel: siempre las mismas, sin importar el nivel ni los movimientos sobrantes. */
export const WIN_REWARD = 30;

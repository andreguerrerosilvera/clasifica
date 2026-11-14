/** Constantes y economía del juego (sin dependencias de UI). */

export const ROWS = 4;
export const COLS = 5;

/** Columna central: aquí viven, ancladas, las cartas de categoría (nunca contiene objetos). */
export const CATEGORY_COL = 2;
/**
 * Casilla extra (la última de la columna central): da una categoría más y BONUS_MOVES.
 * En `false` no se muestra y la columna empieza con sus 4 casillas ocupadas por categorías.
 */
export const FREE_SLOT_ENABLED = true;
/**
 * Cómo se desbloquea: `'coins'` se compra por COST.bonusSlot; `'ad'` viendo un anuncio recompensado
 * (src/platform/ads.ts). Por ahora con monedas, hasta tener un proveedor de anuncios recompensados.
 */
export const FREE_SLOT_PAYMENT: 'coins' | 'ad' = 'coins';
/** Categorías reveladas al iniciar: 3 + GRATIS si está activa; si no, las 4 casillas. */
export const CATEGORY_SLOTS = FREE_SLOT_ENABLED ? ROWS - 1 : ROWS;
/** Mínimo de categorías distintas por nivel (las 4 casillas de la columna central). */
export const MIN_CATEGORIES = 4;
export const BONUS_COL = CATEGORY_COL;
export const BONUS_MOVES = 5;

export const TRAY_SIZE = 5;

/** Columnas que contienen objetos (todas menos la central). */
export const ITEM_COLS = Array.from({ length: COLS }, (_, i) => i).filter((i) => i !== CATEGORY_COL);

/** Barra de potenciadores (pista, deshacer, imán) bajo la bandeja. Oculta por ahora: la lógica sigue. */
export const BOOSTERS_ENABLED = false;

export const COST = { hint: 30, undo: 40, magnet: 80, slot: 100, playOn: 100, bonusSlot: 300 } as const;
export const PLAY_ON_MOVES = 10;
export const HISTORY_LIMIT = 40;

/** Monedas por ganar un nivel: siempre las mismas, sin importar el nivel ni los movimientos sobrantes. */
export const WIN_REWARD = 30;

export type CardKind = 'item' | 'category';

export interface Card {
  id: string;
  kind: CardKind;
  /** id de la categoría a la que pertenece (o que representa) */
  cat: string;
  emoji: string;
  label: string;
  /** carta boca abajo ("?"), se revela al retirar una carta vecina */
  hidden: boolean;
}

export interface ItemDef {
  /** id estable dentro de su categoría (inglés); el texto sale de content/i18n */
  id: string;
  emoji: string;
  name: string;
}

export interface CategoryDef {
  id: string;
  name: string;
  icon: string;
  items: ItemDef[];
}

/** Tablero fijo del nivel. Las cartas se referencian como `categoria.item`. */
export interface LevelLayout {
  /** columnas del tablero; índice 0 = carta más abajo. La columna central va vacía */
  columns: string[][];
  /** cartas boca abajo ("?") */
  hidden: string[];
  /** orden de las categorías: las primeras quedan reveladas, el resto entra al completar otra */
  categoryOrder: string[];
}

export interface LevelDef {
  id: number;
  title: string;
  subtitle: string;
  /** dificultad del nivel: la define el contenido, no el jugador */
  difficulty: DifficultyId;
  /** movimientos disponibles */
  moves: number;
  categories: CategoryDef[];
  layout: LevelLayout;
}

/** Equivalente a un enum (no se usan enums por `erasableSyntaxOnly`). */
export const Difficulty = { Easy: 'easy', Normal: 'normal', Hard: 'hard' } as const;
export type DifficultyId = (typeof Difficulty)[keyof typeof Difficulty];

export interface DifficultyDef {
  id: DifficultyId;
  label: string;
  description: string;
  /** casillas abiertas en la bandeja (de 5) */
  openSlots: number;
}

export type GameStatus = 'playing' | 'won' | 'lost' | 'stuck';

export interface GameState {
  levelId: number;
  difficulty: DifficultyId;
  /** columnas del tablero; índice 0 = carta más abajo */
  columns: Card[][];
  /** casillas de categoría ancladas en la columna central (reveladas); null = casilla vacía */
  categories: (Card | null)[];
  /** categorías aún no reveladas; entran en la casilla de la que se completa */
  pending: Card[];
  tray: (Card | null)[];
  openSlots: number;
  progress: Record<string, number>;
  totals: Record<string, number>;
  lastItem: Record<string, Card | null>;
  moves: number;
  startMoves: number;
  totalItems: number;
  placedCount: number;
  bonusUnlocked: boolean;
  status: GameStatus;
}

export type Location =
  | { where: 'board'; col: number; idx: number; card: Card }
  | { where: 'tray'; slot: number; card: Card };

/** Destino de un arrastre: id de una categoría, la bandeja o nada */
export type DropTarget = string | 'tray' | null;

/** Jugada sugerida por la pista */
export type Hint = { itemId: string; target: string | 'tray' } | null;

/** Progreso persistente del jugador */
export interface Save {
  coins: number;
  /** ids de los niveles superados */
  completed: number[];
}

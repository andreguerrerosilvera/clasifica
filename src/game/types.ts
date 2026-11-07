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
  emoji: string;
  name: string;
}

export interface CategoryDef {
  id: string;
  name: string;
  icon: string;
  items: ItemDef[];
}

export interface LevelDef {
  id: number;
  title: string;
  subtitle: string;
  seed: number;
  /** proporción base de cartas ocultas "?" */
  hiddenRatio: number;
  categories: CategoryDef[];
}

export type DifficultyId = 'facil' | 'normal' | 'dificil';

export interface DifficultyDef {
  id: DifficultyId;
  label: string;
  description: string;
  /** multiplicador sobre los movimientos de la solución de referencia */
  moveFactor: number;
  /** multiplicador sobre la proporción de cartas ocultas */
  hiddenFactor: number;
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

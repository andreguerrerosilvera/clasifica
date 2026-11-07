import type { DifficultyId, Save } from '../models/types';

const KEY = 'clasifica-save-v1';

export const DEFAULT_SAVE: Save = {
  coins: 300,
  difficulty: 'normal',
  completed: { facil: [], normal: [], dificil: [] },
};

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_SAVE, ...JSON.parse(raw) };
  } catch {
    /* almacenamiento no disponible */
  }
  return DEFAULT_SAVE;
}

export function persistSave(save: Save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* ignorar */
  }
}

export const withCoinsSpent = (save: Save, n: number): Save => ({ ...save, coins: save.coins - n });

export const withDifficulty = (save: Save, difficulty: DifficultyId): Save => ({ ...save, difficulty });

/** Registra un nivel ganado en la dificultad actual y suma la recompensa. */
export function withWin(save: Save, levelId: number, reward: number): Save {
  const done = save.completed[save.difficulty];
  return {
    ...save,
    coins: save.coins + reward,
    completed: { ...save.completed, [save.difficulty]: done.includes(levelId) ? done : [...done, levelId] },
  };
}

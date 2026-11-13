import type { RawLevel, Save } from '../models/types';

const KEY = 'clasifica-save-v1';

export const DEFAULT_SAVE: Save = { coins: 300, completed: [], generated: null };

/** Acepta partidas guardadas con el formato anterior (progreso por dificultad). */
function normalize(raw: unknown): Save {
  const r = (raw ?? {}) as { coins?: unknown; completed?: unknown; generated?: unknown };
  const coins = typeof r.coins === 'number' ? r.coins : DEFAULT_SAVE.coins;
  const list = Array.isArray(r.completed)
    ? r.completed
    : r.completed && typeof r.completed === 'object'
      ? Object.values(r.completed).flat()
      : [];
  const completed = [...new Set(list.filter((n): n is number => typeof n === 'number'))];
  // Si el nivel guardado no encaja con el contenido actual, se descarta al jugarlo (ver levelFor).
  const g = r.generated as RawLevel | null | undefined;
  const generated = g && typeof g === 'object' && typeof g.id === 'number' && g.layout ? g : null;
  return { coins, completed, generated };
}

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
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

/** Registra un nivel ganado y suma la recompensa. Un nivel generado ya superado se descarta. */
export const withWin = (save: Save, levelId: number, reward: number): Save => ({
  coins: save.coins + reward,
  completed: save.completed.includes(levelId) ? save.completed : [...save.completed, levelId],
  generated: save.generated?.id === levelId ? null : save.generated,
});

/** Guarda el nivel recién generado para que no cambie hasta superarlo. */
export const withGenerated = (save: Save, level: RawLevel): Save => ({ ...save, generated: level });

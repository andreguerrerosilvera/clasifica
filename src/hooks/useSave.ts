import { useCallback, useEffect, useState } from 'react';
import { loadSave, persistSave, withCoinsSpent, withDifficulty, withWin } from '../logic/save';
import type { DifficultyId, Save } from '../models/types';

export function useSave() {
  const [save, setSave] = useState<Save>(loadSave);

  useEffect(() => persistSave(save), [save]);

  /** Gasta monedas; devuelve false si no alcanzan. */
  const spend = (n: number) => {
    if (save.coins < n) return false;
    setSave((s) => withCoinsSpent(s, n));
    return true;
  };

  const setDifficulty = useCallback((d: DifficultyId) => setSave((s) => withDifficulty(s, d)), []);
  const registerWin = useCallback((levelId: number, reward: number) => setSave((s) => withWin(s, levelId, reward)), []);

  return { save, spend, setDifficulty, registerWin };
}

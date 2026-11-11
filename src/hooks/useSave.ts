import { useCallback, useEffect, useState } from 'react';
import { loadSave, persistSave, withCoinsSpent, withWin } from '../logic/save';
import type { Save } from '../models/types';

export function useSave() {
  const [save, setSave] = useState<Save>(loadSave);

  useEffect(() => persistSave(save), [save]);

  /** Gasta monedas; devuelve false si no alcanzan. */
  const spend = (n: number) => {
    if (save.coins < n) return false;
    setSave((s) => withCoinsSpent(s, n));
    return true;
  };

  const registerWin = useCallback((levelId: number, reward: number) => setSave((s) => withWin(s, levelId, reward)), []);

  return { save, spend, registerWin };
}

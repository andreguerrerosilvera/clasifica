import { useCallback, useEffect, useState } from 'react';
import { levelFor } from '../data/levels';
import { loadSave, persistSave, withCoinsSpent, withGenerated, withWin } from '../logic/save';
import type { LevelDef, Save } from '../models/types';

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

  /** Nivel listo para jugar: si hay que generarlo, se guarda para que no cambie hasta superarlo. */
  const startLevel = (id: number): LevelDef => {
    const { level, created } = levelFor(id, save.generated);
    if (created) setSave((s) => withGenerated(s, created));
    return level;
  };

  return { save, spend, registerWin, startLevel };
}

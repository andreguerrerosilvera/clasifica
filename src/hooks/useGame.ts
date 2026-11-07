import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getDifficulty, getLevel } from '../data/levels';
import {
  addMoves,
  freeTraySlot,
  locate,
  moveToTray,
  placeItem,
  unlockBonus,
  unlockTraySlot,
} from '../logic/board';
import { createLevel } from '../logic/generator';
import { findHint, magnet } from '../logic/hints';
import { BONUS_MOVES, COST, HISTORY_LIMIT, PLAY_ON_MOVES, ROWS, TRAY_SIZE, winReward } from '../logic/rules';
import type { Card, DifficultyId, DropTarget, GameState, Hint } from '../models/types';

export type Overlay = null | 'won' | 'lost' | 'stuck';

interface Options {
  levelId: number;
  difficulty: DifficultyId;
  spend: (n: number) => boolean;
  onWin: (levelId: number, reward: number) => void;
  /** se llama con las categorías que se acaban de completar (para efectos visuales) */
  onCategoryComplete: (cards: Card[]) => void;
}

/** Orquesta una partida: estado, historial, potenciadores y fin de partida. */
export function useGame({ levelId, difficulty, spend, onWin, onCategoryComplete }: Options) {
  const level = getLevel(levelId);
  const diff = getDifficulty(difficulty);
  const fresh = useCallback(() => createLevel(level, diff), [level, diff]);

  const [state, setState] = useState<GameState>(fresh);
  const [history, setHistory] = useState<GameState[]>([]);
  const [dealing, setDealing] = useState(true);
  const [round, setRound] = useState(0);
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);
  const [hint, setHint] = useState<Hint>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [reward, setReward] = useState(0);
  const toastTimer = useRef<number>(0);

  // Nueva partida al cambiar de nivel/dificultad o reiniciar
  useEffect(() => {
    setState(fresh());
    setHistory([]);
    setOverlay(null);
    setHint(null);
    setDealing(true);
    const t = window.setTimeout(() => setDealing(false), 1400);
    return () => window.clearTimeout(t);
  }, [fresh, round]);

  // Pantallas de fin de partida
  useEffect(() => {
    if (state.status === 'playing') {
      setOverlay(null);
      return;
    }
    const t = window.setTimeout(
      () => {
        if (state.status === 'won') {
          const r = winReward(state.moves);
          setReward(r);
          onWin(levelId, r);
        }
        setOverlay(state.status as Exclude<Overlay, null>);
      },
      state.status === 'won' ? 900 : 500,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const say = (msg: string) => {
    window.clearTimeout(toastTimer.current);
    setToast({ msg, key: Date.now() });
    toastTimer.current = window.setTimeout(() => setToast(null), 1900);
  };

  const commit = (next: GameState) => {
    setHistory((h) => [...h.slice(-HISTORY_LIMIT), state]);
    setState(next);
    setHint(null);
  };

  const locked = state.status !== 'playing' || dealing;

  const place = (id: string) => {
    const r = placeItem(state, id);
    if (!r) return;
    if (r.completedCategory) onCategoryComplete([r.completedCategory]);
    commit(r.state);
  };

  /** Soltar una carta sobre una categoría o la bandeja. */
  const dropCard = (card: Card, target: DropTarget) => {
    if (locked || !target) return;
    const loc = locate(state, card.id);
    if (!loc) return;
    if (target === 'tray') {
      if (loc.where === 'tray') return;
      if (freeTraySlot(state) === -1) return say('¡La bandeja está llena!');
      const next = moveToTray(state, card.id);
      if (next) commit(next);
      return;
    }
    const cat = state.categories.find((c) => c?.id === target);
    if (!cat) return;
    if (cat.cat !== card.cat) return say('Movimiento inválido: esta carta no pertenece a esta categoría');
    place(card.id);
  };

  /* ---------------- Potenciadores ---------------- */
  const showHint = () => {
    if (locked) return;
    const h = findHint(state);
    if (!h) return say('No hay jugadas disponibles');
    if (!spend(COST.hint)) return say('No tienes monedas suficientes');
    setHint(h);
    window.setTimeout(() => setHint((cur) => (cur === h ? null : cur)), 3000);
  };

  const undo = () => {
    if (dealing || state.status === 'won') return;
    if (!history.length) return say('No hay nada que deshacer');
    if (!spend(COST.undo)) return say('No tienes monedas suficientes');
    setState(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
    setHint(null);
  };

  const fireMagnet = () => {
    if (locked) return;
    const r = magnet(state);
    if (!r) return say('El imán necesita una categoría con cartas disponibles');
    if (!spend(COST.magnet)) return say('No tienes monedas suficientes');
    onCategoryComplete(r.completed);
    commit(r.state);
  };

  const unlockSlot = () => {
    if (state.openSlots >= TRAY_SIZE || state.status === 'won') return;
    if (!spend(COST.slot)) return say('No tienes monedas suficientes');
    setState(unlockTraySlot(state));
  };

  const claimBonus = () => {
    if (locked || state.bonusUnlocked) return;
    commit(unlockBonus(state));
    say(`¡+${BONUS_MOVES} movimientos y una casilla más!`);
  };

  const playOn = () => {
    if (!spend(COST.playOn)) return say('No tienes monedas suficientes');
    setState(addMoves(state, PLAY_ON_MOVES));
  };

  const restart = () => setRound((r) => r + 1);

  // Orden de reparto para la animación inicial
  const dealIndex = useMemo(() => {
    const m = new Map<string, number>();
    state.columns.forEach((col, c) => col.slice(0, ROWS).forEach((card, i) => m.set(card.id, (ROWS - i) * 5 + c)));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, levelId, difficulty]);

  const isHighlighted = (id: string) => !!hint && (hint.itemId === id || hint.target === id);

  return {
    level,
    diff,
    state,
    canUndo: history.length > 0,
    hint,
    toast,
    overlay,
    reward,
    dealing,
    locked,
    dealIndex,
    isHighlighted,
    dropCard,
    showHint,
    undo,
    fireMagnet,
    unlockSlot,
    claimBonus,
    playOn,
    restart,
  };
}

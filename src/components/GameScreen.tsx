import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BONUS_MOVES,
  CATEGORY_COL,
  ROWS,
  TRAY_SIZE,
  addMoves,
  createLevel,
  findHint,
  freeTraySlot,
  locate,
  magnet,
  moveToTray,
  placeItem,
  unlockBonus,
  unlockTraySlot,
  visibleRows,
  type Hint,
} from '../game/engine';
import { getDifficulty, getLevel, LEVELS } from '../game/levels';
import type { Card, DifficultyId, GameState } from '../game/types';
import { CardView, type DropTarget } from './CardView';
import { OutOfMovesModal, SettingsModal, StuckModal, WinScreen } from './Modals';

export const COST = { hint: 30, undo: 40, magnet: 80, slot: 100, playOn: 100 } as const;
export const PLAY_ON_MOVES = 10;

interface Props {
  levelId: number;
  difficulty: DifficultyId;
  coins: number;
  spend: (n: number) => boolean;
  onWin: (levelId: number, reward: number) => void;
  onNext: () => void;
  onExit: () => void;
}

interface Burst {
  key: string;
  rect: DOMRect;
  label: string;
}

export function GameScreen({ levelId, difficulty, coins, spend, onWin, onNext, onExit }: Props) {
  const level = getLevel(levelId);
  const diff = getDifficulty(difficulty);
  const fresh = useCallback(() => createLevel(level, diff), [level, diff]);

  const [state, setState] = useState<GameState>(fresh);
  const [history, setHistory] = useState<GameState[]>([]);
  const [dealing, setDealing] = useState(true);
  const [round, setRound] = useState(0);
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);
  const [hint, setHint] = useState<Hint>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [overlay, setOverlay] = useState<null | 'won' | 'lost' | 'stuck'>(null);
  const [settings, setSettings] = useState(false);
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
          const r = 50 + state.moves * 2;
          setReward(r);
          onWin(levelId, r);
        }
        setOverlay(state.status as 'won' | 'lost' | 'stuck');
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
    setHistory((h) => [...h.slice(-40), state]);
    setState(next);
    setHint(null);
  };

  const burstFor = (cards: Card[]) => {
    const add: Burst[] = [];
    for (const c of cards) {
      const el = document.querySelector(`[data-card="${c.id}"]`);
      if (el) add.push({ key: `${c.id}-${Date.now()}`, rect: el.getBoundingClientRect(), label: c.label });
    }
    if (!add.length) return;
    setBursts((b) => [...b, ...add]);
    window.setTimeout(() => setBursts((b) => b.filter((x) => !add.includes(x))), 1000);
  };

  const place = (id: string) => {
    const r = placeItem(state, id);
    if (!r) return;
    if (r.completedCategory) burstFor([r.completedCategory]);
    commit(r.state);
  };

  const locked = state.status !== 'playing' || dealing;

  const handleDrop = (card: Card, target: DropTarget) => {
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
  const onHint = () => {
    if (locked) return;
    const h = findHint(state);
    if (!h) return say('No hay jugadas disponibles');
    if (!spend(COST.hint)) return say('No tienes monedas suficientes');
    setHint(h);
    window.setTimeout(() => setHint((cur) => (cur === h ? null : cur)), 3000);
  };

  const onUndo = () => {
    if (dealing || state.status === 'won') return;
    if (!history.length) return say('No hay nada que deshacer');
    if (!spend(COST.undo)) return say('No tienes monedas suficientes');
    setState(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
    setHint(null);
  };

  const onMagnet = () => {
    if (locked) return;
    const r = magnet(state);
    if (!r) return say('El imán necesita una categoría con cartas disponibles');
    if (!spend(COST.magnet)) return say('No tienes monedas suficientes');
    burstFor(r.completed.filter(() => true));
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

  const restart = () => {
    setSettings(false);
    setRound((r) => r + 1);
  };

  const progressPct = Math.round((state.placedCount / state.totalItems) * 100);
  const isHi = (id: string) => !!hint && (hint.itemId === id || hint.target === id);
  const isLast = levelId === LEVELS[LEVELS.length - 1].id;

  // Índice de reparto para la animación inicial
  const dealIndex = useMemo(() => {
    const m = new Map<string, number>();
    state.columns.forEach((col, c) => col.slice(0, ROWS).forEach((card, i) => m.set(card.id, (ROWS - i) * 5 + c)));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, levelId, difficulty]);

  return (
    <div className="board-bg relative flex min-h-full w-full justify-center overflow-hidden">
      <div className="flex w-full max-w-[440px] flex-col">
        {/* Cabecera */}
        <header className="relative z-30 bg-[#7a43d9] px-3 pb-3 pt-3 shadow-[0_4px_0_rgba(0,0,0,.15)]">
          <p className="text-center font-display text-[13px] tracking-wider text-white/60">
            {level.title.toUpperCase()} · {diff.label.toUpperCase()}
          </p>
          <div className="mt-1 flex items-center justify-between">
            <CoinPill coins={coins} />
            <div
              className={`flex items-center gap-2 rounded-full bg-[#4a2490] px-4 py-1 shadow-inner ${state.moves <= 5 ? 'animate-shake' : ''}`}
              key={state.moves <= 5 ? state.moves : 'ok'}
            >
              <span className="font-display text-lg text-white">movimientos</span>
              <span className={`font-display text-xl ${state.moves <= 5 ? 'text-red-400' : 'text-white'}`}>
                {state.moves}
              </span>
            </div>
            <button
              aria-label="Ajustes"
              onClick={() => setSettings(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4a2490] text-xl text-white active:scale-90"
            >
              ⚙️
            </button>
          </div>
          <div className="mx-auto mt-3 h-2.5 w-[82%] overflow-hidden rounded-full bg-[#3f1f82]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#21d4b4] to-[#4ef0c8]"
              animate={{ width: `${progressPct}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
        </header>

        {/* Toast */}
        <div className="pointer-events-none absolute left-0 right-0 top-[86px] z-50 flex justify-center px-4">
          <AnimatePresence>
            {toast && (
              <motion.div
                key={toast.key}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-[380px] rounded-lg border-2 border-[#3fe0d0] bg-[#2a1058]/95 px-4 py-2 text-center text-sm font-extrabold text-white shadow-lg"
              >
                {toast.msg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <LayoutGroup>
          {/* Tablero */}
          <main className="px-2 pt-2">
            <div className="grid grid-cols-5 gap-[6px]">
              {state.columns.map((col, c) => {
                if (c === CATEGORY_COL) {
                  // Columna central: categorías ancladas, fijas durante toda la partida
                  // Rejilla fija de 4 casillas: 3 categorías reveladas + GRATIS (última casilla)
                  return (
                    <div key={c} className="flex flex-col" style={{ containerType: 'inline-size' }}>
                      <DeckIndicator count={0} />
                      <div
                        className="grid gap-[6px]"
                        style={{ gridTemplateRows: 'repeat(4, calc(100cqw * 1.25))' }}
                      >
                        {Array.from({ length: ROWS }, (_, r) => (
                          <div
                            key={`slot-${r}`}
                            style={{ gridRow: r + 1, gridColumn: 1 }}
                            className="h-full rounded-[10px] bg-[#5a2ca8]/80 shadow-[inset_0_2px_6px_rgba(0,0,0,.25)]"
                          />
                        ))}
                        {state.categories.map((card, i) =>
                          card ? (
                            <CardView
                              key={card.id}
                              card={card}
                              style={{ gridRow: i + 1, gridColumn: 1 }}
                              progress={state.progress[card.cat]}
                              total={state.totals[card.cat]}
                              lastItem={state.lastItem[card.cat]}
                              highlight={isHi(card.id)}
                              interactive={!locked}
                            />
                          ) : null,
                        )}
                        {!state.bonusUnlocked && (
                          <button
                            onClick={claimBonus}
                            style={{ gridRow: ROWS, gridColumn: 1 }}
                            className="relative z-10 flex flex-col items-center justify-center rounded-[10px] border-2 border-[#ffb347] bg-[repeating-linear-gradient(45deg,#ff8a1c_0_8px,#ff9a33_8px_16px)] text-white shadow-[0_3px_0_#b85a00] active:scale-95"
                          >
                            <span className="text-[clamp(16px,5vw,24px)] leading-none">🎁</span>
                            <span className="font-display text-[clamp(11px,3.4vw,15px)] leading-tight">gratis</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }
                const vis = visibleRows(state, c);
                const shown = col.slice(0, vis);
                const deck = col.length - shown.length;
                return (
                  <div key={c} className="flex flex-col" style={{ containerType: 'inline-size' }}>
                    <DeckIndicator count={deck} />
                    <div
                      className="grid gap-[6px]"
                      style={{ gridTemplateRows: 'repeat(4, calc(100cqw * 1.25))' }}
                    >
                      {Array.from({ length: ROWS }, (_, r) => (
                        <div
                          key={`slot-${r}`}
                          style={{ gridRow: r + 1, gridColumn: 1 }}
                          className="h-full rounded-[10px] bg-[#5a2ca8]/80 shadow-[inset_0_2px_6px_rgba(0,0,0,.25)]"
                        />
                      ))}
                      {shown.map((card, i) => (
                        <CardView
                          key={card.id}
                          card={card}
                          style={{ gridRow: vis - i, gridColumn: 1 }}
                          progress={state.progress[card.cat]}
                          total={state.totals[card.cat]}
                          highlight={isHi(card.id)}
                          dealDelay={dealing ? (dealIndex.get(card.id) ?? 0) * 0.035 : null}
                          interactive={!locked}
                          onDrop={(t) => handleDrop(card, t)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </main>

          {/* Bandeja */}
          <section className="mt-4 flex justify-center px-6">
            <div
              data-drop="tray"
              className={`flex gap-2 rounded-xl p-1.5 ${hint?.target === 'tray' ? 'animate-pulseGlow' : ''}`}
            >
              {state.tray.map((card, i) => {
                const open = i < state.openSlots;
                return (
                  <div
                    key={i}
                    className="relative aspect-[4/5] w-[clamp(44px,13vw,58px)] rounded-lg bg-[#4c2394]/90 shadow-[inset_0_2px_6px_rgba(0,0,0,.35)]"
                  >
                    {!open ? (
                      <button
                        onClick={unlockSlot}
                        className="flex h-full w-full flex-col items-center justify-center rounded-lg border border-white/15 bg-[#5d2fae] text-white/80 active:scale-95"
                      >
                        <span className="text-base leading-none">🔒</span>
                        <span className="mt-0.5 text-[10px] font-black">🪙{COST.slot}</span>
                      </button>
                    ) : (
                      card && (
                        <CardView
                          key={card.id}
                          card={card}
                          compact
                          highlight={isHi(card.id)}
                          interactive={!locked}
                          onDrop={(t) => handleDrop(card, t)}
                        />
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </LayoutGroup>

        {/* Potenciadores */}
        <footer className="mb-6 mt-4 flex items-center justify-center gap-6">
          <Booster label="Pista" cost={COST.hint} onClick={onHint} className="from-[#ffd84a] to-[#f5a300]" icon="💡" />
          <Booster
            label="Deshacer"
            cost={COST.undo}
            onClick={onUndo}
            className={history.length ? 'from-[#ffb36b] to-[#f07a1a]' : 'from-[#9aa4b8] to-[#6b768c]'}
            icon="↩️"
          />
          <Booster label="Imán" cost={COST.magnet} onClick={onMagnet} className="from-[#ff6b6b] to-[#d62828]" icon="🧲" />
        </footer>
      </div>

      {/* Destellos de categoría completada */}
      {bursts.map((b) => (
        <motion.div
          key={b.key}
          className="pointer-events-none fixed z-[70] flex items-center justify-center rounded-[10px] bg-[#ffe066] font-display text-[#7a4b00]"
          style={{ left: b.rect.left, top: b.rect.top, width: b.rect.width, height: b.rect.height }}
          initial={{ scale: 1, opacity: 1, boxShadow: '0 0 0 0 rgba(255,215,0,.9)' }}
          animate={{ scale: [1, 1.25, 0.2], opacity: [1, 1, 0], boxShadow: '0 0 40px 24px rgba(255,215,0,.0)' }}
          transition={{ duration: 0.9, times: [0, 0.35, 1] }}
        >
          <span className="text-center text-[11px] leading-tight">
            ¡{b.label}
            <br />
            completo!
          </span>
        </motion.div>
      ))}

      <AnimatePresence>
        {overlay === 'lost' && (
          <OutOfMovesModal
            key="lost"
            canAfford={coins >= COST.playOn}
            cost={COST.playOn}
            extra={PLAY_ON_MOVES}
            onPlayOn={playOn}
            onRetry={restart}
          />
        )}
        {overlay === 'stuck' && (
          <StuckModal
            key="stuck"
            canUndo={history.length > 0 && coins >= COST.undo}
            undoCost={COST.undo}
            canUnlock={state.openSlots < TRAY_SIZE && coins >= COST.slot}
            slotCost={COST.slot}
            onUndo={onUndo}
            onUnlock={unlockSlot}
            onRetry={restart}
          />
        )}
        {overlay === 'won' && (
          <WinScreen key="won" levelTitle={level.title} reward={reward} isLast={isLast} onNext={onNext} />
        )}
        {settings && (
          <SettingsModal
            key="settings"
            onClose={() => setSettings(false)}
            onRestart={restart}
            onExit={onExit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export function CoinPill({ coins }: { coins: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-[#4a2490] py-1 pl-1 pr-3 shadow-inner">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-b from-[#ffe17a] to-[#f2a900] text-[13px] shadow-[0_2px_0_#a36b00]">
        🪙
      </span>
      <motion.span key={coins} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-display text-lg text-white">
        {coins}
      </motion.span>
    </div>
  );
}

function DeckIndicator({ count }: { count: number }) {
  const bars = Math.min(count, 5);
  return (
    <div className="mb-1 flex h-[22px] flex-col justify-end gap-[2px] px-1" title={`${count} cartas por caer`}>
      {Array.from({ length: bars }, (_, i) => (
        <motion.div
          key={i}
          layout
          className="h-[3px] rounded-full bg-[#7fd8c8]/80 shadow-[0_1px_0_rgba(0,0,0,.25)]"
        />
      ))}
    </div>
  );
}

function Booster({
  label,
  cost,
  icon,
  className,
  onClick,
}: {
  label: string;
  cost: number;
  icon: string;
  className: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="group flex flex-col items-center active:scale-90" aria-label={label}>
      <span
        className={`relative flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-white/70 bg-gradient-to-b ${className} text-2xl shadow-[0_4px_0_rgba(0,0,0,.3)]`}
      >
        {icon}
        <span className="absolute -right-2 -top-2 rounded-full border-2 border-white bg-[#22c55e] px-1.5 text-[10px] font-black text-white">
          {cost}
        </span>
      </span>
      <span className="mt-1 text-[11px] font-black text-white/85">{label}</span>
    </button>
  );
}

import { AnimatePresence, LayoutGroup } from 'framer-motion';
import { useState } from 'react';
import { LEVELS } from '../../data/levels';
import { useBursts } from '../../hooks/useBursts';
import { useGame } from '../../hooks/useGame';
import { COST, PLAY_ON_MOVES, TRAY_SIZE } from '../../logic/rules';
import type { DifficultyId } from '../../models/types';
import { Board } from '../components/Board';
import { BoosterBar } from '../components/BoosterBar';
import { Bursts } from '../components/Bursts';
import { GameHeader } from '../components/GameHeader';
import { Toast } from '../components/Toast';
import { Tray } from '../components/Tray';
import { OutOfMovesModal, SettingsModal, StuckModal, WinScreen } from '../modals/Modals';

interface Props {
  levelId: number;
  difficulty: DifficultyId;
  coins: number;
  spend: (n: number) => boolean;
  onWin: (levelId: number, reward: number) => void;
  onNext: () => void;
  onExit: () => void;
}

export function GameScreen({ levelId, difficulty, coins, spend, onWin, onNext, onExit }: Props) {
  const { bursts, burstFor } = useBursts();
  const game = useGame({ levelId, difficulty, spend, onWin, onCategoryComplete: burstFor });
  const [settings, setSettings] = useState(false);

  const { state, level, diff, overlay } = game;
  const progressPct = Math.round((state.placedCount / state.totalItems) * 100);
  const isLast = levelId === LEVELS[LEVELS.length - 1].id;

  const restart = () => {
    setSettings(false);
    game.restart();
  };

  return (
    <div className="board-bg relative flex min-h-full w-full justify-center overflow-hidden">
      <div className="flex w-full max-w-[440px] flex-col">
        <GameHeader
          title={level.title}
          difficultyLabel={diff.label}
          coins={coins}
          moves={state.moves}
          progressPct={progressPct}
          onSettings={() => setSettings(true)}
        />
        <Toast toast={game.toast} />

        <LayoutGroup>
          <Board
            state={state}
            locked={game.locked}
            dealing={game.dealing}
            dealIndex={game.dealIndex}
            isHighlighted={game.isHighlighted}
            onDrop={game.dropCard}
            onClaimBonus={game.claimBonus}
          />
          <Tray
            state={state}
            locked={game.locked}
            highlighted={game.hint?.target === 'tray'}
            isHighlighted={game.isHighlighted}
            onDrop={game.dropCard}
            onUnlockSlot={game.unlockSlot}
          />
        </LayoutGroup>

        <BoosterBar canUndo={game.canUndo} onHint={game.showHint} onUndo={game.undo} onMagnet={game.fireMagnet} />
      </div>

      <Bursts bursts={bursts} />

      <AnimatePresence>
        {overlay === 'lost' && (
          <OutOfMovesModal
            key="lost"
            canAfford={coins >= COST.playOn}
            cost={COST.playOn}
            extra={PLAY_ON_MOVES}
            onPlayOn={game.playOn}
            onRetry={restart}
          />
        )}
        {overlay === 'stuck' && (
          <StuckModal
            key="stuck"
            canUndo={game.canUndo && coins >= COST.undo}
            undoCost={COST.undo}
            canUnlock={state.openSlots < TRAY_SIZE && coins >= COST.slot}
            slotCost={COST.slot}
            onUndo={game.undo}
            onUnlock={game.unlockSlot}
            onRetry={restart}
          />
        )}
        {overlay === 'won' && (
          <WinScreen key="won" levelTitle={level.title} reward={game.reward} isLast={isLast} onNext={onNext} />
        )}
        {settings && (
          <SettingsModal key="settings" onClose={() => setSettings(false)} onRestart={restart} onExit={onExit} />
        )}
      </AnimatePresence>
    </div>
  );
}

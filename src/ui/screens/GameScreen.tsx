import { AnimatePresence, LayoutGroup } from 'framer-motion';
import { useState } from 'react';
import { useBursts } from '../../hooks/useBursts';
import { useGame } from '../../hooks/useGame';
import type { LevelDef } from '../../models/types';
import { BONUS_MOVES, BOOSTERS_ENABLED, COST, FREE_SLOT_PAYMENT, PLAY_ON_MOVES, TRAY_SIZE } from '../../logic/rules';
import { Board } from '../components/Board';
import { AdBanner } from '../components/AdBanner';
import { BoosterBar } from '../components/BoosterBar';
import { Bursts } from '../components/Bursts';
import { GameHeader } from '../components/GameHeader';
import { SimulatedAd } from '../components/SimulatedAd';
import { Toast } from '../components/Toast';
import { Tray } from '../components/Tray';
import { FreeSlotModal, OutOfMovesModal, SettingsModal, StuckModal, WinScreen } from '../modals/Modals';
import { CatalogScreen } from './CatalogScreen';

interface Props {
  level: LevelDef;
  coins: number;
  spend: (n: number) => boolean;
  onWin: (levelId: number, reward: number) => void;
  onNext: () => void;
  onExit: () => void;
}

export function GameScreen({ level: levelDef, coins, spend, onWin, onNext, onExit }: Props) {
  const { bursts, burstFor } = useBursts();
  const game = useGame({ level: levelDef, spend, onWin, onCategoryComplete: burstFor });
  const [settings, setSettings] = useState(false);
  const [catalog, setCatalog] = useState(false);
  const [freeSlotOffer, setFreeSlotOffer] = useState(false);

  const { state, level, diff, overlay } = game;
  const progressPct = Math.round((state.placedCount / state.totalItems) * 100);

  const restart = () => {
    setSettings(false);
    game.restart();
  };

  return (
    <div className="board-bg relative flex min-h-full w-full justify-center gap-8 overflow-hidden">
      {/* Laterales solo con pantalla ancha (≥1024 px): lejos del tablero, nunca en móvil ni tablet vertical. */}
      <AdBanner placement="side" className="sticky top-6 self-start pt-6" />
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
            onClaimBonus={() => !game.locked && setFreeSlotOffer(true)}
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

        {BOOSTERS_ENABLED ? (
          <BoosterBar canUndo={game.canUndo} onHint={game.showHint} onUndo={game.undo} onMagnet={game.fireMagnet} />
        ) : (
          <div className="mb-6" />
        )}
      </div>
      <AdBanner placement="side" className="sticky top-6 self-start pt-6" />

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
          <WinScreen key="won" levelTitle={level.title} reward={game.reward} onNext={onNext} />
        )}
        {settings && (
          <SettingsModal
            key="settings"
            onClose={() => setSettings(false)}
            onRestart={restart}
            onCatalog={() => {
              setSettings(false);
              setCatalog(true);
            }}
            onExit={onExit}
          />
        )}
        {freeSlotOffer && (
          <FreeSlotModal
            key="free-slot"
            moves={BONUS_MOVES}
            price={FREE_SLOT_PAYMENT === 'coins' ? COST.bonusSlot : undefined}
            canAfford={coins >= COST.bonusSlot}
            onAccept={() => {
              setFreeSlotOffer(false);
              void game.claimBonus();
            }}
            onClose={() => setFreeSlotOffer(false)}
          />
        )}
        {catalog && <CatalogScreen key="catalog" onClose={() => setCatalog(false)} />}
      </AnimatePresence>
      <SimulatedAd />
    </div>
  );
}

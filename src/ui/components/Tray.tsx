import { COST } from '../../logic/rules';
import type { Card, DropTarget, GameState } from '../../models/types';
import { CardView } from './CardView';
import { Coin, LockIcon } from './Icons';

interface Props {
  state: GameState;
  locked: boolean;
  highlighted: boolean;
  isHighlighted: (id: string) => boolean;
  onDrop: (card: Card, target: DropTarget) => void;
  onUnlockSlot: () => void;
}

export function Tray({ state, locked, highlighted, isHighlighted, onDrop, onUnlockSlot }: Props) {
  return (
    <section className="mt-4 flex justify-center px-6">
      <div data-drop="tray" className={`flex gap-2 rounded-xl p-1.5 ${highlighted ? 'animate-pulseGlow' : ''}`}>
        {state.tray.map((card, i) => (
          <div
            key={i}
            className="relative aspect-[4/5] w-[clamp(44px,13vw,58px)] rounded-lg bg-[#4c2394]/90 shadow-[inset_0_2px_6px_rgba(0,0,0,.35)]"
          >
            {i >= state.openSlots ? (
              <button
                onClick={onUnlockSlot}
                className="flex h-full w-full flex-col items-center justify-center rounded-lg border border-white/15 bg-[#5d2fae] text-white/80 active:scale-95"
              >
                <LockIcon className="h-6 w-6 drop-shadow-[0_2px_0_rgba(0,0,0,.3)]" />
                <span className="mt-0.5 flex items-center gap-0.5 text-[10px] font-black">
                  <Coin />
                  {COST.slot}
                </span>
              </button>
            ) : (
              card && (
                <CardView
                  key={card.id}
                  card={card}
                  compact
                  highlight={isHighlighted(card.id)}
                  interactive={!locked}
                  onDrop={(t) => onDrop(card, t)}
                />
              )
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

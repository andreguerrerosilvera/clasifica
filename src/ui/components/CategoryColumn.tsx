import { FREE_SLOT_ENABLED, ROWS } from '../../logic/rules';
import type { GameState } from '../../models/types';
import { CardView } from './CardView';
import { ColumnShell } from './ColumnShell';

interface Props {
  state: GameState;
  locked: boolean;
  isHighlighted: (id: string) => boolean;
  onClaimBonus: () => void;
}

/** Columna central: categorías ancladas (3) y, en la última casilla, GRATIS. */
export function CategoryColumn({ state, locked, isHighlighted, onClaimBonus }: Props) {
  return (
    <ColumnShell deck={0}>
      {state.categories.map((card, i) =>
        card ? (
          <CardView
            key={card.id}
            card={card}
            style={{ gridRow: i + 1, gridColumn: 1 }}
            progress={state.progress[card.cat]}
            total={state.totals[card.cat]}
            lastItem={state.lastItem[card.cat]}
            highlight={isHighlighted(card.id)}
            interactive={!locked}
          />
        ) : null,
      )}
      {FREE_SLOT_ENABLED && !state.bonusUnlocked && (
        <button
          onClick={onClaimBonus}
          style={{ gridRow: ROWS, gridColumn: 1 }}
          className="relative z-10 flex flex-col items-center justify-center rounded-[10px] border-2 border-[#ffb347] bg-[repeating-linear-gradient(45deg,#ff8a1c_0_8px,#ff9a33_8px_16px)] text-white shadow-[0_3px_0_#b85a00] active:scale-95"
        >
          <span className="text-[clamp(16px,5vw,24px)] leading-none">🎁</span>
          <span className="font-display text-[clamp(11px,3.4vw,15px)] leading-tight">gratis</span>
        </button>
      )}
    </ColumnShell>
  );
}

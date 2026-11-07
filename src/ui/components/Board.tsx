import { CATEGORY_COL } from '../../logic/rules';
import type { Card, DropTarget, GameState } from '../../models/types';
import { CategoryColumn } from './CategoryColumn';
import { ItemColumn } from './ItemColumn';

interface Props {
  state: GameState;
  locked: boolean;
  dealing: boolean;
  dealIndex: Map<string, number>;
  isHighlighted: (id: string) => boolean;
  onDrop: (card: Card, target: DropTarget) => void;
  onClaimBonus: () => void;
}

export function Board({ state, locked, dealing, dealIndex, isHighlighted, onDrop, onClaimBonus }: Props) {
  return (
    <main className="px-2 pt-2">
      <div className="grid grid-cols-5 gap-[6px]">
        {state.columns.map((_, col) =>
          col === CATEGORY_COL ? (
            <CategoryColumn
              key={col}
              state={state}
              locked={locked}
              isHighlighted={isHighlighted}
              onClaimBonus={onClaimBonus}
            />
          ) : (
            <ItemColumn
              key={col}
              state={state}
              col={col}
              locked={locked}
              dealing={dealing}
              dealIndex={dealIndex}
              isHighlighted={isHighlighted}
              onDrop={onDrop}
            />
          ),
        )}
      </div>
    </main>
  );
}

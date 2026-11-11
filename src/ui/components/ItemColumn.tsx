import { columnDropId, hasEmptySpace, visibleRows } from '../../logic/board';
import type { Card, DropTarget, GameState } from '../../models/types';
import { CardView } from './CardView';
import { ColumnShell } from './ColumnShell';

interface Props {
  state: GameState;
  col: number;
  locked: boolean;
  dealing: boolean;
  dealIndex: Map<string, number>;
  isHighlighted: (id: string) => boolean;
  onDrop: (card: Card, target: DropTarget) => void;
}

/** Columna de objetos: las cartas caen por gravedad hacia la fila inferior. */
export function ItemColumn({ state, col, locked, dealing, dealIndex, isHighlighted, onDrop }: Props) {
  const cards = state.columns[col];
  const vis = visibleRows(state, col);
  const shown = cards.slice(0, vis);

  return (
    <ColumnShell deck={cards.length - shown.length} dropId={hasEmptySpace(state, col) ? columnDropId(col) : undefined}>
      {shown.map((card, i) => (
        <CardView
          key={card.id}
          card={card}
          style={{ gridRow: vis - i, gridColumn: 1 }}
          highlight={isHighlighted(card.id)}
          dealDelay={dealing ? (dealIndex.get(card.id) ?? 0) * 0.035 : null}
          interactive={!locked}
          onDrop={(t) => onDrop(card, t)}
        />
      ))}
    </ColumnShell>
  );
}

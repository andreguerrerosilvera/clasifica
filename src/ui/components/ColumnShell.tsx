import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { ROWS } from '../../logic/rules';

/** Indicador de cartas pendientes de caer sobre la columna */
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

/** Marco común de una columna del tablero: indicador + rejilla de casillas vacías. */
export function ColumnShell({ deck, dropId, children }: { deck: number; dropId?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col" style={{ containerType: 'inline-size' }}>
      <DeckIndicator count={deck} />
      <div data-drop={dropId} className="grid gap-[6px]" style={{ gridTemplateRows: `repeat(${ROWS}, calc(100cqw * 1.25))` }}>
        {Array.from({ length: ROWS }, (_, r) => (
          <div
            key={`slot-${r}`}
            style={{ gridRow: r + 1, gridColumn: 1 }}
            className="h-full rounded-[10px] bg-[#5a2ca8]/80 shadow-[inset_0_2px_6px_rgba(0,0,0,.25)]"
          />
        ))}
        {children}
      </div>
    </div>
  );
}

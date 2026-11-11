import { motion } from 'framer-motion';
import type { Card, DropTarget } from '../../models/types';
import { dropTargetAt } from '../dropTarget';

interface Props {
  card: Card;
  progress?: number;
  total?: number;
  lastItem?: Card | null;
  highlight?: boolean;
  dealDelay?: number | null;
  interactive: boolean;
  onDrop?: (target: DropTarget) => void;
  style?: React.CSSProperties;
  compact?: boolean;
}

export function CardView({
  card,
  progress = 0,
  total = 0,
  lastItem,
  highlight,
  dealDelay,
  interactive,
  onDrop,
  style,
  compact,
}: Props) {
  const draggable = interactive && card.kind === 'item' && !card.hidden;
  const initial =
    dealDelay != null
      ? { opacity: 0, y: -260, rotate: -8, scale: 0.8 }
      : compact
        ? false
        : { opacity: 0, y: -50 };

  return (
    <motion.div
      layout
      layoutId={card.id}
      data-card={card.id}
      data-drop={card.kind === 'category' ? card.id : undefined}
      initial={initial}
      animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 420,
        damping: 32,
        delay: dealDelay ?? 0,
      }}
      drag={draggable}
      dragSnapToOrigin
      dragMomentum={false}
      whileDrag={{ scale: 1.1, zIndex: 60, rotate: 4, boxShadow: '0 14px 24px rgba(0,0,0,.35)' }}
      onDragEnd={(e) => {
        const ev = e as PointerEvent;
        const x = 'clientX' in ev ? ev.clientX : 0;
        const y = 'clientY' in ev ? ev.clientY : 0;
        const self = document.querySelector(`[data-card="${card.id}"]`);
        onDrop?.(dropTargetAt(x, y, self));
      }}
      style={{ touchAction: 'none', ...style }}
      className={[
        'relative z-10 h-full min-h-0 w-full select-none overflow-visible rounded-[10px]',
        draggable ? 'cursor-grab active:cursor-grabbing' : '',
        highlight ? 'animate-pulseGlow z-20' : '',
      ].join(' ')}
    >
      {card.hidden ? (
        <HiddenFace />
      ) : card.kind === 'category' ? (
        <CategoryFace card={card} progress={progress} total={total} lastItem={lastItem ?? null} />
      ) : (
        <ItemFace card={card} compact={compact} />
      )}
    </motion.div>
  );
}

function ItemFace({ card, compact }: { card: Card; compact?: boolean }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[10px] border border-[#ead9ae] bg-cream shadow-[0_3px_0_#cdb683]">
      <span className={compact ? 'text-[clamp(18px,6vw,28px)] leading-none' : 'text-[clamp(24px,8.5vw,40px)] leading-none'}>
        {card.emoji}
      </span>
      {!compact && (
        <span className="mt-1 max-w-full truncate px-1 text-[clamp(8px,2.3vw,10px)] font-extrabold text-[#8a6a35]">
          {card.label}
        </span>
      )}
    </div>
  );
}

function HiddenFace() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-[10px] border-2 border-[#d9a514] bg-[#1c1b22] shadow-[0_3px_0_#0b0a10]">
      <span className="font-display text-[clamp(30px,10vw,48px)] leading-none text-[#ffc928] drop-shadow-[0_2px_0_#7a5300]">
        ?
      </span>
    </div>
  );
}

function CategoryFace({
  card,
  progress,
  total,
  lastItem,
}: {
  card: Card;
  progress: number;
  total: number;
  lastItem: Card | null;
}) {
  const done = progress >= total;
  // Sin cartas encima: solo el nombre, centrado
  if (!lastItem)
    return (
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[10px] border-2 border-[#f2c230] bg-gradient-to-b from-[#fff3b0] to-[#fbd960] px-1 shadow-[0_3px_0_#c89614]">
        <span className="max-w-full text-center [overflow-wrap:anywhere] text-[clamp(10px,3vw,14px)] font-black leading-[1.1] text-[#5b3d00]">
          {card.label}
        </span>
      </div>
    );
  return (
    <div
      className={[
        'relative flex h-full w-full flex-col items-center justify-end overflow-hidden rounded-[10px] border-2 pb-1',
        'border-[#f2c230] bg-gradient-to-b from-[#fff3b0] to-[#fbd960] shadow-[0_3px_0_#c89614]',
        done ? 'animate-pulseGlow' : '',
      ].join(' ')}
    >
      <span className="absolute left-1 top-0.5 rounded bg-[#c58a00] px-1 text-[clamp(8px,2.4vw,11px)] font-black leading-tight text-white">
        {progress}/{total}
      </span>
      <div className="flex flex-1 items-center justify-center pt-3">
        <motion.span
          layoutId={lastItem.id}
          key={lastItem.id}
          className="text-[clamp(20px,7vw,34px)] leading-none"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        >
          {lastItem.emoji}
        </motion.span>
      </div>
      <span className="max-w-full px-0.5 text-center [overflow-wrap:anywhere] text-[clamp(8px,2.4vw,11px)] font-black leading-[1.05] text-[#5b3d00]">
        {card.label}
      </span>
    </div>
  );
}

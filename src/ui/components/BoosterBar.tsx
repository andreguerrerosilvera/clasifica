import { COST } from '../../logic/rules';

interface Props {
  canUndo: boolean;
  onHint: () => void;
  onUndo: () => void;
  onMagnet: () => void;
}

export function BoosterBar({ canUndo, onHint, onUndo, onMagnet }: Props) {
  return (
    <footer className="mb-6 mt-4 flex items-center justify-center gap-6">
      <Booster label="Pista" cost={COST.hint} onClick={onHint} className="from-[#ffd84a] to-[#f5a300]" icon="💡" />
      <Booster
        label="Deshacer"
        cost={COST.undo}
        onClick={onUndo}
        className={canUndo ? 'from-[#ffb36b] to-[#f07a1a]' : 'from-[#9aa4b8] to-[#6b768c]'}
        icon="↩️"
      />
      <Booster label="Imán" cost={COST.magnet} onClick={onMagnet} className="from-[#ff6b6b] to-[#d62828]" icon="🧲" />
    </footer>
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

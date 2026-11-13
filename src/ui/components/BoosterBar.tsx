import type { ReactNode } from 'react';
import { COST } from '../../logic/rules';
import { HintIcon, MagnetIcon, UndoIcon } from './Icons';
import { t } from '../../data/i18n';

interface Props {
  canUndo: boolean;
  onHint: () => void;
  onUndo: () => void;
  onMagnet: () => void;
}

export function BoosterBar({ canUndo, onHint, onUndo, onMagnet }: Props) {
  return (
    <footer className="mb-6 mt-4 flex items-center justify-center gap-6">
      <Booster
        label={t('hint')}
        cost={COST.hint}
        onClick={onHint}
        icon={<HintIcon className="h-9 w-9 drop-shadow-[0_2px_1px_rgba(0,0,0,.35)]" />}
      />
      <Booster
        label={t('undo')}
        cost={COST.undo}
        onClick={onUndo}
        disabled={!canUndo}
        icon={<UndoIcon className="h-9 w-9 drop-shadow-[0_2px_1px_rgba(0,0,0,.35)]" />}
      />
      <Booster
        label={t('magnet')}
        cost={COST.magnet}
        onClick={onMagnet}
        icon={<MagnetIcon className="h-9 w-9 drop-shadow-[0_2px_1px_rgba(0,0,0,.35)]" />}
      />
    </footer>
  );
}

function Booster({
  label,
  cost,
  icon,
  disabled = false,
  onClick,
}: {
  label: string;
  cost: number;
  icon: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="group flex flex-col items-center active:scale-90" aria-label={label}>
      <span
        className={`relative flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-b from-white to-[#ece4f7] text-2xl shadow-[0_4px_0_rgba(0,0,0,.3)] ${disabled ? 'opacity-50 grayscale' : ''}`}
      >
        {icon}
        <span className="absolute -right-2 -top-2 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-white bg-[#22c55e] text-[10px] font-black leading-none text-white shadow-[0_2px_0_rgba(0,0,0,.25)]">
          {cost}
        </span>
      </span>
      <span className="mt-1 text-[11px] font-black text-white/85">{label}</span>
    </button>
  );
}

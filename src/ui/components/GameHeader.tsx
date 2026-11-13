import { motion } from 'framer-motion';
import { CoinPill } from './CoinPill';
import { SettingsIcon } from './Icons';
import { t } from '../../data/i18n';

interface Props {
  title: string;
  difficultyLabel: string;
  coins: number;
  moves: number;
  progressPct: number;
  onSettings: () => void;
}

export function GameHeader({ title, difficultyLabel, coins, moves, progressPct, onSettings }: Props) {
  const low = moves <= 5;
  return (
    <header className="relative z-30 bg-[#7a43d9] px-3 pb-3 pt-3 shadow-[0_4px_0_rgba(0,0,0,.15)]">
      <p className="text-center font-display text-[13px] tracking-wider text-white/60">
        {title.toUpperCase()} · {difficultyLabel.toUpperCase()}
      </p>
      <div className="mt-1 flex items-center justify-between">
        <CoinPill coins={coins} />
        <div
          className={`flex items-center gap-2 rounded-full bg-[#4a2490] px-4 py-1 shadow-inner ${low ? 'animate-shake' : ''}`}
          key={low ? moves : 'ok'}
        >
          <span className="font-display text-lg text-white">{t('moves')}</span>
          <span className={`font-display text-xl ${low ? 'text-red-400' : 'text-white'}`}>{moves}</span>
        </div>
        <button
          aria-label={t('settings')}
          onClick={onSettings}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4a2490] text-xl text-white active:scale-90"
        >
          <SettingsIcon className="h-7 w-7 drop-shadow-[0_2px_0_rgba(0,0,0,.25)]" />
        </button>
      </div>
      <div className="mx-auto mt-3 h-2.5 w-[82%] overflow-hidden rounded-full bg-[#3f1f82]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#21d4b4] to-[#4ef0c8]"
          animate={{ width: `${progressPct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </header>
  );
}

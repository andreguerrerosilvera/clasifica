import { motion } from 'framer-motion';
import { Coin } from './Icons';

export function CoinPill({ coins }: { coins: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-[#4a2490] py-1 pl-1 pr-3 shadow-inner">
      <Coin className="h-7 w-7 drop-shadow-[0_2px_0_rgba(0,0,0,.25)]" />
      <motion.span
        key={coins}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
        className="font-display text-lg text-white"
      >
        {coins}
      </motion.span>
    </div>
  );
}

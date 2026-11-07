import { motion } from 'framer-motion';

export function CoinPill({ coins }: { coins: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-[#4a2490] py-1 pl-1 pr-3 shadow-inner">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-b from-[#ffe17a] to-[#f2a900] text-[13px] shadow-[0_2px_0_#a36b00]">
        🪙
      </span>
      <motion.span key={coins} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-display text-lg text-white">
        {coins}
      </motion.span>
    </div>
  );
}

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { LEVELS } from '../../data/levels';
import { CoinPill } from '../components/CoinPill';
import { Logo } from '../modals/Modals';

interface Props {
  coins: number;
  completed: number[];
  onPlay: (levelId: number) => void;
}

const EMOJIS = ['🍎', '🎸', '🐙', '🚀', '🧁', '🐝', '🎩', '⚽', '🍌', '🐄', '🎹', '🦋', '🍕', '🌈', '🚲', '🐳', '🧢', '🍇'];

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Tarjetas en una cuadrícula con desplazamiento aleatorio: repartidas pero nunca alineadas. */
function makeFloaters() {
  const COLS = 3;
  const ROWS = 5;
  const emojis = [...EMOJIS].sort(() => Math.random() - 0.5);
  return Array.from({ length: COLS * ROWS }, (_, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    return {
      emoji: emojis[i % emojis.length],
      left: ((col + rand(0.05, 0.85)) / COLS) * 100,
      top: ((row + rand(0.05, 0.85)) / ROWS) * 100,
      scale: rand(0.75, 1.15),
      tilt: rand(6, 14) * (Math.random() < 0.5 ? -1 : 1),
      lift: rand(8, 18),
      duration: rand(3.5, 6.5),
      delay: rand(0, 3),
    };
  });
}

export function HomeScreen({ coins, completed, onPlay }: Props) {
  const floaters = useMemo(() => makeFloaters(), []);
  const next = LEVELS.find((l) => !completed.includes(l.id)) ?? LEVELS[LEVELS.length - 1];

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#c9a2ff] via-[#9d6af0] to-[#6a35c4]">
      {floaters.map((f, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute flex h-14 w-12 items-center justify-center rounded-lg bg-cream text-2xl opacity-70 shadow-[0_3px_0_#cdb683]"
          style={{ left: `${f.left}%`, top: `${f.top}%`, scale: f.scale }}
          animate={{ y: [0, -f.lift, 0], rotate: [-f.tilt, f.tilt, -f.tilt] }}
          transition={{ duration: f.duration, delay: f.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="opacity-90">{f.emoji}</span>
        </motion.div>
      ))}

      <div className="relative mx-auto flex h-full max-w-[440px] flex-col px-5 pb-8 pt-5">
        <div className="flex justify-end">
          <CoinPill coins={coins} />
        </div>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            className="text-center"
          >
            <div className="inline-block -rotate-3">
              <Logo size="lg" />
            </div>
            <p className="mt-2 font-display text-lg text-white [text-shadow:0_2px_0_#4a2290,0_0_10px_rgba(74,34,144,0.55)]">Ordena cada carta en su categoría</p>
          </motion.div>

          {/* Siempre se juega el nivel en curso (el primero sin completar) */}
          <div className="mt-10 flex flex-col items-center gap-2 text-center">
            <button
              onClick={() => onPlay(next.id)}
              className="pointer-events-auto rounded-full border-b-4 border-[#b84d00] bg-gradient-to-b from-[#ffa53a] to-[#ff7a00] px-12 py-3 font-display text-2xl tracking-wide text-white shadow-xl active:translate-y-0.5 active:border-b-2"
            >
              JUGAR {next.title.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

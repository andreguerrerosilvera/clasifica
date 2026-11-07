import { motion } from 'framer-motion';
import { DIFFICULTIES, LEVELS } from '../../data/levels';
import type { DifficultyId } from '../../models/types';
import { CoinPill } from '../components/CoinPill';
import { HowToPlay, Logo } from '../modals/Modals';

interface Props {
  coins: number;
  difficulty: DifficultyId;
  completed: number[];
  onDifficulty: (d: DifficultyId) => void;
  onPlay: (levelId: number) => void;
}

const FLOATERS = ['🍎', '🎸', '🐙', '🚀', '🧁', '🐝', '🎩', '⚽'];

export function HomeScreen({ coins, difficulty, completed, onDifficulty, onPlay }: Props) {
  const unlocked = (id: number) => id === 1 || completed.includes(id - 1);
  const next = LEVELS.find((l) => !completed.includes(l.id) && unlocked(l.id)) ?? LEVELS[LEVELS.length - 1];
  const diff = DIFFICULTIES.find((d) => d.id === difficulty)!;

  return (
    <div className="relative min-h-full w-full overflow-hidden bg-gradient-to-b from-[#c9a2ff] via-[#9d6af0] to-[#6a35c4]">
      {FLOATERS.map((e, i) => (
        <motion.div
          key={e}
          className="pointer-events-none absolute flex h-14 w-12 opacity-70 items-center justify-center rounded-lg bg-cream text-2xl shadow-[0_3px_0_#cdb683]"
          style={{ left: `${(i * 13 + 4) % 92}%`, top: `${8 + ((i * 37) % 70)}%` }}
          animate={{ y: [0, -12, 0], rotate: [i % 2 ? -8 : 8, i % 2 ? 8 : -8, i % 2 ? -8 : 8] }}
          transition={{ duration: 4 + (i % 3), repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="opacity-90">{e}</span>
        </motion.div>
      ))}

      <div className="relative mx-auto flex min-h-full max-w-[440px] flex-col px-5 pb-8 pt-5">
        <div className="flex justify-end">
          <CoinPill coins={coins} />
        </div>

        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14 }}
          className="mt-6 text-center"
        >
          <div className="inline-block -rotate-3">
            <Logo size="lg" />
          </div>
          <p className="mt-2 font-display text-lg text-white drop-shadow">Ordena cada carta en su categoría</p>
        </motion.div>

        {/* Dificultad */}
        <div className="mt-7 rounded-2xl bg-[#4a2290]/85 p-3 shadow-xl backdrop-blur">
          <p className="mb-2 text-center font-display text-sm tracking-wider text-white/70">DIFICULTAD</p>
          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#351869] p-1">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                onClick={() => onDifficulty(d.id)}
                className={`relative rounded-lg py-2 font-display text-base transition ${
                  d.id === difficulty ? 'text-[#5b3d00]' : 'text-white/70'
                }`}
              >
                {d.id === difficulty && (
                  <motion.span
                    layoutId="diff-pill"
                    className="absolute inset-0 rounded-lg bg-gradient-to-b from-[#ffe17a] to-[#f5b400] shadow-[0_3px_0_#a36b00]"
                  />
                )}
                <span className="relative">{d.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-xs font-bold text-white/75">{diff.description}</p>
        </div>

        {/* Niveles */}
        <div className="mt-5 flex flex-col gap-3">
          {LEVELS.map((l, i) => {
            const open = unlocked(l.id);
            const done = completed.includes(l.id);
            return (
              <motion.button
                key={l.id}
                disabled={!open}
                onClick={() => onPlay(l.id)}
                initial={{ x: i % 2 ? 40 : -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                whileTap={open ? { scale: 0.97 } : undefined}
                className={`flex items-center gap-3 rounded-2xl border-b-4 p-3 text-left shadow-lg ${
                  open ? 'border-[#c89614] bg-gradient-to-b from-[#fff3b0] to-[#fbd960]' : 'border-[#4f3a7a] bg-[#7a649f]'
                }`}
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-2xl ${
                    open ? 'bg-[#c58a00] text-white' : 'bg-[#4f3a7a] text-white/60'
                  }`}
                >
                  {open ? l.id : '🔒'}
                </span>
                <span className="flex-1">
                  <span className={`block font-display text-xl ${open ? 'text-[#5b3d00]' : 'text-white/70'}`}>
                    {l.title}
                  </span>
                  <span className={`block text-xs font-bold ${open ? 'text-[#8a6a35]' : 'text-white/60'}`}>
                    {l.subtitle} · {l.categories.length} categorías
                  </span>
                </span>
                <span className="text-2xl">{done ? '✅' : open ? '▶️' : ''}</span>
              </motion.button>
            );
          })}
        </div>

        <button
          onClick={() => onPlay(next.id)}
          className="mx-auto mt-6 rounded-full border-b-4 border-[#b84d00] bg-gradient-to-b from-[#ffa53a] to-[#ff7a00] px-12 py-3 font-display text-2xl tracking-wide text-white shadow-xl active:translate-y-0.5 active:border-b-2"
        >
          JUGAR {next.title.toUpperCase()}
        </button>

        <div className="mt-6 rounded-2xl bg-[#4a2290]/70 px-4 pb-4 pt-1">
          <HowToPlay light />
        </div>
      </div>
    </div>
  );
}

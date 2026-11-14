import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { t } from '../../data/i18n';
import { finishSimulatedAd, onSimulatedAd } from '../../platform/ads';

/** Duración del anuncio simulado; cerrarlo antes no da la recompensa. */
const AD_SECONDS = 5;

/** Anuncio de prueba a pantalla completa (solo cuando no hay anuncios reales configurados). */
export function SimulatedAd() {
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState(AD_SECONDS);

  useEffect(
    () =>
      onSimulatedAd((next) => {
        if (next) setLeft(AD_SECONDS);
        setOpen(next);
      }),
    [],
  );
  // Si la pantalla se desmonta con el anuncio abierto, no deja la promesa colgada.
  useEffect(() => () => finishSimulatedAd('skipped'), []);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    return () => window.clearInterval(id);
  }, [open]);

  const done = left === 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0d0d14] px-6 text-center text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <span className="absolute left-4 top-4 rounded bg-[#ffd23f] px-2 py-0.5 text-xs font-black text-black">
            {t('adTest')}
          </span>
          <button
            onClick={() => finishSimulatedAd(done ? 'rewarded' : 'skipped')}
            className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-1 font-black"
          >
            {done ? t('adClose') : t('adRewardIn', { n: left })}
          </button>
          <div className="text-[64px]">📺</div>
          <p className="mt-4 font-display text-2xl">{t('adTestText')}</p>
          <div className="mt-8 h-1.5 w-full max-w-[280px] overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full bg-[#ffd23f] transition-[width] duration-1000 ease-linear"
              style={{ width: `${((AD_SECONDS - left) / AD_SECONDS) * 100}%` }}
            />
          </div>
          {done && <p className="mt-6 font-black text-[#ffd23f]">{t('adRewardReady')}</p>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

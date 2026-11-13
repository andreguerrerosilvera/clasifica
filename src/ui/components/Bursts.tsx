import { motion } from 'framer-motion';
import { t } from '../../data/i18n';
import type { Burst } from '../../hooks/useBursts';

/** Destellos de categoría completada */
export function Bursts({ bursts }: { bursts: Burst[] }) {
  return (
    <>
      {bursts.map((b) => (
        <motion.div
          key={b.key}
          className="pointer-events-none fixed z-[70] flex items-center justify-center rounded-[10px] bg-[#ffe066] font-display text-[#7a4b00]"
          style={{ left: b.rect.left, top: b.rect.top, width: b.rect.width, height: b.rect.height }}
          initial={{ scale: 1, opacity: 1, boxShadow: '0 0 0 0 rgba(255,215,0,.9)' }}
          animate={{ scale: [1, 1.25, 0.2], opacity: [1, 1, 0], boxShadow: '0 0 40px 24px rgba(255,215,0,.0)' }}
          transition={{ duration: 0.9, times: [0, 0.35, 1] }}
        >
          <span className="text-center text-[11px] leading-tight">
            {t('categoryDone', { name: b.label })
              .split('<br>')
              .map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
          </span>
        </motion.div>
      ))}
    </>
  );
}

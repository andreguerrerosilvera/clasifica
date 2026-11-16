import { AnimatePresence, motion } from 'framer-motion';
import { useSyncExternalStore } from 'react';
import { t } from '../../data/i18n';
import { consentPending, onConsentChange, setConsent } from '../../platform/consent';
import { PrivacyLink } from '../modals/Modals';

/**
 * Banner de cookies abajo de la pantalla, con enlace a la política. No bloquea el juego:
 * mientras no responda no hay analíticas; los anuncios solo se dejan de personalizar si rechaza.
 */
export function ConsentBanner() {
  const open = useSyncExternalStore(onConsentChange, consentPending);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="consent"
          role="dialog"
          aria-label={t('privacy')}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed inset-x-0 bottom-0 z-[110] flex justify-center px-4 pb-[max(16px,env(safe-area-inset-bottom))]"
        >
          {/* Móvil: tarjeta apilada. Escritorio (md+): una franja horizontal, texto a la izquierda y botones a la derecha. */}
          <div className="w-full max-w-[420px] rounded-2xl border-4 border-[#e8d3a0] bg-[#fff8e7] p-4 text-center shadow-2xl md:flex md:max-w-[860px] md:items-center md:gap-6 md:px-6 md:py-3 md:text-left">
            <p className="text-sm font-bold leading-snug text-[#5c4520] md:flex-1 md:text-base">
              {t('consentText')} <PrivacyLink className="text-[#7a3cd6]" />.
            </p>
            <div className="mt-3 flex gap-2 md:mt-0 md:w-[300px] md:shrink-0">
              <button
                onClick={() => setConsent('denied')}
                className="flex-1 rounded-full border-4 border-[#e8d3a0] bg-white py-2 font-display text-lg text-[#5c4520] active:translate-y-0.5"
              >
                {t('consentDecline')}
              </button>
              <button
                onClick={() => setConsent('granted')}
                className="flex-1 rounded-full border-b-4 border-[#b84d00] bg-gradient-to-b from-[#ffa53a] to-[#ff7a00] py-2 font-display text-lg text-white shadow-lg active:translate-y-0.5 active:border-b-2"
              >
                {t('consentAccept')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { LANGS, type Lang, t } from '../../data/i18n';

interface Props {
  lang: Lang;
  onChange: (lang: Lang) => void;
}

/** Desplegable de idioma del inicio, con el mismo estilo de píldoras y paneles del juego. */
export function LanguagePicker({ lang, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = LANGS.find((l) => l.id === lang) ?? LANGS[0];

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div ref={root} className="pointer-events-auto relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-center gap-2 rounded-full border-b-4 border-[#2f1566] bg-[#4a2490] px-6 py-2 font-display text-lg text-white shadow-lg active:translate-y-0.5 active:border-b-2"
      >
        <span className="text-white/60">{t('language')}</span>
        <span>
          {current.flag} {current.label}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-sm text-white/70">
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute inset-x-0 top-full z-50 mt-2 flex justify-center"
            initial={{ opacity: 0, scale: 0.9, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -6 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          >
            <ul
              role="listbox"
              aria-label={t('language')}
              className="w-full overflow-hidden rounded-2xl border-4 border-[#5a22a8] bg-gradient-to-b from-[#fff7e3] to-[#f7e7bf] p-1.5 shadow-2xl"
            >
              {LANGS.map((l) => {
                const selected = l.id === lang;
                return (
                  <li key={l.id}>
                    <button
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onChange(l.id);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-display text-lg ${
                        selected
                          ? 'bg-gradient-to-b from-[#ffa53a] to-[#ff7a00] text-white'
                          : 'text-[#5c4520] active:bg-[#f0d9a0]'
                      }`}
                    >
                      <span className="text-xl">{l.flag}</span>
                      <span className="flex-1">{l.label}</span>
                      {selected && <span>✓</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

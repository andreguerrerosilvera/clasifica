import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { type Lang, t } from '../../data/i18n';
import { AdBanner } from '../components/AdBanner';
import { LanguagePicker } from '../components/LanguagePicker';
import { IosInstallModal, Logo, PrivacyLink } from '../modals/Modals';
import { track } from '../../platform/analytics';
import { INSTALL_AFTER_LEVELS, useInstall } from '../../platform/install';

interface Props {
  nextLevelId: number;
  levelsCompleted: number;
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  onPlay: () => void;
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

export function HomeScreen({ nextLevelId, levelsCompleted, lang, onLangChange, onPlay }: Props) {
  const floaters = useMemo(() => makeFloaters(), []);
  const { platform, install, dismiss } = useInstall();
  const [iosGuide, setIosGuide] = useState(false);
  // Se ofrece instalar solo a quien ya jugó un poco: es cuando más sentido tiene volver.
  const offerInstall = !!platform && levelsCompleted >= INSTALL_AFTER_LEVELS;

  useEffect(() => {
    if (offerInstall && platform) track('install_prompt', { action: 'shown', platform });
  }, [offerInstall, platform]);

  const onInstall = async () => {
    if ((await install()) === 'ios') setIosGuide(true);
  };

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
            <p className="mt-2 font-display text-lg text-white [text-shadow:0_2px_0_#4a2290,0_0_10px_rgba(74,34,144,0.55)]">{t('tagline')}</p>
          </motion.div>

          {/* Siempre se juega el nivel en curso (el primero sin completar). El idioma va debajo, con el mismo ancho. */}
          <div className="mt-10 flex flex-col items-stretch gap-6 text-center">
            <button
              onClick={onPlay}
              className="pointer-events-auto rounded-full border-b-4 border-[#b84d00] bg-gradient-to-b from-[#ffa53a] to-[#ff7a00] px-12 py-3 font-display text-2xl tracking-wide text-white shadow-xl active:translate-y-0.5 active:border-b-2"
            >
              {t('playLevel', { n: nextLevelId })}
            </button>
            <LanguagePicker lang={lang} onChange={onLangChange} />
            {offerInstall && (
              <div className="pointer-events-auto flex flex-col items-center gap-1">
                <div className="flex w-full items-stretch gap-2">
                  <button
                    onClick={onInstall}
                    className="flex-1 rounded-full border-b-4 border-[#0f7f73] bg-gradient-to-b from-[#5ff0dd] to-[#21c2ae] px-5 py-2 font-display text-lg text-white shadow-lg [text-shadow:0_1px_0_rgba(0,0,0,.2)] active:translate-y-0.5 active:border-b-2"
                  >
                    {t('install')}
                  </button>
                  <button
                    onClick={dismiss}
                    aria-label={t('close')}
                    className="w-11 shrink-0 rounded-full border-b-4 border-[#2f1566] bg-[#4a2490] font-display text-lg text-white/80 shadow-lg active:translate-y-0.5 active:border-b-2"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm font-bold text-white/80">{t('installHint')}</p>
              </div>
            )}
            <PrivacyLink className="pointer-events-auto text-sm font-bold text-white/70" />
          </div>
        </div>
        {/* Publicidad abajo del todo, lejos de JUGAR y del idioma. */}
        <AdBanner placement="home" className="relative mt-auto" />
      </div>
      <AnimatePresence>{iosGuide && <IosInstallModal key="ios-install" onClose={() => setIosGuide(false)} />}</AnimatePresence>
    </div>
  );
}

import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { t } from '../../data/i18n';
import { AdBanner } from '../components/AdBanner';
import { Coin, LockIcon } from '../components/Icons';

function Backdrop({ children, peek = false }: { children: ReactNode; peek?: boolean }) {
  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#170b30]/75 px-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: peek ? 0 : 1 }}
      exit={{ opacity: 0 }}
    >
      {children}
    </motion.div>
  );
}

function Panel({ title, children, tone = 'red' }: { title: string; children: ReactNode; tone?: 'red' | 'blue' }) {
  const head =
    tone === 'red' ? 'from-[#ff5a3c] to-[#e62e1f] border-[#c41f12]' : 'from-[#a56cff] to-[#7a3cd6] border-[#5a22a8]';
  return (
    <motion.div
      initial={{ scale: 0.7, y: 30 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
      className={`w-full max-w-[340px] overflow-hidden rounded-2xl border-4 ${head.split(' ')[2]} bg-gradient-to-b ${head.split(' ').slice(0, 2).join(' ')} shadow-2xl`}
    >
      <h2 className="py-4 text-center font-display text-[28px] tracking-wide text-white drop-shadow-[0_2px_0_rgba(0,0,0,.25)]">
        {title}
      </h2>
      <div className="mx-1.5 mb-1.5 rounded-xl bg-gradient-to-b from-[#fff7e3] to-[#f7e7bf] px-5 py-6 text-center">
        {children}
      </div>
    </motion.div>
  );
}

function OrangeButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mx-auto flex items-center justify-center gap-2 rounded-full border-b-4 border-[#b84d00] bg-gradient-to-b from-[#ffa53a] to-[#ff7a00] px-8 py-3 font-display text-xl tracking-wide text-white shadow-lg active:translate-y-0.5 active:border-b-2 disabled:opacity-45"
    >
      {children}
    </button>
  );
}

function PeekHint({ onPeek }: { onPeek: (v: boolean) => void }) {
  return (
    <p
      className="mt-4 cursor-pointer select-none text-center font-black text-white"
      onPointerDown={() => onPeek(true)}
      onPointerUp={() => onPeek(false)}
      onPointerLeave={() => onPeek(false)}
      onPointerCancel={() => onPeek(false)}
    >
      {t('peek')}
    </p>
  );
}

export function OutOfMovesModal({
  canAfford,
  cost,
  extra,
  onPlayOn,
  onRetry,
}: {
  canAfford: boolean;
  cost: number;
  extra: number;
  onPlayOn: () => void;
  onRetry: () => void;
}) {
  const [peek, setPeek] = useState(false);
  return (
    <Backdrop peek={peek}>
      <div className="w-full max-w-[340px]">
        <Panel title={t('outOfMoves')}>
          <p className="mb-5 font-black text-[#5c4520]">{t('extraMoves', { n: extra })}</p>
          <OrangeButton onClick={onPlayOn} disabled={!canAfford}>
            {t('continue')}{' '}
            <span className="flex items-center gap-1 text-base opacity-90">
              <Coin />
              {cost}
            </span>
          </OrangeButton>
          {!canAfford && <p className="mt-2 text-xs font-bold text-[#a1452a]">{t('notEnoughCoins')}</p>}
          <button onClick={onRetry} className="mt-5 font-display text-lg text-[#5c4520] underline underline-offset-4">
            {t('retry')}
          </button>
        </Panel>
        <PeekHint onPeek={setPeek} />
      </div>
    </Backdrop>
  );
}

export function StuckModal({
  canUndo,
  undoCost,
  canUnlock,
  slotCost,
  onUndo,
  onUnlock,
  onRetry,
}: {
  canUndo: boolean;
  undoCost: number;
  canUnlock: boolean;
  slotCost: number;
  onUndo: () => void;
  onUnlock: () => void;
  onRetry: () => void;
}) {
  const [peek, setPeek] = useState(false);
  return (
    <Backdrop peek={peek}>
      <div className="w-full max-w-[340px]">
        <Panel title={t('stuck')}>
          <div className="flex flex-col gap-3">
            {canUnlock && (
              <OrangeButton onClick={onUnlock}>
                <LockIcon className="h-6 w-6" />
                {t('extraSlot')}{' '}
                <span className="flex items-center gap-1 text-base opacity-90">
                  <Coin />
                  {slotCost}
                </span>
              </OrangeButton>
            )}
            <OrangeButton onClick={onUndo} disabled={!canUndo}>
              {t('undoButton')}{' '}
              <span className="flex items-center gap-1 text-base opacity-90">
                <Coin />
                {undoCost}
              </span>
            </OrangeButton>
          </div>
          <button onClick={onRetry} className="mt-5 font-display text-lg text-[#5c4520] underline underline-offset-4">
            {t('retry')}
          </button>
        </Panel>
        <PeekHint onPeek={setPeek} />
      </div>
    </Backdrop>
  );
}

/**
 * Oferta de la casilla extra: con `price` se compra con monedas; sin él, viendo un anuncio recompensado.
 */
export function FreeSlotModal({
  moves,
  price,
  canAfford = true,
  onAccept,
  onClose,
}: {
  moves: number;
  price?: number;
  canAfford?: boolean;
  onAccept: () => void;
  onClose: () => void;
}) {
  const buy = price !== undefined;
  return (
    <Backdrop>
      <div className="w-full max-w-[340px]">
        <Panel title={t(buy ? 'buySlotTitle' : 'freeSlotTitle')} tone="blue">
          <div className="mb-3 text-[48px] leading-none">🎁</div>
          <p className="mb-5 font-black text-[#5c4520]">{t(buy ? 'buySlotText' : 'freeSlotText', { n: moves })}</p>
          {buy ? (
            <OrangeButton onClick={onAccept} disabled={!canAfford}>
              {t('buy')}{' '}
              <span className="flex items-center gap-1 text-base opacity-90">
                <Coin />
                {price}
              </span>
            </OrangeButton>
          ) : (
            <OrangeButton onClick={onAccept}>{t('watchAd')}</OrangeButton>
          )}
          <button onClick={onClose} className="mt-5 font-display text-lg text-[#5c4520] underline underline-offset-4">
            {t('notNow')}
          </button>
        </Panel>
      </div>
    </Backdrop>
  );
}

export function SettingsModal({
  onClose,
  onRestart,
  onCatalog,
  onExit,
}: {
  onClose: () => void;
  onRestart: () => void;
  onCatalog: () => void;
  onExit: () => void;
}) {
  return (
    <Backdrop>
      <div className="w-full max-w-[340px]">
        <Panel title={t('settings')} tone="blue">
          <div className="flex flex-col gap-3">
            <OrangeButton onClick={onRestart}>{t('restart')}</OrangeButton>
            <OrangeButton onClick={onCatalog}>{t('catalog')}</OrangeButton>
            <OrangeButton onClick={onExit}>{t('exit')}</OrangeButton>
          </div>
          <HowToPlay />
          <button onClick={onClose} className="mt-4 font-display text-lg text-[#5c4520] underline underline-offset-4">
            {t('close')}
          </button>
        </Panel>
      </div>
    </Backdrop>
  );
}

const HOW_TO = ['howTo1', 'howTo2', 'howTo3', 'howTo4', 'howTo5'] as const;

/** Convierte los tramos `<b>…</b>` de un texto traducido en negritas. */
const withBold = (s: string) => s.split(/<b>(.*?)<\/b>/).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part));

export function HowToPlay({ light = false }: { light?: boolean }) {
  const c = light ? 'text-white/85' : 'text-[#5c4520]';
  return (
    <ul className={`mt-5 space-y-3 text-left text-[14px] font-bold leading-snug ${c}`}>
      {HOW_TO.map((key) => {
        // El emoji va en su propia columna para que los textos queden alineados.
        const [icon, ...rest] = t(key).split(' ');
        return (
          <li key={key} className="flex items-start gap-2.5">
            <span className="w-5 shrink-0 text-center">{icon}</span>
            <span>{withBold(rest.join(' '))}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function WinScreen({ levelTitle, reward, onNext }: { levelTitle: string; reward: number; onNext: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvas.current) return;
    const fire = confetti.create(canvas.current, { resize: true });
    const colors = ['#ffd23f', '#3fe0d0', '#ff6b6b', '#ffffff', '#b58cff', '#ff9f1c'];
    const burst = () =>
      fire({
        particleCount: 70,
        startVelocity: 32,
        spread: 360,
        ticks: 90,
        gravity: 0.7,
        scalar: 0.8,
        shapes: ['circle'],
        colors,
        origin: { x: 0.15 + Math.random() * 0.7, y: 0.15 + Math.random() * 0.4 },
      });
    burst();
    const id = window.setInterval(burst, 650);
    return () => {
      window.clearInterval(id);
      fire.reset();
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <canvas ref={canvas} className="pointer-events-none absolute inset-0 h-full w-full" />
      <motion.div
        initial={{ scale: 0.2, rotate: -12 }}
        animate={{ scale: 1, rotate: -4 }}
        transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.15 }}
        className="relative text-center"
      >
        <Logo size="lg" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative mt-4 font-display text-2xl text-white"
      >
        {t('levelComplete', { level: levelTitle })}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="relative mt-2 flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1 font-display text-lg text-[#ffd23f]"
      >
        +{reward} <Coin className="h-6 w-6" />
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="relative mt-16"
      >
        <OrangeButton onClick={onNext}>{t('next')}</OrangeButton>
      </motion.div>
      {/* Publicidad abajo, bien separada de SIGUIENTE para evitar toques accidentales. */}
      <AdBanner placement="win" className="absolute bottom-6 left-1/2 -translate-x-1/2" />
    </motion.div>
  );
}

export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'text-[64px]' : 'text-[52px]';
  return (
    <h1
      className={`font-display ${cls} leading-[0.9] tracking-wide text-[#ffd23f] text-stroke drop-shadow-[0_5px_0_#7a3b00]`}
    >
      CLASIFICA!
    </h1>
  );
}

import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';

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
  const head = tone === 'red' ? 'from-[#ff5a3c] to-[#e62e1f] border-[#c41f12]' : 'from-[#a56cff] to-[#7a3cd6] border-[#5a22a8]';
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

function OrangeButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
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
      Mantén presionado para ver el tablero
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
        <Panel title="¡Sin movimientos!">
          <p className="mb-5 font-black text-[#5c4520]">Usa {extra} movimientos extra para continuar</p>
          <OrangeButton onClick={onPlayOn} disabled={!canAfford}>
            ▶ Seguir <span className="text-base opacity-90">🪙{cost}</span>
          </OrangeButton>
          {!canAfford && <p className="mt-2 text-xs font-bold text-[#a1452a]">No tienes monedas suficientes</p>}
          <button onClick={onRetry} className="mt-5 font-display text-lg text-[#5c4520] underline underline-offset-4">
            Reintentar
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
        <Panel title="¡Sin jugadas!">
          <p className="mb-5 font-black text-[#5c4520]">
            La bandeja está llena y ninguna carta encaja en las categorías visibles.
          </p>
          <div className="flex flex-col gap-3">
            {canUnlock && (
              <OrangeButton onClick={onUnlock}>
                🔓 Casilla extra <span className="text-base opacity-90">🪙{slotCost}</span>
              </OrangeButton>
            )}
            <OrangeButton onClick={onUndo} disabled={!canUndo}>
              ↩ Deshacer <span className="text-base opacity-90">🪙{undoCost}</span>
            </OrangeButton>
          </div>
          <button onClick={onRetry} className="mt-5 font-display text-lg text-[#5c4520] underline underline-offset-4">
            Reintentar
          </button>
        </Panel>
        <PeekHint onPeek={setPeek} />
      </div>
    </Backdrop>
  );
}

export function SettingsModal({
  onClose,
  onRestart,
  onExit,
}: {
  onClose: () => void;
  onRestart: () => void;
  onExit: () => void;
}) {
  return (
    <Backdrop>
      <div className="w-full max-w-[340px]">
        <Panel title="Ajustes" tone="blue">
          <div className="flex flex-col gap-3">
            <OrangeButton onClick={onRestart}>↻ Reiniciar nivel</OrangeButton>
            <OrangeButton onClick={onExit}>🏠 Volver al mapa</OrangeButton>
          </div>
          <HowToPlay />
          <button onClick={onClose} className="mt-4 font-display text-lg text-[#5c4520] underline underline-offset-4">
            Cerrar
          </button>
        </Panel>
      </div>
    </Backdrop>
  );
}

export function HowToPlay({ light = false }: { light?: boolean }) {
  const c = light ? 'text-white/85' : 'text-[#5c4520]';
  return (
    <ul className={`mt-5 space-y-1.5 text-left text-[13px] font-bold leading-snug ${c}`}>
      <li>🟨 Toca o arrastra cada carta hasta su <b>categoría amarilla</b>.</li>
      <li>📦 Si su categoría aún no aparece, guárdala en la <b>bandeja</b>.</li>
      <li>⬇️ Las cartas caen por columnas: libera huecos para ver más.</li>
      <li>❓ Las cartas <b>?</b> se revelan al retirar una carta vecina.</li>
      <li>🏁 Vacía el tablero antes de quedarte sin movimientos.</li>
    </ul>
  );
}

export function WinScreen({
  levelTitle,
  reward,
  onNext,
}: {
  levelTitle: string;
  reward: number;
  onNext: () => void;
}) {
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
        ¡{levelTitle} completado!
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="relative mt-2 rounded-full bg-white/10 px-4 py-1 font-display text-lg text-[#ffd23f]"
      >
        +{reward} 🪙
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="relative mt-16"
      >
        <OrangeButton onClick={onNext}>SIGUIENTE</OrangeButton>
      </motion.div>
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

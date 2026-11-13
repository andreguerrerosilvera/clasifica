/** Iconos del juego: gráficos de thiings.co optimizados en public/ (originales en assets/thiings/raw/). */
const BASE_URL: string = import.meta.env?.BASE_URL ?? '/';

function Icon({ src, className }: { src: string; className: string }) {
  return (
    <img
      src={`${BASE_URL}${src}`}
      alt=""
      aria-hidden
      draggable={false}
      className={`inline-block shrink-0 select-none object-contain ${className}`}
    />
  );
}

/** Moneda del juego. Mide 1.1em salvo que se indique otro tamaño. */
export const Coin = ({ className = 'h-[1.1em] w-[1.1em]' }: { className?: string }) => (
  <Icon src="coin.webp" className={className} />
);

/** Engranaje del botón de ajustes. */
export const SettingsIcon = ({ className = 'h-[1.1em] w-[1.1em]' }: { className?: string }) => (
  <Icon src="settings.webp" className={className} />
);

/** Candado de los elementos bloqueados (casillas de la bandeja por desbloquear). */
export const LockIcon = ({ className = 'h-[1.1em] w-[1.1em]' }: { className?: string }) => (
  <Icon src="lock.webp" className={className} />
);

/** Bombilla del botón de pista. */
export const HintIcon = ({ className = 'h-[1.1em] w-[1.1em]' }: { className?: string }) => (
  <Icon src="hint.webp" className={className} />
);

/** Imán del botón de imán. */
export const MagnetIcon = ({ className = 'h-[1.1em] w-[1.1em]' }: { className?: string }) => (
  <Icon src="magnet.webp" className={className} />
);

/** Flecha del botón de deshacer. */
export const UndoIcon = ({ className = 'h-[1.1em] w-[1.1em]' }: { className?: string }) => (
  <Icon src="undo.webp" className={className} />
);

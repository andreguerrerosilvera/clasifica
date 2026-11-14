import { useEffect, useRef, useSyncExternalStore } from 'react';
import { t } from '../../data/i18n';
import { AD_CLIENT, AD_PLACEHOLDERS, AD_TEST, AD_SLOTS, type AdPlacement, fillBanner } from '../../platform/ads';

/** Tamaño fijo de cada ubicación: el hueco se reserva antes de que cargue el anuncio (nada se mueve). */
const SIZES: Record<AdPlacement, { width: number; height: number }> = {
  home: { width: 320, height: 100 },
  win: { width: 320, height: 100 },
  side: { width: 160, height: 600 },
};

/** Ubicaciones que solo existen en pantallas anchas (los laterales no caben en móvil ni tablet vertical). */
const MEDIA: Partial<Record<AdPlacement, string>> = { side: '(min-width: 1024px)' };

function useMedia(query: string | undefined) {
  return useSyncExternalStore(
    (cb) => {
      if (!query) return () => {};
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => !query || window.matchMedia(query).matches,
  );
}

/**
 * Banner de display de AdSense. Sin ID de editor o de bloque no muestra nada
 * (salvo el recuadro de prueba en desarrollo / con VITE_ADS_PLACEHOLDER=on).
 */
export function AdBanner({ placement, className = '' }: { placement: AdPlacement; className?: string }) {
  const slot = AD_SLOTS[placement];
  const { width, height } = SIZES[placement];
  const ins = useRef<HTMLModElement>(null);
  const real = !!(AD_CLIENT && slot);
  const fits = useMedia(MEDIA[placement]);

  useEffect(() => {
    // En StrictMode el efecto corre dos veces: solo se pide anuncio si el <ins> aún no lo tiene.
    if (fits && real && ins.current && !ins.current.dataset.adsbygoogleStatus) fillBanner();
  }, [fits, real]);

  // No se monta (ni se pide anuncio) donde no cabe.
  if (!fits || (!real && !AD_PLACEHOLDERS)) return null;

  return (
    <aside className={`flex flex-col items-center ${className}`} aria-label={t('adLabel')}>
      <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/60">{t('adLabel')}</span>
      {real ? (
        <ins
          ref={ins}
          className="adsbygoogle"
          style={{ display: 'inline-block', width, height }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={slot}
          data-adtest={AD_TEST ? 'on' : undefined}
        />
      ) : (
        <div
          style={{ width, height }}
          className="flex items-center justify-center rounded-md border-2 border-dashed border-white/40 bg-black/20 text-center text-xs font-bold text-white/70"
        >
          {placement} · {width}×{height}
        </div>
      )}
    </aside>
  );
}

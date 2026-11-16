/**
 * Anuncios de AdSense (sin React, sin lógica de juego). Configuración en `.env.local` (ver `.env.example`).
 *
 * - Banners de display: `AD_SLOTS` + el componente `AdBanner`.
 * - Recompensados: con `VITE_ADSENSE_CLIENT` usa la Ad Placement API de Google para juegos HTML5
 *   (`adBreak({ type: 'reward' })`, requiere acceso a H5 Games Ads); sin él, un anuncio simulado
 *   (`SimulatedAd`). La recompensa solo se da si el anuncio se ve entero (`'rewarded'`).
 * - `VITE_ADS_TEST=on` pide anuncios de prueba a Google (nunca hagas clic en tus anuncios reales).
 */
import { getConsent, onConsentChange } from './consent';

export type AdResult = 'rewarded' | 'skipped' | 'unavailable';

/** ID de editor de AdSense (`ca-pub-…`). */
export const AD_CLIENT: string | undefined = import.meta.env.VITE_ADSENSE_CLIENT || undefined;
const CLIENT = AD_CLIENT;
/** Pide anuncios de prueba a Google (`VITE_ADS_TEST=on`). */
export const AD_TEST = import.meta.env.VITE_ADS_TEST === 'on';
const TEST = AD_TEST;

/** Bloques de anuncios de display (el `data-ad-slot` de cada uno, creados en AdSense). */
export const AD_SLOTS = {
  home: import.meta.env.VITE_ADSENSE_SLOT_HOME || undefined,
  win: import.meta.env.VITE_ADSENSE_SLOT_WIN || undefined,
  side: import.meta.env.VITE_ADSENSE_SLOT_SIDE || undefined,
} as const satisfies Record<string, string | undefined>;
export type AdPlacement = keyof typeof AD_SLOTS;

/** Recuadros de prueba donde irán los banners: en desarrollo o con `VITE_ADS_PLACEHOLDER=on`. */
export const AD_PLACEHOLDERS = import.meta.env.DEV || import.meta.env.VITE_ADS_PLACEHOLDER === 'on';

/* ---------------- Google Ad Placement API ---------------- */

interface PlacementInfo {
  breakStatus: string;
}
interface AdBreakOptions {
  type: 'reward';
  name: string;
  beforeAd?: () => void;
  afterAd?: () => void;
  beforeReward: (showAdFn: () => void) => void;
  adDismissed: () => void;
  adViewed: () => void;
  adBreakDone: (info: PlacementInfo) => void;
}
type AdsQueue = unknown[] & { push: (o: unknown) => number; requestNonPersonalizedAds?: 0 | 1 };
declare global {
  interface Window {
    adsbygoogle?: AdsQueue;
  }
}

const push = (o: object) => {
  window.adsbygoogle = window.adsbygoogle || ([] as unknown as AdsQueue);
  window.adsbygoogle.push(o);
};

/**
 * Anuncios personalizados salvo que el jugador rechace en el banner (src/platform/consent.ts);
 * si rechaza, se piden sin personalizar. Afecta a las siguientes peticiones. En el EEE, Reino
 * Unido y Suiza manda el aviso de consentimiento de Google (AdSense → Privacidad y mensajes).
 */
function applyAdConsent() {
  window.adsbygoogle = window.adsbygoogle || ([] as unknown as AdsQueue);
  window.adsbygoogle.requestNonPersonalizedAds = getConsent() === 'denied' ? 1 : 0;
}

// El script de AdSense se carga una sola vez, al arrancar, si hay ID de editor.
if (CLIENT && typeof document !== 'undefined') {
  applyAdConsent();
  onConsentChange(applyAdConsent);
  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(CLIENT)}`;
  if (TEST) s.dataset.adbreakTest = 'on';
  document.head.appendChild(s);
}

/** Pide un anuncio para un `<ins class="adsbygoogle">` recién montado. */
export function fillBanner() {
  push({});
}

let h5Configured = false;
function googleRewarded(name: string): Promise<AdResult> {
  if (!h5Configured) {
    h5Configured = true;
    push({ preloadAdBreaks: 'on', sound: 'off' }); // adConfig de la Ad Placement API
  }
  return new Promise((resolve) => {
    let result: AdResult = 'unavailable';
    const opts: AdBreakOptions = {
      type: 'reward',
      name,
      beforeReward: (showAdFn) => showAdFn(),
      adDismissed: () => (result = 'skipped'),
      adViewed: () => (result = 'rewarded'),
      // Siempre se llama al final, haya habido anuncio o no (sin inventario, límite de frecuencia…).
      adBreakDone: () => resolve(result),
    };
    push(opts);
  });
}

/* ---------------- Anuncio simulado ---------------- */

type Listener = (open: boolean) => void;
let pending: ((r: AdResult) => void) | null = null;
const listeners = new Set<Listener>();

/** Para `SimulatedAd`: avisa cuando hay que mostrar u ocultar el anuncio simulado. */
export function onSimulatedAd(fn: Listener) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

/** Para `SimulatedAd`: cierra el anuncio simulado con su resultado. */
export function finishSimulatedAd(r: AdResult) {
  const done = pending;
  pending = null;
  listeners.forEach((fn) => fn(false));
  done?.(r);
}

function simulatedRewarded(): Promise<AdResult> {
  if (pending || listeners.size === 0) return Promise.resolve('unavailable');
  return new Promise((resolve) => {
    pending = resolve;
    listeners.forEach((fn) => fn(true));
  });
}

/* ---------------- API ---------------- */

/** `true` si se usan anuncios de verdad (Google); `false` si son simulados. */
export const REAL_ADS = !!CLIENT;

/** Muestra un anuncio recompensado y resuelve con el resultado. */
export function showRewardedAd(name: string): Promise<AdResult> {
  return CLIENT ? googleRewarded(name) : simulatedRewarded();
}

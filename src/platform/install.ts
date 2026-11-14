/**
 * Instalar Clasifica como app (PWA).
 *
 * - Android / Chrome / Edge: el navegador lanza `beforeinstallprompt`; lo guardamos y lo mostramos
 *   con nuestro propio botón, en un buen momento (no en la primera visita).
 * - iPhone / iPad: Safari no permite abrir el diálogo; se muestra una guía para "Añadir a pantalla de inicio".
 */
import { useSyncExternalStore } from 'react';
import { track } from './analytics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallPlatform = 'android' | 'ios';

/** Niveles superados antes de ofrecer la instalación. */
export const INSTALL_AFTER_LEVELS = 2;
/** Tras cerrar la oferta, no se vuelve a mostrar en estos días. */
const SNOOZE_DAYS = 7;
const SNOOZE_KEY = 'clasifica-install-snooze';

export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true);

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

let deferred: BeforeInstallPromptEvent | null = null;
let installed = isStandalone();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // sin el mini-banner del navegador: lo ofrecemos nosotros
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  // iPhone no avisa al instalar: lo contamos la primera vez que se abre desde la pantalla de inicio.
  if (installed && isIOS()) {
    try {
      if (!localStorage.getItem('clasifica-installed')) {
        localStorage.setItem('clasifica-installed', '1');
        track('app_installed', { platform: 'ios' });
      }
    } catch {
      /* almacenamiento no disponible */
    }
  }
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    track('app_installed', { platform: 'android' });
    notify();
  });
}

function snoozed() {
  try {
    const until = Number(localStorage.getItem(SNOOZE_KEY) ?? 0);
    return Date.now() < until;
  } catch {
    return false;
  }
}

function snooze() {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 86_400_000));
  } catch {
    /* almacenamiento no disponible */
  }
  notify();
}

/** Plataforma en la que se puede ofrecer instalar ahora mismo, o null. */
function available(): InstallPlatform | null {
  if (installed || snoozed()) return null;
  if (deferred) return 'android';
  if (isIOS()) return 'ios';
  return null;
}

export function useInstall() {
  const platform = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => void listeners.delete(cb);
    },
    available,
  );

  /** Android: abre el diálogo del navegador. iOS: devuelve 'ios' para mostrar la guía. */
  const install = async (): Promise<'accepted' | 'dismissed' | 'ios'> => {
    if (platform === 'ios') {
      track('install_prompt', { action: 'ios_guide', platform: 'ios' });
      return 'ios';
    }
    if (!deferred) return 'dismissed';
    const e = deferred;
    await e.prompt();
    const { outcome } = await e.userChoice;
    track('install_prompt', { action: outcome, platform: 'android' });
    deferred = null;
    if (outcome === 'dismissed') snooze();
    else notify();
    return outcome;
  };

  const dismiss = () => {
    if (platform) track('install_prompt', { action: 'dismissed', platform });
    snooze();
  };

  return { platform, install, dismiss };
}

/** Registra el service worker (solo en el build de producción normal, no en el de un solo archivo). */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || import.meta.env.MODE === 'single' || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

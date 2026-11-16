/**
 * Consentimiento del jugador para analíticas y anuncios personalizados (sin React).
 *
 * - Sin respuesta (`null`): no se carga PostHog; los anuncios se personalizan.
 * - `granted`: se activan las analíticas y los anuncios personalizados.
 * - `denied`: nada de analíticas y anuncios sin personalizar.
 *
 * La respuesta se guarda en localStorage y se puede cambiar desde los ajustes (`reopenConsent`).
 */
export type Consent = 'granted' | 'denied';

const KEY = 'clasifica-consent';

function load(): Consent | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

let current: Consent | null = load();
let reopened = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

export const getConsent = () => current;

/** `true` si hay que mostrar el banner: aún no respondió o lo abrió desde los ajustes. */
export const consentPending = () => current === null || reopened;

export function setConsent(choice: Consent) {
  current = choice;
  reopened = false;
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    /* almacenamiento no disponible: se volverá a preguntar en la próxima visita */
  }
  emit();
}

/** Vuelve a mostrar el banner para que el jugador cambie su elección. */
export function reopenConsent() {
  reopened = true;
  emit();
}

export function onConsentChange(fn: () => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

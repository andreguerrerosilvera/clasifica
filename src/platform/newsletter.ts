/**
 * Lista de correo: tras superar el nivel 1 se pide el email para avisar de juegos nuevos y
 * actualizaciones. Se envía a la función de Netlify `/api/subscribe` (netlify/functions/subscribe.ts),
 * que lo agrega a la lista de Brevo.
 */
import { getLang } from '../data/i18n';

/**
 * Respuesta del jugador guardada en una cookie (un año): si declinó o ya se suscribió,
 * el modal no se vuelve a mostrar. Si cierra el juego sin responder, se ofrece de nuevo.
 */
const COOKIE = 'clasifica_email';
const MAX_AGE = 60 * 60 * 24 * 365;
export type EmailChoice = 'declined' | 'subscribed';

export function emailChoice(): EmailChoice | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=(declined|subscribed)`));
  return m ? (m[1] as EmailChoice) : null;
}

export function saveEmailChoice(choice: EmailChoice) {
  if (typeof document === 'undefined') return;
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE}=${choice}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

/** Nivel tras el que se pide el email. */
export const EMAIL_AFTER_LEVEL = 1;

export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** Envía el email a la lista de Brevo. Devuelve `false` si falla la red o el servidor. */
export async function subscribe(email: string): Promise<boolean> {
  try {
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), lang: getLang() }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

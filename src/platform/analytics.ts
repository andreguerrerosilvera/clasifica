/**
 * Analíticas con PostHog. Solo se activan en el dominio de producción (`clasifica.andregames.co`)
 * y con `VITE_POSTHOG_KEY`: en local, previews de Netlify o `*.netlify.app` no se envía nada
 * y la librería ni siquiera se descarga (import dinámico).
 */
import type { PostHog } from 'posthog-js';

const PROD_HOST = 'clasifica.andregames.co';
const KEY: string | undefined = import.meta.env.VITE_POSTHOG_KEY || undefined;
const API_HOST: string = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

export const ANALYTICS_ENABLED = !!KEY && typeof window !== 'undefined' && window.location.hostname === PROD_HOST;

/* ---------------- Catálogo de eventos ---------------- */

export type Booster = 'hint' | 'undo' | 'magnet' | 'tray_slot' | 'bonus_slot' | 'play_on';
export type EndReason = 'out_of_moves' | 'stuck';
export type RestartSource = 'settings' | 'out_of_moves' | 'stuck';

interface LevelProps {
  level: number;
  difficulty: string;
}

interface RunProps extends LevelProps {
  /** intento dentro de esta visita al nivel (1 = primero) */
  attempt: number;
  moves_left: number;
  moves_used: number;
  placed: number;
  total_items: number;
  progress_pct: number;
  duration_s: number;
  /** cartas soltadas en una categoría equivocada */
  mistakes: number;
  boosters_used: number;
  bonus_unlocked: boolean;
}

export interface Events {
  level_started: LevelProps & { attempt: number; moves: number; categories: number; total_items: number; hidden_cards: number };
  level_won: RunProps & { reward: number };
  level_failed: RunProps & { reason: EndReason };
  level_restarted: RunProps & { source: RestartSource };
  level_abandoned: RunProps;
  category_completed: LevelProps & { category: string; order: number; by_magnet: boolean };
  booster_used: LevelProps & { booster: Booster; cost: number; via: 'coins' | 'ad' };
  not_enough_coins: LevelProps & { booster: Booster; cost: number; coins: number };
  rewarded_ad: { placement: string; result: 'rewarded' | 'skipped' | 'unavailable' };
  free_slot_offer: LevelProps & { action: 'shown' | 'accepted' | 'dismissed' };
  catalog_opened: { from: 'settings' };
  language_changed: { from: string; to: string };
}

/* ---------------- Envío ---------------- */

let client: PostHog | null = null;
const queue: [string, object][] = [];
let context: Record<string, string | number | boolean> = {};

if (ANALYTICS_ENABLED) {
  void import('posthog-js').then(({ default: posthog }) => {
    posthog.init(KEY!, {
      api_host: API_HOST,
      defaults: '2025-05-24',
      person_profiles: 'identified_only',
      // El juego es todo arrastres: el autocapture solo metería ruido. Se envían eventos a mano.
      autocapture: false,
      capture_pageview: true,
      capture_pageleave: true,
      disable_session_recording: true,
      persistence: 'localStorage',
    });
    posthog.register(context);
    client = posthog;
    for (const [name, props] of queue.splice(0)) posthog.capture(name, props);
  });
}

export function track<E extends keyof Events>(event: E, props: Events[E]) {
  if (!ANALYTICS_ENABLED) return;
  if (client) client.capture(event, props);
  else queue.push([event, props]);
}

/** Propiedades que viajan con todos los eventos (idioma, niveles superados, monedas). */
export function setContext(props: Record<string, string | number | boolean>) {
  if (!ANALYTICS_ENABLED) return;
  context = { ...context, ...props };
  client?.register(props);
}

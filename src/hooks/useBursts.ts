import { useState } from 'react';
import type { Card } from '../models/types';

export interface Burst {
  key: string;
  rect: DOMRect;
  label: string;
}

/** Destellos sobre las cartas de categoría recién completadas (mide su posición en el DOM). */
export function useBursts() {
  const [bursts, setBursts] = useState<Burst[]>([]);

  const burstFor = (cards: Card[]) => {
    const add: Burst[] = [];
    for (const c of cards) {
      const el = document.querySelector(`[data-card="${c.id}"]`);
      if (el) add.push({ key: `${c.id}-${Date.now()}`, rect: el.getBoundingClientRect(), label: c.label });
    }
    if (!add.length) return;
    setBursts((b) => [...b, ...add]);
    window.setTimeout(() => setBursts((b) => b.filter((x) => !add.includes(x))), 1000);
  };

  return { bursts, burstFor };
}

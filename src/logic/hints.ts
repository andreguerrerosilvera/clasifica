import type { Card, GameState, Hint } from '../models/types';
import { activeCategory, canPlace, freeTraySlot, pickableBoardItems, placeItem } from './board';

/** Imán: coloca todas las cartas disponibles de la categoría con más coincidencias. */
export function magnet(prev: GameState): { state: GameState; placedIds: string[]; completed: Card[] } | null {
  const candidates = [...prev.tray.filter((c): c is Card => !!c), ...pickableBoardItems(prev)].filter((c) =>
    canPlace(prev, c),
  );
  if (!candidates.length) return null;
  const counts = new Map<string, number>();
  for (const c of candidates) counts.set(c.cat, (counts.get(c.cat) ?? 0) + 1);
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];

  let s = prev;
  const placedIds: string[] = [];
  const completed: Card[] = [];
  // Repite porque al caer las columnas pueden aparecer más cartas de la categoría.
  for (let guard = 0; guard < 40; guard++) {
    const next = [...s.tray.filter((c): c is Card => !!c), ...pickableBoardItems(s)].find(
      (c) => c.cat === best && canPlace(s, c),
    );
    if (!next) break;
    const r = placeItem(s, next.id, false)!;
    s = r.state;
    placedIds.push(next.id);
    if (r.completedCategory) completed.push(r.completedCategory);
  }
  return { state: s, placedIds, completed };
}

export function findHint(s: GameState): Hint {
  const fromTray = s.tray.find((c) => c && canPlace(s, c));
  if (fromTray) return { itemId: fromTray.id, target: activeCategory(s, fromTray.cat)!.id };
  const items = pickableBoardItems(s);
  const direct = items.find((c) => canPlace(s, c));
  if (direct) return { itemId: direct.id, target: activeCategory(s, direct.cat)!.id };
  if (freeTraySlot(s) !== -1 && items.length) return { itemId: chooseTrayCandidate(s, items).id, target: 'tray' };
  return null;
}

/** Heurística: guardar en la bandeja la carta cuya categoría está más cerca de revelarse. */
function chooseTrayCandidate(s: GameState, items: Card[]): Card {
  const depth = (cat: string) => {
    const i = s.pending.findIndex((c) => c.cat === cat);
    return i === -1 ? 999 : i;
  };
  return [...items].sort((a, b) => depth(a.cat) - depth(b.cat))[0];
}

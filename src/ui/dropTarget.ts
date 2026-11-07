import type { DropTarget } from '../models/types';

/** Busca el destino (categoría o bandeja) bajo un punto de la pantalla. */
export function dropTargetAt(clientX: number, clientY: number): DropTarget {
  for (const el of document.elementsFromPoint(clientX, clientY)) {
    const t = (el as HTMLElement).closest?.('[data-drop]') as HTMLElement | null;
    if (t) return t.dataset.drop ?? null;
  }
  return null;
}

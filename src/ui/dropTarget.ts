import type { DropTarget } from '../models/types';

/** Busca el destino (categoría o bandeja) bajo un punto de la pantalla. */
export function dropTargetAt(clientX: number, clientY: number, exclude?: Element | null): DropTarget {
  for (const el of document.elementsFromPoint(clientX, clientY)) {
    // Ignora la propia carta arrastrada (vive dentro de su columna, que también puede ser destino)
    if (exclude && exclude.contains(el)) continue;
    const t = (el as HTMLElement).closest?.('[data-drop]') as HTMLElement | null;
    if (t) return t.dataset.drop ?? null;
  }
  return null;
}

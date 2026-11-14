import { motion } from 'framer-motion';
import { useDeferredValue, useMemo, useState } from 'react';
import { type CatalogEntry, catalogEntries } from '../../data/catalog';
import { t } from '../../data/i18n';

/** Texto comparable: sin tildes ni mayúsculas ("Plátano" → "platano"). */
const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/**
 * Filtra el catálogo: si el nombre de la categoría coincide se muestra entera; si no, solo
 * los objetos que coinciden (y la categoría desaparece si no queda ninguno).
 */
function filterCatalog(entries: CatalogEntry[], query: string): CatalogEntry[] {
  const q = fold(query);
  if (!q) return entries;
  const out: CatalogEntry[] = [];
  for (const cat of entries) {
    if (fold(cat.name).includes(q)) {
      out.push(cat);
      continue;
    }
    const items = cat.items.filter((it) => fold(it.name).includes(q));
    if (items.length) out.push({ ...cat, items });
  }
  return out;
}

/** Listado de todas las categorías con sus objetos, con buscador. Se abre desde Ajustes. */
export function CatalogScreen({ onClose }: { onClose: () => void }) {
  const entries = useMemo(() => catalogEntries(), []);
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const results = useMemo(() => filterCatalog(entries, deferred), [entries, deferred]);
  const itemCount = results.reduce((n, c) => n + c.items.length, 0);

  return (
    <motion.div
      className="fixed inset-0 z-[85] flex justify-center bg-gradient-to-b from-[#c9a2ff] via-[#9d6af0] to-[#6a35c4]"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex h-full w-full max-w-[440px] flex-col">
        <header className="shrink-0 px-4 pb-3 pt-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              aria-label={t('back')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-b-4 border-[#5a22a8] bg-[#7a3cd6] font-display text-2xl text-white shadow active:translate-y-0.5 active:border-b-2"
            >
              ←
            </button>
            <h2 className="font-display text-[28px] tracking-wide text-white drop-shadow-[0_2px_0_rgba(0,0,0,.25)]">
              {t('catalogTitle')}
            </h2>
          </div>
          <div className="relative mt-3">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">🔍</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('catalogSearch')}
              aria-label={t('catalogSearch')}
              className="w-full rounded-full border-2 border-[#5a22a8] bg-cream py-2.5 pl-11 pr-4 font-body text-base font-bold text-[#5c4520] shadow-inner outline-none placeholder:text-[#a08a5c] focus:border-[#ffd23f]"
            />
          </div>
          <p className="mt-2 px-1 text-xs font-black text-white/80">
            {t('catalogCount', { n: results.length, m: itemCount })}
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
          {results.length === 0 ? (
            <p className="mt-10 text-center font-display text-lg text-white">{t('catalogEmpty', { q: query.trim() })}</p>
          ) : (
            <ul className="space-y-4">
              {results.map((cat) => (
                <li key={cat.id} className="overflow-hidden rounded-2xl border-4 border-[#5a22a8] bg-[#7a3cd6] shadow-lg">
                  <h3 className="flex items-baseline justify-between px-4 py-2 font-display text-xl tracking-wide text-white">
                    <span>{cat.name}</span>
                    <span className="text-sm text-white/70">{cat.items.length}</span>
                  </h3>
                  <ul className="mx-1 mb-1 grid grid-cols-3 gap-2 rounded-xl bg-gradient-to-b from-[#fff7e3] to-[#f7e7bf] p-2.5 sm:grid-cols-4">
                    {cat.items.map((it) => (
                      <li
                        key={it.id}
                        className="flex flex-col items-center gap-1 rounded-lg bg-white/70 px-1 py-2 text-center shadow-[0_2px_0_#e3cf9c]"
                      >
                        <img
                          src={it.image}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-12 w-12 object-contain"
                        />
                        <span className="text-[12px] font-black leading-tight text-[#5c4520]">{it.name}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
}

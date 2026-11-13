/**
 * Descarga las imágenes del catálogo (content/categorias_thiings.json) y genera su versión optimizada.
 *
 *   npm run images            descarga lo que falte y optimiza lo que falte
 *   npm run images -- --force vuelve a optimizar todo (p. ej. al cambiar SIZE o QUALITY)
 *
 * - assets/thiings/raw/<slug>.png   imagen original de thiings.co (1024×1024, ~1,5 MB; no va a git)
 * - public/thiings/<slug>.webp      versión para el juego (SIZE px, WebP con transparencia, ~7 KB)
 *
 * Requiere `cwebp` (brew install webp).
 */
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const SIZE = 192;
const QUALITY = 80;
const CONCURRENCY = 8;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DIR = join(root, 'assets/thiings/raw');
const OUT_DIR = join(root, 'public/thiings');
const force = process.argv.includes('--force');
const run = promisify(execFile);

interface ThiingsFile {
  categorias: { objetos: { slug: string; imagen: string }[] }[];
}

const catalog: ThiingsFile = JSON.parse(readFileSync(join(root, 'content/categorias_thiings.json'), 'utf8'));
const images = new Map<string, string>();
for (const c of catalog.categorias) for (const o of c.objetos) images.set(o.slug, o.imagen);

mkdirSync(RAW_DIR, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

async function download(slug: string, url: string) {
  const file = join(RAW_DIR, `${slug}.png`);
  if (existsSync(file)) return false;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      return true;
    } catch (e) {
      if (attempt === 3) throw new Error(`${slug}: ${(e as Error).message}`);
    }
  }
}

async function optimize(slug: string) {
  const out = join(OUT_DIR, `${slug}.webp`);
  if (!force && existsSync(out)) return false;
  const raw = join(RAW_DIR, `${slug}.png`);
  await run('cwebp', ['-quiet', '-q', String(QUALITY), '-alpha_q', '90', '-m', '6', '-resize', String(SIZE), '0', raw, '-o', out]);
  return true;
}

let downloaded = 0;
let optimized = 0;
const failed: string[] = [];
const queue = [...images];
let done = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let next = queue.shift(); next; next = queue.shift()) {
      const [slug, url] = next;
      try {
        if (await download(slug, url)) downloaded++;
        if (await optimize(slug)) optimized++;
      } catch (e) {
        failed.push((e as Error).message);
      }
      if (++done % 100 === 0) console.log(`${done}/${images.size}`);
    }
  }),
);

// Imágenes optimizadas de objetos que ya no están en el catálogo.
let removed = 0;
for (const f of readdirSync(OUT_DIR))
  if (f.endsWith('.webp') && !images.has(f.slice(0, -5))) {
    rmSync(join(OUT_DIR, f));
    removed++;
  }

console.log({ objetos: images.size, descargadas: downloaded, optimizadas: optimized, borradas: removed, fallidas: failed.length });
if (failed.length) {
  console.error(failed.join('\n'));
  process.exit(1);
}

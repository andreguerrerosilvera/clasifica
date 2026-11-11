/**
 * Genera el tablero fijo (layout) y los movimientos de un nivel y los escribe en su JSON.
 *
 *   npm run level:layout -- content/levels/04.json [--seed 7] [--hidden 0.2] [--margin 1.3]
 *
 *   --seed    semilla base (por defecto, el id del nivel)
 *   --hidden  proporción de cartas "?" (0 a 0.45, por defecto 0)
 *   --margin  moves = pasos del solver × margin (por defecto 1.3)
 *
 * Después de generarlo puedes editar el JSON a mano (mover cartas, cambiar "moves"...).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasAnyMove } from '../src/logic/board';
import { createLevel, itemKey } from '../src/logic/generator';
import { mulberry32, shuffle } from '../src/logic/rng';
import { COLS, ITEM_COLS, MIN_CATEGORIES } from '../src/logic/rules';
import { solve } from '../src/logic/solver';
import type { DifficultyDef, DifficultyId, LevelDef } from '../src/models/types';
import { type RawLevel, validateLayout } from '../src/data/resolve';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const opt = (name: string, fallback: number) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(args[i + 1]);
};
if (!file) {
  console.error('Uso: npm run level:layout -- content/levels/NN.json [--seed N] [--hidden R] [--margin F]');
  process.exit(1);
}

const path = resolve(file);
const raw: RawLevel = JSON.parse(readFileSync(path, 'utf8'));
const difficulties: Record<string, { openSlots: number }> = JSON.parse(
  readFileSync(resolve(root, 'content/difficulties.json'), 'utf8'),
);
const seed = opt('seed', raw.id);
const hiddenRatio = Math.min(0.45, opt('hidden', 0));
const margin = opt('margin', 1.3);
const diff: DifficultyDef = {
  id: raw.difficulty as DifficultyId,
  label: '',
  description: '',
  openSlots: difficulties[raw.difficulty].openSlots,
};

if (raw.categories.length < MIN_CATEGORIES) {
  console.error(`El nivel debe tener al menos ${MIN_CATEGORIES} categorías distintas (tiene ${raw.categories.length}).`);
  process.exit(1);
}

// Las etiquetas no importan para generar: se usan los ids.
const categories = raw.categories.map((c) => ({
  id: c.id,
  icon: c.icon,
  name: c.id,
  items: c.items.map((i) => ({ id: i.id, emoji: i.emoji, name: i.id })),
}));
const keys = categories.flatMap((c) => c.items.map((i) => itemKey(c.id, i.id)));
const totalItems = keys.length;

let fallback: { layout: NonNullable<RawLevel['layout']>; moves: number } | null = null;
let result = null as typeof fallback;
for (let attempt = 0; attempt < 600 && !result; attempt++) {
  const rnd = mulberry32(seed + attempt * 31);
  const order = shuffle(keys, rnd);
  const hidden = order.filter(() => rnd() < hiddenRatio);
  const categoryOrder = shuffle(
    categories.map((c) => c.id),
    rnd,
  );
  const columns: string[][] = Array.from({ length: COLS }, () => []);
  order.forEach((k, i) => columns[ITEM_COLS[i % ITEM_COLS.length]].push(k));
  const layout = { columns, hidden, categoryOrder };

  const level: LevelDef = { id: raw.id, title: '', subtitle: '', difficulty: diff.id, moves: 1, categories, layout };
  const state = createLevel(level, diff);
  if (!hasAnyMove(state)) continue;
  const steps = solve(state);
  if (steps === null) continue;
  const candidate = { layout, moves: Math.ceil(steps * margin) };
  // Evita tableros triviales: preferimos los que exigen algo de bandeja.
  if (steps > totalItems || attempt > 200) result = candidate;
  else fallback ??= candidate;
}
result ??= fallback;
if (!result) {
  console.error('No se encontró un tablero resoluble; prueba otra --seed.');
  process.exit(1);
}

raw.moves = result.moves;
raw.layout = result.layout;
validateLayout(raw, file);

// Orden de claves estable y columnas en una línea cada una para que sea legible.
const { layout, ...rest } = raw;
const body = JSON.stringify(rest, null, 2)
  .replace(/\n}$/, '')
  .replace(/\{\s+("id": "[^"]+"),\s+("emoji": "[^"]+")\s+\}/g, '{ $1, $2 }');
const cols = layout!.columns.map((c) => `      ${JSON.stringify(c)}`).join(',\n');
const out =
  `${body},\n  "layout": {\n    "columns": [\n${cols}\n    ],\n` +
  `    "hidden": ${JSON.stringify(layout!.hidden)},\n` +
  `    "categoryOrder": ${JSON.stringify(layout!.categoryOrder)}\n  }\n}\n`;
writeFileSync(path, out);
console.log(`${file}: ${totalItems} cartas, ${layout!.hidden.length} ocultas, moves = ${raw.moves}`);

import difficultiesJson from '../../content/difficulties.json';
import generationJson from '../../content/generation.json';
import { type GenerationConfig, difficultyForLevel, generateLevel } from '../logic/levelGen';
import type { DifficultyDef, DifficultyId, LevelDef, RawLevel } from '../models/types';
import { CATALOG, catalogTexts, sharedItemConflicts } from './catalog';
import { type Lang, getLang } from './i18n';
import { resolveDifficulties, resolveLevel } from './resolve';

/**
 * No hay niveles fijos: cada nivel se genera con las categorías de content/categorias_thiings.json
 * la primera vez que se juega, y se reutiliza el guardado hasta que el jugador lo supera.
 */
/**
 * Dificultades con sus etiquetas, una vez por idioma. Tienen que ser siempre los mismos objetos:
 * useGame las usa como dependencia y uno nuevo en cada render reiniciaría la partida sin parar.
 */
const difficultiesByLang = new Map<Lang, Record<DifficultyId, DifficultyDef>>();
function difficulties() {
  const lang = getLang();
  let d = difficultiesByLang.get(lang);
  if (!d) difficultiesByLang.set(lang, (d = resolveDifficulties(difficultiesJson, catalogTexts())));
  return d;
}
difficulties(); // valida difficulties.json al cargar

const MANUAL = generationJson as GenerationConfig;
for (const pair of MANUAL.conflicts)
  for (const id of pair)
    if (!CATALOG[id]) throw new Error(`[content] generation.json: "conflicts" referencia la categoría ${id}, que no existe`);
/** Conflictos: los de generation.json (temas parecidos) + los pares que comparten algún objeto. */
const GENERATION: GenerationConfig = { ...MANUAL, conflicts: [...MANUAL.conflicts, ...sharedItemConflicts(CATALOG)] };

export const getDifficulty = (id: DifficultyId): DifficultyDef => difficulties()[id];
/** Parámetros de dificultad con los que está marcado un nivel */
export const difficultyOf = (level: LevelDef) => getDifficulty(level.difficulty);

/** Primer nivel sin completar (los niveles no se acaban nunca). */
export function nextLevelId(completed: number[]): number {
  const done = new Set(completed);
  let id = 1;
  while (done.has(id)) id++;
  return id;
}

/** Valida un nivel guardado; null si ya no encaja con el contenido actual (p. ej. se quitó una categoría). */
function resolveSaved(raw: RawLevel): LevelDef | null {
  try {
    return resolveLevel(raw, `nivel guardado ${raw.id}`, catalogTexts());
  } catch {
    return null;
  }
}

/**
 * Nivel para jugar `id`: el guardado (`saved`) si es ese nivel, o uno nuevo generado ahora.
 * Devuelve `created` cuando hubo que generarlo, para guardarlo.
 */
export function levelFor(id: number, saved: RawLevel | null): { level: LevelDef; created: RawLevel | null } {
  if (saved?.id === id) {
    const level = resolveSaved(saved);
    if (level) return { level: preload(level), created: null };
  }
  const diff = getDifficulty(difficultyForLevel(id, GENERATION));
  const seed = Math.floor(Math.random() * 2 ** 31);
  const raw = generateLevel(id, seed, CATALOG, GENERATION, diff);
  return { level: preload(resolveLevel(raw, `nivel generado ${id}`, catalogTexts())), created: raw };
}

/** Descarga de antemano las imágenes del nivel, para que no aparezcan tarde al revelar cartas. */
function preload(level: LevelDef): LevelDef {
  if (typeof Image !== 'undefined')
    for (const c of level.categories)
      for (const i of c.items) if (i.emoji.includes('/')) new Image().src = i.emoji;
  return level;
}

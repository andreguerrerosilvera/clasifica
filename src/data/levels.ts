import difficultiesJson from '../../content/difficulties.json';
import type { DifficultyDef, DifficultyId, LevelDef } from '../models/types';
import { texts } from './i18n';
import { type RawLevel, resolveDifficulties, resolveLevel } from './resolve';

/** Los niveles viven en content/levels/*.json: cada archivo es un nivel con su tablero fijo. */
const files = import.meta.glob<RawLevel>('../../content/levels/*.json', { eager: true, import: 'default' });

export const DIFFICULTIES = resolveDifficulties(difficultiesJson, texts);

export const LEVELS: LevelDef[] = Object.entries(files)
  .map(([path, raw]) => resolveLevel(raw, path.split('/').pop()!, texts))
  .sort((a, b) => a.id - b.id);

const ids = LEVELS.map((l) => l.id);
if (new Set(ids).size !== ids.length) throw new Error('[content] hay niveles con el mismo "id"');

export const getLevel = (id: number) => LEVELS.find((l) => l.id === id)!;
export const getDifficulty = (id: DifficultyId): DifficultyDef => DIFFICULTIES[id];
/** Parámetros de dificultad con los que está marcado un nivel */
export const difficultyOf = (level: LevelDef) => getDifficulty(level.difficulty);

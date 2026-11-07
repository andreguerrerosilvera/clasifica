import { useEffect, useState } from 'react';
import { GameScreen } from './components/GameScreen';
import { HomeScreen } from './components/HomeScreen';
import { LEVELS } from './game/levels';
import type { DifficultyId } from './game/types';

interface Save {
  coins: number;
  difficulty: DifficultyId;
  completed: Record<DifficultyId, number[]>;
}

const KEY = 'clasifica-save-v1';
const DEFAULT: Save = { coins: 300, difficulty: 'normal', completed: { facil: [], normal: [], dificil: [] } };

function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    /* almacenamiento no disponible */
  }
  return DEFAULT;
}

export default function App() {
  const [save, setSave] = useState<Save>(load);
  const [screen, setScreen] = useState<{ name: 'home' } | { name: 'game'; levelId: number }>({ name: 'home' });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(save));
    } catch {
      /* ignorar */
    }
  }, [save]);

  const spend = (n: number) => {
    if (save.coins < n) return false;
    setSave((s) => ({ ...s, coins: s.coins - n }));
    return true;
  };

  const onWin = (levelId: number, reward: number) =>
    setSave((s) => {
      const done = s.completed[s.difficulty];
      return {
        ...s,
        coins: s.coins + reward,
        completed: { ...s.completed, [s.difficulty]: done.includes(levelId) ? done : [...done, levelId] },
      };
    });

  if (screen.name === 'game') {
    const idx = LEVELS.findIndex((l) => l.id === screen.levelId);
    return (
      <GameScreen
        key={`${screen.levelId}-${save.difficulty}`}
        levelId={screen.levelId}
        difficulty={save.difficulty}
        coins={save.coins}
        spend={spend}
        onWin={onWin}
        onExit={() => setScreen({ name: 'home' })}
        onNext={() =>
          setScreen(idx < LEVELS.length - 1 ? { name: 'game', levelId: LEVELS[idx + 1].id } : { name: 'home' })
        }
      />
    );
  }

  return (
    <HomeScreen
      coins={save.coins}
      difficulty={save.difficulty}
      completed={save.completed[save.difficulty]}
      onDifficulty={(d) => setSave((s) => ({ ...s, difficulty: d }))}
      onPlay={(levelId) => setScreen({ name: 'game', levelId })}
    />
  );
}

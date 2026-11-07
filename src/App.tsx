import { useState } from 'react';
import { LEVELS } from './data/levels';
import { useSave } from './hooks/useSave';
import { GameScreen } from './ui/screens/GameScreen';
import { HomeScreen } from './ui/screens/HomeScreen';

type Screen = { name: 'home' } | { name: 'game'; levelId: number };

export default function App() {
  const { save, spend, setDifficulty, registerWin } = useSave();
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  if (screen.name === 'game') {
    const idx = LEVELS.findIndex((l) => l.id === screen.levelId);
    return (
      <GameScreen
        key={`${screen.levelId}-${save.difficulty}`}
        levelId={screen.levelId}
        difficulty={save.difficulty}
        coins={save.coins}
        spend={spend}
        onWin={registerWin}
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
      onDifficulty={setDifficulty}
      onPlay={(levelId) => setScreen({ name: 'game', levelId })}
    />
  );
}

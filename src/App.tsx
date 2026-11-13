import { useState } from 'react';
import { nextLevelId } from './data/levels';
import { useSave } from './hooks/useSave';
import type { LevelDef } from './models/types';
import { GameScreen } from './ui/screens/GameScreen';
import { HomeScreen } from './ui/screens/HomeScreen';

type Screen = { name: 'home' } | { name: 'game'; level: LevelDef };

export default function App() {
  const { save, spend, registerWin, startLevel } = useSave();
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  /** Siempre se juega el primer nivel sin completar; si no existe aún, se genera en este momento. */
  const playNext = () => setScreen({ name: 'game', level: startLevel(nextLevelId(save.completed)) });

  if (screen.name === 'game') {
    return (
      <GameScreen
        key={screen.level.id}
        level={screen.level}
        coins={save.coins}
        spend={spend}
        onWin={registerWin}
        onExit={() => setScreen({ name: 'home' })}
        onNext={playNext}
      />
    );
  }

  return <HomeScreen nextLevelId={nextLevelId(save.completed)} onPlay={playNext} />;
}

import { useState } from 'react';
import { type Lang, getLang, setLang } from './data/i18n';
import { nextLevelId } from './data/levels';
import { useSave } from './hooks/useSave';
import type { LevelDef } from './models/types';
import { GameScreen } from './ui/screens/GameScreen';
import { HomeScreen } from './ui/screens/HomeScreen';

type Screen = { name: 'home' } | { name: 'game'; level: LevelDef };

export default function App() {
  const { save, spend, registerWin, startLevel } = useSave();
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [lang, setLangState] = useState<Lang>(getLang);

  /** El idioma solo se elige en el inicio: el nivel se traduce al empezar a jugarlo. */
  const changeLang = (next: Lang) => {
    setLang(next);
    setLangState(next);
  };

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

  return <HomeScreen nextLevelId={nextLevelId(save.completed)} lang={lang} onLangChange={changeLang} onPlay={playNext} />;
}

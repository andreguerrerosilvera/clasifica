import { useEffect, useState } from 'react';
import { setContext, track } from './platform/analytics';
import { isStandalone } from './platform/install';
import { type Lang, getLang, setLang } from './data/i18n';
import { nextLevelId } from './data/levels';
import { useSave } from './hooks/useSave';
import { EMAIL_AFTER_LEVEL, emailChoice, saveEmailChoice, subscribe } from './platform/newsletter';
import type { LevelDef } from './models/types';
import { EmailModal } from './ui/modals/Modals';
import { GameScreen } from './ui/screens/GameScreen';
import { HomeScreen } from './ui/screens/HomeScreen';

type Screen = { name: 'home' } | { name: 'game'; level: LevelDef };

export default function App() {
  const { save, spend, registerWin, startLevel } = useSave();
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [lang, setLangState] = useState<Lang>(getLang);
  const [askEmail, setAskEmail] = useState(false);

  // Contexto que acompaña a todos los eventos de analíticas
  useEffect(() => {
    setContext({
      lang,
      levels_completed: save.completed.length,
      coins: save.coins,
      display_mode: isStandalone() ? 'standalone' : 'browser',
    });
  }, [lang, save.completed.length, save.coins]);

  /** El idioma solo se elige en el inicio: el nivel se traduce al empezar a jugarlo. */
  const changeLang = (next: Lang) => {
    if (next !== lang) track('language_changed', { from: lang, to: next });
    setLang(next);
    setLangState(next);
  };

  /** Siempre se juega el primer nivel sin completar; si no existe aún, se genera en este momento. */
  const playNext = () => setScreen({ name: 'game', level: startLevel(nextLevelId(save.completed)) });

  /** Al pulsar SIGUIENTE tras superar el nivel 1 se pide el email, salvo que ya haya respondido (cookie). */
  const afterWin = (levelId: number) => {
    if (levelId === EMAIL_AFTER_LEVEL && !emailChoice()) {
      track('email_prompt', { action: 'shown' });
      setAskEmail(true);
    } else playNext();
  };

  const submitEmail = async (email: string) => {
    const ok = await subscribe(email);
    track('email_prompt', { action: ok ? 'submitted' : 'error' });
    if (ok) saveEmailChoice('subscribed');
    return ok;
  };

  if (screen.name === 'game') {
    return (
      <>
        <GameScreen
          key={screen.level.id}
          level={screen.level}
          coins={save.coins}
          spend={spend}
          onWin={registerWin}
          onExit={() => setScreen({ name: 'home' })}
          onNext={() => afterWin(screen.level.id)}
        />
        {askEmail && (
          <EmailModal
            onSubmit={submitEmail}
            onDone={(result) => {
              if (result === 'dismissed') {
                saveEmailChoice('declined');
                track('email_prompt', { action: 'dismissed' });
              }
              setAskEmail(false);
              playNext();
            }}
          />
        )}
      </>
    );
  }

  return <HomeScreen
      nextLevelId={nextLevelId(save.completed)}
      levelsCompleted={save.completed.length}
      lang={lang} onLangChange={changeLang} onPlay={playNext} />;
}

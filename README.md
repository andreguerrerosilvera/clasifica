# Clasifica!

Juego de clasificar cartas por categorías (React + TypeScript + Tailwind + framer-motion).

## Uso
```bash
npm install
npm run dev          # desarrollo
npm run build        # build normal en dist/
npm run build:single # un único index.html autocontenido
```

## Estructura (capas)
Las dependencias van siempre hacia abajo: `ui → hooks → logic → data → models`.

- `src/models/`  – tipos del dominio (`Card`, `GameState`, `LevelDef`, `Save`…). Sin lógica.
- `src/data/`    – carga el contenido de `content/` y genera los niveles (`levels.ts`, `resolve.ts`) y sus textos (`i18n.ts`).
- `src/logic/`   – reglas puras, sin React:
  - `rules.ts` constantes y economía · `board.ts` consultas y movimientos · `hints.ts` pista e imán
  - `generator.ts` estado inicial desde el tablero · `layout.ts` arma un tablero resoluble · `levelGen.ts` genera niveles nuevos
  - `solver.ts` solver · `rng.ts` aleatorio con semilla · `save.ts` persistencia
- `src/hooks/`   – estado de React: `useGame` (partida), `useSave` (progreso), `useBursts` (efectos)
- `src/platform/` – servicios del dispositivo: `ads.ts` (anuncios recompensados)
- `src/ui/`      – presentación: `screens/` (inicio y partida), `components/` (tablero, columnas, bandeja…), `modals/`

## Reglas
- Arrastra y suelta cada carta sobre su categoría (los clics sobre las cartas no hacen nada; cada colocación gasta 1 movimiento).
- La columna central tiene 3 categorías reveladas y la casilla extra (+1 categoría y +5 movimientos). Por ahora se compra por 300 monedas; con `FREE_SLOT_PAYMENT = 'ad'` en `src/logic/rules.ts` se gana viendo un anuncio recompensado entero, y con `FREE_SLOT_ENABLED = false` desaparece. Los niveles se generan y verifican sin contar con ella. Al completar una categoría, las de encima bajan y la siguiente entra arriba.
- Si su categoría aún no está revelada, la carta va a la bandeja (3 casillas abiertas, 2 bloqueadas por monedas).
- Las columnas caen al liberar huecos; las rayas sobre cada columna indican cartas pendientes.
- Las cartas "?" se revelan al retirar una carta vecina.
- Potenciadores (pista, deshacer, imán): ocultos por ahora con `BOOSTERS_ENABLED` en `src/logic/rules.ts`.
- Tablero vacío → nivel superado.
- Sin movimientos → "Seguir (+10)" o "Reintentar". Bandeja llena sin jugadas → "Sin jugadas".

## Anuncios
Decisión completa, ubicaciones y pasos de AdSense en [`docs/anuncios.md`](docs/anuncios.md). Banners: inicio y nivel completado (320×100) y laterales en pantallas ≥ 1024 px (160×600), con `AdBanner`; se configuran en `.env.local` (ver `.env.example`).

Con `FREE_SLOT_PAYMENT = 'ad'`, la casilla extra usa `showRewardedAd` de `src/platform/ads.ts`:
- Sin configurar nada se muestra un **anuncio simulado** de 5 s (para el piloto y desarrollo).
- Con `VITE_ADSENSE_CLIENT=ca-pub-…` en `.env.local` usa la [Ad Placement API de Google para juegos HTML5](https://developers.google.com/ad-placement) (`adBreak` de tipo `reward`). Con `VITE_ADS_TEST=on` Google sirve anuncios de prueba.
- La recompensa solo se da si el anuncio se ve entero; si se cierra antes o no hay inventario, la casilla sigue disponible.

## Contenido (`content/`)
No hay niveles fijos: los niveles son infinitos. Cada uno se genera en el momento en que el jugador lo va a jugar (combinando categorías del catálogo y comprobando con el solver que tenga solución) y se guarda tal cual hasta que lo supera: si sale y vuelve, o reintenta, es el mismo tablero. Se llaman "Nivel N".

- `content/categorias_thiings.json` – catálogo de categorías (100 × 12 objetos) con los gráficos de [thiings.co](https://www.thiings.co/things): nombre en español, slug, link a la página e imagen de cada objeto. El id de cada categoría es su nombre sin tildes en minúsculas (`Bebé` → `bebe`) y el de cada objeto su slug; las cartas se referencian como `categoria.slug`. Las cartas muestran la imagen optimizada local de `public/thiings/<slug>.webp` (192 px, ~8 KB). Tras cambiar objetos del catálogo, correr `npm run images`: descarga los originales que falten a `assets/thiings/raw/` (1024 px, ~1,5 MB c/u, fuera de git) y genera los WebP que falten (requiere `cwebp`: `brew install webp`).
- `content/generation.json` – cómo se generan:
  - `introDifficulties` dificultad de los primeros niveles (uno por nivel) y `difficultyCycle` la de los siguientes, en ciclo.
  - `difficulties`: por dificultad, los rangos `[mín, máx]` de `categories` (mínimo 4), `itemsPerCategory` y `hidden` (proporción de "?"), y `margin` (moves = pasos del solver × margin).
  - `maxItems` tope de cartas en el tablero y `conflicts` pares de categorías de temas parecidos que no pueden salir juntas porque alguna carta encajaría en las dos. Además, dos categorías que comparten algún objeto nunca salen juntas (se calcula solo).
- `content/difficulties.json` – parámetros por dificultad (`openSlots`).
- Iconos de la interfaz (`src/ui/components/Icons.tsx`): la moneda (`public/coin.webp`, de [emoji-1fa99](https://www.thiings.co/things/emoji-1fa99)) el engranaje de ajustes (`public/settings.webp`, de [cogwheel](https://www.thiings.co/things/cogwheel)), el candado de lo bloqueado (`public/lock.webp`, de [lock-symbol](https://www.thiings.co/things/lock-symbol)), la bombilla de la pista (`public/hint.webp`, de [idea](https://www.thiings.co/things/idea)), el imán (`public/magnet.webp`, de [simple-bar-magnet](https://www.thiings.co/things/simple-bar-magnet)) y la flecha de deshacer (`public/undo.webp`, de [left-arrow](https://www.thiings.co/things/left-arrow)), a 128 px. Sus originales están en `assets/thiings/raw/`.
- `content/i18n/{es,en,pt}.json` – textos de la interfaz y de las dificultades en cada idioma.
- `content/i18n/catalog.{en,pt}.json` – nombres traducidos de categorías (por id) y cartas (por `categoria.slug`). En español los nombres salen de `categorias_thiings.json`; si falta una traducción se usa el español. Al añadir objetos al catálogo, añade también su traducción.

El idioma (español por defecto, inglés o portugués) se elige en el inicio y se guarda en `localStorage` (`clasifica-lang`). El nivel se traduce al empezar a jugarlo.

Categoría nueva: añádela a `content/categorias_thiings.json` y, si alguna de sus cartas podría confundirse con otra categoría, añade el par a `conflicts`.

El inicio solo muestra "Jugar": se juega el primer nivel sin completar. Se guarda el progreso de niveles, las monedas y el nivel generado en curso (no la partida a medias).

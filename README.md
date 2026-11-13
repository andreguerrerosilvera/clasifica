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
- `src/ui/`      – presentación: `screens/` (inicio y partida), `components/` (tablero, columnas, bandeja…), `modals/`

## Reglas
- Arrastra y suelta cada carta sobre su categoría (los clics sobre las cartas no hacen nada; cada colocación gasta 1 movimiento).
- La columna central tiene 3 categorías reveladas y la casilla GRATIS (desactivada en el piloto con `FREE_SLOT_ENABLED` en `src/logic/rules.ts`); al completar una, las de encima bajan y la siguiente entra arriba.
- Si su categoría aún no está revelada, la carta va a la bandeja (3 casillas abiertas, 2 bloqueadas por monedas).
- Las columnas caen al liberar huecos; las rayas sobre cada columna indican cartas pendientes.
- Las cartas "?" se revelan al retirar una carta vecina.
- Tablero vacío → nivel superado.
- Sin movimientos → "Seguir (+10)" o "Reintentar". Bandeja llena sin jugadas → "Sin jugadas".

## Contenido (`content/`)
No hay niveles fijos: los niveles son infinitos. Cada uno se genera en el momento en que el jugador lo va a jugar (combinando categorías del catálogo y comprobando con el solver que tenga solución) y se guarda tal cual hasta que lo supera: si sale y vuelve, o reintenta, es el mismo tablero. Se llaman "Nivel N".

- `content/categorias_thiings.json` – catálogo de categorías (100 × 12 objetos) con los gráficos de [thiings.co](https://www.thiings.co/things): nombre en español, slug, link a la página e imagen de cada objeto. El id de cada categoría es su nombre sin tildes en minúsculas (`Bebé` → `bebe`) y el de cada objeto su slug; las cartas se referencian como `categoria.slug`. Las cartas muestran la imagen optimizada local de `public/thiings/<slug>.webp` (192 px, ~8 KB). Tras cambiar objetos del catálogo, correr `npm run images`: descarga los originales que falten a `assets/thiings/raw/` (1024 px, ~1,5 MB c/u, fuera de git) y genera los WebP que falten (requiere `cwebp`: `brew install webp`).
- `content/generation.json` – cómo se generan:
  - `introDifficulties` dificultad de los primeros niveles (uno por nivel) y `difficultyCycle` la de los siguientes, en ciclo.
  - `difficulties`: por dificultad, los rangos `[mín, máx]` de `categories` (mínimo 4), `itemsPerCategory` y `hidden` (proporción de "?"), y `margin` (moves = pasos del solver × margin).
  - `maxItems` tope de cartas en el tablero y `conflicts` pares de categorías de temas parecidos que no pueden salir juntas porque alguna carta encajaría en las dos. Además, dos categorías que comparten algún objeto nunca salen juntas (se calcula solo).
- `content/difficulties.json` – parámetros por dificultad (`openSlots`).
- `content/i18n/es.json` – textos de las dificultades (los nombres de categorías y objetos salen de `categorias_thiings.json`).

Categoría nueva: añádela a `content/categorias_thiings.json` y, si alguna de sus cartas podría confundirse con otra categoría, añade el par a `conflicts`.

El inicio solo muestra "Jugar": se juega el primer nivel sin completar. Se guarda el progreso de niveles, las monedas y el nivel generado en curso (no la partida a medias).

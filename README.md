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
- `src/data/`    – carga y valida el contenido de `content/` (`levels.ts`, `resolve.ts`) y sus textos (`i18n.ts`).
- `src/logic/`   – reglas puras, sin React:
  - `rules.ts` constantes y economía · `board.ts` consultas y movimientos · `hints.ts` pista e imán
  - `generator.ts` estado inicial desde el tablero fijo · `solver.ts` solver · `rng.ts` aleatorio con semilla · `save.ts` persistencia
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
Los niveles son estáticos: cada uno es un JSON con su tablero ya armado.

- `content/levels/NN.json` – un nivel: `id`, `difficulty` (`easy` | `normal` | `hard`), `moves`, `categories` (ids en inglés, mínimo 4 distintas) y `layout` (`columns`, `hidden`, `categoryOrder`). Las cartas se referencian como `categoria.item`.
- `content/difficulties.json` – parámetros por dificultad (`openSlots`).
- `content/i18n/es.json` – todos los textos: dificultades, títulos de nivel, categorías e items.

Nivel nuevo: crea `content/levels/04.json` con `id`, `difficulty`, `categories` y las traducciones en `es.json`, y genera el tablero con

```
npm run level:layout -- content/levels/04.json [--seed N] [--hidden 0.2] [--margin 1.3]
```

El script mezcla, comprueba con el solver que tenga solución y escribe `layout` y `moves` (solución × margin). Después puedes retocar el JSON a mano. Al cargar, el juego valida los archivos y el error indica archivo y campo.

El inicio solo muestra "Jugar": se juega el primer nivel sin completar. Se guarda el progreso de niveles y las monedas, no la partida en curso.

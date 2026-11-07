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
- `src/data/`    – contenido: niveles, categorías y dificultades (edita `levels.ts` para añadir niveles).
- `src/logic/`   – reglas puras, sin React:
  - `rules.ts` constantes y economía · `board.ts` consultas y movimientos · `hints.ts` pista e imán
  - `generator.ts` generador de niveles + solver · `rng.ts` aleatorio con semilla · `save.ts` persistencia
- `src/hooks/`   – estado de React: `useGame` (partida), `useSave` (progreso), `useBursts` (efectos)
- `src/ui/`      – presentación: `screens/` (inicio y partida), `components/` (tablero, columnas, bandeja…), `modals/`

## Reglas
- Arrastra y suelta cada carta sobre su categoría (los clics sobre las cartas no hacen nada; cada colocación gasta 1 movimiento).
- La columna central tiene 3 categorías reveladas y la casilla GRATIS; al completar una, la siguiente ocupa su lugar.
- Si su categoría aún no está revelada, la carta va a la bandeja (3 casillas abiertas, 2 bloqueadas por monedas).
- Las columnas caen al liberar huecos; las rayas sobre cada columna indican cartas pendientes.
- Las cartas "?" se revelan al retirar una carta vecina.
- Tablero vacío → nivel superado.
- Sin movimientos → "Seguir (+10)" o "Reintentar". Bandeja llena sin jugadas → "Sin jugadas".

Cada nivel se genera de forma determinista (semilla) y se valida con un solver,
así que siempre tiene solución; los movimientos = solución × factor de dificultad.

# Clasifica!

Juego de clasificar cartas por categorías (React + TypeScript + Tailwind + framer-motion).

## Uso
```bash
npm install
npm run dev          # desarrollo
npm run build        # build normal en dist/
npm run build:single # un único index.html autocontenido
```

## Estructura
- `src/game/levels.ts`  – contenido de los 3 niveles y las 3 dificultades (edita aquí para añadir niveles)
- `src/game/engine.ts`  – reglas puras: gravedad por columnas, cartas "?", bandeja, potenciadores, generador + solver
- `src/components/`     – pantallas (mapa, partida, modales de victoria/derrota)

## Reglas
- Toca o arrastra una carta a su categoría amarilla (cada colocación gasta 1 movimiento).
- Si su categoría no está visible, va a la bandeja (3 casillas abiertas, 2 bloqueadas por monedas).
- Las columnas caen al liberar huecos; las rayas sobre cada columna indican cartas pendientes.
- Las cartas "?" se revelan al retirar una carta vecina.
- Categoría completa → desaparece. Tablero vacío → nivel superado.
- Sin movimientos → "Seguir (+10)" o "Reintentar". Bandeja llena sin jugadas → "Sin jugadas".

Cada nivel se genera de forma determinista (semilla) y se valida con un solver,
así que siempre tiene solución; los movimientos = solución × factor de dificultad.

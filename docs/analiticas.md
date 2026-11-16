# Analíticas (PostHog)

_Fecha: 2026-11-14_

PostHog solo se activa en `clasifica.andregames.co` y con `VITE_POSTHOG_KEY` definida. En local, en las previews de Netlify y en `clasifica-game.netlify.app` no se envía nada y la librería no se descarga. Sin clave, ni siquiera entra en el build.

Además, PostHog solo se descarga si el jugador pulsa **Aceptar** en el banner de privacidad (`src/platform/consent.ts`). Si dice que no, no se envía nada; si no responde, los eventos esperan en memoria y se descartan al cerrar. La elección se cambia en Ajustes → Opciones de privacidad.

- **Sin autocapture:** el juego es todo arrastres, así que los eventos se envían a mano.
- **Grabación de sesiones activada**, solo para quien acepta el banner. Los campos de texto (el email) salen ocultos y los anuncios no se graban. Hay que tener activado *Record user sessions* en PostHog → Settings → Session replay. También se registran `$pageview` y `$pageleave`.
- **Jugadores anónimos:** no se crean perfiles de persona (`identified_only`).

Código: `src/platform/analytics.ts` (catálogo tipado de eventos y envío) y las llamadas `track()` en `src/hooks/useGame.ts`, `src/ui/screens/GameScreen.tsx` y `src/App.tsx`.

## Propiedades en todos los eventos

| Propiedad | Qué es |
| --- | --- |
| `lang` | Idioma elegido (`es`, `en`, `pt`) |
| `levels_completed` | Niveles superados hasta ahora |
| `coins` | Monedas actuales |
| `display_mode` | `standalone` si se juega desde la app instalada, `browser` si desde el navegador |

## Eventos

| Evento | Cuándo | Propiedades clave |
| --- | --- | --- |
| `level_started` | Empieza un nivel o un reintento | `level`, `difficulty`, `attempt`, `moves`, `categories`, `total_items`, `hidden_cards` |
| `level_won` | Se completa el nivel | métricas del intento + `reward` |
| `level_failed` | Sin movimientos o sin jugadas | métricas del intento + `reason` (`out_of_moves` / `stuck`) |
| `level_restarted` | Reintentar desde ajustes o desde un modal de fin | métricas del intento + `source` (`settings` / `out_of_moves` / `stuck`) |
| `level_abandoned` | Salir al inicio sin terminar | métricas del intento |
| `category_completed` | Se completa una categoría | `category`, `order`, `by_magnet` |
| `booster_used` | Se paga un potenciador | `booster` (`hint`, `undo`, `magnet`, `tray_slot`, `bonus_slot`, `play_on`), `cost`, `via` (`coins` / `ad`) |
| `not_enough_coins` | Se intenta pagar sin monedas suficientes | `booster`, `cost`, `coins` |
| `free_slot_offer` | Oferta de la casilla extra | `action` (`shown` / `accepted` / `dismissed`) |
| `rewarded_ad` | Termina un anuncio recompensado (cuando se activen) | `placement`, `result` |
| `catalog_opened` | Se abre el catálogo de categorías | `from` |
| `language_changed` | Se cambia el idioma en el inicio | `from`, `to` |
| `install_prompt` | Oferta de instalar la app en el inicio (desde 2 niveles superados) | `action` (`shown` / `accepted` / `dismissed` / `ios_guide`), `platform` (`android` / `ios`) |
| `email_prompt` | Petición de email tras superar el nivel 1 (no se repite si declinó o se suscribió: cookie `clasifica_email`) | `action` (`shown` / `submitted` / `dismissed` / `error`) |
| `app_installed` | Se instala la app (en iPhone: primera vez que se abre desde la pantalla de inicio) | `platform` |

**Métricas del intento** (en `level_won`, `level_failed`, `level_restarted` y `level_abandoned`): `level`, `difficulty`, `attempt`, `moves_left`, `moves_used`, `placed`, `total_items`, `progress_pct`, `duration_s`, `mistakes` (cartas soltadas en la categoría equivocada), `boosters_used`, `bonus_unlocked`.

## Preguntas que responden

| Pregunta | Cómo verlo en PostHog |
| --- | --- |
| ¿Hasta qué nivel llega la gente? | Tendencia de `level_won` desglosada por `level`; retención por `levels_completed` |
| ¿Qué niveles son demasiado difíciles? | Por `level`: `level_failed` frente a `level_won`, y la media de `attempt` en `level_won` |
| ¿Dónde abandonan? | `level_abandoned` y `level_failed` sin un `level_started` posterior, por `level` y `progress_pct` |
| ¿Sirve la casilla extra? | Embudo `free_slot_offer` shown → accepted → `level_won` |
| ¿Faltan monedas? | `not_enough_coins` por `booster`: indica dónde cabría un anuncio recompensado |
| ¿Se entiende el juego? | `mistakes` y `duration_s` en los primeros niveles |
| ¿Vuelven los jugadores? | Retención: `level_started` como evento inicial y de regreso |

## Configuración

| Variable | Valor |
| --- | --- |
| `VITE_POSTHOG_KEY` | Project API key (`phc_…`): PostHog → Settings → Project |
| `VITE_POSTHOG_HOST` | `https://us.i.posthog.com` (por defecto) o `https://eu.i.posthog.com` si el proyecto está en la UE |

Las dos van en Netlify → Project configuration → Environment variables. Después hay que redesplegar, porque Vite las incrusta al compilar.

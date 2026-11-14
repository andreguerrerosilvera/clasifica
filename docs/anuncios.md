# Decisión de anuncios

_Fecha: 2026-11-14_

Clasifica muestra solo banners de AdSense normal fuera de la partida en móvil, y banners laterales durante la partida solo en pantallas de 1024 px o más. La casilla extra se compra con 300 monedas hasta tener un proveedor de anuncios recompensados.

## Ubicaciones

Tres bloques de display de tamaño fijo. El hueco se reserva antes de que cargue el anuncio, así el juego no se mueve.

| Ubicación | Tamaño | Móvil | Tablet vertical | Desktop / tablet horizontal (≥ 1024 px) |
| --- | --- | --- | --- | --- |
| Inicio, abajo del todo (lejos de JUGAR) | 320×100 | Sí | Sí | Sí |
| Nivel completado, abajo (lejos de SIGUIENTE) | 320×100 | Sí | Sí | Sí |
| Laterales durante la partida (uno a cada lado) | 160×600 | No | No | Sí |
| Dentro del tablero, bandeja o barra inferior | — | Nunca | Nunca | Nunca |

## Por qué así

En móvil el tablero ocupa casi toda la pantalla y se juega arrastrando cartas: un banner cerca provoca toques accidentales, que AdSense sanciona.

- **Pausas naturales:** inicio y nivel completado son momentos sin arrastre, y se ven en cada nivel.
- **Laterales solo en pantalla ancha:** el juego ocupa 440 px al centro; con ≥ 1024 px caben dos banners a 32 px del tablero. En pantallas más chicas no se montan ni se piden.
- **Etiqueta "Publicidad"** sobre cada banner, para no confundirlo con el juego.
- **Nada que invite a hacer clic** en anuncios ni recompensas por hacerlo.
- **Anuncios automáticos fijos (anchor) desactivados** en el sitio: se colocan solos y pueden tapar la bandeja.
- **AdSense normal no permite** anuncios recompensados ni a pantalla completa; eso solo se puede con H5 Games Ads (beta con solicitud).

## Casilla extra: monedas ahora, anuncio después

La casilla extra (una categoría más y +5 movimientos) cuesta 300 monedas (`COST.bonusSlot`). El jugador empieza con 300 y gana 30 por nivel. El flujo de anuncio recompensado ya está programado y se activa con `FREE_SLOT_PAYMENT = 'ad'` en `src/logic/rules.ts` cuando haya proveedor.

| Proveedor | Recompensados en dominio propio | Requisito para entrar | Estado |
| --- | --- | --- | --- |
| [H5 Games Ads (AdSense)](https://adsense.google.com/start/h5-games-ads/) | Sí | Beta cerrada, por solicitud | Solicitar ya |
| [AppLixir](https://www.applixir.com/?p=4181) | Sí | Unas 100.000 impresiones al mes, según el propio proveedor | Cuando haya tráfico |
| [Google Ad Manager](https://support.google.com/admanager/answer/9116812) | Sí | Cuenta de Ad Manager | Cuando haya tráfico |
| AdinPlay (Venatus) | Sí | Alta por contacto | Sin confirmar |

Reglas para cuando se active: el jugador elige ver cada anuncio, la recompensa se describe exacta, puede decir "Ahora no" y solo se entrega si ve el anuncio entero.

## Qué configurar en AdSense

- [ ] Publicar el juego en un dominio propio (por ejemplo, Netlify o Vercel con tu dominio).
- [ ] Crear la cuenta de AdSense y añadir el dominio en **Sitios**. Esperar la aprobación.
- [ ] Tener en el sitio una página de política de privacidad y algo de texto propio (cómo se juega, acerca de). Una página que es solo un juego suele rechazarse por "contenido de poco valor".
- [ ] Activar el aviso de consentimiento para Europa, Reino Unido y Suiza en **Privacidad y mensajes** (plataforma certificada por Google).
- [ ] En **Anuncios → Por bloque de anuncios → Anuncios de display**, crear tres bloques de **tamaño fijo**: `clasifica-inicio` 320×100, `clasifica-nivel-completado` 320×100, `clasifica-lateral` 160×600.
- [ ] En **Anuncios → Por sitio**, desactivar los anuncios automáticos, o al menos los fijos (anchor) y los de pantalla completa (viñeta).
- [ ] Indicar en AdSense si el juego está dirigido a menores de 13 años. Pendiente de decidir: cambia qué anuncios se pueden mostrar.
- [ ] Solicitar H5 Games Ads con el [formulario de la beta](https://developers.google.com/ad-placement/docs/signup).
- [ ] Nunca hacer clic en tus propios anuncios reales; para probar, usar `VITE_ADS_TEST=on`.

## Qué pasarle al código

Copiar `.env.example` como `.env.local` (no se sube a git) y rellenar. Ninguno de estos valores es secreto: aparecen en el código de cualquier página con anuncios.

| Variable | De dónde sale | Ejemplo |
| --- | --- | --- |
| `VITE_ADSENSE_CLIENT` | AdSense → Cuenta → Información de la cuenta (ID de editor) | `ca-pub-1234567890123456` |
| `VITE_ADSENSE_SLOT_HOME` | `data-ad-slot` del bloque `clasifica-inicio` | `1234567890` |
| `VITE_ADSENSE_SLOT_WIN` | `data-ad-slot` del bloque `clasifica-nivel-completado` | `1234567890` |
| `VITE_ADSENSE_SLOT_SIDE` | `data-ad-slot` del bloque `clasifica-lateral` | `1234567890` |
| `VITE_ADS_TEST` | `on` para anuncios de prueba de Google | `on` |
| `VITE_ADS_PLACEHOLDER` | `on` para ver recuadros de prueba en producción | vacío |

Con el ID de editor, `npm run build` genera `ads.txt` en `dist/`.

## Cómo está implementado

| Archivo | Qué hace |
| --- | --- |
| `src/platform/ads.ts` | Carga AdSense una vez si hay ID de editor; ubicaciones y bloques; anuncio recompensado (H5 o simulado). |
| `src/ui/components/AdBanner.tsx` | Banner de tamaño fijo con etiqueta "Publicidad"; no se monta donde no cabe. |
| `src/ui/components/SimulatedAd.tsx` | Anuncio recompensado de prueba de 5 s, para cuando se active el modo anuncio. |
| `src/logic/rules.ts` | `FREE_SLOT_PAYMENT` (`'coins'` o `'ad'`), `COST.bonusSlot` = 300, `BOOSTERS_ENABLED` = false. |
| `vite.config.ts` | Genera `ads.txt` a partir del ID de editor. |
| `.env.example` | Plantilla de las variables. |

Sin ID de editor no se carga nada de Google: en producción los banners no aparecen, y en `npm run dev` se ven recuadros de prueba.

## Fuentes

- [Política de H5 Games Ads](https://support.google.com/publisherpolicies/answer/11975916)
- [H5 Games Ads en AdSense](https://adsense.google.com/start/h5-games-ads/)
- [Ad Placement API](https://developers.google.com/ad-placement/apis)
- [Solicitud de acceso a H5 Games Ads](https://developers.google.com/ad-placement/docs/signup)
- [Buenas prácticas de política H5 (PDF)](https://services.google.com/fh/files/helpcenter/h5_games_policy_best_practices_infographic.pdf)
- [Ad Manager: anuncios recompensados para web](https://support.google.com/admanager/answer/9116812)
- [AppLixir: anuncios recompensados para juegos web](https://www.applixir.com/?p=4181)

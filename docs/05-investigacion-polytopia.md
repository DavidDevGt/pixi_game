# 05 — Investigación comprimida: mercado y caso Polytopia

Síntesis de toda la investigación (mercado, caso de estudio, competencia). Solo lo accionable.

## El caso en 10 líneas

- **The Battle of Polytopia** (Midjiwan AB, Estocolmo): creado por una sola persona (Felix af Ekenstam, ex-Flash), lanzado en iOS en 2016 como "Super Tribes". Equipo ~12–15 personas una década después.
- **25M+ descargas móviles** (anunciado 2025), campeonato mundial propio, presencia en Android/iOS/Steam/Switch/Epic/Tesla.
- Posicionamiento: **"Civilization en 20 minutos"**. Creó su propia categoría: estrategia que respeta el tiempo del jugador.
- Monetización querida por su comunidad: juego gratis, **tribus como IAP**, multijugador tras cualquier compra, skins. Sin ads, sin timers, sin pay-to-win. Sigue generando ~US$20k/mes móvil una década después.
- Audiencia primaria: 20–40 años, ingenieros, programadores, jugadores de Civ/AoE/ajedrez. Secundaria: adolescentes (reglas simples, partidas cortas).

## Por qué funciona el diseño (lo copiable)

**Compresión coherente de todos los ejes a la vez** — esa coherencia es el diseño:

| Eje | Decisión | Efecto |
|---|---|---|
| Mapa | cuadrícula ~16×16 | conflicto en minutos, sin fase aburrida |
| Duración | ~30 turnos / 15–20 min | perder es barato → "una más" |
| Economía | **una sola moneda** (estrellas) | una decisión clara por turno |
| Tech tree | ~25 nodos, 3 tiers | se memoriza; la skill está en el orden |
| Combate | **determinista**, fórmula visible | calculable como ajedrez, cero RNG oculto |
| Anti-snowball | el costo de tech escala con nº de ciudades | una regla sustituye sistemas enteros |
| Tribus | asimetría mínima (1 tech inicial + bioma visual) | identidad + unidad de venta, balance manejable |
| Modos | Perfection (score/30 turnos) y Domination | 2 juegos con las mismas mecánicas |

- **Tiempo hasta la primera decisión: ~10 segundos.** Métrica de producto de primer nivel.
- Rejugabilidad por mapa procedural + tribu + posición, no por contenido.
- Arte low-poly reconocible que no envejece (en la práctica: sprites prerenderizados).

## Debilidades del líder (lo atacable)

1. **IA débil** — su crítica nº1 histórica, sin resolver. En un juego determinista de espacio pequeño, una IA seria es alcanzable para un equipo chico: es el diferenciador más barato de construir.
2. **Meta resoluble / late game repetitivo** tras dominar las aperturas.
3. **Balance dependiente del mapa** (costo aceptado de la asimetría barata).
4. **Cadencia lenta**: editor, espectador, esports — todo llegó tarde o nunca (campeonato en 2025, nueve años después).
5. Sin loop compartible (retos, replays, desafío diario): no genera nada que viaje solo.

## Competencia directa

| Juego | Fortaleza | Debilidad |
|---|---|---|
| Civilization (móvil/PC) | profundidad | partidas de horas |
| Hexonia | parecido visual | menos balance, abandonado |
| Unciv | open source, gratis | UX pobre |
| AntiYoy | simplicidad | poca variedad |
| Age of Empires Mobile | producción AAA | progresión F2P agresiva, no táctico |

El nicho "estrategia rápida y honesta en móvil" sigue teniendo **un solo jugador serio**. Eso es a la vez la validación y la oportunidad.

## Encaje técnico con este stack

Un 4X por turnos es el género ideal para PixiJS: escena mayormente estática (el pipeline reactivo de v8 la hace casi gratis), sin físicas, loop event-driven (no aplica timestep fijo), lógica determinista en TypeScript puro (testeable, reusable por IA y servidor), tribus = bundles de assets = unidad de monetización. En móvil se empaqueta con **Capacitor**; ventaja colateral frente al Unity de Polytopia: binario mucho más ligero y desarrollo iterando en navegador.

## Lecciones adoptadas

1. Comprimir todos los ejes a la vez; la coherencia es el diseño.
2. Una moneda, información perfecta, combate determinista.
3. Anti-snowball como regla simple, no como sistema.
4. Asimetría mínima viable (identidad + venta sin coste de balance).
5. Monetizar confianza: contenido opcional, jamás pay-to-win/ads/timers.
6. La IA es la oportunidad, no un checkbox.
7. Tiempo-hasta-primera-decisión < 30 segundos.
8. Una persona con alcance brutalmente recortado le ganó a estudios de cientos: **el recorte de alcance es el producto.**

## Fuentes principales

[Wikipedia](https://en.wikipedia.org/wiki/The_Battle_of_Polytopia) · [CB Insights](https://www.cbinsights.com/company/battle-for-polytopia) · [Sensor Tower — Midjiwan](https://app.sensortower.com/publisher/android/Midjiwan%2BAB) · [Pixelated Playgrounds — análisis de diseño](https://www.pixelatedplaygrounds.com/sidequests/game-design-perspective-the-battle-of-polytopia) · [Polytopia Wiki — Technology](https://polytopia.fandom.com/wiki/Technology)

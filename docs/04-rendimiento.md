# 04 — Rendimiento y memoria

El pipeline de v8 hace que la escena *estable* sea casi gratis (instrucciones de render cacheadas, transforms solo de lo que cambió). Casi todos los problemas de rendimiento en Pixi son autoinfligidos y caen en cuatro categorías: batch breaks, redibujado innecesario, fillrate y fugas de memoria.

## 1. Proteger el batching

Un draw call puede pintar hasta 2,048 quads si comparten estado. Cada cambio de textura fuente, blend mode, filtro o máscara **rompe el batch**.

- **Atlases siempre.** Dos sprites de regiones del mismo atlas se batchean; dos PNGs sueltos, no. Objetivo: un atlas por bundle/pantalla.
- **Orden por textura cuando sea barato.** Si el fondo, los enemigos y la UI usan atlases distintos, mantenerlos en contenedores separados ya agrupa el estado.
- **Filtros y máscaras con presupuesto.** Cada filtro fuerza render a textura intermedia + batch break. Un blur en un contenedor con 500 hijos es un blur sobre una textura, está bien; 50 sprites cada uno con su filtro, no. Las máscaras rectangulares alineadas a ejes pueden sustituirse por scissor (`cullArea`) o simplemente por recorte de posición.
- **Blend modes avanzados** (`pixi.js/advanced-blend-modes`) rompen el batch y algunos fuerzan pasadas extra. Se permiten en efectos puntuales, no en partículas masivas.

Diagnóstico: PixiJS DevTools muestra draw calls por frame. Presupuesto orientativo del proyecto: **< 30 draw calls** en gameplay.

## 2. No redibujar lo que no cambió

- `Graphics` que se reconstruye cada frame (`clear()` + redibujo) re-triangula geometría en CPU. Para barras que solo cambian de tamaño: `Sprite` blanco de 1×1 escalado + `tint`.
- `Text` (Canvas) re-rasteriza en cada cambio de string. Contadores de gameplay → `BitmapText`.
- Subárboles estáticos complejos (fondo con cientos de tiles, marco de UI) → `container.cacheAsTexture(true)`: se rasterizan una vez y se pintan como un sprite. Invalidar (`false` → `true`) solo cuando de verdad cambien.
- Preferir `visible = false` sobre añadir/quitar del árbol: mantiene válidas las instrucciones cacheadas del renderer.

## 3. Fillrate y culling

La GPU paga por píxel dibujado, incluso transparente.

- **Culling es opt-in.** En mundos más grandes que la pantalla: `container.cullable = true` en las entidades y `cullableChildren` en sus contenedores; con miles de objetos, un culling manual por grid/quadtree en `simulate()` es más barato que el chequeo por objeto.
- Recortar la transparencia de los sprites en el atlas (trim) — un PNG de 512×512 con un icono de 64×64 dibuja 512×512 de píxeles.
- Overdraw: evitar apilar capas fullscreen semitransparentes (niebla + viñeta + tinte = 3 pasadas de pantalla completa).

## 4. Muchas entidades

- **ParticleContainer** para conteos extremos (partículas, proyectiles tipo bullet-hell): renderiza decenas de miles de quads con una fracción del costo, a cambio de capacidades limitadas por hijo (sin hijos anidados, propiedades restringidas).
- **Object pooling** para todo lo de vida corta (ver doc 03). La presión de GC aparece como *stutter* periódico, no como fps bajos constantes — si hay hitches cada pocos segundos, sospechar de allocations en el loop.
- Evitar allocations por frame también en lógica: reutilizar `Point`/objetos temporales, no crear closures dentro de `ticker.add`.

## 5. Memoria y fugas

Sacar un objeto del stage **no libera GPU ni listeners**. Las fugas típicas, en orden de frecuencia:

1. **Escenas que no destruyen su subárbol** → `container.destroy({ children: true })` en el `destroy()` de la escena.
2. **Listeners de `window`/`document`** registrados en `init` y nunca removidos → la escena guarda las referencias y las quita en `destroy`.
3. **Callbacks en el ticker** de objetos ya destruidos → `app.ticker.remove(fn)` o usar el `update` de la escena como único punto de entrada.
4. **Texturas huérfanas**: `RenderTexture` creadas al vuelo, texturas de `Text` — los objetos que las poseen en exclusiva se destruyen con `destroy(true)`.

Las texturas **compartidas** se liberan a nivel de bundle (`Assets.unloadBundle('level1')` al salir del nivel), nunca con `texture: true` en un sprite individual — destruirías la textura para todos sus usuarios.

v8 incluye un GC de texturas (`textureGCActive`) que desaloja texturas no usadas de GPU; es red de seguridad, no sustituto de la disciplina de bundles.

## 6. Medir antes de optimizar

- **PixiJS DevTools** (extensión de navegador): árbol de escena en vivo, draw calls, texturas residentes.
- Performance tab de Chrome con capturas de 5–10s durante gameplay real; buscar GC (dientes de sierra en memoria) y frames largos.
- `app.ticker.FPS` para overlay de debug in-game.
- Probar en hardware débil real (móvil de gama media) — el escritorio de desarrollo miente.

Regla final: ninguna optimización de esta lista se aplica "por si acaso" a costa de legibilidad, salvo las estructurales que son gratis desde el día 1: atlases, `BitmapText`, pooling de proyectiles y escenas que limpian.

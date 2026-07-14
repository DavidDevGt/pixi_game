# 01 — Arquitectura del motor

## Qué es PixiJS (y qué no es)

PixiJS es una **librería de renderizado 2D**, no un motor de juegos completo. Esta es la decisión de diseño que condiciona todo lo demás:

**Incluye:** scene graph, batching automático, gestión de texturas, filtros/shaders, texto, sistema de eventos (pointer/touch), carga de assets.

**No incluye:** físicas, audio, networking, editor de niveles, máquina de estados. Eso lo aporta el proyecto o el ecosistema:

| Necesidad | Solución habitual |
|---|---|
| Físicas | matter.js, planck.js (o aritmética propia si son AABB simples) |
| Audio | `@pixi/sound`, howler.js |
| Animación esqueletal | Spine (`@esotericsoftware/spine-pixi`) |
| UI | `@pixi/ui` |
| Pipeline de assets | AssetPack |

La analogía correcta es **three.js pero para 2D**: máximo control y rendimiento a cambio de que la arquitectura del juego sea responsabilidad nuestra.

## Backends de render

v8 trata **WebGPU y WebGL como backends de igual rango** bajo una misma API. `Application.init()` (que usa `autoDetectRenderer()` por dentro) detecta capacidades del dispositivo y carga **solo** el código del backend elegido — por eso la inicialización es asíncrona y por eso conviene no importar backends a mano.

```ts
const app = new Application();
await app.init({
  preference: 'webgl', // o 'webgpu'; omitir = autodetección
  resizeTo: window,
});
```

Puntos que importan en la práctica:

- **WebGPU no es automáticamente más rápido.** Gana en escenas con muchos "batch breaks" (filtros, máscaras, blend modes). Para sprites masivos bien batcheados, WebGL rinde igual.
- El código de juego **no cambia** entre backends; la abstracción es total salvo que escribas shaders propios (WGSL vs GLSL).
- Existe un renderer **Canvas experimental** (desde 8.16) como fallback para entornos sin GPU. No diseñar contando con él.

## Pipeline de render (el "porqué" del rendimiento de v8)

En cada frame el renderer:

1. Recorre el scene graph y construye una **lista de instrucciones de render**.
2. Sube los datos de la escena a la GPU **en un solo lote**.
3. Ejecuta las instrucciones.

La clave es que el pipeline es **reactivo**: si la estructura de la escena no cambió, las instrucciones del frame anterior se reutilizan; si un objeto no se movió, no se recalcula su transform. Benchmarks oficiales v7→v8: 100k sprites estáticos pasaron de ~21ms a **0.12ms** de CPU por frame.

**Consecuencia de diseño:** las escenas estables son casi gratis. Penaliza crear/destruir/reordenar nodos cada frame; favorece pools de objetos y toggles de `visible`.

## Batching

El renderer agrupa draw calls consecutivos que comparten estado en lotes de hasta 2,048 quads. Un **batch break** (flush del lote y arranque de otro) ocurre cuando entre dos objetos consecutivos cambia:

- la textura *fuente* (dos regiones del mismo atlas **no** rompen el batch),
- el blend mode,
- o aparece un filtro/máscara.

De aquí salen las dos reglas de oro del proyecto:

1. **Todo sprite vive en un atlas.** Texturas sueltas = batch breaks = draw calls extra.
2. **Filtros, máscaras y blend modes exóticos se usan con intención**, no por conveniencia.

## Scene graph y render groups

La escena es un árbol de `Container` con raíz en `app.stage`. Transform, alpha, tint y blend mode **heredan** hacia abajo: rotar un contenedor rota todos sus hijos. El orden de dibujo es el orden de inserción (el segundo hijo se pinta encima del primero).

Un contenedor con `isRenderGroup: true` delega su transform a la GPU. Es el mecanismo idiomático para **cámaras 2D**: el mundo entero cuelga de un render group y mover la "cámara" es mover ese nodo — la GPU traslada todo sin recalcular transforms en CPU.

```ts
const world = new Container({ isRenderGroup: true });
app.stage.addChild(world);
// cámara: world.position.set(-player.x + screenW / 2, -player.y + screenH / 2)
```

Cuando el orden visual no puede coincidir con la jerarquía lógica (p. ej. la barra de vida de un enemigo debe pintarse sobre *todos* los enemigos), la herramienta es `RenderLayer`, no reestructurar el árbol.

## Decisiones de empaquetado de v8 que nos afectan

- **Paquete único** `pixi.js` con buen tree-shaking. No usar los paquetes `@pixi/*` granulares de v7 en código nuevo.
- Funcionalidad opcional vive en **subpaths**: `pixi.js/advanced-blend-modes`, `pixi.js/html-source`, etc. Importar solo lo que se usa.
- API de `Graphics` estilo Canvas 2D encadenable (`.rect().fill()`); la API vieja (`beginFill`) está deprecada.

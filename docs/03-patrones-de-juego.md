# 03 — Patrones de juego

PixiJS no impone arquitectura de juego. Estos son los patrones que este proyecto adopta para llenar ese vacío. Son convenciones: si un caso real las contradice, se discute en PR, no se ignoran en silencio.

> **Nota (2026-07):** las secciones de *game loop con timestep fijo* e *input de teclado* aplican solo a gameplay en tiempo real. El juego actual es un 4X por turnos con loop event-driven (doc 07 §"Traducción técnica"), así que esos módulos no existen en `src/core/` — este doc conserva los patrones como referencia por si aparece un modo en tiempo real.

## Estructura de carpetas

```
src/
  main.ts            # bootstrap: Application, Assets.init, primera escena
  core/
    scene.ts         # contrato Scene + SceneManager
    input.ts         # estado de teclado/puntero consultable
    fixed-step.ts    # acumulador de timestep fijo
  scenes/
    boot.ts          # carga del bundle inicial + pantalla de carga
    menu.ts
    game.ts
  entities/          # jugador, enemigos, proyectiles… (lógica + vista juntas)
  ui/                # HUD, botones, overlays
public/assets/       # salida del pipeline de assets (atlases, fuentes, audio)
```

Principio: **la lógica de gameplay no importa nada de `pixi.js` salvo tipos de display**. Cuanto más aislado esté el render, más fácil es testear la lógica pura (colisiones, spawns, economía) sin navegador.

## Escenas

Una escena = un `Container` con ciclo de vida. El manager monta una a la vez sobre el stage.

```ts
export interface Scene {
  readonly view: Container;
  init(): Promise<void>;          // cargar bundle propio, construir árbol
  update(ticker: Ticker): void;   // llamado por el ticker del manager
  destroy(): void;                // liberar TODO lo creado en init
}
```

Reglas:

- `init()` carga su propio bundle de assets (`Assets.loadBundle(this.name)`) — la pantalla de carga es responsabilidad del manager.
- `destroy()` es espejo exacto de `init()`: cada `addChild`, cada listener de `window`, cada tween registrado en `init` se revierte aquí. Las fugas de memoria en Pixi son casi siempre escenas que no limpian.
- Transiciones (fade, slide) viven en el manager, no en cada escena.

## Game loop: render variable, lógica fija

El ticker corre a la frecuencia del monitor (60/120/144Hz). La lógica de simulación (movimiento, colisiones, timers de gameplay) corre a **paso fijo** para ser determinista e independiente del hardware:

```ts
const STEP_MS = 1000 / 60;
let accumulator = 0;

app.ticker.add((ticker) => {
  accumulator = Math.min(accumulator + ticker.deltaMS, STEP_MS * 5); // clamp anti-espiral
  while (accumulator >= STEP_MS) {
    simulate(STEP_MS);          // lógica: SIEMPRE pasos de 16.6ms exactos
    accumulator -= STEP_MS;
  }
  render(accumulator / STEP_MS); // opcional: interpolar posiciones visuales
});
```

- El clamp evita la "espiral de la muerte" cuando una pestaña vuelve de background con 5 segundos acumulados.
- Animaciones puramente cosméticas (parallax, partículas decorativas) pueden usar `deltaTime` directo fuera de `simulate`.

## Input

Pixi cubre puntero sobre objetos; el teclado y el input "de juego" (¿está pulsada la izquierda *ahora*?) se modelan como **estado consultable**, no como cascada de eventos:

```ts
// core/input.ts — se actualiza con listeners de window, se consulta en simulate()
export const input = {
  held: new Set<string>(),          // KeyW, ArrowLeft…
  pressedThisStep: new Set<string>(), // limpiado al final de cada paso fijo
};
```

- Gameplay lee `input.held.has('KeyW')` dentro de `simulate()` — nunca mueve entidades desde el listener del evento (rompería el timestep fijo).
- UI (botones, menús) sí usa eventos Pixi (`pointerdown` con `eventMode: 'static'`).

## Entidades

Para el alcance de este proyecto: **clase por entidad, con su vista dentro** (no ECS — se adopta solo si el conteo de entidades o la combinatoria de comportamientos lo justifica).

```ts
export class Enemy {
  readonly view: Sprite;
  constructor(texture: Texture) { this.view = new Sprite(texture); }
  update(stepMS: number) { /* lógica */ }
  destroy() { this.view.destroy(); }
}
```

- Entidades de vida corta y alta frecuencia (proyectiles, partículas de gameplay, números de daño) **se poolean**: `visible = false` + reset en lugar de `destroy()` + `new`. Crear/destruir nodos cada frame pelea contra el pipeline reactivo de v8 y genera presión de GC.
- El contenedor `world` (con `isRenderGroup: true`) es la cámara; las entidades viven en subcontenedores por tipo (`world.enemies`, `world.bullets`) para culling y limpieza por lotes.

## Pipeline de assets

- Fuente de verdad: carpeta `raw-assets/` (PSD/PNG sueltos) procesada por **AssetPack** → atlases + manifest en `public/assets/`.
- Mientras el pipeline no exista, la regla mínima es: empaquetar sprites con TexturePacker/free-tex-packer en un atlas JSON por bundle, y mantener el manifest de `Assets.init` a mano.
- Audio vía `@pixi/sound`, declarado en el mismo manifest.

## Resoluciones y escalado

- `resizeTo: window` + `resolution: devicePixelRatio` + `autoDensity: true` en `init`.
- El juego diseña sobre una **resolución lógica fija** (p. ej. 1280×720) y el bootstrap escala/centra el stage con letterboxing. Nunca posicionar UI con píxeles de pantalla física.
- Escuchar `app.renderer.on('resize', ...)` para recolocar HUD anclado a bordes.

## Errores comunes que este proyecto prohíbe

1. Mover entidades desde listeners de eventos (rompe determinismo).
2. `new Text(...)` para contadores que cambian cada frame (usar `BitmapText`).
3. Cargar texturas con URLs sueltas fuera del manifest.
4. Escenas que hacen `removeChild` sin `destroy` (fuga de GPU).
5. Lógica multiplicada por `deltaTime` dentro de `simulate()` (el paso ya es fijo; ahí se multiplica por `STEP_MS`).

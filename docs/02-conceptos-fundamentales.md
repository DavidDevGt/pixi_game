# 02 — Conceptos fundamentales

Las seis piezas con las que se construye todo: `Application`, `Container`, `Sprite`/`Texture`, `Assets`, `Ticker` y el sistema de eventos. Más `Graphics` y `Text` como primitivas de apoyo.

## Application

Punto de entrada: crea el renderer, el stage y el ticker. La inicialización es **asíncrona** (carga solo el backend detectado).

```ts
import { Application } from 'pixi.js';

const app = new Application();
await app.init({
  background: '#101020',
  resizeTo: window,            // se ajusta solo al resize
  resolution: window.devicePixelRatio, // nitidez en pantallas HiDPI
  autoDensity: true,           // el canvas CSS mantiene tamaño lógico
});
document.body.appendChild(app.canvas);
```

- `app.stage` — raíz del scene graph.
- `app.ticker` — bucle de render (ver más abajo).
- `app.renderer` — acceso directo al renderer (raro necesitarlo en gameplay).

Una sola `Application` por juego. Las "pantallas" (menú, gameplay, pausa) son contenedores que se montan/desmontan del stage, no aplicaciones nuevas.

## Container

Nodo genérico del árbol. Agrupa hijos y les hereda transform, alpha, tint y blend mode.

```ts
const enemies = new Container();
world.addChild(enemies);
enemies.addChild(enemy1, enemy2);
enemies.alpha = 0.5; // afecta a todos los hijos
```

- Orden de dibujo = orden de inserción. Para orden explícito: `container.sortableChildren = true` + `child.zIndex` (tiene costo; usarlo en contenedores concretos, no globalmente).
- `visible = false` salta render **y** no rompe las instrucciones cacheadas — preferirlo a `addChild`/`removeChild` para toggles frecuentes.
- Posicionar/rotar grupos completos vía su contenedor, no hijo por hijo.

## Texture y Sprite

`Texture` es la referencia a píxeles en GPU (o a una región de un atlas); `Sprite` es una instancia dibujable de una textura con transform propio. **Muchos sprites pueden compartir una textura** — eso es lo que hace el batching barato.

```ts
const texture = Assets.get('player');      // ya cargada (ver Assets)
const player = new Sprite(texture);
player.anchor.set(0.5);                    // origen en el centro (rotación/posición)
player.position.set(400, 300);
player.scale.set(2);
```

- `anchor` está en coordenadas normalizadas (0–1) y define el punto de origen para posición y rotación.
- Rotaciones en **radianes**.
- `sprite.tint = 0xff0000` tiñe sin costo de shader adicional.
- Para animaciones por frames: `AnimatedSprite` con frames de un spritesheet.

## Assets

Sistema de carga central. Cachea por clave, deduplica peticiones en vuelo y resuelve formatos (png, webp, atlas JSON, fuentes, audio con plugin).

```ts
import { Assets } from 'pixi.js';

// Al arrancar: declarar un manifest con bundles por pantalla
await Assets.init({ manifest: {
  bundles: [
    { name: 'game', assets: [
      { alias: 'atlas',  src: 'assets/atlas.json' },   // spritesheet TexturePacker/AssetPack
      { alias: 'player', src: 'assets/player.png' },
    ]},
  ],
}});

await Assets.loadBundle('game');       // pantalla de carga aquí
const tex = Assets.get('player');      // síncrono una vez cargado
Assets.backgroundLoadBundle('level2'); // precarga en segundo plano
```

Regla del proyecto: **nada de URLs sueltas en gameplay** — todo asset pasa por el manifest con alias. Los sprites del juego salen de atlases (ver [04 — Rendimiento](04-rendimiento.md)).

## Ticker

Callback por frame, alineado con `requestAnimationFrame`.

```ts
app.ticker.add((ticker) => {
  // ticker.deltaTime: frames "ideales" transcurridos (1.0 a 60fps estables)
  // ticker.deltaMS:   milisegundos reales desde el frame anterior
  player.x += speed * ticker.deltaTime;
});
```

- **Siempre escalar el movimiento por `deltaTime`/`deltaMS`.** Código dependiente de framerate corre al doble en monitores de 120Hz.
- La lógica que debe ser determinista (físicas, colisiones) usa *fixed timestep* encima del ticker — patrón en [03 — Patrones de juego](03-patrones-de-juego.md).
- `ticker.add(fn, context, priority)` acepta prioridad; útil para garantizar orden input → lógica → cámara.

## Eventos e interacción

Sistema de eventos tipo DOM sobre el scene graph (pointer unifica mouse y touch).

```ts
button.eventMode = 'static';        // opt-in: por defecto los objetos no son interactivos
button.cursor = 'pointer';
button.on('pointerdown', onPress);
button.hitArea = new Rectangle(0, 0, 200, 80); // opcional: área explícita, más barato
```

- `eventMode`: `'static'` para UI que no se mueve cada frame; `'dynamic'` solo si el objeto se mueve bajo el puntero sin que el puntero se mueva; `'none'` para excluir subárboles enteros del hit-testing (hacerlo en contenedores grandes de decorado).
- Input de teclado no pasa por Pixi: listeners estándar en `window` (ver patrones de input en el doc 03).

## Graphics

Dibujo vectorial (formas, líneas, paths SVG). API encadenable estilo Canvas 2D:

```ts
const g = new Graphics()
  .rect(0, 0, 200, 80)
  .fill({ color: 0x333366 })
  .stroke({ width: 2, color: 0xffffff });
```

- Ideal para prototipos, hit-areas visibles, barras de vida, debug overlays.
- Redibujar un `Graphics` cada frame (`.clear()` + redibujo) es costoso; si la forma no cambia, dibujarla una vez. Si cambia solo de tamaño (barra de vida), preferir escalar un `Sprite` de 1×1 px blanco con `tint`.
- `GraphicsContext` permite compartir la misma geometría entre muchas instancias (análogo a textura compartida entre sprites).

## Text

Tres implementaciones, con costos muy distintos:

| Clase | Cómo funciona | Cuándo usar |
|---|---|---|
| `Text` | Rasteriza a textura vía Canvas 2D **en cada cambio** | Texto estático o que cambia poco |
| `BitmapText` | Glifos pre-rasterizados, se batchea | Texto que cambia cada frame (score, contadores, daño flotante) |
| `HTMLText` | Renderiza HTML/CSS a textura | Texto enriquecido puntual, nunca en hot path |

Regla: **cualquier número que cambie durante gameplay es `BitmapText`**. v8 genera los glifos dinámicamente, así que basta `BitmapText` con una fuente ya cargada — no hace falta pre-generar el bitmap font.

## Ciclo de vida y destrucción

Los objetos Pixi referencian recursos GPU: sacarlos del stage **no** libera nada.

```ts
sprite.destroy();                            // libera el objeto, no la textura compartida
container.destroy({ children: true });        // destruye el subárbol
await Assets.unloadBundle('level1');          // libera las texturas del bundle
```

Patrón del proyecto: cada escena posee lo que crea y lo destruye en su `destroy()`; las texturas compartidas se gestionan a nivel de bundle, nunca con `texture: true` en objetos individuales. Detalle de fugas típicas en [04 — Rendimiento](04-rendimiento.md).

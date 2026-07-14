# 07 — Renderizado isométrico con mapa procedural

Cómo dibujar el tablero: proyección, orden de profundidad, capas de escena, y cómo un mapa 100% procedural se convierte en sprites sin generar arte en runtime salvo donde conviene. Cierra la serie técnica ([01](01-arquitectura.md)–[04](04-rendimiento.md)) aplicándola al género del proyecto.

## 1. Proyección: dimétrica 2:1 (la "isométrica de juegos")

La isométrica de videojuegos no es isométrica real (30°) sino **dimétrica 2:1**: cada tile es un rombo el doble de ancho que de alto. Es el estándar (Polytopia incluido) porque produce líneas de píxeles limpias y la matemática es entera.

**Decisión:** tile lógico de **128×64 px** (media: `W2 = 64`, `H2 = 32`). Suficiente detalle para móvil retina sin inflar atlases.

```ts
// grid → pantalla (posición del vértice superior del rombo)
screenX = (gx - gy) * W2;
screenY = (gx + gy) * H2;

// pantalla → grid (picking del tap; usar Math.floor)
gx = (sx / W2 + sy / H2) / 2;
gy = (sy / H2 - sx / W2) / 2;
```

- Estas dos funciones viven en la **lógica pura** (sin Pixi) junto al resto de reglas: las usa el render, el picking y los tests.
- El picking por fórmula inversa es exacto para tiles planos; para tiles con altura visual (montañas) basta comprobar primero el tile calculado y luego su vecino superior (`gx-1, gy-1`) — no hace falta hit-testing por píxel.
- En móvil, el área táctil de una unidad es **el rombo lógico del tile completo**, no el sprite: dedos, no cursores.

## 2. Orden de profundidad (el problema clásico, y por qué el nuestro es fácil)

En isométrico, lo que está "más atrás" debe pintarse primero. La profundidad de una celda es simplemente:

```ts
depth = gx + gy;   // menor = más lejos = se pinta antes
```

El caso general (objetos que se mueven libremente, footprints multi-tile) es un problema serio. **El nuestro no lo es**: mapa ~16×16, un objeto por tile, movimiento por casillas discretas. Con ese tamaño:

- **Terreno**: no necesita orden entre sí (tiles planos que no se solapan verticalmente más que de forma determinista). Se pinta en doble bucle `for gy / for gx` — el "painter's algorithm" sale gratis del orden de inserción.
- **Objetos** (unidades, mejoras, montañas, bosques): un solo contenedor con `sortableChildren = true` y `zIndex = gx + gy`. Con ≤ 300 hijos, el sort es despreciable; se dispara solo cuando algo se mueve, no por frame (la escena por turnos está quieta el 95% del tiempo — el pipeline reactivo de v8 hace el resto).
- **Desempates** con offsets fraccionales: `zIndex = gx + gy + 0.5` para la unidad *sobre* una montaña del mismo tile, etc. Convención documentada en una tabla de constantes, no números mágicos dispersos.
- Lo que debe pintarse **siempre encima sin pelear con la profundidad** (anillo de selección, barras de vida, overlays de movimiento) no usa zIndex: va en `RenderLayer`, que desacopla orden visual de jerarquía (ver [doc 01](01-arquitectura.md)).

Advertencia registrada: el `zIndex` de Pixi es **local a su contenedor** — no es un z-buffer global. Por eso todos los objetos ordenables comparten un único contenedor `objects`.

## 3. Anclaje y convención de sprites

- Objetos: `anchor = (0.5, 1)` — el pie del sprite en el **vértice inferior del rombo** de su tile. Los sprites pueden ser más altos que 64px (montañas, edificios) y sobresalir hacia arriba sin romper nada: el orden de profundidad ya garantiza que tapen lo de atrás.
- Tiles de terreno: `anchor = (0.5, 0)` en el vértice superior, con la altura extra del arte (acantilados, agua) dibujada hacia abajo dentro del propio sprite.
- El "relieve" estilo Polytopia es **fingido**: una montaña es un sprite alto con el mismo footprint de 1 tile. Elevación real por niveles (offset en Y + acantilados autotileados) queda explícitamente fuera del alcance de fase 0.

## 4. Capas de la escena

```
app.stage
└─ world (isRenderGroup — cámara: pan/zoom con límites)
   ├─ terrain   (tiles planos, doble bucle, cacheAsTexture(true))
   ├─ objects   (sortableChildren, zIndex = gx+gy+frac)
   ├─ fog       (tiles de niebla / bordes)
   └─ boardUI   (RenderLayer: selección, rango de movimiento, rutas)
app.stage
└─ hud          (fijo a pantalla, fuera de la cámara)
```

- `terrain` se rasteriza una vez con `cacheAsTexture` y se invalida **solo al revelar niebla** — que es el único momento en que el terreno cambia. Entre turnos, el mapa entero cuesta un draw call.
- `fog` como capa propia permite animar la revelación sin tocar la caché del terreno.
- La cámara es el patrón del doc 01: mover `world`, nunca los hijos.

## 5. Mapa procedural → sprites: composición, no generación

"Todo es procedural" aplica a los **datos** (semilla → terreno, recursos, spawns). El arte es un **kit prerenderizado en atlas** que se *compone* proceduralmente. Polytopia funciona exactamente así. Cuatro técnicas, en orden de costo:

**a) Variantes seleccionadas por semilla.** 2–4 versiones de cada tile base (pasto, bosque…). La elección sale de un **PRNG sembrado propio** (p. ej. mulberry32), jamás de `Math.random()`: la misma semilla debe producir el mismo mapa *visual* en todos los dispositivos — obligatorio para el desafío diario compartido y para replays deterministas.

**b) Tinting para biomas y facciones.** `sprite.tint` es gratis (no rompe el batch, cero shaders): un mismo atlas de terreno produce N paletas de bioma/facción. Es la técnica de mayor palanca visual por costo — la "personalidad por tribu" de Polytopia es en gran parte esto.

**c) Composición por capas dentro del tile.** Un tile visible = pila de sprites: base + vegetación + recurso + mejora. La explosión combinatoria (4 terrenos × 3 recursos × N facciones) se resuelve componiendo, no dibujando cada combinación en el atlas.

**d) Autotiling para transiciones.** Donde el terreno cambia (costas, sobre todo), el tile correcto se elige por **bitmask de vecinos**. Para nuestro caso basta el esquema de **4 bits / 16 tiles** (solo vecinos cardinales) para las costas; el esquema completo "blob" de 47 tiles (8 vecinos) queda documentado como mejora si el arte lo pide. El mapeo bitmask→frame es una tabla en la lógica pura, testeable sin render.

**Generación en runtime, solo donde paga:** composiciones que se repiten idénticas muchas veces (p. ej. el tile de costa ya autotileado + tinte de bioma) pueden *bakearse* una vez a `RenderTexture` al cargar el mapa y reutilizarse como textura normal — atlas efectivo generado en runtime. Es optimización de fase 2, no de fase 0: primero componer con sprites, medir, luego bakear si hace falta.

## 6. Pipeline de assets resultante

- **Atlas `terrain`**: tiles base + variantes + los 16 de costa + niebla. Compartido por todas las partidas.
- **Atlas por facción**: unidades y edificios (la unidad de empaquetado = unidad de venta, doc 05). Lo que difiere solo en color entre facciones no se duplica: se tinta (técnica b).
- Arte fuente en grid 128×64 estricto con el pie en el vértice inferior; exportado con trim (el doc 04 aplica: la transparencia también se paga).

## 7. Presupuesto de rendimiento (móvil, WebView)

| Elemento | Costo esperado |
|---|---|
| Terreno 16×16 cacheado | 1 draw call |
| Objetos (~100–300 sprites, 1–2 atlases) | 1–3 draw calls |
| Niebla + boardUI | 1–2 draw calls |
| **Total en reposo** | **< 8 draw calls, ~0 ms de CPU** (escena estática + pipeline reactivo v8) |

Los picos son las animaciones de transición (movimiento, combate) — decenas de sprites interpolando, trivial. El riesgo real en WebView móvil no es el render del tablero sino descuidos de los docs 02–04: texto Canvas en el HUD, filtros por unidad, re-sort por frame. Presupuesto global: 60fps sostenidos en un gama media de 2022.

## 8. Decisiones adoptadas (resumen normativo)

1. Proyección dimétrica 2:1, tile 128×64; fórmulas grid↔pantalla en la lógica pura.
2. `depth = gx + gy` con offsets fraccionales tabulados; un único contenedor `objects` con sort bajo demanda (no por frame).
3. Anchor `(0.5, 1)` en objetos; relieve fingido con sprites altos; sin elevación real en fase 0.
4. Capas: `terrain` (cacheAsTexture) / `objects` / `fog` / `boardUI` (RenderLayer), bajo `world` (isRenderGroup) como cámara.
5. Arte = kit prerenderizado; proceduralidad = selección sembrada + tint + composición + autotile 4-bit. PRNG propio sembrado, nunca `Math.random()`.
6. Bake a `RenderTexture` solo si la medición lo justifica (fase 2).

## Fuentes

- [Isometric Tiles Math — Clint Bellanger](https://clintbellanger.net/articles/isometric_math/) (fórmulas 2:1 canónicas)
- [Understanding isometric grids — YellowAfterlife](https://yal.cc/understanding-isometric-grids/)
- [Isometric Projection in Game Development — Pikuma](https://pikuma.com/blog/isometric-projection-in-games)
- [Autotiling — Red Blob Games](https://www.redblobgames.com/articles/autotile/claude/) (bitmask 4/8 bits, blob 47)
- [Beyond Basic Autotiling — BorisTheBrave](https://www.boristhebrave.com/2021/09/12/beyond-basic-autotiling/)
- [Autotiling Technique — Excalibur.js](https://excaliburjs.com/blog/Autotiling%20Technique/)
- [pixijs/pixijs#8377 — discusión sobre depth/z-buffer por píxel](https://github.com/pixijs/pixijs/issues/8377) (por qué zIndex local + capas es el camino en Pixi)
- [@pixi/tilemap](https://api.pixijs.io/@pixi/tilemap.html) (alternativa evaluada: innecesaria a nuestra escala de 256 tiles)

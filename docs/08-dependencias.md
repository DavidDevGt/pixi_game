# 08 — Política de dependencias

Registro de decisiones sobre librerías: qué se rechazó y por qué, qué está pendiente, y qué se instalará cuando su fase lo pida. Regla general: **una dependencia entra cuando su alternativa hecha a mano supera el umbral de ~100 líneas con bugs sutiles probables** (gestos con inercia, audio multiplataforma, IAP), nunca por comodidad. Presupuesto de bundle: <500 KB inicial (doc 06).

## Rechazadas (no reabrir sin argumento nuevo)

| Librería | Razón |
|---|---|
| Físicas (matter.js, planck) | juego por turnos; cero necesidad (doc 05) |
| `@pixi/tilemap` | a 256 tiles es complejidad sin retorno (doc 07) |
| State management (redux/zustand/xstate) | el estado es un objeto serializable en lógica pura con funciones de transición propias |
| `pathfinding.js` | BFS/Dijkstra en retícula 16×16 son ~30 líneas testeables; se escriben con las unidades |
| React + `@pixi/react` para HUD | agranda bundle y complica el render; el HUD se hace con Pixi puro |
| `seedrandom` | `src/game/rng.ts` (mulberry32, 20 líneas testeadas) cubre el determinismo |

## Pendientes de decisión (con disparador explícito)

- **`pixi-viewport`** (cámara con inercia/deceleración). Disparador: feedback del playtest de fase 0 sobre el "feel" del pan/zoom. Hasta entonces, la cámara propia de `GameScene` (tap/pan/pinch/rueda, testeada e2e) es suficiente. Si se adopta, se migra — no se le añade inercia a la propia.
- **`simplex-noise`** (~2 KB, cero deps). Disparador: que el diseño pida biomas más orgánicos que los que da el drunkard's walk de `map.ts`.

## Se instalarán cuando su fase lo pida (no antes)

| Cuándo | Dependencia | Para qué |
|---|---|---|
| Con las unidades | micro-tween propio (~40 líneas); `@tweenjs/tween.js` solo si crece | animar movimiento/combate |
| Fase 0 tardía | `@pixi/sound` | SFX/música integrado con Assets |
| Vertical slice móvil | `@capacitor/app`, `@capacitor/haptics`, `@capacitor/preferences`, `@capacitor/status-bar`, `@capacitor/splash-screen` | botón atrás Android + pausa real, vibración, guardar partida/racha, presentación nativa |
| Con arte real | `AssetPack` (dev) | raw-assets → atlases + manifest (doc 03) |
| Fase 1 | telemetría (PostHog o endpoint propio) | los umbrales del plan de tracción necesitan datos |
| Fase 3 | RevenueCat o StoreKit/Billing directo | IAP de facciones — decisión de negocio |
| Solo si el arte lo pide | `@esotericsoftware/spine-pixi` | animación esqueletal |

## Código propio que se mantiene por decisión

`iso.ts` (aritmética), `rng.ts`, `map.ts`, `SceneManager`, la cámara de `GameScene`, y `tileset.ts` (placeholder que muere con el arte real). Los módulos de timestep fijo e input de teclado del doc 03 se **eliminaron como código muerto** (2026-07: el 4X por turnos es event-driven); si aparece gameplay en tiempo real, se recuperan del doc 03 §Game loop o del historial.

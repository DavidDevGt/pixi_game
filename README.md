# pixi_game

Juego de estrategia por turnos (4X lite) **para móvil**, construido sobre **PixiJS v8** y empaquetado con Capacitor. Inspirado en el playbook de The Battle of Polytopia.

## Documentación

La carpeta [docs/](docs/) contiene los fundamentos del framework y las convenciones del proyecto. Léela en orden si es tu primera vez con PixiJS:

| Doc | Contenido |
|---|---|
| [01 — Arquitectura del motor](docs/01-arquitectura.md) | Qué es (y qué no es) PixiJS, pipeline de render, backends, batching |
| [02 — Conceptos fundamentales](docs/02-conceptos-fundamentales.md) | Application, Container, Sprite, Texture, Assets, Ticker, Graphics, Text, eventos |
| [03 — Patrones de juego](docs/03-patrones-de-juego.md) | Game loop, escenas, input, pipeline de assets, estructura de carpetas |
| [04 — Rendimiento y memoria](docs/04-rendimiento.md) | Batching en la práctica, culling, render groups, gestión de memoria, qué evitar |
| [05 — Investigación: Polytopia](docs/05-investigacion-polytopia.md) | Síntesis de mercado, deconstrucción del diseño, debilidades del líder, lecciones |
| [06 — Estrategia móvil](docs/06-estrategia-movil.md) | El playbook de Polytopia adaptado a 2026: producto, monetización, fases, riesgos |
| [07 — Renderizado isométrico](docs/07-renderizado-isometrico.md) | Proyección 2:1, orden de profundidad, capas, mapa procedural → sprites, autotiling |

## Stack

- **PixiJS v8** — renderizado
- **TypeScript** (estricto) — la lógica de juego en `src/game/` es pura, sin imports de Pixi
- **Vite** — dev server y build · **Vitest** — tests de la lógica pura
- **Capacitor** — empaquetado iOS/Android e IAP
- **pnpm** — gestor de paquetes (`node-linker=hoisted` por Capacitor, ver `.npmrc`)

## Quickstart

```bash
pnpm install
pnpm dev        # dev server (accesible en LAN para probar en el móvil)
pnpm test       # tests de lógica pura
pnpm lint       # eslint
pnpm build      # typecheck + bundle de producción
pnpm cap:sync   # build + sincronizar con los proyectos nativos
```

## Estructura

```
src/
  main.ts        # bootstrap (Application, DPR cap, pausa en background)
  core/          # escenas, input, timestep fijo — infraestructura
  game/          # lógica pura sin Pixi (iso.ts, rng.ts) + tests
  scenes/        # escenas del juego (boot = retícula isométrica + picking)
```

## Referencias externas

- [Guías oficiales v8](https://pixijs.com/8.x/guides)
- [API completa](https://pixijs.download/release/docs/index.html)
- [Ejemplos interactivos](https://pixijs.com/8.x/examples)
- [PixiJS DevTools](https://pixijs.io/devtools/) — inspector de escena para el navegador
- Skills oficiales para agentes de código: `npx skills add https://github.com/pixijs/pixijs-skills`

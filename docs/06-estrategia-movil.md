# 06 — Estrategia: juego móvil siguiendo el playbook de Polytopia

Decisión de producto: **juego móvil**, el camino que Polytopia demostró que funciona. Este doc adapta su playbook a nuestra realidad (equipo mínimo, stack PixiJS, 2026, no 2016) sin autoengaños sobre lo que cambió en una década.

Base: [05 — Investigación comprimida](05-investigacion-polytopia.md).

## 1. El playbook de Polytopia, destilado

Lo que hizo Midjiwan, en orden:

1. **Un solo desarrollador, alcance brutalmente recortado**, un juego excelente en un nicho desatendido.
2. **Gratis de verdad al descargar**: la calidad premium sin fricción de precio genera el boca a boca.
3. **Monetización por contenido opcional** (tribus ~US$1–3, multijugador tras cualquier compra, skins). La confianza *es* el modelo de negocio.
4. **Featuring de las stores como motor de descubrimiento**: Apple y Google destacan activamente juegos premium sin ads — son escasos y dan prestigio a la plataforma.
5. **Década de mejora continua** sobre el mismo juego, sin secuelas ni reinvenciones.

## 2. Qué cambió de 2016 a 2026 (y qué hacemos al respecto)

| Realidad 2026 | Implicación | Nuestra respuesta |
|---|---|---|
| El descubrimiento orgánico en stores se desplomó; CPI de estrategia carísimo | no se puede "lanzar y esperar" | ASO de nicho + featuring como objetivo explícito + comunidad previa al lanzamiento |
| El featuring exige pulido excepcional día uno | no lanzar a medias | soft launch real antes del global |
| "Polytopia-like" ya existe como búsqueda | ASO barato con intención exacta | keywords: "polytopia", "4x strategy offline", "turn based strategy no ads" |
| El público quemado de F2P agresivo creció | nuestro posicionamiento es más fuerte que en 2016 | "sin ads, sin timers, sin p2w" como mensaje central de la ficha |

## 3. Producto (idéntico al playbook, con nuestros diferenciadores)

- **4X lite por turnos**: compresión coherente — mapa pequeño, ~30 turnos, una moneda, tech tree memorizable, combate determinista, partidas de 15–20 min (ver lecciones del doc 05).
- **Offline-first**: el single-player completo funciona sin conexión (metro, avión — es donde vive nuestro género en móvil).
- **Diferenciador nº1: la IA.** La debilidad histórica del líder. Escalera de dificultad real (sin bonus de trampa) + modos puzzle ("gana en 3 turnos") que además son el contenido de retención diaria.
- **Desafío diario** con el mismo mapa para todos y racha: el mecanismo de hábito (retención D7) vive dentro de la app; compartir el resultado es un plus, no la apuesta central.
- **Facciones = asimetría mínima viable = IAP.** Identidad visual propia — cero trade dress de Polytopia (las mecánicas no son protegibles; la expresión sí, y el posicionamiento de clon nos mata el featuring).

## 4. Monetización (copiada tal cual, es lo probado)

- Descarga gratis, single-player completo con 3–4 facciones gratuitas.
- **Facciones premium** (~US$2 c/u o pack), **multijugador** desbloqueado con cualquier compra (cuando exista, fase 3), **cosméticos** después.
- Nunca: ads, timers, energía, gacha, ventajas de pago. Es la línea que sostiene el featuring, las reviews y la comunidad.

## 5. Tecnología

- **PixiJS v8 + TypeScript + Vite**, empaquetado con **Capacitor** para iOS/Android. Un juego por turnos no necesita nada que un WebView moderno no dé; los docs [01](01-arquitectura.md)–[04](04-rendimiento.md) aplican íntegros.
- Ventajas colaterales vs. el stack Unity de Polytopia: binario ligero (mejor conversión de ficha a instalación), iteración de desarrollo en navegador, y la build web queda gratis como **demo jugable para prensa/creadores y ASO web** — canal de marketing, no el producto.
- Lógica del juego en TypeScript puro sin imports de Pixi: testeable, base de la IA, y lista para un servidor de multijugador asíncrono en fase 3.
- IAP vía plugin de Capacitor (StoreKit/Play Billing); telemetría mínima propia (eventos de partida, retención, conversión).

## 6. Fases

| Fase | Entregable | Puerta de salida |
|---|---|---|
| **0 — Core loop** (en navegador, por velocidad) | 1 mapa procedural, 2 facciones, IA básica, partida completa de 15 min | playtesters terminan solos su primera partida y piden otra |
| **1 — Vertical slice móvil** | Capacitor, táctil pulido, offline, desafío diario + racha, telemetría | D7 > 12% en beta cerrada (TestFlight / Play beta) |
| **2 — Soft launch** | Lanzamiento en 2–3 mercados pequeños (p. ej. NZ, Filipinas), ficha ASO completa, IAP activo | retención estable, conversión > 2%, reviews ≥ 4.5 |
| **3 — Global** | Lanzamiento mundial + pitch de featuring a Apple/Google, multijugador asíncrono, cadencia de contenido | — |

La comunidad se construye desde la fase 0: devlog público (r/gamedev, X) — la audiencia del devlog es la beta de la fase 1 y las primeras reviews de la fase 2.

## 7. Riesgos honestos

1. **El descubrimiento móvil 2026 es lo contrario de 2016.** El plan depende de tres patas: ASO de nicho, featuring (requiere el pulido de la fase 2) y comunidad previa. Si las tres fallan, el juego puede ser bueno e invisible — por eso el soft launch mide *antes* de gastar el lanzamiento global.
2. **Percepción de clon** → identidad visual propia innegociable + liderar el mensaje con lo que Polytopia no tiene (IA, puzzles, daily).
3. **Featuring no se controla** → se maximiza la probabilidad (premium sin ads, pulido, historia de "un dev") pero no se planifica sobre él como única pata.
4. **Alcance**: cada fase es shippeable y corta sin piedad. La lección nº8 del doc 05 manda sobre todas: el recorte de alcance es el producto.

## 8. En una frase

El mismo juego honesto y comprimido que demostró Polytopia, con la IA que ellos nunca tuvieron y un hábito diario integrado — construido con disciplina de fases y lanzado como se lanza en 2026: soft launch medido, ASO de nicho y featuring como premio al pulido, no como plan A.

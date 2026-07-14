/**
 * PRNG determinista sembrado (mulberry32).
 * La lógica de juego NUNCA usa Math.random(): la misma semilla debe producir
 * el mismo mapa en todos los dispositivos (desafío diario, replays).
 */

export type Rng = () => number;

/** Devuelve un generador uniforme en [0, 1). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Entero uniforme en [min, max] (ambos inclusive). */
export function randomInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Elemento uniforme de un array no vacío. */
export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error("pick() sobre array vacío");
  return items[randomInt(rng, 0, items.length - 1)] as T;
}

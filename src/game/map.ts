import { mulberry32, randomInt, type Rng } from "./rng";

/**
 * Generación procedural del mapa (doc 07 §5: la proceduralidad vive en los
 * DATOS). Lógica pura: sin imports de Pixi, determinista por semilla.
 */

export const MAP_SIZE = 16;

export type Terrain = "water" | "field" | "forest" | "mountain";

export interface GameMap {
  readonly size: number;
  readonly seed: number;
  /** row-major: index = gy * size + gx */
  readonly tiles: readonly Terrain[];
}

/** Fracción objetivo de tierra sobre el total de tiles. */
const LAND_TARGET = 0.55;
/** Probabilidad base de bosque sobre tierra, y bonus por vecindad (clustering). */
const FOREST_BASE = 0.16;
const FOREST_NEAR = 0.3;
/** Probabilidad de montaña sobre campo restante. */
const MOUNTAIN_BASE = 0.12;

export function generateMap(seed: number, size = MAP_SIZE): GameMap {
  const rng = mulberry32(seed);
  const tiles: Terrain[] = new Array<Terrain>(size * size).fill("water");
  const idx = (gx: number, gy: number): number => gy * size + gx;

  carveLand(rng, tiles, size, idx);
  growForests(rng, tiles, size, idx);
  raiseMountains(rng, tiles);

  return { size, seed, tiles };
}

export function tileAt(map: GameMap, gx: number, gy: number): Terrain | undefined {
  if (gx < 0 || gy < 0 || gx >= map.size || gy >= map.size) return undefined;
  return map.tiles[gy * map.size + gx];
}

export function isLand(terrain: Terrain | undefined): boolean {
  return terrain !== undefined && terrain !== "water";
}

/**
 * Continente por caminata aleatoria ("drunkard's walk") desde el centro,
 * confinada al interior: el anillo del borde queda siempre como agua.
 */
function carveLand(
  rng: Rng,
  tiles: Terrain[],
  size: number,
  idx: (gx: number, gy: number) => number,
): void {
  const target = Math.floor(size * size * LAND_TARGET);
  const maxSteps = size * size * 50;
  let land = 0;
  let x = size >> 1;
  let y = size >> 1;

  for (let step = 0; step < maxSteps && land < target; step++) {
    if (tiles[idx(x, y)] === "water") {
      tiles[idx(x, y)] = "field";
      land++;
    }
    const dir = randomInt(rng, 0, 3);
    if (dir === 0) x++;
    else if (dir === 1) x--;
    else if (dir === 2) y++;
    else y--;
    x = Math.min(Math.max(x, 1), size - 2);
    y = Math.min(Math.max(y, 1), size - 2);
  }
}

/** Dos pasadas: siembra dispersa y crecimiento junto a bosque existente. */
function growForests(
  rng: Rng,
  tiles: Terrain[],
  size: number,
  idx: (gx: number, gy: number) => number,
): void {
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === "field" && rng() < FOREST_BASE) tiles[i] = "forest";
  }

  // Snapshot: el crecimiento lee el estado de la pasada anterior para que el
  // resultado no dependa del orden de recorrido.
  const before = [...tiles];
  const nearForest = (gx: number, gy: number): boolean =>
    [
      before[idx(gx + 1, gy)],
      before[idx(gx - 1, gy)],
      before[idx(gx, gy + 1)],
      before[idx(gx, gy - 1)],
    ].includes("forest");

  for (let gy = 1; gy < size - 1; gy++) {
    for (let gx = 1; gx < size - 1; gx++) {
      const i = idx(gx, gy);
      if (before[i] === "field" && nearForest(gx, gy) && rng() < FOREST_NEAR) {
        tiles[i] = "forest";
      }
    }
  }
}

function raiseMountains(rng: Rng, tiles: Terrain[]): void {
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === "field" && rng() < MOUNTAIN_BASE) tiles[i] = "mountain";
  }
}

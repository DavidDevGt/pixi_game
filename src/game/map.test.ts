import { describe, expect, it } from "vitest";
import { generateMap, isLand, MAP_SIZE, tileAt, type Terrain } from "./map";

const SEEDS = [1, 2, 42, 1234, 20260714];

function count(tiles: readonly Terrain[], terrain: Terrain): number {
  return tiles.filter((t) => t === terrain).length;
}

describe("generateMap", () => {
  it("es determinista: la misma semilla produce el mismo mapa", () => {
    for (const seed of SEEDS) {
      expect(generateMap(seed)).toEqual(generateMap(seed));
    }
  });

  it("semillas distintas producen mapas distintos", () => {
    expect(generateMap(1).tiles).not.toEqual(generateMap(2).tiles);
  });

  it("tiene las dimensiones declaradas", () => {
    const map = generateMap(42);
    expect(map.size).toBe(MAP_SIZE);
    expect(map.tiles).toHaveLength(MAP_SIZE * MAP_SIZE);
  });

  it("el anillo del borde es siempre agua", () => {
    for (const seed of SEEDS) {
      const map = generateMap(seed);
      const last = map.size - 1;
      for (let i = 0; i < map.size; i++) {
        expect(tileAt(map, i, 0)).toBe("water");
        expect(tileAt(map, i, last)).toBe("water");
        expect(tileAt(map, 0, i)).toBe("water");
        expect(tileAt(map, last, i)).toBe("water");
      }
    }
  });

  it("la fracción de tierra queda en el rango de diseño", () => {
    for (const seed of SEEDS) {
      const map = generateMap(seed);
      const land = map.tiles.filter((t) => isLand(t)).length;
      const fraction = land / map.tiles.length;
      expect(fraction).toBeGreaterThan(0.4);
      expect(fraction).toBeLessThan(0.7);
    }
  });

  it("genera los cuatro terrenos", () => {
    for (const seed of SEEDS) {
      const { tiles } = generateMap(seed);
      expect(count(tiles, "water")).toBeGreaterThan(0);
      expect(count(tiles, "field")).toBeGreaterThan(0);
      expect(count(tiles, "forest")).toBeGreaterThan(0);
      expect(count(tiles, "mountain")).toBeGreaterThan(0);
    }
  });
});

describe("tileAt", () => {
  it("devuelve undefined fuera de límites", () => {
    const map = generateMap(1);
    expect(tileAt(map, -1, 0)).toBeUndefined();
    expect(tileAt(map, 0, -1)).toBeUndefined();
    expect(tileAt(map, MAP_SIZE, 0)).toBeUndefined();
    expect(tileAt(map, 0, MAP_SIZE)).toBeUndefined();
  });
});

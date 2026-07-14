import { describe, expect, it } from "vitest";
import { mulberry32, pick, randomInt } from "./rng";

describe("mulberry32", () => {
  it("la misma semilla produce la misma secuencia", () => {
    const a = mulberry32(1234);
    const b = mulberry32(1234);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });

  it("semillas distintas producen secuencias distintas", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const same = Array.from({ length: 20 }, () => a() === b());
    expect(same.every(Boolean)).toBe(false);
  });

  it("genera valores en [0, 1)", () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("randomInt", () => {
  it("respeta los límites inclusivos y los alcanza", () => {
    const rng = mulberry32(7);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const v = randomInt(rng, 2, 5);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(5);
      seen.add(v);
    }
    expect(seen).toEqual(new Set([2, 3, 4, 5]));
  });
});

describe("pick", () => {
  it("elige elementos del array de forma determinista", () => {
    const items = ["a", "b", "c"] as const;
    const a = mulberry32(9);
    const b = mulberry32(9);
    for (let i = 0; i < 50; i++) expect(pick(a, items)).toBe(pick(b, items));
  });

  it("lanza sobre array vacío", () => {
    expect(() => pick(mulberry32(1), [])).toThrow();
  });
});

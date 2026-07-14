import { describe, expect, it } from "vitest";
import { dailySeed } from "./seed";

describe("dailySeed", () => {
  it("deriva de la fecha UTC, no de la local", () => {
    // 23:30 UTC del 14/07 sigue siendo 14/07 aunque localmente sea día 15.
    expect(dailySeed(new Date(Date.UTC(2026, 6, 14, 23, 30)))).toBe(20260714);
    expect(dailySeed(new Date(Date.UTC(2026, 0, 1, 0, 0)))).toBe(20260101);
  });

  it("días distintos producen semillas distintas", () => {
    const a = dailySeed(new Date(Date.UTC(2026, 6, 14)));
    const b = dailySeed(new Date(Date.UTC(2026, 6, 15)));
    expect(a).not.toBe(b);
  });
});

import { describe, expect, it } from "vitest";
import { depthOf, gridToScreen, screenToGrid, TILE_H } from "./iso";

describe("gridToScreen", () => {
  it("proyecta el origen al origen", () => {
    expect(gridToScreen(0, 0)).toEqual({ sx: 0, sy: 0 });
  });

  it("proyecta ejes según la fórmula 2:1", () => {
    expect(gridToScreen(1, 0)).toEqual({ sx: 64, sy: 32 });
    expect(gridToScreen(0, 1)).toEqual({ sx: -64, sy: 32 });
    expect(gridToScreen(1, 1)).toEqual({ sx: 0, sy: 64 });
  });
});

describe("screenToGrid", () => {
  it("es inversa de gridToScreen en el centro de cada tile", () => {
    for (let gx = 0; gx < 16; gx++) {
      for (let gy = 0; gy < 16; gy++) {
        const { sx, sy } = gridToScreen(gx, gy);
        // centro del rombo = vértice superior + media altura
        expect(screenToGrid(sx, sy + TILE_H / 2)).toEqual({ gx, gy });
      }
    }
  });

  it("resuelve tiles con coordenadas negativas", () => {
    const { sx, sy } = gridToScreen(-3, 5);
    expect(screenToGrid(sx, sy + TILE_H / 2)).toEqual({ gx: -3, gy: 5 });
  });
});

describe("depthOf", () => {
  it("aumenta hacia la cámara y respeta offsets fraccionales", () => {
    expect(depthOf(0, 0)).toBeLessThan(depthOf(1, 0));
    expect(depthOf(2, 3)).toBe(5);
    expect(depthOf(2, 3, 0.5)).toBe(5.5);
  });
});

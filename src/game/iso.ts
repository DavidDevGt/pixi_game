/**
 * Proyección dimétrica 2:1 (doc 07 — Renderizado isométrico).
 * Lógica pura: sin imports de Pixi. La comparten render, picking y tests.
 */

export const TILE_W = 128;
export const TILE_H = 64;

const W2 = TILE_W / 2;
const H2 = TILE_H / 2;

export interface GridPos {
  gx: number;
  gy: number;
}

export interface ScreenPos {
  sx: number;
  sy: number;
}

/** Posición en pantalla del vértice superior del rombo del tile. */
export function gridToScreen(gx: number, gy: number): ScreenPos {
  return {
    sx: (gx - gy) * W2,
    sy: (gx + gy) * H2,
  };
}

/** Tile bajo un punto de pantalla (picking del tap). */
export function screenToGrid(sx: number, sy: number): GridPos {
  return {
    gx: Math.floor((sx / W2 + sy / H2) / 2),
    gy: Math.floor((sy / H2 - sx / W2) / 2),
  };
}

/**
 * Profundidad de pintado: menor = más lejos = se pinta antes.
 * `offset` fraccional desempata objetos del mismo tile (tabla en doc 07 §2).
 */
export function depthOf(gx: number, gy: number, offset = 0): number {
  return gx + gy + offset;
}

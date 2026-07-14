import { Graphics, type Renderer, type Texture } from "pixi.js";
import { TILE_H, TILE_W } from "../game/iso";
import type { Terrain } from "../game/map";

/**
 * Tileset placeholder generado en runtime: cada forma se dibuja UNA vez con
 * Graphics y se bakea a textura (doc 07 §5). Los sprites del mapa comparten
 * estas texturas y se batchean; nada se redibuja por frame.
 * Se sustituye por atlases de arte real sin tocar la escena.
 */

export interface Tileset {
  readonly terrain: Readonly<Record<Terrain, Texture>>;
  readonly tree: Texture;
  readonly peak: Texture;
}

const TERRAIN_COLOR: Record<Terrain, number> = {
  water: 0x2e5f8a,
  field: 0x8fbf5a,
  forest: 0x71a84e,
  mountain: 0x93987f,
};

const W2 = TILE_W / 2;
const H2 = TILE_H / 2;

export function createPlaceholderTileset(renderer: Renderer): Tileset {
  const bake = (g: Graphics): Texture => {
    const texture = renderer.generateTexture({ target: g, resolution: 2, antialias: false });
    g.destroy();
    return texture;
  };

  const diamond = (color: number): Graphics =>
    new Graphics()
      .moveTo(0, 0)
      .lineTo(W2, H2)
      .lineTo(0, TILE_H)
      .lineTo(-W2, H2)
      .closePath()
      .fill(color)
      .stroke({ width: 1, color: 0x10141c, alpha: 0.35 });

  // Árbol: tronco + dos copas superpuestas. Base en y=0 (pie del objeto).
  const tree = new Graphics()
    .rect(-3, -14, 6, 14)
    .fill(0x6b4a2b)
    .moveTo(0, -58)
    .lineTo(17, -26)
    .lineTo(-17, -26)
    .closePath()
    .fill(0x3e7a3a)
    .moveTo(0, -44)
    .lineTo(21, -10)
    .lineTo(-21, -10)
    .closePath()
    .fill(0x4c8f45);

  // Montaña: cono con cara sombreada y nieve. Base en y=0.
  const peak = new Graphics()
    .moveTo(0, -66)
    .lineTo(34, 0)
    .lineTo(-34, 0)
    .closePath()
    .fill(0x7d8292)
    .moveTo(0, -66)
    .lineTo(34, 0)
    .lineTo(0, 0)
    .closePath()
    .fill(0x686d7c)
    .moveTo(0, -66)
    .lineTo(11, -45)
    .lineTo(-11, -45)
    .closePath()
    .fill(0xe8ecf2);

  return {
    terrain: {
      water: bake(diamond(TERRAIN_COLOR.water)),
      field: bake(diamond(TERRAIN_COLOR.field)),
      forest: bake(diamond(TERRAIN_COLOR.forest)),
      mountain: bake(diamond(TERRAIN_COLOR.mountain)),
    },
    tree: bake(tree),
    peak: bake(peak),
  };
}

export function destroyTileset(tileset: Tileset): void {
  for (const texture of Object.values(tileset.terrain)) texture.destroy(true);
  tileset.tree.destroy(true);
  tileset.peak.destroy(true);
}

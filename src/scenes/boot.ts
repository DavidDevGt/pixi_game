import { Container, Graphics, type Application, type Ticker } from "pixi.js";
import type { Scene } from "../core/scene";
import { gridToScreen, screenToGrid, TILE_H, TILE_W } from "../game/iso";

const GRID = 8;

/**
 * Escena de verificación del pipeline: dibuja la retícula isométrica y
 * resalta el tile tocado (picking táctil). Se reemplaza por la carga real
 * de assets + menú cuando exista el juego.
 */
export class BootScene implements Scene {
  readonly view = new Container();

  private readonly world = new Container({ isRenderGroup: true });
  private readonly highlight = new Graphics();
  private cleanup: (() => void) | null = null;

  constructor(private readonly app: Application) {}

  async init(): Promise<void> {
    const grid = new Graphics();
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        this.diamondPath(grid, gx, gy);
        grid.stroke({ width: 1, color: 0x3a4356 });
      }
    }

    this.world.addChild(grid, this.highlight);
    this.view.addChild(this.world);
    this.center();

    const onResize = () => this.center();
    this.app.renderer.on("resize", onResize);
    this.cleanup = () => this.app.renderer.off("resize", onResize);

    // El picking usa el rombo lógico completo del tile (doc 07 §1).
    this.view.eventMode = "static";
    this.view.hitArea = this.app.screen;
    this.view.on("pointertap", (e) => {
      const local = this.world.toLocal(e.global);
      const { gx, gy } = screenToGrid(local.x, local.y);
      this.highlight.clear();
      if (gx >= 0 && gx < GRID && gy >= 0 && gy < GRID) {
        this.diamondPath(this.highlight, gx, gy);
        this.highlight.fill({ color: 0x4e78c4, alpha: 0.55 });
      }
    });
  }

  update(_ticker: Ticker): void {
    // Escena estática: nada por frame (pipeline reactivo de v8).
  }

  destroy(): void {
    this.cleanup?.();
    this.view.destroy({ children: true });
  }

  /** Traza el rombo del tile (gx, gy) sin pintarlo. */
  private diamondPath(g: Graphics, gx: number, gy: number): void {
    const { sx, sy } = gridToScreen(gx, gy);
    g.moveTo(sx, sy)
      .lineTo(sx + TILE_W / 2, sy + TILE_H / 2)
      .lineTo(sx, sy + TILE_H)
      .lineTo(sx - TILE_W / 2, sy + TILE_H / 2)
      .closePath();
  }

  /** Centra la retícula en pantalla (cámara = mover `world`, doc 01). */
  private center(): void {
    const { width, height } = this.app.screen;
    this.world.position.set(width / 2, (height - GRID * TILE_H) / 2);
  }
}

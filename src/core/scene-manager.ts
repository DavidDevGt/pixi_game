import type { Application, Container } from "pixi.js";
import type { Scene } from "./scene";

/**
 * Monta una escena a la vez sobre `app.stage` y la alimenta con el ticker.
 * Las transiciones (fade/slide) viven aquí, no en cada escena.
 */
export class SceneManager {
  private current: Scene | null = null;
  private changing = false;

  constructor(
    private readonly app: Application,
    private readonly root: Container = app.stage,
  ) {}

  async change(next: Scene): Promise<void> {
    // init() es async: un segundo change() durante la transición dejaría
    // dos escenas montadas o una destruida a medio init.
    if (this.changing) {
      throw new Error("SceneManager.change() llamado durante otra transición");
    }
    this.changing = true;
    try {
      if (this.current) {
        this.app.ticker.remove(this.current.update, this.current);
        this.root.removeChild(this.current.view);
        this.current.destroy();
        this.current = null;
      }

      await next.init();
      this.current = next;
      this.root.addChild(next.view);
      this.app.ticker.add(next.update, next);
    } finally {
      this.changing = false;
    }
  }
}

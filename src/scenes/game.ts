import {
  Container,
  Graphics,
  Sprite,
  type Application,
  type FederatedPointerEvent,
  type FederatedWheelEvent,
  type Renderer,
  type Ticker,
} from "pixi.js";
import type { Scene } from "../core/scene";
import { depthOf, gridToScreen, screenToGrid, TILE_H, TILE_W } from "../game/iso";
import { generateMap, tileAt, type GameMap } from "../game/map";
import { createPlaceholderTileset, destroyTileset, type Tileset } from "../render/tileset";

/** Desempates de profundidad dentro del mismo tile (doc 07 §2). */
const DEPTH_OBJECT = 0.5;

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
/** Un gesto que se mueve menos que esto (px CSS) cuenta como tap, no como pan. */
const TAP_SLOP = 8;

/**
 * Escena principal: mapa procedural renderizado por capas (doc 07 §4),
 * cámara pan/zoom táctil y selección de tile.
 */
export class GameScene implements Scene {
  readonly view = new Container();

  private readonly world = new Container({ isRenderGroup: true });
  private readonly terrainLayer = new Container();
  private readonly objectLayer = new Container();
  private readonly boardUI = new Container();
  private readonly highlight = new Graphics();

  private map: GameMap | null = null;
  private tileset: Tileset | null = null;
  private cleanup: (() => void)[] = [];

  // Estado del gesto activo (pan / pinch / tap).
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private gestureMoved = false;
  private gestureWasPinch = false;

  constructor(
    private readonly app: Application,
    private readonly seed: number,
  ) {}

  async init(): Promise<void> {
    this.map = generateMap(this.seed);
    this.tileset = createPlaceholderTileset(this.app.renderer as Renderer);

    this.buildTerrain(this.map, this.tileset);
    this.buildObjects(this.map, this.tileset);
    this.boardUI.addChild(this.highlight);

    this.objectLayer.sortableChildren = true;
    this.world.addChild(this.terrainLayer, this.objectLayer, this.boardUI);
    this.view.addChild(this.world);

    // El terreno solo cambia al revelar niebla (futuro): un draw call cacheado.
    this.terrainLayer.cacheAsTexture(true);

    this.fitCamera();
    const onResize = (): void => this.fitCamera();
    this.app.renderer.on("resize", onResize);
    this.cleanup.push(() => this.app.renderer.off("resize", onResize));

    this.installGestures();
  }

  update(_ticker: Ticker): void {
    // Escena por turnos: entre gestos no hay trabajo por frame.
  }

  destroy(): void {
    for (const dispose of this.cleanup) dispose();
    this.cleanup = [];
    this.view.destroy({ children: true });
    if (this.tileset) destroyTileset(this.tileset);
    this.tileset = null;
  }

  // ── Construcción ──────────────────────────────────────────────────────────

  private buildTerrain(map: GameMap, tileset: Tileset): void {
    // Doble bucle gy/gx: el orden de inserción ya es el painter's algorithm.
    for (let gy = 0; gy < map.size; gy++) {
      for (let gx = 0; gx < map.size; gx++) {
        const terrain = tileAt(map, gx, gy);
        if (!terrain) continue;
        const { sx, sy } = gridToScreen(gx, gy);
        const tile = new Sprite(tileset.terrain[terrain]);
        tile.anchor.set(0.5, 0);
        tile.position.set(sx, sy);
        this.terrainLayer.addChild(tile);
      }
    }
  }

  private buildObjects(map: GameMap, tileset: Tileset): void {
    for (let gy = 0; gy < map.size; gy++) {
      for (let gx = 0; gx < map.size; gx++) {
        const terrain = tileAt(map, gx, gy);
        const texture =
          terrain === "forest" ? tileset.tree : terrain === "mountain" ? tileset.peak : null;
        if (!texture) continue;

        const { sx, sy } = gridToScreen(gx, gy);
        const obj = new Sprite(texture);
        // Pie del objeto en el vértice inferior del rombo (doc 07 §3).
        obj.anchor.set(0.5, 1);
        obj.position.set(sx, sy + TILE_H);
        obj.zIndex = depthOf(gx, gy, DEPTH_OBJECT);
        this.objectLayer.addChild(obj);
      }
    }
  }

  // ── Cámara ────────────────────────────────────────────────────────────────

  /** Centra el mapa y lo escala para que quepa completo con margen. */
  private fitCamera(): void {
    if (!this.map) return;
    const { width, height } = this.app.screen;
    const mapW = this.map.size * TILE_W;
    const mapH = this.map.size * TILE_H;
    const scale = Math.min(width / mapW, height / mapH) * 0.95;

    this.world.pivot.set(0, mapH / 2);
    this.world.scale.set(clampZoom(scale));
    this.world.position.set(width / 2, height / 2);
  }

  private zoomAt(globalX: number, globalY: number, factor: number): void {
    const next = clampZoom(this.world.scale.x * factor);
    const local = this.world.toLocal({ x: globalX, y: globalY });
    this.world.scale.set(next);
    const after = this.world.toGlobal(local);
    this.world.position.x += globalX - after.x;
    this.world.position.y += globalY - after.y;
    this.clampPan();
  }

  /** El centro del mapa nunca sale de la pantalla. */
  private clampPan(): void {
    const { width, height } = this.app.screen;
    this.world.position.x = Math.min(Math.max(this.world.position.x, 0), width);
    this.world.position.y = Math.min(Math.max(this.world.position.y, 0), height);
  }

  // ── Gestos: tap (selección), drag (pan), pinch/rueda (zoom) ──────────────

  private installGestures(): void {
    this.view.eventMode = "static";
    this.view.hitArea = this.app.screen;

    this.view.on("pointerdown", this.onPointerDown);
    this.view.on("pointermove", this.onPointerMove);
    this.view.on("pointerup", this.onPointerUp);
    this.view.on("pointerupoutside", this.onPointerCancel);
    this.view.on("pointercancel", this.onPointerCancel);
    this.view.on("wheel", this.onWheel);
  }

  private readonly onPointerDown = (e: FederatedPointerEvent): void => {
    this.pointers.set(e.pointerId, { x: e.global.x, y: e.global.y });
    if (this.pointers.size === 1) {
      this.gestureMoved = false;
      this.gestureWasPinch = false;
    } else {
      this.gestureWasPinch = true;
    }
  };

  private readonly onPointerMove = (e: FederatedPointerEvent): void => {
    const prev = this.pointers.get(e.pointerId);
    if (!prev) return;

    const dx = e.global.x - prev.x;
    const dy = e.global.y - prev.y;

    if (this.pointers.size === 1) {
      if (Math.abs(dx) + Math.abs(dy) > TAP_SLOP) this.gestureMoved = true;
      if (this.gestureMoved) {
        this.world.position.x += dx;
        this.world.position.y += dy;
        this.clampPan();
      }
    } else if (this.pointers.size === 2) {
      // Pinch: zoom según el cambio de distancia entre los dos punteros.
      const other = [...this.pointers.entries()].find(([id]) => id !== e.pointerId)?.[1];
      if (other) {
        const prevDist = Math.hypot(prev.x - other.x, prev.y - other.y);
        const nextDist = Math.hypot(e.global.x - other.x, e.global.y - other.y);
        if (prevDist > 0) {
          const midX = (e.global.x + other.x) / 2;
          const midY = (e.global.y + other.y) / 2;
          this.zoomAt(midX, midY, nextDist / prevDist);
        }
      }
    }

    this.pointers.set(e.pointerId, { x: e.global.x, y: e.global.y });
  };

  private readonly onPointerUp = (e: FederatedPointerEvent): void => {
    this.pointers.delete(e.pointerId);
    if (this.pointers.size === 0 && !this.gestureMoved && !this.gestureWasPinch) {
      this.selectAt(e.global.x, e.global.y);
    }
  };

  private readonly onPointerCancel = (e: FederatedPointerEvent): void => {
    this.pointers.delete(e.pointerId);
  };

  private readonly onWheel = (e: FederatedWheelEvent): void => {
    this.zoomAt(e.global.x, e.global.y, Math.exp(-e.deltaY * 0.001));
  };

  // ── Selección ─────────────────────────────────────────────────────────────

  private selectAt(globalX: number, globalY: number): void {
    if (!this.map) return;
    const local = this.world.toLocal({ x: globalX, y: globalY });
    const { gx, gy } = screenToGrid(local.x, local.y);

    this.highlight.clear();
    if (tileAt(this.map, gx, gy)) {
      const { sx, sy } = gridToScreen(gx, gy);
      this.highlight
        .moveTo(sx, sy)
        .lineTo(sx + TILE_W / 2, sy + TILE_H / 2)
        .lineTo(sx, sy + TILE_H)
        .lineTo(sx - TILE_W / 2, sy + TILE_H / 2)
        .closePath()
        .fill({ color: 0xffffff, alpha: 0.25 })
        .stroke({ width: 2, color: 0xffe27a });
      // Hook de testabilidad para e2e (y debugging en dispositivo).
      document.body.dataset["selectedTile"] = `${gx},${gy}`;
    } else {
      delete document.body.dataset["selectedTile"];
    }
  }
}

function clampZoom(scale: number): number {
  return Math.min(Math.max(scale, ZOOM_MIN), ZOOM_MAX);
}

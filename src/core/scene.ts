import type { Container, Ticker } from "pixi.js";

/**
 * Contrato de escena (doc 03 — Patrones de juego).
 * Una escena = un Container con ciclo de vida. El SceneManager monta una a la vez.
 */
export interface Scene {
  readonly view: Container;
  init(): Promise<void>;
  update(ticker: Ticker): void;
  destroy(): void;
}

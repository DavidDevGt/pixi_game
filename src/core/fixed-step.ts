import type { Application, Ticker } from "pixi.js";

/** Paso fijo de simulación: 60 Hz independiente del monitor. */
export const STEP_MS = 1000 / 60;

/**
 * Acumulador de timestep fijo con clamp anti-espiral (pestaña en background).
 * La lógica recibe SIEMPRE pasos de STEP_MS exactos; el render opcional recibe
 * el resto interpolado (alpha en [0,1)).
 */
export class FixedStep {
  private accumulator = 0;
  private readonly maxFrame = STEP_MS * 5;

  constructor(
    app: Application,
    private readonly simulate: (stepMs: number) => void,
    private readonly render?: (alpha: number) => void,
  ) {
    app.ticker.add(this.tick);
  }

  private readonly tick = (ticker: Ticker): void => {
    this.accumulator = Math.min(this.accumulator + ticker.deltaMS, this.maxFrame);
    while (this.accumulator >= STEP_MS) {
      this.simulate(STEP_MS);
      this.accumulator -= STEP_MS;
    }
    this.render?.(this.accumulator / STEP_MS);
  };
}

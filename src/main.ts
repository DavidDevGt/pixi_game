import { Application } from "pixi.js";
import { SceneManager } from "./core/scene-manager";
import { dailySeed } from "./game/seed";
import { GameScene } from "./scenes/game";

/** `?seed=N` fija el mapa (debug, retos por link); sin él, la semilla diaria. */
function resolveSeed(): number {
  const raw = Number(new URLSearchParams(window.location.search).get("seed"));
  return Number.isInteger(raw) && raw > 0 ? raw : dailySeed();
}

async function bootstrap(): Promise<void> {
  const app = new Application();
  await app.init({
    background: "#0e1116",
    resizeTo: window,
    // DPR limitado a 2: en móviles con DPR 3+ el costo de fillrate no compensa
    // la nitidez extra para sprites prerenderizados.
    resolution: Math.min(window.devicePixelRatio, 2),
    autoDensity: true,
    antialias: false,
    powerPreference: "high-performance",
  });

  const root = document.getElementById("app");
  if (!root) throw new Error("No existe #app en index.html");
  root.appendChild(app.canvas);

  // Batería: sin render mientras la app está en background (WebView o pestaña).
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) app.ticker.stop();
    else app.ticker.start();
  });

  const scenes = new SceneManager(app);
  await scenes.change(new GameScene(app, resolveSeed()));

  // Hook de testabilidad: e2e (Playwright) espera esta marca para interactuar.
  document.body.dataset["appReady"] = "true";
}

void bootstrap();

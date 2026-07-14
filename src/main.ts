import { Application } from "pixi.js";
import { SceneManager } from "./core/scene-manager";
import { BootScene } from "./scenes/boot";

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
  await scenes.change(new BootScene(app));
}

void bootstrap();

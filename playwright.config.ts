import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  reporter: process.env["CI"] ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  webServer: {
    command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env["CI"],
    timeout: 120_000,
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    // Pixel = WebView Android (Chromium); iPhone = WKWebView (WebKit).
    // Son los dos runtimes reales del juego empaquetado con Capacitor.
    { name: "mobile-android", use: { ...devices["Pixel 7"] } },
    { name: "mobile-ios", use: { ...devices["iPhone 14"] } },
  ],
});

import { expect, test, type Page } from "@playwright/test";

async function gotoReady(page: Page, query = ""): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`/${query}`);
  await expect(page.locator("body[data-app-ready='true']")).toBeAttached({ timeout: 15_000 });
  return errors;
}

test("la app inicializa el renderer sin errores", async ({ page }) => {
  const errors = await gotoReady(page);

  const canvas = page.locator("#app canvas");
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  expect(box, "el canvas debe tener layout").not.toBeNull();
  expect(box!.width).toBeGreaterThan(100);
  expect(box!.height).toBeGreaterThan(100);

  expect(errors, "sin errores de página durante el arranque").toEqual([]);
});

test("el picking selecciona el tile central del mapa", async ({ page }) => {
  // Semilla fija: el mapa (y por tanto el test) es determinista.
  await gotoReady(page, "?seed=42");

  // El mapa 16×16 se centra en pantalla: el centro geométrico es el vértice
  // superior del tile (8, 8). Se clickea unos px por debajo para caer en el
  // INTERIOR del rombo — clickear el vértice exacto es ambiguo entre 4 tiles.
  const canvas = page.locator("#app canvas");
  const box = (await canvas.boundingBox())!;
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 + 12 } });

  await expect(page.locator("body")).toHaveAttribute("data-selected-tile", "8,8");
});

test("un tap fuera del mapa limpia la selección", async ({ page }) => {
  await gotoReady(page, "?seed=42");

  const canvas = page.locator("#app canvas");
  const box = (await canvas.boundingBox())!;
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 + 12 } });
  await expect(page.locator("body")).toHaveAttribute("data-selected-tile", "8,8");

  // Esquina superior izquierda: fuera del rombo del mapa isométrico.
  await canvas.click({ position: { x: 5, y: 5 } });
  await expect(page.locator("body")).not.toHaveAttribute("data-selected-tile", /.+/);
});

test("arrastrar hace pan sin disparar selección", async ({ page }) => {
  await gotoReady(page, "?seed=42");

  const canvas = page.locator("#app canvas");
  const box = (await canvas.boundingBox())!;
  const cx = box.width / 2;
  const cy = box.height / 2;

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 80, cy + 40, { steps: 5 });
  await page.mouse.up();

  // Un drag no debe seleccionar tile.
  await expect(page.locator("body")).not.toHaveAttribute("data-selected-tile", /.+/);

  // Tras el pan, el centro de pantalla ya no es el tile (8, 8).
  await canvas.click({ position: { x: cx, y: cy } });
  const selected = await page.locator("body").getAttribute("data-selected-tile");
  expect(selected).not.toBeNull();
  expect(selected).not.toBe("8,8");
});

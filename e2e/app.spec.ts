import { expect, test, type Page } from "@playwright/test";

async function gotoReady(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/");
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

test("el picking selecciona el tile del centro", async ({ page }) => {
  await gotoReady(page);

  // La retícula se centra en pantalla: el centro geométrico cae siempre
  // en el tile (4, 4) de la retícula 8×8, sea cual sea el viewport.
  const canvas = page.locator("#app canvas");
  const box = (await canvas.boundingBox())!;
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });

  await expect(page.locator("body")).toHaveAttribute("data-selected-tile", "4,4");
});

test("un tap fuera de la retícula limpia la selección", async ({ page }) => {
  await gotoReady(page);

  const canvas = page.locator("#app canvas");
  const box = (await canvas.boundingBox())!;
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(page.locator("body")).toHaveAttribute("data-selected-tile", "4,4");

  // Esquina superior izquierda: fuera del rombo de la retícula.
  await canvas.click({ position: { x: 5, y: 5 } });
  await expect(page.locator("body")).not.toHaveAttribute("data-selected-tile", /.+/);
});

import { expect, test } from "@playwright/test";

const DEMO_PASSWORD = "Demo-5022-rugby!";

test("la landing pública muestra problema, solución y accesos", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /El rugby tiene historia/ })).toBeVisible();
  await expect(page.getByText("EL PROBLEMA")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ingresar" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Registrarme/ }).first()).toBeVisible();
});

test("un aficionado se registra, sale y vuelve a ingresar", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  const email = `aficionado-${Date.now()}@prueba.5022.test`;
  await page.goto("/app/registro");
  await page.getByLabel("Nombre completo").fill("Persona de Prueba");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill("Clave-de-prueba-123");
  await page.getByRole("button", { name: /Crear cuenta y entrar/ }).click();
  await page.waitForURL("**/app/aficionado");
  await expect(page.getByRole("heading", { name: "Resumen" })).toBeVisible();

  await page.getByRole("button", { name: "Salir" }).click();
  await page.waitForURL("/");

  await page.goto("/app/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill("Clave-de-prueba-123");
  await page.getByRole("button", { name: /Entrar a mi panel/ }).click();
  await page.waitForURL("**/app/aficionado");
  expect(consoleErrors).toEqual([]);
});

test("el admin entra por /admin/login y un usuario común no puede", async ({ page }) => {
  await page.goto("/admin");
  await page.waitForURL("**/admin/login");

  await page.getByLabel("Correo electrónico").fill("admin@demo.5022.test");
  await page.getByLabel("Contraseña").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: /Entrar al panel/ }).click();
  await page.waitForURL("**/admin");
  await expect(page.getByText("Usuarios y aprobaciones")).toBeVisible();
  await page.getByRole("button", { name: "Salir" }).click();

  // Un aficionado con sesión no accede al panel de admin.
  await page.goto("/app/login");
  await page.getByLabel("Correo electrónico").fill("aficionado@demo.5022.test");
  await page.getByLabel("Contraseña").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: /Entrar a mi panel/ }).click();
  await page.waitForURL("**/app/aficionado");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login\?error=forbidden/);
});

import { expect, test } from '@playwright/test'

const CLAVE = 'Demo-Clave-2026'

test('la landing pública se ve con sus llamados a la acción', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ingresar' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Registrarme' }).first()).toBeVisible()
})

test('registro de un usuario nuevo, cierre de sesión y login', async ({ page }) => {
  const email = `nuevo.${Date.now()}@plantilla.test`
  await page.goto('/app/registro')
  await page.getByLabel('Nombre').fill('Persona Nueva')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(CLAVE)
  await page.getByRole('button', { name: 'Registrarme' }).click()
  await expect(page).toHaveURL(/\/app\/usuario$/)
  await expect(page.getByRole('heading', { name: /Hola, Persona Nueva/ })).toBeVisible()

  // La sesión persiste al recargar.
  await page.reload()
  await expect(page.getByRole('heading', { name: /Hola, Persona Nueva/ })).toBeVisible()

  await page.getByRole('button', { name: 'Salir' }).click()
  await page.goto('/app/ingresar')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(CLAVE)
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
  await expect(page).toHaveURL(/\/app\/usuario$/)
})

test('el socio nuevo queda pendiente hasta que el admin lo aprueba', async ({ page }) => {
  const email = `socio.${Date.now()}@plantilla.test`
  await page.goto('/app/registro')
  await page.getByLabel(/Socio/).check()
  await page.getByLabel('Nombre').fill('Socio Nuevo')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(CLAVE)
  await page.getByRole('button', { name: 'Registrarme' }).click()
  await expect(page).toHaveURL(/\/app\/socio$/)
  await expect(page.getByText(/pendiente de aprobación/)).toBeVisible()
  await page.getByRole('button', { name: 'Salir' }).click()

  await page.goto('/admin/login')
  await page.getByLabel('Email').fill('admin.demo@plantilla.test')
  await page.getByLabel('Contraseña').fill(CLAVE)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await page.getByRole('link', { name: 'Usuarios' }).click()
  await page.getByLabel(`Estado de ${email}`).selectOption('activo')
  await expect(page.getByLabel(`Estado de ${email}`)).toHaveValue('activo')
})

test('login de admin; un usuario común no entra al panel', async ({ page }) => {
  await page.goto('/admin/login')
  await page.getByLabel('Email').fill('usuario.demo@plantilla.test')
  await page.getByLabel('Contraseña').fill(CLAVE)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByText('no tiene permisos de administrador')).toBeVisible()

  await page.getByLabel('Email').fill('admin.demo@plantilla.test')
  await page.getByLabel('Contraseña').fill(CLAVE)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.getByRole('heading', { name: 'Administración' })).toBeVisible()
})

test('/admin sin sesión manda al login', async ({ page }) => {
  await page.goto('/admin/usuarios')
  await expect(page).toHaveURL(/\/admin\/login$/)
})

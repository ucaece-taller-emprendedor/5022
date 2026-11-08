import { expect, test, type Page } from '@playwright/test'

const CLAVE = 'Demo-Clave-2026'

async function entrar(page: Page, ruta: string, email: string) {
  await page.goto(ruta)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(CLAVE)
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
}

async function registrar(page: Page, tipo: RegExp, datos: { nombre: string; email: string; organizacion?: string }) {
  await page.goto('/app/registro')
  await page.getByRole('radio', { name: tipo }).check()
  if (datos.organizacion) await page.getByLabel(/Nombre del club|Nombre de la Unión/).fill(datos.organizacion)
  await page.getByLabel('Nombre', { exact: true }).fill(datos.nombre)
  await page.getByLabel('Email').fill(datos.email)
  await page.getByLabel('Contraseña').fill(CLAVE)
  await page.getByRole('button', { name: 'Registrarme' }).click()
}

test('la landing pública se ve con sus llamados a la acción y datos del torneo', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('El rugby tiene historia')
  await expect(page.getByRole('link', { name: 'Ingresar' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Registrarme' }).first()).toBeVisible()
  await expect(page.getByLabel('Vista previa del torneo')).toContainText('Torneo Regional')
  // No debe haber scroll horizontal (mobile first).
  const desborda = await page.evaluate<boolean>('document.documentElement.scrollWidth > document.documentElement.clientWidth')
  expect(desborda).toBe(false)
})

test('el explorador público muestra partidos y posiciones sin iniciar sesión', async ({ page }) => {
  await page.goto('/partidos')
  await expect(page.getByRole('heading', { name: 'Partidos y resultados' })).toBeVisible()
  await expect(page.getByTestId('fixture-fila').first()).toBeVisible()
  await page.goto('/posiciones')
  await expect(page.getByTestId('posicion-fila')).toHaveCount(8)
  await expect(page.getByTestId('posicion-fila').first()).toContainText('Mar del Plata Club')
})

test('registro de un aficionado, sesión persistente, salir y login', async ({ page }) => {
  const email = `fan.${Date.now()}@5022.test`
  await registrar(page, /^Aficionado/, { nombre: 'Persona Fan', email })
  await expect(page).toHaveURL(/\/app\/aficionado$/)
  await expect(page.getByText('Persona Fan').first()).toBeVisible()

  await page.reload()
  await expect(page).toHaveURL(/\/app\/aficionado$/)
  await expect(page.getByRole('heading', { name: 'Resumen' })).toBeVisible()

  await page.getByRole('link', { name: 'Posiciones', exact: true }).last().click()
  await expect(page.getByTestId('posicion-fila').first()).toBeVisible()

  await page.getByRole('button', { name: 'Salir' }).click()
  await entrar(page, '/app/ingresar', email)
  await expect(page).toHaveURL(/\/app\/aficionado$/)
})

test('un club nuevo queda pendiente, el admin lo aprueba y recién ahí carga su plantel', async ({ page }) => {
  const stamp = Date.now()
  const email = `club.${stamp}@5022.test`
  const club = `Club Prueba ${stamp}`
  await registrar(page, /^Club/, { nombre: 'Dirigente Prueba', email, organizacion: club })
  await expect(page).toHaveURL(/\/app\/club$/)
  await expect(page.getByText(/pendiente de aprobación/)).toBeVisible()
  await page.getByRole('button', { name: 'Salir' }).click()

  // El admin lo ve en pendientes y lo aprueba.
  await entrar(page, '/admin/login', 'admin@demo.5022.test')
  await expect(page).toHaveURL(/\/admin$/)
  await page.getByRole('link', { name: 'Usuarios y aprobaciones' }).click()
  await page.getByRole('button', { name: `Aprobar a ${email}` }).click()
  await expect(page.getByTestId(`pendiente-${email}`)).toHaveCount(0)
  await page.getByRole('link', { name: 'Clubes', exact: true }).click()
  await expect(page.getByRole('row', { name: new RegExp(`${club}.*Activo`) })).toBeVisible()
  await page.getByRole('button', { name: 'Salir' }).click()

  // El club ya puede operar: plantel, asistencia y lesiones.
  await entrar(page, '/app/ingresar', email)
  await expect(page).toHaveURL(/\/app\/club$/)
  await page.getByRole('link', { name: 'Plantel' }).click()
  await page.getByLabel('Nombre', { exact: true }).fill('Jugador de Prueba')
  await page.getByLabel('Posición').fill('Wing')
  await page.getByRole('button', { name: 'Agregar al plantel' }).click()
  await expect(page.getByTestId('jugador-fila')).toContainText('Jugador de Prueba')

  await page.getByRole('link', { name: 'Asistencias' }).click()
  await page.getByLabel('Asistencia de Jugador de Prueba').selectOption('presente')
  await expect(page.getByLabel('Asistencia de Jugador de Prueba')).toHaveValue('presente')
  await page.reload()
  await expect(page.getByLabel('Asistencia de Jugador de Prueba')).toHaveValue('presente')

  await page.getByRole('link', { name: 'Lesiones' }).click()
  await page.getByLabel('Jugador').selectOption({ label: 'Jugador de Prueba' })
  await page.getByRole('button', { name: 'Guardar registro' }).click()
  await expect(page.getByText('En recuperación').last()).toBeVisible()
})

test('un aficionado puede pedir el perfil de Unión y queda pendiente', async ({ page }) => {
  const email = `fan2.${Date.now()}@5022.test`
  await registrar(page, /^Aficionado/, { nombre: 'Aficionado Que Pide', email })
  await expect(page).toHaveURL(/\/app\/aficionado$/)
  await page.getByLabel('Perfil').selectOption('union')
  await page.getByLabel('Nombre del club o de la Unión').fill('Unión de Prueba')
  await page.getByRole('button', { name: 'Enviar solicitud' }).click()
  await expect(page).toHaveURL(/\/app\/union$/)
  await expect(page.getByText(/pendiente de aprobación/)).toBeVisible()
})

test('el club demo ve su panel y la Unión demo carga un resultado', async ({ page }) => {
  await entrar(page, '/app/ingresar', 'club@demo.5022.test')
  await expect(page).toHaveURL(/\/app\/club$/)
  await expect(page.getByText('Mar del Plata Club').first()).toBeVisible()
  await page.getByRole('link', { name: 'Plantel' }).click()
  await expect(page.getByTestId('jugador-fila')).toHaveCount(8)
  await page.getByRole('button', { name: 'Salir' }).click()

  await entrar(page, '/app/ingresar', 'union@demo.5022.test')
  await expect(page).toHaveURL(/\/app\/union$/)
  await page.getByRole('link', { name: 'Gestión de torneos' }).click()
  const fila = page.getByTestId('partido-fila').filter({ hasText: 'Biguá vs Pueyrredón' })
  const l = 10 + (Date.now() % 20)
  await fila.getByLabel('Puntos de Biguá').fill(String(l))
  await fila.getByLabel('Puntos de Pueyrredón').fill('7')
  await fila.getByRole('button', { name: /Guardar resultado/ }).click()
  await page.getByRole('link', { name: 'Competencias' }).click()
  await expect(page.getByTestId('posicion-fila')).toHaveCount(8)
})

test('login de admin; un usuario común no entra al panel', async ({ page }) => {
  await entrar(page, '/admin/login', 'aficionado@demo.5022.test')
  await expect(page.getByText('no tiene permisos de administrador')).toBeVisible()

  await page.getByLabel('Email').fill('admin@demo.5022.test')
  await page.getByLabel('Contraseña').fill(CLAVE)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.getByRole('heading', { name: 'Administración' })).toBeVisible()
  await expect(page.getByTestId('pendientes')).toBeVisible()
})

test('/admin sin sesión manda al login y los paneles exigen el rol', async ({ page }) => {
  await page.goto('/admin/usuarios')
  await expect(page).toHaveURL(/\/admin\/login$/)
  await entrar(page, '/app/ingresar', 'aficionado@demo.5022.test')
  await expect(page).toHaveURL(/\/app\/aficionado$/)
  await page.goto('/app/club')
  await expect(page).toHaveURL(/\/app\/aficionado$/)
})

test('olvidé mi contraseña: login de admin y de usuarios piden el mail y confirman el envío', async ({ page }) => {
  for (const ruta of ['/admin/login', '/app/ingresar']) {
    await page.goto(ruta)
    await page.getByRole('button', { name: 'Olvidé mi contraseña' }).click()
    await page.getByLabel('Email de tu cuenta').fill('no-es-un-email')
    await page.getByRole('button', { name: 'Enviarme el enlace' }).click()
    await expect(page.getByText('Ingresá un email válido.')).toBeVisible()
    await page.getByLabel('Email de tu cuenta').fill('alguien@ejemplo.test')
    await page.getByRole('button', { name: 'Enviarme el enlace' }).click()
    await expect(page.getByText('te enviamos el enlace')).toBeVisible()
  }
})

test('el admin ve "Cambiar mi contraseña" en su panel', async ({ page }) => {
  await page.goto('/admin/login')
  await page.getByLabel('Email', { exact: true }).fill('admin@demo.5022.test')
  await page.getByLabel('Contraseña').fill('Demo-Clave-2026')
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await page.getByRole('button', { name: 'Cambiar mi contraseña' }).click()
  await expect(page.getByText('Te enviamos un mail con el enlace.')).toBeVisible()
})

test('un admin le da el rol de admin a un usuario ya registrado, que entra a /admin', async ({ page, browser }, info) => {
  const email = `futura.admin.${info.project.name}.${Date.now()}@ejemplo.test`
  await page.goto('/app/registro')
  await page.getByRole('radio', { name: /^Aficionado/ }).check()
  await page.getByLabel('Nombre', { exact: true }).fill('Futura Admin')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(CLAVE)
  await page.getByRole('button', { name: 'Registrarme' }).click()
  await expect(page).toHaveURL(/\/app\/aficionado$/)

  const ctx = await browser.newContext({ baseURL: info.project.use.baseURL, viewport: info.project.use.viewport ?? null })
  const adm = await ctx.newPage()
  await adm.goto('/admin/login')
  await adm.getByLabel('Email', { exact: true }).fill('admin@demo.5022.test')
  await adm.getByLabel('Contraseña').fill(CLAVE)
  await adm.getByRole('button', { name: 'Ingresar', exact: true }).click()
  await expect(adm).toHaveURL(/\/admin$/)
  await adm.goto('/admin/administradores')
  await expect(adm.getByText('primero tiene que registrarse en la app')).toBeVisible()
  await adm.getByLabel('Buscar por nombre o email').fill(email)
  await adm.getByTestId(`admin-fila-${email}`).getByRole('button', { name: 'Hacer admin' }).click()
  await expect(adm.getByTestId(`admin-fila-${email}`).getByRole('button', { name: 'Quitar admin' })).toBeVisible()
  await ctx.close()

  // La persona ya tenía sesión: al recargar, su perfil dice admin y /admin/login la deja pasar al panel.
  await page.goto('/admin/login')
  await expect(page).toHaveURL(/\/admin$/)
})

# 5022

Plataforma de información y gestión del rugby de Mar del Plata: resultados, fixtures, posiciones, estadísticas, asistencia a entrenamientos y lesiones. Roles: aficionado, club, Unión y superadmin. Cliente: la Unión de Rugby de Mar del Plata.

> Proyecto del **Taller Emprendedor** · Universidad CAECE (Mar del Plata) · cohorte 2026 2C.
> Docentes: Franco Vinciguerra y Luis Orviz Friser.

## El problema

La información del rugby marplatense (resultados, tablas, fixtures) está dispersa y no hay un lugar único para aficionados, clubes y la Unión.

## Qué es

Una app web con tres niveles de acceso:

| Ruta | Para quién | Qué hace |
| --- | --- | --- |
| `/` | Público | Landing con el problema, la solución, beneficios y accesos. También `/partidos` y `/posiciones` (resultados y tabla, solo lectura). |
| `/app/...` | Usuarios registrados | Registro y login (email/contraseña y Google), sesión persistente, mobile first. Panel según el perfil elegido al registrarse. |
| `/admin/...` | Superadmins | Solo login, **sin registro público**. Gestiona usuarios, aprobaciones, clubes, categorías, partidos y resultados. |

Perfiles dentro de `/app`:

- **Aficionado** (`/app/aficionado`): resumen, partidos, posiciones y estadísticas. Se aprueba solo.
- **Club** (`/app/club`): plantel, asistencias, lesiones, partidos y rendimiento. Queda **pendiente** hasta que un admin lo apruebe.
- **Unión** (`/app/union`): competencias, calendario y clubes. También queda **pendiente** hasta la aprobación del admin.

La tabla de posiciones se calcula a partir de los resultados (4 puntos por victoria, 2 por empate, sin bonus).

## Stack

Next.js (App Router) · TypeScript estricto · Tailwind CSS · Postgres (Neon) con Drizzle ORM y migraciones versionadas · Better Auth · Zod · Playwright.

## Equipo

- [gbaosueiro-cloud](https://github.com/gbaosueiro-cloud)
- [santiiglesias](https://github.com/santiiglesias)
- [Mateomoraza7](https://github.com/Mateomoraza7)
- [santicharles02](https://github.com/santicharles02)

## Demo

[https://5022-rugby.vercel.app](https://5022-rugby.vercel.app)

> La demo corre en el plan gratuito de Vercel, que es solo para uso personal y no comercial. Alcanza para esta demo académica con datos de ejemplo. Para un uso comercial hace falta un plan de pago o llevarse el proyecto a otra infraestructura (ver "Cómo llevarte este proyecto").

## Cómo correrla en local

Requisitos: Node.js 20+, npm y una base Postgres (una rama de [Neon](https://neon.tech) o un Postgres local).

```bash
npm install
cp .env.example .env        # completá DATABASE_URL, BETTER_AUTH_SECRET y ADMIN_EMAILS
npm run db:migrate          # aplica las migraciones de lib/db/migrations
npm run db:seed             # datos y usuarios de DEMO (solo en bases de prueba)
npm run dev                 # http://localhost:3000
```

Otros comandos: `npm run lint`, `npm run build`, `npm run test:e2e` (test de humo con Playwright; necesita la base migrada y con seed; la primera vez corré `npx playwright install chromium`).

Si cambiás el esquema (`lib/db/schema.ts`), generá la migración con `npm run db:generate` y subila al repo: no se toca la base a mano.

## Usuarios de prueba por rol

Son cuentas de **DEMO**, creadas por `npm run db:seed` con datos de ejemplo (no son datos reales). Todas usan la misma contraseña de demo: `Demo-5022-rugby!`

| Rol | Correo | Entra por |
| --- | --- | --- |
| Aficionado | `aficionado@demo.5022.test` | `/app/login` |
| Club (aprobado, Mar del Plata Club) | `club@demo.5022.test` | `/app/login` |
| Unión (aprobada) | `union@demo.5022.test` | `/app/login` |
| Superadmin | `admin@demo.5022.test` | `/admin/login` |

No corras el seed contra la base de producción real: es solo para entornos de prueba. Los datos demo están marcados (`is_demo`) y el seed es idempotente (borra y recrea solo lo demo).

## Variables de entorno

Se validan al arrancar (`lib/env.ts`): si falta una, el error dice cuál. Están documentadas en [`.env.example`](.env.example).

| Variable | Obligatoria | Para qué |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Cadena de conexión Postgres (Neon, con `sslmode=require`). |
| `BETTER_AUTH_SECRET` | Sí | Secreto de sesiones, mínimo 32 caracteres (`openssl rand -base64 32`). |
| `BETTER_AUTH_URL` | Sí | URL pública de la app (`http://localhost:3000` en local). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | Habilitan el login con Google. Si faltan, el botón queda deshabilitado (no se simula). |
| `ADMIN_EMAILS` | Sí | Correos de superadmin, separados por coma. |
| `ADMIN_SEED_PASSWORD` | No | Solo para `npm run db:admins`: crea los admins de `ADMIN_EMAILS` con email y contraseña (mín. 12 caracteres). |

### Superadmins

No hay registro público de admins. Dos vías:

1. **Google**: un correo de `ADMIN_EMAILS` que entra con Google (correo verificado por Google) recibe el rol admin.
2. **Email y contraseña**: definí `ADMIN_SEED_PASSWORD` y corré `npm run db:admins`.

El rol se valida **en el servidor** en cada página y server action del panel (`lib/auth/session.ts`: `requireRole` / `assertRole`), no solo ocultando botones.

### Google OAuth

Creá un cliente OAuth (tipo "Aplicación web") en Google Cloud y cargá estas URLs de redirección:

- Local: `http://localhost:3000/api/auth/callback/google`
- Producción: `https://<tu-dominio>/api/auth/callback/google`

## Estructura

```
app/(public)    landing y explorador público  → /
app/(app)/app   app de usuarios               → /app/...
app/admin       panel de administración       → /admin/...
lib/auth        Better Auth + requireRole/assertRole
lib/db          esquema Drizzle y migraciones versionadas
lib/validations esquemas Zod (se validan en el servidor)
lib/actions     server actions (cada una valida el rol)
components/     componentes de UI
scripts/        seed de demo y creación de admins
e2e/            test de humo (Playwright)
legacy/         index.html original (prototipo entregado en el 2do parcial)
```

## Estado

Migración del prototipo estático (`legacy/index.html`, "demo v5") a Next.js, conservando diseño, pantallas y contenido. Cambios respecto del original: datos y cuentas ahora viven en Postgres (antes `localStorage`), login real con Better Auth, el superadmin pasó de "solo lectura" a gestionar de verdad, y clubes/Unión requieren aprobación.

## Cómo llevarte este proyecto

1. Creá tu propia organización de GitHub.
2. Como Admin del repo, transferilo: **Settings → Danger Zone → Transfer**. Se conservan el historial, los issues y las estrellas, y los links viejos redirigen.
3. Creá tus propias cuentas de Vercel, Neon y el cliente OAuth de Google.
4. Copiá `.env.example` a `.env`, completá tus valores y desplegá.
5. Los usuarios de demo no se migran: la base de producción arranca de cero.

## Licencia

Pendiente de definir por la cátedra. Ver [LICENSE](LICENSE).

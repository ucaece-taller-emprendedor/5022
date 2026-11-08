# 5022 — Rugby de Mar del Plata (Taller Emprendedor, UCAECE)

**5022** es una plataforma de información y gestión del rugby marplatense: los **aficionados** ven resultados, fixtures, posiciones y estadísticas; los **clubes** (con aprobación del admin) gestionan plantel, asistencia y lesiones; la **Unión** (con aprobación del admin) ve competencias, calendario y clubes y puede crear torneos y cargar resultados; el **superadmin** gestiona usuarios, aprobaciones y los datos principales. Está construida desde la plantilla común del Taller (Vite + React + TypeScript + Tailwind + Firebase). **Todo gratis y sin tarjeta** (Firebase plan Spark + GitHub).

Sitio: https://5022-ucaecemdp.web.app (cuando se despliegue) · Proyecto Firebase: `rugby5022-mdp`.

> Es una **demo académica**: clubes, planteles, resultados y cuentas son ficticios y no representan información oficial de la Unión.

> **Trabajar con una IA / traspaso:** [`CLAUDE.md`](CLAUDE.md) · [`docs/TRABAJAR-CON-IA.md`](docs/TRABAJAR-CON-IA.md) · [`docs/INSTRUCTIVO-SETUP.md`](docs/INSTRUCTIVO-SETUP.md) · [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md)

## Qué incluye

| Parte | Ruta | Descripción |
|---|---|---|
| Web pública | `/`, `/partidos`, `/posiciones` | Landing (problema, solución, beneficios, CTA, botones Ingresar / Registrarme) y explorador público de resultados y tabla, con selector de categoría |
| App de usuarios | `/app/...` | Registro y login (Google y email/contraseña), sesión persistente, elección del tipo de usuario al registrarse. Paneles: `/app/aficionado`, `/app/club`, `/app/union` (cada uno con sus secciones). Mobile first |
| Administración | `/admin/...` | Solo login (sin registro público): usuarios y aprobaciones, clubes, categorías, partidos y resultados |

**Tipos de usuario:** aficionado (activo al registrarse) · club y unión (quedan **pendientes** hasta que el admin los aprueba; piden el nombre del club o de la Unión) · superadmin (custom claim, se da fuera de la app). Un aficionado puede pedir después el perfil de club o Unión desde su panel.

**Stack:** Vite + React + TypeScript estricto + Tailwind + React Router · Firebase (Auth + Firestore + Hosting) · Zod · ESLint · Vitest · Playwright · GitHub Actions. Sin servidor propio, sin Cloud Functions, sin Storage. Tipografías (Space Grotesk y DM Sans) incluidas en el build: no se piden a servidores externos.

## Correrlo en tu computadora (con emuladores, sin tocar producción)

Necesitás [Node.js 20+](https://nodejs.org) y [Java 21+](https://adoptium.net) (los emuladores de Firebase lo usan).

```bash
npm install
npm run emuladores        # terminal 1: emuladores de Auth y Firestore (UI en http://127.0.0.1:4524)
npm run seed              # terminal 2: carga los usuarios y datos DEMO
npm run dev:emulador      # terminal 2: la app en http://localhost:5122
```

Los emuladores empiezan vacíos cada vez que se reinician: volvé a correr `npm run seed`. Esta app usa puertos propios (app 5122, Auth 9522, Firestore 8523) para poder correr junto con otras apps de la cátedra.

### Usuarios de prueba (DEMO, claves públicas, solo existen en los emuladores)

Contraseña de todos: `Demo-Clave-2026`

| Tipo | Email | Estado |
|---|---|---|
| Aficionado | `aficionado@demo.5022.test` | activo |
| Club | `club@demo.5022.test` | activo, club "Mar del Plata Club" con plantel, asistencia y lesiones de ejemplo |
| Unión | `union@demo.5022.test` | activa |
| Club pendiente | `club.pendiente@demo.5022.test` | club "Los Tilos RC (pendiente)", para practicar la aprobación |
| Superadmin | `admin@demo.5022.test` | entra en `/admin/login` |

Todo lo demo está marcado `isDemo` y con la etiqueta DEMO en pantalla. Los datos incluyen 8 clubes, un torneo ("Torneo Regional · Primera") con 5 fechas (3 jugadas) y un plantel de 8 jugadores.

> **Login con Google:** no se puede probar contra los emuladores (Google no autentica en local). Se prueba en el sitio publicado.

## Datos y reglas

Colecciones: `users`, `clubs` (id = uid del dueño si lo registró él), `clubs/{id}/jugadores|asistencias|lesiones` (privadas del club), `categorias` y `partidos` (públicos). Las posiciones **se calculan** en el navegador a partir de los resultados (4 puntos por victoria y 2 por empate, sin bonus, igual que el prototipo original).

Las reglas (`firestore.rules`) verifican, entre otras cosas: que nadie cambie su propio rol ni estado (un club/unión no se aprueba solo), que los clubes pendientes no sean públicos, que el plantel, la asistencia y las lesiones solo los vean el club dueño (aprobado) y el admin, que solo el admin o una Unión aprobada gestionen torneos y resultados, y que los puntajes, enums, fechas y nombres de club sean válidos. Detalle en `firestore.rules` y `tests/rules/`.

Notas del modelo Firestore:
- No hay borrado en cascada: al borrar un club, un jugador o una categoría, la app borra a mano lo que cuelga de ellos (plantel, asistencia, lesiones, partidos).
- Aprobar un club = aprobar su cuenta en *Usuarios y aprobaciones*: activa el usuario y su club en un solo paso.
- Un partido guarda el nombre de los clubes (copia); si se renombra un club, los partidos viejos conservan el nombre anterior.

## Variables de entorno

Copiá `.env.example` a `.env` y completá con la config web de Firebase (Consola → Configuración del proyecto → Tus apps). **No son secretos** (van en el navegador), la seguridad la dan las reglas de Firestore. Para el sitio publicado, esos mismos valores van en `.env.production` (este sí se sube a git).

| Variable | Qué es |
|---|---|
| `VITE_FIREBASE_API_KEY`, `..._AUTH_DOMAIN`, `..._PROJECT_ID`, `..._APP_ID`, `..._MESSAGING_SENDER_ID` | Config web del proyecto Firebase |
| `VITE_USE_EMULATORS` | `true` solo en `.env.emulador` (ya viene así) |

## Comandos

| Comando | Para qué |
|---|---|
| `npm run dev:emulador` | App local contra emuladores |
| `npm run lint` · `npm run build` | Calidad (ESLint, TypeScript estricto, build) |
| `npm run test:reglas` | Tests de las reglas de seguridad (emulador de Firestore) |
| `npm run test:e2e` | Tests de humo con Playwright (emuladores de Auth + Firestore) |
| `npm test` | Los dos anteriores |
| `npm run admin:dar -- email@x.com` | Hace administrador a una cuenta (contra emuladores) |

## Seguridad: cómo está pensada

- **Las reglas de Firestore (`firestore.rules`) son la validación del servidor.** Esconder botones no protege nada: toda lectura y escritura pasa por las reglas.
- **Admin** = *custom claim* `admin: true` en el token de la persona. Nadie puede dárselo desde la app; solo se otorga con el script de `firebase-admin` (ver abajo).
- Un usuario **no puede cambiar su propio rol ni su estado** de aprobación. Los tipos que requieren aprobación se crean `pendiente` y solo el admin los activa.
- Los formularios se validan con **Zod** en el cliente (mensajes claros) y las reglas validan tipos, enums y campos permitidos.
- Los tests de `tests/rules` prueban estos casos (escalada de rol, leer datos ajenos, publicar siendo pendiente, etc.).

## Administradores

Los admins no se registran: se les da el permiso a una cuenta existente.

- **Local (emuladores):** `npm run admin:dar -- persona@mail.com`
- **Producción:** GitHub → Actions → **Dar admin** → *Run workflow* → email. La persona primero debe registrarse en la app (o crearse la cuenta en la consola de Firebase) y después **cerrar sesión y volver a entrar**.

Para que el workflow funcione el responsable del proyecto configura **una sola vez**:

1. **Cuenta de servicio con permisos mínimos.** En Google Cloud Console → IAM → *Cuentas de servicio* → crear `admin-dar` con solo estos roles: **Administrador de Firebase Authentication** (`roles/firebaseauth.admin`) y **Usuario de Cloud Datastore** (`roles/datastore.user`, para escribir el perfil en Firestore). Nada más.
2. **Cargar la credencial como secreto:** repo de GitHub → Settings → Secrets and variables → Actions → *New repository secret* → `FIREBASE_ADMIN_SA_JSON` con el contenido del JSON de la clave. Y una *variable* (no secreto) `FIREBASE_PROJECT_ID` con el id del proyecto.
3. **Si la organización no permite crear claves** (política `iam.disableServiceAccountKeyCreation`, común en cuentas institucionales): usar *Workload Identity Federation* — sin claves. En `admin-dar.yml` reemplazar `credentials_json` por `workload_identity_provider` y `service_account` ([guía de `google-github-actions/auth`](https://github.com/google-github-actions/auth#workload-identity-federation)). Si tampoco es posible, otorgar el claim desde una computadora con `npm run admin:dar:prod -- email` usando `gcloud auth application-default login`.

> Nunca subas ni pegues la clave JSON en el repo, en un chat ni en un issue. `.gitignore` ya bloquea los nombres típicos.

## Cómo desplegar (lo hace el responsable del proyecto)

1. Crear el proyecto en [Firebase Console](https://console.firebase.google.com) (**plan Spark**, no activar Blaze), habilitar *Authentication* (Email/contraseña y Google), *Firestore* (modo producción) y *Hosting*. Registrar una app web y copiar su config a `.env.production`.
2. El id del proyecto ya está en `.firebaserc` (`rugby5022-mdp`).
3. Subir las reglas: `npx firebase deploy --account fvinciguerra@ucaecemdp.edu.ar --project rugby5022-mdp --only firestore:rules,firestore:indexes` (o `npm run deploy:reglas`).
4. Conectar GitHub ↔ Hosting **una sola vez**: `npx firebase init hosting:github` (crea la cuenta de servicio y carga el secreto `FIREBASE_SERVICE_ACCOUNT_...` en GitHub; **no se crea ni se sube a mano**). Ajustar el nombre del secreto en `.github/workflows/deploy.yml` si hace falta.
5. Desde ahí, **cada merge a `prod` publica la web (y `qa` publica una vista previa)** (`.github/workflows/deploy.yml`). Las reglas se vuelven a desplegar con el paso 3 cuando cambian.
6. En Authentication → Configuración → Dominios autorizados, verificar que figure el dominio `.web.app` del sitio (para el login con Google).

CI (`.github/workflows/ci.yml`): en cada PR corre lint, build, tests de reglas y Playwright contra emuladores.

## Límites del plan Spark (gratis, sin tarjeta)

- **Firestore:** 1 GiB almacenado, 50.000 lecturas y 20.000 escrituras por día (y 20.000 borrados). Las lecturas que hacen las reglas con `get()` también cuentan.
- **Hosting:** 10 GB almacenados y ~360 MB de transferencia por día.
- **Authentication:** email/contraseña y Google sin costo, hasta ~3.000 usuarios activos por día.
- **No hay** Cloud Functions ni Cloud Storage (por eso las imágenes son archivos del propio sitio, en `public/`, o URLs).
- Al llegar al tope diario, Firebase **corta el servicio hasta el día siguiente** (no cobra): por eso no hace falta tarjeta **mientras no activen el plan Blaze**. No lo activen.

## Cómo llevarte este proyecto

Cuando un alumno quiere quedarse con el proyecto:

1. **GitHub:** el dueño actual va a *Settings → General → Danger Zone → Transfer* y transfiere el repo a la cuenta del nuevo responsable (que tiene que aceptar la transferencia por mail).
2. **Firebase:** en la Consola → *Configuración del proyecto → Usuarios y permisos* → *Agregar miembro* → el email del nuevo responsable con rol **Propietario (Owner)**.
3. El nuevo responsable entra, comprueba que ve el proyecto, y recién entonces **la cátedra se quita** de Usuarios y permisos.
4. Volver a correr `firebase init hosting:github` desde su cuenta para que el despliegue automático use su credencial, y revisar los secretos/variables de Actions (`FIREBASE_PROJECT_ID`, etc.).

No hace falta tarjeta de crédito en ningún paso mientras sigan en el plan Spark.

## Estructura

```
src/
  config/app.ts          ← marca, roles, textos de la landing (lo primero que se cambia)
  styles/tema.css        ← colores, radio y tipografía (variables CSS)
  lib/firebase/          ← inicialización de Firebase (emuladores o producción)
  lib/validations/       ← esquemas Zod de los formularios
  auth/                  ← AuthContext, useAuth y guardas RequireAuth / RequireRole / RequireAdmin
  components/            ← UI común y layouts
  pages/public|app|admin ← pantallas
  hooks/                 ← useColeccion (Firestore en tiempo real)
scripts/                 ← seed.ts, admin-dar.ts
tests/rules, tests/e2e   ← reglas (vitest) y humo (Playwright)
firestore.rules · firestore.indexes.json · firebase.json
.github/workflows/       ← ci.yml, deploy.yml, admin-dar.yml
```

Cómo se arma una startup nueva a partir de la plantilla: [`docs/NUEVA-STARTUP.md`](docs/NUEVA-STARTUP.md).

## Licencia

Pendiente de definir por la cátedra (ver `LICENSE`).

import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { RecuperarClave } from '@/components/RecuperarClave'
import { Alerta, Boton, Campo, Cargando, Tarjeta } from '@/components/ui'
import { panelDe, ROLES_REGISTRABLES, type RolRegistrable } from '@/config/app'

import { loginSchema, perfilSchema, registroSchema } from '@/lib/validations/auth'
import { mensajeDeError, validarFormulario, type Errores } from '@/lib/validations/form'

const pideOrganizacion = (rol: string) => ROLES_REGISTRABLES.find(r => r.rol === rol)?.pideOrganizacion === true
const etiquetaOrganizacion = (rol: string) => (rol === 'union' ? 'Nombre de la Unión' : 'Nombre del club')

function BotonGoogle({ onClick, deshabilitado }: { onClick: () => void; deshabilitado: boolean }) {
  return (
    <Boton variante="borde" className="w-full" onClick={onClick} disabled={deshabilitado}>
      Continuar con Google
    </Boton>
  )
}

function SelectorTipo({ valor, onCambio, error }: { valor: string; onCambio: (v: RolRegistrable) => void; error?: string | undefined }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">Tipo de usuario</legend>
      <div className="mt-2 grid gap-2">
        {ROLES_REGISTRABLES.map(r => (
          <label key={r.rol} className={`flex cursor-pointer items-start gap-3 rounded-tema border p-3 ${valor === r.rol ? 'border-primario bg-primario/5' : 'border-borde'}`}>
            <input type="radio" name="rol" value={r.rol} checked={valor === r.rol} onChange={() => onCambio(r.rol)} className="mt-1" />
            <span>
              <span className="block text-sm font-semibold">{r.etiqueta}</span>
              <span className="block text-xs text-suave">{r.descripcion}</span>
            </span>
          </label>
        ))}
      </div>
      {error && <span className="mt-1 block text-xs text-peligro">{error}</span>}
    </fieldset>
  )
}

export function Ingresar() {
  const { ingresar, ingresarConGoogle, usuario, perfil, cargando } = useAuth()
  const navegar = useNavigate()
  const loc = useLocation()
  const [errores, setErrores] = useState<Errores>({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (cargando && !enviando) return <Cargando />
  if (usuario && !perfil) return <Navigate to="/app/completar-perfil" replace />
  if (perfil) return <Navigate to={(loc.state as { desde?: string } | null)?.desde ?? panelDe(perfil.role)} replace />

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const r = validarFormulario(loginSchema, e.currentTarget)
    setErrores(r.errores ?? {})
    if (!r.datos) return
    setError('')
    setEnviando(true)
    try {
      await ingresar(r.datos.email, r.datos.clave)
      navegar('/app', { replace: true })
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }
  async function conGoogle() {
    setError('')
    try {
      await ingresarConGoogle()
      navegar('/app', { replace: true })
    } catch (err) {
      setError(mensajeDeError(err))
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Tarjeta>
        <h1 className="text-2xl font-bold">Ingresar</h1>
        <form onSubmit={e => void enviar(e)} noValidate className="mt-4 space-y-4">
          <Campo etiqueta="Email" name="email" type="email" autoComplete="email" error={errores.email} />
          <Campo etiqueta="Contraseña" name="clave" type="password" autoComplete="current-password" error={errores.clave} />
          {error && <Alerta>{error}</Alerta>}
          <Boton type="submit" className="w-full" disabled={enviando}>{enviando ? 'Ingresando…' : 'Ingresar'}</Boton>
        </form>
        <p className="my-4 text-center text-xs text-suave">o</p>
        <BotonGoogle onClick={() => void conGoogle()} deshabilitado={enviando} />
        <RecuperarClave />
        <p className="mt-4 text-center text-sm text-suave">
          ¿No tenés cuenta? <Link to="/app/registro" className="font-semibold text-primario">Registrate</Link>
        </p>
      </Tarjeta>
    </div>
  )
}

export function Registro() {
  const { registrar, ingresarConGoogle, perfil, cargando } = useAuth()
  const navegar = useNavigate()
  const [params] = useSearchParams()
  const tipoInicial = params.get('tipo')
  const [rol, setRol] = useState<string>(ROLES_REGISTRABLES.some(r => r.rol === tipoInicial) ? (tipoInicial as string) : ROLES_REGISTRABLES[0]?.rol ?? '')
  const [errores, setErrores] = useState<Errores>({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (cargando && !enviando) return <Cargando />
  if (perfil) return <Navigate to={panelDe(perfil.role)} replace />

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const r = validarFormulario(registroSchema, e.currentTarget)
    setErrores(r.errores ?? {})
    if (!r.datos) return
    setError('')
    setEnviando(true)
    try {
      await registrar({ nombre: r.datos.nombre, email: r.datos.email, clave: r.datos.clave, rol: r.datos.rol as RolRegistrable, organizacion: r.datos.organizacion })
      navegar(panelDe(r.datos.rol as RolRegistrable), { replace: true })
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }
  async function conGoogle() {
    setError('')
    if (pideOrganizacion(rol)) {
      // Con Google no hay formulario completo: el nombre del club/Unión se pide en "Completar perfil".
      setEnviando(true)
      try {
        await ingresarConGoogle()
        navegar('/app/completar-perfil', { replace: true, state: { rol } })
      } catch (err) {
        setError(mensajeDeError(err))
      } finally {
        setEnviando(false)
      }
      return
    }
    setEnviando(true)
    try {
      await ingresarConGoogle(rol as RolRegistrable)
      navegar('/app', { replace: true })
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Tarjeta>
        <h1 className="text-2xl font-bold">Crear cuenta</h1>
        <form onSubmit={e => void enviar(e)} noValidate className="mt-4 space-y-4">
          <SelectorTipo valor={rol} onCambio={setRol} error={errores.rol} />
          {pideOrganizacion(rol) && <Campo etiqueta={etiquetaOrganizacion(rol)} name="organizacion" placeholder={rol === 'union' ? 'Ej: Unión de Rugby de…' : 'Ej: Club Atlético…'} error={errores.organizacion} ayuda="Tu cuenta queda pendiente hasta que un administrador la apruebe." />}
          <Campo etiqueta="Nombre" name="nombre" autoComplete="name" error={errores.nombre} />
          <Campo etiqueta="Email" name="email" type="email" autoComplete="email" error={errores.email} />
          <Campo etiqueta="Contraseña" name="clave" type="password" autoComplete="new-password" ayuda="Mínimo 8 caracteres." error={errores.clave} />
          {error && <Alerta>{error}</Alerta>}
          <Boton type="submit" className="w-full" disabled={enviando}>{enviando ? 'Creando cuenta…' : 'Registrarme'}</Boton>
        </form>
        <p className="my-4 text-center text-xs text-suave">o, con el tipo elegido arriba</p>
        <BotonGoogle onClick={() => void conGoogle()} deshabilitado={enviando} />
        <p className="mt-4 text-center text-sm text-suave">
          ¿Ya tenés cuenta? <Link to="/app/ingresar" className="font-semibold text-primario">Ingresá</Link>
        </p>
      </Tarjeta>
    </div>
  )
}

/** Para quien ingresó con Google por primera vez desde "Ingresar": falta elegir el tipo. */
export function CompletarPerfil() {
  const { usuario, perfil, completarPerfil, cargando } = useAuth()
  const navegar = useNavigate()
  const loc = useLocation()
  const rolInicial = (loc.state as { rol?: string } | null)?.rol
  const [rol, setRol] = useState<string>(ROLES_REGISTRABLES.some(r => r.rol === rolInicial) ? (rolInicial as string) : ROLES_REGISTRABLES[0]?.rol ?? '')
  const [errores, setErrores] = useState<Errores>({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (cargando && !enviando) return <Cargando />
  if (!usuario) return <Navigate to="/app/ingresar" replace />
  if (perfil) return <Navigate to={panelDe(perfil.role)} replace />

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const r = validarFormulario(perfilSchema, e.currentTarget)
    setErrores(r.errores ?? {})
    if (!r.datos) return
    setEnviando(true)
    try {
      await completarPerfil({ nombre: r.datos.nombre, rol: r.datos.rol as RolRegistrable, organizacion: r.datos.organizacion })
      navegar('/app', { replace: true })
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Tarjeta>
        <h1 className="text-2xl font-bold">Completá tu perfil</h1>
        <form onSubmit={e => void enviar(e)} noValidate className="mt-4 space-y-4">
          <SelectorTipo valor={rol} onCambio={setRol} error={errores.rol} />
          {pideOrganizacion(rol) && <Campo etiqueta={etiquetaOrganizacion(rol)} name="organizacion" error={errores.organizacion} ayuda="Tu cuenta queda pendiente hasta que un administrador la apruebe." />}
          <Campo etiqueta="Nombre" name="nombre" defaultValue={usuario.displayName ?? ''} error={errores.nombre} />
          {error && <Alerta>{error}</Alerta>}
          <Boton type="submit" className="w-full" disabled={enviando}>Continuar</Boton>
        </form>
      </Tarjeta>
    </div>
  )
}

export function Suspendido() {
  const { salir, perfil } = useAuth()
  const rechazado = perfil?.status === 'rechazado'
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">{rechazado ? 'Tu solicitud no fue aprobada' : 'Tu cuenta está suspendida'}</h1>
      <p className="mt-2 text-suave">
        {rechazado ? 'Un administrador rechazó la solicitud de esta cuenta. Si creés que es un error, contactá a la Unión.' : 'Un administrador suspendió esta cuenta. Contactá a la Unión para más información.'}
      </p>
      <Boton className="mt-6" onClick={() => void salir()}>Salir</Boton>
    </div>
  )
}

/** /app → manda al panel que corresponde. */
export function AppInicio() {
  const { perfil } = useAuth()
  return <Navigate to={perfil ? panelDe(perfil.role) : '/app/ingresar'} replace />
}

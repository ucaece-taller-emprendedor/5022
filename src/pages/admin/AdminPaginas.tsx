import { addDoc, collection, doc, getDocs, query, serverTimestamp, where, writeBatch } from 'firebase/firestore'
import { useMemo, useState, type FormEvent } from 'react'
import { GestionCategorias, GestionPartidos } from '@/components/GestionTorneos'
import { Caja, Metricas, Tabla } from '@/components/rugby'
import { Alerta, Boton, Campo, Cargando, EstadoVacio, Etiqueta } from '@/components/ui'
import { ETIQUETA_ESTADO, ETIQUETA_ROL, type Estado } from '@/config/app'
import { useColeccion, type Con } from '@/hooks/useColeccion'
import { useTodosLosClubes, useUsuarios } from '@/hooks/useClubes'
import { db } from '@/lib/firebase'
import type { Club, Partido, Usuario } from '@/lib/tipos'
import { clubSchema } from '@/lib/validations/rugby'
import { mensajeDeError, validarFormulario, type Errores } from '@/lib/validations/form'


export function AdminInicio() {
  const u = useUsuarios()
  const c = useTodosLosClubes()
  const p = useColeccion<Partido>(useMemo(() => query(collection(db, 'partidos')), []))
  const pendientes = u.datos.filter(x => x.status === 'pendiente' && (x.role === 'club' || x.role === 'union')).length
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Administración</h1>
      <Metricas nota="En la base de datos" items={[['Usuarios', u.datos.length], ['Pendientes de aprobación', <span key="p" data-testid="pendientes">{pendientes}</span>], ['Clubes', c.datos.length], ['Partidos', p.datos.length]]} />
      <Caja titulo="Qué podés hacer acá">
        <p className="text-suave">Aprobar o rechazar cuentas de club y Unión, administrar clubes, categorías, partidos y resultados. Los cambios se reflejan al instante en los paneles de aficionados, clubes y Unión.</p>
      </Caja>
    </div>
  )
}

export function AdminUsuarios() {
  const u = useUsuarios()
  const c = useTodosLosClubes()
  const [aviso, setAviso] = useState('')
  const usuarios = useMemo(() => [...u.datos].sort((a, b) => a.email.localeCompare(b.email)), [u.datos])
  const pendientes = usuarios.filter(x => x.status === 'pendiente' && (x.role === 'club' || x.role === 'union'))

  /** Cambia el estado del usuario y, si tiene un club propio (id = uid), lo activa o lo oculta junto con él. */
  async function cambiar(x: Con<Usuario>, status: Estado) {
    setAviso('')
    try {
      const lote = writeBatch(db)
      lote.update(doc(db, 'users', x.id), { status })
      if (x.role === 'club' && c.datos.some(k => k.id === x.id)) lote.update(doc(db, 'clubs', x.id), { status: status === 'activo' ? 'activo' : 'pendiente' })
      await lote.commit()
    } catch (e) {
      setAviso(mensajeDeError(e))
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Usuarios y aprobaciones</h1>
      {(u.error || aviso) && <Alerta>{u.error ?? aviso}</Alerta>}
      <Caja titulo={`Pendientes de aprobación · ${pendientes.length}`}>
        {pendientes.length ? (
          <Tabla cabecera={['Nombre', 'Correo', 'Perfil', 'Organización', '']}>
            {pendientes.map(x => (
              <tr key={x.id} data-testid={`pendiente-${x.email}`}>
                <td>{x.displayName}</td><td>{x.email}</td><td>{ETIQUETA_ROL[x.role]}</td><td>{x.organization ?? '–'}</td>
                <td className="whitespace-nowrap">
                  <Boton aria-label={`Aprobar a ${x.email}`} onClick={() => void cambiar(x, 'activo')}>Aprobar</Boton>{' '}
                  <Boton variante="borde" aria-label={`Rechazar a ${x.email}`} onClick={() => void cambiar(x, 'rechazado')}>Rechazar</Boton>
                </td>
              </tr>
            ))}
          </Tabla>
        ) : <p className="text-suave">No hay cuentas pendientes.</p>}
      </Caja>
      <Caja titulo={`Todos los usuarios · ${usuarios.length}`}>
        {u.cargando ? <Cargando /> : usuarios.length === 0 ? <EstadoVacio>No hay usuarios.</EstadoVacio> : (
          <Tabla cabecera={['Nombre', 'Correo', 'Perfil', 'Estado', '']}>
            {usuarios.map(x => (
              <tr key={x.id} data-testid={`usuario-${x.email}`}>
                <td>{x.displayName} {x.isDemo && <Etiqueta tono="demo">DEMO</Etiqueta>}</td>
                <td>{x.email}</td><td>{ETIQUETA_ROL[x.role]}</td><td>{ETIQUETA_ESTADO[x.status]}</td>
                <td className="whitespace-nowrap">
                  {x.role === 'admin' ? <span className="text-xs text-suave">Se gestiona fuera de la app</span>
                    : x.status === 'activo' ? <Boton variante="borde" aria-label={`Suspender a ${x.email}`} onClick={() => void cambiar(x, 'suspendido')}>Suspender</Boton>
                    : x.status === 'suspendido' || x.status === 'rechazado' ? <Boton variante="borde" aria-label={`Reactivar a ${x.email}`} onClick={() => void cambiar(x, 'activo')}>Reactivar</Boton>
                    : null}
                </td>
              </tr>
            ))}
          </Tabla>
        )}
      </Caja>
    </div>
  )
}

export function AdminClubes() {
  const c = useTodosLosClubes()
  const clubes = useMemo(() => [...c.datos].sort((a, b) => a.name.localeCompare(b.name)), [c.datos])
  const [errores, setErrores] = useState<Errores>({})
  const [aviso, setAviso] = useState('')

  async function crear(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const r = validarFormulario(clubSchema, form)
    setErrores(r.errores ?? {})
    if (!r.datos) return
    setAviso('')
    try {
      await addDoc(collection(db, 'clubs'), { name: r.datos.nombre, status: 'activo', ownerId: '', isDemo: false, createdAt: serverTimestamp() })
      form.reset()
    } catch (err) {
      setAviso(mensajeDeError(err))
    }
  }

  async function eliminar(k: Con<Club>) {
    setAviso('')
    try {
      const [local, visita] = await Promise.all([
        getDocs(query(collection(db, 'partidos'), where('homeClubId', '==', k.id))),
        getDocs(query(collection(db, 'partidos'), where('awayClubId', '==', k.id))),
      ])
      if (!local.empty || !visita.empty) {
        setAviso('Ese club tiene partidos cargados: borrá primero sus partidos.')
        return
      }
      if (!window.confirm(`¿Eliminar el club ${k.name}? Se borra también su plantel.`)) return
      // Firestore no borra en cascada: se limpian a mano las subcolecciones del club.
      const lote = writeBatch(db)
      for (const sub of ['jugadores', 'asistencias', 'lesiones']) (await getDocs(collection(db, `clubs/${k.id}/${sub}`))).forEach(d => lote.delete(d.ref))
      lote.delete(doc(db, 'clubs', k.id))
      await lote.commit()
    } catch (err) {
      setAviso(mensajeDeError(err))
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Clubes</h1>
      <Caja titulo="Nuevo club">
        <form onSubmit={e => void crear(e)} noValidate className="grid max-w-md gap-4">
          <Campo etiqueta="Nombre del club" name="nombre" placeholder="Ej: Club Atlético…" error={errores.nombre} />
          {aviso && <Alerta>{aviso}</Alerta>}
          <Boton type="submit" className="justify-self-start">Crear club</Boton>
        </form>
      </Caja>
      <Caja titulo={`Clubes · ${clubes.length}`}>
        {c.cargando ? <Cargando /> : (
          <Tabla cabecera={['Club', 'Estado', '']}>
            {clubes.map(k => (
              <tr key={k.id}>
                <td>{k.name} {k.isDemo && <Etiqueta tono="demo">DEMO</Etiqueta>}</td>
                <td>{k.status === 'activo' ? 'Activo' : 'Pendiente de aprobación'}</td>
                <td><Boton variante="borde" aria-label={`Eliminar el club ${k.name}`} onClick={() => void eliminar(k)}>Eliminar</Boton></td>
              </tr>
            ))}
          </Tabla>
        )}
        <p className="mt-4 text-xs text-suave">Un club con partidos cargados no se puede eliminar hasta borrar sus partidos. Para aprobar un club registrado por su dueño, aprobá su cuenta en “Usuarios y aprobaciones”.</p>
      </Caja>
    </div>
  )
}

export function AdminCategorias() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Categorías</h1>
      <GestionCategorias />
    </div>
  )
}

export function AdminPartidos() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Partidos y resultados</h1>
      <GestionPartidos />
    </div>
  )
}

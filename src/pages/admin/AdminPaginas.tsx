import { collection, doc, orderBy, query, updateDoc } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { Alerta, Cargando, EstadoVacio, Etiqueta, Selector, Tarjeta } from '@/components/ui'
import { ESTADOS, ETIQUETA_ROL, ROLES_REGISTRABLES, type Estado, type Rol } from '@/config/app'
import { useColeccion } from '@/hooks/useColeccion'
import { db } from '@/lib/firebase'
import { mensajeDeError } from '@/lib/validations/form'

type Usuario = { email: string; displayName: string; role: Rol; status: Estado; isDemo: boolean }

export function AdminInicio() {
  const u = useColeccion<Usuario>(useMemo(() => query(collection(db, 'users')), []))
  const pendientes = u.datos.filter(x => x.status === 'pendiente').length
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Administración</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        <Tarjeta><p className="text-sm text-suave">Usuarios</p><p className="text-3xl font-bold">{u.datos.length}</p></Tarjeta>
        <Tarjeta><p className="text-sm text-suave">Pendientes de aprobación</p><p className="text-3xl font-bold" data-testid="pendientes">{pendientes}</p></Tarjeta>
      </div>
    </div>
  )
}

export function AdminUsuarios() {
  const { datos, cargando, error } = useColeccion<Usuario>(useMemo(() => query(collection(db, 'users'), orderBy('email')), []))
  const [aviso, setAviso] = useState('')

  async function cambiar(uid: string, campos: Partial<Pick<Usuario, 'status' | 'role'>>) {
    setAviso('')
    try {
      await updateDoc(doc(db, 'users', uid), campos)
    } catch (e) {
      setAviso(mensajeDeError(e))
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Usuarios</h1>
      {(error || aviso) && <Alerta>{error ?? aviso}</Alerta>}
      {cargando ? <Cargando /> : datos.length === 0 ? <EstadoVacio>No hay usuarios.</EstadoVacio> : (
        <div className="overflow-x-auto rounded-tema border border-borde bg-superficie">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-borde text-xs uppercase text-suave">
              <tr><th className="p-3">Usuario</th><th className="p-3">Tipo</th><th className="p-3">Estado</th></tr>
            </thead>
            <tbody>
              {datos.map(u => (
                <tr key={u.id} className="border-b border-borde last:border-0" data-testid={`usuario-${u.email}`}>
                  <td className="p-3"><p className="font-medium">{u.displayName} {u.isDemo && <Etiqueta tono="demo">DEMO</Etiqueta>}</p><p className="text-xs text-suave">{u.email}</p></td>
                  <td className="p-3">
                    {u.role === 'admin' ? <Etiqueta>{ETIQUETA_ROL.admin}</Etiqueta> : (
                      <Selector etiqueta="" aria-label={`Tipo de ${u.email}`} value={u.role} onChange={e => void cambiar(u.id, { role: e.target.value as Rol })}>
                        {ROLES_REGISTRABLES.map(r => <option key={r.rol} value={r.rol}>{r.etiqueta}</option>)}
                      </Selector>
                    )}
                  </td>
                  <td className="p-3">
                    <Selector etiqueta="" aria-label={`Estado de ${u.email}`} value={u.status} onChange={e => void cambiar(u.id, { status: e.target.value as Estado })}>
                      {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                    </Selector>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

type Item = { titulo: string; ownerName: string; publicado: boolean; isDemo: boolean }

export function AdminItems() {
  const { datos, cargando } = useColeccion<Item>(useMemo(() => query(collection(db, 'items')), []))
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ítems</h1>
      {cargando ? <Cargando /> : datos.length === 0 ? <EstadoVacio>No hay ítems.</EstadoVacio> : (
        <ul className="space-y-2">
          {datos.map(i => (
            <li key={i.id}>
              <Tarjeta className="flex items-center justify-between gap-3">
                <span><span className="font-medium">{i.titulo}</span> <span className="text-xs text-suave">por {i.ownerName}</span> {i.isDemo && <Etiqueta tono="demo">DEMO</Etiqueta>}</span>
                <button className="text-sm font-semibold text-primario" onClick={() => void updateDoc(doc(db, 'items', i.id), { publicado: !i.publicado })}>{i.publicado ? 'Despublicar' : 'Publicar'}</button>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

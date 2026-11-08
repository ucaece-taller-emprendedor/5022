import { addDoc, collection, deleteDoc, doc, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '@/auth/useAuth'
import { Alerta, Boton, Campo, CampoTexto, Cargando, Etiqueta, EstadoVacio, Tarjeta } from '@/components/ui'
import { db } from '@/lib/firebase'
import { useColeccion } from '@/hooks/useColeccion'
import { itemSchema } from '@/lib/validations/items'
import { mensajeDeError, validarFormulario, type Errores } from '@/lib/validations/form'

type Item = { ownerId: string; ownerName: string; titulo: string; descripcion: string; publicado: boolean; isDemo: boolean }

export function PanelUsuario() {
  const { perfil } = useAuth()
  const consulta = useMemo(() => query(collection(db, 'items'), where('publicado', '==', true)), [])
  const { datos, cargando, error } = useColeccion<Item>(consulta)
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-bold">Hola, {perfil?.displayName}</h1>
      <h2 className="text-lg font-semibold">Contenido publicado</h2>
      {error && <Alerta>{error}</Alerta>}
      {cargando ? <Cargando /> : datos.length === 0 ? <EstadoVacio>Todavía no hay nada publicado.</EstadoVacio> : (
        <ul className="space-y-3">
          {datos.map(i => (
            <li key={i.id}>
              <Tarjeta>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{i.titulo}</h3>
                  {i.isDemo && <Etiqueta tono="demo">DEMO</Etiqueta>}
                </div>
                <p className="mt-1 text-sm text-suave">{i.descripcion}</p>
                <p className="mt-2 text-xs text-suave">Por {i.ownerName}</p>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function PanelSocio() {
  const { perfil, usuario } = useAuth()
  const uid = usuario?.uid
  const consulta = useMemo(() => (uid ? query(collection(db, 'items'), where('ownerId', '==', uid)) : null), [uid])
  const { datos, cargando } = useColeccion<Item>(consulta)
  const [errores, setErrores] = useState<Errores>({})
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  if (!perfil || !uid) return <Cargando />
  if (perfil.status === 'pendiente') {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <Alerta tipo="aviso">Tu cuenta de socio está pendiente de aprobación. Cuando el equipo la apruebe vas a poder publicar.</Alerta>
      </div>
    )
  }

  async function crear(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const r = validarFormulario(itemSchema, form)
    setErrores(r.errores ?? {})
    if (!r.datos || !perfil) return
    setGuardando(true)
    setError('')
    try {
      await addDoc(collection(db, 'items'), { ...r.datos, ownerId: uid, ownerName: perfil.displayName, isDemo: false, createdAt: serverTimestamp() })
      form.reset()
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Panel del socio</h1>
      <Tarjeta>
        <h2 className="font-semibold">Nuevo ítem</h2>
        <form onSubmit={e => void crear(e)} noValidate className="mt-3 space-y-3">
          <Campo etiqueta="Título" name="titulo" error={errores.titulo} />
          <CampoTexto etiqueta="Descripción" name="descripcion" error={errores.descripcion} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="publicado" defaultChecked /> Publicado</label>
          {error && <Alerta>{error}</Alerta>}
          <Boton type="submit" disabled={guardando}>Guardar</Boton>
        </form>
      </Tarjeta>
      <h2 className="font-semibold">Mis ítems</h2>
      {cargando ? <Cargando /> : datos.length === 0 ? <EstadoVacio>Todavía no cargaste ítems.</EstadoVacio> : (
        <ul className="space-y-3">
          {datos.map(i => (
            <li key={i.id}>
              <Tarjeta className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{i.titulo} {i.isDemo && <Etiqueta tono="demo">DEMO</Etiqueta>}</p>
                  <p className="text-sm text-suave">{i.publicado ? 'Publicado' : 'Borrador'}</p>
                </div>
                <div className="flex gap-2">
                  <Boton variante="borde" onClick={() => void updateDoc(doc(db, 'items', i.id), { publicado: !i.publicado })}>{i.publicado ? 'Despublicar' : 'Publicar'}</Boton>
                  <Boton variante="peligro" onClick={() => void deleteDoc(doc(db, 'items', i.id))}>Borrar</Boton>
                </div>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore'
import { useState, type FormEvent } from 'react'
import { useClubesActivos } from '@/hooks/useClubes'
import { useCategorias, useTorneo, type PartidoCon } from '@/hooks/useTorneo'
import { db } from '@/lib/firebase'
import { categoriaSchema, partidoSchema, resultadoSchema } from '@/lib/validations/rugby'
import { mensajeDeError, validarFormulario, type Errores } from '@/lib/validations/form'
import { Caja, ErrorDatos, Tabla, TabsCategoria } from './rugby'
import { Alerta, Boton, Campo, Cargando, EstadoVacio, Etiqueta, Selector } from './ui'

export function GestionCategorias() {
  const { datos, cargando, error } = useCategorias()
  const [errores, setErrores] = useState<Errores>({})
  const [aviso, setAviso] = useState('')

  async function crear(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const r = validarFormulario(categoriaSchema, form)
    setErrores(r.errores ?? {})
    if (!r.datos) return
    setAviso('')
    try {
      await addDoc(collection(db, 'categorias'), { competition: r.datos.competencia, name: r.datos.categoria, season: r.datos.temporada, isDemo: false, createdAt: serverTimestamp() })
      form.reset()
    } catch (err) {
      setAviso(mensajeDeError(err))
    }
  }

  async function eliminar(id: string, nombre: string) {
    if (!window.confirm(`¿Eliminar ${nombre}? Se borran también sus partidos.`)) return
    setAviso('')
    try {
      const partidos = await getDocs(query(collection(db, 'partidos'), where('categoryId', '==', id)))
      const lote = writeBatch(db)
      partidos.forEach(p => lote.delete(p.ref))
      lote.delete(doc(db, 'categorias', id))
      await lote.commit()
    } catch (err) {
      setAviso(mensajeDeError(err))
    }
  }

  return (
    <>
      <Caja titulo="Nueva categoría">
        <form onSubmit={e => void crear(e)} noValidate className="grid max-w-md gap-4">
          <Campo etiqueta="Competencia" name="competencia" placeholder="Ej: Torneo Regional" error={errores.competencia} />
          <Campo etiqueta="Categoría" name="categoria" placeholder="Ej: Primera" error={errores.categoria} />
          <Campo etiqueta="Temporada" name="temporada" placeholder="Ej: Temporada 2026" error={errores.temporada} />
          {aviso && <Alerta>{aviso}</Alerta>}
          <Boton type="submit" className="justify-self-start">Crear categoría</Boton>
        </form>
      </Caja>
      <Caja titulo={`Categorías · ${datos.length}`}>
        <ErrorDatos error={error} />
        {cargando ? <Cargando /> : datos.length === 0 ? <EstadoVacio>Todavía no hay categorías.</EstadoVacio> : (
          <Tabla cabecera={['Competencia', 'Categoría', 'Temporada', '']}>
            {datos.map(c => (
              <tr key={c.id}>
                <td>{c.competition} {c.isDemo && <Etiqueta tono="demo">DEMO</Etiqueta>}</td>
                <td>{c.name}</td>
                <td>{c.season}</td>
                <td><Boton variante="borde" aria-label={`Eliminar ${c.competition} · ${c.name}`} onClick={() => void eliminar(c.id, `${c.competition} · ${c.name}`)}>Eliminar</Boton></td>
              </tr>
            ))}
          </Tabla>
        )}
      </Caja>
    </>
  )
}

function ResultadoForm({ partido }: { partido: PartidoCon }) {
  const [error, setError] = useState('')
  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const r = validarFormulario(resultadoSchema, e.currentTarget)
    if (!r.datos) {
      setError(Object.values(r.errores)[0] ?? 'Revisá los puntajes.')
      return
    }
    setError('')
    try {
      await updateDoc(doc(db, 'partidos', partido.id), { homeScore: r.datos.puntosLocal, awayScore: r.datos.puntosVisitante })
    } catch (err) {
      setError(mensajeDeError(err))
    }
  }
  const entrada = 'min-h-11 w-16 rounded-tema border border-borde bg-fondo px-2 text-base text-texto'
  return (
    <form onSubmit={e => void guardar(e)} noValidate className="flex flex-wrap items-center gap-2">
      <input name="puntosLocal" type="number" min={0} defaultValue={partido.homeScore ?? ''} aria-label={`Puntos de ${partido.home}`} className={entrada} />
      <span className="text-suave">–</span>
      <input name="puntosVisitante" type="number" min={0} defaultValue={partido.awayScore ?? ''} aria-label={`Puntos de ${partido.away}`} className={entrada} />
      <Boton type="submit" variante="borde" aria-label={`Guardar resultado ${partido.home} vs ${partido.away}`}>Guardar</Boton>
      {error && <span role="alert" className="w-full text-xs text-peligro">{error}</span>}
    </form>
  )
}

export function GestionPartidos() {
  const t = useTorneo()
  const clubes = useClubesActivos()
  const [errores, setErrores] = useState<Errores>({})
  const [aviso, setAviso] = useState('')

  async function crear(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const r = validarFormulario(partidoSchema, form)
    setErrores(r.errores ?? {})
    if (!r.datos || !t.actual) return
    const local = clubes.datos.find(c => c.id === r.datos.local)
    const visitante = clubes.datos.find(c => c.id === r.datos.visitante)
    if (!local || !visitante) return
    setAviso('')
    try {
      await addDoc(collection(db, 'partidos'), {
        categoryId: t.actual.id,
        round: r.datos.fecha,
        homeClubId: local.id,
        awayClubId: visitante.id,
        home: local.name,
        away: visitante.name,
        homeScore: r.datos.puntosLocal,
        awayScore: r.datos.puntosVisitante,
        isDemo: false,
        createdAt: serverTimestamp(),
      })
      form.reset()
    } catch (err) {
      setAviso(mensajeDeError(err))
    }
  }

  async function eliminar(id: string) {
    if (!window.confirm('¿Eliminar este partido?')) return
    try {
      await deleteDoc(doc(db, 'partidos', id))
    } catch (err) {
      setAviso(mensajeDeError(err))
    }
  }

  if (t.cargando) return <Cargando />
  if (!t.actual) return <Caja titulo="Partidos"><p className="text-suave">Primero creá una categoría.</p></Caja>
  return (
    <>
      <TabsCategoria categorias={t.categorias} actualId={t.actual.id} onElegir={t.elegir} />
      <Caja titulo="Nuevo partido">
        <form onSubmit={e => void crear(e)} noValidate className="grid max-w-md gap-4">
          <Campo etiqueta="Fecha (número de jornada)" name="fecha" type="number" min={1} defaultValue={1} error={errores.fecha} />
          <Selector etiqueta="Local" name="local" defaultValue="" error={errores.local}>
            <option value="" disabled>Elegí un club</option>
            {clubes.datos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Selector>
          <Selector etiqueta="Visitante" name="visitante" defaultValue="" error={errores.visitante}>
            <option value="" disabled>Elegí un club</option>
            {clubes.datos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Selector>
          <Campo etiqueta="Puntos local (vacío si no se jugó)" name="puntosLocal" type="number" min={0} error={errores.puntosLocal} />
          <Campo etiqueta="Puntos visitante (vacío si no se jugó)" name="puntosVisitante" type="number" min={0} error={errores.puntosVisitante} />
          {aviso && <Alerta>{aviso}</Alerta>}
          <Boton type="submit" className="justify-self-start">Cargar partido</Boton>
        </form>
      </Caja>
      <Caja titulo={`${t.actual.competition} · ${t.actual.name} · ${t.partidos.length} partidos`}>
        <ErrorDatos error={t.error} />
        {t.partidos.length === 0 ? <EstadoVacio>Todavía no hay partidos en esta categoría.</EstadoVacio> : (
          <Tabla cabecera={['Fecha', 'Partido', 'Resultado', '']}>
            {t.partidos.map(m => (
              <tr key={m.id} data-testid="partido-fila">
                <td>{m.round}</td>
                <td><b>{m.home}</b> <span className="text-suave">vs</span> <b>{m.away}</b></td>
                <td><ResultadoForm key={`${m.id}-${m.homeScore}-${m.awayScore}`} partido={m} /></td>
                <td><Boton variante="borde" aria-label={`Eliminar partido ${m.home} vs ${m.away}`} onClick={() => void eliminar(m.id)}>Eliminar</Boton></td>
              </tr>
            ))}
          </Tabla>
        )}
      </Caja>
    </>
  )
}

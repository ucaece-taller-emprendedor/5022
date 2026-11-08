import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore'
import { useMemo, useState, type FormEvent } from 'react'
import { useParams } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { PanelShell } from '@/components/PanelShell'
import { Caja, ErrorDatos, Fixture, Metricas, Tabla, TabsCategoria } from '@/components/rugby'
import { Alerta, Boton, Campo, Cargando, Selector } from '@/components/ui'
import { ASISTENCIAS, ESTADOS_LESION, SECCIONES, ZONAS_LESION, type Asistencia } from '@/config/app'
import { useColeccion, type Con } from '@/hooks/useColeccion'
import { useTorneo } from '@/hooks/useTorneo'
import { db } from '@/lib/firebase'
import { calcularPosiciones, jugado } from '@/lib/posiciones'
import type { Club, Jugador, Lesion, RegistroAsistencia } from '@/lib/tipos'
import { jugadorSchema, lesionSchema } from '@/lib/validations/rugby'
import { mensajeDeError, validarFormulario, type Errores } from '@/lib/validations/form'

const hoyISO = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' })

export default function PanelClub() {
  const { perfil, usuario, registrarClub } = useAuth()
  const { seccion } = useParams()
  const uid = usuario?.uid
  const claves: string[] = SECCIONES.club.items.map(([k]) => k)
  const activa = seccion && claves.includes(seccion) ? seccion : 'resumen'

  const miClub = useColeccion<Club>(useMemo(() => (uid ? query(collection(db, 'clubs'), where('ownerId', '==', uid)) : null), [uid]))
  const club = miClub.datos[0]

  if (!perfil || !uid || miClub.cargando) return <Cargando />
  if (perfil.status === 'pendiente' || (club && club.status !== 'activo')) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <Alerta tipo="aviso">Tu cuenta de club ({perfil.organization ?? club?.name}) está pendiente de aprobación. Un administrador de 5022 tiene que aprobarla antes de que puedas cargar tu plantel. Volvé a ingresar más tarde.</Alerta>
      </div>
    )
  }
  if (!club) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 py-12">
        <Alerta tipo="aviso">Todavía no tenés un club asociado a tu cuenta{perfil.organization ? ` (${perfil.organization})` : ''}.</Alerta>
        {perfil.organization && <Boton onClick={() => void registrarClub()}>Registrar mi club</Boton>}
      </div>
    )
  }
  return <ContenidoClub club={{ ...club, id: club.id }} activa={activa} nombre={perfil.displayName} />
}

function ContenidoClub({ club, activa, nombre }: { club: Con<Club>; activa: string; nombre: string }) {
  const t = useTorneo()
  const jugadores = useColeccion<Jugador>(useMemo(() => query(collection(db, `clubs/${club.id}/jugadores`)), [club.id]))
  const plantel = useMemo(() => [...jugadores.datos].sort((a, b) => a.name.localeCompare(b.name)), [jugadores.datos])
  const mios = t.partidos.filter(m => m.homeClubId === club.id || m.awayClubId === club.id)
  const registro = calcularPosiciones(t.partidos).find(x => x.id === club.id) ?? { pj: 0, g: 0, e: 0, p: 0, pf: 0, pc: 0, pts: 0 }

  let cuerpo
  if (activa === 'plantel') cuerpo = <Plantel clubId={club.id} plantel={plantel} />
  else if (activa === 'asistencias') cuerpo = <Asistencias clubId={club.id} plantel={plantel} />
  else if (activa === 'lesiones') cuerpo = <Lesiones clubId={club.id} plantel={plantel} />
  else if (activa === 'partidos') cuerpo = <Caja titulo="Calendario del club"><Fixture items={mios} vacio="Tu club todavía no tiene partidos cargados." /></Caja>
  else if (activa === 'rendimiento') {
    const dif = registro.pf - registro.pc
    cuerpo = (
      <>
        <Metricas items={[['PJ', registro.pj], ['G / E / P', `${registro.g} / ${registro.e} / ${registro.p}`], ['Puntos a favor', registro.pf], ['Puntos en contra', registro.pc]]} />
        <Caja titulo="Resumen deportivo">
          <p className="text-suave">Diferencia de puntos: <b className="text-texto">{dif > 0 ? '+' : ''}{dif}</b>. Estos valores se calculan a partir de los mismos partidos visibles para los aficionados.</p>
        </Caja>
      </>
    )
  } else {
    cuerpo = (
      <>
        <Metricas items={[['Club', club.name], ['Partidos jugados', registro.pj], ['Victorias', registro.g], ['Puntos en tabla', registro.pts]]} />
        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          <Caja titulo="Mis partidos"><Fixture items={mios} vacio="Tu club todavía no tiene partidos cargados." /></Caja>
          <Caja titulo="Próximo rival"><Fixture items={mios.filter(m => !jugado(m)).slice(0, 1)} vacio="Sin próximo rival." /></Caja>
        </div>
      </>
    )
  }

  const mostrarTabs = ['resumen', 'partidos', 'rendimiento'].includes(activa)
  return (
    <PanelShell clave="club" activa={activa} usuario={nombre} subtitulo={club.name}>
      <ErrorDatos error={t.error ?? jugadores.error} />
      {mostrarTabs && <TabsCategoria categorias={t.categorias} actualId={t.actual?.id} onElegir={t.elegir} />}
      {cuerpo}
    </PanelShell>
  )
}

function Plantel({ clubId, plantel }: { clubId: string; plantel: Con<Jugador>[] }) {
  const [errores, setErrores] = useState<Errores>({})
  const [aviso, setAviso] = useState('')

  async function agregar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const r = validarFormulario(jugadorSchema, form)
    setErrores(r.errores ?? {})
    if (!r.datos) return
    setAviso('')
    try {
      await addDoc(collection(db, `clubs/${clubId}/jugadores`), { name: r.datos.nombre, position: r.datos.posicion, matchesPlayed: r.datos.partidos, tries: r.datos.tries, isDemo: false, createdAt: serverTimestamp() })
      form.reset()
    } catch (err) {
      setAviso(mensajeDeError(err))
    }
  }

  async function quitar(j: Con<Jugador>) {
    if (!window.confirm(`¿Quitar a ${j.name} del plantel?`)) return
    setAviso('')
    try {
      // Firestore no borra en cascada: se limpian a mano su asistencia y sus lesiones.
      const lote = writeBatch(db)
      const [asist, les] = await Promise.all([
        getDocs(query(collection(db, `clubs/${clubId}/asistencias`), where('playerId', '==', j.id))),
        getDocs(query(collection(db, `clubs/${clubId}/lesiones`), where('playerId', '==', j.id))),
      ])
      asist.forEach(d => lote.delete(d.ref))
      les.forEach(d => lote.delete(d.ref))
      lote.delete(doc(db, `clubs/${clubId}/jugadores`, j.id))
      await lote.commit()
    } catch (err) {
      setAviso(mensajeDeError(err))
    }
  }

  return (
    <>
      <Caja titulo={`Plantel · ${plantel.length} ${plantel.length === 1 ? 'jugador' : 'jugadores'}`}>
        {plantel.length ? (
          <Tabla cabecera={['Jugador', 'Posición', 'PJ', 'Tries', '']}>
            {plantel.map(p => (
              <tr key={p.id} data-testid="jugador-fila">
                <td>{p.name}</td><td>{p.position}</td><td>{p.matchesPlayed}</td><td>{p.tries}</td>
                <td><Boton variante="borde" aria-label={`Quitar a ${p.name}`} onClick={() => void quitar(p)}>Quitar</Boton></td>
              </tr>
            ))}
          </Tabla>
        ) : <p className="text-suave">Todavía no cargaste jugadores. Agregá el primero abajo.</p>}
      </Caja>
      <Caja titulo="Agregar jugador">
        <form onSubmit={e => void agregar(e)} noValidate className="grid max-w-md gap-4">
          <Campo etiqueta="Nombre" name="nombre" placeholder="Nombre y apellido" error={errores.nombre} />
          <Campo etiqueta="Posición" name="posicion" placeholder="Ej: Pilar, Apertura, Wing" error={errores.posicion} />
          <Campo etiqueta="Partidos jugados" name="partidos" type="number" min={0} defaultValue={0} error={errores.partidos} />
          <Campo etiqueta="Tries" name="tries" type="number" min={0} defaultValue={0} error={errores.tries} />
          {aviso && <Alerta>{aviso}</Alerta>}
          <Boton type="submit" className="justify-self-start">Agregar al plantel</Boton>
        </form>
      </Caja>
    </>
  )
}

function Asistencias({ clubId, plantel }: { clubId: string; plantel: Con<Jugador>[] }) {
  const [fecha, setFecha] = useState(hoyISO())
  const [aviso, setAviso] = useState('')
  const consulta = useMemo(() => query(collection(db, `clubs/${clubId}/asistencias`), where('date', '==', fecha)), [clubId, fecha])
  const guardadas = useColeccion<RegistroAsistencia>(consulta)
  const porJugador = Object.fromEntries(guardadas.datos.map(a => [a.playerId, a.status])) as Record<string, Asistencia>
  const cuenta = (s: Asistencia) => plantel.filter(p => porJugador[p.id] === s).length

  async function marcar(playerId: string, valor: string) {
    setAviso('')
    const ref = doc(db, `clubs/${clubId}/asistencias`, `${playerId}_${fecha}`)
    try {
      if (valor === '') await deleteDoc(ref)
      else await setDoc(ref, { playerId, date: fecha, status: valor })
    } catch (err) {
      setAviso(mensajeDeError(err))
    }
  }

  return (
    <>
      <Metricas items={[['Jugadores', plantel.length], ['Presentes', cuenta('presente')], ['Ausentes', cuenta('ausente')], ['Sin registrar', plantel.filter(p => !porJugador[p.id]).length]]} />
      <Caja titulo="Asistencia al entrenamiento">
        <p className="mb-4 text-suave">Marcá la asistencia de cada jugador. Los cambios se guardan en la base de datos.</p>
        <div className="mb-4 max-w-xs">
          <Campo etiqueta="Fecha de entrenamiento" name="fecha" type="date" value={fecha} onChange={e => e.target.value && setFecha(e.target.value)} />
        </div>
        {aviso && <Alerta>{aviso}</Alerta>}
        {plantel.length ? (
          <ul className="divide-y divide-borde">
            {plantel.map(p => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-suave">{p.position}</p>
                </div>
                <select
                  aria-label={`Asistencia de ${p.name}`}
                  value={porJugador[p.id] ?? ''}
                  onChange={e => void marcar(p.id, e.target.value)}
                  className="min-h-11 w-44 rounded-tema border border-borde bg-fondo px-2 text-base text-texto"
                >
                  <option value="">Sin registrar</option>
                  {ASISTENCIAS.map(a => <option key={a} value={a}>{a[0]?.toUpperCase()}{a.slice(1)}</option>)}
                </select>
              </li>
            ))}
          </ul>
        ) : <p className="text-suave">Primero cargá jugadores en la sección Plantel.</p>}
      </Caja>
    </>
  )
}

function Lesiones({ clubId, plantel }: { clubId: string; plantel: Con<Jugador>[] }) {
  const lesiones = useColeccion<Lesion>(useMemo(() => query(collection(db, `clubs/${clubId}/lesiones`)), [clubId]))
  const datos = useMemo(() => [...lesiones.datos].sort((a, b) => b.date.localeCompare(a.date)), [lesiones.datos])
  const [errores, setErrores] = useState<Errores>({})
  const [aviso, setAviso] = useState('')

  async function registrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const r = validarFormulario(lesionSchema, form)
    setErrores(r.errores ?? {})
    const jugador = plantel.find(p => p.id === r.datos?.jugador)
    if (!r.datos || !jugador) return
    setAviso('')
    try {
      await addDoc(collection(db, `clubs/${clubId}/lesiones`), { playerId: jugador.id, playerName: jugador.name, date: r.datos.fecha, area: r.datos.zona, status: r.datos.estado, isDemo: false, createdAt: serverTimestamp() })
    } catch (err) {
      setAviso(mensajeDeError(err))
    }
  }

  return (
    <>
      <Metricas items={[['Lesiones registradas', datos.length], ['En recuperación', datos.filter(x => x.status === 'En recuperación').length], ['Alta deportiva', datos.filter(x => x.status === 'Alta deportiva').length], ['Jugadores del plantel', plantel.length]]} />
      <Caja titulo="Registrar lesión">
        <p className="mb-4 text-suave">Registro interno de ejemplo. Evitá ingresar información médica real: esta demo no tiene controles de privacidad avanzados.</p>
        {plantel.length ? (
          <form onSubmit={e => void registrar(e)} noValidate className="grid max-w-md gap-4">
            <Selector etiqueta="Jugador" name="jugador" defaultValue="" error={errores.jugador}>
              <option value="" disabled>Elegí un jugador</option>
              {plantel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Selector>
            <Campo etiqueta="Fecha" name="fecha" type="date" defaultValue={hoyISO()} error={errores.fecha} />
            <Selector etiqueta="Zona afectada (ejemplo)" name="zona" defaultValue={ZONAS_LESION[0]} error={errores.zona}>
              {ZONAS_LESION.map(z => <option key={z}>{z}</option>)}
            </Selector>
            <Selector etiqueta="Estado" name="estado" defaultValue={ESTADOS_LESION[0]} error={errores.estado}>
              {ESTADOS_LESION.map(z => <option key={z}>{z}</option>)}
            </Selector>
            {aviso && <Alerta>{aviso}</Alerta>}
            <Boton type="submit" className="justify-self-start">Guardar registro</Boton>
          </form>
        ) : <p className="text-suave">Primero cargá jugadores en la sección Plantel.</p>}
      </Caja>
      <Caja titulo="Seguimiento de lesiones">
        {datos.length ? (
          <Tabla cabecera={['Jugador', 'Fecha', 'Zona', 'Estado', '']}>
            {datos.map(x => (
              <tr key={x.id}>
                <td>{x.playerName}</td><td>{x.date}</td><td>{x.area}</td><td>{x.status}</td>
                <td className="whitespace-nowrap">
                  {x.status === 'En recuperación' && <Boton variante="borde" aria-label={`Dar el alta a ${x.playerName}`} onClick={() => void updateDoc(doc(db, `clubs/${clubId}/lesiones`, x.id), { status: 'Alta deportiva' })}>Dar el alta</Boton>}{' '}
                  <Boton variante="borde" aria-label={`Quitar lesión de ${x.playerName}`} onClick={() => void deleteDoc(doc(db, `clubs/${clubId}/lesiones`, x.id))}>Quitar</Boton>
                </td>
              </tr>
            ))}
          </Tabla>
        ) : <p className="text-suave">Todavía no hay lesiones registradas.</p>}
      </Caja>
    </>
  )
}

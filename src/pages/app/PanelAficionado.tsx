import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { PanelShell } from '@/components/PanelShell'
import { Caja, ErrorDatos, Fixture, Metricas, Tabla, TablaPosiciones, TabsCategoria } from '@/components/rugby'
import { Alerta, Boton, Campo, Cargando, Selector } from '@/components/ui'
import { SECCIONES } from '@/config/app'
import { useTorneo } from '@/hooks/useTorneo'
import { calcularPosiciones, fechasCompletas, jugado, partidosJugados, proximaFecha, ultimaFechaJugada } from '@/lib/posiciones'
import { solicitudSchema } from '@/lib/validations/auth'
import { mensajeDeError, validarFormulario, type Errores } from '@/lib/validations/form'

function SolicitarPerfil() {
  const { solicitarPerfil } = useAuth()
  const [rol, setRol] = useState('club')
  const [errores, setErrores] = useState<Errores>({})
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const r = validarFormulario(solicitudSchema, e.currentTarget)
    setErrores(r.errores ?? {})
    if (!r.datos) return
    setEnviando(true)
    setError('')
    try {
      await solicitarPerfil({ rol: r.datos.rol as 'club' | 'union', organizacion: r.datos.organizacion ?? '' })
    } catch (err) {
      setError(mensajeDeError(err))
      setEnviando(false)
    }
  }
  return (
    <Caja titulo="¿Sos un club o una Unión?">
      <p className="mb-4 text-suave">Pedí el perfil de club o Unión. Tu solicitud queda <b>pendiente</b> hasta que un administrador la apruebe.</p>
      <form onSubmit={e => void enviar(e)} noValidate className="grid max-w-md gap-4">
        <Selector etiqueta="Perfil" name="rol" value={rol} onChange={e => setRol(e.target.value)} error={errores.rol}>
          <option value="club">Club</option>
          <option value="union">Unión</option>
        </Selector>
        <Campo etiqueta="Nombre del club o de la Unión" name="organizacion" error={errores.organizacion} />
        {error && <Alerta>{error}</Alerta>}
        <Boton type="submit" disabled={enviando} className="justify-self-start">Enviar solicitud</Boton>
      </form>
      <Link className="mt-4 inline-block text-sm font-extrabold text-primario" to="/partidos">Seguir explorando partidos →</Link>
    </Caja>
  )
}

export default function PanelAficionado() {
  const { perfil } = useAuth()
  const { seccion } = useParams()
  const t = useTorneo()
  const claves: string[] = SECCIONES.aficionado.items.map(([k]) => k)
  const activa = seccion && claves.includes(seccion) ? seccion : 'resumen'

  const jugados = partidosJugados(t.partidos)
  const ultima = ultimaFechaJugada(t.partidos)
  const proxima = proximaFecha(t.partidos)
  const proximos = t.partidos.filter(m => !jugado(m) && m.round === proxima)
  const posiciones = calcularPosiciones(t.partidos)
  const total = jugados.reduce((s, m) => s + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0)

  let cuerpo
  if (activa === 'partidos') {
    cuerpo = (
      <>
        <Caja titulo={`Resultados${jugados.length ? ` · Fechas 1 a ${ultima}` : ''}`}><Fixture items={jugados} vacio="Todavía no hay resultados." /></Caja>
        <Caja titulo={`Próxima fecha${proxima ? ` · Fecha ${proxima}` : ''}`}><Fixture items={proximos} vacio="No hay partidos programados." /></Caja>
      </>
    )
  } else if (activa === 'posiciones') {
    cuerpo = <Caja titulo="Tabla calculada desde los resultados"><TablaPosiciones partidos={t.partidos} /></Caja>
  } else if (activa === 'estadisticas') {
    cuerpo = (
      <>
        <Metricas items={[['Partidos jugados', jugados.length], ['Puntos totales', total], ['Promedio por partido', jugados.length ? (total / jugados.length).toFixed(1) : '–'], ['Equipos', posiciones.length]]} />
        <Caja titulo="Rendimiento por equipo">
          <Tabla cabecera={['Equipo', 'Puntos a favor', 'En contra', 'Diferencia']}>
            {posiciones.map(x => <tr key={x.id}><td>{x.name}</td><td>{x.pf}</td><td>{x.pc}</td><td>{x.pf - x.pc}</td></tr>)}
          </Tabla>
        </Caja>
      </>
    )
  } else {
    cuerpo = (
      <>
        <Metricas items={[['Equipos', posiciones.length], ['Partidos finalizados', jugados.length], ['Fechas completas', fechasCompletas(t.partidos)], ['Próxima fecha', proxima ?? '–']]} />
        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          <Caja titulo="Últimos resultados"><Fixture items={jugados.filter(m => m.round === ultima)} vacio="Todavía no hay resultados." /></Caja>
          <Caja titulo="Próxima jornada"><Fixture items={proximos} vacio="No hay partidos programados." /></Caja>
        </div>
        <SolicitarPerfil />
      </>
    )
  }

  if (!perfil) return <Cargando />
  const mostrarTabs = ['resumen', 'partidos', 'posiciones', 'estadisticas'].includes(activa)
  return (
    <PanelShell clave="aficionado" activa={activa} usuario={perfil.displayName} subtitulo={t.actual ? `${t.actual.competition} · ${t.actual.season}` : 'Sin competencias cargadas'}>
      <ErrorDatos error={t.error} />
      {t.cargando ? <Cargando /> : (
        <>
          {mostrarTabs && <TabsCategoria categorias={t.categorias} actualId={t.actual?.id} onElegir={t.elegir} />}
          {cuerpo}
        </>
      )}
    </PanelShell>
  )
}

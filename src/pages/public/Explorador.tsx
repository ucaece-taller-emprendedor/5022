import { Link } from 'react-router'
import { AvisoDemo, Caja, ErrorDatos, Fixture, Kicker, TablaPosiciones, TabsCategoria } from '@/components/rugby'
import { BotonLink, Cargando, EstadoVacio } from '@/components/ui'
import { useTorneo } from '@/hooks/useTorneo'
import { jugado, partidosJugados, proximaFecha, ultimaFechaJugada } from '@/lib/posiciones'

function Marco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-12">
      <div className="max-w-2xl">
        <Kicker>EXPLORADOR PÚBLICO</Kicker>
        <h1 className="text-4xl font-bold">{titulo}</h1>
        <p className="mt-3 text-suave">Competencia ficticia creada para probar 5022.</p>
      </div>
      {children}
      <AvisoDemo />
    </div>
  )
}

export function PartidosPublicos() {
  const t = useTorneo()
  const ultima = ultimaFechaJugada(t.partidos)
  const proxima = proximaFecha(t.partidos)
  return (
    <Marco titulo="Partidos y resultados">
      <ErrorDatos error={t.error} />
      {t.cargando ? <Cargando /> : !t.actual ? <EstadoVacio>Todavía no hay competencias cargadas.</EstadoVacio> : (
        <>
          <TabsCategoria categorias={t.categorias} actualId={t.actual.id} onElegir={t.elegir} />
          <Caja titulo="Últimos resultados"><Fixture items={partidosJugados(t.partidos).filter(m => m.round === ultima)} vacio="Todavía no hay resultados." /></Caja>
          <Caja titulo="Próxima fecha"><Fixture items={t.partidos.filter(m => !jugado(m) && m.round === proxima)} vacio="No hay partidos programados." /></Caja>
        </>
      )}
      <div className="flex flex-wrap gap-3">
        <BotonLink to="/app/registro">Registrarme para ver mi panel →</BotonLink>
        <BotonLink to="/posiciones" variante="borde">Ver posiciones</BotonLink>
      </div>
    </Marco>
  )
}

export function PosicionesPublicas() {
  const t = useTorneo()
  return (
    <Marco titulo="Tabla de posiciones">
      <ErrorDatos error={t.error} />
      {t.cargando ? <Cargando /> : !t.actual ? <EstadoVacio>Todavía no hay competencias cargadas.</EstadoVacio> : (
        <>
          <TabsCategoria categorias={t.categorias} actualId={t.actual.id} onElegir={t.elegir} />
          <Caja titulo={`${t.actual.competition} · ${t.actual.name}`}><TablaPosiciones partidos={t.partidos} /></Caja>
        </>
      )}
      <div className="flex flex-wrap gap-3">
        <BotonLink to="/app/registro">Registrarme para ver mi panel →</BotonLink>
        <Link className="inline-flex min-h-11 items-center rounded-tema border border-borde bg-superficie2 px-5 text-sm font-bold" to="/partidos">Ver partidos</Link>
      </div>
    </Marco>
  )
}

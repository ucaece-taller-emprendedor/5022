import { useParams } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { GestionCategorias, GestionPartidos } from '@/components/GestionTorneos'
import { PanelShell } from '@/components/PanelShell'
import { Caja, ErrorDatos, Fixture, Metricas, Tabla, TablaPosiciones, TabsCategoria } from '@/components/rugby'
import { Alerta, Cargando, Etiqueta } from '@/components/ui'
import { SECCIONES } from '@/config/app'
import { useClubesActivos } from '@/hooks/useClubes'
import { useColeccion } from '@/hooks/useColeccion'
import { useCategorias, useTorneo } from '@/hooks/useTorneo'
import { db } from '@/lib/firebase'
import { jugado, partidosJugados, proximaFecha } from '@/lib/posiciones'
import type { Partido } from '@/lib/tipos'
import { collection, query } from 'firebase/firestore'
import { useMemo } from 'react'

export default function PanelUnion() {
  const { perfil } = useAuth()
  const { seccion } = useParams()
  const t = useTorneo()
  const cats = useCategorias()
  const clubes = useClubesActivos()
  const todos = useColeccion<Partido>(useMemo(() => query(collection(db, 'partidos')), []))
  const claves: string[] = SECCIONES.union.items.map(([k]) => k)
  const activa = seccion && claves.includes(seccion) ? seccion : 'resumen'

  if (!perfil) return <Cargando />
  if (perfil.status === 'pendiente') {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <Alerta tipo="aviso">Tu cuenta de Unión ({perfil.organization}) está pendiente de aprobación. Un administrador de 5022 tiene que aprobarla antes de que puedas usar el panel. Volvé a ingresar más tarde.</Alerta>
      </div>
    )
  }

  const jugados = partidosJugados(t.partidos)
  const proxima = proximaFecha(t.partidos)
  const fechas = [...new Set(t.partidos.map(m => m.round))].sort((a, b) => a - b)
  const etiqueta = t.actual ? `${t.actual.competition} · ${t.actual.name}` : 'Sin competencias'
  const cantClubes = new Set(t.partidos.flatMap(m => [m.homeClubId, m.awayClubId])).size

  let cuerpo
  if (activa === 'competencias') {
    cuerpo = (
      <>
        <Caja titulo={etiqueta}><p className="text-suave">{t.actual?.season} · {cantClubes} clubes participantes · {jugados.length} encuentros finalizados.</p></Caja>
        <Caja titulo="Clasificación"><TablaPosiciones partidos={t.partidos} /></Caja>
      </>
    )
  } else if (activa === 'calendario') {
    cuerpo = fechas.length ? (
      <>{fechas.map(r => <Caja key={r} titulo={`Fecha ${r}`}><Fixture items={t.partidos.filter(m => m.round === r)} /></Caja>)}</>
    ) : <Caja titulo="Calendario"><p className="text-suave">Todavía no hay partidos cargados.</p></Caja>
  } else if (activa === 'clubes') {
    cuerpo = (
      <Caja titulo="Clubes participantes">
        <Tabla cabecera={['Club', 'Competencia', 'Estado']}>
          {clubes.datos.map(c => {
            const comps = [...new Set(todos.datos.filter(m => m.homeClubId === c.id || m.awayClubId === c.id).map(m => m.categoryId))]
              .map(id => cats.datos.find(x => x.id === id))
              .filter(x => x !== undefined)
              .map(x => `${x.competition} · ${x.name}`)
            return <tr key={c.id}><td>{c.name}</td><td>{comps.join(', ') || '–'}</td><td>{c.isDemo ? 'Demo' : 'Activo'}</td></tr>
          })}
        </Tabla>
      </Caja>
    )
  } else if (activa === 'gestion') {
    cuerpo = (
      <>
        <p className="text-suave">Creá torneos (categorías), programá partidos y cargá resultados. Los cambios se ven al instante en la web pública y en los paneles de aficionados y clubes.</p>
        <GestionCategorias />
        <GestionPartidos />
      </>
    )
  } else {
    cuerpo = (
      <>
        <Metricas items={[['Clubes', clubes.datos.length], ['Torneos demo', cats.datos.length], ['Partidos disputados', jugados.length], ['Partidos programables', t.partidos.filter(m => !jugado(m)).length]]} />
        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          <Caja titulo="Competencia activa">
            <div className="flex items-center justify-between gap-3 py-2"><b>{etiqueta}</b><Etiqueta tono="demo">DEMO</Etiqueta></div>
            <p className="text-suave">{cantClubes} equipos · {fechas.length} fechas ilustrativas</p>
          </Caja>
          <Caja titulo="Próxima jornada"><Fixture items={t.partidos.filter(m => !jugado(m) && m.round === proxima)} vacio="No hay partidos programados." /></Caja>
        </div>
      </>
    )
  }

  const mostrarTabs = ['resumen', 'competencias', 'calendario'].includes(activa)
  return (
    <PanelShell clave="union" activa={activa} usuario={perfil.displayName} subtitulo={t.actual ? `${t.actual.competition} · ${t.actual.season}` : 'Sin competencias cargadas'}>
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

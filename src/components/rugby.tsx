import type { ReactNode } from 'react'
import { AVISO_DEMO } from '@/config/app'
import type { CategoriaCon } from '@/hooks/useTorneo'
import { calcularPosiciones, jugado, type PartidoFila } from '@/lib/posiciones'
import { Alerta, Tarjeta } from './ui'

/** Caja con título (el "panel" del diseño original). */
export function Caja({ titulo, children, className = '' }: { titulo?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Tarjeta className={`min-w-0 ${className}`}>
      {titulo && <h3 className="mb-4 text-xl font-semibold tracking-tight">{titulo}</h3>}
      {children}
    </Tarjeta>
  )
}

export function Kicker({ children }: { children: ReactNode }) {
  return <span className="mb-3 block text-[11px] font-extrabold tracking-[0.18em] text-primario uppercase">{children}</span>
}

export function Metricas({ items, nota = 'Datos demo' }: { items: [string, ReactNode][]; nota?: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(([etiqueta, valor]) => (
        <div key={etiqueta} className="rounded-tema border border-borde bg-superficie p-4 sm:p-5">
          <span className="text-xs text-suave">{etiqueta}</span>
          <b className="font-titulo my-2 block text-2xl font-bold [overflow-wrap:anywhere] sm:text-3xl">{valor}</b>
          <span className="text-xs text-suave">{nota}</span>
        </div>
      ))}
    </div>
  )
}

export function Fixture({ items, vacio = 'Sin partidos para mostrar.' }: { items: PartidoFila[]; vacio?: string }) {
  if (!items.length) return <p className="text-suave">{vacio}</p>
  return (
    <div className="divide-y divide-borde">
      {items.map(m => (
        <div key={m.id} className="flex items-center justify-between gap-4 py-4" data-testid="fixture-fila">
          <div>
            <div className="text-sm font-extrabold">
              {m.home} <span className="font-normal text-suave">vs</span> {m.away}
            </div>
            <div className="mt-1 text-xs text-suave">
              Fecha {m.round} · {jugado(m) ? 'Finalizado' : 'A programar'}
            </div>
          </div>
          <div className="font-titulo whitespace-nowrap text-base font-bold sm:text-lg">{jugado(m) ? `${m.homeScore} – ${m.awayScore}` : 'Pendiente'}</div>
        </div>
      ))}
    </div>
  )
}

export function Tabla({ cabecera, children }: { cabecera: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-borde text-[10px] tracking-widest text-suave uppercase">
            {cabecera.map((h, i) => (
              <th key={i} className="px-2.5 py-3.5 font-bold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:border-b [&_td]:border-borde/60 [&_td]:px-2.5 [&_td]:py-3.5 [&_tr:last-child_td]:border-0">{children}</tbody>
      </table>
    </div>
  )
}

export function TablaPosiciones({ partidos }: { partidos: PartidoFila[] }) {
  const filas = calcularPosiciones(partidos)
  return (
    <>
      <Tabla cabecera={['#', 'Equipo', 'PJ', 'G', 'E', 'P', 'PF', 'PC', 'Pts']}>
        {filas.map((x, i) => (
          <tr key={x.id} data-testid="posicion-fila">
            <td className="font-extrabold text-primario">{i + 1}</td>
            <td><b>{x.name}</b></td>
            <td>{x.pj}</td><td>{x.g}</td><td>{x.e}</td><td>{x.p}</td><td>{x.pf}</td><td>{x.pc}</td>
            <td><b>{x.pts}</b></td>
          </tr>
        ))}
      </Tabla>
      {filas.length === 0 && <p className="mt-3 text-suave">Todavía no hay partidos cargados.</p>}
      <p className="mt-4 text-xs text-suave">Sistema simplificado de demo: 4 puntos por victoria y 2 por empate; no se aplican bonus.</p>
    </>
  )
}

/** Selector de categoría (solo se muestra si hay más de una). */
export function TabsCategoria({ categorias, actualId, onElegir }: { categorias: CategoriaCon[]; actualId: string | undefined; onElegir: (id: string) => void }) {
  if (categorias.length < 2) return null
  return (
    <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Categoría">
      {categorias.map(c => (
        <button
          key={c.id}
          role="tab"
          aria-selected={c.id === actualId}
          onClick={() => onElegir(c.id)}
          className={`min-h-11 rounded-tema border px-4 text-xs font-extrabold ${c.id === actualId ? 'border-primario bg-primario text-primario-texto' : 'border-borde bg-superficie2 text-suave'}`}
        >
          {c.competition} · {c.name}
        </button>
      ))}
    </div>
  )
}

export function AvisoDemo() {
  return <p className="mt-6 rounded-tema border border-ok/30 bg-ok/10 p-3.5 text-xs leading-relaxed text-ok">{AVISO_DEMO}</p>
}

export function ErrorDatos({ error }: { error: string | null | undefined }) {
  return error ? <Alerta>{error}</Alerta> : null
}

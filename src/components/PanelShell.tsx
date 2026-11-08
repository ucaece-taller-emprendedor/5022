import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { SECCIONES } from '@/config/app'
import { AvisoDemo, Kicker } from './rugby'

export type ClavePanel = keyof typeof SECCIONES

/** Marco de los paneles /app/{perfil}: menú lateral en escritorio, menú horizontal en el celular. */
export function PanelShell({ clave, activa, subtitulo, usuario, children }: { clave: ClavePanel; activa: string; subtitulo: string; usuario: string; children: ReactNode }) {
  const def = SECCIONES[clave]
  const actual = def.items.find(([k]) => k === activa) ?? def.items[0]
  const href = (k: string) => (k === 'resumen' ? `/app/${clave}` : `/app/${clave}/${k}`)
  return (
    <div className="md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="border-b border-borde bg-[#0f1d17] md:min-h-[calc(100dvh-4rem)] md:border-r md:border-b-0 md:p-4">
        <p className="hidden px-3 pt-4 pb-2 text-[10px] font-extrabold tracking-[0.17em] text-suave uppercase md:block">{def.titulo} · {usuario}</p>
        <nav aria-label={`Panel de ${def.titulo}`} className="flex gap-1 overflow-x-auto px-3 py-2 md:flex-col md:px-0">
          {def.items.map(([k, etiqueta]) => (
            <NavLink
              key={k}
              to={href(k)}
              end
              className={({ isActive }) => `flex min-h-11 flex-none items-center rounded-lg px-3 text-[13px] font-bold whitespace-nowrap ${isActive ? 'bg-[#2b4632] text-primario' : 'text-[#a8c0ae] hover:bg-[#2b4632] hover:text-primario'}`}
            >
              {etiqueta}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="mx-auto w-full max-w-6xl min-w-0 space-y-5 px-4 py-6 md:px-9 md:py-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Kicker>5022 / {def.titulo}</Kicker>
            <h1 className="text-3xl font-bold md:text-4xl">{actual?.[1]}</h1>
            <span className="text-sm text-suave">{subtitulo}</span>
          </div>
          <span className="rounded-full bg-[#604a24] px-2.5 py-1 text-[10px] font-extrabold text-[#ffe4a0]">● DEMO</span>
        </div>
        {children}
        <AvisoDemo />
      </div>
    </div>
  )
}

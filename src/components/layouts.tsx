import { LogOut } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { MARCA, panelDe } from '@/config/app'
import { Marca } from './Marca'
import { Boton, BotonLink } from './ui'

export type EnlaceNav = { to: string; etiqueta: string; fin?: boolean }

const enlace = ({ isActive }: { isActive: boolean }) => `rounded-full px-3 py-2 text-sm font-medium ${isActive ? 'bg-primario text-primario-texto' : 'text-texto hover:bg-primario/10'}`

/** Cabecera común de la web pública y del panel de usuarios. */
export function SitioLayout({ navegacion = [] }: { navegacion?: EnlaceNav[] }) {
  const { perfil, usuario, salir } = useAuth()
  const navegar = useNavigate()
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-borde bg-superficie/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
          <Marca to="/" />
          <nav aria-label="Principal" className="flex flex-wrap items-center gap-1">
            {navegacion.map(n => (
              <NavLink key={n.to} to={n.to} end={n.fin} className={enlace}>
                {n.etiqueta}
              </NavLink>
            ))}
            {usuario && perfil ? (
              <>
                <NavLink to={panelDe(perfil.role)} className={enlace}>
                  Mi panel
                </NavLink>
                <Boton variante="borde" onClick={() => void salir().then(() => navegar('/'))} aria-label="Salir">
                  <LogOut className="size-4" aria-hidden /> Salir
                </Boton>
              </>
            ) : (
              <>
                <BotonLink to="/app/ingresar" variante="borde">Ingresar</BotonLink>
                <BotonLink to="/app/registro">Registrarme</BotonLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-borde bg-superficie px-4 py-6 text-center text-sm text-suave">
        {MARCA.nombre} · Proyecto del Taller Emprendedor · {MARCA.contacto}
      </footer>
    </div>
  )
}

/** Panel de administración: barra lateral en escritorio, menú horizontal en el celular. */
export function AdminLayout({ navegacion }: { navegacion: EnlaceNav[] }) {
  const { usuario, salir } = useAuth()
  const navegar = useNavigate()
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[14rem_1fr]">
      <aside className="border-b border-borde bg-superficie p-4 md:border-r md:border-b-0">
        <Marca to="/admin" />
        <p className="mt-1 text-xs text-suave">Panel de administración</p>
        <nav aria-label="Administración" className="mt-4 flex flex-wrap gap-1 md:flex-col">
          {navegacion.map(n => (
            <NavLink key={n.to} to={n.to} end={n.fin} className={enlace}>
              {n.etiqueta}
            </NavLink>
          ))}
        </nav>
        <p className="mt-6 hidden truncate text-xs text-suave md:block">{usuario?.email}</p>
        <Boton variante="borde" className="mt-2" onClick={() => void salir().then(() => navegar('/admin/login'))}>
          <LogOut className="size-4" aria-hidden /> Salir
        </Boton>
      </aside>
      <main className="min-w-0 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}

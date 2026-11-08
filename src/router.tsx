import { createBrowserRouter, Navigate } from 'react-router'
import { RequireAdmin, RequireAuth, RequireRole } from '@/auth/guards'
import { AdminLayout, SitioLayout } from '@/components/layouts'
import Administradores from '@/pages/admin/Administradores'
import Estadisticas from '@/pages/admin/Estadisticas'
import AdminLogin from '@/pages/admin/AdminLogin'
import { AdminCategorias, AdminClubes, AdminInicio, AdminPartidos, AdminUsuarios } from '@/pages/admin/AdminPaginas'
import { AppInicio, CompletarPerfil, Ingresar, Registro, Suspendido } from '@/pages/app/Acceso'
import PanelAficionado from '@/pages/app/PanelAficionado'
import PanelClub from '@/pages/app/PanelClub'
import PanelUnion from '@/pages/app/PanelUnion'
import Landing from '@/pages/public/Landing'
import { PartidosPublicos, PosicionesPublicas } from '@/pages/public/Explorador'
import NoEncontrada from '@/pages/public/NoEncontrada'

export const router = createBrowserRouter([
  { path: '/', element: <SitioLayout />, children: [{ index: true, element: <Landing /> }, { path: 'partidos', element: <PartidosPublicos /> }, { path: 'posiciones', element: <PosicionesPublicas /> }] },
  {
    path: '/app',
    element: <SitioLayout />,
    children: [
      { index: true, element: <AppInicio /> },
      { path: 'ingresar', element: <Ingresar /> },
      { path: 'registro', element: <Registro /> },
      { path: 'completar-perfil', element: <CompletarPerfil /> },
      { path: 'suspendido', element: <Suspendido /> },
      {
        element: <RequireAuth />,
        children: [
          { path: 'aficionado/:seccion?', element: <RequireRole roles={['aficionado']}><PanelAficionado /></RequireRole> },
          { path: 'club/:seccion?', element: <RequireRole roles={['club']}><PanelClub /></RequireRole> },
          { path: 'union/:seccion?', element: <RequireRole roles={['union']}><PanelUnion /></RequireRole> },
        ],
      },
    ],
  },
  { path: '/admin/login', element: <AdminLogin /> },
  {
    path: '/admin',
    element: (
      <RequireAdmin>
        <AdminLayout navegacion={[{ to: '/admin', etiqueta: 'Inicio', fin: true }, { to: '/admin/usuarios', etiqueta: 'Usuarios y aprobaciones' }, { to: '/admin/administradores', etiqueta: 'Administradores' }, { to: '/admin/estadisticas', etiqueta: 'Estadísticas' }, { to: '/admin/clubes', etiqueta: 'Clubes' }, { to: '/admin/categorias', etiqueta: 'Categorías' }, { to: '/admin/partidos', etiqueta: 'Partidos y resultados' }]} />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <AdminInicio /> },
      { path: 'usuarios', element: <AdminUsuarios /> },
      { path: 'administradores', element: <Administradores /> },
      { path: 'estadisticas', element: <Estadisticas /> },
      { path: 'clubes', element: <AdminClubes /> },
      { path: 'categorias', element: <AdminCategorias /> },
      { path: 'partidos', element: <AdminPartidos /> },
      { path: '*', element: <Navigate to="/admin" replace /> },
    ],
  },
  { path: '*', element: <SitioLayout />, children: [{ path: '*', element: <NoEncontrada /> }] },
])

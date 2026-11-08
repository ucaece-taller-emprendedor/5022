import { createBrowserRouter, Navigate } from 'react-router'
import { RequireAdmin, RequireAuth, RequireRole } from '@/auth/guards'
import { AdminLayout, SitioLayout } from '@/components/layouts'
import AdminLogin from '@/pages/admin/AdminLogin'
import { AdminInicio, AdminItems, AdminUsuarios } from '@/pages/admin/AdminPaginas'
import { AppInicio, CompletarPerfil, Ingresar, Registro, Suspendido } from '@/pages/app/Acceso'
import { PanelSocio, PanelUsuario } from '@/pages/app/Paneles'
import Landing from '@/pages/public/Landing'
import NoEncontrada from '@/pages/public/NoEncontrada'

export const router = createBrowserRouter([
  { path: '/', element: <SitioLayout />, children: [{ index: true, element: <Landing /> }] },
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
          { path: 'usuario', element: <RequireRole roles={['usuario']}><PanelUsuario /></RequireRole> },
          { path: 'socio', element: <RequireRole roles={['socio']}><PanelSocio /></RequireRole> },
        ],
      },
    ],
  },
  { path: '/admin/login', element: <AdminLogin /> },
  {
    path: '/admin',
    element: (
      <RequireAdmin>
        <AdminLayout navegacion={[{ to: '/admin', etiqueta: 'Inicio', fin: true }, { to: '/admin/usuarios', etiqueta: 'Usuarios' }, { to: '/admin/items', etiqueta: 'Ítems' }]} />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <AdminInicio /> },
      { path: 'usuarios', element: <AdminUsuarios /> },
      { path: 'items', element: <AdminItems /> },
      { path: '*', element: <Navigate to="/admin" replace /> },
    ],
  },
  { path: '*', element: <SitioLayout />, children: [{ path: '*', element: <NoEncontrada /> }] },
])

import type { Estado, Rol } from '@/config/app'

export type Perfil = {
  uid: string
  email: string
  displayName: string
  role: Rol
  status: Estado
  isDemo: boolean
}

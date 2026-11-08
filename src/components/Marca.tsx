import { Link } from 'react-router'
import { MARCA } from '@/config/app'

export function Marca({ to = '/' }: { to?: string; claro?: boolean }) {
  return (
    <Link to={to} className="font-titulo flex items-center gap-3 text-2xl font-bold tracking-tighter text-texto">
      <img src={MARCA.logo} alt="" className="size-9 rounded-[11px]" />
      <span>{MARCA.nombre}</span>
    </Link>
  )
}

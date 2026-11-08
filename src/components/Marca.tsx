import { Link } from 'react-router'
import { MARCA } from '@/config/app'

export function Marca({ to = '/', claro = false }: { to?: string; claro?: boolean }) {
  return (
    <Link to={to} className={`flex items-center gap-2 font-bold ${claro ? 'text-white' : 'text-texto'}`}>
      <img src={MARCA.logo} alt="" className="size-8 rounded-lg" />
      <span>{MARCA.nombre}</span>
    </Link>
  )
}

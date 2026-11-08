import { BotonLink } from '@/components/ui'
import { LANDING, MARCA } from '@/config/app'

export default function Landing() {
  return (
    <>
      <section className="bg-primario px-4 py-20 text-primario-texto">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{MARCA.nombre}</h1>
          <p className="mt-4 text-lg opacity-90">{MARCA.eslogan}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <BotonLink to="/app/registro" variante="acento">Registrarme</BotonLink>
            <BotonLink to="/app/ingresar" variante="borde">Ingresar</BotonLink>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-14 md:grid-cols-2">
        {[LANDING.problema, LANDING.solucion].map(b => (
          <div key={b.titulo}>
            <h2 className="text-2xl font-bold">{b.titulo}</h2>
            <p className="mt-3 text-suave">{b.texto}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-14">
        <h2 className="text-2xl font-bold">Beneficios</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {LANDING.beneficios.map(b => (
            <div key={b.titulo} className="rounded-tema border border-borde bg-superficie p-5">
              <h3 className="font-semibold">{b.titulo}</h3>
              <p className="mt-2 text-sm text-suave">{b.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="rounded-tema bg-texto p-8 text-center text-white">
          <h2 className="text-2xl font-bold">{LANDING.cta.titulo}</h2>
          <p className="mx-auto mt-2 max-w-md opacity-80">{LANDING.cta.texto}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <BotonLink to="/app/registro" variante="acento">Registrarme</BotonLink>
            <BotonLink to="/app/ingresar" variante="borde">Ingresar</BotonLink>
          </div>
        </div>
      </section>
    </>
  )
}

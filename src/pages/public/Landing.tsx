import { Link } from 'react-router'
import { Caja, Kicker } from '@/components/rugby'
import { BotonLink } from '@/components/ui'
import { LANDING } from '@/config/app'
import { useCategorias, usePartidos } from '@/hooks/useTorneo'
import { calcularPosiciones, ultimaFechaJugada, partidosJugados } from '@/lib/posiciones'

function Vista() {
  const cats = useCategorias()
  const actual = cats.datos[0]
  const { datos: partidos } = usePartidos(actual?.id)
  const posiciones = calcularPosiciones(partidos)
  const ultima = ultimaFechaJugada(partidos)
  const ultimos = partidosJugados(partidos).filter(m => m.round === ultima).slice(0, 2)
  if (!actual) return null
  return (
    <div className="rotate-1 rounded-[22px] border border-[#45624b] bg-[#12241c] p-3 shadow-2xl shadow-black/50 sm:p-4" aria-label="Vista previa del torneo">
      <div className="flex items-center justify-between p-2 pb-4">
        <div>
          <b>{actual.competition} · {actual.name}</b>
          <div className="text-xs text-suave">{actual.season}{ultima ? ` · Fecha ${ultima}` : ''}</div>
        </div>
        <span className="rounded-full bg-[#24442b] px-2.5 py-1.5 text-[10px] font-extrabold text-primario">● DEMO</span>
      </div>
      {ultimos.map(m => (
        <div key={m.id} className="my-2.5 flex items-center justify-between gap-2.5 rounded-xl border border-[#37503e] bg-[#1c3327] px-4 py-5">
          <div className="flex-1 text-xs font-bold">{m.home}</div>
          <div className="text-center">
            <div className="font-titulo text-2xl font-bold whitespace-nowrap">{m.homeScore} : {m.awayScore}</div>
            <small className="text-[9px] text-primario">FINAL</small>
          </div>
          <div className="flex-1 text-right text-xs font-bold">{m.away}</div>
        </div>
      ))}
      <div className="mt-3.5 overflow-hidden rounded-xl border border-borde text-xs">
        <div className="grid grid-cols-[1.5rem_1fr_2rem_2rem_2rem] gap-2.5 bg-[#253e30] px-3.5 py-3 text-[10px] text-[#afc3b3] uppercase"><span>#</span><span>Equipo</span><span>PJ</span><span>G</span><span>Pts</span></div>
        {posiciones.slice(0, 4).map((x, i) => (
          <div key={x.id} className="grid grid-cols-[1.5rem_1fr_2rem_2rem_2rem] gap-2.5 border-t border-[#2c4235] px-3.5 py-3"><span>{i + 1}</span><b>{x.name}</b><span>{x.pj}</span><span>{x.g}</span><b>{x.pts}</b></div>
        ))}
      </div>
      <p className="px-1 pt-3 text-xs text-suave">Resultados ilustrativos, no oficiales.</p>
    </div>
  )
}

export default function Landing() {
  const cats = useCategorias()
  const { hero } = LANDING
  return (
    <>
      <section className="overflow-hidden bg-[radial-gradient(ellipse_at_80%_40%,#254b31_0,transparent_49%)] px-4 py-14 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#496342] px-3 py-2 text-[11px] font-extrabold tracking-[0.13em] text-primario">
              <span className="size-1.5 rounded-full bg-primario" /> {hero.etiqueta}
            </span>
            <h1 className="my-6 text-[clamp(2.9rem,7vw,5.1rem)] leading-[1.03] font-bold">
              {hero.titulo}<br /><em className="text-primario not-italic">{hero.destacado}</em>
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-[#b7c8bb]">{hero.texto}</p>
            <div className="my-7 flex flex-wrap gap-3">
              <BotonLink to="/app/registro">Registrarme →</BotonLink>
              <BotonLink to="/app/ingresar" variante="borde">Ingresar</BotonLink>
              <BotonLink to="/partidos" variante="borde">Ver resultados</BotonLink>
            </div>
            <div className="mt-10 flex flex-wrap gap-7 text-xs text-suave">
              <div><strong className="font-titulo block text-3xl text-texto">{cats.datos.length || '–'}</strong>torneos en la demo</div>
              <div><strong className="font-titulo block text-3xl text-texto">4</strong>perfiles de la plataforma</div>
            </div>
          </div>
          <Vista />
        </div>
      </section>

      <section id="problema" className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <Kicker>EL PROBLEMA</Kicker>
            <h2 className="text-[clamp(2rem,4vw,3rem)] leading-tight font-bold">{LANDING.problema.titulo}</h2>
            <p className="mt-4 leading-relaxed text-suave">{LANDING.problema.texto}</p>
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="bg-[#102019] px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <Kicker>QUÉ RESUELVE 5022</Kicker>
            <h2 className="text-[clamp(2rem,4vw,3rem)] leading-tight font-bold">{LANDING.solucion.titulo}</h2>
            <p className="mt-4 leading-relaxed text-suave">{LANDING.solucion.texto}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {LANDING.perfiles.map(p => (
              <article key={p.titulo} className="rounded-2xl border border-[#2d4637] bg-[#172820] p-7">
                <div className="mb-5 grid size-11 place-items-center rounded-xl bg-[#294534] text-2xl" aria-hidden>{p.simbolo}</div>
                <h3 className="text-xl font-semibold">{p.titulo}</h3>
                <p className="mt-3 text-sm leading-relaxed text-suave">{p.texto}</p>
                <Link className="mt-3 inline-block text-sm font-extrabold text-primario" to={p.enlace}>{p.cta}</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <Kicker>BENEFICIOS</Kicker>
            <h2 className="text-[clamp(2rem,4vw,3rem)] leading-tight font-bold">Menos planillas, más rugby.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LANDING.beneficios.map((b, i) => (
              <Caja key={b.titulo}>
                <div className="font-titulo mb-3 text-4xl font-bold text-primario">{String(i + 1).padStart(2, '0')}</div>
                <h3 className="text-xl font-semibold">{b.titulo}</h3>
                <p className="mt-3 text-sm leading-relaxed text-suave">{b.texto}</p>
              </Caja>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 rounded-3xl bg-gradient-to-br from-primario to-[#88cba3] p-8 text-[#142318] md:p-12">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">{LANDING.cta.titulo}</h2>
            <p className="mt-2 text-[#39513a]">{LANDING.cta.texto}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="inline-flex min-h-11 items-center rounded-tema bg-[#142318] px-5 text-sm font-bold text-white" to="/app/registro">Registrarme →</Link>
            <Link className="inline-flex min-h-11 items-center rounded-tema bg-[#142318] px-5 text-sm font-bold text-white" to="/app/ingresar">Ingresar</Link>
          </div>
        </div>
      </section>
    </>
  )
}

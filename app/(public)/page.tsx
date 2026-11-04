import Link from "next/link";
import { getMatches, resolveCategory } from "@/lib/queries";
import { computeStandings, lastPlayedRound, playedMatches } from "@/lib/standings";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const { current } = await resolveCategory();
  const matches = current ? await getMatches(current.id) : [];
  const standings = computeStandings(matches);
  const lastRound = lastPlayedRound(matches);
  const lastResults = playedMatches(matches).filter((m) => m.round === lastRound).slice(0, 2);
  const playedRounds = new Set(playedMatches(matches).map((m) => m.round)).size;

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow"><span className="dot" /> PLATAFORMA DE RUGBY · DEMO</span>
            <h1>El rugby tiene historia.<br /><em>Ahora tiene datos.</em></h1>
            <p className="lead">
              Partidos, posiciones y estadísticas para los aficionados. Gestión deportiva para clubes y uniones. Una sola plataforma, experiencias distintas.
            </p>
            <div className="actions">
              <Link className="btn primary" href="/app/registro">Registrarme →</Link>
              <Link className="btn ghost" href="/app/login">Ingresar</Link>
              <Link className="btn ghost" href="/partidos">Ver resultados</Link>
            </div>
            <div className="trust">
              <div><strong>{standings.length}</strong><span>clubes en el torneo demo</span></div>
              <div><strong>{playedRounds}</strong><span>fechas con resultados</span></div>
              <div><strong>4</strong><span>perfiles de la plataforma</span></div>
            </div>
          </div>
          {current && (
            <div className="preview">
              <div className="preview-top">
                <div>
                  <b>{current.competition} · {current.name}</b>
                  <div className="mini">{current.season}{lastRound ? ` · Fecha ${lastRound}` : ""}</div>
                </div>
                <span className="live">● DEMO</span>
              </div>
              {lastResults.map((m) => (
                <div className="match" key={m.id}>
                  <div className="team">{m.home}</div>
                  <div>
                    <div className="score">{m.h} : {m.a}</div>
                    <small>FINAL</small>
                  </div>
                  <div className="team right">{m.away}</div>
                </div>
              ))}
              <div className="standings">
                <div className="tr head"><span>#</span><span>Equipo</span><span>PJ</span><span>G</span><span>Pts</span></div>
                {standings.slice(0, 4).map((x, i) => (
                  <div className="tr" key={x.id}>
                    <span>{i + 1}</span><b>{x.name}</b><span>{x.pj}</span><span>{x.g}</span><b>{x.pts}</b>
                  </div>
                ))}
              </div>
              <p className="mini" style={{ padding: "12px 5px 0" }}>Resultados ilustrativos, no oficiales.</p>
            </div>
          )}
        </div>
      </section>

      <section className="section" id="problema">
        <div className="container">
          <div className="section-head">
            <span className="kicker">EL PROBLEMA</span>
            <h2>La información del rugby marplatense está dispersa.</h2>
            <p>
              Resultados, tablas y fixtures viven en grupos de mensajería, planillas y redes sociales. No hay un lugar único para aficionados, clubes y la Unión, y cada club lleva a mano su plantel, sus asistencias y sus lesiones.
            </p>
          </div>
        </div>
      </section>

      <section className="section alt" id="funcionalidades">
        <div className="container">
          <div className="section-head">
            <span className="kicker">QUÉ RESUELVE 5022</span>
            <h2>Información deportiva y gestión, sin dispersión.</h2>
            <p>Una sola plataforma. Cada perfil accede únicamente a las herramientas que necesita.</p>
          </div>
          <div className="cards">
            <article className="card">
              <div className="symbol">◫</div>
              <h3>Para aficionados</h3>
              <p>Calendario, resultados, posiciones y estadísticas del torneo en un mismo lugar.</p>
              <Link className="textlink" href="/partidos">Explorar partidos →</Link>
            </article>
            <article className="card">
              <div className="symbol">♜</div>
              <h3>Para clubes</h3>
              <p>Plantel, asistencia a entrenamientos, lesiones y rendimiento del equipo en un panel específico.</p>
              <Link className="textlink" href="/app/registro">Acceder como club →</Link>
            </article>
            <article className="card">
              <div className="symbol">▦</div>
              <h3>Para uniones</h3>
              <p>Visualización de competencias, calendario y clubes participantes.</p>
              <Link className="textlink" href="/app/registro">Acceder como unión →</Link>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="kicker">BENEFICIOS</span>
            <h2>Menos planillas, más rugby.</h2>
          </div>
          <div className="steps">
            {[
              ["01", "Datos únicos", "Las posiciones se calculan solas a partir de los resultados cargados."],
              ["02", "Cada perfil, lo suyo", "Aficionados, clubes y Unión ven solo las herramientas que necesitan."],
              ["03", "Gestión del club", "Asistencia y lesiones guardadas en la nube, no en una planilla suelta."],
              ["04", "Cuentas verificadas", "Clubes y Unión las aprueba un administrador antes de operar."],
            ].map(([n, t, d]) => (
              <article className="card" key={n}>
                <div className="step-num">{n}</div>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta">
            <div>
              <h2>Conocé 5022 desde adentro.</h2>
              <p>Registrate y elegí el perfil que querés explorar.</p>
            </div>
            <div className="actions" style={{ margin: 0 }}>
              <Link className="btn" href="/app/registro">Registrarme →</Link>
              <Link className="btn" href="/app/login">Ingresar</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

import { Link } from 'react-router-dom'
import { usuarioLogado } from '../api'

export default function Painel() {
  const usuario = usuarioLogado()

  return (
    <section>
      <h1>Olá, {usuario?.nome || 'usuário'}</h1>
      <p className="subtitulo">
        Cadastro e gestão de dentistas, clientes e agendamentos.
      </p>

      <div className="cards">
        <Link className="card" to="/dentistas">
          <h2>Dentistas</h2>
          <p>Cadastrar profissionais e buscar por nome, CRO ou especialidade.</p>
        </Link>
        <Link className="card" to="/clientes">
          <h2>Clientes</h2>
          <p>Vincular cada cliente a um dentista responsável.</p>
        </Link>
        <Link className="card" to="/agendamentos">
          <h2>Agendamentos</h2>
          <p>Marcar consultas e acompanhar a agenda em ordem cronológica.</p>
        </Link>
      </div>
    </section>
  )
}

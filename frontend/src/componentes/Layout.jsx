import { Link, useNavigate } from 'react-router-dom'
import { requisicao, usuarioLogado } from '../api'

export default function Layout({ children }) {
  const navigate = useNavigate()
  const usuario = usuarioLogado()

  async function sair() {
    try {
      await requisicao('/logout', { method: 'POST', body: '{}' })
    } catch {
      // A sessão local é encerrada mesmo se a API não responder.
    }
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    navigate('/login')
  }

  return (
    <div className="pagina">
      <header className="topo">
        <div>
          <p className="marca">Consultório odontológico</p>
          <strong>{usuario?.nome || 'Usuário'}</strong>
        </div>
        <button type="button" className="botao-secundario" onClick={sair}>
          Sair
        </button>
      </header>
      <nav className="menu">
        <Link to="/">Início</Link>
        <Link to="/dentistas">Dentistas</Link>
        <Link to="/clientes">Clientes</Link>
        <Link to="/agendamentos">Agendamentos</Link>
      </nav>
      <main>{children}</main>
    </div>
  )
}

import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { requisicao } from '../api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (localStorage.getItem('token')) {
    return <Navigate to="/" replace />
  }

  async function entrar(event) {
    event.preventDefault()
    setErro('')
    setEnviando(true)

    try {
      const { resposta, dados } = await requisicao('/login', {
        method: 'POST',
        publico: true,
        body: JSON.stringify({ email, senha })
      })

      if (!resposta.ok || !dados.login) {
        setErro(dados.message || 'Usuário ou senha inválidos!')
        return
      }

      localStorage.setItem('token', dados.token)
      localStorage.setItem('usuario', JSON.stringify(dados.usuario))
      navigate('/')
    } catch {
      setErro('Não foi possível conectar à API. Verifique se o servidor está no ar.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="login-fundo">
      <form className="cartao login-cartao" onSubmit={entrar}>
        <p className="marca">Consultório odontológico</p>
        <h1>Entrar</h1>
        <p className="subtitulo">Use o e-mail e a senha cadastrados para acessar o sistema.</p>

        {erro && (
          <p className="alerta-erro" role="alert">
            {erro}
          </p>
        )}

        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          type="password"
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          autoComplete="current-password"
          required
        />

        <button type="submit" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

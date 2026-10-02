import { useEffect, useState } from 'react'
import { requisicao } from '../api'

const formularioVazio = {
  nome: '',
  cro: '',
  especialidade: '',
  telefone: '',
  email: ''
}

export default function Dentistas() {
  const [formulario, setFormulario] = useState(formularioVazio)
  const [termo, setTermo] = useState('')
  const [buscaConfirmada, setBuscaConfirmada] = useState('')
  const [dentistas, setDentistas] = useState([])
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  function atualizar(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
  }

  async function carregar(filtro = '') {
    const query = filtro.trim() ? `?termo=${encodeURIComponent(filtro.trim())}` : ''
    const { resposta, dados } = await requisicao(`/dentistas${query}`)
    if (!resposta.ok) {
      setErro(dados.message || 'Não foi possível carregar os dentistas.')
      setDentistas([])
      return
    }
    setDentistas(Array.isArray(dados) ? dados : [])
    setBuscaConfirmada(filtro.trim())
  }

  useEffect(() => {
    carregar('')
  }, [])

  async function cadastrar(event) {
    event.preventDefault()
    setMensagem('')
    setErro('')
    setEnviando(true)

    const { resposta, dados } = await requisicao('/dentistas', {
      method: 'POST',
      body: JSON.stringify(formulario)
    })

    setEnviando(false)

    if (!resposta.ok) {
      setErro(dados.message || 'Não foi possível cadastrar o dentista.')
      return
    }

    setMensagem(dados.message || 'Dentista cadastrado com sucesso!')
    setFormulario(formularioVazio)
    carregar(buscaConfirmada)
  }

  function buscar(event) {
    event.preventDefault()
    setMensagem('')
    setErro('')
    carregar(termo)
  }

  return (
    <section>
      <h1>Dentistas</h1>

      {mensagem && <p className="alerta-ok">{mensagem}</p>}
      {erro && <p className="alerta-erro" role="alert">{erro}</p>}

      <form className="cartao" onSubmit={cadastrar}>
        <h2>Cadastrar dentista</h2>
        <div className="grade">
          <div>
            <label htmlFor="nome">Nome</label>
            <input id="nome" value={formulario.nome} onChange={(event) => atualizar('nome', event.target.value)} required />
          </div>
          <div>
            <label htmlFor="cro">CRO</label>
            <input id="cro" value={formulario.cro} onChange={(event) => atualizar('cro', event.target.value)} />
          </div>
          <div>
            <label htmlFor="especialidade">Especialidade</label>
            <input id="especialidade" value={formulario.especialidade} onChange={(event) => atualizar('especialidade', event.target.value)} />
          </div>
          <div>
            <label htmlFor="telefone">Telefone</label>
            <input id="telefone" value={formulario.telefone} onChange={(event) => atualizar('telefone', event.target.value)} />
          </div>
          <div>
            <label htmlFor="email-dentista">E-mail</label>
            <input id="email-dentista" type="email" value={formulario.email} onChange={(event) => atualizar('email', event.target.value)} />
          </div>
        </div>
        <button type="submit" disabled={enviando}>
          {enviando ? 'Salvando...' : 'Cadastrar'}
        </button>
      </form>

      <form className="cartao busca" onSubmit={buscar}>
        <h2>Buscar</h2>
        <p className="subtitulo">A busca é feita na API, pelos campos nome, CRO ou especialidade.</p>
        <div className="linha-busca">
          <input
            type="search"
            value={termo}
            onChange={(event) => setTermo(event.target.value)}
            placeholder="Digite um termo"
            aria-label="Termo de busca"
          />
          <button type="submit">Buscar</button>
        </div>
        {buscaConfirmada && <p className="subtitulo">Resultados para: {buscaConfirmada}</p>}
      </form>

      <div className="tabela-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CRO</th>
              <th>Especialidade</th>
              <th>Telefone</th>
              <th>E-mail</th>
            </tr>
          </thead>
          <tbody>
            {dentistas.length === 0 ? (
              <tr>
                <td colSpan="5">Nenhum dentista encontrado.</td>
              </tr>
            ) : (
              dentistas.map((dentista) => (
                <tr key={dentista.id}>
                  <td>{dentista.nome}</td>
                  <td>{dentista.cro || '—'}</td>
                  <td>{dentista.especialidade || '—'}</td>
                  <td>{dentista.telefone || '—'}</td>
                  <td>{dentista.email || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

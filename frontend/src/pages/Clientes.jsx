import { useEffect, useState } from 'react'
import { requisicao } from '../api'

const formularioVazio = {
  nome: '',
  cpf: '',
  telefone: '',
  email: '',
  dentista_id: ''
}

export default function Clientes() {
  const [formulario, setFormulario] = useState(formularioVazio)
  const [dentistas, setDentistas] = useState([])
  const [clientes, setClientes] = useState([])
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  function atualizar(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
  }

  async function carregar() {
    const [respostaDentistas, respostaClientes] = await Promise.all([
      requisicao('/dentistas'),
      requisicao('/clientes')
    ])

    if (!respostaDentistas.resposta.ok) {
      setErro(respostaDentistas.dados.message || 'Não foi possível carregar os dentistas.')
    } else {
      setDentistas(Array.isArray(respostaDentistas.dados) ? respostaDentistas.dados : [])
    }

    if (!respostaClientes.resposta.ok) {
      setErro(respostaClientes.dados.message || 'Não foi possível carregar os clientes.')
      setClientes([])
      return
    }

    setClientes(Array.isArray(respostaClientes.dados) ? respostaClientes.dados : [])
  }

  useEffect(() => {
    carregar()
  }, [])

  async function cadastrar(event) {
    event.preventDefault()
    setMensagem('')
    setErro('')
    setEnviando(true)

    const { resposta, dados } = await requisicao('/clientes', {
      method: 'POST',
      body: JSON.stringify({
        ...formulario,
        dentista_id: Number(formulario.dentista_id)
      })
    })

    setEnviando(false)

    if (!resposta.ok) {
      setErro(dados.message || 'Não foi possível cadastrar o cliente.')
      return
    }

    setMensagem(dados.message || 'Cliente cadastrado com sucesso!')
    setFormulario(formularioVazio)
    carregar()
  }

  return (
    <section>
      <h1>Clientes</h1>

      {mensagem && <p className="alerta-ok">{mensagem}</p>}
      {erro && <p className="alerta-erro" role="alert">{erro}</p>}

      <form className="cartao" onSubmit={cadastrar}>
        <h2>Cadastrar cliente</h2>
        <div className="grade">
          <div>
            <label htmlFor="nome-cliente">Nome</label>
            <input id="nome-cliente" value={formulario.nome} onChange={(event) => atualizar('nome', event.target.value)} required />
          </div>
          <div>
            <label htmlFor="cpf">CPF</label>
            <input id="cpf" value={formulario.cpf} onChange={(event) => atualizar('cpf', event.target.value)} required />
          </div>
          <div>
            <label htmlFor="telefone-cliente">Telefone</label>
            <input id="telefone-cliente" value={formulario.telefone} onChange={(event) => atualizar('telefone', event.target.value)} />
          </div>
          <div>
            <label htmlFor="email-cliente">E-mail</label>
            <input id="email-cliente" type="email" value={formulario.email} onChange={(event) => atualizar('email', event.target.value)} />
          </div>
          <div>
            <label htmlFor="dentista">Dentista responsável</label>
            <select
              id="dentista"
              value={formulario.dentista_id}
              onChange={(event) => atualizar('dentista_id', event.target.value)}
              required
            >
              <option value="">Selecione um dentista</option>
              {dentistas.map((dentista) => (
                <option key={dentista.id} value={dentista.id}>
                  {dentista.nome}{dentista.cro ? ` — ${dentista.cro}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" disabled={enviando || dentistas.length === 0}>
          {enviando ? 'Salvando...' : 'Cadastrar'}
        </button>
      </form>

      <div className="tabela-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>Telefone</th>
              <th>E-mail</th>
              <th>Dentista</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan="5">Nenhum cliente cadastrado.</td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.nome}</td>
                  <td>{cliente.cpf}</td>
                  <td>{cliente.telefone || '—'}</td>
                  <td>{cliente.email || '—'}</td>
                  <td>{cliente.dentista_nome || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

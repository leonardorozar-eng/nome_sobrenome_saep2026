import { useEffect, useState } from 'react'
import { requisicao } from '../api'

const formularioVazio = {
  data_agendamento: '',
  descricao: '',
  cliente_id: '',
  dentista_id: ''
}

function formatarData(valor) {
  if (!valor) return '—'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return String(valor)
  return data.toLocaleString('pt-BR')
}

function rotuloStatus(status) {
  if (!status) return 'Agendado'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export default function Agendamentos() {
  const [formulario, setFormulario] = useState(formularioVazio)
  const [clientes, setClientes] = useState([])
  const [dentistas, setDentistas] = useState([])
  const [agendamentos, setAgendamentos] = useState([])
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  function atualizar(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
  }

  async function carregar() {
    const [respostaClientes, respostaDentistas, respostaAgenda] = await Promise.all([
      requisicao('/clientes'),
      requisicao('/dentistas'),
      requisicao('/agendamentos')
    ])

    if (!respostaClientes.resposta.ok || !respostaDentistas.resposta.ok || !respostaAgenda.resposta.ok) {
      const falha = [respostaClientes, respostaDentistas, respostaAgenda].find((item) => !item.resposta.ok)
      setErro(falha?.dados?.message || 'Não foi possível carregar a agenda.')
    }

    setClientes(Array.isArray(respostaClientes.dados) ? respostaClientes.dados : [])
    setDentistas(Array.isArray(respostaDentistas.dados) ? respostaDentistas.dados : [])
    setAgendamentos(Array.isArray(respostaAgenda.dados) ? respostaAgenda.dados : [])
  }

  useEffect(() => {
    carregar()
  }, [])

  async function cadastrar(event) {
    event.preventDefault()
    setMensagem('')
    setErro('')
    setEnviando(true)

    const { resposta, dados } = await requisicao('/agendamentos', {
      method: 'POST',
      body: JSON.stringify({
        data_agendamento: formulario.data_agendamento,
        descricao: formulario.descricao,
        cliente_id: Number(formulario.cliente_id),
        dentista_id: Number(formulario.dentista_id)
      })
    })

    setEnviando(false)

    if (!resposta.ok) {
      setErro(dados.message || 'Não foi possível cadastrar o agendamento.')
      return
    }

    setMensagem(dados.message || 'Agendamento cadastrado com sucesso!')
    setFormulario(formularioVazio)
    carregar()
  }

  const formularioPronto = clientes.length > 0 && dentistas.length > 0

  return (
    <section>
      <h1>Agendamentos</h1>

      {mensagem && <p className="alerta-ok">{mensagem}</p>}
      {erro && <p className="alerta-erro" role="alert">{erro}</p>}

      <form className="cartao" onSubmit={cadastrar}>
        <h2>Novo agendamento</h2>
        <div className="grade">
          <div>
            <label htmlFor="data">Data e hora</label>
            <input
              id="data"
              type="datetime-local"
              value={formulario.data_agendamento}
              onChange={(event) => atualizar('data_agendamento', event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="cliente">Cliente</label>
            <select
              id="cliente"
              value={formulario.cliente_id}
              onChange={(event) => atualizar('cliente_id', event.target.value)}
              required
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dentista-agenda">Dentista</label>
            <select
              id="dentista-agenda"
              value={formulario.dentista_id}
              onChange={(event) => atualizar('dentista_id', event.target.value)}
              required
            >
              <option value="">Selecione um dentista</option>
              {dentistas.map((dentista) => (
                <option key={dentista.id} value={dentista.id}>{dentista.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="descricao">Descrição</label>
            <input
              id="descricao"
              value={formulario.descricao}
              onChange={(event) => atualizar('descricao', event.target.value)}
            />
          </div>
        </div>
        <button type="submit" disabled={enviando || !formularioPronto}>
          {enviando ? 'Salvando...' : 'Agendar'}
        </button>
      </form>

      <div className="tabela-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Status</th>
              <th>Descrição</th>
              <th>Cliente</th>
              <th>Dentista</th>
            </tr>
          </thead>
          <tbody>
            {agendamentos.length === 0 ? (
              <tr>
                <td colSpan="5">Nenhum agendamento cadastrado.</td>
              </tr>
            ) : (
              agendamentos.map((item) => (
                <tr key={item.id}>
                  <td>{formatarData(item.data_agendamento)}</td>
                  <td>{rotuloStatus(item.status)}</td>
                  <td>{item.descricao || '—'}</td>
                  <td>
                    <strong>{item.cliente?.nome}</strong>
                    <br />
                    CPF: {item.cliente?.cpf || '—'}
                    <br />
                    {item.cliente?.telefone || '—'}
                    <br />
                    {item.cliente?.email || '—'}
                  </td>
                  <td>
                    <strong>{item.dentista?.nome}</strong>
                    <br />
                    {item.dentista?.cro || '—'}
                    <br />
                    {item.dentista?.especialidade || '—'}
                    <br />
                    {item.dentista?.telefone || '—'}
                    <br />
                    {item.dentista?.email || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

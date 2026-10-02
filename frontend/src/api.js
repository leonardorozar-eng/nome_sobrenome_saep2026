export const URL = 'http://localhost:3000'

export function usuarioLogado() {
    try {
        return JSON.parse(localStorage.getItem('usuario') || 'null')
    } catch {
        return null
    }
}

function cabecalhos(temBody) {
    const headers = {}
    if (temBody) {
        headers['Content-Type'] = 'application/json'
    }
    const token = localStorage.getItem('token')
    if (token) {
        headers.Authorization = `Bearer ${token}`
    }
    return headers
}

export async function requisicao(caminho, opcoes = {}) {
    const { publico, ...fetchOpcoes } = opcoes
    let resposta
    try {
        resposta = await fetch(`${URL}${caminho}`, {
            ...fetchOpcoes,
            headers: cabecalhos(fetchOpcoes.body !== undefined)
        })
    } catch {
        return {
            resposta: { ok: false, status: 0 },
            dados: { message: 'Não foi possível conectar à API.' }
        }
    }

    const texto = await resposta.text()
    let dados = {}
    if (texto) {
        try {
            dados = JSON.parse(texto)
        } catch {
            dados = { message: texto }
        }
    }

    if (resposta.status === 401 && !publico) {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        if (window.location.pathname !== '/login') {
            window.location.href = '/login'
        }
    }

    return { resposta, dados }
}

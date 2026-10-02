import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { Pool } from 'pg'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import crypto from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const CHAVE_LGPD = process.env.CHAVE_LGPD
const IV_LGPD = process.env.IV_LGPD

const sql = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME
})

const servidor = Fastify()
const tokensRevogados = new Set()

function encriptarCPF(cpf) {
    const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        Buffer.from(CHAVE_LGPD),
        Buffer.from(IV_LGPD)
    )
    let encriptado = cipher.update(String(cpf), 'utf8', 'hex')
    encriptado += cipher.final('hex')
    return encriptado
}

function descriptografarCPF(cpfCriptografado) {
    try {
        const decipher = crypto.createDecipheriv(
            'aes-256-cbc',
            Buffer.from(CHAVE_LGPD),
            Buffer.from(IV_LGPD)
        )
        let decriptado = decipher.update(cpfCriptografado, 'hex', 'utf8')
        decriptado += decipher.final('utf8')
        return decriptado
    } catch {
        return cpfCriptografado
    }
}

function caminhoDaRota(url) {
    const semQuery = url.split('?')[0]
    if (semQuery.length > 1 && semQuery.endsWith('/')) {
        return semQuery.slice(0, -1)
    }
    return semQuery
}

function tokenBruto(request) {
    const header = request.headers.authorization || ''
    if (!header.startsWith('Bearer ')) return ''
    return header.slice(7).trim()
}

function texto(valor) {
    if (typeof valor !== 'string') return ''
    return valor.trim()
}

function textoOuNull(valor) {
    const limpo = texto(valor)
    return limpo === '' ? null : limpo
}

await servidor.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
})

await servidor.register(jwt, {
    secret: process.env.JWT_SECRET,
    sign: { expiresIn: '1h' }
})

servidor.addHook('onRequest', async (request, reply) => {
    if (request.method === 'OPTIONS') return

    const caminho = caminhoDaRota(request.url)
    if (caminho === '/login') return

    try {
        await request.jwtVerify()
    } catch {
        return reply.status(401).send({ message: 'Token ausente ou inválido.' })
    }

    const bruto = tokenBruto(request)
    const revogado = (request.user?.jti && tokensRevogados.has(request.user.jti)) || (bruto && tokensRevogados.has(bruto))
    if (revogado) {
        return reply.status(401).send({ message: 'Sessão encerrada. Faça login novamente.' })
    }
})

servidor.setErrorHandler((erro, request, reply) => {
    console.error(erro)
    reply.status(500).send({ message: 'Erro interno no servidor.' })
})

servidor.post('/login', async (request, reply) => {
    const body = request.body || {}
    const email = texto(body.email)
    const senha = typeof body.senha === 'string' ? body.senha : ''

    if (!email || !senha) {
        return reply.status(400).send({ message: 'E-mail e senha são obrigatórios!' })
    }

    const resultado = await sql.query(
        'SELECT id, nome, email, senha FROM usuario WHERE email = $1',
        [email]
    )

    if (resultado.rows.length === 0) {
        return reply.status(401).send({ message: 'Usuário ou senha inválidos!', login: false })
    }

    const usuario = resultado.rows[0]
    const senhaValida = await bcrypt.compare(senha, usuario.senha)

    if (!senhaValida) {
        return reply.status(401).send({ message: 'Usuário ou senha inválidos!', login: false })
    }

    const token = servidor.jwt.sign({
        id: usuario.id,
        email: usuario.email,
        jti: crypto.randomUUID()
    })

    return reply.status(200).send({
        message: 'Login realizado com sucesso!',
        login: true,
        token,
        usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email
        }
    })
})

servidor.post('/logout', async (request, reply) => {
    if (request.user?.jti) {
        tokensRevogados.add(request.user.jti)
    }

    const bruto = tokenBruto(request)
    if (bruto) {
        tokensRevogados.add(bruto)
    }

    return reply.status(200).send({ message: 'Sessão encerrada com sucesso.' })
})

servidor.post('/dentistas', async (request, reply) => {
    const body = request.body || {}
    const nome = texto(body.nome)

    if (!nome) {
        return reply.status(400).send({ message: 'O nome do dentista é obrigatório.' })
    }

    try {
        const resultado = await sql.query(
            `INSERT INTO dentista (nome, cro, especialidade, telefone, email)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, nome, cro, especialidade, telefone, email`,
            [
                nome,
                textoOuNull(body.cro),
                textoOuNull(body.especialidade),
                textoOuNull(body.telefone),
                textoOuNull(body.email)
            ]
        )

        return reply.status(201).send({
            message: 'Dentista cadastrado com sucesso!',
            dentista: resultado.rows[0]
        })
    } catch (erro) {
        if (erro.code === '23505') {
            return reply.status(400).send({ message: 'Já existe um dentista com este CRO.' })
        }
        throw erro
    }
})

servidor.get('/dentistas', async (request, reply) => {
    const termo = texto(request.query.termo)

    if (!termo) {
        const resultado = await sql.query(
            'SELECT id, nome, cro, especialidade, telefone, email FROM dentista ORDER BY nome ASC'
        )
        return resultado.rows
    }

    const resultado = await sql.query(
        `SELECT id, nome, cro, especialidade, telefone, email
         FROM dentista
         WHERE nome ILIKE $1 OR cro ILIKE $1 OR especialidade ILIKE $1
         ORDER BY nome ASC`,
        [`%${termo}%`]
    )

    return resultado.rows
})

servidor.post('/clientes', async (request, reply) => {
    const body = request.body || {}
    const nome = texto(body.nome)
    const cpf = texto(body.cpf)
    const dentistaId = Number(body.dentista_id)

    if (!nome || !cpf || !dentistaId) {
        return reply.status(400).send({ message: 'Nome, CPF e dentista são obrigatórios.' })
    }

    const dentista = await sql.query('SELECT id FROM dentista WHERE id = $1', [dentistaId])
    if (dentista.rows.length === 0) {
        return reply.status(400).send({ message: 'Dentista não encontrado.' })
    }

    const cpfCriptografado = encriptarCPF(cpf)

    const resultado = await sql.query(
        `INSERT INTO cliente (nome, cpf, telefone, email, dentista_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, nome, cpf, telefone, email, dentista_id`,
        [nome, cpfCriptografado, textoOuNull(body.telefone), textoOuNull(body.email), dentistaId]
    )

    const cliente = resultado.rows[0]
    cliente.cpf = descriptografarCPF(cliente.cpf)

    return reply.status(201).send({
        message: 'Cliente cadastrado com sucesso!',
        cliente
    })
})

servidor.get('/clientes', async (request, reply) => {
    const resultado = await sql.query(
        `SELECT
            c.id,
            c.nome,
            c.cpf,
            c.telefone,
            c.email,
            c.dentista_id,
            d.nome AS dentista_nome
         FROM cliente c
         INNER JOIN dentista d ON c.dentista_id = d.id
         ORDER BY c.nome ASC`
    )

    return resultado.rows.map((cliente) => ({
        ...cliente,
        cpf: descriptografarCPF(cliente.cpf)
    }))
})

servidor.post('/agendamentos', async (request, reply) => {
    const body = request.body || {}
    const dataAgendamento = texto(body.data_agendamento)
    const clienteId = Number(body.cliente_id)
    const dentistaId = Number(body.dentista_id)

    if (!dataAgendamento || !clienteId || !dentistaId) {
        return reply.status(400).send({
            message: 'Data, cliente e dentista são obrigatórios.'
        })
    }

    if (Number.isNaN(new Date(dataAgendamento).getTime())) {
        return reply.status(400).send({ message: 'Data do agendamento inválida.' })
    }

    const cliente = await sql.query('SELECT id FROM cliente WHERE id = $1', [clienteId])
    if (cliente.rows.length === 0) {
        return reply.status(400).send({ message: 'Cliente não encontrado.' })
    }

    const dentista = await sql.query('SELECT id FROM dentista WHERE id = $1', [dentistaId])
    if (dentista.rows.length === 0) {
        return reply.status(400).send({ message: 'Dentista não encontrado.' })
    }

    const resultado = await sql.query(
        `INSERT INTO agendamento (data_agendamento, descricao, cliente_id, dentista_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, data_agendamento, descricao, status, cliente_id, dentista_id`,
        [dataAgendamento, textoOuNull(body.descricao), clienteId, dentistaId]
    )

    return reply.status(201).send({
        message: 'Agendamento cadastrado com sucesso!',
        agendamento: resultado.rows[0]
    })
})

servidor.get('/agendamentos', async (request, reply) => {
    const resultado = await sql.query(
        `SELECT
            a.id,
            a.data_agendamento,
            a.descricao,
            a.status,
            a.cliente_id,
            a.dentista_id,
            c.nome AS cliente_nome,
            c.cpf AS cliente_cpf,
            c.telefone AS cliente_telefone,
            c.email AS cliente_email,
            c.dentista_id AS cliente_dentista_id,
            d.nome AS dentista_nome,
            d.cro AS dentista_cro,
            d.especialidade AS dentista_especialidade,
            d.telefone AS dentista_telefone,
            d.email AS dentista_email
         FROM agendamento a
         INNER JOIN cliente c ON a.cliente_id = c.id
         INNER JOIN dentista d ON a.dentista_id = d.id
         ORDER BY a.data_agendamento ASC`
    )

    return resultado.rows.map((linha) => ({
        id: linha.id,
        data_agendamento: linha.data_agendamento,
        descricao: linha.descricao,
        status: linha.status,
        cliente_id: linha.cliente_id,
        dentista_id: linha.dentista_id,
        cliente: {
            id: linha.cliente_id,
            nome: linha.cliente_nome,
            cpf: descriptografarCPF(linha.cliente_cpf),
            telefone: linha.cliente_telefone,
            email: linha.cliente_email,
            dentista_id: linha.cliente_dentista_id
        },
        dentista: {
            id: linha.dentista_id,
            nome: linha.dentista_nome,
            cro: linha.dentista_cro,
            especialidade: linha.dentista_especialidade,
            telefone: linha.dentista_telefone,
            email: linha.dentista_email
        }
    }))
})

const porta = Number(process.env.PORT) || 3000

try {
    await sql.query('SELECT 1')
    console.log('Conectado ao PostgreSQL.')
} catch (erro) {
    console.error('Não foi possível conectar ao PostgreSQL. Confira o .env e se o banco consultorio existe.')
    console.error(erro.message)
}

await servidor.listen({ port: porta })
console.log(`API rodando em http://localhost:${porta}`)

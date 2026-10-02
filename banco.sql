-- DER — consultório odontológico
-- Somente entidades fortes e relacionamento NÃO identificador.
-- Cada tabela tem a própria PRIMARY KEY (id). A chave estrangeira NÃO entra na PK.
-- Proibido PK composta e proibido relacionamento identificador (entidade fraca).
--
-- USUARIO (independente — só autenticação, sem FK)
--   id PK
--   nome, email, senha, criado_em
--
-- DENTISTA
--   id PK
--   nome, cro, especialidade, telefone, email
--        |
--        | 1
--        |<──── N   CLIENTE
--        |           id PK
--        |           nome, cpf, telefone, email
--        |           dentista_id FK → dentista.id   (não identificador)
--        |
--        | 1
--        |<──── N   AGENDAMENTO
--                    id PK
--                    data_agendamento, descricao, status
--                    dentista_id FK → dentista.id   (não identificador)
--                    cliente_id  FK → cliente.id    (não identificador)
--
-- CLIENTE 1 ——< N AGENDAMENTO
--
-- Senhas abaixo são hash bcrypt de "123456" (salt 10). Não estão em texto puro.
-- CPFs abaixo estão criptografados com AES-256-CBC, a mesma CHAVE_LGPD e o mesmo IV_LGPD do .env.

DROP TABLE IF EXISTS agendamento;
DROP TABLE IF EXISTS cliente;
DROP TABLE IF EXISTS dentista;
DROP TABLE IF EXISTS usuario;

CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dentista (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cro VARCHAR(50) UNIQUE,
    especialidade VARCHAR(100),
    telefone VARCHAR(20),
    email VARCHAR(255)
);

CREATE TABLE cliente (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255),
    dentista_id INTEGER NOT NULL REFERENCES dentista(id) ON DELETE CASCADE
);

CREATE TABLE agendamento (
    id SERIAL PRIMARY KEY,
    data_agendamento TIMESTAMP NOT NULL,
    descricao TEXT,
    status VARCHAR(50) DEFAULT 'agendado',
    cliente_id INTEGER NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    dentista_id INTEGER NOT NULL REFERENCES dentista(id) ON DELETE CASCADE
);

-- Usuários de teste. Senha de todos: 123456
INSERT INTO usuario (nome, email, senha) VALUES
('Ana Souza', 'ana@consultorio.com', '$2b$10$aTw2xX5b.JxSegCPIdaUbO8/OW/8oRE7Is3GhfaR3XR5taeb3J8R2'),
('Bruno Lima', 'bruno@consultorio.com', '$2b$10$EVJao31MDszbJTlb6AJxROWCnkzMeB4d1/3ZW39LSfX0SDqK0hKiS'),
('Carla Mendes', 'carla@consultorio.com', '$2b$10$6R5R4hD.KmpjjfQbxfwEOup8InxjncczDMcfWdW0GhCk5v6sJfXTm');

INSERT INTO dentista (nome, cro, especialidade, telefone, email) VALUES
('Helena Costa', 'CRO-SP 12345', 'Ortodontia', '(11) 98888-1001', 'helena.costa@consultorio.com'),
('Paulo Ribeiro', 'CRO-RJ 54321', 'Endodontia', '(21) 98888-2002', 'paulo.ribeiro@consultorio.com'),
('Marina Alves', 'CRO-MG 67890', 'Implantodontia', '(31) 98888-3003', 'marina.alves@consultorio.com');

-- CPF em texto, nesta ordem: 390.533.447-05 | 529.982.247-25 | 111.444.777-35
INSERT INTO cliente (nome, cpf, telefone, email, dentista_id) VALUES
('João Pereira', '3afcfdb789f3fcf9749a8f3a05b6568e', '(11) 97777-1001', 'joao.pereira@email.com', 1),
('Maria Oliveira', '6e859e54c4c9d2342de4628e28938eba', '(21) 97777-2002', 'maria.oliveira@email.com', 2),
('Pedro Santos', '60e0d88596c53df67edf5982d23f2b3c', '(31) 97777-3003', 'pedro.santos@email.com', 3);

INSERT INTO agendamento (data_agendamento, descricao, status, cliente_id, dentista_id) VALUES
('2026-10-05 09:00:00', 'Avaliação ortodôntica', 'agendado', 1, 1),
('2026-10-06 14:30:00', 'Tratamento de canal', 'agendado', 2, 2),
('2026-10-08 11:00:00', 'Consulta de implante', 'confirmado', 3, 3);

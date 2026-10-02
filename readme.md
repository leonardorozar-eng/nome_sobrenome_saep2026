Na pasta documentações tem as documentações das ferramentas. Não alterem nem apaguem essa pasta.

Extensões: Lembrem-se de verificar se a extensão REST Client está ativa no VS Code e salvem todos os arquivos nos locais corretos.

Antes de compactar o projeto no final da prova, você deve renomear a pasta principal do repositório seguindo estritamente este padrão:

# nome_sobrenome (Exemplo: marcos_coelho)

Apague as pastas `node_modules` (na raiz e em `frontend`) antes de zipar. Não envie `node_modules`.

## Consultório odontológico

Cadastro e gestão de dentistas, clientes e agendamentos, com login. O DER está no início de `banco.sql`: só entidades fortes e relacionamento não identificador (a FK não faz parte da PK).

### 1. Criar o banco

No pgAdmin ou no psql, conectado como `postgres`:

```sql
CREATE DATABASE consultorio;
```

Senha padrão desta prova: `senai` (veja o `.env`).

### 2. Rodar o SQL

Com o banco `consultorio` selecionado, execute o arquivo `banco.sql`.

Ele cria `usuario`, `dentista`, `cliente` e `agendamento` e insere 3 registros em cada tabela. As senhas já estão com hash bcrypt e os CPFs já estão criptografados com a chave e o IV do `.env`.

### 3. Subir a API

Na pasta raiz do projeto:

```bash
npm install
npm start
```

A API fica em `http://localhost:3000`. O script `start` usa `node --watch server.js`.

### 4. Subir o frontend

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`.

Login de teste (os três usuários usam a mesma senha):

- `ana@consultorio.com` / `123456`
- `bruno@consultorio.com` / `123456`
- `carla@consultorio.com` / `123456`

As rotas de dentistas, clientes e agendamentos exigem o token. Os testes manuais estão em `referencias.http` (REST Client), inclusive login que falha e busca com `termo`.

# Autenticação e Sessão

## Visão Geral

O sistema utiliza autenticação baseada em cookie de sessão com token hash.
Senhas são hashadas com `Bun.password.hash` (bcrypt/argon2).

## Fluxo de Autenticação

### Cadastro (Sign Up)

1. O usuário preenche o formulário de registro (frontend).
2. A rota `POST /master/auth/signup` é chamada.
3. O backend:
   - Verifica se o slug do tenant já existe.
   - Cria um novo banco SQLite para o tenant.
   - Executa as migrações no banco do tenant.
   - Insere o tenant no banco master.
   - Cria o usuário administrador com senha hashada.
   - Gera um token de sessão.
   - Retorna o token como cookie `session`.

### Login

1. O usuário envia email + senha para `POST /master/auth/login`.
2. O backend busca o usuário no banco master (join com tenant).
3. Verifica se o tenant está ativo e não foi deletado.
4. Verifica a senha com `verifyPassword`.
5. Gera um novo token de sessão (UUID duplo), hasheia com SHA-256.
6. Armazena o token hash na tabela `session`.
7. Retorna o token como cookie `session`.

### Validação de Sessão

O middleware `authPlugin` (em `utils/elysia.ts`) faz:

1. Extrai o cookie `session`.
2. Hasheia o token com SHA-256.
3. Busca na tabela `session` com join em `tenantUser` e `tenant`.
4. Verifica se o tenant está ativo e a sessão não expirou.
5. Injeta o objeto `auth` no contexto da rota com:
   - `userId`, `login`, `tenantId`, `tenantSlug`, `tenantName`

### Logout

`POST /master/auth/logout` — simplesmente remove o cookie `session`.

## Funções de Autenticação (backend/src/utils/auth.ts)

### `hashPassword(password: string): Promise<string>`
Hash da senha usando `Bun.password.hash`.

### `verifyPassword(password: string, hash: string): Promise<boolean>`
Verifica a senha contra o hash armazenado.

### `generateSessionToken(): string`
Gera um token de sessão aleatório (dois UUIDs concatenados).

### `hashToken(token: string): Promise<string>`
Aplica SHA-256 no token e retorna o hex digest.

## Esquema do Banco (Master)

### `tenant_users`
| Coluna    | Tipo   | Descrição                |
| --------- | ------ | ------------------------ |
| id        | text   | PK (UUID)                |
| tenant_id | text   | FK → tenant.id           |
| login     | text   | Email do usuário         |
| password  | text   | Hash da senha            |
| created_at/updated_at/deleted_at | text | Timestamps |

### `session`
| Coluna        | Tipo   | Descrição              |
| ------------- | ------ | ---------------------- |
| id            | text   | PK (UUID)              |
| tenant_user_id| text   | FK → tenant_users.id   |
| token_hash    | text   | SHA-256 do token       |
| expires_at    | text   | Data de expiração      |
| created_at    | text   | Data de criação        |

## Plugin de Autenticação (backend/src/utils/elysia.ts)

O `authPlugin` é um plugin Elysia reutilizável que:

1. Exige a presença do cookie `session` (validação com `t.Object`).
2. Deriva o objeto `auth` no escopo `"scoped"`.
3. Lança `AppError` com status 401 se o token for inválido ou ausente.

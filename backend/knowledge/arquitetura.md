# Arquitetura do Sistema

## Visão Geral

O Comercium é um sistema ERP monolítico com arquitetura multitenancy (múltiplos
inquilinos). Ele é construído com **Bun** como runtime, **Elysia** como framework
HTTP no backend e **TanStack Start (React)** no frontend.

Cada loja (tenant) possui seu próprio banco de dados SQLite isolado, enquanto um
banco central (master) gerencia os tenants e as credenciais de acesso.

## Estrutura de Diretórios

```
comercium/
├── backend/              # API Elysia + Drizzle ORM
│   ├── src/
│   │   ├── index.ts      # Ponto de entrada
│   │   ├── app.ts        # Configuração do servidor Elysia
│   │   ├── config/       # Utilitários de caminho
│   │   ├── db/           # Conexão com banco e bootstrap
│   │   ├── domain/       # Lógica de negócio (services)
│   │   ├── routes/       # Definição de rotas HTTP
│   │   └── utils/        # Utilitários (auth, errors, etc.)
│   ├── drizzle/          # Migrações SQL
│   └── scripts/          # Scripts auxiliares
├── frontend/             # TanStack Start + React
│   └── src/
│       ├── routes/       # Páginas e rotas do frontend
│       ├── components/   # Componentes React reutilizáveis
│       ├── hooks/        # Hooks React (React Query)
│       ├── lib/          # Cliente API, tipos, config
│       └── utils/        # Utilitários (formatação, auth)
└── data/                 # Bancos SQLite (gitignored)
```

## Multitenancy

O modelo de multitenancy é do tipo "banco isolado por inquilino":

- **Banco Master** (`data/master.sqlite`): armazena dados de todos os tenants
  (lojas) e seus usuários.
- **Banco do Tenant** (`data/tenants/{slug}.sqlite`): cada loja tem seu próprio
  banco com produtos, clientes, vendas, caixa e estoque.

## Pilha Tecnológica

| Camada    | Tecnologia                                   |
| --------- | -------------------------------------------- |
| Runtime   | Bun                                          |
| Backend   | Elysia + Drizzle ORM + bun:sqlite            |
| Frontend  | TanStack Start (React) + TanStack Router     |
| Consultas | React Query (TanStack Query)                 |
| Cliente   | Elysia Eden (treaty) para tipos end-to-end   |
| Estilo    | Tailwind CSS + shadcn/ui                     |
| Formulários | TanStack Form + Zod                        |

## Fluxo de Requisição

1. O frontend faz uma requisição HTTP para o backend (Elysia).
2. As rotas do grupo `/master` não exigem autenticação (exceto `/me`).
3. As rotas do grupo `/tenant` passam pelo plugin `authPlugin` que valida o
   cookie de sessão.
4. O `authPlugin` extrai o `tenantSlug` do usuário autenticado.
5. Cada serviço de domínio obtém a conexão correta via `getTenantDb(tenantSlug)`.
6. A conexão com o banco do tenant é armazenada em cache num Map para evitar
   abertura repetida de arquivos SQLite.

# Backend — Estrutura e Módulos

## Ponto de Entrada: `backend/src/index.ts`

Importa `createApp` de `app.ts`, lê as variáveis de ambiente `PORT` (padrão 3000)
e `CORS_ORIGIN` (padrão http://localhost:5173), e inicializa o servidor.

```ts
const app = createApp({ corsOrigin }).listen(port)
```

Exporta o tipo `App` para uso no frontend via Eden Treaty.

## Aplicação: `backend/src/app.ts`

Função `createApp({ corsOrigin })` que monta o servidor Elysia:

- **Error handler global**: trata `AppError`, erros de validação Elysia, NOT_FOUND
  e erros internos.
- **CORS**: configurado com `@elysiajs/cors`.
- **Grupo `/master`**: rotas de autenticação, tenants e onboarding.
- **Grupo `/tenant`**: rotas protegidas por `authPlugin` para produtos, vendas,
  clientes, caixa, pagamentos e estoque.
- **Rota raiz**: `GET /` → "Hello Elysia".

Exporta `App` como tipo para type-safety end-to-end.

## Config: `backend/src/config/paths.ts`

Funções utilitárias para resolver caminhos de diretórios e arquivos:

| Função              | Descrição                                   |
| ------------------- | ------------------------------------------- |
| `getDataDir()`      | Diretório de dados (`COMERCIUM_DATA_DIR` ou `./data`) |
| `getTenantsDir()`   | Subdiretório `tenants` dentro de data       |
| `getMasterDbPath()` | Caminho do banco master SQLite              |
| `getTenantDbPath(slug)` | Caminho do banco do tenant (valida slug) |
| `getTenantMigrationsDir()` | Diretório de migrações do tenant    |
| `getMasterMigrationsDir()` | Diretório de migrações do master     |

## Database: `backend/src/db/`

### `db.ts`

- Gerencia um `Map` de conexões de banco de dados dos tenants (cache).
- `getTenantDb(tenantSlug)`: obtém ou cria conexão Drizzle para o tenant.
- `db`: exporta a conexão Drizzle do banco master.
- Configura `PRAGMA foreign_keys = ON`.

### `bootstrap.ts`

- `ensureDataDirectories()`: cria diretórios `data/` e `data/tenants/`.
- `ensureMasterDatabase()`: garante que o banco master exista e executa
  migrações se o diretório de migrações existir.

## Utilitários: `backend/src/utils/`

### `errors.ts`

Classe `AppError` que estende `Error` com:
- `statusCode` (padrão 400)
- `code` (padrão "APP_ERROR")

Usada para erros de negócio com mensagens em português.

### `elysia.ts`

- `sessionCookie` → guard que exige cookie `session`.
- `authPlugin` → plugin de autenticação que deriva o objeto `auth` com dados do
  usuário logado.

### `drizzle.ts`

Campos reutilizáveis para schemas Drizzle:
- `timestamps()` → `createdAt`, `updatedAt`, `deletedAt`.
- `id()` → campo `id` com `generateUniqueString(24)`.
- `auditing()` → `createdByUserId`, `updatedByUserId`, `deletedByUserId`.

### `general.ts`

- `generateUniqueString(length)`: gera string aleatória alfanumérica.

## Domínios: `backend/src/domain/`

### Master
- `AuthService.ts` → signUp, login, validateSession.
- `AdminService.ts` → listTenants, deleteTenant.

### Tenant
- `cash/CashService.ts` → currentCash, getCashes, createCash, closeCash, createCashMovement.
- `client/ClientService.ts` → createClient, editClient, getClients, deleteClient.
- `payment/PaymentsService.ts` → createPayment.
- `products/ProductsService.ts` → createProduct, getProducts, getSingleProduct, updateProduct, deleteProduct.
- `sales/SalesService.ts` → getSales, currentSale, createSale, updateSaleClient, settleSale, addProductToSale, updateSaleItem, removeProductFromSale, reactivateProductFromSale.
- `stock/StockService.ts` → createStockMovement, createBulkStockMovements, getStockMovements, deleteStockMovements.

## Rotas: `backend/src/routes/`

### Master
- `auth.ts` → POST /signup, POST /login, GET /me, POST /logout.
- `onboarding.ts` → GET /status, POST /setup.
- `tenants.ts` → GET /, DELETE /:tenantId.

### Tenant
- `products.ts` → GET /, GET /:productId, POST /, PATCH /:productId, DELETE /:productId.
- `sales.ts` → GET /, GET /current, POST /new, POST /item/:productId, PATCH /sale-item/:saleItemId, DELETE /sale-item/:saleItemId, PATCH /sale-item/:saleItemId/reactivate, POST /settle/:saleId, PATCH /:id/client.
- `clients.ts` → GET /, POST /, PATCH /:clientId, DELETE /:clientId.
- `cash.ts` → GET /, GET /current, POST /, PATCH /:cashId/close, POST /movement/:cashId.
- `payments.ts` → POST /:saleId.
- `stock.ts` → GET /movements, POST /movements, DELETE /movements/:stockMovementId.

## Script: `backend/scripts/migrate-tenants.ts`

Aplica migrações Drizzle em todos os bancos de tenant existentes em
`data/tenants/`. Aceita `--fresh` para recriar os bancos.

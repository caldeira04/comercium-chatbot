# comercium-chatbot

Chatbot dedicado a servir como fonte primária de suporte ao Comercium, sistema ERP para gerenciamento de conveniências/varejo.
Utiliza RAG, embeddings e um banco "vetorial" construído em SQLite comum.

## Para instalar:

```bash
bun install
```

## Adicione suas chaves ao projeto

```bash
cd backend
cp .env.example .env
```

E adicione as chaves com seu editor de texto favorito:

```
*backend/.env*

OPENROUTER_API_KEY=
OPENROUTER_EMBEDDING_MODEL=
DB_FILE=
```

## Para executar:

```bash
bun dev
```

## Funcionamento:

Abra [http://localhost:5173](http://localhost:5173) (porta padrão) no navegador, e realize perguntas.

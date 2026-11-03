# Minimal API da Fórmula 1 — Node.js + TypeScript + Fastify

API REST minimalista sobre o mundo da Fórmula 1 (equipes e pilotos), construída com **Node.js**, **TypeScript** e **Fastify 5**. O projeto parte de um boilerplate e evolui para uma API organizada em camadas, com CORS, validação por JSON Schema, paginação, documentação OpenAPI, tratamento de erros, health check e testes automatizados.

## Sumário

- [Funcionalidades](#funcionalidades)
- [Endpoints](#endpoints)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Como executar](#como-executar)
- [Testes](#testes)
- [Build de produção](#build-de-produção)
- [Scripts disponíveis](#scripts-disponíveis)
- [Decisões de projeto](#decisões-de-projeto)
- [Licença](#licença)

## Funcionalidades

- **Listar equipes** (paginado) e **detalhar** uma equipe por id.
- **Listar pilotos** (paginado), com **filtro por equipe** via query string.
- **Detalhar** um piloto por id.
- **Validação por JSON Schema** na entrada (params/query) e serialização rápida na saída.
- **Documentação OpenAPI** gerada automaticamente (`/docs/json`).
- **CORS** liberado para consumo a partir de qualquer origem.
- **Health check** para monitoramento.
- Erros padronizados com **status codes** apropriados (`400`, `404`, `500`).

## Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/health` | Verificação de saúde (status + uptime). |
| `GET` | `/docs/json` | Especificação OpenAPI da API. |
| `GET` | `/teams` | Lista as equipes (paginado). |
| `GET` | `/teams/:id` | Detalha uma equipe. |
| `GET` | `/drivers` | Lista os pilotos (paginado, filtro opcional `?team=`). |
| `GET` | `/drivers/:id` | Detalha um piloto. |

As listagens aceitam os parâmetros de paginação `?page=` (padrão `1`) e `?limit=` (padrão `10`, máximo `100`).

### Exemplos

```bash
curl "http://localhost:3333/teams?page=2&limit=3"
curl http://localhost:3333/teams/4
curl "http://localhost:3333/drivers?team=Ferrari"
curl http://localhost:3333/drivers/1
curl http://localhost:3333/docs/json
```

```json
// GET /teams?page=2&limit=3
{
  "data": [
    { "id": 4, "name": "Ferrari", "base": "Maranello, Italy" },
    { "id": 5, "name": "Alpine", "base": "Enstone, United Kingdom" },
    { "id": 6, "name": "Aston Martin", "base": "Silverstone, United Kingdom" }
  ],
  "meta": { "page": 2, "limit": 3, "total": 10, "totalPages": 4 }
}

// GET /teams/abc  (400 — validação de schema)
{ "statusCode": 400, "code": "FST_ERR_VALIDATION", "error": "Bad Request", "message": "params/id must be integer" }

// GET /drivers/999  (404)
{ "message": "Piloto com id 999 nao encontrado." }
```

### Documentação OpenAPI

A especificação é gerada a partir dos schemas das rotas e exposta em `GET /docs/json`. Você pode importá-la no [Swagger Editor](https://editor.swagger.io/), no Postman ou no Insomnia para explorar e testar a API.

## Arquitetura

O projeto separa responsabilidades em camadas, mantendo o `app.ts` (construção da aplicação) independente do `server.ts` (inicialização). Essa divisão permite testar via `app.inject` sem abrir uma porta de rede.

```
Requisição HTTP
      │
      ▼
   Fastify (app.ts) ──► Routes (plugins) ──► Service ──► Data
   CORS, OpenAPI,        /teams, /drivers      regra de    (mock)
   health, schemas,      (+ JSON Schema)       negócio +
   error handler                               paginação
```

Estrutura de pastas:

```
src/
├── server.ts                 # Sobe o servidor (listen) e trata sinais (graceful shutdown)
├── app.ts                    # Monta o Fastify: CORS, OpenAPI, health, rotas e error handler
├── routes/
│   ├── team-routes.ts        # Rotas de equipes (plugin Fastify + schemas)
│   └── driver-routes.ts      # Rotas de pilotos (plugin Fastify + schemas)
├── services/
│   ├── team-service.ts       # Regra de negócio de equipes
│   └── driver-service.ts     # Regra de negócio de pilotos (filtro, busca)
├── schemas/
│   └── common-schemas.ts     # JSON Schemas reutilizáveis (validação/serialização/OpenAPI)
├── utils/
│   └── paginate.ts           # Helper de paginação (data + meta)
├── data/
│   └── f1-data.ts            # Dados mock de equipes e pilotos
├── domain/
│   └── models.ts             # Modelos de domínio (Team, Driver)
├── errors/
│   └── app-error.ts          # Erro de aplicação com status HTTP
└── app.test.ts               # Testes da API (via app.inject)
```

## Tecnologias

- **Node.js** — runtime.
- **TypeScript** — tipagem estática.
- **Fastify 5** — framework web rápido e com baixo overhead.
- **@fastify/cors** — plugin de CORS.
- **@fastify/swagger** — geração da especificação OpenAPI a partir dos schemas.
- **node:test** — runner de testes nativo.
- **tsx** — executa TypeScript em desenvolvimento.
- **tsup** — empacota o projeto para produção.

## Como executar

Pré-requisitos: **Node.js 20+** e **npm 10+**.

```bash
# Instale as dependências
npm install

# Modo desenvolvimento (lê a porta do .env)
npm run start:dev

# Com reload automático a cada alteração
npm run start:watch
```

A API sobe em `http://localhost:3333`. A porta é configurável pelo arquivo `.env` (`PORT`).

## Testes

```bash
npm test
```

Os testes usam o runner nativo (`node:test`) junto com `app.inject` do Fastify, exercitando cada endpoint (incluindo filtro e os casos de 404) sem abrir uma porta.

## Build de produção

```bash
npm run dist        # compila para dist/
npm run start:dist  # compila e executa dist/server.js
```

## Scripts disponíveis

| Script | Descrição |
| --- | --- |
| `npm run start:dev` | Sobe a API em desenvolvimento. |
| `npm run start:watch` | Sobe a API com reload automático. |
| `npm run dist` | Compila o projeto para `dist/`. |
| `npm run start:dist` | Compila e executa a versão de produção. |
| `npm test` | Roda a suíte de testes. |
| `npm run typecheck` | Verifica os tipos sem gerar saída. |

## Decisões de projeto

- **`app.ts` separado do `server.ts`:** a aplicação é construída independentemente do `listen`, o que torna os testes rápidos e determinísticos via `app.inject`.
- **Rotas como plugins:** cada recurso (`teams`, `drivers`) é um plugin Fastify, mantendo o roteamento modular e coeso.
- **JSON Schema nas rotas:** o Fastify valida a entrada (params/query) e serializa a saída a partir dos schemas, que também alimentam a especificação OpenAPI. Validação e documentação saem da mesma fonte.
- **Regra de negócio nos services:** as rotas apenas traduzem HTTP; a busca, o filtro e a paginação ficam nos services, que lançam `AppError` quando um recurso não existe.
- **Paginação com envelope:** as listagens retornam `{ data, meta }`, separando os itens dos metadados de paginação — um contrato previsível para o cliente.
- **Tratamento de erro centralizado:** um `errorHandler` global converte `AppError` no status correto, trata erros de validação como `400` e qualquer erro inesperado como `500` sem vazar detalhes.
- **OpenAPI sem servir estáticos:** uso o `@fastify/swagger` para gerar a spec e a exponho como JSON em `/docs/json`, evitando a UI que serve arquivos estáticos — o que mantém o runtime livre de dependências vulneráveis. A spec pode ser aberta em qualquer visualizador OpenAPI.

## Licença

Distribuído sob a licença MIT.

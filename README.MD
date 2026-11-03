<div align="center">

# 🏎️ Minimal API da Fórmula 1

**API REST de equipes e pilotos da F1, construída com Node.js, TypeScript e Fastify 5.**

![Node.js](https://img.shields.io/badge/Node.js-%3E=20-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-5.x-000000?logo=fastify&logoColor=white)
![Tests](https://img.shields.io/badge/tests-12%20passing-success)
![License](https://img.shields.io/badge/license-MIT-blue)

</div>

Uma API enxuta, porém completa: organizada em camadas, com validação por JSON Schema, paginação, documentação OpenAPI gerada automaticamente, tratamento de erros padronizado, health check e uma suíte de testes rodando no runner nativo do Node. O projeto parte de um boilerplate e evolui para uma referência de como estruturar uma API Fastify bem feita.

## Sumário

- [Começando em 30 segundos](#começando-em-30-segundos)
- [Funcionalidades](#funcionalidades)
- [Endpoints](#endpoints)
- [Paginação](#paginação)
- [Respostas de erro](#respostas-de-erro)
- [Documentação OpenAPI](#documentação-openapi)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Como executar](#como-executar)
- [Testes](#testes)
- [Build de produção](#build-de-produção)
- [Scripts disponíveis](#scripts-disponíveis)
- [Decisões de projeto](#decisões-de-projeto)
- [Créditos](#créditos)
- [Licença](#licença)

## Começando em 30 segundos

```bash
npm install
cp .env.example .env     # define a porta (padrão 3333)
npm run start:dev
```

Com a API no ar, experimente:

```bash
curl http://localhost:3333/health
curl "http://localhost:3333/drivers?team=Ferrari"
```

## Funcionalidades

- 📋 **Listagem paginada** de equipes e pilotos.
- 🔎 **Filtro de pilotos por equipe** via query string.
- 🧾 **Detalhe por id** de equipes e pilotos.
- ✅ **Validação por JSON Schema** na entrada e serialização rápida na saída.
- 📖 **Documentação OpenAPI** gerada automaticamente em `/docs/json`.
- 🌐 **CORS** liberado para consumo a partir de qualquer origem.
- ❤️ **Health check** para monitoramento.
- 🧯 **Erros padronizados** com status codes apropriados (`400`, `404`, `500`).
- 🧪 **Testes automatizados** (12) com `node:test` + `app.inject`.

## Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/health` | Verificação de saúde (status + uptime). |
| `GET` | `/docs/json` | Especificação OpenAPI da API. |
| `GET` | `/teams` | Lista as equipes (paginado). |
| `GET` | `/teams/:id` | Detalha uma equipe. |
| `GET` | `/drivers` | Lista os pilotos (paginado, filtro opcional `?team=`). |
| `GET` | `/drivers/:id` | Detalha um piloto. |

### Exemplos

```bash
curl "http://localhost:3333/teams?page=2&limit=3"
curl http://localhost:3333/teams/4
curl "http://localhost:3333/drivers?team=Ferrari"
curl http://localhost:3333/drivers/1
```

```jsonc
// GET /drivers?team=Ferrari
{
  "data": [
    { "id": 2, "name": "Lewis Hamilton", "team": "Ferrari" },
    { "id": 4, "name": "Charles Leclerc", "team": "Ferrari" }
  ],
  "meta": { "page": 1, "limit": 10, "total": 2, "totalPages": 1 }
}
```

## Paginação

As listagens (`/teams` e `/drivers`) retornam um envelope `{ data, meta }` e aceitam os seguintes parâmetros de query:

| Parâmetro | Tipo | Padrão | Limites | Descrição |
| --- | --- | --- | --- | --- |
| `page` | inteiro | `1` | `>= 1` | Página solicitada (1-based). |
| `limit` | inteiro | `10` | `1` a `100` | Itens por página. |
| `team` | string | — | — | (apenas `/drivers`) Filtra pelo nome da equipe. |

O objeto `meta` traz `page`, `limit`, `total` (total de itens) e `totalPages` (total de páginas).

```jsonc
// GET /teams?page=2&limit=3
{
  "data": [
    { "id": 4, "name": "Ferrari", "base": "Maranello, Italy" },
    { "id": 5, "name": "Alpine", "base": "Enstone, United Kingdom" },
    { "id": 6, "name": "Aston Martin", "base": "Silverstone, United Kingdom" }
  ],
  "meta": { "page": 2, "limit": 3, "total": 10, "totalPages": 4 }
}
```

## Respostas de erro

| Situação | Status | Corpo |
| --- | --- | --- |
| Parâmetro inválido (ex.: id não numérico) | `400` | `{ "statusCode": 400, "code": "FST_ERR_VALIDATION", "error": "Bad Request", "message": "params/id must be integer" }` |
| Recurso não encontrado | `404` | `{ "message": "Piloto com id 999 nao encontrado." }` |
| Rota inexistente | `404` | `{ "message": "Rota nao encontrada: GET /xyz" }` |
| Erro inesperado | `500` | `{ "message": "Erro interno do servidor." }` |

A validação de `400` é feita automaticamente pelo Fastify a partir dos JSON Schemas das rotas; os demais erros passam por um handler centralizado.

## Documentação OpenAPI

A especificação é gerada a partir dos schemas das rotas e exposta em `GET /docs/json`. Importe-a no [Swagger Editor](https://editor.swagger.io/), no Postman ou no Insomnia para explorar e testar a API visualmente, ou use-a para gerar clients.

## Arquitetura

O projeto separa responsabilidades em camadas e mantém o `app.ts` (construção da aplicação) independente do `server.ts` (inicialização). Essa divisão permite testar via `app.inject` sem abrir uma porta de rede.

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

| Categoria | Ferramenta |
| --- | --- |
| Runtime | Node.js (>= 20) |
| Linguagem | TypeScript |
| Framework web | Fastify 5 |
| CORS | @fastify/cors |
| Documentação | @fastify/swagger (OpenAPI) |
| Testes | node:test + app.inject |
| Dev / build | tsx, tsup |

## Como executar

Pré-requisitos: **Node.js 20+** e **npm 10+**.

```bash
# Instale as dependências
npm install

# Crie o .env a partir do exemplo (define a porta)
cp .env.example .env

# Modo desenvolvimento
npm run start:dev

# Com reload automático a cada alteração
npm run start:watch
```

A API sobe em `http://localhost:3333`. A porta é configurável pelo arquivo `.env` (`PORT`).

## Testes

```bash
npm test
```

Os testes usam o runner nativo (`node:test`) junto com `app.inject` do Fastify, exercitando cada endpoint — incluindo paginação, filtro, validação de entrada (`400`) e os casos de `404` — sem abrir uma porta de rede.

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

## Créditos

Projeto construído a partir de um boilerplate Node.js + TypeScript e evoluído com arquitetura em camadas, validação, paginação, documentação e testes.

## Licença

Distribuído sob a licença [MIT](https://opensource.org/licenses/MIT).

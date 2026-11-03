import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { FastifyInstance } from "fastify";
import { buildApp } from "./app.js";
import { Driver, Team } from "./domain/models.js";
import { PaginationMeta } from "./utils/paginate.js";

/**
 * Testes da API usando `app.inject`, a forma idiomatica de testar
 * Fastify: exercita as rotas sem abrir uma porta de rede.
 */
describe("Formula 1 API", () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildApp();
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  it("GET /health retorna 200 com status ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().status, "ok");
  });

  it("GET /docs/json expoe a especificacao OpenAPI", async () => {
    const res = await app.inject({ method: "GET", url: "/docs/json" });
    assert.equal(res.statusCode, 200);
    const spec = res.json() as { openapi: string; paths: Record<string, unknown> };
    assert.ok(spec.openapi.startsWith("3."));
    assert.ok(spec.paths["/teams"]);
    assert.ok(spec.paths["/drivers"]);
  });

  it("GET /teams retorna lista paginada com metadados", async () => {
    const res = await app.inject({ method: "GET", url: "/teams" });
    assert.equal(res.statusCode, 200);
    const body = res.json() as { data: Team[]; meta: PaginationMeta };
    assert.ok(body.data.length > 0);
    assert.equal(body.meta.page, 1);
    assert.ok(body.meta.total >= body.data.length);
  });

  it("GET /teams?page=2&limit=3 pagina corretamente", async () => {
    const res = await app.inject({ method: "GET", url: "/teams?page=2&limit=3" });
    assert.equal(res.statusCode, 200);
    const body = res.json() as { data: Team[]; meta: PaginationMeta };
    assert.equal(body.meta.page, 2);
    assert.equal(body.meta.limit, 3);
    assert.ok(body.data.length <= 3);
  });

  it("GET /teams/:id retorna a equipe existente", async () => {
    const res = await app.inject({ method: "GET", url: "/teams/4" });
    assert.equal(res.statusCode, 200);
    const body = res.json() as { team: Team };
    assert.equal(body.team.name, "Ferrari");
  });

  it("GET /teams/:id retorna 404 para equipe inexistente", async () => {
    const res = await app.inject({ method: "GET", url: "/teams/999" });
    assert.equal(res.statusCode, 404);
  });

  it("GET /teams/:id retorna 400 para id invalido", async () => {
    const res = await app.inject({ method: "GET", url: "/teams/abc" });
    assert.equal(res.statusCode, 400);
  });

  it("GET /drivers retorna lista paginada", async () => {
    const res = await app.inject({ method: "GET", url: "/drivers" });
    assert.equal(res.statusCode, 200);
    const body = res.json() as { data: Driver[]; meta: PaginationMeta };
    assert.ok(body.data.length > 0);
  });

  it("GET /drivers?team=Ferrari filtra por equipe", async () => {
    const res = await app.inject({ method: "GET", url: "/drivers?team=Ferrari" });
    assert.equal(res.statusCode, 200);
    const body = res.json() as { data: Driver[]; meta: PaginationMeta };
    assert.ok(body.data.length > 0);
    assert.ok(body.data.every((d) => d.team === "Ferrari"));
  });

  it("GET /drivers/:id retorna o piloto existente", async () => {
    const res = await app.inject({ method: "GET", url: "/drivers/1" });
    assert.equal(res.statusCode, 200);
    const body = res.json() as { driver: Driver };
    assert.equal(body.driver.name, "Max Verstappen");
  });

  it("GET /drivers/:id retorna 404 para piloto inexistente", async () => {
    const res = await app.inject({ method: "GET", url: "/drivers/999" });
    assert.equal(res.statusCode, 404);
  });

  it("rota desconhecida retorna 404", async () => {
    const res = await app.inject({ method: "GET", url: "/nao-existe" });
    assert.equal(res.statusCode, 404);
  });
});

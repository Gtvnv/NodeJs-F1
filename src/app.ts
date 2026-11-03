import fastify, { FastifyError, FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import { teamRoutes } from "./routes/team-routes.js";
import { driverRoutes } from "./routes/driver-routes.js";
import { AppError } from "./errors/app-error.js";

/**
 * Monta a aplicacao Fastify com CORS, OpenAPI, health check, rotas e
 * tratamento de erros. Separar a construcao (build) da inicializacao
 * (listen) permite testar via `app.inject` sem abrir uma porta de rede.
 */
export async function buildApp(
  options: { logger?: boolean } = {}
): Promise<FastifyInstance> {
  const app = fastify({ logger: options.logger ?? false });

  await app.register(cors, { origin: "*" });

  // Especificacao OpenAPI (gerada a partir dos schemas das rotas)
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Formula 1 API",
        description: "Minimal API da Formula 1 com Node.js, TypeScript e Fastify.",
        version: "1.0.0",
      },
      tags: [
        { name: "teams", description: "Equipes da Formula 1" },
        { name: "drivers", description: "Pilotos da Formula 1" },
      ],
    },
  });

  // Health check
  app.get(
    "/health",
    {
      schema: {
        tags: ["health"],
        summary: "Verificacao de saude da aplicacao",
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              uptime: { type: "number" },
            },
          },
        },
      },
    },
    async () => ({ status: "ok", uptime: process.uptime() })
  );

  // Especificacao OpenAPI em JSON (para importar no Swagger Editor, Postman, etc.)
  app.get("/docs/json", async () => app.swagger());

  // Rotas de dominio (registradas como plugins)
  await app.register(teamRoutes);
  await app.register(driverRoutes);

  // Tratamento centralizado de erros
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({ message: error.message });
    }

    // Erros de validacao do Fastify (schema) trazem a propriedade validation
    if (error.validation) {
      return reply.code(400).send({ message: error.message });
    }

    app.log.error(error);
    return reply.code(500).send({ message: "Erro interno do servidor." });
  });

  // Resposta padrao para rotas inexistentes
  app.setNotFoundHandler((request, reply) => {
    reply
      .code(404)
      .send({ message: `Rota nao encontrada: ${request.method} ${request.url}` });
  });

  return app;
}

import { FastifyInstance } from "fastify";
import { teamService } from "../services/team-service.js";
import {
  idParamSchema,
  paginationQuerySchema,
  paginationMetaSchema,
  teamSchema,
  errorResponseSchema,
} from "../schemas/common-schemas.js";

interface IdParam {
  id: number;
}

interface ListQuery {
  page: number;
  limit: number;
}

/**
 * Rotas de equipes (plugin Fastify).
 *
 * GET /teams       -> lista paginada de equipes
 * GET /teams/:id   -> detalha uma equipe
 */
export async function teamRoutes(server: FastifyInstance): Promise<void> {
  server.get<{ Querystring: ListQuery }>(
    "/teams",
    {
      schema: {
        tags: ["teams"],
        summary: "Lista as equipes (paginado)",
        querystring: {
          type: "object",
          properties: paginationQuerySchema,
        },
        response: {
          200: {
            type: "object",
            properties: {
              data: { type: "array", items: teamSchema },
              meta: paginationMetaSchema,
            },
          },
        },
      },
    },
    async (request) => {
      const { page, limit } = request.query;
      return teamService.list(page, limit);
    }
  );

  server.get<{ Params: IdParam }>(
    "/teams/:id",
    {
      schema: {
        tags: ["teams"],
        summary: "Detalha uma equipe pelo id",
        params: idParamSchema,
        response: {
          200: {
            type: "object",
            properties: { team: teamSchema },
          },
          404: errorResponseSchema,
        },
      },
    },
    async (request) => {
      return { team: teamService.getById(request.params.id) };
    }
  );
}

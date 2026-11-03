import { FastifyInstance } from "fastify";
import { driverService } from "../services/driver-service.js";
import {
  idParamSchema,
  paginationQuerySchema,
  paginationMetaSchema,
  driverSchema,
  errorResponseSchema,
} from "../schemas/common-schemas.js";

interface IdParam {
  id: number;
}

interface DriverQuery {
  page: number;
  limit: number;
  team?: string;
}

/**
 * Rotas de pilotos (plugin Fastify).
 *
 * GET /drivers         -> lista paginada (filtro opcional ?team=)
 * GET /drivers/:id     -> detalha um piloto
 */
export async function driverRoutes(server: FastifyInstance): Promise<void> {
  server.get<{ Querystring: DriverQuery }>(
    "/drivers",
    {
      schema: {
        tags: ["drivers"],
        summary: "Lista os pilotos (paginado, filtro por equipe)",
        querystring: {
          type: "object",
          properties: {
            ...paginationQuerySchema,
            team: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              data: { type: "array", items: driverSchema },
              meta: paginationMetaSchema,
            },
          },
        },
      },
    },
    async (request) => {
      const { page, limit, team } = request.query;
      return driverService.list(page, limit, team);
    }
  );

  server.get<{ Params: IdParam }>(
    "/drivers/:id",
    {
      schema: {
        tags: ["drivers"],
        summary: "Detalha um piloto pelo id",
        params: idParamSchema,
        response: {
          200: {
            type: "object",
            properties: { driver: driverSchema },
          },
          404: errorResponseSchema,
        },
      },
    },
    async (request) => {
      return { driver: driverService.getById(request.params.id) };
    }
  );
}

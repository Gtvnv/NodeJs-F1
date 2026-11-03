/**
 * Schemas reutilizaveis (JSON Schema) usados nas rotas.
 *
 * O Fastify usa estes schemas para validar a entrada (params/query)
 * e para serializar a saida de forma rapida, alem de alimentar a
 * especificacao OpenAPI gerada pelo @fastify/swagger.
 */

export const idParamSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "integer", minimum: 1 },
  },
} as const;

export const paginationQuerySchema = {
  page: { type: "integer", minimum: 1, default: 1 },
  limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
} as const;

export const errorResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
} as const;

export const teamSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    base: { type: "string" },
  },
} as const;

export const driverSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    team: { type: "string" },
  },
} as const;

/** Envelope de resposta paginada. */
export const paginationMetaSchema = {
  type: "object",
  properties: {
    page: { type: "integer" },
    limit: { type: "integer" },
    total: { type: "integer" },
    totalPages: { type: "integer" },
  },
} as const;

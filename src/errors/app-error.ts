/**
 * Erro de aplicacao com status HTTP associado.
 * Permite que o service sinalize a intencao de resposta sem conhecer
 * detalhes do Fastify. O handler de erro traduz para a resposta HTTP.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

import { drivers } from "../data/f1-data.js";
import { Driver } from "../domain/models.js";
import { AppError } from "../errors/app-error.js";
import { paginate, Paginated } from "../utils/paginate.js";

/**
 * Regra de negocio dos pilotos.
 */
export const driverService = {
  /**
   * Lista os pilotos de forma paginada, opcionalmente filtrando por equipe.
   * O filtro por equipe e case-insensitive e ignora espacos nas bordas.
   */
  list(page: number, limit: number, teamFilter?: string): Paginated<Driver> {
    let result = drivers;

    if (teamFilter && teamFilter.trim().length > 0) {
      const normalized = teamFilter.trim().toLowerCase();
      result = drivers.filter((d) => d.team.toLowerCase() === normalized);
    }

    return paginate(result, page, limit);
  },

  /**
   * Busca um piloto pelo id.
   * @throws {AppError} 404 quando o piloto nao existe.
   */
  getById(id: number): Driver {
    const driver = drivers.find((d) => d.id === id);
    if (!driver) {
      throw new AppError(`Piloto com id ${id} nao encontrado.`, 404);
    }
    return driver;
  },
};

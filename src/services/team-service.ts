import { teams } from "../data/f1-data.js";
import { Team } from "../domain/models.js";
import { AppError } from "../errors/app-error.js";
import { paginate, Paginated } from "../utils/paginate.js";

/**
 * Regra de negocio das equipes.
 */
export const teamService = {
  /** Lista as equipes de forma paginada. */
  list(page: number, limit: number): Paginated<Team> {
    return paginate(teams, page, limit);
  },

  /**
   * Busca uma equipe pelo id.
   * @throws {AppError} 404 quando a equipe nao existe.
   */
  getById(id: number): Team {
    const team = teams.find((t) => t.id === id);
    if (!team) {
      throw new AppError(`Equipe com id ${id} nao encontrada.`, 404);
    }
    return team;
  },
};

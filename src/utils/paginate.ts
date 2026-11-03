/**
 * Metadados de uma resposta paginada.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Resultado paginado generico: os itens da pagina mais os metadados.
 */
export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Recorta uma lista em uma pagina e calcula os metadados.
 *
 * @param items lista completa de itens
 * @param page pagina solicitada (1-based)
 * @param limit itens por pagina
 */
export function paginate<T>(items: T[], page: number, limit: number): Paginated<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);

  return {
    data,
    meta: { page, limit, total, totalPages },
  };
}

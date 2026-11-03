/**
 * Modelos de dominio da API da Formula 1.
 */

export interface Team {
  id: number;
  name: string;
  base: string;
}

export interface Driver {
  id: number;
  name: string;
  team: string;
}

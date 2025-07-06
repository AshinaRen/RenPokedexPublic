export interface Options {
  limit?: number;
  offset?: number;
}

export interface PokemonList {
  count:    number;
  next:     string | null;
  previous: string | null;
  results:  PokeResult[];
}

export interface PokeResult {
  name: string;
  url:  string;
}

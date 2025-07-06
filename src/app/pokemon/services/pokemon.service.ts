import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { PokeAbility } from '@pokemon/interfaces/pokemon-ability-details.interface';
import { PokeByType } from '@pokemon/interfaces/pokemon-by-type.interface';
import { Pokemon } from '@pokemon/interfaces/pokemon-details.interface';
import { PokemonList, Options } from '@pokemon/interfaces/pokemon-list.interface';
import { PokeMoveDetails } from '@pokemon/interfaces/pokemon-move-details.interface';
import { PokemonSpecies } from '@pokemon/interfaces/pokemon-species.interface';
import { catchError, delay, filter, forkJoin, from, map, mergeMap, Observable, of, switchMap, tap, toArray } from 'rxjs';

/**
 * Servicio para interactuar con la API de Pokémon (PokéAPI).
 * Proporciona métodos para obtener listas de Pokémon, detalles de Pokémon, tipos, movimientos, habilidades y especies.
 * Implementa cachés para optimizar el rendimiento y reducir solicitudes HTTP repetidas.
 */
@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private http = inject(HttpClient); // Cliente HTTP para realizar solicitudes a la API
  private baseUrl = environment.baseUrl; // URL base de la API desde el entorno

  // Caches para almacenar datos y evitar solicitudes repetidas
  private listCache = new Map<string, PokemonList>(); // Caché para listas de Pokémon
  private detailCache = new Map<string, (Pokemon & { sprite: string; type: string })[]>(); // Caché para listas detalladas de Pokémon
  private typePokemonCache = new Map<string, { name: string; sprite: string }[]>(); // Caché para Pokémon por tipo
  private movePokemonCache = new Map<string, { name: string; sprite: string }[]>(); // Caché para Pokémon por movimiento
  private abilityPokemonCache = new Map<string, { name: string; sprite: string }[]>(); // Caché para Pokémon por habilidad

  private totalCount = 0; // Contador total de Pokémon en la API

  /**
   * Obtiene una lista paginada de Pokémon o recursos de un tipo específico.
   * @param options Opciones de paginación (limit, offset).
   * @param listType Tipo de recurso a obtener (e.g., 'pokemon', 'type').
   * @returns Observable con la lista de recursos.
   */
  getPokemonList(options: Options, listType: string): Observable<PokemonList> {
    const { limit = 20, offset = 0 } = options;
    const key = `${listType}-${limit}-${offset}`; // Clave única para el caché

    // Retorna datos del caché si existen
    if (this.listCache.has(key)) {
      return of(this.listCache.get(key)!);
    }

    // Realiza solicitud HTTP y almacena en caché
    return this.http.get<PokemonList>(`${this.baseUrl}/${listType}`, {
      params: { limit, offset }
    }).pipe(
      tap(resp => {
        this.totalCount = resp.count; // Actualiza el contador total
        this.listCache.set(key, resp); // Guarda en caché
      })
    );
  }

  /**
   * Obtiene una lista completa de recursos de un tipo específico sin paginación.
   * @param tipo Tipo de recurso (e.g., 'pokemon', 'type').
   * @returns Observable con la lista de recursos.
   */
  getList(tipo: string): Observable<PokemonList> {
    return this.http.get<PokemonList>(`${this.baseUrl}/${tipo}`);
  }

  /**
   * Obtiene una lista detallada de Pokémon con sprite y tipo principal.
   * @param options Opciones de paginación (limit, offset).
   * @returns Observable con una lista de Pokémon detallados.
   */
  getPokemonDetailedList(options: Options): Observable<(Pokemon & { sprite: string; type: string })[]> {
    const { limit = 20, offset = 0 } = options;
    const key = `pokemon-${limit}-${offset}`; // Clave para el caché

    // Retorna datos del caché si existen
    if (this.detailCache.has(key)) {
      return of(this.detailCache.get(key)!);
    }

    // Obtiene la lista y luego los detalles de cada Pokémon
    return this.getPokemonList(options, 'pokemon').pipe(
      switchMap((list) =>
        from(list.results).pipe(
          mergeMap(
            poke => this.http.get<Pokemon>(poke.url).pipe(
              map(pokemon => ({
                ...pokemon,
                sprite: pokemon.sprites.other?.home?.front_default ?? pokemon.sprites.front_default ?? '',
                type: pokemon.types[0]!.type.name
              })),
            ),
            2 // Límite de concurrencia
          ),
          toArray() // Convierte los resultados en un array
        )
      ),
      tap(pokemonList => this.detailCache.set(key, pokemonList)) // Guarda en caché
    );
  }

  /**
   * Obtiene los detalles de un Pokémon por su ID numérico.
   * @param id ID del Pokémon.
   * @returns Observable con los detalles del Pokémon.
   */
  getPokemonDetailsById(id: number): Observable<Pokemon> {
    const cacheKey = `pokemon-${id}`;

    // Retorna datos del caché si existen
    if (this.detailCache.has(cacheKey)) {
      return of(this.detailCache.get(cacheKey)! as unknown as Pokemon);
    }

    // Realiza solicitud HTTP y almacena en caché
    return this.http.get<Pokemon>(`${this.baseUrl}/pokemon/${id}`).pipe(
      tap(pokemon => this.detailCache.set(cacheKey, pokemon as any))
    );
  }

  /**
   * Obtiene el conteo total de Pokémon en la API.
   * @returns Número total de Pokémon.
   */
  getTotalCount(): number {
    return this.totalCount;
  }

  // Caches específicos para detalles por ID
  private detailByIdCache = new Map<number | string, Pokemon>(); // Caché para Pokémon por ID
  private detailSpByIdCache = new Map<number | string, PokemonSpecies>(); // Caché para especies
  private typeByIdCache = new Map<string, PokeByType>(); // Caché para tipos
  private moveByIdCache = new Map<string, PokeMoveDetails>(); // Caché para movimientos
  private abilityByIdCache = new Map<string, PokeAbility>(); // Caché para habilidades

  /**
   * Obtiene los detalles de un Pokémon por su ID o nombre.
   * @param id ID o nombre del Pokémon.
   * @returns Observable con los detalles del Pokémon.
   */
  getPokemonById(id: number | string): Observable<Pokemon> {
    if (this.detailByIdCache.has(id)) {
      return of(this.detailByIdCache.get(id)!);
    }

    return this.http.get<Pokemon>(`${this.baseUrl}/pokemon/${id}`).pipe(
      delay(300), // Retraso opcional para simular latencia
      tap(pokemon => this.detailByIdCache.set(id, pokemon))
    );
  }

  /**
   * Obtiene los detalles de un tipo por su ID o nombre.
   * @param id ID o nombre del tipo.
   * @returns Observable con los detalles del tipo.
   */
  getTypeById(id: string): Observable<PokeByType> {
    if (this.typeByIdCache.has(id)) {
      return of(this.typeByIdCache.get(id)!);
    }

    return this.http.get<PokeByType>(`${this.baseUrl}/type/${id}`).pipe(
      tap(type => this.typeByIdCache.set(id, type))
    );
  }

  /**
   * Obtiene los detalles de un movimiento por su ID o nombre.
   * @param id ID o nombre del movimiento.
   * @returns Observable con los detalles del movimiento.
   */
  getMoveById(id: string): Observable<PokeMoveDetails> {
    if (this.moveByIdCache.has(id)) {
      return of(this.moveByIdCache.get(id)!);
    }

    return this.http.get<PokeMoveDetails>(`${this.baseUrl}/move/${id}`).pipe(
      tap(move => this.moveByIdCache.set(id, move))
    );
  }

  /**
   * Obtiene los detalles de una habilidad por su ID o nombre.
   * @param id ID o nombre de la habilidad.
   * @returns Observable con los detalles de la habilidad.
   */
  getAbilityById(id: string): Observable<PokeAbility> {
    if (this.abilityByIdCache.has(id)) {
      return of(this.abilityByIdCache.get(id)!);
    }

    return this.http.get<PokeAbility>(`${this.baseUrl}/ability/${id}`).pipe(
      tap(ability => this.abilityByIdCache.set(id, ability))
    );
  }

  /**
   * Obtiene los detalles de una especie de Pokémon por su ID o nombre.
   * @param id ID o nombre de la especie.
   * @returns Observable con los detalles de la especie.
   */
  getPokemonSpeciesById(id: number | string): Observable<PokemonSpecies> {
    if (this.detailSpByIdCache.has(id)) {
      return of(this.detailSpByIdCache.get(id)!);
    }

    return this.http.get<PokemonSpecies>(`${this.baseUrl}/pokemon-species/${id}`).pipe(
      delay(300), // Retraso opcional
      tap(pokemon => this.detailSpByIdCache.set(id, pokemon))
    );
  }

  /**
   * Busca Pokémon por nombre o ID.
   * @param term Término de búsqueda (nombre o ID).
   * @returns Observable con una lista de Pokémon que coinciden con el término.
   */
  searchPokemon(term: string): Observable<(Pokemon & { sprite: string; type: string })[]> {
    if (!term) {
      return this.getPokemonDetailedList({ limit: this.totalCount, offset: 0 });
    }

    const isId = !isNaN(Number(term));
    if (isId) {
      return this.getPokemonById(Number(term)).pipe(
        map((pokemon) => [
          {
            ...pokemon,
            sprite: pokemon.sprites.other?.home?.front_default || pokemon.sprites.front_default || '',
            type: pokemon.types[0]?.type.name || '',
          },
        ])
      );
    }

    return this.getPokemonList({ limit: this.totalCount, offset: 0 }, 'pokemon').pipe(
      switchMap((list) =>
        from(list.results).pipe(
          filter((poke) => poke.name.toLowerCase().includes(term.toLowerCase())),
          mergeMap(
            (poke) =>
              this.http.get<Pokemon>(poke.url).pipe(
                map((pokemon) => ({
                  ...pokemon,
                  sprite: pokemon.sprites.other?.home?.front_default || pokemon.sprites.front_default || '',
                  type: pokemon.types[0]?.type.name || '',
                }))
              ),
            2 // Límite de concurrencia
          ),
          toArray()
        )
      ),
      tap((pokemonList) => this.detailCache.set(`search-${term}`, pokemonList))
    );
  }

  /**
   * Obtiene detalles (nombre y sprite) de Pokémon asociados a un tipo.
   * @param typeId ID o nombre del tipo.
   * @param pokemonList Lista de Pokémon asociados al tipo.
   * @param page Página actual para la clave del caché.
   * @returns Observable con una lista de objetos { name: string; sprite: string }.
   */
  getPokemonDetailsForType(typeId: string, pokemonList: { pokemon: { name: string; url: string } }[], page: number): Observable<{ name: string; sprite: string }[]> {
    const pokemonNames = pokemonList.map(p => p.pokemon.name).sort().join('-');
    const cacheKey = `type-pokemon-${typeId}-page-${page}-${pokemonNames}`;

    if (this.typePokemonCache.has(cacheKey)) {
      return of(this.typePokemonCache.get(cacheKey)!);
    }

    const placeholder = 'assets/images/substitute.png';

    const requests = pokemonList.map(poke =>
      this.getPokemonById(poke.pokemon.name).pipe(
        map(pokemon => ({
          name: pokemon.name,
          sprite: pokemon.sprites.other?.home?.front_default || pokemon.sprites.front_default || placeholder
        })),
        catchError(() => of({ name: poke.pokemon.name, sprite: '' }))
      )
    );

    return forkJoin(requests).pipe(
      tap(details => this.typePokemonCache.set(cacheKey, details))
    );
  }

  /**
   * Obtiene detalles (nombre y sprite) de Pokémon que aprenden un movimiento.
   * @param moveId ID o nombre del movimiento.
   * @param pokemonList Lista de Pokémon que aprenden el movimiento.
   * @param page Página actual para la clave del caché.
   * @returns Observable con una lista de objetos { name: string; sprite: string }.
   */
  getPokemonDetailsForMove(moveId: string, pokemonList: { name: string; url: string }[], page: number): Observable<{ name: string; sprite: string }[]> {
    const pokemonNames = pokemonList.map(p => p.name).sort().join('-');
    const cacheKey = `move-pokemon-${moveId}-page-${page}-${pokemonNames}`;

    if (this.movePokemonCache.has(cacheKey)) {
      return of(this.movePokemonCache.get(cacheKey)!);
    }

    const placeholder = 'assets/images/substitute.png';

    const requests = pokemonList.map(poke =>
      this.getPokemonById(poke.name).pipe(
        map(pokemon => ({
          name: pokemon.name,
          sprite: pokemon.sprites.other?.home?.front_default || pokemon.sprites.front_default || placeholder
        })),
        catchError(() => of({ name: poke.name, sprite: '' }))
      )
    );

    return forkJoin(requests).pipe(
      tap(details => this.movePokemonCache.set(cacheKey, details))
    );
  }

  /**
   * Obtiene detalles (nombre y sprite) de Pokémon con una habilidad específica.
   * @param abilityId ID o nombre de la habilidad.
   * @param pokemonList Lista de Pokémon con la habilidad.
   * @param page Página actual para la clave del caché.
   * @returns Observable con una lista de objetos { name: string; sprite: string }.
   */
  getPokemonDetailsForAbility(abilityId: string, pokemonList: { name: string; url: string }[], page: number): Observable<{ name: string; sprite: string }[]> {
    const pokemonNames = pokemonList.map(p => p.name).sort().join('-');
    const cacheKey = `ability-pokemon-${abilityId}-page-${page}-${pokemonNames}`;

    if (this.abilityPokemonCache.has(cacheKey)) {
      return of(this.abilityPokemonCache.get(cacheKey)!);
    }

    const placeholder = 'assets/images/substitute.png';

    const requests = pokemonList.map(poke =>
      this.getPokemonById(poke.name).pipe(
        map(pokemon => ({
          name: pokemon.name,
          sprite: pokemon.sprites.other?.home?.front_default || pokemon.sprites.front_default || placeholder
        })),
        catchError(() => of({ name: poke.name, sprite: '' }))
      )
    );

    return forkJoin(requests).pipe(
      tap(details => this.abilityPokemonCache.set(cacheKey, details))
    );
  }
}

import { Component, inject, computed, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { PokemonService } from '@pokemon/services/pokemon.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { PokeCardComponent } from '../poke-card/poke-card.component';
import { TitleComponent } from '@shared/components/title/title.component';
import { SearchComponent } from '@shared/components/search/search.component';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
/**
 * Componente `PokemonListComponent`.
 *
 * Muestra una lista paginada de Pokémon, con soporte para búsqueda por nombre.
 * Utiliza recursos reactivos (`rxResource`), señales (`signals`), y servicios compartidos
 * para manejar paginación y obtención de datos.
 */
@Component({
  selector: 'pokemon-list',
  standalone: true,
  imports: [
    PaginationComponent,
    PokeCardComponent,
    TitleComponent,
    SearchComponent,
    RouterLink
  ],
  templateUrl: './pokemon-list.component.html',
})
export class PokemonListComponent {
  /** Servicio para obtener datos de Pokémon desde la API. */
  pokemonService = inject(PokemonService);

  /** Servicio para gestionar la paginación (página actual, reseteo, etc.). */
  paginationService = inject(PaginationService);

  /** Cantidad de Pokémon a mostrar por página. */
  limit = signal(24);

  /** Término de búsqueda introducido por el usuario. */
  searchTerm = signal<string>('');

  /**
   * Recurso reactivo que se encarga de cargar los Pokémon.
   * Si hay un término de búsqueda, filtra por nombre y aplica paginación manual.
   * Si no hay búsqueda, obtiene una página completa desde el servicio.
   */
  pokemonResource = rxResource({
    request: () => ({
      page: this.paginationService.currentPage() - 1,
      search: this.searchTerm(),
      limit: this.limit(),
    }),

    loader: ({ request }) => {
      const offset = request.page * request.limit;

      // Si hay término de búsqueda, se realiza filtrado y paginación en el cliente
      if (request.search) {
        return this.pokemonService.searchPokemon(request.search).pipe(
          map(results => {
            const sortedResults = results.sort((a, b) => a.id - b.id);
            const start = offset;
            const end = start + request.limit;
            return {
              results: sortedResults.slice(start, end),  // Paginación cliente
              count: sortedResults.length,               // Total de resultados encontrados
            };
          })
        );
      }

      // Si no hay búsqueda, se pide la lista detallada directamente desde el backend
      return this.pokemonService.getPokemonDetailedList({
        limit: request.limit,
        offset: offset,
      }).pipe(
        map(results => ({
          results: results.sort((a, b) => a.id - b.id),
          count: this.pokemonService.getTotalCount(), // Total general para paginación
        }))
      );
    },
  });

  /** Valor actual del recurso `pokemonResource`, contiene los Pokémon mostrados. */
  poke = this.pokemonResource.value();

  /**
   * Cálculo del total de páginas necesarias para la paginación.
   * Usa el número total de resultados y el límite por página.
   */
  totalPages = computed(() => {
    const count = this.pokemonResource.value()?.count || this.pokemonService.getTotalCount();
    return Math.max(1, Math.ceil(count / this.limit()));
  });

  /**
   * Maneja el evento de búsqueda desde el componente hijo `SearchComponent`.
   * Actualiza el término de búsqueda, reinicia la página actual y recarga los datos.
   *
   * @param term El término de búsqueda introducido por el usuario.
   */
  onSearch(term: string) {
    console.log('Received search term:', term);
    this.searchTerm.set(term.trim().toLowerCase());
    this.paginationService.resetPage();
    this.pokemonResource.reload();
  }
}

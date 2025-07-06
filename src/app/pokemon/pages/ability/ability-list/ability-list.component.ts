import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReplacePipe } from '@pokemon/pipes/replace.pipe';
import { PokemonService } from '@pokemon/services/pokemon.service';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { SearchComponent } from '@shared/components/search/search.component';
import { TitleComponent } from '@shared/components/title/title.component';
import { map } from 'rxjs';

/**
 * @component
 * @selector ability-list
 * @standalone true
 * @imports [RouterLink, SearchComponent, PaginationComponent, TitleCasePipe, ReplacePipe, TitleComponent]
 * @templateUrl ./ability-list.component.html
 *
 * @description
 * Componente standalone que muestra una lista paginada de habilidades de Pokémon con soporte para búsqueda.
 * Utiliza señales reactivas y recursos para manejar datos asíncronos, permitiendo filtrar habilidades por
 * nombre y paginar los resultados tanto en el servidor como en el cliente (cuando se aplica una búsqueda).
 */
@Component({
  selector: 'ability-list',
  imports: [RouterLink, SearchComponent, PaginationComponent, TitleCasePipe, ReplacePipe, TitleComponent],
  templateUrl: './ability-list.component.html',
  standalone: true,
})
export class AbilityListComponent {
  /**
   * @public
   * @description
   * Servicio que proporciona métodos para obtener datos de habilidades desde la API.
   */
  pokemonService = inject(PokemonService);

  /**
   * @public
   * @description
   * Servicio que gestiona el estado de la paginación, como la página actual.
   */
  paginationService = inject(PaginationService);

  /**
   * @public
   * @description
   * Servicio de Angular Router para acceder a los parámetros de la URL, como el límite y el offset.
   */
  activatedRoute = inject(ActivatedRoute);

  /**
   * @public
   * @description
   * Señal que almacena el término de búsqueda introducido por el usuario.
   * Inicialmente es una cadena vacía.
   */
  searchTerm = signal<string>('');

  /**
   * @public
   * @description
   * Señal computada que calcula las opciones de paginación (límite y offset) basándose
   * en los parámetros de la URL y la página actual del servicio de paginación.
   * Por defecto, el límite es 48 elementos por página.
   */
  paginationOptions = computed(() => ({
    limit: Number(this.activatedRoute.snapshot.queryParamMap.get('limit')) || 48,
    offset:
      ((this.paginationService.currentPage() - 1) *
        (Number(this.activatedRoute.snapshot.queryParamMap.get('limit')) || 48)) ||
      0,
  }));

  /**
   * @public
   * @description
   * Recurso reactivo que carga la lista de habilidades desde el servicio `PokemonService`.
   * Si hay un término de búsqueda, obtiene todas las habilidades y filtra/pagina los resultados
   * en el cliente. Sin búsqueda, solicita datos paginados directamente desde la API.
   */
  abilityResource = rxResource({
    request: () => ({
      options: this.paginationOptions(),
      search: this.searchTerm(),
    }),
    loader: ({ request }) => {
      const { options, search } = request;
      if (search) {
        // Fetch all abilities and filter by search term
        return this.pokemonService
          .getPokemonList({ limit: this.pokemonService.getTotalCount() || 1000, offset: 0 }, 'ability')
          .pipe(
            map((list) => {
              const filteredResults = list.results.filter((ability) =>
                ability.name.toLowerCase().includes(search.toLowerCase())
              );
              // Apply client-side pagination
              const start = options.offset;
              const end = start + options.limit;
              return {
                ...list,
                count: filteredResults.length, // Update count to filtered results
                results: filteredResults.slice(start, end), // Paginate filtered results
              };
            })
          );
      }
      // Fetch paginated abilities from API
      return this.pokemonService.getPokemonList(options, 'ability');
    },
  });

  /**
   * @public
   * @description
   * Señal computada que calcula el número total de páginas basado en el conteo de habilidades
   * y el límite de elementos por página.
   */
  totalPages = computed(() => {
    const count = this.abilityResource.value()?.count || 0;
    const limit = this.paginationOptions().limit || 48;
    return Math.ceil(count / limit);
  });

  /**
   * @public
   * @method onSearch
   * @param term - Término de búsqueda introducido por el usuario.
   * @description
   * Maneja el evento de búsqueda desde el componente `SearchComponent`. Actualiza el término
   * de búsqueda, reinicia la paginación a la primera página y recarga el recurso de habilidades.
   */
  onSearch(term: string) {
    this.searchTerm.set(term.trim().toLowerCase());
    this.paginationService.resetPage();
    this.abilityResource.reload();
  }
}

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
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';

/**
 * @component
 * @selector move-list
 * @standalone true
 * @imports [RouterLink, SearchComponent, PaginationComponent, TitleCasePipe, ReplacePipe, TitleComponent]
 * @templateUrl ./move-list.component.html
 *
 * @description
 * Componente standalone que muestra una lista paginada de movimientos de Pokémon con soporte para búsqueda
 * y enriquecimiento de datos con información de tipo. Utiliza señales reactivas y recursos para manejar
 * datos asíncronos, permitiendo filtrar movimientos por nombre y paginar los resultados tanto en el
 * servidor como en el cliente (cuando se aplica una búsqueda). Cada movimiento incluye su tipo asociado,
 * obtenido mediante solicitudes adicionales a la API.
 */
@Component({
  selector: 'move-list',
  imports: [RouterLink, SearchComponent, PaginationComponent, TitleCasePipe, ReplacePipe, TitleComponent],
  templateUrl: './move-list.component.html',
})
export class MoveListComponent {
  /**
   * @public
   * @description
   * Servicio que proporciona métodos para obtener datos de movimientos desde la API.
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
   * Recurso reactivo que carga la lista de movimientos desde el servicio `PokemonService` y enriquece
   * los resultados con información de tipo. Si hay un término de búsqueda, obtiene todos los movimientos
   * y filtra/pagina los resultados en el cliente. Sin búsqueda, solicita datos paginados directamente
   * desde la API. Los resultados incluyen el nombre del tipo de cada movimiento.
   */
  moveResource = rxResource({
    request: () => ({
      options: this.paginationOptions(),
      search: this.searchTerm(),
    }),
    loader: ({ request }) => {
      const { options, search } = request;
      if (search) {
        // Fetch all moves and filter by search term
        return this.pokemonService
          .getPokemonList({ limit: this.pokemonService.getTotalCount() || 1000, offset: 0 }, 'move')
          .pipe(
            map((list) => {
              const filteredResults = list.results.filter((move) =>
                move.name.toLowerCase().includes(search.toLowerCase())
              );
              // Apply client-side pagination
              const start = options.offset;
              const end = start + options.limit;
              return {
                ...list,
                count: filteredResults.length,
                results: filteredResults.slice(start, end),
              };
            }),
            this.fetchMoveDetails()
          );
      }
      // Fetch paginated moves from API
      return this.pokemonService.getPokemonList(options, 'move').pipe(this.fetchMoveDetails());
    },
  });

  /**
   * @public
   * @description
   * Señal computada que calcula el número total de páginas basado en el conteo de movimientos
   * y el límite de elementos por página.
   */
  totalPages = computed(() => {
    const count = this.moveResource.value()?.count || 0;
    const limit = this.paginationOptions().limit || 48;
    return Math.ceil(count / limit);
  });

  /**
   * @public
   * @method onSearch
   * @param term - Término de búsqueda introducido por el usuario.
   * @description
   * Maneja el evento de búsqueda desde el componente `SearchComponent`. Actualiza el término
   * de búsqueda, reinicia la paginación a la primera página y recarga el recurso de movimientos.
   */
  onSearch(term: string) {
    this.searchTerm.set(term.trim().toLowerCase());
    this.paginationService.resetPage(); // Reset to page 1 on search
    this.moveResource.reload();
  }

  /**
   * @private
   * @method fetchMoveDetails
   * @description
   * Operador RxJS que enriquece la lista de movimientos con información de tipo. Realiza solicitudes
   * individuales a la API para cada movimiento, extrayendo el nombre del tipo. Maneja errores
   * asignando un tipo 'unknown' si la solicitud falla. Utiliza `forkJoin` para combinar los resultados
   * de las solicitudes paralelas.
   * @returns Operador que transforma el observable de entrada en un observable con los movimientos
   * enriquecidos.
   */
  private fetchMoveDetails() {
    return (source: Observable<{ results: any[]; count: number }>) =>
      source.pipe(
        switchMap((list) => {
          if (!list.results.length) {
            return of({ ...list, results: [] });
          }
          const detailRequests = list.results.map((move) =>
            this.pokemonService.getMoveById(move.name).pipe(
              map((details) => ({
                ...move,
                type: details.type.name, // Extract type name
              })),
              catchError(() => of({ ...move, type: 'unknown' })) // Fallback if API fails
            )
          );
          return forkJoin(detailRequests).pipe(
            map((results) => ({
              ...list,
              results,
            }))
          );
        })
      );
  }

  /**
   * @public
   * @method getTypeImage
   * @param type - Nombre del tipo de movimiento.
   * @returns URL de la imagen asociada al tipo.
   * @description
   * Genera la URL de la imagen correspondiente al tipo de movimiento, utilizando una carpeta
   * predefinida (`assets/images/badge-types/`) y el nombre del tipo en minúsculas.
   */
  getTypeImage(type: string): string {
    const typeLower = type.toLowerCase();
    return `assets/images/badge-types/${type.toLowerCase()}.png`;
  }
}

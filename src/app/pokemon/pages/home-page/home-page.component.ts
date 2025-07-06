import { Component, inject, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { PokemonService } from '@pokemon/services/pokemon.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { PokemonDetailsComponent } from '../pokemon/pokemon-details/pokemon-details.component';
import { PokeCardComponent } from '../pokemon/poke-card/poke-card.component';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@pokemon/auth/services/auth.service';

/**
 * @component
 * @selector app-home-page
 * @standalone true
 * @imports [RouterLink, RouterLinkActive]
 * @templateUrl ./home-page.component.html
 * @styleUrl home-page.component.scss
 *
 * @description
 * Componente standalone que representa la página principal de la aplicación. Muestra una lista
 * paginada de Pokémon utilizando un recurso reactivo para cargar datos detallados desde la API.
 * Integra paginación para navegar por la lista de Pokémon, mostrando un número fijo de elementos
 * por página.
 */
@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './home-page.component.html',
  styleUrl: 'home-page.component.scss'
})
export class HomePageComponent {

  /**
   * @public
   * @description
   * Servicio que proporciona métodos para obtener datos detallados de Pokémon desde la API.
   */
  pokemonService = inject(PokemonService);


  /**
   * @public
   * @description
   * Servicio que proporciona métodos de autenticación.
   */
  authService = inject(AuthService);

  /**
   * @public
   * @description
   * Servicio que gestiona el estado de la paginación, como la página actual.
   */
  paginationService = inject(PaginationService);

  /**
   * @public
   * @readonly
   * @description
   * Número fijo de Pokémon a mostrar por página en la lista paginada.
   */
  readonly limit = 20;

  /**
   * @public
   * @description
   * Recurso reactivo que carga una lista detallada de Pokémon desde el servicio `PokemonService`.
   * Utiliza la página actual del servicio de paginación para calcular el offset y obtener los datos
   * correspondientes.
   */
  pokemonResource = rxResource({
    request: () => ({
      page: this.paginationService.currentPage() - 1
    }),
    loader: ({ request }) => {
      return this.pokemonService.getPokemonDetailedList({
        limit: this.limit,
        offset: request.page * this.limit
      });
    }
  });

  /**
   * @public
   * @description
   * Señal computada que calcula el número total de páginas basado en el conteo total de Pokémon
   * proporcionado por el servicio `PokemonService` y el límite de elementos por página.
   */
  totalPages = computed(() => {
    const count = this.pokemonService.getTotalCount(); // Debes exponer `count` en el servicio
    return Math.ceil(count / this.limit);
  });
}

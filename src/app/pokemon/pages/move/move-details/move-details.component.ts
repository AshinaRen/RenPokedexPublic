import { Component, computed, inject, ResourceRef, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PokeMoveDetails } from '@pokemon/interfaces/pokemon-move-details.interface';
import { PokemonService } from '@pokemon/services/pokemon.service';
import { catchError, of } from 'rxjs';
import { TitleCasePipe, NgIf, NgFor } from '@angular/common';
import { ReplacePipe } from '@pokemon/pipes/replace.pipe';
import { TitleComponent } from '@shared/components/title/title.component';
import { FormsModule } from '@angular/forms';

/**
 * @component
 * @selector move-details
 * @standalone true
 * @imports [TitleComponent, ReplacePipe, TitleCasePipe, RouterLink, FormsModule]
 * @templateUrl ./move-details.component.html
 *
 * @description
 * Componente standalone que muestra los detalles de un movimiento de Pokémon, incluyendo su descripción,
 * textos de sabor por generación y una lista paginada de Pokémon que pueden aprender dicho movimiento.
 * Utiliza señales y recursos reactivos para manejar datos asíncronos y actualizaciones dinámicas.
 */
@Component({
  selector: 'move-details',
  standalone: true,
  imports: [TitleComponent, ReplacePipe, TitleCasePipe, RouterLink, FormsModule],
  templateUrl: './move-details.component.html',
})
export class MoveDetailsComponent {
  /**
   * @private
   * @description
   * Servicio de Angular Router para obtener parámetros de la URL.
   */
  private route = inject(ActivatedRoute);

  /**
   * @private
   * @description
   * Servicio que proporciona métodos para obtener datos de movimientos y Pokémon desde la API.
   */
  private pokemonService = inject(PokemonService);

  /**
   * @public
   * @description
   * Identificador del movimiento extraído de los parámetros de la URL.
   */
  moveID = String(this.route.snapshot.paramMap.get('id'));

  /**
   * @public
   * @description
   * Recurso reactivo que carga los detalles del movimiento desde el servicio `PokemonService`.
   * Maneja errores retornando `undefined` en caso de fallo.
   */
  moveResource: ResourceRef<PokeMoveDetails | undefined> = rxResource({
    request: () => ({ id: this.moveID }),
    loader: ({ request }) =>
      this.pokemonService.getMoveById(request.id).pipe(
        catchError((error) => {
          console.error('Error fetching Move:', error);
          return of(undefined);
        })
      ),
  });

  /**
   * @public
   * @description
   * Señal computada que contiene los datos del movimiento obtenidos del recurso `moveResource`.
   */
  pokeMove = computed(() => this.moveResource.value());

  /**
   * @public
   * @description
   * Número de elementos por página para la paginación de Pokémon.
   */
  itemsPerPage = 24;

  /**
   * @public
   * @description
   * Señal que almacena la página actual de la paginación de Pokémon.
   */
  currentPokemonPage = signal(0);

  /**
   * @public
   * @description
   * Señal computada que calcula el número total de páginas basado en la cantidad de Pokémon
   * que pueden aprender el movimiento y el número de elementos por página.
   */
  totalPokemonPages = computed(() =>
    Math.ceil((this.pokeMove()?.learned_by_pokemon.length || 0) / this.itemsPerPage)
  );

  /**
   * @public
   * @description
   * Señal computada que devuelve la lista de Pokémon paginada para la página actual.
   * Extrae los Pokémon que pueden aprender el movimiento desde `pokeMove`.
   */
  paginatedPokemon = computed(() => {
    const start = this.currentPokemonPage() * this.itemsPerPage;
    return this.pokeMove()?.learned_by_pokemon.slice(start, start + this.itemsPerPage) || [];
  });

  /**
   * @public
   * @description
   * Recurso reactivo que carga los detalles (nombre y sprite) de los Pokémon paginados.
   * Si no hay Pokémon en la lista, retorna un arreglo vacío. Maneja errores retornando
   * un arreglo con nombres y sprites vacíos.
   */
  pokemonDetailsResource = rxResource<
    { name: string; sprite: string }[],
    { pokemonList: { name: string; url: string }[]; moveId: string; page: number }
  >({
    request: () => ({
      pokemonList: this.paginatedPokemon(),
      moveId: this.moveID,
      page: this.currentPokemonPage(),
    }),
    loader: ({ request }) => {
      if (!request.pokemonList.length) return of([]);
      return this.pokemonService.getPokemonDetailsForMove(request.moveId, request.pokemonList, request.page).pipe(
        catchError((error) => {
          console.error('Error fetching Pokémon details:', error);
          return of(request.pokemonList.map((poke) => ({ name: poke.name, sprite: '' })));
        })
      );
    },
  });

  /**
   * @public
   * @description
   * Señal computada que contiene los detalles paginados de los Pokémon obtenidos
   * del recurso `pokemonDetailsResource`.
   */
  paginatedPokemonDetails = computed(() => this.pokemonDetailsResource.value() || []);

  /**
   * @public
   * @description
   * Señal que almacena la generación seleccionada para mostrar el texto de sabor.
   * Valor por defecto: 'gold-silver'.
   */
  selectedGeneration = signal('gold-silver');

  /**
   * @public
   * @description
   * Señal computada que devuelve un arreglo de generaciones disponibles para los textos
   * de sabor en inglés asociados al movimiento.
   */
  availableGenerations = computed(() => {
    const generations = new Set(
      this.pokeMove()?.flavor_text_entries
        .filter((flavor) => flavor.language.name === 'en')
        .map((flavor) => flavor.version_group.name) || []
    );
    return Array.from(generations);
  });

  /**
   * @public
   * @description
   * Señal computada que devuelve el texto de sabor correspondiente a la generación
   * seleccionada en inglés. Retorna una cadena vacía si no se encuentra el texto.
   */
  selectedFlavorText = computed(() => {
    const flavor = this.pokeMove()?.flavor_text_entries.find(
      (flavor) =>
        flavor.language.name === 'en' && flavor.version_group.name === this.selectedGeneration()
    );
    return flavor?.flavor_text || '';
  });

  /**
   * @public
   * @method nextPokemonPage
   * @description
   * Avanza a la siguiente página de la paginación de Pokémon si no se ha alcanzado
   * la última página.
   */
  nextPokemonPage() {
    if (this.currentPokemonPage() < this.totalPokemonPages() - 1) {
      this.currentPokemonPage.update((page) => page + 1);
    }
  }

  /**
   * @public
   * @method prevPokemonPage
   * @description
   * Retrocede a la página anterior de la paginación de Pokémon si no se está
   * en la primera página.
   */
  prevPokemonPage() {
    if (this.currentPokemonPage() > 0) {
      this.currentPokemonPage.update((page) => page - 1);
    }
  }

  /**
   * @public
   * @method onGenerationChange
   * @description
   * Manejador para el cambio de generación seleccionada. No requiere lógica adicional
   * ya que la señal `selectedFlavorText` es reactiva y se actualiza automáticamente.
   */
  onGenerationChange() {
  }
}

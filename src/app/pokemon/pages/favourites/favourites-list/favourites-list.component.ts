import { Component, inject, computed, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FavoritesService } from '@pokemon/auth/services/favourites.service';
import { PokemonService } from '@pokemon/services/pokemon.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { AuthService } from '@pokemon/auth/services/auth.service';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { TitleComponent } from '@shared/components/title/title.component';
import { Router, RouterLink } from '@angular/router';
import { from, map, mergeMap, of, switchMap, toArray } from 'rxjs';
import { PokeCardComponent } from '@pokemon/pages/pokemon/poke-card/poke-card.component';

@Component({
  selector: 'favourites-list',
  standalone: true,
  imports: [PaginationComponent, PokeCardComponent, TitleComponent, RouterLink],
  templateUrl: './favourites-list.component.html',
})
export class FavouritesListComponent {
  private favoritesService = inject(FavoritesService);
  private pokemonService = inject(PokemonService);
  paginationService = inject(PaginationService);
  public authService = inject(AuthService);
  router = inject(Router)

  limit = signal(24); // Número de Pokémon por página

    ngOnInit(){
    if (!this.authService.isLoggedIn()) {
        this.router.navigateByUrl('/');
        return;
      }

  }

  favoritesResource = rxResource({
    request: () => ({
      page: this.paginationService.currentPage() - 1,
      limit: this.limit(),
    }),
    loader: ({ request }) => {
      if (!this.authService.isLoggedIn()) {
        return of({ results: [], count: 0 });
      }
      const offset = request.page * request.limit;
      return this.favoritesService.getFavorites().pipe(
        switchMap(favorites =>
          // Obtener detalles de cada Pokémon favorito
          from(favorites).pipe(
            map(fav => ({
              id: fav.pokemon_id,
              name: fav.pokemon_name,
              url: `${this.pokemonService['baseUrl']}/pokemon/${fav.pokemon_id}`,
            })),
            toArray(),
            map(results => {
              // Aplicar paginación en el cliente
              const sortedResults = results.sort((a, b) => a.id - b.id);
              const start = offset;
              const end = start + request.limit;
              return { results: sortedResults.slice(start, end), fullResults: sortedResults };
            }),
            switchMap(({ results, fullResults }) =>
              from(results).pipe(
                mergeMap(
                  poke =>
                    this.pokemonService.getPokemonById(poke.id).pipe(
                      map(pokemon => ({
                        ...pokemon,
                        sprite: pokemon.sprites.other?.home?.front_default ?? pokemon.sprites.front_default ?? '',
                        type: pokemon.types[0]?.type.name ?? '',
                      }))
                    ),
                  2 // Límite de concurrencia
                ),
                toArray(),
                map(pokemonDetails => ({
                  results: pokemonDetails,
                  count: fullResults.length, // Total de favoritos
                }))
              )
            )
          )
        )
      );
    },
  });

  favorites = this.favoritesResource.value();

  totalPages = computed(() => {
    const count = this.favoritesResource.value()?.count || 0;
    return Math.max(1, Math.ceil(count / this.limit()));
  });
}

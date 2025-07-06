import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { PokeByType } from '@pokemon/interfaces/pokemon-by-type.interface';
import { PokemonService } from '@pokemon/services/pokemon.service';
import { TitleComponent } from '@shared/components/title/title.component';
import { ReplacePipe } from '@pokemon/pipes/replace.pipe';

@Component({
  selector: 'type-details',
  standalone: true,
  imports: [TitleComponent, TitleCasePipe, RouterLink, ReplacePipe],
  templateUrl: './type-details.component.html',
})
export class TypeDetailsComponent {
  private route = inject(ActivatedRoute);
  private pokemonService = inject(PokemonService);

  // Signal que guarda el ID actual del tipo
  typeID = signal(this.route.snapshot.paramMap.get('id') || '');

  // Pagination signals for Moves
  itemsPerPage = 24;
  currentMovePage = signal(0);
  totalMovePages = computed(() => Math.ceil((this.pokeType()?.moves.length || 0) / this.itemsPerPage));
  paginatedMoves = computed(() => {
    const start = this.currentMovePage() * this.itemsPerPage;
    return this.pokeType()?.moves.slice(start, start + this.itemsPerPage) || [];
  });

  // Pagination signals for Pokémon
  currentPokemonPage = signal(0);
  totalPokemonPages = computed(() => Math.ceil((this.pokeType()?.pokemon.length || 0) / this.itemsPerPage));
  paginatedPokemon = computed(() => {
    const start = this.currentPokemonPage() * this.itemsPerPage;
    return this.pokeType()?.pokemon.slice(start, start + this.itemsPerPage) || [];
  });

  // Resource for fetching Pokémon details
  pokemonDetailsResource = rxResource<
    { name: string; sprite: string }[],
    { pokemonList: { pokemon: { name: string; url: string } }[]; typeId: string; page: number }
  >({
    request: () => ({
      pokemonList: this.paginatedPokemon(),
      typeId: this.typeID(),
      page: this.currentPokemonPage() // Include page to ensure unique cache key
    }),
    loader: ({ request }) => {
      if (!request.pokemonList.length) return of([]);
      return this.pokemonService.getPokemonDetailsForType(request.typeId, request.pokemonList, request.page).pipe(
        catchError(error => {
          console.error('Error fetching Pokémon details:', error);
          return of(request.pokemonList.map(poke => ({ name: poke.pokemon.name, sprite: '' })));
        })
      );
    },
  });

  // Computed signal for Pokémon details
  paginatedPokemonDetails = computed(() => this.pokemonDetailsResource.value() || []);

  // Reacciona a los cambios del parámetro 'id'
  constructor() {
    this.route.paramMap.subscribe(params => {
      this.typeID.set(params.get('id') || '');
      // Reset pagination when type changes
      this.currentMovePage.set(0);
      this.currentPokemonPage.set(0);
    });

    // Debug effect to monitor resource updates
    // effect(() => {
    //   console.log('paginatedPokemon changed:', this.paginatedPokemon());
    //   console.log('pokemonDetailsResource value:', this.pokemonDetailsResource.value());
    //   console.log('pokemonDetailsResource loading:', this.pokemonDetailsResource.isLoading());
    // });
  }

  typeResource = rxResource({
    request: () => ({ id: this.typeID() }),
    loader: ({ request }) =>
      this.pokemonService.getTypeById(request.id).pipe(
        catchError(error => {
          console.error('Error fetching Type:', error);
          return of(undefined);
        })
      ),
  });

  pokeType = computed(() => this.typeResource.value());

  // Pagination methods for Moves
  nextMovePage() {
    if (this.currentMovePage() < this.totalMovePages() - 1) {
      this.currentMovePage.update(page => page + 1);
    }
  }

  prevMovePage() {
    if (this.currentMovePage() > 0) {
      this.currentMovePage.update(page => page - 1);
    }
  }

  // Pagination methods for Pokémon
  nextPokemonPage() {
    if (this.currentPokemonPage() < this.totalPokemonPages() - 1) {
      this.currentPokemonPage.update(page => page + 1);
    }
  }

  prevPokemonPage() {
    if (this.currentPokemonPage() > 0) {
      this.currentPokemonPage.update(page => page - 1);
    }
  }
}

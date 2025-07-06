import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PokemonService } from '@pokemon/services/pokemon.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { TitleComponent } from '@shared/components/title/title.component';

@Component({
  selector: 'type-list',
  imports: [RouterLink, TitleComponent],
  templateUrl: './type-list.component.html',
})
export class TypeListComponent {
  pokemonService = inject(PokemonService);
  paginationService = inject(PaginationService);

  typeResource = rxResource({
    request: () => ({}),
    loader: ({ request }) => {
      return this.pokemonService.getList('type');
    },
  });

}

import { Component, computed, input, signal } from '@angular/core';
import { Pokemon } from '@pokemon/interfaces/pokemon-details.interface';
import { RouterModule } from '@angular/router';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { TitleComponent } from "@shared/components/title/title.component";
import { ReplacePipe } from '@pokemon/pipes/replace.pipe';

@Component({
  selector: 'poke-card',
  standalone: true,
  imports: [RouterModule, CommonModule, ReplacePipe, TitleCasePipe],
  templateUrl: './poke-card.component.html',
})
export class PokeCardComponent {

  substitute = 'assets/images/substitute.png';

  pokemon = input.required<Pokemon & { sprite: string; type: string }>();

   imageUrl = computed(() => {
    return this.pokemon().sprite || this.substitute;
  });

  backgroundImageStyle = computed(() => {
    const type = this.pokemon().type;
    return {
      'background-image': `url(assets/images/bg-types/${type}.png)`,
      'background-size': 'cover',
      'background-position': 'center'
    };
  });

  detailUrl = computed(() => `/pokemon/${this.pokemon().id}`);



  // Normal,Fighting,Flying,Poison,Ground,Rock,Bug,Ghost,Steel,Fire,Water,Grass,Electric,Psychic,Ice,Dragon,Dark,Fairy

}

import { Component, computed, inject, ResourceRef, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PokemonService } from '@pokemon/services/pokemon.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { Pokemon } from '@pokemon/interfaces/pokemon-details.interface';
import { PokemonSpecies } from '@pokemon/interfaces/pokemon-species.interface';
import { CommonModule, DecimalPipe, TitleCasePipe } from '@angular/common';
import { TitleComponent } from '@shared/components/title/title.component';
import { CarrouselComponent } from "@shared/components/carrousel/carrousel.component";
import { ReplacePipe } from '@pokemon/pipes/replace.pipe';
import { catchError, of } from 'rxjs';
import { FavoritesService } from '@pokemon/auth/services/favourites.service';
import { AuthService } from '@pokemon/auth/services/auth.service';

/**
 * Componente que muestra los detalles de un Pokémon, incluyendo información general,
 * movimientos por versión, descripción y gestión de favoritos.
 */
@Component({
  selector: 'pokemon-details',
  standalone: true,
  imports: [CommonModule, TitleComponent, TitleCasePipe, CarrouselComponent, ReplacePipe, DecimalPipe, RouterLink],
  templateUrl: './pokemon-details.component.html',
  styleUrl: './pokemon-details.component.scss'
})
export class PokemonDetailsComponent {
  private route = inject(ActivatedRoute);
  private pokemonService = inject(PokemonService);
  private favoritesService = inject(FavoritesService);
  public authService = inject(AuthService);

  favorites = signal<any[]>([]); // Lista de Pokémon favoritos del usuario
  notification = signal<{ type: 'success' | 'error', message: string } | null>(null); // Notificación actual
  substitute = 'assets/images/substituteBW.png'; // Imagen por defecto si no se encuentra un sprite

  // Identificadores del Pokémon a mostrar (por ID o nombre desde la ruta)
  pokemonId = Number(this.route.snapshot.paramMap.get('id'));
  pokemonName = String(this.route.snapshot.paramMap.get('id'));

  /**
   * Recurso reactivo que carga los detalles del Pokémon.
   */
  pokemonResource: ResourceRef<Pokemon | undefined> = rxResource({
    request: () => ({ id: this.pokemonName ? this.pokemonName : this.pokemonId }),
    loader: ({ request }) => this.pokemonService.getPokemonById(request.id).pipe(
      catchError(error => {
        console.error('Error fetching Pokemon:', error);
        return of(undefined);
      })
    ),
  });

  pokemon = computed(() => this.pokemonResource.value()); // Detalles del Pokémon actual

  /**
   * Recurso reactivo que carga la especie del Pokémon.
   */
  speciesResource: ResourceRef<PokemonSpecies | undefined> = rxResource({
    request: () => ({ id: this.pokemonName }),
    loader: ({ request }) => this.pokemonService.getPokemonSpeciesById(request.id).pipe(
      catchError(error => {
        console.error('Error fetching Pokemon Species:', error);
        return of(undefined);
      })
    ),
  });

  species = computed(() => this.speciesResource.value()); // Detalles de la especie del Pokémon
  selectedVersion = signal(''); // Versión seleccionada para mostrar movimientos

  /**
   * Obtiene todas las versiones en las que el Pokémon tiene movimientos.
   */
  versionGroups = computed(() => {
    try {
      const versions = this.pokemon()?.moves
        .flatMap(m => m.version_group_details.map(v => v.version_group.name));
      return [...new Set(versions)];
    } catch (error) {
      console.error('Error processing version groups:', error);
      return [];
    }
  });

  /**
   * Filtra los movimientos del Pokémon por la versión seleccionada.
   */
  filteredMoves = computed(() => {
    try {
      if (!this.selectedVersion()) return [];
      return this.pokemon()?.moves
        .map(move => {
          const versionDetail = move.version_group_details.find(
            v => v.version_group.name === this.selectedVersion()
          );
          return versionDetail
            ? { move: move.move, detail: versionDetail }
            : null;
        })
        .filter(Boolean)
        .sort((a, b) => a!.detail.level_learned_at - b!.detail.level_learned_at);
    } catch (error) {
      console.error('Error filtering moves:', error);
      return [];
    }
  });

  /**
   * Agrupa los movimientos por método de aprendizaje.
   */
  groupedMoves = computed(() => {
    try {
      if (!this.selectedVersion()) return {};

      const grouped: Record<string, { move: any, detail: any }[]> = {};

      this.pokemon()?.moves.forEach(move => {
        const versionDetail = move.version_group_details.find(
          v => v.version_group.name === this.selectedVersion()
        );
        if (versionDetail) {
          const method = versionDetail.move_learn_method.name;
          if (!grouped[method]) {
            grouped[method] = [];
          }
          grouped[method].push({ move: move.move, detail: versionDetail });
        }
      });

      Object.values(grouped).forEach(group =>
        group.sort((a, b) => a.detail.level_learned_at - b.detail.level_learned_at)
      );

      return grouped;
    } catch (error) {
      console.error('Error grouping moves:', error);
      return {};
    }
  });

  /**
   * Ordena los métodos de aprendizaje mostrando primero el método 'level-up'.
   */
  orderedMethods = computed(() => {
    try {
      const keys = Object.keys(this.groupedMoves());
      return [
        ...keys.filter(k => k === 'level-up'),
        ...keys.filter(k => k !== 'level-up')
      ];
    } catch (error) {
      console.error('Error ordering methods:', error);
      return [];
    }
  });

  /**
   * Obtiene la descripción del Pokémon en español o inglés.
   */
  flavorText = computed(() => {
    try {
      let entry = this.species()?.flavor_text_entries.find(
        entry => entry.language.name === 'es'
      );

      if (!entry) {
        entry = this.species()?.flavor_text_entries.find(
          entry => entry.language.name === 'en'
        );
      }

      return entry ? entry.flavor_text.replace(/\n/g, ' ') : 'No hay descripción disponible.';
    } catch (error) {
      console.error('Error processing flavor text:', error);
      return 'No hay descripción disponible.';
    }
  });

  /**
   * Verifica si el Pokémon actual está en la lista de favoritos.
   */
  isFavorite = computed(() => {
    return this.favorites().some(fav => fav.pokemon_id === this.pokemon()?.id);
  });

  /**
   * Al iniciar el componente, carga los favoritos si el usuario está autenticado.
   */
  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.favoritesService.getFavorites().subscribe({
        next: (data) => {
          this.favorites.set(data);
        },
        error: (err) => {
          this.notification.set({ type: 'error', message: 'Error al cargar favoritos' });
          setTimeout(() => this.notification.set(null), 2000);
          console.error('Error al cargar favoritos:', err);
        }
      });
    }
  }

  /**
   * Añade el Pokémon actual a la lista de favoritos.
   */
  addToFavorites() {
    if (this.pokemon() && !this.isFavorite()) {
      this.favoritesService.addFavorite(this.pokemon()!.id, this.pokemon()!.name).subscribe({
        next: () => {
          this.favorites.set([...this.favorites(), { pokemon_id: this.pokemon()!.id, pokemon_name: this.pokemon()!.name }]);
          this.notification.set({ type: 'success', message: `${this.pokemon()!.name} añadido a favoritos` });
          setTimeout(() => this.notification.set(null), 2000);
        },
        error: (err) => {
          this.notification.set({ type: 'error', message: err.message || 'Error al añadir favorito' });
          setTimeout(() => this.notification.set(null), 2000);
          console.error('Error al añadir favorito:', err);
        }
      });
    }
  }

  /**
   * Elimina el Pokémon actual de la lista de favoritos.
   */
  removeFromFavorites() {
    if (this.pokemon() && this.isFavorite()) {
      this.favoritesService.removeFavorite(this.pokemon()!.id).subscribe({
        next: () => {
          this.favorites.set(this.favorites().filter(fav => fav.pokemon_id !== this.pokemon()!.id));
          this.notification.set({ type: 'success', message: `${this.pokemon()!.name} eliminado de favoritos` });
          setTimeout(() => this.notification.set(null), 2000);
        },
        error: (err) => {
          this.notification.set({ type: 'error', message: err.message || 'Error al eliminar favorito' });
          setTimeout(() => this.notification.set(null), 2000);
          console.error('Error al eliminar favorito:', err);
        }
      });
    }
  }

  /**
   * Alterna el estado del Pokémon en favoritos (añadir o eliminar).
   */
  toggleFavorite() {
    if (this.isFavorite()) {
      this.removeFromFavorites();
    } else {
      this.addToFavorites();
    }
  }
}

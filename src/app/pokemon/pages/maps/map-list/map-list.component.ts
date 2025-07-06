import { Component, computed, inject } from '@angular/core';
import { MapDetailsComponent } from "../map-details/map-details.component";
import { Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ReplacePipe } from '@pokemon/pipes/replace.pipe';
import { TitleComponent } from "../../../../shared/components/title/title.component";
import { AuthService } from '@pokemon/auth/services/auth.service';

/**
 * @component
 * @selector map-list
 * @standalone true
 * @imports [RouterLink, RouterModule, CommonModule, TitleComponent]
 * @templateUrl ./map-list.component.html
 *
 * @description
 * Componente standalone que muestra una lista de mapas disponibles de regiones de Pokémon.
 * Cada mapa se representa con un fondo de imagen dinámico basado en su nombre. Proporciona
 * enlaces de navegación para ver los detalles de cada mapa.
 */
@Component({
  selector: 'map-list',
  standalone: true,
  imports: [RouterLink, RouterModule, CommonModule, TitleComponent],
  templateUrl: './map-list.component.html',
})
export class MapListComponent {

  authService = inject(AuthService);
  router = inject(Router);
  /**
   * @public
   * @description
   * Lista estática de nombres de mapas de regiones de Pokémon disponibles para mostrar.
   * Cada nombre corresponde a una región del universo Pokémon.
   */
  mapsList = ['Kanto', 'Johto', 'Kanto2', 'Hoenn', 'Sinnoh', 'Teselia1', 'Teselia2', 'Kalos'];

  /**
   * @public
   * @method getMapBackgroundStyle
   * @param mapName - Nombre del mapa para el cual se genera el estilo de fondo.
   * @returns Objeto con estilos CSS para el fondo del mapa.
   * @description
   * Genera un objeto de estilos CSS para establecer una imagen de fondo basada en el nombre
   * del mapa, utilizando la carpeta `assets/images/maps/`. Configura propiedades adicionales
   * como color de fondo, tamaño y posición para una visualización adecuada.
   */
  getMapBackgroundStyle(mapName: string) {
    return {
      'background-image': `url(assets/images/maps/${mapName}.png)`,
      'background-color': 'green',
      'background-size': 'cover',
      'background-position': 'center'
    };
  }

  ngOnInit(){
    if (!this.authService.isLoggedIn()) {
        this.router.navigateByUrl('/');
        return;
      }

  }

}

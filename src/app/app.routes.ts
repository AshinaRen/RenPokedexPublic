import { Routes } from '@angular/router';
import { AbilityDetailsComponent } from '@pokemon/pages/ability/ability-details/ability-details.component';
import { AbilityListComponent } from '@pokemon/pages/ability/ability-list/ability-list.component';
import { FavouritesListComponent } from '@pokemon/pages/favourites/favourites-list/favourites-list.component';
import { HomePageComponent } from '@pokemon/pages/home-page/home-page.component';
import { MapDetailsComponent } from '@pokemon/pages/maps/map-details/map-details.component';
import { MapListComponent } from '@pokemon/pages/maps/map-list/map-list.component';
import { MoveDetailsComponent } from '@pokemon/pages/move/move-details/move-details.component';
import { MoveListComponent } from '@pokemon/pages/move/move-list/move-list.component';
import { PokemonDetailsComponent } from '@pokemon/pages/pokemon/pokemon-details/pokemon-details.component';
import { PokemonListComponent } from '@pokemon/pages/pokemon/pokemon-list/pokemon-list.component';
import { TypeDetailsComponent } from '@pokemon/pages/type/type-details/type-details.component';
import { TypeListComponent } from '@pokemon/pages/type/type-list/type-list.component';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./pokemon/auth/auth.routes'),
  },
  {
    path: 'home',
    component: HomePageComponent
  },
  {
    path: 'fav',
    component: FavouritesListComponent
  },
  {
    path: 'pokemon',
    component: PokemonListComponent
  },
  {
    path: 'pokemon/:id',
    component: PokemonDetailsComponent
  },
  {
    path: 'types',
    component: TypeListComponent
  },
  {
    path: 'types/:id',
    component: TypeDetailsComponent
  },
  {
    path: 'moves',
    component: MoveListComponent
  },
  {
    path: 'moves/:id',
    component: MoveDetailsComponent
  },
  {
    path: 'ability',
    component: AbilityListComponent
  },
  {
    path: 'ability/:id',
    component: AbilityDetailsComponent
  },
  {
    path: 'map',
    component: MapListComponent
  },
  {
    path: 'map/:id',
    component: MapDetailsComponent
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];

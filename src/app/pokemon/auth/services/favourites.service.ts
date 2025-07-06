import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private apiUrl = environment.backUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No se encontró el token de autenticación');
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  addFavorite(pokemonId: number, pokemonName: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/favorites`,
      { pokemon_id: pokemonId, pokemon_name: pokemonName },
      { headers: this.getHeaders() }
    ).pipe(
      catchError(err => {
        console.error('Error al añadir favorito:', err);
        return throwError(() => new Error(err.error?.message || 'No se pudo añadir el Pokémon a favoritos'));
      })
    );
  }

  getFavorites(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/favorites`, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.error('Error al obtener favoritos:', err);
        return throwError(() => new Error(err.error?.message || 'No se pudieron cargar los favoritos'));
      })
    );
  }

  removeFavorite(pokemonId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/favorites/${pokemonId}`, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.error('Error al eliminar favorito:', err);
        return throwError(() => new Error(err.error?.message || 'No se pudo eliminar el Pokémon de favoritos'));
      })
    );
  }
}

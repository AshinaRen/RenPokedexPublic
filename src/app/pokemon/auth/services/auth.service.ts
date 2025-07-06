import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.backUrl;
  private tokenKey = 'auth_token';
  private userSubject = new BehaviorSubject<{ isLoggedIn: boolean; username: string | null }>({
    isLoggedIn: !!this.getToken(),
    username: null
  });
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    if (this.isLoggedIn()) {
      this.loadUsername();
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    if (!token) {
      throw new Error('No se encontró el token de autenticación');
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  private loadUsername(): void {
    this.getUsername().subscribe({
      next: (response) => {
        this.userSubject.next({ isLoggedIn: true, username: response.username });
      },
      error: (err) => {
        console.error('Error al cargar username:', err);
        this.userSubject.next({ isLoggedIn: false, username: null });
      }
    });
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, email, password });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem(this.tokenKey, response.token);
          this.loadUsername();
        }
      })
    );
  }

  getUsername(): Observable<{ username: string }> {
    return this.http.get<{ username: string }>(`${this.apiUrl}/user`, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.error('Error al obtener username:', err);
        return throwError(() => new Error(err.error?.message || 'No se pudo obtener el nombre de usuario'));
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.userSubject.next({ isLoggedIn: false, username: null });
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}

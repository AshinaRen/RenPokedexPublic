import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '@pokemon/auth/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'RenPokedex';
  date = new Date();
  public authService = inject(AuthService);
  private router = inject(Router);
  username = signal<string | null>(null);

  ngOnInit(): void {
    window.scrollTo(0, 0);
    // Suscribirse al estado del usuario
    this.authService.user$.subscribe(({ isLoggedIn, username }) => {
      this.username.set(username);
      if (!isLoggedIn) {
        this.router.navigate(['/auth']); // Redirigir al login después del logout
      }
    });
  }

  // Bloquear Ctrl + rueda del ratón
  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    if (event.ctrlKey) {
      event.preventDefault(); // Evita el zoom con Ctrl + rueda
    }
  }

  // Bloquear gestos de pellizco en pantallas táctiles
  @HostListener('touchstart', ['$event'])
  @HostListener('touchmove', ['$event'])
  onTouch(event: TouchEvent) {
    if (event.touches.length > 1) {
      event.preventDefault(); // Evita el zoom por pellizco
    }
  }
}

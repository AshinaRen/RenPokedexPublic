import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@pokemon/auth/services/auth.service';

@Component({
  selector: 'login-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  fb = inject(FormBuilder);
  hasError = signal(false);
  isPosting = signal(false);
  router = inject(Router);
  authService = inject(AuthService);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(){
    if (this.authService.isLoggedIn()) {
        this.router.navigateByUrl('/');
        return;
      }

  }

  onSubmit() {

    if (this.authService.isLoggedIn()) {
        this.router.navigateByUrl('/');
        return;
      }

    if (this.loginForm.invalid) {
      this.hasError.set(true);
      setTimeout(() => {
        this.hasError.set(false);
      }, 2000);
      return;
    }

    const { email = '', password = '' } = this.loginForm.value;

    this.isPosting.set(true);
    this.authService.login(email!, password!).subscribe({
      next: (response) => {
        this.isPosting.set(false);
        if (response.token) {
          this.router.navigateByUrl('/');
        } else {
          this.hasError.set(true);
          setTimeout(() => {
            this.hasError.set(false);
          }, 2000);
        }
      },
      error: (err) => {
        this.isPosting.set(false);
        this.hasError.set(true);
        setTimeout(() => {
          this.hasError.set(false);
        }, 2000);
        console.error('Error al iniciar sesión:', err);
      }
    });
  }
}

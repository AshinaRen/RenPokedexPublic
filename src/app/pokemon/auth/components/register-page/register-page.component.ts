import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@pokemon/auth/services/auth.service';

@Component({
  selector: 'register-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './register-page.component.html',
})
export class RegisterPageComponent implements OnInit{

  fb = inject(FormBuilder);
  hasError = signal(false);
  isPosting = signal(false);
  authService = inject(AuthService);
  router = inject(Router);

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
  });

  ngOnInit(){
    if (this.authService.isLoggedIn()) {
        this.router.navigateByUrl('/');
        return;
      }

  }

  onSubmit() {


    if (this.registerForm.invalid) {
      this.hasError.set(true);
      setTimeout(() => {
        this.hasError.set(false);
      }, 2000);
      return;
    }

    const { email = '', username = '', password = '' } = this.registerForm.value;


    this.isPosting.set(true);
    this.authService.register(username!, email!, password!).subscribe({
      next: () => {
        this.isPosting.set(false);
        this.router.navigateByUrl('/auth/login');
      },
      error: (err) => {
        this.isPosting.set(false);
        this.hasError.set(true);
        setTimeout(() => {
          this.hasError.set(false);
        }, 2000);
        console.error('Error al registrar:', err);
      }
    });
  }
}

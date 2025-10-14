// src/app/features/auth/login/login.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  // Form fields
  email = '';
  password = '';
  rememberMe = false;
  
  // UI State
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(private router: Router) {}

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    // Reset error message
    this.errorMessage.set('');
    
    // Basic validation
    if (!this.email || !this.password) {
      this.errorMessage.set('Veuillez remplir tous les champs');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage.set('Adresse email invalide');
      return;
    }

    // Password validation
    if (this.password.length < 6) {
      this.errorMessage.set('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    // Start loading
    this.isLoading.set(true);

    // Simulate API call (replace with actual AuthService call)
    setTimeout(() => {
      // TODO: Replace with actual authentication logic
      // this.authService.login(this.email, this.password).subscribe({
      //   next: (response) => {
      //     localStorage.setItem('token', response.token);
      //     localStorage.setItem('user', JSON.stringify(response.user));
      //     this.router.navigate(['/dashboard']);
      //   },
      //   error: (error) => {
      //     this.errorMessage.set(error.message || 'Identifiants incorrects');
      //     this.isLoading.set(false);
      //   }
      // });

      // Simulation
      if (this.email === 'test@example.com' && this.password === 'password') {
        // Success - redirect to dashboard
        this.router.navigate(['/dashboard']);
      } else {
        // Error
        this.errorMessage.set('Email ou mot de passe incorrect');
      }
      
      this.isLoading.set(false);
    }, 1500);
  }

  /**
   * Navigate to register page
   */
  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  /**
   * Navigate to forgot password page
   */
  goToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }
}
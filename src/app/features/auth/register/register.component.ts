// src/app/features/auth/register/register.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  // Form fields
  first_name = '';
  last_name = '';
  email = '';
  phone = '';
  password = '';
  password_confirm = '';
  acceptTerms = false;
  
  // UI State
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  passwordStrength = signal<PasswordStrength>({
    score: 0,
    label: '',
    color: ''
  });

  constructor(private router: Router, private authService : AuthService) {}

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(field: 'password' | 'password_confirm'): void {
    if (field === 'password') {
      this.showPassword.update(v => !v);
    } else {
      this.showConfirmPassword.update(v => !v);
    }
  }

  /**
   * Calculate password strength
   */
  onPasswordChange(): void {  
    const password = this.password;
    let score = 0;

    if (password.length === 0) {
      this.passwordStrength.set({ score: 0, label: '', color: '' });
      return;
    }

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Complexity checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    // Set strength
    if (score <= 2) {
      this.passwordStrength.set({ score: 1, label: 'Faible', color: '#ef4444' });
    } else if (score <= 4) {
      this.passwordStrength.set({ score: 2, label: 'Moyen', color: '#f59e0b' });
    } else {
      this.passwordStrength.set({ score: 3, label: 'Fort', color: '#10b981' });
    }
  }

  /**
   * Validate form
   */
  private validateForm(): boolean {
    this.errorMessage.set('');

    // Check all fields
    if (!this.first_name ||!this.last_name || !this.email || !this.phone || !this.password || !this.password_confirm) {
      this.errorMessage.set('Veuillez remplir tous les champs obligatoires');
      return false;
    }

    // Validate first_name
    if (this.first_name.trim().length < 3) {
      this.errorMessage.set('Le prénom doit contenir au moins 3 caractères');
      return false;
    }

        // Validate last_name
    if (this.last_name.trim().length < 2) {
      this.errorMessage.set('Le nom doit contenir au moins 2 caractères');
      return false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage.set('Adresse email invalide');
      return false;
    }

    // Validate phone (Cameroon format)
    const phoneRegex = /^(\+237|237)?[62][0-9]{8}$/;
    if (!phoneRegex.test(this.phone.replace(/\s/g, ''))) {
      this.errorMessage.set('Numéro de téléphone invalide (ex: +237 6XX XXX XXX)');
      return false;
    }

    // Validate password
    if (this.password.length < 8) {
      this.errorMessage.set('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }

    if (this.passwordStrength().score < 2) {
      this.errorMessage.set('Le mot de passe est trop faible. Utilisez des majuscules, minuscules, chiffres et caractères spéciaux');
      return false;
    }

    // Check password match
    if (this.password !== this.password_confirm) {
      this.errorMessage.set('Les mots de passe ne correspondent pas');
      return false;
    }

    // Check terms acceptance
    if (!this.acceptTerms) {
      this.errorMessage.set('Vous devez accepter les conditions d\'utilisation');
      return false;
    }

    return true;
  }


onSubmit(): void {
  if (!this.validateForm()) {
    return;
  }
  this.isLoading.set(true);
  this.errorMessage.set('');

  // Création de l'objet userData à partir des champs du formulaire
  const userData = {
    first_name: this.first_name.trim(),
    last_name: this.last_name.trim(),
    email: this.email.trim(),
    phone: this.phone,
    password: this.password,
    password_confirm: this.password_confirm
  };

  this.authService.registerUser(userData).subscribe({
    next: () => {
      this.isLoading.set(false);
      this.successMessage.set('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      this.goToLogin();
      
    },
    error: (error) => {
      this.isLoading.set(false);
      this.errorMessage.set(
        error.error?.message || 'Une erreur est survenue lors de l\'inscription.'
      );
    }
  });
}


  /**
   * Navigate to login page
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}

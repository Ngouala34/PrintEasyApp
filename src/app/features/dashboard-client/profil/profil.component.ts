// src/app/features/dashboard-client/profil/profil.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IUserProfile } from '../../../core/models/user';
import { UserService } from '../../../core/services/user.service';

interface UserProfile {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  company?: string;
  avatar?: string;
}

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.scss']
})
export class ProfilComponent implements OnInit {
  profile = signal<UserProfile>({
    full_name: 'Jean Kamga',
    email: 'jean.kamga@email.com',
    phone: '+237 6XX XXX XXX',
    address: 'Rue de la Réunification',
    city: 'Douala',
    company: 'TechStart SARL'
  });

  userProfile? : IUserProfile;

  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');

  isEditingProfile = signal(false);
  isSavingProfile = signal(false);
  isChangingPassword = signal(false);

  successMessage = signal('');
  errorMessage = signal('');

  ngOnInit(): void {
    this.loadUserData();
  }

  constructor(private userService : UserService) {}

  updateProfile(): void {
    this.isSavingProfile.set(true);
    this.errorMessage.set('');

    // Simuler l'enregistrement
    setTimeout(() => {
      this.isSavingProfile.set(false);
      this.isEditingProfile.set(false);
      this.successMessage.set('Profil mis à jour avec succès !');
      
      setTimeout(() => this.successMessage.set(''), 3000);
    }, 1500);
  }

  changePassword(): void {
    this.errorMessage.set('');

    // Validation
    if (!this.currentPassword() || !this.newPassword() || !this.confirmPassword()) {
      this.errorMessage.set('Veuillez remplir tous les champs');
      return;
    }

    if (this.newPassword().length < 8) {
      this.errorMessage.set('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (this.newPassword() !== this.confirmPassword()) {
      this.errorMessage.set('Les mots de passe ne correspondent pas');
      return;
    }

    this.isChangingPassword.set(true);

    // Simuler le changement
    setTimeout(() => {
      this.isChangingPassword.set(false);
      this.currentPassword.set('');
      this.newPassword.set('');
      this.confirmPassword.set('');
      this.successMessage.set('Mot de passe modifié avec succès !');
      
      setTimeout(() => this.successMessage.set(''), 3000);
    }, 1500);
  }

  uploadAvatar(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        this.profile.update(p => ({
          ...p,
          avatar: e.target?.result as string
        }));
      };
      
      reader.readAsDataURL(file);
    }
  }

  cancelEdit(): void {
    this.isEditingProfile.set(false);
    // Recharger les données originales
  }

  updateProfileField(field: keyof UserProfile, value: any): void {
  this.profile.update(p => ({
    ...p,
    [field]: value
  }));
}

  loadUserData(): void {
  this.userService.getProfile().subscribe({
    next: (user) => {
      this.userProfile = user;
    },
    error: (err) => {
      console.error('Erreur chargement profil :', err);
      // Optionnel : mettre un user par défaut ou rediriger vers login si 401
    }
  });
}

}
// src/app/features/dashboard-client/dashboard-client-layout.component.ts
import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Service } from '../../core/models/service';
import { AuthService } from '../../core/services/auth.service';
import { IUserProfile } from '../../core/models/user';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { INotification } from '../../core/models/order';

@Component({
  selector: 'app-dashboard-client',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-client.component.html',
  styleUrls: ['./dashboard-client.component.scss']
})
export class DashboardClientComponent {
  sidebarCollapsed = signal(false);
  showUserMenu = signal(false);
  showuSideBarElement = signal(false)
  showMenu= false;
  userProfil? : IUserProfile
  private notificationService = inject(NotificationService);

  notifications = signal<INotification[]>([]);
  showNotifications = signal(false);
  isLoading = signal(false);


  constructor(private router : Router, private authService : AuthService, private userService : UserService){

  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadNotifications();
    this.checkToken();
  }



  checkToken(): void {
    const accessToken = this.authService.getToken();
    const refreshToken = this.authService.getRefreshToken();

    if (!accessToken) {
      console.warn(' Aucun access token trouvé !');
      // Optionnel : rediriger vers login
      return;
    }

    if (this.authService.isTokenExpired(accessToken)) {
      console.warn('Le token est expiré !');
      // Optionnel : tenter un refresh ou rediriger vers login
      return;
    }



  }
  menuItems = [
    {
      icon: 'fa-th-large',
      label: 'Tableau de bord',
      route: '/dashboard-client/dashboard',
      exact: true
    },
    {
      icon: 'fa-box',
      label: 'commandes',
      route: '/dashboard-client/upload-document',
    },
    {
      icon: 'fa-history',
      label: 'Historique',
      route: '/dashboard-client/historique'
    },
    {
      icon: 'fa-bell',
      label: 'Notifications',
      route: '/dashboard-client/notifications',
    },
    {
      icon: 'fa-comments',
      label: 'Discussion',
      route: '/dashboard-client/discussion',
      badge: 2
    },
    {
      icon: 'fa-user',
      label: 'Mon Profil',
      route: '/dashboard-client/profil'
    },
    {
      icon: 'fa-question-circle',
      label: 'Aide',
      route: '/dashboard-client/aide'
    }
  ];



  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  togleSideBarElement() : void{
    this.showuSideBarElement.update(v => !v)
  }
  

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
    if (this.showNotifications()) {
      this.showNotifications.set(false);
    }
  }



  logout(): void {
    // Implémenter la déconnexion
    this.authService.logout(),
    console.log('Déconnexion...');
  }

  loadUserData(): void {
  this.userService.getProfile().subscribe({
    next: (user) => {
      this.userProfil = user;
    },
    error: (err) => {
      console.error('Erreur chargement profil :', err);
      // Optionnel : mettre un user par défaut ou rediriger vers login si 401
    }
  });
}


showSidebarDropdown = false;

toggleSideMenu() {
  this.showMenu = !this.showMenu;
}

closeMenu() {
  this.showMenu = false;
}


  // ⚡ Méthode magique : détecte tout clic sur le document
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Vérifie si le clic est DANS un menu ou un bouton
    const clickedInsideDropdown = target.closest('.dropdown, .icon-btn, .user-btn, .menu-toggle');

    // Si le clic est en dehors de tout menu/bouton => fermer tout
    if (!clickedInsideDropdown) {
      this.showNotifications.set(false);
      this.showUserMenu.set(false);
      this.showMenu = false;
    }
  }

  
  loadNotifications(): void { 
    this.isLoading.set(true);
    this.notificationService.getNotifications().subscribe({
      next: (data: INotification[]) => {
        this.notifications.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des notifications:', error);
        this.isLoading.set(false);
      }
    });
  }

  toggleNotifications(): void {
    this.showNotifications.set(!this.showNotifications());
  }

  /** Nombre de notifications non lues */
  get unreadCount(): number {
    return this.notifications().filter(n => !n.is_read).length;
  }

  /** Nombre total de notifications */
  get notificationCount(): number {
    return this.notifications().length;
  }

}
// src/app/features/dashboard-client/dashboard-client-layout.component.ts
import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IUserProfile } from '../../core/models/user';
import { UserService } from '../../core/services/user.service';
import { DocumentDetailComponent } from "./document-detail/document-detail.component";
import { INotification,  } from '../../core/models/order';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, DocumentDetailComponent],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.scss']
})
export class DashboardAdminComponent {
  sidebarCollapsed = signal(false);
  showUserMenu = signal(false);
  showuSideBarElement = signal(false)
  showMenu= false;
  userProfil? : IUserProfile;
    private notificationService = inject(NotificationService);
  
    notifications = signal<INotification[]>([]);
    showNotifications = signal(false);
    isLoading = signal(false);




  constructor(private router : Router, private authService : AuthService, private userService : UserService){

  }

  ngOnInit(): void {
    this.loadUserData();
    this.checkToken();
  }



  checkToken(): void {
    const accessToken = this.authService.getToken();
    const refreshToken = this.authService.getRefreshToken();

    if (!accessToken) {
      // Optionnel : rediriger vers login
      return;
    }

    if (this.authService.isTokenExpired(accessToken)) {
      // Optionnel : tenter un refresh ou rediriger vers login
      return;
    }


  }
  menuItems = [
    {
      icon: 'fa-th-large',
      label: 'Tableau',
      route: '/dashboard-admin/dashboard-printer',
      exact: true
    },
    {
      icon: 'fa-box',
      label: 'commandes',
      route: '/dashboard-admin/commandes',
    },
    {
      icon: 'fa-users',
      label: 'Collaborateurs',
      route: '/dashboard-admin/collaborateurs',
    },
    {
      icon: 'fa-bell',
      label: 'Notifications',
      route: '/dashboard-admin/notifications',
      badge: 5
    },
    {
      icon: 'fa-comments',
      label: 'Discussion',
      route: '/dashboard-admin/discussion',
      badge: 2
    },
    {
      icon: 'fa-user',
      label: 'Mon Profil',
      route: '/dashboard-admin/profil'
    },
    {
      icon: 'fa-question-circle',
      label: 'Aide',
      route: '/dashboard-admin/aide'
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
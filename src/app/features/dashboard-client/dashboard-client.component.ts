// src/app/features/dashboard-client/dashboard-client-layout.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
  showNotifications = signal(false);
  showMenu= false;


  user = {
    name: 'Jean Kamga',
    email: 'jean.kamga@email.com',
    avatar: 'JK',
    role: 'Client'
  };

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
      badge: 5
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

  notifications = [
    { id: 1, message: 'Votre commande #ORD-002 est prête', time: 'Il y a 2h', read: false },
    { id: 2, message: 'Nouvelle promotion : -15% sur les flyers', time: 'Il y a 5h', read: false },
    { id: 3, message: 'Commande #ORD-001 livrée', time: 'Hier', read: true }
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

  toggleNotifications(): void {
    this.showNotifications.update(v => !v);
    if (this.showUserMenu()) {
      this.showUserMenu.set(false);
    }
  }

  logout(): void {
    // Implémenter la déconnexion
    console.log('Déconnexion...');
  }

  get unreadCount(): number {
  return this.notifications.filter(n => !n.read).length;
}

showSidebarDropdown = false;

toggleSideMenu() {
  this.showMenu = !this.showMenu;
}

closeMenu() {
  this.showMenu = false;
}


}
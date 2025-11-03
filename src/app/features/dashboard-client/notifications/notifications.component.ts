// src/app/features/notifications/notifications.component.ts
import { Component, OnInit, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification.service';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'order';
  icon: string;
  read: boolean;
  createdAt: Date;
  orderId?: string;
  orderNumber?: string;
  actionUrl?: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);

  notifications = signal<Notification[]>([]);
  filteredNotifications = signal<Notification[]>([]);
  selectedFilter = signal<'all' | 'unread' | 'order'>('all');
  searchQuery = signal('');
  isLoading = signal(false);
  showEmptyState = signal(false);

  // Données simulées pour les démonstrations
  private mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Commande livrée',
      message: 'Votre commande CMD00001 a été livrée avec succès à votre adresse.',
      type: 'success',
      icon: 'fa-check-circle',
      read: false,
      createdAt: new Date('2024-01-15T10:30:00'),
      orderId: '1',
      orderNumber: 'CMD00001',
      actionUrl: '/orders/1'
    },
    {
      id: '2',
      title: 'Impression en cours',
      message: 'Votre document "Rapport Annuel" est en cours d\'impression.',
      type: 'order',
      icon: 'fa-print',
      read: false,
      createdAt: new Date('2024-01-15T09:15:00'),
      orderId: '2',
      orderNumber: 'CMD00002'
    },
    {
      id: '3',
      title: 'Retard de livraison',
      message: 'Votre commande CMD00003 rencontre un retard imprévu. Délai estimé: +2 jours.',
      type: 'warning',
      icon: 'fa-clock',
      read: true,
      createdAt: new Date('2024-01-14T16:45:00'),
      orderId: '3',
      orderNumber: 'CMD00003'
    },
    {
      id: '4',
      title: 'Nouvelle offre spéciale',
      message: 'Profitez de -20% sur toutes les impressions en couleur cette semaine !',
      type: 'info',
      icon: 'fa-tag',
      read: true,
      createdAt: new Date('2024-01-14T14:20:00')
    },
    {
      id: '5',
      title: 'Problème de fichier',
      message: 'Le fichier "Presentation.pdf" de votre commande CMD00004 nécessite une résolution plus élevée.',
      type: 'error',
      icon: 'fa-exclamation-triangle',
      read: false,
      createdAt: new Date('2024-01-14T11:10:00'),
      orderId: '4',
      orderNumber: 'CMD00004'
    }
  ];

  ngOnInit(): void {
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    // Nettoyage si nécessaire
  }

  loadNotifications(): void {
    this.isLoading.set(true);
    
    // Simulation du chargement
    setTimeout(() => {
      this.notifications.set(this.mockNotifications);
      this.filterNotifications();
      this.isLoading.set(false);
      this.showEmptyState.set(this.filteredNotifications().length === 0);
    }, 1000);
  }

  filterNotifications(): void {
    let filtered = this.notifications();

    // Filtre par type
    if (this.selectedFilter() !== 'all') {
      if (this.selectedFilter() === 'unread') {
        filtered = filtered.filter(notification => !notification.read);
      } else if (this.selectedFilter() === 'order') {
        filtered = filtered.filter(notification => notification.type === 'order');
      }
    }

    // Filtre par recherche
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query) ||
        (notification.orderNumber && notification.orderNumber.toLowerCase().includes(query))
      );
    }

    // Tri par date (plus récent en premier)
    filtered = filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    this.filteredNotifications.set(filtered);
    this.showEmptyState.set(filtered.length === 0);
  }

  onFilterChange(filter: 'all' | 'unread' | 'order'): void {
    this.selectedFilter.set(filter);
    this.filterNotifications();
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.filterNotifications();
  }

  markAsRead(notification: Notification): void {
    if (!notification.read) {
      const updatedNotifications = this.notifications().map(n =>
        n.id === notification.id ? { ...n, read: true } : n
      );
      this.notifications.set(updatedNotifications);
      this.filterNotifications();
      
      // Ici, vous appelleriez votre service pour mettre à jour en base
      this.notificationService.markAsRead(notification.id).subscribe();
    }
  }

  markAllAsRead(): void {
    const updatedNotifications = this.notifications().map(notification => ({
      ...notification,
      read: true
    }));
    this.notifications.set(updatedNotifications);
    this.filterNotifications();
    
    // Appel au service pour marquer toutes comme lues
    this.notificationService.markAllAsRead().subscribe();
  }

  deleteNotification(notificationId: string): void {
    const updatedNotifications = this.notifications().filter(n => n.id !== notificationId);
    this.notifications.set(updatedNotifications);
    this.filterNotifications();
    
    // Appel au service pour supprimer
    this.notificationService.deleteNotification(notificationId).subscribe();
  }

  clearAll(): void {
    this.notifications.set([]);
    this.filteredNotifications.set([]);
    this.showEmptyState.set(true);
    
    // Appel au service pour tout supprimer
    this.notificationService.clearAll().subscribe();
  }

  getNotificationIcon(notification: Notification): string {
    return notification.icon;
  }

  getNotificationBadge(notification: Notification): { label: string, color: string } {
    const badges = {
      info: { label: 'Information', color: '#3b82f6' },
      success: { label: 'Succès', color: '#10b981' },
      warning: { label: 'Attention', color: '#f59e0b' },
      error: { label: 'Erreur', color: '#ef4444' },
      order: { label: 'Commande', color: '#0e0734' }
    };
    return badges[notification.type];
  }

  getUnreadCount(): number {
    return this.notifications().filter(n => !n.read).length;
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  }

  navigateToAction(notification: Notification): void {
    if (notification.actionUrl) {
      // Navigation vers l'URL d'action
      window.open(notification.actionUrl, '_self');
    } else if (notification.orderId) {
      // Navigation vers les détails de la commande
      window.open(`/orders/${notification.orderId}`, '_self');
    }
    
    this.markAsRead(notification);
  }
}
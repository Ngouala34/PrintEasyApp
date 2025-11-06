// src/app/features/notifications/notifications.component.ts
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification.service';
import { INotification } from '../../../core/models/order';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  private notificationService = inject(NotificationService);

  notifications = signal<INotification[]>([]);
  filteredNotifications = signal<INotification[]>([]);
  selectedFilter = signal<'all' | 'unread' | 'order'>('all');
  searchQuery = signal('');
  isLoading = signal(false);
  showEmptyState = signal(false);

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading.set(true);
    this.notificationService.getNotifications().subscribe({
      next: (data: INotification[]) => {
        this.notifications.set(data);
        this.filterNotifications();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des notifications:', error);
        this.isLoading.set(false);
      }
    });
  }

  filterNotifications(): void {
    let filtered = this.notifications();

    if (this.selectedFilter() !== 'all') {
      if (this.selectedFilter() === 'unread') {
        filtered = filtered.filter(notification => !notification.is_read);
      } else if (this.selectedFilter() === 'order') {
        filtered = filtered.filter(notification => notification.notif_type === 'order');
      }
    }

    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
      );
    }

    filtered = filtered.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

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

  markAsRead(notification: INotification): void {
    if (!notification.is_read) {
      const updatedNotifications = this.notifications().map(n =>
        n.id === notification.id ? { ...n, is_read: true } : n
      );
      this.notifications.set(updatedNotifications);
      this.filterNotifications();

      // ✅ Appel au service pour mettre à jour sur le backend
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => console.log(`Notification ${notification.id} marquée comme lue`),
        error: err => console.error('Erreur lors de la mise à jour:', err)
      });
    }
  }

  markAllAsRead(): void {
    const updatedNotifications = this.notifications().map(notification => ({
      ...notification,
      is_read: true
    }));
    this.notifications.set(updatedNotifications);
    this.filterNotifications();

    // ✅ Appel au service pour marquer toutes les notifications comme lues
    this.notificationService.markAllAsRead().subscribe({
      next: () => console.log('Toutes les notifications ont été marquées comme lues'),
      error: err => console.error('Erreur lors du marquage global:', err)
    });
  }

  deleteNotification(notificationId: number): void {
    const updatedNotifications = this.notifications().filter(n => n.id !== notificationId);
    this.notifications.set(updatedNotifications);
    this.filterNotifications();
  }

  clearAll(): void {
    this.notifications.set([]);
    this.filteredNotifications.set([]);
    this.showEmptyState.set(true);
  }

  getNotificationIcon(notification: INotification): string {
    const icons = {
      'order': 'fa-print',
      'system': 'fa-cog',
      'promotion': 'fa-tag',
      'support': 'fa-headset'
    };
    return icons[notification.notif_type] || 'fa-bell';
  }

  getNotificationBadge(notification: INotification): { label: string, color: string } {
    const badges = {
      'order': { label: 'Commande', color: '#0e0734' },
      'system': { label: 'Système', color: '#3b82f6' },
      'promotion': { label: 'Promotion', color: '#10b981' },
      'support': { label: 'Support', color: '#f59e0b' }
    };
    return badges[notification.notif_type] || { label: 'Notification', color: '#6b7280' };
  }

  getUnreadCount(): number {
    return this.notifications().filter(n => !n.is_read).length;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
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

  navigateToAction(notification: INotification): void {
    switch (notification.notif_type) {
      case 'order':
        // window.open(`/orders`, '_self');
        break;
      case 'promotion':
        // window.open(`/promotions`, '_self');
        break;
      case 'support':
        // window.open(`/support`, '_self');
        break;
      default:
        break;
    }
    this.markAsRead(notification);
  }
}

// src/app/features/dashboard-client/notifications/notifications.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Notification {
  id: number;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  time: Date;
  read: boolean;
  actionLink?: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  notifications = signal<Notification[]>([]);
  selectedFilter = signal<'all' | 'unread'>('all');

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    const mockNotifications: Notification[] = [
      {
        id: 1,
        type: 'success',
        title: 'Commande prête',
        message: 'Votre commande #ORD-002 (Cartes de visite) est prête à être retirée',
        time: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
        actionLink: '/dashboard-client/commandes'
      },
      {
        id: 2,
        type: 'info',
        title: 'Commande en cours',
        message: 'Votre commande #ORD-001 (Flyers A5) est actuellement en impression',
        time: new Date(Date.now() - 5 * 60 * 60 * 1000),
        read: false
      },
      {
        id: 3,
        type: 'warning',
        title: 'Confirmation requise',
        message: 'N\'oubliez pas de confirmer la réception de votre commande #ORD-002',
        time: new Date(Date.now() - 24 * 60 * 60 * 1000),
        read: true
      },
      {
        id: 4,
        type: 'success',
        title: 'Promotion',
        message: 'Nouvelle promotion : -15% sur les flyers jusqu\'à la fin du mois !',
        time: new Date(Date.now() - 48 * 60 * 60 * 1000),
        read: true,
        actionLink: '/services'
      },
      {
        id: 5,
        type: 'info',
        title: 'Points fidélité',
        message: 'Vous avez gagné 150 points de fidélité sur votre dernière commande',
        time: new Date(Date.now() - 72 * 60 * 60 * 1000),
        read: true
      }
    ];

    this.notifications.set(mockNotifications);
  }

  filteredNotifications() {
    if (this.selectedFilter() === 'unread') {
      return this.notifications().filter(n => !n.read);
    }
    return this.notifications();
  }

  markAsRead(id: number): void {
    this.notifications.update(notifications =>
      notifications.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  markAllAsRead(): void {
    this.notifications.update(notifications =>
      notifications.map(n => ({ ...n, read: true }))
    );
  }

  deleteNotification(id: number): void {
    this.notifications.update(notifications =>
      notifications.filter(n => n.id !== id)
    );
  }

  getNotificationIcon(type: string): string {
    const icons = {
      success: 'fa-check-circle',
      info: 'fa-info-circle',
      warning: 'fa-exclamation-triangle',
      error: 'fa-times-circle'
    };
    return icons[type as keyof typeof icons];
  }

  getNotificationColor(type: string): string {
    const colors = {
      success: '#10b981',
      info: '#3b82f6',
      warning: '#f59e0b',
      error: '#ef4444'
    };
    return colors[type as keyof typeof colors];
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'À l\'instant';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR');
  }
}
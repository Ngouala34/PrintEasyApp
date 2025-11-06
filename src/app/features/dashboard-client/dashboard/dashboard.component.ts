import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { IOrderResponse } from '../../../core/models/order';

interface KPI {
  label: string;
  value: string;
  icon: string;
  trend?: string;
  trendIcon?: string;
  trendColor?: string;
  color: string;
}

interface MonthlyStats {
  totalOrders: number;
  totalPages: number;
  savings: number;
}

interface ProgressItem {
  orderNumber: string;
  service: string;
  percentage: number;
}

interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: string;
  validUntil: Date;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private orderService = inject(OrderService);
  
  expandedOrderId: string | null = null;
  isLoading = signal(true);

  kpis = signal<KPI[]>([]);
  recentOrders = signal<IOrderResponse[]>([]);
  monthlyStats = signal<MonthlyStats>({
    totalOrders: 0,
    totalPages: 0,
    savings: 0
  });
  currentProgress = signal<ProgressItem[]>([]);
  currentPromotions = signal<Promotion[]>([
    {
      id: '1',
      title: 'Flyers -15%',
      description: 'Réduction spéciale sur tous les flyers couleur',
      discount: '-15%',
      validUntil: new Date('2025-01-31'),
      color: '#ef4444'
    },
    {
      id: '2',
      title: 'Livraison offerte',
      description: 'Livraison gratuite à partir de 20 000 FCFA',
      discount: '0 FCFA',
      validUntil: new Date('2025-01-20'),
      color: '#10b981'
    },
    {
      id: '3',
      title: 'Cartes de visite premium',
      description: 'Pack 200 cartes avec finition premium',
      discount: '-10%',
      validUntil: new Date('2025-01-25'),
      color: '#8b5cf6'
    }
  ]);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.orderService.loadOrders().subscribe({
      next: (orders: IOrderResponse[]) => {
        this.processOrdersData(orders);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des commandes:', error);
        this.isLoading.set(false);
      }
    });
  }

  processOrdersData(orders: IOrderResponse[]): void {
    // Commandes récentes (5 plus récentes)
    const recent = [...orders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
    
    this.recentOrders.set(recent);

    // Calcul des KPIs
    const pendingOrders = orders.filter(order => 
      ['pending', 'in_progress'].includes(order.status)
    ).length;

    const completedOrders = orders.filter(order => 
      ['printed', 'delivered'].includes(order.status)
    ).length;

    const totalSpent = orders.reduce((sum, order) => 
      sum + parseFloat(order.total_price), 0
    );

    const totalPages = orders.reduce((sum, order) => 
      sum + (order.number_of_pages * order.quantity), 0
    );

    // Mise à jour des KPIs
    this.kpis.set([
      {
        label: 'Commandes en cours',
        value: pendingOrders.toString(),
        icon: 'fa-box',
        trend: '+2 cette semaine',
        trendIcon: 'fa-arrow-up',
        trendColor: '#10b981',
        color: '#3b82f6'
      },
      {
        label: 'Total dépensé',
        value: `${Math.round(totalSpent / 1000)}K FCFA`,
        icon: 'fa-wallet',
        trend: '+120K ce mois',
        trendIcon: 'fa-arrow-up',
        trendColor: '#10b981',
        color: '#f59e0b'
      },
      {
        label: 'Commandes terminées',
        value: completedOrders.toString(),
        icon: 'fa-check-circle',
        trend: '+5 ce mois',
        trendIcon: 'fa-arrow-up',
        trendColor: '#10b981',
        color: '#10b981'
      },
      {
        label: 'Pages imprimées',
        value: totalPages.toString(),
        icon: 'fa-file-alt',
        trend: '+500 ce mois',
        trendIcon: 'fa-arrow-up',
        trendColor: '#10b981',
        color: '#8b5cf6'
      }
    ]);

    // Statistiques du mois
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    this.monthlyStats.set({
      totalOrders: monthlyOrders.length,
      totalPages: monthlyOrders.reduce((sum, order) => 
        sum + (order.number_of_pages * order.quantity), 0
      ),
      savings: monthlyOrders.reduce((sum, order) => {
        const basePrice = parseFloat(order.unit_price) * order.number_of_pages * order.quantity;
        const paidPrice = parseFloat(order.total_price);
        return sum + Math.max(0, basePrice - paidPrice);
      }, 0)
    });

    // Progression en cours
    const inProgressOrders = orders.filter(order => 
      ['pending', 'in_progress'].includes(order.status)
    );

    this.currentProgress.set(
      inProgressOrders.map(order => ({
        orderNumber: order.order_number,
        service: order.document_type,
        percentage: this.calculateProgressPercentage(order.status)
      })).slice(0, 3) // Limiter à 3 éléments
    );
  }

  calculateProgressPercentage(status: string): number {
    const progressMap: { [key: string]: number } = {
      'pending': 25,
      'in_progress': 60,
      'printed': 90,
      'delivered': 100,
      'cancelled': 0
    };
    return progressMap[status] || 0;
  }

  toggleOrderDetails(orderId: string): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  getStatusInfo(status: IOrderResponse['status']) {
    const statusMap = {
      pending: { label: 'En attente', color: '#f59e0b', icon: 'fa-clock' },
      in_progress: { label: 'En cours', color: '#3b82f6', icon: 'fa-cogs' },
      printed: { label: 'Imprimée', color: '#10b981', icon: 'fa-check' },
      delivered: { label: 'Livrée', color: '#6b7280', icon: 'fa-box' },
      cancelled: { label: 'Annulée', color: '#ef4444', icon: 'fa-times' }
    };
    return statusMap[status];
  }

  getDeliveryType(order: IOrderResponse): string {
    return order.delivery_address ? 'delivery' : 'pickup';
  }

  getFormattedDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstimatedDelivery(date: Date): Date {
    // Ajouter 3 jours ouvrables à la date de création
    const deliveryDate = new Date(date);
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    return deliveryDate;
  }

  downloadFiles(order: IOrderResponse): void {
    if (order.document_url) {
      window.open(order.document_url, '_blank');
    } else {
      console.log('Aucun fichier disponible pour:', order.order_number);
    }
  }

  contactSupport(order: IOrderResponse): void {
    console.log('Contact support pour:', order.order_number);
    // Rediriger vers le support
  }

  trackDelivery(): void {
    console.log('Suivi de livraison');
    // Implémenter le suivi
  }

  // Helper pour obtenir le format d'impression depuis les options
  getPrintFormat(order: IOrderResponse): string {
    return order.options?.option_format || 'A4';
  }

  // Helper pour obtenir le type de papier depuis les options
  getPaperType(order: IOrderResponse): string {
    return order.options?.option_paper || 'Standard';
  }

  // Helper pour obtenir le type d'impression (couleur/N&B)
  getPrintType(order: IOrderResponse): string {
    return order.options?.option_color || 'color';
  }

  // Helper pour obtenir le type de finition
  getPrintSides(order: IOrderResponse): string {
    return order.options?.option_sides ? 'double' : 'single';
  }
}
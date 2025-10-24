import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Order {
  id: string;
  orderNumber: string;
  date: Date;
  status: 'pending' | 'processing' | 'printing' | 'ready' | 'delivered';
  service: string;
  documentType: string;
  format: string;
  customDimensions?: { width: number; height: number };
  sides: 'single' | 'double';
  color: 'bw' | 'color';
  paperType: string;
  quantity: number;
  fileCount: number;
  additionalNotes?: string;
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  estimatedDelivery: Date;
  total: number;
}

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
  expandedOrderId: string | null = null;

  kpis = signal<KPI[]>([
    {
      label: 'Commandes en cours',
      value: '3',
      icon: 'fa-box',
      trend: '+2 cette semaine',
      trendIcon: 'fa-arrow-up',
      trendColor: '#10b981',
      color: '#3b82f6'
    },
    {
      label: 'Total dépensé',
      value: '850K FCFA',
      icon: 'fa-wallet',
      trend: '+120K ce mois',
      trendIcon: 'fa-arrow-up',
      trendColor: '#10b981',
      color: '#f59e0b'
    },
    {
      label: 'Commandes terminées',
      value: '27',
      icon: 'fa-check-circle',
      trend: '+5 ce mois',
      trendIcon: 'fa-arrow-up',
      trendColor: '#10b981',
      color: '#10b981'
    },
    {
      label: 'Points fidélité',
      value: '1,250',
      icon: 'fa-star',
      trend: '+150 points',
      trendIcon: 'fa-arrow-up',
      trendColor: '#10b981',
      color: '#8b5cf6'
    }
  ]);

  recentOrders = signal<Order[]>([
    {
      id: '1',
      orderNumber: 'ORD-2025-001',
      date: new Date('2025-01-05'),
      status: 'printing',
      service: 'Flyers promotionnels',
      documentType: 'Flyer',
      format: 'A5',
      sides: 'double',
      color: 'color',
      paperType: 'Papier glacé 150g/m²',
      quantity: 500,
      fileCount: 2,
      additionalNotes: 'Impression avec fond perdu de 3mm. Vérifier les couleurs Pantone.',
      deliveryType: 'pickup',
      estimatedDelivery: new Date('2025-01-08'),
      total: 25000
    },
    {
      id: '2',
      orderNumber: 'ORD-2025-002',
      date: new Date('2025-01-06'),
      status: 'ready',
      service: 'Cartes de Visite',
      documentType: 'Carte de visite',
      format: '85 × 55 mm',
      sides: 'single',
      color: 'color',
      paperType: 'Carton 300g/m²',
      quantity: 100,
      fileCount: 1,
      deliveryType: 'delivery',
      deliveryAddress: 'Bastos, Yaoundé',
      estimatedDelivery: new Date('2025-01-09'),
      total: 5000
    },
    {
      id: '3',
      orderNumber: 'ORD-2025-003',
      date: new Date('2025-01-07'),
      status: 'processing',
      service: 'Brochure corporative',
      documentType: 'Brochure',
      format: 'A4',
      customDimensions: { width: 21, height: 29.7 },
      sides: 'double',
      color: 'color',
      paperType: 'Papier mat 170g/m²',
      quantity: 50,
      fileCount: 1,
      deliveryType: 'pickup',
      estimatedDelivery: new Date('2025-01-10'),
      total: 10000
    }
  ]);

  monthlyStats = signal<MonthlyStats>({
    totalOrders: 8,
    totalPages: 2450,
    savings: 12500
  });

  currentProgress = signal<ProgressItem[]>([
    { orderNumber: 'ORD-2025-001', service: 'Flyers A5', percentage: 75 },
    { orderNumber: 'ORD-2025-004', service: 'Affiches A3', percentage: 30 },
    { orderNumber: 'ORD-2025-005', service: 'Stickers', percentage: 90 }
  ]);

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
    // Charger les données depuis les services
  }

  toggleOrderDetails(orderId: string): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  getStatusInfo(status: Order['status']) {
    const statusMap = {
      pending: { label: 'En attente', color: '#f59e0b', icon: 'fa-clock' },
      processing: { label: 'En traitement', color: '#3b82f6', icon: 'fa-cogs' },
      printing: { label: 'En impression', color: '#8b5cf6', icon: 'fa-print' },
      ready: { label: 'Prête', color: '#10b981', icon: 'fa-check' },
      delivered: { label: 'Livrée', color: '#6b7280', icon: 'fa-box' }
    };
    return statusMap[status];
  }

  downloadFiles(order: Order): void {
    console.log('Téléchargement des fichiers pour:', order.orderNumber);
    // Implémenter le téléchargement
  }

  contactSupport(order: Order): void {
    console.log('Contact support pour:', order.orderNumber);
    // Rediriger vers le support
  }

  duplicateOrder(order: Order): void {
    console.log('Duplication de la commande:', order.orderNumber);
    // Implémenter la duplication
  }

  trackDelivery(): void {
    console.log('Suivi de livraison');
    // Implémenter le suivi
  }
}
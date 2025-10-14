// src/app/features/dashboard-client/dashboard/dashboard.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Order {
  id: string;
  orderNumber: string;
  date: Date;
  status: 'pending' | 'processing' | 'printing' | 'ready' | 'delivered';
  service: string;
  quantity: number;
  total: number;
}

interface KPI {
  label: string;
  value: string;
  icon: string;
  trend?: string;
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
  kpis = signal<KPI[]>([
    {
      label: 'Commandes en cours',
      value: '3',
      icon: 'fa-box',
      trend: '+2 cette semaine',
      color: '#3b82f6'
    },
    {
      label: 'Total dépensé',
      value: '850K FCFA',
      icon: 'fa-wallet',
      trend: '+120K ce mois',
      color: '#f59e0b'
    },
    {
      label: 'Commandes terminées',
      value: '27',
      icon: 'fa-check-circle',
      trend: '+5 ce mois',
      color: '#10b981'
    },
    {
      label: 'Points fidélité',
      value: '1,250',
      icon: 'fa-star',
      trend: '+150 points',
      color: '#8b5cf6'
    }
  ]);

  recentOrders = signal<Order[]>([
    {
      id: '1',
      orderNumber: 'ORD-2025-001',
      date: new Date('2025-10-05'),
      status: 'printing',
      service: 'Flyers A5',
      quantity: 500,
      total: 25000
    },
    {
      id: '2',
      orderNumber: 'ORD-2025-002',
      date: new Date('2025-10-06'),
      status: 'ready',
      service: 'Cartes de Visite',
      quantity: 100,
      total: 5000
    },
    {
      id: '3',
      orderNumber: 'ORD-2025-003',
      date: new Date('2025-10-07'),
      status: 'pending',
      service: 'Brochure A4',
      quantity: 50,
      total: 10000
    }
  ]);

  ngOnInit(): void {
    // Charger les données depuis les services
  }

  getStatusInfo(status: Order['status']) {
    const statusMap = {
      pending: { label: 'En attente', color: '#f59e0b', icon: '⏳' },
      processing: { label: 'En traitement', color: '#3b82f6', icon: '⚙️' },
      printing: { label: 'En impression', color: '#8b5cf6', icon: '🖨️' },
      ready: { label: 'Prête', color: '#10b981', icon: '✅' },
      delivered: { label: 'Livrée', color: '#6b7280', icon: '📦' }
    };
    return statusMap[status];
  }
}
// src/app/features/dashboard-client/historique/historique.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface OrderHistory {
  id: string;
  orderNumber: string;
  date: Date;
  status: 'delivered' | 'cancelled';
  service: string;
  quantity: number;
  total: number;
  invoiceUrl?: string;
}

@Component({
  selector: 'app-historique',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historique.component.html',
  styleUrls: ['./historique.component.scss']
})
export class HistoriqueComponent implements OnInit {
  orders = signal<OrderHistory[]>([]);
  filteredOrders = signal<OrderHistory[]>([]);
  searchQuery = signal('');
  selectedStatus = signal<string>('all');
  selectedMonth = signal<string>('all');

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    // Simuler le chargement depuis API
    const mockOrders: OrderHistory[] = [
      {
        id: '1',
        orderNumber: 'ORD-2025-010',
        date: new Date('2025-09-28'),
        status: 'delivered',
        service: 'Affiches A3',
        quantity: 20,
        total: 20000,
        invoiceUrl: '#'
      },
      {
        id: '2',
        orderNumber: 'ORD-2025-009',
        date: new Date('2025-09-15'),
        status: 'delivered',
        service: 'Flyers A6',
        quantity: 1000,
        total: 30000,
        invoiceUrl: '#'
      },
      {
        id: '3',
        orderNumber: 'ORD-2025-008',
        date: new Date('2025-08-22'),
        status: 'delivered',
        service: 'Cartes de visite',
        quantity: 200,
        total: 10000,
        invoiceUrl: '#'
      },
      {
        id: '4',
        orderNumber: 'ORD-2025-007',
        date: new Date('2025-08-10'),
        status: 'cancelled',
        service: 'Brochure A4',
        quantity: 50,
        total: 15000
      }
    ];

    this.orders.set(mockOrders);
    this.filteredOrders.set(mockOrders);
  }

  filterOrders(): void {
    let filtered = this.orders();

    // Filtre par recherche
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.service.toLowerCase().includes(query)
      );
    }

    // Filtre par statut
    if (this.selectedStatus() !== 'all') {
      filtered = filtered.filter(order => order.status === this.selectedStatus());
    }

    // Filtre par mois
    if (this.selectedMonth() !== 'all') {
      const month = parseInt(this.selectedMonth());
      filtered = filtered.filter(order => order.date.getMonth() === month);
    }

    this.filteredOrders.set(filtered);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.filterOrders();
  }

  onStatusChange(value: string): void {
    this.selectedStatus.set(value);
    this.filterOrders();
  }

  onMonthChange(value: string): void {
    this.selectedMonth.set(value);
    this.filterOrders();
  }

  downloadInvoice(order: OrderHistory): void {
    console.log('Téléchargement facture:', order.orderNumber);
    // Implémenter le téléchargement
  }

  getTotalSpent(): number {
    return this.filteredOrders()
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total, 0);
  }

  getStatusBadge(status: string) {
    const badges = {
      delivered: { label: 'Livrée', color: '#10b981', icon: 'fa-check-circle' },
      cancelled: { label: 'Annulée', color: '#ef4444', icon: 'fa-times-circle' }
    };
    return badges[status as keyof typeof badges];
  }
}
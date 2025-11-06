// src/app/features/dashboard-client/historique/historique.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { 
  IOrderResponse, 
  OrderSummary, 
  OrderOptions, 
  OrderUser 
} from '../../../core/models/order';

@Component({
  selector: 'app-historique',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historique.component.html',
  styleUrls: ['./historique.component.scss']
})
export class HistoriqueComponent implements OnInit {
  orders = signal<OrderSummary[]>([]);
  filteredOrders = signal<OrderSummary[]>([]);
  searchQuery = signal('');
  selectedStatus = signal<string>('all');
  selectedMonth = signal<string>('all');
  selectedOrder = signal<OrderSummary | null>(null);

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.orderService.loadOrders().subscribe({
      next: (data: IOrderResponse[]) => {
        const formattedOrders = data.map(order => this.formatOrder(order));
        this.orders.set(formattedOrders);
        this.filteredOrders.set(formattedOrders);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des commandes:', error);
      }
    });
  }

  private formatOrder(order: IOrderResponse): OrderSummary {
    return {
      id: order.id,
      orderNumber: order.order_number,
      date: new Date(order.created_at),
      status: order.status,
      service: order.document_type,
      quantity: order.quantity,
      total: parseFloat(order.total_price),
      documentType: order.document_type,
      documentUrl: order.document_url,
      options: order.options,
      deliveryInfo: {
        city: order.delivery_city,
        neighborhood: order.delivery_neighborhood,
        address: order.delivery_address,
        phone: order.delivery_phone
      },
      note: order.note || undefined,
      numberOfPages: order.number_of_pages,
      unitPrice: order.unit_price,
      user: order.user,
      createdAt: order.created_at,
      updatedAt: order.updated_at
    };
  }

  filterOrders(): void {
    let filtered = this.orders();

    // Filtre par recherche
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.service.toLowerCase().includes(query) ||
        order.documentType.toLowerCase().includes(query) ||
        order.deliveryInfo.city!.toLowerCase().includes(query)
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

  showOrderDetails(order: OrderSummary): void {
    this.selectedOrder.set(order);
  }

  closeOrderDetails(): void {
    this.selectedOrder.set(null);
  }

  downloadDocument(order: OrderSummary): void {
    if (order.documentUrl) {
      window.open(order.documentUrl, '_blank');
    }
  }

  downloadInvoice(order: OrderSummary): void {
    console.log('Téléchargement facture:', order.orderNumber);
    // Implémenter le téléchargement de la facture
  }

  getTotalSpent(): number {
    return this.filteredOrders()
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total, 0);
  }

  getStatusBadge(status: string) {
    const badges = {
      pending: { label: 'En attente', color: '#f59e0b', icon: 'fa-clock' },
      in_progress: { label: 'En cours', color: '#3b82f6', icon: 'fa-cogs' },
      printed: { label: 'imprimé', color: '#10b981', icon: 'fa-check-circle' },
      cancelled: { label: 'Annulée', color: '#ef4444', icon: 'fa-times-circle' }
    };
    return badges[status as keyof typeof badges] || { label: status, color: '#6b7280', icon: 'fa-question' };
  }

  getOrderOptionsText(options: OrderOptions): string {
    return [
      options.option_color,
      options.option_format,
      options.option_paper,
      options.option_sides,
      options.option_delivery
    ].filter(opt => opt).join(' • ');
  }
}
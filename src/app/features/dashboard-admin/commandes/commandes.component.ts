// src/app/components/commandes/commandes.component.ts
import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { OrderService } from '../../../core/services/order.service';
import { IOrderResponse } from '../../../core/models/order';
import { DocumentDetailComponent } from '../document-detail/document-detail.component';


@Component({
  selector: 'app-commandes',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentDetailComponent],
  templateUrl: './commandes.component.html',
  styleUrls: ['./commandes.component.scss']
})
export class CommandesComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // Données
  allOrders = signal<IOrderResponse[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Modal de détails
  selectedOrderId: string | null = null;

  // Filtres et recherche
  searchQuery = signal<string>('');
  selectedStatus = signal<'all' | 'pending' | 'in_progress' | 'printed' | 'delivered' | 'cancelled'>('all');
  selectedDocumentType = signal<string>('all');
  dateRange = signal<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  
  // Tri
  sortBy = signal<'date' | 'order_number' | 'client' | 'total' | 'status'>('date');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Pagination
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(10);

  // Types de documents uniques (pour le filtre)
  documentTypes = computed(() => {
    const types = new Set(this.allOrders().map(o => o.document_type));
    return Array.from(types).sort();
  });

  // Commandes filtrées et triées
  filteredOrders = computed(() => {
    let orders = [...this.allOrders()];

    // Filtre par recherche (order_number, client, email)
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      orders = orders.filter(order => 
        order.order_number.toLowerCase().includes(query) ||
        order.user.full_name.toLowerCase().includes(query) ||
        order.user.email.toLowerCase().includes(query)
      );
    }

    // Filtre par statut
    if (this.selectedStatus() !== 'all') {
      orders = orders.filter(order => order.status === this.selectedStatus());
    }

    // Filtre par type de document
    if (this.selectedDocumentType() !== 'all') {
      orders = orders.filter(order => order.document_type === this.selectedDocumentType());
    }

    // Filtre par date
    const { start, end } = this.dateRange();
    if (start) {
      orders = orders.filter(order => new Date(order.created_at) >= start);
    }
    if (end) {
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      orders = orders.filter(order => new Date(order.created_at) <= endOfDay);
    }

    // Tri
    orders.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy()) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'order_number':
          comparison = a.order_number.localeCompare(b.order_number);
          break;
        case 'client':
          comparison = a.user.full_name.localeCompare(b.user.full_name);
          break;
        case 'total':
          comparison = parseFloat(a.total_price) - parseFloat(b.total_price);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return this.sortDirection() === 'asc' ? comparison : -comparison;
    });

    return orders;
  });

  // Commandes paginées
  paginatedOrders = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.filteredOrders().slice(start, end);
  });

  // Nombre total de pages
  totalPages = computed(() => {
    return Math.ceil(this.filteredOrders().length / this.itemsPerPage());
  });

  // Statistiques rapides
  stats = computed(() => {
    const orders = this.filteredOrders();
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      in_progress: orders.filter(o => o.status === 'in_progress').length,
      printed: orders.filter(o => o.status === 'printed').length,
      totalRevenue: orders.reduce((sum, o) => sum + parseFloat(o.total_price || '0'), 0)
    };
  });

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger toutes les commandes depuis l'API
   */
  private loadOrders(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.orderService.loadOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          this.allOrders.set(orders);
          this.isLoading.set(false);
          console.log('✅ Commandes chargées:', orders.length);
        },
        error: (err) => {
          console.error('❌ Erreur chargement commandes:', err);
          this.error.set('Impossible de charger les commandes');
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Rafraîchir les données
   */
  onRefresh(): void {
    this.loadOrders();
  }

  /**
   * Changer le tri
   */
  onSort(column: 'date' | 'order_number' | 'client' | 'total' | 'status'): void {
    if (this.sortBy() === column) {
      // Inverser la direction
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      // Nouveau tri
      this.sortBy.set(column);
      this.sortDirection.set('desc');
    }
  }

  /**
   * Réinitialiser les filtres
   */
  onResetFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedDocumentType.set('all');
    this.dateRange.set({ start: null, end: null });
    this.currentPage.set(1);
  }

  /**
   * Changer de page
   */
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      // Scroll vers le haut
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Ouvrir le modal de détails
   */
  onViewDetails(orderId: number): void {
    this.selectedOrderId = orderId.toString();
  }

  /**
   * Fermer le modal
   */
  onCloseDetailModal(): void {
    this.selectedOrderId = null;
  }

  /**
   * Callback après mise à jour d'une commande
   */
  onOrderUpdated(updatedOrder: IOrderResponse): void {
    // Mettre à jour la commande dans la liste
    this.allOrders.update(orders => 
      orders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
    );
    console.log('✅ Commande mise à jour:', updatedOrder.order_number);
  }

  /**
   * EXPORT PDF - Génération d'un rapport complet
   */
  async onExportPDF(): Promise<void> {
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const orders = this.filteredOrders();
      
      if (orders.length === 0) {
        alert('Aucune commande à exporter');
        return;
      }

      const pageWidth = doc.internal.pageSize.width;
      const margin = 15;
      let y = 20;

      // En-tête
      doc.setFillColor(14, 7, 52);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(240, 226, 34);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('HISTORIQUE DES COMMANDES', pageWidth / 2, y, { align: 'center' });
      
      y += 10;
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, y, { align: 'center' });
      
      y = 55;

      // Statistiques
      doc.setTextColor(14, 7, 52);
      doc.setFontSize(10);
      doc.text(`Total: ${this.stats().total} commandes`, margin, y);
      doc.text(`Revenus: ${this.formatCurrency(this.stats().totalRevenue)}`, pageWidth - margin, y, { align: 'right' });
      
      y += 10;

      // Tableau des commandes (simplifié pour PDF)
      doc.setFontSize(8);
      orders.slice(0, 30).forEach((order, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        const statusLabel = this.getStatusLabel(order.status);
        const line = `${order.order_number} | ${order.user.full_name} | ${order.document_type} | ${statusLabel} | ${this.formatCurrency(parseFloat(order.total_price))}`;
        
        doc.text(line, margin, y);
        y += 6;
      });

      if (orders.length > 30) {
        doc.text(`... et ${orders.length - 30} autres commandes`, margin, y + 5);
      }

      doc.save(`commandes_${new Date().getTime()}.pdf`);
      console.log('✅ PDF exporté');
    } catch (error) {
      console.error('❌ Erreur export PDF:', error);
      alert('Erreur lors de l\'export PDF. Installez jsPDF: npm install jspdf');
    }
  }

  /**
   * EXPORT CSV - Export des données en CSV
   */
  onExportCSV(): void {
    const orders = this.filteredOrders();
    
    if (orders.length === 0) {
      alert('Aucune commande à exporter');
      return;
    }

    // En-têtes CSV
    const headers = [
      'Numéro Commande',
      'Client',
      'Email',
      'Type Document',
      'Quantité',
      'Pages',
      'Prix Total',
      'Statut',
      'Date Création',
      'Format',
      'Couleur',
      'Papier'
    ];

    // Lignes de données
    const rows = orders.map(order => [
      order.order_number,
      order.user.full_name,
      order.user.email,
      order.document_type,
      order.quantity,
      order.number_of_pages,
      order.total_price,
      this.getStatusLabel(order.status),
      new Date(order.created_at).toLocaleDateString('fr-FR'),
      order.options.option_format || 'N/A',
      order.options.option_color || 'N/A',
      order.options.option_paper || 'N/A'
    ]);

    // Construire le CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `commandes_${new Date().getTime()}.csv`;
    link.click();
    
    console.log('✅ CSV exporté');
  }

  // Helpers
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      in_progress: 'En production',
      printed: 'Imprimé',
      delivered: 'Livré',
      cancelled: 'Annulé'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(value);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Pagination helpers
  get pageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const delta = 2;
    const range: number[] = [];
    
    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }
    
    if (current - delta > 2) {
      range.unshift(-1); // Ellipsis
    }
    if (current + delta < total - 1) {
      range.push(-1); // Ellipsis
    }
    
    range.unshift(1);
    if (total > 1) {
      range.push(total);
    }
    
    return range;
  }



}
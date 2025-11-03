// src/app/components/dashboard-printer/dashboard-printer.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { KPIData, OrderActivity, Alert, DocumentTypeStats, RevenueData, ProductivityMetrics, RecentDelivery, StockLevel, PrinterDashboardService } from '../../../core/services/admin.service';
import { Chart } from 'chart.js';


@Component({
  selector: 'app-dashboard-printer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-printer.component.html',
  styleUrls: ['./dashboard-printer.component.scss']
})
export class DashboardPrinterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Données du dashboard
  kpis: KPIData | null = null;
  todayOrders: OrderActivity[] = [];
  alerts: Alert[] = [];
  documentStats: DocumentTypeStats[] = [];
  revenueData: RevenueData[] = [];
  productivity: ProductivityMetrics | null = null;
  recentDeliveries: RecentDelivery[] = [];
  stockLevels: StockLevel[] = [];

  // Filtres et tri pour les commandes
  selectedFilter: 'all' | 'pending' | 'in-progress' | 'delayed' = 'all';
  sortColumn: 'ref' | 'client' | 'eta' | 'priority' = 'eta';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Charts (seront initialisés après le DOM)
  documentChart: any = null;
  revenueChart: any = null;

  constructor(private dashboardService: PrinterDashboardService) {}

  ngOnInit(): void {
    // Charger toutes les données du dashboard
    this.loadKpis();
    this.loadOrders();
    this.loadAlerts();
    this.loadDocumentStats();
    this.loadRevenueData();
    this.loadProductivity();
    this.loadRecentDeliveries();
    this.loadStockLevels();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Détruire les charts
    if (this.documentChart) {
      this.documentChart.destroy();
    }
    if (this.revenueChart) {
      this.revenueChart.destroy();
    }
  }

  // Chargement des données
  private loadKpis(): void {
    this.dashboardService.getKpis()
      .pipe(takeUntil(this.destroy$))
      .subscribe(kpis => this.kpis = kpis);
  }

  private loadOrders(): void {
    this.dashboardService.getTodayOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe(orders => {
        this.todayOrders = orders;
      });
  }

  private loadAlerts(): void {
    this.dashboardService.getAlerts()
      .pipe(takeUntil(this.destroy$))
      .subscribe(alerts => this.alerts = alerts);
  }

  private loadDocumentStats(): void {
    this.dashboardService.getDocumentStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.documentStats = stats;
        this.initDocumentChart();
      });
  }

  private loadRevenueData(): void {
    this.dashboardService.getRevenueData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.revenueData = data;
        this.initRevenueChart();
      });
  }

  private loadProductivity(): void {
    this.dashboardService.getProductivityMetrics()
      .pipe(takeUntil(this.destroy$))
      .subscribe(metrics => this.productivity = metrics);
  }

  private loadRecentDeliveries(): void {
    this.dashboardService.getRecentDeliveries()
      .pipe(takeUntil(this.destroy$))
      .subscribe(deliveries => this.recentDeliveries = deliveries);
  }

  private loadStockLevels(): void {
    this.dashboardService.getStockLevels()
      .pipe(takeUntil(this.destroy$))
      .subscribe(levels => this.stockLevels = levels);
  }

  // Initialisation des graphiques (Chart.js)
  private initDocumentChart(): void {

    const ctx = document.getElementById('documentChart') as HTMLCanvasElement;
    if (ctx) {
      this.documentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: this.documentStats.map(s => s.type),
          datasets: [{
            data: this.documentStats.map(s => s.count),
            backgroundColor: ['#f0e222', '#0e0734', '#3b82f6', '#10b981', '#f59e0b']
          }]
        }
      });
    }
  }

  private initRevenueChart(): void {
    // À implémenter avec Chart.js
    const ctx = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (ctx) {
      this.revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.revenueData.map(d => d.month),
          datasets: [{
            label: 'Revenus (€)',
            data: this.revenueData.map(d => d.revenue),
            borderColor: '#f0e222',
            backgroundColor: 'rgba(240, 226, 34, 0.1)'
          }]
        }
      });
    }
  }

  // Actions sur les commandes
  onStartOrder(orderId: string): void {
    this.dashboardService.startOrder(orderId);
  }

  onCompleteOrder(orderId: string): void {
    this.dashboardService.completeOrder(orderId);
  }

  onDownloadFile(orderId: string): void {
    this.dashboardService.downloadFile(orderId);
  }

  // Filtrage et tri
  filterOrders(filter: 'all' | 'pending' | 'in-progress' | 'delayed'): void {
    this.selectedFilter = filter;
  }

  get filteredOrders(): OrderActivity[] {
    let filtered = this.todayOrders;
    
    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(order => order.status === this.selectedFilter);
    }

    // Tri
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortColumn) {
        case 'ref':
          comparison = a.ref.localeCompare(b.ref);
          break;
        case 'client':
          comparison = a.client.localeCompare(b.client);
          break;
        case 'eta':
          comparison = a.eta.getTime() - b.eta.getTime();
          break;
        case 'priority':
          const priorityOrder = { 'rush': 0, 'urgent': 1, 'normal': 2 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  sortBy(column: 'ref' | 'client' | 'eta' | 'priority'): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  // Helpers pour le template
  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'status-pending',
      'in-progress': 'status-in-progress',
      'completed': 'status-completed',
      'delayed': 'status-delayed'
    };
    return statusMap[status] || 'status-pending';
  }

  getStatusLabel(status: string): string {
    const labelMap: { [key: string]: string } = {
      'pending': 'En attente',
      'in-progress': 'En cours',
      'completed': 'Terminé',
      'delayed': 'En retard'
    };
    return labelMap[status] || status;
  }

  getPriorityClass(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      'rush': 'priority-rush',
      'urgent': 'priority-urgent',
      'normal': 'priority-normal'
    };
    return priorityMap[priority] || 'priority-normal';
  }

  getAlertClass(severity: string): string {
    const severityMap: { [key: string]: string } = {
      'high': 'alert-high',
      'medium': 'alert-medium',
      'low': 'alert-low'
    };
    return severityMap[severity] || 'alert-medium';
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('fr-FR', { 
      day: '2-digit',
      month: 'short',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(value);
  }

  getStockStatus(level: StockLevel): 'critical' | 'low' | 'normal' {
    const percentage = (level.current / level.threshold) * 100;
    if (percentage < 50) return 'critical';
    if (percentage < 75) return 'low';
    return 'normal';
  }

  onOrderSupplies(): void {
    console.log('Commander des consommables');
    // Navigation vers la page de commande ou ouverture d'un modal
  }

  onNewManualTicket(): void {
    console.log('Créer un nouveau ticket manuel');
    // Navigation ou ouverture d'un modal
  }

  onViewAllOrders(): void {
    console.log('Voir toutes les commandes');
    // Navigation vers la page complète des commandes
  }
}
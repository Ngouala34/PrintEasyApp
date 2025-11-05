
// src/app/components/dashboard-printer/dashboard-printer.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { KPIData, OrderActivity, Alert, DocumentTypeStats, RevenueData, ProductivityMetrics, RecentDelivery, StockLevel, PrinterDashboardService } from '../../../core/services/admin.service';
import { Chart, registerables, ChartConfiguration, TooltipItem } from 'chart.js';
import { IOrderResponse, OrderSummary } from '../../../core/models/order';
import { OrderService } from '../../../core/services/order.service';
import { Router, RouterOutlet } from '@angular/router';

// Enregistrer tous les composants de Chart.js
Chart.register(...registerables);

// Nouvelle interface pour les revenus par type de document
export interface RevenueByType {
  type: string;
  revenue: number;
  count: number;
}

@Component({
  selector: 'app-dashboard-printer',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './dashboard-printer.component.html',
  styleUrls: ['./dashboard-printer.component.scss']
})
export class DashboardPrinterComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  // Données du dashboard - utiliser les données réelles
  realOrders: IOrderResponse[] = [];
  orders = signal<OrderSummary[]>([]);
  
  // Données du service PrinterDashboardService (pour les autres sections)
  kpis: KPIData | null = null;
  alerts: Alert[] = [];
  documentStats: DocumentTypeStats[] = [];
  revenueData: RevenueData[] = [];
  revenueByType: RevenueByType[] = [];
  productivity: ProductivityMetrics | null = null;
  recentDeliveries: RecentDelivery[] = [];
  stockLevels: StockLevel[] = [];

  // Filtres et tri pour les commandes
  selectedFilter: 'all' | 'pending' | 'in_progress' | 'delayed' | 'printed' | 'cancelled' = 'all';
  sortColumn: 'ref' | 'client' | 'eta' | 'priority' | 'type' = 'eta';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Charts
  documentChart: Chart | null = null;
  revenueChart: Chart | null = null;
  revenueByTypeChart: Chart | null = null;

  // Flag pour indiquer que les données sont prêtes
  private chartsReady = false;
  private isMobile = false;

  constructor(
    private router: Router,
    private dashboardService: PrinterDashboardService, 
    private orderService: OrderService
  ) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    // Charger toutes les données du dashboard
    this.loadAllData();
  }

  private loadAllData(): void {
    // Charger les commandes réelles en premier
    this.loadRealOrders();
    
    // Charger les autres données du dashboard
    this.loadKpis();
    this.loadAlerts();
    this.loadDocumentStats();
    this.loadRevenueData();
    this.loadRevenueByType();
    this.loadProductivity();
    this.loadRecentDeliveries();
    this.loadStockLevels();
  }

  private loadRealOrders(): void {
    this.orderService.loadOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: IOrderResponse[]) => {
          this.realOrders = data;
          const formattedOrders = data.map(order => this.formatOrder(order));
          this.orders.set(formattedOrders);
          
          // Recalculer les KPIs basés sur les vraies données
          this.calculateRealKPIs();
          
          // Recalculer les stats de documents
          this.calculateDocumentStats();
          
          console.log('Commandes chargées:', data.length);
        },
        error: (error) => {
          console.error(' Erreur lors du chargement des commandes:', error);
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
      total: parseFloat(order.total_price) || 0,
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
      createdAt: new Date(order.created_at),
      updatedAt: new Date(order.updated_at)
    };
  }

  // Calculer les KPIs basés sur les vraies données
  private calculateRealKPIs(): void {
    if (this.realOrders.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const pendingOrders = this.realOrders.filter(o => o.status === 'pending').length;
    const inProgress = this.realOrders.filter(o => o.status === 'in_progress').length;
    
    const completedThisMonth = this.realOrders.filter(o => {
      const orderDate = new Date(o.created_at);
      return o.status === 'printed' && orderDate >= thirtyDaysAgo;
    }).length;

    // Livraisons du jour (orders avec livraison prévue aujourd'hui)
    const deliveriesToday = this.realOrders.filter(o => {
      const orderDate = new Date(o.created_at);
      return orderDate.toDateString() === today.toDateString();
    }).length;

    // Revenus du mois en cours
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthlyRevenue = this.realOrders
      .filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate.getMonth() === currentMonth && 
               orderDate.getFullYear() === currentYear;
      })
      .reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0);

    this.kpis = {
      pendingOrders,
      inProgress,
      completedThisMonth,
      deliveriesToday,
      monthlyRevenue
    };
  }

  // Calculer les statistiques de documents basées sur les vraies données
  private calculateDocumentStats(): void {
    if (this.realOrders.length === 0) return;

    const typeCount: { [key: string]: number } = {};
    
    this.realOrders.forEach(order => {
      const type = order.document_type || 'Autre';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const total = this.realOrders.length;
    this.documentStats = Object.entries(typeCount)
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    // Recalculer les revenus par type
    this.calculateRevenueByType();
    
    // Réinitialiser les charts si prêts
    if (this.chartsReady) {
      this.initChartsIfReady();
    }
  }

  // Calculer les revenus par type de document
  private calculateRevenueByType(): void {
    if (this.realOrders.length === 0) return;

    const typeRevenue: { [key: string]: { revenue: number; count: number } } = {};
    
    this.realOrders.forEach(order => {
      const type = order.document_type || 'Autre';
      const revenue = parseFloat(order.total_price) || 0;
      
      if (!typeRevenue[type]) {
        typeRevenue[type] = { revenue: 0, count: 0 };
      }
      
      typeRevenue[type].revenue += revenue;
      typeRevenue[type].count += 1;
    });

    this.revenueByType = Object.entries(typeRevenue)
      .map(([type, data]) => ({
        type,
        revenue: data.revenue,
        count: data.count
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  ngAfterViewInit(): void {
    // S'assurer que les charts sont créés après le rendu initial
    this.chartsReady = true;
    this.initChartsIfReady();
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
    if (this.revenueByTypeChart) {
      this.revenueByTypeChart.destroy();
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
    this.updateChartsResponsive();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  // Chargement des données du PrinterDashboardService (pour les autres sections)
  private loadKpis(): void {
    // Les KPIs réels sont calculés à partir des orders, pas besoin du service
    // Mais on garde la méthode pour la compatibilité
  }

  private loadAlerts(): void {
    this.dashboardService.getAlerts()
      .pipe(takeUntil(this.destroy$))
      .subscribe(alerts => this.alerts = alerts);
  }

  private loadDocumentStats(): void {
    // Les stats sont calculées à partir des vraies commandes
    // On garde la méthode pour la compatibilité
  }

  private loadRevenueData(): void {
    this.dashboardService.getRevenueData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.revenueData = data;
        this.initChartsIfReady();
      });
  }

  private loadRevenueByType(): void {
    // Les revenus par type sont calculés à partir des vraies commandes
    // On garde la méthode pour la compatibilité
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

  // Vérifier si on peut initialiser les charts
  private initChartsIfReady(): void {
    if (this.chartsReady && this.documentStats.length > 0 && this.revenueData.length > 0 && this.revenueByType.length > 0) {
      setTimeout(() => {
        this.initDocumentChart();
        this.initRevenueChart();
        this.initRevenueByTypeChart();
      }, 100);
    }
  }

  // Mettre à jour les charts pour le responsive
  private updateChartsResponsive(): void {
    if (this.documentChart) {
      this.documentChart.resize();
    }
    if (this.revenueChart) {
      this.revenueChart.resize();
    }
    if (this.revenueByTypeChart) {
      this.revenueByTypeChart.resize();
    }
  }

  // Initialisation des graphiques avec design amélioré
  private initDocumentChart(): void {
    if (this.documentChart) {
      this.documentChart.destroy();
    }

    const ctx = document.getElementById('documentChart') as HTMLCanvasElement;
    if (ctx) {
      const documentChartConfig: ChartConfiguration<'doughnut'> = {
        type: 'doughnut',
        data: {
          labels: this.documentStats.map(s => s.type),
          datasets: [{
            data: this.documentStats.map(s => s.count),
            backgroundColor: [
              '#6366F1', '#10B981', '#F59E0B', '#EF4444', 
              '#8B5CF6', '#06B6D4', '#F97316'
            ],
            borderColor: '#ffffff',
            borderWidth: 3,
            borderRadius: 8,
            spacing: 2,
            hoverOffset: 15
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: this.isMobile ? '50%' : '60%',
          plugins: {
            legend: {
              position: this.isMobile ? 'bottom' : 'right',
              labels: {
                padding: 15,
                usePointStyle: true,
                pointStyle: 'circle',
                font: {
                  size: this.isMobile ? 11 : 12,
                  family: "'Inter', sans-serif"
                },
                color: '#374151'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleFont: {
                size: 12,
                family: "'Inter', sans-serif"
              },
              bodyFont: {
                size: 11,
                family: "'Inter', sans-serif"
              },
              padding: 10,
              cornerRadius: 8,
              displayColors: true,
              callbacks: {
                label: (context: TooltipItem<'doughnut'>) => {
                  const label = context.label || '';
                  const value = context.parsed;
                  const data = context.dataset.data;
                  const total = data.reduce((sum: number, current: number) => sum + current, 0);
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          },
          animation: {
            duration: 1000,
            easing: 'easeOutQuart'
          }
        }
      };

      this.documentChart = new Chart(ctx, documentChartConfig);
    }
  }

  private initRevenueChart(): void {
    if (this.revenueChart) {
      this.revenueChart.destroy();
    }

    const ctx = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (ctx) {
      const revenueChartConfig: ChartConfiguration<'line'> = {
        type: 'line',
        data: {
          labels: this.revenueData.map(d => d.month),
          datasets: [{
            label: 'Revenus (XAF)',
            data: this.revenueData.map(d => d.revenue),
            borderColor: '#6366F1',
            backgroundColor: this.createGradient(ctx, '#6366F1'),
            borderWidth: 4,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#6366F1',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: '#6366F1',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleFont: {
                size: 12,
                family: "'Inter', sans-serif"
              },
              bodyFont: {
                size: 11,
                family: "'Inter', sans-serif"
              },
              padding: 10,
              cornerRadius: 8,
              displayColors: false,
              callbacks: {
                label: (context: TooltipItem<'line'>) => {
                  const value = context.parsed.y;
                  return `Revenus: ${this.formatCurrency(Number(value))}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)',
                drawTicks: false
              },
              ticks: {
                font: {
                  size: this.isMobile ? 10 : 11,
                  family: "'Inter', sans-serif"
                },
                color: '#6B7280',
                callback: (value) => {
                  return this.formatCurrency(Number(value));
                }
              },
              border: {
                display: false
              }
            },
            x: {
              grid: {
                display: false,
                drawTicks: false
              },
              ticks: {
                font: {
                  size: this.isMobile ? 10 : 11,
                  family: "'Inter', sans-serif"
                },
                color: '#6B7280'
              },
              border: {
                display: false
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          },
          animation: {
            duration: 1000,
            easing: 'easeOutQuart' as const
          }
        }
      };

      this.revenueChart = new Chart(ctx, revenueChartConfig);
    }
  }

  private initRevenueByTypeChart(): void {
    if (this.revenueByTypeChart) {
      this.revenueByTypeChart.destroy();
    }

    const ctx = document.getElementById('revenueByTypeChart') as HTMLCanvasElement;
    if (ctx) {
      const revenueByTypeChartConfig: ChartConfiguration<'bar'> = {
        type: 'bar',
        data: {
          labels: this.revenueByType.map(d => d.type),
          datasets: [{
            label: 'Revenus (XAF)',
            data: this.revenueByType.map(d => d.revenue),
            backgroundColor: this.createBarGradient(ctx),
            borderColor: '#ffffff',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
            barPercentage: 0.7,
            categoryPercentage: 0.8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: this.isMobile ? 'y' : 'x',
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleFont: {
                size: 12,
                family: "'Inter', sans-serif"
              },
              bodyFont: {
                size: 11,
                family: "'Inter', sans-serif"
              },
              padding: 10,
              cornerRadius: 8,
              displayColors: true,
              callbacks: {
                label: (context: TooltipItem<'bar'>) => {
                  const value = context.parsed.y ?? context.parsed.x;
                  const dataItem = this.revenueByType[context.dataIndex];
                  return [
                    `Revenus: ${this.formatCurrency(Number(value))}`,
                    `Commandes: ${dataItem.count}`
                  ];
                },
                afterLabel: (context: TooltipItem<'bar'>) => {
                  const dataItem = this.revenueByType[context.dataIndex];
                  const totalRevenue = this.revenueByType.reduce((sum, item) => sum + item.revenue, 0);
                  const percentage = ((dataItem.revenue / totalRevenue) * 100).toFixed(1);
                  return `Part: ${percentage}% du total`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)',
                drawTicks: false
              },
              ticks: {
                font: {
                  size: this.isMobile ? 10 : 11,
                  family: "'Inter', sans-serif"
                },
                color: '#6B7280',
                callback: (value) => {
                  if (this.isMobile) {
                    return this.formatCurrencyCompact(Number(value));
                  }
                  return this.formatCurrency(Number(value));
                }
              },
              border: {
                display: false
              }
            },
            x: {
              grid: {
                display: false,
                drawTicks: false
              },
              ticks: {
                font: {
                  size: this.isMobile ? 10 : 11,
                  family: "'Inter', sans-serif"
                },
                color: '#6B7280'
              },
              border: {
                display: false
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          },
          animation: {
            duration: 1000,
            easing: 'easeOutQuart' as const
          }
        }
      };

      this.revenueByTypeChart = new Chart(ctx, revenueByTypeChartConfig);
    }
  }

  private createGradient(ctx: HTMLCanvasElement, color: string): CanvasGradient {
    const gradient = ctx.getContext('2d')!.createLinearGradient(0, 0, 0, 400);
    
    if (color === '#6366F1') {
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.05)');
    } else {
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.05)');
    }
    
    return gradient;
  }

  private createBarGradient(ctx: HTMLCanvasElement): CanvasGradient[] {
    const colors = [
      'rgba(99, 102, 241, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(139, 92, 246, 0.8)',
      'rgba(6, 182, 212, 0.8)',
      'rgba(249, 115, 22, 0.8)'
    ];

    return colors.map((color) => {
      const gradient = ctx.getContext('2d')!.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color.replace('0.8', '0.5'));
      return gradient;
    });
  }

  // Actions sur les commandes - Utiliser les vraies données
  onStartOrder(orderId: string): void {
    this.dashboardService.startOrder(orderId).subscribe({
      next: (updatedOrder) => {
        //  Met à jour localement après succès de l’API
        const index = this.realOrders.findIndex(o => o.id === updatedOrder.id);
        if (index !== -1) {
          this.realOrders[index] = updatedOrder;
        }

        //  Rafraîchir la vue
        const formattedOrders = this.realOrders.map(order => this.formatOrder(order));
        this.orders.set(formattedOrders);

        // Recalculer les KPIs
        this.calculateRealKPIs();

        console.log(` Commande ${updatedOrder.order_number} passée en "in_progress"`);
      },
      error: (error) => {
        console.error(' Erreur lors du changement de statut :', error);
        alert('Une erreur est survenue lors du démarrage de la production.');
      }
    });
  }


  onCompleteOrder(orderId: string): void { 
    this.dashboardService.completeOrder(orderId).subscribe({
      next: () => {
        console.log('Commande marquée comme imprimée et KPI mis à jour !');
        // Les données locales et KPIs sont déjà mis à jour par le service
      },
      error: (err) => {
        console.error('Erreur lors du marquage comme imprimé :', err);
      }
    });
  }


  onViewOrderDetails(orderId: string): void {
    const order = this.realOrders.find(o => o.id === orderId);
    if (order) {
      console.log('Détails de la commande :', order);
      this.router.navigate(['/dashboard-admin/document-detail', orderId]);
    } else {
      console.error('Commande non trouvée avec l’ID :', orderId);
    }
  }

  // Filtrage et tri - Appliqué sur les vraies données
  filterOrders(filter: 'all' | 'pending' | 'in_progress' | 'delayed' | 'printed' | 'cancelled'): void {
    this.selectedFilter = filter;
  }

  get filteredOrders(): IOrderResponse[] {
    let filtered = [...this.realOrders];
    
    // Appliquer le filtre
    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(order => order.status === this.selectedFilter);
    }

    // Appliquer le tri
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortColumn) {
        case 'ref':
          comparison = a.order_number.localeCompare(b.order_number);
          break;
        case 'client':
          comparison = a.user.full_name.localeCompare(b.user.full_name);
          break;
        case 'eta':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'type':
          comparison = a.document_type.localeCompare(b.document_type);
          break;
        case 'priority':
          const priorityOrder: { [key: string]: number } = { 'rush': 0, 'urgent': 1, 'normal': 2 };
          const aPriority = a.priority || 'normal';
          const bPriority = b.priority || 'normal';
          comparison = (priorityOrder[aPriority] || 2) - (priorityOrder[bPriority] || 2);
          break;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  sortBy(column: 'ref' | 'client' | 'eta' | 'priority' | 'type'): void {
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
    'in_progress': 'status-in-progress',
    'printed': 'status-printed',
    'delivered': 'status-delivered',
    'cancelled': 'status-cancelled'
  };
  return statusMap[status] || 'status-pending';
}


getStatusLabel(status: string): string {
  const labelMap: { [key: string]: string } = {
    'pending': 'En attente',
    'in_progress': 'En cours',     // si ton API renvoie in_progress (underscore)
    'printed': 'Imprimé',
    'delivered': 'Livré',
    'cancelled': 'Annulé'
  };
  return labelMap[status] || status;
}


  getPriorityClass(priority: string | undefined): string {
    const priorityMap: { [key: string]: string } = {
      'rush': 'priority-rush',
      'urgent': 'priority-urgent',
      'normal': 'priority-normal'
    };
    return priorityMap[priority || 'normal'] || 'priority-normal';
  }

  getAlertClass(severity: string): string {
    const severityMap: { [key: string]: string } = {
      'high': 'alert-high',
      'medium': 'alert-medium',
      'low': 'alert-low'
    };
    return severityMap[severity] || 'alert-medium';
  }

  formatTime(date: Date | string): string {
    return new Date(date).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  formatDateTime(date: Date | string): string {
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
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  formatCurrencyCompact(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M XAF';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'k XAF';
    }
    return this.formatCurrency(value);
  }

  getStockStatus(level: StockLevel): 'critical' | 'low' | 'normal' {
    const percentage = (level.current / level.threshold) * 100;
    if (percentage < 50) return 'critical';
    if (percentage < 75) return 'low';
    return 'normal';
  }

  onOrderSupplies(): void {
    console.log('Commander des consommables');
  }

  onNewManualTicket(): void {
    console.log('Créer un nouveau ticket manuel');
  }

  onViewAllOrders(): void {
    console.log('Voir toutes les commandes');
  }




}
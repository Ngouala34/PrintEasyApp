// src/app/components/dashboard-printer/dashboard-printer.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { KPIData, OrderActivity, Alert, DocumentTypeStats, RevenueData, ProductivityMetrics, RecentDelivery, StockLevel, PrinterDashboardService } from '../../../core/services/admin.service';
import { Chart, registerables, ChartConfiguration, TooltipItem } from 'chart.js';

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
  imports: [CommonModule],
  templateUrl: './dashboard-printer.component.html',
  styleUrls: ['./dashboard-printer.component.scss']
})
export class DashboardPrinterComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  // Données du dashboard
  kpis: KPIData | null = null;
  todayOrders: OrderActivity[] = [];
  alerts: Alert[] = [];
  documentStats: DocumentTypeStats[] = [];
  revenueData: RevenueData[] = [];
  revenueByType: RevenueByType[] = [];
  productivity: ProductivityMetrics | null = null;
  recentDeliveries: RecentDelivery[] = [];
  stockLevels: StockLevel[] = [];

  // Filtres et tri pour les commandes
  selectedFilter: 'all' | 'pending' | 'in-progress' | 'delayed' = 'all';
  sortColumn: 'ref' | 'client' | 'eta' | 'priority' = 'eta';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Charts
  documentChart: Chart | null = null;
  revenueChart: Chart | null = null;
  revenueByTypeChart: Chart | null = null;

  // Flag pour indiquer que les données sont prêtes
  private chartsReady = false;
  private isMobile = false;

  constructor(private dashboardService: PrinterDashboardService) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    // Charger toutes les données du dashboard
    this.loadKpis();
    this.loadOrders();
    this.loadAlerts();
    this.loadDocumentStats();
    this.loadRevenueData();
    this.loadRevenueByType();
    this.loadProductivity();
    this.loadRecentDeliveries();
    this.loadStockLevels();
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
        this.initChartsIfReady();
      });
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
    // Données simulées pour les revenus par type de document
    this.revenueByType = [
      { type: 'Flyers', revenue: 8450, count: 45 },
      { type: 'Cartes de visite', revenue: 6230, count: 38 },
      { type: 'Affiches', revenue: 5120, count: 25 },
      { type: 'Brochures', revenue: 3890, count: 18 },
      { type: 'Stickers', revenue: 2950, count: 14 },
      { type: 'Dépliants', revenue: 2180, count: 12 },
      { type: 'Catalogues', revenue: 1850, count: 8 }
    ];
    this.initChartsIfReady();
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
    // Détruire le chart existant
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
              '#6366F1', // Indigo
              '#10B981', // Emerald
              '#F59E0B', // Amber
              '#EF4444', // Red
              '#8B5CF6', // Violet
              '#06B6D4', // Cyan
              '#F97316'  // Orange
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
                  // Type-safe reduction
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
    // Détruire le chart existant
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
    // Détruire le chart existant
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
            label: 'Revenus (€)',
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
          indexAxis: this.isMobile ? 'y' : 'x', // Barres verticales sur desktop, horizontales sur mobile
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
      'rgba(99, 102, 241, 0.8)',   // Indigo
      'rgba(16, 185, 129, 0.8)',   // Emerald
      'rgba(245, 158, 11, 0.8)',   // Amber
      'rgba(239, 68, 68, 0.8)',    // Red
      'rgba(139, 92, 246, 0.8)',   // Violet
      'rgba(6, 182, 212, 0.8)',    // Cyan
      'rgba(249, 115, 22, 0.8)'    // Orange
    ];

    return colors.map((color, index) => {
      const gradient = ctx.getContext('2d')!.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color.replace('0.8', '0.5'));
      return gradient;
    });
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
      currency: 'xaf',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  formatCurrencyCompact(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M €';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'k €';
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
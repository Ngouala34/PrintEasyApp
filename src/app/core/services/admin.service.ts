// src/app/services/printer-dashboard.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface KPIData {
  pendingOrders: number;
  inProgress: number;
  completedThisMonth: number;
  deliveriesToday: number;
  monthlyRevenue: number;
}

export interface OrderActivity {
  id: string;
  ref: string;
  client: string;
  type: string;
  format: string;
  quantity: number;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  eta: Date;
  priority: 'normal' | 'urgent' | 'rush';
}

export interface Alert {
  type: 'delayed' | 'priority' | 'blocked';
  orderId: string;
  ref: string;
  client: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export interface DocumentTypeStats {
  type: string;
  count: number;
  percentage: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
}

export interface ProductivityMetrics {
  avgProductionTime: number; // en heures
  reprintRate: number; // en pourcentage
  punctualityRate: number; // en pourcentage
}

export interface RecentDelivery {
  ref: string;
  client: string;
  timestamp: Date;
  status: 'delivered' | 'completed';
}

export interface StockLevel {
  item: string;
  current: number;
  threshold: number;
  unit: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrinterDashboardService {





  
  // BehaviorSubjects pour données réactives
  private kpisSubject = new BehaviorSubject<KPIData>({
    pendingOrders: 23,
    inProgress: 8,
    completedThisMonth: 147,
    deliveriesToday: 12,
    monthlyRevenue: 18450
  });

  private ordersSubject = new BehaviorSubject<OrderActivity[]>([
    {
      id: '1',
      ref: 'CMD-2024-1234',
      client: 'Café Moderne',
      type: 'Flyers',
      format: 'A5',
      quantity: 1000,
      status: 'pending',
      eta: new Date(Date.now() + 3600000),
      priority: 'urgent'
    },
    {
      id: '2',
      ref: 'CMD-2024-1235',
      client: 'Tech Solutions',
      type: 'Cartes de visite',
      format: '85x55mm',
      quantity: 500,
      status: 'in-progress',
      eta: new Date(Date.now() + 7200000),
      priority: 'rush'
    },
    {
      id: '3',
      ref: 'CMD-2024-1236',
      client: 'Restaurant Le Jardin',
      type: 'Menus',
      format: 'A4',
      quantity: 200,
      status: 'pending',
      eta: new Date(Date.now() + 10800000),
      priority: 'normal'
    },
    {
      id: '4',
      ref: 'CMD-2024-1237',
      client: 'Sport Center',
      type: 'Affiches',
      format: 'A3',
      quantity: 50,
      status: 'in-progress',
      eta: new Date(Date.now() + 14400000),
      priority: 'normal'
    },
    {
      id: '5',
      ref: 'CMD-2024-1238',
      client: 'École Primaire',
      type: 'Brochures',
      format: 'A5',
      quantity: 300,
      status: 'delayed',
      eta: new Date(Date.now() - 3600000),
      priority: 'urgent'
    },
    {
      id: '6',
      ref: 'CMD-2024-1239',
      client: 'Boutique Mode',
      type: 'Stickers',
      format: 'Rond 5cm',
      quantity: 2000,
      status: 'pending',
      eta: new Date(Date.now() + 18000000),
      priority: 'normal'
    }
  ]);

  private alertsSubject = new BehaviorSubject<Alert[]>([
    {
      type: 'delayed',
      orderId: '5',
      ref: 'CMD-2024-1238',
      client: 'École Primaire',
      message: 'Délai dépassé de 1h',
      severity: 'high'
    },
    {
      type: 'priority',
      orderId: '1',
      ref: 'CMD-2024-1234',
      client: 'Café Moderne',
      message: 'Commande urgente - livraison dans 1h',
      severity: 'high'
    },
    {
      type: 'blocked',
      orderId: '7',
      ref: 'CMD-2024-1240',
      client: 'Agence Pub',
      message: 'Fichier corrompu - en attente client',
      severity: 'medium'
    }
  ]);

  private documentStatsSubject = new BehaviorSubject<DocumentTypeStats[]>([
    { type: 'Flyers', count: 45, percentage: 32 },
    { type: 'Cartes de visite', count: 38, percentage: 27 },
    { type: 'Affiches', count: 25, percentage: 18 },
    { type: 'Brochures', count: 18, percentage: 13 },
    { type: 'Stickers', count: 14, percentage: 10 }
  ]);

  private revenueDataSubject = new BehaviorSubject<RevenueData[]>([
    { month: 'Mai', revenue: 14200 },
    { month: 'Juin', revenue: 16800 },
    { month: 'Juillet', revenue: 15400 },
    { month: 'Août', revenue: 13900 },
    { month: 'Septembre', revenue: 17200 },
    { month: 'Octobre', revenue: 18450 }
  ]);

  private productivitySubject = new BehaviorSubject<ProductivityMetrics>({
    avgProductionTime: 3.2,
    reprintRate: 2.4,
    punctualityRate: 94.5
  });

  private recentDeliveriesSubject = new BehaviorSubject<RecentDelivery[]>([
    {
      ref: 'CMD-2024-1230',
      client: 'Boulangerie Artisan',
      timestamp: new Date(Date.now() - 1800000),
      status: 'delivered'
    },
    {
      ref: 'CMD-2024-1229',
      client: 'Coiffeur Élégance',
      timestamp: new Date(Date.now() - 3600000),
      status: 'completed'
    },
    {
      ref: 'CMD-2024-1228',
      client: 'Pharmacie Centrale',
      timestamp: new Date(Date.now() - 5400000),
      status: 'delivered'
    }
  ]);

  private stockLevelsSubject = new BehaviorSubject<StockLevel[]>([
    { item: 'Papier A4 Premium', current: 12, threshold: 20, unit: 'ramettes' },
    { item: 'Encre Cyan', current: 8, threshold: 15, unit: '%' },
    { item: 'Papier A3 Mat', current: 5, threshold: 10, unit: 'ramettes' }
  ]);

  constructor() {}

  // Observables publics
  getKpis(): Observable<KPIData> {
    return this.kpisSubject.asObservable();
  }

  getTodayOrders(): Observable<OrderActivity[]> {
    return this.ordersSubject.asObservable();
  }

  getAlerts(): Observable<Alert[]> {
    return this.alertsSubject.asObservable();
  }

  getDocumentStats(): Observable<DocumentTypeStats[]> {
    return this.documentStatsSubject.asObservable();
  }

  getRevenueData(): Observable<RevenueData[]> {
    return this.revenueDataSubject.asObservable();
  }

  getProductivityMetrics(): Observable<ProductivityMetrics> {
    return this.productivitySubject.asObservable();
  }

  getRecentDeliveries(): Observable<RecentDelivery[]> {
    return this.recentDeliveriesSubject.asObservable();
  }

  getStockLevels(): Observable<StockLevel[]> {
    return this.stockLevelsSubject.asObservable();
  }

  // Actions sur les commandes
  startOrder(orderId: string): void {
    const orders = this.ordersSubject.value;
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, status: 'in-progress' as const } : order
    );
    this.ordersSubject.next(updatedOrders);

    // Mise à jour des KPIs
    const kpis = this.kpisSubject.value;
    this.kpisSubject.next({
      ...kpis,
      pendingOrders: kpis.pendingOrders - 1,
      inProgress: kpis.inProgress + 1
    });
  }

  completeOrder(orderId: string): void {
    const orders = this.ordersSubject.value;
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, status: 'completed' as const } : order
    );
    this.ordersSubject.next(updatedOrders);

    // Mise à jour des KPIs
    const kpis = this.kpisSubject.value;
    this.kpisSubject.next({
      ...kpis,
      inProgress: kpis.inProgress - 1,
      completedThisMonth: kpis.completedThisMonth + 1
    });

    // Ajout aux livraisons récentes
    const order = orders.find(o => o.id === orderId);
    // if (order) {
    //   const deliveries = this.recentDeliveriesSubject.value;
    //   this.recentDeliveriesSubject.next([
    //     {
    //       ref: order.ref,
    //       client: order.client,
    //       timestamp: new Date(),
    //       status: 'completed'
    //     },
    //     ...deliveries
    //   ].slice(0, 5)); // Garder seulement les 5 dernières
    // }
  }

  downloadFile(orderId: string): void {
    // Simulation de téléchargement
    console.log(`Téléchargement du fichier pour la commande ${orderId}`);
    // Dans un cas réel, faire un appel API pour télécharger le fichier
  }
}
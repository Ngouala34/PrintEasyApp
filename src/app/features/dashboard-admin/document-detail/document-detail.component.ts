// src/app/components/document-detail/document-detail.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { IOrderResponse } from '../../../core/models/order';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.scss']
})
export class DocumentDetailComponent implements OnInit {
  // Utilisation des signals Angular pour la réactivité
  order = signal<IOrderResponse | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  // État pour l'ajout de note
  isAddingNote = signal<boolean>(false);
  noteText = signal<string>('');

  // Computed signals pour les traductions et états dérivés
  statusLabel = computed(() => {
    const status = this.order()?.status;
    return this.translateStatus(status || '');
  });

  statusClass = computed(() => {
    const status = this.order()?.status;
    return this.getStatusClass(status || '');
  });

  // Vérifier si des informations de livraison existent
  hasDeliveryInfo = computed(() => {
    const ord = this.order();
    return !!(ord?.delivery_address || ord?.delivery_city || ord?.delivery_phone);
  });

  // Formater les dates
  formattedCreatedAt = computed(() => {
    const date = this.order()?.created_at;
    return date ? this.formatDate(date) : '';

  });

  formattedUpdatedAt = computed(() => {
    const date = this.order()?.updated_at;
    return date ? this.formatDate(date) : '';
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    // Récupérer l'ID de la commande depuis la route
    const orderId = this.route.snapshot.paramMap.get('id');
    
    if (orderId) {
      this.loadOrderDetails(orderId);
    } else {
      this.error.set('ID de commande non fourni');
      this.isLoading.set(false);
    }
  }

  /**
   * Charger les détails de la commande depuis l'API
   */
  private loadOrderDetails(orderId: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.orderService.getOrderById(orderId).subscribe({
      next: (response) => {
        this.order.set(response);
        this.noteText.set(response.note || '');
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement de la commande:', err);
        this.error.set('Impossible de charger les détails de la commande');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Action: Démarrer la production
   */
  onStartProduction(): void {
    const currentOrder = this.order();
    if (!currentOrder) return;

    // Confirmer l'action
    if (!confirm('Voulez-vous vraiment démarrer la production de cette commande ?')) {
      return;
    }

    // Mettre à jour le statut localement (optimistic update)
    this.order.update(order => 
      order ? { ...order, status: 'in_progress' } : null
    );

    // TODO: Appeler l'API pour mettre à jour le statut
    // this.orderService.updateOrderStatus(currentOrder.id, 'in_progress').subscribe(...)
    
    console.log('Production démarrée pour la commande:', currentOrder.order_number);
  }

  /**
   * Action: Marquer comme imprimé
   */
  onMarkAsPrinted(): void {
    const currentOrder = this.order();
    if (!currentOrder) return;

    if (!confirm('Voulez-vous marquer cette commande comme imprimée ?')) {
      return;
    }

    // Mise à jour optimiste
    this.order.update(order => 
      order ? { ...order, status: 'printed' } : null
    );

    // TODO: Appeler l'API
    console.log('Commande marquée comme imprimée:', currentOrder.order_number);
  }

  /**
   * Action: Télécharger le fichier
   */
  onDownloadFile(): void {
    const currentOrder = this.order();
    if (!currentOrder?.document_url) {
      alert('Aucun fichier disponible pour cette commande');
      return;
    }

    // Ouvrir le fichier dans un nouvel onglet ou déclencher le téléchargement
    window.open(currentOrder.document_url, '_blank');
    console.log('Téléchargement du fichier:', currentOrder.document_url);
  }

  /**
   * Afficher le formulaire d'ajout de note
   */
  onShowNoteForm(): void {
    this.isAddingNote.set(true);
  }

  /**
   * Annuler l'ajout de note
   */
  onCancelNote(): void {
    this.isAddingNote.set(false);
    this.noteText.set(this.order()?.note || '');
  }

  /**
   * Sauvegarder la note
   */
  onSaveNote(): void {
    const currentOrder = this.order();
    if (!currentOrder) return;

    const note = this.noteText().trim();

    // Mise à jour optimiste
    this.order.update(order => 
      order ? { ...order, note } : null
    );

    this.isAddingNote.set(false);

    // TODO: Appeler l'API pour sauvegarder la note
    // this.orderService.updateOrderNote(currentOrder.id, note).subscribe(...)
    
    console.log('Note sauvegardée pour la commande:', currentOrder.order_number, note);
  }

  /**
   * Retour à la liste des commandes
   */
  onGoBack(): void {
    this.router.navigate(['/dashboard']); // Ajuster selon votre routing
  }

  /**
   * Traduire le statut en français
   */
  private translateStatus(status: string): string {
    const translations: { [key: string]: string } = {
      'pending': 'En attente',
      'in_progress': 'En production',
      'printed': 'Imprimé',
      'delivered': 'Livré',
      'cancelled': 'Annulé'
    };
    return translations[status] || status;
  }

  /**
   * Obtenir la classe CSS du statut
   */
  private getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'status-pending',
      'in_progress': 'status-in-progress',
      'printed': 'status-printed',
      'delivered': 'status-delivered',
      'cancelled': 'status-cancelled'
    };
    return classes[status] || 'status-pending';
  }

  /**
   * Formater une date ISO en format lisible
   */
  private formatDate(isoDate: Date): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formater un prix
   */
  formatPrice(price: string | number): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF' // Adapter selon votre devise
    }).format(numPrice);
  }

  /**
   * Vérifier si le bouton doit être désactivé selon le statut
   */
  canStartProduction(): boolean {
    return this.order()?.status === 'pending';
  }

  canMarkAsPrinted(): boolean {
    const status = this.order()?.status;
    return status === 'in_progress';
  }

  hasDocument(): boolean {
    return !!this.order()?.document_url;
  }


  generateInvoice(): void {
  const order = this.order();
  if (!order) return;

  const doc = new jsPDF();

  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE DE COMMANDE', 14, 15);
  doc.setFontSize(11);
  doc.text(`Commande N°: ${order.order_number}`, 14, 25);
  doc.text(`Client: ${order.user.full_name}`, 14, 32);
  doc.text(`Email: ${order.user.email}`, 14, 39);

  autoTable(doc, {
    startY: 50,
    head: [['Type', 'Quantité', 'Prix unitaire', 'Total']],
    body: [
      [
        order.document_type,
        order.quantity,
        this.formatPrice(order.unit_price),
        this.formatPrice(order.total_price)
      ]
    ],
  });

  doc.save(`facture_${order.order_number}.pdf`);
}

openWhatsApp(): void {
  const phone = this.order()?.delivery_phone || '';
  if (!phone) {
    alert('Aucun numéro de livraison disponible.');
    return;
  }
  window.open(`https://wa.me/${phone}`, '_blank');
}
}
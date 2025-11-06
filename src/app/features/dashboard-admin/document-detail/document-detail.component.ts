// src/app/components/document-detail/document-detail.component.ts
import { Component, OnInit, signal, computed, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { IOrderResponse } from '../../../core/models/order';



@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.scss']
})
export class DocumentDetailComponent implements OnInit {
  @Input() orderId: string | number | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() orderUpdated = new EventEmitter<IOrderResponse>();

  // Signals
  order = signal<IOrderResponse | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  activeTab = signal<'details' | 'options' | 'notes'>('details');
  isAddingNote = signal<boolean>(false);
  noteText = signal<string>('');
  isGeneratingInvoice = signal<boolean>(false);

  // Computed
  statusLabel = computed(() => this.translateStatus(this.order()?.status || ''));
  statusClass = computed(() => this.getStatusClass(this.order()?.status || ''));
  statusIcon = computed(() => this.getStatusIcon(this.order()?.status || ''));
  
  hasDeliveryInfo = computed(() => {
    const ord = this.order();
    return !!(ord?.delivery_address || ord?.delivery_city || ord?.delivery_phone);
  });

  whatsappNumber = computed(() => {
    const phone = this.order()?.delivery_phone;
    return phone ? phone.replace(/[\s\-\(\)]/g, '') : null;
  });

  canStartProduction = computed(() => this.order()?.status === 'pending');
  canMarkAsPrinted = computed(() => this.order()?.status === 'in_progress');
  hasDocument = computed(() => !!this.order()?.document_url);

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    if (this.orderId) {
      this.loadOrderDetails(this.orderId.toString());
    }
  }

  /**
   * Charger les détails de la commande
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
        console.error('Erreur:', err);
        this.error.set('Impossible de charger les détails');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Fermer le modal
   */
  onClose(): void {
    this.closeModal.emit();
  }

  /**
   * Changer d'onglet
   */
  switchTab(tab: 'details' | 'options' | 'notes'): void {
    this.activeTab.set(tab);
  }

  /**
   * GÉNÉRATION DE FACTURE PDF avec jsPDF
   */
  async onGenerateInvoice(): Promise<void> {
    const currentOrder = this.order();
    if (!currentOrder) return;

    this.isGeneratingInvoice.set(true);

    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let y = 25;

      // En-tête avec fond coloré
      doc.setFillColor(14, 7, 52); // primary-dark
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      doc.setTextColor(240, 226, 34); // primary-yellow
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURE', pageWidth / 2, y, { align: 'center' });
      
      y += 12;
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(currentOrder.order_number, pageWidth / 2, y, { align: 'center' });
      
      y = 65;
      doc.setTextColor(14, 7, 52);

      // Informations en 2 colonnes
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMATIONS CLIENT', margin, y);
      doc.text('DÉTAILS COMMANDE', pageWidth / 2 + 10, y);
      
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Colonne gauche - Client
      doc.text(`${currentOrder.user.full_name}`, margin, y);
      y += 5;
      doc.setTextColor(100, 100, 100);
      doc.text(currentOrder.user.email, margin, y);
      y += 5;
      doc.text(`ID Client: #${currentOrder.user.id}`, margin, y);
      
      // Colonne droite - Dates
      const rightX = pageWidth / 2 + 10;
      y = 73;
      doc.setTextColor(14, 7, 52);
      doc.text(`Date: ${this.formatDateShort(currentOrder.created_at.toString())}`, rightX, y);
      y += 5;
      doc.text(`Statut: ${this.statusLabel()}`, rightX, y);
      y += 5;
      doc.text(`Type: ${currentOrder.document_type}`, rightX, y);

      y = 110;

      // Tableau des articles
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(14, 7, 52);
      doc.text('DESCRIPTION', margin + 3, y + 6);
      doc.text('QTÉ', pageWidth - 70, y + 6);
      doc.text('PRIX UNITAIRE', pageWidth - 50, y + 6);
      
      y += 15;
      doc.setFont('helvetica', 'normal');
      doc.text(currentOrder.document_type, margin + 3, y);
      doc.text(`${currentOrder.quantity}`, pageWidth - 70, y);
      doc.text(this.formatPrice(currentOrder.unit_price), pageWidth - 50, y);
      
      y += 8;
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      const specs = `${currentOrder.options.option_format} • ${currentOrder.options.option_color} • ${currentOrder.options.option_paper}`;
      doc.text(specs, margin + 3, y);

      y += 15;

      // Ligne de séparation
      doc.setDrawColor(14, 7, 52);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      
      y += 10;

      // Total
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(14, 7, 52);
      doc.text('TOTAL À PAYER', margin, y);
      doc.setFontSize(18);
      doc.setTextColor(16, 185, 129); // success
      doc.text(this.formatPrice(currentOrder.total_price), pageWidth - margin, y, { align: 'right' });

      // Livraison
      if (this.hasDeliveryInfo()) {
        y += 20;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(14, 7, 52);
        doc.text('ADRESSE DE LIVRAISON', margin, y);
        y += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        if (currentOrder.delivery_address) {
          doc.text(currentOrder.delivery_address, margin, y);
          y += 5;
        }
        if (currentOrder.delivery_city) {
          doc.text(`${currentOrder.delivery_neighborhood || ''} ${currentOrder.delivery_city}`, margin, y);
          y += 5;
        }
        if (currentOrder.delivery_phone) {
          doc.text(`Tél: ${currentOrder.delivery_phone}`, margin, y);
        }
      }

      // Pied de page
      const footerY = doc.internal.pageSize.height - 15;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('PrintEasy - Votre partenaire impression professionnelle', pageWidth / 2, footerY, { align: 'center' });

      doc.save(`Facture_${currentOrder.order_number}.pdf`);
      
    } catch (error) {
      console.error('Erreur PDF:', error);
      alert('Erreur lors de la génération. Installez jsPDF: npm install jspdf');
    } finally {
      this.isGeneratingInvoice.set(false);
    }
  }

  /**
   * Ouvrir WhatsApp
   */
  onOpenWhatsApp(): void {
    const number = this.whatsappNumber();
    if (!number) {
      alert('Aucun numéro de téléphone disponible');
      return;
    }

    const message = encodeURIComponent(
      `Bonjour ${this.order()?.user.full_name}, concernant votre commande ${this.order()?.order_number}`
    );
    window.open(`https://wa.me/${number}?text=${message}`, '_blank');
  }

  /**
   * Actions
   */
  onStartProduction(): void {
    if (!confirm('Démarrer la production ?')) return;
    
    this.order.update(order => 
      order ? { ...order, status: 'in_progress' } : null
    );
    
    const updated = this.order();
    if (updated) this.orderUpdated.emit(updated);
  }

  onMarkAsPrinted(): void {
    if (!confirm('Marquer comme imprimé ?')) return;
    
    this.order.update(order => 
      order ? { ...order, status: 'printed' } : null
    );
    
    const updated = this.order();
    if (updated) this.orderUpdated.emit(updated);
  }

  onDownloadFile(): void {
    const url = this.order()?.document_url;
    if (!url) {
      alert('Aucun fichier disponible');
      return;
    }
    window.open(url, '_blank');
  }

  onSaveNote(): void {
    const note = this.noteText().trim();
    this.order.update(order => order ? { ...order, note } : null);
    this.isAddingNote.set(false);
    
    const updated = this.order();
    if (updated) this.orderUpdated.emit(updated);
  }

  // Helpers
  private translateStatus(status: string): string {
    const map: Record<string, string> = {
      pending: 'En attente',
      in_progress: 'En production',
      printed: 'Imprimé',
      delivered: 'Livré',
      cancelled: 'Annulé'
    };
    return map[status] || status;
  }

  private getStatusClass(status: string): string {
    return `status-${status}`;
  }

  private getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      pending: 'fa-clock',
      in_progress: 'fa-spinner',
      printed: 'fa-check-circle',
      delivered: 'fa-truck',
      cancelled: 'fa-times-circle'
    };
    return icons[status] || 'fa-question';
  }

  formatPrice(price: string | number): string {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF'
    }).format(num);
  }

  private formatDateShort(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  download(orderId: string): void {
    this.orderService.downloadOrder(orderId).subscribe({
      next: (file: Blob) => {
        const url = window.URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = `commande_${orderId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Erreur lors du téléchargement :', err);
      }
    });
  }

}
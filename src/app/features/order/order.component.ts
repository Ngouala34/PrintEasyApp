// src/app/features/order/order.component.ts
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface OrderConfig {
  format: string;
  paperType: string;
  finishing: string;
  quantity: number;
  colorMode: string;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  preview?: string;
}

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent {
  currentStep = signal(1);
  uploadedFile = signal<UploadedFile | null>(null);
  isUploading = signal(false);
  isProcessing = signal(false);

  orderConfig = signal<OrderConfig>({
    format: 'a4',
    paperType: 'coated-135',
    finishing: 'none',
    quantity: 100,
    colorMode: 'color'
  });

  formats = [
    { id: 'a6', name: 'A6 (105x148mm)', price: 30 },
    { id: 'a5', name: 'A5 (148x210mm)', price: 50 },
    { id: 'a4', name: 'A4 (210x297mm)', price: 100 },
    { id: 'a3', name: 'A3 (297x420mm)', price: 200 }
  ];

  paperTypes = [
    { id: 'coated-135', name: 'Papier couché 135g', price: 0 },
    { id: 'coated-170', name: 'Papier couché 170g', price: 20 },
    { id: 'coated-300', name: 'Papier couché 300g', price: 50 },
    { id: 'recycled', name: 'Papier recyclé 120g', price: 10 }
  ];

  finishings = [
    { id: 'none', name: 'Aucune', price: 0 },
    { id: 'lamination-gloss', name: 'Pelliculage brillant', price: 50 },
    { id: 'lamination-matt', name: 'Pelliculage mat', price: 50 },
    { id: 'varnish', name: 'Vernis sélectif', price: 100 }
  ];

  colorModes = [
    { id: 'color', name: 'Couleur (CMJN)', price: 0 },
    { id: 'bw', name: 'Noir & Blanc', price: -30 }
  ];

  totalPrice = computed(() => {
    const config = this.orderConfig();
    const format = this.formats.find(f => f.id === config.format);
    const paper = this.paperTypes.find(p => p.id === config.paperType);
    const finishing = this.finishings.find(f => f.id === config.finishing);
    const colorMode = this.colorModes.find(c => c.id === config.colorMode);

    const basePrice = (format?.price || 0) + (paper?.price || 0) + 
                     (finishing?.price || 0) + (colorMode?.price || 0);
    
    return basePrice * config.quantity;
  });

  constructor(private router: Router) {}

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validation
      const maxSize = 50 * 1024 * 1024; // 50MB
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      
      if (file.size > maxSize) {
        alert('Fichier trop volumineux. Taille maximale : 50MB');
        return;
      }
      
      if (!allowedTypes.includes(file.type)) {
        alert('Format non supporté. Formats acceptés : PDF, JPG, PNG');
        return;
      }

      this.isUploading.set(true);

      // Simuler l'upload
      setTimeout(() => {
        const uploadedFile: UploadedFile = {
          name: file.name,
          size: file.size,
          type: file.type
        };

        // Générer preview pour images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            uploadedFile.preview = e.target?.result as string;
            this.uploadedFile.set(uploadedFile);
          };
          reader.readAsDataURL(file);
        } else {
          this.uploadedFile.set(uploadedFile);
        }

        this.isUploading.set(false);
      }, 1500);
    }
  }

  removeFile() {
    this.uploadedFile.set(null);
  }

  updateConfig(key: keyof OrderConfig, value: any) {
    this.orderConfig.update(config => ({
      ...config,
      [key]: value
    }));
  }

  nextStep() {
    if (this.currentStep() < 3) {
      this.currentStep.update(step => step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update(step => step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  canProceedToNextStep(): boolean {
    switch (this.currentStep()) {
      case 1:
        return this.uploadedFile() !== null;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  }

  processOrder() {
    this.isProcessing.set(true);
    
    // Simuler le traitement
    setTimeout(() => {
      this.isProcessing.set(false);
      // Rediriger vers la page de paiement
      this.router.navigate(['/payment'], { 
        queryParams: { amount: this.totalPrice() }
      });
    }, 2000);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
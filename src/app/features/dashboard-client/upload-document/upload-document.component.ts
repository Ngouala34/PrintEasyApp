import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';

// Interfaces
interface DocumentType {
  id: string;
  name: string;
  image: string;
}

interface UploadedFile {
  file: File;
  name: string;
  size: string;
  preview?: string;
}

interface PaperSupport {
  id: string;
  name: string;
  description: string;
}

interface OrderData {
  documentType: string;
  files: UploadedFile[];
  format: string;
  customLength?: number;
  customWidth?: number;
  sides: string;
  color: string;
  support: string;
  quantity: number;
  additionalNotes?: string;
  deliveryType: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  phone?: string;
  totalPrice: number;
  basePrice: number;
  discount: number;
  timestamp: Date;
}

@Component({
  selector: 'app-upload-document',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './upload-document.component.html',
  styleUrls: ['./upload-document.component.scss']
})
export class UploadDocumentComponent implements OnInit {
  orderForm!: FormGroup;
  uploadedFiles: UploadedFile[] = [];
  isDragOver = false;
  selectedDocType: string = '';
  isSubmitting = false;

  // Types de documents avec images
  documentTypes: DocumentType[] = [
    { id: 'business-card', name: 'Carte de visite', image: 'assets/images/visitCard.jpg' },
    { id: 'flyer', name: 'Flyer', image: 'assets/images/Flyers.jpg' },
    { id: 'poster', name: 'Affiche', image: 'assets/images/poster.jpg' },
    { id: 'brochure', name: 'Brochure', image: 'assets/images/brochure.jpg' },
    { id: 'document', name: 'Document', image: 'assets/images/document.jpg' },
    { id: 'banner', name: 'Bannière', image: 'assets/images/rollUp3.jpg' }
  ];

  // Formats standards
  formats = [
    { value: 'a0', label: 'A0 (841 × 1189 mm)' },
    { value: 'a1', label: 'A1 (594 × 841 mm)' },
    { value: 'a2', label: 'A2 (420 × 594 mm)' },
    { value: 'a3', label: 'A3 (297 × 420 mm)' },
    { value: 'a4', label: 'A4 (210 × 297 mm)' },
    { value: 'custom', label: 'Autre (personnalisé)' }
  ];

  // Supports d'impression
  paperSupports: PaperSupport[] = [
    { id: 'standard', name: 'Papier standard 80g/m²', description: 'Usage courant' },
    { id: 'premium', name: 'Papier premium 120g/m²', description: 'Qualité supérieure' },
    { id: 'glossy', name: 'Papier glacé 150g/m²', description: 'Finition brillante' },
    { id: 'matt', name: 'Papier mat 170g/m²', description: 'Finition mate' },
    { id: 'cardboard', name: 'Carton 300g/m²', description: 'Support rigide' },
    { id: 'vinyl', name: 'Vinyle adhésif', description: 'Pour stickers' },
    { id: 'canvas', name: 'Toile canvas', description: 'Pour bannières' }
  ];

  // Villes du Cameroun (principales)
  cities = [
    'Yaoundé', 'Douala', 'Bafoussam', 'Garoua', 'Maroua', 
    'Bamenda', 'Ngaoundéré', 'Bertoua', 'Ebolowa', 'Kribi',
    'Limbé', 'Buéa', 'Kumba', 'Dschang', 'Foumban'
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    this.setupFormListeners();
  }

  // Initialisation du formulaire
  initForm(): void {
    this.orderForm = this.fb.group({
      // Étape 1: Type de document
      documentType: ['', Validators.required],

      // Étape 2: Fichiers (géré séparément)

      // Étape 3: Configuration
      format: ['', Validators.required],
      customLength: [{ value: '', disabled: true }, [Validators.min(1), Validators.max(500)]],
      customWidth: [{ value: '', disabled: true }, [Validators.min(1), Validators.max(500)]],
      sides: ['single', Validators.required],
      color: ['color', Validators.required],
      support: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1), Validators.max(10000)]],
      additionalNotes: ['', [Validators.maxLength(500)]],

      // Étape 4: Livraison
      deliveryType: ['pickup', Validators.required],
      city: [''],
      neighborhood: [''],
      address: [''],
      phone: ['']
    }, { validators: this.customDimensionsValidator });
  }

  // Validateur personnalisé pour les dimensions
  customDimensionsValidator(control: AbstractControl) {
    const format = control.get('format');
    const customLength = control.get('customLength');
    const customWidth = control.get('customWidth');

    if (format?.value === 'custom') {
      if (!customLength?.value || !customWidth?.value) {
        return { customDimensionsRequired: true };
      }
      if (customLength?.invalid || customWidth?.invalid) {
        return { customDimensionsInvalid: true };
      }
    }
    return null;
  }

  // Écoute des changements du formulaire
  setupFormListeners(): void {
    // Afficher/masquer les champs personnalisés selon le format
    this.orderForm.get('format')?.valueChanges.subscribe(format => {
      const customLengthControl = this.orderForm.get('customLength');
      const customWidthControl = this.orderForm.get('customWidth');

      if (format === 'custom') {
        customLengthControl?.enable();
        customWidthControl?.enable();
        customLengthControl?.setValidators([Validators.required, Validators.min(1), Validators.max(500)]);
        customWidthControl?.setValidators([Validators.required, Validators.min(1), Validators.max(500)]);
      } else {
        customLengthControl?.disable();
        customWidthControl?.disable();
        customLengthControl?.clearValidators();
        customWidthControl?.clearValidators();
        customLengthControl?.setValue('');
        customWidthControl?.setValue('');
      }
      customLengthControl?.updateValueAndValidity();
      customWidthControl?.updateValueAndValidity();
    });

    // Afficher/masquer les champs de livraison
    this.orderForm.get('deliveryType')?.valueChanges.subscribe(type => {
      const cityControl = this.orderForm.get('city');
      const neighborhoodControl = this.orderForm.get('neighborhood');
      const addressControl = this.orderForm.get('address');
      const phoneControl = this.orderForm.get('phone');

      if (type === 'delivery') {
        cityControl?.setValidators([Validators.required]);
        neighborhoodControl?.setValidators([Validators.required]);
        addressControl?.setValidators([Validators.required]);
        phoneControl?.setValidators([Validators.required, Validators.pattern(/^[6][0-9]{8}$/)]);
      } else {
        cityControl?.clearValidators();
        neighborhoodControl?.clearValidators();
        addressControl?.clearValidators();
        phoneControl?.clearValidators();
        cityControl?.setValue('');
        neighborhoodControl?.setValue('');
        addressControl?.setValue('');
        phoneControl?.setValue('');
      }
      cityControl?.updateValueAndValidity();
      neighborhoodControl?.updateValueAndValidity();
      addressControl?.updateValueAndValidity();
      phoneControl?.updateValueAndValidity();
    });

    // Validation en temps réel de la quantité
    this.orderForm.get('quantity')?.valueChanges.subscribe(() => {
      this.validateQuantity();
    });
  }

  // Sélection du type de document
  selectDocumentType(typeId: string): void {
    this.selectedDocType = typeId;
    this.orderForm.patchValue({ documentType: typeId });
  }

  // Gestion du drag & drop
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(files);
    }
  }

  // Sélection manuelle de fichiers
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(input.files);
      // Réinitialiser l'input pour permettre la sélection du même fichier
      input.value = '';
    }
  }

  // Traitement des fichiers
  handleFiles(files: FileList): void {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validation du type
      const allowedTypes = [
        'application/pdf', 
        'image/jpeg', 
        'image/png', 
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert(`Format non supporté: ${file.name}. Formats acceptés: PDF, JPG, PNG, DOC, DOCX`);
        continue;
      }

      // Validation de la taille (max 50 MB)
      if (file.size > 50 * 1024 * 1024) {
        alert(`Fichier trop volumineux: ${file.name}. Taille maximum: 50 MB`);
        continue;
      }

      // Vérifier si le fichier n'est pas déjà uploadé
      if (this.uploadedFiles.some(f => f.name === file.name && f.size === this.formatFileSize(file.size))) {
        alert(`Le fichier ${file.name} est déjà uploadé.`);
        continue;
      }

      const uploadedFile: UploadedFile = {
        file: file,
        name: file.name,
        size: this.formatFileSize(file.size)
      };

      // Aperçu pour les images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedFile.preview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }

      this.uploadedFiles.push(uploadedFile);
    }
  }

  // Supprimer un fichier
  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
  }

  // Formater la taille du fichier
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Gestion de la quantité
  onQuantityInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = parseInt(input.value, 10);
    
    if (isNaN(value) || value < 1) {
      value = 1;
    } else if (value > 10000) {
      value = 10000;
    }
    
    this.orderForm.patchValue({ quantity: value });
  }

  validateQuantity(): void {
    const quantityControl = this.orderForm.get('quantity');
    if (quantityControl) {
      let value = quantityControl.value;
      if (value < 1) {
        quantityControl.setValue(1);
      } else if (value > 10000) {
        quantityControl.setValue(10000);
      }
    }
  }

  incrementQuantity(): void {
    const currentValue = this.orderForm.get('quantity')?.value || 0;
    if (currentValue < 10000) {
      this.orderForm.patchValue({ quantity: currentValue + 1 });
    }
  }

  decrementQuantity(): void {
    const currentValue = this.orderForm.get('quantity')?.value || 0;
    if (currentValue > 1) {
      this.orderForm.patchValue({ quantity: currentValue - 1 });
    }
  }

  // Calcul des prix
  calculateBasePrice(): number {
    const formValue = this.orderForm.value;
    if (!formValue.documentType || !formValue.format || !formValue.support) return 0;

    // Prix de base selon le type de document
    let basePrice = 1000; // Prix de base en FCFA
    
    const docType = formValue.documentType;
    if (docType === 'business-card') basePrice = 500;
    else if (docType === 'flyer') basePrice = 800;
    else if (docType === 'poster') basePrice = 2500;
    else if (docType === 'brochure') basePrice = 1500;
    else if (docType === 'banner') basePrice = 15000;
    
    // Ajustement selon le format
    const format = formValue.format;
    if (format === 'a0') basePrice *= 4;
    else if (format === 'a1') basePrice *= 3;
    else if (format === 'a2') basePrice *= 2;
    else if (format === 'a3') basePrice *= 1.5;
    else if (format === 'custom') {
      const length = formValue.customLength || 0;
      const width = formValue.customWidth || 0;
      const area = (length * width) / 100; // Conversion en dm²
      basePrice *= Math.max(1, area / 10);
    }
    
    // Ajustement recto-verso
    if (formValue.sides === 'double') {
      basePrice *= 1.6;
    }
    
    // Ajustement couleur
    if (formValue.color === 'color') {
      basePrice *= 1.3;
    }
    
    // Ajustement support
    const support = formValue.support;
    if (support === 'premium') basePrice *= 1.3;
    else if (support === 'glossy') basePrice *= 1.5;
    else if (support === 'matt') basePrice *= 1.4;
    else if (support === 'cardboard') basePrice *= 2;
    else if (support === 'vinyl' || support === 'canvas') basePrice *= 2.5;
    
    return Math.round(basePrice);
  }

  calculateDiscount(quantity: number, basePrice: number): number {
    let discountRate = 0;
    if (quantity >= 100) discountRate = 0.15;
    else if (quantity >= 50) discountRate = 0.10;
    else if (quantity >= 20) discountRate = 0.05;
    
    return Math.round(basePrice * quantity * discountRate);
  }

  get basePrice(): number {
    return this.calculateBasePrice();
  }

  get discount(): number {
    const quantity = this.orderForm.get('quantity')?.value || 1;
    return this.calculateDiscount(quantity, this.basePrice);
  }

  get totalPrice(): number {
    const quantity = this.orderForm.get('quantity')?.value || 1;
    const baseTotal = this.basePrice * quantity;
    const discountedTotal = baseTotal - this.discount;
    const deliveryCost = this.isDelivery ? 2000 : 0;
    
    return Math.round(discountedTotal + deliveryCost);
  }

  // Getters pour l'affichage
  get isCustomFormat(): boolean {
    return this.orderForm.get('format')?.value === 'custom';
  }

  get isDelivery(): boolean {
    return this.orderForm.get('deliveryType')?.value === 'delivery';
  }

  getDocumentTypeName(): string {
    const docType = this.documentTypes.find(doc => doc.id === this.selectedDocType);
    return docType ? docType.name : 'Non spécifié';
  }

  getFormatLabel(): string {
    const format = this.formats.find(f => f.value === this.orderForm.get('format')?.value);
    return format ? format.label : 'Non spécifié';
  }

  getPaperSupportName(): string {
    const support = this.paperSupports.find(p => p.id === this.orderForm.get('support')?.value);
    return support ? support.name : 'Non spécifié';
  }

  // Préparation des données pour l'envoi
  prepareOrderData(): OrderData {
    const formValue = this.orderForm.value;
    
    return {
      documentType: formValue.documentType,
      files: this.uploadedFiles,
      format: formValue.format,
      customLength: formValue.customLength,
      customWidth: formValue.customWidth,
      sides: formValue.sides,
      color: formValue.color,
      support: formValue.support,
      quantity: formValue.quantity,
      additionalNotes: formValue.additionalNotes,
      deliveryType: formValue.deliveryType,
      city: formValue.city,
      neighborhood: formValue.neighborhood,
      address: formValue.address,
      phone: formValue.phone,
      totalPrice: this.totalPrice,
      basePrice: this.basePrice,
      discount: this.discount,
      timestamp: new Date()
    };
  }

  // Soumission du formulaire
  async onSubmit(): Promise<void> {
    // Marquer tous les champs comme touchés pour afficher les erreurs
    this.markAllFieldsAsTouched();

    // Validation
    if (this.orderForm.invalid) {
      alert('Veuillez corriger les erreurs dans le formulaire avant de soumettre.');
      return;
    }

    if (this.uploadedFiles.length === 0) {
      alert('Veuillez uploader au moins un fichier.');
      return;
    }

    this.isSubmitting = true;

    try {
      // Préparation des données
      const orderData = this.prepareOrderData();

      // Simulation d'envoi (remplacer par un appel API réel)
      console.log('Commande soumise:', orderData);
      
      // TODO: Intégrer avec le service backend
      // await this.orderService.createOrder(orderData).toPromise();
      
      // Simulation de délai
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Commande envoyée avec succès !\nMontant total: ${this.totalPrice.toLocaleString('fr-FR')} FCFA\n\nUn email de confirmation vous a été envoyé.`);
      
      // Réinitialiser le formulaire
      this.resetForm();
      
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Une erreur est survenue lors de l\'envoi de votre commande. Veuillez réessayer.');
    } finally {
      this.isSubmitting = false;
    }
  }

  // Marquer tous les champs comme touchés
  markAllFieldsAsTouched(): void {
    Object.keys(this.orderForm.controls).forEach(key => {
      const control = this.orderForm.get(key);
      control?.markAsTouched();
    });
  }

  // Réinitialiser le formulaire
  resetForm(): void {
    this.orderForm.reset({
      sides: 'single',
      color: 'color',
      deliveryType: 'pickup',
      quantity: 1
    });
    this.uploadedFiles = [];
    this.selectedDocType = '';
    this.isSubmitting = false;
    
    // Réactiver les contrôles désactivés
    this.orderForm.get('customLength')?.enable();
    this.orderForm.get('customWidth')?.enable();
  }
}
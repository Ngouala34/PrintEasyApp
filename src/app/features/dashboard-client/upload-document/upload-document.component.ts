import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { IOrderData } from '../../../core/models/order';

// Interfaces
interface DocumentType {
  id: string;
  name: string;
  image: string;
}

interface UploadedFile {
  document: File;
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
  note?: string;
  number_of_pages: number;
  document_type_name: string;
  option_format: string;
  option_color: string;
  option_paper: string;
  option_sides: string;
  option_delivery: string;
  option_binding: string;
  delivery_city?: string;
  delivery_neighborhood?: string;
  delivery_phone?: string;
  customLength?: number;
  customWidth?: number;
  document: UploadedFile[];
  delivery_address?: string;
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
// Mettre à jour les types de documents selon l'API
documentTypes: DocumentType[] = [
  { id: 'CARTE_DE_VISITE', name: 'Carte de visite', image: 'assets/images/visitCard.jpg' },
  { id: 'flyer', name: 'Flyer', image: 'assets/images/Flyers.jpg' },
  { id: 'AFFICHE', name: 'Affiche', image: 'assets/images/poster.jpg' },
  { id: 'BROCHURE', name: 'Brochure', image: 'assets/images/brochure.jpg' },
  { id: 'DOCUMENT', name: 'Document', image: 'assets/images/document.jpg' },
  { id: 'BANNIERE', name: 'Bannière', image: 'assets/images/rollUp3.jpg' }
];

// Ajouter l'option de finition (option_finish)
finishOptions = [
  { id: 'standard', name: 'Finition standard', description: 'Finition normale' },
  { id: 'glossy', name: 'Brillant', description: 'Finition brillante' },
  { id: 'matt', name: 'Mat', description: 'Finition mate' },
  { id: 'laminated', name: 'Plastifié', description: 'Protection plastique' }
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

  // Types de reliure
  paperbinding: PaperSupport[] = [
    { id: 'none', name: 'Aucune', description: 'Pas de reliure' },
    { id: 'stapled', name: 'Agrafée', description: 'Reliure par agrafes' },
    { id: 'spiral', name: 'Spirale', description: 'Reliure spirale' },
    { id: 'perfect', name: 'Dos carré collé', description: 'Reliure professionnelle' }
  ];

  // Villes du Cameroun (principales)
  cities = [
    'Yaoundé', 'Douala', 'Bafoussam','Mbouda', 'Garoua', 'Maroua', 
    'Bamenda', 'Ngaoundéré', 'Bertoua', 'Ebolowa', 'Kribi',
    'Limbé', 'Buéa', 'Kumba', 'Dschang', 'Foumban'
  ];
  isLoading: any;
  successMessage: any;
  errorMessage: any;

  constructor(private fb: FormBuilder, private orderService: OrderService) {}

  ngOnInit(): void {
    this.initForm();
    this.setupFormListeners();
  }

  // Initialisation du formulaire
initForm(): void {
  this.orderForm = this.fb.group({
    // Étape 1: Type de document
    document_type_name: ['', Validators.required],

    // Étape 3: Configuration
    option_format: ['', Validators.required],
    customLength: [{ value: '', disabled: true }, [Validators.min(1)]],
    customWidth: [{ value: '', disabled: true }, [Validators.min(1)]],
    option_sides: ['single', Validators.required],
    option_color: ['color', Validators.required],
    option_paper: ['', Validators.required],
    number_of_pages: [1, [Validators.required, Validators.min(1), Validators.max(10000)]],
    note: ['', [Validators.maxLength(500)]],
    option_finish: [''], // Nouveau champ
    option_binding: [''],

    // Étape 4: Livraison
    option_delivery: ['pickup', Validators.required],
    delivery_city: [''],
    delivery_neighborhood: [''],
    delivery_address: [''],
    delivery_phone: ['']
  }, { validators: this.customDimensionsValidator });
}

  // Validateur personnalisé pour les dimensions
  customDimensionsValidator(control: AbstractControl) {
    const format = control.get('option_format');
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
    this.orderForm.get('option_format')?.valueChanges.subscribe(format => {
      const customLengthControl = this.orderForm.get('customLength');
      const customWidthControl = this.orderForm.get('customWidth');

      if (format === 'custom') {
        customLengthControl?.enable();
        customWidthControl?.enable();
        customLengthControl?.setValidators([Validators.required, Validators.min(1)]);
        customWidthControl?.setValidators([Validators.required, Validators.min(1)]);
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
    this.orderForm.get('option_delivery')?.valueChanges.subscribe(type => {
      const cityControl = this.orderForm.get('delivery_city');
      const neighborhoodControl = this.orderForm.get('delivery_neighborhood');
      const addressControl = this.orderForm.get('delivery_address');
      const phoneControl = this.orderForm.get('delivery_phone');

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
    this.orderForm.get('number_of_pages')?.valueChanges.subscribe(() => {
      this.validateQuantity();
    });
  }

  // Sélection du type de document
  selectDocumentType(typeId: string): void {
    this.selectedDocType = typeId;
    this.orderForm.patchValue({ document_type_name: typeId });
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

    // Validation de la taille (max 100 MB)
    if (file.size > 100 * 1024 * 1024) {
      alert(`Fichier trop volumineux: ${file.name}. Taille maximum: 100 MB`);
      continue;
    }

    // Vérifier si le fichier n'est pas déjà uploadé
    if (this.uploadedFiles.some(f => f.name === file.name && f.size === this.formatFileSize(file.size))) {
      alert(`Le fichier ${file.name} est déjà uploadé.`);
      continue;
    }

    const uploadedFile: UploadedFile = {
      document: file, // Le vrai fichier File
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
    
    this.orderForm.patchValue({ number_of_pages: value });
  }

  validateQuantity(): void {
    const quantityControl = this.orderForm.get('number_of_pages');
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
    const currentValue = this.orderForm.get('number_of_pages')?.value || 0;
    if (currentValue < 10000) {
      this.orderForm.patchValue({ number_of_pages: currentValue + 1 });
    }
  }

  decrementQuantity(): void {
    const currentValue = this.orderForm.get('number_of_pages')?.value || 0;
    if (currentValue > 1) {
      this.orderForm.patchValue({ number_of_pages: currentValue - 1 });
    }
  }

  // Calcul des prix
  calculateBasePrice(): number {
    const formValue = this.orderForm.value;
    if (!formValue.document_type_name || !formValue.option_format || !formValue.option_paper) return 0;

    // Prix de base selon le type de document
    let basePrice = 1000; // Prix de base en FCFA
    
    const docType = formValue.document_type_name;
    if (docType === 'business-card') basePrice = 50;
    else if (docType === 'flyer') basePrice = 500;
    else if (docType === 'poster') basePrice = 2500;
    else if (docType === 'brochure') basePrice = 250;
    else if (docType === 'banner') basePrice = 10000;
    
    // Ajustement selon le format
    const format = formValue.option_format;
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
    if (formValue.option_sides === 'double') {
      basePrice *= 1.6;
    }
    
    // Ajustement couleur
    if (formValue.option_color === 'color') {
      basePrice *= 1.3;
    }
    
    // Ajustement support
    const support = formValue.option_paper;
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
    const quantity = this.orderForm.get('number_of_pages')?.value || 1;
    return this.calculateDiscount(quantity, this.basePrice);
  }

  get totalPrice(): number {
    const quantity = this.orderForm.get('number_of_pages')?.value || 1;
    const baseTotal = this.basePrice * quantity;
    const discountedTotal = baseTotal - this.discount;
    const deliveryCost = this.isDelivery ? 2000 : 0;
    
    return Math.round(discountedTotal + deliveryCost);
  }

  // Getters pour l'affichage
  get isCustomFormat(): boolean {
    return this.orderForm.get('option_format')?.value === 'custom';
  }

  get isDelivery(): boolean {
    return this.orderForm.get('option_delivery')?.value === 'delivery';
  }

  getDocumentTypeName(): string {
    const docType = this.documentTypes.find(doc => doc.id === this.selectedDocType);
    return docType ? docType.name : 'Non spécifié';
  }

  getFormatLabel(): string {
    const format = this.formats.find(f => f.value === this.orderForm.get('option_format')?.value);
    return format ? format.label : 'Non spécifié';
  }

  getPaperSupportName(): string {
    const support = this.paperSupports.find(p => p.id === this.orderForm.get('option_paper')?.value);
    return support ? support.name : 'Non spécifié';
  }

// Préparation des données pour l'envoi
// Préparer les données selon le format API
prepareOrderData(): IOrderData {
  const formValue = this.orderForm.value;
  
  const orderData: IOrderData = {
    document_type_name: this.selectedDocType, // Utiliser l'ID exact de l'API
    files: this.uploadedFiles,
    option_format: formValue.option_format,
    customLength: formValue.customLength,
    customWidth: formValue.customWidth,
    option_sides: formValue.option_sides,
    option_color: formValue.option_color,
    option_paper: formValue.option_paper,
    number_of_pages: formValue.number_of_pages,
    note: formValue.note,
    option_finish: formValue.option_finish, // Nouveau champ
    option_binding: formValue.option_binding,
    option_delivery: formValue.option_delivery,
    delivery_city: formValue.delivery_city,
    delivery_neighborhood: formValue.delivery_neighborhood,
    delivery_address: formValue.delivery_address,
    delivery_phone: formValue.delivery_phone,
    totalPrice: this.totalPrice,
    basePrice: this.basePrice,
    discount: this.discount,
    timestamp: new Date()
  };

  console.log('Données préparées pour API:', orderData);
  return orderData;
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

    // Envoi au service
    this.orderService.sendFile(orderData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        console.log('Réponse API:', response);
        
        alert(`Commande envoyée avec succès !\nMontant total: ${this.totalPrice.toLocaleString('fr-FR')} FCFA`);
        
        // Réinitialiser le formulaire
        this.resetForm();
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Erreur API détaillée:', error);
        
        if (error.status === 404) {
          alert('Erreur 404: L\'endpoint /order/ n\'existe pas. Vérifiez l\'URL de l\'API.');
        } else if (error.status === 400) {
          alert('Erreur 400: Données invalides. Vérifiez le format des données envoyées.');
        } else {
          alert(`Erreur ${error.status}: Une erreur est survenue lors de l'envoi de votre commande.`);
        }
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la soumission:', error);
    this.isSubmitting = false;
    alert('Une erreur est survenue lors de la préparation des données.');
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
      option_sides: 'single',
      option_color: 'color',
      option_delivery: 'pickup',
      number_of_pages: 1
    });
    this.uploadedFiles = [];
    this.selectedDocType = '';
    this.isSubmitting = false;
    
    // Réactiver les contrôles désactivés
    this.orderForm.get('customLength')?.enable();
    this.orderForm.get('customWidth')?.enable();
  }
}
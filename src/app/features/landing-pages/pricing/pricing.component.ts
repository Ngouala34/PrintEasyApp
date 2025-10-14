// src/app/features/pricing/pricing.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from "../../../shared/components/navbar/navbar.component";

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  features: string[];
  recommended?: boolean;
}

interface ServicePricing {
  category: string;
  icon: string;
  items: {
    name: string;
    description: string;
    price: number;
    unit: string;
  }[];
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.scss']
})
export class PricingComponent implements OnInit {
  selectedCategory = signal('all');
  
  pricingTiers = signal<PricingTier[]>([
    {
      id: 'starter',
      name: 'Starter',
      description: 'Parfait pour les petits projets et tests',
      price: 25000,
      unit: 'par commande',
      features: [
        'Jusqu\'à 100 exemplaires',
        'Formats standards (A4, A5)',
        'Papier couché 135g',
        'Livraison standard 48h',
        'Support email',
        'Fichiers PDF uniquement'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Idéal pour les professionnels et PME',
      price: 50000,
      unit: 'par commande',
      features: [
        'Jusqu\'à 500 exemplaires',
        'Tous les formats disponibles',
        'Choix de papiers premium',
        'Finitions professionnelles',
        'Livraison express 24h',
        'Support prioritaire',
        'Tous formats de fichiers',
        'Aperçu avant impression'
      ],
      recommended: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Solutions sur mesure pour grandes entreprises',
      price: 150000,
      unit: 'forfait mensuel',
      features: [
        'Volume illimité',
        'Tarifs dégressifs',
        'Formats personnalisés',
        'Design sur mesure',
        'Livraison prioritaire',
        'Account manager dédié',
        'Facturations mensuelles',
        'API d\'intégration',
        'Stockage et réimpression'
      ]
    }
  ]);

  servicePricing = signal<ServicePricing[]>([
    {
      category: 'Flyers & Dépliants',
      icon: '📄',
      items: [
        { name: 'Flyer A6 recto', description: '105x148mm, papier 135g', price: 30, unit: 'unité' },
        { name: 'Flyer A5 recto-verso', description: '148x210mm, papier 135g', price: 50, unit: 'unité' },
        { name: 'Flyer A4 recto-verso', description: '210x297mm, papier 170g', price: 100, unit: 'unité' },
        { name: 'Dépliant 3 volets', description: 'A4 plié, papier 170g', price: 150, unit: 'unité' }
      ]
    },
    {
      category: 'Cartes de Visite',
      icon: '💼',
      items: [
        { name: 'Cartes Standard', description: '85x55mm, papier 300g', price: 5000, unit: '100 unités' },
        { name: 'Cartes Premium', description: '85x55mm, papier 350g + pelliculage', price: 7500, unit: '100 unités' },
        { name: 'Cartes Luxe', description: 'Papier texturé + finition spéciale', price: 12000, unit: '100 unités' }
      ]
    },
    {
      category: 'Brochures & Catalogues',
      icon: '📘',
      items: [
        { name: 'Brochure 8 pages', description: 'A4, dos agrafé', price: 200, unit: 'unité' },
        { name: 'Brochure 16 pages', description: 'A4, dos carré collé', price: 400, unit: 'unité' },
        { name: 'Catalogue 32 pages', description: 'A4, reliure cousue', price: 800, unit: 'unité' },
        { name: 'Catalogue 64 pages', description: 'A4, reliure professionnelle', price: 1500, unit: 'unité' }
      ]
    },
    {
      category: 'Affiches & Posters',
      icon: '🎨',
      items: [
        { name: 'Affiche A3', description: '297x420mm, papier 170g', price: 1000, unit: 'unité' },
        { name: 'Affiche A2', description: '420x594mm, papier 170g', price: 1500, unit: 'unité' },
        { name: 'Affiche A1', description: '594x841mm, papier 200g', price: 2500, unit: 'unité' },
        { name: 'Affiche A0', description: '841x1189mm, papier 200g', price: 4000, unit: 'unité' }
      ]
    },
    {
      category: 'Reliure & Finition',
      icon: '📋',
      items: [
        { name: 'Reliure spirale plastique', description: 'Jusqu\'à 100 pages', price: 500, unit: 'document' },
        { name: 'Reliure spirale métal', description: 'Jusqu\'à 200 pages', price: 800, unit: 'document' },
        { name: 'Thermoreliure', description: 'Jusqu\'à 300 pages', price: 1200, unit: 'document' },
        { name: 'Pelliculage A4', description: 'Mat ou brillant', price: 200, unit: 'page' }
      ]
    },
    {
      category: 'Packaging',
      icon: '🎁',
      items: [
        { name: 'Boîte pliante standard', description: 'Format personnalisé', price: 2000, unit: 'unité' },
        { name: 'Boîte avec fenêtre', description: 'Format personnalisé', price: 2500, unit: 'unité' },
        { name: 'Sachet kraft imprimé', description: 'Plusieurs formats', price: 800, unit: 'unité' },
        { name: 'Étui carton sur mesure', description: 'Design personnalisé', price: 3500, unit: 'unité' }
      ]
    }
  ]);

  filteredPricing = signal<ServicePricing[]>(this.servicePricing());

  ngOnInit(): void {
    this.observeElements();
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
    
    if (category === 'all') {
      this.filteredPricing.set(this.servicePricing());
    } else {
      this.filteredPricing.set(
        this.servicePricing().filter(p => p.category === category)
      );
    }
  }

  private observeElements(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    setTimeout(() => {
      document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    }, 100);
  }
}
// src/app/features/catalog/catalog.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  image: string;
  priceFrom: number;
  features: string[];
  popular?: boolean;
}

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss']
})
export class CatalogComponent implements OnInit {
  searchQuery = signal('');
  selectedCategory = signal('all');
  sortBy = signal('popular');
  viewMode = signal<'grid' | 'list'>('grid');

  categories = [
    { id: 'all', name: 'Tous les Services', icon: '📦' },
    { id: 'flyers', name: 'Flyers & Dépliants', icon: '📄' },
    { id: 'cards', name: 'Cartes de Visite', icon: '💼' },
    { id: 'brochures', name: 'Brochures', icon: '📘' },
    { id: 'posters', name: 'Affiches', icon: '🎨' },
    { id: 'binding', name: 'Reliure', icon: '📋' },
    { id: 'packaging', name: 'Packaging', icon: '🎁' }
  ];

  allProducts = signal<Product[]>([
    {
      id: 1,
      name: 'Flyers A5',
      category: 'flyers',
      description: 'Flyers format A5 (148x210mm) impression recto-verso sur papier couché brillant 135g',
      image: '📄',
      priceFrom: 50,
      features: ['Recto-verso', 'Papier couché 135g', 'Livraison 48h'],
      popular: true
    },
    {
      id: 2,
      name: 'Cartes de Visite Premium',
      category: 'cards',
      description: 'Cartes de visite 85x55mm sur papier couché mat 350g avec pelliculage soft touch',
      image: '💼',
      priceFrom: 5000,
      features: ['Pelliculage soft touch', 'Papier 350g', 'Angles arrondis'],
      popular: true
    },
    {
      id: 3,
      name: 'Brochure A4',
      category: 'brochures',
      description: 'Brochure format A4 reliure dos carré collé, couverture 300g intérieur 135g',
      image: '📘',
      priceFrom: 200,
      features: ['Dos carré collé', 'Plusieurs pages', 'Finition pro']
    },
    {
      id: 4,
      name: 'Affiche A3',
      category: 'posters',
      description: 'Affiche grand format A3 (297x420mm) papier couché brillant 170g',
      image: '🎨',
      priceFrom: 1000,
      features: ['Grand format', 'Qualité photo', 'Papier résistant'],
      popular: true
    },
    {
      id: 5,
      name: 'Reliure Spirale',
      category: 'binding',
      description: 'Reliure spirale métallique pour documents jusqu\'à 300 pages',
      image: '📋',
      priceFrom: 500,
      features: ['Spirale métal', 'Couverture transparente', 'Jusqu\'à 300 pages']
    },
    {
      id: 6,
      name: 'Boîtes Personnalisées',
      category: 'packaging',
      description: 'Boîtes carton personnalisées avec impression couleur quadrichromie',
      image: '🎁',
      priceFrom: 2000,
      features: ['Sur mesure', 'Impression couleur', 'Plusieurs formats']
    },
    {
      id: 7,
      name: 'Flyers A6',
      category: 'flyers',
      description: 'Flyers format A6 (105x148mm) impression recto sur papier couché 135g',
      image: '📄',
      priceFrom: 30,
      features: ['Format poche', 'Économique', 'Livraison rapide']
    },
    {
      id: 8,
      name: 'Cartes de Visite Standard',
      category: 'cards',
      description: 'Cartes de visite 85x55mm classiques sur papier couché brillant 300g',
      image: '💼',
      priceFrom: 3500,
      features: ['Format standard', 'Papier brillant', 'Impression recto-verso']
    },
    {
      id: 9,
      name: 'Affiche A2',
      category: 'posters',
      description: 'Grande affiche A2 (420x594mm) pour un impact visuel maximal',
      image: '🎨',
      priceFrom: 1500,
      features: ['Très grand format', 'Haute résolution', 'Papier premium']
    }
  ]);

  filteredProducts = computed(() => {
    let products = this.allProducts();

    // Filtrer par catégorie
    if (this.selectedCategory() !== 'all') {
      products = products.filter(p => p.category === this.selectedCategory());
    }

    // Filtrer par recherche
    const query = this.searchQuery().toLowerCase();
    if (query) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    // Trier
    switch (this.sortBy()) {
      case 'price-asc':
        products = [...products].sort((a, b) => a.priceFrom - b.priceFrom);
        break;
      case 'price-desc':
        products = [...products].sort((a, b) => b.priceFrom - a.priceFrom);
        break;
      case 'name':
        products = [...products].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'popular':
      default:
        products = [...products].sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    }

    return products;
  });

  ngOnInit() {
    this.observeElements();
  }

  selectCategory(categoryId: string) {
    this.selectedCategory.set(categoryId);
  }

  toggleViewMode() {
    this.viewMode.update(mode => mode === 'grid' ? 'list' : 'grid');
  }

  private observeElements() {
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
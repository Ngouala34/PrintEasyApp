// src/app/features/services/services.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from "../../../shared/components/navbar/navbar.component";

interface ServiceDetail {
  id: string;
  icon: string;
  title: string;
  description: string;
  features: string[];
  formats: string[];
  papers: string[];
  finishings: string[];
  useCases: string[];
  priceFrom: number;
  deliveryTime: string;
  image?: string;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent implements OnInit {
  selectedService = signal<ServiceDetail | null>(null);

  services = signal<ServiceDetail[]>([
    {
      id: 'flyers',
      icon: '📄',
      title: 'Flyers & Dépliants',
      description: 'Imprimez vos flyers publicitaires et dépliants promotionnels en haute qualité pour vos campagnes marketing.',
      features: [
        'Impression recto ou recto-verso',
        'Plusieurs formats disponibles',
        'Papier couché ou recyclé',
        'Finitions professionnelles'
      ],
      formats: ['A6 (105x148mm)', 'A5 (148x210mm)', 'A4 (210x297mm)', 'DL (99x210mm)'],
      papers: ['Papier couché 135g', 'Papier couché 170g', 'Papier recyclé 120g'],
      finishings: ['Sans finition', 'Pelliculage mat', 'Pelliculage brillant', 'Vernis sélectif'],
      useCases: [
        'Promotion d\'événements',
        'Campagnes publicitaires',
        'Distribution en boîtes aux lettres',
        'Stands et salons'
      ],
      priceFrom: 30,
      deliveryTime: '24-48h'
    },
    {
      id: 'business-cards',
      icon: '💼',
      title: 'Cartes de Visite',
      description: 'Des cartes de visite élégantes et professionnelles qui marquent les esprits et reflètent l\'identité de votre entreprise.',
      features: [
        'Format standard 85x55mm',
        'Impression recto-verso',
        'Papier premium jusqu\'à 350g',
        'Options de finitions luxueuses'
      ],
      formats: ['Standard (85x55mm)', 'Carrée (85x85mm)', 'Format US (89x51mm)'],
      papers: ['Papier couché 300g', 'Papier couché 350g', 'Papier texturé 300g'],
      finishings: ['Pelliculage soft touch', 'Pelliculage brillant', 'Dorure à chaud', 'Découpe spéciale'],
      useCases: [
        'Networking professionnel',
        'Salons et conférences',
        'Développement commercial',
        'Image de marque'
      ],
      priceFrom: 5000,
      deliveryTime: '48-72h'
    },
    {
      id: 'brochures',
      icon: '📘',
      title: 'Brochures & Catalogues',
      description: 'Présentez votre entreprise, vos produits ou services avec des brochures élégantes et des catalogues professionnels.',
      features: [
        'Plusieurs types de reliure',
        'De 8 à 200 pages',
        'Couverture personnalisée',
        'Qualité photo impeccable'
      ],
      formats: ['A5', 'A4', 'Carré 210x210mm', 'Format personnalisé'],
      papers: ['Couverture 300g', 'Intérieur 135g', 'Intérieur 170g', 'Papier de luxe'],
      finishings: ['Dos carré collé', 'Spirale métallique', 'Agrafes', 'Reliure cousue'],
      useCases: [
        'Présentation entreprise',
        'Catalogues produits',
        'Guides et manuels',
        'Rapports annuels'
      ],
      priceFrom: 200,
      deliveryTime: '3-5 jours'
    },
    {
      id: 'posters',
      icon: '🎨',
      title: 'Affiches & Posters',
      description: 'Imprimez vos affiches publicitaires en grand format avec une qualité d\'image exceptionnelle.',
      features: [
        'Formats du A3 au A0',
        'Impression haute résolution',
        'Papier résistant',
        'Livraison en tube'
      ],
      formats: ['A3 (297x420mm)', 'A2 (420x594mm)', 'A1 (594x841mm)', 'A0 (841x1189mm)'],
      papers: ['Papier couché 170g', 'Papier photo 200g', 'Papier blueback', 'Adhésif'],
      finishings: ['Sans finition', 'Plastification', 'Encapsulation', 'Support rigide'],
      useCases: [
        'Publicité extérieure',
        'Décoration d\'événements',
        'Affichage en magasin',
        'Expositions artistiques'
      ],
      priceFrom: 1000,
      deliveryTime: '24-48h'
    },
    {
      id: 'binding',
      icon: '📋',
      title: 'Reliure & Finition',
      description: 'Services de reliure professionnelle pour vos documents, rapports, mémoires et présentations.',
      features: [
        'Plusieurs types de reliure',
        'Jusqu\'à 500 pages',
        'Couvertures personnalisées',
        'Finitions soignées'
      ],
      formats: ['A4', 'A5', 'Format personnalisé'],
      papers: ['Couverture PVC transparente', 'Couverture cartonnée', 'Couverture cuir'],
      finishings: ['Spirale plastique', 'Spirale métallique', 'Thermoreliure', 'Reliure à anneaux'],
      useCases: [
        'Mémoires et thèses',
        'Rapports d\'entreprise',
        'Présentations clients',
        'Documentation technique'
      ],
      priceFrom: 500,
      deliveryTime: '24h'
    },
    {
      id: 'packaging',
      icon: '🎁',
      title: 'Packaging Personnalisé',
      description: 'Créez des emballages sur mesure pour sublimer vos produits et renforcer votre image de marque.',
      features: [
        'Design sur mesure',
        'Plusieurs types de boîtes',
        'Impression quadrichromie',
        'Découpe et pliage précis'
      ],
      formats: ['Boîte pliante', 'Étui carton', 'Sachet kraft', 'Format sur mesure'],
      papers: ['Carton 300g', 'Carton 400g', 'Carton ondulé', 'Kraft naturel'],
      finishings: ['Pelliculage mat', 'Pelliculage brillant', 'Vernis UV', 'Dorure'],
      useCases: [
        'Emballage produits',
        'Coffrets cadeaux',
        'Packaging cosmétiques',
        'Boîtes alimentaires'
      ],
      priceFrom: 2000,
      deliveryTime: '5-7 jours'
    }
  ]);

  ngOnInit(): void {
    this.observeElements();
  }

  selectService(service: ServiceDetail): void {
    this.selectedService.set(service);
  }

  closeServiceDetail(): void {
    this.selectedService.set(null);
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
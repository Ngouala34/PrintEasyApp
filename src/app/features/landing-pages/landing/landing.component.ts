// src/app/features/landing/landing.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from "../../../shared/components/navbar/navbar.component";

interface Service {
  id: number;
  image: string;
  title: string;
  description: string;
  price: string;
}

interface Testimonial {
  id: number;
  name: string;
  company: string;
  comment: string;
  rating: number;
  avatar: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  services = signal<Service[]>([
    {
      id: 1,
      image: 'assets/images/Flyers.jpg',
      title: 'Flyers & Dépliants',
      description: 'Créez des flyers percutants pour vos événements et promotions',
      price: 'À partir de 50 FCFA'
    },
    {
      id: 2,
      image: 'assets/images/visitCard.jpg',
      title: 'Cartes de Visite',
      description: 'Des cartes professionnelles qui marquent les esprits',
      price: 'À partir de 5 000 FCFA/100'
    },
    {
      id: 3,
      image: 'assets/images/brochure.jpg',
      title: 'Brochures',
      description: 'Présentez votre entreprise avec élégance',
      price: 'À partir de 200 FCFA'
    },
    {
      id: 4,
      image: 'assets/images/rollUp2.jpg',
      title: 'Affiches',
      description: 'Grandes affiches pour un impact maximum',
      price: 'À partir de 1 000 FCFA'
    },
    {
      id: 5,
      image: 'assets/images/railliure.jpg',
      title: 'Documents Reliés',
      description: 'Reliure professionnelle pour tous vos documents',
      price: 'À partir de 500 FCFA'
    },
    {
      id: 6,
      image: 'assets/images/packaging.jpg',
      title: 'Packaging Personnalisé',
      description: 'Emballages sur mesure pour vos produits',
      price: 'Sur devis'
    }
  ]);
  

  testimonials = signal<Testimonial[]>([
    {
      id: 1,
      name: 'Ngouegni Nelly',
      company: 'TechStart SARL',
      comment: 'Service impeccable et livraison rapide. Nos cartes de visite sont magnifiques !',
      rating: 5,
      avatar: 'MD'
    },
    {
      id: 2,
      name: 'Jean Kamga',
      company: 'EventPro',
      comment: 'Qualité exceptionnelle pour nos flyers d\'événement. Je recommande vivement !',
      rating: 5,
      avatar: 'JK'
    },
    {
      id: 3,
      name: 'paola jeanne',
      company: 'Design Studio',
      comment: 'Excellent rapport qualité-prix. L\'équipe est très professionnelle.',
      rating: 5,
      avatar: 'SM'
    }
  ]);

  stats = signal([
    { value: '10K+', label: 'Clients Satisfaits' },
    { value: '50K+', label: 'Impressions Réalisées' },
    { value: '24h', label: 'Livraison Express' },
    { value: '99%', label: 'Taux de Satisfaction' }
  ]);

  ngOnInit() {
    // Animation au scroll
    this.observeElements();
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

  scrollToServices() {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  }


  
}
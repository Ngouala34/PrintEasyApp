import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  description: string;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface Stat {
  value: string;
  label: string;
  icon: string;
}

interface TimelineItem {
  year: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  stats: Stat[] = [
    { value: '10K+', label: 'Impressions par jour', icon: 'print' },
    { value: '500+', label: 'Clients satisfaits', icon: 'users' },
    { value: '99.9%', label: 'Disponibilité', icon: 'shield' },
    { value: '24/7', label: 'Support client', icon: 'headset' }
  ];

  features: Feature[] = [
    {
      icon: 'zap',
      title: 'Rapidité',
      description: 'Traitement ultra-rapide de vos documents avec notre infrastructure cloud optimisée'
    },
    {
      icon: 'lock',
      title: 'Sécurité',
      description: 'Vos données sont cryptées de bout en bout et protégées selon les normes industrielles'
    },
    {
      icon: 'settings',
      title: 'Flexibilité',
      description: 'Options d\'impression personnalisables pour répondre à tous vos besoins spécifiques'
    },
    {
      icon: 'dollar',
      title: 'Économique',
      description: 'Tarification transparente et compétitive sans frais cachés ni engagement'
    },
    {
      icon: 'clock',
      title: 'Disponibilité',
      description: 'Service accessible 24h/24 et 7j/7 pour imprimer quand vous en avez besoin'
    },
    {
      icon: 'award',
      title: 'Qualité',
      description: 'Impression haute résolution pour des documents professionnels impeccables'
    }
  ];

  teamMembers: TeamMember[] = [
    {
      name: 'Marie Dupont',
      role: 'CEO & Fondatrice',
      image: 'assets/team/member1.jpg',
      description: 'Visionnaire passionnée par l\'innovation dans le secteur de l\'impression'
    },
    {
      name: 'Jean Martin',
      role: 'CTO',
      image: 'assets/team/member2.jpg',
      description: 'Expert en technologies cloud et architectures distribuées'
    },
    {
      name: 'Sophie Bernard',
      role: 'Directrice Operations',
      image: 'assets/team/member3.jpg',
      description: 'Spécialiste en optimisation des processus et satisfaction client'
    },
    {
      name: 'Pierre Dubois',
      role: 'Responsable Support',
      image: 'assets/team/member4.jpg',
      description: 'Dévoué à offrir la meilleure expérience client possible'
    }
  ];

  timeline: TimelineItem[] = [
    {
      year: '2020',
      title: 'Création de PrintFlow',
      description: 'Lancement de notre plateforme avec une vision claire : simplifier l\'impression en ligne'
    },
    {
      year: '2021',
      title: 'Expansion nationale',
      description: 'Ouverture de 10 points de service à travers le pays'
    },
    {
      year: '2022',
      title: 'Innovation technologique',
      description: 'Lancement de notre API et intégration mobile'
    },
    {
      year: '2023',
      title: 'Reconnaissance internationale',
      description: 'Prix de la meilleure startup technologique de l\'année'
    },
    {
      year: '2024',
      title: 'Croissance continue',
      description: 'Plus de 500 clients entreprises et 10 000 utilisateurs actifs'
    }
  ];

  constructor(private router: Router) {}

  navigateToContact(): void {
    this.router.navigate(['/contact']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getIconEmoji(iconName: string): string {
    const iconMap: { [key: string]: string } = {
      'print': '🖨️',
      'users': '👥',
      'shield': '🛡️',
      'headset': '🎧',
      'zap': '⚡',
      'lock': '🔒',
      'settings': '⚙️',
      'dollar': '💰',
      'clock': '⏰',
      'award': '🏆'
    };
    return iconMap[iconName] || '✨';
  }
}
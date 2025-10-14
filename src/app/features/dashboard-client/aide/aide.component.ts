// src/app/features/dashboard-client/aide/aide.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  expanded?: boolean;
}

interface HelpCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  articles: number;
}

@Component({
  selector: 'app-aide',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aide.component.html',
  styleUrls: ['./aide.component.scss']
})
export class AideComponent {
  searchQuery = signal('');
  selectedCategory = signal('all');

  categories: HelpCategory[] = [
    {
      id: 'commandes',
      name: 'Commandes',
      icon: 'fa-box',
      description: 'Comment passer et suivre vos commandes',
      articles: 8
    },
    {
      id: 'paiement',
      name: 'Paiement',
      icon: 'fa-credit-card',
      description: 'Modes de paiement et facturation',
      articles: 5
    },
    {
      id: 'fichiers',
      name: 'Fichiers',
      icon: 'fa-file',
      description: 'Formats acceptés et préparation des fichiers',
      articles: 6
    },
    {
      id: 'livraison',
      name: 'Livraison',
      icon: 'fa-truck',
      description: 'Délais et modes de livraison',
      articles: 4
    }
  ];

  faqs = signal<FAQItem[]>([
    {
      id: 1,
      question: 'Comment passer une commande ?',
      answer: 'Pour passer une commande, cliquez sur "Nouvelle commande" dans le menu, uploadez votre fichier, choisissez vos options (format, papier, finition, quantité) et validez. Vous recevrez une confirmation par email.',
      category: 'commandes'
    },
    {
      id: 2,
      question: 'Quels formats de fichiers acceptez-vous ?',
      answer: 'Nous acceptons les formats PDF, JPG, PNG et AI. Pour un résultat optimal, nous recommandons le PDF haute résolution (300 DPI minimum). Les fichiers ne doivent pas dépasser 50MB.',
      category: 'fichiers'
    },
    {
      id: 3,
      question: 'Quels sont les délais de livraison ?',
      answer: 'Les délais standards sont de 24-48h pour la plupart des produits. Pour les commandes urgentes, nous proposons une option "Express" avec livraison sous 24h (supplément tarifaire applicable).',
      category: 'livraison'
    },
    {
      id: 4,
      question: 'Quels moyens de paiement acceptez-vous ?',
      answer: 'Nous acceptons les cartes bancaires (Visa, Mastercard), Mobile Money (MTN, Orange Money), virements bancaires et paiements en espèces pour les retraits en boutique.',
      category: 'paiement'
    },
    {
      id: 5,
      question: 'Puis-je modifier ma commande après validation ?',
      answer: 'Vous pouvez modifier votre commande dans les 2 heures suivant la validation si elle n\'est pas encore en production. Contactez notre service client via le chat pour toute modification.',
      category: 'commandes'
    },
    {
      id: 6,
      question: 'Comment obtenir une facture ?',
      answer: 'Votre facture est générée automatiquement et disponible dans votre espace client, section "Historique". Vous pouvez la télécharger en format PDF à tout moment.',
      category: 'paiement'
    },
    {
      id: 7,
      question: 'Que faire si mon fichier est refusé ?',
      answer: 'Si votre fichier ne respecte pas nos critères techniques (résolution, format, taille), vous recevrez un email avec les détails du problème et nos recommandations pour le corriger.',
      category: 'fichiers'
    },
    {
      id: 8,
      question: 'Proposez-vous la livraison à domicile ?',
      answer: 'Oui, nous livrons à domicile dans toute la ville de Douala et ses environs. Les frais de livraison sont calculés selon la distance. Vous pouvez aussi retirer gratuitement en boutique.',
      category: 'livraison'
    }
  ]);

  filteredFAQs = signal<FAQItem[]>(this.faqs());

  toggleFAQ(id: number): void {
    this.faqs.update(faqs =>
      faqs.map(faq => 
        faq.id === id ? { ...faq, expanded: !faq.expanded } : faq
      )
    );
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
    this.filterFAQs();
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.filterFAQs();
  }

  filterFAQs(): void {
    let filtered = this.faqs();

    // Filtre par catégorie
    if (this.selectedCategory() !== 'all') {
      filtered = filtered.filter(faq => faq.category === this.selectedCategory());
    }

    // Filtre par recherche
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(faq =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      );
    }

    this.filteredFAQs.set(filtered);
  }
}
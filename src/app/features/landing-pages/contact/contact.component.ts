// src/app/features/contact/contact.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from "../../../shared/components/navbar/navbar.component";

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  formData = signal<ContactForm>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  isSubmitting = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  subjects = [
    'Demande de devis',
    'Question sur un produit',
    'Suivi de commande',
    'Réclamation',
    'Partenariat',
    'Autre'
  ];

  contactInfo = [
    {
      icon: '📍',
      title: 'Adresse',
      details: [
        'Rue de la Réunification',
        'Akwa, Douala',
        'Cameroun'
      ],
      link: null
    },
    {
      icon: '📞',
      title: 'Téléphone',
      details: [
        '+237 6XX XXX XXX',
        '+237 2XX XXX XXX'
      ],
      link: 'tel:+237600000000'
    },
    {
      icon: '📧',
      title: 'Email',
      details: [
        'contact@printpro.cm',
        'support@printpro.cm'
      ],
      link: 'mailto:contact@printpro.cm'
    },
    {
      icon: '🕒',
      title: 'Horaires',
      details: [
        'Lun - Ven: 8h00 - 18h00',
        'Sam: 9h00 - 14h00',
        'Dim: Fermé'
      ],
      link: null
    }
  ];

  socialLinks = [
    { name: 'Facebook', icon: 'facebook', url: '#', color: '#1877f2' },
    { name: 'Twitter', icon: 'twitter', url: '#', color: '#1da1f2' },
    { name: 'Instagram', icon: 'instagram', url: '#', color: '#e4405f' },
    { name: 'LinkedIn', icon: 'linkedin', url: '#', color: '#0077b5' },
    { name: 'WhatsApp', icon: 'whatsapp', url: '#', color: '#25d366' }
  ];

  ngOnInit(): void {
    this.observeElements();
  }

  updateFormField(field: keyof ContactForm, value: string): void {
    this.formData.update(data => ({
      ...data,
      [field]: value
    }));
  }

  validateForm(): boolean {
    const data = this.formData();
    this.errorMessage.set('');

    if (!data.name || !data.email || !data.phone || !data.subject || !data.message) {
      this.errorMessage.set('Veuillez remplir tous les champs obligatoires');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      this.errorMessage.set('Adresse email invalide');
      return false;
    }

    const phoneRegex = /^(\+237|237)?[62][0-9]{8}$/;
    if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
      this.errorMessage.set('Numéro de téléphone invalide');
      return false;
    }

    if (data.message.length < 10) {
      this.errorMessage.set('Le message doit contenir au moins 10 caractères');
      return false;
    }

    return true;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    // Simuler l'envoi (remplacer par un appel API)
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.successMessage.set('Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.');
      
      // Réinitialiser le formulaire
      this.formData.set({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });

      // Masquer le message de succès après 5 secondes
      setTimeout(() => {
        this.successMessage.set('');
      }, 5000);
    }, 2000);
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
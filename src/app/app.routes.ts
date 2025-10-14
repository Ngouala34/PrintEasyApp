import { Routes } from '@angular/router';

export const routes: Routes = [
  // 🔹 Landing & Auth
  { path: '', loadComponent: () => import('./features/landing-pages/landing/landing.component').then(m => m.LandingComponent) },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'services', loadComponent: () => import('./features/landing-pages/services/services.component').then(m => m.ServicesComponent) },
  { path: 'pricing', loadComponent: () => import('./features/landing-pages/pricing/pricing.component').then(m => m.PricingComponent) },
  { path: 'contact', loadComponent: () => import('./features/landing-pages/contact/contact.component').then(m => m.ContactComponent) },

  // 🔹 Dashboard client (layout + enfants)
  {
    path: 'dashboard-client',
    loadComponent: () => import('./features/dashboard-client/dashboard-client.component').then(m => m.DashboardClientComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard-client/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'historique', loadComponent: () => import('./features/dashboard-client/historique/historique.component').then(m => m.HistoriqueComponent) },
      { path: 'notifications', loadComponent: () => import('./features/dashboard-client/notifications/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'profil', loadComponent: () => import('./features/dashboard-client/profil/profil.component').then(m => m.ProfilComponent) },
      { path: 'aide', loadComponent: () => import('./features/dashboard-client/aide/aide.component').then(m => m.AideComponent)},
      { path: 'discussion', loadComponent: () => import('./features/dashboard-client/discussion/discussion.component').then(m => m.DiscussionComponent) },
    ]
  },
];

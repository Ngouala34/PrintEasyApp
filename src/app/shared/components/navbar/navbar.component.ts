// src/app/shared/components/navbar/navbar.component.ts
import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  isScrolled = signal(false);
  menuOpen = signal(false);
  isAuthenticated = signal(false); // à connecter plus tard avec AuthService

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled.set(window.scrollY > 50);
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  logout() {
    // TODO: connecter à AuthService
    this.isAuthenticated.set(false);
    this.menuOpen.set(false);
  }
}

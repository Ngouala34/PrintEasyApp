import { Component, signal, OnDestroy, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy {
  // Form fields
  email = '';
  password = '';
  rememberMe = false;
  
  // UI State
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  // Security
  private loginAttempts = 0;
  private lastAttemptTime = 0;
  private readonly destroy$ = new Subject<void>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes

  constructor(
    private router: Router, 
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    // Reset error message
    this.errorMessage.set('');
    
    // Security checks
    if (!this.canAttemptLogin()) {
      return;
    }

    // Validation
    if (!this.validateForm()) {
      return;
    }

    // Start loading
    this.isLoading.set(true);
    this.loginAttempts++;

    const userData = {
      email: this.sanitizeInput(this.email.trim()),
      password: this.password
    };

    this.authService.loginUser(userData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.loginAttempts = 0;
          this.handleSuccessfulLogin(response);
          
          // 🔧 Décoder le token et rediriger selon le rôle
          const userRole = this.authService.getUserRoleFromToken(response.access);
          console.log(`🎯 Rôle détecté: ${userRole}`);
          this.handleRedirection(userRole);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.handleLoginError(error);
        }
      });
  }

  /**
   * Validate form inputs
   */
  private validateForm(): boolean {
    const errors: string[] = [];
    
    // Email validation
    if (!this.email.trim()) {
      errors.push('L\'email est requis');
    } else if (!this.isValidEmail(this.email)) {
      errors.push('Format d\'email invalide');
    }

    // Password validation
    if (!this.password) {
      errors.push('Le mot de passe est requis');
    } else if (this.password.length < 8) {
      errors.push('Le mot de passe doit contenir au moins 8 caractères');
    } else if (this.password.length > 128) {
      errors.push('Le mot de passe est trop long');
    }

    // Check for suspicious patterns
    if (this.hasSuspiciousPatterns(this.email)) {
      errors.push('Format d\'email suspect détecté');
    }

    if (errors.length > 0) {
      this.errorMessage.set(errors.join('. '));
      return false;
    }
    
    return true;
  }

  /**
   * Check if user can attempt login (rate limiting)
   */
  private canAttemptLogin(): boolean {
    const now = Date.now();
    
    // Reset attempts if outside time window
    if (now - this.lastAttemptTime > this.ATTEMPT_WINDOW) {
      this.loginAttempts = 0;
    }

    this.lastAttemptTime = now;

    if (this.loginAttempts >= this.MAX_ATTEMPTS) {
      const remainingTime = Math.ceil((this.ATTEMPT_WINDOW - (now - this.lastAttemptTime)) / 1000 / 60);
      this.errorMessage.set(`Trop de tentatives. Réessayez dans ${remainingTime} minutes`);
      return false;
    }

    return true;
  }

  /**
   * Handle successful login
   */
  private handleSuccessfulLogin(response: any): void {
    // Log security event
    this.logSecurityEvent('LOGIN_SUCCESS', this.email);
    
    // Store remember me preference securely
    if (this.rememberMe) {
      this.authService.setRememberMe(true);
    }

    console.log('✅ Login successful, preparing redirection...');
  }

  /**
   * Handle login errors
   */
  private handleLoginError(error: any): void {
    // Log security event
    this.logSecurityEvent('LOGIN_FAILED', this.email);
    
    const userMessage = this.getUserFriendlyError(error);
    this.errorMessage.set(userMessage);

    // Clear password on error for security
    this.password = '';
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  private getUserFriendlyError(error: any): string {
    if (!error) return 'Erreur inconnue';

    // Network errors
    if (error.status === 0) {
      return 'Erreur de connexion. Vérifiez votre connexion internet.';
    }

    // HTTP errors
    switch (error.status) {
      case 400:
        return 'Données de connexion invalides';
      case 401:
        return 'Email ou mot de passe incorrect';
      case 403:
        return 'Compte désactivé ou non autorisé';
      case 429:
        return 'Trop de tentatives. Veuillez réessayer plus tard.';
      case 500:
      case 502:
      case 503:
        return 'Service temporairement indisponible';
      default:
        return error.message || 'Erreur de connexion';
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  /**
   * Check for suspicious patterns (basic XSS/SQL injection attempts)
   */
  private hasSuspiciousPatterns(input: string): boolean {
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
      /javascript:/gi, // JavaScript protocol
      /on\w+\s*=/, // Event handlers
      /union\s+select/gi, // SQL injection
      /drop\s+table/gi, // SQL injection
      /--/, // SQL comments
      /\/\*.*\*\//, // SQL comments
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize user input
   */
  private sanitizeInput(input: string): string {
    return this.sanitizer.sanitize(SecurityContext.HTML, input) || '';
  }

  /**
   * Log security events (in production, send to logging service)
   */
  private logSecurityEvent(event: string, email: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event,
      email: this.maskEmail(email),
      userAgent: navigator.userAgent,
      ip: 'client-side' // In real app, get from backend
    };

    console.log('SECURITY_EVENT:', logEntry);
  }

  /**
   * Mask email for logging
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return 'invalid-email';
    
    const maskedLocal = local.length > 2 
      ? local.substring(0, 2) + '*'.repeat(local.length - 2)
      : '*'.repeat(local.length);
    
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Navigate to register page
   */
  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  /**
   * Navigate to forgot password page
   */
  goToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }

  /**
   * Redirige l'utilisateur selon son rôle
   * @param role - Rôle de l'utilisateur
   */
  private handleRedirection(role: string): void {
    const normalizedRole = role.toLowerCase();
    
    
    switch(normalizedRole) {
      case 'admin':
      case 'super_admin':
      case 'administrator':
        this.router.navigate(['/dashboard-admin/dashboard']);
        break;
      case 'client':
      case 'user':
      case 'customer':
        this.router.navigate(['/dashboard-client/dashboard']);
        break;
      case 'manager':
      case 'gestionnaire':
        this.router.navigate(['/dashboard-manager']);
        break;
      case 'printer':
      case 'imprimeur':
        this.router.navigate(['/dashboard-printer']);
        break;
      default:
        this.router.navigate(['/']);
        break;
    }
  }

  /**
   * Méthode de debug pour vérifier le token
   */
  debugToken(): void {
    this.authService.debugToken();
  }
}
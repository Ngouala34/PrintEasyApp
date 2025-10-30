import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment.prod';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { IAuthResponse, IRegisterResponse, IUserLogin, IUserLoginResponse, IUserRegister } from '../models/user';
import { Router } from '@angular/router';

// Interface pour le stockage sécurisé
interface SecureStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  clear(): void;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly REMEMBER_ME_KEY = 'remember_me';
  
  // Sujet pour gérer l'état de l'utilisateur courant
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser = this.currentUserSubject.asObservable();
  
  // Gestion du rafraîchissement automatique du token
  private tokenRefreshInterval: any;
  private readonly TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes avant expiration

  // Stockage sécurisé - initialisé dans le constructeur
  private storage!: SecureStorage;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.initializeStorage();
    this.initializeAuthState();
  }

  // ==================== MÉTHODES PRIVÉES ====================

  /**
   * Initialise le système de stockage sécurisé
   */
  private initializeStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Implémentation côté client avec localStorage
      this.storage = {
        get: (key: string): string | null => {
          try {
            return localStorage.getItem(key);
          } catch {
            return null;
          }
        },
        set: (key: string, value: string): void => {
          try {
            localStorage.setItem(key, value);
          } catch (error) {
            console.error('Erreur de stockage:', error);
          }
        },
        remove: (key: string): void => {
          try {
            localStorage.removeItem(key);
          } catch (error) {
            console.error('Erreur de suppression:', error);
          }
        },
        clear: (): void => {
          try {
            localStorage.clear();
          } catch (error) {
            console.error('Erreur de nettoyage:', error);
          }
        }
      };
    } else {
      // Implémentation côté serveur (mock)
      this.storage = {
        get: (): string | null => null,
        set: (): void => {},
        remove: (): void => {},
        clear: (): void => {}
      };
    }
  }

  /**
   * Initialise l'état d'authentification au démarrage de l'application
   */
  private initializeAuthState(): void {
    // Ne s'exécute que côté client
    if (!isPlatformBrowser(this.platformId)) return;

    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      // Token valide trouvé, restauration de l'utilisateur
      const user = this.getUserFromToken(token);
      this.currentUserSubject.next(user);
      this.scheduleTokenRefresh();
    } else if (token && this.isTokenExpired(token)) {
      // Token expiré trouvé, nettoyage
      this.clearTokens();
    }
  }

  /**
   * Gère la réponse d'authentification après login/register
   */
  private handleAuthentication(response: IUserLoginResponse): void {
    // Vérification de la présence des tokens
    if (response.access && response.refresh) {
      this.setTokens(response.access, response.refresh);
      const user = this.getUserFromToken(response.access);
      this.currentUserSubject.next(user);
      this.scheduleTokenRefresh();
      
      // Journalisation de l'événement de sécurité
      this.logSecurityEvent('AUTH_SUCCESS', user?.email ?? null);
    } else {
      throw new Error('Réponse d\'authentification invalide');
    }
  }

  /**
   * Stocke les tokens d'accès et de rafraîchissement de manière sécurisée
   */
// Dans AuthService
setTokens(accessToken: string, refreshToken: string): void {
  this.storage.set(this.TOKEN_KEY, accessToken);
  this.storage.set(this.REFRESH_TOKEN_KEY, refreshToken);
  this.scheduleTokenRefresh(); // Important pour la cohérence
}

  /**
   * Supprime tous les tokens et réinitialise l'état d'authentification
   */
  private clearTokens(): void {
    this.storage.remove(this.TOKEN_KEY);
    this.storage.remove(this.REFRESH_TOKEN_KEY);
    this.currentUserSubject.next(null);
    
    // Arrêt du rafraîchissement automatique
    if (this.tokenRefreshInterval) {
      clearTimeout(this.tokenRefreshInterval);
    }
  }

  /**
   * Crée les en-têtes HTTP sécurisés pour les requêtes d'authentification
   */
  private getSecurityHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    });

    // Ajout du token CSRF si disponible
    const csrfToken = this.getCsrfToken();
    if (csrfToken) {
      headers = headers.set('X-CSRF-TOKEN', csrfToken);
    }

    return headers;
  }

  /**
   * Récupère le token CSRF depuis le stockage
   */
  private getCsrfToken(): string | null {
    return this.storage.get('csrf_token');
  }

  /**
   * Nettoie et valide les données utilisateur avant envoi au serveur
   */
  private sanitizeUserData(data: any): any {
    const sanitized = { ...data };
    
    // Nettoyage de l'email
    if (sanitized.email) {
      sanitized.email = sanitized.email.trim().toLowerCase();
    }
    
    // Suppression des champs potentiellement dangereux
    delete sanitized.passwordConfirmation;
    delete sanitized._csrf;
    
    return sanitized;
  }

  /**
   * Décode un token JWT de manière sécurisée
   */
  private decodeJWT(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Format de token invalide');
      }

      const payload = parts[1];
      // Correction du Base64 URL
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      
      // Décodage Base64 avec gestion des caractères UTF-8
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
      
    } catch (error) {
      console.error('❌ Erreur de décodage JWT:', error);
      this.logSecurityEvent('TOKEN_DECODE_ERROR', null);
      return null;
    }
  }

  /**
   * Extrait les informations utilisateur depuis un token JWT
   */
  private getUserFromToken(token: string): any {
    const payload = this.decodeJWT(token);
    if (!payload) return null;

    // 🔧 CORRECTION : Support multiple pour les noms de rôle
    return {
      id: payload.user_id || payload.sub,
      email: payload.email,
      // Recherche du rôle dans différents champs possibles
      role: payload.role || payload.user_type || payload.user_role || payload.type,
      user_type: payload.user_type || payload.role, // Pour la compatibilité
      is_active: payload.is_active !== undefined ? payload.is_active : true,
      domain: payload.domain,
      name: payload.name,
      picture: payload.picture,
      exp: payload.exp,
      // Garder toutes les données du payload pour debug
      _raw: payload
    };
  }

  /**
   * Planifie le rafraîchissement automatique du token avant son expiration
   */
  private scheduleTokenRefresh(): void {
    // Nettoyage de l'intervalle existant
    if (this.tokenRefreshInterval) {
      clearTimeout(this.tokenRefreshInterval);
    }

    const token = this.getToken();
    if (!token) return;

    const payload = this.decodeJWT(token);
    if (!payload || !payload.exp) return;

    // Calcul du moment du rafraîchissement
    const expiration = payload.exp * 1000;
    const now = Date.now();
    const refreshTime = expiration - now - this.TOKEN_REFRESH_BUFFER;

    // Planification uniquement si le temps est positif
    if (refreshTime > 0) {
      this.tokenRefreshInterval = setTimeout(() => {
        this.refreshToken().subscribe();
      }, refreshTime);
    }
  }

  /**
   * Gère les erreurs d'authentification de manière centralisée
   */
  private handleAuthError(error: HttpErrorResponse): Observable<never> {
    // Journalisation de l'erreur
    this.logSecurityEvent('AUTH_ERROR', null, error);
    
    let userMessage = 'Erreur d\'authentification';
    
    // Messages d'erreur adaptés selon le statut HTTP
    if (error.status === 401) {
      userMessage = 'Identifiants invalides';
      this.clearTokens(); // Nettoyage des tokens en cas d'échec d'authentification
    } else if (error.status === 429) {
      userMessage = 'Trop de tentatives. Veuillez réessayer plus tard.';
    } else if (error.status >= 500) {
      userMessage = 'Service temporairement indisponible';
    }

    // Retourne l'erreur avec un message utilisateur
    return throwError(() => ({
      ...error,
      userMessage
    }));
  }

  /**
   * Journalise les événements de sécurité pour le monitoring
   */
  private logSecurityEvent(event: string, email: string | null, error?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event,
      email: email ? this.maskEmail(email) : null,
      userAgent: isPlatformBrowser(this.platformId) ? navigator.userAgent : 'server-side',
      error: error ? {
        status: error.status,
        message: error.message
      } : null
    };

    console.log('AUTH_SECURITY_EVENT:', logEntry);
  }

  /**
   * Masque partiellement un email pour la journalisation
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return 'invalid-email';
    
    const maskedLocal = local.length > 2 
      ? local.substring(0, 2) + '*'.repeat(local.length - 2)
      : '*'.repeat(local.length);
    
    return `${maskedLocal}@${domain}`;
  }

  // ==================== MÉTHODES PUBLIQUES ====================

  /**
   * Inscription d'un nouvel utilisateur
   */
  registerUser(data: IUserRegister): Observable<IRegisterResponse> {
    const sanitizedData = this.sanitizeUserData(data);
    
    return this.http.post<IRegisterResponse>(`${this.apiUrl}register/`, sanitizedData, {
      headers: this.getSecurityHeaders()
    }).pipe(
      catchError(error => this.handleAuthError(error))
    );
  }

  /**
   * Connexion d'un utilisateur existant
   */
  loginUser(data: IUserLogin): Observable<IUserLoginResponse> {
    const sanitizedData = this.sanitizeUserData(data);
    
    return this.http.post<IUserLoginResponse>(`${this.apiUrl}login/`, sanitizedData, {
      headers: this.getSecurityHeaders()
    }).pipe(
      tap(response => {
        this.handleAuthentication(response);
        
        // 🔧 Récupération du rôle pour logs
        const userRole = this.getUserRoleFromToken(response.access);
        console.log(`🔐 Utilisateur connecté avec rôle: ${userRole}`);
      }),
      catchError(error => this.handleAuthError(error))
    );
  }

  /**
   * Rafraîchit le token d'accès en utilisant le token de rafraîchissement
   */
  refreshToken(): Observable<IUserLoginResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('Aucun token de rafraîchissement disponible'));
    }

    return this.http.post<IUserLoginResponse>(`${this.apiUrl}refresh/`, {
      refresh_token: refreshToken
    }, {
      headers: this.getSecurityHeaders()
    }).pipe(
      tap(response => {
        this.setTokens(response.access, response.refresh);
        this.scheduleTokenRefresh();
        this.logSecurityEvent('TOKEN_REFRESH_SUCCESS', this.currentUserSubject.value?.email ?? null);
      }),
      catchError(error => {
        this.logSecurityEvent('TOKEN_REFRESH_FAILED', this.currentUserSubject.value?.email ?? null);
        this.logout(); // Déconnexion en cas d'échec
        return throwError(() => error);
      })
    );
  }

  /**
   * Vérifie si un token JWT est expiré
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeJWT(token);
      if (!payload || !payload.exp) return true;
      
      const expiration = payload.exp * 1000;
      const now = Date.now();
      const buffer = 5 * 60 * 1000; // Buffer de 5 minutes
      
      return now >= (expiration - buffer);
    } catch (error) {
      return true;
    }
  }

  /**
   * Récupère le token d'accès depuis le stockage
   */
  getToken(): string | null {
    return this.storage.get(this.TOKEN_KEY);
  }

  /**
   * Récupère le token de rafraîchissement depuis le stockage
   */
  getRefreshToken(): string | null {
    return this.storage.get(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Récupère l'utilisateur courant
   */
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  /**
   * Récupère le type d'utilisateur courant
   */
  getUserType(): string | null {
    const user = this.getCurrentUser();
    return user?.user_type || null;
  }

  /**
   * Récupère le rôle de l'utilisateur depuis le token stocké
   */
  getUserRole(): string {
    const token = this.getToken();
    if (!token) return 'guest';
    
    const user = this.getUserFromToken(token);
    return user?.role || user?.user_type || 'client';
  }

  /**
   * Décode un token et retourne le rôle (méthode publique pour les composants)
   */
  getUserRoleFromToken(token: string): string {
    const user = this.getUserFromToken(token);
    return user?.role || user?.user_type || 'client';
  }

  /**
   * Vérifie si un utilisateur est actuellement connecté
   */
  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  /**
   * Définit la préférence "Se souvenir de moi"
   */
  setRememberMe(remember: boolean): void {
    this.storage.set(this.REMEMBER_ME_KEY, remember.toString());
  }

  /**
   * Vérifie si l'option "Se souvenir de moi" est activée
   */
  shouldRememberMe(): boolean {
    return this.storage.get(this.REMEMBER_ME_KEY) === 'true';
  }

  /**
   * Déconnecte l'utilisateur et nettoie toutes les données de session
   */
  logout(): void {
    this.logSecurityEvent('LOGOUT', this.getCurrentUser()?.email ?? null);
    this.clearTokens();
    this.storage.remove(this.REMEMBER_ME_KEY);
    this.router.navigate(['/login']);
  }

  /**
   * Affiche les informations de debug du token
   */
  debugToken(): void {
    const token = this.getToken();
    if (!token) {
      console.log('❌ Aucun token trouvé');
      return;
    }
    
    const user = this.getUserFromToken(token);
    console.group('🔍 Debug Token JWT');
    console.log('📝 Token (tronqué):', token.substring(0, 50) + '...');
    console.log('👤 Utilisateur:', user);
    console.log('🎯 Rôle détecté:', this.getUserRole());
    console.log('🔍 Payload complet:', user?._raw);
    console.groupEnd();
  }


}
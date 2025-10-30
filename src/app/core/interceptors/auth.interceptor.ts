import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService) {
    console.log('🔄 AuthInterceptor initialisé');
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('🚀 INTERCEPTEUR ACTIVÉ - URL:', request.url);
    
    // Ajouter le token aux requêtes API (sauf login/register/refresh)
    if (this.shouldAddToken(request)) {
      const token = this.authService.getToken();
      console.log('🔑 Token disponible:', token ? 'OUI' : 'NON');
      
      if (token) {
        request = this.addToken(request, token);
        console.log('✅ Header Authorization AJOUTÉ');
        console.log('📨 Authorization Header:', request.headers.get('Authorization')?.substring(0, 30) + '...');
      }
    } else {
      console.log('➡️ URL exclue - Pas de token ajouté:', request.url);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log('❌ Erreur HTTP:', error.status, error.url);
        
        if (error.status === 401 && this.authService.getRefreshToken()) {
          console.log('🔄 Déclenchement rafraîchissement token...');
          return this.handle401Error(request, next);
        }
        
        return throwError(() => error);
      })
    );
  }

  private shouldAddToken(request: HttpRequest<any>): boolean {
    const excludedUrls = ['/login', '/register', '/refresh', '/auth/'];
    return !excludedUrls.some(url => request.url.includes(url));
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((response: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(response.access);
          
          // Retente la requête avec le nouveau token
          return next.handle(this.addToken(request, response.access));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          
          if (error.status === 401 || error.status === 403) {
            this.authService.logout();
          }
          
          return throwError(() => error);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => next.handle(this.addToken(request, token!)))
      );
    }
  }
}
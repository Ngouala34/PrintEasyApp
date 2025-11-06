// src/app/core/services/notification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { INotification } from '../models/order';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

    readonly apiUrl = environment.apiUrl;
  
  constructor(private http: HttpClient) {}



    getNotifications(): Observable<INotification[]> {
      return this.http.get<INotification[]>(`${this.apiUrl}notifications/list`).pipe(
        catchError(error => {
          console.error('Erreur API lors du chargement des commandes:', error);
          throw error;
        })
      );
    }


  // Marquer une notification comme lue
  markAsRead(notificationId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}notifications/${notificationId}/mark-read/`, {});
  }

  // Marquer toutes les notifications comme lues
  markAllAsRead(): Observable<any> {
    return this.http.patch(`${this.apiUrl}notifications/mark-all-read/`, {});
  }

  deleteNotification(notificationId: string): Observable<any> {
    // Implémentez l'appel API réel ici
    return of({ success: true });
  }

  clearAll(): Observable<any> {
    // Implémentez l'appel API réel ici
    return of({ success: true });
  }
}
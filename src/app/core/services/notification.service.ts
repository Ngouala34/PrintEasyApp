// src/app/core/services/notification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private http: HttpClient) {}

  markAsRead(notificationId: string): Observable<any> {
    // Implémentez l'appel API réel ici
    return of({ success: true });
  }

  markAllAsRead(): Observable<any> {
    // Implémentez l'appel API réel ici
    return of({ success: true });
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
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { IOrderData, IOrderResponse } from '../models/order';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  sendFile(data: IOrderData): Observable<IOrderResponse> {
    // Créer FormData pour l'envoi multipart
    const formData = new FormData();

    // 1. Ajouter les fichiers (champ 'document')
    data.files.forEach((file, index) => {
      formData.append('document', file.document, file.name);
    });

    // 2. Créer l'objet data selon le modèle OrderCreate
    // IMPORTANT: Utiliser exactement les mêmes noms de champs que l'API attend
    const orderData = {
      note: data.note || null,
      quantity: data.number_of_pages, // Certaines APIs utilisent 'quantity' au lieu de 'number_of_pages'
      number_of_pages: data.number_of_pages,
      document_type_name: data.document_type_name, // CE CHAMP EST OBLIGATOIRE
      option_format: data.option_format,
      option_color: data.option_color,
      option_paper: data.option_paper,
      option_sides: data.option_sides,
      option_delivery: data.option_delivery,
      option_finish: data.option_finish || '',
      option_binding: data.option_binding || '',
      delivery_city: data.delivery_city || null,
      delivery_neighborhood: data.delivery_neighborhood || null,
      delivery_address: data.delivery_address || null,
      delivery_phone: data.delivery_phone || null
    };

    console.log(' Données orderData:', orderData);

    // 3. Ajouter chaque champ individuellement dans FormData
    // Au lieu d'envoyer un JSON, on envoie chaque champ séparément
    Object.keys(orderData).forEach(key => {
      const value = orderData[key as keyof typeof orderData];
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // Debug: Vérifier le contenu de FormData
    console.log(' Contenu de FormData:');
    for (let pair of (formData as any).entries()) {
      console.log(pair[0] + ': ', pair[1]);
    }

    return this.http.post<IOrderResponse>(`${this.apiUrl}orders/`, formData).pipe(
      catchError(error => {
        console.error(' Erreur API détaillée:', error);
        console.error(' Réponse erreur:', error.error);
        throw error;
      })
    );
  }

  loadOrders(): Observable<IOrderResponse[]> {
    return this.http.get<IOrderResponse[]>(`${this.apiUrl}orders/`).pipe(
      catchError(error => {
        console.error('Erreur API lors du chargement des commandes:', error);
        throw error;
      })
    );
  }

  getOrderById(orderId: number | string): Observable<IOrderResponse> {
    return this.http.get<IOrderResponse>(`${this.apiUrl}/orders/${orderId}/`);
  }

  
}
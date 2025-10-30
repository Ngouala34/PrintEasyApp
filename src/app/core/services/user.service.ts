import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { IUserProfile } from '../models/user';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  readonly apiUrl = environment.apiUrl;


  constructor( private http : HttpClient, ) { }


  getProfile(): Observable<IUserProfile> {
    return this.http.get<IUserProfile>(`${this.apiUrl}profile/`).pipe(
      catchError(error => this.handleProfileError(error))
    );
  }

    private handleProfileError(error: any): Observable<never> {
    console.error('User API Error:', error);
    return throwError(() => new Error('Failed to load user profile'));
  }

}

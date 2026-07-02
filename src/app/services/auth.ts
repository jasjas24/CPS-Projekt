import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = 'http://localhost/cps-api';

  constructor(private http: HttpClient) {}

  registerKunde(kundenDaten: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register.php`, kundenDaten);
  }

  login(loginDaten: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login.php`, loginDaten);
  }

  // Signals für den globalen Zustand
  readonly isLoggedIn = signal<boolean>(false);
  readonly userRole = signal<string | null>(null);

  // Methode, die nach erfolgreichem Backend-Abruf aufgerufen wird
  setLoginState(role: string) {
    this.userRole.set(role);
    this.isLoggedIn.set(true);
  }

  logout() {
    this.userRole.set(null);
    this.isLoggedIn.set(false);
    // Hier ggf. Session-Tokens löschen
  }
}